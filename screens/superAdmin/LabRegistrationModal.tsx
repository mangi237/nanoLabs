import React, { useState } from 'react';
import { X, Building2, Phone, Mail, MapPin, Award, User, Loader2, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { db, addDoc, collection } from '../../services/firebase';
import { cleanFirestoreData, validatePhoneNumber } from '../../utils/sanitizeData';

interface LabRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLabCreated?: () => void;
}

const field =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition';
const label = 'block text-sm font-semibold text-slate-700 mb-1.5';

const PLANS = [
  { id: 'clinic', name: 'Clinic / Solo', price: '25,000 FCFA / month', detail: 'Up to 1,000 tests a month' },
  { id: 'district', name: 'District Hospital', price: '45,000 FCFA / month', detail: 'Up to 1,400 tests a month' },
  { id: 'regional', name: 'Regional Reference', price: '75,000 FCFA / month', detail: '2,000+ tests a month' },
  { id: 'universal', name: 'Universal', price: '15,000 FCFA / month', detail: 'Unlimited tests, flat fee' },
];

const makeAccessCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const LabRegistrationModal: React.FC<LabRegistrationModalProps> = ({ isOpen, onClose, onLabCreated }) => {
  const [form, setForm] = useState({
    labName: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
    managerName: '',
    managerEmail: '',
    planId: 'clinic',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.labName.trim()) return setError('Please enter your laboratory name.');
    if (!form.city.trim()) return setError('Please enter the city where the lab is located.');
    const phone = validatePhoneNumber(form.phone);
    if (!phone.isValid) return setError(phone.errorMessage || 'Please enter a valid phone number.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Please enter a valid lab email address.');
    if (!form.managerName.trim()) return setError('Please enter the manager’s name.');
    if (!/^\S+@\S+\.\S+$/.test(form.managerEmail.trim())) return setError('Please enter the manager’s email address.');
    if (!acceptedTerms) return setError('Please accept the terms to register your laboratory.');

    setSaving(true);
    try {
      const code = makeAccessCode();
      const plan = PLANS.find((p) => p.id === form.planId) ?? PLANS[0];

      const labRef = await addDoc(
        collection(db, 'labs'),
        cleanFirestoreData({
          name: form.labName.trim(),
          location: form.city.trim(),
          address: form.address.trim(),
          phone: phone.formatted || form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          licenseNumber: form.licenseNumber.trim(),
          plan: plan.id,
          planName: plan.name,
          status: 'pending_approval',
          createdAt: new Date().toISOString(),
          termsAcceptedAt: new Date().toISOString(),
        })
      );

      await addDoc(
        collection(db, 'labs', labRef.id, 'staff'),
        cleanFirestoreData({
          name: form.managerName.trim(),
          email: form.managerEmail.trim().toLowerCase(),
          accessCode: code,
          role: 'admin',
          roles: ['admin', 'receptionist', 'cashier', 'analyzer', 'lab_tech'],
          labId: labRef.id,
          mustChangePassword: true,
          status: 'active',
          createdAt: new Date().toISOString(),
        })
      );

      setCreatedCode(code);
    } catch (err) {
      console.error(err);
      setError('We could not register your laboratory. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-[28px] shadow-2xl my-auto">
        <div className="flex items-start justify-between p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Register your laboratory</h2>
              <p className="text-sm text-slate-500">Takes about 5 minutes. We approve new labs within 24 hours.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdCode ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black">Thanks, {form.labName}!</h3>
            <p className="text-sm text-slate-600">
              Your laboratory is pending approval. Keep this staff access code somewhere safe. You will need it to sign in once approved.
            </p>
            <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="font-mono text-xl font-black tracking-widest text-teal-700">{createdCode}</span>
              <button onClick={copyCode} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 cursor-pointer">
                <Copy className="w-4 h-4" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => { onLabCreated?.(); onClose(); }}
              className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">About your laboratory</h3>
              <div>
                <label className={label}>Laboratory name</label>
                <input className={field} value={form.labName} onChange={(e) => update('labName', e.target.value)} placeholder="e.g. Hope Diagnostic Centre" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input className={`${field} pl-11`} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="e.g. Douala" />
                  </div>
                </div>
                <div>
                  <label className={label}>Street address</label>
                  <input className={field} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Street and landmark" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input type="tel" className={`${field} pl-11`} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="6 71 22 33 44" />
                  </div>
                </div>
                <div>
                  <label className={label}>Lab email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input type="email" className={`${field} pl-11`} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="contact@lab.com" />
                  </div>
                </div>
              </div>
              <div>
                <label className={label}>Licence or accreditation number (optional)</label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input className={`${field} pl-11`} value={form.licenseNumber} onChange={(e) => update('licenseNumber', e.target.value)} placeholder="From your Ministry of Health approval" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Lab manager</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Manager name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input className={`${field} pl-11`} value={form.managerName} onChange={(e) => update('managerName', e.target.value)} placeholder="Full name" />
                  </div>
                </div>
                <div>
                  <label className={label}>Manager email</label>
                  <input type="email" className={field} value={form.managerEmail} onChange={(e) => update('managerEmail', e.target.value)} placeholder="manager@lab.com" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Choose a plan</h3>
              <p className="text-xs text-slate-500">Start with a 30-day free trial. You only pay after the trial.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {PLANS.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => update('planId', p.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer ${
                      form.planId === p.id ? 'border-teal-600 bg-teal-50/60' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm">{p.name}</div>
                    <div className="text-teal-700 font-semibold text-sm mt-0.5">{p.price}</div>
                    <div className="text-xs text-slate-500 mt-1">{p.detail}</div>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-4 h-4 mt-0.5 accent-teal-600" />
              <span>I confirm I am authorised to register this laboratory and I agree to the terms of service.</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register laboratory'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LabRegistrationModal;