import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { validatePhoneNumber } from '../../utils/sanitizeData';
interface Props { isOpen: boolean; onClose: () => void; onSuccess?: (patient: any) => void; defaultLabId?: string; defaultLabName?: string; }
export const PatientRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', alias: '', phone: '', email: '', dateOfBirth: '', gender: 'Female', city: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  if (!isOpen) return null;
  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    const phone = validatePhoneNumber(form.phone);
    if (!phone.isValid) return setError(phone.errorMessage ?? 'Enter a valid Cameroon phone number.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setSaving(true);
    try { const { confirm, ...data } = form; const result = await authService.registerPatient('', { ...data, alias: data.alias.replace(/^@/, '').trim().toLowerCase(), phone: phone.formatted }); onSuccess?.(result.patient); onClose(); }
    catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-labelledby="patient-registration-title" className="bg-white rounded-2xl w-full max-w-lg max-h-[95dvh] overflow-auto p-6 space-y-5"><div className="flex justify-between gap-3"><h2 id="patient-registration-title" className="text-2xl font-bold">Create patient account</h2><button onClick={onClose} disabled={saving} aria-label="Close registration">Close</button></div><p>Your account lets you request tests and view released results. Identity verification is a separate provider check.</p>
    {error && <p role="alert" className="bg-red-50 text-red-800 p-3 border rounded-xl">{error}</p>}
    <form onSubmit={submit} className="space-y-3">{([
      ['name', 'Full name', 'text'], ['alias', 'Unique @alias', 'text'], ['phone', 'Mobile phone', 'tel'], ['email', 'Email (optional)', 'email'], ['dateOfBirth', 'Date of birth', 'date'], ['city', 'City (optional)', 'text'], ['password', 'Password (at least 12 characters)', 'password'], ['confirm', 'Confirm password', 'password']
    ] as const).map(([key, title, type]) => <label key={key} className="block text-sm font-semibold">{title}<input type={type} value={form[key]} onChange={event => set(key, event.target.value)} required={!['email', 'city'].includes(key)} minLength={key === 'password' ? 12 : key === 'alias' ? 3 : undefined} maxLength={key === 'alias' ? 40 : 128} max={key === 'dateOfBirth' ? new Date().toISOString().slice(0, 10) : undefined} autoComplete={key === 'password' || key === 'confirm' ? 'new-password' : undefined} className="mt-1 block w-full border rounded-xl p-3" /></label>)}
      <label className="block text-sm font-semibold">Sex<select value={form.gender} onChange={event => set('gender', event.target.value)} className="block w-full border rounded-xl p-3"><option>Female</option><option>Male</option><option>Other</option></select></label><button disabled={saving} className="bg-teal-800 text-white rounded-xl p-4 w-full disabled:opacity-40">{saving ? 'Creating account…' : 'Create account'}</button>
    </form>
  </section></div>;
};
export default PatientRegistrationModal;
