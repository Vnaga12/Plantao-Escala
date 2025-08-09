
"use client";

import * as React from "react";
import { format, startOfMonth, getDaysInMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Calendar, Employee, Shift, ShiftColor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, Calendar as CalendarIcon, Printer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type ReportDialogProps = {
  employees: Employee[];
  calendars: Calendar[];
};

type ReportData = {
  employee: Employee;
  shiftsByDay: Record<string, Shift | null>;
}[];

const roleColorClasses: Record<ShiftColor, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  gray: "bg-gray-500",
};

export function ReportDialog({ employees, calendars }: ReportDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedMonths, setSelectedMonths] = React.useState<Date[]>([]);
  const [reportData, setReportData] = React.useState<ReportData | null>(null);
  const [reportDays, setReportDays] = React.useState<Date[]>([]);
  const { toast } = useToast();
  const reportContentRef = React.useRef<HTMLDivElement>(null);

  const availableMonths = Array.from({ length: 12 }, (_, i) => startOfMonth(new Date(new Date().getFullYear(), i, 1)));

  const handleMonthToggle = (month: Date) => {
    setSelectedMonths((prev) =>
      prev.some((m) => m.getTime() === month.getTime())
        ? prev.filter((m) => m.getTime() !== month.getTime())
        : [...prev, month]
    );
  };

  const generateReport = () => {
    if (selectedMonths.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum mês selecionado",
        description: "Por favor, selecione pelo menos um mês para gerar o relatório.",
      });
      return;
    }

    const sortedMonths = selectedMonths.sort((a, b) => a.getTime() - b.getTime());
    const startDate = sortedMonths[0];
    const endDate = new Date(sortedMonths[sortedMonths.length - 1]);
    const lastDayOfMonth = getDaysInMonth(endDate);
    const endOfInterval = new Date(endDate.setDate(lastDayOfMonth));

    const allDays = eachDayOfInterval({ start: startDate, end: endOfInterval });
    setReportDays(allDays);

    const allShifts = calendars.flatMap(c => c.shifts);

    const data = employees.map(employee => {
      const shiftsByDay: Record<string, Shift | null> = {};
      allDays.forEach(day => {
        const dayKey = format(day, "yyyy-MM-dd");
        const shiftForEmployeeOnDay = allShifts.find(s => {
            const shiftDate = new Date(day.getFullYear(), day.getMonth(), s.day);
            return s.employeeName === employee.name && format(shiftDate, "yyyy-MM-dd") === dayKey;
        });
        shiftsByDay[dayKey] = shiftForEmployeeOnDay || null;
      });
      return { employee, shiftsByDay };
    });
    
    setReportData(data);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=1200');
    if (printWindow && reportContentRef.current) {
        printWindow.document.write('<html><head><title>Relatório de Plantões</title>');
        // Inject tailwind styles
        const styles = Array.from(document.styleSheets)
            .map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '')
            .join('');
        printWindow.document.write(styles);

        const globalStyles = Array.from(document.styleSheets)
            .filter(sheet => !sheet.href)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
                } catch (e) {
                    // This can fail on cross-origin stylesheets
                    return '';
                }
            })
            .join('\n');

        printWindow.document.write(`<style>${globalStyles}</style>`);
        printWindow.document.write('</head><body class="bg-white">');
        printWindow.document.write(reportContentRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        setTimeout(() => { // Wait for content to load
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 1000);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Sheet />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório Consolidado de Plantões</DialogTitle>
          <DialogDescription>
            Selecione os meses para gerar um relatório em formato de planilha.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 items-center p-4 border-b">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedMonths.length > 0
                  ? `${selectedMonths.length} meses selecionados`
                  : "Selecionar meses"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="grid gap-2">
                {availableMonths.map((month) => (
                  <div
                    key={month.toString()}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleMonthToggle(month)}
                  >
                    <Checkbox
                      id={`month-${month.getMonth()}`}
                      checked={selectedMonths.some(m => m.getTime() === month.getTime())}
                      onCheckedChange={() => handleMonthToggle(month)}
                    />
                    <label htmlFor={`month-${month.getMonth()}`} className="capitalize cursor-pointer">
                      {format(month, "MMMM yyyy", { locale: ptBR })}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={generateReport}>Gerar Relatório</Button>
          {reportData && (
              <Button variant="outline" onClick={handlePrint} className="ml-auto">
                <Printer className="mr-2 h-4 w-4" /> Imprimir / Exportar PDF
              </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4" ref={reportContentRef}>
            {reportData ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="sticky left-0 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10">
                        Funcionário
                      </th>
                      {reportDays.map((day, index) => {
                         const isFirstOfMonth = day.getDate() === 1;
                         return (
                            <th 
                                key={day.toString()} 
                                className={cn(
                                    "px-2 py-2 text-center text-xs font-medium text-gray-500",
                                    isFirstOfMonth && index > 0 && "border-l-2 border-primary"
                                )}
                            >
                                {isFirstOfMonth && (
                                    <div className="text-primary font-semibold capitalize pb-1">
                                        {format(day, 'MMM', {locale: ptBR})}
                                    </div>
                                )}
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-400">{format(day, 'EEE', {locale: ptBR})}</span>
                                    <span>{format(day, 'd')}</span>
                                </div>
                            </th>
                         )
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map(({ employee, shiftsByDay }) => (
                      <tr key={employee.id}>
                        <td className="sticky left-0 bg-white px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 z-10">
                          {employee.name}
                        </td>
                        {reportDays.map(day => {
                          const dayKey = format(day, "yyyy-MM-dd");
                          const shift = shiftsByDay[dayKey];
                          return (
                            <td key={dayKey} className="px-1 py-1 whitespace-nowrap text-xs text-white text-center h-12">
                              {shift ? (
                                <div className={cn("rounded-md h-full w-full flex items-center justify-center p-1", roleColorClasses[shift.color])}>
                                  {shift.role}
                                </div>
                              ) : (
                                ""
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16">
                <p>Selecione os meses e clique em "Gerar Relatório" para começar.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
