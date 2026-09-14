import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, addDoc, collection, getDocs, doc, setDoc } from '../../services/firebase';
import { limsService } from '../../services/limsService';
import { cleanFirestoreData } from '../../utils/sanitizeData';
import { DoctorCardSelect, DoctorOption, ACCREDITED_DOCTORS } from '../../components/common/DoctorCardSelect';
import { AiPrescriptionScannerModal } from '../../components/common/AiPrescriptionScannerModal';
import { MatchedPrescriptionTest } from '../../core/scanner';
import { PARTNER_LABS_LOCATIONS, PartnerLabLocation } from '../../core/gps';
import { 
  OFFICIAL_MASTER_TEST_CATALOG, 
  OFFICIAL_CATEGORIES 
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
  Sparkles,
  Stethoscope,
  FlaskConical,
  Info,
  ShieldCheck,
  Building2,
  Star,
  Check,
  Zap,
  ArrowRight,
  Receipt,
  Layers,
  Split,
  ChevronRight,
  Briefcase,
  Percent,
  Truck,
  Phone,
  Mail,
  X
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
  const currentLabId = lab?.id || user?.labId || 'lab-akwa';

  // --------------------------------------------------------------------------
  // STEPPING STATE: 1 = Tests, 2 = Labs & Pricing, 3 = Doctor & Identity
  // --------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // System loading & error states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingComplete, setBookingComplete] = useState<any | null>(null);

  // Step 1: Catalog & Selected Tests
  const [catalog] = useState<any[]>(OFFICIAL_MASTER_TEST_CATALOG);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [testSearch, setTestSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Step 2: Lab Selection & Batch Strategy
  const [availableLabs] = useState<PartnerLabLocation[]>(PARTNER_LABS_LOCATIONS);
  const [selectedPrimaryLabId, setSelectedPrimaryLabId] = useState<string>(currentLabId || 'lab-akwa');
  const [batchStrategy, setBatchStrategy] = useState<'single' | 'split' | 'compare'>('single');
  // In split mode, map testId -> labId
  const [testLabAssignments, setTestLabAssignments] = useState<Record<string, string>>({});
  // In compare mode, second lab ID
  const [comparisonLabId, setComparisonLabId] = useState<string>('lab-bonanjo');

  // Step 3: Referring Doctor
  const [referringDoctorName, setReferringDoctorName] = useState<string>('Dr. Emmanuel Nkuo');
  const [referringHospital, setReferringHospital] = useState<string>('La Quintinie Hospital, Douala');
  const [referringDoctorPhone, setReferringDoctorPhone] = useState<string>('+237 677 12 34 56');
  const [referringSpecialty, setReferringSpecialty] = useState<string>('Internal Medicine & Infectious Diseases');
  const [referralNotes, setReferralNotes] = useState<string>('');

  // Step 3: Patient Identity & Insurance (Default to +237 phone prefix, no permanent lab affiliation)
  const [patientFullName, setPatientFullName] = useState<string>(user?.name || '');
  const [patientPhone, setPatientPhone] = useState<string>(
    user?.phone && user.phone.startsWith('+237') ? user.phone : '+237 '
  );
  const [patientEmail, setPatientEmail] = useState<string>(user?.email || '');
  const [patientEmployer, setPatientEmployer] = useState<string>('');
  const [insuranceProvider, setInsuranceProvider] = useState<string>('None / Direct Cashier');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState<string>('');
  const [insuranceCoveragePercent, setInsuranceCoveragePercent] = useState<number>(80);
  
  // Schedule & Sample Mode
  const [sampleMode, setSampleMode] = useState<'walk_in' | 'home_collection'>('walk_in');
  const [homeAddress, setHomeAddress] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState<string>('08:30 AM');

  // Initialize primary lab
  useEffect(() => {
    if (availableLabs.length > 0 && !selectedPrimaryLabId) {
      setSelectedPrimaryLabId(availableLabs[0].id);
    }
  }, [availableLabs, selectedPrimaryLabId]);

  // Sync default lab assignment for tests when selected
  useEffect(() => {
    setTestLabAssignments(prev => {
      const updated = { ...prev };
      selectedTests.forEach(t => {
        if (!updated[t.id]) {
          updated[t.id] = selectedPrimaryLabId;
        }
      });
      return updated;
    });
  }, [selectedTests, selectedPrimaryLabId]);

  // Helper to get lab-specific price for a test
  const getLabTestPrice = (test: any, labId: string): number => {
    const targetLab = availableLabs.find(l => l.id === labId) || availableLabs[0];
    const multiplier = targetLab?.pricingMultiplier || 1.0;
    const base = test.price || 5000;
    return Math.round(base * multiplier / 100) * 100;
  };

  // Toggle test selection in Step 1
  const toggleSelectTest = (test: any) => {
    const exists = selectedTests.some(t => t.id === test.id);
    if (exists) {
      setSelectedTests(selectedTests.filter(t => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  // Handle proceed from AI Prescription Scanner
  const handleProceedFromScanner = (matched: MatchedPrescriptionTest[]) => {
    const newTests: any[] = [];
    matched.forEach(m => {
      const testKey = m.testId || m.code;
      const found = catalog.find(c => (testKey && c.id === testKey) || c.name.toLowerCase() === m.name.toLowerCase());
      if (found && !selectedTests.some(st => st.id === found.id)) {
        newTests.push(found);
      } else if (!found && !selectedTests.some(st => st.name === m.name)) {
        newTests.push({
          id: testKey || `custom-${Date.now()}`,
          name: m.name,
          category: m.category || 'Clinical Prescription',
          sampleType: 'Venous Blood',
          price: m.basePriceXaf || m.basePrice || 5000
        });
      }
    });
    if (newTests.length > 0) {
      setSelectedTests(prev => [...prev, ...newTests]);
    }
  };

  // Calculate total price based on batch strategy
  const calculateTotalBookingPrice = (): number => {
    if (batchStrategy === 'single') {
      return selectedTests.reduce((sum, t) => sum + getLabTestPrice(t, selectedPrimaryLabId), 0);
    } else if (batchStrategy === 'split') {
      return selectedTests.reduce((sum, t) => {
        const assignedLab = testLabAssignments[t.id] || selectedPrimaryLabId;
        return sum + getLabTestPrice(t, assignedLab);
      }, 0);
    } else {
      // Compare mode: test price at primary lab + price at comparison lab
      const priceLab1 = selectedTests.reduce((sum, t) => sum + getLabTestPrice(t, selectedPrimaryLabId), 0);
      const priceLab2 = selectedTests.reduce((sum, t) => sum + getLabTestPrice(t, comparisonLabId), 0);
      return priceLab1 + priceLab2;
    }
  };

  // Handle final submission in Step 3
  const handleConfirmBooking = async () => {
    if (!patientFullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!patientPhone.trim() || patientPhone.trim() === '+237') {
      setErrorMessage('Please enter a valid phone number with the +237 prefix.');
      return;
    }
    if (selectedTests.length === 0) {
      setErrorMessage('Please select at least one test.');
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const timestamp = new Date().toISOString();
      const randomCode = Math.floor(100000 + Math.random() * 900000);
      const bookingCode = `NL-${randomCode}`;
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const targetLabId = selectedPrimaryLabId;
      const targetLabObj = availableLabs.find(l => l.id === targetLabId) || availableLabs[0];

      const totalPrice = calculateTotalBookingPrice();
      const hasInsurance = insuranceProvider !== 'None / Direct Cashier' && Boolean(insurancePolicyNumber.trim());
      const insuranceCoveredAmount = hasInsurance ? Math.round(totalPrice * (insuranceCoveragePercent / 100)) : 0;
      const patientCoPayAmount = totalPrice - insuranceCoveredAmount;

      // 1. Sync Referring Doctor directly into Lab's Referring Doctors directory
      if (referringDoctorName.trim() && referringDoctorName !== 'Self-Referred') {
        try {
          const docRefId = `doc-${referringDoctorName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const doctorDocRef = doc(db, 'labs', targetLabId, 'referringDoctors', docRefId);
          await setDoc(doctorDocRef, cleanFirestoreData({
            id: docRefId,
            name: referringDoctorName.trim(),
            specialty: referringSpecialty || 'General Medicine',
            hospital: referringHospital.trim() || 'Attending Practice',
            phone: referringDoctorPhone || '+237 670 000 000',
            status: 'active',
            licenseNumber: 'ONMC-CM-AUTH',
            referralCount: 1,
            lastReferralDate: timestamp,
            createdAt: timestamp,
            updatedAt: timestamp
          }), { merge: true });
        } catch (docErr) {
          console.warn('Syncing referring doctor note:', docErr);
        }
      }

      // 2. Prepare test items with lab-defined prices
      const formattedTests = selectedTests.map((t, idx) => {
        const assignedLabId = batchStrategy === 'split' ? (testLabAssignments[t.id] || targetLabId) : targetLabId;
        const assignedLabObj = availableLabs.find(l => l.id === assignedLabId) || targetLabObj;
        const testPrice = getLabTestPrice(t, assignedLabId);

        return {
          id: t.id || `test-${idx}-${Date.now()}`,
          testId: t.id || `t-${idx}`,
          testName: t.name || t.testName || 'Diagnostic Examination',
          code: t.code || 'TEST',
          category: t.category || 'General',
          price: testPrice,
          sampleType: t.sampleType || 'Venous Blood',
          sampleTypeRequired: t.sampleType || 'Venous Blood',
          labId: assignedLabId,
          labName: assignedLabObj.name,
          status: 'Pending_Validation',
          paid: false
        };
      });

      // 3. Save Booking to Firestore in target lab's bookings collection
      const bookingRecord = {
        bookingCode,
        invoiceNumber,
        labId: targetLabId,
        labName: targetLabObj.name,
        labLocation: targetLabObj.address,
        patientId: user?.id || `PAT-${Date.now().toString().slice(-5)}`,
        patientName: patientFullName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim(),
        patientEmployer: patientEmployer.trim() || 'Not Specified',
        hasInsurance,
        insuranceProvider: hasInsurance ? insuranceProvider : 'None',
        insurancePolicyNumber: hasInsurance ? insurancePolicyNumber.trim() : '',
        insuranceCoveragePercent: hasInsurance ? insuranceCoveragePercent : 0,
        insuranceCoveredAmount,
        patientCoPayAmount,
        referringDoctor: referringDoctorName.trim() || 'Self-Referred',
        referringHospital: referringHospital.trim() || 'Outpatient Clinic',
        referringDoctorPhone: referringDoctorPhone.trim(),
        referringSpecialty: referringSpecialty.trim(),
        referralNotes: referralNotes.trim(),
        appointmentDate,
        appointmentTime,
        sampleMode,
        homeAddress: sampleMode === 'home_collection' ? homeAddress : undefined,
        batchStrategy,
        tests: formattedTests,
        totalAmount: totalPrice,
        paymentStatus: 'unpaid',
        overallStatus: 'Pending_Validation',
        registrationType: 'online',
        isOnlineBooking: true,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await addDoc(collection(db, 'labs', targetLabId, 'bookings'), cleanFirestoreData(bookingRecord));

      // 4. Also register appointment document
      await addDoc(collection(db, 'labs', targetLabId, 'appointments'), cleanFirestoreData({
        title: selectedTests.length === 1 ? selectedTests[0].name : `${selectedTests.length} Laboratory Investigations`,
        bookingCode,
        doctorName: referringDoctorName.trim(),
        patientName: patientFullName.trim(),
        patientPhone: patientPhone.trim(),
        date: appointmentDate,
        time: appointmentTime,
        price: totalPrice,
        totalAmount: totalPrice,
        status: 'scheduled',
        paymentStatus: 'unpaid',
        location: targetLabObj.name,
        isOnlineBooking: true,
        createdAt: timestamp
      }));

      // Set booking complete ticket
      setBookingComplete({
        bookingCode,
        invoiceNumber,
        labName: targetLabObj.name,
        labLocation: targetLabObj.address,
        doctorName: referringDoctorName.trim(),
        appointmentDate,
        appointmentTime,
        patientName: patientFullName.trim(),
        totalPrice,
        insuranceCoveredAmount,
        patientCoPayAmount,
        tests: formattedTests,
        sampleMode,
        batchStrategy
      });

    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMessage(err.message || 'Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // SUCCESS SCREEN
  // --------------------------------------------------------------------------
  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header
          title="Booking Confirmed"
          subtitle="Your diagnostic appointment is synced directly with laboratory reception & cashiers"
          onNotificationPress={onNotificationPress}
          onProfilePress={onProfilePress}
        />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-black border border-teal-200 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> OFFICIAL NANOLABS BOOKING CONFIRMATION
              </span>
              <h2 className="text-2xl font-black text-slate-900 pt-2">Appointment Successfully Booked!</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your order is routed directly to the selected laboratory. Present your booking reference code upon arrival.
              </p>
            </div>

            {/* Official Booking Reference Ticket */}
            <div className="p-5 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-2xl text-white text-left space-y-4 shadow-lg border border-teal-800/40">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <div className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">BOOKING REFERENCE CODE</div>
                  <div className="font-mono text-2xl font-black tracking-widest text-white mt-0.5">
                    {bookingComplete.bookingCode}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">INVOICE NO.</div>
                  <div className="font-mono text-sm font-bold text-teal-200">{bookingComplete.invoiceNumber}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">DIAGNOSTIC FACILITY</div>
                  <div className="font-bold text-white mt-0.5">{bookingComplete.labName}</div>
                  <div className="text-[10px] text-teal-300">{bookingComplete.labLocation}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">DATE & TIME</div>
                  <div className="font-bold text-white mt-0.5">{bookingComplete.appointmentDate}</div>
                  <div className="text-[10px] text-teal-300">{bookingComplete.appointmentTime}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/10 pt-3">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">PRESCRIBING PHYSICIAN</div>
                  <div className="font-bold text-white mt-0.5">{bookingComplete.doctorName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">SAMPLE COLLECTION</div>
                  <div className="font-bold text-white mt-0.5 capitalize">
                    {bookingComplete.sampleMode === 'home_collection' ? 'Home Phlebotomy Dispatch' : 'Walk-in at Facility'}
                  </div>
                </div>
              </div>

              {/* Selected Tests */}
              <div className="border-t border-white/10 pt-3 space-y-1.5">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">
                  INVESTIGATIONS ({bookingComplete.tests.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bookingComplete.tests.map((t: any) => (
                    <span key={t.id} className="text-[11px] bg-white/10 px-2 py-0.5 rounded-md text-white font-medium">
                      {t.testName} ({t.price.toLocaleString()} XAF)
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  {bookingComplete.insuranceCoveredAmount > 0 ? 'Patient Co-Pay Balance:' : 'Total Amount Payable:'}
                </span>
                <span className="font-mono text-base font-extrabold text-teal-300">
                  {(bookingComplete.insuranceCoveredAmount > 0 
                    ? bookingComplete.patientCoPayAmount 
                    : bookingComplete.totalPrice
                  ).toLocaleString()} XAF
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setBookingComplete(null);
                  if (onSuccess) onSuccess();
                  else if (onBack) onBack();
                }}
                className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
              >
                Return to Patient Dashboard
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Receipt className="w-4 h-4" /> Print Booking Slip
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Filter tests for Step 1
  const filteredCatalog = catalog.filter(t => {
    const term = testSearch.toLowerCase().trim();
    const matchesSearch = !term ||
      t.name.toLowerCase().includes(term) ||
      (t.category || '').toLowerCase().includes(term) ||
      (t.sampleType || '').toLowerCase().includes(term) ||
      (t.aliases || []).some((a: string) => a.toLowerCase().includes(term));

    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        title="Book Diagnostic Laboratory Test"
        subtitle="Step-by-step test ordering, transparent lab pricing comparison & physician attribution"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        )}

        {/* ========================================================================= */}
        {/* PROGRESS STEPPER HEADER (Strict 3-Step Separation)                       */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="grid grid-cols-3 gap-2">
            {[
              { num: 1, title: 'Test Selection', desc: 'Catalog & Required Sample' },
              { num: 2, title: 'Laboratory & Pricing', desc: 'Partner Labs & Comparison' },
              { num: 3, title: 'Doctor & Patient Details', desc: 'Prescriber & Insurance' }
            ].map(s => {
              const isCurrent = currentStep === s.num;
              const isDone = currentStep > s.num;
              return (
                <div
                  key={s.num}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    isCurrent 
                      ? 'bg-teal-50 border border-teal-200' 
                      : isDone 
                      ? 'bg-slate-50 border border-slate-200/60' 
                      : 'opacity-60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCurrent 
                      ? 'bg-teal-600 text-white shadow-xs' 
                      : isDone 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className={`text-xs font-bold truncate ${isCurrent ? 'text-teal-950' : 'text-slate-800'}`}>
                      {s.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
            <X className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: TEST SELECTION ONLY (STRICT SEPARATION - NO PRICES SHOWN)          */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            {/* Top Info Banner on Pricing Policy */}
            <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
              <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Transparent Laboratory Pricing Model:</span>
                <p className="text-teal-800 mt-0.5 leading-relaxed">
                  Diagnostic test prices are set individually by certified partner laboratories, not by nanoLabs. 
                  Select your required investigations below, then click <strong>Next</strong> to view authentic pricing, distances, and turnaround times from accredited laboratories in your city.
                </p>
              </div>
            </div>

            {/* Actions Bar: Search + Category Selector + Prescription Scanner */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search diagnostic tests (e.g. NFS, Glycémie, Bilan Lipidique, Widal, Paludisme)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {testSearch && (
                    <button 
                      onClick={() => setTestSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* AI Prescription Scanner Trigger */}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Scan Doctor's Prescription</span>
                </button>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                {['All', ...OFFICIAL_CATEGORIES].map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Test Catalog Grid: Displays ONLY Test Name, Category, Required Sample Type (NO PRICES) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredCatalog.map(test => {
                const isSelected = selectedTests.some(t => t.id === test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => toggleSelectTest(test)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-500 shadow-sm ring-1 ring-teal-500'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold text-slate-900 leading-snug">
                          {test.name}
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-teal-600 text-white' : 'border border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold">
                          {test.category}
                        </span>
                      </div>
                    </div>

                    {/* Required Sample Type ONLY - NO PRICES */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Required Sample:</span>
                      <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                        {test.sampleType || 'Venous Blood'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Action Tray: Selection Counter + Mandatory Next Button */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  {selectedTests.length} test{selectedTests.length === 1 ? '' : 's'} selected
                </span>
                <p className="text-[11px] text-slate-500">
                  {selectedTests.length === 0 
                    ? 'Select at least one diagnostic test to proceed to laboratory selection.' 
                    : 'Next step: Select laboratory facility & view official prices.'}
                </p>
              </div>

              <button
                type="button"
                disabled={selectedTests.length === 0}
                onClick={() => {
                  setErrorMessage('');
                  setCurrentStep(2);
                }}
                className={`min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedTests.length > 0
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Next: Select Laboratory & Compare Pricing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: LABORATORY SELECTION & PRICE COMPARISON (BATCH TESTING OPTIONS)    */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Batch Testing Strategy Selector */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" /> Batch Testing Strategy
                  </h3>
                  <p className="text-xs text-slate-500">Choose how your tests are routed and fulfilled</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  {
                    id: 'single',
                    title: 'Single Laboratory',
                    desc: 'Run all tests at one certified facility'
                  },
                  {
                    id: 'split',
                    title: 'Split Across Laboratories',
                    desc: 'Assign different tests to different partner labs'
                  },
                  {
                    id: 'compare',
                    title: 'Dual-Lab Quality Comparison',
                    desc: 'Run identical tests at 2 labs for clinical cross-check'
                  }
                ].map(strat => {
                  const isActive = batchStrategy === strat.id;
                  return (
                    <button
                      key={strat.id}
                      type="button"
                      onClick={() => setBatchStrategy(strat.id as any)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isActive 
                          ? 'bg-teal-50/80 border-teal-500 ring-1 ring-teal-500' 
                          : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                        <span>{strat.title}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">{strat.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Mode: Test-by-Test Lab Assignor */}
            {batchStrategy === 'split' && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Split className="w-4 h-4 text-teal-600" /> Assign Individual Tests to Partner Laboratories
                  </div>
                  <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-medium">
                    Optimized Multi-Lab Routing
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedTests.map(t => {
                    const assignedLabId = testLabAssignments[t.id] || selectedPrimaryLabId;
                    const price = getLabTestPrice(t, assignedLabId);
                    return (
                      <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-slate-900">{t.name}</span>
                          <span className="text-[10px] text-slate-500 ml-2">({t.sampleType})</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={assignedLabId}
                            onChange={(e) => setTestLabAssignments({ ...testLabAssignments, [t.id]: e.target.value })}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500"
                          >
                            {availableLabs.map(l => (
                              <option key={l.id} value={l.id}>
                                {l.name} ({l.city} - {getLabTestPrice(t, l.id).toLocaleString()} XAF)
                              </option>
                            ))}
                          </select>

                          <div className="font-mono text-xs font-bold text-teal-800 min-w-[75px] text-right">
                            {price.toLocaleString()} XAF
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compare Mode: Secondary Lab Picker */}
            {batchStrategy === 'compare' && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Select Comparison Laboratory
                </div>
                <p className="text-xs text-slate-500">
                  The selected tests will be analyzed independently at both facilities. You receive separate validated reports to cross-check results.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {availableLabs.filter(l => l.id !== selectedPrimaryLabId).map(l => (
                    <div
                      key={l.id}
                      onClick={() => setComparisonLabId(l.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        comparisonLabId === l.id 
                          ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">{l.name}</div>
                      <div className="text-[11px] text-slate-500">{l.address} &bull; {l.tatDisplay}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Partner Laboratories Comparison Cards with Real Pricing, Distance, TAT & Logos */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Accredited Partner Facilities ({availableLabs.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {availableLabs.map(labItem => {
                  const isPrimary = selectedPrimaryLabId === labItem.id;
                  const totalPrice = selectedTests.reduce((sum, t) => sum + getLabTestPrice(t, labItem.id), 0);

                  return (
                    <div
                      key={labItem.id}
                      onClick={() => setSelectedPrimaryLabId(labItem.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isPrimary
                          ? 'bg-white border-teal-500 shadow-md ring-2 ring-teal-500/30'
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Lab Header: Verified Logo + Name & Rating */}
                        <div className="flex items-start gap-3">
                          <img
                            src={labItem.logoUrl || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=128&auto=format&fit=crop&q=80'}
                            alt={labItem.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                            onError={(e: any) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=128&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                                {labItem.name}
                              </h4>
                              {isPrimary && (
                                <span className="px-2 py-0.5 bg-teal-600 text-white rounded-md text-[10px] font-bold shrink-0">
                                  Selected
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{labItem.district}, {labItem.city}</span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {labItem.rating}
                              </span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                                CEMAC Accredited
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Distance & TAT Indicators */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400">Turnaround:</span>
                            <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-teal-600" /> {labItem.tatDisplay}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Sample Pickup:</span>
                            <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                              <Truck className="w-3 h-3 text-teal-600" /> Available
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lab Specific Pricing for Selected Tests */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {selectedTests.length} test{selectedTests.length === 1 ? '' : 's'} total
                          </div>
                          <div className="text-xs font-mono font-black text-slate-900">
                            {totalPrice.toLocaleString()} XAF
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedPrimaryLabId(labItem.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isPrimary
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isPrimary ? 'Chosen Facility' : 'Select Facility'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Nav: Back & Next Button */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="min-h-[44px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Test Selection</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Total</div>
                  <div className="text-base font-mono font-black text-teal-900">
                    {calculateTotalBookingPrice().toLocaleString()} XAF
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setCurrentStep(3);
                  }}
                  className="min-h-[44px] px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  <span>Next: Doctor & Patient Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: REFERRING DOCTOR SELECTION & PATIENT IDENTITY / INSURANCE SETUP   */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. Referring Doctor Selection (Searchable Card Dropdown + Manual Type) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600" /> Prescribing / Referring Physician Selection
                </h3>
                <span className="text-[11px] bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-medium border border-teal-200/60">
                  Auto-Sync to Lab Directory
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Select an accredited partner doctor or manually type your referring doctor's details. 
                Upon booking confirmation, this data syncs directly to the Laboratory Admin's <em>'Partner/Referring Doctors'</em> database.
              </p>

              {/* Integrated Searchable Card Dropdown */}
              <DoctorCardSelect
                value={referringDoctorName}
                hospitalValue={referringHospital}
                onChange={(name, hospital, doctorObj) => {
                  setReferringDoctorName(name);
                  if (hospital) setReferringHospital(hospital);
                  if (doctorObj) {
                    if (doctorObj.specialty) setReferringSpecialty(doctorObj.specialty);
                    if (doctorObj.phone) setReferringDoctorPhone(doctorObj.phone);
                  }
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Doctor Specialty (Optional)
                  </label>
                  <input
                    type="text"
                    value={referringSpecialty}
                    onChange={(e) => setReferringSpecialty(e.target.value)}
                    placeholder="e.g. Internal Medicine, Pediatrics, Cardiology"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Doctor Direct Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={referringDoctorPhone}
                    onChange={(e) => setReferringDoctorPhone(e.target.value)}
                    placeholder="+237 6XX XX XX XX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Patient Identity Setup (No Permanent Lab Affiliation, +237 Default) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" /> Patient Identity & Contact Details
                </h3>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                  Independent Digital Booklet
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={patientFullName}
                    onChange={(e) => setPatientFullName(e.target.value)}
                    placeholder="e.g. Jean-Paul Mbida"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Phone (Default +237) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+237 6XX XX XX XX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address (For PDF Reports)
                  </label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="e.g. patient@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Patient Employer Name
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={patientEmployer}
                      onChange={(e) => setPatientEmployer(e.target.value)}
                      placeholder="e.g. MTN Cameroon, Eneo, Orange, Self-Employed"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sample Collection Mode Toggle */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">Sample Collection Preference</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSampleMode('walk_in')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      sampleMode === 'walk_in'
                        ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                      <span>Walk-in at Laboratory Facility</span>
                      {sampleMode === 'walk_in' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Visit the facility at your scheduled time</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSampleMode('home_collection')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      sampleMode === 'home_collection'
                        ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-teal-600" /> Home Phlebotomist Dispatch
                      </span>
                      {sampleMode === 'home_collection' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Certified phlebotomist collects samples at your door</div>
                  </button>
                </div>

                {sampleMode === 'home_collection' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Home Dispatch Address & Landmark <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder="e.g. Akwa, Douala, Rue des Palmiers, face Immeuble Ecobank"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferred Time Slot</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="07:30 AM">07:30 AM (Early Fasting Blood Draw)</option>
                    <option value="08:30 AM">08:30 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM (Afternoon Slot)</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Employer & Insurance Setup (Auto-transfers to Lab upon booking) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-teal-600" /> Direct Insurance & Third-Party Payer Setup
                </h3>
                <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-medium">
                  Auto-transferred to Cashier
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Insurance Provider
                  </label>
                  <select
                    value={insuranceProvider}
                    onChange={(e) => setInsuranceProvider(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="None / Direct Cashier">None / Self-Pay (Cash / MoMo)</option>
                    <option value="ASCOMA Assurances">ASCOMA Assurances</option>
                    <option value="SAHAM / Sanlam Cameroun">SAHAM / Sanlam Assurance</option>
                    <option value="AXA Assurances Cameroun">AXA Assurances Cameroun</option>
                    <option value="Activa Assurances">Activa Assurances</option>
                    <option value="Chanas Assurances">Chanas Assurances</option>
                    <option value="Zenithe Insurance">Zenithe Insurance</option>
                    <option value="Beneficial Life Insurance">Beneficial Life Insurance</option>
                    <option value="Area Assurances">Area Assurances</option>
                  </select>
                </div>

                {insuranceProvider !== 'None / Direct Cashier' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Policy / Matricule Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={insurancePolicyNumber}
                        onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                        placeholder="e.g. ASC-2026-8921"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Coverage Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={insuranceCoveragePercent}
                        onChange={(e) => setInsuranceCoveragePercent(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Financial Co-Pay Summary */}
              {insuranceProvider !== 'None / Direct Cashier' && insurancePolicyNumber && (
                <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-200 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Total Lab Value</div>
                    <div className="font-mono text-xs font-bold text-slate-900">
                      {calculateTotalBookingPrice().toLocaleString()} XAF
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-teal-700 uppercase font-medium">Insurer Covered ({insuranceCoveragePercent}%)</div>
                    <div className="font-mono text-xs font-bold text-teal-800">
                      {Math.round(calculateTotalBookingPrice() * (insuranceCoveragePercent / 100)).toLocaleString()} XAF
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-indigo-700 uppercase font-medium">Patient Co-Pay ({100 - insuranceCoveragePercent}%)</div>
                    <div className="font-mono text-xs font-bold text-indigo-950">
                      {(calculateTotalBookingPrice() - Math.round(calculateTotalBookingPrice() * (insuranceCoveragePercent / 100))).toLocaleString()} XAF
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation & Submit Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="min-h-[44px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Lab & Pricing</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmBooking}
                className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-900/15 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Order to Laboratory...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Laboratory Booking ({calculateTotalBookingPrice().toLocaleString()} XAF)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Real Camera AI Prescription Scanner Modal */}
      <AiPrescriptionScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProceedWithTests={handleProceedFromScanner}
      />
    </div>
  );
};

export default BookAppointmentScreen;
