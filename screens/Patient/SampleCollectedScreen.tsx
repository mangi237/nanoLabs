import React from 'react';
import { ArrowLeft, Check, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

interface SampleCollectedScreenProps {
  onBack: () => void;
  onViewJourney: () => void;
}

export const SampleCollectedScreen: React.FC<SampleCollectedScreenProps> = ({
  onBack,
  onViewJourney
}) => {
  return (
    <div className="min-h-[75vh] flex flex-col justify-between max-w-md mx-auto py-4 px-4 text-slate-900 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Tracking
        </h1>
      </div>

      {/* Central Pulsing Check Icon & Message */}
      <div className="my-auto py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#E0F2F1] border-4 border-[#80CBC4] flex items-center justify-center text-[#006978] shadow-xl animate-pulse">
            <div className="w-16 h-16 rounded-full bg-[#006978] text-white flex items-center justify-center shadow-md">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-[#006978]/30 animate-ping" />
        </div>

        <div className="space-y-2 max-w-xs pt-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Sample collected!
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            Your sample has been collected. We'll now take it to the lab.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-6">
        <button
          onClick={onViewJourney}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>View journey</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
