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

// Session Context Helper
export interface SessionContext {
  store_id: string;
  tenant_id: string;
  employee_id?: string;
  store_name?: string;
}

export function getCurrentSessionContext(): SessionContext {
  if (typeof window === "undefined") {
    return {
      store_id: "default-store",
      tenant_id: "tenant-231",
    };
  }

  try {
    const stored = sessionStorage.getItem("pos-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      const state = parsed.state;

      return {
        store_id: state.currentStaff?.storeId || "default-store",
        tenant_id: "tenant-231",
        employee_id: state.currentStaff?.id,
        store_name: state.currentStaff?.storeName,
      };
    }
  } catch (error) {
    console.error("Error reading session storage:", error);
  }

  return {
    store_id: "default-store",
    tenant_id: "tenant-231",
  };
}

// Enhanced fetchData with automatic session context
export async function fetchDataWithContext(
  resource: string,
  id?: string,
  data?: Record<string, any>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<any | null> {
  const session = getCurrentSessionContext();

  // Build the URL
  let cleanResource = resource.replace(/^\/|\/$/g, "").replace(/^api\//i, "");
  const url = id
    ? `${BASE_URL}/${cleanResource}/${id}`
    : `${BASE_URL}/${cleanResource}`;

  console.log(`[API] 🚀 Starting ${method} request to: ${url}`);
  if (data) {
    console.log(`[API] 📦 Payload for ${method}:`, data);
  }

  // Prepare Headers and Authorization
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log(`[API] 🔑 Authorization token added.`);
  }

  const options: RequestInit = {
    method,
    headers,
  };

  // Add Body for POST/PUT methods
  if ((method === "POST" || method === "PUT") && data) {
    options.body = JSON.stringify(data);
  }

  console.log(`[API] 🔧 Request options:`, options);

  try {
    const response = await fetch(url, options);

    console.log(
      `[API] 📡 Response status: ${response.status} ${response.statusText}`
    );

    // Handle Errors
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      let responseText = "";

      console.error(
        `[API] ❌ Request failed with status: ${response.status} (${response.statusText})`
      );

      try {
        responseText = await response.text();
        const errorJson: StandardResponse = responseText
          ? JSON.parse(responseText)
          : null;

        console.error(`[API] 📄 Raw error response body:`, responseText);

        // Check for the new standard error structure
        if (errorJson && errorJson.message) {
          errorMessage = errorJson.message;
          // Include details if available
          if (errorJson.hasOwnProperty("details") && errorJson.details) {
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

    // Handle 204 No Content
    if (response.status === 204) {
      console.log(`[API] ✅ Request successful (204 No Content).`);
      return null;
    }

    // Return parsed JSON for 200, 201, 202, etc.
    const responseText = await response.text();
    console.log(`[API] 📄 Raw response body:`, responseText);

    if (!responseText) {
      console.log(
        `[API] ✅ Request successful (${response.status}) with empty body.`
      );
      return null;
    }

    const finalResponse: StandardResponse = JSON.parse(responseText);
    console.log(
      `[API] ✅ Request successful (${response.status}). Full response:`,
      finalResponse
    );

    // Return the data part of the standard response
    return finalResponse.data;
  } catch (error: any) {
    console.error(`[API] 🛑 Fetch error for ${method} ${url}:`, error);
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error - cannot connect to backend server");
    }
    throw error;
  }
}

// Generic fetcher function for useSWR with auth headers - UPDATED
const fetcher = async (url: string) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
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

  // Extract data from StandardResponse
  return responseData.data;
};

export async function fetchData(
  resource: string,
  id?: string,
  data?: Record<string, any>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<any | null> {
  // 1. Build the URL
  let cleanResource = resource.replace(/^\/|\/$/g, "").replace(/^api\//i, "");
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

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
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
    let responseText = "";

    console.error(
      `[API] ❌ Request failed with status: ${response.status} (${response.statusText})`
    );

    try {
      responseText = await response.text();
      const errorJson: StandardResponse = responseText
        ? JSON.parse(responseText)
        : null;

      console.error(`[API] 📄 Raw error response body:`, responseText);

      // Check for the new standard error structure
      if (errorJson && errorJson.message) {
        errorMessage = errorJson.message;
        // Include details if available
        if (errorJson.hasOwnProperty("details") && errorJson.details) {
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
  console.log(
    `[API] ✅ Request successful (${response.status}). Full response:`,
    finalResponse
  );

  // Return the data part of the standard response
  return finalResponse.data;
}

// Authentication - UPDATED for new response format
export async function loginEmployee(
  email: string,
  password: string
): Promise<Employee & { store_id: string }> {
  const url = `${BASE_URL}/login`;
  console.log("loginEmployee: Starting login process...");

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
      console.error("Login API error:", errorData);
    } catch (e) {
      errorMessage = responseText || `Login failed: ${response.statusText}`;
      console.error("Login API error:", errorMessage);
    }

    throw new Error(errorMessage);
  }

  const loginResponse: StandardResponse<{
    access_token: string;
    employee: Employee;
  }> = await response.json();
  console.log("Login response:", loginResponse);

  const { access_token, employee } = loginResponse.data!;

  if (!employee) {
    throw new Error("Employee data not found in login response.");
  }

  localStorage.setItem("access_token", access_token);

  return {
    ...employee,
    store_id: employee.store_id,
  };
}

// ==================== UPDATED FUNCTIONS WITH SESSION CONTEXT ====================

// Core POS functions - UPDATED with session context
export const useFoods = () => {
  const session = getCurrentSessionContext();
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/foods?store_id=${session.store_id}`,
    fetcher
  );
  return {
    menuItems: data,
    isLoading,
    isError: error,
    refreshMenuItems: mutate,
  };
};

export const useCategories = () => {
  const session = getCurrentSessionContext();
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/categories?store_id=${session.store_id}`,
    fetcher
  );
  return {
    categories: data,
    isLoading,
    isError: error,
    refreshCategories: mutate,
  };
};

export const useTables = () => {
  const session = getCurrentSessionContext();
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/tables?store_id=${session.store_id}`,
    fetcher
  );
  return {
    tables: data,
    isLoading,
    isError: error,
    refreshTables: mutate,
  };
};

export const useCreateOrder = () => {
  const toast = useToast();

  const createOrder = async (order: any) => {
    try {
      const newOrder = await fetchDataWithContext(
        "orders",
        undefined,
        order,
        "POST"
      );
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
  const session = getCurrentSessionContext();
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/orders?store_id=${session.store_id}`,
    fetcher
  );
  return {
    orders: data,
    isLoading,
    isError: error,
    refreshOrders: mutate,
  };
};

export const useUpdateOrder = () => {
  const toast = useToast();

  const updateOrder = async (orderId: string, updatedOrder: any) => {
    try {
      const result = await fetchDataWithContext(
        "orders",
        orderId,
        updatedOrder,
        "PUT"
      );
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
  const session = getCurrentSessionContext();
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/inventory_products?store_id=${session.store_id}`,
    fetcher
  );
  return {
    inventoryProducts: data,
    isLoading,
    isError: error,
    refreshInventoryProducts: mutate,
  };
};

// Food Management - UPDATED with session context
export const useCreateFood = () => {
  const toast = useToast();
  const createFood = async (food: Food) => {
    try {
      const newFood = await fetchDataWithContext(
        "foods",
        undefined,
        food,
        "POST"
      );
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
      const updatedFood = await fetchDataWithContext(
        "foods",
        foodId,
        food,
        "PUT"
      );
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

// HR functions - UPDATED with session context
export async function getEmployees(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(`employees?store_id=${session.store_id}`);
  return response;
}

export async function getShifts(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(`shifts?store_id=${session.store_id}`);
  return response;
}

export async function updateShiftStatus(
  shiftId: string,
  status: boolean
): Promise<any> {
  const response = await fetchDataWithContext(
    `shifts/${shiftId}/status`,
    undefined,
    { active: status },
    "PUT"
  );
  return response;
}

export async function createShift(newShift: any): Promise<any> {
  console.log("🔍 [API] Sending shift data:", newShift);

  // Ensure dates are properly formatted
  const processedShift = {
    ...newShift,
    start:
      newShift.start instanceof Date
        ? newShift.start.toISOString()
        : newShift.start,
    end:
      newShift.end instanceof Date ? newShift.end.toISOString() : newShift.end,
  };

  console.log("🔍 [API] Processed shift data:", processedShift);

  try {
    const response = await fetchDataWithContext(
      "shifts",
      undefined,
      processedShift,
      "POST"
    );

    console.log("🔍 [API] Full API response:", response);
    console.log("🔍 [API] Response data type:", typeof response);

    if (!response) {
      console.error("🔍 [API] Response is null or undefined");
      throw new Error(
        "Shift creation returned no data - check backend response"
      );
    }

    console.log("🔍 [API] Response keys:", Object.keys(response));
    return response;
  } catch (error) {
    console.error("🔍 [API] Error in createShift:", error);
    throw error;
  }
}

export async function updateShift(shiftId: string, updates: any): Promise<any> {
  // Ensure dates are properly formatted
  const processedUpdates = { ...updates };

  if (updates.start instanceof Date) {
    processedUpdates.start = updates.start.toISOString();
  }
  if (updates.end instanceof Date) {
    processedUpdates.end = updates.end.toISOString();
  }
  if (updates.recurrence_end_date instanceof Date) {
    processedUpdates.recurrence_end_date =
      updates.recurrence_end_date.toISOString();
  }

  const response = await fetchDataWithContext(
    "shifts",
    shiftId,
    processedUpdates,
    "PUT"
  );
  return response;
}

export async function getTimesheets(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(
    `timesheet_entries?store_id=${session.store_id}`
  );
  return response;
}

export async function createTimesheetEntry(timesheetData: any): Promise<any> {
  const response = await fetchDataWithContext(
    "timesheet_entries", // This matches the backend endpoint
    undefined,
    timesheetData,
    "POST"
  );
  return response;
}

export async function clockIn(
  employeeId: string,
  storeId: string
): Promise<any> {
  const response = await fetchDataWithContext(
    "timesheet_entries/clock-in",
    undefined,
    {
      employee_id: employeeId,
      store_id: storeId,
    },
    "POST"
  );
  return response;
}

export async function clockOut(timesheetId: string): Promise<any> {
  // ✅ FIX: Changed to fetchDataWithContext to ensure store context is passed for POST
  const response = await fetchDataWithContext(
    `timesheet_entries/${timesheetId}/clock-out`,
    undefined,
    {},
    "POST"
  );
  return response;
}

// Inventory functions - UPDATED with session context
export async function getPurchaseOrders(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(
    `purchase_orders?store_id=${session.store_id}`
  );
  return response;
}

export async function createPurchaseOrder(orderData: any): Promise<any> {
  const response = await fetchDataWithContext(
    "purchase_orders",
    undefined,
    orderData,
    "POST"
  );
  return response;
}

export async function updatePurchaseOrder(
  orderId: string,
  orderData: any
): Promise<any> {
  const response = await fetchDataWithContext(
    "purchase_orders",
    orderId,
    orderData,
    "PUT"
  );
  return response;
}

export async function getGoodsReceipts(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(
    `goods_receipts?store_id=${session.store_id}`
  );
  return response;
}

export async function createGoodsReceipt(receiptData: any): Promise<any> {
  const response = await fetchDataWithContext(
    "goods_receipts",
    undefined,
    receiptData,
    "POST"
  );
  return response;
}

export async function getSuppliers(): Promise<any[]> {
  const response = await fetchData("suppliers");
  return response;
}

export async function getLowStockItems(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(
    `inventory/low-stock?store_id=${session.store_id}`
  );
  return response;
}

export async function deleteItem(
  resource: string,
  id: string
): Promise<{ message: string }> {
  await fetchData(resource, id, undefined, "DELETE");
  return { message: "Item deleted successfully" };
}

export async function deleteShift(
  resource: string,
  id: string
): Promise<{ message: string }> {
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
    food: data,
    isLoading,
    isError: error,
    refreshFood: mutate,
  };
};

export async function getAccessRoles(): Promise<any[]> {
  const response = await fetchData("access_roles");
  return response;
}

export async function getJobTitles(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(`job_titles?store_id=${session.store_id}`);
  return response;
}

// Add a test function to verify connection
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data: StandardResponse = await response.json();
    console.log("Health check:", data);
    return data.code === 200;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
}

// Department functions - UPDATED with session context
export async function getDepartments(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(`departments?store_id=${session.store_id}`);
  return response;
}

// User functions - REMOVE name computation
export async function getUsers(): Promise<any[]> {
  const response = await fetchData("users");
  return response; // Remove the entire .map() function
}

export const useUsers = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/users`,
    fetcher // Remove the async function that computes names
  );

  return {
    users: data,
    isLoading,
    isError: error,
    refreshUsers: mutate,
  };
};

export const useDepartments = () => {
  const session = getCurrentSessionContext();
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/departments?store_id=${session.store_id}`,
    fetcher
  );
  return {
    departments: data,
    isLoading,
    isError: error,
    refreshDepartments: mutate,
  };
};

export const useAccessRoles = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/access_roles`,
    fetcher
  );
  return {
    accessRoles: data,
    isLoading,
    isError: error,
    refreshAccessRoles: mutate,
  };
};

export const useJobTitles = () => {
  const session = getCurrentSessionContext();
  const { data, error, isLoading, mutate } = useSWR(
    `${BASE_URL}/job_titles?store_id=${session.store_id}`,
    fetcher
  );
  return {
    jobTitles: data,
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
    return await fetchDataWithContext(resource, id, data, method);
  } catch (error: any) {
    console.error(`API Error for ${resource}:`, error);
    throw error;
  }
}

/* Payroll functions - UPDATED with session context
export async function calculatePayroll(
  employeeId: string,
  periodStart: string,
  periodEnd: string
): Promise<any> {
  const response = await fetchDataWithContext(
    "payroll/calculate",
    undefined,
    {
      employee_id: employeeId,
      period_start: periodStart,
      period_end: periodEnd,
    },
    "POST"
  );
  return response;
}

export async function processPayroll(payrollId: string): Promise<any> {
  const response = await fetchData(
    `payroll/${payrollId}/process`,
    undefined,
    {},
    "POST"
  );
  return response;
}

export async function createPayroll(payrollData: any): Promise<any> {
  const response = await fetchDataWithContext(
    "payroll",
    undefined,
    payrollData,
    "POST"
  );
  return response;
}

export async function updatePayrollSettings(settings: any): Promise<any> {
  const response = await fetchDataWithContext(
    "payroll_settings",
    undefined,
    settings,
    "POST"
  );
  return response;
}

// Additional functions (payroll, low stock, etc.) - UPDATED with session context
export async function getPayrolls(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(`payroll?store_id=${session.store_id}`);
  return response;
}

export async function getPayrollSettings(): Promise<any> {
  const session = getCurrentSessionContext();
  const response = await fetchData(
    `payroll_settings?store_id=${session.store_id}`
  );
  return response;
}*/

// Inventory functions - UPDATED with session context
export async function getInventoryProducts(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(
    `inventory_products?store_id=${session.store_id}`
  );
  return response;
}

export async function createInventoryProduct(productData: any): Promise<any> {
  const response = await fetchDataWithContext(
    "inventory_products",
    undefined,
    productData,
    "POST"
  );
  return response;
}

export async function updateInventoryProduct(
  productId: string,
  productData: any
): Promise<any> {
  const response = await fetchDataWithContext(
    "inventory_products",
    productId,
    productData,
    "PUT"
  );
  return response;
}

export async function deleteInventoryProduct(productId: string): Promise<any> {
  const response = await fetchData(
    "inventory_products",
    productId,
    undefined,
    "DELETE"
  );
  return response;
}

// Sites functions - UPDATED with session context
export async function getSites(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(`sites?store_id=${session.store_id}`);
  return response;
}

export async function createSite(siteData: any): Promise<any> {
  const response = await fetchDataWithContext(
    "sites",
    undefined,
    siteData,
    "POST"
  );
  return response;
}

export async function updateSite(siteId: string, siteData: any): Promise<any> {
  const response = await fetchDataWithContext("sites", siteId, siteData, "PUT");
  return response;
}

export async function deleteSite(siteId: string): Promise<any> {
  const response = await fetchData("sites", siteId, undefined, "DELETE");
  return response;
}

export async function deletePurchaseOrder(orderId: string): Promise<any> {
  const response = await fetchData(
    "purchase_orders",
    orderId,
    undefined,
    "DELETE"
  );
  return response;
}

export async function updateGoodsReceipt(
  receiptId: string,
  receiptData: any
): Promise<any> {
  const response = await fetchDataWithContext(
    "goods_receipts",
    receiptId,
    receiptData,
    "PUT"
  );
  return response;
}

export async function deleteGoodsReceipt(receiptId: string): Promise<any> {
  const response = await fetchData(
    "goods_receipts",
    receiptId,
    undefined,
    "DELETE"
  );
  return response;
}

// Customer functions - UPDATED with session context
export async function getCustomers(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(`customers?store_id=${session.store_id}`);
  return response;
}

export async function createCustomer(customerData: any): Promise<any> {
  const response = await fetchDataWithContext(
    "customers",
    undefined,
    customerData,
    "POST"
  );
  return response;
}

export async function updateCustomer(
  customerId: string,
  customerData: any
): Promise<any> {
  const response = await fetchDataWithContext(
    "customers",
    customerId,
    customerData,
    "PUT"
  );
  return response;
}

export async function deleteCustomer(customerId: string): Promise<any> {
  const response = await fetchData(
    "customers",
    customerId,
    undefined,
    "DELETE"
  );
  return response;
}

// Reservation functions - UPDATED with session context
export async function getReservations(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(`reservations?store_id=${session.store_id}`);
  return response;
}

export async function createReservation(reservationData: any): Promise<any> {
  const response = await fetchDataWithContext(
    "reservations",
    undefined,
    reservationData,
    "POST"
  );
  return response;
}

export async function updateReservation(
  reservationId: string,
  reservationData: any
): Promise<any> {
  const response = await fetchDataWithContext(
    "reservations",
    reservationId,
    reservationData,
    "PUT"
  );
  return response;
}

export async function deleteReservation(reservationId: string): Promise<any> {
  const response = await fetchData(
    "reservations",
    reservationId,
    undefined,
    "DELETE"
  );
  return response;
}

// Payroll functions - FIXED endpoints (REPLACE THE COMMENTED SECTION WITH THIS)
export async function getPayrolls(): Promise<any[]> {
  const session = getCurrentSessionContext();
  const response = await fetchData(`payroll?store_id=${session.store_id}`);
  return response;
}

export async function calculatePayroll(
  employeeId: string,
  periodStart: string,
  periodEnd: string
): Promise<any> {
  const session = getCurrentSessionContext();

  const response = await fetchData(
    "payroll/calculate",
    undefined,
    {
      employee_id: employeeId,
      period_start: periodStart,
      period_end: periodEnd,
      store_id: session.store_id,
      tenant_id: session.tenant_id,
    },
    "POST"
  );
  return response;
}

export async function processPayroll(payrollId: string): Promise<any> {
  const response = await fetchData(
    `payroll/${payrollId}/process`,
    undefined,
    {},
    "POST"
  );
  return response;
}

export async function createPayroll(payrollData: any): Promise<any> {
  const response = await fetchDataWithContext(
    "payroll",
    undefined,
    payrollData,
    "POST"
  );
  return response;
}

export async function updatePayrollSettings(settings: any): Promise<any> {
  const response = await fetchDataWithContext(
    "payroll_settings",
    undefined,
    settings,
    "POST"
  );
  return response;
}

export async function getPayrollSettings(): Promise<any> {
  const session = getCurrentSessionContext();
  const response = await fetchData(
    `payroll_settings?store_id=${session.store_id}`
  );
  return response;
}

// In api.ts - add this function
export async function updatePayrollSettingsWithId(
  settingsId: string,
  settingsData: any
): Promise<any> {
  const response = await fetchData(
    "payroll_settings",
    settingsId,
    settingsData,
    "PUT"
  );
  return response;
}
