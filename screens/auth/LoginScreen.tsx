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
  MapPin
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
  initialPortal = 'lab'
}) => {
  const { t, language } = useLanguage();
  const { login, loginDoctor, loginPatient, getAllLabs, lab: currentLab } = useAuth();

  // Portal selection tab: 'lab' | 'patient' | 'doctor'
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
      setErrorMessage('Please select an accredited laboratory facility from the dropdown.');
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
        if (onLoginSuccess) onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Invalid credentials for this facility.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please verify your staff access code.');
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

  const filteredLabs = labs.filter(l => 
    (l.name || '').toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    (l.address || '').toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    (l.city || '').toLowerCase().includes(labSearchQuery.toLowerCase())
  );

  const selectedLabObj = labs.find(l => l.id === labId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-teal-500/20 selection:text-teal-900 font-sans">
      {/* Top Bar */}
      <header className="w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <button
          onClick={onNavigateWebsite}
          className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-[#0D3B38] flex items-center justify-center text-teal-400 shadow-sm group-hover:bg-[#0F766E] transition-colors">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-slate-900">
                nano<span className="text-teal-700">Labs</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                OS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Clinical Diagnostic Network
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          {onNavigateWebsite && (
            <button
              onClick={onNavigateWebsite}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-bold tracking-wide uppercase mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Encrypted Diagnostic Portal</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Welcome to nanoLabs
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Select your portal to sign in or create an account
              </p>

              {/* 3-Way Portal Segmented Tab Switcher */}
              <div className="mt-5 p-1 bg-slate-100 rounded-2xl grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActivePortal('lab');
                    setErrorMessage('');
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                    activePortal === 'lab'
                      ? 'bg-white text-teal-950 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${activePortal === 'lab' ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span>Laboratory</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePortal('patient');
                    setErrorMessage('');
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                    activePortal === 'patient'
                      ? 'bg-white text-teal-950 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                    activePortal === 'doctor'
                      ? 'bg-white text-teal-950 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Stethoscope className={`w-4 h-4 ${activePortal === 'doctor' ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span>Doctor</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: LABORATORY & STAFF LOGIN */}
            {activePortal === 'lab' && (
              <form onSubmit={handleLabLogin} className="p-6 space-y-4">
                {/* Lab Selector Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Accredited Laboratory *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLabDropdownOpen(!labDropdownOpen)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-black text-xs">
                          {selectedLabObj?.name ? selectedLabObj.name.substring(0, 2).toUpperCase() : 'NL'}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {selectedLabObj?.name || 'Choose a laboratory...'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{selectedLabObj?.city || selectedLabObj?.address || 'Cameroon Network'}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${labDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {labDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Filter by lab name or city..."
                            value={labSearchQuery}
                            onChange={(e) => setLabSearchQuery(e.target.value)}
                            className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <div className="space-y-1">
                          {filteredLabs.length > 0 ? (
                            filteredLabs.map((l) => (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => {
                                  setLabId(l.id);
                                  setLabName(l.name);
                                  setLabDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                  labId === l.id
                                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="truncate">
                                  <div className="font-semibold text-slate-900 truncate">{l.name}</div>
                                  <div className="text-[10px] text-slate-500 truncate">{l.city || l.address}</div>
                                </div>
                                {labId === l.id && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-400">
                              No laboratories found matching search.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Staff Access PIN */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Staff Access PIN / Security Code *
                    </label>
                    <span className="text-[10px] text-slate-400">e.g. REC123, TECH123</span>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showLabCode ? 'text' : 'password'}
                      required
                      placeholder="Enter assigned staff PIN or code"
                      value={labCode}
                      onChange={(e) => setLabCode(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLabCode(!showLabCode)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLabCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-teal-900/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In as Laboratory Personnel</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Lab Registration Action */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowRegisterLabModal(true)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Register New Laboratory Facility</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: PATIENT LOGIN */}
            {activePortal === 'patient' && (
              <form onSubmit={handlePatientLogin} className="p-6 space-y-4">
                {/* Phone Number or PID */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Mobile Phone Number or Patient ID (PID) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="+237 670 12 34 56 or PAT-1029"
                      value={patientIdentifier}
                      onChange={(e) => setPatientIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Patient Passcode */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Patient Access PIN / Passcode *
                    </label>
                    <span className="text-[10px] text-slate-400">4 to 6 Digits</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPatientPasscode ? 'text' : 'password'}
                      required
                      placeholder="Enter your confidential PIN"
                      value={patientPasscode}
                      onChange={(e) => setPatientPasscode(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 tracking-widest font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPatientPasscode(!showPatientPasscode)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPatientPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-teal-900/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Patient...</span>
                    </>
                  ) : (
                    <>
                      <span>Access My Medical Records</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Patient Account Creation CTA */}
                <div className="pt-2 p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-center space-y-1">
                  <span className="text-xs text-slate-600">First time visiting nanoLabs?</span>
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowPatientRegisterModal(true)}
                      className="text-xs font-bold text-teal-800 hover:text-teal-950 inline-flex items-center gap-1 cursor-pointer underline"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Create Patient Account / Register Profile</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 3: DOCTOR LOGIN */}
            {activePortal === 'doctor' && (
              <form onSubmit={handleDoctorLogin} className="p-6 space-y-4">
                {/* Doctor Phone or ONMC */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Phone Number or ONMC Registration Number *
                  </label>
                  <div className="relative">
                    <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="+237 671 23 45 67 or ONMC-4492"
                      value={doctorIdentifier}
                      onChange={(e) => setDoctorIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Doctor Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Doctor Password / Passcode *
                    </label>
                    <span className="text-[10px] text-slate-400">Accredited Clinician</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showDoctorPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your physician password"
                      value={doctorPassword}
                      onChange={(e) => setDoctorPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showDoctorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-teal-900/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Physician Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Doctor Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Doctor Registration Action */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowDoctorRegisterModal(true)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New Doctor? Apply for Accreditation & Register</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/60">
        <p className="text-[11px]">
          &copy; {new Date().getFullYear()} nanoLabs OS &bull; Central African Clinical Diagnostic Network &bull; AES-256 Encrypted
        </p>
      </footer>

      {/* Modals */}
      <LabRegistrationModal
        isOpen={showRegisterLabModal}
        onClose={() => setShowRegisterLabModal(false)}
        onLabCreated={async () => {
          await fetchLabs();
          setShowRegisterLabModal(false);
        }}
      />

      <DoctorRegistrationModal
        isOpen={showDoctorRegisterModal}
        onClose={() => setShowDoctorRegisterModal(false)}
        onSuccess={(doc) => {
          setShowDoctorRegisterModal(false);
          if (doc?.phone) setDoctorIdentifier(doc.phone);
        }}
      />

      <PatientRegistrationModal
        isOpen={showPatientRegisterModal}
        onClose={() => setShowPatientRegisterModal(false)}
        onSuccess={(patient) => {
          setShowPatientRegisterModal(false);
          if (onLoginSuccess) onLoginSuccess(patient);
        }}
        defaultLabId={labId || 'lab-1'}
        defaultLabName={labName || 'nanoLabs Central Diagnostics'}
      />
    </div>
  );
};

export default LoginScreen;
