# app/models/hr.py
from typing import Optional, List, Dict, Any
from pydantic import Field, EmailStr
# At the top of hr.py, ensure proper imports
from datetime import datetime, timedelta, date  # Add date import if needed
import asyncio
from .base import MongoModel

class Department(MongoModel):
    name: str
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

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
    
    # Frontend-specific fields
    employee_id: Optional[str] = None
    full_name: Optional[str] = None
    middle_name: Optional[str] = None
    suffix: Optional[str] = None
    profile_photo_url: Optional[str] = None
    
    personal_details: Optional[PersonalDetails] = None
    contact_details: Optional[ContactDetails] = None
    employment_details: Optional[EmploymentDetails] = None
    status: Optional[EmployeeStatus] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class AccessRole(MongoModel):
    name: str
    description: str
    permissions: List[str]
    landing_page: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class JobTitle(MongoModel):
    title: str
    description: Optional[str] = None
    department: str
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Shift(MongoModel):
    employee_id: str
    start: str
    end: str
    title: Optional[str] = None
    employee_name: Optional[str] = None
    color: Optional[str] = None
    active: Optional[bool] = True
    recurring: Optional[bool] = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class TimesheetEntry(MongoModel):
    employee_id: str
    clock_in: str
    clock_out: Optional[str] = None
    duration_minutes: Optional[int] = 0
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class PayrollDeduction(MongoModel):
    id: Optional[str] = None
    payroll_id: str
    type: str  # "tax" | "insurance" | "retirement" | "other"
    description: str
    amount: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class PayrollSettings(MongoModel):
    store_id: str
    default_payment_cycle: str  # "weekly" | "bi-weekly" | "monthly"
    tax_rate: float
    overtime_multiplier: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Payroll(MongoModel):
    employee_id: str
    pay_period_start: str
    pay_period_end: str
    payment_cycle: str  # "weekly" | "bi-weekly" | "monthly"
    gross_pay: float
    tax_deductions: float
    net_pay: float
    status: str  # "pending" | "processing" | "paid" | "failed"
    hours_worked: float
    overtime_hours: float
    overtime_rate: float
    deductions: Optional[List[PayrollDeduction]] = []
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Company(MongoModel):
    company_id: str
    name: str
    country: str
    tax_details: Dict[str, Any]
    metrics: Dict[str, Any]

class Timesheet(MongoModel):
    timesheet_id: str
    employee_id: str
    start_date: str
    end_date: str
    daily_hours: Dict[str, str]
    total_weekly_hours: str

class TaxDetails(MongoModel):
    tax_year: str
    efiling_admin: str
    related_docs: str

class CompanyMetrics(MongoModel):
    total_employees: int
    active_employees: int
    employees_on_leave: int
    terminated_employees: int
    full_time_employees: int
    part_time_employees: int
    contract_employees: int
    employee_invites: Dict[str, int]

class EmployeeInvites(MongoModel):
    sent: int
    active: int
    require_attention: int