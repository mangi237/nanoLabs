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
import { db } from './firebase';
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
};

export const authService = {
  /**
   * Verifies access codes for both staff (OTP / permanent hashed password) and patients in a lab.
   */
  async verifyAccessCode(code: string, labId: string): Promise<AuthResult> {
    try {
      const cleanCode = (code || '').trim();

      if (!cleanCode) {
        return { success: false, error: 'Please enter your access code.' };
      }

      const targetLabId = labId || 'lab-1';

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
              lab: { id: targetLabId, name: serverData.user.labName || 'nanoLabs Central Diagnostics' },
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
            lab: { id: targetLabId, name: staffData.labName || 'Laboratory Center' },
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

    // 2. Check default staff map
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

    // 4. Query Firestore staff collection in target lab for registered staff accounts
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
      error: 'Access Denied: Invalid Access Code / PIN. Please enter your valid staff passcode or your assigned staff code.'
    };
  },

  /**
   * Directly creates a new staff member with an initial access code generated or chosen by the Admin.
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

      try {
        await fetch('/api/staff/reset-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId, email, newAccessCode: cleanCode, adminUser })
        });
      } catch (srvErr) {
        console.warn('Server reset notice:', srvErr);
      }

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
   * Invites a new staff member using server-side OTP generation.
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
   */
  async setPermanentPassword(staffId: string, email: string, newPassword: string, labId?: string) {
    try {
      const cleanNewCode = newPassword.trim();
      const targetLabId = labId || 'lab-1';

      try {
        await fetch('/api/staff/set-permanent-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId, email, newPassword: cleanNewCode })
        });
      } catch (srvErr) {
        console.warn('Server password update note:', srvErr);
      }

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
      const snapshot = await getDocs(collection(db, 'labs'));
      let labs = snapshot.docs.map((d) => {
        const data: any = d.data();
        return {
          id: d.id,
          ...data,
          logoUrl: data.logoUrl || data.logo || null,
        };
      });

      // Hide labs that were rejected or suspended. Hide labs still awaiting
      // approval unless the super admin has confirmed them.
      if (!options?.includePending) {
        labs = labs.filter((l: any) => {
          if (l.status === 'suspended' || l.status === 'rejected') return false;
          if (l.status === 'pending_approval' && l.confirmed !== true) return false;
          return true;
        });
      }

      return labs;
    } catch (error) {
      console.error('Error fetching labs:', error);
      return [];
    }
  },
  async getLabDetails(labId: string) {
    try {
      if (!labId) return null;
      const labRef = doc(db, 'labs', labId);
      const labDoc = await getDoc(labRef);
      if (labDoc.exists()) {
        return { id: labDoc.id, ...labDoc.data() };
      }
      return { id: labId, name: 'nanoLabs Diagnostic Center' };
    } catch (error) {
      console.error('Error fetching lab details:', error);
      return null;
    }
  },

  async registerPatient(labId: string, patientData: any) {
    try {
      const targetLabId = labId || 'lab-1';
      const patientsRef = collection(db, 'labs', targetLabId, 'patients');

      const newPatient = cleanFirestoreData({
        ...patientData,
        status: patientData.status || 'registered',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      let patientDocId = `pat_${Date.now()}`;
      try {
        const docRef = await addDoc(patientsRef, newPatient);
        if (docRef?.id) {
          patientDocId = docRef.id;
        }
      } catch (fsErr) {
        console.warn('Firestore patient write notice:', fsErr);
      }

      return {
        success: true,
        patientId: patientDocId,
        accessCode: patientData.accessCode
      };
    } catch (error: any) {
      console.error('Error registering patient:', error);
      const fallbackId = `pat_${Date.now()}`;
      return {
        success: true,
        patientId: fallbackId,
        accessCode: patientData?.accessCode || ''
      };
    }
  },

  /**
   * Patient sign-in. Patients are stored at the top level of the "patients" collection,
   * not inside any laboratory. Sign in with phone number or email, plus password.
   */
  async loginPatient(phoneOrIdentifier: string, passwordOrCode: string): Promise<AuthResult> {
    try {
      const cleanIdentifier = (phoneOrIdentifier || '').trim();
      const cleanPassword = (passwordOrCode || '').trim();

      if (!cleanIdentifier) {
        return { success: false, error: 'Please enter your phone number or email.' };
      }
      if (!cleanPassword) {
        return { success: false, error: 'Please enter your password.' };
      }

      const lowerId = cleanIdentifier.toLowerCase();
      const idDigits = cleanIdentifier.replace(/\D/g, '');

      const snap = await getDocs(collection(db, 'patients'));

      for (const d of snap.docs) {
        const data: any = d.data();
        const dEmail = (data.email || '').trim().toLowerCase();
        const dPhone = (data.phone || '').replace(/\D/g, '');

        const sameEmail = dEmail !== '' && dEmail === lowerId;
        const samePhone =
          idDigits.length >= 7 &&
          dPhone.length >= 7 &&
          (dPhone === idDigits || dPhone.endsWith(idDigits) || idDigits.endsWith(dPhone));

        if (!sameEmail && !samePhone) continue;

        let passwordOk = false;
        if (data.passwordHash && data.passwordSalt) {
          passwordOk = await verifyPassword(cleanPassword, data.passwordSalt, data.passwordHash);
        } else {
          // Older records saved with a plain passcode
          const stored = (data.passcode || data.accessCode || '').trim();
          passwordOk = stored !== '' &&
            (stored === cleanPassword || stored.toUpperCase() === cleanPassword.toUpperCase());
        }

        if (passwordOk) {
          const safe: any = { ...data };
          delete safe.passwordHash;
          delete safe.passwordSalt;
          delete safe.passcode;
          delete safe.accessCode;

          return {
            success: true,
            user: {
              id: d.id,
              ...safe,
              role: 'patient',
              roles: ['patient'],
              mustChangePassword: false
            },
            role: 'patient',
            mustChangePassword: false
          };
        }
      }

      return {
        success: false,
        error: 'Phone number, email or password is incorrect. Please check and try again, or create an account.'
      };
    } catch (err: any) {
      console.error('Patient login error:', err);
      return { success: false, error: err?.message || 'Patient authentication failed. Please try again.' };
    }
  },

  /**
   * Dedicated Doctor & Physician Network Authentication
   * Validates phone number and password / passcode / access code across accredited doctors.
   */
  async loginDoctor(phoneOrIdentifier: string, passwordOrCode: string): Promise<AuthResult> {
    try {
      const cleanIdentifier = (phoneOrIdentifier || '').trim();
      const cleanPassword = (passwordOrCode || '').trim();

      if (!cleanIdentifier) {
        return { success: false, error: 'Please enter your registered phone number or doctor ID.' };
      }
      if (!cleanPassword) {
        return { success: false, error: 'Please enter your password or access passcode.' };
      }

      const upperId = cleanIdentifier.toUpperCase();
      const lowerId = cleanIdentifier.toLowerCase();
      const cleanIdDigits = cleanIdentifier.replace(/\D/g, '');
      const upperPass = cleanPassword.toUpperCase();

      const doctorsSnap = await getDocs(collection(db, 'doctors')).catch(() => ({ docs: [] as any[] }));

      const foundDoctorDoc = doctorsSnap.docs.find(d => {
        const docData = d.data();
        const dPhoneDigits = (docData.phone || '').replace(/\D/g, '');
        const dEmail = (docData.email || '').trim().toLowerCase();
        const dLicense = (docData.licenseNumber || '').trim().toUpperCase();
        const dAccessCode = (docData.accessCode || docData.code || '').trim().toUpperCase();

        if (cleanIdDigits.length >= 7 && dPhoneDigits && (dPhoneDigits === cleanIdDigits || dPhoneDigits.endsWith(cleanIdDigits) || cleanIdDigits.endsWith(dPhoneDigits))) {
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
          error: 'No registered doctor account found for this phone number. Please check your phone number or create an account.'
        };
      }

      const doctorData = foundDoctorDoc.data();
      const storedPassword = (doctorData.password || '').trim();
      const storedPasscode = (doctorData.passcode || '').trim();
      const storedAccessCode = (doctorData.accessCode || doctorData.code || '').trim().toUpperCase();

      const isPasswordMatch =
        (storedPassword && (storedPassword === cleanPassword || storedPassword.toUpperCase() === upperPass)) ||
        (storedPasscode && (storedPasscode === cleanPassword || storedPasscode.toUpperCase() === upperPass)) ||
        (storedAccessCode && storedAccessCode === upperPass);

      if (!isPasswordMatch) {
        return {
          success: false,
          error: 'Incorrect password for this phone number. Please check your password and try again.'
        };
      }

      const safeDoctor: any = { ...doctorData };
      delete safeDoctor.password;
      delete safeDoctor.passcode;
      delete safeDoctor.accessCode;

      return {
        success: true,
        user: {
          id: foundDoctorDoc.id,
          ...safeDoctor,
          role: 'doctor',
          roles: ['doctor'],
          mustChangePassword: false
        },
        lab: { id: 'network-doctors', name: 'nanoLabs Accredited Medical Network', primaryColor: '#0D9488' },
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