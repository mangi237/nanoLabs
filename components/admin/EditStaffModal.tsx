import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { db, updateDoc, doc } from '../../services/firebase';
import { X, RefreshCw, User, DollarSign, Microscope, TestTube, Shield, Package, CheckCircle, Loader2 } from 'lucide-react';

interface EditStaffModalProps {
  visible: boolean;
  onClose: () => void;
  staff: any;
  onStaffUpdated: () => void;
}

export const EditStaffModal: React.FC<EditStaffModalProps> = ({ visible, onClose, staff, onStaffUpdated }) => {
  const { lab } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    accessCode: '',
    roles: ['receptionist']
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        accessCode: staff.accessCode || '',
        roles: staff.roles || ['receptionist']
      });
    }
  }, [staff]);

  if (!visible || !staff) return null;

  const roleOptions = [
    { value: 'receptionist', label: 'Receptionist', icon: User },
    { value: 'cashier', label: 'Cashier', icon: DollarSign },
    { value: 'analyzer', label: 'Analyzer', icon: Microscope },
    { value: 'lab_tech', label: 'Lab Technician', icon: TestTube },
    { value: 'admin', label: 'Admin Administrator', icon: Shield },
    { value: 'inventory_manager', label: 'Inventory Manager', icon: Package }
  ];

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, accessCode: code }));
  };

  const toggleRole = (role: string) => {
    let updatedRoles = [...formData.roles];
    if (updatedRoles.includes(role)) {
      updatedRoles = updatedRoles.filter(r => r !== role);
    } else {
      updatedRoles.push(role);
    }
    setFormData(prev => ({ ...prev, roles: updatedRoles }));
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
      const staffRef = doc(db, 'labs', lab?.id || 'lab-1', 'staff', staff.id);
      await updateDoc(staffRef, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        accessCode: formData.accessCode,
        roles: formData.roles,
        updatedAt: new Date().toISOString()
      });

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
            <h2 className="text-lg font-bold tracking-tight">Edit Staff Details</h2>
            <p className="text-xs text-teal-100">Update personnel profile and access rights</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Security Access Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={formData.accessCode}
                  onChange={e => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })}
                  className="flex-1 px-3.5 py-2.5 tracking-widest text-center font-mono font-bold text-slate-800 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={generateAccessCode}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-semibold border border-teal-200/80 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Roles</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {roleOptions.map(role => {
                const IconComponent = role.icon;
                const isSelected = formData.roles.includes(role.value);
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => toggleRole(role.value)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/80 text-teal-900 shadow-xs'
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

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update Staff'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStaffModal;
