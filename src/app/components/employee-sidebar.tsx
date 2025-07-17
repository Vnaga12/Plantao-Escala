
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, User, CalendarPlus } from "lucide-react";
import type { Employee, Shift, ShiftColor } from "@/lib/types";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { EditDayDialog } from "./edit-day-dialog";
import { Separator } from "@/components/ui/separator";

type EmployeeSidebarProps = {
  employees: Employee[];
  onEmployeesChange: (employees: Employee[]) => void;
  shifts: Shift[];
  currentDate: Date;
  onUpdateShift: (updatedShift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  roles: string[];
  calendarName: string;
  onAddDayEvent: (event: { date: Date; name: string; color: ShiftColor }) => void;
};

export default function EmployeeSidebar({ 
  employees, 
  onEmployeesChange,
  shifts,
  currentDate,
  onUpdateShift,
  onDeleteShift,
  roles,
  calendarName,
  onAddDayEvent
}: EmployeeSidebarProps) {
  
  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: `Novo Funcionário ${employees.length + 1}`,
      availability: [],
      preferences: "",
    };
    onEmployeesChange([...employees, newEmployee]);
  };

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    const newEmployees = employees.map(emp => 
        emp.id === updatedEmployee.id ? updatedEmployee : emp
    );
    onEmployeesChange(newEmployees);
  };
  
  const handleDeleteEmployee = (employeeId: string) => {
    const newEmployees = employees.filter(emp => emp.id !== employeeId);
    onEmployeesChange(newEmployees);
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-gray-50 p-4 flex flex-col print:hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Equipe</h2>
          <Button size="sm" variant="outline" onClick={handleAddEmployee}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group"
              >
                <span className="font-medium text-sm text-gray-700">{employee.name}</span>
                <div className="flex items-center">
                  <EditEmployeeDialog 
                      employee={employee} 
                      onUpdateEmployee={handleUpdateEmployee} 
                      onDeleteEmployee={handleDeleteEmployee} 
                      shifts={shifts}
                      currentDate={currentDate}
                      onUpdateShift={onUpdateShift}
                      onDeleteShift={onDeleteShift}
                      roles={roles}
                      calendarName={calendarName}
                  >
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                          <User className="h-4 w-4" />
                      </Button>
                  </EditEmployeeDialog>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

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
