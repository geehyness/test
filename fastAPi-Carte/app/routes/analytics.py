# app/routes/analytics.py - FIXED VERSION
from fastapi import APIRouter, Query
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import get_collection
from app.utils.response_helpers import success_response, error_response
from collections import defaultdict

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard_analytics(
    period: str = Query("week", regex="^(day|week|month|quarter|year)$"),
    store_id: Optional[str] = Query(None)
):
    """Get dashboard analytics with KPIs from real data"""
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
        tables_collection = get_collection("tables")
        
        # Fetch data - FIXED
        orders_cursor = orders_collection.find(query)
        customers_cursor = customers_collection.find({})
        employees_cursor = employees_collection.find({})
        inventory_cursor = inventory_collection.find({})
        tables_cursor = tables_collection.find({})
        
        orders = await orders_cursor.to_list(None)
        customers = await customers_cursor.to_list(None)
        employees = await employees_cursor.to_list(None)
        inventory = await inventory_cursor.to_list(None)
        tables = await tables_cursor.to_list(None)
        
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
        
        # Inventory metrics
        inventory_value = sum(p.get("quantity_in_stock", 0) * p.get("unit_cost", 0) for p in inventory)
        low_stock_items = [p for p in inventory if p.get("quantity_in_stock", 0) <= p.get("reorder_level", 0)]
        
        # Calculate hourly performance for today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders = [o for o in orders if (
            isinstance(o.get("created_at"), datetime) and o["created_at"] >= today_start
        )]
        
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
        
        # Get active tables
        active_tables = [t for t in tables if t.get("status") == "occupied"]
        
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
                "low_stock_items": len(low_stock_items),
                "active_tables": len(active_tables)
            },
            "hourly_performance": hourly_data,
            "top_items": top_items,
            "payment_methods": dict(payment_methods),
            "generated_at": datetime.utcnow().isoformat()
        }
        
        # Add peak hour if there's data
        if hourly_data:
            peak_hour = max(hourly_data, key=lambda x: x["revenue"])
            response_data["peak_hour"] = peak_hour
        
        return success_response(data=response_data)
        
    except Exception as e:
        return error_response(
            message=f"Error generating dashboard analytics: {str(e)}",
            code=500
        )

@router.get("/realtime")
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
        
        # Fetch data - FIXED
        orders_cursor = orders_collection.find(query)
        active_tables_cursor = tables_collection.find({"status": "occupied"})
        
        orders = await orders_cursor.to_list(None)
        active_tables = await active_tables_cursor.to_list(None)
        
        # Calculate metrics
        current_hour = datetime.utcnow().hour
        
        # Today's metrics
        today_revenue = sum(o.get("total_amount", 0) for o in orders)
        today_orders = len(orders)
        today_avg_order = today_revenue / today_orders if today_orders > 0 else 0
        
        # Current hour metrics
        current_hour_orders = [
            o for o in orders 
            if (isinstance(o.get("created_at"), datetime) and o["created_at"].hour == current_hour)
        ]
        
        current_hour_revenue = sum(o.get("total_amount", 0) for o in current_hour_orders)
        current_hour_orders_count = len(current_hour_orders)
        
        # Calculate trend (compare to previous hour)
        previous_hour = (current_hour - 1) % 24
        previous_hour_orders = [
            o for o in orders 
            if (isinstance(o.get("created_at"), datetime) and o["created_at"].hour == previous_hour)
        ]
        
        previous_hour_revenue = sum(o.get("total_amount", 0) for o in previous_hour_orders)
        
        revenue_trend = "up" if current_hour_revenue > previous_hour_revenue else "down"
        revenue_change_pct = abs((current_hour_revenue - previous_hour_revenue) / previous_hour_revenue * 100) if previous_hour_revenue > 0 else 0
        
        # Get pending orders
        pending_orders = [o for o in orders if o.get("status") in ["new", "preparing"]]
        
        # Calculate peak hour
        hourly_revenue = defaultdict(float)
        for order in orders:
            order_date = order.get("created_at")
            if isinstance(order_date, datetime):
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
        return error_response(
            message=f"Error generating realtime analytics: {str(e)}",
            code=500
        )

@router.get("/available")
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