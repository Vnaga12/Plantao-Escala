"use client";

import type { Shift } from "@/lib/types";
import { format, getDaysInMonth, startOfMonth, getDay, addDays, isToday, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import ShiftCard from "./shift-card";
import { AddShiftDialog } from "./add-shift-dialog";

type CalendarViewProps = {
  currentDate: Date;
  shifts: Shift[];
  onAddShift: (newShift: Omit<Shift, 'id' | 'color'>) => void;
};

export default function CalendarView({ currentDate, shifts, onAddShift }: CalendarViewProps) {
  const firstDayOfMonth = startOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const startingDayOfWeek = getDay(firstDayOfMonth); // Sunday is 0

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 text-center font-semibold text-sm text-gray-600 border-b">
        {weekDays.map((day) => (
          <div key={day} className="py-3">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-5 flex-1">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="border-r border-b" />
        ))}
        {days.map((day) => {
          const dateForDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const shiftsForDay = shifts.filter(
            (shift) => shift.day === day && isSameMonth(dateForDay, currentDate)
          );

          return (
            <div
              key={day}
              className={cn(
                "border-r border-b p-2 flex flex-col gap-2 transition-colors duration-200 hover:bg-sky-50 relative min-h-[120px]",
                !isSameMonth(dateForDay, currentDate) && "bg-gray-50 text-gray-400"
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
                <AddShiftDialog onAddShift={onAddShift} day={day} />
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto">
                {shiftsForDay.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
