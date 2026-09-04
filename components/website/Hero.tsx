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
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-[#07111F]">
      {/* Background Lighting & Ambient Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#1677FF]/20 via-[#00A6A6]/15 to-[#7C5CFC]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#20C997]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tag & Identity Chip */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0B1F3A] border border-white/15 backdrop-blur-md shadow-inner animate-in fade-in slide-in-from-bottom-3 duration-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20C997] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#20C997]"></span>
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              {siteConfig.supportingTagline}
            </span>
            <span className="text-xs">🇨🇲</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] font-sans">
            The Operating System <br />
            <span className="bg-gradient-to-r from-[#1677FF] via-[#00A6A6] to-[#20C997] bg-clip-text text-transparent">
              for Modern Laboratories.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-xl text-[#AAB7C7] font-normal leading-relaxed max-w-2xl mx-auto">
            {siteConfig.description}
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
            {/* The Big Main Portal Button */}
            <button
              onClick={onGoToPortal}
              id="hero-go-to-portal-btn"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#1677FF] via-[#00A6A6] to-[#20C997] text-white font-extrabold text-sm sm:text-base shadow-2xl shadow-[#1677FF]/35 hover:shadow-[#00A6A6]/45 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group"
            >
              <span>Continue to Portal</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>

            {/* Explore Anchor */}
            <a
              href="#product"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#0B1F3A]/80 hover:bg-[#0B1F3A] border border-white/15 text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 hover:border-white/30"
            >
              <span>Explore NanoLabs</span>
              <ChevronDown className="w-4 h-4 text-[#20C997]" />
            </a>
          </div>

          {/* Trust Metrics Sub-strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-[#AAB7C7]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#20C997]" />
              Cameroon Clinical Standard
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:inline-block" />
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#1677FF]" />
              Real-Time WhatsApp & Signed PDF Delivery
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:inline-block" />
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#7C5CFC]" />
              Client-Side Sealed Envelope Encryption
            </span>
          </div>
        </div>

        {/* 3D Perspective Product Mockup with Floating UI Elements */}
        <div className="mt-14 sm:mt-20 relative max-w-5xl mx-auto">
          {/* Ambient glow behind laptop */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#1677FF]/30 via-[#00A6A6]/20 to-[#20C997]/25 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

          {/* Browser / Desktop Application Frame */}
          <div className="relative rounded-3xl bg-[#0B1F3A] border border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-500 hover:border-[#00A6A6]/50">
            {/* Window Top Navigation Bar */}
            <div className="bg-[#07111F] px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-[11px] font-mono text-[#AAB7C7] hidden sm:inline-block">
                  https://app.nanolabs.health/dashboard • Yaoundé & Douala Live Gateway
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#20C997]/20 text-[#20C997] border border-[#20C997]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" />
                  Live Operational
                </span>
              </div>
            </div>

            {/* Interactive Mockup Body */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gradient-to-b from-[#0B1F3A] to-[#07111F]">
              {/* Mockup Header Inside Window */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-[#20C997]">
                    <Activity className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      Central Diagnostic Laboratory
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        Douala Hub
                      </span>
                    </h3>
                    <p className="text-xs text-[#AAB7C7]">
                      Multi-tenant Clinical Laboratory Information Management System
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onGoToPortal}
                    className="px-4 py-2 bg-gradient-to-r from-[#1677FF] to-[#00A6A6] hover:from-[#1677FF]/90 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid Metrics Telemetry inside Window */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 rounded-2xl bg-[#07111F]/80 border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#AAB7C7] flex items-center justify-between">
                    <span>Active Samples</span>
                    <TestTube2 className="w-3.5 h-3.5 text-[#1677FF]" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">148</div>
                  <div className="text-[10px] text-[#20C997] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 92% on-time turnaround
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#07111F]/80 border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#AAB7C7] flex items-center justify-between">
                    <span>Patients Registered</span>
                    <Users className="w-3.5 h-3.5 text-[#20C997]" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">2,410</div>
                  <div className="text-[10px] text-[#1677FF] font-semibold">
                    Biometric & PID Verified
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#07111F]/80 border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#AAB7C7] flex items-center justify-between">
                    <span>Validated Batches</span>
                    <FileCheck2 className="w-3.5 h-3.5 text-[#00A6A6]" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">89</div>
                  <div className="text-[10px] text-[#20C997] font-semibold">
                    ONMC Biologist Signed
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#07111F]/80 border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#AAB7C7] flex items-center justify-between">
                    <span>Physician Network</span>
                    <Stethoscope className="w-3.5 h-3.5 text-[#7C5CFC]" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">42</div>
                  <div className="text-[10px] text-[#7C5CFC] font-semibold">
                    Connected Clinics
                  </div>
                </div>
              </div>

              {/* Sample Workflow Table Simulation inside Hero Window */}
              <div className="rounded-2xl bg-[#07111F]/90 border border-white/10 overflow-hidden text-xs">
                <div className="bg-[#0B1F3A]/90 px-4 py-2.5 border-b border-white/10 flex items-center justify-between font-bold text-[#AAB7C7]">
                  <span>Recent Diagnostic Test Batches</span>
                  <span className="text-[10px] text-[#20C997] font-mono">Auto-Syncing</span>
                </div>
                <div className="divide-y divide-white/5 font-mono">
                  {[
                    { id: 'BAT-9042', patient: 'Ambe Christian M.', test: 'Full Blood Count + Lipid Panel + Glucose', status: 'Ready (Signed PDF)', time: '4 mins ago', flag: 'Ready' },
                    { id: 'BAT-9041', patient: 'Ngo Bisseck Claire', test: 'Widal Reaction + Urinalysis Sediment', status: 'Biologist Sign-Off', time: '12 mins ago', flag: 'Review' },
                    { id: 'BAT-9040', patient: 'Fotsing Jean-Paul', test: 'Liver Function Panel + Creatinine', status: 'Analyzer Processing', time: '28 mins ago', flag: 'Processing' }
                  ].map((row) => (
                    <div key={row.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[11px] font-bold">
                          {row.id}
                        </span>
                        <div>
                          <div className="font-bold text-white font-sans">{row.patient}</div>
                          <div className="text-[11px] text-[#AAB7C7] font-sans">{row.test}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.flag === 'Ready' ? 'bg-[#20C997]/20 text-[#20C997] border border-[#20C997]/30' :
                          row.flag === 'Review' ? 'bg-[#1677FF]/20 text-[#1677FF] border border-[#1677FF]/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {row.status}
                        </span>
                        <span className="text-[10px] text-[#AAB7C7]">{row.time}</span>
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
            <div className="absolute -top-6 -left-8 p-3 rounded-2xl bg-[#0B1F3A]/95 border border-white/15 shadow-xl backdrop-blur-md flex items-center gap-3 animate-bounce duration-1000">
              <div className="w-8 h-8 rounded-xl bg-[#1677FF]/20 text-[#1677FF] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-[#AAB7C7] font-bold uppercase">Patient Portal</div>
                <div className="text-xs font-black text-white">Yebo KYC & WhatsApp</div>
              </div>
            </div>

            {/* Badge 2: Sealed Envelope */}
            <div className="absolute -bottom-6 -right-6 p-3 rounded-2xl bg-[#0B1F3A]/95 border border-white/15 shadow-xl backdrop-blur-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#20C997]/20 text-[#20C997] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-[#AAB7C7] font-bold uppercase">Sealed Envelope</div>
                <div className="text-xs font-black text-white">AES-256 Tamper-Proof</div>
              </div>
            </div>

            {/* Badge 3: Doctors */}
            <div className="absolute top-1/2 -right-10 -translate-y-1/2 p-3 rounded-2xl bg-[#0B1F3A]/95 border border-white/15 shadow-xl backdrop-blur-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-[#AAB7C7] font-bold uppercase">Physician Network</div>
                <div className="text-xs font-black text-white">Direct E-Prescriptions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
