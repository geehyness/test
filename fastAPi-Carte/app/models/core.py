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
    kiosk_user_id: str

class Tenant(MongoModel):
    name: str
    email: EmailStr
    password: Optional[str] = None
    remember_token: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None