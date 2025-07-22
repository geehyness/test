// src/app/config/entities.ts
export interface EntityConfig {
  subMenus?: any; // Marked as optional as it's not consistently used
  label: string; // human-readable name
  fields: string[]; // exact column names in the table
  endpoint: string; // Added: The API endpoint for fetching data for this entity
}

// --- Core POS Entities ---

export interface Order {
  id: string;
  tenant_id: string;
  table_id: string | null; // Can be null for takeaway orders
  customer_id: string | null; // Can be null for walk-in customers
  total_amount: number;
  status: string; // e.g., 'new', 'preparing', 'ready', 'served', 'paid', 'cancelled'
  notes: string;
  created_at: string;
  updated_at: string;
  // Properties added for app logic/convenience, not directly from PDF 'orders' fields
  items: OrderItem[];
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  employee_id?: string; // Assuming employee who took the order
  order_type?: "dine-in" | "takeaway"; // Type of order
}

export interface OrderItem {
  id: string;
  order_id: string; // Links to Order.id
  food_id: string; // Links to Food.id (changed from menu_item_id to match PDF)
  quantity: number;
  price: number; // Price from sample data
  sub_total: number; // Changed from subtotal to match PDF
  notes?: string; // Optional notes for this specific item
  created_at: string;
  updated_at: string;
  // Properties added by API for convenience, not directly from PDF 'order_items' fields
  name: string; // Name of the food item (from Food entity)
  price_at_sale: number; // Price of the item when added to order (from Food entity)
}

export interface Food {
  // Renamed from MenuItem, now represents the 'Foods' entity from PDF
  id: string;
  name: string;
  category_id: string; // Links to Category.id (from PDF)
  brand_id: string; // (from PDF)
  unit_id: string; // (from PDF)
  purchase_price: number; // (from PDF)
  sale_price: number; // (from PDF)
  description: string; // (from PDF)
  image: string; // (from PDF)
  is_active: boolean; // (from PDF)
  is_featured: boolean; // (from PDF)
  created_at: string;
  updated_at: string;
  // Additional fields from your previous MenuItem/Food structure, keep if needed by app
  code?: string;
  hsn?: string;
  cost?: number;
  price_include_gst?: boolean;
  cost_include_gst?: boolean;
  gst_percentage?: number;
  kitchen_id?: string; // Assuming this links to a Kitchen entity
}

export interface MenuItem {
  category_id: string;
  name: any;
  description: any; // This now represents 'Menu Items' from PDF, linking Menu to Food
  id: string;
  menu_id: string; // Links to Menu.id
  food_id: string; // Links to Food.id
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  code: string; // Not in PDF for Category, but useful. Keep.
  image: string; // Not in PDF for Category, but useful. Keep.
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  area: string;
  tax_number: string;
  district: string;
  phone: string;
  points: number;
  no_points: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  capacity: number;
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
  // Added for app logic/convenience
  status?: "available" | "occupied" | "reserved" | "cleaning"; // This is what it uses
  current_order_id?: string | null;
}

// --- Other Entities from PDF ---

export interface Tenant {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional as it might not be fetched or stored directly
  remember_token?: string; // Optional
  created_at: string;
  updated_at: string;
  // Your previous fields not in PDF: phone, address. Keep if custom.
  phone?: string;
  address?: string;
}

export interface Domain {
  id: string;
  tenant_id: string; // Foreign key to Tenant
  domain: string;
  is_primary?: boolean; // Not in PDF, but often exists. Keep if custom.
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  queue: string;
  payload: string;
  attempts: number; // Changed to number based on common usage
  reserved_at?: string; // Optional timestamp
  available_at?: string; // Optional timestamp
  created_at: string;
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
  // Renamed from Employee, as PDF has 'Users' and 'Employees'
  id: string;
  name: string;
  email: string;
  email_verified_at?: string; // Optional
  password?: string; // Optional
  remember_token?: string; // Optional
  created_at: string;
  updated_at: string;
  // Your previous fields not in PDF: cashAccounts, cardAccounts, etc. Keep if custom.
  cashAccounts?: string;
  cardAccounts?: string;
  onlineAccounts?: string;
  gpayAccounts?: string;
  phonepeAccounts?: string;
  amazonpayAccounts?: string;
  locations?: string;
}

export interface UserStore {
  id: string;
  user_id: string; // Foreign key to User
  store_id: string; // Assuming Store entity exists
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  guard_name: string; // From PDF
  created_at: string;
  updated_at: string;
  description?: string; // Your previous field, keep if custom
}

export interface ModelHasRole {
  // From PDF: model_has_roles
  role_id: string; // Foreign key to Role
  model_type: string;
  model_id: string;
}

export interface ModelHasPermission {
  // From PDF: model_has_permissions
  permission_id: string; // Foreign key to Permission
  model_type: string;
  model_id: string;
}

export interface Permission {
  id: string;
  name: string;
  guard_name: string; // From PDF
  created_at: string;
  updated_at: string;
  description?: string; // Your previous field, keep if custom
}

export interface RoleHasPermission {
  // From PDF: role_has_permissions
  permission_id: string; // Foreign key to Permission
  role_id: string; // Foreign key to Role
}

export interface Language {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface LanguageTranslation {
  id: string;
  language_id: string; // Foreign key to Language
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  // From PDF: expense_categories
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  category_id: string; // Foreign key to ExpenseCategory (from PDF)
  amount: number;
  description: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string; // Your previous field, keep if custom
}

export interface Unit {
  // From PDF: units
  id: string;
  name: string;
  short_name: string;
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

export interface Purchase {
  id: string;
  supplier_id: string; // Foreign key to Supplier
  total_amount: number;
  purchase_date: string;
  status: string;
  notes: string; // From PDF
  created_at: string;
  updated_at: string;
  tenant_id?: string; // Your previous field, keep if custom
}

export interface PurchaseItem {
  id: string;
  purchase_id: string; // Foreign key to Purchase
  food_id: string; // Changed from product_id to food_id to match PDF
  quantity: number;
  price: number; // From PDF (was unit_price)
  sub_total: number; // From PDF (was subtotal)
  created_at: string;
  updated_at: string;
}

export interface Stock {
  // From PDF: stocks
  id: string;
  food_id: string; // Foreign key to Food
  quantity: number;
  unit_id: string; // Foreign key to Unit
  purchase_price: number;
  sale_price: number;
  created_at: string;
  updated_at: string;
}

export interface StoreTiming {
  // From PDF: store_timings
  id: string;
  store_id: string; // Assuming Store entity exists
  day_of_week: string;
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TablesSection {
  // From PDF: tables_sections
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  // From PDF: coupons
  id: string;
  code: string;
  type: string; // e.g., 'percentage' | 'fixed'
  value: number;
  min_order_amount: number;
  max_discount_amount: number;
  usage_limit: number; // From PDF
  expiry_date: string; // From PDF
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TableCoupon {
  // From PDF: table_coupons
  id: string;
  table_id: string; // Foreign key to Table
  coupon_id: string; // Foreign key to Coupon
  created_at: string;
  updated_at: string;
}

export interface ProductCoupon {
  // From PDF: product_coupons
  id: string;
  food_id: string; // Changed from product_id to food_id to match PDF
  coupon_id: string; // Foreign key to Coupon
  created_at: string;
  updated_at: string;
}

export interface CustomerCoupon {
  // From PDF: customer_coupons
  id: string;
  customer_id: string; // Foreign key to Customer
  coupon_id: string; // Foreign key to Coupon
  created_at: string;
  updated_at: string;
}

export interface Review {
  // From PDF: reviews
  id: string;
  customer_id: string; // Foreign key to Customer
  food_id: string; // Foreign key to Food
  rating: number;
  comment: string;
  review_date: string;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  // From PDF: faqs
  id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  order_id: string; // Foreign key to Order
  invoice_number: string;
  total_amount: number; // From PDF
  invoice_date: string;
  status: string; // From PDF
  created_at: string;
  updated_at: string;
  // Your previous fields not in PDF: tax_amount, discount_amount, customer_id. Keep if custom.
  tax_amount?: number;
  discount_amount?: number;
  customer_id?: string;
}

export interface InvoiceItem {
  // From PDF: invoice_items
  id: string;
  invoice_id: string; // Foreign key to Invoice
  food_id: string; // Changed from product_id to food_id to match PDF
  quantity: number;
  price: number;
  sub_total: number; // From PDF (was subtotal)
  created_at: string;
  updated_at: string;
}

export interface Payroll {
  // From PDF: payrolls
  id: string;
  employee_id: string; // Foreign key to Employee
  month: string;
  year: number; // Changed to number
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_date: string;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Administrator {
  // From PDF: administrators
  id: string;
  user_id: string; // Foreign key to User
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  // From PDF: announcements
  id: string;
  title: string;
  content: string;
  published_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  // From PDF: settings
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  // From PDF: carts
  id: string;
  customer_id: string; // Foreign key to Customer
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  // From PDF: cart_items
  id: string;
  cart_id: string; // Foreign key to Cart
  food_id: string; // Foreign key to Food
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPersonnel {
  // From PDF: delivery_personnels
  id: string;
  name: string;
  phone: string;
  vehicle_details: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  // From PDF: wallets
  id: string;
  customer_id: string; // Foreign key to Customer
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemption {
  // From PDF: coupon_redemptions
  id: string;
  coupon_id: string; // Foreign key to Coupon
  customer_id: string; // Foreign key to Customer
  order_id: string; // Foreign key to Order
  redemption_date: string;
  discount_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CashFlow {
  // From PDF: cash_flows
  id: string;
  source_type: string;
  source_id: string;
  amount: number;
  type: string;
  description: string;
  flow_date: string;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  // From PDF: refunds
  id: string;
  order_id: string;
  amount: number;
  reason: string;
  refund_date: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string; // From PDF
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface PasswordChange {
  // From PDF: password_changes
  id: string;
  user_id: string; // Foreign key to User
  changed_at: string;
}

export interface StockMovement {
  // From PDF: stocks_movements
  id: string;
  stock_id: string; // Foreign key to Stock
  type: string; // e.g., 'in', 'out'
  quantity: number;
  movement_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  // From PDF: contact_messages
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  updated_at: string;
}

// --- Added Entities (not explicitly in PDF, but commonly needed) ---

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  tenant_id: string; // Links to Tenant
  created_at: string;
  updated_at: string;
}

export interface Employee {
  // A more specific employee entity, if needed
  id: string;
  user_id: string; // Links to User
  job_title: string;
  hire_date: string;
  salary: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface Kitchen {
  id: string;
  name: string;
  location: string;
  created_at: string;
  updated_at: string;
}

// --- Configuration for each entity ---
export const entities: Record<string, EntityConfig> = {
  tenants: {
    label: "Tenants",
    endpoint: "/api/tenants",
    fields: [
      "id",
      "name",
      "email",
      "password",
      "remember_token",
      "created_at",
      "updated_at",
      "phone",
      "address",
    ],
  },
  domains: {
    label: "Domains",
    endpoint: "/api/domains",
    fields: [
      "id",
      "tenant_id",
      "domain",
      "is_primary",
      "created_at",
      "updated_at",
    ],
  },
  jobs: {
    label: "Jobs",
    endpoint: "/api/jobs",
    fields: [
      "id",
      "queue",
      "payload",
      "attempts",
      "reserved_at",
      "available_at",
      "created_at",
    ],
  },
  failed_jobs: {
    label: "Failed Jobs",
    endpoint: "/api/failed_jobs",
    fields: [
      "id",
      "uuid",
      "connection",
      "queue",
      "payload",
      "exception",
      "failed_at",
    ],
  },
  password_resets: {
    label: "Password Resets",
    endpoint: "/api/password_resets",
    fields: ["email", "token", "created_at"],
  },
  users: {
    // Renamed from employees
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
  user_stores: {
    label: "User Stores",
    endpoint: "/api/user_stores",
    fields: ["id", "user_id", "store_id", "created_at", "updated_at"],
  },
  roles: {
    label: "Roles",
    endpoint: "/api/roles",
    fields: [
      "id",
      "name",
      "guard_name",
      "created_at",
      "updated_at",
      "description",
    ],
  },
  model_has_roles: {
    label: "Model Has Roles",
    endpoint: "/api/model_has_roles",
    fields: ["role_id", "model_type", "model_id"],
  },
  model_has_permissions: {
    label: "Model Has Permissions",
    endpoint: "/api/model_has_permissions",
    fields: ["permission_id", "model_type", "model_id"],
  },
  permissions: {
    label: "Permissions",
    endpoint: "/api/permissions",
    fields: [
      "id",
      "name",
      "guard_name",
      "created_at",
      "updated_at",
      "description",
    ],
  },
  role_has_permissions: {
    label: "Role Has Permissions",
    endpoint: "/api/role_has_permissions",
    fields: ["permission_id", "role_id"],
  },
  languages: {
    label: "Languages",
    endpoint: "/api/languages",
    fields: ["id", "name", "code", "created_at", "updated_at"],
  },
  language_translations: {
    label: "Language Translations",
    endpoint: "/api/language_translations",
    fields: ["id", "language_id", "key", "value", "created_at", "updated_at"],
  },
  customers: {
    label: "Customers",
    endpoint: "/api/customers",
    fields: [
      "id",
      "name",
      "address",
      "area",
      "tax_number",
      "district",
      "phone",
      "points",
      "no_points",
      "created_at",
      "updated_at",
    ],
  },
  foods: {
    // Renamed from MenuItem
    label: "Foods",
    endpoint: "/api/foods",
    fields: [
      "id",
      "name",
      "category_id",
      "brand_id",
      "unit_id",
      "purchase_price",
      "sale_price",
      "description",
      "image",
      "is_active",
      "is_featured",
      "created_at",
      "updated_at",
      "code",
      "hsn",
      "cost",
      "price",
      "price_include_gst",
      "cost_include_gst",
      "gst_percentage",
      "kitchen_id",
    ],
  },
  tables: {
    label: "Tables",
    endpoint: "/api/tables",
    fields: [
      "id",
      "name",
      "code",
      "created_at",
      "updated_at",
      "status",
      "current_order_id",
    ],
  },
  orders: {
    label: "Orders",
    endpoint: "/api/orders",
    fields: [
      "id",
      "tenant_id",
      "table_id",
      "customer_id",
      "total_amount",
      "status",
      "notes",
      "created_at",
      "updated_at",
      "employee_id",
      "order_type",
      "subtotal_amount",
      "tax_amount",
      "discount_amount",
    ],
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
  payments: {
    label: "Payments",
    endpoint: "/api/payments",
    fields: [
      "id",
      "order_id",
      "payment_method",
      "amount",
      "transaction_id",
      "created_at",
      "updated_at",
      "payment_date",
      "status",
    ],
  },
  expense_categories: {
    label: "Expense Categories",
    endpoint: "/api/expense_categories",
    fields: ["id", "name", "description", "created_at", "updated_at"],
  },
  expenses: {
    label: "Expenses",
    endpoint: "/api/expenses",
    fields: [
      "id",
      "category_id",
      "amount",
      "description",
      "expense_date",
      "created_at",
      "updated_at",
      "tenant_id",
    ],
  },
  units: {
    label: "Units",
    endpoint: "/api/units",
    fields: ["id", "name", "short_name", "created_at", "updated_at"],
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
  purchases: {
    label: "Purchases",
    endpoint: "/api/purchases",
    fields: [
      "id",
      "supplier_id",
      "total_amount",
      "purchase_date",
      "status",
      "notes",
      "created_at",
      "updated_at",
      "tenant_id",
    ],
  },
  purchase_items: {
    label: "Purchase Items",
    endpoint: "/api/purchase_items",
    fields: [
      "id",
      "purchase_id",
      "food_id",
      "quantity",
      "price",
      "sub_total",
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
      "purchase_price",
      "sale_price",
      "created_at",
      "updated_at",
    ],
  },
  store_timings: {
    label: "Store Timings",
    endpoint: "/api/store_timings",
    fields: [
      "id",
      "store_id",
      "day_of_week",
      "opening_time",
      "closing_time",
      "is_closed",
      "created_at",
      "updated_at",
    ],
  },
  tables_sections: {
    label: "Tables Sections",
    endpoint: "/api/tables_sections",
    fields: ["id", "name", "description", "created_at", "updated_at"],
  },
  coupons: {
    label: "Coupons",
    endpoint: "/api/coupons",
    fields: [
      "id",
      "code",
      "type",
      "value",
      "min_order_amount",
      "max_discount_amount",
      "usage_limit",
      "expiry_date",
      "is_active",
      "created_at",
      "updated_at",
    ],
  },
  table_coupons: {
    label: "Table Coupons",
    endpoint: "/api/table_coupons",
    fields: ["id", "table_id", "coupon_id", "created_at", "updated_at"],
  },
  product_coupons: {
    label: "Product Coupons",
    endpoint: "/api/product_coupons",
    fields: ["id", "food_id", "coupon_id", "created_at", "updated_at"],
  },
  customer_coupons: {
    label: "Customer Coupons",
    endpoint: "/api/customer_coupons",
    fields: ["id", "customer_id", "coupon_id", "created_at", "updated_at"],
  },
  reviews: {
    label: "Reviews",
    endpoint: "/api/reviews",
    fields: [
      "id",
      "customer_id",
      "food_id",
      "rating",
      "comment",
      "review_date",
      "created_at",
      "updated_at",
    ],
  },
  faqs: {
    label: "FAQs",
    endpoint: "/api/faqs",
    fields: ["id", "question", "answer", "created_at", "updated_at"],
  },
  invoices: {
    label: "Invoices",
    endpoint: "/api/invoices",
    fields: [
      "id",
      "order_id",
      "invoice_number",
      "total_amount",
      "invoice_date",
      "status",
      "created_at",
      "updated_at",
      "tax_amount",
      "discount_amount",
      "customer_id",
    ],
  },
  invoice_items: {
    label: "Invoice Items",
    endpoint: "/api/invoice_items",
    fields: [
      "id",
      "invoice_id",
      "food_id",
      "quantity",
      "price",
      "sub_total",
      "created_at",
      "updated_at",
    ],
  },
  payrolls: {
    label: "Payrolls",
    endpoint: "/api/payrolls",
    fields: [
      "id",
      "employee_id",
      "month",
      "year",
      "basic_salary",
      "allowances",
      "deductions",
      "net_salary",
      "payment_date",
      "created_at",
      "updated_at",
    ],
  },
  menus: {
    label: "Menus",
    endpoint: "/api/menus",
    fields: [
      "id",
      "name",
      "description",
      "is_active",
      "created_at",
      "updated_at",
    ],
  },
  menu_items: {
    // This is the linking table between Menu and Food
    label: "Menu Items",
    endpoint: "/api/menu_items",
    fields: [
      "id",
      "menu_id",
      "food_id",
      "position",
      "created_at",
      "updated_at",
    ],
  },
  administrators: {
    label: "Administrators",
    endpoint: "/api/administrators",
    fields: ["id", "user_id", "role", "created_at", "updated_at"],
  },
  announcements: {
    label: "Announcements",
    endpoint: "/api/announcements",
    fields: [
      "id",
      "title",
      "content",
      "published_at",
      "expires_at",
      "created_at",
      "updated_at",
    ],
  },
  settings: {
    label: "Settings",
    endpoint: "/api/settings",
    fields: ["id", "key", "value", "created_at", "updated_at"],
  },
  carts: {
    label: "Carts",
    endpoint: "/api/carts",
    fields: ["id", "customer_id", "created_at", "updated_at"],
  },
  cart_items: {
    label: "Cart Items",
    endpoint: "/api/cart_items",
    fields: [
      "id",
      "cart_id",
      "food_id",
      "quantity",
      "price",
      "created_at",
      "updated_at",
    ],
  },
  delivery_personnels: {
    label: "Delivery Personnel",
    endpoint: "/api/delivery_personnels",
    fields: [
      "id",
      "name",
      "phone",
      "vehicle_details",
      "is_available",
      "created_at",
      "updated_at",
    ],
  },
  wallets: {
    label: "Wallets",
    endpoint: "/api/wallets",
    fields: ["id", "customer_id", "balance", "created_at", "updated_at"],
  },
  coupon_redemptions: {
    label: "Coupon Redemptions",
    endpoint: "/api/coupon_redemptions",
    fields: [
      "id",
      "coupon_id",
      "customer_id",
      "order_id",
      "redemption_date",
      "discount_amount",
      "created_at",
      "updated_at",
    ],
  },
  cash_flows: {
    label: "Cash Flows",
    endpoint: "/api/cash_flows",
    fields: [
      "id",
      "source_type",
      "source_id",
      "amount",
      "type",
      "description",
      "flow_date",
      "created_at",
      "updated_at",
    ],
  },
  refunds: {
    label: "Refunds",
    endpoint: "/api/refunds",
    fields: [
      "id",
      "order_id",
      "amount",
      "reason",
      "refund_date",
      "created_at",
      "updated_at",
    ],
  },
  notifications: {
    label: "Notifications",
    endpoint: "/api/notifications",
    fields: [
      "id",
      "user_id",
      "title",
      "message",
      "type",
      "is_read",
      "created_at",
      "updated_at",
    ],
  },
  password_changes: {
    label: "Password Changes",
    endpoint: "/api/password_changes",
    fields: ["id", "user_id", "changed_at"],
  },
  stocks_movements: {
    label: "Stocks Movements",
    endpoint: "/api/stocks_movements",
    fields: [
      "id",
      "stock_id",
      "type",
      "quantity",
      "movement_date",
      "notes",
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
  // Added entities
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
  employees: {
    label: "Employees",
    endpoint: "/api/employees",
    fields: [
      "id",
      "user_id",
      "job_title",
      "hire_date",
      "salary",
      "created_at",
      "updated_at",
    ],
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
    fields: ["id", "name", "description", "image", "created_at", "updated_at"],
  },
  kitchens: {
    label: "Kitchens",
    endpoint: "/api/kitchens",
    fields: ["id", "name", "location", "created_at", "updated_at"],
  },
};
