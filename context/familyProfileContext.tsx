import React, { createContext, useContext, useState, useEffect } from 'react';
import { FamilyMemberProfile } from '../types';
import {
  fetchFirestoreFamilyMembers,
  getStoredFamilyMembers,
  getActiveFamilyProfile,
  setActiveFamilyProfile as persistActiveProfile,
  addFamilyMember as serviceAddFamilyMember,
  updateFamilyMember as serviceUpdateFamilyMember,
  deleteFamilyMember as serviceDeleteFamilyMember,
  syncPrimaryProfileWithUser,
} from '../services/familyProfileServices';
import { useAuth } from './authContext';

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
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberProfile[]>(() =>
    getStoredFamilyMembers(user?.id, user)
  );
  const [activeProfile, setActiveProfileState] = useState<FamilyMemberProfile>(() =>
    getActiveFamilyProfile(user)
  );

  const refreshFamilyMembers = async () => {
    try {
      if (!user) {
        const fallback = getStoredFamilyMembers('', null);
        setFamilyMembers(fallback);
        setActiveProfileState(fallback[0]);
        return;
      }
      syncPrimaryProfileWithUser(user);
      const liveList = await fetchFirestoreFamilyMembers(user);
      setFamilyMembers(liveList);
      const currentActive = getActiveFamilyProfile(user);
      const matched = liveList.find((m) => m.id === currentActive.id) || liveList[0];
      setActiveProfileState(matched);
    } catch (e) {
      console.warn('Error refreshing family members:', e);
    }
  };

  useEffect(() => {
    refreshFamilyMembers();
  }, [user?.id, user?.patientId, user?.name, user?.alias, user?.nickname, user?.profilePicture]);

  const switchActiveProfile = (profileId: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('nanolabs_close_all_overlays', { detail: { profileId } })
        );
        window.dispatchEvent(
          new CustomEvent('nanolabs_profile_switched', { detail: { profileId } })
        );
      }
      const selected = persistActiveProfile(profileId, user);
      if (selected) {
        setActiveProfileState(selected);
      }
    } catch (err) {
      console.error('Error switching profile:', err);
    }
  };

  const createFamilyMember = (data: Omit<FamilyMemberProfile, 'id' | 'createdAt'>) => {
    const created = serviceAddFamilyMember(data, user);
    const list = getStoredFamilyMembers(user?.id, user);
    setFamilyMembers(list);
    return created;
  };

  const editFamilyMember = (profileId: string, updates: Partial<FamilyMemberProfile>) => {
    const updated = serviceUpdateFamilyMember(profileId, updates, user);
    const list = getStoredFamilyMembers(user?.id, user);
    setFamilyMembers(list);
    if (updated && activeProfile.id === profileId) {
      setActiveProfileState(updated);
    }
  };

  const removeFamilyMember = (profileId: string) => {
    const success = serviceDeleteFamilyMember(profileId, user);
    if (success) {
      const list = getStoredFamilyMembers(user?.id, user);
      setFamilyMembers(list);
      setActiveProfileState(getActiveFamilyProfile(user));
    }
    return success;
  };

  const isDependentActive = Boolean(
    activeProfile && activeProfile.relationship && activeProfile.relationship !== 'self'
  );

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
        refreshFamilyMembers,
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
