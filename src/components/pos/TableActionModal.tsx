"use client";

import React, { useState } from "react";
import {
    // FIX: Import Modal and its parts
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
    // FIX: Import Alert and its parts
    Alert,
    AlertIcon,
} from "@chakra-ui/react";
import { Table } from "@/lib/config/entities";
import QRCodeModal from "./QRCodeModal"; // Import the new component
import { usePOSStore } from "@/lib/usePOSStore";

interface TableActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    table: Table | null;
    onMarkTableFree: (tableId: string) => Promise<void>;
    onViewOrder: (orderId: string) => void;
}

export default function TableActionModal({
    isOpen,
    onClose,
    table,
    onMarkTableFree,
    onViewOrder,
}: TableActionModalProps) {
    const { currentStaff } = usePOSStore();
    const tenantDomain = currentStaff?.tenant_id;
    const shopId = currentStaff?.storeId;

    const [isQrModalOpen, setQrModalOpen] = useState(false);

    if (!table) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Actions for {table.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            {table.status === 'occupied' && table.current_order_id ? (
                                <>
                                    <Button colorScheme="blue" onClick={() => onViewOrder(table.current_order_id!)} width="full">
                                        View/Edit Order #{table.current_order_id}
                                    </Button>
                                    <Button colorScheme="orange" onClick={() => onMarkTableFree(table.id)} width="full">
                                        Mark as Free (Clear Order)
                                    </Button>
                                </>
                            ) : (
                                <Alert status="success">
                                    <AlertIcon />
                                    This table is currently available.
                                </Alert>
                            )}
                            <Button onClick={() => setQrModalOpen(true)} width="full" variant="outline">
                                Generate QR Code
                            </Button>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <QRCodeModal
                isOpen={isQrModalOpen}
                onClose={() => setQrModalOpen(false)}
                table={{id: table.id, name: table.name}}
                shopId={shopId}
                tenantDomain={tenantDomain}
            />
        </>
    );
}