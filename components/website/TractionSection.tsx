import React from 'react';
import { Flag, Sparkles, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const TractionSection: React.FC = () => {
  return (
    <section id="traction" className="py-24 bg-[#07111F] relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#20C997] uppercase tracking-wider bg-[#20C997]/10 px-3.5 py-1 rounded-full border border-[#20C997]/20">
            Startup Journey & Milestones
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            We're just getting started.
          </h2>
          <p className="text-sm sm:text-base text-[#AAB7C7] leading-relaxed">
            Building in public. Learning from real laboratory workflows. Improving continuously.
          </p>
        </div>

        {/* Milestones Horizontal / Vertical Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {siteConfig.milestones.map((milestone, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#0B1F3A]/60 border border-white/10 hover:border-[#20C997]/40 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between space-y-4 relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black font-mono text-white">
                    {milestone.year}
                  </span>
                  {milestone.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1677FF]/20 text-[#1677FF] border border-[#1677FF]/30">
                      {milestone.badge}
                    </span>
                  )}
                </div>
                {milestone.date && (
                  <div className="text-xs font-semibold text-[#20C997]">
                    {milestone.date}
                  </div>
                )}
                <h4 className="text-base font-black text-white">
                  {milestone.title}
                </h4>
                <p className="text-xs text-[#AAB7C7] leading-relaxed">
                  {milestone.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#20C997]" />
                <span>Verified Milestone</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TractionSection;
