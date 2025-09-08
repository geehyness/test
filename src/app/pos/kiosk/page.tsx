// src/app/pos/kiosk/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Heading,
    Text,
    Spinner,
    Center,
    VStack,
    InputGroup,
    Input,
    InputLeftElement,
    Flex,
    Button,
    useToast,
    Tag,
    HStack,
    Spacer,
    InputRightElement,
} from "@chakra-ui/react";
import { FaUser, FaSearch } from "react-icons/fa";
import { usePOSStore } from "@/lib/usePOSStore";
import { getEmployees, getTimesheets, clockIn, clockOut } from "@/lib/api";
import { Employee, TimesheetEntry } from "@/lib/config/entities";
import moment from "moment";
import { logger } from "@/lib/logger";

const ClockInOutPage: React.FC = () => {
    const router = useRouter();
    const { currentStaff, kioskUserId, _hasHydrated } = usePOSStore();
    const toast = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const isKioskUser = useMemo(() => {
        return _hasHydrated && currentStaff?.id === kioskUserId;
    }, [_hasHydrated, currentStaff, kioskUserId]);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedEmployees, fetchedTimesheets] = await Promise.all([
                getEmployees(),
                getTimesheets(), // FIXED: Changed from setTimesheetEntries() to getTimesheets()
            ]);
            setEmployees(fetchedEmployees);
            setTimesheetEntries(fetchedTimesheets);
        } catch (error) {
            logger.error("Failed to fetch data for kiosk", error);
            toast({
                title: "Error fetching data.",
                description: "Failed to load employee and timesheet data.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        // Hydration check to ensure currentStaff and kioskUserId are loaded
        if (!_hasHydrated) return;

        // Redirect if not the kiosk user
        if (!isKioskUser) {
            router.replace("/pos/login");
            return;
        }

        fetchAllData();
    }, [_hasHydrated, isKioskUser, router, fetchAllData]);

    const filteredEmployees = useMemo(() => {
        if (!searchQuery) return employees;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return employees.filter(
            (emp) =>
                emp.first_name.toLowerCase().includes(lowerCaseQuery) ||
                emp.last_name.toLowerCase().includes(lowerCaseQuery)
        );
    }, [employees, searchQuery]);

    const getEmployeeStatus = (employeeId: string): TimesheetEntry | undefined => {
        // Find the timesheet entry for the employee that does not have a clock_out time
        return timesheetEntries.find(
            (ts) => ts.employee_id === employeeId && !ts.clock_out
        );
    };

    const handleClockAction = async (employeeId: string) => {
        const currentEntry = getEmployeeStatus(employeeId);
        setIsLoading(true);
        try {
            if (currentEntry) {
                // Clock Out
                await clockOut(currentEntry.id, currentStaff?.store_id || '');
                toast({
                    title: "Clocked Out",
                    description: "You have been successfully clocked out.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                // Clock In
                await clockIn(employeeId, currentStaff?.store_id || '');
                toast({
                    title: "Clocked In",
                    description: "You have been successfully clocked in.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            }
            // Re-fetch data to reflect the change
            await fetchAllData();
        } catch (error) {
            logger.error("Failed to perform clock action", error);
            toast({
                title: "Error",
                description: `Failed to ${currentEntry ? "clock out" : "clock in"}. Please try again.`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!_hasHydrated) {
        return (
            <Center minH="100vh">
                <Spinner size="xl" />
            </Center>
        );
    }

    if (!isKioskUser) {
        return (
            <Center minH="100vh">
                <Spinner size="xl" />
            </Center>
        );
    }

    return (
        <Box p={8} bg="var(--light-gray-bg)" minH="100vh">
            <VStack spacing={6} align="stretch" maxW="lg" mx="auto">
                <Heading as="h1" size="xl" textAlign="center" color="var(--dark-gray-text)">
                    Employee Kiosk
                </Heading>
                <Text textAlign="center" color="var(--medium-gray-text)">
                    Please search for your name to clock in or out.
                </Text>

                <InputGroup size="lg" shadow="md">
                    <InputLeftElement
                        pointerEvents="none"
                        children={<FaSearch color="var(--medium-gray-text)" />}
                    />
                    <Input
                        type="text"
                        placeholder="Search for your name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant="filled"
                        bg="white"
                        borderRadius="md"
                        _focus={{ borderColor: "var(--primary-green)", boxShadow: "0 0 0 1px var(--primary-green)" }}
                    />
                    {searchQuery && (
                        <InputRightElement width="4.5rem">
                            <Button h="1.75rem" size="sm" onClick={() => setSearchQuery("")}>
                                Clear
                            </Button>
                        </InputRightElement>
                    )}
                </InputGroup>

                <VStack spacing={4} align="stretch">
                    {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((employee) => {
                            const isClockedIn = !!getEmployeeStatus(employee.id);
                            return (
                                <Box
                                    key={employee.id}
                                    p={4}
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    bg="white"
                                    shadow="sm"
                                >
                                    <HStack spacing={4} align="center">
                                        <Box flex="1">
                                            <Flex align="center">
                                                <FaUser />
                                                <Text fontWeight="bold" fontSize="lg" ml={2}>
                                                    {employee.first_name} {employee.last_name}
                                                </Text>
                                                <Spacer />
                                                <Tag
                                                    size="lg"
                                                    colorScheme={isClockedIn ? "red" : "green"}
                                                    variant="solid"
                                                >
                                                    {isClockedIn ? "Clocked In" : "Clocked Out"}
                                                </Tag>
                                            </Flex>
                                        </Box>
                                        <Button
                                            colorScheme={isClockedIn ? "red" : "green"}
                                            onClick={() => handleClockAction(employee.id)}
                                            size="md"
                                            isLoading={isLoading}
                                        >
                                            {isClockedIn ? "Clock Out" : "Clock In"}
                                        </Button>
                                    </HStack>
                                </Box>
                            );
                        })
                    ) : (
                        <Text textAlign="center" mt={4} color="var(--medium-gray-text)">
                            No employees found.
                        </Text>
                    )}
                </VStack>
            </VStack>
        </Box>
    );
};

export default ClockInOutPage;