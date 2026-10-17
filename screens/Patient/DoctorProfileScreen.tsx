import React from 'react';
import { ArrowLeft, Star, MessageCircle, Calendar, ShieldCheck, Stethoscope, Clock, Check } from 'lucide-react';
import { DoctorDirectoryItem } from './MyDoctorScreen';

interface DoctorProfileScreenProps {
  doctor: DoctorDirectoryItem;
  onBack: () => void;
  isConnected: boolean;
  isRequestPending: boolean;
  onBookAppointment: (doctor: DoctorDirectoryItem) => void;
  onOpenChat: (doctor: DoctorDirectoryItem) => void;
  onSendRequest: (doctor: DoctorDirectoryItem) => void;
}

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({
  doctor,
  onBack,
  onSendRequest,
  onBookAppointment,
  isConnected,
  isRequestPending,
  onOpenChat
}) => {
 
  return (
    <div className="max-w-4xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
            {doctor.name}
          </h1>
          <p className="text-xs text-slate-500 font-medium">{doctor.specialty} &bull; {doctor.city}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Doctor Photo & Tags */}
        <div className="space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-md">
            <img
              src={doctor.avatarUrl}
              alt={doctor.name}
              className="w-full h-64 sm:h-72 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
              <div className="text-white">
                <h2 className="text-xl font-black">{doctor.name}</h2>
                <p className="text-xs text-white/90 font-medium">{doctor.specialty} &bull; {doctor.city}</p>
                <div className="flex items-center gap-2 text-xs font-semibold text-white/90 mt-1">
                  <span className="flex items-center text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 mr-1" />
                    {doctor.rating} ({doctor.reviewsCount} reviews)
                  </span>
                  <span>&bull;</span>
                  <span>ONMC Registered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {doctor.services.map((s:any) => (
              <span
                key={s}
                className="px-3 py-1 bg-[#E0F2F1] text-[#006978] rounded-xl text-xs font-bold"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Right Column: Actions, Biography & Credentials */}
        <div className="space-y-4">
          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onBookAppointment(doctor)}
              className="py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#006978]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={() => onOpenChat(doctor)}
              className="py-4 bg-white hover:bg-slate-50 border border-slate-200 text-[#006978] font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Doctor</span>
            </button>
          </div>

          {/* About Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900">
              Physician Biography
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              {doctor.about}
            </p>
          </div>

          {/* Credentials card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl text-xs space-y-1.5 text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-[#006978]" />
              <span>National Medical Council (ONMC) License #MD-88421</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Authorized to prescribe accredited diagnostic investigations, interpret biological reports, and conduct remote video teleconsultations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
