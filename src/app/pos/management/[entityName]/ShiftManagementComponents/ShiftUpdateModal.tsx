// src/app/pos/management/[entityName]/components/ShiftUpdateModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
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
    VStack,
    HStack,
    useToast,
    Checkbox
} from '@chakra-ui/react';
import { Employee as EmployeeDetails, Shift as ShiftDetails } from '../../ShiftManagement';
import moment from 'moment';
import { logger } from '@/lib/logger';

interface ShiftUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateShift: (shiftId: string, updates: Partial<ShiftDetails>) => Promise<void>;
    onDeleteShift: (shiftId: string) => Promise<void>;
    selectedShift: ShiftDetails | null;
    employee: EmployeeDetails | null;
}

const ShiftUpdateModal: React.FC<ShiftUpdateModalProps> = ({ isOpen, onClose, onUpdateShift, onDeleteShift, selectedShift, employee }) => {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [recurs, setRecurs] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    // Use useEffect to update state when a new shift is selected
    useEffect(() => {
        if (selectedShift) {
            // Use toISOString() on the Date objects for the datetime-local input
            setStartTime(selectedShift.start.toISOString().substring(0, 16));
            setEndTime(selectedShift.end.toISOString().substring(0, 16));
            setRecurs(selectedShift.recurs || false);
        }
    }, [selectedShift]);

    const handleUpdate = async () => {
        if (!selectedShift) return;

        const newStartTime = moment(startTime);
        const newEndTime = moment(endTime);

        if (!newStartTime.isValid() || !newEndTime.isValid() || newEndTime.isSameOrBefore(newStartTime)) {
            toast({
                title: "Invalid shift times.",
                description: "End time must be after start time.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsSaving(true);
        try {
            await onUpdateShift(selectedShift.id, {
                start: newStartTime.toDate(),
                end: newEndTime.toDate(),
                recurs,
                recurringDay: recurs ? newStartTime.day() : undefined,
            });
            onClose();
        } catch (error) {
            logger.error("ShiftUpdateModal", "Update failed:", error);
            // The toast is handled by the parent component, but it's good to have a catch block.
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedShift) return;
        setIsSaving(true);
        try {
            await onDeleteShift(selectedShift.id);
            onClose();
        } catch (error) {
            logger.error("ShiftUpdateModal", "Delete failed:", error);
            toast({
                title: 'Error Deleting Shift',
                description: 'Failed to delete shift.',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Edit Shift for {employee?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel>Shift Date & Start Time</FormLabel>
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Shift Date & End Time</FormLabel>
                            <Input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </FormControl>
                        <FormControl>
                            <Checkbox isChecked={recurs} onChange={(e) => setRecurs(e.target.checked)}>
                                Recur weekly
                            </Checkbox>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <HStack>
                        <Button colorScheme="red" onClick={handleDelete} isLoading={isSaving} mr={3}>
                            Delete Shift
                        </Button>
                        <Button variant="ghost" onClick={onClose} mr={3}>
                            Cancel
                        </Button>
                        <Button colorScheme="blue" onClick={handleUpdate} isLoading={isSaving}>
                            Save Changes
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ShiftUpdateModal;