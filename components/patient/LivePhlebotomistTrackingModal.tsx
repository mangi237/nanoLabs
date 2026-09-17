import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  Thermometer, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  X, 
  Navigation, 
  ArrowUpRight,
  Sparkles,
  Lock,
  KeyRound,
  AlertTriangle
} from 'lucide-react';
import { TransitSession } from '../../types';
import { getLastSeenDescription, completeTransitTrip } from '../../services/transitTracker';

interface LivePhlebotomistTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  batchNumber?: string;
  patientName?: string;
  patientAddress?: string;
  transitSession?: TransitSession | null;
  onSampleIntakeCompleted?: () => void;
}

export const LivePhlebotomistTrackingModal: React.FC<LivePhlebotomistTrackingModalProps> = ({
  isOpen,
  onClose,
  batchId,
  batchNumber = 'BAT-2026-081',
  patientName = 'Patient M.',
  patientAddress = 'Akwa Nord, Douala, Cameroon',
  transitSession: initialTransit,
  onSampleIntakeCompleted
}) => {
  // Real-time animation coordinates
  const [progress, setProgress] = useState<number>(35); // percentage along route
  const [etaMinutes, setEtaMinutes] = useState<number>(initialTransit?.etaMinutes || 22);
  const [temperature, setTemperature] = useState<number>(initialTransit?.coldChainTemperatureCelsius || 4.2);
  const [showHandoverModal, setShowHandoverModal] = useState<boolean>(false);
  const [sampleCode, setSampleCode] = useState<string>(`SPEC-${batchNumber}`);
  const [securityPin, setSecurityPin] = useState<string>('4829');
  const [storageLocation, setStorageLocation] = useState<string>('ColdBox-A2 (EDTA / Heparin)');
  const [sampleType, setSampleType] = useState<string>('Venous Whole Blood');
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [isTerminated, setIsTerminated] = useState<boolean>(false);

  // Simulating subtle real-time movement along the polyline
  useEffect(() => {
    if (!isOpen || isTerminated) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92;
        return prev + 1;
      });
      setEtaMinutes((prev) => Math.max(1, prev - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, isTerminated]);

  if (!isOpen) return null;

  const handleConfirmSpecimenHandover = () => {
    setIsFinalizing(true);
    setTimeout(() => {
      completeTransitTrip(batchId);
      setIsFinalizing(false);
      setIsTerminated(true);
      setShowHandoverModal(false);
      if (onSampleIntakeCompleted) {
        onSampleIntakeCompleted();
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-700 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Turn-by-Turn Navigation Header Banner (from livephlebtracking.webp) */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-600/30">
              <Navigation className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">
                  {Math.max(1, Math.round(etaMinutes * 0.45))} km
                </span>
                <span className="text-slate-400 text-xs font-semibold">&bull; Hatfield Courtyard / Akwa Nord</span>
              </div>
              <p className="text-[11px] text-teal-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Live GPS Active &bull; Turn right onto Boulevard de la Liberté
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Interactive Route Map Canvas */}
        <div className="relative flex-1 min-h-[280px] bg-slate-950 overflow-hidden flex items-center justify-center">
          {/* Stylized vector road grid background */}
          <div className="absolute inset-0 opacity-25">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* SVG Map Route Polyline */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Background Route shadow */}
            <path
              d="M 60 80 Q 180 120, 240 180 T 420 230"
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Active Blue Route line */}
            <path
              d="M 60 80 Q 180 120, 240 180 T 420 230"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="6 3"
            />
          </svg>

          {/* Origin Marker (Lab Dispatch) */}
          <div className="absolute left-10 top-16 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-teal-400 text-teal-300 flex items-center justify-center text-xs font-bold shadow-lg">
              LAB
            </div>
            <span className="text-[9px] font-bold text-teal-300 mt-1 bg-slate-900/90 px-1.5 py-0.5 rounded">
              nanoLabs Central
            </span>
          </div>

          {/* Destination Marker (Patient Residence) */}
          <div className="absolute right-12 bottom-12 flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-300 mt-1 bg-slate-900/90 px-2 py-0.5 rounded-full border border-emerald-500/40">
              {patientName}
            </span>
          </div>

          {/* Animated Phlebotomist Courier Marker with Radar Wave */}
          {!isTerminated ? (
            <div 
              className="absolute z-20 flex flex-col items-center transition-all duration-1000 ease-out"
              style={{
                left: `${15 + progress * 0.65}%`,
                top: `${25 + progress * 0.45}%`
              }}
            >
              {/* Radar pulse wave */}
              <div className="absolute -inset-3 rounded-full bg-blue-500/30 animate-ping" />
              <div className="w-11 h-11 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center shadow-2xl relative z-10">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-white bg-blue-950/90 border border-blue-400/50 px-2 py-0.5 rounded-full mt-1 shadow-md">
                Phlebotomist En Route
              </span>
            </div>
          ) : (
            <div className="absolute z-20 p-4 bg-emerald-950/90 border border-emerald-500 rounded-2xl text-center space-y-1 shadow-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-extrabold text-sm text-white">Sample Delivered at Lab</p>
              <p className="text-[10px] text-emerald-300">Live GPS tracking terminated for clinical privacy.</p>
            </div>
          )}
        </div>

        {/* Bottom Sheet Card (from livephlebtracking.webp) */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{initialTransit?.phlebotomistName || 'M. Eric Mbida'}</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                  Certified Phlebotomist
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                nanoLabs Mobile Diagnostics &bull; ID: PHL-237-09
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${initialTransit?.phlebotomistPhone || '+237699442211'}`}
                className="w-10 h-10 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                title="Call Phlebotomist"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Metric Bar: ETA, Cold Chain, Specimen */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>ETA</span>
              </div>
              <div className="text-base font-mono font-bold text-white">
                {isTerminated ? 'Arrived' : `${etaMinutes} mins`}
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Thermometer className="w-3 h-3 text-emerald-400" />
                <span>Cold Chain</span>
              </div>
              <div className="text-base font-mono font-bold text-emerald-400">
                +{temperature}°C
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-400" />
                <span>Security PIN</span>
              </div>
              <div className="text-base font-mono font-bold text-teal-300">
                {securityPin}
              </div>
            </div>
          </div>

          {/* Handover & Sample Intake Confirmation Action (PRD Step 3) */}
          {!isTerminated ? (
            <button
              onClick={() => setShowHandoverModal(true)}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 cursor-pointer transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Confirm Sample Collection & Specimen Intake</span>
            </button>
          ) : (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 rounded-2xl text-center text-xs text-emerald-200">
              Diagnostic sample safely checked into Central Laboratory Reception.
            </div>
          )}
        </div>
      </div>

      {/* Sample Handover Details Modal (PRD Requirement: Sample Code, QR Code, Sample Type, Storage Location, Security PIN) */}
      {showHandoverModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-700 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Specimen Handover Verification</h3>
                  <p className="text-[11px] text-slate-400">Chain of Custody Handshake</p>
                </div>
              </div>
              <button
                onClick={() => setShowHandoverModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Sample Tube Barcode</span>
                <div className="text-sm font-mono font-bold text-teal-300 flex items-center justify-between">
                  <span>{sampleCode}</span>
                  <QrCode className="w-5 h-5 text-teal-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Sample Type</span>
                  <span className="font-bold text-white text-xs">{sampleType}</span>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Storage Location</span>
                  <span className="font-bold text-white text-xs">{storageLocation}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Security PIN</span>
                  <span className="text-xs text-slate-300">Provided by patient upon collection</span>
                </div>
                <div className="text-base font-mono font-black text-teal-300 bg-slate-900 px-3 py-1 rounded-xl border border-slate-700">
                  {securityPin}
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-950/60 border border-blue-800/60 rounded-xl text-[11px] text-blue-200 leading-tight">
              <Lock className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
              Per PRD Section 4, confirming collection checks in the specimen and terminates live GPS tracking upon lab arrival.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowHandoverModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSpecimenHandover}
                disabled={isFinalizing}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/30 flex items-center justify-center gap-1.5"
              >
                {isFinalizing ? (
                  <span>Saving Handover...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Specimen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePhlebotomistTrackingModal;
