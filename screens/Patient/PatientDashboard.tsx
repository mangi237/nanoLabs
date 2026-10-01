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
import { dispatchDatabaseFetchError } from '../../utils/databaseErrorBus';
import { AiPrescriptionScannerModal } from '../../components/common/AiPrescriptionScannerModal';
import { LivePhlebotomistTrackingModal } from '../../components/patient/LivePhlebotomistTrackingModal';
import { DoctorAppointmentDetailModal, DoctorAppointmentRecord } from '../../components/doctor/DoctorAppointmentDetailModal';
import { LiveAuditRoadmapModal } from '../../components/patient/LiveAuditRoadmapModal';
import { DoctorPatientChatHub } from '../../components/chat/DoctorPatientChatHub';
import { EditPatientProfileModal } from '../../components/patient/EditPatientProfileModal';
import { doctorChatService } from '../../services/doctorChatService';
import pinkOctoberBannerImg from '../../assets/images/pink_octobre_nanolabs_banner_1790889435055.jpg';
import pinkOctoberScientistImg from '../../assets/images/pink_octobre_scientist_banner_1790889447077.jpg';
import drTankuaPortraitImg from '../../assets/images/dr_tankua_allen_portrait_1790889682898.jpg';
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
  ArrowRight,
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
  User,
  MessageSquare,
  Phone,
  Thermometer,
  Radio,
  Compass,
  Check,
  Edit3,
  X
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
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
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
  const [activeSegmentTab, setActiveSegmentTab] = useState<'home' | 'tests' | 'tracking' | 'chat' | 'receipts'>('home');
  const [selectedCity, setSelectedCity] = useState<string>('Douala');
  const [incomingDoctorRequests, setIncomingDoctorRequests] = useState<any[]>([]);
  const [activeDoctorConnections, setActiveDoctorConnections] = useState<any[]>([]);
  const [preSelectedDoctorForChat, setPreSelectedDoctorForChat] = useState<{ id: string; name: string } | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [testStatusFilter, setTestStatusFilter] = useState<'all' | 'completed' | 'in_testing'>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const refreshSocialConnections = (patId: string) => {
    try {
      const pending = doctorChatService.getRequests(patId).filter(
        (r: any) => r.toId.toLowerCase() === patId.toLowerCase() && r.status === 'pending'
      );
      setIncomingDoctorRequests(pending);
      const conns = doctorChatService.getConnections(patId, 'patient');
      setActiveDoctorConnections(conns);
    } catch (e) {
      console.warn('Error refreshing social connections:', e);
    }
  };

  const handleAcceptDoctorRequest = (requestId: string) => {
    try {
      doctorChatService.acceptConnectionRequest(requestId);
      refreshSocialConnections(user?.id || patientRecordId);
      setFeedbackToast('Doctor connection approved! Clinical sharing unlocked.');
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err) {
      console.error('Error accepting doctor request:', err);
    }
  };

  const handleDeclineDoctorRequest = (requestId: string) => {
    try {
      doctorChatService.declineConnectionRequest(requestId);
      refreshSocialConnections(user?.id || patientRecordId);
      setFeedbackToast('Connection request declined.');
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (err) {
      console.error('Error declining doctor request:', err);
    }
  };

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

          // Sync into social directory
          doctorChatService.syncPatientsFromDatabase([{
            id: found.id,
            patientId: found.id,
            name: data.name || user?.name,
            nickname: data.nickname || (user as any)?.nickname,
            isAnonymous: data.isAnonymous !== undefined ? data.isAnonymous : true,
            phone: data.phone || user?.phone,
            city: data.city || 'Douala'
          }]);
        } else {
          setPatientDocData(null);
          setTests([]);
        }

        // 2. Initial fetch of central LIMS bookings scoped to this patient
        const allBookings = await limsService.fetchAllBookings(targetLabId);
        
        // Merge with local storage bookings ledger (e.g. newly booked tests in portal)
        let localLedger: PatientBooking[] = [];
        try {
          const raw = localStorage.getItem('nanolabs_bookings_ledger') || localStorage.getItem('lims_bookings_ledger');
          if (raw) {
            localLedger = JSON.parse(raw);
          }
        } catch {
          // ignore parsing error
        }

        const bookingMap = new Map<string, PatientBooking>();
        [...localLedger, ...allBookings].forEach(b => {
          if (b && (b.id || b.bookingCode)) {
            bookingMap.set(b.id || b.bookingCode, b);
          }
        });
        const combined = Array.from(bookingMap.values());
        const myBookings = filterPatientBookings(combined, loadedDocData, user);
        const resolvedBookings = myBookings.length > 0 ? myBookings : (combined.length > 0 ? combined.slice(0, 8) : allBookings);

        setBookings(resolvedBookings);
        if (resolvedBookings.length > 0) {
          setExpandedBookingId(resolvedBookings[0].id);
        }

        // Check for real appointment bookings or doctor chat scheduled appointments
        try {
          const rawChat = localStorage.getItem('doctor_chat_messages_v1');
          if (rawChat) {
            const parsed = JSON.parse(rawChat);
            const aptMsg = parsed.reverse().find((m: any) => m.type === 'appointment' && m.appointmentDetails);
            if (aptMsg && aptMsg.appointmentDetails) {
              const d = aptMsg.appointmentDetails;
              setActiveScheduleRecord(prev => ({
                ...prev,
                id: d.appointmentId || prev.id,
                reservationCode: (d.appointmentId || 'APT2026').replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase(),
                doctorName: aptMsg.doctorName || 'Dr. Guy Kamga, MD',
                specialty: 'Clinical Diagnostic Specialist & MD',
                facilityName: d.facilityName || 'nanoLabs Central Diagnostic Clinic',
                date: d.date || prev.date,
                time: d.time || prev.time,
                treatmentName: d.reason || 'Diagnostic Assessment & Consultation',
                mode: d.mode || 'in_person'
              }));
            }
          }
        } catch {}

        // 2b. Refresh social connections and pending doctor requests
        const effectivePatId = loadedDocData ? loadedDocData.id : (user?.id || 'pat-1');
        refreshSocialConnections(effectivePatId);

        // 3. Real-time subscription with resolved patient document
        unsubBookings = limsService.subscribeToBookings(targetLabId, (liveBookings) => {
          let updatedLedger: PatientBooking[] = [];
          try {
            const raw = localStorage.getItem('nanolabs_bookings_ledger') || localStorage.getItem('lims_bookings_ledger');
            if (raw) updatedLedger = JSON.parse(raw);
          } catch {}
          const m = new Map<string, PatientBooking>();
          [...updatedLedger, ...liveBookings].forEach(b => {
            if (b && (b.id || b.bookingCode)) m.set(b.id || b.bookingCode, b);
          });
          const allMerged = Array.from(m.values());
          const filtered = filterPatientBookings(allMerged, loadedDocData, user);
          setBookings(filtered.length > 0 ? filtered : (allMerged.length > 0 ? allMerged.slice(0, 8) : allMerged));
        });
      } catch (e) {
        console.error('Error fetching patient data:', e);
        dispatchDatabaseFetchError({
          message: 'Patient Dashboard failed to load live diagnostic bookings from laboratory database.',
          tableOrCollection: `labs/${targetLabId}/patients & bookings`,
          rawError: e
        });
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

  const handleShareReportToDoctor = (booking: PatientBooking) => {
    setBatchReportBooking(null);
    if (activeDoctorConnections.length > 0) {
      const primaryDoc = activeDoctorConnections[0];
      try {
        doctorChatService.shareTestResult({
          senderId: user?.id || patientRecordId,
          senderName: patientFullName,
          doctorId: primaryDoc.doctorId,
          doctorName: primaryDoc.doctorName,
          testName: booking.tests?.map(t => t.testName).join(', ') || 'Batch Diagnostic Panels',
          bookingCode: booking.bookingCode,
          bookingId: booking.id,
          resultSummary: `${booking.tests?.length || 0} diagnostic tests analyzed and validated by accredited laboratory.`,
          isBatch: true,
          batchTestCount: booking.tests?.length || 1
        });
        setPreSelectedDoctorForChat({ id: primaryDoc.doctorId, name: primaryDoc.doctorName });
        setActiveSegmentTab('chat');
        setFeedbackToast(`Consolidated batch report shared with ${primaryDoc.doctorName}!`);
        setTimeout(() => setFeedbackToast(null), 4000);
      } catch (e) {
        console.error('Error sharing report:', e);
      }
    } else {
      setActiveSegmentTab('chat');
      setFeedbackToast('Connect with an accredited physician in our directory to share clinical reports.');
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  const getTrackingStepIndex = (b: PatientBooking | null) => {
    if (!b) return 1;
    const isCompleted = b.overallStatus === 'Completed' || (b.tests && b.tests.length > 0 && b.tests.every(t => t.status === 'Completed' || t.status === 'Ready_For_Pickup'));
    if (isCompleted) return 4;
    const status = (b.overallStatus || '').toLowerCase();
    if (status.includes('transit') || status.includes('route') || (b as any).status === 'In_Transit') return 3;
    if (status.includes('collected') || status.includes('pickup') || status.includes('processing')) return 2;
    return 1;
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
      label: 'Book Lab Test',
      desc: 'Clinic visit or home sample dispatch',
      icon: Calendar,
      color: 'bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-400',
      action: () => onNavigateTab ? onNavigateTab('book') : null
    },
    {
      id: 'results',
      label: 'My Lab Results',
      desc: 'Signed batch reports & QR certificates',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400',
      action: () => setActiveSegmentTab('tests')
    },
    {
      id: 'chat',
      label: 'Doctor Tele-Consult',
      desc: 'Mutual connection, chat & digital Rx',
      icon: MessageSquare,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400',
      action: () => setActiveSegmentTab('chat')
    },
    {
      id: 'scan',
      label: 'Scan Prescription (Rx)',
      desc: 'AI prescription camera scanner',
      icon: Camera,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400',
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
      {/* Modern Top Mobile-First App Bar (Aligned with User Hand-drawn Sketch) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 py-3">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-3">
          {/* Brand & Live Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shadow-xs">
                <Activity className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1">
                  nano<span className="text-teal-600">Labs</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Connected to Central LIMS" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium leading-none">Medical LIMS</div>
              </div>
            </div>

            {/* City Selector (Douala, Yaoundé, etc.) */}
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Select Diagnostic City Location"
                className="appearance-none pl-6 pr-6 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-full border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer transition-colors"
              >
                <option value="Douala">Douala, CMR</option>
                <option value="Yaoundé">Yaoundé, CMR</option>
                <option value="Bafoussam">Bafoussam, CMR</option>
                <option value="Garoua">Garoua, CMR</option>
                <option value="Bamenda">Bamenda, CMR</option>
              </select>
              <MapPin className="w-3 h-3 text-teal-600 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Privacy Nickname Badge & Actions */}
          <div className="flex items-center gap-2">
            {/* Clickable Patient Privacy Alias */}
            <button
              type="button"
              onClick={() => setShowEditProfileModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/90 transition-all cursor-pointer shadow-2xs group"
              title="Edit Profile & Privacy Nickname"
            >
              <Shield className="w-3 h-3 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="font-mono text-[11px]">@{patientDocData?.nickname || (user as any)?.nickname || 'Claire_M'}</span>
              <Edit3 className="w-3 h-3 text-indigo-400 opacity-60 group-hover:opacity-100" />
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={onNotificationPress}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Mail className="w-4 h-4" />
              {incomingDoctorRequests.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            {/* Profile Avatar */}
            <button
              type="button"
              onClick={() => setShowEditProfileModal(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-xs flex items-center justify-center shadow-xs cursor-pointer hover:ring-2 hover:ring-teal-400 transition-all"
              title="Patient Profile"
            >
              {patientFullName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Feedback Toast */}
      {feedbackToast && (
        <div className="bg-teal-900 text-teal-100 px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
            <button onClick={() => setFeedbackToast(null)} className="ml-auto text-teal-300 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 pb-28 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSegmentTab('home')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSegmentTab === 'home'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home Feed</span>
            </button>

            <button
              onClick={() => setActiveSegmentTab('tests')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSegmentTab === 'tests'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <TestTube className="w-4 h-4" />
              <span>Diagnostic Batches</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSegmentTab === 'tests' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSegmentTab('chat')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${
                activeSegmentTab === 'chat'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Doctor Chat & Consult</span>
              {incomingDoctorRequests.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveSegmentTab('tracking')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSegmentTab === 'tracking'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Live Transit</span>
            </button>

            <button
              onClick={() => setActiveSegmentTab('receipts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSegmentTab === 'receipts'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Invoices & Receipts</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: HOME FEED (MATCHING HAND-DRAWN SKETCH EXACTLY) */}
        {/* ============================================================== */}
        {activeSegmentTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Search Bar (Aligned with Sketch) */}
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search diagnostic tests, health packages, doctors..."
                className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-2xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 placeholder-slate-400"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 0. Pink October Hero Ad Campaign Banner (Directly from User Screenshots) */}
            <div className="relative rounded-3xl overflow-hidden shadow-md border border-pink-200 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 text-white group cursor-pointer transition-all hover:shadow-lg">
              <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                <img 
                  src={pinkOctoberBannerImg} 
                  alt="nanoLabs Octobre Rose - Chaque parcours compte. Chaque laboratoire aussi." 
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-600 text-white text-[10px] font-extrabold tracking-wider uppercase border border-pink-300/40">
                      Octobre Rose 🎗️
                    </span>
                    <span className="text-[11px] text-pink-100 font-medium">
                      Ensemble pour une santé plus forte
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                    Chaque parcours compte. Chaque laboratoire aussi.
                  </h2>
                  <p className="text-xs text-pink-100/90 line-clamp-1 mt-0.5">
                    Dépistage précoce du cancer du sein & bilans hormonaux chez nos laboratoires accrédités.
                  </p>
                </div>
              </div>
            </div>

            {/* Test Card Container - Styled Exactly Like User Screen Shot */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Test</h3>
                <button
                  type="button"
                  onClick={() => setActiveSegmentTab('tests')}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 underline underline-offset-2 cursor-pointer"
                >
                  See All
                </button>
              </div>

              {/* Exact Whaleness Test Card with Hepatitis B&C Screening items */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#004D71] text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                      <TestTube className="w-6 h-6 rotate-45" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 leading-tight">
                        Whaleness Test
                      </h4>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                        <span>.Biodiagnostic Labo</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-extrabold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                    4/4
                  </span>
                </div>

                {/* Subtest Rows */}
                <div className="space-y-2.5">
                  {/* Row 1: Orange/Amber Indicator */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full bg-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                          Hepatitis B&C Screening
                        </div>
                        <div className="text-[11px] text-slate-500">
                          status: <span className="font-bold text-amber-600">Cashier Approved</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSegmentTab('tests')}
                      className="w-8 h-8 rounded-xl bg-[#004D71] text-white flex items-center justify-center hover:bg-[#003852] transition-colors cursor-pointer shrink-0"
                    >
                      <ArrowRight className="w-4 h-4 -rotate-45" />
                    </button>
                  </div>

                  {/* Row 2: Green Indicator */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                          Hepatitis B&C Screening
                        </div>
                        <div className="text-[11px] text-slate-500">
                          status: <span className="font-bold text-emerald-600">Biologist Signed</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (bookings.length > 0) {
                          setBatchReportBooking(bookings[0]);
                        } else {
                          setActiveSegmentTab('tests');
                        }
                      }}
                      className="w-8 h-8 rounded-xl bg-[#004D71] text-white flex items-center justify-center hover:bg-[#003852] transition-colors cursor-pointer shrink-0"
                    >
                      <ArrowRight className="w-4 h-4 -rotate-45" />
                    </button>
                  </div>
                </div>

                {/* Price and Live Auditing row */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRoadmapModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-teal-700 transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-teal-600" />
                    <span>View Live Auditing</span>
                  </button>

                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">PRICE:</span>
                    <span className="text-sm font-black text-slate-900 font-mono">35000XAF</span>
                  </div>
                </div>

                {/* Primary Dark Teal Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (bookings.length > 0) {
                      setBatchReportBooking(bookings[0]);
                    } else {
                      setActiveSegmentTab('tests');
                    }
                  }}
                  className="w-full py-3.5 bg-[#1B4B48] hover:bg-[#133735] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>SEE FULL TESTS DETAILS</span>
                </button>
              </div>
            </div>

            {/* 4 Core Quick Action Cards (Directly from User Sketch) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {quickActionCards.map(card => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    onClick={card.action || undefined}
                    className={`text-left p-4 sm:p-5 rounded-2xl border bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group cursor-pointer ${card.color}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5 text-slate-800" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{card.label}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-1">{card.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Diagnostic Order / Specimen Status Card (Drawn in Sketch) */}
            {(() => {
              const activeOrLatestBooking = activeHomePickupBooking || bookings[0] || null;
              const currentStepIdx = getTrackingStepIndex(activeOrLatestBooking);

              return (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                      <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
                        Active Specimen Status & Order Tracking
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full">
                      Order #{activeOrLatestBooking?.bookingCode || 'BAT-2026-081'}
                    </span>
                  </div>

                  {/* Specimen Horizontal 4-Step Progress Tracker */}
                  <div className="pt-2">
                    <div className="grid grid-cols-4 gap-2 text-center relative">
                      {/* Connecting hairline */}
                      <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-100 -z-0" />
                      
                      {[
                        { step: 1, label: 'Booked', desc: 'Registered in LIMS', icon: Calendar },
                        { step: 2, label: 'Sample Collected', desc: 'Barcoded tubes sealed', icon: TestTube },
                        { step: 3, label: 'In Transit', desc: '+4°C Cold-Chain GPS', icon: Truck },
                        { step: 4, label: 'Results Ready', desc: 'Signed by Biologist', icon: CheckCircle2 }
                      ].map((st) => {
                        const StIcon = st.icon;
                        const isDone = st.step < currentStepIdx;
                        const isCurrent = st.step === currentStepIdx;

                        return (
                          <div key={st.step} className="flex flex-col items-center relative z-10 space-y-1.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                              isDone 
                                ? 'bg-emerald-600 text-white' 
                                : isCurrent 
                                ? 'bg-teal-600 text-white ring-4 ring-teal-100' 
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <StIcon className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-[11px] font-bold text-slate-800 leading-tight">{st.label}</div>
                            <div className="text-[10px] text-slate-400 hidden sm:block">{st.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Facility: <strong className="text-slate-800">{activeOrLatestBooking?.labName || lab?.name || 'nanoLabs Central Diagnostics'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPhlebTransitModal(true)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Live Phlebotomist GPS</span>
                      </button>

                      {activeOrLatestBooking && (
                        <button
                          type="button"
                          onClick={() => setBatchReportBooking(activeOrLatestBooking)}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Batch Report</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* INCOMING DOCTOR CONNECTION REQUESTS (MUTUAL APPROVAL PROTOCOL) */}
            {incomingDoctorRequests.length > 0 && (
              <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border-2 border-teal-500/30 rounded-3xl p-5 shadow-sm space-y-3 animate-in fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Doctor Connection Request Pending Approval</span>
                        <span className="px-2 py-0.5 bg-teal-600 text-white rounded-full text-xs font-bold">
                          {incomingDoctorRequests.length}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        An accredited specialist wants to connect with your patient profile to review your laboratory test batches and coordinate clinical teleconsultation. Both parties must approve to share medical records.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {incomingDoctorRequests.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-2xl border border-teal-200/90 shadow-2xs space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-black text-sm shrink-0">
                          {req.fromName?.slice(0, 2).toUpperCase() || 'DR'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{req.fromName}</h4>
                          <p className="text-xs text-teal-700 font-medium truncate">{req.fromSpecialty || 'Specialist Physician'}</p>
                          <p className="text-[11px] text-slate-500 truncate">{req.fromHospital || 'Partner Clinic'}</p>
                          {req.note && (
                            <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              "{req.note}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleAcceptDoctorRequest(req.id)}
                          className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Connect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineDoctorRequest(req.id)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MY CONNECTED DOCTORS & CLINICAL NETWORK */}
            <div id="connected-doctors-section" className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    My Connected Doctors ({activeDoctorConnections.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://waspito.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    title="Find and consult verified doctors on Waspito Telehealth"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Find Doctor on Waspito</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveSegmentTab('chat')}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Directory</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {activeDoctorConnections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeDoctorConnections.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-teal-200 transition-all shadow-2xs space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {doc.doctorName?.slice(0, 2).toUpperCase() || 'DR'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{doc.doctorName}</h4>
                          <p className="text-[11px] text-teal-700 font-medium truncate">{doc.doctorSpecialty || 'Specialist'}</p>
                          <p className="text-[10px] text-slate-500 truncate">{doc.doctorHospital || 'Central Hospital'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            setPreSelectedDoctorForChat({ id: doc.doctorId, name: doc.doctorName });
                            setActiveSegmentTab('chat');
                          }}
                          className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Chat</span>
                        </button>

                        {bookings.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleShareReportToDoctor(bookings[0])}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Share latest batch lab report"
                          >
                            <Share2 className="w-3 h-3 text-teal-600" />
                            <span>Share Lab</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-700">No Connected Physicians Yet</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Connect with accredited medical specialists in our global directory to share diagnostic results and receive digital prescriptions.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveSegmentTab('chat')}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Search Global Doctor Directory
                  </button>
                </div>
              )}
            </div>

            {/* Select Diagnostic Category */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Select Diagnostic Category</span>
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
            </div>

            {/* Upcoming Consultations Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-300">
                    Your Scheduled Consultations
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
                </div>
              </div>
            </div>

            {/* Popular Diagnostic Packages */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Popular Preventive Health Panels</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Same-Day Digital Delivery
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('book') : null}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 transition cursor-pointer"
                >
                  View All Packages
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    title: 'Full Body Wellness Screen',
                    tests: 'CBC, Fasting Blood Glucose, Lipid Profile, Liver & Kidney Function',
                    price: '45,000 FCFA',
                    time: '4-6 hours',
                    popular: true
                  },
                  {
                    title: 'Cardiac & Lipid Risk Profile',
                    tests: 'Total Cholesterol, HDL, LDL, Triglycerides, hs-CRP',
                    price: '28,000 FCFA',
                    time: '3-4 hours',
                    popular: false
                  },
                  {
                    title: 'Malaria & Typhoid Panel',
                    tests: 'Thick Film microscopy, Rapid Ag, Widal & Felix agglutination',
                    price: '15,000 FCFA',
                    time: '2 hours',
                    popular: true
                  }
                ].map((pkg, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-200 transition-all flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">{pkg.title}</h4>
                        {pkg.popular && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{pkg.tests}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <div className="font-extrabold text-sm text-slate-900">{pkg.price}</div>
                        <div className="text-[10px] text-slate-400">Est. {pkg.time}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateTab ? onNavigateTab('book') : null}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        Book Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Link to View All Batch Orders */}
            {bookings.length > 0 && (
              <div className="bg-slate-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">You have {bookings.length} diagnostic test batches</h4>
                  <p className="text-[11px] text-slate-500">View detailed parameter values, reference ranges, and verified PDFs</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSegmentTab('tests')}
                  className="px-3.5 py-2 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
                >
                  View My Batches
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: DIAGNOSTIC TEST BATCHES (FULL REGISTRY & ACTIONS) */}
        {/* ============================================================== */}
        {activeSegmentTab === 'tests' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Pink October Ad Banner for Medical Laboratory Diagnostics */}
            <div className="relative rounded-3xl overflow-hidden shadow-sm border border-pink-200 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-700 text-white">
              <div className="relative h-36 sm:h-44 w-full overflow-hidden flex items-center">
                <img 
                  src={pinkOctoberScientistImg} 
                  alt="nanoLabs Pink October Laboratory Initiative" 
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent flex flex-col justify-center p-4 sm:p-6 max-w-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider">
                      Campagne Octobre Rose 🎗️
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    Dépistage Précoce & Bilans Hormonaux
                  </h3>
                  <p className="text-xs text-pink-100/90 mt-1 line-clamp-2">
                    Bénéficiez des bilans préventifs subventionnés à -30% chez les laboratoires partenaires certifiés nanoLabs.
                  </p>
                  <div className="flex items-center gap-2.5 mt-2.5">
                    <button
                      type="button"
                      onClick={() => onNavigateTab ? onNavigateTab('book') : null}
                      className="px-3.5 py-1.5 bg-white hover:bg-pink-50 text-pink-700 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Prendre Rendez-vous
                    </button>
                    <a
                      href="https://waspito.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-pink-700/80 hover:bg-pink-700 text-white font-bold text-xs rounded-xl border border-pink-300/40 transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Avis Spécialiste sur Waspito</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar for Tests */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
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
            </div>
            {/* TAB 1: DIAGNOSTIC TEST BATCHES */}
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                          title="View and download complete signed report"
                        >
                          <Printer className="w-4 h-4" />
                          <span>View & Print</span>
                        </button>

                        {/* 1.5 Quick 1-Click PDF Report Download */}
                        <button
                          type="button"
                          onClick={() => {
                            setBatchReportBooking(booking);
                            setTimeout(() => {
                              window.print();
                            }, 400);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                          title="Instant 1-Click Download PDF Report"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Download PDF</span>
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

                        {/* 3.5 Doctor Chat */}
                        <button
                          type="button"
                          onClick={() => setActiveSegmentTab('chat')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl text-xs border border-teal-200 transition-all cursor-pointer"
                          title="Consult doctor about this batch"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                          <span className="hidden sm:inline">Doctor Chat</span>
                        </button>

                        {/* 3.6 Live Transit Tracking */}
                        <button
                          type="button"
                          onClick={() => setActiveSegmentTab('tracking')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs border border-amber-200 transition-all cursor-pointer"
                          title="Track Specimen Transit"
                        >
                          <Truck className="w-3.5 h-3.5 text-amber-600" />
                          <span className="hidden sm:inline">Track</span>
                        </button>

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

                                    {/* Per Test Instant PDF Download or Virtual Request */}
                                    <div onClick={e => e.stopPropagation()} className="flex items-center gap-1.5">
                                      {hasTestPdf ? (
                                        <a
                                          href={testPdfLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all shadow-2xs"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          <span>Download PDF</span>
                                        </a>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setBatchReportBooking(booking)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-2xs"
                                          title="View certified diagnostic report and download PDF"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Download PDF</span>
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

        {/* TAB 2: LIVE PHLEBOTOMIST & SPECIMEN TRANSIT TRACKING */}
        {activeSegmentTab === 'tracking' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Real-time Telemetry Dispatch Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <Truck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        Dispatch Active &bull; Specimen En Route
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                      Live Specimen Transit Tracking
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPhlebTransitModal(true)}
                    className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Fullscreen GPS Radar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRoadmapModal(true)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span>Audit Roadmap</span>
                  </button>
                </div>
              </div>

              {/* Phlebotomist & Destination Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Field Courier Identity */}
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-black text-base flex items-center justify-center shrink-0 shadow-md">
                    AK
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">Alain Kemajou</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        #PHL-237
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 truncate">Lead Mobile Phlebotomist</p>
                    <div className="flex items-center gap-3 mt-2">
                      <a
                        href="tel:+237671223344"
                        className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Courier</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveSegmentTab('chat')}
                        className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Cold Chain IoT Telemetry */}
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-teal-400" />
                      <span>Cold-Chain IoT Sensor</span>
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-md">
                      Compliant
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">+4.2°C</span>
                    <span className="text-xs text-slate-400 font-medium">(Safe Range: +2°C to +8°C)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Active Peltier Smart-Cooler &bull; Cellular sensor stream online &bull; Battery 94%
                  </p>
                </div>

                {/* 3. Security Handover Code (OTP) */}
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sample Handover OTP</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full">
                      Show Courier
                    </span>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-black tracking-widest text-amber-400 font-mono">
                      {bookings[0]?.id ? bookings[0].id.replace(/[^0-9]/g, '').slice(-4) || '8492' : '8492'}
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-snug">
                    Provide this 4-digit code to Nurse Alain Kemajou to authenticate sample draw.
                  </p>
                </div>
              </div>

              {/* Simulated Live GPS Radar Visualizer */}
              <div className="relative rounded-2xl bg-slate-950/80 border border-slate-800 p-5 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-mono flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                    <span>Live GPS Position: Douala, Akwa &bull; Speed: 36 km/h</span>
                  </span>
                  <span className="font-bold text-teal-400 font-mono">ETA: ~14 Mins</span>
                </div>

                {/* Stylized vector map route */}
                <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-teal-400 flex items-center justify-center border border-slate-700">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white">nanoLabs Central Lab</div>
                      <div className="text-[11px] text-slate-400">Hub 1 &bull; Douala Center</div>
                    </div>
                  </div>

                  <div className="flex-1 w-full max-w-md relative flex items-center px-4">
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 w-3/4 animate-pulse" />
                    </div>
                    <div className="absolute left-3/4 -top-3 -translate-x-1/2 flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow-lg shadow-teal-500/50">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold text-teal-300 mt-1 whitespace-nowrap">Current Location</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white">Your Registered Address</div>
                      <div className="text-[11px] text-slate-400">{patientFullName} &bull; Home Collection</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6-Stage ISO 15189 Chain-of-Custody Timeline */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Chain-of-Custody Dispatch Milestones
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { step: 1, title: 'Order & Barcodes Assigned', status: 'completed', time: '08:15 AM', desc: 'Pre-printed sterile vacutainer tubes prepared' },
                    { step: 2, title: 'Phlebotomist Dispatched', status: 'completed', time: '08:32 AM', desc: 'Departed central facility on transport motorbike' },
                    { step: 3, title: 'En Route to Residence', status: 'active', time: 'Now', desc: 'Approaching patient location (~14 mins remaining)' },
                    { step: 4, title: 'Venipuncture & Barcoding', status: 'pending', time: 'Estimated 09:05 AM', desc: 'Verification OTP verified and specimen drawn' },
                    { step: 5, title: 'Cold-Chain Return Transit', status: 'pending', time: 'Estimated 09:25 AM', desc: 'Secured in +4°C active cooler during transit' },
                    { step: 6, title: 'Centrifuge & Biologist Audit', status: 'pending', time: 'Estimated 09:45 AM', desc: 'Automated biochemical analyzer intake' }
                  ].map((m) => (
                    <div
                      key={m.step}
                      className={`p-3.5 rounded-2xl border text-xs space-y-1 transition ${
                        m.status === 'completed'
                          ? 'bg-slate-800/40 border-emerald-500/30 text-slate-200'
                          : m.status === 'active'
                          ? 'bg-teal-950/40 border-teal-500/60 text-white ring-1 ring-teal-500/30'
                          : 'bg-slate-900/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black flex items-center gap-1.5">
                          {m.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {m.status === 'active' && <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />}
                          <span>Stage {m.step}: {m.title}</span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{m.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pre-Collection Preparation Notice */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Patient Preparation Guide for Upcoming Sample Collection</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <strong className="text-slate-800 block mb-1">💧 Stay Well Hydrated</strong>
                  Drink 1 to 2 glasses of fresh water before the phlebotomist arrives to facilitate vein dilation and pain-free venipuncture.
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <strong className="text-slate-800 block mb-1">🥪 Fasting Checklist</strong>
                  For fasting blood glucose and lipid panels, ensure you have not consumed caloric meals or sugary beverages for 8-12 hours.
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <strong className="text-slate-800 block mb-1">🪪 Identification Ready</strong>
                  Have your national ID card or passport ready so the phlebotomist can confirm identity against the barcode requisition form.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DOCTOR TELE-CONSULTATION & DIRECT CHAT */}
        {activeSegmentTab === 'chat' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-teal-600" />
                    <span>Doctor Consultation & Clinical Tele-Chat</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Encrypted two-way channel with accredited physicians, pathologists, and care team members.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Specialists Online
                  </span>
                </div>
              </div>

              <DoctorPatientChatHub
                currentRole="patient"
                currentPatientId={user?.id || patientRecordId}
                currentPatientName={patientFullName}
                onNavigateToBooking={(tests) => onNavigateTab ? onNavigateTab('book') : null}
                onOpenReportModal={(bookingId) => {
                  const b = bookings.find(item => item.id === bookingId || item.bookingCode === bookingId);
                  if (b) setBatchReportBooking(b);
                }}
                onOpenEditProfileModal={() => setShowEditProfileModal(true)}
              />
            </div>
          </div>
        )}

        {/* TAB 4: INVOICES & RECEIPTS */}
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

      {/* Edit Patient Profile Modal */}
      <EditPatientProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        patientDocData={patientDocData}
        onSuccess={(updated) => {
          setPatientFullName(updated.name);
          setPatientDocData((prev: any) => ({ ...prev, ...updated }));
        }}
      />

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

      {/* Sticky Bottom Mobile Navigation Bar - Chic Floating Island Pill Matching User Mockup */}
      <div className="sm:hidden fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none pb-safe">
        <nav 
          id="patient-bottom-nav"
          aria-label="Patient Mobile Navigation"
          className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 px-5 py-2 flex items-center justify-between gap-6 rounded-full shadow-2xl shadow-slate-900/15"
        >
          {/* Home Icon with Indicator Dot */}
          <button
            id="btn-nav-home"
            type="button"
            onClick={() => {
              setActiveSegmentTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-1 cursor-pointer transition-all ${
              activeSegmentTab === 'home' ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.5]" />
            {activeSegmentTab === 'home' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-1" />
            )}
          </button>

          {/* Social / Connect Doctors Icon */}
          <button
            id="btn-nav-doctors"
            type="button"
            onClick={() => {
              setActiveSegmentTab('home');
              const el = document.getElementById('connected-doctors-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-all"
          >
            <Users className="w-5 h-5 stroke-[2.2]" />
            <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-1" />
          </button>

          {/* Messenger / Chat Icon */}
          <button
            id="btn-nav-chat"
            type="button"
            onClick={() => {
              setActiveSegmentTab('chat');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-1 cursor-pointer transition-all relative ${
              activeSegmentTab === 'chat' ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Navigation className="w-5 h-5 rotate-45 stroke-[2.2]" />
            {incomingDoctorRequests.length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            {activeSegmentTab === 'chat' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-1" />
            )}
          </button>

          {/* Results Booklet / My Tests Icon */}
          <button
            id="btn-nav-tests"
            type="button"
            onClick={() => {
              setActiveSegmentTab('tests');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-1 cursor-pointer transition-all relative ${
              activeSegmentTab === 'tests' ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
            {activeSegmentTab === 'tests' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-1" />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default PatientDashboard;
