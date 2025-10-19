# app/routes/inventory.py - COMPLETELY UPDATED
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.database import get_collection
from app.models.inventory import InventoryProduct, Supplier, Stock, Unit, StockAdjustment, InvCategory
from app.models.core import PurchaseOrder, GoodsReceipt
from app.models.response import (
    StandardResponse, InventoryProductResponse, SupplierResponse, UnitResponse, StockResponse,
    StockAdjustmentResponse, InvCategoryResponse, PurchaseOrderResponse,
    GoodsReceiptResponse
)
from app.utils.response_helpers import success_response, error_response, handle_http_exception, handle_generic_exception
from app.utils.mongo_helpers import to_mongo_dict, to_mongo_update_dict
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api", tags=["inventory"])

# Inventory products endpoints
@router.get("/inventory_products", response_model=StandardResponse[List[InventoryProductResponse]])
async def get_inventory_products(store_id: Optional[str] = Query(None)):
    try:
        products_collection = get_collection("inventory_products")
        query = {"store_id": store_id} if store_id else {}
        products = []
        # FIXED: Use await and iterate
        product_docs = await products_collection.find(query)
        for product in product_docs:
            products.append(InventoryProduct.from_mongo(product))
        return success_response(data=products)
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/inventory_products/{product_id}", response_model=StandardResponse[InventoryProductResponse])
async def get_inventory_product(product_id: str):
    try:
        products_collection = get_collection("inventory_products")
        product = await products_collection.find_one({"_id": ObjectId(product_id)})
        if product:
            return success_response(data=InventoryProduct.from_mongo(product))
        return error_response(message="Inventory product not found", code=404)
    except Exception:
        return error_response(message="Invalid product ID", code=400)

@router.post("/inventory_products", response_model=StandardResponse[InventoryProductResponse])
async def create_inventory_product(product: InventoryProduct):
    try:
        products_collection = get_collection("inventory_products")
        product_dict = to_mongo_dict(product)
        
        result = await products_collection.insert_one(product_dict)
        new_product = await products_collection.find_one({"_id": result.inserted_id})
        return success_response(
            data=InventoryProduct.from_mongo(new_product),
            message="Inventory product created successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.put("/inventory_products/{product_id}", response_model=StandardResponse[InventoryProductResponse])
async def update_inventory_product(product_id: str, product: InventoryProduct):
    try:
        products_collection = get_collection("inventory_products")
        product_dict = to_mongo_update_dict(product, exclude_unset=True)
        
        result = await products_collection.update_one(
            {"_id": ObjectId(product_id)}, {"$set": product_dict}
        )
        if result.modified_count == 0:
            return error_response(message="Inventory product not found", code=404)
        
        updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
        return success_response(
            data=InventoryProduct.from_mongo(updated_product),
            message="Inventory product updated successfully"
        )
    except Exception:
        return error_response(message="Invalid product ID", code=400)

@router.delete("/inventory_products/{product_id}", response_model=StandardResponse[dict])
async def delete_inventory_product(product_id: str):
    try:
        products_collection = get_collection("inventory_products")
        result = await products_collection.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0:
            return error_response(message="Inventory product not found", code=404)
        return success_response(
            data=None,
            message="Inventory product deleted successfully"
        )
    except Exception:
        return error_response(message="Invalid product ID", code=400)

# Suppliers endpoints
@router.get("/suppliers", response_model=StandardResponse[List[SupplierResponse]])
async def get_suppliers():
    try:
        suppliers_collection = get_collection("suppliers")
        suppliers = []
        # FIXED: Use await and iterate
        supplier_docs = await suppliers_collection.find()
        for supplier in supplier_docs:
            suppliers.append(Supplier.from_mongo(supplier))
        return success_response(data=suppliers)
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/suppliers/{supplier_id}", response_model=StandardResponse[SupplierResponse])
async def get_supplier(supplier_id: str):
    try:
        suppliers_collection = get_collection("suppliers")
        supplier = await suppliers_collection.find_one({"_id": ObjectId(supplier_id)})
        if supplier:
            return success_response(data=Supplier.from_mongo(supplier))
        return error_response(message="Supplier not found", code=404)
    except Exception:
        return error_response(message="Invalid supplier ID", code=400)

@router.post("/suppliers", response_model=StandardResponse[SupplierResponse])
async def create_supplier(supplier: Supplier):
    try:
        suppliers_collection = get_collection("suppliers")
        supplier_dict = to_mongo_dict(supplier)
        
        result = await suppliers_collection.insert_one(supplier_dict)
        new_supplier = await suppliers_collection.find_one({"_id": result.inserted_id})
        return success_response(
            data=Supplier.from_mongo(new_supplier),
            message="Supplier created successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.put("/suppliers/{supplier_id}", response_model=StandardResponse[SupplierResponse])
async def update_supplier(supplier_id: str, supplier: Supplier):
    try:
        suppliers_collection = get_collection("suppliers")
        supplier_dict = to_mongo_update_dict(supplier, exclude_unset=True)
        
        result = await suppliers_collection.update_one(
            {"_id": ObjectId(supplier_id)}, {"$set": supplier_dict}
        )
        if result.modified_count == 0:
            return error_response(message="Supplier not found", code=404)
        
        updated_supplier = await suppliers_collection.find_one({"_id": ObjectId(supplier_id)})
        return success_response(
            data=Supplier.from_mongo(updated_supplier),
            message="Supplier updated successfully"
        )
    except Exception:
        return error_response(message="Invalid supplier ID", code=400)

@router.delete("/suppliers/{supplier_id}", response_model=StandardResponse[dict])
async def delete_supplier(supplier_id: str):
    try:
        suppliers_collection = get_collection("suppliers")
        result = await suppliers_collection.delete_one({"_id": ObjectId(supplier_id)})
        if result.deleted_count == 0:
            return error_response(message="Supplier not found", code=404)
        return success_response(
            data=None,
            message="Supplier deleted successfully"
        )
    except Exception:
        return error_response(message="Invalid supplier ID", code=400)

# Units endpoints
@router.get("/units", response_model=StandardResponse[List[UnitResponse]])
async def get_units():
    try:
        units_collection = get_collection("units")
        units = []
        # FIXED: Use await and iterate
        unit_docs = await units_collection.find()
        for unit in unit_docs:
            units.append(Unit.from_mongo(unit))
        return success_response(data=units)
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/units/{unit_id}", response_model=StandardResponse[UnitResponse])
async def get_unit(unit_id: str):
    try:
        units_collection = get_collection("units")
        unit = await units_collection.find_one({"_id": ObjectId(unit_id)})
        if unit:
            return success_response(data=Unit.from_mongo(unit))
        return error_response(message="Unit not found", code=404)
    except Exception:
        return error_response(message="Invalid unit ID", code=400)

@router.post("/units", response_model=StandardResponse[UnitResponse])
async def create_unit(unit: Unit):
    try:
        units_collection = get_collection("units")
        unit_dict = to_mongo_dict(unit)
        
        result = await units_collection.insert_one(unit_dict)
        new_unit = await units_collection.find_one({"_id": result.inserted_id})
        return success_response(
            data=Unit.from_mongo(new_unit),
            message="Unit created successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.put("/units/{unit_id}", response_model=StandardResponse[UnitResponse])
async def update_unit(unit_id: str, unit: Unit):
    try:
        units_collection = get_collection("units")
        unit_dict = to_mongo_update_dict(unit, exclude_unset=True)
        
        result = await units_collection.update_one(
            {"_id": ObjectId(unit_id)}, {"$set": unit_dict}
        )
        if result.modified_count == 0:
            return error_response(message="Unit not found", code=404)
        
        updated_unit = await units_collection.find_one({"_id": ObjectId(unit_id)})
        return success_response(
            data=Unit.from_mongo(updated_unit),
            message="Unit updated successfully"
        )
    except Exception:
        return error_response(message="Invalid unit ID", code=400)

@router.delete("/units/{unit_id}", response_model=StandardResponse[dict])
async def delete_unit(unit_id: str):
    try:
        units_collection = get_collection("units")
        result = await units_collection.delete_one({"_id": ObjectId(unit_id)})
        if result.deleted_count == 0:
            return error_response(message="Unit not found", code=404)
        return success_response(
            data=None,
            message="Unit deleted successfully"
        )
    except Exception:
        return error_response(message="Invalid unit ID", code=400)

# Stock endpoints
@router.get("/stocks", response_model=StandardResponse[List[StockResponse]])
async def get_stocks(product_id: Optional[str] = Query(None)):
    try:
        stocks_collection = get_collection("stocks")
        query = {"inventory_product_id": product_id} if product_id else {}
        stocks = []
        # FIXED: Use await and iterate
        stock_docs = await stocks_collection.find(query)
        for stock in stock_docs:
            stocks.append(Stock.from_mongo(stock))
        return success_response(data=stocks)
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/stocks/{stock_id}", response_model=StandardResponse[StockResponse])
async def get_stock(stock_id: str):
    try:
        stocks_collection = get_collection("stocks")
        stock = await stocks_collection.find_one({"_id": ObjectId(stock_id)})
        if stock:
            return success_response(data=Stock.from_mongo(stock))
        return error_response(message="Stock not found", code=404)
    except Exception:
        return error_response(message="Invalid stock ID", code=400)

@router.post("/stocks", response_model=StandardResponse[StockResponse])
async def create_stock(stock: Stock):
    try:
        stocks_collection = get_collection("stocks")
        stock_dict = to_mongo_dict(stock)
        
        result = await stocks_collection.insert_one(stock_dict)
        new_stock = await stocks_collection.find_one({"_id": result.inserted_id})
        return success_response(
            data=Stock.from_mongo(new_stock),
            message="Stock created successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.put("/stocks/{stock_id}", response_model=StandardResponse[StockResponse])
async def update_stock(stock_id: str, stock: Stock):
    try:
        stocks_collection = get_collection("stocks")
        stock_dict = to_mongo_update_dict(stock, exclude_unset=True)
        
        result = await stocks_collection.update_one(
            {"_id": ObjectId(stock_id)}, {"$set": stock_dict}
        )
        if result.modified_count == 0:
            return error_response(message="Stock not found", code=404)
        
        updated_stock = await stocks_collection.find_one({"_id": ObjectId(stock_id)})
        return success_response(
            data=Stock.from_mongo(updated_stock),
            message="Stock updated successfully"
        )
    except Exception:
        return error_response(message="Invalid stock ID", code=400)

@router.delete("/stocks/{stock_id}", response_model=StandardResponse[dict])
async def delete_stock(stock_id: str):
    try:
        stocks_collection = get_collection("stocks")
        result = await stocks_collection.delete_one({"_id": ObjectId(stock_id)})
        if result.deleted_count == 0:
            return error_response(message="Stock not found", code=404)
        return success_response(
            data=None,
            message="Stock deleted successfully"
        )
    except Exception:
        return error_response(message="Invalid stock ID", code=400)

# Stock Adjustments endpoints
@router.get("/stock_adjustments", response_model=StandardResponse[List[StockAdjustmentResponse]])
async def get_stock_adjustments(stock_id: Optional[str] = Query(None)):
    try:
        sa_collection = get_collection("stock_adjustments")
        query = {"stock_id": stock_id} if stock_id else {}
        sas = []
        # FIXED: Use await and iterate
        sa_docs = await sa_collection.find(query)
        for sa in sa_docs:
            sas.append(StockAdjustment.from_mongo(sa))
        return success_response(data=sas)
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/stock_adjustments/{adjustment_id}", response_model=StandardResponse[StockAdjustmentResponse])
async def get_stock_adjustment(adjustment_id: str):
    try:
        sa_collection = get_collection("stock_adjustments")
        sa = await sa_collection.find_one({"_id": ObjectId(adjustment_id)})
        if sa:
            return success_response(data=StockAdjustment.from_mongo(sa))
        return error_response(message="Stock adjustment not found", code=404)
    except Exception:
        return error_response(message="Invalid adjustment ID", code=400)

@router.post("/stock_adjustments", response_model=StandardResponse[StockAdjustmentResponse])
async def create_stock_adjustment(sa: StockAdjustment):
    try:
        sa_collection = get_collection("stock_adjustments")
        sa_dict = to_mongo_dict(sa)
        
        result = await sa_collection.insert_one(sa_dict)
        new_sa = await sa_collection.find_one({"_id": result.inserted_id})
        return success_response(
            data=StockAdjustment.from_mongo(new_sa),
            message="Stock adjustment created successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.put("/stock_adjustments/{adjustment_id}", response_model=StandardResponse[StockAdjustmentResponse])
async def update_stock_adjustment(adjustment_id: str, sa: StockAdjustment):
    try:
        sa_collection = get_collection("stock_adjustments")
        sa_dict = to_mongo_update_dict(sa, exclude_unset=True)
        
        result = await sa_collection.update_one(
            {"_id": ObjectId(adjustment_id)}, {"$set": sa_dict}
        )
        if result.modified_count == 0:
            return error_response(message="Stock adjustment not found", code=404)
        
        updated_sa = await sa_collection.find_one({"_id": ObjectId(adjustment_id)})
        return success_response(
            data=StockAdjustment.from_mongo(updated_sa),
            message="Stock adjustment updated successfully"
        )
    except Exception:
        return error_response(message="Invalid adjustment ID", code=400)

@router.delete("/stock_adjustments/{adjustment_id}", response_model=StandardResponse[dict])
async def delete_stock_adjustment(adjustment_id: str):
    try:
        sa_collection = get_collection("stock_adjustments")
        result = await sa_collection.delete_one({"_id": ObjectId(adjustment_id)})
        if result.deleted_count == 0:
            return error_response(message="Stock adjustment not found", code=404)
        return success_response(
            data=None,
            message="Stock adjustment deleted successfully"
        )
    except Exception:
        return error_response(message="Invalid adjustment ID", code=400)

# Inventory Categories endpoints
@router.get("/inv_categories", response_model=StandardResponse[List[InvCategoryResponse]])
async def get_inv_categories(store_id: Optional[str] = Query(None)):
    try:
        categories_collection = get_collection("inv_categories")
        query = {"store_id": store_id} if store_id else {}
        categories = []
        # FIXED: Use await and iterate
        category_docs = await categories_collection.find(query)
        for category in category_docs:
            categories.append(InvCategory.from_mongo(category))
        return success_response(data=categories)
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/inv_categories/{category_id}", response_model=StandardResponse[InvCategoryResponse])
async def get_inv_category(category_id: str):
    try:
        categories_collection = get_collection("inv_categories")
        category = await categories_collection.find_one({"_id": ObjectId(category_id)})
        if category:
            return success_response(data=InvCategory.from_mongo(category))
        return error_response(message="Inventory category not found", code=404)
    except Exception:
        return error_response(message="Invalid category ID", code=400)

@router.post("/inv_categories", response_model=StandardResponse[InvCategoryResponse])
async def create_inv_category(category: InvCategory):
    try:
        categories_collection = get_collection("inv_categories")
        category_dict = to_mongo_dict(category)
        
        result = await categories_collection.insert_one(category_dict)
        new_category = await categories_collection.find_one({"_id": result.inserted_id})
        return success_response(
            data=InvCategory.from_mongo(new_category),
            message="Inventory category created successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.put("/inv_categories/{category_id}", response_model=StandardResponse[InvCategoryResponse])
async def update_inv_category(category_id: str, category: InvCategory):
    try:
        categories_collection = get_collection("inv_categories")
        category_dict = to_mongo_update_dict(category, exclude_unset=True)
        
        result = await categories_collection.update_one(
            {"_id": ObjectId(category_id)}, {"$set": category_dict}
        )
        if result.modified_count == 0:
            return error_response(message="Inventory category not found", code=404)
        
        updated_category = await categories_collection.find_one({"_id": ObjectId(category_id)})
        return success_response(
            data=InvCategory.from_mongo(updated_category),
            message="Inventory category updated successfully"
        )
    except Exception:
        return error_response(message="Invalid category ID", code=400)

@router.delete("/inv_categories/{category_id}", response_model=StandardResponse[dict])
async def delete_inv_category(category_id: str):
    try:
        categories_collection = get_collection("inv_categories")
        result = await categories_collection.delete_one({"_id": ObjectId(category_id)})
        if result.deleted_count == 0:
            return error_response(message="Inventory category not found", code=404)
        return success_response(
            data=None,
            message="Inventory category deleted successfully"
        )
    except Exception:
        return error_response(message="Invalid category ID", code=400)

# Low stock items endpoint
@router.get("/inventory/low-stock", response_model=StandardResponse[List[InventoryProductResponse]])
async def get_low_stock_items(store_id: Optional[str] = Query(None)):
    try:
        products_collection = get_collection("inventory_products")
        query = {"store_id": store_id} if store_id else {}
        low_stock_items = []
        # FIXED: Use await and iterate
        product_docs = await products_collection.find(query)
        for product in product_docs:
            if product.get("quantity_in_stock", 0) <= product.get("reorder_level", 0):
                low_stock_items.append(InventoryProduct.from_mongo(product))
        return success_response(data=low_stock_items)
    except Exception as e:
        return handle_generic_exception(e)

# Pending purchase orders endpoint
@router.get("/purchase_orders/pending", response_model=StandardResponse[List[PurchaseOrderResponse]])
async def get_pending_purchase_orders():
    try:
        po_collection = get_collection("purchase_orders")
        pending_statuses = ['draft', 'pending-approval', 'approved', 'ordered']
        pending_orders = []
        # FIXED: Use await and iterate
        po_docs = await po_collection.find({"status": {"$in": pending_statuses}})
        for po in po_docs:
            pending_orders.append(PurchaseOrder.from_mongo(po))
        return success_response(data=pending_orders)
    except Exception as e:
        return handle_generic_exception(e)

# Stock level update endpoint
@router.post("/inventory_products/{product_id}/update-stock", response_model=StandardResponse[dict])
async def update_product_stock(product_id: str, quantity_change: float, reason: str = "Manual adjustment"):
    try:
        products_collection = get_collection("inventory_products")
        stock_adjustments_collection = get_collection("stock_adjustments")
        
        product = await products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            return error_response(message="Inventory product not found", code=404)
        
        current_stock = product.get("quantity_in_stock", 0)
        new_stock = current_stock + quantity_change
        
        # Update product stock
        await products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {
                "quantity_in_stock": max(0, new_stock),
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        
        # Create stock adjustment record
        adjustment = StockAdjustment(
            stock_id=product_id,
            quantity_change=quantity_change,
            reason=reason,
            adjustment_date=datetime.utcnow().isoformat()
        )
        
        adjustment_dict = to_mongo_dict(adjustment)
        
        await stock_adjustments_collection.insert_one(adjustment_dict)
        
        return success_response(data={
            "message": "Stock updated successfully",
            "product_id": product_id,
            "previous_stock": current_stock,
            "new_stock": new_stock,
            "adjustment": quantity_change
        })
    except Exception:
        return error_response(message="Invalid product ID", code=400)

# Health check endpoint
@router.get("/health")
async def inventory_health_check():
    return success_response(data={"status": "healthy", "module": "inventory"})