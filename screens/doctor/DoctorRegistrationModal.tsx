import React, { useState } from 'react';
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
  FileText
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
    accessCode: 'DOC-' + Math.floor(1000 + Math.random() * 9000),
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen) return null;

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
      setErrorMessage('Please provide your direct phone number.');
      return;
    }

    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setErrorMessage(phoneValidation.errorMessage || 'Please enter a valid Cameroon 9-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const cleanDocName = formData.name.trim().toLowerCase().startsWith('dr')
        ? formData.name.trim()
        : `Dr. ${formData.name.trim()}`;

      const doctorPayload = {
        name: cleanDocName,
        specialty: formData.specialty.trim() || 'General Medicine',
        hospital: formData.hospital.trim() || 'Private Practice / Clinic',
        phone: phoneValidation.formatted || formData.phone.trim(),
        email: formData.email.trim().toLowerCase() || `${formData.accessCode.toLowerCase()}@doctors.nanolabs.cm`,
        licenseNumber: formData.licenseNumber.trim(),
        accessCode: formData.accessCode.trim(),
        notes: formData.notes.trim(),
        status: 'active',
        role: 'doctor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const cleaned = cleanFirestoreData(doctorPayload);
      // Save in global doctors collection
      const docRef = await addDoc(collection(db, 'doctors'), cleaned);
      const createdRecord = { id: docRef.id, ...cleaned };

      setSuccessData(createdRecord);
      if (onSuccess) {
        onSuccess(createdRecord);
      }
    } catch (err: any) {
      console.error('Error registering doctor:', err);
      setErrorMessage(err.message || 'Could not register doctor profile. Please retry.');
    } finally {
      setLoading(false);
    }
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
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Physician Registration Confirmed</h3>
              <p className="text-xs text-slate-500">
                You are now officially listed in the nanoLabs Accredited Doctor Network across all diagnostic facilities.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor Name:</span>
                <strong className="text-slate-900">{successData.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">License / ONMC:</span>
                <strong className="font-mono text-slate-900">{successData.licenseNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialty:</span>
                <strong className="text-slate-900">{successData.specialty}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Practice / Hospital:</span>
                <strong className="text-slate-900">{successData.hospital}</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-teal-700 font-bold">Portal Access Passcode:</span>
                <strong className="font-mono text-teal-700 text-sm">{successData.accessCode}</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Use your Access Passcode <strong>{successData.accessCode}</strong> at the login screen anytime to access your live Earnings and Diagnostic Results Inbox.
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl border border-teal-200">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Accredited Physician Self-Registration</h3>
                <p className="text-xs text-slate-500">Join the nanoLabs Medical Network to track patient test results & earn 20% commission</p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jean-Paul Mbarga / Dr. Ngozi Emmanuel"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medical License / ONMC Reg *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ONMC-CMR-88491"
                  value={formData.licenseNumber}
                  onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialty</label>
                <select
                  value={formData.specialty}
                  onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
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

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Hospital / Clinic / Cabinet</label>
                <input
                  type="text"
                  placeholder="e.g. Douala General Hospital / Polyclinique Sainte-Anne"
                  value={formData.hospital}
                  onChange={e => setFormData({ ...formData, hospital: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Direct) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 671002233"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Professional Email</label>
                <input
                  type="email"
                  placeholder="doctor@hospital.cm"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Portal Access Passcode *</label>
                <input
                  type="text"
                  required
                  value={formData.accessCode}
                  onChange={e => setFormData({ ...formData, accessCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs font-mono font-bold text-teal-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  You will use this passcode to log into your Doctor Portal to view referred patient results.
                </span>
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
                disabled={loading}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Register & Generate Credentials</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default DoctorRegistrationModal;
