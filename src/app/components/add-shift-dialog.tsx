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
            <DialogTitle>Add New Shift</DialogTitle>
            <DialogDescription>
              Fill in the details for the new shift on day {day}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select defaultValue="Nurse" onValueChange={(value: Shift['role']) => control.setValue('role', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Doctor">Doctor</SelectItem>
                  <SelectItem value="Nurse">Nurse</SelectItem>
                  <SelectItem value="Technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employeeName" className="text-right">Employee</Label>
              <Input id="employeeName" {...register("employeeName", { required: "Employee name is required" })} className="col-span-3" />
              {errors.employeeName && <p className="col-span-4 text-xs text-red-500 text-right">{errors.employeeName.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">Start Time</Label>
              <Input id="startTime" type="time" {...register("startTime", { required: "Start time is required" })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">End Time</Label>
              <Input id="endTime" type="time" {...register("endTime", { required: "End time is required" })} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Shift</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
