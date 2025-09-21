// src/app/pos/management/[entityName]/components/ShiftCalendar.tsx

"use client";

import React, { useMemo, useState } from "react";
import moment from 'moment';
import {
    Box,
    HStack,
    IconButton,
    Text,
    useToast,
    Badge,
    VStack,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { Employee, Shift } from "../ShiftManagement";
import dynamic from 'next/dynamic';
import { momentLocalizer, Views, View } from 'react-big-calendar';
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { logger } from "@/lib/logger";

// Define a new type for the calendar events
interface CalendarEvent extends Omit<Shift, 'start' | 'end'> {
    start: Date;
    end: Date;
    // The original shift ID is used for dragging and updating
    originalShiftId: string;
    employeeRole?: string;
}

// Dynamically import the Calendar component and wrap it
const Calendar = dynamic(
    async () => {
        const { Calendar: RbcCalendar } = await import('react-big-calendar');
        momentLocalizer(moment);
        const DndCalendar = withDragAndDrop<CalendarEvent, object>(RbcCalendar);
        return DndCalendar;
    },
    { ssr: false, loading: () => <Text>Loading calendar...</Text> }
);

interface ShiftCalendarProps {
    shifts: Shift[];
    employees: Employee[];
    onUpdateShift: (shiftId: string, updates: Partial<Shift>) => void;
    onDeleteShift: (shiftId: string) => void;
    onSelectShift: (shift: Shift) => void;
}

// Role-based color mapping
const roleColors: Record<string, string> = {
    'Cashier': '#3182CE', // Blue
    'Waiter': '#38A169', // Green
    'Server': '#38A169', // Green (alias for Waiter)
    'Kitchen Staff': '#E53E3E', // Red
    'Chef': '#E53E3E', // Red (alias for Kitchen Staff)
    'Manager': '#D69E2E', // Yellow
    'Admin': '#805AD5', // Purple
    'default': '#718096', // Gray
};

// Get color based on employee role
const getRoleColor = (role?: string): string => {
    if (!role) return roleColors.default;

    const normalizedRole = role.toLowerCase();
    for (const [key, color] of Object.entries(roleColors)) {
        if (normalizedRole.includes(key.toLowerCase())) {
            return color;
        }
    }
    return roleColors.default;
};

export default function ShiftCalendar({ shifts, employees, onUpdateShift, onDeleteShift, onSelectShift }: ShiftCalendarProps) {
    const toast = useToast();
    const [date, setDate] = useState<Date>(new Date());
    const [view, setView] = useState<View>(Views.WEEK);
    const [currentView, setCurrentView] = useState<View>(Views.WEEK);

    const events = useMemo(() => {
        logger.info("ShiftCalendar", "Reformatting shifts for calendar...");
        const calendarEvents: CalendarEvent[] = [];

        const now = moment();
        const futureDate = moment().add(1, 'year');

        shifts.forEach(shift => {
            const employee = employees.find(emp => emp.id === shift.employee_id);
            const employeeRole = employee?.role;
            const eventColor = getRoleColor(employeeRole);

            if (shift.recurs) {
                let current = moment(shift.start).day(shift.recurringDay as number);
                if (current.isBefore(now, 'day')) {
                    current = current.add(1, 'week').day(shift.recurringDay as number);
                }

                while (current.isBefore(futureDate)) {
                    const startDateTime = current.clone().set({
                        hour: moment(shift.start).hour(),
                        minute: moment(shift.start).minute(),
                    });
                    const endDateTime = current.clone().set({
                        hour: moment(shift.end).hour(),
                        minute: moment(shift.end).minute(),
                    });

                    calendarEvents.push({
                        ...shift,
                        id: `${shift.id}-${current.format('YYYYMMDD')}`,
                        originalShiftId: shift.id,
                        start: startDateTime.toDate(),
                        end: endDateTime.toDate(),
                        title: `${shift.employee_name} (Recurring)`,
                        color: eventColor,
                        employeeRole,
                    });
                    current.add(1, 'week');
                }
            } else {
                calendarEvents.push({
                    ...shift,
                    originalShiftId: shift.id,
                    start: new Date(shift.start),
                    end: new Date(shift.end),
                    color: eventColor,
                    employeeRole,
                });
            }
        });

        logger.info("ShiftCalendar", "Generated events:", calendarEvents);
        return calendarEvents;
    }, [shifts, employees]);

    const handleEventDrop = async (data: EventInteractionArgs<CalendarEvent>) => {
        const { event, start, end } = data;
        if (!event.originalShiftId) {
            toast({
                title: "Error",
                description: "Cannot update a shift without a valid ID.",
                status: "error",
                duration: 4000,
                isClosable: true,
            });
            return;
        }

        const updates = {
            start: start,
            end: end,
            employee_id: event.employee_id,
        };

        await onUpdateShift(event.originalShiftId, updates);
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        const originalShift = shifts.find(s => s.id === event.originalShiftId);
        if (originalShift) {
            const clickedShift: Shift = {
                ...originalShift,
                start: event.start,
                end: event.end,
            };
            onSelectShift(clickedShift);
        }
    };

    // Simplified event style getter - only handles background color
    const eventStyleGetter = (event: CalendarEvent) => {
        return {
            style: {
                backgroundColor: event.color || roleColors.default,
                borderRadius: '4px',
                opacity: 1,
                fontWeight: 'bold',
                border: 'none',
            },
        };
    };

    // Custom event component with rotated text
    const CustomEvent = ({ event }: { event: CalendarEvent }) => {
        const isMonthView = currentView === Views.MONTH;

        return (
            <Box
                p={1}
                height="100%"
                bg={event.color}
                borderRadius="md"
                _hover={{ bg: `${event.color}CC` }}
                overflow="hidden"
                display="flex"
                alignItems="center"
                justifyContent="center"
            // Remove any width constraints here - let the library handle it
            >
                <VStack
                    spacing={0}
                    align="center"
                    justify="center"
                    width="100%"
                    height="100%"
                    transform={isMonthView ? 'none' : 'rotate(-90deg)'}
                    transformOrigin="center"
                >
                    <Text
                        fontSize="m"
                        fontWeight="bold"
                        color="#333"
                        textAlign="center"
                        noOfLines={1}
                        title={event.employee_name}
                    >
                        {event.employee_name}
                    </Text>
                    {!isMonthView && (
                        <Text fontSize="s" color="#333" textAlign="center" noOfLines={1}>
                            {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                        </Text>
                    )}
                    {event.employeeRole && !isMonthView && (
                        <Badge
                            fontSize="2xs"
                            colorScheme="gray"
                            variant="solid"
                            opacity={0.8}
                            mt={0.5}
                            color="#333"
                            bg="rgba(255, 255, 255, 0.7)"
                        >
                            {event.employeeRole}
                        </Badge>
                    )}
                    {event.recurs && !isMonthView && (
                        <Badge
                            fontSize="2xs"
                            colorScheme="green"
                            variant="solid"
                            opacity={0.8}
                            mt={0.5}
                            color="#333"
                            bg="rgba(255, 255, 255, 0.7)"
                        >
                            Recurring
                        </Badge>
                    )}
                </VStack>
            </Box>
        );
    };

    const handleViewChange = (newView: View) => {
        setCurrentView(newView);
        setView(newView);
    };

    return (
        <Box height="700px">
            <Box
                borderWidth="1px"
                borderRadius="md"
                p={4}
                bg="white"
                height="100%"
                overflowY="auto"
                sx={{
                    // Target the calendar's toolbar and headers to make them sticky
                    '.rbc-toolbar': {
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        bg: 'white',
                        borderBottom: '1px solid',
                        borderColor: 'gray.200',
                    },
                    '.rbc-time-header': {
                        position: 'sticky',
                        top: '56px',
                        zIndex: 9,
                        bg: 'white',
                    },
                    // Make resize handles more visible
                    '.rbc-addons-dnd-resize-ns-anchor': {
                        height: '8px',
                        '&:nth-of-type(1)': {
                            top: '-4px',
                        },
                        '&:nth-last-of-type(1)': {
                            bottom: '-4px',
                        },
                    },
                    '.rbc-addons-dnd-resize-ew-anchor': {
                        width: '8px',
                        '&:nth-of-type(1)': {
                            left: '-4px',
                        },
                        '&:nth-last-of-type(1)': {
                            right: '-4px',
                        },
                    },
                    // Ensure events are properly positioned
                    '.rbc-event': {
                        overflow: 'hidden !important',
                    },
                }}
            >
                <Calendar
                    localizer={momentLocalizer(moment)}
                    events={events}
                    date={date}
                    view={view}
                    onNavigate={newDate => setDate(newDate)}
                    onView={handleViewChange}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    selectable
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventDrop}
                    onSelectEvent={handleSelectEvent}
                    resizable
                    step={15}
                    timeslots={4}
                    showMultiDayTimes
                    dragabbleAccessor={() => true}
                    eventPropGetter={eventStyleGetter}
                    components={{
                        event: CustomEvent,
                    }}
                    dayLayoutAlgorithm={currentView === Views.MONTH ? 'overlap' : 'overlap'}
                />
            </Box>

            {/* Legend for role colors */}
            <Box mt={4} p={3} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" mb={2} fontSize="sm">Role Legend:</Text>
                <HStack spacing={3} flexWrap="wrap">
                    {Object.entries(roleColors).map(([role, color]) => (
                        <HStack key={role} spacing={1}>
                            <Box w={3} h={3} bg={color} borderRadius="sm" />
                            <Text fontSize="xs">{role}</Text>
                        </HStack>
                    ))}
                </HStack>
            </Box>
        </Box>
    );
}