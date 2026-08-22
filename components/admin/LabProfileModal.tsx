import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  UploadCloud, 
  Camera, 
  Palette, 
  Check, 
  Loader2, 
  Trash2, 
  Sparkles, 
  Activity,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  Percent,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { db, doc, updateDoc } from '../../services/firebase';
import { uploadService } from '../../api/upload';

interface LabProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const LabProfileModal: React.FC<LabProfileModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const { lab, setLab, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if current user is admin
  const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role || 'admin'];
  const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin') || user?.role === 'admin';

  const [formData, setFormData] = useState({
    name: lab?.name || '',
    slogan: lab?.slogan || 'Precision Diagnostics & Clinical Excellence',
    location: lab?.location || '',
    address: lab?.address || '',
    phone: lab?.phone || '',
    email: lab?.email || '',
    description: lab?.description || '',
    logoUrl: lab?.logoUrl || '',
    defaultDoctorCommissionRate: lab?.defaultDoctorCommissionRate !== undefined ? lab.defaultDoctorCommissionRate : 20,
    primaryColor: lab?.primaryColor || '#0D9488',
    secondaryColor: lab?.secondaryColor || '#0F766E',
    accentColor: lab?.accentColor || '#14B8A6'
  });

  if (!isOpen) return null;

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/png', 0.9);
          resolve(optimizedDataUrl);
        } else {
          resolve(img.src);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image file'));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAdmin) {
      alert('Access Denied: Only Laboratory Administrators can upload or modify the facility logo.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setUploadingLogo(true);
    setErrorMessage('');

    try {
      // First try optimized direct representation to ensure 100% instant reliability
      const optimizedUrl = await optimizeImage(file);
      setFormData(prev => ({ ...prev, logoUrl: optimizedUrl }));
    } catch (err) {
      console.error('Logo upload error:', err);
      // Fallback to upload service
      try {
        const res = await uploadService.uploadFile(file);
        if (res.success && res.fileUrl) {
          setFormData(prev => ({ ...prev, logoUrl: res.fileUrl! }));
        } else {
          alert('Could not process logo. Please try another image file.');
        }
      } catch (uploadErr) {
        alert('Error uploading logo file.');
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    if (!isAdmin) {
      alert('Access Denied: Only Laboratory Administrators can remove the facility logo.');
      return;
    }
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Access Denied: Only Laboratory Administrators can update facility settings.');
      return;
    }

    if (!formData.name.trim()) {
      alert('Please enter your Laboratory/Facility Name.');
      return;
    }

    setLoading(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const targetLabId = lab?.id || 'lab-1';
      const updatedLabData = {
        ...lab,
        name: formData.name.trim(),
        slogan: formData.slogan.trim(),
        location: formData.location.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        description: formData.description.trim(),
        logoUrl: formData.logoUrl || null,
        avatarUrl: formData.logoUrl || null,
        defaultDoctorCommissionRate: Number(formData.defaultDoctorCommissionRate) || 20,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        updatedAt: new Date().toISOString()
      };

      // 1. Update Firestore
      try {
        await updateDoc(doc(db, 'labs', targetLabId), {
          name: formData.name.trim(),
          slogan: formData.slogan.trim(),
          location: formData.location.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          description: formData.description.trim(),
          logoUrl: formData.logoUrl || null,
          avatarUrl: formData.logoUrl || null,
          defaultDoctorCommissionRate: Number(formData.defaultDoctorCommissionRate) || 20,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          updatedAt: new Date().toISOString()
        });
      } catch (fsErr) {
        console.warn('Firestore update note:', fsErr);
      }

      // 2. Update Auth Context & Local Storage
      setLab(updatedLabData);
      try {
        localStorage.setItem('lab', JSON.stringify(updatedLabData));
      } catch {}

      setSaveSuccess(true);
      if (onSaved) onSaved();

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving lab profile:', err);
      setErrorMessage(err.message || 'Failed to save laboratory profile');
    } finally {
      setLoading(false);
    }
  };

  const presetColors = [
    { name: 'Teal & Emerald (nanoLabs Default)', primary: '#0D9488', secondary: '#0F766E', accent: '#14B8A6' },
    { name: 'Royal Blue & Indigo', primary: '#2563EB', secondary: '#1E40AF', accent: '#60A5FA' },
    { name: 'Deep Purple & Violet', primary: '#7E22CE', secondary: '#581C87', accent: '#A855F7' },
    { name: 'Ruby Crimson & Wine', primary: '#BE123C', secondary: '#881337', accent: '#FB7185' },
    { name: 'Midnight Slate & Cyan', primary: '#0F172A', secondary: '#334155', accent: '#06B6D4' },
    { name: 'Forest Jade & Olive', primary: '#047857', secondary: '#064E3B', accent: '#10B981' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 text-white flex items-center justify-between bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">Facility Profile & Custom Logo</h2>
              <p className="text-xs text-slate-400">Manage your facility's official logo, brand colors & contact details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Logo Upload Section */}
          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  Facility Official Logo
                </h3>
                <p className="text-xs text-slate-500">
                  This custom logo is displayed on all staff dashboards, patient portals, printed receipts, and test result certificates.
                </p>
              </div>
              {formData.logoUrl ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Custom Logo Active
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Using nanoLabs Default Logo
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
              {/* Logo Preview Circle */}
              <div className="relative group shrink-0">
                {formData.logoUrl ? (
                  <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center p-1">
                    <img
                      src={formData.logoUrl}
                      alt={formData.name || 'Lab Logo'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 text-teal-400 flex flex-col items-center justify-center shadow-md border-4 border-white">
                    <Activity className="w-10 h-10 stroke-[2.5]" />
                    <span className="text-[9px] font-bold uppercase mt-1 tracking-wider text-slate-300">nanoLabs</span>
                  </div>
                )}

                {/* Quick Camera Trigger */}
                <label className="absolute -bottom-2 -right-2 p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg cursor-pointer transition-all border-2 border-white">
                  {uploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Upload Controls */}
              <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer">
                    <UploadCloud className="w-4 h-4" />
                    {uploadingLogo ? 'Uploading Logo...' : 'Upload Custom Lab Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Reset to Default
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Recommended format: PNG, JPG, or SVG with square or circular aspect ratio. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Facility Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility / Laboratory Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. St. Luke Clinical Laboratories"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Clinical Slogan
                </label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                  placeholder="e.g. Accurate Diagnostics, Trusted Care"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Location Hub *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Douala Central Hub"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Boulevard de la Liberté, Akwa"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +237 670 123 456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Lab Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. contact@stlukelabs.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Doctor Referral Commission Configuration */}
          <div className="p-5 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-teal-950">Referring Doctor Commission Rate</h3>
                  <p className="text-xs text-teal-800">
                    Default commission percentage rewarded to referring physicians (standard is 20%).
                  </p>
                </div>
              </div>

              <div className="relative w-28">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.defaultDoctorCommissionRate}
                  onChange={e => setFormData({ ...formData, defaultDoctorCommissionRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-teal-300 rounded-xl text-center focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-700 pointer-events-none">%</span>
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-teal-600" />
              Theme & Portal Colors
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presetColors.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    primaryColor: preset.primary,
                    secondaryColor: preset.secondary,
                    accentColor: preset.accent
                  }))}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                    formData.primaryColor === preset.primary
                      ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full shadow-xs" style={{ backgroundColor: preset.primary }} />
                    <div className="w-4 h-4 rounded-full shadow-xs" style={{ backgroundColor: preset.secondary }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 line-clamp-1">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {saveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Facility profile and logo updated successfully! Syncing live across portal...</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingLogo}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save & Apply Branding
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabProfileModal;
