import React from 'react';
import { 
  ArrowRight, 
  ChevronDown, 
  ShieldCheck, 
  Activity, 
  Users, 
  TestTube2, 
  FileCheck2, 
  Stethoscope, 
  Smartphone, 
  Lock, 
  Sparkles,
  CheckCircle2,
  Cpu,
  Clock,
  Zap,
  Building2
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface HeroProps {
  onGoToPortal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGoToPortal }) => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-[#041C18]">
      {/* Background Lighting & Ambient Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#0EA5E9]/20 via-[#14B8A6]/15 to-[#0284C7]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#2DD4BF]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tag & Identity Chip */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0A2C27] border border-white/15 backdrop-blur-md shadow-inner animate-in fade-in slide-in-from-bottom-3 duration-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4BF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2DD4BF]"></span>
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              {siteConfig.supportingTagline}
            </span>
            {/* <span className="text-xs">🇨🇲</span> */}
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] font-sans text-balance">
            Find, compare and book <br />
            <span className="bg-gradient-to-r from-[#0EA5E9] via-[#14B8A6] to-[#2DD4BF] bg-clip-text text-transparent">
              lab tests near you.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-xl text-[#93B4AF] font-normal leading-relaxed max-w-2xl mx-auto">
            {siteConfig.description}
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
            {/* The Big Main Portal Button */}
            <button
              onClick={onGoToPortal}
              id="hero-go-to-portal-btn"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] via-[#14B8A6] to-[#2DD4BF] text-white font-extrabold text-sm sm:text-base shadow-2xl shadow-[#0EA5E9]/35 hover:shadow-[#14B8A6]/45 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group"
            >
              <span>Continue to Portal</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>

            {/* Explore Anchor */}
            <a
              href="#product"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#0A2C27]/80 hover:bg-[#0A2C27] border border-white/15 text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 hover:border-white/30"
            >
              <span>Explore NanoLabs</span>
              <ChevronDown className="w-4 h-4 text-[#2DD4BF]" />
            </a>
          </div>

          {/* Trust Metrics Sub-strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-[#93B4AF]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2DD4BF]" />
              Transparent lab pricing
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:inline-block" />
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#0EA5E9]" />
              Pay with MoMo, Orange Money or cash
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:inline-block" />
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#0284C7]" />
              Tamper-proof results you keep
            </span>
          </div>
        </div>

        {/* 3D Perspective Product Mockup with Floating UI Elements */}
        <div className="mt-14 sm:mt-20 relative max-w-5xl mx-auto">
          {/* Ambient glow behind laptop */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#0EA5E9]/30 via-[#14B8A6]/20 to-[#2DD4BF]/25 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

          {/* Browser / Desktop Application Frame */}
          <div className="relative rounded-3xl bg-[#0A2C27] border border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-500 hover:border-[#14B8A6]/50">
            {/* Window Top Navigation Bar */}
            <div className="bg-[#041C18] px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-[11px] font-mono text-[#93B4AF] hidden sm:inline-block">
                  app.nanolabs.health/book • Douala & Yaoundé
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
                  Live Operational
                </span>
              </div>
            </div>

            {/* Interactive Mockup Body */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gradient-to-b from-[#0A2C27] to-[#041C18]">
              {/* Mockup Header Inside Window */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-[#2DD4BF]">
                    <Activity className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      Full Blood Count + Malaria
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        Near you
                      </span>
                    </h3>
                    <p className="text-xs text-[#93B4AF]">
                      Comparing 6 nearby laboratories by price, turnaround and distance
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onGoToPortal}
                    className="px-4 py-2 bg-gradient-to-r from-[#0EA5E9] to-[#14B8A6] hover:from-[#0EA5E9]/90 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Book a test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid Metrics Telemetry inside Window */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 rounded-2xl bg-[#041C18]/80 border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#93B4AF] flex items-center justify-between">
                    <span>Nearby Labs</span>
                    <Building2 className="w-3.5 h-3.5 text-[#0EA5E9]" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">6</div>
                  <div className="text-[10px] text-[#2DD4BF] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Accredited &amp; verified
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#041C18]/80 border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#93B4AF] flex items-center justify-between">
                    <span>Best Price</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#2DD4BF]" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">4,500</div>
                  <div className="text-[10px] text-[#0EA5E9] font-semibold">
                    XAF · CityLab Bonapriso
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#041C18]/80 border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#93B4AF] flex items-center justify-between">
                    <span>Fastest Result</span>
                    <Clock className="w-3.5 h-3.5 text-[#14B8A6]" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">2 hrs</div>
                  <div className="text-[10px] text-[#2DD4BF] font-semibold">
                    Turnaround time
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#041C18]/80 border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#93B4AF] flex items-center justify-between">
                    <span>Home Collection</span>
                    <Smartphone className="w-3.5 h-3.5 text-[#0284C7]" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">4/6</div>
                  <div className="text-[10px] text-[#0284C7] font-semibold">
                    Labs collect at home
                  </div>
                </div>
              </div>

              {/* Sample Workflow Table Simulation inside Hero Window */}
              <div className="rounded-2xl bg-[#041C18]/90 border border-white/10 overflow-hidden text-xs">
                <div className="bg-[#0A2C27]/90 px-4 py-2.5 border-b border-white/10 flex items-center justify-between font-bold text-[#93B4AF]">
                  <span>Nearby laboratories for your tests</span>
                  <span className="text-[10px] text-[#2DD4BF] font-mono">Sorted by price</span>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { lab: 'CityLab Bonapriso', tag: 'Accredited', price: '4,500', tat: '2 hrs', dist: '1.2 km', home: true, best: 'Cheapest' },
                    { lab: 'BioSanté Akwa', tag: 'Accredited', price: '5,200', tat: '90 min', dist: '2.8 km', home: true, best: 'Fastest' },
                    { lab: 'Laboratoire Central', tag: 'Accredited', price: '6,000', tat: '4 hrs', dist: '0.6 km', home: false, best: 'Closest' }
                  ].map((row) => (
                    <div key={row.lab} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-[#14B8A6]/15 text-[#2DD4BF] flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {row.lab}
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2DD4BF]/15 text-[#2DD4BF] uppercase tracking-wide">{row.best}</span>
                          </div>
                          <div className="text-[11px] text-[#93B4AF] flex items-center gap-2">
                            <span>{row.tat} turnaround</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span>{row.dist}</span>
                            {row.home && <span className="text-[#0EA5E9] font-semibold">Home visit</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pl-10 sm:pl-0">
                        <div className="text-right">
                          <div className="font-black text-white font-mono">{row.price}<span className="text-[10px] text-[#93B4AF] font-sans"> XAF</span></div>
                        </div>
                        <span className="px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#0EA5E9] to-[#14B8A6] text-white">
                          Book
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating Orbiting Badges around Hero Mockup */}
          <div className="hidden lg:block">
            {/* Badge 1: Patients */}
            <div className="absolute -top-6 -left-8 p-3 rounded-2xl bg-[#0A2C27]/95 border border-white/15 shadow-xl backdrop-blur-md flex items-center gap-3 animate-bounce duration-1000">
              <div className="w-8 h-8 rounded-xl bg-[#0EA5E9]/20 text-[#0EA5E9] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-[#93B4AF] font-bold uppercase">AI Scanner</div>
                <div className="text-xs font-black text-white">Scan your prescription</div>
              </div>
            </div>

            {/* Badge 2: Mobile Money */}
            <div className="absolute -bottom-6 -right-6 p-3 rounded-2xl bg-[#0A2C27]/95 border border-white/15 shadow-xl backdrop-blur-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#2DD4BF]/20 text-[#2DD4BF] flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-[#93B4AF] font-bold uppercase">Payments</div>
                <div className="text-xs font-black text-white">MoMo &amp; Orange Money</div>
              </div>
            </div>

            {/* Badge 3: Doctors */}
            <div className="absolute top-1/2 -right-10 -translate-y-1/2 p-3 rounded-2xl bg-[#0A2C27]/95 border border-white/15 shadow-xl backdrop-blur-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0284C7]/20 text-[#0284C7] flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-[#93B4AF] font-bold uppercase">Doctor Network</div>
                <div className="text-xs font-black text-white">Connect &amp; consult</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
