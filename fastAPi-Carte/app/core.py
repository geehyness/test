# app/core.py - Core models and business logic
from .base import MongoModel
from typing import Optional, List, Dict, Any
from pydantic import Field, EmailStr
from datetime import datetime

# Add your core models here that were previously missing
class CoreBusinessLogic:
    """Core business logic that can be shared across modules"""
    
    @staticmethod
    def calculate_order_totals(items: List[Dict]) -> Dict[str, float]:
        """Calculate order subtotal, tax, and total"""
        subtotal = sum(item.get('price', 0) * item.get('quantity', 0) for item in items)
        tax = subtotal * 0.1  # 10% tax
        total = subtotal + tax
        
        return {
            "subtotal": subtotal,
            "tax": tax,
            "total": total
        }

# Add any missing core models that might be needed
class SimpleModel(MongoModel):
    """A simple model for testing"""
    name: str
    description: Optional[str] = None