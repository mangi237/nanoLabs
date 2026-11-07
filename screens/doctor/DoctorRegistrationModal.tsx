import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  X,
  Phone,
  Check,
  Sparkles,
  ShieldCheck,
  Award,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Bot,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Upload,
  MapPin,
} from 'lucide-react';
import { db, ensureFirebaseAuth, collection, addDoc, getDocs, query, where } from '../../services/firebase';
import { cleanFirestoreData, validatePhoneNumber } from '../../utils/sanitizeData';
import { hashPassword } from '../../utils/passwordHash';

interface DoctorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (doctor: any) => void;
}

const inputCls =
  'w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-base sm:text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none';

export const DoctorRegistrationModal: React.FC<DoctorRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'Internal Medicine',
    hospital: '',
    city: 'Douala',
    phone: '',
    email: '',
    licenseNumber: '',
    password: '',
    confirmPassword: '',
    notes: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any | null>(null);

  const [licensePhoto, setLicensePhoto] = useState<string>('');
  const [diplomaPhoto, setDiplomaPhoto] = useState<string>('');
  const [annualRenewalPhoto, setAnnualRenewalPhoto] = useState<string>('');

  const handleFileUpload = (file: File, setter: (val: string) => void) => {
    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMessage('Photo is too large. Please select an image under 2.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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

  const isCaptchaValid = parseInt(userCaptchaAnswer.trim(), 10) === captchaNum1 + captchaNum2;
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
      setErrorMessage(
        phoneValidation.errorMessage || 'Please enter a valid 9-digit mobile phone number.'
      );
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setErrorMessage('Please create a secure password of at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields match exactly.');
      return;
    }

    if (!isHumanVerified) {
      if (!isCaptchaValid) {
        setErrorMessage(
          `Human verification failed: Please solve the math security challenge (${captchaNum1} + ${captchaNum2}).`
        );
      } else if (!isHumanCheckboxChecked) {
        setErrorMessage('Please check the verification box to confirm you are a human practitioner.');
      }
      return;
    }

    setLoading(true);
    try {
      await ensureFirebaseAuth();

      const existingSnap = await getDocs(
        query(collection(db, 'doctors'), where('phoneDigits', '==', phoneValidation.digits))
      );
      if (!existingSnap.empty) {
        setLoading(false);
        setErrorMessage('A physician account with this phone number already exists. Sign in instead.');
        return;
      }

      const cleanDocName = formData.name.trim().toLowerCase().startsWith('dr')
        ? formData.name.trim()
        : `Dr. ${formData.name.trim()}`;

      const generatedAccessCode = 'DOC-' + Math.floor(1000 + Math.random() * 9000);
      const { salt, hash } = await hashPassword(formData.password.trim());
      const now = new Date().toISOString();

      const doctorPayload = cleanFirestoreData({
        name: cleanDocName,
        specialty: formData.specialty.trim() || 'General Medicine',
        hospital: formData.hospital.trim() || 'Private Practice / Clinic',
        city: formData.city.trim() || 'Douala',
        phone: phoneValidation.formatted || formData.phone.trim(),
        phoneDigits: phoneValidation.digits,
        email:
          formData.email.trim().toLowerCase() ||
          `${phoneValidation.digits}@doctors.nanolabs.cm`,
        licenseNumber: formData.licenseNumber.trim(),
        passwordSalt: salt,
        passwordHash: hash,
        accessCode: generatedAccessCode,
        notes: formData.notes.trim(),
        bio: formData.notes.trim(),
        licensePhoto: licensePhoto || null,
        diplomaPhoto: diplomaPhoto || null,
        annualRenewalPhoto: annualRenewalPhoto || null,
        verificationStatus: licensePhoto ? 'pending_verification' : 'verified',
        status: 'active',
        role: 'doctor',
        roles: ['doctor'],
        verifiedHuman: true,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(collection(db, 'doctors'), doctorPayload);
      const createdRecord = { id: docRef.id, ...doctorPayload };
      window.dispatchEvent(new CustomEvent('nanolabs_doctors_updated'));
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
    <div className="fixed inset-0 z-50 bg-white sm:bg-slate-950/80 sm:backdrop-blur-md flex items-stretch sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[92dvh] sm:max-w-xl rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl border-0 sm:border sm:border-slate-200 flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-2xl border border-teal-200 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {successData ? 'Doctor Account Ready' : 'Doctor & Physician Registration'}
              </h3>
              <p className="text-xs text-slate-500">
                {successData
                  ? 'Encrypted clinical channel & laboratory referral access active'
                  : 'Create your ONMC physician profile in Firestore'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto overscroll-contain">
          {successData ? (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Doctor Account Successfully Created
                </h3>
                <p className="text-xs text-slate-500">
                  Your practice profile is now live across the nanoLabs clinical network.
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
                  <span className="text-slate-700 font-medium">Phone or ONMC + Password</span>
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 text-left flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  Sign in on the Doctor tab using <strong>{successData.phone}</strong> and your chosen password.
                </span>
              </div>

              <button
                type="button"
                onClick={handleProceedToLogin}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Go to Doctor Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form id="doctor-reg-form" onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Doctor Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jean-Paul Mbarga"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number (Sign-in ID) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 671234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`${inputCls} pl-9 font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medical License / ONMC Reg *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ONMC-CMR-88491"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className={`${inputCls} font-mono`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specialty</label>
                  <select
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className={inputCls}
                  >
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Gynecology & Obstetrics">Gynecology & Obstetrics</option>
                    <option value="General Practice">General Practice</option>
                    <option value="Clinical Biology">Clinical Biology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Nephrology">Nephrology</option>
                    <option value="Infectious Disease">Infectious Disease</option>
                    <option value="Surgery">General Surgery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hospital / Clinic / Cabinet
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Clinique Médicale"
                    value={formData.hospital}
                    onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Douala, Yaoundé, Bafoussam…"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`${inputCls} pl-9 pr-9`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>
              </div>

              {/* Credential Verification Photo Uploads */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Credential Photos (Optional)
                    </span>
                  </div>
                  <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md font-bold">
                    ONMC Verification
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      title: '1. ONMC License',
                      val: licensePhoto,
                      set: setLicensePhoto,
                    },
                    {
                      title: '2. Medical Diploma',
                      val: diplomaPhoto,
                      set: setDiplomaPhoto,
                    },
                    {
                      title: '3. Renewal Card',
                      val: annualRenewalPhoto,
                      set: setAnnualRenewalPhoto,
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="p-3 bg-white border border-slate-200 rounded-xl space-y-2"
                    >
                      <span className="block text-[10px] font-bold text-slate-700">
                        {item.title}
                      </span>
                      {item.val ? (
                        <div className="space-y-1.5">
                          <img
                            src={item.val}
                            alt={item.title}
                            className="w-full h-16 object-cover rounded-lg border border-teal-300"
                          />
                          <button
                            type="button"
                            onClick={() => item.set('')}
                            className="text-[10px] text-rose-600 font-bold hover:underline block"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl cursor-pointer bg-slate-50/50 transition-all">
                          <Upload className="w-4 h-4 text-slate-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-600">Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(e.target.files[0], item.set);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Human Verification */}
              <div className="p-4 bg-slate-50 border-2 border-dashed border-teal-300/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Practitioner Verification</span>
                  </div>
                  {isHumanVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">
                      <Bot className="w-3 h-3 text-amber-600" />
                      Required
                    </span>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-700 font-semibold">
                      Security Sum:{' '}
                      <span className="px-2.5 py-1 bg-slate-900 text-teal-300 rounded-lg font-mono font-bold text-sm tracking-wider">
                        {captchaNum1} + {captchaNum2} = ?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      title="New challenge"
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="number"
                    required
                    placeholder="Enter sum result"
                    value={userCaptchaAnswer}
                    onChange={(e) => setUserCaptchaAnswer(e.target.value)}
                    className={`${inputCls} bg-slate-50 font-mono`}
                  />

                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isHumanCheckboxChecked}
                      onChange={(e) => setIsHumanCheckboxChecked(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-600 font-medium leading-tight">
                      I confirm that I am an authorized medical practitioner registering on nanoLabs.
                    </span>
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Sticky Safe-Area Footer */}
        {!successData && (
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="doctor-reg-form"
              disabled={loading || !isHumanVerified}
              className="flex-1 sm:flex-none px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Doctor Account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorRegistrationModal;
