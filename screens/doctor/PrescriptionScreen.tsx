import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useConnections } from '../../hooks/useDoctorData';
import { Card, Button, PageHeader, Skeleton } from '../../components/doctor/ui';
import { useNav } from '../../components/doctor/nav';
import { Plus, Trash2 } from 'lucide-react';

type Med = { name: string; dosage: string; frequency: string; duration: string };
const blank = (): Med => ({ name: '', dosage: '', frequency: '', duration: '' });
const input = 'h-11 w-full rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-[14px] outline-none focus:border-[#006978]';

export default function PrescriptionScreen({
  doctorId,
  doctorName,
  patientId: initialPatientId,
  patientName: initialPatientName
}: {
  doctorId: string;
  doctorName?: string;
  patientId?: string;
  patientName?: string;
}) {
  const { back } = useNav();
  const connections = useConnections(doctorId);
  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [patientName, setPatientName] = useState(initialPatientName || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [meds, setMeds] = useState<Med[]>([blank()]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setMed = (i: number, k: keyof Med, v: string) =>
    setMeds(meds.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));

  const save = async () => {
    setError('');
    if (!patientId) return setError('Choose a patient.');
    if (meds.some((m) => !m.name.trim() || !m.dosage.trim())) return setError('Each medicine needs a name and dosage.');
    setSaving(true);
    try {
      await addDoc(collection(db, 'doctorPrescriptions'), {
        doctorId,
        doctorName: doctorName || '',
        patientId,
        patientName,
        diagnosis: diagnosis.trim(),
        medications: meds,
        notes: notes.trim(),
        status: 'active',
        createdAt: new Date().toISOString()
      });
      back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="New prescription" subtitle={patientName || 'Choose a connected patient'} />

      {!initialPatientId && (
        <div className="mb-6 max-w-md">
          {connections.loading ? (
            <Skeleton className="h-11 w-full" />
          ) : (
            <select
              className={input}
              value={patientId}
              onChange={(e) => {
                const c = connections.data.find((x) => x.patientId === e.target.value);
                setPatientId(e.target.value);
                setPatientName(c?.patientName || '');
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

      <div className="mb-6 max-w-2xl">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-[#374151]">Diagnosis (optional)</span>
          <input className={input} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </label>
      </div>

      <div className="space-y-3">
        {meds.map((m, i) => (
          <Card key={i} className="grid gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <input className={input} placeholder="Medicine" value={m.name} onChange={(e) => setMed(i, 'name', e.target.value)} />
            <input className={input} placeholder="Dosage" value={m.dosage} onChange={(e) => setMed(i, 'dosage', e.target.value)} />
            <input className={input} placeholder="Frequency" value={m.frequency} onChange={(e) => setMed(i, 'frequency', e.target.value)} />
            <input className={input} placeholder="Duration" value={m.duration} onChange={(e) => setMed(i, 'duration', e.target.value)} />
            {meds.length > 1 && (
              <button onClick={() => setMeds(meds.filter((_, idx) => idx !== i))} className="grid h-11 w-11 place-items-center text-[#6B7280]" aria-label="Remove">
                <Trash2 size={18} />
              </button>
            )}
          </Card>
        ))}
      </div>

      <button onClick={() => setMeds([...meds, blank()])} className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-[#006978]">
        <Plus size={16} /> Add medicine
      </button>

      <div className="mt-6 max-w-2xl">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-[#374151]">Instructions for the patient</span>
          <textarea className="min-h-[96px] w-full rounded-[14px] border border-[#E5E7EB] bg-white p-4 text-[15px] outline-none focus:border-[#006978]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      {error && <p className="mt-4 text-[14px] text-[#B91C1C]">{error}</p>}
      <div className="mt-6">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Sign and send'}</Button>
      </div>
    </>
  );
}