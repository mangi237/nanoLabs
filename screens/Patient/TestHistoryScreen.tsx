import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { TestTube, Search, ChevronRight, FileText, ArrowLeft, Download, CheckCircle2 } from 'lucide-react';

interface TestHistoryScreenProps {
  onBack?: () => void;
  onSelectTest?: (test: any) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const TestHistoryScreen: React.FC<TestHistoryScreenProps> = ({
  onBack,
  onSelectTest,
  onNotificationPress,
  onProfilePress
}) => {
  const { user, lab } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, [user?.id]);

  const fetchTests = async () => {
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
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter(t =>
    (t.testName || t.name)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Laboratory Test History"
        subtitle="Complete history of medical lab reports & diagnostics"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Lab Test Records</h2>
            <p className="text-xs text-slate-500">View diagnostic findings, prices & results</p>
          </div>
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {filteredTests.length} Tests Recorded
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search test reports by name or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          {filteredTests.map(test => (
            <div
              key={test.id}
              onClick={() => onSelectTest && onSelectTest(test)}
              className="p-5 flex items-center justify-between gap-4 hover:bg-teal-50/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                  <TestTube className="w-6 h-6" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm truncate">
                    {test.testName || test.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: {test.category || 'General'} • Requested: {test.requestedDate || 'Recent'}
                  </p>
                  {test.result && (
                    <p className="text-xs text-slate-700 font-medium truncate max-w-md bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                      Result: {test.result}
                    </p>
                  )}
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
        </div>
      </main>
    </div>
  );
};

export default TestHistoryScreen;
