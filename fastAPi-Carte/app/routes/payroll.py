# app/routes/payroll.py - REMOVED DUPLICATES
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.database import get_collection
from app.models.hr import Payroll, PayrollSettings, Employee, PayrollDeduction
from app.models.response import StandardResponse, PayrollResponse, PayrollSettingsResponse
from app.utils.response_helpers import success_response, error_response, handle_generic_exception
from app.utils.mongo_helpers import to_mongo_dict, to_mongo_update_dict
from bson import ObjectId
from datetime import datetime, timedelta
import asyncio

router = APIRouter(prefix="/api", tags=["payroll"])

# Helper function to get or create default payroll settings
async def get_or_create_payroll_settings(store_id: str) -> PayrollSettings:
    """Get payroll settings for a store, create default if not exists."""
    settings_collection = get_collection("payroll_settings")
    settings_data = await settings_collection.find_one({"store_id": store_id})
    
    if not settings_data:
        # Create default settings
        default_settings = PayrollSettings(
            store_id=store_id,
            default_payment_cycle="bi-weekly",
            tax_rate=0.20,
            overtime_multiplier=1.5
        )
        settings_dict = to_mongo_dict(default_settings)
        await settings_collection.insert_one(settings_dict)
        return default_settings
    
    return PayrollSettings.from_mongo(settings_data)

# REMOVED DUPLICATES:
# - GET /api/payroll (duplicate in hr.py)
# - GET /api/payroll/{payroll_id} (duplicate in hr.py) 
# - POST /api/payroll (duplicate in hr.py)
# - PUT /api/payroll/{payroll_id} (duplicate in hr.py)
# - POST /api/payroll/{payroll_id}/process (duplicate in hr.py)
# - DELETE /api/payroll/{payroll_id} (duplicate in hr.py)
# - GET /api/payroll_settings (duplicate in hr.py)
# - POST /api/payroll_settings (duplicate in hr.py)

@router.post("/payroll/calculate", response_model=StandardResponse[PayrollResponse])
async def calculate_payroll(
    employee_id: str,
    period_start: str,
    period_end: str,
    store_id: Optional[str] = None
):
    """Calculate payroll for a specific employee and time period using payroll settings."""
    try:
        # Get employee data
        employees_collection = get_collection("employees")
        employee_doc = await employees_collection.find_one({"_id": ObjectId(employee_id)})
        
        if not employee_doc:
            return error_response(message="Employee not found", code=404)
        
        # Get or create payroll settings
        store_id = employee_doc.get("store_id", store_id or "default")
        settings = await get_or_create_payroll_settings(store_id)
        
        print(f"Using payroll settings: {settings.model_dump()}")  # Debug log
        
        # Get timesheet entries for the period
        ts_collection = get_collection("timesheet_entries")
        
        # Parse date strings to datetime objects for query
        try:
            start_dt = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
            
            query_start = start_dt.isoformat()
            query_end = end_dt.isoformat()
            
        except ValueError:
            return error_response(message="Invalid date format. Use ISO 8601 format.", code=400)
        
        # Get timesheets for the period - FIX: Use to_list()
        timesheet_list = await ts_collection.find({
            "employee_id": employee_id,
            "clock_in": {"$gte": query_start, "$lte": query_end},
            "clock_out": {"$ne": None}
        }).to_list(length=1000)
        
        # Calculate total hours worked
        total_minutes = 0
        
        for ts in timesheet_list:
            if ts.get("duration_minutes"):
                total_minutes += ts["duration_minutes"]
        
        total_hours = total_minutes / 60
        
        # Calculate overtime based on payment cycle using settings
        regular_hours = total_hours
        overtime_hours = 0
        
        if settings.default_payment_cycle == "monthly":
            # Approximately 160 hours per month (4 weeks * 40 hours)
            regular_hours_threshold = 160
        elif settings.default_payment_cycle == "bi-weekly":
            # 80 hours per 2 weeks
            regular_hours_threshold = 80
        else:  # weekly
            # 40 hours per week
            regular_hours_threshold = 40
        
        # Apply overtime
        if total_hours > regular_hours_threshold:
            overtime_hours = total_hours - regular_hours_threshold
            regular_hours = regular_hours_threshold
        
        print(f"Hours calculation - Total: {total_hours}, Regular: {regular_hours}, Overtime: {overtime_hours}")
        
        # Calculate pay rates
        annual_salary = employee_doc.get("salary", 0)
        
        # Calculate hourly rate based on payment cycle
        if settings.default_payment_cycle == "monthly":
            # Assuming 12 months, 160 hours per month
            hourly_rate = annual_salary / (12 * 160) if annual_salary > 0 else 0
        elif settings.default_payment_cycle == "bi-weekly":
            # 26 pay periods per year, 80 hours per period
            hourly_rate = annual_salary / (26 * 80) if annual_salary > 0 else 0
        else:  # weekly
            # 52 weeks per year, 40 hours per week
            hourly_rate = annual_salary / (52 * 40) if annual_salary > 0 else 0
        
        print(f"Hourly rate: {hourly_rate}, Overtime multiplier: {settings.overtime_multiplier}")
        
        # Calculate pay components
        regular_pay = regular_hours * hourly_rate
        overtime_pay = overtime_hours * hourly_rate * settings.overtime_multiplier
        gross_pay = regular_pay + overtime_pay
        
        # Apply tax rate from settings
        tax_deductions = gross_pay * settings.tax_rate
        net_pay = gross_pay - tax_deductions
        
        print(f"Pay calculation - Regular: {regular_pay}, Overtime: {overtime_pay}, Gross: {gross_pay}, Tax: {tax_deductions}, Net: {net_pay}")
        
        # Create payroll data with deductions
        tax_deduction_record = PayrollDeduction(
            payroll_id="temp",  # Will be set when payroll is created
            type="tax",
            description="Income tax deduction",
            amount=round(tax_deductions, 2)
        )
        
        payroll_data = Payroll(
            employee_id=employee_id,
            pay_period_start=period_start,
            pay_period_end=period_end,
            payment_cycle=settings.default_payment_cycle,
            gross_pay=round(gross_pay, 2),
            tax_deductions=round(tax_deductions, 2),
            net_pay=round(net_pay, 2),
            hours_worked=round(total_hours, 2),
            overtime_hours=round(overtime_hours, 2),
            overtime_rate=settings.overtime_multiplier,
            deductions=[tax_deduction_record],
            status="pending",
            store_id=store_id
        )
        
        return success_response(data=payroll_data)
        
    except Exception as e:
        print(f"Error in payroll calculation: {str(e)}")
        return error_response(message=f"Error calculating payroll: {str(e)}", code=400)

@router.get("/health")
async def payroll_health_check():
    """Health check for the payroll module."""
    return success_response(data={"status": "healthy", "module": "payroll"})