import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  QrCode, 
  Building2, 
  Truck, 
  Sparkles, 
  Share2, 
  Download, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Phone,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';

interface SuccessScreenProps {
  bookingCode?: string;
  labName?: string;
  patientName?: string;
  sampleMode?: 'home' | 'lab';
  testsList?: { name: string; price?: number }[];
  totalAmount?: number;
  onBackToHome: () => void;
  onTrackLive?: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ 
  bookingCode = 'BK-991204',
  labName = 'Laboratoire Central Akwa - Douala',
  patientName,
  sampleMode = 'lab',
  testsList = [
    { name: 'Complete Blood Count (CBC)' },
    { name: 'Malaria Test (Thick smear)' }
  ],
  totalAmount = 8000,
  onBackToHome,
  onTrackLive
}) => {
  const { user } = useAuth();
  const { activeProfile } = useFamilyProfile();

  const effectivePatientName = patientName || activeProfile?.fullName || user?.name || 'Valued Patient';
  const isHomePickup = sampleMode === 'home';

  return (
    <div className="max-w-md mx-auto py-4 px-3 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-5">
      {/* Top Congratulatory Hero */}
      <div className="text-center space-y-2 pt-2">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Félicitations / Payment Approved!</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Order Confirmed & Settled
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Your laboratory diagnostic booking has been validated by the cashier and entered into our secure clinical pipeline.
          </p>
        </div>
      </div>

      {/* Official Digital Reception Intake Pass Card */}
      <div className="p-5 bg-white border-2 border-emerald-200 rounded-3xl shadow-md space-y-4 relative overflow-hidden">
        {/* Pass Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#006978] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-xs text-slate-900 truncate max-w-[170px]">{labName}</h4>
              <span className="text-[10px] text-slate-400 font-medium">Digital Intake Voucher</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
            CLEARED
          </span>
        </div>

        {/* QR Code and Pass Code */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-32 h-32 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-center">
            <QrCode className="w-full h-full text-slate-900" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Official Booking Pass Code
            </span>
            <span className="font-mono text-xl font-black text-[#006978] tracking-widest">
              {bookingCode}
            </span>
          </div>
        </div>

        {/* Patient Pre-Populated Credentials */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Patient:</span>
            <strong className="text-slate-900 font-bold">{effectivePatientName}</strong>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500">Collection Modality:</span>
            <span className="font-bold text-[#006978] flex items-center gap-1">
              {isHomePickup ? (
                <>
                  <Truck className="w-3.5 h-3.5" />
                  <span>Home Phlebotomist Pickup</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5" />
                  <span>In-Person Walk-in at Lab</span>
                </>
              )}
            </span>
          </div>

          <div className="pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Prescribed Diagnostic Tests:
            </span>
            <div className="flex flex-wrap gap-1">
              {testsList.map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-teal-50 text-[#006978] rounded-md text-[11px] font-bold border border-teal-100">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Reception Zero-Wait Instructions Banner */}
        <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl flex items-start gap-2.5 text-xs">
          <UserCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed text-slate-700">
            <p className="font-bold text-[#006978]">Show this screen to the Lab Receptionist</p>
            <p className="text-[11px] text-slate-600">
              When you arrive, the reception staff already have all your registration info, test catalog orders, and payment receipt on their screens for instant zero-wait accessioning.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {isHomePickup && onTrackLive ? (
          <button
            onClick={onTrackLive}
            className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4 text-cyan-200" />
            <span>Track Phlebotomist Real-Time GPS</span>
          </button>
        ) : (
          <button
            onClick={() => window.print()}
            className="w-full py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs rounded-2xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Save / Download Digital Pass</span>
          </button>
        )}

        <button
          onClick={onBackToHome}
          className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer text-center"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SuccessScreen;
