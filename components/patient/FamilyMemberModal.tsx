import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Users, 
  ShieldCheck, 
  AlertCircle, 
  Heart, 
  Check, 
  Plus, 
  Trash2,
  Calendar,
  Activity
} from 'lucide-react';
import { FamilyMemberProfile, FamilyRelationship } from '../../types';
import { RELATIONSHIP_LABELS } from '../../services/familyProfileServices';
import { CEMAC_INSURERS } from '../../screens/auth/InsuranceSetupScreen';

interface FamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<FamilyMemberProfile, 'id' | 'createdAt'>) => void;
  initialData?: FamilyMemberProfile | null;
  primaryUserName?: string;
  primaryUserInsurance?: string;
}

const COMMON_ALLERGIES = [
  'Pénicilline',
  'Sulfamides',
  'Arachides / Cacahuètes',
  'Latex',
  'Produits Iodés',
  'Aspirine / AINS'
];

const COMMON_CONDITIONS = [
  'Hypertension Artérielle (HTA)',
  'Diabète Type 2',
  'Drépanocytose (Trait AS / SS)',
  'Asthme',
  'Insuffisance Rénale Chronique',
  'Cardiopathie'
];

export const FamilyMemberModal: React.FC<FamilyMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  primaryUserName = 'Mme. Claire Ngo',
  primaryUserInsurance = 'Ascoma Assurances'
}) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [relationship, setRelationship] = useState<FamilyRelationship>(initialData?.relationship || 'child');
  const [gender, setGender] = useState<'female' | 'male' | 'other'>(initialData?.gender || 'female');
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.dateOfBirth || '');
  const [age, setAge] = useState<number>(initialData?.age || 8);
  const [bloodGroup, setBloodGroup] = useState(initialData?.bloodGroup || 'O+');
  const [nationalId, setNationalId] = useState(initialData?.nationalId || '');
  
  // Allergies
  const [allergies, setAllergies] = useState<string[]>(initialData?.allergies || []);
  const [customAllergy, setCustomAllergy] = useState('');

  // Chronic conditions
  const [chronicConditions, setChronicConditions] = useState<string[]>(initialData?.chronicConditions || []);
  const [customCondition, setCustomCondition] = useState('');

  // Insurance
  const [insuranceMode, setInsuranceMode] = useState<'ayant_droit' | 'own_policy' | 'none'>(
    initialData?.isDependentOnPrimaryInsurance ? 'ayant_droit' : initialData?.insuranceProvider ? 'own_policy' : 'ayant_droit'
  );
  const [ownProvider, setOwnProvider] = useState(initialData?.insuranceProvider || CEMAC_INSURERS[0]?.name || 'Ascoma Assurances');
  const [ownPolicyNumber, setOwnPolicyNumber] = useState(initialData?.insurancePolicyNumber || '');
  const [ownCoveragePercent, setOwnCoveragePercent] = useState(initialData?.insuranceCoveragePercent || 80);

  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateOfBirth(val);
    if (val) {
      const birth = new Date(val);
      const now = new Date();
      let calculatedAge = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setAge(Math.max(0, calculatedAge));
    }
  };

  const toggleAllergy = (item: string) => {
    if (allergies.includes(item)) {
      setAllergies(allergies.filter((a) => a !== item));
    } else {
      setAllergies([...allergies, item]);
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const toggleCondition = (item: string) => {
    if (chronicConditions.includes(item)) {
      setChronicConditions(chronicConditions.filter((c) => c !== item));
    } else {
      setChronicConditions([...chronicConditions, item]);
    }
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !chronicConditions.includes(customCondition.trim())) {
      setChronicConditions([...chronicConditions, customCondition.trim()]);
      setCustomCondition('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please provide the full name of the family member.');
      return;
    }

    let provider = '';
    let policyNumber = '';
    let coveragePercent = 0;
    let isAyantDroit = false;

    if (insuranceMode === 'ayant_droit') {
      provider = primaryUserInsurance;
      policyNumber = `ASC-2026-DEP-${Math.floor(1000 + Math.random() * 9000)}`;
      coveragePercent = 80;
      isAyantDroit = true;
    } else if (insuranceMode === 'own_policy') {
      provider = ownProvider;
      policyNumber = ownPolicyNumber || `POL-${Math.floor(100000 + Math.random() * 900000)}`;
      coveragePercent = ownCoveragePercent;
      isAyantDroit = false;
    }

    const payload: Omit<FamilyMemberProfile, 'id' | 'createdAt'> = {
      primaryAccountId: 'patient_demo',
      fullName: fullName.trim(),
      relationship,
      relationshipLabel: RELATIONSHIP_LABELS[relationship] || relationship,
      dateOfBirth: dateOfBirth || undefined,
      age: Number(age) || 0,
      gender,
      bloodGroup,
      nationalId: nationalId.trim() || undefined,
      allergies,
      chronicConditions,
      insuranceProvider: provider || undefined,
      insurancePolicyNumber: policyNumber || undefined,
      insuranceCoveragePercent: coveragePercent,
      isDependentOnPrimaryInsurance: isAyantDroit,
      notes: notes.trim() || undefined,
      avatarColor: relationship === 'mother' || relationship === 'grandparent' ? 'indigo' : (relationship === 'child' || relationship === 'son' || relationship === 'daughter') ? 'amber' : 'teal'
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0F766E]/10 via-teal-50 to-transparent border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0D3B38]">
                {initialData ? 'Edit Family Account Profile' : 'Add Family Member Account'}
              </h2>
              <p className="text-xs text-[#6B7F7D]">
                Independent medical record for your child, elderly parent, or spouse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Identification */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Personal Identity & Relationship
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Relationship */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Relationship to You *
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as FamilyRelationship)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[#0B1F1D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  <option value="child">Child (Enfant)</option>
                  <option value="son">Son (Fils)</option>
                  <option value="daughter">Daughter (Fille)</option>
                  <option value="mother">Mother (Mère âgée)</option>
                  <option value="father">Father (Père âgé)</option>
                  <option value="spouse">Spouse (Conjoint / Conjointe)</option>
                  <option value="grandparent">Grandparent (Grand-parent)</option>
                  <option value="sibling">Sibling (Frère / Sœur)</option>
                  <option value="other">Other Dependent (Autre Dépendant)</option>
                </select>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g., Mme. Ngo Madeleine or Junior Kamdem"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[#0B1F1D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={handleDobChange}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#0B1F1D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Age (years) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  required
                  value={age}
                  onChange={(e) => setAge(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#0B1F1D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'female' | 'male' | 'other')}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#0B1F1D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  <option value="female">Female (Féminin)</option>
                  <option value="male">Male (Masculin)</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Blood Group (Groupe Sanguin)
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#0B1F1D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  <option value="O+">O Rhésus Positif (O+)</option>
                  <option value="A+">A Rhésus Positif (A+)</option>
                  <option value="B+">B Rhésus Positif (B+)</option>
                  <option value="AB+">AB Rhésus Positif (AB+)</option>
                  <option value="O-">O Rhésus Négatif (O-)</option>
                  <option value="A-">A Rhésus Négatif (A-)</option>
                  <option value="B-">B Rhésus Négatif (B-)</option>
                  <option value="AB-">AB Rhésus Négatif (AB-)</option>
                  <option value="Inconnu">Unknown / À déterminer</option>
                </select>
              </div>

              {/* National ID / Birth Certificate */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  CNI / Birth Certificate # (Optional)
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="e.g., CNI-1982-019382 or ACTE-2018-883"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#0B1F1D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
            </div>
          </div>

          {/* Health Insurance Setup */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Health Insurance & Coverage (Tiers Payant)
              </h3>
              <span className="text-[11px] font-bold text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                TVA Exempt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setInsuranceMode('ayant_droit')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  insuranceMode === 'ayant_droit'
                    ? 'border-[#0F766E] bg-teal-50/70 ring-2 ring-[#0F766E]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="text-xs font-bold text-[#0D3B38]">Ayant-Droit</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Attached to primary insurance ({primaryUserInsurance})
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInsuranceMode('own_policy')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  insuranceMode === 'own_policy'
                    ? 'border-[#0F766E] bg-teal-50/70 ring-2 ring-[#0F766E]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="text-xs font-bold text-[#0D3B38]">Personal Policy</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Separate insurance provider & matricule
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInsuranceMode('none')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  insuranceMode === 'none'
                    ? 'border-[#0F766E] bg-teal-50/70 ring-2 ring-[#0F766E]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="text-xs font-bold text-[#0D3B38]">Cash / Direct</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  100% out-of-pocket at cashier desk
                </p>
              </button>
            </div>

            {insuranceMode === 'ayant_droit' && (
              <div className="p-3.5 bg-teal-50/80 rounded-2xl border border-teal-100 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <div className="text-xs text-[#0D3B38]">
                  <p className="font-semibold">
                    Dependent Coverage via Primary Subscriber: {primaryUserName}
                  </p>
                  <p className="text-[11px] text-[#6B7F7D] mt-0.5">
                    Lab invoices will split 80% covered by {primaryUserInsurance} and 20% patient co-pay. The 5% nanoLabs record fee applies strictly to the patient's co-pay portion.
                  </p>
                </div>
              </div>
            )}

            {insuranceMode === 'own_policy' && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Provider (Assureur CEMAC)
                    </label>
                    <select
                      value={ownProvider}
                      onChange={(e) => setOwnProvider(e.target.value)}
                      className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-[#0B1F1D]"
                    >
                      {CEMAC_INSURERS.map((ins) => (
                        <option key={ins.code} value={ins.name}>
                          {ins.name} ({ins.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Policy / Matricule Number
                    </label>
                    <input
                      type="text"
                      value={ownPolicyNumber}
                      onChange={(e) => setOwnPolicyNumber(e.target.value)}
                      placeholder="e.g., ACT-99201-B"
                      className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-[#0B1F1D]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Coverage Level: {ownCoveragePercent}%
                  </label>
                  <div className="flex gap-2">
                    {[70, 80, 90, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setOwnCoveragePercent(pct)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          ownCoveragePercent === pct
                            ? 'bg-[#0F766E] text-white'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Allergies & Conditions */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Clinical History & Safety Notes
            </h3>

            {/* Allergies */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Known Drug & Food Allergies
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_ALLERGIES.map((allergy) => {
                  const isSelected = allergies.includes(allergy);
                  return (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{allergy}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  placeholder="Other allergy..."
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomAllergy();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomAllergy}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Chronic Conditions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pre-existing Conditions / Pathologies
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_CONDITIONS.map((cond) => {
                  const isSelected = chronicConditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{cond}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  placeholder="Other pathology..."
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomCondition();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomCondition}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Clinical Context & Instructions for Biologist / Phlebotomist
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Needs pediatric butterfly needle for blood draw; elderly patient requires morning appointment before insulin injection."
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#0B1F1D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white text-xs font-bold rounded-xl shadow-md hover:from-[#0D3B38] hover:to-[#0F766E] transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Save Changes' : 'Create Dependent Account'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
