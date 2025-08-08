
"use client";

import * as React from "react";
import { addMonths, subMonths, getDaysInMonth, getDay, format } from "date-fns";
import type { Shift, Employee, Calendar, ShiftColor } from "@/lib/types";
import Header from "@/app/components/header";
import CalendarView from "@/app/components/calendar-view";
import ColorLegend from "./components/color-legend";
import { useToast } from "@/components/ui/use-toast";
import EmployeeSidebar from "./components/employee-sidebar";

const initialCalendars: Calendar[] = [
  {
    id: 'cal1',
    name: 'Hospital Principal',
    shifts: [
      { id: '1', day: 5, role: 'Cirurgia Eletiva', employeeName: 'Dra. Alice', startTime: '08:00', endTime: '16:00', color: 'blue' },
      { id: '2', day: 5, role: 'Plantão', employeeName: 'Beto', startTime: '14:00', endTime: '22:00', color: 'green' },
      { id: '3', day: 12, role: 'Ambulatório', employeeName: 'Carlos', startTime: '09:00', endTime: '17:00', color: 'purple' },
      { id: '4', day: 21, role: 'Emergência', employeeName: 'Dr. David', startTime: '20:00', endTime: '04:00', color: 'red' },
    ],
  },
  {
    id: 'cal2',
    name: 'Clínica Secundária',
    shifts: [
        { id: '5', day: 10, role: 'Cirurgia Eletiva', employeeName: 'Dr. David', startTime: '09:00', endTime: '17:00', color: 'blue' },
    ],
  }
];

const initialEmployees: Employee[] = [
    {
        id: '1',
        name: 'Dra. Alice',
        availability: [{ day: 'Monday', startTime: '08:00', endTime: '17:00' }],
        preferences: 'Prefere turnos da manhã.'
    },
    {
        id: '2',
        name: 'Beto',
        availability: [{ day: 'Tuesday', startTime: '12:00', endTime: '20:00' }],
        preferences: 'Não pode trabalhar nos fins de semana.'
    },
    {
        id: '3',
        name: 'Carlos',
        availability: [],
        preferences: 'Disponível para cobrir turnos.'
    },
    {
        id: '4',
        name: 'Dr. David',
        availability: [],
        preferences: 'Prefere turnos da noite.'
    },
     {
        id: '5',
        name: 'Dra. Elisa',
        availability: [],
        preferences: ''
    }
];


const initialColorMeanings: { color: ShiftColor, meaning: string }[] = [
    { color: 'blue', meaning: 'Cirurgia Eletiva' },
    { color: 'green', meaning: 'Plantão' },
    { color: 'purple', meaning: 'Ambulatório' },
    { color: 'red', meaning: 'Emergência' },
    { color: 'yellow', meaning: 'Aviso' },
    { color: 'gray', meaning: 'Outro' },
];

const initialRoles = ['Cirurgia Eletiva', 'Plantão', 'Ambulatório', 'Emergência', 'Técnico(a)'];


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
        setCalendars(loadedCalendars);
        setActiveCalendarId(storedActiveId || loadedCalendars[0]?.id || '');
        setEmployees(storedEmployees ? JSON.parse(storedEmployees) : initialEmployees);
        setRoles(storedRoles ? JSON.parse(storedRoles) : initialRoles);
        setColorMeanings(storedColorMeanings ? JSON.parse(storedColorMeanings) : initialColorMeanings);
        setIsSidebarOpen(storedSidebarState ? JSON.parse(storedSidebarState) : true);

    } catch (error) {
        console.error("Failed to load from localStorage", error);
        toast({
            variant: "destructive",
            title: "Erro ao Carregar Dados",
            description: "Não foi possível carregar os dados salvos. Usando valores padrão.",
        });
        setCalendars(initialCalendars);
        setActiveCalendarId(initialCalendars[0]?.id || '');
        setEmployees(initialEmployees);
        setRoles(initialRoles);
        setColorMeanings(initialColorMeanings);
        setIsSidebarOpen(true);
    }
  }, [toast]);

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

  const handleAddShift = (newShift: Omit<Shift, 'id'>) => {
    const shiftWithId: Shift = {
      ...newShift,
      id: Date.now().toString(),
    };
    updateActiveCalendarShifts([...shifts, shiftWithId]);
    toast({ title: "Turno Adicionado", description: "O novo turno foi adicionado ao calendário." });
  };
  
  const handleUpdateShift = (updatedShift: Shift) => {
    const newShifts = shifts.map(s => s.id === updatedShift.id ? updatedShift : s);
    updateActiveCalendarShifts(newShifts);
    toast({ title: "Turno Atualizado", description: "O turno foi atualizado com sucesso." });
  };

  const handleDeleteShift = (shiftId: string) => {
    const newShifts = shifts.filter(s => s.id !== shiftId);
    updateActiveCalendarShifts(newShifts);
    toast({ title: "Turno Excluído", description: "O turno foi removido do calendário." });
  };
  
  const handleApplySuggestions = (suggestedShifts: {
      employeeId: string;
      shiftDay: string;
      shiftStartTime: string;
      shiftEndTime: string;
      role: string;
  }[]) => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(currentDate);

      const weekdayMap: { [key: string]: number } = {
          'sunday': 0, 'domingo': 0,
          'monday': 1, 'segunda-feira': 1,
          'tuesday': 2, 'terça-feira': 2,
          'wednesday': 3, 'quarta-feira': 3,
          'thursday': 4, 'quinta-feira': 4,
          'friday': 5, 'sexta-feira': 5,
          'saturday': 6, 'sábado': 6,
      };

      const newShifts: Shift[] = [];
      const roleColors: Record<string, ShiftColor> = {
        'Cirurgia Eletiva': 'blue',
        'Plantão': 'green',
        'Ambulatório': 'purple',
        'Emergência': 'red',
        'Técnico(a)': 'gray',
      };

      for (let day = 1; day <= daysInMonth; day++) {
          const dateForDay = new Date(year, month, day);
          const dayOfWeek = getDay(dateForDay);

          const matchingSuggestions = suggestedShifts.filter(suggestion => {
              const suggestionDay = suggestion.shiftDay.toLowerCase().replace('-feira', '');
              return weekdayMap[suggestionDay] === dayOfWeek;
          });

          matchingSuggestions.forEach((suggestion, index) => {
              const employee = employees.find(e => e.id === suggestion.employeeId);
              
              if (suggestion.role) {
                newShifts.push({
                    id: `suggested-${dateForDay.getTime()}-${index}`,
                    day: day,
                    role: suggestion.role,
                    employeeName: employee?.name || 'Desconhecido',
                    startTime: suggestion.shiftStartTime,
                    endTime: suggestion.shiftEndTime,
                    color: roleColors[suggestion.role] || 'gray',
                });
              }
          });
      }
      updateActiveCalendarShifts(newShifts);
  };
  
  const handleAddDayEvent = (event: { date: Date; name: string; color: ShiftColor }) => {
    const { date, name, color } = event;
    const day = date.getDate();

    const newCalendars = calendars.map(cal => {
      // Check if event for this day already exists in this calendar
      const eventExists = cal.shifts.some(s => s.day === day && s.role === name);
      if (cal.shifts.some(s => s.day === day && s.role === 'Feriado')) return cal;

      const newShift: Shift = {
        id: `event-${date.getTime()}-${cal.id}`,
        day: day,
        role: name,
        employeeName: '', // Unassigned
        startTime: '00:00',
        endTime: '23:59',
        color: color
      };
      
      // Add the new shift, replacing any other shifts on that day if needed
      const otherShifts = cal.shifts.filter(s => s.day !== day);
      return { ...cal, shifts: [...otherShifts, newShift] };
    });

    setCalendars(newCalendars);
    toast({
      title: "Evento de Dia Inteiro Adicionado",
      description: `${name} foi adicionado a ${format(date, 'dd/MM/yyyy')} em todos os calendários.`,
    });
  };

  const filteredShifts = shifts.filter(shift => {
    const query = searchQuery.toLowerCase();
    return (
      shift.employeeName.toLowerCase().includes(query) ||
      shift.role.toLowerCase().includes(query)
    );
  });
  
  if (!isClient || !activeCalendar) {
    // You can render a loader or null here to avoid hydration mismatch
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground print:bg-transparent print:h-auto">
      <Header
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        employees={employees}
        onApplySuggestions={handleApplySuggestions}
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
      />
      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        {isSidebarOpen && <EmployeeSidebar 
            employees={employees} 
            onEmployeesChange={setEmployees}
            shifts={shifts}
            currentDate={currentDate}
            onUpdateShift={handleUpdateShift}
            onDeleteShift={handleDeleteShift}
            roles={roles}
            calendarName={activeCalendar.name}
            onAddDayEvent={handleAddDayEvent}
             />}
        <main className="flex-1 overflow-auto p-4 md:p-6 print:p-0">
          <div className="bg-white rounded-lg shadow print:shadow-none print:rounded-none">
            <CalendarView 
              currentDate={currentDate} 
              shifts={filteredShifts}
              onAddShift={handleAddShift} 
              employees={employees}
              onUpdateShift={handleUpdateShift}
              onDeleteShift={handleDeleteShift}
              roles={roles}
            />
          </div>
          <div className="print:hidden">
              <ColorLegend meanings={colorMeanings} />
          </div>
        </main>
      </div>
    </div>
  );
}
