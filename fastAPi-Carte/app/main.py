# app/main.py
from fastapi import FastAPI
from app.routes import core, hr, inventory, auth
from app.database import client
from fastapi.middleware.cors import CORSMiddleware
import os
from app.sample_data import initialize_sample_data

app = FastAPI(title="POS System API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(core.router)
app.include_router(hr.router)
app.include_router(inventory.router)
app.include_router(auth.router)

@app.on_event("startup")
async def startup_event():
    # Test database connection
    try:
        await client.admin.command('ping')
        print("✅ Connected to MongoDB!")
        
        # Initialize sample data
        #await initialize_sample_data()
        #print("✅ Sample data initialized!")
        
    except Exception as e:
        print(f"❌ Could not connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()
    print("✅ MongoDB connection closed.")

@app.get("/")
async def root():
    return {"message": "POS System API is running"}

@app.get("/health")
async def health_check():
    try:
        await client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "unhealthy", "database": "disconnected"}

# Additional utility endpoints
@app.get("/api/orders/{order_id}")
async def get_order_by_id(order_id: str):
    from app.database import get_collection
    from app.models.core import Order
    from bson import ObjectId
    
    orders_collection = get_collection("orders")
    order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    
    if order:
        # Get order items
        order_items_collection = get_collection("order_items")
        order_items = []
        async for item in order_items_collection.find({"order_id": order_id}):
            order_items.append(item)
        order["items"] = order_items
        return Order.from_mongo(order)
    
    raise HTTPException(status_code=404, detail="Order not found")

@app.get("/api/customers/{customer_id}")
async def get_customer_by_id(customer_id: str):
    from app.database import get_collection
    from app.models.core import Customer
    from bson import ObjectId
    
    customers_collection = get_collection("customers")
    customer = await customers_collection.find_one({"_id": ObjectId(customer_id)})
    
    if customer:
        return Customer.from_mongo(customer)
    
    raise HTTPException(status_code=404, detail="Customer not found")

@app.delete("/api/{resource}/{item_id}")
async def delete_item(resource: str, item_id: str):
    from app.database import get_collection
    from bson import ObjectId
    
    collection = get_collection(resource)
    result = await collection.delete_one({"_id": ObjectId(item_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"{resource} with ID {item_id} not found")
    
    return {"message": f"{resource} deleted successfully"}