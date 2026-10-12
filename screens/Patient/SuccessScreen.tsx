import React from 'react';
import { Heart, CheckCircle2, ArrowRight } from 'lucide-react';

interface SuccessScreenProps {
  onBackToHome: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ onBackToHome }) => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-between max-w-md mx-auto py-8 px-4 text-slate-900 animate-in fade-in duration-300">
      <div />

      {/* Central Visual Icon & Message */}
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-[#E0F2F1] border-4 border-[#80CBC4] flex items-center justify-center text-[#006978] shadow-lg">
          <Heart className="w-10 h-10 fill-[#006978] text-[#006978]" />
        </div>

        <div className="space-y-2 max-w-xs pt-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Better health, closer.
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            Thanks for choosing NanoLabs. Your health journey is in good hands.
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-6">
        <button
          onClick={onBackToHome}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Back to home</span>
        </button>
      </div>
    </div>
  );
};
