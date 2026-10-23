/**
 * Family & Dependent Account Profile Service
 * Enables one primary account (e.g., a mother, father, or caregiver)
 * to manage independent sub-accounts for their elderly parents, newborn/young children,
 * or spouse. Each dependent account has its own:
 * - Demographics & identity (name, date of birth, age, blood group)
 * - Clinical profile (allergies, chronic illnesses, notes)
 * - Insurance coverage (own policy or inherited "ayant-droit" coverage)
 * - Independent lab test bookings, batches, and diagnostic reports
 */

import { FamilyMemberProfile, FamilyRelationship } from '../types';

const FAMILY_PROFILES_STORAGE_KEY = 'nanolabs_family_profiles_ledger';
const ACTIVE_PROFILE_ID_STORAGE_KEY = 'nanolabs_active_family_profile_id';

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
  other: 'Dependent (Autre Dépendant)'
};

export const DEFAULT_FAMILY_MEMBERS: FamilyMemberProfile[] = [
  {
    id: 'profile_self',
    primaryAccountId: 'patient_primary',
    fullName: 'Patient',
    nickname: 'Patient',
    relationship: 'self',
    relationshipLabel: 'Primary Account (Self)',
    dateOfBirth: '1995-06-15',
    age: 31,
    gender: 'female',
    bloodGroup: 'Unknown',
    allergies: [],
    chronicConditions: [],
    notes: 'Primary account.',
    createdAt: new Date().toISOString(),
    avatarColor: 'teal'
  }
];

export function getStoredFamilyMembers(primaryAccountId: string = 'patient_primary'): FamilyMemberProfile[] {
  try {
    const raw = localStorage.getItem(FAMILY_PROFILES_STORAGE_KEY);
    if (!raw) {
      saveFamilyMembers(DEFAULT_FAMILY_MEMBERS);
      return DEFAULT_FAMILY_MEMBERS;
    }
    const parsed: FamilyMemberProfile[] = JSON.parse(raw);
    // Filter out old legacy mock profiles
    const filtered = parsed.filter(p => 
      p.id !== 'profile_mother_madeleine' && 
      p.id !== 'profile_child_junior' && 
      p.id !== 'profile_child_chloe' &&
      !p.fullName?.toLowerCase().includes('madeleine') &&
      !p.fullName?.toLowerCase().includes('junior kamdem') &&
      !p.fullName?.toLowerCase().includes('chloé kamdem') &&
      !p.fullName?.toLowerCase().includes('claire ngo') &&
      !p.fullName?.toLowerCase().includes('claire_')
    );

    if (filtered.length === 0) {
      saveFamilyMembers(DEFAULT_FAMILY_MEMBERS);
      return DEFAULT_FAMILY_MEMBERS;
    }
    return filtered;
  } catch (e) {
    console.error('Error reading family profiles ledger', e);
    return DEFAULT_FAMILY_MEMBERS;
  }
}

export function saveFamilyMembers(members: FamilyMemberProfile[]): void {
  try {
    localStorage.setItem(FAMILY_PROFILES_STORAGE_KEY, JSON.stringify(members));
  } catch (e) {
    console.error('Error saving family profiles ledger', e);
  }
}

export function getActiveFamilyProfile(): FamilyMemberProfile {
  const members = getStoredFamilyMembers();
  try {
    const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_STORAGE_KEY);
    if (activeId) {
      const found = members.find((m) => m.id === activeId);
      if (found) return found;
    }
  } catch (e) {
    // fallback
  }
  // Safe default to self/first profile
  return members[0] || DEFAULT_FAMILY_MEMBERS[0];
}

export function setActiveFamilyProfile(profileId: string): FamilyMemberProfile {
  const members = getStoredFamilyMembers();
  let profile = members.find((m) => m.id === profileId);
  if (!profile) {
    profile = members[0] || DEFAULT_FAMILY_MEMBERS[0];
  }
  try {
    if (profile && profile.id) {
      localStorage.setItem(ACTIVE_PROFILE_ID_STORAGE_KEY, profile.id);
    }
  } catch (e) {
    console.error('Error setting active family profile', e);
  }
  return profile || DEFAULT_FAMILY_MEMBERS[0];
}

/**
 * Synchronize primary 'self' family member profile with logged in patient
 */
export function syncPrimaryProfileWithUser(userInfo: { id?: string; name?: string; phone?: string; gender?: string; profilePicture?: string }): FamilyMemberProfile {
  const members = getStoredFamilyMembers();
  const primaryIndex = members.findIndex(m => m.relationship === 'self');
  const realName = userInfo?.name?.trim() || 'Patient';
  
  if (primaryIndex >= 0) {
    const existing = members[primaryIndex];
    const isMockName = existing.fullName.toLowerCase().includes('claire');
    const finalName = realName !== 'Patient' ? realName : (isMockName ? 'Valued Patient' : existing.fullName);
    
    if (existing.fullName !== finalName || (userInfo.profilePicture && existing.photoUrl !== userInfo.profilePicture)) {
      members[primaryIndex] = {
        ...existing,
        fullName: finalName,
        nickname: finalName.split(' ')[0],
        phone: userInfo.phone || existing.phone,
        photoUrl: userInfo.profilePicture || existing.photoUrl
      };
      saveFamilyMembers(members);
    }
    return members[primaryIndex];
  } else {
    const newSelf: FamilyMemberProfile = {
      ...DEFAULT_FAMILY_MEMBERS[0],
      fullName: realName,
      nickname: realName.split(' ')[0],
      phone: userInfo.phone,
      photoUrl: userInfo.profilePicture
    };
    members.unshift(newSelf);
    saveFamilyMembers(members);
    return newSelf;
  }
}

export function addFamilyMember(data: Omit<FamilyMemberProfile, 'id' | 'createdAt'>): FamilyMemberProfile {
  const members = getStoredFamilyMembers();
  const newId = `profile_dep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  
  const newProfile: FamilyMemberProfile = {
    ...data,
    id: newId,
    createdAt: new Date().toISOString(),
    avatarColor: data.avatarColor || (data.gender === 'female' ? 'teal' : 'amber')
  };

  members.push(newProfile);
  saveFamilyMembers(members);
  return newProfile;
}

export function updateFamilyMember(profileId: string, updates: Partial<FamilyMemberProfile>): FamilyMemberProfile | null {
  const members = getStoredFamilyMembers();
  const index = members.findIndex((m) => m.id === profileId);
  if (index === -1) return null;

  const updated = {
    ...members[index],
    ...updates
  };
  members[index] = updated;
  saveFamilyMembers(members);
  return updated;
}

export function deleteFamilyMember(profileId: string): boolean {
  const members = getStoredFamilyMembers();
  // Never allow deleting the primary 'self' profile
  const target = members.find((m) => m.id === profileId);
  if (!target || target.relationship === 'self') return false;

  const filtered = members.filter((m) => m.id !== profileId);
  saveFamilyMembers(filtered);

  // If deleted profile was currently active, switch back to primary self
  const currentActiveId = localStorage.getItem(ACTIVE_PROFILE_ID_STORAGE_KEY);
  if (currentActiveId === profileId) {
    const primary = filtered.find((m) => m.relationship === 'self') || filtered[0];
    if (primary) {
      setActiveFamilyProfile(primary.id);
    }
  }

  return true;
}
