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
  Phone,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { CAMEROON_INSURANCE_COMPANIES } from '../../data/cameroonInsurances';
import { formatXAF } from '../../shared/money';
import { MedicalReceiptModal } from '../../components/common/MedicalReceiptModal';
import { PatientSpendingTrackerModal } from '../../components/patient/PatientSpendingTrackerModal';
import { doesBookingBelongToPatient } from '../../utils/patientOwnership';
import {
  doctorPatientFirestoreService,
  formatPatientAlias,
} from '../../services/doctorPatientFirestoreService';
import { db, ensureFirebaseAuth, doc, setDoc } from '../../services/firebase';
import { cleanFirestoreData } from '../../utils/sanitizeData';

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
    return user?.profilePicture || user?.avatarUrl || activeProfile?.photoUrl || null;
  });

  const [fullName, setFullName] = useState(
    user?.name || user?.fullName || activeProfile.fullName || 'Patient'
  );
  const [nickname, setNickname] = useState(
    (user as any)?.alias || activeProfile.nickname || user?.nickname || formatPatientAlias('', user?.name || activeProfile.fullName)
  );
  const [phone, setPhone] = useState(user?.phone || activeProfile.phone || '');
  const [gender] = useState(activeProfile.gender || user?.gender || 'Female');
  const [bloodGroup, setBloodGroup] = useState(activeProfile.bloodGroup || user?.bloodGroup || 'O+');
  const [city] = useState(activeProfile.city || (user as any)?.city || 'Douala');

  const [nationalId, setNationalId] = useState(() => {
    return (user as any)?.nationalId || activeProfile.nationalId || '';
  });
  const [idCardImage, setIdCardImage] = useState<string | null>(() => {
    return (user as any)?.idCardImage || null;
  });
  const [idCardStatus, setIdCardStatus] = useState<'not_uploaded' | 'pending_verification' | 'verified'>(() => {
    return (user as any)?.idCardStatus || (nationalId ? 'pending_verification' : 'not_uploaded');
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
    'tests' | 'receipts' | 'spending' | 'labs' | 'doctors' | 'credentials'
  >('tests');
  const [showSpendingModal, setShowSpendingModal] = useState(false);

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

        const matchedBookings = allBookings.filter((b) =>
          doesBookingBelongToPatient(b, user, activeProfile, isDependentActive)
        );

        setUserBookings(matchedBookings);
      } catch (err) {
        console.warn('Error loading patient profile records:', err);
      }
    };

    fetchProfileData();

    const patId = isDependentActive ? activeProfile.id : user?.id || '';
    const patPid = isDependentActive ? activeProfile.id : user?.patientId || user?.id;
    const unsubscribeConns = doctorPatientFirestoreService.subscribePatientConnections(
      patId,
      patPid,
      (conns) => {
        const accepted = conns
          .filter((c) => c.status === 'accepted')
          .map((c) => ({
            id: c.doctorId,
            name: c.doctorName,
            specialty: c.doctorSpecialty || 'General Medicine',
            hospital: c.doctorHospital || 'Clinical Practice',
            phone: c.doctorPhone || '',
          }));
        setConnectedDoctors(accepted);
      }
    );

    const handleCloseOverlays = () => setSelectedBookingForReceipt(null);
    window.addEventListener('nanolabs_booking_updated', fetchProfileData);
    window.addEventListener('nanolabs_close_all_overlays', handleCloseOverlays);
    window.addEventListener('nanolabs_profile_switched', handleCloseOverlays);
    return () => {
      unsubscribeConns();
      window.removeEventListener('nanolabs_booking_updated', fetchProfileData);
      window.removeEventListener('nanolabs_close_all_overlays', handleCloseOverlays);
      window.removeEventListener('nanolabs_profile_switched', handleCloseOverlays);
    };
  }, [user?.id, user?.patientId, activeProfile?.id, fullName, isDependentActive]);

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

  const persistToFirestorePatient = async (patch: Record<string, any>) => {
    if (!user?.id || isDependentActive) return;
    try {
      await ensureFirebaseAuth();
      await setDoc(
        doc(db, 'patients', user.id),
        cleanFirestoreData({ ...patch, updatedAt: new Date().toISOString() }),
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not sync patient profile patch to Firestore:', err);
    }
  };

  const handleIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setIdCardImage(dataUrl);
      setIdCardStatus('pending_verification');
      persistToFirestorePatient({ idCardImage: dataUrl, idCardStatus: 'pending_verification' });
      if (user && setUser) {
        setUser({ ...user, idCardImage: dataUrl, idCardStatus: 'pending_verification' });
      }
      setSaveNotice('National ID card uploaded and saved to your encrypted profile.');
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
      editFamilyMember(activeProfile.id, { photoUrl: dataUrl });
      persistToFirestorePatient({ profilePicture: dataUrl, avatarUrl: dataUrl });
      if (user && setUser) {
        setUser({ ...user, profilePicture: dataUrl, avatarUrl: dataUrl });
      }
      setSaveNotice('Profile photo updated in Firestore.');
      setTimeout(() => setSaveNotice(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanAlias = formatPatientAlias(nickname, fullName);
    setNickname(cleanAlias);

    if (nationalId && idCardStatus === 'not_uploaded') {
      setIdCardStatus('pending_verification');
    }

    editFamilyMember(activeProfile.id, {
      fullName,
      nickname: cleanAlias,
      phone,
      bloodGroup,
      nationalId,
      insuranceProvider: insurancePolicyNumber.trim() ? selectedInsurance : '',
      insurancePolicyNumber: insurancePolicyNumber.trim(),
      employerSociete,
      city
    });

    await persistToFirestorePatient({
      name: fullName,
      alias: cleanAlias,
      aliasLower: cleanAlias.toLowerCase(),
      nickname: cleanAlias,
      phone,
      bloodGroup,
      nationalId,
      insuranceProvider: insurancePolicyNumber.trim() ? selectedInsurance : '',
      insurancePolicyNumber: insurancePolicyNumber.trim(),
      employerSociete,
      city,
    });

    if (user && setUser && !isDependentActive) {
      setUser({
        ...user,
        name: fullName,
        alias: cleanAlias,
        nickname: cleanAlias,
        phone,
        bloodGroup,
        nationalId,
        insuranceProvider: insurancePolicyNumber.trim() ? selectedInsurance : '',
        insurancePolicyNumber: insurancePolicyNumber.trim(),
        employerSociete,
      });
    }

    setSaveNotice('Profile, @alias, National ID & Insurance settings saved to Firestore.');
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">{fullName}</h2>
                {nickname && (
                  <span className="px-2 py-0.5 rounded-md bg-white/15 text-cyan-100 font-mono text-xs font-bold">
                    @{nickname.replace(/^@+/, '')}
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-100/90 mt-0.5">
                {phone} &middot; {city} &middot; Blood Group {bloodGroup} &middot; PID {user?.patientId || activeProfile.id}
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
                <label className="font-bold text-slate-700 block">Doctor Search @alias:</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. amina_njoya"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-semibold text-slate-900"
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
              { id: 'tests', label: `Analyses (${userBookings.length})` },
              { id: 'receipts', label: `Reçus (${paidBookings.length})` },
              { id: 'spending', label: `Dépenses (${formatXAF(totalSpent)})` },
              { id: 'labs', label: `Labos (${visitedLabs.length})` },
              { id: 'doctors', label: `Médecins (${connectedDoctors.length})` },
              { id: 'credentials', label: 'CNI & Assurance' }
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

          {/* TAB: HEALTH & LAB SPENDING ANALYTICS */}
          {activePortfolioTab === 'spending' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#006978] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Suivi Budgétaire &amp; Dépenses par Laboratoire
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Transparence intégrale sur vos règlements et comparaison par établissement
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSpendingModal(true)}
                  className="px-4 py-2 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-center shadow-xs cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Ouvrir l&apos;Analyse Complète</span>
                </button>
              </div>

              {/* Quick KPI stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Dépensé</span>
                  <p className="text-xl font-black text-[#006978] font-mono tabular-nums">{formatXAF(totalSpent)}</p>
                  <span className="text-[10px] text-slate-500">{paidBookings.length} bilan(s) réglé(s)</span>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Prise en Charge Tiers-Payant</span>
                  <p className="text-xl font-black text-emerald-700 font-mono tabular-nums">
                    {formatXAF(userBookings.reduce((acc, b) => acc + (Number(b.insuranceCoveredAmount || b.insuranceClaimAmount) || 0), 0))}
                  </p>
                  <span className="text-[10px] text-emerald-800">Économisé via assurance</span>
                </div>
                <div className="p-3.5 bg-cyan-50 rounded-2xl border border-cyan-100">
                  <span className="text-[10px] uppercase font-bold text-cyan-800 block">Frais Plateforme nanoLabs</span>
                  <p className="text-xl font-black text-cyan-800 font-mono tabular-nums">
                    {formatXAF(Math.round(totalSpent * 0.05))}
                  </p>
                  <span className="text-[10px] text-cyan-900">5% équitable par lot</span>
                </div>
              </div>

              {/* Lab-by-lab breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Dépenses par Laboratoire Partenaire ({visitedLabs.length})
                </h4>

                {visitedLabs.length > 0 ? (
                  <div className="space-y-2.5">
                    {visitedLabs.map((l) => {
                      const pct = totalSpent > 0 ? Math.round((l.spent / totalSpent) * 100) : 0;
                      return (
                        <div key={l.name} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{l.name}</span>
                            <div className="text-right">
                              <span className="font-mono tabular-nums font-black text-slate-900 block">{formatXAF(l.spent)}</span>
                              <span className="text-[10px] text-slate-500">{l.ordersCount} lot(s) &middot; {pct}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#006978] h-full rounded-full" style={{ width: `${Math.max(4, pct)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Aucune dépense de laboratoire pour le moment.</p>
                )}
              </div>
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

      {/* Patient Spending & Health Budget Tracker Modal */}
      {showSpendingModal && (
        <PatientSpendingTrackerModal
          isOpen={showSpendingModal}
          onClose={() => setShowSpendingModal(false)}
          bookings={userBookings}
        />
      )}
    </div>
  );
};

export default PatientProfileScreen;
