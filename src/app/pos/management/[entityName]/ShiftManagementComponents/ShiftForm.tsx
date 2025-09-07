// Create a new component ShiftForm.tsx
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
    Select,
    VStack,
} from '@chakra-ui/react';
import { Employee } from './ShiftManagement';

interface ShiftFormProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    onSubmit: (shiftData: { employeeId: string; start: string; end: string }) => void;
}

const ShiftForm: React.FC<ShiftFormProps> = ({ isOpen, onClose, employees, onSubmit }) => {
    const [employeeId, setEmployeeId] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');

    const handleSubmit = () => {
        onSubmit({ employeeId, start, end });
        onClose();
        // Reset form
        setEmployeeId('');
        setStart('');
        setEnd('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add New Shift</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Employee</FormLabel>
                            <Select
                                placeholder="Select employee"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                            >
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} - {emp.role}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Start Time</FormLabel>
                            <Input
                                type="datetime-local"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>End Time</FormLabel>
                            <Input
                                type="datetime-local"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={handleSubmit}>
                        Save Shift
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ShiftForm;