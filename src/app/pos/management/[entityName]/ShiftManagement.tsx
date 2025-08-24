// src/app/pos/management/[entityName]/ShiftManagement.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Box, Center, Flex, Heading, Spinner, useToast } from '@chakra-ui/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import EmployeeList from './components/EmployeeList';
import ShiftCalendar from './components/ShiftCalendar';
import { fetchData } from "@/app/lib/api";

export interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    role: 'Cashier' | 'Waiter' | 'Kitchen Staff' | string;
    mainAccessRoleName?: string;
}

export interface Shift {
    id: string;
    title: string;
    start: string;
    end: string;
    employee_id: string;
    employee_name?: string;
}

export default function ShiftsPage() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [fetchedShifts, fetchedEmployees] = await Promise.all([
                    fetchData('shifts'),
                    fetchData('employees')
                ]);

                // Map employees to the expected format
                const mappedEmployees = (fetchedEmployees || []).map((emp: any) => ({
                    id: emp.id,
                    first_name: emp.first_name,
                    last_name: emp.last_name,
                    role: emp.mainAccessRoleName || 'Staff',
                    name: `${emp.first_name} ${emp.last_name}`
                }));

                // Map shifts to include employee names
                const shiftsWithNames = (fetchedShifts || []).map((shift: any) => {
                    const employee = mappedEmployees.find((e: any) => e.id === shift.employee_id);
                    return {
                        ...shift,
                        employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
                        title: employee ? `${employee.first_name} ${employee.last_name} - ${employee.role}` : 'Unassigned Shift'
                    };
                });

                setEmployees(mappedEmployees);
                setShifts(shiftsWithNames);
            } catch (err: any) {
                toast({
                    title: "Error",
                    description: err.message || "Failed to load shift data.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [toast]);

    const handleAddShift = async (newShift: Shift) => {
        try {
            // Save to API
            await fetchData('shifts', undefined, {
                employee_id: newShift.employee_id,
                start: newShift.start,
                end: newShift.end
            }, "POST");

            toast({
                title: 'Shift Added.',
                description: `Assigned ${newShift.title} from ${new Date(newShift.start).toLocaleString()} to ${new Date(newShift.end).toLocaleString()}`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            // Refresh data
            const fetchedShifts = await fetchData('shifts');
            const shiftsWithNames = (fetchedShifts || []).map((shift: any) => {
                const employee = employees.find((e: any) => e.id === shift.employee_id);
                return {
                    ...shift,
                    employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
                    title: employee ? `${employee.first_name} ${employee.last_name} - ${employee.role}` : 'Unassigned Shift'
                };
            });
            setShifts(shiftsWithNames);
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to add shift.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleUpdateShift = async (updatedShift: Shift) => {
        try {
            // Update in API
            await fetchData('shifts', updatedShift.id, {
                employee_id: updatedShift.employee_id,
                start: updatedShift.start,
                end: updatedShift.end
            }, "PUT");

            toast({
                title: 'Shift Updated.',
                description: `Updated shift for ${updatedShift.title}`,
                status: 'info',
                duration: 5000,
                isClosable: true,
            });

            // Refresh data
            const fetchedShifts = await fetchData('shifts');
            const shiftsWithNames = (fetchedShifts || []).map((shift: any) => {
                const employee = employees.find((e: any) => e.id === shift.employee_id);
                return {
                    ...shift,
                    employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
                    title: employee ? `${employee.first_name} ${employee.last_name} - ${employee.role}` : 'Unassigned Shift'
                };
            });
            setShifts(shiftsWithNames);
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to update shift.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    if (isLoading) {
        return (
            <Center minH="400px">
                <Spinner size="xl" />
            </Center>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <Box p={4}>
                <Heading as="h1" size="xl" mb={6}>
                    Shift Management
                </Heading>
                <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
                    <Box w={{ base: '100%', md: '30%' }}>
                        <EmployeeList employees={employees} />
                    </Box>
                    <Box w={{ base: '100%', md: '70%' }}>
                        <ShiftCalendar
                            initialShifts={shifts}
                            onAddShift={handleAddShift}
                            onUpdateShift={handleUpdateShift}
                        />
                    </Box>
                </Flex>
            </Box>
        </DndProvider>
    );
}