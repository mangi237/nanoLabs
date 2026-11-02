import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { db, addDoc, collection, getDocs, query, where } from '../../services/firebase';
import { cleanFirestoreData, validatePhoneNumber } from '../../utils/sanitizeData';
import { hashPassword } from '../../utils/passwordHash';
import { doctorChatService } from '../../services/doctorChatService';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: any) => void;
  defaultLabId?: string;
  defaultLabName?: string;
}

const field =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition';
const label = 'block text-sm font-semibold text-slate-700 mb-1.5';

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultLabId = 'lab-1',
  defaultLabName = 'nanoLabs Diagnostic Network',
}) => {
  const { setUser, setLab } = useAuth();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: 'Female',
    city: 'Douala',
    password: '',
    confirm: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    if (name.length < 2) return setError('Please enter your full name.');

    const pv = validatePhoneNumber(form.phone);
    if (!pv.isValid) return setError(pv.errorMessage || 'Enter a valid 9-digit Cameroon phone number.');

    if (!form.dateOfBirth) return setError('Please select your date of birth.');
    if (form.password.length < 6) return setError('Choose a password with at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setSaving(true);
    try {
      const existing = await getDocs(
        query(collection(db, 'patients'), where('phoneDigits', '==', pv.digits))
      );
      if (!existing.empty) {
        setSaving(false);
        return setError('An account with this phone number already exists. Sign in instead.');
      }

      const { salt, hash } = await hashPassword(form.password);
      const pid = 'PAT-' + Math.floor(100000 + Math.random() * 900000);
      const now = new Date().toISOString();

      const record = cleanFirestoreData({
        patientId: pid,
        name,
        phone: pv.formatted,
        phoneDigits: pv.digits,
        email: form.email.trim().toLowerCase(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        city: form.city.trim() || 'Douala',
        passwordSalt: salt,
        passwordHash: hash,
        role: 'patient',
        roles: ['patient'],
        labId: defaultLabId,
        labName: defaultLabName,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(collection(db, 'patients'), record);

      // Also sync patient demographics (without plaintext password) to lab patients subcollection for LIMS lookup
      try {
        await addDoc(
          collection(db, 'labs', defaultLabId, 'patients'),
          cleanFirestoreData({
            ...record,
            globalPatientDocId: docRef.id,
          })
        );
      } catch {}

      const sessionUser = {
        id: docRef.id,
        patientId: pid,
        name,
        phone: pv.formatted,
        phoneDigits: pv.digits,
        email: record.email,
        dateOfBirth: record.dateOfBirth,
        gender: record.gender,
        city: record.city,
        role: 'patient',
        roles: ['patient'],
        labId: defaultLabId,
        labName: defaultLabName,
      };

      try {
        doctorChatService.registerOrUpdateProfile({
          id: docRef.id,
          role: 'patient',
          legalName: name,
          nickname: name.split(' ')[0].toLowerCase(),
          isAnonymous: false,
          phone: pv.formatted,
          city: record.city,
        });
      } catch {}

      try {
        localStorage.setItem(
          'last_registered_patient',
          JSON.stringify({
            ...sessionUser,
            passwordSalt: salt,
            passwordHash: hash,
          })
        );
      } catch {}

      setCreated(sessionUser);
    } catch (err: any) {
      setError(err?.message || 'Could not create your account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const finish = () => {
    if (!created) return;
    setUser(created);
    setLab({ id: defaultLabId, name: defaultLabName });
    onSuccess?.(created);
    onClose();
  };

  const copyPid = () => {
    if (!created) return;
    navigator.clipboard.writeText(created.patientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-200/80 my-auto max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {created ? 'Account ready' : 'Create patient account'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {created
                ? 'Save your Patient ID — you can sign in with it or your phone number.'
                : 'Book tests, track samples, and receive your lab reports.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {created ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Welcome, {created.name}</p>
                  <p className="text-emerald-800/80">Your health record has been created.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-sm">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-500">Patient ID</span>
                  <button
                    type="button"
                    onClick={copyPid}
                    className="inline-flex items-center gap-2 font-mono font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                  >
                    {created.patientId}
                    <Copy className="w-4 h-4" />
                    {copied && <span className="text-xs font-sans text-emerald-600">Copied</span>}
                  </button>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium text-slate-900">{created.phone}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-500">Password</span>
                  <span className="text-slate-600">The password you just chose</span>
                </div>
              </div>

              <button
                type="button"
                onClick={finish}
                className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-2xl text-sm transition cursor-pointer"
              >
                Continue to my dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className={label}>Full name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Amina Njoya"
                    className={`${field} pl-11`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Mobile phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="670 00 00 00"
                      className={`${field} pl-11`}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>
                    Email <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="you@example.com"
                      className={`${field} pl-11`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={label}>Date of birth</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={form.dateOfBirth}
                      onChange={set('dateOfBirth')}
                      className={`${field} pl-11`}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Sex</label>
                  <select value={form.gender} onChange={set('gender')} className={field}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={label}>City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={form.city}
                      onChange={set('city')}
                      placeholder="Douala"
                      className={`${field} pl-11`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className={label}>Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="At least 6 characters"
                      className={`${field} pl-11 pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={label}>Confirm password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.confirm}
                    onChange={set('confirm')}
                    placeholder="Repeat password"
                    className={field}
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Insurance details and profile photo can be added anytime from your profile.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientRegistrationModal;
