// src/app/pos/management/[entityName]/ShiftManagement.tsx - CORRECTED
"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Center,
  Flex,
  Heading,
  Spinner,
  useToast,
  useDisclosure,
  Text,
  Alert,
  AlertIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  HStack,
} from "@chakra-ui/react";
// FIX: Corrected import for ShiftCalendar
import ShiftCalendar from "./ShiftManagementComponents/ShiftCalendar";
import EmployeeList from "./ShiftManagementComponents/EmployeeList";
import ShiftModal from "./ShiftManagementComponents/ShiftModal";
import ShiftUpdateModal from "./ShiftManagementComponents/ShiftUpdateModal";
import {
  getShifts,
  getEmployees,
  createShift,
  updateShift,
  updateShiftStatus,
  deleteShift,
} from "@/lib/api"; // FIX: Added deleteShift import
import { usePOSStore } from "@/lib/usePOSStore";
import moment from "moment";
import {
  Employee as EmployeeDetails,
  Shift as ShiftDetails,
} from "@/lib/config/entities";
import { logger } from "@/lib/logger";
import { FaSync, FaExclamationTriangle } from "react-icons/fa";

// FIX: Explicitly add properties to local interfaces to resolve type errors.
export interface Employee extends EmployeeDetails {
  id: string;
  name?: string;
  role?: string;
  color?: string;
  store_id?: string;
}

export interface Shift extends ShiftDetails {
  id: string;
  employee_id: string;
  recurring?: boolean; // Standardize on 'recurring'
  recurring_day?: number;
  start: Date;
  end: Date;
  employee_name?: string;
  color?: string;
  active?: boolean;
  isDraft?: boolean;
}
export default function ShiftsPage() {
  const {
    shifts,
    setShifts,
    addShift,
    updateShift: updateStoreShift,
    deleteShift: deleteStoreShift,
    employees: storeEmployees,
    setEmployees,
  } = usePOSStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  // FIX: Destructure isOpen correctly from useDisclosure
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    logger.info("ShiftManagement: useEffect triggered. Starting data load.");
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedShifts, fetchedEmployees] = await Promise.all([
          getShifts(),
          getEmployees(),
        ]);

        logger.info("ShiftManagement: Raw data from API received.");
        logger.info("   - Fetched Shifts: ", fetchedShifts);
        logger.info("   - Fetched Employees: ", fetchedEmployees);

        // Map employees with proper typing
        const mappedEmployees: Employee[] = fetchedEmployees.map((emp) => ({
          ...emp,
          name: `${emp.first_name} ${emp.last_name}`,
          role: emp.job_title_id,
          // Ensure color is set for calendar display
          color: emp.color || "#3182CE",
        }));

        logger.info(
          "ShiftManagement: Processed and mapped employees.",
          mappedEmployees
        );

        // Process shifts with proper date handling and employee enrichment
        const shiftsWithNamesAndDates: Shift[] = fetchedShifts
          .map((shift: any) => {
            try {
              const employee = mappedEmployees.find(
                (e) => e.id === shift.employee_id
              );

              // Handle date conversion safely
              let startDate: Date;
              let endDate: Date;

              try {
                startDate = moment(shift.start).toDate();
                endDate = moment(shift.end).toDate();
              } catch (dateError) {
                logger.error(
                  "ShiftManagement: Invalid date format, using current date as fallback",
                  shift
                );
                startDate = new Date();
                endDate = new Date();
              }

              return {
                ...shift,
                id: shift.id,
                employee_id: shift.employee_id,
                start: startDate,
                end: endDate,
                employee_name: employee ? employee.name : "Unknown",
                color: employee?.color || "#3182CE",
                recurring: shift.recurring || false, // FIX: Changed 'recurs' to 'recurring'
                recurringDay: shift.recurringDay,
                active: shift.active !== false, // Default to true if not specified
                title: shift.title || `Shift - ${employee?.name || "Unknown"}`,
                created_at: shift.created_at,
                updated_at: shift.updated_at,
              };
            } catch (error) {
              logger.error(
                "ShiftManagement: Error processing shift, skipping.",
                shift,
                error
              );
              return null;
            }
          })
          .filter(Boolean) as Shift[];

        logger.info(
          "ShiftManagement: Processed shifts with employee names.",
          shiftsWithNamesAndDates
        );

        setShifts(shiftsWithNamesAndDates);
        setEmployees(mappedEmployees);
        logger.info("ShiftManagement: Data successfully set in Zustand store.");
      } catch (error: any) {
        logger.error("ShiftManagement: Failed to load data", error);
        setError(error.message || "Failed to load shift data.");
        toast({
          title: "Failed to load data.",
          description:
            error.message ||
            "Could not fetch shifts or employees. Please try again.",
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

  const handleAddShift = async (newShiftData: {
    employeeId: string;
    start: Date;
    end: Date;
    recurs: boolean;
  }) => {
    if (!selectedEmployee) return;

    try {
      setIsProcessing(true);
      const { employeeId, start, end, recurs } = newShiftData;

      // Calculate recurring day if needed
      const recurringDay = recurs ? moment(start).day() : undefined;

      // Prepare API payload
      const apiPayload = {
        employee_id: employeeId,
        start: start.toISOString(),
        end: end.toISOString(),
        recurring: recurs, // Use 'recurring' consistently
        recurring_day: recurs ? moment(start).day() : undefined,
        active: true,
        title: `Shift - ${selectedEmployee.name}`,
        store_id: selectedEmployee.store_id || "default-store",
      };

      logger.info("ShiftManagement: Creating shift with payload:", apiPayload);

      const createdShift = await createShift(apiPayload);

      // Convert the created shift to the frontend format
      const shiftToAdd: Shift = {
        ...createdShift,
        start: moment(createdShift.start).toDate(),
        end: moment(createdShift.end).toDate(),
        employee_name: selectedEmployee.name,
        color: selectedEmployee.color,
        recurring: createdShift.recurring || false, // FIX: Changed 'recurs' to 'recurring'
        recurringDay: createdShift.recurringDay,
        active: createdShift.active !== false,
        title: createdShift.title || `Shift - ${selectedEmployee.name}`,
      };

      addShift(shiftToAdd);

      toast({
        title: "Shift added successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error: any) {
      logger.error("ShiftManagement: Failed to add shift", error);
      toast({
        title: "Failed to add shift.",
        description:
          error.message || "An error occurred while saving the shift.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateShift = async (
    shiftId: string,
    updates: Partial<Shift>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsProcessing(true);
      const originalShift = shifts.find((s) => s.id === shiftId);
      if (!originalShift) {
        logger.error("Shift not found for update:", shiftId);
        toast({
          title: "Error Updating Shift",
          description: "Original shift not found.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return { success: false, error: "Original shift not found." };
      }

      // Prepare API payload with proper date formatting
      const apiPayload = {
        ...originalShift,
        ...updates,
        start: updates.start ? updates.start.toISOString() : originalShift.start.toISOString(),
        end: updates.end ? updates.end.toISOString() : originalShift.end.toISOString(),
        recurring: updates.recurring !== undefined ? updates.recurring : originalShift.recurring,
        recurring_day: originalShift.recurring ? moment(updates.start || originalShift.start).day() : undefined,
        employee_id: originalShift.employee_id,
        active: updates.active !== undefined ? updates.active : originalShift.active,
      };

      logger.info("ShiftManagement: Updating shift with payload:", apiPayload);

      const updatedShift = await updateShift(shiftId, apiPayload);

      // Convert to frontend format
      const shiftToUpdate: Shift = {
        ...updatedShift,
        start: moment(updatedShift.start).toDate(),
        end: moment(updatedShift.end).toDate(),
        employee_name: originalShift.employee_name,
        color: originalShift.color,
        recurring: updatedShift.recurring || false, // FIX: Changed 'recurs' to 'recurring'
        recurringDay: updatedShift.recurringDay,
        active: updatedShift.active !== false,
      };

      updateStoreShift(shiftId, shiftToUpdate);

      toast({
        title: "Shift updated successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
      return { success: true };
    } catch (error: any) {
      logger.error("ShiftManagement: Failed to update shift", error);
      toast({
        title: "Failed to update shift.",
        description:
          error.message || "An error occurred while updating the shift.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteShift = async (shiftId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsProcessing(true);
      // Use the deleteShift function from API
      await deleteShift(shiftId);
      // Update the local store to reflect the change
      deleteStoreShift(shiftId);

      toast({
        title: "Shift deleted successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
      return { success: true };
    } catch (error: any) {
      logger.error("ShiftManagement: Failed to delete shift", error);
      toast({
        title: "Failed to delete shift.",
        description:
          error.message || "An error occurred while deleting the shift.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedShift(null);
    onOpen();
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    const employee = storeEmployees.find((emp) => emp.id === shift.employee_id);
    setSelectedEmployee(employee || null);
    onOpen();
  };

  const handleModalClose = () => {
    setSelectedEmployee(null);
    setSelectedShift(null);
    onClose();
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedShifts, fetchedEmployees] = await Promise.all([
        getShifts(),
        getEmployees(),
      ]);

      const mappedEmployees: Employee[] = fetchedEmployees.map((emp) => ({
        ...emp,
        name: `${emp.first_name} ${emp.last_name}`,
        role: emp.job_title_id,
        color: emp.color || "#3182CE",
      }));

      const shiftsWithNamesAndDates: Shift[] = fetchedShifts
        .map((shift: any) => {
          try {
            const employee = mappedEmployees.find(
              (e) => e.id === shift.employee_id
            );
            return {
              ...shift,
              start: moment(shift.start).toDate(),
              end: moment(shift.end).toDate(),
              employee_name: employee ? employee.name : "Unknown",
              color: employee?.color || "#3182CE",
              recurring: shift.recurring || false, // FIX: Changed 'recurs' to 'recurring'
              recurringDay: shift.recurringDay,
              active: shift.active !== false,
            };
          } catch (error) {
            return null;
          }
        })
        .filter(Boolean) as Shift[];

      setShifts(shiftsWithNamesAndDates);
      setEmployees(mappedEmployees);
    } catch (error: any) {
      setError(error.message || "Failed to refresh data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const activeShifts = shifts.filter((s) => s.active);
  const todayShifts = activeShifts.filter((shift) =>
    moment(shift.start).isSame(moment(), "day")
  );
  const upcomingShifts = activeShifts.filter((shift) =>
    moment(shift.start).isAfter(moment())
  );

  if (isLoading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" />
      </Center>
    );
  }

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
        <Heading as="h1" size="xl">
          Shift Management
        </Heading>
        <HStack spacing={4}>
          <Button
            leftIcon={<FaSync />}
            onClick={refreshData}
            isLoading={isProcessing}
          >
            Refresh
          </Button>
        </HStack>
      </Flex>

      {error && (
        <Alert status="error" mx={5} mt={5} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Statistics Overview */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} p={5}>
        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Total Shifts</StatLabel>
          <StatNumber>{activeShifts.length}</StatNumber>
          <StatHelpText>Active shifts</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Today's Shifts</StatLabel>
          <StatNumber color="blue.500">{todayShifts.length}</StatNumber>
          <StatHelpText>Scheduled for today</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Upcoming Shifts</StatLabel>
          <StatNumber color="green.500">{upcomingShifts.length}</StatNumber>
          <StatHelpText>Future shifts</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Box p={5}>
        <Flex direction={{ base: "column", lg: "row" }} gap={6}>
          {/* Employee List */}
          <Box flex={{ base: "1", lg: "0 0 240px" }} bg="white" p={6} rounded="md" shadow="sm">
            <EmployeeList
              employees={storeEmployees || []}
              onEmployeeClick={handleSelectEmployee}
            />
          </Box>

          {/* Calendar */}
          <Box flex="1" bg="white" p={6} rounded="md" shadow="sm" minWidth="0">
            <Heading as="h2" size="lg" mb={4}>
              Shift Calendar
            </Heading>
            {activeShifts.length === 0 ? (
              <Center h="300px" flexDirection="column">
                <FaExclamationTriangle size={48} color="#CBD5E0" />
                <Text color="gray.500" mt={4}>
                  No shifts scheduled. Click on an employee to create a shift.
                </Text>
              </Center>
            ) : (
              <ShiftCalendar
                shifts={activeShifts}
                employees={storeEmployees || []}
                onUpdateShift={handleUpdateShift}
                onDeleteShift={handleDeleteShift}
                onSelectShift={handleEditShift}
              />
            )}
          </Box>
        </Flex>
      </Box>

      {/* Modals */}
      {selectedShift ? (
        <ShiftUpdateModal
          isOpen={isOpen}
          onClose={handleModalClose}
          selectedShift={selectedShift}
          employee={selectedEmployee}
          onUpdateShift={handleUpdateShift}
          onDeleteShift={handleDeleteShift}
          isLoading={isProcessing}
        />
      ) : (
        <ShiftModal
          isOpen={isOpen}
          onClose={handleModalClose}
          employee={selectedEmployee}
          existingShifts={shifts.filter(
            (s) => s.employee_id === selectedEmployee?.id && s.active
          )}
          onAddShift={handleAddShift}
          isLoading={isProcessing}
        />
      )}
    </Box>
  );
}