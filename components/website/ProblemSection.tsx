import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  FileX2, Clock3, AlertTriangle, PhoneOff, Shuffle, SearchX,
  CheckCircle2, ArrowRight, ShieldCheck, Zap, Building2, Receipt,
} from 'lucide-react';

interface ProblemSectionProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

const challenges = [
  { stat: '4.5h', title: 'Average result wait', desc: 'Time lost between collection and the patient holding a signed report.', Icon: Clock3 },
  { stat: '68%', title: 'Patients travel twice', desc: 'Once for intake, again for pickup. Especially brutal for chronic follow-ups.', Icon: Shuffle },
  { stat: '31%', title: 'Unreadable prescriptions', desc: 'Handwritten sheets cause receptionists to guess at test names and codes.', Icon: FileX2 },
  { stat: '40%', title: 'Manual insurance checks', desc: 'Claims re-verified because there is no auditable intake record.', Icon: ShieldCheck },
  { stat: '1 in 3', title: 'Reports lost in 6 months', desc: 'No digital archive, no trend comparison, no ability to share.', Icon: SearchX },
  { stat: '0%', title: 'Traceability after collection', desc: 'Once the sample leaves the collection room, nothing is logged.', Icon: AlertTriangle },
  { stat: '60%', title: 'Home collections cancelled', desc: 'Payment verified only at the door. Phlebotomist wastes the trip.', Icon: PhoneOff },
  { stat: 'None', title: 'Audit on sign-off', desc: 'No record of who signed, who edited a value, or when it was released.', Icon: Building2 },
  { stat: '0%', title: 'Doctors see results', desc: 'Unless the patient carries the paper across town themselves.', Icon: PhoneOff },
  { stat: 'Opaque', title: 'Per-test invoice math', desc: 'Insurance co-pay hidden in fine print and per-line confusion.', Icon: Receipt },
];

const solutions = [
  { title: 'One hub, three doors', desc: 'Patient, doctor, and lab each get their own workspace on the same batch, same record, same audit.' },
  { title: 'Batch-based invoicing', desc: 'One invoice per collection event. Insurance split per line. 5% on patient portion, charged on verification.' },
  { title: 'Live sample tracking', desc: 'Seven stages visible to the patient. Home collection adds a live phlebotomist map with ETA.' },
  { title: 'Append-only audit', desc: 'Every sample event and patient action is hash-chained. Tamper attempts rejected at database level.' },
];

const Counter: React.FC<{ value: string; className?: string }> = ({ value, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const match = value.match(/(\d+(\.\d+)?)/);
    if (!match) {
      setDisplay(value);
      return;
    }
    const target = parseFloat(match[0]);
    const suffix = value.replace(match[0], '');
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = target * eased;
      const text = target % 1 === 0 ? Math.round(current).toString() : current.toFixed(1);
      setDisplay(text + suffix);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return <span ref={ref} className={className}>{display}</span>;
};

export const ProblemSection: React.FC<ProblemSectionProps> = ({ onGoToPortal }) => {
  return (
    <section className="py-24 bg-nl-ink relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-nl-glow uppercase tracking-wider bg-nl-glow/10 px-3.5 py-1 rounded-full border border-nl-glow/20">
            The problem, then the hub
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-display">
            Diagnostics should not feel like a paper chase.
          </h2>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            These are the numbers behind the everyday experience in Cameroonian labs today. nanoLabs exists to change every one of them.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-16">
          {challenges.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="p-4 rounded-2xl bg-nl-black border border-white/10 hover:border-nl-danger/40 transition-all"
            >
              <c.Icon className="w-5 h-5 text-nl-danger/70 mb-2" />
              <div className="text-2xl font-black font-display text-white">
                <Counter value={c.stat} />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mt-1">
                {c.title}
              </div>
              <p className="text-[10px] text-white/40 leading-snug mt-2">
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 rounded-3xl bg-nl-black border border-white/10 p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-nl-danger" />
              <h3 className="text-lg font-black text-white font-display">The old way</h3>
            </div>
            <p className="text-xs text-white/60">
              Paper, phones, queues, and per-test invoices that drift. Every step is a leak.
            </p>
            <div className="space-y-2">
              {[
                'Queue at intake, queue at pickup',
                'Prescription handwritten, guessed at the counter',
                'Insurance checked at a separate portal, no audit',
                'Sample leaves collection with no log',
                'Results carried on paper, often lost',
                'Payment verified at the door, or not at all'
              ].map((t) => (
                <div key={t} className="flex items-start gap-2.5 text-xs text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-nl-danger/70 shrink-0 mt-1.5" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-nl-teal via-nl-deep to-nl-black border border-nl-glow/30 p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-nl-glow/20 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2.5 relative">
              <span className="w-3 h-3 rounded-full bg-nl-glow animate-pulse" />
              <h3 className="text-lg font-black text-white font-display flex items-center gap-2">
                The nanoLabs way
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">B2B2C hub</span>
              </h3>
            </div>
            <p className="text-xs text-white/80">
              One platform. One batch. One audit. Every door connected.
            </p>

            <div className="space-y-3 relative">
              {solutions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-2xl bg-white/10 border border-white/20 space-y-1 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-nl-glow" />
                    <span>{s.title}</span>
                  </div>
                  <p className="text-[11px] text-white/70 pl-6 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
              <div className="text-xs font-bold text-white">
                One hub. Every test. Every lab. Every result.
              </div>
              <button
                onClick={() => onGoToPortal()}
                className="w-full sm:w-auto px-5 py-2.5 bg-white text-nl-deep font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.03] transition-transform"
              >
                <span>Enter the hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {[
            { Icon: Zap, label: 'MoMo-first payments' },
            { Icon: ShieldCheck, label: 'Insurance verified at intake' },
            { Icon: Receipt, label: 'Batch invoicing' },
            { Icon: Building2, label: 'Lab-branded reports' },
          ].map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/70"
            >
              <p.Icon className="w-3.5 h-3.5 text-nl-glow" />
              {p.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;