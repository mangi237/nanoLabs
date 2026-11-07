import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Search,
  Stethoscope,
  User,
  AlertCircle,
  Check,
  ShieldCheck,
  Sparkles,
  FileCheck2,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import LanguageSelector from '../../components/common/LanguageSelector';
import PatientRegistrationModal from '../../components/patient/PatientRegistrationModal';
import DoctorRegistrationModal from '../doctor/DoctorRegistrationModal';
import LabRegistrationModal from '../superAdmin/LabRegistrationModal';

interface LoginScreenProps {
  onLoginSuccess?: (user: any) => void;
  onNavigateRegister?: () => void;
  onNavigateSelectLab?: () => void;
  onNavigateWebsite?: () => void;
  initialPortal?: 'lab' | 'patient' | 'doctor';
}

type Mode = 'person' | 'staff';
type PersonRole = 'patient' | 'doctor';

const inputCls =
  'w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateWebsite,
  initialPortal = 'patient',
}) => {
  const { login, loginDoctor, loginPatient, getAllLabs, lab: currentLab } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<Mode>(initialPortal === 'lab' ? 'staff' : 'person');
  const [role, setRole] = useState<PersonRole>(initialPortal === 'doctor' ? 'doctor' : 'patient');
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (initialPortal === 'lab') {
      setMode('staff');
    } else if (initialPortal === 'doctor') {
      setMode('person');
      setRole('doctor');
    } else {
      setMode('person');
      setRole('patient');
    }
  }, [initialPortal]);

  // Auto-advance left narrative slides gently
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 4);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  // Person credentials
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Staff credentials
  const [labs, setLabs] = useState<any[]>([]);
  const [labId, setLabId] = useState(currentLab?.id || '');
  const [labOpen, setLabOpen] = useState(false);
  const [labQuery, setLabQuery] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [registerModal, setRegisterModal] = useState<null | 'patient' | 'doctor' | 'lab'>(null);

  const loadLabs = async () => {
    try {
      const list = (await getAllLabs()) || [];
      setLabs(list);
      if (list.length > 0 && !labId) setLabId(list[0].id);
    } catch {
      /* empty list is handled gracefully in UI */
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  const slides = [
    {
      tag: t('slide_mission_tag'),
      title: t('slide_mission_title'),
      subtitle: t('slide_mission_subtitle'),
      desc: t('slide_mission_desc'),
      stats: [
        { value: `${Math.max(labs.length, 12)}+`, label: t('stat_network_facilities') },
        { value: '240+', label: t('stat_diagnostic_tests') },
        { value: '99.9%', label: t('stat_uptime_sla') },
      ],
    },
    {
      tag: t('slide_speed_tag'),
      title: t('slide_speed_title'),
      subtitle: t('slide_speed_subtitle'),
      desc: t('slide_speed_desc'),
      stats: [
        { value: '< 2 hrs', label: t('stat_avg_turnaround') },
        { value: 'Live GPS', label: t('stat_barcode_sync') },
        { value: 'Signed PDF', label: t('stat_digital_booklets') },
      ],
    },
    {
      tag: t('slide_security_tag'),
      title: t('slide_security_title'),
      subtitle: t('slide_security_subtitle'),
      desc: t('slide_security_desc'),
      stats: [
        { value: 'PBKDF2 / AES', label: t('stat_encryption') },
        { value: '7 Desks', label: t('stat_rbac_roles') },
        { value: 'Verified', label: t('stat_compliance') },
      ],
    },
    {
      tag: t('slide_founder_tag'),
      title: t('slide_founder_title'),
      subtitle: t('slide_founder_subtitle'),
      desc: t('slide_founder_desc'),
      stats: [
        { value: 'Cameroon', label: t('stat_founded') },
        { value: 'CEMAC', label: 'Regional Network' },
        { value: '100%', label: t('stat_patient_trust') },
      ],
    },
  ];

  const currentSlide = slides[activeSlide] || slides[0];

  const selectedLab = labs.find((l) => l.id === labId);
  const visibleLabs = labs.filter((l) => {
    const q = labQuery.toLowerCase();
    return (
      String(l.name || '').toLowerCase().includes(q) ||
      String(l.city || '').toLowerCase().includes(q) ||
      String(l.address || '').toLowerCase().includes(q)
    );
  });

  const submitPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      return setError('Enter your phone number (or ID) and password.');
    }
    setBusy(true);
    try {
      const res =
        role === 'patient'
          ? await loginPatient(identifier.trim(), password)
          : await loginDoctor(identifier.trim(), password);
      if (res?.success && res.user) {
        onLoginSuccess?.(res.user);
      } else {
        setError(res?.error || 'Those details did not match an account.');
      }
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedCode = staffCode.trim();
    const isSuperCode = ['SUPER123', 'SUPERADMIN', 'SUPERADMIN2025'].includes(trimmedCode.toUpperCase());
    if (!labId && !isSuperCode) return setError('Choose your laboratory first.');
    if (!trimmedCode) return setError('Enter your staff access code.');
    setBusy(true);
    try {
      const res = await login(trimmedCode, labId || '');
      if (res?.success && res.user) {
        onLoginSuccess?.(res.user);
      } else {
        setError(res?.error || 'Invalid access code for this laboratory.');
      }
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Check your code with your lab administrator.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 grid grid-cols-1 lg:grid-cols-12">
      {/* ===================================================================== */}
      {/* LEFT BRAND & CLINICAL NETWORK SHOWCASE PANEL                          */}
      {/* ===================================================================== */}
      <aside className="lg:col-span-7 bg-gradient-to-br from-[#062220] via-[#0B3532] to-[#0F4D47] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle radial glow accents */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-emerald-400/10 blur-3xl" />

        {/* Top Brand Bar */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onNavigateWebsite}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shadow-sm group-hover:bg-teal-500/30 transition">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-none">
                nano<span className="text-teal-300">Labs</span>
              </span>
              <span className="text-[11px] font-medium text-teal-200/80">
                Diagnostic Operating System &amp; Care Network
              </span>
            </div>
          </button>

          {onNavigateWebsite && (
            <button
              type="button"
              onClick={onNavigateWebsite}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-200 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Website</span>
            </button>
          )}
        </div>

        {/* Center Narrative Copy & Metrics */}
        <div className="relative z-10 my-10 lg:my-auto max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-300">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>{currentSlide.tag}</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-black tracking-tight text-white leading-[1.12]">
              {currentSlide.title}
            </h2>
            <p className="text-base sm:text-lg font-medium text-teal-100/95 leading-relaxed">
              {currentSlide.subtitle}
            </p>
            <p className="text-sm text-teal-100/75 leading-relaxed">
              {currentSlide.desc}
            </p>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {currentSlide.stats.map((stat, idx) => (
              <div key={idx}>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-teal-200/80 font-medium mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Slide Selector Dots */}
          <div className="flex items-center gap-2 pt-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Show highlight ${idx + 1}`}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeSlide ? 'w-8 bg-teal-300' : 'w-2 bg-white/25 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Core Platform Capabilities Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/6 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
                <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Online Invoicing</span>
              </div>
              <p className="text-[11px] text-teal-100/75 leading-snug">
                Request tests online, receive itemized cashier invoices &amp; track every stage live.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/6 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
                <Truck className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Home Sample GPS</span>
              </div>
              <p className="text-[11px] text-teal-100/75 leading-snug">
                Live Google Maps pickup &amp; two-way sample handover for participating labs.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/6 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
                <FileCheck2 className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Signed Lab PDFs</span>
              </div>
              <p className="text-[11px] text-teal-100/75 leading-snug">
                Certified biologist-signed diagnostic reports delivered straight to your profile.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom December Promo & Onboarding Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-100/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong className="text-amber-300 font-bold">December Special Package:</strong> Partner laboratories onboard at{' '}
              <strong className="text-white">15,000 FCFA / month</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRegisterModal('lab')}
            className="text-teal-300 hover:text-white font-bold underline underline-offset-4 self-start sm:self-auto cursor-pointer shrink-0"
          >
            Register a Laboratory &rarr;
          </button>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* RIGHT AUTHENTICATION WORKSPACE                                        */}
      {/* ===================================================================== */}
      <div className="lg:col-span-5 flex flex-col min-h-screen bg-slate-50">
        {/* Top Utility Header */}
        <header className="px-6 py-4 flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight">
              nano<span className="text-teal-700">Labs</span>
            </span>
          </div>
          <LanguageSelector />
        </header>

        {/* Centered Sign-In Form */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {mode === 'person'
                    ? 'Access your results, bookings, or consultations.'
                    : 'Laboratory staff and administrators.'}
                </p>
              </div>

              {/* Primary mode switch */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('person');
                    setError('');
                  }}
                  className={`py-2.5 rounded-xl transition cursor-pointer ${
                    mode === 'person' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patient / Doctor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('staff');
                    setError('');
                  }}
                  className={`py-2.5 rounded-xl transition cursor-pointer ${
                    mode === 'staff' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Laboratory Staff
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {mode === 'person' ? (
                <form onSubmit={submitPerson} className="space-y-4">
                  {/* Role choice */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        { id: 'patient', label: 'I am a patient', Icon: User },
                        { id: 'doctor', label: 'I am a doctor', Icon: Stethoscope },
                      ] as const
                    ).map(({ id, label, Icon }) => {
                      const active = role === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setRole(id);
                            setError('');
                          }}
                          className={`flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border-2 text-sm font-semibold transition cursor-pointer ${
                            active
                              ? 'border-teal-600 bg-teal-50/60 text-teal-900'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? 'text-teal-700' : 'text-slate-400'}`} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {role === 'patient'
                        ? 'Phone number, Patient ID, or @alias'
                        : 'Phone number or ONMC license'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-4 pointer-events-none" />
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={
                          role === 'patient'
                            ? '670 00 00 00, PAT-123456, or @alias'
                            : '699 00 00 00 or ONMC-4829'
                        }
                        className={`${inputCls} pl-11`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-4 pointer-events-none" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        className={`${inputCls} pl-11 pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100">
                    {role === 'patient' ? (
                      <>
                        New here?{' '}
                        <button
                          type="button"
                          onClick={() => setRegisterModal('patient')}
                          className="font-semibold text-teal-700 hover:underline cursor-pointer"
                        >
                          Create a patient account
                        </button>
                      </>
                    ) : (
                      <>
                        Practising physician?{' '}
                        <button
                          type="button"
                          onClick={() => setRegisterModal('doctor')}
                          className="font-semibold text-teal-700 hover:underline cursor-pointer"
                        >
                          Register your practice
                        </button>
                      </>
                    )}
                  </p>
                </form>
              ) : (
                <form onSubmit={submitStaff} className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Laboratory</label>
                    <button
                      type="button"
                      onClick={() => setLabOpen((v) => !v)}
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-teal-700/10 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {selectedLab?.name || (labs.length ? 'Select a laboratory' : 'No laboratories registered yet')}
                          </p>
                          {selectedLab && (
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {selectedLab.city || selectedLab.address || 'Cameroon'}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition ${labOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {labOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setLabOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-white rounded-2xl border border-slate-200 shadow-lg p-2 space-y-2">
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                            <input
                              type="text"
                              autoFocus
                              value={labQuery}
                              onChange={(e) => setLabQuery(e.target.value)}
                              placeholder="Search by name or city…"
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                            {visibleLabs.length === 0 ? (
                              <p className="text-xs text-slate-500 p-3 text-center">No matching laboratories.</p>
                            ) : (
                              visibleLabs.map((l) => (
                                <button
                                  key={l.id}
                                  type="button"
                                  onClick={() => {
                                    setLabId(l.id);
                                    setLabOpen(false);
                                  }}
                                  className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 rounded-xl cursor-pointer"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{l.name}</p>
                                    <p className="text-xs text-slate-500 truncate">
                                      {l.city || l.address || 'Cameroon'}
                                    </p>
                                  </div>
                                  {l.id === labId && <Check className="w-4 h-4 text-teal-700 shrink-0 ml-2" />}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Staff access code</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-4 pointer-events-none" />
                      <input
                        type={showCode ? 'text' : 'password'}
                        required
                        value={staffCode}
                        onChange={(e) => setStaffCode(e.target.value)}
                        placeholder="Issued by your lab administrator"
                        className={`${inputCls} pl-11 pr-11 font-mono`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCode((v) => !v)}
                        aria-label={showCode ? 'Hide code' : 'Show code'}
                        className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Open laboratory workspace
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100">
                    Running a diagnostic centre?{' '}
                    <button
                      type="button"
                      onClick={() => setRegisterModal('lab')}
                      className="font-semibold text-teal-700 hover:underline cursor-pointer"
                    >
                      Register your laboratory
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>

      {registerModal === 'patient' && (
        <PatientRegistrationModal
          isOpen
          onClose={() => setRegisterModal(null)}
          onSuccess={(patient) => {
            setRegisterModal(null);
            onLoginSuccess?.(patient);
          }}
        />
      )}
      {registerModal === 'doctor' && (
        <DoctorRegistrationModal
          isOpen
          onClose={() => setRegisterModal(null)}
          onSuccess={() => {
            setRegisterModal(null);
            setMode('person');
            setRole('doctor');
          }}
        />
      )}
      {registerModal === 'lab' && (
        <LabRegistrationModal
          isOpen
          onClose={() => setRegisterModal(null)}
          onLabCreated={() => {
            setRegisterModal(null);
            loadLabs();
          }}
        />
      )}
    </div>
  );
};

export default LoginScreen;
