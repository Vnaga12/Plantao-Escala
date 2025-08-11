
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
import { Edit, Pencil } from "lucide-react";
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

type EditShiftFormValues = Omit<Shift, 'id' | 'date'>;

type EditShiftDialogProps = {
  shift: Shift;
  onUpdateShift: (shift: Shift) => void;
  roles: string[];
  colorMeanings: { color: ShiftColor, meaning: string }[];
};

export function EditShiftDialog({ onUpdateShift, shift, roles, colorMeanings }: EditShiftDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<EditShiftFormValues>({
    defaultValues: {
      employeeName: shift.employeeName,
      startTime: shift.startTime,
      endTime: shift.endTime,
      role: shift.role,
      color: shift.color
    }
  });

  const roleToColorMap = React.useMemo(() => new Map(colorMeanings.map(m => [m.meaning, m.color])), [colorMeanings]);
  const selectedRole = watch("role");

  React.useEffect(() => {
    const newColor = roleToColorMap.get(selectedRole) || 'gray';
    setValue('color', newColor);
  }, [selectedRole, setValue, roleToColorMap]);


  const onSubmit: SubmitHandler<EditShiftFormValues> = (data) => {
    onUpdateShift({ ...data, id: shift.id, date: shift.date });
    setIsOpen(false);
  };
  
  React.useEffect(() => {
    if(isOpen) {
        reset({
            employeeName: shift.employeeName,
            startTime: shift.startTime,
            endTime: shift.endTime,
            role: shift.role,
            color: shift.color
        })
    }
  }, [isOpen, shift, reset])

  const triggerButton = (
    <Button variant="ghost" size="icon" className="h-6 w-6">
        <Edit className="h-3 w-3 text-gray-500" />
    </Button>
  );
  
  const selectedColor = watch('color');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {shift.id.startsWith('suggested') ?
          <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button> : 
          triggerButton
        }
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Editar Turno</DialogTitle>
            <DialogDescription>
              Modifique os detalhes do turno.
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
            <Button type="submit">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
