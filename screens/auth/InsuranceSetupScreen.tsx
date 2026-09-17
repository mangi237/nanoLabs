import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Building2, 
  CreditCard, 
  AlertCircle,
  Percent,
  UserCheck
} from 'lucide-react';
import { InsuranceProvider } from '../../types';

export const CEMAC_INSURERS: InsuranceProvider[] = [
  { id: 'ascoma', code: 'ASCOMA', name: 'Ascoma Cameroun', fullName: 'Ascoma Assurances Cameroun', coverageTiers: [{ tier: 'Standard', defaultPercent: 80 }, { tier: 'Executive', defaultPercent: 90 }], requiresPriorAuthorization: false },
  { id: 'activa', code: 'ACTIVA', name: 'Activa Assurances', fullName: 'Activa Assurances Groupe', coverageTiers: [{ tier: 'Standard', defaultPercent: 80 }], requiresPriorAuthorization: false },
  { id: 'sanlam', code: 'SANLAM', name: 'Sanlam Cameroun', fullName: 'Sanlam Saham Assurances', coverageTiers: [{ tier: 'Standard', defaultPercent: 80 }], requiresPriorAuthorization: false },
  { id: 'axa', code: 'AXA', name: 'AXA Assurances', fullName: 'AXA Assurances Cameroun', coverageTiers: [{ tier: 'Gold', defaultPercent: 85 }], requiresPriorAuthorization: false },
  { id: 'gmc', code: 'GMC', name: 'GMC Assurances', fullName: 'GMC Assurances S.A.', coverageTiers: [{ tier: 'Standard', defaultPercent: 80 }], requiresPriorAuthorization: false },
  { id: 'chanas', code: 'CHANAS', name: 'Chanas Assurances', fullName: 'Chanas Assurances Cameroun', coverageTiers: [{ tier: 'Standard', defaultPercent: 75 }], requiresPriorAuthorization: false },
  { id: 'zenithe', code: 'ZENITHE', name: 'Zenithe Insurance', fullName: 'Zenithe Insurance S.A.', coverageTiers: [{ tier: 'Standard', defaultPercent: 80 }], requiresPriorAuthorization: false },
  { id: 'beneficial', code: 'BENEFICIAL', name: 'Beneficial Life', fullName: 'Beneficial Life Insurance', coverageTiers: [{ tier: 'Standard', defaultPercent: 80 }], requiresPriorAuthorization: false }
];

interface InsuranceSetupScreenProps {
  initialPatientName?: string;
  onSave: (data: {
    hasInsurance: boolean;
    provider?: string;
    policyNumber?: string;
    policyHolder?: string;
    coveragePercent?: number;
  }) => void;
  onSkip: () => void;
}

export const InsuranceSetupScreen: React.FC<InsuranceSetupScreenProps> = ({
  initialPatientName = '',
  onSave,
  onSkip
}) => {
  const [hasInsurance, setHasInsurance] = useState<boolean>(true);
  const [selectedInsurerId, setSelectedInsurerId] = useState<string>('ascoma');
  const [policyNumber, setPolicyNumber] = useState<string>('');
  const [policyHolder, setPolicyHolder] = useState<string>(initialPatientName);
  const [coveragePercent, setCoveragePercent] = useState<number>(80);
  const [error, setError] = useState<string>('');

  const handleInsurerChange = (insurerId: string) => {
    setSelectedInsurerId(insurerId);
    const found = CEMAC_INSURERS.find((i) => i.id === insurerId);
    if (found && found.coverageTiers.length > 0) {
      setCoveragePercent(found.coverageTiers[0].defaultPercent);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasInsurance) {
      onSave({ hasInsurance: false });
      return;
    }

    if (!policyNumber.trim()) {
      setError('Please enter your insurance policy or card member number.');
      return;
    }

    const insurer = CEMAC_INSURERS.find((i) => i.id === selectedInsurerId);
    onSave({
      hasInsurance: true,
      provider: insurer?.name || 'Private Health Insurance',
      policyNumber: policyNumber.trim(),
      policyHolder: policyHolder.trim() || initialPatientName,
      coveragePercent: Math.min(100, Math.max(10, coveragePercent))
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-teal-950/5 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            Health Insurance Setup
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Add your CEMAC health insurance policy for co-pay splitting.
          </p>
        </div>

        {/* Verified at Lab Intake Banner */}
        <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#0D3B38]">Verified at Lab Intake</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#0F766E] border border-teal-300">
                0% Fee on Insurance
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Physical membership cards are authenticated manually by the lab cashier at counter intake. The 5% nanoLabs record fee applies strictly to your patient out-of-pocket portion. TVA is always exempt.
            </p>
          </div>
        </div>

        {/* Insurance Toggle */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setHasInsurance(true)}
            className={`min-h-[44px] py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              hasInsurance ? 'bg-white text-[#0D3B38] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#0F766E]" />
            <span>I Have Insurance</span>
          </button>
          <button
            type="button"
            onClick={() => setHasInsurance(false)}
            className={`min-h-[44px] py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              !hasInsurance ? 'bg-white text-[#0D3B38] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-slate-500" />
            <span>100% Out-of-Pocket</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {hasInsurance ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Insurer Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0B1F1D] uppercase tracking-wide">
                Select CEMAC Health Insurer *
              </label>
              <select
                value={selectedInsurerId}
                onChange={(e) => handleInsurerChange(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-hidden focus:border-teal-500"
              >
                {CEMAC_INSURERS.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name} &bull; {ins.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Policy Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0B1F1D] uppercase tracking-wide">
                Policy / Member Card Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ASC-2026-992014"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            {/* Policyholder Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0B1F1D] uppercase tracking-wide">
                Principal Policyholder Name
              </label>
              <input
                type="text"
                placeholder="Name as printed on insurance card"
                value={policyHolder}
                onChange={(e) => setPolicyHolder(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            {/* Coverage Percentage */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-[#0B1F1D] uppercase tracking-wide">
                  Guaranteed Coverage Ratio
                </label>
                <span className="font-extrabold text-[#0F766E]">{coveragePercent}% Insurer Coverage</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={coveragePercent}
                  onChange={(e) => setCoveragePercent(Number(e.target.value))}
                  className="w-full accent-[#0F766E] cursor-pointer"
                />
                <span className="min-w-[48px] px-2 py-1 text-center bg-slate-100 rounded-lg text-xs font-bold font-mono">
                  {coveragePercent}%
                </span>
              </div>
              <p className="text-[11px] text-[#6B7F7D]">
                Typical CEMAC coverage is 80% (you pay 20% + 5% nanoLabs fee on your 20%).
              </p>
            </div>

            {/* Submit / Skip Buttons */}
            <div className="pt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onSkip}
                className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Skip for now
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-teal-900/10 cursor-pointer hover:from-[#0D3B38] hover:to-[#0F766E]"
              >
                <span>Save Insurance & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center py-4">
            <p className="text-xs text-slate-600">
              You will pay the standard lab test tariff at 100% out-of-pocket directly to the laboratory cashier via cash, MTN Mobile Money, or Orange Money.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleFormSubmit}
                className="min-h-[44px] px-6 py-2.5 bg-[#0F766E] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Proceed with Self-Pay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsuranceSetupScreen;
