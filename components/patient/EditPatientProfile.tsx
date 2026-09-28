import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Droplet, 
  ShieldCheck, 
  Shield, 
  Eye, 
  EyeOff, 
  Camera, 
  Check, 
  Sparkles, 
  AlertCircle,
  Building2,
  CheckCircle2,
  Lock,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { db, doc, updateDoc, setDoc } from '../../services/firebase';
import { doctorChatService } from '../../services/doctorChatService';
import { CAMEROON_INSURANCE_COMPANIES } from '../../data/cameroonInsurances';

interface EditPatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedData: any) => void;
  patientDocData?: any;
}

export const EditPatientProfileModal: React.FC<EditPatientProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientDocData
}) => {
  const { user, setUser, lab } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Retrieve current privacy profile from doctorChatService or patientDoc
  const currentChatProfile = doctorChatService.getOrCreateUserProfile({
    id: user?.id || 'pat-1',
    name: user?.name,
    role: 'patient',
    phone: user?.phone
  });

  const [name, setName] = useState(patientDocData?.name || user?.name || '');
  const [nickname, setNickname] = useState(
    patientDocData?.nickname || 
    (user as any)?.nickname || 
    currentChatProfile?.nickname || 
    `Patient_${(user?.id || '101').slice(-4)}`
  );
  const [isAnonymous, setIsAnonymous] = useState(
    patientDocData?.isAnonymous !== undefined 
      ? patientDocData.isAnonymous 
      : (currentChatProfile?.isAnonymous !== undefined ? currentChatProfile.isAnonymous : true)
  );
  const [phone, setPhone] = useState(patientDocData?.phone || user?.phone || '');
  const [email, setEmail] = useState(patientDocData?.email || user?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState(patientDocData?.dateOfBirth || patientDocData?.dob || '1995-06-15');
  const [gender, setGender] = useState(patientDocData?.gender || 'Female');
  const [city, setCity] = useState(patientDocData?.city || 'Douala');
  const [address, setAddress] = useState(patientDocData?.address || '');
  const [bloodGroup, setBloodGroup] = useState(patientDocData?.bloodGroup || 'O+');
  const [avatarUrl, setAvatarUrl] = useState(patientDocData?.avatarUrl || user?.avatarUrl || '');
  
  // Insurance
  const [hasInsurance, setHasInsurance] = useState(patientDocData?.hasInsurance || false);
  const [insuranceProvider, setInsuranceProvider] = useState(patientDocData?.insuranceProvider || CAMEROON_INSURANCE_COMPANIES[0]?.name || 'ASCOMA CAMEROUN S.A.');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(patientDocData?.insurancePolicyNumber || '');
  const [insuranceCoveragePercent, setInsuranceCoveragePercent] = useState<number>(patientDocData?.insuranceCoveragePercent || 80);

  // Emergency contact
  const [emergencyContactName, setEmergencyContactName] = useState(patientDocData?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(patientDocData?.emergencyContactPhone || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState(false);

  // Keep form in sync when props or user change
  useEffect(() => {
    if (isOpen) {
      const liveProfile = doctorChatService.getOrCreateUserProfile({
        id: user?.id || 'pat-1',
        name: user?.name,
        role: 'patient',
        phone: user?.phone
      });
      setName(patientDocData?.name || user?.name || '');
      setNickname(
        patientDocData?.nickname || 
        (user as any)?.nickname || 
        liveProfile?.nickname || 
        `Patient_${(user?.id || '101').slice(-4)}`
      );
      setIsAnonymous(
        patientDocData?.isAnonymous !== undefined 
          ? patientDocData.isAnonymous 
          : (liveProfile?.isAnonymous !== undefined ? liveProfile.isAnonymous : true)
      );
      setPhone(patientDocData?.phone || user?.phone || '');
      setEmail(patientDocData?.email || user?.email || '');
      setDateOfBirth(patientDocData?.dateOfBirth || patientDocData?.dob || '1995-06-15');
      setGender(patientDocData?.gender || 'Female');
      setCity(patientDocData?.city || 'Douala');
      setAddress(patientDocData?.address || '');
      setBloodGroup(patientDocData?.bloodGroup || 'O+');
      setAvatarUrl(patientDocData?.avatarUrl || user?.avatarUrl || '');
      setHasInsurance(Boolean(patientDocData?.hasInsurance));
      setInsuranceProvider(patientDocData?.insuranceProvider || CAMEROON_INSURANCE_COMPANIES[0]?.name || 'ASCOMA CAMEROUN S.A.');
      setInsurancePolicyNumber(patientDocData?.insurancePolicyNumber || '');
      setInsuranceCoveragePercent(patientDocData?.insuranceCoveragePercent || 80);
      setEmergencyContactName(patientDocData?.emergencyContactName || '');
      setEmergencyContactPhone(patientDocData?.emergencyContactPhone || '');
      setError(null);
    }
  }, [isOpen, user?.id, patientDocData]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError('Selected image exceeds 3MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const base64 = loadEvent.target?.result as string;
      if (base64) {
        setAvatarUrl(base64);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your legal full name.');
      return;
    }
    if (!nickname.trim()) {
      setError('Please enter a privacy nickname / alias.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const targetLabId = lab?.id || user?.labId || 'lab-1';
      const patientId = user?.id || patientDocData?.id || 'pat-1';

      const payload = {
        id: patientId,
        patientId,
        name: name.trim(),
        nickname: nickname.trim(),
        isAnonymous,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        dateOfBirth,
        gender,
        city: city.trim(),
        address: address.trim(),
        bloodGroup,
        avatarUrl,
        hasInsurance,
        insuranceProvider: hasInsurance ? insuranceProvider : '',
        insurancePolicyNumber: hasInsurance ? insurancePolicyNumber.trim() : '',
        insuranceCoveragePercent: hasInsurance ? Number(insuranceCoveragePercent) : 0,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        updatedAt: new Date().toISOString()
      };

      // 1. Update Auth Context User
      const updatedUser = {
        ...user,
        name: payload.name,
        nickname: payload.nickname,
        phone: payload.phone,
        email: payload.email,
        avatarUrl: payload.avatarUrl,
        isAnonymous: payload.isAnonymous
      };
      setUser(updatedUser);
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (err) {
        console.warn('Could not update localStorage user:', err);
      }

      // 2. Update Social / Chat Profile & Privacy Nickname
      doctorChatService.updatePatientPrivacyNickname(
        patientId,
        payload.nickname,
        payload.isAnonymous
      );

      // 3. Persist to Firestore patient document
      try {
        await setDoc(doc(db, 'labs', targetLabId, 'patients', patientId), payload, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore patient update non-blocking:', fsErr);
      }

      setToastSuccess(true);
      if (onSuccess) {
        onSuccess(payload);
      }
      setTimeout(() => {
        setToastSuccess(false);
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Error updating patient profile:', err);
      setError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50 via-white to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Edit Patient Profile</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Secure LIMS
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Update your demographics, privacy nickname, and emergency health contact
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error / Success Toast */}
        {error && (
          <div className="m-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {toastSuccess && (
          <div className="m-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile and privacy nickname saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Avatar & Identity Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'Patient'}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-500/40 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                  {(name || 'P').charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold text-white cursor-pointer"
              >
                <Camera className="w-4 h-4 mb-0.5" />
                <span>Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {name || 'Patient Legal Profile'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                  PID: {user?.id || patientDocData?.id || 'PID-2026'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tap photo to upload your profile image. This photo is shown when verifying identity at laboratory collection desks.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Choose Photo File</span>
              </button>
            </div>
          </div>

          {/* Section 2: Patient Privacy Nickname & Anonymity Shield (Highlighted Requirement) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-teal-50/50 to-white border-2 border-teal-500/30 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Social Directory & Privacy Nickname Shield
                </h3>
              </div>
              {isAnonymous ? (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <EyeOff className="w-3 h-3 text-indigo-600" />
                  <span>Shield Active</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-600" />
                  <span>Legal Name Public</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              When searching for doctors and requesting tele-consultations, doctors can search you using your <strong>Privacy Nickname</strong>. Your real legal identity is kept anonymous until <strong>both parties mutually approve</strong> connection.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Privacy Nickname / Alias *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={e => setNickname(e.target.value.replace(/[@\s]/g, '_'))}
                    placeholder="e.g. Claire_Health"
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Alphanumeric & underscores only. Used in doctor search.
                </p>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/80 border border-slate-200 cursor-pointer hover:bg-white transition">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Enforce Anonymity Shield
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Hide legal name in public search until connection is approved.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-3 bg-white rounded-xl border border-teal-200/60 text-xs text-slate-600 flex items-center justify-between">
              <span className="text-slate-500">How doctors see you in directory search:</span>
              <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {isAnonymous ? `@${nickname || 'Your_Nickname'} (Anonymous)` : name || 'Legal Full Name'}
              </span>
            </div>
          </div>

          {/* Section 3: Legal & Contact Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Personal Demographics & Contact</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Legal Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Mme. Claire Ngo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (WhatsApp) *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+237 671 22 33 44"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="claire@example.cm"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City / Region (Cameroon)</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Douala">Douala (Littoral)</option>
                  <option value="Yaoundé">Yaoundé (Centre)</option>
                  <option value="Bafoussam">Bafoussam (Ouest)</option>
                  <option value="Bamenda">Bamenda (Nord-Ouest)</option>
                  <option value="Garoua">Garoua (Nord)</option>
                  <option value="Maroua">Maroua (Extrême-Nord)</option>
                  <option value="Ngaoundéré">Ngaoundéré (Adamaoua)</option>
                  <option value="Buea">Buea / Limbe (Sud-Ouest)</option>
                  <option value="Kribi">Kribi / Ebolowa (Sud)</option>
                  <option value="Bertoua">Bertoua (Est)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address / Quarter</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Akwa Nord, Carrefour Idéal, Douala"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Clinical & Emergency Contact */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>Clinical Profile & Health Insurance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                <div className="relative">
                  <Droplet className="w-3.5 h-3.5 text-rose-500 absolute left-3 top-3" />
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="O+">O+ (Rh Positive)</option>
                    <option value="O-">O- (Universal Donor)</option>
                    <option value="A+">A+ (Rh Positive)</option>
                    <option value="A-">A- (Rh Negative)</option>
                    <option value="B+">B+ (Rh Positive)</option>
                    <option value="B-">B- (Rh Negative)</option>
                    <option value="AB+">AB+ (Universal Recipient)</option>
                    <option value="AB-">AB- (Rh Negative)</option>
                    <option value="Unknown">Unknown / Pending Lab Check</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={e => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. M. Paul Ngo (Spouse)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={e => setEmergencyContactPhone(e.target.value)}
                  placeholder="+237 600 00 00 00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={hasInsurance}
                    onChange={e => setHasInsurance(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Has Health Insurance Policy</span>
                </label>
              </div>

              {hasInsurance && (
                <>
                  <div className="sm:col-span-2 space-y-3 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-indigo-950 mb-1">Insurance Company</label>
                        <select
                          value={insuranceProvider}
                          onChange={e => setInsuranceProvider(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {CAMEROON_INSURANCE_COMPANIES.map(ins => (
                            <option key={ins.id} value={ins.name}>
                              {ins.name} ({ins.defaultCoveragePercent || 80}%)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-indigo-950 mb-1">Policy / Matricule #</label>
                        <input
                          type="text"
                          value={insurancePolicyNumber}
                          onChange={e => setInsurancePolicyNumber(e.target.value)}
                          placeholder="e.g. POL-CMR-84920"
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Profile & Nickname</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
