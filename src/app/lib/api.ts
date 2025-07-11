// src/lib/api.ts
import axios from 'axios';
import { sampleData } from '../data/sample'; // Import your sample data

// Create an Axios instance (still useful if you plan to switch back to a real API)
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
});

/**
 * Fetches data for a resource, either a list of all items or a single item by ID.
 * It also handles creation (POST) and updating (PUT) by modifying sampleData directly.
 *
 * @param resource The name of the resource (e.g., 'users', 'sales').
 * @param id Optional: The ID of a specific item to fetch, update, or delete.
 * @param data Optional: Data payload for POST or PUT requests.
 * @param method Optional: HTTP method (GET, POST, PUT, DELETE). Defaults to 'GET'.
 * @returns A promise that resolves to the fetched data, created item, or updated item, or null if not found/error.
 */
export async function fetchData(
  resource: string,
  id?: string, // Make id optional
  data?: Record<string, any>,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): Promise<any | null> {
  console.log(`API call: ${method} ${resource}${id ? '/' + id : ''}`, data || '');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const currentResourceData = sampleData[resource] || [];

  switch (method) {
    case 'GET':
      if (id) {
        // Fetch a single item
        const item = currentResourceData.find((x: any) => String(x.id) === String(id));
        return item || null;
      } else {
        // Fetch all items
        return currentResourceData;
      }
    case 'POST':
      if (!data) {
        throw new Error('Data is required for POST request.');
      }
      // Simulate ID generation for new item
      const newId = Math.floor(Math.random() * 100000) + 1000;
      const newItem = { ...data, id: newId };
      sampleData[resource] = [...currentResourceData, newItem]; // Add new item to sampleData
      return newItem;
    case 'PUT':
      if (!id || !data) {
        throw new Error('ID and data are required for PUT request.');
      }
      const updatedItemIndex = currentResourceData.findIndex((x: any) => String(x.id) === String(id));
      if (updatedItemIndex > -1) {
        const updatedItem = { ...currentResourceData[updatedItemIndex], ...data, id: String(id) }; // Ensure ID consistency
        sampleData[resource][updatedItemIndex] = updatedItem; // Update item in sampleData
        return updatedItem;
      } else {
        throw new Error(`Item with ID ${id} not found for update.`);
      }
    case 'DELETE':
      if (!id) {
        throw new Error('ID is required for DELETE request.');
      }
      const initialLength = currentResourceData.length;
      sampleData[resource] = currentResourceData.filter((x: any) => String(x.id) !== String(id)); // Filter out deleted item
      if (sampleData[resource].length === initialLength) {
        throw new Error(`Item with ID ${id} not found for deletion.`);
      }
      return true; // Indicate successful deletion
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}

/**
 * Simulates deleting a resource by its ID.
 * This function now leverages the consolidated fetchData for DELETE operations.
 * @param resource The name of the resource.
 * @param id The ID of the resource to delete.
 * @returns A promise that resolves to true if the resource is simulated deleted.
 */
export async function deleteItem(resource: string, id: string): Promise<boolean> {
  return fetchData(resource, id, undefined, 'DELETE');
}