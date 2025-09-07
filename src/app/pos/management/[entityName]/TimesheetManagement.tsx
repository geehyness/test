// src/app/pos/management/[entityName]/TimesheetManagement.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Box, Heading, Text, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td, Tag, Flex } from "@chakra-ui/react";
import { getTimesheets, getEmployees } from "@/lib/api";
import { TimesheetEntry as TimesheetEntryType, Employee as EmployeeType } from "@/lib/config/entities";
import moment from "moment";
import { logger } from "@/lib/logger";

interface TimesheetEntryWithEmployee extends Omit<TimesheetEntryType, 'employee_id'> {
    employee: EmployeeType;
}

export default function TimesheetManagement() {
    const [timesheets, setTimesheets] = useState<TimesheetEntryWithEmployee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTimesheetData = async () => {
            try {
                const fetchedTimesheets: TimesheetEntryType[] = await getTimesheets();
                const fetchedEmployees: EmployeeType[] = await getEmployees();

                const employeesMap = new Map(fetchedEmployees.map(emp => [emp.id, emp]));

                const timesheetsWithEmployees = fetchedTimesheets.map(ts => ({
                    ...ts,
                    employee: employeesMap.get(ts.employee_id)!,
                }));

                setTimesheets(timesheetsWithEmployees);
            } catch (err) {
                logger.error("Failed to fetch timesheets or employees:", err);
                setError("Failed to load timesheet data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTimesheetData();
    }, []);

    const formatDuration = (minutes: number) => {
        if (!minutes || minutes < 0) return "N/A";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

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
            </Flex>

            {timesheets.length > 0 ? (
                <Table variant="striped">
                    <Thead>
                        <Tr>
                            <Th>Employee</Th>
                            <Th>Clock In</Th>
                            <Th>Clock Out</Th>
                            <Th>Duration</Th>
                            <Th>Status</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {timesheets.map((entry) => (
                            <Tr key={entry.id}>
                                <Td>{entry.employee?.first_name} {entry.employee?.last_name}</Td>
                                <Td>{moment(entry.clock_in).format("MM/DD/YYYY HH:mm")}</Td>
                                <Td>{entry.clock_out ? moment(entry.clock_out).format("MM/DD/YYYY HH:mm") : <Tag colorScheme="red">Ongoing</Tag>}</Td>
                                <Td>{formatDuration(entry.duration_minutes)}</Td>
                                <Td>
                                    <Tag colorScheme={entry.clock_out ? "green" : "red"}>
                                        {entry.clock_out ? "Completed" : "Active"}
                                    </Tag>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            ) : (
                <Text>No timesheet entries found.</Text>
            )}
        </Box>
    );
}