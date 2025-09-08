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
    Checkbox,
    Box,
    Text
} from '@chakra-ui/react';
import { Employee as EmployeeDetails, Shift as ShiftDetails } from '../ShiftManagement';
import moment from 'moment';
import { logger } from '@/lib/logger';

interface ShiftUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateShift: (shiftId: string, updates: Partial<ShiftDetails>) => Promise<void>;
    onDeleteShift: (shiftId: string) => Promise<{ success: boolean; error?: string }>;
    selectedShift: ShiftDetails | null;
    employee: EmployeeDetails | null;
}

const ShiftUpdateModal: React.FC<ShiftUpdateModalProps> = ({ isOpen, onClose, onUpdateShift, onDeleteShift, selectedShift, employee }) => {
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [recurs, setRecurs] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    // Use useEffect to update state when a new shift is selected
    useEffect(() => {
        if (selectedShift) {
            // Split the datetime into date and time components
            const startMoment = moment(selectedShift.start);
            setStartDate(startMoment.format('YYYY-MM-DD'));
            setStartTime(startMoment.format('HH:mm'));

            const endMoment = moment(selectedShift.end);
            setEndTime(endMoment.format('HH:mm'));

            setRecurs(selectedShift.recurs || false);
        }
    }, [selectedShift]);

    const handleUpdate = async () => {
        if (!selectedShift) return;

        // Combine date and time
        const newStartTime = moment(`${startDate}T${startTime}`);
        const newEndTime = moment(`${startDate}T${endTime}`);

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

            toast({
                title: 'Shift Updated',
                description: `Successfully updated the shift for ${employee?.name}.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onClose();
        } catch (error) {
            logger.error("ShiftUpdateModal", "Update failed:", error);
            toast({
                title: 'Error Updating Shift',
                description: 'Failed to update shift.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedShift) return;
        setIsSaving(true);
        try {
            const result = await onDeleteShift(selectedShift.id);
            if (result.success) {
                toast({
                    title: "Shift deleted.",
                    description: "Shift has been set as inactive.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
                onClose();
            } else {
                throw new Error(result.error);
            }
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
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Edit Shift for {employee?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl>
                            <FormLabel>Shift Date</FormLabel>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </FormControl>

                        <HStack>
                            <FormControl>
                                <FormLabel>Start Time</FormLabel>
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>End Time</FormLabel>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </FormControl>
                        </HStack>

                        <FormControl>
                            <Checkbox isChecked={recurs} onChange={(e) => setRecurs(e.target.checked)}>
                                Recur weekly
                            </Checkbox>
                        </FormControl>

                        {selectedShift && (
                            <Box mt={4} p={3} bg="gray.50" borderRadius="md">
                                <Text fontWeight="bold" mb={2}>Current Shift Details:</Text>
                                <Text fontSize="sm">
                                    {moment(selectedShift.start).format('MMM Do, YYYY')} - {moment(selectedShift.start).format('HH:mm')} to {moment(selectedShift.end).format('HH:mm')}
                                    {selectedShift.recurs && <Text as="span" ml={2} color="green.500">(Recurring)</Text>}
                                </Text>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="red"
                        onClick={handleDelete}
                        isLoading={isSaving}
                        mr={3}
                    >
                        Delete Shift
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleUpdate}
                        isLoading={isSaving}
                    >
                        Save Changes
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ShiftUpdateModal;