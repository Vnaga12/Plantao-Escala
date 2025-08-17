
"use client";

import * as React from "react";
import { addMonths, subMonths, getDaysInMonth, getDay, format, parse, isSameMonth, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, getDayOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Shift, Employee, Calendar, ShiftColor } from "@/lib/types";
import Header from "@/app/components/header";
import CalendarView from "@/app/components/calendar-view";
import ColorLegend from "./components/color-legend";
import { useToast } from "@/components/ui/use-toast";
import EmployeeSidebar from "./components/employee-sidebar";
import { SuggestShiftsDialog } from "./components/suggest-shifts-dialog";

const initialCalendars: Calendar[] = [
  {
    id: 'cal1',
    name: 'Hospital Principal',
    shifts: [
      { id: '1', date: '2024-07-05', role: 'Cirurgia Eletiva', employeeName: 'Dra. Alice', startTime: '08:00', endTime: '16:00', color: 'blue' },
      { id: '2', date: '2024-07-05', role: 'Plantão', employeeName: 'Beto', startTime: '14:00', endTime: '22:00', color: 'green' },
      { id: '3', date: '2024-07-12', role: 'Ambulatório', employeeName: 'Carlos', startTime: '09:00', endTime: '17:00', color: 'purple' },
      { id: '4', date: '2024-07-21', role: 'Emergência', employeeName: 'Dr. David', startTime: '20:00', endTime: '04:00', color: 'red' },
    ],
  },
  {
    id: 'cal2',
    name: 'Clínica Secundária',
    shifts: [
        { id: '5', date: '2024-07-10', role: 'Cirurgia Eletiva', employeeName: 'Dr. David', startTime: '09:00', endTime: '17:00', color: 'blue' },
    ],
  }
];

const initialEmployees: Employee[] = [
    {
        id: '1',
        name: 'Dra. Alice',
        role: 'Médica',
        availability: [{ day: 'Monday', startTime: '08:00', endTime: '17:00' }],
        preferences: 'Prefere turnos da manhã.'
    },
    {
        id: '2',
        name: 'Beto',
        role: 'Enfermeiro',
        availability: [{ day: 'Tuesday', startTime: '12:00', endTime: '20:00' }],
        preferences: 'Não pode trabalhar nos fins de semana.'
    },
    {
        id: '3',
        name: 'Carlos',
        role: 'Médico',
        availability: [],
        preferences: 'Disponível para cobrir turnos.'
    },
    {
        id: '4',
        name: 'Dr. David',
        role: 'Médico',
        availability: [],
        preferences: 'Prefere turnos da noite.'
    },
     {
        id: '5',
        name: 'Dra. Elisa',
        role: 'Técnica',
        availability: [],
        preferences: ''
    }
];


export const initialColorMeanings: { color: ShiftColor, meaning: string }[] = [
    { color: 'blue', meaning: 'Cirurgia Eletiva' },
    { color: 'green', meaning: 'Plantão' },
    { color: 'purple', meaning: 'Ambulatório' },
    { color: 'red', meaning: 'Emergência' },
    { color: 'yellow', meaning: 'Aviso' },
    { color: 'gray', meaning: 'Outro' },
    { color: 'pink', meaning: 'Consulta' },
    { color: 'cyan', meaning: 'Procedimento' },
    { color: 'orange', meaning: 'Sobreaviso' },
    { color: 'indigo', meaning: 'Administrativo' },
    { color: 'teal', meaning: 'Treinamento' },
    { color: 'lime', meaning: 'Reunião' },
];

const initialRoles: string[] = ['Médico(a)', 'Enfermeiro(a)', 'Técnico(a)'];


export default function Home() {
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [calendars, setCalendars] = React.useState<Calendar[]>([]);
  const [activeCalendarId, setActiveCalendarId] = React.useState<string>('');
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [roles, setRoles] = React.useState<string[]>([]);
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
        const storedRoles = localStorage.getItem('roles');
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

        setCalendars(migratedCalendars);
        setActiveCalendarId(storedActiveId || migratedCalendars[0]?.id || '');
        setEmployees(storedEmployees ? JSON.parse(storedEmployees) : initialEmployees);
        setRoles(storedRoles ? JSON.parse(storedRoles) : initialRoles);
        setColorMeanings(storedColorMeanings ? JSON.parse(storedColorMeanings) : initialColorMeanings);
        setIsSidebarOpen(storedSidebarState ? JSON.parse(storedSidebarState) : true);

    } catch (error) {
        console.error("Failed to load from localStorage", error);
        setCalendars(initialCalendars);
        setActiveCalendarId(initialCalendars[0]?.id || '');
        setEmployees(initialEmployees);
        setRoles(initialRoles);
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
        localStorage.setItem('roles', JSON.stringify(roles));
        localStorage.setItem('colorMeanings', JSON.stringify(colorMeanings));
        localStorage.setItem('isSidebarOpen', JSON.stringify(isSidebarOpen));
    }
  }, [currentDate, calendars, activeCalendarId, employees, roles, colorMeanings, isSidebarOpen, isClient]);


  const activeCalendar = calendars.find(c => c.id === activeCalendarId) ?? calendars[0];
  const shifts = activeCalendar?.shifts || [];

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1));
  };

  const updateActiveCalendarShifts = (newShifts: Shift[]) => {
    setCalendars(prev => prev.map(cal => 
      cal.id === activeCalendarId ? { ...cal, shifts: newShifts } : cal
    ));
  };
  
  const roleToColorMap = new Map(colorMeanings.map(m => [m.meaning, m.color]));

  const handleAddShift = (newShift: Omit<Shift, 'id' | 'color'>) => {
    const shiftWithId: Shift = {
      ...newShift,
      id: Date.now().toString(),
      color: roleToColorMap.get(newShift.role) || 'gray'
    };
    updateActiveCalendarShifts([...shifts, shiftWithId]);
    toast({ title: "Turno Adicionado", description: "O novo turno foi adicionado ao calendário." });
  };
  
  const handleUpdateShift = (updatedShift: Shift) => {
    const newShifts = shifts.map(s => s.id === updatedShift.id ? updatedShift : s);
    updateActiveCalendarShifts(newShifts);
    toast({ title: "Turno Atualizado", description: "O turno foi atualizado com sucesso." });
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
    const newShifts = shifts.filter(s => s.id !== shiftId);
    updateActiveCalendarShifts(newShifts);
    toast({ title: "Turno Excluído", description: "O turno foi removido do calendário." });
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

  const filteredShifts = shifts.filter(shift => {
    const query = searchQuery.toLowerCase();
    const shiftDate = parseISO(shift.date);

    return (
      (shift.employeeName.toLowerCase().includes(query) ||
      shift.role.toLowerCase().includes(query)) &&
      isSameMonth(shiftDate, currentDate)
    );
  });
  
  const handleBulkAddEmployees = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const input = event.currentTarget;
      const namesString = input.value.trim();
      if (namesString === "") return;

      const names = namesString.split(',').map(name => name.trim()).filter(Boolean);
      
      const newEmployees: Employee[] = names.map(name => {
         const formattedName = name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        return {
          id: `emp-${Date.now()}-${Math.random()}`,
          name: formattedName,
          role: "Nova Função",
          availability: [],
          preferences: "",
        };
      });

      setEmployees(prev => [...prev, ...newEmployees]);
      input.value = ""; // Clear the input
      toast({
        title: "Funcionários Adicionados",
        description: `${newEmployees.length} novos funcionários foram adicionados ao grupo.`,
      });
    }
  };

  const handleApplySuggestions = (suggestions: Shift[]) => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    
    const dayNameToDateMap: Record<string, Date> = {};
    eachDayOfInterval({ start: weekStart, end: weekEnd }).forEach(day => {
        const dayName = format(day, 'EEEE'); // Full day name in English e.g., "Monday"
        dayNameToDateMap[dayName] = day;
    });

    const newShifts = suggestions.map(suggestion => {
        const date = dayNameToDateMap[suggestion.date];
        if (!date) return null; // Should not happen if AI returns correct day names
        
        return {
            ...suggestion,
            date: format(date, 'yyyy-MM-dd')
        }
    }).filter((s): s is Shift => s !== null);

    updateActiveCalendarShifts([...shifts, ...newShifts]);
  };


  if (!isClient || !activeCalendar) {
    return null;
  }
  
  const allShiftRoles = [...new Set(calendars.flatMap(c => c.shifts).map(s => s.role))];


  return (
    <div className="flex flex-col h-screen bg-background text-foreground print:bg-transparent print:h-auto">
      <Header
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        employees={employees}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roles={roles}
        onRolesChange={setRoles}
        calendars={calendars}
        activeCalendarId={activeCalendarId}
        onCalendarChange={setActiveCalendarId}
        onCalendarsChange={setCalendars}
        colorMeanings={colorMeanings}
        onColorMeaningsChange={setColorMeanings}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onBulkAddEmployees={handleBulkAddEmployees}
      />
       <div className="hidden print:block p-4 text-center print:p-0 mb-4">
            <h1 className="text-2xl font-bold capitalize">{format(currentDate, "MMMM yyyy", { locale: ptBR })}</h1>
            <h2 className="text-lg">{activeCalendar.name}</h2>
       </div>
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        {isSidebarOpen && <EmployeeSidebar 
            employees={employees} 
            onEmployeesChange={setEmployees}
            onUpdateEmployee={handleUpdateEmployee}
            shifts={shifts}
            currentDate={currentDate}
            onUpdateShift={handleUpdateShift}
            onDeleteShift={handleDeleteShift}
            onAddShift={handleAddShift}
            roles={allShiftRoles}
            calendarName={activeCalendar.name}
            onAddDayEvent={handleAddDayEvent}
            colorMeanings={colorMeanings}
            />}
        <main className="flex-1 overflow-auto p-4 md:p-6 print:p-0 print:overflow-visible">
          <div className="bg-white rounded-lg shadow print:shadow-none print:rounded-none flex-1 flex flex-col print:block">
            <div className="flex justify-end p-2 print:hidden">
               <SuggestShiftsDialog employees={employees} onApplySuggestions={handleApplySuggestions} roles={allShiftRoles} />
            </div>
            <CalendarView 
              currentDate={currentDate} 
              shifts={filteredShifts}
              onAddShift={handleAddShift} 
              employees={employees}
              onUpdateShift={handleUpdateShift}
              onDeleteShift={handleDeleteShift}
              roles={allShiftRoles}
              colorMeanings={colorMeanings}
            />
          </div>
          {/* Legend for Screen */}
          <div className="print:hidden mt-4">
              <ColorLegend meanings={colorMeanings} />
          </div>
        </main>
      </div>
       {/* Legend for Print Only */}
       <div className="hidden print:block mt-4">
          <ColorLegend meanings={colorMeanings} />
       </div>
    </div>
  );
}

    