// src/app/pos/management/[entityName]/ShiftManagementComponents/ShiftModal.tsx
"use client";

import React, { useState } from 'react';
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
    Text,
    useToast,
    Box,
    IconButton,
    Checkbox
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { Employee, Shift } from '../ShiftManagement';
import moment from 'moment';

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    onAddShift: (newShift: { employeeId: string; start: Date; end: Date; recurs: boolean }) => void;
    isLoading: boolean;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, employee, onAddShift, isLoading }) => {
    const [startDate, setStartDate] = useState(moment().format('YYYY-MM-DD'));
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [recurs, setRecurs] = useState(false);
    const toast = useToast();

    const handleAdd = () => {
        if (!employee) return;

        const startDateTime = moment(`${startDate}T${startTime}`);
        const endDateTime = moment(`${startDate}T${endTime}`);

        if (!startDateTime.isValid() || !endDateTime.isValid() || endDateTime.isSameOrBefore(startDateTime)) {
            toast({
                title: "Invalid shift times.",
                description: "End time must be after start time.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        onAddShift({
            employeeId: employee.id,
            start: startDateTime.toDate(),
            end: endDateTime.toDate(),
            recurs: recurs,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add Shift for {employee?.name}</ModalHeader>
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
                                This shift recurs weekly
                            </Checkbox>
                        </FormControl>

                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleAdd}
                        isLoading={isLoading}
                    >
                        Add to Draft
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ShiftModal;
