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
import { logger } from "@/lib/logger";

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    existingShifts: Shift[];
    onAddShift: (newShift: { employeeId: string; start: Date; end: Date; recurs: boolean }) => Promise<any>;
}

interface ShiftDay {
    date: Date;
    startTime: string;
    endTime: string;
    recurs: boolean;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, employee, existingShifts, onAddShift }) => {
    const [shiftDays, setShiftDays] = useState<ShiftDay[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [isSaving, setIsSaving] = useState(false);
    const [recurs, setRecurs] = useState(false);
    const toast = useToast();

    const getNextWeekDays = () => {
        const days = [];
        const today = moment().startOf('day');
        for (let i = 0; i < 7; i++) {
            const date = today.clone().add(i, 'days').toDate();
            days.push(date);
        }
        return days;
    };

    const getAvailableDays = () => {
        if (!employee) return [];

        const scheduledDates = existingShifts.map(shift =>
            moment(shift.start).format('YYYY-MM-DD')
        );

        return getNextWeekDays().filter(day =>
            !scheduledDates.includes(moment(day).format('YYYY-MM-DD'))
        );
    };

    const addShiftDay = () => {
        if (!selectedDate) {
            toast({
                title: 'Please select a date',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (startTime >= endTime) {
            toast({
                title: 'End time must be after start time',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const newShiftDay: ShiftDay = {
            date: new Date(selectedDate),
            startTime,
            endTime,
            recurs,
        };

        setShiftDays(prev => [...prev, newShiftDay]);
        setSelectedDate('');
        setStartTime('09:00');
        setEndTime('17:00');
        setRecurs(false);
    };

    const removeShiftDay = (index: number) => {
        setShiftDays(prev => prev.filter((_, i) => i !== index));
    };

    const saveAllShifts = async () => {
        if (!employee || shiftDays.length === 0) return;

        setIsSaving(true);
        try {
            // Corrected logic: Iterate and add each single shift record.
            const shiftPromises = shiftDays.map(async (shiftDay) => {
                const start = moment(shiftDay.date).set({
                    hour: parseInt(shiftDay.startTime.split(':')[0]),
                    minute: parseInt(shiftDay.startTime.split(':')[1])
                }).toDate();
                const end = moment(shiftDay.date).set({
                    hour: parseInt(shiftDay.endTime.split(':')[0]),
                    minute: parseInt(shiftDay.endTime.split(':')[1])
                }).toDate();

                // Call onAddShift once per record, with the recurs flag
                return onAddShift({
                    employeeId: employee.id,
                    start,
                    end,
                    recurs: shiftDay.recurs,
                });
            });

            await Promise.all(shiftPromises);

            setShiftDays([]);
            onClose();

            toast({
                title: 'Shifts Added',
                description: `Successfully added the selected shifts for ${employee.name}.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            logger.error("ShiftModal: Failed to add shifts:", error);
            toast({
                title: 'Error Adding Shifts',
                description: 'Failed to add one or more shifts.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const availableDays = getAvailableDays();

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add Shifts for {employee?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl>
                            <FormLabel>Available Days</FormLabel>
                            <Select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                placeholder="Select a day"
                            >
                                {availableDays.map(day => (
                                    <option key={day.toISOString()} value={day.toISOString()}>
                                        {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </option>
                                ))}
                            </Select>
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
                                Recur weekly for 1 year
                            </Checkbox>
                        </FormControl>

                        <Button onClick={addShiftDay} colorScheme="blue">
                            Add This Shift
                        </Button>

                        {shiftDays.length > 0 && (
                            <Box mt={4}>
                                <Text fontWeight="bold" mb={2}>Shifts to Add:</Text>
                                <VStack spacing={2} align="stretch">
                                    {shiftDays.map((shiftDay, index) => (
                                        <HStack key={index} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                                            <Text fontSize="sm">
                                                {shiftDay.date.toLocaleDateString()} - {shiftDay.startTime} to {shiftDay.endTime}
                                                {shiftDay.recurs && <Text as="span" ml={2} color="green.500">(Recurring)</Text>}
                                            </Text>
                                            <IconButton
                                                icon={<DeleteIcon />}
                                                aria-label={`Remove shift on ${shiftDay.date.toLocaleDateString()}`}
                                                size="sm"
                                                onClick={() => removeShiftDay(index)}
                                                variant="ghost"
                                            />
                                        </HStack>
                                    ))}
                                </VStack>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={saveAllShifts}
                        isDisabled={shiftDays.length === 0 || isSaving}
                        isLoading={isSaving}
                    >
                        Save All Shifts ({shiftDays.length})
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ShiftModal;