// src/app/pos/management/[entityName]/ShiftManagementComponents/EmployeeList.tsx

"use client";

import React from 'react';
import { Box, Heading, VStack, Text, Badge } from '@chakra-ui/react';
import { Employee } from '../ShiftManagement';

interface EmployeeListProps {
    employees: Employee[];
    onEmployeeClick: (employee: Employee) => void;
}

const EmployeeListItem: React.FC<{ employee: Employee, onClick: (employee: Employee) => void }> = ({ employee, onClick }) => {
    return (
        <Box
            p={2}
            borderWidth="1px"
            borderRadius="lg"
            cursor="pointer"
            bg="white"
            mb={2}
            boxShadow="sm"
            _hover={{ bg: "gray.50" }}
            onClick={() => onClick(employee)}
        >
            <Text fontWeight="bold" fontSize="sm">{employee.name}</Text>
            <Badge
                colorScheme={
                    employee.role === 'Cashier' ? 'blue' :
                        employee.role === 'Waiter' ? 'green' :
                            employee.role === 'Kitchen Staff' ? 'red' : 'gray'
                }
                fontSize="xs"
            >
                {employee.role}
            </Badge>
        </Box>
    );
};

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onEmployeeClick }) => {
    // Add null/undefined check
    if (!employees || !Array.isArray(employees)) {
        return (
            <Box width="180px">
                <Heading size="sm" mb={3}>
                    Employees
                </Heading>
                <Text fontSize="sm">No employees available</Text>
            </Box>
        );
    }

    const groups = employees.reduce<Record<string, Employee[]>>((acc, e) => {
        const role = e.role || 'Other';
        if (!acc[role]) acc[role] = [];
        acc[role].push(e);
        return acc;
    }, {});

    return (
        <Box width="180px" minWidth="180px">
            <Heading size="sm" mb={3}>
                Employees
            </Heading>
            <VStack align="stretch" spacing={3}>
                {Object.keys(groups).map((role) => (
                    <Box key={role}>
                        <Text fontWeight="bold" fontSize="sm" mb={1}>{role}</Text>
                        <Box>
                            {groups[role].map((emp) => (
                                <EmployeeListItem
                                    key={emp.id}
                                    employee={emp}
                                    onClick={onEmployeeClick}
                                />
                            ))}
                        </Box>
                    </Box>
                ))}
            </VStack>
        </Box>
    );
};

export default EmployeeList;