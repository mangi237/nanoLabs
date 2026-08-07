import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { authService } from '../../services/authService';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Loader2, 
  ShieldAlert, 
  User, 
  Mail, 
  Building2,
  AlertTriangle,
  FileCheck2,
  LockKeyhole,
  Users
} from 'lucide-react';

interface SetPermanentPasswordScreenProps {
  onSuccess: (updatedUser: any) => void;
}

export const SetPermanentPasswordScreen: React.FC<SetPermanentPasswordScreenProps> = ({ onSuccess }) => {
  const { user, setUser, lab } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);
  const [acknowledgedPolicy, setAcknowledgedPolicy] = useState(false);

  // Requirements: minimum 4 chars, match exactly
  const hasMinLength = password.length >= 4;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && passwordsMatch && acknowledgedPolicy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasMinLength) {
      setErrorMessage('Your new access code must be at least 4 characters long.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Access codes do not match. Please re-enter.');
      return;
    }
    if (!acknowledgedPolicy) {
      setErrorMessage('Please acknowledge the non-sharing confidentiality policy before continuing.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.setPermanentPassword(
        user?.id,
        user?.email,
        password.trim(),
        lab?.id || user?.labId
      );

      if (result && result.success) {
        setSuccessNotice(true);
        const updatedUser = {
          ...user,
          accessCode: password.trim(),
          mustChangePassword: false,
          isTemporaryPassword: false,
          status: 'active'
        };

        // Update local session
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setTimeout(() => {
          onSuccess(updatedUser);
        }, 1200);
      } else {
        setErrorMessage('Failed to save new access code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving your private code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 shadow-xl mb-1">
            <LockKeyhole className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            First-Time Security Setup
          </h1>
          <p className="text-sm text-teal-200/90 font-medium">
            Create Your Private Permanent Access Code
          </p>
        </div>

        {/* Staff Identity Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{user?.name || 'Staff Member'}</h3>
                <div className="text-xs text-teal-200 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-teal-400" />
                  <span>{user?.email || 'Authorized Staff'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {(user?.roles || [user?.role || 'staff']).map((r: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-teal-500/30 text-teal-200 text-[10px] font-bold uppercase tracking-wider border border-teal-400/30"
                >
                  {r.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              {lab?.name || user?.labName || 'nanoLabs Facility'}
            </span>
            <span className="text-[11px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded font-medium border border-amber-400/20">
              Temporary Setup Code Active
            </span>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          
          {/* Detailed Security & Policy Reasons */}
          <div className="p-4 bg-teal-950/70 border border-teal-500/40 rounded-2xl space-y-3 text-xs text-slate-200">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-teal-400" />
              Why You Must Change Your Code & Keep It Secret:
            </div>
            
            <ul className="space-y-2 text-[11px] text-slate-300 leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-white">Admin-Assigned Temporary Code:</strong> The code you just entered was temporarily created by your administrator for your onboarding. You must replace it with your own private code.
              </li>
              <li>
                <strong className="text-white">Clinical Action Accountability:</strong> Every diagnostic test you record, sample you analyze, patient you admit, and payment you collect is legally recorded in your name in the audit ledger.
              </li>
              <li>
                <strong className="text-amber-300">Strict Non-Sharing Policy:</strong> You must <strong>never share this code with anyone</strong>—including colleagues or supervisors. Each staff member must only use their own assigned credentials.
              </li>
            </ul>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Private access code configured successfully! Entering your workspace...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Private Code Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                New Private Access Code / Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new secret code (e.g. MARC7749)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Code Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm Private Access Code <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your private code to confirm"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                {hasMinLength ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={hasMinLength ? 'text-emerald-300' : 'text-slate-400'}>
                  At least 4 characters long (letters, numbers, or symbols)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {passwordsMatch ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={passwordsMatch ? 'text-emerald-300' : 'text-slate-400'}>
                  Both codes match exactly
                </span>
              </div>
            </div>

            {/* Mandatory Non-Sharing Agreement Checkbox */}
            <label className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={acknowledgedPolicy}
                onChange={e => setAcknowledgedPolicy(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-white/10 border-white/20 cursor-pointer"
              />
              <span className="text-xs text-slate-200 leading-relaxed">
                I understand that this code belongs solely to me. <strong>I will keep it strictly confidential and will NOT share it with anyone</strong>, ensuring all laboratory and clinical operations under my account remain secure.
              </span>
            </label>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading || !isFormValid || successNotice}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Your Private Code...
                </>
              ) : (
                <>
                  Save Private Code & Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetPermanentPasswordScreen;
