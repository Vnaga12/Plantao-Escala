
"use client";

import type { Employee, Shift, ShiftColor } from "@/lib/types";
import { format, getDaysInMonth, startOfMonth, getDay, isToday, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ShiftCard from "./shift-card";
import { AddShiftDialog } from "./add-shift-dialog";

type CalendarViewProps = {
  currentDate: Date;
  shifts: Shift[];
  onAddShift: (newShift: Omit<Shift, 'id' | 'color'>) => void;
  employees: Employee[];
  onUpdateShift: (updatedShift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  shiftTypes: string[];
  colorMeanings: { color: ShiftColor, meaning: string }[];
};

export default function CalendarView({ 
    currentDate, 
    shifts, 
    onAddShift, 
    employees, 
    onUpdateShift, 
    onDeleteShift, 
    shiftTypes,
    colorMeanings
}: CalendarViewProps) {
  const firstDayOfMonth = startOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const startingDayOfWeek = getDay(firstDayOfMonth); // Sunday is 0

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="flex flex-col h-full print:block print:h-auto">
      <div className="grid grid-cols-7 text-center font-semibold text-sm text-gray-600 border-b">
        {weekDays.map((day) => (
          <div key={day} className="py-3">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-5 flex-1 print:grid print:grid-cols-7 print:h-auto print:grid-rows-auto">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="border-r border-b print:min-h-[160px] print:border" />
        ))}
        {days.map((day, index) => {
          const dateForDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dateForDayString = format(dateForDay, 'yyyy-MM-dd');

          const shiftsForDay = shifts.filter(
            (shift) => shift.date === dateForDayString
          );

          return (
            <div
              key={day}
              className={cn(
                "border-b p-2 flex flex-col gap-2 transition-colors duration-200 hover:bg-sky-50 relative min-h-[120px] print:min-h-[160px] print:break-inside-avoid print:border",
                (index + startingDayOfWeek) % 7 !== 6 && "border-r" // Don't add right border to last column
              )}
            >
              <div className="flex justify-between items-center">
                <span
                  className={cn(
                    "font-medium",
                    isToday(dateForDay)
                      ? "flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground"
                      : "text-gray-700"
                  )}
                >
                  {day}
                </span>
                <div className="print:hidden">
                    <AddShiftDialog onAddShift={onAddShift} date={dateForDay} shiftTypes={shiftTypes} colorMeanings={colorMeanings} />
                </div>
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto print:overflow-visible">
                {shiftsForDay.map((shift) => (
                  <ShiftCard 
                    key={shift.id} 
                    shift={shift} 
                    employees={employees} 
                    onUpdateShift={onUpdateShift}
                    onDeleteShift={onDeleteShift}
                    shiftTypes={shiftTypes}
                    colorMeanings={colorMeanings}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

    