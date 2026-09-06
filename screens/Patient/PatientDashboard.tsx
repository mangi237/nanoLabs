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
import { 
  Calendar, 
  FileText, 
  Share2, 
  ArrowRightLeft, 
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
  Laptop
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
  
  // Modals
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showBookletModal, setShowBookletModal] = useState(false);
  const [batchReportBooking, setBatchReportBooking] = useState<PatientBooking | null>(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState<PatientBooking | null>(null);
  const [envelopeModalTest, setEnvelopeModalTest] = useState<any | null>(null);
  
  // UI State
  const [activeSegmentTab, setActiveSegmentTab] = useState<'tests' | 'receipts'>('tests');
  const [testStatusFilter, setTestStatusFilter] = useState<'all' | 'completed' | 'in_testing'>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    let unsubBookings: (() => void) | null = null;

    const initDashboardData = async () => {
      setLoading(true);
      try {
        const targetLabId = lab?.id || 'lab-1';

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

  const filterPatientBookings = (allBookings: PatientBooking[], patDoc: any, currentUser: any) => {
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
      id: 'share',
      label: 'Share with Doctor',
      desc: 'Send records securely to physician',
      icon: Share2,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400',
      action: () => onNavigateTab ? onNavigateTab('share') : null
    },
    {
      id: 'transfer',
      label: 'Transfer Records',
      desc: 'Transfer medical file to another lab',
      icon: ArrowRightLeft,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400',
      action: () => onNavigateTab ? onNavigateTab('transfer') : null
    }
  ];

  const filteredBookings = bookings.filter(b => {
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
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
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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

        {/* Tab Selector & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
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
    </div>
  );
};

export default PatientDashboard;
