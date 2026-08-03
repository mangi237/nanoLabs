import React, { useState, useEffect } from 'react';
import { 
  Microscope, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  Syringe, 
  User, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { db } from '../../services/firebase';

interface AnalyzerViewProps {
  onNavigate?: (screen: string, params?: any) => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = () => {
  const { lab, user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'collected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const patientsSnapshot = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'patients'));
      const allTests: any[] = [];

      patientsSnapshot.docs.forEach(docSnap => {
        const patientData = docSnap.data();
        if (patientData.labTests && Array.isArray(patientData.labTests)) {
          patientData.labTests.forEach((test: any) => {
            allTests.push({
              ...test,
              patientId: docSnap.id,
              patientName: patientData.name || patientData.fullName || 'Unknown Patient',
              patientCode: patientData.patientId || 'P-000',
              age: patientData.age,
              gender: patientData.gender
            });
          });
        }
      });

      setTests(allTests);
    } catch (err) {
      console.error('Error fetching sample collection tests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [lab?.id]);

  const handleCollectSpecimen = async (test: any) => {
    setProcessingId(`${test.patientId}-${test.id}`);
    try {
      const patientRef = doc(db, 'labs', lab?.id || 'lab-1', 'patients', test.patientId);
      const patientsSnap = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'patients'));
      const targetDoc = patientsSnap.docs.find(d => d.id === test.patientId);

      if (targetDoc) {
        const patientData = targetDoc.data();
        const updatedTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === test.id) {
            return {
              ...t,
              status: 'collected',
              sampleCollected: true,
              collectedDate: new Date().toISOString().split('T')[0],
              collectedBy: user?.name || 'Phlebotomist/Analyzer'
            };
          }
          return t;
        });
        await updateDoc(patientRef, { labTests: updatedTests });
      }

      fetchTests();
    } catch (err) {
      console.error('Failed to collect specimen:', err);
      alert('Failed to mark sample as collected. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCollection = tests.filter(t => t.status === 'requested' || !t.sampleCollected);
  const collectedSamples = tests.filter(t => t.sampleCollected || t.status === 'collected' || t.status === 'completed');

  const filteredTests = (activeTab === 'pending' ? pendingCollection : collectedSamples).filter(t => 
    t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.patientCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Microscope className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900">Analyzer & Sample Collection Station</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Collect biological specimens (blood, urine, swabs) and verify sample integrity.
          </p>
        </div>
        <button 
          onClick={() => { setRefreshing(true); fetchTests(); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          Refresh Station
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-50/80 border border-purple-200/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
            <Syringe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{pendingCollection.length}</div>
            <div className="text-sm font-medium text-purple-800">Pending Collection</div>
            <p className="text-xs text-purple-700/80 mt-0.5">Patients queued for phlebotomy & specimen sampling</p>
          </div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{collectedSamples.length}</div>
            <div className="text-sm font-medium text-blue-800">Specimens Collected</div>
            <p className="text-xs text-blue-700/80 mt-0.5">Samples accessioned into lab queue</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Collection ({pendingCollection.length})
            </button>
            <button
              onClick={() => setActiveTab('collected')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'collected'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Collected Samples ({collectedSamples.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, test..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading sample queue...
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Syringe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No tests found</p>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === 'pending' 
                ? 'No patients waiting for sample collection right now.' 
                : 'No historical specimen logs found.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTests.map((test) => {
              const testKey = `${test.patientId}-${test.id}`;
              const isProcessing = processingId === testKey;

              return (
                <div key={testKey} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-base">{test.testName}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        {test.category || 'Specimen Test'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-900">
                        <User className="w-4 h-4 text-slate-400" />
                        {test.patientName} ({test.patientCode})
                      </span>
                      {test.age && <span>• {test.age} yrs, {test.gender}</span>}
                    </div>

                    {test.requestedDate && (
                      <div className="text-xs text-slate-400">
                        Requested: {test.requestedDate}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {test.sampleCollected || test.status === 'collected' || test.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Specimen Accessioned
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCollectSpecimen(test)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Collecting...
                          </>
                        ) : (
                          <>
                            <Syringe className="w-4 h-4" />
                            Collect Specimen
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
