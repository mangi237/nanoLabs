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
      title: 'Patient Registered',
      desc: 'Front desk generates or matches the unique Patient ID (PID), registers insurance coverage, and prints specimen tube barcodes.',
      icon: UserPlus,
      color: '#1677FF'
    },
    {
      num: '02',
      title: 'Tests Requested',
      desc: 'Examinations are queued by department (Hematology, Biochem, Microbiology) with priority tags for urgent/stat specimens.',
      icon: TestTubes,
      color: '#00A6A6'
    },
    {
      num: '03',
      title: 'Laboratory Processing',
      desc: 'Specimens are loaded into automated analyzers or technical bench benches with real-time specimen tracking.',
      icon: Cpu,
      color: '#20C997'
    },
    {
      num: '04',
      title: 'Results Entered & Checked',
      desc: 'Quantitative values and qualitative observations are logged with automated delta-checking against reference intervals.',
      icon: FileEdit,
      color: '#1677FF'
    },
    {
      num: '05',
      title: 'Biologist Validation',
      desc: 'Licensed Medical Biologist reviews consolidated findings, adds clinical interpretation notes, and applies the digital ONMC seal.',
      icon: CheckCircle,
      color: '#20C997'
    },
    {
      num: '06',
      title: 'Patient & Doctor Delivery',
      desc: 'Instant delivery of signed consolidated multi-test PDF batches via WhatsApp, SMS, and confidential sealed patient envelopes.',
      icon: Send,
      color: '#7C5CFC'
    }
  ];

  return (
    <section id="workflow" className="py-24 bg-[#0B1F3A]/40 relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#20C997] uppercase tracking-wider bg-[#20C997]/10 px-3.5 py-1 rounded-full border border-[#20C997]/20">
            End-to-End Diagnostic Pipeline
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            From patient registration to result delivery.
          </h2>
          <p className="text-sm sm:text-base text-[#AAB7C7] leading-relaxed">
            A seamless six-step workflow eliminating manual transcription delays and keeping every healthcare stakeholder in sync.
          </p>
        </div>

        {/* 6-Step Visual Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="group p-6 rounded-3xl bg-[#07111F] border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between space-y-4 relative overflow-hidden"
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
                  <h3 className="text-lg font-black text-white group-hover:text-[#20C997] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#AAB7C7] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Step Connector Indicator */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Stage {idx + 1} of 6</span>
                  <span className="text-[#20C997] font-bold">100% Traceable</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Callout */}
        <div className="mt-12 text-center">
          <button
            onClick={onGoToPortal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#0B1F3A]/80 border border-white/15 text-white font-extrabold text-xs transition-all hover:scale-105 cursor-pointer"
          >
            <span>See the Complete Live Workflow in Action</span>
            <ArrowRight className="w-4 h-4 text-[#20C997]" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
