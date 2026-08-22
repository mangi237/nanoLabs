import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import { db, addDoc, collection } from '../../services/firebase';
import { uploadService } from '../../api/upload';
import { cleanFirestoreData, validatePhoneNumber } from '../../utils/sanitizeData';
import { limsService } from '../../services/limsService';
import { ReferringDoctor } from '../../types';
import { 
  Activity, User, Mail, Phone, MapPin, ArrowLeft, ArrowRight, Loader2, 
  CheckCircle2, Building2, Key, RefreshCw, Search, Check, 
  Sparkles, ShieldCheck, ChevronDown, FileText, ExternalLink,
  CreditCard, Droplet, Upload, X, Shield, AlertCircle, HelpCircle,
  FileCheck, Image as ImageIcon, Stethoscope, UserCheck
} from 'lucide-react';
import PatientTermsModal from '../../components/legal/PatientTermsModal';
import { 
  CAMEROON_INSURANCE_COMPANIES, 
  calculateAgeFromDOB, 
  formatDOBDisplay 
} from '../../data/cameroonInsurances';

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

  // Referring Doctor State (Step 4 - Optional)
  const [accreditedDoctors, setAccreditedDoctors] = useState<ReferringDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [referralSelectionType, setReferralSelectionType] = useState<'none' | 'accredited' | 'other'>('none');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [customDoctorName, setCustomDoctorName] = useState<string>('');
  const [customDoctorHospital, setCustomDoctorHospital] = useState<string>('');
  const [customDoctorSpecialty, setCustomDoctorSpecialty] = useState<string>('');
  const [customDoctorPhone, setCustomDoctorPhone] = useState<string>('');

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
    dateOfBirth: '1995-06-15',
    bloodGroup: 'Unknown',
    hasInsurance: false,
    insuranceProvider: 'AXA Assurances Cameroun (Douala)',
    insurancePolicyNumber: '',
    insuranceCoveragePercent: 80,
    
    // Step 5: Security Access Code
    accessCode: generateDefaultAccessCode()
  });

  const calculatedAge = calculateAgeFromDOB(formData.dateOfBirth) ?? 31;

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchAccreditedDoctors = async (labId: string) => {
    try {
      setLoadingDoctors(true);
      const docs = await limsService.fetchReferringDoctors(labId);
      setAccreditedDoctors(docs || []);
    } catch (e) {
      console.error('Error fetching accredited doctors:', e);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchLabs = async () => {
    try {
      setLoadingLabs(true);
      const list = await getAllLabs();
      if (list && list.length > 0) {
        setLabs(list);
        const initialLab = list.find((l: any) => l.id === lab?.id) || list[0];
        setSelectedLab(initialLab);
        if (initialLab?.id) {
          fetchAccreditedDoctors(initialLab.id);
        }
      } else {
        const fallback = { id: 'lab-1', name: 'Main Medical Laboratory', location: 'Central Diagnostic Hub' };
        setLabs([fallback]);
        setSelectedLab(fallback);
        fetchAccreditedDoctors('lab-1');
      }
    } catch (e) {
      console.error('Error fetching labs for registration:', e);
      const fallback = { id: 'lab-1', name: 'Main Medical Laboratory', location: 'Central Diagnostic Hub' };
      setLabs([fallback]);
      setSelectedLab(fallback);
      fetchAccreditedDoctors('lab-1');
    } finally {
      setLoadingLabs(false);
    }
  };

  const handleSelectLab = (chosenLab: any) => {
    setSelectedLab(chosenLab);
    setShowLabSelector(false);
    if (chosenLab?.id) {
      fetchAccreditedDoctors(chosenLab.id);
    }
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

  // Resolve Doctor details helper
  const getSelectedDoctorSummary = () => {
    if (referralSelectionType === 'accredited') {
      const doc = accreditedDoctors.find(d => d.id === selectedDoctorId);
      if (doc) {
        return {
          name: `Dr. ${doc.name}`,
          id: doc.id,
          hospital: doc.hospital || 'Accredited Partner Hospital',
          specialty: doc.specialty || 'Specialist',
          phone: doc.phone || '',
          display: `Dr. ${doc.name} (${doc.specialty || 'Specialist'} - ${doc.hospital || 'Accredited'})`
        };
      }
    } else if (referralSelectionType === 'other') {
      const formattedName = customDoctorName.trim()
        ? (customDoctorName.trim().toLowerCase().startsWith('dr') ? customDoctorName.trim() : `Dr. ${customDoctorName.trim()}`)
        : 'Doctor (Not specified)';
      return {
        name: formattedName,
        id: 'other',
        hospital: customDoctorHospital.trim() || 'Private Practice / Clinic',
        specialty: customDoctorSpecialty.trim() || 'General Medicine',
        phone: customDoctorPhone.trim() || '',
        display: `${formattedName}${customDoctorHospital.trim() ? ` (${customDoctorHospital.trim()})` : ''}`
      };
    }
    return {
      name: 'None / Self-Referred',
      id: '',
      hospital: 'N/A',
      specialty: 'N/A',
      phone: '',
      display: 'None / Self-Referred (Direct Patient)'
    };
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
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        setErrorMessage(phoneValidation.errorMessage || 'Please provide a valid 9-digit phone number.');
        return false;
      }
      return true;
    }
    if (stepNumber === 3) {
      if (!formData.dateOfBirth) {
        setErrorMessage('Please specify your date of birth.');
        return false;
      }
      const ageNum = calculateAgeFromDOB(formData.dateOfBirth);
      if (ageNum === undefined || ageNum < 0 || ageNum > 130) {
        setErrorMessage('Please enter a valid date of birth.');
        return false;
      }
      if (formData.hasInsurance && !formData.insuranceProvider.trim()) {
        setErrorMessage('Please select or enter your Cameroon insurance company.');
        return false;
      }
      return true;
    }
    if (stepNumber === 4) {
      // Step 4 (Referring Doctor) is optional
      if (referralSelectionType === 'other' && !customDoctorName.trim()) {
        setErrorMessage('Please enter the name of your referring doctor, or select "None / Self-Referred".');
        return false;
      }
      return true;
    }
    if (stepNumber === 5) {
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
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(5)) {
      return;
    }

    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setErrorMessage(phoneValidation.errorMessage || 'Phone number must have exactly 9 digits.');
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
      const doctorSummary = getSelectedDoctorSummary();

      const rawPatientPayload = {
        patientId,
        accessCode: formData.accessCode.trim(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase() || `${patientId.toLowerCase()}@nanolabs.cm`,
        phone: phoneValidation.formatted || formData.phone.trim(),
        gender: formData.gender,
        address: formData.address.trim() || 'N/A',
        
        // Medical & Insurance Details - safe fallbacks to prevent undefined values
        nationalId: formData.nationalId.trim() || 'N/A',
        dateOfBirth: formData.dateOfBirth,
        age: calculatedAge,
        bloodGroup: formData.bloodGroup || 'Unknown',
        hasInsurance: !!formData.hasInsurance,
        insuranceProvider: formData.hasInsurance ? (formData.insuranceProvider.trim() || 'Out-of-Pocket / Self') : 'Out-of-Pocket / Self',
        insurancePolicyNumber: formData.hasInsurance ? (formData.insurancePolicyNumber.trim() || 'N/A') : 'N/A',
        insuranceCoveragePercent: formData.hasInsurance ? Number(formData.insuranceCoveragePercent) || 80 : 0,
        insuranceCardUrl: (formData.hasInsurance && insuranceCardUrl) ? insuranceCardUrl : '',
        
        // Referring Doctor (Optional step)
        referringDoctor: doctorSummary.name,
        referringDoctorId: doctorSummary.id,
        referringDoctorHospital: doctorSummary.hospital,
        referringDoctorSpecialty: doctorSummary.specialty,
        referringDoctorPhone: doctorSummary.phone,

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

      // Recursively strip any undefined properties
      const cleanedPatient = cleanFirestoreData(rawPatientPayload);

      // Save to Firestore under the selected lab's patients subcollection
      const docRef = await addDoc(collection(db, 'labs', targetLabId, 'patients'), cleanedPatient);

      if (onRegisterSuccess) {
        onRegisterSuccess({ id: docRef.id, ...cleanedPatient });
      }
    } catch (error: any) {
      console.error('Error registering patient:', error);
      setErrorMessage(error?.message || 'Patient registration could not be completed. Please check all fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Facility', icon: Building2 },
    { num: 2, label: 'Personal', icon: User },
    { num: 3, label: 'Medical & Insurance', icon: Droplet },
    { num: 4, label: 'Doctor (Optional)', icon: Stethoscope },
    { num: 5, label: 'Security Code', icon: Key },
    { num: 6, label: 'Consent', icon: FileText }
  ];

  const selectedAccreditedDoctor = accreditedDoctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        
        {/* Navigation back to login */}
        {onBackToLogin && (
          <button
            onClick={onBackToLogin}
            className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to portal login
          </button>
        )}

        {/* Page Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-700 text-white shadow-md mb-1">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Patient Portal Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Create your comprehensive medical profile, blood group, referring doctor & insurance record.
          </p>
        </div>

        {/* Multi-Step Stepper Progress Bar */}
        <div className="bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
            {stepsList.map((step) => {
              const Icon = step.icon;
              const isPassed = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (step.num < currentStep) {
                      setCurrentStep(step.num);
                    } else if (step.num === currentStep + 1 && validateStep(currentStep)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-600 text-white shadow-sm font-bold'
                      : isPassed
                      ? 'bg-slate-800 text-teal-300 border border-slate-700'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent ? 'bg-white text-teal-800' : isPassed ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.num}
                  </div>
                  <span className="text-[10px] sm:text-[11px] leading-tight truncate max-w-full">
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8">
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Attention Required</span>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ================= STEP 1: FACILITY SELECTION ================= */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-400" />
                    Step 1: Select Your Laboratory / Medical Center
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Choose the medical diagnostic center where your records will be managed.
                  </p>
                </div>

                {loadingLabs ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                    Loading available diagnostic centers...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-teal-950/60 border-2 border-teal-500/50 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-white truncate">
                            {selectedLab?.name || 'Main Medical Center'}
                          </div>
                          <div className="text-xs text-slate-300 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                            {selectedLab?.location || 'Central Diagnostic Hub'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLabSelector(!showLabSelector)}
                        className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-semibold rounded-lg border border-teal-400/30 transition-colors shrink-0 cursor-pointer"
                      >
                        Change Facility
                      </button>
                    </div>

                    {showLabSelector && (
                      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 space-y-2.5 animate-in fade-in">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Search medical center by name or city..."
                            value={labSearchQuery}
                            onChange={e => setLabSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                          {filteredLabs.map((l) => (
                            <div
                              key={l.id}
                              onClick={() => handleSelectLab(l)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                selectedLab?.id === l.id
                                  ? 'bg-teal-500/20 border-teal-400 text-white'
                                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-xs">{l.name}</div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-teal-400" />
                                  {l.location || 'Cameroon'}
                                </div>
                              </div>
                              {selectedLab?.id === l.id && (
                                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 2: PERSONAL CONTACT DETAILS ================= */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-400" />
                    Step 2: Personal & Contact Information
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Enter your legal personal identification and contact details.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Full Legal Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. Marie Claire Fotso"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Phone Number (Cameroon) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="6XXXXXXXX (9 digits)"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Email Address <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
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

                  {/* Gender Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Biological Gender <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Male', 'Female'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: g })}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            formData.gender === g
                              ? 'bg-teal-500 text-slate-950 border-teal-400'
                              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Residential Address / City */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      City / Residential Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. Douala - Akwa / Yaoundé - Bastos"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: MEDICAL ID & INSURANCE DETAILS ================= */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-teal-400" />
                    Step 3: Medical Identification & Insurance
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Provide your blood group, date of birth, and health insurance information.
                  </p>
                </div>

                {/* 1. National ID & Date of Birth */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                        National ID / Passport
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. CM-10928374"
                        value={formData.nationalId}
                        onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-200">
                        Date of Birth <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-xs font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded border border-teal-400/30">
                        Calculated Age: {calculatedAge} years
                      </span>
                    </div>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={formData.dateOfBirth}
                      onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2. Blood Group Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-200">
                      Blood Group (ABO & Rh Factor) <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Select 'Unknown' if unsure
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {BLOOD_GROUPS.map((bg) => {
                      const isSelected = formData.bloodGroup === bg.value;
                      return (
                        <button
                          key={bg.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, bloodGroup: bg.value })}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-500/25 border-rose-400 text-white ring-2 ring-rose-400/50 shadow-md'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-sm font-black flex items-center justify-center gap-1">
                            <Droplet className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-400' : 'text-slate-500'}`} />
                            {bg.value}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                            {bg.badge}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Cameroon Health Insurance Section */}
                <div className="pt-2 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-teal-400" />
                        Cameroon Health Insurance / Third-Party Payer
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Select your registered Cameroon insurance provider for co-payment and direct billing
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
                            Cameroon Insurance Company <span className="text-rose-400">*</span>
                          </label>
                          <select
                            value={formData.insuranceProvider}
                            onChange={e => setFormData({ ...formData, insuranceProvider: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
                          >
                            {CAMEROON_INSURANCE_COMPANIES.map(company => (
                              <option key={company.id} value={company.name}>
                                {company.name}
                              </option>
                            ))}
                            <option value="Other Corporate Insurance (Cameroon)">Other Corporate Insurance (Cameroon)</option>
                          </select>
                        </div>

                        {/* Policy Number */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-200 mb-1">
                            Policy / Matricule / Member ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. POL-98234-AXA / MAT-5510"
                            value={formData.insurancePolicyNumber}
                            onChange={e => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-400"
                          />
                        </div>

                        {/* Coverage Percentage */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
                            <span>Standard Coverage Rate (% covered by Insurance)</span>
                            <span className="text-teal-300 font-bold">{formData.insuranceCoveragePercent}% Insurance / {100 - formData.insuranceCoveragePercent}% Patient Co-Pay</span>
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[100, 80, 70, 50].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setFormData({ ...formData, insuranceCoveragePercent: rate })}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                                  formData.insuranceCoveragePercent === rate
                                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                {rate}% Covered
                              </button>
                            ))}
                          </div>
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

            {/* ================= STEP 4: REFERRAL DOCTOR (OPTIONAL) ================= */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-teal-400" />
                      Step 4: Referring Doctor / Physician (Optional)
                    </h3>
                    <span className="text-[11px] font-semibold text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-400/30">
                      Optional Step
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Let us know if an accredited physician, specialist, or clinic ordered or recommended your diagnostic tests.
                  </p>
                </div>

                {/* Referral Type Quick Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReferralSelectionType('accredited');
                      if (accreditedDoctors.length > 0 && !selectedDoctorId) {
                        setSelectedDoctorId(accreditedDoctors[0].id);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      referralSelectionType === 'accredited'
                        ? 'bg-teal-500/20 border-teal-400 text-white ring-2 ring-teal-400/40'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                        Accredited Doctor
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        accreditedDoctors.length > 0 ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {loadingDoctors ? '...' : `${accreditedDoctors.length}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {accreditedDoctors.length > 0 ? 'Select from lab directory' : '0 registered in database'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReferralSelectionType('none');
                      setSelectedDoctorId('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      referralSelectionType === 'none'
                        ? 'bg-teal-500/20 border-teal-400 text-white ring-2 ring-teal-400/40'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        None / Self-Referred
                      </span>
                      {referralSelectionType === 'none' && <Check className="w-3.5 h-3.5 text-teal-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Direct patient walk-in without a prescription
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReferralSelectionType('other');
                      setSelectedDoctorId('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      referralSelectionType === 'other'
                        ? 'bg-teal-500/20 border-teal-400 text-white ring-2 ring-teal-400/40'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                        Other Doctor
                      </span>
                      {referralSelectionType === 'other' && <Check className="w-3.5 h-3.5 text-teal-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Doctor not in list? Type details
                    </p>
                  </button>
                </div>

                {/* 1. Accredited Doctor Selection */}
                {referralSelectionType === 'accredited' && (
                  <div className="bg-slate-900/80 border border-teal-500/30 rounded-2xl p-4 space-y-3.5 animate-in fade-in">
                    {loadingDoctors ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                        <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
                        Checking database for accredited doctors under {selectedLab?.name}...
                      </div>
                    ) : accreditedDoctors.length === 0 ? (
                      <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-xl space-y-3">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white">
                              No Accredited Doctors Registered in Database
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              There are currently <strong className="text-amber-300">0 accredited partner physicians</strong> recorded in the database for <strong>{selectedLab?.name || 'this laboratory'}</strong>. Laboratory administrators register accredited doctors through the Admin Control Panel.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setReferralSelectionType('other')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            Enter Doctor Manually ("Other")
                          </button>
                          <button
                            type="button"
                            onClick={() => setReferralSelectionType('none')}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5 text-teal-400" />
                            Proceed as Self-Referred
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                            <span>Select Accredited Doctor / Clinic *</span>
                            <span className="text-[11px] text-teal-300 font-normal">
                              {accreditedDoctors.length} accredited doctor{accreditedDoctors.length > 1 ? 's' : ''} found in database
                            </span>
                          </label>

                          <div className="relative">
                            <select
                              value={selectedDoctorId}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'other') {
                                  setReferralSelectionType('other');
                                  setSelectedDoctorId('');
                                } else if (val === 'none') {
                                  setReferralSelectionType('none');
                                  setSelectedDoctorId('');
                                } else {
                                  setSelectedDoctorId(val);
                                }
                              }}
                              className="w-full px-4 py-3 bg-slate-900 border border-teal-500/50 rounded-xl text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
                            >
                              <option value="none">-- Select Doctor or choose Self-Referred --</option>
                              <optgroup label="Accredited Partner Doctors">
                                {accreditedDoctors.map((doc) => (
                                  <option key={doc.id} value={doc.id}>
                                    Dr. {doc.name} — {doc.specialty || 'Specialist'} ({doc.hospital || 'Accredited Hospital'})
                                  </option>
                                ))}
                              </optgroup>
                              <option value="other">✍️ Other Doctor / Clinic (Not in list...)</option>
                            </select>
                          </div>
                        </div>

                        {/* Selected Accredited Doctor Card Preview */}
                        {selectedAccreditedDoctor && (
                          <div className="p-3.5 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-start gap-3 text-xs">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                              <Stethoscope className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-white text-sm truncate">
                                  Dr. {selectedAccreditedDoctor.name}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-3 h-3" /> Accredited Partner
                                </span>
                              </div>
                              <div className="text-slate-300 font-medium">
                                {selectedAccreditedDoctor.specialty} • {selectedAccreditedDoctor.hospital || 'Accredited Clinic'}
                              </div>
                              {selectedAccreditedDoctor.phone && (
                                <div className="text-[11px] text-slate-400">
                                  Contact: {selectedAccreditedDoctor.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Other Doctor Manual Input Fields */}
                {referralSelectionType === 'other' && (
                  <div className="bg-slate-900/80 border border-indigo-500/40 rounded-2xl p-4 space-y-3.5 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5" />
                        Enter Doctor or Practice Details
                      </span>
                      <span className="text-[10px] text-slate-400">Custom Provider Reference</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-200 mb-1">
                          Doctor / Physician's Full Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={customDoctorName}
                          onChange={(e) => setCustomDoctorName(e.target.value)}
                          placeholder="e.g. Dr. Kamga Jean-Paul"
                          className="w-full px-3.5 py-2.5 bg-white/10 border border-indigo-400/30 rounded-xl text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                          required={referralSelectionType === 'other'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-200 mb-1">
                          Hospital, Clinic, or Cabinet Name
                        </label>
                        <input
                          type="text"
                          value={customDoctorHospital}
                          onChange={(e) => setCustomDoctorHospital(e.target.value)}
                          placeholder="e.g. Hôpital Laquintinie / Clinique Saint-Luc"
                          className="w-full px-3.5 py-2.5 bg-white/10 border border-indigo-400/30 rounded-xl text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-200 mb-1">
                          Medical Specialty / Department
                        </label>
                        <input
                          type="text"
                          value={customDoctorSpecialty}
                          onChange={(e) => setCustomDoctorSpecialty(e.target.value)}
                          placeholder="e.g. Gynecology, Cardiology, General Practice"
                          className="w-full px-3.5 py-2.5 bg-white/10 border border-indigo-400/30 rounded-xl text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-200 mb-1">
                          Doctor Phone or Contact (Optional)
                        </label>
                        <input
                          type="tel"
                          value={customDoctorPhone}
                          onChange={(e) => setCustomDoctorPhone(e.target.value)}
                          placeholder="e.g. 699 00 11 22"
                          className="w-full px-3.5 py-2.5 bg-white/10 border border-indigo-400/30 rounded-xl text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. None / Self-Referred Notice */}
                {referralSelectionType === 'none' && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-white font-bold block mb-0.5">Direct Walk-In / Self-Referred</strong>
                      No referring physician will be linked to your account. Your diagnostic test orders and reports will be delivered directly to your confidential patient portal.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 5: SECURITY ACCESS CODE ================= */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                    <Key className="w-4 h-4 text-teal-400" />
                    Step 5: Personal Security Login Code
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

            {/* ================= STEP 6: REVIEW, CONSENT & SUBMISSION ================= */}
            {currentStep === 6 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    Step 6: Review Profile & Complete Registration
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Verify your medical details, referring doctor, and agree to terms to activate your patient account.
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
                    <span className="text-slate-400">Date of Birth & Age:</span>
                    <span className="font-semibold text-slate-200">
                      {formatDOBDisplay(formData.dateOfBirth)} ({calculatedAge} years old) • {formData.gender}
                    </span>
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
                    <span className="text-slate-400">Referring Doctor:</span>
                    <span className="font-semibold text-teal-300 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                      {getSelectedDoctorSummary().display}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-slate-400">Health Insurance:</span>
                    <span className="font-semibold text-slate-200">
                      {formData.hasInsurance 
                        ? `${formData.insuranceProvider || 'Insured'} (Policy: ${formData.insurancePolicyNumber || 'N/A'}) • ${formData.insuranceCoveragePercent}% Cover${insuranceCardUrl ? ' • Card Attached' : ''}` 
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

              {currentStep < 6 ? (
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
