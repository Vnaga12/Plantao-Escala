"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function SwapShiftDialog() {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ArrowRightLeft className="h-3 w-3 text-gray-500" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Swap Shift</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Swap Shift</DialogTitle>
          <DialogDescription>
            This feature is coming soon. You will be able to select another shift to swap with.
          </DialogDescription>
        </DialogHeader>
        {/* Placeholder for swap UI */}
        <div className="py-4">
            <p className="text-center text-muted-foreground">Swap functionality will be implemented here.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
