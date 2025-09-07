"use client";

import React from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Button,
    VStack,
    Text,
    useToast,
    Alert,
    AlertIcon,
} from "@chakra-ui/react";
import { Table } from "@/lib/config/entities";

interface TableActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    table: Table | null;
    onMarkTableFree: (tableId: string) => Promise<void>;
    onViewOrder: (orderId: string) => void;
}

const TableActionModal: React.FC<TableActionModalProps> = ({
    isOpen,
    onClose,
    table,
    onMarkTableFree,
    onViewOrder,
}) => {
    const toast = useToast();

    const handleFreeTable = async () => {
        if (!table) return;

        try {
            await onMarkTableFree(table.id);
            toast({
                title: "Table Freed",
                description: `Table ${table.name} has been marked as free.`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to free the table.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    if (!table) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Table {table.name} - Actions</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text fontWeight="bold">Status: {table.status}</Text>
                        <Text>Capacity: {table.capacity} seats</Text>

                        {table.status === "occupied" && table.current_order_id && (
                            <>
                                <Alert status="info">
                                    <AlertIcon />
                                    This table is currently occupied with order #{table.current_order_id}
                                </Alert>
                                <Button
                                    colorScheme="blue"
                                    onClick={() => {
                                        onViewOrder(table.current_order_id!);
                                        onClose();
                                    }}
                                >
                                    View Order
                                </Button>
                            </>
                        )}

                        {table.status === "occupied" && (
                            <Button
                                colorScheme="green"
                                onClick={handleFreeTable}
                            >
                                Mark Table as Free
                            </Button>
                        )}

                        {table.status === "free" && (
                            <Alert status="success">
                                <AlertIcon />
                                This table is currently available
                            </Alert>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default TableActionModal;