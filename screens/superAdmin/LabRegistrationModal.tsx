import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  Palette, 
  Key, 
  Check, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  DollarSign,
  ShieldAlert,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Trash2,
  FileText,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  HardDrive,
  CheckCircle2,
  Clock,
  Mail,
  Lock,
  RefreshCw,
  UserCheck,
  Phone,
  Globe,
  Award,
  Hash,
  Stethoscope,
  MapPin
} from 'lucide-react';
import { collection, addDoc, db } from '../../services/firebase';
import { uploadService } from '../../api/upload';
import { sendOtpVerification, verifyOtpCode, sendLabWelcomeEmail } from '../../services/emailService';
import LabTermsModal from '../../components/legal/LabTermsModal';
import { PricingModelType, SubscriptionTierType } from '../../types';

interface LabRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLabCreated?: () => void;
}

export const LabRegistrationModal: React.FC<LabRegistrationModalProps> = ({
  isOpen,
  onClose,
  onLabCreated
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showPendingApprovalModal, setShowPendingApprovalModal] = useState(false);

  // Facility Terms & Conditions state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authorizedRepConfirmed, setAuthorizedRepConfirmed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Human Verification OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpDispatched, setOtpDispatched] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [verificationId, setVerificationId] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Real Facility Information
    name: '',
    slogan: 'Precision Diagnostics & Clinical Research',
    location: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    licenseNumber: '',
    taxId: '',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    directorName: '',
    directorPhone: '',
    description: '',
    logoUrl: '',
    
    // Step 2: Commercial Pricing Model & Capacity
    pricingModel: 'flat_subscription' as PricingModelType,
    subscriptionTier: 'growth' as SubscriptionTierType,
    billingPeriod: 'monthly' as 'monthly' | 'annual',
    feePerTest: 500,
    monthlyMaintenanceFee: 15000,
    defaultDoctorCommissionRate: 20,
    staffLimit: 15,
    sitesCount: 2,

    // Step 3: Theme
    primaryColor: '#0D9488',
    secondaryColor: '#0F766E',
    accentColor: '#14B8A6',
    
    // Step 4: Admin
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    accessCode: ''
  });

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await uploadService.uploadFile(file);
      if (res.success && res.fileUrl) {
        setFormData(prev => ({ ...prev, logoUrl: res.fileUrl! }));
      } else {
        alert('Could not upload logo file. Please try another image.');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('Error uploading logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, accessCode: code }));
  };

  const handleSelectPricingModel = (model: PricingModelType) => {
    if (model === 'pay_per_test') {
      setFormData(prev => ({
        ...prev,
        pricingModel: 'pay_per_test',
        feePerTest: 500,
        staffLimit: 999,
        sitesCount: 1
      }));
    } else if (model === 'flat_subscription') {
      setFormData(prev => ({
        ...prev,
        pricingModel: 'flat_subscription',
        subscriptionTier: 'growth',
        feePerTest: 0,
        staffLimit: 15,
        sitesCount: 2
      }));
    } else if (model === 'lifetime_space') {
      setFormData(prev => ({
        ...prev,
        pricingModel: 'lifetime_space',
        feePerTest: 0,
        monthlyMaintenanceFee: 15000,
        staffLimit: 999,
        sitesCount: 5
      }));
    }
  };

  const handleSelectTier = (tier: SubscriptionTierType) => {
    let staff = 5;
    let sites = 1;
    if (tier === 'small' || tier === 'starter') {
      staff = 5;
      sites = 1;
    } else if (tier === 'medium' || tier === 'growth') {
      staff = 15;
      sites = 2;
    } else if (tier === 'large' || tier === 'business' || tier === 'enterprise') {
      staff = 999;
      sites = 5;
    }
    setFormData(prev => ({
      ...prev,
      subscriptionTier: tier,
      staffLimit: staff,
      sitesCount: sites
    }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.location.trim()) {
        alert('Please provide the laboratory name and city/location.');
        return;
      }
      if (!formData.phone.trim()) {
        alert('Please provide the official laboratory phone number (used for receipts & medical reports).');
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        alert('Please provide a valid official laboratory contact email.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!formData.accessCode) {
        generateAccessCode();
      }
      setStep(4);
    }
  };

  const getSubscriptionPrice = () => {
    if (formData.pricingModel === 'pay_per_test') return 0;
    if (formData.pricingModel === 'lifetime_space') return formData.monthlyMaintenanceFee;
    
    if (formData.subscriptionTier === 'small' || formData.subscriptionTier === 'starter') {
      return formData.billingPeriod === 'annual' ? 250000 : 25000;
    }
    if (formData.subscriptionTier === 'medium' || formData.subscriptionTier === 'growth') {
      return formData.billingPeriod === 'annual' ? 450000 : 45000;
    }
    if (formData.subscriptionTier === 'large' || formData.subscriptionTier === 'business' || formData.subscriptionTier === 'enterprise') {
      return formData.billingPeriod === 'annual' ? 750000 : 75000;
    }
    return formData.billingPeriod === 'annual' ? 450000 : 45000;
  };

  // Trigger Human Verification OTP Flow
  const handleInitiateHumanVerification = async () => {
    if (!formData.adminName.trim() || !formData.adminEmail.trim()) {
      alert('Please fill in Lab Administrator name and email address.');
      return;
    }

    if (!termsAccepted) {
      alert('You must read and agree to the Terms and Conditions for Laboratory Registration.');
      return;
    }

    if (!authorizedRepConfirmed) {
      alert('You must confirm you are authorized to register this facility.');
      return;
    }

    setOtpSending(true);
    setOtpError('');
    setShowOtpModal(true);

    try {
      const res = await sendOtpVerification(
        formData.adminEmail.trim(),
        'lab_creation',
        formData.adminName.trim(),
        formData.name.trim()
      );

      if (res.success) {
        setOtpDispatched(true);
        setVerificationId(res.verificationId || '');
        setOtpSuccessMessage(res.message || `Verification code sent to ${formData.adminEmail}`);
      } else {
        setOtpError(res.error || 'Failed to dispatch verification code. Please check email address.');
      }
    } catch (e: any) {
      console.error('Error sending OTP:', e);
      setOtpError('Error connecting to verification service.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtpAndProvision = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    setOtpVerifying(true);
    setOtpError('');

    try {
      const verifyRes = await verifyOtpCode(formData.adminEmail.trim(), otpCode.trim(), verificationId);
      if (!verifyRes.success || !verifyRes.verified) {
        setOtpError(verifyRes.error || 'Invalid or expired verification code. Please re-enter.');
        setOtpVerifying(false);
        return;
      }

      // Verification passed! Commit lab creation
      setShowOtpModal(false);
      await commitLabCreation();
    } catch (e: any) {
      console.error('Error verifying OTP:', e);
      setOtpError(e.message || 'Verification failed.');
      setOtpVerifying(false);
    }
  };

  const commitLabCreation = async () => {
    setLoading(true);
    try {
      const subPrice = getSubscriptionPrice();
      const rawWeb = formData.website.trim();
      const formattedWebsite = rawWeb
        ? (rawWeb.startsWith('http://') || rawWeb.startsWith('https://') ? rawWeb : `https://${rawWeb}`)
        : '';

      // 1. Create Lab Document in Pending Approval state with all real parameters
      const labRef = await addDoc(collection(db, 'labs'), {
        name: formData.name.trim(),
        slogan: formData.slogan.trim(),
        tagline: formData.slogan.trim(),
        location: formData.location.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        contactNumber: formData.phone.trim(),
        email: formData.email.trim(),
        contactEmail: formData.email.trim(),
        website: formattedWebsite,
        websiteUrl: formattedWebsite,
        licenseNumber: formData.licenseNumber.trim(),
        taxId: formData.taxId.trim(),
        currency: formData.currency || 'FCFA',
        currencySymbol: formData.currencySymbol || 'FCFA',
        directorName: formData.directorName.trim(),
        directorPhone: formData.directorPhone.trim(),
        description: formData.description.trim(),
        logoUrl: formData.logoUrl || null,
        avatarUrl: formData.logoUrl || null,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        patientCount: 0,
        confirmedTestsCount: 0,
        totalTestsCount: 0,
        royaltyEarnings: 0,
        staffCount: 1,
        
        // Pending approval workflow & Human verification confirmation
        status: 'pending_approval',
        confirmed: false,
        humanVerified: true,
        humanVerifiedAt: new Date().toISOString(),
        
        // Commercial Model Setup
        pricingModel: formData.pricingModel,
        subscriptionPlan: formData.pricingModel,
        subscriptionTier: formData.subscriptionTier,
        subscriptionPrice: subPrice,
        subscriptionStartDate: new Date().toISOString(),
        billingPeriod: formData.billingPeriod,
        monthlyMaintenanceFee: formData.pricingModel === 'lifetime_space' ? formData.monthlyMaintenanceFee : 0,
        feePerPatient: formData.pricingModel === 'pay_per_test' ? formData.feePerTest : 0,
        feePerTest: formData.pricingModel === 'pay_per_test' ? formData.feePerTest : 0,
        defaultDoctorCommissionRate: Number(formData.defaultDoctorCommissionRate) || 20,
        staffLimit: formData.staffLimit,
        sitesCount: formData.sitesCount,
        collectionCentresCount: formData.sitesCount,
        verificationStatus: 'pending',

        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        authorizedRepresentativeConfirmed: true,
        createdAt: new Date().toISOString()
      });

      const labId = labRef.id;

      // 2. Create Initial Admin Account with temporary passcode & first-login change password flag
      await addDoc(collection(db, 'labs', labId, 'staff'), {
        name: formData.adminName.trim(),
        email: formData.adminEmail.trim(),
        phone: formData.adminPhone.trim() || formData.phone.trim(),
        accessCode: formData.accessCode || 'ADM-8800',
        role: 'admin',
        roles: ['admin', 'receptionist', 'cashier', 'analyzer', 'lab_tech'],
        labId: labId,
        labName: formData.name.trim(),
        mustChangePassword: true,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      // 3. Dispatch Official Welcome Email to Laboratory Administrator
      try {
        await sendLabWelcomeEmail({
          labName: formData.name.trim(),
          adminName: formData.adminName.trim(),
          adminEmail: formData.adminEmail.trim(),
          accessCode: formData.accessCode || 'ADM-8800',
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          location: formData.location.trim(),
          website: formattedWebsite,
          licenseNumber: formData.licenseNumber.trim(),
          taxId: formData.taxId.trim(),
          pricingModel: formData.pricingModel === 'flat_subscription' 
            ? `Flat Subscription (${formData.subscriptionTier.toUpperCase()})` 
            : formData.pricingModel === 'pay_per_test' ? 'Pay-Per-Test' : 'Lifetime Space',
          tier: formData.subscriptionTier
        });
      } catch (mailErr) {
        console.warn('Lab welcome email dispatch note:', mailErr);
      }

      // 4. Seed Standard Test Catalog
      const defaultTests = [
        { name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 4500, turnaroundTime: '2-4 Hours', description: 'Full cellular analysis including WBC, RBC, Platelets' },
        { name: 'Malaria Microscopy & RDT', category: 'Parasitology', price: 2500, turnaroundTime: '1 Hour', description: 'Detection of Plasmodium species' },
        { name: 'Lipid Profile Panel', category: 'Biochemistry', price: 7000, turnaroundTime: '24 Hours', description: 'Total Cholesterol, HDL, LDL, Triglycerides' },
        { name: 'HbA1c Glycated Hemoglobin', category: 'Endocrinology', price: 6000, turnaroundTime: '24 Hours', description: 'Average blood sugar level over past 3 months' },
        { name: 'Urinalysis Comprehensive', category: 'Urinalysis', price: 3000, turnaroundTime: '2 Hours', description: 'Chemical and microscopic urine test' },
        { name: 'Hepatitis B & C Screening', category: 'Serology', price: 5000, turnaroundTime: '3 Hours', description: 'HBsAg and Anti-HCV rapid testing' }
      ];

      for (const test of defaultTests) {
        await addDoc(collection(db, 'labs', labId, 'testCatalog'), test);
      }

      setShowPendingApprovalModal(true);
    } catch (err) {
      console.error('Error creating lab center:', err);
      alert('Failed to provision lab center. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-150 my-auto">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Register Diagnostic Laboratory Center</h2>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Step {step} of 4 • Self-Service Facility Provisioning</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 text-[11px] sm:text-xs font-semibold shrink-0">
          <div className={`p-2.5 sm:p-3 text-center border-r border-slate-200/60 flex items-center justify-center gap-1.5 ${step >= 1 ? 'text-teal-700 bg-teal-50/60 font-bold' : 'text-slate-500'}`}>
            <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>1</span>
            <span className="hidden sm:inline text-slate-900">General Info</span>
            <span className="sm:hidden text-slate-900">Info</span>
          </div>
          <div className={`p-2.5 sm:p-3 text-center border-r border-slate-200/60 flex items-center justify-center gap-1.5 ${step >= 2 ? 'text-teal-700 bg-teal-50/60 font-bold' : 'text-slate-500'}`}>
            <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>2</span>
            <span className="hidden sm:inline text-slate-900">Pricing & Plan</span>
            <span className="sm:hidden text-slate-900">Pricing</span>
          </div>
          <div className={`p-2.5 sm:p-3 text-center border-r border-slate-200/60 flex items-center justify-center gap-1.5 ${step >= 3 ? 'text-teal-700 bg-teal-50/60 font-bold' : 'text-slate-500'}`}>
            <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>3</span>
            <span className="hidden sm:inline text-slate-900">Theme</span>
            <span className="sm:hidden text-slate-900">Theme</span>
          </div>
          <div className={`p-2.5 sm:p-3 text-center flex items-center justify-center gap-1.5 ${step === 4 ? 'text-teal-700 bg-teal-50/60 font-bold' : 'text-slate-500'}`}>
            <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>4</span>
            <span className="hidden sm:inline text-slate-900">Admin & Legal</span>
            <span className="sm:hidden text-slate-900">Admin</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-900">
          {step === 1 && (
            <div className="space-y-4">
              {/* Logo / Profile Picture Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  Laboratory Logo / Profile Picture
                </label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  {formData.logoUrl ? (
                    <div className="relative group">
                      <img
                        src={formData.logoUrl}
                        alt="Lab Logo"
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, logoUrl: '' }))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 cursor-pointer"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-teal-100/80 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-xl shrink-0">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : <ImageIcon className="w-6 h-6 text-teal-600" />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-teal-400 transition-all cursor-pointer shadow-2xs">
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                          <span className="text-slate-800">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-slate-800">{formData.logoUrl ? 'Change Logo Picture' : 'Upload Lab Profile Picture'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500 mt-1 font-normal">
                      PNG, JPG, SVG or WebP. Displayed on headers, invoices & reports.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Laboratory Facility Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hope Diagnostic & Pathology Center"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Slogan / Sub-Header
                </label>
                <input
                  type="text"
                  placeholder="e.g. Precision Medical Diagnostics & Blood Analysis"
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Primary City / Region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos, Ikeja / Douala, Littoral"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Physical Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14 Allen Avenue / Boulevard de la Liberte"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Official Telephone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="+234 800 000 0000 / +237 600 000 000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Printed directly on receipts and patient diagnostic reports</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Official Contact Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      placeholder="lab@facility.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">For lab report notifications and official receipts</p>
                </div>
              </div>

              {/* Website URL & Clinical License Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Laboratory Website / Portal (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. www.hopediagnostics.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full pl-10 p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Patients will see your direct link on digital reports & receipts</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Clinical License / Accreditation No.
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. MOH/LAB/2026/8841 or ISO 15189"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full pl-10 p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Appears on official pathologist sign-off headers</p>
                </div>
              </div>

              {/* Tax ID & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Tax ID / VAT Registration
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. TIN-992834812-M"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full pl-10 p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Operating Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => {
                      const cur = e.target.value;
                      let sym = 'FCFA';
                      if (cur === 'USD') sym = '$';
                      else if (cur === 'EUR') sym = '€';
                      else if (cur === 'NGN') sym = '₦';
                      else if (cur === 'GHS') sym = 'GH₵';
                      else if (cur === 'KES') sym = 'KSh';
                      else if (cur === 'INR') sym = '₹';
                      setFormData({ ...formData, currency: cur, currencySymbol: sym });
                    }}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white cursor-pointer"
                  >
                    <option value="FCFA">FCFA (XAF / XOF)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="NGN">NGN (₦ - Nigerian Naira)</option>
                    <option value="GHS">GHS (GH₵ - Ghanaian Cedi)</option>
                    <option value="KES">KES (KSh - Kenyan Shilling)</option>
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                  </select>
                </div>
              </div>

              {/* Pathologist / Medical Director */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Medical Director / Head Pathologist
                  </label>
                  <div className="relative">
                    <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Dr. Arthur M. Vance, MD, FRCPath"
                      value={formData.directorName}
                      onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                      className="w-full pl-10 p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Director Phone / Emergency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +234 802 345 6789"
                    value={formData.directorPhone}
                    onChange={(e) => setFormData({ ...formData, directorPhone: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200/80 flex items-center justify-between gap-3 text-teal-950">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-teal-950">Transparent Commercial Models</h4>
                    <p className="text-[11px] text-teal-900 font-medium">100% of patient diagnostic test revenue is retained directly by your laboratory.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-teal-600 text-white rounded-full text-[10px] font-bold tracking-wide">
                  Zero Hidden Costs
                </span>
              </div>

              {/* 3 Main Commercial Models Tabs */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Select Your Preferred Commercial Billing Structure
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Option 1: Pay-Per-Test */}
                  <div
                    onClick={() => handleSelectPricingModel('pay_per_test')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      formData.pricingModel === 'pay_per_test'
                        ? 'border-teal-600 bg-teal-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Zap className="w-4 h-4 text-amber-500" />
                        {formData.pricingModel === 'pay_per_test' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Pay-Per-Test</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">500 FCFA / test processed</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md">
                        Zero Upfront Cost
                      </span>
                    </div>
                  </div>

                  {/* Option 2: Flat Subscription (Recommended) */}
                  <div
                    onClick={() => handleSelectPricingModel('flat_subscription')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                      formData.pricingModel === 'flat_subscription'
                        ? 'border-teal-600 bg-teal-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Most Popular
                    </span>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Layers className="w-4 h-4 text-teal-600" />
                        {formData.pricingModel === 'flat_subscription' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Flat Subscription</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Unlimited tests • Flat monthly fee</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        Priced by Staff & Sites
                      </span>
                    </div>
                  </div>

                  {/* Option 3: Lifetime Cloud Space */}
                  <div
                    onClick={() => handleSelectPricingModel('lifetime_space')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      formData.pricingModel === 'lifetime_space'
                        ? 'border-teal-600 bg-teal-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <HardDrive className="w-4 h-4 text-purple-500" />
                        {formData.pricingModel === 'lifetime_space' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Lifetime Space</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">15k FCFA / mo maintenance</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded-md">
                        Permanent Asset
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Dynamic Tier Selector when Flat Subscription is picked */}
              {formData.pricingModel === 'flat_subscription' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Choose Your Monthly Capacity Tier
                    </label>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, billingPeriod: 'monthly' }))}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                          formData.billingPeriod === 'monthly' ? 'bg-teal-600 text-white' : 'text-slate-700'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, billingPeriod: 'annual' }))}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                          formData.billingPeriod === 'annual' ? 'bg-teal-600 text-white' : 'text-slate-700'
                        }`}
                      >
                        Annual (2 Mo Free)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Starter Tier - Private Clinics */}
                    <div
                      onClick={() => handleSelectTier('starter')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        formData.subscriptionTier === 'starter'
                          ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Private Clinic / Solo</span>
                          <span className="text-[10px] text-teal-700 font-semibold">600–1,000+ tests/mo</span>
                        </div>
                        {formData.subscriptionTier === 'starter' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <div className="mt-2 text-sm font-black text-teal-700">
                        {formData.billingPeriod === 'annual' ? '250,000 FCFA / yr' : '25,000 FCFA / mo'}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">~₦75,000 / $48 / mo</p>
                      <ul className="mt-2 text-[10px] text-slate-700 font-medium space-y-0.5">
                        <li>• Complete Diagnostic Intake</li>
                        <li>• Up to 5 Staff Workstations</li>
                        <li>• 1 Dedicated Laboratory</li>
                        <li>• Cashier & Analyzer Routing</li>
                      </ul>
                    </div>

                    {/* Professional Tier - District / Public Hospitals */}
                    <div
                      onClick={() => handleSelectTier('growth')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        formData.subscriptionTier === 'growth'
                          ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <span className="absolute -top-2 right-2 bg-teal-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                        District Hospitals ⭐
                      </span>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">District Hospital Lab</span>
                          <span className="text-[10px] text-teal-700 font-semibold">1,300–1,400 tests/mo</span>
                        </div>
                        {formData.subscriptionTier === 'growth' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <div className="mt-2 text-sm font-black text-teal-700">
                        {formData.billingPeriod === 'annual' ? '450,000 FCFA / yr' : '45,000 FCFA / mo'}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">~₦100,000 / $72 / mo</p>
                      <ul className="mt-2 text-[10px] text-slate-700 font-medium space-y-0.5">
                        <li>• Decoupled Per-Test Processing</li>
                        <li>• Up to 15 Clinical Staff</li>
                        <li>• 1 Primary Lab + 2 Sampling Hubs</li>
                        <li>• Fast Phlebotomy Barcodes</li>
                      </ul>
                    </div>

                    {/* Business Tier - Regional Reference Hospitals */}
                    <div
                      onClick={() => handleSelectTier('business')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        formData.subscriptionTier === 'business'
                          ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Regional Reference Center</span>
                          <span className="text-[10px] text-teal-700 font-semibold">2,000+ tests/mo</span>
                        </div>
                        {formData.subscriptionTier === 'business' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <div className="mt-2 text-sm font-black text-teal-700">
                        {formData.billingPeriod === 'annual' ? '750,000 FCFA / yr' : '75,000 FCFA / mo'}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">~₦180,000 / $120 / mo</p>
                      <ul className="mt-2 text-[10px] text-slate-700 font-medium space-y-0.5">
                        <li>• Unlimited Attending Staff</li>
                        <li>• Multi-Site Sampling Network</li>
                        <li>• AI Diagnostic Insights</li>
                        <li>• Secure Physician Report Emailing</li>
                      </ul>
                    </div>

                  </div>
                </div>
              )}

              {/* Pay-Per-Test summary notice */}
              {formData.pricingModel === 'pay_per_test' && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Pay-Per-Test Operating Structure
                  </p>
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    Zero monthly baseline software fees. You are billed strictly <strong>500 FCFA (~₦500 / $0.80)</strong> per completed and released test report. Unlimited staff logins and 24/7 patient portal are included with zero upfront commitment.
                  </p>
                </div>
              )}

              {/* Lifetime Space summary notice */}
              {formData.pricingModel === 'lifetime_space' && (
                <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-purple-900">
                    <HardDrive className="w-4 h-4 text-purple-600" />
                    Lifetime Dedicated Cloud Tenant
                  </p>
                  <p className="text-[11px] text-purple-900 leading-relaxed font-medium">
                    Perpetual cloud allocation with an ongoing <strong>15,000 FCFA (~₦25,000 / $25) / month</strong> maintenance fee covering cryptographic key derivation, automated encrypted backups, continuous zero-knowledge security patches, and 24/7 support SLA.
                  </p>
                </div>
              )}

              {/* Capacity Limit Quick Adjusters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Staff User Limit</span>
                  <span className="text-sm font-bold text-slate-900">{formData.staffLimit === 999 ? 'Unlimited' : `${formData.staffLimit} Staff Logins`}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Included Sites / Centres</span>
                  <span className="text-sm font-bold text-slate-900">{formData.sitesCount} Physical Location(s)</span>
                </div>
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Doctor Referral Comm. %</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.defaultDoctorCommissionRate}
                      onChange={(e) => setFormData({ ...formData, defaultDoctorCommissionRate: Number(e.target.value) })}
                      className="w-16 px-2 py-0.5 text-xs font-bold text-slate-900 bg-white border border-teal-300 rounded-md text-center focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-teal-800">% (Std 20%)</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 flex items-center gap-3 text-teal-900 text-sm font-medium">
                <Palette className="w-5 h-5 text-teal-600 shrink-0" />
                Customize the visual identity and accent theme for this laboratory instance.
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 p-3 bg-white border border-slate-300 rounded-xl text-sm uppercase font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Preview Color Accent Card
                </label>
                <div 
                  className="p-6 rounded-2xl text-white shadow-md flex justify-between items-center transition-all"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  <div className="flex items-center gap-3">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo"
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-white/40 shadow-xs bg-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg border border-white/30 text-white">
                        {formData.name ? formData.name.charAt(0).toUpperCase() : 'L'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-lg text-white">{formData.name || 'Sample Lab Name'}</h4>
                      <p className="text-xs text-white/90 font-medium">{formData.location || 'Location Preview'}</p>
                    </div>
                  </div>
                  <Sparkles className="w-6 h-6 text-white/80" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3 text-amber-950 text-sm font-medium">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                Configure the primary Laboratory Administrator credentials who will manage this location.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Administrator Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sarah Johnson / Lab Director"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Admin Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="admin@lab.com"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Admin Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+237 670000000 / +234 800 000 0000"
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    Administrator Access Code
                  </label>
                  <button
                    type="button"
                    onClick={generateAccessCode}
                    className="text-xs text-teal-600 hover:text-teal-700 font-bold cursor-pointer"
                  >
                    Regenerate Code
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. LABADM88"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })}
                    className="w-full p-3 pl-10 bg-white border border-slate-300 rounded-xl text-sm font-mono tracking-wider font-bold text-slate-900 uppercase placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 font-normal">This code is used by the administrator to authenticate and unlock roles.</p>
              </div>

              {/* Facility Terms & Conditions Agreement Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Facility Agreement & Legal Consent <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 underline cursor-pointer"
                  >
                    Read Full Terms
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Selected Plan Commercial Summary */}
                <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-xl text-xs text-teal-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-teal-900">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    Selected Commercial Model: {
                      formData.pricingModel === 'pay_per_test' ? 'Pay-Per-Test (500 FCFA baseline / test)' :
                      formData.pricingModel === 'flat_subscription' ? `Flat Subscription (${formData.subscriptionTier.toUpperCase()} - Unlimited Tests)` :
                      'Lifetime Dedicated Cloud Space (15,000 FCFA/mo maintenance)'
                    }
                  </p>
                  <p className="text-[11px] text-teal-900 leading-relaxed font-medium">
                    100% of patient diagnostic fees are retained directly by your laboratory. You maintain complete pricing autonomy with zero predatory ticket surcharges.
                  </p>
                </div>

                {/* Checkbox 1: Terms and Conditions */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-800 font-medium">
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTermsModal(true);
                      }}
                      className="text-teal-700 font-bold underline hover:text-teal-900"
                    >
                      Terms and Conditions for Laboratory Registration
                    </button>
                  </span>
                </label>

                {/* Checkbox 2: Authorized Representative */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={authorizedRepConfirmed}
                    onChange={e => setAuthorizedRepConfirmed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-800 font-semibold">
                    I confirm I am authorized to register this Facility and bind it to these terms
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-teal-600/20 cursor-pointer transition-colors"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleInitiateHumanVerification}
              disabled={loading || otpSending || !termsAccepted || !authorizedRepConfirmed}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {otpSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Verification Code...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Verify Email & Provision Lab
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* Human Verification OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-slate-900 relative">
            <button
              onClick={() => {
                setShowOtpModal(false);
                setOtpError('');
                setOtpCode('');
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Human & Admin Verification
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                A 6-digit verification code has been dispatched to <strong className="text-slate-800">{formData.adminEmail}</strong> to confirm legitimate human administrator identity.
              </p>
            </div>

            {otpSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{otpSuccessMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 text-center uppercase tracking-wider">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setOtpCode(val);
                  setOtpError('');
                }}
                placeholder="• • • • • •"
                className="w-full text-center py-3.5 px-4 bg-slate-50 border-2 border-teal-500/40 rounded-2xl text-2xl font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/20 transition-all shadow-inner"
              />
            </div>

            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleVerifyOtpAndProvision}
                disabled={otpVerifying || otpCode.length !== 6}
                className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating Security Credentials...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Code & Complete Registration
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleInitiateHumanVerification}
                disabled={otpSending}
                className="w-full py-2 text-xs text-slate-500 hover:text-teal-700 font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${otpSending ? 'animate-spin' : ''}`} />
                Resend Code to {formData.adminEmail}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Terms Modal */}
      <LabTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setAuthorizedRepConfirmed(true);
        }}
        accepted={termsAccepted && authorizedRepConfirmed}
      />

      {/* Pending Approval Confirmation Modal */}
      {showPendingApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-teal-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-mono font-bold text-xs uppercase tracking-wider">
                Awaiting nanoLabs Approval (Max 24Hrs)
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Laboratory Registered & Pending Permission
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                <strong className="text-teal-300">{formData.name}</strong> has been successfully registered. To maintain security, medical compliance, and license integrity, your lab is currently <strong className="text-amber-300">awaiting SuperAdmin verification</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Admin Access Code:</span>
                <span className="text-teal-300 font-bold">{formData.accessCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Pending Verification
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Activation:</span>
                <span className="text-white font-bold">Within 24 Hours</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPendingApprovalModal(false);
                if (onLabCreated) onLabCreated();
                onClose(); 
              }}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              Understood & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabRegistrationModal;
