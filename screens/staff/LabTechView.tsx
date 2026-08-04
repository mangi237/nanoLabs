import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { db } from '../../services/firebase';
import { uploadService } from '../../api/upload';
import { authService } from '../../services/authService';
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
  Key,
  Lock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  FileUp,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface LabTechViewProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const LabTechView: React.FC<LabTechViewProps> = ({
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  const { lab, user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'virtual' | 'completed'>('pending');

  // Result Upload Modal state
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultText, setResultText] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    setResultText(test.result || '');
    setNotes(test.notes || '');
    setPdfUrl(test.pdfUrl || test.fileUrl || '');
    setPdfName(test.pdfName || (test.pdfUrl ? 'DiagnosticReport.pdf' : ''));
    setPdfFile(null);
    setAccessCodeInput('');
    setVerifyError('');
    setShowResultModal(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setVerifyError('');
    try {
      const uploadRes = await uploadService.uploadFile(file);
      if (uploadRes.success && uploadRes.fileUrl) {
        setPdfUrl(uploadRes.fileUrl);
        setPdfName(uploadRes.fileName || file.name);
      } else {
        setVerifyError(uploadRes.error || 'File upload failed');
      }
    } catch (err: any) {
      setVerifyError('Error processing file upload.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveResultWithCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerifyError('');

    if (!resultText.trim() && !pdfUrl) {
      setVerifyError('Please enter diagnostic findings or upload a PDF report file.');
      return;
    }

    if (!accessCodeInput.trim()) {
      setVerifyError('Lab Technician access code is required to authorize upload.');
      return;
    }

    setSubmitting(true);
    try {
      // Verify Lab Tech Access Code
      const authCheck = await authService.verifyStaffActionCode(
        accessCodeInput,
        ['labtech', 'superadmin', 'admin'],
        user?.accessCode
      );

      if (!authCheck.authorized) {
        setVerifyError(authCheck.error || 'Invalid Lab Tech access code.');
        setSubmitting(false);
        return;
      }

      const targetLabId = lab?.id || 'lab-1';
      const patientRef = doc(db, 'labs', targetLabId, 'patients', selectedTest.patientId);
      const patientSnap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const targetDoc = patientSnap.docs.find(d => d.id === selectedTest.patientId);
      
      if (targetDoc) {
        const patientData = targetDoc.data();
        const updatedLabTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === selectedTest.id) {
            return {
              ...t,
              status: 'completed',
              result: resultText.trim(),
              notes: notes.trim(),
              pdfUrl: pdfUrl || t.pdfUrl || null,
              pdfName: pdfName || 'DiagnosticReport.pdf',
              virtualFulfilled: true,
              completedDate: new Date().toISOString().split('T')[0],
              completedBy: authCheck.staffName || user?.name || 'Lab Technologist'
            };
          }
          return t;
        });
        await updateDoc(patientRef, { 
          labTests: updatedLabTests,
          updatedAt: new Date().toISOString()
        });
      }

      setShowResultModal(false);
      fetchTests();
    } catch (err: any) {
      console.error('Failed to submit test results:', err);
      setVerifyError(err?.message || 'Failed to submit test results.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingTests = tests.filter(t => t.status === 'collected' || t.status === 'processing');
  const virtualRequests = tests.filter(t => t.virtualRequested && t.status !== 'completed');
  const completedTests = tests.filter(t => t.status === 'completed');

  const filteredTests = (
    activeTab === 'pending' ? pendingTests :
    activeTab === 'virtual' ? virtualRequests :
    completedTests
  ).filter(t => 
    t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.testName || t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.patientCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Lab Technician Workstation"
        subtitle="Process samples, upload PDF results & fulfill virtual requests"
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
            Back
          </button>
        )}

        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Lab Diagnostic Workstation</h2>
              <p className="text-xs text-slate-500">Run laboratory analyses, upload PDF reports to IPFS & process online virtual requests</p>
            </div>
          </div>

          <button 
            onClick={() => { setRefreshing(true); fetchTests(); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
            Refresh Workstation
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{pendingTests.length}</div>
              <div className="text-xs font-bold text-amber-800">Pending Analysis</div>
              <p className="text-[11px] text-amber-700/80 mt-0.5">Specimens collected ready for testing</p>
            </div>
          </div>

          <div className="bg-indigo-50/80 border border-indigo-200/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{virtualRequests.length}</div>
              <div className="text-xs font-bold text-indigo-800">Virtual PDF Requests</div>
              <p className="text-[11px] text-indigo-700/80 mt-0.5">Patients requesting online results</p>
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{completedTests.length}</div>
              <div className="text-xs font-bold text-emerald-800">Completed Today</div>
              <p className="text-[11px] text-emerald-700/80 mt-0.5">Verified & uploaded PDF reports</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Analysis ({pendingTests.length})
            </button>
            <button
              onClick={() => setActiveTab('virtual')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'virtual'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              Virtual Requests ({virtualRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedTests.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search patient or lab test..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>
        </div>

        {/* Content Table/List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading diagnostic queue...
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="py-16 text-center px-4 space-y-2">
              <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No diagnostic tests found</p>
              <p className="text-xs text-slate-500">
                {activeTab === 'pending' 
                  ? 'No collected samples waiting for laboratory testing right now.' 
                  : activeTab === 'virtual'
                  ? 'No patient has requested a virtual result online yet.'
                  : 'No completed diagnostic tests found in history.'}
              </p>
            </div>
          ) : (
            filteredTests.map((test) => (
              <div key={`${test.patientId}-${test.id}`} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{test.testName || test.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      {test.category || 'Laboratory'}
                    </span>

                    {test.virtualRequested && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                        <Laptop className="w-3 h-3" />
                        Virtual Result Requested
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

                  {test.result && (
                    <div className="mt-2 p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 text-slate-800">
                      <span className="font-bold text-teal-800">Findings: </span>
                      {test.result}
                    </div>
                  )}

                  {test.pdfUrl && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-teal-700 font-semibold">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>PDF Document Attached: {test.pdfName || 'DiagnosticReport.pdf'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {test.status === 'completed' ? (
                    <button
                      onClick={() => handleOpenResultModal(test)}
                      className="px-4 py-2 border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Update Result PDF
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenResultModal(test)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      {test.virtualRequested ? 'Upload Virtual Result PDF' : 'Upload Result PDF'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Upload PDF & Enter Result Modal */}
      {showResultModal && selectedTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-teal-900 to-emerald-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-teal-300" />
                  {selectedTest.testName || selectedTest.name}
                </h3>
                <p className="text-teal-200 text-xs mt-0.5">Patient: {selectedTest.patientName} ({selectedTest.patientCode})</p>
              </div>
              <button 
                onClick={() => setShowResultModal(false)}
                className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResultWithCode} className="p-6 space-y-4">
              {verifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* PDF FILE UPLOAD DROPZONE */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Upload PDF Diagnostic Report <span className="text-slate-400 font-normal">(Vercel API & Storage)</span>
                </label>
                
                <div className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-4 bg-slate-50/70 text-center space-y-2 transition-colors">
                  {uploadingFile ? (
                    <div className="py-2 text-xs text-teal-600 font-semibold flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      Uploading PDF report to Vercel API / Cloud Storage...
                    </div>
                  ) : pdfUrl ? (
                    <div className="flex items-center justify-between bg-teal-50 border border-teal-200 p-2.5 rounded-xl text-xs text-teal-900">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="font-bold truncate">{pdfName || 'UploadedReport.pdf'}</span>
                      </div>
                      <a 
                        href={pdfUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-teal-700 hover:underline flex items-center gap-1 font-bold shrink-0 ml-2"
                      >
                        View PDF
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs font-bold text-teal-700 hover:underline">Click to upload PDF report document</span>
                      <p className="text-[11px] text-slate-400">PDF, image, or scan up to 10MB</p>
                      <input 
                        type="file" 
                        accept=".pdf,image/*" 
                        onChange={handleFileSelect}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Text Findings */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Test Results & Diagnostic Findings
                </label>
                <textarea
                  rows={3}
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="Enter diagnostic text findings, numerical values, or lab remarks..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* ACCESS CODE SECURITY VERIFICATION */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-teal-600" />
                  Enter Lab Tech Access Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="e.g. TECH123"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Security authorization required. Enter your Lab Tech code (e.g. TECH123) to confirm upload.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Uploading & Signing...' : 'Confirm & Upload Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTechView;
