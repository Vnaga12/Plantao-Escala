
"use client";

import * as React from "react";
import { addMonths, subMonths, getDaysInMonth, getDay, format, parse, isSameMonth, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, getDayOfYear, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Shift, Employee, Calendar, ShiftColor, Role } from "@/lib/types";
import Header from "@/app/components/header";
import CalendarView from "@/app/components/calendar-view";
import ColorLegend from "./components/color-legend";
import { useToast } from "@/components/ui/use-toast";
import EmployeeSidebar from "./components/employee-sidebar";
import { SuggestShiftsDialog } from "./components/suggest-shifts-dialog";
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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const initialCalendars: Calendar[] = [
  {
    id: 'cal1',
    name: 'Turma A',
    shifts: [
      { id: '1', date: '2024-07-05', role: 'Cirurgia Eletiva', employeeName: 'Dra. Alice', startTime: '08:00', endTime: '16:00', color: 'blue' },
      { id: '2', date: '2024-07-05', role: 'Plantão', employeeName: 'Beto', startTime: '14:00', endTime: '22:00', color: 'green' },
      { id: '3', date: '2024-07-12', role: 'Ambulatório', employeeName: 'Carlos', startTime: '09:00', endTime: '17:00', color: 'purple' },
      { id: '4', date: '2024-07-21', role: 'Emergência', employeeName: 'Dr. David', startTime: '20:00', endTime: '04:00', color: 'red' },
    ],
  },
  {
    id: 'cal2',
    name: 'Turma B',
    shifts: [
        { id: '5', date: '2024-07-10', role: 'Cirurgia Eletiva', employeeName: 'Dr. David', startTime: '09:00', endTime: '17:00', color: 'blue' },
    ],
  }
];

const initialEmployees: Employee[] = [
    {
        id: '1',
        name: 'Dra. Alice',
        role: 'Médico(a)',
        unavailability: [{ day: 'Monday', startTime: '08:00', endTime: '17:00' }],
        preferences: 'Prefere turnos da manhã.',
        calendarIds: ['cal1']
    },
    {
        id: '2',
        name: 'Beto',
        role: 'Enfermeiro(a)',
        unavailability: [{ day: 'Tuesday', startTime: '12:00', endTime: '20:00' }],
        preferences: 'Não pode trabalhar nos fins de semana.',
        calendarIds: ['cal1']
    },
    {
        id: '3',
        name: 'Carlos',
        role: 'Médico(a)',
        unavailability: [],
        preferences: 'Disponível para cobrir turnos.',
        calendarIds: ['cal1', 'cal2']
    },
    {
        id: '4',
        name: 'Dr. David',
        role: 'Médico(a)',
        unavailability: [],
        preferences: 'Prefere turnos da noite.',
        calendarIds: ['cal2']
    },
    {
        id: '5',
        name: 'Dra. Elisa',
        role: 'Técnico(a)',
        unavailability: [],
        preferences: '',
        calendarIds: ['cal1', 'cal2']
    }
];


export const initialColorMeanings: { color: ShiftColor, meaning: string }[] = [
    { color: 'blue', meaning: 'Cirurgia Eletiva' },
    { color: 'green', meaning: 'Plantão' },
    { color: 'purple', meaning: 'Ambulatório' },
    { color: 'red', meaning: 'Emergência' },
    { color: 'yellow', meaning: 'Aviso' },
    { color: 'gray', meaning: 'Outro' },
];

export default function Home() {
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [calendars, setCalendars] = React.useState<Calendar[]>([]);
  const [activeCalendarId, setActiveCalendarId] = React.useState<string>('all');
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [colorMeanings, setColorMeanings] = React.useState<{ color: ShiftColor, meaning: string }[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  
  const [isClient, setIsClient] = React.useState(false);
  
  // Hydration logic
  React.useEffect(() => {
    setIsClient(true);
    try {
        const storedDate = localStorage.getItem('currentDate');
        const storedCalendars = localStorage.getItem('calendars');
        const storedActiveId = localStorage.getItem('activeCalendarId');
        const storedEmployees = localStorage.getItem('employees');
        const storedColorMeanings = localStorage.getItem('colorMeanings');
        const storedSidebarState = localStorage.getItem('isSidebarOpen');

        if (storedDate) setCurrentDate(new Date(storedDate));
        
        const loadedCalendars = storedCalendars ? JSON.parse(storedCalendars) : initialCalendars;
        
        const migratedCalendars = loadedCalendars.map((cal: Calendar) => ({
            ...cal,
            shifts: cal.shifts.map(shift => {
                if (typeof (shift as any).day === 'number') {
                    const year = new Date().getFullYear(); // Assume current year for migration
                    const month = new Date().getMonth(); // Assume current month for migration
                    return {
                        ...shift,
                        date: format(new Date(year, month, (shift as any).day), 'yyyy-MM-dd'),
                        day: undefined,
                    }
                }
                return shift;
            })
        }));
        
        let loadedEmployees = storedEmployees ? JSON.parse(storedEmployees) : initialEmployees;

        // Migration from availability to unavailability
        loadedEmployees = loadedEmployees.map((emp: any) => {
          if (emp.availability) {
            const { availability, ...rest } = emp;
            return { ...rest, unavailability: availability };
          }
          return emp;
        })


        setCalendars(migratedCalendars);
        setActiveCalendarId(storedActiveId || 'all');
        setEmployees(loadedEmployees);
        setColorMeanings(storedColorMeanings ? JSON.parse(storedColorMeanings) : initialColorMeanings);
        setIsSidebarOpen(storedSidebarState ? JSON.parse(storedSidebarState) : true);

    } catch (error) {
        console.error("Failed to load from localStorage", error);
        setCalendars(initialCalendars);
        setActiveCalendarId('all');
        setEmployees(initialEmployees);
        setColorMeanings(initialColorMeanings);
        setIsSidebarOpen(true);
    }
  }, []);

  // Save to localStorage whenever state changes
  React.useEffect(() => {
    if (isClient) {
        localStorage.setItem('currentDate', currentDate.toISOString());
        localStorage.setItem('calendars', JSON.stringify(calendars));
        localStorage.setItem('activeCalendarId', activeCalendarId);
        localStorage.setItem('employees', JSON.stringify(employees));
        localStorage.setItem('colorMeanings', JSON.stringify(colorMeanings));
        localStorage.setItem('isSidebarOpen', JSON.stringify(isSidebarOpen));
    }
  }, [currentDate, calendars, activeCalendarId, employees, colorMeanings, isSidebarOpen, isClient]);


  const activeCalendar = calendars.find(c => c.id === activeCalendarId);
  
  const activeCalendarName = React.useMemo(() => {
      if (activeCalendarId === 'all') {
          return "Grupo";
      }
      return activeCalendar?.name || "Grupo";
  }, [activeCalendarId, activeCalendar]);


  const shifts = React.useMemo(() => {
      if (activeCalendarId === 'all') {
          return calendars.flatMap(cal => 
              cal.shifts.map(shift => ({
                  ...shift,
                  calendarName: cal.name
              }))
          );
      }
      return activeCalendar?.shifts.map(shift => ({
          ...shift,
          calendarName: activeCalendar.name
      })) || [];
  }, [calendars, activeCalendarId, activeCalendar]);
  
  const displayedEmployees = React.useMemo(() => {
    if (activeCalendarId === 'all') {
      return employees;
    }
    return employees.filter(employee => 
      employee.calendarIds?.includes(activeCalendarId)
    );
  }, [employees, activeCalendarId]);


  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1));
  };

  const updateActiveCalendarShifts = (newShifts: Shift[]) => {
      if (activeCalendarId === 'all') {
          console.warn("Shift updates are not performed when 'All Calendars' is selected.");
          return;
      }
      setCalendars(prev => prev.map(cal => 
        cal.id === activeCalendarId ? { ...cal, shifts: newShifts } : cal
      ));
  };
  
  const roleToColorMap = React.useMemo(() => new Map(colorMeanings.map(m => [m.meaning, m.color])), [colorMeanings]);

  const handleAddShift = (newShift: Omit<Shift, 'id' | 'color'>) => {
    if (activeCalendarId === 'all') {
        toast({
            variant: "destructive",
            title: "Seleção Necessária",
            description: "Por favor, selecione uma turma específica para adicionar um turno."
        });
        return;
    }
    const shiftWithId: Shift = {
      ...newShift,
      id: Date.now().toString(),
      color: roleToColorMap.get(newShift.role) || 'gray'
    };
    updateActiveCalendarShifts([...(activeCalendar?.shifts || []), shiftWithId]);
    toast({ title: "Turno Adicionado", description: "O novo turno foi adicionado ao calendário." });
  };
  
  const handleUpdateShift = (updatedShift: Shift) => {
    const calendarIdOfShift = calendars.find(cal => cal.shifts.some(s => s.id === updatedShift.id))?.id;
    if (!calendarIdOfShift) return;

    setCalendars(prev => prev.map(cal => {
        if (cal.id === calendarIdOfShift) {
            const newShifts = cal.shifts.map(s => s.id === updatedShift.id ? { ...updatedShift, color: roleToColorMap.get(updatedShift.role) || 'gray' } : s);
            return { ...cal, shifts: newShifts };
        }
        return cal;
    }));

    toast({ title: "Turno Atualizado", description: "O turno foi atualizado com sucesso." });
  };

  const handleAddEmployee = (name: string) => {
    const formattedName = name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: formattedName,
      role: '',
      unavailability: [],
      preferences: "",
      calendarIds: activeCalendarId !== 'all' ? [activeCalendarId] : [],
    };
    setEmployees([...employees, newEmployee]);
  };

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    const oldEmployee = employees.find(emp => emp.id === updatedEmployee.id);
    if (!oldEmployee) return;

    const oldName = oldEmployee.name;
    const newName = updatedEmployee.name;

    const newEmployees = employees.map(emp =>
      emp.id === updatedEmployee.id ? updatedEmployee : emp
    );
    setEmployees(newEmployees);

    if (oldName !== newName) {
      const newCalendars = calendars.map(calendar => ({
        ...calendar,
        shifts: calendar.shifts.map(shift =>
          shift.employeeName === oldName
            ? { ...shift, employeeName: newName }
            : shift
        ),
      }));
      setCalendars(newCalendars);
    }
  };

  const handleDeleteShift = (shiftId: string) => {
    const calendarIdOfShift = calendars.find(cal => cal.shifts.some(s => s.id === shiftId))?.id;
    if (!calendarIdOfShift) return;

    setCalendars(prev => prev.map(cal => {
        if (cal.id === calendarIdOfShift) {
            const newShifts = cal.shifts.filter(s => s.id !== shiftId);
            return { ...cal, shifts: newShifts };
        }
        return cal;
    }));

    toast({ title: "Turno Excluído", description: "O turno foi removido do calendário." });
  };
  
  const handleDeleteEmployee = (employeeId: string) => {
    const employeeToDelete = employees.find(emp => emp.id === employeeId);
    if (!employeeToDelete) return;

    // Remove employee
    const newEmployees = employees.filter(emp => emp.id !== employeeId);
    setEmployees(newEmployees);

    // Remove shifts associated with the deleted employee from all calendars
    const newCalendars = calendars.map(calendar => ({
        ...calendar,
        shifts: calendar.shifts.filter(shift => shift.employeeName !== employeeToDelete.name),
    }));
    setCalendars(newCalendars);

    toast({
        title: "Funcionário Excluído",
        description: `${employeeToDelete.name} e seus plantões foram removidos.`,
    });
  };

  const handleDeleteCalendar = (calendarId: string) => {
    const newCalendars = calendars.filter(c => c.id !== calendarId);
    setCalendars(newCalendars);
    
    // Also remove the calendarId from any employees
    setEmployees(prevEmployees => prevEmployees.map(emp => ({
        ...emp,
        calendarIds: emp.calendarIds?.filter(id => id !== calendarId) || []
    })));

    if (activeCalendarId === calendarId) {
      setActiveCalendarId(newCalendars[0]?.id || 'all');
    }

    toast({
      title: "Turma Excluída",
      description: "A turma foi removida com sucesso.",
    });
  };

  const handleAddDayEvent = (event: { date: Date; name: string; color: ShiftColor }) => {
    const { date, name, color } = event;
    const eventDate = format(date, 'yyyy-MM-dd');

    const newCalendars = calendars.map(cal => {
        const shiftsOnOtherDays = cal.shifts.filter(s => s.date !== eventDate);

        const newEventShift: Shift = {
            id: `event-${date.getTime()}-${cal.id}`,
            date: eventDate,
            role: name,
            employeeName: '',
            startTime: '00:00',
            endTime: '23:59',
            color: color
        };

        return { ...cal, shifts: [...shiftsOnOtherDays, newEventShift] };
    });

    setCalendars(newCalendars);
    toast({
        title: "Evento de Dia Inteiro Adicionado",
        description: `${name} foi adicionado a ${format(date, 'dd/MM/yyyy')} em todos os calendários.`,
    });
};

  const handleApplySuggestions = (suggestions: (Omit<Shift, 'id'> & { calendarId: string })[]) => {
      const shiftsByCalendar: Record<string, Shift[]> = {};

      suggestions.forEach(suggestion => {
          const { calendarId, ...shiftData } = suggestion;
          if (!shiftsByCalendar[calendarId]) {
              shiftsByCalendar[calendarId] = [];
          }
          const newShift: Shift = {
              ...shiftData,
              id: `suggested-${Date.now()}-${Math.random()}`,
              color: roleToColorMap.get(shiftData.role) || 'yellow',
          };
          shiftsByCalendar[calendarId].push(newShift);
      });

      setCalendars(prevCalendars => 
          prevCalendars.map(cal => {
              if (shiftsByCalendar[cal.id]) {
                  return {
                      ...cal,
                      shifts: [...cal.shifts, ...shiftsByCalendar[cal.id]]
                  };
              }
              return cal;
          })
      );
      
      toast({
          title: "Sugestões Aplicadas!",
          description: `${suggestions.length} novos turnos foram adicionados.`
      });
  };
  
  const handleColorMeaningsChange = (newMeanings: { color: ShiftColor; meaning: string }[]) => {
      const oldMeaningsList = colorMeanings;
      const renameMap = new Map<string, string>();
      
      const oldMeaningsMap = new Map(oldMeaningsList.map(item => [item.color, item.meaning]));
      const newMeaningsMap = new Map(newMeanings.map(item => [item.color, item.meaning]));

      // Identify renamed roles by color key
      oldMeaningsMap.forEach((oldMeaning, color) => {
          const newMeaning = newMeaningsMap.get(color);
          if (newMeaning && newMeaning !== oldMeaning) {
              renameMap.set(oldMeaning, newMeaning);
          }
      });
      
      if (renameMap.size > 0) {
          const updatedCalendars = calendars.map(cal => ({
              ...cal,
              shifts: cal.shifts.map(shift => {
                  if (renameMap.has(shift.role)) {
                      return { ...shift, role: renameMap.get(shift.role)! };
                  }
                  return shift;
              })
          }));
          setCalendars(updatedCalendars);
      }
      
      setColorMeanings(newMeanings);
  };

  const handleClearShifts = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const newCalendars = calendars.map(cal => {
        // If 'All Calendars' is not selected, only modify the active one
        if (activeCalendarId !== 'all' && cal.id !== activeCalendarId) {
            return cal;
        }

        const shiftsToKeep = cal.shifts.filter(shift => {
            try {
                const shiftDate = parseISO(shift.date);
                return !isSameMonth(shiftDate, currentDate);
            } catch (e) {
                // Keep shifts with invalid dates so they are not accidentally deleted
                return true; 
            }
        });

        return { ...cal, shifts: shiftsToKeep };
    });

    setCalendars(newCalendars);
    toast({
      title: "Escala Limpa",
      description: `Todos os plantões de ${format(currentDate, "MMMM", { locale: ptBR })} foram removidos.`,
    });
  }

  const filteredShifts = shifts.filter(shift => {
    if (!shift.date || !shift.date.includes('-')) return false; // Guard against invalid date formats
    const query = searchQuery.toLowerCase();
    
    // This could fail if the date is not a valid ISO string
    try {
        const shiftDate = parseISO(shift.date);
        return (
          (shift.employeeName.toLowerCase().includes(query) ||
          shift.role.toLowerCase().includes(query)) &&
          isSameMonth(shiftDate, currentDate)
        );
    } catch(e) {
        console.warn(`Invalid date format for shift id ${shift.id}: ${shift.date}`);
        return false;
    }
  });
  
  const shiftTypes = React.useMemo(() => colorMeanings.map(cm => cm.meaning), [colorMeanings]);

  if (!isClient) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-screen bg-background text-foreground print:bg-transparent print:h-auto">
      <Header
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        employees={employees}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        calendars={calendars}
        activeCalendarId={activeCalendarId}
        onCalendarChange={setActiveCalendarId}
        onCalendarsChange={setCalendars}
        onDeleteCalendar={handleDeleteCalendar}
        colorMeanings={colorMeanings}
        onColorMeaningsChange={handleColorMeaningsChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
       <div className="hidden print:block p-4 text-center print:p-0 mb-4">
            <h1 className="text-2xl font-bold capitalize">{format(currentDate, "MMMM yy", { locale: ptBR })}</h1>
            <h2 className="text-lg">{activeCalendar ? activeCalendar.name : "Todas as Turmas"}</h2>
       </div>
       <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex justify-end p-2 gap-2 print:hidden">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Escala
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso removerá permanentemente todos os plantões do mês de {format(currentDate, "MMMM", { locale: ptBR })} para a(s) turma(s) selecionada(s).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearShifts}>
                    Excluir Plantões
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <SuggestShiftsDialog 
              employees={employees} 
              roles={shiftTypes} 
              onApplySuggestions={handleApplySuggestions}
              currentDate={currentDate}
              calendars={calendars}
              activeCalendarId={activeCalendarId}
            />
        </div>
        <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
            {isSidebarOpen && <EmployeeSidebar 
                employees={displayedEmployees} 
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                shifts={shifts}
                currentDate={currentDate}
                onUpdateShift={handleUpdateShift}
                onDeleteShift={handleDeleteShift}
                onAddShift={handleAddShift}
                shiftTypes={shiftTypes}
                calendarName={activeCalendarName}
                onAddDayEvent={handleAddDayEvent}
                colorMeanings={colorMeanings}
                calendars={calendars}
                allEmployees={employees}
                />}
            <main className="flex-1 overflow-auto p-4 md:p-6 print:p-0 print:overflow-visible">
              <div className="bg-white rounded-lg shadow print:shadow-none print:rounded-none flex-1 flex flex-col print:block">
                  <CalendarView 
                  currentDate={currentDate} 
                  shifts={filteredShifts}
                  onAddShift={handleAddShift} 
                  employees={displayedEmployees}
                  onUpdateShift={handleUpdateShift}
                  onDeleteShift={handleDeleteShift}
                  shiftTypes={shiftTypes}
                  colorMeanings={colorMeanings}
                  disableAddShift={activeCalendarId === 'all'}
                  />
              </div>
              {/* Legend for Screen */}
              <div className="print:hidden mt-4">
                  <ColorLegend meanings={colorMeanings} />
              </div>
               {/* Legend for Print Only */}
              <div className="hidden print:block mt-4">
                  <ColorLegend meanings={colorMeanings} />
              </div>
            </main>
        </div>
        </div>
    </div>
  );
}
