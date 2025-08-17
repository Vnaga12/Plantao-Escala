
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
import { Wand2, Loader2, Check, X, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Employee, Role, Shift, ShiftColor } from "@/lib/types";
import { suggestShiftAssignments } from "@/ai/flows/suggest-shifts";
import type { SuggestShiftAssignmentsOutput } from "@/ai/flows/suggest-shifts";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { EditShiftDialog } from "./edit-shift-dialog";

type SuggestShiftsDialogProps = {
  employees: Employee[];
  onApplySuggestions: (suggestions: Shift[]) => void;
  roles: string[];
};

const weekdayMap: { [key: string]: string } = {
  Sunday: "Domingo",
  Monday: "Segunda-feira",
  Tuesday: "Terça-feira",
  Wednesday: "Quarta-feira",
  Thursday: "Quinta-feira",
  Friday: "Sexta-feira",
  Saturday: "Sábado",
};

const formSchema = z.object({
  rolesToFill: z.array(z.string()).min(1, "Selecione pelo menos uma função."),
  scheduleConstraints: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SuggestShiftsDialog({ employees, onApplySuggestions = () => {}, roles }: SuggestShiftsDialogProps) {
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
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        rolesToFill: roles,
        scheduleConstraints: "",
      });
      setSuggestions(null);
      setIsLoading(false);
      setSelectedSuggestions([]);
    }
  }, [isOpen, form, roles]);


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setSuggestions(null);

    const shiftsToFill = data.rolesToFill.flatMap(role => {
        return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => ({
            day: day,
            startTime: '09:00', // Default, can be adjusted or made configurable
            endTime: '17:00', // Default
            role: role
        }))
    })

    try {
      const result = await suggestShiftAssignments({
        employees: employees.map(({ id, name, availability, preferences }) => ({ id, name, availability, preferences })),
        shifts: shiftsToFill,
        scheduleConstraints: data.scheduleConstraints || "",
      });
      setSuggestions(result);
      setEditableSuggestions(result.assignments);
      setSelectedSuggestions(result.assignments.map((_, index) => index)); // Select all by default
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
    const finalShifts: Shift[] = selectedSuggestions.map(index => {
      const suggestion = editableSuggestions[index];
      const employee = employees.find(e => e.id === suggestion.employeeId);
      return {
        id: `suggested-${Date.now()}-${index}`,
        date: suggestion.shiftDay, // This will be handled in the parent component
        employeeName: employee?.name || 'Desconhecido',
        role: suggestion.role,
        startTime: suggestion.shiftStartTime,
        endTime: suggestion.shiftEndTime,
        color: 'yellow' as ShiftColor, // Or determine color based on role
      };
    });
    
    onApplySuggestions(finalShifts);
    setIsOpen(false);
    toast({
        title: "Sugestões Aplicadas!",
        description: `${finalShifts.length} novos turnos foram adicionados ao calendário.`
    })
  };

  const handleUpdateSuggestion = (updatedShift: Shift, index: number) => {
    const newEditableSuggestions = [...editableSuggestions];
    const suggestionToUpdate = newEditableSuggestions[index];
    
    const employee = employees.find(e => e.name === updatedShift.employeeName);
    
    newEditableSuggestions[index] = {
      ...suggestionToUpdate,
      employeeId: employee?.id || suggestionToUpdate.employeeId,
      role: updatedShift.role,
      shiftStartTime: updatedShift.startTime,
      shiftEndTime: updatedShift.endTime,
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
                        <Label className="font-semibold">1. Funções a Preencher</Label>
                        <p className="text-sm text-muted-foreground mb-2">Selecione as funções que precisam de cobertura para a próxima semana.</p>
                        <div className="space-y-2 p-3 border rounded-md max-h-60 overflow-y-auto">
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
                        <Label htmlFor="scheduleConstraints" className="font-semibold">2. Restrições e Preferências</Label>
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
                <Label className="font-semibold mb-2">3. Revisar e Aplicar Sugestões</Label>
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
                                                    checked={selectedSuggestions.length === editableSuggestions.length}
                                                    onCheckedChange={(checked) => {
                                                        setSelectedSuggestions(checked ? editableSuggestions.map((_, index) => index) : []);
                                                    }}
                                                />
                                            </TableHead>
                                            <TableHead>Dia</TableHead>
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
                                            date: '', // Not needed for this dialog
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
                                            <TableCell>{weekdayMap[suggestion.shiftDay] || suggestion.shiftDay}</TableCell>
                                            <TableCell>{employee?.name || 'Desconhecido'}</TableCell>
                                            <TableCell>{suggestion.role}</TableCell>
                                            <TableCell>{suggestion.shiftStartTime} - {suggestion.shiftEndTime}</TableCell>
                                            <TableCell className="text-right">
                                                <EditShiftDialog 
                                                    shift={shiftForDialog} 
                                                    onUpdateShift={(updated) => handleUpdateSuggestion(updated, index)} 
                                                    roles={roles}
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
