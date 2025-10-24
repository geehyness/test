// src/app/pos/management/[entityName]/PayrollManagement.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
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
  SimpleGrid,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip,
  Switch,
  FormHelperText,
} from "@chakra-ui/react";
import {
  getPayrolls,
  getEmployees,
  processPayroll,
  calculatePayroll,
  getPayrollSettings,
  updatePayrollSettings,
  createPayroll,
  updatePayrollSettingsWithId,
  getCurrentSessionContext,
  getJobTitles,
  getTimesheets,
  checkBackendHealth,
} from "@/lib/api";
import { Payroll, Employee, PayrollSettings } from "@/lib/config/entities";
import {
  FaCog,
  FaMoneyCheck,
  FaCalculator,
  FaCheckCircle,
  FaSync,
  FaExclamationTriangle,
  FaUsers,
} from "react-icons/fa";

interface PayrollWithEmployee extends Payroll {
  employee?: Employee;
}

interface PayrollPeriod {
  start: string;
  end: string;
  payDate: string;
}

// Helper function to create default payroll settings
const createDefaultPayrollSettings = (): PayrollSettings => {
  const session = getCurrentSessionContext();
  return {
    id: "",
    store_id: session.store_id,
    default_payment_cycle: "bi-weekly",
    tax_rate: 0.2,
    overtime_multiplier: 1.5,
    overtime_threshold: 40,
    pay_day: 15,
    auto_process: false,
    include_benefits: false,
    benefits_rate: 0.05,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

// Enhanced error handling function with warning messages (same as page.tsx)
const handleApiError = (error: any, operation: string, toast: any) => {
  // Handle validation errors specifically with warning messages
  if (error.message?.includes("422")) {
    try {
      const errorData = JSON.parse(error.message);
      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMessages = errorData.detail
          .map((err: any) => {
            const field = err.loc[err.loc.length - 1];
            const friendlyName = field
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l: string) => l.toUpperCase());
            return `${friendlyName}: ${err.msg}`;
          })
          .join(", ");

        toast({
          title: "Form Validation Warning",
          description: `Please check: ${errorMessages}`,
          status: "warning",
          duration: 6000,
          isClosable: true,
        });
        return;
      }
    } catch {
      // If parsing fails, use the original error
      toast({
        title: "Validation Warning",
        description:
          error.message || `Please check your input for ${operation}.`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }
  } else if (error.message?.includes("404")) {
    toast({
      title: "Not Found",
      description: `The requested resource was not found for ${operation}.`,
      status: "warning",
      duration: 5000,
      isClosable: true,
    });
  } else if (error.message?.includes("405")) {
    toast({
      title: "Method Not Allowed",
      description: `The operation ${operation} is not supported.`,
      status: "warning",
      duration: 5000,
      isClosable: true,
    });
  } else if (error.message?.includes("400")) {
    toast({
      title: "Input Warning",
      description: `Please check your input data for ${operation}.`,
      status: "warning",
      duration: 5000,
      isClosable: true,
    });
  } else if (
    error.message?.includes("Network error") ||
    error.message?.includes("fetch")
  ) {
    toast({
      title: "Connection Issue",
      description:
        "Unable to connect to the server. Please check your connection.",
      status: "warning",
      duration: 5000,
      isClosable: true,
    });
  } else {
    // For generic errors, use warning instead of error
    toast({
      title: "Operation Warning",
      description: error.message || `Failed to ${operation}. Please try again.`,
      status: "warning",
      duration: 5000,
      isClosable: true,
    });
  }
};

// Native Date helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};

const formatDateLong = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatDateISO = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const isSameDay = (date1: string, date2: string): boolean => {
  return new Date(date1).toDateString() === new Date(date2).toDateString();
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addWeeks = (date: Date, weeks: number): Date => {
  return addDays(date, weeks * 7);
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const startOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfWeek = (date: Date): Date => {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
};

const getDaysDifference = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export default function PayrollManagement() {
  const [payrolls, setPayrolls] = useState<PayrollWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [timesheets, setTimesheets] = useState<any[]>([]); // Add this line with other state declarations

  // Job title lookup map
  const jobTitleMap = React.useMemo(() => {
    const map = new Map();
    jobTitles.forEach((job) => {
      map.set(job.id, job.title);
    });
    return map;
  }, [jobTitles]);

  // Calculate payroll period based on settings or use current date
  const [payrollPeriod, setPayrollPeriod] = useState<PayrollPeriod>(() => {
    const today = new Date();
    const periodStart = startOfWeek(addWeeks(today, -2));
    const periodEnd = endOfWeek(today);
    const payDate = endOfWeek(addWeeks(today, 1));

    return {
      start: formatDateISO(periodStart),
      end: formatDateISO(periodEnd),
      payDate: formatDateISO(payDate),
    };
  });

  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();

  const {
    isOpen: isGenerateAllOpen,
    onOpen: onGenerateAllOpen,
    onClose: onGenerateAllClose,
  } = useDisclosure();

  // Optimized calculateDefaultPeriod using native Date
  const calculateDefaultPeriod = React.useCallback(() => {
    const today = new Date();
    let periodStart: Date, periodEnd: Date, payDate: Date;

    if (settings) {
      const { default_payment_cycle, pay_day } = settings;

      switch (default_payment_cycle) {
        case "weekly":
          periodStart = startOfWeek(addWeeks(today, -1));
          periodEnd = endOfWeek(periodStart);
          payDate = endOfWeek(today);
          break;

        case "bi-weekly":
          periodStart = startOfWeek(addWeeks(today, -2));
          periodEnd = endOfWeek(addWeeks(periodStart, 1));
          payDate = endOfWeek(today);
          break;

        case "monthly":
          periodStart = startOfMonth(addMonths(today, -1));
          periodEnd = endOfMonth(periodStart);

          if (pay_day) {
            payDate = new Date(today.getFullYear(), today.getMonth(), pay_day);
            if (payDate < today) {
              payDate = addMonths(payDate, 1);
            }
          } else {
            payDate = endOfMonth(today);
          }
          break;

        default:
          periodStart = startOfWeek(addWeeks(today, -2));
          periodEnd = endOfWeek(today);
          payDate = endOfWeek(addWeeks(today, 1));
      }
    } else {
      // Default fallback period
      periodStart = startOfWeek(addWeeks(today, -2));
      periodEnd = endOfWeek(today);
      payDate = endOfWeek(addWeeks(today, 1));
    }

    setPayrollPeriod((prev) => {
      const newPeriod = {
        start: formatDateISO(periodStart),
        end: formatDateISO(periodEnd),
        payDate: formatDateISO(payDate),
      };

      // Prevent unnecessary re-renders
      return JSON.stringify(prev) === JSON.stringify(newPeriod)
        ? prev
        : newPeriod;
    });
  }, [settings?.default_payment_cycle, settings?.pay_day]);

  // Update period when settings change
  useEffect(() => {
    calculateDefaultPeriod();
  }, [calculateDefaultPeriod]);

  // Add this check at the beginning of the component
  useEffect(() => {
    if (!settings && !isLoading) {
      toast({
        title: "Payroll Settings Required",
        description: "Loading payroll settings...",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [settings, isLoading]);

  // In the fetchData function, replace the current implementation with this:
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching payroll data...");

      // Use Promise.allSettled to handle potential API failures gracefully
      const results = await Promise.allSettled([
        getPayrolls(),
        getEmployees(),
        getPayrollSettings(),
        getJobTitles(),
        getTimesheets(), // Add this to get timesheet data
      ]);

      // Extract results with proper error handling
      const fetchedPayrolls =
        results[0].status === "fulfilled" ? results[0].value || [] : [];
      const fetchedEmployees =
        results[1].status === "fulfilled" ? results[1].value || [] : [];
      const fetchedSettings =
        results[2].status === "fulfilled" ? results[2].value : null;
      const fetchedJobTitles =
        results[3].status === "fulfilled" ? results[3].value || [] : [];
      const fetchedTimesheets =
        results[4].status === "fulfilled" ? results[4].value || [] : [];

      setJobTitles(fetchedJobTitles);

      console.log("Raw payroll data:", fetchedPayrolls);
      console.log("Raw employees data:", fetchedEmployees);
      console.log("Raw timesheets data:", fetchedTimesheets);

      // FIX: Ensure we always have arrays
      const safePayrolls = Array.isArray(fetchedPayrolls)
        ? fetchedPayrolls
        : [];
      const safeEmployees = Array.isArray(fetchedEmployees)
        ? fetchedEmployees
        : [];
      const safeTimesheets = Array.isArray(fetchedTimesheets)
        ? fetchedTimesheets
        : [];

      // Store timesheets for the hasTimesheetData function
      setTimesheets(safeTimesheets);

      // Enrich payrolls with full employee objects
      const payrollsWithEmployees = safePayrolls.map((payroll: any) => {
        const employee = safeEmployees.find(
          (emp: any) => emp.id === payroll.employee_id
        );

        return {
          ...payroll,
          employee,
          hours_worked: payroll.hours_worked || 0,
          overtime_hours: payroll.overtime_hours || 0,
          gross_pay: payroll.gross_pay || 0,
          net_pay: payroll.net_pay || 0,
          tax_deductions: payroll.tax_deductions || 0,
          status: payroll.status || "pending",
        };
      });

      console.log("Enriched payroll data:", payrollsWithEmployees);

      setPayrolls(payrollsWithEmployees);
      setEmployees(safeEmployees);
      setSettings(fetchedSettings);

      // Calculate period after settings are loaded
      if (fetchedSettings) {
        calculateDefaultPeriod();
      }
    } catch (err: any) {
      console.error("Error fetching payroll data:", err);
      const errorMessage = err.message || "Failed to load payroll data.";
      setError(errorMessage);
      handleApiError(err, "loading payroll data", toast);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkBackend = async () => {
      const isBackendHealthy = await checkBackendHealth();
      if (!isBackendHealthy) {
        toast({
          title: "Backend Connection Issue",
          description: "Cannot connect to payroll backend. Some features may not work.",
          status: "warning",
          duration: 6000,
          isClosable: true,
        });
      }
    };

    checkBackend();
  }, []);

  const handleProcessPayroll = async (payrollId: string) => {
    try {
      setIsProcessing(true);
      console.log("Processing payroll:", payrollId);

      const processedPayroll = await processPayroll(payrollId);

      console.log("Processed payroll result:", processedPayroll);

      setPayrolls((prev) =>
        prev.map((p) =>
          p.id === payrollId ? { ...p, ...processedPayroll } : p
        )
      );

      toast({
        title: "Success",
        description: "Payroll processed successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error("Error processing payroll:", err);
      handleApiError(err, "processing payroll", toast);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to determine payment date
  const determinePaymentDate = (
    period: PayrollPeriod,
    settings: PayrollSettings
  ): string => {
    if (settings.default_payment_cycle === "monthly" && settings.pay_day) {
      const periodEnd = new Date(period.end);
      let paymentDate = new Date(
        periodEnd.getFullYear(),
        periodEnd.getMonth(),
        settings.pay_day
      );

      // If pay day has already passed this month, use next month
      if (paymentDate < periodEnd) {
        paymentDate = addMonths(paymentDate, 1);
      }

      return formatDateISO(paymentDate);
    }

    // For weekly/bi-weekly, use the period's payDate
    return period.payDate;
  };

  const handleGeneratePayroll = async (employee: Employee) => {
    try {
      setIsProcessing(true);
      setSelectedEmployee(employee);
  
      console.log("🔍 [Payroll] Generating payroll for:", employee);
      console.log("📅 [Payroll] Period:", payrollPeriod);
      console.log("⚙️ [Payroll] Using settings:", settings);

      // Ensure we have settings
      if (!settings) {
        toast({
          title: "Settings Missing",
          description: "Payroll settings not loaded. Please check settings and try again.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Convert date strings to ISO strings for backend
      const periodStartISO = new Date(payrollPeriod.start).toISOString();
      const periodEndISO = new Date(payrollPeriod.end).toISOString();

      console.log("Sending dates to backend:", {
        start: periodStartISO,
        end: periodEndISO
      });

      const payrollData = await calculatePayroll(
        employee.id,
        periodStartISO,  // Send as ISO string
        periodEndISO     // Send as ISO string
      );

      console.log("Calculated payroll data:", payrollData);

      if (!payrollData) {
        throw new Error("No timesheet entries found for the specified period");
      }

      // Use settings to determine payment date
      const paymentDate = determinePaymentDate(payrollPeriod, settings);

      // Create the payroll record with proper datetime handling
      const newPayroll = await createPayroll({
        ...payrollData,
        employee_id: employee.id,
        status: "pending",
        store_id: employee.store_id || "default-store",
        pay_period_start: periodStartISO,  // Use ISO string
        pay_period_end: periodEndISO,      // Use ISO string
        payment_date: new Date(paymentDate).toISOString(), // Convert to ISO string
        // Use actual calculated values from backend
        hours_worked: payrollData.hours_worked || 0,
        overtime_hours: payrollData.overtime_hours || 0,
        gross_pay: payrollData.gross_pay || 0,
        net_pay: payrollData.net_pay || 0,
        tax_deductions: payrollData.tax_deductions || 0,
        // Include settings-based fields
        overtime_rate: settings.overtime_multiplier,
        payment_cycle: settings.default_payment_cycle,
      } as any);

      console.log("Created payroll:", newPayroll);

      await fetchData();

      toast({
        title: "Success",
        description: `Payroll generated for ${employee.first_name} ${employee.last_name}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error("❌ [Payroll] Error generating payroll:", err);
      handleApiError(err, "generating payroll", toast);
    } finally {
      setIsProcessing(false);
      setSelectedEmployee(null);
    }
  };

  const handleGenerateAll = async () => {
    try {
      setBatchProcessing(true);

      const employeesWithoutPayroll = employees.filter(
        (emp) =>
          !payrolls.some(
            (p) =>
              p.employee_id === emp.id &&
              isSameDay(p.pay_period_start, payrollPeriod.start)
          )
      );

      let successCount = 0;
      let errorCount = 0;

      for (const employee of employeesWithoutPayroll) {
        try {
          await handleGeneratePayroll(employee);
          successCount++;
        } catch (error) {
          console.error(
            `Failed to generate payroll for ${employee.first_name}:`,
            error
          );
          errorCount++;
          // Continue with next employee even if one fails
        }
      }

      onGenerateAllClose();

      toast({
        title: "Batch Processing Complete",
        description: `Successfully generated payroll for ${successCount} employees. ${errorCount > 0 ? `${errorCount} employees had errors.` : ""
          }`,
        status: successCount > 0 ? "success" : "warning",
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      handleApiError(err, "batch payroll generation", toast);
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleUpdateSettings = async (
    updatedSettings: Partial<PayrollSettings>
  ) => {
    try {
      console.log("🔧 [Payroll Settings] Starting settings update...");
      console.log("📋 [Payroll Settings] Current settings:", settings);
      console.log(
        "📤 [Payroll Settings] Updated settings received:",
        updatedSettings
      );

      // Get current session context
      const session = getCurrentSessionContext();

      // Create a complete payload with ALL fields
      const payload: PayrollSettings = {
        // Core required fields
        id: settings?.id || "",
        store_id: settings?.store_id || session.store_id,

        // Payment cycle settings
        default_payment_cycle:
          updatedSettings.default_payment_cycle ||
          settings?.default_payment_cycle ||
          "bi-weekly",

        // Tax settings
        tax_rate:
          updatedSettings.tax_rate !== undefined
            ? updatedSettings.tax_rate
            : settings?.tax_rate !== undefined
              ? settings.tax_rate
              : 0.2,

        // Overtime settings
        overtime_multiplier:
          updatedSettings.overtime_multiplier !== undefined
            ? updatedSettings.overtime_multiplier
            : settings?.overtime_multiplier !== undefined
              ? settings.overtime_multiplier
              : 1.5,

        overtime_threshold:
          updatedSettings.overtime_threshold !== undefined
            ? updatedSettings.overtime_threshold
            : settings?.overtime_threshold !== undefined
              ? settings.overtime_threshold
              : 40,

        // Pay day
        pay_day:
          updatedSettings.pay_day !== undefined
            ? updatedSettings.pay_day
            : settings?.pay_day !== undefined
              ? settings.pay_day
              : 15,

        // Auto process
        auto_process:
          updatedSettings.auto_process !== undefined
            ? updatedSettings.auto_process
            : settings?.auto_process !== undefined
              ? settings.auto_process
              : false,

        // Benefits settings
        include_benefits:
          updatedSettings.include_benefits !== undefined
            ? updatedSettings.include_benefits
            : settings?.include_benefits !== undefined
              ? settings.include_benefits
              : false,

        benefits_rate:
          updatedSettings.benefits_rate !== undefined
            ? updatedSettings.benefits_rate
            : settings?.benefits_rate !== undefined
              ? settings.benefits_rate
              : 0.05,

        // Timestamps
        created_at: settings?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log(
        "📦 [Payroll Settings] Complete payload being sent:",
        payload
      );

      let newSettings;

      if (settings?.id) {
        console.log(
          "🔄 [Payroll Settings] Using PUT to update existing settings"
        );
        newSettings = await updatePayrollSettingsWithId(settings.id, payload);
      } else {
        console.log("🆕 [Payroll Settings] Using POST to create new settings");
        newSettings = await updatePayrollSettings(payload);
      }

      console.log("✅ [Payroll Settings] API response received:", newSettings);

      // Update the state with the complete settings object
      setSettings(newSettings);
      onSettingsClose();

      toast({
        title: "Success",
        description: "Payroll settings updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error("❌ [Payroll Settings] ERROR:", err);
      handleApiError(err, "updating payroll settings", toast);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "green";
      case "processing":
        return "blue";
      case "pending":
        return "orange";
      case "failed":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return FaCheckCircle;
      case "processing":
        return FaMoneyCheck;
      case "pending":
        return FaExclamationTriangle;
      case "failed":
        return FaExclamationTriangle;
      default:
        return FaExclamationTriangle;
    }
  };

  // Calculate statistics with memoization
  const stats = React.useMemo(
    () => ({
      totalPayroll: payrolls.reduce((sum, p) => sum + p.net_pay, 0),
      pendingCount: payrolls.filter((p) => p.status === "pending").length,
      processedCount: payrolls.filter((p) => p.status === "paid").length,
      processingCount: payrolls.filter((p) => p.status === "processing").length,
      totalEmployees: employees.length,
      employeesWithoutPayroll: employees.filter(
        (emp) =>
          !payrolls.some(
            (p) =>
              p.employee_id === emp.id &&
              isSameDay(p.pay_period_start, payrollPeriod.start)
          )
      ).length,
      employeesWithTimesheets: employees.filter((emp) =>
        payrolls.some((p) => p.employee_id === emp.id)
      ).length,
    }),
    [payrolls, employees, payrollPeriod.start]
  );

  // Replace the current hasTimesheetData function with this:
  const hasTimesheetData = (employeeId: string) => {
    // Check if there are any timesheet entries for this employee in the current period
    const hasEntries = payrolls.some(
      (p) =>
        p.employee_id === employeeId &&
        isSameDay(p.pay_period_start, payrollPeriod.start)
    );

    // Also check if we have actual timesheet data from the backend
    // This ensures we're not just checking payroll records but actual clock-in/out data
    const employeeTimesheets = timesheets.filter(
      (entry: any) =>
        entry.employee_id === employeeId &&
        entry.clock_in &&
        new Date(entry.clock_in) >= new Date(payrollPeriod.start) &&
        new Date(entry.clock_in) <= new Date(payrollPeriod.end)
    );

    console.log(
      `Employee ${employeeId} timesheets:`,
      employeeTimesheets.length
    );
    return hasEntries || employeeTimesheets.length > 0;
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
        <Heading as="h1" size="xl">
          Payroll Management
        </Heading>
        <HStack spacing={4}>
          <Button
            leftIcon={<FaCog />}
            onClick={onSettingsOpen}
            variant="outline"
            colorScheme="green"
            borderColor="green.400"
            _hover={{ bg: "green.50" }}
          >
            Settings
          </Button>
          <Button
            leftIcon={<FaSync />}
            onClick={fetchData}
            isLoading={isProcessing}
            colorScheme="blue"
          >
            Refresh
          </Button>
        </HStack>
      </Flex>
      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {/* Summary Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Total Payroll</StatLabel>
          <StatNumber>R{stats.totalPayroll.toFixed(2)}</StatNumber>
          <StatHelpText>This period</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Pending</StatLabel>
          <StatNumber color="orange.500">{stats.pendingCount}</StatNumber>
          <StatHelpText>Awaiting processing</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Processed</StatLabel>
          <StatNumber color="green.500">{stats.processedCount}</StatNumber>
          <StatHelpText>Completed payments</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Employees</StatLabel>
          <StatNumber>{stats.totalEmployees}</StatNumber>
          <StatHelpText>Total employees</StatHelpText>
        </Stat>
      </SimpleGrid>
      {/* Warning Alert for Missing Timesheets */}
      {stats.employeesWithoutPayroll > 0 && (
        <Alert status="warning" mb={6} borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">
              Missing Timesheet Data for {stats.employeesWithoutPayroll}{" "}
              Employees
            </Text>
            <Text fontSize="sm">
              Some employees don't have timesheet entries for the selected
              period. Please ensure all employees have clock-in/clock-out
              records before generating payroll.
              <Button
                variant="link"
                colorScheme="orange"
                size="sm"
                ml={2}
                onClick={() =>
                  window.open("/pos/management/timesheets", "_blank")
                }
              >
                Go to Timesheets
              </Button>
            </Text>
          </Box>
        </Alert>
      )}
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Payroll Records</Tab>
          <Tab>Generate Payroll</Tab>
          <Tab>Payroll Period</Tab>
        </TabList>

        <TabPanels>
          {/* Payroll Records Tab */}
          <TabPanel p={0} pt={4}>
            {payrolls.length === 0 ? (
              <Center minH="200px" bg="white" borderRadius="md" shadow="sm">
                <VStack spacing={4}>
                  <FaExclamationTriangle size={48} color="#CBD5E0" />
                  <Text color="gray.500">No payroll records found.</Text>
                  <Text fontSize="sm" color="gray.600">
                    Generate payroll for employees in the "Generate Payroll"
                    tab.
                  </Text>
                </VStack>
              </Center>
            ) : (
              <Box overflowX="auto" bg="white" borderRadius="md" shadow="sm">
                <Table variant="simple">
                  <Thead bg="gray.100">
                    <Tr>
                      <Th>Employee</Th>
                      <Th>Period</Th>
                      <Th>Hours</Th>
                      <Th>Gross Pay</Th>
                      <Th>Net Pay</Th>
                      <Th>Pay Date</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {payrolls.map((payroll) => (
                      <Tr key={payroll.id} _hover={{ bg: "gray.50" }}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">
                              {payroll.employee
                                ? `${payroll.employee.first_name} ${payroll.employee.last_name}`
                                : "Unknown Employee"}
                            </Text>
                            {payroll.employee?.job_title_id && (
                              <Badge colorScheme="blue" fontSize="xs">
                                {jobTitleMap.get(
                                  payroll.employee.job_title_id
                                ) || payroll.employee.job_title_id}
                              </Badge>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm">
                              {formatDate(payroll.pay_period_start)}
                            </Text>
                            <Text fontSize="sm">
                              to {formatDate(payroll.pay_period_end)}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme="green">
                            {payroll.hours_worked?.toFixed(1) || "0"}h
                            {payroll.overtime_hours > 0 &&
                              ` + ${payroll.overtime_hours.toFixed(1)} OT`}
                          </Badge>
                        </Td>
                        <Td>R{payroll.gross_pay?.toFixed(2) || "0.00"}</Td>
                        <Td>R{payroll.net_pay?.toFixed(2) || "0.00"}</Td>
                        <Td>
                          {(payroll as any).payment_date
                            ? formatDate((payroll as any).payment_date)
                            : "Not set"}
                        </Td>
                        <Td>
                          <Tag
                            colorScheme={getStatusColor(payroll.status)}
                            size="sm"
                          >
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
                              <Badge colorScheme="green" p={2}>
                                <FaCheckCircle /> Paid
                              </Badge>
                            )}
                            {payroll.status === "processing" && (
                              <Badge colorScheme="blue" p={2}>
                                Processing
                              </Badge>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </TabPanel>

          {/* Generate Payroll Tab */}
          <TabPanel p={0} pt={4}>
            <Box bg="white" p={6} borderRadius="md" shadow="sm">
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Heading size="md">Generate Payroll</Heading>
                <Button
                  colorScheme="green"
                  onClick={onGenerateAllOpen}
                  leftIcon={<FaUsers />}
                  isDisabled={stats.employeesWithoutPayroll === 0}
                >
                  Generate All ({stats.employeesWithoutPayroll})
                </Button>
              </Flex>

              {/* Employee List */}
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Employee</Th>
                    <Th>Salary</Th>
                    <Th>Hours Available</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {employees.map((employee) => {
                    const hasPayroll = payrolls.some(
                      (p) =>
                        p.employee_id === employee.id &&
                        isSameDay(p.pay_period_start, payrollPeriod.start)
                    );

                    const hasTimesheets = hasTimesheetData(employee.id);

                    // Debug each employee
                    if (!hasTimesheets && !hasPayroll) {
                      console.log(`Missing data for ${employee.first_name}:`, {
                        employeeId: employee.id,
                        hasTimesheets,
                        hasPayroll,
                        period: payrollPeriod,
                        timesheetCount: timesheets.filter((ts: any) =>
                          ts.employee_id === employee.id &&
                          new Date(ts.clock_in) >= new Date(payrollPeriod.start) &&
                          new Date(ts.clock_in) <= new Date(payrollPeriod.end)
                        ).length
                      });
                    }

                    return (
                      <Tr key={employee.id}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">
                              {employee
                                ? `${employee.first_name} ${employee.last_name}`
                                : "Unknown Employee"}
                            </Text>
                            {employee?.job_title_id && (
                              <Badge colorScheme="blue" fontSize="xs">
                                {jobTitleMap.get(employee.job_title_id) || employee.job_title_id}
                              </Badge>
                            )}
                          </VStack>
                        </Td>
                        <Td>R{employee.salary?.toFixed(2) || "0.00"}/year</Td>
                        <Td>
                          {hasTimesheets ? (
                            <Badge colorScheme="green">Available</Badge>
                          ) : (
                            <Badge colorScheme="red">Missing</Badge>
                          )}
                        </Td>
                        <Td>
                          {hasPayroll ? (
                            <Badge colorScheme="green">Payroll Generated</Badge>
                          ) : (
                            <Badge colorScheme="orange">Pending</Badge>
                          )}
                        </Td>
                        <Td>
                          <Tooltip
                            label={
                              !hasTimesheets
                                ? "No timesheet data available for this period"
                                : ""
                            }
                          >
                            <Button
                              size="sm"
                              colorScheme="green"
                              onClick={() => handleGeneratePayroll(employee)}
                              isLoading={
                                isProcessing && selectedEmployee?.id === employee.id
                              }
                              leftIcon={<FaCalculator />}
                              isDisabled={hasPayroll || !hasTimesheets}
                            >
                              {hasPayroll ? "Generated" : "Generate"}
                            </Button>
                          </Tooltip>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>

          {/* Payroll Period Tab */}
          <TabPanel p={0} pt={4}>
            <Box bg="white" p={6} borderRadius="md" shadow="sm">
              <Heading size="md" mb={4}>
                Payroll Period Settings
              </Heading>

              <SimpleGrid columns={2} spacing={6} mb={6}>
                <FormControl>
                  <FormLabel>Period Start</FormLabel>
                  <Input
                    type="date"
                    value={payrollPeriod.start}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setPayrollPeriod((prev) => ({
                        ...prev,
                        start: newStart,
                      }));
                    }}
                  />
                  <FormHelperText>Start of the payroll period</FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel>Period End</FormLabel>
                  <Input
                    type="date"
                    value={payrollPeriod.end}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setPayrollPeriod((prev) => ({
                        ...prev,
                        end: newEnd,
                      }));
                    }}
                  />
                  <FormHelperText>End of the payroll period</FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel>Payment Date</FormLabel>
                  <Input
                    type="date"
                    value={payrollPeriod.payDate}
                    onChange={(e) => {
                      const newPayDate = e.target.value;
                      setPayrollPeriod((prev) => ({
                        ...prev,
                        payDate: newPayDate,
                      }));
                    }}
                  />
                  <FormHelperText>
                    Date when employees will be paid
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Payment Cycle</FormLabel>
                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                    {settings?.default_payment_cycle || "Not set"}
                    {settings?.pay_day &&
                      settings.default_payment_cycle === "monthly" &&
                      ` (Day ${settings.pay_day})`}
                  </Text>
                  <FormHelperText>
                    {settings
                      ? "Based on payroll settings"
                      : "Using default period calculation"}
                  </FormHelperText>
                </FormControl>
              </SimpleGrid>

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontSize="m" fontWeight="bold">
                    Payroll Period Summary
                  </Text>
                  <Text fontSize="s">
                    Period: {formatDateLong(payrollPeriod.start)} to{" "}
                    {formatDateLong(payrollPeriod.end)} (
                    {getDaysDifference(payrollPeriod.start, payrollPeriod.end)}{" "}
                    days)
                  </Text>
                  <Text fontSize="s">
                    Payment Date: {formatDateLong(payrollPeriod.payDate)}
                  </Text>
                </Box>
              </Alert>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="xl">
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
                  onChange={(e) => {
                    setSettings((prev) => {
                      if (prev) {
                        return {
                          ...prev,
                          default_payment_cycle: e.target.value as
                            | "weekly"
                            | "bi-weekly"
                            | "monthly",
                        };
                      } else {
                        return {
                          ...createDefaultPayrollSettings(),
                          default_payment_cycle: e.target.value as
                            | "weekly"
                            | "bi-weekly"
                            | "monthly",
                        };
                      }
                    });
                  }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Pay Day</FormLabel>
                <NumberInput
                  value={settings?.pay_day || 15}
                  onChange={(valueString, valueNumber) => {
                    setSettings((prev) => {
                      if (prev) {
                        return {
                          ...prev,
                          pay_day: valueNumber,
                        };
                      } else {
                        return {
                          ...createDefaultPayrollSettings(),
                          pay_day: valueNumber,
                        };
                      }
                    });
                  }}
                  min={1}
                  max={31}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>
                  Day of the month when payroll is processed (for monthly
                  cycles)
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Tax Rate (%)</FormLabel>
                <NumberInput
                  value={(settings?.tax_rate || 0.2) * 100}
                  onChange={(valueString, valueNumber) => {
                    setSettings((prev) => {
                      if (prev) {
                        return {
                          ...prev,
                          tax_rate: valueNumber / 100,
                        };
                      } else {
                        return {
                          ...createDefaultPayrollSettings(),
                          tax_rate: valueNumber / 100,
                        };
                      }
                    });
                  }}
                  min={0}
                  max={50}
                  precision={1}
                  step={0.5}
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
                  onChange={(valueString, valueNumber) => {
                    setSettings((prev) => {
                      if (prev) {
                        return {
                          ...prev,
                          overtime_multiplier: valueNumber,
                        };
                      } else {
                        return {
                          ...createDefaultPayrollSettings(),
                          overtime_multiplier: valueNumber,
                        };
                      }
                    });
                  }}
                  min={1}
                  max={3}
                  precision={1}
                  step={0.1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Overtime Threshold (hours/week)</FormLabel>
                <NumberInput
                  value={settings?.overtime_threshold || 40}
                  onChange={(valueString, valueNumber) => {
                    setSettings((prev) => {
                      if (prev) {
                        return {
                          ...prev,
                          overtime_threshold: valueNumber,
                        };
                      } else {
                        return {
                          ...createDefaultPayrollSettings(),
                          overtime_threshold: valueNumber,
                        };
                      }
                    });
                  }}
                  min={20}
                  max={60}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Auto Process Payroll</FormLabel>
                <Switch
                  isChecked={settings?.auto_process || false}
                  onChange={(e) => {
                    setSettings((prev) => {
                      if (prev) {
                        return {
                          ...prev,
                          auto_process: e.target.checked,
                        };
                      } else {
                        return {
                          ...createDefaultPayrollSettings(),
                          auto_process: e.target.checked,
                        };
                      }
                    });
                  }}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Include Benefits</FormLabel>
                <Switch
                  isChecked={settings?.include_benefits || false}
                  onChange={(e) => {
                    setSettings((prev) => {
                      if (prev) {
                        return {
                          ...prev,
                          include_benefits: e.target.checked,
                        };
                      } else {
                        return {
                          ...createDefaultPayrollSettings(),
                          include_benefits: e.target.checked,
                        };
                      }
                    });
                  }}
                />
              </FormControl>

              {settings?.include_benefits && (
                <FormControl>
                  <FormLabel>Benefits Rate (%)</FormLabel>
                  <NumberInput
                    value={(settings?.benefits_rate || 0.05) * 100}
                    onChange={(valueString, valueNumber) => {
                      setSettings((prev) => {
                        if (prev) {
                          return {
                            ...prev,
                            benefits_rate: valueNumber / 100,
                          };
                        } else {
                          return {
                            ...createDefaultPayrollSettings(),
                            benefits_rate: valueNumber / 100,
                          };
                        }
                      });
                    }}
                    min={0}
                    max={20}
                    precision={1}
                    step={0.5}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              mr={3}
              onClick={onSettingsClose}
              colorScheme="gray"
            >
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={() => {
                if (settings) {
                  handleUpdateSettings(settings);
                }
              }}
            >
              Save Settings
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Generate All Confirmation Dialog */}
      <AlertDialog
        isOpen={isGenerateAllOpen}
        leastDestructiveRef={cancelRef}
        onClose={onGenerateAllClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Generate Payroll for All Employees
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={3}>
                This will generate payroll for{" "}
                <strong>{stats.employeesWithoutPayroll} employees</strong> who
                don't have payroll records for the current period.
              </Text>
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Please ensure all employees have timesheet data for the period{" "}
                  {formatDate(payrollPeriod.start)} to{" "}
                  {formatDate(payrollPeriod.end)} before proceeding.
                </Text>
              </Alert>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onGenerateAllClose}>
                Cancel
              </Button>
              <Button
                colorScheme="green"
                onClick={handleGenerateAll}
                ml={3}
                isLoading={batchProcessing}
              >
                Generate All
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
