import React, { createContext, useContext, useState, useEffect } from 'react';
import { FamilyMemberProfile } from '../types';
import { 
  getStoredFamilyMembers, 
  getActiveFamilyProfile, 
  setActiveFamilyProfile as persistActiveProfile,
  addFamilyMember as serviceAddFamilyMember,
  updateFamilyMember as serviceUpdateFamilyMember,
  deleteFamilyMember as serviceDeleteFamilyMember,
  syncPrimaryProfileWithUser
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
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<FamilyMemberProfile>(() => getActiveFamilyProfile());

  const refreshFamilyMembers = () => {
    try {
      if (user) {
        syncPrimaryProfileWithUser({
          id: user.id,
          name: user.name || user.fullName,
          phone: user.phone,
          profilePicture: user.profilePicture || user.avatarUrl
        });
      }
      const list = getStoredFamilyMembers();
      setFamilyMembers(list);
      const active = getActiveFamilyProfile();
      if (active) {
        setActiveProfileState(active);
      }
    } catch (e) {
      console.warn('Error refreshing family members:', e);
    }
  };

  useEffect(() => {
    refreshFamilyMembers();
  }, [user?.name, user?.profilePicture, user?.id]);

  const switchActiveProfile = (profileId: string) => {
    try {
      // Broadcast immediate overlay-dismiss event so all open contextual modals,
      // payment popups, and report drawers close completely before new profile state is active
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nanolabs_close_all_overlays', { detail: { profileId } }));
        window.dispatchEvent(new CustomEvent('nanolabs_profile_switched', { detail: { profileId } }));
      }
      const selected = persistActiveProfile(profileId);
      if (selected) {
        setActiveProfileState(selected);
      }
    } catch (err) {
      console.error('Error switching profile:', err);
    }
  };

  const createFamilyMember = (data: Omit<FamilyMemberProfile, 'id' | 'createdAt'>) => {
    const created = serviceAddFamilyMember(data);
    const list = getStoredFamilyMembers();
    setFamilyMembers(list);
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

  const isDependentActive = Boolean(activeProfile && activeProfile.relationship && activeProfile.relationship !== 'self');

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
