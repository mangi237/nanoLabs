import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { db, doc, updateDoc, setDoc } from '../../services/firebase';
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  ShieldCheck, 
  Heart, 
  ChevronRight, 
  Key, 
  Calendar,
  Lock,
  Baby,
  User,
  Activity
} from 'lucide-react';

export interface FamilyProfile {
  id: string;
  name: string;
  relationship: 'Self' | 'Child' | 'Spouse' | 'Parent' | 'Elderly Dependent' | 'Other';
  gender: 'Male' | 'Female';
  age: number | string;
  phone?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  accessCode?: string;
  avatarColor?: string;
}

interface FamilyProfileSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSwitched?: (selectedProfile: FamilyProfile) => void;
}

const AVATAR_COLORS = [
  'bg-teal-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-purple-500'
];

export const FamilyProfileSwitcherModal: React.FC<FamilyProfileSwitcherModalProps> = ({
  isOpen,
  onClose,
  onProfileSwitched
}) => {
  const { user, setUser, lab } = useAuth();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingCodeProfileId, setEditingCodeProfileId] = useState<string | null>(null);
  const [newAccessCodeInput, setNewAccessCodeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form for new family sub-account
  const [newProfileForm, setNewProfileForm] = useState<Partial<FamilyProfile>>({
    name: '',
    relationship: 'Child',
    gender: 'Male',
    age: '',
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    accessCode: ''
  });

  if (!isOpen) return null;

  // Retrieve existing profiles from user object or default to primary account
  const storedProfiles: FamilyProfile[] = user?.familyProfiles || [
    {
      id: user?.id || 'self-1',
      name: user?.name || 'Primary Account Holder',
      relationship: 'Self',
      gender: user?.gender || 'Male',
      age: user?.age || 35,
      phone: user?.phone || '',
      bloodGroup: user?.bloodGroup || 'O+',
      accessCode: user?.accessCode || (user as any)?.passcode || '8888',
      avatarColor: 'bg-teal-600'
    }
  ];

  const currentActiveProfileId = user?.activeFamilyProfileId || user?.id || 'self-1';

  const handleSelectProfile = async (profile: FamilyProfile) => {
    try {
      const updatedUser = {
        ...user,
        activeFamilyProfileId: profile.id,
        // If switched to dependent, override current session name & health context for bookings
        activeProfileName: profile.name,
        activeProfileRelationship: profile.relationship,
        activeProfileAge: profile.age,
        activeProfileGender: profile.gender,
        activeProfileBloodGroup: profile.bloodGroup || '',
        activeProfileAllergies: profile.allergies || ''
      };
      
      setUser(updatedUser);
      if (onProfileSwitched) {
        onProfileSwitched(profile);
      }
      onClose();
    } catch (err: any) {
      console.error('Error switching profile:', err);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileForm.name || !newProfileForm.age) {
      setError('Please provide full name and age for the dependent profile.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const newId = `fam-${Date.now()}`;
      const randomColor = AVATAR_COLORS[storedProfiles.length % AVATAR_COLORS.length];
      
      // Auto-generate or use entered 4-6 digit access code
      const generatedCode = newProfileForm.accessCode?.trim() || Math.floor(1000 + Math.random() * 9000).toString();

      const newProfile: FamilyProfile = {
        id: newId,
        name: newProfileForm.name.trim(),
        relationship: (newProfileForm.relationship as any) || 'Child',
        gender: (newProfileForm.gender as any) || 'Male',
        age: newProfileForm.age,
        phone: user?.phone || '',
        bloodGroup: newProfileForm.bloodGroup?.trim(),
        allergies: newProfileForm.allergies?.trim(),
        chronicConditions: newProfileForm.chronicConditions?.trim(),
        accessCode: generatedCode,
        avatarColor: randomColor
      };

      const updatedList = [...storedProfiles, newProfile];

      // Update in user context and Firestore if user doc exists
      const targetLabId = lab?.id || 'lab-1';
      if (user?.id) {
        try {
          await updateDoc(doc(db, 'labs', targetLabId, 'patients', user.id), {
            familyProfiles: updatedList
          });
        } catch (dbErr) {
          // Fallback if global patients
          try {
            await setDoc(doc(db, 'patients', user.id), { familyProfiles: updatedList }, { merge: true });
          } catch {}
        }
      }

      const updatedUser = {
        ...user,
        familyProfiles: updatedList,
        activeFamilyProfileId: newProfile.id,
        activeProfileName: newProfile.name,
        activeProfileRelationship: newProfile.relationship,
        activeProfileAge: newProfile.age,
        activeProfileGender: newProfile.gender,
        activeProfileBloodGroup: newProfile.bloodGroup || '',
        activeProfileAllergies: newProfile.allergies || ''
      };

      setUser(updatedUser);
      setIsAddingNew(false);
      setNewProfileForm({
        name: '',
        relationship: 'Child',
        gender: 'Male',
        age: '',
        bloodGroup: '',
        allergies: '',
        chronicConditions: '',
        accessCode: ''
      });

      if (onProfileSwitched) {
        onProfileSwitched(newProfile);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save family dependent.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAccessCode = async (profileId: string) => {
    if (!newAccessCodeInput || newAccessCodeInput.length < 4) {
      setError('Access code must be at least 4 digits.');
      return;
    }

    setSaving(true);
    try {
      const updatedList = storedProfiles.map(p => {
        if (p.id === profileId) {
          return { ...p, accessCode: newAccessCodeInput.trim() };
        }
        return p;
      });

      const targetLabId = lab?.id || 'lab-1';
      if (user?.id) {
        try {
          await updateDoc(doc(db, 'labs', targetLabId, 'patients', user.id), {
            familyProfiles: updatedList
          });
        } catch {}
      }

      setUser({
        ...user,
        familyProfiles: updatedList
      });

      setEditingCodeProfileId(null);
      setNewAccessCodeInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to update access code.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Family & Dependent Accounts</h3>
              <p className="text-xs text-slate-500">Manage separate medical dossiers under {user?.phone || 'your phone'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Existing Profiles List */}
        {!isAddingNew ? (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select Active Health Profile:
            </div>

            <div className="space-y-2">
              {storedProfiles.map(prof => {
                const isActive = prof.id === currentActiveProfileId;
                const isChild = prof.relationship === 'Child';
                const isElderly = prof.relationship === 'Elderly Dependent' || prof.relationship === 'Parent';

                return (
                  <div
                    key={prof.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectProfile(prof)}
                      className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                    >
                      <div className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-bold text-base shadow-2xs ${prof.avatarColor || 'bg-teal-600'}`}>
                        {isChild ? <Baby className="w-5 h-5" /> : isElderly ? <Heart className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{prof.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {prof.relationship}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>{prof.gender} • {prof.age} yrs</span>
                          {prof.bloodGroup && (
                            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              {prof.bloodGroup}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Access Code Pill / Change button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {editingCodeProfileId === prof.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            maxLength={8}
                            value={newAccessCodeInput}
                            onChange={e => setNewAccessCodeInput(e.target.value)}
                            placeholder="New Code"
                            className="w-20 px-2 py-1 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateAccessCode(prof.id)}
                            disabled={saving}
                            className="p-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCodeProfileId(null)}
                            className="p-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCodeProfileId(prof.id);
                            setNewAccessCodeInput(prof.accessCode || '');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                          title="Click to change independent login code"
                        >
                          <Key className="w-3 h-3 text-slate-500" />
                          <span>Code: <strong>{prof.accessCode || '8888'}</strong></span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-teal-500 text-slate-700 hover:text-teal-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Child, Parent or Elderly Family Member</span>
              </button>
            </div>
          </div>
        ) : (
          /* Add New Profile Form */
          <form onSubmit={handleCreateProfile} className="space-y-4">
            <div className="text-xs font-bold text-teal-800 bg-teal-50 p-2.5 rounded-xl border border-teal-200">
              Create Independent Medical Dossier for Dependent
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Legal Name *</label>
              <input
                type="text"
                required
                value={newProfileForm.name}
                onChange={e => setNewProfileForm({ ...newProfileForm, name: e.target.value })}
                placeholder="e.g. Marie Claire Eyenga"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Relationship *</label>
                <select
                  value={newProfileForm.relationship}
                  onChange={e => setNewProfileForm({ ...newProfileForm, relationship: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Child">Child</option>
                  <option value="Elderly Dependent">Elderly Dependent</option>
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Other">Other Dependent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Gender & Age *</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newProfileForm.gender}
                    onChange={e => setNewProfileForm({ ...newProfileForm, gender: e.target.value as any })}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <input
                    type="number"
                    required
                    min="0"
                    max="120"
                    value={newProfileForm.age}
                    onChange={e => setNewProfileForm({ ...newProfileForm, age: e.target.value })}
                    placeholder="Age"
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Blood Group (Optional)</label>
                <input
                  type="text"
                  value={newProfileForm.bloodGroup}
                  onChange={e => setNewProfileForm({ ...newProfileForm, bloodGroup: e.target.value })}
                  placeholder="e.g. O+, A-, B+"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Personal Access Code</label>
                <input
                  type="text"
                  value={newProfileForm.accessCode}
                  onChange={e => setNewProfileForm({ ...newProfileForm, accessCode: e.target.value })}
                  placeholder="e.g. 4521 (Leave blank to auto-generate)"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Allergies / Special Conditions</label>
              <input
                type="text"
                value={newProfileForm.allergies}
                onChange={e => setNewProfileForm({ ...newProfileForm, allergies: e.target.value })}
                placeholder="e.g. Penicillin allergy, diabetic, asthmatic..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Creating Profile...' : 'Save & Switch To Profile'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default FamilyProfileSwitcherModal;
