import React from 'react';
import { ArrowRight, LogIn, Activity, ShieldCheck } from 'lucide-react';

interface FinalPortalCTAProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

export const FinalPortalCTA: React.FC<FinalPortalCTAProps> = ({ onGoToPortal }) => {
  return (
    <section className="py-24 bg-gradient-to-b from-white via-[#F8FAF9] to-white relative overflow-hidden text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#0F766E]/15 via-[#14B8A6]/12 to-[#1677FF]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-8">
        <div className="inline-block relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#0D3B38] via-[#0F766E] to-[#14B8A6] p-1 shadow-2xl shadow-teal-900/30 mx-auto">
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
              <Activity className="w-10 h-10 text-[#0F766E] stroke-[2.5]" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0B1F1D] tracking-tight">
            Ready to enter nanoLabs?
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Patients, doctors, and laboratories each have their own portal. One hub behind them all.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onGoToPortal('patient')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0D3B38] via-[#0F766E] to-[#14B8A6] text-white font-black text-sm shadow-2xl shadow-teal-900/25 hover:scale-[1.03] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-3 cursor-pointer group"
          >
            <LogIn className="w-5 h-5" />
            <span>Patient portal</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onGoToPortal('doctor')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-slate-200 text-[#0B1F1D] font-bold text-sm hover:border-teal-300 hover:bg-teal-50/40 transition-all inline-flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Doctor portal</span>
          </button>
          <button
            onClick={() => onGoToPortal('lab')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-slate-200 text-[#0B1F1D] font-bold text-sm hover:border-teal-300 hover:bg-teal-50/40 transition-all inline-flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Laboratory portal</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-center gap-2 pt-4">
          <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
          <span>Secure. Mobile-first. Built in Cameroon.</span>
        </div>
      </div>
    </section>
  );
};

export default FinalPortalCTA;