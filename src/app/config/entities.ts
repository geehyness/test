// src/app/config/entities.ts
export interface EntityConfig {
  subMenus?: any; // Marked as optional as it's not consistently used
  label: string; // human-readable name
  fields: string[]; // exact column names in the table
  endpoint: string; // Added: The API endpoint for fetching data for this entity
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
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role_id: string; // Foreign key to Role
  hire_date: string;
  salary: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
  updated_at: string;
}


export interface Expense {
  id: string;
  tenant_id: string;
  amount: number;
  description: string;
  expense_date: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category_id: string; // Foreign key to Category
  supplier_id: string; // Foreign key to Supplier
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  tenant_id: string;
  supplier_id: string; // Foreign key to Supplier
  total_amount: number;
  purchase_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string; // Foreign key to Purchase
  product_id: string; // Foreign key to Product
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  order_id: string; // Foreign key to Order
  customer_id: string; // Foreign key to Customer
  amount: number;
  reason: string;
  refund_date: string;
  created_at: string;
  updated_at: string;
}

export interface RefundItem {
  id: string;
  refund_id: string; // Foreign key to Refund
  menu_item_id: string; // Foreign key to MenuItem
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  employee_id: string; // Foreign key to Employee
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface StockAdjustment {
  id: string;
  product_id: string; // Foreign key to Product
  quantity_change: number;
  reason: string;
  adjustment_date: string;
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

export interface Tax {
  id: string;
  name: string;
  percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  order_id: string; // Foreign key to Order
  payment_method: string;
  amount: number;
  transaction_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyPoint {
  id: string;
  customer_id: string;
  points_earned: number;
  points_redeemed: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Discount {
  id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  transaction_id: string;
  payment_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  customer_id: string;
  created_at: string;
  updated_at: string;
}

export interface Kitchen {
  id: string;
  name: string;
  description: string;
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

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string; // e.g., 'order_placed', 'stock_low'
  is_read: boolean;
  created_at: string;
  updated_at: string;
}


// Configuration for each entity, including API endpoint and fields for DataTable
export const entities: Record<string, EntityConfig> = {
  tenants: {
    label: "Tenants",
    endpoint: "/api/tenants", // Added endpoint
    fields: [
      "id",
      "name",
      "email",
      "phone",
      "address",
      "created_at",
      "updated_at",
    ],
  },
  orders: {
    label: "Orders",
    endpoint: "/api/orders", // Added endpoint
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
  menu_items: {
    label: "Menu Items",
    endpoint: "/api/menu_items", // Added endpoint
    fields: [
      "id",
      "menu_id",
      "food_id",
      "position",
      "created_at",
      "updated_at",
    ],
  },
  categories: {
    label: "Categories",
    endpoint: "/api/categories", // Added endpoint
    fields: ["id", "name", "code", "image", "created_at", "updated_at"],
  },
  customers: {
    label: "Customers",
    endpoint: "/api/customers", // Added endpoint
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
  tables: {
    label: "Tables",
    endpoint: "/api/tables", // Added endpoint
    fields: ["id", "name", "code", "created_at", "updated_at"],
  },
  employees: {
    label: "Employees",
    endpoint: "/api/employees",
    fields: [
      "id",
      "name",
      "email",
      "phone",
      "role_id",
      "hire_date",
      "salary",
      "created_at",
      "updated_at",
    ],
  },
  roles: {
    label: "Roles",
    endpoint: "/api/roles",
    fields: ["id", "name", "description", "created_at", "updated_at"],
  },
  permissions: {
    label: "Permissions",
    endpoint: "/api/permissions",
    fields: ["id", "name", "description", "created_at", "updated_at"],
  },
  role_permissions: {
    label: "Role Permissions",
    endpoint: "/api/role_permissions",
    fields: ["id", "role_id", "permission_id", "created_at", "updated_at"],
  },
  expenses: {
    label: "Expenses",
    endpoint: "/api/expenses",
    fields: [
      "id",
      "tenant_id",
      "amount",
      "description",
      "expense_date",
      "category",
      "created_at",
      "updated_at",
    ],
  },
  products: {
    label: "Products",
    endpoint: "/api/products",
    fields: [
      "id",
      "tenant_id",
      "name",
      "description",
      "price",
      "stock_quantity",
      "category_id",
      "supplier_id",
      "created_at",
      "updated_at",
    ],
  },
  purchases: {
    label: "Purchases",
    endpoint: "/api/purchases",
    fields: [
      "id",
      "tenant_id",
      "supplier_id",
      "total_amount",
      "purchase_date",
      "status",
      "created_at",
      "updated_at",
    ],
  },
  purchase_items: {
    label: "Purchase Items",
    endpoint: "/api/purchase_items",
    fields: [
      "id",
      "purchase_id",
      "product_id",
      "quantity",
      "unit_price",
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
      "customer_id",
      "amount",
      "reason",
      "refund_date",
      "created_at",
      "updated_at",
    ],
  },
  refund_items: {
    label: "Refund Items",
    endpoint: "/api/refund_items",
    fields: [
      "id",
      "refund_id",
      "menu_item_id",
      "quantity",
      "price",
      "created_at",
      "updated_at",
    ],
  },
  shifts: {
    label: "Shifts",
    endpoint: "/api/shifts",
    fields: [
      "id",
      "employee_id",
      "start_time",
      "end_time",
      "created_at",
      "updated_at",
    ],
  },
  stock_adjustments: {
    label: "Stock Adjustments",
    endpoint: "/api/stock_adjustments",
    fields: [
      "id",
      "product_id",
      "quantity_change",
      "reason",
      "adjustment_date",
      "created_at",
      "updated_at",
    ],
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
  taxes: {
    label: "Taxes",
    endpoint: "/api/taxes",
    fields: ["id", "name", "percentage", "is_active", "created_at", "updated_at"],
  },
  transactions: {
    label: "Transactions",
    endpoint: "/api/transactions",
    fields: [
      "id",
      "order_id",
      "payment_method",
      "amount",
      "transaction_date",
      "status",
      "created_at",
      "updated_at",
    ],
  },
  loyalty_points: {
    label: "Loyalty Points",
    endpoint: "/api/loyalty_points",
    fields: [
      "id",
      "customer_id",
      "points_earned",
      "points_redeemed",
      "date",
      "created_at",
      "updated_at",
    ],
  },
  discounts: {
    label: "Discounts",
    endpoint: "/api/discounts",
    fields: [
      "id",
      "name",
      "code",
      "type",
      "value",
      "min_order_amount",
      "max_discount_amount",
      "start_date",
      "end_date",
      "is_active",
      "created_at",
      "updated_at",
    ],
  },
  payments: {
    label: "Payments",
    endpoint: "/api/payments",
    fields: [
      "id",
      "order_id",
      "amount",
      "method",
      "transaction_id",
      "payment_date",
      "status",
      "created_at",
      "updated_at",
    ],
  },
  invoices: {
    label: "Invoices",
    endpoint: "/api/invoices",
    fields: [
      "id",
      "order_id",
      "invoice_number",
      "invoice_date",
      "total_amount",
      "tax_amount",
      "discount_amount",
      "customer_id",
      "created_at",
      "updated_at",
    ],
  },
  kitchens: {
    label: "Kitchens",
    endpoint: "/api/kitchens",
    fields: ["id", "name", "description", "created_at", "updated_at"],
  },
  menus: {
    label: "Menus",
    endpoint: "/api/menus",
    fields: ["id", "name", "description", "is_active", "created_at", "updated_at"],
  },
  notifications: {
    label: "Notifications",
    endpoint: "/api/notifications",
    fields: [
      "id",
      "user_id",
      "message",
      "type",
      "is_read",
      "created_at",
      "updated_at",
    ],
  },
  foods: {
    label: "Foods",
    endpoint: "/api/foods",
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
      "kitchen_id",
    ],
  },
};