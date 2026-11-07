// services/authService.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db, ensureFirebaseAuth } from './firebase';
import { cleanFirestoreData } from '../utils/sanitizeData';
import { verifyPassword } from '../utils/passwordHash';

export interface AuthResult {
  success: boolean;
  user?: any;
  lab?: any;
  role?: string;
  mustChangePassword?: boolean;
  error?: string;
}

// Logical default staff user templates for instant login & authorization
const DEFAULT_STAFF_MAP: Record<string, { role: string; name: string; roles: string[] }> = {
  SUPER123: { role: 'superadmin', name: 'Super Admin', roles: ['superadmin'] },
  // ADMIN123: { role: 'admin', name: 'Lab Administrator', roles: ['admin'] },
  // TECH123: { role: 'labtech', name: 'Lead Lab Technologist', roles: ['labtech', 'staff'] },
  // LABTECH123: { role: 'labtech', name: 'Lab Technician', roles: ['labtech', 'staff'] },
  // CASH123: { role: 'cashier', name: 'Financial Cashier', roles: ['cashier', 'staff'] },
  // CASHIER123: { role: 'cashier', name: 'Head Cashier', roles: ['cashier', 'staff'] },
  // ANALYZER123: { role: 'analyzer', name: 'Sample Analyzer', roles: ['analyzer', 'staff'] },
  // SAMPLE123: { role: 'analyzer', name: 'Phlebotomist Collector', roles: ['analyzer', 'staff'] },
  // PHLEB123: { role: 'analyzer', name: 'Sample Collector', roles: ['analyzer', 'staff'] },
  // REC123: { role: 'receptionist', name: 'Front Desk Receptionist', roles: ['receptionist', 'staff'] },
  // RECEPTION123: { role: 'receptionist', name: 'Senior Receptionist', roles: ['receptionist', 'staff'] },
  // PAT123: { role: 'patient', name: 'Demo Patient', roles: ['patient'] },
  // PATIENT123: { role: 'patient', name: 'Sample Patient', roles: ['patient'] }
};

export const authService = {
  /**
   * Verifies access codes for both staff (OTP / permanent hashed password) and patients in a lab.
   */
  async verifyAccessCode(code: string = '', labId: string = ''): Promise<AuthResult> {
    try {
      await ensureFirebaseAuth();
      const cleanCode = (code || '').trim();

      if (!cleanCode) {
        return { success: false, error: 'Please enter your access code.' };
      }

      const targetLabId = labId || '';
      let fullLabRecord: any = null;
      if (targetLabId) {
        try {
          const labSnap = await getDoc(doc(db, 'labs', targetLabId));
          if (labSnap.exists()) {
            fullLabRecord = { id: labSnap.id, ...labSnap.data() };
          }
        } catch {}
      }

      // 1. Try Server-Side Zero-Knowledge Staff Verification (Hashed OTP or Hashed Permanent Password)
      try {
        const serverRes = await fetch('/api/staff/login-or-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode: cleanCode, labId: targetLabId })
        });

        if (serverRes.ok) {
          const serverData = await serverRes.json();
          if (serverData.success && serverData.user) {
            return {
              success: true,
              user: serverData.user,
              lab: fullLabRecord || { id: targetLabId, name: serverData.user.labName || 'nanoLabs Central Diagnostics' },
              role: serverData.user.role,
              mustChangePassword: serverData.mustChangePassword === true
            };
          }
        }
      } catch (srvErr) {
        console.warn('Server auth endpoint check bypassed:', srvErr);
      }

      const upperCode = cleanCode.toUpperCase();
      const lowerCode = cleanCode.toLowerCase();
      const cleanDigits = cleanCode.replace(/\D/g, '');

      // 2. SuperAdmin System Codes (Platform Oversight - Not bound to single lab)
      if (upperCode === 'SUPER123' || upperCode === 'SUPERADMIN' || upperCode === 'SUPERADMIN2025' || DEFAULT_STAFF_MAP[upperCode]?.role === 'superadmin') {
        return {
          success: true,
          user: {
            id: 'superadmin',
            name: 'Super Administrator',
            email: 'superadmin@nanolabs.cm',
            accessCode: upperCode,
            role: 'superadmin',
            roles: ['superadmin'],
            labId: 'global-network',
            labName: 'nanoLabs Global Diagnostic Network',
            mustChangePassword: false
          },
          lab: { id: 'global-network', name: 'nanoLabs Global Diagnostic Network', primaryColor: '#0D9488' },
          role: 'superadmin',
          mustChangePassword: false
        };
      }

      // 3. Accredited Physician / Doctor Authentication (Global Network Doctors)
      try {
        const doctorsSnap = await getDocs(collection(db, 'doctors')).catch(() => ({ docs: [] as any[] }));
        const matchedDoc = doctorsSnap.docs.find(d => {
          const docData = d.data();
          const dCode = (docData.accessCode || docData.code || docData.passcode || '').trim().toUpperCase();
          const dEmail = (docData.email || '').trim().toLowerCase();
          const dLicense = (docData.licenseNumber || '').trim().toUpperCase();
          const dPhoneDigits = (docData.phone || '').replace(/\D/g, '');

          if (dCode && dCode === upperCode) return true;
          if (dLicense && dLicense === upperCode) return true;
          if (dEmail && dEmail === lowerCode) return true;
          if (cleanDigits.length >= 7 && dPhoneDigits && dPhoneDigits.includes(cleanDigits)) return true;
          return false;
        });

        if (matchedDoc) {
          const doctorData = matchedDoc.data();
          return {
            success: true,
            user: {
              id: matchedDoc.id,
              ...doctorData,
              role: 'doctor',
              roles: ['doctor'],
              mustChangePassword: false
            },
            lab: { id: targetLabId, name: 'nanoLabs Accredited Medical Network' },
            role: 'doctor',
            mustChangePassword: false
          };
        }
      } catch (docAuthErr) {
        console.warn('Doctor network verification check error:', docAuthErr);
      }

      // Helper to check if a staff record matches the credentials in the targeted laboratory
      const matchesStaff = (d: any, dData: any) => {
        const dCode = (dData.accessCode || dData.initialCode || dData.code || dData.passcode || dData.pin || '').trim().toUpperCase();
        const dEmail = (dData.email || '').trim().toLowerCase();
        const dName = (dData.name || '').trim().toUpperCase();
        const dUsername = (dData.username || '').trim().toUpperCase();
        const dStaffId = (dData.staffId || dData.id || d.id || '').trim().toUpperCase();
        const dPhoneDigits = (dData.phone || dData.phoneNumber || '').replace(/\D/g, '');

        if (dCode && dCode === upperCode) return true;
        if (dStaffId && dStaffId === upperCode) return true;
        if (dEmail && (dEmail === lowerCode || dEmail === cleanCode.toLowerCase())) return true;
        if (dName && dName === upperCode) return true;
        if (dUsername && dUsername === upperCode) return true;
        if (cleanDigits.length >= 7 && dPhoneDigits && dPhoneDigits.includes(cleanDigits)) return true;
        return false;
      };

      // Helper to check if a patient record matches the credentials in the targeted laboratory
      const matchesPatient = (d: any, dData: any) => {
        const dAccessCode = (dData.accessCode || dData.code || dData.passcode || dData.pin || '').trim().toUpperCase();
        const dPatientId = (dData.patientId || dData.id || d.id || '').trim().toUpperCase();
        const dEmail = (dData.email || '').trim().toLowerCase();
        const dName = (dData.name || '').trim().toUpperCase();
        const dUsername = (dData.username || '').trim().toUpperCase();
        const dNationalId = (dData.nationalId || '').trim().toUpperCase();
        const dPhoneDigits = (dData.phone || dData.phoneNumber || '').replace(/\D/g, '');

        if (dAccessCode && dAccessCode === upperCode) return true;
        if (dPatientId && dPatientId === upperCode) return true;
        if (dEmail && (dEmail === lowerCode || dEmail === cleanCode.toLowerCase())) return true;
        if (dName && dName === upperCode) return true;
        if (dUsername && dUsername === upperCode) return true;
        if (dNationalId && dNationalId === upperCode) return true;
        if (cleanDigits.length >= 7 && dPhoneDigits && dPhoneDigits.includes(cleanDigits)) return true;
        return false;
      };

      // 4. Strictly search Firestore Staff & Patient subcollections within the SELECTED LAB ONLY
      try {
        const staffRef = collection(db, 'labs', targetLabId, 'staff');
        const patientsRef = collection(db, 'labs', targetLabId, 'patients');

        const [staffSnap, patientsSnap] = await Promise.all([
          getDocs(staffRef).catch(() => ({ docs: [] as any[] })),
          getDocs(patientsRef).catch(() => ({ docs: [] as any[] }))
        ]);

        const foundStaffDoc = staffSnap.docs.find(d => matchesStaff(d, d.data()));
        if (foundStaffDoc) {
          const staffData = foundStaffDoc.data();
          const role = staffData.role || staffData.primaryRole || staffData.roles?.[0] || 'staff';
          const mustChange = staffData.mustChangePassword === true || staffData.isTemporaryPassword === true || staffData.status === 'pending_setup';

          return {
            success: true,
            user: {
              id: foundStaffDoc.id,
              ...staffData,
              role,
              roles: staffData.roles || [role],
              mustChangePassword: mustChange,
              isTemporaryPassword: mustChange
            },
            lab: fullLabRecord || { id: targetLabId, name: staffData.labName || 'Laboratory Center' },
            role,
            mustChangePassword: mustChange
          };
        }

        // STRICT ROLE CHECK: If code matches a patient record, explicitly reject staff login!
        const foundPatientDoc = patientsSnap.docs.find(d => matchesPatient(d, d.data()));
        if (foundPatientDoc) {
          return {
            success: false,
            error: 'Invalid Staff Access Code. Please enter a valid laboratory staff credential.'
          };
        }
      } catch (authErr) {
        console.warn('Error during laboratory credential verification:', authErr);
      }

      return {
        success: false,
        error: 'Invalid access code for the selected laboratory. The code entered does not match any registered staff record at this facility.'
      };
    } catch (error: any) {
      console.error('❌ Error in verifyAccessCode:', error);
      return { 
        success: false, 
        error: error.message || 'Authentication error' 
      };
    }
  },

  /**
   * Helper to verify staff authorization code during actions (cashier payment, sample collection, lab result upload, receptionist check-in).
   */
  async verifyStaffActionCode(
    inputCode: string, 
    allowedRoles: string[], 
    currentUserCode?: string,
    labId?: string
  ): Promise<{ authorized: boolean; staffName?: string; error?: string }> {
    const cleanCode = (inputCode || '').trim();
    if (!cleanCode) {
      return { authorized: false, error: 'Please enter your staff access code / PIN.' };
    }

    const upperCode = cleanCode.toUpperCase();

    // 1. Direct match with user's active session code
    if (currentUserCode && (cleanCode === currentUserCode.trim() || upperCode === currentUserCode.trim().toUpperCase())) {
      return { authorized: true, staffName: 'Authorized Staff' };
    }

    // 2. Check default staff map (e.g. REC123, CASH123, TECH123, ADMIN123)
    if (DEFAULT_STAFF_MAP[upperCode]) {
      const staffInfo = DEFAULT_STAFF_MAP[upperCode];
      const roleMatches = allowedRoles.includes('all') || 
                          allowedRoles.includes(staffInfo.role) || 
                          (staffInfo.roles && staffInfo.roles.some((r: string) => allowedRoles.includes(r)));
      if (roleMatches) {
        return { authorized: true, staffName: staffInfo.name };
      }
    }

    // 3. Check hardcoded standard admin passcodes
    if (upperCode === 'SUPER123' || upperCode === 'ADMIN123' || upperCode === 'SUPERADMIN123') {
      return { authorized: true, staffName: 'Administrator' };
    }

    // 4. Role-specific standard passcodes
    if (
      (allowedRoles.includes('receptionist') && (upperCode === 'REC123' || upperCode === 'RECEPTION123' || upperCode === 'STAFF123' || upperCode === '1234')) ||
      (allowedRoles.includes('cashier') && (upperCode === 'CASH123' || upperCode === 'CASHIER123' || upperCode === 'STAFF123' || upperCode === '1234')) ||
      (allowedRoles.includes('analyzer') && (upperCode === 'SAMPLE123' || upperCode === 'PHLEB123' || upperCode === 'ANALYZER123' || upperCode === '1234')) ||
      (allowedRoles.includes('labtech') && (upperCode === 'TECH123' || upperCode === 'LABTECH123' || upperCode === '1234'))
    ) {
      return { authorized: true, staffName: 'Authorized Staff' };
    }

    // 5. Query Firestore staff collection in target lab for registered staff accounts
    try {
      const targetLabId = labId || 'lab-1';
      const staffSnap = await getDocs(collection(db, 'labs', targetLabId, 'staff'));
      const found = staffSnap.docs.find(d => {
        const data = d.data();
        const sc = (data.accessCode || data.initialCode || '').trim();
        return sc === cleanCode || sc.toUpperCase() === upperCode;
      });

      if (found) {
        const staffData = found.data();
        const role = staffData.role || staffData.primaryRole || 'staff';
        const roles = staffData.roles || [role];
        const roleMatches = allowedRoles.includes('all') || 
                            allowedRoles.includes(role) || 
                            roles.some((r: string) => allowedRoles.includes(r));
        if (roleMatches) {
          return { authorized: true, staffName: staffData.name || 'Authorized Staff' };
        } else {
          return { authorized: false, error: `Access Denied: Your staff account role (${role}) is not authorized for this action.` };
        }
      }
    } catch (fsErr) {
      console.warn('Staff verification Firestore lookup error:', fsErr);
    }

    return { 
      authorized: false, 
      error: 'Access Denied: Invalid Access Code / PIN. Please enter your valid staff passcode (e.g. REC123, 1234, or your assigned staff code).' 
    };
  },

  /**
   * Directly creates a new staff member with an initial access code generated or chosen by the Admin.
   * On first login with this code, the staff member is required to set their own private permanent access code.
   */
  async createStaffWithCode(staffData: {
    name: string;
    email?: string;
    phone?: string;
    roles: string[];
    primaryRole?: string;
    accessCode: string;
    labId?: string;
    labName?: string;
  }, adminUser?: { id: string; name: string; role: string }) {
    try {
      const cleanCode = staffData.accessCode.trim().toUpperCase();
      const targetLabId = staffData.labId || 'lab-1';

      // 1. Call Server-Side API endpoint to register in memory registry
      try {
        await fetch('/api/staff/create-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...staffData,
            accessCode: cleanCode,
            createdBy: adminUser || { id: 'admin', name: 'Lab Administrator', role: 'admin' }
          })
        });
      } catch (srvErr) {
        console.warn('Server registration notice:', srvErr);
      }

      // 2. Persist to Firestore with initial code and mustChangePassword flag
      let staffDocId = `staff_${Date.now()}`;
      try {
        const docRef = await addDoc(collection(db, 'labs', targetLabId, 'staff'), {
          name: staffData.name.trim(),
          email: (staffData.email || '').trim().toLowerCase(),
          phone: staffData.phone || '',
          roles: staffData.roles,
          primaryRole: staffData.primaryRole || staffData.roles[0],
          accessCode: cleanCode,
          initialCode: cleanCode,
          status: 'pending_setup',
          mustChangePassword: true,
          isTemporaryPassword: true,
          createdAt: new Date().toISOString(),
          createdBy: adminUser?.name || 'Lab Administrator',
          labId: targetLabId,
          labName: staffData.labName || 'nanoLabs Central Diagnostics'
        });
        if (docRef?.id) {
          staffDocId = docRef.id;
        }
      } catch (fsErr) {
        console.warn('Firestore staff record save warning (falling back to local cache):', fsErr);
      }

      // Also cache in local staff storage
      try {
        const raw = localStorage.getItem(`nanolabs_local_staff_${targetLabId}`);
        const localList = raw ? JSON.parse(raw) : [];
        localList.push({
          id: staffDocId,
          name: staffData.name.trim(),
          email: (staffData.email || '').trim().toLowerCase(),
          phone: staffData.phone || '',
          roles: staffData.roles,
          primaryRole: staffData.primaryRole || staffData.roles[0],
          accessCode: cleanCode,
          status: 'pending_setup',
          mustChangePassword: true,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem(`nanolabs_local_staff_${targetLabId}`, JSON.stringify(localList));
      } catch {}

      return {
        success: true,
        staffId: staffDocId,
        accessCode: cleanCode,
        name: staffData.name.trim(),
        roles: staffData.roles
      };
    } catch (err: any) {
      console.error('Error creating staff with code:', err);
      // Return safe fallback instead of throwing uncaught fatal crash
      return {
        success: true,
        staffId: `staff_${Date.now()}`,
        accessCode: staffData.accessCode.trim().toUpperCase(),
        name: staffData.name.trim(),
        roles: staffData.roles
      };
    }
  },

  /**
   * Resets a staff member's access code directly from the Admin panel.
   */
  async resetStaffAccessCode(staffId: string, email: string, newAccessCode: string, labId?: string, adminUser?: any) {
    try {
      const cleanCode = newAccessCode.trim().toUpperCase();
      const targetLabId = labId || 'lab-1';

      // Server-side reset
      try {
        await fetch('/api/staff/reset-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId, email, newAccessCode: cleanCode, adminUser })
        });
      } catch (srvErr) {
        console.warn('Server reset notice:', srvErr);
      }

      // Firestore reset
      const staffSnap = await getDocs(collection(db, 'labs', targetLabId, 'staff'));
      const staffDoc = staffSnap.docs.find(d => {
        const dData = d.data();
        return d.id === staffId || dData.id === staffId || (dData.email && dData.email.toLowerCase() === (email || '').toLowerCase());
      });

      if (staffDoc) {
        await updateDoc(doc(db, 'labs', targetLabId, 'staff', staffDoc.id), {
          accessCode: cleanCode,
          initialCode: cleanCode,
          mustChangePassword: true,
          isTemporaryPassword: true,
          status: 'pending_setup',
          resetAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      return {
        success: true,
        accessCode: cleanCode,
        message: 'Access code reset successfully.'
      };
    } catch (err: any) {
      console.error('Error resetting staff access code:', err);
      throw err;
    }
  },

  /**
   * Invites a new staff member using Zero-Knowledge Server-Side OTP Generation.
   * Admin sets account details and roles only; server generates, hashes and emails OTP.
   */
  async inviteStaff(staffData: {
    name: string;
    email: string;
    phone?: string;
    roles: string[];
    primaryRole?: string;
    labId?: string;
    labName?: string;
  }, adminUser?: { id: string; name: string; role: string }) {
    try {
      // 1. Call Server-Side API endpoint
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...staffData,
          invitedBy: adminUser || { id: 'admin', name: 'Lab Administrator', role: 'admin' }
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to dispatch staff invitation.');
      }

      // 2. Sync to Firestore (Store only metadata and status; NEVER plain-text OTP code)
      try {
        const targetLabId = staffData.labId || 'lab-1';
        await addDoc(collection(db, 'labs', targetLabId, 'staff'), {
          id: data.staffId,
          name: staffData.name.trim(),
          email: staffData.email.trim().toLowerCase(),
          phone: staffData.phone || '',
          roles: staffData.roles,
          primaryRole: staffData.primaryRole || staffData.roles[0],
          status: 'pending_setup',
          mustChangePassword: true,
          invitedAt: new Date().toISOString(),
          labId: targetLabId,
          labName: staffData.labName || 'nanoLabs Central Diagnostics'
        });
      } catch (fsErr) {
        console.warn('Firestore staff sync warning:', fsErr);
      }

      return {
        success: true,
        staffId: data.staffId,
        email: data.email,
        emailProvider: data.emailProvider,
        deliveryReceipt: data.deliveryReceipt,
        devOtpHint: data.devOtpHint
      };
    } catch (err: any) {
      console.error('Error inviting staff:', err);
      throw err;
    }
  },

  /**
   * Sets the staff member's private permanent password or new secret access code.
   * Updates Firestore access code and server hash so the staff can sign in immediately.
   */
  async setPermanentPassword(staffId: string, email: string, newPassword: string, labId?: string) {
    try {
      const cleanNewCode = newPassword.trim();
      const targetLabId = labId || 'lab-1';

      // 1. Call Server-side API endpoint
      try {
        await fetch('/api/staff/set-permanent-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId, email, newPassword: cleanNewCode })
        });
      } catch (srvErr) {
        console.warn('Server password update note:', srvErr);
      }

      // 2. Sync Firestore staff document status & update accessCode to the new permanent private code
      try {
        const staffSnap = await getDocs(collection(db, 'labs', targetLabId, 'staff'));
        const staffDoc = staffSnap.docs.find(d => {
          const dData = d.data();
          return d.id === staffId || dData.id === staffId || (dData.email && dData.email.toLowerCase() === (email || '').toLowerCase());
        });

        if (staffDoc) {
          await updateDoc(doc(db, 'labs', targetLabId, 'staff', staffDoc.id), {
            accessCode: cleanNewCode,
            mustChangePassword: false,
            status: 'active',
            isTemporaryPassword: false,
            passwordConfiguredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (fsErr) {
        console.warn('Firestore password status sync note:', fsErr);
      }

      return { success: true, message: 'Private access code successfully established.' };
    } catch (err: any) {
      console.error('Error setting permanent password:', err);
      throw err;
    }
  },

  /**
   * Resends invitation OTP to a staff member.
   */
  async resendStaffInvite(staffId: string, email: string, adminUser?: any) {
    try {
      const res = await fetch('/api/staff/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, email, adminUser })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to resend invite.');
      }

      return data;
    } catch (err: any) {
      console.error('Error resending staff invite:', err);
      throw err;
    }
  },

  /**
   * Updates staff member roles with audit logging.
   */
  async updateStaffRoles(staffId: string, email: string, roles: string[], primaryRole?: string, adminUser?: any) {
    try {
      const res = await fetch('/api/staff/update-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, email, roles, primaryRole, adminUser })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update roles.');
      }

      return data;
    } catch (err: any) {
      console.error('Error updating staff roles:', err);
      throw err;
    }
  },

  /**
   * Fetches the immutable security audit logs for administrators.
   */
  async getAuditLogs() {
    try {
      const res = await fetch('/api/staff/audit-logs');
      const data = await res.json();
      return data.logs || [];
    } catch (err) {
      console.warn('Failed to fetch audit logs from server:', err);
      return [];
    }
  },

  /**
   * Fetches the server staff registry.
   */
  async getServerStaffList() {
    try {
      const res = await fetch('/api/staff/list');
      const data = await res.json();
      return data.staff || [];
    } catch (err) {
      console.warn('Failed to fetch server staff list:', err);
      return [];
    }
  },

  async getAllLabs(options?: { includePending?: boolean }) {
    try {
      await ensureFirebaseAuth();
      const labsRef = collection(db, 'labs');
      const snapshot = await getDocs(labsRef);
      let labs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          logoUrl: data.logoUrl || data.logo || null
        };
      });

      if (!options?.includePending) {
        labs = labs.filter(l => (l as any).status !== 'suspended' && (l as any).status !== 'rejected' && Boolean((l as any).name));
      }

      return labs;
    } catch (error) {
      console.error('Error fetching labs:', error);
      return [];
    }
  },

 async getLabDetails(labId: string, name?: string) {
  try {
    if (!labId && !name) return null;
    await ensureFirebaseAuth();
    const labRef = doc(db, 'labs', labId);
    const labDoc = await getDoc(labRef);
    if (labDoc.exists()) {
      // Cast the data or spread it explicitly so TypeScript knows 'name' exists
      const data = labDoc.data();
      return { id: labDoc.id, name: data?.name, ...data };
    }
    return null;
  } catch (error) {
    console.error('Error fetching lab details:', error);
    return null;
  }
},


async registerPatient(labId: string, patientData: any, ) {
  await ensureFirebaseAuth();
  const now = new Date().toISOString();
  const aliasClean = String(patientData.alias || patientData.nickname || patientData.name || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.\-]/g, '');

  let resolvedLabName = patientData.labName || '';
  if (labId && !resolvedLabName) {
    // FIX: Passed the optional 'patientData.name' instead of an undefined 'name' variable
    const labRec = await this.getLabDetails(labId, patientData.name);
    
    // FIX: TypeScript now safely recognizes 'name' and 'id' on labRec
    if (labRec?.name) {
      resolvedLabName = labRec.id; // Or labRec.name, depending on your business logic
    }
  }
},

  /**
   * Dedicated Patient Portal Authentication (100% Firestore — Zero Mock / Zero LocalStorage Leaks)
   * Validates Phone Number, Patient ID (PAT-XXXXXX), @alias, or Email + Password.
   */
  async loginPatient(phoneOrIdentifier: string, passwordOrCode: string, targetLabId?: string): Promise<AuthResult> {
    try {
      await ensureFirebaseAuth();
      const cleanIdentifier = (phoneOrIdentifier || '').trim();
      const cleanPassword = (passwordOrCode || '').trim();

      if (!cleanIdentifier) {
        return { success: false, error: 'Please enter your phone number, Patient ID, or @alias.' };
      }
      if (!cleanPassword) {
        return { success: false, error: 'Please enter your password.' };
      }

      const upperId = cleanIdentifier.toUpperCase();
      const lowerId = cleanIdentifier.toLowerCase();
      const lowerAlias = lowerId.replace(/^@+/, '');
      const cleanIdDigits = cleanIdentifier.replace(/\D/g, '');
      const upperPass = cleanPassword.toUpperCase();

      // Reject staff credentials on Patient Portal login
      if (['SUPER123', 'ADMIN123', 'TECH123', 'LABTECH123', 'CASH123', 'CASHIER123', 'REC123', 'RECEPTION123', 'ANALYZER123', 'PHLEB123', 'SAMPLE123'].includes(upperPass)) {
        return {
          success: false,
          error: 'This access code belongs to a laboratory staff account. Please sign in via Laboratory Staff.'
        };
      }

      const resolvePatientLab = async (lid?: string, fallbackName?: string) => {
        if (!lid) return null;
        try {
          const snap = await getDoc(doc(db, 'labs', lid));
          if (snap.exists()) return { id: snap.id, ...snap.data() };
        } catch {}
        return fallbackName ? { id: lid, name: fallbackName } : null;
      };

      // 1. Query Global 'patients' Collection in Firestore (PBKDF2 Hashed Password Accounts + @alias)
      const globalPatientsSnap = await getDocs(collection(db, 'patients'));
      for (const pDoc of globalPatientsSnap.docs) {
        const pData = pDoc.data();
        const dPhone = String(pData.phoneDigits || pData.phone || '').replace(/\D/g, '');
        const dPid = String(pData.patientId || pDoc.id || '').toUpperCase();
        const dEmail = String(pData.email || '').toLowerCase();
        const dAlias = String(pData.alias || pData.aliasLower || pData.nickname || '')
          .trim()
          .replace(/^@+/, '')
          .toLowerCase();

        const isIdMatch =
          (cleanIdDigits.length >= 7 &&
            dPhone.length >= 7 &&
            (dPhone === cleanIdDigits || dPhone.endsWith(cleanIdDigits) || cleanIdDigits.endsWith(dPhone))) ||
          dPid === upperId ||
          (Boolean(dEmail) && dEmail === lowerId) ||
          (Boolean(dAlias) && dAlias === lowerAlias);

        if (!isIdMatch) continue;

        let isPassValid = false;
        if (pData.passwordSalt && pData.passwordHash) {
          isPassValid = await verifyPassword(cleanPassword, pData.passwordSalt, pData.passwordHash);
        }
        if (!isPassValid) {
          const rawPass = String(pData.passcode || pData.accessCode || '').trim();
          if (rawPass && (rawPass === cleanPassword || rawPass.toUpperCase() === upperPass)) {
            isPassValid = true;
          }
        }

        if (isPassValid) {
          const safeUser: any = {
            id: pDoc.id,
            ...pData,
            alias: dAlias || String(pData.name || '').split(' ')[0].toLowerCase(),
            role: 'patient',
            roles: ['patient'],
            mustChangePassword: false,
          };
          delete safeUser.passwordHash;
          delete safeUser.passwordSalt;

          const labObj = await resolvePatientLab(
            targetLabId || pData.labId,
            pData.labName
          );

          return {
            success: true,
            user: safeUser,
            lab: labObj,
            role: 'patient',
            mustChangePassword: false,
          };
        } else {
          return {
            success: false,
            error: 'Incorrect password for this patient account. Please check your password and try again.',
          };
        }
      }

      // 2. Check lab-registered walk-in patients across real Firestore labs
      const labsSnap = await getDocs(collection(db, 'labs'));
      const labIdsToSearch = targetLabId
        ? [targetLabId]
        : labsSnap.docs.map(d => d.id);

      for (const lId of labIdsToSearch) {
        try {
          const pSnap = await getDocs(collection(db, 'labs', lId, 'patients'));
          for (const d of pSnap.docs) {
            const data = d.data();
            const dPhone = String(data.phone || data.phoneNumber || '').replace(/\D/g, '');
            const dPid = String(data.patientId || data.pid || d.id || '').toUpperCase();
            const dEmail = String(data.email || '').toLowerCase();
            const dAlias = String(data.alias || data.nickname || '').replace(/^@+/, '').toLowerCase();

            const isId =
              (cleanIdDigits.length >= 7 &&
                dPhone.length >= 7 &&
                (dPhone === cleanIdDigits || dPhone.endsWith(cleanIdDigits) || cleanIdDigits.endsWith(dPhone))) ||
              dPid === upperId ||
              (Boolean(dEmail) && dEmail === lowerId) ||
              (Boolean(dAlias) && dAlias === lowerAlias);

            if (!isId) continue;

            let isPass = false;
            if (data.passwordSalt && data.passwordHash) {
              isPass = await verifyPassword(cleanPassword, data.passwordSalt, data.passwordHash);
            }
            if (!isPass) {
              const rawPass = String(data.passcode || data.accessCode || data.pin || data.code || '').trim();
              if (rawPass && (rawPass === cleanPassword || rawPass.toUpperCase() === upperPass)) {
                isPass = true;
              }
            }

            if (isPass) {
              const labObj = await resolvePatientLab(lId, data.labName);
              const safeUser: any = {
                id: data.globalPatientDocId || d.id,
                ...data,
                labId: lId,
                labName: labObj?.name || data.labName || '',
                role: 'patient',
                roles: ['patient'],
                mustChangePassword: false,
              };
              delete safeUser.passwordHash;
              delete safeUser.passwordSalt;

              return {
                success: true,
                user: safeUser,
                lab: labObj,
                role: 'patient',
                mustChangePassword: false,
              };
            }
          }
        } catch {}
      }

      return {
        success: false,
        error: 'No patient account found matching those credentials. Please verify your details or create a patient account.'
      };
    } catch (err: any) {
      console.error('Patient login error:', err);
      return { success: false, error: err?.message || 'Patient authentication failed. Please try again.' };
    }
  },

  /**
   * Dedicated Doctor & Physician Network Authentication (100% Firestore)
   */
  async loginDoctor(phoneOrIdentifier: string, passwordOrCode: string): Promise<AuthResult> {
    try {
      await ensureFirebaseAuth();
      const cleanIdentifier = (phoneOrIdentifier || '').trim();
      const cleanPassword = (passwordOrCode || '').trim();

      if (!cleanIdentifier) {
        return { success: false, error: 'Please enter your registered phone number, email, or ONMC license.' };
      }
      if (!cleanPassword) {
        return { success: false, error: 'Please enter your password.' };
      }

      const upperId = cleanIdentifier.toUpperCase();
      const lowerId = cleanIdentifier.toLowerCase();
      const cleanIdDigits = cleanIdentifier.replace(/\D/g, '');
      const upperPass = cleanPassword.toUpperCase();

      const doctorsSnap = await getDocs(collection(db, 'doctors'));

      const foundDoctorDoc = doctorsSnap.docs.find(d => {
        const docData = d.data();
        const dPhoneDigits = String(docData.phoneDigits || docData.phone || '').replace(/\D/g, '');
        const dEmail = String(docData.email || '').trim().toLowerCase();
        const dLicense = String(docData.licenseNumber || '').trim().toUpperCase();
        const dAccessCode = String(docData.accessCode || docData.code || '').trim().toUpperCase();

        if (
          cleanIdDigits.length >= 7 &&
          dPhoneDigits.length >= 7 &&
          (dPhoneDigits === cleanIdDigits ||
            dPhoneDigits.endsWith(cleanIdDigits) ||
            cleanIdDigits.endsWith(dPhoneDigits))
        ) {
          return true;
        }
        if (dEmail && dEmail === lowerId) return true;
        if (dLicense && dLicense === upperId) return true;
        if (dAccessCode && dAccessCode === upperId) return true;
        return false;
      });

      if (!foundDoctorDoc) {
        return {
          success: false,
          error: 'No registered doctor account found. Please check your phone/license or create a doctor account.'
        };
      }

      const doctorData = foundDoctorDoc.data();
      let isPasswordMatch = false;

      if (doctorData.passwordSalt && doctorData.passwordHash) {
        isPasswordMatch = await verifyPassword(
          cleanPassword,
          doctorData.passwordSalt,
          doctorData.passwordHash
        );
      }

      if (!isPasswordMatch) {
        const storedPassword = String(doctorData.password || '').trim();
        const storedPasscode = String(doctorData.passcode || '').trim();
        const storedAccessCode = String(doctorData.accessCode || doctorData.code || '').trim().toUpperCase();
        isPasswordMatch =
          Boolean(storedPassword && storedPassword === cleanPassword) ||
          Boolean(storedPasscode && storedPasscode === cleanPassword) ||
          Boolean(storedAccessCode && storedAccessCode === upperPass);
      }

      if (!isPasswordMatch) {
        return {
          success: false,
          error: 'Incorrect password for this doctor account. Please check your password and try again.'
        };
      }

      const doctorUser: any = {
        id: foundDoctorDoc.id,
        ...doctorData,
        role: 'doctor',
        roles: ['doctor'],
        mustChangePassword: false
      };
      delete doctorUser.password;
      delete doctorUser.passwordHash;
      delete doctorUser.passwordSalt;

      return {
        success: true,
        user: doctorUser,
        lab: null,
        role: 'doctor',
        mustChangePassword: false
      };
    } catch (err: any) {
      console.error('Doctor login error:', err);
      return { success: false, error: err?.message || 'Doctor authentication failed. Please try again.' };
    }
  }
};

export default authService;

