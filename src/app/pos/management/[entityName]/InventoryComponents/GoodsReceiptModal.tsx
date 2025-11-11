

// src/app/pos/management/[entityName]/PurchaseOrderComponents/GoodsReceiptModal.tsx
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
    Box,
    Heading,
    Badge,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    // FIX: Imported Select from chakra-ui
    Select,
} from "@chakra-ui/react";
import { FaCheck, FaBox } from "react-icons/fa";
import { createGoodsReceipt, getInventoryProducts } from "@/lib/api";

interface GoodsReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onSave: () => void;
}

interface ReceivedItem {
    purchase_order_item_id: string;
    inventory_product_id: string;
    ordered_quantity: number;
    received_quantity: number;
    batch_number: string;
    expiry_date: string;
    condition: 'good' | 'damaged' | 'expired';
    product_name?: string;
    product_sku?: string;
}

export default function GoodsReceiptModal({
    isOpen, onClose, order, onSave
}: GoodsReceiptModalProps) {
    const [receiptDate, setReceiptDate] = useState("");
    const [receivedBy, setReceivedBy] = useState("");
    const [notes, setNotes] = useState("");
    const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (isOpen && order) {
            setReceiptDate(new Date().toISOString().split('T')[0]);
            setReceivedBy("");
            setNotes("");

            // Initialize received items from order items
            if (order.items && order.items.length > 0) {
                setReceivedItems(order.items.map((item: any) => ({
                    purchase_order_item_id: item.id || "",
                    inventory_product_id: item.inventory_product_id,
                    ordered_quantity: item.ordered_quantity,
                    received_quantity: item.ordered_quantity, // Default to full quantity
                    batch_number: "",
                    expiry_date: "",
                    condition: 'good',
                    product_name: item.product_name,
                    product_sku: item.product_sku
                })));
            }
        }
    }, [isOpen, order]);

    const updateReceivedItem = (index: number, field: keyof ReceivedItem, value: any) => {
        const newItems = [...receivedItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setReceivedItems(newItems);
    };

    const validateForm = () => {
        if (!receivedBy) {
            toast({
                title: "Missing information",
                description: "Please enter the name of the person receiving the goods",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return false;
        }

        for (const item of receivedItems) {
            if (item.received_quantity < 0) {
                toast({
                    title: "Invalid quantity",
                    description: "Received quantity cannot be negative",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
                return false;
            }
        }

        return true;
    };

    const handleReceiveGoods = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const receiptData = {
                receipt_number: `GR-${Date.now()}`,
                purchase_order_id: order.id,
                receipt_date: receiptDate,
                received_by: receivedBy,
                notes: notes,
                received_items: receivedItems
            };

            await createGoodsReceipt(receiptData);

            toast({
                title: "Goods received",
                description: `Goods receipt has been recorded for PO ${order.po_number}`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            onSave();
            onClose();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to record goods receipt",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (received: number, ordered: number) => {
        if (received === 0) return 'gray';
        if (received < ordered) return 'orange';
        if (received === ordered) return 'green';
        return 'purple'; // Over-received
    };

    const getStatusText = (received: number, ordered: number) => {
        if (received === 0) return 'Pending';
        if (received < ordered) return 'Partial';
        if (received === ordered) return 'Complete';
        return 'Over-received';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Heading size="md">Receive Goods</Heading>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                        Purchase Order: {order?.po_number}
                    </Text>
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={6} align="stretch">
                        {/* Receipt Information */}
                        <HStack spacing={4} align="flex-start">
                            <FormControl isRequired>
                                <FormLabel>Receipt Date</FormLabel>
                                <Input
                                    type="date"
                                    value={receiptDate}
                                    onChange={(e) => setReceiptDate(e.target.value)}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Received By</FormLabel>
                                <Input
                                    value={receivedBy}
                                    onChange={(e) => setReceivedBy(e.target.value)}
                                    placeholder="Enter your name"
                                />
                            </FormControl>
                        </HStack>

                        <FormControl>
                            <FormLabel>Notes</FormLabel>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes about this receipt..."
                                rows={2}
                            />
                        </FormControl>

                        {/* Received Items */}
                        <Box>
                            <Heading size="sm" mb={4}>Received Items</Heading>

                            {receivedItems.length === 0 ? (
                                <Text color="gray.500" textAlign="center" py={4}>
                                    No items to receive
                                </Text>
                            ) : (
                                <Box overflowX="auto">
                                    <Table variant="simple" size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th>Product</Th>
                                                <Th>Ordered</Th>
                                                <Th>Received</Th>
                                                <Th>Status</Th>
                                                <Th>Batch Number</Th>
                                                <Th>Expiry Date</Th>
                                                <Th>Condition</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {receivedItems.map((item, index) => (
                                                <Tr key={index}>
                                                    <Td>
                                                        <Text fontWeight="medium">
                                                            {item.product_name || `Product ${item.inventory_product_id}`}
                                                        </Text>
                                                        <Text fontSize="sm" color="gray.600">
                                                            {item.product_sku}
                                                        </Text>
                                                    </Td>

                                                    <Td>{item.ordered_quantity}</Td>

                                                    <Td width="120px">
                                                        <NumberInput
                                                            value={item.received_quantity}
                                                            onChange={(_, value) => updateReceivedItem(index, 'received_quantity', value || 0)}
                                                            min={0}
                                                            max={item.ordered_quantity * 2} // Allow some over-receiving
                                                        >
                                                            <NumberInputField />
                                                            <NumberInputStepper>
                                                                <NumberIncrementStepper />
                                                                <NumberDecrementStepper />
                                                            </NumberInputStepper>
                                                        </NumberInput>
                                                    </Td>

                                                    <Td width="120px">
                                                        <Badge colorScheme={getStatusColor(item.received_quantity, item.ordered_quantity)}>
                                                            {getStatusText(item.received_quantity, item.ordered_quantity)}
                                                        </Badge>
                                                    </Td>

                                                    <Td width="150px">
                                                        <Input
                                                            value={item.batch_number}
                                                            onChange={(e) => updateReceivedItem(index, 'batch_number', e.target.value)}
                                                            placeholder="Batch #"
                                                            size="sm"
                                                        />
                                                    </Td>

                                                    <Td width="150px">
                                                        <Input
                                                            type="date"
                                                            value={item.expiry_date}
                                                            onChange={(e) => updateReceivedItem(index, 'expiry_date', e.target.value)}
                                                            size="sm"
                                                        />
                                                    </Td>

                                                    <Td width="150px">
                                                        <Select
                                                            value={item.condition}
                                                            onChange={(e) => updateReceivedItem(index, 'condition', e.target.value as 'good' | 'damaged' | 'expired')}
                                                            size="sm"
                                                        >
                                                            <option value="good">Good</option>
                                                            <option value="damaged">Damaged</option>
                                                            <option value="expired">Expired</option>
                                                        </Select>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}
                        </Box>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <HStack spacing={3}>
                        <Button variant="ghost" onClick={onClose} isDisabled={isSubmitting}>
                            Cancel
                        </Button>

                        <Button
                            leftIcon={<FaCheck />}
                            colorScheme="green"
                            onClick={handleReceiveGoods}
                            isLoading={isSubmitting}
                            loadingText="Processing"
                        >
                            Receive Goods
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}