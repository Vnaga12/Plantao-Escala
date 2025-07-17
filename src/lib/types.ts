export type Shift = {
  id: string;
  day: number;
  role: 'Doctor' | 'Nurse' | 'Technician';
  employeeName: string;
  startTime: string;
  endTime: string;
  color: 'blue' | 'green' | 'purple';
};

export type EmployeeAvailability = {
  day: string;
  startTime: string;
  endTime: string;
};

export type Employee = {
  id: string;
  name: string;
  availability: EmployeeAvailability[];
  preferences: string;
};
