
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Home, ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import type { Employee, Calendar, Shift, EmployeeAvailability } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { getDaysInMonth } from 'date-fns';

type EmployeeWithShifts = Employee & {
    shifts: (Shift & { calendarName: string })[];
};

const weekdays = [
    { value: "Monday", label: "Segunda-feira" },
    { value: "Tuesday", label: "Terça-feira" },
    { value: "Wednesday", label: "Quarta-feira" },
    { value: "Thursday", label: "Quinta-feira" },
    { value: "Friday", label: "Sexta-feira" },
    { value: "Saturday", label: "Sábado" },
    { value: "Sunday", label: "Domingo" },
];

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();

  const [employee, setEmployee] = React.useState<EmployeeWithShifts | null>(null);
  const [loading, setLoading] = React.useState(true);

  const { register, control, handleSubmit, reset } = useForm<{
    preferences: string;
    availability: EmployeeAvailability[];
  }>({
    defaultValues: {
      preferences: '',
      availability: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "availability"
  });

  const loadData = React.useCallback(() => {
    if (typeof window === 'undefined' || !id) return;
    setLoading(true);
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
                // Reset form with loaded data
                reset({
                  preferences: foundEmployee.preferences,
                  availability: foundEmployee.availability
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
  }, [id, toast, reset]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);


  const onSubmit = (data: { preferences: string; availability: EmployeeAvailability[] }) => {
    try {
      const storedEmployees = localStorage.getItem('employees');
      if (storedEmployees) {
        let employees: Employee[] = JSON.parse(storedEmployees);
        employees = employees.map(emp => {
          if (emp.id === id) {
            return {
              ...emp,
              preferences: data.preferences,
              availability: data.availability,
            };
          }
          return emp;
        });
        localStorage.setItem('employees', JSON.stringify(employees));
        toast({
          title: "Perfil Atualizado",
          description: "As informações do funcionário foram salvas com sucesso.",
        });
        // Reload data to reflect changes immediately, especially for the shift list if name changes etc.
        loadData();
      }
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
      toast({
          variant: "destructive",
          title: "Erro ao Salvar",
          description: "Não foi possível salvar as alterações.",
      });
    }
  };

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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-800">{employee.name}</CardTitle>
            <CardDescription className="text-md text-gray-600 pt-2">
                <Label htmlFor="preferences">Preferências</Label>
                <Textarea
                    id="preferences"
                    {...register("preferences")}
                    placeholder="Nenhuma preferência listada."
                    className="mt-1"
                />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                    <h3 className="font-semibold text-lg text-gray-700">Disponibilidade Padrão</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ day: 'Monday', startTime: '09:00', endTime: '17:00' })}>
                        <Plus className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                </div>
                
                <div className="space-y-3 mt-4">
                  {fields.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1fr,auto] items-center gap-2 p-2 border rounded-md bg-gray-50/50">
                        <div className="flex flex-col space-y-1">
                            <Label className="text-xs">Dia</Label>
                             <Controller
                                control={control}
                                name={`availability.${index}.day`}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {weekdays.map(day => <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>)}
                                    </SelectContent>
                                    </Select>
                                )}
                             />
                        </div>
                        <div className="flex flex-col space-y-1">
                            <Label className="text-xs">Início</Label>
                            <Input type="time" {...register(`availability.${index}.startTime`)} />
                        </div>
                        <div className="flex flex-col space-y-1">
                           <Label className="text-xs">Fim</Label>
                           <Input type="time" {...register(`availability.${index}.endTime`)} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="self-end text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                  ))}
                   {fields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma disponibilidade padrão definida.</p>
                   )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">Plantões Agendados (Mês Atual)</h3>
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
             <div className="mt-8 flex justify-end">
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
