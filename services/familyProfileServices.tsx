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
    id: 'profile_self_claire',
    primaryAccountId: 'patient_demo',
    fullName: 'Mme. Claire Ngo',
    relationship: 'self',
    relationshipLabel: 'Primary Account (Self)',
    dateOfBirth: '1988-06-14',
    age: 38,
    gender: 'female',
    bloodGroup: 'O+',
    nationalId: 'CNI-LT-2018-004921',
    allergies: [],
    chronicConditions: [],
    insuranceProvider: 'Ascoma Assurances',
    insurancePolicyNumber: 'ASC-2026-992014',
    insuranceCoveragePercent: 80,
    isDependentOnPrimaryInsurance: false,
    notes: 'Primary subscriber. Regular checkups, prenatal care follow-up.',
    createdAt: '2026-01-10T08:00:00.000Z',
    avatarColor: 'teal'
  },
  {
    id: 'profile_mother_madeleine',
    primaryAccountId: 'patient_demo',
    fullName: 'Mme. Ngo Madeleine',
    relationship: 'mother',
    relationshipLabel: 'Mother (Mère, 72 ans)',
    dateOfBirth: '1954-04-18',
    age: 72,
    gender: 'female',
    bloodGroup: 'A+',
    nationalId: 'CNI-LT-1982-019382',
    allergies: ['Pénicilline', 'Sulfamides'],
    chronicConditions: ['Hypertension Artérielle (HTA)', 'Diabète Type 2'],
    insuranceProvider: 'Ascoma Assurances',
    insurancePolicyNumber: 'ASC-2026-992014-DEP1',
    insuranceCoveragePercent: 80,
    isDependentOnPrimaryInsurance: true,
    notes: 'Elderly mother. Quarterly monitoring of Glycated Hemoglobin (HbA1c), lipid panel, and renal creatinine clearance.',
    createdAt: '2026-01-15T09:30:00.000Z',
    avatarColor: 'indigo'
  },
  {
    id: 'profile_child_junior',
    primaryAccountId: 'patient_demo',
    fullName: 'Junior Kamdem',
    relationship: 'son',
    relationshipLabel: 'Son (Fils, 8 ans)',
    dateOfBirth: '2018-09-22',
    age: 8,
    gender: 'male',
    bloodGroup: 'O+',
    allergies: ['Arachides (Arachis)'],
    chronicConditions: ['Asthme léger d\'effort'],
    insuranceProvider: 'Ascoma Assurances',
    insurancePolicyNumber: 'ASC-2026-992014-DEP2',
    insuranceCoveragePercent: 80,
    isDependentOnPrimaryInsurance: true,
    notes: 'School-age child. Pediatric blood count, thick blood smear (Goutte épaisse/Paludisme), vaccination boosters.',
    createdAt: '2026-02-01T11:15:00.000Z',
    avatarColor: 'amber'
  },
  {
    id: 'profile_child_chloe',
    primaryAccountId: 'patient_demo',
    fullName: 'Bébé Chloé Kamdem',
    relationship: 'daughter',
    relationshipLabel: 'Daughter (Fille, 2 ans)',
    dateOfBirth: '2024-03-05',
    age: 2,
    gender: 'female',
    bloodGroup: 'O+',
    allergies: [],
    chronicConditions: [],
    insuranceProvider: 'Ascoma Assurances',
    insurancePolicyNumber: 'ASC-2026-992014-DEP3',
    insuranceCoveragePercent: 80,
    isDependentOnPrimaryInsurance: true,
    notes: 'Toddler. Pediatric developmental milestones, hemoglobin electrophoresis, routine infant blood checks.',
    createdAt: '2026-03-10T14:20:00.000Z',
    avatarColor: 'rose'
  }
];

export function getStoredFamilyMembers(primaryAccountId: string = 'patient_demo'): FamilyMemberProfile[] {
  try {
    const raw = localStorage.getItem(FAMILY_PROFILES_STORAGE_KEY);
    if (!raw) {
      saveFamilyMembers(DEFAULT_FAMILY_MEMBERS);
      return DEFAULT_FAMILY_MEMBERS;
    }
    const parsed: FamilyMemberProfile[] = JSON.parse(raw);
    if (parsed.length === 0) {
      saveFamilyMembers(DEFAULT_FAMILY_MEMBERS);
      return DEFAULT_FAMILY_MEMBERS;
    }
    return parsed;
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
  // Default to self/first profile
  return members[0] || DEFAULT_FAMILY_MEMBERS[0];
}

export function setActiveFamilyProfile(profileId: string): FamilyMemberProfile {
  const members = getStoredFamilyMembers();
  const profile = members.find((m) => m.id === profileId) || members[0];
  try {
    localStorage.setItem(ACTIVE_PROFILE_ID_STORAGE_KEY, profile.id);
  } catch (e) {
    console.error('Error setting active family profile', e);
  }
  return profile;
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
