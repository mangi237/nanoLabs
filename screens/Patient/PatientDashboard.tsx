import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { db, getDocs, collection, updateDoc, doc } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
import PatientActivityAuditModal from '../../components/medical/PatientActivityAuditModal';
import MedicalBookletModal from '../../components/medical/MedicalBookletModal';
import BatchConsolidatedReportModal from '../../components/patient/BatchConsolidatedReportModal';
import { MedicalReceiptModal } from '../../components/common/MedicalReceiptModal';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';
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
  Laptop,
  Building2,
  ShieldCheck,
  Eye,
  Lock,
  Receipt,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles
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
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showBookletModal, setShowBookletModal] = useState(false);
  const [batchReportBooking, setBatchReportBooking] = useState<PatientBooking | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState<PatientBooking | null>(null);
  const [activeSegmentTab, setActiveSegmentTab] = useState<'tests' | 'receipts'>('tests');

  useEffect(() => {
    fetchPatientData();

    const targetLabId = lab?.id || 'lab-1';
    const unsubBookings = limsService.subscribeToBookings(targetLabId, (allBookings) => {
      const myBookings = allBookings.filter(b => 
        b.patientId === user?.id ||
        (b.patientEmail && user?.email && b.patientEmail.toLowerCase() === user.email.toLowerCase()) ||
        (b.patientPhone && user?.phone && b.patientPhone === user.phone) ||
        (b.patientName && user?.name && b.patientName.toLowerCase() === user.name.toLowerCase())
      );
      setBookings(myBookings);
    });

    return () => {
      unsubBookings();
    };
  }, [user?.id, user?.email]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const targetLabId = lab?.id || 'lab-1';

      // 1. Fetch Patient Document
      const snap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const found = snap.docs.find(d => 
        d.id === user?.id ||
        d.data().email === user?.email || 
        d.data().accessCode === user?.accessCode ||
        d.data().name === user?.name
      );
      if (found) {
        setPatientRecordId(found.id);
        setPatientFullName(found.data().name || user?.name || 'Patient Record');
        if (found.data().labTests) {
          setTests(found.data().labTests);
        } else {
          setTests([]);
        }
      } else {
        setTests([]);
      }

      // 2. Fetch Central LIMS Bookings for this Patient
      const allBookings = await limsService.fetchAllBookings(targetLabId);
      const patientPid = found?.data()?.patientId || user?.id;
      const myBookings = allBookings.filter(b => 
        b.patientId === user?.id ||
        b.patientPid === patientPid ||
        b.patientId === found?.id ||
        (b.patientEmail && user?.email && b.patientEmail.toLowerCase() === user.email.toLowerCase()) ||
        (b.patientPhone && user?.phone && b.patientPhone === user.phone) ||
        (b.patientName && user?.name && b.patientName.toLowerCase() === user.name.toLowerCase())
      );
      setBookings(myBookings);
    } catch (e) {
      console.error('Error fetching patient data:', e);
    } finally {
      setLoading(false);
    }
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

      await fetchPatientData();
    } catch (err) {
      console.error('Error requesting virtual result:', err);
    } finally {
      setRequestingId(null);
    }
  };

  // Calculate total spending
  const totalSpentPaid = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const totalPendingAmount = bookings
    .filter(b => b.paymentStatus !== 'paid')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const totalAllTestsCount = bookings.reduce((sum, b) => sum + (b.tests?.length || 0), 0);

  const actionCards = [
    { id: 'book', label: 'Book Appointment', desc: 'Schedule consultation or test', icon: Calendar, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'history', label: 'Test History', desc: 'View complete lab reports & prices', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'share', label: 'Share Results', desc: 'Send records to physician', icon: Share2, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'transfer', label: 'Transfer Records', desc: 'Move files between labs', icon: ArrowRightLeft, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Patient Medical Portal"
        subtitle="Manage your health records & lab test requests"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome Banner */}
        <div 
          style={{
            background: `linear-gradient(135deg, ${lab?.primaryColor || '#0f766e'}, ${lab?.secondaryColor || '#1e3a8a'})`
          }}
          className="rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        >
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Patient Account
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Valued Patient'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90">
              Connected to {lab?.name || 'nanoLabs Central Diagnostics'}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('book')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-bold rounded-2xl text-xs hover:bg-white/90 shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-teal-700" />
                  Book New Test
                </button>
              )}
              <button
                onClick={() => setShowBookletModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-400 text-slate-950 font-black rounded-2xl text-xs hover:bg-teal-300 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-950" />
                Medical Diagnostic Booklet
              </button>
            </div>
          </div>

          {/* Big Circled Logo at Right Side */}
          <div className="shrink-0 self-center sm:self-auto">
            {lab?.logoUrl ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/40 bg-white/10 backdrop-blur-md shadow-2xl p-1 flex items-center justify-center overflow-hidden">
                <img
                  src={lab.logoUrl}
                  alt={lab.name || 'Lab Logo'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/40 bg-white/20 backdrop-blur-md shadow-2xl flex items-center justify-center text-white">
                <Activity className="w-10 h-10 stroke-[2.5]" />
              </div>
            )}
          </div>
        </div>

        {/* Physical Pickup & Virtual Request Notice */}
        <div className="p-4 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
          <Building2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold">Physical Result Collection & Online Virtual Reports</div>
            <p className="text-slate-700">
              When lab tests are completed, official printed paper copies can be picked up at the receptionist desk. You can also click <strong>"Request Virtual Result"</strong> below to have your digital PDF uploaded directly to your online dashboard.
            </p>
          </div>
        </div>

        {/* Security & Access Audit Trail Banner */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Medical Record Access & Audit Trail
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <Lock className="w-3 h-3" />
                  SHA-256 Non-Repudiation Seal Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every time your records, test results, or diagnostic findings are viewed, printed, or updated by a doctor or lab staff, an indelible cryptographic mark is permanently logged.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAuditModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            View Who Accessed My Records
          </button>
        </div>

        {/* Financial & Diagnostic Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Diagnostic Expenditure</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{(totalSpentPaid).toLocaleString()} <span className="text-xs font-bold text-slate-500">FCFA</span></h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Paid & verified at cashier</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Orders & Invoices</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{(totalPendingAmount).toLocaleString()} <span className="text-xs font-bold text-slate-500">FCFA</span></h3>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">Awaiting cashier checkout</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tests Booked</p>
              <h3 className="text-2xl font-black text-teal-700 mt-1">{totalAllTestsCount || tests.length}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{bookings.length} consolidated order booklet(s)</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionCards.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigateTab && onNavigateTab(card.id)}
                className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md cursor-pointer transition-all space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                    {card.label}
                  </h3>
                  <p className="text-xs text-slate-500">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* HORIZONTAL TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            onClick={() => setActiveSegmentTab('tests')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSegmentTab === 'tests'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <TestTube className="w-4 h-4" />
            <span>Diagnostic Tests & Live Tracking</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeSegmentTab === 'tests' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {tests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSegmentTab('receipts')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeSegmentTab === 'receipts'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Invoices & Payment Receipts</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeSegmentTab === 'receipts' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {bookings.length}
            </span>
          </button>
        </div>

        {/* TAB 1: DIAGNOSTIC REQUISITIONS & TEST BATCHES */}
        {activeSegmentTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-teal-600" />
                  <span>My Diagnostic Test Batches & Requisitions</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tests grouped into medical visit batches with consolidated booklets, physician sharing & digital PDF downloads
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowBookletModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>View All Results Booklet</span>
                </button>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('book')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Order New Tests</span>
                  </button>
                )}
              </div>
            </div>

            {/* List of Batches / Bookings */}
            {bookings.length > 0 ? (
              <div className="space-y-5">
                {bookings.map((booking) => {
                  const isPaid = booking.paymentStatus === 'paid';
                  const allCompleted = booking.tests?.every(t => t.status === 'Completed') || booking.overallStatus === 'Completed';
                  const completedCount = booking.tests?.filter(t => t.status === 'Completed').length || 0;
                  const totalTests = booking.tests?.length || 0;
                  const isExpanded = expandedBookingId === booking.id || bookings.length === 1;

                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden transition-all"
                    >
                      {/* Batch Header Bar */}
                      <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-teal-500 text-slate-950 shadow-xs">
                              BATCH: {booking.bookingCode}
                            </span>
                            <span className="text-xs text-slate-300 font-medium">
                              📅 {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent Requisition'}
                            </span>
                            {booking.doctorName && (
                              <span className="text-xs text-teal-300 font-semibold bg-slate-800 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                                👨‍⚕️ Prescribed by: {booking.doctorName}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 flex items-center gap-3">
                            <span>Diagnostic Facility: <strong className="text-white">{booking.labName || lab?.name || 'Regional Diagnostic Center'}</strong></span>
                            <span>•</span>
                            <span>{completedCount} of {totalTests} Tests Ready</span>
                          </div>
                        </div>

                        {/* Batch Action Suite */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Payment status badge */}
                          <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide border ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            {(booking.totalAmount || 0).toLocaleString()} FCFA ({isPaid ? 'PAID' : 'UNPAID'})
                          </span>

                          {/* Download / Print Full Consolidated Result */}
                          <button
                            type="button"
                            onClick={() => setBatchReportBooking(booking)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                            title="Download Full Signed PDF Report of all tests in this batch"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Download Full Results (Signed PDF)</span>
                          </button>

                          {/* Share with Physician */}
                          {onNavigateTab && (
                            <button
                              type="button"
                              onClick={() => onNavigateTab('share')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                              title="Email encrypted results directly to your doctor"
                            >
                              <Share2 className="w-4 h-4" />
                              <span>Share with Doctor</span>
                            </button>
                          )}

                          {/* Receipt */}
                          <button
                            type="button"
                            onClick={() => setReceiptModalBooking(booking)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
                            title="View official medical receipt"
                          >
                            <Receipt className="w-4 h-4 text-teal-400" />
                            <span>Receipt</span>
                          </button>

                          {/* Toggle Expand */}
                          <button
                            type="button"
                            onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Full Batch PDF Alert if Available */}
                      {booking.pdfReportUrl && (
                        <div className="px-6 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-teal-900 font-bold">
                            <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                            <span>Full Batch Consolidated PDF Report Available</span>
                          </div>
                          <a
                            href={booking.pdfReportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold transition-all shadow-2xs"
                          >
                            <span>Open Consolidated PDF</span>
                          </a>
                        </div>
                      )}

                      {/* Tests in Batch Table */}
                      {isExpanded && (
                        <div className="p-5 sm:p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                              Tests in this Requisition Batch ({booking.tests?.length || 0})
                            </h4>
                            <span className="text-xs text-slate-400 font-medium">
                              Status: <strong className={allCompleted ? 'text-emerald-600' : 'text-amber-600'}>{allCompleted ? 'Completed & Validated' : 'In Lab Processing'}</strong>
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-xs text-slate-700">
                              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                  <th className="py-3 px-4">Diagnostic Test Name</th>
                                  <th className="py-3 px-4">Category & Specimen</th>
                                  <th className="py-3 px-4">Result / Parameters</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4 text-right">Actions & PDF</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium">
                                {booking.tests?.map((test) => {
                                  const isCompleted = test.status === 'Completed' || test.status === 'Ready_For_Pickup';
                                  const hasPerTestPdf = Boolean(test.pdfReportUrl || test.externalPdfUrl || test.pdfUrl || test.fileUrl);
                                  const pdfUrl = test.pdfReportUrl || test.externalPdfUrl || test.pdfUrl || test.fileUrl;

                                  return (
                                    <tr
                                      key={test.id}
                                      onClick={() => onSelectTest && onSelectTest(test)}
                                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                                    >
                                      <td className="py-3.5 px-4">
                                        <div className="font-extrabold text-slate-900 text-sm">
                                          {test.testName || test.name}
                                        </div>
                                        {test.testCode && (
                                          <span className="text-[10px] text-slate-400 font-mono">Code: {test.testCode}</span>
                                        )}
                                      </td>

                                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                                        <div>{test.category || 'General Laboratory'}</div>
                                        <div className="text-[10px] text-slate-400">{test.sampleTypeRequired || 'Blood Specimen'}</div>
                                      </td>

                                      <td className="py-3.5 px-4">
                                        {test.subParameters && test.subParameters.length > 0 ? (
                                          <div className="space-y-1">
                                            {test.subParameters.slice(0, 3).map((sp: any) => (
                                              <div key={sp.id} className="text-[11px] flex items-center gap-1.5">
                                                <span className="text-slate-500">{sp.name}:</span>
                                                <span className="font-bold font-mono text-slate-900">{sp.value || 'Pending'} {sp.unit}</span>
                                              </div>
                                            ))}
                                            {test.subParameters.length > 3 && (
                                              <span className="text-[10px] text-teal-600 font-semibold">+ {test.subParameters.length - 3} more parameters</span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="font-mono font-bold text-slate-900">
                                            {test.resultValue || (isCompleted ? 'Analyzed & Signed' : 'Processing in Analyzer')} {test.units || ''}
                                          </div>
                                        )}
                                      </td>

                                      <td className="py-3.5 px-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                                          isCompleted
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : test.status === 'In_Lab_Testing'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : isPaid
                                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                          {isCompleted ? (
                                            <>
                                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                              Results Ready
                                            </>
                                          ) : (
                                            <>
                                              <Clock className="w-3 h-3 text-amber-600" />
                                              {test.status?.replace(/_/g, ' ') || (isPaid ? 'In Testing' : 'Pending Payment')}
                                            </>
                                          )}
                                        </span>
                                      </td>

                                      <td className="py-3.5 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                          {hasPerTestPdf ? (
                                            <a
                                              href={pdfUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs border border-emerald-200 transition-all shadow-2xs"
                                            >
                                              <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>View Test PDF</span>
                                            </a>
                                          ) : test.virtualRequested ? (
                                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
                                              Virtual Requested
                                            </span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={(e) => handleRequestVirtual(e, test)}
                                              disabled={requestingId === test.id}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-[11px] border border-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                                            >
                                              <Laptop className="w-3 h-3" />
                                              <span>{requestingId === test.id ? 'Requesting...' : 'Request Virtual'}</span>
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : tests.length > 0 ? (
              /* Fallback direct test batch if bookings hasn't populated yet */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-teal-500 text-slate-950">
                      CURRENT CLINICAL REQUISITION
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">Consolidated Diagnostic Tests ({tests.length})</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBookletModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Download Full Results</span>
                    </button>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('share')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share with Doctor</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {tests.map(test => (
                    <div key={test.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{test.testName || test.name}</h4>
                        <p className="text-xs text-slate-500">{test.category || 'General'} • {(test.price || 5000).toLocaleString()} FCFA</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {test.status || 'Results Ready'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
                <TestTube className="w-10 h-10 mx-auto text-slate-300" />
                <h4 className="font-extrabold text-slate-700 text-sm">No diagnostic batches recorded yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When you book laboratory diagnostic tests, your test orders will appear organized into requisition batches here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MULTI-TEST BOOKING RECEIPTS & ITEMIZATION */}
        {activeSegmentTab === 'receipts' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    My Multi-Test Orders & Itemized Receipts ({bookings.length})
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every test selected is grouped into your daily diagnostic booklet with itemized costs & running totals
                </p>
              </div>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('book')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Book More Tests
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {bookings.map((booking) => {
                const isExpanded = expandedBookingId === booking.id;
                const isPaid = booking.paymentStatus === 'paid';
                const formattedDate = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today';

                return (
                  <div key={booking.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                            {booking.bookingCode}
                          </span>
                          <span className="font-mono text-xs text-slate-500 font-semibold">
                            Invoice: {booking.invoiceNumber || 'INV-0001'}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-600 font-medium">
                            {formattedDate}
                          </span>
                        </div>
                        
                        <div className="text-xs text-slate-600 pt-1">
                          <span className="font-bold text-slate-900">{booking.tests?.length || 0} Test{booking.tests?.length !== 1 ? 's' : ''} in this Order: </span>
                          <span className="text-slate-500">
                            {booking.tests?.map(t => t.testName).join(', ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {(booking.totalAmount || 0).toLocaleString()} FCFA
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                            {isPaid ? 'PAID & UNLOCKED' : 'PENDING AT CASHIER'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setReceiptModalBooking(booking)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-slate-600" />
                            <span>Receipt</span>
                          </button>

                          <button
                            onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-200 transition-all cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED ITEMIZED TEST RECEIPT BREAKDOWN */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200/80 bg-teal-50/30 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Itemized Diagnostic Test Breakdown</span>
                          <span className="font-mono text-teal-700">Ref: {booking.bookingCode}</span>
                        </div>

                        <div className="bg-white rounded-xl border border-teal-200/80 overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3">#</th>
                                <th className="py-2.5 px-3">Diagnostic Test Name</th>
                                <th className="py-2.5 px-3">Category / Matrix</th>
                                <th className="py-2.5 px-3">Individual Price</th>
                                <th className="py-2.5 px-3 text-right">Test Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {booking.tests?.map((t, idx) => (
                                <tr key={t.id || idx} className="hover:bg-slate-50/60">
                                  <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                                  <td className="py-2.5 px-3 font-bold text-slate-900">{t.testName}</td>
                                  <td className="py-2.5 px-3 text-slate-500">{t.category || 'General'} • {t.sampleTypeRequired || 'Blood'}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{(t.price || 5000).toLocaleString()} FCFA</td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      t.status === 'Completed' || t.status === 'Ready_For_Pickup'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : t.status === 'In_Lab_Testing'
                                        ? 'bg-blue-100 text-blue-800'
                                        : isPaid
                                        ? 'bg-teal-100 text-teal-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {t.status || (isPaid ? 'Awaiting Specimen' : 'Pending Payment')}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-black text-xs">
                              <tr>
                                <td colSpan={3} className="py-2.5 px-3 text-slate-700">Total Order Amount ({booking.tests?.length || 0} Tests)</td>
                                <td colSpan={2} className="py-2.5 px-3 text-right font-mono text-sm text-teal-800">
                                  {(booking.totalAmount || 0).toLocaleString()} FCFA
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {bookings.length === 0 && (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No multi-test booking receipts yet</p>
                  <p className="text-[11px] text-slate-400">When you book tests, your itemized receipts will automatically appear here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Official Consolidated Batch Diagnostic Report Modal (Signed PDF) */}
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
          patientId: patientRecordId,
          name: patientFullName,
          fullName: patientFullName,
          email: user?.email,
          phone: user?.phone
        }}
        lab={lab}
      />

      {/* Patient Access Audit Trail Modal */}
      <PatientActivityAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        patient={{
          id: patientRecordId,
          patientId: patientRecordId,
          name: patientFullName,
          fullName: patientFullName,
          email: user?.email,
          phone: user?.phone
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
    </div>
  );
};

export default PatientDashboard;
