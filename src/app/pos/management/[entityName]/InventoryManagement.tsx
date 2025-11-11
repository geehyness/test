
// src/app/pos/management/[entityName]/InventoryManagement.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Flex,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Center,
  Text,
  Badge,
  Alert,
  AlertIcon,
  HStack,
  VStack,
  Divider,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Select,
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { SearchIcon, WarningIcon } from "@chakra-ui/icons";
import {
  FaBox,
  FaExclamationTriangle,
  FaHistory,
  FaPlus,
  FaFileInvoice,
  FaSync,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import {
  getInventoryProducts,
  getPurchaseOrders,
  getLowStockItems,
  getSuppliers,
  deleteInventoryProduct,
  getInvCategories
} from "@/lib/api";
import { InventoryProduct } from "@/lib/config/entities";
import InventoryModal from "./InventoryComponents/InventoryModal";
import InventoryTable from "./InventoryComponents/InventoryTable";
import LowStockAlert from "./InventoryComponents/LowStockAlert";
import StockHistory from "./InventoryComponents/StockHistory";
import PurchaseOrderManagement from "./PurchaseOrderManagement";

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  pendingOrdersValue: number;
  categoriesCount: number;
}

export default function InventoryManagement() {
  const [inventoryProducts, setInventoryProducts] = useState<
    InventoryProduct[]
  >([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryProduct[]>(
    []
  );
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(
    null
  );
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const toast = useToast();

  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose,
  } = useDisclosure();

  useEffect(() => {
    fetchInventoryData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [
    searchTerm,
    categoryFilter,
    supplierFilter,
    inventoryProducts,
    activeTab,
  ]);

  // Update the fetchInventoryData function
  const fetchInventoryData = async () => {
    try {
      setIsLoading(true);

      // Load all required data in parallel
      const [products, orders, lowStockItems, supplierList, categoryList] = await Promise.all([
        getInventoryProducts(),
        getPurchaseOrders(),
        getLowStockItems(),
        getSuppliers(),
        getInvCategories() // Add this to load categories
      ]);

      setInventoryProducts(products || []);
      setPurchaseOrders(orders || []);
      setSuppliers(supplierList || []);
      setInvCategories(categoryList || []); // Add this state

    } catch (error: any) {
      toast({
        title: "Error loading inventory",
        description: error.message || "Failed to fetch inventory data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this state to the component
  const [invCategories, setInvCategories] = useState<any[]>([]);

  // Update the filterProducts function to include better filtering
  const filterProducts = () => {
    let filtered = inventoryProducts;

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.location_in_warehouse?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(
        (product) => product.inv_category_id === categoryFilter
      );
    }

    if (supplierFilter) {
      filtered = filtered.filter(
        (product) => product.supplier_id === supplierFilter
      );
    }

    if (activeTab === 1) {
      filtered = filtered.filter(
        (product) => product.quantity_in_stock <= product.reorder_level
      );
    }

    // Add stock status filtering
    if (activeTab === 2) { // Out of stock tab
      filtered = filtered.filter(product => product.quantity_in_stock === 0);
    }

    setFilteredProducts(filtered);
  };


  const getInventoryStats = (): InventoryStats => {
    const totalItems = inventoryProducts.length;
    const lowStockItems = inventoryProducts.filter(
      (product) =>
        product.quantity_in_stock <= product.reorder_level &&
        product.quantity_in_stock > 0
    ).length;
    const outOfStockItems = inventoryProducts.filter(
      (product) => product.quantity_in_stock === 0
    ).length;
    const totalValue = inventoryProducts.reduce(
      (sum, product) =>
        sum + product.quantity_in_stock * (product.unit_cost || 0),
      0
    );

    const pendingOrdersValue = purchaseOrders
      .filter((po) =>
        ["draft", "pending-approval", "approved", "ordered"].includes(po.status)
      )
      .reduce((sum, po) => sum + (po.total_amount || 0), 0);

    const categoriesCount = new Set(
      inventoryProducts.map((p) => p.inv_category_id).filter(Boolean)
    ).size;

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      pendingOrdersValue,
      categoriesCount,
    };
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: InventoryProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setDeleteProductId(productId);
    onDeleteDialogOpen();
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return;

    try {
      setIsProcessing(true);
      await deleteInventoryProduct(deleteProductId);

      toast({
        title: "Product deleted",
        description: "Inventory product has been deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      fetchInventoryData();
    } catch (error: any) {
      toast({
        title: "Error deleting product",
        description: error.message || "Failed to delete inventory product",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
      setDeleteProductId(null);
      onDeleteDialogClose();
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    fetchInventoryData();
  };

  const stats = getInventoryStats();

  if (isLoading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={6} zIndex={0}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="xl">
          Inventory Management
        </Heading>
        <HStack spacing={4}>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            onClick={handleAddProduct}
            isLoading={isProcessing}
          >
            Add Product
          </Button>
          <Button
            leftIcon={<FaSync />}
            onClick={fetchInventoryData}
            isLoading={isProcessing}
          >
            Refresh
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={6}>
        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Total Items</StatLabel>
          <StatNumber>{stats.totalItems}</StatNumber>
          <StatHelpText>In inventory</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Low Stock</StatLabel>
          <StatNumber
            color={stats.lowStockItems > 0 ? "orange.500" : "green.500"}
          >
            {stats.lowStockItems}
          </StatNumber>
          <StatHelpText>Need reordering</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Out of Stock</StatLabel>
          <StatNumber
            color={stats.outOfStockItems > 0 ? "red.500" : "green.500"}
          >
            {stats.outOfStockItems}
          </StatNumber>
          <StatHelpText>Urgent attention</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Inventory Value</StatLabel>
          <StatNumber>R{stats.totalValue.toFixed(2)}</StatNumber>
          <StatHelpText>Current stock worth</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Pending Orders</StatLabel>
          <StatNumber color="blue.500">
            R{stats.pendingOrdersValue.toFixed(2)}
          </StatNumber>
          <StatHelpText>
            {
              purchaseOrders.filter((po) =>
                ["draft", "pending-approval", "approved", "ordered"].includes(
                  po.status
                )
              ).length
            }{" "}
            orders
          </StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Categories</StatLabel>
          <StatNumber color="purple.500">{stats.categoriesCount}</StatNumber>
          <StatHelpText>Product categories</StatHelpText>
        </Stat>
      </SimpleGrid>

      {stats.outOfStockItems > 0 && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">
              {stats.outOfStockItems} product(s) are out of stock
            </Text>
            <Text fontSize="sm">
              Urgent action required to restock these items.
            </Text>
          </VStack>
        </Alert>
      )}

      {stats.lowStockItems > 0 && (
        <Alert status="warning" mb={4} borderRadius="md">
          <AlertIcon />
          <Text>
            {stats.lowStockItems} product(s) are running low on stock. Consider
            reordering.
          </Text>
        </Alert>
      )}

      <Tabs variant="enclosed" onChange={(index) => setActiveTab(index)}>
        <TabList mb={4} overflowX="auto">
          <Tab>
            <HStack>
              <Icon as={FaBox} />
              <Text>All Inventory</Text>
              <Badge colorScheme="blue">{inventoryProducts.length}</Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={FaExclamationTriangle} color="orange.500" />
              <Text>Low Stock</Text>
              <Badge colorScheme="orange">{stats.lowStockItems}</Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={FaHistory} />
              <Text>Stock History</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={FaFileInvoice} color="purple.500" />
              <Text>Purchase Orders</Text>
              <Badge colorScheme="purple">
                {
                  purchaseOrders.filter((po) =>
                    ["draft", "pending-approval"].includes(po.status)
                  ).length
                }
              </Badge>
            </HStack>
          </Tab>
        </TabList>

        {activeTab !== 2 && activeTab !== 3 && (
          <Box mb={4} p={4} bg="white" borderRadius="md" shadow="sm">
            <Flex direction={{ base: "column", md: "row" }} gap={4}>
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <FormControl width={{ base: "100%", md: "200px" }}>
                <FormLabel>Category</FormLabel>
                <Select
                  placeholder="All categories"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {invCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl width={{ base: "100%", md: "200px" }}>
                <FormLabel>Supplier</FormLabel>
                <Select
                  placeholder="All suppliers"
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                >
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Flex>
          </Box>
        )}

        <TabPanels>
          <TabPanel p={0}>
            <InventoryTable
              products={filteredProducts}
              onUpdate={fetchInventoryData}
              onEdit={handleEditProduct}
            />
          </TabPanel>
          <TabPanel p={0}>
            <LowStockAlert
              products={filteredProducts}
              onUpdate={fetchInventoryData}
            />
          </TabPanel>
          <TabPanel p={0}>
            <StockHistory />
          </TabPanel>
          <TabPanel p={0}>
            <PurchaseOrderManagement />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <InventoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        product={editingProduct}
      />

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={undefined}
        onClose={onDeleteDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Inventory Product
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this inventory product? This
              action cannot be undone and may affect existing recipes and
              orders.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteDialogClose} isDisabled={isProcessing}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDeleteProduct}
                ml={3}
                isLoading={isProcessing}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
