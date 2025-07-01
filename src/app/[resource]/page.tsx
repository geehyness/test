'use client'; // This directive is crucial for using client-side hooks like useParams, useRouter, useEffect, useState, useCallback

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Next.js navigation hooks
import DataTable from '../components/DataTable'; // Adjust path based on your project structure
import { entities } from '../config/entities'; // Your entity definitions
import { fetchData, deleteItem } from '../lib/api'; // API functions for data operations

// Define the Column interface directly in this file to resolve import issues
// This ensures TypeScript recognizes 'Column' as a type within this file's scope.
interface Column {
  accessorKey: string; // The key in your data object (e.g., 'id', 'name')
  header: string | React.ReactNode; // The header text or a React component
  cell?: (row: any) => React.ReactNode; // Optional custom cell renderer
}

/**
 * ResourceListPage component displays a list of items for a given resource.
 * It fetches data using the API, displays it in a DataTable, and provides
 * functionality for editing and deleting items.
 */
export default function ResourceListPage() {
  // useParams hook to get the dynamic 'resource' segment from the URL
  const { resource } = useParams() as { resource: string };
  // useRouter hook for programmatic navigation
  const router = useRouter();

  // Get the configuration for the current resource from entities.ts
  const cfg = entities[resource];

  // State to hold the fetched data for the DataTable
  const [data, setData] = useState<any[]>([]);
  // State to manage loading status
  const [loading, setLoading] = useState(true);
  // State to manage any errors during data fetching or operations
  const [error, setError] = useState<string | null>(null);
  // State to control the visibility of the delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // State to store the ID of the item to be deleted
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  /**
   * useCallback hook to memoize the data loading function.
   * This prevents unnecessary re-creations of the function and helps with useEffect dependencies.
   */
  const loadData = useCallback(async () => {
    setLoading(true); // Set loading to true before fetching data
    setError(null);    // Clear any previous errors
    try {
      // Fetch data for the current resource using the API function
      const fetchedData = await fetchData(resource);
      setData(fetchedData); // Update the data state
    } catch (err) {
      console.error(`Failed to fetch ${resource}:`, err);
      // Set an error message if fetching fails
      setError(`Failed to load ${cfg?.label || resource}. Please try again.`);
    } finally {
      setLoading(false); // Set loading to false after fetching (whether success or error)
    }
  }, [resource, cfg?.label]); // Dependencies: resource and its label from config

  /**
   * useEffect hook to load data when the component mounts or when the resource changes.
   */
  useEffect(() => {
    if (cfg) { // Only attempt to load data if the resource configuration is found
      loadData();
    }
  }, [cfg, loadData]); // Dependencies: cfg (for initial load) and loadData (memoized function)

  // If the resource configuration is not found, display an error message
  if (!cfg) {
    return <p className="text-red-500 text-xl font-semibold p-4">Unknown resource: {resource}</p>;
  }

  /**
   * Handles navigation to the edit page for a specific item.
   * @param id The ID of the item to edit.
   */
  const handleEdit = (id: string) => {
    router.push(`/${resource}/${id}`); // Navigate to the dynamic detail page for editing
  };

  /**
   * Initiates the delete process by showing a confirmation modal.
   * @param id The ID of the item to delete.
   */
  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);         // Store the ID of the item to be deleted
    setShowDeleteConfirm(true);  // Show the confirmation modal
  };

  /**
   * Confirms and executes the deletion of an item.
   */
  const confirmDelete = async () => {
    if (itemToDelete) { // Ensure there's an item selected for deletion
      try {
        await deleteItem(resource, itemToDelete); // Call the API to delete the item
        await loadData(); // Reload the data to reflect the deletion
        setShowDeleteConfirm(false); // Close the modal
        setItemToDelete(null);       // Clear the item to delete
      } catch (err) {
        console.error(`Failed to delete ${resource} with ID ${itemToDelete}:`, err);
        setError(`Failed to delete item. ${err instanceof Error ? err.message : String(err)}`);
        setShowDeleteConfirm(false); // Close modal even on error
      }
    }
  };

  /**
   * Cancels the delete operation and hides the confirmation modal.
   */
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  // Define columns for DataTable. This dynamically creates columns based on entity fields.
  // It also adds a static 'Actions' column for edit/delete buttons.
  // Explicitly type `columns` as `Column[]` to allow the `cell` property.
  const columns: Column[] = cfg.fields.map((field) => ({
    accessorKey: field, // The key in your data object
    // Format the header name (e.g., 'first_name' becomes 'First Name')
    header: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  }));

  // Add the 'Actions' column to the end of the columns array
  columns.push({
    accessorKey: 'actions',
    header: 'Actions',
    // Custom cell renderer for the 'Actions' column to display buttons
    cell: (row: any) => (
      <div className="flex space-x-2">
        <button
          onClick={() => handleEdit(String(row.id))} // Pass item ID to edit handler
          className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-200"
        >
          Edit
        </button>
        <button
          onClick={() => handleDeleteClick(String(row.id))} // Pass item ID to delete handler
          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
        >
          Delete
        </button>
      </div>
    ),
  });

  return (
    <div className="space-y-6 p-4">
      {/* Header section with resource label and 'New' button */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-3xl font-extrabold text-gray-800">{cfg.label}</h1>
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-medium"
          onClick={() => router.push(`/${resource}/new`)} // Navigate to the 'new' item creation page
        >
          New {cfg.label.slice(0, -1)} {/* e.g., "New User" from "Users" */}
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600 text-xl">Loading {cfg.label}...</p>
        </div>
      )}

      {/* Error message display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* No data message */}
      {!loading && !error && data.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No Data!</strong>
          <span className="block sm:inline"> No {cfg.label} found.</span>
        </div>
      )}

      {/* DataTable display (only when not loading and no error, and data exists) */}
      {!loading && !error && data.length > 0 && (
        <DataTable columns={columns} data={data} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
