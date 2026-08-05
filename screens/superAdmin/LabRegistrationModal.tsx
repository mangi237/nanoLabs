import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  Palette, 
  UserCheck, 
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
  ShieldCheck
} from 'lucide-react';
import { collection, addDoc, db } from '../../services/firebase';
import { uploadService } from '../../api/upload';
import LabTermsModal from '../../components/legal/LabTermsModal';

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
    // Step 2: Theme
    primaryColor: '#0D9488',
    secondaryColor: '#0F766E',
    accentColor: '#14B8A6',
    // Step 3: Admin
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

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.location.trim()) {
        alert('Please fill in Lab Name and Primary Location.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.accessCode) {
        generateAccessCode();
      }
      setStep(3);
    }
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
        feePerPatient: 1000,
        feePerTest: 1000,
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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <h2 className="text-xl font-bold">Register New Laboratory Center</h2>
            </div>
            <p className="text-slate-400 text-xs mt-1">Step {step} of 3 • Network Provisioning Wizard</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold">
          <div className={`p-3 text-center border-r border-slate-200/60 flex items-center justify-center gap-2 ${step >= 1 ? 'text-teal-700 bg-teal-50/60' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
            General Info & Logo
          </div>
          <div className={`p-3 text-center border-r border-slate-200/60 flex items-center justify-center gap-2 ${step >= 2 ? 'text-teal-700 bg-teal-50/60' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
            Branding Theme
          </div>
          <div className={`p-3 text-center flex items-center justify-center gap-2 ${step === 3 ? 'text-teal-700 bg-teal-50/60' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
            Admin Credentials
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
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
                  Laboratory Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. nanoLabs Douala Central"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Primary Location / Region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Douala, Littoral"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ave De La Liberte 45"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Official Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+237 600000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@labname.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 flex items-center gap-3 text-teal-800 text-sm">
                <Palette className="w-5 h-5 text-teal-600 shrink-0" />
                Customize the UI visual identity and primary accent theme for this laboratory instance.
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

          {step === 3 && (
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
                  placeholder="e.g. Dr. Sarah Johnson"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
                    placeholder="+237 670000000"
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
                    Read Laboratory Terms
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Free Software & 1000 XAF System Fee Notice */}
                <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-xl text-xs text-teal-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-teal-800">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    Software Free of Charge • 1,000 XAF System Fee
                  </p>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    The NanoLabs software is provided to the Facility free of charge with zero license or subscription fees. NanoLabs applies a <strong>System Fee of 1,000 XAF</strong> per applicable service transaction charged to the customer.
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
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
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

          {step < 3 ? (
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
