import React, { useState } from 'react';
import { db, collection, addDoc } from '../../services/firebase';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Check, 
  X, 
  User, 
  CheckCircle2,
  FileText
} from 'lucide-react';

interface DoctorAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    name: string;
    phone?: string;
  };
  doctor: {
    id: string;
    name: string;
    specialty?: string;
    hospital?: string;
  };
  relatedBookingId?: string;
  onAppointmentScheduled?: (appt: any) => void;
}

export const DoctorAppointmentModal: React.FC<DoctorAppointmentModalProps> = ({
  isOpen,
  onClose,
  patient,
  doctor,
  relatedBookingId,
  onAppointmentScheduled
}) => {
  const [appointmentType, setAppointmentType] = useState<'in_person' | 'teleconsultation'>('teleconsultation');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('10:00');
  const [locationOrLink, setLocationOrLink] = useState('https://meet.nanolabs.cm/consult-dr');
  const [reason, setReason] = useState('Post-Diagnostic Lab Report Review & Clinical Follow-up');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const apptData = {
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone || '',
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty || 'Physician',
        appointmentType,
        date,
        time,
        locationOrLink: appointmentType === 'in_person' ? (locationOrLink || doctor.hospital || 'Hospital Consultation Room') : locationOrLink,
        reason,
        relatedBookingId: relatedBookingId || null,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'doctorAppointments'), apptData);

      setSavedSuccess(true);
      if (onAppointmentScheduled) {
        onAppointmentScheduled({ id: docRef.id, ...apptData });
      }

      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error booking appointment:', err);
      alert('Failed to schedule appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Book Clinical Appointment</h3>
              <p className="text-xs text-slate-500">Patient: <strong className="text-slate-800">{patient.name}</strong></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Appointment Confirmed!</h4>
            <p className="text-xs text-slate-500">
              Notification sent to patient for {date} at {time}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Appointment Mode Tabs */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Mode</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setAppointmentType('teleconsultation');
                    setLocationOrLink('https://meet.nanolabs.cm/consult-dr');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    appointmentType === 'teleconsultation'
                      ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-teal-600" />
                  <span>Teleconsultation</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppointmentType('in_person');
                    setLocationOrLink(doctor.hospital || 'Hospital Consultation Room 4B');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    appointmentType === 'in_person'
                      ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>In-Person Clinic</span>
                </button>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Time *</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Location / Meeting Link */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {appointmentType === 'teleconsultation' ? 'Secure Video Meeting Link' : 'Clinic Location / Office Room'}
              </label>
              <input
                type="text"
                required
                value={locationOrLink}
                onChange={e => setLocationOrLink(e.target.value)}
                placeholder={appointmentType === 'teleconsultation' ? 'https://meet...' : 'Consultation Room 3A'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            {/* Clinical Reason */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Reason / Notes</label>
              <textarea
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Scheduling...' : 'Confirm Appointment'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default DoctorAppointmentModal;
