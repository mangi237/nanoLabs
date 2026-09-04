import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  TestTube2, 
  FileCheck2, 
  UserCheck, 
  Stethoscope, 
  Smartphone, 
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
  Printer,
  Sparkles,
  Search,
  Eye,
  Activity,
  QrCode,
  FileText
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface ProductShowcaseProps {
  onGoToPortal: () => void;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ onGoToPortal }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const tabIcons: Record<string, any> = {
    dashboard: LayoutDashboard,
    patients: Users,
    tests: TestTube2,
    results: FileCheck2,
    staff: UserCheck,
    physicians: Stethoscope,
    patient_portal: Smartphone,
    audit: ShieldAlert
  };

  const currentTab = siteConfig.productTabs.find(t => t.id === activeTab) || siteConfig.productTabs[0];

  return (
    <section id="product" className="py-24 bg-[#07111F] relative overflow-hidden border-t border-white/5">
      {/* Subtle background glow */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#1677FF]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#20C997]/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B1F3A] border border-white/10 text-xs font-bold text-[#1677FF]">
            <Sparkles className="w-3.5 h-3.5 text-[#20C997]" />
            <span>Comprehensive Clinical Suite</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Meet NanoLabs.
          </h2>
          <p className="text-sm sm:text-base text-[#AAB7C7] leading-relaxed">
            A modern laboratory management platform designed to simplify operations, organize clinical records, and connect everyone involved in diagnostic healthcare.
          </p>
        </div>

        {/* Feature Tab Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8 justify-start lg:justify-center">
          {siteConfig.productTabs.map((tab) => {
            const Icon = tabIcons[tab.id] || LayoutDashboard;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#1677FF] to-[#00A6A6] text-white border-transparent shadow-lg shadow-[#1677FF]/25 scale-105'
                    : 'bg-[#0B1F3A]/60 text-[#AAB7C7] border-white/5 hover:bg-[#0B1F3A] hover:text-white hover:border-white/15'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#20C997]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Feature Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0B1F3A]/50 rounded-3xl border border-white/15 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
          {/* Left Column: Feature Details & Highlights */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#20C997]/20 text-[#20C997] border border-[#20C997]/30 uppercase tracking-wider">
                {currentTab.roleAttribution}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentTab.tagline}
              </h3>
              <p className="text-sm text-[#AAB7C7] leading-relaxed">
                {currentTab.description}
              </p>
            </div>

            {/* Key Highlights Checklist */}
            <div className="space-y-2.5 pt-2">
              {currentTab.keyHighlights.map((highlight, hIdx) => (
                <div key={hIdx} className="flex items-start gap-3 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-[#20C997]/20 border border-[#20C997]/30 flex items-center justify-center text-[#20C997] shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium leading-tight">{highlight}</span>
                </div>
              ))}
            </div>

            {/* Action inside tab */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={onGoToPortal}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#1677FF] via-[#00A6A6] to-[#20C997] text-white font-extrabold text-xs shadow-lg flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
              >
                <span>Launch in Live Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Realistic Rich UI Mockup Container */}
          <div className="lg:col-span-7 rounded-2xl bg-[#07111F] border border-white/15 p-4 sm:p-6 shadow-2xl overflow-hidden min-h-[380px] flex flex-col justify-between">
            {/* Top Mockup Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#AAB7C7]">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-bold">{currentTab.label} Interface</span>
              </div>
              <span className="text-[10px] text-[#20C997] bg-[#20C997]/10 px-2 py-0.5 rounded border border-[#20C997]/20">
                Encrypted Session
              </span>
            </div>

            {/* Dynamic UI Content Preview according to active tab */}
            <div className="py-4 space-y-4">
              {activeTab === 'dashboard' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-[#0B1F3A] rounded-xl border border-white/10">
                      <div className="text-[10px] text-[#AAB7C7] uppercase font-bold">Samples In Queue</div>
                      <div className="text-2xl font-black text-white font-mono mt-1">47</div>
                    </div>
                    <div className="p-3 bg-[#0B1F3A] rounded-xl border border-white/10">
                      <div className="text-[10px] text-[#AAB7C7] uppercase font-bold">Pending Sign-off</div>
                      <div className="text-2xl font-black text-[#1677FF] font-mono mt-1">12</div>
                    </div>
                    <div className="p-3 bg-[#0B1F3A] rounded-xl border border-white/10">
                      <div className="text-[10px] text-[#AAB7C7] uppercase font-bold">Validated Today</div>
                      <div className="text-2xl font-black text-[#20C997] font-mono mt-1">94</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#0B1F3A]/70 rounded-xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Automated Specimen Worklist</span>
                      <span className="text-[10px] text-[#20C997]">CBC + Biochem</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#1677FF] to-[#20C997] h-full w-3/4 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#AAB7C7]">
                      <span>Turnaround target: 45 mins</span>
                      <span className="text-emerald-400 font-bold">Average: 32 mins</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'patients' && (
                <div className="space-y-3 font-sans text-xs">
                  <div className="p-2.5 bg-[#0B1F3A] rounded-xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#20C997]" />
                      <span className="font-mono text-white">Search by PID, Name, or Phone (e.g. +237 67...)</span>
                    </div>
                    <span className="text-[10px] text-[#AAB7C7] font-mono">Instant Index</span>
                  </div>

                  <div className="p-3.5 bg-[#0B1F3A]/80 rounded-xl border border-[#20C997]/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-white text-sm">TCHOUA Marie-Claire</div>
                      <span className="font-mono text-[11px] text-[#20C997] bg-[#20C997]/10 px-2 py-0.5 rounded font-bold">PID-2026-0842</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#AAB7C7]">
                      <div>Age: <strong className="text-white">34 yrs (F)</strong></div>
                      <div>Phone: <strong className="text-white">+237 699 12 34 56</strong></div>
                      <div>Insurance: <strong className="text-[#1677FF]">ASCOMA 80%</strong></div>
                      <div>Status: <strong className="text-[#20C997]">Active Registered</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'NFS / Full Blood Count (Automated 5-Part)', tube: 'EDTA (Lavender)', dept: 'Hematology', time: '25m' },
                      { name: 'Lipid Profile (Total Chol, HDL, LDL, Trig)', tube: 'SST (Gold / Gel)', dept: 'Biochemistry', time: '40m' },
                      { name: 'Blood Culture & Antibiogram', tube: 'Blood Culture Bottle', dept: 'Microbiology', time: '48h' },
                      { name: 'Fasting Plasma Glucose', tube: 'Fluoride (Grey)', dept: 'Biochemistry', time: '20m' }
                    ].map((test, idx) => (
                      <div key={idx} className="p-2.5 bg-[#0B1F3A] rounded-xl border border-white/10 space-y-1">
                        <div className="font-bold text-white truncate">{test.name}</div>
                        <div className="flex items-center justify-between text-[10px] text-[#AAB7C7]">
                          <span className="text-[#20C997]">{test.tube}</span>
                          <span className="font-mono">{test.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'results' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#0B1F3A] rounded-xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Full Blood Count (NFS) Analysis</span>
                      <span className="text-[10px] text-[#20C997] font-bold uppercase">Delta-Check Passed</span>
                    </div>
                    <div className="divide-y divide-white/5 font-mono text-[11px]">
                      <div className="flex justify-between py-1">
                        <span className="text-[#AAB7C7]">Hemoglobin (Hb)</span>
                        <span className="font-bold text-emerald-400">14.2 g/dL (Normal: 12.0 - 16.0)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#AAB7C7]">White Blood Cells (WBC)</span>
                        <span className="font-bold text-emerald-400">6,800 /µL (Normal: 4,000 - 10,000)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#AAB7C7]">Platelets Count</span>
                        <span className="font-bold text-emerald-400">245,000 /µL (Normal: 150k - 450k)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#20C997]/10 border border-[#20C997]/30 rounded-xl text-[11px] text-[#20C997] font-bold">
                    <span>ONMC Biologist Signature Attached</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              )}

              {activeTab === 'staff' && (
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {[
                    { role: 'Chief Medical Biologist', desc: 'Authorizes final validation, interprets critical flags, signs diagnostic bundle.' },
                    { role: 'Bench Laboratory Technician', desc: 'Processes analyzer batches, inputs calibration values, logs quality controls.' },
                    { role: 'Reception & Phlebotomy', desc: 'Barcodes specimen tubes, verifies patient identity, collects payments.' },
                    { role: 'Laboratory Manager / Admin', desc: 'Configures test catalogs, monitors financial analytics, reviews audit logs.' }
                  ].map((st, sIdx) => (
                    <div key={sIdx} className="p-3 bg-[#0B1F3A] rounded-xl border border-white/10 space-y-1">
                      <div className="font-bold text-white text-xs">{st.role}</div>
                      <p className="text-[10px] text-[#AAB7C7] leading-snug">{st.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'physicians' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-[#0B1F3A] rounded-xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white">Dr. FOKAM Jean-Paul (Polyclinique de Douala)</div>
                      <span className="text-[10px] text-[#1677FF] bg-[#1677FF]/10 px-2 py-0.5 rounded font-bold">Connected Doctor</span>
                    </div>
                    <p className="text-[11px] text-[#AAB7C7]">
                      Direct encrypted portal access with real-time push alerts when referred patient results are signed.
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                      <span className="text-[#20C997]">14 Active Patient Referrals</span>
                      <span className="font-mono text-slate-300">Automated E-Prescription</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'patient_portal' && (
                <div className="p-4 bg-gradient-to-r from-amber-950/40 to-slate-900 rounded-2xl border border-amber-500/30 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Sealed Medical Envelope Experience</div>
                        <div className="text-[10px] text-amber-300">Tactile Physical Wax Seal Experience</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#20C997] bg-[#20C997]/20 px-2 py-0.5 rounded-full font-bold">WhatsApp Ready</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Patients receive an encrypted verification link to unseal their confidential diagnostic envelope and instantly download the consolidated signed multi-test PDF.
                  </p>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="p-3.5 bg-[#0B1F3A] rounded-xl border border-white/10 space-y-2 font-mono text-[11px]">
                  <div className="text-xs font-bold text-white flex items-center justify-between font-sans">
                    <span>Cryptographic Event Ledger</span>
                    <span className="text-[#20C997]">Tamper-Proof</span>
                  </div>
                  <div className="space-y-1 text-[#AAB7C7]">
                    <div className="flex justify-between">
                      <span>[14:22:01] Sample #CMR-9042 Phlebotomy Logged</span>
                      <span className="text-white">TECH-04</span>
                    </div>
                    <div className="flex justify-between">
                      <span>[14:48:19] Hematology Analyzer Complete</span>
                      <span className="text-white">MINDRAY-BC5150</span>
                    </div>
                    <div className="flex justify-between">
                      <span>[15:02:30] Signed by Biologist Dr. ONMC-2026</span>
                      <span className="text-emerald-400">SHA-256-OK</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status bar */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-[#AAB7C7] font-mono">
              <span>Standard: HL7 FHIR DiagnosticReport</span>
              <span className="text-[#20C997]">100% Traceable</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
