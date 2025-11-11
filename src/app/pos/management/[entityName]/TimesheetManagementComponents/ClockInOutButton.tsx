"use client";

import React from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { clockIn, clockOut } from '@/lib/api';
// FIX: Corrected import path
import { usePOSStore } from '@/lib/usePOSStore';
import { logger } from '@/lib/logger';
import moment from 'moment';
import { TimesheetEntry } from '@/lib/config/entities';

interface ClockInOutButtonProps {
    onRefreshData: () => void;
    currentTimesheetEntry: TimesheetEntry | null;
}

const ClockInOutButton: React.FC<ClockInOutButtonProps> = ({ onRefreshData, currentTimesheetEntry }) => {
    const toast = useToast();
    const { currentStaff } = usePOSStore();

    const isClockedIn = !!currentTimesheetEntry;

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

        try {
            await clockIn(currentStaff.id, currentStaff.store_id || '');
            toast({
                title: "Clocked In",
                description: `Successfully clocked in at ${moment().format('LT')}`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            onRefreshData();
        } catch (error) {
            logger.error("Failed to clock in", "error");
            toast({
                title: "Error",
                description: "Failed to clock in. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleClockOut = async () => {
        if (!currentTimesheetEntry) return;

        try {
            await clockOut(currentTimesheetEntry.id);
            toast({
                title: "Clocked Out",
                description: `Successfully clocked out at ${moment().format('LT')}`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            onRefreshData();
        } catch (error) {
            logger.error("Failed to clock out", "error");
            toast({
                title: "Error",
                description: "Failed to clock out. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Button
            colorScheme={isClockedIn ? 'red' : 'green'}
            onClick={isClockedIn ? handleClockOut : handleClockIn}
            isDisabled={!currentStaff}
        >
            {isClockedIn ? 'Clock Out' : 'Clock In'}
        </Button>
    );
};

export default ClockInOutButton;