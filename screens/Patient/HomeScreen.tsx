import React, { useState, useEffect } from 'react';
import {
  Search,
  FlaskConical,
  Package,
  Building2,
  Stethoscope,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Clock,
  Camera,
  Navigation,
  CreditCard,
  Inbox,
  FileText,
  Receipt,
  ExternalLink,
  Bell,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { formatXAF } from '../../shared/money';
import { TestCatalogItem } from './SearchTestsScreen';
import { BatchConsolidatedReportModal } from '../../components/patient/BatchConsolidatedReportModal';
import { MedicalReceiptModal } from '../../components/common/MedicalReceiptModal';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';
import { PatientSpendingTrackerModal } from '../../components/patient/PatientSpendingTrackerModal';
import { doesBookingBelongToPatient } from '../../utils/patientOwnership';
import { buildLabWhatsAppOrderUrl } from '../../utils/whatsappGateway';

interface HomeScreenProps {
  onNavigateScan: () => void;
  onNavigateBook: () => void;
  onNavigateTests: () => void;
  onNavigatePackage: () => void;
  onNavigateBooklet?: () => void;
  onNavigateLabs: () => void;
  onNavigateDoctors: () => void;
  onNavigateInsurance: () => void;
  onNavigateTracking: (booking?: any) => void;
  onNavigateAudit?: (booking?: any) => void;
  onNavigateProfile: () => void;
  onSelectTest: (test: TestCatalogItem) => void;
  onOpenBatch?: (batchId: string) => void;
  onNavigateInvoice?: (booking: any) => void;
  onNavigateResults?: () => void;
}

function getLiveStageSummary(b: any): {
  badge: string;
  headline: string;
  subtext: string;
  tone: 'amber' | 'blue' | 'teal' | 'emerald';
} {
  if (b.biologistSigned || b.overallStatus === 'Completed') {
    const channelNote =
      b.releaseChannel === 'physical_pickup'
        ? 'Certified online & physical hardcopy ready for pickup at lab front desk'
        : b.releaseChannel === 'online_only'
          ? 'Certified digital report available online immediately'
          : 'Certified report available online & physical copy ready at lab';
    return {
      badge: 'Results Certified & Released',
      headline: `Signed by ${b.biologistName || 'Medical Biologist'}`,
      subtext: channelNote,
      tone: 'emerald'
    };
  }
  if (b.labTechSigned || b.overallStatus === 'Pending_Biologist_Signoff') {
    return {
      badge: 'Awaiting Biologist Sign-Off',
      headline: 'Lab Technician Completed Analysis',
      subtext: 'Submitted to the Medical Biologist for final clinical validation and signature.',
      tone: 'teal'
    };
  }
  if (b.sampleCollected || b.overallStatus === 'In_Lab_Testing') {
    return {
      badge: 'In-Lab Processing',
      headline: `Barcoded ${b.sampleBarcode ? `(${b.sampleBarcode})` : ''} · Stored in ${b.storageLocation || 'Lab Rack'}`,
      subtext: b.techOpenedAt
        ? `Lab Technician (${b.techOpenedBy || 'Bench Tech'}) opened your dossier and is running assays.`
        : 'Specimen logged by In-Lab Phlebotomist and queued on Lab Technician bench.',
      tone: 'teal'
    };
  }
  if (b.paymentStatus === 'paid') {
    if (b.homeCollection && !b.sampleHandoverVerified && !b.patientConfirmedHandover) {
      const moving = Boolean(b.locationSharingActive || b.phlebotomistGpsActive);
      return {
        badge: moving ? 'Mobile Phlebotomist En Route (Live GPS)' : 'Paid · Queued for Home Pickup',
        headline: moving
          ? `${b.phlebotomistName || 'Mobile Phlebotomist'} is traveling to your pinned Google Maps location`
          : 'Payment verified — Mobile Phlebotomist preparing for sample pickup',
        subtext: moving
          ? 'Tap Track Live to view real-time Google Maps movement, call phlebotomist, and confirm pickup.'
          : 'You will see live map movement as soon as the phlebotomist clicks Go Pickup Sample.',
        tone: 'blue'
      };
    }
    return {
      badge: 'In Laboratory · Ready for Sample Draw',
      headline: b.homeCollection
        ? 'Sample Handover Confirmed · Routed to In-Lab Phlebotomist'
        : 'Payment Verified · Proceed to In-Lab Phlebotomist',
      subtext: 'Waiting for In-Lab Phlebotomist to log specimen barcode and storage rack.',
      tone: 'teal'
    };
  }
  if (b.paymentProofSubmitted || b.invoiceStatus === 'payment_submitted') {
    return {
      badge: 'Payment Pending Cashier Confirmation',
      headline: `Transaction ID (${b.transactionReference || 'Submitted'}) Sent to Cashier`,
      subtext: 'The Lab Cashier is double-checking your third-party payment before issuing your certified receipt.',
      tone: 'blue'
    };
  }
  if (b.invoiceGenerated) {
    return {
      badge: 'Action Required · Official Invoice Ready',
      headline: `Cashier Issued Invoice #${b.invoiceNumber || 'INV'}`,
      subtext: 'Review primary test fees, justifiable clinical charges, and insurance split, then confirm payment.',
      tone: 'amber'
    };
  }
  if (b.receptionistValidated) {
    return {
      badge: 'Confirmed by Receptionist',
      headline: 'Test Request Accepted · Routed to Lab Cashier',
      subtext: 'The Cashier is preparing your official itemized invoice.',
      tone: 'blue'
    };
  }
  return {
    badge: 'Test Request Sent',
    headline: 'Awaiting Laboratory Receptionist Confirmation',
    subtext: 'Your online test request has been transmitted to the laboratory reception desk (no payment due yet).',
    tone: 'amber'
  };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateScan,
  onNavigateTests,
  onNavigatePackage,
  onNavigateLabs,
  onNavigateDoctors,
  onNavigateInsurance,
  onNavigateTracking,
  onNavigateAudit,
  onNavigateProfile,
  onNavigateInvoice,
  onNavigateResults
}) => {
  const { user } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();

  const [profileBookings, setProfileBookings] = useState<any[]>([]);
  const [selectedBatchForReport, setSelectedBatchForReport] = useState<any | null>(null);
  const [selectedBookingForPdf, setSelectedBookingForPdf] = useState<any | null>(null);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<any | null>(null);
  const [showSpendingModal, setShowSpendingModal] = useState<boolean>(false);

  const fetchMemberData = async () => {
    try {
      const { limsService } = await import('../../services/limsService');
      const allBookings = await limsService.fetchPatientBookingsAcrossLabs(
        user?.labId ? [user.labId] : []
      );

      const matching = allBookings.filter((b) =>
        doesBookingBelongToPatient(b, user, activeProfile, isDependentActive)
      );

      setProfileBookings(matching);
    } catch (err) {
      console.warn('Error fetching patient bookings:', err);
    }
  };

  useEffect(() => {
    fetchMemberData();
    const poll = setInterval(fetchMemberData, 5000);

    const handleCloseOverlays = () => {
      setSelectedBatchForReport(null);
      setSelectedBookingForPdf(null);
      setSelectedBookingForReceipt(null);
    };

    window.addEventListener('nanolabs_booking_updated', fetchMemberData);
    window.addEventListener('nanolabs_close_all_overlays', handleCloseOverlays);
    window.addEventListener('nanolabs_profile_switched', handleCloseOverlays);

    return () => {
      clearInterval(poll);
      window.removeEventListener('nanolabs_booking_updated', fetchMemberData);
      window.removeEventListener('nanolabs_close_all_overlays', handleCloseOverlays);
      window.removeEventListener('nanolabs_profile_switched', handleCloseOverlays);
    };
  }, [user?.id, user?.phone, activeProfile?.id, isDependentActive]);

  // Real spend calculations for this profile by lab
  const spendByLab: Record<string, number> = {};
  let totalMemberSpend = 0;

  profileBookings.forEach((b) => {
    if (b.paymentStatus === 'paid') {
      const labKey = b.labName || 'Performing Laboratory';
      const amount = Number(b.actualPaidAmount ?? b.patientCoPayAmount ?? b.totalAmount) || 0;
      spendByLab[labKey] = (spendByLab[labKey] || 0) + amount;
      totalMemberSpend += amount;
    }
  });

  // Aggregate real-time audit notifications across bookings
  const liveAuditNotifications = profileBookings
    .flatMap((b) =>
      (b.auditTrail || []).map((ev: any) => ({
        ...ev,
        bookingCode: b.bookingCode,
        labName: b.labName || 'Performing Laboratory',
        booking: b
      }))
    )
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    .slice(0, 6);

  const patientDisplayName = isDependentActive
    ? activeProfile?.fullName || 'Family Member'
    : user?.name ||
      user?.fullName ||
      (activeProfile?.fullName && activeProfile.fullName !== 'Patient'
        ? activeProfile.fullName
        : user?.email?.split('@')[0] || 'Patient');

  const profileImg = user?.profilePicture || user?.avatarUrl || activeProfile?.photoUrl;

  return (
    <div className="max-w-4xl mx-auto py-2 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* 1. TOP GREETING BAR */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500">
            Patient Diagnostic Portal
            {isDependentActive ? ` · ${activeProfile.relationshipLabel} Dossier` : ''}
          </span>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {patientDisplayName}
          </h1>
        </div>

        <button
          onClick={onNavigateProfile}
          className="relative focus:outline-hidden cursor-pointer group"
          title="View profile, receipts, spent summary & connected doctors"
        >
          {profileImg ? (
            <img
              src={profileImg}
              alt={patientDisplayName}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shadow-xs border-2 border-[#006978]"
            />
          ) : (
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#006978] text-white flex items-center justify-center font-black text-base shadow-xs border-2 border-white">
              {patientDisplayName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
      </div>

      {/* 2. SEARCH BAR */}
      <div
        onClick={onNavigateTests}
        className="relative bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3 cursor-pointer hover:border-[#006978] transition-all"
      >
        <Search className="w-4 h-4 text-slate-400" />
        <span className="text-xs sm:text-sm font-medium text-slate-400 select-none">
          Search diagnostic tests or health packages across partner laboratories...
        </span>
      </div>

      {/* 3. QUICK ACTION NAVIGATION */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
        <button
          onClick={onNavigateTests}
          title="Book Diagnostic Tests"
          className="flex flex-col items-center justify-center gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#006978] transition-all cursor-pointer shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700">Tests</span>
        </button>

        <button
          onClick={onNavigatePackage}
          title="Health Packages"
          className="flex flex-col items-center justify-center gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#006978] transition-all cursor-pointer shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700">Packages</span>
        </button>

        <button
          onClick={onNavigateLabs}
          title="Compare Laboratories on Google Maps"
          className="flex flex-col items-center justify-center gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#006978] transition-all cursor-pointer shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700">Labs</span>
        </button>

        <button
          onClick={onNavigateDoctors}
          title="Accredited Physicians"
          className="flex flex-col items-center justify-center gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#006978] transition-all cursor-pointer shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700">Doctors</span>
        </button>
      </div>

      {/* 4. LIVE ORDERS, INVOICES, TRACKING & CHAIN-OF-CUSTODY STATUS HUB */}
      {profileBookings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Live Test Requests, Invoices & Specimen Tracking
              </h2>
              <p className="text-[11px] text-slate-500">
                Real-time updates from Receptionist, Cashier, Mobile Phlebotomist, Lab Tech & Biologist
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#006978]">
              {profileBookings.length} Order{profileBookings.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="space-y-3">
            {profileBookings.slice(0, 4).map((b) => {
              const stage = getLiveStageSummary(b);
              const labTitle = b.labName || 'Selected Laboratory';
              const isInvoiceAction = b.invoiceGenerated && !b.paymentProofSubmitted && b.paymentStatus !== 'paid';
              const isCompleted = b.biologistSigned || b.overallStatus === 'Completed';
              const isPaid = b.paymentStatus === 'paid';

              return (
                <div
                  key={b.id || b.bookingCode}
                  className={`p-5 rounded-3xl border bg-white shadow-xs space-y-3.5 ${
                    isInvoiceAction ? 'border-amber-400 ring-1 ring-amber-300/50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                        <span className="font-bold text-[#006978]">{stage.badge}</span>
                        <span>&middot;</span>
                        <span className="font-semibold text-slate-800">{labTitle}</span>
                        <span>&middot;</span>
                        <span className="font-mono">#{b.bookingCode}</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900">
                        {stage.headline}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{stage.subtext}</p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {b.hasInsurance ? 'Net Patient Share' : 'Order Amount'}
                      </span>
                      <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                        {formatXAF(Number(b.patientCoPayAmount ?? b.totalAmount) || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons tailored to exact live stage */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500">
                      {(b.tests || []).map((t: any) => t.testName || t.name).join(', ')}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Cashier Invoice Ready -> Pay or View Submitted Proof */}
                      {b.invoiceGenerated && !isPaid && onNavigateInvoice && (
                        <button
                          type="button"
                          onClick={() => onNavigateInvoice(b)}
                          className="px-4 py-2 bg-[#006978] hover:bg-[#005a66] text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>
                            {b.paymentProofSubmitted ? 'View Payment Status' : 'Review & Confirm Payment'}
                          </span>
                        </button>
                      )}

                      {/* Paid Home Collection -> Live Google Maps Courier Tracking */}
                      {isPaid && b.homeCollection && !b.sampleHandoverVerified && !b.patientConfirmedHandover && (
                        <button
                          type="button"
                          onClick={() => onNavigateTracking(b)}
                          className="px-4 py-2 bg-[#006978] hover:bg-[#005a66] text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Track Live Map & Confirm Pickup</span>
                        </button>
                      )}

                      {/* Certified Receipt (Strictly after Cashier verifies payment) */}
                      {isPaid && (
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForReceipt(b)}
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Certified Receipt</span>
                        </button>
                      )}

                      {/* Official Biologist Signed Report */}
                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForPdf(b)}
                          className="px-4 py-2 bg-[#006978] hover:bg-[#005a66] text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Official Lab Report</span>
                        </button>
                      )}

                      {/* Direct WhatsApp Bridge to Lab (No LIMS Required) */}
                      {!isCompleted && (
                        <a
                          href={buildLabWhatsAppOrderUrl({
                            bookingCode: b.bookingCode || b.id,
                            patientName: b.patientName || patientDisplayName,
                            patientPhone: b.patientPhone,
                            patientAlias: b.patientAlias,
                            tests: b.tests || [],
                            totalAmount: b.totalAmount,
                            homeCollection: b.homeCollection,
                            pickupLocation: b.pickupLocation,
                            userCoords: b.userCoords,
                            labName: labTitle,
                            labPhone: b.labPhone,
                          }).waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          title="Relancer / Notifier le laboratoire directement sur WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Labo</span>
                        </a>
                      )}

                      {/* Live Audit Log */}
                      <button
                        type="button"
                        onClick={() => (onNavigateAudit ? onNavigateAudit(b) : onNavigateTracking(b))}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>Live Audit</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. LIVE AUDIT & NOTIFICATION FEED */}
      {liveAuditNotifications.length > 0 && (
        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900">
              <Bell className="w-4 h-4 text-[#006978]" />
              <span>Live Laboratory Activity & Chain-of-Custody Feed</span>
            </div>
            <span className="text-[11px] text-slate-400">Real-time events</span>
          </div>

          <div className="divide-y divide-slate-100">
            {liveAuditNotifications.map((ev, idx) => (
              <div
                key={ev.id || idx}
                onClick={() => (onNavigateAudit ? onNavigateAudit(ev.booking) : undefined)}
                className="py-2.5 flex items-start justify-between gap-3 text-xs cursor-pointer hover:bg-slate-50/70 rounded-xl px-1 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <strong className="text-slate-900">{ev.title}</strong>
                    <span>&middot;</span>
                    <span>{ev.labName}</span>
                    <span>&middot;</span>
                    <span className="font-mono">#{ev.bookingCode}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{ev.details}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {ev.timestamp
                    ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PRESCRIPTION SCANNER SHORTCUT */}
      <button
        onClick={onNavigateScan}
        className="w-full p-4 bg-white hover:border-[#006978] border border-slate-200 rounded-3xl shadow-xs text-left transition-all cursor-pointer group flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006978]">
              Scan Doctor's Prescription (Ordonnance)
            </h4>
            <p className="text-xs text-slate-500">
              Extract prescribed tests and referring physician automatically before choosing a laboratory
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>

      {/* 7. REAL DIAGNOSTIC SPEND SUMMARY & SPENDING PER LAB */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <CreditCard className="w-4 h-4 text-[#006978]" />
            <span>Suivi des Dépenses de Santé ({activeProfile?.fullName || 'Compte Principal'})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums text-sm font-black text-[#006978]">
              {formatXAF(totalMemberSpend)}
            </span>
            <button
              type="button"
              onClick={() => setShowSpendingModal(true)}
              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-[#006978] font-extrabold text-[11px] rounded-lg border border-teal-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Détails Dépenses &amp; Labos</span>
            </button>
          </div>
        </div>

        {Object.keys(spendByLab).length > 0 ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Laboratoire d&apos;Analyses</span>
              <span>Montant Réglé</span>
            </div>
            {Object.entries(spendByLab).map(([lName, amount]) => (
              <div key={lName} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-none">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                  <span className="font-semibold text-slate-800">{lName}</span>
                </div>
                <span className="font-mono tabular-nums font-black text-slate-900">{formatXAF(amount)}</span>
              </div>
            ))}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span>Tarification équitable nanoLabs :</span>
              <strong className="text-teal-800 font-bold">5% par lot d&apos;analyses (aucun forfait abusif)</strong>
            </div>
          </div>
        ) : (
          <div className="py-2 text-xs text-slate-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-slate-300" />
              <span>Aucun règlement enregistré pour l&apos;instant. Les factures réglées et reçus de caisse se synchronisent ici.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSpendingModal(true)}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs font-bold underline shrink-0 cursor-pointer"
            >
              Ouvrir le Suivi
            </button>
          </div>
        )}
      </div>

      {/* 8. REPORTS, RECEIPTS & INSURANCE LINKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          onClick={() => {
            const completed = profileBookings.find(
              (b) => b.biologistSigned || b.overallStatus === 'Completed'
            );
            if (completed) {
              setSelectedBatchForReport(completed);
            } else if (onNavigateResults) {
              onNavigateResults();
            }
          }}
          className="p-4 bg-white hover:border-[#006978] border border-slate-200 rounded-3xl shadow-xs transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                Biologist Certified Reports
              </h4>
              <p className="text-[11px] text-slate-500">Single & consolidated batch reports with lab header</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        <div
          onClick={onNavigateInsurance}
          className="p-4 bg-white hover:border-[#006978] border border-slate-200 rounded-3xl shadow-xs transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                Health Insurance & Tiers-Payant
              </h4>
              <p className="text-[11px] text-slate-500">Configure policy for automatic Cashier invoice split</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Modals */}
      {selectedBatchForReport && (
        <BatchConsolidatedReportModal
          isOpen={!!selectedBatchForReport}
          onClose={() => setSelectedBatchForReport(null)}
          booking={selectedBatchForReport}
        />
      )}

      {selectedBookingForPdf && (
        <LabReportPdfViewModal
          isOpen={!!selectedBookingForPdf}
          onClose={() => setSelectedBookingForPdf(null)}
          booking={selectedBookingForPdf}
          isStaffOrAdmin={false}
        />
      )}

      {selectedBookingForReceipt && (
        <MedicalReceiptModal
          isOpen={!!selectedBookingForReceipt}
          onClose={() => setSelectedBookingForReceipt(null)}
          booking={selectedBookingForReceipt}
        />
      )}

      {showSpendingModal && (
        <PatientSpendingTrackerModal
          isOpen={showSpendingModal}
          onClose={() => setShowSpendingModal(false)}
          bookings={profileBookings}
        />
      )}
    </div>
  );
};
