import React, { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/authContext';
import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { Card, Button, PageHeader, Toggle, Skeleton } from '../../../components/doctor/ui';
import { Field } from './ProfileEdit';

const input = 'h-12 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[15px] outline-none focus:border-[#006978]';
const DAYS = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
  ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']
] as const;

export default function AvailabilityScreen() {
  const { user } = useAuth();
  const { data, loading } = useLiveDocument<any>(user?.id ? `doctors/${user.id}` : null);
  const [accepting, setAccepting] = useState(true);
  const [days, setDays] = useState<Record<string, boolean>>({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false });
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [slot, setSlot] = useState('30');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.availability) {
      const a = data.availability;
      setAccepting(a.accepting ?? true);
      setDays({ ...days, ...(a.days || {}) });
      setStart(a.start || '09:00');
      setEnd(a.end || '17:00');
      setSlot(String(a.slotMinutes || 30));
    }
  }, [data?.id]);

  const save = async () => {
    if (!user?.id) return;
    await setDoc(
      doc(db, 'doctors', user.id),
      { availability: { accepting, days, start, end, slotMinutes: Number(slot) }, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <PageHeader title="Availability" subtitle="When patients can book you" />

      <Card className="mb-6 flex items-center justify-between p-4">
        <span className="text-[15px] font-medium">Accept consultation requests</span>
        <Toggle label="Accept requests" checked={accepting} onChange={setAccepting} />
      </Card>

      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">Working days</p>
      <Card className="mb-6">
        {DAYS.map(([k, label], i) => (
          <div key={k} className={`flex items-center justify-between p-4 ${i ? 'border-t border-[#E5E7EB]' : ''}`}>
            <span className="text-[15px]">{label}</span>
            <Toggle label={label} checked={!!days[k]} onChange={(v) => setDays({ ...days, [k]: v })} />
          </div>
        ))}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Start time"><input type="time" className={input} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="End time"><input type="time" className={input} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        <Field label="Minutes per consultation">
          <select className={input} value={slot} onChange={(e) => setSlot(e.target.value)}>
            {['15', '20', '30', '45', '60'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save}>Save availability</Button>
        {saved && <span className="text-[14px] font-medium text-[#15803D]">Saved</span>}
      </div>
    </>
  );
}