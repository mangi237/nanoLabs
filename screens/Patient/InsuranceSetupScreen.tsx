import React, { useState } from 'react';
import { ArrowLeft, Shield, ShieldCheck, Check, CreditCard, ChevronDown, Sparkles } from 'lucide-react';
import { CAMEROON_INSURANCE_COMPANIES } from '../../data/cameroonInsurances';
import { useAuth } from '../../context/authContext';

interface InsuranceSetupScreenProps {
  onBack: () => void;
  onContinue: (insuranceData: { provider: string; policyNumber: string }) => void;
  onSkip: () => void;
}

export const InsuranceSetupScreen: React.FC<InsuranceSetupScreenProps> = ({
  onBack,
  onContinue,
  onSkip
}) => {
  const { user, setUser } = useAuth();
  const [provider, setProvider] = useState(user?.insuranceProvider || 'Activa Assurances');
  const [customProvider, setCustomProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState(user?.insurancePolicyNumber || '');
  const [isOther, setIsOther] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProvider = isOther ? customProvider.trim() || 'Custom Insurance' : provider;
    if (user && setUser) {
      setUser({
        ...user,
        hasInsurance: true,
        insuranceProvider: finalProvider,
        insurancePolicyNumber: policyNumber.trim() || 'POL-884920'
      });
    }
    onContinue({
      provider: finalProvider,
      policyNumber: policyNumber.trim() || 'POL-884920'
    });
  };

  return (
    <div className="max-w-md mx-auto py-4 px-4 text-slate-900 animate-in fade-in duration-300">
      {/* Back button */}
      <div className="flex items-center justify-between pb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-slate-400">Step 1 of 2</span>
      </div>

      {/* Visual Header / 3D-style Insurance card mockup */}
      <div className="my-6 p-6 rounded-3xl bg-gradient-to-br from-[#E0F2F1] via-[#F0FDF4] to-[#E0F7FA] border border-[#B2DFDB] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xs">
        <div className="w-16 h-12 rounded-2xl bg-gradient-to-br from-[#006978] to-[#00838F] shadow-lg flex items-center justify-center text-white mb-3">
          <Shield className="w-7 h-7 text-cyan-200" />
        </div>
        <div className="text-xs font-black uppercase tracking-wider text-[#006978]">
          Tiers-Payant / NHIS Direct Cover
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Save up to 80% on lab tests with approved Cameroonian caisses
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Set up your insurance
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Add your health insurance details to make booking faster and easier.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Insurance Provider Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Insurance provider
          </label>
          <div className="relative">
            <select
              value={isOther ? 'OTHER' : provider}
              onChange={(e) => {
                if (e.target.value === 'OTHER') {
                  setIsOther(true);
                } else {
                  setIsOther(false);
                  setProvider(e.target.value);
                }
              }}
              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-hidden focus:border-[#006978] focus:ring-2 focus:ring-[#006978]/20 appearance-none shadow-xs cursor-pointer"
            >
              {CAMEROON_INSURANCE_COMPANIES.map((company) => (
                <option key={company.id} value={company.name}>
                  {company.name} ({company.shortName})
                </option>
              ))}
              <option value="NHIS National Scheme">NHIS / Universal Health Coverage</option>
              <option value="OTHER">+ Other Insurance Provider</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none" />
          </div>

          {isOther && (
            <input
              type="text"
              required
              placeholder="Enter insurance company name..."
              value={customProvider}
              onChange={(e) => setCustomProvider(e.target.value)}
              className="mt-2 w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-hidden focus:border-[#006978]"
            />
          )}
        </div>

        {/* Policy Number / Matricule */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Policy number (Matricule / Card ID)
          </label>
          <input
            type="text"
            required
            placeholder="e.g. POL-123456789"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-mono text-slate-800 focus:outline-hidden focus:border-[#006978] focus:ring-2 focus:ring-[#006978]/20 shadow-xs"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Found on your physical insurance card or digital credential
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-4 space-y-3">
          <button
            type="submit"
            className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue</span>
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
};
