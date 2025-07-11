// src/app/lib/api.ts
import useSWR from 'swr';
import { useToast } from '@chakra-ui/react';
import { Order, MenuItem, Category, Customer, Table } from '../config/entities'; // Adjusted path as per tree output

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
  resource: string,
  id?: string, // Make id optional
  data?: Record<string, any>,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): Promise<any | null> {
  console.log(`API call: ${method} ${resource}${id ? '/' + id : ''}`, data || '');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const sampleData = (await import('../data/sample')).sampleData; // Dynamically import sampleData to avoid circular deps
  const currentResourceData = sampleData[resource] || [];

  switch (method) {
    case 'GET':
      if (id) {
        return currentResourceData.find((item: any) => String(item.id) === String(id)) || null;
      }
      return currentResourceData;
    case 'POST':
      if (!data) {
        throw new Error('Data is required for POST request.');
      }
      const newItem = { id: String(Date.now()), ...data }; // Simulate ID generation
      sampleData[resource].push(newItem);
      return newItem;
    case 'PUT':
      if (!id || !data) {
        throw new Error('ID and data are required for PUT request.');
      }
      const updatedItemIndex = currentResourceData.findIndex((x: any) => String(x.id) === String(id));
      if (updatedItemIndex > -1) {
        const updatedItem = { ...currentResourceData[updatedItemIndex], ...data, id: String(id) };
        sampleData[resource][updatedItemIndex] = updatedItem;
        return updatedItem;
      } else {
        throw new Error(`Item with ID ${id} not found for update.`);
      }
    case 'DELETE':
      if (!id) {
        throw new Error('ID is required for DELETE request.');
      }
      const initialLength = currentResourceData.length;
      sampleData[resource] = currentResourceData.filter((x: any) => String(x.id) !== String(id));
      if (sampleData[resource].length === initialLength) {
        throw new Error(`Item with ID ${id} not found for deletion.`);
      }
      return true;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}

// --- Custom Hooks for API Interactions ---

/**
 * Custom hook for fetching menu items.
 * @param query Optional search query.
 * @param categoryId Optional category filter ID.
 */
export const useMenuItems = (query?: string, categoryId?: string) => {
  const url = `/api/menu-items${query ? `?query=${query}` : ''}${categoryId ? `&categoryId=${categoryId}` : ''}`;
  const { data, error, isLoading, mutate } = useSWR<MenuItem[]>(url, fetcher);
  return {
    menuItems: data,
    isLoading,
    isError: error,
    refreshMenuItems: mutate // Expose mutate for re-fetching
  };
};

/**
 * Custom hook for fetching categories.
 */
export const useCategories = () => {
  const { data, error, isLoading, mutate } = useSWR<Category[]>('/api/categories', fetcher);
  return {
    categories: data,
    isLoading,
    isError: error,
    refreshCategories: mutate
  };
};

/**
 * Custom hook for fetching tables.
 */
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
      throw error; // Re-throw to allow component to handle
    }
  };

  return { createOrder };
};