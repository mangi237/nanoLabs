import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import { db, addDoc, collection } from '../../services/firebase';
import { uploadService } from '../../api/upload';
import { 
  Activity, User, Mail, Phone, MapPin, ArrowLeft, ArrowRight, Loader2, 
  CheckCircle2, Building2, Key, RefreshCw, Search, Check, 
  Sparkles, ShieldCheck, ChevronDown, FileText, ExternalLink,
  CreditCard, Droplet, Upload, X, Shield, AlertCircle, HelpCircle,
  FileCheck, Image as ImageIcon
} from 'lucide-react';
import PatientTermsModal from '../../components/legal/PatientTermsModal';

interface RegisterScreenProps {
  onBackToLogin?: () => void;
  onRegisterSuccess?: (patient: any) => void;
}

const BLOOD_GROUPS = [
  { value: 'Unknown', label: 'Unknown / Not Known', badge: 'Uncertain', desc: 'Can be verified at lab' },
  { value: 'O+', label: 'O Positive (O+)', badge: 'Universal Red Donor', desc: 'Most common blood type' },
  { value: 'O-', label: 'O Negative (O-)', badge: 'Universal Donor', desc: 'Emergency red cells' },
  { value: 'A+', label: 'A Positive (A+)', badge: 'Common', desc: 'A & O compatibility' },
  { value: 'A-', label: 'A Negative (A-)', badge: 'Rare', desc: 'A- & O- compatibility' },
  { value: 'B+', label: 'B Positive (B+)', badge: 'Common', desc: 'B & O compatibility' },
  { value: 'B-', label: 'B Negative (B-)', badge: 'Rare', desc: 'B- & O- compatibility' },
  { value: 'AB+', label: 'AB Positive (AB+)', badge: 'Universal Recipient', desc: 'Accepts all blood types' },
  { value: 'AB-', label: 'AB Negative (AB-)', badge: 'Very Rare', desc: 'Accepts negative types' }
];

const COMMON_INSURANCES = [
  'AXA Mansard',
  'Allianz Care',
  'Ascoma Health',
  'Cigna Global',
  'CNPS / National Social Insurance',
  'NHIS / Universal Health',
  'GMC Henner',
  'Sanlam Health',
  'Other Corporate / Private HMO'
];

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBackToLogin, onRegisterSuccess }) => {
  const { lab, getAllLabs } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Terms & Conditions state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [healthConsent, setHealthConsent] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Labs state & search
  const [labs, setLabs] = useState<any[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [showLabSelector, setShowLabSelector] = useState(false);
  const [selectedLab, setSelectedLab] = useState<any>(null);

  // Insurance Card upload state
  const [uploadingCard, setUploadingCard] = useState(false);
  const [insuranceCardFile, setInsuranceCardFile] = useState<File | null>(null);
  const [insuranceCardUrl, setInsuranceCardUrl] = useState<string>('');
  const [insuranceCardName, setInsuranceCardName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateDefaultAccessCode = () => 'PAT-' + Math.floor(1000 + Math.random() * 9000);

  const [formData, setFormData] = useState({
    // Step 2: Personal Contact Details
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    address: '',
    
    // Step 3: Medical ID & Insurance Details
    nationalId: '',
    age: '28',
    bloodGroup: 'Unknown',
    hasInsurance: false,
    insuranceProvider: '',
    insurancePolicyNumber: '',
    
    // Step 4: Security Access Code
    accessCode: generateDefaultAccessCode()
  });

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      setLoadingLabs(true);
      const list = await getAllLabs();
      if (list && list.length > 0) {
        setLabs(list);
        const initialLab = list.find((l: any) => l.id === lab?.id) || list[0];
        setSelectedLab(initialLab);
      } else {
        const fallback = { id: 'lab-1', name: 'Main Medical Laboratory', location: 'Central Diagnostic Hub' };
        setLabs([fallback]);
        setSelectedLab(fallback);
      }
    } catch (e) {
      console.error('Error fetching labs for registration:', e);
      const fallback = { id: 'lab-1', name: 'Main Medical Laboratory', location: 'Central Diagnostic Hub' };
      setLabs([fallback]);
      setSelectedLab(fallback);
    } finally {
      setLoadingLabs(false);
    }
  };

  const handleSelectLab = (chosenLab: any) => {
    setSelectedLab(chosenLab);
    setShowLabSelector(false);
  };

  const handleRegenerateCode = () => {
    setFormData(prev => ({ ...prev, accessCode: generateDefaultAccessCode() }));
  };

  const filteredLabs = labs.filter(l => 
    l.name?.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    l.location?.toLowerCase().includes(labSearchQuery.toLowerCase())
  );

  // Handle Insurance Card File Selection & Upload
  const handleInsuranceCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadingCard(true);
    setInsuranceCardFile(file);
    setInsuranceCardName(file.name);

    try {
      const result = await uploadService.uploadFile(file);
      if (result.success && result.fileUrl) {
        setInsuranceCardUrl(result.fileUrl);
      } else {
        setUploadError(result.error || 'Failed to process insurance card. Saved file locally.');
      }
    } catch (err: any) {
      console.warn('Insurance card upload error, falling back:', err);
      // Fallback base64
      const reader = new FileReader();
      reader.onload = () => {
        setInsuranceCardUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingCard(false);
    }
  };

  const handleRemoveInsuranceCard = () => {
    setInsuranceCardFile(null);
    setInsuranceCardUrl('');
    setInsuranceCardName('');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step Validation & Navigation
  const validateStep = (stepNumber: number): boolean => {
    setErrorMessage('');
    if (stepNumber === 1) {
      if (!selectedLab?.id) {
        setErrorMessage('Please select a laboratory or diagnostic facility to proceed.');
        return false;
      }
      return true;
    }
    if (stepNumber === 2) {
      if (!formData.name.trim()) {
        setErrorMessage('Please provide your full legal name.');
        return false;
      }
      if (!formData.phone.trim()) {
        setErrorMessage('Please provide a valid primary phone number.');
        return false;
      }
      return true;
    }
    if (stepNumber === 3) {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
        setErrorMessage('Please enter a valid age in years (between 0 and 130).');
        return false;
      }
      if (formData.hasInsurance && !formData.insuranceProvider.trim()) {
        setErrorMessage('Please specify your insurance provider or company name.');
        return false;
      }
      return true;
    }
    if (stepNumber === 4) {
      if (!formData.accessCode.trim()) {
        setErrorMessage('Please provide or generate a security access code.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('You must read and agree to the Terms and Conditions to complete your patient registration.');
      return;
    }

    if (!healthConsent) {
      setErrorMessage('You must consent to the processing of your health data to proceed.');
      return;
    }

    setLoading(true);
    try {
      const patientId = 'P-' + Math.floor(1000 + Math.random() * 9000);
      const targetLabId = selectedLab.id;

      const newPatient = {
        patientId,
        accessCode: formData.accessCode.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        address: formData.address.trim(),
        
        // Medical & Insurance Details
        nationalId: formData.nationalId.trim() || undefined,
        age: parseInt(formData.age) || 30,
        bloodGroup: formData.bloodGroup || 'Unknown',
        hasInsurance: formData.hasInsurance,
        insuranceProvider: formData.hasInsurance ? formData.insuranceProvider.trim() : undefined,
        insurancePolicyNumber: formData.hasInsurance ? formData.insurancePolicyNumber.trim() : undefined,
        insuranceCardUrl: formData.hasInsurance && insuranceCardUrl ? insuranceCardUrl : undefined,
        
        // Lab & Consent Status
        status: 'pending_confirmation',
        labId: targetLabId,
        labName: selectedLab.name || 'Medical Laboratory',
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        healthDataConsent: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        labTests: []
      };

      // Save to Firestore under the selected lab's patients subcollection
      const docRef = await addDoc(collection(db, 'labs', targetLabId, 'patients'), newPatient);

      if (onRegisterSuccess) {
        onRegisterSuccess({ id: docRef.id, ...newPatient });
      }
    } catch (error: any) {
      console.error('Error registering patient:', error);
      setErrorMessage(error?.message || 'Patient registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Facility', icon: Building2 },
    { num: 2, label: 'Personal', icon: User },
    { num: 3, label: 'Medical & Insurance', icon: Droplet },
    { num: 4, label: 'Security Code', icon: Key },
    { num: 5, label: 'Consent', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        
        {/* Navigation back to login */}
        {onBackToLogin && (
          <button
            onClick={onBackToLogin}
            className="inline-flex items-center gap-2 text-xs font-semibold text-teal-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to portal login
          </button>
        )}

        {/* Page Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white shadow-xl shadow-teal-500/20 mb-1">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Patient Portal Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Create your comprehensive medical profile, blood group & insurance record to track diagnostics.
          </p>
        </div>

        {/* Multi-Step Stepper Progress Bar */}
        <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 shadow-lg">
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {stepsList.map((step) => {
              const Icon = step.icon;
              const isPassed = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    // Allow clicking backwards
                    if (step.num < currentStep) {
                      setCurrentStep(step.num);
                    } else if (step.num === currentStep + 1 && validateStep(currentStep)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                      : isPassed
                      ? 'bg-teal-950/60 text-teal-300 border border-teal-500/30'
                      : 'bg-white/5 text-slate-400 border border-white/5'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent ? 'bg-white text-teal-700' : isPassed ? 'bg-teal-400 text-slate-900' : 'bg-white/10 text-slate-400'
                  }`}>
                    {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.num}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold truncate max-w-full">
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Registration Card Body */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Global Error Banner */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-2xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ================= STEP 1: LAB / FACILITY SELECTION ================= */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-400" />
                      Step 1: Choose Laboratory Center
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Select the medical diagnostics facility where you will submit samples or pick up reports.
                    </p>
                  </div>
                </div>

                {/* Selected Lab Card or Search Selector */}
                {!showLabSelector && selectedLab ? (
                  <div 
                    onClick={() => setShowLabSelector(true)}
                    className="p-5 bg-teal-500/15 border-2 border-teal-400/60 hover:border-teal-300 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div 
                        style={{ backgroundColor: selectedLab.primaryColor || '#0D9488' }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg"
                      >
                        {selectedLab.name?.charAt(0) || 'L'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-base text-white group-hover:text-teal-200 transition-colors truncate">
                          {selectedLab.name}
                        </div>
                        <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          {selectedLab.location || 'Central Health Diagnostic Hub'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-3 py-1 bg-teal-500/30 border border-teal-400/50 text-teal-200 text-xs font-bold rounded-lg shrink-0 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-teal-300" />
                        Selected
                      </span>
                      <span className="text-[10px] text-teal-300 underline">Change</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/95 border border-teal-500/50 rounded-2xl p-4 space-y-3 shadow-xl">
                    <div className="relative">
                      <Search className="w-4 h-4 text-teal-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search lab center by name or city (e.g. Douala, Yaoundé, Central)..."
                        value={labSearchQuery}
                        onChange={e => setLabSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {loadingLabs ? (
                        <div className="p-6 text-center text-xs text-teal-300 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading laboratories...
                        </div>
                      ) : filteredLabs.length > 0 ? (
                        filteredLabs.map((l: any) => (
                          <div
                            key={l.id}
                            onClick={() => handleSelectLab(l)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              selectedLab?.id === l.id
                                ? 'bg-teal-500/25 border-teal-400 text-white shadow-md'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                              <div className="min-w-0 text-xs">
                                <div className="font-bold truncate text-sm">{l.name}</div>
                                <div className="text-[11px] text-slate-300 truncate">{l.location || 'Central Center'}</div>
                              </div>
                            </div>
                            {selectedLab?.id === l.id && (
                              <Check className="w-4 h-4 text-teal-300 shrink-0" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No laboratory matches "{labSearchQuery}".
                        </div>
                      )}
                    </div>

                    {selectedLab && (
                      <button
                        type="button"
                        onClick={() => setShowLabSelector(false)}
                        className="w-full py-1.5 text-center text-xs text-slate-300 hover:text-white underline cursor-pointer"
                      >
                        Keep currently selected lab
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 2: PERSONAL CONTACT INFORMATION ================= */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-400" />
                    Step 2: Personal Contact Information
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Your primary contact details for verification and diagnostic report delivery.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Full Legal Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Eleanor Vance / Jean Dupont"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="+237 670 000 000"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        placeholder="patient@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Gender & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-200 mb-1">Residential Town / Address</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. Bonanjo, Douala / Bastos, Yaoundé"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: MEDICAL ID, BLOOD GROUP & INSURANCE (NEW STEP) ================= */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-[11px] font-bold mb-1 border border-teal-400/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    Clinical Record Intake
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-rose-400" />
                    Step 3: Identification, Blood Group & Insurance
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Provide your national identification, age, blood group (or select unknown), and optional health insurance coverage.
                  </p>
                </div>

                {/* 1. National ID & Age */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                        National ID / Passport Number
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. CM-10928374 or Passport #"
                        value={formData.nationalId}
                        onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Age (Years) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="130"
                      placeholder="28"
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400 text-center"
                    />
                  </div>
                </div>

                {/* 2. Blood Group Selection (Option to say Not Known) */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-semibold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-rose-400" />
                      Blood Group
                    </span>
                    <span className="text-[11px] text-teal-300">
                      Option to select &quot;Unknown / Not Known&quot;
                    </span>
                  </label>

                  {/* Blood Group Grid Buttons */}
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                    {BLOOD_GROUPS.map((bg) => {
                      const isSelected = formData.bloodGroup === bg.value;
                      const isUnknown = bg.value === 'Unknown';
                      return (
                        <button
                          key={bg.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, bloodGroup: bg.value })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? isUnknown
                                ? 'bg-amber-500/25 border-amber-400 text-white ring-2 ring-amber-400/50'
                                : 'bg-rose-500/30 border-rose-400 text-white ring-2 ring-rose-400/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-bold text-xs ${isUnknown ? 'text-amber-300' : 'text-rose-300'}`}>
                              {bg.value}
                            </span>
                            {isSelected && (
                              <Check className="w-3 h-3 text-white shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-300 truncate mt-0.5">
                            {bg.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {formData.bloodGroup === 'Unknown' && (
                    <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2 text-[11px] text-amber-200">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Blood type recorded as Unknown:</strong> If you are unsure of your blood group, our laboratory technicians can conduct a standard ABO & Rhesus grouping test during your visit.
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Health Insurance Coverage & Card Upload (Optional) */}
                <div className="space-y-4 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-teal-400" />
                        Health Insurance / Third-Party Payer
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Optional medical insurance, HMO, or corporate health mutual coverage
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasInsurance}
                        onChange={e => setFormData({ ...formData, hasInsurance: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                    </label>
                  </div>

                  {formData.hasInsurance && (
                    <div className="bg-slate-900/80 border border-teal-500/30 rounded-2xl p-4 space-y-4 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Insurance Provider */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-200 mb-1">
                            Insurance Provider / Company <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. AXA Mansard, Allianz, CNPS, Ascoma"
                            list="insurance-suggestions"
                            value={formData.insuranceProvider}
                            onChange={e => setFormData({ ...formData, insuranceProvider: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                          />
                          <datalist id="insurance-suggestions">
                            {COMMON_INSURANCES.map(ins => (
                              <option key={ins} value={ins} />
                            ))}
                          </datalist>
                        </div>

                        {/* Policy Number */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-200 mb-1">
                            Insurance Policy / Member ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. POL-98234-AXA"
                            value={formData.insurancePolicyNumber}
                            onChange={e => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-400"
                          />
                        </div>
                      </div>

                      {/* Insurance Card Upload */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-200 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-teal-400" />
                            Insurance Card Photo or Document (Optional)
                          </span>
                          <span className="text-[10px] text-slate-400">JPG, PNG, WebP or PDF</span>
                        </label>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleInsuranceCardUpload}
                          className="hidden"
                          id="insurance-card-file"
                        />

                        {insuranceCardUrl || insuranceCardName ? (
                          <div className="p-3.5 bg-teal-500/15 border border-teal-400/40 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                                <FileCheck className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-white truncate">
                                  {insuranceCardName || 'Insurance Card Document'}
                                </div>
                                <div className="text-[11px] text-teal-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Insurance card attached successfully
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveInsuranceCard}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Remove card"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="p-5 border-2 border-dashed border-white/20 hover:border-teal-400/60 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all group"
                          >
                            {uploadingCard ? (
                              <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading insurance card...
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-teal-300 group-hover:underline">
                                    Click to browse or take a photo of your insurance card
                                  </span>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Front or back image of your member card
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {uploadError && (
                          <p className="text-[11px] text-amber-300">{uploadError}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 4: SECURITY ACCESS CODE ================= */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                    <Key className="w-4 h-4 text-teal-400" />
                    Step 4: Personal Security Login Code
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Your confidential security code used along with your selected lab to log in.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      Personal Login Security Code <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      className="text-xs font-bold text-teal-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer bg-teal-500/20 px-2.5 py-1 rounded-lg border border-teal-400/30"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Auto-Generate New Code
                    </button>
                  </div>

                  <div className="relative">
                    <Key className="w-4 h-4 text-teal-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. PAT-1234"
                      value={formData.accessCode}
                      onChange={e => setFormData({ ...formData, accessCode: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border-2 border-teal-400/60 rounded-xl text-teal-300 text-base font-mono tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-start gap-3 text-xs text-teal-200 leading-relaxed">
                    <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-bold mb-0.5">Keep this access code safe!</strong>
                      You will use this code together with <span className="text-white font-semibold">{selectedLab?.name || 'Selected Lab'}</span> to access your patient results, lab tests, and medical documents anytime.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 5: REVIEW, CONSENT & SUBMISSION ================= */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    Step 5: Review Profile & Complete Registration
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Verify your medical details and agree to terms to activate your patient account.
                  </p>
                </div>

                {/* Profile Review Summary Card */}
                <div className="bg-slate-900/90 border border-white/15 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-slate-400">Diagnostic Center:</span>
                    <span className="font-bold text-teal-300">{selectedLab?.name}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-slate-400">Patient Name & Phone:</span>
                    <span className="font-bold text-white">{formData.name} • {formData.phone}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-slate-400">Age & Gender:</span>
                    <span className="font-semibold text-slate-200">{formData.age} years • {formData.gender}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-slate-400">National ID / Passport:</span>
                    <span className="font-mono font-semibold text-slate-200">{formData.nationalId || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-slate-400">Blood Group:</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      formData.bloodGroup === 'Unknown' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {formData.bloodGroup}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-slate-400">Health Insurance:</span>
                    <span className="font-semibold text-slate-200">
                      {formData.hasInsurance 
                        ? `${formData.insuranceProvider || 'Insured'} (Policy: ${formData.insurancePolicyNumber || 'N/A'})${insuranceCardUrl ? ' • Card Attached' : ''}` 
                        : 'None (Out of Pocket / Self-Pay)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Login Security Code:</span>
                    <span className="font-mono font-black text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-500/40">
                      {formData.accessCode}
                    </span>
                  </div>
                </div>

                {/* System Fee Notice */}
                <div className="p-3.5 bg-teal-950/70 border border-teal-500/30 rounded-xl text-[11px] text-slate-300 leading-relaxed">
                  <span className="text-teal-300 font-semibold">Service & System Fee Notice:</span> Standard laboratory fees are set by the facility. A platform System Fee of <strong className="text-white">500 XAF</strong> applies per completed service transaction to maintain secure digital result delivery and sample accountability.
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Legal Agreements</span>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-xs font-semibold text-teal-300 hover:text-white flex items-center gap-1 transition-colors underline cursor-pointer"
                    >
                      Read Full Terms
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <label className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 bg-slate-900 border-white/30 cursor-pointer"
                    />
                    <span className="text-xs text-slate-200">
                      I have read and agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTermsModal(true);
                        }}
                        className="text-teal-300 font-bold underline hover:text-white inline-flex items-center gap-0.5"
                      >
                        Terms and Conditions
                      </button>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={healthConsent}
                      onChange={e => setHealthConsent(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 bg-slate-900 border-white/30 cursor-pointer"
                    />
                    <span className="text-xs text-slate-200">
                      I consent to the processing of my health data as described in the Terms & Conditions
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-500/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  Continue to Step {currentStep + 1}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !termsAccepted || !healthConsent}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering Patient Record...
                    </>
                  ) : (
                    <>
                      Agree & Complete Registration
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

          </form>

        </div>
      </div>

      {/* Patient Terms Modal */}
      <PatientTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setHealthConsent(true);
        }}
        accepted={termsAccepted && healthConsent}
      />
    </div>
  );
};

export default RegisterScreen;
