import React from 'react';
import { 
  Building2, 
  Users, 
  Stethoscope, 
  HeartHandshake, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const ImpactSection: React.FC = () => {
  const impacts = [
    {
      title: 'For Laboratories',
      subtitle: 'More organized operations and better visibility.',
      desc: 'Automated sample tracking, error-free barcoding, unified test pricing, and instant financial revenue reconciliation.',
      icon: Building2,
      color: '#1677FF'
    },
    {
      title: 'For Laboratory Teams',
      subtitle: 'Clearer workflows and less fragmented work.',
      desc: 'Purpose-built screens for receptionists, bench technicians, and medical biologists without confusing clutter.',
      icon: Users,
      color: '#20C997'
    },
    {
      title: 'For Doctors',
      subtitle: 'Better connection with laboratory processes and results.',
      desc: 'Real-time diagnostic access, electronic test requests, and historical trend comparison without lost paper files.',
      icon: Stethoscope,
      color: '#00A6A6'
    },
    {
      title: 'For Patients',
      subtitle: 'A more accessible and connected laboratory experience.',
      desc: 'Instant WhatsApp results, tactile sealed digital envelope unsealing, and verified signed PDF copies on demand.',
      icon: HeartHandshake,
      color: '#7C5CFC'
    }
  ];

  return (
    <section id="impact" className="py-24 bg-[#0B1F3A]/40 relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#1677FF] uppercase tracking-wider bg-[#1677FF]/10 px-3.5 py-1 rounded-full border border-[#1677FF]/20">
            Real Healthcare Transformation
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Better laboratory infrastructure creates better healthcare experiences.
          </h2>
          <p className="text-sm sm:text-base text-[#AAB7C7] leading-relaxed">
            Delivering tangible improvements across every stage of the diagnostic care journey.
          </p>
        </div>

        {/* 4 Impact Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {impacts.map((imp, idx) => {
            const Icon = imp.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#07111F] border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${imp.color}20`, color: imp.color }}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h3 className="text-base font-black text-white">{imp.title}</h3>
                  <div className="text-xs font-bold text-[#20C997] leading-tight">
                    {imp.subtitle}
                  </div>
                  <p className="text-xs text-[#AAB7C7] leading-relaxed">
                    {imp.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verified Impact Telemetry Strip */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {siteConfig.impactStats.map((stat, sIdx) => (
            <div
              key={sIdx}
              className="p-5 rounded-2xl bg-[#07111F]/80 border border-white/10 text-center space-y-1"
            >
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-[#20C997]">{stat.label}</div>
              <p className="text-[11px] text-[#AAB7C7]">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
