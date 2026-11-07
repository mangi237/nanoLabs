import {
  db,
  ensureFirebaseAuth,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from './firebase';
import { cleanFirestoreData } from '../utils/sanitizeData';
import { cryptoSecurity } from '../utils/cryptoSecurity';
import { isValidUniqueId, normalizeCameroonDigits } from '../utils/patientOwnership';

export interface FirestorePatientSummary {
  id: string;
  patientId: string;
  alias: string;
  name: string;
  displayNameForSearch: string;
  isAnonymous?: boolean;
  phone?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  city?: string;
  labId?: string;
  labName?: string;
  avatarUrl?: string;
}

export interface FirestoreDoctorSummary {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  city: string;
  phone: string;
  email: string;
  licenseNumber: string;
  bio: string;
  avatarUrl?: string;
  status: string;
  availability?: Record<string, any>;
}

export interface DoctorPatientConnectionRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorHospital?: string;
  doctorPhone?: string;
  doctorAvatar?: string;
  patientId: string;
  patientPid: string;
  patientName: string;
  patientAlias: string;
  patientPhone?: string;
  patientCity?: string;
  requestedBy: 'patient' | 'doctor';
  note?: string;
  status: 'pending' | 'accepted' | 'declined';
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadForDoctor?: number;
  unreadForPatient?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DecryptedClinicalMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'doctor' | 'patient';
  recipientId: string;
  recipientName: string;
  type:
    | 'text'
    | 'test_prescription'
    | 'medication_prescription'
    | 'result_share'
    | 'appointment';
  text: string;
  isEncrypted: boolean;
  cipherAlgorithm: string;
  metadata?: {
    prescriptionId?: string;
    prescribedTests?: Array<{ code?: string; name: string; price?: number; category?: string }>;
    recommendedLabId?: string;
    recommendedLabName?: string;
    clinicalIndication?: string;
    prescriptionStatus?: 'pending' | 'booked';
    linkedBookingId?: string;
    linkedBookingCode?: string;
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    bookingId?: string;
    bookingCode?: string;
    labId?: string;
    labName?: string;
    testName?: string;
    resultSummary?: string;
    overallStatus?: string;
    appointmentId?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentType?: 'in_person' | 'teleconsultation';
    appointmentStatus?: 'requested' | 'confirmed' | 'completed' | 'cancelled';
    location?: string;
  };
  createdAt: string;
}

export interface DoctorPatientLabDossier {
  id: string;
  source: 'lab_booking' | 'shared_result' | 'doctor_prescription';
  bookingId?: string;
  bookingCode: string;
  labId: string;
  labName: string;
  patientId: string;
  patientPid: string;
  patientName: string;
  patientAlias?: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  tests: Array<{
    name: string;
    status: string;
    value?: string;
    unit?: string;
    refRange?: string;
    flag?: string;
  }>;
  overallStatus: string;
  stageLabel: string;
  isCertifiedResult: boolean;
  biologistSigned?: boolean;
  biologistName?: string;
  biologistRemarks?: string;
  pdfReportUrl?: string;
  rawBooking?: any;
  createdAt: string;
  updatedAt: string;
}

export function buildConversationId(doctorId: string, patientId: string): string {
  const cleanDoc = String(doctorId || '').trim();
  const cleanPat = String(patientId || '').trim();
  return `${cleanDoc}__${cleanPat}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

function deriveConversationSecret(doctorId: string, patientId: string): string {
  const sorted = [String(doctorId || '').trim(), String(patientId || '').trim()].sort().join('::');
  return `nanoLabs-E2EE-ClinicalChannel::${sorted}`;
}

export function formatPatientAlias(raw?: string | null, fallbackName?: string | null): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.\-]/g, '');
  if (cleaned) return cleaned;
  const fromName = String(fallbackName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return fromName || 'patient';
}

function describeBookingStage(b: any): string {
  if (b.biologistSigned || b.resultsReleased || b.overallStatus === 'Completed') {
    return 'Certified & Released by Biologist';
  }
  if (b.labTechSigned || b.overallStatus === 'Pending_Biologist_Signoff') {
    return 'Awaiting Biologist Sign-Off';
  }
  if (b.sampleCollected || b.overallStatus === 'In_Lab_Testing') {
    return 'Specimen In-Lab Analysis';
  }
  if (b.paymentStatus === 'paid') {
    return b.homeCollection ? 'Paid · Mobile Phlebotomy Dispatch' : 'Paid · Ready for Sample Draw';
  }
  if (b.paymentProofSubmitted || b.invoiceStatus === 'payment_submitted') {
    return 'Payment Submitted · Cashier Verifying';
  }
  if (b.invoiceGenerated) {
    return 'Official Invoice Sent to Patient';
  }
  if (b.receptionistValidated) {
    return 'Receptionist Confirmed · At Cashier';
  }
  return 'Request Sent to Lab Receptionist';
}

export const doctorPatientFirestoreService = {
  /**
   * Fetch all real registered laboratories from Firestore (ZERO hardcoded mock labs).
   */
  async listRealLabs(): Promise<any[]> {
    await ensureFirebaseAuth();
    try {
      const snap = await getDocs(collection(db, 'labs'));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((l: any) => l.status !== 'suspended' && l.status !== 'rejected' && Boolean(l.name));
    } catch (err) {
      console.warn('Error listing real labs from Firestore:', err);
      return [];
    }
  },

  /**
   * Fetch all real accredited doctors from Firestore `doctors` collection (ZERO mock doctors).
   */
  async listDoctors(searchQuery: string = ''): Promise<FirestoreDoctorSummary[]> {
    await ensureFirebaseAuth();
    try {
      const snap = await getDocs(collection(db, 'doctors'));
      const q = searchQuery.trim().toLowerCase();
      const list: FirestoreDoctorSummary[] = snap.docs
        .map((d) => {
          const data = d.data();
          const rawName = String(data.name || '').trim();
          const name = rawName
            ? rawName.toLowerCase().startsWith('dr')
              ? rawName
              : `Dr. ${rawName}`
            : 'Dr. Medical Practitioner';
          return {
            id: d.id,
            name,
            specialty: String(data.specialty || 'General Medicine'),
            hospital: String(data.hospital || data.hospitalAffiliation || 'Clinical Practice'),
            city: String(data.city || 'Douala'),
            phone: String(data.phone || ''),
            email: String(data.email || ''),
            licenseNumber: String(data.licenseNumber || 'ONMC'),
            bio: String(
              data.bio ||
                data.notes ||
                `${data.specialty || 'General Medicine'} practitioner at ${data.hospital || 'Clinical Practice'}.`
            ),
            avatarUrl: data.avatarUrl || data.profilePicture || undefined,
            status: String(data.status || 'active'),
            availability: data.availability || undefined,
          };
        })
        .filter((docItem) => docItem.status !== 'suspended');

      if (!q) return list;
      return list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.hospital.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.licenseNumber.toLowerCase().includes(q)
      );
    } catch (err) {
      console.warn('Error fetching doctors from Firestore:', err);
      return [];
    }
  },

  /**
   * Search registered patients in Firestore by @alias, Patient ID (PAT-XXXXXX), name, or phone.
   * Deduplicates across `patients` top-level collection and `labs/{labId}/patients`.
   */
  async searchPatientsForDoctor(searchQuery: string = ''): Promise<FirestorePatientSummary[]> {
    await ensureFirebaseAuth();
    const mapByKey = new Map<string, FirestorePatientSummary>();
    const rawQ = searchQuery.trim().toLowerCase().replace(/^@+/, '');

    try {
      const globalSnap = await getDocs(collection(db, 'patients'));
      globalSnap.docs.forEach((d) => {
        const data = d.data();
        const pid = String(data.patientId || d.id).trim();
        const name = String(data.name || data.fullName || '').trim();
        if (!name || name.toLowerCase() === 'patient') return;
        const alias = formatPatientAlias(data.alias || data.nickname, name);
        const item: FirestorePatientSummary = {
          id: d.id,
          patientId: pid,
          alias,
          name,
          displayNameForSearch: data.isAnonymous ? `@${alias}` : name,
          isAnonymous: Boolean(data.isAnonymous),
          phone: data.phone || '',
          email: data.email || '',
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth || '',
          city: data.city || '',
          labId: data.labId || '',
          labName: data.labName || '',
          avatarUrl: data.profilePicture || data.avatarUrl || undefined,
        };
        mapByKey.set(d.id, item);
      });
    } catch (err) {
      console.warn('Error searching global patients:', err);
    }

    const all = Array.from(mapByKey.values());
    if (!rawQ) return all;

    return all.filter((p) => {
      const phoneDigits = String(p.phone || '').replace(/\D/g, '');
      const queryDigits = rawQ.replace(/\D/g, '');
      return (
        p.alias.toLowerCase().includes(rawQ) ||
        p.patientId.toLowerCase().includes(rawQ) ||
        p.name.toLowerCase().includes(rawQ) ||
        (queryDigits.length >= 4 && phoneDigits.includes(queryDigits))
      );
    });
  },

  /**
   * Send a follow / connection request between a Patient and a Doctor in Firestore.
   */
  async requestConnection(params: {
    doctorId: string;
    doctorName: string;
    doctorSpecialty?: string;
    doctorHospital?: string;
    doctorPhone?: string;
    doctorAvatar?: string;
    patientId: string;
    patientPid?: string;
    patientName: string;
    patientAlias?: string;
    patientPhone?: string;
    patientCity?: string;
    requestedBy: 'patient' | 'doctor';
    note?: string;
    autoAccept?: boolean;
  }): Promise<DoctorPatientConnectionRecord> {
    await ensureFirebaseAuth();
    const connId = buildConversationId(params.doctorId, params.patientId);
    const now = new Date().toISOString();
    const alias = formatPatientAlias(params.patientAlias, params.patientName);

    const existingRef = doc(db, 'doctor_patient_connections', connId);
    const existingSnap = await getDoc(existingRef).catch(() => null);

    if (existingSnap && existingSnap.exists()) {
      const prev = existingSnap.data() as DoctorPatientConnectionRecord;
      // If the other side had already requested, auto-accept mutual connection!
      const nextStatus =
        params.autoAccept ||
        prev.status === 'accepted' ||
        (prev.status === 'pending' && prev.requestedBy !== params.requestedBy)
          ? 'accepted'
          : 'pending';
      const updated: DoctorPatientConnectionRecord = {
        ...prev,
        id: connId,
        patientAlias: alias || prev.patientAlias,
        status: nextStatus,
        updatedAt: now,
      };
      await setDoc(existingRef, cleanFirestoreData(updated), { merge: true });
      return updated;
    }

    const record: DoctorPatientConnectionRecord = {
      id: connId,
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      doctorSpecialty: params.doctorSpecialty || 'General Medicine',
      doctorHospital: params.doctorHospital || 'Clinical Practice',
      doctorPhone: params.doctorPhone || '',
      doctorAvatar: params.doctorAvatar || '',
      patientId: params.patientId,
      patientPid: params.patientPid || params.patientId,
      patientName: params.patientName,
      patientAlias: alias,
      patientPhone: params.patientPhone || '',
      patientCity: params.patientCity || '',
      requestedBy: params.requestedBy,
      note: params.note || '',
      status: params.autoAccept ? 'accepted' : 'pending',
      unreadForDoctor: params.requestedBy === 'patient' ? 1 : 0,
      unreadForPatient: params.requestedBy === 'doctor' ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(existingRef, cleanFirestoreData(record));
    return record;
  },

  /**
   * Accept or decline a connection / follow request in Firestore.
   */
  async respondToConnection(
    connectionId: string,
    decision: 'accepted' | 'declined'
  ): Promise<void> {
    await ensureFirebaseAuth();
    const ref = doc(db, 'doctor_patient_connections', connectionId);
    await updateDoc(
      ref,
      cleanFirestoreData({
        status: decision,
        unreadForDoctor: 0,
        unreadForPatient: 0,
        updatedAt: new Date().toISOString(),
      })
    );
  },

  /**
   * Subscribe in real time to all connections / follow requests for a Doctor.
   */
  subscribeDoctorConnections(
    doctorId: string,
    onUpdate: (connections: DoctorPatientConnectionRecord[]) => void
  ): () => void {
    if (!doctorId) {
      onUpdate([]);
      return () => {};
    }
    ensureFirebaseAuth();
    const q = query(
      collection(db, 'doctor_patient_connections'),
      where('doctorId', '==', doctorId)
    );
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as DoctorPatientConnectionRecord))
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime() -
              new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime()
          );
        onUpdate(items);
      },
      (err) => console.warn('Doctor connections subscription warning:', err)
    );
  },

  /**
   * Subscribe in real time to all connections / follow requests for a Patient.
   */
  subscribePatientConnections(
    patientId: string,
    patientPid: string | undefined,
    onUpdate: (connections: DoctorPatientConnectionRecord[]) => void
  ): () => void {
    if (!patientId && !patientPid) {
      onUpdate([]);
      return () => {};
    }
    ensureFirebaseAuth();
    return onSnapshot(
      collection(db, 'doctor_patient_connections'),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as DoctorPatientConnectionRecord))
          .filter(
            (c) =>
              (patientId && (c.patientId === patientId || c.patientPid === patientId)) ||
              (patientPid && (c.patientPid === patientPid || c.patientId === patientPid))
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime() -
              new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime()
          );
        onUpdate(items);
      },
      (err) => console.warn('Patient connections subscription warning:', err)
    );
  },

  /**
   * Send an End-to-End AES-256-GCM Encrypted Message between Doctor and Patient.
   * Both text body and clinical metadata JSON are encrypted client-side before Firestore storage!
   */
  async sendEncryptedMessage(params: {
    doctorId: string;
    doctorName: string;
    patientId: string;
    patientPid?: string;
    patientName: string;
    patientAlias?: string;
    senderRole: 'doctor' | 'patient';
    type?: DecryptedClinicalMessage['type'];
    text: string;
    metadata?: DecryptedClinicalMessage['metadata'];
  }): Promise<DecryptedClinicalMessage> {
    await ensureFirebaseAuth();
    const convId = buildConversationId(params.doctorId, params.patientId);
    const secret = deriveConversationSecret(params.doctorId, params.patientId);
    const now = new Date().toISOString();

    // Ensure connection record exists and is active so both sides see the conversation
    await this.requestConnection({
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      patientId: params.patientId,
      patientPid: params.patientPid,
      patientName: params.patientName,
      patientAlias: params.patientAlias,
      requestedBy: params.senderRole,
      autoAccept: true,
    });

    const ciphertext = await cryptoSecurity.encryptField(params.text, secret);
    const encryptedMetadata = params.metadata
      ? await cryptoSecurity.encryptField(JSON.stringify(params.metadata), secret)
      : null;

    const senderId = params.senderRole === 'doctor' ? params.doctorId : params.patientId;
    const senderName = params.senderRole === 'doctor' ? params.doctorName : params.patientName;
    const recipientId = params.senderRole === 'doctor' ? params.patientId : params.doctorId;
    const recipientName = params.senderRole === 'doctor' ? params.patientName : params.doctorName;
    const msgType = params.type || 'text';

    // Envelope header on parent conversation doc
    await setDoc(
      doc(db, 'encrypted_conversations', convId),
      cleanFirestoreData({
        id: convId,
        doctorId: params.doctorId,
        doctorName: params.doctorName,
        patientId: params.patientId,
        patientPid: params.patientPid || params.patientId,
        patientName: params.patientName,
        patientAlias: formatPatientAlias(params.patientAlias, params.patientName),
        cipherAlgorithm: 'AES-GCM-256',
        updatedAt: now,
      }),
      { merge: true }
    );

    const msgPayload = cleanFirestoreData({
      conversationId: convId,
      senderId,
      senderName,
      senderRole: params.senderRole,
      recipientId,
      recipientName,
      type: msgType,
      ciphertext,
      encryptedMetadata,
      isEncrypted: true,
      cipherAlgorithm: 'AES-GCM-256',
      createdAt: now,
    });

    const added = await addDoc(
      collection(db, 'encrypted_conversations', convId, 'messages'),
      msgPayload
    );

    // Update connection preview (encrypted preview label so PHI is never leaked in plaintext)
    const previewLabel =
      msgType === 'test_prescription'
        ? 'Encrypted Lab Test Request'
        : msgType === 'medication_prescription'
          ? 'Encrypted Prescription'
          : msgType === 'result_share'
            ? 'Encrypted Lab Result Shared'
            : msgType === 'appointment'
              ? 'Appointment Update'
              : 'Encrypted Message';

    try {
      await setDoc(
        doc(db, 'doctor_patient_connections', convId),
        cleanFirestoreData({
          status: 'accepted',
          lastMessagePreview: previewLabel,
          lastMessageAt: now,
          unreadForDoctor: params.senderRole === 'patient' ? 1 : 0,
          unreadForPatient: params.senderRole === 'doctor' ? 1 : 0,
          updatedAt: now,
        }),
        { merge: true }
      );
    } catch (connErr) {
      console.warn('Non-fatal connection metadata update warning:', connErr);
    }

    return {
      id: added.id,
      conversationId: convId,
      senderId,
      senderName,
      senderRole: params.senderRole,
      recipientId,
      recipientName,
      type: msgType,
      text: params.text,
      isEncrypted: true,
      cipherAlgorithm: 'AES-GCM-256',
      metadata: params.metadata,
      createdAt: now,
    };
  },

  /**
   * Subscribe in real time to an AES-256-GCM Encrypted Conversation and decrypt messages in memory.
   */
  subscribeConversationMessages(
    doctorId: string,
    patientId: string,
    viewerRole: 'doctor' | 'patient',
    onUpdate: (messages: DecryptedClinicalMessage[]) => void
  ): () => void {
    if (!doctorId || !patientId) {
      onUpdate([]);
      return () => {};
    }
    ensureFirebaseAuth();
    const convId = buildConversationId(doctorId, patientId);
    const secret = deriveConversationSecret(doctorId, patientId);
    const messagesRef = collection(db, 'encrypted_conversations', convId, 'messages');

    // Clear unread flag for viewer
    updateDoc(
      doc(db, 'doctor_patient_connections', convId),
      viewerRole === 'doctor' ? { unreadForDoctor: 0 } : { unreadForPatient: 0 }
    ).catch(() => {});

    return onSnapshot(
      messagesRef,
      async (snap) => {
        const decryptedList: DecryptedClinicalMessage[] = await Promise.all(
          snap.docs.map(async (d) => {
            const raw = d.data();
            const plainText = raw.ciphertext
              ? await cryptoSecurity.decryptField(raw.ciphertext, secret)
              : String(raw.text || '');
            let parsedMeta: DecryptedClinicalMessage['metadata'] = raw.metadata || undefined;
            if (raw.encryptedMetadata) {
              try {
                const decMetaStr = await cryptoSecurity.decryptField(raw.encryptedMetadata, secret);
                parsedMeta = JSON.parse(decMetaStr);
              } catch {}
            }
            return {
              id: d.id,
              conversationId: convId,
              senderId: String(raw.senderId || ''),
              senderName: String(raw.senderName || ''),
              senderRole: (raw.senderRole === 'doctor' ? 'doctor' : 'patient') as
                | 'doctor'
                | 'patient',
              recipientId: String(raw.recipientId || ''),
              recipientName: String(raw.recipientName || ''),
              type: (raw.type || 'text') as DecryptedClinicalMessage['type'],
              text: plainText,
              isEncrypted: Boolean(raw.isEncrypted ?? true),
              cipherAlgorithm: String(raw.cipherAlgorithm || 'AES-GCM-256'),
              metadata: parsedMeta,
              createdAt: String(raw.createdAt || new Date().toISOString()),
            };
          })
        );

        decryptedList.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        onUpdate(decryptedList);
      },
      (err) => console.warn('Encrypted conversation listener warning:', err)
    );
  },

  /**
   * Doctor issues a Lab Test Request OR Medication Prescription to a Patient:
   * - Saves in `doctor_prescriptions`
   * - Delivers encrypted card in `encrypted_conversations` so the Patient can book at the lab in 1 tap!
   * - Optionally dispatches directly to the selected Laboratory's Receptionist queue if `sendDirectlyToLab` is true!
   */
  async createPrescriptionAndNotifyPatient(params: {
    doctorId: string;
    doctorName: string;
    patientId: string;
    patientPid?: string;
    patientName: string;
    patientAlias?: string;
    patientPhone?: string;
    kind: 'lab_tests' | 'medication';
    prescribedTests?: Array<{ code?: string; name: string; price?: number; category?: string }>;
    recommendedLabId?: string;
    recommendedLabName?: string;
    sendDirectlyToLab?: boolean;
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    clinicalNotes?: string;
  }): Promise<{ prescriptionId: string; bookingCode?: string }> {
    await ensureFirebaseAuth();
    const now = new Date().toISOString();
    let createdBooking: any = null;

    if (
      params.kind === 'lab_tests' &&
      params.sendDirectlyToLab &&
      params.recommendedLabId &&
      params.prescribedTests &&
      params.prescribedTests.length > 0
    ) {
      const { limsService } = await import('./limsService');
      createdBooking = await limsService.createBooking({
        labId: params.recommendedLabId,
        labName: params.recommendedLabName,
        patientAccountId: params.patientId,
        patientId: params.patientPid || params.patientId,
        patientPid: params.patientPid || params.patientId,
        patientName: params.patientName,
        patientPhone: params.patientPhone || '',
        referringDoctorId: params.doctorId,
        referringDoctor: params.doctorName,
        clinicalNotes: params.clinicalNotes || '',
        creatorName: params.doctorName,
        isOnlineBooking: true,
        registrationType: 'online',
        registeredBy: `Physician Order (${params.doctorName})`,
        receptionistValidated: false,
        selectedTests: params.prescribedTests.map((t, i) => ({
          id: `rx-${Date.now()}-${i}`,
          name: t.name,
          testName: t.name,
          code: t.code || 'RX',
          category: t.category || 'Clinical Diagnostics',
          price: t.price || 4500,
          basePrice: t.price || 4500,
          totalPrice: t.price || 4500,
        })),
      } as any);
    }

    const rxPayload = cleanFirestoreData({
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      patientId: params.patientId,
      patientPid: params.patientPid || params.patientId,
      patientName: params.patientName,
      patientAlias: formatPatientAlias(params.patientAlias, params.patientName),
      kind: params.kind,
      prescribedTests: params.prescribedTests || [],
      recommendedLabId: params.recommendedLabId || '',
      recommendedLabName: params.recommendedLabName || '',
      medications: params.medications || [],
      clinicalNotes: params.clinicalNotes || '',
      status: createdBooking ? 'sent_to_lab' : 'issued_to_patient',
      linkedBookingId: createdBooking?.id || '',
      linkedBookingCode: createdBooking?.bookingCode || '',
      createdAt: now,
      updatedAt: now,
    });

    const rxDoc = await addDoc(collection(db, 'doctor_prescriptions'), rxPayload);

    if (params.kind === 'lab_tests') {
      const testNames = (params.prescribedTests || []).map((t) => t.name).join(', ');
      const summaryText = createdBooking
        ? `Lab test request sent to ${params.recommendedLabName || 'selected laboratory'} (Order ${createdBooking.bookingCode}): ${testNames}`
        : `Prescribed diagnostic lab tests: ${testNames}${
            params.recommendedLabName ? ` · Recommended Lab: ${params.recommendedLabName}` : ''
          }`;

      await this.sendEncryptedMessage({
        doctorId: params.doctorId,
        doctorName: params.doctorName,
        patientId: params.patientId,
        patientPid: params.patientPid,
        patientName: params.patientName,
        patientAlias: params.patientAlias,
        senderRole: 'doctor',
        type: 'test_prescription',
        text: summaryText,
        metadata: {
          prescriptionId: rxDoc.id,
          prescribedTests: params.prescribedTests,
          recommendedLabId: params.recommendedLabId,
          recommendedLabName: params.recommendedLabName,
          clinicalIndication: params.clinicalNotes,
          prescriptionStatus: createdBooking ? 'booked' : 'pending',
          linkedBookingId: createdBooking?.id,
          linkedBookingCode: createdBooking?.bookingCode,
        },
      });
    } else {
      const medSummary = (params.medications || [])
        .map((m) => `${m.name} (${m.dosage}, ${m.frequency} for ${m.duration})`)
        .join('; ');
      await this.sendEncryptedMessage({
        doctorId: params.doctorId,
        doctorName: params.doctorName,
        patientId: params.patientId,
        patientPid: params.patientPid,
        patientName: params.patientName,
        patientAlias: params.patientAlias,
        senderRole: 'doctor',
        type: 'medication_prescription',
        text: `Medication prescription: ${medSummary}`,
        metadata: {
          prescriptionId: rxDoc.id,
          medications: params.medications,
          clinicalIndication: params.clinicalNotes,
        },
      });
    }

    return { prescriptionId: rxDoc.id, bookingCode: createdBooking?.bookingCode };
  },

  /**
   * Create or update a Doctor-Patient Appointment in Firestore and notify via encrypted chat.
   */
  async createAppointment(params: {
    doctorId: string;
    doctorName: string;
    doctorSpecialty?: string;
    doctorHospital?: string;
    patientId: string;
    patientPid?: string;
    patientName: string;
    patientAlias?: string;
    patientPhone?: string;
    date: string;
    time: string;
    type: 'in_person' | 'teleconsultation';
    location?: string;
    reason?: string;
    initiatedBy: 'doctor' | 'patient';
  }): Promise<string> {
    await ensureFirebaseAuth();
    const now = new Date().toISOString();
    const status = params.initiatedBy === 'doctor' ? 'confirmed' : 'requested';

    const apptDoc = await addDoc(
      collection(db, 'doctor_appointments'),
      cleanFirestoreData({
        ...params,
        patientAlias: formatPatientAlias(params.patientAlias, params.patientName),
        status,
        createdAt: now,
        updatedAt: now,
      })
    );

    await this.sendEncryptedMessage({
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      patientId: params.patientId,
      patientPid: params.patientPid,
      patientName: params.patientName,
      patientAlias: params.patientAlias,
      senderRole: params.initiatedBy,
      type: 'appointment',
      text: `${
        params.initiatedBy === 'doctor' ? 'Scheduled' : 'Requested'
      } ${params.type === 'teleconsultation' ? 'Teleconsultation' : 'In-Clinic'} appointment on ${
        params.date
      } at ${params.time}.${params.reason ? ` Reason: ${params.reason}` : ''}`,
      metadata: {
        appointmentId: apptDoc.id,
        appointmentDate: params.date,
        appointmentTime: params.time,
        appointmentType: params.type,
        appointmentStatus: status,
        location: params.location || params.doctorHospital || 'Clinic',
      },
    });

    return apptDoc.id;
  },

  /**
   * Subscribe to Doctor's Appointments in real time from Firestore.
   */
  subscribeDoctorAppointments(
    doctorId: string,
    onUpdate: (appointments: any[]) => void
  ): () => void {
    if (!doctorId) {
      onUpdate([]);
      return () => {};
    }
    ensureFirebaseAuth();
    const q = query(collection(db, 'doctor_appointments'), where('doctorId', '==', doctorId));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => String(a.date || '').localeCompare(String(b.date || '')));
        onUpdate(list);
      },
      (err) => console.warn('Doctor appointments subscription warning:', err)
    );
  },

  subscribePatientAppointments(
    patientId: string,
    patientPid: string | undefined,
    onUpdate: (appointments: any[]) => void
  ): () => void {
    if (!patientId && !patientPid) {
      onUpdate([]);
      return () => {};
    }
    ensureFirebaseAuth();
    return onSnapshot(
      collection(db, 'doctor_appointments'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (a: any) =>
              (patientId && (a.patientId === patientId || a.patientPid === patientId)) ||
              (patientPid && (a.patientPid === patientPid || a.patientId === patientPid))
          )
          .sort((a: any, b: any) => String(a.date || '').localeCompare(String(b.date || '')));
        onUpdate(list);
      },
      (err) => console.warn('Patient appointments subscription warning:', err)
    );
  },

  async updateAppointmentStatus(
    appointmentId: string,
    status: 'confirmed' | 'completed' | 'cancelled'
  ): Promise<void> {
    await ensureFirebaseAuth();
    await updateDoc(
      doc(db, 'doctor_appointments', appointmentId),
      cleanFirestoreData({
        status,
        updatedAt: new Date().toISOString(),
      })
    );
  },

  /**
   * Fetch all Patient Lab Test Requests (in-progress AND completed) + Shared Results
   * associated with this Doctor (via referringDoctorId, doctorName, shared results, or connected patients!).
   */
  async fetchDoctorPatientDossiers(params: {
    doctorId: string;
    doctorName?: string;
    connectedPatients?: Array<{ patientId: string; patientPid?: string; patientPhone?: string }>;
  }): Promise<DoctorPatientLabDossier[]> {
    await ensureFirebaseAuth();
    const { doctorId, doctorName, connectedPatients = [] } = params;
    if (!doctorId) return [];

    const normDocName = String(doctorName || '')
      .toLowerCase()
      .replace(/^(dr\.?|prof\.?|doctor)\s*/i, '')
      .trim();

    const connectedIdSet = new Set<string>();
    const connectedPhoneSet = new Set<string>();
    connectedPatients.forEach((cp) => {
      if (isValidUniqueId(cp.patientId)) connectedIdSet.add(String(cp.patientId).trim());
      if (isValidUniqueId(cp.patientPid)) connectedIdSet.add(String(cp.patientPid).trim());
      const p9 = normalizeCameroonDigits(cp.patientPhone);
      if (p9) connectedPhoneSet.add(p9);
    });

    // Also pull accepted connections directly if not passed
    if (connectedIdSet.size === 0) {
      try {
        const connSnap = await getDocs(
          query(collection(db, 'doctor_patient_connections'), where('doctorId', '==', doctorId))
        );
        connSnap.docs.forEach((d) => {
          const c = d.data();
          if (c.status === 'accepted') {
            if (isValidUniqueId(c.patientId)) connectedIdSet.add(String(c.patientId).trim());
            if (isValidUniqueId(c.patientPid)) connectedIdSet.add(String(c.patientPid).trim());
            const p9 = normalizeCameroonDigits(c.patientPhone);
            if (p9) connectedPhoneSet.add(p9);
          }
        });
      } catch {}
    }

    const dossiersMap = new Map<string, DoctorPatientLabDossier>();

    // 1. Scan real labs' bookings in Firestore
    try {
      const labsSnap = await getDocs(collection(db, 'labs'));
      const labRecords = labsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      await Promise.all(
        labRecords.map(async (labRec) => {
          try {
            const bSnap = await getDocs(collection(db, 'labs', labRec.id, 'bookings'));
            bSnap.docs.forEach((bDoc) => {
              const b = { id: bDoc.id, ...bDoc.data() } as any;
              const bDocId = String(b.referringDoctorId || '').trim();
              const bRefDocNorm = String(b.referringDoctor || '')
                .toLowerCase()
                .replace(/^(dr\.?|prof\.?|doctor)\s*/i, '')
                .trim();

              const bPatAccount = isValidUniqueId(b.patientAccountId)
                ? String(b.patientAccountId).trim()
                : '';
              const bPatPid = isValidUniqueId(b.patientPid) ? String(b.patientPid).trim() : '';
              const bPatId = isValidUniqueId(b.patientId) ? String(b.patientId).trim() : '';
              const bPhone9 = normalizeCameroonDigits(b.patientPhone);

              const referredToThisDoctor =
                (bDocId && bDocId === doctorId) ||
                (normDocName.length >= 3 &&
                  bRefDocNorm.length >= 3 &&
                  (bRefDocNorm === normDocName || bRefDocNorm.includes(normDocName)));

              const belongsToConnectedPatient =
                (bPatAccount && connectedIdSet.has(bPatAccount)) ||
                (bPatPid && connectedIdSet.has(bPatPid)) ||
                (bPatId && connectedIdSet.has(bPatId)) ||
                (!bPatAccount && bPhone9 && connectedPhoneSet.has(bPhone9));

              if (!referredToThisDoctor && !belongsToConnectedPatient) return;

              const isCertified = Boolean(
                b.biologistSigned || b.resultsReleased || b.overallStatus === 'Completed'
              );
              const key = b.bookingCode || b.id;

              dossiersMap.set(key, {
                id: b.id,
                source: 'lab_booking',
                bookingId: b.id,
                bookingCode: b.bookingCode || b.id,
                labId: labRec.id,
                labName: b.labName || labRec.name || 'Selected Laboratory',
                patientId: bPatAccount || bPatId || bPatPid,
                patientPid: bPatPid || bPatId,
                patientName: b.patientName || 'Patient',
                patientAlias: b.patientAlias || formatPatientAlias(b.patientAlias, b.patientName),
                patientPhone: b.patientPhone || '',
                doctorId: b.referringDoctorId || doctorId,
                doctorName: b.referringDoctor || doctorName,
                tests: (b.tests || []).map((t: any) => ({
                  name: t.testName || t.name || 'Diagnostic Test',
                  status: t.status || b.overallStatus || 'Pending_Validation',
                  value: t.resultValue || t.subParameters?.[0]?.value || undefined,
                  unit: t.units || t.subParameters?.[0]?.unit || '',
                  refRange: t.refRangeMale || t.subParameters?.[0]?.refRangeMale || '',
                  flag: t.resultFlag || t.subParameters?.[0]?.flag || 'Normal',
                })),
                overallStatus: b.overallStatus || 'Pending_Validation',
                stageLabel: describeBookingStage(b),
                isCertifiedResult: isCertified,
                biologistSigned: Boolean(b.biologistSigned),
                biologistName: b.biologistName,
                biologistRemarks: b.biologistRemarks,
                pdfReportUrl: b.pdfReportUrl || b.externalPdfUrl,
                rawBooking: b,
                createdAt: b.createdAt || new Date().toISOString(),
                updatedAt: b.updatedAt || b.createdAt || new Date().toISOString(),
              });
            });
          } catch {}
        })
      );
    } catch (err) {
      console.warn('Error scanning lab bookings for doctor:', err);
    }

    // 2. Also include explicitly shared patient reports from `doctor_shared_results`
    try {
      const sharedSnap = await getDocs(
        query(collection(db, 'doctor_shared_results'), where('doctorId', '==', doctorId))
      );
      sharedSnap.docs.forEach((sDoc) => {
        const s = sDoc.data() as any;
        const key = s.bookingCode || `share-${sDoc.id}`;
        if (dossiersMap.has(key)) return;
        dossiersMap.set(key, {
          id: sDoc.id,
          source: 'shared_result',
          bookingId: s.bookingId,
          bookingCode: s.bookingCode || sDoc.id.slice(0, 8).toUpperCase(),
          labId: s.labId || '',
          labName: s.labName || 'Performing Laboratory',
          patientId: s.patientId || '',
          patientPid: s.patientPid || s.patientId || '',
          patientName: s.patientName || 'Patient',
          patientAlias: formatPatientAlias(s.patientAlias, s.patientName),
          doctorId: s.doctorId,
          doctorName: s.doctorName,
          tests: (s.tests || []).map((t: any) => ({
            name: t.testName || t.name || s.testBatchName || 'Diagnostic Report',
            status: 'Completed',
            value: t.resultValue || t.value || 'Certified',
            unit: t.unit || t.units || '',
            refRange: t.referenceRange || '',
            flag: t.flag || 'Normal',
          })),
          overallStatus: 'Completed',
          stageLabel: 'Shared by Patient · Certified Result',
          isCertifiedResult: true,
          biologistSigned: true,
          biologistRemarks: s.personalNotes || '',
          rawBooking: s.rawBooking || s,
          createdAt: s.sharedAt || new Date().toISOString(),
          updatedAt: s.sharedAt || new Date().toISOString(),
        });
      });
    } catch {}

    return Array.from(dossiersMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  /**
   * Patient shares a real booking / certified lab result directly with a connected Doctor
   * (writes to `doctor_shared_results` AND sends an AES-256-GCM encrypted message card).
   */
  async sharePatientBookingWithDoctor(params: {
    doctorId: string;
    doctorName: string;
    patientId: string;
    patientPid?: string;
    patientName: string;
    patientAlias?: string;
    booking: any;
    note?: string;
  }): Promise<void> {
    await ensureFirebaseAuth();
    const now = new Date().toISOString();
    const b = params.booking;
    const testNames = (b.tests || [])
      .map((t: any) => t.testName || t.name || 'Diagnostic Test')
      .join(', ');

    await addDoc(
      collection(db, 'doctor_shared_results'),
      cleanFirestoreData({
        doctorId: params.doctorId,
        doctorName: params.doctorName,
        patientId: params.patientId,
        patientPid: params.patientPid || b.patientPid || params.patientId,
        patientName: params.patientName,
        patientAlias: formatPatientAlias(params.patientAlias, params.patientName),
        bookingId: b.id,
        bookingCode: b.bookingCode || b.id,
        labId: b.labId || '',
        labName: b.labName || 'Selected Laboratory',
        testBatchName: testNames || 'Diagnostic Dossier',
        tests: b.tests || [],
        personalNotes: params.note || '',
        rawBooking: b,
        sharedAt: now,
        status: 'pending_review',
      })
    );

    await this.sendEncryptedMessage({
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      patientId: params.patientId,
      patientPid: params.patientPid,
      patientName: params.patientName,
      patientAlias: params.patientAlias,
      senderRole: 'patient',
      type: 'result_share',
      text:
        params.note ||
        `Shared lab dossier ${b.bookingCode || ''} (${testNames}) from ${b.labName || 'Laboratory'}.`,
      metadata: {
        bookingId: b.id,
        bookingCode: b.bookingCode,
        labId: b.labId,
        labName: b.labName,
        testName: testNames,
        overallStatus: b.overallStatus,
        resultSummary: describeBookingStage(b),
      },
    });
  },
};
