# app/routes/hr.py
from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_collection
from app.models.hr import Employee, Shift, TimesheetEntry, Payroll, AccessRole, JobTitle
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api", tags=["hr"])

# Employees endpoints
@router.get("/employees", response_model=List[Employee])
async def get_employees():
    employees_collection = get_collection("employees")
    employees = []
    async for employee in employees_collection.find():
        employees.append(Employee.from_mongo(employee))
    return employees

@router.post("/employees", response_model=Employee)
async def create_employee(employee: Employee):
    employees_collection = get_collection("employees")
    employee_dict = employee.to_mongo()
    result = await employees_collection.insert_one(employee_dict)
    new_employee = await employees_collection.find_one({"_id": result.inserted_id})
    return Employee.from_mongo(new_employee)

# Access Roles endpoints
@router.get("/access_roles", response_model=List[AccessRole])
async def get_access_roles():
    access_roles_collection = get_collection("access_roles")
    roles = []
    async for role in access_roles_collection.find():
        roles.append(AccessRole.from_mongo(role))
    return roles

@router.post("/access_roles", response_model=AccessRole)
async def create_access_role(role: AccessRole):
    access_roles_collection = get_collection("access_roles")
    role_dict = role.to_mongo()
    result = await access_roles_collection.insert_one(role_dict)
    new_role = await access_roles_collection.find_one({"_id": result.inserted_id})
    return AccessRole.from_mongo(new_role)

# Job Titles endpoints
@router.get("/job_titles", response_model=List[JobTitle])
async def get_job_titles():
    job_titles_collection = get_collection("job_titles")
    titles = []
    async for title in job_titles_collection.find():
        titles.append(JobTitle.from_mongo(title))
    return titles

@router.post("/job_titles", response_model=JobTitle)
async def create_job_title(title: JobTitle):
    job_titles_collection = get_collection("job_titles")
    title_dict = title.to_mongo()
    result = await job_titles_collection.insert_one(title_dict)
    new_title = await job_titles_collection.find_one({"_id": result.inserted_id})
    return JobTitle.from_mongo(new_title)

# Shifts endpoints
@router.get("/shifts", response_model=List[Shift])
async def get_shifts():
    shifts_collection = get_collection("shifts")
    shifts = []
    async for shift in shifts_collection.find():
        shifts.append(Shift.from_mongo(shift))
    return shifts

@router.post("/shifts", response_model=Shift)
async def create_shift(shift: Shift):
    shifts_collection = get_collection("shifts")
    shift_dict = shift.to_mongo()
    result = await shifts_collection.insert_one(shift_dict)
    new_shift = await shifts_collection.find_one({"_id": result.inserted_id})
    return Shift.from_mongo(new_shift)

# Timesheet Entries endpoints
@router.get("/timesheet_entries", response_model=List[TimesheetEntry])
async def get_timesheet_entries():
    ts_collection = get_collection("timesheet_entries")
    entries = []
    async for entry in ts_collection.find():
        entries.append(TimesheetEntry.from_mongo(entry))
    return entries

@router.post("/timesheet_entries", response_model=TimesheetEntry)
async def create_timesheet_entry(entry: TimesheetEntry):
    ts_collection = get_collection("timesheet_entries")
    entry_dict = entry.to_mongo()
    result = await ts_collection.insert_one(entry_dict)
    new_entry = await ts_collection.find_one({"_id": result.inserted_id})
    return TimesheetEntry.from_mongo(new_entry)

# Payroll endpoints
@router.get("/payroll", response_model=List[Payroll])
async def get_payroll_entries():
    payroll_collection = get_collection("payroll")
    entries = []
    async for entry in payroll_collection.find():
        entries.append(Payroll.from_mongo(entry))
    return entries

@router.post("/payroll", response_model=Payroll)
async def create_payroll_entry(entry: Payroll):
    payroll_collection = get_collection("payroll")
    entry_dict = entry.to_mongo()
    result = await payroll_collection.insert_one(entry_dict)
    new_entry = await payroll_collection.find_one({"_id": result.inserted_id})
    return Payroll.from_mongo(new_entry)