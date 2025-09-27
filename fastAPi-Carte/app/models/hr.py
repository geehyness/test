# app/models/hr.py
from typing import Optional, List
from pydantic import Field, EmailStr
from datetime import datetime, date
from .base import MongoModel

class PersonalDetails(MongoModel):
    citizenship: str
    gender: str
    birth_date: date
    age: int

class ContactDetails(MongoModel):
    cell_phone: str
    whatsapp_number: str
    email: EmailStr
    address: str

class EmploymentDetails(MongoModel):
    job_title: str
    team: str
    employment_type: str
    location: str

class EmployeeStatus(MongoModel):
    current_status: str
    on_leave_since: Optional[date] = None
    termination_date: Optional[date] = None
    termination_reason: Optional[str] = None

class Employee(MongoModel):
    user_id: str
    job_title_id: str
    access_role_ids: List[str]
    tenant_id: str
    store_id: str
    main_access_role_id: str
    hire_date: date
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

class JobTitle(MongoModel):
    title: str
    description: Optional[str] = None
    department: str
    store_id: str

class Shift(MongoModel):
    employee_id: str
    start: datetime
    end: datetime
    title: Optional[str] = None
    employee_name: Optional[str] = None
    color: Optional[str] = None
    active: Optional[bool] = True
    recurring: Optional[bool] = False

class TimesheetEntry(MongoModel):
    employee_id: str
    clock_in: datetime
    clock_out: Optional[datetime] = None
    duration_minutes: Optional[int] = 0
    store_id: str

class PayrollDeduction(MongoModel):
    payroll_id: str
    type: str
    description: str
    amount: float

class PayrollSettings(MongoModel):
    pay_period: str
    tax_rate: float
    overtime_multiplier: float
    store_id: str

class Payroll(MongoModel):
    employee_id: str
    pay_period_start: date
    pay_period_end: date
    payment_cycle: str
    gross_pay: float
    tax_deductions: float
    net_pay: float
    status: str
    hours_worked: float
    overtime_hours: float
    deductions: Optional[List[PayrollDeduction]] = []
    store_id: str
    overtime_rate: Optional[float] = 1.5

class Company(MongoModel):
    name: str
    country: str
    tax_details: dict
    metrics: dict

class Timesheet(MongoModel):
    timesheet_id: str
    employee_id: str
    start_date: str
    end_date: str
    daily_hours: dict
    total_weekly_hours: str