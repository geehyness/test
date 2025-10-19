// src/app/pos/management/[entityName]/components/ShiftCalendar.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import {
  Box,
  HStack,
  IconButton,
  Text,
  useToast,
  Badge,
  VStack,
  Button,
  Flex,
} from "@chakra-ui/react";
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Employee, Shift } from "../ShiftManagement";
import dynamic from "next/dynamic";
import { momentLocalizer, Views, View } from "react-big-calendar";
import withDragAndDrop, {
  EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { FaCalendarCheck, FaUndo } from "react-icons/fa";
import { generateRoleColors, getRoleColor } from "./roleColors";

// Update the CalendarEvent interface
interface CalendarEvent extends Omit<Shift, "start" | "end"> {
  start: Date;
  end: Date;
  originalShiftId: string;
  employeeRole?: string;
  isDraft?: boolean;
}

// Dynamically import the Calendar component and wrap it
const Calendar = dynamic(
  async () => {
    const { Calendar: RbcCalendar } = await import("react-big-calendar");
    momentLocalizer(moment);
    const DndCalendar = withDragAndDrop<CalendarEvent, object>(RbcCalendar);
    return DndCalendar;
  },
  { ssr: false, loading: () => <Text>Loading calendar...</Text> }
);

interface ShiftCalendarProps {
  shifts: Shift[];
  employees: Employee[];
  onUpdateShift: (
    shiftId: string,
    updates: Partial<Shift>
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteShift: (
    shiftId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onSelectShift: (shift: Shift) => void;
  scheduleMode: "published" | "draft";
  draftShifts: any[];
  onPublishSchedule: () => void;
  onResetToPublished: () => void;
  hasUnsavedChanges: boolean;
}

// Legend for role colors
const RoleLegend = ({ employees }: { employees: Employee[] }) => {
  const dynamicRoleColors = generateRoleColors(employees);
  const uniqueRoles = Array.from(
    new Set(employees.map((emp) => emp.role).filter(Boolean))
  );

  return (
    <Box mt={4} p={3} bg="gray.50" borderRadius="md">
      <Text fontWeight="bold" mb={2} fontSize="sm">
        Role Legend:
      </Text>
      <HStack spacing={3} flexWrap="wrap">
        {uniqueRoles.map((role) => (
          <HStack key={role} spacing={1}>
            <Box w={3} h={3} bg={dynamicRoleColors[role]} borderRadius="sm" />
            <Text fontSize="xs">{role}</Text>
          </HStack>
        ))}
        {uniqueRoles.length === 0 && (
          <Text fontSize="xs" color="gray.500">
            No roles assigned
          </Text>
        )}
      </HStack>
    </Box>
  );
};

// Custom Toolbar Component with Navigation Controls
const CustomToolbar = ({
  onNavigate,
  label,
  onView,
  scheduleMode,
  draftShifts,
  onPublishSchedule,
  onResetToPublished,
  hasUnsavedChanges,
}: {
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  label: string;
  onView: (view: View) => void;
  scheduleMode: "published" | "draft";
  draftShifts: any[];
  onPublishSchedule: () => void;
  onResetToPublished: () => void;
  hasUnsavedChanges: boolean;
}) => {
  return (
    <Flex
      justify="space-between"
      align="center"
      mb={2}
      p={2}
      bg="gray.50"
      borderRadius="md"
      flexWrap="wrap"
      gap={2}
      height="60px"
    >
      <HStack spacing={1}>
        <Button
          size="xs"
          onClick={() => onNavigate("TODAY")}
          colorScheme="blue"
          variant="outline"
        >
          Today
        </Button>
        <HStack spacing={0}>
          <IconButton
            aria-label="Previous"
            icon={<ChevronLeftIcon />}
            size="xs"
            onClick={() => onNavigate("PREV")}
          />
          <IconButton
            aria-label="Next"
            icon={<ChevronRightIcon />}
            size="xs"
            onClick={() => onNavigate("NEXT")}
          />
        </HStack>
      </HStack>

      <Text fontWeight="bold" fontSize="md">
        {label}
      </Text>

      <HStack spacing={1}>
        {/* View buttons */}
        <Button
          size="xs"
          onClick={() => onView(Views.MONTH)}
          colorScheme="blue"
          variant="outline"
        >
          Month
        </Button>
        <Button
          size="xs"
          onClick={() => onView(Views.WEEK)}
          colorScheme="blue"
          variant="outline"
        >
          Week
        </Button>
        <Button
          size="xs"
          onClick={() => onView(Views.DAY)}
          colorScheme="blue"
          variant="outline"
        >
          Day
        </Button>

        {/* Publish buttons - only show in draft mode */}
        {scheduleMode === "draft" && (
          <>
            <Button
              leftIcon={<FaCalendarCheck />}
              onClick={onPublishSchedule}
              colorScheme="green"
              size="xs"
              isDisabled={draftShifts.length === 0}
            >
              Publish ({draftShifts.length})
            </Button>
            <Button
              leftIcon={<FaUndo />}
              onClick={onResetToPublished}
              variant="outline"
              size="xs"
              isDisabled={!hasUnsavedChanges}
            >
              Reset
            </Button>
          </>
        )}
      </HStack>
    </Flex>
  );
};

export default function ShiftCalendar({
  shifts,
  employees,
  onUpdateShift,
  onDeleteShift,
  onSelectShift,
  scheduleMode,
  draftShifts,
  onPublishSchedule,
  onResetToPublished,
  hasUnsavedChanges,
}: ShiftCalendarProps) {
  const toast = useToast();
  const [date, setDate] = useState<Date>(moment().startOf("month").toDate());
  const [view, setView] = useState<View>(Views.MONTH);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);

  // In ShiftCalendar.tsx - Update the event generation for recurrence
  const events = useMemo(() => {
    console.log("ShiftCalendar: Reformatting shifts for calendar...");
    const calendarEvents: CalendarEvent[] = [];

    // Generate dynamic role colors based on current employees
    const dynamicRoleColors = generateRoleColors(employees);

    const now = moment();
    const futureDate = moment().add(1, "year");

    shifts.forEach((shift) => {
      const employee = employees.find((emp) => emp.id === shift.employee_id);
      const employeeRole = employee?.role;
      const eventColor = getRoleColor(dynamicRoleColors, employeeRole);

      if (shift.recurring && shift.active) {
        // Handle recurring shifts with proper end date
        const recurrenceEnd = shift.recurrence_end_date
          ? moment(shift.recurrence_end_date)
          : futureDate;

        let current = moment(shift.start);

        // Generate occurrences until recurrence end date or future date
        while (
          current.isBefore(recurrenceEnd) &&
          current.isBefore(futureDate)
        ) {
          const startDateTime = current.clone().set({
            hour: moment(shift.start).hour(),
            minute: moment(shift.start).minute(),
          });
          const endDateTime = current.clone().set({
            hour: moment(shift.end).hour(),
            minute: moment(shift.end).minute(),
          });

          // Only add if this occurrence is before the recurrence end date
          if (startDateTime.isBefore(recurrenceEnd)) {
            calendarEvents.push({
              ...shift,
              id: `${shift.id}-${current.format("YYYYMMDD")}`,
              originalShiftId: shift.id,
              start: startDateTime.toDate(),
              end: endDateTime.toDate(),
              title: `${shift.employee_name} (Recurring)`,
              color: eventColor,
              employeeRole,
            });
          }

          current.add(1, "week");
        }
      } else if (shift.active) {
        // Non-recurring shifts
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

    console.log("ShiftCalendar: Generated events:", calendarEvents);
    return calendarEvents;
  }, [shifts, employees]);

  // Debug current view and sample event times to verify positioning
  useEffect(() => {
    console.log("ShiftCalendar view/events state", {
      currentView,
      eventsCount: events.length,
    });
    if (events.length > 0) {
      const e0 = events[0];
      console.log("ShiftCalendar first event sample", {
        startISO: moment(e0.start).toISOString(),
        endISO: moment(e0.end).toISOString(),
        startFmt: moment(e0.start).format("YYYY-MM-DD HH:mm"),
        endFmt: moment(e0.end).format("YYYY-MM-DD HH:mm"),
        employee: e0.employee_name,
      });
    }
  }, [events, currentView]);

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

    const updates: Partial<Shift> = {
      start: start instanceof Date ? start : new Date(start as string),
      end: end instanceof Date ? end : new Date(end as string),
      employee_id: event.employee_id,
    };

    await onUpdateShift(event.originalShiftId, updates);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const originalShift = shifts.find((s) => s.id === event.originalShiftId);
    if (originalShift) {
      const clickedShift: Shift = {
        ...originalShift,
        start: event.start,
        end: event.end,
      };
      onSelectShift(clickedShift);
    }
  };

  // Navigation handlers
  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    let newDate = moment(date);

    switch (action) {
      case "PREV":
        if (currentView === Views.MONTH) {
          newDate = newDate.subtract(1, "month");
        } else if (currentView === Views.WEEK) {
          newDate = newDate.subtract(1, "week");
        } else {
          newDate = newDate.subtract(1, "day");
        }
        break;
      case "NEXT":
        if (currentView === Views.MONTH) {
          newDate = newDate.add(1, "month");
        } else if (currentView === Views.WEEK) {
          newDate = newDate.add(1, "week");
        } else {
          newDate = newDate.add(1, "day");
        }
        break;
      case "TODAY":
        newDate = moment();
        break;
    }

    setDate(newDate.toDate());
  };

  // Enhanced event style getter for proper week/day view positioning
  const eventStyleGetter = (event: CalendarEvent) => {
    const isMonthView = currentView === Views.MONTH;

    if (isMonthView) {
      return {
        style: {
          backgroundColor: event.color || "#718096",
          borderRadius: "4px",
          opacity: event.isDraft ? 0.7 : 1,
          fontWeight: "bold",
          border: event.isDraft
            ? "2px dashed #000"
            : "1px solid rgba(0,0,0,0.2)",
          borderColor: event.isDraft ? "#000" : "rgba(0,0,0,0.2)",
          height: "auto",
          fontSize: "12px",
        },
      };
    }

    // For week/day views, use the default calendar positioning
    return {
      style: {
        backgroundColor: event.color || "#718096",
        borderRadius: "4px",
        opacity: event.isDraft ? 0.7 : 1,
        fontWeight: "bold",
        border: event.isDraft ? "2px dashed #000" : "1px solid rgba(0,0,0,0.2)",
        borderColor: event.isDraft ? "#000" : "rgba(0,0,0,0.2)",
        fontSize: "12px",
      },
    };
  };

  // Custom Event component with swapped text orientation
  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const isMonthView = currentView === Views.MONTH;
    const isWeekView = currentView === Views.WEEK;
    const isDayView = currentView === Views.DAY;
    const isTimeBasedView = isWeekView || isDayView;
    const isDraft = event.isDraft;

    // Calculate event duration in hours for time-based views
    const durationHours =
      moment(event.end).diff(moment(event.start), "minutes") / 60;
    const isVeryShortEvent = durationHours < 1;
    const isShortEvent = durationHours < 2;
    const hasSpaceForDetails = durationHours >= 1.5;

    if (isMonthView) {
      // MONTH VIEW: Minimal - only employee name
      return (
        <Box
          width="100%"
          height="100%"
          bg={event.color}
          borderRadius="4px"
          _hover={{ bg: `${event.color}DD` }}
          border={isDraft ? "2px dashed" : "1px solid"}
          borderColor={isDraft ? "black" : "rgba(0,0,0,0.2)"}
          px={1}
          py={0.5}
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          <Text
            fontSize="11px"
            fontWeight="bold"
            color="#333"
            noOfLines={1}
            lineHeight="1.2"
            textAlign="center"
          >
            {event.employee_name || "Unknown"}
          </Text>
        </Box>
      );
    }

    // WEEK/DAY VIEW: Display like month view (rotated text)
    return (
      <Box
        p={0}
        height="100%"
        bg={event.color}
        borderRadius="4px"
        _hover={{ bg: `${event.color}CC` }}
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
        border={isDraft ? "2px dashed" : "1px solid"}
        borderColor={isDraft ? "black" : "rgba(0,0,0,0.2)"}
      >
        <VStack
          spacing={0}
          align="center"
          justify="center"
          width="100%"
          height="100%"
          transform="rotate(-90deg)"
          transformOrigin="center"
        >
          <Text
            fontSize="12px"
            fontWeight="bold"
            color="#333"
            textAlign="center"
            noOfLines={1}
            title={event.employee_name}
            lineHeight="1.2"
          >
            {event.employee_name || "Unknown"}
          </Text>

          {!isVeryShortEvent && (
            <Text
              fontSize="10px"
              color="#333"
              textAlign="center"
              noOfLines={1}
              lineHeight="1.1"
              opacity={0.9}
            >
              {moment(event.start).format("HH:mm")} -{" "}
              {moment(event.end).format("HH:mm")}
            </Text>
          )}

          {event.employeeRole && !isVeryShortEvent && (
            <Badge
              fontSize="9px"
              colorScheme="gray"
              variant="solid"
              opacity={0.8}
              mt={0.5}
              color="#333"
              bg="rgba(255, 255, 255, 0.7)"
              lineHeight="1"
              height="12px"
            >
              {event.employeeRole}
            </Badge>
          )}

          {event.recurring && !isVeryShortEvent && (
            <Badge
              fontSize="8px"
              colorScheme="green"
              variant="solid"
              opacity={0.9}
              mt={0.5}
              color="#333"
              bg="rgba(255, 255, 255, 0.7)"
              lineHeight="1"
              height="10px"
            >
              Recurring
            </Badge>
          )}

          {isDraft && !isVeryShortEvent && (
            <Badge
              fontSize="8px"
              colorScheme="orange"
              variant="solid"
              opacity={0.9}
              mt={0.5}
              lineHeight="1"
              height="10px"
            >
              Draft
            </Badge>
          )}
        </VStack>
      </Box>
    );
  };

  // Removed custom "View Day" link; use default "+X more" behavior

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
    setView(newView);
  };

  // Compute dynamic min/max times to avoid clamping in week/day views
  const { minTime, maxTime } = useMemo(() => {
    if (currentView === Views.MONTH) {
      return {
        minTime: moment(date)
          .set({ hour: 6, minute: 0, second: 0, millisecond: 0 })
          .toDate(),
        maxTime: moment(date)
          .set({ hour: 22, minute: 0, second: 0, millisecond: 0 })
          .toDate(),
      };
    }

    let viewEvents: CalendarEvent[] = [];
    if (currentView === Views.DAY) {
      viewEvents = events.filter((event) =>
        moment(event.start).isSame(date, "day")
      );
    } else if (currentView === Views.WEEK) {
      const weekStart = moment(date).startOf("week");
      const weekEnd = moment(date).endOf("week");
      viewEvents = events.filter((event) =>
        moment(event.start).isBetween(weekStart, weekEnd, undefined, "[]")
      );
    }

    if (viewEvents.length === 0) {
      // Fallback window when no events are in view
      return {
        minTime: moment(date)
          .set({ hour: 6, minute: 0, second: 0, millisecond: 0 })
          .toDate(),
        maxTime: moment(date)
          .set({ hour: 22, minute: 0, second: 0, millisecond: 0 })
          .toDate(),
      };
    }

    const earliest = viewEvents.reduce(
      (earliest, e) => (e.start < earliest ? e.start : earliest),
      viewEvents[0].start
    );
    const latest = viewEvents.reduce(
      (latest, e) => (e.end > latest ? e.end : latest),
      viewEvents[0].end
    );

    // Add a 1-hour buffer and clamp to the 00:00–23:59 range
    const minHour = Math.max(
      0,
      moment(earliest).startOf("hour").subtract(1, "hour").hour()
    );
    const maxHour = Math.min(
      23,
      moment(latest).endOf("hour").add(1, "hour").hour()
    );

    const computedMin = moment(date)
      .set({ hour: minHour, minute: 0, second: 0, millisecond: 0 })
      .toDate();
    // Use 59 minutes to reach end of the hour for better headroom
    const computedMax = moment(date)
      .set({ hour: maxHour, minute: 59, second: 0, millisecond: 0 })
      .toDate();

    // Ensure min < max; if equal, widen window to a reasonable span
    if (computedMin >= computedMax) {
      return {
        minTime: moment(date)
          .set({ hour: 6, minute: 0, second: 0, millisecond: 0 })
          .toDate(),
        maxTime: moment(date)
          .set({ hour: 22, minute: 0, second: 0, millisecond: 0 })
          .toDate(),
      };
    }

    return { minTime: computedMin, maxTime: computedMax };
  }, [date, currentView, events]);

  // Function to calculate scroll position based on first shift
  const getScrollToTime = (
    currentDate: Date,
    currentView: View,
    calendarEvents: CalendarEvent[]
  ): Date => {
    if (currentView === Views.MONTH) {
      return new Date();
    }

    let viewEvents: CalendarEvent[] = [];

    if (currentView === Views.DAY) {
      viewEvents = calendarEvents.filter((event) =>
        moment(event.start).isSame(currentDate, "day")
      );
    } else if (currentView === Views.WEEK) {
      const weekStart = moment(currentDate).startOf("week");
      const weekEnd = moment(currentDate).endOf("week");
      viewEvents = calendarEvents.filter((event) =>
        moment(event.start).isBetween(weekStart, weekEnd, undefined, "[]")
      );
    }

    if (viewEvents.length > 0) {
      const earliestEvent = viewEvents.reduce((earliest, event) =>
        event.start < earliest.start ? event : earliest
      );

      const scrollTime = moment(earliestEvent.start).subtract(30, "minutes");
      return scrollTime.toDate();
    }

    return moment(currentDate).set({ hour: 8, minute: 0 }).toDate();
  };

  // Function to manually scroll to first shift
  const scrollToFirstShift = (
    currentDate: Date,
    currentView: View,
    calendarEvents: CalendarEvent[]
  ) => {
    if (currentView === Views.MONTH) return;

    setTimeout(() => {
      const scrollTime = getScrollToTime(
        currentDate,
        currentView,
        calendarEvents
      );
      const timeContent = document.querySelector(".rbc-time-content");
      if (timeContent) {
        const targetHour = moment(scrollTime).hour();
        const targetMinute = moment(scrollTime).minute();
        const slotHeight = 30;
        const totalMinutes = targetHour * 60 + targetMinute;
        const scrollPosition = (totalMinutes / 30) * slotHeight;
        timeContent.scrollTop = Math.max(0, scrollPosition - 100);
      }
    }, 150);
  };

  // Auto-scroll when component mounts or when date/view changes
  useEffect(() => {
    if (view !== Views.MONTH) {
      scrollToFirstShift(date, view, events);
    }
  }, [date, view, events]);

  // Format label based on current view and date
  const getLabel = () => {
    const currentMoment = moment(date);

    switch (currentView) {
      case Views.MONTH:
        return currentMoment.format("MMMM YYYY");
      case Views.WEEK:
        const weekStart = currentMoment.startOf("week");
        const weekEnd = currentMoment.endOf("week");
        return `${weekStart.format("MMM D")} - ${weekEnd.format(
          "MMM D, YYYY"
        )}`;
      case Views.DAY:
        return currentMoment.format("dddd, MMMM D, YYYY");
      default:
        return currentMoment.format("MMMM YYYY");
    }
  };

  return (
    <Box height="80vh" display="flex" flexDirection="column" overflow="hidden">
      {" "}
      {/* CHANGED: height="80vh" */}
      {/* Custom Toolbar with publish buttons */}
      <CustomToolbar
        onNavigate={handleNavigate}
        label={getLabel()}
        onView={handleViewChange}
        scheduleMode={scheduleMode}
        draftShifts={draftShifts}
        onPublishSchedule={onPublishSchedule}
        onResetToPublished={onResetToPublished}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      <Box
        borderWidth="1px"
        borderRadius="md"
        p={4}
        bg="white"
        flex="1"
        minHeight="0"
        height="calc(80vh - 140px)" // CHANGED: Adjusted for 80vh
        overflow="hidden"
        sx={{
          // Target the calendar's toolbar and headers to make them sticky
          ".rbc-toolbar": {
            display: "none",
          },
          ".rbc-time-header": {
            position: "sticky",
            top: "0",
            zIndex: 9,
            bg: "white",
          },
          ".rbc-time-content": {
            overflow: "auto !important",
          },
          // Ensure default "+X more" link is visible
          ".rbc-show-more": {
            display: "inline-block !important",
          },

          // MONTH VIEW SPECIFIC STYLES (horizontal text - like week/day view)
          ".rbc-month-view": {
            padding: "6px", // Add padding inside month cells
            ".rbc-row-bg": {
              overflow: "visible !important",
            },
            ".rbc-day-slot": {
              overflow: "visible !important",
              position: "relative", // For positioning the "View Day" button
            },
            ".rbc-month-row": {
              overflow: "visible !important", // allow events to render fully
              minHeight: "120px !important", // Increased height for better readability
            },
            ".rbc-row-content": {
              overflow: "visible !important", // allow visible event rows
              padding: "0 6px 18px 6px", // left/right padding and bottom space for View Day button
            },
            ".rbc-date-cell": {
              overflow: "visible !important",
              fontSize: "14px !important", // Larger date text
              fontWeight: "bold",
              padding: "4px 6px",
              position: "relative",
              zIndex: 3, // keep date header above events
            },
            // Events with horizontal text
            ".rbc-event": {
              overflow: "hidden !important",
              fontSize: "11px !important", // Slightly smaller to fit
              minHeight: "24px !important", // More height for readability
              margin: "2px 2px 1px 2px !important", // tight vertical gaps; small side gutters
              padding: "1px 4px !important",
              lineHeight: "1.3 !important",
              border: "1px solid rgba(0,0,0,0.2) !important",
              borderRadius: "4px !important",
              zIndex: 1,
              width: "calc(100% - 4px)", // honor side padding without overflow
              maxWidth: "100%",
              boxSizing: "border-box",
            },
            // Make month view cells taller to fit more events
            ".rbc-day-bg": {
              minHeight: "120px",
            },
            // Compact month view - make rows taller
            ".rbc-row": {
              minHeight: "120px",
              maxHeight: "none !important",
            },
            // Make event labels more readable
            ".rbc-event-label": {
              display: "none !important", // Hide time label in month view
            },
            ".rbc-event-content": {
              fontSize: "11px !important",
              lineHeight: "1.2 !important",
              padding: "0 !important",
              overflow: "hidden !important",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
            ".rbc-row-segment": {
              overflow: "hidden", // keep segments within cell
            },
          },

          // WEEK/DAY VIEW SPECIFIC STYLES - IMPROVED FOR TIME-BASED POSITIONING
          ".rbc-time-view, .rbc-agenda-view": {
            // Ensure proper scrolling and layout
            ".rbc-time-header": {
              position: "sticky",
              top: "0",
              zIndex: 10,
              bg: "white",
            },
            ".rbc-time-content": {
              overflow: "auto !important",
              position: "relative",
              minWidth: "800px", // Allow horizontal expansion
            },
            // Ensure day columns have proper width and can expand
            ".rbc-day-slot": {
              position: "relative",
              minHeight: "1200px", // Ensure day has enough height for all time slots
              minWidth: "150px", // Minimum width for day columns
            },
            ".rbc-time-slot": {
              minHeight: "40px", // Consistent time slot height
              borderTop: "1px solid #e6e6e6 !important",
              fontSize: "12px", // Larger time labels
            },
            // Events with proper time-based positioning (use RBC computed top/height)
            ".rbc-event": {
              // Do NOT override height; let RBC compute top/height from times
              fontSize: "12px !important",
              padding: "2px 4px !important",
              margin: "0 !important",
              border: "1px solid rgba(0,0,0,0.2) !important",
              borderRadius: "4px !important",
              lineHeight: "1.2 !important",
              overflow: "hidden !important",
              zIndex: 5,
            },
            // Proper event content styling for week/day views
            ".rbc-event-content": {
              fontSize: "12px !important",
              lineHeight: "1.2 !important",
              padding: "0 !important",
              whiteSpace: "normal !important",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            },
            ".rbc-event-label": {
              fontSize: "11px !important",
              display: "block !important",
            },
            // Ensure events are properly positioned and can be side by side
            ".rbc-day-slot .rbc-events-container": {
              margin: "0 !important",
              height: "100% !important",
              position: "relative",
            },
            ".rbc-timeslot-group": {
              minHeight: "40px",
              borderBottom: "none !important",
            },
            // Allow events to be positioned side by side with proper overlap handling
            ".rbc-day-slot .rbc-event": {
              // Calendar sets absolute positioning based on start/end times automatically
            },
            // Enhanced overlap handling for multiple events
            ".rbc-event[data-overlap-index='0']": {
              width: "95% !important",
              left: "2.5% !important",
              zIndex: 5,
            },
            ".rbc-event[data-overlap-index='1']": {
              width: "90% !important",
              left: "5% !important",
              zIndex: 4,
            },
            ".rbc-event[data-overlap-index='2']": {
              width: "85% !important",
              left: "7.5% !important",
              zIndex: 3,
            },
            ".rbc-event[data-overlap-index='3']": {
              width: "80% !important",
              left: "10% !important",
              zIndex: 2,
            },
            ".rbc-event[data-overlap-index='4']": {
              width: "75% !important",
              left: "12.5% !important",
              zIndex: 1,
            },
            // For many overlapping events, enable horizontal scrolling
            ".rbc-time-header-content": {
              minWidth: "800px", // Allow horizontal expansion
            },
          },

          // Make resize handles more visible
          ".rbc-addons-dnd-resize-ns-anchor": {
            height: "10px",
            "&:first-of-type": {
              top: "-5px",
            },
            "&:last-of-type": {
              bottom: "-5px",
            },
          },
          ".rbc-addons-dnd-resize-ew-anchor": {
            width: "10px",
            "&:first-of-type": {
              left: "-5px",
            },
            "&:last-of-type": {
              right: "-5px",
            },
          },

          // Ensure calendar takes full height
          ".rbc-calendar": {
            height: "100% !important",
            minHeight: "100% !important",
          },

          // Note: avoid duplicating ".rbc-time-view"; handled above in nested block
          // Remove any limits on event display
          ".rbc-month-view .rbc-row": {
            flexWrap: "wrap !important",
          },
          ".rbc-allday-cell": {
            display: "none !important",
          },

          // Custom scrollbars for better UX
          "::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "4px",
          },
          "::-webkit-scrollbar-thumb": {
            background: "#c1c1c1",
            borderRadius: "4px",
          },
          "::-webkit-scrollbar-thumb:hover": {
            background: "#a8a8a8",
          },
        }}
      >
        <Calendar
          localizer={momentLocalizer(moment)}
          events={events.map((event, index) => ({
            ...event,
            // Add data attribute for overlapping positioning
            "data-overlap-index": index % 5, // Simple modulo for positioning
          }))}
          date={date}
          view={view}
          onNavigate={(newDate) => {
            setDate(newDate);
            setTimeout(() => {
              scrollToFirstShift(newDate, view, events);
            }, 100);
          }}
          onView={(newView) => {
            handleViewChange(newView);
            setTimeout(() => {
              scrollToFirstShift(date, newView, events);
            }, 100);
          }}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          selectable
          onEventDrop={handleEventDrop}
          onEventResize={handleEventDrop}
          onSelectEvent={handleSelectEvent}
          resizable
          step={30} // 30-minute intervals for better time precision
          timeslots={2}
          showMultiDayTimes
          draggableAccessor={() => true}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
            month: {
              dateHeader: ({ label }) => (
                <Box position="relative">
                  <Text fontSize="14px" fontWeight="bold">
                    {label}
                  </Text>
                </Box>
              ),
            },
          }}
          dayLayoutAlgorithm="overlap" // Use overlap algorithm for side-by-side display
          popup
          onShowMore={(eventsForDate, dateForCell) => {
            setDate(dateForCell);
            setView(Views.DAY);
            setCurrentView(Views.DAY);
            setTimeout(() => {
              scrollToFirstShift(dateForCell, Views.DAY, events);
            }, 100);
          }}
          scrollToTime={getScrollToTime(date, view, events)}
          min={minTime}
          max={maxTime}
        />
      </Box>
      {/* Dynamic Legend for role colors */}
      <RoleLegend employees={employees} />
    </Box>
  );
}
