
"use client";

import type { Shift, Employee, ShiftColor } from "@/lib/types";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SwapShiftDialog } from "./swap-shift-dialog";
import { EditShiftDialog } from "./edit-shift-dialog";

type ShiftCardProps = {
  shift: Shift;
  employees: Employee[];
  roles: string[];
  onUpdateShift: (updatedShift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
};

const roleColorClasses: Record<ShiftColor, string> = {
  blue: "bg-blue-100 border-blue-400 text-blue-800 print:bg-blue-100 print:border-blue-400 print:text-black",
  green: "bg-green-100 border-green-400 text-green-800 print:bg-green-100 print:border-green-400 print:text-black",
  purple: "bg-purple-100 border-purple-400 text-purple-800 print:bg-purple-100 print:border-purple-400 print:text-black",
  red: "bg-red-100 border-red-400 text-red-800 print:bg-red-100 print:border-red-400 print:text-black",
  yellow: "bg-yellow-100 border-yellow-400 text-yellow-800 print:bg-yellow-100 print:border-yellow-400 print:text-black",
  gray: "bg-gray-100 border-gray-400 text-gray-800 print:bg-gray-100 print:border-gray-400 print:text-black",
};

export default function ShiftCard({ shift, employees, onUpdateShift, onDeleteShift, roles }: ShiftCardProps) {
  return (
    <div className={cn("rounded-lg border-l-4 p-2 text-xs shadow-sm print:shadow-none print:border", roleColorClasses[shift.color])}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold">{shift.role}</p>
          <p className="text-muted-foreground">{shift.employeeName}</p>
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{shift.startTime} - {shift.endTime}</span>
          </div>
        </div>
        <div className="flex items-center print:hidden">
            <EditShiftDialog shift={shift} roles={roles} onUpdateShift={onUpdateShift} />
            <SwapShiftDialog shift={shift} employees={employees} onUpdateShift={onUpdateShift} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá excluir permanentemente o plantão.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteShift(shift.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </div>
  );
}
