import React, { useState } from 'react';
import {
  X, User, Phone, Mail, Lock, Eye, EyeOff, Loader2,
  CheckCircle2, AlertCircle, MapPin, Shield
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { db, addDoc, collection } from '../../services/firebase';
import { cleanFirestoreData } from '../../utils/sanitizeData';
import { hashPassword } from '../../utils/passwordHash';
import { CAMEROON_INSURANCE_COMPANIES } from '../../data/cameroonInsurances';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: any) => void;
}

const field =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition';
const label = 'block text-sm font-semibold text-slate-700 mb-1.5';

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { setUser } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirm: '',
    hasInsurance: false,
    insuranceProvider: '',
    insurancePolicyNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<any | null>(null);

  if (!isOpen) return null;

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    const phone = form.phone.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    const email = form.email.trim().toLowerCase();

    if (!name) return setError('Please enter your full name.');
    if (phoneDigits.length < 8) return setError('Please enter a valid phone number.');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email address, or leave it empty.');
    if (form.password.length < 8) return setError('Your password needs at least 8 characters.');
    if (form.password !== form.confirm) return setError('The two passwords do not match.');
    if (form.hasInsurance && !form.insuranceProvider) return setError('Choose your insurance company.');

    setSaving(true);
    try {
      const { salt, hash } = await hashPassword(form.password);
      const now = new Date().toISOString();

      const record = cleanFirestoreData({
        role: 'patient',
        name,
        email,
        phone,
        city: form.city.trim(),
        hasInsurance: form.hasInsurance,
        insuranceProvider: form.hasInsurance ? form.insuranceProvider : '',
        insurancePolicyNumber: form.hasInsurance ? form.insurancePolicyNumber.trim() : '',
        passwordSalt: salt,
        passwordHash: hash,
        termsAcceptedAt: now,
        createdAt: now,
        updatedAt: now
      });

      const docRef = await addDoc(collection(db, 'patients'), record);

      // Only non-secret details are kept in memory
      setCreated({
        id: docRef.id,
        name,
        email,
        phone,
        city: form.city.trim(),
        hasInsurance: form.hasInsurance,
        insuranceProvider: form.hasInsurance ? form.insuranceProvider : '',
        insurancePolicyNumber: form.hasInsurance ? form.insurancePolicyNumber.trim() : '',
        role: 'patient',
        roles: ['patient']
      });
    } catch (err: any) {
      console.error('Patient registration error:', err);
      setError(
        'We could not create your account: ' +
          (err?.message || 'unknown error') +
          '. Check your connection and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEnter = () => {
    if (!created) return;
    setUser(created);
    onSuccess?.(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-[28px] shadow-2xl my-auto">
        <div className="flex items-start justify-between p-6 pb-2">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-500 mt-1">It takes about a minute.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {created ? (
          <div className="p-6 pt-4 space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black">Your account is ready</h3>
            <p className="text-sm text-slate-600">
              Sign in any time with your phone number or email and the password you chose.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-sm space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Name</span><strong>{created.name}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Phone</span><strong>{created.phone}</strong></div>
              {created.email && (
                <div className="flex justify-between"><span className="text-slate-500">Email</span><strong>{created.email}</strong></div>
              )}
            </div>
            <button
              type="button"
              onClick={handleEnter}
              className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
            >
              Continue to my account
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className={label}>Full name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input className={`${field} pl-11`} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Sandrine Ndongo" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Phone number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input type="tel" className={`${field} pl-11`} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="6 71 22 33 44" />
                </div>
              </div>
              <div>
                <label className={label}>Email (optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input type="email" className={`${field} pl-11`} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@email.com" />
                </div>
              </div>
            </div>

            <div>
              <label className={label}>Where do you live?</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input className={`${field} pl-11`} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="e.g. Douala - Akwa" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`${field} pl-11 pr-11`}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={label}>Confirm password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={field}
                  value={form.confirm}
                  onChange={(e) => update('confirm', e.target.value)}
                  placeholder="Type it again"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Shield className="w-4 h-4 text-teal-600" />
                  I have health insurance
                </span>
                <input
                  type="checkbox"
                  checked={form.hasInsurance}
                  onChange={(e) => update('hasInsurance', e.target.checked)}
                  className="w-5 h-5 accent-teal-600 cursor-pointer"
                />
              </label>

              {form.hasInsurance && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <select className={field} value={form.insuranceProvider} onChange={(e) => update('insuranceProvider', e.target.value)}>
                    <option value="">Choose your insurer</option>
                    {CAMEROON_INSURANCE_COMPANIES.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                  <input
                    className={field}
                    value={form.insurancePolicyNumber}
                    onChange={(e) => update('insurancePolicyNumber', e.target.value)}
                    placeholder="Policy or member number"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create my account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PatientRegistrationModal;