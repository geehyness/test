# app/routes/core.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.database import get_collection
from app.models.core import Food, Order, Category, Customer, Table, Store, PurchaseOrder, GoodsReceipt
from app.models.inventory import InventoryProduct
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api", tags=["core"])

# Foods endpoints
@router.get("/foods", response_model=List[Food])
async def get_foods():
    foods_collection = get_collection("foods")
    foods = []
    async for food in foods_collection.find():
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
    result = await foods_collection.insert_one(food_dict)
    new_food = await foods_collection.find_one({"_id": result.inserted_id})
    return Food.from_mongo(new_food)

@router.put("/foods/{food_id}", response_model=Food)
async def update_food(food_id: str, food: Food):
    foods_collection = get_collection("foods")
    food_dict = food.to_mongo(exclude_unset=True)
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

# Orders endpoints
@router.get("/orders", response_model=List[Order])
async def get_orders():
    orders_collection = get_collection("orders")
    orders = []
    async for order in orders_collection.find():
        orders.append(Order.from_mongo(order))
    return orders

@router.post("/orders", response_model=Order)
async def create_order(order: Order):
    orders_collection = get_collection("orders")
    order_dict = order.to_mongo()
    result = await orders_collection.insert_one(order_dict)
    new_order = await orders_collection.find_one({"_id": result.inserted_id})
    return Order.from_mongo(new_order)

# Categories endpoints
@router.get("/categories", response_model=List[Category])
async def get_categories():
    categories_collection = get_collection("categories")
    categories = []
    async for category in categories_collection.find():
        categories.append(Category.from_mongo(category))
    return categories

@router.post("/categories", response_model=Category)
async def create_category(category: Category):
    categories_collection = get_collection("categories")
    category_dict = category.to_mongo()
    result = await categories_collection.insert_one(category_dict)
    new_category = await categories_collection.find_one({"_id": result.inserted_id})
    return Category.from_mongo(new_category)

# Customers endpoints
@router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers_collection = get_collection("customers")
    customers = []
    async for customer in customers_collection.find():
        customers.append(Customer.from_mongo(customer))
    return customers

@router.post("/customers", response_model=Customer)
async def create_customer(customer: Customer):
    customers_collection = get_collection("customers")
    customer_dict = customer.to_mongo()
    result = await customers_collection.insert_one(customer_dict)
    new_customer = await customers_collection.find_one({"_id": result.inserted_id})
    return Customer.from_mongo(new_customer)

# Tables endpoints
@router.get("/tables", response_model=List[Table])
async def get_tables():
    tables_collection = get_collection("tables")
    tables = []
    async for table in tables_collection.find():
        tables.append(Table.from_mongo(table))
    return tables

@router.post("/tables", response_model=Table)
async def create_table(table: Table):
    tables_collection = get_collection("tables")
    table_dict = table.to_mongo()
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
    result = await po_collection.insert_one(po_dict)
    new_po = await po_collection.find_one({"_id": result.inserted_id})
    return PurchaseOrder.from_mongo(new_po)

@router.put("/purchase_orders/{po_id}", response_model=PurchaseOrder)
async def update_purchase_order(po_id: str, po: PurchaseOrder):
    po_collection = get_collection("purchase_orders")
    po_dict = po.to_mongo(exclude_unset=True)
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
            
            # Use the quantity from the goods receipt item
            current_stock = product.get("quantity_in_stock", 0)
            new_stock = current_stock + item.received_quantity
            
            await products_collection.update_one(
                {"_id": ObjectId(item.inventory_product_id)},
                {"$set": {"quantity_in_stock": new_stock, "last_restocked_at": datetime.utcnow()}}
            )

    # Insert the goods receipt
    gr_dict = gr.to_mongo()
    result = await gr_collection.insert_one(gr_dict)
    new_gr = await gr_collection.find_one({"_id": result.inserted_id})
    return GoodsReceipt.from_mongo(new_gr)