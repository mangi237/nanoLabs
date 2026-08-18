import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import authService from '../../services/authService';
import { limsService, PatientBooking } from '../../services/limsService';
import { MASTER_TESTS_CATALOG } from '../../data/masterTestsData';
import { validatePhoneNumber, cleanFirestoreData } from '../../utils/sanitizeData';
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
  FlaskConical
} from 'lucide-react';

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
  const [attendingDoctor, setAttendingDoctor] = useState('');
  const [isOrderingTest, setIsOrderingTest] = useState(false);

  // Registration Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [city, setCity] = useState('Douala');
  const [bloodType, setBloodType] = useState('O+');
  const [insuranceProvider, setInsuranceProvider] = useState('Out-of-Pocket / Self');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Selected Patient Details Modal
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  // Checkbox-based test selection state for patient activation - FIXED: store by test ID not patient ID
  const [selectedTestsMap, setSelectedTestsMap] = useState<Record<string, string[]>>({});
  
  // Access Code Modal for Receptionist Activation
  const [activationModalPatient, setActivationModalPatient] = useState<any | null>(null);
  const [activationBookingIds, setActivationBookingIds] = useState<string[]>([]);
  const [receptionistCode, setReceptionistCode] = useState('');
  const [activationError, setActivationError] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  // Doctor list for dropdown
  const [doctorList, setDoctorList] = useState<Array<{id: string, name: string}>>([
    { id: 'dr-1', name: 'Dr. Hiren Shah' },
    { id: 'dr-2', name: 'Dr. Marie-Claire Ngo' },
    { id: 'dr-3', name: 'Dr. Jean-Paul Essomba' },
    { id: 'dr-4', name: 'Dr. Laure Kamga' },
    { id: 'dr-5', name: 'Dr. Emmanuel Tchoumi' },
  ]);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  // FIXED: Get patient tests with proper filtering
  const getPatientTests = (patient: any) => {
    const patientId = patient.id || patient.patientId;
    const matchedBookings = bookings.filter(b => 
      b.patientId === patientId ||
      b.patientPid === patient.patientId ||
      b.patientPid === patientId ||
      (b.patientEmail && patient.email && b.patientEmail.toLowerCase() === patient.email.toLowerCase()) ||
      (b.patientPhone && patient.phone && b.patientPhone === patient.phone)
    );

    const allTestsFromBookings = matchedBookings.flatMap(b => (b.tests || []).map((t, idx) => ({
      id: t.id || t.testId || `bt-${b.id}-${idx}`,
      testId: t.testId || t.id || `t-${idx}`,
      testName: t.testName || (t as any).name || 'Diagnostic Test',
      category: t.category || 'General Diagnostic',
      price: t.price || 5500,
      status: t.status || (b.paymentStatus === 'paid' ? 'Paid' : 'Pending_Payment'),
      bookingCode: b.bookingCode,
      bookingId: b.id,
      receptionistValidated: b.receptionistValidated === true || (t as any).receptionistValidated === true || b.paymentStatus === 'paid',
      createdAt: b.createdAt,
      sampleTypeRequired: t.sampleTypeRequired || 'Venous Blood'
    })));

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
      createdAt: t.requestedDate || t.requestedAt || patient.createdAt || new Date().toISOString(),
      sampleTypeRequired: t.sampleType || 'Venous Blood'
    }));

    const combined = [...allTestsFromBookings];
    directLabTests.forEach((dt: any) => {
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

  // FIXED: Toggle test selection by test ID
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
      .filter(t => !t.receptionistValidated && t.status !== 'Completed')
      .map(t => t.id || t.testName || t.bookingId);
    
    setSelectedTestsMap(prev => ({
      ...prev,
      [pId]: unvalidatedKeys
    }));
  };

  // FIXED: Handle opening activation modal with proper test filtering
  const handleOpenActivationModal = (patient: any, testIdentifiers: string[]) => {
    if (testIdentifiers.length === 0) return;
    const pTests = getPatientTests(patient);
    
    // Gather all related IDs - ONLY the ones selected
    const allRelevantIds: string[] = [];
    
    // Add the selected test identifiers directly
    testIdentifiers.forEach(id => {
      if (!allRelevantIds.includes(id)) allRelevantIds.push(id);
    });
    
    // Find and add the actual test IDs and booking IDs for the selected tests
    pTests.forEach(t => {
      if (testIdentifiers.includes(t.id) || testIdentifiers.includes(t.testName) || testIdentifiers.includes(t.bookingId)) {
        if (t.id && !allRelevantIds.includes(t.id)) allRelevantIds.push(t.id);
        if (t.bookingId && !allRelevantIds.includes(t.bookingId)) allRelevantIds.push(t.bookingId);
        if (t.testId && !allRelevantIds.includes(t.testId)) allRelevantIds.push(t.testId);
        if (t.testName && !allRelevantIds.includes(t.testName)) allRelevantIds.push(t.testName);
      }
    });

    setActivationModalPatient(patient);
    setActivationBookingIds(allRelevantIds);
    setReceptionistCode('');
    setActivationError('');
  };

  // FIXED: Handle confirmation with proper test filtering
  const handleConfirmActivationWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');

    const cleanCode = receptionistCode.trim();
    if (!cleanCode) {
      setActivationError('Please enter your authorized Receptionist Access PIN / Passcode.');
      return;
    }

    const authResult = await authService.verifyStaffActionCode(
      cleanCode,
      ['receptionist', 'admin', 'superadmin', 'lab_director'],
      user?.accessCode || (user as any)?.initialCode,
      targetLabId
    );

    if (!authResult.authorized) {
      setActivationError(authResult.error || 'Access Denied: Invalid Receptionist PIN / Passcode.');
      return;
    }

    setIsActivating(true);
    try {
      const pId = activationModalPatient?.id || activationModalPatient?.patientId;
      
      // FIXED: Pass ONLY the selected test IDs to the validation function
      await limsService.validateBatchBookingsCheckIn({
        labId: targetLabId,
        bookingIds: activationBookingIds, // Now only contains selected tests
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
    fetchData();
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const allPatients: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPatients(allPatients);

      const allBookings = await limsService.fetchAllBookings(targetLabId);
      setBookings(allBookings);
    } catch (e) {
      console.error('Error fetching receptionist data:', e);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Register patient using the same modal as online booking
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert('Please provide patient name and phone number.');
      return;
    }

    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      alert(phoneValidation.errorMessage || 'Please provide a valid 9-digit phone number.');
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
      const generatedAccessCode = 'PAT' + Math.floor(100 + Math.random() * 900);

      const rawPayload = {
        name: fullName.trim(),
        phone: phoneValidation.formatted || phone.trim(),
        email: email.trim().toLowerCase() || `${generatedPid.toLowerCase()}@nanolabs.cm`,
        age: parseInt(age) || 30,
        gender,
        city: city || 'Douala',
        bloodType: bloodType || 'O+',
        insuranceProvider: insuranceProvider || 'Out-of-Pocket / Self',
        insurancePolicyNumber: insurancePolicyNumber.trim() || 'N/A',
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
          insuranceProvider
        });

        setFullName('');
        setPhone('');
        setEmail('');
        setAge('');
        setBloodType('O+');
        setInsuranceProvider('Out-of-Pocket / Self');
        setInsurancePolicyNumber('');
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

  // FIXED: Create test order with dynamic price calculation
  const handleCreateTestOrderForPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForTest || selectedMasterTestIds.length === 0) {
      alert('Please select at least one laboratory test from the catalog.');
      return;
    }

    if (!attendingDoctor.trim()) {
      alert('Please select a referring physician.');
      return;
    }

    setIsOrderingTest(true);
    try {
      await limsService.createBooking({
        labId: targetLabId,
        patientId: selectedPatientForTest.id || selectedPatientForTest.patientId,
        patientName: selectedPatientForTest.name,
        patientAge: selectedPatientForTest.age || 30,
        patientGender: selectedPatientForTest.gender || 'Male',
        patientPhone: selectedPatientForTest.phone || '',
        patientEmail: selectedPatientForTest.email || '',
        patientPid: selectedPatientForTest.patientId || selectedPatientForTest.id,
        doctorName: attendingDoctor,
        selectedMasterTestIds,
        creatorName: user?.name || 'Front Desk Receptionist'
      });

      alert(`Test order generated successfully for ${selectedPatientForTest.name}!`);
      setSelectedPatientForTest(null);
      setSelectedMasterTestIds([]);
      setAttendingDoctor('');
      await fetchData();
    } catch (err) {
      console.error('Error creating test order:', err);
      alert('Failed to generate test order.');
    } finally {
      setIsOrderingTest(false);
    }
  };

  // FIXED: Dynamically calculate total price
  const calculateTotalPrice = () => {
    return selectedMasterTestIds.reduce((acc, id) => {
      const item = MASTER_TESTS_CATALOG.find(m => m.id === id);
      return acc + (item?.basePrice || 0);
    }, 0);
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

      {/* Metrics Row */}
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

      {/* Pending Patient Test Requests Queue */}
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
            {pendingBookings.slice(0, 4).map(b => (
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
                    Unpaid
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
                  const unvalidatedCount = pTests.filter(t => !t.receptionistValidated && t.status !== 'Completed').length;
                  const pId = patient.id || patient.patientId;

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
                                  setAttendingDoctor('');
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
                                      Select tests for Check-in & Cashier Activation:
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

                                  {/* BOTTOM ACTION PANEL FOR ACTIVATION */}
                                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl">
                                    <div className="text-xs text-slate-600">
                                      <span className="font-bold text-slate-900">Selected Tests: </span>
                                      <span className="font-mono font-black text-teal-700">
                                        {(selectedTestsMap[pId] || []).length}
                                      </span> test(s) checked
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                      {isWalkIn && (
                                        <button
                                          onClick={() => {
                                            setSelectedPatientForTest(patient);
                                            setSelectedMasterTestIds([]);
                                            setAttendingDoctor('');
                                          }}
                                          className="px-3 py-2 bg-white hover:bg-slate-100 text-teal-800 font-bold rounded-xl text-xs border border-teal-200 flex items-center gap-1 cursor-pointer transition-all"
                                        >
                                          <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
                                          + Add Test
                                        </button>
                                      )}

                                      <button
                                        onClick={() => {
                                          const selIds = selectedTestsMap[pId] || [];
                                          if (selIds.length === 0) {
                                            alert('Please select at least one test checkbox to activate.');
                                            return;
                                          }
                                          handleOpenActivationModal(patient, selIds);
                                        }}
                                        disabled={(selectedTestsMap[pId] || []).length === 0}
                                        className="w-full sm:w-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Activate Selected Tests ({(selectedTestsMap[pId] || []).length})</span>
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

      {/* ORDER TEST FOR EXISTING PATIENT MODAL - FIXED with doctor dropdown and live price calculation */}
      {selectedPatientForTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Generate Test Order for Registered Patient
                </h3>
                <p className="text-xs text-teal-700 font-semibold">
                  Patient: {selectedPatientForTest.name} ({selectedPatientForTest.patientId || selectedPatientForTest.id})
                </p>
              </div>
              <button
                onClick={() => setSelectedPatientForTest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTestOrderForPatient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Referring Physician / Doctor Name *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 flex items-center justify-between cursor-pointer"
                  >
                    <span className={attendingDoctor ? 'text-slate-900' : 'text-slate-400'}>
                      {attendingDoctor || 'Select a referring physician...'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDoctorDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showDoctorDropdown && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {doctorList.map(doc => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            setAttendingDoctor(doc.name);
                            setShowDoctorDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2"
                        >
                          <span className="font-medium">{doc.name}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const customName = prompt('Enter doctor name:');
                          if (customName && customName.trim()) {
                            setAttendingDoctor(customName.trim());
                            setDoctorList([...doctorList, { id: `dr-${Date.now()}`, name: customName.trim() }]);
                          }
                          setShowDoctorDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-teal-600 hover:bg-teal-50 border-t border-slate-100 font-semibold"
                      >
                        + Add Custom Doctor
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Diagnostic Tests from Master Catalog</label>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50">
                  {MASTER_TESTS_CATALOG.map(item => {
                    const isChecked = selectedMasterTestIds.includes(item.id);

                    return (
                      <label 
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold' 
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
                            className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
                          />
                          <div>
                            <div className="text-xs">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{item.category} • {item.sampleType}</div>
                          </div>
                        </div>

                        <span className="font-mono text-xs text-teal-700 font-bold">{item.basePrice.toLocaleString()} XAF</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* FIXED: Live price calculation */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Total Order Amount:</span>
                <span className="font-mono font-black text-sm text-teal-800">
                  {calculateTotalPrice().toLocaleString()} XAF
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPatientForTest(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOrderingTest || selectedMasterTestIds.length === 0 || !attendingDoctor.trim()}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isOrderingTest ? 'Generating Order...' : 'Generate Unpaid Test Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WALK-IN REGISTRATION MODAL - FIXED with insurance toggle and online booking parity */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Walk-in Patient Account Intake</h3>
                  <p className="text-xs text-slate-500">Register new patient & auto-issue PID passcode credentials</p>
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
              <div className="space-y-4 p-5 bg-teal-50/80 border border-teal-200 rounded-2xl">
                <div className="flex items-center gap-2 text-teal-800 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  Patient Account Created & Credentials Issued!
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
                    <span className="text-slate-500">Insurance Provider:</span>
                    <span className="font-bold text-slate-900">{createdPatientCredentials.insuranceProvider || 'Out-of-Pocket'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Group:</span>
                    <span className="font-bold text-red-600">{createdPatientCredentials.bloodType || 'O+'}</span>
                  </div>
                </div>

                <button
                  onClick={() => copyCredentials(createdPatientCredentials.accessCode)}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  {copiedCode ? 'Copied Access Passcode!' : 'Copy Access Passcode'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterPatient} className="space-y-4">
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
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">City / Address</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Douala, Akwa"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
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
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={bloodType}
                      onChange={e => setBloodType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Insurance Provider</label>
                    <select
                      value={insuranceProvider}
                      onChange={e => setInsuranceProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Out-of-Pocket / Self">Out-of-Pocket / Self</option>
                      <option value="Ascoma">Ascoma</option>
                      <option value="NSIA">NSIA</option>
                      <option value="AXA">AXA</option>
                      <option value="Allianz">Allianz</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Insurance Policy Number</label>
                    <input
                      type="text"
                      value={insurancePolicyNumber}
                      onChange={e => setInsurancePolicyNumber(e.target.value)}
                      placeholder="e.g. INS-123456"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
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

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
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
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Patient ID (PID)</span>
                  <span className="font-mono font-bold text-teal-700">{selectedPatient.patientId || selectedPatient.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Security Passcode</span>
                  <span className="font-mono text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Protected
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Blood Type</span>
                  <span className="font-bold text-red-600">{selectedPatient.bloodType || 'O+'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Insurance Provider</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.insuranceProvider || 'Out-of-Pocket'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 font-semibold block">Insurance Policy Number</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.insurancePolicyNumber || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 font-semibold block">Emergency Contact</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.emergencyContactName || 'N/A'} {selectedPatient.emergencyContactPhone ? `(${selectedPatient.emergencyContactPhone})` : ''}</span>
                </div>
                {selectedPatient.allergies && selectedPatient.allergies !== 'None reported' && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-semibold block">Allergies / Clinical Notes</span>
                    <span className="font-semibold text-amber-700">{selectedPatient.allergies}</span>
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
                ✓ Only the selected tests will be activated, not all tests.
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