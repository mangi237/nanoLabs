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
  AlertCircle
} from 'lucide-react';

interface LiveTrackingScreenProps {
  onBack: () => void;
  onSampleDeliveredToLab: () => void;
  onOpenRiderView?: () => void;
  phlebotomistName?: string;
  etaMinutes?: number;
  distanceKm?: number;
  labName?: string;
}

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({
  onBack,
  onSampleDeliveredToLab,
  onOpenRiderView,
  phlebotomistName = 'M. Tchinda',
  etaMinutes = 12,
  distanceKm = 2.4,
  labName = 'BioSanté Lab'
}) => {
  const [trackingPhase, setTrackingPhase] = useState<'on_the_way' | 'arrived_sample_collected' | 'transit_to_lab'>('on_the_way');
  const [liveDistance, setLiveDistance] = useState(distanceKm);
  const [liveEta, setLiveEta] = useState(etaMinutes);

  // Live simulation of phlebotomist approaching
  useEffect(() => {
    if (trackingPhase === 'on_the_way') {
      const interval = setInterval(() => {
        setLiveDistance(prev => {
          if (prev <= 0.3) {
            setTrackingPhase('arrived_sample_collected');
            return 0.1;
          }
          return Number((prev - 0.2).toFixed(1));
        });
        setLiveEta(prev => Math.max(1, prev - 1));
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [trackingPhase]);

  const handlePatientConfirmCollection = () => {
    setTrackingPhase('transit_to_lab');
    // Once in transit to lab, within a few seconds specimen arrives in lab -> GPS stops & transitions to in-lab audit!
    setTimeout(() => {
      onSampleDeliveredToLab();
    }, 3500);
  };

  return (
    <div className="max-w-2xl mx-auto py-3 px-2 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Live GPS Phlebotomist Tracking
            </h1>
            <p className="text-[11px] text-slate-500">
              {trackingPhase === 'transit_to_lab' 
                ? 'Specimen in transit to laboratory &bull; GPS tracking active' 
                : 'Phlebotomist traveling to your pickup address'}
            </p>
          </div>
        </div>

        {onOpenRiderView && (
          <button
            onClick={onOpenRiderView}
            className="px-3.5 py-1.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Preview mobile phlebotomist screen (Rider Pickup)"
          >
            <span>Rider Pickup View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dynamic Status Banner */}
      <div className={`p-4 rounded-3xl border flex items-center justify-between shadow-xs transition-all ${
        trackingPhase === 'arrived_sample_collected'
          ? 'bg-amber-50 border-amber-300 text-amber-900'
          : trackingPhase === 'transit_to_lab'
          ? 'bg-purple-50 border-purple-300 text-purple-900'
          : 'bg-[#E0F2F1] border-[#80CBC4] text-[#006978]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
            trackingPhase === 'arrived_sample_collected' ? 'bg-amber-600' : trackingPhase === 'transit_to_lab' ? 'bg-purple-600' : 'bg-[#006978]'
          }`}>
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black">
              {trackingPhase === 'arrived_sample_collected' 
                ? 'Phlebotomist Has Arrived at Your Address' 
                : trackingPhase === 'transit_to_lab'
                ? 'Specimen En Route to Laboratory (+4°C)'
                : 'Phlebotomist on the way'}
            </h4>
            <p className="text-xs opacity-90 font-medium">
              {trackingPhase === 'arrived_sample_collected'
                ? 'Please confirm sample collection with phlebotomist'
                : trackingPhase === 'transit_to_lab'
                ? 'Arriving at lab in moments &bull; GPS tracking will stop upon lab entry'
                : `Arriving in ~${liveEta} min (${liveDistance} km away)`}
            </p>
          </div>
        </div>
        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
      </div>

      {/* Visual Live GPS Map Simulation */}
      <div className="relative h-72 sm:h-80 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
        {/* Map grid background */}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#006978_1px,transparent_1px)] [background-size:20px_20px]" />

        {/* Animated route trail */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 60 80 Q 180 140 260 110 T 480 220"
            fill="none"
            stroke="#006978"
            strokeWidth="5"
            strokeDasharray="8 8"
            className="animate-pulse"
          />
        </svg>

        {/* Origin: Performing Laboratory */}
        <div className="absolute left-8 sm:left-12 top-10 flex flex-col items-center">
          <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-md">
            <Building2 className="w-4 h-4 text-cyan-300" />
          </div>
          <span className="text-[10px] font-bold text-slate-800 bg-white/95 px-2 py-0.5 rounded-full shadow-2xs mt-1 border border-slate-200">
            {labName}
          </span>
        </div>

        {/* Moving Phlebotomist Pin */}
        <div className={`absolute transition-all duration-1000 flex flex-col items-center ${
          trackingPhase === 'arrived_sample_collected'
            ? 'right-16 bottom-16'
            : trackingPhase === 'transit_to_lab'
            ? 'left-24 top-16'
            : 'left-[48%] top-[38%]'
        }`}>
          <div className="w-11 h-11 rounded-2xl bg-[#006978] text-white flex items-center justify-center shadow-xl ring-4 ring-[#80CBC4]/60 animate-bounce">
            <Navigation className="w-5 h-5 text-cyan-200" />
          </div>
          <span className="text-[10px] font-black text-[#006978] bg-white px-2.5 py-0.5 rounded-full shadow-md mt-1 border border-slate-100">
            {phlebotomistName} ({liveDistance} km)
          </span>
        </div>

        {/* Destination: Patient Address */}
        <div className="absolute right-8 sm:right-14 bottom-10 flex flex-col items-center">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-800 bg-white/95 px-2 py-0.5 rounded-full shadow-2xs mt-1 border border-slate-200">
            Your Location
          </span>
        </div>
      </div>

      {/* Phlebotomist Profile & Communication Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <img
            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80"
            alt={phlebotomistName}
            className="w-13 h-13 rounded-2xl object-cover border border-slate-100 shrink-0"
          />
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">{phlebotomistName}</h4>
            <p className="text-xs text-slate-500 font-medium">Licensed Clinical Phlebotomist</p>
            <div className="flex items-center gap-2 text-[11px] text-[#006978] font-bold mt-0.5">
              <span>+4°C Certified Isothermal Courier</span>
              <span>&bull;</span>
              <span>Direct Link</span>
            </div>
          </div>
        </div>

        <a
          href="tel:+237699123456"
          className="w-11 h-11 rounded-2xl bg-[#E0F2F1] text-[#006978] hover:bg-[#006978] hover:text-white transition-colors flex items-center justify-center shadow-xs cursor-pointer shrink-0"
          title="Call Phlebotomist"
        >
          <Phone className="w-5 h-5" />
        </a>
      </div>

      {/* Confirmation Actions */}
      <div className="pt-2">
        {trackingPhase === 'arrived_sample_collected' ? (
          <button
            onClick={handlePatientConfirmCollection}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirm Sample Collected & Dispatch to Lab</span>
          </button>
        ) : trackingPhase === 'transit_to_lab' ? (
          <div className="p-4 bg-purple-50 text-purple-900 rounded-2xl border border-purple-200 text-center space-y-1">
            <span className="text-xs font-bold block">Specimen Arriving at Laboratory Intake</span>
            <p className="text-[11px] text-purple-700">
              Live GPS tracking ends now as the specimen enters the bench. Switching to in-lab stage audit tracking...
            </p>
          </div>
        ) : (
          <button
            onClick={() => setTrackingPhase('arrived_sample_collected')}
            className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Phlebotomist Has Arrived &bull; Proceed</span>
          </button>
        )}
      </div>
    </div>
  );
};
