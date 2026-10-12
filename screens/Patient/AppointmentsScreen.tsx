import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Stethoscope, 
  Video, 
  Plus, 
  User, 
  Building2, 
  CheckCircle2, 
  Inbox,
  X
} from 'lucide-react';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { REAL_DOCTORS_DIRECTORY } from './MyDoctorsScreen';

export interface PatientAppointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  doctorId: string;
  date: string;
  time: string;
  type: 'Teleconsultation / Video' | 'Clinic Visit';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}

interface AppointmentsScreenProps {
  onBack: () => void;
  onBookAppointment: () => void;
  onViewAppointmentDetails?: (appId: string) => void;
}

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({
  onBack,
  onBookAppointment,
  onViewAppointmentDetails
}) => {
  const { activeProfile } = useFamilyProfile();
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for booking
  const [selectedDoctorId, setSelectedDoctorId] = useState(REAL_DOCTORS_DIRECTORY[0].id);
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [appointmentType, setAppointmentType] = useState<'Teleconsultation / Video' | 'Clinic Visit'>('Teleconsultation / Video');
  const [consultationReason, setConsultationReason] = useState('Routine Health Review & Lab Results Interpretation');

  // Load appointments strictly for this active family member profile
  useEffect(() => {
    const storageKey = `nanolabs_appointments_${activeProfile.id}`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setAppointments(JSON.parse(raw));
      } catch {
        setAppointments([]);
      }
    } else {
      setAppointments([]);
    }
  }, [activeProfile.id]);

  const saveAppointments = (newList: PatientAppointment[]) => {
    const storageKey = `nanolabs_appointments_${activeProfile.id}`;
    localStorage.setItem(storageKey, JSON.stringify(newList));
    setAppointments(newList);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = REAL_DOCTORS_DIRECTORY.find(d => d.id === selectedDoctorId) || REAL_DOCTORS_DIRECTORY[0];
    const newApp: PatientAppointment = {
      id: `app-${Date.now()}`,
      patientId: activeProfile.id,
      patientName: activeProfile.fullName,
      doctorName: doc.name,
      specialty: doc.specialty,
      doctorId: doc.id,
      date: appointmentDate,
      time: appointmentTime,
      type: appointmentType,
      status: 'Scheduled',
      notes: consultationReason
    };

    const updated = [newApp, ...appointments];
    saveAppointments(updated);
    setIsModalOpen(false);
  };

  const upcomingList = appointments.filter(a => a.status === 'Scheduled');
  const pastList = appointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled');
  const displayed = activeTab === 'Upcoming' ? upcomingList : pastList;

  return (
    <div className="max-w-3xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
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
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Medical Appointments
            </h1>
            <p className="text-[11px] text-slate-500">
              Active patient: <strong className="text-slate-800">{activeProfile.fullName}</strong> ({activeProfile.relationshipLabel})
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#006978] hover:bg-[#005a66] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Book Appointment</span>
          <span className="sm:hidden">Book</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200">
        <button
          onClick={() => setActiveTab('Upcoming')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'Upcoming'
              ? 'border-[#006978] text-[#006978]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Upcoming ({upcomingList.length})
        </button>
        <button
          onClick={() => setActiveTab('Past')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'Past'
              ? 'border-[#006978] text-[#006978]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Past & History ({pastList.length})
        </button>
      </div>

      {/* Appointments List or Clean Empty State */}
      {displayed.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayed.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white border border-slate-200 hover:border-[#006978] rounded-3xl shadow-xs space-y-3 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold shrink-0">
                    {item.type.includes('Video') ? <Video className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{item.doctorName}</h4>
                    <p className="text-xs text-slate-600 font-medium">{item.specialty}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
                  {item.status}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#006978]" />
                  <span className="font-semibold text-slate-800">{item.date} at {item.time}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Type: <strong>{item.type}</strong></span>
                </div>
                {item.notes && (
                  <p className="text-[11px] text-slate-500 italic pt-0.5 line-clamp-1">
                    "{item.notes}"
                  </p>
                )}
              </div>

              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">Patient: {item.patientName}</span>
                {item.type.includes('Video') && (
                  <a
                    href="https://waspito.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Room</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800">
              No {activeTab.toLowerCase()} appointments for {activeProfile.fullName}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Schedule a teleconsultation or clinic review with an accredited National Medical Council physician to review diagnostic results.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-[#006978] hover:bg-[#005a66] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Book First Appointment</span>
          </button>
        </div>
      )}

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Book Doctor Consultation</h3>
                <p className="text-[11px] text-slate-500">
                  Dossier: <strong className="text-slate-800">{activeProfile.fullName}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Physician</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 focus:outline-hidden focus:border-[#006978]"
                >
                  {REAL_DOCTORS_DIRECTORY.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} &bull; {d.specialty} ({d.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#006978]"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#006978]"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAppointmentType('Teleconsultation / Video')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      appointmentType === 'Teleconsultation / Video'
                        ? 'border-[#006978] bg-[#E0F2F1] text-[#006978]'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Telehealth (Video)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentType('Clinic Visit')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      appointmentType === 'Clinic Visit'
                        ? 'border-[#006978] bg-[#E0F2F1] text-[#006978]'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    In-Person Clinic
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Consultation</label>
                <textarea
                  value={consultationReason}
                  onChange={(e) => setConsultationReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#006978]"
                  placeholder="E.g. Review blood count results, discuss fever symptoms..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#006978] hover:bg-[#005a66] text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
