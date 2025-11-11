// src/app/pos/management/[entityName]/ShiftManagementComponents/ShiftUpdateModal.tsx - CORRECTED
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
import { Employee, Shift } from '../ShiftManagement';
import moment from 'moment';
import { logger } from '@/lib/logger';

interface ShiftUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateShift: (shiftId: string, updates: Partial<Shift>) => Promise<{ success: boolean; error?: string }>;
    onDeleteShift: (shiftId: string) => Promise<{ success: boolean; error?: string }>;
    selectedShift: Shift | null;
    employee: Employee | null;
    isLoading: boolean;
}

const ShiftUpdateModal: React.FC<ShiftUpdateModalProps> = ({ isOpen, onClose, onUpdateShift, onDeleteShift, selectedShift, employee, isLoading }) => {
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [recurring, setRecurring] = useState(false); // FIX: Changed 'recurs' to 'recurring'
    const toast = useToast();

    useEffect(() => {
        if (selectedShift) {
            const startMoment = moment(selectedShift.start);
            setStartDate(startMoment.format('YYYY-MM-DD'));
            setStartTime(startMoment.format('HH:mm'));

            const endMoment = moment(selectedShift.end);
            setEndTime(endMoment.format('HH:mm'));

            // FIX: Changed to use 'recurring' property
            setRecurring(selectedShift.recurring || false);
        }
    }, [selectedShift]);

    const handleUpdate = async () => {
        if (!selectedShift) return;

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

        await onUpdateShift(selectedShift.id, {
            start: newStartTime.toDate(),
            end: newEndTime.toDate(),
            // FIX: Changed to use 'recurring' property
            recurring: recurring,
        });
    };

    const handleDelete = async () => {
        if (!selectedShift) return;
        await onDeleteShift(selectedShift.id);
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
                            <Checkbox isChecked={recurring} onChange={(e) => setRecurring(e.target.checked)}>
                                This shift recurs weekly
                            </Checkbox>
                        </FormControl>

                        {selectedShift && (
                            <Box mt={4} p={3} bg="gray.50" borderRadius="md">
                                <Text fontWeight="bold" mb={2}>Current Shift Details:</Text>
                                <Text fontSize="sm">
                                    {moment(selectedShift.start).format('MMM Do, YYYY')} - {moment(selectedShift.start).format('HH:mm')} to {moment(selectedShift.end).format('HH:mm')}
                                    {/* FIX: Changed to use 'recurring' property */}
                                    {selectedShift.recurring && <Text as="span" ml={2} color="green.500">(Recurring)</Text>}
                                </Text>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="red"
                        onClick={handleDelete}
                        isLoading={isLoading}
                        mr={3}
                    >
                        Delete Shift
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleUpdate}
                        isLoading={isLoading}
                    >
                        Save Changes
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ShiftUpdateModal;