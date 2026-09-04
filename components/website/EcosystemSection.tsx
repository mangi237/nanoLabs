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
      title: 'Laboratories & Hubs',
      icon: Building2,
      color: '#1677FF',
      role: 'Core Engine',
      desc: 'Centralized multi-tenant LIMS managing sample queues, analyzer interfaces, quality control, and inventory.'
    },
    {
      id: 1,
      title: 'Patients',
      icon: Users,
      color: '#20C997',
      role: 'Identity & Intake',
      desc: 'Permanent Patient Identification (PID), digital check-in, biometric Yebo KYC verification, and booking history.'
    },
    {
      id: 2,
      title: 'Tests & Examinations',
      icon: TestTube,
      color: '#00A6A6',
      role: 'Clinical Catalog',
      desc: 'Standardized examination catalog spanning Hematology, Microbiology, Biochemistry, Serology, and Parasitology.'
    },
    {
      id: 3,
      title: 'Results & Validation',
      icon: FileText,
      color: '#20C997',
      role: 'Sign-Off & Quality',
      desc: 'Multi-tier review with automated reference intervals, delta-checks, and ONMC biologist cryptographic validation.'
    },
    {
      id: 4,
      title: 'Laboratory Staff',
      icon: UserCheck,
      color: '#7C5CFC',
      role: 'Role Workspaces',
      desc: 'Purpose-built interfaces for receptionists, phlebotomists, bench technicians, cashiers, and managers.'
    },
    {
      id: 5,
      title: 'Doctors & Clinicians',
      icon: Stethoscope,
      color: '#1677FF',
      role: 'Clinical Partner',
      desc: 'Dedicated physician portal to order panels, review antibiograms, and consult longitudinal patient results.'
    },
    {
      id: 6,
      title: 'Referrals & Clinics',
      icon: Share2,
      color: '#00A6A6',
      role: 'Network Growth',
      desc: 'Transparent referral tracking, automated fee distribution, and real-time specimen pickup dispatching.'
    },
    {
      id: 7,
      title: 'Patient Portal',
      icon: Smartphone,
      color: '#20C997',
      role: 'Digital Access',
      desc: 'Sealed tactile envelope unsealing, instant WhatsApp notifications, and consolidated signed PDF downloads.'
    }
  ];

  return (
    <section id="ecosystem" className="py-24 bg-[#07111F] relative overflow-hidden border-t border-white/5">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00A6A6]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B1F3A] border border-white/10 text-xs font-bold text-[#20C997]">
            <Zap className="w-3.5 h-3.5" />
            <span>Connected HealthTech Infrastructure</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            One connected laboratory ecosystem.
          </h2>
          <p className="text-sm sm:text-base text-[#AAB7C7] leading-relaxed">
            NanoLabs brings the essential parts of laboratory healthcare into one unified digital workflow — eliminating the delays of fragmented, paper-based records.
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
                      ? 'bg-[#0B1F3A] border-[#20C997]/60 shadow-xl shadow-[#20C997]/10 translate-x-2'
                      : 'bg-[#0B1F3A]/40 border-white/5 hover:bg-[#0B1F3A]/80 hover:border-white/15'
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
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#AAB7C7]">
                          {node.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#AAB7C7] line-clamp-1 mt-0.5">{node.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Column: Hub Core Visual */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0B1F3A] to-[#07111F] border border-white/15 shadow-2xl relative">
            {/* Glowing Hub Logo */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#1677FF] via-[#00A6A6] to-[#20C997] p-1 shadow-2xl shadow-[#1677FF]/40 animate-pulse">
                <div className="w-full h-full bg-[#07111F] rounded-[22px] flex items-center justify-center">
                  <Activity className="w-12 h-12 text-[#20C997] stroke-[2.5]" />
                </div>
              </div>
              <div className="absolute -inset-4 rounded-full border border-[#20C997]/20 animate-ping pointer-events-none" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              NanoLabs OS Core
            </h3>
            <p className="text-xs text-[#20C997] font-semibold mb-4">
              Real-Time Synchronized Data Hub
            </p>

            {/* Selected Node Detailed Preview Card */}
            <div className="w-full p-4 rounded-2xl bg-[#07111F]/90 border border-white/10 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{nodes[selectedNode].title}</span>
                <span className="text-[10px] text-[#20C997] font-mono font-bold">CONNECTED</span>
              </div>
              <p className="text-xs text-[#AAB7C7] leading-relaxed">
                {nodes[selectedNode].desc}
              </p>
            </div>

            <button
              onClick={onGoToPortal}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1677FF] to-[#00A6A6] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-102 transition-transform"
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
                      ? 'bg-[#0B1F3A] border-[#20C997]/60 shadow-xl shadow-[#20C997]/10 -translate-x-2'
                      : 'bg-[#0B1F3A]/40 border-white/5 hover:bg-[#0B1F3A]/80 hover:border-white/15'
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
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#AAB7C7]">
                          {node.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#AAB7C7] line-clamp-1 mt-0.5">{node.desc}</p>
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
