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
  TestTube,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import LabRegistrationModal from '../superAdmin/LabRegistrationModal';
import LabLocationSearchModal from '../../components/common/LabLocationSearchModal';
import DoctorRegistrationModal from '../doctor/DoctorRegistrationModal';
import LanguageSelector from '../../components/common/LanguageSelector';

interface LoginScreenProps {
  onLoginSuccess?: (user: any) => void;
  onNavigateRegister?: () => void;
  onNavigateSelectLab?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateSelectLab
}) => {
  const { t, language } = useLanguage();
  const { login, loginDoctor, isLoading, getAllLabs, lab: currentLab } = useAuth();
  
  // Auth Screen Mode: 'standard' (Lab staff & Patients) vs 'doctor' (Accredited Physicians)
  const [loginMode, setLoginMode] = useState<'standard' | 'doctor'>('standard');

  // Standard Login State
  const [accessCode, setAccessCode] = useState('');
  const [labId, setLabId] = useState(currentLab?.id || '');
  const [labName, setLabName] = useState(currentLab?.name || '');
  const [showLabSelector, setShowLabSelector] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor Login State
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showRegisterLabModal, setShowRegisterLabModal] = useState(false);
  const [showDoctorRegisterModal, setShowDoctorRegisterModal] = useState(false);
  const [showLocationSearchModal, setShowLocationSearchModal] = useState(false);

  const isFrench = language === 'fr';

  // Dynamic Translated Carousel Slides with Real Clinical & Laboratory Data
  const carouselSlides = [
    {
      id: 'network',
      tag: isFrench ? 'Réseau Médical Clinique' : 'Clinical Diagnostic Network',
      title: isFrench ? 'Réseau Médical de Diagnostic de Haute Précision' : 'Precision Diagnostic & Decentralized LIMS Network',
      subtitle: isFrench 
        ? 'Connecter les patients, les médecins prescripteurs et les laboratoires accrédités au Cameroun et en Afrique centrale.' 
        : 'Connecting patients, medical clinicians, and accredited laboratories across Cameroon & Central Africa.',
      description: isFrench 
        ? 'nanoLabs assure l\'orchestration diagnostique de haute précision avec livrets numériques unifiés, flux d\'automates et confidentialité absolue du patient.' 
        : 'nanoLabs provides high-accuracy diagnostic orchestration with unified digital booklets, automated analyzer feeds, and zero-leakage patient confidentiality.',
      icon: Activity,
      stats: [
        { label: isFrench ? 'Établissements Réseau' : 'Network Facilities', value: '100+' },
        { label: isFrench ? 'Analyses au Catalogue' : 'Diagnostic Tests', value: '1,200+' },
        { label: isFrench ? 'Disponibilité Système' : 'Uptime SLA', value: '99.9%' }
      ]
    },
    {
      id: 'automation',
      tag: isFrench ? 'Automatisation & Automates' : 'Analyzer Integration & Quality',
      title: isFrench ? 'Interfaçage Direct Automates & Traçabilité Échantillons' : 'Bi-Directional Analyzer Sync & Specimen Tracking',
      subtitle: isFrench 
        ? 'Du prélèvement à la validation biologique : élimination des erreurs de saisie manuelle.' 
        : 'From barcode accessioning to automated ASTM/HL7 analyzer feeds and biologist validation.',
      description: isFrench 
        ? 'Connexion temps réel aux automates d\'hématologie, biochimie et sérologie. Alertes delta-check automatiques et vérification multi-niveaux des résultats.' 
        : 'Direct connectivity with hematology, clinical chemistry, and serology analyzers. Automated delta-check warnings and multi-tier biologist sign-offs.',
      icon: Microscope,
      stats: [
        { label: isFrench ? 'Délai Moyen' : 'Avg Turnaround', value: '< 2 hrs' },
        { label: isFrench ? 'Traçabilité Code-barres' : 'Barcode Tracing', value: '100%' },
        { label: isFrench ? 'Erreurs de Saisie' : 'Data Entry Errors', value: '0.0%' }
      ]
    },
    {
      id: 'security',
      tag: isFrench ? 'Sécurité Zéro-Connaissance' : 'Zero-Knowledge Security',
      title: isFrench ? 'Registre Médical Cryptographique de Niveau Bancaire' : 'Bank-Grade Cryptographic Medical Ledger',
      subtitle: isFrench 
        ? 'Chaque dossier patient, facture et résultat d\'analyse est protégé par un chiffrement AES-256.' 
        : 'Every patient record, invoice, and diagnostic result is protected with AES-256 field-level encryption.',
      description: isFrench 
        ? 'Le contrôle d\'accès strict par rôle (RBAC) garantit que le personnel financier n\'accède jamais aux analyses cliniques, et les techniciens uniquement à leurs dossiers assignés.' 
        : 'Strict Role-Based Access Control (RBAC) ensures financial staff never see clinical test data, and lab technicians only access their assigned clinical tests.',
      icon: ShieldCheck,
      stats: [
        { label: isFrench ? 'Chiffrement' : 'Encryption', value: 'AES-256' },
        { label: isFrench ? 'Niveaux RBAC' : 'RBAC Roles', value: '8 Layers' },
        { label: isFrench ? 'Conformité' : 'HIPAA & GDPR', value: '100%' }
      ]
    },
    {
      id: 'portal',
      tag: isFrench ? 'Portail & Livret Numérique' : 'Digital Health Booklets',
      title: isFrench ? 'Livrets Médicaux Sécurisés & Résultats Authentifiés QR' : 'Instant Digital Health Booklets & QR Verification',
      subtitle: isFrench 
        ? 'Accès sécurisé pour les patients et partage instantané avec les médecins spécialistes.' 
        : 'Secure 24/7 patient access, verified lab reports, and cryptographic doctor referrals.',
      description: isFrench 
        ? 'Téléchargement de rapports infalsifiables avec signatures cryptographiques et codes QR de vérification d\'authenticité pour les visas et dossiers médicaux.' 
        : 'Download tamper-proof diagnostic booklets with digital signatures and QR verification codes for medical referrals and travel clearance.',
      icon: TestTube,
      stats: [
        { label: isFrench ? 'Accès Patient' : 'Patient Access', value: '24/7' },
        { label: isFrench ? 'Format Rapport' : 'Report Output', value: 'PDF & QR' },
        { label: isFrench ? 'Validation Biologiste' : 'Sign-Off Proof', value: 'Instant' }
      ]
    }
  ];

  // Carousel state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    fetchLabs();
  }, []);

  // Auto advance carousel every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [carouselSlides.length]);

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

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!doctorPhone.trim()) {
      setErrorMessage('Please enter your registered doctor phone number or email.');
      return;
    }
    if (!doctorPassword.trim()) {
      setErrorMessage('Please enter your doctor password or access passcode.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginDoctor(doctorPhone.trim(), doctorPassword.trim());
      if (result.success && result.user) {
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      } else {
        setErrorMessage(result.error || 'The phone number and password do not match our registered doctor records.');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'The phone number and password do not match our registered doctor records. If you do not have an account, please click "New Doctor? Create your account" below.');
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
  const currentSlide = carouselSlides[currentSlideIndex] || carouselSlides[0];

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

          <div className="flex items-center gap-2">
            <LanguageSelector variant= "dropdown" />
            <button
              onClick={() => setShowAboutModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              {isFrench ? 'Architecture LIMS' : 'Platform Specs'}
            </button>
          </div>
        </div>

        {/* Active Carousel Slide Content */}
        <div key={currentSlide.id} className="my-10 lg:my-auto z-10 space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-400/10 border border-teal-400/30 rounded-full text-xs font-bold text-teal-300">
            <currentSlide.icon className="w-3.5 h-3.5" />
            {currentSlide.tag}
          </div>

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
            {carouselSlides.map((s, idx) => (
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
              onClick={() => setCurrentSlideIndex(prev => (prev === 0 ? carouselSlides.length - 1 : prev - 1))}
              aria-label="Previous slide"
              className="w-9 h-9 rounded-xl bg-slate-900/80 border border-teal-800/50 text-slate-300 hover:text-white hover:border-teal-400 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlideIndex(prev => (prev + 1) % carouselSlides.length)}
              aria-label="Next slide"
              className="w-9 h-9 rounded-xl bg-slate-900/80 border border-teal-800/50 text-slate-300 hover:text-white hover:border-teal-400 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: CLEAN WHITE / LIGHT LOGIN PANEL */}
      <div className="lg:w-1/2 bg-white text-slate-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center relative">
        {/* Top-Right Language Switcher */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <LanguageSelector variant="dropdown" />
        </div>

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
              {t('portal_subtitle')}
            </p>
          </div>

          {/* Nearby Lab Search Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-teal-700" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{t('looking_for_lab')}</h4>
                <p className="text-[11px] text-slate-500 truncate">{t('browse_accredited')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLocationSearchModal(true)}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              {t('search_lab_btn')}
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {loginMode === 'doctor' ? (
              /* DOCTOR PORTAL LOGIN VIEW */
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Doctor Portal Sign In</h3>
                      <p className="text-[11px] text-slate-500">Sign in with phone number & password</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-[10px] font-bold">
                    Physician Access
                  </span>
                </div>

                <form onSubmit={handleDoctorLogin} className="space-y-4">
                  {/* Doctor Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Doctor Phone Number / ID *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        autoFocus
                        placeholder="e.g. 671234567 or email"
                        value={doctorPhone}
                        onChange={e => setDoctorPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Enter the mobile phone number registered with your doctor account
                    </p>
                  </div>

                  {/* Doctor Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Doctor Password / Passcode *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showDoctorPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your doctor password"
                        value={doctorPassword}
                        onChange={e => setDoctorPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showDoctorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Doctor Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || isSubmitting}
                    className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isLoading || isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Doctor Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Doctor Portal Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDoctorRegisterModal(true)}
                    className="w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-teal-600" />
                    <span>New Doctor? Create your account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('standard');
                      setErrorMessage('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer py-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Are you a Laboratory Staff or Patient? Click here</span>
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD LABORATORY & PATIENT LOGIN VIEW */
              <div className="space-y-5">
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Optional Laboratory Search / Selector */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t('assigned_lab_label')}
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">{t('search_to_select')}</span>
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
                          {labName || t('search_or_select_placeholder')}
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
                            placeholder={t('search_input_placeholder')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                          {filteredLabs.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                              {searchQuery ? t('no_lab_found') : t('type_lab_to_search')}
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
                        {t('access_code_label')}
                      </label>
                      <span className="text-[10px] text-teal-700 font-semibold">{t('staff_and_patients')}</span>
                    </div>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        placeholder={t('access_code_placeholder')}
                        value={accessCode}
                        onChange={e => setAccessCode(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      {t('access_code_hint')}
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
                        {t('authenticating')}
                      </>
                    ) : (
                      <>
                        {t('sign_in_btn')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* DOCTOR DEDICATED CALLOUT BANNER: "Are you a Doctor? Click here" */}
                <div className="p-3.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border-2 border-teal-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-teal-950 truncate">Are you a Doctor?</h4>
                      <p className="text-[11px] text-teal-700 truncate">Access your Physician Portal & results</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('doctor');
                      setErrorMessage('');
                    }}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Click Here</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom Actions for Patients & Labs */}
                <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onNavigateRegister}
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold transition-colors hover:underline cursor-pointer"
                  >
                    {t('new_patient_prompt')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRegisterLabModal(true)}
                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-teal-600" />
                    {t('register_lab_btn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Registration Modal */}
      {showDoctorRegisterModal && (
        <DoctorRegistrationModal
          isOpen={showDoctorRegisterModal}
          onClose={() => setShowDoctorRegisterModal(false)}
          onSuccess={(doc) => {
            if (doc.phone) {
              setDoctorPhone(doc.phone);
            }
            if (doc.password) {
              setDoctorPassword(doc.password);
            }
            setLoginMode('doctor');
            setErrorMessage('');
          }}
        />
      )}

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
                <h3 className="text-xl font-extrabold text-white">{t('about_nanolabs_title')}</h3>
                <p className="text-xs text-teal-300 font-medium">{t('about_nanolabs_subtitle')}</p>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
                <Activity className="w-4 h-4 text-teal-400" />
                {isFrench ? 'Architecture & Spécifications Cliniques' : 'Clinical Architecture & LIMS Core'}
              </div>
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-white">
                  {isFrench ? 'Système d\'Information de Laboratoire Médical Décentralisé' : 'Decentralized Clinical Laboratory Management System'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isFrench 
                    ? 'nanoLabs est conçu pour unifier les flux de travail pré-analytiques, analytiques et post-analytiques au sein des laboratoires de diagnostic médical et centres hospitaliers. Il assure une interopérabilité directe avec les automates cliniques (ASTM / HL7), une traçabilité par code-barres 100% sécurisée et une génération instantanée de livrets de santé cryptographiques.'
                    : 'nanoLabs is engineered to unify pre-analytical, analytical, and post-analytical workflows across medical diagnostic laboratories and hospital centers. It provides direct clinical analyzer interoperability (ASTM / HL7), 100% barcode-tracked chain of custody, and instant cryptographic digital health booklet publishing.'}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700 text-center">
                    <div className="text-xs font-black text-teal-400 font-mono">ASTM / HL7</div>
                    <div className="text-[10px] text-slate-400">{isFrench ? 'Automates' : 'Analyzer Sync'}</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700 text-center">
                    <div className="text-xs font-black text-teal-400 font-mono">AES-256</div>
                    <div className="text-[10px] text-slate-400">{isFrench ? 'Chiffrement' : 'Encryption'}</div>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700 text-center">
                    <div className="text-xs font-black text-teal-400 font-mono">ISO 15189</div>
                    <div className="text-[10px] text-slate-400">{isFrench ? 'Conformité' : 'Readiness'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('guarantees_title')}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    {t('zk_title')}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {t('zk_desc')}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                    <Shield className="w-4 h-4" />
                    {t('isolation_title')}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {t('isolation_desc')}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                    <Cpu className="w-4 h-4" />
                    {t('ai_title')}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {t('ai_desc')}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <HeartHandshake className="w-4 h-4" />
                    {t('billing_title')}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {t('billing_desc')}
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
                {t('close_return')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
