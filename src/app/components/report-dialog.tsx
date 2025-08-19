
"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import type { Employee, Calendar, Shift, ShiftColor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClipboardList, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import { format, getDaysInMonth, addMonths, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";


type ReportDialogProps = {
  employees: Employee[];
  calendars: Calendar[];
  currentDate: Date;
  shiftTypes: string[];
};

const roleColorMap: Record<ShiftColor, string> = {
  blue: "FF3B82F6", // bg-blue-500
  green: "FF22C55E", // bg-green-500
  purple: "FF8B5CF6", // bg-purple-500
  red: "FFEF4444", // bg-red-500
  yellow: "FFEAB308", // bg-yellow-500
  gray: "FF6B7280", // bg-gray-500
  pink: "FFEC4899", // bg-pink-500
  cyan: "FF06B6D4", // bg-cyan-500
  orange: "FFF97316", // bg-orange-500
  indigo: "FF6366F1", // bg-indigo-500
  teal: "FF14B8A6", // bg-teal-500
  lime: "FF84CC16", // bg-lime-500
};


export function ReportDialog({ employees, calendars, currentDate, shiftTypes }: ReportDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [viewedMonth, setViewedMonth] = React.useState(currentDate);
    const [selectedCalendarId, setSelectedCalendarId] = React.useState(calendars[0]?.id || 'all');
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const viewportRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if(isOpen) {
            setViewedMonth(currentDate);
            setSelectedCalendarId(calendars[0]?.id || 'all');
        }
    }, [isOpen, currentDate, calendars]);

    const handleScroll = (direction: 'left' | 'right') => {
        if (viewportRef.current) {
            const scrollAmount = 300;
            viewportRef.current.scrollBy({ 
                left: direction === 'left' ? -scrollAmount : scrollAmount, 
                behavior: 'smooth' 
            });
        }
    };
    
    const activeCalendar = calendars.find(c => c.id === selectedCalendarId);
    const shifts = selectedCalendarId === 'all'
      ? calendars.flatMap(c => c.shifts)
      : activeCalendar?.shifts || [];

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(viewedMonth),
        end: endOfMonth(viewedMonth),
    });
    
    const shiftsForMonth = shifts.filter(s => format(parseISO(s.date), 'yyyy-MM') === format(viewedMonth, 'yyyy-MM'));

    // Create a map of day events for quick lookup
    const dayEvents = new Map<string, Shift>();
    shiftsForMonth.forEach(shift => {
        if (shift.employeeName === '') { // This identifies a day event
            dayEvents.set(shift.date, shift);
        }
    });

    const sortedEmployees = React.useMemo(() => 
        [...employees].sort((a, b) => a.name.localeCompare(b.name)), 
    [employees]);

    const reportData = sortedEmployees.map(employee => {
        const shiftsByDay: { [key: string]: Shift[] } = {};
        shiftsForMonth.forEach(shift => {
            if (shift.employeeName === employee.name) {
                const dateKey = shift.date;
                if (!shiftsByDay[dateKey]) {
                    shiftsByDay[dateKey] = [];
                }
                shiftsByDay[dateKey].push(shift);
            }
        });
        return {
            employee,
            shiftsByDay,
        };
    });

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        
        const header = ["Funcionário", ...daysInMonth.map(day => format(day, "dd/MM"))];
        const subHeader = ["", ...daysInMonth.map(day => format(day, "EEE", { locale: ptBR }))];
        
        const body = reportData.map(({ employee, shiftsByDay }) => {
            const row: (string | null)[] = [employee.name];
            daysInMonth.forEach(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvent = dayEvents.get(dateKey);
                
                if (dayEvent) {
                    row.push(dayEvent.role);
                } else {
                    const dayShifts = shiftsByDay[dateKey];
                    if (dayShifts && dayShifts.length > 0) {
                        row.push(dayShifts.map(s => s.role).join(', '));
                    } else {
                        row.push(null);
                    }
                }
            });
            return row;
        });

        const wsData = [header, subHeader, ...body];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Apply styles
        reportData.forEach(({ employee, shiftsByDay }, rowIndex) => {
            daysInMonth.forEach((day, colIndex) => {
                 const dateKey = format(day, 'yyyy-MM-dd');
                 const dayEvent = dayEvents.get(dateKey);

                 let shiftToColor: Shift | undefined;

                 if (dayEvent) {
                     shiftToColor = dayEvent;
                 } else {
                     const dayShifts = shiftsByDay[dateKey];
                     if (dayShifts && dayShifts.length > 0) {
                        shiftToColor = dayShifts[0]; // Use first shift's color
                     }
                 }

                if (shiftToColor) {
                    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 2, c: colIndex + 1 });
                    if (ws[cellAddress]) {
                        ws[cellAddress].s = {
                            fill: {
                                fgColor: { rgb: roleColorMap[shiftToColor.color] || "FFFFFFFF" }
                            },
                            font: {
                                color: { rgb: "FF000000" } 
                            }
                        };
                    }
                }
            });
        });
        
        // Set column widths
        const colsWidths = [
            { wch: 25 }, // Employee name
            ...Array(daysInMonth.length).fill({ wch: 15 })
        ];
        ws['!cols'] = colsWidths;
        

        XLSX.utils.book_append_sheet(wb, ws, `Relatório ${format(viewedMonth, "MMMM yyyy")}`);
        XLSX.writeFile(wb, `relatorio_de_turnos_${format(viewedMonth, "yyyy-MM")}.xlsx`);
    };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
         <Button variant="outline">
            <ClipboardList className="mr-2 h-4 w-4" />
            Relatório
         </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col print:max-w-none print:h-auto print-report-dialog-content">
        <DialogHeader>
          <DialogTitle>Relatório de Turnos Mensal</DialogTitle>
          <DialogDescription>
            Visualize e exporte o cronograma de turnos mensal para todos os funcionários.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-shrink-0 flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setViewedMonth(prev => subMonths(prev, 1))}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="w-40 text-center font-semibold text-gray-700 capitalize">
                  {format(viewedMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setViewedMonth(prev => addMonths(prev, 1))}>
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="calendar-select">Filtrar por Hospital</Label>
              <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                <SelectTrigger id="calendar-select" className="w-[200px]">
                  <SelectValue placeholder="Selecione o hospital" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Hospitais</SelectItem>
                  {calendars.map(cal => (
                    <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </div>
        
        <div className="flex-1 min-h-0 relative">
            <div className="absolute top-2 right-2 z-10 flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleScroll('left')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleScroll('right')}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <ScrollArea className="h-full" ref={scrollAreaRef} viewportRef={viewportRef}>
              <Table className="border-collapse border">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 border-r min-w-[200px]">Funcionário</TableHead>
                    {daysInMonth.map((day) => (
                      <TableHead key={day.toString()} className="text-center p-2 border-r">
                         <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</span>
                            <span className="font-bold text-lg">{format(day, "d")}</span>
                         </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map(({ employee, shiftsByDay }) => (
                    <TableRow key={employee.id}>
                      <TableCell className="sticky left-0 bg-background z-10 border-r font-medium">{employee.name}</TableCell>
                      {daysInMonth.map((day, index) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayEvent = dayEvents.get(dateKey);

                        let cellContent = "";
                        let cellColor: ShiftColor | undefined;

                        if (dayEvent) {
                            cellContent = dayEvent.role;
                            cellColor = dayEvent.color;
                        } else {
                            const dayShifts = shiftsByDay[dateKey];
                            if (dayShifts && dayShifts.length > 0) {
                                cellContent = dayShifts.map(s => s.role).join(", ");
                                cellColor = dayShifts[0].color;
                            }
                        }
                        
                        return (
                          <TableCell
                            key={index}
                            className={cn(
                                "text-center p-1 text-xs border-l h-16",
                                cellColor && `bg-${cellColor}-100`
                            )}
                          >
                            {cellContent}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
        </div>


        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button onClick={handleExportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar para Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
