import React, { useState } from 'react';
import { Calendar, CheckCircle2, Loader2, AlertCircle, Video, Building2 } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useNav } from '../../components/doctor/nav';
import { SubScreenHeader, SectionCard } from '../../components/doctor/ui';
import { doctorPatientFirestoreService } from '../../services/doctorPatientFirestoreService';

interface AppointmentScreenProps {
  initialPatientId?: string;
  initialPatientName?: string;
  initialPatientAlias?: string;
  initialPatientPid?: string;
  initialPatientPhone?: string;
}

export const AppointmentScreen: React.FC<AppointmentScreenProps> = ({
  initialPatientId = '',
  initialPatientName = '',
  initialPatientAlias = '',
  initialPatientPid = '',
  initialPatientPhone = '',
}) => {
  const { user } = useAuth();
  const { pop, connections } = useNav();

  const connectedPatients = connections.filter((c) => c.status === 'accepted');

  const [patientId, setPatientId] = useState(initialPatientId);
  const [patientName, setPatientName] = useState(initialPatientName);
  const [patientAlias, setPatientAlias] = useState(initialPatientAlias);
  const [patientPid, setPatientPid] = useState(initialPatientPid);
  const [patientPhone, setPatientPhone] = useState(initialPatientPhone);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState<'in_person' | 'teleconsultation'>('in_person');
  const [location, setLocation] = useState((user as any)?.hospital || 'Clinic Consultation Room');
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  const handleSelectConnected = (connId: string) => {
    const c = connectedPatients.find((x) => x.id === connId);
    if (!c) return;
    setPatientId(c.patientId);
    setPatientName(c.patientName);
    setPatientAlias(c.patientAlias);
    setPatientPid(c.patientPid);
    setPatientPhone(c.patientPhone || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!user?.id) return;
    if (!patientId || !patientName) {
      setErrorMsg('Please select a connected patient.');
      return;
    }

    setSubmitting(true);
    try {
      await doctorPatientFirestoreService.createAppointment({
        doctorId: user.id,
        doctorName: user.name || 'Dr. Physician',
        doctorSpecialty: (user as any)?.specialty || 'General Medicine',
        doctorHospital: (user as any)?.hospital || location,
        patientId,
        patientPid: patientPid || patientId,
        patientName,
        patientAlias,
        patientPhone,
        date,
        time,
        type,
        location: type === 'teleconsultation' ? 'Encrypted Teleconsultation' : location,
        reason: reason.trim(),
        initiatedBy: 'doctor',
      });
      setDone(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule consultation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[100dvh] bg-slate-50">
        <SubScreenHeader title="Consultation Scheduled" onBack={pop} />
        <div className="max-w-lg mx-auto p-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Appointment Confirmed</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Scheduled with <strong>{patientName}</strong> on <strong>{date}</strong> at{' '}
              <strong>{time}</strong> and notified via encrypted chat.
            </p>
            <button
              type="button"
              onClick={pop}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SubScreenHeader
        title="Schedule Patient Consultation"
        subtitle="Synchronizes to patient's Appointments tab & encrypted chat"
        onBack={pop}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <SectionCard title="Patient">
          {initialPatientId ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900">
              {patientName}{' '}
              {patientAlias && (
                <span className="font-mono text-xs text-teal-700">@{patientAlias}</span>
              )}
            </div>
          ) : (
            <select
              value={
                connectedPatients.find((c) => c.patientId === patientId)?.id || ''
              }
              onChange={(e) => handleSelectConnected(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-base sm:text-sm text-slate-900"
            >
              <option value="">Select a connected patient...</option>
              {connectedPatients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.patientName} (@{c.patientAlias})
                </option>
              ))}
            </select>
          )}
        </SectionCard>

        <SectionCard title="Consultation Modality, Date & Time">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('in_person')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'in_person'
                    ? 'border-teal-500 bg-teal-50 text-teal-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Building2 className="w-4 h-4" />
                In-Clinic Visit
              </button>
              <button
                type="button"
                onClick={() => setType('teleconsultation')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'teleconsultation'
                    ? 'border-teal-500 bg-teal-50 text-teal-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Video className="w-4 h-4" />
                Teleconsultation
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
                  required
                />
              </div>
            </div>

            {type === 'in_person' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Hospital / Practice Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Clinical Reason / Follow-up Notes
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Review of certified biochemistry results"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
              />
            </div>
          </div>
        </SectionCard>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          Confirm &amp; Notify Patient
        </button>
      </form>
    </div>
  );
};

export default AppointmentScreen;
