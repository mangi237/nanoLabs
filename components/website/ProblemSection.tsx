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
      title: 'No Way to Compare Prices',
      desc: 'Patients call around or walk lab to lab with no clear view of price, turnaround time or distance before paying.',
      icon: SearchX
    },
    {
      title: 'Long, Uncertain Waits',
      desc: 'You hand over a sample and hope — with no visibility into where your test is or when the result will be ready.',
      icon: Clock3
    },
    {
      title: 'Paper Results Get Lost',
      desc: 'Printouts are misplaced, so doctors cannot compare your previous glucose, lipid or blood values over time.',
      icon: FileX2
    },
    {
      title: 'Confusing, Opaque Bills',
      desc: 'Sampling acts, home-visit fees and coverage splits are unclear, and cash-only desks make payment stressful.',
      icon: AlertTriangle
    },
    {
      title: 'Disconnected From Your Doctor',
      desc: 'Sharing results means physical courier trips and phone calls instead of a secure one-tap share.',
      icon: PhoneOff
    },
    {
      title: 'Travel Required for Everything',
      desc: 'A simple blood draw means leaving work or home, even when a phlebotomist could collect the sample where you are.',
      icon: Shuffle
    }
  ];

  const solutions = [
    {
      title: 'Compare Every Nearby Lab',
      desc: 'Transparent price, turnaround time, distance and accreditation side by side before you commit.'
    },
    {
      title: 'Book, Scan & Pay in Minutes',
      desc: 'Scan your prescription, pick walk-in or home collection, and pay by cash or Mobile Money.'
    },
    {
      title: 'Track Your Sample Live',
      desc: 'A real-time status timeline from intake to signed-ready, with WhatsApp and SMS updates.'
    },
    {
      title: 'Own & Share Your Records',
      desc: 'Every signed result lives in your medical booklet, shareable with any connected doctor in one tap.'
    }
  ];

  return (
    <section className="py-24 bg-[#0A2C27]/40 relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#0EA5E9] uppercase tracking-wider bg-[#0EA5E9]/10 px-3.5 py-1 rounded-full border border-[#0EA5E9]/20">
            Getting a lab test should not be this hard
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight text-balance">
            Booking a lab test should be simple, clear and fair.
          </h2>
          <p className="text-sm sm:text-base text-[#93B4AF] leading-relaxed">
            Across Cameroon, patients still guess at prices, wait blindly on paper results, and lose their history. nanoLabs replaces that with a transparent, trackable experience you control.
          </p>
        </div>

        {/* Problem vs Solution Split Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Fragmented Challenges */}
          <div className="lg:col-span-6 rounded-3xl bg-[#041C18] border border-rose-500/20 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <h3 className="text-lg font-black text-white tracking-tight">
                  The Fragmented Reality
                </h3>
              </div>
              <p className="text-xs text-[#93B4AF]">
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
                      <p className="text-[11px] text-[#93B4AF] leading-snug">
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
          <div className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-[#0A2C27] to-[#041C18] border border-[#2DD4BF]/30 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#2DD4BF] animate-pulse" />
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  The NanoLabs Solution
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30">
                    Connected OS
                  </span>
                </h3>
              </div>
              <p className="text-xs text-[#93B4AF]">
                Bringing every patient, test, examination, result, and doctor into one synchronized digital workflow.
              </p>

              <div className="space-y-3 pt-2">
                {solutions.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#041C18]/80 border border-white/10 hover:border-[#2DD4BF]/40 transition-colors space-y-1"
                  >
                    <div className="flex items-center gap-2 text-[#2DD4BF] font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2DD4BF]" />
                      <span className="text-white">{s.title}</span>
                    </div>
                    <p className="text-[11px] text-[#93B4AF] pl-6 leading-relaxed">
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
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#0EA5E9] via-[#14B8A6] to-[#2DD4BF] text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform"
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
