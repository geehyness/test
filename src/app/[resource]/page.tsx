/* src/app/[resource]/page.tsx */
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DataTable from '../../components/DataTable'; // Direct import

import { entities } from '../../lib/config/entities';
import { fetchData, deleteItem } from '../../lib/api';
import { dashboardMenu } from '../../components/Navbar'; // Import dashboardMenu

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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';

// Define the Column interface to include the new isSortable property
interface Column {
  accessorKey: string;
  header: string | React.ReactNode;
  cell?: (row: any) => React.ReactNode;
  isSortable?: boolean; // Added isSortable property
}

// Helper to get a human-readable label from an entity key
const getEntityLabel = (key: string): string => {
  return entities[key]?.label || key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function ResourceListPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // The 'resource' from the URL path, e.g., 'foods', 'sales'
  const mainResourcePath = Array.isArray(params.resource) ? params.resource[0] : params.resource || '';

  // State for the currently active sub-menu tab's full href (e.g., '/sales?tab=sale_items')
  const [activeSubMenuHref, setActiveSubMenuHref] = useState<string>('');

  // State for the configuration of the currently active entity (e.g., entities.foods, entities.sale_items)
  const [currentCfg, setCurrentCfg] = useState<any>(null);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();
  const [viewItem, setViewItem] = useState<any>(null);

  // Determine the sub-menus to display as tabs based on the main resource path
  const tabsToDisplay = React.useMemo(() => {
    const mainMenuItem = dashboardMenu.find(item => item.href === `/${mainResourcePath}`);
    return mainMenuItem?.subMenus || [];
  }, [mainResourcePath]);

  // Derive columns based on the currentCfg
  const columns: Column[] = React.useMemo(() => {
    if (!currentCfg || !Array.isArray(currentCfg.fields)) {
      return [];
    }
    // Extract the base path for CRUD operations (e.g., 'sales', 'sale_items')
    // This will be used to construct /resource/new or /resource/edit/id
    const baseCrudPath = currentCfg.endpoint.replace('/api/', '');

    return currentCfg.fields.map((fieldName: string) => {
      const header = fieldName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

      if (fieldName === 'actions') {
        return {
          accessorKey: 'actions',
          header: 'Actions',
          isSortable: false, // Actions column is typically not sortable
          cell: (row: any) => (
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => {
                  setViewItem(row);
                  onViewModalOpen();
                }}
              >
                View
              </Button>
              <Button
                size="sm"
                colorScheme="green"
                onClick={() => router.push(`/${baseCrudPath}/edit/${row.id}`)} // Use baseCrudPath
              >
                Edit
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                onClick={() => {
                  setItemToDelete(row);
                  onDeleteModalOpen();
                }}
              >
                Delete
              </Button>
            </HStack>
          ),
        };
      }
      return {
        accessorKey: fieldName,
        header: header,
        isSortable: true, // Make most other columns sortable by default
      };
    });
  }, [currentCfg, router, onViewModalOpen, onDeleteModalOpen, setItemToDelete, setViewItem]);


  // Function to load data for the current configuration
  const loadData = useCallback(async () => {
    if (!currentCfg || !currentCfg.endpoint) {
      setLoading(false);
      setError("Endpoint not defined for this tab's configuration.");
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchData(currentCfg.endpoint);
      setData(result);
    } catch (err: any) {
      console.error(`Failed to fetch ${currentCfg.label || 'data'} data:`, err);
      setError(`Failed to load data for ${currentCfg.label || 'this tab'}: ${err.message || 'An unknown error occurred'}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentCfg]);

  // Effect to determine the active entity configuration based on URL params and tabs
  useEffect(() => {
    let targetEntityKey: string | null = null;
    let targetHref: string = '';

    const tabParam = searchParams.get('tab');

    if (tabsToDisplay.length > 0) {
      // This resource has sub-menus (tabs)
      if (tabParam) {
        // A specific tab is selected via URL param
        targetEntityKey = tabParam;
        targetHref = `/${mainResourcePath}?tab=${tabParam}`;
      } else {
        // No tab param, default to the first sub-menu item
        targetEntityKey = tabsToDisplay[0].href.replace('/', '');
        targetHref = tabsToDisplay[0].href; // Use the full href from dashboardMenu
      }
    } else {
      // This resource does not have sub-menus, it's a direct entity
      targetEntityKey = mainResourcePath;
      targetHref = `/${mainResourcePath}`;
    }

    if (!targetEntityKey) {
      setError("Could not determine the entity to display.");
      setCurrentCfg(null);
      setActiveSubMenuHref('');
      setLoading(false);
      return;
    }

    const config = entities[targetEntityKey];

    if (config) {
      setCurrentCfg(config);
      setActiveSubMenuHref(targetHref);
      setError(null); // Clear any previous errors
    } else {
      setError(`Configuration not found for resource: ${targetEntityKey}`);
      setCurrentCfg(null);
      setData([]);
      setLoading(false);
    }
  }, [mainResourcePath, searchParams, tabsToDisplay]); // Rerun when main path or search params change

  // Effect to load data when currentCfg changes
  useEffect(() => {
    if (currentCfg) {
      loadData();
    }
  }, [currentCfg, loadData]);

  const handleDelete = async () => {
    if (itemToDelete && currentCfg && currentCfg.endpoint) {
      try {
        await deleteItem(currentCfg.endpoint, itemToDelete.id);
        onDeleteModalClose();
        loadData(); // Reload data after successful deletion
      } catch (err: any) {
        console.error(`Failed to delete item:`, err);
        setError(`Failed to delete item: ${err.message || 'An unknown error occurred'}`);
      }
    }
  };

  const handleTabChange = (index: number) => {
    if (tabsToDisplay[index]) {
      const newTabItem = tabsToDisplay[index];
      const newTabHref = newTabItem.href;
      // Update URL with the main resource path and the new tab parameter
      router.push(`/${mainResourcePath}?tab=${newTabHref.replace('/', '')}`);
    }
  };

  // Determine active tab index for display
  const activeTabIndex = tabsToDisplay.findIndex(
    (item) => {
      // For tabs, compare the resource key derived from the item.href with the targetEntityKey
      const itemResourceKey = item.href.replace('/', '');
      const currentTargetEntityKey = currentCfg?.endpoint.replace('/api/', '');
      return itemResourceKey === currentTargetEntityKey;
    }
  );


  // If there are no tabs to display for this main resource, show a message
  // This condition should also handle cases where the mainResourcePath itself is the entity
  if (tabsToDisplay.length === 0 && !currentCfg) {
    // This means it's a direct entity like /tenants, and its config wasn't found or loaded yet
    if (loading) {
      return (
        <Flex justify="center" align="center" minH="200px" p={4}>
          <Spinner size="xl" color="var(--primary-green)" />
        </Flex>
      );
    }
    return (
      <Box p={6} bg="var(--background-color-light)" rounded="lg" shadow="md" m={4}>
        <Alert status="info" rounded="md" shadow="md">
          <AlertIcon />
          <AlertTitle>No Tabs Available</AlertTitle>
          <AlertDescription>
            There are no specific sub-categories or tabs defined for the &quot;{getEntityLabel(mainResourcePath)}&quot; section, and no direct configuration found.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} bg="var(--background-color-light)" rounded="lg" shadow="md" m={4}>
      <Flex mb={6} alignItems="center">
        <Heading as="h1" size="lg" color="var(--text-color-dark)" className="font-semibold">
          {currentCfg ? `Manage ${currentCfg.label}` : getEntityLabel(mainResourcePath)}
        </Heading>
        <Spacer />
        {currentCfg && (
          <Button
            colorScheme="blue"
            onClick={() => router.push(`/${currentCfg.endpoint.replace('/api/', '')}/new`)} // Use baseCrudPath
            px={6}
          >
            Add New {currentCfg.label.slice(0, -1)}
          </Button>
        )}
      </Flex>

      {tabsToDisplay.length > 0 && (
        <Tabs
          index={activeTabIndex !== -1 ? activeTabIndex : 0} // Ensure a valid index, default to 0
          onChange={handleTabChange}
          variant="enclosed"
          colorScheme="blue"
        >
          <TabList className="scrollable-tabs">
            {tabsToDisplay.map((item) => (
              <Tab key={item.href} color="var(--dark-gray-text)" _selected={{ color: 'var(--primary-green)', borderColor: 'var(--primary-green)' }}>
                {item.name}
              </Tab>
            ))}
          </TabList>
          <TabPanels>
            {tabsToDisplay.map((item) => (
              <TabPanel key={item.href} p={0} pt={4}>
                {/* Only render content for the currently active tab based on currentCfg's endpoint */}
                {currentCfg && item.href.replace('/', '') === currentCfg.endpoint.replace('/api/', '') ? (
                  error ? (
                    <Alert status="error" rounded="md" shadow="md">
                      <AlertIcon />
                      <AlertTitle>Error!</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : loading ? (
                    <Flex justify="center" align="center" minH="200px">
                      <Spinner size="xl" color="var(--primary-green)" />
                    </Flex>
                  ) : (
                    currentCfg && Array.isArray(currentCfg.fields) && data.length > 0 ? (
                      <DataTable columns={columns} data={data} />
                    ) : (
                      <Box p={4}>
                        <Text color="var(--medium-gray-text)">No data available or configuration incomplete for this tab.</Text>
                      </Box>
                    )
                  )
                ) : (
                  <Box minH="200px" /> // Placeholder for inactive tabs
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}

      {/* Render DataTable directly if no tabs are present but currentCfg is valid (e.g., for /tenants) */}
      {tabsToDisplay.length === 0 && currentCfg && (
        error ? (
          <Alert status="error" rounded="md" shadow="md">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color="var(--primary-green)" />
          </Flex>
        ) : (
          currentCfg && Array.isArray(currentCfg.fields) && data.length > 0 ? (
            <DataTable columns={columns} data={data} />
          ) : (
            <Box p={4}>
              <Text color="var(--medium-gray-text)">No data available or configuration incomplete for this entity.</Text>
            </Box>
          )
        )
      )}


      {/* Delete Confirmation Dialog (remains unchanged) */}
      <AlertDialog
        isOpen={isDeleteModalOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteModalClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent rounded="lg" shadow="xl" bg="var(--background-color-light)" color="var(--dark-gray-text)">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="var(--text-color-dark)">
              Delete {currentCfg?.label.slice(0, -1) || 'Item'}
            </AlertDialogHeader>
            <AlertDialogBody color="var(--dark-gray-text)">
              Are you sure you want to delete &quot;{itemToDelete ? (itemToDelete.name || itemToDelete.id) : 'this item'}&quot;? You can&apos;t undo this action.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteModalClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* View Details Modal (FIX APPLIED HERE) */}
      <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="xl">
        <ModalOverlay />
        <ModalContent rounded="lg" shadow="xl" bg="var(--background-color-light)" color="var(--dark-gray-text)">
          <ModalHeader borderBottomWidth="1px" pb={3} color="var(--text-color-dark)" className="font-semibold">
            Details for {currentCfg?.label.slice(0, -1) || 'Item'}
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
                    {/* FIX: Replaced <Text> with <Box> and added styling to handle raw HTML/JSON correctly */}
                    <Box
                      as="div"
                      color="var(--medium-gray-text)"
                      whiteSpace="pre-wrap"
                      wordBreak="break-word"
                    >
                      {typeof value === 'object' && value !== null
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </Box>
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
