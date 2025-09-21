// src/app/pos/management/[entityName]/InventoryComponents/LowStockAlert.tsx
"use client";

import React from "react";
import {
    Box,
    VStack,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    SimpleGrid,
    Card,
    CardBody,
    Text,
    Badge,
    HStack,
    Button,
    useToast,
    Flex,
    Progress,
    Icon,
} from "@chakra-ui/react";
import { FaExclamationTriangle, FaShoppingCart } from "react-icons/fa";
import { InventoryProduct } from "@/lib/config/entities";
import { fetchData } from "@/lib/api";

interface LowStockAlertProps {
    products: InventoryProduct[];
    onUpdate: () => void;
}

export default function LowStockAlert({ products, onUpdate }: LowStockAlertProps) {
    const toast = useToast();

    const handleRestock = async (productId: string, quantity: number) => {
        try {
            await fetchData("inventory_products", productId, {
                quantity_in_stock: quantity + 10 // Add 10 units
            }, "PUT");

            toast({
                title: "Restocked",
                description: "Inventory updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            onUpdate();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update inventory",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    if (products.length === 0) {
        return (
            <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Box>
                    <AlertTitle>No Low Stock Items!</AlertTitle>
                    <AlertDescription>
                        All inventory items are sufficiently stocked.
                    </AlertDescription>
                </Box>
            </Alert>
        );
    }

    return (
        <VStack spacing={4} align="stretch">
            <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                    <AlertTitle>Low Stock Alert</AlertTitle>
                    <AlertDescription>
                        {products.length} item{products.length !== 1 ? 's' : ''} need{products.length === 1 ? 's' : ''} immediate attention
                    </AlertDescription>
                </Box>
            </Alert>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {products.map((product) => {
                    const stockPercentage = (product.quantity_in_stock / product.reorder_level) * 100;
                    const isCritical = product.quantity_in_stock === 0;

                    return (
                        <Card key={product.id} borderLeft={isCritical ? "4px solid red" : "4px solid orange"}>
                            <CardBody>
                                <VStack spacing={3} align="stretch">
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">{product.name}</Text>
                                        <Badge colorScheme={isCritical ? "red" : "orange"}>
                                            {isCritical ? "Out of Stock" : "Low Stock"}
                                        </Badge>
                                    </HStack>

                                    <Text fontSize="sm">SKU: {product.sku}</Text>

                                    <Box>
                                        <HStack justify="space-between" mb={1}>
                                            <Text fontSize="sm">Current: {product.quantity_in_stock}</Text>
                                            <Text fontSize="sm">Reorder: {product.reorder_level}</Text>
                                        </HStack>
                                        <Progress
                                            value={stockPercentage}
                                            colorScheme={isCritical ? "red" : "orange"}
                                            size="sm"
                                        />
                                    </Box>

                                    <Text>Unit Cost: R{product.unit_cost.toFixed(2)}</Text>

                                    <Button
                                        leftIcon={<FaShoppingCart />}
                                        colorScheme="blue"
                                        size="sm"
                                        onClick={() => handleRestock(product.id, product.quantity_in_stock)}
                                    >
                                        Restock (+10)
                                    </Button>
                                </VStack>
                            </CardBody>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </VStack>
    );
}