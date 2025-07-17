
"use client";

import * as React from "react";
import { addMonths, subMonths, getDaysInMonth, getDay } from "date-fns";
import type { Shift, Employee } from "@/lib/types";
import Header from "@/app/components/header";
import CalendarView from "@/app/components/calendar-view";

const initialShifts: Shift[] = [
  { id: '1', day: 5, role: 'Doctor', employeeName: 'Dr. Alice', startTime: '08:00', endTime: '16:00', color: 'blue' },
  { id: '2', day: 5, role: 'Nurse', employeeName: 'Bob', startTime: '14:00', endTime: '22:00', color: 'green' },
  { id: '3', day: 12, role: 'Technician', employeeName: 'Charlie', startTime: '09:00', endTime: '17:00', color: 'purple' },
  { id: '4', day: 21, role: 'Doctor', employeeName: 'Dr. Dave', startTime: '20:00', endTime: '04:00', color: 'blue' },
];

const initialEmployees: Employee[] = [
    {
        id: '1',
        name: 'Dr. Alice',
        availability: [{ day: 'Monday', startTime: '08:00', endTime: '17:00' }],
        preferences: 'Prefers morning shifts.'
    },
    {
        id: '2',
        name: 'Bob',
        availability: [{ day: 'Tuesday', startTime: '12:00', endTime: '20:00' }],
        preferences: 'Cannot work on weekends.'
    },
];

export default function Home() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [shifts, setShifts] = React.useState<Shift[]>(initialShifts);
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees);

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1));
  };

  const handleAddShift = (newShift: Omit<Shift, 'id' | 'color'>) => {
    const roleColors: Record<Shift['role'], Shift['color']> = {
      Doctor: 'blue',
      Nurse: 'green',
      Technician: 'purple',
    };
    
    const shiftWithId: Shift = {
      ...newShift,
      id: Date.now().toString(),
      color: roleColors[newShift.role],
    };
    setShifts((prev) => [...prev, shiftWithId]);
  };

  const handleApplySuggestions = (suggestedShifts: {
      employeeId: string;
      shiftDay: string;
      shiftStartTime: string;
      shiftEndTime: string;
      role: "Doctor" | "Nurse" | "Technician";
  }[]) => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(currentDate);

      const weekdayMap: { [key: string]: number } = {
          'sunday': 0,
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6,
      };

      const newShifts: Shift[] = [];
      const roleColors: Record<Shift['role'], Shift['color']> = {
        Doctor: 'blue',
        Nurse: 'green',
        Technician: 'purple',
      };

      for (let day = 1; day <= daysInMonth; day++) {
          const dateForDay = new Date(year, month, day);
          const dayOfWeek = getDay(dateForDay);

          const matchingSuggestions = suggestedShifts.filter(suggestion => {
              const suggestionDay = suggestion.shiftDay.toLowerCase();
              return weekdayMap[suggestionDay] === dayOfWeek;
          });

          matchingSuggestions.forEach((suggestion, index) => {
              const employee = employees.find(e => e.id === suggestion.employeeId);
              
              if (suggestion.role && roleColors[suggestion.role]) {
                newShifts.push({
                    id: `suggested-${dateForDay.getTime()}-${index}`,
                    day: day,
                    role: suggestion.role,
                    employeeName: employee?.name || 'Unknown',
                    startTime: suggestion.shiftStartTime,
                    endTime: suggestion.shiftEndTime,
                    color: roleColors[suggestion.role],
                });
              }
          });
      }

      // Replace all shifts for the current month with the generated schedule.
      setShifts(newShifts);
  };


  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        employees={employees}
        onApplySuggestions={handleApplySuggestions}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <CalendarView 
          currentDate={currentDate} 
          shifts={shifts}
          onAddShift={handleAddShift} 
        />
      </main>
    </div>
  );
}
