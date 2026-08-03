import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { Users, UserPlus, TestTube, DollarSign, ArrowUpRight, Activity, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface OverviewProps {
  onPatientSelect?: (patient: any) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onPatientSelect }) => {
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

      {/* Patient Workload Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recent Patient Admissions</h3>
            <p className="text-xs text-slate-500">Active medical profiles undergoing lab tests</p>
          </div>
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {recentPatients.length} Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Patient Name</th>
                <th className="px-6 py-3">Patient Code</th>
                <th className="px-6 py-3">Demographics</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {recentPatients.map(p => (
                <tr key={p.id} className="hover:bg-teal-50/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold">
                      {p.name ? p.name.slice(0, 2).toUpperCase() : 'PT'}
                    </div>
                    {p.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">{p.patientId || p.id}</td>
                  <td className="px-6 py-4">{p.age || 30} yrs • {p.gender || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      p.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onPatientSelect && onPatientSelect(p)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline"
                    >
                      View Details
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
