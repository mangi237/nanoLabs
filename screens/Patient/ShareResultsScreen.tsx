import React, { useState } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { 
  Share2, 
  Mail, 
  Copy, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Loader2, 
  FileText, 
  UserCheck, 
  RefreshCw, 
  X, 
  ShieldAlert, 
  Stethoscope, 
  Building2, 
  Sparkles,
  Check
} from 'lucide-react';
import { sendOtpVerification, verifyOtpCode, sendDoctorReportEmail } from '../../services/emailService';

interface ShareResultsScreenProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const ShareResultsScreen: React.FC<ShareResultsScreenProps> = ({
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  const { user, lab } = useAuth();
  
  // Doctor information
  const [doctorName, setDoctorName] = useState('Dr. Alexis Vance, MD');
  const [doctorEmail, setDoctorEmail] = useState('doctor.smith@clinic.org');
  const [clinicName, setClinicName] = useState('Central Diagnostic Hospital, Douala');
  const [personalNotes, setPersonalNotes] = useState('Please find my recent clinical diagnostic test results for review before my upcoming consultation.');

  // Completed Test Selection
  const availableTests = [
    { id: 't-1', testName: 'Complete Blood Count (CBC)', category: 'Hematology', result: '14.2 g/dL (Normal)', normalRange: '13.5 - 17.5 g/dL', status: 'Completed', date: '2026-08-25' },
    { id: 't-2', testName: 'Fasting Blood Glucose (FBG)', category: 'Biochemistry', result: '92 mg/dL (Normal)', normalRange: '70 - 99 mg/dL', status: 'Completed', date: '2026-08-25' },
    { id: 't-3', testName: 'Lipid Profile Panel', category: 'Biochemistry', result: '185 mg/dL (Optimal)', normalRange: '< 200 mg/dL', status: 'Completed', date: '2026-08-25' },
    { id: 't-4', testName: 'Comprehensive Renal Function', category: 'Nephrology', result: 'Creatinine 0.9 mg/dL', normalRange: '0.7 - 1.3 mg/dL', status: 'Completed', date: '2026-08-24' }
  ];

  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(['t-1', 't-2', 't-3', 't-4']);

  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [debugOtpCode, setDebugOtpCode] = useState<string | null>(null);

  // Email delivery state
  const [copied, setCopied] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const patientEmail = user?.email || 'patient.sample@nanolabs.health';
  const patientName = user?.name || 'Christian Mbi';
  const patientId = user?.patientId || user?.id || 'PT-99201';
  const labName = lab?.name || user?.labName || 'nanoLabs Regional Diagnostic Center';

  const shareUrl = `https://nanolabs.health/share/verify-report-${patientId.toLowerCase()}`;

  const toggleTest = (id: string) => {
    if (selectedTestIds.includes(id)) {
      if (selectedTestIds.length === 1) {
        alert('Please select at least one test result to share.');
        return;
      }
      setSelectedTestIds(prev => prev.filter(t => t !== id));
    } else {
      setSelectedTestIds(prev => [...prev, id]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Step 1: Request patient consent OTP
  const handleInitiateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorEmail.trim() || !doctorName.trim()) {
      alert('Please enter your physician’s name and email address.');
      return;
    }

    setOtpSending(true);
    setOtpError('');
    setShowOtpModal(true);

    try {
      const res = await sendOtpVerification(
        patientEmail,
        'patient_share',
        patientName,
        labName
      );

      if (res.success) {
        setVerificationId(res.verificationId || '');
        setOtpSuccessMessage(res.message || `Verification code sent to ${patientEmail}`);
        if (res.debugCode) {
          setDebugOtpCode(res.debugCode);
        }
      } else {
        setOtpError(res.error || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setOtpError('Error connecting to verification service.');
    } finally {
      setOtpSending(false);
    }
  };

  // Step 2: Verify OTP and automatically dispatch Doctor Diagnostic Report
  const handleVerifyAndSendDoctorReport = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError('Please enter the full 6-digit verification code.');
      return;
    }

    setOtpVerifying(true);
    setOtpError('');

    try {
      const verifyRes = await verifyOtpCode(patientEmail, otpCode.trim(), verificationId);
      if (!verifyRes.success || !verifyRes.verified) {
        setOtpError(verifyRes.error || 'Invalid or expired verification code. Please re-enter.');
        setOtpVerifying(false);
        return;
      }

      // Verification passed! Close modal and send doctor report
      setShowOtpModal(false);
      setSendingReport(true);

      const testsToInclude = availableTests
        .filter(t => selectedTestIds.includes(t.id))
        .map(t => ({
          testName: t.testName,
          category: t.category,
          resultValue: t.result,
          referenceRange: t.normalRange,
          status: t.status
        }));

      const dispatchRes = await sendDoctorReportEmail({
        doctorEmail: doctorEmail.trim(),
        doctorName: doctorName.trim(),
        patientName: patientName,
        patientCode: patientId,
        labName: labName,
        bookingCode: `BK-${patientId.replace(/[^0-9]/g, '').slice(-4) || '9042'}`,
        tests: testsToInclude,
        reportUrl: `https://nanolabs.health/reports/view/${patientId}?verified=true`,
        remarks: personalNotes.trim()
      });

      if (dispatchRes.success) {
        setSentSuccess(true);
        setSentMessage(`Encrypted diagnostic report successfully emailed to ${doctorName} (${doctorEmail})`);
      } else {
        alert(dispatchRes.error || 'Could not send report. Please check the email address and try again.');
      }
    } catch (e: any) {
      console.error('Error dispatching doctor report:', e);
      setOtpError(e.message || 'Verification failed.');
    } finally {
      setOtpVerifying(false);
      setSendingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Share Lab Results with Physician"
        subtitle="Secure encrypted delivery & patient-authorized consent"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patient Portal
          </button>
        )}

        {/* Success Alert Banner */}
        {sentSuccess && (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-sm space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Report Dispatched to Healthcare Provider</h3>
                <p className="text-xs text-emerald-800 font-medium">{sentMessage}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-100">
              An encrypted audit log entry has been recorded in the compliance ledger. The physician has been provided with certified diagnostic values and a direct PDF download link.
            </p>
          </div>
        )}

        {/* Security & Verification Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Direct Physician Delivery</h2>
                <p className="text-xs text-slate-500">Requires 6-digit OTP verification code to ensure confidential patient authorization</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-800 text-[10px] font-bold rounded-full border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              HIPAA / Privacy Compliant
            </span>
          </div>

          <form onSubmit={handleInitiateShare} className="space-y-6">
            {/* Physician Information */}
            <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-600" />
                Physician & Facility Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doctor / Specialist Full Name *</label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Alexis Vance"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Physician Verified Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={doctorEmail}
                      onChange={e => setDoctorEmail(e.target.value)}
                      placeholder="doctor@hospital.org"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinic / Hospital / Department</label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={e => setClinicName(e.target.value)}
                    placeholder="e.g. Central Hospital, Internal Medicine Dept."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message / Clinical Note for Physician</label>
                  <textarea
                    rows={2}
                    value={personalNotes}
                    onChange={e => setPersonalNotes(e.target.value)}
                    placeholder="Optional message for your attending physician..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Test Results to Include */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Select Tests to Include in Report ({selectedTestIds.length}/{availableTests.length})
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedTestIds(availableTests.map(t => t.id))}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                >
                  Select All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableTests.map(test => {
                  const isSelected = selectedTestIds.includes(test.id);
                  return (
                    <div
                      key={test.id}
                      onClick={() => toggleTest(test.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20'
                          : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTest(test.id)}
                            className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                          />
                          <span className="font-bold text-slate-900 text-xs truncate">{test.testName}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-2 pl-6">
                          <span className="font-semibold text-emerald-800">{test.result}</span>
                          <span>•</span>
                          <span className="text-slate-500">{test.category}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Patient Consent Notice */}
            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200/80 text-xs text-teal-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-teal-900">
                <Lock className="w-3.5 h-3.5 text-teal-700" />
                Patient Identity & Consent Verification
              </p>
              <p className="text-[11px] text-teal-900 leading-relaxed font-medium">
                To protect confidential health records, clicking the button below will dispatch a <strong>6-digit security code</strong> to your registered contact (<strong className="text-slate-900">{patientEmail}</strong>). Entering the code authorizes delivery of the certified diagnostic PDF.
              </p>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={otpSending || sendingReport}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {otpSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Verification Code...
                </>
              ) : sendingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Dispatching Doctor Report...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Authorize & Send Verification Code
                </>
              )}
            </button>
          </form>

          {/* Quick Direct Link Section */}
          <div className="pt-6 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-700">Alternative Direct Secure Access URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Patient Consent OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-slate-900 relative">
            <button
              onClick={() => {
                setShowOtpModal(false);
                setOtpError('');
                setOtpCode('');
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Authorize Result Release
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Please enter the 6-digit consent code sent to <strong className="text-slate-800">{patientEmail}</strong> to release your diagnostic records to <strong className="text-slate-800">{doctorName}</strong>.
              </p>
            </div>

            {otpSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{otpSuccessMessage}</span>
              </div>
            )}

            {debugOtpCode && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 font-mono flex items-center justify-between">
                <span>Dev Code: <strong>{debugOtpCode}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpCode(debugOtpCode)}
                  className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded text-[10px] cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 text-center uppercase tracking-wider">
                Enter 6-Digit Consent Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setOtpCode(val);
                  setOtpError('');
                }}
                placeholder="• • • • • •"
                className="w-full text-center py-3 px-4 bg-slate-50 border-2 border-indigo-500/40 rounded-2xl text-2xl font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner"
              />
            </div>

            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleVerifyAndSendDoctorReport}
                disabled={otpVerifying || otpCode.length !== 6}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying Consent & Dispatching...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verify Code & Send Report to Doctor
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleInitiateShare}
                disabled={otpSending}
                className="w-full py-2 text-xs text-slate-500 hover:text-indigo-700 font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${otpSending ? 'animate-spin' : ''}`} />
                Resend Code to {patientEmail}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareResultsScreen;

