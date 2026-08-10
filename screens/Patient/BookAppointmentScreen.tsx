import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, addDoc, collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { sendEmail } from '../../services/emailService';
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
  Stethoscope
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

  // Search queries for card selectors
  const [testSearch, setTestSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  // Selections
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
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

  const loadLabData = async () => {
    try {
      setFetchingData(true);

      // 1. Fetch Tests for this lab
      const testsSnap = await getDocs(collection(db, 'labs', targetLabId, 'testCatalog'));
      let tests: any[] = testsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (tests.length === 0) {
        // Fallback default tests for this lab
        tests = [
          { id: 't-1', name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 4500, turnaroundTime: '2-4 Hours', description: 'Comprehensive cellular evaluation.' },
          { id: 't-2', name: 'Fasting Blood Glucose (FBG)', category: 'Biochemistry', price: 3000, turnaroundTime: '1 Hour', description: 'Metabolic & diabetes assessment.' },
          { id: 't-3', name: 'Lipid Profile Panel', category: 'Biochemistry', price: 7000, turnaroundTime: '6 Hours', description: 'Total cholesterol, HDL, LDL, triglycerides.' },
          { id: 't-4', name: 'Thyroid Panel (TSH, FT3, FT4)', category: 'Endocrinology', price: 12500, turnaroundTime: '24 Hours', description: 'Endocrine & metabolic function check.' },
          { id: 't-5', name: 'Comprehensive Renal Function', category: 'Nephrology', price: 8500, turnaroundTime: '4 Hours', description: 'Creatinine, BUN, electrolytes & eGFR.' },
          { id: 't-6', name: 'Urinalysis & Microscopic Exam', category: 'Urinalysis', price: 3500, turnaroundTime: '1-2 Hours', description: 'Complete chemical and sediment urine analysis.' }
        ];
      }
      setCatalog(tests);
      if (tests.length > 0) {
        setSelectedTest(tests[0]);
      }

      // 2. Fetch Lab Techs & Doctors
      const staffSnap = await getDocs(collection(db, 'labs', targetLabId, 'staff'));
      let staff: any[] = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (staff.length === 0) {
        staff = [
          { id: 'st-1', name: 'Dr. Alexis Vance', role: 'Lab Specialist & Medical Director', phone: '+237 671002233', email: 'alexis.vance@nanolabs.cm' },
          { id: 'st-2', name: 'Sarah Chen, MLS', role: 'Senior Clinical Lab Technologist', phone: '+237 672113344', email: 'sarah.chen@nanolabs.cm' },
          { id: 'st-3', name: 'Dr. Marcus Thorne', role: 'Consultant Hematopathologist', phone: '+237 673224455', email: 'marcus.t@nanolabs.cm' },
          { id: 'st-4', name: 'Elena Rostova, BSc', role: 'Biochemist & Accessioning Specialist', phone: '+237 674335566', email: 'elena.r@nanolabs.cm' }
        ];
      }
      setStaffList(staff);
      if (staff.length > 0) {
        setSelectedStaff(staff[0]);
      }

      // 3. Fetch Patients (if staff is booking, or auto-assign current patient)
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
    } finally {
      setFetchingData(false);
    }
  };

  const SYSTEM_FEE = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedTest) {
      setErrorMessage('Please select a laboratory diagnostic test.');
      return;
    }
    if (!selectedPatient) {
      setErrorMessage('Please select or specify a patient.');
      return;
    }

    setLoading(true);
    try {
      const baseTestPrice = selectedTest.price || 5000;
      const totalTestPrice = baseTestPrice + SYSTEM_FEE;
      const testTurnaround = selectedTest.turnaroundTime || selectedTest.expectedTime || '24 Hours';
      const testItemName = selectedTest.name || selectedTest.testName || 'Diagnostic Test';

      const newTestRecord = {
        id: 'tst-' + Math.floor(1000 + Math.random() * 9000),
        testName: testItemName,
        category: selectedTest.category || 'General Diagnostic',
        basePrice: baseTestPrice,
        systemFee: SYSTEM_FEE,
        price: totalTestPrice,
        totalPrice: totalTestPrice,
        priceDisplay: `${baseTestPrice.toLocaleString()} + ${SYSTEM_FEE.toLocaleString()} FCFA System Fee`,
        turnaroundTime: testTurnaround,
        doctorName: selectedStaff?.name || 'Assigned Lab Technologist',
        doctorRole: selectedStaff?.role || 'Lab Tech',
        status: 'requested',
        paymentStatus: 'pending',
        confirmedByReceptionist: false,
        sampleCollected: false,
        requestedDate: appointmentDate,
        appointmentTime: appointmentTime,
        notes: notes || '',
        createdAt: new Date().toISOString()
      };

      // 1. Create appointment document
      await addDoc(collection(db, 'labs', targetLabId, 'appointments'), {
        title: testItemName,
        date: appointmentDate,
        time: appointmentTime,
        testId: selectedTest.id,
        testName: testItemName,
        category: selectedTest.category || 'General',
        basePrice: baseTestPrice,
        systemFee: SYSTEM_FEE,
        price: totalTestPrice,
        totalPrice: totalTestPrice,
        priceDisplay: `${baseTestPrice.toLocaleString()} + ${SYSTEM_FEE.toLocaleString()} FCFA System Fee`,
        turnaroundTime: testTurnaround,
        doctorName: selectedStaff?.name || 'Lab Technologist',
        patientName: selectedPatient.name || user?.name || 'Valued Patient',
        patientId: selectedPatient.patientId || selectedPatient.id || user?.id || 'pat-1',
        patientEmail: selectedPatient.email || user?.email || '',
        patientPhone: selectedPatient.phone || user?.phone || '',
        status: 'scheduled',
        confirmedByReceptionist: false,
        location: lab?.name || 'nanoLabs Central Diagnostics',
        notes: notes || '',
        createdAt: new Date().toISOString()
      });

      // 2. Add test to patient's record in Firestore
      if (selectedPatient.id) {
        try {
          const patientRef = doc(db, 'labs', targetLabId, 'patients', selectedPatient.id);
          const existingTests = selectedPatient.labTests || [];
          await updateDoc(patientRef, {
            labTests: [...existingTests, newTestRecord],
            status: 'active',
            updatedAt: new Date().toISOString()
          });
        } catch (patientUpdateErr) {
          console.warn('Could not update patient document directly, proceeding:', patientUpdateErr);
        }
      }

      // 3. Send confirmation email with explicit fee breakdown
      const targetEmail = selectedPatient.email || user?.email;
      if (targetEmail) {
        sendEmail(
          targetEmail,
          `Appointment & Test Request: ${testItemName} - nanoLabs`,
          `Dear ${selectedPatient.name || 'Patient'},\n\nYour appointment and laboratory test request has been successfully booked!\n\nTest: ${testItemName}\nCategory: ${selectedTest.category || 'General'}\nDiagnostic Procedure Fee: ${baseTestPrice.toLocaleString()} FCFA\nSystem & Processing Fee: ${SYSTEM_FEE.toLocaleString()} FCFA\nTotal Payable Fee: ${totalTestPrice.toLocaleString()} FCFA (${baseTestPrice.toLocaleString()} + ${SYSTEM_FEE.toLocaleString()} FCFA System Fee)\nExpected Results Turnaround: ${testTurnaround}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nAttending Specialist: ${selectedStaff?.name || 'Lab Technologist'}\nLocation: ${lab?.name || 'nanoLabs Diagnostics'}\n\nOur cashier will verify your payment method upon arrival.`
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

  const filteredTests = catalog.filter(t => 
    (t.name || t.testName || '')?.toLowerCase().includes(testSearch.toLowerCase()) ||
    (t.category || '')?.toLowerCase().includes(testSearch.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Book New Test & Appointment"
        subtitle="Schedule diagnostic procedures with attending lab specialists"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
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
              Available tests and active medical staff at <strong>{lab?.name || 'nanoLabs Central Diagnostics'}</strong>
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

            {/* SECTION 2: Searchable Laboratory Tests (Card Layout) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Select Laboratory Diagnostic Test <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-teal-700 font-semibold">
                  Carried out by {lab?.name || 'nanoLabs'}
                </span>
              </div>

              {/* Search Bar for Tests */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search available lab tests by name or specialty category..."
                  value={testSearch}
                  onChange={e => setTestSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                {filteredTests.map(testItem => {
                  const isSelected = selectedTest?.id === testItem.id;
                  const basePrice = testItem.price || 5000;
                  const totalPrice = basePrice + SYSTEM_FEE;
                  const turnaround = testItem.turnaroundTime || testItem.expectedTime || '24 Hours';

                  return (
                    <div
                      key={testItem.id}
                      onClick={() => setSelectedTest(testItem)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
                          : 'bg-white border-slate-200/80 hover:border-teal-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase border border-teal-200">
                            {testItem.category || 'General'}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs leading-snug">
                          {testItem.name || testItem.testName}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-emerald-800 text-xs">
                            {basePrice.toLocaleString()} + {SYSTEM_FEE.toLocaleString()} FCFA
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-teal-600" />
                            {turnaround}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                          <span>Incl. 500 FCFA System Fee</span>
                          <span className="font-bold text-slate-700">Total: {totalPrice.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Selected Test Summary Banner */}
              {selectedTest && (
                <div className="p-4 bg-gradient-to-r from-teal-800 to-blue-900 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20">
                      <TestTube className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-teal-200 uppercase tracking-wide">
                        Selected Diagnostic Procedure
                      </div>
                      <h4 className="font-bold text-sm text-white">{selectedTest.name || selectedTest.testName}</h4>
                      <p className="text-[11px] text-teal-200/90 mt-0.5">
                        Test Fee: {(selectedTest.price || 5000).toLocaleString()} FCFA + {SYSTEM_FEE.toLocaleString()} FCFA System Fee
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-teal-200 block font-medium">Turnaround</span>
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-300" />
                        {selectedTest.turnaroundTime || selectedTest.expectedTime || '24 Hours'}
                      </span>
                    </div>

                    <div className="text-right bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                      <span className="text-[10px] text-teal-200 block font-medium">Total Payable Due</span>
                      <span className="text-sm font-extrabold text-white">
                        {((selectedTest.price || 5000) + SYSTEM_FEE).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: Searchable Attending Lab Tech / Doctor (Card Layout) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Attending Lab Technologist / Medical Specialist <span className="text-red-500">*</span>
              </label>

              {/* Search Bar for Staff */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search active lab techs or doctors by name..."
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              {/* Cards Grid for Staff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {filteredStaff.map(staffMember => {
                  const isSelected = selectedStaff?.id === staffMember.id;
                  return (
                    <div
                      key={staffMember.id}
                      onClick={() => setSelectedStaff(staffMember)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
                          : 'bg-white border-slate-200/80 hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {staffMember.avatarUrl ? (
                          <img
                            src={staffMember.avatarUrl}
                            alt={staffMember.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover border border-teal-200 shrink-0"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {getInitials(staffMember.name)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{staffMember.name}</h4>
                          <p className="text-[10px] text-teal-700 font-medium truncate">{staffMember.role || 'Clinical Lab Technologist'}</p>
                        </div>
                      </div>

                      {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
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
                    <option value="08:00 AM">08:00 AM (Early Intake)</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM (Afternoon)</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Indications / Special Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting required, symptoms reported, doctor referral notes..."
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
