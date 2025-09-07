// src/app/pos/management/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Box, Heading, Text, SimpleGrid, Button, VStack, Spinner, Center } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { entities, EntityConfig } from "@/lib/config/entities"; // Import entities config
import { usePOSStore } from "../../../lib/usePOSStore"; // Import the store

export default function POSManagementPage() {
    const router = useRouter();
    const { currentStaff } = usePOSStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentStaff === undefined) {
            setLoading(true);
            return;
        }

        // Only 'admin' and 'manager' roles are allowed to access this page.
        // Admins can manage everything, Managers can manage some data.
        const allowedRoles = ['admin', 'manager'];
        const userRole = currentStaff?.mainAccessRole?.name.toLowerCase();

        if (!currentStaff || !allowedRoles.includes(userRole || '')) {
            const redirectPath = currentStaff?.mainAccessRole?.name
                ? `/pos/${userRole}`
                : '/pos/login';
            router.replace(redirectPath);
            return;
        }

        setLoading(false);
    }, [currentStaff, router]);

    if (loading) {
        return (
            <Center minH="100vh" bg="var(--light-gray-bg)">
                <Spinner
                    size="xl"
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="var(--primary-green)"
                />
            </Center>
        );
    }

    // Filter entities to show only those relevant for management
    // You can customize this list based on what you want to expose in the UI
    const manageableEntities: { [key: string]: EntityConfig } = {
        foods: entities.foods,
        categories: entities.categories,
        customers: entities.customers,
        tables: entities.tables,
        employees: entities.employees,
        access_roles: entities.access_roles,
        inventory_products: entities.inventory_products,
        orders: entities.orders,
        taxes: entities.taxes,
        stores: entities.stores,
        job_titles: entities.job_titles,
        payment_methods: entities.payment_methods,
        brands: entities.brands,
        units: entities.units,
        suppliers: entities.suppliers,
        // Add other entities here as needed for management
        // e.g., taxes: entities.taxes, suppliers: entities.suppliers, etc.
    };

    return (
        <Box p={6}>
            <Heading as="h1" size="xl" mb={6} color="var(--dark-gray-text)">
                Data Management
            </Heading>

            <Text fontSize="lg" mb={8} color="var(--medium-gray-text)">
                Select a data type to manage.
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {Object.entries(manageableEntities).map(([key, config]) => (
                    <Button
                        key={key}
                        size="lg"
                        height="120px"
                        colorScheme="teal"
                        onClick={() => router.push(`/pos/management/${key}`)}
                        bg="var(--primary-teal)" // Use a consistent color or define new ones
                        color="white"
                        _hover={{ bg: "darken(var(--primary-teal), 10%)" }}
                        shadow="md"
                        rounded="lg"
                    >
                        <VStack>
                            <Text fontSize="xl" fontWeight="bold">
                                Manage {config.label}
                            </Text>
                            <Text fontSize="sm">View, Add, Edit, Delete {config.label.toLowerCase()}</Text>
                        </VStack>
                    </Button>
                ))}
            </SimpleGrid>
        </Box>
    );
}