import { PatientBooking } from './limsService';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'doctor' | 'patient';
  recipientId: string;
  recipientName: string;
  timestamp: string;
  type: 'text' | 'result_share' | 'test_prescription' | 'medication_prescription' | 'appointment' | 'clinical_note';
  content: string;
  metadata?: {
    // Result share metadata
    testName?: string;
    bookingCode?: string;
    bookingId?: string;
    resultSummary?: string;
    isBatch?: boolean;
    batchTestCount?: number;
    richContent?: string;

    // Test prescription metadata
    prescribedTests?: Array<{
      code: string;
      name: string;
      category?: string;
      notes?: string;
    }>;
    clinicalIndication?: string;
    prescriptionStatus?: 'pending' | 'booked';
    bookingIdGenerated?: string;

    // Medication prescription metadata
    medications?: Array<{
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    validUntil?: string;

    // Appointment metadata
    appointmentId?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentType?: 'in_person' | 'teleconsultation' | 'lab_review';
    appointmentStatus?: 'requested' | 'confirmed' | 'rescheduled' | 'cancelled';
    location?: string;
  };
}

export interface DoctorPatientConnection {
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorHospital: string;
  doctorPhone: string;
  doctorAvatar?: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  status: 'active' | 'pending';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

const STORAGE_KEY = 'nanoLabs_doctor_patient_chat';
const CONNECTIONS_KEY = 'nanoLabs_doctor_patient_connections';

const DEFAULT_CONNECTIONS: DoctorPatientConnection[] = [
  {
    doctorId: 'doc_kamga_101',
    doctorName: 'Dr. Joseph Kamga, MD',
    doctorSpecialty: 'Internal Medicine & Infectious Diseases',
    doctorHospital: 'Hôpital Général de Douala / Clinique des Roses',
    doctorPhone: '+237 671 22 33 44',
    patientId: 'demo_patient',
    patientName: 'Mme. Claire Ngo',
    patientPhone: '+237 699 00 11 22',
    status: 'active',
    lastMessage: 'Your blood test results look promising. Let us follow up with lipid monitoring.',
    lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0
  },
  {
    doctorId: 'doc_mbongo_102',
    doctorName: 'Dr. Suzanne Mbongo, MD',
    doctorSpecialty: 'Clinical Biology & Hematology Specialist',
    doctorHospital: 'Laboratoire Central Akwa',
    doctorPhone: '+237 690 88 77 66',
    patientId: 'demo_patient',
    patientName: 'Mme. Claire Ngo',
    patientPhone: '+237 699 00 11 22',
    status: 'active',
    lastMessage: 'Single test A4 diagnostic report for Full Blood Count is signed and validated.',
    lastMessageTime: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 0
  }
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    senderId: 'doc_kamga_101',
    senderName: 'Dr. Joseph Kamga, MD',
    senderRole: 'doctor',
    recipientId: 'demo_patient',
    recipientName: 'Mme. Claire Ngo',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: 'text',
    content: 'Bonjour Mme. Ngo. Following our consultation yesterday regarding your recurring fatigue, I have prepared a diagnostic laboratory prescription. Please take this test at your earliest convenience via nanoLabs.'
  },
  {
    id: 'msg-init-2',
    senderId: 'doc_kamga_101',
    senderName: 'Dr. Joseph Kamga, MD',
    senderRole: 'doctor',
    recipientId: 'demo_patient',
    recipientName: 'Mme. Claire Ngo',
    timestamp: new Date(Date.now() - 86400000 * 2 + 120000).toISOString(),
    type: 'test_prescription',
    content: 'Digital Laboratory Order: Metabolic & Hematological Diagnostic Panel',
    metadata: {
      clinicalIndication: 'Persistent asthenia, screening for iron deficiency anemia and glycemic balance',
      prescriptionStatus: 'pending',
      prescribedTests: [
        { code: 'NFS-FBC', name: 'Complete Blood Count (NFS / Hémogramme)', category: 'Hematology', notes: 'Evaluate hemoglobin and red blood cell indices' },
        { code: 'GLYC', name: 'Fasting Blood Glucose (Glycémie à Jeûn)', category: 'Biochemistry', notes: 'Morning fasting sample' },
        { code: 'LIPID', name: 'Lipid Profile (Bilan Lipidique Complet)', category: 'Biochemistry', notes: 'Cholesterol, HDL, LDL, Triglycerides' }
      ]
    }
  },
  {
    id: 'msg-init-3',
    senderId: 'demo_patient',
    senderName: 'Mme. Claire Ngo',
    senderRole: 'patient',
    recipientId: 'doc_kamga_101',
    recipientName: 'Dr. Joseph Kamga, MD',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    type: 'text',
    content: 'Thank you Doctor! I had my sample collected at home by the nanoLabs phlebotomist this morning. I will share the official A4 reports as soon as they are signed.'
  },
  {
    id: 'msg-init-4',
    senderId: 'demo_patient',
    senderName: 'Mme. Claire Ngo',
    senderRole: 'patient',
    recipientId: 'doc_kamga_101',
    recipientName: 'Dr. Joseph Kamga, MD',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    type: 'result_share',
    content: 'Shared Official A4 Diagnostic Report: Complete Blood Count (NFS)',
    metadata: {
      testName: 'Complete Blood Count (NFS / Hémogramme)',
      bookingCode: 'BK-2026-0813-001',
      bookingId: 'BK-2026-0813-001',
      resultSummary: 'Hb: 12.8 g/dL (Normal) | WBC: 6,400 /mm³ | Platelets: 285,000 /mm³',
      isBatch: false
    }
  },
  {
    id: 'msg-init-5',
    senderId: 'doc_kamga_101',
    senderName: 'Dr. Joseph Kamga, MD',
    senderRole: 'doctor',
    recipientId: 'demo_patient',
    recipientName: 'Mme. Claire Ngo',
    timestamp: new Date(Date.now() - 21600000).toISOString(),
    type: 'medication_prescription',
    content: 'Clinical Consultation Summary & Post-Lab Treatment Protocol',
    metadata: {
      clinicalIndication: 'Mild normocytic fatigue recovery',
      validUntil: '30 days',
      medications: [
        {
          id: 'med-1',
          name: 'Ferrous Sulfate + Folic Acid (Fumafer)',
          dosage: '66mg elemental iron',
          frequency: 'Once daily in the morning',
          duration: '30 days',
          instructions: 'Take with a glass of orange juice or water; avoid tea within 2 hours'
        },
        {
          id: 'med-2',
          name: 'Vitamin C (Ascorbic Acid)',
          dosage: '500mg',
          frequency: 'Once daily',
          duration: '15 days',
          instructions: 'Morning intake'
        }
      ]
    }
  },
  {
    id: 'msg-init-6',
    senderId: 'doc_kamga_101',
    senderName: 'Dr. Joseph Kamga, MD',
    senderRole: 'doctor',
    recipientId: 'demo_patient',
    recipientName: 'Mme. Claire Ngo',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'appointment',
    content: 'Follow-Up Clinical Review Appointment Scheduled',
    metadata: {
      appointmentId: 'apt-followup-409',
      appointmentDate: '2026-09-24',
      appointmentTime: '10:30 AM',
      appointmentType: 'in_person',
      appointmentStatus: 'confirmed',
      location: 'Clinique des Roses, Akwa - Douala (Cabinet 3B)'
    }
  }
];

class DoctorChatService {
  private getStorage(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MESSAGES));
    return DEFAULT_MESSAGES;
  }

  private setStorage(messages: ChatMessage[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }

  public getConnections(): DoctorPatientConnection[] {
    try {
      const data = localStorage.getItem(CONNECTIONS_KEY);
      if (data) return JSON.parse(data);
    } catch {}
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(DEFAULT_CONNECTIONS));
    return DEFAULT_CONNECTIONS;
  }

  public getMessages(patientId: string, doctorId: string): ChatMessage[] {
    const all = this.getStorage();
    return all.filter(
      (m) =>
        (m.senderId === patientId && m.recipientId === doctorId) ||
        (m.senderId === doctorId && m.recipientId === patientId)
    );
  }

  public sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const all = this.getStorage();
    const newMsg: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    all.push(newMsg);
    this.setStorage(all);

    // Update connection last message
    const connections = this.getConnections();
    const connIdx = connections.findIndex(
      c => (c.doctorId === message.senderId && c.patientId === message.recipientId) ||
           (c.doctorId === message.recipientId && c.patientId === message.senderId)
    );
    if (connIdx >= 0) {
      connections[connIdx].lastMessage = message.content;
      connections[connIdx].lastMessageTime = newMsg.timestamp;
      localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
    }

    return newMsg;
  }

  // Helper for Patient to Share a Single Test or Batch A4 Result directly into chat
  public shareTestResult(params: {
    senderId: string;
    senderName: string;
    doctorId: string;
    doctorName: string;
    testName: string;
    bookingCode: string;
    bookingId?: string;
    resultSummary: string;
    isBatch?: boolean;
    batchTestCount?: number;
    richContent?: string;
  }): ChatMessage {
    return this.sendMessage({
      senderId: params.senderId,
      senderName: params.senderName,
      senderRole: 'patient',
      recipientId: params.doctorId,
      recipientName: params.doctorName,
      type: 'result_share',
      content: params.isBatch 
        ? `Shared Consolidated Batch Diagnostic Report (${params.batchTestCount || 'Multiple'} tests)`
        : `Shared Official A4 Diagnostic Report: ${params.testName}`,
      metadata: {
        testName: params.testName,
        bookingCode: params.bookingCode,
        bookingId: params.bookingId,
        resultSummary: params.resultSummary,
        isBatch: params.isBatch,
        batchTestCount: params.batchTestCount,
        richContent: params.richContent
      }
    });
  }

  // Helper for Doctor to prescribe tests inside the chat
  public prescribeTests(params: {
    doctorId: string;
    doctorName: string;
    patientId: string;
    patientName: string;
    indication: string;
    tests: Array<{ code: string; name: string; category?: string; notes?: string }>;
  }): ChatMessage {
    return this.sendMessage({
      senderId: params.doctorId,
      senderName: params.doctorName,
      senderRole: 'doctor',
      recipientId: params.patientId,
      recipientName: params.patientName,
      type: 'test_prescription',
      content: `Digital Test Prescription: ${params.tests.map(t => t.name).join(', ')}`,
      metadata: {
        clinicalIndication: params.indication,
        prescriptionStatus: 'pending',
        prescribedTests: params.tests
      }
    });
  }

  // Helper for Doctor to send medications
  public prescribeMedications(params: {
    doctorId: string;
    doctorName: string;
    patientId: string;
    patientName: string;
    indication: string;
    medications: Array<{
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
  }): ChatMessage {
    return this.sendMessage({
      senderId: params.doctorId,
      senderName: params.doctorName,
      senderRole: 'doctor',
      recipientId: params.patientId,
      recipientName: params.patientName,
      type: 'medication_prescription',
      content: `Medication Prescription & Protocol (${params.medications.length} items)`,
      metadata: {
        clinicalIndication: params.indication,
        medications: params.medications,
        validUntil: '30 days'
      }
    });
  }

  // Helper to schedule or update appointment
  public scheduleAppointment(params: {
    senderId: string;
    senderName: string;
    senderRole: 'doctor' | 'patient';
    recipientId: string;
    recipientName: string;
    date: string;
    time: string;
    type: 'in_person' | 'teleconsultation' | 'lab_review';
    location?: string;
  }): ChatMessage {
    return this.sendMessage({
      senderId: params.senderId,
      senderName: params.senderName,
      senderRole: params.senderRole,
      recipientId: params.recipientId,
      recipientName: params.recipientName,
      type: 'appointment',
      content: `Appointment: ${params.date} at ${params.time} (${params.type.replace('_', ' ')})`,
      metadata: {
        appointmentId: `apt-${Date.now()}`,
        appointmentDate: params.date,
        appointmentTime: params.time,
        appointmentType: params.type,
        appointmentStatus: 'confirmed',
        location: params.location || 'Doctor Practice'
      }
    });
  }

  public updateAppointmentStatus(messageId: string, status: 'confirmed' | 'rescheduled' | 'cancelled') {
    const all = this.getStorage();
    const target = all.find(m => m.id === messageId);
    if (target && target.metadata) {
      target.metadata.appointmentStatus = status;
      this.setStorage(all);
    }
  }

  public markPrescriptionBooked(messageId: string, bookingId: string) {
    const all = this.getStorage();
    const target = all.find(m => m.id === messageId);
    if (target && target.metadata) {
      target.metadata.prescriptionStatus = 'booked';
      target.metadata.bookingIdGenerated = bookingId;
      this.setStorage(all);
    }
  }
}

export const doctorChatService = new DoctorChatService();
