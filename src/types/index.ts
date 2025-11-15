export type UserRole = 'dentist' | 'assistant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export interface Dentist {
  id: string;
  userId: string;
  name: string;
  specialty: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  photo?: string;
  bio?: string;
  workingHours: WorkingHours;
  vacationDates: Date[];
  services: Service[];
  bookingPageId: string;
}

export interface WorkingHours {
  [key: string]: { start: string; end: string; enabled: boolean }; // key is day: 'monday', 'tuesday', etc.
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number; // in minutes
  price: number;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  dentistId: string;
  patientId: string;
  serviceId: string;
  date: Date;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  appointments: Appointment[];
}

export interface BookingRequest {
  dentistId: string;
  serviceId: string;
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
}

