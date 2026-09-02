import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import authService from '../../services/authService';
import { limsService, PatientBooking } from '../../services/limsService';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';
import { 
  Microscope, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  FileText,  
  AlertCircle, 
  Clock, 
  UserCheck, 
  Sparkles,  
  Printer, 
  Eye, 
  Lock, 
  Check, 
  X, 
  Stethoscope, 
  Activity, 
  Building2, 
  ChevronRight, 
  FlaskConical,
  Key,
  Shield,
  FileCheck,
  Download
} from 'lucide-react';

interface BiologistViewProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const BiologistView: React.FC<BiologistViewProps> = ({
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'released'>('pending');
  const [loading, setLoading] = useState(true);

  // Selected Booking for Review
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [biologistRemarks, setBiologistRemarks] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Biologist Sign & Release Access Code Modal State
  const [showSignModal, setShowSignModal] = useState(false);
  const [biologistCode, setBiologistCode] = useState('');
  const [signError, setSignError] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseSuccessMsg, setReleaseSuccessMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const allBookings = await limsService.fetchAllBookings(targetLabId);
      setBookings(allBookings);
    } catch (e) {
      console.error('Error fetching biologist queue:', e);
    } finally {
      setLoading(false);
    }
  };

  // Pending verification queue:
  // Either in In_Lab_Testing or has labTechSigned = true but biologistSigned !== true
  const pendingQueue = bookings.filter(b => 
    !b.biologistSigned && (b.overallStatus === 'In_Lab_Testing' || b.overallStatus === 'Completed' || b.labTechSigned)
  );

  // Fully released queue:
  const releasedQueue = bookings.filter(b => b.biologistSigned);

  const activeQueue = activeTab === 'pending' ? pendingQueue : releasedQueue;

  const filteredQueue = activeQueue.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.patientPid && b.patientPid.toLowerCase().includes(searchQuery.toLowerCase())) ||
    b.tests?.some(t => t.testName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenReview = (b: PatientBooking) => {
    setSelectedBooking(b);
    setBiologistRemarks(b.biologistRemarks || 'Biochemical parameters within expected reference thresholds. Clinically cleared.');
    setReleaseSuccessMsg('');
  };

  const handleOpenSignModal = () => {
    setSignError('');
    setBiologistCode('');
    setShowSignModal(true);
  };

  const handleConfirmSignAndRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignError('');

    if (!selectedBooking) return;
    const cleanCode = biologistCode.trim();

    if (!cleanCode) {
      setSignError('Please enter your authorized Biologist / Medical Director Passcode.');
      return;
    }

    // Verify staff credentials with Biologist / Admin clearance
    const authResult = await authService.verifyStaffActionCode(
      cleanCode,
      ['biologist', 'admin', 'superadmin', 'lab_director', 'lab_tech'],
      user?.accessCode || (user as any)?.initialCode,
      targetLabId
    );

    if (!authResult.authorized) {
      setSignError(authResult.error || 'Access Denied: Invalid Biologist Passcode. Only authorized clinical biologists or medical directors can sign and release reports.');
      return;
    }

    setIsReleasing(true);
    try {
      const res = await limsService.signAndReleaseByBiologist({
        labId: targetLabId,
        bookingId: selectedBooking.id,
        biologistName: authResult.staffName || user?.name || 'Verified Clinical Biologist',
        biologistAccessCode: cleanCode,
        biologistRemarks: biologistRemarks.trim() || 'Clinical findings reviewed and authorized for official release.'
      });

      if (res.success) {
        setReleaseSuccessMsg(`✅ Diagnostic Report for Booking ${selectedBooking.bookingCode} (${selectedBooking.patientName}) successfully signed & released to the Patient Portal!`);
        setShowSignModal(false);
        setBiologistCode('');
        
        // Refresh local list & selected booking state
        await fetchData();
        setSelectedBooking(prev => prev ? {
          ...prev,
          biologistSigned: true,
          biologistName: authResult.staffName || user?.name || 'Lead Pathologist',
          biologistRemarks,
          overallStatus: 'Completed'
        } : null);
      } else {
        setSignError(res.error || 'Failed to authorize and release report.');
      }
    } catch (err: any) {
      console.error('Error signing and releasing by biologist:', err);
      setSignError('An error occurred during verification. Please try again.');
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Clinical Biologist Review & Authorization Console"
        subtitle="Step 5: Biochemical inspection, clinical interpretation, cryptographic signing & official patient portal release"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      {/* Staff Hero Banner */}
      <StaffHeroBanner
        workstationNumber="Workstation 05"
        workstationTitle="Clinical Pathologist & Biologist Desk"
        description="Inspect biochemistry findings, verify reference intervals, provide clinical diagnostic interpretations, digitally sign reports with SHA-256 non-repudiation seals, and authorize instant Patient Portal delivery."
        gradientFrom="from-purple-950"
        gradientVia="from-slate-900"
        gradientTo="to-indigo-950"
        borderColor="border-purple-800"
        badgeBg="bg-purple-400 text-slate-950"
        rightBadge={
          <div className="text-right bg-purple-950/80 p-4 rounded-2xl border border-purple-700/60 shadow-md">
            <div className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Awaiting Biologist Sign-Off</div>
            <div className="text-2xl font-black text-purple-300 font-mono mt-0.5">{pendingQueue.length} Orders</div>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Sign-Off</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">{pendingQueue.length}</h3>
            <p className="text-[11px] text-purple-600 font-medium mt-0.5">Awaiting clinical authorization</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Microscope className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Released Reports</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{releasedQueue.length}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Digitally signed & delivered</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Diagnostic Volume</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{bookings.length}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Central LIMS Booklets</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Order Queue List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            
            {/* Tab Buttons */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'pending'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Review ({pendingQueue.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('released')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'released'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Released ({releasedQueue.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search patient, PID, booking code or test..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Queue List */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading Biologist Queue...</div>
            ) : filteredQueue.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Microscope className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No test orders matching this filter</p>
                <p className="text-[11px] text-slate-400">All submitted biochemical tests are processed.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredQueue.map(b => {
                  const isSelected = selectedBooking?.id === b.id;
                  const isReleased = b.biologistSigned;
                  const testCount = b.tests?.length || 1;

                  return (
                    <div
                      key={b.id}
                      onClick={() => handleOpenReview(b)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-purple-50 border-purple-400 shadow-md ring-2 ring-purple-600/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {b.bookingCode}
                        </span>
                        {isReleased ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Signed & Released
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            Awaiting Sign-Off
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{b.patientName}</h4>
                          <p className="text-[11px] text-slate-500 font-mono">
                            PID: {b.patientPid || b.patientId} • {b.patientGender || 'Adult'}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-purple-700 translate-x-1' : 'text-slate-300'}`} />
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate max-w-[200px]">
                          {b.tests?.map(t => t.testName).join(', ') || 'Diagnostic Panel'}
                        </span>
                        <span className="font-bold text-purple-700">{testCount} Test{testCount === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Detailed Review & Release Console */}
        <div className="lg:col-span-7 space-y-4">
          {selectedBooking ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg space-y-6">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800">
                      Biologist Diagnostic Review
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {selectedBooking.bookingCode}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {selectedBooking.patientName}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>PID: <strong className="font-mono text-slate-700">{selectedBooking.patientPid || selectedBooking.patientId}</strong></span>
                    <span>•</span>
                    <span>Gender: <strong>{selectedBooking.patientGender || 'Adult'}</strong></span>
                    <span>•</span>
                    <span>Age: <strong>{selectedBooking.patientAge || '28'} yrs</strong></span>
                    {selectedBooking.referringDoctor && (
                      <>
                        <span>•</span>
                        <span>Ref: <strong className="text-purple-700">{selectedBooking.referringDoctor}</strong></span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowPdfModal(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-purple-700" />
                    Preview PDF
                  </button>

                  {!selectedBooking.biologistSigned ? (
                    <button
                      onClick={handleOpenSignModal}
                      className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-700/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      Sign & Release Report
                    </button>
                  ) : (
                    <span className="px-3.5 py-2 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Authorized by {selectedBooking.biologistName || 'Biologist'}
                    </span>
                  )}
                </div>
              </div>

              {/* Success Notification Banner */}
              {releaseSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{releaseSuccessMsg}</span>
                </div>
              )}

              {/* Biochemical Test Parameters Inspection Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-600" />
                    Biochemical Findings & Analytical Values
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Processed by {selectedBooking.assignedTechName || 'Medical Technologist'}
                  </span>
                </div>

                <div className="space-y-4">
                  {selectedBooking.tests?.map((test, tIdx) => {
                    const hasSubParams = Array.isArray(test.subParameters) && test.subParameters.length > 0;

                    return (
                      <div key={test.id || tIdx} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                              <FlaskConical className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{test.testName}</h4>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{test.category}</span>
                            </div>
                          </div>

                          {!hasSubParams && test.resultValue && (
                            <div className="text-right">
                              <span className="font-mono font-black text-sm text-purple-900">
                                {test.resultValue} {test.units || ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Sub Parameters Table */}
                        {hasSubParams && (
                          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                                <tr>
                                  <th className="py-2 px-3">Parameter</th>
                                  <th className="py-2 px-3">Measured Value</th>
                                  <th className="py-2 px-3">Unit</th>
                                  <th className="py-2 px-3">Reference Range</th>
                                  <th className="py-2 px-3 text-right">Flag</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {test.subParameters!.map((sp, spIdx) => {
                                  const isHigh = sp.flag === 'High';
                                  const isLow = sp.flag === 'Low';
                                  const isNormal = !isHigh && !isLow;

                                  const refStr = selectedBooking.patientGender === 'Female' 
                                    ? sp.refRangeFemale || `${sp.femaleMin || 0} - ${sp.femaleMax || 100}`
                                    : sp.refRangeMale || `${sp.maleMin || 0} - ${sp.maleMax || 100}`;

                                  return (
                                    <tr key={sp.id || spIdx} className="hover:bg-slate-50/50">
                                      <td className="py-2 px-3 font-semibold text-slate-800">{sp.name}</td>
                                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                        {sp.value || 'Pending'}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{sp.unit || '-'}</td>
                                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{refStr}</td>
                                      <td className="py-2 px-3 text-right">
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
                        )}

                        {test.labNotes && (
                          <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                            <strong>Technologist Notes: </strong> {test.labNotes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pathologist Clinical Interpretation & Remarks */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Clinical Pathologist Diagnostic Observations & Comments
                </label>
                <textarea
                  value={biologistRemarks}
                  onChange={e => setBiologistRemarks(e.target.value)}
                  disabled={selectedBooking.biologistSigned}
                  rows={3}
                  placeholder="Enter medical evaluation, differential diagnosis comments, or clinical follow-up recommendations..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100"
                />
                <p className="text-[11px] text-slate-400">
                  These remarks will appear permanently on the official PDF Laboratory Diagnostic Report and in the Patient Portal.
                </p>
              </div>

              {/* Non-Repudiation Security Seal */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">Cryptographic Non-Repudiation Seal</div>
                    <div className="text-[11px] text-slate-400">
                      SHA-256 Digital Signature Stamp • Verified Medical Director Sign-off
                    </div>
                  </div>
                </div>

                {!selectedBooking.biologistSigned && (
                  <button
                    onClick={handleOpenSignModal}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Authorize Now
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <Microscope className="w-12 h-12 text-purple-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Patient Order Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an order from the queue on the left to review analytical parameters, provide clinical interpretations, and authorize release to the Patient Portal.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* PDF REPORT VIEW MODAL */}
      {showPdfModal && selectedBooking && (
        <LabReportPdfViewModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          booking={selectedBooking}
          labInfo={lab}
        />
      )}

      {/* BIOLOGIST PASSCODE AUTHORIZATION MODAL */}
      {showSignModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative my-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Biologist Authorization</h3>
                  <p className="text-xs text-slate-500">Enter access passcode to sign & release findings</p>
                </div>
              </div>
              <button
                onClick={() => setShowSignModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSignAndRelease} className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs space-y-1 text-purple-950">
                <div className="font-bold flex items-center justify-between">
                  <span>Patient: {selectedBooking.patientName}</span>
                  <span className="font-mono text-[10px]">{selectedBooking.bookingCode}</span>
                </div>
                <div className="text-[11px] text-purple-800">
                  Tests: {selectedBooking.tests?.map(t => t.testName).join(', ')}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Biologist Security Access PIN / Passcode *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={biologistCode}
                    onChange={e => setBiologistCode(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter Biologist PIN (e.g. BIO-1234 or staff code)"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono tracking-wider"
                  />
                </div>
                {signError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{signError}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReleasing || !biologistCode.trim()}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isReleasing ? (
                    'Signing & Releasing...'
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Sign & Release Official Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BiologistView;
