

export type ShiftColor = 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'gray' | 'pink' | 'cyan' | 'orange' | 'indigo' | 'teal' | 'lime';

export type Shift = {
  id: string;
  date: string; // YYYY-MM-DD
  role: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  color: ShiftColor;
};

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type EmployeeAvailability = {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
};

export type Role = {
  id: string;
  name: string;
  unavailabilityRules: EmployeeAvailability[];
};


export type Employee = {
  id: string;
  name: string;
  roleId: string;
  availability: EmployeeAvailability[];
  preferences: string;
};

export type Calendar = {
  id: string;
  name: string;
  shifts: Shift[];
};

    