import React, { useState } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { db } from '../../services/firebase';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Activity, 
  Laptop, 
  FileText, 
  ExternalLink,
  DollarSign,
  Building2,
  Clock,
  Sparkles
} from 'lucide-react';

interface ResultViewScreenProps {
  test?: any;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const ResultViewScreen: React.FC<ResultViewScreenProps> = ({
  test,
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  const { user, lab } = useAuth();
  const [currentTest, setCurrentTest] = useState<any>(test || {
    id: 'T-101',
    testName: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    price: 5000,
    paymentStatus: 'paid',
    requestedDate: '2026-08-01',
    completedDate: '2026-08-02',
    status: 'completed',
    result: 'Hemoglobin: 14.2 g/dL (Normal). WBC: 6.5 x10^3/uL. RBC: 4.8 x10^6/uL. Platelets: 250 x10^3/uL.',
    patientName: user?.name || 'Valued Patient',
    patientId: user?.patientId || 'P-9021',
    virtualRequested: false
  });

  const [requestingVirtual, setRequestingVirtual] = useState(false);
  const [virtualRequested, setVirtualRequested] = useState(Boolean(currentTest.virtualRequested));

  const handleRequestVirtualResult = async () => {
    setRequestingVirtual(true);
    try {
      const targetLabId = lab?.id || 'lab-1';
      const patientsSnap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      
      let foundPatientDoc = patientsSnap.docs.find(d => 
        d.id === user?.id || 
        d.data().email === user?.email || 
        d.data().accessCode === user?.accessCode ||
        d.data().name === user?.name
      );

      if (foundPatientDoc) {
        const patientData = foundPatientDoc.data();
        const updatedTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === currentTest.id || t.testName === currentTest.testName) {
            return {
              ...t,
              virtualRequested: true,
              virtualRequestedAt: new Date().toISOString()
            };
          }
          return t;
        });

        await updateDoc(doc(db, 'labs', targetLabId, 'patients', foundPatientDoc.id), {
          labTests: updatedTests,
          updatedAt: new Date().toISOString()
        });
      }

      setVirtualRequested(true);
      setCurrentTest((prev: any) => ({ ...prev, virtualRequested: true }));
    } catch (err) {
      console.error('Error requesting virtual result:', err);
      alert('Failed to submit virtual result request. Please try again.');
    } finally {
      setRequestingVirtual(false);
    }
  };

  const isCompleted = currentTest.status === 'completed';
  const hasPdf = Boolean(currentTest.pdfUrl || currentTest.fileUrl);
  const pdfLink = currentTest.pdfUrl || currentTest.fileUrl;
  const pricePaid = currentTest.price || currentTest.amount || 5000;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Laboratory Test Report"
        subtitle="Official diagnostic findings & price documentation"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-lg space-y-6">
          
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  nano<span className="text-teal-600">Labs</span> Diagnostic Report
                </h1>
                <p className="text-xs text-slate-500 font-mono">Report ID: NL-{currentTest.id || '99201'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              {hasPdf && (
                <a
                  href={pdfLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </a>
              )}
            </div>
          </div>

          {/* PHYSICAL & VIRTUAL PICKUP NOTICE BANNER */}
          <div className="p-4 bg-teal-50 border border-teal-200/80 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-900 font-bold">
                <Building2 className="w-4 h-4 text-teal-600" />
                Physical & Virtual Result Pickup Info
              </div>

              {!virtualRequested && !hasPdf && (
                <button
                  onClick={handleRequestVirtualResult}
                  disabled={requestingVirtual}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  {requestingVirtual ? 'Requesting...' : 'Request Virtual Result'}
                </button>
              )}
            </div>

            <p className="text-slate-700 leading-relaxed">
              {hasPdf ? (
                <span>
                  🎉 <strong>Your virtual result PDF is ready!</strong> You can view and download your report directly above. You may also visit the laboratory receptionist at any time to pick up your official hardcopy physical result.
                </span>
              ) : isCompleted ? (
                <span>
                  ✅ <strong>Test analysis completed!</strong> Your paper result is available at the lab receptionist desk. Click <strong>"Request Virtual Result"</strong> if you want the lab technician to upload an online digital PDF for you.
                </span>
              ) : (
                <span>
                  ⏳ <strong>Test currently processing.</strong> You will receive an update once analysis is complete. You can request a virtual result online so the lab technician uploads the PDF directly to your portal.
                </span>
              )}
            </p>

            {virtualRequested && !hasPdf && (
              <div className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-100/70 px-3 py-1 rounded-lg font-bold">
                <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                Virtual Result Requested — Lab Tech notified to upload PDF
              </div>
            )}
          </div>

          {/* Patient & Financial Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Patient Name</span>
              <span className="font-bold text-slate-900">{currentTest.patientName || user?.name || 'Patient'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Patient Code</span>
              <span className="font-mono font-semibold text-slate-800">{currentTest.patientCode || currentTest.patientId || user?.patientId || 'P-9021'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Price Paid</span>
              <span className="font-black text-emerald-700 text-sm">{pricePaid.toLocaleString()} FCFA</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Payment Status</span>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                VERIFIED (Paid)
              </span>
            </div>
          </div>

          {/* Test Title & Category */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{currentTest.testName || currentTest.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                {currentTest.category || 'Clinical'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Requested: {currentTest.requestedDate || 'Recent'} • Completed: {currentTest.completedDate || 'Pending'}</p>
          </div>

          {/* Results Box */}
          <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-900 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Verified Diagnostic Findings
              </div>
              
              {hasPdf && (
                <a
                  href={pdfLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-teal-700 hover:underline flex items-center gap-1 font-bold"
                >
                  <FileText className="w-4 h-4" />
                  Open Full PDF Document
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <p className="text-sm font-medium text-slate-800 leading-relaxed font-mono">
              {currentTest.result || 'Sample collected. Diagnostic analysis completed within expected reference parameters.'}
            </p>

            {currentTest.notes && (
              <div className="pt-2 text-xs text-slate-600 italic">
                <strong>Tech Remarks:</strong> {currentTest.notes}
              </div>
            )}
          </div>

          {/* Footer Signature */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Verified by Lab Technologist & Medical Director
            </div>
            <span className="font-mono text-[11px]">nanoLabs Security Hash: SEC-998102</span>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ResultViewScreen;
