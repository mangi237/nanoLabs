import React, { useState } from 'react';
import { 
  Users, 
  ChevronDown, 
  UserPlus, 
  Check, 
  Heart, 
  ShieldCheck, 
  Edit3, 
  Plus
} from 'lucide-react';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { FamilyMemberModal } from './FamilyMemberModal';
import { FamilyMemberProfile } from '../../types';

interface FamilyProfileSwitcherProps {
  showBannerOnlyIfDependent?: boolean;
}

export const FamilyProfileSwitcher: React.FC<FamilyProfileSwitcherProps> = () => {
  const { 
    familyMembers = [], 
    activeProfile, 
    isDependentActive, 
    switchActiveProfile, 
    createFamilyMember,
    editFamilyMember 
  } = useFamilyProfile();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FamilyMemberProfile | null>(null);

  // Safe active profile fallback
  const safeProfile = activeProfile || {
    id: 'profile_self',
    primaryAccountId: 'primary',
    fullName: 'Account Holder',
    relationship: 'self' as const,
    relationshipLabel: 'Primary Account',
    age: 30,
    gender: 'female' as const,
    avatarColor: 'teal',
    createdAt: new Date().toISOString(),
    photoUrl: undefined
  };

  const handleOpenAddModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProfile(null);
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveProfile = (data: Omit<FamilyMemberProfile, 'id' | 'createdAt'>) => {
    setIsDropdownOpen(false);
    setIsModalOpen(false);
    try {
      if (editingProfile) {
        editFamilyMember(editingProfile.id, data);
      } else {
        const created = createFamilyMember(data);
        if (created && created.id) {
          switchActiveProfile(created.id);
        }
      }
    } catch (err) {
      console.warn('Error saving family member profile:', err);
    } finally {
      setEditingProfile(null);
    }
  };

  const getAvatarBg = (color?: string) => {
    switch (color) {
      case 'purple': return 'bg-purple-600 text-white';
      case 'teal': return 'bg-[#006978] text-white';
      case 'amber': return 'bg-amber-500 text-white';
      case 'rose': return 'bg-rose-500 text-white';
      case 'indigo': return 'bg-indigo-600 text-white';
      default: return 'bg-[#006978] text-white';
    }
  };

  const hasMultipleProfiles = familyMembers.length > 1;

  return (
    <div className="relative">
      {/* Compact, responsive trigger button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!hasMultipleProfiles) {
            handleOpenAddModal();
          } else {
            setIsDropdownOpen(prev => !prev);
          }
        }}
        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full border transition-all cursor-pointer shadow-2xs select-none ${
          isDependentActive
            ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
        }`}
        title={hasMultipleProfiles ? `Switch profile (Active: ${safeProfile.fullName})` : `Add family profile`}
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 overflow-hidden ${getAvatarBg(safeProfile.avatarColor)}`}>
          {safeProfile.photoUrl ? (
            <img src={safeProfile.photoUrl} alt={safeProfile.fullName} className="w-full h-full object-cover" />
          ) : (
            (safeProfile.fullName || 'P').charAt(0).toUpperCase()
          )}
        </div>

        <div className="hidden xs:flex flex-col text-left leading-none max-w-[80px] sm:max-w-[120px]">
          <span className="text-xs font-bold truncate">
            {(safeProfile.fullName || 'User').split(' ')[0]}
          </span>
          <span className="text-[9px] text-slate-400 capitalize truncate">
            {safeProfile.relationship === 'self' ? 'Primary' : (safeProfile.relationship || 'Account')}
          </span>
        </div>

        {hasMultipleProfiles ? (
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        ) : (
          <span title="Add family member profile">
            <Plus className="w-3.5 h-3.5 text-teal-600 ml-0.5" />
          </span>
        )}
      </button>

      {/* Dropdown Menu - ONLY shown if user has multiple profiles and modal is closed */}
      {isDropdownOpen && !isModalOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-2xs" 
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(false);
            }} 
          />
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-3xl border border-slate-200/90 shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#006978] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Family Dossiers</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Switch account to view individual tests
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="text-[11px] font-bold text-[#006978] hover:bg-[#E0F2F1] px-2.5 py-1 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Profile List */}
            <div className="max-h-64 overflow-y-auto py-1 space-y-1">
              {familyMembers.map((member) => {
                const isCurrent = safeProfile.id === member.id;
                return (
                  <div
                    key={member.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(false);
                      switchActiveProfile(member.id);
                    }}
                    className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isCurrent 
                        ? 'bg-[#E0F2F1] text-[#006978] font-bold' 
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black overflow-hidden shrink-0 ${getAvatarBg(member.avatarColor)}`}>
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
                        ) : (
                          (member.fullName || 'P').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold">{member.fullName || 'Family Member'}</span>
                          {member.relationship === 'self' && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">You</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {member.relationshipLabel || member.relationship} &bull; {member.age || 0} yrs
                        </span>
                      </div>
                    </div>

                    {isCurrent && (
                      <Check className="w-4 h-4 text-[#006978] shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Family Member Modal */}
      {isModalOpen && (
        <FamilyMemberModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProfile(null);
          }}
          onSave={handleSaveProfile}
          initialData={editingProfile}
          primaryUserName={safeProfile.fullName || 'Account Holder'}
        />
      )}
    </div>
  );
};
