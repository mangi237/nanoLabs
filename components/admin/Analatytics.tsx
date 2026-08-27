
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { BarChart2, PieChart as PieChartIcon, DollarSign, Users, CheckCircle2, Clock, Activity, TrendingUp } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { lab } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalTests: 0,
    completedTests: 0,
    pendingTests: 0,
    totalRevenue: 0,
    pendingRevenue: 0
  });

  const [weeklyData, setWeeklyData] = useState<{ day: string; revenue: number; heightPct: number }[]>([
    { day: 'Mon', revenue: 0, heightPct: 0 },
    { day: 'Tue', revenue: 0, heightPct: 0 },
    { day: 'Wed', revenue: 0, heightPct: 0 },
    { day: 'Thu', revenue: 0, heightPct: 0 },
    { day: 'Fri', revenue: 0, heightPct: 0 },
    { day: 'Sat', revenue: 0, heightPct: 0 },
    { day: 'Sun', revenue: 0, heightPct: 0 }
  ]);

  const [categoryDistribution, setCategoryDistribution] = useState<
    { label: string; pct: string; count: number; color: string }[]
  >([]);

  useEffect(() => {
    fetchAnalytics();
  }, [lab?.id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const patientsRef = collection(db, 'labs', lab?.id || 'lab-1', 'patients');
      const snap = await getDocs(patientsRef);
      const patients = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      let totalTestsCount = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let totalRev = 0;
      let pendingRev = 0;

      const dailyTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon = 0 ... Sun = 6
      const categoryCounts: Record<string, number> = {};

      patients.forEach((p: any) => {
        const tests = p.labTests && Array.isArray(p.labTests) ? p.labTests : [];
        if (tests.length > 0) {
          totalTestsCount += tests.length;
          tests.forEach((t: any) => {
            const price = Number(t.price || t.amount || 5000);
            const status = (t.status || 'pending').toLowerCase();
            const isCompleted = status === 'completed' || status === 'result_ready' || status === 'validated' || t.paymentStatus === 'paid';

            if (isCompleted) {
              completedCount++;
              totalRev += price;
            } else {
              pendingCount++;
              pendingRev += price;
            }

            // Category tracking
            const rawCat = t.category || 'General';
            categoryCounts[rawCat] = (categoryCounts[rawCat] || 0) + 1;

            // Date tracking for weekly chart
            const testDateStr = t.requestedDate || t.date || p.createdAt || new Date().toISOString();
            const testDate = new Date(testDateStr);
            if (!isNaN(testDate.getTime())) {
              let dayIdx = testDate.getDay() - 1; // getDay(): 0=Sun, 1=Mon...
              if (dayIdx === -1) dayIdx = 6; // Sun = index 6
              if (dayIdx >= 0 && dayIdx < 7) {
                dailyTotals[dayIdx] += price;
              }
            }
          });
        }
      });

      // Prepare weekly chart values
      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const maxRev = Math.max(...dailyTotals, 1);
      const formattedWeekly = dayLabels.map((day, idx) => {
        const rev = dailyTotals[idx];
        const heightPct = rev > 0 ? Math.max(12, Math.round((rev / maxRev) * 100)) : 0;
        return { day, revenue: rev, heightPct };
      });

      // Prepare Category distribution percentages
      const categoryColors = [
        'bg-teal-600',
        'bg-blue-600',
        'bg-indigo-600',
        'bg-amber-500',
        'bg-emerald-600',
        'bg-purple-600'
      ];

      const catEntries = Object.entries(categoryCounts);
      let formattedCategories = catEntries.map(([catName, count], idx) => {
        const pctVal = totalTestsCount > 0 ? Math.round((count / totalTestsCount) * 100) : 0;
        return {
          label: catName,
          count,
          pct: `${pctVal}%`,
          color: categoryColors[idx % categoryColors.length]
        };
      });

      if (formattedCategories.length === 0) {
        formattedCategories = [
          { label: 'Hematology', count: 0, pct: '0%', color: 'bg-teal-600' },
          { label: 'Biochemistry', count: 0, pct: '0%', color: 'bg-blue-600' },
          { label: 'Endocrinology', count: 0, pct: '0%', color: 'bg-indigo-600' },
          { label: 'Urinalysis', count: 0, pct: '0%', color: 'bg-amber-500' }
        ];
      }

      setStats({
        totalPatients: patients.length,
        totalTests: totalTestsCount,
        completedTests: completedCount,
        pendingTests: pendingCount,
        totalRevenue: totalRev,
        pendingRevenue: pendingRev
      });

      setWeeklyData(formattedWeekly);
      setCategoryDistribution(formattedCategories);

    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalWeeklyRev = weeklyData.reduce((acc, d) => acc + d.revenue, 0);
  const avgDailyRev = Math.round(totalWeeklyRev / 7);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Healthcare Analytics & Financial Reports</h2>
          <p className="text-xs text-slate-500">Comprehensive real-time laboratory performance metrics and financial breakdown</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
          <Activity className="w-4 h-4" />
          Live Metrics
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            Total Patients
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalPatients}</div>
          <p className="text-xs text-teal-600 font-medium">Registered in database</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            Completed Tests
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.completedTests}</div>
          <p className="text-xs text-emerald-600 font-medium">Validated & processed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            Pending Tests
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.pendingTests}</div>
          <p className="text-xs text-amber-600 font-medium">In laboratory pipeline</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            Total Revenue
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalRevenue.toLocaleString()} FCFA</div>
          <p className="text-xs text-blue-600 font-medium">Completed & confirmed revenue</p>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Weekly Revenue Flow</h3>
              <p className="text-xs text-slate-500">Revenue generation calculated from patient records (FCFA)</p>
            </div>
            <BarChart2 className="w-5 h-5 text-teal-600" />
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-4 border-b border-slate-100">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.revenue > 0 ? `${d.revenue.toLocaleString()} FCFA` : '0'}
                </span>
                <div
                  style={{ height: `${d.heightPct}%` }}
                  className="w-full max-w-[36px] bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg group-hover:from-teal-700 group-hover:to-teal-500 transition-all shadow-xs"
                />
                <span className="text-[11px] font-semibold text-slate-500">{d.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1">
            <span>Average Daily Revenue: {avgDailyRev.toLocaleString()} FCFA</span>
            <span className="text-teal-600 font-bold">Total: {totalWeeklyRev.toLocaleString()} FCFA</span>
          </div>
        </div>

        {/* Test Categories Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Test Distribution</h3>
              <p className="text-xs text-slate-500">Category volume ratio based on real test records</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-blue-600" />
          </div>

          <div className="space-y-3 pt-2">
            {categoryDistribution.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{cat.label} ({cat.count})</span>
                  <span className="font-bold">{cat.pct}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{ width: cat.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

