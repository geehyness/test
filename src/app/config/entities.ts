export interface EntityConfig {
  label: string; // human-readable name
  fields: string[]; // exact column names in the table
}

// Define the missing interfaces based on your 'entities' object
export interface Order {
  id: string;
  tenant_id: string;
  table_id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  food_id: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  image: string;
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
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

// You might also want to define interfaces for other commonly used entities
// For example:
export interface Food {
  id: string;
  name: string;
  code: string;
  hsn: string;
  cost: number;
  price: number;
  price_include_gst: boolean;
  image: string;
  cost_include_gst: boolean;
  sale_price: number;
  gst_percentage: number;
  food_category_id: string;
  food_brand_id: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  kitchen_id: string;
}

export const entities: Record<string, EntityConfig> = {
  tenants: {
    label: "Tenants",
    fields: [
      "id",
      "name",
      "email",
      "password",
      "remember_token",
      "created_at",
      "updated_at",
    ],
  },
  domains: {
    label: "Domains",
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
    fields: ["email", "token", "created_at"],
  },
  users: {
    label: "Users",
    fields: [
      "id",
      "name",
      "email",
      "email_verified_at",
      "password",
      "remember_token",
      "cashAccounts",
      "cardAccounts",
      "onlineAccounts",
      "gpayAccounts",
      "phonepeAccounts",
      "amazonpayAccounts",
      "locations",
      "created_at",
      "updated_at",
    ],
  },
  user_stores: {
    label: "User Stores",
    fields: ["id", "user_id", "store_id", "created_at", "updated_at"],
  },
  roles: {
    label: "Roles",
    fields: ["id", "name", "guard_name", "created_at", "updated_at"],
  },
  model_has_roles: {
    label: "Model Has Roles",
    fields: ["role_id", "model_type", "model_id"],
  },
  model_has_permissions: {
    label: "Model Has Permissions",
    fields: ["permission_id", "model_type", "model_id"],
  },
  permissions: {
    label: "Permissions",
    fields: ["id", "name", "guard_name", "created_at", "updated_at"],
  },
  role_has_permissions: {
    label: "Role Has Permissions",
    fields: ["permission_id", "role_id"],
  },
  languages: {
    label: "Languages",
    fields: ["id", "code", "name", "created_at", "updated_at"],
  },
  language_translations: {
    label: "Language Translations",
    fields: [
      "id",
      "language_id",
      "table_name",
      "column_name",
      "foreign_key",
      "translations",
      "created_at",
      "updated_at",
    ],
  },
  customers: {
    label: "Customers",
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
  // 'categories' entity removed as 'food_categories' is explicitly defined by a migration
  foods: {
    label: "Foods",
    fields: [
      "id",
      "name",
      "code",
      "hsn",
      "cost",
      "price",
      "price_include_gst",
      "image",
      "cost_include_gst",
      "sale_price",
      "gst_percentage",
      "food_category_id",
      "food_brand_id",
      "created_by",
      "updated_by",
      "created_at",
      "updated_at",
      "kitchen_id", // Added from AddKitchenIdColumnInFoodTable
    ],
  },
  tables: {
    label: "Tables",
    fields: [
      "id",
      "name",
      "code",
      "created_at",
      "updated_at",
    ],
  },
  orders: {
    label: "Orders",
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
    ],
  },
  order_items: {
    label: "Order Items",
    fields: [
      "id",
      "order_id",
      "food_id",
      "quantity",
      "price",
      "created_at",
      "updated_at",
    ],
  },
  payments: {
    label: "Payments",
    fields: [
      "id",
      "tenant_id",
      "order_id",
      "amount",
      "method",
      "status",
      "transaction_id",
      "created_at",
      "updated_at",
    ],
  },
  expense_categories: {
    label: "Expense Categories",
    fields: ["id", "name", "created_at", "updated_at"],
  },
  expenses: {
    label: "Expenses",
    fields: [
      "id",
      "note",
      "amount",
      "expense_category_id",
      "expense_category_name",
      "account_id",
      "account_name",
      "user_id",
      "user_name",
      "created_at",
      "updated_at",
    ],
  },
  units: {
    label: "Units",
    fields: ["id", "tenant_id", "name", "created_at", "updated_at"],
  },
  suppliers: {
    label: "Suppliers",
    fields: [
      "id",
      "name",
      "code",
      "tax_number",
      "address",
      "phone",
      "created_at",
      "updated_at",
    ],
  },
  purchases: {
    label: "Purchases",
    fields: [
      "id",
      "supplier_id",
      "supplier_name",
      "supplier_tax_number",
      "total",
      "gst",
      "shipping",
      "discount",
      "grand_total",
      "status",
      "payment_status",
      "location_id",
      "location_name",
      "user_id",
      "user_name",
      "created_at",
      "updated_at",
    ],
  },
  purchase_items: {
    label: "Purchase Items",
    fields: [
      "id",
      "product_id",
      "purchase_id",
      "product_name",
      "hsn",
      "cost",
      "gst_percentage",
      "gst",
      "discount",
      "quantity",
      "subtotal",
      "batch",
      "expiry_date",
      "created_at",
      "updated_at",
    ],
  },
  stocks: {
    label: "Stocks",
    fields: ["id", "tenant_id", "food_id", "quantity", "created_at", "updated_at"],
  },
  store_timings: {
    label: "Store Timings",
    fields: [
      "id",
      "tenant_id",
      "day_of_week",
      "open_time",
      "close_time",
      "created_at",
      "updated_at",
    ],
  },
  tables_sections: {
    label: "Table Sections",
    fields: ["id", "tenant_id", "name", "created_at", "updated_at"],
  },
  coupons: {
    label: "Coupons",
    fields: [
      "id",
      "tenant_id",
      "code",
      "type",
      "value",
      "start_date",
      "end_date",
      "created_at",
      "updated_at",
    ],
  },
  table_coupons: {
    label: "Table Coupons",
    fields: ["id", "table_id", "coupon_id", "created_at", "updated_at"],
  },
  product_coupons: {
    label: "Product Coupons",
    fields: ["id", "food_id", "coupon_id", "created_at", "updated_at"],
  },
  customer_coupons: {
    label: "Customer Coupons",
    fields: ["id", "customer_id", "coupon_id", "used_at", "created_at", "updated_at"],
  },
  reviews: {
    label: "Reviews",
    fields: [
      "id",
      "tenant_id",
      "user_id",
      "food_id",
      "rating",
      "comment",
      "created_at",
      "updated_at",
    ],
  },
  faqs: {
    label: "FAQs",
    fields: ["id", "tenant_id", "question", "answer", "created_at", "updated_at"],
  },
  invoices: {
    label: "Invoices",
    fields: [
      "id",
      "tenant_id",
      "order_id",
      "total_amount",
      "status",
      "sent_at",
      "paid_at",
      "created_at",
      "updated_at",
    ],
  },
  invoice_items: {
    label: "Invoice Items",
    fields: [
      "id",
      "invoice_id",
      "food_id",
      "quantity",
      "price",
      "created_at",
      "updated_at",
    ],
  },
  payrolls: {
    label: "Payrolls",
    fields: ["id", "tenant_id", "user_id", "amount", "pay_date", "created_at", "updated_at"],
  },
  menus: {
    label: "Menus",
    fields: ["id", "tenant_id", "name", "created_at", "updated_at"],
  },
  menu_items: {
    label: "Menu Items",
    fields: ["id", "menu_id", "food_id", "position", "created_at", "updated_at"],
  },
  administrators: {
    label: "Administrators",
    fields: ["id", "tenant_id", "user_id", "role", "created_at", "updated_at"],
  },
  announcements: {
    label: "Announcements",
    fields: [
      "id",
      "tenant_id",
      "title",
      "message",
      "start_date",
      "end_date",
      "status",
      "created_at",
      "updated_at",
    ],
  },
  settings: {
    label: "Settings",
    fields: [
      "id",
      "business_name",
      "logo",
      "currency",
      "gst_number",
      "address",
      "phone",
      "account_id",
      "location_id",
      "amountpoint",
      "print_format",
      "print_footer_message",
      "customer_id",
      "created_at",
      "updated_at",
      "pre_order",
      "reset_print_number_daily",
      "gst_summary",
      "tagline",
      "table_id",
      "kot_printer",
      "pos_all_products",
      "each_kot_new_order",
      "auto_refresh",
      "license",
      "pos_default_payment_method",
      "pos_default_order_type",
      "pos_auto_fill_cash_amount",
      "pos_post_product_add_action",
      "supplier_dine_in",
      "all_orders_kot",
      "is_direct_file_print", // Added from AddIsDirectFilePrintInSettingsTable
    ],
  },
  carts: {
    label: "Carts",
    fields: ["id", "tenant_id", "user_id", "created_at", "updated_at"],
  },
  cart_items: {
    label: "Cart Items",
    fields: ["id", "cart_id", "food_id", "quantity", "price", "created_at", "updated_at"],
  },
  delivery_personnels: {
    label: "Delivery Personnel",
    fields: ["id", "tenant_id", "name", "phone", "vehicle_number", "status", "created_at", "updated_at"],
  },
  wallets: {
    label: "Wallets",
    fields: ["id", "tenant_id", "user_id", "balance", "created_at", "updated_at"],
  },
  coupon_redemptions: {
    label: "Coupon Redemptions",
    fields: ["id", "tenant_id", "customer_coupon_id", "redeemed_at", "created_at", "updated_at"],
  },
  cash_flows: {
    label: "Cash Flows",
    fields: ["id", "tenant_id", "amount", "type", "description", "date", "created_at", "updated_at"],
  },
  refunds: {
    label: "Refunds",
    fields: ["id", "tenant_id", "order_id", "amount", "reason", "created_at", "updated_at"],
  },
  notifications: {
    label: "Notifications",
    fields: ["id", "tenant_id", "user_id", "type", "data", "read_at", "created_at", "updated_at"],
  },
  password_changes: {
    label: "Password Changes",
    fields: ["id", "user_id", "old_password", "new_password", "changed_at", "created_at", "updated_at"],
  },
  stocks_movements: {
    label: "Stock Movements",
    fields: ["id", "stock_id", "change", "type", "note", "created_at", "updated_at"],
  },
  contact_messages: {
    label: "Contact Messages",
    fields: ["id", "tenant_id", "name", "email", "subject", "message", "status", "created_at", "updated_at"],
  },
  events: {
    label: "Events",
    fields: ["id", "tenant_id", "name", "description", "start_date", "end_date", "location", "created_at", "updated_at"],
  },
  gateways: {
    label: "Gateways",
    fields: ["id", "tenant_id", "name", "type", "config", "status", "created_at", "updated_at"],
  },
  gateways_logs: {
    label: "Gateway Logs",
    fields: ["id", "gateway_id", "request", "response", "status_code", "created_at", "updated_at"],
  },
  import_batches: {
    label: "Import Batches",
    fields: ["id", "tenant_id", "file_path", "status", "created_at", "updated_at"],
  },
  import_batch_jobs: {
    label: "Import Batch Jobs",
    fields: ["id", "import_batch_id", "payload", "status", "created_at", "updated_at"],
  },
  recipes: {
    label: "Recipes",
    fields: ["id", "tenant_id", "name", "description", "created_at", "updated_at"],
  },
  ingredient_recipe: {
    label: "Ingredient Recipes",
    fields: ["id", "recipe_id", "ingredient_name", "quantity", "unit", "created_at", "updated_at"],
  },
  stocks_logs: {
    label: "Stock Logs",
    fields: ["id", "stock_id", "before", "after", "change", "created_at", "updated_at"],
  },
  cashflows_logs: {
    label: "Cash Flow Logs",
    fields: ["id", "tenant_id", "cash_flow_id", "type", "amount", "created_at", "updated_at"],
  },
  daily_summaries: {
    label: "Daily Summaries",
    fields: ["id", "tenant_id", "summary_date", "total_revenue", "total_orders", "created_at", "updated_at"],
  },
  messages: {
    label: "Messages",
    fields: ["id", "tenant_id", "sender_type", "sender_id", "recipient_id", "content", "read_at", "created_at", "updated_at"],
  },
  api_tokens: {
    label: "API Tokens",
    fields: ["id", "tenant_id", "tokenable_type", "tokenable_id", "name", "token", "abilities", "last_used_at", "expires_at", "created_at", "updated_at"],
  },
  translations: {
    label: "Translations",
    fields: ["id", "locale", "group", "key", "value", "created_at", "updated_at"],
  },
  currencies: {
    label: "Currencies",
    fields: ["id", "code", "name", "symbol", "created_at", "updated_at"],
  },
  taxes: {
    label: "Taxes",
    fields: ["id", "tenant_id", "name", "rate", "type", "created_at", "updated_at"],
  },
  tenant_settings: {
    label: "Tenant Settings",
    fields: ["id", "tenant_id", "currency_id", "key", "value", "created_at", "updated_at"],
  },
  sales: {
    label: "Sales",
    fields: [
      "id",
      "customer_id",
      "customer_name",
      "customer_tax_number",
      "total",
      "gst",
      "delivery",
      "discount",
      "discounts",
      "grand_total",
      "status",
      "payment_status",
      "location_id",
      "location_name",
      "user_id",
      "user_name",
      "cash_tendered",
      "cash_balance",
      "cash_roundoff",
      "register_id",
      "created_at",
      "updated_at",
      "employee_id",
      "type",
      "note",
      "dateTime",
      "table_id",
      "table_name",
    ],
  },
  accounts: {
    label: "Accounts",
    fields: [
      "id",
      "name",
      "code",
      "balance",
      "created_at",
      "updated_at",
    ],
  },
  food_location: {
    label: "Food Location",
    fields: [
      "id",
      "location_id",
      "food_id",
      "quantity",
      "cost",
      "cost_include_gst",
      "price",
      "price_include_gst",
      "sale_price",
      "supplier_id",
      "gst_percentage",
      "created_at",
      "updated_at",
    ],
  },
  location_product: {
    label: "Location Product",
    fields: [
      "id",
      "location_id",
      "product_id",
      "quantity",
      "batch",
      "expiry_date",
      "cost",
      "cost_include_gst",
      "price",
      "price_include_gst",
      "sale_price",
      "supplier_id",
      "gst_percentage",
      "created_at",
      "updated_at",
    ],
  },
  employee_attendances: {
    label: "Employee Attendances",
    fields: [
      "id",
      "employee_id",
      "employee_name",
      "time",
      "type",
      "created_at",
      "updated_at",
    ],
  },
  products: {
    label: "Products",
    fields: [
      "id",
      "name",
      "hsn",
      "code",
      "sellable",
      "cost",
      "cost_include_gst",
      "price",
      "price_include_gst",
      "sale_price",
      "gst_percentage",
      "product_category_id",
      "product_brand_id",
      "created_by",
      "updated_by",
      "created_at",
      "updated_at",
    ],
  },
  purchase_payments: {
    label: "Purchase Payments",
    fields: [
      "id",
      "purchase_id",
      "account_id",
      "account_name",
      "status",
      "amount",
      "user_id",
      "user_name",
      "created_at",
      "updated_at",
    ],
  },
  employee_salaries: {
    label: "Employee Salaries",
    fields: [
      "id",
      "employee_id",
      "employee_name",
      "salary",
      "salary_frequency",
      "actual_salary",
      "from",
      "to",
      "advance",
      "note",
      "account_id",
      "account_name",
      "user_id",
      "user_name",
      "created_at",
      "updated_at",
      "incentive",
    ],
  },
  modifiers: {
    label: "Modifiers",
    fields: [
      "id",
      "name",
      "code",
      "price",
      "created_at",
      "updated_at",
    ],
  },
  purchase_statuses: {
    label: "Purchase Statuses",
    fields: [
      "id",
      "purchase_id",
      "status",
      "user_id",
      "user_name",
      "created_at",
      "updated_at",
    ],
  },
  food_categories: {
    label: "Food Categories",
    fields: [
      "id",
      "name",
      "code",
      "image",
      "created_at",
      "updated_at",
    ],
  },
  employees: {
    label: "Employees",
    fields: [
      "id",
      "name",
      "employee_category_id",
      "kitchen_id",
      "code",
      "waiter",
      "login",
      "address",
      "area",
      "district",
      "phone",
      "salary",
      "salary_frequency",
      "user_id",
      "user_name",
      "created_at",
      "updated_at",
    ],
  },
  sale_statuses: {
    label: "Sale Statuses",
    fields: [
      "id",
      "sale_id",
      "status",
      "user_id",
      "user_name",
      "created_at",
      "updated_at",
    ],
  },
  product_categories: {
    label: "Product Categories",
    fields: [
      "id",
      "name",
      "code",
      "created_at",
      "updated_at",
    ],
  },
  product_brands: {
    label: "Product Brands",
    fields: [
      "id",
      "name",
      "code",
      "created_at",
      "updated_at",
    ],
  },
  registers: {
    label: "Registers",
    fields: [
      "id",
      "user_id",
      "location_id",
      "cash_in_hand",
      "status",
      "total_cash",
      "total_others",
      "total_amount",
      "created_at",
      "updated_at",
    ],
  },
  employee_categories: {
    label: "Employee Categories",
    fields: [
      "id",
      "name",
      "created_at",
      "updated_at",
    ],
  },
  food_product: {
    label: "Food Product",
    fields: [
      "id",
      "food_id",
      "product_id",
      "quantity",
      "created_at",
      "updated_at",
      "product_name",
    ],
  },
  modifier_sale_item: {
    label: "Modifier Sale Item",
    fields: [
      "id",
      "sale_item_id",
      "modifier_id",
      "price",
      "created_at",
      "updated_at",
    ],
  },
  purchase_returns: {
    label: "Purchase Returns",
    fields: [
      "id",
      "purchase_id",
      "supplier_id",
      "supplier_name",
      "supplier_tax_number",
      "total",
      "gst",
      "shipping",
      "discount",
      "grand_total",
      "status",
      "payment_status",
      "location_id",
      "location_name",
      "user_id",
      "user_name",
      "extras",
      "created_at",
      "updated_at",
    ],
  },
  consumption_items: {
    label: "Consumption Items",
    fields: [
      "id",
      "product_id",
      "name",
      "quantity",
      "kitchen_id",
      "kitchen_name",
      "employee_id",
      "employee_name",
      "wastage",
      "auto_deduct",
      "user_id",
      "user_name",
      "created_at",
      "updated_at",
    ],
  },
  points: {
    label: "Points",
    fields: [
      "id",
      "customer_id",
      "customer_name",
      "opening_balance",
      "points",
      "type",
      "closing_balance",
      "sale_id",
      "user_id",
      "user_name",
      "created_at",
      "updated_at",
    ],
  },
  food_modifier: {
    label: "Food Modifier",
    fields: [
      "id",
      "food_id",
      "modifier_id",
      "created_at",
      "updated_at",
    ],
  },
  kitchens: {
    label: "Kitchens",
    fields: [
      "id",
      "name",
      "code",
      "location_id",
      "created_at",
      "updated_at",
      "kot_printer",
    ],
  },
  purchase_return_items: {
    label: "Purchase Return Items",
    fields: [
      "id",
      "product_id",
      "purchase_return_id",
      "product_name",
      "hsn",
      "cost",
      "gst_percentage",
      "gst",
      "discount",
      "quantity",
      "subtotal",
      "created_at",
      "updated_at",
    ],
  },
  transactions: {
    label: "Transactions",
    fields: [
      "id",
      "account_id",
      "account_name",
      "description",
      "opening_balance",
      "amount",
      "type",
      "closing_balance",
      "supplier_id",
      "supplier_name",
      "purchase_id",
      "user_id",
      "user_name",
      "customer_id",
      "customer_name",
      "employee_id",
      "employee_name",
      "expense_id",
      "sale_id",
      "purchase_return_id",
      "created_at",
      "updated_at",
    ],
  },
  sale_payments: {
    label: "Sale Payments",
    fields: [
      "id",
      "sale_id",
      "account_id",
      "account_name",
      "status",
      "amount",
      "user_id",
      "user_name",
      "payment_method",
      "created_at",
      "updated_at",
    ],
  },
  table_items: {
    label: "Table Items",
    fields: [
      "id",
      "customer_id",
      "table_id",
      "table_name",
      "food_id",
      "food_name",
      "hsn",
      "code",
      "quantity",
      "price",
      "selling_price",
      "gst",
      "gst_percentage",
      "discount",
      "cost",
      "printed",
      "created_at",
      "updated_at",
      "old_quantity",
    ],
  },
  oauth_access_tokens: {
    label: "Oauth Access Tokens",
    fields: [
      "id",
      "user_id",
      "client_id",
      "name",
      "scopes",
      "revoked",
      "created_at",
      "updated_at",
      "expires_at",
    ],
  },
  oauth_auth_codes: {
    label: "Oauth Auth Codes",
    fields: [
      "id",
      "user_id",
      "client_id",
      "scopes",
      "revoked",
      "expires_at",
    ],
  },
  oauth_refresh_tokens: {
    label: "Oauth Refresh Tokens",
    fields: [
      "id",
      "access_token_id",
      "revoked",
      "expires_at",
    ],
  },
  oauth_clients: {
    label: "Oauth Clients",
    fields: [
      "id",
      "user_id",
      "name",
      "secret",
      "provider",
      "redirect",
      "personal_access_client",
      "password_client",
      "revoked",
      "created_at",
      "updated_at",
    ],
  },
  oauth_personal_access_clients: {
    label: "Oauth Personal Access Clients",
    fields: [
      "id",
      "client_id",
      "created_at",
      "updated_at",
    ],
  },
};