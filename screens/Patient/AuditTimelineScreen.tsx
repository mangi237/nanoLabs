import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  ShieldCheck,
  FileCheck,
  Share2,
  UserCheck,
  Download,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';

interface AuditTimelineScreenProps {
  booking?: any;
  onBack: () => void;
  onViewResults: (booking?: any) => void;
  onShareWithDoctor?: () => void;
  onRequestHomeDelivery?: () => void;
  labName?: string;
  bookingCode?: string;
}

export const AuditTimelineScreen: React.FC<AuditTimelineScreenProps> = ({
  booking: propBooking,
  onBack,
  onViewResults,
  onShareWithDoctor,
  labName: propLabName = '',
  bookingCode: propBookingCode = ''
}) => {
  const { user } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();

  const [liveBooking, setLiveBooking] = useState<any | null>(propBooking || null);
  const [loading, setLoading] = useState<boolean>(!propBooking);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const loadAuditBooking = async () => {
    try {
      const { limsService } = await import('../../services/limsService');
      const all = await limsService.fetchPatientBookingsAcrossLabs(
        propBooking?.labId ? [propBooking.labId] : []
      );

      if (propBooking?.id || propBookingCode) {
        const found = all.find(
          (b) =>
            (propBooking?.id && b.id === propBooking.id) ||
            (propBookingCode && b.bookingCode === propBookingCode)
        );
        if (found) {
          setLiveBooking(found);
          setLoading(false);
          return;
        }
      }

      const activeName = (activeProfile?.fullName || '').toLowerCase().trim();
      const activeId = activeProfile?.id || '';
      const userId = user?.id || '';
      const matching = all.filter((b) => {
        const bPid = (b.patientPid || b.patientId || '').trim();
        const bName = (b.patientName || '').toLowerCase().trim();
        if (isDependentActive) {
          return (activeId && bPid === activeId) || (activeName && bName === activeName);
        }
        return (
          (activeId && bPid === activeId) ||
          (userId && bPid === userId) ||
          (activeName && bName === activeName)
        );
      });

      setLiveBooking(matching[0] || null);
    } catch (e) {
      console.warn('Error loading audit timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditBooking();
    const interval = setInterval(loadAuditBooking, 4000);
    window.addEventListener('nanolabs_booking_updated', loadAuditBooking);
    return () => {
      clearInterval(interval);
      window.removeEventListener('nanolabs_booking_updated', loadAuditBooking);
    };
  }, [propBooking?.id, propBookingCode, activeProfile?.id]);

  const resolvedLabName = liveBooking?.labName || propLabName || 'Performing Laboratory';
  const resolvedCode = liveBooking?.bookingCode || propBookingCode || 'N/A';

  // Build real chronological chain-of-custody events strictly from actual booking state & auditTrail (zero mock staff!)
  const realEvents: Array<{
    id: string;
    title: string;
    details: string;
    actorName: string;
    actorRole: string;
    timestamp: string;
  }> = (() => {
    if (!liveBooking) return [];
    if (Array.isArray(liveBooking.auditTrail) && liveBooking.auditTrail.length > 0) {
      return [...liveBooking.auditTrail].sort(
        (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
      );
    }

    // Reconstruct strictly from real fields on the booking if created before auditTrail array
    const derived: any[] = [];
    if (liveBooking.createdAt) {
      derived.push({
        id: 'ev-created',
        title: 'Test Request Registered',
        details: `Diagnostic order created for ${liveBooking.patientName} at ${resolvedLabName}.`,
        actorName: liveBooking.patientName || 'Patient',
        actorRole: 'patient',
        timestamp: liveBooking.createdAt
      });
    }
    if (liveBooking.receptionistValidated && liveBooking.validatedAt) {
      derived.push({
        id: 'ev-reception',
        title: 'Confirmed by Laboratory Receptionist',
        details: 'Test request validated and routed to Laboratory Cashier.',
        actorName: liveBooking.validatedBy || 'Reception Desk',
        actorRole: 'receptionist',
        timestamp: liveBooking.validatedAt
      });
    }
    if (liveBooking.paidAt) {
      derived.push({
        id: 'ev-paid',
        title: 'Payment Verified & Certified Receipt Issued',
        details: `Payment settled (${liveBooking.paymentMethod || 'Verified'}).`,
        actorName: liveBooking.paymentProcessedBy || 'Lab Cashier',
        actorRole: 'cashier',
        timestamp: liveBooking.paidAt
      });
    }
    if (liveBooking.sampleCollectedAtDate) {
      derived.push({
        id: 'ev-collected',
        title: 'Specimen Barcoded & Stored in Laboratory',
        details: `Barcode: ${liveBooking.sampleBarcode || 'Assigned'} · Storage: ${liveBooking.storageLocation || 'Lab Rack'}.`,
        actorName: liveBooking.sampleCollectedBy || 'In-Lab Phlebotomist',
        actorRole: 'phlebotomist',
        timestamp: liveBooking.sampleCollectedAtDate
      });
    }
    if (liveBooking.biologistSignedAt) {
      derived.push({
        id: 'ev-biologist',
        title: 'Biologist Certified & Released Official Results',
        details: liveBooking.biologistRemarks || 'Validated and signed for patient release.',
        actorName: liveBooking.biologistName || 'Medical Biologist',
        actorRole: 'biologist',
        timestamp: liveBooking.biologistSignedAt
      });
    }
    return derived;
  })();

  const handleDownloadOfficialAuditLog = () => {
    if (!liveBooking) return;
    const lines = [
      '====================================================================',
      'OFFICIAL CLINICAL LABORATORY CHAIN-OF-CUSTODY & LIVE AUDIT LOG',
      '====================================================================',
      `Laboratory       : ${resolvedLabName}`,
      `Booking Code     : ${resolvedCode}`,
      `Invoice Number   : ${liveBooking.invoiceNumber || 'N/A'}`,
      `Patient Name     : ${liveBooking.patientName || activeProfile?.fullName || 'N/A'}`,
      `Specimen Barcode : ${liveBooking.sampleBarcode || 'Pending In-Lab Scan'}`,
      `Storage Location : ${liveBooking.storageLocation || 'Pending Rack Assignment'}`,
      `Overall Status   : ${liveBooking.overallStatus || 'In Progress'}`,
      `Generated At     : ${new Date().toLocaleString()}`,
      '--------------------------------------------------------------------',
      'CHRONOLOGICAL AUDIT EVENTS:',
      '--------------------------------------------------------------------',
      ...realEvents.map(
        (ev, idx) =>
          `${idx + 1}. [${ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Timestamp'}] ${ev.title}\n   Actor : ${ev.actorName} (${ev.actorRole})\n   Detail: ${ev.details}`
      ),
      '===================================================================='
    ];

    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit-Log-${resolvedCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isCompleted = Boolean(
    liveBooking?.biologistSigned || liveBooking?.overallStatus === 'Completed'
  );

  return (
    <div className="max-w-2xl mx-auto py-3 px-2 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Live Chain-of-Custody Audit Log
            </h1>
            <p className="text-[11px] text-slate-500">
              {resolvedLabName} &middot; Booking <strong className="font-mono">{resolvedCode}</strong>
            </p>
          </div>
        </div>

        {liveBooking && (
          <button
            type="button"
            onClick={handleDownloadOfficialAuditLog}
            className="px-3.5 py-2 bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#006978] rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Audit Log</span>
          </button>
        )}
      </div>

      {/* Specimen Custody Metadata */}
      {liveBooking && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 block">Performing Lab</span>
            <strong className="text-slate-900 block truncate mt-0.5">{resolvedLabName}</strong>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 block">Specimen Barcode</span>
            <strong className="font-mono text-slate-900 block mt-0.5">
              {liveBooking.sampleBarcode || 'Pending Scan'}
            </strong>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 block">Lab Storage Rack</span>
            <strong className="text-slate-900 block truncate mt-0.5">
              {liveBooking.storageLocation || 'Pending Intake'}
            </strong>
          </div>
        </div>
      )}

      {/* Real-Time Timeline */}
      {loading ? (
        <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
          Loading live laboratory audit events...
        </div>
      ) : realEvents.length > 0 ? (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800">
              Verified Timestamped Laboratory Actions ({realEvents.length})
            </h3>
            <span className="text-xs font-bold text-[#006978]">
              {isCompleted ? 'Biologist Certified' : 'Live Updating'}
            </span>
          </div>

          <div className="space-y-6">
            {realEvents.map((stage, idx) => (
              <div key={stage.id || idx} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#006978] text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  {idx < realEvents.length - 1 && (
                    <div className="w-0.5 h-12 my-1 bg-[#006978]/40" />
                  )}
                </div>

                <div className="flex-1 pt-0.5 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="font-extrabold text-sm text-slate-900">{stage.title}</h4>
                    <span className="font-mono text-xs text-[#006978] font-bold">
                      {stage.timestamp ? new Date(stage.timestamp).toLocaleString() : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                    <UserCheck className="w-3.5 h-3.5 text-[#006978]" />
                    <span>
                      {stage.actorName} &middot;{' '}
                      <span className="text-slate-400 font-normal capitalize">{stage.actorRole}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed pt-0.5">{stage.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
          <Inbox className="w-7 h-7 text-slate-300 mx-auto" />
          <h3 className="text-sm font-black text-slate-800">No Audit Events Recorded Yet</h3>
          <p className="text-xs text-slate-500">
            Submit a diagnostic test request to track every staff action from Receptionist to Biologist in real time.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {liveBooking && (
        <div className="space-y-2.5 pt-1">
          {isCompleted && (
            <button
              onClick={() => {
                setShowReportModal(true);
                if (onViewResults) {
                  onViewResults(liveBooking || propBooking);
                }
              }}
              className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>View Biologist Certified Results</span>
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadOfficialAuditLog}
              className="py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-[#006978]" />
              <span>Download Audit Certificate (.TXT)</span>
            </button>

            {onShareWithDoctor && isCompleted && (
              <button
                type="button"
                onClick={onShareWithDoctor}
                className="py-3 bg-white hover:bg-slate-50 border border-slate-200 text-[#006978] font-bold text-xs rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Manage Connected Doctors</span>
              </button>
            )}
          </div>
        </div>
      )}

      {showReportModal && (
        <LabReportPdfViewModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          booking={liveBooking || propBooking}
        />
      )}
    </div>
  );
};
