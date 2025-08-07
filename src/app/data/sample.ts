// src/app/data/sample.ts
// This file contains sample data relevant to the current entities defined in entities.ts.
// It has been filtered and transformed to align with the latest entity interfaces.
// It uses a single tenant and store for all related data.

import {
  Tenant,
  Store,
  User,
  AccessRole,
  JobTitle,
  Employee,
  Category,
  Food,
  RecipeItem,
  InventoryProduct,
  Customer,
  Table,
  Reservation,
  Order,
  OrderItem,
  PaymentMethod,
  Supplier,
  Unit,
  Tax,
  invCategory
} from "@/app/config/entities";

// Define a type for the structure of your sample data
export interface SampleData {
  tenants: Tenant[];
  stores: Store[];
  users: User[];
  access_roles: AccessRole[];
  job_titles: JobTitle[];
  employees: Employee[];
  categories: Category[];
  inv_categories: invCategory[];
  foods: Food[];
  recipes: RecipeItem[];
  inventory_products: InventoryProduct[];
  customers: Customer[];
  tables: Table[];
  reservations: Reservation[];
  orders: Order[];
  order_items: OrderItem[];
  payment_methods: PaymentMethod[];
  suppliers: Supplier[];
  units: Unit[];
  taxes: Tax[];
}


// Fixed IDs for consistency
const tenantId = "tenant-231";
const storeId = "store-001";
const adminUserId = "user-admin";
const managerUserId = "user-manager";
const serverUserId = "user-server";
const kitchenUserId = "user-kitchen";
const cashierUserId = "user-cashier";

const adminRoleId = "ar-admin";
const managerRoleId = "ar-manager";
const serverRoleId = "ar-server";
const kitchenRoleId = "ar-kitchen";
const cashierRoleId = "ar-cashier";

const managerJobId = "jt-manager";
const waiterJobId = "jt-waiter";
const chefJobId = "jt-chef";
const cashierJobId = "jt-cashier";

const catMainId = "cat-main";
const catSidesId = "cat-sides";
const catDrinksId = "cat-drinks";
const catDessertsId = "cat-desserts";

const foodBurgerId = "food-001";
const foodSaladId = "food-002";
const foodFriesId = "food-003";
const foodCokeId = "food-004";
const foodCakeId = "food-005";
const foodSandwichId = "food-006";

const invBeefId = "inv-beef-patty";
const invBunId = "inv-burger-bun";
const invLettuceId = "inv-lettuce";
const invTomatoId = "inv-tomato";
const invCheeseId = "inv-cheese";
const invPotatoId = "inv-potato";
const invCokeCanId = "inv-coke-can";
const invChickenBreastId = "inv-chicken-breast";
const invBreadId = "inv-bread-loaf";
const invChocolateId = "inv-chocolate";
const invFlourId = "inv-flour";
const invEggId = "inv-egg";

const recipeBurgerPattyId = "recipe-1";
const recipeBurgerBunId = "recipe-2";
const recipeLettuceId = "recipe-3";
const recipeTomatoId = "recipe-4";
const recipeCheeseId = "recipe-5";
const recipeRomaineId = "recipe-6";
const recipeCaesarDressingId = "recipe-7";
const recipeCroutonsId = "recipe-8";
const recipeParmesanId = "recipe-9";
const recipeCokeId = "recipe-10";
const recipeFriesId = "recipe-11";
const recipeSandwichChickenId = "recipe-12";
const recipeSandwichBreadId = "recipe-13";
const recipeCakeChocolateId = "recipe-14";
const recipeCakeFlourId = "recipe-15";
const recipeCakeEggId = "recipe-16";


const orderId1 = "order-001";
const orderId2 = "order-002";

const invCatMeatId = "inv-cat-meat";
const invCatDairyId = "inv-cat-dairy";
const invCatProduceId = "inv-cat-produce";
const invCatBeveragesId = "inv-cat-beverages";
const invCatMiscId = "inv-cat-misc";
const invCatPantryId = "inv-cat-pantry";


export const sampleData: SampleData = {
  tenants: [
    {
      id: tenantId,
      name: "Provision Corp",
      email: "contact@provision.com",
      password: "hashedpassword1",
      remember_token: "token123",
      phone: "123-456-7890",
      address: "123 Main St, Anytown",
      created_at: "2025-06-30T20:40:58.830Z",
      updated_at: "2025-07-01T04:19:09.158Z",
    },
  ],
  stores: [
    {
      id: storeId,
      tenant_id: tenantId,
      name: "Downtown Grill",
      address: "456 Main St, Anytown",
      phone: "123-555-1234",
      email: "downtown@provision.com",
      created_at: "2025-07-01T08:00:00Z",
      updated_at: "2025-07-01T08:00:00Z",
    },
  ],
  users: [
    {
      id: adminUserId,
      name: "Admin User",
      email: "admin@provision.com",
      email_verified_at: "2025-07-01T09:00:00Z",
      password: "hashedpassword1",
      remember_token: "token123",
      created_at: "2025-07-01T09:00:00Z",
      updated_at: "2025-07-01T09:00:00Z",
    },
    {
      id: managerUserId,
      name: "Mark Brown",
      email: "mark.brown@provision.com",
      email_verified_at: "2025-07-01T09:00:00Z",
      password: "hashedpassword2",
      remember_token: "token456",
      created_at: "2025-07-01T09:00:00Z",
      updated_at: "2025-07-01T09:00:00Z",
    },
    {
      id: serverUserId,
      name: "Emily White",
      email: "emily.white@provision.com",
      email_verified_at: "2025-07-01T09:00:00Z",
      password: "hashedpassword3",
      remember_token: "token789",
      created_at: "2025-07-01T09:10:00Z",
      updated_at: "2025-07-01T09:10:00Z",
    },
    {
      id: kitchenUserId,
      name: "Gordon Ramsay",
      email: "gordon.r@provision.com",
      email_verified_at: "2025-07-01T09:00:00Z",
      password: "hashedpassword4",
      remember_token: "tokenabc",
      created_at: "2025-07-01T09:15:00Z",
      updated_at: "2025-07-01T09:15:00Z",
    },
    {
      id: cashierUserId,
      name: "Sarah Green",
      email: "sarah.green@provision.com",
      email_verified_at: "2025-07-01T09:00:00Z",
      password: "hashedpassword5",
      remember_token: "tokendef",
      created_at: "2025-07-01T09:05:00Z",
      updated_at: "2025-07-01T09:05:00Z",
    },
  ],
  access_roles: [
    {
      id: adminRoleId,
      name: "Admin",
      description: "Full administrative access to all system features.",
      permissions: ["can_manage_users", "can_view_reports", "can_manage_settings", "can_manage_all_pos_operations"],
      landing_page: "/pos/management",
      created_at: "2025-07-01T08:00:00Z",
      updated_at: "2025-07-01T08:00:00Z",
    },
    {
      id: managerRoleId,
      name: "Manager",
      description: "Access to POS operations and some management features.",
      permissions: ["can_manage_orders", "can_view_reports", "can_process_payments", "can_manage_reservations"],
      landing_page: "/pos/dashboard",
      created_at: "2025-07-01T09:00:00Z",
      updated_at: "2025-07-01T09:00:00Z",
    },
    {
      id: serverRoleId,
      name: "Server",
      description: "Takes orders, manages tables, and interacts with customers.",
      permissions: ["can_create_orders", "can_update_orders", "can_manage_tables", "can_view_menu"],
      landing_page: "/pos/server",
      created_at: "2025-07-01T09:10:00Z",
      updated_at: "2025-07-01T09:10:00Z",
    },
    {
      id: kitchenRoleId,
      name: "Kitchen",
      description: "Prepares food orders and updates order status.",
      permissions: ["can_view_kitchen_orders", "can_update_order_status"],
      landing_page: "/pos/kitchen",
      created_at: "2025-07-01T09:15:00Z",
      updated_at: "2025-07-01T09:15:00Z",
    },
    {
      id: cashierRoleId,
      name: "Cashier",
      description: "Processes payments and manages basic order operations.",
      permissions: ["can_process_payments", "can_create_orders", "can_view_orders"],
      landing_page: "/pos/dashboard",
      created_at: "2025-07-01T09:05:00Z",
      updated_at: "2025-07-01T09:05:00Z",
    },
  ],
  job_titles: [
    {
      id: managerJobId,
      title: "Manager",
      description: "Oversees daily operations and staff.",
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: waiterJobId,
      title: "Waiter/Waitress",
      description: "Serves customers and takes orders.",
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: chefJobId,
      title: "Chef",
      description: "Manages kitchen operations and prepares food.",
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: cashierJobId,
      title: "Cashier",
      description: "Handles cash and card payments.",
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
  ],
  employees: [
    {
      id: "emp-1",
      user_id: managerUserId,
      job_title_id: managerJobId,
      tenant_id: tenantId,
      store_id: storeId,
      access_role_ids: [managerRoleId],
      hire_date: "2025-07-01T00:00:00Z",
      salary: 60000,
      first_name: "Mark",
      last_name: "Brown",
      created_at: "2025-07-01T09:00:00Z",
      updated_at: "2025-07-01T09:00:00Z",
      main_access_role_id: "ar-manager"

    },
    {
      id: "emp-2",
      user_id: serverUserId,
      job_title_id: waiterJobId,
      tenant_id: tenantId,
      store_id: storeId,
      access_role_ids: [serverRoleId],
      hire_date: "2025-07-01T00:00:00Z",
      salary: 30000,
      first_name: "Emily",
      last_name: "White",
      created_at: "2025-07-01T09:10:00Z",
      updated_at: "2025-07-01T09:10:00Z",
      main_access_role_id: serverRoleId
    },
    {
      id: "emp-3",
      user_id: kitchenUserId,
      job_title_id: chefJobId,
      tenant_id: tenantId,
      store_id: storeId,
      access_role_ids: [kitchenRoleId],
      hire_date: "2025-07-01T00:00:00Z",
      salary: 50000,
      first_name: "Gordon",
      last_name: "Ramsay",
      created_at: "2025-07-01T09:15:00Z",
      updated_at: "2025-07-01T09:15:00Z",
      main_access_role_id: kitchenRoleId
    },
    {
      id: "emp-4",
      user_id: cashierUserId,
      job_title_id: cashierJobId,
      tenant_id: tenantId,
      store_id: storeId,
      access_role_ids: [cashierRoleId],
      hire_date: "2025-07-01T00:00:00Z",
      salary: 35000,
      first_name: "Sarah",
      last_name: "Green",
      created_at: "2025-07-01T09:05:00Z",
      updated_at: "2025-07-01T09:05:00Z",
      main_access_role_id: "cashierRoleId"
    },
    // The admin user isn't typically an 'employee' in a store context, but we include a representation for demonstration
    {
      id: "emp-admin",
      user_id: adminUserId,
      job_title_id: managerJobId, // A manager role is a reasonable default for an admin
      tenant_id: tenantId,
      store_id: storeId,
      access_role_ids: [adminRoleId],
      hire_date: "2025-06-01T00:00:00Z",
      salary: 90000,
      first_name: "Admin",
      last_name: "User",
      created_at: "2025-07-01T09:00:00Z",
      updated_at: "2025-07-01T09:00:00Z",
      main_access_role_id: "ar-admin"
    },
  ],
  categories: [
    {
      id: catMainId,
      name: "Main Courses",
      description: "Hearty meals for the main event.",

      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: catSidesId,
      name: "Sides",
      description: "Perfect additions to any meal.",

      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: catDrinksId,
      name: "Drinks",
      description: "Refreshing beverages.",

      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: catDessertsId,
      name: "Desserts",
      description: "Sweet treats to finish your meal.",

      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },],
  inv_categories: [
    {
      id: invCatMeatId,
      name: "Meat & Poultry",
      description: "Inventory products related to meat and poultry.",

      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: invCatDairyId,
      name: "Dairy",
      description: "Inventory products related to dairy.",

      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: invCatProduceId,
      name: "Produce",
      description: "Inventory products related to fresh fruits and vegetables.",

      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: invCatBeveragesId,
      name: "Beverages (Inventory)",
      description: "Inventory products related to drinks and beverages.",

      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: invCatMiscId,
      name: "Miscellaneous",
      description: "Miscellaneous inventory products.",

      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    }
  ],
  foods: [
    {
      "id": "foodBurgerId",
      "name": "Classic Burger",
      "description": "A delicious classic beef burger with lettuce, tomato, and cheese.",
      "price": 9.99,
      "category_id": "catMainId",
      "image_url": "/images/classic-burger.jpg",
      "preparation_time": 15,
      "allergens": ["Gluten", "Dairy"],
      "created_at": "2024-05-15T10:00:00Z",
      "updated_at": "2024-05-15T10:00:00Z",
      "tenant_id": "tenantId",
      "recipes": [
        {
          "id": "recipeBurgerPattyId",
          "food_id": "foodBurgerId",
          "inventory_product_id": "invBeefId",
          "quantity_used": 1,
          "unit_of_measure": "unit-1",
          "created_at": "2024-05-15T10:00:00Z",
          "updated_at": "2024-05-15T10:00:00Z",

        },
        {
          "id": "recipeBurgerBunId",
          "food_id": "foodBurgerId",
          "inventory_product_id": "invBunId",
          "quantity_used": 1,
          "unit_of_measure": "unit-1",
          "created_at": "2024-05-15T10:00:00Z",
          "updated_at": "2024-05-15T10:00:00Z",

        },
        {
          "id": "recipeLettuceId",
          "food_id": "foodBurgerId",
          "inventory_product_id": "invLettuceId",
          "quantity_used": 15,
          "unit_of_measure": "unit-g",
          "created_at": "2024-05-15T10:00:00Z",
          "updated_at": "2024-05-15T10:00:00Z",

        },
        {
          "id": "recipeTomatoId",
          "food_id": "foodBurgerId",
          "inventory_product_id": "invTomatoId",
          "quantity_used": 20,
          "unit_of_measure": "unit-g",
          "created_at": "2024-05-15T10:00:00Z",
          "updated_at": "2024-05-15T10:00:00Z",

        },
        {
          "id": "recipeCheeseId",
          "food_id": "foodBurgerId",
          "inventory_product_id": "invCheeseId",
          "quantity_used": 1,
          "unit_of_measure": "unit-1",
          "created_at": "2024-05-15T10:00:00Z",
          "updated_at": "2024-05-15T10:00:00Z",

        }
      ]
    },
    {
      "id": "foodSaladId",
      "name": "Caesar Salad",
      "description": "Fresh romaine lettuce with Caesar dressing, croutons, and parmesan cheese.",
      "price": 7.50,
      "category_id": "catMainId",
      "image_url": "/images/caesar-salad.jpg",
      "preparation_time": 10,
      "allergens": ["Gluten", "Dairy", "Fish"],
      "created_at": "2024-05-15T10:05:00Z",
      "updated_at": "2024-05-15T10:05:00Z",
      "tenant_id": "tenantId",
      "recipes": [
        {
          "id": "recipeRomaineId",
          "food_id": "foodSaladId",
          "inventory_product_id": "inv-prod-6",
          "quantity_used": 100,
          "unit_of_measure": "unit-g",
          "created_at": "2024-05-15T10:05:00Z",
          "updated_at": "2024-05-15T10:05:00Z",

        },
        {
          "id": "recipeCaesarDressingId",
          "food_id": "foodSaladId",
          "inventory_product_id": "inv-prod-7",
          "quantity_used": 30,
          "unit_of_measure": "unit-ml",
          "created_at": "2024-05-15T10:05:00Z",
          "updated_at": "2024-05-15T10:05:00Z",

        },
        {
          "id": "recipeCroutonsId",
          "food_id": "foodSaladId",
          "inventory_product_id": "inv-prod-8",
          "quantity_used": 20,
          "unit_of_measure": "unit-g",
          "created_at": "2024-05-15T10:05:00Z",
          "updated_at": "2024-05-15T10:05:00Z",

        },
        {
          "id": "recipeParmesanId",
          "food_id": "foodSaladId",
          "inventory_product_id": "inv-prod-9",
          "quantity_used": 15,
          "unit_of_measure": "unit-g",
          "created_at": "2024-05-15T10:05:00Z",
          "updated_at": "2024-05-15T10:05:00Z",

        }
      ]
    },
    {
      "id": "foodFriesId",
      "name": "French Fries",
      "description": "Crispy fried potatoes with a pinch of salt.",
      "price": 3.50,
      "category_id": "catSidesId",
      "image_url": "/images/fries.jpg",
      "preparation_time": 8,
      "allergens": [],
      "created_at": "2024-05-15T10:15:00Z",
      "updated_at": "2024-05-15T10:15:00Z",
      "tenant_id": "tenantId",
      "recipes": [
        {
          "id": "recipeFriesId",
          "food_id": "foodFriesId",
          "inventory_product_id": "invPotatoId",
          "quantity_used": 200,
          "unit_of_measure": "unit-g",
          "created_at": "2024-05-15T10:15:00Z",
          "updated_at": "2024-05-15T10:15:00Z",

        }
      ]
    },
    {
      "id": "foodCokeId",
      "name": "Coca-Cola",
      "description": "Classic Coca-Cola served chilled.",
      "price": 2.50,
      "category_id": "catDrinksId",
      "image_url": "/images/coca-cola.jpg",
      "preparation_time": 2,
      "allergens": [],
      "created_at": "2024-05-15T10:10:00Z",
      "updated_at": "2024-05-15T10:10:00Z",
      "tenant_id": "tenantId",
      "recipes": [
        {
          "id": "recipeCokeId",
          "food_id": "foodCokeId",
          "inventory_product_id": "invCokeCanId",
          "quantity_used": 1,
          "unit_of_measure": "unit-1",
          "created_at": "2024-05-15T10:10:00Z",
          "updated_at": "2024-05-15T10:10:00Z",

        }
      ]
    },
    {
      "id": "foodSandwichId",
      "name": "Grilled Chicken Sandwich",
      "description": "A juicy grilled chicken breast with fresh vegetables on toasted bread.",
      "price": 11.99,
      "category_id": "catMainId",
      "image_url": "/images/chicken-sandwich.jpg",
      "preparation_time": 20,
      "allergens": ["Gluten"],
      "created_at": "2024-05-15T10:20:00Z",
      "updated_at": "2024-05-15T10:20:00Z",
      "tenant_id": "tenantId",
      "recipes": [
        {
          "id": "recipeSandwichChickenId",
          "food_id": "foodSandwichId",
          "inventory_product_id": "invChickenBreastId",
          "quantity_used": 1,
          "unit_of_measure": "unit-1",
          "created_at": "2024-05-15T10:20:00Z",
          "updated_at": "2024-05-15T10:20:00Z",

        },
        {
          "id": "recipeSandwichBreadId",
          "food_id": "foodSandwichId",
          "inventory_product_id": "invBreadId",
          "quantity_used": 2,
          "unit_of_measure": "unit-sl",
          "created_at": "2024-05-15T10:20:00Z",
          "updated_at": "2024-05-15T10:20:00Z",

        }
      ]
    },
    {
      "id": "foodCakeId",
      "name": "Chocolate Lava Cake",
      "description": "A rich chocolate cake with a warm, gooey center, served with vanilla ice cream.",
      "price": 6.99,
      "category_id": "catDessertsId",
      "image_url": "/images/lava-cake.jpg",
      "preparation_time": 25,
      "allergens": ["Dairy", "Gluten", "Egg"],
      "created_at": "2024-05-15T10:25:00Z",
      "updated_at": "2024-05-15T10:25:00Z",
      "tenant_id": "tenantId",
      "recipes": [
        {
          "id": "recipeCakeChocolateId",
          "food_id": "foodCakeId",
          "inventory_product_id": "invChocolateId",
          "quantity_used": 50,
          "unit_of_measure": "unit-g",
          "created_at": "2024-05-15T10:25:00Z",
          "updated_at": "2024-05-15T10:25:00Z",

        },
        {
          "id": "recipeCakeFlourId",
          "food_id": "foodCakeId",
          "inventory_product_id": "invFlourId",
          "quantity_used": 20,
          "unit_of_measure": "unit-g",
          "created_at": "2024-05-15T10:25:00Z",
          "updated_at": "2024-05-15T10:25:00Z",

        },
        {
          "id": "recipeCakeEggId",
          "food_id": "foodCakeId",
          "inventory_product_id": "invEggId",
          "quantity_used": 1,
          "unit_of_measure": "unit-1",
          "created_at": "2024-05-15T10:25:00Z",
          "updated_at": "2024-05-15T10:25:00Z",

        }
      ]
    }
  ],
  recipes: [
    {
      "id": "recipeBurgerPattyId",
      "food_id": "foodBurgerId",
      "inventory_product_id": "invBeefId",
      "quantity_used": 1,
      "unit_of_measure": "unit-1",
      "created_at": "2024-05-15T10:00:00Z",
      "updated_at": "2024-05-15T10:00:00Z",

    },
    {
      "id": "recipeBurgerBunId",
      "food_id": "foodBurgerId",
      "inventory_product_id": "invBunId",
      "quantity_used": 1,
      "unit_of_measure": "unit-1",
      "created_at": "2024-05-15T10:00:00Z",
      "updated_at": "2024-05-15T10:00:00Z",

    },
    {
      "id": "recipeLettuceId",
      "food_id": "foodBurgerId",
      "inventory_product_id": "invLettuceId",
      "quantity_used": 15,
      "unit_of_measure": "unit-g",
      "created_at": "2024-05-15T10:00:00Z",
      "updated_at": "2024-05-15T10:00:00Z",

    },
    {
      "id": "recipeTomatoId",
      "food_id": "foodBurgerId",
      "inventory_product_id": "invTomatoId",
      "quantity_used": 20,
      "unit_of_measure": "unit-g",
      "created_at": "2024-05-15T10:00:00Z",
      "updated_at": "2024-05-15T10:00:00Z",

    },
    {
      "id": "recipeCheeseId",
      "food_id": "foodBurgerId",
      "inventory_product_id": "invCheeseId",
      "quantity_used": 1,
      "unit_of_measure": "unit-1",
      "created_at": "2024-05-15T10:00:00Z",
      "updated_at": "2024-05-15T10:00:00Z",

    },
    {
      "id": "recipeRomaineId",
      "food_id": "foodSaladId",
      "inventory_product_id": "inv-prod-6",
      "quantity_used": 100,
      "unit_of_measure": "unit-g",
      "created_at": "2024-05-15T10:05:00Z",
      "updated_at": "2024-05-15T10:05:00Z",

    },
    {
      "id": "recipeCaesarDressingId",
      "food_id": "foodSaladId",
      "inventory_product_id": "inv-prod-7",
      "quantity_used": 30,
      "unit_of_measure": "unit-ml",
      "created_at": "2024-05-15T10:05:00Z",
      "updated_at": "2024-05-15T10:05:00Z",

    },
    {
      "id": "recipeCroutonsId",
      "food_id": "foodSaladId",
      "inventory_product_id": "inv-prod-8",
      "quantity_used": 20,
      "unit_of_measure": "unit-g",
      "created_at": "2024-05-15T10:05:00Z",
      "updated_at": "2024-05-15T10:05:00Z",

    },
    {
      "id": "recipeParmesanId",
      "food_id": "foodSaladId",
      "inventory_product_id": "inv-prod-9",
      "quantity_used": 15,
      "unit_of_measure": "unit-g",
      "created_at": "2024-05-15T10:05:00Z",
      "updated_at": "2024-05-15T10:05:00Z",

    },
    {
      "id": "recipeFriesId",
      "food_id": "foodFriesId",
      "inventory_product_id": "invPotatoId",
      "quantity_used": 200,
      "unit_of_measure": "unit-g",
      "created_at": "2024-05-15T10:15:00Z",
      "updated_at": "2024-05-15T10:15:00Z",

    },
    {
      "id": "recipeCokeId",
      "food_id": "foodCokeId",
      "inventory_product_id": "invCokeCanId",
      "quantity_used": 1,
      "unit_of_measure": "unit-1",
      "created_at": "2024-05-15T10:10:00Z",
      "updated_at": "2024-05-15T10:10:00Z",

    },
    {
      "id": "recipeSandwichChickenId",
      "food_id": "foodSandwichId",
      "inventory_product_id": "invChickenBreastId",
      "quantity_used": 1,
      "unit_of_measure": "unit-1",
      "created_at": "2024-05-15T10:20:00Z",
      "updated_at": "2024-05-15T10:20:00Z",

    },
    {
      "id": "recipeSandwichBreadId",
      "food_id": "foodSandwichId",
      "inventory_product_id": "invBreadId",
      "quantity_used": 2,
      "unit_of_measure": "unit-sl",
      "created_at": "2024-05-15T10:20:00Z",
      "updated_at": "2024-05-15T10:20:00Z",

    },
    {
      "id": "recipeCakeChocolateId",
      "food_id": "foodCakeId",
      "inventory_product_id": "invChocolateId",
      "quantity_used": 50,
      "unit_of_measure": "unit-g",
      "created_at": "2024-05-15T10:25:00Z",
      "updated_at": "2024-05-15T10:25:00Z",

    },
    {
      "id": "recipeCakeFlourId",
      "food_id": "foodCakeId",
      "inventory_product_id": "invFlourId",
      "quantity_used": 20,
      "unit_of_measure": "unit-g",
      "created_at": "2024-05-15T10:25:00Z",
      "updated_at": "2024-05-15T10:25:00Z",

    },
    {
      "id": "recipeCakeEggId",
      "food_id": "foodCakeId",
      "inventory_product_id": "invEggId",
      "quantity_used": 1,
      "unit_of_measure": "unit-1",
      "created_at": "2024-05-15T10:25:00Z",
      "updated_at": "2024-05-15T10:25:00Z",

    }
  ],
  inventory_products: [
    {
      "id": "invBeefId",
      "name": "Beef Patty (1/4 lb)",
      "description": "Pre-made quarter-pound beef patty.",
      "inv_category_id": "invCatMeatId",
      "unit_of_measure": "unit-1",
      "supplier_id": "sup-1",
      "reorder_level": 50,
      "created_at": "2024-05-15T09:00:00Z",
      "updated_at": "2024-05-15T09:00:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invBunId",
      "name": "Sesame Burger Buns",
      "description": "Pack of 12 burger buns with sesame seeds.",
      "inv_category_id": "invCatPantryId",
      "unit_of_measure": "unit-1",
      "supplier_id": "sup-2",
      "reorder_level": 10,
      "created_at": "2024-05-15T09:05:00Z",
      "updated_at": "2024-05-15T09:05:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invLettuceId",
      "name": "Romaine Lettuce",
      "description": "Head of romaine lettuce.",
      "inv_category_id": "invCatProduceId",
      "unit_of_measure": "unit-1",
      "supplier_id": "sup-3",
      "reorder_level": 20,
      "created_at": "2024-05-15T09:10:00Z",
      "updated_at": "2024-05-15T09:10:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invTomatoId",
      "name": "Beefsteak Tomatoes",
      "description": "Large, ripe beefsteak tomatoes.",
      "inv_category_id": "invCatProduceId",
      "unit_of_measure": "unit-g",
      "supplier_id": "sup-3",
      "reorder_level": 15,
      "created_at": "2024-05-15T09:15:00Z",
      "updated_at": "2024-05-15T09:15:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invCheeseId",
      "name": "Cheddar Cheese Slices",
      "description": "Individually wrapped cheddar cheese slices.",
      "inv_category_id": "invCatDairyId",
      "unit_of_measure": "unit-sl",
      "supplier_id": "sup-1",
      "reorder_level": 100,
      "created_at": "2024-05-15T09:20:00Z",
      "updated_at": "2024-05-15T09:20:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "inv-prod-6",
      "name": "Romaine Lettuce (Case)",
      "description": "Case of 12 heads of romaine lettuce.",
      "inv_category_id": "invCatProduceId",
      "unit_of_measure": "unit-1",
      "supplier_id": "sup-3",
      "reorder_level": 5,
      "created_at": "2024-05-15T09:25:00Z",
      "updated_at": "2024-05-15T09:25:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "inv-prod-7",
      "name": "Caesar Dressing (Gallon)",
      "description": "One gallon container of Caesar dressing.",
      "inv_category_id": "invCatPantryId",
      "unit_of_measure": "unit-ml",
      "supplier_id": "sup-1",
      "reorder_level": 3,
      "created_at": "2024-05-15T09:30:00Z",
      "updated_at": "2024-05-15T09:30:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "inv-prod-8",
      "name": "Croutons (Bag)",
      "description": "Large bag of croutons.",
      "inv_category_id": "invCatPantryId",
      "unit_of_measure": "unit-1",
      "supplier_id": "sup-2",
      "reorder_level": 5,
      "created_at": "2024-05-15T09:35:00Z",
      "updated_at": "2024-05-15T09:35:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "inv-prod-9",
      "name": "Parmesan Cheese (Container)",
      "description": "Container of shredded parmesan cheese.",
      "inv_category_id": "invCatDairyId",
      "unit_of_measure": "unit-1",
      "supplier_id": "sup-1",
      "reorder_level": 4,
      "created_at": "2024-05-15T09:40:00Z",
      "updated_at": "2024-05-15T09:40:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invPotatoId",
      "name": "Russet Potatoes",
      "description": "Bag of russet potatoes for making fries.",
      "inv_category_id": "invCatProduceId",
      "unit_of_measure": "unit-g",
      "supplier_id": "sup-3",
      "reorder_level": 20,
      "created_at": "2024-05-15T09:45:00Z",
      "updated_at": "2024-05-15T09:45:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invCokeCanId",
      "name": "Coca-Cola Can (12 oz)",
      "description": "Single can of Coca-Cola.",
      "inv_category_id": "invCatBeveragesId",
      "unit_of_measure": "unit-1",
      "supplier_id": "sup-4",
      "reorder_level": 50,
      "created_at": "2024-05-15T09:50:00Z",
      "updated_at": "2024-05-15T09:50:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invChickenBreastId",
      "name": "Chicken Breast (Boneless)",
      "description": "Boneless, skinless chicken breast.",
      "inv_category_id": "invCatMeatId",
      "unit_of_measure": "unit-g",
      "supplier_id": "sup-1",
      "reorder_level": 30,
      "created_at": "2024-05-15T09:55:00Z",
      "updated_at": "2024-05-15T09:55:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invBreadId",
      "name": "Sliced Sandwich Bread",
      "description": "Loaf of sliced white bread.",
      "inv_category_id": "invCatPantryId",
      "unit_of_measure": "unit-1",
      "supplier_id": "sup-2",
      "reorder_level": 10,
      "created_at": "2024-05-15T10:00:00Z",
      "updated_at": "2024-05-15T10:00:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invChocolateId",
      "name": "Dark Chocolate Chips",
      "description": "Bag of dark chocolate chips for baking.",
      "inv_category_id": "invCatPantryId",
      "unit_of_measure": "unit-1",
      "supplier_id": "sup-5",
      "reorder_level": 5,
      "created_at": "2024-05-15T10:05:00Z",
      "updated_at": "2024-05-15T10:05:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invFlourId",
      "name": "All-Purpose Flour",
      "description": "Bag of all-purpose flour.",
      "inv_category_id": "invCatPantryId",
      "unit_of_measure": "unit-kg",
      "supplier_id": "sup-5",
      "reorder_level": 5,
      "created_at": "2024-05-15T10:10:00Z",
      "updated_at": "2024-05-15T10:10:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    },
    {
      "id": "invEggId",
      "name": "Large Eggs (Dozen)",
      "description": "A carton of a dozen large eggs.",
      "inv_category_id": "invCatDairyId",
      "unit_of_measure": "unit-1",
      "supplier_id": "sup-1",
      "reorder_level": 10,
      "created_at": "2024-05-15T10:15:00Z",
      "updated_at": "2024-05-15T10:15:00Z",
      "tenant_id": "tenantId",
      "sku": "",
      "unit_cost": 0,
      "quantity_in_stock": 0
    }
  ],
  customers: [
    {
      id: "cust-001",
      store_id: storeId,
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@email.com",
      phone_number: "555-1234",
      loyalty_points: 150,
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: "cust-002",
      store_id: storeId,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@email.com",
      phone_number: "555-5678",
      loyalty_points: 75,
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
  ],
  tables: [
    {
      id: "table-01",
      store_id: storeId,
      name: "Table 1",
      capacity: 4,
      location: "Indoor",
      status: "occupied",
      current_order_id: orderId1,
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: "table-02",
      store_id: storeId,
      name: "Table 2",
      capacity: 2,
      location: "Indoor",
      status: "available",
      current_order_id: null,
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: "table-03",
      store_id: storeId,
      name: "Patio 1",
      capacity: 6,
      location: "Outdoor",
      status: "reserved",
      current_order_id: null,
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
  ],
  reservations: [
    {
      id: "res-001",
      store_id: storeId,
      table_id: "table-03",
      customer_id: "cust-001",
      number_of_guests: 4,
      date_time: "2025-07-02T19:00:00Z",
      status: "confirmed",
      notes: "Birthday party.",
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
  ],
  orders: [
    {
      id: orderId1,
      store_id: storeId,
      table_id: "table-01",
      customer_id: null,
      total_amount: 17.98,
      status: "preparing",
      notes: "No tomatoes on the burger.",
      created_at: "2025-07-01T12:00:00Z",
      updated_at: "2025-07-01T12:15:00Z",
      items: [
        {
          id: "oi-001",
          order_id: orderId1,
          food_id: foodBurgerId,
          quantity: 1,
          price: 12.99,
          sub_total: 12.99,
          notes: "No tomato",
          price_at_sale: 12.99,
          name: "Classic Burger",
          created_at: "2025-07-01T12:00:00Z",
          updated_at: "2025-07-01T12:00:00Z",
        },
        {
          id: "oi-002",
          order_id: orderId1,
          food_id: foodFriesId,
          quantity: 1,
          price: 4.99,
          sub_total: 4.99,
          notes: "",
          price_at_sale: 4.99,
          name: "French Fries",
          created_at: "2025-07-01T12:00:00Z",
          updated_at: "2025-07-01T12:00:00Z",
        },
      ],
      subtotal_amount: 17.98,
      tax_amount: 1.8,
      discount_amount: 0,
      employee_id: "emp-2",
      order_type: "dine-in",
      payment_status: "pending",
      payment_method: "",
    },
    {
      id: orderId2,
      store_id: storeId,
      table_id: null,
      customer_id: "cust-002",
      total_amount: 8.99,
      status: "new",
      notes: "Takeaway order.",
      created_at: "2025-07-01T12:30:00Z",
      updated_at: "2025-07-01T12:30:00Z",
      items: [
        {
          id: "oi-003",
          order_id: orderId2,
          food_id: foodSaladId,
          quantity: 1,
          price: 8.99,
          sub_total: 8.99,
          notes: "",
          price_at_sale: 8.99,
          name: "Garden Salad",
          created_at: "2025-07-01T12:30:00Z",
          updated_at: "2025-07-01T12:30:00Z",
        },
      ],
      subtotal_amount: 8.99,
      tax_amount: 0.9,
      discount_amount: 0,
      employee_id: "emp-4",
      order_type: "takeaway",
      payment_status: "pending",
      payment_method: "",
    },
  ],
  order_items: [],
  payment_methods: [
    {
      id: "pm-1",
      name: "Cash",
      description: "Payment by physical currency.",
      is_active: true,
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: "pm-2",
      name: "Credit Card",
      description: "Payment by credit or debit card.",
      is_active: true,
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: "pm-3",
      name: "Mobile Pay",
      description: "Payment via mobile application.",
      is_active: true,
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
  ],
  suppliers: [
    {
      id: "sup-1",
      name: "Meat & Dairy Inc.",
      contact_person: "Bob Johnson",
      email: "bob.j@meatanddairy.com",
      phone: "555-222-3333",
      address: "444 Farm Rd, Countryside",
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: "sup-2",
      name: "Fresh Greens Co.",
      contact_person: "Alice Smith",
      email: "alice.s@freshgreens.com",
      phone: "555-444-5555",
      address: "555 Green St, Garden City",
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: "sup-3",
      name: "Frozen Goods Corp.",
      contact_person: "Charlie Davis",
      email: "charlie.d@frozengoods.com",
      phone: "555-666-7777",
      address: "666 Ice Rd, Winterville",
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
    {
      id: "sup-4",
      name: "Beverage Distributors",
      contact_person: "Diana Evans",
      email: "diana.e@bevdist.com",
      phone: "555-888-9999",
      address: "777 Soda Ave, Drinkstown",
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
    },
  ],
  units: [
    {
      "id": "unit-1",
      "name": "unit",
      "symbol": "pc",
      "created_at": "2025-07-01T00:00:00Z",
      "updated_at": "2025-07-01T00:00:00Z"
    },
    {
      "id": "unit-g",
      "name": "grams",
      "symbol": "g",
      "created_at": "2025-07-01T00:00:00Z",
      "updated_at": "2025-07-01T00:00:00Z"
    },
    {
      "id": "unit-ml",
      "name": "milliliters",
      "symbol": "ml",
      "created_at": "2025-07-01T00:00:00Z",
      "updated_at": "2025-07-01T00:00:00Z"
    },
    {
      "id": "unit-sl",
      "name": "slice",
      "symbol": "sl",
      "created_at": "2025-07-01T00:00:00Z",
      "updated_at": "2025-07-01T00:00:00Z"
    },
    {
      "id": "unit-kg",
      "name": "kilograms",
      "symbol": "kg",
      "created_at": "2025-07-01T00:00:00Z",
      "updated_at": "2025-07-01T00:00:00Z"
    }
  ],
  taxes: [
    {
      id: "tax-1",
      name: "VAT",
      percentage: 0.1,
      created_at: "2025-07-01T00:00:00Z",
      updated_at: "2025-07-01T00:00:00Z",
      is_active: true
    },
  ],
};
