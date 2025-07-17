
"use client";

import type { Employee, Calendar } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Download, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/app/components/icons/logo";
import { SuggestShiftsDialog } from "./suggest-shifts-dialog";
import { SettingsDialog } from "./settings-dialog";
import CalendarSwitcher from "./calendar-switcher";

type HeaderProps = {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  employees: Employee[];
  onApplySuggestions: (
    suggestions: any[]
  ) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roles: string[];
  onRolesChange: (roles: string[]) => void;
  calendars: Calendar[];
  activeCalendarId: string;
  onCalendarChange: (id: string) => void;
  onCalendarsChange: (calendars: Calendar[]) => void;
};

export default function Header({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth, 
  employees, 
  onApplySuggestions, 
  searchQuery, 
  onSearchChange,
  roles,
  onRolesChange,
  calendars,
  activeCalendarId,
  onCalendarChange,
  onCalendarsChange,
}: HeaderProps) {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="flex-shrink-0 border-b">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold font-headline text-gray-800">Escala de Cirurgia</h1>
          </div>
           <CalendarSwitcher
            calendars={calendars}
            activeCalendarId={activeCalendarId}
            onCalendarChange={onCalendarChange}
            onCalendarsChange={onCalendarsChange}
          />
          <div className="flex items-center gap-2 rounded-md bg-gray-100 p-1">
            <Button variant="ghost" size="icon" onClick={onPrevMonth} aria-label="Mês anterior">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="w-40 text-center font-semibold text-gray-700 capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" onClick={onNextMonth} aria-label="Próximo mês">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar por funcionário ou função..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
           <SuggestShiftsDialog employees={employees} onApplySuggestions={onApplySuggestions} roles={roles} />
           <SettingsDialog roles={roles} onRolesChange={onRolesChange} />
          <Button variant="outline" onClick={handlePrint}>
            <Download />
            Exportar PDF
          </Button>
        </div>
      </div>
    </header>
  );
}
