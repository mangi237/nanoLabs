import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  Navigation, 
  MapPin, 
  Compass, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  MoreVertical,
  Clock,
  ThermometerSnowflake,
  AlertCircle
} from 'lucide-react';

interface PhlebotomistPickupScreenProps {
  onBack: () => void;
  booking?: any;
  onConfirmPickup?: () => void;
}

export const PhlebotomistPickupScreen: React.FC<PhlebotomistPickupScreenProps> = ({
  onBack,
  booking,
  onConfirmPickup
}) => {
  const patientName = booking?.patientName || 'Mme. Chantal Ndongo';
  const patientPhone = booking?.patientPhone || '+237 670 12 34 56';
  const pickupLocation = booking?.pickupLocation || 'Boulevard de la Liberté, Akwa, Douala';
  const testsList = booking?.tests?.map((t: any) => t.name || t.testName).join(', ') || 'Complete Blood Count (CBC), Malaria Thick Smear';

  const [pickupStatus, setPickupStatus] = useState<'en_route' | 'picked_up' | 'delivered_to_lab'>('en_route');
  const [slideProgress, setSlideProgress] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const handleSlideComplete = () => {
    if (pickupStatus === 'en_route') {
      setPickupStatus('picked_up');
      if (onConfirmPickup) onConfirmPickup();
    } else if (pickupStatus === 'picked_up') {
      setPickupStatus('delivered_to_lab');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-[92vh] flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-slate-200 animate-in fade-in duration-300">
      {/* Top Banner Notice - Matching User Screenshot Title */}
      <div className="bg-[#FF6A00] text-white px-4 py-3 text-center shadow-xs">
        <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase">
          RIDER PHLEBOTOMIST DISPATCH
        </h2>
        <p className="text-[10px] text-white/90 font-bold uppercase tracking-tight">
          {pickupStatus === 'en_route'
            ? 'Rider gets to patient address and marks status as pickup'
            : pickupStatus === 'picked_up'
            ? 'Specimen secured at +4°C • En route to certified laboratory'
            : 'Specimen successfully delivered to laboratory intake'}
        </p>
      </div>

      {/* App Header & Pickup Location Card */}
      <div className="p-4 bg-white border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-800">COURIER GPS LIVE</span>
          </div>
          <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Pickup Location Row */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Pickup Location
          </span>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
            {pickupLocation}
          </h3>
        </div>
      </div>

      {/* Patient / Passenger Details Card - Matching Mockup */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#006978] text-white flex items-center justify-center font-black text-base shadow-xs shrink-0 border-2 border-white">
            {patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{patientName}</h4>
            <span className="text-[10px] text-[#FF6A00] font-black uppercase tracking-wider block">
              Patient Details &bull; 80% Insured
            </span>
            <span className="text-[10px] text-slate-500 line-clamp-1 max-w-[180px]">
              {testsList}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`tel:${patientPhone}`}
            className="w-10 h-10 rounded-full border border-slate-300 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 flex items-center justify-center transition-colors shadow-2xs"
            title="Call Patient"
          >
            <Phone className="w-4 h-4" />
          </a>
          <button
            onClick={() => alert(`Starting direct communication channel with ${patientName}`)}
            className="w-10 h-10 rounded-full border border-slate-300 bg-white hover:bg-[#E0F2F1] text-slate-700 hover:text-[#006978] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
            title="Message Patient"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Map Viewport - Styled Exactly Like Ride App */}
      <div className="relative flex-1 min-h-[340px] bg-[#E5E3DF] overflow-hidden flex items-center justify-center">
        {/* Map Grid Pattern */}
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Road Labels Simulation */}
        <div className="absolute left-6 top-8 text-[9px] font-bold text-slate-500 tracking-wider rotate-[-15deg] select-none">
          BD DE LA LIBERTÉ
        </div>
        <div className="absolute right-10 bottom-24 text-[9px] font-bold text-slate-500 tracking-wider rotate-[30deg] select-none">
          RUE DES PALMIERS
        </div>
        <div className="absolute left-1/3 top-1/2 text-[10px] font-black text-slate-400 tracking-widest select-none">
          SECTOR AKWA
        </div>

        {/* Route Line SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 80 280 L 140 250 L 180 180 L 260 170 L 290 90"
            fill="none"
            stroke="#1E293B"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 80 280 L 140 250 L 180 180 L 260 170 L 290 90"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeDasharray="6 6"
            className="animate-pulse"
          />
        </svg>

        {/* Phlebotomist Pin (Origin / Moving) */}
        <div className={`absolute transition-all duration-700 flex flex-col items-center ${
          pickupStatus === 'picked_up' ? 'right-[22%] top-[18%]' : 'left-16 bottom-16'
        }`}>
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg ring-4 ring-white animate-bounce">
            <Navigation className="w-4 h-4 text-white rotate-45" />
          </div>
          <span className="text-[9px] font-black bg-white px-2 py-0.5 rounded-full shadow-md mt-1 text-slate-800 border border-slate-200">
            Rider M. Tchinda
          </span>
        </div>

        {/* Destination Pin: Patient Pickup Location */}
        <div className="absolute right-14 top-14 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl ring-4 ring-rose-200">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-black bg-white text-rose-700 px-2 py-0.5 rounded-full shadow-md mt-1 border border-rose-100">
            Patient Pickup
          </span>
        </div>

        {/* Right Floating Map Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
          {/* Compass */}
          <button className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex flex-col items-center justify-center text-[9px] font-black text-slate-700">
            <Compass className="w-4 h-4 text-rose-500" />
            <span>N</span>
          </button>

          {/* Navigation Target */}
          <button className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-800 hover:bg-slate-50 cursor-pointer">
            <Navigation className="w-4 h-4 text-slate-900" />
          </button>

          {/* Cancel Ride Button */}
          <button
            onClick={() => onBack()}
            className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex flex-col items-center justify-center text-rose-600 hover:bg-rose-50 cursor-pointer"
            title="Cancel Dispatch"
          >
            <X className="w-4 h-4" />
            <span className="text-[7px] font-black uppercase leading-none">Cancel</span>
          </button>
        </div>

        {/* Temperature Cold-Chain Badge */}
        <div className="absolute left-4 bottom-4 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-2xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-800">
          <ThermometerSnowflake className="w-4 h-4 text-[#006978]" />
          <span>Isothermal Carrier: <strong className="text-emerald-700">+3.8°C</strong></span>
        </div>
      </div>

      {/* Bottom Interactive Slide Action - Exactly Matching Screenshot */}
      <div className="p-4 bg-[#0A192F] text-white">
        {pickupStatus === 'en_route' ? (
          <div
            onClick={handleSlideComplete}
            className="w-full bg-[#1E3A8A] hover:bg-[#1D4ED8] rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-lg select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:translate-x-2 transition-transform">
              <ChevronRight className="w-6 h-6 text-white stroke-[3]" />
            </div>
            <span className="text-sm font-black tracking-wider uppercase text-white">
              Slide to Pickup &bull; Confirm Arrival
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-xs font-black">
              ✓
            </div>
          </div>
        ) : pickupStatus === 'picked_up' ? (
          <div
            onClick={handleSlideComplete}
            className="w-full bg-emerald-700 hover:bg-emerald-800 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-lg select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:translate-x-2 transition-transform">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white">
              Slide to Deliver Specimen to Laboratory
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">
              →
            </div>
          </div>
        ) : (
          <div className="w-full bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-3.5 text-center text-xs font-bold text-emerald-200">
            ✓ Specimen Delivered & Signed at Laboratory Reception
          </div>
        )}
      </div>
    </div>
  );
};
