# app/routes/reports.py - UPDATED WITH REAL DATA
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import get_collection
from app.models.response import StandardResponse, SuccessResponse, ErrorResponse
from app.utils.response_helpers import success_response, error_response, handle_generic_exception
from app.utils.analytics_helpers import AnalyticsProcessor
import asyncio

router = APIRouter(prefix="/api", tags=["reports"])

# ==================== TEST ENDPOINTS ====================

@router.get("/reports/test")
async def test_reports_endpoint():
    """Test endpoint to verify reports API is working"""
    return success_response(
        data={
            "timestamp": datetime.utcnow().isoformat(),
            "status": "ok",
            "route": "/api/reports/test",
            "endpoints_available": [
                "/api/reports/test",
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
        },
        message="Reports API is working"
    )

# ==================== FINANCIAL REPORTS ====================

@router.get("/reports/financial", response_model=StandardResponse[dict])
async def get_financial_report(
    start_date: str = Query(..., description="Start date in ISO format (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date in ISO format (YYYY-MM-DD)"),
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
        
        # Fetch data in parallel
        orders_task = orders_collection.find(query).to_list(None)
        foods_task = foods_collection.find().to_list(None)
        customers_task = customers_collection.find().to_list(None)
        employees_task = employees_collection.find().to_list(None)
        inventory_task = inventory_collection.find().to_list(None)
        
        orders, foods, customers, employees, inventory = await asyncio.gather(
            orders_task, foods_task, customers_task, employees_task, inventory_task
        )
        
        # Process financial report
        processed_data = await AnalyticsProcessor.process_financial_report(
            orders, foods, inventory, customers, employees
        )
        
        # Prepare response
        report_data = {
            "period": {
                "start_date": start_dt.isoformat(),
                "end_date": end_dt.isoformat(),
                "days": (end_dt - start_dt).days + 1
            },
            "summary": {
                "total_revenue": processed_data["total_revenue"],
                "total_orders": processed_data["total_orders"],
                "total_cost": processed_data["total_cost"],
                "gross_profit": processed_data["gross_profit"],
                "gross_margin": processed_data["gross_margin"],
                "average_order_value": processed_data["avg_order_value"]
            },
            "payment_methods": processed_data["payment_methods"],
            "daily_performance": [
                {
                    "date": date,
                    "revenue": revenue,
                    "orders": len([
                        o for o in orders 
                        if AnalyticsProcessor._parse_date_key(o.get("created_at")) == date
                    ]),
                    "avg_order_value": revenue / len([
                        o for o in orders 
                        if AnalyticsProcessor._parse_date_key(o.get("created_at")) == date
                    ]) if len([
                        o for o in orders 
                        if AnalyticsProcessor._parse_date_key(o.get("created_at")) == date
                    ]) > 0 else 0
                }
                for date, revenue in sorted(processed_data["daily_revenue"].items())
            ],
            "top_items": sorted(
                [
                    {
                        "id": food_id,
                        "name": next(
                            (f.get("name", f"Item {food_id[:8]}") for f in foods if str(f["_id"]) == food_id),
                            f"Item {food_id[:8]}"
                        ),
                        "quantity": data["quantity"],
                        "revenue": data["revenue"],
                        "cost": data["cost"],
                        "profit": data["revenue"] - data["cost"]
                    }
                    for food_id, data in processed_data["item_sales"].items()
                ],
                key=lambda x: x["revenue"],
                reverse=True
            )[:10],
            "top_customers": sorted(
                [
                    {
                        "id": customer_id,
                        "name": next(
                            (f"{c.get('first_name', '')} {c.get('last_name', '')}".strip() 
                             for c in customers if str(c["_id"]) == customer_id),
                            f"Customer {customer_id[:8]}"
                        ),
                        "total_spent": data["total"],
                        "orders": data["orders"],
                        "avg_spend": data["total"] / data["orders"] if data["orders"] > 0 else 0
                    }
                    for customer_id, data in processed_data["customer_spending"].items()
                ],
                key=lambda x: x["total_spent"],
                reverse=True
            )[:10],
            "employee_performance": sorted(
                [
                    {
                        "id": emp_id,
                        "name": next(
                            (f"{e.get('first_name', '')} {e.get('last_name', '')}".strip() 
                             for e in employees if str(e["_id"]) == emp_id),
                            f"Employee {emp_id[:8]}"
                        ),
                        "orders_processed": data["orders"],
                        "total_sales": data["revenue"],
                        "avg_order_value": data["revenue"] / data["orders"] if data["orders"] > 0 else 0
                    }
                    for emp_id, data in processed_data["employee_performance"].items()
                ],
                key=lambda x: x["total_sales"],
                reverse=True
            ),
            "inventory_metrics": {
                "total_value": sum(
                    p.get("quantity_in_stock", 0) * p.get("unit_cost", 0) 
                    for p in inventory
                ),
                "low_stock_count": len([
                    p for p in inventory 
                    if p.get("quantity_in_stock", 0) <= p.get("reorder_level", 0)
                ])
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
        
        return success_response(
            data=report_data,
            message="Financial report generated successfully"
        )
        
    except Exception as e:
        return handle_generic_exception(e)

# ==================== DAILY SALES REPORT ====================

@router.get("/reports/sales/daily", response_model=StandardResponse[dict])
async def get_daily_sales_report(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    store_id: Optional[str] = Query(None)
):
    """Get detailed daily sales report from real data"""
    try:
        # Build query
        query = {}
        if store_id:
            query["store_id"] = store_id
        
        # Get collections
        orders_collection = get_collection("orders")
        
        # Fetch all orders and filter in memory (simpler approach)
        cursor = orders_collection.find(query)
        all_orders = await cursor.to_list(None)
        
        # Process daily sales
        processed_data = await AnalyticsProcessor.process_daily_sales(all_orders, date)
        
        # Add store_id to response
        processed_data["store_id"] = store_id
        
        return success_response(data=processed_data)
        
    except Exception as e:
        return handle_generic_exception(e)

# ==================== INVENTORY REPORT ====================

@router.get("/reports/inventory", response_model=StandardResponse[dict])
async def get_inventory_report(
    threshold: float = Query(0.3, description="Low stock threshold as percentage of reorder level"),
    store_id: Optional[str] = Query(None)
):
    """Generate inventory report with stock analysis from real data"""
    try:
        # Build query
        query = {}
        if store_id:
            query["store_id"] = store_id
        
        # Get collection
        inventory_collection = get_collection("inventory_products")
        
        # Fetch inventory data
        cursor = inventory_collection.find(query)
        inventory = await cursor.to_list(None)
        
        # Process inventory report
        processed_data = await AnalyticsProcessor.process_inventory_report(inventory, threshold)
        
        # Add store_id to response
        processed_data["store_id"] = store_id
        processed_data["threshold_percentage"] = threshold * 100
        
        return success_response(data=processed_data)
        
    except Exception as e:
        return handle_generic_exception(e)

# ==================== EMPLOYEE PERFORMANCE REPORT ====================

@router.get("/reports/employee/performance", response_model=StandardResponse[dict])
async def get_employee_performance_report(
    start_date: str = Query(..., description="Start date in ISO format"),
    end_date: str = Query(..., description="End date in ISO format"),
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
            orders_query["store_id"] = store_id
        
        # Get collections
        orders_collection = get_collection("orders")
        employees_collection = get_collection("employees")
        timesheets_collection = get_collection("timesheet_entries")
        shifts_collection = get_collection("shifts")
        
        # Fetch data in parallel
        orders_task = orders_collection.find(orders_query).to_list(None)
        employees_task = employees_collection.find().to_list(None)
        timesheets_task = timesheets_collection.find().to_list(None)
        shifts_task = shifts_collection.find().to_list(None)
        
        orders, employees, timesheets, shifts = await asyncio.gather(
            orders_task, employees_task, timesheets_task, shifts_task
        )
        
        # Process employee performance
        processed_data = await AnalyticsProcessor.process_employee_performance(
            orders, employees, timesheets, shifts
        )
        
        # Prepare response
        report_data = {
            "period": {
                "start_date": start_dt.isoformat(),
                "end_date": end_dt.isoformat(),
                "days": (end_dt - start_dt).days + 1
            },
            "store_id": store_id,
            "total_employees": len(employees),
            "averages": processed_data["averages"],
            "employee_performance": processed_data["employee_performance"],
            "top_performers": processed_data["top_performers"],
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return success_response(data=report_data)
        
    except Exception as e:
        return handle_generic_exception(e)

# ==================== CUSTOMER ANALYSIS REPORT ====================

@router.get("/reports/customer/analysis", response_model=StandardResponse[dict])
async def get_customer_analysis_report(
    start_date: str = Query(..., description="Start date in ISO format"),
    end_date: str = Query(..., description="End date in ISO format"),
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
            query["store_id"] = store_id
        
        # Get collections
        orders_collection = get_collection("orders")
        customers_collection = get_collection("customers")
        
        # Fetch data
        orders_cursor = orders_collection.find(query)
        customers_cursor = customers_collection.find()
        
        orders, customers = await asyncio.gather(
            orders_cursor.to_list(None),
            customers_cursor.to_list(None)
        )
        
        # Group orders by customer
        customer_orders = {}
        for order in orders:
            customer_id = order.get("customer_id")
            if customer_id:
                if customer_id not in customer_orders:
                    customer_orders[customer_id] = []
                customer_orders[customer_id].append(order)
        
        # Prepare customer analysis
        customer_analysis = []
        customer_dict = {str(c["_id"]): c for c in customers}
        
        for customer_id, orders_list in customer_orders.items():
            if len(orders_list) < min_orders:
                continue
            
            customer = customer_dict.get(customer_id)
            
            # Calculate metrics
            total_spent = sum(o.get("total_amount", 0) for o in orders_list)
            avg_spend = total_spent / len(orders_list)
            
            # Calculate visit frequency
            order_dates = []
            for order in orders_list:
                order_date = AnalyticsProcessor._parse_datetime(order.get("created_at"))
                if order_date:
                    order_dates.append(order_date.date())
            
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
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return success_response(data=report_data)
        
    except Exception as e:
        return handle_generic_exception(e)

# ==================== ANALYTICS ENDPOINTS ====================

@router.get("/analytics/dashboard", response_model=StandardResponse[dict])
async def get_dashboard_analytics(
    period: str = Query("week", regex="^(day|week|month|quarter|year)$"),
    store_id: Optional[str] = Query(None)
):
    """Get dashboard analytics with KPIs from real data"""
    try:
        # Get collections
        orders_collection = get_collection("orders")
        customers_collection = get_collection("customers")
        employees_collection = get_collection("employees")
        inventory_collection = get_collection("inventory_products")
        
        # Fetch all data (simpler approach for analytics)
        orders_cursor = orders_collection.find({})
        customers_cursor = customers_collection.find({})
        employees_cursor = employees_collection.find({})
        inventory_cursor = inventory_collection.find({})
        
        orders, customers, employees, inventory = await asyncio.gather(
            orders_cursor.to_list(None),
            customers_cursor.to_list(None),
            employees_cursor.to_list(None),
            inventory_cursor.to_list(None)
        )
        
        # Process dashboard analytics
        processed_data = await AnalyticsProcessor.process_dashboard_analytics(
            orders, customers, employees, inventory, period
        )
        
        # Add store_id filter if provided
        if store_id:
            processed_data["store_id"] = store_id
            # Filter orders by store_id
            processed_data["kpis"]["total_revenue"] = sum(
                o.get("total_amount", 0) for o in orders 
                if o.get("store_id") == store_id
            )
            processed_data["kpis"]["total_orders"] = len([
                o for o in orders 
                if o.get("store_id") == store_id
            ])
        
        return success_response(data=processed_data)
        
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/analytics/realtime", response_model=StandardResponse[dict])
async def get_realtime_analytics(
    store_id: Optional[str] = Query(None)
):
    """Get real-time analytics for the current day from real data"""
    try:
        # Today's date range
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
        
        # Get collections
        orders_collection = get_collection("orders")
        tables_collection = get_collection("tables")
        
        # Fetch data
        orders_cursor = orders_collection.find(query)
        tables_cursor = tables_collection.find({"status": "occupied"})
        
        orders, active_tables = await asyncio.gather(
            orders_cursor.to_list(None),
            tables_cursor.to_list(None)
        )
        
        # Calculate metrics
        current_hour = datetime.utcnow().hour
        
        # Today's metrics
        today_revenue = sum(o.get("total_amount", 0) for o in orders)
        today_orders = len(orders)
        today_avg_order = today_revenue / today_orders if today_orders > 0 else 0
        
        # Current hour metrics
        current_hour_orders = [
            o for o in orders 
            if AnalyticsProcessor._parse_datetime(o.get("created_at")) and
            AnalyticsProcessor._parse_datetime(o.get("created_at")).hour == current_hour
        ]
        
        current_hour_revenue = sum(o.get("total_amount", 0) for o in current_hour_orders)
        current_hour_orders_count = len(current_hour_orders)
        
        # Calculate trend (compare to previous hour)
        previous_hour = (current_hour - 1) % 24
        previous_hour_orders = [
            o for o in orders 
            if AnalyticsProcessor._parse_datetime(o.get("created_at")) and
            AnalyticsProcessor._parse_datetime(o.get("created_at")).hour == previous_hour
        ]
        
        previous_hour_revenue = sum(o.get("total_amount", 0) for o in previous_hour_orders)
        
        revenue_trend = "up" if current_hour_revenue > previous_hour_revenue else "down"
        revenue_change_pct = abs(
            (current_hour_revenue - previous_hour_revenue) / previous_hour_revenue * 100
        ) if previous_hour_revenue > 0 else 0
        
        # Get pending orders
        pending_orders = [o for o in orders if o.get("status") in ["new", "preparing"]]
        
        # Calculate peak hour
        hourly_revenue = defaultdict(float)
        for order in orders:
            order_date = AnalyticsProcessor._parse_datetime(order.get("created_at"))
            if order_date:
                hour = order_date.hour
                hourly_revenue[hour] += order.get("total_amount", 0)
        
        peak_hour = max(hourly_revenue.items(), key=lambda x: x[1])[0] if hourly_revenue else None
        
        # Prepare response
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
            "peak_hour_today": peak_hour
        }
        
        return success_response(data=response_data)
        
    except Exception as e:
        return handle_generic_exception(e)

# ==================== OTHER ENDPOINTS ====================

@router.get("/reports/available")
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
        }
    ]
    
    return success_response(data=analytics)