'use client'; // This directive is crucial for using client-side hooks like useParams, useRouter, useEffect, useState, useCallback

import React, { useEffect, useState, useCallback, useRef } from 'react'; // Added useRef for AlertDialog
import { useParams, useRouter } from 'next/navigation'; // Next.js navigation hooks
import DataTable from './components/DataTable'; // Adjust path based on your project structure
import { entities } from './config/entities'; // Your entity definitions
import { fetchData, deleteItem } from './lib/api'; // API functions for data operations

import {
  Box,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Flex,
  Spacer,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure, // For managing AlertDialog state
  Modal, // Chakra UI Modal for view details
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack, // For modal content layout
} from '@chakra-ui/react'; // Chakra UI components

// Define the Column interface directly in this file to resolve import issues
// This ensures TypeScript recognizes 'Column' as a type within this file's scope.
interface Column {
  accessorKey: string; // The key in your data object (e.g., 'id', 'name')
  header: string | React.ReactNode; // The header text or a React component
  cell?: (row: any) => React.ReactNode; // Optional custom cell renderer
}

// Define a mapping for important fields to display in the list table for each resource
// This allows showing only key information in the main table, and full details in the modal.
const importantFieldsMap: Record<string, string[]> = {
  users: ['id', 'name', 'email', 'created_at'],
  foods: ['id', 'name', 'code', 'price', 'food_category_id'],
  sales: ['id', 'customer_name', 'total', 'grand_total', 'status', 'created_at'],
  employees: ['id', 'name', 'phone', 'employee_category_id', 'created_at'],
  customers: ['id', 'name', 'phone', 'address', 'points'],
  orders: ['id', 'table_id', 'customer_id', 'total_amount', 'status', 'created_at'],
  products: ['id', 'name', 'code', 'price', 'product_category_id'],
  suppliers: ['id', 'name', 'phone', 'address'],
  purchases: ['id', 'supplier_name', 'grand_total', 'status', 'created_at'],
  // Add more entities here with their important fields.
  // If an entity is not listed, it will default to showing 'id', 'name', 'email', or the first few available fields.
};


/**
 * ResourceListPage component displays a list of items for a given resource.
 * It fetches data using the API, displays it in a DataTable, and provides
 * functionality for adding, editing, and deleting items.
 */
export default function ResourceListPage() {
  const { resource } = useParams() as { resource: string }; // Get the dynamic resource name from the URL
  const router = useRouter(); // Next.js router for navigation
  const cfg = entities[resource]; // Get configuration for the current resource from entities.ts

  const [data, setData] = useState<any[]>([]); // State to store fetched data
  const [loading, setLoading] = useState(true); // State to manage loading status (set to true initially)
  const [error, setError] = useState<string | null>(null); // State to store any error messages
  const [itemToDelete, setItemToDelete] = useState<string | null>(null); // State to hold the ID of the item to be deleted
  const [viewItem, setViewItem] = useState<any | null>(null); // State to hold the item data for viewing

  // Chakra UI's useDisclosure hook for managing AlertDialog open/close state
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();

  const cancelRef = useRef<HTMLButtonElement>(null); // Ref for AlertDialog cancel button

  // Function to fetch data from the API
  const loadData = useCallback(async () => {
    console.log('loadData: Setting loading to true');
    setLoading(true); // Set loading to true before fetching
    setError(null); // Clear any previous errors
    try {
      const result = await fetchData(resource); // Fetch data using the API function
      setData(result); // Update data state with fetched results
      console.log('loadData: Data fetched successfully');
    } catch (err) {
      console.error(`Failed to fetch ${resource}:`, err); // Log error to console
      setError(`Failed to load data. ${err instanceof Error ? err.message : String(err)}`); // Set user-friendly error message
    } finally {
      console.log('loadData: Setting loading to false');
      setLoading(false); // Set loading to false after fetching (success or failure)
    }
  }, [resource]); // Dependency array: re-run if 'resource' changes

  // useEffect hook to load data when the component mounts or 'resource' changes
  useEffect(() => {
    if (cfg) { // Only load data if resource config is found
      console.log('useEffect: Resource config found, calling loadData');
      loadData();
    } else {
      console.log('useEffect: Resource config NOT found, setting loading to false and error');
      setLoading(false);
      setError(`Resource "${resource}" not found.`); // Set error if resource config is missing
    }
  }, [resource, cfg, loadData]); // Dependency array: re-run if 'resource', 'cfg', or 'loadData' changes

  // Handler for "Add New" button click
  const handleAddNew = () => {
    router.push(`/${resource}/new`); // Navigate to the new item creation page
  };

  // Handler for "Edit" button click in DataTable
  const handleEdit = (id: string) => {
    router.push(`/${resource}/${id}`); // Navigate to the item edit page
  };

  // Handler for "Delete" button click in DataTable (opens confirmation dialog)
  const handleDelete = (id: string) => {
    setItemToDelete(id); // Store the ID of the item to be deleted
    onDeleteConfirmOpen(); // Open the AlertDialog
  };

  // Handler for confirming deletion in AlertDialog
  const confirmDelete = async () => {
    if (itemToDelete) {
      console.log('confirmDelete: Setting loading to true');
      setLoading(true); // Show loading spinner during deletion
      setError(null); // Clear any previous errors
      try {
        await deleteItem(resource, itemToDelete); // Call API to delete the item
        await loadData(); // Reload data after successful deletion
        onDeleteConfirmClose(); // Close the AlertDialog
        setItemToDelete(null); // Clear item to delete
        console.log('confirmDelete: Item deleted and data reloaded');
      } catch (err) {
        console.error(`Failed to delete item ${itemToDelete} from ${resource}:`, err); // Log error
        setError(`Failed to delete item. ${err instanceof Error ? err.message : String(err)}`); // Set error message
      } finally {
        console.log('confirmDelete: Setting loading to false');
        setLoading(false); // Hide loading spinner
      }
    }
  };

  // Handler for canceling deletion in AlertDialog
  const cancelDelete = () => {
    onDeleteConfirmClose(); // Close the AlertDialog
    setItemToDelete(null); // Clear item to delete
  };

  // Handler for "View" button click in DataTable (opens view modal)
  const handleView = (row: any) => {
    setViewItem(row); // Set the item to be viewed
    onViewModalOpen(); // Open the view modal
  };

  // Define columns for the DataTable dynamically based on resource fields
  const columns: Column[] = cfg
    ? [
        // Actions column first
        {
          accessorKey: 'actions', // Custom column for actions
          header: 'Actions',
          cell: (row: any) => (
            <Flex> {/* Use Flex for horizontal buttons */}
              <Button size="sm" colorScheme="blue" onClick={() => handleView(row)} mr={2}>
                View
              </Button>
              <Button size="sm" colorScheme="blue" onClick={() => handleEdit(row.id)} mr={2}>
                Edit
              </Button>
              <Button size="sm" colorScheme="red" onClick={() => handleDelete(row.id)}>
                Delete
              </Button>
            </Flex>
          ),
        },
        // Dynamically generate columns for important fields
        ...(importantFieldsMap[resource] || cfg.fields.slice(0, 4)).map((field) => ({ // Default to first 4 fields if not in map
          accessorKey: field,
          header: field.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()), // Format header
          // Optional: Add styling to ensure single line and contained width for table cells
          cell: (row: any) => (
            <Text noOfLines={1} overflow="hidden" textOverflow="ellipsis">
              {String(row[field] ?? '')}
            </Text>
          ),
        })),
      ]
    : []; // Empty array if no config

  // Render error message if resource config is not found
  if (!cfg) {
    return (
      <Alert status="error" variant="left-accent" rounded="md">
        <AlertIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>Resource &quot;{resource}&quot; not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box p={4} minH="100vh"> {/* Use Box for container, with padding and min height */}
      <Flex align="center" mb={6}> {/* Use Flex for title and button alignment */}
        <Heading as="h1" size="xl" color="gray.800">
          {cfg.label}
        </Heading>
        <Spacer /> {/* Pushes the button to the right */}
        <Button colorScheme="green" onClick={handleAddNew}>
          Add New {cfg.label.slice(0, -1)} {/* e.g., "Add New User" */}
        </Button>
      </Flex>

      {/* Loading state using Chakra UI Spinner and Text */}
      {loading && (
        <Flex direction="column" align="center" justify="center" minH="200px">
          <Spinner size="xl" color="blue.500" mb={4} />
          <Text fontSize="lg" color="gray.600">Loading {cfg.label}...</Text>
        </Flex>
      )}

      {/* Error state using Chakra UI Alert */}
      {error && (
        <Alert status="error" variant="left-accent" rounded="md" mb={4}>
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* No data state using Chakra UI Alert */}
      {!loading && !error && data.length === 0 && (
        <Alert status="info" variant="left-accent" rounded="md" mb={4}>
          <AlertIcon />
          <AlertTitle>No Data!</AlertTitle>
          <AlertDescription>No {cfg.label} found.</AlertDescription>
        </Alert>
      )}

      {/* DataTable display (only when not loading and no error, and data exists) */}
      {!loading && !error && data.length > 0 && (
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" shadow="md"> {/* Added styling for the table container */}
          <DataTable columns={columns} data={data} />
        </Box>
      )}

      {/* Delete Confirmation Modal using Chakra UI AlertDialog */}
      <AlertDialog
        isOpen={isDeleteConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteConfirmClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Deletion
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteConfirmClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* View Details Modal */}
      <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="xl"> {/* Increased size for more content */}
        <ModalOverlay />
        <ModalContent rounded="lg" shadow="xl"> {/* More pronounced shadow for floating card feel */}
          <ModalHeader borderBottomWidth="1px" pb={3}>
            Details for {cfg?.label.slice(0, -1) || 'Item'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {viewItem ? (
              <VStack align="stretch" spacing={3}>
                {Object.entries(viewItem).map(([key, value]) => (
                  <Flex key={key} borderBottomWidth="1px" borderColor="gray.100" pb={2}>
                    <Text fontWeight="semibold" mr={2} textTransform="capitalize">
                      {key.replace(/_/g, ' ')}:
                    </Text>
                    <Text>
                      {typeof value === 'object' && value !== null
                        ? JSON.stringify(value, null, 2) // Stringify objects for display
                        : String(value)}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            ) : (
              <Text>No item selected for viewing.</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
