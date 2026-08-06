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
  Building2 
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

  // Password requirement tests
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasNumber && hasLetter && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasMinLength) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!hasNumber || !hasLetter) {
      setErrorMessage('Password must contain both letters and numbers.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.setPermanentPassword(
        user?.id,
        user?.email,
        password,
        lab?.id || user?.labId
      );

      if (result.success) {
        setSuccessNotice(true);
        const updatedUser = {
          ...user,
          mustChangePassword: false,
          status: 'active'
        };

        // Update local session
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setTimeout(() => {
          onSuccess(updatedUser);
        }, 1200);
      } else {
        setErrorMessage(result.error || 'Failed to save password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while setting your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 shadow-xl mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Establish Permanent Password
          </h1>
          <p className="text-xs text-teal-200/80">
            Zero-Knowledge Cryptographic Access Setup
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
              One-Time OTP Login Verified
            </span>
          </div>
        </div>

        {/* Password Form Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
          {/* Security Notice Callout */}
          <div className="p-3.5 bg-teal-900/40 border border-teal-500/30 rounded-2xl flex items-start gap-3 text-xs text-teal-100">
            <Lock className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white block">Zero-Knowledge Confidentiality Policy</span>
              <p className="text-[11px] leading-relaxed text-teal-200/90">
                Your password will be securely salted and hashed with SHA-256 on the server. Neither hospital administrators nor technical staff will ever be able to see or recover your password.
              </p>
            </div>
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
              <span>Permanent password established! Entering staff portal...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                New Permanent Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter private password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm Permanent Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password to confirm"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation Criteria */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Security Requirements:
              </span>
              <div className="flex items-center gap-2">
                {hasMinLength ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={hasMinLength ? 'text-emerald-300' : 'text-slate-400'}>
                  At least 6 characters in length
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasNumber && hasLetter ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={hasNumber && hasLetter ? 'text-emerald-300' : 'text-slate-400'}>
                  Contains both letters and numbers
                </span>
              </div>
              <div className="flex items-center gap-2">
                {passwordsMatch ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={passwordsMatch ? 'text-emerald-300' : 'text-slate-400'}>
                  Both passwords match exactly
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading || !isFormValid || successNotice}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Encrypting & Saving Credentials...
                </>
              ) : (
                <>
                  Save Permanent Password & Launch Portal
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
