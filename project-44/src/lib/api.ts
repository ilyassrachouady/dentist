import { Dentist, Appointment, Patient, BookingRequest } from '@/types';
import { storage, mockAppointments, mockPatients, demoDentist, getAvailableTimeSlots } from './mock-data';
import { isDemoMode } from './mock-data';

// Mock API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Dentist
  getDentist: async (id: string): Promise<Dentist | null> => {
    await delay(300);
    if (isDemoMode() && id === demoDentist.id) {
      return demoDentist;
    }
    const dentist = storage.getItem(`dentist_${id}`) || storage.getItem('dentist');
    return dentist;
  },

  // Appointments
  getAppointments: async (dentistId: string): Promise<Appointment[]> => {
    await delay(200);
    if (isDemoMode()) {
      return mockAppointments;
    }
    const appointments = storage.getItem(`appointments_${dentistId}`) || [];
    return appointments.map((apt: any) => ({
      ...apt,
      date: new Date(apt.date),
      createdAt: new Date(apt.createdAt),
      updatedAt: new Date(apt.updatedAt),
    }));
  },

  createAppointment: async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> => {
    await delay(400);
    const newAppointment: Appointment = {
      ...appointment,
      id: `apt-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const appointments = await api.getAppointments(appointment.dentistId);
    appointments.push(newAppointment);
    storage.setItem(`appointments_${appointment.dentistId}`, appointments);
    
    return newAppointment;
  },

  updateAppointment: async (id: string, updates: Partial<Appointment>): Promise<Appointment> => {
    await delay(300);
    const appointments = await api.getAppointments(updates.dentistId || '');
    const index = appointments.findIndex(apt => apt.id === id);
    
    if (index === -1) throw new Error('Appointment not found');
    
    appointments[index] = {
      ...appointments[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    storage.setItem(`appointments_${appointments[index].dentistId}`, appointments);
    return appointments[index];
  },

  deleteAppointment: async (id: string, dentistId: string): Promise<void> => {
    await delay(200);
    const appointments = await api.getAppointments(dentistId);
    const filtered = appointments.filter(apt => apt.id !== id);
    storage.setItem(`appointments_${dentistId}`, filtered);
  },

  // Patients
  getPatients: async (dentistId: string): Promise<Patient[]> => {
    await delay(200);
    if (isDemoMode()) {
      return mockPatients;
    }
    const patients = storage.getItem(`patients_${dentistId}`) || [];
    return patients.map((p: any) => ({
      ...p,
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : undefined,
      createdAt: new Date(p.createdAt),
      appointments: p.appointments?.map((apt: any) => ({
        ...apt,
        date: new Date(apt.date),
        createdAt: new Date(apt.createdAt),
        updatedAt: new Date(apt.updatedAt),
      })) || [],
    }));
  },

  getPatient: async (id: string, dentistId: string): Promise<Patient | null> => {
    await delay(200);
    const patients = await api.getPatients(dentistId);
    return patients.find(p => p.id === id) || null;
  },

  createPatient: async (patient: Omit<Patient, 'id' | 'createdAt' | 'appointments'>): Promise<Patient> => {
    await delay(300);
    const newPatient: Patient = {
      ...patient,
      id: `p-${Date.now()}`,
      createdAt: new Date(),
      appointments: [],
    };
    
    const patients = await api.getPatients(patient.id); // This will need dentistId
    patients.push(newPatient);
    storage.setItem(`patients_${patient.id}`, patients);
    
    return newPatient;
  },

  updatePatient: async (id: string, updates: Partial<Patient>, dentistId: string): Promise<Patient> => {
    await delay(300);
    const patients = await api.getPatients(dentistId);
    const index = patients.findIndex(p => p.id === id);
    
    if (index === -1) throw new Error('Patient not found');
    
    patients[index] = {
      ...patients[index],
      ...updates,
    };
    
    storage.setItem(`patients_${dentistId}`, patients);
    return patients[index];
  },

  // Booking
  bookAppointment: async (booking: BookingRequest): Promise<Appointment> => {
    await delay(500);
    
    // Find or create patient
    const patients = await api.getPatients(booking.dentistId);
    let patient = patients.find(p => p.phone === booking.patientPhone);
    
    if (!patient) {
      patient = {
        id: `p-${Date.now()}`,
        name: booking.patientName,
        phone: booking.patientPhone,
        email: booking.patientEmail,
        createdAt: new Date(),
        appointments: [],
      };
      patients.push(patient);
      storage.setItem(`patients_${booking.dentistId}`, patients);
    }
    
    // Create appointment
    const appointment = await api.createAppointment({
      dentistId: booking.dentistId,
      patientId: patient.id,
      serviceId: booking.serviceId,
      date: new Date(booking.date),
      time: booking.time,
      status: 'pending',
      notes: booking.notes,
    });
    
    // Mock WhatsApp confirmation
    console.log(`📱 WhatsApp confirmation sent to ${booking.patientPhone}`);
    
    return appointment;
  },

  // Availability
  getAvailableSlots: async (dentistId: string, date: Date): Promise<string[]> => {
    await delay(200);
    const dentist = await api.getDentist(dentistId);
    if (!dentist) return [];
    
    const appointments = await api.getAppointments(dentistId);
    return getAvailableTimeSlots(date, dentist, appointments);
  },
};

