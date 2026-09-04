import React from 'react';
import { 
  FileX2, 
  Clock3, 
  AlertTriangle, 
  PhoneOff, 
  Shuffle, 
  SearchX,
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ProblemSectionProps {
  onGoToPortal: () => void;
}

export const ProblemSection: React.FC<ProblemSectionProps> = ({ onGoToPortal }) => {
  const challenges = [
    {
      title: 'Manual Paper Registries',
      desc: 'Physical logbooks lead to handwriting ambiguities, transcription errors, and missing patient demographics.',
      icon: FileX2
    },
    {
      title: 'Prolonged Turnaround Times',
      desc: 'Bottlenecks during specimen logging, bench transfers, and physical result signatures create frustrating delays.',
      icon: Clock3
    },
    {
      title: 'Disconnected Physician Coordination',
      desc: 'Doctors and partner clinics lack instant access to validated findings, relying on courier trips and phone calls.',
      icon: PhoneOff
    },
    {
      title: 'Fragmented Staff Workflows',
      desc: 'Without role-based software, phlebotomists, technicians, and biologists struggle with specimen handoffs.',
      icon: Shuffle
    },
    {
      title: 'Lost Patient Diagnostic Records',
      desc: 'Patients lose physical printouts, preventing doctors from comparing prior glucose, lipid, or biopsy values.',
      icon: SearchX
    },
    {
      title: 'Security & Audit Vulnerability',
      desc: 'Paper records lack tamper-proof digital seals, cryptographic validation, and access traceability.',
      icon: AlertTriangle
    }
  ];

  const solutions = [
    {
      title: 'Universal PID & Biometric KYC',
      desc: 'Instant patient recognition with permanent identification, insurance matching, and visit records.'
    },
    {
      title: 'Automated Sample Barcoding & Analyzer Queues',
      desc: 'Direct test tracking from phlebotomy collection tube to bench processing and delta-check.'
    },
    {
      title: 'Physician Portal & Instant WhatsApp Sharing',
      desc: 'Signed consolidated PDF reports delivered directly to physicians and patients in seconds.'
    },
    {
      title: 'Granular Multi-Role Permissions',
      desc: 'Dedicated workspaces for reception, tech bench, biologist sign-off, cashier, and admin.'
    }
  ];

  return (
    <section className="py-24 bg-[#0B1F3A]/40 relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#1677FF] uppercase tracking-wider bg-[#1677FF]/10 px-3.5 py-1 rounded-full border border-[#1677FF]/20">
            The Healthcare Operational Challenge
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Laboratories should not have to run on fragmented systems.
          </h2>
          <p className="text-sm sm:text-base text-[#AAB7C7] leading-relaxed">
            Many medical laboratories across Africa face daily operational hurdles caused by paper registers, disconnected communication, and isolated diagnostic benches.
          </p>
        </div>

        {/* Problem vs Solution Split Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Fragmented Challenges */}
          <div className="lg:col-span-6 rounded-3xl bg-[#07111F] border border-rose-500/20 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <h3 className="text-lg font-black text-white tracking-tight">
                  The Fragmented Reality
                </h3>
              </div>
              <p className="text-xs text-[#AAB7C7]">
                Traditional paper and isolated spreadsheets cause delays, lost files, and workflow friction.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {challenges.map((c, idx) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/15 space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{c.title}</span>
                      </div>
                      <p className="text-[11px] text-[#AAB7C7] leading-snug">
                        {c.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-medium">
              Result: Slower turnaround times, physician frustration, and increased administrative costs.
            </div>
          </div>

          {/* Right: The NanoLabs Solution */}
          <div className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-[#0B1F3A] to-[#07111F] border border-[#20C997]/30 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#20C997] animate-pulse" />
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  The NanoLabs Solution
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#20C997]/20 text-[#20C997] border border-[#20C997]/30">
                    Connected OS
                  </span>
                </h3>
              </div>
              <p className="text-xs text-[#AAB7C7]">
                Bringing every patient, test, examination, result, and doctor into one synchronized digital workflow.
              </p>

              <div className="space-y-3 pt-2">
                {solutions.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#07111F]/80 border border-white/10 hover:border-[#20C997]/40 transition-colors space-y-1"
                  >
                    <div className="flex items-center gap-2 text-[#20C997] font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#20C997]" />
                      <span className="text-white">{s.title}</span>
                    </div>
                    <p className="text-[11px] text-[#AAB7C7] pl-6 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-bold text-white">
                One platform. One workflow. One laboratory ecosystem.
              </div>
              <button
                onClick={onGoToPortal}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#1677FF] via-[#00A6A6] to-[#20C997] text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform"
              >
                <span>Experience System</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
