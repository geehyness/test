# app/routes/hr.py
from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_collection
from app.models.hr import Employee, Shift, TimesheetEntry, Payroll, AccessRole, JobTitle, PayrollSettings, Timesheet
from bson import ObjectId
from datetime import datetime, timedelta

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
    employee_dict["created_at"] = datetime.utcnow()
    employee_dict["updated_at"] = datetime.utcnow()
    
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
    role_dict["created_at"] = datetime.utcnow()
    role_dict["updated_at"] = datetime.utcnow()
    
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
    title_dict["created_at"] = datetime.utcnow()
    title_dict["updated_at"] = datetime.utcnow()
    
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
    shift_dict["created_at"] = datetime.utcnow()
    shift_dict["updated_at"] = datetime.utcnow()
    
    result = await shifts_collection.insert_one(shift_dict)
    new_shift = await shifts_collection.find_one({"_id": result.inserted_id})
    return Shift.from_mongo(new_shift)

@router.put("/shifts/{shift_id}", response_model=Shift)
async def update_shift(shift_id: str, shift: Shift):
    shifts_collection = get_collection("shifts")
    shift_dict = shift.to_mongo(exclude_unset=True)
    shift_dict["updated_at"] = datetime.utcnow()
    
    result = await shifts_collection.update_one(
        {"_id": ObjectId(shift_id)}, {"$set": shift_dict}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    updated_shift = await shifts_collection.find_one({"_id": ObjectId(shift_id)})
    return Shift.from_mongo(updated_shift)

@router.put("/shifts/{shift_id}/status")
async def update_shift_status(shift_id: str, active: bool):
    shifts_collection = get_collection("shifts")
    result = await shifts_collection.update_one(
        {"_id": ObjectId(shift_id)}, 
        {"$set": {"active": active, "updated_at": datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    updated_shift = await shifts_collection.find_one({"_id": ObjectId(shift_id)})
    return Shift.from_mongo(updated_shift)

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
    entry_dict["created_at"] = datetime.utcnow()
    entry_dict["updated_at"] = datetime.utcnow()
    
    result = await ts_collection.insert_one(entry_dict)
    new_entry = await ts_collection.find_one({"_id": result.inserted_id})
    return TimesheetEntry.from_mongo(new_entry)

@router.put("/timesheet_entries/{entry_id}", response_model=TimesheetEntry)
async def update_timesheet_entry(entry_id: str, entry: TimesheetEntry):
    ts_collection = get_collection("timesheet_entries")
    entry_dict = entry.to_mongo(exclude_unset=True)
    entry_dict["updated_at"] = datetime.utcnow()
    
    # Calculate duration if clock_out is provided
    if entry.clock_out and entry.clock_in:
        clock_in = entry.clock_in
        clock_out = entry.clock_out
        duration = int((clock_out - clock_in).total_seconds() / 60)
        entry_dict["duration_minutes"] = duration
    
    result = await ts_collection.update_one(
        {"_id": ObjectId(entry_id)}, {"$set": entry_dict}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Timesheet entry not found")
    
    updated_entry = await ts_collection.find_one({"_id": ObjectId(entry_id)})
    return TimesheetEntry.from_mongo(updated_entry)

# Clock in/out endpoints
@router.post("/timesheet_entries/clock-in")
async def clock_in(employee_id: str, store_id: str):
    ts_collection = get_collection("timesheet_entries")
    
    # Check if employee already clocked in
    existing_entry = await ts_collection.find_one({
        "employee_id": employee_id,
        "clock_out": None
    })
    
    if existing_entry:
        raise HTTPException(status_code=400, detail="Employee is already clocked in")
    
    entry_dict = {
        "employee_id": employee_id,
        "store_id": store_id,
        "clock_in": datetime.utcnow(),
        "clock_out": None,
        "duration_minutes": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await ts_collection.insert_one(entry_dict)
    new_entry = await ts_collection.find_one({"_id": result.inserted_id})
    return TimesheetEntry.from_mongo(new_entry)

@router.post("/timesheet_entries/{entry_id}/clock-out")
async def clock_out(entry_id: str):
    ts_collection = get_collection("timesheet_entries")
    
    entry = await ts_collection.find_one({"_id": ObjectId(entry_id)})
    if not entry:
        raise HTTPException(status_code=404, detail="Timesheet entry not found")
    
    clock_out_time = datetime.utcnow()
    clock_in_time = entry["clock_in"]
    duration = int((clock_out_time - clock_in_time).total_seconds() / 60)
    
    result = await ts_collection.update_one(
        {"_id": ObjectId(entry_id)},
        {"$set": {
            "clock_out": clock_out_time,
            "duration_minutes": duration,
            "updated_at": datetime.utcnow()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Timesheet entry not found")
    
    updated_entry = await ts_collection.find_one({"_id": ObjectId(entry_id)})
    return TimesheetEntry.from_mongo(updated_entry)

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
    entry_dict["created_at"] = datetime.utcnow()
    entry_dict["updated_at"] = datetime.utcnow()
    
    result = await payroll_collection.insert_one(entry_dict)
    new_entry = await payroll_collection.find_one({"_id": result.inserted_id})
    return Payroll.from_mongo(new_entry)

@router.put("/payroll/{payroll_id}", response_model=Payroll)
async def update_payroll_entry(payroll_id: str, entry: Payroll):
    payroll_collection = get_collection("payroll")
    entry_dict = entry.to_mongo(exclude_unset=True)
    entry_dict["updated_at"] = datetime.utcnow()
    
    result = await payroll_collection.update_one(
        {"_id": ObjectId(payroll_id)}, {"$set": entry_dict}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Payroll entry not found")
    
    updated_entry = await payroll_collection.find_one({"_id": ObjectId(payroll_id)})
    return Payroll.from_mongo(updated_entry)

@router.post("/payroll/{payroll_id}/process")
async def process_payroll(payroll_id: str):
    payroll_collection = get_collection("payroll")
    
    # Update status to processing
    await payroll_collection.update_one(
        {"_id": ObjectId(payroll_id)},
        {"$set": {"status": "processing", "updated_at": datetime.utcnow()}}
    )
    
    # Simulate processing delay
    import asyncio
    await asyncio.sleep(2)
    
    # Update status to paid
    result = await payroll_collection.update_one(
        {"_id": ObjectId(payroll_id)},
        {"$set": {"status": "paid", "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Payroll entry not found")
    
    updated_entry = await payroll_collection.find_one({"_id": ObjectId(payroll_id)})
    return Payroll.from_mongo(updated_entry)

# Payroll settings endpoints
@router.get("/payroll_settings", response_model=PayrollSettings)
async def get_payroll_settings():
    settings_collection = get_collection("payroll_settings")
    settings = await settings_collection.find_one()
    if not settings:
        # Return default settings if none exist
        default_settings = PayrollSettings(
            pay_period="bi-weekly",
            tax_rate=0.20,
            overtime_multiplier=1.5,
            store_id="default"
        )
        return default_settings
    return PayrollSettings.from_mongo(settings)

@router.post("/payroll_settings", response_model=PayrollSettings)
async def create_payroll_settings(settings: PayrollSettings):
    settings_collection = get_collection("payroll_settings")
    settings_dict = settings.to_mongo()
    settings_dict["created_at"] = datetime.utcnow()
    settings_dict["updated_at"] = datetime.utcnow()
    
    # Delete existing settings
    await settings_collection.delete_many({})
    
    result = await settings_collection.insert_one(settings_dict)
    new_settings = await settings_collection.find_one({"_id": result.inserted_id})
    return PayrollSettings.from_mongo(new_settings)

# Payroll calculation endpoint
@router.post("/payroll/calculate")
async def calculate_payroll(employee_id: str, period_start: str, period_end: str):
    # Get employee data
    employees_collection = get_collection("employees")
    employee = await employees_collection.find_one({"_id": ObjectId(employee_id)})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get timesheet entries for the period
    ts_collection = get_collection("timesheet_entries")
    timesheets = []
    async for ts in ts_collection.find({
        "employee_id": employee_id,
        "clock_in": {"$gte": datetime.fromisoformat(period_start), "$lte": datetime.fromisoformat(period_end)},
        "clock_out": {"$ne": None}
    }):
        timesheets.append(ts)
    
    # Get payroll settings
    settings_collection = get_collection("payroll_settings")
    settings_data = await settings_collection.find_one()
    settings = PayrollSettings.from_mongo(settings_data) if settings_data else PayrollSettings(
        pay_period="bi-weekly",
        tax_rate=0.20,
        overtime_multiplier=1.5,
        store_id=employee.get("store_id", "default")
    )
    
    # Calculate hours
    total_hours = 0
    overtime_hours = 0
    
    for ts in timesheets:
        if ts.get("duration_minutes"):
            hours = ts["duration_minutes"] / 60
            total_hours += hours
            
            # Calculate overtime (hours over 40 per week)
            if hours > 40:
                overtime_hours += hours - 40
                total_hours -= hours - 40
    
    # Calculate pay
    hourly_rate = employee.get("salary", 0) / 2080  # 2080 hours per year
    regular_pay = total_hours * hourly_rate
    overtime_pay = overtime_hours * hourly_rate * settings.overtime_multiplier
    gross_pay = regular_pay + overtime_pay
    tax_deductions = gross_pay * settings.tax_rate
    net_pay = gross_pay - tax_deductions
    
    payroll_data = Payroll(
        employee_id=employee_id,
        pay_period_start=datetime.fromisoformat(period_start).date(),
        pay_period_end=datetime.fromisoformat(period_end).date(),
        payment_cycle=settings.pay_period,
        gross_pay=gross_pay,
        tax_deductions=tax_deductions,
        net_pay=net_pay,
        hours_worked=total_hours,
        overtime_hours=overtime_hours,
        overtime_rate=settings.overtime_multiplier,
        status="pending",
        store_id=employee.get("store_id", "default")
    )
    
    return payroll_data