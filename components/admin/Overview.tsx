import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService } from '../../services/limsService';
import { 
  Users, 
  UserPlus, 
  TestTube, 
  DollarSign, 
  ArrowUpRight, 
  Activity, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  Package,
  FlaskConical,
  FileText,
  UserCog,
  Building2,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Clock,
  Zap
} from 'lucide-react';
import LabProfileModal from './LabProfileModal';
import SubscriptionRechargeModal from './SubscriptionRechargeModal';

interface OverviewProps {
  onPatientSelect?: (patient: any) => void;
  onNavigateTab?: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onPatientSelect, onNavigateTab }) => {
  const { lab } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [stats, setStats] = useState({
    patients: 0,
    staff: 0,
    tests: 0,
    revenue: 0
  });
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [lab?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const targetLabId = lab?.id || 'lab-1';
      const patientsRef = collection(db, 'labs', targetLabId, 'patients');
      const patientsSnap = await getDocs(patientsRef);
      const patientList = patientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const staffRef = collection(db, 'labs', targetLabId, 'staff');
      const staffSnap = await getDocs(staffRef);

      // Fetch bookings to count tests and sum ONLY confirmed paid revenue
      const bookings = await limsService.fetchAllBookings(targetLabId);
      const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');
      const confirmedRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const totalTestsCount = bookings.reduce((sum, b) => sum + (b.tests?.length || 1), 0);

      setStats({
        patients: patientList.length,
        staff: staffSnap.size || 3,
        tests: totalTestsCount,
        revenue: confirmedRevenue
      });

      setRecentPatients(patientList.slice(0, 5));
    } catch (e) {
      console.error('Error fetching overview stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Patients",
      value: stats.patients,
      subtitle: "Registered Patient Accounts",
      icon: Users,
      bgColor: "bg-teal-50",
      iconColor: "text-teal-700 border border-teal-200"
    },
    {
      title: "Staff Members",
      value: stats.staff,
      subtitle: "Authorized Clinical Team",
      icon: UserPlus,
      bgColor: "bg-slate-100",
      iconColor: "text-slate-700 border border-slate-200"
    },
    {
      title: "Laboratory Tests",
      value: stats.tests,
      subtitle: "Tests Processed & Logged",
      icon: TestTube,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-700 border border-emerald-200"
    },
    {
      title: "Diagnostic Revenue",
      value: `${stats.revenue.toLocaleString()} FCFA`,
      subtitle: "Confirmed & Reconciled",
      icon: DollarSign,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-700 border border-indigo-200"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold border border-teal-500/20">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            Operational Intelligence & Admin Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {lab?.name || 'nanoLabs Health System'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {lab?.slogan || 'Real-time overview of clinical operations, patient admissions, laboratory workload, and performance metrics.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => setShowLabModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Camera className="w-4 h-4 text-teal-400" />
              {lab?.logoUrl ? 'Update Facility Logo & Profile' : 'Upload Custom Facility Logo'}
            </button>
          </div>
        </div>

        {/* Big Circled Logo at the right side with Click to Edit */}
        <div 
          onClick={() => setShowLabModal(true)}
          title="Click to change facility logo & branding"
          className="relative z-10 shrink-0 self-center sm:self-auto group cursor-pointer"
        >
          {lab?.logoUrl ? (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-700 bg-white shadow-md p-1 flex items-center justify-center overflow-hidden group-hover:scale-105 group-hover:border-teal-500 transition-all">
              <img
                src={lab.logoUrl}
                alt={lab.name || 'Lab Logo'}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-700 bg-slate-800 shadow-md flex flex-col items-center justify-center text-white group-hover:scale-105 group-hover:border-teal-500 transition-all">
              <Activity className="w-8 h-8 stroke-[2.5] text-teal-400" />
              <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 text-slate-300">nanoLabs</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-teal-600 text-white p-1.5 rounded-full border-2 border-slate-900 shadow-md group-hover:bg-teal-500 transition-colors">
            <Camera className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Model A vs Model B Banner Section */}
      {lab?.pricingModel === 'pay_per_test' ? (
        /* Model A: Real-Time Escrow Ledger Card */
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-xs font-mono font-bold text-amber-400 border border-amber-500/20">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Commercial Model: 500 FCFA Pay-Per-Test Commission
            </div>
            <h3 className="text-xl font-bold text-white">
              Platform Royalty Owed: <span className="text-amber-400 font-mono">{(stats.tests * 500).toLocaleString()} FCFA</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              Accumulating <strong>500 FCFA</strong> platform commission per laboratory test. Total lab diagnostic revenue: <strong className="text-emerald-400 font-mono">{stats.revenue.toLocaleString()} FCFA</strong>. Settle your royalty balance via Mobile Money proof upload.
            </p>
          </div>

          <button
            onClick={() => setShowRechargeModal(true)}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Pay Royalty / Upload Proof</span>
          </button>
        </div>
      ) : (
        /* Model B: Dynamic 30-Day Tier Subscription Banner */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-extrabold uppercase bg-teal-700 text-white px-2.5 py-0.5 rounded">
                    {`${(lab?.subscriptionTier || 'small').toUpperCase()} TIER`}
                  </span>

                  {(() => {
                    const startDate = lab?.subscriptionStartDate 
                      ? new Date(lab.subscriptionStartDate) 
                      : (lab?.createdAt ? new Date(lab.createdAt) : new Date());
                    const daysPassed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const daysRemaining = Math.max(0, 30 - (daysPassed % 30));
                    return (
                      <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded border ${
                        daysRemaining <= 5 
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                          : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                      }`}>
                        {daysRemaining} Days Remaining in 30-Day Billing Cycle
                      </span>
                    );
                  })()}

                  {lab?.planMutationStatus === 'PENDING_PLAN_MUTATION' && (
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
                      Plan Mutation Pending Superadmin Approval
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-sm text-white mt-1">
                  Monthly SaaS Subscription License
                </h4>
                <p className="text-xs text-slate-400">
                  {lab?.subscriptionTier === 'small' 
                    ? 'Small Hospital Tier: Max 5 Staff Users • Max 250 Patients / Month' 
                    : lab?.subscriptionTier === 'medium'
                    ? 'Medium Enterprise Tier: Max 15 Staff Users • Max 1,000 Patients / Month'
                    : 'Large Enterprise Tier: Unlimited Staff Users • Unlimited Patients'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRechargeModal(true)}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Recharge / Upgrade Tier</span>
            </button>
          </div>

          {/* Hard-Cap Volume Meter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
            {/* Staff Volume */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Staff License Capacity:</span>
                <span className="font-mono font-bold text-teal-400">
                  {stats.staff} / {lab?.subscriptionTier === 'small' ? '5 Users' : lab?.subscriptionTier === 'medium' ? '15 Users' : 'Unlimited'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (stats.staff / (lab?.subscriptionTier === 'small' ? 5 : lab?.subscriptionTier === 'medium' ? 15 : 100)) * 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Patient Volume */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Monthly Patient Volume Cap:</span>
                <span className="font-mono font-bold text-teal-400">
                  {stats.patients} / {lab?.subscriptionTier === 'small' ? '250 Patients' : lab?.subscriptionTier === 'medium' ? '1,000 Patients' : 'Unlimited'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (stats.patients / (lab?.subscriptionTier === 'small' ? 250 : lab?.subscriptionTier === 'medium' ? 1000 : 10000)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {card.value}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  {card.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Access Action Hub */}
      {onNavigateTab && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateTab('inventory')}
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl group-hover:bg-teal-100 transition-colors">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                Inventory Manager
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-500">Reagents & Stock Levels</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('catalog')}
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl group-hover:bg-teal-100 transition-colors">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                Test Catalog
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-500">Medical Tests & Pricing</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('staff')}
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl group-hover:bg-slate-200 transition-colors">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                Staff Roster
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-500">Staff Roles & PIN Codes</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl group-hover:bg-slate-200 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                Audit Reports
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-500">Financial & Lab Logs</p>
            </div>
          </button>
        </div>
      )}

      {/* Patient Workload Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recent Patient Admissions</h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                Privacy Protected
              </span>
            </div>
            <p className="text-xs text-slate-500">Operational demographic & billing overview (clinical tests restricted)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              {recentPatients.length} Registered
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Patient Name</th>
                <th className="px-6 py-3">Patient Code</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Price Paid</th>
                <th className="px-6 py-3 text-right">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {recentPatients.map(p => {
                const totalPaid = Array.isArray(p.labTests) 
                  ? p.labTests.reduce((sum: number, t: any) => {
                      if (t.paid || t.paymentStatus === 'paid' || t.status === 'completed' || t.confirmedByCashier) {
                        return sum + (typeof t.price === 'number' ? t.price : 0);
                      }
                      return sum;
                    }, 0)
                  : (p.totalPaid || 0);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                        {p.name ? p.name.slice(0, 2).toUpperCase() : 'PT'}
                      </div>
                      <div>
                        <span>{p.name}</span>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {p.age || 30} yrs • {p.gender || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 font-bold">{p.patientId || p.id}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{p.phone || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {totalPaid > 0 ? `${totalPaid.toLocaleString()} XAF` : '0 XAF'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {p.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lab Profile & Custom Logo Modal */}
      <LabProfileModal
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        onSaved={() => fetchData()}
      />

      {/* Subscription Recharge Portal Modal */}
      <SubscriptionRechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
      />
    </div>
  );
};

export default Overview;
