/* src/app/[resource]/[id]/page.tsx */
'use client'; // This directive is crucial for using client-side hooks like useParams, useRouter, useEffect, useState, useCallback

import React, { useEffect, useState, useCallback, useRef } from 'react'; // Added useRef for AlertDialog
import { useParams, useRouter } from 'next/navigation'; // Next.js navigation hooks
import DataTable from '../../../components/DataTable'; // CORRECTED PATH
import CRUDForm from '../../../components/CRUDForm'; // Adjust path based on your project structure
import { entities } from '../../../lib/config/entities'; // Your entity definitions
import { fetchData, deleteItem } from '../../../lib/api'; // API functions for data operations

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
  VStack,
  HStack, // For modal content layout
} from '@chakra-ui/react'; // Chakra UI components

// Define the Column interface directly in this file to resolve import issues
// This ensures TypeScript recognizes 'Column' as a type within this file's scope.
interface Column {
  accessorKey: string; // The key in your data object (e.g., 'id', 'name')
  header: string | React.ReactNode; // The header text or a React component
  cell?: (row: any) => React.ReactNode; // Optional custom cell renderer
}

export default function ResourceDetailPage() {
  const { resource, id } = useParams() as { resource: string; id: string };
  const router = useRouter();
  const cfg = entities[resource];

  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]); // State to hold fetched data for DataTable
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<any | null>(null); // State to hold the item selected for deletion
  const [viewItem, setViewItem] = useState<any | null>(null); // State to hold the item selected for viewing

  const { isOpen: isAlertDialogOpen, onOpen: onAlertDialogOpen, onClose: onAlertDialogClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();

  const isEditMode = id !== 'new';
  const pageTitle = isEditMode
    ? `Edit ${cfg?.label.slice(0, -1) || 'Item'} #${id}`
    : `New ${cfg?.label.slice(0, -1) || 'Item'}`;

  // --- Data Fetching for CRUDForm (for 'edit' mode) ---
  useEffect(() => {
    const loadItemData = async () => {
      if (isEditMode) {
        setLoading(true);
        setError(null);
        try {
          // Corrected: fetchData for a single item (GET method)
          const item = await fetchData(resource, id, undefined, 'GET');
          if (item) {
            setInitialData(item);
          } else {
            setError(`Item with ID ${id} not found for ${cfg?.label || resource}.`);
          }
        } catch (err) {
          console.error(`Failed to fetch item ${id} for ${resource}:`, err);
          setError(`Failed to load ${cfg?.label.slice(0, -1)}. Please try again.`);
        } finally {
          setLoading(false);
        }
      } else {
        // For 'new' mode, initialData should be an empty object or default values
        setInitialData({});
        setLoading(false);
      }
    };

    if (cfg) { // Only load data if resource config is found
      loadItemData();
    }
  }, [resource, id, isEditMode, cfg]);

  // --- Data Fetching for DataTable (for displaying all items) ---
  const refreshData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);
    try {
      // Corrected: fetchData for all items (GET method, no id)
      const result = await fetchData(resource, undefined, undefined, 'GET');
      setData(result);
    } catch (err) {
      console.error(`Failed to fetch data for ${resource}:`, err);
      setDataError(`Failed to load ${cfg?.label || resource} data. Please try again.`);
    } finally {
      setIsDataLoading(false);
    }
  }, [resource, cfg]);

  useEffect(() => {
    if (cfg) { // Only fetch data if resource config is found
      refreshData();
    }
  }, [cfg, refreshData]);

  // --- CRUD Operations ---
  const handleFormSubmit = useCallback(async (formData: Record<string, any>) => {
    try {
      if (isEditMode) {
        // Corrected: fetchData for update (PUT method)
        await fetchData(resource, id, formData, 'PUT');
        router.push(`/${resource}`); // Redirect back to list view after update
      } else {
        // Corrected: fetchData for create (POST method) - pass undefined for id
        await fetchData(resource, undefined, formData, 'POST');
        router.push(`/${resource}`); // Redirect back to list view after creation
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setError(`Failed to save ${cfg?.label.slice(0, -1)}. Please check your input and try again.`);
    }
  }, [isEditMode, resource, id, router, cfg]);

  const handleDeleteClick = useCallback((item: any) => {
    setItemToDelete(item);
    onAlertDialogOpen();
  }, [onAlertDialogOpen]);

  const confirmDelete = useCallback(async () => {
    if (itemToDelete) {
      try {
        await deleteItem(resource, itemToDelete.id); // Call your delete API function
        onAlertDialogClose();
        refreshData(); // Refresh the table data after deletion
      } catch (err) {
        console.error(`Failed to delete item ${itemToDelete.id} for ${resource}:`, err);
        setError(`Failed to delete ${cfg?.label.slice(0, -1)}. Please try again.`);
      }
    }
  }, [itemToDelete, resource, onAlertDialogClose, refreshData, cfg]);

  const handleViewClick = useCallback((item: any) => {
    setViewItem(item);
    onViewModalOpen();
  }, [onViewModalOpen]);


  // --- Render Logic ---
  if (!cfg) {
    return (
      <Alert status="error" variant="left-accent" rounded="md" bg="var(--background-color-light)" color="var(--dark-gray-text)">
        <AlertIcon />
        <AlertTitle color="var(--text-color-dark)">Error!</AlertTitle>
        <AlertDescription color="var(--medium-gray-text)">Resource &quot;{resource}&quot; not found.</AlertDescription>
      </Alert>
    );
  }

  // Define columns for DataTable
  // This example dynamically generates columns from cfg.fields
  // You might want to customize `header` and `cell` for specific fields
  const columns: Column[] = cfg.fields.map(field => ({
    accessorKey: field,
    header: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), // Convert snake_case to Title Case
  }));

  // Add Action column if not in edit mode
  if (!isEditMode) {
    columns.push({
      accessorKey: 'actions',
      header: 'Actions',
      cell: (row: any) => (
        <HStack spacing={2}>
          <Button
            size="sm"
            onClick={() => router.push(`/${resource}/${row.id}`)}
            bg="var(--primary-green)" // Use primary green for edit
            color="var(--background-color-light)"
            _hover={{ bg: 'var(--primary-green-dark)' }} // Darker green on hover
            className="font-medium"
          >
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => handleViewClick(row)}
            variant="outline"
            borderColor="var(--border-color)" // Use border color
            color="var(--dark-gray-text)"
            _hover={{ bg: 'var(--light-gray-bg)' }}
            className="font-medium"
          >
            View
          </Button>
          <Button
            size="sm"
            onClick={() => handleDeleteClick(row)}
            colorScheme="red"
            variant="outline"
            className="font-medium"
          >
            Delete
          </Button>
        </HStack>
      ),
    });
  }


  return (
    <Box>
      <Flex mb={6} align="center">
        <Heading
          as="h1"
          color="var(--text-color-dark)" // Consistent heading color
          className="font-semibold"
        >
          {pageTitle}
        </Heading>
        <Spacer />
        {!isEditMode && (
          <Button
            onClick={() => router.push(`/${resource}/new`)}
            bg="var(--primary-green)" // Primary green for new button
            color="var(--background-color-light)"
            _hover={{ bg: 'var(--primary-green-dark)' }}
            className="font-medium"
          >
            Add New {cfg.label.slice(0, -1)}
          </Button>
        )}
      </Flex>

      {/* Loading state for form */}
      {loading && isEditMode && ( // Only show loading spinner when in edit mode and loading initial data
        <Alert status="info" variant="left-accent" rounded="md" bg="var(--background-color-light)" color="var(--dark-gray-text)">
          <AlertIcon />
          <AlertTitle color="var(--text-color-dark)">Loading form...</AlertTitle>
          <AlertDescription color="var(--medium-gray-text)">Fetching data for {cfg.label.slice(0, -1)}.</AlertDescription>
        </Alert>
      )}

      {/* Error state for form */}
      {error && (
        <Alert status="error" variant="left-accent" rounded="md" bg="var(--background-color-light)" color="var(--dark-gray-text)">
          <AlertIcon />
          <AlertTitle color="var(--text-color-dark)">Error!</AlertTitle>
          <AlertDescription color="var(--medium-gray-text)">{error}</AlertDescription>
        </Alert>
      )}

      {/* Render CRUDForm only if not loading and no critical error preventing form display */}
      {!loading && !error && (
        <Box p={6} bg="var(--background-color-light)" rounded="lg" shadow="md"> {/* Card styling for the form */}
          <CRUDForm
            entity={resource}
            fields={cfg.fields}
            initialData={initialData}
            onSubmit={handleFormSubmit}
          />
        </Box>
      )}

      {/* Data Table Section (only visible for list view, not edit/new) */}
      {!isEditMode && (
        <Box mt={8}>
          <Heading
            as="h2"
            size="md"
            mb={4}
            color="var(--text-color-dark)"
            className="font-semibold"
          >
            All {cfg.label}
          </Heading>

          {isDataLoading && (
            <Alert status="info" variant="left-accent" rounded="md" bg="var(--background-color-light)" color="var(--dark-gray-text)">
              <AlertIcon />
              <AlertTitle color="var(--text-color-dark)">Loading data...</AlertTitle>
              <AlertDescription color="var(--medium-gray-text)">Fetching all {cfg.label} for the table.</AlertDescription>
            </Alert>
          )}

          {dataError && (
            <Alert status="error" variant="left-accent" rounded="md" bg="var(--background-color-light)" color="var(--dark-gray-text)">
              <AlertIcon />
              <AlertTitle color="var(--text-color-dark)">Error!</AlertTitle>
              <AlertDescription color="var(--medium-gray-text)">{dataError}</AlertDescription>
            </Alert>
          )}

          {!isDataLoading && !dataError && (
            <DataTable columns={columns} data={data} />
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isAlertDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAlertDialogClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent rounded="lg" shadow="xl" bg="var(--background-color-light)" color="var(--dark-gray-text)">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" borderBottomWidth="1px" pb={3} color="var(--text-color-dark)">
              Delete {cfg?.label.slice(0, -1)}
            </AlertDialogHeader>

            <AlertDialogBody py={4} color="var(--medium-gray-text)">
              Are you sure you want to delete this {cfg?.label.slice(0, -1)} (ID: {itemToDelete?.id})? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter borderTopWidth="1px" pt={3}>
              <Button ref={cancelRef} onClick={onAlertDialogClose} variant="outline" borderColor="var(--border-color)" color="var(--dark-gray-text)" className="font-medium">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3} className="font-medium">
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* View Details Modal */}
      <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="xl">
        <ModalOverlay />
        <ModalContent rounded="lg" shadow="xl" bg="var(--background-color-light)" color="var(--dark-gray-text)">
          <ModalHeader borderBottomWidth="1px" pb={3} color="var(--text-color-dark)" className="font-semibold">
            Details for {cfg?.label.slice(0, -1) || 'Item'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {viewItem ? (
              <VStack align="stretch" spacing={3}>
                {Object.entries(viewItem).map(([key, value]) => (
                  <Flex key={key} borderBottomWidth="1px" borderColor="var(--border-color)" pb={2}>
                    <Text fontWeight="semibold" mr={2} textTransform="capitalize" color="var(--dark-gray-text)">
                      {key.replace(/_/g, ' ')}:
                    </Text>
                    <Text color="var(--medium-gray-text)">
                      {typeof value === 'object' && value !== null
                        ? JSON.stringify(value, null, 2) // Stringify objects for display
                        : String(value)}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            ) : (
              <Text color="var(--medium-gray-text)">No item selected for viewing.</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
