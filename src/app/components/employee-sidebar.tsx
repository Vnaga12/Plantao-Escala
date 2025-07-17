
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, User } from "lucide-react";
import type { Employee } from "@/lib/types";

type EmployeeSidebarProps = {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
};

export default function EmployeeSidebar({ employees, setEmployees }: EmployeeSidebarProps) {
  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: `Novo Funcionário ${employees.length + 1}`,
      availability: [],
      preferences: "",
    };
    setEmployees([...employees, newEmployee]);
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-gray-50 p-4 flex flex-col print:hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Equipe</h2>
        <Button size="sm" variant="outline" onClick={handleAddEmployee}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100"
            >
              <span className="font-medium text-sm text-gray-700">{employee.name}</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/employee/${employee.id}`} target="_blank" rel="noopener noreferrer">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

    