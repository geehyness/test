# app/routes/reports.py - FIXED VERSION
from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import get_collection
from app.utils.response_helpers import success_response, error_response
import asyncio
from collections import defaultdict

router = APIRouter(prefix="/api/reports", tags=["reports"])

# Helper function for safe ObjectId conversion
def safe_objectid(id_str):
    """Safely convert string to ObjectId, return None if invalid"""
    try:
        if id_str and isinstance(id_str, str) and len(id_str) == 24:
            return ObjectId(id_str)
    except:
        pass
    return None

def create_empty_response(start_date=None, end_date=None, store_id=None, message="No data found"):
    """Create a standardized empty response"""
    response = {
        "message": message,
        "data": None,
        "summary": {
            "total_revenue": 0,
            "total_orders": 0,
            "total_cost": 0,
            "gross_profit": 0,
            "gross_margin": 0,
            "average_order_value": 0,
            "inventory_value": 0
        } if start_date else {},
        "period": {
            "start_date": start_date,
            "end_date": end_date,
            "days": (datetime.fromisoformat(end_date) - datetime.fromisoformat(start_date)).days + 1 if start_date and end_date else 0
        } if start_date else {},
        "filters": {
            "store_id": store_id
        } if store_id else {}
    }
    return response

# ==================== TEST ENDPOINT ====================

@router.get("/test")
async def test_reports_endpoint():
    """Test endpoint to verify reports API is working"""
    return success_response(
        data={
            "timestamp": datetime.utcnow().isoformat(),
            "status": "ok",
            "endpoints_available": [
                "/api/reports/financial",
                "/api/reports/sales/daily",
                "/api/reports/inventory",
                "/api/reports/employee/performance",
                "/api/reports/customer/analysis"
            ]
        },
        message="Reports API is working"
    )

# ==================== FINANCIAL REPORTS ====================

@router.get("/financial")
async def get_financial_report(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    store_id: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Generate comprehensive financial report from real data"""
    try:
        # Parse dates
        try:
            start_dt = datetime.fromisoformat(start_date + "T00:00:00")
            end_dt = datetime.fromisoformat(end_date + "T23:59:59.999999")
        except ValueError:
            return error_response(
                message="Invalid date format. Use YYYY-MM-DD format",
                code=400
            )
        
        # Build query
        query = {
            "created_at": {
                "$gte": start_dt,
                "$lte": end_dt
            }
        }
        
        # Add filters with ObjectId validation
        if store_id:
            store_obj_id = safe_objectid(store_id)
            if store_obj_id:
                query["store_id"] = store_obj_id
            else:
                return error_response(message="Invalid store ID format", code=400)
        
        if employee_id:
            emp_obj_id = safe_objectid(employee_id)
            if emp_obj_id:
                query["employee_id"] = emp_obj_id
            else:
                return error_response(message="Invalid employee ID format", code=400)
        
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
        
        # FIXED: Use await directly since LoggedCollection.find() returns a list
        orders = await orders_collection.find(query)
        foods = await foods_collection.find({})
        customers = await customers_collection.find({})
        employees = await employees_collection.find({})
        inventory = await inventory_collection.find({})
        
        # If no orders found, return empty report with success response
        if not orders:
            report_data = {
                "period": {
                    "start_date": start_dt.isoformat(),
                    "end_date": end_dt.isoformat(),
                    "days": (end_dt - start_dt).days + 1
                },
                "summary": {
                    "total_revenue": 0,
                    "total_orders": 0,
                    "total_cost": 0,
                    "gross_profit": 0,
                    "gross_margin": 0,
                    "average_order_value": 0,
                    "inventory_value": sum((p.get("quantity_in_stock", 0) or 0) * (p.get("unit_cost", 0) or 0) for p in inventory)
                },
                "payment_methods": {},
                "daily_performance": [],
                "top_items": [],
                "top_customers": [],
                "employee_performance": [],
                "inventory_metrics": {
                    "total_value": sum((p.get("quantity_in_stock", 0) or 0) * (p.get("unit_cost", 0) or 0) for p in inventory),
                    "low_stock_count": len([p for p in inventory if (p.get("quantity_in_stock", 0) or 0) <= (p.get("reorder_level", 0) or 0)])
                },
                "filters": {
                    "store_id": store_id,
                    "employee_id": employee_id,
                    "category_id": category_id,
                    "payment_method": payment_method,
                    "status": status
                },
                "generated_at": datetime.utcnow().isoformat(),
                "data_status": "empty",
                "message": "No orders found for the selected period"
            }
            
            return success_response(
                data=report_data,
                message="No orders found for the selected period"
            )
        
        # Calculate metrics (existing code continues...)
        total_revenue = 0
        total_cost = 0
        total_orders = len(orders)
        
        # Data structures
        item_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0, "cost": 0})
        customer_spending = defaultdict(lambda: {"total": 0, "orders": 0})
        employee_performance = defaultdict(lambda: {"orders": 0, "revenue": 0})
        payment_methods = defaultdict(float)
        daily_revenue = defaultdict(float)
        
        # Food lookup
        food_dict = {}
        for food in foods:
            food_id = str(food.get("_id", ""))
            food_dict[food_id] = food
        
        # Process orders
        for order in orders:
            if order.get("status") == "cancelled":
                continue
                
            order_revenue = order.get("total_amount", 0) or 0
            order_date = order.get("created_at")
            
            # Parse date
            date_key = "unknown"
            if isinstance(order_date, datetime):
                date_key = order_date.strftime("%Y-%m-%d")
            elif isinstance(order_date, str):
                try:
                    date_key = datetime.fromisoformat(order_date.replace('Z', '+00:00')).strftime("%Y-%m-%d")
                except:
                    pass
            
            # Accumulate metrics
            total_revenue += order_revenue
            daily_revenue[date_key] += order_revenue
            
            # Payment method
            pmt_method = order.get("payment_method", "unknown")
            payment_methods[pmt_method] += order_revenue
            
            # Customer spending
            customer_id = order.get("customer_id")
            if customer_id:
                customer_spending[str(customer_id)]["total"] += order_revenue
                customer_spending[str(customer_id)]["orders"] += 1
            
            # Employee performance
            emp_id = order.get("employee_id")
            if emp_id:
                employee_performance[str(emp_id)]["orders"] += 1
                employee_performance[str(emp_id)]["revenue"] += order_revenue
            
            # Item sales
            for item in order.get("items", []):
                food_id = str(item.get("food_id", ""))
                if not food_id:
                    continue
                    
                quantity = item.get("quantity", 0) or 0
                price = item.get("price", 0) or 0
                sub_total = item.get("sub_total", 0) or 0
                
                item_sales[food_id]["quantity"] += quantity
                item_sales[food_id]["revenue"] += sub_total
                
                # Calculate cost from food data
                food = food_dict.get(food_id)
                if food and food.get("unit_cost"):
                    item_cost = (food.get("unit_cost") or 0) * quantity
                    item_sales[food_id]["cost"] += item_cost
                    total_cost += item_cost
        
        # Calculate derived metrics
        gross_profit = total_revenue - total_cost
        gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Get top items
        top_items = []
        for food_id, data in item_sales.items():
            food = food_dict.get(food_id)
            top_items.append({
                "id": food_id,
                "name": food.get("name", f"Item {food_id[:8]}") if food else f"Item {food_id[:8]}",
                "quantity": data["quantity"],
                "revenue": data["revenue"],
                "cost": data["cost"],
                "profit": data["revenue"] - data["cost"]
            })
        
        top_items.sort(key=lambda x: x["revenue"], reverse=True)
        top_items = top_items[:10]
        
        # Get top customers
        customer_dict = {}
        for customer in customers:
            customer_id = str(customer.get("_id", ""))
            customer_dict[customer_id] = customer
        
        top_customers = []
        for customer_id, data in customer_spending.items():
            customer = customer_dict.get(customer_id)
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
        employee_dict = {}
        for emp in employees:
            emp_id = str(emp.get("_id", ""))
            employee_dict[emp_id] = emp
        
        employee_perf_data = []
        for emp_id, data in employee_performance.items():
            employee = employee_dict.get(emp_id)
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
        inventory_value = sum((p.get("quantity_in_stock", 0) or 0) * (p.get("unit_cost", 0) or 0) for p in inventory)
        low_stock_items = [p for p in inventory if (p.get("quantity_in_stock", 0) or 0) <= (p.get("reorder_level", 0) or 0)]
        
        # Calculate daily metrics
        daily_data = []
        for date_str, revenue in sorted(daily_revenue.items()):
            daily_orders = [o for o in orders if (
                (isinstance(o.get("created_at"), datetime) and o["created_at"].strftime("%Y-%m-%d") == date_str) or
                (isinstance(o.get("created_at"), str) and date_str in o["created_at"])
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
                "low_stock_count": len(low_stock_items)
            },
            "filters": {
                "store_id": store_id,
                "employee_id": employee_id,
                "category_id": category_id,
                "payment_method": payment_method,
                "status": status
            },
            "generated_at": datetime.utcnow().isoformat(),
            "data_status": "has_data"
        }
        
        return success_response(
            data=report_data,
            message="Financial report generated successfully"
        )
        
    except Exception as e:
        return error_response(
            message=f"Error generating financial report: {str(e)}",
            code=500,
            details={"error": str(e)}
        )

# ==================== DAILY SALES REPORT ====================

@router.get("/sales/daily")
async def get_daily_sales_report(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    store_id: Optional[str] = Query(None)
):
    """Get detailed daily sales report from real data"""
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
            store_obj_id = safe_objectid(store_id)
            if store_obj_id:
                query["store_id"] = store_obj_id
            else:
                return error_response(message="Invalid store ID format", code=400)
        
        # Get collection
        orders_collection = get_collection("orders")
        
        # FIXED: Use await directly since LoggedCollection.find() returns a list
        orders = await orders_collection.find(query)
        
        # If no orders found, return empty report with success
        if not orders:
            response_data = {
                "date": date,
                "store_id": store_id,
                "total_revenue": 0,
                "total_orders": 0,
                "average_order_value": 0,
                "hourly_breakdown": [],
                "status_breakdown": {},
                "payment_method_breakdown": {},
                "data_status": "empty",
                "message": "No orders found for the selected date"
            }
            
            return success_response(
                data=response_data,
                message="No orders found for the selected date"
            )
        
        # Calculate hourly breakdown
        hourly_data = defaultdict(lambda: {"revenue": 0, "orders": 0})
        
        for order in orders:
            order_date = order.get("created_at")
            hour = 0
            
            if isinstance(order_date, datetime):
                hour = order_date.hour
            elif isinstance(order_date, str):
                try:
                    hour = datetime.fromisoformat(order_date.replace('Z', '+00:00')).hour
                except:
                    pass
            
            hourly_data[hour]["revenue"] += order.get("total_amount", 0) or 0
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
            payment_methods[method] += order.get("total_amount", 0) or 0
        
        # Prepare response
        response_data = {
            "date": date,
            "store_id": store_id,
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "average_order_value": total_revenue / total_orders if total_orders > 0 else 0,
            "hourly_breakdown": hourly_list,
            "status_breakdown": dict(status_counts),
            "payment_method_breakdown": dict(payment_methods),
            "data_status": "has_data"
        }
        
        # Add peak hour if there's data
        if hourly_list:
            peak_hour = max(hourly_list, key=lambda x: x["revenue"])
            response_data["peak_hour"] = peak_hour
        
        return success_response(data=response_data)
        
    except Exception as e:
        return error_response(
            message=f"Error generating daily sales report: {str(e)}",
            code=500
        )

# ==================== INVENTORY REPORT ====================

@router.get("/inventory")
async def get_inventory_report(
    threshold: float = Query(0.3, description="Low stock threshold as percentage of reorder level"),
    store_id: Optional[str] = Query(None)
):
    """Generate inventory report with stock analysis from real data"""
    try:
        # Build query
        query = {}
        if store_id:
            store_obj_id = safe_objectid(store_id)
            if store_obj_id:
                query["store_id"] = store_obj_id
            else:
                return error_response(message="Invalid store ID format", code=400)
        
        # Get collection
        inventory_collection = get_collection("inventory_products")
        
        # FIXED: Use await directly
        products = await inventory_collection.find(query)
        
        # If no inventory products found, return empty report with success
        if not products:
            response_data = {
                "total_items": 0,
                "total_inventory_value": 0,
                "low_stock_items": {
                    "count": 0,
                    "items": []
                },
                "out_of_stock_items": {
                    "count": 0,
                    "items": []
                },
                "slow_moving_items": {
                    "count": 0,
                    "items": []
                },
                "store_id": store_id,
                "threshold_percentage": threshold * 100,
                "data_status": "empty",
                "message": "No inventory products found"
            }
            
            return success_response(
                data=response_data,
                message="No inventory products found"
            )
        
        # Calculate metrics
        total_value = 0
        low_stock = []
        out_of_stock = []
        slow_moving = []
        
        for product in products:
            current_stock = product.get("quantity_in_stock", 0) or 0
            reorder_level = product.get("reorder_level", 0) or 0
            unit_cost = product.get("unit_cost", 0) or 0
            
            # Calculate product value
            product_value = current_stock * unit_cost
            total_value += product_value
            
            # Check stock status
            if current_stock <= 0:
                out_of_stock.append({
                    "id": str(product.get("_id", "")),
                    "name": product.get("name", "Unknown"),
                    "current_stock": current_stock,
                    "reorder_level": reorder_level,
                    "last_restocked": product.get("last_restocked_at"),
                    "value": product_value
                })
            elif current_stock <= reorder_level * threshold:
                low_stock.append({
                    "id": str(product.get("_id", "")),
                    "name": product.get("name", "Unknown"),
                    "current_stock": current_stock,
                    "reorder_level": reorder_level,
                    "percentage": (current_stock / reorder_level) * 100 if reorder_level > 0 else 0,
                    "value": product_value
                })
            
            # Check for slow-moving items
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
                            "id": str(product.get("_id", "")),
                            "name": product.get("name", "Unknown"),
                            "days_since_restock": days_since_restock,
                            "current_stock": current_stock,
                            "value": product_value
                        })
                except:
                    pass
        
        # Sort lists
        low_stock.sort(key=lambda x: x["percentage"])
        out_of_stock.sort(key=lambda x: x.get("last_restocked") or "", reverse=True)
        slow_moving.sort(key=lambda x: x["days_since_restock"], reverse=True)
        
        # Prepare response
        response_data = {
            "total_items": len(products),
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
            },
            "store_id": store_id,
            "threshold_percentage": threshold * 100,
            "data_status": "has_data"
        }
        
        return success_response(data=response_data)
        
    except Exception as e:
        return error_response(
            message=f"Error generating inventory report: {str(e)}",
            code=500
        )

# ==================== EMPLOYEE PERFORMANCE REPORT ====================

@router.get("/employee/performance")
async def get_employee_performance_report(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    store_id: Optional[str] = Query(None)
):
    """Generate employee performance report from real data"""
    try:
        # Parse dates
        try:
            start_dt = datetime.fromisoformat(start_date + "T00:00:00")
            end_dt = datetime.fromisoformat(end_date + "T23:59:59.999999")
        except ValueError:
            return error_response(
                message="Invalid date format. Use YYYY-MM-DD format",
                code=400
            )
        
        # Build query for orders
        orders_query = {
            "created_at": {
                "$gte": start_dt,
                "$lte": end_dt
            }
        }
        if store_id:
            store_obj_id = safe_objectid(store_id)
            if store_obj_id:
                orders_query["store_id"] = store_obj_id
            else:
                return error_response(message="Invalid store ID format", code=400)
        
        # Get collections
        orders_collection = get_collection("orders")
        employees_collection = get_collection("employees")
        
        # FIXED: Use await directly
        orders = await orders_collection.find(orders_query)
        employees = await employees_collection.find({})
        
        # If no orders found, return empty report with success
        if not orders:
            report_data = {
                "period": {
                    "start_date": start_dt.isoformat(),
                    "end_date": end_dt.isoformat(),
                    "days": (end_dt - start_dt).days + 1
                },
                "store_id": store_id,
                "total_employees": 0,
                "averages": {
                    "revenue_per_employee": 0,
                    "orders_per_employee": 0,
                    "average_order_value": 0
                },
                "employee_performance": [],
                "top_performers": [],
                "generated_at": datetime.utcnow().isoformat(),
                "data_status": "empty",
                "message": "No orders found for the selected period"
            }
            
            return success_response(
                data=report_data,
                message="No orders found for the selected period"
            )
        
        # Group orders by employee
        employee_orders = defaultdict(list)
        for order in orders:
            emp_id = order.get("employee_id")
            if emp_id:
                employee_orders[str(emp_id)].append(order)
        
        # Process each employee
        performance_data = []
        employee_dict = {}
        for emp in employees:
            emp_id = str(emp.get("_id", ""))
            employee_dict[emp_id] = emp
        
        for emp_id, orders_list in employee_orders.items():
            employee = employee_dict.get(emp_id)
            if not employee:
                continue
            
            # Calculate order metrics
            total_orders = len(orders_list)
            total_revenue = sum(o.get("total_amount", 0) or 0 for o in orders_list)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            
            performance_data.append({
                "employee_id": emp_id,
                "name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip(),
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "average_order_value": avg_order_value,
                "store_id": employee.get("store_id")
            })
        
        # Sort by revenue
        performance_data.sort(key=lambda x: x["total_revenue"], reverse=True)
        
        # Calculate averages
        if performance_data:
            avg_revenue_per_emp = sum(p["total_revenue"] for p in performance_data) / len(performance_data)
            avg_orders_per_emp = sum(p["total_orders"] for p in performance_data) / len(performance_data)
            avg_order_value_all = sum(p["total_revenue"] for p in performance_data) / sum(p["total_orders"] for p in performance_data) if sum(p["total_orders"] for p in performance_data) > 0 else 0
        else:
            avg_revenue_per_emp = avg_orders_per_emp = avg_order_value_all = 0
        
        # Prepare response
        report_data = {
            "period": {
                "start_date": start_dt.isoformat(),
                "end_date": end_dt.isoformat(),
                "days": (end_dt - start_dt).days + 1
            },
            "store_id": store_id,
            "total_employees": len(performance_data),
            "averages": {
                "revenue_per_employee": round(avg_revenue_per_emp, 2),
                "orders_per_employee": round(avg_orders_per_emp, 1),
                "average_order_value": round(avg_order_value_all, 2)
            },
            "employee_performance": performance_data,
            "top_performers": performance_data[:5] if performance_data else [],
            "generated_at": datetime.utcnow().isoformat(),
            "data_status": "has_data" if performance_data else "empty"
        }
        
        return success_response(data=report_data)
        
    except Exception as e:
        return error_response(
            message=f"Error generating employee performance report: {str(e)}",
            code=500
        )

# ==================== CUSTOMER ANALYSIS REPORT ====================

@router.get("/customer/analysis")
async def get_customer_analysis_report(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    store_id: Optional[str] = Query(None),
    min_orders: int = Query(1, description="Minimum orders to be included")
):
    """Generate customer behavior analysis report from real data"""
    try:
        # Parse dates
        try:
            start_dt = datetime.fromisoformat(start_date + "T00:00:00")
            end_dt = datetime.fromisoformat(end_date + "T23:59:59.999999")
        except ValueError:
            return error_response(
                message="Invalid date format. Use YYYY-MM-DD format",
                code=400
            )
        
        # Build query
        query = {
            "created_at": {
                "$gte": start_dt,
                "$lte": end_dt
            },
            "customer_id": {"$ne": None}
        }
        if store_id:
            store_obj_id = safe_objectid(store_id)
            if store_obj_id:
                query["store_id"] = store_obj_id
            else:
                return error_response(message="Invalid store ID format", code=400)
        
        # Get collections
        orders_collection = get_collection("orders")
        customers_collection = get_collection("customers")
        
        # FIXED: Use await directly
        orders = await orders_collection.find(query)
        customers = await customers_collection.find({})
        
        # If no orders found, return empty report with success
        if not orders:
            report_data = {
                "period": {
                    "start_date": start_dt.isoformat(),
                    "end_date": end_dt.isoformat(),
                    "days": (end_dt - start_dt).days + 1
                },
                "store_id": store_id,
                "overall_metrics": {
                    "total_customers_analyzed": 0,
                    "total_revenue_from_customers": 0,
                    "average_orders_per_customer": 0
                },
                "customer_segments": {
                    "high_value": {
                        "count": 0,
                        "percentage": 0,
                        "customers": []
                    },
                    "medium_value": {
                        "count": 0,
                        "percentage": 0,
                        "customers": []
                    },
                    "low_value": {
                        "count": 0,
                        "percentage": 0,
                        "customers": []
                    }
                },
                "top_customers": [],
                "generated_at": datetime.utcnow().isoformat(),
                "data_status": "empty",
                "message": "No orders found for the selected period"
            }
            
            return success_response(
                data=report_data,
                message="No orders found for the selected period"
            )
        
        # Group orders by customer
        customer_orders = {}
        for order in orders:
            customer_id = order.get("customer_id")
            if customer_id:
                customer_id_str = str(customer_id)
                if customer_id_str not in customer_orders:
                    customer_orders[customer_id_str] = []
                customer_orders[customer_id_str].append(order)
        
        # Prepare customer analysis
        customer_analysis = []
        customer_dict = {}
        for c in customers:
            customer_id = str(c.get("_id", ""))
            customer_dict[customer_id] = c
        
        for customer_id, orders_list in customer_orders.items():
            if len(orders_list) < min_orders:
                continue
            
            customer = customer_dict.get(customer_id)
            
            # Calculate metrics
            total_spent = sum(o.get("total_amount", 0) or 0 for o in orders_list)
            avg_spend = total_spent / len(orders_list)
            
            # Calculate visit frequency
            order_dates = []
            for order in orders_list:
                order_date = order.get("created_at")
                if isinstance(order_date, datetime):
                    order_dates.append(order_date.date())
                elif isinstance(order_date, str):
                    try:
                        order_dates.append(datetime.fromisoformat(order_date.replace('Z', '+00:00')).date())
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
                    item_counts[item_name] += item.get("quantity", 0) or 0
            
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
        
        # Prepare response
        report_data = {
            "period": {
                "start_date": start_dt.isoformat(),
                "end_date": end_dt.isoformat(),
                "days": (end_dt - start_dt).days + 1
            },
            "store_id": store_id,
            "overall_metrics": {
                "total_customers_analyzed": total_customers,
                "total_revenue_from_customers": total_revenue_from_customers,
                "average_orders_per_customer": round(avg_orders_per_customer, 1)
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
            "generated_at": datetime.utcnow().isoformat(),
            "data_status": "has_data" if customer_analysis else "empty"
        }
        
        return success_response(data=report_data)
        
    except Exception as e:
        return error_response(
            message=f"Error generating customer analysis report: {str(e)}",
            code=500
        )

# ==================== OTHER ENDPOINTS ====================

@router.get("/available")
async def get_available_reports():
    """Get list of available report types"""
    reports = [
        {
            "id": "financial",
            "name": "Financial Report",
            "description": "Comprehensive financial analysis including revenue, costs, and profits",
            "endpoint": "/api/reports/financial",
            "parameters": ["start_date", "end_date", "store_id", "employee_id", "payment_method", "status"]
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