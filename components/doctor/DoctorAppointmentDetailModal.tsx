import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  Check, 
  X, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Sparkles,
  Phone,
  Video,
  CreditCard
} from 'lucide-react';
import { formatXAF } from '../../shared/money';

export interface DoctorAppointmentRecord {
  id: string;
  reservationCode: string;
  doctorName: string;
  specialty: string;
  facilityName: string;
  distanceKm: string;
  rating: number;
  reviewsCount: number;
  address: string;
  treatmentName: string;
  treatmentCategory: 'SINGLE' | 'MULTIPLE';
  durationHours: number;
  clinicalNote: string;
  date: string;
  time: string;
  status: 'Registered' | 'Rescheduled' | 'Completed' | 'In Progress';
  mode: 'in_person' | 'teleconsultation';
  billAmount: number;
  copayAmount: number;
  paymentStatus: 'Paid' | 'Pending at Cashier';
}

interface DoctorAppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: DoctorAppointmentRecord;
  onRescheduleSuccess?: (updated: DoctorAppointmentRecord) => void;
}

export const DoctorAppointmentDetailModal: React.FC<DoctorAppointmentDetailModalProps> = ({
  isOpen,
  onClose,
  appointment: initialAppt,
  onRescheduleSuccess
}) => {
  const [appt, setAppt] = useState<DoctorAppointmentRecord>(initialAppt);
  const [activeTab, setActiveTab] = useState<'reservation' | 'bill'>('reservation');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<string>('THU 15');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00 AM');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [previousTimeState, setPreviousTimeState] = useState<string>('');

  if (!isOpen) return null;

  const days = [
    { label: 'TUE 13', isFull: true, sub: 'FULL' },
    { label: 'TODAY', isFull: false, sub: 'WED 14' },
    { label: 'THU 15', isFull: false, sub: 'AVAILABLE' },
    { label: 'FRI 16', isFull: false, sub: 'AVAILABLE' },
    { label: 'SAT 17', isFull: false, sub: 'LIMITED' }
  ];

  const morningSlots = ['09:00 AM', '10:00 AM'];
  const daySlots = ['13:00 PM', '14:00 PM', '15:00 PM'];
  const eveningSlots = ['16:00 PM', '17:00 PM'];

  const handleConfirmReschedule = () => {
    setPreviousTimeState(`${appt.date} • ${appt.time}`);
    const updated: DoctorAppointmentRecord = {
      ...appt,
      status: 'Rescheduled',
      date: `Jun 15, 2026`,
      time: selectedTimeSlot
    };
    setAppt(updated);
    setIsRescheduling(false);
    setShowSuccessModal(true);
    if (onRescheduleSuccess) {
      onRescheduleSuccess(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Schedule Detail
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              #{appt.reservationCode}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: Reservation detail & Bill detail (from doctorAppointmentui.webp) */}
        <div className="flex px-4 pt-3 border-b border-slate-100 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('reservation')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reservation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Reservation detail
          </button>
          <button
            onClick={() => setActiveTab('bill')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'bill'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Bill detail
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'reservation' ? (
            <>
              {/* Doctor / Clinic Information Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {appt.facilityName}
                    </h3>
                    <p className="text-xs text-slate-500">{appt.doctorName} &bull; {appt.specialty}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                    {appt.distanceKm} away
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-800">{appt.rating}</span>
                  <span className="text-slate-400">({appt.reviewsCount} reviews)</span>
                </div>

                {/* Map Preview Box */}
                <div className="relative h-28 rounded-xl overflow-hidden bg-slate-200 border border-slate-300/80 flex items-center justify-center group">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50/50 to-slate-200" />
                  <div className="relative z-10 flex flex-col items-center text-center p-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg animate-bounce">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 mt-1 bg-white/90 px-2.5 py-0.5 rounded-full shadow-xs">
                      {appt.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Treatment / Diagnostic Consultation Information */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Treatment Information
                  </h4>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                    {appt.treatmentCategory}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-900">{appt.treatmentName}</p>
                  <p className="text-xs text-slate-500">Estimate duration &bull; {appt.durationHours} hour</p>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-800">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Clinical Consultation Note</span>
                  </div>
                  <p className="text-[11px] text-blue-950/80 leading-relaxed">
                    {appt.clinicalNote}
                  </p>
                </div>
              </div>

              {/* Schedule Timing & Reschedule Trigger */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Reserved Slot</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">
                    {appt.date} &bull; {appt.time}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600">
                    &bull; {appt.status}
                  </span>
                </div>

                <button
                  onClick={() => setIsRescheduling(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Reschedule
                </button>
              </div>
            </>
          ) : (
            /* Bill Detail Tab */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Service Fee</span>
                  <span className="font-mono text-xs font-bold text-slate-900">{formatXAF(appt.billAmount)}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500">Insurance / Subsidy</span>
                  <span className="font-mono text-xs font-semibold text-emerald-600">-{formatXAF(appt.billAmount - appt.copayAmount)}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-slate-900">Patient Co-Pay Total</span>
                  <span className="font-mono text-base font-black text-blue-700">{formatXAF(appt.copayAmount)}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">Payment Status</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 font-bold">
                  {appt.paymentStatus}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Need help? Contact <span className="font-semibold text-slate-700">nanoLabs Care</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Reschedule Date Modal (from doctorAppointmentui.webp) */}
      {isRescheduling && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Select reschedule date
              </h3>
              <button
                onClick={() => setIsRescheduling(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Horizontal Day Selector Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {days.map((d) => (
                <button
                  key={d.label}
                  disabled={d.isFull}
                  onClick={() => setSelectedDay(d.label)}
                  className={`flex-1 min-w-[70px] p-2.5 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                    d.isFull
                      ? 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                      : selectedDay === d.label
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold">{d.label}</span>
                  <span className={`text-[9px] font-mono mt-0.5 ${
                    selectedDay === d.label ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    {d.sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Time Slot Sections */}
            <div className="space-y-3 pt-1">
              {/* Morning */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Morning
                </span>
                <div className="flex gap-2">
                  {morningSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedTimeSlot === slot
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {selectedTimeSlot === slot && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{slot}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Day
                </span>
                <div className="flex gap-2">
                  {daySlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedTimeSlot === slot
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {selectedTimeSlot === slot && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{slot}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Evening */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Evening
                </span>
                <div className="flex gap-2">
                  {eveningSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedTimeSlot === slot
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {selectedTimeSlot === slot && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{slot}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setIsRescheduling(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal with Green Burst Checkmark (from doctorAppointmentui.webp) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl">
            {/* Burst checkmark */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center ring-8 ring-emerald-50">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Your appointment has been updated!!
              </h3>
              <p className="text-xs text-slate-500">
                A confirmation SMS and WhatsApp message has been dispatched.
              </p>
            </div>

            {/* Summary comparison card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-700">#{appt.reservationCode}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  &bull; Rescheduled
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 space-y-1">
                <p className="font-bold text-slate-900">{appt.treatmentName}</p>
                <p className="text-slate-500">{appt.facilityName} &bull; {appt.doctorName}</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                <div className="text-[10px] text-slate-400">Previous: {previousTimeState || 'Jun 14, 2026 • 09:00 AM'}</div>
                <div className="text-xs font-bold text-blue-700">New: {appt.date} • {appt.time}</div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                onClose();
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentDetailModal;
