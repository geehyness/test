# app/models/response.py - COMPLETE FIXED VERSION
from typing import List, Optional, Any, Dict, Union, Generic, TypeVar
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime, date
from bson import ObjectId

# Generic type variable for the data payload
T = TypeVar('T')

class StandardResponse(BaseModel, Generic[T]):
    """Standard response format for all API endpoints"""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    code: int = 200
    message: str = "success"
    data: Optional[T] = None

class PaginatedResponse(BaseModel, Generic[T]):
    """Standard response for paginated data"""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    code: int = 200
    message: str = "success"
    data: Optional[T] = None
    pagination: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    """Standard error response format"""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    code: int
    message: str
    details: Optional[Dict[str, Any]] = None

# Core POS Entities
class FoodResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    description: str
    price: float
    category_id: str
    image_url: Optional[str] = None
    preparation_time: Optional[int] = None
    allergens: Optional[List[str]] = []
    tenant_id: str
    recipes: Optional[List[Dict]] = []
    store_id: Optional[str] = None
    is_available: Optional[bool] = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class StoreFoodResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    food_id: str
    store_id: str
    is_available: bool = True

class RecipeItemResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    food_id: str
    inventory_product_id: str
    quantity_used: float
    unit_of_measure: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class OrderItemResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
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

class OrderResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    store_id: Optional[str] = None
    table_id: Optional[str] = None
    customer_id: Optional[str] = None
    total_amount: float
    status: str
    notes: str
    items: List[OrderItemResponse] = []
    subtotal_amount: float
    tax_amount: float
    discount_amount: float
    employee_id: Optional[str] = None
    order_type: Optional[str] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    stock_warnings: Optional[List[str]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CategoryResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    description: Optional[str] = None
    store_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class InvCategoryResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    description: Optional[str] = None
    store_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CustomerResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    first_name: str
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    loyalty_points: Optional[int] = 0
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class TableResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    capacity: int
    location: str
    status: str
    current_order_id: Optional[str] = None
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class AccessRoleResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    description: str
    permissions: List[str]
    landing_page: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# HR Entities
class PersonalDetailsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    citizenship: str
    gender: str
    birth_date: str
    age: str

class ContactDetailsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    cell_phone: str
    whatsapp_number: str
    email: str
    address: str

class EmploymentDetailsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    job_title: str
    team: str
    employment_type: str
    location: str

class EmployeeStatusResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    current_status: str
    on_leave_since: Optional[str] = None
    termination_date: Optional[str] = None
    termination_reason: Optional[str] = None

class DepartmentResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class EmployeeResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    user_id: str
    job_title_id: str
    access_role_ids: List[str]
    tenant_id: str
    store_id: str
    main_access_role_id: str
    hire_date: str
    salary: float
    first_name: str
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    employee_id: Optional[str] = None
    full_name: Optional[str] = None
    middle_name: Optional[str] = None
    suffix: Optional[str] = None
    profile_photo_url: Optional[str] = None
    personal_details: Optional[PersonalDetailsResponse] = None
    contact_details: Optional[ContactDetailsResponse] = None
    employment_details: Optional[EmploymentDetailsResponse] = None
    status: Optional[EmployeeStatusResponse] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ReservationResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    customer_id: str
    table_id: Optional[str] = None
    date_time: str
    number_of_guests: int
    status: str
    notes: Optional[str] = None
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ShiftResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    employee_id: str
    start: str
    end: str
    title: Optional[str] = None
    employee_name: Optional[str] = None
    color: Optional[str] = None
    active: Optional[bool] = True
    recurring: Optional[bool] = False
    updated_at: Optional[str] = None
    created_at: Optional[str] = None

class TimesheetResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    timesheet_id: str
    employee_id: str
    start_date: str
    end_date: str
    daily_hours: Dict[str, str]
    total_weekly_hours: str

class TimesheetEntryResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    employee_id: str
    clock_in: str
    clock_out: Optional[str] = None
    duration_minutes: Optional[int] = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class TaxDetailsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    tax_year: str
    efiling_admin: str
    related_docs: str

class CompanyMetricsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    total_employees: int
    active_employees: int
    employees_on_leave: int
    terminated_employees: int
    full_time_employees: int
    part_time_employees: int
    contract_employees: int
    employee_invites: Dict[str, int]

class EmployeeInvitesResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    sent: int
    active: int
    require_attention: int

class CompanyResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    company_id: str
    name: str
    country: str
    tax_details: TaxDetailsResponse
    metrics: CompanyMetricsResponse

class StoreResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    address: str
    phone: str
    email: str
    tenant_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    location: Optional[str] = None
    manager_id: Optional[str] = None
    kiosk_user_id: Optional[str] = None

# Other Entities
class TenantResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    email: str
    password: Optional[str] = None
    remember_token: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class DomainResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    tenant_id: str
    domain: str
    is_primary: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class JobResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    queue: str
    payload: str
    attempts: int
    reserved_at: Optional[int] = None
    available_at: int
    created_at: int

class FailedJobResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    uuid: str
    connection: str
    queue: str
    payload: str
    exception: str
    failed_at: str

class PasswordResetResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    email: str
    token: str
    created_at: str

class UserResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    email: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
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

class PaymentResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    order_id: str
    payment_method_id: str
    amount: float
    payment_date: str
    transaction_id: Optional[str] = None
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class StockResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    food_id: str
    quantity: int
    unit_id: str
    supplier_id: str
    last_restock_date: str
    expiration_date: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class StockAdjustmentResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    stock_id: str
    quantity_change: int
    reason: str
    adjustment_date: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class TaxResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    percentage: float
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class JobTitleResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    title: str
    description: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class PaymentMethodResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    description: str
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class BrandResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    description: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class UnitResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    symbol: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class SupplierResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    contact_person: str
    phone: str
    email: str
    address: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ContactMessageResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    email: str
    subject: str
    message: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class InventoryProductResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
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
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# Payroll Entities
class PayrollDeductionResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    payroll_id: str
    type: str
    description: str
    amount: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class PayrollResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    employee_id: str
    pay_period_start: str
    pay_period_end: str
    payment_cycle: str
    gross_pay: float
    tax_deductions: float
    net_pay: float
    status: str
    hours_worked: float
    overtime_hours: float
    overtime_rate: float
    deductions: Optional[List[PayrollDeductionResponse]] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    store_id: str

class PayrollSettingsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    store_id: str
    default_payment_cycle: str
    tax_rate: float
    overtime_multiplier: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# Purchase Order and Goods Receipt
class PurchaseOrderItemResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    inventory_product_id: str
    quantity: float
    unit_of_measure: str
    unit_cost: float
    total_cost: float
    notes: Optional[str] = None

class PurchaseOrderResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    po_number: str
    supplier_id: str
    site_id: str
    status: str
    order_date: str
    expected_delivery_date: str
    total_amount: float
    ordered_by: str
    notes: Optional[str] = None
    items: List[PurchaseOrderItemResponse] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class GoodsReceiptItemResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    inventory_product_id: str
    purchase_order_id: str
    received_quantity: float
    unit_of_measure: str
    condition: str
    notes: Optional[str] = None

class GoodsReceiptResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    receipt_number: str
    purchase_order_id: str
    store_id: str
    receipt_date: str
    received_by: str
    items: List[GoodsReceiptItemResponse] = []
    receiving_bin_id: Optional[str] = None
    status: Optional[str] = None
    received_items: Optional[List[Dict]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class SiteResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    name: str
    address: str
    type: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# Generic response for success messages
class SuccessResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    message: str

# Health check response
class HealthResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    status: str
    database: str

# Login response
class LoginResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    access_token: str
    token_type: str
    employee: EmployeeResponse

class ReportResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: str
    user_id: str
    user_name: str
    user_role: str
    attempted_path: str
    attempts: int
    last_attempt_at: str
    created_at: Optional[str] = None