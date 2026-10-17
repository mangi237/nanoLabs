import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Navigation, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight,
  Building2,
  Check,
  AlertCircle,
  Thermometer,
  MessageCircle,
  KeyRound,
  Lock,
  Share2,
  X,
  Compass,
  QrCode,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';

interface LiveTrackingScreenProps {
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
  onBack,
  onSampleDeliveredToLab,
  onOpenRiderView,
  onNavigateHome,
  phlebotomistName = 'Patrick M. (Certified Phlebotomist)',
  etaMinutes = 8,
  distanceKm = 1.8,
  labName = 'BioSanté Lab & Diagnostic Center'
}) => {
  const { user } = useAuth();
  const { activeProfile } = useFamilyProfile();

  // Check if patient actually has an active confirmed booking with home collection
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  useEffect(() => {
    const checkBooking = async () => {
      try {
        const { limsService } = await import('../../services/limsService');
        const labId = user?.labId || 'lab-1';
        const allBookings = await limsService.fetchAllBookings(labId);
        const match = allBookings.find(b => {
          const matchPid = b.patientPid === activeProfile.id || b.patientId === activeProfile.id;
          const matchName = b.patientName?.toLowerCase().trim() === activeProfile.fullName?.toLowerCase().trim();
          return (matchPid || matchName) && b.overallStatus !== 'Completed';
        });
        setActiveBooking(match || null);
      } catch (err) {
        console.warn('Error checking tracking booking:', err);
      } finally {
        setLoadingBooking(false);
      }
    };
    checkBooking();
  }, [user, activeProfile]);

  // Tracking phases: 'en_route' | 'turning' | 'arrived' | 'specimen_collected' | 'transit_to_lab'
  const [trackingPhase, setTrackingPhase] = useState<'en_route' | 'arrived' | 'specimen_collected' | 'transit_to_lab'>('en_route');
  const [liveDistance, setLiveDistance] = useState(distanceKm);
  const [liveEta, setLiveEta] = useState(etaMinutes);
  const [courierProgress, setCourierProgress] = useState(25); // percentage along path
  const [currentTip, setCurrentTip] = useState('Phlebotomist departing laboratory with isothermal transport container (+4°C)');
  const [temperature, setTemperature] = useState(4.2);

  // Two-way confirmation code
  const [confirmationCodeInput, setConfirmationCodeInput] = useState('');
  const expectedSecurityCode = '8429';
  const [codeError, setCodeError] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  // Contact Modal
  const [showContactModal, setShowContactModal] = useState(false);

  // Real-time animation: Courier moving along Douala route
  useEffect(() => {
    if (trackingPhase === 'en_route') {
      const interval = setInterval(() => {
        setCourierProgress(prev => {
          const next = prev + 8;
          if (next >= 40 && next < 65) {
            setCurrentTip('Arriving in ~4 minutes. Phlebotomist is turning onto Boulevard de la Liberté, Akwa.');
          } else if (next >= 65 && next < 90) {
            setCurrentTip('Phlebotomist approaching your street (near Rue Joss). Preparing sterile blood collection kits.');
          } else if (next >= 90) {
            setTrackingPhase('arrived');
            setCurrentTip('Phlebotomist has arrived at your address. Please provide the 4-digit confirmation code.');
            return 95;
          }
          return next;
        });

        setLiveDistance(prev => Math.max(0.1, Number((prev - 0.25).toFixed(1))));
        setLiveEta(prev => Math.max(1, prev - 1));
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [trackingPhase]);

  // Handle patient confirming specimen collection with two-way code
  const handleVerifyCodeAndConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationCodeInput.trim() === expectedSecurityCode || confirmationCodeInput.trim().length === 4) {
      setCodeVerified(true);
      setTrackingPhase('specimen_collected');
      setTimeout(() => {
        setTrackingPhase('transit_to_lab');
        setTimeout(() => {
          onSampleDeliveredToLab();
        }, 3000);
      }, 1500);
    } else {
      setCodeError(true);
      setTimeout(() => setCodeError(false), 3000);
    }
  };

  // IF NO ACTIVE BOOKING OR NOT CONFIRMED: Show clean non-tracking message
  if (!loadingBooking && !activeBooking) {
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
            Live Specimen Tracking
          </h1>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-[#006978] flex items-center justify-center mx-auto shadow-inner">
            <Compass className="w-8 h-8 text-slate-400" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900">
              No Active Home Pickup in Progress
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Live GPS courier tracking activates automatically as soon as a CEMAC partner laboratory confirms your diagnostic request and dispatches a certified phlebotomist.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-[#006978]" />
              <span>How Phlebotomy Tracking Works:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-500">
              <li>Request diagnostic tests with Home Sample Pickup.</li>
              <li>Lab cashier confirms payment and schedules an accredited courier.</li>
              <li>Follow the phlebotomist's motorcycle on an interactive GPS map right to your door.</li>
              <li>Confirm collection via your unique 4-digit Two-Way Security Code.</li>
            </ul>
          </div>

          <button
            onClick={onBack}
            className="px-6 py-3 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Return to Health Dashboard
          </button>
        </div>
      </div>
    );
  }

  // IF BOOKING IS WALK-IN (PHYSICAL LAB VISIT, NOT HOME PICKUP)
  if (activeBooking && !activeBooking.homeCollection) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 text-slate-900 animate-in fade-in duration-300 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Laboratory Intake Pass
            </h1>
            <p className="text-xs text-slate-500">
              In-Person Walk-in Sample Collection &bull; {activeBooking.labName || labName}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Payment Confirmed &bull; Sample Collection Ready</span>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 max-w-sm mx-auto">
            <div className="w-32 h-32 mx-auto bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-center">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Intake Access Code</span>
              <span className="font-mono text-xl font-black text-slate-900 tracking-wider">
                {activeBooking.bookingCode || 'LAB-8849'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Present this pass at the laboratory reception desk in Akwa, Douala. The phlebotomist will draw your blood samples immediately.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={onSampleDeliveredToLab}
              className="px-6 py-3 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
            >
              Sample Given &bull; Track In-Lab Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE HOME PICKUP: FULL-SCREEN COURIER GPS LIVE SCREEN
  return (
    <div className="max-w-4xl mx-auto min-h-[85vh] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-300">
      {/* 1. Header with Turn-by-Turn GPS HUD Banner */}
      <div className="p-4 bg-slate-950 text-white flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
              <Navigation className="w-5 h-5 rotate-45 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white font-mono">
                  {liveDistance} km
                </span>
                <span className="text-xs text-cyan-300 font-bold">
                  &bull; ~{liveEta} min away
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate max-w-xs sm:max-w-md">
                {currentTip}
              </p>
            </div>
          </div>
        </div>

        {/* Cold-Chain Temp & Third-Party Contact Button */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-cyan-300">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            <span>{temperature.toFixed(1)}°C</span>
          </div>

          <button
            onClick={() => setShowContactModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Call Phlebotomist</span>
            <span className="sm:hidden">Call</span>
          </button>
        </div>
      </div>

      {/* 2. Full-Size Interactive Live GPS Map Area */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-slate-900 overflow-hidden flex items-center justify-center">
        {/* Cartographic dark city grid pattern */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Realistic SVG Street Roads (Douala Akwa to Bonanjo) */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Main Boulevards */}
          <path
            d="M 50 120 L 220 180 L 450 160 L 680 280 L 850 340"
            fill="none"
            stroke="#334155"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M 220 180 L 300 360 L 520 400"
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
          />
          
          {/* Active Phlebotomist GPS Route Polyline */}
          <path
            d="M 60 120 Q 240 180 460 220 T 780 340"
            fill="none"
            stroke="#0284c7"
            strokeWidth="6"
            strokeDasharray="8 6"
            className="animate-pulse"
          />
        </svg>

        {/* Origin: Performing Accredited Laboratory */}
        <div className="absolute left-6 sm:left-12 top-10 flex flex-col items-center z-10">
          <div className="w-10 h-10 rounded-2xl bg-slate-800 border-2 border-slate-600 text-white flex items-center justify-center shadow-lg">
            <Building2 className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 bg-slate-950/90 px-2 py-0.5 rounded-full mt-1 border border-slate-700 shadow-md">
            {labName}
          </span>
        </div>

        {/* Moving Phlebotomist Motorcycle Pin (Follows Courier) */}
        <div 
          className="absolute transition-all duration-1000 flex flex-col items-center z-20 cursor-pointer"
          style={{
            left: `${Math.min(85, Math.max(15, courierProgress))}%`,
            top: `${Math.min(75, Math.max(25, 20 + courierProgress * 0.55))}%`
          }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-xl ring-4 ring-cyan-400/40 animate-bounce">
              <Navigation className="w-6 h-6 text-white rotate-45" />
            </div>
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 border-2 border-slate-900 animate-ping" />
          </div>

          <div className="bg-slate-950/95 text-cyan-200 border border-slate-700 px-3 py-1 rounded-full shadow-xl mt-1.5 flex items-center gap-1.5 text-[11px] font-black font-mono">
            <span>{phlebotomistName}</span>
            <span>&bull;</span>
            <span className="text-white">{liveDistance} km</span>
          </div>
        </div>

        {/* Destination: Patient Residence */}
        <div className="absolute right-6 sm:right-16 bottom-12 flex flex-col items-center z-10">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 border-2 border-emerald-400 text-white flex items-center justify-center shadow-xl">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 bg-slate-950/90 px-2 py-0.5 rounded-full mt-1 border border-slate-700 shadow-md">
            Your Residence (Akwa)
          </span>
        </div>

        {/* Floating Courier Live Details Card */}
        <div className="absolute bottom-4 inset-x-4 max-w-lg mx-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between text-xs text-white z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-cyan-300">
              PM
            </div>
            <div>
              <h4 className="font-bold text-slate-100">{phlebotomistName}</h4>
              <p className="text-[11px] text-slate-400">CEMAC Isothermal Courier &bull; License #CMR-PH-2026</p>
            </div>
          </div>

          <button
            onClick={() => setShowContactModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl transition-colors cursor-pointer"
            title="Courier Contact Information"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Action Panel: Two-Way Confirmation Code & Sample Handover */}
      <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3">
        {trackingPhase === 'arrived' ? (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <h4 className="text-sm font-black text-amber-950">
                  Phlebotomist Has Arrived &bull; Sample Collection
                </h4>
              </div>
              <span className="text-xs font-bold text-amber-800 font-mono">
                Code on Courier Phone: {expectedSecurityCode}
              </span>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed">
              To verify patient identity and protect biological chain of custody, enter the <strong>4-digit One-Time Security Code</strong> displayed on the phlebotomist's mobile screen:
            </p>

            <form onSubmit={handleVerifyCodeAndConfirm} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  maxLength={4}
                  value={confirmationCodeInput}
                  onChange={(e) => setConfirmationCodeInput(e.target.value)}
                  placeholder={`Enter 4-digit code (e.g. ${expectedSecurityCode})`}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-black text-slate-900 tracking-widest placeholder-slate-400 focus:outline-hidden focus:border-[#006978]"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Verify & Confirm Blood Draw</span>
              </button>
            </form>

            {codeError && (
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Invalid code. Please match the 4-digit security PIN shown on the phlebotomist screen.</span>
              </p>
            )}
          </div>
        ) : trackingPhase === 'specimen_collected' || trackingPhase === 'transit_to_lab' ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-black text-sm block">Sample Collected & Barcoded!</span>
                <span className="text-[11px] text-emerald-700">
                  Specimen securely locked in isothermal box (+4°C). Phlebotomist returning to lab bench...
                </span>
              </div>
            </div>
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-[#006978] shrink-0" />
              <span>Real-time courier GPS active &bull; Cold-chain temperature continuously monitored</span>
            </div>

            <button
              onClick={() => {
                setTrackingPhase('arrived');
                setCourierProgress(95);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Simulate Arrival
            </button>
          </div>
        )}
      </div>

      {/* 4. Contact Modal for Calling/Messaging Phlebotomist */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Contact Phlebotomist & Lab</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 block">{phlebotomistName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">+237 671 22 33 44</span>
                </div>
                <a
                  href="tel:+237671223344"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                >
                  Direct Call
                </a>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 block">WhatsApp Courier Chat</span>
                  <span className="text-[11px] text-slate-500">Send gate directions or live location</span>
                </div>
                <a
                  href="https://wa.me/237671223344"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl font-bold text-xs flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 block">{labName} Desk</span>
                  <span className="text-[11px] text-slate-500 font-mono">+237 233 42 10 00</span>
                </div>
                <a
                  href="tel:+237233421000"
                  className="px-3 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl font-bold text-xs"
                >
                  Call Lab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
