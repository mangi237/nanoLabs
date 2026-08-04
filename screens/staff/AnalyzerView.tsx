import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { db } from '../../services/firebase';
import { authService } from '../../services/authService';
import { 
  Microscope, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  Syringe, 
  User, 
  Key,
  X,
  Lock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface AnalyzerViewProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  onBack,
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress
}) => {
  const { lab, user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'collected'>('pending');
  
  // Modal & Access Code State
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const targetLabId = lab?.id || 'lab-1';
      const patientsSnapshot = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const allTests: any[] = [];

      patientsSnapshot.docs.forEach(docSnap => {
        const patientData = docSnap.data();
        if (patientData.labTests && Array.isArray(patientData.labTests)) {
          patientData.labTests.forEach((test: any) => {
            const isPaid = test.paymentStatus === 'paid' || test.paid === true;
            allTests.push({
              ...test,
              patientId: docSnap.id,
              patientName: patientData.name || patientData.fullName || 'Patient Record',
              patientCode: patientData.patientId || patientData.accessCode || 'P-1000',
              age: patientData.age,
              gender: patientData.gender,
              isPaid
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

  const handleOpenCollectModal = (test: any) => {
    if (!test.isPaid) {
      alert('Cannot collect sample: Patient payment has not been verified by Cashier yet.');
      return;
    }
    setSelectedTest(test);
    setAccessCodeInput('');
    setVerifyError('');
    setShowCollectModal(true);
  };

  const handleConfirmCollectionWithCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerifyError('');

    if (!accessCodeInput.trim()) {
      setVerifyError('Sample Collector access code is required.');
      return;
    }

    setProcessingId(`${selectedTest.patientId}-${selectedTest.id}`);
    try {
      // Validate staff code
      const authCheck = await authService.verifyStaffActionCode(
        accessCodeInput, 
        ['analyzer', 'labtech', 'superadmin', 'admin', 'receptionist'],
        user?.accessCode
      );

      if (!authCheck.authorized) {
        setVerifyError(authCheck.error || 'Invalid Sample Collector access code.');
        setProcessingId(null);
        return;
      }

      const targetLabId = lab?.id || 'lab-1';
      const patientRef = doc(db, 'labs', targetLabId, 'patients', selectedTest.patientId);
      const patientsSnap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const targetDoc = patientsSnap.docs.find(d => d.id === selectedTest.patientId);

      if (targetDoc) {
        const patientData = targetDoc.data();
        const updatedTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === selectedTest.id) {
            return {
              ...t,
              status: 'collected',
              sampleCollected: true,
              collectedDate: new Date().toISOString().split('T')[0],
              collectedBy: authCheck.staffName || user?.name || 'Sample Collector'
            };
          }
          return t;
        });
        await updateDoc(patientRef, { 
          labTests: updatedTests,
          updatedAt: new Date().toISOString()
        });
      }

      setShowCollectModal(false);
      fetchTests();
    } catch (err: any) {
      console.error('Failed to collect specimen:', err);
      setVerifyError(err?.message || 'Failed to confirm sample collection.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCollection = tests.filter(t => t.status === 'requested' || (!t.sampleCollected && t.status !== 'completed'));
  const collectedSamples = tests.filter(t => t.sampleCollected || t.status === 'collected' || t.status === 'completed');

  const filteredTests = (activeTab === 'pending' ? pendingCollection : collectedSamples).filter(t => 
    t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.patientCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Analyzer & Sample Collection Station"
        subtitle="Collect biological specimens & accession lab samples"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
              <Microscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Specimen Collection Station</h2>
              <p className="text-xs text-slate-500">Accession paid patient tests and verify phlebotomy sample collection</p>
            </div>
          </div>

          <button 
            onClick={() => { setRefreshing(true); fetchTests(); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
            Refresh Queue
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-purple-50/80 border border-purple-200/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
              <Syringe className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{pendingCollection.length}</div>
              <div className="text-xs font-bold text-purple-800">Pending Collection</div>
              <p className="text-[11px] text-purple-700/80 mt-0.5">Patients queued for specimen sampling</p>
            </div>
          </div>

          <div className="bg-blue-50/80 border border-blue-200/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{collectedSamples.length}</div>
              <div className="text-xs font-bold text-blue-800">Specimens Accessioned</div>
              <p className="text-[11px] text-blue-700/80 mt-0.5">Samples delivered to lab technician</p>
            </div>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Collection ({pendingCollection.length})
            </button>
            <button
              onClick={() => setActiveTab('collected')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'collected'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Collected Samples ({collectedSamples.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search patient, test or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>
        </div>

        {/* Content Table/List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading specimen workqueue...
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="py-16 text-center px-4 space-y-2">
              <Syringe className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No tests found</p>
              <p className="text-xs text-slate-500">
                {activeTab === 'pending' 
                  ? 'No patients waiting for sample collection right now.' 
                  : 'No historical specimen logs recorded.'}
              </p>
            </div>
          ) : (
            filteredTests.map((test) => {
              const testKey = `${test.patientId}-${test.id}`;

              return (
                <div key={testKey} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{test.testName || test.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {test.category || 'Specimen Test'}
                      </span>

                      {!test.isPaid && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Unpaid (Cashier Verification Needed)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {test.patientName} ({test.patientCode})
                      </span>
                      {test.age && <span>• {test.age} yrs, {test.gender}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {test.sampleCollected || test.status === 'collected' || test.status === 'completed' ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Specimen Accessioned
                      </span>
                    ) : !test.isPaid ? (
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed border border-slate-200"
                        title="Cashier payment verification required before sample collection"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Awaiting Payment
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenCollectModal(test)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                      >
                        <Syringe className="w-4 h-4" />
                        Collect Specimen
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Access Code Verification Modal */}
      {showCollectModal && selectedTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-purple-300" />
                <div>
                  <h3 className="font-bold text-base">Sample Collector Authorization</h3>
                  <p className="text-purple-200 text-xs">Confirming specimen collection for {selectedTest.patientName}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCollectModal(false)}
                className="text-purple-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCollectionWithCode} className="p-6 space-y-4">
              <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-xs text-purple-900 space-y-1">
                <div className="font-bold">{selectedTest.testName || selectedTest.name}</div>
                <div>Patient: <strong>{selectedTest.patientName} ({selectedTest.patientCode})</strong></div>
                <div className="text-[11px] text-purple-700">Payment Status: Cashier Verified (Paid)</div>
              </div>

              {verifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                  Enter Sample Collector Access Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="e.g. ANALYZER123 or TECH123"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Use your staff access code (e.g. ANALYZER123, SAMPLE123, TECH123) to sign specimen collection.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === `${selectedTest.patientId}-${selectedTest.id}`}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {processingId === `${selectedTest.patientId}-${selectedTest.id}` ? 'Authorizing...' : 'Confirm Sample Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzerView;
