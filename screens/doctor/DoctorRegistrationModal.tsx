import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  X, 
  Building2, 
  Phone, 
  Mail, 
  Key, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Award,
  Loader2,
  FileText,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Bot,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { db, collection, addDoc } from '../../services/firebase';
import { cleanFirestoreData, validatePhoneNumber } from '../../utils/sanitizeData';

interface DoctorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (doctor: any) => void;
}

export const DoctorRegistrationModal: React.FC<DoctorRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'Internal Medicine',
    hospital: '',
    phone: '',
    email: '',
    licenseNumber: '',
    password: '',
    confirmPassword: '',
    notes: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any | null>(null);

  // Human Verification State
  const [captchaNum1, setCaptchaNum1] = useState(7);
  const [captchaNum2, setCaptchaNum2] = useState(8);
  const [userCaptchaAnswer, setUserCaptchaAnswer] = useState('');
  const [isHumanCheckboxChecked, setIsHumanCheckboxChecked] = useState(false);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 15) + 5;
    const n2 = Math.floor(Math.random() * 12) + 3;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setUserCaptchaAnswer('');
  };

  useEffect(() => {
    if (isOpen) {
      generateCaptcha();
      setErrorMessage('');
      setSuccessData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCaptchaValid = parseInt(userCaptchaAnswer.trim(), 10) === (captchaNum1 + captchaNum2);
  const isHumanVerified = isHumanCheckboxChecked && isCaptchaValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Please enter your full legal medical practitioner name.');
      return;
    }
    if (!formData.licenseNumber.trim()) {
      setErrorMessage('Please provide your Medical Council (ONMC) registration / license number.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Please provide your direct contact phone number.');
      return;
    }

    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setErrorMessage(phoneValidation.errorMessage || 'Please enter a valid 9-digit mobile phone number.');
      return;
    }

    if (!formData.password || formData.password.length < 4) {
      setErrorMessage('Please create a secure password or passcode of at least 4 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields match exactly.');
      return;
    }

    // Strict Anti-Bot Human Verification check
    if (!isHumanVerified) {
      if (!isCaptchaValid) {
        setErrorMessage(`Human verification failed: Please solve the math security challenge (${captchaNum1} + ${captchaNum2}).`);
      } else if (!isHumanCheckboxChecked) {
        setErrorMessage('Please check the verification box to confirm you are a human practitioner.');
      }
      return;
    }

    setLoading(true);
    try {
      const cleanDocName = formData.name.trim().toLowerCase().startsWith('dr')
        ? formData.name.trim()
        : `Dr. ${formData.name.trim()}`;

      const generatedAccessCode = 'DOC-' + Math.floor(1000 + Math.random() * 9000);

      const doctorPayload = {
        name: cleanDocName,
        specialty: formData.specialty.trim() || 'General Medicine',
        hospital: formData.hospital.trim() || 'Private Practice / Clinic',
        phone: phoneValidation.formatted || formData.phone.trim(),
        email: formData.email.trim().toLowerCase() || `${formData.phone.trim().replace(/\D/g, '')}@doctors.nanolabs.cm`,
        licenseNumber: formData.licenseNumber.trim(),
        password: formData.password.trim(),
        passcode: formData.password.trim(),
        accessCode: generatedAccessCode,
        notes: formData.notes.trim(),
        status: 'active',
        role: 'doctor',
        verifiedHuman: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const cleaned = cleanFirestoreData(doctorPayload);
      // Save in global doctors collection
      const docRef = await addDoc(collection(db, 'doctors'), cleaned);
      const createdRecord = { id: docRef.id, ...cleaned };

      setSuccessData(createdRecord);
    } catch (err: any) {
      console.error('Error registering doctor:', err);
      setErrorMessage(err.message || 'Could not register doctor profile. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToLogin = () => {
    if (onSuccess && successData) {
      onSuccess(successData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Doctor Account Successfully Created!</h3>
              <p className="text-xs text-slate-500">
                You are now registered as an accredited physician across all nanoLabs diagnostic facilities.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor Name:</span>
                <strong className="text-slate-900">{successData.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone Number:</span>
                <strong className="font-mono text-slate-900">{successData.phone}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">License / ONMC:</span>
                <strong className="font-mono text-slate-900">{successData.licenseNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialty:</span>
                <strong className="text-slate-900">{successData.specialty}</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-teal-700 font-bold">Sign-In Credentials:</span>
                <span className="text-slate-700 font-medium">Use Phone + Your Password</span>
              </div>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 text-left flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                You can now log in directly from the Doctor Portal screen using your phone number <strong>{successData.phone}</strong> and chosen password.
              </span>
            </div>

            <button
              type="button"
              onClick={handleProceedToLogin}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Go to Doctor Login Screen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-teal-50 text-teal-700 rounded-2xl border border-teal-200">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Doctor & Physician Registration</h3>
                <p className="text-xs text-slate-500">Create your physician account to view referred patient test results</p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jean-Paul Mbarga"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Sign-in ID) *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 671234567"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medical License / ONMC Reg *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ONMC-CMR-88491"
                  value={formData.licenseNumber}
                  onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialty</label>
                <select
                  value={formData.specialty}
                  onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                >
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Gynecology & Obstetrics">Gynecology & Obstetrics</option>
                  <option value="General Practice">General Practice</option>
                  <option value="Oncology">Oncology</option>
                  <option value="Nephrology">Nephrology</option>
                  <option value="Infectious Disease">Infectious Disease</option>
                  <option value="Surgery">General Surgery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic / Cabinet</label>
                <input
                  type="text"
                  placeholder="e.g. Douala General Hospital"
                  value={formData.hospital}
                  onChange={e => setFormData({ ...formData, hospital: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Create Password / Passcode *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 4 characters"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* MANDATORY HUMAN VERIFICATION SECTION */}
            <div className="p-4 bg-slate-50 border-2 border-dashed border-teal-300/80 rounded-2xl space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Mandatory Human Practitioner Verification</span>
                </div>
                {isHumanVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Human Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                    <Bot className="w-3 h-3 text-amber-600" />
                    Verification Required
                  </span>
                )}
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-700 font-semibold">
                    Security Math Challenge: <span className="px-2.5 py-1 bg-slate-900 text-teal-300 rounded-lg font-mono font-bold text-sm tracking-wider">{captchaNum1} + {captchaNum2} = ?</span>
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    title="Generate new challenge"
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="number"
                  required
                  placeholder="Enter the math sum result"
                  value={userCaptchaAnswer}
                  onChange={e => setUserCaptchaAnswer(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                />

                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isHumanCheckboxChecked}
                    onChange={e => setIsHumanCheckboxChecked(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-600 font-medium leading-tight">
                    I confirm that I am a human medical doctor registering for authorized clinical diagnostic access.
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isHumanVerified}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Create Doctor Account</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default DoctorRegistrationModal;
