/* src/app/admin/[resource]/[id]/page.tsx */
'use client'; 

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import CRUDForm from '@/components/CRUDForm';
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
}

export default function ResourceDetailPage() {
  const { resource, id } = useParams() as { resource: string; id: string };
  const router = useRouter();
  const cfg = entities[resource];

  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isOpen: isAlertDialogOpen, onOpen: onAlertDialogOpen, onClose: onAlertDialogClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);


  const isEditMode = id !== 'new';
  const pageTitle = isEditMode
    ? `Edit ${cfg?.label.slice(0, -1) || 'Item'} #${id}`
    : `New ${cfg?.label.slice(0, -1) || 'Item'}`;

  useEffect(() => {
    const loadItemData = async () => {
      if (isEditMode) {
        setLoading(true);
        setError(null);
        try {
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
        setInitialData({});
        setLoading(false);
      }
    };

    if (cfg) {
      loadItemData();
    }
  }, [resource, id, isEditMode, cfg]);

  const handleFormSubmit = useCallback(async (formData: Record<string, any>) => {
    try {
      if (isEditMode) {
        await fetchData(resource, id, formData, 'PUT');
        router.push(`/admin/${resource}`);
      } else {
        await fetchData(resource, undefined, formData, 'POST');
        router.push(`/admin/${resource}`);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setError(`Failed to save ${cfg?.label.slice(0, -1)}. Please check your input and try again.`);
    }
  }, [isEditMode, resource, id, router, cfg]);


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
    <Box>
      <Flex mb={6} align="center">
        <Heading as="h1">
          {pageTitle}
        </Heading>
        <Spacer />
        <Button onClick={() => router.back()}>
            Back to List
        </Button>
      </Flex>

      {loading && isEditMode && (
        <Alert status="info" variant="left-accent" rounded="md">
          <AlertIcon />
          <AlertTitle>Loading form...</AlertTitle>
          <AlertDescription>Fetching data for {cfg.label.slice(0, -1)}.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert status="error" variant="left-accent" rounded="md">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && (
        <Box p={{ base: 4, md: 6 }} bg="white" rounded="lg" shadow="md">
          <CRUDForm
            entity={resource}
            fields={cfg.fields}
            initialData={initialData}
            onSubmit={handleFormSubmit}
          />
        </Box>
      )}
    </Box>
  );
}