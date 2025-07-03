'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CRUDForm from '../../components/CRUDForm'; // Path adjusted
import { entities } from '../../config/entities';
import { fetchItemData, createItem, updateItem } from '../../lib/api'; // Import API functions
import {
  Box,
  Heading,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Flex,
  VStack, // Used for spacing in the container
} from '@chakra-ui/react'; // Chakra UI components

export default function ResourceDetailPage() {
  const { resource, id } = useParams() as { resource: string; id: string };
  const router = useRouter();
  const cfg = entities[resource];

  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = id !== 'new';

  useEffect(() => {
    const loadItemData = async () => {
      if (isEditMode) {
        setLoading(true);
        setError(null);
        try {
          const item = await fetchItemData(resource, id);
          if (item) {
            setInitialData(item);
          } else {
            setError(`Item with ID ${id} not found for ${cfg?.label || resource}.`);
          }
        } catch (err) {
          console.error(`Failed to fetch item ${id} for ${resource}:`, err);
          setError(`Failed to load item. ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // No data to load for new items
      }
    };

    if (cfg) { // Only attempt to load if config exists
      loadItemData();
    } else {
      setLoading(false);
      setError(`Resource "${resource}" configuration not found.`);
    }
  }, [resource, id, isEditMode, cfg]); // Added cfg to dependencies

  // Handle form submission (create or update)
  const handleSubmit = async (formData: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      if (isEditMode) {
        await updateItem(resource, id, formData);
        console.log('Item updated successfully:', formData);
      } else {
        await createItem(resource, formData);
        console.log('Item created successfully:', formData);
      }
      router.push(`/${resource}`); // Navigate back to the list page
    } catch (err) {
      console.error('Form submission failed:', err);
      setError(`Failed to save item. ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

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
    <VStack className="form-page-container" align="stretch" spacing={6}> {/* Using VStack for space-y-6 */}
      <Heading as="h1" className="form-page-title">
        {isEditMode ? `Edit ${cfg.label.slice(0, -1)} #${id}` : `New ${cfg.label.slice(0, -1)}`}
      </Heading>

      {/* Loading state using Chakra UI Alert */}
      {loading && (
        <Alert status="info" variant="left-accent" rounded="md" className="form-loading-alert">
          <AlertIcon />
          <AlertTitle>Loading form...</AlertTitle>
          <AlertDescription>Fetching data for {cfg.label.slice(0, -1)}.</AlertDescription>
        </Alert>
      )}

      {/* Error state using Chakra UI Alert */}
      {error && (
        <Alert status="error" variant="left-accent" rounded="md" className="form-error-alert">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Only render CRUDForm if not loading and no critical error preventing form display */}
      {!loading && !error && (
        <CRUDForm
          entity={resource}
          fields={cfg.fields}
          initialData={initialData}
          onSubmit={handleSubmit}
        />
      )}
    </VStack>
  );
}
