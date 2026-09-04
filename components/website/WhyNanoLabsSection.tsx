import React from 'react';
import { 
  Network, 
  FlaskConical, 
  Smartphone, 
  Stethoscope, 
  ShieldCheck, 
  Globe2,
  ArrowRight
} from 'lucide-react';

interface WhyNanoLabsSectionProps {
  onGoToPortal: () => void;
}

export const WhyNanoLabsSection: React.FC<WhyNanoLabsSectionProps> = ({ onGoToPortal }) => {
  const reasons = [
    {
      title: 'Connected Workflows',
      desc: 'Brings patient intake, sample collection, bench analysis, validation, and delivery into one frictionless pipeline.',
      icon: Network,
      color: '#1677FF'
    },
    {
      title: 'Laboratory-Focused Design',
      desc: 'Crafted specifically for clinical pathology benches with tube color-coding, multi-section parameters, and antibiograms.',
      icon: FlaskConical,
      color: '#00A6A6'
    },
    {
      title: 'Patient Connectivity',
      desc: 'Extends results directly to patient smartphones with WhatsApp delivery, PID lookups, and sealed digital envelopes.',
      icon: Smartphone,
      color: '#20C997'
    },
    {
      title: 'Physician Relationships',
      desc: 'Enables referring doctors to review longitudinal patient graphs, prescribe test panels, and track diagnostic findings.',
      icon: Stethoscope,
      color: '#7C5CFC'
    },
    {
      title: 'Traceability & Security',
      desc: 'Immutably logs every parameter adjustment, phlebotomist scan, and biologist sign-off with SHA-256 cryptographic proof.',
      icon: ShieldCheck,
      color: '#20C997'
    },
    {
      title: 'Local Understanding',
      desc: 'Built around Cameroonian insurance providers (ASCOMA, SAHAM, Chanas), local telecom networks, and operational power dynamics.',
      icon: Globe2,
      color: '#1677FF'
    }
  ];

  return (
    <section className="py-24 bg-[#0B1F3A]/40 relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#20C997] uppercase tracking-wider bg-[#20C997]/10 px-3.5 py-1 rounded-full border border-[#20C997]/20">
            Engineered For Excellence
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Why NanoLabs?
          </h2>
          <p className="text-sm sm:text-base text-[#AAB7C7] leading-relaxed">
            The distinct capabilities that make NanoLabs the premier digital infrastructure for modern diagnostic laboratories.
          </p>
        </div>

        {/* 6 Premium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, idx) => {
            const Icon = r.icon;
            return (
              <div
                key={idx}
                className="group p-6 sm:p-8 rounded-3xl bg-[#07111F] border border-white/10 hover:border-[#20C997]/40 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${r.color}20`, color: r.color }}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-[#20C997] transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#AAB7C7] leading-relaxed">
                    {r.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#20C997]">
                  <span>Explore Feature</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyNanoLabsSection;
