import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Globe2, Layers, Zap, ShieldCheck, Network } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const CameroonAfricaSection: React.FC = () => {
  const [activeCity, setActiveCity] = useState<string>('Douala');

  const pillars = [
    { title: 'Batch-first by design', desc: 'Every collection event is one batch. One invoice, one 5% line, one report — never per test.', Icon: Layers, color: '#14B8A6' },
    { title: 'MoMo-first payments', desc: 'MTN Mobile Money and Orange Money are first-class, not afterthoughts. Cash is supported without friction.', Icon: Zap, color: '#FFCC00' },
    { title: 'Insurance-ready intake', desc: 'Per-insurer price lists, manual verification via Prestataires Agréés, clean co-pay columns on every invoice.', Icon: ShieldCheck, color: '#1677FF' },
    { title: 'Open lab network', desc: 'Any accredited lab joins the network. Keeps its brand, prices, and staff. We give it the digital front door.', Icon: Network, color: '#0F766E' },
  ];

  return (
    <section id="africa" className="py-24 bg-nl-off relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-nl-teal/30 text-xs font-bold text-nl-deep">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Cameroon · CEMAC · West Africa</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-nl-ink tracking-tight font-display">
            Built around local reality.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Mobile-first, MoMo-first, batch-first. Designed for the way Cameroon books, pays, and shares diagnostic records today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-nl-teal" />
                <h3 className="text-base font-black text-nl-ink font-display">nanoLabs network</h3>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-nl-mint text-nl-deep">LIVE</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {siteConfig.cities.map((city, i) => {
                const isActive = activeCity === city.name;
                return (
                  <motion.button
                    key={city.name}
                    onClick={() => setActiveCity(city.name)}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-nl-mint/50 border-nl-teal shadow-md'
                        : 'bg-nl-off border-slate-200 hover:border-nl-teal/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-nl-ink">{city.name}</span>
                      <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-nl-teal' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                      <span>{city.region}</span>
                      <span className="text-nl-teal font-semibold">{city.status}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCity}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="p-4 rounded-2xl bg-nl-off border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-nl-ink">{activeCity} node</span>
                  <span className="text-nl-teal font-mono">Synchronized</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Batches, payments, and reports flow live from {activeCity} across the nanoLabs network. Patients and doctors see the same record the lab sees.
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-nl-teal/40 transition-all duration-300 space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${p.color}15`, color: p.color }}>
                  <p.Icon className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <h4 className="text-base font-black text-nl-ink font-display">{p.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CameroonAfricaSection;