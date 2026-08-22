import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { db } from '../../services/firebase';
import { cryptoSecurity } from '../../utils/cryptoSecurity';
import { auditService } from '../../services/auditService';
import PatientActivityAuditModal from '../../components/medical/PatientActivityAuditModal';
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
  Check, 
  AlertCircle, 
  UserCheck, 
  CreditCard, 
  FlaskConical, 
  RefreshCw, 
  Shield, 
  FileCheck, 
  User, 
  BadgeAlert,
  History,
  Lock,
  Stethoscope
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
  const [currentTest, setCurrentTest] = useState<any>(test || {});
  const [loading, setLoading] = useState(false);
  const [requestingVirtual, setRequestingVirtual] = useState(false);
  const [virtualRequested, setVirtualRequested] = useState(Boolean(test?.virtualRequested));
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Sync / fetch latest test state from Firestore
  const fetchLatestTestData = async () => {
    setLoading(true);
    try {
      const targetLabId = lab?.id || 'lab-1';
      const patientsSnap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      
      let foundPatientDoc = patientsSnap.docs.find(d => 
        d.id === (test?.patientId || user?.id) || 
        d.data().patientId === (test?.patientCode || test?.patientId || user?.patientId) ||
        d.data().email === user?.email || 
        d.data().accessCode === user?.accessCode ||
        d.data().name === (test?.patientName || user?.name)
      );

      if (foundPatientDoc) {
        const patientData = foundPatientDoc.data();
        const foundTest = (patientData.labTests || []).find((t: any) => 
          t.id === (test?.id || currentTest.id) || 
          (t.testName === (test?.testName || currentTest.testName) && t.requestedDate === (test?.requestedDate || currentTest.requestedDate))
        );

        if (foundTest) {
          const decryptedTest = await cryptoSecurity.decryptTestRecord(foundTest);
          setCurrentTest({
            ...decryptedTest,
            patientName: patientData.name || test?.patientName || user?.name || 'Patient',
            patientCode: patientData.patientId || patientData.patientCode || test?.patientCode || user?.patientId || 'P-0000',
            patientPhone: patientData.phone || test?.patientPhone || ''
          });
          setVirtualRequested(Boolean(foundTest.virtualRequested));
        }
      }
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to sync live test data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (test) {
      setCurrentTest(test);
      setVirtualRequested(Boolean(test.virtualRequested));
    }
    fetchLatestTestData();

    // Log diagnostic report view in immutable audit ledger
    if (test || currentTest.id) {
      auditService.logPatientAccess({
        labId: lab?.id || 'lab-1',
        labName: lab?.name || 'nanoLabs Central Diagnostics',
        patientId: test?.patientId || test?.patientCode || user?.id || 'pat-1',
        patientName: test?.patientName || user?.name || 'Patient Record',
        patientCode: test?.patientCode || test?.patientId || user?.patientId || 'P-1000',
        action: 'VIEW_DIAGNOSTIC_REPORT',
        performedBy: {
          id: user?.id || 'user-anon',
          name: user?.name || 'Authorized Member',
          role: user?.role || 'staff',
          email: user?.email || ''
        },
        testId: test?.id || currentTest?.id,
        testName: test?.testName || test?.name || currentTest?.testName || 'Diagnostic Procedure',
        details: `Viewed diagnostic lifecycle report and clinical findings for ${test?.testName || test?.name || currentTest?.testName || 'Laboratory Test'}.`
      }).catch(e => console.warn('Audit view log error:', e));
    }
  }, [test?.id]);

  const handlePrintWithAudit = () => {
    auditService.logPatientAccess({
      labId: lab?.id || 'lab-1',
      labName: lab?.name || 'nanoLabs Central Diagnostics',
      patientId: currentTest.patientId || currentTest.patientCode || user?.id || 'pat-1',
      patientName: currentTest.patientName || user?.name || 'Patient Record',
      patientCode: currentTest.patientCode || currentTest.patientId || user?.patientId || 'P-1000',
      action: 'PRINT_REPORT',
      performedBy: {
        id: user?.id || 'user-anon',
        name: user?.name || 'Authorized Member',
        role: user?.role || 'staff',
        email: user?.email || ''
      },
      testId: currentTest.id,
      testName: currentTest.testName || currentTest.name || 'Diagnostic Procedure',
      details: `Generated physical printed report for ${currentTest.testName || currentTest.name || 'Laboratory Test'}.`
    }).catch(e => console.warn('Audit print log error:', e));

    window.print();
  };

  const handleDownloadWithAudit = () => {
    auditService.logPatientAccess({
      labId: lab?.id || 'lab-1',
      labName: lab?.name || 'nanoLabs Central Diagnostics',
      patientId: currentTest.patientId || currentTest.patientCode || user?.id || 'pat-1',
      patientName: currentTest.patientName || user?.name || 'Patient Record',
      patientCode: currentTest.patientCode || currentTest.patientId || user?.patientId || 'P-1000',
      action: 'DOWNLOAD_PDF_RESULTS',
      performedBy: {
        id: user?.id || 'user-anon',
        name: user?.name || 'Authorized Member',
        role: user?.role || 'staff',
        email: user?.email || ''
      },
      testId: currentTest.id,
      testName: currentTest.testName || currentTest.name || 'Diagnostic Procedure',
      details: `Downloaded AES-256 encrypted PDF result document (${currentTest.pdfName || 'Report.pdf'}).`
    }).catch(e => console.warn('Audit download log error:', e));
  };

  const handleRequestVirtualResult = async () => {
    setRequestingVirtual(true);
    try {
      const targetLabId = lab?.id || 'lab-1';
      const patientsSnap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      
      let foundPatientDoc = patientsSnap.docs.find(d => 
        d.id === (currentTest.patientId || user?.id) || 
        d.data().patientId === (currentTest.patientCode || user?.patientId) ||
        d.data().email === user?.email || 
        d.data().accessCode === user?.accessCode ||
        d.data().name === (currentTest.patientName || user?.name)
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

  // Accurate Status Variables
  const isPaid = Boolean(currentTest.paid === true || currentTest.paymentStatus === 'paid');
  const isConfirmedByReception = Boolean(currentTest.confirmedByReceptionist || currentTest.confirmedBy || currentTest.status === 'confirmed' || isPaid);
  const isSampleCollected = Boolean(currentTest.sampleCollected || currentTest.collectedBy || currentTest.status === 'collected' || currentTest.status === 'analyzing' || currentTest.status === 'completed');
  const isAnalyzing = Boolean(currentTest.status === 'analyzing' || (isSampleCollected && currentTest.status !== 'completed'));
  const isCompleted = Boolean(currentTest.status === 'completed');
  const hasPdf = Boolean(currentTest.pdfUrl || currentTest.fileUrl);
  const pdfLink = currentTest.pdfUrl || currentTest.fileUrl;

  // Accurate Pricing Breakdown
  const isPayPerTest = lab?.pricingModel === 'pay_per_test';
  const defaultFee = isPayPerTest ? (lab?.feePerTest || 500) : 0;
  const systemFee = Number(currentTest.systemFee !== undefined ? currentTest.systemFee : defaultFee);
  const basePrice = Number(currentTest.basePrice || (currentTest.price && systemFee > 0 && currentTest.price > systemFee ? currentTest.price - systemFee : (currentTest.price || 5000)));
  const totalPrice = Number(currentTest.totalPrice || currentTest.price || (basePrice + systemFee));

  // Staff Attribution Names
  const receptionistStaff = currentTest.confirmedBy || (isConfirmedByReception ? 'Reception Desk' : null);
  const cashierStaff = currentTest.paidBy || (isPaid ? 'Authorized Cashier' : null);
  const collectorStaff = currentTest.collectedBy || (isSampleCollected ? 'Specimen Collector / Analyzer' : null);
  const labTechStaff = currentTest.completedBy || currentTest.doctorName || (isCompleted ? 'Lab Technologist' : null);

  // Insurance details
  const insurance = currentTest.insuranceDetails;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Laboratory Diagnostic Report"
        subtitle="Live workflow lifecycle, staff authorization & clinical findings"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAuditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-emerald-700" />
              Access & Audit History
            </button>

            <button
              onClick={fetchLatestTestData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${loading ? 'animate-spin' : ''}`} />
              {refreshSuccess ? 'Updated!' : loading ? 'Syncing...' : 'Refresh Status'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-lg space-y-8">
          
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3.5">
              {lab?.logoUrl ? (
                <img
                  src={lab.logoUrl}
                  alt={lab.name || 'Lab Logo'}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-md bg-white p-0.5 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20 shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {lab?.name || 'nanoLabs Diagnostics'} Diagnostic Lifecycle Report
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  Report ID: NL-{currentTest.id || 'TST-001'} • Category: {currentTest.category || 'General Clinical'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePrintWithAudit}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>

              {hasPdf && (
                <a
                  href={pdfLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleDownloadWithAudit}
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
                  className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all cursor-pointer"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  {requestingVirtual ? 'Submitting...' : 'Request Virtual Result Online'}
                </button>
              )}
            </div>

            <p className="text-slate-700 leading-relaxed">
              Official physical laboratory hardcopies are available at our reception desk with doctor stamps. If you have requested a virtual report, our lab technologists will upload your encrypted PDF document below as soon as biochemistry analysis is verified.
            </p>
          </div>

          {/* ZERO-KNOWLEDGE ENCRYPTION & AUDIT BADGE */}
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-teal-500/20 text-teal-300 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Zero-Knowledge AES-GCM-256 Medical Confidentiality</span>
                <span className="text-[11px] text-slate-300">All diagnostic values are client-side encrypted before cloud transmission.</span>
              </div>
            </div>

            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-teal-300 font-mono text-[11px] rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              View Access Ledger ({currentTest.patientCode || 'PT-REC'})
            </button>
          </div>

          {/* WORKFLOW STATUS STEPPER (4 STAGES) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnostic Workflow Lifecycle</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Step 1: Reception */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isConfirmedByReception 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[10px] uppercase">1. Admission</span>
                  {isConfirmedByReception ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="font-bold text-slate-900">{isConfirmedByReception ? 'Confirmed' : 'Pending Check-in'}</div>
                <div className="text-[11px] text-slate-500 mt-1">{receptionistStaff || 'Receptionist Desk'}</div>
              </div>

              {/* Step 2: Cashier */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isPaid 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[10px] uppercase">2. Payment</span>
                  {isPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="font-bold text-slate-900">{isPaid ? 'Payment Verified' : 'Awaiting Cashier'}</div>
                <div className="text-[11px] text-slate-500 mt-1">{cashierStaff || 'Financial Cashier'}</div>
              </div>

              {/* Step 3: Phlebotomy / Collector */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isSampleCollected 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[10px] uppercase">3. Specimen</span>
                  {isSampleCollected ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="font-bold text-slate-900">{isSampleCollected ? 'Sample Collected' : 'Awaiting Draw'}</div>
                <div className="text-[11px] text-slate-500 mt-1">{collectorStaff || 'Phlebotomist / Analyzer'}</div>
              </div>

              {/* Step 4: Lab Technologist Analysis */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isCompleted 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                  : isAnalyzing
                    ? 'bg-blue-50/70 border-blue-200 text-blue-950 animate-pulse'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[10px] uppercase">4. Verification</span>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : isAnalyzing ? <FlaskConical className="w-4 h-4 text-blue-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="font-bold text-slate-900">{isCompleted ? 'Report Verified' : isAnalyzing ? 'In Analysis' : 'Pending Testing'}</div>
                <div className="text-[11px] text-slate-500 mt-1">{labTechStaff || 'Lab Technologist'}</div>
              </div>
            </div>
          </div>

          {/* CLINICAL FINDINGS & ATTACHED PDF CARD */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Findings & Diagnostic Report</h3>

            {isCompleted ? (
              <div className="space-y-4">
                {/* Structured Sub-Parameters Table if available */}
                {Array.isArray(currentTest.subParameters) && currentTest.subParameters.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider">
                      <FileCheck className="w-4 h-4 text-teal-600" />
                      Biochemical Parameter Values & Reference Ranges
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Analyte / Parameter</th>
                            <th className="py-2.5 px-3">Measured Finding</th>
                            <th className="py-2.5 px-3">Unit</th>
                            <th className="py-2.5 px-3">Biological Reference Range</th>
                            <th className="py-2.5 px-3 text-right">Status Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentTest.subParameters.map((sp: any, idx: number) => {
                            const isHigh = sp.flag === 'High';
                            const isLow = sp.flag === 'Low';
                            const refStr = sp.refRangeMale || sp.refRange || sp.refRangeFemale || `${sp.maleMin || 0} - ${sp.maleMax || 100}`;

                            return (
                              <tr key={sp.id || idx} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{sp.name}</td>
                                <td className="py-2.5 px-3 font-mono font-black text-slate-900">{sp.value || 'Normal'}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{sp.unit || '-'}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{refStr}</td>
                                <td className="py-2.5 px-3 text-right">
                                  {isHigh ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800">HIGH</span>
                                  ) : isLow ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800">LOW</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">NORMAL</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Single value or text result */}
                {currentTest.resultValue && (!currentTest.subParameters || currentTest.subParameters.length === 0) && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm leading-relaxed space-y-2">
                    <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider">
                      <FileCheck className="w-4 h-4 text-teal-600" />
                      Validated Laboratory Findings
                    </div>
                    <div className="font-mono font-black text-lg text-slate-900">
                      {currentTest.resultValue} {currentTest.units || ''}
                    </div>
                  </div>
                )}

                {/* Legacy or general text result */}
                {currentTest.result && !currentTest.resultValue && (!currentTest.subParameters || currentTest.subParameters.length === 0) && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm leading-relaxed space-y-2">
                    <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider">
                      <FileCheck className="w-4 h-4 text-teal-600" />
                      Validated Laboratory Findings
                    </div>
                    <p className="text-slate-800 font-medium whitespace-pre-wrap">{currentTest.result}</p>
                  </div>
                )}

                {/* Biologist / Clinical Pathologist Remarks */}
                {(currentTest.biologistRemarks || currentTest.notes || currentTest.labNotes) && (
                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1.5 text-xs">
                    <div className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-purple-700" />
                      Clinical Pathologist & Biologist Interpretation
                    </div>
                    <p className="text-purple-900 leading-relaxed font-medium">
                      {currentTest.biologistRemarks || currentTest.notes || currentTest.labNotes}
                    </p>
                    {currentTest.biologistName && (
                      <div className="pt-1 text-[11px] text-purple-700 font-semibold">
                        Signed: {currentTest.biologistName} (Verified Clinical Biologist)
                      </div>
                    )}
                  </div>
                )}

                {hasPdf && (
                  <div className="p-5 bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-teal-600 text-white rounded-xl shadow-md">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {currentTest.pdfName || `${currentTest.testName || 'DiagnosticReport'}.pdf`}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {currentTest.pdfSize ? `${(currentTest.pdfSize / 1024).toFixed(1)} KB • ` : ''}Digitally signed & encrypted certificate
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={pdfLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleDownloadWithAudit}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF Certificate
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Clock className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                <h4 className="font-bold text-slate-800 text-sm">Diagnostic Testing in Progress</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Our laboratory technologists are executing specimen analysis. Once validated, your encrypted digital PDF will appear directly on this screen.
                </p>
              </div>
            )}
          </div>

          {/* FINANCIAL BILLING BREAKDOWN */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial & Fee Breakdown</h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Diagnostic Procedure Base Fee</span>
                <span className="font-semibold text-slate-800">{basePrice.toLocaleString()} FCFA</span>
              </div>
              {systemFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">nanoLabs System & Software Processing Fee</span>
                  <span className="font-semibold text-slate-800">{systemFee.toLocaleString()} FCFA</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                <span>Total Amount</span>
                <span className="text-teal-700">{totalPrice.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Patient Activity & Access Audit Modal */}
      <PatientActivityAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        patient={{
          id: currentTest.patientId || currentTest.patientCode || user?.id || 'pat-1',
          patientId: currentTest.patientCode || currentTest.patientId || user?.patientId || 'P-1000',
          patientCode: currentTest.patientCode || currentTest.patientId || 'P-1000',
          name: currentTest.patientName || user?.name || 'Patient Record',
          phone: currentTest.patientPhone || user?.phone || ''
        }}
        labId={lab?.id || 'lab-1'}
        labName={lab?.name || 'nanoLabs Central Diagnostics'}
      />
    </div>
  );
};

export default ResultViewScreen;
