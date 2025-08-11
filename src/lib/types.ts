
export type ShiftColor = 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'gray';

export type Shift = {
  id: string;
  date: string; // YYYY-MM-DD
  role: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  color: ShiftColor;
};

export type EmployeeAvailability = {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | string;
  startTime: string;
  endTime: string;
};

export type Employee = {
  id: string;
  name: string;
  availability: EmployeeAvailability[];
  preferences: string;
};

export type Calendar = {
  id: string;
  name: string;
  shifts: Shift[];
};
