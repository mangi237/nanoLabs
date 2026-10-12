import React from 'react';
import { ArrowLeft, Check, Sparkles, Shield, Clock, HeartHandshake, Building2 } from 'lucide-react';

interface HealthPackageScreenProps {
  onBack: () => void;
  onViewAvailableLabs: (packageTests: string[]) => void;
}

export const HealthPackageScreen: React.FC<HealthPackageScreenProps> = ({
  onBack,
  onViewAvailableLabs
}) => {
  const includedTests = [
    { name: 'Complete Blood Count (CBC)', desc: 'Full hematological screening' },
    { name: 'Liver Function Test (LFT)', desc: 'SGOT, SGPT, Bilirubin enzymes' },
    { name: 'Kidney Function Test (KFT)', desc: 'Serum Urea & Creatinine' },
    { name: 'Lipid Profile', desc: 'Cholesterol, HDL, LDL, Triglycerides' },
    { name: 'Urine Analysis', desc: 'Protein, glucose & microscopic exam' }
  ];

  const handleProceed = () => {
    onViewAvailableLabs(includedTests.map(t => t.name));
  };

  return (
    <div className="max-w-2xl mx-auto py-3 px-2 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Comprehensive Health Check Package
        </h1>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E0F2F1] text-[#006978] rounded-full text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Parameter Health Screen</span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          A complete overview of your health. Evaluates cardiovascular, hepatic, renal, and hematological health through accredited CEMAC laboratory benches.
        </p>
      </div>

      {/* Lab Pricing Notice Card */}
      <div className="p-4 bg-gradient-to-br from-[#E0F2F1]/60 to-[#F0FDF4] border border-[#80CBC4] rounded-2xl shadow-xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-xs font-black uppercase tracking-wider text-[#006978]">Laboratories Set Package Tariffs</span>
          <p className="text-xs text-slate-600">
            Select this bundle and choose your lab to compare their discounted package fee and distance courier rate.
          </p>
        </div>
        <Building2 className="w-6 h-6 text-[#006978] shrink-0 ml-3" />
      </div>

      {/* What's included checklist */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900">
          What's included ({includedTests.length} investigations)
        </h3>
        <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          {includedTests.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs text-slate-800">
              <div className="w-5 h-5 rounded-full bg-[#E0F2F1] text-[#006978] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900">{item.name}</span>
                <p className="text-[11px] text-slate-500 font-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-2">
        <button
          onClick={handleProceed}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Building2 className="w-4 h-4" />
          <span>Choose Lab to View Package Tariff</span>
        </button>
      </div>
    </div>
  );
};
