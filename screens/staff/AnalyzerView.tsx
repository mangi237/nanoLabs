import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { limsService, PatientBooking } from '../../services/limsService';
import { 
  Microscope, 
  Search, 
  CheckCircle2, 
  TestTube, 
  Check, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  FileText,
  Users,
  FlaskConical,
  Droplets,
  Syringe,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  MapPin,
  Barcode,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const COMMON_SAMPLE_MATRICES = [
  'Whole Blood (EDTA Purple Top Tube)',
  'Serum (SST Gold Top Clot Activator Tube)',
  'Plasma (Sodium Citrate Light Blue Tube)',
  'Fluoride Oxalate Glucose Plasma (Grey Top Tube)',
  'Midstream Clean-Catch Urine Container',
  'Fresh Stool Specimen Container',
  'Cervical / Endocervical Swab Tube',
  'Deep Sputum Sterile Bottle',
  'CSF / Sterile Body Fluid Tube'
];

interface AnalyzerViewProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Grouped accordion expansion state
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);

  // Specimen Collection Modal State
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [selectedSingleTest, setSelectedSingleTest] = useState<any | null>(null);
  const [checkedMatrices, setCheckedMatrices] = useState<string[]>([]);
  const [sampleBarcodeName, setSampleBarcodeName] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [analyzerPasscode, setAnalyzerPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = limsService.subscribeToBookings(targetLabId, (allBookings) => {
      setBookings(allBookings.filter(b => b.paymentStatus === 'paid'));
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const allBookings = await limsService.fetchAllBookings(targetLabId);
      // Filter for PAID bookings
      setBookings(allBookings.filter(b => b.paymentStatus === 'paid'));
    } catch (e) {
      console.error('Error fetching phlebotomy queue:', e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate generic sample name from patient name + numbers
  const generateSampleName = (patientName: string, testName?: string) => {
    const cleanName = patientName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const initials = cleanName.slice(0, 4) || 'SMPL';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const testPrefix = testName ? testName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() : 'TST';
    return `SMP-${initials}-${testPrefix}-${randomNum}`;
  };

  const handleOpenBooking = (b: PatientBooking, singleTest?: any) => {
    setSelectedBooking(b);
    setSelectedSingleTest(singleTest || null);
    setAnalyzerPasscode('');
    setPasscodeError('');
    
    // Auto-generate sample name based on patient name + number
    const autoSampleName = generateSampleName(b.patientName, singleTest?.testName);
    setSampleBarcodeName(autoSampleName);
    setStorageLocation('');

    const required = new Set<string>();
    if (singleTest) {
      if (singleTest.sampleTypeRequired) required.add(singleTest.sampleTypeRequired);
      else required.add('Whole Blood (EDTA Purple Top Tube)');
    } else {
      b.tests?.forEach(t => {
        if (!t.sampleCollected && t.status !== 'In_Lab_Testing' && t.status !== 'Completed') {
          if (t.sampleTypeRequired) required.add(t.sampleTypeRequired);
        }
      });
      if (required.size === 0) required.add('Whole Blood (EDTA Purple Top Tube)');
    }
    setCheckedMatrices(Array.from(required));
  };

  const toggleMatrix = (matrix: string) => {
    if (checkedMatrices.includes(matrix)) {
      setCheckedMatrices(checkedMatrices.filter(m => m !== matrix));
    } else {
      setCheckedMatrices([...checkedMatrices, matrix]);
    }
  };

  const handleConfirmCollection = async () => {
    if (!selectedBooking) return;
    if (checkedMatrices.length === 0) {
      alert('Please check off at least one sample matrix physically drawn/collected.');
      return;
    }

    // Security Passcode verification for Analyzer / Phlebotomist
    const codeInput = analyzerPasscode.trim().toUpperCase();
    if (!codeInput) {
      setPasscodeError('Please enter your Analyzer Access Code to authorize specimen collection.');
      return;
    }

    // Valid passcodes include user access code, lab default, or standard supervisor/technician override
    const validCodes = ['1234', 'PHLEB123', 'PHLEB2025', 'ANALYZER', 'LABTECH', (user as any)?.accessCode, (user as any)?.pin].filter(Boolean).map(c => String(c).toUpperCase());
    if (!validCodes.includes(codeInput) && codeInput.length < 4) {
      setPasscodeError('Invalid Security Passcode. Default: 1234 or PHLEB123');
      return;
    }

    setIsSubmitting(true);
    setPasscodeError('');
    try {
      const sampleLabel = `${sampleBarcodeName || generateSampleName(selectedBooking.patientName)} ${storageLocation ? `[Loc: ${storageLocation}]` : ''}`;

      await limsService.completeSampleCollection({
        labId: targetLabId,
        bookingId: selectedBooking.id,
        singleTestId: selectedSingleTest ? (selectedSingleTest.id || selectedSingleTest.testId || selectedSingleTest.testName) : undefined,
        collectedSamples: [sampleLabel, ...checkedMatrices],
        collectorName: user?.name || 'Phlebotomist Collector'
      });

      setSelectedBooking(null);
      setSelectedSingleTest(null);
      await fetchData();
    } catch (e) {
      console.error('Error completing sample collection:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keep booking in phlebotomy queue as long as it has at least one paid/confirmed test not yet drawn
  const pendingCollection = bookings.filter(b => {
    if (b.overallStatus === 'Completed' || b.overallStatus === 'Ready_For_Pickup') return false;
    if (b.paymentStatus !== 'paid') return false;

    // Check if at least one test is waiting for specimen collection
    const hasUncollectedTests = b.tests?.some(t => 
      t.receptionistValidated !== false && 
      !t.sampleCollected && 
      t.status !== 'In_Lab_Testing' && 
      t.status !== 'Completed'
    );

    return hasUncollectedTests || b.overallStatus === 'Pending_Collection';
  });

  const filteredQueue = pendingCollection.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.patientPid?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group queue by patient identifier/name so patient appears once
  const groupedPatientsMap = new Map<string, { patientName: string; patientAge: number; patientGender: string; patientPhone: string; bookings: PatientBooking[] }>();

  filteredQueue.forEach(b => {
    const key = b.patientPid || b.patientId || b.patientName;
    if (!groupedPatientsMap.has(key)) {
      groupedPatientsMap.set(key, {
        patientName: b.patientName,
        patientAge: b.patientAge || 30,
        patientGender: b.patientGender || 'Male',
        patientPhone: b.patientPhone || '',
        bookings: [b]
      });
    } else {
      groupedPatientsMap.get(key)!.bookings.push(b);
    }
  });

  const groupedPatients = Array.from(groupedPatientsMap.entries()).map(([key, data]) => ({
    key,
    ...data
  }));

  return (
    <div className="space-y-6">
      <Header
        title="Phlebotomist & Specimen Collection Desk"
        subtitle="Step 3: Accession patient test batches, draw physical specimens, label sample tubes & route to Lab Technologists"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      {/* Staff Hero Banner */}
      <StaffHeroBanner
        workstationNumber="Workstation 03"
        workstationTitle="Phlebotomy & Specimen Accessioning Station"
        description="Verify paid patient test batches, auto-generate specimen barcode names, assign storage rack locations, and verify test specimens sequentially."
        gradientFrom="from-purple-950"
        gradientVia="from-slate-900"
        gradientTo="to-purple-900"
        borderColor="border-purple-800"
        badgeBg="bg-purple-400 text-slate-950"
        rightBadge={
          <div className="text-right bg-purple-950/80 p-4 rounded-2xl border border-purple-700/60 shadow-md">
            <div className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Pending Specimen Collection</div>
            <div className="text-2xl font-black text-purple-300 font-mono mt-0.5">{groupedPatients.length} Patients ({filteredQueue.length} Batches)</div>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patients in Sampling Queue</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">{groupedPatients.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Samples Processed to Lab</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">
              {bookings.filter(b => b.overallStatus === 'In_Lab_Testing' || b.overallStatus === 'Completed').length}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Barcode Identification</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">Auto-Generated</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
            <Barcode className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search patient name, PID, or booking barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Grouped Phlebotomy Patient Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Syringe className="w-4 h-4 text-purple-600" />
            Paid Patient Specimen Accessioning Queue ({groupedPatients.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">Verify test-by-test or accession entire batch</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading phlebotomy queue...</div>
        ) : groupedPatients.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-purple-900">No patients currently in specimen collection queue.</p>
            <p>Patients will appear once Cashier verifies their payment settlement.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {groupedPatients.map((group) => {
              const isExpanded = expandedPatientId === group.key || groupedPatients.length === 1;
              const totalTestsCount = group.bookings.reduce((sum, b) => sum + (b.tests?.length || 0), 0);

              return (
                <div key={group.key} className="p-4 transition-colors">
                  {/* Single Patient Row Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center font-extrabold text-sm">
                        {group.patientName.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{group.patientName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            PAID SETTLED
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                          <span>PID: <strong className="font-mono text-purple-700">{group.key}</strong></span>
                          <span>Age: <strong>{group.patientAge} Yrs</strong> ({group.patientGender})</span>
                          <span>Total Tests: <strong className="text-purple-700 font-bold">{totalTestsCount}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedPatientId(isExpanded ? null : group.key)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Test Batches' : 'View Test Batches'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Batch Accession for this patient */}
                      <button
                        onClick={() => handleOpenBooking(group.bookings[0])}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Syringe className="w-3.5 h-3.5" />
                        Draw All Tests
                      </button>
                    </div>
                  </div>

                  {/* Expanded Dropdown of all Batches & Tests for this Patient */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 bg-purple-50/40 p-3 rounded-2xl border border-purple-100">
                      <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        Batches & Individual Tests for {group.patientName}
                      </div>

                      <div className="space-y-2">
                        {group.bookings.map(b => (
                          <div key={b.id} className="p-3 bg-white rounded-xl border border-purple-200/80 shadow-xs space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                                  {b.bookingCode}
                                </span>
                                <span className="text-slate-500 text-[11px]">
                                  Doctor: {b.doctorName || 'Attending Physician'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleOpenBooking(b)}
                                className="text-purple-700 hover:text-purple-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                Draw Batch <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Test by test items */}
                            <div className="divide-y divide-slate-100">
                              {b.tests?.map((t, tIdx) => (
                                <div key={t.id || tIdx} className="py-1.5 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <TestTube className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                    <div>
                                      <span className="font-bold text-slate-800">{t.testName}</span>
                                      <span className="text-[10px] text-slate-500 ml-2">
                                        Matrix: <strong>{t.sampleTypeRequired || 'Whole Blood'}</strong>
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleOpenBooking(b, t)}
                                    className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <Syringe className="w-3 h-3" />
                                    Verify This Test
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SAMPLE COLLECTION MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-bold">
                  <Syringe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {selectedSingleTest ? `Draw & Verify Test: ${selectedSingleTest.testName}` : 'Draw & Log Specimen Matrices'}
                  </h3>
                  <p className="text-xs text-purple-700 font-bold">
                    Patient: {selectedBooking.patientName} ({selectedBooking.bookingCode})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedBooking(null); setSelectedSingleTest(null); }} 
                className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Auto-Generated Sample Name / Barcode */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-purple-600" />
                    Auto-Generated Specimen Barcode / Label
                  </label>
                  <button
                    type="button"
                    onClick={() => setSampleBarcodeName(generateSampleName(selectedBooking.patientName, selectedSingleTest?.testName))}
                    className="text-[10px] text-purple-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
                <input
                  type="text"
                  value={sampleBarcodeName}
                  onChange={e => setSampleBarcodeName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Optional Storage Location */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  Storage / Rack Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rack A-4, Freezer -20°C Tray 2, Centrifuge Box 1"
                  value={storageLocation}
                  onChange={e => setStorageLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Physical Matrices Checklist */}
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                <div className="font-bold text-purple-900 mb-1">Check Off Physical Matrices Collected:</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-1">
                  {COMMON_SAMPLE_MATRICES.map(m => {
                    const isChecked = checkedMatrices.includes(m);
                    return (
                      <label 
                        key={m}
                        className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                          isChecked ? 'bg-purple-100 border-purple-400 text-purple-950 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMatrix(m)}
                          className="w-4 h-4 text-purple-700 rounded-md focus:ring-purple-500"
                        />
                        <span>{m}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Security Authorization Passcode */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Analyzer / Phlebotomist Security Verification Code *
                  </label>
                  <button
                    type="button"
                    onClick={() => setAnalyzerPasscode('1234')}
                    className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
                  >
                    Quick-Fill (1234)
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Enter 4-digit Security Passcode (e.g. 1234 or PHLEB123)"
                  value={analyzerPasscode}
                  onChange={e => {
                    setAnalyzerPasscode(e.target.value);
                    if (passcodeError) setPasscodeError('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {passcodeError && (
                  <p className="text-[11px] font-bold text-red-600">{passcodeError}</p>
                )}
                <p className="text-[10px] text-amber-800">
                  Verifies technician chain-of-custody for specimen barcoding and blood/fluid transfer.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setSelectedBooking(null); setSelectedSingleTest(null); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || checkedMatrices.length === 0}
                  onClick={handleConfirmCollection}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Logging Specimen...' : 'Confirm Specimen & Transfer to Tech'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzerView;
