# inspect_database.py
import asyncio
from app.database import get_collection
from bson import ObjectId

async def inspect_database():
    collections = [
        "tenants", "stores", "users", "access_roles", "job_titles", "employees",
        "categories", "foods", "customers", "tables", "suppliers", "inventory_products",
        "orders", "domains", "sites", "payment_methods", "taxes", "brands", "units",
        "inv_categories", "departments", "contact_messages", "reports", "stock_adjustments",
        "reservations", "payments", "shifts", "timesheet_entries", "payroll", "payroll_settings",
        "purchase_orders", "goods_receipts"
    ]
    
    print("🔍 DATABASE INSPECTION REPORT")
    print("=" * 50)
    
    for collection_name in collections:
        collection = get_collection(collection_name)
        count = await collection.count_documents({})
        
        if count > 0:
            print(f"📁 {collection_name}: {count} documents")
            # Show first document as sample
            sample = await collection.find_one({})
            if sample:
                print(f"   Sample: {str(sample)[:100]}...")
        else:
            print(f"📁 {collection_name}: EMPTY")
        
        print("-" * 30)

if __name__ == "__main__":
    asyncio.run(inspect_database())