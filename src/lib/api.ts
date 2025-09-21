// src/app/lib/api.ts
import useSWR from "swr";
import { useToast } from "@chakra-ui/react";
// Corrected imports based on updated entities.ts
import {
  Order,
  Food, // Ensure Food has recipe_items if used for inventory deduction
  Category,
  Customer,
  Table,
  OrderItem,
  InventoryProduct, // Import InventoryProduct
  JobTitle, // <--- ADDED: Import JobTitle
  Employee, // <--- ADDED: Import Employee for login function
  AccessRole, // <--- ADDED: Import AccessRole for login function
  User, // <--- ADDED: Import User for login function
  Store, // <-- ADDED: Import Store to get tenant_id
  RecipeItem,
  Shift,
  TimesheetEntry,
  Payroll,
  PayrollSettings,
} from "./config/entities";
import { sampleData } from "./data/sample"; // Directly import sampleData for easier access

// Generic fetcher function for useSWR
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }
    return res.json();
  });

export async function fetchData(
  resource: string,
  id?: string,
  data?: Record<string, any>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  storeId?: string, // Corrected: Add storeId parameter
): Promise<any | null> {
  console.log(
    `API call: ${method} ${resource}${id ? "/" + id : ""}`,
    data || ""
  );

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Normalize resource, e.g. "api/users" -> "users"
  const normalizedResource = resource.replace(/^\/?api\/?/, "");

  // Read entire mock data object from localStorage
  let mockData: Record<string, any[]> = {};
  try {
    const stored = localStorage.getItem("mockData");
    if (stored) {
      mockData = JSON.parse(stored);
      console.log(`fetchData: Found mockData in localStorage.`);
    } else {
      // Initialize localStorage with full sampleData copy
      mockData = JSON.parse(JSON.stringify(sampleData));
      localStorage.setItem("mockData", JSON.stringify(mockData));
      console.log(`fetchData: Initialized mockData in localStorage.`);
    }
  } catch (e) {
    console.error(`Error reading/parsing localStorage mockData:`, e);
    mockData = JSON.parse(JSON.stringify(sampleData));
  }

  let currentData: any[] = mockData[normalizedResource] || [];

  // Corrected: Filter data by store_id if applicable
  const resourcesToFilterByStore = ["orders", "foods", "categories", "customers", "tables", "reservations", "inventory_products"];
  if (storeId && resourcesToFilterByStore.includes(normalizedResource)) {
    currentData = currentData.filter(item => item.store_id === storeId);
  }

  let responseData: any = null;

  switch (method) {
    case "GET":
      if (normalizedResource === "foods") {
        const recipes = mockData["recipes"] || [];
        const foodsWithRecipes = (currentData as Food[]).map(food => ({
          ...food,
          recipes: recipes.filter(recipe => recipe.food_id === food.id),
        }));
        responseData = id
          ? foodsWithRecipes.find((item) => item.id === id)
          : foodsWithRecipes;
      } else {
        responseData = id
          ? currentData.find((item) => item.id === id)
          : currentData;
      }
      break;

    case "POST":
      const newItem = {
        id: `new-${normalizedResource}-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data,
      };
      currentData.push(newItem);
      responseData = newItem;
      break;

    case "PUT":
      if (!id) throw new Error(`ID required for PUT on ${resource}`);
      const idx = currentData.findIndex((item) => item.id === id);
      if (idx === -1) throw new Error(`${normalizedResource} with ID ${id} not found`);
      const updatedItem = {
        ...currentData[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      currentData[idx] = updatedItem;
      responseData = updatedItem;
      break;

    case "DELETE":
      if (!id) throw new Error(`ID required for DELETE on ${resource}`);
      const lengthBefore = currentData.length;
      currentData = currentData.filter((item) => item.id !== id);
      if (currentData.length === lengthBefore) {
        throw new Error(`${normalizedResource} with ID ${id} not found`);
      }
      responseData = { message: `${normalizedResource} deleted successfully.` };
      break;

    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }

  // Update mockData and persist whole object back to localStorage
  mockData[normalizedResource] = currentData;
  localStorage.setItem("mockData", JSON.stringify(mockData));

  return responseData;
}

/**
 * Simulates employee login.
 * In a real application, this would involve calling a backend authentication endpoint.
 * @param email The employee's email.
 * @param password The employee's password.
 * @returns The Employee object with store_id if login is successful.
 * @throws An error if login fails (e.g., invalid credentials).
 */
export async function loginEmployee(email: string, password: string): Promise<Employee & { store_id: string }> {
  console.log('loginEmployee: Starting login process for email:', email);
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 1. Fetch users from the mock API (which now loads from localStorage or sampleData)
  console.log('loginEmployee: Fetching all users...');
  const users: User[] = await fetchData('api/users') as User[];
  console.log('loginEmployee: Users fetched (count):', users.length);

  // 2. Find user by email
  console.log('loginEmployee: Searching for user with email:', email);
  const foundUser = users.find(
    (user) => user.email === email
  );

  if (!foundUser) {
    console.log('loginEmployee: User not found for email:', email);
    throw new Error('Invalid email or password.');
  }
  console.log('loginEmployee: User found:', foundUser.id, " ", foundUser.email, " - ", foundUser.password);

  // 3. Simulate password check using the password from sample data
  // IMPORTANT: In a real app, NEVER do this client-side with plain text.
  // This is purely for demonstration with mock data.
  console.log('loginEmployee: Simulating password check with sample data password...');
  const isPasswordCorrect = password === foundUser.password; // Use password from foundUser

  if (!isPasswordCorrect) {
    console.log('loginEmployee: Incorrect password for user:', foundUser.id);
    throw new Error('Invalid email or password.');
  }
  console.log('loginEmployee: Password correct for user:', foundUser.id);

  // 4. If user is authenticated, fetch employees
  console.log('loginEmployee: User authenticated. Fetching all employees...');
  const employees: Employee[] = await fetchData('api/employees') as Employee[];
  console.log('loginEmployee: Employees fetched (count):', employees.length);

  // 5. Find the employee linked to this user
  console.log('loginEmployee: Searching for employee linked to user_id:', foundUser.id);
  const foundEmployee = employees.find(
    (employee) => employee.user_id === foundUser.id
  );

  if (!foundEmployee) {
    console.log('loginEmployee: No employee found for user_id:', foundUser.id);
    throw new Error('No employee found for this user account.');
  }
  console.log('loginEmployee: Employee found:', foundEmployee.id, foundEmployee.first_name);

  // Corrected: Return the employee with the store_id
  const authenticatedEmployee = { ...foundEmployee, store_id: foundEmployee.store_id };

  return authenticatedEmployee;
}

/**
 * Deletes an item from a specified resource.
 * @param resource The name of the resource (e.g., 'employees', 'foods').
 * @param id The ID of the item to delete.
 * @returns A success message or throws an error.
 */
export async function deleteItem(resource: string, id: string): Promise<{ message: string }> {
  try {
    const result = await fetchData(resource, id, undefined, "DELETE");
    return result;
  } catch (error: any) {
    console.error(`Error deleting item from ${resource} with ID ${id}:`, error);
    throw error;
  }
}


// Custom hook for fetching all menu items (Food)
export const useFoods = () => {
  const { data, error, isLoading, mutate } = useSWR<Food[]>(
    "/api/foods",
    fetcher
  );
  return {
    menuItems: data, // Renamed from 'foods' to 'menuItems' for clarity in POS context
    isLoading,
    isError: error,
    refreshMenuItems: mutate,
  };
};

// Custom hook for fetching all categories
export const useCategories = () => {
  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    "/api/categories",
    fetcher
  );
  return {
    categories: data,
    isLoading,
    isError: error,
    refreshCategories: mutate,
  };
};

// Custom hook for fetching all tables
export const useTables = () => {
  const { data, error, isLoading, mutate } = useSWR<Table[]>(
    "/api/tables",
    fetcher
  );
  return {
    tables: data,
    isLoading,
    isError: error,
    refreshTables: mutate,
  };
};

// Custom hook for fetching a customer by ID.
export const useCustomerById = (customerId?: string) => {
  const { data, error, isLoading, mutate } = useSWR<Customer>(
    customerId ? `/api/customers/${customerId}` : null, // Corrected endpoint to /api/customers
    fetcher
  );
  return {
    customer: data,
    isLoading,
    isError: error,
    refreshCustomer: mutate,
  };
};

// Custom hook for handling order creation.
export const useCreateOrder = () => {
  const toast = useToast(); // useToast is correctly inside a custom hook

  const createOrder = async (order: Order) => {
    try {
      // Simulate API call for creating an order
      const newOrder = await fetchData("orders", undefined, order, "POST");

      toast({
        title: "Order created.",
        description: "Your order has been successfully placed.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return newOrder;
    } catch (error: any) {
      toast({
        title: "Order creation failed.",
        description: error.message || "There was an error placing your order.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error; // Re-throw to allow component to handle
    }
  };
  return { createOrder };
};

// Custom hook for fetching all orders
export const useOrders = () => {
  const { data, error, isLoading, mutate } = useSWR<Order[]>(
    "/api/orders",
    fetcher
  );
  return {
    orders: data,
    isLoading,
    isError: error,
    refreshOrders: mutate,
  };
};

// Custom hook for updating an order (including status changes)
export const useUpdateOrder = () => {
  const toast = useToast();

  const updateOrder = async (orderId: string, updatedOrder: Partial<Order>) => {
    try {
      // Simulate API call for updating an order
      const result = await fetchData("orders", orderId, updatedOrder, "PUT");

      // Check for stock warnings returned from fetchData (if any)
      if (result && result.stockWarnings && result.stockWarnings.length > 0) {
        result.stockWarnings.forEach((warning: string) => {
          toast({
            title: "Inventory Warning",
            description: warning,
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        });
      }

      toast({
        title: "Order Updated.",
        description: "Order status has been successfully updated.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Order Update Failed.",
        description: error.message || "There was an error updating the order.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };
  return { updateOrder };
};

// Custom hook for fetching all inventory products
export const useInventoryProducts = () => {
  const { data, error, isLoading, mutate } = useSWR<InventoryProduct[]>(
    "/api/inventory_products",
    fetcher
  );
  return {
    inventoryProducts: data,
    isLoading,
    isError: error,
    refreshInventoryProducts: mutate,
  };
};

/**
 * Custom hook for fetching orders by status (e.g., 'new', 'preparing', 'ready', 'served').
 * @param status The status to filter orders by.
 */
export const useOrdersByStatus = (status?: string) => {
  const { data, error, isLoading, mutate } = useSWR<Order[]>(
    status ? `/api/orders?status=${status}` : "/api/orders",
    fetcher
  );

  // Filter client-side for demonstration purposes, as mock API doesn't handle query params
  const filteredData = data?.filter((order) =>
    status ? order.status === status : true
  );

  return {
    orders: filteredData,
    isLoading,
    isError: error,
    refreshOrders: mutate,
  };
};

// Function to fetch a single JobTitle by ID
export async function fetchJobTitleById(id: string): Promise<JobTitle | null> {
  const jobTitle = await fetchData("job_titles", id);
  return jobTitle as JobTitle | null;
}


// --- API functions for Shift Management ---

// Function to fetch shifts
export async function getShifts(): Promise<Shift[]> {
  const shifts = await fetchData("shifts");
  return shifts;
}

// Function to fetch employees
export async function getEmployees(): Promise<Employee[]> {
  const employees = await fetchData("employees");
  return employees;
}

// Function to create a single shift
export async function createShift(
  newShift: Partial<Shift>
): Promise<Shift> {
  const createdShift = await fetchData("shifts", undefined, newShift, "POST");
  return createdShift;
}

// Function to update a single shift
export async function updateShift(
  shiftId: string,
  updates: Partial<Shift>
): Promise<Shift> {
  const updatedShift = await fetchData("shifts", shiftId, updates, "PUT");
  return updatedShift;
}

// Function to update the active status of a shift (instead of deleting)
export async function updateShiftStatus(
  shiftId: string,
  isActive: boolean
): Promise<Shift> {
  const updatedShift = await fetchData("shifts", shiftId, { active: isActive }, "PUT");
  return updatedShift;
}

// --- API functions for Timesheet Management ---
export async function clockIn(employeeId: string, storeId: string): Promise<TimesheetEntry> {
  const newTimesheetEntry = await fetchData("timesheets", undefined, {
    employee_id: employeeId,
    clock_in: new Date().toISOString(),
    clock_out: null,
    duration_minutes: 0,
    store_id: storeId
  }, "POST");
  return newTimesheetEntry;
}

export async function clockOut(timesheetId: string, storeId: string): Promise<TimesheetEntry> {
  const existingEntry = await fetchData("timesheets", timesheetId);
  if (!existingEntry) {
    throw new Error("Timesheet entry not found.");
  }
  const clockInTime = new Date(existingEntry.clock_in);
  const clockOutTime = new Date();
  const duration = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / 60000); // Duration in minutes
  const updatedEntry = await fetchData("timesheets", timesheetId, {
    clock_out: clockOutTime.toISOString(),
    duration_minutes: duration,
    store_id: storeId
  }, "PUT");
  return updatedEntry;
}

export async function getTimesheets(): Promise<TimesheetEntry[]> {
  const timesheets = await fetchData("timesheets");
  return timesheets;
}

// Add these functions to your api.ts file

// Payroll API functions
export async function getPayrolls(): Promise<Payroll[]> {
  const payrolls = await fetchData("payrolls");
  return payrolls;
}

export async function getPayrollById(id: string): Promise<Payroll | null> {
  const payroll = await fetchData("payrolls", id);
  return payroll;
}

export async function getPayrollInfo(employeeId: string): Promise<Payroll | null> {
  try {
    const payrolls = await getPayrolls();
    const currentPayroll = payrolls.find(p =>
      p.employee_id === employeeId &&
      p.status === "pending" &&
      new Date(p.pay_period_end) > new Date()
    );

    return currentPayroll || null;
  } catch (error) {
    console.error("Error fetching payroll info:", error);
    return null;
  }
}

export async function createPayroll(payrollData: Partial<Payroll>): Promise<Payroll> {
  const createdPayroll = await fetchData("payrolls", undefined, payrollData, "POST");
  return createdPayroll;
}

export async function updatePayroll(payrollId: string, updates: Partial<Payroll>): Promise<Payroll> {
  const updatedPayroll = await fetchData("payrolls", payrollId, updates, "PUT");
  return updatedPayroll;
}

export async function processPayroll(payrollId: string): Promise<Payroll> {
  const payroll = await updatePayroll(payrollId, { status: "processing" });

  // Simulate payroll processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  const processedPayroll = await updatePayroll(payrollId, { status: "paid" });
  return processedPayroll;
}

export async function getPayrollSettings(): Promise<PayrollSettings> {
  const settings = await fetchData("payroll_settings");
  if (!settings || settings.length === 0) {
    // Return default settings if none exist
    return {
      id: "default-settings",
      store_id: "default-store",
      default_payment_cycle: "bi-weekly",
      tax_rate: 0.20,
      overtime_multiplier: 1.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  return settings[0];
}

export async function updatePayrollSettings(settings: Partial<PayrollSettings>): Promise<PayrollSettings> {
  const currentSettings = await getPayrollSettings();
  const updatedSettings = await fetchData("payroll_settings", currentSettings.id, settings, "PUT");
  return updatedSettings;
}

// Helper function to calculate payroll
export async function calculatePayroll(employeeId: string, periodStart: string, periodEnd: string): Promise<Partial<Payroll>> {
  const timesheets = await getTimesheets();
  const settings = await getPayrollSettings();

  // Filter timesheets for the employee and period
  const employeeTimesheets = timesheets.filter(ts =>
    ts.employee_id === employeeId &&
    new Date(ts.clock_in) >= new Date(periodStart) &&
    new Date(ts.clock_in) <= new Date(periodEnd) &&
    ts.clock_out
  );

  // Calculate total hours
  let totalHours = 0;
  let overtimeHours = 0;

  employeeTimesheets.forEach(ts => {
    if (ts.duration_minutes) {
      const hours = ts.duration_minutes / 60;
      totalHours += hours;

      // Calculate overtime (hours over 40 per week)
      if (hours > 40) {
        overtimeHours += hours - 40;
        totalHours -= hours - 40; // Remove overtime from regular hours
      }
    }
  });

  // Get employee data for salary calculation
  const employees = await getEmployees();
  const employee = employees.find(e => e.id === employeeId);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const hourlyRate = employee.salary / 2080; // Assuming 2080 hours per year (40 hrs/week * 52 weeks)
  const regularPay = totalHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * settings.overtime_multiplier;
  const grossPay = regularPay + overtimePay;
  const taxDeductions = grossPay * settings.tax_rate;
  const netPay = grossPay - taxDeductions;

  return {
    employee_id: employeeId,
    pay_period_start: periodStart,
    pay_period_end: periodEnd,
    payment_cycle: settings.default_payment_cycle,
    gross_pay: grossPay,
    tax_deductions: taxDeductions,
    net_pay: netPay,
    hours_worked: totalHours,
    overtime_hours: overtimeHours,
    overtime_rate: settings.overtime_multiplier,
    status: "pending",
    store_id: employee.store_id
  };
}

// Add to your existing api.ts
export async function getLowStockItems(): Promise<InventoryProduct[]> {
  try {
    const products = await fetchData("inventory_products");
    return products.filter((product: InventoryProduct) =>
      product.quantity_in_stock <= product.reorder_level
    );
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    return [];
  }
}

export async function getPendingOrders(): Promise<any[]> {
  try {
    const orders = await getPurchaseOrders();
    return orders.filter((order: any) =>
      ['draft', 'pending-approval', 'approved', 'ordered'].includes(order.status)
    );
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    return [];
  }
}

// src/lib/api.ts
// Add these functions:

export async function getPurchaseOrders(): Promise<any[]> {
  const orders = await fetchData("purchase_orders");
  return orders;
}

export async function getGoodsReceipts(): Promise<any[]> {
  const receipts = await fetchData("goods_receipts");
  return receipts;
}

export async function getSuppliers(): Promise<any[]> {
  const suppliers = await fetchData("suppliers");
  return suppliers;
}

export async function getSites(): Promise<any[]> {
  const sites = await fetchData("sites");
  return sites;
}

export async function createPurchaseOrder(orderData: any): Promise<any> {
  const newOrder = await fetchData("purchase_orders", undefined, orderData, "POST");
  return newOrder;
}

export async function updatePurchaseOrder(orderId: string, orderData: any): Promise<any> {
  const updatedOrder = await fetchData("purchase_orders", orderId, orderData, "PUT");
  return updatedOrder;
}

export async function createGoodsReceipt(receiptData: any): Promise<any> {
  const newReceipt = await fetchData("goods_receipts", undefined, receiptData, "POST");

  // Update inventory quantities
  if (receiptData.received_items) {
    for (const item of receiptData.received_items) {
      if (item.condition === 'good') {
        const product = await fetchData("inventory_products", item.inventory_product_id);
        if (product) {
          await fetchData(
            "inventory_products",
            item.inventory_product_id,
            {
              quantity_in_stock: product.quantity_in_stock + item.received_quantity,
              last_restocked_at: new Date().toISOString()
            },
            "PUT"
          );
        }
      }
    }
  }

  return newReceipt;
}