
"use client";

import * as React from "react";
import { useForm, Controller, SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Check, X, Pencil, Trash2, Calendar as CalendarIcon, Minus, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Employee, Shift, ShiftColor, Calendar as CalendarType } from "@/lib/types";
import { suggestShiftAssignments } from "@/lib/actions";
import type { SuggestShiftAssignmentsOutput } from "@/ai/flows/suggest-shifts";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditShiftDialog } from "./edit-shift-dialog";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const weekdays = [
    { id: "Sunday", label: "Domingo" },
    { id: "Monday", label: "Segunda" },
    { id: "Tuesday", label: "Terça" },
    { id: "Wednesday", label: "Quarta" },
    { id: "Thursday", label: "Quinta" },
    { id: "Friday", label: "Sexta" },
    { id: "Saturday", label: "Sábado" },
];

type SuggestShiftsDialogProps = {
  employees: Employee[];
  onApplySuggestions: (suggestions: (Omit<Shift, 'id'> & { calendarId: string })[]) => void;
  roles: string[];
  currentDate: Date;
  calendars: CalendarType[];
  activeCalendarId: string;
};

const formSchema = z.object({
  rolesToFill: z.array(z.string()).min(1, "Selecione pelo menos uma função."),
  scheduleConstraints: z.string().optional(),
  startDate: z.date({ required_error: "A data de início é obrigatória."}),
  endDate: z.date({ required_error: "A data final é obrigatória."}),
  calendarIds: z.array(z.string()).min(1, "Selecione pelo menos uma turma."),
  allowedDays: z.array(z.string()).optional(),
  shiftsPerPerson: z.array(z.object({
      role: z.string(),
      count: z.number().min(1)
  })).optional(),
}).refine((data) => data.endDate >= data.startDate, {
    message: "A data final deve ser posterior à data de início.",
    path: ["endDate"],
});

type FormValues = z.infer<typeof formSchema>;

export function SuggestShiftsDialog({ employees, onApplySuggestions = () => {}, roles, currentDate, calendars, activeCalendarId }: SuggestShiftsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SuggestShiftAssignmentsOutput | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = React.useState<number[]>([]);
  const [editableSuggestions, setEditableSuggestions] = React.useState<SuggestShiftAssignmentsOutput['assignments']>([]);

  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rolesToFill: roles,
      scheduleConstraints: "",
      startDate: startOfWeek(currentDate, { locale: ptBR }),
      endDate: endOfWeek(currentDate, { locale: ptBR }),
      calendarIds: activeCalendarId !== 'all' ? [activeCalendarId] : [],
      allowedDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      shiftsPerPerson: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
      control: form.control,
      name: "shiftsPerPerson"
  });
  const watchedRoles = form.watch("rolesToFill");

  React.useEffect(() => {
    const existingRoles = new Set(fields.map(f => f.role));
    const selectedRoles = new Set(watchedRoles);

    // Add roles that are selected but not in the field array
    const rolesToAdd = watchedRoles.filter(role => !existingRoles.has(role));
    if (rolesToAdd.length > 0) {
      append(rolesToAdd.map(role => ({ role, count: 1 })));
    }

    // Find indices of roles to remove
    const rolesToRemoveIndices: number[] = [];
    fields.forEach((field, index) => {
        if (!selectedRoles.has(field.role)) {
            rolesToRemoveIndices.push(index);
        }
    });
    // Remove from the end to avoid index shifting issues
    if (rolesToRemoveIndices.length > 0) {
      remove(rolesToRemoveIndices.sort((a, b) => b - a));
    }
  }, [watchedRoles, fields, append, remove]);


  React.useEffect(() => {
    if (isOpen) {
      const defaultShiftsPerPerson = roles.map(r => ({ role: r, count: 1}));
      form.reset({
        rolesToFill: roles,
        scheduleConstraints: "",
        startDate: startOfWeek(currentDate, { locale: ptBR }),
        endDate: endOfWeek(currentDate, { locale: ptBR }),
        calendarIds: activeCalendarId !== 'all' ? [activeCalendarId] : [],
        allowedDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        shiftsPerPerson: defaultShiftsPerPerson,
      });
      setSuggestions(null);
      setIsLoading(false);
      setSelectedSuggestions([]);
    }
  }, [isOpen, roles, currentDate, activeCalendarId, form]);


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setSuggestions(null);

    const selectedCalendars = calendars.filter(c => data.calendarIds.includes(c.id));
    const employeesForCalendars = employees.filter(e => e.calendarIds?.some(cid => data.calendarIds.includes(cid)));
    
    if (employeesForCalendars.length === 0) {
        toast({
            variant: "destructive",
            title: "Nenhum Funcionário Encontrado",
            description: "Não há funcionários associados às turmas selecionadas. Adicione funcionários às turmas antes de gerar turnos.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const result = await suggestShiftAssignments({
        employees: employeesForCalendars.map(({ id, name, unavailability, preferences }) => ({ id, name, unavailability, preferences })),
        rolesToFill: data.rolesToFill,
        scheduleConstraints: data.scheduleConstraints || "",
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        calendars: selectedCalendars.map(c => ({ id: c.id, name: c.name })),
        allowedDays: data.allowedDays,
        shiftsPerPerson: data.shiftsPerPerson?.reduce((acc, curr) => {
            if(curr.role && curr.count) {
              acc[curr.role] = curr.count;
            }
            return acc;
        }, {} as Record<string, number>),
      });
        
      if (result && result.assignments) {
          setSuggestions(result);
          setEditableSuggestions(result.assignments);
          setSelectedSuggestions(result.assignments.map((_, index) => index)); // Select all by default
      } else {
        toast({
            variant: "destructive",
            title: "Erro ao Sugerir Turnos",
            description: "A IA não conseguiu gerar sugestões. Verifique as restrições ou tente novamente.",
        });
      }
    } catch (error) {
      console.error("Error suggesting shifts:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Sugerir Turnos",
        description: "Ocorreu um erro ao tentar obter sugestões. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!suggestions) return;
    const finalShifts = selectedSuggestions.map(index => {
      const suggestion = editableSuggestions[index];
      const employee = employees.find(e => e.id === suggestion.employeeId);
      return {
        id: `suggested-${Date.now()}-${index}`,
        date: suggestion.shiftDate, // The AI now returns the full date string
        employeeName: employee?.name || 'Desconhecido',
        role: suggestion.role,
        startTime: suggestion.shiftStartTime,
        endTime: suggestion.shiftEndTime,
        color: 'yellow' as ShiftColor, 
        calendarId: suggestion.calendarId,
      };
    });
    
    onApplySuggestions(finalShifts);
    setIsOpen(false);
  };

  const handleUpdateSuggestion = (updatedShift: Shift, index: number) => {
    const newEditableSuggestions = [...editableSuggestions];
    const suggestionToUpdate = newEditableSuggestions[index];
    
    const employee = employees.find(e => e.name === updatedShift.employeeName);
    
    newEditableSuggestions[index] = {
      ...suggestionToUpdate,
      employeeId: employee?.id || suggestionToUpdate.employeeId,
      role: updatedShift.role,
      startTime: updatedShift.startTime,
      endTime: updatedShift.endTime,
    };
    setEditableSuggestions(newEditableSuggestions);
  };
  
  const handleDeleteSuggestion = (index: number) => {
    const newEditableSuggestions = editableSuggestions.filter((_, i) => i !== index);
    setEditableSuggestions(newEditableSuggestions);
    setSelectedSuggestions(prev => prev.filter(i => i !== index).map(i => (i > index ? i - 1 : i)));
  };
  
  const getCalendarNameById = (id: string) => calendars.find(c => c.id === id)?.name || 'Desconhecida';


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wand2 className="mr-2 h-4 w-4" />
          Sugerir Turnos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sugerir Turnos com IA</DialogTitle>
          <DialogDescription>
            Use a IA para preencher automaticamente a escala com base nas funções necessárias e na disponibilidade da equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden pt-4">
            {/* Form Section */}
            <ScrollArea className="w-1/3 flex-shrink-0 pr-6 -mr-6">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <Label className="font-semibold">1. Período da Escala</Label>
                         <div className="grid grid-cols-2 gap-2 mt-2">
                             <Controller
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor="startDate" className="text-xs">Início</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                variant={"outline"}
                                                className={cn("justify-start text-left font-normal h-9", !field.value && "text-muted-foreground")}
                                                >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "dd/MM/y") : <span>Escolha</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                            />
                             <Controller
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor="endDate" className="text-xs">Fim</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                variant={"outline"}
                                                className={cn("justify-start text-left font-normal h-9", !field.value && "text-muted-foreground")}
                                                >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "dd/MM/y") : <span>Escolha</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                            />
                        </div>
                         {form.formState.errors.endDate && <p className="text-xs text-red-500 mt-1">{form.formState.errors.endDate.message}</p>}
                    </div>

                    <div>
                        <Label className="font-semibold">2. Turmas para Escala</Label>
                        <div className="space-y-2 p-3 border rounded-md max-h-40 overflow-y-auto mt-2">
                        {calendars.map((cal) => (
                            <div key={cal.id} className="flex items-center space-x-2">
                                <Controller
                                    control={form.control}
                                    name="calendarIds"
                                    render={({ field }) => (
                                        <Checkbox
                                            id={`cal-${cal.id}`}
                                            checked={field.value?.includes(cal.id)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...(field.value || []), cal.id])
                                                : field.onChange(field.value?.filter((value) => value !== cal.id));
                                            }}
                                        />
                                    )}
                                />
                                <Label htmlFor={`cal-${cal.id}`} className="font-normal">{cal.name}</Label>
                            </div>
                        ))}
                        </div>
                         {form.formState.errors.calendarIds && <p className="text-xs text-red-500 mt-1">{form.formState.errors.calendarIds.message}</p>}
                    </div>

                     <div>
                        <Label className="font-semibold">3. Dias de Trabalho</Label>
                        <Controller
                            control={form.control}
                            name="allowedDays"
                            render={({ field }) => (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {weekdays.map(day => (
                                        <div key={day.id} className="flex items-center">
                                            <Checkbox
                                                id={`day-${day.id}`}
                                                checked={field.value?.includes(day.id)}
                                                onCheckedChange={(checked) => {
                                                    const newValue = checked
                                                        ? [...(field.value || []), day.id]
                                                        : (field.value || []).filter(id => id !== day.id);
                                                    field.onChange(newValue);
                                                }}
                                                className="hidden peer"
                                            />
                                            <Label htmlFor={`day-${day.id}`} className="px-3 py-1 border rounded-full cursor-pointer text-sm peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary transition-colors">{day.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                         />
                    </div>
                    

                    <div>
                        <Label className="font-semibold">4. Funções a Preencher</Label>
                        <div className="space-y-2 p-3 border rounded-md max-h-40 overflow-y-auto mt-2">
                        {roles.map((role) => (
                            <div key={role} className="flex items-center space-x-2">
                                <Controller
                                    control={form.control}
                                    name="rolesToFill"
                                    render={({ field }) => (
                                        <Checkbox
                                            id={role}
                                            checked={field.value?.includes(role)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...(field.value || []), role])
                                                : field.onChange(field.value?.filter((value) => value !== role));
                                            }}
                                        />
                                    )}
                                />
                                <Label htmlFor={role} className="font-normal">{role}</Label>
                            </div>
                        ))}
                        </div>
                         {form.formState.errors.rolesToFill && <p className="text-xs text-red-500 mt-1">{form.formState.errors.rolesToFill.message}</p>}
                    </div>

                    <div>
                        <Label className="font-semibold">5. Limite de Plantões por Pessoa</Label>
                         <div className="space-y-2 mt-2">
                             {fields.map((field, index) => (
                                 <div key={field.id} className="flex items-center justify-between gap-2">
                                     <Label htmlFor={`shiftsPerPerson.${index}.count`} className="text-sm flex-1 truncate">{field.role}</Label>
                                      <div className="flex items-center gap-1">
                                         <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => update(index, { ...field, count: Math.max(1, field.count - 1) })}><Minus className="h-3 w-3"/></Button>
                                         <Input 
                                            id={`shiftsPerPerson.${index}.count`}
                                            type="number"
                                            min={1}
                                            className="h-7 w-12 text-center"
                                            {...form.register(`shiftsPerPerson.${index}.count`, { valueAsNumber: true })}
                                         />
                                          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => update(index, { ...field, count: (field.count || 0) + 1 })}><Plus className="h-3 w-3" /></Button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>


                    <div>
                        <Label htmlFor="scheduleConstraints" className="font-semibold">6. Restrições e Preferências</Label>
                        <Textarea
                        id="scheduleConstraints"
                        placeholder="Ex: Pelo menos 2 médicos de plantão no fim de semana. Dra. Alice não pode trabalhar às quartas-feiras."
                        {...form.register("scheduleConstraints")}
                        className="h-24 mt-2"
                        />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando Sugestões... </> ) 
                                   : ( <> <Wand2 className="mr-2 h-4 w-4" /> Gerar Sugestões </> )}
                    </Button>
                </form>
            </ScrollArea>

            {/* Results Section */}
            <div className="flex-1 flex flex-col overflow-hidden border-l pl-6">
                <Label className="font-semibold mb-2">Resultados</Label>
                <div className="flex-1 overflow-y-auto -mr-6 pr-6">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">Analisando disponibilidade e regras...</p>
                            <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
                        </div>
                    )}

                    {suggestions && (
                        <div className="flex flex-col h-full">
                             <Alert className="mb-4">
                                <AlertTitle>Resumo da IA</AlertTitle>
                                <AlertDescription>
                                    {suggestions.summary}
                                </AlertDescription>
                            </Alert>
                            <ScrollArea className="flex-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40px]">
                                                <Checkbox
                                                    checked={selectedSuggestions.length === editableSuggestions.length && editableSuggestions.length > 0}
                                                    onCheckedChange={(checked) => {
                                                        setSelectedSuggestions(checked ? editableSuggestions.map((_, index) => index) : []);
                                                    }}
                                                />
                                            </TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Funcionário</TableHead>
                                            <TableHead>Função</TableHead>
                                            <TableHead>Turma</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {editableSuggestions.map((suggestion, index) => {
                                        const employee = employees.find(e => e.id === suggestion.employeeId);
                                        const shiftForDialog: Shift = {
                                            id: `suggested-${index}`,
                                            date: suggestion.shiftDate,
                                            employeeName: employee?.name || '',
                                            role: suggestion.role,
                                            startTime: suggestion.shiftStartTime,
                                            endTime: suggestion.shiftEndTime,
                                            color: 'yellow'
                                        };
                                        return (
                                        <TableRow key={index} className={selectedSuggestions.includes(index) ? "bg-muted/50" : ""}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedSuggestions.includes(index)}
                                                    onCheckedChange={(checked) => {
                                                        setSelectedSuggestions(prev => 
                                                            checked ? [...prev, index] : prev.filter(i => i !== index)
                                                        );
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>{format(parseISO(suggestion.shiftDate), 'dd/MM/yy')}</TableCell>
                                            <TableCell>{employee?.name || 'Desconhecido'}</TableCell>
                                            <TableCell>{suggestion.role}</TableCell>
                                            <TableCell>{getCalendarNameById(suggestion.calendarId)}</TableCell>
                                            <TableCell className="text-right">
                                                <EditShiftDialog 
                                                    shift={shiftForDialog} 
                                                    onUpdateShift={(updated) => handleUpdateSuggestion(updated, index)} 
                                                    shiftTypes={roles}
                                                    colorMeanings={[]}
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSuggestion(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                            
                        </div>
                    )}

                    {!isLoading && !suggestions && (
                         <div className="flex flex-col items-center justify-center h-full text-center p-8 border-dashed border-2 rounded-lg">
                            <p className="text-lg font-medium text-muted-foreground">As sugestões de turno aparecerão aqui.</p>
                            <p className="text-sm text-muted-foreground">Preencha o formulário à esquerda para começar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={isLoading || !suggestions || selectedSuggestions.length === 0}>
            <Check className="mr-2 h-4 w-4" />
            Aplicar {selectedSuggestions.length > 0 ? `(${selectedSuggestions.length})` : ''} Sugestões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
