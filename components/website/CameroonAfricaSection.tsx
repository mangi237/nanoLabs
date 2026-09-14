import React, { useState } from 'react';
import {
  MapPin,
  Globe2,
  Layers,
  Zap,
  ShieldCheck,
  Network,
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const CameroonAfricaSection: React.FC = () => {
  const [activeCity, setActiveCity] = useState<string>('Douala');

  const pillars = [
    {
      title: 'Batch-first by design',
      desc: 'Every collection event is one batch. One invoice, one 5% line, one report — never per test.',
      icon: Layers,
      color: '#0F766E'
    },
    {
      title: 'MoMo-first payments',
      desc: 'MTN Mobile Money and Orange Money are first-class, not afterthoughts. Cash is supported without friction.',
      icon: Zap,
      color: '#14B8A6'
    },
    {
      title: 'Insurance-ready intake',
      desc: 'Per-insurer price lists, manual verification via Prestataires Agréés, clean co-pay columns on every invoice.',
      icon: ShieldCheck,
      color: '#1677FF'
    },
    {
      title: 'Open lab network',
      desc: 'Any accredited lab joins the network. Keeps its brand, prices, and staff. We give it the digital front door.',
      icon: Network,
      color: '#0D3B38'
    }
  ];

  return (
    <section id="africa" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-[#0F766E]">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Cameroon &middot; CEMAC &middot; West Africa</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0B1F1D] tracking-tight">
            Built around local reality.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Mobile-first, MoMo-first, batch-first. Designed for the way Cameroon books, pays, and shares diagnostic records today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#F8FAF9] border border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-[#0F766E]" />
                <h3 className="text-base font-black text-[#0B1F1D]">
                  nanoLabs network
                </h3>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-teal-100 text-[#0F766E]">
                LIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {siteConfig.cities.map((city) => {
                const isActive = activeCity === city.name;
                return (
                  <button
                    key={city.name}
                    onClick={() => setActiveCity(city.name)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white border-[#0F766E] shadow-lg'
                        : 'bg-white/70 border-slate-200 hover:bg-white hover:border-teal-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B1F1D]">{city.name}</span>
                      <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-[#0F766E]' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                      <span>{city.region}</span>
                      <span className="text-[#0F766E] font-semibold">{city.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#0B1F1D]">{activeCity} node</span>
                <span className="text-[#0F766E] font-mono">Synchronized</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Batches, payments, and reports flow live from {activeCity} across the nanoLabs network. Patients and doctors see the same record the lab sees.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-3xl bg-[#F8FAF9] border border-slate-200 hover:border-teal-300 transition-all duration-300 hover:shadow-xl space-y-3"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h4 className="text-base font-black text-[#0B1F1D]">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CameroonAfricaSection;