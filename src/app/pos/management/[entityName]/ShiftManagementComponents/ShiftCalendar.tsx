// src/app/pos/management/[entityName]/ShiftManagementComponents/ShiftCalendar.tsx
"use client";

import React, { useRef, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import moment from "moment";
import {
  Box,
  HStack,
  Button,
  Flex,
  Text,
  useToast,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Employee, Shift } from "../ShiftManagement";
import { generateRoleColors, getRoleColor } from "./roleColors";
import { EventDropArg, EventClickArg, EventContentArg } from "@fullcalendar/core";

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
}

const CustomToolbar = ({ calendarRef, title }: { calendarRef: React.RefObject<FullCalendar>, title: string }) => {
  const handleNav = (action: 'prev' | 'next' | 'today') => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      if (action === 'prev') calendarApi.prev();
      if (action === 'next') calendarApi.next();
      if (action === 'today') calendarApi.today();
    }
  };

  const handleViewChange = (view: string) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
    }
  };

  return (
    <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
      <HStack>
        <Button size="sm" onClick={() => handleNav('today')}>Today</Button>
        <IconButton aria-label="Previous" icon={<ChevronLeftIcon />} size="sm" onClick={() => handleNav('prev')} />
        <IconButton aria-label="Next" icon={<ChevronRightIcon />} size="sm" onClick={() => handleNav('next')} />
      </HStack>
      <Text fontWeight="bold" fontSize="lg">{title}</Text>
      <HStack>
        <Button size="sm" onClick={() => handleViewChange('dayGridMonth')}>Month</Button>
        <Button size="sm" onClick={() => handleViewChange('resourceTimelineWeek')}>Week</Button>
        <Button size="sm" onClick={() => handleViewChange('resourceTimelineDay')}>Day</Button>
      </HStack>
    </Flex>
  );
};


export default function ShiftCalendar({
  shifts,
  employees,
  onUpdateShift,
  onSelectShift,
}: ShiftCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const toast = useToast();
  const [calendarTitle, setCalendarTitle] = useState('');

  const roleColors = useMemo(() => generateRoleColors(employees), [employees]);

  const { resources, events } = useMemo(() => {
    const daysOfWeek = moment.weekdays().map((day, index) => ({
      id: index.toString(),
      title: day,
    }));

    const eventList = shifts
      .filter(shift => shift.active !== false)
      .map(shift => {
        const employee = employees.find(emp => emp.id === shift.employee_id);
        const eventColor = getRoleColor(roleColors, employee?.role);
        return {
          id: shift.id,
          resourceId: moment(shift.start).day().toString(),
          title: shift.employee_name || 'Unknown',
          start: shift.start,
          end: shift.end,
          extendedProps: {
            employeeRole: employee?.role || 'No Role',
            isDraft: shift.isDraft || false,
            originalShift: shift,
          },
          backgroundColor: eventColor,
          borderColor: eventColor,
        };
      });

    return { resources: daysOfWeek, events: eventList };
  }, [shifts, employees, roleColors]);

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    const { event, oldEvent } = arg;
    const shiftId = event.id;
    const updates = {
      start: event.start || oldEvent.start,
      end: event.end || oldEvent.end,
    };

    const result = await onUpdateShift(shiftId, updates);
    if (!result.success) {
      arg.revert();
      toast({
        title: 'Update failed',
        description: result.error || 'Could not move the shift.',
        status: 'error',
      });
    } else {
      toast({
        title: 'Shift Updated',
        description: 'Shift time has been changed.',
        status: 'success',
      });
    }
  }, [onUpdateShift, toast]);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    onSelectShift(arg.event.extendedProps.originalShift);
  }, [onSelectShift]);

  const handleDatesSet = (arg: any) => {
    if (calendarRef.current) {
        setCalendarTitle(calendarRef.current.getApi().view.title);
    }
  };
  
  const EventContent = (eventInfo: EventContentArg) => {
    const { extendedProps, title } = eventInfo.event;
    const { employeeRole, isDraft } = extendedProps;

    return (
      <Box p={1} overflow="hidden" w="100%">
        <Text fontSize="xs" fontWeight="bold" noOfLines={1}>{title}</Text>
        <Text fontSize="xs" noOfLines={1}>{employeeRole}</Text>
        {isDraft && <Badge colorScheme="yellow" fontSize="xx-small">Draft</Badge>}
      </Box>
    );
  };
  

  return (
    <Box height="calc(100vh - 300px)" minHeight="500px">
      <CustomToolbar calendarRef={calendarRef} title={calendarTitle} />
      <FullCalendar
        ref={calendarRef}
        plugins={[resourceTimelinePlugin, interactionPlugin, dayGridPlugin]}
        initialView="resourceTimelineWeek"
        headerToolbar={false} // We are using a custom toolbar
        schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
        resources={resources}
        events={events}
        editable
        droppable
        eventDrop={handleEventDrop}
        eventResize={handleEventDrop}
        eventClick={handleEventClick}
        eventContent={EventContent}
        resourceAreaHeaderContent="Days"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        datesSet={handleDatesSet}
        views={{
            resourceTimelineWeek: {
                type: 'resourceTimeline',
                duration: { weeks: 1 },
                slotLabelFormat: {
                    hour: 'numeric',
                    minute: '2-digit',
                    omitZeroMinute: false,
                    meridiem: 'short'
                }
            },
            resourceTimelineDay: {
                type: 'resourceTimeline',
                duration: { days: 1 },
                slotLabelFormat: {
                    hour: 'numeric',
                    minute: '2-digit',
                    omitZeroMinute: false,
                    meridiem: 'short'
                }
            },
            dayGridMonth: {
                type: 'dayGridMonth',
            }
        }}
      />
    </Box>
  );
}