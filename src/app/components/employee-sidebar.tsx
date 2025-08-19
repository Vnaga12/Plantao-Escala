
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, User, CalendarPlus, Users } from "lucide-react";
import type { Employee, Shift, ShiftColor } from "@/lib/types";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { EditDayDialog } from "./edit-day-dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

type EmployeeSidebarProps = {
  employees: Employee[];
  onAddEmployee: (name: string) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  shifts: Shift[];
  currentDate: Date;
  onUpdateShift: (updatedShift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onAddShift: (newShift: Omit<Shift, 'id' | 'color'>) => void;
  shiftTypes: string[];
  calendarName: string;
  onAddDayEvent: (event: { date: Date; name: string; color: ShiftColor }) => void;
  colorMeanings: { color: ShiftColor, meaning: string }[];
};

export default function EmployeeSidebar({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  shifts,
  currentDate,
  onUpdateShift,
  onDeleteShift,
  onAddShift,
  shiftTypes,
  calendarName,
  onAddDayEvent,
  colorMeanings,
}: EmployeeSidebarProps) {
  const [newEmployeeName, setNewEmployeeName] = React.useState("");

  const handleAddClick = () => {
    if (newEmployeeName.trim() === "") return;
    onAddEmployee(newEmployeeName.trim());
    setNewEmployeeName("");
  };

  return (
    <aside className="w-72 flex-shrink-0 border-r bg-gray-50 p-4 flex flex-col print:hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Grupo</h2>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <Input 
          placeholder="Nome do funcionário"
          value={newEmployeeName}
          onChange={(e) => setNewEmployeeName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
        />
        <Button size="sm" onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <ScrollArea className="flex-1 -mr-4 pr-4">
        <div className="space-y-1">
          {employees.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group">
              <div>
                  <p className="font-medium text-sm text-gray-700">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">{employee.role}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <EditEmployeeDialog 
                      employee={employee}
                      onUpdateEmployee={onUpdateEmployee}
                      onDeleteEmployee={onDeleteEmployee}
                      shifts={shifts}
                      currentDate={currentDate}
                      onUpdateShift={onUpdateShift}
                      onDeleteShift={onDeleteShift}
                      onAddShift={onAddShift}
                      shiftTypes={shiftTypes}
                      calendarName={calendarName}
                      colorMeanings={colorMeanings}
                  >
                      <Button variant="ghost" size="icon" className="h-7 w-7"><User className="h-4 w-4" /></Button>
                  </EditEmployeeDialog>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      

      <Separator className="my-4" />

      <div className="flex-shrink-0">
         <EditDayDialog onAddDayEvent={onAddDayEvent}>
            <Button variant="outline" className="w-full justify-start">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Editar Dia em Massa
            </Button>
         </EditDayDialog>
      </div>
    </aside>
  );
}
