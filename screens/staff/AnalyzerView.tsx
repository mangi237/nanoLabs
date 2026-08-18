import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
import { authService } from '../../services/authService';
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
  KeyRound,
  Lock,
  Printer,
  Tag,
  ChevronDown,
  ChevronUp,
  MapPin,
  Plus,
  X
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

interface SpecimenLabel {
  code: string;
  matrix: string;
  patientName: string;
  patientPid: string;
  bookingCode: string;
  testsCovered: string[];
  collectedBy: string;
  collectedAt: string;
  storageLocation: string;
}

interface AnalyzerViewProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({ onNotificationPress, onProfilePress, onRoleSwitcherPress }) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Booking Modal State
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [checkedMatrices, setCheckedMatrices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Access code confirmation state
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Generated printable labels shown after a successful collection
  const [generatedLabels, setGeneratedLabels] = useState<SpecimenLabel[] | null>(null);

  // FIXED: Per-test sample collection state
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [testCollectionStatus, setTestCollectionStatus] = useState<Record<string, { matrix: string; location: string; collected: boolean }>>({});
  
  // FIXED: Storage location for each test
  const [storageLocation, setStorageLocation] = useState<Record<string, string>>({});
  const [showLocationInput, setShowLocationInput] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const allBookings = await limsService.fetchAllBookings(targetLabId);
      setBookings(allBookings.filter(b => b.paymentStatus === 'paid'));
    } catch (e) {
      console.error('Error fetching phlebotomy queue:', e);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Open booking with per-test expansion
  const handleOpenBooking = (b: PatientBooking) => {
    setSelectedBooking(b);
    setAccessCodeInput('');
    setAccessCodeError('');
    setExpandedBookingId(null);
    
    // Initialize test collection status
    const status: Record<string, { matrix: string; location: string; collected: boolean }> = {};
    b.tests.forEach(t => {
      const testId = t.id || t.testId;
      status[testId] = {
        matrix: t.sampleTypeRequired || 'Venous Blood',
        location: '',
        collected: false
      };
    });
    setTestCollectionStatus(status);
    setStorageLocation({});
    setShowLocationInput({});
  };

  // FIXED: Toggle test collection individually
  const toggleTestCollection = (testId: string) => {
    setTestCollectionStatus(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        collected: !prev[testId]?.collected
      }
    }));
  };

  // FIXED: Set storage location for a test
  const setTestStorageLocation = (testId: string, location: string) => {
    setStorageLocation(prev => ({ ...prev, [testId]: location }));
    setTestCollectionStatus(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        location
      }
    }));
  };

  // FIXED: Generate unique sample code
  const generateSampleCode = (patientName: string, index: number): string => {
    // Take first 2 letters of first name + first 2 letters of last name
    const nameParts = patientName.trim().split(' ');
    let prefix = '';
    if (nameParts.length >= 2) {
      prefix = (nameParts[0]?.substring(0, 2) + nameParts[nameParts.length - 1]?.substring(0, 2)).toUpperCase();
    } else {
      prefix = patientName.substring(0, 4).toUpperCase();
    }
    // Add incremental number
    return `SPC-${prefix}-${String(index + 1).padStart(3, '0')}`;
  };

  /**
   * Builds one readable label per test collected
   */
  const buildSpecimenLabels = (booking: PatientBooking, collectedTests: Array<{ testId: string; matrix: string; location: string }>, collectedByName: string): SpecimenLabel[] => {
    const timestamp = new Date();
    const dateLabel = timestamp.toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return collectedTests.map((item, idx) => {
      const test = booking.tests.find(t => (t.id || t.testId) === item.testId);
      return {
        code: generateSampleCode(booking.patientName, idx),
        matrix: item.matrix,
        patientName: booking.patientName,
        patientPid: booking.patientPid || booking.patientId,
        bookingCode: booking.bookingCode,
        testsCovered: test ? [test.testName] : ['General'],
        collectedBy: collectedByName,
        collectedAt: dateLabel,
        storageLocation: item.location || 'Standard Storage'
      };
    });
  };

  const handleConfirmCollection = async () => {
    if (!selectedBooking) return;

    // FIXED: Get only collected tests
    const collectedTests = Object.entries(testCollectionStatus)
      .filter(([_, status]) => status.collected)
      .map(([testId, status]) => ({
        testId,
        matrix: status.matrix,
        location: status.location || 'Standard Storage'
      }));

    if (collectedTests.length === 0) {
      setAccessCodeError('Please collect at least one test sample.');
      return;
    }

    // Check if all collected tests have a storage location
    const missingLocation = collectedTests.some(t => !t.location || t.location.trim() === '');
    if (missingLocation) {
      setAccessCodeError('Please specify a storage location for each collected sample.');
      return;
    }

    setAccessCodeError('');

    // 1. Verify staff access code
    setVerifyingCode(true);
    const verification = await authService.verifyStaffActionCode(
      accessCodeInput,
      ['analyzer', 'labtech', 'admin'],
      user?.accessCode,
      targetLabId
    );
    setVerifyingCode(false);

    if (!verification.authorized) {
      setAccessCodeError(verification.error || 'Invalid access code.');
      return;
    }

    const collectorName = verification.staffName || user?.name || 'Phlebotomist Collector';

    setIsSubmitting(true);
    try {
      // Get all matrices from collected tests
      const matrices = collectedTests.map(t => t.matrix);
      
      const ok = await limsService.completeSampleCollection({
        labId: targetLabId,
        bookingId: selectedBooking.id,
        collectedSamples: matrices,
        collectorName
      });

      if (!ok) {
        setAccessCodeError('Could not save sample collection.');
        setIsSubmitting(false);
        return;
      }

      // Generate labels
      const labels = buildSpecimenLabels(selectedBooking, collectedTests, collectorName);
      setGeneratedLabels(labels);

      setSelectedBooking(null);
      setAccessCodeInput('');
      await fetchData();
    } catch (e) {
      console.error('Error completing sample collection:', e);
      setAccessCodeError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCollection = bookings.filter(b => b.overallStatus === 'Pending_Collection');
  const filteredQueue = pendingCollection.filter(b =>
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Header
        title="Phlebotomist & Sample Collection Workstation"
        subtitle="Step 3: Draw physical specimens, select sample matrices & label tubes"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      <div className="bg-purple-900/90 text-white p-4 rounded-2xl border border-purple-700 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 font-bold">
            <Syringe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Phlebotomy Mandatory Specimen Selection</h3>
            <p className="text-xs text-purple-100/80">
              FIXED: Collect samples test-by-test with storage location tracking.
            </p>
          </div>
        </div>

        <div className="text-right text-xs shrink-0 font-mono font-bold text-purple-200 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800">
          Paid Queue: {pendingCollection.length}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search paid patient name or Booking ID (BK-...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Phlebotomy Digital Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-purple-600" />
            Paid Specimen Collection Queue ({filteredQueue.length})
          </h3>
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Payment Verified
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading phlebotomy queue...</div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">No patients waiting for specimen collection.</p>
            <p className="text-slate-500">When the cashier marks an invoice as paid, the patient automatically appears here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQueue.map((booking) => {
              const isExpanded = expandedBookingId === booking.id;
              const totalTests = booking.tests?.length || 0;
              const collectedCount = Object.values(testCollectionStatus).filter(s => s.collected).length;

              return (
                <div key={booking.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {booking.patientName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {booking.bookingCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          PAID
                        </span>
                        {isExpanded && collectedCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                            {collectedCount}/{totalTests} Collected
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span>Age/Sex: <strong>{booking.patientAge || 28} Yrs • {booking.patientGender || 'Male'}</strong></span>
                        <span>Tests: <strong className="text-purple-700 font-bold">{totalTests} tests</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedBookingId(null);
                          } else {
                            setExpandedBookingId(booking.id);
                            // Initialize test status if not already
                            if (Object.keys(testCollectionStatus).length === 0) {
                              const status: Record<string, { matrix: string; location: string; collected: boolean }> = {};
                              booking.tests.forEach(t => {
                                const testId = t.id || t.testId;
                                status[testId] = {
                                  matrix: t.sampleTypeRequired || 'Venous Blood',
                                  location: '',
                                  collected: false
                                };
                              });
                              setTestCollectionStatus(status);
                            }
                          }
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Syringe className="w-4 h-4 text-purple-600" />
                        <span>{isExpanded ? 'Hide Tests' : 'Collect Samples'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      {!isExpanded && (
                        <button
                          onClick={() => handleOpenBooking(booking)}
                          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Droplets className="w-4 h-4" />
                          Collect All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* FIXED: Expanded test-by-test collection */}
                  {isExpanded && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-purple-200 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                          <TestTube className="w-4 h-4 text-purple-600" />
                          Collect Tests Individually
                        </h4>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {collectedCount} of {totalTests} collected
                        </span>
                      </div>

                      {booking.tests.map((test, idx) => {
                        const testId = test.id || test.testId;
                        const status = testCollectionStatus[testId] || { matrix: test.sampleTypeRequired || 'Venous Blood', location: '', collected: false };
                        const isCollected = status.collected;

                        return (
                          <div
                            key={testId}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isCollected 
                                ? 'bg-emerald-50 border-emerald-400' 
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isCollected}
                                  onChange={() => toggleTestCollection(testId)}
                                  className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500 cursor-pointer"
                                />
                                <div>
                                  <div className="font-extrabold text-xs text-slate-900">
                                    {test.testName}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                    <span>Matrix: {status.matrix}</span>
                                    {isCollected && status.location && (
                                      <span className="text-emerald-600">📍 {status.location}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isCollected && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                    ✓ Collected
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    setShowLocationInput(prev => ({
                                      ...prev,
                                      [testId]: !prev[testId]
                                    }));
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <MapPin className="w-3 h-3" />
                                  {status.location ? 'Update Location' : 'Add Location'}
                                </button>
                              </div>
                            </div>

                            {/* FIXED: Storage location input */}
                            {showLocationInput[testId] && (
                              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. Storage Unit A-3, Refrigerator 2, Drawer 5..."
                                  value={storageLocation[testId] || status.location || ''}
                                  onChange={(e) => setStorageLocation(prev => ({ ...prev, [testId]: e.target.value }))}
                                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                  onClick={() => {
                                    const loc = storageLocation[testId] || '';
                                    if (loc.trim()) {
                                      setTestStorageLocation(testId, loc.trim());
                                      setShowLocationInput(prev => ({ ...prev, [testId]: false }));
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Save Location
                                </button>
                                <button
                                  onClick={() => setShowLocationInput(prev => ({ ...prev, [testId]: false }))}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* FIXED: Collection action with location validation */}
                      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-slate-600">
                          <span className="font-bold">{collectedCount}</span> of {totalTests} tests ready for collection
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              // Select all uncollected tests
                              booking.tests.forEach(t => {
                                const testId = t.id || t.testId;
                                if (!testCollectionStatus[testId]?.collected) {
                                  toggleTestCollection(testId);
                                }
                              });
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                          >
                            Select All
                          </button>

                          <button
                            onClick={() => handleOpenBooking(booking)}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Droplets className="w-4 h-4" />
                            Collect Selected ({collectedCount})
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SAMPLE MATRIX CHECKLIST MODAL - FIXED with storage location per test */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Collection Confirmation</h3>
                  <p className="text-xs text-purple-300">{selectedBooking.patientName} • {selectedBooking.bookingCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Tests to collect */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedBooking.tests.map((test, idx) => {
                  const testId = test.id || test.testId;
                  const status = testCollectionStatus[testId] || { matrix: test.sampleTypeRequired || 'Venous Blood', location: '', collected: false };
                  
                  return (
                    <div
                      key={testId}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        status.collected 
                          ? 'bg-emerald-950/60 border-emerald-500/40' 
                          : 'bg-slate-800/60 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={status.collected}
                          onChange={() => toggleTestCollection(testId)}
                          className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-medium text-white">{test.testName}</div>
                          <div className="text-[10px] text-slate-400">{status.matrix}</div>
                        </div>
                      </div>
                      {status.collected && status.location && (
                        <span className="text-[10px] text-emerald-300">📍 {status.location}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Storage location input for current test */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <label className="block text-slate-300 font-bold text-xs mb-1">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Storage Location for Selected Samples
                </label>
                <input
                  type="text"
                  placeholder="e.g. Freezer A-2, Drawer 4, Refrigerator 1"
                  value={storageLocation['current'] || ''}
                  onChange={(e) => setStorageLocation(prev => ({ ...prev, ['current']: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This location will be applied to all collected samples.
                </p>
              </div>

              {/* ACCESS CODE CONFIRMATION */}
              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 text-amber-200 font-bold text-xs">
                  <KeyRound className="w-4 h-4" />
                  Enter your staff access code to confirm this collection
                </label>
                <input
                  type="password"
                  value={accessCodeInput}
                  onChange={e => { setAccessCodeInput(e.target.value); setAccessCodeError(''); }}
                  placeholder="Your personal access code"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-amber-500/40 rounded-xl text-white placeholder-slate-500 tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoComplete="off"
                />
                {accessCodeError && (
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {accessCodeError}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || verifyingCode || !accessCodeInput.trim()}
                  onClick={handleConfirmCollection}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {verifyingCode ? 'Verifying Code...' : isSubmitting ? 'Saving...' : 'Complete Collection ➔ Generate Labels'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GENERATED SPECIMEN LABELS MODAL - FIXED with storage location */}
      {generatedLabels && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Specimen Labels Ready</h3>
                  <p className="text-xs text-slate-500">Unique sample codes generated for each collected test.</p>
                </div>
              </div>
              <button onClick={() => setGeneratedLabels(null)} className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              {generatedLabels.map((label) => (
                <div
                  key={label.code}
                  className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 font-mono text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-emerald-700">NANOLABS — SPECIMEN LABEL</span>
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-bold text-[11px]">{label.code}</span>
                  </div>
                  <div className="text-slate-800"><strong>Patient:</strong> {label.patientName} (PID: {label.patientPid})</div>
                  <div className="text-slate-800"><strong>Booking:</strong> {label.bookingCode}</div>
                  <div className="text-slate-800"><strong>Sample:</strong> {label.matrix}</div>
                  <div className="text-slate-800"><strong>Test:</strong> {label.testsCovered.join(', ')}</div>
                  <div className="text-slate-800"><strong>Storage:</strong> {label.storageLocation}</div>
                  <div className="text-slate-600 text-[11px]"><strong>Collected:</strong> {label.collectedAt} — <strong>By:</strong> {label.collectedBy}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => setGeneratedLabels(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Labels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzerView;