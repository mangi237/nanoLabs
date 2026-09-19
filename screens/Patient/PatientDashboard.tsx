import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
import PatientActivityAuditModal from '../../components/medical/PatientActivityAuditModal';
import MedicalBookletModal from '../../components/medical/MedicalBookletModal';
import BatchConsolidatedReportModal from '../../components/patient/BatchConsolidatedReportModal';
import { MedicalReceiptModal } from '../../components/common/MedicalReceiptModal';
import { SealedEnvelopeResultModal } from '../../components/common/SealedEnvelopeResultModal';
import { FamilyProfileSwitcherModal } from '../../components/common/FamilyProfileSwitcherModal';
// import { dispatchDatabaseFetchError } from '../../utils/databaseErrorBus';
import { AiPrescriptionScannerModal } from '../../components/common/AiPrescriptionScannerModal';
import { LivePhlebotomistTrackingModal } from '../../components/patient/LivePhlebotomistTrackingModal';
import { DoctorAppointmentDetailModal, DoctorAppointmentRecord } from '../../components/doctor/DoctorAppointmentDetailModal';
import { LiveAuditRoadmapModal } from '../../components/patient/LiveAuditRoadmapModal';
import { 
  Calendar, 
  FileText, 
  Share2, 
  Camera,
  Truck,
  Navigation,
  MapPin,
  Plus, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Activity, 
  TestTube,
  DollarSign,
  Building2,
  ShieldCheck,
  Eye,
  Lock,
  Receipt,
  Printer,
  ChevronDown,
  ChevronUp,
  Mail,
  Stethoscope,
  Sparkles,
  Search,
  ExternalLink,
  Laptop,
  Shield,
  CreditCard,
  Users,
  Home,
  BookOpen,
  User
} from 'lucide-react';

interface PatientDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onSelectTest?: (test: any) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onNavigateTab,
  onNotificationPress,
  onProfilePress,
  onSelectTest
}) => {
  const { user, lab } = useAuth();
  const { t } = useLanguage();
  const [tests, setTests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [patientRecordId, setPatientRecordId] = useState<string>(user?.id || 'pat-1');
  const [patientFullName, setPatientFullName] = useState<string>(user?.name || 'Patient Record');
  const [patientDocData, setPatientDocData] = useState<any>(null);
  const [activeFamilyProfile, setActiveFamilyProfile] = useState<any | null>(null);
  
  // Modals
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showBookletModal, setShowBookletModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [batchReportBooking, setBatchReportBooking] = useState<PatientBooking | null>(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState<PatientBooking | null>(null);
  const [envelopeModalTest, setEnvelopeModalTest] = useState<any | null>(null);
  
  // Design Reference Modals (from UI screenshots)
  const [showPrescriptionScannerModal, setShowPrescriptionScannerModal] = useState(false);
  const [showPhlebTransitModal, setShowPhlebTransitModal] = useState(false);
  const [showAppointmentDetailModal, setShowAppointmentDetailModal] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeScheduleRecord, setActiveScheduleRecord] = useState<DoctorAppointmentRecord>({
    id: 'RSV-10102',
    reservationCode: 'RSV10102',
    doctorName: 'Dr. Lisa Tran',
    specialty: 'Clinical Diagnostic Consult & ENT',
    facilityName: 'Centre Médical Laquintinie',
    distanceKm: '1.2 km',
    rating: 4.9,
    reviewsCount: 120,
    address: 'Boulevard de la Liberté, Akwa, Douala',
    treatmentName: 'Comprehensive Diagnostic Follow-up & Lab Review',
    treatmentCategory: 'SINGLE',
    durationHours: 1,
    clinicalNote: 'Patient presenting with recurrent asthenia, fever, and abnormal complete blood count profile.',
    date: 'Jun 15, 2026',
    time: '10:00 AM',
    status: 'Registered',
    mode: 'in_person',
    billAmount: 35000,
    copayAmount: 7000,
    paymentStatus: 'Paid'
  });
  
  // UI State
  const [activeSegmentTab, setActiveSegmentTab] = useState<'tests' | 'receipts'>('tests');
  const [testStatusFilter, setTestStatusFilter] = useState<'all' | 'completed' | 'in_testing'>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    let unsubBookings: (() => void) | null = null;

    const initDashboardData = async () => {
      setLoading(true);
      const targetLabId = lab?.id || 'lab-1';
      try {
        // 1. Fetch Patient Document
        const snap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
        const found = snap.docs.find(d => {
          const data = d.data();
          const dEmail = (data.email || '').trim().toLowerCase();
          const uEmail = (user?.email || '').trim().toLowerCase();
          const dPhone = (data.phone || '').replace(/\D/g, '');
          const uPhone = (user?.phone || '').replace(/\D/g, '');
          const dCode = (data.accessCode || '').trim().toUpperCase();
          const uCode = (user?.accessCode || (user as any)?.passcode || '').trim().toUpperCase();
          const dPid = (data.patientId || '').trim().toUpperCase();
          const uPid = (user?.patientId || (user as any)?.pid || '').trim().toUpperCase();
          const dName = (data.name || '').trim().toLowerCase();
          const uName = (user?.name || '').trim().toLowerCase();

          if (d.id === user?.id) return true;
          if (uPid && (dPid === uPid || d.id.toUpperCase() === uPid)) return true;
          if (uCode && dCode && dCode === uCode) return true;
          if (uEmail && dEmail && !uEmail.includes('@nanolabs.cm') && dEmail === uEmail) return true;
          if (uPhone && dPhone && uPhone.length >= 7 && dPhone === uPhone) return true;
          if (uName && dName && uName.length >= 3 && dName === uName && !['patient', 'valued patient', 'guest', 'user'].includes(uName)) {
            return true;
          }
          return false;
        });

        let loadedDocData: any = null;
        if (found) {
          setPatientRecordId(found.id);
          const data = found.data();
          loadedDocData = { id: found.id, ...data };
          setPatientDocData(loadedDocData);
          setPatientFullName(data.name || user?.name || 'Patient Record');
          if (data.labTests && Array.isArray(data.labTests)) {
            setTests(data.labTests);
          } else {
            setTests([]);
          }
        } else {
          setPatientDocData(null);
          setTests([]);
        }

        // 2. Initial fetch of central LIMS bookings scoped to this patient
        const allBookings = await limsService.fetchAllBookings(targetLabId);
        const myBookings = filterPatientBookings(allBookings, loadedDocData, user);
        setBookings(myBookings);
        if (myBookings.length > 0) {
          setExpandedBookingId(myBookings[0].id);
        }

        // 3. Real-time subscription with resolved patient document
        unsubBookings = limsService.subscribeToBookings(targetLabId, (liveBookings) => {
          const filtered = filterPatientBookings(liveBookings, loadedDocData, user);
          setBookings(filtered);
        });
      } catch (e) {
        console.error('Error fetching patient data:', e);
       
      } finally {
        setLoading(false);
      }
    };

    initDashboardData();

    return () => {
      if (unsubBookings) {
        unsubBookings();
      }
    };
  }, [user?.id, user?.email, user?.accessCode, (user as any)?.patientId, lab?.id]);

  const filterPatientBookings = (allBookings: PatientBooking[], patDoc: any, currentUser: any, activeProfile?: any) => {
    // If a specific sub-profile / family member is selected (not Self), filter by that member
    if (activeProfile && activeProfile.relationship !== 'Self') {
      const targetName = (activeProfile.name || '').trim().toLowerCase();
      const targetId = (activeProfile.id || '').trim().toLowerCase();
      return allBookings.filter(b => {
        const bName = String(b.patientName || '').trim().toLowerCase();
        const bPid = String(b.patientId || b.patientPid || '').trim().toLowerCase();
        if (targetId && (bPid === targetId || b.id === targetId)) return true;
        if (targetName && bName && bName === targetName) return true;
        return false;
      });
    }

    const validIds = [
      currentUser?.id,
      (currentUser as any)?.patientId,
      (currentUser as any)?.pid,
      patDoc?.id,
      patDoc?.patientId
    ].filter(Boolean).map(id => String(id).trim().toLowerCase());

    const userEmail = (currentUser?.email || patDoc?.email || '').trim().toLowerCase();
    const userPhone = (currentUser?.phone || patDoc?.phone || '').replace(/\D/g, '');
    const userName = (currentUser?.name || patDoc?.name || '').trim().toLowerCase();
    const genericNames = ['patient', 'valued patient', 'guest', 'user', 'unknown', '', 'clinical staff', 'internal staff'];

    return allBookings.filter(b => {
      const bPatientId = String(b.patientId || '').trim().toLowerCase();
      const bPatientPid = String(b.patientPid || '').trim().toLowerCase();
      const bEmail = String(b.patientEmail || '').trim().toLowerCase();
      const bPhone = String(b.patientPhone || '').replace(/\D/g, '');
      const bName = String(b.patientName || '').trim().toLowerCase();

      // 1. Direct Primary ID Match
      if (validIds.length > 0) {
        if (bPatientId && validIds.includes(bPatientId)) return true;
        if (bPatientPid && validIds.includes(bPatientPid)) return true;
      }

      // 2. Email Match
      if (userEmail && bEmail && userEmail === bEmail && !userEmail.includes('@nanolabs.cm')) {
        if (!bPatientId || validIds.length === 0 || validIds.includes(bPatientId)) {
          return true;
        }
      }

      // 3. Phone Match
      if (userPhone && bPhone && userPhone.length >= 7 && userPhone === bPhone) {
        if (!bPatientId || validIds.length === 0 || validIds.includes(bPatientId)) {
          return true;
        }
      }

      // 4. Exact Name Match
      if (userName && bName && userName.length >= 3 && !genericNames.includes(userName) && userName === bName) {
        if (!bPatientId || validIds.length === 0 || validIds.includes(bPatientId)) {
          return true;
        }
      }

      return false;
    });
  };

  const handleRequestVirtual = async (e: React.MouseEvent, testItem: any) => {
    e.stopPropagation();
    setRequestingId(testItem.id);
    try {
      const targetLabId = lab?.id || 'lab-1';
      await limsService.requestVirtualResult(
        targetLabId,
        undefined,
        testItem.id,
        {
          id: user?.id || patientRecordId,
          email: user?.email,
          accessCode: user?.accessCode,
          name: user?.name || patientFullName
        }
      );
    } catch (err) {
      console.error('Error requesting virtual result:', err);
    } finally {
      setRequestingId(null);
    }
  };

  // Calculations
  const totalSpentPaid = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const totalAllTestsCount = bookings.reduce((sum, b) => sum + (b.tests?.length || 0), 0);

  const completedBatchesCount = bookings.filter(b => 
    b.overallStatus === 'Completed' || b.tests?.every(t => t.status === 'Completed' || t.status === 'Ready_For_Pickup')
  ).length;

  const quickActionCards = [
    {
      id: 'book',
      label: 'Book New Test',
      desc: 'Schedule appointment or blood draw',
      icon: Calendar,
      color: 'bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-400',
      action: () => onNavigateTab ? onNavigateTab('book') : null
    },
    {
      id: 'history',
      label: 'Test History',
      desc: 'View all past diagnostic reports',
      icon: FileText,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400',
      action: () => onNavigateTab ? onNavigateTab('history') : null
    },
    {
      id: 'transit',
      label: 'Phlebotomist Transit',
      desc: 'Live GPS & Cold-Chain Tracking',
      icon: Truck,
      color: 'bg-slate-900 text-white border-slate-700 hover:border-teal-400',
      action: () => setShowPhlebTransitModal(true)
    },
    {
      id: 'scan',
      label: 'Scan Prescription',
      desc: 'Real device camera Rx scanner',
      icon: Camera,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400',
      action: () => setShowPrescriptionScannerModal(true)
    }
  ];

  // Active home phlebotomist pickup tracking
  const activeHomePickupBooking = bookings.find(b => 
    (b as any).sampleMode === 'home_collection' && 
    ((b.overallStatus as any) === 'Sample_Collected' || 
     (b.overallStatus as any) === 'In_Transit' || 
     (b as any).status === 'In_Transit' || 
     (b.overallStatus as any) === 'Sample Picked Up / En Route to Lab' || 
     (b.overallStatus as any) === 'Pending_Validation')
  );

  const filteredBookings = bookings.filter(b => {
    const isCompleted = b.overallStatus === 'Completed' || 
      (b.tests && b.tests.length > 0 && b.tests.every(t => t.status === 'Completed' || t.status === 'Ready_For_Pickup'));
    
    if (testStatusFilter === 'completed' && !isCompleted) return false;
    if (testStatusFilter === 'in_testing' && isCompleted) return false;

    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      (b.bookingCode || '').toLowerCase().includes(q) ||
      (b.doctorName || '').toLowerCase().includes(q) ||
      b.tests?.some(t => (t.testName || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Header
        title="Patient Medical Portal"
        subtitle="View, download, and share your diagnostic lab results"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
        
        {/* Patient Welcome Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                Patient Account
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {user?.patientId || patientRecordId}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {patientFullName}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Diagnostic Center: <strong className="text-slate-800">{lab?.name || 'nanoLabs Central Diagnostics'}</strong></span>
            </p>

            {patientDocData?.hasInsurance && (
              <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Insurance: {patientDocData.insuranceProvider || 'HMO Policy'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px]">
                  <span>No: {patientDocData.insurancePolicyNumber || 'INS-VERIFIED'}</span>
                  <span className="text-indigo-600 font-bold">({patientDocData.insuranceCoveragePercent || 80}% Covered)</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowFamilyModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
              title="Switch between family members and child accounts"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Family Accounts ({user?.familyProfiles?.length || 1})</span>
            </button>

            <button
              onClick={() => onNavigateTab ? onNavigateTab('book') : null}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={() => setShowBookletModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Medical Booklet</span>
            </button>

            <button
              onClick={() => setShowAuditModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
              title="View who accessed your records"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Audit Log</span>
            </button>
          </div>
        </div>

        {/* 4 Core Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActionCards.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={card.action || undefined}
                className={`text-left p-5 rounded-2xl border bg-white shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-3 group cursor-pointer ${card.color}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-10 h-10 rounded-xl bg-white/90 border border-slate-200/80 flex items-center justify-center shadow-2xs">
                    <Icon className="w-5 h-5 text-slate-800 group-hover:scale-110 transition-transform" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{card.label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{card.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Select Diagnostic Category (from patientdashboarduireference.webp) */}
        {/* <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Select Category</span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                LIMS Accredited
              </span>
            </h3>
            <button 
              onClick={() => onNavigateTab ? onNavigateTab('book') : null}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 transition cursor-pointer"
            >
              See All
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'All', label: 'All Panels', icon: '🧪' },
              { id: 'Pediatrics', label: 'Pediatrics', icon: '👶' },
              { id: 'Cardiology', label: 'Cardiology', icon: '🫀' },
              { id: 'Hematology', label: 'Hematology', icon: '🩸' },
              { id: 'Neurology', label: 'Neurology', icon: '🧠' },
              { id: 'Oncology', label: 'Oncology', icon: '🎗️' },
              { id: 'Gynecology', label: 'Gynecology', icon: '🤰' },
              { id: 'Radiology', label: 'Radiology', icon: '🩻' },
              { id: 'ENT', label: 'ENT', icon: '👂' },
              { id: 'Dentistry', label: 'Dentistry', icon: '🦷' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div> */}

        {/* Your Upcoming Appointments Card (from patientdashboarduireference.webp) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-300">
                Your Upcoming Appointments
              </h3>
            </div>
            <span className="text-[11px] font-bold bg-teal-500/20 text-teal-200 px-2.5 py-1 rounded-full border border-teal-500/30">
              {activeScheduleRecord.date} &bull; {activeScheduleRecord.time}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white flex items-center justify-center font-black text-base shadow-lg">
                LT
              </div>
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{activeScheduleRecord.doctorName}</span>
                  <span className="text-amber-400 text-xs font-semibold">★ {activeScheduleRecord.rating}</span>
                </h4>
                <p className="text-xs text-slate-300">
                  {activeScheduleRecord.specialty} &bull; {activeScheduleRecord.facilityName}
                </p>
                <p className="text-[11px] text-teal-300 mt-0.5">
                  Treatment: {activeScheduleRecord.treatmentName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAppointmentDetailModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Schedule Detail
              </button>

              <button
                onClick={() => setShowRoadmapModal(true)}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors cursor-pointer"
              >
                Audit Roadmap
              </button>

              <button
                onClick={() => setShowPhlebTransitModal(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Track Phlebotomist
              </button>
            </div>
          </div>
        </div>

        {/* Status Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900">{completedBatchesCount}</div>
              <div className="text-[11px] text-slate-500 font-medium">Completed Batches</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <TestTube className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900">{totalAllTestsCount || tests.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Total Tests Ordered</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900">{totalSpentPaid.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">FCFA</span></div>
              <div className="text-[11px] text-slate-500 font-medium">Total Paid at Cashier</div>
            </div>
          </div>
        </div>

        {/* Phlebotomist Live GPS & Pickup Verification Card */}
        {activeHomePickupBooking && (
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white p-5 rounded-2xl border border-teal-500/30 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Live Phlebotomist Dispatch & Chain-of-Custody Tracking
                </span>
              </div>
              <span className="text-[10px] font-mono bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded border border-teal-500/40">
                Order #{activeHomePickupBooking.bookingCode}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Nurse Alain Kemajou</div>
                  <div className="text-[11px] text-teal-200/80">Accredited Phlebotomist &bull; Badge #PHL-237</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {(activeHomePickupBooking.overallStatus as any) === 'In_Transit' || (activeHomePickupBooking.overallStatus as any) === 'Sample Picked Up / En Route to Lab'
                      ? 'Sample Picked Up / En Route to Lab'
                      : 'Phlebotomist Dispatched to Address'}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {(activeHomePickupBooking.overallStatus as any) === 'In_Transit' || (activeHomePickupBooking.overallStatus as any) === 'Sample Picked Up / En Route to Lab'
                      ? 'Biochemical cold chain verified (4°C active cooler)'
                      : 'En route with sterile sampling kit'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-start md:justify-end gap-2">
                <span className="text-xs font-medium text-teal-200">
                  Destination: <strong className="text-white">{lab?.name || 'Central Laboratory'}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selector & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveSegmentTab('tests')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSegmentTab === 'tests'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <TestTube className="w-4 h-4" />
              <span>Diagnostic Test Batches</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeSegmentTab === 'tests' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSegmentTab('receipts')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSegmentTab === 'receipts'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Invoices & Receipts</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeSegmentTab === 'tests' && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setTestStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    testStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTestStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    testStatusFilter === 'completed'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  Completed ({completedBatchesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTestStatusFilter('in_testing')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    testStatusFilter === 'in_testing'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  In Progress ({bookings.length - completedBatchesCount})
                </button>
              </div>
            )}

            {activeSegmentTab === 'tests' && bookings.length > 1 && (
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search batches, tests..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: DIAGNOSTIC TEST BATCHES */}
        {activeSegmentTab === 'tests' && (
          <div className="space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => {
                const isPaid = booking.paymentStatus === 'paid';
                const isCompleted = booking.overallStatus === 'Completed' || 
                  (booking.tests && booking.tests.length > 0 && booking.tests.every(t => t.status === 'Completed' || t.status === 'Ready_For_Pickup'));
                const completedCount = booking.tests?.filter(t => t.status === 'Completed' || t.status === 'Ready_For_Pickup').length || 0;
                const totalTests = booking.tests?.length || 0;
                const isExpanded = expandedBookingId === booking.id;

                const formattedDate = booking.createdAt 
                  ? new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Recent Order';

                return (
                  <div
                    key={booking.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                      isCompleted 
                        ? 'border-emerald-300 shadow-xs' 
                        : 'border-slate-200 shadow-2xs'
                    }`}
                  >
                    {/* Batch Card Header */}
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left Side: Batch Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                            {booking.bookingCode}
                          </span>

                          {/* Distinct Completed / In Progress Badge */}
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Ready & Completed ({completedCount}/{totalTests} Tests)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>In Lab Testing ({completedCount}/{totalTests} Ready)</span>
                            </span>
                          )}

                          <span className="text-xs text-slate-500 font-medium">
                            {formattedDate}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                          {booking.doctorName && (
                            <span className="flex items-center gap-1 text-slate-700 font-medium">
                              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                              <span>Prescribed by: <strong>{booking.doctorName}</strong></span>
                            </span>
                          )}
                          <span className="text-slate-300">•</span>
                          <span>Facility: <strong>{booking.labName || lab?.name || 'Diagnostic Center'}</strong></span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono font-bold text-slate-800">
                            {(booking.totalAmount || 0).toLocaleString()} FCFA ({isPaid ? 'Paid' : 'Unpaid'})
                          </span>
                        </div>
                      </div>

                      {/* Right Side: Clean, Essential Batch Actions */}
                      <div className="flex items-center gap-2 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        
                        {/* 1. View & Print Official Consolidated Report */}
                        <button
                          type="button"
                          onClick={() => setBatchReportBooking(booking)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                          title="View and download complete signed report"
                        >
                          <Printer className="w-4 h-4" />
                          <span>View & Print Report</span>
                        </button>

                        {/* 2. Sealed Physical Envelope Experience */}
                        <button
                          type="button"
                          onClick={() => setEnvelopeModalTest(booking)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                          title="Open confidential digital envelope"
                        >
                          <Mail className="w-4 h-4 text-amber-300" />
                          <span>Sealed Envelope</span>
                        </button>

                        {/* 3. Share with Physician */}
                        {onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('share')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-200 transition-all cursor-pointer"
                            title="Share with your doctor"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Share</span>
                          </button>
                        )}

                        {/* 4. Receipt */}
                        <button
                          type="button"
                          onClick={() => setReceiptModalBooking(booking)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                          title="View receipt"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-600" />
                          <span className="hidden sm:inline">Receipt</span>
                        </button>

                        {/* Toggle Expand */}
                        <button
                          type="button"
                          onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer ml-1"
                          title={isExpanded ? 'Collapse tests' : 'View tests inside'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Individual Tests Table */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                        <div className="flex items-center justify-between pb-3">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Individual Tests ({booking.tests?.length || 0})
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Click any test row for details
                          </span>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                          <div className="divide-y divide-slate-100 text-xs">
                            {booking.tests?.map((test) => {
                              const isTestReady = test.status === 'Completed' || test.status === 'Ready_For_Pickup';
                              const hasTestPdf = Boolean(test.pdfReportUrl || test.externalPdfUrl || test.pdfUrl || test.fileUrl);
                              const testPdfLink = test.pdfReportUrl || test.externalPdfUrl || test.pdfUrl || test.fileUrl;

                              return (
                                <div
                                  key={test.id}
                                  onClick={() => onSelectTest ? onSelectTest(test) : null}
                                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer"
                                >
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-900 text-sm">
                                      {test.testName || test.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {test.category || 'Clinical Biology'} • {test.sampleTypeRequired || 'Blood sample'}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    {/* Test Result Indicator */}
                                    <div className="text-right">
                                      {test.resultValue ? (
                                        <div className="font-mono font-bold text-slate-900">
                                          {test.resultValue} {test.units || ''}
                                        </div>
                                      ) : isTestReady ? (
                                        <div className="text-xs font-semibold text-emerald-700">
                                          Analyzed & Signed
                                        </div>
                                      ) : (
                                        <div className="text-xs text-amber-700 font-medium">
                                          In Laboratory Analysis
                                        </div>
                                      )}
                                    </div>

                                    {/* Status Badge */}
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                      isTestReady
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {isTestReady ? 'Ready' : 'In Progress'}
                                    </span>

                                    {/* Per Test PDF or Virtual Request */}
                                    <div onClick={e => e.stopPropagation()}>
                                      {hasTestPdf ? (
                                        <a
                                          href={testPdfLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs border border-emerald-200 transition-all"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>PDF</span>
                                        </a>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={(e) => handleRequestVirtual(e, test)}
                                          disabled={requestingId === test.id || test.virtualRequested}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-[11px] transition-all cursor-pointer disabled:opacity-60"
                                        >
                                          <Laptop className="w-3 h-3 text-slate-500" />
                                          <span>{requestingId === test.id ? 'Requesting...' : test.virtualRequested ? 'Requested' : 'Digital PDF'}</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : tests.length > 0 ? (
              /* Fallback Direct Tests List */
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Diagnostic Tests ({tests.length})</h3>
                    <p className="text-xs text-slate-500">Your registered lab test entries</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBookletModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download All Results</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {tests.map(test => (
                    <div key={test.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{test.testName || test.name}</div>
                        <div className="text-xs text-slate-500">{test.category || 'General'}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {test.status || 'Results Ready'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 space-y-2">
                <TestTube className="w-10 h-10 mx-auto text-slate-300" />
                <h4 className="font-bold text-slate-800 text-sm">No test batches recorded yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you book laboratory tests, your test orders and ready reports will automatically appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVOICES & RECEIPTS */}
        {activeSegmentTab === 'receipts' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Invoices & Payment Receipts ({bookings.length})</h3>
                <p className="text-xs text-slate-500">View official receipts and payment statuses</p>
              </div>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('book') : null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Test</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {bookings.map((booking) => {
                const isPaid = booking.paymentStatus === 'paid';
                const formattedDate = booking.createdAt 
                  ? new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Recent';

                return (
                  <div key={booking.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                          {booking.bookingCode}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Invoice: {booking.invoiceNumber || 'INV-001'}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-600 font-medium">
                          {formattedDate}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        {booking.tests?.length || 0} Test(s): <span className="text-slate-500">{booking.tests?.map(t => t.testName).join(', ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900 font-mono">
                          {(booking.totalAmount || 0).toLocaleString()} FCFA
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                          {isPaid ? 'Paid at Cashier' : 'Payment Pending'}
                        </span>
                      </div>

                      <button
                        onClick={() => setReceiptModalBooking(booking)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Receipt</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {bookings.length === 0 && (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No payment receipts recorded yet</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Modern Mobile-First Sticky Bottom Navigation Bar */}
      <nav 
        id="patient-sticky-bottom-nav"
        aria-label="Patient Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-2 shadow-xl flex items-center justify-around md:hidden"
      >
        <button
          id="btn-nav-home"
          type="button"
          onClick={() => {
            setActiveSegmentTab('tests');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
            activeSegmentTab === 'tests' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          id="btn-nav-book"
          type="button"
          onClick={() => onNavigateTab ? onNavigateTab('book-appointment') : null}
          className="flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] text-teal-600 font-bold cursor-pointer group"
        >
          <div className="w-10 h-10 -mt-5 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30 group-hover:bg-teal-700 transition-all scale-105">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-teal-700 font-extrabold">Book Test</span>
        </button>

        <button
          id="btn-nav-booklet"
          type="button"
          onClick={() => setShowBookletModal(true)}
          className="flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold">Booklet</span>
        </button>

        <button
          id="btn-nav-family"
          type="button"
          onClick={() => setShowFamilyModal(true)}
          className="flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold">Family</span>
        </button>

        <button
          id="btn-nav-profile"
          type="button"
          onClick={() => onProfilePress?.()}
          className="flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>

      {/* Official Consolidated Batch Diagnostic Report Modal */}
      <BatchConsolidatedReportModal
        isOpen={Boolean(batchReportBooking)}
        onClose={() => setBatchReportBooking(null)}
        booking={batchReportBooking}
        labInfo={lab}
        patientInfo={{
          id: patientRecordId,
          patientId: patientRecordId,
          name: patientFullName,
          fullName: patientFullName,
          email: user?.email,
          phone: user?.phone
        }}
        onShareToDoctor={() => {
          setBatchReportBooking(null);
          if (onNavigateTab) onNavigateTab('share');
        }}
      />

      {/* Medical Booklet Modal */}
      <MedicalBookletModal
        isOpen={showBookletModal}
        onClose={() => setShowBookletModal(false)}
        patient={{
          id: patientRecordId,
          patientId: patientDocData?.patientId || patientRecordId,
          patientPid: patientDocData?.patientId || patientRecordId,
          name: patientFullName,
          fullName: patientFullName,
          email: patientDocData?.email || user?.email,
          phone: patientDocData?.phone || user?.phone,
          accessCode: patientDocData?.accessCode || user?.accessCode,
          gender: patientDocData?.gender || user?.gender || 'Male',
          age: patientDocData?.age || user?.age || 32,
          bloodType: patientDocData?.bloodType || patientDocData?.bloodGroup || user?.bloodGroup || 'O+',
          insuranceProvider: patientDocData?.insuranceProvider || 'Self-Pay / Cash',
          allergies: patientDocData?.allergies || 'None reported',
          labTests: tests
        }}
        lab={lab}
      />

      {/* Patient Access Audit Trail Modal */}
      <PatientActivityAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        patient={{
          id: patientRecordId,
          patientId: patientDocData?.patientId || patientRecordId,
          patientPid: patientDocData?.patientId || patientRecordId,
          patientCode: patientDocData?.patientId || patientRecordId,
          name: patientFullName,
          fullName: patientFullName,
          email: patientDocData?.email || user?.email,
          phone: patientDocData?.phone || user?.phone,
          accessCode: patientDocData?.accessCode || user?.accessCode
        }}
        labId={lab?.id || 'lab-1'}
        labName={lab?.name || 'nanoLabs Diagnostic Facility'}
      />

      {/* Official Itemized Medical Receipt Modal */}
      <MedicalReceiptModal
        isOpen={Boolean(receiptModalBooking)}
        onClose={() => setReceiptModalBooking(null)}
        booking={receiptModalBooking}
        labInfo={lab}
      />

      {/* Sealed Physical Envelope Digital Experience Modal */}
      <SealedEnvelopeResultModal
        isOpen={Boolean(envelopeModalTest)}
        onClose={() => setEnvelopeModalTest(null)}
        booking={envelopeModalTest}
        test={envelopeModalTest}
        tests={envelopeModalTest?.tests}
        labName={lab?.name || 'nanoLabs Diagnostic Facility'}
        doctorName={envelopeModalTest?.doctorName || 'Dr. Attending Physician / Clinician'}
        patientName={envelopeModalTest?.patientName || patientFullName}
        patientPid={envelopeModalTest?.patientPid || patientDocData?.patientId || patientRecordId}
        patientGender={patientDocData?.gender || user?.gender}
        patientAge={patientDocData?.age || user?.age}
        patientPhone={patientDocData?.phone || user?.phone}
        onOpenPdf={() => {
          setBatchReportBooking(envelopeModalTest);
          setEnvelopeModalTest(null);
        }}
      />

      {/* Family & Dependent Profile Switcher Modal */}
      <FamilyProfileSwitcherModal
        isOpen={showFamilyModal}
        onClose={() => setShowFamilyModal(false)}
        onProfileSwitched={async (profile) => {
          setActiveFamilyProfile(profile);
          setPatientFullName(profile.name);
          try {
            const targetLabId = lab?.id || 'lab-1';
            const allBookings = await limsService.fetchAllBookings(targetLabId);
            const filtered = filterPatientBookings(allBookings, patientDocData, user, profile);
            setBookings(filtered);
          } catch (e) {
            console.error('Error switching family profile view:', e);
          }
        }}
      />

      {/* AI Prescription Scanner Modal (Aligned with nanoaiscannerui.webp) */}
      <AiPrescriptionScannerModal
        isOpen={showPrescriptionScannerModal}
        onClose={() => setShowPrescriptionScannerModal(false)}
        onProceedWithTests={(_selected, _detectedDoctor) => {
          setShowPrescriptionScannerModal(false);
          if (onNavigateTab) {
            onNavigateTab('book');
          }
        }}
      />

      {/* Live Phlebotomist Tracking & Handover Modal (Aligned with livephlebtracking.webp) */}
      <LivePhlebotomistTrackingModal
        isOpen={showPhlebTransitModal}
        onClose={() => setShowPhlebTransitModal(false)}
        batchId={activeHomePickupBooking?.id || 'BAT-2026-081'}
        batchNumber={activeHomePickupBooking?.bookingCode || 'BAT-2026-081'}
        patientName={patientFullName}
        onSampleIntakeCompleted={() => {
          setShowPhlebTransitModal(false);
          setShowRoadmapModal(true);
        }}
      />

      {/* Doctor Appointment Schedule Detail Modal (Aligned with doctorAppointmentui.webp) */}
      <DoctorAppointmentDetailModal
        isOpen={showAppointmentDetailModal}
        onClose={() => setShowAppointmentDetailModal(false)}
        appointment={activeScheduleRecord}
        onRescheduleSuccess={(updated) => setActiveScheduleRecord(updated)}
      />

      {/* Live Audit Roadmap Modal (Aligned with auditingandtrackingstatus.webp) */}
      <LiveAuditRoadmapModal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)}
      />

      {/* Sticky Bottom Mobile Navigation Bar (Mobile-App-First UX) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveSegmentTab('tests')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer ${
            activeSegmentTab === 'tests' ? 'text-teal-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => onNavigateTab ? onNavigateTab('book') : null}
          className="flex flex-col items-center gap-1 py-1 px-2 text-slate-500 hover:text-teal-600 rounded-lg cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px]">Book Test</span>
        </button>

        <button
          onClick={() => onNavigateTab ? onNavigateTab('scan') : null}
          className="flex flex-col items-center gap-1 py-1 px-2 text-slate-500 hover:text-teal-600 rounded-lg cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span className="text-[10px]">Scan Rx</span>
        </button>

        <button
          onClick={() => setShowBookletModal(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 text-slate-500 hover:text-teal-600 rounded-lg cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px]">Booklet</span>
        </button>

        <button
          onClick={() => setActiveSegmentTab('receipts')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer ${
            activeSegmentTab === 'receipts' ? 'text-teal-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span className="text-[10px]">Receipts</span>
        </button>
      </nav>
    </div>
  );
};

export default PatientDashboard;
