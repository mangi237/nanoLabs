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
  CheckCircle2
} from 'lucide-react';
import { collection, addDoc, db } from '../../services/firebase';
import { uploadService } from '../../api/upload';
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

  // Facility Terms & Conditions state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authorizedRepConfirmed, setAuthorizedRepConfirmed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Info
    name: '',
    slogan: 'Precision Diagnostics & Clinical Research',
    location: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    logoUrl: '',
    
    // Step 2: Commercial Pricing Model & Capacity
    pricingModel: 'flat_subscription' as PricingModelType,
    subscriptionTier: 'growth' as SubscriptionTierType,
    billingPeriod: 'monthly' as 'monthly' | 'annual',
    feePerTest: 500,
    monthlyMaintenanceFee: 15000,
    staffLimit: 12,
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
        staffLimit: 12,
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
    if (tier === 'starter') {
      staff = 5;
      sites = 1;
    } else if (tier === 'growth') {
      staff = 12;
      sites = 2;
    } else if (tier === 'business') {
      staff = 25;
      sites = 3;
    } else if (tier === 'enterprise') {
      staff = 999;
      sites = 10;
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
        alert('Please fill in Lab Name and Primary Location.');
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
    
    if (formData.subscriptionTier === 'starter') {
      return formData.billingPeriod === 'annual' ? 250000 : 25000;
    }
    if (formData.subscriptionTier === 'growth') {
      return formData.billingPeriod === 'annual' ? 550000 : 55000;
    }
    if (formData.subscriptionTier === 'business') {
      return formData.billingPeriod === 'annual' ? 1200000 : 120000;
    }
    return 0;
  };

  const handleSubmit = async () => {
    if (!formData.adminName.trim() || !formData.adminEmail.trim()) {
      alert('Please fill in Lab Administrator credentials.');
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

    setLoading(true);
    try {
      const subPrice = getSubscriptionPrice();

      // 1. Create Lab Document
      const labRef = await addDoc(collection(db, 'labs'), {
        name: formData.name.trim(),
        slogan: formData.slogan.trim(),
        location: formData.location.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
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
        status: 'active',
        
        // Commercial Model Setup
        pricingModel: formData.pricingModel,
        subscriptionTier: formData.subscriptionTier,
        subscriptionPrice: subPrice,
        billingPeriod: formData.billingPeriod,
        monthlyMaintenanceFee: formData.pricingModel === 'lifetime_space' ? formData.monthlyMaintenanceFee : 0,
        feePerPatient: formData.pricingModel === 'pay_per_test' ? formData.feePerTest : 0,
        feePerTest: formData.pricingModel === 'pay_per_test' ? formData.feePerTest : 0,
        staffLimit: formData.staffLimit,
        sitesCount: formData.sitesCount,
        collectionCentresCount: formData.sitesCount,
        verificationStatus: 'verified',

        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        authorizedRepresentativeConfirmed: true,
        createdAt: new Date().toISOString()
      });

      const labId = labRef.id;

      // 2. Create Initial Admin Account
      await addDoc(collection(db, 'labs', labId, 'staff'), {
        name: formData.adminName.trim(),
        email: formData.adminEmail.trim(),
        phone: formData.adminPhone.trim(),
        accessCode: formData.accessCode || 'ADMIN1',
        role: 'admin',
        roles: ['admin', 'receptionist', 'cashier', 'analyzer', 'lab_tech'],
        labId: labId,
        labName: formData.name.trim(),
        createdAt: new Date().toISOString()
      });

      // 3. Seed Standard Test Catalog with turnaround times
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

      if (onLabCreated) onLabCreated();
      onClose();
    } catch (err) {
      console.error('Error creating lab center:', err);
      alert('Failed to provision lab center. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-150 my-auto">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg sm:text-xl font-bold">Register Diagnostic Laboratory Center</h2>
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
          <div className={`p-2.5 sm:p-3 text-center border-r border-slate-200/60 flex items-center justify-center gap-1.5 ${step >= 1 ? 'text-teal-700 bg-teal-50/60' : 'text-slate-400'}`}>
            <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
            <span className="hidden sm:inline">General Info</span>
            <span className="sm:hidden">Info</span>
          </div>
          <div className={`p-2.5 sm:p-3 text-center border-r border-slate-200/60 flex items-center justify-center gap-1.5 ${step >= 2 ? 'text-teal-700 bg-teal-50/60' : 'text-slate-400'}`}>
            <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
            <span className="hidden sm:inline">Pricing & Plan</span>
            <span className="sm:hidden">Pricing</span>
          </div>
          <div className={`p-2.5 sm:p-3 text-center border-r border-slate-200/60 flex items-center justify-center gap-1.5 ${step >= 3 ? 'text-teal-700 bg-teal-50/60' : 'text-slate-400'}`}>
            <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
            <span className="hidden sm:inline">Theme</span>
            <span className="sm:hidden">Theme</span>
          </div>
          <div className={`p-2.5 sm:p-3 text-center flex items-center justify-center gap-1.5 ${step === 4 ? 'text-teal-700 bg-teal-50/60' : 'text-slate-400'}`}>
            <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>4</span>
            <span className="hidden sm:inline">Admin & Legal</span>
            <span className="sm:hidden">Admin</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              {/* Logo / Profile Picture Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Laboratory Logo / Profile Picture
                </label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  {formData.logoUrl ? (
                    <div className="relative group">
                      <img
                        src={formData.logoUrl}
                        alt="Lab Logo"
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs"
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
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-teal-400 transition-all cursor-pointer shadow-2xs">
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 text-teal-600" />
                          <span>{formData.logoUrl ? 'Change Logo Picture' : 'Upload Lab Profile Picture'}</span>
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
                    <p className="text-[11px] text-slate-400 mt-1">
                      PNG, JPG, SVG or WebP. Displayed on headers, invoices & reports.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Laboratory Facility Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hope Diagnostic & Pathology Center"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Slogan / Sub-Header
                </label>
                <input
                  type="text"
                  placeholder="e.g. Precision Medical Diagnostics & Blood Analysis"
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Primary City / Region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos, Ikeja / Douala, Littoral"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Physical Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14 Allen Avenue / Boulevard de la Liberte"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Official Telephone
                  </label>
                  <input
                    type="text"
                    placeholder="+234 800 000 0000 / +237 600 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Official Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="lab@facility.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
                    <h4 className="text-xs font-bold">Transparent Commercial Models</h4>
                    <p className="text-[11px] text-teal-800">100% of patient diagnostic test revenue is retained directly by your laboratory.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-teal-600 text-white rounded-full text-[10px] font-bold tracking-wide">
                  Zero Hidden Costs
                </span>
              </div>

              {/* 3 Main Commercial Models Tabs */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
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
                      <p className="text-[11px] text-slate-500 mt-0.5">500 FCFA / test processed</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md">
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
                      <p className="text-[11px] text-slate-500 mt-0.5">Unlimited tests • Flat monthly fee</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
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
                      <p className="text-[11px] text-slate-500 mt-0.5">15k FCFA / mo maintenance</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
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
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Choose Your Monthly Capacity Tier
                    </label>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, billingPeriod: 'monthly' }))}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                          formData.billingPeriod === 'monthly' ? 'bg-teal-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, billingPeriod: 'annual' }))}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                          formData.billingPeriod === 'annual' ? 'bg-teal-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        Annual (2 Mo Free)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Starter Tier */}
                    <div
                      onClick={() => handleSelectTier('starter')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        formData.subscriptionTier === 'starter'
                          ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-900">Starter Lab</span>
                        {formData.subscriptionTier === 'starter' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <div className="mt-2 text-sm font-black text-teal-700">
                        {formData.billingPeriod === 'annual' ? '250,000 FCFA / yr' : '25,000 FCFA / mo'}
                      </div>
                      <p className="text-[10px] text-slate-400">~₦75,000 / $48 / mo</p>
                      <ul className="mt-2 text-[10px] text-slate-600 space-y-0.5">
                        <li>• Unlimited Diagnostic Tests</li>
                        <li>• Up to 5 Staff Seats</li>
                        <li>• 1 Primary Laboratory</li>
                      </ul>
                    </div>

                    {/* Professional Tier */}
                    <div
                      onClick={() => handleSelectTier('growth')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                        formData.subscriptionTier === 'growth'
                          ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <span className="absolute -top-2 right-2 bg-teal-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        Recommended
                      </span>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-900">Professional Lab ⭐</span>
                        {formData.subscriptionTier === 'growth' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <div className="mt-2 text-sm font-black text-teal-700">
                        {formData.billingPeriod === 'annual' ? '550,000 FCFA / yr' : '55,000 FCFA / mo'}
                      </div>
                      <p className="text-[10px] text-slate-400">~₦120,000 / $76 / mo</p>
                      <ul className="mt-2 text-[10px] text-slate-600 space-y-0.5">
                        <li>• Unlimited Diagnostic Tests</li>
                        <li>• Up to 12 Staff Seats</li>
                        <li>• 1 Lab + 2 Collection Centres</li>
                      </ul>
                    </div>

                    {/* Business Tier */}
                    <div
                      onClick={() => handleSelectTier('business')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        formData.subscriptionTier === 'business'
                          ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-900">Business Lab</span>
                        {formData.subscriptionTier === 'business' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <div className="mt-2 text-sm font-black text-teal-700">
                        {formData.billingPeriod === 'annual' ? '1,200,000 FCFA / yr' : '120,000 FCFA / mo'}
                      </div>
                      <p className="text-[10px] text-slate-400">~₦200,000 / $127 / mo</p>
                      <ul className="mt-2 text-[10px] text-slate-600 space-y-0.5">
                        <li>• Unlimited Diagnostic Tests</li>
                        <li>• Up to 25 Staff Seats</li>
                        <li>• 3 Labs + 5 Collection Centres</li>
                      </ul>
                    </div>

                  </div>
                </div>
              )}

              {/* Pay-Per-Test summary notice */}
              {formData.pricingModel === 'pay_per_test' && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Pay-Per-Test Operating Structure
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Zero monthly baseline software fees. You are billed strictly <strong>500 FCFA (~₦500 / $0.80)</strong> per completed and released test report. Unlimited staff logins and 24/7 patient portal are included with zero upfront commitment.
                  </p>
                </div>
              )}

              {/* Lifetime Space summary notice */}
              {formData.pricingModel === 'lifetime_space' && (
                <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 text-xs text-purple-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-purple-800">
                    <HardDrive className="w-4 h-4 text-purple-600" />
                    Lifetime Dedicated Cloud Tenant
                  </p>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Perpetual cloud allocation with an ongoing <strong>15,000 FCFA (~₦25,000 / $25) / month</strong> maintenance fee covering cryptographic key derivation, automated encrypted backups, continuous zero-knowledge security patches, and 24/7 support SLA.
                  </p>
                </div>
              )}

              {/* Capacity Limit Quick Adjusters */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Staff User Limit</span>
                  <span className="text-sm font-bold text-slate-900">{formData.staffLimit === 999 ? 'Unlimited' : `${formData.staffLimit} Staff Logins`}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Included Sites / Centres</span>
                  <span className="text-sm font-bold text-slate-900">{formData.sitesCount} Physical Location(s)</span>
                </div>
              </div>

            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 flex items-center gap-3 text-teal-800 text-sm">
                <Palette className="w-5 h-5 text-teal-600 shrink-0" />
                Customize the visual identity and accent theme for this laboratory instance.
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
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
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
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
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg border border-white/30">
                        {formData.name ? formData.name.charAt(0).toUpperCase() : 'L'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-lg">{formData.name || 'Sample Lab Name'}</h4>
                      <p className="text-xs opacity-90">{formData.location || 'Location Preview'}</p>
                    </div>
                  </div>
                  <Sparkles className="w-6 h-6 opacity-80" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3 text-amber-900 text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                Configure the primary Laboratory Administrator credentials who will manage this location.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Administrator Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sarah Johnson / Lab Director"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Admin Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="admin@lab.com"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Admin Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+237 670000000 / +234 800 000 0000"
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Administrator Access Code
                  </label>
                  <button
                    type="button"
                    onClick={generateAccessCode}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
                  >
                    Regenerate Code
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. LABADM88"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })}
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-wider font-bold text-slate-800 uppercase focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">This code is used by the administrator to authenticate and unlock roles.</p>
              </div>

              {/* Facility Terms & Conditions Agreement Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Facility Agreement & Legal Consent <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1 underline cursor-pointer"
                  >
                    Read Full Terms
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Selected Plan Commercial Summary */}
                <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-xl text-xs text-teal-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-teal-800">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    Selected Commercial Model: {
                      formData.pricingModel === 'pay_per_test' ? 'Pay-Per-Test (500 FCFA baseline / test)' :
                      formData.pricingModel === 'flat_subscription' ? `Flat Subscription (${formData.subscriptionTier.toUpperCase()} - Unlimited Tests)` :
                      'Lifetime Dedicated Cloud Space (15,000 FCFA/mo maintenance)'
                    }
                  </p>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
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
                  <span className="text-xs text-slate-700">
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTermsModal(true);
                      }}
                      className="text-teal-600 font-bold underline hover:text-teal-800"
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
                  <span className="text-xs text-slate-700 font-medium">
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
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors"
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
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-teal-600/20 cursor-pointer transition-colors"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !termsAccepted || !authorizedRepConfirmed}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Provisioning Center...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Agree & Complete Lab Provisioning
                </>
              )}
            </button>
          )}
        </div>

      </div>

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
    </div>
  );
};

export default LabRegistrationModal;
