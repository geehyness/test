// src/app/pos/kiosk/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Image,
    Divider,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    List,
    ListItem,
    Card,
    CardBody,
    SimpleGrid,
    Stat,
    StatHelpText,
    StatLabel,
    StatNumber,
} from "@chakra-ui/react";
import { FaUser, FaSearch, FaCamera, FaClock, FaSignInAlt, FaSignOutAlt, FaCalendar, FaInfoCircle, FaCheckCircle, FaCalendarDay, FaHistory, FaMoneyBillWave } from "react-icons/fa";
import { Shift, usePOSStore } from "@/lib/usePOSStore";
import { getEmployees, getTimesheets, clockIn, clockOut, getEmployeeSchedule, getPayrollInfo, getShifts } from "@/lib/api";
import { Employee, TimesheetEntry, ScheduleEntry, Payroll } from "@/lib/config/entities";

const ClockInOutPage: React.FC = () => {
    const router = useRouter();
    const { currentStaff, kioskUserId, _hasHydrated } = usePOSStore();
    const toast = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
    const [employeeSchedule, setEmployeeSchedule] = useState<ScheduleEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [clockActionCompleted, setClockActionCompleted] = useState(false);

    // Add new state for payroll information
    const [payrollInfo, setPayrollInfo] = useState<Payroll | null>(null);
    const [showEmployeeDashboard, setShowEmployeeDashboard] = useState(false);

    const isKioskUser = useMemo(() => {
        return _hasHydrated && currentStaff?.id === kioskUserId;
    }, [_hasHydrated, currentStaff, kioskUserId]);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedEmployees, fetchedTimesheets] = await Promise.all([
                getEmployees(),
                getTimesheets(),
            ]);
            setEmployees(fetchedEmployees);
            setTimesheetEntries(fetchedTimesheets);
        } catch (error) {
            console.error("Failed to fetch data for kiosk", error);
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

    const fetchEmployeeSchedule = useCallback(async (employeeId: string) => {
        try {
            const shifts = await getShifts();
            // Filter shifts for this employee and active ones
            const employeeShifts = shifts.filter(shift =>
                shift.employee_id === employeeId && shift.active !== false
            );
            setEmployeeSchedule(employeeShifts);
        } catch (error) {
            console.error("Failed to fetch employee schedule", error);
        }
    }, []);

    useEffect(() => {
        if (_hasHydrated) {
            fetchAllData();
        }
    }, [_hasHydrated, fetchAllData]);

    const filteredEmployees = useMemo(() => {
        if (!searchQuery) return employees;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return employees.filter(
            (emp) =>
                emp.first_name.toLowerCase().includes(lowerCaseQuery) ||
                emp.last_name?.toLowerCase().includes(lowerCaseQuery) ||
                `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(lowerCaseQuery)
        );
    }, [employees, searchQuery]);

    const getEmployeeStatus = (employeeId: string): TimesheetEntry | undefined => {
        return timesheetEntries.find(
            (ts) => ts.employee_id === employeeId && !ts.clock_out
        );
    };

    const calculateCumulativeHours = (employeeId: string): string => {
        const employeeEntries = timesheetEntries.filter(ts => ts.employee_id === employeeId);

        let totalMinutes = 0;

        employeeEntries.forEach(entry => {
            if (entry.clock_in && entry.clock_out) {
                const clockInTime = new Date(entry.clock_in).getTime();
                const clockOutTime = new Date(entry.clock_out).getTime();
                const durationMs = clockOutTime - clockInTime;
                totalMinutes += Math.floor(durationMs / (1000 * 60));
            }
        });

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours}h ${minutes}m`;
    };

    const getCurrentShiftDuration = (employeeId: string): string | null => {
        const currentEntry = getEmployeeStatus(employeeId);
        if (!currentEntry || !currentEntry.clock_in) return null;

        const clockInTime = new Date(currentEntry.clock_in).getTime();
        const now = Date.now();
        const durationMs = now - clockInTime;
        const totalMinutes = Math.floor(durationMs / (1000 * 60));

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours}h ${minutes}m`;
    };

    const getUpcomingShifts = useCallback((employeeId: string): Shift[] => {
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        const upcomingShifts = employeeSchedule.filter(shift => {
            const shiftDate = new Date(shift.start);
            return shiftDate >= now &&
                shiftDate <= sevenDaysFromNow &&
                shift.employee_id === employeeId;
        });

        // Sort by date
        upcomingShifts.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        return upcomingShifts;
    }, [employeeSchedule]);

    const formatShiftDate = (dateString: string): string => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return "Tomorrow";
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        }
    };

    const formatShiftTime = (timeString: string): string => {
        // Extract time from ISO string if needed
        const time = timeString.includes('T') ? timeString.split('T')[1] : timeString;
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${period}`;
    };

    const openCamera = async (employeeId: string) => {
        const employee = employees.find(emp => emp.id === employeeId);
        setSelectedEmployeeId(employeeId);
        setSelectedEmployee(employee || null);
        setClockActionCompleted(false);
        setIsCameraOpen(true);
        setCapturedImage(null);
        setCameraError(null);

        // Fetch schedule when opening camera
        if (employeeId) {
            await fetchEmployeeSchedule(employeeId);
        }
    };

    const initializeCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            setCameraError("Unable to access camera. Please check permissions.");
            toast({
                title: "Camera Error",
                description: "Unable to access camera. Please check permissions.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            setIsCapturing(true);
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) {
                setIsCapturing(false);
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageDataUrl = canvas.toDataURL('image/png');
            setCapturedImage(imageDataUrl);

            // Stop the video stream
            const stream = video.srcObject as MediaStream;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            setIsCapturing(false);
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setCameraError(null);
        initializeCamera();
    };

    const closeCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }

        setIsCameraOpen(false);
        setCapturedImage(null);
        setSelectedEmployeeId(null);
        setSelectedEmployee(null);
        setCameraError(null);
        setClockActionCompleted(false);
    };

    // Modify the handleClockAction function to fetch additional data after clock action
    const handleClockAction = async () => {
        if (!selectedEmployeeId || !capturedImage) return;

        const currentEntry = getEmployeeStatus(selectedEmployeeId);
        setIsLoading(true);

        try {
            // In a real application, you would upload the image to your server here
            console.log("Photo captured for verification");

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
                await clockIn(selectedEmployeeId, currentStaff?.store_id || '');
                toast({
                    title: "Clocked In",
                    description: "You have been successfully clocked in.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            }

            setClockActionCompleted(true);
            await fetchAllData();

            // Fetch additional employee information after clock action
            await fetchEmployeeSchedule(selectedEmployeeId);
            await fetchPayrollInfo(selectedEmployeeId);

            // Show the employee dashboard
            setShowEmployeeDashboard(true);

        } catch (error) {
            console.error("Failed to perform clock action", error);
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

    const fetchPayrollInfo = async (employeeId: string) => {
        try {
            const payrollData = await getPayrollInfo(employeeId);
            if (payrollData) {
                setPayrollInfo({
                    ...payrollData,
                    total_wages_due: payrollData.gross_pay,
                    tax_deductions: payrollData.tax_deductions,
                    net_pay: payrollData.net_pay,
                    payment_cycle: payrollData.payment_cycle,
                    pay_period_start: payrollData.pay_period_start,
                    pay_period_end: payrollData.pay_period_end,
                    status: payrollData.status
                });
            }
        } catch (error) {
            console.error("Failed to fetch payroll info", error);
        }
    };

    // Also update the formatCurrency function to handle numbers:
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };


    if (!_hasHydrated) {
        return (
            <Center minH="100vh">
                <Spinner size="xl" />
            </Center>
        );
    }

    const isClockedIn = selectedEmployeeId ? !!getEmployeeStatus(selectedEmployeeId) : false;
    const currentShiftDuration = selectedEmployeeId ? getCurrentShiftDuration(selectedEmployeeId) : null;
    const upcomingShifts = selectedEmployeeId ? getUpcomingShifts(selectedEmployeeId) : [];

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
                    <InputLeftElement pointerEvents="none">
                        <FaSearch color="var(--medium-gray-text)" />
                    </InputLeftElement>
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

                {isLoading ? (
                    <Center py={8}>
                        <Spinner size="lg" />
                    </Center>
                ) : (
                    <VStack spacing={4} align="stretch">
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((employee) => (
                                <Box
                                    key={employee.id}
                                    p={4}
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    bg="white"
                                    shadow="sm"
                                    _hover={{ shadow: "md" }}
                                    transition="all 0.2s"
                                >
                                    <HStack spacing={4} align="center">
                                        <Box flex="1">
                                            <Flex align="center">
                                                <FaUser />
                                                <Text fontWeight="bold" fontSize="lg" ml={2}>
                                                    {employee.first_name} {employee.last_name}
                                                </Text>
                                            </Flex>
                                        </Box>
                                        <Button
                                            colorScheme="blue"
                                            onClick={() => openCamera(employee.id)}
                                            size="md"
                                            isLoading={isLoading}
                                        >
                                            Verify & Clock
                                        </Button>
                                    </HStack>
                                </Box>
                            ))
                        ) : (
                            <Text textAlign="center" mt={4} color="var(--medium-gray-text)">
                                No employees found. Try a different search term.
                            </Text>
                        )}
                    </VStack>
                )}
            </VStack>

            {/* Camera Modal */}
            <Modal isOpen={isCameraOpen} onClose={closeCamera} size="xl" closeOnOverlayClick={!clockActionCompleted}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {clockActionCompleted ? "Success!" : "Verify Your Identity"}
                    </ModalHeader>
                    <ModalCloseButton isDisabled={clockActionCompleted} />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            {/* Success Message after clock action */}
                            {clockActionCompleted && (
                                <Alert status="success" borderRadius="md" mb={4}>
                                    <AlertIcon />
                                    <Box>
                                        <AlertTitle>
                                            Successfully {isClockedIn ? "Clocked In" : "Clocked Out"}!
                                        </AlertTitle>
                                        <AlertDescription>
                                            {isClockedIn ? "You are now clocked in. Have a great shift!" : "You have been clocked out. See you next time!"}
                                        </AlertDescription>
                                    </Box>
                                </Alert>
                            )}

                            {/* Employee Dashboard - Show after successful clock action */}
                            {clockActionCompleted && showEmployeeDashboard && selectedEmployee && (
                                <>
                                    <Box bg="blue.50" p={4} borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                                        <VStack spacing={2} align="stretch">
                                            <Text fontWeight="bold" fontSize="lg" color="blue.800">
                                                {selectedEmployee.first_name} {selectedEmployee.last_name}
                                            </Text>
                                            <HStack spacing={4}>
                                                <Tag colorScheme={isClockedIn ? "green" : "gray"} size="sm">
                                                    {isClockedIn ? "Clocked In" : "Clocked Out"}
                                                </Tag>
                                                {selectedEmployee.position && (
                                                    <Tag colorScheme="blue" size="sm">
                                                        {selectedEmployee.position}
                                                    </Tag>
                                                )}
                                            </HStack>
                                        </VStack>
                                    </Box>

                                    {/* Employee Stats - Only show after verification */}
                                    <SimpleGrid columns={2} spacing={4}>
                                        <Card bg="green.50">
                                            <CardBody>
                                                <Stat>
                                                    <StatLabel>Total Hours This Period</StatLabel>
                                                    <StatNumber>{calculateCumulativeHours(selectedEmployeeId)}</StatNumber>
                                                    <StatHelpText>
                                                        <FaHistory style={{ display: 'inline', marginRight: '4px' }} />
                                                        Cumulative
                                                    </StatHelpText>
                                                </Stat>
                                            </CardBody>
                                        </Card>

                                        {isClockedIn && currentShiftDuration && (
                                            <Card bg="blue.50">
                                                <CardBody>
                                                    <Stat>
                                                        <StatLabel>Current Shift</StatLabel>
                                                        <StatNumber>{currentShiftDuration}</StatNumber>
                                                        <StatHelpText>
                                                            <FaClock style={{ display: 'inline', marginRight: '4px' }} />
                                                            Ongoing
                                                        </StatHelpText>
                                                    </Stat>
                                                </CardBody>
                                            </Card>
                                        )}

                                        {payrollInfo && (
                                            <Card bg="purple.50" gridColumn="span 2">
                                                <CardBody>
                                                    <Stat>
                                                        <StatLabel>Next Paycheck</StatLabel>
                                                        <StatNumber>{formatCurrency(payrollInfo.net_pay)}</StatNumber>
                                                        <StatHelpText>
                                                            <FaMoneyBillWave style={{ display: 'inline', marginRight: '4px' }} />
                                                            {payrollInfo.payment_cycle} cycle
                                                        </StatHelpText>
                                                    </Stat>
                                                </CardBody>
                                            </Card>
                                        )}
                                    </SimpleGrid>

                                    {/* Upcoming Shifts - Only show after verification */}
                                    {upcomingShifts.length > 0 && (
                                        <Box bg="purple.50" p={4} borderRadius="md" borderLeft="4px solid" borderColor="purple.400">
                                            <HStack spacing={2} mb={3}>
                                                <FaCalendarDay color="var(--primary-purple)" />
                                                <Text fontSize="md" fontWeight="bold" color="purple.800">
                                                    Upcoming Shifts (Next 7 Days)
                                                </Text>
                                            </HStack>
                                            <List spacing={2}>
                                                {upcomingShifts.map((shift, index) => (
                                                    <ListItem key={index} fontSize="sm">
                                                        <HStack spacing={3} align="baseline">
                                                            <Text fontWeight="medium" color="purple.700" minW="80px">
                                                                {formatShiftDate(shift.date)}:
                                                            </Text>
                                                            <Text color="purple.600">
                                                                {formatShiftTime(shift.start_time)} - {formatShiftTime(shift.end_time)}
                                                            </Text>
                                                        </HStack>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}

                                    <Divider />
                                </>
                            )}

                            {/* Employee Details - Show minimal info before verification */}
                            {selectedEmployee && !clockActionCompleted && (
                                <>
                                    <Box bg="blue.50" p={4} borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                                        <VStack spacing={2} align="stretch">
                                            <Text fontWeight="bold" fontSize="lg" color="blue.800">
                                                {selectedEmployee.first_name} {selectedEmployee.last_name}
                                            </Text>
                                            <HStack spacing={4}>
                                                <Tag colorScheme={isClockedIn ? "green" : "gray"} size="sm">
                                                    {isClockedIn ? "Clocked In" : "Clocked Out"}
                                                </Tag>
                                                {selectedEmployee.position && (
                                                    <Tag colorScheme="blue" size="sm">
                                                        {selectedEmployee.position}
                                                    </Tag>
                                                )}
                                            </HStack>
                                        </VStack>
                                    </Box>
                                    <Divider />
                                </>
                            )}

                            {/* Camera Section - Only show if not completed and no photo yet */}
                            {!clockActionCompleted && !capturedImage && (
                                <>
                                    <Text textAlign="center">
                                        Please take a photo to verify you are at work before clocking {isClockedIn ? "out" : "in"}.
                                    </Text>

                                    {cameraError ? (
                                        <Text color="red.500" textAlign="center">
                                            {cameraError}
                                        </Text>
                                    ) : (
                                        <>
                                            <Box
                                                position="relative"
                                                width="100%"
                                                height="300px"
                                                bg="black"
                                                borderRadius="md"
                                                overflow="hidden"
                                            >
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onLoadedMetadata={initializeCamera}
                                                />
                                            </Box>
                                            <Button
                                                leftIcon={<FaCamera />}
                                                colorScheme="blue"
                                                onClick={capturePhoto}
                                                isLoading={isCapturing}
                                            >
                                                Take Photo
                                            </Button>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Clock Action Buttons - Show after photo capture but before completion */}
                            {capturedImage && !clockActionCompleted && (
                                <>
                                    <Image
                                        src={capturedImage}
                                        alt="Captured verification photo"
                                        borderRadius="md"
                                        maxH="200px"
                                        mx="auto"
                                    />
                                    <Text textAlign="center" fontSize="sm" color="gray.600" mb={2}>
                                        Photo verified. Ready to {isClockedIn ? "clock out" : "clock in"}.
                                    </Text>
                                    <HStack spacing={3} justify="center">
                                        <Button onClick={retakePhoto} variant="outline" size="lg">
                                            Retake Photo
                                        </Button>
                                        <Button
                                            colorScheme={isClockedIn ? "red" : "green"}
                                            onClick={handleClockAction}
                                            isLoading={isLoading}
                                            leftIcon={isClockedIn ? <FaSignOutAlt /> : <FaSignInAlt />}
                                            size="lg"
                                        >
                                            {isClockedIn ? "Clock Out" : "Clock In"}
                                        </Button>
                                    </HStack>
                                </>
                            )}

                            {/* Additional Info after clock action */}
                            {clockActionCompleted && (
                                <Box mt={4}>
                                    <Text fontSize="sm" color="gray.600" textAlign="center">
                                        <FaInfoCircle style={{ display: 'inline', marginRight: '4px' }} />
                                        You can close this window or it will automatically close in a moment.
                                    </Text>
                                </Box>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        {clockActionCompleted ? (
                            <Button colorScheme="blue" onClick={closeCamera}>
                                Done
                            </Button>
                        ) : (
                            <Button variant="ghost" onClick={closeCamera}>
                                Cancel
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Hidden canvas for capturing photos */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Box>
    );
};

export default ClockInOutPage;