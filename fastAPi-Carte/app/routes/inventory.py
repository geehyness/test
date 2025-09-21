# app/routes/inventory.py
from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_collection
from app.models.inventory import InventoryProduct, Supplier, Stock, Unit, StockAdjustment
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

# Suppliers endpoints
@router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers():
    suppliers_collection = get_collection("suppliers")
    suppliers = []
    async for supplier in suppliers_collection.find():
        suppliers.append(Supplier.from_mongo(supplier))
    return suppliers

@router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier: Supplier):
    suppliers_collection = get_collection("suppliers")
    supplier_dict = supplier.to_mongo()
    result = await suppliers_collection.insert_one(supplier_dict)
    new_supplier = await suppliers_collection.find_one({"_id": result.inserted_id})
    return Supplier.from_mongo(new_supplier)

# Units endpoints
@router.get("/units", response_model=List[Unit])
async def get_units():
    units_collection = get_collection("units")
    units = []
    async for unit in units_collection.find():
        units.append(Unit.from_mongo(unit))
    return units

@router.post("/units", response_model=Unit)
async def create_unit(unit: Unit):
    units_collection = get_collection("units")
    unit_dict = unit.to_mongo()
    result = await units_collection.insert_one(unit_dict)
    new_unit = await units_collection.find_one({"_id": result.inserted_id})
    return Unit.from_mongo(new_unit)

# Stock endpoints
@router.get("/stocks", response_model=List[Stock])
async def get_stocks():
    stocks_collection = get_collection("stocks")
    stocks = []
    async for stock in stocks_collection.find():
        stocks.append(Stock.from_mongo(stock))
    return stocks

@router.post("/stocks", response_model=Stock)
async def create_stock(stock: Stock):
    stocks_collection = get_collection("stocks")
    stock_dict = stock.to_mongo()
    result = await stocks_collection.insert_one(stock_dict)
    new_stock = await stocks_collection.find_one({"_id": result.inserted_id})
    return Stock.from_mongo(new_stock)

# Stock Adjustments endpoints
@router.get("/stock_adjustments", response_model=List[StockAdjustment])
async def get_stock_adjustments():
    sa_collection = get_collection("stock_adjustments")
    sas = []
    async for sa in sa_collection.find():
        sas.append(StockAdjustment.from_mongo(sa))
    return sas

@router.post("/stock_adjustments", response_model=StockAdjustment)
async def create_stock_adjustment(sa: StockAdjustment):
    sa_collection = get_collection("stock_adjustments")
    sa_dict = sa.to_mongo()
    result = await sa_collection.insert_one(sa_dict)
    new_sa = await sa_collection.find_one({"_id": result.inserted_id})
    return StockAdjustment.from_mongo(new_sa)