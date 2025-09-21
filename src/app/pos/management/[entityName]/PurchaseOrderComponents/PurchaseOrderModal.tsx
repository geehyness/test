// src/app/pos/management/[entityName]/PurchaseOrderComponents/PurchaseOrderModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    VStack,
    HStack,
    useToast,
    Text,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    Box,
    Textarea,
    Badge,
    Heading
} from "@chakra-ui/react";
import { FaPlus, FaTrash, FaSave, FaPaperPlane } from "react-icons/fa";
import { createPurchaseOrder, updatePurchaseOrder, getInventoryProducts } from "@/lib/api";

interface PurchaseOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    suppliers: any[];
    onSave: () => void;
}

interface OrderItem {
    id?: string;
    inventory_product_id: string;
    ordered_quantity: number;
    unit_price: number;
    product_name?: string;
    product_sku?: string;
}

export default function PurchaseOrderModal({
    isOpen, onClose, order, suppliers, onSave
}: PurchaseOrderModalProps) {
    const [poNumber, setPoNumber] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [siteId, setSiteId] = useState("");
    const [orderDate, setOrderDate] = useState("");
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<OrderItem[]>([]);
    const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchInventoryProducts();

            if (order) {
                // Editing existing order
                setPoNumber(order.po_number || "");
                setSupplierId(order.supplier_id || "");
                setSiteId(order.site_id || "");
                setOrderDate(order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : "");
                setExpectedDeliveryDate(order.expected_delivery_date ?
                    new Date(order.expected_delivery_date).toISOString().split('T')[0] : "");
                setNotes(order.notes || "");

                // Load order items if available
                if (order.items && order.items.length > 0) {
                    setItems(order.items);
                }
            } else {
                // Creating new order
                setPoNumber(`PO-${Date.now()}`);
                setSupplierId("");
                setSiteId("");
                setOrderDate(new Date().toISOString().split('T')[0]);
                setExpectedDeliveryDate("");
                setNotes("");
                setItems([]);
            }
        }
    }, [isOpen, order]);

    const fetchInventoryProducts = async () => {
        try {
            const products = await getInventoryProducts();
            setInventoryProducts(products || []);
        } catch (error) {
            console.error("Failed to fetch inventory products:", error);
        }
    };

    const addItem = () => {
        setItems([...items, {
            inventory_product_id: "",
            ordered_quantity: 1,
            unit_price: 0
        }]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => {
            return total + (item.ordered_quantity * item.unit_price);
        }, 0);
    };

    const validateForm = () => {
        if (!supplierId) {
            toast({
                title: "Missing supplier",
                description: "Please select a supplier",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return false;
        }

        if (items.length === 0) {
            toast({
                title: "No items",
                description: "Please add at least one item to the order",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return false;
        }

        for (const item of items) {
            if (!item.inventory_product_id || item.ordered_quantity <= 0 || item.unit_price < 0) {
                toast({
                    title: "Invalid item",
                    description: "Please check all item fields are valid",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
                return false;
            }
        }

        return true;
    };

    const handleSave = async (status = 'draft') => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const orderData = {
                po_number: poNumber,
                supplier_id: supplierId,
                site_id: siteId,
                order_date: orderDate,
                expected_delivery_date: expectedDeliveryDate || null,
                total_amount: calculateTotal(),
                notes: notes,
                status: status,
                items: items
            };

            if (order) {
                // Update existing order
                await updatePurchaseOrder(order.id, orderData);
                toast({
                    title: "Order updated",
                    description: `Purchase order ${poNumber} has been updated`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                // Create new order
                await createPurchaseOrder(orderData);
                toast({
                    title: "Order created",
                    description: `Purchase order ${poNumber} has been created`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            }

            onSave();
            onClose();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save purchase order",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitForApproval = () => {
        handleSave('pending-approval');
    };

    const getProductName = (productId: string) => {
        const product = inventoryProducts.find(p => p.id === productId);
        return product ? `${product.name} (${product.sku})` : "Select product";
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Heading size="md">
                        {order ? "Edit Purchase Order" : "Create Purchase Order"}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                        {poNumber}
                    </Text>
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={6} align="stretch">
                        {/* Header Information */}
                        <HStack spacing={4} align="flex-start">
                            <FormControl isRequired>
                                <FormLabel>Supplier</FormLabel>
                                <Select
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    placeholder="Select supplier"
                                >
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Order Date</FormLabel>
                                <Input
                                    type="date"
                                    value={orderDate}
                                    onChange={(e) => setOrderDate(e.target.value)}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Expected Delivery</FormLabel>
                                <Input
                                    type="date"
                                    value={expectedDeliveryDate}
                                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                                    min={orderDate}
                                />
                            </FormControl>
                        </HStack>

                        <FormControl>
                            <FormLabel>Notes</FormLabel>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes or special instructions..."
                                rows={2}
                            />
                        </FormControl>

                        {/* Order Items */}
                        <Box>
                            <HStack justify="space-between" mb={4}>
                                <Heading size="sm">Order Items</Heading>
                                <Button
                                    leftIcon={<FaPlus />}
                                    colorScheme="blue"
                                    size="sm"
                                    onClick={addItem}
                                >
                                    Add Item
                                </Button>
                            </HStack>

                            {items.length === 0 ? (
                                <Text color="gray.500" textAlign="center" py={4}>
                                    No items added to this order
                                </Text>
                            ) : (
                                <Box overflowX="auto">
                                    <Table variant="simple" size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th>Product</Th>
                                                <Th>Quantity</Th>
                                                <Th>Unit Price</Th>
                                                <Th>Total</Th>
                                                <Th width="50px"></Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {items.map((item, index) => (
                                                <Tr key={index}>
                                                    <Td>
                                                        <Select
                                                            value={item.inventory_product_id}
                                                            onChange={(e) => updateItem(index, 'inventory_product_id', e.target.value)}
                                                            placeholder="Select product"
                                                        >
                                                            {inventoryProducts.map(product => (
                                                                <option key={product.id} value={product.id}>
                                                                    {product.name} ({product.sku}) - R{product.unit_cost.toFixed(2)}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </Td>
                                                    <Td width="150px">
                                                        <NumberInput
                                                            value={item.ordered_quantity}
                                                            onChange={(value) => updateItem(index, 'ordered_quantity', parseInt(value) || 0)}
                                                            min={1}
                                                        >
                                                            <NumberInputField />
                                                            <NumberInputStepper>
                                                                <NumberIncrementStepper />
                                                                <NumberDecrementStepper />
                                                            </NumberInputStepper>
                                                        </NumberInput>
                                                    </Td>
                                                    <Td width="150px">
                                                        <NumberInput
                                                            value={item.unit_price}
                                                            onChange={(value) => updateItem(index, 'unit_price', parseFloat(value) || 0)}
                                                            min={0}
                                                            precision={2}
                                                        >
                                                            <NumberInputField />
                                                            <NumberInputStepper>
                                                                <NumberIncrementStepper />
                                                                <NumberDecrementStepper />
                                                            </NumberInputStepper>
                                                        </NumberInput>
                                                    </Td>
                                                    <Td width="120px">
                                                        <Text fontWeight="bold">
                                                            R{(item.ordered_quantity * item.unit_price).toFixed(2)}
                                                        </Text>
                                                    </Td>
                                                    <Td>
                                                        <IconButton
                                                            icon={<FaTrash />}
                                                            aria-label="Remove item"
                                                            size="sm"
                                                            colorScheme="red"
                                                            variant="ghost"
                                                            onClick={() => removeItem(index)}
                                                        />
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}
                        </Box>

                        {/* Order Summary */}
                        <Box borderTop="2px solid" borderColor="gray.200" pt={4}>
                            <HStack justify="flex-end">
                                <Text fontSize="lg" fontWeight="bold">
                                    Order Total: R{calculateTotal().toFixed(2)}
                                </Text>
                            </HStack>
                        </Box>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <HStack spacing={3}>
                        <Button variant="ghost" onClick={onClose} isDisabled={isSubmitting}>
                            Cancel
                        </Button>

                        <Button
                            leftIcon={<FaSave />}
                            colorScheme="blue"
                            onClick={() => handleSave('draft')}
                            isLoading={isSubmitting}
                            loadingText="Saving"
                        >
                            Save Draft
                        </Button>

                        <Button
                            leftIcon={<FaPaperPlane />}
                            colorScheme="green"
                            onClick={handleSubmitForApproval}
                            isLoading={isSubmitting}
                            loadingText="Submitting"
                        >
                            Submit for Approval
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}