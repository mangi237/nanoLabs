import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  Thermometer, 
  Clock, 
  Phone, 
  Barcode, 
  CheckCircle2, 
  Search, 
  Building2, 
  RefreshCw,
  Navigation,
  Check,
  FlaskConical,
  X,
  Crosshair,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { limsService, PatientBooking } from '../../services/limsService';
import { LiveCourierTrackingMap } from '../../components/maps/GoogleMapsWidgets';
import { isLabMobilePhlebotomyEnabled } from '../../utils/labPackages';

interface SpecimenModalData {
  booking: PatientBooking;
  isHome: boolean;
}

const DEFAULT_LAB_COORDS = { lat: 4.0511, lng: 9.7679 };

export const PhlebotomyDispatchScreen: React.FC = () => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';
  const mobilePhlebEnabled = isLabMobilePhlebotomyEnabled(lab);
  const isAdmin =
    ['admin', 'superadmin', 'administrator', 'lab_admin', 'manager'].includes(String(user?.role || '').toLowerCase()) ||
    (Array.isArray(user?.roles) && user.roles.includes('admin'));

  const [activeTab, setActiveTab] = useState<'home_requests' | 'active_transits'>('home_requests');
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [watchingBookingId, setWatchingBookingId] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Specimen Collection Modal State
  const [collectingModal, setCollectingModal] = useState<SpecimenModalData | null>(null);
  const [selectedTubes, setSelectedTubes] = useState<string[]>(['Purple EDTA (Whole Blood / CBC / HbA1c)']);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [fastingStatus, setFastingStatus] = useState<boolean>(true);
  const [coldBoxTemp, setColdBoxTemp] = useState<number>(4.2);
  const [collectionNotes, setCollectionNotes] = useState<string>('Standard venipuncture completed. Specimen intact.');
  const [isSubmittingCollection, setIsSubmittingCollection] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const dutyPhlebotomistName = user?.name || 'Eric Mbida (Mobile Phlebotomist)';
  const dutyPhlebotomistPhone = user?.phone || '+237 699 44 22 11';

  const TUBE_TYPES_PRESETS = [
    { id: 'edta', label: 'Purple EDTA (Whole Blood / CBC / HbA1c)', color: 'border-purple-300 bg-purple-50 text-purple-900' },
    { id: 'serum', label: 'Red / Gold SST (Serum / Biochemistry / Serology)', color: 'border-amber-300 bg-amber-50 text-amber-900' },
    { id: 'citrate', label: 'Light Blue Citrate (Coagulation / PT / PTT)', color: 'border-blue-300 bg-blue-50 text-blue-900' },
    { id: 'fluoride', label: 'Grey Fluoride (Fasting Blood Sugar / Lactate)', color: 'border-slate-300 bg-slate-50 text-slate-900' },
    { id: 'urine', label: 'Sterile Urine Container (Midstream / Culture)', color: 'border-yellow-300 bg-yellow-50 text-yellow-900' },
    { id: 'swab', label: 'Sterile Viral / Bacterial Swab with Transport Medium', color: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
  ];

  const loadBookings = async () => {
    try {
      setLoading(true);
      const all = await limsService.fetchAllBookings(targetLabId);
      setBookings(all);
    } catch (e) {
      console.error('Failed to load bookings in phlebotomy:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const unsub = limsService.subscribeToBookings(targetLabId, (updated) => {
      setBookings(updated);
      setLoading(false);
    });
    return () => {
      unsub();
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [targetLabId]);

  const stopGpsWatch = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatchingBookingId(null);
  };

  // Pending Home Collection Requests: strictly PAID home-collection bookings for THIS lab & courier
  const homeRequests = bookings.filter((b) => {
    const belongsToLab = !b.labId || b.labId === targetLabId;
    const isHome = Boolean(b.homeCollection || (b as any).collectionType === 'home' || b.pickupLocation);
    const isPaid = b.paymentStatus === 'paid';
    const handedOverToLab = Boolean(b.sampleHandoverVerified || b.transitStatus === 'arrived_at_lab' || b.sampleCollected);

    // If a non-admin mobile phlebotomist is logged in, show unassigned pickups for their lab OR pickups assigned to them
    const assignedCourier = String(b.phlebotomistName || '').trim().toLowerCase();
    const currentCourier = String(dutyPhlebotomistName || '').trim().toLowerCase();
    const belongsToCourier =
      isAdmin || !assignedCourier || assignedCourier === currentCourier || assignedCourier.includes(String(user?.name || '').trim().toLowerCase());

    const matchesSearch =
      String(b.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(b.bookingCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(b.pickupLocation || '').toLowerCase().includes(searchQuery.toLowerCase());

    return belongsToLab && belongsToCourier && isHome && isPaid && !handedOverToLab && b.overallStatus !== 'Completed' && matchesSearch;
  });

  // Active live GPS transits
  const activeTransits = homeRequests.filter((b) =>
    Boolean(b.locationSharingActive || b.phlebotomistGpsActive || b.transitStatus === 'en_route_to_patient' || b.phlebotomistSamplePickedUp)
  );

  const handleGoPickupSample = async (booking: PatientBooking) => {
    const effectiveLabId = booking.labId || targetLabId;
    const labOrigin = (lab as any)?.coordinates || DEFAULT_LAB_COORDS;

    const beginTripWithCoords = async (startCoords: { lat: number; lng: number }) => {
      await limsService.startHomePickupTrip({
        labId: effectiveLabId,
        bookingId: booking.id,
        phlebotomistName: dutyPhlebotomistName,
        phlebotomistPhone: dutyPhlebotomistPhone,
        initialCoords: startCoords,
        etaText: '12 mins'
      });
      setWatchingBookingId(booking.id);
      setSuccessToast(`Live GPS sharing enabled for ${booking.patientName}! Patient can now track your movement & call ${dutyPhlebotomistPhone}.`);
      setTimeout(() => setSuccessToast(null), 5000);
      loadBookings();
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          await beginTripWithCoords(coords);
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }
          watchIdRef.current = navigator.geolocation.watchPosition(
            (livePos) => {
              limsService.updatePhlebotomistLiveLocation(
                effectiveLabId,
                booking.id,
                { lat: livePos.coords.latitude, lng: livePos.coords.longitude }
              );
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 5000 }
          );
        },
        async () => {
          await beginTripWithCoords(labOrigin);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      await beginTripWithCoords(labOrigin);
    }
  };

  const handleSimulateMovementStep = async (booking: PatientBooking) => {
    const effectiveLabId = booking.labId || targetLabId;
    const patientTarget = booking.userCoords || (booking as any).gpsCoordinates || { lat: 4.0565, lng: 9.7582 };
    const current = booking.phlebotomistCoords || DEFAULT_LAB_COORDS;
    const nextCoords = {
      lat: Number((current.lat + (patientTarget.lat - current.lat) * 0.35).toFixed(6)),
      lng: Number((current.lng + (patientTarget.lng - current.lng) * 0.35).toFixed(6))
    };
    await limsService.updatePhlebotomistLiveLocation(effectiveLabId, booking.id, nextCoords, '5 mins');
    loadBookings();
  };

  const handleConfirmSamplePickedUp = async (booking: PatientBooking) => {
    const effectiveLabId = booking.labId || targetLabId;
    await limsService.confirmPhlebotomistSamplePickedUp(
      effectiveLabId,
      booking.id,
      booking.phlebotomistName || dutyPhlebotomistName
    );
    stopGpsWatch();
    setSuccessToast(
      `Sample pickup confirmed for ${booking.patientName}! Once the patient also taps "Yes, Sample Picked Up" on their app, live GPS stops and the sample moves to In-Lab Phlebotomy.`
    );
    setTimeout(() => setSuccessToast(null), 6000);
    loadBookings();
  };

  const handleConfirmCollection = async () => {
    if (!collectingModal) return;
    setIsSubmittingCollection(true);

    try {
      const { booking } = collectingModal;
      const collector = user?.name || dutyPhlebotomistName;

      await limsService.completeSampleCollection({
        labId: booking.labId || targetLabId,
        bookingId: booking.id,
        collectedSamples: selectedTubes,
        collectorName: collector,
        collectorAccessCode: 'PHLEB-VERIFIED-PIN',
        sampleBarcode: scannedBarcode,
        storageLocation: 'Mobile ColdBox Alpha (+4°C)',
        testStorageMap: (booking.tests || []).reduce((acc: any, t) => {
          acc[t.id || t.testName] = {
            storageLocation: 'Mobile ColdBox Alpha (+4°C)',
            sampleType: selectedTubes[0] || 'Venous Whole Blood',
            sampleBarcode: scannedBarcode
          };
          return acc;
        }, {})
      });

      setSuccessToast(`Specimen ${scannedBarcode} logged and handed over to In-Lab Bench!`);
      setTimeout(() => setSuccessToast(null), 4000);
      setCollectingModal(null);
      loadBookings();
    } catch (e) {
      console.error('Collection error:', e);
    } finally {
      setIsSubmittingCollection(false);
    }
  };

  if (!mobilePhlebEnabled) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Mobile Phlebotomist Not Enabled for This Lab</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong>{lab?.name || 'This laboratory'}</strong> is configured for <strong>Walk-In Sample Collection Only</strong> and did not opt into Mobile Phlebotomist (Home Sample Pickup) during account setup.
        </p>
        <p className="text-xs text-slate-400">
          Lab Administrators can enable Mobile Phlebotomist Home Sample Pickup anytime from <strong>Overview &rarr; Recharge / Subscription Settings</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      {/* SUCCESS TOAST */}
      {successToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="p-1 hover:bg-emerald-700 rounded-lg text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* HEADER HERO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0D3B38] to-[#0A2624] text-white p-6 rounded-3xl shadow-xl border border-teal-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-400/30">
              Mobile Phlebotomist Workstation
            </span>
            <span className="text-xs text-teal-200">• Live Google Maps GPS & Cold-Chain</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pending Home Sample Collection Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/80 max-w-2xl">
            Click &ldquo;Go Pickup Sample&rdquo; to turn on live GPS location sharing so the patient sees your movement in real time. Once drawn, both you and the patient confirm handover to transfer custody to the In-Lab Phlebotomist.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBookings}
            className="p-2.5 bg-teal-800/50 hover:bg-teal-700/50 rounded-2xl border border-teal-600/50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('home_requests')}
            className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'home_requests'
                ? 'bg-[#0D3B38] text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Pending Home Collection Requests ({homeRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('active_transits')}
            className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'active_transits'
                ? 'bg-[#0D3B38] text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>Active Live GPS Trips ({activeTransits.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search patient, code, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PENDING HOME COLLECTION REQUESTS                  */}
      {/* ======================================================== */}
      {activeTab === 'home_requests' && (
        <div className="space-y-4">
          {homeRequests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2 shadow-xs">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-sm text-slate-800">No Paid Home Collection Requests Pending</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Once the Cashier verifies an online patient&apos;s payment for a Home Pickup order, it automatically appears here for live GPS sample collection. Walk-in patients bypass this screen and go directly to the In-Lab Phlebotomist.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {homeRequests.map((b) => {
                const isEnRoute = Boolean(b.locationSharingActive || b.phlebotomistGpsActive || b.transitStatus === 'en_route_to_patient');
                const phlebConfirmed = Boolean(b.phlebotomistSamplePickedUp);
                const patientConfirmed = Boolean(b.patientSampleHandoverConfirmed);
                const patientPin = b.userCoords || (b as any).gpsCoordinates || { lat: 4.0565, lng: 9.7582 };
                const labOrigin = DEFAULT_LAB_COORDS;

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-mono text-xs font-black text-teal-900">{b.bookingCode}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          phlebConfirmed
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : isEnRoute
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {phlebConfirmed
                            ? (patientConfirmed ? 'Handover Verified' : 'Awaiting Patient App Confirmation')
                            : isEnRoute
                            ? 'Live GPS Active • En Route'
                            : 'Paid • Ready for Home Pickup'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">{b.patientName}</h3>
                          <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <a href={`tel:${b.patientPhone}`} className="hover:underline text-teal-700 font-bold">
                              {b.patientPhone || 'No phone recorded'}
                            </a>
                          </p>
                        </div>
                        <div className="text-right text-[11px]">
                          <span className="text-slate-400 block">Courier Contact Shown to Patient</span>
                          <strong className="font-mono text-slate-800">{b.phlebotomistPhone || dutyPhlebotomistPhone}</strong>
                        </div>
                      </div>

                      {/* Address & Google Maps Coordinates */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-start gap-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-900">{b.pickupLocation || 'Pinned Patient Home Location'}</span>
                            {b.landmark && (
                              <p className="text-[11px] text-slate-500">Landmark: {b.landmark}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono pl-6">
                          Google Maps Pin: {Number(patientPin?.lat || 4.0565).toFixed(5)}, {Number(patientPin?.lng || 9.7582).toFixed(5)}
                        </div>
                      </div>

                      {/* Live Route Map when GPS sharing is active */}
                      {(isEnRoute && !b.sampleHandoverVerified) && (
                        <div className="space-y-2">
                          <LiveCourierTrackingMap
                            labCoords={labOrigin}
                            patientCoords={patientPin}
                            phlebotomistCoords={b.phlebotomistCoords || labOrigin}
                            labName={b.labName || lab?.name || 'Laboratory'}
                            phlebotomistName={b.phlebotomistName || dutyPhlebotomistName}
                            trackingActive={true}
                          />
                          <div className="flex items-center justify-between text-[11px] bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
                            <span className="font-bold text-teal-900 flex items-center gap-1.5">
                              <Crosshair className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
                              {watchingBookingId === b.id ? 'Streaming live device GPS to patient' : 'Live GPS pin active on patient map'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSimulateMovementStep(b)}
                              className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-lg font-bold text-[10px] cursor-pointer"
                            >
                              Advance Courier Pin →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Ordered Tests */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Tests to Draw:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {b.tests?.map((t) => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 bg-teal-50 text-teal-900 rounded-lg text-xs font-semibold border border-teal-200"
                            >
                              {t.testName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* TWO-STEP MOBILE PHLEBOTOMY ACTIONS */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {!isEnRoute && !phlebConfirmed ? (
                        <button
                          type="button"
                          onClick={() => handleGoPickupSample(b)}
                          className="w-full py-3 bg-gradient-to-r from-[#006978] to-teal-700 hover:from-[#005a66] hover:to-teal-600 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-4 h-4 text-cyan-200" />
                          <span>Go Pickup Sample (Turn On Live GPS Location)</span>
                        </button>
                      ) : !phlebConfirmed ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmSamplePickedUp(b)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>I Have Picked Up the Sample</span>
                        </button>
                      ) : (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900 space-y-1">
                          <div className="font-extrabold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-purple-700" />
                            <span>You confirmed sample pickup!</span>
                          </div>
                          <p className="text-[11px] text-purple-800">
                            Waiting for <strong>{b.patientName}</strong> to tap <em>&ldquo;Yes, Sample Picked Up&rdquo;</em> on their app to finalize custody handover to the In-Lab Phlebotomist.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ACTIVE LIVE GPS TRANSITS                          */}
      {/* ======================================================== */}
      {activeTab === 'active_transits' && (
        <div className="space-y-4">
          {activeTransits.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2 shadow-xs">
              <Navigation className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-sm text-slate-800">No Couriers Currently Sharing Live GPS</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click &ldquo;Go Pickup Sample&rdquo; on a paid home collection request to broadcast real-time GPS movement to the patient.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTransits.map((b) => {
                const patientPin = b.userCoords || (b as any).gpsCoordinates || { lat: 4.0565, lng: 9.7582 };
                return (
                  <div key={b.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-teal-900">{b.bookingCode}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            Live GPS Active
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">
                          Patient: {b.patientName} &bull; Phlebotomist: {b.phlebotomistName || dutyPhlebotomistName}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.pickupLocation || 'Pinned Patient Location'}</span>
                        </p>
                      </div>

                      {!b.phlebotomistSamplePickedUp && (
                        <button
                          type="button"
                          onClick={() => handleConfirmSamplePickedUp(b)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>I Have Picked Up the Sample</span>
                        </button>
                      )}
                    </div>

                    <LiveCourierTrackingMap
                      labCoords={DEFAULT_LAB_COORDS}
                      patientCoords={patientPin}
                      phlebotomistCoords={b.phlebotomistCoords || DEFAULT_LAB_COORDS}
                      labName={b.labName || lab?.name || 'Laboratory'}
                      phlebotomistName={b.phlebotomistName || dutyPhlebotomistName}
                      trackingActive={!b.sampleHandoverVerified}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cold Chain Box</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-emerald-700">+4.2°C</div>
                        <p className="text-[10px] text-emerald-800">ISO Target: +2°C to +8°C</p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Estimated Arrival</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-slate-900">{b.phlebotomistEta || '12 mins'}</div>
                        <p className="text-[10px] text-slate-500">Courier Tel: {b.phlebotomistPhone || dutyPhlebotomistPhone}</p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Handover Status</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 pt-1">
                          {b.phlebotomistSamplePickedUp ? 'Courier Confirmed • Awaiting Patient' : 'En Route to Patient'}
                        </div>
                        <p className="text-[10px] text-slate-500">Two-way verification active</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SPECIMEN COLLECTION & HANDOVER MODAL                     */}
      {/* ======================================================== */}
      {collectingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/30">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Specimen Collection & Lab Handover</h3>
                  <p className="text-xs text-slate-500">{collectingModal.booking.patientName} &bull; {collectingModal.booking.bookingCode}</p>
                </div>
              </div>
              <button
                onClick={() => setCollectingModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Ordered Diagnostic Tests:</span>
                <div className="flex flex-wrap gap-1">
                  {collectingModal.booking.tests?.map((t) => (
                    <span key={t.id} className="px-2 py-0.5 bg-teal-100 text-teal-900 rounded font-bold">
                      {t.testName}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Required Specimen Collection Tubes & Matrices:</label>
                <div className="space-y-1.5">
                  {TUBE_TYPES_PRESETS.map((tube) => {
                    const isSelected = selectedTubes.includes(tube.label);
                    return (
                      <button
                        key={tube.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedTubes.length > 1) {
                              setSelectedTubes(selectedTubes.filter((t) => t !== tube.label));
                            }
                          } else {
                            setSelectedTubes([...selectedTubes, tube.label]);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected ? `${tube.color} font-bold shadow-xs` : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span>{tube.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Primary Tube Barcode ID:</label>
                  <input
                    type="text"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cold Chain Box Temp (°C):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={coldBoxTemp}
                    onChange={(e) => setColdBoxTemp(parseFloat(e.target.value) || 4.0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastingStatus}
                    onChange={(e) => setFastingStatus(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="font-medium text-slate-700">Patient in 8h-12h Fasting State (À Jeun)</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Accessioning Notes:</label>
                <input
                  type="text"
                  value={collectionNotes}
                  onChange={(e) => setCollectionNotes(e.target.value)}
                  placeholder="Notes on venipuncture quality, tube filling, etc."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCollectingModal(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCollection}
                disabled={isSubmittingCollection}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-700/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                <span>{isSubmittingCollection ? 'Handing over...' : 'Confirm & Handover'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhlebotomyDispatchScreen;
