import React, { useState } from 'react';
import { ArrowLeft, Shield, CheckCircle2, Calendar, Droplet, User, Edit3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';

interface MyInsuranceScreenProps {
  onBack: () => void;
  onUpdateInfo?: () => void;
}

export const MyInsuranceScreen: React.FC<MyInsuranceScreenProps> = ({ onBack, onUpdateInfo }) => {
  const { user } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();

  const providerName = (activeProfile as any)?.insuranceProvider || user?.insuranceProvider || 'Activa Assurances (NHIS Partner)';
  const policyNumber = (activeProfile as any)?.insurancePolicyNumber || user?.insurancePolicyNumber || 'POL-884920';

  const [dob, setDob] = useState(() => `${activeProfile.age || 30} years old`);
  const [gender, setGender] = useState(activeProfile?.gender || user?.gender || 'Adult');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Diagnostic Health Insurance
          </h1>
          <p className="text-[11px] text-slate-500">
            Dossier: <strong className="text-slate-800">{activeProfile.fullName}</strong> {isDependentActive && `(${activeProfile.relationshipLabel})`}
          </p>
        </div>
      </div>

      {/* Active Insurance Card */}
      <div className="p-6 bg-gradient-to-br from-[#004D56] via-[#006978] to-[#00838F] text-white rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-200" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white tracking-tight">{providerName}</h3>
              <p className="text-xs text-cyan-100/90 font-mono">Policy No: {policyNumber}</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-400 text-slate-950 text-xs font-black rounded-full shadow-xs">
            Active
          </span>
        </div>

        <div className="mt-8 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-cyan-100">
          <span>Tiers-Payant Coverage: <strong>80%</strong></span>
          <span>Verified &bull; ONMC Network</span>
        </div>
      </div>

      {/* Medical Profile Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            Medical profile
          </h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold text-[#006978] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs divide-y divide-slate-100">
          <div className="py-2.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">Date of birth</span>
            {isEditing ? (
              <input
                type="text"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="px-2 py-1 bg-slate-50 border rounded text-xs font-bold"
              />
            ) : (
              <span className="font-extrabold text-slate-900">{dob}</span>
            )}
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">Gender</span>
            {isEditing ? (
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="px-2 py-1 bg-slate-50 border rounded text-xs font-bold"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <span className="font-extrabold text-slate-900">{gender}</span>
            )}
          </div>

          <div className="py-2.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">Blood group</span>
            {isEditing ? (
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="px-2 py-1 bg-slate-50 border rounded text-xs font-bold"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
              </select>
            ) : (
              <span className="font-extrabold text-slate-900">{bloodGroup}</span>
            )}
          </div>
        </div>
      </div>

      {/* Update Info Action */}
      <div className="pt-2">
        <button
          onClick={() => {
            setIsEditing(false);
            if (onUpdateInfo) onUpdateInfo();
          }}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Update information</span>
        </button>
      </div>
    </div>
  );
};
