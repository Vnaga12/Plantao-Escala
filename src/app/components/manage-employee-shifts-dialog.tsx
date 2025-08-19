
"use client";

import * as React from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import type { Employee, Shift, ShiftColor } from "@/lib/types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";


type ManageShiftsDialogProps = {
    children: React.ReactNode;
    employee: Employee;
    allEmployees: Employee[];
    assignedShifts: Shift[];
    onAddShift: (newShift: Omit<Shift, 'id' | 'color'>) => void;
    onUpdateShift: (updatedShift: Shift) => void;
    onDeleteShift: (shiftId: string) => void;
    shiftTypes: string[];
    currentDate: Date;
    colorMeanings: { color: ShiftColor, meaning: string }[];
};

type AddShiftFormValues = Omit<Shift, 'id' | 'employeeName' | 'color' | 'date'> & { date: Date };
type SwapShiftFormValues = { fromShiftId: string; toEmployeeId: string };

export function ManageEmployeeShiftsDialog({
    children,
    employee,
    allEmployees,
    assignedShifts,
    onAddShift,
    onUpdateShift,
    shiftTypes,
    currentDate,
    colorMeanings
}: ManageShiftsDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const { toast } = useToast();

    // Form for adding a shift
    const addForm = useForm<AddShiftFormValues>({
        defaultValues: {
            date: currentDate,
            startTime: "09:00",
            endTime: "17:00",
            role: shiftTypes[0] || "",
        },
    });

    // Form for swapping a shift
    const swapForm = useForm<SwapShiftFormValues>();
    
    const roleToColorMap = React.useMemo(() => new Map(colorMeanings.map(m => [m.meaning, m.color])), [colorMeanings]);
    
    const onAddSubmit: SubmitHandler<AddShiftFormValues> = (data) => {
        const newShift: Omit<Shift, 'id' | 'color'> = {
            date: format(data.date, 'yyyy-MM-dd'),
            role: data.role,
            startTime: data.startTime,
            endTime: data.endTime,
            employeeName: employee.name,
        };
        onAddShift(newShift);
        toast({ title: "Plantão Adicionado", description: `Novo plantão para ${employee.name} foi adicionado.` });
        setIsOpen(false);
    };
    
    const onSwapSubmit: SubmitHandler<SwapShiftFormValues> = (data) => {
        const toEmployee = allEmployees.find(e => e.id === data.toEmployeeId);
        const fromShift = assignedShifts.find(s => s.id === data.fromShiftId);
        
        if (toEmployee && fromShift) {
            onUpdateShift({ ...fromShift, employeeName: toEmployee.name });
            toast({ title: "Troca de Plantão Realizada", description: `${employee.name} trocou o plantão com ${toEmployee.name}.` });
            setIsOpen(false);
        } else {
             toast({ variant: "destructive", title: "Erro na Troca", description: "Não foi possível encontrar o funcionário ou o plantão." });
        }
    };

    React.useEffect(() => {
        if(isOpen) {
            addForm.reset({
                date: currentDate,
                startTime: "09:00",
                endTime: "17:00",
                role: shiftTypes[0] || "",
            });
            swapForm.reset();
        }
    }, [isOpen, currentDate, shiftTypes, addForm, swapForm]);


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gerenciar Plantões de {employee.name}</DialogTitle>
                    <DialogDescription>
                        Adicione um novo plantão ou troque um plantão existente com outro funcionário.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="add">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="add">Adicionar Plantão</TabsTrigger>
                        <TabsTrigger value="swap">Trocar Plantão</TabsTrigger>
                    </TabsList>
                    <TabsContent value="add">
                        <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 pt-4">
                             <div className="grid grid-cols-1 gap-2">
                                <Label htmlFor="date">Data</Label>
                                <Controller
                                    control={addForm.control}
                                    name="date"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                variant={"outline"}
                                                className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                                >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                                month={currentDate}
                                                locale={ptBR}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label htmlFor="startTime">Início</Label>
                                    <Input id="startTime" type="time" {...addForm.register("startTime")} />
                                </div>
                                <div>
                                    <Label htmlFor="endTime">Fim</Label>
                                    <Input id="endTime" type="time" {...addForm.register("endTime")} />
                                </div>
                            </div>
                             <div>
                                <Label htmlFor="role">Função</Label>
                                <Controller
                                    control={addForm.control}
                                    name="role"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                {shiftTypes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Adicionar Plantão</Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                    <TabsContent value="swap">
                       <form onSubmit={swapForm.handleSubmit(onSwapSubmit)} className="space-y-4 pt-4">
                           <div>
                                <Label>Plantão a ser trocado</Label>
                                <Controller
                                    control={swapForm.control}
                                    name="fromShiftId"
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Selecione o plantão"/></SelectTrigger>
                                            <SelectContent>
                                                {assignedShifts.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        {format(parseISO(s.date), 'dd/MM')} - {s.role} ({s.startTime}-{s.endTime})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {assignedShifts.length === 0 && <p className="text-xs text-muted-foreground mt-2">Nenhum plantão para trocar este mês.</p>}
                           </div>
                            <div>
                                <Label>Trocar com</Label>
                                <Controller
                                    control={swapForm.control}
                                    name="toEmployeeId"
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Selecione o funcionário"/></SelectTrigger>
                                            <SelectContent>
                                                {(allEmployees || []).filter(e => e.id !== employee.id).map(e => (
                                                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                           </div>
                           <DialogFooter>
                                <Button type="submit" disabled={assignedShifts.length === 0}>
                                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                                    Confirmar Troca
                                </Button>
                            </DialogFooter>
                       </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
