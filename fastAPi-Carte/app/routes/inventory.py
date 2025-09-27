# app/routes/inventory.py
from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_collection
from app.models.inventory import InventoryProduct, Supplier, Stock, Unit, StockAdjustment, InvCategory
from app.models.core import PurchaseOrder, GoodsReceipt
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api", tags=["inventory"])

# Inventory products endpoints
@router.get("/inventory_products", response_model=List[InventoryProduct])
async def get_inventory_products():
    products_collection = get_collection("inventory_products")
    products = []
    async for product in products_collection.find():
        products.append(InventoryProduct.from_mongo(product))
    return products

@router.get("/inventory_products/{product_id}", response_model=InventoryProduct)
async def get_inventory_product(product_id: str):
    products_collection = get_collection("inventory_products")
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if product:
        return InventoryProduct.from_mongo(product)
    raise HTTPException(status_code=404, detail="Inventory product not found")

@router.post("/inventory_products", response_model=InventoryProduct)
async def create_inventory_product(product: InventoryProduct):
    products_collection = get_collection("inventory_products")
    product_dict = product.to_mongo()
    product_dict["created_at"] = datetime.utcnow()
    product_dict["updated_at"] = datetime.utcnow()
    
    result = await products_collection.insert_one(product_dict)
    new_product = await products_collection.find_one({"_id": result.inserted_id})
    return InventoryProduct.from_mongo(new_product)

@router.put("/inventory_products/{product_id}", response_model=InventoryProduct)
async def update_inventory_product(product_id: str, product: InventoryProduct):
    products_collection = get_collection("inventory_products")
    product_dict = product.to_mongo(exclude_unset=True)
    product_dict["updated_at"] = datetime.utcnow()
    
    result = await products_collection.update_one(
        {"_id": ObjectId(product_id)}, {"$set": product_dict}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Inventory product not found")
    
    updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    return InventoryProduct.from_mongo(updated_product)

@router.delete("/inventory_products/{product_id}")
async def delete_inventory_product(product_id: str):
    products_collection = get_collection("inventory_products")
    result = await products_collection.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inventory product not found")
    return {"message": "Inventory product deleted successfully"}

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
    supplier_dict["created_at"] = datetime.utcnow()
    supplier_dict["updated_at"] = datetime.utcnow()
    
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
    unit_dict["created_at"] = datetime.utcnow()
    unit_dict["updated_at"] = datetime.utcnow()
    
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
    stock_dict["created_at"] = datetime.utcnow()
    stock_dict["updated_at"] = datetime.utcnow()
    
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
    sa_dict["created_at"] = datetime.utcnow()
    sa_dict["updated_at"] = datetime.utcnow()
    
    result = await sa_collection.insert_one(sa_dict)
    new_sa = await sa_collection.find_one({"_id": result.inserted_id})
    return StockAdjustment.from_mongo(new_sa)

# Inventory Categories endpoints
@router.get("/inv_categories", response_model=List[InvCategory])
async def get_inv_categories():
    categories_collection = get_collection("inv_categories")
    categories = []
    async for category in categories_collection.find():
        categories.append(InvCategory.from_mongo(category))
    return categories

@router.post("/inv_categories", response_model=InvCategory)
async def create_inv_category(category: InvCategory):
    categories_collection = get_collection("inv_categories")
    category_dict = category.to_mongo()
    category_dict["created_at"] = datetime.utcnow()
    category_dict["updated_at"] = datetime.utcnow()
    
    result = await categories_collection.insert_one(category_dict)
    new_category = await categories_collection.find_one({"_id": result.inserted_id})
    return InvCategory.from_mongo(new_category)

# Purchase Orders endpoints (inventory related)
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

# Sites endpoints (for inventory management)
@router.get("/sites", response_model=List[dict])
async def get_sites():
    sites_collection = get_collection("sites")
    sites = []
    async for site in sites_collection.find():
        sites.append({
            "id": str(site["_id"]),
            "name": site.get("name", ""),
            "address": site.get("address", ""),
            "type": site.get("type", ""),
            "created_at": site.get("created_at"),
            "updated_at": site.get("updated_at")
        })
    return sites

@router.post("/sites", response_model=dict)
async def create_site(site: dict):
    sites_collection = get_collection("sites")
    site_dict = site
    site_dict["created_at"] = datetime.utcnow()
    site_dict["updated_at"] = datetime.utcnow()
    
    result = await sites_collection.insert_one(site_dict)
    new_site = await sites_collection.find_one({"_id": result.inserted_id})
    return {
        "id": str(new_site["_id"]),
        "name": new_site.get("name", ""),
        "address": new_site.get("address", ""),
        "type": new_site.get("type", ""),
        "created_at": new_site.get("created_at"),
        "updated_at": new_site.get("updated_at")
    }

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