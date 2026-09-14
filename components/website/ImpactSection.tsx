import React from 'react';
import {
  Building2,
  Users,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const ImpactSection: React.FC = () => {
  const impacts = [
    {
      title: 'For Patients',
      subtitle: 'From queue to one tap.',
      desc: 'AI prescription scan, lab comparison by real distance, MoMo payment, live sample tracking, and share with a doctor in one tap.',
      icon: Users,
      color: '#0F766E'
    },
    {
      title: 'For Doctors',
      subtitle: 'Finally in the loop.',
      desc: 'Two-way connections, e-prescriptions, test recommendations, and signed reports the moment they are ready.',
      icon: Stethoscope,
      color: '#1677FF'
    },
    {
      title: 'For Laboratories',
      subtitle: 'Digital front door, without losing the brand.',
      desc: 'Keep your name, prices, and staff. Add bookings, verified payments, auto-invoices, branded reports, and audit.',
      icon: Building2,
      color: '#0D3B38'
    },
    {
      title: 'For Insurers',
      subtitle: 'Audit-ready claims.',
      desc: 'Per-line insurance columns on every invoice, manual verification at intake, and a hash-chained trail behind every claim.',
      icon: ShieldCheck,
      color: '#14B8A6'
    }
  ];

  return (
    <section id="impact" className="py-24 bg-[#F8FAF9] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#1677FF] uppercase tracking-wider bg-blue-50 px-3.5 py-1 rounded-full border border-blue-100">
            Better infrastructure, better care
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0B1F1D] tracking-tight">
            Tangible impact, on every side.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Patients, doctors, labs, and insurers each gain something they don\u2019t have today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {impacts.map((imp, i) => {
            const Icon = imp.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-teal-300 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${imp.color}15`, color: imp.color }}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h3 className="text-base font-black text-[#0B1F1D]">{imp.title}</h3>
                  <div className="text-xs font-bold text-[#0F766E] leading-tight">
                    {imp.subtitle}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {imp.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {siteConfig.impactStats.map((stat, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-1"
            >
              <div className="text-2xl sm:text-3xl font-black text-[#0B1F1D] font-mono">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-[#0F766E]">{stat.label}</div>
              <p className="text-[11px] text-slate-500">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;