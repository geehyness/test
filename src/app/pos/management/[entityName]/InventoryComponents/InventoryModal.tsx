// src/app/pos/management/[entityName]/InventoryComponents/InventoryModal.tsx
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
    NumberInput,
    NumberInputField,
    Select,
    VStack,
    useToast,
} from "@chakra-ui/react";
import { InventoryProduct } from "@/lib/config/entities";
import { fetchData } from "@/lib/api";

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: InventoryProduct | null;
}

export default function InventoryModal({ isOpen, onClose, product }: InventoryModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [sku, setSku] = useState("");
    const [unitCost, setUnitCost] = useState(0);
    const [quantity, setQuantity] = useState(0);
    const [reorderLevel, setReorderLevel] = useState(0);
    const [unitOfMeasure, setUnitOfMeasure] = useState("");
    const [category, setCategory] = useState("");
    const [supplier, setSupplier] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (product) {
            setName(product.name);
            setDescription(product.description || "");
            setSku(product.sku);
            setUnitCost(product.unit_cost);
            setQuantity(product.quantity_in_stock);
            setReorderLevel(product.reorder_level);
            setUnitOfMeasure(product.unit_of_measure);
            setCategory(product.inv_category_id || "");
            setSupplier(product.supplier_id || "");
        } else {
            // Reset form for new product
            setName("");
            setDescription("");
            setSku("");
            setUnitCost(0);
            setQuantity(0);
            setReorderLevel(0);
            setUnitOfMeasure("");
            setCategory("");
            setSupplier("");
        }
    }, [product]);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const productData = {
                name,
                description,
                sku,
                unit_cost: unitCost,
                quantity_in_stock: quantity,
                reorder_level: reorderLevel,
                unit_of_measure: unitOfMeasure,
                inv_category_id: category || null,
                supplier_id: supplier || null,
            };

            if (product) {
                // Update existing product
                await fetchData("inventory_products", product.id, productData, "PUT");
                toast({
                    title: "Product Updated",
                    description: `${name} has been updated successfully.`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                // Create new product
                await fetchData("inventory_products", undefined, productData, "POST");
                toast({
                    title: "Product Added",
                    description: `${name} has been added to inventory.`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            }

            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to ${product ? "update" : "add"} product.`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{product ? "Edit Product" : "Add New Product"}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Product Name</FormLabel>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter product name"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter product description"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>SKU</FormLabel>
                            <Input
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                placeholder="Enter SKU"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Unit Cost (R)</FormLabel>
                            <NumberInput
                                value={unitCost}
                                onChange={(_, value) => setUnitCost(value)}
                                precision={2}
                            >
                                <NumberInputField placeholder="0.00" />
                            </NumberInput>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Quantity in Stock</FormLabel>
                            <NumberInput
                                value={quantity}
                                onChange={(_, value) => setQuantity(value)}
                                min={0}
                            >
                                <NumberInputField placeholder="0" />
                            </NumberInput>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Reorder Level</FormLabel>
                            <NumberInput
                                value={reorderLevel}
                                onChange={(_, value) => setReorderLevel(value)}
                                min={0}
                            >
                                <NumberInputField placeholder="0" />
                            </NumberInput>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Unit of Measure</FormLabel>
                            <Select
                                value={unitOfMeasure}
                                onChange={(e) => setUnitOfMeasure(e.target.value)}
                                placeholder="Select unit"
                            >
                                <option value="unit">Unit</option>
                                <option value="kg">Kilogram</option>
                                <option value="g">Gram</option>
                                <option value="l">Liter</option>
                                <option value="ml">Milliliter</option>
                                <option value="pack">Pack</option>
                                <option value="box">Box</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Category</FormLabel>
                            <Input
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Enter category"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Supplier</FormLabel>
                            <Input
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                                placeholder="Enter supplier"
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                    >
                        {product ? "Update" : "Add"} Product
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}