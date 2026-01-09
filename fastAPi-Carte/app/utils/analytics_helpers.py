# app/utils/analytics_helpers.py
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
from bson import ObjectId
import asyncio


class AnalyticsProcessor:
    """Process analytics data from MongoDB collections"""
    
    @staticmethod
    async def process_financial_report(
        orders: List[Dict[str, Any]],
        foods: List[Dict[str, Any]],
        inventory: List[Dict[str, Any]],
        customers: List[Dict[str, Any]],
        employees: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Process financial report from real data"""
        total_revenue = 0
        total_cost = 0
        total_orders = len(orders)
        
        # Data structures
        item_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0, "cost": 0})
        customer_spending = defaultdict(lambda: {"total": 0, "orders": 0})
        employee_performance = defaultdict(lambda: {"orders": 0, "revenue": 0})
        payment_methods = defaultdict(float)
        daily_revenue = defaultdict(float)
        
        # Food lookup dictionary
        food_dict = {str(food["_id"]): food for food in foods}
        
        # Process orders
        for order in orders:
            if order.get("status") == "cancelled":
                continue
                
            order_revenue = order.get("total_amount", 0)
            order_date = order.get("created_at")
            
            # Parse date
            date_key = AnalyticsProcessor._parse_date_key(order_date)
            
            # Accumulate metrics
            total_revenue += order_revenue
            daily_revenue[date_key] += order_revenue
            
            # Payment method
            payment_method = order.get("payment_method", "unknown")
            payment_methods[payment_method] += order_revenue
            
            # Customer spending
            customer_id = order.get("customer_id")
            if customer_id:
                customer_spending[customer_id]["total"] += order_revenue
                customer_spending[customer_id]["orders"] += 1
            
            # Employee performance
            emp_id = order.get("employee_id")
            if emp_id:
                employee_performance[emp_id]["orders"] += 1
                employee_performance[emp_id]["revenue"] += order_revenue
            
            # Item sales
            for item in order.get("items", []):
                food_id = item.get("food_id")
                quantity = item.get("quantity", 0)
                price = item.get("price", 0)
                sub_total = item.get("sub_total", 0)
                
                item_sales[food_id]["quantity"] += quantity
                item_sales[food_id]["revenue"] += sub_total
                
                # Calculate cost from food data
                food = food_dict.get(food_id)
                if food and food.get("unit_cost"):
                    item_cost = food["unit_cost"] * quantity
                    item_sales[food_id]["cost"] += item_cost
                    total_cost += item_cost
        
        # Calculate derived metrics
        gross_profit = total_revenue - total_cost
        gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_cost": total_cost,
            "gross_profit": gross_profit,
            "gross_margin": gross_margin,
            "avg_order_value": avg_order_value,
            "item_sales": dict(item_sales),
            "customer_spending": dict(customer_spending),
            "employee_performance": dict(employee_performance),
            "payment_methods": dict(payment_methods),
            "daily_revenue": dict(daily_revenue),
            "orders": orders
        }
    
    @staticmethod
    async def process_daily_sales(
        orders: List[Dict[str, Any]],
        date_str: str
    ) -> Dict[str, Any]:
        """Process daily sales report"""
        target_date = datetime.fromisoformat(date_str + "T00:00:00")
        
        # Filter orders for the target date
        daily_orders = []
        hourly_data = defaultdict(lambda: {"revenue": 0, "orders": 0})
        status_counts = defaultdict(int)
        payment_methods = defaultdict(float)
        
        for order in orders:
            order_date = AnalyticsProcessor._parse_datetime(order.get("created_at"))
            if order_date and order_date.date() == target_date.date():
                daily_orders.append(order)
                
                order_revenue = order.get("total_amount", 0)
                order_hour = order_date.hour
                
                hourly_data[order_hour]["revenue"] += order_revenue
                hourly_data[order_hour]["orders"] += 1
                
                status = order.get("status", "unknown")
                status_counts[status] += 1
                
                payment_method = order.get("payment_method", "unknown")
                payment_methods[payment_method] += order_revenue
        
        # Calculate totals
        total_revenue = sum(hourly_data[h]["revenue"] for h in hourly_data)
        total_orders = len(daily_orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Format hourly data
        hourly_list = []
        for hour in range(24):
            data = hourly_data[hour]
            hourly_list.append({
                "hour": f"{hour:02d}:00",
                "revenue": data["revenue"],
                "orders": data["orders"],
                "avg_order_value": data["revenue"] / data["orders"] if data["orders"] > 0 else 0
            })
        
        # Find peak hour
        peak_hour_data = max(hourly_list, key=lambda x: x["revenue"]) if hourly_list else None
        
        return {
            "date": date_str,
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "average_order_value": avg_order_value,
            "hourly_breakdown": hourly_list,
            "status_breakdown": dict(status_counts),
            "payment_method_breakdown": dict(payment_methods),
            "peak_hour": peak_hour_data
        }
    
    @staticmethod
    async def process_inventory_report(
        inventory: List[Dict[str, Any]],
        threshold: float = 0.3
    ) -> Dict[str, Any]:
        """Process inventory report"""
        total_value = 0
        low_stock = []
        out_of_stock = []
        slow_moving = []
        
        for product in inventory:
            current_stock = product.get("quantity_in_stock", 0)
            reorder_level = product.get("reorder_level", 0)
            unit_cost = product.get("unit_cost", 0)
            
            # Calculate product value
            product_value = current_stock * unit_cost
            total_value += product_value
            
            # Check stock status
            if current_stock <= 0:
                out_of_stock.append({
                    "id": str(product["_id"]),
                    "name": product.get("name"),
                    "current_stock": current_stock,
                    "reorder_level": reorder_level,
                    "last_restocked": product.get("last_restocked_at"),
                    "value": product_value
                })
            elif current_stock <= reorder_level * threshold:
                low_stock.append({
                    "id": str(product["_id"]),
                    "name": product.get("name"),
                    "current_stock": current_stock,
                    "reorder_level": reorder_level,
                    "percentage": (current_stock / reorder_level) * 100 if reorder_level > 0 else 0,
                    "value": product_value
                })
            
            # Check for slow-moving items
            last_restocked = product.get("last_restocked_at")
            if last_restocked:
                days_since_restock = AnalyticsProcessor._days_since_date(last_restocked)
                if days_since_restock > 90:
                    slow_moving.append({
                        "id": str(product["_id"]),
                        "name": product.get("name"),
                        "days_since_restock": days_since_restock,
                        "current_stock": current_stock,
                        "value": product_value
                    })
        
        # Sort lists
        low_stock.sort(key=lambda x: x["percentage"])
        out_of_stock.sort(key=lambda x: x.get("last_restocked") or "", reverse=True)
        slow_moving.sort(key=lambda x: x["days_since_restock"], reverse=True)
        
        return {
            "total_items": len(inventory),
            "total_inventory_value": total_value,
            "low_stock_items": {
                "count": len(low_stock),
                "items": low_stock[:20]
            },
            "out_of_stock_items": {
                "count": len(out_of_stock),
                "items": out_of_stock[:20]
            },
            "slow_moving_items": {
                "count": len(slow_moving),
                "items": slow_moving[:20]
            }
        }
    
    @staticmethod
    async def process_employee_performance(
        orders: List[Dict[str, Any]],
        employees: List[Dict[str, Any]],
        timesheets: List[Dict[str, Any]],
        shifts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Process employee performance report"""
        performance_data = []
        
        # Employee lookup
        employee_dict = {str(emp["_id"]): emp for emp in employees}
        
        # Group orders by employee
        employee_orders = defaultdict(list)
        for order in orders:
            emp_id = order.get("employee_id")
            if emp_id:
                employee_orders[emp_id].append(order)
        
        # Process each employee
        for emp_id, emp_orders in employee_orders.items():
            employee = employee_dict.get(emp_id)
            if not employee:
                continue
            
            # Calculate order metrics
            total_orders = len(emp_orders)
            total_revenue = sum(o.get("total_amount", 0) for o in emp_orders)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            
            # Get timesheet data
            emp_timesheets = [ts for ts in timesheets if ts.get("employee_id") == emp_id]
            total_hours = sum(
                AnalyticsProcessor._calculate_hours_worked(ts.get("clock_in"), ts.get("clock_out"))
                for ts in emp_timesheets
            )
            
            # Get shift data
            emp_shifts = [s for s in shifts if s.get("employee_id") == emp_id]
            scheduled_hours = sum(
                AnalyticsProcessor._calculate_shift_hours(s.get("start"), s.get("end"))
                for s in emp_shifts
            )
            
            # Calculate efficiency metrics
            revenue_per_hour = total_revenue / total_hours if total_hours > 0 else 0
            orders_per_hour = total_orders / total_hours if total_hours > 0 else 0
            attendance_rate = (total_hours / scheduled_hours * 100) if scheduled_hours > 0 else 0
            
            performance_data.append({
                "employee_id": emp_id,
                "name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip(),
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "average_order_value": avg_order_value,
                "hours_worked": round(total_hours, 2),
                "revenue_per_hour": round(revenue_per_hour, 2),
                "orders_per_hour": round(orders_per_hour, 2),
                "scheduled_hours": round(scheduled_hours, 2),
                "attendance_rate": round(attendance_rate, 1),
                "shifts_worked": len(emp_shifts),
                "timesheet_entries": len(emp_timesheets)
            })
        
        # Sort by revenue
        performance_data.sort(key=lambda x: x["total_revenue"], reverse=True)
        
        return {
            "employee_performance": performance_data,
            "averages": {
                "revenue_per_hour": round(
                    sum(p["revenue_per_hour"] for p in performance_data) / len(performance_data), 2
                ) if performance_data else 0,
                "attendance_rate": round(
                    sum(p["attendance_rate"] for p in performance_data) / len(performance_data), 1
                ) if performance_data else 0,
                "orders_per_hour": round(
                    sum(p["orders_per_hour"] for p in performance_data) / len(performance_data), 2
                ) if performance_data else 0
            },
            "top_performers": performance_data[:5] if performance_data else []
        }
    
    @staticmethod
    async def process_dashboard_analytics(
        orders: List[Dict[str, Any]],
        customers: List[Dict[str, Any]],
        employees: List[Dict[str, Any]],
        inventory: List[Dict[str, Any]],
        period: str = "week"
    ) -> Dict[str, Any]:
        """Process dashboard analytics"""
        # Calculate date range
        end_date = datetime.utcnow()
        if period == "day":
            start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "week":
            start_date = end_date - timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "quarter":
            start_date = end_date - timedelta(days=90)
        else:  # year
            start_date = end_date - timedelta(days=365)
        
        # Filter orders for period
        period_orders = [
            order for order in orders
            if AnalyticsProcessor._is_in_period(order.get("created_at"), start_date, end_date)
        ]
        
        # Calculate KPIs
        total_revenue = sum(o.get("total_amount", 0) for o in period_orders)
        total_orders = len(period_orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Customer metrics
        active_customers = len(set(
            o.get("customer_id") for o in period_orders if o.get("customer_id")
        ))
        total_customers = len(customers)
        customer_growth = (active_customers / total_customers * 100) if total_customers > 0 else 0
        
        # Employee metrics
        active_employees = len(set(
            o.get("employee_id") for o in period_orders if o.get("employee_id")
        ))
        
        # Inventory metrics
        inventory_value = sum(p.get("quantity_in_stock", 0) * p.get("unit_cost", 0) for p in inventory)
        low_stock_items = [p for p in inventory if p.get("quantity_in_stock", 0) <= p.get("reorder_level", 0)]
        
        # Hourly performance for today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders = [
            o for o in orders
            if AnalyticsProcessor._is_in_period(o.get("created_at"), today_start, end_date)
        ]
        
        hourly_performance = defaultdict(lambda: {"revenue": 0, "orders": 0})
        for order in today_orders:
            order_date = AnalyticsProcessor._parse_datetime(order.get("created_at"))
            if order_date:
                hour = order_date.hour
                hourly_performance[hour]["revenue"] += order.get("total_amount", 0)
                hourly_performance[hour]["orders"] += 1
        
        # Format hourly data
        hourly_data = []
        for hour in range(24):
            data = hourly_performance[hour]
            hourly_data.append({
                "hour": hour,
                "revenue": data["revenue"],
                "orders": data["orders"]
            })
        
        # Top items
        item_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0})
        for order in period_orders:
            for item in order.get("items", []):
                item_name = item.get("name", "Unknown")
                item_sales[item_name]["quantity"] += item.get("quantity", 0)
                item_sales[item_name]["revenue"] += item.get("sub_total", 0)
        
        top_items = sorted(
            [{"name": k, **v} for k, v in item_sales.items()],
            key=lambda x: x["revenue"],
            reverse=True
        )[:5]
        
        # Payment methods
        payment_methods = defaultdict(float)
        for order in period_orders:
            method = order.get("payment_method", "unknown")
            payment_methods[method] += order.get("total_amount", 0)
        
        return {
            "period": {
                "type": period,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "kpis": {
                "total_revenue": total_revenue,
                "total_orders": total_orders,
                "average_order_value": avg_order_value,
                "active_customers": active_customers,
                "customer_growth_rate": round(customer_growth, 1),
                "active_employees": active_employees,
                "inventory_value": inventory_value,
                "low_stock_items": len(low_stock_items)
            },
            "hourly_performance": hourly_data,
            "top_items": top_items,
            "payment_methods": dict(payment_methods),
            "peak_hour": max(hourly_data, key=lambda x: x["revenue"]) if hourly_data else None
        }
    
    # Helper methods
    @staticmethod
    def _parse_date_key(date_value) -> str:
        """Parse date value to string key"""
        if isinstance(date_value, datetime):
            return date_value.strftime("%Y-%m-%d")
        elif isinstance(date_value, str):
            try:
                return datetime.fromisoformat(date_value.replace('Z', '+00:00')).strftime("%Y-%m-%d")
            except:
                return "unknown"
        return "unknown"
    
    @staticmethod
    def _parse_datetime(date_value) -> Optional[datetime]:
        """Parse date value to datetime"""
        if isinstance(date_value, datetime):
            return date_value
        elif isinstance(date_value, str):
            try:
                return datetime.fromisoformat(date_value.replace('Z', '+00:00'))
            except:
                return None
        return None
    
    @staticmethod
    def _days_since_date(date_value) -> int:
        """Calculate days since given date"""
        date = AnalyticsProcessor._parse_datetime(date_value)
        if not date:
            return 0
        return (datetime.utcnow() - date).days
    
    @staticmethod
    def _calculate_hours_worked(clock_in, clock_out) -> float:
        """Calculate hours worked from timesheet"""
        start = AnalyticsProcessor._parse_datetime(clock_in)
        end = AnalyticsProcessor._parse_datetime(clock_out) or datetime.utcnow()
        
        if not start:
            return 0
        
        hours = (end - start).total_seconds() / 3600
        return max(0, hours)
    
    @staticmethod
    def _calculate_shift_hours(start_str, end_str) -> float:
        """Calculate shift hours"""
        start = AnalyticsProcessor._parse_datetime(start_str)
        end = AnalyticsProcessor._parse_datetime(end_str)
        
        if not start or not end:
            return 0
        
        hours = (end - start).total_seconds() / 3600
        return max(0, hours)
    
    @staticmethod
    def _is_in_period(date_value, start_date, end_date) -> bool:
        """Check if date is within period"""
        date = AnalyticsProcessor._parse_datetime(date_value)
        if not date:
            return False
        return start_date <= date <= end_date