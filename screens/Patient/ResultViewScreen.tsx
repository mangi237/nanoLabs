import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { db } from '../../services/firebase';
import { cryptoSecurity } from '../../utils/cryptoSecurity';
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
  BadgeAlert
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
  }, [test?.id]);

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
  const basePrice = Number(currentTest.basePrice || (currentTest.price && currentTest.price > 1000 ? currentTest.price - (currentTest.systemFee || 1000) : 5000));
  const systemFee = Number(currentTest.systemFee !== undefined ? currentTest.systemFee : 1000);
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

          <button
            onClick={fetchLatestTestData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${loading ? 'animate-spin' : ''}`} />
            {refreshSuccess ? 'Updated!' : loading ? 'Syncing...' : 'Refresh Status'}
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-lg space-y-8">
          
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  nano<span className="text-teal-600">Labs</span> Diagnostic Lifecycle Report
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  Report ID: NL-{currentTest.id || 'TST-001'} • Category: {currentTest.category || 'General Clinical'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => window.print()}
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
                  ⏳ <strong>Test currently processing.</strong> Once all steps on the workflow roadmap below turn green, verified clinical findings will be published here. You can request a virtual result online so the lab technician uploads the PDF directly to your portal.
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

          {/* PATIENT & FINANCIAL SUMMARY GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">Patient Details</span>
              <span className="font-bold text-slate-900 text-sm block">{currentTest.patientName || user?.name || 'Valued Patient'}</span>
              <span className="font-mono text-slate-600 block">ID: {currentTest.patientCode || currentTest.patientId || user?.patientId || 'P-0000'}</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">Diagnostic Procedure</span>
              <span className="font-bold text-slate-900 text-sm block">{currentTest.testName || currentTest.name || 'Laboratory Test'}</span>
              <span className="text-slate-600 block">{currentTest.category || 'Clinical Diagnostic'}</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">Price Breakdown</span>
              <span className="font-black text-emerald-800 text-sm block">{totalPrice.toLocaleString()} FCFA</span>
              <span className="text-[11px] text-slate-600 block">
                {basePrice.toLocaleString()} + {systemFee.toLocaleString()} FCFA System Fee
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">Payment Status</span>
              {isPaid ? (
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    PAID & VERIFIED
                  </span>
                  <p className="text-[11px] text-slate-700 font-medium">
                    Method: {currentTest.paymentMethodLabel || currentTest.paymentMethod || 'Cash'}
                  </p>
                  {cashierStaff && (
                    <p className="text-[10px] text-slate-500">
                      Verified by: <strong>{cashierStaff}</strong>
                    </p>
                  )}
                  {currentTest.receiptNumber && (
                    <p className="text-[10px] font-mono text-slate-500">
                      Receipt: {currentTest.receiptNumber}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    <AlertCircle className="w-3 h-3 text-amber-700" />
                    UNPAID (Pending Cashier)
                  </span>
                  <p className="text-[10px] text-amber-800">
                    Please settle at Cashier Counter.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* INSURANCE SPLIT BREAKDOWN (IF APPLICABLE) */}
          {insurance && isPaid && (
            <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2.5 text-xs text-purple-950">
              <div className="flex items-center justify-between font-bold text-purple-900 border-b border-purple-200/70 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-700" />
                  Insurance Coverage & Co-Pay Settlement Details
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px] uppercase font-extrabold">
                  {insurance.coverageType === 'partial' ? `${insurance.insurancePercent}% Ins / ${insurance.patientPercent}% Co-Pay` : '100% Full Cover'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-purple-700 block font-medium text-[11px]">Insurance Provider</span>
                  <span className="font-bold text-purple-950">{insurance.company}</span>
                  <span className="block font-mono text-[10px] text-purple-800">Policy: {insurance.policyNumber}</span>
                </div>

                <div>
                  <span className="text-purple-700 block font-medium text-[11px]">Covered by Insurance</span>
                  <span className="font-bold text-purple-950">
                    {insurance.insurancePercent || insurance.coveragePercent || 100}% ({((insurance.insuranceAmount || totalPrice)).toLocaleString()} FCFA)
                  </span>
                  <span className="block text-[10px] text-purple-800">Billed to {insurance.company}</span>
                </div>

                <div>
                  <span className="text-purple-700 block font-medium text-[11px]">Patient Co-Pay Settled</span>
                  <span className="font-bold text-purple-950">
                    {insurance.patientPercent ? `${insurance.patientPercent}% (${(insurance.patientCoPayAmount || 0).toLocaleString()} FCFA)` : '0 FCFA (Fully Covered)'}
                  </span>
                  {insurance.patientCoPayMethodLabel && (
                    <span className="block text-[10px] text-purple-800">
                      Paid via {insurance.patientCoPayMethodLabel} {insurance.patientCoPayRef ? `(Ref: ${insurance.patientCoPayRef})` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* WORKFLOW ROADMAP (ROAD MAP WITH STEP-BY-STEP PROGRESS & STAFF ATTRIBUTION) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  Diagnostic Workflow Roadmap & Staff Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time progression map. Each completed step indicates the authorized staff member.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {isCompleted ? 'All Steps Completed' : isAnalyzing ? 'Laboratory Processing' : isSampleCollected ? 'Sample Accessioned' : isPaid ? 'Awaiting Specimen' : 'Awaiting Payment'}
              </span>
            </div>

            {/* Visual Roadmap Stepper */}
            <div className="space-y-3">
              
              {/* Step 1: Intake & Registration */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isConfirmedByReception 
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isConfirmedByReception ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {isConfirmedByReception ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        1. Patient Intake & Test Request
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        isConfirmedByReception ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isConfirmedByReception ? 'CONFIRMED' : 'PENDING'}
                      </span>
                    </div>

                    <p className="text-slate-600">
                      {isConfirmedByReception ? (
                        <span>
                          Test requested and registered in nanoLabs clinic queue on <strong>{currentTest.requestedDate || 'Recent'}</strong>.
                        </span>
                      ) : (
                        <span>Test request registered. Pending confirmation by receptionist.</span>
                      )}
                    </p>

                    {receptionistStaff && (
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold pt-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Administered by Receptionist: <strong>{receptionistStaff}</strong></span>
                        {currentTest.confirmedAt && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ({new Date(currentTest.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Cashier Payment Verification */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isPaid 
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : 'bg-amber-50/60 border-amber-200'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isPaid ? 'bg-emerald-600 text-white font-bold' : 'bg-amber-500 text-white font-bold'
                  }`}>
                    {isPaid ? <Check className="w-4 h-4 stroke-[3]" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        2. Cashier Invoice & Payment Clearance
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isPaid ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {isPaid ? 'PAID & AUTHORIZED' : 'UNPAID / ACTION REQUIRED'}
                      </span>
                    </div>

                    <p className="text-slate-600">
                      {isPaid ? (
                        <span>
                          Financial settlement verified for <strong>{totalPrice.toLocaleString()} FCFA</strong> ({basePrice.toLocaleString()} + {systemFee.toLocaleString()} FCFA System Fee) via <strong>{currentTest.paymentMethodLabel || currentTest.paymentMethod || 'Cash'}</strong>.
                        </span>
                      ) : (
                        <span>
                          Payment of <strong>{totalPrice.toLocaleString()} FCFA</strong> is pending. Please proceed to the Cashier desk for payment clearance.
                        </span>
                      )}
                    </p>

                    {isPaid && cashierStaff && (
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold pt-1">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Payment Authorized by Cashier: <strong>{cashierStaff}</strong></span>
                        {currentTest.paidAt && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ({new Date(currentTest.paidAt).toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Specimen / Sample Collection */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isSampleCollected 
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isSampleCollected ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {isSampleCollected ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        3. Specimen / Sample Collection & Accessioning
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        isSampleCollected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isSampleCollected ? 'SAMPLE COLLECTED' : 'AWAITING SPECIMEN'}
                      </span>
                    </div>

                    <p className="text-slate-600">
                      {isSampleCollected ? (
                        <span>
                          Patient specimen drawn, labeled with barcode, and accessioned into the laboratory workstation.
                        </span>
                      ) : (
                        <span>
                          Specimen has not yet been drawn. Once payment is settled, visit the sample collection station.
                        </span>
                      )}
                    </p>

                    {isSampleCollected && collectorStaff && (
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold pt-1">
                        <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Collected & Accessioned by: <strong>{collectorStaff}</strong></span>
                        {currentTest.collectedAt && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ({new Date(currentTest.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        )}
                      </div>
                    )}

                    {currentTest.materialsUsed && currentTest.materialsUsed.length > 0 && (
                      <div className="text-[11px] text-teal-800 pt-1">
                        <span className="font-bold">Reagents/Materials Used:</span>{' '}
                        {currentTest.materialsUsed.map((m: any, i: number) => (
                          <span key={i} className="inline-block bg-teal-100/70 px-1.5 py-0.5 rounded mr-1 text-[10px]">
                            {m.name} ({m.quantity} {m.unit || 'unit'})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 4: Laboratory Analysis & Testing */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isCompleted 
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : isAnalyzing 
                    ? 'bg-blue-50/70 border-blue-200' 
                    : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isCompleted ? 'bg-emerald-600 text-white font-bold' : isAnalyzing ? 'bg-blue-600 text-white font-bold' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : isAnalyzing ? <Activity className="w-4 h-4 animate-spin" /> : '4'}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        4. Laboratory Diagnostic Analysis
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        isCompleted ? 'bg-emerald-200 text-emerald-900' : isAnalyzing ? 'bg-blue-200 text-blue-900 animate-pulse' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isCompleted ? 'ANALYSIS COMPLETED' : isAnalyzing ? 'IN ANALYSIS' : 'QUEUED'}
                      </span>
                    </div>

                    <p className="text-slate-600">
                      {isCompleted ? (
                        <span>Diagnostic testing and clinical examination completed and verified.</span>
                      ) : isAnalyzing ? (
                        <span>Specimen is actively undergoing diagnostic testing on laboratory analyzers.</span>
                      ) : (
                        <span>Awaiting specimen collection before testing can initiate.</span>
                      )}
                    </p>

                    {isCompleted && labTechStaff && (
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold pt-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Analyzed & Signed by Lab Technologist: <strong>{labTechStaff}</strong></span>
                        {currentTest.completedDate && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ({currentTest.completedDate})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 5: Diagnostic Findings Release & Archival */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isCompleted && Boolean(currentTest.result || currentTest.pdfUrl)
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isCompleted && Boolean(currentTest.result || currentTest.pdfUrl) ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {isCompleted && Boolean(currentTest.result || currentTest.pdfUrl) ? <Check className="w-4 h-4 stroke-[3]" /> : '5'}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        5. Verified Report Release
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        isCompleted && Boolean(currentTest.result || currentTest.pdfUrl) ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isCompleted && Boolean(currentTest.result || currentTest.pdfUrl) ? 'RELEASED' : 'PENDING'}
                      </span>
                    </div>

                    <p className="text-slate-600">
                      {isCompleted ? (
                        <span>Final report authorized by Medical Director. Physical copy available at reception desk and virtual copy accessible below.</span>
                      ) : (
                        <span>Report will be released immediately after the lab technologist validates all parameters.</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* DIAGNOSTIC FINDINGS SECTION */}
          {isCompleted && currentTest.result ? (
            <div className="p-6 bg-teal-50/60 rounded-2xl border border-teal-200/90 space-y-4">
              <div className="flex items-center justify-between border-b border-teal-200/70 pb-3">
                <div className="flex items-center gap-2 text-teal-950 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  Verified Clinical Diagnostic Findings
                </div>
                
                {hasPdf && (
                  <a
                    href={pdfLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-800 hover:underline flex items-center gap-1 font-bold bg-white px-3 py-1.5 rounded-xl border border-teal-300 shadow-2xs"
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    Open PDF Report Document
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border border-teal-100 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Diagnostic Analysis Results:</span>
                <p className="text-sm font-semibold text-slate-900 leading-relaxed font-mono whitespace-pre-wrap">
                  {currentTest.result}
                </p>
              </div>

              {currentTest.notes && (
                <div className="p-3 bg-white/80 rounded-xl border border-teal-100 text-xs text-slate-700">
                  <strong className="text-teal-900">Technologist Clinical Remarks:</strong> {currentTest.notes}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 pt-2 border-t border-teal-200/60 gap-2">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Authorized by: <strong>{labTechStaff || 'Lab Technologist & Medical Director'}</strong></span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">Security Signature: NL-SIG-{(currentTest.id || '99201').toUpperCase()}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Diagnostic Findings Pending</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {isPaid 
                  ? 'Your payment is cleared. Once the laboratory technologist completes the test analysis, verified clinical values and technologist remarks will be displayed here immediately.'
                  : 'Diagnostic analysis has not begun because payment clearance is required. Please visit the Cashier desk to settle the invoice.'}
              </p>
            </div>
          )}

          {/* Footer Signature */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Official Diagnostics from <strong>{lab?.name || 'nanoLabs Medical Diagnostics'}</strong></span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">Accredited Clinical Laboratory System</span>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ResultViewScreen;
