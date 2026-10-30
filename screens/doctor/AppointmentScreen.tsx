import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useConnections } from '../../hooks/useDoctorData';
import { Card, Button, PageHeader, Skeleton } from '../../components/doctor/ui';
import { useNav } from '../../components/doctor/nav';

const input = 'h-12 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[15px] outline-none focus:border-[#006978]';
const TYPES = [
  ['in_person', 'In-clinic visit'],
  ['teleconsultation', 'Video consultation'],
  ['lab_review', 'Lab results review'],
  ['home_visit', 'Home visit']
] as const;

export default function AppointmentScreen({
  doctorId,
  patientId: initialPatientId,
  patientName: initialPatientName,
  patientPhone: initialPhone
}: {
  doctorId: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
}) {
  const { back } = useNav();
  const connections = useConnections(doctorId);
  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [patientName, setPatientName] = useState(initialPatientName || '');
  const [patientPhone, setPatientPhone] = useState(initialPhone || '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState<(typeof TYPES)[number][0]>('in_person');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError('');
    if (!patientId) return setError('Choose a patient.');
    if (!date || !time) return setError('Choose a date and time.');
    setSaving(true);
    try {
      await addDoc(collection(db, 'doctorAppointments'), {
        doctorId,
        patientId,
        patientName,
        patientPhone,
        date,
        time,
        appointmentType: type,
        locationOrLink: location.trim(),
        reason: reason.trim(),
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });
      back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="New appointment" subtitle={patientName || 'Choose a connected patient'} />

      {!initialPatientId && (
        <div className="mb-6 max-w-md">
          {connections.loading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <select
              className={input}
              value={patientId}
              onChange={(e) => {
                const c = connections.data.find((x) => x.patientId === e.target.value);
                setPatientId(e.target.value);
                setPatientName(c?.patientName || '');
                setPatientPhone(c?.patientPhone || '');
              }}
            >
              <option value="">Select a patient</option>
              {connections.data.map((c) => (
                <option key={c.id} value={c.patientId}>{c.patientName}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <Card className="max-w-2xl space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[#374151]">Date</span>
            <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[#374151]">Time</span>
            <input type="time" className={input} value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-[#374151]">Type</span>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`h-11 rounded-[12px] border text-[14px] font-medium ${
                  type === key ? 'border-[#006978] bg-[#E6F2F3] text-[#006978]' : 'border-[#E5E7EB] bg-white text-[#374151]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-[#374151]">
            {type === 'teleconsultation' ? 'Video link' : 'Location'}
          </span>
          <input className={input} value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-[#374151]">Reason</span>
          <input className={input} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>

        {error && <p className="text-[14px] text-[#B91C1C]">{error}</p>}
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Confirm appointment'}</Button>
      </Card>
    </>
  );
}