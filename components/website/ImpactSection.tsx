import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, Users, Stethoscope, ShieldCheck } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

const impacts = [
  { title: 'For patients', subtitle: 'From queue to one tap.', desc: 'AI prescription scan, lab comparison by real distance, MoMo payment, live sample tracking, and share with a doctor in one tap.', Icon: Users, color: '#14B8A6' },
  { title: 'For doctors', subtitle: 'Finally in the loop.', desc: 'Two-way connections, e-prescriptions, test recommendations, and signed reports the moment they are ready.', Icon: Stethoscope, color: '#1677FF' },
  { title: 'For laboratories', subtitle: 'Digital front door, without losing the brand.', desc: 'Keep your name, prices, and staff. Add bookings, verified payments, auto-invoices, branded reports, and audit.', Icon: Building2, color: '#0F766E' },
  { title: 'For insurers', subtitle: 'Audit-ready claims.', desc: 'Per-line insurance columns on every invoice, manual verification at intake, and a hash-chained trail behind every claim.', Icon: ShieldCheck, color: '#2DD4BF' },
];

const Counter: React.FC<{ value: string; className?: string }> = ({ value, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const match = value.match(/(\d+(\.\d+)?)/);
    if (!match) { setDisplay(value); return; }
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

export const ImpactSection: React.FC = () => {
  return (
    <section id="impact" className="py-24 bg-nl-ink relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-nl-glow uppercase tracking-wider bg-nl-glow/10 px-3.5 py-1 rounded-full border border-nl-glow/20">
            Better infrastructure, better care
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
            Tangible impact, on every side.
          </h2>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Patients, doctors, labs, and insurers each gain something they do not have today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {impacts.map((imp, i) => (
            <motion.div
              key={imp.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="p-6 rounded-3xl bg-nl-black border border-white/10 hover:border-nl-glow/40 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${imp.color}20`, color: imp.color }}>
                  <imp.Icon className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <h3 className="text-base font-black text-white font-display">{imp.title}</h3>
                <div className="text-xs font-bold text-nl-glow leading-tight">{imp.subtitle}</div>
                <p className="text-xs text-white/60 leading-relaxed">{imp.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {siteConfig.impactStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="p-5 rounded-2xl bg-nl-black border border-white/10 text-center space-y-1"
            >
              <div className="text-2xl sm:text-3xl font-black font-display text-white">
                <Counter value={stat.value} />
              </div>
              <div className="text-xs font-bold text-nl-glow">{stat.label}</div>
              <p className="text-[11px] text-white/50">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;