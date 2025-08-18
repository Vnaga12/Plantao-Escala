
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
    const unassignedRole = roles.find(r => r.id === 'role-unassigned') || roles[0];
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: `Novo Funcionário ${employees.length + 1}`,
      roleId: unassignedRole.id,
      availability: [],
      preferences: "",
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
    employees.forEach(employee => {
        if (grouped[employee.roleId]) {
            grouped[employee.roleId].push(employee);
        } else {
            // Handle employees with orphaned roleId
            if (!grouped['role-unassigned']) {
                 grouped['role-unassigned'] = [];
            }
             grouped['role-unassigned'].push(employee);
        }
    });
    return { grouped, order: roles.map(r => r.id) };
  }, [employees, roles]);

  const allShiftRoles = [...new Set(shifts.map(s => s.role))];

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
            {employeesByRole.order.map(roleId => {
              const role = roles.find(r => r.id === roleId);
              if (!role || employeesByRole.grouped[roleId].length === 0) return null;
              return (
                <React.Fragment key={role.id}>
                    <h3 className="text-sm font-semibold text-gray-500 px-2 mb-2 uppercase tracking-wider">{role.name}</h3>
                    <div className="space-y-1">
                        {employeesByRole.grouped[roleId].map(employee => (
                           <div key={employee.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group">
                             <div>
                                 <p className="font-medium text-sm text-gray-700">{employee.name}</p>
                             </div>
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
                                     allShiftRoles={allShiftRoles}
                                     calendarName={calendarName}
                                     colorMeanings={colorMeanings}
                                 >
                                     <Button variant="ghost" size="icon" className="h-7 w-7"><User className="h-4 w-4" /></Button>
                                 </EditEmployeeDialog>
                             </div>
                           </div>
                        ))}
                    </div>
                </React.Fragment>
              )
            })}
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
