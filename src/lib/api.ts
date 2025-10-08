import useSWR from "swr";
import { useToast } from "@chakra-ui/react";
import {
  Order,
  Food,
  Category,
  Customer,
  Table,
  OrderItem,
  InventoryProduct,
  JobTitle,
  Employee,
  AccessRole,
  User,
  Store,
  RecipeItem,
  Shift,
  TimesheetEntry,
  Payroll,
  PayrollSettings,
} from "./config/entities";

const BASE_URL = "http://127.0.0.1:8000/api";

// Interface for the new standard response format
interface StandardResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// Generic fetcher function for useSWR with auth headers - UPDATED
const fetcher = async (url: string) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log(`[API] 🔄 Fetching: ${url}`);
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const responseData: StandardResponse = await response.json();
  console.log(`[API] 🔄 Fetcher received:`, responseData);

  // Check if the response has an error code but successful HTTP status
  if (responseData.code >= 400) {
    throw new Error(responseData.message || `API error: ${responseData.code}`);
  }

  return responseData.data;
};

export async function fetchData(
  resource: string,
  id?: string,
  data?: Record<string, any>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<any | null> {

  // 1. Build the URL
  let cleanResource = resource.replace(/^\/|\/$/g, '')
    .replace(/^api\//i, '');
  const url = id
    ? `${BASE_URL}/${cleanResource}/${id}`
    : `${BASE_URL}/${cleanResource}`;

  console.log(`[API] 🚀 Starting ${method} request to: ${url}`);
  if (data) {
    console.log(`[API] 📦 Payload for ${method}:`, data);
  }

  // 2. Prepare Headers and Authorization
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log(`[API] 🔑 Authorization token added.`);
  }

  const options: RequestInit = {
    method,
    headers,
  };

  // 3. Add Body for POST/PUT methods
  if ((method === "POST" || method === "PUT") && data) {
    options.body = JSON.stringify(data);
  }

  // 4. Execute the Fetch Request
  const response = await fetch(url, options);

  // 5. Handle Errors - UPDATED for new error format
  if (!response.ok) {
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    let responseText = '';

    console.error(`[API] ❌ Request failed with status: ${response.status} (${response.statusText})`);

    try {
      responseText = await response.text();
      const errorJson: StandardResponse = responseText ? JSON.parse(responseText) : null;

      console.error(`[API] 📄 Raw error response body:`, responseText);

      // Check for the new standard error structure
      if (errorJson && errorJson.message) {
        errorMessage = errorJson.message;
        // Include details if available
        if (errorJson.hasOwnProperty('details') && errorJson.details) {
          errorMessage += ` - ${JSON.stringify(errorJson.details)}`;
        }
      } else if (responseText) {
        errorMessage = responseText;
      }

    } catch (e) {
      console.error(`[API] ⚠️ Failed to parse error response:`, e);
      errorMessage = responseText || errorMessage;
    }

    console.error(`[API] 🛑 Throwing formatted error: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  // 6. Return Data on Success - UPDATED to extract data from standard response

  // Handle 204 No Content
  if (response.status === 204) {
    console.log(`[API] ✅ Request successful (204 No Content).`);
    return null;
  }

  // Return parsed JSON for 200, 201, 202, etc.
  const finalResponse: StandardResponse = await response.json();
  console.log(`[API] ✅ Request successful (${response.status}). Full response:`, finalResponse);

  // Return the data part of the standard response
  return finalResponse.data;
}

// Authentication - UPDATED for new response format
export async function loginEmployee(email: string, password: string): Promise<Employee & { store_id: string }> {
  const url = `${BASE_URL}/login`;
  console.log('loginEmployee: Starting login process...');

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: email,
      password: password,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage = "Invalid email or password.";

    try {
      const errorData: StandardResponse = JSON.parse(responseText);
      errorMessage = errorData.message || errorMessage;
      console.error('Login API error:', errorData);
    } catch (e) {
      errorMessage = responseText || `Login failed: ${response.statusText}`;
      console.error('Login API error:', errorMessage);
    }

    throw new Error(errorMessage);
  }

  const loginResponse: StandardResponse<{ access_token: string; employee: Employee }> = await response.json();
  console.log('Login response:', loginResponse);

  const { access_token, employee } = loginResponse.data!;

  if (!employee) {
    throw new Error("Employee data not found in login response.");
  }

  localStorage.setItem('access_token', access_token);

  return {
    ...employee,
    store_id: employee.store_id
  };
}

// Core POS functions - THESE SHOULD NOW WORK CORRECTLY
export const useFoods = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/foods`, fetcher);
  return {
    menuItems: data, // This now contains the actual array of foods
    isLoading,
    isError: error,
    refreshMenuItems: mutate,
  };
};

export const useCategories = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/categories`, fetcher);
  return {
    categories: data, // This now contains the actual array of categories
    isLoading,
    isError: error,
    refreshCategories: mutate,
  };
};

export const useTables = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/tables`, fetcher);
  return {
    tables: data, // This now contains the actual array of tables
    isLoading,
    isError: error,
    refreshTables: mutate,
  };
};

export const useCreateOrder = () => {
  const toast = useToast();

  const createOrder = async (order: any) => {
    try {
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
      throw error;
    }
  };
  return { createOrder };
};

export const useOrders = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/orders`, fetcher);
  return {
    orders: data, // This now contains the actual array of orders
    isLoading,
    isError: error,
    refreshOrders: mutate,
  };
};

export const useUpdateOrder = () => {
  const toast = useToast();

  const updateOrder = async (orderId: string, updatedOrder: any) => {
    try {
      const result = await fetchData("orders", orderId, updatedOrder, "PUT");

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

export const useInventoryProducts = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/inventory_products`, fetcher);
  return {
    inventoryProducts: data, // This now contains the actual array of inventory products
    isLoading,
    isError: error,
    refreshInventoryProducts: mutate,
  };
};

// HR functions - UPDATED to handle new response format
export async function getEmployees(): Promise<any[]> {
  const response = await fetchData("employees");
  return response; // This is now the actual array
}

export async function getShifts(): Promise<any[]> {
  const response = await fetchData("shifts");
  return response; // This is now the actual array
}

export async function createShift(newShift: any): Promise<any> {
  const response = await fetchData("shifts", undefined, newShift, "POST");
  return response; // This is now the created shift object
}

export async function updateShift(shiftId: string, updates: any): Promise<any> {
  const response = await fetchData("shifts", shiftId, updates, "PUT");
  return response; // This is now the updated shift object
}

export async function updateShiftStatus(shiftId: string, status: boolean): Promise<any> {
  const response = await fetchData(`shifts/${shiftId}/status`, undefined, { active: status }, "PUT");
  return response; // This is now the updated shift object
}

export async function getTimesheets(): Promise<any[]> {
  const response = await fetchData("timesheet_entries");
  return response; // This is now the actual array
}

export async function clockIn(employeeId: string, storeId: string): Promise<any> {
  const response = await fetchData("timesheet_entries/clock-in", undefined, {
    employee_id: employeeId,
    store_id: storeId
  }, "POST");
  return response; // This is now the created timesheet entry
}

export async function clockOut(timesheetId: string): Promise<any> {
  const response = await fetchData(`timesheet_entries/${timesheetId}/clock-out`, undefined, {}, "POST");
  return response; // This is now the updated timesheet entry
}

// Inventory functions
export async function getPurchaseOrders(): Promise<any[]> {
  const response = await fetchData("purchase_orders");
  return response; // This is now the actual array
}

export async function createPurchaseOrder(orderData: any): Promise<any> {
  const response = await fetchData("purchase_orders", undefined, orderData, "POST");
  return response; // This is now the created purchase order
}

export async function updatePurchaseOrder(orderId: string, orderData: any): Promise<any> {
  const response = await fetchData("purchase_orders", orderId, orderData, "PUT");
  return response; // This is now the updated purchase order
}

export async function getGoodsReceipts(): Promise<any[]> {
  const response = await fetchData("goods_receipts");
  return response; // This is now the actual array
}

export async function createGoodsReceipt(receiptData: any): Promise<any> {
  const response = await fetchData("goods_receipts", undefined, receiptData, "POST");
  return response; // This is now the created goods receipt
}

export async function getSuppliers(): Promise<any[]> {
  const response = await fetchData("suppliers");
  return response; // This is now the actual array
}

// Additional functions (payroll, low stock, etc.)
export async function getPayrolls(): Promise<any[]> {
  const response = await fetchData("payroll");
  return response; // This is now the actual array
}

export async function getLowStockItems(): Promise<any[]> {
  const response = await fetchData("inventory/low-stock");
  return response; // This is now the actual array of low stock items
}

export async function deleteItem(resource: string, id: string): Promise<{ message: string }> {
  await fetchData(resource, id, undefined, "DELETE");
  return { message: "Item deleted successfully" };
}

// Other previously missing functions
export const useFood = (foodId: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR<Food>(
    foodId ? `${BASE_URL}/foods/${foodId}` : null,
    fetcher
  );
  return {
    food: data, // This now contains the actual food object
    isLoading,
    isError: error,
    refreshFood: mutate,
  };
};

export const useCreateFood = () => {
  const toast = useToast();
  const createFood = async (food: Food) => {
    try {
      const newFood = await fetchData("foods", undefined, food, "POST");
      toast({
        title: "Food created.",
        description: `Food ${newFood.name} has been successfully added.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return newFood;
    } catch (error: any) {
      toast({
        title: "Food creation failed.",
        description: error.message || "There was an error adding the food.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };
  return createFood;
};

export const useUpdateFood = () => {
  const toast = useToast();
  const updateFood = async (foodId: string, food: Partial<Food>) => {
    try {
      const updatedFood = await fetchData("foods", foodId, food, "PUT");
      toast({
        title: "Food updated.",
        description: `Food ${updatedFood.name} has been successfully updated.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return updatedFood;
    } catch (error: any) {
      toast({
        title: "Food update failed.",
        description: error.message || "There was an error updating the food.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };
  return updateFood;
};

export const useDeleteFood = () => {
  const toast = useToast();
  const deleteFood = async (foodId: string) => {
    try {
      await fetchData("foods", foodId, undefined, "DELETE");
      toast({
        title: "Food deleted.",
        description: "The food item has been successfully removed.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Food deletion failed.",
        description: error.message || "There was an error deleting the food.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };
  return deleteFood;
};

export async function getAccessRoles(): Promise<any[]> {
  const response = await fetchData("access_roles");
  return response; // This is now the actual array
}

export async function getJobTitles(): Promise<any[]> {
  const response = await fetchData("job_titles");
  return response; // This is now the actual array
}

export async function getPayrollSettings(): Promise<any> {
  const response = await fetchData("payroll_settings");
  return response; // This is now the settings object (not an array anymore)
}

// Add a test function to verify connection
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data: StandardResponse = await response.json();
    console.log('Health check:', data);
    return data.code === 200;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

// Department functions
export async function getDepartments(): Promise<any[]> {
  const response = await fetchData("departments");
  return response; // This is now the actual array
}

// In api.ts - Update the getUsers function
export async function getUsers(): Promise<any[]> {
  const response = await fetchData("users");
  // Transform the data to match your frontend expectations
  return response.map((user: any) => ({
    ...user,
    // Create name field from first_name and last_name
    name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
    // Ensure all required fields are present
    email_verified_at: user.email_verified_at || null,
    remember_token: user.remember_token || null,
  }));
}

// Also update the useUsers hook
export const useUsers = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/users`, async (url) => {
    const users = await fetcher(url);
    return users.map((user: any) => ({
      ...user,
      name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
    }));
  });

  return {
    users: data,
    isLoading,
    isError: error,
    refreshUsers: mutate,
  };
};

export const useDepartments = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/departments`, fetcher);
  return {
    departments: data, // This now contains the actual array of departments
    isLoading,
    isError: error,
    refreshDepartments: mutate,
  };
};

export const useAccessRoles = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/access_roles`, fetcher);
  return {
    accessRoles: data, // This now contains the actual array of access roles
    isLoading,
    isError: error,
    refreshAccessRoles: mutate,
  };
};

export const useJobTitles = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/job_titles`, fetcher);
  return {
    jobTitles: data, // This now contains the actual array of job titles
    isLoading,
    isError: error,
    refreshJobTitles: mutate,
  };
};

// Enhanced fetchData with better error handling
export async function enhancedFetchData(
  resource: string,
  id?: string,
  data?: Record<string, any>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<any | null> {
  try {
    return await fetchData(resource, id, data, method);
  } catch (error: any) {
    console.error(`API Error for ${resource}:`, error);
    throw error;
  }
}

export async function calculatePayroll(employeeId: string, periodStart: string, periodEnd: string): Promise<any> {
  const response = await fetchData("payroll/calculate", undefined, {
    employee_id: employeeId,
    period_start: periodStart,
    period_end: periodEnd
  }, "POST");
  return response;
}

export async function processPayroll(payrollId: string): Promise<any> {
  const response = await fetchData(`payroll/${payrollId}/process`, undefined, {}, "POST");
  return response;
}

export async function createPayroll(payrollData: any): Promise<any> {
  const response = await fetchData("payroll", undefined, payrollData, "POST");
  return response;
}

export async function updatePayrollSettings(settings: any): Promise<any> {
  const response = await fetchData("payroll_settings", undefined, settings, "POST");
  return response;
}

// Inventory functions
export async function getInventoryProducts(): Promise<any[]> {
  const response = await fetchData("inventory_products");
  return response;
}







// Add these functions to your api.ts file

// Sites functions
export async function getSites(): Promise<any[]> {
  const response = await fetchData("sites");
  return response;
}

export async function createSite(siteData: any): Promise<any> {
  const response = await fetchData("sites", undefined, siteData, "POST");
  return response;
}

export async function updateSite(siteId: string, siteData: any): Promise<any> {
  const response = await fetchData("sites", siteId, siteData, "PUT");
  return response;
}

export async function deleteSite(siteId: string): Promise<any> {
  const response = await fetchData("sites", siteId, undefined, "DELETE");
  return response;
}

export async function deletePurchaseOrder(orderId: string): Promise<any> {
  const response = await fetchData("purchase_orders", orderId, undefined, "DELETE");
  return response;
}

export async function updateGoodsReceipt(receiptId: string, receiptData: any): Promise<any> {
  const response = await fetchData("goods_receipts", receiptId, receiptData, "PUT");
  return response;
}

export async function deleteGoodsReceipt(receiptId: string): Promise<any> {
  const response = await fetchData("goods_receipts", receiptId, undefined, "DELETE");
  return response;
}

export async function createInventoryProduct(productData: any): Promise<any> {
  const response = await fetchData("inventory_products", undefined, productData, "POST");
  return response;
}

export async function updateInventoryProduct(productId: string, productData: any): Promise<any> {
  const response = await fetchData("inventory_products", productId, productData, "PUT");
  return response;
}

export async function deleteInventoryProduct(productId: string): Promise<any> {
  const response = await fetchData("inventory_products", productId, undefined, "DELETE");
  return response;
}
