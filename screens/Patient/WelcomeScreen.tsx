import React from 'react';
import { Activity, ArrowRight, ShieldCheck, Heart, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSkipToHome?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onSkipToHome }) => {
  return (
    <div className="min-h-[85vh] flex flex-col justify-between max-w-md mx-auto py-8 px-4 text-slate-900 animate-in fade-in duration-300">
      {/* Top Header Logo */}
      <div className="pt-4 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#006978] to-[#0097A7] flex items-center justify-center text-white shadow-sm">
          <Activity className="w-5 h-5 text-cyan-200" />
        </div>
        <div>
          <span className="font-black text-xl tracking-tight text-[#006978]">
            Nano<span className="text-[#00838F]">Labs</span>
          </span>
          <span className="block text-[11px] font-semibold text-slate-500 tracking-wide">
            Better Health. Closer.
          </span>
        </div>
      </div>

      {/* Hero Headline & Value Proposition */}
      <div className="my-auto py-10 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Your health matters.<br />
          <span className="text-[#006978]">We make it easy.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
          Book tests, track your sample, get your results and connect with your doctor — all in one place.
        </p>

        {/* Feature Highlights */}
        <div className="pt-4 space-y-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#E0F2F1] text-[#006978] flex items-center justify-center shrink-0">
              ✓
            </div>
            <span>Home sample collection with GPS tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#E0F2F1] text-[#006978] flex items-center justify-center shrink-0">
              ✓
            </div>
            <span>Accredited CEMAC laboratories with fast turnaround</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#E0F2F1] text-[#006978] flex items-center justify-center shrink-0">
              ✓
            </div>
            <span>Digital prescriptions & direct teleconsultation</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA with Subtle Wave Graphics */}
      <div className="space-y-4 pt-6">
        <button
          onClick={onGetStarted}
          className="w-full py-4 px-6 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#006978]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {onSkipToHome && (
          <button
            onClick={onSkipToHome}
            className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            I already have an account &bull; Go to Home
          </button>
        )}

        <div className="text-center text-[11px] text-slate-400">
          Protected by ONMC clinical data privacy standards
        </div>
      </div>
    </div>
  );
};
