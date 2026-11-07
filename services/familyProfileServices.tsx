/**
 * Family & Dependent Account Profile Service (Firestore-Backed, User-Isolated)
 *
 * CRITICAL SECURITY INVARIANT:
 * - Never uses a global shared localStorage key or generic 'profile_self' ID.
 * - Primary ('self') profile ALWAYS inherits the authenticated patient's unique
 *   `user.patientId || user.id` so bookings can NEVER collide across accounts.
 * - Dependent family members are stored in Firestore under:
 *   `patients/{primaryUserId}/family_members/{memberId}`
 */

import { FamilyMemberProfile, FamilyRelationship } from '../types';
import {
  db,
  ensureFirebaseAuth,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from './firebase';
import { cleanFirestoreData } from '../utils/sanitizeData';

export const RELATIONSHIP_LABELS: Record<FamilyRelationship, string> = {
  self: 'Primary Account (Self)',
  mother: 'Mother (Mère)',
  father: 'Father (Père)',
  child: 'Child (Enfant)',
  son: 'Son (Fils)',
  daughter: 'Daughter (Fille)',
  spouse: 'Spouse (Époux / Épouse)',
  sibling: 'Sibling (Frère / Sœur)',
  grandparent: 'Grandparent (Grand-parent)',
  other: 'Dependent (Autre Dépendant)',
};

// Per-user in-memory cache keyed strictly by authenticated user.id
const memoryStoreByUser = new Map<string, FamilyMemberProfile[]>();
const activeProfileIdByUser = new Map<string, string>();

export function buildPrimarySelfProfile(user?: any): FamilyMemberProfile {
  const uniqueId = String(user?.patientId || user?.id || '').trim();
  const realName = String(user?.name || user?.fullName || '').trim() || 'Account Holder';
  const alias =
    String(user?.alias || user?.nickname || realName.split(' ')[0] || '').trim() || realName;

  return {
    id: uniqueId,
    primaryAccountId: String(user?.id || uniqueId),
    fullName: realName,
    nickname: alias,
    relationship: 'self',
    relationshipLabel: 'Primary Account (Self)',
    dateOfBirth: user?.dateOfBirth || '1995-01-01',
    age: Number(user?.age) || 30,
    gender: (String(user?.gender || 'female').toLowerCase() === 'male' ? 'male' : 'female') as any,
    bloodGroup: user?.bloodGroup || 'Unknown',
    phone: user?.phone || '',
    city: user?.city || '',
    nationalId: user?.nationalId || '',
    insuranceProvider: user?.insuranceProvider || '',
    insurancePolicyNumber: user?.insurancePolicyNumber || '',
    employerSociete: user?.employerSociete || '',
    photoUrl: user?.profilePicture || user?.avatarUrl || undefined,
    allergies: Array.isArray(user?.allergies) ? user.allergies : [],
    chronicConditions: Array.isArray(user?.chronicConditions) ? user.chronicConditions : [],
    notes: '',
    createdAt: user?.createdAt || new Date().toISOString(),
    avatarColor: 'teal',
  };
}

export async function fetchFirestoreFamilyMembers(user: any): Promise<FamilyMemberProfile[]> {
  const selfProfile = buildPrimarySelfProfile(user);
  const userDocId = String(user?.id || '').trim();
  if (!userDocId) return [selfProfile];

  await ensureFirebaseAuth();
  try {
    const snap = await getDocs(collection(db, 'patients', userDocId, 'family_members'));
    const dependents: FamilyMemberProfile[] = snap.docs
      .map((d) => ({ ...(d.data() as FamilyMemberProfile), id: d.id }))
      .filter((m) => m.relationship !== 'self');
    const combined = [selfProfile, ...dependents];
    memoryStoreByUser.set(userDocId, combined);
    return combined;
  } catch (err) {
    console.warn('Error loading Firestore family members:', err);
    const cached = memoryStoreByUser.get(userDocId);
    if (cached && cached.length > 0) {
      return [selfProfile, ...cached.filter((c) => c.relationship !== 'self')];
    }
    memoryStoreByUser.set(userDocId, [selfProfile]);
    return [selfProfile];
  }
}

export function getStoredFamilyMembers(primaryAccountId?: string, user?: any): FamilyMemberProfile[] {
  const key = String(user?.id || primaryAccountId || '').trim();
  const selfProfile = buildPrimarySelfProfile(user);
  if (!key) return [selfProfile];
  const existing = memoryStoreByUser.get(key);
  if (!existing || existing.length === 0) {
    memoryStoreByUser.set(key, [selfProfile]);
    return [selfProfile];
  }
  return [selfProfile, ...existing.filter((m) => m.relationship !== 'self')];
}

export function getActiveFamilyProfile(user?: any): FamilyMemberProfile {
  const key = String(user?.id || '').trim();
  const members = getStoredFamilyMembers(key, user);
  const activeId = key ? activeProfileIdByUser.get(key) : undefined;
  if (activeId) {
    const found = members.find((m) => m.id === activeId);
    if (found) return found;
  }
  return members[0];
}

export function setActiveFamilyProfile(profileId: string, user?: any): FamilyMemberProfile {
  const key = String(user?.id || '').trim();
  const members = getStoredFamilyMembers(key, user);
  const found = members.find((m) => m.id === profileId) || members[0];
  if (key && found?.id) {
    activeProfileIdByUser.set(key, found.id);
  }
  return found;
}

export function syncPrimaryProfileWithUser(userInfo: any): FamilyMemberProfile {
  const selfProfile = buildPrimarySelfProfile(userInfo);
  const key = String(userInfo?.id || '').trim();
  if (key) {
    const existing = memoryStoreByUser.get(key) || [];
    const dependents = existing.filter((m) => m.relationship !== 'self');
    memoryStoreByUser.set(key, [selfProfile, ...dependents]);
  }
  return selfProfile;
}

export function addFamilyMember(
  data: Omit<FamilyMemberProfile, 'id' | 'createdAt'>,
  user?: any
): FamilyMemberProfile {
  const userDocId = String(user?.id || data.primaryAccountId || '').trim();
  const newId = `DEP-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const newProfile: FamilyMemberProfile = {
    ...data,
    id: newId,
    primaryAccountId: userDocId,
    createdAt: new Date().toISOString(),
    avatarColor: data.avatarColor || (data.gender === 'female' ? 'teal' : 'amber'),
  };

  if (userDocId) {
    const current = getStoredFamilyMembers(userDocId, user);
    memoryStoreByUser.set(userDocId, [...current, newProfile]);
    ensureFirebaseAuth().then(() => {
      setDoc(
        doc(db, 'patients', userDocId, 'family_members', newId),
        cleanFirestoreData(newProfile)
      ).catch((err) => console.warn('Could not save dependent to Firestore:', err));
    });
  }

  return newProfile;
}

export function updateFamilyMember(
  profileId: string,
  updates: Partial<FamilyMemberProfile>,
  user?: any
): FamilyMemberProfile | null {
  const userDocId = String(user?.id || '').trim();
  const members = getStoredFamilyMembers(userDocId, user);
  const idx = members.findIndex((m) => m.id === profileId);
  if (idx === -1) return null;

  const updated: FamilyMemberProfile = { ...members[idx], ...updates };
  members[idx] = updated;
  if (userDocId) {
    memoryStoreByUser.set(userDocId, members);
    if (updated.relationship !== 'self') {
      ensureFirebaseAuth().then(() => {
        updateDoc(
          doc(db, 'patients', userDocId, 'family_members', profileId),
          cleanFirestoreData(updates)
        ).catch(() => {});
      });
    } else {
      ensureFirebaseAuth().then(() => {
        updateDoc(doc(db, 'patients', userDocId), cleanFirestoreData(updates)).catch(() => {});
      });
    }
  }
  return updated;
}

export function deleteFamilyMember(profileId: string, user?: any): boolean {
  const userDocId = String(user?.id || '').trim();
  const members = getStoredFamilyMembers(userDocId, user);
  const target = members.find((m) => m.id === profileId);
  if (!target || target.relationship === 'self') return false;

  const filtered = members.filter((m) => m.id !== profileId);
  if (userDocId) {
    memoryStoreByUser.set(userDocId, filtered);
    if (activeProfileIdByUser.get(userDocId) === profileId) {
      activeProfileIdByUser.set(userDocId, filtered[0]?.id || '');
    }
    ensureFirebaseAuth().then(() => {
      deleteDoc(doc(db, 'patients', userDocId, 'family_members', profileId)).catch(() => {});
    });
  }
  return true;
}
