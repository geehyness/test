// src/app/pos/management/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    Flex,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Text,
    Heading,
    Box,
    VStack,
    Link,
    Divider,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    SimpleGrid,
    Icon,
} from "@chakra-ui/react";
import { usePOSStore } from "../lib/usePOSStore";
import { fetchData } from "@/app/lib/api";
import { Order, Table, Food, Category } from "@/app/config/entities";
import {
    FaUserTie,
    FaUtensils,
    FaBoxOpen,
    FaClipboardList,
    FaChair,
    FaClock,
    FaMoneyBill,
    FaBuilding,
    FaUsers,
    FaChartLine,
} from "react-icons/fa";

// Placeholder component for OrderManagementView
const OrderManagementView = ({ orders, tables, updateOrder, onLoadOrder }: {
    orders: Order[];
    tables: Table[];
    updateOrder: (orderId: string, updatedOrder: Partial<Order>) => void;
    onLoadOrder: (order: Order) => void;
}) => (
    <Box>
        {/* The Text component has been removed as requested */}
    </Box>
);

export default function ManagementPage() {
    const {
        activeOrders,
        tables,
        setActiveOrders,
        setTables,
        setMenuItems,
        setCategories,
        currentStaff,
    } = usePOSStore();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const managementSections = [
        {
            name: "HR Management",
            roles: ["ar-admin", "ar-hr"],
            icon: FaUserTie,
            entities: [
                { name: "Employees", path: "/pos/management/employees" },
                { name: "Shifts", path: "/pos/management/shifts" },
                { name: "Timesheets", path: "/pos/management/timesheets" },
                { name: "Payroll", path: "/pos/management/payrolls" },
            ],
        },
        {
            name: "Company",
            roles: ["ar-admin"],
            icon: FaBuilding,
            entities: [
                { name: "Company Info", path: "/pos/management/companies" },
            ],
        },
        {
            name: "Menu Management",
            roles: ["ar-admin", "ar-hr", "ar-supply-chain"],
            icon: FaUtensils,
            entities: [
                { name: "Foods", path: "/pos/management/foods" },
                { name: "Categories", path: "/pos/management/categories" },
                { name: "Recipes", path: "/pos/management/recipes" },
            ],
        },
        {
            name: "Supply Chain",
            roles: ["ar-admin", "ar-supply-chain"],
            icon: FaBoxOpen,
            entities: [
                { name: "Inventory Products", path: "/pos/management/inventory_products" },
                { name: "Inv. Categories", path: "/pos/management/inv_categories" },
                { name: "Suppliers", path: "/pos/management/suppliers" },
                { name: "Stock Adjustments", path: "/pos/management/stock_adjustments" },
            ],
        },
        {
            name: "Customer Management",
            roles: ["ar-admin", "ar-hr", "ar-server"],
            icon: FaUsers,
            entities: [
                { name: "Customers", path: "/pos/management/customers" },
                { name: "Reservations", path: "/pos/management/reservations" },
            ],
        },
        {
            name: "Orders & Tables",
            roles: ["ar-admin", "ar-hr", "ar-supply-chain", "ar-server"],
            icon: FaClipboardList,
            entities: [
                { name: "Dashboard", path: "/pos/dashboard" },
                { name: "Tables", path: "/pos/management/tables" },
            ],
        },
        {
            name: "Reports & Analytics",
            roles: ["ar-admin"],
            icon: FaChartLine,
            entities: [
                { name: "Access Reports", path: "/pos/admin/reports" },
                { name: "Sales Reports", path: "/pos/management/reports" },
            ],
        },
        {
            name: "System Settings",
            roles: ["ar-admin"],
            icon: FaClock,
            entities: [
                { name: "Access Roles", path: "/pos/management/access_roles" },
                { name: "Payment Methods", path: "/pos/management/payment_methods" },
                { name: "Stores", path: "/pos/management/stores" },
            ],
        },
    ];

    const updateOrder = async (orderId: string, updatedOrder: Partial<Order>) => {
        try {
            await fetchData("orders", orderId, updatedOrder, "PUT");
            console.log(
                `LOG: API call to update order #${orderId} with data:`,
                updatedOrder
            );
            usePOSStore.setState((state) => ({
                activeOrders: state.activeOrders.map((o) =>
                    o.id === orderId ? { ...o, ...updatedOrder } : o
                ),
            }));
            console.log(`LOG: Order #${orderId} updated in store.`);
        } catch (error: any) {
            console.error(`ERROR: Error updating order #${orderId}:`, error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [fetchedOrders, fetchedTables, fetchedFoods, fetchedCategories] =
                    await Promise.all([
                        fetchData("orders"),
                        fetchData("tables"),
                        fetchData("foods"),
                        fetchData("categories"),
                    ]);

                const allOrders = fetchedOrders || [];
                setActiveOrders(allOrders);
                setTables(fetchedTables || []);
                setMenuItems(fetchedFoods || []);
                setCategories(fetchedCategories || []);
            } catch (err: any) {
                setError(err.message || "Failed to load management data.");
                console.error("Error loading management data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [
        setActiveOrders,
        setTables,
        setMenuItems,
        setCategories,
    ]);

    if (loading) {
        return (
            <Flex justify="center" align="center" minH="calc(100vh - 80px)">
                <Spinner size="xl" color="var(--primary-green)" />
                <Text ml={4} fontSize="xl" color="var(--dark-gray-text)">
                    Loading management view...
                </Text>
            </Flex>
        );
    }

    if (error) {
        return (
            <Alert status="error" variant="left-accent" m={4}>
                <AlertIcon />
                <AlertTitle>Error Loading Management Data!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    const userAccessRoles = currentStaff?.access_role_ids
        ? Array.isArray(currentStaff.access_role_ids)
            ? currentStaff.access_role_ids
            : [currentStaff.access_role_ids]
        : [];

    const isAdmin = userAccessRoles.includes('ar-admin');

    const hasAccess = (roles: string[]) => {
        if (isAdmin) return true;
        return roles.some(role => userAccessRoles.includes(role));
    };

    return (
        <Flex direction="column" h="100vh" p={4} bg="white">
            <Heading as="h1" mb={6} color="#333">Management Dashboard</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} overflowY="auto">
                {managementSections.filter(section => hasAccess(section.roles)).map((section) => (
                    <Card key={section.name} p={6} borderRadius="lg" bg="white" boxShadow="md" border="1px solid" borderColor="gray.200">
                        <CardHeader p={0} mb={4} minHeight="4rem" textAlign="center">
                            <VStack spacing={2}>
                                <Box
                                    bg="var(--primary-green)"
                                    borderRadius="full"
                                    p={3}
                                    color="white"
                                >
                                    <Icon as={section.icon} w={6} h={6} />
                                </Box>
                                <Heading as="h2" size="md" color="var(--dark-gray-text)">
                                    {section.name}
                                </Heading>
                            </VStack>
                        </CardHeader>
                        <Box my={4} width="80%" mx="auto">
                            <Divider borderColor="var(--primary-green)" borderWidth="1px" />
                        </Box>
                        <CardBody p={0}>
                            <VStack spacing={3} align="stretch">
                                {section.entities.map((entity) => (
                                    <Link key={entity.name} href={entity.path} _hover={{ textDecoration: 'none' }}>
                                        <Box
                                            p={3}
                                            borderRadius="md"
                                            bg="gray.50"
                                            color="var(--dark-gray-text)"
                                            _hover={{
                                                bg: "var(--primary-green)",
                                                color: "white",
                                                transform: "translateY(-2px)",
                                                boxShadow: "md"
                                            }}
                                            transition="all 0.2s ease-in-out"
                                        >
                                            <Text fontSize="md" fontWeight="medium" textAlign="center">
                                                {entity.name}
                                            </Text>
                                        </Box>
                                    </Link>
                                ))}
                            </VStack>
                        </CardBody>
                        {section.name === "Orders & Tables" && (
                            <CardFooter p={0} pt={4}>
                                <OrderManagementView
                                    orders={activeOrders}
                                    tables={tables}
                                    updateOrder={updateOrder}
                                    onLoadOrder={() => { }}
                                />
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </SimpleGrid>
        </Flex>
    );
}