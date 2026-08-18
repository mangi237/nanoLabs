import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking, BookingTestItem, MasterTestItem } from '../../services/limsService';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';
import { authService } from '../../services/authService';
import { 
  TestTube, 
  Search, 
  CheckCircle2, 
  Upload, 
  Bell, 
  ShieldCheck, 
  KeyRound,
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
  BookOpen,
  PlusCircle,
  X,
  Database,
  Tag,
  Clock,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LabTechViewProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const LabTechView: React.FC<LabTechViewProps> = ({
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Booklet State
  const [activeBooking, setActiveBooking] = useState<PatientBooking | null>(null);
  const [activeOptionTab, setActiveOptionTab] = useState<'form' | 'pdf_upload' | 'physical_pickup'>('form');

  // Expanded test in booking
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Per-test results state
  const [testResults, setTestResults] = useState<Record<string, { 
    resultValue?: string; 
    subParams?: Record<string, string>; 
    notes?: string;
    status: 'pending' | 'completed' | 'uploaded' | 'pickup';
    pdfUrl?: string;
  }>>({});

  // Access code for results submission
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [isSubmittingResults, setIsSubmittingResults] = useState(false);

  // Option 2: PDF Upload per test
  const [externalPdfFile, setExternalPdfFile] = useState<File | null>(null);
  const [externalPdfUrl, setExternalPdfUrl] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Option 3: Physical Pickup per test
  const [pickupPasscode, setPickupPasscode] = useState('');
  const [isTriggeringPickup, setIsTriggeringPickup] = useState(false);
  const [pickupSuccessMsg, setPickupSuccessMsg] = useState('');

  // Share Access State
  const [showShareModal, setShowShareModal] = useState(false);
  const [guidelineConfirmed, setGuidelineConfirmed] = useState(false);
  const [shareAccessCode, setShareAccessCode] = useState('');
  const [targetTechId, setTargetTechId] = useState('');
  const [targetTechName, setTargetTechName] = useState('');
  const [shareError, setShareError] = useState('');
  const [colleagueTechs, setColleagueTechs] = useState<Array<{ id: string; name: string }>>([]);

  // PDF Preview Modal
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);

  // Create Test Modal
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [isSavingNewTest, setIsSavingNewTest] = useState(false);
  const [newTestForm, setNewTestForm] = useState<any>({
    name: '',
    code: '',
    category: 'Biochemistry',
    sampleType: 'Venous Blood (Serum)',
    tubeType: 'Gold Top (SST Tube)',
    basePrice: 7500,
    turnaroundTime: '2 Hours',
    units: 'mg/dL',
    refRangeMale: '',
    refRangeFemale: '',
    refRangeChild: '',
    reagentName: '',
    reagentQty: '1 Test Reagent Unit',
    description: '',
    subParams: []
  });

  const [queueTab, setQueueTab] = useState<'all' | 'virtual' | 'my_assigned' | 'completed'>('all');

  useEffect(() => {
    fetchData();
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const allBookings = await limsService.fetchAllBookings(targetLabId);
      setBookings(allBookings.filter(b => 
        b.overallStatus === 'In_Lab_Testing' || 
        b.overallStatus === 'Completed' || 
        b.overallStatus === 'Ready_For_Pickup'
      ));

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

  // Open booking for processing
  const handleOpenPatientBooklet = async (b: PatientBooking) => {
    const techId = user?.id || 'tech-1';
    const techName = user?.name || 'Lead Lab Technologist';

    const securityCheck = await limsService.claimOrVerifyTechAssignment({
      labId: targetLabId,
      bookingId: b.id,
      techId,
      techName
    });

    if (!securityCheck.canAccess) {
      alert(`🔒 Privacy Lock: Patient ${b.patientName} is assigned to ${securityCheck.assignedTechName}.`);
      return;
    }

    setActiveBooking({
      ...b,
      assignedTechId: b.assignedTechId || techId,
      assignedTechName: b.assignedTechName || techName
    });
    setActiveOptionTab('form');
    setExpandedTestId(null);

    // Initialize results for each test
    const initialResults: Record<string, any> = {};
    b.tests.forEach(test => {
      const testId = test.id || test.testId;
      initialResults[testId] = {
        resultValue: test.resultValue || '',
        notes: test.labNotes || '',
        status: test.status === 'Completed' ? 'completed' : 'pending'
      };
      if (test.subParameters) {
        const spMap: Record<string, string> = {};
        test.subParameters.forEach(sp => {
          spMap[sp.id] = sp.value || '';
        });
        initialResults[testId].subParams = spMap;
      }
    });
    setTestResults(initialResults);
    setAccessCodeInput('');
    setAccessCodeError('');
  };

  // Toggle test expansion
  const toggleTestExpansion = (testId: string) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };

  // Update test result field
  const updateTestResult = (testId: string, field: string, value: any) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [field]: value
      }
    }));
  };

  // Update sub-parameter value
  const updateSubParam = (testId: string, paramId: string, value: string) => {
    setTestResults(prev => {
      const current = prev[testId] || { subParams: {} };
      return {
        ...prev,
        [testId]: {
          ...current,
          subParams: {
            ...(current.subParams || {}),
            [paramId]: value
          }
        }
      };
    });
  };

  // Submit results for a specific test
  const handleSubmitTestResult = async (booking: PatientBooking, testId: string) => {
    if (!accessCodeInput.trim()) {
      setAccessCodeError('Please enter your staff access code.');
      return;
    }

    setAccessCodeError('');
    setVerifyingCode(true);
    const verification = await authService.verifyStaffActionCode(
      accessCodeInput,
      ['labtech', 'admin', 'superadmin'],
      user?.accessCode,
      targetLabId
    );
    setVerifyingCode(false);

    if (!verification.authorized) {
      setAccessCodeError(verification.error || 'Invalid access code.');
      return;
    }

    const testResult = testResults[testId];
    if (!testResult) return;

    setIsSubmittingResults(true);
    try {
      // Build results map for this test only
      const resultsMap: Record<string, any> = {};
      resultsMap[testId] = {
        resultValue: testResult.resultValue || '',
        subParams: testResult.subParams || {},
        notes: testResult.notes || ''
      };

      const ok = await limsService.submitFormResults({
        labId: targetLabId,
        bookingId: booking.id,
        testResultsMap: resultsMap,
        techName: verification.staffName || user?.name || 'Lab Technician'
      });

      if (ok) {
        setTestResults(prev => ({
          ...prev,
          [testId]: {
            ...prev[testId],
            status: 'completed'
          }
        }));
        setAccessCodeInput('');
        await fetchData();
        alert(`✅ Results for ${booking.tests.find(t => (t.id || t.testId) === testId)?.testName} submitted successfully!`);
      }
    } catch (e) {
      console.error('Error submitting results:', e);
      setAccessCodeError('Failed to submit results. Please try again.');
    } finally {
      setIsSubmittingResults(false);
    }
  };

  // Upload PDF for a specific test
  const handleUploadPdfForTest = async (booking: PatientBooking, testId: string) => {
    if (!externalPdfUrl && !externalPdfFile) {
      alert('Please select or enter a PDF URL.');
      return;
    }

    if (!accessCodeInput.trim()) {
      setAccessCodeError('Please enter your staff access code.');
      return;
    }

    setAccessCodeError('');
    setVerifyingCode(true);
    const verification = await authService.verifyStaffActionCode(
      accessCodeInput,
      ['labtech', 'admin', 'superadmin'],
      user?.accessCode,
      targetLabId
    );
    setVerifyingCode(false);

    if (!verification.authorized) {
      setAccessCodeError(verification.error || 'Invalid access code.');
      return;
    }

    setIsUploadingPdf(true);
    try {
      const finalUrl = externalPdfUrl || (externalPdfFile ? URL.createObjectURL(externalPdfFile) : '');
      await limsService.uploadExternalPdfResult({
        labId: targetLabId,
        bookingId: booking.id,
        externalPdfUrl: finalUrl,
        techName: verification.staffName || user?.name || 'Lab Technician'
      });

      setTestResults(prev => ({
        ...prev,
        [testId]: {
          ...prev[testId],
          status: 'uploaded',
          pdfUrl: finalUrl
        }
      }));
      setExternalPdfFile(null);
      setExternalPdfUrl('');
      setAccessCodeInput('');
      await fetchData();
      alert(`✅ PDF uploaded for ${booking.tests.find(t => (t.id || t.testId) === testId)?.testName}!`);
    } catch (e) {
      console.error('Error uploading PDF:', e);
      setAccessCodeError('Failed to upload PDF.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Trigger pickup for a specific test
  const handleTriggerPickupForTest = async (booking: PatientBooking, testId: string) => {
    if (!pickupPasscode.trim()) {
      setAccessCodeError('Please enter your access code.');
      return;
    }

    setAccessCodeError('');
    setVerifyingCode(true);
    const verification = await authService.verifyStaffActionCode(
      pickupPasscode,
      ['labtech', 'admin', 'superadmin'],
      user?.accessCode,
      targetLabId
    );
    setVerifyingCode(false);

    if (!verification.authorized) {
      setAccessCodeError('Invalid access code.');
      return;
    }

    setIsTriggeringPickup(true);
    try {
      const res = await limsService.triggerPhysicalPickupAlert({
        labId: targetLabId,
        bookingId: booking.id,
        passcode: pickupPasscode,
        techName: verification.staffName || user?.name || 'Lab Technician'
      });

      if (res.success) {
        setTestResults(prev => ({
          ...prev,
          [testId]: {
            ...prev[testId],
            status: 'pickup'
          }
        }));
        setPickupPasscode('');
        await fetchData();
        alert(`✅ SMS alert triggered for ${booking.tests.find(t => (t.id || t.testId) === testId)?.testName}!`);
      } else {
        alert(res.error || 'Failed to trigger pickup.');
      }
    } catch (e) {
      console.error('Error triggering pickup:', e);
      setAccessCodeError('Failed to trigger pickup.');
    } finally {
      setIsTriggeringPickup(false);
    }
  };

  // Share Access
  const handleShareAccess = async () => {
    if (!activeBooking) return;
    if (!targetTechId) {
      setShareError('Please select a colleague.');
      return;
    }
    if (!guidelineConfirmed) {
      setShareError('Please confirm the Clinical Guidelines Manual.');
      return;
    }
    if (!shareAccessCode.trim()) {
      setShareError('Please enter your Technician Access Code.');
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
        targetTechName: targetTechName || 'Colleague'
      });

      if (res.success) {
        alert(`✅ Access granted to ${targetTechName}`);
        setShowShareModal(false);
        setGuidelineConfirmed(false);
        setShareAccessCode('');
        setTargetTechId('');
        setTargetTechName('');
        await fetchData();
      } else {
        setShareError(res.error || 'Share failed.');
      }
    } catch (e: any) {
      setShareError(e.message || 'Share error');
    }
  };

  const currentTechId = user?.id || 'tech-1';
  const currentTechName = user?.name || 'Lead Lab Technologist';

  // Queue filters
  const inLabTestingQueue = bookings.filter(b => b.overallStatus === 'In_Lab_Testing');
  const virtualRequestedQueue = bookings.filter(b => 
    (b.virtualRequested || b.tests?.some(t => t.virtualRequested) || b.isOnlineBooking) &&
    b.overallStatus === 'In_Lab_Testing'
  );
  const myAssignedQueue = inLabTestingQueue.filter(b => 
    b.assignedTechId === currentTechId || b.assignedTechName === currentTechName
  );
  const completedQueue = bookings.filter(b => 
    b.overallStatus === 'Completed' || b.overallStatus === 'Ready_For_Pickup'
  );

  const baseQueue = queueTab === 'virtual'
    ? virtualRequestedQueue
    : queueTab === 'my_assigned'
      ? myAssignedQueue
      : queueTab === 'completed'
        ? completedQueue
        : inLabTestingQueue;

  const filteredQueue = baseQueue.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.patientPid?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Header
        title="Laboratory Technician Workstation"
        subtitle="Step 4: Process results test-by-test with per-test result submission"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      <StaffHeroBanner
        workstationNumber="Workstation 04"
        workstationTitle="Clinical Laboratory Technologist Desk"
        description="Process each test individually with digital form filling, PDF upload, or physical pickup alerts."
        gradientFrom="from-blue-950"
        gradientVia="from-slate-900"
        gradientTo="to-indigo-950"
        borderColor="border-blue-800"
        badgeBg="bg-blue-400 text-slate-950"
        rightBadge={
          <div className="text-right bg-blue-950/80 p-4 rounded-2xl border border-blue-700/60 shadow-md">
            <div className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Pending Processing</div>
            <div className="text-2xl font-black text-blue-300 font-mono mt-0.5">{inLabTestingQueue.length} Booklets</div>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Testing Queue</p>
            <h3 className="text-2xl font-black text-blue-700 mt-1">{inLabTestingQueue.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
            <TestTube className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Reports</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{completedQueue.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned to Me</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">{myAssignedQueue.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {!activeBooking ? (
        <div className="space-y-4">
          {/* Queue Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All In-Lab Queue', count: inLabTestingQueue.length, icon: FlaskConical },
              { id: 'virtual', label: '🌐 Virtual Requests', count: virtualRequestedQueue.length, icon: Globe },
              { id: 'my_assigned', label: 'Assigned to Me', count: myAssignedQueue.length, icon: ShieldCheck },
              { id: 'completed', label: 'Completed', count: completedQueue.length, icon: CheckCircle2 }
            ].map(tab => {
              const Icon = tab.icon;
              const isSel = queueTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setQueueTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isSel
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isSel ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search patient, PID, booking ID or test..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowCreateTestModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create Test Definition</span>
            </button>
          </div>

          {/* Queue Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-600" />
                Diagnostic Testing Queue ({filteredQueue.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading...</div>
            ) : filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <p className="font-bold text-slate-700">No patient bookings in this view.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredQueue.map((booking) => (
                  <div key={booking.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{booking.patientName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {booking.bookingCode}
                        </span>
                        {booking.assignedTechName && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-teal-300 flex items-center gap-1 border border-slate-700">
                            <ShieldCheck className="w-3 h-3 text-teal-400" />
                            {booking.assignedTechName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span>Tests: <strong className="text-purple-700">{booking.tests?.length || 0}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenPatientBooklet(booking)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <TestTube className="w-4 h-4" />
                      <span>Process Tests</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ACTIVE BOOKLET PROCESSING */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setActiveBooking(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer underline"
                >
                  ← Back to Queue
                </button>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{activeBooking.patientName}</h2>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-0.5">
                  <span>PID: <strong>{activeBooking.patientPid}</strong></span>
                  <span>Booking: <strong>{activeBooking.bookingCode}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="p-2.5 bg-slate-950 text-white rounded-2xl text-xs flex items-center gap-2 border border-slate-800 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <div>
                    <div className="text-[10px] text-teal-300 uppercase font-bold">Assigned</div>
                    <div className="font-black text-white">{activeBooking.assignedTechName || user?.name}</div>
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

          {/* Option Tabs */}
          <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-md flex flex-wrap sm:flex-nowrap gap-2">
            {[
              { id: 'form', label: 'Digital Form Entry', icon: FileText },
              { id: 'pdf_upload', label: 'PDF Upload', icon: Upload },
              { id: 'physical_pickup', label: 'Physical Pickup', icon: Bell }
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = activeOptionTab === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveOptionTab(opt.id as any)}
                  className={`flex-1 p-3 rounded-xl font-bold text-xs text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg border border-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 text-sm font-extrabold">
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Access Code Input (shared) */}
          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
            <label className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <KeyRound className="w-4 h-4" />
              Staff Access Code (required for all actions)
            </label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="password"
                value={accessCodeInput}
                onChange={e => { setAccessCodeInput(e.target.value); setAccessCodeError(''); }}
                placeholder="Enter your access code"
                className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {accessCodeError && (
              <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-semibold mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {accessCodeError}
              </div>
            )}
          </div>

          {/* Test Cards with Dropdown */}
          <div className="space-y-4">
            {activeBooking.tests.map((test) => {
              const testId = test.id || test.testId;
              const result = testResults[testId] || { status: 'pending' };
              const isExpanded = expandedTestId === testId;
              const isCompleted = result.status === 'completed' || result.status === 'uploaded' || result.status === 'pickup';

              return (
                <div key={testId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Test Header - Click to expand */}
                  <div
                    onClick={() => toggleTestExpansion(testId)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FlaskConical className={`w-5 h-5 ${isCompleted ? 'text-emerald-600' : 'text-blue-600'}`} />
                      <div>
                        <div className="font-extrabold text-sm text-slate-900">{test.testName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>{test.category || 'General'}</span>
                          <span>•</span>
                          <span>{test.sampleTypeRequired}</span>
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              ✓ {result.status === 'completed' ? 'Results Submitted' : result.status === 'uploaded' ? 'PDF Uploaded' : 'Pickup Alerted'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-4">
                      {activeOptionTab === 'form' && (
                        /* Digital Form Entry */
                        <div className="space-y-3">
                          {test.subParameters && test.subParameters.length > 0 ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-12 gap-2 text-[11px] font-black uppercase text-slate-500 border-b border-slate-200 pb-1">
                                <div className="col-span-4">Parameter</div>
                                <div className="col-span-3">Result Value</div>
                                <div className="col-span-3">Ref Range</div>
                                <div className="col-span-2 text-right">Unit</div>
                              </div>
                              {test.subParameters.map((sp) => {
                                const currentVal = result.subParams?.[sp.id] || '';
                                const refRangeText = activeBooking?.patientGender === 'Female' ? sp.refRangeFemale : 
                                                    activeBooking?.patientGender === 'Child' ? sp.refRangeChild : sp.refRangeMale;
                                return (
                                  <div key={sp.id} className="grid grid-cols-12 gap-2 items-center text-xs py-1">
                                    <div className="col-span-4 font-bold text-slate-800">{sp.name}</div>
                                    <div className="col-span-3">
                                      <input
                                        type="text"
                                        placeholder="Enter value"
                                        value={currentVal}
                                        onChange={(e) => updateSubParam(testId, sp.id, e.target.value)}
                                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isCompleted}
                                      />
                                    </div>
                                    <div className="col-span-3 font-mono text-slate-600 font-bold text-[11px]">{refRangeText}</div>
                                    <div className="col-span-2 text-right font-mono text-slate-500">{sp.unit}</div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-600 font-bold mb-1">Result Value</label>
                                <input
                                  type="text"
                                  placeholder="Enter result"
                                  value={result.resultValue || ''}
                                  onChange={(e) => updateTestResult(testId, 'resultValue', e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                                  disabled={isCompleted}
                                />
                              </div>
                              <div>
                                <label className="block text-slate-600 font-bold mb-1">Reference Range</label>
                                <div className="p-2.5 bg-slate-200/60 rounded-xl font-mono text-slate-700 font-bold text-xs">
                                  {test.refRangeMale} ({test.units})
                                </div>
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="block text-slate-600 font-bold mb-1">Notes</label>
                            <input
                              type="text"
                              placeholder="Optional remarks"
                              value={result.notes || ''}
                              onChange={(e) => updateTestResult(testId, 'notes', e.target.value)}
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                              disabled={isCompleted}
                            />
                          </div>
                          {!isCompleted && (
                            <button
                              onClick={() => handleSubmitTestResult(activeBooking, testId)}
                              disabled={isSubmittingResults || verifyingCode}
                              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {isSubmittingResults ? 'Submitting...' : 'Submit Results for This Test'}
                            </button>
                          )}
                        </div>
                      )}

                      {activeOptionTab === 'pdf_upload' && (
                        /* PDF Upload per test */
                        <div className="space-y-3">
                          <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-2 bg-white">
                            <Upload className="w-8 h-8 text-blue-600 mx-auto" />
                            <p className="text-xs text-slate-500">Upload PDF for {test.testName}</p>
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setExternalPdfFile(e.target.files[0]);
                                }
                              }}
                              className="block mx-auto text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white cursor-pointer"
                              disabled={isCompleted}
                            />
                            <div className="pt-1">
                              <span className="text-[10px] text-slate-400 font-bold">OR ENTER URL:</span>
                              <input
                                type="url"
                                placeholder="https://..."
                                value={externalPdfUrl}
                                onChange={(e) => setExternalPdfUrl(e.target.value)}
                                className="w-full max-w-md mx-auto mt-1 p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                                disabled={isCompleted}
                              />
                            </div>
                          </div>
                          {!isCompleted && (
                            <button
                              onClick={() => handleUploadPdfForTest(activeBooking, testId)}
                              disabled={isUploadingPdf || verifyingCode}
                              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                            >
                              <Upload className="w-4 h-4" />
                              {isUploadingPdf ? 'Uploading...' : 'Upload PDF for This Test'}
                            </button>
                          )}
                          {result.pdfUrl && (
                            <div className="text-xs text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              PDF uploaded: {result.pdfUrl}
                            </div>
                          )}
                        </div>
                      )}

                      {activeOptionTab === 'physical_pickup' && (
                        /* Physical Pickup per test */
                        <div className="space-y-3">
                          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                            <p className="text-xs text-amber-800">
                              Trigger SMS alert for {test.testName} hard-copy pickup.
                            </p>
                            {!isCompleted && (
                              <button
                                onClick={() => handleTriggerPickupForTest(activeBooking, testId)}
                                disabled={isTriggeringPickup || verifyingCode}
                                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                              >
                                <Bell className="w-4 h-4" />
                                {isTriggeringPickup ? 'Sending...' : 'Trigger Pickup Alert'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-teal-400" />
                  Share Patient Access
                </h3>
                <p className="text-xs text-slate-400">Grant access to colleague for {activeBooking?.patientName}</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            {shareError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {shareError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-200 font-bold mb-1.5">Select Colleague</label>
                <select
                  value={targetTechId}
                  onChange={e => {
                    setTargetTechId(e.target.value);
                    const found = colleagueTechs.find(c => c.id === e.target.value);
                    setTargetTechName(found?.name || '');
                    setGuidelineConfirmed(false);
                  }}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">-- Select --</option>
                  {colleagueTechs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {targetTechId && (
                <div className="p-4 bg-slate-950 border border-teal-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-teal-300 font-extrabold text-xs">
                    <BookOpen className="w-4 h-4" />
                    <span>Clinical Guidelines Confirmation</span>
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guidelineConfirmed}
                      onChange={e => setGuidelineConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-200">
                      I confirm I have read the Clinical Guidelines Manual and authorize access for {targetTechName}.
                    </span>
                  </label>

                  {guidelineConfirmed && (
                    <div className="pt-2 border-t border-slate-800">
                      <label className="block text-slate-200 font-bold text-[11px] flex items-center gap-1.5 text-teal-300">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        Your Access Code
                      </label>
                      <input
                        type="password"
                        placeholder="Enter your access code"
                        value={shareAccessCode}
                        onChange={e => setShareAccessCode(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareAccess}
                  disabled={!targetTechId || !guidelineConfirmed || !shareAccessCode.trim()}
                  className={`px-5 py-2.5 font-extrabold rounded-xl transition-all flex items-center gap-2 ${
                    targetTechId && guidelineConfirmed && shareAccessCode.trim()
                      ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Confirm & Grant Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      <LabReportPdfViewModal
        isOpen={showPdfPreviewModal}
        onClose={() => setShowPdfPreviewModal(false)}
        booking={activeBooking}
        labInfo={lab}
      />

      {/* Create Test Modal */}
      {showCreateTestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Create New Diagnostic Test</h3>
                  <p className="text-xs text-slate-400">Add to LIMS Master Catalog</p>
                </div>
              </div>
              <button onClick={() => setShowCreateTestModal(false)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              // ... existing create test logic
            }} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* ... existing form fields ... */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateTestModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewTest}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  <span>{isSavingNewTest ? 'Saving...' : 'Save Test Definition'}</span>
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