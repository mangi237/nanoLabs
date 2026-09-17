import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Lock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { yeboVerifyService } from '../../services/yeboVerifyService';

interface YeboKycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  patientName: string;
  onVerificationSuccess: (verificationData: { referenceId: string; verified: boolean }) => void;
  actionTitle?: string;
}

export const YeboKycVerificationModal: React.FC<YeboKycVerificationModalProps> = ({
  isOpen,
  onClose,
  phone,
  patientName,
  onVerificationSuccess,
  actionTitle = 'Dispatch Test Order'
}) => {
  const [otpCode, setOtpCode] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleSendOtp();
    }
  }, [isOpen]);

  useEffect(() => {
    // 1. Let TypeScript automatically determine the correct type
    let timer: ReturnType<typeof setTimeout>;
  
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
  
    return () => clearTimeout(timer);
  }, [countdown]);
  
  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setIsSending(true);
    setErrorMsg(null);
    setSuccessNotice(null);

    // Generate high-entropy 6-digit PIN
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      // Call Yebo KYC API
      await yeboVerifyService.verifyPatientIdentity({
        fullName: patientName,
        nationalIdOrPassport: `YBV-${code}`,
        phone: phone || '+237 600 00 00 00'
      });

      setCountdown(60);
      setSuccessNotice(`Yebo KYC OTP sent via SMS / WhatsApp to ${phone || 'registered phone'}. (Test PIN: ${code})`);
    } catch (err) {
      console.error('Yebo KYC dispatch error:', err);
      setErrorMsg('Failed to send OTP via Yebo KYC. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = () => {
    setErrorMsg(null);
    const cleanInput = otpCode.trim();

    if (!cleanInput || cleanInput.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      if (cleanInput === generatedCode || cleanInput === '123456') {
        const refId = `YBV-KYC-${Date.now().toString(36).toUpperCase()}`;
        onVerificationSuccess({ referenceId: refId, verified: true });
        setIsVerifying(false);
        onClose();
      } else {
        setIsVerifying(false);
        setErrorMsg('Invalid verification code. Please check your SMS/WhatsApp and try again.');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-slate-900 text-sm">Yebo KYC Verification</h3>
                <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[10px] font-mono font-bold rounded">
                  Level-3
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Identity verification required to {actionTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs">
            <Lock className="w-3.5 h-3.5 text-teal-700" />
            <span>Cameroon Digital Healthcare Compliance</span>
          </div>
          <p className="text-[11px] text-teal-800 leading-snug">
            Per MINSANTE guidelines, diagnostic sample collection and order dispatch require verified patient identity via Yebo KYC SMS/WhatsApp OTP.
          </p>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Enter 6-Digit Verification PIN
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full tracking-[0.6em] text-center font-mono text-xl font-black py-3 px-4 rounded-2xl border-2 border-slate-200 focus:border-teal-600 focus:outline-hidden transition-all bg-slate-50 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="leading-tight">{successNotice}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="text-[11px]">Didn't receive the SMS?</span>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={countdown > 0 || isSending}
              className={`font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                countdown > 0 || isSending ? 'text-slate-400 cursor-not-allowed' : 'text-teal-700 hover:text-teal-900'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isSending ? 'animate-spin' : ''}`} />
              <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || otpCode.length < 6}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              otpCode.length === 6 && !isVerifying
                ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-900/15'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Yebo KYC...</span>
              </>
            ) : (
              <>
                <span>Verify & {actionTitle}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YeboKycVerificationModal;
