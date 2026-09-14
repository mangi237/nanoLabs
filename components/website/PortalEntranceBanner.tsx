import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, User, Stethoscope, Building2, ShieldCheck } from 'lucide-react';

interface PortalEntranceBannerProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

export const PortalEntranceBanner: React.FC<PortalEntranceBannerProps> = ({ onGoToPortal }) => {
  const roles = [
    { id: 'patient' as const, label: 'Patient', sub: 'Book & track', Icon: User },
    { id: 'doctor' as const, label: 'Doctor', sub: 'Prescribe & connect', Icon: Stethoscope },
    { id: 'lab' as const, label: 'Laboratory', sub: 'Invoices, cashier, reports', Icon: Building2 },
  ];

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 z-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl bg-nl-ink/90 backdrop-blur-xl border border-white/10 p-5 sm:p-7 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-nl-glow/10 border border-nl-glow/30 flex items-center justify-center text-nl-glow shrink-0">
            <ShieldCheck className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-nl-glow/15 text-nl-glow border border-nl-glow/30">
                Three doors, one hub
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white mt-1 font-display">
              Access your nanoLabs workspace
            </h4>
            <p className="text-xs text-white/60 mt-0.5">
              Patients, doctors, and laboratories each have their own portal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {roles.map((r, i) => (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              onClick={() => onGoToPortal(r.id)}
              className={`p-3.5 rounded-2xl text-left transition-all group cursor-pointer ${
                r.id === 'lab'
                  ? 'bg-gradient-to-br from-nl-teal to-nl-deep text-white shadow-lg shadow-nl-teal/30'
                  : 'bg-white/5 border border-white/10 hover:border-nl-glow/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  r.id === 'lab' ? 'bg-white/20 text-white' : 'bg-nl-glow/10 text-nl-glow'
                }`}>
                  <r.Icon className="w-4 h-4" />
                </div>
                <ArrowRight className={`w-3.5 h-3.5 transition-all group-hover:translate-x-0.5 ${
                  r.id === 'lab' ? 'text-white' : 'text-white/50 group-hover:text-nl-glow'
                }`} />
              </div>
              <div className={`text-xs font-bold ${r.id === 'lab' ? 'text-white' : 'text-white'}`}>{r.label}</div>
              <div className={`text-[11px] ${r.id === 'lab' ? 'text-white/80' : 'text-white/50'}`}>{r.sub}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PortalEntranceBanner;