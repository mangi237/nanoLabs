import React, { useState, useEffect } from 'react';
import {
  User,
  ArrowLeft,
  Shield,
  Settings,
  LogOut,
  Check,
  Edit3,
  CreditCard,
  Camera,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  Receipt,
  Stethoscope,
  FlaskConical,
  Phone
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { CAMEROON_INSURANCE_COMPANIES } from '../../data/cameroonInsurances';
import { formatXAF } from '../../shared/money';
import { MedicalReceiptModal } from '../../components/common/MedicalReceiptModal';

interface PatientProfileScreenProps {
  onBack?: () => void;
  onNavigateInsurance?: () => void;
  onNavigateHealthRecords?: () => void;
  onLogout?: () => void;
}

export const PatientProfileScreen: React.FC<PatientProfileScreenProps> = ({
  onBack,
  onLogout
}) => {
  const { user, setUser, logout } = useAuth();
  const { activeProfile, isDependentActive, editFamilyMember } = useFamilyProfile();

  const [profilePicture, setProfilePicture] = useState<string | null>(() => {
    return (
      user?.profilePicture ||
      user?.avatarUrl ||
      activeProfile?.photoUrl ||
      localStorage.getItem(`nanolabs_avatar_${user?.id || 'demo'}`) ||
      null
    );
  });

  const [fullName, setFullName] = useState(
    user?.name || user?.fullName || activeProfile.fullName || 'Patient'
  );
  const [nickname, setNickname] = useState(activeProfile.nickname || user?.nickname || '');
  const [phone, setPhone] = useState(user?.phone || activeProfile.phone || '+237 670 00 00 00');
  const [gender] = useState(activeProfile.gender || user?.gender || 'Female');
  const [bloodGroup, setBloodGroup] = useState(activeProfile.bloodGroup || user?.bloodGroup || 'O+');
  const [city] = useState(activeProfile.city || 'Douala');

  const [nationalId, setNationalId] = useState(() => {
    return localStorage.getItem(`nanolabs_cni_${user?.id || 'demo'}`) || activeProfile.nationalId || '';
  });
  const [idCardImage, setIdCardImage] = useState<string | null>(() => {
    return localStorage.getItem(`nanolabs_cni_img_${user?.id || 'demo'}`) || null;
  });
  const [idCardStatus, setIdCardStatus] = useState<'not_uploaded' | 'pending_verification' | 'verified'>(() => {
    return (
      (localStorage.getItem(`nanolabs_cni_status_${user?.id || 'demo'}`) as any) ||
      (nationalId ? 'pending_verification' : 'not_uploaded')
    );
  });

  const [selectedInsurance, setSelectedInsurance] = useState(() => {
    return (
      activeProfile.insuranceProvider ||
      (user as any)?.insuranceProvider ||
      CAMEROON_INSURANCE_COMPANIES[0].name
    );
  });
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(() => {
    return activeProfile.insurancePolicyNumber || (user as any)?.insurancePolicyNumber || '';
  });
  const [employerSociete, setEmployerSociete] = useState(() => {
    return activeProfile.employerSociete || (user as any)?.employerSociete || '';
  });

  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [activePortfolioTab, setActivePortfolioTab] = useState<
    'tests' | 'receipts' | 'labs' | 'doctors' | 'credentials'
  >('tests');

  // Real runtime data for Profile: Booked Tests, Amount Spent, Receipts, Visited Labs, Connected Doctors
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [connectedDoctors, setConnectedDoctors] = useState<any[]>([]);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<any | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { limsService } = await import('../../services/limsService');
        const allBookings = await limsService.fetchPatientBookingsAcrossLabs(
          user?.labId ? [user.labId] : []
        );

        const activeName = (activeProfile?.fullName || fullName || '').toLowerCase().trim();
        const activeId = activeProfile?.id || '';
        const userId = user?.id || '';

        const matchedBookings = allBookings.filter((b) => {
          const bPid = (b.patientPid || b.patientId || '').trim();
          const bName = (b.patientName || '').toLowerCase().trim();
          if (isDependentActive) {
            return Boolean((activeId && bPid === activeId) || (activeName && bName === activeName));
          }
          return Boolean(
            (activeId && bPid === activeId) ||
              (userId && bPid === userId) ||
              (activeName && bName === activeName)
          );
        });

        setUserBookings(matchedBookings);

        // Connected doctors (strictly real connected doctors)
        const connRaw = localStorage.getItem(`nanolabs_connected_doctors_${activeProfile.id}`);
        const connIds: string[] = connRaw ? JSON.parse(connRaw) : [];
        if (connIds.length > 0) {
          const liveDocs = await limsService.searchAllAccreditedDoctors('');
          const combinedDocs: any[] = [...(liveDocs || [])];
          try {
            const locRaw = localStorage.getItem('nanolabs_registered_doctors');
            if (locRaw) {
              const parsed = JSON.parse(locRaw);
              if (Array.isArray(parsed)) {
                parsed.forEach((d) => {
                  if (!combinedDocs.some((x) => x.id === d.id)) combinedDocs.push(d);
                });
              }
            }
          } catch {}
          setConnectedDoctors(combinedDocs.filter((d) => connIds.includes(d.id)));
        } else {
          setConnectedDoctors([]);
        }
      } catch (err) {
        console.warn('Error loading patient profile records:', err);
      }
    };

    fetchProfileData();
    const handleCloseOverlays = () => setSelectedBookingForReceipt(null);
    window.addEventListener('nanolabs_booking_updated', fetchProfileData);
    window.addEventListener('nanolabs_close_all_overlays', handleCloseOverlays);
    window.addEventListener('nanolabs_profile_switched', handleCloseOverlays);
    return () => {
      window.removeEventListener('nanolabs_booking_updated', fetchProfileData);
      window.removeEventListener('nanolabs_close_all_overlays', handleCloseOverlays);
      window.removeEventListener('nanolabs_profile_switched', handleCloseOverlays);
    };
  }, [user?.id, activeProfile?.id, fullName, isDependentActive]);

  const paidBookings = userBookings.filter((b) => b.paymentStatus === 'paid');
  const totalSpent = paidBookings.reduce(
    (sum, b) => sum + (Number(b.actualPaidAmount ?? b.patientCoPayAmount ?? b.totalAmount) || 0),
    0
  );
  const totalTestsBooked = userBookings.reduce(
    (sum, b) => sum + ((b.tests || []).length || 1),
    0
  );

  // Aggregate unique laboratories the patient has booked/visited
  const visitedLabsMap = new Map<
    string,
    { name: string; address?: string; phone?: string; ordersCount: number; spent: number }
  >();
  userBookings.forEach((b) => {
    const lName = b.labName || 'Performing Laboratory';
    const prev = visitedLabsMap.get(lName) || {
      name: lName,
      address: b.labAddress,
      phone: b.labPhone,
      ordersCount: 0,
      spent: 0
    };
    prev.ordersCount += 1;
    if (b.paymentStatus === 'paid') {
      prev.spent += Number(b.actualPaidAmount ?? b.patientCoPayAmount ?? b.totalAmount) || 0;
    }
    if (!prev.address && b.labAddress) prev.address = b.labAddress;
    if (!prev.phone && b.labPhone) prev.phone = b.labPhone;
    visitedLabsMap.set(lName, prev);
  });
  const visitedLabs = Array.from(visitedLabsMap.values());

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
      setSaveNotice('National ID card uploaded and queued for verification.');
      setTimeout(() => setSaveNotice(null), 4000);
    };
    reader.readAsDataURL(file);
  };

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
      setSaveNotice('Profile photo updated.');
      setTimeout(() => setSaveNotice(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (insurancePolicyNumber.trim() && !nationalId.trim()) {
      setSaveNotice(
        'National ID Card Number (CNI) is required alongside your policy number to activate insurance.'
      );
      setTimeout(() => setSaveNotice(null), 5000);
      return;
    }

    localStorage.setItem(`nanolabs_cni_${user?.id || 'demo'}`, nationalId);
    if (nationalId && idCardStatus === 'not_uploaded') {
      setIdCardStatus('pending_verification');
      localStorage.setItem(`nanolabs_cni_status_${user?.id || 'demo'}`, 'pending_verification');
    }

    editFamilyMember(activeProfile.id, {
      fullName,
      nickname,
      phone,
      bloodGroup,
      nationalId,
      insuranceProvider: insurancePolicyNumber.trim() ? selectedInsurance : '',
      insurancePolicyNumber: insurancePolicyNumber.trim(),
      employerSociete,
      city
    });

    setSaveNotice('Profile, National ID & Insurance settings saved.');
    setIsEditingSettings(false);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(isEditingSettings || onBack) && (
            <button
              onClick={() => {
                if (isEditingSettings) setIsEditingSettings(false);
                else if (onBack) onBack();
              }}
              className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isEditingSettings ? 'Edit Profile & Insurance' : 'Patient Profile & Health Ledger'}
            </h1>
            <p className="text-xs text-slate-500">
              Booked tests, total spent, certified lab receipts, visited laboratories & connected doctors
            </p>
          </div>
        </div>

        {!isEditingSettings && (
          <button
            onClick={() => setIsEditingSettings(true)}
            className="px-4 py-2 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Settings</span>
          </button>
        )}
      </div>

      {saveNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{saveNotice}</span>
        </div>
      )}

      {/* 1. Profile Hero Summary Card (Identity + Total Spent + Tests Booked + Labs + Doctors) */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#003B42] via-[#005B66] to-[#007A87] text-white rounded-3xl shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt={fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/50"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/20 text-white flex items-center justify-center font-black text-2xl border-2 border-white/30">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <label
                className="absolute -bottom-1 -right-1 p-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center justify-center"
                title="Upload profile picture"
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
              <h2 className="text-lg sm:text-xl font-black text-white">{fullName}</h2>
              <p className="text-xs text-cyan-100/90 mt-0.5">
                {phone} &middot; {city} &middot; Blood Group {bloodGroup} &middot; PID {activeProfile.id}
              </p>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 border-white/15 pt-3 sm:pt-0">
            <span className="text-[11px] font-semibold text-cyan-200 block">Total Amount Spent</span>
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {formatXAF(totalSpent)}
            </span>
          </div>
        </div>

        {/* 4 Key Portfolio Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/15 text-xs">
          <div className="p-3 rounded-2xl bg-white/10">
            <span className="text-cyan-200 text-[11px] block">Tests Booked</span>
            <strong className="text-lg font-black font-mono tabular-nums text-white">{totalTestsBooked}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10">
            <span className="text-cyan-200 text-[11px] block">Certified Receipts</span>
            <strong className="text-lg font-black font-mono tabular-nums text-white">{paidBookings.length}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10">
            <span className="text-cyan-200 text-[11px] block">Laboratories</span>
            <strong className="text-lg font-black font-mono tabular-nums text-white">{visitedLabs.length}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10">
            <span className="text-cyan-200 text-[11px] block">Connected Doctors</span>
            <strong className="text-lg font-black font-mono tabular-nums text-white">{connectedDoctors.length}</strong>
          </div>
        </div>
      </div>

      {/* EDIT SETTINGS MODE */}
      {isEditingSettings ? (
        <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Full Legal Name:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Preferred Nickname:</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Mobile Phone Number:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Blood Group:</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">National ID Card (CNI) & Insurance Caisse</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">National ID Card Number (CNI):</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="Required for insurance activation"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Upload ID Card Photo:</label>
                <label className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-between cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleIdCardUpload} className="hidden" />
                  <span className="font-semibold text-slate-600">
                    {idCardImage ? 'Replace CNI Photo' : 'Choose CNI Image'}
                  </span>
                  <Camera className="w-4 h-4 text-[#006978]" />
                </label>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700 block">Insurance Company:</label>
                <select
                  value={selectedInsurance}
                  onChange={(e) => setSelectedInsurance(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  {CAMEROON_INSURANCE_COMPANIES.map((ins) => (
                    <option key={ins.id} value={ins.name}>
                      {ins.name} ({ins.city})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Policy / Matricule Number:</label>
                <input
                  type="text"
                  value={insurancePolicyNumber}
                  onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                  placeholder="Leave blank if self-paying (uninsured)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Employer / Société (Optional):</label>
                <input
                  type="text"
                  value={employerSociete}
                  onChange={(e) => setEmployerSociete(e.target.value)}
                  placeholder="Employer name"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-2xl text-sm font-black shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile & Insurance Settings</span>
          </button>
        </form>
      ) : (
        /* PORTFOLIO TABS: BOOKED TESTS | RECEIPTS | VISITED LABS | CONNECTED DOCTORS | CREDENTIALS */
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
            {[
              { id: 'tests', label: `Booked Tests (${userBookings.length})` },
              { id: 'receipts', label: `Receipts (${paidBookings.length})` },
              { id: 'labs', label: `Labs (${visitedLabs.length})` },
              { id: 'doctors', label: `Doctors (${connectedDoctors.length})` },
              { id: 'credentials', label: 'ID & Insurance' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActivePortfolioTab(t.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activePortfolioTab === t.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: BOOKED TESTS */}
          {activePortfolioTab === 'tests' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#006978]" />
                <span>All Booked Diagnostic Orders</span>
              </h3>

              {userBookings.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {userBookings.map((b) => (
                    <div
                      key={b.id || b.bookingCode}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-slate-900">#{b.bookingCode}</strong>
                          <span>&middot;</span>
                          <span className="font-bold text-[#006978]">
                            {b.labName || 'Performing Laboratory'}
                          </span>
                          <span>&middot;</span>
                          <span className="text-slate-400">
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          {(b.tests || []).map((t: any) => t.testName || t.name).join(', ')}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <span className="font-mono tabular-nums font-black text-slate-900 block">
                          {formatXAF(Number(b.patientCoPayAmount ?? b.totalAmount) || 0)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {b.biologistSigned || b.overallStatus === 'Completed'
                            ? 'Certified & Released'
                            : b.paymentStatus === 'paid'
                              ? 'Paid · In Progress'
                              : b.paymentProofSubmitted
                                ? 'Payment Pending Cashier Check'
                                : b.invoiceGenerated
                                  ? 'Invoice Ready'
                                  : b.receptionistValidated
                                    ? 'Confirmed by Reception'
                                    : 'Awaiting Receptionist'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No diagnostic tests booked yet for this profile.
                </p>
              )}
            </div>
          )}

          {/* TAB 2: CERTIFIED LAB RECEIPTS */}
          {activePortfolioTab === 'receipts' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#006978]" />
                  <span>Certified Laboratory Receipts (Immutable Lab Header)</span>
                </h3>
                <span className="text-xs font-mono font-bold text-[#006978]">
                  Total: {formatXAF(totalSpent)}
                </span>
              </div>

              {paidBookings.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {paidBookings.map((b) => (
                    <div
                      key={b.id || b.bookingCode}
                      className="py-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-slate-900">
                            {b.invoiceNumber || b.bookingCode}
                          </strong>
                          <span>&middot;</span>
                          <span className="font-semibold text-slate-800">
                            {b.labName || 'Performing Laboratory'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {b.paidAt
                            ? new Date(b.paidAt).toLocaleDateString()
                            : new Date(b.createdAt).toLocaleDateString()}{' '}
                          &middot; {b.hasInsurance ? `Insured (${b.insuranceProvider})` : 'Direct Patient Settlement'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono tabular-nums font-black text-slate-900">
                          {formatXAF(Number(b.actualPaidAmount ?? b.patientCoPayAmount ?? b.totalAmount) || 0)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForReceipt(b)}
                          className="px-3.5 py-2 bg-[#006978] hover:bg-[#005a66] text-white font-bold rounded-xl cursor-pointer"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Certified receipts appear here once the Lab Cashier verifies your payment.
                </p>
              )}
            </div>
          )}

          {/* TAB 3: VISITED LABORATORIES */}
          {activePortfolioTab === 'labs' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#006978]" />
                <span>Laboratories Connected & Booked With</span>
              </h3>

              {visitedLabs.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {visitedLabs.map((l) => (
                    <div key={l.name} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <strong className="text-slate-900 block">{l.name}</strong>
                        <span className="text-[11px] text-slate-500">
                          {l.address || 'Diagnostic Center'} &middot; {l.ordersCount} order(s)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono tabular-nums font-bold text-slate-900 block">
                          {formatXAF(l.spent)}
                        </span>
                        {l.phone && (
                          <a
                            href={`tel:${l.phone.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#006978] hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{l.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Laboratories you book tests with appear here automatically.
                </p>
              )}
            </div>
          )}

          {/* TAB 4: CONNECTED DOCTORS */}
          {activePortfolioTab === 'doctors' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#006978]" />
                <span>Connected Physicians</span>
              </h3>

              {connectedDoctors.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {connectedDoctors.map((docItem, idx) => (
                    <div key={docItem.id || idx} className="py-3.5 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 block">
                          {docItem.name?.startsWith('Dr.') ? docItem.name : `Dr. ${docItem.name}`}
                        </strong>
                        <span className="text-[11px] text-slate-500">
                          {docItem.specialty || 'General Medicine'} &middot;{' '}
                          {docItem.hospitalAffiliation || docItem.hospital || 'Medical Center'}
                        </span>
                      </div>
                      <span className="text-emerald-700 font-bold">Connected</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No connected doctors yet. Connect with registered physicians in the Doctors tab.
                </p>
              )}
            </div>
          )}

          {/* TAB 5: CNI & INSURANCE CREDENTIALS */}
          {activePortfolioTab === 'credentials' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">National ID (CNI)</span>
                  <strong className="font-mono text-slate-900">{nationalId || 'Not configured'}</strong>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Insurance Policy</span>
                  <strong className="text-slate-900">
                    {insurancePolicyNumber
                      ? `${selectedInsurance} (#${insurancePolicyNumber})`
                      : 'Self-Pay (No active insurance policy)'}
                  </strong>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Gender</span>
                  <strong className="text-slate-900">{gender}</strong>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Employer / Société</span>
                  <strong className="text-slate-900">{employerSociete || 'Not specified'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sign Out Button */}
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

      {/* Certified Lab Receipt Modal */}
      {selectedBookingForReceipt && (
        <MedicalReceiptModal
          isOpen={!!selectedBookingForReceipt}
          onClose={() => setSelectedBookingForReceipt(null)}
          booking={selectedBookingForReceipt}
        />
      )}
    </div>
  );
};

export default PatientProfileScreen;
