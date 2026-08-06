import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { authService } from '../../services/authService';
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
  Lock, 
  Send,  
  CheckCircle2, 
  Info,
  Key
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
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    primaryRole: 'receptionist',
    roles: ['receptionist']
  });

  if (!visible) return null;

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
    setFormData(prev => ({ 
      ...prev, 
      roles: updatedRoles,
      primaryRole: updatedRoles[0] || 'receptionist'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage('Full name and email address are required to dispatch invitation.');
      return;
    }

    if (formData.roles.length === 0) {
      setErrorMessage('Please select at least one organizational role.');
      return;
    }

    setLoading(true);
    try {
      await authService.inviteStaff(
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          roles: formData.roles,
          primaryRole: formData.roles[0],
          labId: lab?.id || 'lab-1',
          labName: lab?.name || 'nanoLabs Central Diagnostics'
        },
        adminUser
      );

      onStaffAdded();
      setFormData({
        name: '',
        email: '',
        phone: '',
        primaryRole: 'receptionist',
        roles: ['receptionist']
      });
      onClose();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to send staff invitation. Please try again.');
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
              <Send className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Invite New Staff Member</h2>
              <p className="text-xs text-teal-100">Zero-Knowledge Email OTP Invitation Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Zero-Knowledge Protocol Notice */}
          <div className="p-3.5 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Hospital Privacy & Security Standard</span>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                Admins assign authorized operational roles. The employee will receive their setup OTP directly via email and will create their own private password upon initial sign-in.
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
                    placeholder="e.g. Dr. Marcelle Ebongue"
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
                    Work / Personal Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="staff@hospital.org"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    One-time login passcode will be sent here
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+237 670000000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                  />
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
                    Generating OTP & Sending Invite...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send One-Time Code Invite
                  </>
                )}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default AddStaffModal;
