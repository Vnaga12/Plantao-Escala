
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, User, CalendarPlus, Users } from "lucide-react";
import type { Employee, Shift, ShiftColor, Role } from "@/lib/types";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { EditDayDialog } from "./edit-day-dialog";
import { Separator } from "@/components/ui/separator";

type EmployeeSidebarProps = {
  employees: Employee[];
  onEmployeesChange: (employees: Employee[]) => void;
  onUpdateEmployee: (employee: Employee) => void;
  shifts: Shift[];
  currentDate: Date;
  onUpdateShift: (updatedShift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onAddShift: (newShift: Omit<Shift, 'id' | 'color'>) => void;
  roles: Role[];
  onRolesChange: (roles: Role[]) => void;
  calendarName: string;
  onAddDayEvent: (event: { date: Date; name: string; color: ShiftColor }) => void;
  colorMeanings: { color: ShiftColor, meaning: string }[];
};

export default function EmployeeSidebar({
  employees,
  onEmployeesChange,
  onUpdateEmployee,
  shifts,
  currentDate,
  onUpdateShift,
  onDeleteShift,
  onAddShift,
  roles,
  calendarName,
  onAddDayEvent,
  colorMeanings
}: EmployeeSidebarProps) {

  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: `Novo Funcionário ${employees.length + 1}`,
      availability: [],
      preferences: "",
      roleId: null,
    };
    onEmployeesChange([...employees, newEmployee]);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    const newEmployees = employees.filter(emp => emp.id !== employeeId);
    onEmployeesChange(newEmployees);
  }
  
  const employeesByRole = React.useMemo(() => {
    const grouped: { [key: string]: Employee[] } = {};
    
    roles.forEach(role => {
        grouped[role.id] = [];
    });
    
    const unassigned: Employee[] = [];

    employees.forEach(employee => {
      if (employee.roleId && grouped[employee.roleId]) {
        grouped[employee.roleId].push(employee);
      } else {
        unassigned.push(employee);
      }
    });

    return { grouped, unassigned };
  }, [employees, roles]);


  return (
    <aside className="w-72 flex-shrink-0 border-r bg-gray-50 p-4 flex flex-col print:hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Grupo</h2>
          <Button size="sm" variant="outline" onClick={handleAddEmployee}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
        <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="space-y-4">
                {roles.map(role => (
                    <div key={role.id}>
                        <h3 className="text-sm font-semibold text-gray-500 px-2 mb-2 uppercase tracking-wider">{role.name}</h3>
                        <div className="space-y-1">
                            {employeesByRole.grouped[role.id].length > 0 ? (
                                employeesByRole.grouped[role.id].map(employee => (
                                <div key={employee.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group">
                                    <span className="font-medium text-sm text-gray-700">{employee.name}</span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <EditEmployeeDialog
                                            employee={employee}
                                            allEmployees={employees}
                                            onUpdateEmployee={onUpdateEmployee}
                                            onDeleteEmployee={handleDeleteEmployee}
                                            shifts={shifts}
                                            currentDate={currentDate}
                                            onUpdateShift={onUpdateShift}
                                            onDeleteShift={onDeleteShift}
                                            onAddShift={onAddShift}
                                            roles={roles}
                                            calendarName={calendarName}
                                            colorMeanings={colorMeanings}
                                            allShiftRoles={[...new Set(calendars.flatMap(c => c.shifts).map(s => s.role))]}
                                        >
                                            <Button variant="ghost" size="icon" className="h-7 w-7"><User className="h-4 w-4" /></Button>
                                        </EditEmployeeDialog>
                                    </div>
                                </div>
                                ))
                            ) : (
                                <p className="px-2 text-xs text-gray-400 italic">Nenhum funcionário nesta função.</p>
                            )}
                        </div>
                    </div>
                ))}
                {employeesByRole.unassigned.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 px-2 mb-2 uppercase tracking-wider">Sem Função</h3>
                        <div className="space-y-1">
                           {employeesByRole.unassigned.map(employee => (
                                <div key={employee.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group">
                                    <span className="font-medium text-sm text-gray-700">{employee.name}</span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <EditEmployeeDialog
                                            employee={employee}
                                            allEmployees={employees}
                                            onUpdateEmployee={onUpdateEmployee}
                                            onDeleteEmployee={handleDeleteEmployee}
                                            shifts={shifts}
                                            currentDate={currentDate}
                                            onUpdateShift={onUpdateShift}
                                            onDeleteShift={onDeleteShift}
                                            onAddShift={onAddShift}
                                            roles={roles}
                                            calendarName={calendarName}
                                            colorMeanings={colorMeanings}
                                            allShiftRoles={[...new Set(calendars.flatMap(c => c.shifts).map(s => s.role))]}
                                        >
                                            <Button variant="ghost" size="icon" className="h-7 w-7"><User className="h-4 w-4" /></Button>
                                        </EditEmployeeDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
