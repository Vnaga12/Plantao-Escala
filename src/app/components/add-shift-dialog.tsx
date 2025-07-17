"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
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
import type { Shift } from "@/lib/types";

type AddShiftFormValues = Omit<Shift, 'id' | 'color' | 'day'>;

type AddShiftDialogProps = {
  onAddShift: (shift: Omit<Shift, 'id' | 'color'>) => void;
  day: number;
};

export function AddShiftDialog({ onAddShift, day }: AddShiftDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AddShiftFormValues>({
    defaultValues: {
      employeeName: "",
      startTime: "09:00",
      endTime: "17:00",
      role: "Nurse",
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
              <Select defaultValue="Nurse" onValueChange={(value: Shift['role']) => control.setValue('role', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Doctor">Médico(a)</SelectItem>
                  <SelectItem value="Nurse">Enfermeiro(a)</SelectItem>
                  <SelectItem value="Technician">Técnico(a)</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
          <DialogFooter>
            <Button type="submit">Salvar Turno</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
