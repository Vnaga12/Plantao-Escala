
"use client";

import * as React from "react";
import { addMonths, subMonths, getDaysInMonth, getDay } from "date-fns";
import type { Shift, Employee, Calendar } from "@/lib/types";
import Header from "@/app/components/header";
import CalendarView from "@/app/components/calendar-view";

const initialEmployees: Employee[] = [
    {
        id: '1',
        name: 'Dra. Alice',
        availability: [{ day: 'Monday', startTime: '08:00', endTime: '17:00' }],
        preferences: 'Prefere turnos da manhã.'
    },
    {
        id: '2',
        name: 'Beto',
        availability: [{ day: 'Tuesday', startTime: '12:00', endTime: '20:00' }],
        preferences: 'Não pode trabalhar nos fins de semana.'
    },
    {
        id: '3',
        name: 'Carlos',
        availability: [],
        preferences: 'Disponível para cobrir turnos.'
    },
    {
        id: '4',
        name: 'Dr. David',
        availability: [],
        preferences: 'Prefere turnos da noite.'
    },
];

const initialCalendars: Calendar[] = [
  {
    id: 'cal1',
    name: 'Hospital Principal',
    shifts: [
      { id: '1', day: 5, role: 'Médico(a)', employeeName: 'Dra. Alice', startTime: '08:00', endTime: '16:00', color: 'blue' },
      { id: '2', day: 5, role: 'Enfermeiro(a)', employeeName: 'Beto', startTime: '14:00', endTime: '22:00', color: 'green' },
      { id: '3', day: 12, role: 'Técnico(a)', employeeName: 'Carlos', startTime: '09:00', endTime: '17:00', color: 'purple' },
      { id: '4', day: 21, role: 'Médico(a)', employeeName: 'Dr. David', startTime: '20:00', endTime: '04:00', color: 'blue' },
    ]
  },
  {
    id: 'cal2',
    name: 'Clínica Secundária',
    shifts: [
        { id: '5', day: 10, role: 'Médico(a)', employeeName: 'Dr. David', startTime: '09:00', endTime: '17:00', color: 'blue' },
    ]
  }
];

export default function Home() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [calendars, setCalendars] = React.useState<Calendar[]>(initialCalendars);
  const [activeCalendarId, setActiveCalendarId] = React.useState<string>('cal1');
  const [roles, setRoles] = React.useState(['Médico(a)', 'Enfermeiro(a)', 'Técnico(a)']);

  const activeCalendar = calendars.find(c => c.id === activeCalendarId) ?? calendars[0];
  const shifts = activeCalendar?.shifts || [];

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1));
  };

  const handleSetShifts = (newShifts: Shift[]) => {
    setCalendars(prev => prev.map(cal => 
      cal.id === activeCalendarId ? { ...cal, shifts: newShifts } : cal
    ));
  };

  const handleAddShift = (newShift: Omit<Shift, 'id' | 'color'>) => {
    const roleColors: Record<string, Shift['color']> = {
      'Médico(a)': 'blue',
      'Enfermeiro(a)': 'green',
      'Técnico(a)': 'purple',
    };
    
    const shiftWithId: Shift = {
      ...newShift,
      id: Date.now().toString(),
      color: roleColors[newShift.role] || 'blue',
    };
    handleSetShifts([...shifts, shiftWithId]);
  };

  const handleApplySuggestions = (suggestedShifts: {
      employeeId: string;
      shiftDay: string;
      shiftStartTime: string;
      shiftEndTime: string;
      role: string;
  }[]) => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(currentDate);

      const weekdayMap: { [key: string]: number } = {
          'sunday': 0, 'domingo': 0,
          'monday': 1, 'segunda-feira': 1,
          'tuesday': 2, 'terça-feira': 2,
          'wednesday': 3, 'quarta-feira': 3,
          'thursday': 4, 'quinta-feira': 4,
          'friday': 5, 'sexta-feira': 5,
          'saturday': 6, 'sábado': 6,
      };

      const newShifts: Shift[] = [];
      const roleColors: Record<string, Shift['color']> = {
        'Médico(a)': 'blue',
        'Enfermeiro(a)': 'green',
        'Técnico(a)': 'purple',
      };

      for (let day = 1; day <= daysInMonth; day++) {
          const dateForDay = new Date(year, month, day);
          const dayOfWeek = getDay(dateForDay);

          const matchingSuggestions = suggestedShifts.filter(suggestion => {
              const suggestionDay = suggestion.shiftDay.toLowerCase().replace('-feira', '');
              return weekdayMap[suggestionDay] === dayOfWeek;
          });

          matchingSuggestions.forEach((suggestion, index) => {
              const employee = employees.find(e => e.id === suggestion.employeeId);
              
              if (suggestion.role) {
                newShifts.push({
                    id: `suggested-${dateForDay.getTime()}-${index}`,
                    day: day,
                    role: suggestion.role,
                    employeeName: employee?.name || 'Desconhecido',
                    startTime: suggestion.shiftStartTime,
                    endTime: suggestion.shiftEndTime,
                    color: roleColors[suggestion.role] || 'blue',
                });
              }
          });
      }
      handleSetShifts(newShifts);
  };
  
  const handleUpdateShift = (updatedShift: Shift) => {
    const newShifts = shifts.map(s => s.id === updatedShift.id ? updatedShift : s);
    handleSetShifts(newShifts);
  };
  
  const filteredShifts = shifts.filter(shift => {
    const query = searchQuery.toLowerCase();
    return (
      shift.employeeName.toLowerCase().includes(query) ||
      shift.role.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        employees={employees}
        onApplySuggestions={handleApplySuggestions}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roles={roles}
        onRolesChange={setRoles}
        calendars={calendars}
        activeCalendarId={activeCalendarId}
        onCalendarChange={setActiveCalendarId}
        onCalendarsChange={setCalendars}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <CalendarView 
          currentDate={currentDate} 
          shifts={filteredShifts}
          onAddShift={handleAddShift} 
          employees={employees}
          onUpdateShift={handleUpdateShift}
          roles={roles}
        />
      </main>
    </div>
  );
}
