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
        className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-nl-mint border border-nl-light/40 flex items-center justify-center text-nl-deep shrink-0">
            <ShieldCheck className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-nl-mint text-nl-deep border border-nl-light/30">
                Three doors, one hub
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-nl-ink mt-1 font-display">
              Access your nanoLabs workspace
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
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
              className={`p-3.5 rounded-2xl text-left transition-all group cursor-pointer border ${
                r.id === 'lab'
                  ? 'bg-gradient-to-br from-nl-deep to-nl-teal text-white border-transparent shadow-md shadow-teal-900/20'
                  : 'bg-nl-off border-slate-200 hover:border-nl-teal/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  r.id === 'lab' ? 'bg-white/20 text-white' : 'bg-nl-mint text-nl-deep'
                }`}>
                  <r.Icon className="w-4 h-4" />
                </div>
                <ArrowRight className={`w-3.5 h-3.5 transition-all group-hover:translate-x-0.5 ${
                  r.id === 'lab' ? 'text-white' : 'text-slate-400 group-hover:text-nl-teal'
                }`} />
              </div>
              <div className="text-xs font-bold text-nl-ink">{r.label}</div>
              <div className={`text-[11px] ${r.id === 'lab' ? 'text-white/80' : 'text-slate-500'}`}>{r.sub}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PortalEntranceBanner;