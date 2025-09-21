// src/app/lib/api.ts
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

const BASE_URL = "https://carte-fastapi.vercel.app/api";

// Generic fetcher function for useSWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
};

export async function fetchData(
  resource: string,
  id?: string,
  data?: Record<string, any>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<any | null> {
  let url = `${BASE_URL}/${resource}`;
  if (id) {
    url += `/${id}`;
  }

  const options: RequestInit = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
}

// Authentication
export async function loginEmployee(email: string, password: string): Promise<Employee & { store_id: string }> {
  // Directly call the live API login endpoint
  const url = `${BASE_URL}/login`;
  console.log('loginEmployee: Starting login process to live API...');

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
    const errorData = await response.json();
    throw new Error(errorData.detail || "Invalid email or password.");
  }

  const { access_token } = await response.json();

  // Fetch the employee and their store_id using the new token
  const employeeUrl = `${BASE_URL}/employees/me`;
  const employeeResponse = await fetch(employeeUrl, {
    headers: {
      "Authorization": `Bearer ${access_token}`,
    },
  });

  if (!employeeResponse.ok) {
    throw new Error("Failed to fetch employee data after login.");
  }

  const employeeData = await employeeResponse.json();

  return { ...employeeData, store_id: employeeData.store_id };
}

// Core POS functions
export const useFoods = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/foods`, fetcher);
  return {
    menuItems: data,
    isLoading,
    isError: error,
    refreshMenuItems: mutate,
  };
};

export const useCategories = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/categories`, fetcher);
  return {
    categories: data,
    isLoading,
    isError: error,
    refreshCategories: mutate,
  };
};

export const useTables = () => {
  const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/tables`, fetcher);
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
    inventoryProducts: data,
    isLoading,
    isError: error,
    refreshInventoryProducts: mutate,
  };
};

// HR functions
export async function getEmployees(): Promise<any[]> {
  return await fetchData("employees");
}

export async function getShifts(): Promise<any[]> {
  return await fetchData("shifts");
}

export async function createShift(newShift: any): Promise<any> {
  return await fetchData("shifts", undefined, newShift, "POST");
}

export async function updateShift(shiftId: string, updates: any): Promise<any> {
  return await fetchData("shifts", shiftId, updates, "PUT");
}

export async function updateShiftStatus(shiftId: string, status: boolean): Promise<any> {
  const updatedShift = await fetchData(`shifts`, shiftId, { active: status }, "PUT");
  return updatedShift;
}

export async function getTimesheets(): Promise<any[]> {
  return await fetchData("timesheet_entries");
}

export async function clockIn(employeeId: string, storeId: string): Promise<any> {
  return await fetchData("timesheet_entries", undefined, {
    employee_id: employeeId,
    clock_in: new Date().toISOString(),
    store_id: storeId
  }, "POST");
}

export async function clockOut(timesheetId: string): Promise<any> {
  const clockOutTime = new Date().toISOString();
  return await fetchData("timesheet_entries", timesheetId, {
    clock_out: clockOutTime
  }, "PUT");
}

// Inventory functions
export async function getPurchaseOrders(): Promise<any[]> {
  return await fetchData("purchase_orders");
}

export async function createPurchaseOrder(orderData: any): Promise<any> {
  return await fetchData("purchase_orders", undefined, orderData, "POST");
}

export async function updatePurchaseOrder(orderId: string, orderData: any): Promise<any> {
  return await fetchData("purchase_orders", orderId, orderData, "PUT");
}

export async function getGoodsReceipts(): Promise<any[]> {
  return await fetchData("goods_receipts");
}

export async function createGoodsReceipt(receiptData: any): Promise<any> {
  return await fetchData("goods_receipts", undefined, receiptData, "POST");
}

export async function getSuppliers(): Promise<any[]> {
  return await fetchData("suppliers");
}

// Additional functions (payroll, low stock, etc.)
export async function getPayrolls(): Promise<any[]> {
  return await fetchData("payroll");
}

export async function getLowStockItems(): Promise<any[]> {
  const products = await fetchData("inventory_products");
  return products.filter((product: any) =>
    product.quantity_in_stock <= product.reorder_level
  );
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
    food: data,
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
  const roles = await fetchData("access_roles");
  return roles;
}

export async function getJobTitles(): Promise<any[]> {
  const titles = await fetchData("job_titles");
  return titles;
}

export async function getPayrollSettings(): Promise<any> {
  const settings = await fetchData("payroll_settings");
  return settings[0];
}