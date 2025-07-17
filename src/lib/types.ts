
export type Shift = {
  id: string;
  day: number;
  role: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  color: 'blue' | 'green' | 'purple';
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
