import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  ChevronRight,
  Sparkles
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
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [livePatientsCount, setLivePatientsCount] = useState<number>(0);
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    const fetchDoctorMetrics = async () => {
      try {
        const { getDocs, collection } = await import('../../services/firebase');
        const { db } = await import('../../services/firebase');
        const { limsService } = await import('../../services/limsService');

        const pSnap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
        setLivePatientsCount(pSnap.docs.length);

        const bList = await limsService.fetchAllBookings(targetLabId);
        setLiveBookings(bList);
      } catch (err) {
        console.warn('Error fetching live doctor metrics:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchDoctorMetrics();
  }, [targetLabId]);

  const pendingReportsCount = liveBookings.filter(b => b.paymentStatus === 'paid' && b.overallStatus !== 'Completed').length;
  const validatedReportsCount = liveBookings.filter(b => b.overallStatus === 'Completed').length;

  const stats = [
    { 
      label: 'Cohort Patients', 
      value: livePatientsCount > 0 ? livePatientsCount.toString() : (liveBookings.length > 0 ? liveBookings.length.toString() : '0'), 
      icon: Users, 
      desc: 'Active registered patients' 
    },
    { 
      label: 'Pending Lab Reports', 
      value: pendingReportsCount.toString(), 
      icon: Clock, 
      desc: 'Under analyzer review' 
    },
    { 
      label: 'Validated Reports', 
      value: validatedReportsCount.toString(), 
      icon: CheckCircle2, 
      desc: 'Biologist signed & sealed' 
    },
    { 
      label: 'Network Laboratories', 
      value: '14', 
      icon: Building2, 
      desc: 'Accredited partner sites' 
    }
  ];

  const recentReferrals = liveBookings.slice(0, 5).map(b => ({
    id: b.id,
    patient: b.patientName,
    date: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent',
    tests: b.tests?.map((t: any) => t.testName).join(', ') || 'Diagnostic Panel',
    lab: b.labName || 'BioSanté Lab',
    status: b.overallStatus === 'Completed' ? 'Report Ready' : 'Analysis in Progress'
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-900 animate-in fade-in duration-300">
      {/* 1. Header Hero Banner - Rebranded NanoLabs deep teal palette */}
      <div className="bg-gradient-to-br from-[#004D56] via-[#006978] to-[#00838F] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-cyan-200">
            <Stethoscope className="w-3.5 h-3.5 text-cyan-200" />
            <span>National Medical Council (ONMC) Certified Physician</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome, {user?.name || 'Dr. Marie Nguema'}
          </h1>
          <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed font-normal">
            Physician Portal &bull; Prescribe accredited diagnostic investigations, track real-time specimen cold-chain progression, and securely review cryptographically signed reports.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateNewRequest}
              className="px-5 py-3 bg-white text-[#006978] hover:bg-cyan-50 rounded-2xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4 text-[#006978]" />
              <span>+ Create Lab Request</span>
            </button>

            <a
              href="https://waspito.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-300/40 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
              title="Hold Online Video Consultation on Waspito Telehealth"
            >
              <Video className="w-4 h-4" />
              <span>Telehealth Video Consult</span>
            </a>

            <button
              onClick={onNavigateConnect}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-cyan-200" />
              <span>Patient Connect QR</span>
            </button>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/5 rounded-full pointer-events-none" />
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{s.label}</span>
                <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{s.value}</div>
              <p className="text-[11px] text-slate-500">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* 3. Strict Ethical Deontology Notice */}
      <div className="p-4 bg-[#E0F2F1]/50 border border-[#80CBC4] rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#006978] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-[#004D56]">
            Ethical Clinical Referral Network (Zero Commissions)
          </p>
          <p className="text-slate-600 leading-relaxed font-normal">
            In compliance with ONMC medical deontology, NanoLabs provides an unbiased, non-commercial clinical referral ledger. All laboratory tariffs are paid directly to performing laboratories. NanoLabs operates on a neutral 5% records management fee on the patient's out-of-pocket share only.
          </p>
        </div>
      </div>

      {/* 4. Recent Referrals & Patient Reports */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Recent Diagnostic Prescriptions
            </h2>
            <p className="text-xs text-slate-500">Latest lab requests dispatched from your clinical practice.</p>
          </div>

          <button
            onClick={onNavigateReports}
            className="text-xs font-bold text-[#006978] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentReferrals.length > 0 ? (
            recentReferrals.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 hover:bg-[#E0F2F1]/30 rounded-2xl border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 group-hover:text-[#006978]">{item.patient}</span>
                    <span className="text-[10px] text-slate-400">&bull; {item.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">{item.tests}</p>
                  <p className="text-[10px] text-[#006978] font-bold flex items-center gap-1">
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
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-[#006978] text-slate-800 font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No recent referrals logged yet. Create your first diagnostic request above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { DashboardScreen as DoctorDashboardScreen };
export default DashboardScreen;
