// src/app/lib/api.ts
import useSWR from 'swr';
import { useToast } from '@chakra-ui/react';
// Assuming these interfaces are correctly defined in entities.ts for use in forms/tables
import { Order, MenuItem, Category, Customer, Table } from '../config/entities'; 

// Generic fetcher function for useSWR
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  return res.json();
});

// Simulate API interactions for demonstration purposes
// This fetchData is for the CRUD operations on sampleData, NOT for useSWR
export async function fetchData(
  resource: string, // This 'resource' will now be the endpoint path like '/api/tenants'
  id?: string, // Make id optional for POST/GET all
  data?: Record<string, any>,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): Promise<any | null> {
  console.log(`API call: ${method} ${resource}${id ? '/' + id : ''}`, data || '');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const sampleModule = await import('../data/sample'); // Dynamically import
  const sampleData = sampleModule.sampleData; // Access the named export

  // Extract the actual resource name from the endpoint path
  // For '/api/tenants', this will get 'tenants'
  const actualResourceName = resource.split('/').pop() || ''; 

  // Use the actualResourceName to access sampleData
  const currentResourceData = sampleData[actualResourceName] || [];

  switch (method) {
    case 'GET':
      if (id) {
        return currentResourceData.find((item: any) => String(item.id) === String(id)) || null;
      }
      return currentResourceData; // Return all data for the resource
    case 'POST':
      const newItem = { id: Date.now().toString(), ...data }; // Simulate ID generation
      (currentResourceData as any[]).push(newItem); // Add to our mock data
      return newItem;
    case 'PUT':
      if (id) {
        const index = currentResourceData.findIndex((item: any) => String(item.id) === String(id));
        if (index !== -1) {
          const updatedItem = { ...currentResourceData[index], ...data, id: id };
          currentResourceData[index] = updatedItem;
          return updatedItem;
        }
      }
      return null;
    case 'DELETE':
      if (id) {
        const initialLength = currentResourceData.length;
        const filteredData = currentResourceData.filter((item: any) => String(item.id) !== String(id));
        // Update the mock data in place if it's a mutable array
        // (This part is a simplification for a real API where deletion would be handled server-side)
        if (initialLength > filteredData.length) {
          // Assuming currentResourceData is mutable, otherwise reassign sampleData[actualResourceName]
          // For a true in-memory store that persists across calls within this simulation, you'd modify sampleData itself.
          // For this example, we'll just return success.
          return { success: true, id };
        }
      }
      return { success: false };
    default:
      return null;
  }
}

// Helper function to create an item
export async function createItem(resource: string, itemData: Record<string, any>): Promise<any | null> {
  try {
    const newItem = await fetchData(resource, undefined, itemData, 'POST');
    return newItem;
  } catch (error: any) {
    console.error(`Error creating ${resource}:`, error);
    throw error; // Re-throw to be handled by the component
  }
}

// Helper function to update an item
export async function updateItem(resource: string, id: string, itemData: Record<string, any>): Promise<any | null> {
  try {
    const updatedItem = await fetchData(resource, id, itemData, 'PUT');
    return updatedItem;
  } catch (error: any) {
    console.error(`Error updating ${resource} with ID ${id}:`, error);
    throw error; // Re-throw to be handled by the component
  }
}

// Helper function to delete an item (already present as deleteItem, but making it consistent)
export async function deleteItem(resource: string, id: string): Promise<boolean> {
  try {
    const success = await fetchData(resource, id, undefined, 'DELETE');
    return success;
  } catch (error: any) {
    console.error(`Error deleting ${resource} with ID ${id}:`, error);
    throw error; // Re-throw to be handled by the component
  }
}

// Custom hooks (if you want to keep SWR for specific fetches)
export const useOrders = () => {
  const { data, error, isLoading, mutate } = useSWR<Order[]>('/api/orders', fetcher);
  return {
    orders: data,
    isLoading,
    isError: error,
    refreshOrders: mutate
  };
};

export const useMenuItems = () => {
  const { data, error, isLoading, mutate } = useSWR<MenuItem[]>('/api/menu_items', fetcher);
  return {
    menuItems: data,
    isLoading,
    isError: error,
    refreshMenuItems: mutate
  };
};

export const useCategories = () => {
  const { data, error, isLoading, mutate } = useSWR<Category[]>('/api/categories', fetcher);
  return {
    categories: data,
    isLoading,
    isError: error,
    refreshCategories: mutate
  };
};

export const useCustomers = () => {
  const { data, error, isLoading, mutate } = useSWR<Customer[]>('/api/customers', fetcher);
  return {
    customers: data,
    isLoading,
    isError: error,
    refreshCustomers: mutate
  };
};

export const useTables = () => {
  const { data, error, isLoading, mutate } = useSWR<Table[]>('/api/tables', fetcher);
  return {
    tables: data,
    isLoading,
    isError: error,
    refreshTables: mutate
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
    refreshCustomer: mutate
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
      const newOrder = await fetchData('orders', undefined, order, 'POST');

      toast({
        title: 'Order created.',
        description: 'Your order has been successfully placed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      return newOrder;
    } catch (error: any) {
      toast({
        title: 'Order creation failed.',
        description: error.message || 'There was an error placing your order.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };
  return { createOrder };
};