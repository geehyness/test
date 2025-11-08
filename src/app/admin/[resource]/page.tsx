/* src/app/admin/[resource]/page.tsx */
'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';

import { entities } from '@/lib/config/entities';
import { fetchData, deleteItem } from '@/lib/api';
import {
  Box,
  Heading,
  Text,
  Button,
  // FIX: Import Alert and its parts
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Flex,
  Spacer,
  // FIX: Import AlertDialog and its parts
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  // FIX: Import Modal and its parts
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  HStack,
  useDisclosure,
} from '@chakra-ui/react';

interface Column {
  accessorKey: string;
  header: string | React.ReactNode;
  cell?: (row: any) => React.ReactNode;
  isSortable?: boolean;
}

export default function ResourceListPage() {
  const params = useParams();
  const router = useRouter();
  const resource = Array.isArray(params.resource) ? params.resource[0] : params.resource;
  const cfg = entities[resource];

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [viewItem, setViewItem] = useState<any | null>(null);

  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData(resource);
      setData(result || []);
    } catch (err: any) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    if (cfg) {
      refreshData();
    }
  }, [cfg, refreshData]);

  const handleDeleteClick = useCallback((item: any) => {
    setItemToDelete(item);
    onDeleteOpen();
  }, [onDeleteOpen]);

  const confirmDelete = useCallback(async () => {
    if (itemToDelete) {
      try {
        await deleteItem(resource, itemToDelete.id);
        onDeleteClose();
        refreshData();
      } catch (err: any) {
        setError(`Failed to delete item: ${err.message}`);
      }
    }
  }, [itemToDelete, resource, onDeleteClose, refreshData]);

  const handleViewClick = useCallback((item: any) => {
    setViewItem(item);
    onViewOpen();
  }, [onViewOpen]);

  if (!cfg) {
    return (
      <Alert status="error" rounded="md">
        <AlertIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>Resource &quot;{resource}&quot; not found.</AlertDescription>
      </Alert>
    );
  }

  const columns: Column[] = useMemo(() => {
    const baseColumns = cfg.fields.map(field => ({
      accessorKey: field,
      header: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      isSortable: true,
    }));
    
    return [
      ...baseColumns,
      {
        accessorKey: 'actions',
        header: 'Actions',
        isSortable: false,
        cell: (row: any) => (
          <HStack spacing={2}>
            <Button size="sm" onClick={() => router.push(`/admin/${resource}/${row.id}`)} colorScheme="blue">
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleViewClick(row)}>
              View
            </Button>
            <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleDeleteClick(row)}>
              Delete
            </Button>
          </HStack>
        ),
      }
    ];
  }, [cfg, router, handleViewClick, handleDeleteClick, resource]);

  return (
    <Box>
      <Flex mb={6} direction={{ base: 'column', md: 'row' }} align="center" gap={4}>
        <Heading as="h1" size="lg">
          Manage {cfg.label}
        </Heading>
        <Spacer />
        <Button onClick={() => router.push(`/admin/${resource}/new`)} colorScheme="green">
          Add New {cfg.label.slice(0, -1)}
        </Button>
      </Flex>

      {loading && (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" />
        </Flex>
      )}
      {error && (
        <Alert status="error" rounded="md">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!loading && !error && (
         <Box overflowX="auto">
            <DataTable columns={columns} data={data} />
         </Box>
      )}

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {cfg.label.slice(0, -1)}
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Details for {cfg.label.slice(0, -1)}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {viewItem ? (
              <VStack align="stretch" spacing={3}>
                {Object.entries(viewItem).map(([key, value]) => (
                  <Flex key={key} borderBottomWidth="1px" pb={2}>
                    <Text fontWeight="semibold" mr={2} textTransform="capitalize" flexShrink={0}>
                      {key.replace(/_/g, ' ')}:
                    </Text>
                    <Text wordBreak="break-word">
                      {typeof value === 'object' && value !== null
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            ) : (
              <Text>No item selected.</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}