# app/models/inventory.py
from typing import Optional
from pydantic import Field
from datetime import datetime
from .base import MongoModel

class InventoryProduct(MongoModel):
    name: str
    description: Optional[str] = None
    sku: str
    unit_of_measure: str
    tenant_id: str
    unit_cost: float
    quantity_in_stock: float
    reorder_level: float
    supplier_id: Optional[str] = None
    inv_category_id: Optional[str] = None
    location_in_warehouse: Optional[str] = None
    last_restocked_at: Optional[datetime] = None

class Supplier(MongoModel):
    name: str
    contact_person: str
    phone: str
    email: str
    address: str

class Unit(MongoModel):
    name: str
    symbol: str

class Stock(MongoModel):
    inventory_product_id: str
    quantity: float
    unit_id: str
    supplier_id: str
    last_restock_date: datetime
    expiration_date: Optional[datetime] = None

class StockAdjustment(MongoModel):
    stock_id: str
    quantity_change: float
    reason: str
    adjustment_date: datetime