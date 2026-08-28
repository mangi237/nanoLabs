import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { authService } from '../../services/authService';
import { db, updateDoc, doc } from '../../services/firebase';
import { 
  X, 
  User, 
  DollarSign, 
  Microscope, 
  TestTube, 
  Shield, 
  Package, 
  CheckCircle, 
  Loader2, 
  Lock, 
  Mail, 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  ShieldCheck,
  Copy,
  RefreshCw,
  Key
} from 'lucide-react';

interface EditStaffModalProps {
  visible: boolean;
  onClose: () => void;
  staff: any;
  onStaffUpdated: () => void;
}

export const EditStaffModal: React.FC<EditStaffModalProps> = ({ visible, onClose, staff, onStaffUpdated }) => {
  const { lab, user: adminUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resettingCode, setResettingCode] = useState(false);
  const [newIssuedCode, setNewIssuedCode] = useState<string | null>(null);
  const [customResetCode, setCustomResetCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roles: ['receptionist']
  });

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

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        roles: staff.roles || [staff.role || 'receptionist']
      });
      setNewIssuedCode(null);
      setCopied(false);
      setCustomResetCode(generateRandomCode(staff.roles?.[0] || staff.role || 'receptionist'));
      setErrorMessage('');
    }
  }, [staff]);

  if (!visible || !staff) return null;

  const roleOptions = [
    { value: 'receptionist', label: 'Receptionist', icon: User },
    { value: 'cashier', label: 'Cashier', icon: DollarSign },
    { value: 'analyzer', label: 'Analyzer / Phlebotomist', icon: Microscope },
    { value: 'labtech', label: 'Lab Technologist', icon: TestTube },
    { value: 'biologist', label: 'Biologist / Pathologist', icon: ShieldCheck },
    { value: 'admin', label: 'Lab Administrator', icon: Shield },
    { value: 'inventory_manager', label: 'Inventory Manager', icon: Package }
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
    setFormData(prev => ({ ...prev, roles: updatedRoles }));
  };

  const handleResetAccessCode = async () => {
    setResettingCode(true);
    setErrorMessage('');
    setNewIssuedCode(null);
    setCopied(false);
    try {
      const codeToSet = customResetCode.trim() || generateRandomCode(formData.roles[0] || 'receptionist');
      const res = await authService.resetStaffAccessCode(
        staff.id,
        formData.email,
        codeToSet,
        lab?.id || 'lab-1',
        adminUser
      );
      setNewIssuedCode(res.accessCode);
      onStaffUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset access code.');
    } finally {
      setResettingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (newIssuedCode) {
      navigator.clipboard.writeText(newIssuedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Full name is a required field.');
      return;
    }

    if (formData.roles.length === 0) {
      setErrorMessage('Please select at least one role.');
      return;
    }

    setLoading(true);
    try {
      // 1. Update roles on server with audit log
      await authService.updateStaffRoles(
        staff.id,
        formData.email,
        formData.roles,
        formData.roles[0],
        adminUser
      );

      // 2. Update Firestore document
      try {
        const staffRef = doc(db, 'labs', lab?.id || 'lab-1', 'staff', staff.id);
        await updateDoc(staffRef, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          roles: formData.roles,
          primaryRole: formData.roles[0],
          updatedAt: new Date().toISOString()
        });
      } catch (fsErr) {
        console.warn('Firestore update doc warning:', fsErr);
      }

      onStaffUpdated();
      onClose();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to update staff credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-700 to-teal-800 text-white">
          <div>
            <h2 className="text-base font-bold tracking-tight">Manage Staff Permissions & Access Code</h2>
            <p className="text-xs text-teal-100">Update functional roles and reset temporary access code</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Phone Number <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Reset Staff Access Code Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <KeyRound className="w-4 h-4 text-teal-600" />
                Issue New Temporary Access Code
              </div>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                Admin Control
              </span>
            </div>
            
            <p className="text-[11px] text-slate-600 leading-relaxed">
              If the staff member forgot their code or needs a new onboarding code, you can generate one below. Upon their next login, nanoLabs will require them to configure their private permanent code.
            </p>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customResetCode}
                  onChange={e => setCustomResetCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TECH-9821"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>
              <button
                type="button"
                onClick={() => setCustomResetCode(generateRandomCode(formData.roles[0] || 'receptionist'))}
                title="Generate New Random Code"
                className="p-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetAccessCode}
                disabled={resettingCode}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {resettingCode ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    Apply New Code
                  </>
                )}
              </button>
            </div>

            {/* If new code was generated, show copy card */}
            {newIssuedCode && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    New Access Code Ready for Hand-off:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-lg font-black text-emerald-900 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-300 text-center tracking-widest">
                  {newIssuedCode}
                </div>
                <p className="text-[10px] text-emerald-700">
                  Give this code to {formData.name}. On login, they will be required to set their private permanent code.
                </p>
              </div>
            )}
          </div>

          {/* Roles Selection */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Assigned Roles & Permissions <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500">Toggle functional duties assigned to this personnel</p>
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
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStaffModal;
