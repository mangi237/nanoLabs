import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
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
  UserCog
} from 'lucide-react';

interface OverviewProps {
  onPatientSelect?: (patient: any) => void;
  onNavigateTab?: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onPatientSelect, onNavigateTab }) => {
  const { lab } = useAuth();
  const [loading, setLoading] = useState(true);
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
      const patientsRef = collection(db, 'labs', lab?.id || 'lab-1', 'patients');
      const patientsSnap = await getDocs(patientsRef);
      const patientList = patientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const staffRef = collection(db, 'labs', lab?.id || 'lab-1', 'staff');
      const staffSnap = await getDocs(staffRef);

      let totalTestsCount = 0;
      patientList.forEach((p: any) => {
        if (p.labTests) {
          totalTestsCount += p.labTests.length;
        } else {
          totalTestsCount += 1;
        }
      });

      setStats({
        patients: patientList.length,
        staff: staffSnap.size || 3,
        tests: totalTestsCount || 12,
        revenue: totalTestsCount * 5500
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
      trend: "+12% this month",
      icon: Users,
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600 border border-teal-200"
    },
    {
      title: "Staff Members",
      value: stats.staff,
      trend: "Active Team",
      icon: UserPlus,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600 border border-blue-200"
    },
    {
      title: "Laboratory Tests",
      value: stats.tests,
      trend: "+18% weekly",
      icon: TestTube,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600 border border-emerald-200"
    },
    {
      title: "Estimated Revenue",
      value: `${stats.revenue.toLocaleString()} FCFA`,
      trend: "Target On Track",
      icon: DollarSign,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600 border border-indigo-200"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-800 via-teal-700 to-blue-800 p-6 sm:p-8 text-white shadow-xl shadow-teal-900/10">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-teal-100 border border-white/20">
            <Activity className="w-3.5 h-3.5" />
            Operational Intelligence
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {lab?.name || 'nanoLabs Health System'}
          </h2>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            Real time overview of clinical operations, patient admissions, laboratory workload, and performance metrics.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3"
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
                <div className="flex items-center gap-1 mt-1 text-xs font-medium text-teal-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{card.trend}</span>
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
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100/80 hover:to-teal-100/80 border border-emerald-200/80 rounded-2xl text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                Inventory Manager
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-emerald-700">Reagents & Stock Levels</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('catalog')}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100/80 hover:to-cyan-100/80 border border-teal-200/80 rounded-2xl text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3 bg-teal-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-teal-950 flex items-center gap-1">
                Test Catalog
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-teal-700">Medical Tests & Pricing</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('staff')}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100/80 hover:to-indigo-100/80 border border-blue-200/80 rounded-2xl text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-950 flex items-center gap-1">
                Staff Roster
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-blue-700">Staff Roles & PIN Codes</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100/80 hover:to-violet-100/80 border border-purple-200/80 rounded-2xl text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="p-3 bg-purple-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-950 flex items-center gap-1">
                Audit Reports
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-purple-700">Financial & Lab Logs</p>
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
    </div>
  );
};

export default Overview;
