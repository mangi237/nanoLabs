import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, addDoc, collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { sendEmail } from '../../services/emailService';
import { limsService } from '../../services/limsService';
import { authService } from '../../services/authService';
import { cleanFirestoreData } from '../../utils/sanitizeData';
import { 
  OFFICIAL_MASTER_TEST_CATALOG, 
  OFFICIAL_CATEGORIES, 
  OfficialCategory 
} from '../../data/officialTestCatalog';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  FileText, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Search, 
  TestTube, 
  DollarSign, 
  UserCheck, 
  Sparkles,
  Stethoscope,
  AlertCircle,
  FlaskConical,
  Info
} from 'lucide-react';

interface BookAppointmentScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const BookAppointmentScreen: React.FC<BookAppointmentScreenProps> = ({
  onBack,
  onSuccess,
  onNotificationPress,
  onProfilePress
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Data lists
  const [catalog, setCatalog] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [patientList, setPatientList] = useState<any[]>([]);

  // Category filter for tests
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Search queries for card selectors
  const [testSearch, setTestSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  // Selections
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  // Form Fields
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState('09:30 AM');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadLabData();
  }, [targetLabId]);

  const toggleTestSelection = (testItem: any) => {
    const exists = selectedTests.some(t => t.id === testItem.id);
    if (exists) {
      if (selectedTests.length === 1) {
        // keep at least 1 or allow unselecting
        setSelectedTests([]);
      } else {
        setSelectedTests(selectedTests.filter(t => t.id !== testItem.id));
      }
    } else {
      setSelectedTests([...selectedTests, testItem]);
    }
  };

  const loadLabData = async () => {
    try {
      setFetchingData(true);

      // 1. Fetch Tests for this lab, or fallback to full official clinical catalog
      const testsSnap = await getDocs(collection(db, 'labs', targetLabId, 'testCatalog'));
      let tests: any[] = testsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (tests.length === 0) {
        tests = OFFICIAL_MASTER_TEST_CATALOG;
      }
      setCatalog(tests);
      if (tests.length > 0) {
        setSelectedTests([tests[0]]);
      }

      // 2. Fetch Lab Techs & Doctors from real lab staff
      const staffSnap = await getDocs(collection(db, 'labs', targetLabId, 'staff'));
      let staff: any[] = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (staff.length === 0) {
        try {
          const serverStaff = await authService.getServerStaffList();
          if (serverStaff && serverStaff.length > 0) {
            staff = serverStaff;
          }
        } catch (e) {
          console.warn('Server staff fetch note:', e);
        }
      }
      setStaffList(staff);
      if (staff.length > 0) {
        setSelectedStaff(staff[0]);
      }

      // 3. Fetch Patients
      const patientSnap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const patients: any[] = patientSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPatientList(patients);

      if (user?.role === 'patient') {
        const found = patients.find(p => p.id === user.id || p.email === user.email || p.accessCode === (user as any).accessCode);
        if (found) {
          setSelectedPatient(found);
        } else {
          setSelectedPatient({
            id: user.id || 'pat-user',
            name: user.name || 'Valued Patient',
            patientId: (user as any).patientId || user.id || 'PT-101',
            phone: user.phone || '+237 670000000',
            email: user.email || 'patient@nanolabs.cm'
          });
        }
      } else if (patients.length > 0) {
        setSelectedPatient(patients[0]);
      }
    } catch (err) {
      console.error('Error fetching lab booking data:', err);
      setCatalog(OFFICIAL_MASTER_TEST_CATALOG);
      if (OFFICIAL_MASTER_TEST_CATALOG.length > 0) {
        setSelectedTests([OFFICIAL_MASTER_TEST_CATALOG[0]]);
      }
    } finally {
      setFetchingData(false);
    }
  };

  const isPayPerTest = lab?.pricingModel === 'pay_per_test';
  const SYSTEM_FEE = isPayPerTest ? (lab?.feePerTest || 500) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedTests.length === 0) {
      setErrorMessage('Please select at least one laboratory diagnostic test.');
      return;
    }
    if (!selectedPatient) {
      setErrorMessage('Please select or specify a patient.');
      return;
    }

    setLoading(true);
    try {
      const selectedMasterTestIds = selectedTests.map(t => t.id);

      // 1. Create central LIMS booking (so Cashier, Receptionist & Medical Booklet get real-time updates)
      const booking = await limsService.createBooking({
        labId: targetLabId,
        patientId: selectedPatient.id || selectedPatient.patientId || user?.id || 'pat-1',
        patientName: selectedPatient.name || user?.name || 'Valued Patient',
        patientAge: selectedPatient.age || 30,
        patientGender: selectedPatient.gender || 'Male',
        patientPhone: selectedPatient.phone || user?.phone || '',
        patientEmail: selectedPatient.email || user?.email || '',
        patientPid: selectedPatient.patientId || selectedPatient.id || user?.id || 'PT-101',
        doctorName: selectedStaff?.name || 'Dr. Attending Specialist',
        selectedMasterTestIds,
        selectedTests: selectedTests.map((t, idx) => ({
          id: t.id || `test-${idx}-${Date.now()}`,
          testId: t.id || `t-${idx}`,
          name: t.name || t.testName || 'Diagnostic Test',
          testName: t.name || t.testName || 'Diagnostic Test',
          code: t.code || 'TST',
          category: t.category || 'General',
          price: t.price || 5000,
          sampleType: t.sampleType || t.sampleTypeRequired || 'Venous Blood',
          sampleTypeRequired: t.sampleType || t.sampleTypeRequired || 'Venous Blood',
          units: t.units || 'U/L',
          refRangeMale: t.refRangeMale || 'Normal',
          refRangeFemale: t.refRangeFemale || 'Normal',
          refRangeChild: t.refRangeChild || 'Normal'
        })),
        creatorName: user?.name || 'Patient Online Order'
      });

      // 2. Create a single consolidated appointment for the patient's schedule
      const totalCombinedPrice = selectedTests.reduce((sum, t) => sum + (t.price || 5000), 0) + (SYSTEM_FEE * selectedTests.length);
      const testNamesSummary = selectedTests.map(t => t.name || t.testName).join(', ');

      const apptPayload = cleanFirestoreData({
        title: selectedTests.length === 1 ? (selectedTests[0].name || selectedTests[0].testName) : `${selectedTests.length} Diagnostic Tests (${selectedTests[0].name || 'Test'} + ${selectedTests.length - 1} more)`,
        testSummary: testNamesSummary,
        date: appointmentDate,
        time: appointmentTime,
        testsCount: selectedTests.length,
        tests: selectedTests.map((t, idx) => ({
          id: t.id || `bt-${Date.now()}-${idx}`,
          testId: t.id || `t-${idx}`,
          testName: t.name || t.testName || 'Diagnostic Test',
          category: t.category || 'General',
          price: t.price || 5000,
          sampleTypeRequired: t.sampleType || t.sampleTypeRequired || 'Venous Blood',
          units: t.units || 'U/L',
          status: 'Pending_Validation',
          receptionistValidated: false
        })),
        bookingCode: booking.bookingCode,
        bookingId: booking.id,
        price: totalCombinedPrice,
        totalAmount: totalCombinedPrice,
        doctorName: selectedStaff?.name || 'Lab Technologist',
        patientName: selectedPatient.name || user?.name || 'Valued Patient',
        patientId: selectedPatient.patientId || selectedPatient.id || user?.id || 'pat-1',
        patientEmail: selectedPatient.email || user?.email || '',
        patientPhone: selectedPatient.phone || user?.phone || '',
        status: 'scheduled',
        paymentStatus: 'unpaid',
        receptionistValidated: false,
        location: lab?.name || 'nanoLabs Central Diagnostics',
        notes: notes || '',
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'labs', targetLabId, 'appointments'), apptPayload);

      // 3. Send confirmation email
      const targetEmail = selectedPatient.email || user?.email;
      if (targetEmail) {
        const testListStr = selectedTests.map(t => `- ${t.name || t.testName} (${(t.price || 5000).toLocaleString()} FCFA)`).join('\n');
        sendEmail(
          targetEmail,
          `Appointment & Multi-Test Request (${selectedTests.length} Tests) - ${lab?.name || 'nanoLabs'}`,
          `Dear ${selectedPatient.name || 'Patient'},\n\nYour appointment and ${selectedTests.length} test request(s) have been successfully booked!\n\nRequested Tests:\n${testListStr}\n\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nAttending Specialist: ${selectedStaff?.name || 'Lab Technologist'}\nLocation: ${lab?.name || 'nanoLabs Diagnostics'}\n\nOur Cashier & Receptionist will verify your payment upon arrival at the laboratory.`
        ).catch(e => console.warn('Appointment email error:', e));
      }

      if (onSuccess) onSuccess();
      else if (onBack) onBack();
    } catch (error: any) {
      console.error('Failed to book test:', error);
      setErrorMessage(error?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = catalog.filter(t => {
    const matchesSearch = 
      (t.name || t.testName || '')?.toLowerCase().includes(testSearch.toLowerCase()) ||
      (t.category || '')?.toLowerCase().includes(testSearch.toLowerCase()) ||
      (t.method || '')?.toLowerCase().includes(testSearch.toLowerCase()) ||
      (t.conditions || '')?.toLowerCase().includes(testSearch.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredStaff = staffList.filter(s =>
    (s.name || '')?.toLowerCase().includes(staffSearch.toLowerCase()) ||
    (s.role || '')?.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const filteredPatients = patientList.filter(p =>
    (p.name || '')?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.patientId || p.id || '')?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const getInitials = (name?: string) => {
    if (!name) return 'NL';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Microbiology':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Hematology':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Serology / Immunology':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Biochemistry':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Hormones & Tumor Markers':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Book New Test & Appointment"
        subtitle="Schedule diagnostic procedures with attending lab specialists"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-xl font-bold text-slate-900">Laboratory Appointment & Test Booking</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select diagnostic procedures and view preparation guidelines for <strong>{lab?.name || 'nanoLabs Central Diagnostics'}</strong>
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: Patient Selection Card */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Patient Information
              </label>

              {user?.role === 'patient' ? (
                /* Preselected Patient Card */
                <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {getInitials(user?.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{user?.name || 'Valued Patient'}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                          {(user as any).patientId || user?.id || 'PT-101'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{user?.email || 'patient@nanolabs.cm'} • {user?.phone || '+237 670000000'}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                </div>
              ) : (
                /* Searchable Card Selector for Staff */
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Search patient by name or ID..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {filteredPatients.map(pat => {
                      const isSelected = selectedPatient?.id === pat.id;
                      return (
                        <div
                          key={pat.id}
                          onClick={() => setSelectedPatient(pat)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-teal-50 border-teal-500 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-teal-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {getInitials(pat.name)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-xs truncate">{pat.name}</h4>
                              <p className="text-[10px] text-slate-500 truncate">{pat.patientId || pat.id} • {pat.phone || 'No phone'}</p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: Searchable Laboratory Tests with Category Filter Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Select Laboratory Diagnostic Test <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-teal-700 font-semibold">
                  Carried out by {lab?.name || 'nanoLabs'}
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({catalog.length})
                </button>
                {OFFICIAL_CATEGORIES.map(cat => {
                  const count = catalog.filter(c => c.category === cat).length;
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar for Tests */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search 80+ lab tests by name, method, or preparation condition..."
                  value={testSearch}
                  onChange={e => setTestSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                {filteredTests.map(testItem => {
                  const isSelected = selectedTests.some(t => t.id === testItem.id);
                  const basePrice = testItem.price || 5000;
                  const totalPrice = basePrice + SYSTEM_FEE;
                  const turnaround = testItem.turnaroundTime || testItem.expectedTime || '2 hours after sampling';

                  return (
                    <div
                      key={testItem.id}
                      onClick={() => toggleTestSelection(testItem)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                        isSelected
                          ? 'bg-teal-50/90 border-teal-600 ring-2 ring-teal-500/30 shadow-sm'
                          : 'bg-white border-slate-200/80 hover:border-teal-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getCategoryBadgeColor(testItem.category)}`}>
                            {testItem.category || 'Hematology'}
                          </span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                          {testItem.name || testItem.testName}
                        </h4>
                        {testItem.conditions && (
                          <p className="text-[10px] text-amber-900 line-clamp-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            Prep: {testItem.conditions}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-emerald-800 text-xs">
                            {SYSTEM_FEE > 0 ? `${basePrice.toLocaleString()} + ${SYSTEM_FEE.toLocaleString()} FCFA` : `${basePrice.toLocaleString()} FCFA`}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-teal-600" />
                            {turnaround}
                          </span>
                        </div>
                        {SYSTEM_FEE > 0 ? (
                          <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                            <span>System Fee Incl.</span>
                            <span className="font-bold text-slate-700">Total: {totalPrice.toLocaleString()} FCFA</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-teal-600 font-semibold flex items-center justify-between">
                            <span>Facility Standard Rate</span>
                            <span className="font-bold text-slate-700">Total: {basePrice.toLocaleString()} FCFA</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Selected Multi-Test Summary Banner */}
              {selectedTests.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl text-white shadow-md space-y-3 animate-fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20">
                        <FlaskConical className="w-5 h-5 text-teal-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-teal-300 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded">
                            {selectedTests.length} {selectedTests.length === 1 ? 'Test Selected' : 'Tests Selected'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white mt-0.5">
                          {selectedTests.map(t => t.name || t.testName).join(', ')}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                      <div className="text-right bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                        <span className="text-[10px] text-teal-200 block font-medium">Total Payable ({selectedTests.length} tests)</span>
                        <span className="text-sm font-extrabold text-white">
                          {(selectedTests.reduce((acc, t) => acc + (t.price || 5000) + SYSTEM_FEE, 0)).toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: Workflow Info Notice */}
            <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200/80 flex items-center gap-3">
              <Stethoscope className="w-5 h-5 text-teal-700 shrink-0" />
              <p className="text-xs text-teal-900 font-medium leading-relaxed">
                <strong>Technologist Assignment:</strong> You do not need to select a lab technician. Upon arrival, your sample collector will verify your sample and refer your order directly to the attending laboratory technologist.
              </p>
            </div>

            {/* SECTION 4: Schedule Timing & Notes */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                4. Appointment Timing & Clinical Notes
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time Slot</label>
                  <select
                    value={appointmentTime}
                    onChange={e => setAppointmentTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="08:00 AM">08:00 AM (Early Fasting Intake)</option>
                    <option value="08:30 AM">08:30 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM (Afternoon Intake)</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Indications / Special Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting started at 10 PM, doctor referral notes, symptoms reported..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || fetchingData}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Laboratory Booking...
                  </>
                ) : (
                  <>
                    Confirm Laboratory Appointment & Test Request
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BookAppointmentScreen;
