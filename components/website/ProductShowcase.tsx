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
  Sparkles,
  Search,
  Layers,
  QrCode,
} from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';

interface ProductShowcaseProps {
  onGoToPortal: (role?: 'patient' | 'doctor' | 'lab') => void;
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
    <section id="product" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-[#0F766E]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Three apps, one platform</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0B1F1D] tracking-tight">
            Meet nanoLabs.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            One hub with three doors. Everything designed mobile-first for the way Cameroon actually books, pays, and shares.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8 justify-start lg:justify-center">
          {siteConfig.productTabs.map((tab) => {
            const Icon = tabIcons[tab.id] || LayoutDashboard;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id + tab.label}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0D3B38] to-[#0F766E] text-white border-transparent shadow-lg shadow-teal-900/20 scale-105'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-[#0F766E]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#0F766E]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#F8FAF9] rounded-3xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-100 text-[#0F766E] uppercase tracking-wider">
                {currentTab.roleAttribution}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#0B1F1D] tracking-tight">
                {currentTab.tagline}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {currentTab.description}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {currentTab.keyHighlights.map((highlight, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium leading-tight">{highlight}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
              <button
                onClick={() => onGoToPortal()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0D3B38] to-[#0F766E] text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <span>Open in portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 shadow-xl overflow-hidden min-h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] animate-pulse" />
                <span className="text-[#0B1F1D] font-bold">{currentTab.label} interface</span>
              </div>
              <span className="text-[10px] text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                Batch-based
              </span>
            </div>

            <div className="py-4 space-y-4">
              {activeTab === 'dashboard' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Batches Today</div>
                      <div className="text-2xl font-black text-[#0B1F1D] font-mono mt-1">47</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Pending Verification</div>
                      <div className="text-2xl font-black text-[#1677FF] font-mono mt-1">12</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Signed Today</div>
                      <div className="text-2xl font-black text-[#0F766E] font-mono mt-1">94</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0B1F1D]">
                      <span>Auto-generated invoices</span>
                      <span className="text-[10px] text-[#0F766E]">5% patient side</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] h-full w-3/4 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Paid via MoMo / OM</span>
                      <span className="text-[#0F766E] font-bold">78% of batches</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'patients' && (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#0F766E]" />
                      <span className="font-mono text-slate-500">Search by phone, name, or policy number</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Instant</span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-teal-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#0B1F1D] text-sm">TCHOUA Marie-Claire</div>
                      <span className="font-mono text-[11px] text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded font-bold">+237 699 12 34 56</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500">
                      <div>Age: <strong className="text-[#0B1F1D]">34 (F)</strong></div>
                      <div>Insurer: <strong className="text-[#1677FF]">ASCOMA</strong></div>
                      <div>Coverage: <strong className="text-[#0B1F1D]">80%</strong></div>
                      <div>Status: <strong className="text-[#0F766E]">Verified at intake</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Full Blood Count', code: 'KB1.0', tube: 'EDTA', time: '25m' },
                      { name: 'Lipid Profile', code: 'B10', tube: 'SST', time: '40m' },
                      { name: 'Fasting Glucose', code: 'B30', tube: 'Fluoride', time: '20m' },
                      { name: 'Urinalysis', code: 'B45', tube: 'Sterile pot', time: '30m' }
                    ].map((t, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="font-bold text-[#0B1F1D] truncate">{t.name}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="text-[#0F766E] font-mono">{t.code}</span>
                          <span className="font-mono">{t.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'results' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0B1F1D]">Full Blood Count</span>
                      <span className="text-[10px] text-[#0F766E] font-bold uppercase">Validated</span>
                    </div>
                    <div className="divide-y divide-slate-100 font-mono text-[11px]">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Hemoglobin</span>
                        <span className="font-bold text-[#0F766E]">14.2 g/dL (12.0-16.0)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">WBC</span>
                        <span className="font-bold text-[#0F766E]">6,800 /µL (4k-10k)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Platelets</span>
                        <span className="font-bold text-[#0F766E]">245,000 /µL (150k-450k)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-[#0F766E] font-bold">
                    <span>Signed by biologist</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              )}

              {activeTab === 'staff' && (
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {[
                    { role: 'Cashier', desc: 'Payment verification with personal access code.' },
                    { role: 'Phlebotomist', desc: 'In-lab and mobile. GPS pings during transit.' },
                    { role: 'Biologist', desc: 'Validates and signs. Name appears on report.' },
                    { role: 'Receptionist', desc: 'Intake, insurance check, batch creation.' }
                  ].map((s, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-[#0B1F1D] text-xs">{s.role}</div>
                      <p className="text-[10px] text-slate-500 leading-snug">{s.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'physicians' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#0B1F1D]">Dr. FOKAM Jean-Paul</div>
                      <span className="text-[10px] text-[#1677FF] bg-blue-50 px-2 py-0.5 rounded font-bold">Connected</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Prescribes, receives signed reports, and gets credited for every referral.
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-[#0F766E]">14 active referrals</span>
                      <span className="font-mono text-slate-500">ONMC verified</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'patient_portal' && (
                <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl border border-teal-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-[#0F766E] flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-[#0B1F1D]">Patient app</div>
                        <div className="text-[10px] text-[#0F766E]">Book. Track. Share.</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#0F766E] bg-white px-2 py-0.5 rounded-full font-bold border border-teal-200">MoMo ready</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Scan prescriptions with AI, compare labs by real distance, watch the phlebotomist move, share reports with a doctor in one tap.
                  </p>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
                  <div className="text-xs font-bold text-[#0B1F1D] flex items-center justify-between font-sans">
                    <span>Append-only audit chain</span>
                    <span className="text-[#0F766E]">Hash-linked</span>
                  </div>
                  <div className="space-y-1 text-slate-500">
                    <div className="flex justify-between">
                      <span>[14:22] Batch collected</span>
                      <span className="text-[#0B1F1D]">PHL-04</span>
                    </div>
                    <div className="flex justify-between">
                      <span>[14:48] Analyzer complete</span>
                      <span className="text-[#0B1F1D]">BENCH-02</span>
                    </div>
                    <div className="flex justify-between">
                      <span>[15:02] Signed by biologist</span>
                      <span className="text-[#0F766E]">SHA-256 OK</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#0F766E]" />
                Batch-based
              </span>
              <span className="flex items-center gap-1.5 text-[#0F766E]">
                <QrCode className="w-3 h-3" />
                QR to audit
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;