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

// Seed appointments for immediate responsiveness
const INITIAL_APPOINTMENTS: ClinicalAppointment[] = [
  {
    id: 'apt-001',
    doctorId: 'doc_kamga_101',
    doctorName: 'Dr. Joseph Kamga, MD',
    doctorSpecialty: 'Internal Medicine & Diagnostics',
    doctorHospital: 'Clinique des Roses, Douala',
    patientId: 'pat_claire_01',
    patientName: 'Mme. Claire Ngo',
    patientNickname: 'Claire N.',
    patientPhone: '+237 671 22 33 44',
    patientAge: 38,
    patientGender: 'Female',
    patientInsurance: 'AXA Assurances',
    patientSociete: 'ENEO Cameroon SA',
    date: new Date().toISOString().split('T')[0],
    time: '10:30 AM',
    type: 'in_person',
    status: 'confirmed',
    location: 'Cabinet Médical Akwa, Salle 2, Douala',
    reason: 'Follow-up on Complete Blood Count (NFS) & Fasting Glycemia',
    prepInstructions: 'Please bring previous diagnostic carnet and arrive 10 min early.',
    sentToPatientAt: new Date(Date.now() - 3600000).toISOString(),
    smsNotificationSent: true,
    whatsappNotificationSent: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'apt-002',
    doctorId: 'doc_kamga_101',
    doctorName: 'Dr. Joseph Kamga, MD',
    doctorSpecialty: 'Internal Medicine & Diagnostics',
    doctorHospital: 'Clinique des Roses, Douala',
    patientId: 'pat_roland_02',
    patientName: 'M. Roland Tchouassi',
    patientNickname: 'Roland T.',
    patientPhone: '+237 690 55 66 77',
    patientAge: 52,
    patientGender: 'Male',
    patientInsurance: 'Activa Assurances',
    patientSociete: 'SABC Boissons',
    date: new Date().toISOString().split('T')[0],
    time: '02:00 PM',
    type: 'teleconsultation',
    status: 'confirmed',
    location: 'Secure Encrypted Video Room #04 (Telehealth)',
    reason: 'Cardiovascular Lipid Panel & High-Sensitivity CRP interpretation',
    prepInstructions: 'Join video room 5 minutes prior via patient app.',
    sentToPatientAt: new Date(Date.now() - 7200000).toISOString(),
    smsNotificationSent: true,
    whatsappNotificationSent: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'apt-003',
    doctorId: 'doc_kamga_101',
    doctorName: 'Dr. Joseph Kamga, MD',
    doctorSpecialty: 'Internal Medicine & Diagnostics',
    doctorHospital: 'Clinique des Roses, Douala',
    patientId: 'pat_beatrice_03',
    patientName: 'Mme. Béatrice Nguemo',
    patientNickname: 'Béatrice',
    patientPhone: '+237 699 11 22 33',
    patientAge: 45,
    patientGender: 'Female',
    patientInsurance: 'Gras Savoye',
    patientSociete: 'Orange Cameroun',
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })(),
    time: '11:15 AM',
    type: 'lab_review',
    status: 'requested',
    location: 'Biodiagnostic Labo Consultation Room, Douala',
    reason: 'Liver Functional Panel (ASAT/ALAT) & Hepatitis B Serology review',
    prepInstructions: 'Lab results will be digitally synced directly onto doctor console.',
    sentToPatientAt: new Date().toISOString(),
    smsNotificationSent: true,
    whatsappNotificationSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'apt-004',
    doctorId: 'doc_kamga_101',
    doctorName: 'Dr. Joseph Kamga, MD',
    doctorSpecialty: 'Internal Medicine & Diagnostics',
    doctorHospital: 'Clinique des Roses, Douala',
    patientId: 'pat_samuel_04',
    patientName: 'M. Samuel Eboa',
    patientNickname: 'Sam E.',
    patientPhone: '+237 677 88 99 00',
    patientAge: 29,
    patientGender: 'Male',
    patientInsurance: 'Chanas Assurances',
    patientSociete: 'TotalEnergies Marketing',
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return d.toISOString().split('T')[0];
    })(),
    time: '04:30 PM',
    type: 'home_visit',
    status: 'confirmed',
    location: 'Patient Residence - Bonapriso, Douala',
    reason: 'Post-Malaria convalescence evaluation and full metabolic review',
    prepInstructions: 'Home phlebotomy sample collected earlier today.',
    sentToPatientAt: new Date().toISOString(),
    smsNotificationSent: true,
    whatsappNotificationSent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Baseline directory of searchable patients
export const INITIAL_PATIENT_DIRECTORY: PatientDirectoryProfile[] = [
  {
    id: 'pat_claire_01',
    name: 'Mme. Claire Ngo',
    nickname: 'Claire N.',
    phone: '+237 671 22 33 44',
    email: 'claire.ngo@eneo.cm',
    age: 38,
    gender: 'Female',
    bloodGroup: 'O+',
    hasInsurance: true,
    insuranceProvider: 'AXA Assurances',
    societe: 'ENEO Cameroon SA',
    matricule: 'ENEO-7842',
    city: 'Douala',
    lastTestDate: 'Yesterday',
    lastTestName: 'Complete Blood Count (NFS) & Fasting Glycemia',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'pat_roland_02',
    name: 'M. Roland Tchouassi',
    nickname: 'Roland T.',
    phone: '+237 690 55 66 77',
    email: 'roland.tchouassi@sabc.cm',
    age: 52,
    gender: 'Male',
    bloodGroup: 'A+',
    hasInsurance: true,
    insuranceProvider: 'Activa Assurances',
    societe: 'SABC Boissons',
    matricule: 'SABC-1092',
    city: 'Douala',
    lastTestDate: '3 days ago',
    lastTestName: 'Lipid Profile & High-Sensitivity CRP',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'pat_beatrice_03',
    name: 'Mme. Béatrice Nguemo',
    nickname: 'Béatrice',
    phone: '+237 699 11 22 33',
    email: 'beatrice.nguemo@orange.cm',
    age: 45,
    gender: 'Female',
    bloodGroup: 'B+',
    hasInsurance: true,
    insuranceProvider: 'Gras Savoye',
    societe: 'Orange Cameroun',
    matricule: 'ORA-9921',
    city: 'Douala',
    lastTestDate: '5 days ago',
    lastTestName: 'Liver Functional Panel (Transaminases ASAT/ALAT)',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'pat_samuel_04',
    name: 'M. Samuel Eboa',
    nickname: 'Sam E.',
    phone: '+237 677 88 99 00',
    email: 'samuel.eboa@total.cm',
    age: 29,
    gender: 'Male',
    bloodGroup: 'O-',
    hasInsurance: true,
    insuranceProvider: 'Chanas Assurances',
    societe: 'TotalEnergies Marketing',
    matricule: 'TOT-4401',
    city: 'Douala',
    lastTestDate: 'Today',
    lastTestName: 'Thick Smear & Malaria RDT + Full Blood Count',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'pat_aissatou_05',
    name: 'Mme. Aïssatou Bello',
    nickname: 'Aïcha B.',
    phone: '+237 675 44 33 22',
    email: 'aissatou.bello@gmail.com',
    age: 33,
    gender: 'Female',
    bloodGroup: 'AB+',
    hasInsurance: true,
    insuranceProvider: 'Saham / Sanlam',
    societe: 'CIMENCAM',
    matricule: 'CIM-2033',
    city: 'Yaoundé',
    lastTestDate: '1 week ago',
    lastTestName: 'Thyroid Function Test (TSH, Free T4)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'pat_jean_06',
    name: 'Dr. Jean-Paul Mbarga (Patient)',
    nickname: 'Jean-Paul',
    phone: '+237 691 22 44 66',
    email: 'jp.mbarga@yahoo.fr',
    age: 61,
    gender: 'Male',
    bloodGroup: 'O+',
    hasInsurance: true,
    insuranceProvider: 'Allianz Cameroun',
    societe: 'Port Autonome de Douala',
    matricule: 'PAD-5120',
    city: 'Douala',
    lastTestDate: '2 weeks ago',
    lastTestName: 'Prostate Specific Antigen (PSA Total/Libre) & Urea/Creatinine',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
  }
];

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
    if (!q) return INITIAL_PATIENT_DIRECTORY;

    return INITIAL_PATIENT_DIRECTORY.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.nickname.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.societe && p.societe.toLowerCase().includes(q)) ||
      (p.insuranceProvider && p.insuranceProvider.toLowerCase().includes(q)) ||
      (p.matricule && p.matricule.toLowerCase().includes(q))
    );
  }
}

export const clinicalAppointmentService = new ClinicalAppointmentService();
export default clinicalAppointmentService;
