import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { authService } from '../../services/authService';
import { db, updateDoc, doc } from '../../services/firebase';
import { 
  X, 
  Send, 
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
  ShieldCheck 
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
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpResentMsg, setOtpResentMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roles: ['receptionist']
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        roles: staff.roles || [staff.role || 'receptionist']
      });
      setOtpResentMsg('');
      setErrorMessage('');
    }
  }, [staff]);

  if (!visible || !staff) return null;

  const roleOptions = [
    { value: 'receptionist', label: 'Receptionist', icon: User },
    { value: 'cashier', label: 'Cashier', icon: DollarSign },
    { value: 'analyzer', label: 'Analyzer / Phlebotomist', icon: Microscope },
    { value: 'labtech', label: 'Lab Technologist', icon: TestTube },
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

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setOtpResentMsg('');
    setErrorMessage('');
    try {
      await authService.resendStaffInvite(staff.id, formData.email, adminUser);
      setOtpResentMsg(`A fresh one-time access code has been securely emailed to ${formData.email}. Previous codes are now invalid.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend access code.');
    } finally {
      setResendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage('Full name and email address are required fields.');
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
            <h2 className="text-base font-bold tracking-tight">Manage Staff Permissions & Profile</h2>
            <p className="text-xs text-teal-100">Update functional roles and send password reset OTP</p>
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

          {otpResentMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{otpResentMsg}</span>
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
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Phone Number
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

          {/* Zero-Knowledge Security Info & Passcode Reset Button */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Lock className="w-4 h-4 text-teal-600" />
                Zero-Knowledge Password Security
              </div>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                Protected Hash
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              For patient safety and compliance, administrators cannot view or directly overwrite staff passwords. You can issue a single-use setup OTP to their email, forcing them to establish a new password.
            </p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendingOtp}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {resendingOtp ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating & Emailing OTP...
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                  Issue & Email New Setup OTP Passcode
                </>
              )}
            </button>
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
