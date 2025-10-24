// src/app/config/entities.ts

import { ReactNode } from "react";

export interface EntityConfig {
  subMenus?: any;
  label: string;
  fields: string[];
  endpoint: string;
}

// --- Core POS Entities ---

export interface Food {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_urls?: string[];  // CHANGE: Single image_url -> Array of image_urls
  preparation_time?: number;
  allergens?: string[];
  tenant_id: string;
  recipes?: RecipeItem[];
  store_id?: string;
  is_available?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StoreFood {
  food_id: string;
  store_id: string;
  is_available: boolean;
}

export interface RecipeItem {
  id: string;
  food_id: string;
  inventory_product_id: string;
  quantity_used: number;
  unit_of_measure: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  store_id?: string;
  table_id: string | null;
  customer_id: string | null;
  total_amount: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  employee_id?: string;
  order_type?: "dine-in" | "takeaway";
  payment_status?: string;
  payment_method?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  food_id: string;
  quantity: number;
  price: number;
  sub_total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  name: string;
  price_at_sale: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;  // ADD THIS LINE
  created_at?: string;
  updated_at?: string;
}

export interface invCategory {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  loyalty_points?: number;
  created_at?: string;
  updated_at?: string;
  store_id: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: string;
  current_order_id?: string | null;
  created_at?: string;
  updated_at?: string;
  store_id: string;
}

export interface AccessRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  landing_page: string;
  created_at?: string;
  updated_at?: string;
}

// Updated Employee Interface with HR details
// In your entities.ts file, update the Employee interface:
export interface Employee {
  id: string;
  user_id: string;
  job_title_id: string;
  access_role_ids: string[]; // This is the field the backend expects
  tenant_id: string;
  store_id: string;
  main_access_role_id: string; // Keep this for form handling
  hire_date: string;
  salary: number;
  first_name: string;
  last_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;

  // New HR fields
  employee_id?: string;
  full_name?: string;
  middle_name?: string;
  suffix?: string;
  profile_photo_url?: string;
  personal_details?: PersonalDetails;
  contact_details?: ContactDetails;
  employment_details?: EmploymentDetails;
  status?: EmployeeStatus;

  // Add this for frontend form handling
  other_access_roles?: string[]; // Keep for form state
}

export interface PersonalDetails {
  citizenship: string;
  gender: string;
  birth_date: string;
  age: string;
}

export interface ContactDetails {
  cell_phone: string;
  whatsapp_number: string;
  email: string;
  address: string;
}

export interface EmploymentDetails {
  job_title: string;
  team: string;
  employment_type: string;
  location: string;
}

export interface EmployeeStatus {
  current_status: string;
  on_leave_since?: string;
  termination_date?: string;
  termination_reason?: string;
}

export interface Reservation {
  id: string;
  customer_id: string;
  table_id: string | null;
  date_time: string;
  number_of_guests: number;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  store_id: string;
}

// --- New HR Entities ---

// Update the Shift interface to include recurrence details
export interface Shift {
  id: string;
  employee_id: string;
  start: Date; // ISO string
  end: Date; // ISO string
  title?: string;
  employee_name?: string;
  color?: string;
  // --- New fields ---
  active?: boolean;
  recurring?: boolean;
  updated_at?: string;
  created_at?: string;
  isDraft?: boolean;
}

// New interfaces for enhanced draft management
export interface DraftShift extends Omit<Shift, "id"> {
  id: string; // Can be draft IDs
  isDraft: boolean;
  published?: boolean;
  original_shift_id?: string; // For tracking which published shift this draft modifies
  marked_for_deletion?: boolean; // For tracking shifts to delete
}

export interface LocalStorageShifts {
  draftShifts: DraftShift[];
  lastSaved: string;
  version: string;
}

export interface Timesheet {
  timesheet_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  daily_hours: { [date: string]: string };
  total_weekly_hours: string;
}

// This interface represents a single clock-in/out record.
export interface TimesheetEntry {
  id: string;
  employee_id: string;
  clock_in: string; // ISO 8601 string
  clock_out: string | null; // ISO 8601 string or null if still clocked in
  duration_minutes: number | null; // Calculated duration in minutes
  created_at: string;
  updated_at: string;
}

export interface Company {
  company_id: string;
  name: string;
  country: string;
  tax_details: TaxDetails;
  metrics: CompanyMetrics;
}

export interface TaxDetails {
  tax_year: string;
  efiling_admin: string;
  related_docs: string;
}

export interface CompanyMetrics {
  total_employees: number;
  active_employees: number;
  employees_on_leave: number;
  terminated_employees: number;
  full_time_employees: number;
  part_time_employees: number;
  contract_employees: number;
  employee_invites: EmployeeInvites;
}

export interface EmployeeInvites {
  sent: number;
  active: number;
  require_attention: number;
}

// Updated Store interface with new fields
export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  location?: string;
  manager_id?: string;
  kiosk_user_id: string; // ADDED: Field for the kiosk account
}

// --- Other Entities ---

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

  // NEW: Customer page customization fields
  customer_page_settings?: {
    // Banner Settings
    banner_image_url?: string;
    banner_overlay_opacity?: number;
    banner_text?: string;
    banner_text_color?: string;
    show_banner?: boolean;

    // Logo & Branding
    logo_url?: string;
    logo_size?: 'small' | 'medium' | 'large';

    // Color Scheme
    primary_color?: string;
    secondary_color?: string;
    background_color?: string;
    text_color?: string;
    accent_color?: string;

    // Typography
    font_family?: string;
    heading_font_size?: string;
    body_font_size?: string;

    // Layout
    layout_option?: 'classic' | 'modern' | 'minimal' | 'custom';
    card_style?: 'flat' | 'raised' | 'border' | 'gradient';
    button_style?: 'rounded' | 'square' | 'pill';

    // Features
    show_search_bar?: boolean;
    show_category_nav?: boolean;
    enable_animations?: boolean;
    dark_mode?: boolean;

    // Social Media
    social_links?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      website?: string;
    };
  };
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
  // name?: string;
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
  food_id: string;
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

export interface JobTitle {
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
  description?: string;
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

export interface Report {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  attempted_path: string;
  attempts: number;
  last_attempt_at: string;
  created_at: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  description?: string;
  sku: string;
  unit_of_measure: string;
  tenant_id: string;
  unit_cost: number;
  quantity_in_stock: number;
  reorder_level: number;
  supplier_id?: string;
  inv_category_id?: string;
  location_in_warehouse?: string;
  last_restocked_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Add these interfaces to your entities.ts file

export interface Payroll {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  payment_cycle: "weekly" | "bi-weekly" | "monthly";
  gross_pay: number;
  tax_deductions: number;
  net_pay: number;
  status: "pending" | "processing" | "paid" | "failed";
  hours_worked: number;
  overtime_hours: number;
  overtime_rate: number;
  deductions: PayrollDeduction[];
  created_at: string;
  updated_at: string;
  store_id: string;
}

export interface PayrollDeduction {
  id: string;
  payroll_id: string;
  type: "tax" | "insurance" | "retirement" | "other";
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollSettings {
  id: string;
  store_id: string;
  default_payment_cycle: "weekly" | "bi-weekly" | "monthly";
  tax_rate: number;
  overtime_multiplier: number;
  overtime_threshold: number;
  pay_day?: number;
  auto_process: boolean;
  include_benefits: boolean;
  benefits_rate: number;
  created_at: string;
  updated_at: string;
}

export const entities: { [key: string]: EntityConfig } = {


  // Core POS Entities
  payrolls: {
    label: "Payrolls",
    endpoint: "/api/payroll",
    fields: [
      "id",
      "employee_id",
      "pay_period_start",
      "pay_period_end",
      "payment_cycle",
      "gross_pay",
      "tax_deductions",
      "net_pay",
      "status",
      "hours_worked",
      "overtime_hours",
      "overtime_rate",
      "created_at",
      "updated_at",
      "store_id",
    ],
  },
  tenant_settings: {
    label: "Tenant Settings",
    endpoint: "/api/tenants",
    fields: [
      "id",
      "name",
      "email",
      "phone",
      "address",
      "customer_page_settings",
      "created_at",
      "updated_at"
    ],
  },
  payroll_settings: {
    label: "Payroll Settings",
    endpoint: "/api/payroll_settings",
    fields: [
      "id",
      "store_id",
      "default_payment_cycle",
      "tax_rate",
      "overtime_multiplier",
      "overtime_threshold", // NEW
      "pay_day", // NEW
      "auto_process", // NEW
      "include_benefits", // NEW
      "benefits_rate", // NEW
      "created_at",
      "updated_at",
    ],
  },
  inventory_products: {
    label: "Inventory Products",
    endpoint: "/api/inventory_products",
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
      "store_id",
    ],
  },
  orders: {
    label: "Orders",
    endpoint: "/api/orders",
    fields: [
      "id",
      "store_id",
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
    endpoint: "/api/reports",
    fields: [
      "id",
      "user_id",
      "user_name",
      "user_role",
      "attempted_path",
      "attempts",
      "last_attempt_at",
      "created_at",
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
  foods: {
    label: "Foods",
    endpoint: "/api/foods",
    fields: [
      "id",
      "name",
      "description",
      "price",
      "category_id",
      "is_available",
      "image_urls",
      "preparation_time",
      "allergens",
      "created_at",
      "updated_at",
      "tenant_id",
      "recipes",
    ],
  },
  store_foods: {
    label: "Store Foods",
    endpoint: "/api/store_foods",
    fields: ["food_id", "store_id", "is_available"],
  },
  recipes: {
    label: "Recipes",
    endpoint: "/api/recipes",
    fields: [
      "id",
      "food_id",
      "inventory_product_id",
      "quantity_used",
      "unit_of_measure",
      "created_at",
      "updated_at",
    ],
  },
  categories: {
    label: "Categories",
    endpoint: "/api/categories",
    fields: [
      "id",
      "name",
      "description",
      "created_at",
      "updated_at",
      "store_id",
    ],
  },
  inv_categories: {
    label: "Inv. Categories",
    endpoint: "/api/inv_categories",
    fields: [
      "id",
      "name",
      "description",
      "created_at",
      "updated_at",
      "store_id",
    ],
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
      "store_id",
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
      "store_id",
    ],
  },
  employees: {
    label: "Employees",
    endpoint: "/api/employees",
    fields: [
      "id",
      "user_id",
      "job_title_id",
      "access_role_ids",
      "main_access_role_id",
      "hire_date",
      "salary",
      "first_name",
      "last_name",
      "store_id",
      "avatar_url",
      "created_at",
      "updated_at",
      "employee_id",
      "full_name",
      "middle_name",
      "suffix",
      "profile_photo_url",
      "personal_details",
      "contact_details",
      "employment_details",
      "status",
    ],
  },
  access_roles: {
    label: "Access Roles",
    endpoint: "/api/access_roles",
    fields: [
      "id",
      "name",
      "description",
      "permissions",
      "landing_page",
      "created_at",
      "updated_at",
    ],
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
      "store_id",
    ],
  },

  // New HR Entities
  shifts: {
    label: "Shifts",
    endpoint: "/api/shifts",
    fields: [
      "id",
      "employee_id",
      "start",
      "end",
      "title",
      "employee_name",
      "color",
      "created_at",
      "updated_at",
      "active",
      "recurring",
    ],
  },
  timesheetsManagement: {
    label: "Timesheets Management",
    endpoint: "/api/timesheets_management",
    fields: [
      "timesheet_id",
      "employee_id",
      "start_date",
      "end_date",
      "daily_hours",
      "total_weekly_hours",
    ],
  },
  timesheets: {
    label: "Timesheets",
    endpoint: "/api/timesheets",
    fields: ["id", "employee_id", "clock_in", "clock_out", "duration_minutes"],
  },
  payroll: {
    label: "Payrolls",
    endpoint: "/api/payrolls",
    fields: [
      "payroll_id",
      "employee_id",
      "payment_cycle",
      "pay_period_start",
      "pay_period_end",
      "total_wages_due",
      "tax_deductions",
      "net_pay",
      "status",
    ],
  },
  companies: {
    label: "Companies",
    endpoint: "/api/companies",
    fields: ["company_id", "name", "country", "tax_details", "metrics"],
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
      "updated_at",
    ],
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
    fields: [
      "id",
      "name",
      "percentage",
      "is_active",
      "created_at",
      "updated_at",
    ],
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
      "location",
      "manager_id",
    ],
  },
  job_titles: {
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
          { id: "milliliter", name: "Milliliter", symbol: "ml" },
          { id: "liter", name: "Liter", symbol: "L" },
          { id: "ounce_fl", name: "Fluid Ounce", symbol: "fl oz" },
          { id: "cup", name: "Cup", symbol: "cup" },
          { id: "pint", name: "Pint", symbol: "pt" },
          { id: "quart", name: "Quart", symbol: "qt" },
          { id: "gallon", name: "Gallon", symbol: "gal" },
          { id: "teaspoon", name: "Teaspoon", symbol: "tsp" },
          { id: "tablespoon", name: "Tablespoon", symbol: "tbsp" },
          { id: "gram", name: "Gram", symbol: "g" },
          { id: "kilogram", name: "Kilogram", symbol: "kg" },
          { id: "milligram", name: "Milligram", symbol: "mg" },
          { id: "ounce_wt", name: "Ounce", symbol: "oz" },
          { id: "pound", name: "Pound", symbol: "lb" },
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
  },
  purchase_orders: {
    label: "Purchase Orders",
    endpoint: "purchase_orders",
    fields: [
      "id",
      "po_number",
      "supplier_id",
      "site_id",
      "status",
      "order_date",
      "expected_delivery_date",
      "total_amount",
      "ordered_by",
      "notes",
      "items",
      "created_at",
      "updated_at",
    ],
  },

  goods_receipts: {
    label: "Goods Receipts",
    endpoint: "goods_receipts",
    fields: [
      "id",
      "receipt_number",
      "purchase_order_id",
      "receipt_date",
      "received_by",
      "receiving_bin_id",
      "notes",
      "status",
      "received_items",
      "created_at",
      "updated_at",
    ],
  },

  sites: {
    label: "Sites",
    endpoint: "sites",
    fields: ["id", "name", "address", "type", "created_at", "updated_at"],
  },
};
