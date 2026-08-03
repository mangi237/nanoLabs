import React, { useState } from 'react';
import { Activity, CheckCircle2, Copy, Check, ArrowRight, Building2, User, Key, AlertTriangle, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/authContext';

interface RegistrationCompleteScreenProps {
  patientData: {
    id?: string;
    patientId?: string;
    name?: string;
    accessCode?: string;
    labId?: string;
    labName?: string;
    phone?: string;
    email?: string;
  };
  onGoToLogin: () => void;
  onGoToDashboard?: () => void;
}

export const RegistrationCompleteScreen: React.FC<RegistrationCompleteScreenProps> = ({
  patientData,
  onGoToLogin,
  onGoToDashboard
}) => {
  const { login, setUser, setLab } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const {
    name = 'Patient',
    accessCode = 'N/A',
    labName = 'Selected Laboratory',
    labId = ''
  } = patientData || {};

  const handleCopyCode = () => {
    if (accessCode && accessCode !== 'N/A') {
      navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDirectDashboard = async () => {
    setLoggingIn(true);
    setLoginError('');
    try {
      if (accessCode && labId) {
        try {
          const res = await login(accessCode, labId);
          if (res.success) {
            if (onGoToDashboard) onGoToDashboard();
            return;
          }
        } catch (e) {
          console.warn('Direct login attempt via service failed, falling back to instant patient session', e);
        }
      }

      // Explicit fallback: force role to patient so UnifiedDashboard renders PatientDashboard
      const userObj = {
        id: patientData?.id || patientData?.patientId || 'patient-temp-id',
        patientId: patientData?.patientId || 'P-1000',
        name: name,
        accessCode: accessCode,
        labId: labId,
        role: 'patient',
        roles: ['patient']
      };

      setUser(userObj);
      setLab({ id: labId || 'lab-1', name: labName || 'Main Laboratory' });

      if (onGoToDashboard) {
        onGoToDashboard();
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please use the portal login screen.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Header Badge */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">
            🎉 Registration Complete!
          </h1>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Your patient record has been successfully registered in our medical database.
          </p>
        </div>

        {/* Patient & Access Code Summary Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          
          {/* Info Rows */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <span className="text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-400" />
                Patient Name
              </span>
              <span className="font-bold text-white">{name}</span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-slate-400 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-400" />
                Selected Lab
              </span>
              <span className="font-bold text-teal-300">{labName}</span>
            </div>
          </div>

          {/* Key Access Code Highlight Card */}
          <div className="bg-white text-slate-900 rounded-2xl p-6 text-center space-y-3 shadow-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Key className="w-4 h-4 text-teal-600" />
              Your Personal Security Access Code
            </div>
            
            <div className="text-3xl sm:text-4xl font-mono font-black text-slate-900 tracking-widest py-2 bg-slate-100 rounded-xl border border-slate-200 select-all">
              {accessCode}
            </div>

            <button
              onClick={handleCopyCode}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Access Code Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Access Code
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500">
              Save or write down this code carefully. You will use it to log in to your patient portal.
            </p>
          </div>

          {/* Pending Receptionist Confirmation Warning */}
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-200 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-300 text-sm">⚠️ Awaiting Receptionist Confirmation</h4>
              <p>
                Please visit the receptionist desk at <strong className="text-white">{labName}</strong> to confirm your identity and present your access code. Once verified, your laboratory tests can be processed and results uploaded to your portal.
              </p>
            </div>
          </div>

          {/* Step-by-Step Next Steps */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              📋 Next Steps for Patient
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { num: '1', text: `Proceed to the receptionist counter at ${labName}` },
                { num: '2', text: `Provide your security code: ${accessCode}` },
                { num: '3', text: 'Wait for receptionist to confirm & order your lab test' },
                { num: '4', text: 'Log in anytime using your code to track test status & download results' }
              ].map((step) => (
                <div key={step.num} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="w-6 h-6 rounded-lg bg-teal-500/30 border border-teal-400/40 text-teal-300 font-bold flex items-center justify-center shrink-0 text-xs">
                    {step.num}
                  </span>
                  <span className="text-slate-200">{step.text}</span>
                </div>
              ))}
            </div>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl font-medium">
              {loginError}
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleDirectDashboard}
              disabled={loggingIn}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? 'Accessing Dashboard...' : 'Go Directly to Patient Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToLogin}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-semibold rounded-2xl text-xs transition-colors cursor-pointer border border-white/10 text-center"
            >
              Back to Portal Login Screen
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1 pt-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Need assistance? Contact the lab support team at reception.
          </p>

        </div>
      </div>
    </div>
  );
};

export default RegistrationCompleteScreen;
