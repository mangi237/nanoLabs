import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { authService } from '../../services/authService';
import { sendEmail } from '../../services/emailService';
import { 
  X, 
  Mail, 
  User, 
  DollarSign, 
  Microscope, 
  TestTube, 
  Shield, 
  Package, 
  CheckCircle, 
  Loader2, 
  ShieldCheck, 
  Key, 
  Copy, 
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Phone
} from 'lucide-react';

interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
  onStaffAdded: () => void;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({ visible, onClose, onStaffAdded }) => {
  const { lab, user: adminUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdStaffResult, setCreatedStaffResult] = useState<{
    staffId: string;
    accessCode: string;
    name: string;
    roles: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const generateRandomCode = (role: string) => {
    const prefixes: Record<string, string> = {
      receptionist: 'REC',
      cashier: 'CSH',
      analyzer: 'LAB',
      labtech: 'TECH',
      biologist: 'BIO',
      admin: 'ADM',
      inventory_manager: 'INV'
    };
    const prefix = prefixes[role] || 'STAFF';
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${num}`;
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    primaryRole: 'receptionist',
    roles: ['receptionist'],
    accessCode: 'REC-4821'
  });

  useEffect(() => {
    if (visible) {
      setErrorMessage('');
      setCreatedStaffResult(null);
      setCopied(false);
      const code = generateRandomCode('receptionist');
      setFormData({
        name: '',
        email: '',
        phone: '',
        primaryRole: 'receptionist',
        roles: ['receptionist'],
        accessCode: code
      });
    }
  }, [visible]);

  if (!visible) return null;

  const roleOptions = [
    { value: 'receptionist', label: 'Receptionist', icon: User, codePrefix: 'REC' },
    { value: 'cashier', label: 'Cashier', icon: DollarSign, codePrefix: 'CSH' },
    { value: 'analyzer', label: 'Analyzer / Phlebotomist', icon: Microscope, codePrefix: 'LAB' },
    { value: 'labtech', label: 'Lab Technologist', icon: TestTube, codePrefix: 'TECH' },
    { value: 'biologist', label: 'Biologist / Pathologist', icon: ShieldCheck, codePrefix: 'BIO' },
    { value: 'admin', label: 'Lab Administrator', icon: Shield, codePrefix: 'ADM' },
    { value: 'inventory_manager', label: 'Inventory Manager', icon: Package, codePrefix: 'INV' }
  ];

  const toggleRole = (role: string) => {
    let updatedRoles = [...formData.roles];
    if (updatedRoles.includes(role)) {
      if (updatedRoles.length > 1) {
        updatedRoles = updatedRoles.filter(r => r !== role);
      }
    } else {
      updatedRoles.push(role);
    }
    const primary = updatedRoles[0] || 'receptionist';
    setFormData(prev => ({ 
      ...prev, 
      roles: updatedRoles,
      primaryRole: primary
    }));
  };

  const handleRegenerateCode = () => {
    const newCode = generateRandomCode(formData.primaryRole);
    setFormData(prev => ({ ...prev, accessCode: newCode }));
  };

  const handleCopyCode = () => {
    if (createdStaffResult?.accessCode) {
      navigator.clipboard.writeText(createdStaffResult.accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Full name is required to create a staff member.');
      return;
    }

    if (!formData.accessCode.trim()) {
      setErrorMessage('Please provide an initial access code for the staff member.');
      return;
    }

    if (formData.roles.length === 0) {
      setErrorMessage('Please select at least one organizational role.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.createStaffWithCode(
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          roles: formData.roles,
          primaryRole: formData.roles[0],
          accessCode: formData.accessCode.trim().toUpperCase(),
          labId: lab?.id || 'lab-1',
          labName: lab?.name || 'nanoLabs Central Diagnostics'
        },
        adminUser
      );

      // Send welcome onboarding email with temporary access code if staff email is provided
      if (formData.email.trim()) {
        try {
          await sendEmail(
            formData.email.trim(),
            `Welcome to ${lab?.name || 'nanoLabs'} - Your Staff Access Code`,
            `Hello ${formData.name.trim()},\n\nYou have been registered as authorized clinical staff at ${lab?.name || 'nanoLabs Diagnostics'}.\n\nYour Temporary Access Code: ${result.accessCode}\nAssigned Roles: ${formData.roles.join(', ')}\n\nUpon logging in for the first time with this code, you will be prompted to set your permanent private password.\n\nPortal Login: https://nanolabs.health/login\n\nBest regards,\nClinical Administration Team`,
            {
              recipient_name: formData.name.trim(),
              access_code: result.accessCode,
              lab_name: lab?.name || 'nanoLabs Diagnostics'
            }
          );
        } catch (mailErr) {
          console.warn('Staff welcome email notice:', mailErr);
        }
      }

      setCreatedStaffResult({
        staffId: result.staffId,
        accessCode: result.accessCode,
        name: formData.name.trim(),
        roles: formData.roles
      });

      onStaffAdded();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to create staff member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-700 to-teal-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Key className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {createdStaffResult ? 'Staff Access Code Created' : 'Create Staff Member & Access Code'}
              </h2>
              <p className="text-xs text-teal-100">
                {createdStaffResult ? 'Ready for Hand-off & First-Time Setup' : 'Admin-Assigned Initial Code Protocol'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View (Code Handoff Screen) */}
        {createdStaffResult ? (
          <div className="p-6 space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Staff Account Created Successfully!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hand this initial access code directly to <span className="font-semibold text-slate-700">{createdStaffResult.name}</span>.
              </p>
            </div>

            {/* Access Code Highlight Card */}
            <div className="bg-gradient-to-br from-teal-900 to-slate-900 p-5 rounded-2xl text-white shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-teal-300 uppercase">
                  Initial Staff Access Code
                </span>
                <span className="text-[10px] bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full font-medium">
                  Single-Use / Pending First Login
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-white/10 p-3.5 rounded-xl border border-white/10">
                <div className="font-mono text-2xl font-black tracking-widest text-teal-300">
                  {createdStaffResult.accessCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    copied 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'bg-white text-slate-900 hover:bg-teal-50 shadow-md'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-300 flex items-start gap-2 pt-1">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong>First-Time Security Procedure:</strong> When {createdStaffResult.name} logs in with this code, nanoLabs will immediately prompt them to create their own permanent private code and explain why it must never be shared.
                </span>
              </div>
            </div>

            {/* Staff Summary */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Personnel Name:</span>
                <span className="font-semibold text-slate-800">{createdStaffResult.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Authorized Roles:</span>
                <span className="font-semibold text-teal-700 capitalize">
                  {createdStaffResult.roles.map(r => r.replace('_', ' ')).join(', ')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setCreatedStaffResult(null);
                  const code = generateRandomCode('receptionist');
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    primaryRole: 'receptionist',
                    roles: ['receptionist'],
                    accessCode: code
                  });
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
              >
                Add Another Staff Member
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Done & Return to Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Explanatory Info Card */}
            <div className="p-3.5 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
              <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Direct Code Assignment & Forced First-Time Change</span>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  As the Lab Administrator, you assign the staff member an initial access code. Upon their first login, nanoLabs will require them to create their own private secret code and explain why they must not share it.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Marcelle Ebongue, RN"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="staff@hospital.org"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone Number <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      placeholder="+237 670000000"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Roles Selection */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Assign Staff Organizational Roles <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-500">Select one or more functional authorizations</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {roleOptions.map(role => {
                  const IconComponent = role.icon;
                  const isSelected = formData.roles.includes(role.value);
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => toggleRole(role.value)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-xs font-bold ring-1 ring-teal-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                        <span className="truncate">{role.label}</span>
                      </div>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Initial Access Code Input with Generator */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                  Initial Access Code for Staff <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-800 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate New Code
                </button>
              </div>

              <div className="relative">
                <Key className="w-4 h-4 text-teal-600 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formData.accessCode}
                  onChange={e => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. REC-8492"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-teal-600/30 text-slate-900 font-mono text-base font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                You can use the auto-generated code or type a custom code. The staff member will use this to sign in once, after which they will be asked to replace it with their own confidential code.
              </p>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Staff & Generating Code...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Create Staff Member & Generate Code
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddStaffModal;
