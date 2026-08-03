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
  ShieldAlert
} from 'lucide-react';
import { collection, addDoc, db } from '../../services/firebase';

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

  const [formData, setFormData] = useState({
    // Step 1: Info
    name: '',
    slogan: 'Precision Diagnostics & Clinical Research',
    location: '',
    address: '',
    phone: '',
    email: '',
    description: '',
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
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        patientCount: 0,
        staffCount: 1,
        status: 'active',
        feePerPatient: 1000,
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

      // 3. Seed Standard Test Catalog
      const defaultTests = [
        { name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 4500, description: 'Full cellular analysis including WBC, RBC, Platelets' },
        { name: 'Malaria Microscopy & RDT', category: 'Parasitology', price: 2500, description: 'Detection of Plasmodium species' },
        { name: 'Lipid Profile Panel', category: 'Biochemistry', price: 7000, description: 'Total Cholesterol, HDL, LDL, Triglycerides' },
        { name: 'HbA1c Glycated Hemoglobin', category: 'Endocrinology', price: 6000, description: 'Average blood sugar level over past 3 months' },
        { name: 'Urinalysis Comprehensive', category: 'Urinalysis', price: 3000, description: 'Chemical and microscopic urine test' },
        { name: 'Hepatitis B & C Screening', category: 'Serology', price: 5000, description: 'HBsAg and Anti-HCV rapid testing' }
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
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold">
          <div className={`p-3 text-center border-r border-slate-200/60 flex items-center justify-center gap-2 ${step >= 1 ? 'text-teal-700 bg-teal-50/60' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
            General Info
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
                  <div>
                    <h4 className="font-bold text-lg">{formData.name || 'Sample Lab Name'}</h4>
                    <p className="text-xs opacity-90">{formData.location || 'Location Preview'}</p>
                  </div>
                  <Sparkles className="w-6 h-6 opacity-80" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3 text-amber-900 text-sm">
                <DollarSign className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>Super Admin Royalty Note:</strong> 1,000 FCFA registration fee will be automatically computed per patient record registered in this lab.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Lab Administrator Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alexis Vance"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Admin Email <span className="text-red-500">*</span>
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
                    Admin Phone
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Staff Access Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. LAB123"
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest font-bold uppercase"
                  />
                  <button
                    type="button"
                    onClick={generateAccessCode}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Generate Code
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Provisioning Lab...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Provision Lab Center
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
