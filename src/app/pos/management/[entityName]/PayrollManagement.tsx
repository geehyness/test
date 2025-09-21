// src/app/pos/management/[entityName]/PayrollManagement.tsx
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
    VStack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    FormControl,
    FormLabel,
    Input,
    Select,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    SimpleGrid
} from "@chakra-ui/react";
import {
    getPayrolls,
    getEmployees,
    processPayroll,
    calculatePayroll,
    getPayrollSettings,
    updatePayrollSettings,
    createPayroll
} from "@/lib/api";
import { Payroll, Employee, PayrollSettings } from "@/lib/config/entities";
import { FaCog, FaMoneyCheck, FaCalculator, FaCheckCircle } from "react-icons/fa";
import moment from "moment";

interface PayrollWithEmployee extends Payroll {
    employee?: Employee;
}

export default function PayrollManagement() {
    const [payrolls, setPayrolls] = useState<PayrollWithEmployee[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [settings, setSettings] = useState<PayrollSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const {
        isOpen: isSettingsOpen,
        onOpen: onSettingsOpen,
        onClose: onSettingsClose
    } = useDisclosure();

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [fetchedPayrolls, fetchedEmployees, fetchedSettings] = await Promise.all([
                getPayrolls(),
                getEmployees(),
                getPayrollSettings()
            ]);

            const payrollsWithEmployees = fetchedPayrolls.map(payroll => {
                const employee = fetchedEmployees.find(emp => emp.id === payroll.employee_id);
                return {
                    ...payroll,
                    employee
                };
            });

            setPayrolls(payrollsWithEmployees);
            setEmployees(fetchedEmployees);
            setSettings(fetchedSettings);
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to load payroll data.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleProcessPayroll = async (payrollId: string) => {
        try {
            setIsProcessing(true);
            const processedPayroll = await processPayroll(payrollId);

            setPayrolls(prev => prev.map(p =>
                p.id === payrollId ? { ...p, ...processedPayroll } : p
            ));

            toast({
                title: "Success",
                description: "Payroll processed successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to process payroll.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGeneratePayroll = async (employeeId: string) => {
        try {
            setIsProcessing(true);

            // Calculate pay period (bi-weekly by default)
            const periodStart = moment().subtract(2, 'weeks').startOf('week').format('YYYY-MM-DD');
            const periodEnd = moment().endOf('week').format('YYYY-MM-DD');

            const payrollData = await calculatePayroll(employeeId, periodStart, periodEnd);
            const newPayroll = await createPayroll(payrollData);

            // Refresh data
            await fetchData();

            toast({
                title: "Success",
                description: "Payroll generated successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to generate payroll.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateSettings = async (updatedSettings: Partial<PayrollSettings>) => {
        try {
            const newSettings = await updatePayrollSettings(updatedSettings);
            setSettings(newSettings);
            onSettingsClose();

            toast({
                title: "Success",
                description: "Settings updated successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to update settings.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid": return "green";
            case "processing": return "blue";
            case "pending": return "orange";
            case "failed": return "red";
            default: return "gray";
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
        <Box p={6}>
            <Flex justifyContent="space-between" alignItems="center" mb={6}>
                <Heading as="h1" size="xl">Payroll Management</Heading>
                <HStack spacing={4}>
                    <Button
                        leftIcon={<FaCog />}
                        onClick={onSettingsOpen}
                        variant="outline"
                    >
                        Settings
                    </Button>
                    <Button
                        leftIcon={<FaCalculator />}
                        onClick={fetchData}
                    >
                        Refresh
                    </Button>
                </HStack>
            </Flex>

            {/* Summary Stats */}
            <SimpleGrid columns={3} spacing={4} mb={6}>
                <Stat bg="white" p={4} borderRadius="md" shadow="sm">
                    <StatLabel>Total Payroll</StatLabel>
                    <StatNumber>R{payrolls.reduce((sum, p) => sum + p.net_pay, 0).toFixed(2)}</StatNumber>
                    <StatHelpText>This period</StatHelpText>
                </Stat>

                <Stat bg="white" p={4} borderRadius="md" shadow="sm">
                    <StatLabel>Pending</StatLabel>
                    <StatNumber>{payrolls.filter(p => p.status === "pending").length}</StatNumber>
                    <StatHelpText>Payrolls to process</StatHelpText>
                </Stat>

                <Stat bg="white" p={4} borderRadius="md" shadow="sm">
                    <StatLabel>Processed</StatLabel>
                    <StatNumber>{payrolls.filter(p => p.status === "paid").length}</StatNumber>
                    <StatHelpText>This period</StatHelpText>
                </Stat>
            </SimpleGrid>

            {/* Payroll Table */}
            <Box overflowX="auto" bg="white" borderRadius="md" shadow="sm">
                <Table variant="simple">
                    <Thead bg="gray.100">
                        <Tr>
                            <Th>Employee</Th>
                            <Th>Period</Th>
                            <Th>Hours</Th>
                            <Th>Gross Pay</Th>
                            <Th>Net Pay</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {payrolls.map((payroll) => (
                            <Tr key={payroll.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                    <VStack align="start" spacing={1}>
                                        <Text fontWeight="medium">
                                            {payroll.employee ? `${payroll.employee.first_name} ${payroll.employee.last_name}` : 'Unknown'}
                                        </Text>
                                        {payroll.employee?.job_title_id && (
                                            <Badge colorScheme="blue" fontSize="xs">
                                                {payroll.employee.job_title_id}
                                            </Badge>
                                        )}
                                    </VStack>
                                </Td>
                                <Td>
                                    <VStack align="start" spacing={0}>
                                        <Text fontSize="sm">{moment(payroll.pay_period_start).format('MMM D')}</Text>
                                        <Text fontSize="sm">to {moment(payroll.pay_period_end).format('MMM D')}</Text>
                                    </VStack>
                                </Td>
                                <Td>
                                    <Badge colorScheme="green">
                                        {payroll.hours_worked.toFixed(1)}h
                                        {payroll.overtime_hours > 0 && ` + ${payroll.overtime_hours.toFixed(1)} OT`}
                                    </Badge>
                                </Td>
                                <Td>R{payroll.gross_pay.toFixed(2)}</Td>
                                <Td>R{payroll.net_pay.toFixed(2)}</Td>

                                <Td>
                                    <Tag colorScheme={getStatusColor(payroll.status)} size="sm">
                                        {payroll.status.toUpperCase()}
                                    </Tag>
                                </Td>
                                <Td>
                                    <HStack spacing={2}>
                                        {payroll.status === "pending" && (
                                            <Button
                                                size="sm"
                                                colorScheme="green"
                                                onClick={() => handleProcessPayroll(payroll.id)}
                                                isLoading={isProcessing}
                                                leftIcon={<FaMoneyCheck />}
                                            >
                                                Process
                                            </Button>
                                        )}
                                        {payroll.status === "paid" && (
                                            <Badge colorScheme="green">
                                                <FaCheckCircle />
                                                Paid
                                            </Badge>
                                        )}
                                    </HStack>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>

            {/* Employee List for Payroll Generation */}
            <Box mt={8} bg="white" p={6} borderRadius="md" shadow="sm">
                <Heading size="md" mb={4}>Generate New Payroll</Heading>
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Employee</Th>
                            <Th>Position</Th>
                            <Th>Salary</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {employees.map((employee) => (
                            <Tr key={employee.id}>
                                <Td>{employee.first_name} {employee.last_name}</Td>
                                <Td>{employee.job_title_id}</Td>
                                <Td>R{employee.salary.toFixed(2)}/year</Td>
                                <Td>
                                    <Button
                                        size="sm"
                                        colorScheme="blue"
                                        onClick={() => handleGeneratePayroll(employee.id)}
                                        isLoading={isProcessing}
                                        leftIcon={<FaCalculator />}
                                    >
                                        Generate
                                    </Button>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>

            {/* Settings Modal */}
            <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Payroll Settings</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Payment Cycle</FormLabel>
                                <Select
                                    value={settings?.default_payment_cycle || "bi-weekly"}
                                    onChange={(e) => handleUpdateSettings({
                                        default_payment_cycle: e.target.value as "weekly" | "bi-weekly" | "monthly"
                                    })}
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="bi-weekly">Bi-Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Tax Rate (%)</FormLabel>
                                <NumberInput
                                    value={settings ? (settings.tax_rate * 100) : 20}
                                    onChange={(_, value) => handleUpdateSettings({
                                        tax_rate: value / 100
                                    })}
                                    min={0}
                                    max={50}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Overtime Multiplier</FormLabel>
                                <NumberInput
                                    value={settings?.overtime_multiplier || 1.5}
                                    onChange={(_, value) => handleUpdateSettings({
                                        overtime_multiplier: value
                                    })}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onSettingsClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}