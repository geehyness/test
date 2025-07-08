/* src/app/[resource]/page.tsx */
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DataTable from '../components/DataTable'; // Path to your DataTable component
import { entities } from '../config/entities'; // Your entity definitions
import { fetchData, deleteItem } from '../lib/api'; // API functions for data operations

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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
} from '@chakra-ui/react';

// Define the Column interface (can be global or defined here if preferred)
interface Column {
  accessorKey: string;
  header: string | React.ReactNode;
  cell?: (row: any) => React.ReactNode;
}

export default function ResourceListPage() {
  const { resource } = useParams() as { resource: string };
  const router = useRouter();
  const cfg = entities[resource];

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [viewItem, setViewItem] = useState<any | null>(null);

  const { isOpen: isAlertDialogOpen, onOpen: onAlertDialogOpen, onClose: onAlertDialogClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();

  const pageTitle = cfg?.label || resource.charAt(0).toUpperCase() + resource.slice(1);

  // Function to fetch data for the DataTable
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData(resource);
      setData(result);
    } catch (err) {
      console.error(`Failed to fetch data for ${resource}:`, err);
      setError(`Failed to load ${pageTitle} data. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [resource, pageTitle]);

  // Load data on component mount
  useEffect(() => {
    if (cfg) { // Only fetch data if resource config is found
      refreshData();
    }
  }, [cfg, refreshData]);

  // Handlers for CRUD operations from the table
  const handleDeleteClick = useCallback((item: any) => {
    setItemToDelete(item);
    onAlertDialogOpen();
  }, [onAlertDialogOpen]);

  const confirmDelete = useCallback(async () => {
    if (itemToDelete) {
      try {
        await deleteItem(resource, itemToDelete.id);
        onAlertDialogClose();
        refreshData(); // Refresh the table data after deletion
      } catch (err) {
        console.error(`Failed to delete item ${itemToDelete.id} for ${resource}:`, err);
        setError(`Failed to delete ${cfg?.label.slice(0, -1) || 'item'}. Please try again.`);
      }
    }
  }, [itemToDelete, resource, onAlertDialogClose, refreshData, cfg]);

  const handleViewClick = useCallback((item: any) => {
    setViewItem(item);
    onViewModalOpen();
  }, [onViewModalOpen]);

  // Render logic
  if (!cfg) {
    return (
      <Alert status="error" variant="left-accent" rounded="md" bg="var(--background-color-light)" color="var(--dark-gray-text)">
        <AlertIcon />
        <AlertTitle color="var(--text-color-dark)">Error!</AlertTitle>
        <AlertDescription color="var(--medium-gray-text)">Resource &quot;{resource}&quot; not found.</AlertDescription>
      </Alert>
    );
  }

  // Define the Actions column
  const actionsColumn: Column = {
    accessorKey: 'actions',
    header: 'Actions',
    cell: (row: any) => (
      <HStack spacing={2}>
        <Button
          size="sm"
          onClick={() => router.push(`/${resource}/${row.id}`)}
          bg="var(--primary-green)" // Use primary green for edit
          color="var(--background-color-light)"
          _hover={{ bg: 'var(--primary-green-dark)' }}
          className="font-medium"
        >
          Edit
        </Button>
        <Button
          size="sm"
          onClick={() => handleViewClick(row)}
          variant="outline"
          borderColor="var(--border-color)"
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
  };

  // Dynamically generate columns from cfg.fields and prepend the Actions column
  const columns: Column[] = [
    actionsColumn, // Actions column at the beginning
    ...cfg.fields.map(field => ({
      accessorKey: field,
      header: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    })),
  ];

  return (
    <Box>
      <Flex mb={6} align="center">
        <Heading as="h1" color="var(--text-color-dark)" className="font-semibold">
          {pageTitle}
        </Heading>
        <Spacer />
        <Button
          onClick={() => router.push(`/${resource}/new`)}
          bg="var(--primary-green)" // Primary green for new button
          color="var(--background-color-light)"
          _hover={{ bg: 'var(--primary-green-dark)' }}
          className="font-medium"
        >
          Add New {cfg.label.slice(0, -1)}
        </Button>
      </Flex>

      {/* Loading state for data table */}
      {loading && (
        <Alert status="info" variant="left-accent" rounded="md" bg="var(--background-color-light)" color="var(--dark-gray-text)">
          <AlertIcon />
          <AlertTitle color="var(--text-color-dark)">Loading data...</AlertTitle>
          <AlertDescription color="var(--medium-gray-text)">Fetching all {pageTitle} for the table.</AlertDescription>
        </Alert>
      )}

      {/* Error state for data table */}
      {error && (
        <Alert status="error" variant="left-accent" rounded="md" bg="var(--background-color-light)" color="var(--dark-gray-text)">
          <AlertIcon />
          <AlertTitle color="var(--text-color-dark)">Error!</AlertTitle>
          <AlertDescription color="var(--medium-gray-text)">{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Table Section */}
      {!loading && !error && (
        <Box mt={4} p={6} bg="var(--background-color-light)" rounded="lg" shadow="md"> {/* Card styling for the table */}
          <DataTable columns={columns} data={data} />
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
                        ? JSON.stringify(value, null, 2)
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