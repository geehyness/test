# app/models/core.py
from typing import Optional, List, Dict, Any
from pydantic import Field, EmailStr
# At the top of core.py, ensure proper imports  
from datetime import datetime, date  # Add date import if needed
import math
from .base import MongoModel, PyObjectId

# Recipe model for embedded recipes
class RecipeItem(MongoModel):
    id: Optional[str] = None
    food_id: str
    inventory_product_id: str
    quantity_used: float
    unit_of_measure: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Food(MongoModel):
    name: str
    description: str
    price: float
    category_id: str
    image_url: Optional[str] = None
    preparation_time: Optional[int] = None
    allergens: Optional[List[str]] = []
    tenant_id: str
    recipes: Optional[List[RecipeItem]] = []
    store_id: Optional[str] = None
    is_available: Optional[bool] = True

class StoreFood(MongoModel):
    food_id: str
    store_id: str
    is_available: bool = True

class OrderItem(MongoModel):
    id: Optional[str] = None
    order_id: str
    food_id: str
    quantity: int
    price: float
    sub_total: float
    notes: Optional[str] = None
    name: str
    price_at_sale: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Order(MongoModel):
    store_id: Optional[str] = None
    table_id: Optional[str] = None
    customer_id: Optional[str] = None
    total_amount: float
    status: str
    notes: str
    items: List[OrderItem] = []
    subtotal_amount: float
    tax_amount: float
    discount_amount: float
    employee_id: Optional[str] = None
    order_type: Optional[str] = None  # "dine-in" | "takeaway"
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Category(MongoModel):
    name: str
    description: Optional[str] = None
    store_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class InvCategory(MongoModel):
    name: str
    description: Optional[str] = None
    store_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Customer(MongoModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    loyalty_points: Optional[int] = 0
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Table(MongoModel):
    name: str
    capacity: int
    location: str
    status: str
    current_order_id: Optional[str] = None
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Store(MongoModel):
    name: str
    address: str
    phone: str
    email: str
    tenant_id: str
    location: Optional[str] = None
    manager_id: Optional[str] = None
    kiosk_user_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class PurchaseOrderItem(MongoModel):
    inventory_product_id: str
    quantity: float
    unit_of_measure: str
    unit_cost: float
    total_cost: float
    notes: Optional[str] = None

class PurchaseOrder(MongoModel):
    po_number: str
    supplier_id: str
    site_id: str
    status: str
    order_date: str
    expected_delivery_date: str
    total_amount: float
    ordered_by: str
    notes: Optional[str] = None
    items: List[PurchaseOrderItem] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class GoodsReceiptItem(MongoModel):
    inventory_product_id: str
    purchase_order_id: str
    received_quantity: float
    unit_of_measure: str
    condition: str
    notes: Optional[str] = None

class GoodsReceipt(MongoModel):
    receipt_number: str
    purchase_order_id: str
    store_id: str
    receipt_date: str
    received_by: str
    items: List[GoodsReceiptItem] = []
    receiving_bin_id: Optional[str] = None
    status: Optional[str] = None
    received_items: Optional[List[Dict]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class User(MongoModel):
    name: Optional[str] = None
    email: EmailStr
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None  # Make password optional
    email_verified_at: Optional[str] = None
    remember_token: Optional[str] = None
    cashAccounts: Optional[List[Any]] = []
    cardAccounts: Optional[List[Any]] = []
    onlineAccounts: Optional[List[Any]] = []
    gpayAccounts: Optional[List[Any]] = []
    phonepeAccounts: Optional[List[Any]] = []
    amazonpayAccounts: Optional[List[Any]] = []
    locations: Optional[List[Any]] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self, **kwargs) -> dict:
        """Convert model to dictionary with proper handling for all fields"""
        data = super().to_dict(**kwargs)
        # Ensure all optional lists are included
        for field in ['cashAccounts', 'cardAccounts', 'onlineAccounts', 'gpayAccounts', 'phonepeAccounts', 'amazonpayAccounts', 'locations']:
            if field not in data or data[field] is None:
                data[field] = []
        return data

class Payment(MongoModel):
    order_id: str
    payment_method_id: str
    amount: float
    payment_date: str
    transaction_id: Optional[str] = None
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Tax(MongoModel):
    name: str
    percentage: float
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class PaymentMethod(MongoModel):
    name: str
    description: str
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Brand(MongoModel):
    name: str
    description: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ContactMessage(MongoModel):
    name: str
    email: str
    subject: str
    message: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Report(MongoModel):
    user_id: str
    user_name: str
    user_role: str
    attempted_path: str
    attempts: int
    last_attempt_at: str
    created_at: Optional[str] = None

class Reservation(MongoModel):
    customer_id: str
    table_id: Optional[str] = None
    date_time: str
    number_of_guests: int
    status: str
    notes: Optional[str] = None
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Domain(MongoModel):
    tenant_id: str
    domain: str
    is_primary: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Job(MongoModel):
    queue: str
    payload: str
    attempts: int
    reserved_at: Optional[int] = None
    available_at: int
    created_at: int

class FailedJob(MongoModel):
    uuid: str
    connection: str
    queue: str
    payload: str
    exception: str
    failed_at: str

class PasswordReset(MongoModel):
    email: str
    token: str
    created_at: str

class Tenant(MongoModel):
    name: str
    email: str
    password: str
    remember_token: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Site(MongoModel):
    name: str
    address: str
    type: str
    store_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Stock(MongoModel):
    food_id: str
    quantity: int
    unit_id: str
    supplier_id: str
    last_restock_date: str
    expiration_date: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class StockAdjustment(MongoModel):
    stock_id: str
    quantity_change: int
    reason: str
    adjustment_date: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None