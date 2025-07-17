
"use client"

import * as React from "react"
import type { Shift, Employee } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

type SwapShiftDialogProps = {
  shift: Shift;
  employees: Employee[];
  onUpdateShift: (updatedShift: Shift) => void;
};

export function SwapShiftDialog({ shift, employees, onUpdateShift }: SwapShiftDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleSwap = () => {
    if (!selectedEmployeeId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione um funcionário para realizar a troca.",
      });
      return;
    }
    const newEmployee = employees.find(e => e.id === selectedEmployeeId);
    if (newEmployee) {
      const updatedShift = { ...shift, employeeName: newEmployee.name };
      onUpdateShift(updatedShift);
      toast({
        title: "Troca Realizada com Sucesso",
        description: `${shift.employeeName} trocou de turno com ${newEmployee.name}.`,
      });
      setIsOpen(false);
      setSelectedEmployeeId(null);
    }
  };

  const availableEmployees = employees.filter(e => e.name !== shift.employeeName);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ArrowRightLeft className="h-3 w-3 text-gray-500" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Trocar Turno</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trocar Turno</DialogTitle>
          <DialogDescription>
            Selecione um funcionário para trocar o turno com <span className="font-semibold">{shift.employeeName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee" className="text-right">Trocar com</Label>
            <Select onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {availableEmployees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSwap}>Confirmar Troca</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
