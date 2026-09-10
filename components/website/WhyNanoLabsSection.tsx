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
      title: 'Transparent Comparison',
      desc: 'Compare nearby labs by price, turnaround time, distance and accreditation before you pay — no more guessing or calling around.',
      icon: Network,
      color: '#0EA5E9'
    },
    {
      title: 'AI Prescription Scanner',
      desc: 'Scan a handwritten or printed prescription and let nanoLabs read it, extract the tests, and pre-select them for booking.',
      icon: FlaskConical,
      color: '#14B8A6'
    },
    {
      title: 'Pay the Way You Pay',
      desc: 'Cash at the desk or Mobile Money with MTN MoMo and Orange Money, confirmed securely by the lab cashier.',
      icon: Smartphone,
      color: '#2DD4BF'
    },
    {
      title: 'Care Without Travel',
      desc: 'Request home sample collection and a phlebotomist comes to you, with fair distance-based pricing calculated from your location.',
      icon: Stethoscope,
      color: '#0284C7'
    },
    {
      title: 'Records You Own',
      desc: 'Every signed, tamper-proof result is kept in your medical booklet, shareable with any connected doctor in one tap.',
      icon: ShieldCheck,
      color: '#2DD4BF'
    },
    {
      title: 'Built for Cameroon',
      desc: 'Designed around local insurers (Ascoma, Activa, SAHAM, Chanas, GMC), Mobile Money, and the way healthcare really works here.',
      icon: Globe2,
      color: '#0EA5E9'
    }
  ];

  return (
    <section className="py-24 bg-[#0A2C27]/40 relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider bg-[#2DD4BF]/10 px-3.5 py-1 rounded-full border border-[#2DD4BF]/20">
            Engineered For Excellence
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Why NanoLabs?
          </h2>
          <p className="text-sm sm:text-base text-[#93B4AF] leading-relaxed">
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
                className="group p-6 sm:p-8 rounded-3xl bg-[#041C18] border border-white/10 hover:border-[#2DD4BF]/40 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${r.color}20`, color: r.color }}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-[#2DD4BF] transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#93B4AF] leading-relaxed">
                    {r.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#2DD4BF]">
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
