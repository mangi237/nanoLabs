import React from 'react';
import { 
  UserPlus, 
  TestTubes, 
  Cpu, 
  FileEdit, 
  CheckCircle, 
  Send, 
  ArrowRight,
  Sparkles 
} from 'lucide-react';

interface WorkflowSectionProps {
  onGoToPortal: () => void;
}

export const WorkflowSection: React.FC<WorkflowSectionProps> = ({ onGoToPortal }) => {
  const steps = [
    {
      num: '01',
      title: 'Search or Scan',
      desc: 'Search a test by name, category or symptom — or scan your doctor’s prescription and let the AI pre-select the required tests.',
      icon: TestTubes,
      color: '#0EA5E9'
    },
    {
      num: '02',
      title: 'Compare Nearby Labs',
      desc: 'See laboratories around you with transparent price, turnaround time, distance and accreditation, and pick one or several.',
      icon: FileEdit,
      color: '#14B8A6'
    },
    {
      num: '03',
      title: 'Choose Collection & Doctor',
      desc: 'Select walk-in or home sample collection (with live distance-based pricing) and credit your recommending doctor.',
      icon: UserPlus,
      color: '#2DD4BF'
    },
    {
      num: '04',
      title: 'Pay & Confirm',
      desc: 'Review your itemized invoice, then pay by cash or Mobile Money. The lab cashier verifies payment with a secure access code.',
      icon: Cpu,
      color: '#0EA5E9'
    },
    {
      num: '05',
      title: 'Track Your Sample',
      desc: 'Follow a live timeline — intake, phlebotomy, transit, bench analysis and quality validation — with WhatsApp and SMS updates.',
      icon: CheckCircle,
      color: '#2DD4BF'
    },
    {
      num: '06',
      title: 'Get & Share Results',
      desc: 'Download signed, lab-branded consolidated reports into your medical booklet and share them with your doctor in one tap.',
      icon: Send,
      color: '#0284C7'
    }
  ];

  return (
    <section id="workflow" className="py-24 bg-[#0A2C27]/40 relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider bg-[#2DD4BF]/10 px-3.5 py-1 rounded-full border border-[#2DD4BF]/20">
            How nanoLabs Works
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-balance">
            From search to result, in six simple steps.
          </h2>
          <p className="text-sm sm:text-base text-[#93B4AF] leading-relaxed">
            Book a lab test the way you book everything else — compare, choose, pay your way, and follow it through to a result you keep.
          </p>
        </div>

        {/* 6-Step Visual Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="group p-6 rounded-3xl bg-[#041C18] border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Top Number & Icon */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-white/20 group-hover:text-white/40 transition-colors">
                    {step.num}
                  </span>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6"
                    style={{ backgroundColor: `${step.color}20`, color: step.color }}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white group-hover:text-[#2DD4BF] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#93B4AF] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Step Connector Indicator */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Stage {idx + 1} of 6</span>
                  <span className="text-[#2DD4BF] font-bold">100% Traceable</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Callout */}
        <div className="mt-12 text-center">
          <button
            onClick={onGoToPortal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A2C27] hover:bg-[#0A2C27]/80 border border-white/15 text-white font-extrabold text-xs transition-all hover:scale-105 cursor-pointer"
          >
            <span>See the Complete Live Workflow in Action</span>
            <ArrowRight className="w-4 h-4 text-[#2DD4BF]" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
