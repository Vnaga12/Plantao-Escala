
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

const availableColors: { name: ShiftColor, class: string }[] = [
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'green', class: 'bg-green-500' },
  { name: 'purple', class: 'bg-purple-500' },
  { name: 'red', class: 'bg-red-500' },
  { name: 'yellow', class: 'bg-yellow-500' },
  { name: 'gray', class: 'bg-gray-500' },
];

type AddShiftFormValues = Omit<Shift, 'id' | 'day'>;

type AddShiftDialogProps = {
  onAddShift: (shift: Omit<Shift, 'id'>) => void;
  day: number;
  roles: string[];
};

export function AddShiftDialog({ onAddShift, day, roles }: AddShiftDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AddShiftFormValues>({
    defaultValues: {
      employeeName: "",
      startTime: "09:00",
      endTime: "17:00",
      role: roles[0] || "",
      color: 'blue'
    }
  });

  const onSubmit: SubmitHandler<AddShiftFormValues> = (data) => {
    onAddShift({ ...data, day });
    setIsOpen(false);
    reset();
  };

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
              Preencha os detalhes para o novo turno no dia {day}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Função</Label>
              <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                        <SelectContent>
                        {roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
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
               <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <div className="col-span-3 flex gap-2">
                    {availableColors.map(color => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => field.onChange(color.name)}
                        className={cn(
                          "h-6 w-6 rounded-full border-2",
                          color.class,
                          field.value === color.name ? 'border-primary' : 'border-transparent'
                        )}
                        aria-label={`Select ${color.name} color`}
                      />
                    ))}
                  </div>
                )}
              />
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
