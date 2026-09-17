import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, TestTubes, Truck, FileEdit, CheckCircle, Send, ArrowRight } from 'lucide-react';

interface WorkflowSectionProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

const steps = [
  { num: '01', title: 'Intake', desc: 'Patient arrives at the lab or is booked online. Receptionist confirms identity and insurance.', Icon: UserPlus, color: '#1677FF' },
  { num: '02', title: 'Collected', desc: 'In-lab phlebotomy or mobile collection at home. Sample labelled with a tamper-evident barcode.', Icon: TestTubes, color: '#14B8A6' },
  { num: '03', title: 'In transit', desc: 'For home collection, the phlebotomist\u2019s phone pings GPS. The patient sees the movement live.', Icon: Truck, color: '#0F766E' },
  { num: '04', title: 'Received & analysed', desc: 'Sample is received at the lab. Bench technician runs the analysis and logs every value.', Icon: FileEdit, color: '#0F766E' },
  { num: '05', title: 'Validated & signed', desc: 'Biologist reviews, validates quality, and signs. Name is injected dynamically into the report.', Icon: CheckCircle, color: '#14B8A6' },
  { num: '06', title: 'Report delivered', desc: 'Lab-branded PDF with QR to the audit chain. Patient is notified. Doctor sees it on share.', Icon: Send, color: '#1677FF' },
];

export const WorkflowSection: React.FC<WorkflowSectionProps> = ({ onGoToPortal }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % steps.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="workflow" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-nl-teal uppercase tracking-wider bg-nl-mint px-3.5 py-1 rounded-full border border-nl-light/30">
            From intake to signed report
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-nl-ink tracking-tight font-display">
            Every step, live for the patient.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Seven stages, all logged. Home collection adds a live map with ETA. Multi-lab batches produce separate reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const isActive = active === i;
            return (
              <motion.div
                key={step.num}
                onClick={() => setActive(i)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className={`group p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isActive
                    ? 'bg-nl-mint/40 border-nl-teal shadow-xl shadow-teal-900/10'
                    : 'bg-nl-off border-slate-200 hover:border-nl-teal/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-black font-mono transition-colors ${isActive ? 'text-nl-teal' : 'text-slate-300'}`}>
                    {step.num}
                  </span>
                  <motion.div
                    animate={isActive ? { rotate: [0, 8, -8, 0] } : {}}
                    transition={{ duration: 1.5 }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${step.color}15`, color: step.color }}
                  >
                    <step.Icon className="w-6 h-6" strokeWidth={2.2} />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <h3 className={`text-lg font-black transition-colors font-display ${isActive ? 'text-nl-deep' : 'text-nl-ink'}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Stage {i + 1} of 6</span>
                  <span className={isActive ? 'text-nl-teal font-bold' : ''}>
                    {isActive ? 'Live now' : 'Audit logged'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => onGoToPortal()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-nl-off border border-slate-200 hover:border-nl-teal/40 text-nl-ink font-bold text-xs transition-all hover:scale-[1.03] cursor-pointer"
          >
            <span>See the live workflow</span>
            <ArrowRight className="w-4 h-4 text-nl-teal" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;