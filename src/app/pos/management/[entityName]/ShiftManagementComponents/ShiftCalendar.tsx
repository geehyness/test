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

export default function ShiftCalendar({ shifts, onUpdateShift, onSelectShift }: ShiftCalendarProps) {
    const toast = useToast();
    const [date, setDate] = useState<Date>(new Date());
    const [view, setView] = useState<View>(Views.WEEK);

    const events = useMemo(() => {
        logger.info("ShiftCalendar", "Reformatting shifts for calendar...");
        const calendarEvents: CalendarEvent[] = [];

        const now = moment();
        const futureDate = moment().add(1, 'year');

        shifts.forEach(shift => {
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
                    });
                    current.add(1, 'week');
                }
            } else {
                calendarEvents.push({
                    ...shift,
                    originalShiftId: shift.id,
                });
            }
        });

        logger.info("ShiftCalendar", "Generated events:", calendarEvents);
        return calendarEvents;
    }, [shifts]);

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
                        bg: 'white', // Ensure it has a background to cover scrolling content
                        borderBottom: '1px solid',
                        borderColor: 'gray.200',
                    },
                    '.rbc-time-header': {
                        position: 'sticky',
                        top: '56px', // Adjust this value to be below the toolbar
                        zIndex: 9,
                        bg: 'white',
                    },
                }}
            >
                <Calendar
                    localizer={momentLocalizer(moment)}
                    events={events}
                    date={date}
                    view={view}
                    onNavigate={newDate => setDate(newDate)}
                    onView={newView => setView(newView)}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    selectable
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventDrop}
                    onSelectEvent={handleSelectEvent}
                    resizable
                    dragabbleAccessor={() => true}
                    components={{
                        event: ({ event }: { event: CalendarEvent }) => (
                            <Box p={1} position="relative" height="100%" bg={event.color} borderRadius="md" _hover={{ bg: `${event.color}A0` }}>
                                <Text isTruncated fontSize="xs" fontWeight="bold">
                                    {event.title}
                                </Text>
                                <Text isTruncated fontSize="xs">
                                    {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                                </Text>
                            </Box>
                        ),
                    }}
                />
            </Box>
        </Box>
    );
}