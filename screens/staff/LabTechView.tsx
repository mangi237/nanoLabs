import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  RefreshCw, 
  Upload, 
  User, 
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { db } from '../../services/firebase';

interface LabTechViewProps {
  onNavigate?: (screen: string, params?: any) => void;
}

export const LabTechView: React.FC<LabTechViewProps> = () => {
  const { lab, user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

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
      console.error('Error fetching lab tech tests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [lab?.id]);

  const handleOpenResultModal = (test: any) => {
    setSelectedTest(test);
    setResult(test.result || '');
    setNotes(test.notes || '');
    setShowResultModal(true);
  };

  const handleSaveResult = async () => {
    if (!result.trim()) {
      alert('Please enter test result value or observations.');
      return;
    }
    
    setSubmitting(true);
    try {
      const patientRef = doc(db, 'labs', lab?.id || 'lab-1', 'patients', selectedTest.patientId);
      const patientSnap = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'patients'));
      const targetDoc = patientSnap.docs.find(d => d.id === selectedTest.patientId);
      
      if (targetDoc) {
        const patientData = targetDoc.data();
        const updatedLabTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === selectedTest.id) {
            return {
              ...t,
              status: 'completed',
              result: result.trim(),
              notes: notes.trim(),
              completedDate: new Date().toISOString().split('T')[0],
              completedBy: user?.name || 'Lab Tech'
            };
          }
          return t;
        });
        await updateDoc(patientRef, { labTests: updatedLabTests });
      }

      setShowResultModal(false);
      fetchTests();
    } catch (err) {
      console.error('Failed to submit test results:', err);
      alert('Failed to submit test results. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingTests = tests.filter(t => t.status === 'collected' || t.status === 'processing');
  const completedTests = tests.filter(t => t.status === 'completed');

  const filteredTests = (activeTab === 'pending' ? pendingTests : completedTests).filter(t => 
    t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-slate-900">Lab Technician Workstation</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Process collected samples, run laboratory analysis, and upload diagnostic results.
          </p>
        </div>
        <button 
          onClick={() => { setRefreshing(true); fetchTests(); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          Refresh Workspace
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{pendingTests.length}</div>
            <div className="text-sm font-medium text-amber-800">Pending Analysis</div>
            <p className="text-xs text-amber-700/80 mt-0.5">Samples collected and ready for processing</p>
          </div>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{completedTests.length}</div>
            <div className="text-sm font-medium text-emerald-800">Completed Today</div>
            <p className="text-xs text-emerald-700/80 mt-0.5">Results verified and uploaded</p>
          </div>
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Processing ({pendingTests.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedTests.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or test..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading diagnostic workqueue...
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="py-16 text-center px-4">
            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No tests found</p>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === 'pending' 
                ? 'There are currently no collected samples waiting to be analyzed.' 
                : 'No completed diagnostic tests found in history.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTests.map((test) => (
              <div key={`${test.patientId}-${test.id}`} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-base">{test.testName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      {test.category || 'Laboratory'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
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

                  {test.result && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl text-sm border border-slate-200/80 text-slate-800">
                      <span className="font-semibold text-teal-800">Result: </span>
                      {test.result}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {test.status === 'completed' ? (
                    <button
                      onClick={() => handleOpenResultModal(test)}
                      className="px-4 py-2 border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Edit Result
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenResultModal(test)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Result
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload/Edit Modal */}
      {showResultModal && selectedTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-teal-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{selectedTest.testName}</h3>
                <p className="text-teal-200 text-xs mt-0.5">Patient: {selectedTest.patientName}</p>
              </div>
              <button 
                onClick={() => setShowResultModal(false)}
                className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Test Result Findings <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Enter lab findings, values, units, or diagnostic conclusion..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Lab Tech Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Verified by Dr. Vance, sample clear"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResult}
                disabled={submitting}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Submit Diagnostic Result'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
