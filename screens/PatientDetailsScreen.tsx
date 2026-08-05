import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import { useAuth } from '../context/authContext';
import { db, updateDoc, doc, collection, getDocs } from '../services/firebase';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  TestTube, 
  Plus, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Edit3, 
  X, 
  Search, 
  Clock, 
  DollarSign,
  Loader2,
  Stethoscope
} from 'lucide-react';

interface PatientDetailsScreenProps {
  patient?: any;
  onBack?: () => void;
  onSelectTest?: (test: any) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const PatientDetailsScreen: React.FC<PatientDetailsScreenProps> = ({
  patient,
  onBack,
  onSelectTest,
  onNotificationPress,
  onProfilePress
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || 'lab-1';
  const currentPatient = patient || null;

  // Medical privacy protection: Administrators are legally restricted from viewing clinical tests and diagnoses
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          title="Patient Privacy Restriction"
          subtitle="Medical confidentiality & health data compliance"
          onNotificationPress={onNotificationPress}
          onProfilePress={onProfilePress}
        />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 flex flex-col items-center text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-md">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Clinical Data Access Restricted</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In accordance with patient health data protection and confidentiality laws in Cameroon, hospital and laboratory administrators cannot view clinical test requests, diagnoses, or diagnostic findings.
            </p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 text-left space-y-1 w-full">
            <p className="font-bold text-slate-800">Operational Summary for Patient {currentPatient?.name || 'Record'}:</p>
            <p>• Patient Code: <span className="font-mono font-semibold text-slate-700">{currentPatient?.patientId || currentPatient?.id}</span></p>
            <p>• Demographics: {currentPatient?.age || 30} yrs • {currentPatient?.gender || 'N/A'}</p>
            <p>• Contact: {currentPatient?.phone || 'N/A'}</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Return to Administrative Dashboard
            </button>
          )}
        </main>
      </div>
    );
  }

  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [testSearch, setTestSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLabCatalogAndStaff();
  }, [targetLabId]);

  const loadLabCatalogAndStaff = async () => {
    try {
      // 1. Fetch Tests
      const testsSnap = await getDocs(collection(db, 'labs', targetLabId, 'testCatalog'));
      let tests: any[] = testsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (tests.length === 0) {
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
      if (tests.length > 0) setSelectedTest(tests[0]);

      // 2. Fetch Staff
      const staffSnap = await getDocs(collection(db, 'labs', targetLabId, 'staff'));
      let staff: any[] = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (staff.length === 0) {
        staff = [
          { id: 'st-1', name: 'Dr. Alexis Vance', role: 'Lab Specialist & Medical Director' },
          { id: 'st-2', name: 'Sarah Chen, MLS', role: 'Senior Clinical Lab Technologist' },
          { id: 'st-3', name: 'Dr. Marcus Thorne', role: 'Consultant Hematopathologist' }
        ];
      }
      setStaffList(staff);
      if (staff.length > 0) setSelectedStaff(staff[0]);
    } catch (e) {
      console.error('Error loading catalog/staff for modal:', e);
    }
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;

    setSaving(true);
    try {
      const basePrice = selectedTest.price || 5000;
      const systemFee = 1000;
      const totalPrice = basePrice + systemFee;

      const newTest = {
        id: 't-' + Math.floor(1000 + Math.random() * 9000),
        testName: selectedTest.name || selectedTest.testName || 'Diagnostic Test',
        category: selectedTest.category || 'General',
        basePrice: basePrice,
        systemFee: systemFee,
        price: totalPrice,
        totalPrice: totalPrice,
        priceDisplay: `${basePrice.toLocaleString()} + ${systemFee.toLocaleString()} FCFA System Fee`,
        turnaroundTime: selectedTest.turnaroundTime || selectedTest.expectedTime || '24 Hours',
        doctorName: selectedStaff?.name || 'Lab Technologist',
        doctorRole: selectedStaff?.role || 'Lab Tech',
        status: 'requested',
        paymentStatus: 'pending',
        confirmedByReceptionist: false,
        sampleCollected: false,
        requestedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      const existingTests = currentPatient.labTests || [];
      const updatedTests = [...existingTests, newTest];

      await updateDoc(doc(db, 'labs', targetLabId, 'patients', currentPatient.id), {
        labTests: updatedTests,
        status: 'active',
        updatedAt: new Date().toISOString()
      });

      currentPatient.labTests = updatedTests;
      setShowAddTestModal(false);
    } catch (e) {
      console.error('Error requesting new lab test:', e);
    } finally {
      setSaving(false);
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

  const getInitials = (name?: string) => {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (!currentPatient) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-slate-500 font-semibold mb-3">Patient record not found</p>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold">
            Return to Patients List
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Patient Profile & Diagnostic Tests"
        subtitle="Detailed medical record, intake & test bookings"
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
            Back to Patients List
          </button>
        )}

        {/* Patient Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              {currentPatient.avatarUrl ? (
                <img
                  src={currentPatient.avatarUrl}
                  alt={currentPatient.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md border border-teal-200">
                  {getInitials(currentPatient.name)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">{currentPatient.name}</h1>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                    {currentPatient.patientId || currentPatient.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {currentPatient.age || 30} years old • {currentPatient.gender || 'Not Specified'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddTestModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Request New Test
            </button>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{currentPatient.phone || '+237 670000000'}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="truncate">{currentPatient.email || 'No email registered'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="truncate">{currentPatient.address || 'Central District'}</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Tests */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base">Laboratory Test History</h2>
            <span className="text-xs font-semibold text-slate-500">
              {(currentPatient.labTests || []).length} Tests Listed
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {(currentPatient.labTests || []).map((test: any) => {
              const isConfirmed = test.confirmedByReceptionist === true || test.status === 'confirmed' || test.sampleCollected;
              return (
                <div
                  key={test.id}
                  onClick={() => onSelectTest && onSelectTest(test)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-teal-50/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                      <TestTube className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{test.testName || test.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>Category: {test.category || 'General'}</span>
                        <span>•</span>
                        <span className="font-bold text-emerald-800">
                          {test.priceDisplay || `${(test.basePrice || test.price || 5000).toLocaleString()} + ${(test.systemFee || 1000).toLocaleString()} FCFA System Fee`}
                        </span>
                        {test.turnaroundTime && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              {test.turnaroundTime}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConfirmed ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {test.status === 'completed' ? 'Results Ready' : 'Confirmed by Reception'}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                        Pending Reception Intake
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {(!currentPatient.labTests || currentPatient.labTests.length === 0) && (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <TestTube className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No laboratory tests requested yet</p>
                <button
                  onClick={() => setShowAddTestModal(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Request First Test
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Unified Book Test Modal */}
      {showAddTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-teal-700 text-white">
              <div>
                <h3 className="font-bold text-base">Request Test for {currentPatient.name}</h3>
                <p className="text-xs text-teal-100">Select diagnostic procedure and attending specialist</p>
              </div>
              <button onClick={() => setShowAddTestModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTest} className="p-6 space-y-5">
              {/* Searchable Test Selector Card Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Select Test from Lab Catalog <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-teal-700 font-semibold">{catalog.length} Available</span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search tests by name or category..."
                    value={testSearch}
                    onChange={e => setTestSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {filteredTests.map(testItem => {
                    const isSelected = selectedTest?.id === testItem.id;
                    return (
                      <div
                        key={testItem.id}
                        onClick={() => setSelectedTest(testItem)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-500/20'
                            : 'bg-white border-slate-200/80 hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-slate-900 text-xs leading-tight">
                            {testItem.name || testItem.testName}
                          </h4>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                        </div>

                        <div className="flex flex-col gap-0.5 text-[11px] pt-1 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-800">
                              {(testItem.price || 5000).toLocaleString()} + 1,000 FCFA
                            </span>
                            <span className="flex items-center gap-0.5 text-slate-500 font-medium">
                              <Clock className="w-3 h-3 text-teal-600" />
                              {testItem.turnaroundTime || testItem.expectedTime || '24 Hours'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">Total: {((testItem.price || 5000) + 1000).toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic Selected Test Preview */}
                {selectedTest && (
                  <div className="p-3.5 bg-gradient-to-r from-teal-800 to-blue-900 rounded-2xl text-white flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-teal-200 uppercase font-semibold">Selected Procedure</span>
                      <h4 className="font-bold text-white text-sm">{selectedTest.name || selectedTest.testName}</h4>
                      <p className="text-[10px] text-teal-200 mt-0.5">
                        Test: {(selectedTest.price || 5000).toLocaleString()} FCFA + 1,000 FCFA System Fee
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-teal-200 text-[10px] block">Turnaround: {selectedTest.turnaroundTime || '24h'}</span>
                      <span className="font-extrabold text-white text-sm">{((selectedTest.price || 5000) + 1000).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Searchable Staff Card Grid */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assign Attending Lab Technologist <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search attending staff..."
                    value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto pr-1">
                  {filteredStaff.map(staffMember => {
                    const isSelected = selectedStaff?.id === staffMember.id;
                    return (
                      <div
                        key={staffMember.id}
                        onClick={() => setSelectedStaff(staffMember)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20'
                            : 'bg-white border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {getInitials(staffMember.name)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate">{staffMember.name}</h4>
                            <p className="text-[10px] text-teal-700 truncate">{staffMember.role || 'Technologist'}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTestModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedTest}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning Test...
                    </>
                  ) : (
                    <>
                      Confirm & Request Test
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetailsScreen;
