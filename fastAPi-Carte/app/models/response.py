# app/models/response.py - COMPLETE FIXED VERSION
from typing import List, Optional, Any, Dict, Union, Generic, TypeVar
from pydantic import BaseModel, EmailStr, ConfigDict, validator
from datetime import datetime, date
from bson import ObjectId

# ADD THIS IMPORT to fix circular dependency
# from .core import PaymentAttempt  # Remove this if it causes circular import

# Create a common encoder dictionary
COMMON_ENCODERS = {
    ObjectId: str,
    datetime: lambda dt: dt.isoformat(), # 💡 Add here as well
}


# Generic type variable for the data payload
T = TypeVar('T')

class StandardResponse(BaseModel, Generic[T]):
    """Standard response format for all API endpoints"""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS # Use the common encoders
    )
    
    code: int = 200
    message: str = "success"
    data: Optional[T] = None

class PaginatedResponse(BaseModel, Generic[T]):
    """Standard response for paginated data"""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    code: int = 200
    message: str = "success"
    data: Optional[T] = None
    pagination: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    """Standard error response format"""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    code: int
    message: str
    details: Optional[Dict[str, Any]] = None

# Add to response.py
class PaymentAttemptResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    order_id: str
    payment_gateway: str
    amount: float
    reference: str
    status: str
    payment_data: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    cancellation_reason: Optional[str] = None


# Recipe Item Response
class RecipeItemResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    food_id: str
    inventory_product_id: str
    quantity_used: float
    unit_of_measure: str

# Core POS Entities
class FoodResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    description: str
    price: float
    category_id: str
    image_urls: Optional[List[str]] = []  # CHANGE to plural
    preparation_time: Optional[int] = None
    allergens: Optional[List[str]] = []
    tenant_id: str
    # CHANGED: Use RecipeItemResponse instead of List[Dict]
    recipes: Optional[List[RecipeItemResponse]] = []
    store_id: Optional[str] = None
    is_available: Optional[bool] = True

class StoreFoodResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    food_id: str
    store_id: str
    is_available: bool = True

class OrderItemResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: Optional[str] = None  # Make optional here too
    order_id: str
    food_id: str
    quantity: int
    price: float
    sub_total: float
    notes: Optional[str] = None
    name: str
    price_at_sale: float

class OrderResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
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
    stock_warnings: Optional[List[Dict[str, Any]]] = None
    created_at: Optional[str] = None  # Keep as string for API response
    updated_at: Optional[str] = None  # Keep as string for API response
    cancellation_reason: Optional[str] = None
    payment_reference: Optional[str] = None
    transaction_id: Optional[str] = None
    payment_details: Optional[Dict[str, Any]] = None

class CategoryResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None  # KEEP singular
    store_id: Optional[str] = None

class InvCategoryResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    description: Optional[str] = None
    store_id: Optional[str] = None

class CustomerResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    first_name: str
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    loyalty_points: Optional[int] = 0
    store_id: str

class TableResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    capacity: int
    location: str
    status: str
    current_order_id: Optional[str] = None
    store_id: str

class AccessRoleResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    description: str
    permissions: List[str]
    landing_page: str

# HR Entities - Add response models for nested objects
class PersonalDetailsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    citizenship: str
    gender: str
    birth_date: str
    age: str

class ContactDetailsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    cell_phone: str
    whatsapp_number: str
    email: str
    address: str

class EmploymentDetailsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    job_title: str
    team: str
    employment_type: str
    location: str

class EmployeeStatusResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    current_status: str
    on_leave_since: Optional[str] = None
    termination_date: Optional[str] = None
    termination_reason: Optional[str] = None

class DepartmentResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda v: v.isoformat() if v else None}
    )
    
    id: str
    name: str
    store_id: str
    created_at: Optional[datetime] = None  # Changed from str to datetime
    updated_at: Optional[datetime] = None  # Changed from str to datetime


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda v: v.isoformat() if v else None}
    )
    
    id: str
    user_id: str
    job_title_id: str
    access_role_ids: List[str]
    tenant_id: str
    store_id: str
    main_access_role_id: str
    hire_date: datetime  # CHANGED from str to datetime  <--- THIS TOO
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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ReservationResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    customer_id: str
    table_id: Optional[str] = None
    date_time: str
    number_of_guests: int
    status: str
    notes: Optional[str] = None
    store_id: str

# Update ShiftResponse
class ShiftResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    employee_id: str
    start: datetime  # Changed from str to datetime
    end: datetime    # Changed from str to datetime
    title: Optional[str] = None
    employee_name: Optional[str] = None
    color: Optional[str] = None
    active: Optional[bool] = True
    recurring: Optional[bool] = False
    updated_at: Optional[datetime] = None  # Changed from str to datetime
    created_at: Optional[datetime] = None  # Changed from str to datetime


class TimesheetResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    timesheet_id: str
    employee_id: str
    start_date: str
    end_date: str
    daily_hours: Dict[str, str]
    total_weekly_hours: str

# Update TimesheetEntryResponse
class TimesheetEntryResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    employee_id: str
    clock_in: datetime  # Changed from str to datetime
    clock_out: Optional[datetime] = None  # Changed from str to datetime
    duration_minutes: Optional[int] = 0
    created_at: Optional[datetime] = None  # Changed from str to datetime
    updated_at: Optional[datetime] = None  # Changed from str to datetime

class TaxDetailsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    tax_year: str
    efiling_admin: str
    related_docs: str

class CompanyMetricsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
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
        json_encoders=COMMON_ENCODERS
    )
    
    sent: int
    active: int
    require_attention: int

class CompanyResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    company_id: str
    name: str
    country: str
    tax_details: TaxDetailsResponse
    metrics: CompanyMetricsResponse

class StoreResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    address: str
    phone: str
    email: str
    tenant_id: str
    location: Optional[str] = None
    manager_id: Optional[str] = None
    kiosk_user_id: Optional[str] = None

# Payroll Deduction Response
class PayrollDeductionResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    payroll_id: str
    type: str
    description: str
    amount: float

class PayrollResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    employee_id: str
    pay_period_start: datetime  # Keep as datetime
    pay_period_end: datetime    # Keep as datetime
    payment_cycle: str
    gross_pay: float
    tax_deductions: float
    net_pay: float
    status: str
    hours_worked: float
    overtime_hours: float
    overtime_rate: float
    # CHANGED: Use PayrollDeductionResponse for nested objects
    deductions: Optional[List[PayrollDeductionResponse]] = []
    store_id: str

class PayrollSettingsResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    store_id: str
    default_payment_cycle: str
    tax_rate: float
    overtime_multiplier: float
    overtime_threshold: float  # ADD THIS
    pay_day: Optional[int] = None  # ADD THIS
    auto_process: bool = False  # ADD THIS
    include_benefits: bool = False  # ADD THIS
    benefits_rate: float = 0.05  # ADD THIS

# 1. Deduction Preview
class PayrollDeductionPreviewResponse(PayrollDeductionResponse):
    """Schema for a Payroll Deduction *before* it is saved."""
    id: Optional[str] = None # Allows id to be None during calculation

# 2. Main Payroll Preview
class PayrollPreviewResponse(BaseModel):
    """Schema for a Payroll *preview* from the /calculate endpoint."""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None  # Add this field
    pay_period_start: datetime
    pay_period_end: datetime
    payment_cycle: str
    hourly_rate: Optional[float] = None  # Add this field
    gross_pay: float
    tax_deductions: float
    net_pay: float
    status: str
    hours_worked: float
    overtime_hours: float
    overtime_rate: float
    deductions: Optional[List[PayrollDeductionPreviewResponse]] = []
    store_id: str

class TenantResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS  # Use the common encoders
    )
    
    id: str
    name: str
    email: str
    password: Optional[str] = None
    remember_token: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    customer_page_settings: Optional[dict] = None
    created_at: Optional[datetime] = None  # Use datetime like other entities
    updated_at: Optional[datetime] = None  # Use datetime like other entities
    
    @validator('customer_page_settings', pre=True)
    def validate_customer_page_settings(cls, v):
        if v is None:
            return {}
        return v


class DomainResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    tenant_id: str
    domain: str
    is_primary: bool = False

class JobResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
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
        json_encoders=COMMON_ENCODERS
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
        json_encoders=COMMON_ENCODERS
    )
    
    email: str
    token: str
    created_at: str

class UserResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    email: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_verified_at: Optional[datetime] = None
    remember_token: Optional[str] = None
    cashAccounts: Optional[List[Any]] = []
    cardAccounts: Optional[List[Any]] = []
    onlineAccounts: Optional[List[Any]] = []
    gpayAccounts: Optional[List[Any]] = []
    phonepeAccounts: Optional[List[Any]] = []
    amazonpayAccounts: Optional[List[Any]] = []
    locations: Optional[List[Any]] = []

class PaymentResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    order_id: str
    payment_method_id: str
    amount: float
    payment_date: str
    transaction_id: Optional[str] = None
    status: str

class StockResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    food_id: str
    quantity: int
    unit_id: str
    supplier_id: str
    last_restock_date: str
    expiration_date: Optional[str] = None

class StockAdjustmentResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    stock_id: str
    quantity_change: int
    reason: str
    adjustment_date: str

class TaxResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    percentage: float
    is_active: bool = True

class JobTitleResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda v: v.isoformat() if v else None}
    )
    
    id: str
    title: str
    description: str
    created_at: Optional[datetime] = None  # Changed from str to datetime
    updated_at: Optional[datetime] = None  # Changed from str to datetime

class PaymentMethodResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    description: str
    is_active: bool = True

class BrandResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    description: Optional[str] = None

class UnitResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    symbol: str

class SupplierResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    contact_person: str
    phone: str
    email: str
    address: str

class ContactMessageResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    email: str
    subject: str
    message: str

class InventoryProductResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
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

# Payroll Entities
class PayrollDeductionResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    payroll_id: str
    type: str
    description: str
    amount: float

# Update PayrollResponse to match timesheet pattern
class PayrollResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    employee_id: str
    pay_period_start: datetime  # Changed from str to datetime (like TimesheetEntryResponse)
    pay_period_end: datetime    # Changed from str to datetime (like TimesheetEntryResponse)
    payment_cycle: str
    gross_pay: float
    tax_deductions: float
    net_pay: float
    status: str
    hours_worked: float
    overtime_hours: float
    overtime_rate: float
    deductions: Optional[List[PayrollDeductionResponse]] = []
    store_id: str

# Update PayrollPreviewResponse similarly
class PayrollPreviewResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    pay_period_start: datetime  # Changed from str to datetime
    pay_period_end: datetime    # Changed from str to datetime
    payment_cycle: str
    hourly_rate: Optional[float] = None
    gross_pay: float
    tax_deductions: float
    net_pay: float
    status: str
    hours_worked: float
    overtime_hours: float
    overtime_rate: float
    deductions: Optional[List[PayrollDeductionPreviewResponse]] = []
    store_id: str

# Purchase Order and Goods Receipt
class PurchaseOrderItemResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
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
        json_encoders=COMMON_ENCODERS
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

class GoodsReceiptItemResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
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
        json_encoders=COMMON_ENCODERS
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

class SiteResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    name: str
    address: str
    type: str

# Generic response for success messages
class SuccessResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    message: str

# Health check response
class HealthResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    status: str
    database: str

# Login response
class LoginResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    access_token: str
    token_type: str
    employee: EmployeeResponse

class ReportResponse(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders=COMMON_ENCODERS
    )
    
    id: str
    user_id: str
    user_name: str
    user_role: str
    attempted_path: str
    attempts: int
    last_attempt_at: str
    created_at: Optional[datetime] = None