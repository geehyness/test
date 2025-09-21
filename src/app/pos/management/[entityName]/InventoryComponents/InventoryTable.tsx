// src/app/pos/management/[entityName]/InventoryComponents/InventoryTable.tsx
"use client";

import React, { useState } from "react";
import {
    Badge,
    Button,
    HStack,
    useToast,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    useDisclosure,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Box,
    Progress,
    IconButton,
    Tooltip,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { InventoryProduct } from "@/lib/config/entities";
import { fetchData, deleteItem } from "@/lib/api";
import DataTable from "@/components/DataTable";

interface InventoryTableProps {
    products: InventoryProduct[];
    onUpdate: () => void;
    onEdit: (product: InventoryProduct) => void;
}

export default function InventoryTable({ products, onUpdate, onEdit }: InventoryTableProps) {
    const [adjustingProduct, setAdjustingProduct] = useState<InventoryProduct | null>(null);
    const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = React.useRef();
    const toast = useToast();

    const handleAdjustStock = async (product: InventoryProduct, adjustment: number) => {
        try {
            const newQuantity = product.quantity_in_stock + adjustment;
            await fetchData("inventory_products", product.id, {
                quantity_in_stock: Math.max(0, newQuantity)
            }, "PUT");

            toast({
                title: "Stock Updated",
                description: `Inventory adjusted by ${adjustment}`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            setAdjustingProduct(null);
            setAdjustmentValue(0);
            onUpdate();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update stock",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleDelete = async (productId: string) => {
        try {
            await deleteItem("inventory_products", productId);
            toast({
                title: "Deleted",
                description: "Inventory item removed",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            onUpdate();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete item",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            onClose();
        }
    };

    const getStockStatus = (product: InventoryProduct) => {
        if (product.quantity_in_stock === 0) return { status: "Out of Stock", color: "red" };
        if (product.quantity_in_stock <= product.reorder_level) return { status: "Low Stock", color: "orange" };
        return { status: "In Stock", color: "green" };
    };

    // Define columns for the DataTable
    const columns = [
        {
            accessorKey: "name",
            header: "Product",
            isSortable: true,
        },
        {
            accessorKey: "sku",
            header: "SKU",
            isSortable: true,
        },
        {
            accessorKey: "quantity_in_stock",
            header: "Current Stock",
            isSortable: true,
            cell: (row: InventoryProduct) => {
                const stockStatus = getStockStatus(row);
                const stockPercentage = (row.quantity_in_stock / (row.reorder_level * 2)) * 100;

                return (
                    <Box>
                        <Progress
                            value={stockPercentage}
                            colorScheme={stockStatus.color}
                            size="sm"
                            mb={1}
                            max={100}
                        />
                        {row.quantity_in_stock}
                    </Box>
                );
            },
        },
        {
            accessorKey: "reorder_level",
            header: "Reorder Level",
            isSortable: true,
        },
        {
            accessorKey: "unit_cost",
            header: "Unit Cost",
            isSortable: true,
            cell: (row: InventoryProduct) => `R${row.unit_cost.toFixed(2)}`,
        },
        {
            accessorKey: "status",
            header: "Status",
            isSortable: true,
            cell: (row: InventoryProduct) => {
                const stockStatus = getStockStatus(row);
                return (
                    <Badge colorScheme={stockStatus.color}>
                        {stockStatus.status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "actions",
            header: "Actions",
            cell: (row: InventoryProduct) => {
                return (
                    <HStack spacing={2}>
                        {adjustingProduct?.id === row.id ? (
                            <HStack>
                                <NumberInput
                                    size="sm"
                                    width="80px"
                                    value={adjustmentValue}
                                    onChange={(_, value) => setAdjustmentValue(value)}
                                    min={-row.quantity_in_stock}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Button
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={() => handleAdjustStock(row, adjustmentValue)}
                                >
                                    Apply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAdjustingProduct(null)}
                                >
                                    Cancel
                                </Button>
                            </HStack>
                        ) : (
                            <>
                                <Tooltip label="Edit product">
                                    <IconButton
                                        icon={<EditIcon />}
                                        size="sm"
                                        aria-label="Edit product"
                                        onClick={() => onEdit(row)}
                                    />
                                </Tooltip>
                                <Tooltip label="Adjust stock">
                                    <IconButton
                                        icon={<EditIcon />}
                                        size="sm"
                                        colorScheme="blue"
                                        aria-label="Adjust stock"
                                        onClick={() => {
                                            setAdjustingProduct(row);
                                            setAdjustmentValue(0);
                                        }}
                                    />
                                </Tooltip>
                                <Tooltip label="Delete item">
                                    <IconButton
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        colorScheme="red"
                                        aria-label="Delete item"
                                        onClick={() => {
                                            setAdjustingProduct(row);
                                            onOpen();
                                        }}
                                    />
                                </Tooltip>
                            </>
                        )}
                    </HStack>
                );
            },
        },
    ];

    return (
        <>
            <DataTable columns={columns} data={products} />

            <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Inventory Item
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to delete {adjustingProduct?.name}? This action cannot be undone.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={() => handleDelete(adjustingProduct?.id || "")} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
}