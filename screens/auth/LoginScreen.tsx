import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { 
  Activity, 
  Building2, 
  Key, 
  ChevronDown, 
  Search, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowLeft, 
  User, 
  Stethoscope, 
  Sparkles, 
  Check, 
  PlusCircle,
  MapPin,
  HeartPulse,
  Shield,
  Zap
} from 'lucide-react';
import LabRegistrationModal from '../superAdmin/LabRegistrationModal';
import DoctorRegistrationModal from '../doctor/DoctorRegistrationModal';
import PatientRegistrationModal from '../../components/patient/PatientRegistrationModal';
import LanguageSelector from '../../components/common/LanguageSelector';

interface LoginScreenProps {
  onLoginSuccess?: (user: any) => void;
  onNavigateRegister?: () => void;
  onNavigateSelectLab?: () => void;
  onNavigateWebsite?: () => void;
  initialPortal?: 'lab' | 'patient' | 'doctor';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateWebsite,
  initialPortal = 'patient'
}) => {
  const { t, language } = useLanguage();
  const { login, loginDoctor, loginPatient, getAllLabs, lab: currentLab } = useAuth();

  // Portal selection tab: 'patient' | 'doctor' | 'lab'
  const [activePortal, setActivePortal] = useState<'lab' | 'patient' | 'doctor'>(initialPortal);

  // Laboratory Login state
  const [labId, setLabId] = useState(currentLab?.id || '');
  const [labName, setLabName] = useState(currentLab?.name || '');
  const [labCode, setLabCode] = useState('');
  const [showLabCode, setShowLabCode] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);
  const [labDropdownOpen, setLabDropdownOpen] = useState(false);
  const [labSearchQuery, setLabSearchQuery] = useState('');

  // Patient Login state
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [patientPasscode, setPatientPasscode] = useState('');
  const [showPatientPasscode, setShowPatientPasscode] = useState(false);

  // Doctor Login state
  const [doctorIdentifier, setDoctorIdentifier] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);

  // Modals & General UI
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterLabModal, setShowRegisterLabModal] = useState(false);
  const [showDoctorRegisterModal, setShowDoctorRegisterModal] = useState(false);
  const [showPatientRegisterModal, setShowPatientRegisterModal] = useState(false);

  useEffect(() => {
    setActivePortal(initialPortal);
  }, [initialPortal]);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const list = await getAllLabs();
      const validLabs = list || [];
      setLabs(validLabs);

      if (validLabs.length > 0 && !labId) {
        setLabId(validLabs[0].id);
        setLabName(validLabs[0].name);
      }
    } catch (e) {
      console.error('Error fetching labs:', e);
    }
  };

  const handleLabLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!labId) {
      setErrorMessage('Please select a verified diagnostic laboratory from the network list.');
      return;
    }

    if (!labCode.trim()) {
      setErrorMessage('Please enter your staff authorization access code / PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(labCode.trim(), labId);
      if (result.success && result.user) {
        if (result.user.role === 'patient') {
          setErrorMessage('This code is for patients. Please switch to the Patient tab above.');
          return;
        }
        if (onLoginSuccess) onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Invalid Staff Access Code. Please check credentials with your lab admin.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Laboratory sign-in failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!patientIdentifier.trim()) {
      setErrorMessage('Please enter your registered phone number or Patient ID (PID).');
      return;
    }

    if (!patientPasscode.trim()) {
      setErrorMessage('Please enter your patient access code / PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginPatient(patientIdentifier.trim(), patientPasscode.trim(), labId || 'lab-1');
      if (result.success && result.user) {
        if (onLoginSuccess) onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'No patient record found matching these credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Patient sign-in failed. Please verify your phone and code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!doctorIdentifier.trim()) {
      setErrorMessage('Please enter your registered phone number or ONMC ID.');
      return;
    }

    if (!doctorPassword.trim()) {
      setErrorMessage('Please enter your doctor account password or passcode.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginDoctor(doctorIdentifier.trim(), doctorPassword.trim());
      if (result.success && result.user) {
        if (onLoginSuccess) onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Doctor authentication failed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Doctor login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo Autofills
  const fillDemoPatient = () => {
    setActivePortal('patient');
    setPatientIdentifier('+237 671 22 33 44');
    setPatientPasscode('PAT-2026');
    setErrorMessage('');
  };

  const fillDemoDoctor = () => {
    setActivePortal('doctor');
    setDoctorIdentifier('+237 699 44 22 11');
    setDoctorPassword('DOC-4829');
    setErrorMessage('');
  };

  const fillDemoLab = () => {
    setActivePortal('lab');
    if (labs.length > 0) {
      setLabId(labs[0].id);
      setLabName(labs[0].name);
    }
    setLabCode('LAB-001');
    setErrorMessage('');
  };

  const filteredLabs = labs.filter(l => 
    (l.name || '').toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    (l.address || '').toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    (l.city || '').toLowerCase().includes(labSearchQuery.toLowerCase())
  );

  const selectedLabObj = labs.find(l => l.id === labId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4FAF8] via-[#EDF6F4] to-[#E3F2EE] text-slate-900 flex flex-col justify-between font-sans selection:bg-teal-500/20 selection:text-teal-900">
      {/* Top Navigation Bar */}
      <header className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-teal-900/10 bg-white/70 backdrop-blur-xl shrink-0">
        <button
          onClick={onNavigateWebsite}
          className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-hidden"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#006978] to-[#00838F] flex items-center justify-center text-white shadow-md shadow-teal-900/10 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900">
                Nano<span className="text-[#006978]">Labs</span>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Health Portal
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Connected Healthcare & Diagnostic Network
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2.5">
          <LanguageSelector />
        </div>
      </header>

      {/* Main Container - Modern Floating Glass Card */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-md sm:max-w-lg space-y-4">
          
          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-teal-100/80 shadow-2xl shadow-teal-950/5 overflow-hidden transition-all">
            
            {/* Header */}
            <div className="px-6 pt-7 pb-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Modern Diagnostic Experience</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Welcome to NanoLabs
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Sign in to manage test bookings, live tracking, and verified results.
              </p>

              {/* Modern 3-Way Portal Segment Switcher */}
              <div className="mt-6 p-1.5 bg-slate-100/90 rounded-2xl grid grid-cols-3 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setActivePortal('patient');
                    setErrorMessage('');
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer select-none ${
                    activePortal === 'patient'
                      ? 'bg-white text-teal-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <User className={`w-4 h-4 ${activePortal === 'patient' ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span>Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePortal('doctor');
                    setErrorMessage('');
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer select-none ${
                    activePortal === 'doctor'
                      ? 'bg-white text-teal-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Stethoscope className={`w-4 h-4 ${activePortal === 'doctor' ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span>Doctor</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePortal('lab');
                    setErrorMessage('');
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer select-none ${
                    activePortal === 'lab'
                      ? 'bg-white text-teal-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${activePortal === 'lab' ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span>Lab Staff</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mx-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: PATIENT PORTAL LOGIN */}
            {activePortal === 'patient' && (
              <form onSubmit={handlePatientLogin} className="p-6 pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Phone Number or Patient ID (PID)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={patientIdentifier}
                      onChange={(e) => setPatientIdentifier(e.target.value)}
                      placeholder="e.g. +237 671 22 33 44 or P-1029"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#006978] focus:bg-white transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Patient Access Code / PIN
                    </label>
                    <span className="text-[11px] text-teal-700 font-semibold">
                      4 to 8 characters
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type={showPatientPasscode ? 'text' : 'password'}
                      value={patientPasscode}
                      onChange={(e) => setPatientPasscode(e.target.value)}
                      placeholder="e.g. PAT-2026 or secret PIN"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#006978] focus:bg-white transition-all shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPatientPasscode(!showPatientPasscode)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    >
                      {showPatientPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#006978] to-[#00838F] hover:from-[#005a66] hover:to-[#00747E] active:scale-[0.99] text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-teal-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Patient Health Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Create Account Link */}
                <div className="pt-2 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateRegister) onNavigateRegister();
                        else setShowPatientRegisterModal(true);
                      }}
                      className="font-black text-[#006978] hover:underline cursor-pointer"
                    >
                      Create Patient Account
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* TAB 2: DOCTOR / CLINICIAN LOGIN */}
            {activePortal === 'doctor' && (
              <form onSubmit={handleDoctorLogin} className="p-6 pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Registered Mobile or ONMC License #
                  </label>
                  <div className="relative">
                    <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={doctorIdentifier}
                      onChange={(e) => setDoctorIdentifier(e.target.value)}
                      placeholder="e.g. +237 699 44 22 11 or ONMC-4829"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#006978] focus:bg-white transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Doctor Password / Passcode
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type={showDoctorPassword ? 'text' : 'password'}
                      value={doctorPassword}
                      onChange={(e) => setDoctorPassword(e.target.value)}
                      placeholder="Enter physician password"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#006978] focus:bg-white transition-all shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    >
                      {showDoctorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#006978] to-[#00838F] hover:from-[#005a66] hover:to-[#00747E] active:scale-[0.99] text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-teal-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Open Doctor Consultation Hub</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Are you a licensed physician in Cameroon?{' '}
                    <button
                      type="button"
                      onClick={() => setShowDoctorRegisterModal(true)}
                      className="font-black text-[#006978] hover:underline cursor-pointer"
                    >
                      Register ONMC Practice
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* TAB 3: LABORATORY & STAFF LOGIN */}
            {activePortal === 'lab' && (
              <form onSubmit={handleLabLogin} className="p-6 pt-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Partner Laboratory Facility
                    </label>
                    {selectedLabObj && (
                      <button
                        type="button"
                        onClick={() => {
                          setLabId('');
                          setLabName('');
                        }}
                        className="text-[11px] font-bold text-[#006978] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {selectedLabObj ? (
                    <div className="p-3 bg-teal-50 border border-teal-200/90 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-xl bg-[#006978] text-white flex items-center justify-center font-black text-xs shrink-0">
                          {selectedLabObj.name ? selectedLabObj.name.substring(0, 2).toUpperCase() : 'NL'}
                        </div>
                        <div className="truncate text-left">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {selectedLabObj.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                            <span>{selectedLabObj.city || selectedLabObj.address || 'Douala'}</span>
                          </div>
                        </div>
                      </div>
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                    </div>
                  ) : (
                    <select
                      value={labId}
                      onChange={(e) => {
                        setLabId(e.target.value);
                        const found = labs.find(l => l.id === e.target.value);
                        if (found) setLabName(found.name);
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#006978]"
                      required
                    >
                      <option value="">-- Choose Accredited Laboratory --</option>
                      {labs.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.city || l.address || 'Cameroon'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Staff Security Access PIN / Code
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type={showLabCode ? 'text' : 'password'}
                      value={labCode}
                      onChange={(e) => setLabCode(e.target.value)}
                      placeholder="e.g. LAB-001 (Reception/Cashier/Biologist)"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#006978] focus:bg-white transition-all shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLabCode(!showLabCode)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    >
                      {showLabCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#006978] to-[#00838F] hover:from-[#005a66] hover:to-[#00747E] active:scale-[0.99] text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-teal-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Staff...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Laboratory LIMS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Need to accredit a new clinical laboratory?{' '}
                    <button
                      type="button"
                      onClick={() => setShowRegisterLabModal(true)}
                      className="font-black text-[#006978] hover:underline cursor-pointer"
                    >
                      Register Laboratory
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Quick 1-Click Demo Fill Bar (Instant Testing for Reviewer) */}
            <div className="px-6 py-3.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-[11px]">
              <span className="font-bold text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Demo:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={fillDemoPatient}
                  className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg text-slate-700 font-bold cursor-pointer transition-colors"
                >
                  👤 Patient
                </button>
                <button
                  type="button"
                  onClick={fillDemoDoctor}
                  className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg text-slate-700 font-bold cursor-pointer transition-colors"
                >
                  🩺 Doctor
                </button>
                <button
                  type="button"
                  onClick={fillDemoLab}
                  className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg text-slate-700 font-bold cursor-pointer transition-colors"
                >
                  🏥 Staff
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Compliance Assurance Footer */}
          <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>CEMAC Accredited Diagnostic Network &bull; 256-Bit SSL Encrypted</span>
          </div>
        </div>
      </main>

      {/* Modals for Self-Registration */}
      {showRegisterLabModal && (
        <LabRegistrationModal
          onClose={() => setShowRegisterLabModal(false)}
          onSuccess={() => {
            setShowRegisterLabModal(false);
            fetchLabs();
          }}
        />
      )}

      {showDoctorRegisterModal && (
        <DoctorRegistrationModal
        isOpen= {() => setShowDoctorRegisterModal(true)}
          onClose={() => setShowDoctorRegisterModal(false)}
          onSuccess={() => {
            setShowDoctorRegisterModal(false);
            setActivePortal('doctor');
          }}
        />
      )}

      {showPatientRegisterModal && (
        <PatientRegistrationModal
          isOpen={showPatientRegisterModal}
          onClose={() => setShowPatientRegisterModal(false)}
          onSuccess={() => {
            setShowPatientRegisterModal(false);
            setActivePortal('patient');
          }}
        />
      )}
    </div>
  );
};

export default LoginScreen;
