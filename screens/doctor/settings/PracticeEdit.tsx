import React, { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/authContext';
// import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { Card, Button, PageHeader, Toggle, Skeleton } from '../../../components/doctor/ui';
import { Field } from './ProfileEdit';

const input = 'h-12 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[15px] outline-none focus:border-[#006978]';
const TYPES = [
  ['inPerson', 'In-clinic visit'],
  ['video', 'Video consultation'],
  ['labReview', 'Lab results review'],
  ['homeVisit', 'Home visit']
] as const;

export default function PracticeEdit() {
  const { user } = useAuth();
  const { data, loading } = useLiveDocument<any>(user?.id ? `doctors/${user.id}` : null);
  const [hospital, setHospital] = useState('');
  const [address, setAddress] = useState('');
  const [fee, setFee] = useState('');
  const [types, setTypes] = useState<Record<string, boolean>>({ inPerson: true, video: false, labReview: false, homeVisit: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setHospital(data.practice?.hospital || data.hospital || '');
      setAddress(data.practice?.address || '');
      setFee(data.practice?.fee ? String(data.practice.fee) : '');
      setTypes({ ...types, ...(data.practice?.types || {}) });
    }
  }, [data?.id]);

  const save = async () => {
    if (!user?.id) return;
    await setDoc(
      doc(db, 'doctors', user.id),
      {
        practice: { hospital, address, fee: Number(fee) || null, types },
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <PageHeader title="Practice & clinic" subtitle="Where and how you consult" />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Hospital or clinic"><input className={input} value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="Main workplace" /></Field>
        <Field label="Consultation fee (XAF)"><input className={input} inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Optional" /></Field>
      </div>
      <div className="mt-4">
        <Field label="Address">
          <textarea className="min-h-[96px] w-full rounded-[14px] border border-[#E5E7EB] bg-white p-4 text-[15px] outline-none focus:border-[#006978]" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
      </div>

      <p className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">Consultation types</p>
      <Card>
        {TYPES.map(([key, label], i) => (
          <div key={key} className={`flex items-center justify-between p-4 ${i ? 'border-t border-[#E5E7EB]' : ''}`}>
            <span className="text-[15px] font-medium">{label}</span>
            <Toggle label={label} checked={!!types[key]} onChange={(v) => setTypes({ ...types, [key]: v })} />
          </div>
        ))}
      </Card>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save}>Save practice</Button>
        {saved && <span className="text-[14px] font-medium text-[#15803D]">Saved</span>}
      </div>
    </>
  );
}