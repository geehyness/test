# app/utils/analytics_helpers.py
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import statistics
from collections import defaultdict

class AnalyticsHelpers:
    """Helper functions for analytics calculations"""
    
    @staticmethod
    def calculate_moving_average(data: List[float], window: int = 7) -> List[float]:
        """Calculate simple moving average"""
        if len(data) < window:
            return data
        
        moving_avg = []
        for i in range(len(data)):
            if i < window - 1:
                moving_avg.append(sum(data[:i+1]) / (i+1))
            else:
                moving_avg.append(sum(data[i-window+1:i+1]) / window)
        
        return moving_avg
    
    @staticmethod
    def calculate_growth_rate(current: float, previous: float) -> float:
        """Calculate percentage growth rate"""
        if previous == 0:
            return 0 if current == 0 else 100
        return ((current - previous) / previous) * 100
    
    @staticmethod
    def detect_anomalies(data: List[float], threshold: float = 2.0) -> List[Tuple[int, float]]:
        """Detect anomalies using standard deviation"""
        if len(data) < 3:
            return []
        
        mean = statistics.mean(data)
        stdev = statistics.stdev(data) if len(data) > 1 else 0
        
        anomalies = []
        for i, value in enumerate(data):
            if stdev > 0 and abs(value - mean) > threshold * stdev:
                anomalies.append((i, value))
        
        return anomalies
    
    @staticmethod
    def calculate_seasonality(data: List[float], period: int = 7) -> Dict[str, Any]:
        """Calculate seasonal patterns in data"""
        if len(data) < period * 2:
            return {"detected": False, "message": "Insufficient data"}
        
        # Calculate average for each position in the period
        seasonal_pattern = []
        for i in range(period):
            values = []
            for j in range(i, len(data), period):
                values.append(data[j])
            
            if values:
                seasonal_pattern.append(statistics.mean(values))
        
        # Normalize the pattern
        pattern_mean = statistics.mean(seasonal_pattern)
        normalized_pattern = [v / pattern_mean if pattern_mean > 0 else v for v in seasonal_pattern]
        
        # Calculate seasonality strength
        deviations = [abs(v - 1) for v in normalized_pattern]
        strength = statistics.mean(deviations) * 100
        
        return {
            "detected": strength > 10,
            "strength": strength,
            "pattern": normalized_pattern,
            "period": period
        }
    
    @staticmethod
    def forecast_arima_simple(data: List[float], steps: int = 7) -> List[float]:
        """Simple ARIMA-like forecasting"""
        if len(data) < 3:
            return [data[-1]] * steps if data else [0] * steps
        
        # Simple autoregressive model: next = avg of last 3 + trend
        last_values = data[-3:]
        avg_last = statistics.mean(last_values)
        
        # Calculate simple trend
        if len(data) >= 6:
            first_half = statistics.mean(data[-6:-3])
            second_half = statistics.mean(data[-3:])
            trend = (second_half - first_half) / 3
        else:
            trend = 0
        
        # Generate forecast
        forecast = []
        current = avg_last
        
        for _ in range(steps):
            current = current + trend
            forecast.append(max(current, 0))  # Ensure non-negative
        
        return forecast
    
    @staticmethod
    def calculate_abc_analysis(items: List[Dict[str, Any]], value_field: str = "revenue") -> Dict[str, Any]:
        """Perform ABC analysis on items"""
        if not items:
            return {"A": [], "B": [], "C": []}
        
        # Sort items by value
        sorted_items = sorted(items, key=lambda x: x.get(value_field, 0), reverse=True)
        
        total_value = sum(item.get(value_field, 0) for item in sorted_items)
        
        if total_value == 0:
            return {"A": [], "B": [], "C": sorted_items}
        
        # Classify items
        a_items = []
        b_items = []
        c_items = []
        
        cumulative_value = 0
        
        for item in sorted_items:
            item_value = item.get(value_field, 0)
            cumulative_value += item_value
            cumulative_percentage = (cumulative_value / total_value) * 100
            
            item_copy = item.copy()
            item_copy["cumulative_percentage"] = cumulative_percentage
            
            if cumulative_percentage <= 80:
                a_items.append(item_copy)
            elif cumulative_percentage <= 95:
                b_items.append(item_copy)
            else:
                c_items.append(item_copy)
        
        return {
            "A": {
                "items": a_items,
                "count": len(a_items),
                "percentage": (sum(item.get(value_field, 0) for item in a_items) / total_value) * 100
            },
            "B": {
                "items": b_items,
                "count": len(b_items),
                "percentage": (sum(item.get(value_field, 0) for item in b_items) / total_value) * 100
            },
            "C": {
                "items": c_items,
                "count": len(c_items),
                "percentage": (sum(item.get(value_field, 0) for item in c_items) / total_value) * 100
            }
        }
    
    @staticmethod
    def calculate_customer_lifetime_value(
        orders: List[Dict[str, Any]],
        acquisition_cost: float = 0
    ) -> Dict[str, Any]:
        """Calculate Customer Lifetime Value metrics"""
        if not orders:
            return {
                "total_customers": 0,
                "avg_clv": 0,
                "total_clv": 0,
                "roi": 0
            }
        
        # Group orders by customer
        customer_orders = defaultdict(list)
        for order in orders:
            customer_id = order.get("customer_id")
            if customer_id:
                customer_orders[customer_id].append(order)
        
        # Calculate CLV for each customer
        customer_clv = {}
        for customer_id, cust_orders in customer_orders.items():
            total_spent = sum(order.get("total_amount", 0) for order in cust_orders)
            order_count = len(cust_orders)
            
            # Simple CLV: total spent - acquisition cost
            clv = total_spent - acquisition_cost
            
            customer_clv[customer_id] = {
                "total_spent": total_spent,
                "order_count": order_count,
                "avg_order_value": total_spent / order_count if order_count > 0 else 0,
                "clv": clv
            }
        
        # Calculate overall metrics
        total_customers = len(customer_clv)
        total_clv = sum(data["clv"] for data in customer_clv.values())
        avg_clv = total_clv / total_customers if total_customers > 0 else 0
        
        # Calculate ROI if acquisition cost > 0
        total_acquisition_cost = acquisition_cost * total_customers
        roi = ((total_clv - total_acquisition_cost) / total_acquisition_cost * 100) if total_acquisition_cost > 0 else 0
        
        # Segment customers by CLV
        high_value = [cid for cid, data in customer_clv.items() if data["clv"] > avg_clv * 2]
        medium_value = [cid for cid, data in customer_clv.items() if avg_clv <= data["clv"] <= avg_clv * 2]
        low_value = [cid for cid, data in customer_clv.items() if data["clv"] < avg_clv]
        
        return {
            "total_customers": total_customers,
            "avg_clv": avg_clv,
            "total_clv": total_clv,
            "roi": roi,
            "segments": {
                "high_value": {
                    "count": len(high_value),
                    "percentage": (len(high_value) / total_customers) * 100 if total_customers > 0 else 0
                },
                "medium_value": {
                    "count": len(medium_value),
                    "percentage": (len(medium_value) / total_customers) * 100 if total_customers > 0 else 0
                },
                "low_value": {
                    "count": len(low_value),
                    "percentage": (len(low_value) / total_customers) * 100 if total_customers > 0 else 0
                }
            },
            "customer_details": customer_clv
        }