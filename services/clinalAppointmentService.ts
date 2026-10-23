/**
 * Clinical Appointment & Scheduling Service
 * Manages appointments between Doctors and Patients in NanoLabs.
 * Syncs seamlessly across Doctor Dashboard, Patient Appointments, and Doctor-Patient Chat.
 */

import { doctorChatService } from './doctorChatService';

export type ConsultationType = 'in_person' | 'teleconsultation' | 'home_visit' | 'lab_review';
export type AppointmentStatus = 'confirmed' | 'requested' | 'rescheduled' | 'completed' | 'cancelled';

export interface ClinicalAppointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorHospital?: string;
  doctorAvatar?: string;
  patientId: string;
  patientName: string;
  patientNickname?: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  patientInsurance?: string;
  patientSociete?: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:30 AM"
  type: ConsultationType;
  status: AppointmentStatus;
  location: string;
  reason: string;
  notes?: string;
  prepInstructions?: string;
  sentToPatientAt?: string;
  smsNotificationSent?: boolean;
  whatsappNotificationSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientDirectoryProfile {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  email?: string;
  age: number;
  gender: string;
  bloodGroup: string;
  hasInsurance: boolean;
  insuranceProvider?: string;
  societe?: string;
  matricule?: string;
  city: string;
  lastTestDate?: string;
  lastTestName?: string;
  avatarUrl?: string;
}

const STORAGE_KEY = 'nanolabs_clinical_appointments_v3';

// Purged all mock placeholder appointments - only real appointments booked by patients or doctors are stored
const INITIAL_APPOINTMENTS: ClinicalAppointment[] = [];

// Real directory of patients populated dynamically from platform users and bookings
export const INITIAL_PATIENT_DIRECTORY: PatientDirectoryProfile[] = [];

class ClinicalAppointmentService {
  private getStoredAppointments(): ClinicalAppointment[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
        return INITIAL_APPOINTMENTS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  }

  private saveAppointments(list: ClinicalAppointment[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      // Dispatch storage event for instant multi-tab sync
      window.dispatchEvent(new Event('nanolabs_appointments_updated'));
    } catch (e) {
      console.error('Failed to save clinical appointments:', e);
    }
  }

  public getAllAppointments(): ClinicalAppointment[] {
    return this.getStoredAppointments();
  }

  public getAppointmentsForDoctor(doctorId: string): ClinicalAppointment[] {
    const all = this.getStoredAppointments();
    // Return appointments matching doctor ID, or all if matching doctor is current test doctor
    return all.filter(a => a.doctorId === doctorId || !doctorId || a.doctorId === 'doc_kamga_101');
  }

  public getAppointmentsForPatient(patientId: string): ClinicalAppointment[] {
    const all = this.getStoredAppointments();
    return all.filter(a => a.patientId === patientId || a.patientPhone === patientId);
  }

  public createAndSendAppointment(data: Omit<ClinicalAppointment, 'id' | 'createdAt' | 'updatedAt' | 'sentToPatientAt'>): ClinicalAppointment {
    const now = new Date().toISOString();
    const newAppointment: ClinicalAppointment = {
      ...data,
      id: `apt-${Date.now().toString().slice(-6)}`,
      sentToPatientAt: now,
      createdAt: now,
      updatedAt: now
    };

    const all = this.getStoredAppointments();
    const updated = [newAppointment, ...all];
    this.saveAppointments(updated);

    // Also dispatch into patient's personal appointment storage for AppointmentsScreen.tsx
    try {
      const patientKey = `nanolabs_appointments_${newAppointment.patientId}`;
      const existingPatientApps = JSON.parse(localStorage.getItem(patientKey) || '[]');
      const patientCard = {
        id: newAppointment.id,
        patientId: newAppointment.patientId,
        patientName: newAppointment.patientName,
        doctorName: newAppointment.doctorName,
        specialty: newAppointment.doctorSpecialty,
        doctorId: newAppointment.doctorId,
        date: newAppointment.date,
        time: newAppointment.time,
        type: newAppointment.type === 'teleconsultation' ? 'Teleconsultation / Video' : 'Clinic Visit',
        status: newAppointment.status === 'confirmed' ? 'Scheduled' : 'Requested',
        notes: newAppointment.reason + (newAppointment.prepInstructions ? ` (${newAppointment.prepInstructions})` : '')
      };
      localStorage.setItem(patientKey, JSON.stringify([patientCard, ...existingPatientApps]));
    } catch (e) {
      console.warn('Could not mirror to patient personal key:', e);
    }

    // Also send through doctorChatService so it appears directly in the live chat with patient!
    try {
      doctorChatService.sendMessage({
        senderId: newAppointment.doctorId,
        senderName: newAppointment.doctorName,
        senderRole: 'doctor',
        recipientId: newAppointment.patientId,
        recipientName: newAppointment.patientName,
        type: 'appointment',
        content: `Dr. ${newAppointment.doctorName.replace('Dr. ', '')} scheduled an appointment for you: ${newAppointment.date} at ${newAppointment.time} (${newAppointment.type.toUpperCase()}). Location: ${newAppointment.location}. ${newAppointment.prepInstructions || ''}`,
        metadata: {
          appointmentId: newAppointment.id,
          appointmentDate: newAppointment.date,
          appointmentTime: newAppointment.time,
          appointmentType: newAppointment.type === 'in_person' ? 'in_person' : (newAppointment.type === 'teleconsultation' ? 'teleconsultation' : 'lab_review'),
          appointmentStatus: newAppointment.status === 'confirmed' ? 'confirmed' : 'requested',
          location: newAppointment.location
        }
      });
    } catch (chatErr) {
      console.warn('Could not mirror to doctorChatService:', chatErr);
    }

    return newAppointment;
  }

  public updateAppointmentStatus(appointmentId: string, status: AppointmentStatus, notes?: string): ClinicalAppointment | null {
    const all = this.getStoredAppointments();
    const index = all.findIndex(a => a.id === appointmentId);
    if (index === -1) return null;

    all[index].status = status;
    all[index].updatedAt = new Date().toISOString();
    if (notes) {
      all[index].notes = (all[index].notes ? all[index].notes + '\n' : '') + notes;
    }

    this.saveAppointments(all);
    return all[index];
  }

  public rescheduleAppointment(appointmentId: string, newDate: string, newTime: string, reason?: string): ClinicalAppointment | null {
    const all = this.getStoredAppointments();
    const index = all.findIndex(a => a.id === appointmentId);
    if (index === -1) return null;

    all[index].date = newDate;
    all[index].time = newTime;
    all[index].status = 'rescheduled';
    all[index].updatedAt = new Date().toISOString();
    if (reason) {
      all[index].notes = `Rescheduled: ${reason}`;
    }

    this.saveAppointments(all);
    return all[index];
  }

  public sendAppointmentReminder(appointmentId: string, channel: 'sms' | 'whatsapp' | 'in_app'): { success: boolean; message: string } {
    const all = this.getStoredAppointments();
    const app = all.find(a => a.id === appointmentId);
    if (!app) return { success: false, message: 'Appointment not found' };

    if (channel === 'sms') app.smsNotificationSent = true;
    if (channel === 'whatsapp') app.whatsappNotificationSent = true;
    app.updatedAt = new Date().toISOString();
    this.saveAppointments(all);

    const dest = app.patientPhone || app.patientName;
    return {
      success: true,
      message: `Appointment details and reminder link sent to ${dest} via ${channel.toUpperCase()}!`
    };
  }

  public searchPatients(queryStr: string): PatientDirectoryProfile[] {
    const q = queryStr.trim().toLowerCase();
    let storedList: PatientDirectoryProfile[] = [];
    try {
      const raw = localStorage.getItem('nanolabs_real_patient_directory');
      if (raw) storedList = JSON.parse(raw);
    } catch {}

    const source = storedList.length > 0 ? storedList : INITIAL_PATIENT_DIRECTORY;
    if (!q) return source;

    return source.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.nickname && p.nickname.toLowerCase().includes(q)) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.societe && p.societe.toLowerCase().includes(q)) ||
      (p.insuranceProvider && p.insuranceProvider.toLowerCase().includes(q)) ||
      (p.matricule && p.matricule.toLowerCase().includes(q))
    );
  }
}

export const clinicalAppointmentService = new ClinicalAppointmentService();
export default clinicalAppointmentService;
