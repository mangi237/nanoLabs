import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking, BookingTestItem } from '../../services/limsService';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';
import { 
  TestTube, 
  Search, 
  CheckCircle2, 
  Upload, 
  Bell, 
  ShieldCheck, 
  Lock, 
  Share2, 
  FileText, 
  AlertCircle, 
  FlaskConical, 
  Check, 
  Eye, 
  Printer, 
  Key, 
  UserCheck, 
  Layers, 
  Sparkles,
  ChevronRight,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface LabTechViewProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const LabTechView: React.FC<LabTechViewProps> = ({ onNotificationPress }) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Booklet State
  const [activeBooking, setActiveBooking] = useState<PatientBooking | null>(null);
  const [activeOptionTab, setActiveOptionTab] = useState<'form' | 'pdf_upload' | 'physical_pickup'>('form');

  // Security & Privacy Lockdown
  const [showPrivacyNoticeModal, setShowPrivacyNoticeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [guidelineConfirmed, setGuidelineConfirmed] = useState(false);
  const [shareAccessCode, setShareAccessCode] = useState('');
  const [targetTechId, setTargetTechId] = useState('');
  const [targetTechName, setTargetTechName] = useState('');
  const [shareError, setShareError] = useState('');
  const [colleagueTechs, setColleagueTechs] = useState<Array<{ id: string; name: string }>>([]);

  // Option 1: Native Digital Form Filling State
  const [formResultsMap, setFormResultsMap] = useState<Record<string, { resultValue?: string; subParams?: Record<string, string>; notes?: string }>>({});
  const [isSubmittingResults, setIsSubmittingResults] = useState(false);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);

  // Option 2: PDF Upload State
  const [externalPdfFile, setExternalPdfFile] = useState<File | null>(null);
  const [externalPdfUrl, setExternalPdfUrl] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Option 3: Physical Pickup Notification State
  const [pickupPasscode, setPickupPasscode] = useState('');
  const [isTriggeringPickup, setIsTriggeringPickup] = useState(false);
  const [pickupSuccessMsg, setPickupSuccessMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const allBookings = await limsService.fetchAllBookings(targetLabId);
      // Filter for in lab testing or completed bookings
      setBookings(allBookings.filter(b => b.overallStatus === 'In_Lab_Testing' || b.overallStatus === 'Completed' || b.overallStatus === 'Ready_For_Pickup'));

      // Populate colleague techs
      setColleagueTechs([
        { id: 'tech-2', name: 'Dr. Jane Smith (Clinical Pathologist)' },
        { id: 'tech-3', name: 'Mangi Lerine Laslie (Lab Tech)' },
        { id: 'tech-4', name: 'Dr. Payal Shah (MD Pathologist)' }
      ]);
    } catch (e) {
      console.error('Error fetching lab tech queue:', e);
    } finally {
      setLoading(false);
    }
  };

  // Click on a patient booking in the queue
  const handleOpenPatientBooklet = async (b: PatientBooking) => {
    const techId = user?.id || 'tech-1';
    const techName = user?.name || 'Lead Lab Technologist';

    // Claim or verify security assignment
    const securityCheck = await limsService.claimOrVerifyTechAssignment({
      labId: targetLabId,
      bookingId: b.id,
      techId,
      techName
    });

    if (!securityCheck.canAccess) {
      alert(`🔒 Privacy Lock: Patient ${b.patientName} is assigned to ${securityCheck.assignedTechName}. You must request shared access authorization.`);
      return;
    }

    setActiveBooking(b);
    setActiveOptionTab('form');

    // Initialize form fields for sub-parameters
    const initialMap: Record<string, { resultValue?: string; subParams?: Record<string, string>; notes?: string }> = {};
    b.tests.forEach(test => {
      const spMap: Record<string, string> = {};
      if (test.subParameters) {
        test.subParameters.forEach(sp => {
          spMap[sp.id] = sp.value || '';
        });
      }
      initialMap[test.id] = {
        resultValue: test.resultValue || '',
        subParams: spMap,
        notes: test.labNotes || ''
      };
    });
    setFormResultsMap(initialMap);

    // Show privacy assignment commitment modal if just claimed
    if (securityCheck.isAssignedToCurrentUser && (!b.assignedTechId || b.assignedTechId === techId)) {
      setShowPrivacyNoticeModal(true);
    }
  };

  // Option 1 Submit Form
  const handleSubmitFormResults = async () => {
    if (!activeBooking) return;

    setIsSubmittingResults(true);
    try {
      const ok = await limsService.submitFormResults({
        labId: targetLabId,
        bookingId: activeBooking.id,
        testResultsMap: formResultsMap,
        techName: user?.name || 'Medical Lab Technician'
      });

      if (ok) {
        setShowPdfPreviewModal(true);
        await fetchData();
      }
    } catch (e) {
      console.error('Error submitting form results:', e);
    } finally {
      setIsSubmittingResults(false);
    }
  };

  // Option 2 Submit External PDF
  const handleUploadExternalPdf = async () => {
    if (!activeBooking) return;
    if (!externalPdfUrl && !externalPdfFile) {
      alert('Please select or enter an external PDF result file URL.');
      return;
    }

    setIsUploadingPdf(true);
    try {
      const finalUrl = externalPdfUrl || (externalPdfFile ? URL.createObjectURL(externalPdfFile) : 'https://example.com/external-lab-result.pdf');
      await limsService.uploadExternalPdfResult({
        labId: targetLabId,
        bookingId: activeBooking.id,
        externalPdfUrl: finalUrl,
        techName: user?.name || 'Medical Lab Technician'
      });

      alert('✅ External PDF report securely uploaded and published to Patient Portal.');
      await fetchData();
    } catch (e) {
      console.error('Error uploading external PDF:', e);
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Option 3 Trigger Physical Pickup Alert
  const handleTriggerPickupAlert = async () => {
    if (!activeBooking) return;
    if (!pickupPasscode.trim()) {
      alert('Please enter your Technician Access Passcode to authorize physical pickup alert.');
      return;
    }

    setIsTriggeringPickup(true);
    try {
      const res = await limsService.triggerPhysicalPickupAlert({
        labId: targetLabId,
        bookingId: activeBooking.id,
        passcode: pickupPasscode,
        techName: user?.name || 'Medical Lab Technician'
      });

      if (res.success) {
        setPickupSuccessMsg(`📱 SMS Alert triggered! Patient ${activeBooking.patientName} has been notified to pick up hard-copy results at the front desk.`);
        setPickupPasscode('');
        await fetchData();
      } else {
        alert(res.error || 'Passcode verification failed.');
      }
    } catch (e) {
      console.error('Error triggering pickup alert:', e);
    } finally {
      setIsTriggeringPickup(false);
    }
  };

  // Share Patient Access with Colleague
  const handleShareAccess = async () => {
    if (!activeBooking) return;
    if (!targetTechId) {
      setShareError('Please select a colleague technologist.');
      return;
    }
    if (!guidelineConfirmed) {
      setShareError('Please review and check the Clinical Guidelines Manual agreement box.');
      return;
    }
    if (!shareAccessCode.trim()) {
      setShareError('Please enter your Technician Access Code to authorize.');
      return;
    }

    try {
      const res = await limsService.sharePatientAccessWithColleague({
        labId: targetLabId,
        bookingId: activeBooking.id,
        currentTechId: user?.id || 'tech-1',
        currentTechName: user?.name || 'Lead Technologist',
        accessCodeInput: shareAccessCode,
        targetTechId,
        targetTechName: targetTechName || 'Colleague Technologist'
      });

      if (res.success) {
        alert(`✅ Patient diagnostic test results access successfully granted to ${targetTechName}. Full audit entry created in Patient Portal.`);
        setShowShareModal(false);
        setGuidelineConfirmed(false);
        setShareAccessCode('');
        setTargetTechId('');
        setTargetTechName('');
        await fetchData();
      } else {
        setShareError(res.error || 'Access sharing failed.');
      }
    } catch (e: any) {
      setShareError(e.message || 'Share error');
    }
  };

  const inLabTestingQueue = bookings.filter(b => b.overallStatus === 'In_Lab_Testing');
  const filteredQueue = inLabTestingQueue.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Header
        title="Laboratory Technician Portal (The 3-Option Module)"
        subtitle="Step 4: Assigned security locking, digital form filling with reference ranges, PDF upload & physical pickup SMS alerts"
      />

      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center shrink-0 font-bold">
            <TestTube className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">LIMS 3-Option Processing Engine</h3>
            <p className="text-xs text-slate-300">
              Option 1: Native Form Filling (Auto-Deducts Inventory) • Option 2: External PDF Upload • Option 3: Physical Pickup SMS Alert
            </p>
          </div>
        </div>

        <div className="text-right text-xs shrink-0 font-mono font-bold text-blue-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          Samples Ready for Testing: {inLabTestingQueue.length}
        </div>
      </div>

      {/* Queue View OR Active Booklet Processing View */}
      {!activeBooking ? (
        <div className="space-y-4">
          
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search patient marked as Samples Collected (Name or Booking ID...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Queue Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-600" />
                Samples Collected - Testing Queue ({filteredQueue.length})
              </h3>
              <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                LIMS In-Lab Stage
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading lab queue...</div>
            ) : filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">No samples waiting for testing.</p>
                <p className="text-slate-500">When phlebotomists complete sample collection, patient booklets appear here instantly.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredQueue.map((booking) => (
                  <div key={booking.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {booking.patientName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {booking.bookingCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                          Samples Collected
                        </span>
                        {booking.assignedTechName && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-teal-300 flex items-center gap-1 border border-slate-700">
                            <Lock className="w-3 h-3 text-teal-400" />
                            {booking.assignedTechName}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span>Age/Sex: <strong>{booking.patientAge || 28} Yrs • {booking.patientGender || 'Male'}</strong></span>
                        <span>Matrices: <strong className="text-purple-700">{booking.collectedSamples?.join(', ') || 'Specimen Drawn'}</strong></span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {booking.tests.map(t => (
                          <span key={t.id} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[10px] border border-slate-200 font-medium">
                            {t.testName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenPatientBooklet(booking)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <TestTube className="w-4 h-4" />
                      Open Patient Booklet
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ACTIVE PATIENT BOOKLET PROCESSING WORKSPACE */
        <div className="space-y-6">
          
          {/* Booklet Header Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveBooking(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer underline"
                  >
                    ← Back to Testing Queue
                  </button>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold rounded-md text-xs">
                    {activeBooking.bookingCode}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {activeBooking.patientName}
                </h2>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-0.5">
                  <span>Age: <strong>{activeBooking.patientAge || 28} Yrs</strong></span>
                  <span>Sex: <strong>{activeBooking.patientGender || 'Male'}</strong></span>
                  <span>PID: <strong>{activeBooking.patientPid}</strong></span>
                  <span>Collected Samples: <strong className="text-purple-700">{activeBooking.collectedSamples?.join(', ')}</strong></span>
                </div>
              </div>

              {/* Assigned Tech Security Badge & Share Access */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-2.5 bg-slate-950 text-white rounded-2xl text-xs flex items-center gap-2 border border-slate-800 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <div>
                    <div className="text-[10px] text-teal-300 uppercase font-bold">Assigned Technologist</div>
                    <div className="font-black text-white">{activeBooking.assignedTechName || user?.name || 'Lead Technologist'}</div>
                  </div>
                </div>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-3.5 py-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Share Access
                </button>
              </div>
            </div>
          </div>

          {/* THE 3 DISTINCT PROCESSING OPTIONS TABS */}
          <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-md flex flex-wrap sm:flex-nowrap gap-2">
            {[
              { id: 'form', label: 'Option 1: Native Digital Form Filling (Default)', icon: FileText, desc: 'Auto-Deducts Reagent Inventory & Renders Official PDF Report' },
              { id: 'pdf_upload', label: 'Option 2: External PDF Upload', icon: Upload, desc: 'Fallback for Closed Analyzers or Scanned Sheets' },
              { id: 'physical_pickup', label: 'Option 3: Physical Pickup Notification', icon: Bell, desc: 'SMS Alert for Hard-Copy Collection' }
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = activeOptionTab === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveOptionTab(opt.id as any)}
                  className={`flex-1 p-3 rounded-xl font-bold text-xs text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg border border-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-extrabold">
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5 font-normal">{opt.desc}</div>
                </button>
              );
            })}
          </div>

          {/* OPTION 1: NATIVE DIGITAL FORM FILLING VIEW */}
          {activeOptionTab === 'form' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Option 1: Structured Clinical Form Entry
                </h3>
                <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  Ref Ranges Auto-Displayed
                </span>
              </div>

              {/* Tests Inputs Loop */}
              <div className="space-y-6">
                {activeBooking.tests.map((testItem) => {
                  const testRes = formResultsMap[testItem.id] || {};

                  return (
                    <div key={testItem.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-blue-600" />
                          {testItem.testName}
                        </h4>
                        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {testItem.sampleTypeRequired}
                        </span>
                      </div>

                      {/* If test has sub-parameters (like CBC, LFT, Lipid) */}
                      {testItem.subParameters && testItem.subParameters.length > 0 ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 text-[11px] font-black uppercase text-slate-500 border-b border-slate-200 pb-1">
                            <div className="col-span-4">Investigation</div>
                            <div className="col-span-3">Result Value</div>
                            <div className="col-span-3">Normal Ref Range ({activeBooking.patientGender || 'Male'})</div>
                            <div className="col-span-2 text-right">Unit</div>
                          </div>

                          {testItem.subParameters.map((sp) => {
                            const currentVal = testRes.subParams?.[sp.id] || '';
                            const refRangeText = activeBooking.patientGender === 'Female' ? sp.refRangeFemale : activeBooking.patientGender === 'Child' ? sp.refRangeChild : sp.refRangeMale;

                            return (
                              <div key={sp.id} className="grid grid-cols-12 gap-2 items-center text-xs py-1">
                                <div className="col-span-4 font-bold text-slate-800">{sp.name}</div>
                                <div className="col-span-3">
                                  <input
                                    type="text"
                                    placeholder="Enter value..."
                                    value={currentVal}
                                    onChange={e => {
                                      const newVal = e.target.value;
                                      setFormResultsMap({
                                        ...formResultsMap,
                                        [testItem.id]: {
                                          ...testRes,
                                          subParams: {
                                            ...(testRes.subParams || {}),
                                            [sp.id]: newVal
                                          }
                                        }
                                      });
                                    }}
                                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="col-span-3 font-mono text-slate-600 font-bold text-[11px]">
                                  {refRangeText}
                                </div>
                                <div className="col-span-2 text-right font-mono text-slate-500">
                                  {sp.unit}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Single Result Input */
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          <div>
                            <label className="block text-slate-600 font-bold mb-1">Result Value / Finding</label>
                            <input
                              type="text"
                              placeholder="e.g. Negative / Normal"
                              value={testRes.resultValue || ''}
                              onChange={e => setFormResultsMap({
                                ...formResultsMap,
                                [testItem.id]: { ...testRes, resultValue: e.target.value }
                              })}
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-bold mb-1">Reference Range</label>
                            <div className="p-2.5 bg-slate-200/60 rounded-xl font-mono text-slate-700 font-bold text-xs">
                              {testItem.refRangeMale} ({testItem.units})
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-600 font-bold mb-1">Technologist Notes</label>
                            <input
                              type="text"
                              placeholder="Optional remarks..."
                              value={testRes.notes || ''}
                              onChange={e => setFormResultsMap({
                                ...formResultsMap,
                                [testItem.id]: { ...testRes, notes: e.target.value }
                              })}
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Results Button */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Submitting automatically deducts chemical reagents from central inventory & publishes official report.
                </div>

                <button
                  type="button"
                  disabled={isSubmittingResults}
                  onClick={handleSubmitFormResults}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isSubmittingResults ? 'Processing Results...' : 'Submit Results & Generate Official PDF Report'}
                </button>
              </div>

            </div>
          )}

          {/* OPTION 2: EXTERNAL PDF UPLOAD VIEW */}
          {activeOptionTab === 'pdf_upload' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Option 2: External PDF / Image Report Upload
                </h3>
                <span className="text-xs text-slate-500">Secondary Fallback Method</span>
              </div>

              <div className="p-8 border-2 border-dashed border-slate-300 rounded-3xl text-center space-y-3 bg-slate-50 hover:bg-slate-100/80 transition-colors">
                <Upload className="w-10 h-10 text-blue-600 mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-800">Select External Diagnostic Report (.pdf or image)</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  For tests produced by automated equipment with closed output or manual scanned charts.
                </p>

                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setExternalPdfFile(e.target.files[0]);
                    }
                  }}
                  className="block mx-auto text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white cursor-pointer"
                />

                <div className="pt-2">
                  <span className="text-xs text-slate-400 font-bold">OR ENTER SECURE RESULT FILE URL:</span>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={externalPdfUrl}
                    onChange={e => setExternalPdfUrl(e.target.value)}
                    className="w-full max-w-md mx-auto mt-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleUploadExternalPdf}
                  disabled={isUploadingPdf}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingPdf ? 'Attaching Report...' : 'Publish External PDF to Patient Portal'}
                </button>
              </div>
            </div>
          )}

          {/* OPTION 3: PHYSICAL PICKUP NOTIFICATION VIEW */}
          {activeOptionTab === 'physical_pickup' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-600" />
                  Option 3: Trigger Physical Hard-Copy Pickup Notification
                </h3>
                <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Passcode Protected
                </span>
              </div>

              {pickupSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  {pickupSuccessMsg}
                </div>
              )}

              <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-amber-900">Use Case: Non-Digitized / Hard-Copy Physical Pickup</h4>
                <p className="text-xs text-amber-800">
                  When a test cannot be digitized into PDF, trigger an automated SMS text message notifying the patient to return to the facility front desk for hard-copy pickup.
                </p>

                <div className="pt-2 max-w-sm space-y-2">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Technician Access Passcode *
                  </label>
                  <input
                    type="password"
                    placeholder="Enter technician passcode (e.g. 1234)"
                    value={pickupPasscode}
                    onChange={e => setPickupPasscode(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleTriggerPickupAlert}
                  disabled={isTriggeringPickup}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {isTriggeringPickup ? 'Triggering SMS...' : 'Trigger Physical Pickup Alert'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* PRIVACY ASSIGNMENT COMMITMENT MODAL */}
      {showPrivacyNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center mx-auto font-bold">
              <Lock className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Assigned Security & Privacy Lockdown</h3>
            <p className="text-xs text-teal-200/80 leading-relaxed">
              You are now the primary assigned Medical Technologist for <strong>{activeBooking?.patientName}</strong> ({activeBooking?.bookingCode}). Diagnostic data is privacy-locked to your account.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-left">
              🔒 Other technicians cannot view these findings unless you explicitly grant shared access after confirming clinical guidelines.
            </div>
            <button
              onClick={() => setShowPrivacyNoticeModal(false)}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
            >
              Understand & Proceed
            </button>
          </div>
        </div>
      )}

      {/* SHARE ACCESS MODAL WITH GUIDELINE MANUAL CONFIRMATION */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-teal-400" />
                  Share Patient Diagnostic Access
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Grant colleague access to <strong>{activeBooking?.patientName}</strong> ({activeBooking?.bookingCode})
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowShareModal(false);
                  setGuidelineConfirmed(false);
                  setTargetTechId('');
                  setTargetTechName('');
                  setShareError('');
                }} 
                className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {shareError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{shareError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Step 1: Select Colleague */}
              <div>
                <label className="block text-slate-200 font-bold mb-1.5 flex items-center justify-between">
                  <span>1. Select Colleague Medical Technologist</span>
                  <span className="text-[10px] text-teal-400 font-semibold">Hospital Directory</span>
                </label>
                <select
                  value={targetTechId}
                  onChange={e => {
                    setTargetTechId(e.target.value);
                    const found = colleagueTechs.find(c => c.id === e.target.value);
                    if (found) {
                      setTargetTechName(found.name);
                    } else {
                      setTargetTechName('');
                    }
                    setGuidelineConfirmed(false);
                    setShareError('');
                  }}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">-- Choose Colleague Technologist --</option>
                  {colleagueTechs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Confirmation / Guideline Manual */}
              {targetTechId && (
                <div className="p-4 bg-slate-950 border border-teal-500/30 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-teal-300 font-extrabold text-xs">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    <span>Clinical Access & Privacy Guideline Manual</span>
                  </div>

                  <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Selective Authorization:</strong> Granting diagnostic access allows colleague technologist <strong>{targetTechName}</strong> to view and manage all test results for patient <strong>{activeBooking?.patientName}</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span><strong>Clinical Scope:</strong> Sharing must adhere to valid clinical consultation, secondary review, or shift handover guidelines.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Immutable Audit Entry:</strong> Every access delegation event is cryptographically audited and permanently recorded in the Patient Portal access logs.</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={guidelineConfirmed}
                        onChange={e => {
                          setGuidelineConfirmed(e.target.checked);
                          if (e.target.checked) setShareError('');
                        }}
                        className="mt-0.5 w-4 h-4 rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-200 group-hover:text-white transition-colors">
                        I confirm I have read the <strong>Clinical Guidelines Manual</strong> and authorize granting shared diagnostic access for this patient to <strong>{targetTechName}</strong>.
                      </span>
                    </label>
                  </div>

                  {guidelineConfirmed && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5 animate-in fade-in duration-200">
                      <label className="block text-slate-200 font-bold text-[11px] flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-teal-300">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          Your Technician Access Code *
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Passcode Confirmation</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Enter your access code to authorize"
                        value={shareAccessCode}
                        onChange={e => {
                          setShareAccessCode(e.target.value);
                          if (e.target.value.trim()) setShareError('');
                        }}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {!targetTechId && (
                <div className="p-3 bg-slate-950 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Select a colleague above to open the Clinical Access & Guideline Manual.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    setGuidelineConfirmed(false);
                    setShareAccessCode('');
                    setTargetTechId('');
                    setTargetTechName('');
                    setShareError('');
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleShareAccess}
                  disabled={!targetTechId || !guidelineConfirmed || !shareAccessCode.trim()}
                  className={`px-5 py-2.5 font-extrabold rounded-xl transition-all flex items-center gap-2 ${
                    targetTechId && guidelineConfirmed && shareAccessCode.trim()
                      ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Grant Access</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* OFFICIAL PDF REPORT VIEWER / PRINT MODAL */}
      <LabReportPdfViewModal
        isOpen={showPdfPreviewModal}
        onClose={() => setShowPdfPreviewModal(false)}
        booking={activeBooking}
        labInfo={lab}
      />

    </div>
  );
};
