
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
import { Plus, Trash2, Save, Hospital, Pencil, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import type { Employee, Shift, ShiftColor, Role } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { format, addMonths, subMonths, isSameMonth, parseISO, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EditShiftDialog } from "./edit-shift-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManageEmployeeShiftsDialog } from "./manage-employee-shifts-dialog";

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
  allEmployees: Employee[];
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  children: React.ReactNode;
  shifts: Shift[];
  currentDate: Date;
  onUpdateShift: (updatedShift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onAddShift: (newShift: Omit<Shift, 'id' | 'color'>) => void;
  roles: Role[];
  allShiftRoles: string[];
  calendarName: string;
  colorMeanings: { color: ShiftColor, meaning: string }[];
};

export function EditEmployeeDialog({ 
    employee,
    allEmployees, 
    onUpdateEmployee, 
    onDeleteEmployee, 
    children,
    shifts,
    currentDate,
    onUpdateShift,
    onDeleteShift,
    onAddShift,
    roles,
    allShiftRoles,
    calendarName,
    colorMeanings
}: EditEmployeeDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewedMonth, setViewedMonth] = React.useState(currentDate);
  const { toast } = useToast();

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      name: employee.name,
      preferences: employee.preferences,
      availability: employee.availability,
      roleId: employee.roleId,
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
        roleId: employee.roleId,
      });
      setViewedMonth(currentDate);
    }
  }, [isOpen, employee, reset, currentDate]);


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
      description: `${employee.name} foi removido do grupo.`,
    });
    setIsOpen(false);
  }

  const allAssignedShifts = shifts.filter(s => s.employeeName === employee.name);
  const assignedShiftsForMonth = allAssignedShifts.filter(s => {
    const shiftDate = parseISO(s.date);
    return isSameMonth(shiftDate, viewedMonth);
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
            <DialogHeader className="p-6 pb-2 flex-shrink-0">
                <DialogTitle>Editar Perfil: {employee.name}</DialogTitle>
                <DialogDescription>
                  Atualize as informações, disponibilidade e gerencie os plantões atribuídos.
                </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0 px-6">
                <Tabs defaultValue="profile" className="h-full flex flex-col">
                    <TabsList className="flex-shrink-0">
                        <TabsTrigger value="profile">Perfil</TabsTrigger>
                        <TabsTrigger value="shifts">Plantões Atribuídos</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex-1 min-h-0 overflow-y-auto mt-4 pr-2">
                        <TabsContent value="profile">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name" className="font-semibold">Nome</Label>
                                        <Input id="name" {...register("name", { required: "O nome é obrigatório" })} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="roleId" className="font-semibold">Função</Label>
                                        <Controller
                                            name="roleId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Selecione uma função" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="null">Nenhuma</SelectItem>
                                                        {roles.map(role => (
                                                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
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
                        </TabsContent>
                        
                        <TabsContent value="shifts">
                           <div className="flex justify-center items-center mb-4 gap-2">
                                <Button type="button" variant="ghost" size="icon" onClick={() => setViewedMonth(prev => subMonths(prev, 1))}>
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <span className="w-40 text-center font-semibold text-gray-700 capitalize">
                                  {format(viewedMonth, "MMMM yyyy", { locale: ptBR })}
                                </span>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setViewedMonth(prev => addMonths(prev, 1))}>
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                                <ManageEmployeeShiftsDialog
                                    employee={employee}
                                    allEmployees={allEmployees}
                                    assignedShifts={assignedShiftsForMonth}
                                    onUpdateShift={onUpdateShift}
                                    onAddShift={onAddShift}
                                    onDeleteShift={onDeleteShift}
                                    roles={allShiftRoles}
                                    currentDate={viewedMonth}
                                    colorMeanings={colorMeanings}
                                >
                                    <Button type="button" variant="outline" size="sm">
                                        <Settings2 className="mr-2 h-4 w-4" />
                                        Gerenciar Plantões
                                    </Button>
                                </ManageEmployeeShiftsDialog>
                           </div>

                            <div className="space-y-3">
                            {assignedShiftsForMonth.length > 0 ? assignedShiftsForMonth.map((shift) => {
                                const shiftDate = parseISO(shift.date);
                                return (
                                <div key={shift.id} className="grid grid-cols-[auto,1fr,auto] items-center gap-4 p-3 border rounded-md bg-gray-50/50">
                                <div className="font-semibold text-center">
                                    <div className="text-2xl">{getDate(shiftDate)}</div>
                                    <div className="text-xs uppercase">{format(shiftDate, 'EEE', { locale: ptBR })}</div>
                                </div>
                                <div>
                                    <div className="font-medium">{shift.role}</div>
                                    <div className="text-sm text-muted-foreground">{shift.startTime} - {shift.endTime}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                        <Hospital className="h-3.5 w-3.5" /> {calendarName}
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <EditShiftDialog shift={shift} onUpdateShift={onUpdateShift} roles={allShiftRoles} colorMeanings={colorMeanings} />
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
                            )}) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhum plantão atribuído neste mês.</p>
                            )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 sm:justify-between bg-background">
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
                            <AlertDialogAction onClick={handleDelete}>Excluir Funcionário</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
