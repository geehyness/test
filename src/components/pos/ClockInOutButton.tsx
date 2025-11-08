// src/components/pos/ClockInOutButton.tsx
"use client";

import { usePOSStore } from "@/lib/usePOSStore";
import { clockIn, clockOut } from "@/lib/api";
// FIX: Import useToast
import { Button, useToast, Center, Spinner, Text, Box } from "@chakra-ui/react";
import React, { useState } from "react";
import { FaClock, FaSignOutAlt } from "react-icons/fa";

export default function ClockInOutButton() {
    const { currentStaff, currentTimesheetId, setCurrentTimesheetId } = usePOSStore();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // This useEffect is a bit of a hack to get around the hydration issue with Zustand
    // In a real application, you'd fetch this from a server or handle it differently
    // For our mock, we can set the initial state from localStorage or a mock API
    React.useEffect(() => {
        const storedId = sessionStorage.getItem('currentTimesheetId');
        if (storedId) {
            setCurrentTimesheetId(storedId);
        }
    }, [setCurrentTimesheetId]);

    const handleClockIn = async () => {
        if (!currentStaff) {
            toast({
                title: "Error",
                description: "No employee selected. Please log in as an employee.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);
        try {
            const newTimesheet = await clockIn(currentStaff.id, currentStaff.storeId!);
            setCurrentTimesheetId(newTimesheet.id);
            sessionStorage.setItem('currentTimesheetId', newTimesheet.id);
            toast({
                title: "Clocked In",
                description: `Successfully clocked in at ${new Date().toLocaleTimeString()}.`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Failed to clock in", error);
            toast({
                title: "Error",
                description: "Failed to clock in. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClockOut = async () => {
        if (!currentStaff || !currentTimesheetId) {
            toast({
                title: "Not Clocked In",
                description: "You are not currently clocked in.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);
        try {
            await clockOut(currentTimesheetId, currentStaff.storeId!);
            setCurrentTimesheetId(null);
            sessionStorage.removeItem('currentTimesheetId');
            toast({
                title: "Clocked Out",
                description: `Successfully clocked out at ${new Date().toLocaleTimeString()}.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Failed to clock out", error);
            toast({
                title: "Error",
                description: "Failed to clock out. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const isClockedIn = !!currentTimesheetId;

    return (
        <Box textAlign="center">
            {currentStaff ? (
                <>
                    <Text fontSize="lg" mb={2}>
                        {currentStaff.first_name}, you are currently:
                        <br />
                        <Text as="span" fontWeight="bold" color={isClockedIn ? "green.500" : "red.500"}>
                            {isClockedIn ? "Clocked In" : "Clocked Out"}
                        </Text>
                    </Text>
                    {/* FIX: Corrected button props */}
                    <Button
                        colorScheme={isClockedIn ? 'red' : 'green'}
                        leftIcon={isClockedIn ? <FaSignOutAlt /> : <FaClock />}
                        onClick={isClockedIn ? handleClockOut : handleClockIn}
                        isLoading={isLoading}
                        size="lg"
                        isDisabled={!currentStaff}
                    >
                        {isClockedIn ? "Clock Out" : "Clock In"}
                    </Button>
                </>
            ) : (
                <Text>Please log in to manage your timesheet.</Text>
            )}
        </Box>
    );
}