// src/app/pos/management/[entityName]/TimesheetManagement.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Heading,
    Text,
    Spinner,
    Center,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Tag,
    Flex,
    Button,
    useToast,
    HStack,
    Badge,
    VStack
} from "@chakra-ui/react";
import { getTimesheets, getEmployees, fetchData } from "@/lib/api";
import { TimesheetEntry as TimesheetEntryType, Employee as EmployeeType } from "@/lib/config/entities";
import moment from "moment";
import { logger } from "@/lib/logger";
import { FaDownload, FaFilter } from "react-icons/fa";

// Update the interface to include optional properties
interface TimesheetEntryWithEmployee extends Omit<TimesheetEntryType, 'employee_id'> {
    store_id: string;
    employee?: EmployeeType; // Make employee optional
    duration_formatted: string;
}

export default function TimesheetManagement() {
    const [timesheets, setTimesheets] = useState<TimesheetEntryWithEmployee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const toast = useToast();

    const fetchTimesheetData = async () => {
        try {
            setIsLoading(true);
            const fetchedTimesheets: TimesheetEntryType[] = await getTimesheets();
            const fetchedEmployees: EmployeeType[] = await getEmployees();

            const employeesMap = new Map(fetchedEmployees.map(emp => [emp.id, emp]));

            const timesheetsWithEmployees = fetchedTimesheets.map(ts => {
                const employee = employeesMap.get(ts.employee_id)!;
                const clockIn = moment(ts.clock_in);
                const clockOut = ts.clock_out ? moment(ts.clock_out) : moment();
                const durationMinutes = ts.duration_minutes || Math.round(clockOut.diff(clockIn, 'minutes', true));

                const hours = Math.floor(durationMinutes / 60);
                const minutes = durationMinutes % 60;

                return {
                    ...ts,
                    employee,
                    duration_minutes: durationMinutes,
                    duration_formatted: `${hours}h ${minutes}m`
                };
            });

            setTimesheets(timesheetsWithEmployees);
        } catch (err) {
            logger.error("Failed to fetch timesheets or employees:", err);
            setError("Failed to load timesheet data.");
            toast({
                title: "Error",
                description: "Failed to load timesheet data.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTimesheetData();
    }, []);

    const handleExport = async () => {
        try {
            // Create CSV content
            const csvContent = [
                ['Employee', 'Clock In', 'Clock Out', 'Duration', 'Status'],
                ...timesheets.map(ts => [
                    `${ts.employee?.first_name} ${ts.employee?.last_name}`,
                    moment(ts.clock_in).format("MM/DD/YYYY HH:mm"),
                    ts.clock_out ? moment(ts.clock_out).format("MM/DD/YYYY HH:mm") : 'Ongoing',
                    ts.duration_formatted,
                    ts.clock_out ? 'Completed' : 'Active'
                ])
            ].map(row => row.join(',')).join('\n');

            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `timesheets-${moment().format('YYYY-MM-DD')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Export Successful",
                description: "Timesheet data exported to CSV.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            toast({
                title: "Export Failed",
                description: "Failed to export timesheet data.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const filteredTimesheets = timesheets.filter(ts => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') return !ts.clock_out;
        if (filterStatus === 'completed') return !!ts.clock_out;
        return true;
    });

    if (isLoading) {
        return (
            <Center minH="400px">
                <Spinner size="xl" />
            </Center>
        );
    }

    if (error) {
        return (
            <Center minH="400px">
                <Text color="red.500">{error}</Text>
            </Center>
        );
    }

    return (
        <Box p={6}>
            <Flex justifyContent="space-between" alignItems="center" mb={6}>
                <Heading as="h1" size="xl">Timesheet Management</Heading>
                <HStack spacing={4}>
                    <Button
                        leftIcon={<FaFilter />}
                        variant="outline"
                        onClick={() => setFilterStatus(filterStatus === 'active' ? 'completed' : filterStatus === 'completed' ? 'all' : 'active')}
                    >
                        Filter: {filterStatus === 'all' ? 'All' : filterStatus === 'active' ? 'Active Only' : 'Completed Only'}
                    </Button>
                    <Button
                        leftIcon={<FaDownload />}
                        colorScheme="green"
                        onClick={handleExport}
                    >
                        Export CSV
                    </Button>
                    <Button
                        leftIcon={<FaFilter />}
                        onClick={fetchTimesheetData}
                    >
                        Refresh
                    </Button>
                </HStack>
            </Flex>

            {filteredTimesheets.length > 0 ? (
                <Box overflowX="auto">
                    <Table variant="striped" size="sm">
                        <Thead bg="gray.100">
                            <Tr>
                                <Th>Employee</Th>
                                <Th>Clock In</Th>
                                <Th>Clock Out</Th>
                                <Th>Duration</Th>
                                <Th>Status</Th>
                                <Th>Store</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredTimesheets.map((entry) => (
                                <Tr key={entry.id} _hover={{ bg: 'gray.50' }}>
                                    <Td>
                                        <VStack align="start" spacing={1}>
                                            <Text fontWeight="medium">
                                                {entry.employee ? `${entry.employee.first_name} ${entry.employee.last_name}` : 'Unknown Employee'}
                                            </Text>
                                            {entry.employee?.job_title_id && ( // Use job_title_id instead of position
                                                <Badge colorScheme="blue" fontSize="xs">
                                                    {entry.employee.job_title_id}
                                                </Badge>
                                            )}
                                        </VStack>
                                    </Td>
                                    <Td>{moment(entry.clock_in).format("MM/DD/YYYY HH:mm")}</Td>
                                    <Td>
                                        {entry.clock_out ?
                                            moment(entry.clock_out).format("MM/DD/YYYY HH:mm") :
                                            <Tag colorScheme="orange" size="sm">Ongoing</Tag>
                                        }
                                    </Td>
                                    <Td>
                                        <Badge
                                            colorScheme={entry.duration_minutes && entry.duration_minutes > 480 ? "green" : "gray"}
                                            fontSize="sm"
                                        >
                                            {entry.duration_formatted}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Tag
                                            colorScheme={entry.clock_out ? "green" : "red"}
                                            size="sm"
                                            borderRadius="full"
                                        >
                                            {entry.clock_out ? "Completed" : "Active"}
                                        </Tag>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme="purple" fontSize="xs">
                                            {entry.store_id || 'Main Store'}
                                        </Badge>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            ) : (
                <Center minH="200px">
                    <Text color="gray.500">No timesheet entries found.</Text>
                </Center>
            )}

            <Box mt={6} p={4} bg="gray.50" borderRadius="md">
                <Text fontSize="sm" color="gray.600">
                    Total entries: {filteredTimesheets.length} |
                    Active shifts: {filteredTimesheets.filter(ts => !ts.clock_out).length} |
                    Completed shifts: {filteredTimesheets.filter(ts => !!ts.clock_out).length}
                </Text>
            </Box>
        </Box>
    );
}