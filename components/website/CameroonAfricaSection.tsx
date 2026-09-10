import React, { useState } from 'react';
import { 
  MapPin, 
  Globe2, 
  Sparkles, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Network,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const CameroonAfricaSection: React.FC = () => {
  const [activeCity, setActiveCity] = useState<string>('Douala');

  const pillars = [
    {
      title: 'Local-First Thinking',
      desc: 'Engineered directly around local laboratory realities, power resilience, offline-first data caching, and Cameroonian clinical terminology.',
      icon: Layers,
      color: '#0EA5E9'
    },
    {
      title: 'Accessible Deployment',
      desc: 'Zero complex server installations required. Labs can onboard immediately using existing browser-equipped PCs, tablets, or smartphones.',
      icon: Zap,
      color: '#2DD4BF'
    },
    {
      title: 'Scalable Architecture',
      desc: 'Built on modular cloud standards (HL7 FHIR, AES-256) capable of scaling from neighborhood polyclinics to national hospital referral networks.',
      icon: Network,
      color: '#14B8A6'
    },
    {
      title: 'Connected Ecosystem',
      desc: 'Direct bridge linking private diagnostics, attending clinicians, hospital wards, and patients into one transparent loop.',
      icon: ShieldCheck,
      color: '#0284C7'
    }
  ];

  return (
    <section id="africa" className="py-24 bg-[#041C18] relative overflow-hidden border-t border-white/5">
      {/* Background Lighting */}
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[#2DD4BF]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0A2C27] border border-white/10 text-xs font-bold text-white">
            <span>Built in Cameroon</span>
            <span>🇨🇲</span>
            <span className="text-[#93B4AF]">•</span>
            <span className="text-[#2DD4BF]">Designed for Africa</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Built around local reality.
          </h2>
          <p className="text-sm sm:text-base text-[#93B4AF] leading-relaxed">
            Technology should adapt to the people using it. NanoLabs is developed specifically around African diagnostic workflows, clinical practices, and operational infrastructure.
          </p>
        </div>

        {/* 2-Column Grid: Map Visual & 4 Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Interactive Cameroon Map & Network Hub */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#0A2C27]/70 border border-white/15 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-[#2DD4BF]" />
                <h3 className="text-base font-black text-white">
                  Cameroon Diagnostic Network
                </h3>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#2DD4BF]/20 text-[#2DD4BF]">
                LIVE NODES
              </span>
            </div>

            {/* City Grid Selector */}
            <div className="grid grid-cols-2 gap-2.5">
              {siteConfig.cities.map((city) => {
                const isActive = activeCity === city.name;
                return (
                  <button
                    key={city.name}
                    onClick={() => setActiveCity(city.name)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0EA5E9]/20 to-[#14B8A6]/20 border-[#2DD4BF] shadow-lg'
                        : 'bg-[#041C18]/60 border-white/5 hover:bg-[#041C18] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{city.name}</span>
                      <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-[#2DD4BF]' : 'text-[#93B4AF]'}`} />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-[#93B4AF]">
                      <span>{city.region}</span>
                      <span className="text-[#2DD4BF] font-semibold">{city.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected City Info Badge */}
            <div className="p-4 rounded-2xl bg-[#041C18] border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white">{activeCity} Diagnostic Node</span>
                <span className="text-[#2DD4BF] font-mono">Synchronized</span>
              </div>
              <p className="text-[11px] text-[#93B4AF] leading-relaxed">
                Active clinical routing for verified patient laboratory results, physician e-prescriptions, and WhatsApp delivery across {activeCity} and surrounding polyclinics.
              </p>
            </div>
          </div>

          {/* Right Column: 4 Core Pillars */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((pillar, pIdx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pIdx}
                  className="p-6 rounded-3xl bg-[#0A2C27]/40 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl space-y-3"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h4 className="text-base font-black text-white">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-[#93B4AF] leading-relaxed">
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
