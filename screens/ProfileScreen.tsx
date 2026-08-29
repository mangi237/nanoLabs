import React, { useState } from 'react';
import Header from '../components/common/Header';
import { useAuth } from '../context/authContext';
import { useLanguage } from '../context/languageContext';
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
  Palette,
  Edit3,
  Save,
  X,
  Lock,
  ShieldCheck,
  FileText,
  Globe,
  Check
} from 'lucide-react';
import { uploadService } from '../api/upload';
import { db, doc, updateDoc } from '../services/firebase';
import LabProfileModal from '../components/admin/LabProfileModal';
import MedicalBookletModal from '../components/medical/MedicalBookletModal';

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
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showBookletModal, setShowBookletModal] = useState(false);

  // Self-Service Profile Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAccessCode, setEditAccessCode] = useState(user?.accessCode || '');
  const [savingDetails, setSavingDetails] = useState(false);
  const [profileUpdateMsg, setProfileUpdateMsg] = useState('');
  const [profileUpdateError, setProfileUpdateError] = useState('');

  // Check if current user is an administrator authorized to manage facility branding & logo
  const canManageLogo = 
    user?.role === 'admin' || 
    user?.role === 'superadmin' || 
    (Array.isArray(user?.roles) && (user.roles.includes('admin') || user.roles.includes('superadmin')));

  const handleStartEdit = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setEditAccessCode(user?.accessCode || '');
    setProfileUpdateMsg('');
    setProfileUpdateError('');
    setIsEditing(true);
  };

  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileUpdateError('Full name cannot be empty.');
      return;
    }

    setSavingDetails(true);
    setProfileUpdateError('');
    setProfileUpdateMsg('');

    try {
      const targetLabId = lab?.id || user?.labId || 'lab-1';
      const updatedUser = {
        ...user,
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        accessCode: editAccessCode.trim() || user?.accessCode
      };

      // 1. Update Auth Context and LocalStorage
      setUser(updatedUser);
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch {
        // ignore
      }

      // 2. Persist to Firestore
      if (user?.id) {
        if (user.role === 'patient') {
          try {
            await updateDoc(doc(db, 'labs', targetLabId, 'patients', user.id), {
              name: editName.trim(),
              email: editEmail.trim(),
              phone: editPhone.trim(),
              accessCode: editAccessCode.trim() || user?.accessCode,
              updatedAt: new Date().toISOString()
            });
          } catch (fsErr) {
            console.warn('Could not update patient doc in firestore:', fsErr);
          }
        } else {
          try {
            await updateDoc(doc(db, 'labs', targetLabId, 'staff', user.id), {
              name: editName.trim(),
              email: editEmail.trim(),
              phone: editPhone.trim(),
              accessCode: editAccessCode.trim() || user?.accessCode,
              updatedAt: new Date().toISOString()
            });
          } catch (fsErr) {
            console.warn('Could not update staff doc in firestore:', fsErr);
          }
        }
      }

      // 3. Sync to Server Auth Registry
      try {
        await fetch('/api/staff/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId: user?.id,
            name: editName.trim(),
            email: editEmail.trim(),
            phone: editPhone.trim(),
            accessCode: editAccessCode.trim()
          })
        });
      } catch {
        // ignore
      }

      setProfileUpdateMsg('Your personal details have been updated successfully!');
      setIsEditing(false);
      setTimeout(() => setProfileUpdateMsg(''), 4000);
    } catch (err: any) {
      console.error('Error saving profile details:', err);
      setProfileUpdateError(err.message || 'Failed to update personal details.');
    } finally {
      setSavingDetails(false);
    }
  };

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
        title={t('profile_title')}
        subtitle={t('profile_subtitle')}
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
                  <h1 className="text-xl font-bold text-slate-900">{user?.name || 'Authorized Member'}</h1>
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold uppercase border border-teal-200">
                    {user?.role?.replace('_', ' ') || 'Staff Member'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Connected to {lab?.name || 'nanoLabs Central Diagnostics'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-[11px] text-teal-700 font-semibold hover:underline cursor-pointer flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5" />
                    {uploadingAvatar ? 'Uploading...' : 'Change Profile Picture'}
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

            <div className="flex flex-col items-end gap-2">
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold border border-teal-200 transition-all cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit My Details
                </button>
              )}

              {saveSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Photo Updated!
                </div>
              )}
              {profileUpdateMsg && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {profileUpdateMsg}
                </div>
              )}
            </div>
          </div>

          {/* EDIT FORM (If Editing Mode is Active) */}
          {isEditing ? (
            <form onSubmit={handleSaveProfileDetails} className="space-y-4 p-5 bg-teal-50/50 rounded-2xl border border-teal-200/80 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-teal-700" />
                  Edit Personal Details & Credentials
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-semibold"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>

              {profileUpdateError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-semibold">
                  {profileUpdateError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                    placeholder="e.g. Dr. Arthur Mbi"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    required
                    placeholder="staff@nanolabs.com"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+237 670000000"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Security Access Code / Password
                  </label>
                  <input
                    type="text"
                    value={editAccessCode}
                    onChange={e => setEditAccessCode(e.target.value)}
                    placeholder="Enter confidential code"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingDetails ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            /* User Attributes Grid (Display View) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal & Security Information</h3>
                <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Self-Managed Profile
                </span>
              </div>

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
                    <span className="font-mono font-bold text-slate-900">{user?.accessCode || '••••••••'}</span>
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
          )}

          {/* LANGUAGE PREFERENCE & TOGGLE CARD (ENGLISH <-> FRENCH) */}
          <div className="p-5 bg-gradient-to-r from-teal-50/70 via-slate-50 to-emerald-50/70 border border-teal-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20 shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {t('language_preference')}
                  </h4>
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-[9px] font-extrabold uppercase border border-teal-300/50 font-mono">
                    {language === 'fr' ? '🇫🇷 Français (Actif)' : '🇬🇧 English (Active)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-md">
                  {t('language_desc')}
                </p>
              </div>
            </div>

            {/* Language Selection Segmented Control */}
            <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-center justify-end">
              <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                  {language === 'en' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('fr')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'fr'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>🇫🇷</span>
                  <span>Français</span>
                  {language === 'fr' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              </div>
            </div>
          </div>

          {/* Medical Diagnostic Booklet Banner Card (PATIENTS ONLY - NOT FOR STAFF) */}
          {user?.role === 'patient' && (
            <div className="p-5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-800 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                    Official Medical & Diagnostic Booklet
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-md text-[9px] font-mono border border-teal-500/30">
                      LIMS CERTIFIED
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    View lifetime consolidated test findings, specimen collection logs, technologist signatures & print full medical booklet.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBookletModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                View Medical Booklet
              </button>
            </div>
          )}

          {/* Facility Branding & Custom Logo Card (STRICTLY ADMIN RESTRICTED) */}
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
                  {canManageLogo
                    ? (lab?.logoUrl 
                        ? 'Your custom facility logo is active across all staff portals, patient certificates & billing receipts.' 
                        : 'Your facility currently uses the default logo. Click below to customize your official laboratory branding.')
                    : 'Facility logo & branding customizations are managed exclusively by Laboratory Directors & Administrators.'}
                </p>
              </div>
            </div>

            {/* ONLY Admins can change or upload the lab logo */}
            {canManageLogo ? (
              <button
                type="button"
                onClick={() => setShowLabModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Palette className="w-4 h-4" />
                {lab?.logoUrl ? 'Change Facility Logo' : 'Upload Lab Logo'}
              </button>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-200/70 text-slate-600 text-[11px] font-semibold rounded-xl border border-slate-300/80 shrink-0">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Admin Managed</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {onNavigateRoleSwitcher && user?.role !== 'superadmin' && (
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

      {/* Medical Booklet Modal */}
      <MedicalBookletModal
        isOpen={showBookletModal}
        onClose={() => setShowBookletModal(false)}
        patient={user}
        lab={lab}
      />

      {/* Lab Profile & Logo Modal (Restricted to Admin) */}
      {canManageLogo && (
        <LabProfileModal
          isOpen={showLabModal}
          onClose={() => setShowLabModal(false)}
        />
      )}
    </div>
  );
};

export default ProfileScreen;


