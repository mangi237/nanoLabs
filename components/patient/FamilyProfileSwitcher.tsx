import React, { useState } from 'react';
import { 
  Users, 
  ChevronDown, 
  UserPlus, 
  Check, 
  Heart, 
  ShieldCheck, 
  AlertCircle, 
  Edit3, 
  ArrowRightLeft,
  Sparkles,
  Info
} from 'lucide-react';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { FamilyMemberModal } from './FamilyMemberModal';
import { FamilyMemberProfile } from '../../types';

interface FamilyProfileSwitcherProps {
  showBannerOnlyIfDependent?: boolean;
}

export const FamilyProfileSwitcher: React.FC<FamilyProfileSwitcherProps> = ({
  showBannerOnlyIfDependent = true
}) => {
  const { 
    familyMembers, 
    activeProfile, 
    isDependentActive, 
    switchActiveProfile, 
    createFamilyMember,
    editFamilyMember 
  } = useFamilyProfile();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FamilyMemberProfile | null>(null);

  const handleOpenAddModal = () => {
    setEditingProfile(null);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleOpenEditModal = (profile: FamilyMemberProfile) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleSaveProfile = (data: Omit<FamilyMemberProfile, 'id' | 'createdAt'>) => {
    if (editingProfile) {
      editFamilyMember(editingProfile.id, data);
    } else {
      const created = createFamilyMember(data);
      switchActiveProfile(created.id);
    }
  };

  const getAvatarBg = (color?: string) => {
    switch (color) {
      case 'indigo': return 'bg-indigo-600 text-white';
      case 'amber': return 'bg-amber-600 text-white';
      case 'rose': return 'bg-rose-500 text-white';
      case 'teal':
      default: return 'bg-[#0F766E] text-white';
    }
  };

  const primaryProfile = familyMembers.find((m) => m.relationship === 'self');

  return (
    <div className="relative">
      {/* Trigger Pill */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`min-h-[44px] flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            isDependentActive
              ? 'bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100/70'
              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
          title="Switch active family profile"
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-2xs ${getAvatarBg(activeProfile.avatarColor)}`}>
            {activeProfile.fullName.charAt(0).toUpperCase()}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold truncate max-w-[130px] sm:max-w-[170px]">
                {activeProfile.fullName}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                activeProfile.relationship === 'self'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-amber-200 text-amber-900'
              }`}>
                {activeProfile.relationship === 'self' ? 'Primary' : activeProfile.relationshipLabel.split(' ')[0]}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              {activeProfile.age} yrs &bull; {activeProfile.bloodGroup || 'Blood type N/A'}
            </p>
          </div>

          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#0D3B38] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Family & Dependent Accounts</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  Switch record or add dependent relatives
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="text-[11px] font-bold text-[#0F766E] hover:text-[#0D3B38] bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Add</span>
              </button>
            </div>

            {/* Profile List */}
            <div className="max-h-72 overflow-y-auto py-1 space-y-1">
              {familyMembers.map((member) => {
                const isActive = member.id === activeProfile.id;
                return (
                  <div
                    key={member.id}
                    className={`p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 ${
                      isActive 
                        ? 'bg-teal-50/80 border border-teal-200/80' 
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        switchActiveProfile(member.id);
                        setIsDropdownOpen(false);
                      }}
                      className="flex-1 flex items-center gap-2.5 text-left cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${getAvatarBg(member.avatarColor)}`}>
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[#0B1F1D] truncate">
                            {member.fullName}
                          </p>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-[#14B8A6] shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {member.relationshipLabel} &bull; {member.age} yrs &bull; {member.bloodGroup || 'Blood: N/A'}
                        </p>
                        {member.chronicConditions && member.chronicConditions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.chronicConditions.slice(0, 2).map((c, idx) => (
                              <span key={idx} className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-sm truncate max-w-[120px]">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(member)}
                      title="Edit details"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Add Action */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold text-[#0F766E] hover:bg-teal-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Account for Mother, Child, or Relative</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Dependent Active Reminder Banner */}
      {isDependentActive && (
        <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                Active Dependent Record: {activeProfile.fullName} ({activeProfile.relationshipLabel})
              </p>
              <p className="text-[11px] text-amber-800">
                New test bookings, prescriptions, and lab reports will be recorded in her/his file.
              </p>
            </div>
          </div>

          {primaryProfile && (
            <button
              type="button"
              onClick={() => switchActiveProfile(primaryProfile.id)}
              className="min-h-[44px] px-3 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Back to Self</span>
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <FamilyMemberModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProfile(null);
        }}
        onSave={handleSaveProfile}
        initialData={editingProfile}
        primaryUserName={primaryProfile?.fullName || 'Mme. Claire Ngo'}
        primaryUserInsurance={primaryProfile?.insuranceProvider || 'Ascoma Assurances'}
      />
    </div>
  );
};
