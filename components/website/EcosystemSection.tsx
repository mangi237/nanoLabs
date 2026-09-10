import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  TestTube, 
  FileText, 
  UserCheck, 
  Stethoscope, 
  Share2, 
  Smartphone,
  Activity,
  ArrowRight,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface EcosystemSectionProps {
  onGoToPortal: () => void;
}

export const EcosystemSection: React.FC<EcosystemSectionProps> = ({ onGoToPortal }) => {
  const [selectedNode, setSelectedNode] = useState<number>(0);

  const nodes = [
    {
      id: 0,
      title: 'Patients',
      icon: Users,
      color: '#2DD4BF',
      role: 'B2C Hub',
      desc: 'Search tests, scan prescriptions, compare labs, book, pay with cash or MoMo, and keep every result in one medical booklet.'
    },
    {
      id: 1,
      title: 'Test Search & AI Scan',
      icon: TestTube,
      color: '#14B8A6',
      role: 'Discovery',
      desc: 'An 80+ test catalog searchable by name, category or symptom, plus an AI scanner that reads your prescription and pre-selects tests.'
    },
    {
      id: 2,
      title: 'Lab Marketplace',
      icon: Building2,
      color: '#0EA5E9',
      role: 'Compare & Book',
      desc: 'See nearby laboratories with transparent price, turnaround time, distance and accreditation — book one lab or several at once.'
    },
    {
      id: 3,
      title: 'Payments & Cashier',
      icon: Smartphone,
      color: '#2DD4BF',
      role: 'Cash & MoMo',
      desc: 'Dynamic invoices with distance-based home collection and a small online platform percentage, verified by cashier access code.'
    },
    {
      id: 4,
      title: 'Doctor Network',
      icon: Stethoscope,
      color: '#0284C7',
      role: 'Connect & Consult',
      desc: 'Connect with your doctor, share results in one tap, book video or in-person consultations, and receive digital prescriptions.'
    },
    {
      id: 5,
      title: 'Laboratories (LIMS)',
      icon: UserCheck,
      color: '#14B8A6',
      role: 'Lab Engine',
      desc: 'Reception, cashier, technical bench and biologist sign-off in one workspace, with lab-branded reports and configurable pricing.'
    },
    {
      id: 6,
      title: 'Live Sample Tracking',
      icon: Share2,
      color: '#0EA5E9',
      role: 'Transparency',
      desc: 'Follow each sample from intake to phlebotomy, transit, analysis, validation and signed-ready with a real-time status timeline.'
    },
    {
      id: 7,
      title: 'Results & Booklet',
      icon: FileText,
      color: '#2DD4BF',
      role: 'Records You Keep',
      desc: 'Signed, tamper-proof consolidated reports grouped by laboratory batch, delivered by WhatsApp and stored forever.'
    }
  ];

  return (
    <section id="ecosystem" className="py-24 bg-[#041C18] relative overflow-hidden border-t border-white/5">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#14B8A6]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0A2C27] border border-white/10 text-xs font-bold text-[#2DD4BF]">
            <Zap className="w-3.5 h-3.5" />
            <span>Patients · Doctors · Laboratories</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-balance">
            One platform for your whole diagnostic journey.
          </h2>
          <p className="text-sm sm:text-base text-[#93B4AF] leading-relaxed">
            nanoLabs connects patients, doctors and laboratories in a single flow — from searching a test to comparing labs, paying, tracking your sample and sharing the result with your doctor.
          </p>
        </div>

        {/* Central Ecosystem Visual with Node Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Interactive Node List */}
          <div className="lg:col-span-4 space-y-2">
            {nodes.slice(0, 4).map((node) => {
              const Icon = node.icon;
              const isSelected = selectedNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0A2C27] border-[#2DD4BF]/60 shadow-xl shadow-[#2DD4BF]/10 translate-x-2'
                      : 'bg-[#0A2C27]/40 border-white/5 hover:bg-[#0A2C27]/80 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${node.color}20`, color: node.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{node.title}</h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#93B4AF]">
                          {node.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#93B4AF] line-clamp-1 mt-0.5">{node.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Column: Hub Core Visual */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0A2C27] to-[#041C18] border border-white/15 shadow-2xl relative">
            {/* Glowing Hub Logo */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#0EA5E9] via-[#14B8A6] to-[#2DD4BF] p-1 shadow-2xl shadow-[#0EA5E9]/40 animate-pulse">
                <div className="w-full h-full bg-[#041C18] rounded-[22px] flex items-center justify-center">
                  <Activity className="w-12 h-12 text-[#2DD4BF] stroke-[2.5]" />
                </div>
              </div>
              <div className="absolute -inset-4 rounded-full border border-[#2DD4BF]/20 animate-ping pointer-events-none" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              NanoLabs OS Core
            </h3>
            <p className="text-xs text-[#2DD4BF] font-semibold mb-4">
              Real-Time Synchronized Data Hub
            </p>

            {/* Selected Node Detailed Preview Card */}
            <div className="w-full p-4 rounded-2xl bg-[#041C18]/90 border border-white/10 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{nodes[selectedNode].title}</span>
                <span className="text-[10px] text-[#2DD4BF] font-mono font-bold">CONNECTED</span>
              </div>
              <p className="text-xs text-[#93B4AF] leading-relaxed">
                {nodes[selectedNode].desc}
              </p>
            </div>

            <button
              onClick={onGoToPortal}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#14B8A6] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-102 transition-transform"
            >
              <span>Explore Portal Ecosystem</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Column: Interactive Node List (Nodes 4-7) */}
          <div className="lg:col-span-4 space-y-2">
            {nodes.slice(4, 8).map((node) => {
              const Icon = node.icon;
              const isSelected = selectedNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0A2C27] border-[#2DD4BF]/60 shadow-xl shadow-[#2DD4BF]/10 -translate-x-2'
                      : 'bg-[#0A2C27]/40 border-white/5 hover:bg-[#0A2C27]/80 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${node.color}20`, color: node.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{node.title}</h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#93B4AF]">
                          {node.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#93B4AF] line-clamp-1 mt-0.5">{node.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;
