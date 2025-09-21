from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_collection
from app.models.hr import Employee, Shift, TimesheetEntry, Payroll, PayrollSettings
from bson import ObjectId

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

# Add similar endpoints for all other HR entities...