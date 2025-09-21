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
    SimpleGrid,
    Icon,
    useColorModeValue,
    Divider,
} from "@chakra-ui/react";
import { usePOSStore } from "../../../lib/usePOSStore";
import { fetchData } from "@/lib/api";
import { Order, Table } from "@/lib/config/entities";
import {
    FaUserTie,
    FaUtensils,
    FaBoxOpen,
    FaClipboardList,
    FaClock,
    FaBuilding,
    FaUsers,
    FaChartLine,
    FaRegListAlt,
    FiCompass,
    FiSettings,
} from "react-icons/fa";
import NextLink from 'next/link';

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

    const cardBg = useColorModeValue("white", "gray.700");
    const cardBorder = useColorModeValue("gray.200", "gray.600");
    const hoverBg = useColorModeValue("var(--primary-green)", "green.700");
    const iconBg = useColorModeValue("var(--primary-green)", "green.500");
    const textColor = useColorModeValue("var(--dark-gray-text)", "white");

    const managementSections = [
        {
            name: "HR Management",
            roles: ["ar-admin", "ar-hr"],
            icon: FaUserTie,
            entities: [
                { name: "Employees", path: "/pos/management/employees", icon: FaUserTie },
                { name: "Shifts", path: "/pos/management/shifts", icon: FaClock },
                { name: "Timesheets", path: "/pos/management/timesheets", icon: FaClipboardList },
                { name: "Payroll", path: "/pos/management/payrolls", icon: FaChartLine },
            ],
        },
        {
            name: "Company",
            roles: ["ar-admin"],
            icon: FaBuilding,
            entities: [
                { name: "Company Info", path: "/pos/management/companies", icon: FaBuilding },
            ],
        },
        {
            name: "Menu Management",
            roles: ["ar-admin", "ar-hr", "ar-supply-chain"],
            icon: FaUtensils,
            entities: [
                { name: "Foods", path: "/pos/management/foods", icon: FaUtensils },
                { name: "Categories", path: "/pos/management/categories", icon: FaRegListAlt },
                { name: "Recipes", path: "/pos/management/recipes", icon: FaClipboardList },
            ],
        },
        {
            name: "Supply Chain",
            roles: ["ar-admin", "ar-supply-chain"],
            icon: FaBoxOpen,
            entities: [
                { name: "Inventory Products", path: "/pos/management/inventory_products", icon: FaBoxOpen },
                { name: "Inv. Categories", path: "/pos/management/inv_categories", icon: FaRegListAlt },
                { name: "Suppliers", path: "/pos/management/suppliers", icon: FaUserTie },
                { name: "Stock Adjustments", path: "/pos/management/stock_adjustments", icon: FaClipboardList },
            ],
        },
        {
            name: "Customer Management",
            roles: ["ar-admin", "ar-hr", "ar-server"],
            icon: FaUsers,
            entities: [
                { name: "Customers", path: "/pos/management/customers", icon: FaUsers },
                { name: "Reservations", path: "/pos/management/reservations", icon: FaClock },
            ],
        },
        {
            name: "Orders & Tables",
            roles: ["ar-admin", "ar-hr", "ar-supply-chain", "ar-server"],
            icon: FaClipboardList,
            entities: [
                { name: "Dashboard", path: "/pos/dashboard", icon: FiCompass },
                { name: "Tables", path: "/pos/management/tables", icon: FaRegListAlt },
            ],
        },
        {
            name: "Reports & Analytics",
            roles: ["ar-admin"],
            icon: FaChartLine,
            entities: [
                { name: "Access Reports", path: "/pos/admin/reports", icon: FaChartLine },
                { name: "Sales Reports", path: "/pos/management/reports", icon: FaChartLine },
            ],
        },
        {
            name: "System Settings",
            roles: ["ar-admin"],
            icon: FaClock,
            entities: [
                { name: "Access Roles", path: "/pos/management/access_roles", icon: FaUserTie },
                { name: "Payment Methods", path: "/pos/management/payment_methods", icon: FaClipboardList },
                { name: "Stores", path: "/pos/management/stores", icon: FaBuilding },
            ],
        },
    ];

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
        <Box p={6} bg="var(--light-gray-bg)" minH="100vh">
            <Heading as="h1" mb={6} color={textColor}>Management Dashboard</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {managementSections.filter(section => hasAccess(section.roles)).map((section) => (
                    <Box
                        key={section.name}
                        p={6}
                        borderRadius="lg"
                        bg={cardBg}
                        boxShadow="md"
                        border="1px solid"
                        borderColor={cardBorder}
                        transition="all 0.2s"
                        _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
                    >
                        <VStack spacing={4} align="stretch">
                            <Flex align="center">
                                <Box
                                    bg={iconBg}
                                    borderRadius="full"
                                    p={3}
                                    color="white"
                                    mr={4}
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    <Icon as={section.icon} w={5} h={5} />
                                </Box>
                                <Heading as="h2" size="md" color={textColor}>
                                    {section.name}
                                </Heading>
                            </Flex>

                            <Divider />

                            <VStack spacing={2} align="stretch">
                                {section.entities.map((entity) => (
                                    <Link
                                        key={entity.name}
                                        as={NextLink}
                                        href={entity.path}
                                        _hover={{ textDecoration: 'none' }}
                                    >
                                        <Flex
                                            align="center"
                                            p={3}
                                            borderRadius="md"
                                            bg="gray.50"
                                            color={textColor}
                                            _hover={{
                                                bg: hoverBg,
                                                color: "white",
                                            }}
                                            transition="all 0.2s ease-in-out"
                                        >
                                            {entity.icon && (
                                                <Icon
                                                    as={entity.icon}
                                                    mr={3}
                                                    w={4}
                                                    h={4}
                                                    color="inherit"
                                                />
                                            )}
                                            <Text fontSize="md" fontWeight="medium">
                                                {entity.name}
                                            </Text>
                                        </Flex>
                                    </Link>
                                ))}
                            </VStack>
                        </VStack>
                    </Box>
                ))}
            </SimpleGrid>
        </Box>
    );
}