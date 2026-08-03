import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { db, getDocs, collection } from '../../services/firebase';
import { Calendar, FileText, Share2, ArrowRightLeft, Plus, Clock, CheckCircle2, ChevronRight, Activity, TestTube } from 'lucide-react';

interface PatientDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onSelectTest?: (test: any) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onNavigateTab,
  onNotificationPress,
  onProfilePress,
  onSelectTest
}) => {
  const { user, lab } = useAuth();
  const { t } = useLanguage();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientTests();
  }, [user?.id]);

  const fetchPatientTests = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'patients'));
      const found = snap.docs.find(d => d.data().email === user?.email || d.data().name === user?.name);
      if (found && found.data().labTests) {
        setTests(found.data().labTests);
      } else {
        setTests([]);
      }
    } catch (e) {
      console.error('Error fetching patient tests:', e);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const actionCards = [
    { id: 'book', label: 'Book Appointment', desc: 'Schedule consultation or test', icon: Calendar, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'history', label: 'Test History', desc: 'View complete lab reports', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'share', label: 'Share Results', desc: 'Send records to physician', icon: Share2, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'transfer', label: 'Transfer Records', desc: 'Move files between labs', icon: ArrowRightLeft, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Patient Medical Portal"
        subtitle="Manage your health records & lab test requests"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                Patient Account
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name || 'Valued Patient'}
              </h1>
              <p className="text-xs sm:text-sm text-teal-100">
                Connected to {lab?.name || 'nanoLabs Central Diagnostics'}
              </p>
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('book')}
                className="flex items-center gap-2 px-5 py-3 bg-white text-teal-900 font-bold rounded-2xl text-xs hover:bg-teal-50 shadow-md transition-all shrink-0"
              >
                <Plus className="w-4 h-4 text-teal-700" />
                Book New Test
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionCards.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigateTab && onNavigateTab(card.id)}
                className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md cursor-pointer transition-all space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                    {card.label}
                  </h3>
                  <p className="text-xs text-slate-500">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Tests Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recent Test Requests</h3>
              <p className="text-xs text-slate-500">Track live progress of your medical analysis</p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-800"
              >
                View Full History
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {tests.map(test => (
              <div
                key={test.id}
                onClick={() => onSelectTest && onSelectTest(test)}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-teal-50/30 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                    <TestTube className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {test.testName || test.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Category: {test.category || 'General'} • Date: {test.requestedDate || 'Recent'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    test.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {test.status || 'Processing'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))}

            {tests.length === 0 && (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <TestTube className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No laboratory test records found</p>
                <p className="text-xs text-slate-400">Book an appointment to request tests</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
