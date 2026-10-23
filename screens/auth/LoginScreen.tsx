import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/authContext';
import {
  Activity, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2,
  AlertCircle, User, Stethoscope, Building2, HeartPulse, CalendarCheck, ShieldCheck,
  Search, ChevronDown, Check, MapPin
} from 'lucide-react';
import PatientRegistrationModal from '../../components/patient/PatientRegistrationModal';
import DoctorRegistrationModal from '../doctor/DoctorRegistrationModal';
import LabRegistrationModal from '../superAdmin/LabRegistrationModal';

interface LoginScreenProps {
  onLoginSuccess?: (user: any) => void;
  onNavigateWebsite?: () => void;
 
}

const inputClass =
  'w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition';

const initials = (name: string) =>
  (name || 'NL')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login, loginDoctor, loginPatient, getAllLabs } = useAuth();

  const [mode, setMode] = useState<'signin' | 'staff'>('signin');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [labs, setLabs] = useState<any[]>([]);
  const [staffLabId, setStaffLabId] = useState('');
  const [labPickerOpen, setLabPickerOpen] = useState(false);
  const [labSearch, setLabSearch] = useState('');
  const [staffCode, setStaffCode] = useState('');

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showPatientReg, setShowPatientReg] = useState(false);
  const [showDoctorReg, setShowDoctorReg] = useState(false);
  const [showLabReg, setShowLabReg] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = (await getAllLabs()) || [];
        setLabs(list);
        if (list.length > 0) setStaffLabId(list[0].id);
      } catch (e) {
        console.error('Could not load labs:', e);
      }
    })();
  }, []);

  const selectedLab = labs.find((l) => l.id === staffLabId);

  const filteredLabs = useMemo(() => {
    const q = labSearch.trim().toLowerCase();
    if (!q) return labs;
    return labs.filter((l) =>
      [l.name, l.city, l.location, l.address]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    );
  }, [labs, labSearch]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!identifier.trim() || !password) {
      setError('Enter your phone number or email, and your password.');
      return;
    }
    setSubmitting(true);
    try {
      const result =
        role === 'patient'
          ? await loginPatient(identifier.trim(), password)
          : await loginDoctor(identifier.trim(), password);
      if (result?.success && result.user) {
        onLoginSuccess?.(result.user);
      } else {
        setError(result?.error || "We couldn't find an account with those details. Please check and try again.");
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStaffSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!staffLabId || !staffCode.trim()) {
      setError('Choose your laboratory and enter your staff access code.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await login(staffCode.trim(), staffLabId);
      if (result?.success && result.user) {
        onLoginSuccess?.(result.user);
      } else {
        setError(result?.error || 'That access code did not work. Ask your lab administrator.');
      }
    } catch (err) {
      console.error(err);
      setError('Staff sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white sm:bg-gradient-to-br sm:from-teal-50 sm:via-white sm:to-cyan-50 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto min-h-[100dvh] grid lg:grid-cols-2 gap-10 items-center px-0 sm:px-5 py-0 sm:py-10">

        {/* Left: brand story */}
        <div className="hidden lg:block space-y-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight">
              Nano<span className="text-teal-600">Labs</span>
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Your health tests,<br />
              <span className="text-teal-600">made simple.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-md">
              Book lab tests from home, follow your results, and share them with your doctor, all in one place.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { icon: CalendarCheck, text: 'Book a test and a home visit in a few taps' },
              { icon: HeartPulse, text: 'See your results as soon as they are ready' },
              { icon: ShieldCheck, text: 'Your health information stays private' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-700 font-medium">
                <span className="w-9 h-9 rounded-xl bg-white shadow-sm border border-teal-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-teal-600" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: form card */}
        <div className="w-full sm:max-w-md mx-auto min-h-[100dvh] sm:min-h-0 flex flex-col">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black">Nano<span className="text-teal-600">Labs</span></span>
          </div>

          <div className="bg-white sm:rounded-[28px] sm:shadow-2xl sm:shadow-teal-900/10 sm:border sm:border-slate-100 p-6 sm:p-8 flex-1 flex flex-col justify-center min-h-[100dvh] sm:min-h-0">
            {mode === 'signin' ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-black tracking-tight">Welcome back</h2>
                  <p className="text-sm text-slate-500 mt-1">Sign in to continue.</p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl mb-6">
                  {([
                    { key: 'patient', label: 'Patient', icon: User },
                    { key: 'doctor', label: 'Doctor', icon: Stethoscope },
                  ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setRole(key); setError(''); }}
                      className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        role === key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-sm text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone number or email</label>
                    <div className="relative">
                      {identifier.includes('@') ? (
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                      ) : (
                        <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                      )}
                      <input
                        type="text"
                        autoComplete="username"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. 6 71 22 33 44 or you@email.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        className={`${inputClass} pr-11`}
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

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                {notice && <p className="mt-4 text-center text-sm text-teal-700">{notice}</p>}

                <div className="mt-7 pt-6 border-t border-slate-100 space-y-3 text-center">
                  <p className="text-sm text-slate-500">New to nanoLabs?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPatientReg(true)}
                      className="py-3 rounded-2xl border-2 border-teal-600 text-teal-700 font-bold text-sm hover:bg-teal-50 transition cursor-pointer"
                    >
                      Create patient account
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDoctorReg(true)}
                      className="py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
                    >
                      I'm a doctor
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-black tracking-tight">Lab staff sign in</h2>
                  <p className="text-sm text-slate-500 mt-1">Use the access code your lab administrator gave you.</p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-sm text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleStaffSignIn} className="space-y-4">
                  {/* Searchable lab card dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your laboratory</label>

                    <button
                      type="button"
                      onClick={() => setLabPickerOpen((o) => !o)}
                      className="w-full p-3 bg-white border-2 border-teal-600/30 hover:border-teal-600 rounded-2xl flex items-center justify-between gap-3 text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                          {initials(selectedLab?.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {selectedLab?.name || (labs.length === 0 ? 'No laboratories yet' : 'Choose a laboratory')}
                          </div>
                          {selectedLab && (
                            <div className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                              {selectedLab.city || selectedLab.location || selectedLab.address || 'Cameroon'}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${labPickerOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {labPickerOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setLabPickerOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-3xl border border-slate-200 shadow-2xl p-3 space-y-2">
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                            <input
                              type="text"
                              autoFocus
                              value={labSearch}
                              onChange={(e) => setLabSearch(e.target.value)}
                              placeholder="Search by name, city or address"
                              className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
                            />
                          </div>

                          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                            {filteredLabs.length === 0 ? (
                              <div className="py-6 text-center text-sm text-slate-500">
                                No laboratories match "{labSearch}".
                              </div>
                            ) : (
                              filteredLabs.map((l) => {
                                const isSelected = l.id === staffLabId;
                                return (
                                  <button
                                    type="button"
                                    key={l.id}
                                    onClick={() => {
                                      setStaffLabId(l.id);
                                      setLabPickerOpen(false);
                                      setLabSearch('');
                                    }}
                                    className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-teal-50/80 border-teal-500'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                        isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {initials(l.name)}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-sm font-bold text-slate-900 truncate">{l.name}</div>
                                        <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                                          {l.city || l.location || 'Cameroon'}
                                          {l.address && <span className="text-slate-300">•</span>}
                                          {l.address && <span className="truncate">{l.address}</span>}
                                        </div>
                                      </div>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Access code</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                      <input
                        type="text"
                        value={staffCode}
                        onChange={(e) => setStaffCode(e.target.value)}
                        placeholder="Your staff code"
                        className={`${inputClass} font-mono tracking-wider`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Open lab dashboard <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); setLabPickerOpen(false); }}
                  className="mt-5 w-full text-sm font-semibold text-teal-700 hover:underline cursor-pointer"
                >
                  Back to patient and doctor sign in
                </button>
              </>
            )}

            {mode === 'signin' && (
              <div className="mt-6 flex flex-col items-center gap-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setShowLabReg(true)}
                  className="font-semibold text-teal-700 hover:underline cursor-pointer"
                >
                  Run a laboratory? Register your lab
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('staff'); setError(''); }}
                  className="hover:text-slate-800 cursor-pointer"
                >
                  Lab staff? Sign in with your access code
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPatientReg && (
        <PatientRegistrationModal
          isOpen={showPatientReg}
          onClose={() => setShowPatientReg(false)}
          onSuccess={(patient: any) => {
            setShowPatientReg(false);
            onLoginSuccess?.(patient);
          }}
        />
      )}

      {showDoctorReg && (
        <DoctorRegistrationModal
          isOpen={showDoctorReg}
          onClose={() => setShowDoctorReg(false)}
          onSuccess={(doctor: any) => {
            setShowDoctorReg(false);
            setRole('doctor');
            setIdentifier(doctor?.phone || doctor?.email || '');
            setNotice('Your doctor account is ready. Sign in below.');
          }}
        />
      )}

      {showLabReg && (
        <LabRegistrationModal
          isOpen={showLabReg}
          onClose={() => setShowLabReg(false)}
          onLabCreated={() => {
            setShowLabReg(false);
            setNotice('Thanks! Your laboratory is pending approval. We will contact you within 24 hours.');
          }}
        />
      )}
    </div>
  );
};

export default LoginScreen;