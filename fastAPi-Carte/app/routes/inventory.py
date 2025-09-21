from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_collection
from app.models.inventory import InventoryProduct, Supplier, Stock
from bson import ObjectId

router = APIRouter(prefix="/api", tags=["inventory"])

# Inventory products endpoints
@router.get("/inventory_products", response_model=List[InventoryProduct])
async def get_inventory_products():
    products_collection = get_collection("inventory_products")
    products = []
    async for product in products_collection.find():
        products.append(InventoryProduct.from_mongo(product))
    return products

@router.post("/inventory_products", response_model=InventoryProduct)
async def create_inventory_product(product: InventoryProduct):
    products_collection = get_collection("inventory_products")
    product_dict = product.to_mongo()
    result = await products_collection.insert_one(product_dict)
    new_product = await products_collection.find_one({"_id": result.inserted_id})
    return InventoryProduct.from_mongo(new_product)

# Add similar endpoints for all other inventory entities...