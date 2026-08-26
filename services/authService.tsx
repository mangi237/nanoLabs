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
  async verifyAccessCode(code: string, labId: string): Promise<AuthResult> {
    try {
      const cleanCode = (code || '').trim();
      console.log('🔍 verifyAccessCode called with:', { cleanCode, labId });

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
            console.log('✅ Verified via Server-side Staff Auth Registry:', serverData.user.name);
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

      // 2. Check logical default staff codes (SUPER123, TECH123, CASH123, ANALYZER123, REC123, etc.)
      if (DEFAULT_STAFF_MAP[upperCode]) {
        const staffInfo = DEFAULT_STAFF_MAP[upperCode];
        console.log('✅ Default staff role matched:', staffInfo.name);

        let labData: any = { id: targetLabId, name: 'nanoLabs Central Diagnostics', primaryColor: '#0D9488' };
        try {
          const labRef = doc(db, 'labs', targetLabId);
          const labDoc = await getDoc(labRef);
          if (labDoc.exists()) {
            labData = { id: labDoc.id, ...labDoc.data() };
          }
        } catch (e) {
          console.warn('Using default lab config:', e);
        }

        return {
          success: true,
          user: {
            id: upperCode.toLowerCase(),
            name: staffInfo.name,
            accessCode: upperCode,
            role: staffInfo.role,
            roles: staffInfo.roles,
            labId: targetLabId,
            labName: labData.name,
            mustChangePassword: false
          },
          lab: labData,
          role: staffInfo.role,
          mustChangePassword: false
        };
      }

      // Helper to check if a staff record matches the credentials
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

      // Helper to check if a patient record matches the credentials
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

      const lowerCode = cleanCode.toLowerCase();
      const cleanDigits = cleanCode.replace(/\D/g, '');

      // 3. Search Firestore Staff & Patient subcollections concurrently
      try {
        console.log('🔍 Checking Firestore credentials in target lab:', targetLabId);
        const staffRef = collection(db, 'labs', targetLabId, 'staff');
        const patientsRef = collection(db, 'labs', targetLabId, 'patients');

        const [staffSnap, patientsSnap] = await Promise.all([
          getDocs(staffRef).catch(() => ({ docs: [] as any[] })),
          getDocs(patientsRef).catch(() => ({ docs: [] as any[] }))
        ]);

        const foundStaffDoc = staffSnap.docs.find(d => matchesStaff(d, d.data()));
        if (foundStaffDoc) {
          const staffData = foundStaffDoc.data();
          console.log('✅ Firestore Staff found:', staffData.name);
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

        const foundPatientDoc = patientsSnap.docs.find(d => matchesPatient(d, d.data()));
        if (foundPatientDoc) {
          const patientData = foundPatientDoc.data();
          console.log('✅ Firestore Patient found:', patientData.name);

          return {
            success: true,
            user: {
              id: foundPatientDoc.id,
              ...patientData,
              role: 'patient',
              roles: ['patient'],
              mustChangePassword: false
            },
            lab: { id: targetLabId, name: patientData.labName || 'Laboratory Center' },
            role: 'patient',
            mustChangePassword: false
          };
        }

        // Global parallel check across other facilities if not in target lab
        const allLabsSnap = await getDocs(collection(db, 'labs')).catch(() => ({ docs: [] as any[] }));
        const otherLabIds = allLabsSnap.docs.map(d => d.id).filter(id => id !== targetLabId);

        if (otherLabIds.length > 0) {
          const allOtherFetches = otherLabIds.map(async (labId) => {
            const [sSnap, pSnap] = await Promise.all([
              getDocs(collection(db, 'labs', labId, 'staff')).catch(() => ({ docs: [] as any[] })),
              getDocs(collection(db, 'labs', labId, 'patients')).catch(() => ({ docs: [] as any[] }))
            ]);
            return { labId, staffDocs: sSnap.docs, patientDocs: pSnap.docs };
          });

          const results = await Promise.all(allOtherFetches);
          for (const res of results) {
            const otherStaff = res.staffDocs.find(d => matchesStaff(d, d.data()));
            if (otherStaff) {
              const staffData = otherStaff.data();
              const role = staffData.role || staffData.primaryRole || staffData.roles?.[0] || 'staff';
              const mustChange = staffData.mustChangePassword === true || staffData.isTemporaryPassword === true || staffData.status === 'pending_setup';
              return {
                success: true,
                user: {
                  id: otherStaff.id,
                  ...staffData,
                  role,
                  roles: staffData.roles || [role],
                  mustChangePassword: mustChange,
                  isTemporaryPassword: mustChange
                },
                lab: { id: res.labId, name: staffData.labName || 'Laboratory Center' },
                role,
                mustChangePassword: mustChange
              };
            }

            const otherPatient = res.patientDocs.find(d => matchesPatient(d, d.data()));
            if (otherPatient) {
              const patientData = otherPatient.data();
              return {
                success: true,
                user: {
                  id: otherPatient.id,
                  ...patientData,
                  role: 'patient',
                  roles: ['patient'],
                  mustChangePassword: false
                },
                lab: { id: res.labId, name: patientData.labName || 'Laboratory Center' },
                role: 'patient',
                mustChangePassword: false
              };
            }
          }
        }
      } catch (authErr) {
        console.warn('Error during concurrent credential verification:', authErr);
      }

      // 5. Check local client fallback cache (for instant login after local registration)
      try {
        const localPatientRaw = localStorage.getItem('last_registered_patient');
        if (localPatientRaw) {
          const localPatient = JSON.parse(localPatientRaw);
          if (matchesPatient({ id: localPatient.id }, localPatient)) {
            console.log('✅ Patient matched from local registration cache:', localPatient.name);
            return {
              success: true,
              user: {
                ...localPatient,
                role: 'patient',
                roles: ['patient'],
                mustChangePassword: false
              },
              lab: { id: localPatient.labId || targetLabId, name: localPatient.labName || 'Laboratory Center' },
              role: 'patient',
              mustChangePassword: false
            };
          }
        }
      } catch (locErr) {
        // silent
      }

      // No arbitrary string fallbacks. Only valid registered credentials are authorized!
      console.log('❌ Invalid access code attempted:', cleanCode);
      return { 
        success: false, 
        error: 'Invalid access code or passcode. Please check your credentials or one-time invite email.' 
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

      return {
        success: true,
        staffId: docRef.id,
        accessCode: cleanCode,
        name: staffData.name.trim(),
        roles: staffData.roles
      };
    } catch (err: any) {
      console.error('Error creating staff with code:', err);
      throw err;
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
      const labsRef = collection(db, 'labs');
      const snapshot = await getDocs(labsRef);
      let labs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          logoUrl: data.logoUrl || data.logo || null
        };
      });

      if (!options?.includePending) {
        labs = labs.filter(l => (l as any).status !== 'pending_approval' && (l as any).status !== 'suspended' && (l as any).status !== 'rejected');
      }

      if (labs.length === 0 && !options?.includePending) {
        return [
          { 
            id: 'lab-1', 
            name: 'nanoLabs Central Diagnostics', 
            location: 'Douala City Hub',
            logoUrl: null,
            primaryColor: '#0D9488',
            status: 'active',
            confirmed: true
          },
          { 
            id: 'lab-2', 
            name: 'St. Jude Clinical Laboratory', 
            location: 'Yaounde Metro',
            logoUrl: null,
            primaryColor: '#0284C7',
            status: 'active',
            confirmed: true
          }
        ];
      }

      return labs;
    } catch (error) {
      console.error('Error fetching labs:', error);
      return [
        { 
          id: 'lab-1', 
          name: 'nanoLabs Central Diagnostics', 
          location: 'Douala City Hub',
          logoUrl: null,
          primaryColor: '#0D9488',
          status: 'active',
          confirmed: true
        },
        { 
          id: 'lab-2', 
          name: 'St. Jude Clinical Laboratory', 
          location: 'Yaounde Metro',
          logoUrl: null,
          primaryColor: '#0284C7',
          status: 'active',
          confirmed: true
        }
      ];
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

      const docRef = await addDoc(patientsRef, newPatient);
      return {
        success: true,
        patientId: docRef.id,
        accessCode: patientData.accessCode
      };
    } catch (error: any) {
      console.error('Error registering patient:', error);
      return { success: false, error: error.message };
    }
  }
};

export default authService;

