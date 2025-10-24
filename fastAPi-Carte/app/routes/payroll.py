# app/routes/payroll.py - FIXED VERSION
from fastapi import APIRouter, HTTPException, Query, Body
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
            overtime_multiplier=1.5,
            overtime_threshold=40.0,
            pay_day=15,
            auto_process=False,
            include_benefits=False,
            benefits_rate=0.05
        )
        settings_dict = to_mongo_dict(default_settings)
        await settings_collection.insert_one(settings_dict)
        return default_settings
    
    return PayrollSettings.from_mongo(settings_data)

@router.post("/payroll/calculate", response_model=StandardResponse[PayrollResponse])
async def calculate_payroll(
    employee_id: str = Body(...),
    period_start: str = Body(...),
    period_end: str = Body(...),
    store_id: Optional[str] = Body(None)
):
    """Calculate payroll for a specific employee and time period using payroll settings."""
    try:
        print(f"🔍 [Payroll Calculate] Starting calculation for employee: {employee_id}")
        print(f"📅 [Payroll Calculate] Period: {period_start} to {period_end}")

        # Get employee data
        employees_collection = get_collection("employees")
        employee_doc = await employees_collection.find_one({"_id": ObjectId(employee_id)})
        
        if not employee_doc:
            return error_response(message="Employee not found", code=404)
        
        # Get or create payroll settings
        store_id = employee_doc.get("store_id", store_id or "default")
        settings = await get_or_create_payroll_settings(store_id)
        
        print(f"⚙️ [Payroll Calculate] Using payroll settings: {settings.model_dump()}")

        # Get timesheet entries for the period
        ts_collection = get_collection("timesheet_entries")
        
        # Parse date strings to datetime objects for query
        try:
            start_dt = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        except ValueError:
            return error_response(message="Invalid date format. Use ISO 8601 format.", code=400)
            
        # FIXED: Use async for loop instead of to_list()
        timesheet_list = []
        async for ts in ts_collection.find({
            "employee_id": employee_id,
            "clock_in": {"$gte": start_dt, "$lte": end_dt},
            "clock_out": {"$ne": None}
        }):
            timesheet_list.append(ts)
        
        print(f"⏰ [Payroll Calculate] Found {len(timesheet_list)} timesheet entries")

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
        
        print(f"⏱️ [Payroll Calculate] Hours calculation - Total: {total_hours}, Regular: {regular_hours}, Overtime: {overtime_hours}")
        
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
        
        print(f"💰 [Payroll Calculate] Hourly rate: {hourly_rate}, Overtime multiplier: {settings.overtime_multiplier}")
        
        # Calculate pay components
        regular_pay = regular_hours * hourly_rate
        overtime_pay = overtime_hours * hourly_rate * settings.overtime_multiplier
        gross_pay = regular_pay + overtime_pay
        
        # Apply tax rate from settings
        tax_deductions = gross_pay * settings.tax_rate
        net_pay = gross_pay - tax_deductions
        
        print(f"💵 [Payroll Calculate] Pay calculation - Regular: {regular_pay}, Overtime: {overtime_pay}, Gross: {gross_pay}, Tax: {tax_deductions}, Net: {net_pay}")
        
        # Create payroll data with deductions
        tax_deduction_record = PayrollDeduction(
            payroll_id="temp",  # Will be set when payroll is created
            type="tax",
            description="Income tax deduction",
            amount=round(tax_deductions, 2)
        )
        
        payroll_data = Payroll(
            employee_id=employee_id,
            pay_period_start=start_dt,
            pay_period_end=end_dt,
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
        print(f"❌ [Payroll Calculate] Error in payroll calculation: {str(e)}")
        return error_response(message=f"Error calculating payroll: {str(e)}", code=400)

@router.get("/health")
async def payroll_health_check():
    """Health check for the payroll module."""
    return success_response(data={"status": "healthy", "module": "payroll"})