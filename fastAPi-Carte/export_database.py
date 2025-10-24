# export_database.py
import asyncio
import json
from datetime import datetime
from app.database import get_collection
from bson import ObjectId

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

async def export_database():
    collections = [
        "tenants", "stores", "users", "access_roles", "job_titles", "employees",
        "categories", "foods", "customers", "tables", "suppliers", "inventory_products",
        "orders", "domains", "sites", "payment_methods", "taxes", "brands", "units",
        "inv_categories", "departments", "contact_messages", "reports", "stock_adjustments",
        "reservations", "payments", "shifts", "timesheet_entries", "payroll", "payroll_settings",
        "purchase_orders", "goods_receipts"
    ]
    
    all_data = {}
    
    print("🔍 Exporting database to current.py...")
    
    for collection_name in collections:
        try:
            collection = get_collection(collection_name)
            # Your database wrapper returns a list directly, not a cursor
            documents = await collection.find()
            
            # Convert to serializable format
            serialized_docs = []
            for doc in documents:
                serialized_doc = {}
                for key, value in doc.items():
                    if isinstance(value, ObjectId):
                        serialized_doc[key] = str(value)
                    elif isinstance(value, datetime):
                        serialized_doc[key] = value.isoformat()
                    elif isinstance(value, list):
                        # Handle lists that might contain ObjectIds
                        serialized_doc[key] = []
                        for item in value:
                            if isinstance(item, ObjectId):
                                serialized_doc[key].append(str(item))
                            elif isinstance(item, dict):
                                # Handle nested documents
                                nested_doc = {}
                                for nested_key, nested_value in item.items():
                                    if isinstance(nested_value, ObjectId):
                                        nested_doc[nested_key] = str(nested_value)
                                    elif isinstance(nested_value, datetime):
                                        nested_doc[nested_key] = nested_value.isoformat()
                                    else:
                                        nested_doc[nested_key] = nested_value
                                serialized_doc[key].append(nested_doc)
                            else:
                                serialized_doc[key].append(item)
                    else:
                        serialized_doc[key] = value
                serialized_docs.append(serialized_doc)
            
            all_data[collection_name] = serialized_docs
            print(f"✅ Exported {collection_name}: {len(serialized_docs)} documents")
            
        except Exception as e:
            print(f"❌ Error exporting {collection_name}: {e}")
            all_data[collection_name] = []

    # Write to current.py file
    with open('current.py', 'w', encoding='utf-8') as f:
        f.write('# CURRENT DATABASE EXPORT\n')
        f.write('# Generated on: ' + datetime.now().isoformat() + '\n')
        f.write('from datetime import datetime\n\n')
        f.write('CURRENT_DATA = ')
        f.write(json.dumps(all_data, indent=2, cls=JSONEncoder, ensure_ascii=False))
        f.write('\n')
    
    print(f"✅ Successfully exported database to current.py")
    print(f"📊 Total collections processed: {len(collections)}")

if __name__ == "__main__":
    asyncio.run(export_database())