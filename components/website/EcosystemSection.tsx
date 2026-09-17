import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Users, Stethoscope, FileText, UserCheck, Smartphone, Activity, ArrowRight, Layers,
} from 'lucide-react';

interface EcosystemSectionProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

const nodes = [
  { id: 0, title: 'Patients', Icon: Users, color: '#0F766E', role: 'B2C door', desc: 'Scan prescriptions, compare labs, book, pay with MoMo, track samples, and share reports with doctors.' },
  { id: 1, title: 'Doctors', Icon: Stethoscope, color: '#1677FF', role: 'Clinical network', desc: 'Two-way patient connections, e-prescriptions, test recommendations, and referral credits.' },
  { id: 2, title: 'Laboratories', Icon: Building2, color: '#0D3B38', role: 'B2B door', desc: 'Keep your brand, prices, and staff. Add bookings, cashier verification, branded reports, and audit.' },
  { id: 3, title: 'Test batches', Icon: Layers, color: '#14B8A6', role: 'Unit of billing', desc: 'Every collection event is one batch. One invoice, one 5% line, one report — never per test.' },
  { id: 4, title: 'Sample tracking', Icon: Activity, color: '#0F766E', role: '7 stages', desc: 'Intake, collected, in transit, received, analysis, validation, signed and ready. Live for the patient.' },
  { id: 5, title: 'Branded reports', Icon: FileText, color: '#1677FF', role: 'Per lab', desc: 'Every report carries its executing lab\u2019s header, logo, and biologist signature. Multi-lab = separate PDFs.' },
  { id: 6, title: 'Lab staff', Icon: UserCheck, color: '#14B8A6', role: '8+ roles', desc: 'Receptionist, cashier, phlebotomist, technician, biologist, quality officer, admin, accountant.' },
  { id: 7, title: 'Patient audit', Icon: Smartphone, color: '#0D3B38', role: 'Automatic', desc: 'Booklet opened, report viewed, batch shared, booking confirmed — logged without any signature.' },
];

export const EcosystemSection: React.FC<EcosystemSectionProps> = ({ onGoToPortal }) => {
  const [selected, setSelected] = useState(0);

  const renderNode = (n: typeof nodes[number], align: 'left' | 'right') => {
    const isSelected = selected === n.id;
    return (
      <motion.div
        key={n.id}
        initial={{ opacity: 0, x: align === 'left' ? -20 : 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        whileHover={{ x: align === 'left' ? 4 : -4 }}
        onClick={() => setSelected(n.id)}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          isSelected
            ? 'bg-white border-nl-teal shadow-lg shadow-teal-900/10'
            : 'bg-white/70 border-slate-200 hover:bg-white hover:border-nl-teal/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${n.color}15`, color: n.color }}>
            <n.Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-nl-ink truncate">{n.title}</h4>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">{n.role}</span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{n.desc}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="ecosystem" className="py-24 bg-nl-off relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-nl-teal/30 text-xs font-bold text-nl-deep">
            <Activity className="w-3.5 h-3.5" />
            <span>One connected diagnostic hub</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-nl-ink tracking-tight font-display">
            Three doors. One record.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Patients, doctors, and laboratories each have their own door — but everything lives on one platform, one record, one audit.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-4 space-y-2">
            {nodes.slice(0, 4).map((n) => renderNode(n, 'left'))}
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-nl-deep via-nl-teal to-nl-light p-1 shadow-2xl shadow-teal-900/20">
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
                  <Activity className="w-12 h-12 text-nl-teal stroke-[2.5]" />
                </div>
              </div>
            </motion.div>

            <h3 className="text-xl font-black text-nl-ink mb-1 font-display">nanoLabs hub</h3>
            <p className="text-xs text-nl-teal font-semibold mb-4">Batch-based. Audit-chained.</p>

            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full p-4 rounded-2xl bg-nl-off border border-slate-200 text-left space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-nl-ink">{nodes[selected].title}</span>
                <span className="text-[10px] text-nl-teal font-mono font-bold">CONNECTED</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{nodes[selected].desc}</p>
            </motion.div>

            <button
              onClick={() => onGoToPortal()}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-nl-deep to-nl-teal text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <span>Explore the hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="lg:col-span-4 space-y-2">
            {nodes.slice(4, 8).map((n) => renderNode(n, 'right'))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;