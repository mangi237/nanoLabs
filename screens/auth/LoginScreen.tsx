import React, { lazy, Suspense, useState } from 'react';
import { useAuth } from '../../context/authContext';
const PatientRegistrationModal = lazy(() => import('../../components/patient/PatientRegistrationModal'));
interface LoginScreenProps { onLoginSuccess?: (user: any) => void; onNavigateRegister?: () => void; onNavigateSelectLab?: () => void; onNavigateWebsite?: () => void; initialPortal?: 'lab' | 'patient' | 'doctor'; }
export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onNavigateWebsite, onNavigateRegister, initialPortal = 'patient' }) => {
  const { login, loginPatient, loginDoctor } = useAuth();
  const [portal, setPortal] = useState<'patient' | 'doctor' | 'lab'>(initialPortal);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await (portal === 'lab' ? login(password, identifier.trim()) : portal === 'patient' ? loginPatient(identifier.trim(), password) : loginDoctor(identifier.trim(), password));
      if (!result.success) throw new Error(result.error ?? 'Sign-in failed.');
      onLoginSuccess?.(result.user);
    } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-slate-50 text-slate-900 grid lg:grid-cols-2"><section className="bg-teal-950 text-white p-8 lg:p-16 flex flex-col justify-center gap-6"><p className="text-3xl font-bold">nano<span className="text-teal-300">Labs</span></p><h1 className="text-3xl lg:text-4xl font-bold">Your laboratory journey, one step at a time.</h1><p className="text-teal-100 text-lg">Request tests, review your invoice, follow sample collection, and receive results after biologist approval.</p><ol className="space-y-3 text-teal-100"><li>1. Choose tests and a laboratory.</li><li>2. Review the exact quote before sending.</li><li>3. Follow laboratory acceptance and payment confirmation.</li><li>4. View and share your released report.</li></ol></section><section className="p-6 lg:p-14 flex items-center"><div className="w-full max-w-md mx-auto space-y-6"><h2 className="text-2xl font-bold">Sign in</h2><div className="flex flex-wrap gap-2" aria-label="Sign-in portal">{(['patient', 'doctor', 'lab'] as const).map(value => <button key={value} type="button" aria-pressed={portal === value} className={`rounded-xl border px-4 py-3 ${portal === value ? 'bg-teal-800 text-white' : 'bg-white'}`} onClick={() => { setPortal(value); setError(''); }}>{value === 'patient' ? 'Patient' : value === 'doctor' ? 'Doctor' : 'Laboratory staff'}</button>)}</div><form onSubmit={submit} className="space-y-4">{error && <p role="alert" className="text-red-700 bg-red-50 border rounded-xl p-3">{error}</p>}<label className="block font-semibold">{portal === 'lab' ? 'Staff email or account ID' : 'Phone number, Patient ID, or @alias'}<input required value={identifier} onChange={event => setIdentifier(event.target.value)} autoComplete="username" className="mt-2 block w-full border rounded-xl p-3 bg-white" /></label><label className="block font-semibold">Password<input required type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" maxLength={128} className="mt-2 block w-full border rounded-xl p-3 bg-white" /></label><label className="block text-sm"><input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} /> Show password</label><button disabled={busy} className="w-full bg-teal-800 text-white rounded-xl p-4 font-semibold disabled:opacity-40">{busy ? 'Signing in…' : 'Continue'}</button></form>{portal === 'patient' ? <button onClick={() => onNavigateRegister ? onNavigateRegister() : setRegister(true)} className="underline text-teal-800">Create a patient account</button> : <p className="text-sm text-slate-600">Use the account provisioned by your laboratory administrator. Shared access codes are not accepted.</p>}<button onClick={onNavigateWebsite} className="block mt-4 text-sm underline">Back to website</button></div></section>{register && <Suspense fallback={<p>Loading registration…</p>}><PatientRegistrationModal isOpen onClose={() => setRegister(false)} onSuccess={onLoginSuccess} /></Suspense>}</main>;
};
export default LoginScreen;
