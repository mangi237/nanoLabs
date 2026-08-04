import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection, updateDoc, doc } from '../../services/firebase';
import { 
  TestTube, 
  Search, 
  ChevronRight, 
  FileText, 
  ArrowLeft, 
  Download, 
  CheckCircle2,
  DollarSign,
  Laptop,
  Clock,
  ExternalLink
} from 'lucide-react';

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
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, [user?.id, user?.email]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const targetLabId = lab?.id || 'lab-1';
      const snap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const found = snap.docs.find(d => 
        d.id === user?.id ||
        d.data().email === user?.email || 
        d.data().accessCode === user?.accessCode ||
        d.data().name === user?.name
      );

      if (found && found.data().labTests) {
        setTests(found.data().labTests);
      } else {
        setTests([
          {
            id: 'Unavailable',
            testName: 'Unavailable',
            category: 'Unavailable',
            price: 0,
            paymentStatus: 'UNAVAILABLE',
            status: 'UNAVAILABLE',
            requestedDate: 'NULL',
            result: 'UNAVAILABLE',
            virtualRequested: false
          },
          {
            id: 'UNAVAILABLE',
            testName: 'UNAVAILABLE',
            category: 'UNAVAILABLE',
            price: 7500,
            paymentStatus: 'UNAVAILABLE',
            status: 'UNAVAILABLE',
            requestedDate: 'NULL',
            virtualRequested: false
          }
        ]);
      }
    } catch (e) {
      console.error('Error fetching test history:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVirtual = async (e: React.MouseEvent, testItem: any) => {
    e.stopPropagation();
    setRequestingId(testItem.id);
    try {
      const targetLabId = lab?.id || 'lab-1';
      const snap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const foundDoc = snap.docs.find(d => 
        d.id === user?.id ||
        d.data().email === user?.email || 
        d.data().accessCode === user?.accessCode ||
        d.data().name === user?.name
      );

      if (foundDoc) {
        const patientData = foundDoc.data();
        const updatedTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === testItem.id) {
            return {
              ...t,
              virtualRequested: true,
              virtualRequestedAt: new Date().toISOString()
            };
          }
          return t;
        });

        await updateDoc(doc(db, 'labs', targetLabId, 'patients', foundDoc.id), {
          labTests: updatedTests,
          updatedAt: new Date().toISOString()
        });
      }

      fetchTests();
    } catch (err) {
      console.error('Error requesting virtual result:', err);
    } finally {
      setRequestingId(null);
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
        subtitle="View diagnostic records, prices paid & request virtual results"
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

        {/* Top Card */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Diagnostic Test Records</h2>
            <p className="text-xs text-slate-500">Track lab findings, prices paid and digital PDF reports</p>
          </div>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200 self-start sm:self-auto">
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        {/* List of Tests */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading your medical lab reports...
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <TestTube className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No laboratory test records found</p>
            </div>
          ) : (
            filteredTests.map(test => {
              const price = test.price || test.amount || 5000;
              const hasPdf = Boolean(test.pdfUrl || test.fileUrl);

              return (
                <div
                  key={test.id}
                  onClick={() => onSelectTest && onSelectTest(test)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-teal-50/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0 mt-0.5">
                      <TestTube className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {test.testName || test.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {test.category || 'General'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>Requested: {test.requestedDate || 'Recent'}</span>
                        <span>•</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          Price Paid: {price.toLocaleString()} FCFA
                        </span>
                      </div>

                      {test.result && (
                        <p className="text-xs text-slate-700 font-medium truncate max-w-lg bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 mt-1">
                          Findings: {test.result}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {hasPdf ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        PDF Virtual Result Ready
                      </span>
                    ) : test.virtualRequested ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                        Virtual Requested
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleRequestVirtual(e, test)}
                        disabled={requestingId === test.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Laptop className="w-3.5 h-3.5" />
                        {requestingId === test.id ? 'Requesting...' : 'Request Virtual Result'}
                      </button>
                    )}

                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default TestHistoryScreen;
