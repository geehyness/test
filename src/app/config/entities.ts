// src/app/config/entities.ts

import { ReactNode } from "react";

export interface EntityConfig {
  subMenus?: any; // Marked as optional as it's not consistently used
  label: string; // human-readable name
  fields: string[]; // exact column names in the table
  endpoint: string; // Added: The API endpoint for fetching data for this entity
}

// --- Core POS Entities ---

// Updated Food Interface to include recipes
export interface Food {
  id: string;
  name: string;
  description: string;
  price: number; // Sale price
  category_id: string; // Linking to Category.id
  image_url?: string; // Optional URL for an image of the item
  preparation_time?: number; // Added: Estimated time to prepare in minutes
  allergens?: string[]; // Added: List of common allergens (e.g., ["Gluten", "Dairy", "Nuts"])
  created_at?: string; // Added for consistency
  updated_at?: string; // Added for consistency
  tenant_id: string; // Modified: To link the food item to a specific tenant
  recipes?: RecipeItem[]; // NEW: The list of raw materials and quantities required to make this food item
}

// NEW: StoreFood Interface
export interface StoreFood {
  food_id: string; // Links to Food.id
  store_id: string; // Links to Store.id
  is_available: boolean; // Indicates if the food item is currently available at this store
}

// NEW: RecipeItem Interface for linking food items to inventory products
export interface RecipeItem {
  id: string; // A unique ID for the recipe item
  food_id: string; // Links to Food.id
  inventory_product_id: string; // Links to InventoryProduct.id
  quantity_used: number; // How much of the raw material is used
  unit_of_measure: string; // e.g., "grams", "ml", "unit"
  created_at?: string; // Added for consistency
  updated_at?: string; // Added for consistency
}
// Order interface (adding payment details)
export interface Order {
  id: string;
  store_id?: string; // Corrected: Use store_id instead of tenant_id
  table_id: string | null; // Can be null for takeaway orders
  customer_id: string | null; // Can be null for walk-in customers
  total_amount: number;
  status: string; // e.g., 'new', 'preparing', 'ready', 'served', 'paid', 'cancelled'
  notes: string;
  created_at: string;
  updated_at: string;
  // Properties added for app logic/convenience
  items: OrderItem[];
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  employee_id?: string; // Assuming employee who took the order
  order_type?: "dine-in" | "takeaway"; // Type of order
  payment_status?: string; // Added: e.g., 'pending', 'paid', 'refunded'
  payment_method?: string; // Added: e.g., 'cash', 'card', 'mobile_pay'
}

// OrderItem interface remains the same
export interface OrderItem {
  id: string;
  order_id: string;
  food_id: string; // Links to Food.id
  quantity: number;
  price: number;
  sub_total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  name: string; // Name of the food item (from Food entity)
  price_at_sale: number; // Price of the item when added to order (from Food entity)
}

// Category interface remains the same, adjusted fields for simplicity
export interface Category {
  id: string;
  name: string;
  description?: string; // Added description for consistency
  created_at?: string; // Added for consistency
  updated_at?: string; // Added for consistency
}
// Category interface remains the same, adjusted fields for simplicity
export interface invCategory {
  id: string;
  name: string;
  description?: string; // Added description for consistency
  created_at?: string; // Added for consistency
  updated_at?: string; // Added for consistency
}

// Updated Customer Interface
export interface Customer {
  id: string;
  first_name: string; // Changed from 'name'
  last_name?: string; // Added, optional
  email?: string; // Added, optional
  phone_number?: string; // Added, optional, renamed from 'phone'
  loyalty_points?: number; // Added: e.g., for a loyalty program, renamed from 'points'
  created_at?: string;
  updated_at?: string;
  store_id: string; // Added: To link the customer to a specific store
}

// Updated Table Interface
export interface Table {
  id: string;
  name: string; // User-friendly name, e.g., "Table 1"
  capacity: number; // Max number of guests
  location: string; // Added: e.g., "Indoor", "Outdoor", "Bar Area", replaces 'code'
  status: string; // e.g., 'available', 'occupied', 'reserved', 'needs_cleaning'
  current_order_id?: string | null; // ID of the order currently assigned to this table
  created_at?: string; // Added for consistency
  updated_at?: string; // Added for consistency
  store_id: string; // Added: To link the table to a specific store
}

export interface AccessRole {
  id: string;
  name: string; // e.g., "Cashier", "Server", "Kitchen Staff", "Manager"
  description: string;
  permissions: string[]; // An array of strings representing permissions (e.g., "can_process_payments", "can_view_kitchen_orders")
  landing_page: string; // e.g., "/pos/dashboard/cashier", "/pos/dashboard/server"
  created_at?: string;
  updated_at?: string;
}

// Updated Employee Interface
export interface Employee {
  id: string;
  user_id: string;
  job_title_id: string;
  access_role_ids: string[];
  tenant_id: string;
  store_id: string; // Corrected: Use store_id instead of 
  main_access_role_id: string;
  hire_date: string;
  salary: number;
  first_name: string;
  last_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}


// New Reservation Interface
export interface Reservation {
  id: string;
  customer_id: string; // Links to Customer.id
  table_id: string | null; // Can be null if for general seating or takeaway
  date_time: string; // ISO string for reservation time
  number_of_guests: number;
  status: string; // e.g., 'confirmed', 'pending', 'cancelled', 'seated', 'no-show'
  notes?: string;
  created_at?: string;
  updated_at?: string;
  store_id: string; // Added: To link the reservation to a specific store
}

// --- Other Entities (Retained from previous file, adjusted if needed for clarity/consistency) ---

export interface Tenant {
  id: string;
  name: string;
  email: string;
  password?: string;
  remember_token?: string;
  created_at: string;
  updated_at: string;
  phone?: string;
  address?: string;
}

export interface Domain {
  id: string;
  tenant_id: string;
  domain: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  queue: string;
  payload: string;
  attempts: number;
  reserved_at: number | null;
  available_at: number;
  created_at: number;
}

export interface FailedJob {
  id: string;
  uuid: string;
  connection: string;
  queue: string;
  payload: string;
  exception: string;
  failed_at: string;
}

export interface PasswordReset {
  email: string;
  token: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  password: string;
  remember_token: string | null;
  created_at: string;
  updated_at: string;
  cashAccounts?: any[];
  cardAccounts?: any[];
  onlineAccounts?: any[];
  gpayAccounts?: any[];
  phonepeAccounts?: any[];
  amazonpayAccounts?: any[];
  locations?: any[];
}

export interface Payment {
  id: string;
  order_id: string;
  payment_method_id: string;
  amount: number;
  payment_date: string;
  transaction_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: string;
  food_id: string; // Changed from product_id to food_id
  quantity: number;
  unit_id: string;
  supplier_id: string;
  last_restock_date: string;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockAdjustment {
  id: string;
  stock_id: string;
  quantity_change: number;
  reason: string;
  adjustment_date: string;
  created_at: string;
  updated_at: string;
}

export interface Tax {
  id: string;
  name: string;
  percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface JobTitle { // Retained as JobTitle might be used elsewhere for specific job roles, distinct from `Role`
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string; // Added for consistency
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  updated_at: string;
}

// New: Report entity for tracking unauthorized access attempts
export interface Report {
  id: string; // Unique ID for the report entry
  user_id: string; // ID of the user who attempted access
  user_name: string; // Name of the user (for easier reporting)
  user_role: string; // Role of the user at the time of attempt
  attempted_path: string; // The URL path they tried to access
  attempts: number; // Number of times this specific user/role/path combination was attempted
  last_attempt_at: string; // Timestamp of the last attempt
  created_at: string; // Timestamp of the first attempt
}

// NEW: InventoryProduct Interface
export interface InventoryProduct {
  id: string;
  name: string;
  description?: string;
  sku: string; // Stock Keeping Unit - unique identifier for inventory
  unit_of_measure: string; // e.g., "kg", "grams", "liter", "unit", "bottle"
  tenant_id: string;
  unit_cost: number; // Cost to acquire one unit
  quantity_in_stock: number;
  reorder_level: number; // Minimum stock level before reordering
  supplier_id?: string; // Optional: Link to a Supplier entity if you have one
  inv_category_id?: string;
  location_in_warehouse?: string; // e.g., "Aisle 3, Shelf 2"
  last_restocked_at?: string;
  created_at?: string;
  updated_at?: string;
}
export interface Unit {
  id: string;
  name: string;
  symbol: string;
  created_at: string;
  updated_at: string;
}

export const entities: { [key: string]: EntityConfig } = {
  // Core POS Entities
  inventory_products: {
    label: "Inventory Products", // Corrected Label
    endpoint: "/api/inventory_products", // Corrected Endpoint    
    fields: [
      "id",
      "name",
      "description",
      "sku",
      "unit_of_measure",
      "unit_cost",
      "quantity_in_stock",
      "reorder_level",
      "supplier_id",
      "inv_category_id",
      "location_in_warehouse",
      "last_restock_at",
      "created_at",
      "updated_at",
      "store_id", // Added store_id field
    ]
  },
  orders: {
    label: "Orders",
    endpoint: "/api/orders",
    fields: [
      "id",
      "store_id", // Corrected
      "table_id",
      "customer_id",
      "total_amount",
      "status",
      "notes",
      "created_at",
      "updated_at",
      "items",
      "subtotal_amount",
      "tax_amount",
      "discount_amount",
      "employee_id",
      "order_type",
      "payment_status",
      "payment_method",
    ],
  },
  reports: {
    label: "Reports",
    endpoint: "/api/order_items",
    fields: [
      "id",
      "user_id",
      "user_name",
      "user_role",
      "attempted_path",
      "attempts",
      "last_attempt_at",
      "created_at"
    ]
  },
  order_items: {
    label: "Order Items",
    endpoint: "/api/order_items",
    fields: [
      "id",
      "order_id",
      "food_id",
      "quantity",
      "price",
      "sub_total",
      "notes",
      "created_at",
      "updated_at",
      "name",
      "price_at_sale",
    ],
  },
  foods: { // Renamed from menu_items to foods
    label: "Foods", // Renamed from Menu Items
    endpoint: "/api/foods", // Renamed from /api/menu_items
    fields: [
      "id",
      "name",
      "description",
      "price",
      "category_id",
      "is_available",
      "image_url",
      "preparation_time",
      "allergens",
      "created_at",
      "updated_at",
      "tenant_id",
      "recipes" // NEW: Added recipes field
    ],
  },
  store_foods: { // Renamed from menu_items to foods
    label: "Store Foods", // Renamed from Menu Items
    endpoint: "/api/store_foods", // Renamed from /api/menu_items
    fields: [
      "food_id",
      "store_id",
      "is_available",
    ],
  },
  recipes: { // NEW: Added recipes entity
    label: "Recipes",
    endpoint: "/api/recipes",
    fields: ["id", "food_id", "inventory_product_id", "quantity_used", "unit_of_measure", "created_at", "updated_at"],
  },
  categories: {
    label: "Categories",
    endpoint: "/api/categories",
    fields: ["id", "name", "description", "created_at", "updated_at", "store_id"], // Added store_id field
  },
  inv_categories: {
    label: "Inv. Categories",
    endpoint: "/api/inv_categories",
    fields: ["id", "name", "description", "created_at", "updated_at", "store_id"], // Added store_id field
  },
  customers: {
    label: "Customers",
    endpoint: "/api/customers",
    fields: [
      "id",
      "first_name",
      "last_name",
      "email",
      "phone_number",
      "loyalty_points",
      "created_at",
      "updated_at",
      "store_id", // Added store_id field
    ],
  },
  tables: {
    label: "Tables",
    endpoint: "/api/tables",
    fields: [
      "id",
      "name",
      "capacity",
      "location",
      "status",
      "current_order_id",
      "created_at",
      "updated_at",
      "store_id", // Added store_id field
    ],
  },
  employees: { // Updated employees config
    label: "Employees",
    endpoint: "/api/employees",
    fields: [
      "id",
      "user_id",
      "job_title_id",
      "access_role_ids", // Added for access control
      "main_access_role_id", // Added for determining landing page
      "hire_date",
      "salary",
      "name",
      "store_id", // Corrected
      "avatar_url",
      "created_at",
      "updated_at",
    ],
  },
  access_roles: { // New entity config for access roles
    label: "Access Roles",
    endpoint: "/api/access_roles",
    fields: ["id", "name", "description", "permissions", "landing_page", "created_at", "updated_at"],
  },
  reservations: {
    label: "Reservations",
    endpoint: "/api/reservations",
    fields: [
      "id",
      "customer_id",
      "table_id",
      "date_time",
      "number_of_guests",
      "status",
      "notes",
      "created_at",
      "updated_at",
      "store_id", // Added store_id field
    ],
  },

  // Other Entities
  tenants: {
    label: "Tenants",
    endpoint: "/api/tenants",
    fields: [
      "id",
      "name",
      "email",
      "password",
      "remember_token",
      "phone",
      "address",
      "created_at",
      "updated_at",
    ],
  },
  domains: {
    label: "Domains",
    endpoint: "/api/domains",
    fields: ["id", "tenant_id", "domain", "is_primary", "created_at", "updated_at"],
  },
  jobs: {
    label: "Jobs",
    endpoint: "/api/jobs",
    fields: ["id", "queue", "payload", "attempts", "reserved_at", "available_at", "created_at"],
  },
  failed_jobs: {
    label: "Failed Jobs",
    endpoint: "/api/failed_jobs",
    fields: ["id", "uuid", "connection", "queue", "payload", "exception", "failed_at"],
  },
  password_resets: {
    label: "Password Resets",
    endpoint: "/api/password_resets",
    fields: ["email", "token", "created_at"],
  },
  users: {
    label: "Users",
    endpoint: "/api/users",
    fields: [
      "id",
      "name",
      "email",
      "email_verified_at",
      "password",
      "remember_token",
      "created_at",
      "updated_at",
      "cashAccounts",
      "cardAccounts",
      "onlineAccounts",
      "gpayAccounts",
      "phonepeAccounts",
      "amazonpayAccounts",
      "locations",
    ],
  },
  payments: {
    label: "Payments",
    endpoint: "/api/payments",
    fields: [
      "id",
      "order_id",
      "payment_method_id",
      "amount",
      "payment_date",
      "transaction_id",
      "status",
      "created_at",
      "updated_at",
    ],
  },
  stocks: {
    label: "Stocks",
    endpoint: "/api/stocks",
    fields: [
      "id",
      "food_id",
      "quantity",
      "unit_id",
      "supplier_id",
      "last_restock_date",
      "expiration_date",
      "created_at",
      "updated_at",
    ],
  },
  recipe_items: {
    label: "Recipe Items",
    endpoint: "/api/recipe_items",
    fields: [
      "id",
      "food_id",
      "inventory_product_id",
      "quantity_used",
      "unit_of_measure",
      "created_at",
      "updated_at"
    ]
  },
  stock_adjustments: {
    label: "Stock Adjustments",
    endpoint: "/api/stock_adjustments",
    fields: [
      "id",
      "stock_id",
      "quantity_change",
      "reason",
      "adjustment_date",
      "created_at",
      "updated_at",
    ],
  },
  taxes: {
    label: "Taxes",
    endpoint: "/api/taxes",
    fields: ["id", "name", "percentage", "is_active", "created_at", "updated_at"],
  },
  stores: {
    label: "Stores",
    endpoint: "/api/stores",
    fields: [
      "id",
      "name",
      "address",
      "phone",
      "email",
      "tenant_id",
      "created_at",
      "updated_at",
    ],
  },
  job_titles: { // Kept JobTitle for compatibility, even if Role is now primary for employees
    label: "Job Titles",
    endpoint: "/api/job_titles",
    fields: ["id", "title", "description", "created_at", "updated_at"],
  },
  payment_methods: {
    label: "Payment Methods",
    endpoint: "/api/payment_methods",
    fields: [
      "id",
      "name",
      "description",
      "is_active",
      "created_at",
      "updated_at",
    ],
  },
  brands: {
    label: "Brands",
    endpoint: "/api/brands",
    fields: ["id", "name", "description", "created_at", "updated_at"],
  },
  suppliers: {
    label: "Suppliers",
    endpoint: "/api/suppliers",
    fields: [
      "id",
      "name",
      "contact_person",
      "phone",
      "email",
      "address",
      "created_at",
      "updated_at",
    ],
  },
  contact_messages: {
    label: "Contact Messages",
    endpoint: "/api/contact_messages",
    fields: [
      "id",
      "name",
      "email",
      "subject",
      "message",
      "created_at",
      "updated_at",
    ],


  },
  units: {
    label: "Units",
    endpoint: "/api/units",
    fields: ["id", "name", "symbol", "created_at", "updated_at"],
    subMenus: [
      {
        label: "Common Units",
        items: [
          // Volume
          { id: "milliliter", name: "Milliliter", symbol: "ml" },
          { id: "liter", name: "Liter", symbol: "L" },
          { id: "ounce_fl", name: "Fluid Ounce", symbol: "fl oz" },
          { id: "cup", name: "Cup", symbol: "cup" },
          { id: "pint", name: "Pint", symbol: "pt" },
          { id: "quart", name: "Quart", symbol: "qt" },
          { id: "gallon", name: "Gallon", symbol: "gal" },
          { id: "teaspoon", name: "Teaspoon", symbol: "tsp" },
          { id: "tablespoon", name: "Tablespoon", symbol: "tbsp" },
          // Weight/Mass
          { id: "gram", name: "Gram", symbol: "g" },
          { id: "kilogram", name: "Kilogram", symbol: "kg" },
          { id: "milligram", name: "Milligram", symbol: "mg" },
          { id: "ounce_wt", name: "Ounce", symbol: "oz" },
          { id: "pound", name: "Pound", symbol: "lb" },
          // Count/Other
          { id: "unit", name: "Unit", symbol: "unit" },
          { id: "each", name: "Each", symbol: "ea" },
          { id: "can", name: "Can", symbol: "can" },
          { id: "bottle", name: "Bottle", symbol: "bottle" },
          { id: "box", name: "Box", symbol: "box" },
          { id: "bag", name: "Bag", symbol: "bag" },
          { id: "case", name: "Case", symbol: "case" },
        ],
      },
    ],
  }
};