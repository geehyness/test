# app/models/core.py
from typing import Optional, List, Dict, Any
from pydantic import Field, EmailStr
from datetime import datetime
from .base import MongoModel, PyObjectId

class RecipeItem(MongoModel):
    inventory_product_id: str
    quantity_used: float
    unit_of_measure: str

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

class StoreFood(MongoModel):
    food_id: str
    store_id: str
    is_available: bool = True

class OrderItem(MongoModel):
    order_id: str
    food_id: str
    quantity: int
    price: float
    sub_total: float
    notes: Optional[str] = None
    name: str
    price_at_sale: float

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
    order_type: Optional[str] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None

class Category(MongoModel):
    name: str
    description: Optional[str] = None
    store_id: Optional[str] = None

class Customer(MongoModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    loyalty_points: Optional[int] = 0
    store_id: str

class Table(MongoModel):
    name: str
    capacity: int
    location: str
    status: str
    current_order_id: Optional[str] = None
    store_id: str

class Store(MongoModel):
    name: str
    address: str
    phone: str
    email: str
    tenant_id: str
    location: Optional[str] = None
    manager_id: Optional[str] = None
    kiosk_user_id: Optional[str] = None

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
    store_id: str = Field(alias="site_id")
    status: str
    order_date: datetime
    expected_delivery_date: datetime
    total_amount: float
    ordered_by: str
    notes: Optional[str] = None
    items: List[PurchaseOrderItem] = []

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
    receipt_date: datetime
    received_by: str
    items: List[GoodsReceiptItem] = []

class User(MongoModel):
    email: EmailStr
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: str
    email_verified_at: Optional[datetime] = None
    remember_token: Optional[str] = None

class Payment(MongoModel):
    order_id: str
    payment_method_id: str
    amount: float
    payment_date: datetime
    transaction_id: Optional[str] = None
    status: str

class Tax(MongoModel):
    name: str
    percentage: float
    is_active: bool = True

class PaymentMethod(MongoModel):
    name: str
    description: str
    is_active: bool = True

class Brand(MongoModel):
    name: str
    description: Optional[str] = None

class ContactMessage(MongoModel):
    name: str
    email: str
    subject: str
    message: str

class Report(MongoModel):
    user_id: str
    user_name: str
    user_role: str
    attempted_path: str
    attempts: int
    last_attempt_at: datetime

class Reservation(MongoModel):
    customer_id: str
    table_id: Optional[str] = None
    date_time: datetime
    number_of_guests: int
    status: str
    notes: Optional[str] = None
    store_id: str

class Domain(MongoModel):
    tenant_id: str
    domain: str
    is_primary: bool = False

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
    failed_at: datetime

class PasswordReset(MongoModel):
    email: str
    token: str
    created_at: datetime

class Tenant(MongoModel):
    name: str
    email: str
    password: str
    remember_token: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None