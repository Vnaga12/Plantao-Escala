
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ChevronsUpDown, PlusCircle, Edit } from "lucide-react";
import type { Calendar } from "@/lib/types";

type CalendarSwitcherProps = {
  calendars: Calendar[];
  activeCalendarId: string;
  onCalendarChange: (id: string) => void;
  onCalendarsChange: (calendars: Calendar[]) => void;
};

export default function CalendarSwitcher({
  calendars,
  activeCalendarId,
  onCalendarChange,
  onCalendarsChange,
}: CalendarSwitcherProps) {
  const [isAddOpen, setAddIsOpen] = React.useState(false);
  const [isEditOpen, setEditIsOpen] = React.useState(false);
  const [newCalendarName, setNewCalendarName] = React.useState("");
  const [editingCalendar, setEditingCalendar] = React.useState<Calendar | null>(null);

  const activeCalendar = calendars.find((c) => c.id === activeCalendarId);

  const handleAddCalendar = () => {
    if (newCalendarName.trim() === "") return;
    const newCalendar: Calendar = {
      id: `cal-${Date.now()}`,
      name: newCalendarName,
      shifts: [],
    };
    onCalendarsChange([...calendars, newCalendar]);
    setNewCalendarName("");
    setAddIsOpen(false);
  };

  const handleEditCalendar = () => {
    if (!editingCalendar || editingCalendar.name.trim() === "") return;
    onCalendarsChange(
      calendars.map((c) =>
        c.id === editingCalendar.id ? editingCalendar : c
      )
    );
    setEditingCalendar(null);
    setEditIsOpen(false);
  };

  const openEditDialog = (calendar: Calendar) => {
    setEditingCalendar(calendar);
    setEditIsOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-between">
            {activeCalendar?.name || "Selecionar Calendário"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]">
          <DropdownMenuLabel>Calendários Disponíveis</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {calendars.map((calendar) => (
            <DropdownMenuItem
              key={calendar.id}
              className="justify-between"
              onSelect={() => onCalendarChange(calendar.id)}
            >
              {calendar.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditDialog(calendar);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setAddIsOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Calendário
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Calendar Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setAddIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Calendário</DialogTitle>
            <DialogDescription>
              Dê um nome ao seu novo calendário (ex: Hospital Central).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Nome do Calendário</Label>
            <Input
              id="name"
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)}
              placeholder="Ex: Clínica Pediátrica"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCalendar}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Calendar Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setEditIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nome do Calendário</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-name">Nome do Calendário</Label>
            <Input
              id="edit-name"
              value={editingCalendar?.name || ""}
              onChange={(e) =>
                setEditingCalendar(
                  editingCalendar ? { ...editingCalendar, name: e.target.value } : null
                )
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditCalendar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
