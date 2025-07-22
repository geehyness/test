// src/app/lib/api.ts
import useSWR from "swr";
import { useToast } from "@chakra-ui/react";
// Corrected imports based on updated entities.ts
import {
  Order,
  Food,
  Category,
  Customer,
  Table,
  OrderItem,
  MenuItem,
} from "../config/entities";
import { sampleData } from "../data/sample"; // Directly import sampleData for easier access

// Generic fetcher function for useSWR
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }
    return res.json();
  });

// Simulate API interactions for demonstration purposes
export async function fetchData(
  resource: string, // This 'resource' will now be the endpoint path like '/api/tenants'
  id?: string, // Make id optional for POST/GET all
  data?: Record<string, any>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<any | null> {
  console.log(
    `API call: ${method} ${resource}${id ? "/" + id : ""}`,
    data || ""
  );

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Extract the actual resource name from the endpoint path
  const actualResourceName = resource.split("/").pop() || "";

  // Use the actualResourceName to access sampleData
  // We'll work with a mutable copy for POST/PUT/DELETE operations
  const currentResourceData = sampleData[actualResourceName] || []; // Changed let to const

  switch (method) {
    case "GET":
      if (actualResourceName === "orders") {
        const orders: Order[] = currentResourceData as Order[];
        const allOrderItems: OrderItem[] = sampleData[
          "order_items"
        ] as OrderItem[];
        const allFoods: Food[] = sampleData["foods"] as Food[]; // Fetch all food items

        // Helper to enrich an OrderItem with Food details
        const enrichOrderItem = (orderItem: OrderItem): OrderItem => {
          const food = allFoods.find(
            (f) => String(f.id) === String(orderItem.food_id)
          );

          // Use sale_price first, then price, then orderItem.price as fallback
          const itemPrice = food?.sale_price || orderItem.price;

          return {
            ...orderItem,
            name: food?.name || "Unknown Item", // Add name from food
            price_at_sale: itemPrice, // Use the determined item price
            sub_total: orderItem.quantity * (itemPrice || 0), // Recalculate sub_total
          };
        };

        if (id) {
          const order = orders.find(
            (item: any) => String(item.id) === String(id)
          );
          if (order) {
            order.items = allOrderItems
              .filter((item) => String(item.order_id) === String(order.id))
              .map(enrichOrderItem);
            return order;
          }
          return null;
        } else {
          return orders.map((order) => ({
            ...order,
            items: allOrderItems
              .filter((item) => String(item.order_id) === String(order.id))
              .map(enrichOrderItem),
          }));
        }
      }
      if (id) {
        return (
          currentResourceData.find(
            (item: any) => String(item.id) === String(id)
          ) || null
        );
      }
      return currentResourceData; // Return all data for the resource
    case "POST":
      // Simulate ID generation consistent with new string IDs
      const newId = `${actualResourceName}-${Date.now()}`;
      let newItem: any = {
        id: newId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Directly modify the sampleData array for the resource
      (sampleData[actualResourceName] as any[]).push(newItem);

      // Special handling for 'orders' to also save 'order_items'
      if (
        actualResourceName === "orders" &&
        data?.items &&
        Array.isArray(data.items)
      ) {
        const orderItemsToSave = data.items.map((item: any) => ({
          ...item,
          order_id: newItem.id, // Link items to the newly created order
          id: `orderitem-${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}`, // Generate new ID for each item
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        (sampleData["order_items"] as any[]).push(...orderItemsToSave);
        // Attach the items to the returned order object for immediate use
        newItem = { ...newItem, items: orderItemsToSave } as Order; // Cast to Order
      }
      return newItem;
    case "PUT":
      if (id) {
        const index = currentResourceData.findIndex(
          (item: any) => String(item.id) === String(id)
        );
        if (index !== -1) {
          let updatedItem: any = {
            ...currentResourceData[index],
            ...data,
            id: id,
            updated_at: new Date().toISOString(),
          };
          // Directly modify the sampleData array for the resource
          sampleData[actualResourceName][index] = updatedItem;

          // Special handling for 'orders' to update 'order_items'
          if (
            actualResourceName === "orders" &&
            data?.items &&
            Array.isArray(data.items)
          ) {
            // Remove existing items for this order
            sampleData["order_items"] = (
              sampleData["order_items"] as OrderItem[]
            ).filter((oi) => String(oi.order_id) !== String(id));

            // Add the new/updated items
            const newOrderItems = data.items.map((item: any) => ({
              ...item,
              order_id: id,
              id:
                item.id ||
                `orderitem-${Date.now()}-${Math.random()
                  .toString(36)
                  .substring(7)}`, // Use existing ID or generate new
              created_at: item.created_at || new Date().toISOString(), // Keep original or set new
              updated_at: new Date().toISOString(),
            }));
            (sampleData["order_items"] as any[]).push(...newOrderItems);
            // Attach the updated items to the returned order object
            updatedItem = { ...updatedItem, items: newOrderItems } as Order; // Cast to Order
          }
          return updatedItem;
        }
      }
      return null;
    case "DELETE":
      if (id) {
        const initialLength = currentResourceData.length;
        // Directly modify the sampleData array for the resource
        sampleData[actualResourceName] = currentResourceData.filter(
          (item: any) => String(item.id) !== String(id)
        );

        // If deleting an order, also delete its associated order_items
        if (actualResourceName === "orders" && id) {
          sampleData["order_items"] = (
            sampleData["order_items"] as OrderItem[]
          ).filter((oi) => String(oi.order_id) !== String(id));
        }

        if (initialLength > sampleData[actualResourceName].length) {
          return { success: true, id };
        }
      }
      return { success: false };
    default:
      return null;
  }
}

// Helper function to create an item
export async function createItem(
  resource: string,
  itemData: Record<string, any>
): Promise<any | null> {
  try {
    const newItem = await fetchData(resource, undefined, itemData, "POST");
    return newItem;
  } catch (error: any) {
    console.error(`Error creating ${resource}:`, error);
    throw error; // Re-throw to be handled by the component
  }
}

// Helper function to update an item
export async function updateItem(
  resource: string,
  id: string,
  itemData: Record<string, any>
): Promise<any | null> {
  try {
    const updatedItem = await fetchData(resource, id, itemData, "PUT");
    return updatedItem;
  } catch (error: any) {
    console.error(`Error updating ${resource} with ID ${id}:`, error);
    throw error; // Re-throw to be handled by the component
  }
}

// Helper function to delete an item
export async function deleteItem(
  resource: string,
  id: string
): Promise<boolean> {
  try {
    const success = await fetchData(resource, id, undefined, "DELETE");
    return success;
  } catch (error: any) {
    console.error(`Error deleting ${resource} with ID ${id}:`, error);
    throw error; // Re-throw to be handled by the component
  }
}

// Custom hooks (if you want to keep SWR for specific fetches)
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

// Renamed useMenuItems to useFoods to reflect fetching actual food items
export const useFoods = () => {
  const { data, error, isLoading, mutate } = useSWR<Food[]>(
    "/api/foods",
    fetcher
  );
  return {
    foods: data, // Changed from menuItems to foods
    isLoading,
    isError: error,
    refreshFoods: mutate, // Changed from refreshMenuItems to refreshFoods
  };
};

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

export const useCustomers = () => {
  const { data, error, isLoading, mutate } = useSWR<Customer[]>(
    "/api/customers",
    fetcher
  );
  return {
    customers: data,
    isLoading,
    isError: error,
    refreshCustomers: mutate,
  };
};

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

/**
 * Custom hook for fetching a customer by ID.
 * @param customerId The ID of the customer to fetch.
 */
export const useCustomerById = (customerId?: string) => {
  const { data, error, isLoading, mutate } = useSWR<Customer>(
    customerId ? `/api/customer/${customerId}` : null, // Only fetch if customerId exists
    fetcher
  );
  return {
    customer: data,
    isLoading,
    isError: error,
    refreshCustomer: mutate,
  };
};

/**
 * Custom hook for handling order creation.
 */
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
      throw error;
    }
  };
  return { createOrder };
};
