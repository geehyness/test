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
  VStack,
  Alert,
  AlertIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useDisclosure,
  Grid,
  GridItem,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import {
  getTimesheets,
  getEmployees,
  fetchData,
  clockIn,
  clockOut,
  getJobTitles,
  createTimesheetEntry,
  getShifts,
} from "@/lib/api";
import {
  TimesheetEntry as TimesheetEntryType,
  Employee as EmployeeType,
} from "@/lib/config/entities";
import moment from "moment";
import { logger } from "@/lib/logger";
import {
  FaDownload,
  FaFilter,
  FaSignInAlt,
  FaSignOutAlt,
  FaSync,
  FaCalendarPlus,
  FaClock,
} from "react-icons/fa";
import { usePOSStore } from "@/lib/usePOSStore";

// Update the interface to include optional properties
interface TimesheetEntryWithEmployee
  extends Omit<TimesheetEntryType, "employee_id"> {
  store_id: string;
  employee_id: string;
  employee?: EmployeeType;
  duration_formatted: string;
  is_active?: boolean;
}

interface Shift {
  id: string;
  employee_id: string;
  start: string;
  end: string;
  employee_name?: string;
}

interface TimesheetFormData {
  employee_id: string;
  clock_in: string;
  clock_out: string;
  date: string;
}

export default function TimesheetManagement() {
  const [timesheets, setTimesheets] = useState<TimesheetEntryWithEmployee[]>(
    []
  );
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const toast = useToast();

  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDate, setSelectedDate] = useState<string>(
    moment().format("YYYY-MM-DD")
  );
  const [timesheetFormData, setTimesheetFormData] = useState<
    TimesheetFormData[]
  >([]);
  const [isSavingTimesheets, setIsSavingTimesheets] = useState(false);

  // Create job title lookup map
  const jobTitleMap = React.useMemo(() => {
    const map = new Map();
    jobTitles.forEach((job) => {
      map.set(job.id, job.title);
    });
    return map;
  }, [jobTitles]);

  // Update the fetchTimesheetData function
  const fetchTimesheetData = async () => {
    try {
      setIsLoading(true);

      // Use Promise.allSettled to handle partial failures gracefully
      const [
        fetchedTimesheets,
        fetchedEmployees,
        fetchedJobTitles,
        fetchedShifts
      ] = await Promise.allSettled([
        getTimesheets(),
        getEmployees(),
        getJobTitles(),
        getShifts()
      ]);

      // Handle results with error checking
      const timesheetsResult = fetchedTimesheets.status === 'fulfilled' ? fetchedTimesheets.value : [];
      const employeesResult = fetchedEmployees.status === 'fulfilled' ? fetchedEmployees.value : [];
      const jobTitlesResult = fetchedJobTitles.status === 'fulfilled' ? fetchedJobTitles.value : [];
      const shiftsResult = fetchedShifts.status === 'fulfilled' ? fetchedShifts.value : [];

      setJobTitles(jobTitlesResult);
      setShifts(shiftsResult);

      const employeesMap = new Map(
        employeesResult.map((emp: any) => [emp.id, emp])
      );

      const timesheetsWithEmployees = timesheetsResult.map((ts: any) => {
        const employee = employeesMap.get(ts.employee_id);
        const clockInTime = moment(ts.clock_in);
        const clockOutTime = ts.clock_out ? moment(ts.clock_out) : moment();

        let durationMinutes = ts.duration_minutes;
        if (!durationMinutes || durationMinutes === 0) {
          durationMinutes = Math.round(
            clockOutTime.diff(clockInTime, "minutes", true)
          );
        }

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        return {
          ...ts,
          employee,
          duration_minutes: durationMinutes,
          duration_formatted: `${hours}h ${minutes}m`,
          is_active: !ts.clock_out,
          store_id: ts.store_id || "default-store"
        };
      });

      setTimesheets(timesheetsWithEmployees);
      setEmployees(employeesResult);

      // Log any failed requests
      const failedRequests = [
        { name: 'timesheets', result: fetchedTimesheets },
        { name: 'employees', result: fetchedEmployees },
        { name: 'jobTitles', result: fetchedJobTitles },
        { name: 'shifts', result: fetchedShifts }
      ].filter(item => item.result.status === 'rejected');

      if (failedRequests.length > 0) {
        console.warn('Some data failed to load:', failedRequests);
      }

    } catch (err: any) {
      logger.error("Failed to fetch timesheets or employees:", err);
      setError("Failed to load timesheet data. Some features may not work correctly.");
      toast({
        title: "Partial Data Load",
        description: "Some data failed to load. Please refresh to try again.",
        status: "warning",
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

  // Load scheduled employees for selected date
  useEffect(() => {
    if (isOpen) {
      loadScheduledEmployees();
    }
  }, [selectedDate, isOpen, shifts, timesheets]);

  const loadScheduledEmployees = () => {
    const selectedDayShifts = shifts.filter((shift) =>
      moment(shift.start).isSame(selectedDate, "day")
    );

    const formData: TimesheetFormData[] = selectedDayShifts.map((shift) => {
      const existingTimesheet = timesheets.find(
        (ts) =>
          ts.employee_id === shift.employee_id &&
          moment(ts.clock_in).isSame(selectedDate, "day")
      );

      if (existingTimesheet) {
        return {
          employee_id: shift.employee_id,
          clock_in: moment(existingTimesheet.clock_in).format("HH:mm"),
          clock_out: existingTimesheet.clock_out
            ? moment(existingTimesheet.clock_out).format("HH:mm")
            : "",
          date: selectedDate,
        };
      }

      // Default to shift times if no existing timesheet
      return {
        employee_id: shift.employee_id,
        clock_in: moment(shift.start).format("HH:mm"),
        clock_out: moment(shift.end).format("HH:mm"),
        date: selectedDate,
      };
    });

    setTimesheetFormData(formData);
  };

  const handleClockOut = async (timesheetId: string) => {
    try {
      setIsProcessing(true);
      await clockOut(timesheetId);

      toast({
        title: "Clocked Out Successfully",
        description: "Employee has been clocked out.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await fetchTimesheetData();
    } catch (err: any) {
      toast({
        title: "Clock Out Failed",
        description: err.message || "Failed to clock out employee.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    try {
      const csvContent = [
        [
          "Employee",
          "Role",
          "Clock In",
          "Clock Out",
          "Duration",
          "Status",
          "Store",
        ],
        ...timesheets.map((ts) => [
          `${ts.employee?.first_name} ${ts.employee?.last_name}`,
          ts.employee?.job_title_id
            ? jobTitleMap.get(ts.employee.job_title_id) ||
            ts.employee.job_title_id
            : "N/A",
          moment(ts.clock_in).format("MM/DD/YYYY HH:mm"),
          ts.clock_out
            ? moment(ts.clock_out).format("MM/DD/YYYY HH:mm")
            : "Ongoing",
          ts.duration_formatted,
          ts.clock_out ? "Completed" : "Active",
          ts.store_id || "Main Store",
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timesheets-${moment().format("YYYY-MM-DD")}.csv`;
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
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export timesheet data.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSaveTimesheets = async () => {
    try {
      setIsSavingTimesheets(true);

      const savePromises = timesheetFormData.map(async (formData) => {
        if (!formData.clock_in || !formData.clock_out) return;

        const clockInDateTime = moment(
          `${formData.date} ${formData.clock_in}`
        ).toISOString();
        const clockOutDateTime = moment(
          `${formData.date} ${formData.clock_out}`
        ).toISOString();

        // Check if timesheet already exists for this employee and date
        const existingTimesheet = timesheets.find(
          (ts) =>
            ts.employee_id === formData.employee_id &&
            moment(ts.clock_in).isSame(formData.date, "day")
        );

        if (existingTimesheet) {
          // Update existing timesheet (you might need an update API endpoint)
          // For now, we'll create a new one and handle duplicates on backend
          return createTimesheetEntry({
            employee_id: formData.employee_id,
            clock_in: clockInDateTime,
            clock_out: clockOutDateTime,
            store_id:
              employees.find((emp) => emp.id === formData.employee_id)
                ?.store_id || "default-store",
          });
        } else {
          return createTimesheetEntry({
            employee_id: formData.employee_id,
            clock_in: clockInDateTime,
            clock_out: clockOutDateTime,
            store_id:
              employees.find((emp) => emp.id === formData.employee_id)
                ?.store_id || "default-store",
          });
        }
      });

      await Promise.all(savePromises);

      toast({
        title: "Timesheets Saved",
        description: `Successfully saved timesheets for ${selectedDate}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      await fetchTimesheetData();
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Failed to save timesheets.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSavingTimesheets(false);
    }
  };

  const updateTimesheetForm = (
    employeeId: string,
    field: string,
    value: string
  ) => {
    setTimesheetFormData((prev) =>
      prev.map((item) =>
        item.employee_id === employeeId ? { ...item, [field]: value } : item
      )
    );
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee
      ? `${employee.first_name} ${employee.last_name}`
      : "Unknown Employee";
  };

  const getEmployeeRole = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee?.job_title_id
      ? jobTitleMap.get(employee.job_title_id)
      : "N/A";
  };

  const getShiftTimes = (employeeId: string) => {
    const shift = shifts.find(
      (s) =>
        s.employee_id === employeeId &&
        moment(s.start).isSame(selectedDate, "day")
    );
    return shift
      ? {
        start: moment(shift.start).format("HH:mm"),
        end: moment(shift.end).format("HH:mm"),
      }
      : null;
  };

  const filteredTimesheets = timesheets.filter((ts) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return !ts.clock_out;
    if (filterStatus === "completed") return !!ts.clock_out;
    return true;
  });

  // Calculate statistics
  const stats = {
    totalEntries: timesheets.length,
    activeShifts: timesheets.filter((ts) => !ts.clock_out).length,
    completedShifts: timesheets.filter((ts) => !!ts.clock_out).length,
    totalHours:
      timesheets.reduce((sum, ts) => sum + (ts.duration_minutes || 0), 0) / 60,
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
        <VStack spacing={4}>
          <Text color="red.500" fontSize="lg">
            {error}
          </Text>
          <Button onClick={fetchTimesheetData} leftIcon={<FaSync />}>
            Retry
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="xl">
          Timesheet Management
        </Heading>
        <HStack spacing={4}>
          <Button
            leftIcon={<FaCalendarPlus />}
            colorScheme="green"
            onClick={onOpen}
          >
            Log Day's Timesheet
          </Button>
          <Button
            leftIcon={<FaFilter />}
            variant="outline"
            onClick={() =>
              setFilterStatus(
                filterStatus === "active"
                  ? "completed"
                  : filterStatus === "completed"
                    ? "all"
                    : "active"
              )
            }
          >
            Filter:{" "}
            {filterStatus === "all"
              ? "All"
              : filterStatus === "active"
                ? "Active Only"
                : "Completed Only"}
          </Button>
          <Button
            leftIcon={<FaDownload />}
            colorScheme="green"
            onClick={handleExport}
          >
            Export CSV
          </Button>
          <Button
            leftIcon={<FaSync />}
            onClick={fetchTimesheetData}
            isLoading={isProcessing}
          >
            Refresh
          </Button>
        </HStack>
      </Flex>

      {/* Statistics Overview */}
      <SimpleGrid columns={4} spacing={4} mb={6}>
        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Total Entries</StatLabel>
          <StatNumber>{stats.totalEntries}</StatNumber>
          <StatHelpText>All time entries</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Active Shifts</StatLabel>
          <StatNumber color="orange.500">{stats.activeShifts}</StatNumber>
          <StatHelpText>Currently working</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Completed Shifts</StatLabel>
          <StatNumber color="green.500">{stats.completedShifts}</StatNumber>
          <StatHelpText>Finished shifts</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Total Hours</StatLabel>
          <StatNumber>{stats.totalHours.toFixed(1)}h</StatNumber>
          <StatHelpText>Total worked hours</StatHelpText>
        </Stat>
      </SimpleGrid>

      {filteredTimesheets.length > 0 ? (
        <Box overflowX="auto" bg="white" borderRadius="md" shadow="sm">
          <Table variant="simple">
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
                <Tr key={entry.id} _hover={{ bg: "gray.50" }}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">
                        {entry.employee
                          ? `${entry.employee.first_name} ${entry.employee.last_name}`
                          : "Unknown Employee"}
                      </Text>

                      {entry.employee?.job_title_id && (
                        <Badge colorScheme="blue" fontSize="xs">
                          {jobTitleMap.get(entry.employee.job_title_id) ||
                            entry.employee.job_title_id}{" "}
                        </Badge>
                      )}
                    </VStack>
                  </Td>
                  <Td>{moment(entry.clock_in).format("MM/DD/YYYY HH:mm")}</Td>
                  <Td>
                    {entry.clock_out ? (
                      moment(entry.clock_out).format("MM/DD/YYYY HH:mm")
                    ) : (
                      <HStack>
                        <Tag colorScheme="orange" size="sm">
                          Ongoing
                        </Tag>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleClockOut(entry.id)}
                          isLoading={isProcessing}
                          leftIcon={<FaSignOutAlt />}
                        >
                          Clock Out
                        </Button>
                      </HStack>
                    )}
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={
                        entry.duration_minutes && entry.duration_minutes > 480
                          ? "green"
                          : "gray"
                      }
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
                      {entry.store_id || "Main Store"}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Center minH="200px" bg="white" borderRadius="md" shadow="sm">
          <VStack spacing={4}>
            <Text color="gray.500" fontSize="lg">
              No timesheet entries found.
            </Text>
            {filterStatus !== "all" && (
              <Button onClick={() => setFilterStatus("all")}>
                Show All Entries
              </Button>
            )}
          </VStack>
        </Center>
      )}

      {/* Summary Footer */}
      <Box mt={6} p={4} bg="gray.50" borderRadius="md">
        <Text fontSize="sm" color="gray.600">
          Total entries: {filteredTimesheets.length} | Active shifts:{" "}
          {filteredTimesheets.filter((ts) => !ts.clock_out).length} | Completed
          shifts: {filteredTimesheets.filter((ts) => !!ts.clock_out).length}
        </Text>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert status="error" mt={4} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Log Timesheet Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FaClock />
              <Text>Log Timesheets for Day</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Date Selection */}
              <FormControl>
                <FormLabel>Select Date</FormLabel>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={moment().format
                    ("YYYY-MM-DD")}
                  w={64}
                />
              </FormControl>

              {/* Timesheet Grid */}
              {timesheetFormData.length > 0 ? (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead bg="gray.100">
                      <Tr>
                        <Th>Employee</Th>
                        <Th>Role</Th>
                        <Th>Scheduled Shift</Th>
                        <Th>Clock In</Th>
                        <Th>Clock Out</Th>
                        <Th>Duration</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {timesheetFormData.map((formData, index) => {
                        const shiftTimes = getShiftTimes(formData.employee_id);
                        const clockInMoment = moment(
                          `${selectedDate} ${formData.clock_in}`
                        );
                        const clockOutMoment = formData.clock_out
                          ? moment(`${selectedDate} ${formData.clock_out}`)
                          : null;
                        const duration = clockOutMoment
                          ? Math.round(
                            clockOutMoment.diff(
                              clockInMoment,
                              "minutes",
                              true
                            )
                          )
                          : 0;
                        const hours = Math.floor(duration / 60);
                        const minutes = duration % 60;

                        return (
                          <Tr
                            key={formData.employee_id}
                            _hover={{ bg: "gray.50" }}
                          >
                            <Td>
                              <Text fontWeight="medium">
                                {getEmployeeName(formData.employee_id)}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme="blue">
                                {getEmployeeRole(formData.employee_id)}
                              </Badge>
                            </Td>
                            <Td>
                              {shiftTimes ? (
                                <Text fontSize="sm" color="gray.600">
                                  {shiftTimes.start} - {shiftTimes.end}
                                </Text>
                              ) : (
                                <Text fontSize="sm" color="gray.400">
                                  Not scheduled
                                </Text>
                              )}
                            </Td>
                            <Td>
                              <Input
                                type="time"
                                value={formData.clock_in}
                                onChange={(e) =>
                                  updateTimesheetForm(
                                    formData.employee_id,
                                    "clock_in",
                                    e.target.value
                                  )
                                }
                                size="sm"
                              />
                            </Td>
                            <Td>
                              <Input
                                type="time"
                                value={formData.clock_out}
                                onChange={(e) =>
                                  updateTimesheetForm(
                                    formData.employee_id,
                                    "clock_out",
                                    e.target.value
                                  )
                                }
                                size="sm"
                              />
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={duration > 0 ? "green" : "gray"}
                                fontSize="sm"
                              >
                                {duration > 0 ? `${hours}h ${minutes}m` : "N/A"}
                              </Badge>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Center minH="200px">
                  <VStack spacing={4}>
                    <Text color="gray.500" fontSize="lg">
                      No employees scheduled for{" "}
                      {moment(selectedDate).format("MMM D, YYYY")}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Employees must be scheduled in Shift Management to appear
                      here.
                    </Text>
                  </VStack>
                </Center>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleSaveTimesheets}
              isLoading={isSavingTimesheets}
              isDisabled={timesheetFormData.length === 0}
              leftIcon={<FaCalendarPlus />}
            >
              Save Timesheets ({timesheetFormData.length} employees)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}