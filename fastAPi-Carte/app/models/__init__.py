# app/models/__init__.py - UPDATED
# Update the imports to include all models
from .base import MongoModel, PyObjectId
from .core import (
    Food, StoreFood, RecipeItem, Order, OrderItem, Category, InvCategory,
    Customer, Table, Store, PurchaseOrder, PurchaseOrderItem, GoodsReceipt,
    GoodsReceiptItem, User, Payment, Tax, PaymentMethod, Brand, ContactMessage,
    Report, Reservation, Domain, Job, FailedJob, PasswordReset, Tenant, Site,
    Stock, StockAdjustment
)
from .hr import (
    Employee, PersonalDetails, ContactDetails, EmploymentDetails, EmployeeStatus,
    AccessRole, JobTitle, Shift, TimesheetEntry, Payroll, PayrollDeduction,
    PayrollSettings, Company, Timesheet, TaxDetails, CompanyMetrics, EmployeeInvites, Department
)
from .inventory import InventoryProduct, Supplier, Unit, Stock as InvStock, StockAdjustment as InvStockAdjustment, InvCategory as InventoryCategory
from .response import (
    StandardResponse, PaginatedResponse, ErrorResponse,
    FoodResponse, OrderResponse, CategoryResponse, CustomerResponse, TableResponse,
    StoreResponse, PurchaseOrderResponse, GoodsReceiptResponse, ReservationResponse,
    EmployeeResponse, ShiftResponse, TimesheetEntryResponse, PayrollResponse,
    AccessRoleResponse, JobTitleResponse, PayrollSettingsResponse, TimesheetResponse,
    InventoryProductResponse, SupplierResponse, UnitResponse, StockResponse,
    StockAdjustmentResponse, InvCategoryResponse, LoginResponse, SuccessResponse,
    HealthResponse, DepartmentResponse, UserResponse, PaymentResponse, TaxResponse,
    PaymentMethodResponse, BrandResponse, ContactMessageResponse, ReportResponse,
    DomainResponse, TenantResponse, SiteResponse, JobResponse, FailedJobResponse,
    PasswordResetResponse, PayrollPreviewResponse, # New
    PayrollDeductionPreviewResponse, # New
    PaymentAttemptResponse
)

__all__ = [
    # Base models
    "MongoModel", "PyObjectId",
    
    # Core models
    "Food", "StoreFood", "RecipeItem", "Order", "OrderItem", "Category", "InvCategory",
    "Customer", "Table", "Store", "PurchaseOrder", "PurchaseOrderItem", "GoodsReceipt",
    "GoodsReceiptItem", "User", "Payment", "Tax", "PaymentMethod", "Brand", "ContactMessage",
    "Report", "Reservation", "Domain", "Job", "FailedJob", "PasswordReset", "Tenant", "Site",
    "Stock", "StockAdjustment",
    
    # HR models
    "Employee", "PersonalDetails", "ContactDetails", "EmploymentDetails", "EmployeeStatus",
    "AccessRole", "JobTitle", "Shift", "TimesheetEntry", "Payroll", "PayrollDeduction",
    "PayrollSettings", "Company", "Timesheet", "TaxDetails", "CompanyMetrics", "EmployeeInvites", "Department",
    
    # Inventory models
    "InventoryProduct", "Supplier", "Unit", "InvStock", "InvStockAdjustment", "InventoryCategory",
    
    # Response models
    "StandardResponse", "PaginatedResponse", "ErrorResponse",
    "FoodResponse", "OrderResponse", "CategoryResponse", "CustomerResponse", "TableResponse",
    "StoreResponse", "PurchaseOrderResponse", "GoodsReceiptResponse", "ReservationResponse",
    "EmployeeResponse", "ShiftResponse", "TimesheetEntryResponse", "PayrollResponse",
    "AccessRoleResponse", "JobTitleResponse", "PayrollSettingsResponse", "TimesheetResponse",
    "InventoryProductResponse", "SupplierResponse", "UnitResponse", "StockResponse",
    "StockAdjustmentResponse", "InvCategoryResponse", "LoginResponse", "SuccessResponse",
    "HealthResponse", "DepartmentResponse", "UserResponse", "PaymentResponse", "TaxResponse",
    "PaymentMethodResponse", "BrandResponse", "ContactMessageResponse", "ReportResponse",
    "DomainResponse", "TenantResponse", "SiteResponse", "JobResponse", "FailedJobResponse",
    "PasswordResetResponse", "PaymentAttemptResponse"
]