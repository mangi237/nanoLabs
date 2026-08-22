import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { 
  Activity, 
  Building2, 
  Key, 
  ChevronDown, 
  CheckCircle, 
  Search, 
  ArrowRight, 
  Loader2, 
  Shield, 
  Sparkles, 
  X, 
  Award, 
  Lock, 
  Cpu, 
  HeartHandshake, 
  CheckCircle2, 
  UserCheck,
  PlusCircle,
  MapPin,
  Navigation,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Microscope,
  Stethoscope,
  Globe2,
  Users,
  TestTube
} from 'lucide-react';
import LabRegistrationModal from '../superAdmin/LabRegistrationModal';
import LabLocationSearchModal from '../../components/common/LabLocationSearchModal';
// import founderPortraitImg from '../../assets/images/founder.jpg';

interface LoginScreenProps {
  onLoginSuccess?: (user: any) => void;
  onNavigateRegister?: () => void;
  onNavigateSelectLab?: () => void;
}

const CAROUSEL_SLIDES = [
  {
    id: 'mission',
    tag: 'Clinical Network',
    title: 'Precision Diagnostics & Healthcare Network',
    subtitle: 'Connecting patients, medical clinicians, and accredited laboratories across Cameroon & Central Africa.',
    description: 'nanoLabs provides high-accuracy diagnostic orchestration with unified digital booklets, automated analyzer feeds, and zero-leakage patient confidentiality.',
    icon: Activity,
    stats: [
      { label: 'Network Facilities', value: '100+' },
      { label: 'Diagnostic Tests', value: '1,200+' },
      { label: 'Uptime SLA', value: '99.9%' }
    ],
    highlight: 'Accredited Medical Infrastructure'
  },
  {
    id: 'founder',
    tag: 'Founder & Vision',
    title: 'Pioneering Decentralized Health Intelligence',
    subtitle: 'Founded with a singular commitment: fast, transparent, and dignified healthcare for every patient.',
    description: 'Engineered by 16-year-old visionary Mangi Lerine Laslie Jr, nanoLabs eliminates administrative friction in diagnostic medicine, providing rapid test turnarounds and ironclad confidentiality.',
    icon: Award,
    stats: [
      { label: 'Founded', value: '2024' },
      { label: 'Visionary Age', value: '16 Yrs' },
      { label: 'Patient Trust', value: '100%' }
    ],
    highlight: 'Built for Clinicians & Patients'
  },
  {
    id: 'security',
    tag: 'Zero-Knowledge Security',
    title: 'Bank-Grade Cryptographic Medical Ledger',
    subtitle: 'Every patient record, invoice, and diagnostic result is protected with AES-256 field-level encryption.',
    description: 'Strict Role-Based Access Control (RBAC) ensures financial staff never see clinical test data, and lab technicians only access their assigned clinical tests.',
    icon: ShieldCheck,
    stats: [
      { label: 'Encryption', value: 'AES-256' },
      { label: 'RBAC Roles', value: '8 Layers' },
      { label: 'HIPAA & GDPR', value: 'Compliant' }
    ],
    highlight: 'Zero Patient Data Leakage'
  },
  {
    id: 'speed',
    tag: 'Real-Time Workflow',
    title: 'Automated Phlebotomy to Report Release',
    subtitle: 'Seamless orchestration between Admissions, Cashier, Specimen Desk, and Lab Technologists.',
    description: 'Track specimen tubes with automated barcode identifiers, perform digital verification, and publish QR-authenticated clinical booklets instantly.',
    icon: Microscope,
    stats: [
      { label: 'Avg Turnaround', value: '< 2 hrs' },
      { label: 'Barcode Sync', value: 'Instant' },
      { label: 'Digital Booklets', value: 'PDF & Web' }
    ],
    highlight: 'Next-Gen Laboratory Automation'
  }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateSelectLab
}) => {
  const { t } = useLanguage();
  const { login, isLoading, getAllLabs, lab: currentLab } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [labId, setLabId] = useState(currentLab?.id || '');
  const [labName, setLabName] = useState(currentLab?.name || '');
  const [showLabSelector, setShowLabSelector] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showRegisterLabModal, setShowRegisterLabModal] = useState(false);
  const [showLocationSearchModal, setShowLocationSearchModal] = useState(false);

  // Carousel state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    fetchLabs();
  }, []);

  // Auto advance carousel every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const fetchLabs = async () => {
    try {
      const list = await getAllLabs();
      setLabs(list || []);
      // Intentionally do NOT auto-select the first lab from database on launch
    } catch (e) {
      console.error('Error fetching labs:', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!accessCode.trim()) {
      setErrorMessage('Please enter your authorization access code or email passcode.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(accessCode, labId);
      if (result.success && result.user) {
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      } else {
        setErrorMessage('Invalid access code or laboratory configuration.');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLabs = labs.filter((lab: any) =>
    lab.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lab.city && lab.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedLab = labs.find((l: any) => l.id === labId);
  const currentSlide = CAROUSEL_SLIDES[currentSlideIndex];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100 antialiased">
      {/* LEFT COLUMN: CAROUSEL ABOUT US & FOUNDER */}
      <div className="lg:w-1/2 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-teal-900/40 min-h-[480px]">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Logo on Left */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-md">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">nano<span className="text-teal-400">Labs</span></span>
              <span className="block text-[10px] text-teal-300 font-semibold tracking-wider uppercase">Health Care Diagnostics</span>
            </div>
          </div>

          <button
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Founder Story
          </button>
        </div>

        {/* Active Carousel Slide Content */}
        <div className="my-10 lg:my-auto z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-400/10 border border-teal-400/30 rounded-full text-xs font-bold text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            {currentSlide.tag}
          </div>

          {currentSlide.id === 'founder' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-teal-400/80 shadow-lg shadow-teal-500/20 bg-slate-800">
                   
                  </div>
                  <span className="absolute -bottom-2 -right-1 px-2 py-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-[10px] rounded-full shadow-sm">
                    Age 16
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Mangi Lerine Laslie Jr
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-teal-300">
                    Visionary Founder & Lead Architect
                  </p>
                  <span className="inline-block text-[11px] text-slate-400 font-medium">
                    nanoLabs Health Care OS
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {currentSlide.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  {currentSlide.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                {currentSlide.title}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-teal-200/90">
                {currentSlide.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                {currentSlide.description}
              </p>
            </div>
          )}

          {/* Slide Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-teal-900/50">
            {currentSlide.stats.map((st, i) => (
              <div key={i} className="p-3 bg-slate-900/60 border border-teal-800/40 rounded-2xl">
                <div className="text-lg sm:text-2xl font-black text-white font-mono">{st.value}</div>
                <div className="text-[10px] sm:text-xs text-teal-300/80 font-medium mt-0.5">{st.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Bottom Controls */}
        <div className="flex items-center justify-between z-10 pt-4">
          <div className="flex items-center gap-2">
            {CAROUSEL_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlideIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlideIndex === idx ? 'w-8 bg-teal-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlideIndex(prev => (prev === 0 ? CAROUSEL_SLIDES.length - 1 : prev - 1))}
              aria-label="Previous slide"
              className="w-9 h-9 rounded-xl bg-slate-900/80 border border-teal-800/50 text-slate-300 hover:text-white hover:border-teal-400 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlideIndex(prev => (prev + 1) % CAROUSEL_SLIDES.length)}
              aria-label="Next slide"
              className="w-9 h-9 rounded-xl bg-slate-900/80 border border-teal-800/50 text-slate-300 hover:text-white hover:border-teal-400 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: CLEAN WHITE / LIGHT LOGIN PANEL */}
      <div className="lg:w-1/2 bg-white text-slate-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center">
        <div className="max-w-md w-full space-y-6">
          {/* Right Header: Logo & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-teal-600 text-white shadow-lg shadow-teal-600/30 mb-1">
              <Activity className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              nano<span className="text-teal-600">Labs</span> Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Sign in with your staff credentials or patient passcode
            </p>
          </div>

          {/* Nearby Lab Search Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-teal-700" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Looking for a lab around you?</h4>
                <p className="text-[11px] text-slate-500 truncate">Browse accredited diagnostic centers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLocationSearchModal(true)}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              Search
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in duration-150">
                <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Optional Laboratory Search / Selector */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Assigned Laboratory / Center
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Search to select</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLabSelector(!showLabSelector)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left text-sm text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {selectedLab?.logoUrl ? (
                      <img
                        src={selectedLab.logoUrl}
                        alt={selectedLab.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-lg object-cover border border-slate-300 shrink-0 bg-white"
                      />
                    ) : (
                      <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                    <span className="truncate font-semibold">
                      {labName || 'Search or Select Laboratory (Optional)'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {/* Lab Selector Dropdown */}
                {showLabSelector && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search laboratory name, city, or address..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {filteredLabs.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          {searchQuery ? 'No laboratory found matching your search.' : 'Type laboratory name to search...'}
                        </div>
                      ) : (
                        filteredLabs.map((l: any) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setLabId(l.id);
                              setLabName(l.name);
                              setShowLabSelector(false);
                              setSearchQuery('');
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                              labId === l.id ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {l.logoUrl ? (
                                <img
                                  src={l.logoUrl}
                                  alt={l.name}
                                  referrerPolicy="no-referrer"
                                  className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-bold">
                                  <Building2 className="w-4 h-4 text-teal-700" />
                                </div>
                              )}
                              <div className="truncate">
                                <div className="truncate font-bold text-slate-900">{l.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {l.city ? `${l.city} • ` : ''}
                                  {l.address || l.location || 'Accredited Center'}
                                </div>
                              </div>
                            </div>
                            {labId === l.id && <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Access Code Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Access Code / Passcode / OTP *
                  </label>
                  <span className="text-[10px] text-teal-700 font-semibold">Staff & Patients</span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder="Enter access code or email OTP"
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Staff: Enter your email setup OTP or private password. Patients: Enter your registration passcode.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading || isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating Credentials...
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={onNavigateRegister}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold transition-colors hover:underline cursor-pointer"
              >
                New patient? Register your profile here
              </button>

              <button
                type="button"
                onClick={() => setShowRegisterLabModal(true)}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-teal-600" />
                Register New Diagnostic Facility
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Search Modal */}
      <LabLocationSearchModal
        isOpen={showLocationSearchModal}
        onClose={() => setShowLocationSearchModal(false)}
        onSelectLab={(selLab) => {
          setLabId(selLab.id);
          setLabName(selLab.name);
        }}
      />

      {/* Self-Service Lab Registration Modal */}
      {showRegisterLabModal && (
        <LabRegistrationModal
          isOpen={showRegisterLabModal}
          onClose={() => setShowRegisterLabModal(false)}
          onLabCreated={fetchLabs}
        />
      )}

      {/* ABOUT US MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-teal-700 flex items-center justify-center text-white shadow-md">
                <Activity className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">About nanoLabs Health Care</h3>
                <p className="text-xs text-teal-300 font-medium">Next-Generation Zero-Knowledge Laboratory Operating System</p>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-400" />
                Visionary Founder & Lead Architect
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-teal-400 shadow-xl shadow-teal-500/20 bg-slate-900">
                    {/* <img
                      src={founderPortraitImg}
                      alt="Mangi Lerine Laslie Jr - Founder of nanoLabs"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    /> */}
                  </div>
                  <span className="absolute -bottom-2 -right-1 px-2.5 py-0.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black text-[10px] rounded-full shadow-md">
                    Founder at 16
                  </span>
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className="text-xl font-black text-white">Mangi Lerine Laslie Jr</h4>
                      <p className="text-xs text-teal-200 font-semibold">16-Year-Old Technologist & Healthcare Innovator</p>
                    </div>
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-full text-[11px] font-bold self-center sm:self-auto">
                      Founded at Age 16
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    Engineered from the ground up by 16-year-old visionary <strong>Mangi Lerine Laslie Jr</strong>, nanoLabs was created to eliminate administrative friction in diagnostic medicine, accelerate test turnaround times, and establish ironclad cryptographic privacy for patients and medical practitioners across Cameroon and Africa.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Enhanced Security & Architecture Guarantees
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    Zero-Knowledge Staff Governance
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Administrators assign job roles only. Employees receive cryptographically hashed OTPs and set permanent private passwords that even administrators cannot access.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                    <Shield className="w-4 h-4" />
                    Role-Isolated Portal Isolation
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Strict separation of duties. Cashiers handle billing without clinical access; Phlebotomists accession samples; Lab Techs verify results under AES-GCM encryption.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                    <Cpu className="w-4 h-4" />
                    nanoLabs AI Report System
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Privacy-preserving AI summarization of facility throughput, stock reorder forecasting, and multi-department operational audits with zero patient PII exposure.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <HeartHandshake className="w-4 h-4" />
                    Automated Invoicing & Co-Pay
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Split-billing supporting 100% and partial insurance policies, MTN Mobile Money, Orange Money, Cash, and instant cryptographic receipts.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-mono">
                nanoLabs v2.4 • Cameroon & Central Africa
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close & Return to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
