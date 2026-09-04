import React from 'react';
import { ArrowRight, LogIn, Sparkles, Activity, ShieldCheck } from 'lucide-react';

interface PortalEntranceBannerProps {
  onGoToPortal: () => void;
}

export const PortalEntranceBanner: React.FC<PortalEntranceBannerProps> = ({ onGoToPortal }) => {
  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 z-20">
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0B1F3A] via-[#1677FF]/20 to-[#0B1F3A] border border-white/20 p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-12 h-12 rounded-xl bg-[#1677FF]/20 border border-[#1677FF]/30 flex items-center justify-center text-[#20C997] shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              Ready to enter NanoLabs?
            </h4>
            <p className="text-xs text-[#AAB7C7]">
              Access your medical laboratory workspace, physician portal, or patient results center.
            </p>
          </div>
        </div>

        <button
          onClick={onGoToPortal}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#00A6A6] to-[#20C997] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#1677FF]/25 hover:shadow-xl hover:shadow-[#00A6A6]/35 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <LogIn className="w-4 h-4" />
          <span>Continue to NanoLabs Portal</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PortalEntranceBanner;
