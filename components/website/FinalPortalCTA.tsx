import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LogIn, Activity, ShieldCheck } from 'lucide-react';

interface FinalPortalCTAProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

export const FinalPortalCTA: React.FC<FinalPortalCTAProps> = ({ onGoToPortal }) => {
  return (
    <section className="py-24 bg-gradient-to-b from-white via-nl-off to-white relative overflow-hidden text-center">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-nl-teal/15 via-nl-light/10 to-nl-blue/10 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-8">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block relative"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-nl-deep via-nl-teal to-nl-light p-1 shadow-2xl shadow-teal-900/25 mx-auto">
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
              <Activity className="w-10 h-10 text-nl-teal" strokeWidth={2.5} />
            </div>
          </div>
          <div className="absolute -inset-3 rounded-3xl border border-nl-teal/30 animate-ping pointer-events-none opacity-40" />
        </motion.div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-nl-ink tracking-tight font-display">
            Ready to enter nanoLabs?
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Patients, doctors, and laboratories each have their own portal. One hub behind them all.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onGoToPortal('patient')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-nl-deep via-nl-teal to-nl-light text-white font-black text-sm shadow-2xl shadow-teal-900/25 inline-flex items-center justify-center gap-3 cursor-pointer group"
          >
            <LogIn className="w-5 h-5" />
            <span>Patient portal</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onGoToPortal('doctor')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-slate-200 text-nl-ink font-bold text-sm hover:border-nl-teal/40 hover:bg-nl-off transition-all inline-flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Doctor portal</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onGoToPortal('lab')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-slate-200 text-nl-ink font-bold text-sm hover:border-nl-teal/40 hover:bg-nl-off transition-all inline-flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Laboratory portal</span>
          </motion.button>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-center gap-2 pt-4">
          <ShieldCheck className="w-4 h-4 text-nl-teal" />
          <span>Secure. Mobile-first. Built in Cameroon.</span>
        </div>
      </div>
    </section>
  );
};

export default FinalPortalCTA;