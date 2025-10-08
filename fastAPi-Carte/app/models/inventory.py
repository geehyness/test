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
    last_restocked_at: Optional[str] = None
    store_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Supplier(MongoModel):
    name: str
    contact_person: str
    phone: str
    email: str
    address: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Unit(MongoModel):
    name: str
    symbol: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Stock(MongoModel):
    inventory_product_id: str
    quantity: float
    unit_id: str
    supplier_id: str
    last_restock_date: str
    expiration_date: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class StockAdjustment(MongoModel):
    stock_id: str
    quantity_change: float
    reason: str
    adjustment_date: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class InvCategory(MongoModel):
    name: str
    description: Optional[str] = None
    store_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None