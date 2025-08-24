// src/app/pos/management/[entityName]/components/EmployeeList.tsx

import React from 'react';
import { useDrag } from 'react-dnd';
import { Box, Heading, VStack, Text, Badge } from '@chakra-ui/react';
import { Employee } from '../ShiftManagement';

interface EmployeeListProps {
    employees: Employee[];
}

interface DraggableEmployeeProps {
    employee: Employee;
}

const DraggableEmployee: React.FC<DraggableEmployeeProps> = ({ employee }) => {
    const [, drag] = useDrag(() => ({
        type: 'employee',
        item: {
            employeeId: employee.id,
            employeeName: `${employee.first_name} ${employee.last_name}`,
            employeeRole: employee.role
        },
    }));

    return (
        <Box
            ref={drag}
            p={3}
            borderWidth="1px"
            borderRadius="lg"
            cursor="grab"
            bg="white"
            mb={2}
            boxShadow="sm"
        >
            <Text fontWeight="bold">{employee.first_name} {employee.last_name}</Text>
            <Badge colorScheme={
                employee.role === 'Cashier' ? 'blue' :
                    employee.role === 'Waiter' ? 'green' :
                        employee.role === 'Kitchen Staff' ? 'red' : 'gray'
            }>
                {employee.role}
            </Badge>
        </Box>
    );
};

const EmployeeList: React.FC<EmployeeListProps> = ({ employees }) => {
    const cashiers = employees.filter(e => e.role === 'Cashier');
    const waiters = employees.filter(e => e.role === 'Waiter');
    const kitchenStaff = employees.filter(e => e.role === 'Kitchen Staff');
    const otherStaff = employees.filter(e =>
        e.role !== 'Cashier' && e.role !== 'Waiter' && e.role !== 'Kitchen Staff'
    );

    return (
        <Box p={4} bg="gray.50" rounded="md" h="100%">
            <Heading size="md" mb={4}>
                Available Staff
            </Heading>
            <VStack spacing={4} align="stretch">
                {cashiers.length > 0 && (
                    <Box>
                        <Heading size="sm" mb={2}>Cashiers</Heading>
                        {cashiers.map(emp => (
                            <DraggableEmployee key={emp.id} employee={emp} />
                        ))}
                    </Box>
                )}
                {waiters.length > 0 && (
                    <Box>
                        <Heading size="sm" mb={2}>Waiters</Heading>
                        {waiters.map(emp => (
                            <DraggableEmployee key={emp.id} employee={emp} />
                        ))}
                    </Box>
                )}
                {kitchenStaff.length > 0 && (
                    <Box>
                        <Heading size="sm" mb={2}>Kitchen Staff</Heading>
                        {kitchenStaff.map(emp => (
                            <DraggableEmployee key={emp.id} employee={emp} />
                        ))}
                    </Box>
                )}
                {otherStaff.length > 0 && (
                    <Box>
                        <Heading size="sm" mb={2}>Other Staff</Heading>
                        {otherStaff.map(emp => (
                            <DraggableEmployee key={emp.id} employee={emp} />
                        ))}
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default EmployeeList;