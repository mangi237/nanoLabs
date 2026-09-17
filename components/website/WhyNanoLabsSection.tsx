import React from 'react';
import { motion } from 'framer-motion';
import { Network, FlaskConical, Smartphone, Stethoscope, ShieldCheck, Globe2, ArrowRight } from 'lucide-react';

interface WhyNanoLabsSectionProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

const reasons = [
  { title: 'Batch-based by design', desc: 'Every collection event is one batch. One invoice, one 5% line, one report — never per test.', Icon: Network, color: '#0F766E' },
  { title: 'Lab-branded reports', desc: 'Every report carries its executing lab\u2019s header, logo, and biologist signature. Multi-lab = separate PDFs.', Icon: FlaskConical, color: '#14B8A6' },
  { title: 'Patient app, mobile-first', desc: 'Scan prescriptions, compare labs, pay with MoMo, watch the sample move, share with a doctor in one tap.', Icon: Smartphone, color: '#1677FF' },
  { title: 'Doctor network', desc: 'Two-way connections, e-prescriptions, and referral credits. ONMC-aligned with zero fee-splitting.', Icon: Stethoscope, color: '#0D3B38' },
  { title: 'Append-only audit chain', desc: 'Every sample event and patient action hash-chained. Tamper attempts rejected at the database level.', Icon: ShieldCheck, color: '#0F766E' },
  { title: 'Built for CEMAC', desc: 'MoMo-first payments, Prestataires Agréés insurance verification, Cameroon B-code conventions, TVA always exempt.', Icon: Globe2, color: '#1677FF' },
];

export const WhyNanoLabsSection: React.FC<WhyNanoLabsSectionProps> = ({ onGoToPortal }) => {
  return (
    <section id="why" className="py-24 bg-nl-off relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-nl-teal uppercase tracking-wider bg-nl-mint px-3.5 py-1 rounded-full border border-nl-light/30">
            Engineered for the network
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-nl-ink tracking-tight font-display">
            Why nanoLabs.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            The capabilities that make nanoLabs the digital backbone of diagnostics in Cameroon and CEMAC.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="group p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 hover:border-nl-teal/40 transition-all duration-300 hover:shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.1 }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${r.color}15`, color: r.color }}
                >
                  <r.Icon className="w-6 h-6" strokeWidth={2.2} />
                </motion.div>
                <h3 className="text-lg font-black text-nl-ink group-hover:text-nl-teal transition-colors font-display">{r.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{r.desc}</p>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-nl-teal">
                <span>Explore feature</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyNanoLabsSection;