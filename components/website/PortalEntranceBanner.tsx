import React from 'react';
import { ArrowRight, LogIn, Sparkles, Activity, ShieldCheck } from 'lucide-react';

interface PortalEntranceBannerProps {
  onGoToPortal: () => void;
}

export const PortalEntranceBanner: React.FC<PortalEntranceBannerProps> = ({ onGoToPortal }) => {
  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 z-20">
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0A2C27] via-[#0EA5E9]/20 to-[#0A2C27] border border-white/20 p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-12 h-12 rounded-xl bg-[#0EA5E9]/20 border border-[#0EA5E9]/30 flex items-center justify-center text-[#2DD4BF] shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              Ready to enter NanoLabs?
            </h4>
            <p className="text-xs text-[#93B4AF]">
              Access your medical laboratory workspace, physician portal, or patient results center.
            </p>
          </div>
        </div>

        <button
          onClick={onGoToPortal}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0EA5E9] via-[#14B8A6] to-[#2DD4BF] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#0EA5E9]/25 hover:shadow-xl hover:shadow-[#14B8A6]/35 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
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
