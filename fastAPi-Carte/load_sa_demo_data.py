# load_sa_demo_data.py
import asyncio
from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from bson import ObjectId
import os
import bcrypt

# Ensure your models and database connection are correctly imported
from app.database import get_collection
from app.models.core import (
    Food, Store, Order, OrderItem, Category, Customer, Table,
    PurchaseOrder, GoodsReceipt, User
)
from app.models.hr import (
    Employee, AccessRole, JobTitle, Shift, TimesheetEntry,
    Payroll, PayrollDeduction, PayrollSettings
)
from app.models.inventory import (
    InventoryProduct, Supplier, Unit
)

# --- Define comprehensive sample data using your models ---
SAMPLE_DATA = {
    "tenants": [
        {"name": "Mzansi Eats Co.", "created_at": datetime.now()},
        {"name": "Cape Cuisine Group", "created_at": datetime.now()},
    ],
    "stores": [
        {"name": "The Braai Spot", "address": "24 Long St, Cape Town", "phone": "+27 21 555 0100", "email": "braai.spot@mzansieats.com", "tenant_id": ""},
        {"name": "Jozi's Kitchen", "address": "15 Main Rd, Johannesburg", "phone": "+27 11 555 0200", "email": "jozi.kitchen@mzansieats.com", "tenant_id": ""},
        {"name": "Durban Spice Grill", "address": "10 Point Rd, Durban", "phone": "+27 31 555 0300", "email": "durban.grill@capecuisine.com", "tenant_id": ""},
    ],
    "users": [
        {"username": "admin", "email": "admin@mzansieats.com", "password": "password", "first_name": "Sipho", "last_name": "Dube"},
        {"username": "manager.cpt", "email": "manager.cpt@mzansieats.com", "password": "password", "first_name": "Lebo", "last_name": "Mokoena"},
        {"username": "manager.jhb", "email": "manager.jhb@mzansieats.com", "password": "password", "first_name": "Thabo", "last_name": "Ndlovu"},
        {"username": "chef.cpt", "email": "chef.cpt@mzansieats.com", "password": "password", "first_name": "Nomusa", "last_name": "Zwane"},
        {"username": "waiter.cpt", "email": "waiter.cpt@mzansieats.com", "password": "password", "first_name": "Zola", "last_name": "Khumalo"},
    ],
    "access_roles": [
        {"name": "Admin", "description": "Full system access", "permissions": ["*"], "landing_page": "/dashboard"},
        {"name": "Manager", "description": "Store management permissions", "permissions": ["dashboard", "hr", "inventory", "pos"], "landing_page": "/dashboard"},
        {"name": "Chef", "description": "Kitchen and inventory permissions", "permissions": ["kitchen", "inventory"], "landing_page": "/kitchen"},
        {"name": "Waiter", "description": "POS system access", "permissions": ["pos"], "landing_page": "/pos"},
    ],
    "job_titles": [
        {"title": "Administrator", "department": "IT", "store_id": ""},
        {"title": "Store Manager", "department": "Management", "store_id": ""},
        {"title": "Head Chef", "department": "Kitchen", "store_id": ""},
        {"title": "Waiter", "department": "Operations", "store_id": ""},
    ],
    "employees": [
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date.today(), "salary": 90000.0, "first_name": "Sipho", "last_name": "Dube", "avatar_url": "https://randomuser.me/api/portraits/men/1.jpg"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date.today(), "salary": 75000.0, "first_name": "Lebo", "last_name": "Mokoena", "avatar_url": "https://randomuser.me/api/portraits/women/2.jpg"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date.today(), "salary": 75000.0, "first_name": "Thabo", "last_name": "Ndlovu", "avatar_url": "https://randomuser.me/api/portraits/men/3.jpg"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date.today(), "salary": 60000.0, "first_name": "Nomusa", "last_name": "Zwane", "avatar_url": "https://randomuser.me/api/portraits/women/4.jpg"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date.today(), "salary": 45000.0, "first_name": "Zola", "last_name": "Khumalo", "avatar_url": "https://randomuser.me/api/portraits/men/5.jpg"},
    ],
    "units": [
        {"name": "Kilogram", "symbol": "kg"}, {"name": "Gram", "symbol": "g"},
        {"name": "Liter", "symbol": "L"}, {"name": "Milliliter", "symbol": "ml"},
        {"name": "Unit", "symbol": "pc"}, {"name": "Slab", "symbol": "slab"},
        {"name": "Loaf", "symbol": "loaf"}, {"name": "Bottle", "symbol": "btl"},
    ],
    "suppliers": [
        {"name": "Joburg Fresh Produce", "contact_person": "Jabu Ndlovu", "phone": "+27 11 555 1111", "email": "jabu.n@joburgfresh.com", "address": "10 Market St, Johannesburg"},
        {"name": "SA Meat Co.", "contact_person": "Palesa Molefe", "phone": "+27 12 555 2222", "email": "palesa.m@sameat.com", "address": "25 Butchery Rd, Pretoria"},
        {"name": "Wines of the Cape", "contact_person": "Heinrich van Zyl", "phone": "+27 21 555 3333", "email": "heinrich@winesofthecape.co.za", "address": "33 Vineyard Rd, Stellenbosch"},
    ],
    "inv_categories": [
        {"name": "Fresh Produce", "description": "Vegetables and herbs", "store_id": ""},
        {"name": "Meat & Poultry", "description": "Various cuts of meat for braai", "store_id": ""},
        {"name": "Beverages", "description": "Soft drinks and local wines", "store_id": ""},
        {"name": "Pantry Staples", "description": "Dry goods and spices", "store_id": ""},
    ],
    "inventory_products": [
        {"name": "Boerewors", "sku": "BWRS001", "unit_of_measure": "", "tenant_id": "", "unit_cost": 50.0, "quantity_in_stock": 25.0, "reorder_level": 5.0, "supplier_id": "", "inv_category_id": "", "location_in_warehouse": "Freezer A"},
        {"name": "Pap (Maize Meal)", "sku": "PAP002", "unit_of_measure": "", "tenant_id": "", "unit_cost": 15.0, "quantity_in_stock": 100.0, "reorder_level": 20.0, "supplier_id": "", "inv_category_id": "", "location_in_warehouse": "Pantry C"},
        {"name": "Chakalaka Mix", "sku": "CHAKA003", "unit_of_measure": "", "tenant_id": "", "unit_cost": 5.0, "quantity_in_stock": 50.0, "reorder_level": 10.0, "supplier_id": "", "inv_category_id": "", "location_in_warehouse": "Pantry C"},
        {"name": "Rooibos Tea Bags", "sku": "ROOI004", "unit_of_measure": "", "tenant_id": "", "unit_cost": 25.0, "quantity_in_stock": 75.0, "reorder_level": 15.0, "supplier_id": "", "inv_category_id": "", "location_in_warehouse": "Beverage A"},
    ],
    "foods": [
        {"name": "Boerewors Roll", "description": "Grilled boerewors sausage on a soft roll, topped with onion and tomato relish.", "price": 45.0, "category_id": "", "image_url": "https://picsum.photos/800/600?random=11", "tenant_id": "", "recipes": []},
        {"name": "Pap & Braai Wors", "description": "Traditional pap with a delicious grilled wors and chakalaka.", "price": 85.0, "category_id": "", "image_url": "https://picsum.photos/800/600?random=12", "tenant_id": "", "recipes": []},
        {"name": "Braaibroodjie", "description": "Grilled cheese, onion and tomato sandwich, a South African classic.", "price": 40.0, "category_id": "", "image_url": "https://picsum.photos/800/600?random=13", "tenant_id": "", "recipes": []},
        {"name": "Melktert", "description": "A classic South African milk tart with a hint of cinnamon.", "price": 30.0, "category_id": "", "image_url": "https://picsum.photos/800/600?random=14", "tenant_id": "", "recipes": []},
        {"name": "Rooibos Cappuccino", "description": "A local twist on the cappuccino, with rich rooibos espresso.", "price": 25.0, "category_id": "", "image_url": "https://picsum.photos/800/600?random=15", "tenant_id": "", "recipes": []},
    ],
    "categories": [
        {"name": "Mains", "description": "Hearty main courses", "store_id": ""},
        {"name": "Desserts", "description": "Sweet treats", "store_id": ""},
        {"name": "Beverages", "description": "Drinks and hot beverages", "store_id": ""},
    ],
    "tables": [
        {"name": "Table 1", "capacity": 4, "location": "Patio", "status": "available", "store_id": ""},
        {"name": "Table 2", "capacity": 2, "location": "Patio", "status": "occupied", "store_id": ""},
        {"name": "Table 3", "capacity": 6, "location": "Main Hall", "status": "available", "store_id": ""},
        {"name": "Table 4", "capacity": 8, "location": "Main Hall", "status": "reserved", "store_id": ""},
    ],
    "customers": [
        {"first_name": "Ayanda", "last_name": "Mabuza", "email": "ayanda.m@email.com", "phone_number": "+27 82 555 9876", "store_id": ""},
        {"first_name": "Ben", "last_name": "van der Merwe", "email": "ben.vdm@email.com", "phone_number": "+27 76 555 4321", "store_id": ""},
    ],
    "purchase_orders": [],
    "goods_receipts": [],
    "orders": [],
    "shifts": [],
    "timesheet_entries": [],
    "payroll": [],
}

class DataLoader:
    def __init__(self):
        self.ids = {}

    async def _drop_collections(self):
        print("Dropping existing collections...")
        for key in SAMPLE_DATA:
            collection = get_collection(key)
            await collection.delete_many({})
        await get_collection("order_items").delete_many({})
        print("Collections dropped.")

    async def load_all_data(self):
        await self._drop_collections()

        print("Loading core data: Tenants, Stores, Users, Roles, Job Titles...")
        await self._load_tenants_and_stores()
        await self._load_users_and_roles_and_titles()
        await self._load_employees()

        print("Loading inventory and menu data...")
        await self._load_inventory_items()
        await self._load_foods_and_recipes()

        print("Loading transactional data: Orders, POs, GRs...")
        await self._load_customers_and_tables()
        await self._load_orders()
        await self._load_purchase_orders_and_receipts()

        print("Loading HR and payroll data...")
        await self._load_hr_data()
        
        print("\n🎉 All comprehensive sample data has been successfully loaded! 🎉")

    async def _load_tenants_and_stores(self):
        tenants_collection = get_collection("tenants")
        stores_collection = get_collection("stores")
        
        for tenant in SAMPLE_DATA["tenants"]:
            result = await tenants_collection.insert_one(tenant)
            self.ids[tenant["name"]] = str(result.inserted_id)
        
        store_map = {
            "The Braai Spot": "Mzansi Eats Co.",
            "Jozi's Kitchen": "Mzansi Eats Co.",
            "Durban Spice Grill": "Cape Cuisine Group"
        }
        for store in SAMPLE_DATA["stores"]:
            store["tenant_id"] = self.ids[store_map[store["name"]]]
            result = await stores_collection.insert_one(store)
            self.ids[store["name"]] = str(result.inserted_id)

    async def _load_users_and_roles_and_titles(self):
        users_collection = get_collection("users")
        roles_collection = get_collection("access_roles")
        titles_collection = get_collection("job_titles")
        
        for user in SAMPLE_DATA["users"]:
            hashed_password = bcrypt.hashpw(user["password"].encode(), bcrypt.gensalt())
            user["password"] = hashed_password.decode()
            result = await users_collection.insert_one(user)
            self.ids[user["username"]] = str(result.inserted_id)

        for role in SAMPLE_DATA["access_roles"]:
            result = await roles_collection.insert_one(role)
            self.ids[role["name"]] = str(result.inserted_id)

        for title in SAMPLE_DATA["job_titles"]:
            await titles_collection.insert_one(title)

    async def _load_employees(self):
        employees_collection = get_collection("employees")
        title_collection = get_collection("job_titles")
        
        employee_map = {
            "Sipho": ("admin", "Administrator", "Admin", None),
            "Lebo": ("manager.cpt", "Store Manager", "Manager", "The Braai Spot"),
            "Thabo": ("manager.jhb", "Store Manager", "Manager", "Jozi's Kitchen"),
            "Nomusa": ("chef.cpt", "Head Chef", "Chef", "The Braai Spot"),
            "Zola": ("waiter.cpt", "Waiter", "Waiter", "The Braai Spot")
        }

        for employee in SAMPLE_DATA["employees"]:
            name = employee["first_name"]
            user_id, title_name, role_name, store_name = employee_map.get(name)
            
            job_title = await title_collection.find_one({"title": title_name})
            
            employee["user_id"] = self.ids[user_id]
            employee["job_title_id"] = str(job_title["_id"])
            employee["access_role_ids"] = [self.ids[role_name]]
            employee["main_access_role_id"] = self.ids[role_name]
            employee["tenant_id"] = self.ids["Mzansi Eats Co."]
            employee["store_id"] = self.ids[store_name] if store_name else None
            
            result = await employees_collection.insert_one(employee)
            self.ids[f"employee_{name}"] = str(result.inserted_id)

    async def _load_inventory_items(self):
        units_collection = get_collection("units")
        suppliers_collection = get_collection("suppliers")
        inv_categories_collection = get_collection("inv_categories")
        products_collection = get_collection("inventory_products")

        for unit in SAMPLE_DATA["units"]:
            result = await units_collection.insert_one(unit)
            self.ids[unit["name"]] = str(result.inserted_id)
        
        for supplier in SAMPLE_DATA["suppliers"]:
            result = await suppliers_collection.insert_one(supplier)
            self.ids[supplier["name"]] = str(result.inserted_id)
        
        for cat in SAMPLE_DATA["inv_categories"]:
            cat["store_id"] = self.ids["The Braai Spot"]
            result = await inv_categories_collection.insert_one(cat)
            self.ids[f"inv_cat_{cat['name']}"] = str(result.inserted_id)
        
        supplier_map = {
            "Boerewors": "SA Meat Co.", "Pap (Maize Meal)": "Joburg Fresh Produce", "Chakalaka Mix": "Joburg Fresh Produce",
            "Rooibos Tea Bags": "Joburg Fresh Produce"
        }
        category_map = {
            "Boerewors": "Meat & Poultry", "Pap (Maize Meal)": "Pantry Staples", "Chakalaka Mix": "Pantry Staples", "Rooibos Tea Bags": "Beverages"
        }
        unit_map = {
            "Boerewors": "Kilogram", "Pap (Maize Meal)": "Kilogram", "Chakalaka Mix": "Kilogram", "Rooibos Tea Bags": "Unit"
        }

        for product in SAMPLE_DATA["inventory_products"]:
            product["tenant_id"] = self.ids["Mzansi Eats Co."]
            product["supplier_id"] = self.ids[supplier_map[product["name"]]]
            product["inv_category_id"] = self.ids[f"inv_cat_{category_map[product['name']]}"]
            product["unit_of_measure"] = self.ids[unit_map[product["name"]]]
            result = await products_collection.insert_one(product)
            self.ids[f"product_{product['name']}"] = str(result.inserted_id)

    async def _load_foods_and_recipes(self):
        categories_collection = get_collection("categories")
        foods_collection = get_collection("foods")
        
        for cat in SAMPLE_DATA["categories"]:
            cat["store_id"] = self.ids["The Braai Spot"]
            result = await categories_collection.insert_one(cat)
            self.ids[f"cat_{cat['name']}"] = str(result.inserted_id)
            
        food_category_map = {
            "Boerewors Roll": "Mains", "Pap & Braai Wors": "Mains",
            "Braaibroodjie": "Mains", "Melktert": "Desserts", "Rooibos Cappuccino": "Beverages"
        }
        food_recipe_map = {
            "Boerewors Roll": [("Boerewors", 0.2, "Kilogram")],
            "Pap & Braai Wors": [("Pap (Maize Meal)", 0.25, "Kilogram"), ("Boerewors", 0.25, "Kilogram")],
        }

        for food in SAMPLE_DATA["foods"]:
            food["tenant_id"] = self.ids["Mzansi Eats Co."]
            food["category_id"] = self.ids[f"cat_{food_category_map[food['name']]}"]
            
            if food["name"] in food_recipe_map:
                for inv_name, quantity, unit_name in food_recipe_map[food["name"]]:
                    food["recipes"].append({
                        "inventory_product_id": self.ids[f"product_{inv_name}"],
                        "quantity_used": quantity,
                        "unit_of_measure": self.ids[unit_name]
                    })
            
            result = await foods_collection.insert_one(food)
            self.ids[f"food_{food['name']}"] = str(result.inserted_id)

    async def _load_customers_and_tables(self):
        customers_collection = get_collection("customers")
        tables_collection = get_collection("tables")
        
        for customer in SAMPLE_DATA["customers"]:
            customer["store_id"] = self.ids["The Braai Spot"]
            result = await customers_collection.insert_one(customer)
            self.ids[f"customer_{customer['first_name']}"] = str(result.inserted_id)

        for table in SAMPLE_DATA["tables"]:
            table["store_id"] = self.ids["The Braai Spot"]
            result = await tables_collection.insert_one(table)
            self.ids[f"table_{table['name']}"] = str(result.inserted_id)

    async def _load_orders(self):
        orders_collection = get_collection("orders")
        
        orders_data = [
            {
                "store_id": self.ids["The Braai Spot"],
                "table_id": self.ids["table_Table 1"],
                "customer_id": self.ids["customer_Ayanda"],
                "total_amount": 125.0,
                "status": "completed",
                "notes": "Dine-in, paid",
                "items": [
                    {"food_id": self.ids["food_Boerewors Roll"], "quantity": 2, "price": 45.0, "name": "Boerewors Roll", "sub_total": 90.0},
                    {"food_id": self.ids["food_Rooibos Cappuccino"], "quantity": 1, "price": 25.0, "name": "Rooibos Cappuccino", "sub_total": 25.0},
                ],
                "subtotal_amount": 115.0,
                "tax_amount": 10.0,
                "discount_amount": 0.0,
                "employee_id": self.ids["employee_Zola"],
                "order_type": "dine-in",
                "payment_status": "paid",
                "payment_method": "card",
                "created_at": datetime.now() - timedelta(hours=3)
            },
            {
                "store_id": self.ids["Jozi's Kitchen"],
                "table_id": None,
                "customer_id": self.ids["customer_Ben"],
                "total_amount": 85.0,
                "status": "pending",
                "notes": "Takeaway order",
                "items": [
                    {"food_id": self.ids["food_Pap & Braai Wors"], "quantity": 1, "price": 85.0, "name": "Pap & Braai Wors", "sub_total": 85.0}
                ],
                "subtotal_amount": 85.0,
                "tax_amount": 0.0,
                "discount_amount": 0.0,
                "employee_id": None,
                "order_type": "takeaway",
                "payment_status": "unpaid",
                "payment_method": None,
                "created_at": datetime.now() - timedelta(minutes=30)
            },
        ]
        for order_data in orders_data:
            result = await orders_collection.insert_one(order_data)
            order_id = str(result.inserted_id)
            for item in order_data["items"]:
                item["order_id"] = order_id
                item["price_at_sale"] = item["price"]
            await orders_collection.update_one(
                {"_id": result.inserted_id},
                {"$set": {"items": order_data["items"]}}
            )

    async def _load_purchase_orders_and_receipts(self):
        po_collection = get_collection("purchase_orders")
        gr_collection = get_collection("goods_receipts")

        po1_items = [{"inventory_product_id": self.ids["product_Boerewors"], "quantity": 50.0, "unit_of_measure": self.ids["Kilogram"], "unit_cost": 48.0, "total_cost": 2400.0}]
        po1 = {"po_number": "PO-2025-001", "supplier_id": self.ids["SA Meat Co."], "store_id": self.ids["The Braai Spot"], "status": "delivered", "order_date": datetime.now() - timedelta(days=5), "expected_delivery_date": datetime.now(), "total_amount": 2400.0, "ordered_by": self.ids["employee_Lebo"], "items": po1_items}
        po1_result = await po_collection.insert_one(po1)
        po1_id = str(po1_result.inserted_id)
        
        gr1_items = [{"inventory_product_id": self.ids["product_Boerewors"], "purchase_order_id": po1_id, "received_quantity": 48.0, "unit_of_measure": self.ids["Kilogram"], "condition": "good"}]
        gr1 = {"receipt_number": "GR-2025-001", "purchase_order_id": po1_id, "store_id": self.ids["The Braai Spot"], "receipt_date": datetime.now(), "received_by": self.ids["employee_Nomusa"], "items": gr1_items}
        await gr_collection.insert_one(gr1)

    async def _load_hr_data(self):
        shifts_collection = get_collection("shifts")
        ts_collection = get_collection("timesheet_entries")
        payroll_collection = get_collection("payroll")
        
        today = datetime.now().date()
        
        shifts_data = [
            {"employee_id": self.ids["employee_Lebo"], "start": datetime.combine(today, datetime.min.time()) + timedelta(hours=9), "end": datetime.combine(today, datetime.min.time()) + timedelta(hours=17), "title": "Manager Shift", "store_id": self.ids["The Braai Spot"], "employee_name": "Lebo Mokoena"},
            {"employee_id": self.ids["employee_Nomusa"], "start": datetime.combine(today, datetime.min.time()) + timedelta(hours=8), "end": datetime.combine(today, datetime.min.time()) + timedelta(hours=16), "title": "Chef Shift", "store_id": self.ids["The Braai Spot"], "employee_name": "Nomusa Zwane"},
            {"employee_id": self.ids["employee_Zola"], "start": datetime.combine(today, datetime.min.time()) + timedelta(hours=11), "end": datetime.combine(today, datetime.min.time()) + timedelta(hours=19), "title": "Waiter Shift", "store_id": self.ids["The Braai Spot"], "employee_name": "Zola Khumalo"},
        ]
        for shift in shifts_data:
            await shifts_collection.insert_one(shift)

        ts_data = [
            {"employee_id": self.ids["employee_Lebo"], "clock_in": datetime.combine(today, datetime.min.time()) + timedelta(hours=9, minutes=0), "clock_out": datetime.combine(today, datetime.min.time()) + timedelta(hours=17, minutes=15), "duration_minutes": 495, "store_id": self.ids["The Braai Spot"]},
            {"employee_id": self.ids["employee_Zola"], "clock_in": datetime.combine(today, datetime.min.time()) + timedelta(hours=11, minutes=1), "clock_out": datetime.combine(today, datetime.min.time()) + timedelta(hours=19, minutes=10), "duration_minutes": 489, "store_id": self.ids["The Braai Spot"]},
        ]
        for ts in ts_data:
            await ts_collection.insert_one(ts)
        
        payroll_data = {
            "employee_id": self.ids["employee_Lebo"],
            "pay_period_start": today - timedelta(days=7),
            "pay_period_end": today,
            "payment_cycle": "weekly",
            "gross_pay": 1442.31,
            "tax_deductions": 216.35,
            "net_pay": 1225.96,
            "status": "paid",
            "hours_worked": 40,
            "overtime_hours": 2,
            "deductions": []
        }
        await payroll_collection.insert_one(payroll_data)


if __name__ == "__main__":
    loader = DataLoader()
    asyncio.run(loader.load_all_data())