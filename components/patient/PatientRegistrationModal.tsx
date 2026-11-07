import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  AtSign,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { db, ensureFirebaseAuth, addDoc, collection, getDocs, query, where } from '../../services/firebase';
import { cleanFirestoreData, validatePhoneNumber } from '../../utils/sanitizeData';
import { hashPassword } from '../../utils/passwordHash';
import { formatPatientAlias } from '../../services/doctorPatientFirestoreService';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: any) => void;
  defaultLabId?: string;
  defaultLabName?: string;
}

const field =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition';
const label = 'block text-sm font-semibold text-slate-700 mb-1.5';

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultLabId = '',
  defaultLabName = '',
}) => {
  const { setUser, setLab } = useAuth();
  const [form, setForm] = useState({
    name: '',
    alias: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: 'Female',
    city: 'Douala',
    selectedLabId: defaultLabId,
    password: '',
    confirm: '',
  });
  const [aliasTouched, setAliasTouched] = useState(false);
  const [labs, setLabs] = useState<Array<{ id: string; name: string; city?: string }>>([]);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const loadRealLabs = async () => {
      try {
        await ensureFirebaseAuth();
        const snap = await getDocs(collection(db, 'labs'));
        if (!active) return;
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((l) => l.status !== 'suspended' && l.status !== 'rejected' && Boolean(l.name))
          .map((l) => ({
            id: l.id,
            name: String(l.name),
            city: String(l.city || l.location || ''),
          }));
        setLabs(list);
      } catch {
        if (active) setLabs([]);
      }
    };
    loadRealLabs();
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      name: val,
      alias: aliasTouched ? prev.alias : formatPatientAlias('', val),
    }));
  };

  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAliasTouched(true);
    const cleaned = e.target.value
      .replace(/^@+/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_.\-]/g, '');
    setForm((prev) => ({ ...prev, alias: cleaned }));
  };

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    if (name.length < 2) return setError('Please enter your full name.');

    const cleanAlias = formatPatientAlias(form.alias, name);
    if (cleanAlias.length < 3) {
      return setError('Choose a unique @alias of at least 3 characters so your doctor can find you.');
    }

    const pv = validatePhoneNumber(form.phone);
    if (!pv.isValid) {
      return setError(pv.errorMessage || 'Enter a valid 9-digit Cameroon phone number.');
    }

    if (!form.dateOfBirth) return setError('Please select your date of birth.');
    if (form.password.length < 6) return setError('Choose a password with at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setSaving(true);
    try {
      await ensureFirebaseAuth();

      const existingPhone = await getDocs(
        query(collection(db, 'patients'), where('phoneDigits', '==', pv.digits))
      );
      if (!existingPhone.empty) {
        setSaving(false);
        return setError('An account with this phone number already exists. Sign in instead.');
      }

      const existingAlias = await getDocs(
        query(collection(db, 'patients'), where('aliasLower', '==', cleanAlias))
      );
      if (!existingAlias.empty) {
        setSaving(false);
        return setError(`The alias @${cleanAlias} is already taken. Please pick another alias.`);
      }

      const { salt, hash } = await hashPassword(form.password);
      const pid = 'PAT-' + Math.floor(100000 + Math.random() * 900000);
      const now = new Date().toISOString();

      const chosenLab = labs.find((l) => l.id === form.selectedLabId);
      const resolvedLabId = chosenLab?.id || defaultLabId || '';
      const resolvedLabName = chosenLab?.name || (resolvedLabId ? defaultLabName : '');

      const record = cleanFirestoreData({
        patientId: pid,
        name,
        alias: cleanAlias,
        aliasLower: cleanAlias.toLowerCase(),
        nickname: cleanAlias,
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
        labId: resolvedLabId,
        labName: resolvedLabName,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(collection(db, 'patients'), record);

      if (resolvedLabId) {
        try {
          await addDoc(
            collection(db, 'labs', resolvedLabId, 'patients'),
            cleanFirestoreData({
              ...record,
              globalPatientDocId: docRef.id,
            })
          );
        } catch {}
      }

      const sessionUser = {
        id: docRef.id,
        patientId: pid,
        name,
        alias: cleanAlias,
        nickname: cleanAlias,
        phone: pv.formatted,
        phoneDigits: pv.digits,
        email: record.email,
        dateOfBirth: record.dateOfBirth,
        gender: record.gender,
        city: record.city,
        role: 'patient',
        roles: ['patient'],
        labId: resolvedLabId,
        labName: resolvedLabName,
      };

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
    if (created.labId && created.labName) {
      setLab({ id: created.labId, name: created.labName });
    }
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
    <div className="fixed inset-0 z-50 bg-white sm:bg-slate-900/60 sm:backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[92dvh] sm:max-w-lg rounded-none sm:rounded-3xl shadow-none sm:shadow-xl border-0 sm:border sm:border-slate-200/80 flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {created ? 'Account ready' : 'Create patient account'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {created
                ? 'Save your Patient ID and @alias — sign in anytime with either.'
                : 'Book tests at real laboratories, connect with doctors, and view signed reports.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto overscroll-contain">
          {created ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Welcome, {created.name}</p>
                  <p className="text-emerald-800/80">
                    Your encrypted patient record is live in Firestore.
                  </p>
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
                  <span className="text-slate-500">Doctor Search Alias</span>
                  <span className="font-mono font-bold text-teal-800">@{created.alias}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium text-slate-900">{created.phone}</span>
                </div>
                {created.labName && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-slate-500">Preferred Lab</span>
                    <span className="font-medium text-slate-900">{created.labName}</span>
                  </div>
                )}
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
            <form id="patient-reg-form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Full legal name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={handleNameChange}
                      placeholder="Amina Njoya"
                      className={`${field} pl-11`}
                    />
                  </div>
                </div>

                <div>
                  <label className={label}>
                    Unique @alias <span className="text-xs font-normal text-teal-700">(for doctors)</span>
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-teal-600 absolute left-4 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={form.alias}
                      onChange={handleAliasChange}
                      placeholder="amina_njoya"
                      className={`${field} pl-11 font-mono`}
                    />
                  </div>
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

              {labs.length > 0 && (
                <div>
                  <label className={label}>
                    Preferred Laboratory <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                    <select
                      value={form.selectedLabId}
                      onChange={set('selectedLabId')}
                      className={`${field} pl-11`}
                    >
                      <option value="">Choose when booking a test</option>
                      {labs.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} {l.city ? `(${l.city})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

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
                Share your <strong>@{form.alias || 'alias'}</strong> or Patient ID with your physician so they can connect and send encrypted lab orders directly to your account.
              </p>
            </form>
          )}
        </div>

        {/* Sticky Safe-Area Footer */}
        {!created && (
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-white shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="submit"
              form="patient-reg-form"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRegistrationModal;
