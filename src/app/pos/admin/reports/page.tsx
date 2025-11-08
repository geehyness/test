// src/app/pos/admin/reports/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    Box,
    Heading,
    Text,
    VStack,
    // FIX: Import Table components
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Spinner,
    Center,
    Alert,
    // FIX: Import Alert sub-components
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Input,
    InputGroup,
    // FIX: Import Input sub-components
    InputLeftElement,
    Select,
    HStack,
    Spacer,
    StackProps
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { usePOSStore } from "../../../../lib/usePOSStore";
import { useRouter } from "next/navigation";
import { Report } from "@/lib/config/entities";

export default function AccessReportsPage() {
    const { currentStaff, accessReports } = usePOSStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    useEffect(() => {
        // Client-side authorization check
        if (currentStaff === undefined) {
            // Still hydrating, keep loading
            setLoading(true);
            return;
        }

        if (!currentStaff || currentStaff.mainAccessRole?.name.toLowerCase() !== 'admin') {
            // Not an admin or not logged in, redirect
            router.replace(currentStaff?.mainAccessRole?.name ? `/pos/${currentStaff.mainAccessRole.name.toLowerCase()}` : '/pos/login');
            return;
        }

        // If authorized, set loading to false
        setLoading(false);
    }, [currentStaff, router]);

    // Memoize filtered reports for performance
    const filteredReports = useMemo(() => {
        let filtered = accessReports;

        // Filter by search term
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (report) =>
                    report.user_name.toLowerCase().includes(lowerCaseSearchTerm) ||
                    report.attempted_path.toLowerCase().includes(lowerCaseSearchTerm) ||
                    report.user_id.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        // Filter by role
        if (filterRole !== "all") {
            filtered = filtered.filter(
                (report) => report.user_role.toLowerCase() === filterRole
            );
        }

        return filtered;
    }, [accessReports, searchTerm, filterRole]);

    // Extract unique roles for the filter dropdown
    const uniqueRoles = useMemo(() => {
        const roles = new Set<string>();
        accessReports.forEach(report => roles.add(report.user_role));
        return Array.from(roles).sort();
    }, [accessReports]);

    if (loading) {
        return (
            <Center minH="100vh" bg="var(--light-gray-bg)">
                {/* FIX: Removed invalid `thickness` prop */}
                <Spinner
                    size="xl"
                    emptyColor="gray.200"
                    color="var(--primary-green)"
                />
            </Center>
        );
    }

    // If currentStaff is null or not admin after loading, this component should not render
    // as the useEffect would have redirected. This is a safeguard.
    if (!currentStaff || currentStaff.mainAccessRole?.name.toLowerCase() !== 'admin') {
        return null;
    }

    return (
        <Box p={6}>
            <Heading as="h1" size="xl" mb={6} color="var(--dark-gray-text)">
                Unauthorized Access Reports
            </Heading>

            <Text fontSize="lg" mb={8} color="var(--medium-gray-text)">
                This report tracks attempts by employees to access pages they are not authorized for.
            </Text>

            {/* FIX: Removed redundant `as` prop to fix `spacing` error */}
            <HStack mb={6} spacing={4}>
                <InputGroup flex="1">
                    {/* FIX: Use InputLeftElement */}
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search by user, ID, or path..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        rounded="md"
                        borderColor="var(--border-color)"
                        _focus={{ borderColor: "var(--primary-green)"}}
                        color="var(--dark-gray-text)"
                    />
                </InputGroup>

                <Select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    width="200px"
                    rounded="md"
                    borderColor="var(--border-color)"
                    _focus={{ borderColor: "var(--primary-green)"}}
                    color="var(--dark-gray-text)"
                >
                    <option value="all">All Roles</option>
                    {uniqueRoles.map(role => (
                        <option key={role} value={role.toLowerCase()}>{role}</option>
                    ))}
                </Select>
            </HStack>

            {filteredReports.length === 0 ? (
                // FIX: Use Alert sub-components
                <Alert status="info" rounded="md" shadow="sm">
                    <AlertIcon />
                    <AlertTitle>No Matching Reports</AlertTitle>
                    <AlertDescription>
                        No unauthorized page access attempts found matching your criteria.
                    </AlertDescription>
                </Alert>
            ) : (
                <TableContainer
                    borderWidth="1px"
                    borderRadius="lg"
                    shadow="md"
                    bg="var(--background-color-light)"
                >
                    <Table variant="simple">
                        <Thead bg="var(--light-gray-bg)">
                            <Tr>
                                <Th color="var(--dark-gray-text)">User</Th>
                                <Th color="var(--dark-gray-text)">Role</Th>
                                <Th color="var(--dark-gray-text)">Attempted Path</Th>
                                <Th isNumeric color="var(--dark-gray-text)">Attempts</Th>
                                <Th color="var(--dark-gray-text)">Last Attempt</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredReports.map((report: Report) => (
                                <Tr key={report.id}>
                                    <Td color="var(--dark-gray-text)">{report.user_name} (ID: {report.user_id.substring(0, 8)}...)</Td>
                                    <Td color="var(--dark-gray-text)">{report.user_role}</Td>
                                    <Td color="var(--dark-gray-text)">{report.attempted_path}</Td>
                                    <Td isNumeric color="var(--dark-gray-text)">{report.attempts}</Td>
                                    <Td color="var(--dark-gray-text)">{new Date(report.last_attempt_at).toLocaleString()}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}