import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Lock,
  Search,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Scan,
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface HeroProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

export const Hero: React.FC<HeroProps> = ({ onGoToPortal }) => {
  const [screenIndex, setScreenIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setScreenIndex((i) => (i + 1) % 2);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 overflow-hidden bg-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-br from-[#0F766E]/10 via-[#14B8A6]/8 to-[#1677FF]/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-[#0F766E]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F766E]" />
              </span>
              <span>Live in Douala & Yaoundé</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0B1F1D] leading-[1.08]">
              One hub. Every test.
              <br />
              <span className="bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#1677FF] bg-clip-text text-transparent">
                Every lab. Every result.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              {siteConfig.description}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => onGoToPortal('patient')}
                className="px-7 py-4 rounded-2xl bg-gradient-to-r from-[#0D3B38] via-[#0F766E] to-[#14B8A6] text-white font-bold text-sm shadow-xl shadow-teal-900/20 hover:shadow-teal-700/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book a test</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#product"
                className="px-6 py-4 rounded-2xl bg-white border border-slate-200 text-[#0B1F1D] font-semibold text-sm hover:border-teal-300 hover:bg-teal-50/40 transition-all flex items-center justify-center gap-2"
              >
                <span>See how it works</span>
                <ChevronDown className="w-4 h-4 text-[#0F766E]" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                Insurance verified at lab intake
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#0F766E]" />
                Append-only audit chain
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="absolute -inset-6 bg-gradient-to-r from-[#0F766E]/15 via-[#14B8A6]/12 to-[#1677FF]/10 rounded-[3rem] blur-2xl pointer-events-none" />

            <div className="relative mx-auto w-full max-w-[340px]">
              <div className="relative rounded-[2.5rem] bg-[#0B1F1D] p-2.5 shadow-2xl shadow-teal-900/25">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0B1F1D] rounded-full z-10" />
                <div className="rounded-[2rem] bg-white overflow-hidden">

                  {screenIndex === 0 ? (
                    <div className="p-5 space-y-4 min-h-[560px]">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#0B1F1D]">Compare nearby labs</div>
                        <div className="text-[10px] font-mono text-[#0F766E]">3 results</div>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <Search className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">Full Blood Count</span>
                      </div>

                      {[
                        { name: 'Laboratoire Biodiagnostics', dist: '1.2 km', tat: '45 min', price: '6,500 XAF' },
                        { name: 'Polyclinique Bonanjo', dist: '2.8 km', tat: '1 h 15', price: '7,200 XAF' },
                        { name: 'Centre Médical Akwa', dist: '4.1 km', tat: '2 h', price: '5,800 XAF' }
                      ].map((lab, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs font-bold text-[#0B1F1D] leading-tight">
                              {lab.name}
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0" />
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
                            <div className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3 h-3 text-[#0F766E]" />
                              {lab.dist}
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <Clock className="w-3 h-3 text-[#0F766E]" />
                              {lab.tat}
                            </div>
                            <div className="text-right font-bold text-[#0B1F1D]">
                              {lab.price}
                            </div>
                          </div>
                        </div>
                      ))}

                      <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0D3B38] to-[#0F766E] text-white text-xs font-bold">
                        Continue to booking
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 space-y-4 min-h-[560px]">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#0B1F1D]">Sample in transit</div>
                        <div className="text-[10px] font-mono text-[#0F766E]">Live</div>
                      </div>

                      <div className="h-40 rounded-2xl bg-gradient-to-br from-teal-50 via-white to-blue-50 border border-teal-100 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#0F766E22 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <div className="absolute top-1/2 left-1/4 w-3 h-3 rounded-full bg-[#0F766E] ring-4 ring-teal-200" />
                        <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-[#1677FF] ring-4 ring-blue-200 animate-pulse" />
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] font-medium text-slate-600">
                          <span>Phlebotomist</span>
                          <span className="text-[#0F766E]">ETA 8 min</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[
                          { label: 'Intake', done: true },
                          { label: 'Sample collected', done: true },
                          { label: 'In transit', done: true, active: true },
                          { label: 'Lab receipt', done: false },
                          { label: 'Analysis', done: false },
                          { label: 'Validation', done: false },
                          { label: 'Signed & ready', done: false }
                        ].map((step, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                step.done
                                  ? step.active
                                    ? 'bg-[#1677FF] ring-4 ring-blue-100'
                                    : 'bg-[#0F766E]'
                                  : 'bg-slate-200'
                              }`}
                            >
                              {step.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <span
                              className={`text-xs ${
                                step.active
                                  ? 'font-bold text-[#0B1F1D]'
                                  : step.done
                                  ? 'font-medium text-slate-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Navigation className="w-3 h-3 text-[#0F766E]" />
                      Live GPS tracking
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Scan className="w-3 h-3 text-[#0F766E]" />
                      AI scan
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block absolute -top-6 -left-8 p-3 rounded-2xl bg-white border border-slate-200 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#0B1F1D]">Insurance split</div>
                    <div className="text-[10px] text-slate-500">80% / 20% copay</div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block absolute -bottom-6 -right-6 p-3 rounded-2xl bg-white border border-slate-200 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#1677FF]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#0B1F1D]">Batch invoice</div>
                    <div className="text-[10px] text-slate-500">5% on patient portion</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;