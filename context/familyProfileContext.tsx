import React, { createContext, useContext, useState, useEffect } from 'react';
import { FamilyMemberProfile } from '../types';
import { 
  getStoredFamilyMembers, 
  getActiveFamilyProfile, 
  setActiveFamilyProfile as persistActiveProfile,
  addFamilyMember as serviceAddFamilyMember,
  updateFamilyMember as serviceUpdateFamilyMember,
  deleteFamilyMember as serviceDeleteFamilyMember
} from '../services/familyProfileServices';

interface FamilyProfileContextType {
  familyMembers: FamilyMemberProfile[];
  activeProfile: FamilyMemberProfile;
  isDependentActive: boolean;
  switchActiveProfile: (profileId: string) => void;
  createFamilyMember: (data: Omit<FamilyMemberProfile, 'id' | 'createdAt'>) => FamilyMemberProfile;
  editFamilyMember: (profileId: string, updates: Partial<FamilyMemberProfile>) => void;
  removeFamilyMember: (profileId: string) => boolean;
  refreshFamilyMembers: () => void;
}

const FamilyProfileContext = createContext<FamilyProfileContextType | undefined>(undefined);

export const FamilyProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<FamilyMemberProfile>(() => getActiveFamilyProfile());

  const refreshFamilyMembers = () => {
    const list = getStoredFamilyMembers();
    setFamilyMembers(list);
    const active = getActiveFamilyProfile();
    setActiveProfileState(active);
  };

  useEffect(() => {
    refreshFamilyMembers();
  }, []);

  const switchActiveProfile = (profileId: string) => {
    const selected = persistActiveProfile(profileId);
    setActiveProfileState(selected);
  };

  const createFamilyMember = (data: Omit<FamilyMemberProfile, 'id' | 'createdAt'>) => {
    const created = serviceAddFamilyMember(data);
    refreshFamilyMembers();
    return created;
  };

  const editFamilyMember = (profileId: string, updates: Partial<FamilyMemberProfile>) => {
    serviceUpdateFamilyMember(profileId, updates);
    refreshFamilyMembers();
  };

  const removeFamilyMember = (profileId: string) => {
    const success = serviceDeleteFamilyMember(profileId);
    if (success) {
      refreshFamilyMembers();
    }
    return success;
  };

  const isDependentActive = activeProfile.relationship !== 'self';

  return (
    <FamilyProfileContext.Provider
      value={{
        familyMembers,
        activeProfile,
        isDependentActive,
        switchActiveProfile,
        createFamilyMember,
        editFamilyMember,
        removeFamilyMember,
        refreshFamilyMembers
      }}
    >
      {children}
    </FamilyProfileContext.Provider>
  );
};

export function useFamilyProfile() {
  const context = useContext(FamilyProfileContext);
  if (!context) {
    throw new Error('useFamilyProfile must be used within a FamilyProfileProvider');
  }
  return context;
}
