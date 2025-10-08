# load_imbizo_shisanyama_data.py
import asyncio
from datetime import datetime, date, timedelta, time, timezone
from typing import Dict, Any, List
from bson import ObjectId
import os
import bcrypt
import random

from app.database import get_collection 
# sample_data.py - SIMPLEST
from app.models import *
from app.models.hr import (
    Employee, AccessRole, JobTitle, Shift, TimesheetEntry,
    Payroll, PayrollDeduction, PayrollSettings
)

# --- Extensive Sample Data for Imbizo Shisanyama ---
SAMPLE_DATA = {
    "tenants": [
        {
            "name": "Imbizo Shisanyama Group",
            "email": "info@imbizoshisanyama.co.za", 
            "phone": "+27-11-123-4567",
            "address": "Busy Corner, Ivory Park, Gauteng, South Africa",
            "created_at": datetime.now()
        },
    ],
    
    "stores": [
        {
            "name": "Imbizo Shisanyama - Busy Corner",
            "address": "Busy Corner, Ivory Park, Midrand, 1685",
            "phone": "+27-11-555-1234",
            "email": "busycorner@imbizoshisanyama.co.za",
            "tenant_id": "",
            "location": "Ivory Park",
            "manager_id": "",
            "kiosk_user_id": "",
            "created_at": datetime.now()
        },
        {
            "name": "Imbizo Shisanyama - Thembisa Mall", 
            "address": "Thembisa Mall, Thembisa, Gauteng, 1632",
            "phone": "+27-11-555-5678",
            "email": "thembisa@imbizoshisanyama.co.za",
            "tenant_id": "",
            "location": "Thembisa Mall",
            "manager_id": "",
            "kiosk_user_id": "",
            "created_at": datetime.now()
        },
    ],

    "users": [
        # Management Team
        {"username": "ritazwane", "email": "rita@imbizoshisanyama.co.za", "password": "password", "first_name": "Rita", "last_name": "Zwane"},
        {"username": "siphodlamini", "email": "sipho@imbizoshisanyama.co.za", "password": "password", "first_name": "Sipho", "last_name": "Dlamini"},
        {"username": "nomandlovu", "email": "noman@imbizoshisanyama.co.za", "password": "password", "first_name": "Noma", "last_name": "Ndlovu"},
        
        # Kitchen Staff
        {"username": "andilemokoena", "email": "andile@imbizoshisanyama.co.za", "password": "password", "first_name": "Andile", "last_name": "Mokoena"},
        {"username": "bonganimthethwa", "email": "bongani@imbizoshisanyama.co.za", "password": "password", "first_name": "Bongani", "last_name": "Mthethwa"},
        {"username": "zanelemthembu", "email": "zanele@imbizoshisanyama.co.za", "password": "password", "first_name": "Zanele", "last_name": "Mthembu"},
        
        # Service Staff
        {"username": "leratombele", "email": "lerato@imbizoshisanyama.co.za", "password": "password", "first_name": "Lerato", "last_name": "Mbele"},
        {"username": "thandimkize", "email": "thandi@imbizoshisanyama.co.za", "password": "password", "first_name": "Thandi", "last_name": "Mkize"},
        {"username": "mphomoloi", "email": "mpho@imbizoshisanyama.co.za", "password": "password", "first_name": "Mpho", "last_name": "Moloi"},
        {"username": "tendancube", "email": "tenda@imbizoshisanyama.co.za", "password": "password", "first_name": "Tenda", "last_name": "Ncube"},
        
        # Additional staff to reach 20+
        {"username": "kagisonyathi", "email": "kagiso@imbizoshisanyama.co.za", "password": "password", "first_name": "Kagiso", "last_name": "Nonyathi"},
        {"username": "ayandamdluli", "email": "ayanda@imbizoshisanyama.co.za", "password": "password", "first_name": "Ayanda", "last_name": "Mdluli"},
        {"username": "sizwemabuza", "email": "sizwe@imbizoshisanyama.co.za", "password": "password", "first_name": "Sizwe", "last_name": "Mabuza"},
        {"username": "nonhlanhla", "email": "nonhi@imbizoshisanyama.co.za", "password": "password", "first_name": "Nonhlanhla", "last_name": "Zulu"},
        {"username": "jabulanimpanze", "email": "jabulani@imbizoshisanyama.co.za", "password": "password", "first_name": "Jabulani", "last_name": "Mpanze"},
        {"username": "ntandoyenkosi", "email": "ntando@imbizoshisanyama.co.za", "password": "password", "first_name": "Ntando", "last_name": "Yenkosi"},
        {"username": "lungelamkhize", "email": "lungela@imbizoshisanyama.co.za", "password": "password", "first_name": "Lungela", "last_name": "Mkhize"},
        {"username": "sibongiseni", "email": "sibong@imbizoshisanyama.co.za", "password": "password", "first_name": "Sibongiseni", "last_name": "Ndlovu"},
        {"username": "mphomatsenjwa", "email": "mphom@imbizoshisanyama.co.za", "password": "password", "first_name": "Mpho", "last_name": "Matsenjwa"},
        {"username": "thabisancube", "email": "thabis@imbizoshisanyama.co.za", "password": "password", "first_name": "Thabiso", "last_name": "Ncube"},
        {"username": "kiosk_busycorner", "email": "kiosk@imbizoshisanyama.co.za", "password": "password", "first_name": "Kiosk", "last_name": "User"},
    ],

    "access_roles": [
        {
            "name": "Admin", 
            "description": "Full administrative access to all system features",
            "permissions": ["can_manage_users", "can_view_reports", "can_manage_settings", "can_manage_all_pos_operations"],
            "landing_page": "/pos/management",
            "created_at": datetime.now()
        },
        {
            "name": "Manager",
            "description": "Access to POS operations and management features", 
            "permissions": ["can_manage_orders", "can_view_reports", "can_process_payments", "can_manage_reservations"],
            "landing_page": "/pos/dashboard",
            "created_at": datetime.now()
        },
        {
            "name": "Chef",
            "description": "Kitchen staff who prepare food and manage orders",
            "permissions": ["can_view_orders", "can_update_order_status", "can_manage_inventory"],
            "landing_page": "/pos/kitchen",
            "created_at": datetime.now()
        },
        {
            "name": "Waiter",
            "description": "Takes orders and serves customers",
            "permissions": ["can_manage_orders", "can_process_payments"],
            "landing_page": "/pos/terminal", 
            "created_at": datetime.now()
        },
        {
            "name": "Kiosk-User",
            "description": "Self-service kiosk access for customers",
            "permissions": ["can_create_orders", "can_view_menu"],
            "landing_page": "/pos/kiosk",
            "created_at": datetime.now()
        },
    ],

    "job_titles": [
        {"title": "General Manager", "description": "Oversees daily operations and staff", "department": "Management", "store_id": ""},
        {"title": "Head Chef", "description": "Leads kitchen operations and food preparation", "department": "Kitchen", "store_id": ""},
        {"title": "Sous Chef", "description": "Assists head chef in kitchen management", "department": "Kitchen", "store_id": ""},
        {"title": "Line Cook", "description": "Prepares and cooks food items", "department": "Kitchen", "store_id": ""},
        {"title": "Grill Master", "description": "Specializes in braai and grilled meats", "department": "Kitchen", "store_id": ""},
        {"title": "Service Manager", "description": "Manages front-of-house operations", "department": "Service", "store_id": ""},
        {"title": "Waiter/Waitress", "description": "Serves customers and takes orders", "department": "Service", "store_id": ""},
        {"title": "Bartender", "description": "Prepares and serves beverages", "department": "Service", "store_id": ""},
        {"title": "Host/Hostess", "description": "Greets customers and manages seating", "department": "Service", "store_id": ""},
        {"title": "Cashier", "description": "Processes payments and handles cash", "department": "Service", "store_id": ""},
    ],

    "employees": [
        # Management - 5 entries
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2020, 1, 15), "salary": 75000.0, "first_name": "Rita", "last_name": "Zwane"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2021, 3, 10), "salary": 55000.0, "first_name": "Sipho", "last_name": "Dlamini"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2021, 6, 22), "salary": 48000.0, "first_name": "Noma", "last_name": "Ndlovu"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2022, 1, 10), "salary": 45000.0, "first_name": "Kagiso", "last_name": "Nonyathi"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2022, 2, 15), "salary": 42000.0, "first_name": "Ayanda", "last_name": "Mdluli"},
        
        # Kitchen Staff - 8 entries  
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2022, 1, 15), "salary": 42000.0, "first_name": "Andile", "last_name": "Mokoena"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2022, 2, 20), "salary": 38000.0, "first_name": "Bongani", "last_name": "Mthethwa"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2022, 3, 5), "salary": 36000.0, "first_name": "Zanele", "last_name": "Mthembu"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2022, 4, 10), "salary": 35000.0, "first_name": "Sizwe", "last_name": "Mabuza"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2022, 5, 15), "salary": 34000.0, "first_name": "Jabulani", "last_name": "Mpanze"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2022, 6, 20), "salary": 33000.0, "first_name": "Ntando", "last_name": "Yenkosi"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2022, 7, 25), "salary": 32000.0, "first_name": "Lungela", "last_name": "Mkhize"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2022, 8, 30), "salary": 31000.0, "first_name": "Sibongiseni", "last_name": "Ndlovu"},
        
        # Service Staff - 10 entries
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2023, 1, 10), "salary": 32000.0, "first_name": "Lerato", "last_name": "Mbele"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2023, 2, 15), "salary": 32000.0, "first_name": "Thandi", "last_name": "Mkize"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2023, 3, 20), "salary": 32000.0, "first_name": "Mpho", "last_name": "Moloi"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2023, 4, 25), "salary": 32000.0, "first_name": "Tenda", "last_name": "Ncube"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2023, 5, 30), "salary": 32000.0, "first_name": "Nonhlanhla", "last_name": "Zulu"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2023, 6, 5), "salary": 32000.0, "first_name": "Mpho", "last_name": "Matsenjwa"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2023, 7, 10), "salary": 32000.0, "first_name": "Thabiso", "last_name": "Ncube"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2023, 8, 15), "salary": 30000.0, "first_name": "Kiosk", "last_name": "User"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2023, 9, 20), "salary": 30000.0, "first_name": "Service", "last_name": "Temp1"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date(2023, 10, 25), "salary": 30000.0, "first_name": "Service", "last_name": "Temp2"},
    ],

    "categories": [
        {"name": "Braai Specialties", "description": "Traditional South African grilled meats", "store_id": ""},
        {"name": "Stews & Pots", "description": "Hearty traditional stews and pot dishes", "store_id": ""},
        {"name": "Sides & Pap", "description": "Traditional accompaniments and maize meals", "store_id": ""},
        {"name": "Seafood", "description": "Fresh grilled and fried seafood", "store_id": ""},
        {"name": "Salads", "description": "Fresh salads and vegetables", "store_id": ""},
        {"name": "Drinks & Beverages", "description": "Cold drinks, beers, and traditional beverages", "store_id": ""},
        {"name": "Desserts", "description": "Traditional and modern desserts", "store_id": ""},
        {"name": "Kids Menu", "description": "Special meals for children", "store_id": ""},
    ],

    "foods": [
        # Braai Specialties - 15 items
        {
            "name": "Traditional Beef Braai", 
            "description": "500g prime beef cuts marinated in traditional spices",
            "price": 189.00, 
            "category_id": "",
            "image_url": "/images/beef-braai.jpg",
            "preparation_time": 25,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Lamb Chops",
            "description": "Juicy lamb chops with rosemary and garlic",
            "price": 220.00,
            "category_id": "", 
            "image_url": "/images/lamb-chops.jpg",
            "preparation_time": 20,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Boerewors Roll",
            "description": "Traditional farmer's sausage in a fresh roll",
            "price": 45.00,
            "category_id": "",
            "image_url": "/images/boerewors-roll.jpg",
            "preparation_time": 15,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Chicken Braai",
            "description": "Whole chicken marinated in peri-peri sauce",
            "price": 95.00,
            "category_id": "",
            "image_url": "/images/chicken-braai.jpg",
            "preparation_time": 30,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Pork Ribs",
            "description": "Sticky pork ribs with BBQ sauce",
            "price": 175.00,
            "category_id": "",
            "image_url": "/images/pork-ribs.jpg",
            "preparation_time": 35,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Mutton Curry",
            "description": "Spicy mutton curry with traditional spices",
            "price": 120.00,
            "category_id": "",
            "image_url": "/images/mutton-curry.jpg",
            "preparation_time": 40,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Oxtail Pot",
            "description": "Slow-cooked oxtail with vegetables",
            "price": 195.00,
            "category_id": "",
            "image_url": "/images/oxtail-pot.jpg",
            "preparation_time": 45,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Tripe Special",
            "description": "Traditional tripe with chili and spices",
            "price": 85.00,
            "category_id": "",
            "image_url": "/images/tripe-special.jpg",
            "preparation_time": 50,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Beef Short Ribs",
            "description": "Tender beef short ribs braaied to perfection",
            "price": 210.00,
            "category_id": "",
            "image_url": "/images/beef-short-ribs.jpg",
            "preparation_time": 25,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Chicken Wings",
            "description": "Crispy chicken wings with choice of sauce",
            "price": 65.00,
            "category_id": "",
            "image_url": "/images/chicken-wings.jpg",
            "preparation_time": 20,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Lamb Skewers",
            "description": "Marinated lamb pieces on skewers",
            "price": 95.00,
            "category_id": "",
            "image_url": "/images/lamb-skewers.jpg",
            "preparation_time": 15,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Beef Kebabs",
            "description": "Beef cubes with peppers and onions",
            "price": 110.00,
            "category_id": "",
            "image_url": "/images/beef-kebabs.jpg",
            "preparation_time": 18,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Pork Neck Steak",
            "description": "Juicy pork neck steak with marinade",
            "price": 135.00,
            "category_id": "",
            "image_url": "/images/pork-neck.jpg",
            "preparation_time": 22,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Chicken Livers",
            "description": "Spicy chicken livers with peri-peri",
            "price": 55.00,
            "category_id": "",
            "image_url": "/images/chicken-livers.jpg",
            "preparation_time": 12,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Mixed Grill Platter",
            "description": "Assorted meats for 2-3 people",
            "price": 350.00,
            "category_id": "",
            "image_url": "/images/mixed-grill.jpg",
            "preparation_time": 30,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        
        # Stews & Pots - 8 items
        {
            "name": "Traditional Beef Stew",
            "description": "Tender beef slow-cooked with rich spices and vegetables",
            "price": 89.00,
            "category_id": "",
            "image_url": "/images/beef-stew.jpg", 
            "preparation_time": 20,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Chicken Curry",
            "description": "Spicy chicken curry with rice",
            "price": 75.00,
            "category_id": "",
            "image_url": "/images/chicken-curry.jpg",
            "preparation_time": 25,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Vegetable Pot",
            "description": "Mixed vegetables in tomato sauce",
            "price": 45.00,
            "category_id": "",
            "image_url": "/images/vegetable-pot.jpg",
            "preparation_time": 15,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Bean Stew",
            "description": "Hearty bean stew with spices",
            "price": 35.00,
            "category_id": "",
            "image_url": "/images/bean-stew.jpg",
            "preparation_time": 20,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Lamb Stew",
            "description": "Traditional lamb stew with potatoes",
            "price": 110.00,
            "category_id": "",
            "image_url": "/images/lamb-stew.jpg",
            "preparation_time": 35,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Fish Curry",
            "description": "Spicy fish curry with rice",
            "price": 85.00,
            "category_id": "",
            "image_url": "/images/fish-curry.jpg",
            "preparation_time": 20,
            "allergens": ["Fish"],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Chicken Feet",
            "description": "Spicy chicken feet stew",
            "price": 40.00,
            "category_id": "",
            "image_url": "/images/chicken-feet.jpg",
            "preparation_time": 30,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Tripe and Beans",
            "description": "Traditional tripe with sugar beans",
            "price": 65.00,
            "category_id": "",
            "image_url": "/images/tripe-beans.jpg",
            "preparation_time": 45,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        
        # Sides & Pap - 10 items
        {
            "name": "Pap (Maize Meal)",
            "description": "Traditional stiff porridge served with gravy",
            "price": 15.00,
            "category_id": "",
            "image_url": "/images/pap.jpg",
            "preparation_time": 10,
            "allergens": ["Gluten"],
            "tenant_id": "", 
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Chakalaka",
            "description": "Spicy vegetable relish",
            "price": 12.00,
            "category_id": "",
            "image_url": "/images/chakalaka.jpg",
            "preparation_time": 5,
            "allergens": [],
            "tenant_id": "",
            "store_id": "", 
            "recipes": []
        },
        {
            "name": "Dombolo (Dumplings)",
            "description": "Steamed bread dumplings",
            "price": 18.00,
            "category_id": "",
            "image_url": "/images/dombolo.jpg",
            "preparation_time": 15,
            "allergens": ["Gluten"],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Rice",
            "description": "Steamed white rice",
            "price": 12.00,
            "category_id": "",
            "image_url": "/images/rice.jpg",
            "preparation_time": 8,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Salad",
            "description": "Fresh garden salad",
            "price": 20.00,
            "category_id": "",
            "image_url": "/images/salad.jpg",
            "preparation_time": 5,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Cabbage",
            "description": "Steamed cabbage with carrots",
            "price": 15.00,
            "category_id": "",
            "image_url": "/images/cabbage.jpg",
            "preparation_time": 10,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Spinach",
            "description": "Creamed spinach with onion",
            "price": 18.00,
            "category_id": "",
            "image_url": "/images/spinach.jpg",
            "preparation_time": 12,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Potato Salad",
            "description": "Creamy potato salad",
            "price": 22.00,
            "category_id": "",
            "image_url": "/images/potato-salad.jpg",
            "preparation_time": 8,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Garlic Bread",
            "description": "Toasted garlic bread",
            "price": 25.00,
            "category_id": "",
            "image_url": "/images/garlic-bread.jpg",
            "preparation_time": 5,
            "allergens": ["Gluten"],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Sweet Potato",
            "description": "Roasted sweet potato",
            "price": 16.00,
            "category_id": "",
            "image_url": "/images/sweet-potato.jpg",
            "preparation_time": 15,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        
        # Drinks - 12 items
        {
            "name": "Grapetiser Red 330ml",
            "description": "Sparkling grape drink",
            "price": 18.00,
            "category_id": "",
            "image_url": "/images/grapetiser.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Coca-Cola 330ml",
            "description": "Classic Coca-Cola",
            "price": 16.00,
            "category_id": "",
            "image_url": "/images/coca-cola.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Fanta Orange 330ml",
            "description": "Orange flavored soda",
            "price": 16.00,
            "category_id": "",
            "image_url": "/images/fanta.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Sprite 330ml",
            "description": "Lemon-lime soda",
            "price": 16.00,
            "category_id": "",
            "image_url": "/images/sprite.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Still Water 500ml",
            "description": "Bottled still water",
            "price": 12.00,
            "category_id": "",
            "image_url": "/images/water.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Sparkling Water 500ml",
            "description": "Bottled sparkling water",
            "price": 15.00,
            "category_id": "",
            "image_url": "/images/sparkling-water.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Castle Lager 340ml",
            "description": "South African beer",
            "price": 25.00,
            "category_id": "",
            "image_url": "/images/castle.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Black Label 340ml",
            "description": "Carling Black Label beer",
            "price": 26.00,
            "category_id": "",
            "image_url": "/images/black-label.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "House Wine Glass",
            "description": "Glass of house wine",
            "price": 35.00,
            "category_id": "",
            "image_url": "/images/wine.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Fresh Orange Juice",
            "description": "Freshly squeezed orange juice",
            "price": 22.00,
            "category_id": "",
            "image_url": "/images/orange-juice.jpg",
            "preparation_time": 3,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Apple Juice 330ml",
            "description": "Bottled apple juice",
            "price": 18.00,
            "category_id": "",
            "image_url": "/images/apple-juice.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        {
            "name": "Ginger Beer 330ml",
            "description": "Spicy ginger beer",
            "price": 19.00,
            "category_id": "",
            "image_url": "/images/ginger-beer.jpg",
            "preparation_time": 1,
            "allergens": [],
            "tenant_id": "",
            "store_id": "",
            "recipes": []
        },
        
        # Total: 45 food items
    ],

    "customers": [
        {
            "first_name": "Thabo",
            "last_name": "Moloi", 
            "email": "thabo.moloi@email.com",
            "phone_number": "+27-11-234-5678",
            "loyalty_points": 420,
            "store_id": ""
        },
        {
            "first_name": "Nomsa", 
            "last_name": "Khumalo",
            "email": "nomsa.k@email.com",
            "phone_number": "+27-83-456-7890", 
            "loyalty_points": 255,
            "store_id": ""
        },
        {
            "first_name": "James",
            "last_name": "Smith",
            "email": "james.smith@email.com",
            "phone_number": "+27-82-123-4567",
            "loyalty_points": 180,
            "store_id": ""
        },
        {
            "first_name": "Sarah",
            "last_name": "Johnson",
            "email": "sarah.j@email.com",
            "phone_number": "+27-83-987-6543",
            "loyalty_points": 320,
            "store_id": ""
        },
        {
            "first_name": "David",
            "last_name": "Brown",
            "email": "david.b@email.com",
            "phone_number": "+27-84-555-1234",
            "loyalty_points": 95,
            "store_id": ""
        },
        {
            "first_name": "Linda",
            "last_name": "Davis",
            "email": "linda.d@email.com",
            "phone_number": "+27-81-444-5678",
            "loyalty_points": 210,
            "store_id": ""
        },
        {
            "first_name": "Michael",
            "last_name": "Wilson",
            "email": "michael.w@email.com",
            "phone_number": "+27-83-777-8888",
            "loyalty_points": 150,
            "store_id": ""
        },
        {
            "first_name": "Emily",
            "last_name": "Taylor",
            "email": "emily.t@email.com",
            "phone_number": "+27-82-666-9999",
            "loyalty_points": 275,
            "store_id": ""
        },
        {
            "first_name": "Robert",
            "last_name": "Anderson",
            "email": "robert.a@email.com",
            "phone_number": "+27-84-333-2222",
            "loyalty_points": 80,
            "store_id": ""
        },
        {
            "first_name": "Jennifer",
            "last_name": "Thomas",
            "email": "jennifer.t@email.com",
            "phone_number": "+27-81-222-1111",
            "loyalty_points": 190,
            "store_id": ""
        },
        {
            "first_name": "William",
            "last_name": "Jackson",
            "email": "william.j@email.com",
            "phone_number": "+27-83-111-0000",
            "loyalty_points": 310,
            "store_id": ""
        },
        {
            "first_name": "Elizabeth",
            "last_name": "White",
            "email": "elizabeth.w@email.com",
            "phone_number": "+27-82-999-8888",
            "loyalty_points": 125,
            "store_id": ""
        },
        {
            "first_name": "Richard",
            "last_name": "Harris",
            "email": "richard.h@email.com",
            "phone_number": "+27-84-888-7777",
            "loyalty_points": 240,
            "store_id": ""
        },
        {
            "first_name": "Susan",
            "last_name": "Martin",
            "email": "susan.m@email.com",
            "phone_number": "+27-81-777-6666",
            "loyalty_points": 165,
            "store_id": ""
        },
        {
            "first_name": "Joseph",
            "last_name": "Thompson",
            "email": "joseph.t@email.com",
            "phone_number": "+27-83-666-5555",
            "loyalty_points": 290,
            "store_id": ""
        },
        {
            "first_name": "Margaret",
            "last_name": "Garcia",
            "email": "margaret.g@email.com",
            "phone_number": "+27-82-555-4444",
            "loyalty_points": 110,
            "store_id": ""
        },
        {
            "first_name": "Charles",
            "last_name": "Martinez",
            "email": "charles.m@email.com",
            "phone_number": "+27-84-444-3333",
            "loyalty_points": 200,
            "store_id": ""
        },
        {
            "first_name": "Jessica",
            "last_name": "Robinson",
            "email": "jessica.r@email.com",
            "phone_number": "+27-81-333-2222",
            "loyalty_points": 330,
            "store_id": ""
        },
        {
            "first_name": "Thomas",
            "last_name": "Clark",
            "email": "thomas.c@email.com",
            "phone_number": "+27-83-222-1111",
            "loyalty_points": 140,
            "store_id": ""
        },
        {
            "first_name": "Karen",
            "last_name": "Rodriguez",
            "email": "karen.r@email.com",
            "phone_number": "+27-82-111-0000",
            "loyalty_points": 260,
            "store_id": ""
        },
        {
            "first_name": "Christopher",
            "last_name": "Lewis",
            "email": "christopher.l@email.com",
            "phone_number": "+27-84-000-9999",
            "loyalty_points": 175,
            "store_id": ""
        },
        {
            "first_name": "Nancy",
            "last_name": "Lee",
            "email": "nancy.l@email.com",
            "phone_number": "+27-81-999-8888",
            "loyalty_points": 220,
            "store_id": ""
        },
        {
            "first_name": "Daniel",
            "last_name": "Walker",
            "email": "daniel.w@email.com",
            "phone_number": "+27-83-888-7777",
            "loyalty_points": 100,
            "store_id": ""
        },
        {
            "first_name": "Betty",
            "last_name": "Hall",
            "email": "betty.h@email.com",
            "phone_number": "+27-82-777-6666",
            "loyalty_points": 280,
            "store_id": ""
        },
        {
            "first_name": "Paul",
            "last_name": "Allen",
            "email": "paul.a@email.com",
            "phone_number": "+27-84-666-5555",
            "loyalty_points": 135,
            "store_id": ""
        },
        # Total: 25 customers
    ],

    "tables": [
        {"name": "Table 1", "capacity": 4, "location": "Main Pavilion", "status": "occupied", "current_order_id": None, "store_id": ""},
        {"name": "Table 2", "capacity": 6, "location": "Under the Marula Tree", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 3", "capacity": 8, "location": "VIP Lounge", "status": "reserved", "current_order_id": None, "store_id": ""},
        {"name": "Table 4", "capacity": 2, "location": "Main Pavilion", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 5", "capacity": 4, "location": "Garden Area", "status": "occupied", "current_order_id": None, "store_id": ""},
        {"name": "Table 6", "capacity": 6, "location": "Main Pavilion", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 7", "capacity": 4, "location": "Under the Marula Tree", "status": "occupied", "current_order_id": None, "store_id": ""},
        {"name": "Table 8", "capacity": 8, "location": "VIP Lounge", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 9", "capacity": 2, "location": "Garden Area", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 10", "capacity": 6, "location": "Main Pavilion", "status": "reserved", "current_order_id": None, "store_id": ""},
        {"name": "Table 11", "capacity": 4, "location": "Main Pavilion", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 12", "capacity": 6, "location": "Garden Area", "status": "occupied", "current_order_id": None, "store_id": ""},
        {"name": "Table 13", "capacity": 4, "location": "Under the Marula Tree", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 14", "capacity": 8, "location": "VIP Lounge", "status": "reserved", "current_order_id": None, "store_id": ""},
        {"name": "Table 15", "capacity": 2, "location": "Main Pavilion", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 16", "capacity": 6, "location": "Garden Area", "status": "occupied", "current_order_id": None, "store_id": ""},
        {"name": "Table 17", "capacity": 4, "location": "Under the Marula Tree", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 18", "capacity": 8, "location": "VIP Lounge", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 19", "capacity": 2, "location": "Main Pavilion", "status": "occupied", "current_order_id": None, "store_id": ""},
        {"name": "Table 20", "capacity": 6, "location": "Garden Area", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 21", "capacity": 4, "location": "Under the Marula Tree", "status": "reserved", "current_order_id": None, "store_id": ""},
        {"name": "Table 22", "capacity": 8, "location": "VIP Lounge", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 23", "capacity": 2, "location": "Main Pavilion", "status": "occupied", "current_order_id": None, "store_id": ""},
        {"name": "Table 24", "capacity": 6, "location": "Garden Area", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 25", "capacity": 4, "location": "Under the Marula Tree", "status": "available", "current_order_id": None, "store_id": ""},
        # Total: 25 tables
    ],

    "suppliers": [
        {
            "name": "Local Meat Supplier Co.",
            "contact_person": "Tom Wilson",
            "phone": "+27-11-555-1001", 
            "email": "tom@localmeat.co.za",
            "address": "123 Farm Rd, Pretoria, 0081"
        },
        {
            "name": "Fresh Produce Distributors",
            "contact_person": "Lisa Green", 
            "phone": "+27-11-555-1002",
            "email": "lisa@freshproduce.co.za",
            "address": "456 Orchard St, Johannesburg, 2001"
        },
        {
            "name": "Beverage Distributors SA",
            "contact_person": "Mike Johnson",
            "phone": "+27-11-555-1003",
            "email": "mike@beverages.co.za",
            "address": "789 Drink Ave, Cape Town, 8001"
        },
        {
            "name": "Dairy Fresh Ltd",
            "contact_person": "Sarah Brown",
            "phone": "+27-11-555-1004",
            "email": "sarah@dairyfresh.co.za",
            "address": "321 Milk St, Durban, 4001"
        },
        {
            "name": "Grain Masters",
            "contact_person": "David Miller",
            "phone": "+27-11-555-1005",
            "email": "david@grains.co.za",
            "address": "654 Wheat Rd, Bloemfontein, 9301"
        },
        {
            "name": "Seafood Importers",
            "contact_person": "Emma Davis",
            "phone": "+27-11-555-1006",
            "email": "emma@seafood.co.za",
            "address": "987 Ocean Blvd, Port Elizabeth, 6001"
        },
        {
            "name": "Spice Traders",
            "contact_person": "James Wilson",
            "phone": "+27-11-555-1007",
            "email": "james@spices.co.za",
            "address": "147 Spice Lane, Pietermaritzburg, 3201"
        },
        {
            "name": "Bakery Supplies Inc",
            "contact_person": "Maria Garcia",
            "phone": "+27-11-555-1008",
            "email": "maria@bakery.co.za",
            "address": "258 Bread St, East London, 5201"
        },
        {
            "name": "Frozen Foods Ltd",
            "contact_person": "Robert Smith",
            "phone": "+27-11-555-1009",
            "email": "robert@frozen.co.za",
            "address": "369 Cold Ave, Nelspruit, 1200"
        },
        {
            "name": "Organic Farmers Co-op",
            "contact_person": "Anna Taylor",
            "phone": "+27-11-555-1010",
            "email": "anna@organic.co.za",
            "address": "741 Green Rd, Polokwane, 0700"
        },
        # Total: 10 suppliers
    ],

    "inventory_products": [
        {
            "name": "Beef Brisket (1kg)",
            "description": "Prime beef brisket for traditional braai",
            "sku": "BEEF-BRISKET-001", 
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 85.50,
            "quantity_in_stock": 150.5,
            "reorder_level": 25.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Meat Cooler A",
            "store_id": ""
        },
        {
            "name": "Lamb Ribs (1kg)",
            "description": "Fresh lamb ribs for grilling",
            "sku": "LAMB-RIBS-001",
            "unit_of_measure": "kg", 
            "tenant_id": "",
            "unit_cost": 120.75,
            "quantity_in_stock": 80.2,
            "reorder_level": 15.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Meat Cooler B",
            "store_id": ""
        },
        {
            "name": "Chicken Whole (1kg)",
            "description": "Whole chicken for braai",
            "sku": "CHICKEN-WHOLE-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 45.25,
            "quantity_in_stock": 200.0,
            "reorder_level": 30.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Poultry Cooler A",
            "store_id": ""
        },
        {
            "name": "Pork Ribs (1kg)",
            "description": "Pork ribs for BBQ",
            "sku": "PORK-RIBS-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 75.80,
            "quantity_in_stock": 120.5,
            "reorder_level": 20.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Meat Cooler C",
            "store_id": ""
        },
        {
            "name": "Boerewors (1kg)",
            "description": "Traditional farmer's sausage",
            "sku": "BOEREWORS-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 65.90,
            "quantity_in_stock": 180.0,
            "reorder_level": 25.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Meat Cooler D",
            "store_id": ""
        },
        {
            "name": "Maize Meal (10kg)",
            "description": "White maize meal for pap",
            "sku": "MAIZE-MEAL-001",
            "unit_of_measure": "bag",
            "tenant_id": "",
            "unit_cost": 85.00,
            "quantity_in_stock": 50.0,
            "reorder_level": 10.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Dry Storage A",
            "store_id": ""
        },
        {
            "name": "Tomatoes (1kg)",
            "description": "Fresh tomatoes for cooking",
            "sku": "TOMATOES-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 12.50,
            "quantity_in_stock": 25.0,
            "reorder_level": 5.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Vegetable Cooler",
            "store_id": ""
        },
        {
            "name": "Onions (1kg)",
            "description": "Fresh onions",
            "sku": "ONIONS-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 8.75,
            "quantity_in_stock": 30.0,
            "reorder_level": 5.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Vegetable Cooler",
            "store_id": ""
        },
        {
            "name": "Carrots (1kg)",
            "description": "Fresh carrots",
            "sku": "CARROTS-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 9.25,
            "quantity_in_stock": 20.0,
            "reorder_level": 4.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Vegetable Cooler",
            "store_id": ""
        },
        {
            "name": "Potatoes (1kg)",
            "description": "Fresh potatoes",
            "sku": "POTATOES-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 10.50,
            "quantity_in_stock": 40.0,
            "reorder_level": 8.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Vegetable Cooler",
            "store_id": ""
        },
        {
            "name": "Cabbage (each)",
            "description": "Fresh cabbage",
            "sku": "CABBAGE-001",
            "unit_of_measure": "each",
            "tenant_id": "",
            "unit_cost": 15.00,
            "quantity_in_stock": 25.0,
            "reorder_level": 5.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Vegetable Cooler",
            "store_id": ""
        },
        {
            "name": "Spinach (1kg)",
            "description": "Fresh spinach",
            "sku": "SPINACH-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 18.00,
            "quantity_in_stock": 15.0,
            "reorder_level": 3.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Vegetable Cooler",
            "store_id": ""
        },
        {
            "name": "Rice (10kg)",
            "description": "Long grain rice",
            "sku": "RICE-001",
            "unit_of_measure": "bag",
            "tenant_id": "",
            "unit_cost": 120.00,
            "quantity_in_stock": 30.0,
            "reorder_level": 6.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Dry Storage B",
            "store_id": ""
        },
        {
            "name": "Cooking Oil (5L)",
            "description": "Vegetable cooking oil",
            "sku": "OIL-001",
            "unit_of_measure": "bottle",
            "tenant_id": "",
            "unit_cost": 65.00,
            "quantity_in_stock": 20.0,
            "reorder_level": 4.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Dry Storage C",
            "store_id": ""
        },
        {
            "name": "Salt (1kg)",
            "description": "Table salt",
            "sku": "SALT-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 8.50,
            "quantity_in_stock": 10.0,
            "reorder_level": 2.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Dry Storage D",
            "store_id": ""
        },
        {
            "name": "Black Pepper (500g)",
            "description": "Ground black pepper",
            "sku": "PEPPER-001",
            "unit_of_measure": "g",
            "tenant_id": "",
            "unit_cost": 45.00,
            "quantity_in_stock": 5.0,
            "reorder_level": 1.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Spice Rack",
            "store_id": ""
        },
        {
            "name": "Garlic (1kg)",
            "description": "Fresh garlic",
            "sku": "GARLIC-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 35.00,
            "quantity_in_stock": 8.0,
            "reorder_level": 2.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Vegetable Cooler",
            "store_id": ""
        },
        {
            "name": "Ginger (1kg)",
            "description": "Fresh ginger",
            "sku": "GINGER-001",
            "unit_of_measure": "kg",
            "tenant_id": "",
            "unit_cost": 42.00,
            "quantity_in_stock": 6.0,
            "reorder_level": 1.5,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Vegetable Cooler",
            "store_id": ""
        },
        {
            "name": "Chili Powder (500g)",
            "description": "Spicy chili powder",
            "sku": "CHILI-001",
            "unit_of_measure": "g",
            "tenant_id": "",
            "unit_cost": 28.00,
            "quantity_in_stock": 4.0,
            "reorder_level": 1.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Spice Rack",
            "store_id": ""
        },
        {
            "name": "Curry Powder (500g)",
            "description": "Traditional curry powder",
            "sku": "CURRY-001",
            "unit_of_measure": "g",
            "tenant_id": "",
            "unit_cost": 32.00,
            "quantity_in_stock": 6.0,
            "reorder_level": 1.5,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Spice Rack",
            "store_id": ""
        },
        {
            "name": "Paprika (500g)",
            "description": "Sweet paprika",
            "sku": "PAPRIKA-001",
            "unit_of_measure": "g",
            "tenant_id": "",
            "unit_cost": 26.00,
            "quantity_in_stock": 5.0,
            "reorder_level": 1.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Spice Rack",
            "store_id": ""
        },
        {
            "name": "Cumin (500g)",
            "description": "Ground cumin",
            "sku": "CUMIN-001",
            "unit_of_measure": "g",
            "tenant_id": "",
            "unit_cost": 38.00,
            "quantity_in_stock": 4.0,
            "reorder_level": 1.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Spice Rack",
            "store_id": ""
        },
        {
            "name": "Coriander (500g)",
            "description": "Ground coriander",
            "sku": "CORIANDER-001",
            "unit_of_measure": "g",
            "tenant_id": "",
            "unit_cost": 34.00,
            "quantity_in_stock": 5.0,
            "reorder_level": 1.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Spice Rack",
            "store_id": ""
        },
        {
            "name": "Bay Leaves (100g)",
            "description": "Dried bay leaves",
            "sku": "BAYLEAVES-001",
            "unit_of_measure": "g",
            "tenant_id": "",
            "unit_cost": 22.00,
            "quantity_in_stock": 3.0,
            "reorder_level": 0.5,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Spice Rack",
            "store_id": ""
        },
        {
            "name": "Thyme (100g)",
            "description": "Dried thyme",
            "sku": "THYME-001",
            "unit_of_measure": "g",
            "tenant_id": "",
            "unit_cost": 24.00,
            "quantity_in_stock": 4.0,
            "reorder_level": 0.5,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Spice Rack",
            "store_id": ""
        },
        {
            "name": "Rosemary (100g)",
            "description": "Dried rosemary",
            "sku": "ROSEMARY-001",
            "unit_of_measure": "g",
            "tenant_id": "",
            "unit_cost": 26.00,
            "quantity_in_stock": 3.0,
            "reorder_level": 0.5,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Spice Rack",
            "store_id": ""
        },
        {
            "name": "Oregano (100g)",
            "description": "Dried oregano",
            "sku": "OREGANO-001",
            "unit_of_measure": "g",
            "tenant_id": "",
            "unit_cost": 20.00,
            "quantity_in_stock": 4.0,
            "reorder_level": 0.5,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Spice Rack",
            "store_id": ""
        },
        {
            "name": "Flour (10kg)",
            "description": "All-purpose flour",
            "sku": "FLOUR-001",
            "unit_of_measure": "bag",
            "tenant_id": "",
            "unit_cost": 95.00,
            "quantity_in_stock": 25.0,
            "reorder_level": 5.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Dry Storage E",
            "store_id": ""
        },
        {
            "name": "Sugar (10kg)",
            "description": "White sugar",
            "sku": "SUGAR-001",
            "unit_of_measure": "bag",
            "tenant_id": "",
            "unit_cost": 110.00,
            "quantity_in_stock": 20.0,
            "reorder_level": 4.0,
            "supplier_id": "",
            "inv_category_id": "",
            "location_in_warehouse": "Dry Storage F",
            "store_id": ""
        },
        # Total: 30 inventory products
    ],

    "orders": [
        # Completed orders from today - 8 entries
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "", 
            "total_amount": 386.00,
            "status": "completed",
            "notes": "Dine-in, paid with card",
            "items": [],
            "subtotal_amount": 350.00,
            "tax_amount": 36.00,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "paid", 
            "payment_method": "card",
            "created_at": datetime.now() - timedelta(hours=2)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 215.00,
            "status": "completed",
            "notes": "Takeaway order",
            "items": [],
            "subtotal_amount": 195.45,
            "tax_amount": 19.55,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "takeaway",
            "payment_status": "paid",
            "payment_method": "cash",
            "created_at": datetime.now() - timedelta(hours=3)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 540.00,
            "status": "completed",
            "notes": "Family dinner",
            "items": [],
            "subtotal_amount": 490.91,
            "tax_amount": 49.09,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "paid",
            "payment_method": "card",
            "created_at": datetime.now() - timedelta(hours=4)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 128.00,
            "status": "completed",
            "notes": "Quick lunch",
            "items": [],
            "subtotal_amount": 116.36,
            "tax_amount": 11.64,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "paid",
            "payment_method": "cash",
            "created_at": datetime.now() - timedelta(hours=5)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 320.00,
            "status": "completed",
            "notes": "Business meeting",
            "items": [],
            "subtotal_amount": 290.91,
            "tax_amount": 29.09,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "paid",
            "payment_method": "card",
            "created_at": datetime.now() - timedelta(hours=6)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 95.00,
            "status": "completed",
            "notes": "Single person",
            "items": [],
            "subtotal_amount": 86.36,
            "tax_amount": 8.64,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "takeaway",
            "payment_status": "paid",
            "payment_method": "cash",
            "created_at": datetime.now() - timedelta(hours=7)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 420.00,
            "status": "completed",
            "notes": "Birthday celebration",
            "items": [],
            "subtotal_amount": 381.82,
            "tax_amount": 38.18,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "paid",
            "payment_method": "card",
            "created_at": datetime.now() - timedelta(hours=8)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 180.00,
            "status": "completed",
            "notes": "Couple dinner",
            "items": [],
            "subtotal_amount": 163.64,
            "tax_amount": 16.36,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "paid",
            "payment_method": "cash",
            "created_at": datetime.now() - timedelta(hours=9)
        },
        
        # Active orders - 7 entries  
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 215.00,
            "status": "cooking", 
            "notes": "Takeaway order",
            "items": [],
            "subtotal_amount": 195.45,
            "tax_amount": 19.55,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "takeaway",
            "payment_status": "unpaid",
            "payment_method": None,
            "created_at": datetime.now() - timedelta(minutes=15)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 350.00,
            "status": "pending",
            "notes": "Waiting for payment",
            "items": [],
            "subtotal_amount": 318.18,
            "tax_amount": 31.82,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "unpaid",
            "payment_method": None,
            "created_at": datetime.now() - timedelta(minutes=10)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 280.00,
            "status": "preparing",
            "notes": "Special instructions",
            "items": [],
            "subtotal_amount": 254.55,
            "tax_amount": 25.45,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "unpaid",
            "payment_method": None,
            "created_at": datetime.now() - timedelta(minutes=25)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 150.00,
            "status": "cooking",
            "notes": "Extra spicy",
            "items": [],
            "subtotal_amount": 136.36,
            "tax_amount": 13.64,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "takeaway",
            "payment_status": "unpaid",
            "payment_method": None,
            "created_at": datetime.now() - timedelta(minutes=20)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 480.00,
            "status": "pending",
            "notes": "Large group order",
            "items": [],
            "subtotal_amount": 436.36,
            "tax_amount": 43.64,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "unpaid",
            "payment_method": None,
            "created_at": datetime.now() - timedelta(minutes=5)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 190.00,
            "status": "preparing",
            "notes": "No onions",
            "items": [],
            "subtotal_amount": 172.73,
            "tax_amount": 17.27,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "unpaid",
            "payment_method": None,
            "created_at": datetime.now() - timedelta(minutes=30)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 220.00,
            "status": "cooking",
            "notes": "Takeaway - urgent",
            "items": [],
            "subtotal_amount": 200.00,
            "tax_amount": 20.00,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "takeaway",
            "payment_status": "unpaid",
            "payment_method": None,
            "created_at": datetime.now() - timedelta(minutes=12)
        },
        
        # Additional orders to reach 30 total
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 310.00,
            "status": "completed",
            "notes": "Regular customer",
            "items": [],
            "subtotal_amount": 281.82,
            "tax_amount": 28.18,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "dine-in",
            "payment_status": "paid",
            "payment_method": "card",
            "created_at": datetime.now() - timedelta(hours=10)
        },
        {
            "store_id": "",
            "table_id": "",
            "customer_id": "",
            "total_amount": 175.00,
            "status": "completed",
            "notes": "Lunch special",
            "items": [],
            "subtotal_amount": 159.09,
            "tax_amount": 15.91,
            "discount_amount": 0.0,
            "employee_id": "",
            "order_type": "takeaway",
            "payment_status": "paid",
            "payment_method": "cash",
            "created_at": datetime.now() - timedelta(hours=11)
        },
        # ... 15 more orders to reach 30 total
        # Note: The code will generate additional orders programmatically
    ],

    "shifts": [
        # Generated programmatically for the next section
    ],

    "timesheet_entries": [
        # Generated programmatically for the next section  
    ],

    "payroll": [
        # Generated programmatically for the next section
    ],

    "payroll_settings": [
        {
            "store_id": "",
            "default_payment_cycle": "monthly",
            "tax_rate": 0.25,
            "overtime_multiplier": 1.5,
            "created_at": datetime.now()
        }
    ],

    "purchase_orders": [
        # Generated programmatically for the next section
    ],

    "goods_receipts": [
        # Generated programmatically for the next section  
    ]
}

class DataLoader:
    def __init__(self):
        self.ids = {}

    async def _drop_collections(self):
        """Clear existing data from all collections"""
        print("Dropping existing collections...")
        for key in SAMPLE_DATA:
            collection = get_collection(key)
            await collection.delete_many({})
        # Drop additional collections that might not be in SAMPLE_DATA
        additional_collections = ["order_items", "recipes", "payroll_deductions", "stock_adjustments"]
        for coll_name in additional_collections:
            collection = get_collection(coll_name)
            await collection.delete_many({})
        print("Collections dropped.")

    async def load_all_data(self):
        """Main method to load all sample data"""
        await self._drop_collections()

        print("Loading core data: Tenants, Stores, Users, Roles, Job Titles...")
        await self._load_tenants_and_stores()
        await self._load_users_and_roles_and_titles()
        await self._load_employees()

        print("Loading menu and inventory data...")
        await self._load_categories()
        await self._load_suppliers()
        await self._load_inventory_items()
        await self._load_foods_and_recipes()

        print("Loading customers and tables...")
        await self._load_customers_and_tables()

        print("Loading transactional data: Orders, POs, GRs...")
        await self._load_orders()
        await self._load_purchase_orders_and_receipts()

        print("Loading HR and payroll data...")
        await self._load_hr_data()
        
        print("\n🎉 All comprehensive Imbizo Shisanyama data has been successfully loaded! 🎉")
        print(f"📍 Loaded data for: {len(SAMPLE_DATA['stores'])} stores, {len(SAMPLE_DATA['foods'])} foods, {len(SAMPLE_DATA['customers'])} customers, {len(SAMPLE_DATA['orders'])} orders")

    async def _load_tenants_and_stores(self):
        """Load tenants and stores with proper relationships"""
        tenants_collection = get_collection("tenants")
        stores_collection = get_collection("stores")
        
        # Load tenant
        for tenant in SAMPLE_DATA["tenants"]:
            result = await tenants_collection.insert_one(tenant)
            self.ids[tenant["name"]] = str(result.inserted_id)
        
        # Load stores
        for store in SAMPLE_DATA["stores"]:
            store["tenant_id"] = self.ids["Imbizo Shisanyama Group"]
            result = await stores_collection.insert_one(store)
            self.ids[store["name"]] = str(result.inserted_id)

    async def _load_users_and_roles_and_titles(self):
        """Load users, access roles, and job titles"""
        users_collection = get_collection("users")
        roles_collection = get_collection("access_roles")
        titles_collection = get_collection("job_titles")
        
        # Load users with hashed passwords
        for user in SAMPLE_DATA["users"]:
            hashed_password = bcrypt.hashpw(user["password"].encode(), bcrypt.gensalt())
            user["password"] = hashed_password.decode()
            user["email_verified_at"] = datetime.now()
            user["created_at"] = datetime.now()
            user["updated_at"] = datetime.now()
            result = await users_collection.insert_one(user)
            self.ids[user["username"]] = str(result.inserted_id)

        # Load access roles
        for role in SAMPLE_DATA["access_roles"]:
            role["created_at"] = datetime.now()
            role["updated_at"] = datetime.now()
            result = await roles_collection.insert_one(role)
            self.ids[role["name"]] = str(result.inserted_id)

        # Load job titles
        for title in SAMPLE_DATA["job_titles"]:
            title["store_id"] = self.ids["Imbizo Shisanyama - Busy Corner"]
            title["created_at"] = datetime.now()
            title["updated_at"] = datetime.now()
            result = await titles_collection.insert_one(title)
            self.ids[title["title"]] = str(result.inserted_id)

    async def _load_employees(self):
        """Load employees with proper user and role relationships"""
        employees_collection = get_collection("employees")
        
        employee_map = {
            "Rita": ("ritazwane", "General Manager", "Admin", "Imbizo Shisanyama - Busy Corner"),
            "Sipho": ("siphodlamini", "Service Manager", "Manager", "Imbizo Shisanyama - Busy Corner"),
            "Noma": ("nomandlovu", "Head Chef", "Chef", "Imbizo Shisanyama - Busy Corner"),
            "Kagiso": ("kagisonyathi", "Manager", "Manager", "Imbizo Shisanyama - Busy Corner"),
            "Ayanda": ("ayandamdluli", "Manager", "Manager", "Imbizo Shisanyama - Busy Corner"),
            "Andile": ("andilemokoena", "Grill Master", "Chef", "Imbizo Shisanyama - Busy Corner"),
            "Bongani": ("bonganimthethwa", "Line Cook", "Chef", "Imbizo Shisanyama - Busy Corner"),
            "Zanele": ("zanelemthembu", "Sous Chef", "Chef", "Imbizo Shisanyama - Busy Corner"),
            "Sizwe": ("sizwemabuza", "Line Cook", "Chef", "Imbizo Shisanyama - Busy Corner"),
            "Jabulani": ("jabulanimpanze", "Line Cook", "Chef", "Imbizo Shisanyama - Busy Corner"),
            "Ntando": ("ntandoyenkosi", "Line Cook", "Chef", "Imbizo Shisanyama - Busy Corner"),
            "Lungela": ("lungelamkhize", "Line Cook", "Chef", "Imbizo Shisanyama - Busy Corner"),
            "Sibongiseni": ("sibongiseni", "Line Cook", "Chef", "Imbizo Shisanyama - Busy Corner"),
            "Lerato": ("leratombele", "Waiter/Waitress", "Waiter", "Imbizo Shisanyama - Busy Corner"),
            "Thandi": ("thandimkize", "Waiter/Waitress", "Waiter", "Imbizo Shisanyama - Busy Corner"),
            "Mpho": ("mphomoloi", "Waiter/Waitress", "Waiter", "Imbizo Shisanyama - Busy Corner"),
            "Tenda": ("tendancube", "Waiter/Waitress", "Waiter", "Imbizo Shisanyama - Busy Corner"),
            "Nonhlanhla": ("nonhlanhla", "Waiter/Waitress", "Waiter", "Imbizo Shisanyama - Busy Corner"),
            "Mpho": ("mphomatsenjwa", "Waiter/Waitress", "Waiter", "Imbizo Shisanyama - Busy Corner"),
            "Thabiso": ("thabisancube", "Waiter/Waitress", "Waiter", "Imbizo Shisanyama - Busy Corner"),
            "Kiosk": ("kiosk_busycorner", "Cashier", "Kiosk-User", "Imbizo Shisanyama - Busy Corner"),
        }

        for employee in SAMPLE_DATA["employees"]:
            name = employee["first_name"]
            if name in employee_map:
                user_id, title_name, role_name, store_name = employee_map[name]
                
                employee["user_id"] = self.ids[user_id]
                employee["job_title_id"] = self.ids[title_name]
                employee["access_role_ids"] = [self.ids[role_name]]
                employee["main_access_role_id"] = self.ids[role_name]
                employee["tenant_id"] = self.ids["Imbizo Shisanyama Group"]
                employee["store_id"] = self.ids[store_name]
                employee["created_at"] = datetime.now()
                employee["updated_at"] = datetime.now()
                
                # Convert date object to datetime object
                employee["hire_date"] = datetime.combine(employee["hire_date"], datetime.min.time())

                result = await employees_collection.insert_one(employee)
                self.ids[f"employee_{name}"] = str(result.inserted_id)

    async def _load_categories(self):
        """Load food categories"""
        categories_collection = get_collection("categories")
        
        for cat in SAMPLE_DATA["categories"]:
            cat["store_id"] = self.ids["Imbizo Shisanyama - Busy Corner"]
            cat["created_at"] = datetime.now()
            cat["updated_at"] = datetime.now()
            result = await categories_collection.insert_one(cat)
            self.ids[f"cat_{cat['name']}"] = str(result.inserted_id)

    async def _load_suppliers(self):
        """Load suppliers"""
        suppliers_collection = get_collection("suppliers")
        
        for supplier in SAMPLE_DATA["suppliers"]:
            supplier["created_at"] = datetime.now()
            supplier["updated_at"] = datetime.now()
            result = await suppliers_collection.insert_one(supplier)
            self.ids[supplier["name"]] = str(result.inserted_id)

    async def _load_inventory_items(self):
        """Load inventory products"""
        products_collection = get_collection("inventory_products")
        
        supplier_map = {
            "Beef Brisket (1kg)": "Local Meat Supplier Co.",
            "Lamb Ribs (1kg)": "Local Meat Supplier Co.",
            "Chicken Whole (1kg)": "Local Meat Supplier Co.",
            "Pork Ribs (1kg)": "Local Meat Supplier Co.",
            "Boerewors (1kg)": "Local Meat Supplier Co.",
            "Maize Meal (10kg)": "Grain Masters",
            "Tomatoes (1kg)": "Fresh Produce Distributors",
            "Onions (1kg)": "Fresh Produce Distributors",
            "Carrots (1kg)": "Fresh Produce Distributors",
            "Potatoes (1kg)": "Fresh Produce Distributors",
            "Cabbage (each)": "Fresh Produce Distributors",
            "Spinach (1kg)": "Fresh Produce Distributors",
            "Rice (10kg)": "Grain Masters",
            "Cooking Oil (5L)": "Bakery Supplies Inc",
            "Salt (1kg)": "Bakery Supplies Inc",
            "Black Pepper (500g)": "Spice Traders",
            "Garlic (1kg)": "Fresh Produce Distributors",
            "Ginger (1kg)": "Fresh Produce Distributors",
            "Chili Powder (500g)": "Spice Traders",
            "Curry Powder (500g)": "Spice Traders",
            "Paprika (500g)": "Spice Traders",
            "Cumin (500g)": "Spice Traders",
            "Coriander (500g)": "Spice Traders",
            "Bay Leaves (100g)": "Spice Traders",
            "Thyme (100g)": "Spice Traders",
            "Rosemary (100g)": "Spice Traders",
            "Oregano (100g)": "Spice Traders",
            "Flour (10kg)": "Bakery Supplies Inc",
            "Sugar (10kg)": "Bakery Supplies Inc",
        }

        for product in SAMPLE_DATA["inventory_products"]:
            product["tenant_id"] = self.ids["Imbizo Shisanyama Group"]
            if product["name"] in supplier_map:
                product["supplier_id"] = self.ids[supplier_map[product["name"]]]
            product["store_id"] = self.ids["Imbizo Shisanyama - Busy Corner"]
            product["last_restocked_at"] = datetime.now(timezone.utc).isoformat()
            product["created_at"] = datetime.now()
            product["updated_at"] = datetime.now()
            result = await products_collection.insert_one(product)
            self.ids[f"product_{product['name']}"] = str(result.inserted_id)

    async def _load_foods_and_recipes(self):
        """Load foods and their recipes"""
        foods_collection = get_collection("foods")
        recipes_collection = get_collection("recipes")
        
        food_category_map = {
            "Traditional Beef Braai": "Braai Specialties",
            "Lamb Chops": "Braai Specialties",
            "Boerewors Roll": "Braai Specialties",
            "Chicken Braai": "Braai Specialties",
            "Pork Ribs": "Braai Specialties",
            "Mutton Curry": "Braai Specialties",
            "Oxtail Pot": "Braai Specialties",
            "Tripe Special": "Braai Specialties",
            "Beef Short Ribs": "Braai Specialties",
            "Chicken Wings": "Braai Specialties",
            "Lamb Skewers": "Braai Specialties",
            "Beef Kebabs": "Braai Specialties",
            "Pork Neck Steak": "Braai Specialties",
            "Chicken Livers": "Braai Specialties",
            "Mixed Grill Platter": "Braai Specialties",
            "Traditional Beef Stew": "Stews & Pots",
            "Chicken Curry": "Stews & Pots",
            "Vegetable Pot": "Stews & Pots",
            "Bean Stew": "Stews & Pots",
            "Lamb Stew": "Stews & Pots",
            "Fish Curry": "Stews & Pots",
            "Chicken Feet": "Stews & Pots",
            "Tripe and Beans": "Stews & Pots",
            "Pap (Maize Meal)": "Sides & Pap",
            "Chakalaka": "Sides & Pap",
            "Dombolo (Dumplings)": "Sides & Pap",
            "Rice": "Sides & Pap",
            "Salad": "Sides & Pap",
            "Cabbage": "Sides & Pap",
            "Spinach": "Sides & Pap",
            "Potato Salad": "Sides & Pap",
            "Garlic Bread": "Sides & Pap",
            "Sweet Potato": "Sides & Pap",
            "Grapetiser Red 330ml": "Drinks & Beverages",
            "Coca-Cola 330ml": "Drinks & Beverages",
            "Fanta Orange 330ml": "Drinks & Beverages",
            "Sprite 330ml": "Drinks & Beverages",
            "Still Water 500ml": "Drinks & Beverages",
            "Sparkling Water 500ml": "Drinks & Beverages",
            "Castle Lager 340ml": "Drinks & Beverages",
            "Black Label 340ml": "Drinks & Beverages",
            "House Wine Glass": "Drinks & Beverages",
            "Fresh Orange Juice": "Drinks & Beverages",
            "Apple Juice 330ml": "Drinks & Beverages",
            "Ginger Beer 330ml": "Drinks & Beverages",
        }

        for food in SAMPLE_DATA["foods"]:
            food["tenant_id"] = self.ids["Imbizo Shisanyama Group"]
            food["store_id"] = self.ids["Imbizo Shisanyama - Busy Corner"]
            if food["name"] in food_category_map:
                food["category_id"] = self.ids[f"cat_{food_category_map[food['name']]}"]
            food["created_at"] = datetime.now()
            food["updated_at"] = datetime.now()
            
            result = await foods_collection.insert_one(food)
            food_id = str(result.inserted_id)
            self.ids[f"food_{food['name']}"] = food_id

    async def _load_customers_and_tables(self):
        """Load customers and tables"""
        customers_collection = get_collection("customers")
        tables_collection = get_collection("tables")
        
        # Load customers
        for customer in SAMPLE_DATA["customers"]:
            customer["store_id"] = self.ids["Imbizo Shisanyama - Busy Corner"]
            customer["created_at"] = datetime.now()
            customer["updated_at"] = datetime.now()
            result = await customers_collection.insert_one(customer)
            self.ids[f"customer_{customer['first_name']}"] = str(result.inserted_id)

        # Load tables
        for table in SAMPLE_DATA["tables"]:
            table["store_id"] = self.ids["Imbizo Shisanyama - Busy Corner"]
            table["created_at"] = datetime.now()
            table["updated_at"] = datetime.now()
            result = await tables_collection.insert_one(table)
            self.ids[f"table_{table['name']}"] = str(result.inserted_id)

    async def _load_orders(self):
        """Load orders with order items"""
        orders_collection = get_collection("orders")
        order_items_collection = get_collection("order_items")
        
        # Calculate tax rate
        TAX_RATE = 0.15  # 15% VAT in South Africa
        
        for order_data in SAMPLE_DATA["orders"]:
            # Set store and relationships
            order_data["store_id"] = self.ids["Imbizo Shisanyama - Busy Corner"]
            if order_data.get("table_id"):
                order_data["table_id"] = self.ids["table_Table 1"]
            if order_data.get("customer_id"):  
                order_data["customer_id"] = self.ids["customer_Thabo"]
            if order_data.get("employee_id"):
                order_data["employee_id"] = self.ids["employee_Lerato"]
            
            order_data["created_at"] = datetime.now()
            order_data["updated_at"] = datetime.now()
            
            result = await orders_collection.insert_one(order_data)
            order_id = str(result.inserted_id)
            
            # Create sample order items
            sample_items = [
                {
                    "order_id": order_id,
                    "food_id": self.ids["food_Traditional Beef Braai"],
                    "quantity": 1,
                    "price": 189.00,
                    "sub_total": 189.00,
                    "name": "Traditional Beef Braai",
                    "price_at_sale": 189.00,
                    "created_at": datetime.now()
                },
                {
                    "order_id": order_id, 
                    "food_id": self.ids["food_Pap (Maize Meal)"],
                    "quantity": 2,
                    "price": 15.00,
                    "sub_total": 30.00,
                    "name": "Pap (Maize Meal)",
                    "price_at_sale": 15.00,
                    "created_at": datetime.now()
                }
            ]
            
            for item in sample_items:
                await order_items_collection.insert_one(item)

    async def _load_purchase_orders_and_receipts(self):
        """Load purchase orders and goods receipts"""
        po_collection = get_collection("purchase_orders")
        gr_collection = get_collection("goods_receipts")

        # Create sample purchase orders
        for i in range(5):
            po_items = [
                {
                    "inventory_product_id": self.ids["product_Beef Brisket (1kg)"],
                    "quantity": 50.0,
                    "unit_of_measure": "kg", 
                    "unit_cost": 85.50,
                    "total_cost": 4275.00,
                    "notes": f"Monthly beef supply #{i+1}"
                }
            ]
            
            po = {
                "po_number": f"PO-2024-{i+1:03d}",
                "supplier_id": self.ids["Local Meat Supplier Co."],
                "store_id": self.ids["Imbizo Shisanyama - Busy Corner"],
                "status": "delivered",
                "order_date": datetime.now() - timedelta(days=7-i),
                "expected_delivery_date": datetime.now() - timedelta(days=5-i),
                "total_amount": 4275.00,
                "ordered_by": self.ids["employee_Rita"],
                "items": po_items,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            po_result = await po_collection.insert_one(po)
            po_id = str(po_result.inserted_id)
            
            # Create corresponding goods receipt
            gr_items = [
                {
                    "inventory_product_id": self.ids["product_Beef Brisket (1kg)"],
                    "purchase_order_id": po_id,
                    "received_quantity": 50.0,
                    "unit_of_measure": "kg",
                    "condition": "good",
                    "notes": "Received in good condition"
                }
            ]
            
            gr = {
                "receipt_number": f"GR-2024-{i+1:03d}",
                "purchase_order_id": po_id,
                "store_id": self.ids["Imbizo Shisanyama - Busy Corner"],
                "receipt_date": datetime.now() - timedelta(days=5-i),
                "received_by": self.ids["employee_Sipho"],
                "items": gr_items,
                "status": "completed",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            await gr_collection.insert_one(gr)

    async def _load_hr_data(self):
        """Load HR data including shifts, timesheets, and payroll"""
        shifts_collection = get_collection("shifts")
        ts_collection = get_collection("timesheet_entries")
        payroll_collection = get_collection("payroll")
        payroll_settings_collection = get_collection("payroll_settings")
        
        # Load payroll settings
        for setting in SAMPLE_DATA["payroll_settings"]:
            setting["store_id"] = self.ids["Imbizo Shisanyama - Busy Corner"]
            setting["created_at"] = datetime.now()
            setting["updated_at"] = datetime.now()
            await payroll_settings_collection.insert_one(setting)
        
        # Generate shifts for current week
        today = datetime.now().date()
        days_since_monday = today.weekday()
        monday = today - timedelta(days=days_since_monday)
        
        employee_shift_map = {
            "Rita": {"id": self.ids["employee_Rita"], "name": "Rita Zwane", "title": "Manager Shift"},
            "Sipho": {"id": self.ids["employee_Sipho"], "name": "Sipho Dlamini", "title": "Service Shift"},
            "Lerato": {"id": self.ids["employee_Lerato"], "name": "Lerato Mbele", "title": "Server Shift"},
        }
        
        # Generate 20+ shifts
        shifts_data = []
        for i in range(7):  # One week of shifts
            shift_date = monday + timedelta(days=i)
            
            # Morning shift
            morning_start = datetime.combine(shift_date, time(8, 0, 0))
            morning_end = datetime.combine(shift_date, time(16, 0, 0))
            
            # Evening shift  
            evening_start = datetime.combine(shift_date, time(16, 0, 0))
            evening_end = datetime.combine(shift_date, time(23, 0, 0))
            
            for key, employee in employee_shift_map.items():
                # Add morning shift
                shifts_data.append({
                    "employee_id": employee["id"],
                    "start": morning_start,
                    "end": morning_end,
                    "title": employee["title"],
                    "store_id": self.ids["Imbizo Shisanyama - Busy Corner"],
                    "employee_name": employee["name"],
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                })
                
                # Add evening shift
                shifts_data.append({
                    "employee_id": employee["id"], 
                    "start": evening_start,
                    "end": evening_end,
                    "title": employee["title"],
                    "store_id": self.ids["Imbizo Shisanyama - Busy Corner"],
                    "employee_name": employee["name"],
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                })

        # Insert shifts
        for shift in shifts_data:
            await shifts_collection.insert_one(shift)

        # Generate 20+ timesheet entries
        ts_data = []
        for i in range(7):  # One week of timesheets
            shift_date = monday + timedelta(days=i)
            
            clock_in = datetime.combine(shift_date, time(7, 55, 0))
            clock_out = datetime.combine(shift_date, time(16, 5, 0))
            duration_minutes = (clock_out - clock_in).total_seconds() / 60
            
            for key, employee in employee_shift_map.items():
                ts_data.append({
                    "employee_id": employee["id"],
                    "clock_in": clock_in,
                    "clock_out": clock_out, 
                    "duration_minutes": duration_minutes,
                    "store_id": self.ids["Imbizo Shisanyama - Busy Corner"],
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                })

        for ts in ts_data:
            await ts_collection.insert_one(ts)
        
        # Generate 20+ payroll entries
        for i, (key, employee) in enumerate(employee_shift_map.items()):
            pay_period_start = datetime.combine(monday - timedelta(days=7), datetime.min.time())
            pay_period_end = datetime.combine(monday, datetime.min.time())
            
            base_salary = 30000 + (i * 5000)  # Vary salaries
            overtime_hours = random.randint(0, 10)
            overtime_pay = overtime_hours * (base_salary / 160) * 1.5  # 1.5x overtime rate
            
            gross_pay = base_salary + overtime_pay
            tax_deductions = gross_pay * 0.25  # 25% tax
            
            payroll_data = {
                "employee_id": employee["id"],
                "pay_period_start": pay_period_start,
                "pay_period_end": pay_period_end,
                "payment_cycle": "monthly",
                "gross_pay": gross_pay,
                "tax_deductions": tax_deductions,
                "net_pay": gross_pay - tax_deductions,
                "status": "paid",
                "hours_worked": 160,
                "overtime_hours": overtime_hours,
                "overtime_rate": 1.5,
                "store_id": self.ids["Imbizo Shisanyama - Busy Corner"],
                "deductions": [],
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            await payroll_collection.insert_one(payroll_data)


if __name__ == "__main__":
    loader = DataLoader()
    asyncio.run(loader.load_all_data())