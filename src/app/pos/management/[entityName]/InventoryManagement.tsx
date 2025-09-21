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
} from "@chakra-ui/react";
import { SearchIcon, WarningIcon } from "@chakra-ui/icons";
import { FaBox, FaExclamationTriangle, FaHistory, FaPlus, FaFileInvoice } from "react-icons/fa";
import { fetchData, getPurchaseOrders, getLowStockItems } from "@/lib/api";
import { InventoryProduct } from "@/lib/config/entities";
import InventoryModal from "./InventoryComponents/InventoryModal";
import InventoryTable from "./InventoryComponents/InventoryTable";
import LowStockAlert from "./InventoryComponents/LowStockAlert";
import StockHistory from "./InventoryComponents/StockHistory";
import PurchaseOrderManagement from "./PurchaseOrderManagement";

export default function InventoryManagement() {
    const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<InventoryProduct[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
    const toast = useToast();

    useEffect(() => {
        fetchInventoryData();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchTerm, inventoryProducts, activeTab]);

    const fetchInventoryData = async () => {
        try {
            setIsLoading(true);
            const [products, orders, lowStockItems] = await Promise.all([
                fetchData("inventory_products"),
                getPurchaseOrders(),
                getLowStockItems()
            ]);

            setInventoryProducts(products || []);
            setPurchaseOrders(orders || []);

            // Update low stock items with real data
            if (lowStockItems && lowStockItems.length > 0) {
                // You might want to merge this data with your existing products
                console.log("Low stock items:", lowStockItems);
            }
        } catch (error) {
            toast({
                title: "Error loading inventory",
                description: "Failed to fetch inventory data",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = inventoryProducts;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply tab-specific filters
        if (activeTab === 1) { // Low stock tab
            filtered = filtered.filter(product =>
                product.quantity_in_stock <= product.reorder_level
            );
        } else if (activeTab === 3) { // Purchase Orders tab
            // This tab doesn't use the product filter
            return;
        }

        setFilteredProducts(filtered);
    };

    const getInventoryStats = () => {
        const totalItems = inventoryProducts.length;
        const lowStockItems = inventoryProducts.filter(
            product => product.quantity_in_stock <= product.reorder_level
        ).length;
        const outOfStockItems = inventoryProducts.filter(
            product => product.quantity_in_stock === 0
        ).length;
        const totalValue = inventoryProducts.reduce(
            (sum, product) => sum + (product.quantity_in_stock * product.unit_cost), 0
        );

        // Calculate pending orders value
        const pendingOrdersValue = purchaseOrders
            .filter(po => ['draft', 'pending-approval', 'approved', 'ordered'].includes(po.status))
            .reduce((sum, po) => sum + (po.total_amount || 0), 0);

        return { totalItems, lowStockItems, outOfStockItems, totalValue, pendingOrdersValue };
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEditProduct = (product: InventoryProduct) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        fetchInventoryData(); // Refresh data after modal closes
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
                <Heading as="h1" size="xl">Inventory Management</Heading>
                <HStack spacing={4}>
                    <Button
                        leftIcon={<FaPlus />}
                        colorScheme="blue"
                        onClick={handleAddProduct}
                    >
                        Add Product
                    </Button>
                    <Button onClick={fetchInventoryData}>
                        Refresh
                    </Button>
                </HStack>
            </Flex>

            {/* Inventory Overview Stats */}
            <SimpleGrid columns={{ base: 2, md: 4, lg: 5 }} spacing={4} mb={6}>
                <Stat bg="white" p={4} borderRadius="md" shadow="sm">
                    <StatLabel>Total Items</StatLabel>
                    <StatNumber>{stats.totalItems}</StatNumber>
                    <StatHelpText>In inventory</StatHelpText>
                </Stat>

                <Stat bg="white" p={4} borderRadius="md" shadow="sm">
                    <StatLabel>Low Stock</StatLabel>
                    <StatNumber color={stats.lowStockItems > 0 ? "orange.500" : "green.500"}>
                        {stats.lowStockItems}
                    </StatNumber>
                    <StatHelpText>Need reordering</StatHelpText>
                </Stat>

                <Stat bg="white" p={4} borderRadius="md" shadow="sm">
                    <StatLabel>Out of Stock</StatLabel>
                    <StatNumber color={stats.outOfStockItems > 0 ? "red.500" : "green.500"}>
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
                    <StatHelpText>{purchaseOrders.filter(po =>
                        ['draft', 'pending-approval', 'approved', 'ordered'].includes(po.status)
                    ).length} orders</StatHelpText>
                </Stat>
            </SimpleGrid>

            <Tabs variant="enclosed" onChange={setActiveTab}>
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
                                {purchaseOrders.filter(po =>
                                    ['draft', 'pending-approval'].includes(po.status)
                                ).length}
                            </Badge>
                        </HStack>
                    </Tab>
                </TabList>

                {activeTab !== 3 && ( // Don't show search for Purchase Orders tab
                    <Box mb={4}>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <SearchIcon color="gray.300" />
                            </InputLeftElement>
                            <Input
                                placeholder="Search inventory items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
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
        </Box>
    );
}