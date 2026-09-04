import React from 'react';
import { 
  TrendingUp, 
  Building2, 
  Globe2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface InvestorSectionProps {
  onPartnerClick: () => void;
}

export const InvestorSection: React.FC<InvestorSectionProps> = ({ onPartnerClick }) => {
  const cards = [
    {
      title: 'Market Opportunity',
      subtitle: 'Diagnostic Healthcare Growth',
      desc: 'Rapidly expanding private and public clinical laboratory sector across Central & West Africa modernizing from paper to cloud.',
      badge: 'High Growth TAM'
    },
    {
      title: 'Business Model',
      subtitle: 'B2B SaaS & Transactional Ecosystem',
      desc: 'Predictable recurring laboratory SaaS subscriptions supplemented by high-margin SMS/WhatsApp delivery and physician e-referrals.',
      badge: 'Scalable Economics'
    },
    {
      title: 'Geographic Expansion',
      subtitle: 'Cameroon to CEMAC & ECOWAS',
      desc: 'Establishing deep market leadership across Cameroon diagnostic centers, followed by expansion into regional Central and West African markets.',
      badge: 'Pan-African Vision'
    },
    {
      title: 'Ecosystem Lock-in',
      subtitle: 'Patients, Labs & Doctors',
      desc: 'Strong network effects where connecting one laboratory automatically activates hundreds of referring physicians and thousands of patients.',
      badge: 'Network Moat'
    }
  ];

  return (
    <section className="py-24 bg-[#07111F] relative overflow-hidden border-t border-white/5">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-[#1677FF]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#1677FF] uppercase tracking-wider bg-[#1677FF]/10 px-3.5 py-1 rounded-full border border-[#1677FF]/20">
            Strategic Investment & Partnerships
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Building the digital infrastructure behind tomorrow's laboratories.
          </h2>
          <p className="text-sm sm:text-base text-[#AAB7C7] leading-relaxed">
            NanoLabs is building from Cameroon with the ambition of creating scalable, category-defining laboratory technology for African healthcare markets.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#0B1F3A]/60 border border-white/10 hover:border-[#1677FF]/40 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1677FF]/20 text-[#1677FF] border border-[#1677FF]/30">
                  {c.badge}
                </span>
                <h3 className="text-lg font-black text-white">{c.title}</h3>
                <div className="text-xs font-bold text-[#20C997]">{c.subtitle}</div>
                <p className="text-xs text-[#AAB7C7] leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0B1F3A] to-[#07111F] border border-white/15 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Interested in partnering or investing in NanoLabs?
            </h3>
            <p className="text-xs sm:text-sm text-[#AAB7C7] mt-1">
              Join us in transforming laboratory healthcare infrastructure across Africa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onPartnerClick}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#00A6A6] hover:from-[#1677FF]/90 text-white font-extrabold text-xs shadow-lg transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <span>Partner with NanoLabs</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={`mailto:${siteConfig.email}?subject=NanoLabs%20Investor%20Inquiry`}
              className="px-5 py-3 rounded-xl bg-[#07111F] hover:bg-[#07111F]/80 border border-white/15 text-white font-bold text-xs transition-all flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-[#20C997]" />
              <span>Request Investor Deck</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestorSection;
