
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Home, ArrowLeft } from 'lucide-react';
import type { Employee, Calendar, Shift } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { getDaysInMonth } from 'date-fns';

type EmployeeWithShifts = Employee & {
    shifts: (Shift & { calendarName: string })[];
};

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();

  const [employee, setEmployee] = React.useState<EmployeeWithShifts | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // This is a workaround to get data from localStorage since we don't have a backend.
    // In a real application, this would be an API call.
    const loadData = () => {
        try {
            const storedCalendars = localStorage.getItem('calendars');
            const storedEmployees = localStorage.getItem('employees');
            const currentDate = new Date(localStorage.getItem('currentDate') || new Date());
            
            if (storedCalendars && storedEmployees) {
                const calendars: Calendar[] = JSON.parse(storedCalendars);
                const employees: Employee[] = JSON.parse(storedEmployees);
                const currentMonth = currentDate.getMonth();
                const currentYear = currentDate.getFullYear();
                
                const foundEmployee = employees.find(e => e.id === id);
    
                if (foundEmployee) {
                    const allShifts = calendars.flatMap(cal => 
                        cal.shifts.map(shift => ({...shift, calendarName: cal.name}))
                    );

                    const shiftsForEmployee = allShifts.filter(shift => {
                        const shiftDate = new Date(currentYear, currentMonth, shift.day);
                        return shift.employeeName === foundEmployee.name && 
                               shiftDate.getMonth() === currentMonth &&
                               shiftDate.getFullYear() === currentYear;
                    });
                    
                    setEmployee({
                        ...foundEmployee,
                        shifts: shiftsForEmployee.sort((a,b) => a.day - b.day),
                    });
                }
            } else {
                 toast({
                    variant: "destructive",
                    title: "Dados não encontrados",
                    description: "Não foi possível carregar os dados do calendário. Volte à página inicial e tente novamente.",
                });
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar dados",
                description: "Ocorreu um problema ao carregar as informações do localStorage.",
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Check if running on client side
    if (typeof window !== 'undefined') {
        loadData();
    }
    
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Carregando perfil do funcionário...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
        <p className='text-lg'>Funcionário não encontrado ou dados indisponíveis.</p>
         <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o Calendário
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-4 bg-white">
        <Home className="mr-2 h-4 w-4" />
        Voltar para o Calendário
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800">{employee.name}</CardTitle>
          <CardDescription className="text-md text-gray-600">
            Preferências: {employee.preferences || 'Nenhuma preferência listada.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2 text-lg text-gray-700 border-b pb-2">Disponibilidade Padrão</h3>
              {employee.availability.length > 0 ? (
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                  {employee.availability.map((avail, index) => (
                    <li key={index}><span className="font-medium text-gray-700">{avail.day}</span>: {avail.startTime} - {avail.endTime}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Nenhuma disponibilidade padrão definida.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mt-6 mb-2 text-lg text-gray-700 border-b pb-2">Plantões Agendados (Mês Atual)</h3>
              <div className="border rounded-lg overflow-hidden mt-2">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Dia</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Hospital/Clínica</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.shifts.length > 0 ? (
                      employee.shifts.map(shift => (
                        <TableRow key={shift.id}>
                          <TableCell>{shift.day}</TableCell>
                          <TableCell>{shift.role}</TableCell>
                          <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                          <TableCell>{shift.calendarName}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                          Nenhum plantão agendado para este mês.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
