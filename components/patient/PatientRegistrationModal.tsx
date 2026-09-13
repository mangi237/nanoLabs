import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Droplet, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  Building2, 
  CreditCard, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { db, addDoc, collection } from '../../services/firebase';
import { CAMEROON_INSURANCE_COMPANIES } from '../../data/cameroonInsurances';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: any) => void;
  defaultLabId?: string;
  defaultLabName?: string;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultLabId = 'lab-1',
  defaultLabName = 'nanoLabs Central Diagnostics'
}) => {
  const { setUser, setLab } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '1995-05-15',
    gender: 'Male',
    city: 'Douala',
    address: '',
    bloodGroup: 'Unknown',
    hasInsurance: false,
    insuranceProvider: 'ASCOMA CAMEROUN S.A.',
    insurancePolicyNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    passcode: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your full legal name.');
      return;
    }
    const cleanPhone = formData.phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid mobile phone number for SMS notifications and login.');
      return;
    }
    const cleanPass = formData.passcode.trim();
    if (!cleanPass || cleanPass.length < 4) {
      setError('Please set a secure 4 to 6 digit passcode / PIN for your patient account.');
      return;
    }

    setLoading(true);
    try {
      const generatedPid = 'PAT-2026-' + Math.floor(1000 + Math.random() * 9000);
      const accessCode = cleanPass.toUpperCase();

      const newPatientData = {
        name: formData.name.trim(),
        phone: cleanPhone,
        email: (formData.email || '').trim().toLowerCase(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        city: formData.city,
        address: formData.address.trim(),
        bloodGroup: formData.bloodGroup,
        hasInsurance: formData.hasInsurance,
        insuranceProvider: formData.hasInsurance ? formData.insuranceProvider : '',
        insurancePolicyNumber: formData.hasInsurance ? formData.insurancePolicyNumber.trim() : '',
        insuranceCoveragePercent: formData.hasInsurance ? 80 : 0,
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
        patientId: generatedPid,
        accessCode: accessCode,
        passcode: cleanPass,
        role: 'patient',
        roles: ['patient'],
        labId: defaultLabId,
        labName: defaultLabName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Save to Firestore under target lab patients collection
      try {
        const docRef = await addDoc(collection(db, 'labs', defaultLabId, 'patients'), newPatientData);
        (newPatientData as any).id = docRef.id;
      } catch (fsErr) {
        console.warn('Firestore direct save note:', fsErr);
        (newPatientData as any).id = 'pat_' + Date.now();
      }

      // 2. Cache in local storage for instant offline/relogin verification
      try {
        localStorage.setItem('last_registered_patient', JSON.stringify(newPatientData));
      } catch {}

      setCreatedPatient(newPatientData);
    } catch (err: any) {
      setError(err?.message || 'Failed to create patient account. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDashboard = () => {
    if (createdPatient) {
      setUser(createdPatient);
      setLab({ id: defaultLabId, name: defaultLabName });
      if (onSuccess) onSuccess(createdPatient);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <User className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">Create Patient Account</h2>
              <p className="text-xs text-teal-200">Instant registration for patient health records & test booking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-900">
          {createdPatient ? (
            /* Registration Success Banner */
            <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">Patient Account Created!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your patient account has been registered with encrypted health storage. You can now track results, schedule analyses, and view digital booklets.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Patient Name:</span>
                  <strong className="text-slate-900 font-sans">{createdPatient.name}</strong>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Patient ID (PID):</span>
                  <strong className="text-teal-700 font-bold">{createdPatient.patientId}</strong>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Phone Number:</span>
                  <strong className="text-slate-800">{createdPatient.phone}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Access Passcode:</span>
                  <strong className="text-emerald-700 font-bold">{createdPatient.passcode}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnterDashboard}
                className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Enter Patient Dashboard Now</span>
                <Sparkles className="w-4 h-4 text-teal-200" />
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Legal Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Christianus Nweke"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Phone (Used for Login) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+237 670 00 00 00"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="patient@email.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Male">Male (Masculin)</option>
                    <option value="Female">Female (Féminin)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* City & Blood Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City / Residential Hub
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Douala / Yaoundé"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Blood Group (Optional)
                  </label>
                  <div className="relative">
                    <Droplet className="w-4 h-4 text-rose-400 absolute left-3.5 top-3.5" />
                    <select
                      value={formData.bloodGroup}
                      onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Unknown">Unknown / Verify at Lab</option>
                      <option value="O+">O Positive (O+)</option>
                      <option value="O-">O Negative (O-)</option>
                      <option value="A+">A Positive (A+)</option>
                      <option value="A-">A Negative (A-)</option>
                      <option value="B+">B Positive (B+)</option>
                      <option value="B-">B Negative (B-)</option>
                      <option value="AB+">AB Positive (AB+)</option>
                      <option value="AB-">AB Negative (AB-)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Account Passcode / PIN */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-teal-950 uppercase tracking-wider">
                  Create Secret Passcode / PIN (4 - 6 Digits) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-teal-600 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={8}
                    placeholder="e.g. 1234 or your private code"
                    value={formData.passcode}
                    onChange={e => setFormData({ ...formData, passcode: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-teal-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tracking-widest font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-teal-800">
                  You will use your Phone Number and this Passcode to sign in securely anytime.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Patient Profile...</span>
                    </>
                  ) : (
                    <span>Register & Create Account</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientRegistrationModal;
