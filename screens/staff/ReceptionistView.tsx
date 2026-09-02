import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import authService from '../../services/authService';
import { limsService, PatientBooking } from '../../services/limsService';
import { MASTER_TESTS_CATALOG } from '../../data/masterTestsData';
import { OFFICIAL_MASTER_TEST_CATALOG, OFFICIAL_CATEGORIES } from '../../data/officialTestCatalog';
import { validatePhoneNumber, cleanFirestoreData } from '../../utils/sanitizeData';
import { uploadService } from '../../api/upload';
import { CAMEROON_INSURANCE_COMPANIES, calculateAgeFromDOB, formatDOBDisplay } from '../../data/cameroonInsurances';
import { 
  Search, 
  UserPlus, 
  Users, 
  Copy, 
  Check, 
  UserCheck, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Info, 
  Eye, 
  X, 
  Sparkles,
  ChevronRight,
  Clock,
  PlusCircle,
  TestTube,
  DollarSign,
  Building2,
  CheckCircle2,
  Receipt,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Shield,
  CreditCard,
  Droplet,
  Upload,
  AlertCircle,
  FileCheck,
  Stethoscope
} from 'lucide-react';

const BLOOD_GROUPS = [
  { value: 'Unknown', label: 'Unknown', badge: 'Uncertain', desc: 'Can be verified at lab' },
  { value: 'O+', label: 'O Positive (O+)', badge: 'Universal Red Donor', desc: 'Most common blood type' },
  { value: 'O-', label: 'O Negative (O-)', badge: 'Universal Donor', desc: 'Emergency red cells' },
  { value: 'A+', label: 'A Positive (A+)', badge: 'Common', desc: 'A & O compatibility' },
  { value: 'A-', label: 'A Negative (A-)', badge: 'Rare', desc: 'A- & O- compatibility' },
  { value: 'B+', label: 'B Positive (B+)', badge: 'Common', desc: 'B & O compatibility' },
  { value: 'B-', label: 'B Negative (B-)', badge: 'Rare', desc: 'B- & O- compatibility' },
  { value: 'AB+', label: 'AB Positive (AB+)', badge: 'Universal Recipient', desc: 'Accepts all blood types' },
  { value: 'AB-', label: 'AB Negative (AB-)', badge: 'Very Rare', desc: 'Accepts negative types' }
];

const COMMON_INSURANCES = [
  'Ascoma Health',
  'AXA Mansard',
  'Allianz Care',
  'Cigna Global',
  'CNPS / National Social Insurance',
  'NHIS / Universal Health',
  'GMC Henner',
  'Sanlam Health',
  'Other Corporate / Private HMO'
];

interface ReceptionistViewProps {
  onBack?: () => void;
  onNavigateRegister?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
  onNavigatePatientDetails?: (patientId: string) => void;
}

export const ReceptionistView: React.FC<ReceptionistViewProps> = ({
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress,
  onNavigatePatientDetails
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [patients, setPatients] = useState<any[]>([]);
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Walk-in Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPatientCredentials, setCreatedPatientCredentials] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Add Test Order Modal for Existing Patient State
  const [selectedPatientForTest, setSelectedPatientForTest] = useState<any | null>(null);
  const [selectedMasterTestIds, setSelectedMasterTestIds] = useState<string[]>([]);
  const [attendingDoctor, setAttendingDoctor] = useState('Self-Referred / General Outpatient');
  const [customDoctorName, setCustomDoctorName] = useState('');
  const [registeredStaffList, setRegisteredStaffList] = useState<any[]>([]);
  const [referringDoctorsList, setReferringDoctorsList] = useState<any[]>([]);
  const [selectedRegisteredStaffMember, setSelectedRegisteredStaffMember] = useState<any | null>(null);
  const [testOrderCategory, setTestOrderCategory] = useState<string>('All');
  const [testOrderSearch, setTestOrderSearch] = useState('');
  const [testOrderNotes, setTestOrderNotes] = useState('');
  const [isOrderingTest, setIsOrderingTest] = useState(false);

  // Registration Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('1996-05-15');
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState('Male');
  const [city, setCity] = useState('Douala');
  const [nationalId, setNationalId] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceProvider, setInsuranceProvider] = useState('Activa Assurances (Douala)');
  const [insuranceCoveragePercent, setInsuranceCoveragePercent] = useState<number>(80);
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceCardUrl, setInsuranceCardUrl] = useState('');
  const [uploadingCard, setUploadingCard] = useState(false);
  const [allergies, setAllergies] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Referral Fields
  const [referringDoctor, setReferringDoctor] = useState('');
  const [referralHospital, setReferralHospital] = useState('');
  const [referralNotes, setReferralNotes] = useState('');

  // Staff Member Exemption Fields
  const [isStaffMember, setIsStaffMember] = useState(false);
  const [staffDesignation, setStaffDesignation] = useState('');

  // Helper to calculate exact age from DOB
  const handleDobChange = (newDob: string) => {
    setDob(newDob);
    if (!newDob) return;
    const birthDate = new Date(newDob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    const finalAge = Math.max(0, calculatedAge);
    setAge(finalAge.toString());
  };

  // Selected Patient Details Modal
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  // Checkbox-based test selection state for patient activation
  const [selectedTestsMap, setSelectedTestsMap] = useState<Record<string, string[]>>({});
  
  // Access Code Modal for Receptionist Activation
  const [activationModalPatient, setActivationModalPatient] = useState<any | null>(null);
  const [activationBookingIds, setActivationBookingIds] = useState<string[]>([]);
  const [receptionistCode, setReceptionistCode] = useState('');
  const [activationError, setActivationError] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInsuranceCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCard(true);
    try {
      const res = await uploadService.uploadFile(file);
      if (res.success && res.fileUrl) {
        setInsuranceCardUrl(res.fileUrl);
      } else {
        alert('Could not upload insurance card image. Please try another image.');
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingCard(false);
    }
  };

  const getPatientTests = (patient: any) => {
    const patientId = (patient.id || '').trim();
    const patientPid = (patient.patientId || '').trim();
    const patientEmail = (patient.email || '').trim().toLowerCase();
    const patientPhone = (patient.phone || '').trim();

    const matchedBookings = bookings.filter(b => {
      const bPid = (b.patientId || '').trim();
      const bPatientPid = (b.patientPid || '').trim();
      const bEmail = (b.patientEmail || '').trim().toLowerCase();
      const bPhone = (b.patientPhone || '').trim();

      const matchId = (patientId && (bPid === patientId || bPatientPid === patientId)) ||
                      (patientPid && (bPid === patientPid || bPatientPid === patientPid));
      const matchEmail = Boolean(patientEmail && bEmail && patientEmail === bEmail);
      const matchPhone = Boolean(patientPhone && bPhone && patientPhone === bPhone);

      return matchId || matchEmail || matchPhone;
    });

    const allTestsFromBookings = matchedBookings.flatMap(b => (b.tests || []).map((t, idx) => {
      const isThisTestValidated = (t as any).receptionistValidated === true || t.status === 'Completed' || t.status === 'In_Lab_Testing' || b.paymentStatus === 'paid';
      return {
        id: t.id || t.testId || `bt-${b.id}-${idx}`,
        testId: t.testId || t.id || `t-${idx}`,
        testName: t.testName || (t as any).name || 'Diagnostic Test',
        category: t.category || 'General Diagnostic',
        price: t.price || 5500,
        status: t.status || (isThisTestValidated ? (b.paymentStatus === 'paid' ? 'Pending_Collection' : 'Pending_Payment') : 'Pending_Validation'),
        bookingCode: b.bookingCode,
        bookingId: b.id,
        receptionistValidated: isThisTestValidated,
        createdAt: b.createdAt
      };
    }));

    const directLabTests = (patient.labTests || []).map((t: any, idx: number) => ({
      id: t.id || t.testId || `direct-${idx}-${t.name || t.testName}`,
      testId: t.testId || t.id || `t-${idx}`,
      testName: t.testName || t.name || 'Laboratory Diagnostic Test',
      category: t.category || 'Laboratory Test',
      price: t.price || 5500,
      status: t.status || (t.paid ? 'Paid' : 'Pending_Payment'),
      bookingCode: t.bookingCode || 'DIRECT',
      bookingId: t.bookingId || t.id || `direct-${idx}`,
      receptionistValidated: t.receptionistValidated === true || t.status === 'Paid' || t.paid === true,
      createdAt: t.requestedDate || t.requestedAt || patient.createdAt || new Date().toISOString()
    }));

    const combined = [...allTestsFromBookings];
    directLabTests.forEach((dt: any ) => {
      const alreadyIn = combined.some(ct => 
        (ct.id && ct.id === dt.id) || 
        (ct.bookingId && ct.bookingId === dt.bookingId && ct.testName?.toLowerCase() === dt.testName?.toLowerCase())
      );
      if (!alreadyIn) {
        combined.push(dt);
      }
    });

    return combined;
  };

  const toggleTestSelection = (patientId: string, testIdentifier: string) => {
    setSelectedTestsMap(prev => {
      const currentList = prev[patientId] || [];
      if (currentList.includes(testIdentifier)) {
        return { ...prev, [patientId]: currentList.filter(id => id !== testIdentifier) };
      } else {
        return { ...prev, [patientId]: [...currentList, testIdentifier] };
      }
    });
  };

  const selectAllUnvalidatedTests = (patient: any) => {
    const pId = patient.id || patient.patientId;
    const pTests = getPatientTests(patient);
    const unvalidatedKeys = pTests
      .filter(t => !t.receptionistValidated && (t.status as string) !== 'Paid' && t.status !== 'Completed')
      .map(t => t.id || t.testName);
    
    setSelectedTestsMap(prev => ({
      ...prev,
      [pId]: unvalidatedKeys
    }));
  };

  const handleOpenActivationModal = (patient: any, testIdentifiers: string[]) => {
    if (testIdentifiers.length === 0) return;
    setActivationModalPatient(patient);
    setActivationBookingIds(testIdentifiers);
    setReceptionistCode('');
    setActivationError('');
  };

  const handleConfirmActivationWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');

    const cleanCode = receptionistCode.trim();
    if (!cleanCode) {
      setActivationError('Please enter your authorized Receptionist Access PIN / Passcode.');
      return;
    }

    // Verify staff credentials with await
    const authResult = await authService.verifyStaffActionCode(
      cleanCode,
      ['receptionist', 'admin', 'superadmin', 'lab_director'],
      user?.accessCode || (user as any)?.initialCode,
      targetLabId
    );

    if (!authResult.authorized) {
      setActivationError(authResult.error || 'Access Denied: Invalid Receptionist PIN / Passcode. Only authorized front desk or supervisor credentials can validate tests.');
      return;
    }

    setIsActivating(true);
    try {
      const pId = activationModalPatient?.id || activationModalPatient?.patientId;
      await limsService.validateBatchBookingsCheckIn({
        labId: targetLabId,
        bookingIds: activationBookingIds,
        validatorName: authResult.staffName || user?.name || 'Front Desk Receptionist',
        patientId: pId,
        patientData: activationModalPatient
      });

      // Clear selection
      if (activationModalPatient) {
        setSelectedTestsMap(prev => ({ ...prev, [pId]: [] }));
      }

      setActivationModalPatient(null);
      setActivationBookingIds([]);
      setReceptionistCode('');
      await fetchData();
    } catch (err: any) {
      console.error('Error confirming test activation:', err);
      setActivationError('Failed to activate tests. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    // 1. Subscribe to Live Bookings / Test Statuses
    const unsubBookings = limsService.subscribeToBookings(targetLabId, (updatedBookings) => {
      setBookings(updatedBookings);
      setLoading(false);
    });

    // 2. Subscribe to Live Patients Directory
    const unsubPatients = limsService.subscribeToPatients(targetLabId, (updatedPatients) => {
      setPatients(updatedPatients);
      setLoading(false);
    });

    // 3. Load Registered Staff & Doctors
    const loadStaffAndDoctors = async () => {
      try {
        const staffSnap = await getDocs(collection(db, 'labs', targetLabId, 'staff'));
        let sList = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (sList.length === 0) {
          try {
            const serverStaff = await authService.getServerStaffList();
            if (serverStaff && serverStaff.length > 0) sList = serverStaff;
          } catch {}
        }
        setRegisteredStaffList(sList);

        const docStats = await limsService.fetchDoctorReferralStats(targetLabId);
        setReferringDoctorsList(docStats || []);
      } catch (err) {
        console.warn('Error loading staff/doctors in receptionist:', err);
      }
    };
    loadStaffAndDoctors();

    return () => {
      unsubBookings();
      unsubPatients();
    };
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const allPatients: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPatients(allPatients);

      const allBookings = await limsService.fetchAllBookings(targetLabId);
      setBookings(allBookings);

      const staffSnap = await getDocs(collection(db, 'labs', targetLabId, 'staff'));
      let sList = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (sList.length === 0) {
        try {
          const serverStaff = await authService.getServerStaffList();
          if (serverStaff && serverStaff.length > 0) sList = serverStaff;
        } catch {}
      }
      setRegisteredStaffList(sList);
    } catch (e) {
      console.error('Error fetching receptionist data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert('Please provide patient name and phone number.');
      return;
    }

    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      alert(phoneValidation.errorMessage || 'Please provide a valid 9-digit phone number (e.g., 671234567).');
      return;
    }

    if (emergencyContactPhone.trim()) {
      const emergencyValidation = validatePhoneNumber(emergencyContactPhone);
      if (!emergencyValidation.isValid) {
        alert('Emergency contact: ' + (emergencyValidation.errorMessage || 'Please enter a valid 9-digit phone number.'));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const generatedPid = 'PT-' + Math.floor(10000 + Math.random() * 90000);
      const generatedAccessCode = 'PAT-' + Math.floor(1000 + Math.random() * 9000);

      const chosenInsurance = hasInsurance ? insuranceProvider : 'Out-of-Pocket / Self';
      const chosenPolicy = hasInsurance ? (insurancePolicyNumber.trim() || 'N/A') : 'N/A';

      const rawPayload = {
        name: fullName.trim(),
        phone: phoneValidation.formatted || phone.trim(),
        email: email.trim().toLowerCase() || `${generatedPid.toLowerCase()}@nanolabs.cm`,
        dob: dob || null,
        dateOfBirth: dob || null,
        age: parseInt(age) || 28,
        gender,
        city: city || 'Douala',
        address: city || 'Douala',
        nationalId: nationalId.trim() || 'N/A',
        bloodType: bloodType || 'O+',
        bloodGroup: bloodType || 'O+',
        hasInsurance,
        insuranceProvider: chosenInsurance,
        insurancePolicyNumber: chosenPolicy,
        insuranceCoveragePercent: hasInsurance ? insuranceCoveragePercent : 0,
        insuranceCardUrl: hasInsurance && insuranceCardUrl ? insuranceCardUrl : null,
        referringDoctor: referringDoctor.trim() || 'None / Self-Referred',
        referralHospital: referralHospital.trim() || 'N/A',
        referralNotes: referralNotes.trim() || '',
        isStaffMember,
        staffDesignation: isStaffMember ? (staffDesignation.trim() || 'Staff Personnel') : undefined,
        allergies: allergies.trim() || 'None reported',
        emergencyContactName: emergencyContactName.trim() || 'N/A',
        emergencyContactPhone: emergencyContactPhone.trim() || 'N/A',
        patientId: generatedPid,
        accessCode: generatedAccessCode,
        labId: targetLabId,
        labName: lab?.name || 'nanoLabs Central Diagnostics',
        registeredBy: user?.name || 'Front Desk Receptionist',
        registrationType: 'walk_in',
        status: 'Checked-In',
        checkedInAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const patientPayload = cleanFirestoreData(rawPayload);

      const res = await authService.registerPatient(targetLabId, patientPayload);

      if (res.success) {
        setCreatedPatientCredentials({
          name: fullName.trim(),
          patientId: generatedPid,
          accessCode: generatedAccessCode,
          phone: phoneValidation.formatted || phone.trim(),
          bloodType,
          insuranceProvider: chosenInsurance,
          rawPatient: patientPayload
        });

        setFullName('');
        setPhone('');
        setEmail('');
        setDob('1996-05-15');
        setAge('28');
        setGender('Male');
        setCity('Douala');
        setNationalId('');
        setBloodType('O+');
        setHasInsurance(false);
        setInsuranceProvider('Ascoma Health');
        setInsurancePolicyNumber('');
        setInsuranceCardUrl('');
        setReferringDoctor('');
        setReferralHospital('');
        setReferralNotes('');
        setIsStaffMember(false);
        setStaffDesignation('');
        setAllergies('');
        setEmergencyContactName('');
        setEmergencyContactPhone('');
        
        await fetchData();
      } else {
        alert(res.error || 'Registration failed. Please check the inputs.');
      }
    } catch (err: any) {
      console.error('Patient registration error:', err);
      alert('An error occurred during patient registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTestOrderForPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForTest || selectedMasterTestIds.length === 0) {
      alert('Please select at least one diagnostic test from the catalog.');
      return;
    }

    const doctorToUse = attendingDoctor === 'Other' 
      ? (customDoctorName.trim() || 'External Attending Physician')
      : attendingDoctor;

    setIsOrderingTest(true);
    try {
      await limsService.createBooking({
        labId: targetLabId,
        patientId: selectedPatientForTest.id || selectedPatientForTest.patientId,
        patientName: selectedPatientForTest.name,
        dateOfBirth: selectedPatientForTest.dob || undefined,
        patientAge: selectedPatientForTest.age || 30,
        patientGender: selectedPatientForTest.gender || 'Male',
        patientPhone: selectedPatientForTest.phone || '',
        patientEmail: selectedPatientForTest.email || '',
        patientPid: selectedPatientForTest.patientId || selectedPatientForTest.id,
        referringDoctor: doctorToUse || selectedPatientForTest.referringDoctor,
        referralHospital: selectedPatientForTest.referralHospital,
        referralNotes: selectedPatientForTest.referralNotes,
        isStaffExemption: Boolean(selectedPatientForTest.isStaffMember),
        staffMemberName: selectedPatientForTest.isStaffMember ? selectedPatientForTest.name : undefined,
        staffDesignation: selectedPatientForTest.staffDesignation,
        doctorName: doctorToUse,
        selectedMasterTestIds,
        clinicalNotes: testOrderNotes.trim() || undefined,
        creatorName: user?.name || 'Front Desk Receptionist'
      });

      if (selectedPatientForTest.isStaffMember) {
        alert(`Staff Free Test Exemption Applied for ${selectedPatientForTest.name}! Billed at 0 FCFA with instant Admin Alert triggered.`);
      } else {
        alert(`Test order generated successfully for ${selectedPatientForTest.name}! Unpaid invoice routed to Cashier.`);
      }

      setSelectedPatientForTest(null);
      setSelectedMasterTestIds([]);
      setTestOrderNotes('');
      setCustomDoctorName('');
      await fetchData();
    } catch (err) {
      console.error('Error creating test order:', err);
      alert('Failed to generate test order.');
    } finally {
      setIsOrderingTest(false);
    }
  };

  const copyCredentials = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery) ||
    p.accessCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingBookings = bookings.filter(b => b.paymentStatus === 'unpaid' || b.overallStatus === 'Pending_Payment');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = patients.filter(p => p.createdAt && p.createdAt.startsWith(todayStr)).length;

  return (
    <div className="space-y-6">
      <Header
        title="Reception Desk & Patient Admissions"
        subtitle="Step 1: Patient admission, test request intake, credential issuance & directory"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      {/* Staff Hero Banner */}
      <StaffHeroBanner
        workstationNumber="Workstation 01"
        workstationTitle="Patient Admissions & Intake Counter"
        description="Register walk-in patient accounts, order diagnostic tests for existing patients, issue access passcodes, and manage patient check-in statuses."
        actions={
          <button
            onClick={() => {
              setCreatedPatientCredentials(null);
              setShowRegisterModal(true);
            }}
            className="px-5 py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            + Register New Patient
          </button>
        }
      />

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Patient Accounts</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{patients.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Test Requests</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingBookings.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Walk-in Admissions</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{todayCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* PENDING PATIENT TEST REQUESTS QUEUE */}
      {pendingBookings.length > 0 && (
        <div className="bg-amber-500/10 rounded-2xl border border-amber-300/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-700" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Pending Patient Test Requests ({pendingBookings.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-800">
              Awaiting Cashier Payment Verification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingBookings.map(b => (
              <div key={b.id} className="p-3.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="font-extrabold text-xs text-slate-900">{b.patientName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-teal-700">{b.bookingCode}</span>
                    <span>• {b.tests?.map(t => t.testName).join(', ')}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-xs text-slate-900 block">{b.totalAmount?.toLocaleString()} XAF</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                    Unpaid • Unlocked at Cashier
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Directory Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            Registered Patient Directory ({filteredPatients.length})
          </h3>

          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, PID, phone, or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium">Loading patient directory...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">No patients matched your search.</p>
            <p>Click <span className="font-bold text-teal-600">"+ Register New Patient"</span> to add a new account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Patient ID (PID)</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Requested Tests</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPatients.map(patient => {
                  const pTests = getPatientTests(patient);
                  const isExpanded = expandedPatientId === patient.id;
                  const isWalkIn = patient.registrationType === 'walk_in' || patient.isWalkIn === true || (patient.registeredBy && !patient.registeredBy.toLowerCase().includes('online'));
                  const unvalidatedCount = pTests.filter(t => !t.receptionistValidated && (t.status as string) !== 'Paid' && t.status !== 'Completed').length;

                  return (
                    <React.Fragment key={patient.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span>{patient.name}</span>
                            {!isWalkIn && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 text-[9px] font-extrabold">
                                ONLINE USER
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {patient.gender || 'M'}, {patient.age || 28} Yrs • {patient.city || 'Douala'}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-teal-700">
                          {patient.patientId || patient.id}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 font-bold rounded-md border border-red-200 text-[11px]">
                            {patient.bloodType || 'O+'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => setExpandedPatientId(isExpanded ? null : patient.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200/80 transition-all font-bold text-[11px] cursor-pointer"
                          >
                            <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                            <span>{pTests.length} Test{pTests.length !== 1 ? 's' : ''} Requested</span>
                            {unvalidatedCount > 0 && (
                              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full animate-pulse">
                                {unvalidatedCount} Pending
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-teal-700" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-teal-700" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                          {patient.phone || '+237 670000000'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isWalkIn ? (
                              <button
                                onClick={() => {
                                  setSelectedPatientForTest(patient);
                                  setSelectedMasterTestIds([]);
                                }}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] shadow-xs"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                + Order Test
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-semibold rounded-lg text-[10px] border border-slate-200">
                                Portal Managed
                              </span>
                            )}
                            <button
                              onClick={() => setSelectedPatient(patient)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              Summary
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED PATIENT TESTS DROPDOWN ACCORDION */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-t border-b border-teal-100">
                          <td colSpan={6} className="p-4">
                            <div className="bg-white rounded-xl border border-teal-200 p-4 space-y-4 shadow-xs">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <FlaskConical className="w-4 h-4 text-teal-600" />
                                  <h4 className="font-extrabold text-xs text-slate-900">
                                    Diagnostic Test Requests for {patient.name}
                                  </h4>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium">
                                  {isWalkIn ? 'Walk-In Patient: Receptionist creates test orders.' : 'Online Patient: Patient requested online.'}
                                </div>
                              </div>

                              {pTests.length === 0 ? (
                                <p className="text-xs text-slate-500 italic py-2">
                                  No diagnostic tests ordered yet for this patient.
                                </p>
                              ) : (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="text-[11px] font-bold text-slate-600">
                                      Click test cards or use checkboxes below to select tests for Check-in & Cashier Activation:
                                    </div>
                                    {pTests.some((t: any) => !t.receptionistValidated && t.status !== 'Paid' && t.status !== 'Completed') && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          selectAllUnvalidatedTests(patient);
                                        }}
                                        className="text-xs text-teal-700 font-extrabold hover:text-teal-900 underline cursor-pointer"
                                      >
                                        Select All Pending Tests
                                      </button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {pTests.map((t: any, idx: number) => {
                                      const isValidated = t.receptionistValidated === true || t.status === 'Paid' || t.status === 'Completed';
                                      const pId = patient.id || patient.patientId;
                                      const testKey = t.id || t.testName || t.bookingId;
                                      const isChecked = (selectedTestsMap[pId] || []).includes(testKey) || 
                                                        (selectedTestsMap[pId] || []).includes(t.id) ||
                                                        (selectedTestsMap[pId] || []).includes(t.testName) ||
                                                        (t.bookingId && (selectedTestsMap[pId] || []).includes(t.bookingId));

                                      return (
                                        <div
                                          key={t.id || idx}
                                          onClick={() => {
                                            if (!isValidated) {
                                              toggleTestSelection(pId, testKey);
                                            }
                                          }}
                                          className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all relative ${
                                            isValidated 
                                              ? 'bg-slate-50/60 border-slate-200 opacity-80' 
                                              : isChecked
                                              ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 shadow-sm cursor-pointer'
                                              : 'bg-amber-50/40 hover:bg-amber-50/80 border-amber-300 shadow-2xs cursor-pointer'
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                              {!isValidated ? (
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleTestSelection(pId, testKey);
                                                  }}
                                                  className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                                                />
                                              ) : (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                              )}
                                              <div>
                                                <div className="font-extrabold text-xs text-slate-900">{t.testName}</div>
                                                <div className="text-[10px] text-slate-500 font-medium">{t.category || 'General Diagnostic'}</div>
                                              </div>
                                            </div>

                                            {!isValidated && (
                                              <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 text-[9px] font-black rounded-full shrink-0">
                                                AWAITING CHECK-IN
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                                            <span className="font-mono font-black text-slate-900">
                                              {(t.price || 5500).toLocaleString()} FCFA
                                            </span>

                                            {isValidated ? (
                                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                                                Activated ➔ Cashier Ready
                                              </span>
                                            ) : (
                                              <span className={`text-[10px] font-bold ${isChecked ? 'text-teal-700' : 'text-slate-400'}`}>
                                                {isChecked ? 'Selected for Activation' : 'Click card to select'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* BOTTOM ACTION PANEL FOR ACTIVATION WITH ACCESS CODE */}
                                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl">
                                    <div className="text-xs text-slate-600">
                                      <span className="font-bold text-slate-900">Selected Tests: </span>
                                      <span className="font-mono font-black text-teal-700">
                                        {(selectedTestsMap[patient.id || patient.patientId] || []).length}
                                      </span> test(s) checked
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                      {isWalkIn && (
                                        <button
                                          onClick={() => {
                                            setSelectedPatientForTest(patient);
                                            setSelectedMasterTestIds([]);
                                          }}
                                          className="px-3 py-2 bg-white hover:bg-slate-100 text-teal-800 font-bold rounded-xl text-xs border border-teal-200 flex items-center gap-1 cursor-pointer transition-all"
                                        >
                                          <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
                                          + Add Walk-In Test
                                        </button>
                                      )}

                                      <button
                                        onClick={() => {
                                          const pId = patient.id || patient.patientId;
                                          const selIds = selectedTestsMap[pId] || [];
                                          if (selIds.length === 0) {
                                            alert('Please select at least one test checkbox to activate.');
                                            return;
                                          }
                                          handleOpenActivationModal(patient, selIds);
                                        }}
                                        disabled={(selectedTestsMap[patient.id || patient.patientId] || []).length === 0}
                                        className="w-full sm:w-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Activate Selected Tests ({(selectedTestsMap[patient.id || patient.patientId] || []).length})</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORDER TEST FOR EXISTING PATIENT MODAL */}
      {selectedPatientForTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Generate Diagnostic Test Order
                  </h3>
                  <p className="text-xs text-teal-700 font-semibold flex items-center gap-1.5">
                    <span>Patient: {selectedPatientForTest.name}</span>
                    <span className="font-mono bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded text-[10px]">
                      {selectedPatientForTest.patientId || selectedPatientForTest.id}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPatientForTest(null);
                  setSelectedMasterTestIds([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTestOrderForPatient} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Doctor / Lab Tech Selection Dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Attending / Referring Physician or Lab Specialist *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={attendingDoctor}
                    onChange={e => setAttendingDoctor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="Self-Referred / General Outpatient">Self-Referred / General Outpatient</option>
                    {referringDoctorsList.map((doc: any) => (
                      <option key={doc.id || doc.doctorName} value={doc.doctorName}>
                        {doc.doctorName} {doc.specialty ? `(${doc.specialty})` : ''} {doc.hospital ? `- ${doc.hospital}` : ''}
                      </option>
                    ))}
                    {registeredStaffList.map((st: any) => (
                      <option key={st.id || st.email} value={st.name}>
                        {st.name} ({st.role || 'Laboratory Staff'})
                      </option>
                    ))}
                    <option value="Other">Other / External Referring Doctor...</option>
                  </select>

                  {attendingDoctor === 'Other' && (
                    <input
                      type="text"
                      value={customDoctorName}
                      onChange={e => setCustomDoctorName(e.target.value)}
                      required
                      placeholder="Enter Doctor / Hospital Name"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>
              </div>

              {/* Test Catalog Filtering & Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Diagnostic Tests from Master Catalog ({selectedMasterTestIds.length} Selected)
                  </label>
                </div>

                {/* Search and Category Filter Chips */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={testOrderSearch}
                      onChange={e => setTestOrderSearch(e.target.value)}
                      placeholder="Search test by name, code or specimen..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                    {['All', 'Microbiology', 'Hematology', 'Serology / Immunology', 'Biochemistry', 'Hormones'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTestOrderCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          testOrderCategory === cat
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Test Items List */}
                <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2.5 bg-slate-50">
                  {OFFICIAL_MASTER_TEST_CATALOG
                    .filter(item => {
                      const matchesCat = testOrderCategory === 'All' || item.category.toLowerCase().includes(testOrderCategory.toLowerCase());
                      const matchesSearch = !testOrderSearch || 
                        item.name.toLowerCase().includes(testOrderSearch.toLowerCase()) ||
                        (item.aliases && item.aliases.some(a => a.toLowerCase().includes(testOrderSearch.toLowerCase()))) ||
                        item.sampleType.toLowerCase().includes(testOrderSearch.toLowerCase());
                      return matchesCat && matchesSearch;
                    })
                    .map(item => {
                      const isChecked = selectedMasterTestIds.includes(item.id);

                      return (
                        <label 
                          key={item.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-teal-50/80 border-teal-500 text-teal-950 font-bold shadow-xs' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMasterTestIds([...selectedMasterTestIds, item.id]);
                                } else {
                                  setSelectedMasterTestIds(selectedMasterTestIds.filter(id => id !== item.id));
                                }
                              }}
                              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900">{item.name}</div>
                              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-2">
                                <span>{item.category}</span>
                                <span>•</span>
                                <span>{item.sampleType}</span>
                                <span>•</span>
                                <span className="text-teal-700 font-semibold">{item.turnaroundTime || '24 hrs'}</span>
                              </div>
                            </div>
                          </div>

                          <span className="font-mono text-xs text-teal-700 font-black shrink-0">
                            {item.price.toLocaleString()} XAF
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Clinical Notes / Symptoms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes / Reason for Testing (Optional)</label>
                <input
                  type="text"
                  value={testOrderNotes}
                  onChange={e => setTestOrderNotes(e.target.value)}
                  placeholder="e.g. Routine annual checkup, persistent fever, pre-op screening"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Live Synchronized Pricing Card */}
              <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-teal-900 block">Total Order Amount:</span>
                  <span className="text-[11px] text-teal-700 font-medium">
                    {selectedMasterTestIds.length} test{selectedMasterTestIds.length === 1 ? '' : 's'} selected • Invoice routed to Cashier
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-lg text-teal-800">
                    {selectedMasterTestIds.reduce((acc, id) => {
                      const item = OFFICIAL_MASTER_TEST_CATALOG.find(m => m.id === id) || MASTER_TESTS_CATALOG.find(m => m.id === id);
                      const priceVal = item ? ('price' in item ? item.price : (item as any).basePrice) : 0;
                      return acc + (priceVal || 0);
                    }, 0).toLocaleString()} XAF
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientForTest(null);
                    setSelectedMasterTestIds([]);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOrderingTest || selectedMasterTestIds.length === 0}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isOrderingTest ? (
                    'Generating Order...'
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      Generate Unpaid Test Order ({selectedMasterTestIds.length})
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WALK-IN REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Walk-in Patient Account Intake</h3>
                  <p className="text-xs text-slate-500">Register new patient, configure insurance, & auto-issue PID passcode</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdPatientCredentials ? (
              <div className="space-y-4 p-5 bg-teal-50/80 border border-teal-200 rounded-2xl my-auto">
                <div className="flex items-center gap-2 text-teal-800 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  Walk-in Patient Registered & Credentials Issued!
                </div>

                <div className="space-y-2 text-xs bg-white p-4 rounded-xl border border-teal-200">
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500">Patient Name:</span>
                    <span className="font-bold text-slate-900">{createdPatientCredentials.name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500">Assigned Patient ID (PID):</span>
                    <span className="font-mono font-extrabold text-teal-700">{createdPatientCredentials.patientId}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500">Access Passcode:</span>
                    <span className="font-mono font-extrabold text-indigo-700">{createdPatientCredentials.accessCode}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-700">{createdPatientCredentials.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Classification:</span>
                    <span className="font-bold text-teal-800">{createdPatientCredentials.insuranceProvider}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => copyCredentials(createdPatientCredentials.accessCode)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedCode ? 'Copied Passcode!' : 'Copy Access Passcode'}
                  </button>

                  <button
                    onClick={() => {
                      const p = createdPatientCredentials.rawPatient || {
                        name: createdPatientCredentials.name,
                        patientId: createdPatientCredentials.patientId,
                        id: createdPatientCredentials.patientId,
                        phone: createdPatientCredentials.phone
                      };
                      setShowRegisterModal(false);
                      setCreatedPatientCredentials(null);
                      setSelectedPatientForTest(p);
                    }}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <FlaskConical className="w-4 h-4" />
                    Order Diagnostic Tests Now
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterPatient} className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Personal Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    1. Patient Identity & Contact
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                        placeholder="e.g. Marie Ebode"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        placeholder="+237 670000000"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="marie.ebode@gmail.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">National ID / Passport</label>
                      <input
                        type="text"
                        value={nationalId}
                        onChange={e => setNationalId(e.target.value)}
                        placeholder="e.g. 109823481"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">City / Residential Address</label>
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Douala, Akwa"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Date of Birth (DOB) *
                        </label>
                        <input
                          type="date"
                          value={dob}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={e => handleDobChange(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                        <span className="text-[10px] text-teal-700 font-bold block mt-0.5">
                          Calculated: {age} yrs
                        </span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender</label>
                        <select
                          value={gender}
                          onChange={e => setGender(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Child">Child</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Referring Doctor & Medical Center */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    2. Referral & Clinical Recommendation
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Referring Doctor / Practitioner</label>
                      <input
                        type="text"
                        value={referringDoctor}
                        onChange={e => setReferringDoctor(e.target.value)}
                        placeholder="e.g. Dr. Samuel M., Consultant Physician"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Hospital / Medical Center</label>
                      <input
                        type="text"
                        value={referralHospital}
                        onChange={e => setReferralHospital(e.target.value)}
                        placeholder="e.g. Central Hospital / PolyClinic"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Referral Indication / Clinical Notes</label>
                    <input
                      type="text"
                      value={referralNotes}
                      onChange={e => setReferralNotes(e.target.value)}
                      placeholder="e.g. Suspected typhoid fever, pre-op blood screen"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Staff Member Free Benefit Exemption */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Registered Staff Member Benefit</div>
                        <div className="text-[11px] text-amber-800 font-medium">100% staff welfare exemption: 0 FCFA diagnostic charge for lab personnel</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isStaffMember} 
                        onChange={e => setIsStaffMember(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {isStaffMember && (
                    <div className="p-3 bg-amber-100/50 border border-amber-300 rounded-xl space-y-2">
                      <label className="block text-[11px] font-bold text-amber-950 mb-1">Select Registered Staff Member *</label>
                      {registeredStaffList.length > 0 ? (
                        <select
                          value={selectedRegisteredStaffMember?.id || ''}
                          onChange={e => {
                            const found = registeredStaffList.find(s => s.id === e.target.value);
                            setSelectedRegisteredStaffMember(found || null);
                            if (found) {
                              setStaffDesignation(`${found.role || 'Staff'} (${found.name})`);
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        >
                          <option value="">-- Choose from Registered Staff Directory --</option>
                          {registeredStaffList.map((st: any) => (
                            <option key={st.id || st.email} value={st.id}>
                              {st.name} • {st.role || 'Laboratory Staff'} ({st.email || st.phone || 'Active'})
                            </option>
                          ))}
                        </select>
                      ) : null}
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Staff Role / Designation Detail</label>
                        <input
                          type="text"
                          value={staffDesignation}
                          onChange={e => setStaffDesignation(e.target.value)}
                          placeholder="e.g. Senior Phlebotomist / Night Shift Tech"
                          required={isStaffMember}
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Blood Group Selection */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-rose-500" />
                    3. Blood Group Classification
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {BLOOD_GROUPS.map(bg => (
                      <button
                        key={bg.value}
                        type="button"
                        onClick={() => setBloodType(bg.value)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          bloodType === bg.value
                            ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{bg.value}</div>
                        <div className="text-[9px] text-slate-500 truncate">{bg.badge}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Insurance Policy Section with Toggle */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Health Insurance Coverage</div>
                        <div className="text-[11px] text-slate-500">Enable if the patient is covered under private or corporate HMO</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={hasInsurance} 
                        onChange={e => setHasInsurance(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  {hasInsurance && (
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Cameroon Insurance Provider *</label>
                          <select
                            value={insuranceProvider}
                            onChange={e => setInsuranceProvider(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                          >
                            {CAMEROON_INSURANCE_COMPANIES.map(company => (
                              <option key={company.id} value={company.name}>{company.name}</option>
                            ))}
                            <option value="Other Corporate Insurance (Cameroon)">Other Corporate Insurance (Cameroon)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Policy / Matricule ID *</label>
                          <input
                            type="text"
                            value={insurancePolicyNumber}
                            onChange={e => setInsurancePolicyNumber(e.target.value)}
                            required={hasInsurance}
                            placeholder="e.g. POL-998234-ACT / MAT-5521"
                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                            <span>Coverage Rate (% Insurance vs Patient Co-Pay)</span>
                            <span className="text-teal-700 font-bold">{insuranceCoveragePercent}% Insurer / {100 - insuranceCoveragePercent}% Co-Pay</span>
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[100, 80, 70, 50].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setInsuranceCoveragePercent(rate)}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                                  insuranceCoveragePercent === rate
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {rate}% Covered
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Insurance Card Upload */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Insurance Card Photo / Document (Optional)</label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleInsuranceCardUpload}
                          accept="image/*,.pdf"
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingCard}
                            className="px-3 py-2 bg-white hover:bg-slate-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {uploadingCard ? 'Uploading Card...' : insuranceCardUrl ? 'Replace Card Photo' : 'Upload Insurance Card'}
                          </button>
                          {insuranceCardUrl && (
                            <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Card attached
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Emergency Contact & Clinical History */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    3. Emergency Contact & Clinical Notes
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={emergencyContactName}
                        onChange={e => setEmergencyContactName(e.target.value)}
                        placeholder="e.g. Paul Ebode"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        value={emergencyContactPhone}
                        onChange={e => setEmergencyContactPhone(e.target.value)}
                        placeholder="+237 680000000"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Known Allergies / Clinical Notes</label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={e => setAllergies(e.target.value)}
                      placeholder="e.g. Penicillin allergy, Fasting required"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Registering...' : 'Register Walk-in Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PATIENT INTAKE SUMMARY MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {selectedPatient.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedPatient.name}</h3>
                  <p className="text-xs text-slate-500">Patient Intake & Demographics Record</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Patient ID (PID)</span>
                  <span className="font-mono font-bold text-teal-700">{selectedPatient.patientId || selectedPatient.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Date of Birth & Age</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPatient.dob ? `${selectedPatient.dob} (${selectedPatient.age || 28} yrs)` : `${selectedPatient.age || 28} yrs`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Security Passcode</span>
                  <span className="font-mono text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Protected (Patient Only)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Blood Type</span>
                  <span className="font-bold text-red-600">{selectedPatient.bloodType || 'O+'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Insurance / HMO</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.insuranceProvider || 'Out-of-Pocket'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Referring Doctor</span>
                  <span className="font-semibold text-teal-800">{selectedPatient.referringDoctor || 'Self-Referred'}</span>
                </div>
                {selectedPatient.isStaffMember && (
                  <div className="col-span-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-bold flex items-center justify-between">
                    <span>Staff Member Exemption: {selectedPatient.staffDesignation || 'Internal Staff'}</span>
                    <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded">100% Free Tests</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEPTIONIST ACCESS CODE ACTIVATION MODAL */}
      {activationModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Receptionist Access Verification</h3>
                  <p className="text-[11px] text-slate-400">Confirm activation of selected tests</p>
                </div>
              </div>

              <button
                onClick={() => { setActivationModalPatient(null); setReceptionistCode(''); setActivationError(''); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-teal-300">Patient: {activationModalPatient.name}</div>
              <div className="text-slate-400">Activating <span className="text-white font-bold">{activationBookingIds.length}</span> test request(s).</div>
              <div className="text-[11px] text-teal-400/90 italic pt-1">
                ✓ Once activated, these tests move to Cashier for payment & appear in Patient Portal.
              </div>
            </div>

            <form onSubmit={handleConfirmActivationWithCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Receptionist Authorization PIN / Code:
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter authorized access PIN or code..."
                  value={receptionistCode}
                  onChange={(e) => setReceptionistCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                {activationError && (
                  <p className="text-xs font-bold text-red-400 mt-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    {activationError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setActivationModalPatient(null); setReceptionistCode(''); setActivationError(''); }}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActivating}
                  className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isActivating ? 'Activating...' : 'Confirm Activation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistView;
