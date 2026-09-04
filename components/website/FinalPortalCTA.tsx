import React from 'react';
import { ArrowRight, LogIn, Activity, Sparkles, ShieldCheck } from 'lucide-react';

interface FinalPortalCTAProps {
  onGoToPortal: () => void;
}

export const FinalPortalCTA: React.FC<FinalPortalCTAProps> = ({ onGoToPortal }) => {
  return (
    <section className="py-24 bg-gradient-to-b from-[#07111F] via-[#0B1F3A] to-[#07111F] relative overflow-hidden border-t border-white/5 text-center">
      {/* Intense Glowing Radial Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#1677FF]/30 via-[#00A6A6]/20 to-[#20C997]/25 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-8">
        {/* Central Glowing Icon */}
        <div className="inline-block relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1677FF] via-[#00A6A6] to-[#20C997] p-1 shadow-2xl shadow-[#1677FF]/40 mx-auto animate-pulse">
            <div className="w-full h-full bg-[#07111F] rounded-[22px] flex items-center justify-center">
              <Activity className="w-10 h-10 text-[#20C997] stroke-[2.5]" />
            </div>
          </div>
          <div className="absolute -inset-3 rounded-3xl border border-[#20C997]/30 animate-ping pointer-events-none opacity-40" />
        </div>

        {/* Big Central Headings */}
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
            Ready to enter NanoLabs?
          </h2>
          <p className="text-sm sm:text-lg text-[#AAB7C7] max-w-xl mx-auto leading-relaxed">
            Access your medical laboratory, patient results, or partner environment through the live NanoLabs Portal.
          </p>
        </div>

        {/* Big Unmissable CTA Button */}
        <div className="pt-2">
          <button
            onClick={onGoToPortal}
            id="final-cta-go-to-portal-btn"
            className="px-10 py-5 rounded-2xl bg-gradient-to-r from-[#1677FF] via-[#00A6A6] to-[#20C997] text-white font-black text-base sm:text-lg shadow-2xl shadow-[#1677FF]/40 hover:shadow-[#00A6A6]/50 hover:scale-105 active:scale-95 transition-all duration-200 inline-flex items-center gap-3 cursor-pointer group"
          >
            <LogIn className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            <span className="tracking-wider uppercase">CONTINUE TO PORTAL</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Minor Tagline */}
        <div className="text-xs text-[#AAB7C7] flex items-center justify-center gap-2 pt-4">
          <ShieldCheck className="w-4 h-4 text-[#20C997]" />
          <span>Secure Clinical Authentication • Built in Cameroon 🇨🇲</span>
        </div>
      </div>
    </section>
  );
};

export default FinalPortalCTA;
