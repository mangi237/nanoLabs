import React, { useState, useEffect } from 'react';
import { 
  User, 
  ArrowLeft, 
  FileText, 
  Shield, 
  MapPin, 
  Bell, 
  HelpCircle, 
  Settings, 
  ChevronRight, 
  LogOut, 
  Check, 
  Edit3,
  CreditCard,
  Upload,
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Building2,
  Receipt,
  Phone,
  Mail,
  Droplet
} from 'lucide-react';
import { useAuth } from '../context/authContext';
import { useFamilyProfile } from '../context/familyProfileContext';
import { CAMEROON_INSURANCE_COMPANIES } from '../data/cameroonInsurances';
import { formatXAF } from '../shared/money';

interface PatientProfileScreenProps {
  onBack?: () => void;
  onNavigateInsurance?: () => void;
  onNavigateHealthRecords?: () => void;
  onNavigateRoleSwitcher?: () => void;
   onNotificationPress?: () => void;
  onLogout?: () => void;
}

export const PatientProfileScreen: React.FC<PatientProfileScreenProps> = ({
  onBack,
  onNavigateInsurance,
  onNotificationPress,
  onNavigateHealthRecords,
  onNavigateRoleSwitcher,
  onLogout
}) => {
  const { user, setUser, logout } = useAuth();
  const { activeProfile, isDependentActive, editFamilyMember } = useFamilyProfile();

  // Profile Picture State
  const [profilePicture, setProfilePicture] = useState<string | null>(() => {
    return user?.profilePicture || user?.avatarUrl || activeProfile?.photoUrl || localStorage.getItem(`nanolabs_avatar_${user?.id || 'demo'}`) || null;
  });

  // Basic Demographics State
  const [fullName, setFullName] = useState(user?.name || user?.fullName || activeProfile.fullName || 'Valued Patient');
  const [nickname, setNickname] = useState(activeProfile.nickname || user?.nickname || '');
  const [phone, setPhone] = useState(user?.phone || activeProfile.phone || '+237 671 22 33 44');
  const [email, setEmail] = useState(user?.email || 'patient@nanolabs.cm');
  const [gender, setGender] = useState(activeProfile.gender || user?.gender || 'Female');
  const [bloodGroup, setBloodGroup] = useState(activeProfile.bloodGroup || user?.bloodGroup || 'O+');
  const [city, setCity] = useState(activeProfile.city || 'Douala');

  // National ID Card Verification State
  const [nationalId, setNationalId] = useState(() => {
    return localStorage.getItem(`nanolabs_cni_${user?.id || 'demo'}`) || activeProfile.nationalId || '';
  });
  const [idCardImage, setIdCardImage] = useState<string | null>(() => {
    return localStorage.getItem(`nanolabs_cni_img_${user?.id || 'demo'}`) || null;
  });
  const [idCardStatus, setIdCardStatus] = useState<'not_uploaded' | 'pending_verification' | 'verified'>(() => {
    return (localStorage.getItem(`nanolabs_cni_status_${user?.id || 'demo'}`) as any) || (nationalId ? 'pending_verification' : 'not_uploaded');
  });

  // Insurance State (Select directly from dropdown)
  const [selectedInsurance, setSelectedInsurance] = useState(() => {
    return activeProfile.insuranceProvider || (user as any)?.insuranceProvider || CAMEROON_INSURANCE_COMPANIES[0].name;
  });
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(() => {
    return activeProfile.insurancePolicyNumber || (user as any)?.insurancePolicyNumber || '';
  });
  const [employerSociete, setEmployerSociete] = useState(() => {
    return activeProfile.employerSociete || (user as any)?.employerSociete || 'ENEO Cameroon SA';
  });

  // Save feedback state
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Diagnostic Ledger stats
  const [ledgerStats, setLedgerStats] = useState({
    totalTests: 0,
    totalSpent: 0,
    receipts: [] as any[]
  });

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const { limsService } = await import('../services/limsService');
        const labId = user?.labId || 'lab-1';
        const allBookings = await limsService.fetchAllBookings(labId);
        const userBookings = allBookings.filter(b => {
          const matchPid = b.patientPid === activeProfile.id || b.patientId === activeProfile.id;
          const matchName = b.patientName?.toLowerCase().trim() === fullName.toLowerCase().trim();
          return matchPid || matchName;
        });

        let spent = 0;
        const paidReceipts: any[] = [];
        userBookings.forEach(b => {
          if (b.paymentStatus === 'paid') {
            const amt = Number(b.totalAmount) || 0;
            spent += amt;
            paidReceipts.push({
              id: b.id,
              bookingCode: b.bookingCode || 'LAB-001',
              labName: b.labName || 'BioSanté Lab',
              amount: amt,
              date: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent',
              method: b.paymentMethod || 'MTN MoMo / Orange Money'
            });
          }
        });

        setLedgerStats({
          totalTests: userBookings.length,
          totalSpent: spent,
          receipts: paidReceipts
        });
      } catch (err) {
        console.warn('Error fetching ledger:', err);
      }
    };
    fetchLedger();
  }, [user, activeProfile, fullName]);

  // Handle ID card image upload
  const handleIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setIdCardImage(dataUrl);
      setIdCardStatus('pending_verification');
      localStorage.setItem(`nanolabs_cni_img_${user?.id || 'demo'}`, dataUrl);
      localStorage.setItem(`nanolabs_cni_status_${user?.id || 'demo'}`, 'pending_verification');
      setSaveNotice('National ID card snapped successfully! Sent to Super Admins for verification.');
      setTimeout(() => setSaveNotice(null), 5000);
    };
    reader.readAsDataURL(file);
  };

  // Handle Profile Picture upload
  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProfilePicture(dataUrl);
      localStorage.setItem(`nanolabs_avatar_${user?.id || 'demo'}`, dataUrl);
      editFamilyMember(activeProfile.id, { photoUrl: dataUrl });
      if (user && setUser) {
        setUser({ ...user, profilePicture: dataUrl, avatarUrl: dataUrl });
      }
      setSaveNotice('Profile picture updated successfully!');
      setTimeout(() => setSaveNotice(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  // Screen Mode: Profile Overview vs Profile Edit Settings
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Handle Save Profile & Insurance
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce requirement: National ID number must be provided to activate insurance
    if (insurancePolicyNumber.trim() && !nationalId.trim()) {
      setSaveNotice('National ID Card Number (CNI) is required along with your policy number to activate insurance.');
      setTimeout(() => setSaveNotice(null), 5000);
      return;
    }

    // Persist CNI and status
    localStorage.setItem(`nanolabs_cni_${user?.id || 'demo'}`, nationalId);
    if (nationalId && idCardStatus === 'not_uploaded') {
      setIdCardStatus('pending_verification');
      localStorage.setItem(`nanolabs_cni_status_${user?.id || 'demo'}`, 'pending_verification');
    }

    // Persist Insurance & Demographics to Active Family Profile
    editFamilyMember(activeProfile.id, {
      fullName,
      nickname,
      phone,
      bloodGroup,
      nationalId,
      insuranceProvider: selectedInsurance,
      insurancePolicyNumber,
      employerSociete,
      city
    });

    setSaveNotice('Profile, National ID & Insurance settings saved successfully! Status: Pending Super Admin clearance.');
    setIsEditingSettings(false);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const accessCode = user?.accessCode || `RES-2026-${(fullName.slice(0, 3) || 'PAT').toUpperCase()}`;

  return (
    <div className="max-w-3xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(isEditingSettings || onBack) && (
            <button
              onClick={() => {
                if (isEditingSettings) {
                  setIsEditingSettings(false);
                } else if (onBack) {
                  onBack();
                }
              }}
              className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isEditingSettings ? 'Edit Profile & Settings' : 'Patient Profile'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditingSettings 
                ? 'Update your demographics, National ID, and health insurance credentials.'
                : 'Verified patient credentials, national ID clearance, insurance policy, and diagnostic ledger.'
              }
            </p>
          </div>
        </div>

        {/* Access Code Badge */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Results Access Code</span>
          <span className="font-mono text-xs font-black text-[#006978] bg-[#E0F2F1] px-2.5 py-1 rounded-lg border border-[#80CBC4]">
            {accessCode}
          </span>
        </div>
      </div>

      {/* Save Notification */}
      {saveNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs shadow-sm animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{saveNotice}</span>
        </div>
      )}

      {/* 1. Profile Header Card */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#003B42] via-[#005B66] to-[#007A87] text-white rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative group shrink-0">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt={fullName} 
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover shadow-md border-2 border-white/50" 
              />
            ) : (
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white/30">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <label 
              className="absolute -bottom-1 -right-1 p-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
              title="Change profile picture"
            >
              <Camera className="w-3.5 h-3.5" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleProfilePictureUpload} 
              />
            </label>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white">{fullName}</h2>
              {nickname && (
                <span className="text-xs font-semibold text-cyan-200 bg-white/10 px-2 py-0.5 rounded-full">
                  "{nickname}"
                </span>
              )}
            </div>
            <p className="text-xs text-cyan-100/90 font-medium mt-0.5 flex items-center gap-2">
              <span>{phone}</span>
              <span>&bull;</span>
              <span>{city}</span>
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px] font-bold">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950">
                Blood Group: {bloodGroup}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20 font-mono">
                PID: {activeProfile.id}
              </span>
            </div>
          </div>
        </div>

        <div className="sm:text-right relative z-10 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/15">
          <span className="text-[10px] uppercase font-bold text-cyan-200 block">Total Diagnostic Spend</span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono">
            {formatXAF(ledgerStats.totalSpent)}
          </span>
          <span className="text-[10px] text-cyan-100/80 block mt-0.5">
            {ledgerStats.totalTests} tests recorded in ledger
          </span>
        </div>

        {/* Ambient overlay */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full pointer-events-none blur-xl" />
      </div>

      {/* DEDICATED PROFILE OVERVIEW (READ-ONLY DISPLAY WITH EDIT BUTTON) */}
      {!isEditingSettings ? (
        <div className="space-y-5 animate-in fade-in">
          {/* Main Action Bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#006978] flex items-center justify-center font-black">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Profile Settings</h3>
                <p className="text-xs text-slate-500">Edit demographics, national ID card, and health insurance</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditingSettings(true)}
              className="px-4 py-2.5 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white rounded-2xl text-xs font-black shadow-md shadow-[#006978]/25 transition-all cursor-pointer flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-cyan-200" />
              <span>Edit Profile & Settings</span>
            </button>
          </div>

          {/* Identity & National ID Clearance Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Shield className="w-4 h-4 text-[#006978]" />
                <span>National Identity (CNI) Status</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                idCardStatus === 'verified'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : idCardStatus === 'pending_verification'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {idCardStatus === 'verified' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CNI Verified by Super Admin</span>
                  </>
                ) : idCardStatus === 'pending_verification' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending Super Admin Clearance</span>
                  </>
                ) : (
                  <span>CNI Not Uploaded</span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">National ID Card Number</span>
                <p className="font-mono font-black text-slate-900 text-sm">{nationalId || 'Not provided yet'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">KYC Status</span>
                <p className="font-bold text-slate-800">
                  {nationalId ? 'Document Submitted & Enqueued' : 'Required to activate third-party insurance co-pay'}
                </p>
              </div>
            </div>

            {idCardImage && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <img src={idCardImage} alt="National ID" className="w-12 h-8 rounded-lg object-cover border" />
                  <span className="font-bold text-slate-700">National ID Snapshot Stored</span>
                </div>
                <span className="text-emerald-700 font-bold text-[11px]">Synced</span>
              </div>
            )}
          </div>

          {/* Insurance Information Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <CreditCard className="w-4 h-4 text-[#006978]" />
                <span>Health Insurance & Coverage Caisse</span>
              </div>
              <span className="text-xs font-bold text-[#006978]">{selectedInsurance}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Insurance Company</span>
                <p className="font-bold text-slate-900">{selectedInsurance}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Policy / Matricule N°</span>
                <p className="font-mono font-black text-slate-900">{insurancePolicyNumber || 'None configured'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Employer / Société</span>
                <p className="font-bold text-slate-900">{employerSociete || 'Independent'}</p>
              </div>
            </div>
          </div>

          {/* Demographics Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <User className="w-4 h-4 text-[#006978]" />
                <span>Personal Demographics</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender</span>
                <span className="font-bold text-slate-900">{gender}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Group</span>
                <span className="font-black text-rose-600">{bloodGroup}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                <span className="font-mono font-bold text-slate-900">{phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">City</span>
                <span className="font-bold text-slate-900">{city}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* EDIT PROFILE SETTINGS FORM */
        <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-base font-black text-slate-900">Edit Profile & Credentials</h3>
            <button
              type="button"
              onClick={() => setIsEditingSettings(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        {/* Personal Details Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
              <User className="w-4 h-4 text-[#006978]" />
              <span>Personal Information</span>
            </div>
            <span className="text-[11px] text-slate-400">Basic Demographics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Full Legal Name:</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-[#006978]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                Preferred Nickname (Anonymous display for privacy):
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Marie, Sam, Pat"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-[#006978]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Mobile Phone Number:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-[#006978]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Blood Group (Groupe Sanguin):</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-[#006978]"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. National ID Card (CNI) Verification Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#006978]" />
              <span className="text-sm font-black text-slate-900">National ID Card (CNI) Verification</span>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              idCardStatus === 'verified'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : idCardStatus === 'pending_verification'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {idCardStatus === 'verified' ? 'Verified Official' : idCardStatus === 'pending_verification' ? 'Pending Admin Review' : 'Action Required'}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            In compliance with CEMAC diagnostic norms, you must link your <strong>National ID Card Number</strong> and snapshot your CNI to activate <strong>Tiers-Payant Health Insurance coverage</strong> for automated 80% coverage on bills.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                National ID Card Number (CNI):
              </label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="e.g. 1029482910 or CNI-LT-2022-9901"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#006978]"
              />
            </div>

            {/* Snap / Upload ID Card Document */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Snap or Upload ID Card Photo:
              </label>
              <label className="p-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 hover:border-[#006978] rounded-xl flex items-center justify-between cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleIdCardUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 text-slate-600">
                  <Camera className="w-4 h-4 text-[#006978]" />
                  <span className="font-semibold text-xs">
                    {idCardImage ? 'Change ID Card Photo' : 'Snap / Upload CNI Photo'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#006978] bg-[#E0F2F1] px-2 py-0.5 rounded-md">
                  Browse
                </span>
              </label>
            </div>
          </div>

          {/* ID Card Image Preview */}
          {idCardImage && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={idCardImage}
                  alt="CNI Document"
                  className="w-16 h-11 object-cover rounded-lg border border-slate-300 shadow-2xs"
                />
                <div>
                  <span className="font-bold text-slate-900 block">National ID Card Snapped</span>
                  <span className="text-[11px] text-slate-500">Document encrypted & sent for verification</span>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          )}
        </div>

        {/* 4. Diagnostic Health Insurance (Strict Cameroon Dropdown) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#006978]" />
              <span className="text-sm font-black text-slate-900">Health Insurance & Tiers-Payant Caisse</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              80% Diagnostic Tariff Cover
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Insurer Dropdown: Pure Select, No Search/Typing Needed */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-slate-700 block">
                Select Your Insurance Company (Cameroon Accredited Caisses):
              </label>
              <select
                value={selectedInsurance}
                onChange={(e) => setSelectedInsurance(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-[#006978] shadow-2xs"
              >
                {CAMEROON_INSURANCE_COMPANIES.map((ins) => (
                  <option key={ins.id} value={ins.name}>
                    {ins.name} ({ins.city}) &bull; {ins.code || 'CEMAC'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                Insurance Matricule / Policy Number:
              </label>
              <input
                type="text"
                value={insurancePolicyNumber}
                onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                placeholder="e.g. POL-884920 or ASC-2026-09"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#006978]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                Sponsor Company / Société (Employer):
              </label>
              <input
                type="text"
                value={employerSociete}
                onChange={(e) => setEmployerSociete(e.target.value)}
                placeholder="e.g. ENEO Cameroon SA, SABC, Orange Cameroun"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-[#006978]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full py-3.5 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 text-cyan-200" />
          <span>Save Profile, National ID & Insurance Credentials</span>
        </button>
      </form>
      )}

      {/* 5. Diagnostic Ledger & Payment Receipts Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#006978]" />
            <span className="text-sm font-black text-slate-900">Official Invoices & Payment Receipts</span>
          </div>
          <span className="text-xs font-mono font-bold text-[#006978]">
            {ledgerStats.receipts.length} Settled Receipts
          </span>
        </div>

        {ledgerStats.receipts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {ledgerStats.receipts.map((rec, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-mono">{rec.bookingCode}</strong>
                    <span className="text-slate-400">&bull; {rec.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{rec.labName} &bull; Paid via {rec.method}</p>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-slate-900 block">{formatXAF(rec.amount)}</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    Paid & Cleared
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 space-y-1">
            <CreditCard className="w-6 h-6 text-slate-300 mx-auto" />
            <p>No paid invoices recorded yet for this profile.</p>
          </div>
        )}
      </div>

      {/* 6. Clean Sign Out Button */}
      <div className="pt-2 pb-8">
        <button
          onClick={() => {
            if (onLogout) onLogout();
            else logout();
          }}
          className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Sign Out of Patient Account</span>
        </button>
      </div>
    </div>
  );
};
export default PatientProfileScreen;
