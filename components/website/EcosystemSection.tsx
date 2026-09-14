import React, { useState } from 'react';
import {
  Building2,
  Users,
  Stethoscope,
  FileText,
  UserCheck,
  Smartphone,
  Activity,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface EcosystemSectionProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
}

export const EcosystemSection: React.FC<EcosystemSectionProps> = ({ onGoToPortal }) => {
  const [selectedNode, setSelectedNode] = useState<number>(0);

  const nodes = [
    {
      id: 0,
      title: 'Patients',
      icon: Users,
      color: '#0F766E',
      role: 'B2C Door',
      desc: 'Scan prescriptions, compare labs, book, pay with MoMo, track samples live, and share reports with doctors.'
    },
    {
      id: 1,
      title: 'Doctors',
      icon: Stethoscope,
      color: '#1677FF',
      role: 'Clinical Network',
      desc: 'Two-way patient connections, e-prescriptions, test recommendations, and referral credits.'
    },
    {
      id: 2,
      title: 'Laboratories',
      icon: Building2,
      color: '#0D3B38',
      role: 'B2B Door',
      desc: 'Keep your brand, prices, and staff. Add bookings, cashier verification, branded reports, and audit.'
    },
    {
      id: 3,
      title: 'Test Batches',
      icon: Layers,
      color: '#14B8A6',
      role: 'Unit of Billing',
      desc: 'Every collection event is one batch. One invoice, one 5% line, one report — never per test.'
    },
    {
      id: 4,
      title: 'Sample Tracking',
      icon: Activity,
      color: '#0F766E',
      role: '7 Stages',
      desc: 'Intake, collected, in transit, received, analysis, validation, signed and ready. Live for the patient.'
    },
    {
      id: 5,
      title: 'Branded Reports',
      icon: FileText,
      color: '#1677FF',
      role: 'Per Lab',
      desc: 'Every report carries its executing lab\u2019s header, logo, and biologist signature. Multi-lab = separate PDFs.'
    },
    {
      id: 6,
      title: 'Lab Staff',
      icon: UserCheck,
      color: '#14B8A6',
      role: '8+ Roles',
      desc: 'Receptionist, cashier, phlebotomist, technician, biologist, quality officer, admin, accountant.'
    },
    {
      id: 7,
      title: 'Patient Audit',
      icon: Smartphone,
      color: '#0D3B38',
      role: 'Automatic',
      desc: 'Booklet opened, report viewed, batch shared, booking confirmed — all logged without any signature.'
    }
  ];

  const renderNode = (node: typeof nodes[number], align: 'left' | 'right') => {
    const Icon = node.icon;
    const isSelected = selectedNode === node.id;
    return (
      <div
        key={node.id}
        onClick={() => setSelectedNode(node.id)}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          isSelected
            ? `bg-white border-[#0F766E] shadow-lg ${align === 'left' ? 'translate-x-2' : '-translate-x-2'}`
            : 'bg-white/60 border-slate-200 hover:bg-white hover:border-teal-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${node.color}15`, color: node.color }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#0B1F1D] truncate">{node.title}</h4>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                {node.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{node.desc}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="ecosystem" className="py-24 bg-[#F8FAF9] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-teal-200 text-xs font-bold text-[#0F766E]">
            <Activity className="w-3.5 h-3.5" />
            <span>One connected diagnostic hub</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0B1F1D] tracking-tight">
            Three doors. One record.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Patients, doctors, and laboratories each have their own door — but everything lives on one platform, one record, one audit.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-4 space-y-2">
            {nodes.slice(0, 4).map((n) => renderNode(n, 'left'))}
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#0D3B38] via-[#0F766E] to-[#14B8A6] p-1 shadow-2xl shadow-teal-900/30">
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
                  <Activity className="w-12 h-12 text-[#0F766E] stroke-[2.5]" />
                </div>
              </div>
              <div className="absolute -inset-4 rounded-full border border-teal-200 animate-ping pointer-events-none opacity-40" />
            </div>

            <h3 className="text-xl font-black text-[#0B1F1D] mb-1">
              nanoLabs Hub
            </h3>
            <p className="text-xs text-[#0F766E] font-semibold mb-4">
              Batch-based. Audit-chained.
            </p>

            <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0B1F1D]">{nodes[selectedNode].title}</span>
                <span className="text-[10px] text-[#0F766E] font-mono font-bold">CONNECTED</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {nodes[selectedNode].desc}
              </p>
            </div>

            <button
              onClick={() => onGoToPortal()}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0D3B38] to-[#0F766E] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <span>Explore the hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="lg:col-span-4 space-y-2">
            {nodes.slice(4, 8).map((n) => renderNode(n, 'right'))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;