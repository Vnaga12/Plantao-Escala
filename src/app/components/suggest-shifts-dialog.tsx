
"use client";

import * as React from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
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
import { Wand2, Loader2, Check, X, Pencil, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Employee, Shift, ShiftColor } from "@/lib/types";
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

type SuggestShiftsDialogProps = {
  employees: Employee[];
  onApplySuggestions: (suggestions: Omit<Shift, 'id'>[]) => void;
  roles: string[];
  currentDate: Date;
};

const formSchema = z.object({
  rolesToFill: z.array(z.string()).min(1, "Selecione pelo menos uma função."),
  scheduleConstraints: z.string().optional(),
  startDate: z.date({ required_error: "A data de início é obrigatória."}),
  endDate: z.date({ required_error: "A data final é obrigatória."}),
}).refine((data) => data.endDate >= data.startDate, {
    message: "A data final deve ser posterior à data de início.",
    path: ["endDate"],
});

type FormValues = z.infer<typeof formSchema>;

export function SuggestShiftsDialog({ employees, onApplySuggestions = () => {}, roles, currentDate }: SuggestShiftsDialogProps) {
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
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        rolesToFill: roles,
        scheduleConstraints: "",
        startDate: startOfWeek(currentDate, { locale: ptBR }),
        endDate: endOfWeek(currentDate, { locale: ptBR }),
      });
      setSuggestions(null);
      setIsLoading(false);
      setSelectedSuggestions([]);
    }
  }, [isOpen, form, roles, currentDate]);


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setSuggestions(null);

    try {
      const result = await suggestShiftAssignments({
        employees: employees.map(({ id, name, unavailability, preferences }) => ({ id, name, unavailability, preferences })),
        rolesToFill: data.rolesToFill,
        scheduleConstraints: data.scheduleConstraints || "",
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
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
    const finalShifts: Omit<Shift, 'id'>[] = selectedSuggestions.map(index => {
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
            <div className="w-1/3 flex-shrink-0">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <Label className="font-semibold">1. Período da Escala</Label>
                        <p className="text-sm text-muted-foreground mb-2">Selecione as datas de início e fim para a geração dos turnos.</p>
                        <div className="grid grid-cols-2 gap-2">
                             <Controller
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor="startDate">Início</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                variant={"outline"}
                                                className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}
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
                                        <Label htmlFor="endDate">Fim</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                variant={"outline"}
                                                className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}
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
                        <Label className="font-semibold">2. Funções a Preencher</Label>
                        <p className="text-sm text-muted-foreground mb-2">Selecione as funções que precisam de cobertura para o período.</p>
                        <div className="space-y-2 p-3 border rounded-md max-h-40 overflow-y-auto">
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
                        <Label htmlFor="scheduleConstraints" className="font-semibold">3. Restrições e Preferências</Label>
                         <p className="text-sm text-muted-foreground mb-2">Adicione quaisquer regras ou restrições gerais para o cronograma (opcional).</p>
                        <Textarea
                        id="scheduleConstraints"
                        placeholder="Ex: Pelo menos 2 médicos de plantão no fim de semana. Dra. Alice não pode trabalhar às quartas-feiras."
                        {...form.register("scheduleConstraints")}
                        className="h-24"
                        />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando Sugestões...
                            </>
                        ) : (
                            <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Gerar Sugestões
                            </>
                        )}
                    </Button>
                </form>
            </div>

            {/* Results Section */}
            <div className="flex-1 flex flex-col overflow-hidden border-l pl-6">
                <Label className="font-semibold mb-2">4. Revisar e Aplicar Sugestões</Label>
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
                                            <TableHead>Horário</TableHead>
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
                                            <TableCell>{format(parseISO(suggestion.shiftDate), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{employee?.name || 'Desconhecido'}</TableCell>
                                            <TableCell>{suggestion.role}</TableCell>
                                            <TableCell>{suggestion.shiftStartTime} - {suggestion.shiftEndTime}</TableCell>
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
