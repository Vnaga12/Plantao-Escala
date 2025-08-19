
"use client";

import * as React from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import type { Shift, ShiftColor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const availableColors: { name: ShiftColor, class: string }[] = [
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'green', class: 'bg-green-500' },
  { name: 'purple', class: 'bg-purple-500' },
  { name: 'red', class: 'bg-red-500' },
  { name: 'yellow', class: 'bg-yellow-500' },
  { name: 'gray', class: 'bg-gray-500' },
  { name: 'pink', class: 'bg-pink-500' },
  { name: 'cyan', class: 'bg-cyan-500' },
  { name: 'orange', class: 'bg-orange-500' },
  { name: 'indigo', class: 'bg-indigo-500' },
  { name: 'teal', class: 'bg-teal-500' },
  { name: 'lime', class: 'bg-lime-500' },
];

type AddShiftFormValues = Omit<Shift, 'id' | 'date' | 'color'>;

type AddShiftDialogProps = {
  onAddShift: (shift: Omit<Shift, 'id' | 'color'>) => void;
  date: Date;
  shiftTypes: string[];
  colorMeanings: { color: ShiftColor, meaning: string }[];
};

export function AddShiftDialog({ onAddShift, date, shiftTypes, colorMeanings }: AddShiftDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<AddShiftFormValues>({
    defaultValues: {
      employeeName: "",
      startTime: "09:00",
      endTime: "17:00",
      role: shiftTypes[0] || "",
    }
  });

  const roleToColorMap = React.useMemo(() => new Map(colorMeanings.map(m => [m.meaning, m.color])), [colorMeanings]);
  const selectedRole = watch("role");
  const selectedColor = roleToColorMap.get(selectedRole) || 'gray';

  const onSubmit: SubmitHandler<AddShiftFormValues> = (data) => {
    const shiftDate = format(date, 'yyyy-MM-dd');
    onAddShift({ ...data, date: shiftDate });
    setIsOpen(false);
    reset();
  };
  
  React.useEffect(() => {
    if (isOpen) {
        reset({
            employeeName: "",
            startTime: "09:00",
            endTime: "17:00",
            role: shiftTypes[0] || "",
        });
    }
  }, [isOpen, shiftTypes, reset]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <PlusCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Turno</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para o novo turno em {format(date, "dd/MM/yyyy")}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Tipo</Label>
              <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                        <SelectContent>
                        {shiftTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                 )}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employeeName" className="text-right">Funcionário</Label>
              <Input id="employeeName" {...register("employeeName", { required: "O nome do funcionário é obrigatório" })} className="col-span-3" />
              {errors.employeeName && <p className="col-span-4 text-xs text-red-500 text-right">{errors.employeeName.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">Início</Label>
              <Input id="startTime" type="time" {...register("startTime", { required: "A hora de início é obrigatória" })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">Fim</Label>
              <Input id="endTime" type="time" {...register("endTime", { required: "A hora de término é obrigatória" })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Cor</Label>
              <div className="col-span-3 flex gap-2">
                {availableColors.map(color => (
                  <button
                    key={color.name}
                    type="button"
                    disabled
                    className={cn(
                      "h-6 w-6 rounded-full border-2",
                      color.class,
                      selectedColor === color.name ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent opacity-50'
                    )}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Salvar Turno</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    