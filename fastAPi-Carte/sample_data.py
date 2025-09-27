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
        {"name": "Provision Corp", "email": "contact@provision.com", "phone": "123-456-7890", "address": "123 Main St, Anytown", "created_at": datetime.now()},
    ],
    "stores": [
        {"name": "Downtown Grill", "address": "456 Main St, Anytown", "phone": "123-555-1234", "email": "downtown@provision.com", "tenant_id": "", "kiosk_user_id": ""},
    ],
    "users": [
        {"username": "admin", "email": "admin@provision.com", "password": "password", "first_name": "Admin", "last_name": "User"},
        {"username": "kiosk", "email": "kiosk@provision.com", "password": "password", "first_name": "Kiosk", "last_name": "User"},
        {"username": "markbrown", "email": "mark.brown@provision.com", "password": "password", "first_name": "Mark", "last_name": "Brown"},
    ],
    "access_roles": [
        {"name": "Admin", "description": "Full administrative access to all system features.", "permissions": ["can_manage_users", "can_view_reports", "can_manage_settings", "can_manage_all_pos_operations"], "landing_page": "/pos/management"},
        {"name": "Manager", "description": "Access to POS operations and some management features.", "permissions": ["can_manage_orders", "can_view_reports", "can_process_payments", "can_manage_reservations"], "landing_page": "/pos/dashboard"},
        {"name": "Kiosk-User", "description": "Self-service kiosk access for customers to place orders.", "permissions": ["can_create_orders", "can_view_menu"], "landing_page": "/pos/kiosk"},
    ],
    "job_titles": [
        {"title": "Manager", "description": "Oversees daily operations and staff.", "department": "Management", "store_id": ""},
        {"title": "Waiter/Waitress", "description": "Serves customers and takes orders.", "department": "Service", "store_id": ""},
    ],
    "employees": [
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date.today(), "salary": 60000.0, "first_name": "Mark", "last_name": "Brown"},
        {"user_id": "", "job_title_id": "", "access_role_ids": [], "tenant_id": "", "store_id": "", "main_access_role_id": "", "hire_date": date.today(), "salary": 0.0, "first_name": "Kiosk", "last_name": "Account"},
    ],
    "categories": [
        {"name": "Main Courses", "description": "Hearty meals for the main event.", "store_id": ""},
        {"name": "Sides", "description": "Perfect additions to any meal.", "store_id": ""},
    ],
    "inv_categories": [
        {"name": "Meat & Poultry", "description": "Inventory products related to meat and poultry.", "store_id": ""},
        {"name": "Produce", "description": "Inventory products related to fresh fruits and vegetables.", "store_id": ""},
        {"name": "Pantry", "description": "Dry goods and pantry items.", "store_id": ""},
    ],
    "inventory_products": [
        {"name": "Beef Patty (1/4 lb)", "description": "Pre-made quarter-pound beef patty.", "sku": "BEEF-PATTY-001", "unit_of_measure": "unit", "tenant_id": "", "unit_cost": 2.50, "quantity_in_stock": 100, "reorder_level": 20, "supplier_id": "", "inv_category_id": "", "location_in_warehouse": "Freezer A"},
        {"name": "Sesame Burger Buns", "description": "Pack of 12 burger buns with sesame seeds.", "sku": "BUN-SESAME-001", "unit_of_measure": "unit", "tenant_id": "", "unit_cost": 0.50, "quantity_in_stock": 50, "reorder_level": 10, "supplier_id": "", "inv_category_id": "", "location_in_warehouse": "Pantry B"},
        {"name": "Lettuce", "description": "Fresh iceberg lettuce.", "sku": "LETTUCE-001", "unit_of_measure": "unit", "tenant_id": "", "unit_cost": 0.75, "quantity_in_stock": 30, "reorder_level": 5, "supplier_id": "", "inv_category_id": "", "location_in_warehouse": "Produce C"},
        {"name": "Cheddar Cheese", "description": "Sliced cheddar cheese.", "sku": "CHEESE-001", "unit_of_measure": "unit", "tenant_id": "", "unit_cost": 1.25, "quantity_in_stock": 40, "reorder_level": 8, "supplier_id": "", "inv_category_id": "", "location_in_warehouse": "Refrigerator D"},
    ],
    "foods": [
        {"name": "Classic Burger", "description": "A delicious classic beef burger with lettuce, tomato, and cheese.", "price": 9.99, "category_id": "", "image_url": "/images/classic-burger.jpg", "preparation_time": 15, "allergens": ["Gluten", "Dairy"], "tenant_id": "", "store_id": "", "recipes": []},
        {"name": "Double Cheeseburger", "description": "Two beef patties with double cheese and special sauce.", "price": 12.99, "category_id": "", "image_url": "/images/double-cheeseburger.jpg", "preparation_time": 20, "allergens": ["Gluten", "Dairy"], "tenant_id": "", "store_id": "", "recipes": []},
        {"name": "French Fries", "description": "Crispy golden french fries with sea salt.", "price": 3.99, "category_id": "", "image_url": "/images/french-fries.jpg", "preparation_time": 10, "allergens": [], "tenant_id": "", "store_id": "", "recipes": []},
        {"name": "Onion Rings", "description": "Beer-battered onion rings with dipping sauce.", "price": 4.99, "category_id": "", "image_url": "/images/onion-rings.jpg", "preparation_time": 12, "allergens": ["Gluten"], "tenant_id": "", "store_id": "", "recipes": []},
    ],
    "tables": [
        {"name": "Table 1", "capacity": 4, "location": "Indoor", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 2", "capacity": 2, "location": "Indoor", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 3", "capacity": 6, "location": "Patio", "status": "available", "current_order_id": None, "store_id": ""},
        {"name": "Table 4", "capacity": 4, "location": "Patio", "status": "occupied", "current_order_id": None, "store_id": ""},
    ],
    "customers": [
        {"first_name": "John", "last_name": "Smith", "email": "john.smith@email.com", "phone_number": "555-0101", "store_id": ""},
        {"first_name": "Sarah", "last_name": "Johnson", "email": "sarah.j@email.com", "phone_number": "555-0102", "store_id": ""},
        {"first_name": "Mike", "last_name": "Davis", "email": "mike.davis@email.com", "phone_number": "555-0103", "store_id": ""},
    ],
    "suppliers": [
        {"name": "Local Meat Supplier", "contact_person": "Tom Wilson", "phone": "555-1001", "email": "tom@localmeat.com", "address": "123 Farm Rd, Anytown"},
        {"name": "Fresh Produce Co.", "contact_person": "Lisa Green", "phone": "555-1002", "email": "lisa@freshproduce.com", "address": "456 Orchard St, Anytown"},
        {"name": "Bakery Supplies Inc.", "contact_person": "Robert Brown", "phone": "555-1003", "email": "robert@bakerysupplies.com", "address": "789 Flour Ave, Anytown"},
    ],
    "purchase_orders": [],
    "goods_receipts": [],
    "orders": [],
    "shifts": [],
    "timesheet_entries": [],
    "payroll": [],
    "payroll_settings": [
        {"pay_period": "bi-weekly", "tax_rate": 0.20, "overtime_multiplier": 1.5, "store_id": ""}
    ],
}

class DataLoader:
    def __init__(self):
        self.ids = {}

    async def _drop_collections(self):
        print("Dropping existing collections...")
        for key in SAMPLE_DATA:
            collection = get_collection(key)
            await collection.delete_many({})
        # Drop additional collections that might not be in SAMPLE_DATA
        additional_collections = ["order_items", "recipes", "payroll_deductions"]
        for coll_name in additional_collections:
            collection = get_collection(coll_name)
            await collection.delete_many({})
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
        
        for store in SAMPLE_DATA["stores"]:
            store["tenant_id"] = self.ids["Provision Corp"]
            result = await stores_collection.insert_one(store)
            self.ids[store["name"]] = str(result.inserted_id)

    async def _load_users_and_roles_and_titles(self):
        users_collection = get_collection("users")
        roles_collection = get_collection("access_roles")
        titles_collection = get_collection("job_titles")
        
        for user in SAMPLE_DATA["users"]:
            hashed_password = bcrypt.hashpw(user["password"].encode(), bcrypt.gensalt())
            user["password"] = hashed_password.decode()
            user["email_verified_at"] = datetime.now()
            user["created_at"] = datetime.now()
            user["updated_at"] = datetime.now()
            result = await users_collection.insert_one(user)
            self.ids[user["username"]] = str(result.inserted_id)

        for role in SAMPLE_DATA["access_roles"]:
            role["created_at"] = datetime.now()
            role["updated_at"] = datetime.now()
            result = await roles_collection.insert_one(role)
            self.ids[role["name"]] = str(result.inserted_id)

        for title in SAMPLE_DATA["job_titles"]:
            title["store_id"] = self.ids["Downtown Grill"]
            title["created_at"] = datetime.now()
            title["updated_at"] = datetime.now()
            result = await titles_collection.insert_one(title)
            self.ids[title["title"]] = str(result.inserted_id)

    async def _load_employees(self):
        employees_collection = get_collection("employees")
        
        employee_map = {
            "Mark": ("markbrown", "Manager", "Manager", "Downtown Grill"),
            "Kiosk": ("kiosk", "Waiter/Waitress", "Kiosk-User", "Downtown Grill")
        }

        for employee in SAMPLE_DATA["employees"]:
            name = employee["first_name"]
            if name in employee_map:
                user_id, title_name, role_name, store_name = employee_map[name]
                
                employee["user_id"] = self.ids[user_id]
                employee["job_title_id"] = self.ids[title_name]
                employee["access_role_ids"] = [self.ids[role_name]]
                employee["main_access_role_id"] = self.ids[role_name]
                employee["tenant_id"] = self.ids["Provision Corp"]
                employee["store_id"] = self.ids[store_name]
                employee["created_at"] = datetime.now()
                employee["updated_at"] = datetime.now()
                
                # Convert date object to datetime object
                employee["hire_date"] = datetime.combine(employee["hire_date"], datetime.min.time())

                result = await employees_collection.insert_one(employee)
                self.ids[f"employee_{name}"] = str(result.inserted_id)

    async def _load_inventory_items(self):
        suppliers_collection = get_collection("suppliers")
        inv_categories_collection = get_collection("inv_categories")
        products_collection = get_collection("inventory_products")
        
        for supplier in SAMPLE_DATA["suppliers"]:
            result = await suppliers_collection.insert_one(supplier)
            self.ids[supplier["name"]] = str(result.inserted_id)
        
        for cat in SAMPLE_DATA["inv_categories"]:
            cat["store_id"] = self.ids["Downtown Grill"]
            cat["created_at"] = datetime.now()
            cat["updated_at"] = datetime.now()
            result = await inv_categories_collection.insert_one(cat)
            self.ids[f"inv_cat_{cat['name']}"] = str(result.inserted_id)
        
        supplier_map = {
            "Beef Patty (1/4 lb)": "Local Meat Supplier",
            "Sesame Burger Buns": "Bakery Supplies Inc.",
            "Lettuce": "Fresh Produce Co.",
            "Cheddar Cheese": "Local Meat Supplier"
        }
        category_map = {
            "Beef Patty (1/4 lb)": "Meat & Poultry",
            "Sesame Burger Buns": "Pantry",
            "Lettuce": "Produce",
            "Cheddar Cheese": "Meat & Poultry"
        }

        for product in SAMPLE_DATA["inventory_products"]:
            product["tenant_id"] = self.ids["Provision Corp"]
            product["supplier_id"] = self.ids[supplier_map[product["name"]]]
            product["inv_category_id"] = self.ids[f"inv_cat_{category_map[product['name']]}"]
            product["store_id"] = self.ids["Downtown Grill"]
            product["created_at"] = datetime.now()
            product["updated_at"] = datetime.now()
            result = await products_collection.insert_one(product)
            self.ids[f"product_{product['name']}"] = str(result.inserted_id)

    async def _load_foods_and_recipes(self):
        categories_collection = get_collection("categories")
        foods_collection = get_collection("foods")
        recipes_collection = get_collection("recipes")
        
        for cat in SAMPLE_DATA["categories"]:
            cat["store_id"] = self.ids["Downtown Grill"]
            cat["created_at"] = datetime.now()
            cat["updated_at"] = datetime.now()
            result = await categories_collection.insert_one(cat)
            self.ids[f"cat_{cat['name']}"] = str(result.inserted_id)
            
        food_category_map = {
            "Classic Burger": "Main Courses",
            "Double Cheeseburger": "Main Courses",
            "French Fries": "Sides",
            "Onion Rings": "Sides"
        }
        food_recipe_map = {
            "Classic Burger": [
                ("Beef Patty (1/4 lb)", 1, "unit"),
                ("Sesame Burger Buns", 1, "unit"),
                ("Lettuce", 0.1, "unit"),
                ("Cheddar Cheese", 1, "unit")
            ],
            "Double Cheeseburger": [
                ("Beef Patty (1/4 lb)", 2, "unit"),
                ("Sesame Burger Buns", 1, "unit"),
                ("Lettuce", 0.1, "unit"),
                ("Cheddar Cheese", 2, "unit")
            ],
            "French Fries": [
                ("Potatoes", 0.2, "unit"),  # Note: We'd need to add potatoes to inventory
            ],
        }

        for food in SAMPLE_DATA["foods"]:
            food["tenant_id"] = self.ids["Provision Corp"]
            food["store_id"] = self.ids["Downtown Grill"]
            food["category_id"] = self.ids[f"cat_{food_category_map[food['name']]}"]
            food["created_at"] = datetime.now()
            food["updated_at"] = datetime.now()
            
            result = await foods_collection.insert_one(food)
            food_id = str(result.inserted_id)
            self.ids[f"food_{food['name']}"] = food_id
            
            # Create recipes in separate collection
            if food["name"] in food_recipe_map:
                for inv_name, quantity, unit_name in food_recipe_map[food["name"]]:
                    if f"product_{inv_name}" in self.ids:
                        recipe = {
                            "food_id": food_id,
                            "inventory_product_id": self.ids[f"product_{inv_name}"],
                            "quantity_used": quantity,
                            "unit_of_measure": unit_name,
                            "created_at": datetime.now(),
                            "updated_at": datetime.now()
                        }
                        await recipes_collection.insert_one(recipe)

    async def _load_customers_and_tables(self):
        customers_collection = get_collection("customers")
        tables_collection = get_collection("tables")
        
        for customer in SAMPLE_DATA["customers"]:
            customer["store_id"] = self.ids["Downtown Grill"]
            result = await customers_collection.insert_one(customer)
            self.ids[f"customer_{customer['first_name']}"] = str(result.inserted_id)

        for table in SAMPLE_DATA["tables"]:
            table["store_id"] = self.ids["Downtown Grill"]
            table["created_at"] = datetime.now()
            table["updated_at"] = datetime.now()
            result = await tables_collection.insert_one(table)
            self.ids[f"table_{table['name']}"] = str(result.inserted_id)

    async def _load_orders(self):
        orders_collection = get_collection("orders")
        
        orders_data = [
            {
                "store_id": self.ids["Downtown Grill"],
                "table_id": self.ids["table_Table 1"],
                "customer_id": self.ids["customer_John"],
                "total_amount": 13.98,
                "status": "completed",
                "notes": "Dine-in, paid with card",
                "items": [
                    {"food_id": self.ids["food_Classic Burger"], "quantity": 1, "price": 9.99, "name": "Classic Burger", "sub_total": 9.99},
                ],
                "subtotal_amount": 9.99,
                "tax_amount": 0.80,
                "discount_amount": 0.0,
                "employee_id": self.ids["employee_Mark"],
                "order_type": "dine-in",
                "payment_status": "paid",
                "payment_method": "card",
                "created_at": datetime.now() - timedelta(hours=2)
            },
            {
                "store_id": self.ids["Downtown Grill"],
                "table_id": None,
                "customer_id": self.ids["customer_Sarah"],
                "total_amount": 22.97,
                "status": "pending",
                "notes": "Takeaway order",
                "items": [
                    {"food_id": self.ids["food_Double Cheeseburger"], "quantity": 1, "price": 12.99, "name": "Double Cheeseburger", "sub_total": 12.99},
                    {"food_id": self.ids["food_French Fries"], "quantity": 1, "price": 3.99, "name": "French Fries", "sub_total": 3.99},
                ],
                "subtotal_amount": 16.98,
                "tax_amount": 1.36,
                "discount_amount": 0.0,
                "employee_id": None,
                "order_type": "takeaway",
                "payment_status": "unpaid",
                "payment_method": None,
                "created_at": datetime.now() - timedelta(minutes=15)
            },
        ]
        
        for order_data in orders_data:
            result = await orders_collection.insert_one(order_data)
            order_id = str(result.inserted_id)
            
            # Create order items in separate collection
            order_items_collection = get_collection("order_items")
            for item in order_data["items"]:
                item["order_id"] = order_id
                item["price_at_sale"] = item["price"]
                item["created_at"] = datetime.now()
                await order_items_collection.insert_one(item)

    async def _load_purchase_orders_and_receipts(self):
        po_collection = get_collection("purchase_orders")
        gr_collection = get_collection("goods_receipts")

        # Create a sample purchase order
        po1_items = [
            {"inventory_product_id": self.ids["product_Beef Patty (1/4 lb)"], "quantity": 100, "unit_of_measure": "unit", "unit_cost": 2.50, "total_cost": 250.0}
        ]
        po1 = {
            "po_number": "PO-2024-001", 
            "supplier_id": self.ids["Local Meat Supplier"], 
            "store_id": self.ids["Downtown Grill"], 
            "status": "delivered", 
            "order_date": datetime.now() - timedelta(days=3), 
            "expected_delivery_date": datetime.now() - timedelta(days=1), 
            "total_amount": 250.0, 
            "ordered_by": self.ids["employee_Mark"], 
            "items": po1_items
        }
        po1_result = await po_collection.insert_one(po1)
        po1_id = str(po1_result.inserted_id)
        
        # Create corresponding goods receipt
        gr1_items = [
            {"inventory_product_id": self.ids["product_Beef Patty (1/4 lb)"], "purchase_order_id": po1_id, "received_quantity": 100, "unit_of_measure": "unit", "condition": "good"}
        ]
        gr1 = {
            "receipt_number": "GR-2024-001", 
            "purchase_order_id": po1_id, 
            "store_id": self.ids["Downtown Grill"], 
            "receipt_date": datetime.now() - timedelta(days=1), 
            "received_by": self.ids["employee_Mark"], 
            "items": gr1_items
        }
        await gr_collection.insert_one(gr1)

    async def _load_hr_data(self):
        shifts_collection = get_collection("shifts")
        ts_collection = get_collection("timesheet_entries")
        payroll_collection = get_collection("payroll")
        payroll_settings_collection = get_collection("payroll_settings")
        
        today = datetime.now()
        
        # Load payroll settings
        for setting in SAMPLE_DATA["payroll_settings"]:
            setting["store_id"] = self.ids["Downtown Grill"]
            setting["created_at"] = datetime.now()
            setting["updated_at"] = datetime.now()
            await payroll_settings_collection.insert_one(setting)
        
        # Create sample shifts
        shifts_data = [
            {"employee_id": self.ids["employee_Mark"], "start": datetime.combine(today.date(), datetime.min.time()) + timedelta(hours=9), "end": datetime.combine(today.date(), datetime.min.time()) + timedelta(hours=17), "title": "Manager Shift", "store_id": self.ids["Downtown Grill"], "employee_name": "Mark Brown"},
        ]
        for shift in shifts_data:
            await shifts_collection.insert_one(shift)

        # Create sample timesheet entries
        ts_data = [
            {"employee_id": self.ids["employee_Mark"], "clock_in": datetime.combine(today.date(), datetime.min.time()) + timedelta(hours=9, minutes=0), "clock_out": datetime.combine(today.date(), datetime.min.time()) + timedelta(hours=17, minutes=15), "duration_minutes": 495, "store_id": self.ids["Downtown Grill"]},
        ]
        for ts in ts_data:
            await ts_collection.insert_one(ts)
        
        # Create sample payroll entry
        payroll_data = {
            "employee_id": self.ids["employee_Mark"],
            "pay_period_start": datetime.combine(today.date() - timedelta(days=14), datetime.min.time()),
            "pay_period_end": datetime.combine(today.date(), datetime.min.time()),
            "payment_cycle": "bi-weekly",
            "gross_pay": 2307.69,
            "tax_deductions": 461.54,
            "net_pay": 1846.15,
            "status": "paid",
            "hours_worked": 80,
            "overtime_hours": 0,
            "deductions": [],
            "created_at": datetime.now()
        }
        await payroll_collection.insert_one(payroll_data)


if __name__ == "__main__":
    loader = DataLoader()
    asyncio.run(loader.load_all_data())