from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.database import get_collection
from app.models.core import Food, Order, Category, Customer, Table, Store
from bson import ObjectId

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

# Orders endpoints (similar pattern for all other entities)
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

# Add similar endpoints for all other core entities...