from typing import Optional, List
from pydantic import Field
from .base import MongoModel

class PersonalDetails(MongoModel):
    citizenship: str
    gender: str
    birth_date: str
    age: str

class ContactDetails(MongoModel):
    cell_phone: str
    whatsapp_number: str
    email: str
    address: str

class EmploymentDetails(MongoModel):
    job_title: str
    team: str
    employment_type: str
    location: str

class EmployeeStatus(MongoModel):
    current_status: str
    on_leave_since: Optional[str] = None
    termination_date: Optional[str] = None
    termination_reason: Optional[str] = None

class Employee(MongoModel):
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
    personal_details: Optional[PersonalDetails] = None
    contact_details: Optional[ContactDetails] = None
    employment_details: Optional[EmploymentDetails] = None
    status: Optional[EmployeeStatus] = None

class AccessRole(MongoModel):
    name: str
    description: str
    permissions: List[str]
    landing_page: str

class Shift(MongoModel):
    employee_id: str
    start: str
    end: str
    title: Optional[str] = None
    employee_name: Optional[str] = None
    color: Optional[str] = None
    active: Optional[bool] = True
    recurring: Optional[bool] = False

class TimesheetEntry(MongoModel):
    employee_id: str
    clock_in: str
    clock_out: Optional[str] = None
    duration_minutes: Optional[int] = 0
    store_id: str

class PayrollDeduction(MongoModel):
    payroll_id: str
    type: str
    description: str
    amount: float

class Payroll(MongoModel):
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
    deductions: List[PayrollDeduction] = []
    store_id: str

class PayrollSettings(MongoModel):
    store_id: str
    default_payment_cycle: str
    tax_rate: float
    overtime_multiplier: float