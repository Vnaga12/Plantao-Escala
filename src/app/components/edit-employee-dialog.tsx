
"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, CalendarDays, Pencil, Hospital } from 'lucide-react';
import type { Employee, Shift } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const weekdays = [
    { value: "Monday", label: "Segunda-feira" },
    { value: "Tuesday", label: "Terça-feira" },
    { value: "Wednesday", label: "Quarta-feira" },
    { value: "Thursday", label: "Quinta-feira" },
    { value: "Friday", label: "Sexta-feira" },
    { value: "Saturday", label: "Sábado" },
    { value: "Sunday", label: "Domingo" },
];

type FormValues = Omit<Employee, 'id'>;

type EditEmployeeDialogProps = {
  employee: Employee;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  children: React.ReactNode;
  shifts: Shift[];
  currentDate: Date;
  onUpdateShift: (updatedShift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  roles: string[];
  calendarName: string;
};

export function EditEmployeeDialog({ 
    employee, 
    onUpdateEmployee, 
    onDeleteEmployee, 
    children,
    shifts,
    currentDate,
    onUpdateShift,
    onDeleteShift,
    roles,
    calendarName
}: EditEmployeeDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      name: employee.name,
      preferences: employee.preferences,
      availability: employee.availability,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "availability"
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: employee.name,
        preferences: employee.preferences,
        availability: employee.availability,
      });
    }
  }, [isOpen, employee, reset]);


  const onSubmit: SubmitHandler<FormValues> = (data) => {
    onUpdateEmployee({ ...data, id: employee.id });
    toast({
      title: "Perfil Atualizado",
      description: "As informações do funcionário foram salvas com sucesso.",
    });
    setIsOpen(false);
  };
  
  const handleDelete = () => {
    onDeleteEmployee(employee.id);
    toast({
      title: "Funcionário Excluído",
      description: `${employee.name} foi removido da equipe.`,
    });
    setIsOpen(false);
  }

  const assignedShifts = shifts.filter(s => s.employeeName === employee.name);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Editar Perfil: {employee.name}</DialogTitle>
            <DialogDescription>
              Atualize as informações, disponibilidade e gerencie os plantões atribuídos.
            </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-6 -mr-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-6 py-4">
                <div>
                    <Label htmlFor="name" className="font-semibold">Nome</Label>
                    <Input id="name" {...register("name", { required: "O nome é obrigatório" })} className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="preferences" className="font-semibold">Preferências</Label>
                    <Textarea
                        id="preferences"
                        {...register("preferences")}
                        placeholder="Nenhuma preferência listada."
                        className="mt-1"
                    />
                </div>
                
                <Separator />
                
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg text-gray-700">Plantões Atribuídos ({format(currentDate, "MMMM", { locale: ptBR })})</h3>
                    </div>
                    <div className="space-y-3">
                      {assignedShifts.length > 0 ? assignedShifts.map((shift) => (
                        <div key={shift.id} className="grid grid-cols-[auto,1fr,auto] items-center gap-4 p-3 border rounded-md bg-gray-50/50">
                          <div className="font-semibold text-center">
                            <div className="text-2xl">{shift.day}</div>
                            <div className="text-xs uppercase">{format(new Date(currentDate.getFullYear(), currentDate.getMonth(), shift.day), 'EEE', { locale: ptBR })}</div>
                          </div>
                          <div>
                            <div className="font-medium">{shift.role}</div>
                            <div className="text-sm text-muted-foreground">{shift.startTime} - {shift.endTime}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                <Hospital className="h-3.5 w-3.5" /> {calendarName}
                            </div>
                          </div>
                           <div className="flex items-center">
                            {/* NOTE: EditShiftDialog and other dialogs won't work nested. This is a placeholder for a future refactor. */}
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir este plantão?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta ação é permanente e não pode ser desfeita.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDeleteShift(shift.id)}>Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                           </div>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum plantão atribuído neste mês.</p>
                      )}
                    </div>
                </div>

                <Separator />

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg text-gray-700">Disponibilidade Padrão</h3>
                        <Button type="button" size="sm" variant="outline" onClick={() => append({ day: 'Monday', startTime: '09:00', endTime: '17:00' })}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar
                        </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {fields.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-[1fr,1fr,1fr,auto] items-center gap-2 p-2 border rounded-md bg-gray-50/50">
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
              </div>

              <DialogFooter className="mt-4 pt-4 border-t sm:justify-between sticky bottom-0 bg-background/95 py-3 -mx-6 px-6">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Funcionário
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                               Esta ação não pode ser desfeita. Isso irá excluir permanentemente o funcionário e pode afetar plantões existentes.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
