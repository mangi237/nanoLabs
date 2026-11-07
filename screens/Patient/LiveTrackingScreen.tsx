import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Navigation,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Check,
  Compass,
  QrCode,
  FlaskConical
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { LiveCourierTrackingMap } from '../../components/maps/GoogleMapsWidgets';
import { doesBookingBelongToPatient } from '../../utils/patientOwnership';

interface LiveTrackingScreenProps {
  booking?: any;
  onBack: () => void;
  onSampleDeliveredToLab: () => void;
  onOpenRiderView?: () => void;
  onNavigateHome?: () => void;
  phlebotomistName?: string;
  etaMinutes?: number;
  distanceKm?: number;
  labName?: string;
}

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({
  booking: propBooking,
  onBack,
  onSampleDeliveredToLab,
  labName: propLabName = ''
}) => {
  const { user } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();

  const [activeBooking, setActiveBooking] = useState<any | null>(propBooking || null);
  const [loadingBooking, setLoadingBooking] = useState<boolean>(!propBooking);
  const [confirmingHandover, setConfirmingHandover] = useState(false);

  const loadLiveBooking = async () => {
    try {
      const { limsService } = await import('../../services/limsService');
      const allBookings = await limsService.fetchPatientBookingsAcrossLabs(
        propBooking?.labId ? [propBooking.labId] : []
      );
      const ownedBookings = allBookings.filter((b) =>
        doesBookingBelongToPatient(b, user, activeProfile, isDependentActive)
      );

      if (propBooking?.id || propBooking?.bookingCode) {
        const exact = ownedBookings.find(
          (b) =>
            (propBooking.id && b.id === propBooking.id) ||
            (propBooking.bookingCode && b.bookingCode === propBooking.bookingCode)
        );
        if (exact) {
          setActiveBooking(exact);
          setLoadingBooking(false);
          return;
        }
      }

      const current =
        ownedBookings.find((b) => b.overallStatus !== 'Completed') || ownedBookings[0] || null;
      setActiveBooking(current);
    } catch (err) {
      console.warn('Error loading tracking booking:', err);
    } finally {
      setLoadingBooking(false);
    }
  };

  useEffect(() => {
    loadLiveBooking();
    const interval = setInterval(loadLiveBooking, 4000);
    window.addEventListener('nanolabs_booking_updated', loadLiveBooking);
    return () => {
      clearInterval(interval);
      window.removeEventListener('nanolabs_booking_updated', loadLiveBooking);
    };
  }, [propBooking?.id, activeProfile?.id, user?.id]);

  const handleConfirmSamplePickedUpByPatient = async () => {
    if (!activeBooking) return;
    setConfirmingHandover(true);
    try {
      const { limsService } = await import('../../services/limsService');
      await limsService.confirmPatientSampleHandover(
        activeBooking.labId || 'lab-1',
        activeBooking.id,
        activeBooking.patientName || activeProfile?.fullName || 'Patient'
      );
      await loadLiveBooking();
    } catch (e) {
      console.error('Failed to confirm sample handover:', e);
    } finally {
      setConfirmingHandover(false);
    }
  };

  if (loadingBooking) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center text-xs text-slate-500">
        Synchronizing live specimen & courier telemetry...
      </div>
    );
  }

  if (!activeBooking) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-slate-900 animate-in fade-in duration-300 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Live Order & Specimen Tracking
          </h1>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900">No Active Diagnostic Order</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Once you submit a test request and the laboratory cashier verifies your payment, live mobile phlebotomist GPS tracking or in-lab chain-of-custody updates appear here automatically.
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const resolvedLabName = activeBooking.labName || propLabName || 'Selected Laboratory';
  const resolvedPhlebName =
    activeBooking.phlebotomistName || activeBooking.assignedOfficer || 'Assigned Mobile Phlebotomist';
  const resolvedPhlebPhone = activeBooking.phlebotomistPhone || activeBooking.labPhone || '+237 671 22 33 44';
  const resolvedAddress = activeBooking.pickupLocation || 'Pinned Google Maps Residence';

  const labCoords = activeBooking.labCoords || { lat: 4.0511, lng: 9.7042 };
  const patientCoords = activeBooking.userCoords || { lat: 4.0565, lng: 9.7582 };
  const phlebotomistCoords = activeBooking.phlebotomistCoords || null;

  // Handover complete or already in lab -> DO NOT show courier live GPS anymore!
  const isInLabStage = Boolean(
    activeBooking.sampleHandoverVerified ||
      activeBooking.patientConfirmedHandover ||
      activeBooking.transitStatus === 'arrived_at_lab' ||
      activeBooking.sampleCollected ||
      activeBooking.overallStatus === 'In_Lab_Testing' ||
      activeBooking.overallStatus === 'Completed'
  );

  // 1. IF SAMPLE HANDED OVER OR ALREADY IN LAB -> GPS STOPS, SHOW IN-LAB TRANSITION
  if (isInLabStage) {
    return (
      <div className="max-w-2xl mx-auto py-5 px-3 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Specimen In Laboratory ({resolvedLabName})
            </h1>
            <p className="text-xs text-slate-500">
              Booking <strong className="font-mono">{activeBooking.bookingCode}</strong> &middot; Live courier GPS ended after handover
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <strong className="text-emerald-950 block text-sm">
                Sample Handover Confirmed &middot; Status: In Lab
              </strong>
              <p className="text-emerald-900/80 leading-relaxed">
                Live phlebotomist location sharing has automatically turned off for privacy. Your biological sample is now with the in-laboratory team at <strong>{resolvedLabName}</strong>.
              </p>
            </div>
          </div>

          {/* Barcode & Rack Storage Live Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Specimen Barcode</span>
              <strong className="font-mono text-sm text-slate-900">
                {activeBooking.sampleBarcode || 'Awaiting In-Lab Phlebotomist Scan'}
              </strong>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Laboratory Rack / Storage</span>
              <strong className="text-sm text-slate-900">
                {activeBooking.storageLocation || 'Routing to Intake Bench'}
              </strong>
            </div>
          </div>

          <button
            onClick={onSampleDeliveredToLab}
            className="w-full py-4 bg-[#006978] hover:bg-[#005a66] text-white rounded-2xl text-sm font-extrabold shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Open Live Chain-of-Custody Audit Log</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. IF UNPAID / WAITING RECEPTIONIST OR CASHIER
  if (activeBooking.paymentStatus !== 'paid') {
    return (
      <div className="max-w-2xl mx-auto py-5 px-3 sm:px-4 text-slate-900 space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Order Status</h1>
            <p className="text-xs text-slate-500">
              {resolvedLabName} &middot; #{activeBooking.bookingCode}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs text-xs">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {!activeBooking.receptionistValidated
                  ? 'Awaiting Lab Receptionist Confirmation'
                  : !activeBooking.invoiceGenerated
                    ? 'Confirmed by Receptionist · Waiting for Cashier Invoice'
                    : activeBooking.paymentProofSubmitted
                      ? 'Payment Submitted · Waiting for Cashier Verification'
                      : 'Official Invoice Ready · Awaiting Your Payment'}
              </h3>
              <p className="text-slate-500 mt-0.5">
                Sample collection and live phlebotomist dispatch activate immediately once the Cashier verifies payment.
              </p>
            </div>
          </div>

          <button
            onClick={onSampleDeliveredToLab}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold cursor-pointer"
          >
            View Live Audit Log
          </button>
        </div>
      </div>
    );
  }

  // 3. WALK-IN PAID PATIENT (Goes directly to In-Lab Phlebotomist, never Mobile Phlebotomist)
  if (!activeBooking.homeCollection) {
    return (
      <div className="max-w-2xl mx-auto py-5 px-3 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Walk-In Laboratory Pass ({resolvedLabName})
            </h1>
            <p className="text-xs text-slate-500">
              Direct In-Lab Phlebotomy Bench &middot; #{activeBooking.bookingCode}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs text-center">
          <p className="text-xs font-bold text-emerald-700">
            Payment Verified by Cashier &middot; Ready at In-Lab Phlebotomy Bench
          </p>

          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 max-w-sm mx-auto">
            <div className="w-28 h-28 mx-auto bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-center">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">Walk-In Intake Code</span>
              <span className="font-mono text-xl font-black text-slate-900 tracking-wider">
                {activeBooking.bookingCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Present this code at <strong>{resolvedLabName}</strong> ({activeBooking.labAddress || 'Laboratory Reception'}). The in-lab phlebotomist will draw, barcode, and store your sample directly.
            </p>
          </div>

          <button
            onClick={onSampleDeliveredToLab}
            className="px-6 py-3.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-2xl text-xs font-black shadow-md cursor-pointer"
          >
            Open Live In-Lab Audit Timeline
          </button>
        </div>
      </div>
    );
  }

  // 4. PAID HOME PICKUP: REAL-TIME GOOGLE MAPS LIVE COURIER TRACKING + TWO-WAY CONFIRMATION
  const courierEnRoute = Boolean(
    activeBooking.locationSharingActive ||
      activeBooking.phlebotomistGpsActive ||
      activeBooking.transitStatus === 'en_route_to_patient' ||
      activeBooking.transitStatus === 'arrived_at_patient' ||
      activeBooking.phlebotomistConfirmedPickup
  );

  return (
    <div className="max-w-3xl mx-auto py-3 px-2 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-4">
      {/* Header Bar */}
      <div className="p-4 bg-slate-950 text-white rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-bold text-cyan-300 block">
              {courierEnRoute
                ? 'Live Google Maps Courier Tracking Active'
                : 'Paid & Queued for Mobile Phlebotomist Dispatch'}
            </span>
            <h2 className="text-base font-black text-white">
              {resolvedPhlebName} &middot; {resolvedLabName}
            </h2>
            <p className="text-[11px] text-slate-300 truncate max-w-md">
              Destination: {resolvedAddress}
            </p>
          </div>
        </div>

        {/* Direct Call Phlebotomist Button */}
        <a
          href={`tel:${resolvedPhlebPhone.replace(/\s+/g, '')}`}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shrink-0"
        >
          <Phone className="w-4 h-4" />
          <span className="font-mono">{resolvedPhlebPhone}</span>
        </a>
      </div>

      {/* Real-Time Google Maps View */}
      {courierEnRoute ? (
        <LiveCourierTrackingMap
          labCoords={labCoords}
          patientCoords={patientCoords}
          phlebotomistCoords={phlebotomistCoords}
          labName={resolvedLabName}
          phlebotomistName={resolvedPhlebName}
          trackingActive={true}
        />
      ) : (
        <div className="p-6 bg-white border border-slate-200 rounded-3xl text-center space-y-2 shadow-xs">
          <Navigation className="w-7 h-7 text-[#006978] mx-auto" />
          <h3 className="text-sm font-black text-slate-900">
            Waiting for Mobile Phlebotomist to Click "Go Pickup Sample"
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your home collection order (#{activeBooking.bookingCode}) is in the Mobile Phlebotomist's queue at <strong>{resolvedLabName}</strong>. As soon as the phlebotomist starts the trip and enables GPS location, their live movement appears on Google Maps right here.
          </p>
        </div>
      )}

      {/* Two-Way Sample Pickup Confirmation Card */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Two-Way Sample Pickup Confirmation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {activeBooking.phlebotomistConfirmedPickup
                ? `${resolvedPhlebName} has marked your sample as collected! Click below to confirm on your patient app so your sample status moves to In-Lab.`
                : 'Once the mobile phlebotomist arrives and draws your sample, confirm handover below. Live GPS tracking will stop immediately and your status will switch to In-Lab.'}
            </p>
          </div>
          <ShieldCheck className="w-6 h-6 text-[#006978] shrink-0" />
        </div>

        <button
          type="button"
          disabled={confirmingHandover}
          onClick={handleConfirmSamplePickedUpByPatient}
          className={`w-full py-3.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
            activeBooking.phlebotomistConfirmedPickup
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-[#006978] hover:bg-[#005a66] text-white'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>
            {confirmingHandover
              ? 'Confirming Sample Handover...'
              : 'Yes, Phlebotomist Has Picked Up My Sample'}
          </span>
        </button>
      </div>
    </div>
  );
};
