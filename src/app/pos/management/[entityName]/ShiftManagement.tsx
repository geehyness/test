"use client";

import React, { useState, useEffect } from 'react';
import { Box, Center, Flex, Heading, Spinner, useToast, useDisclosure, Text } from '@chakra-ui/react';
import ShiftCalendar from './ShiftManagementComponents/ShiftCalendar';
import EmployeeList from './ShiftManagementComponents/EmployeeList';
import ShiftModal from './ShiftManagementComponents/ShiftModal';
import ShiftUpdateModal from './ShiftManagementComponents/ShiftUpdateModal';
import { getShifts, getEmployees, createShift, updateShift } from "@/lib/api";
import { usePOSStore } from '@/lib/usePOSStore';
import moment from 'moment';
import { Employee as EmployeeDetails, Shift as ShiftDetails } from "@/lib/config/entities";
import { logger } from "@/lib/logger";

export interface Employee extends EmployeeDetails {
    name?: string;
    role?: string;
}

export interface Shift extends ShiftDetails {
    start: Date;
    end: Date;
}

export default function ShiftsPage() {
    const {
        shifts,
        setShifts,
        addShift,
        updateShift: updateStoreShift,
        deleteShift: deleteStoreShift,
        employees: storeEmployees,
        setEmployees
    } = usePOSStore();

    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        logger.info("ShiftManagement: useEffect triggered. Starting data load.");
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [fetchedShifts, fetchedEmployees] = await Promise.all([
                    getShifts(),
                    getEmployees(),
                ]);

                logger.info("ShiftManagement: Raw data from API received.");
                logger.info("   - Fetched Shifts: ", fetchedShifts);
                logger.info("   - Fetched Employees: ", fetchedEmployees);

                const mappedEmployees: Employee[] = fetchedEmployees.map(emp => ({
                    ...emp,
                    name: `${emp.first_name} ${emp.last_name}`,
                    role: emp.job_title_id,
                }));

                logger.info("ShiftManagement: Processed and mapped employees.", mappedEmployees);

                const shiftsWithNamesAndDates: Shift[] = fetchedShifts
                    .map((shift) => {
                        try {
                            const employee = mappedEmployees.find(e => e.id === shift.employee_id);

                            return {
                                ...shift,
                                start: moment(shift.start).toDate(),
                                end: moment(shift.end).toDate(),
                                employee_name: employee ? employee.name : 'Unknown',
                                color: employee?.color || '#3182CE',
                            };
                        } catch (error) {
                            logger.error("ShiftManagement: Invalid date found for a shift, skipping.", shift);
                            return null;
                        }
                    }).filter(Boolean) as Shift[];

                logger.info("ShiftManagement: Processed shifts with employee names.", shiftsWithNamesAndDates);

                setShifts(shiftsWithNamesAndDates);
                setEmployees(mappedEmployees);
                logger.info("ShiftManagement: Data successfully set in Zustand store.");

            } catch (error) {
                toast({
                    title: "Failed to load data.",
                    description: "Could not fetch shifts or employees. Please try again.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [setShifts, setEmployees, toast]);

    const handleAddShift = async (newShiftData: { employeeId: string; start: Date; end: Date; recurs: boolean }) => {
        if (!selectedEmployee) return;

        const { employeeId, start, end, recurs } = newShiftData;
        const recurringDay = recurs ? moment(start).day() : undefined;

        try {
            const createdShift = await createShift({
                employee_id: employeeId,
                start: start.toISOString(),
                end: end.toISOString(),
                recurs,
                recurringDay,
                active: true,
            });

            const shiftToAdd = {
                ...createdShift,
                start: moment(createdShift.start).toDate(),
                end: moment(createdShift.end).toDate(),
                employee_name: selectedEmployee.name,
                color: selectedEmployee.color,
                recurs: createdShift.recurs,
                recurringDay: createdShift.recurringDay,
                active: createdShift.active,
            };

            addShift(shiftToAdd);
            toast({
                title: 'Shift added successfully.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            onClose();
        } catch (error) {
            toast({
                title: 'Failed to add shift.',
                description: 'An error occurred while saving the shift.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleUpdateShift = async (shiftId: string, updates: Partial<Shift>) => {
        try {
            const originalShift = shifts.find(s => s.id === shiftId);
            if (!originalShift) {
                logger.error("Shift not found for update:", shiftId);
                toast({
                    title: "Error Updating Shift",
                    description: "Original shift not found.",
                    status: "error",
                    duration: 4000,
                    isClosable: true,
                });
                return;
            }

            const apiPayload = {
                ...originalShift,
                ...updates,
                start: updates.start?.toISOString() ?? originalShift.start.toISOString(),
                end: updates.end?.toISOString() ?? originalShift.end.toISOString(),
            };

            const updatedShift = await updateShift(shiftId, apiPayload);

            const shiftToUpdate = {
                ...updatedShift,
                start: moment(updatedShift.start).toDate(),
                end: moment(updatedShift.end).toDate(),
            };

            updateStoreShift(shiftId, shiftToUpdate);
            toast({
                title: 'Shift updated successfully.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            onClose();
        } catch (error) {
            toast({
                title: 'Failed to update shift.',
                description: 'An error occurred while updating the shift.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleDeleteShift = (shiftId: string) => {
        deleteStoreShift(shiftId);
        onClose();
    };

    const handleSelectEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setSelectedShift(null);
        onOpen();
    };

    const handleEditShift = (shift: Shift) => {
        setSelectedShift(shift);
        const employee = storeEmployees.find(emp => emp.id === shift.employee_id);
        setSelectedEmployee(employee || null);
        onOpen();
    };

    const handleModalClose = () => {
        setSelectedEmployee(null);
        setSelectedShift(null);
        onClose();
    };

    return (
        <Box bg="gray.50" minH="100vh">
            <Flex
                as="header"
                position="sticky"
                top="0"
                zIndex="10"
                bg="white"
                p={5}
                borderBottom="1px"
                borderColor="gray.200"
                justifyContent="space-between"
                alignItems="center"
            >
                <Heading as="h1" size="xl">Shift Management</Heading>
            </Flex>
            <Box p={5}>
                <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
                    <Box flex="1" bg="white" p={6} rounded="md" shadow="sm">
                        <EmployeeList employees={storeEmployees || []} onEmployeeClick={handleSelectEmployee} />
                    </Box>
                    <Box flex="3" bg="white" p={6} rounded="md" shadow="sm">
                        <Heading as="h2" size="lg" mb={4}>Shift Calendar</Heading>
                        {isLoading ? (
                            <Center h="300px">
                                <Spinner size="xl" />
                            </Center>
                        ) : (
                            <ShiftCalendar
                                shifts={shifts.filter(s => s.active)}
                                employees={storeEmployees || []}
                                onUpdateShift={handleUpdateShift}
                                onDeleteShift={handleDeleteShift}
                                onSelectShift={handleEditShift}
                            />
                        )}
                    </Box>
                </Flex>
            </Box>
            {selectedShift ? (
                <ShiftUpdateModal
                    isOpen={isOpen}
                    onClose={handleModalClose}
                    selectedShift={selectedShift}
                    employee={selectedEmployee}
                    onUpdateShift={handleUpdateShift}
                    onDeleteShift={handleDeleteShift}
                />
            ) : (
                <ShiftModal
                    isOpen={isOpen}
                    onClose={handleModalClose}
                    employee={selectedEmployee}
                    existingShifts={shifts.filter(s => s.employee_id === selectedEmployee?.id && s.active)}
                    onAddShift={handleAddShift}
                />
            )}
        </Box>
    );
}