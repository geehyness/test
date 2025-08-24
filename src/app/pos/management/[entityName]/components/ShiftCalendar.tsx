// src/app/pos/management/[entityName]/components/ShiftCalendar.tsx

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box } from '@chakra-ui/react';
import { Shift } from '../ShiftManagement';

interface ShiftCalendarProps {
    initialShifts: Shift[];
    onAddShift: (newShift: Shift) => void;
    onUpdateShift: (updatedShift: Shift) => void;
}

const ShiftCalendar: React.FC<ShiftCalendarProps> = ({ initialShifts, onAddShift, onUpdateShift }) => {
    const [shifts, setShifts] = useState<Shift[]>(initialShifts);

    const handleEventReceive = (info: any) => {
        const { draggedEl, event } = info;
        const { employeeId, employeeName, employeeRole } = JSON.parse(draggedEl.getAttribute('data-drag'));

        const newShift = {
            id: event.id,
            title: `${employeeName} - ${employeeRole}`,
            start: event.startStr,
            end: event.endStr,
            employee_id: employeeId,
        };

        setShifts(prevShifts => [...prevShifts, newShift]);
        onAddShift(newShift);
    };

    const handleEventResize = (info: any) => {
        const { event } = info;
        const updatedShift = {
            id: event.id,
            title: event.title,
            start: event.startStr,
            end: event.endStr,
            employee_id: event.extendedProps.employee_id,
        };

        setShifts(prevShifts =>
            prevShifts.map(shift =>
                shift.id === updatedShift.id ? updatedShift : shift
            )
        );
        onUpdateShift(updatedShift);
    };

    const handleEventDrop = (info: any) => {
        const { event } = info;
        const updatedShift = {
            id: event.id,
            title: event.title,
            start: event.startStr,
            end: event.endStr,
            employee_id: event.extendedProps.employee_id,
        };

        setShifts(prevShifts =>
            prevShifts.map(shift =>
                shift.id === updatedShift.id ? updatedShift : shift
            )
        );
        onUpdateShift(updatedShift);
    };

    return (
        <Box flex="1" p={4} h="calc(100vh - 150px)">
            <FullCalendar
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                weekends={true}
                editable={true}
                droppable={true}
                events={shifts}
                slotMinTime="06:00:00"
                slotMaxTime="24:00:00"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,timeGridDay',
                }}
                eventReceive={handleEventReceive}
                eventResize={handleEventResize}
                eventDrop={handleEventDrop}
            />
        </Box>
    );
};

export default ShiftCalendar;