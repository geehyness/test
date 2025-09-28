# app/routes/core.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.database import get_collection
from app.models.core import Food, Order, Category, Customer, Table, Store, PurchaseOrder, GoodsReceipt, Reservation
from app.models.inventory import InventoryProduct
from bson import ObjectId
from datetime import datetime
import math

router = APIRouter(prefix="/api", tags=["core"])

# Foods endpoints - SIMPLIFIED: Use embedded recipes
@router.get("/foods", response_model=List[Food])
async def get_foods(store_id: Optional[str] = Query(None)):
    foods_collection = get_collection("foods")
    query = {"store_id": store_id} if store_id else {}
    foods = []
    async for food in foods_collection.find(query):
        foods.append(Food.from_mongo(food))
    return foods

@router.get("/foods/{food_id}", response_model=Food)
async def get_food(food_id: str):
    foods_collection = get_collection("foods")
    food = await foods_collection.find_one({"_id": ObjectId(food_id)})
    if food:
        return Food.from_mongo(food)
    raise HTTPException(status_code=404, detail="Food not found")

@router.post("/foods", response_model=Food)
async def create_food(food: Food):
    foods_collection = get_collection("foods")
    food_dict = food.to_mongo()
    food_dict["created_at"] = datetime.utcnow()
    food_dict["updated_at"] = datetime.utcnow()
    
    result = await foods_collection.insert_one(food_dict)
    new_food = await foods_collection.find_one({"_id": result.inserted_id})
    return Food.from_mongo(new_food)

@router.put("/foods/{food_id}", response_model=Food)
async def update_food(food_id: str, food: Food):
    foods_collection = get_collection("foods")
    food_dict = food.to_mongo(exclude_unset=True)
    food_dict["updated_at"] = datetime.utcnow()
    
    result = await foods_collection.update_one(
        {"_id": ObjectId(food_id)}, {"$set": food_dict}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Food not found")
    
    updated_food = await foods_collection.find_one({"_id": ObjectId(food_id)})
    return Food.from_mongo(updated_food)

@router.delete("/foods/{food_id}")
async def delete_food(food_id: str):
    foods_collection = get_collection("foods")
    result = await foods_collection.delete_one({"_id": ObjectId(food_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Food not found")
    return {"message": "Food deleted successfully"}

# Orders endpoints - SIMPLIFIED: Use embedded items
@router.get("/orders", response_model=List[Order])
async def get_orders(store_id: Optional[str] = Query(None), status: Optional[str] = Query(None)):
    orders_collection = get_collection("orders")
    query = {}
    if store_id:
        query["store_id"] = store_id
    if status:
        query["status"] = status
        
    orders = []
    async for order in orders_collection.find(query):
        orders.append(Order.from_mongo(order))
    return orders

@router.post("/orders", response_model=Order)
async def create_order(order: Order):
    orders_collection = get_collection("orders")
    inventory_collection = get_collection("inventory_products")
    
    order_dict = order.to_mongo()
    order_dict["created_at"] = datetime.utcnow()
    order_dict["updated_at"] = datetime.utcnow()
    
    # Check inventory and deduct quantities
    stock_warnings = []
    for item in order.items:
        # Get the food to find its recipes
        foods_collection = get_collection("foods")
        food = await foods_collection.find_one({"_id": ObjectId(item.food_id)})
        
        if food and food.get("recipes"):
            for recipe in food["recipes"]:
                inventory_product = await inventory_collection.find_one(
                    {"_id": ObjectId(recipe["inventory_product_id"])}
                )
                if inventory_product:
                    required_quantity = recipe["quantity_used"] * item.quantity
                    if inventory_product["quantity_in_stock"] < required_quantity:
                        stock_warnings.append(
                            f"Low stock warning: {inventory_product['name']} "
                            f"(required: {required_quantity}, available: {inventory_product['quantity_in_stock']})"
                        )
                    
                    # Deduct from inventory
                    new_stock = inventory_product["quantity_in_stock"] - required_quantity
                    await inventory_collection.update_one(
                        {"_id": ObjectId(recipe["inventory_product_id"])},
                        {"$set": {"quantity_in_stock": max(0, new_stock)}}
                    )
    
    result = await orders_collection.insert_one(order_dict)
    new_order = await orders_collection.find_one({"_id": result.inserted_id})
    order_response = Order.from_mongo(new_order)
    
    # Add stock warnings to response if any
    if stock_warnings:
        order_response.stock_warnings = stock_warnings
    
    return order_response

@router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order: Order):
    orders_collection = get_collection("orders")
    order_dict = order.to_mongo(exclude_unset=True)
    order_dict["updated_at"] = datetime.utcnow()
    
    result = await orders_collection.update_one(
        {"_id": ObjectId(order_id)}, {"$set": order_dict}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    updated_order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    return Order.from_mongo(updated_order)

# Categories endpoints
@router.get("/categories", response_model=List[Category])
async def get_categories(store_id: Optional[str] = Query(None)):
    categories_collection = get_collection("categories")
    query = {"store_id": store_id} if store_id else {}
    categories = []
    async for category in categories_collection.find(query):
        categories.append(Category.from_mongo(category))
    return categories

@router.post("/categories", response_model=Category)
async def create_category(category: Category):
    categories_collection = get_collection("categories")
    category_dict = category.to_mongo()
    category_dict["created_at"] = datetime.utcnow()
    category_dict["updated_at"] = datetime.utcnow()
    
    result = await categories_collection.insert_one(category_dict)
    new_category = await categories_collection.find_one({"_id": result.inserted_id})
    return Category.from_mongo(new_category)

# Customers endpoints
@router.get("/customers", response_model=List[Customer])
async def get_customers(store_id: Optional[str] = Query(None)):
    customers_collection = get_collection("customers")
    query = {"store_id": store_id} if store_id else {}
    customers = []
    async for customer in customers_collection.find(query):
        customers.append(Customer.from_mongo(customer))
    return customers

@router.post("/customers", response_model=Customer)
async def create_customer(customer: Customer):
    customers_collection = get_collection("customers")
    customer_dict = customer.to_mongo()
    customer_dict["created_at"] = datetime.utcnow()
    customer_dict["updated_at"] = datetime.utcnow()
    
    result = await customers_collection.insert_one(customer_dict)
    new_customer = await customers_collection.find_one({"_id": result.inserted_id})
    return Customer.from_mongo(new_customer)

# Tables endpoints
@router.get("/tables", response_model=List[Table])
async def get_tables(store_id: Optional[str] = Query(None)):
    tables_collection = get_collection("tables")
    query = {"store_id": store_id} if store_id else {}
    tables = []
    async for table in tables_collection.find(query):
        tables.append(Table.from_mongo(table))
    return tables

@router.post("/tables", response_model=Table)
async def create_table(table: Table):
    tables_collection = get_collection("tables")
    table_dict = table.to_mongo()
    table_dict["created_at"] = datetime.utcnow()
    table_dict["updated_at"] = datetime.utcnow()
    
    result = await tables_collection.insert_one(table_dict)
    new_table = await tables_collection.find_one({"_id": result.inserted_id})
    return Table.from_mongo(new_table)

# Stores endpoints
@router.get("/stores", response_model=List[Store])
async def get_stores():
    stores_collection = get_collection("stores")
    stores = []
    async for store in stores_collection.find():
        stores.append(Store.from_mongo(store))
    return stores

@router.post("/stores", response_model=Store)
async def create_store(store: Store):
    stores_collection = get_collection("stores")
    store_dict = store.to_mongo()
    store_dict["created_at"] = datetime.utcnow()
    store_dict["updated_at"] = datetime.utcnow()
    
    result = await stores_collection.insert_one(store_dict)
    new_store = await stores_collection.find_one({"_id": result.inserted_id})
    return Store.from_mongo(new_store)

# Purchase Orders endpoints
@router.get("/purchase_orders", response_model=List[PurchaseOrder])
async def get_purchase_orders():
    po_collection = get_collection("purchase_orders")
    pos = []
    async for po in po_collection.find():
        pos.append(PurchaseOrder.from_mongo(po))
    return pos

@router.post("/purchase_orders", response_model=PurchaseOrder)
async def create_purchase_order(po: PurchaseOrder):
    po_collection = get_collection("purchase_orders")
    po_dict = po.to_mongo()
    po_dict["created_at"] = datetime.utcnow()
    po_dict["updated_at"] = datetime.utcnow()
    
    result = await po_collection.insert_one(po_dict)
    new_po = await po_collection.find_one({"_id": result.inserted_id})
    return PurchaseOrder.from_mongo(new_po)

@router.put("/purchase_orders/{po_id}", response_model=PurchaseOrder)
async def update_purchase_order(po_id: str, po: PurchaseOrder):
    po_collection = get_collection("purchase_orders")
    po_dict = po.to_mongo(exclude_unset=True)
    po_dict["updated_at"] = datetime.utcnow()
    
    result = await po_collection.update_one(
        {"_id": ObjectId(po_id)}, {"$set": po_dict}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    
    updated_po = await po_collection.find_one({"_id": ObjectId(po_id)})
    return PurchaseOrder.from_mongo(updated_po)

# Goods Receipts endpoints
@router.get("/goods_receipts", response_model=List[GoodsReceipt])
async def get_goods_receipts():
    gr_collection = get_collection("goods_receipts")
    grs = []
    async for gr in gr_collection.find():
        grs.append(GoodsReceipt.from_mongo(gr))
    return grs

@router.post("/goods_receipts", response_model=GoodsReceipt)
async def create_goods_receipt(gr: GoodsReceipt):
    gr_collection = get_collection("goods_receipts")
    products_collection = get_collection("inventory_products")

    # Update inventory quantities based on received items
    for item in gr.items:
        if item.condition == 'good':
            product = await products_collection.find_one({"_id": ObjectId(item.inventory_product_id)})
            if not product:
                raise HTTPException(status_code=404, detail=f"Inventory Product with id {item.inventory_product_id} not found.")
            
            current_stock = product.get("quantity_in_stock", 0)
            new_stock = current_stock + item.received_quantity
            
            await products_collection.update_one(
                {"_id": ObjectId(item.inventory_product_id)},
                {"$set": {"quantity_in_stock": new_stock, "last_restocked_at": datetime.utcnow()}}
            )

    # Insert the goods receipt
    gr_dict = gr.to_mongo()
    gr_dict["created_at"] = datetime.utcnow()
    gr_dict["updated_at"] = datetime.utcnow()
    
    result = await gr_collection.insert_one(gr_dict)
    new_gr = await gr_collection.find_one({"_id": result.inserted_id})
    return GoodsReceipt.from_mongo(new_gr)

# Reservations endpoints
@router.get("/reservations", response_model=List[Reservation])
async def get_reservations(store_id: Optional[str] = Query(None)):
    reservations_collection = get_collection("reservations")
    query = {"store_id": store_id} if store_id else {}
    reservations = []
    async for reservation in reservations_collection.find(query):
        reservations.append(Reservation.from_mongo(reservation))
    return reservations

@router.post("/reservations", response_model=Reservation)
async def create_reservation(reservation: Reservation):
    reservations_collection = get_collection("reservations")
    reservation_dict = reservation.to_mongo()
    reservation_dict["created_at"] = datetime.utcnow()
    reservation_dict["updated_at"] = datetime.utcnow()
    
    result = await reservations_collection.insert_one(reservation_dict)
    new_reservation = await reservations_collection.find_one({"_id": result.inserted_id})
    return Reservation.from_mongo(new_reservation)

# Low stock items endpoint
@router.get("/inventory/low-stock")
async def get_low_stock_items():
    products_collection = get_collection("inventory_products")
    low_stock_items = []
    async for product in products_collection.find():
        if product.get("quantity_in_stock", 0) <= product.get("reorder_level", 0):
            low_stock_items.append(InventoryProduct.from_mongo(product))
    return low_stock_items

# Pending purchase orders endpoint
@router.get("/purchase_orders/pending")
async def get_pending_purchase_orders():
    po_collection = get_collection("purchase_orders")
    pending_statuses = ['draft', 'pending-approval', 'approved', 'ordered']
    pending_orders = []
    async for po in po_collection.find({"status": {"$in": pending_statuses}}):
        pending_orders.append(PurchaseOrder.from_mongo(po))
    return pending_orders