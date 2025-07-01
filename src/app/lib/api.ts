import axios from 'axios';
import { sampleData } from '../data/sample'; // Import your sample data

// Create an Axios instance (still useful if you plan to switch back to a real API)
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
});

/**
 * Fetches a list of resources from the sample data.
 * @param resource The name of the resource (e.g., 'users', 'sales').
 * @returns An array of resource data from sample.ts.
 */
export async function fetchData(resource: string): Promise<any[]> {
  console.log(`Fetching data for ${resource} from sample.ts`);
  // Return data directly from sampleData
  return sampleData[resource] || [];
}

/**
 * Fetches a single resource by its ID from the sample data.
 * @param resource The name of the resource.
 * @param id The ID of the resource.
 * @returns The resource data from sample.ts, or null if not found.
 */
export async function fetchItemData(resource: string, id: string): Promise<any | null> {
  console.log(`Fetching item ${id} for ${resource} from sample.ts`);
  const items = sampleData[resource] || [];
  // Find the item by ID (assuming 'id' is a string or number)
  const item = items.find((x: any) => String(x.id) === String(id));
  return item || null;
}

/**
 * Simulates creating a new resource (logs the action).
 * @param resource The name of the resource.
 * @param data The data for the new resource.
 * @returns A promise that resolves to the simulated created resource data.
 */
export async function createItem(resource: string, data: any): Promise<any> {
  console.log(`Simulating creation of ${resource}:`, data);
  // In a real scenario, you'd add this to your backend and get a real ID.
  // For sample data, we'll just return a mock success.
  return { ...data, id: Math.floor(Math.random() * 1000) + 1000 }; // Assign a mock ID
}

/**
 * Simulates updating an existing resource (logs the action).
 * @param resource The name of the resource.
 * @param id The ID of the resource to update.
 * @param data The updated data for the resource.
 * @returns A promise that resolves to the simulated updated resource data.
 */
export async function updateItem(resource: string, id: string, data: any): Promise<any> {
  console.log(`Simulating update of ${resource} with ID ${id}:`, data);
  // For sample data, we'll just return a mock success.
  return { ...data, id: id };
}

/**
 * Simulates deleting a resource by its ID (logs the action).
 * @param resource The name of the resource.
 * @param id The ID of the resource to delete.
 * @returns A promise that resolves when the resource is simulated deleted.
 */
export async function deleteItem(resource: string, id: string): Promise<void> {
  console.log(`Simulating deletion of ${resource} with ID ${id}`);
  // For sample data, we'll just return a mock success.
  return;
}
