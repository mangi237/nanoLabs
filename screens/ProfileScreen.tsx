import React, { useState } from 'react';
import Header from '../components/common/Header';
import { useAuth } from '../context/authContext';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Building2, 
  Key, 
  LogOut, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2,
  UploadCloud,
  Camera,
  Loader2,
  Trash2,
  Sparkles,
  Activity,
  Palette
} from 'lucide-react';
import { uploadService } from '../api/upload';
import { db, doc, updateDoc } from '../services/firebase';
import LabProfileModal from '../components/admin/LabProfileModal';

interface ProfileScreenProps {
  onBack?: () => void;
  onNavigateRoleSwitcher?: () => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onNavigateRoleSwitcher,
  onLogout
}) => {
  const { user, lab, logout, setUser } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (PNG, JPG, WebP, SVG).');
      return;
    }

    setUploadingAvatar(true);
    setSaveSuccess(false);
    try {
      const res = await uploadService.uploadFile(file);
      if (res.success && res.fileUrl) {
        const updatedUser = { ...user, avatarUrl: res.fileUrl, photoUrl: res.fileUrl };
        setUser(updatedUser);
        try {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch {
          // ignore
        }

        // Persist to Firestore if possible
        const targetLabId = lab?.id || user?.labId || 'lab-1';
        if (user?.id) {
          if (user.role === 'patient') {
            try {
              await updateDoc(doc(db, 'labs', targetLabId, 'patients', user.id), {
                avatarUrl: res.fileUrl,
                updatedAt: new Date().toISOString()
              });
            } catch {
              // Ignore if document not at exact path
            }
          } else {
            try {
              await updateDoc(doc(db, 'labs', targetLabId, 'staff', user.id), {
                avatarUrl: res.fileUrl,
                updatedAt: new Date().toISOString()
              });
            } catch {
              // Ignore if document not at exact path
            }
          }
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Could not upload image. Please try again.');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Failed to upload profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatarUrl) return;
    const updatedUser = { ...user, avatarUrl: '', photoUrl: '' };
    setUser(updatedUser);
    try {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch {
      // ignore
    }

    const targetLabId = lab?.id || user?.labId || 'lab-1';
    if (user?.id) {
      try {
        if (user.role === 'patient') {
          await updateDoc(doc(db, 'labs', targetLabId, 'patients', user.id), { avatarUrl: '' });
        } else {
          await updateDoc(doc(db, 'labs', targetLabId, 'staff', user.id), { avatarUrl: '' });
        }
      } catch {
        // ignore
      }
    }
  };

  const handleLogoutAction = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NL';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Profile Settings"
        subtitle="Manage personal credentials & active workspace"
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        {/* Profile Info Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-5">
              {/* Profile Photo with Upload Trigger */}
              <div className="relative group">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'Profile'}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-500 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md border-2 border-teal-200">
                    {getInitials(user?.name)}
                  </div>
                )}

                {/* Upload Overlay Button */}
                <label className="absolute -bottom-2 -right-2 p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md cursor-pointer transition-all border-2 border-white">
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{user?.name || 'Authorized Staff'}</h1>
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold uppercase border border-teal-200">
                    {user?.role?.replace('_', ' ') || 'Member'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Connected to {lab?.name || 'nanoLabs Central Diagnostics'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-[11px] text-teal-700 font-semibold hover:underline cursor-pointer flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5" />
                    {uploadingAvatar ? 'Uploading via IPFS...' : 'Change Profile Picture'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                  {user?.avatarUrl && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Profile Photo Updated!
              </div>
            )}
          </div>

          {/* User Attributes Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal & Security Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[10px] font-semibold">Email Address</span>
                  <span className="font-semibold text-slate-800 truncate block">{user?.email || 'user@nanolabs.com'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Phone Number</span>
                  <span className="font-semibold text-slate-800">{user?.phone || '+237 670000000'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Key className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Security Access Code</span>
                  <span className="font-mono font-bold text-slate-900">{user?.accessCode || 'SUPER123'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Assigned Lab ID</span>
                  <span className="font-semibold text-slate-800">{lab?.id || user?.labId || 'lab-1'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Facility Branding & Custom Logo Card */}
          <div className="p-5 bg-gradient-to-r from-teal-50 via-slate-50 to-blue-50 border border-teal-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {lab?.logoUrl ? (
                <img
                  src={lab.logoUrl}
                  alt={lab.name || 'Lab Logo'}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500 shadow-md bg-white shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex flex-col items-center justify-center shadow-md border-2 border-teal-200 shrink-0">
                  <Activity className="w-6 h-6 stroke-[2.5]" />
                  <span className="text-[7px] font-bold uppercase mt-0.5">nanoLabs</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{lab?.name || 'nanoLabs Central Diagnostics'}</h4>
                  {lab?.logoUrl ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-extrabold uppercase">
                      Custom Logo Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[9px] font-extrabold uppercase">
                      Default nanoLabs Logo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lab?.logoUrl
                    ? 'Your custom facility logo is active across all staff portals, patient certificates & billing receipts.'
                    : 'Your facility currently uses the default nanoLabs logo. Click below to upload your official logo.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLabModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Palette className="w-4 h-4" />
              {lab?.logoUrl ? 'Change Facility Logo' : 'Upload Lab Logo'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {onNavigateRoleSwitcher && (
              <button
                onClick={onNavigateRoleSwitcher}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold border border-teal-200 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Switch Active Role
              </button>
            )}

            <button
              onClick={handleLogoutAction}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of Portal
            </button>
          </div>
        </div>
      </main>

      {/* Lab Profile & Logo Modal */}
      <LabProfileModal
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
      />
    </div>
  );
};

export default ProfileScreen;

