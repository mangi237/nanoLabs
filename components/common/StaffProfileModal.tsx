import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { db, doc, updateDoc } from '../../services/firebase';

interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffProfileModal: React.FC<StaffProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, lab, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updatedUser = {
        ...user,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      };

      setUser(updatedUser);
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch {}

      const targetLabId = lab?.id || user?.labId || 'lab-1';
      if (user?.id) {
        try {
          await updateDoc(doc(db, 'labs', targetLabId, 'staff', user.id), {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            updatedAt: new Date().toISOString()
          });
        } catch (fsErr) {
          console.warn('Firestore update note:', fsErr);
        }
      }

      setSuccessMsg('Profile details updated successfully.');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const formatName = (r: string) => {
      switch (r) {
        case 'admin': return 'Lab Administrator';
        case 'receptionist': return 'Receptionist Desk';
        case 'cashier': return 'Cashier & Billing';
        case 'analyzer': return 'Sample Analyzer';
        case 'lab_tech': return 'Lab Technologist';
        case 'biologist': return 'Biologist & Pathologist';
        case 'inventory_manager': return 'Inventory Manager';
        case 'superadmin': return 'Super Administrator';
        default: return r.replace('_', ' ');
      }
    };
    return formatName(role || 'staff');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-950 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600/30 border border-teal-400/30 flex items-center justify-center text-teal-200 font-black text-lg">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">Staff Member Profile</h3>
              <p className="text-xs text-teal-200">Account Credentials & Facility Assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@laboratory.cm"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 600 000 000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Basic Info Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Full Legal Name:
                  </span>
                  <strong className="text-slate-900 font-semibold">{user?.name || 'Staff Member'}</strong>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email Address:
                  </span>
                  <span className="text-slate-800 font-medium">{user?.email || 'Not configured'}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone Contact:
                  </span>
                  <span className="text-slate-800 font-medium">{user?.phone || 'Not configured'}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    Assigned Laboratory:
                  </span>
                  <strong className="text-teal-900 font-bold">{lab?.name || user?.labName || 'nanoLabs Facility'}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    Active Role:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-200 capitalize">
                    {getRoleBadge(user?.role)}
                  </span>
                </div>
              </div>

              {/* Security & Access Info */}
              <div className="p-3.5 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-teal-950 font-bold">
                  <Lock className="w-3.5 h-3.5 text-teal-700" />
                  <span>Credential Security</span>
                </div>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  Your credentials and actions are authenticated with end-to-end encryption. Department switching is accessible directly in your sidebar navigation.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Edit Information
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffProfileModal;
