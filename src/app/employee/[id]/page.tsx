
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Home } from 'lucide-react';
import type { Employee, Calendar, Shift } from '@/lib/types';

// Mock data, as we don't have a central data fetching hook.
// In a real app, this would come from a global state or an API call.
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
      { id: '1', day: 5, role: 'Cirurgia Eletiva', employeeName: 'Dra. Alice', startTime: '08:00', endTime: '16:00', color: 'blue' },
      { id: '2', day: 5, role: 'Plantão', employeeName: 'Beto', startTime: '14:00', endTime: '22:00', color: 'green' },
      { id: '3', day: 12, role: 'Ambulatório', employeeName: 'Carlos', startTime: '09:00', endTime: '17:00', color: 'purple' },
      { id: '4', day: 21, role: 'Emergência', employeeName: 'Dr. David', startTime: '20:00', endTime: '04:00', color: 'red' },
      { id: 's1', day: 15, role: 'Cirurgia Eletiva', employeeName: 'Dra. Alice', startTime: '08:00', endTime: '16:00', color: 'blue' },
    ]
  },
  {
    id: 'cal2',
    name: 'Clínica Secundária',
    shifts: [
        { id: '5', day: 10, role: 'Cirurgia Eletiva', employeeName: 'Dr. David', startTime: '09:00', endTime: '17:00', color: 'blue' },
    ]
  }
];

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [employeeShifts, setEmployeeShifts] = React.useState<Shift[]>([]);

  React.useEffect(() => {
    if (id) {
      const foundEmployee = initialEmployees.find(e => e.id === id);
      if (foundEmployee) {
        setEmployee(foundEmployee);
        const allShifts = initialCalendars.flatMap(cal => 
            cal.shifts.map(shift => ({...shift, calendarName: cal.name}))
        );
        const shiftsForEmployee = allShifts.filter(shift => shift.employeeName === foundEmployee.name);
        setEmployeeShifts(shiftsForEmployee.sort((a,b) => a.day - b.day));
      }
    }
  }, [id]);

  if (!employee) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Funcionário não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
        <Home className="mr-2 h-4 w-4" />
        Voltar para o Calendário
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{employee.name}</CardTitle>
          <CardDescription>
            Preferências: {employee.preferences || 'Nenhuma preferência listada.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-2">Disponibilidade Padrão</h3>
          {employee.availability.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {employee.availability.map((avail, index) => (
                <li key={index}>{avail.day}: {avail.startTime} - {avail.endTime}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma disponibilidade padrão definida.</p>
          )}

          <h3 className="font-semibold mt-6 mb-2">Plantões Agendados (Mês Atual)</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dia</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Hospital/Clínica</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeShifts.length > 0 ? (
                employeeShifts.map(shift => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.day}</TableCell>
                    <TableCell>{shift.role}</TableCell>
                    <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                    <TableCell>{(shift as any).calendarName}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhum plantão agendado para este mês.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
