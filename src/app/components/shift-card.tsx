"use client";

import type { Shift } from "@/lib/types";
import { Clock, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SwapShiftDialog } from "./swap-shift-dialog";

type ShiftCardProps = {
  shift: Shift;
};

const roleColorClasses = {
  blue: "bg-blue-100 border-blue-400 text-blue-800",
  green: "bg-green-100 border-green-400 text-green-800",
  purple: "bg-purple-100 border-purple-400 text-purple-800",
};

export default function ShiftCard({ shift }: ShiftCardProps) {
  return (
    <TooltipProvider>
      <div className={cn("rounded-lg border-l-4 p-2 text-xs shadow-sm", roleColorClasses[shift.color])}>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold">{shift.role}</p>
            <p className="text-muted-foreground">{shift.employeeName}</p>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{shift.startTime} - {shift.endTime}</span>
            </div>
          </div>
          <SwapShiftDialog />
        </div>
      </div>
    </TooltipProvider>
  );
}
