export  interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  homeAddress: string;
  emergencyContact: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  plateNumber: string;
}

export interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  plateNumber: string;
  driverPhone?: string;
  students: string[];
  arrivedStudents?: string[];
  destination: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  currentLocation?: {
    lat: number;
    lng: number;
  }
  lastLocationUpdate?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'student' | 'driver';
  name: string;
}

export interface Notification {
  id: string;
  type: 'student-arrived' | 'trip-started' | 'trip-completed' | string;
  tripId: string;
  studentId?: string;
  studentName?: string;
  driverId?: string;
  driverName?: string;
  plateNumber?: string;
  destination?: string;
  timestamp: string;
  read: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  arrivedStudents?: string[];
  totalStudents?: number;
}
 