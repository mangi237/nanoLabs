import React from 'react';
import {
  UserPlus,
  TestTubes,
  Cpu,
  FileEdit,
  CheckCircle,
  Send,
  ArrowRight,
} from 'lucide-react';

interface WorkflowSectionProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

export const WorkflowSection: React.FC<WorkflowSectionProps> = ({ onGoToPortal }) => {
  const steps = [
    {
      num: '01',
      title: 'Intake',
      desc: 'Patient arrives at the lab or is booked online. Receptionist confirms identity and insurance.',
      icon: UserPlus,
      color: '#1677FF'
    },
    {
      num: '02',
      title: 'Collected',
      desc: 'In-lab phlebotomy or mobile collection at home. Sample labelled with a tamper-evident barcode.',
      icon: TestTubes,
      color: '#14B8A6'
    },
    {
      num: '03',
      title: 'In transit',
      desc: 'For home collection, the phlebotomist\u2019s phone pings GPS. The patient sees the movement live.',
      icon: Cpu,
      color: '#0F766E'
    },
    {
      num: '04',
      title: 'Received & analysed',
      desc: 'Sample is received at the lab. Bench technician runs the analysis and logs every value.',
      icon: FileEdit,
      color: '#0F766E'
    },
    {
      num: '05',
      title: 'Validated & signed',
      desc: 'Biologist reviews, validates quality, and signs. Name is injected dynamically into the report.',
      icon: CheckCircle,
      color: '#0F766E'
    },
    {
      num: '06',
      title: 'Report delivered',
      desc: 'Lab-branded PDF with QR to the audit chain. Patient is notified. Doctor sees it the moment it\u2019s shared.',
      icon: Send,
      color: '#1677FF'
    }
  ];

  return (
    <section id="workflow" className="py-24 bg-[#F8FAF9] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
            From intake to signed report
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0B1F1D] tracking-tight">
            Every step, live for the patient.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Seven stages, all logged. Home collection adds a live map with ETA. Multi-lab batches produce separate reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="group p-6 rounded-3xl bg-white border border-slate-200 hover:border-teal-300 transition-all duration-300 hover:shadow-xl flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-slate-200 group-hover:text-[#0F766E]/40 transition-colors">
                    {step.num}
                  </span>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6"
                    style={{ backgroundColor: `${step.color}15`, color: step.color }}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-[#0B1F1D] group-hover:text-[#0F766E] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Stage {i + 1} of 6</span>
                  <span className="text-[#0F766E] font-bold">Audit logged</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => onGoToPortal()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 hover:border-teal-300 text-[#0B1F1D] font-bold text-xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>See the live workflow</span>
            <ArrowRight className="w-4 h-4 text-[#0F766E]" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;