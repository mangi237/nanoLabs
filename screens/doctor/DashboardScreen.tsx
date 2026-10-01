import React from 'react';
import { 
  Stethoscope, 
  Users, 
  FilePlus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Building2, 
  ArrowRight, 
  Share2, 
  ShieldCheck,
  Activity,
  AlertCircle,
  Video,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/authContext';

interface DoctorDashboardProps {
  onNavigateNewRequest: () => void;
  onNavigatePatients: () => void;
  onNavigateReports: () => void;
  onNavigateDirectory: () => void;
  onNavigateConnect: () => void;
}

export const DashboardScreen: React.FC<DoctorDashboardProps> = ({
  onNavigateNewRequest,
  onNavigatePatients,
  onNavigateReports,
  onNavigateDirectory,
  onNavigateConnect
}) => {
  const { user } = useAuth();

  const stats = [
    { label: 'Referred Patients', value: '42', icon: Users, desc: 'Active clinical follow-ups' },
    { label: 'Pending Lab Reports', value: '6', icon: Clock, desc: 'Under analyzer review' },
    { label: 'Validated Reports', value: '138', icon: CheckCircle2, desc: 'Biologist signed' },
    { label: 'Network Labs', value: '12', icon: Building2, desc: 'Accredited facilities' }
  ];

  const recentReferrals = [
    { id: 'ref1', patient: 'Mme. Claire Ngo', date: '09 Sep 2026', tests: 'NFS, Glycémie à jeûn, Bilan Lipidique', lab: 'Laboratoire Central Akwa', status: 'Analysis in Progress' },
    { id: 'ref2', patient: 'M. Joseph Ewane', date: '08 Sep 2026', tests: 'Créatinine, Clairance, Ionogramme', lab: 'Centre Diagnostic Bonanjo', status: 'Report Ready' },
    { id: 'ref3', patient: 'Mme. Sandrine Fosso', date: '07 Sep 2026', tests: 'Frottis Cervico-Vaginal (FCV)', lab: 'Laboratoire Central Akwa', status: 'Report Ready' },
    { id: 'ref4', patient: 'M. Patrick Manga', date: '05 Sep 2026', tests: 'Goutte Épaisse, TDR Paludisme, CRP', lab: 'Centre Diagnostic Bonanjo', status: 'Report Ready' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0D3B38] via-[#0F766E] to-[#14B8A6] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold text-teal-100">
            <Stethoscope className="w-3.5 h-3.5 text-teal-300" />
            <span>National Medical Council (ONMC) Accredited</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome, {user?.name || 'Dr. Jean-Paul Kamga'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-50/90 leading-relaxed">
            Clinical Practitioner Portal. Prescribe accredited investigations, track real-time sample processing across CEMAC laboratories, and review verified biologist reports.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateNewRequest}
              className="min-h-[44px] px-5 py-2.5 bg-white text-[#0D3B38] hover:bg-teal-50 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4 text-[#0F766E]" />
              <span>Create Lab Request</span>
            </button>
            <a
              href="https://waspito.com"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2.5 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-2"
              title="Hold Online Video Consultation on Waspito Telehealth"
            >
              <Video className="w-4 h-4" />
              <span>Hold Video Consult on Waspito</span>
            </a>
            <button
              onClick={onNavigateConnect}
              className="min-h-[44px] px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-teal-200" />
              <span>Patient Connect QR</span>
            </button>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full pointer-events-none" />
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{s.label}</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#0B1F1D]">{s.value}</div>
              <p className="text-[11px] text-[#6B7F7D]">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Strict Ethical Medical Referral Notice */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-[#0D3B38]">
            Ethical Diagnostic Referral Network (Zero Commissions)
          </p>
          <p className="text-slate-600 leading-relaxed">
            In compliance with medical deontology, nanoLabs provides a strictly non-commercial clinical referral ledger. All diagnostic tariffs are paid directly to the performing laboratory. nanoLabs operates on an independent 5% record management fee on the patient's out-of-pocket share only.
          </p>
        </div>
      </div>

      {/* Recent Referral Activity & Reports List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-[#0B1F1D]">
              Recent Diagnostic Prescriptions
            </h2>
            <p className="text-xs text-[#6B7F7D]">Latest lab requests dispatched from your practice.</p>
          </div>

          <button
            onClick={onNavigateReports}
            className="text-xs font-bold text-[#0F766E] hover:text-[#0D3B38] flex items-center gap-1 cursor-pointer"
          >
            <span>All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentReferrals.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-50 hover:bg-teal-50/40 rounded-2xl border border-slate-200/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900">{item.patient}</span>
                  <span className="text-[10px] text-slate-400">&bull; {item.date}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {item.tests}
                </p>
                <p className="text-[10px] text-[#0F766E] font-medium flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>{item.lab}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  item.status === 'Report Ready'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.status}
                </span>
                <button
                  onClick={onNavigateReports}
                  className="min-h-[36px] px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { DashboardScreen as DoctorDashboardScreen };
export default DashboardScreen;
