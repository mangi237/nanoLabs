import React from 'react';
import { Quote, BookOpen } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

export const FounderSection: React.FC = () => {
  const { founder } = siteConfig;

  return (
    <section id="founder" className="py-24 bg-[#F8FAF9] relative overflow-hidden">
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0F766E]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-gradient-to-tr from-[#0D3B38] via-[#0F766E] to-[#14B8A6] p-1 shadow-2xl shadow-teal-900/20">
              <div className="rounded-[22px] bg-white overflow-hidden p-6 sm:p-8 space-y-6">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center group">
                  {/* [SOURCE IMAGE: portrait of Cameroonian founder, warm light, 4:5, replace src with your image URL] */}
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-full h-full object-cover grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F1D]/70 via-transparent to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-[#0F766E] border border-teal-200">
                      Founder & Product Architect
                    </span>
                    <h3 className="text-xl font-black text-white mt-1 drop-shadow">
                      {founder.name}
                    </h3>
                    <p className="text-xs text-slate-200">
                      {founder.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  {founder.socials.substack && (
                    <a
                      href={founder.socials.substack}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-white hover:bg-[#0F766E] transition-all"
                      aria-label="Substack"
                    >
                      <BookOpen className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
                Founder origin & vision
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-[#0B1F1D] tracking-tight">
                Built from a problem worth solving.
              </h2>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 relative">
              <Quote className="w-8 h-8 text-[#0F766E]/20 absolute top-4 right-4" />
              <p className="text-base sm:text-lg font-medium text-[#0B1F1D] italic leading-relaxed">
                "{founder.quote}"
              </p>
              <div className="text-xs text-[#0F766E] font-bold">
                &mdash; {founder.name}, Founder
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>
                nanoLabs began after Mangi observed inefficiencies around laboratory healthcare during a hospital experience in Cameroon.
              </p>
              <p>
                As a software engineer, he set out to build a connected diagnostic hub designed around real African clinical workflows — patients, doctors, and laboratories on one platform.
              </p>
              <p>
                What started as an observation became nanoLabs: one hub, three doors, one record, and zero financial risk for the platform.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-4 text-xs font-bold text-[#0B1F1D]">
              <span className="flex items-center gap-1.5 text-[#0F766E]">
                Douala & Yaoundé hubs
              </span>
              <span className="text-slate-400">&middot;</span>
              <span className="text-slate-600">Building for CEMAC</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;