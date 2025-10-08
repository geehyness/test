# app/routes/core.py - COMPLETELY UPDATED
from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from app.database import get_collection
from app.models.core import (
    Food, Order, Category, Customer, Table, Store, PurchaseOrder, GoodsReceipt, 
    Reservation, Tenant, Domain, Site, PaymentMethod, Tax, Payment, Brand, ContactMessage, User, Report, PasswordReset, Job, FailedJob
)
from app.models.inventory import InventoryProduct
from app.models.response import (
    StandardResponse, FoodResponse, OrderResponse, CategoryResponse, CustomerResponse, 
    TableResponse, StoreResponse, PurchaseOrderResponse, 
    GoodsReceiptResponse, ReservationResponse,
    InventoryProductResponse, TenantResponse, DomainResponse, 
    SiteResponse, PaymentMethodResponse, TaxResponse, PaymentResponse, 
    BrandResponse, ContactMessageResponse, UserResponse, ReportResponse, PasswordResetResponse, JobResponse, FailedJobResponse
)
from app.utils.response_helpers import success_response, error_response, handle_http_exception, handle_generic_exception
from app.utils.mongo_helpers import to_mongo_dict, to_mongo_update_dict
from bson import ObjectId
from datetime import datetime
import math

router = APIRouter(prefix="/api", tags=["core"])

# --- Generic CRUD Helper Functions ---

async def _create_item(collection_name: str, item_model, response_model):
    """Generic function to create a new item."""
    try:
        collection = get_collection(collection_name)
        item_dict = to_mongo_dict(item_model)
        result = await collection.insert_one(item_dict)
        new_item = await collection.find_one({"_id": result.inserted_id})
        return success_response(
            data=item_model.from_mongo(new_item),
            message=f"{collection_name[:-1].capitalize()} created successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

async def _get_all_items(collection_name: str, item_model, query: dict = None):
    """Generic function to retrieve a list of items."""
    try:
        collection = get_collection(collection_name)
        items = []
        async for item in collection.find(query or {}):
            items.append(item_model.from_mongo(item))
        return success_response(data=items)
    except Exception as e:
        return handle_generic_exception(e)

async def _get_item_by_id(collection_name: str, item_id: str, item_model):
    """Generic function to retrieve a single item by ID."""
    try:
        collection = get_collection(collection_name)
        item = await collection.find_one({"_id": ObjectId(item_id)})
    except Exception:
        return error_response(message=f"Invalid ID format for {collection_name}", code=400)
        
    if item:
        return success_response(data=item_model.from_mongo(item))
    return error_response(message=f"{collection_name[:-1].capitalize()} not found", code=404)

async def _update_item(collection_name: str, item_id: str, item_model, response_model):
    """Generic function to update an item."""
    try:
        collection = get_collection(collection_name)
        item_dict = to_mongo_update_dict(item_model, exclude_unset=True)
        
        result = await collection.update_one(
            {"_id": ObjectId(item_id)}, {"$set": item_dict}
        )
        if result.modified_count == 0 and result.matched_count == 0:
            return error_response(message=f"{collection_name[:-1].capitalize()} not found", code=404)
            
        updated_item = await collection.find_one({"_id": ObjectId(item_id)})
        return success_response(
            data=item_model.from_mongo(updated_item),
            message=f"{collection_name[:-1].capitalize()} updated successfully"
        )
    except Exception as e:
        return handle_generic_exception(e)

async def _delete_item(collection_name: str, item_id: str):
    """Generic function to delete an item."""
    try:
        collection = get_collection(collection_name)
        result = await collection.delete_one({"_id": ObjectId(item_id)})
        if result.deleted_count == 0:
            return error_response(message=f"{collection_name[:-1].capitalize()} not found", code=404)
        return success_response(
            data=None,
            message=f"{collection_name[:-1].capitalize()} deleted successfully"
        )
    except Exception as e:
        return handle_generic_exception(e)

# --------------------------
# --- Food Endpoints ---
# --------------------------
@router.get("/foods", response_model=StandardResponse[List[FoodResponse]])
async def get_foods(store_id: Optional[str] = Query(None)):
    return await _get_all_items("foods", Food, {"store_id": store_id} if store_id else {})

@router.get("/foods/{food_id}", response_model=StandardResponse[FoodResponse])
async def get_food(food_id: str):
    return await _get_item_by_id("foods", food_id, Food)

@router.post("/foods", response_model=StandardResponse[FoodResponse])
async def create_food(food: Food):
    return await _create_item("foods", food, FoodResponse)

@router.put("/foods/{food_id}", response_model=StandardResponse[FoodResponse])
async def update_food(food_id: str, food: Food):
    return await _update_item("foods", food_id, food, FoodResponse)

@router.delete("/foods/{food_id}", response_model=StandardResponse[dict])
async def delete_food(food_id: str):
    return await _delete_item("foods", food_id)

# --------------------------
# --- Orders Endpoints ---
# --------------------------
@router.get("/orders", response_model=StandardResponse[List[OrderResponse]])
async def get_orders(store_id: Optional[str] = Query(None), status: Optional[str] = Query(None)):
    query = {}
    if store_id:
        query["store_id"] = store_id
    if status:
        query["status"] = status
    return await _get_all_items("orders", Order, query)

@router.get("/orders/{order_id}", response_model=StandardResponse[OrderResponse])
async def get_order(order_id: str):
    return await _get_item_by_id("orders", order_id, Order)

@router.post("/orders", response_model=StandardResponse[OrderResponse])
async def create_order(order: Order):
    try:
        orders_collection = get_collection("orders")
        inventory_collection = get_collection("inventory_products")
        
        order_dict = to_mongo_dict(order)
        
        # Check inventory and deduct quantities
        stock_warnings = []
        for item in order.items:
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
        
        return success_response(
            data=OrderResponse.from_mongo(order_response),
            message="Order created successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.put("/orders/{order_id}", response_model=StandardResponse[OrderResponse])
async def update_order(order_id: str, order: Order):
    return await _update_item("orders", order_id, order, OrderResponse)

@router.delete("/orders/{order_id}", response_model=StandardResponse[dict])
async def delete_order(order_id: str):
    return await _delete_item("orders", order_id)

# --------------------------
# --- Categories Endpoints ---
# --------------------------
@router.get("/categories", response_model=StandardResponse[List[CategoryResponse]])
async def get_categories(store_id: Optional[str] = Query(None)):
    query = {"store_id": store_id} if store_id else {}
    return await _get_all_items("categories", Category, query)

@router.get("/categories/{category_id}", response_model=StandardResponse[CategoryResponse])
async def get_category(category_id: str):
    return await _get_item_by_id("categories", category_id, Category)

@router.post("/categories", response_model=StandardResponse[CategoryResponse])
async def create_category(category: Category):
    return await _create_item("categories", category, CategoryResponse)

@router.put("/categories/{category_id}", response_model=StandardResponse[CategoryResponse])
async def update_category(category_id: str, category: Category):
    return await _update_item("categories", category_id, category, CategoryResponse)

@router.delete("/categories/{category_id}", response_model=StandardResponse[dict])
async def delete_category(category_id: str):
    return await _delete_item("categories", category_id)

# --------------------------
# --- Customers Endpoints ---
# --------------------------
@router.get("/customers", response_model=StandardResponse[List[CustomerResponse]])
async def get_customers(store_id: Optional[str] = Query(None)):
    query = {"store_id": store_id} if store_id else {}
    return await _get_all_items("customers", Customer, query)

@router.get("/customers/{customer_id}", response_model=StandardResponse[CustomerResponse])
async def get_customer(customer_id: str):
    return await _get_item_by_id("customers", customer_id, Customer)

@router.post("/customers", response_model=StandardResponse[CustomerResponse])
async def create_customer(customer: Customer):
    return await _create_item("customers", customer, CustomerResponse)

@router.put("/customers/{customer_id}", response_model=StandardResponse[CustomerResponse])
async def update_customer(customer_id: str, customer: Customer):
    return await _update_item("customers", customer_id, customer, CustomerResponse)

@router.delete("/customers/{customer_id}", response_model=StandardResponse[dict])
async def delete_customer(customer_id: str):
    return await _delete_item("customers", customer_id)

# --------------------------
# --- Tables Endpoints ---
# --------------------------
@router.get("/tables", response_model=StandardResponse[List[TableResponse]])
async def get_tables(store_id: Optional[str] = Query(None)):
    query = {"store_id": store_id} if store_id else {}
    return await _get_all_items("tables", Table, query)

@router.get("/tables/{table_id}", response_model=StandardResponse[TableResponse])
async def get_table(table_id: str):
    return await _get_item_by_id("tables", table_id, Table)

@router.post("/tables", response_model=StandardResponse[TableResponse])
async def create_table(table: Table):
    return await _create_item("tables", table, TableResponse)

@router.put("/tables/{table_id}", response_model=StandardResponse[TableResponse])
async def update_table(table_id: str, table: Table):
    return await _update_item("tables", table_id, table, TableResponse)

@router.delete("/tables/{table_id}", response_model=StandardResponse[dict])
async def delete_table(table_id: str):
    return await _delete_item("tables", table_id)

# --------------------------
# --- Stores Endpoints ---
# --------------------------
@router.get("/stores", response_model=StandardResponse[List[StoreResponse]])
async def get_stores():
    return await _get_all_items("stores", Store)

@router.get("/stores/{store_id}", response_model=StandardResponse[StoreResponse])
async def get_store(store_id: str):
    return await _get_item_by_id("stores", store_id, Store)

@router.post("/stores", response_model=StandardResponse[StoreResponse])
async def create_store(store: Store):
    return await _create_item("stores", store, StoreResponse)

@router.put("/stores/{store_id}", response_model=StandardResponse[StoreResponse])
async def update_store(store_id: str, store: Store):
    return await _update_item("stores", store_id, store, StoreResponse)

@router.delete("/stores/{store_id}", response_model=StandardResponse[dict])
async def delete_store(store_id: str):
    return await _delete_item("stores", store_id)

# --------------------------
# --- Purchase Orders Endpoints ---
# --------------------------
@router.get("/purchase_orders", response_model=StandardResponse[List[PurchaseOrderResponse]])
async def get_purchase_orders():
    return await _get_all_items("purchase_orders", PurchaseOrder)

@router.get("/purchase_orders/{po_id}", response_model=StandardResponse[PurchaseOrderResponse])
async def get_purchase_order(po_id: str):
    return await _get_item_by_id("purchase_orders", po_id, PurchaseOrder)

@router.post("/purchase_orders", response_model=StandardResponse[PurchaseOrderResponse])
async def create_purchase_order(po: PurchaseOrder):
    return await _create_item("purchase_orders", po, PurchaseOrderResponse)

@router.put("/purchase_orders/{po_id}", response_model=StandardResponse[PurchaseOrderResponse])
async def update_purchase_order(po_id: str, po: PurchaseOrder):
    return await _update_item("purchase_orders", po_id, po, PurchaseOrderResponse)

@router.delete("/purchase_orders/{po_id}", response_model=StandardResponse[dict])
async def delete_purchase_order(po_id: str):
    return await _delete_item("purchase_orders", po_id)

# --------------------------
# --- Goods Receipts Endpoints ---
# --------------------------
@router.get("/goods_receipts", response_model=StandardResponse[List[GoodsReceiptResponse]])
async def get_goods_receipts():
    return await _get_all_items("goods_receipts", GoodsReceipt)

@router.get("/goods_receipts/{gr_id}", response_model=StandardResponse[GoodsReceiptResponse])
async def get_goods_receipt(gr_id: str):
    return await _get_item_by_id("goods_receipts", gr_id, GoodsReceipt)

@router.post("/goods_receipts", response_model=StandardResponse[GoodsReceiptResponse])
async def create_goods_receipt(gr: GoodsReceipt):
    try:
        gr_collection = get_collection("goods_receipts")
        products_collection = get_collection("inventory_products")

        # Update inventory quantities based on received items
        for item in gr.items:
            if item.condition == 'good':
                product = await products_collection.find_one({"_id": ObjectId(item.inventory_product_id)})
                if not product:
                    return error_response(message=f"Inventory Product with id {item.inventory_product_id} not found.", code=404)
                
                current_stock = product.get("quantity_in_stock", 0)
                new_stock = current_stock + item.received_quantity
                
                await products_collection.update_one(
                    {"_id": ObjectId(item.inventory_product_id)},
                    {"$set": {"quantity_in_stock": new_stock, "last_restocked_at": datetime.utcnow().isoformat()}}
                )

        # Insert the goods receipt
        gr_dict = to_mongo_dict(gr)
        
        result = await gr_collection.insert_one(gr_dict)
        new_gr = await gr_collection.find_one({"_id": result.inserted_id})
        return success_response(
            data=GoodsReceipt.from_mongo(new_gr),
            message="Goods receipt created successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.put("/goods_receipts/{gr_id}", response_model=StandardResponse[GoodsReceiptResponse])
async def update_goods_receipt(gr_id: str, gr: GoodsReceipt):
    return await _update_item("goods_receipts", gr_id, gr, GoodsReceiptResponse)

@router.delete("/goods_receipts/{gr_id}", response_model=StandardResponse[dict])
async def delete_goods_receipt(gr_id: str):
    return await _delete_item("goods_receipts", gr_id)

# --------------------------
# --- Reservations Endpoints ---
# --------------------------
@router.get("/reservations", response_model=StandardResponse[List[ReservationResponse]])
async def get_reservations(store_id: Optional[str] = Query(None)):
    query = {"store_id": store_id} if store_id else {}
    return await _get_all_items("reservations", Reservation, query)

@router.get("/reservations/{reservation_id}", response_model=StandardResponse[ReservationResponse])
async def get_reservation(reservation_id: str):
    return await _get_item_by_id("reservations", reservation_id, Reservation)

@router.post("/reservations", response_model=StandardResponse[ReservationResponse])
async def create_reservation(reservation: Reservation):
    return await _create_item("reservations", reservation, ReservationResponse)

@router.put("/reservations/{reservation_id}", response_model=StandardResponse[ReservationResponse])
async def update_reservation(reservation_id: str, reservation: Reservation):
    return await _update_item("reservations", reservation_id, reservation, ReservationResponse)

@router.delete("/reservations/{reservation_id}", response_model=StandardResponse[dict])
async def delete_reservation(reservation_id: str):
    return await _delete_item("reservations", reservation_id)

# ----------------------------------------------------
# --- NEW CRUD Endpoints for Missing Core Models ---
# ----------------------------------------------------

# Brands Endpoints
@router.get("/brands", response_model=StandardResponse[List[BrandResponse]])
async def get_brands():
    return await _get_all_items("brands", Brand)

@router.get("/brands/{brand_id}", response_model=StandardResponse[BrandResponse])
async def get_brand(brand_id: str):
    return await _get_item_by_id("brands", brand_id, Brand)

@router.post("/brands", response_model=StandardResponse[BrandResponse])
async def create_brand(brand: Brand):
    return await _create_item("brands", brand, BrandResponse)

@router.put("/brands/{brand_id}", response_model=StandardResponse[BrandResponse])
async def update_brand(brand_id: str, brand: Brand):
    return await _update_item("brands", brand_id, brand, BrandResponse)

@router.delete("/brands/{brand_id}", response_model=StandardResponse[dict])
async def delete_brand(brand_id: str):
    return await _delete_item("brands", brand_id)

# Contact Messages Endpoints
@router.get("/contact_messages", response_model=StandardResponse[List[ContactMessageResponse]])
async def get_contact_messages():
    return await _get_all_items("contact_messages", ContactMessage)

@router.get("/contact_messages/{message_id}", response_model=StandardResponse[ContactMessageResponse])
async def get_contact_message(message_id: str):
    return await _get_item_by_id("contact_messages", message_id, ContactMessage)

@router.post("/contact_messages", response_model=StandardResponse[ContactMessageResponse])
async def create_contact_message(message: ContactMessage):
    return await _create_item("contact_messages", message, ContactMessageResponse)

@router.delete("/contact_messages/{message_id}", response_model=StandardResponse[dict])
async def delete_contact_message(message_id: str):
    return await _delete_item("contact_messages", message_id)

# Domains Endpoints
@router.get("/domains", response_model=StandardResponse[List[DomainResponse]])
async def get_domains(tenant_id: Optional[str] = Query(None)):
    query = {"tenant_id": tenant_id} if tenant_id else {}
    return await _get_all_items("domains", Domain, query)

@router.get("/domains/{domain_id}", response_model=StandardResponse[DomainResponse])
async def get_domain(domain_id: str):
    return await _get_item_by_id("domains", domain_id, Domain)

@router.post("/domains", response_model=StandardResponse[DomainResponse])
async def create_domain(domain: Domain):
    return await _create_item("domains", domain, DomainResponse)

@router.put("/domains/{domain_id}", response_model=StandardResponse[DomainResponse])
async def update_domain(domain_id: str, domain: Domain):
    return await _update_item("domains", domain_id, domain, DomainResponse)

@router.delete("/domains/{domain_id}", response_model=StandardResponse[dict])
async def delete_domain(domain_id: str):
    return await _delete_item("domains", domain_id)

# Payments Endpoints
@router.get("/payments", response_model=StandardResponse[List[PaymentResponse]])
async def get_payments(order_id: Optional[str] = Query(None)):
    query = {"order_id": order_id} if order_id else {}
    return await _get_all_items("payments", Payment, query)

@router.get("/payments/{payment_id}", response_model=StandardResponse[PaymentResponse])
async def get_payment(payment_id: str):
    return await _get_item_by_id("payments", payment_id, Payment)

@router.post("/payments", response_model=StandardResponse[PaymentResponse])
async def create_payment(payment: Payment):
    return await _create_item("payments", payment, PaymentResponse)

@router.put("/payments/{payment_id}", response_model=StandardResponse[PaymentResponse])
async def update_payment(payment_id: str, payment: Payment):
    return await _update_item("payments", payment_id, payment, PaymentResponse)

@router.delete("/payments/{payment_id}", response_model=StandardResponse[dict])
async def delete_payment(payment_id: str):
    return await _delete_item("payments", payment_id)

# Payment Methods Endpoints
@router.get("/payment_methods", response_model=StandardResponse[List[PaymentMethodResponse]])
async def get_payment_methods(store_id: Optional[str] = Query(None)):
    query = {"store_id": store_id} if store_id else {}
    return await _get_all_items("payment_methods", PaymentMethod, query)

@router.get("/payment_methods/{method_id}", response_model=StandardResponse[PaymentMethodResponse])
async def get_payment_method(method_id: str):
    return await _get_item_by_id("payment_methods", method_id, PaymentMethod)

@router.post("/payment_methods", response_model=StandardResponse[PaymentMethodResponse])
async def create_payment_method(method: PaymentMethod):
    return await _create_item("payment_methods", method, PaymentMethodResponse)

@router.put("/payment_methods/{method_id}", response_model=StandardResponse[PaymentMethodResponse])
async def update_payment_method(method_id: str, method: PaymentMethod):
    return await _update_item("payment_methods", method_id, method, PaymentMethodResponse)

@router.delete("/payment_methods/{method_id}", response_model=StandardResponse[dict])
async def delete_payment_method(method_id: str):
    return await _delete_item("payment_methods", method_id)

# Sites Endpoints
@router.get("/sites", response_model=StandardResponse[List[SiteResponse]])
async def get_sites(store_id: Optional[str] = Query(None)):
    query = {"store_id": store_id} if store_id else {}
    return await _get_all_items("sites", Site, query)

@router.get("/sites/{site_id}", response_model=StandardResponse[SiteResponse])
async def get_site(site_id: str):
    return await _get_item_by_id("sites", site_id, Site)

@router.post("/sites", response_model=StandardResponse[SiteResponse])
async def create_site(site: Site):
    return await _create_item("sites", site, SiteResponse)

@router.put("/sites/{site_id}", response_model=StandardResponse[SiteResponse])
async def update_site(site_id: str, site: Site):
    return await _update_item("sites", site_id, site, SiteResponse)

@router.delete("/sites/{site_id}", response_model=StandardResponse[dict])
async def delete_site(site_id: str):
    return await _delete_item("sites", site_id)

# Taxes Endpoints
@router.get("/taxes", response_model=StandardResponse[List[TaxResponse]])
async def get_taxes(store_id: Optional[str] = Query(None)):
    query = {"store_id": store_id} if store_id else {}
    return await _get_all_items("taxes", Tax, query)

@router.get("/taxes/{tax_id}", response_model=StandardResponse[TaxResponse])
async def get_tax(tax_id: str):
    return await _get_item_by_id("taxes", tax_id, Tax)

@router.post("/taxes", response_model=StandardResponse[TaxResponse])
async def create_tax(tax: Tax):
    return await _create_item("taxes", tax, TaxResponse)

@router.put("/taxes/{tax_id}", response_model=StandardResponse[TaxResponse])
async def update_tax(tax_id: str, tax: Tax):
    return await _update_item("taxes", tax_id, tax, TaxResponse)

@router.delete("/taxes/{tax_id}", response_model=StandardResponse[dict])
async def delete_tax(tax_id: str):
    return await _delete_item("taxes", tax_id)

# Tenants Endpoints
@router.get("/tenants", response_model=StandardResponse[List[TenantResponse]])
async def get_tenants():
    return await _get_all_items("tenants", Tenant)

@router.get("/tenants/{tenant_id}", response_model=StandardResponse[TenantResponse])
async def get_tenant(tenant_id: str):
    return await _get_item_by_id("tenants", tenant_id, Tenant)

@router.post("/tenants", response_model=StandardResponse[TenantResponse])
async def create_tenant(tenant: Tenant):
    return await _create_item("tenants", tenant, TenantResponse)

@router.put("/tenants/{tenant_id}", response_model=StandardResponse[TenantResponse])
async def update_tenant(tenant_id: str, tenant: Tenant):
    return await _update_item("tenants", tenant_id, tenant, TenantResponse)

@router.delete("/tenants/{tenant_id}", response_model=StandardResponse[dict])
async def delete_tenant(tenant_id: str):
    return await _delete_item("tenants", tenant_id)

# ----------------------------------------------------
# --- Utility Endpoints (From Original File) ---
# ----------------------------------------------------

# Low stock items endpoint
@router.get("/inventory/low-stock", response_model=StandardResponse[List[InventoryProductResponse]])
async def get_low_stock_items():
    try:
        products_collection = get_collection("inventory_products")
        low_stock_items = []
        async for product in products_collection.find():
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
        async for po in po_collection.find({"status": {"$in": pending_statuses}}):
            pending_orders.append(PurchaseOrder.from_mongo(po))
        return success_response(data=pending_orders)
    except Exception as e:
        return handle_generic_exception(e)

# Order items endpoints (for individual order item operations)
@router.get("/order_items/{order_item_id}", response_model=StandardResponse[dict])
async def get_order_item(order_item_id: str):
    try:
        orders_collection = get_collection("orders")
        async for order in orders_collection.find():
            for item in order.get("items", []):
                if str(item.get("id")) == order_item_id:
                    return success_response(data=item)
        return error_response(message="Order item not found", code=404)
    except Exception as e:
        return handle_generic_exception(e)

# Store foods endpoints
@router.get("/store_foods", response_model=StandardResponse[List[dict]])
async def get_store_foods(store_id: Optional[str] = Query(None)):
    try:
        foods_collection = get_collection("foods")
        query = {"store_id": store_id} if store_id else {}
        store_foods = []
        async for food in foods_collection.find(query):
            store_foods.append({
                "food_id": str(food["_id"]),
                "store_id": food.get("store_id", ""),
                "is_available": food.get("is_available", True)
            })
        return success_response(data=store_foods)
    except Exception as e:
        return handle_generic_exception(e)

# Recipe items endpoints
@router.get("/recipes", response_model=StandardResponse[List[dict]])
async def get_recipes(food_id: Optional[str] = Query(None)):
    try:
        foods_collection = get_collection("foods")
        recipes = []
        async for food in foods_collection.find():
            if food.get("recipes"):
                for recipe in food["recipes"]:
                    if not food_id or str(food["_id"]) == food_id:
                        recipes.append({
                            **recipe,
                            "food_id": str(food["_id"]),
                            "id": recipe.get("id", str(food["_id"]) + "_" + recipe.get("inventory_product_id", ""))
                        })
        return success_response(data=recipes)
    except Exception as e:
        return handle_generic_exception(e)

# Health check endpoint for core module
@router.get("/health")
async def health_check():
    return success_response(data={"status": "healthy", "module": "core"})

# --------------------------
# --- Users Endpoints ---
# --------------------------
@router.get("/users", response_model=StandardResponse[List[UserResponse]])
async def get_users():
    """Retrieve all users (without passwords)."""
    try:
        users_collection = get_collection("users")
        users = []
        async for user in users_collection.find():
            # Convert to User model first
            user_model = User.from_mongo(user)
            
            # Convert to UserResponse with computed name
            user_dict = user_model.to_dict()
            user_dict.pop('password', None)  # Remove password
            
            # Compute name if not present
            if not user_dict.get('name'):
                if user_dict.get('first_name') and user_dict.get('last_name'):
                    user_dict['name'] = f"{user_dict['first_name']} {user_dict['last_name']}".strip()
                elif user_dict.get('first_name'):
                    user_dict['name'] = user_dict['first_name']
                elif user_dict.get('last_name'):
                    user_dict['name'] = user_dict['last_name']
                else:
                    user_dict['name'] = user_dict.get('username') or user_dict.get('email', '').split('@')[0]
            
            users.append(user_dict)
        
        return success_response(data=users)
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/users/{user_id}", response_model=StandardResponse[UserResponse])
async def get_user(user_id: str):
    """Retrieve a single user by ID (without password)."""
    try:
        users_collection = get_collection("users")
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            # Convert to User model first
            user_model = User.from_mongo(user)
            user_dict = user_model.to_dict()
            user_dict.pop('password', None)  # Remove password
            
            # Compute name if not present
            if not user_dict.get('name'):
                if user_dict.get('first_name') and user_dict.get('last_name'):
                    user_dict['name'] = f"{user_dict['first_name']} {user_dict['last_name']}".strip()
                elif user_dict.get('first_name'):
                    user_dict['name'] = user_dict['first_name']
                elif user_dict.get('last_name'):
                    user_dict['name'] = user_dict['last_name']
                else:
                    user_dict['name'] = user_dict.get('username') or user_dict.get('email', '').split('@')[0]
            
            return success_response(data=user_dict)
        return error_response(message="User not found", code=404)
    except Exception:
        return error_response(message="Invalid ID format for user", code=400)

@router.post("/users", response_model=StandardResponse[UserResponse])
async def create_user(user: User):
    """Create a new user."""
    try:
        users_collection = get_collection("users")
        user_dict = to_mongo_dict(user)
        
        result = await users_collection.insert_one(user_dict)
        new_user = await users_collection.find_one({"_id": result.inserted_id})
        
        # Remove password from response
        user_data = User.from_mongo(new_user)
        user_dict = user_data.to_dict()
        user_dict.pop("password", None)
        
        return success_response(
            data=user_dict,
            message="User created successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.put("/users/{user_id}", response_model=StandardResponse[UserResponse])
async def update_user(user_id: str, user: User):
    """Update an existing user."""
    try:
        users_collection = get_collection("users")
        user_dict = to_mongo_update_dict(user, exclude_unset=True)
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)}, {"$set": user_dict}
        )
        if result.modified_count == 0 and result.matched_count == 0:
            return error_response(message="User not found", code=404)
            
        updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        # Remove password from response
        user_data = User.from_mongo(updated_user)
        user_dict = user_data.to_dict()
        user_dict.pop("password", None)
        
        return success_response(
            data=user_dict,
            message="User updated successfully"
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.delete("/users/{user_id}", response_model=StandardResponse[dict])
async def delete_user(user_id: str):
    """Delete a user."""
    return await _delete_item("users", user_id)

# --------------------------
# --- Reports Endpoints ---
# --------------------------
@router.get("/reports", response_model=StandardResponse[List[ReportResponse]])
async def get_reports():
    return await _get_all_items("reports", Report)

@router.get("/reports/{report_id}", response_model=StandardResponse[ReportResponse])
async def get_report(report_id: str):
    return await _get_item_by_id("reports", report_id, Report)

@router.post("/reports", response_model=StandardResponse[ReportResponse])
async def create_report(report: Report):
    return await _create_item("reports", report, ReportResponse)

@router.delete("/reports/{report_id}", response_model=StandardResponse[dict])
async def delete_report(report_id: str):
    return await _delete_item("reports", report_id)

# --------------------------
# --- Password Resets Endpoints ---
# --------------------------
@router.get("/password_resets", response_model=StandardResponse[List[PasswordResetResponse]])
async def get_password_resets():
    return await _get_all_items("password_resets", PasswordReset)

@router.get("/password_resets/{reset_id}", response_model=StandardResponse[PasswordResetResponse])
async def get_password_reset(reset_id: str):
    return await _get_item_by_id("password_resets", reset_id, PasswordReset)

@router.post("/password_resets", response_model=StandardResponse[PasswordResetResponse])
async def create_password_reset(reset: PasswordReset):
    return await _create_item("password_resets", reset, PasswordResetResponse)

@router.delete("/password_resets/{reset_id}", response_model=StandardResponse[dict])
async def delete_password_reset(reset_id: str):
    return await _delete_item("password_resets", reset_id)

# --------------------------
# --- Jobs Endpoints ---
# --------------------------
@router.get("/jobs", response_model=StandardResponse[List[JobResponse]])
async def get_jobs():
    return await _get_all_items("jobs", Job)

@router.get("/jobs/{job_id}", response_model=StandardResponse[JobResponse])
async def get_job(job_id: str):
    return await _get_item_by_id("jobs", job_id, Job)

@router.post("/jobs", response_model=StandardResponse[JobResponse])
async def create_job(job: Job):
    return await _create_item("jobs", job, JobResponse)

@router.delete("/jobs/{job_id}", response_model=StandardResponse[dict])
async def delete_job(job_id: str):
    return await _delete_item("jobs", job_id)

# --------------------------
# --- Failed Jobs Endpoints ---
# --------------------------
@router.get("/failed_jobs", response_model=StandardResponse[List[FailedJobResponse]])
async def get_failed_jobs():
    return await _get_all_items("failed_jobs", FailedJob)

@router.get("/failed_jobs/{job_id}", response_model=StandardResponse[FailedJobResponse])
async def get_failed_job(job_id: str):
    return await _get_item_by_id("failed_jobs", job_id, FailedJob)

@router.post("/failed_jobs", response_model=StandardResponse[FailedJobResponse])
async def create_failed_job(job: FailedJob):
    return await _create_item("failed_jobs", job, FailedJobResponse)

@router.delete("/failed_jobs/{job_id}", response_model=StandardResponse[dict])
async def delete_failed_job(job_id: str):
    return await _delete_item("failed_jobs", job_id)