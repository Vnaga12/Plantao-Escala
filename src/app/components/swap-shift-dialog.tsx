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
          <p>Trocar Turno</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trocar Turno</DialogTitle>
          <DialogDescription>
            Este recurso estará disponível em breve. Você poderá selecionar outro turno para trocar.
          </DialogDescription>
        </DialogHeader>
        {/* Placeholder for swap UI */}
        <div className="py-4">
            <p className="text-center text-muted-foreground">A funcionalidade de troca será implementada aqui.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
