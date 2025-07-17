
"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import type { Employee } from "@/lib/types";
import { getShiftSuggestions } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Trash2, Plus, Loader2, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { SuggestShiftAssignmentsInput, SuggestShiftAssignmentsOutput } from "@/ai/flows/suggest-shifts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditEmployeeDialog } from "./edit-employee-dialog";


type SuggestShiftsDialogProps = {
  employees: Employee[];
  onApplySuggestions: (suggestions: SuggestShiftAssignmentsOutput['assignments']) => void;
  roles: string[];
};

type FormValues = SuggestShiftAssignmentsInput;

const weekdays = [
    { value: "Monday", label: "Segunda-feira" },
    { value: "Tuesday", label: "Terça-feira" },
    { value: "Wednesday", label: "Quarta-feira" },
    { value: "Thursday", label: "Quinta-feira" },
    { value: "Friday", label: "Sexta-feira" },
    { value: "Saturday", label: "Sábado" },
    { value: "Sunday", label: "Domingo" },
];

export function SuggestShiftsDialog({ employees: initialEmployees, onApplySuggestions, roles }: SuggestShiftsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SuggestShiftAssignmentsOutput | null>(null);
  const { toast } = useToast();

  const { register, control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      employees: initialEmployees,
      shifts: [{ day: "Monday", startTime: "09:00", endTime: "17:00", role: roles[0] || "" }],
      scheduleConstraints: "Garantir que haja pelo menos um médico de plantão em todos os momentos. Nenhum funcionário deve trabalhar mais de 40 horas por semana.",
    },
  });
  
  // Keep form in sync with external changes
  React.useEffect(() => {
    if (isOpen) {
        reset({
            employees: initialEmployees,
            shifts: [{ day: "Monday", startTime: "09:00", endTime: "17:00", role: roles[0] || "" }],
            scheduleConstraints: "Garantir que haja pelo menos um médico de plantão em todos os momentos. Nenhum funcionário deve trabalhar mais de 40 horas por semana.",
        });
    }
  }, [initialEmployees, roles, reset, isOpen]);

  const {
    fields: employeeFields,
    // append: appendEmployee, // We don't want to add employees here, but in the sidebar
    remove: removeEmployee,
  } = useFieldArray({ control, name: "employees" });
  
  const {
    fields: shiftFields,
    append: appendShift,
    remove: removeShift,
  } = useFieldArray({ control, name: "shifts" });

  const currentEmployees = watch("employees");

  const handleUpdateEmployeeInForm = (updatedEmployee: Employee) => {
    const employeeIndex = employeeFields.findIndex(emp => emp.id === updatedEmployee.id);
    if(employeeIndex > -1) {
        // `update` from useFieldArray is a bit weird with types, setValue is more reliable
        setValue(`employees.${employeeIndex}`, updatedEmployee);
    }
  };

  const handleDeleteEmployeeInForm = (employeeId: string) => {
    const employeeIndex = employeeFields.findIndex(emp => emp.id === employeeId);
    if(employeeIndex > -1) {
        removeEmployee(employeeIndex);
    }
  }


  const handleFormSubmit = async (data: FormValues) => {
    setIsPending(true);
    setSuggestions(null);
    
    // Ensure all employees have IDs for the AI flow
    const processedData = {
        ...data,
        employees: data.employees.map(emp => ({...emp, id: emp.id || `temp-${Math.random()}`}))
    }

    const result = await getShiftSuggestions(processedData);
    setIsPending(false);

    if (result.success && result.data) {
      setSuggestions(result.data);
      toast({
        title: "Sugestões Prontas",
        description: "A IA gerou sugestões de turnos.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: result.error,
      });
    }
  };
  
  const handleApply = () => {
    if (suggestions) {
      onApplySuggestions(suggestions.assignments);
      setIsOpen(false);
      setSuggestions(null);
    }
  };

  const EmployeeFormFields = ({ index, control, register }: { index: number; control: any; register: any }) => {
    const { fields, append, remove } = useFieldArray({
      control,
      name: `employees.${index}.availability`,
    });
  
    return (
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Disponibilidade</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ day: 'Monday', startTime: '09:00', endTime: '17:00' })}
          >
            <Plus className="mr-2 h-3 w-3" /> Adicionar
          </Button>
        </div>
        <div className="space-y-2 pl-2">
          {fields.map((item, k) => (
            <div key={item.id} className="grid grid-cols-[1fr,1fr,auto] items-center gap-2">
                <Controller
                  control={control}
                  name={`employees.${index}.availability.${k}.day`}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {weekdays.map(day => <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              <Input type="time" {...register(`employees.${index}.availability.${k}.startTime`)} />
              <div className="flex items-center gap-1">
                <Input type="time" {...register(`employees.${index}.availability.${k}.endTime`)} />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(k)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {fields.length === 0 && <p className="text-xs text-muted-foreground pt-2">Nenhuma disponibilidade especificada.</p>}
        </div>
      </div>
    );
  };

  const getDayLabel = (dayValue: string) => {
    return weekdays.find(d => d.value === dayValue)?.label || dayValue;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles />
          Sugerir Turnos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sugestões de Turnos com IA</DialogTitle>
          <DialogDescription>
            Defina sua equipe e os turnos necessários, e deixe a IA construir o cronograma ideal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto">
          <Tabs defaultValue="employees" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="employees">Equipe ({currentEmployees.length})</TabsTrigger>
              <TabsTrigger value="shifts">Turnos a Preencher</TabsTrigger>
              <TabsTrigger value="constraints">Restrições</TabsTrigger>
              {suggestions && <TabsTrigger value="suggestions">Sugestões</TabsTrigger>}
            </TabsList>
            <ScrollArea className="flex-1 p-1">
              <TabsContent value="employees" className="mt-2">
                  <p className="text-sm text-muted-foreground mb-4">A equipe listada é a do hospital selecionado. Use esta aba para ajustar as preferências e disponibilidade para esta sugestão específica.</p>
                  {employeeFields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg mb-4 bg-background">
                          <div className="flex justify-between items-center mb-2">
                             <Label className="font-semibold">{currentEmployees[index]?.name || `Funcionário #${index + 1}`}</Label>
                             <div className="flex items-center gap-2">
                               {/* EditEmployeeDialog expects a lot of props that we don't have here. 
                                   A simpler approach is to edit the details inline for now.
                                */}
                             </div>
                          </div>
                          <Input {...register(`employees.${index}.name`)} placeholder="Nome" className="mb-2" />
                          <Textarea {...register(`employees.${index}.preferences`)} placeholder="Preferências (ex: prefere turnos da manhã)" />
                          <EmployeeFormFields index={index} control={control} register={register} />
                      </div>
                  ))}
                   {employeeFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum funcionário nesta equipe. Adicione funcionários na barra lateral.</p>}
              </TabsContent>
              <TabsContent value="shifts" className="mt-2">
                  {shiftFields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-2 bg-background">
                           <Controller
                              control={control}
                              name={`shifts.${index}.day`}
                              render={({ field }) => (
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                                  <SelectContent>
                                    {weekdays.map(day => <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>)}
                                  </SelectContent>
                                  </Select>
                              )}
                          />
                          <Input {...register(`shifts.${index}.startTime`)} type="time" />
                          <Input {...register(`shifts.${index}.endTime`)} type="time" />
                          <div className="flex items-center gap-2">
                            <Controller
                                control={control}
                                name={`shifts.${index}.role`}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                    </SelectContent>
                                    </Select>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeShift(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                          </div>
                      </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => appendShift({ day: 'Tuesday', startTime: '09:00', endTime: '17:00', role: roles[0] || '' })}>
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Turno
                  </Button>
              </TabsContent>
              <TabsContent value="constraints" className="mt-2">
                 <Textarea {...register('scheduleConstraints')} rows={10} placeholder="ex: Garantir justiça nos turnos de fim de semana." />
              </TabsContent>
              <TabsContent value="suggestions" className="mt-2">
                  {isPending && <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2"/> Gerando...</div>}
                  {suggestions && (
                      <div className="bg-background rounded-lg p-4">
                          <h3 className="font-bold mb-2 text-lg">Resumo e Justificativa da IA</h3>
                          <p className="text-sm bg-muted p-3 rounded-md mb-4">{suggestions.summary}</p>
                          <h3 className="font-bold mb-2 text-lg">Atribuições Sugeridas</h3>
                          <div className="space-y-2">
                          {suggestions.assignments.map((a, i) => (
                              <div key={i} className="text-sm p-3 border rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white">
                                  <span className="font-semibold">{currentEmployees.find(e => e.id === a.employeeId)?.name}</span>
                                  <span>{a.role} na {getDayLabel(a.shiftDay)}</span>
                                  <span className="font-mono">{a.shiftStartTime} - {a.shiftEndTime}</span>
                              </div>
                          ))}
                          </div>
                      </div>
                  )}
              </TabsContent>
            </ScrollArea>
            <div className="mt-auto pt-4 border-t flex justify-end gap-2 flex-shrink-0">
              {suggestions ? (
                 <Button type="button" onClick={handleApply}>Aplicar ao Calendário</Button>
              ) : (
                <Button type="submit" disabled={isPending || currentEmployees.length === 0}>
                  {isPending ? <><Loader2 className="animate-spin mr-2"/> Pensando...</> : "Gerar Sugestões"}
                </Button>
              )}
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
