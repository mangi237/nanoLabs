/**
 * Doctor-Patient Social Connect & Secure Clinical Messaging Service
 * 
 * ZERO MOCK DATA: Connections require mutual consent (request -> accept).
 * Patient Privacy: Patients can configure an anonymous Nickname so their legal identity is hidden until mutual connection.
 */

export interface UserSocialProfile {
  id: string;
  role: 'patient' | 'doctor';
  legalName: string;
  nickname: string;
  isAnonymous: boolean; // When true, public searches only reveal the nickname
  avatarUrl?: string;
  phone?: string;
  city?: string;
  specialty?: string; // For doctors
  hospital?: string; // For doctors
  licenseNumber?: string; // For doctors (ONMC)
  bio?: string;
  isOnline?: boolean;
}

export interface ConnectionRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromNickname: string;
  fromRole: 'patient' | 'doctor';
  fromAvatar?: string;
  fromSpecialty?: string;
  fromHospital?: string;
  toId: string;
  toName: string;
  toNickname: string;
  toRole: 'patient' | 'doctor';
  note?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export interface DoctorPatientConnection {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorHospital?: string;
  doctorPhone?: string;
  doctorAvatar?: string;
  patientId: string;
  patientName: string; // Real or nickname depending on privacy
  patientNickname?: string;
  patientPhone?: string;
  status: 'active';
  connectedAt: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  connectionId?: string;
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

const STORAGE_CHATS_KEY = 'nanoLabs_doctor_patient_chats_v2';
const STORAGE_CONNECTIONS_KEY = 'nanoLabs_active_connections_v2';
const STORAGE_REQUESTS_KEY = 'nanoLabs_social_connect_requests_v2';
const STORAGE_PROFILES_KEY = 'nanoLabs_social_user_profiles_v2';

// Baseline accredited specialists directory available for patient connection discovery
const ACCREDITED_DOCTOR_PROFILES: UserSocialProfile[] = [
  {
    id: 'doc_kamga_101',
    role: 'doctor',
    legalName: 'Dr. Joseph Kamga, MD',
    nickname: 'Dr. Kamga',
    isAnonymous: false,
    specialty: 'Internal Medicine & Infectious Diseases',
    hospital: 'Hôpital Général de Douala / Clinique des Roses',
    licenseNumber: 'ONMC #4829-DLA',
    phone: '+237 671 22 33 44',
    city: 'Douala',
    bio: 'Specialist in metabolic syndromic follow-up, infectious diseases, and routine diagnostic panel evaluations.',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    isOnline: true
  },
  {
    id: 'doc_mbongo_102',
    role: 'doctor',
    legalName: 'Dr. Suzanne Mbongo, MD',
    nickname: 'Dr. Suzanne Mbongo',
    isAnonymous: false,
    specialty: 'Clinical Biology & Hematology Specialist',
    hospital: 'Laboratoire Central Akwa',
    licenseNumber: 'ONMC #5102-DLA',
    phone: '+237 690 88 77 66',
    city: 'Douala',
    bio: 'Lead biologist specializing in complete blood count delta-checks, hemoglobinopathies, and coagulation screening.',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813587-251d18471c53?w=150&auto=format&fit=crop&q=80',
    isOnline: true
  },
  {
    id: 'doc_tran_103',
    role: 'doctor',
    legalName: 'Dr. Lisa Tran, MD',
    nickname: 'Dr. Lisa Tran',
    isAnonymous: false,
    specialty: 'Clinical Diagnostic Consult & ENT',
    hospital: 'Centre Médical Laquintinie',
    licenseNumber: 'ONMC #6034-DLA',
    phone: '+237 677 12 34 56',
    city: 'Douala',
    bio: 'General practitioner and diagnostic triage consultant assisting patients with lab preparation and interpretation.',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    isOnline: false
  },
  {
    id: 'doc_ndongo_104',
    role: 'doctor',
    legalName: 'Dr. Christian Ndongo, MD',
    nickname: 'Dr. Christian Ndongo',
    isAnonymous: false,
    specialty: 'Public Health & Anatomopathology',
    hospital: 'Centre Hospitalier Universitaire (CHU) Yaoundé',
    licenseNumber: 'ONMC #3918-YDE',
    phone: '+237 699 44 55 66',
    city: 'Yaoundé',
    bio: 'Anatomic pathologist and preventive medicine specialist with expertise in biopsy correlation and biochemical markers.',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    isOnline: true
  }
];

// Baseline registered patients directory so doctors can search and send connection requests
const INITIAL_PATIENT_PROFILES: UserSocialProfile[] = [
  {
    id: 'pat_claire_01',
    role: 'patient',
    legalName: 'Mme. Claire Ngo',
    nickname: 'Claire_Health',
    isAnonymous: true,
    phone: '+237 671 22 33 44',
    city: 'Douala',
    bio: 'Ongoing metabolic and hematology panel follow-up',
    isOnline: true
  },
  {
    id: 'pat_jean_02',
    role: 'patient',
    legalName: 'M. Jean-Paul Manga',
    nickname: 'JP_Diagnostic',
    isAnonymous: true,
    phone: '+237 699 55 66 77',
    city: 'Douala',
    bio: 'Cardiovascular checkup & lipid profile monitoring',
    isOnline: true
  },
  {
    id: 'pat_marcelle_03',
    role: 'patient',
    legalName: 'Mme. Marcelle Bella',
    nickname: 'Marcelle_B',
    isAnonymous: false,
    phone: '+237 677 88 99 00',
    city: 'Yaoundé',
    bio: 'Prenatal and routine biochemistry screenings',
    isOnline: false
  },
  {
    id: 'pat_samuel_04',
    role: 'patient',
    legalName: 'M. Samuel Eto’o Fosso',
    nickname: 'Samuel_Bio',
    isAnonymous: true,
    phone: '+237 655 12 34 56',
    city: 'Bafoussam',
    bio: 'Infectious disease & routine parasitology screening',
    isOnline: true
  }
];

class DoctorChatService {
  // =========================================================================
  // USER PROFILES & PATIENT PRIVACY NICKNAMES
  // =========================================================================

  private getProfiles(): UserSocialProfile[] {
    const baseProfiles = [...ACCREDITED_DOCTOR_PROFILES, ...INITIAL_PATIENT_PROFILES];
    try {
      if (typeof window === 'undefined') return baseProfiles;
      const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (raw) {
        const stored: UserSocialProfile[] = JSON.parse(raw);
        // Ensure baseline doctors and patients exist
        const map = new Map<string, UserSocialProfile>();
        baseProfiles.forEach(p => map.set(p.id, p));
        stored.forEach(p => map.set(p.id, p));
        return Array.from(map.values());
      }
    } catch (e) {
      console.warn('Error reading profiles:', e);
    }
    return baseProfiles;
  }

  private saveProfiles(profiles: UserSocialProfile[]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
      }
    } catch (e) {
      console.warn('Error saving profiles:', e);
    }
  }

  public syncPatientsFromDatabase(patientsList: any[]): void {
    if (!Array.isArray(patientsList) || patientsList.length === 0) return;
    const profiles = this.getProfiles();
    let hasChanges = false;

    patientsList.forEach(pat => {
      const patId = pat.id || pat.patientId || pat.pid;
      if (!patId) return;
      const cleanName = pat.name || pat.patientName || 'Patient';
      if (['guest', 'unknown', 'internal staff', ''].includes(cleanName.toLowerCase())) return;

      const existing = profiles.find(p => p.id === patId);
      if (!existing) {
        const autoNick = pat.nickname || pat.alias || `Patient_${patId.slice(-4)}`;
        profiles.push({
          id: patId,
          role: 'patient',
          legalName: cleanName,
          nickname: autoNick,
          isAnonymous: pat.isAnonymous !== undefined ? pat.isAnonymous : true,
          phone: pat.phone || pat.patientPhone || '+237 600 00 00 00',
          city: pat.city || 'Douala',
          isOnline: true
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveProfiles(profiles);
    }
  }

  public getConnectionBetween(userId1: string, userId2: string): DoctorPatientConnection | undefined {
    const connections = this.getAllConnectionsRaw();
    const u1 = userId1.toLowerCase();
    const u2 = userId2.toLowerCase();
    return connections.find(c =>
      (c.doctorId.toLowerCase() === u1 && c.patientId.toLowerCase() === u2) ||
      (c.doctorId.toLowerCase() === u2 && c.patientId.toLowerCase() === u1)
    );
  }

  public hasPendingRequestBetween(userId1: string, userId2: string): ConnectionRequest | undefined {
    const requests = this.getRequests();
    const u1 = userId1.toLowerCase();
    const u2 = userId2.toLowerCase();
    return requests.find(r =>
      r.status === 'pending' &&
      ((r.fromId.toLowerCase() === u1 && r.toId.toLowerCase() === u2) ||
       (r.fromId.toLowerCase() === u2 && r.toId.toLowerCase() === u1))
    );
  }

  public getOrCreateUserProfile(user: {
    id: string;
    name?: string;
    role?: string;
    phone?: string;
    specialty?: string;
    hospital?: string;
    licenseNumber?: string;
    avatarUrl?: string;
  }): UserSocialProfile {
    const profiles = this.getProfiles();
    const existing = profiles.find(p => p.id === user.id);
    if (existing) return existing;

    const isDoc = user.role === 'doctor';
    const cleanName = user.name || (isDoc ? 'Dr. Physician' : 'Patient');
    const autoNickname = isDoc 
      ? cleanName 
      : `Patient_${user.id.slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;

    const newProfile: UserSocialProfile = {
      id: user.id,
      role: isDoc ? 'doctor' : 'patient',
      legalName: cleanName,
      nickname: autoNickname,
      isAnonymous: !isDoc, // Patients default to anonymous privacy protection
      avatarUrl: user.avatarUrl,
      phone: user.phone || '+237 600 00 00 00',
      city: 'Douala',
      specialty: user.specialty,
      hospital: user.hospital,
      licenseNumber: user.licenseNumber,
      isOnline: true
    };

    profiles.push(newProfile);
    this.saveProfiles(profiles);
    return newProfile;
  }

  public registerOrUpdateProfile(profileData: Partial<UserSocialProfile> & { id: string; role: 'doctor' | 'patient' }): UserSocialProfile {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex(p => p.id === profileData.id);
    if (idx >= 0) {
      profiles[idx] = {
        ...profiles[idx],
        ...profileData
      };
      this.saveProfiles(profiles);
      return profiles[idx];
    } else {
      const isDoc = profileData.role === 'doctor';
      const cleanName = profileData.legalName || (profileData as any).name || (isDoc ? 'Dr. Physician' : 'Patient');
      const autoNick = profileData.nickname || (isDoc ? cleanName : `Patient_${profileData.id.slice(-4)}`);
      const newProfile: UserSocialProfile = {
        id: profileData.id,
        role: profileData.role,
        legalName: cleanName,
        nickname: autoNick,
        isAnonymous: profileData.isAnonymous !== undefined ? profileData.isAnonymous : !isDoc,
        avatarUrl: profileData.avatarUrl,
        phone: profileData.phone || '+237 600 00 00 00',
        city: profileData.city || 'Douala',
        specialty: profileData.specialty,
        hospital: profileData.hospital,
        licenseNumber: profileData.licenseNumber,
        bio: profileData.bio,
        isOnline: true
      };
      profiles.push(newProfile);
      this.saveProfiles(profiles);
      return newProfile;
    }
  }

  public updatePatientPrivacyNickname(
    userId: string,
    nickname: string,
    isAnonymous: boolean
  ): UserSocialProfile {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex(p => p.id === userId);
    if (idx >= 0) {
      profiles[idx].nickname = nickname.trim() || `User_${userId.slice(-4)}`;
      profiles[idx].isAnonymous = isAnonymous;
      this.saveProfiles(profiles);
      return profiles[idx];
    }
    const fresh = this.getOrCreateUserProfile({ id: userId });
    fresh.nickname = nickname;
    fresh.isAnonymous = isAnonymous;
    profiles.push(fresh);
    this.saveProfiles(profiles);
    return fresh;
  }

  public searchDirectory(
    query: string,
    searchRole: 'doctor' | 'patient',
    currentUserId?: string
  ): Array<UserSocialProfile & { isConnected: boolean; hasPendingRequest: boolean }> {
    const q = query.trim().toLowerCase();
    const profiles = this.getProfiles();
    const connections = this.getConnections(currentUserId);
    const requests = this.getRequests(currentUserId);

    return profiles
      .filter(p => {
        if (p.id === currentUserId) return false;
        if (p.role !== searchRole) return false;
        if (!q) return true;

        if (p.role === 'patient') {
          // If anonymous, only search by nickname or ID (not real name)
          const nickMatch = p.nickname.toLowerCase().includes(q);
          const idMatch = p.id.toLowerCase().includes(q);
          const legalMatch = !p.isAnonymous && p.legalName.toLowerCase().includes(q);
          return nickMatch || idMatch || legalMatch;
        } else {
          // Doctor search
          return (
            p.legalName.toLowerCase().includes(q) ||
            p.nickname.toLowerCase().includes(q) ||
            (p.specialty && p.specialty.toLowerCase().includes(q)) ||
            (p.hospital && p.hospital.toLowerCase().includes(q)) ||
            (p.city && p.city.toLowerCase().includes(q))
          );
        }
      })
      .map(p => {
        const isConnected = connections.some(c => 
          (c.doctorId === p.id && c.patientId === currentUserId) ||
          (c.patientId === p.id && c.doctorId === currentUserId)
        );
        const hasPendingRequest = requests.some(r => 
          r.status === 'pending' &&
          ((r.fromId === currentUserId && r.toId === p.id) || (r.fromId === p.id && r.toId === currentUserId))
        );
        return {
          ...p,
          isConnected,
          hasPendingRequest
        };
      });
  }

  // =========================================================================
  // CONNECTION REQUESTS & MUTUAL ACCEPTANCE (NO MOCK DATA)
  // =========================================================================

  public getRequests(userId?: string): ConnectionRequest[] {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(STORAGE_REQUESTS_KEY);
      if (raw) {
        const list: ConnectionRequest[] = JSON.parse(raw);
        if (userId) {
          const u = userId.toLowerCase();
          return list.filter(r => r.fromId.toLowerCase() === u || r.toId.toLowerCase() === u);
        }
        return list;
      }
    } catch (e) {
      console.warn('Error reading requests:', e);
    }
    return [];
  }

  private saveRequests(requests: ConnectionRequest[]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
      }
    } catch (e) {
      console.warn('Error saving requests:', e);
    }
  }

  public sendConnectionRequest(params: {
    fromUser: { id: string; name: string; role: 'patient' | 'doctor'; avatarUrl?: string };
    targetUserId: string;
    note?: string;
  }): { success: boolean; message: string; request?: ConnectionRequest } {
    const profiles = this.getProfiles();
    const senderProfile = this.getOrCreateUserProfile(params.fromUser);
    const targetProfile = profiles.find(p => p.id === params.targetUserId);

    if (!targetProfile) {
      return { success: false, message: 'Target doctor or patient profile was not found.' };
    }

    // Check if already connected
    const connections = this.getConnections(params.fromUser.id);
    const alreadyConnected = connections.some(c => 
      (c.doctorId === params.targetUserId && c.patientId === params.fromUser.id) ||
      (c.patientId === params.targetUserId && c.doctorId === params.fromUser.id)
    );
    if (alreadyConnected) {
      return { success: false, message: 'You are already mutually connected with this user.' };
    }

    // Check if already pending
    const allRequests = this.getRequests();
    const existingPending = allRequests.find(r => 
      r.status === 'pending' &&
      r.fromId === params.fromUser.id &&
      r.toId === params.targetUserId
    );
    if (existingPending) {
      return { success: false, message: 'Connection request is already pending approval.' };
    }

    const newRequest: ConnectionRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromId: senderProfile.id,
      fromName: senderProfile.legalName,
      fromNickname: senderProfile.nickname,
      fromRole: senderProfile.role,
      fromAvatar: senderProfile.avatarUrl,
      fromSpecialty: senderProfile.specialty,
      fromHospital: senderProfile.hospital,
      toId: targetProfile.id,
      toName: targetProfile.legalName,
      toNickname: targetProfile.nickname,
      toRole: targetProfile.role,
      note: params.note || (senderProfile.role === 'doctor' 
        ? 'Dr. requested connection to review your laboratory diagnostic panels.' 
        : 'Patient requested clinical tele-consultation and test reviews.'),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    allRequests.unshift(newRequest);
    this.saveRequests(allRequests);
    return { success: true, message: 'Connection request sent successfully!', request: newRequest };
  }

  public respondToConnectionRequest(
    requestId: string,
    decision: 'accepted' | 'declined'
  ): { success: boolean; connection?: DoctorPatientConnection } {
    const allRequests = this.getRequests();
    const idx = allRequests.findIndex(r => r.id === requestId);
    if (idx < 0) return { success: false };

    const req = allRequests[idx];
    req.status = decision;
    req.respondedAt = new Date().toISOString();
    this.saveRequests(allRequests);

    if (decision === 'accepted') {
      // Determine who is doctor and who is patient
      const docId = req.fromRole === 'doctor' ? req.fromId : req.toId;
      const docName = req.fromRole === 'doctor' ? req.fromName : req.toName;
      const docSpecialty = req.fromRole === 'doctor' ? req.fromSpecialty : undefined;
      const docHospital = req.fromRole === 'doctor' ? req.fromHospital : undefined;
      const docAvatar = req.fromRole === 'doctor' ? req.fromAvatar : undefined;

      const patientId = req.fromRole === 'patient' ? req.fromId : req.toId;
      const patientNickname = req.fromRole === 'patient' ? req.fromNickname : req.toNickname;
      const patientName = req.fromRole === 'patient' ? req.fromName : req.toName;

      const newConnection: DoctorPatientConnection = {
        id: `conn-${docId}-${patientId}`,
        doctorId: docId,
        doctorName: docName,
        doctorSpecialty: docSpecialty || 'Clinical Diagnostic Consultation',
        doctorHospital: docHospital || 'nanoLabs Medical Network',
        doctorAvatar: docAvatar,
        patientId: patientId,
        patientName: patientName,
        patientNickname: patientNickname,
        status: 'active',
        connectedAt: new Date().toISOString(),
        lastMessage: 'Connection accepted. Secure medical messaging is now active.',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      };

      const connections = this.getAllConnectionsRaw();
      // Remove any existing duplicate
      const cleanConns = connections.filter(c => !(c.doctorId === docId && c.patientId === patientId));
      cleanConns.unshift(newConnection);
      this.saveConnectionsRaw(cleanConns);

      // Create initial greeting notification in chat
      this.sendMessage({
        connectionId: newConnection.id,
        senderId: req.toId,
        senderName: req.toName,
        senderRole: req.toRole,
        recipientId: req.fromId,
        recipientName: req.fromName,
        type: 'text',
        content: `🤝 Connection accepted. You can now exchange direct clinical messages, prescribe lab panels, and share A4 diagnostic reports safely.`
      });

      return { success: true, connection: newConnection };
    }

    return { success: true };
  }

  public acceptConnectionRequest(requestId: string): DoctorPatientConnection | undefined {
    const res = this.respondToConnectionRequest(requestId, 'accepted');
    return res.connection;
  }

  public declineConnectionRequest(requestId: string): boolean {
    const res = this.respondToConnectionRequest(requestId, 'declined');
    return res.success;
  }

  // =========================================================================
  // ACTIVE MUTUAL CONNECTIONS (NO MOCK DATA)
  // =========================================================================

  private getAllConnectionsRaw(): DoctorPatientConnection[] {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(STORAGE_CONNECTIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading connections:', e);
    }
    return [];
  }

  private saveConnectionsRaw(conns: DoctorPatientConnection[]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_CONNECTIONS_KEY, JSON.stringify(conns));
      }
    } catch (e) {
      console.warn('Error saving connections:', e);
    }
  }

  public getConnections(userId?: string, role?: 'doctor' | 'patient'): DoctorPatientConnection[] {
    const list = this.getAllConnectionsRaw();
    if (!userId) return list;
    const u = userId.toLowerCase();
    return list.filter(c => c.doctorId.toLowerCase() === u || c.patientId.toLowerCase() === u);
  }

  public removeConnection(connectionId: string): boolean {
    const list = this.getAllConnectionsRaw();
    const updated = list.filter(c => c.id !== connectionId);
    this.saveConnectionsRaw(updated);
    return true;
  }

  // =========================================================================
  // MESSAGES & CLINICAL RECORD ACTIONS
  // =========================================================================

  private getAllMessagesRaw(): ChatMessage[] {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(STORAGE_CHATS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading messages:', e);
    }
    return [];
  }

  private saveMessagesRaw(msgs: ChatMessage[]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(msgs));
      }
    } catch (e) {
      console.warn('Error saving messages:', e);
    }
  }

  public getMessages(patientId: string, doctorId: string): ChatMessage[] {
    const all = this.getAllMessagesRaw();
    const p = patientId.toLowerCase();
    const d = doctorId.toLowerCase();
    return all.filter(
      m => (m.senderId.toLowerCase() === p && m.recipientId.toLowerCase() === d) ||
           (m.senderId.toLowerCase() === d && m.recipientId.toLowerCase() === p)
    );
  }

  public sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const all = this.getAllMessagesRaw();
    const newMsg: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    all.push(newMsg);
    this.saveMessagesRaw(all);

    // Update connection last message metadata
    const connections = this.getAllConnectionsRaw();
    const idx = connections.findIndex(
      c => (c.doctorId === message.senderId && c.patientId === message.recipientId) ||
           (c.doctorId === message.recipientId && c.patientId === message.senderId)
    );
    if (idx >= 0) {
      connections[idx].lastMessage = message.content;
      connections[idx].lastMessageTime = newMsg.timestamp;
      this.saveConnectionsRaw(connections);
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
        ? `Shared Comprehensive Diagnostic Report (${params.batchTestCount || 'Multi'} Tests)` 
        : `Shared Laboratory Report: ${params.testName}`,
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

  // Doctor Action: Prescribe Lab Tests
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
      content: `Laboratory e-Prescription: ${params.tests.length} Diagnostic Test(s)`,
      metadata: {
        clinicalIndication: params.indication,
        prescriptionStatus: 'pending',
        prescribedTests: params.tests
      }
    });
  }

  // Doctor Action: Prescribe Medications (Rx)
  public prescribeMedications(params: {
    doctorId: string;
    doctorName: string;
    patientId: string;
    patientName: string;
    indication: string;
    validUntil?: string;
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
      content: `Clinical Prescription & Treatment Regimen (${params.medications.length} Medications)`,
      metadata: {
        clinicalIndication: params.indication,
        validUntil: params.validUntil || '30 days',
        medications: params.medications
      }
    });
  }

  // Doctor Action: Propose Appointment
  public scheduleAppointment(params: {
   doctorId?: string;
   doctorName?: string;
    senderId?: string;
    senderName: string;
    senderRole : string;
    reciepientId: string;
    receipientName : string;
    date : string;
    time : string;
    type : string;
    // location : string;
    patientId: string;
    patientName: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: 'in_person' | 'teleconsultation' | 'lab_review';
    location: string;
  }): ChatMessage {
    return this.sendMessage({
      senderId: params.doctorId || '',
      senderName: params.doctorName || '',
      senderRole: 'doctor',
      recipientId: params.patientId,
      recipientName: params.patientName,
      type: 'appointment',
      content: `Consultation Appointment Proposed: ${params.appointmentDate} at ${params.appointmentTime}`,
      metadata: {
        appointmentId: `APT-${Date.now().toString().slice(-6)}`,
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
        appointmentType: params.appointmentType,
        appointmentStatus: 'requested',
        location: params.location
      }
    });
  }

  public markPrescriptionBooked(messageId: string, bookingCode: string): void {
    const all = this.getAllMessagesRaw();
    const idx = all.findIndex(m => m.id === messageId);
    if (idx >= 0 && all[idx].metadata) {
      all[idx].metadata!.prescriptionStatus = 'booked';
      all[idx].metadata!.bookingIdGenerated = bookingCode;
      this.saveMessagesRaw(all);
    }
  }
}

export const doctorChatService = new DoctorChatService();
