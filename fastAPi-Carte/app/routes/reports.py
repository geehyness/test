# app/routes/reports.py - UPDATED VERSION WITH TEST ENDPOINTS
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import get_collection
from app.models.response import StandardResponse, SuccessResponse, ErrorResponse
from app.utils.response_helpers import success_response, error_response, handle_generic_exception
import asyncio
from collections import defaultdict

router = APIRouter(prefix="/api", tags=["reports"])

# ==================== TEST ENDPOINTS - ADDED FIRST ====================

@router.get("/reports/test")
async def test_reports_endpoint():
    """Test endpoint to verify reports API is working"""
    return {
        "code": 200,
        "message": "Reports API test endpoint is working",
        "data": {
            "timestamp": datetime.utcnow().isoformat(),
            "status": "ok",
            "route": "/api/reports/test",
            "endpoints_available": [
                "/api/reports/test",
                "/api/reports/financial/simple",
                "/api/reports/financial",
                "/api/reports/sales/daily",
                "/api/reports/inventory",
                "/api/reports/employee/performance",
                "/api/reports/customer/analysis",
                "/api/analytics/dashboard",
                "/api/analytics/realtime",
                "/api/analytics/predictive",
                "/api/analytics/comparative"
            ]
        }
    }

@router.get("/reports/financial/simple")
async def get_simple_financial_report(
    start_date: str = Query("2024-01-01", description="Start date in YYYY-MM-DD format"),
    end_date: str = Query("2024-12-31", description="End date in YYYY-MM-DD format"),
    store_id: Optional[str] = Query(None)
):
    """Simple financial report for testing"""
    try:
        # Simple test data
        report_data = {
            "period": {
                "start_date": start_date,
                "end_date": end_date,
                "days": 365
            },
            "summary": {
                "total_revenue": 125000.50,
                "total_orders": 1250,
                "total_cost": 62500.25,
                "gross_profit": 62500.25,
                "gross_margin": 50.0,
                "average_order_value": 100.00,
                "inventory_value": 15000.00
            },
            "payment_methods": {
                "cash": 50000.00,
                "card": 60000.00,
                "online": 15000.50
            },
            "top_items": [
                {"name": "Burger", "revenue": 25000.00, "quantity": 500},
                {"name": "Pizza", "revenue": 20000.00, "quantity": 400},
                {"name": "Fries", "revenue": 15000.00, "quantity": 1500}
            ],
            "test_data": True,
            "store_id": store_id,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return success_response(
            data=report_data,
            message="Simple financial report generated successfully"
        )
        
    except Exception as e:
        return error_response(
            message=f"Error generating simple report: {str(e)}",
            code=500
        )

# ==================== ORIGINAL ENDPOINTS ====================

# ----------------------------------------------------
# --- Financial Reports Endpoints ---
# ----------------------------------------------------

@router.get("/reports/financial", response_model=StandardResponse[dict])
async def get_financial_report(
    start_date: str = Query(..., description="Start date in ISO format"),
    end_date: str = Query(..., description="End date in ISO format"),
    store_id: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Generate comprehensive financial report"""
    try:
        # Parse dates
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            return error_response(message="Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)", code=400)
        
        # Build query
        query = {
            "created_at": {
                "$gte": start_dt,
                "$lte": end_dt
            }
        }
        
        # Add filters
        if store_id:
            query["store_id"] = store_id
        if employee_id:
            query["employee_id"] = employee_id
        if payment_method:
            query["payment_method"] = payment_method
        if status:
            query["status"] = status
        
        # Get collections
        orders_collection = get_collection("orders")
        foods_collection = get_collection("foods")
        customers_collection = get_collection("customers")
        employees_collection = get_collection("employees")
        inventory_collection = get_collection("inventory_products")
        
        # Fetch orders
        orders = await orders_collection.find(query).to_list()
        
        # Calculate basic metrics
        total_revenue = 0
        total_orders = len(orders)
        total_cost = 0
        item_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0, "cost": 0})
        customer_spending = defaultdict(lambda: {"total": 0, "orders": 0})
        employee_performance = defaultdict(lambda: {"orders": 0, "revenue": 0})
        payment_methods = defaultdict(float)
        daily_revenue = defaultdict(float)
        
        # Process each order
        for order in orders:
            if order.get("status") == "cancelled":
                continue
                
            order_revenue = order.get("total_amount", 0)
            order_date = order.get("created_at")
            
            if isinstance(order_date, datetime):
                date_key = order_date.strftime("%Y-%m-%d")
            else:
                try:
                    date_key = datetime.fromisoformat(str(order_date)).strftime("%Y-%m-%d")
                except:
                    date_key = "unknown"
            
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
                
                # Calculate cost from recipes
                food = await foods_collection.find_one({"_id": ObjectId(food_id)})
                if food and food.get("recipes"):
                    for recipe in food["recipes"]:
                        inv_product = await inventory_collection.find_one(
                            {"_id": ObjectId(recipe.get("inventory_product_id"))}
                        )
                        if inv_product:
                            unit_cost = inv_product.get("unit_cost", 0)
                            quantity_used = recipe.get("quantity_used", 0)
                            item_cost = unit_cost * quantity_used * quantity
                            item_sales[food_id]["cost"] += item_cost
                            total_cost += item_cost
        
        # Calculate derived metrics
        gross_profit = total_revenue - total_cost
        gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Get top items
        top_items = []
        for food_id, data in item_sales.items():
            food = await foods_collection.find_one({"_id": ObjectId(food_id)})
            top_items.append({
                "id": food_id,
                "name": food.get("name", f"Item {food_id[:8]}") if food else f"Item {food_id[:8]}",
                "quantity": data["quantity"],
                "revenue": data["revenue"],
                "cost": data["cost"],
                "profit": data["revenue"] - data["cost"],
                "category_id": food.get("category_id") if food else None
            })
        
        # Sort and limit top items
        top_items.sort(key=lambda x: x["revenue"], reverse=True)
        top_items = top_items[:10]
        
        # Get top customers
        top_customers = []
        for customer_id, data in customer_spending.items():
            customer = await customers_collection.find_one({"_id": ObjectId(customer_id)})
            top_customers.append({
                "id": customer_id,
                "name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip() 
                        if customer else f"Customer {customer_id[:8]}",
                "total_spent": data["total"],
                "orders": data["orders"],
                "avg_spend": data["total"] / data["orders"] if data["orders"] > 0 else 0
            })
        
        top_customers.sort(key=lambda x: x["total_spent"], reverse=True)
        top_customers = top_customers[:10]
        
        # Get employee performance
        employee_perf_data = []
        for emp_id, data in employee_performance.items():
            employee = await employees_collection.find_one({"_id": ObjectId(emp_id)})
            employee_perf_data.append({
                "id": emp_id,
                "name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
                        if employee else f"Employee {emp_id[:8]}",
                "orders_processed": data["orders"],
                "total_sales": data["revenue"],
                "avg_order_value": data["revenue"] / data["orders"] if data["orders"] > 0 else 0
            })
        
        employee_perf_data.sort(key=lambda x: x["total_sales"], reverse=True)
        
        # Get inventory metrics
        inventory_products = await inventory_collection.find().to_list()
        inventory_value = sum(p.get("quantity_in_stock", 0) * p.get("unit_cost", 0) for p in inventory_products)
        low_stock_items = [p for p in inventory_products if p.get("quantity_in_stock", 0) <= p.get("reorder_level", 0)]
        
        # Calculate daily metrics
        daily_data = []
        for date_str, revenue in sorted(daily_revenue.items()):
            daily_orders = [o for o in orders if (
                (isinstance(o.get("created_at"), datetime) and o["created_at"].strftime("%Y-%m-%d") == date_str) or
                (isinstance(o.get("created_at"), str) and o["created_at"].startswith(date_str))
            )]
            
            daily_data.append({
                "date": date_str,
                "revenue": revenue,
                "orders": len(daily_orders),
                "avg_order_value": revenue / len(daily_orders) if len(daily_orders) > 0 else 0
            })
        
        # Prepare response
        report_data = {
            "period": {
                "start_date": start_dt.isoformat(),
                "end_date": end_dt.isoformat(),
                "days": (end_dt - start_dt).days + 1
            },
            "summary": {
                "total_revenue": total_revenue,
                "total_orders": total_orders,
                "total_cost": total_cost,
                "gross_profit": gross_profit,
                "gross_margin": gross_margin,
                "average_order_value": avg_order_value,
                "inventory_value": inventory_value
            },
            "payment_methods": dict(payment_methods),
            "daily_performance": daily_data,
            "top_items": top_items,
            "top_customers": top_customers,
            "employee_performance": employee_perf_data,
            "inventory_metrics": {
                "total_value": inventory_value,
                "low_stock_count": len(low_stock_items),
                "low_stock_items": [
                    {
                        "id": str(p["_id"]),
                        "name": p.get("name"),
                        "current_stock": p.get("quantity_in_stock", 0),
                        "reorder_level": p.get("reorder_level", 0)
                    }
                    for p in low_stock_items[:10]
                ]
            },
            "filters": {
                "store_id": store_id,
                "employee_id": employee_id,
                "category_id": category_id,
                "payment_method": payment_method,
                "status": status
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return success_response(data=report_data, message="Financial report generated successfully")
        
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/reports/sales/daily", response_model=StandardResponse[dict])
async def get_daily_sales_report(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    store_id: Optional[str] = Query(None)
):
    """Get detailed daily sales report"""
    try:
        # Parse date
        try:
            target_date = datetime.fromisoformat(date + "T00:00:00")
        except ValueError:
            return error_response(message="Invalid date format. Use YYYY-MM-DD", code=400)
        
        start_dt = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Build query
        query = {
            "created_at": {
                "$gte": start_dt,
                "$lte": end_dt
            }
        }
        if store_id:
            query["store_id"] = store_id
        
        orders_collection = get_collection("orders")
        orders = await orders_collection.find(query).to_list()
        
        # Calculate hourly breakdown
        hourly_data = defaultdict(lambda: {"revenue": 0, "orders": 0})
        
        for order in orders:
            order_date = order.get("created_at")
            if isinstance(order_date, datetime):
                hour = order_date.hour
            else:
                try:
                    hour = datetime.fromisoformat(str(order_date)).hour
                except:
                    hour = 0
            
            hourly_data[hour]["revenue"] += order.get("total_amount", 0)
            hourly_data[hour]["orders"] += 1
        
        # Sort hourly data
        hourly_list = []
        for hour in range(24):
            data = hourly_data[hour]
            hourly_list.append({
                "hour": f"{hour:02d}:00",
                "revenue": data["revenue"],
                "orders": data["orders"],
                "avg_order_value": data["revenue"] / data["orders"] if data["orders"] > 0 else 0
            })
        
        # Calculate metrics
        total_revenue = sum(h["revenue"] for h in hourly_list)
        total_orders = sum(h["orders"] for h in hourly_list)
        
        # Get status breakdown
        status_counts = defaultdict(int)
        for order in orders:
            status = order.get("status", "unknown")
            status_counts[status] += 1
        
        # Get payment method breakdown
        payment_methods = defaultdict(float)
        for order in orders:
            method = order.get("payment_method", "unknown")
            payment_methods[method] += order.get("total_amount", 0)
        
        response_data = {
            "date": date,
            "store_id": store_id,
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "average_order_value": total_revenue / total_orders if total_orders > 0 else 0,
            "hourly_breakdown": hourly_list,
            "status_breakdown": dict(status_counts),
            "payment_method_breakdown": dict(payment_methods),
            "peak_hour": max(hourly_list, key=lambda x: x["revenue"]) if hourly_list else None
        }
        
        return success_response(data=response_data)
        
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/reports/inventory", response_model=StandardResponse[dict])
async def get_inventory_report(
    threshold: float = Query(0.3, description="Low stock threshold as percentage of reorder level"),
    store_id: Optional[str] = Query(None)
):
    """Generate inventory report with stock analysis"""
    try:
        inventory_collection = get_collection("inventory_products")
        
        # Build query
        query = {}
        if store_id:
            query["store_id"] = store_id
        
        products = await inventory_collection.find(query).to_list()
        
        # Calculate metrics
        total_value = 0
        low_stock = []
        out_of_stock = []
        slow_moving = []
        
        for product in products:
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
            
            # Check for slow-moving items (not restocked in last 90 days)
            last_restocked = product.get("last_restocked_at")
            if last_restocked:
                try:
                    if isinstance(last_restocked, str):
                        last_date = datetime.fromisoformat(last_restocked.replace('Z', '+00:00'))
                    else:
                        last_date = last_restocked
                    
                    days_since_restock = (datetime.utcnow() - last_date).days
                    if days_since_restock > 90:
                        slow_moving.append({
                            "id": str(product["_id"]),
                            "name": product.get("name"),
                            "days_since_restock": days_since_restock,
                            "current_stock": current_stock,
                            "value": product_value
                        })
                except:
                    pass
        
        # Sort lists
        low_stock.sort(key=lambda x: x["percentage"])
        out_of_stock.sort(key=lambda x: x["last_restocked"] or "", reverse=True)
        slow_moving.sort(key=lambda x: x["days_since_restock"], reverse=True)
        
        response_data = {
            "total_items": len(products),
            "total_inventory_value": total_value,
            "low_stock_items": {
                "count": len(low_stock),
                "items": low_stock[:20]  # Limit to top 20
            },
            "out_of_stock_items": {
                "count": len(out_of_stock),
                "items": out_of_stock[:20]
            },
            "slow_moving_items": {
                "count": len(slow_moving),
                "items": slow_moving[:20]
            },
            "store_id": store_id,
            "threshold_percentage": threshold * 100
        }
        
        return success_response(data=response_data)
        
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/reports/employee/performance", response_model=StandardResponse[dict])
async def get_employee_performance_report(
    start_date: str = Query(..., description="Start date in ISO format"),
    end_date: str = Query(..., description="End date in ISO format"),
    store_id: Optional[str] = Query(None)
):
    """Generate employee performance report"""
    try:
        # Parse dates
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            return error_response(message="Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)", code=400)
        
        # Build query for orders
        query = {
            "created_at": {
                "$gte": start_dt,
                "$lte": end_dt
            }
        }
        if store_id:
            query["store_id"] = store_id
        
        orders_collection = get_collection("orders")
        employees_collection = get_collection("employees")
        timesheets_collection = get_collection("timesheet_entries")
        
        # Get all employees for the store
        employee_query = {}
        if store_id:
            employee_query["store_id"] = store_id
        
        employees = await employees_collection.find(employee_query).to_list()
        
        # Get orders for the period
        orders = await orders_collection.find(query).to_list()
        
        # Initialize performance tracking
        performance_data = []
        
        for employee in employees:
            emp_id = str(employee["_id"])
            
            # Get employee's orders
            emp_orders = [o for o in orders if o.get("employee_id") == emp_id]
            
            # Calculate order metrics
            total_orders = len(emp_orders)
            total_revenue = sum(o.get("total_amount", 0) for o in emp_orders)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            
            # Get timesheet data
            timesheets = await timesheets_collection.find({
                "employee_id": emp_id,
                "clock_in": {"$gte": start_dt, "$lte": end_dt}
            }).to_list()
            
            # Calculate hours worked
            total_hours = 0
            for ts in timesheets:
                clock_in = ts.get("clock_in")
                clock_out = ts.get("clock_out") or datetime.utcnow()
                
                if isinstance(clock_in, str):
                    clock_in = datetime.fromisoformat(clock_in.replace('Z', '+00:00'))
                if isinstance(clock_out, str):
                    clock_out = datetime.fromisoformat(clock_out.replace('Z', '+00:00'))
                
                hours_worked = (clock_out - clock_in).total_seconds() / 3600
                total_hours += hours_worked
            
            # Calculate efficiency metrics
            revenue_per_hour = total_revenue / total_hours if total_hours > 0 else 0
            orders_per_hour = total_orders / total_hours if total_hours > 0 else 0
            
            # Get shift data
            shifts_collection = get_collection("shifts")
            shifts = await shifts_collection.find({
                "employee_id": emp_id,
                "start": {"$gte": start_dt, "$lte": end_dt}
            }).to_list()
            
            scheduled_hours = sum(
                (datetime.fromisoformat(s["end"].replace('Z', '+00:00')) - 
                 datetime.fromisoformat(s["start"].replace('Z', '+00:00'))).total_seconds() / 3600
                for s in shifts if s.get("start") and s.get("end")
            )
            
            attendance_rate = (total_hours / scheduled_hours * 100) if scheduled_hours > 0 else 0
            
            # Add to performance data
            performance_data.append({
                "employee_id": emp_id,
                "name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip(),
                "position": employee.get("job_title_id", ""),
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "average_order_value": avg_order_value,
                "hours_worked": round(total_hours, 2),
                "revenue_per_hour": round(revenue_per_hour, 2),
                "orders_per_hour": round(orders_per_hour, 2),
                "scheduled_hours": round(scheduled_hours, 2),
                "attendance_rate": round(attendance_rate, 1),
                "shifts_worked": len(shifts),
                "timesheet_entries": len(timesheets)
            })
        
        # Sort by revenue
        performance_data.sort(key=lambda x: x["total_revenue"], reverse=True)
        
        # Calculate averages
        if performance_data:
            avg_revenue_per_hour = sum(p["revenue_per_hour"] for p in performance_data) / len(performance_data)
            avg_attendance_rate = sum(p["attendance_rate"] for p in performance_data) / len(performance_data)
            avg_orders_per_hour = sum(p["orders_per_hour"] for p in performance_data) / len(performance_data)
        else:
            avg_revenue_per_hour = avg_attendance_rate = avg_orders_per_hour = 0
        
        response_data = {
            "period": {
                "start_date": start_dt.isoformat(),
                "end_date": end_dt.isoformat(),
                "days": (end_dt - start_dt).days + 1
            },
            "store_id": store_id,
            "total_employees": len(performance_data),
            "averages": {
                "revenue_per_hour": round(avg_revenue_per_hour, 2),
                "attendance_rate": round(avg_attendance_rate, 1),
                "orders_per_hour": round(avg_orders_per_hour, 2)
            },
            "employee_performance": performance_data,
            "top_performers": performance_data[:5],
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return success_response(data=response_data)
        
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/reports/customer/analysis", response_model=StandardResponse[dict])
async def get_customer_analysis_report(
    start_date: str = Query(..., description="Start date in ISO format"),
    end_date: str = Query(..., description="End date in ISO format"),
    store_id: Optional[str] = Query(None),
    min_orders: int = Query(1, description="Minimum orders to be included")
):
    """Generate customer behavior analysis report"""
    try:
        # Parse dates
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            return error_response(message="Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)", code=400)
        
        # Build query
        query = {
            "created_at": {
                "$gte": start_dt,
                "$lte": end_dt
            },
            "customer_id": {"$ne": None}  # Only orders with customers
        }
        if store_id:
            query["store_id"] = store_id
        
        orders_collection = get_collection("orders")
        customers_collection = get_collection("customers")
        
        # Get orders
        orders = await orders_collection.find(query).to_list()
        
        # Group orders by customer
        customer_orders = defaultdict(list)
        for order in orders:
            customer_id = order.get("customer_id")
            if customer_id:
                customer_orders[customer_id].append(order)
        
        # Get customer details and calculate metrics
        customer_analysis = []
        customer_ids = list(customer_orders.keys())
        
        # Get customer details in batches
        batch_size = 50
        for i in range(0, len(customer_ids), batch_size):
            batch_ids = customer_ids[i:i+batch_size]
            customers = await customers_collection.find(
                {"_id": {"$in": [ObjectId(cid) for cid in batch_ids]}}
            ).to_list()
            
            customer_dict = {str(c["_id"]): c for c in customers}
            
            for customer_id in batch_ids:
                orders_list = customer_orders.get(customer_id, [])
                
                if len(orders_list) < min_orders:
                    continue
                
                customer = customer_dict.get(customer_id)
                
                # Calculate metrics
                total_spent = sum(o.get("total_amount", 0) for o in orders_list)
                avg_spend = total_spent / len(orders_list)
                
                # Calculate visit frequency
                order_dates = []
                for order in orders_list:
                    order_date = order.get("created_at")
                    if isinstance(order_date, datetime):
                        order_dates.append(order_date.date())
                    else:
                        try:
                            order_dates.append(datetime.fromisoformat(str(order_date)).date())
                        except:
                            pass
                
                unique_visit_days = len(set(order_dates))
                avg_days_between_visits = 0
                if len(order_dates) > 1:
                    order_dates.sort()
                    total_days = (order_dates[-1] - order_dates[0]).days
                    avg_days_between_visits = total_days / (len(order_dates) - 1)
                
                # Calculate favorite items
                item_counts = defaultdict(int)
                for order in orders_list:
                    for item in order.get("items", []):
                        item_name = item.get("name", "Unknown")
                        item_counts[item_name] += item.get("quantity", 0)
                
                favorite_item = max(item_counts.items(), key=lambda x: x[1]) if item_counts else ("None", 0)
                
                # Calculate customer value
                customer_value_score = (total_spent * len(orders_list)) / (avg_days_between_visits + 1)
                
                customer_analysis.append({
                    "customer_id": customer_id,
                    "name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip() 
                            if customer else f"Customer {customer_id[:8]}",
                    "email": customer.get("email") if customer else None,
                    "phone": customer.get("phone_number") if customer else None,
                    "total_orders": len(orders_list),
                    "total_spent": total_spent,
                    "average_spend": avg_spend,
                    "unique_visit_days": unique_visit_days,
                    "average_days_between_visits": round(avg_days_between_visits, 1),
                    "favorite_item": favorite_item[0],
                    "favorite_item_quantity": favorite_item[1],
                    "loyalty_points": customer.get("loyalty_points", 0) if customer else 0,
                    "customer_value_score": round(customer_value_score, 2),
                    "last_order_date": max(order_dates).isoformat() if order_dates else None
                })
        
        # Sort by customer value
        customer_analysis.sort(key=lambda x: x["customer_value_score"], reverse=True)
        
        # Calculate segments
        high_value = [c for c in customer_analysis if c["customer_value_score"] > 1000]
        medium_value = [c for c in customer_analysis if 500 <= c["customer_value_score"] <= 1000]
        low_value = [c for c in customer_analysis if c["customer_value_score"] < 500]
        
        # Calculate overall metrics
        total_customers = len(customer_analysis)
        total_revenue_from_customers = sum(c["total_spent"] for c in customer_analysis)
        avg_orders_per_customer = sum(c["total_orders"] for c in customer_analysis) / total_customers if total_customers > 0 else 0
        
        response_data = {
            "period": {
                "start_date": start_dt.isoformat(),
                "end_date": end_dt.isoformat(),
                "days": (end_dt - start_dt).days + 1
            },
            "store_id": store_id,
            "overall_metrics": {
                "total_customers_analyzed": total_customers,
                "total_revenue_from_customers": total_revenue_from_customers,
                "average_orders_per_customer": round(avg_orders_per_customer, 1),
                "percentage_of_total_customers": round((total_customers / len(customer_ids)) * 100, 1) if customer_ids else 0
            },
            "customer_segments": {
                "high_value": {
                    "count": len(high_value),
                    "percentage": round((len(high_value) / total_customers) * 100, 1) if total_customers > 0 else 0,
                    "customers": high_value[:10]
                },
                "medium_value": {
                    "count": len(medium_value),
                    "percentage": round((len(medium_value) / total_customers) * 100, 1) if total_customers > 0 else 0,
                    "customers": medium_value[:10]
                },
                "low_value": {
                    "count": len(low_value),
                    "percentage": round((len(low_value) / total_customers) * 100, 1) if total_customers > 0 else 0,
                    "customers": low_value[:10]
                }
            },
            "top_customers": customer_analysis[:20],
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return success_response(data=response_data)
        
    except Exception as e:
        return handle_generic_exception(e)

@router.post("/reports/export/{report_type}", response_model=StandardResponse[dict])
async def export_report(
    report_type: str,
    export_format: str = Query("csv", regex="^(csv|pdf|excel)$"),
    report_data: Dict[str, Any] = Body(...)
):
    """Export report in various formats"""
    try:
        # This is a simplified export endpoint
        # In production, you'd use libraries like pandas for CSV/Excel and reportlab for PDF
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        response_data = {
            "report_type": report_type,
            "export_format": export_format,
            "download_url": f"/api/reports/download/{report_type}_{timestamp}.{export_format}",
            "filename": f"{report_type}_report_{timestamp}.{export_format}",
            "generated_at": datetime.utcnow().isoformat(),
            "data_summary": {
                "rows": len(report_data.get("data", [])),
                "columns": len(report_data.get("headers", [])),
                "size": f"{len(str(report_data).encode('utf-8')) / 1024:.2f} KB"
            }
        }
        
        return success_response(
            data=response_data,
            message=f"Report exported as {export_format.upper()}"
        )
        
    except Exception as e:
        return handle_generic_exception(e)

# ----------------------------------------------------
# --- Analytics Endpoints ---
# ----------------------------------------------------

@router.get("/analytics/dashboard", response_model=StandardResponse[dict])
async def get_dashboard_analytics(
    period: str = Query("week", regex="^(day|week|month|quarter|year)$"),
    store_id: Optional[str] = Query(None)
):
    """Get dashboard analytics with KPIs"""
    try:
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
        
        # Build query
        query = {
            "created_at": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        if store_id:
            query["store_id"] = store_id
        
        # Get collections
        orders_collection = get_collection("orders")
        customers_collection = get_collection("customers")
        employees_collection = get_collection("employees")
        inventory_collection = get_collection("inventory_products")
        
        # Get data concurrently
        orders_task = orders_collection.find(query).to_list()
        customers_task = customers_collection.find().to_list()
        employees_task = employees_collection.find().to_list()
        inventory_task = inventory_collection.find().to_list()
        
        orders, customers, employees, inventory = await asyncio.gather(
            orders_task, customers_task, employees_task, inventory_task
        )
        
        # Calculate KPIs
        total_revenue = sum(o.get("total_amount", 0) for o in orders)
        total_orders = len(orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Customer metrics
        active_customers = len(set(o.get("customer_id") for o in orders if o.get("customer_id")))
        total_customers = len(customers)
        customer_growth = (active_customers / total_customers * 100) if total_customers > 0 else 0
        
        # Employee metrics
        active_employees = len(set(o.get("employee_id") for o in orders if o.get("employee_id")))
        total_employees = len(employees)
        
        # Inventory metrics
        inventory_value = sum(p.get("quantity_in_stock", 0) * p.get("unit_cost", 0) for p in inventory)
        low_stock_items = [p for p in inventory if p.get("quantity_in_stock", 0) <= p.get("reorder_level", 0)]
        
        # Calculate hourly performance for today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders = [o for o in orders if o.get("created_at") >= today_start]
        
        hourly_performance = defaultdict(lambda: {"revenue": 0, "orders": 0})
        for order in today_orders:
            order_date = order.get("created_at")
            if isinstance(order_date, datetime):
                hour = order_date.hour
            else:
                try:
                    hour = datetime.fromisoformat(str(order_date)).hour
                except:
                    hour = 0
            
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
        
        # Calculate top items
        item_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0})
        for order in orders:
            for item in order.get("items", []):
                item_name = item.get("name", "Unknown")
                item_sales[item_name]["quantity"] += item.get("quantity", 0)
                item_sales[item_name]["revenue"] += item.get("sub_total", 0)
        
        top_items = sorted(
            [{"name": k, **v} for k, v in item_sales.items()],
            key=lambda x: x["revenue"],
            reverse=True
        )[:5]
        
        # Calculate payment method distribution
        payment_methods = defaultdict(float)
        for order in orders:
            method = order.get("payment_method", "unknown")
            payment_methods[method] += order.get("total_amount", 0)
        
        # Prepare response
        response_data = {
            "period": {
                "type": period,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "store_id": store_id,
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
            "peak_hour": max(hourly_data, key=lambda x: x["revenue"]) if hourly_data else None,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return success_response(data=response_data)
        
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/analytics/realtime", response_model=StandardResponse[dict])
async def get_realtime_analytics(
    store_id: Optional[str] = Query(None)
):
    """Get real-time analytics for the current day"""
    try:
        # Get today's date range
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = datetime.utcnow()
        
        # Build query
        query = {
            "created_at": {
                "$gte": today_start,
                "$lte": today_end
            }
        }
        if store_id:
            query["store_id"] = store_id
        
        orders_collection = get_collection("orders")
        orders = await orders_collection.find(query).to_list()
        
        # Calculate real-time metrics
        current_hour = datetime.utcnow().hour
        
        # Today's metrics
        today_revenue = sum(o.get("total_amount", 0) for o in orders)
        today_orders = len(orders)
        today_avg_order = today_revenue / today_orders if today_orders > 0 else 0
        
        # Current hour metrics
        current_hour_orders = [
            o for o in orders 
            if (isinstance(o.get("created_at"), datetime) and o["created_at"].hour == current_hour) or
               (isinstance(o.get("created_at"), str) and datetime.fromisoformat(o["created_at"].replace('Z', '+00:00')).hour == current_hour)
        ]
        
        current_hour_revenue = sum(o.get("total_amount", 0) for o in current_hour_orders)
        current_hour_orders_count = len(current_hour_orders)
        
        # Calculate trend (compare to previous hour)
        previous_hour = (current_hour - 1) % 24
        previous_hour_orders = [
            o for o in orders 
            if (isinstance(o.get("created_at"), datetime) and o["created_at"].hour == previous_hour) or
               (isinstance(o.get("created_at"), str) and datetime.fromisoformat(o["created_at"].replace('Z', '+00:00')).hour == previous_hour)
        ]
        
        previous_hour_revenue = sum(o.get("total_amount", 0) for o in previous_hour_orders)
        
        revenue_trend = "up" if current_hour_revenue > previous_hour_revenue else "down"
        revenue_change_pct = abs((current_hour_revenue - previous_hour_revenue) / previous_hour_revenue * 100) if previous_hour_revenue > 0 else 0
        
        # Get active tables
        tables_collection = get_collection("tables")
        active_tables = await tables_collection.find({
            "status": "occupied",
            "store_id": store_id
        }).to_list()
        
        # Get pending orders
        pending_orders = [o for o in orders if o.get("status") in ["new", "preparing"]]
        
        response_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "store_id": store_id,
            "today": {
                "revenue": today_revenue,
                "orders": today_orders,
                "average_order_value": today_avg_order
            },
            "current_hour": {
                "hour": current_hour,
                "revenue": current_hour_revenue,
                "orders": current_hour_orders_count,
                "trend": revenue_trend,
                "change_percentage": round(revenue_change_pct, 1)
            },
            "active_tables": len(active_tables),
            "pending_orders": len(pending_orders),
            "peak_hour_today": max(
                [(h, sum(o.get("total_amount", 0) for o in orders 
                    if (isinstance(o.get("created_at"), datetime) and o["created_at"].hour == h) or
                       (isinstance(o.get("created_at"), str) and datetime.fromisoformat(o["created_at"].replace('Z', '+00:00')).hour == h)
                 )) for h in range(24)],
                key=lambda x: x[1]
            )[0] if orders else None
        }
        
        return success_response(data=response_data)
        
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/analytics/predictive", response_model=StandardResponse[dict])
async def get_predictive_analytics(
    days_ahead: int = Query(7, ge=1, le=30, description="Days to predict ahead"),
    store_id: Optional[str] = Query(None)
):
    """Get predictive analytics and forecasts"""
    try:
        # Get historical data (last 90 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)
        
        query = {
            "created_at": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        if store_id:
            query["store_id"] = store_id
        
        orders_collection = get_collection("orders")
        orders = await orders_collection.find(query).to_list()
        
        # Group by date
        daily_revenue = defaultdict(float)
        daily_orders = defaultdict(int)
        
        for order in orders:
            order_date = order.get("created_at")
            if isinstance(order_date, datetime):
                date_key = order_date.strftime("%Y-%m-%d")
            else:
                try:
                    date_key = datetime.fromisoformat(str(order_date)).strftime("%Y-%m-%d")
                except:
                    continue
            
            daily_revenue[date_key] += order.get("total_amount", 0)
            daily_orders[date_key] += 1
        
        # Prepare historical data
        historical_dates = sorted(daily_revenue.keys())
        historical_revenue = [daily_revenue[date] for date in historical_dates]
        historical_orders = [daily_orders[date] for date in historical_dates]
        
        # Simple moving average prediction
        window_size = min(7, len(historical_revenue))
        
        if window_size > 0:
            # Predict revenue
            recent_revenue = historical_revenue[-window_size:]
            predicted_daily_revenue = sum(recent_revenue) / window_size
            predicted_total_revenue = predicted_daily_revenue * days_ahead
            
            # Predict orders
            recent_orders = historical_orders[-window_size:]
            predicted_daily_orders = sum(recent_orders) / window_size
            predicted_total_orders = predicted_daily_orders * days_ahead
            
            # Calculate confidence based on data variance
            revenue_variance = sum((x - predicted_daily_revenue) ** 2 for x in recent_revenue) / window_size
            revenue_confidence = max(0, 100 - (revenue_variance / (predicted_daily_revenue or 1)) * 100)
            
            orders_variance = sum((x - predicted_daily_orders) ** 2 for x in recent_orders) / window_size
            orders_confidence = max(0, 100 - (orders_variance / (predicted_daily_orders or 1)) * 100)
            
            # Identify trends
            if len(historical_revenue) >= 14:
                first_half_avg = sum(historical_revenue[-14:-7]) / 7
                second_half_avg = sum(historical_revenue[-7:]) / 7
                revenue_trend = "up" if second_half_avg > first_half_avg * 1.1 else "down" if second_half_avg < first_half_avg * 0.9 else "stable"
            else:
                revenue_trend = "insufficient_data"
        else:
            predicted_total_revenue = predicted_total_orders = 0
            revenue_confidence = orders_confidence = 0
            revenue_trend = "insufficient_data"
        
        # Peak hour prediction
        hourly_revenue = defaultdict(float)
        for order in orders[-100:]:  # Last 100 orders
            order_date = order.get("created_at")
            if isinstance(order_date, datetime):
                hour = order_date.hour
            else:
                try:
                    hour = datetime.fromisoformat(str(order_date)).hour
                except:
                    continue
            
            hourly_revenue[hour] += order.get("total_amount", 0)
        
        peak_hour = max(hourly_revenue.items(), key=lambda x: x[1])[0] if hourly_revenue else None
        
        response_data = {
            "prediction_period": {
                "days_ahead": days_ahead,
                "start_date": (end_date + timedelta(days=1)).strftime("%Y-%m-%d"),
                "end_date": (end_date + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            },
            "store_id": store_id,
            "predictions": {
                "revenue": {
                    "total": round(predicted_total_revenue, 2),
                    "daily_average": round(predicted_daily_revenue, 2),
                    "confidence": round(revenue_confidence, 1),
                    "trend": revenue_trend
                },
                "orders": {
                    "total": round(predicted_total_orders),
                    "daily_average": round(predicted_daily_orders, 1),
                    "confidence": round(orders_confidence, 1)
                }
            },
            "peak_hour_prediction": {
                "hour": peak_hour,
                "time_range": f"{peak_hour}:00 - {(peak_hour + 1) % 24}:00" if peak_hour is not None else None
            },
            "historical_data_points": len(historical_revenue),
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return success_response(data=response_data)
        
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/analytics/comparative", response_model=StandardResponse[dict])
async def get_comparative_analytics(
    period: str = Query("week", regex="^(day|week|month|quarter|year)$"),
    compare_with: str = Query("previous", regex="^(previous|same_last_year|custom)$"),
    store_id: Optional[str] = Query(None)
):
    """Get comparative analytics between periods"""
    try:
        # Calculate current period
        end_date = datetime.utcnow()
        if period == "day":
            start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
            compare_delta = timedelta(days=1)
        elif period == "week":
            start_date = end_date - timedelta(days=7)
            compare_delta = timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
            compare_delta = timedelta(days=30)
        elif period == "quarter":
            start_date = end_date - timedelta(days=90)
            compare_delta = timedelta(days=90)
        else:  # year
            start_date = end_date - timedelta(days=365)
            compare_delta = timedelta(days=365)
        
        # Calculate comparison period
        if compare_with == "previous":
            compare_start = start_date - compare_delta
            compare_end = start_date
        elif compare_with == "same_last_year":
            compare_start = start_date - timedelta(days=365)
            compare_end = end_date - timedelta(days=365)
        else:
            # For custom, you'd need additional parameters
            compare_start = start_date - compare_delta
            compare_end = start_date
        
        # Build queries
        current_query = {
            "created_at": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        
        compare_query = {
            "created_at": {
                "$gte": compare_start,
                "$lte": compare_end
            }
        }
        
        if store_id:
            current_query["store_id"] = store_id
            compare_query["store_id"] = store_id
        
        orders_collection = get_collection("orders")
        
        # Get data concurrently
        current_orders_task = orders_collection.find(current_query).to_list()
        compare_orders_task = orders_collection.find(compare_query).to_list()
        
        current_orders, compare_orders = await asyncio.gather(
            current_orders_task, compare_orders_task
        )
        
        # Calculate metrics for current period
        current_revenue = sum(o.get("total_amount", 0) for o in current_orders)
        current_orders_count = len(current_orders)
        current_avg_order = current_revenue / current_orders_count if current_orders_count > 0 else 0
        
        # Calculate metrics for comparison period
        compare_revenue = sum(o.get("total_amount", 0) for o in compare_orders)
        compare_orders_count = len(compare_orders)
        compare_avg_order = compare_revenue / compare_orders_count if compare_orders_count > 0 else 0
        
        # Calculate changes
        revenue_change = current_revenue - compare_revenue
        revenue_change_pct = (revenue_change / compare_revenue * 100) if compare_revenue > 0 else 0
        
        orders_change = current_orders_count - compare_orders_count
        orders_change_pct = (orders_change / compare_orders_count * 100) if compare_orders_count > 0 else 0
        
        avg_order_change = current_avg_order - compare_avg_order
        avg_order_change_pct = (avg_order_change / compare_avg_order * 100) if compare_avg_order > 0 else 0
        
        # Get top items comparison
        def get_top_items(orders_list, limit=5):
            item_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0})
            for order in orders_list:
                for item in order.get("items", []):
                    item_name = item.get("name", "Unknown")
                    item_sales[item_name]["quantity"] += item.get("quantity", 0)
                    item_sales[item_name]["revenue"] += item.get("sub_total", 0)
            
            return sorted(
                [{"name": k, **v} for k, v in item_sales.items()],
                key=lambda x: x["revenue"],
                reverse=True
            )[:limit]
        
        current_top_items = get_top_items(current_orders)
        compare_top_items = get_top_items(compare_orders)
        
        # Identify new top items
        current_item_names = {item["name"] for item in current_top_items}
        compare_item_names = {item["name"] for item in compare_top_items}
        new_top_items = list(current_item_names - compare_item_names)
        dropped_top_items = list(compare_item_names - current_item_names)
        
        response_data = {
            "periods": {
                "current": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                    "label": f"Current {period}"
                },
                "comparison": {
                    "start": compare_start.isoformat(),
                    "end": compare_end.isoformat(),
                    "label": f"{compare_with.replace('_', ' ').title()} {period}"
                }
            },
            "store_id": store_id,
            "comparison_metrics": {
                "revenue": {
                    "current": current_revenue,
                    "previous": compare_revenue,
                    "change": revenue_change,
                    "change_percentage": round(revenue_change_pct, 1),
                    "trend": "up" if revenue_change > 0 else "down"
                },
                "orders": {
                    "current": current_orders_count,
                    "previous": compare_orders_count,
                    "change": orders_change,
                    "change_percentage": round(orders_change_pct, 1),
                    "trend": "up" if orders_change > 0 else "down"
                },
                "average_order_value": {
                    "current": current_avg_order,
                    "previous": compare_avg_order,
                    "change": avg_order_change,
                    "change_percentage": round(avg_order_change_pct, 1),
                    "trend": "up" if avg_order_change > 0 else "down"
                }
            },
            "top_items_analysis": {
                "current_period": current_top_items,
                "comparison_period": compare_top_items,
                "new_top_items": new_top_items,
                "dropped_top_items": dropped_top_items
            },
            "insights": generate_comparative_insights(
                revenue_change_pct, orders_change_pct, avg_order_change_pct,
                current_top_items, compare_top_items
            ),
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return success_response(data=response_data)
        
    except Exception as e:
        return handle_generic_exception(e)

# Helper function for generating insights
def generate_comparative_insights(revenue_pct, orders_pct, avg_order_pct, current_items, previous_items):
    """Generate insights from comparative data"""
    insights = []
    
    # Revenue insight
    if revenue_pct > 20:
        insights.append("🎉 Excellent growth! Revenue increased significantly compared to the previous period.")
    elif revenue_pct > 5:
        insights.append("📈 Steady growth observed in revenue.")
    elif revenue_pct < -10:
        insights.append("⚠️ Revenue decreased. Consider reviewing marketing strategies.")
    else:
        insights.append("📊 Revenue remained relatively stable.")
    
    # Orders insight
    if orders_pct > revenue_pct + 10:
        insights.append("📋 More orders but lower average value. Consider upselling strategies.")
    elif revenue_pct > orders_pct + 10:
        insights.append("💰 Higher value orders driving revenue growth. Excellent!")
    
    # Average order value insight
    if avg_order_pct > 10:
        insights.append("💎 Customers are spending more per order. Upselling strategies are working!")
    elif avg_order_pct < -5:
        insights.append("📉 Average order value decreased. Review pricing and bundling strategies.")
    
    # Top items insight
    current_top_names = [item["name"] for item in current_items]
    previous_top_names = [item["name"] for item in previous_items]
    
    new_items = set(current_top_names) - set(previous_top_names)
    if new_items:
        insights.append(f"🆕 New top items: {', '.join(new_items)}. Consider promoting these further.")
    
    dropped_items = set(previous_top_names) - set(current_top_names)
    if dropped_items:
        insights.append(f"📉 Items dropped from top: {', '.join(dropped_items)}. Review why these are less popular.")
    
    return insights

# ----------------------------------------------------
# --- Data Export Endpoints ---
# ----------------------------------------------------

@router.get("/reports/export/csv/{report_type}")
async def export_report_csv(
    report_type: str,
    start_date: str = Query(None),
    end_date: str = Query(None),
    store_id: Optional[str] = Query(None)
):
    """Export report as CSV"""
    try:
        # This is a simplified version
        # In production, use pandas to create CSV
        
        import csv
        import io
        
        # Generate some sample data
        if report_type == "sales":
            headers = ["Date", "Revenue", "Orders", "Average Order Value"]
            data = [
                ["2024-01-01", "1000.00", "20", "50.00"],
                ["2024-01-02", "1200.00", "24", "50.00"],
                ["2024-01-03", "900.00", "18", "50.00"]
            ]
        elif report_type == "inventory":
            headers = ["Product", "SKU", "Current Stock", "Reorder Level", "Status"]
            data = [
                ["Burger Bun", "BB001", "50", "100", "Low"],
                ["Beef Patty", "BP001", "200", "150", "OK"],
                ["Lettuce", "LET001", "10", "50", "Critical"]
            ]
        else:
            headers = ["Column 1", "Column 2", "Column 3"]
            data = [["Data 1", "Data 2", "Data 3"]]
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        writer.writerows(data)
        
        csv_content = output.getvalue()
        output.close()
        
        # Create response
        from fastapi.responses import Response
        filename = f"{report_type}_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        return error_response(message=f"Failed to generate CSV: {str(e)}", code=500)

# ----------------------------------------------------
# --- Utility Endpoints ---
# ----------------------------------------------------

@router.get("/reports/available")
async def get_available_reports():
    """Get list of available report types"""
    reports = [
        {
            "id": "financial",
            "name": "Financial Report",
            "description": "Comprehensive financial analysis including revenue, costs, and profits",
            "endpoint": "/api/reports/financial",
            "parameters": ["start_date", "end_date", "store_id", "employee_id", "category_id"]
        },
        {
            "id": "sales_daily",
            "name": "Daily Sales Report",
            "description": "Detailed daily sales breakdown by hour",
            "endpoint": "/api/reports/sales/daily",
            "parameters": ["date", "store_id"]
        },
        {
            "id": "inventory",
            "name": "Inventory Report",
            "description": "Inventory analysis with stock levels and recommendations",
            "endpoint": "/api/reports/inventory",
            "parameters": ["threshold", "store_id"]
        },
        {
            "id": "employee_performance",
            "name": "Employee Performance Report",
            "description": "Employee productivity and performance metrics",
            "endpoint": "/api/reports/employee/performance",
            "parameters": ["start_date", "end_date", "store_id"]
        },
        {
            "id": "customer_analysis",
            "name": "Customer Analysis Report",
            "description": "Customer behavior and segmentation analysis",
            "endpoint": "/api/reports/customer/analysis",
            "parameters": ["start_date", "end_date", "store_id", "min_orders"]
        }
    ]
    
    return success_response(data=reports)

@router.get("/analytics/available")
async def get_available_analytics():
    """Get list of available analytics types"""
    analytics = [
        {
            "id": "dashboard",
            "name": "Dashboard Analytics",
            "description": "Key performance indicators and metrics for dashboard",
            "endpoint": "/api/analytics/dashboard",
            "parameters": ["period", "store_id"]
        },
        {
            "id": "realtime",
            "name": "Real-time Analytics",
            "description": "Live metrics for the current day",
            "endpoint": "/api/analytics/realtime",
            "parameters": ["store_id"]
        },
        {
            "id": "predictive",
            "name": "Predictive Analytics",
            "description": "Forecasts and predictions for future performance",
            "endpoint": "/api/analytics/predictive",
            "parameters": ["days_ahead", "store_id"]
        },
        {
            "id": "comparative",
            "name": "Comparative Analytics",
            "description": "Compare performance between different periods",
            "endpoint": "/api/analytics/comparative",
            "parameters": ["period", "compare_with", "store_id"]
        }
    ]
    
    return success_response(data=analytics)

@router.post("/reports/schedule")
async def schedule_report(
    report_type: str = Body(...),
    schedule: str = Body(..., regex="^(daily|weekly|monthly)$"),
    email: str = Body(None),
    parameters: Dict[str, Any] = Body(default_factory=dict)
):
    """Schedule automated report generation"""
    try:
        # In production, this would use a task queue like Celery
        # For now, just return a confirmation
        
        schedule_id = f"schedule_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        response_data = {
            "schedule_id": schedule_id,
            "report_type": report_type,
            "schedule": schedule,
            "email": email,
            "parameters": parameters,
            "next_run": calculate_next_run(schedule),
            "created_at": datetime.utcnow().isoformat(),
            "status": "scheduled"
        }
        
        return success_response(
            data=response_data,
            message=f"Report scheduled for {schedule} delivery"
        )
        
    except Exception as e:
        return handle_generic_exception(e)

def calculate_next_run(schedule: str) -> str:
    """Calculate next run time for scheduled reports"""
    from datetime import datetime, timedelta
    
    now = datetime.utcnow()
    
    if schedule == "daily":
        next_run = now + timedelta(days=1)
    elif schedule == "weekly":
        next_run = now + timedelta(days=7)
    elif schedule == "monthly":
        # Simple monthly calculation
        next_run = now + timedelta(days=30)
    else:
        next_run = now + timedelta(days=1)
    
    return next_run.replace(hour=9, minute=0, second=0, microsecond=0).isoformat()