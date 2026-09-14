import React from 'react';
import { ArrowRight, User, Stethoscope, Building2, ShieldCheck } from 'lucide-react';

interface PortalEntranceBannerProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

export const PortalEntranceBanner: React.FC<PortalEntranceBannerProps> = ({ onGoToPortal }) => {
  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 z-20">
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xl shadow-slate-200/50 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shrink-0">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-[#0F766E]">
                Three doors, one hub
              </span>
              <span className="text-xs text-slate-500 font-medium">Cameroon & Central Africa</span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-[#0B1F1D] mt-0.5">
              Access your nanoLabs workspace
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Patients, doctors, and laboratories each have their own portal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          <button
            onClick={() => onGoToPortal('patient')}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-[#0F766E] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-xs font-bold text-[#0B1F1D]">Patient</div>
            <div className="text-[11px] text-slate-500">Book tests & track samples</div>
          </button>

          <button
            onClick={() => onGoToPortal('doctor')}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-[#0F766E] flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-xs font-bold text-[#0B1F1D]">Doctor</div>
            <div className="text-[11px] text-slate-500">Prescribe & connect</div>
          </button>

          <button
            onClick={() => onGoToPortal('lab')}
            className="p-3.5 rounded-2xl bg-[#0D3B38] hover:bg-[#0F766E] text-white text-left transition-all group cursor-pointer shadow-md shadow-teal-950/20"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-teal-200 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-xs font-bold text-white">Laboratory</div>
            <div className="text-[11px] text-teal-200">Invoices, cashier, reports</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortalEntranceBanner;