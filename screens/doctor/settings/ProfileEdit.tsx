import React, { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/authContext';
// import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { Card, Button, Avatar, PageHeader, Skeleton } from '../../../components/doctor/ui';

const input = 'h-12 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[15px] outline-none focus:border-[#006978]';

export default function ProfileEdit() {
  const { user } = useAuth();
  const { data, loading } = useLiveDocument<any>(user?.id ? `doctors/${user.id}` : null);
  const [form, setForm] = useState({ name: '', specialty: '', phone: '', city: '', bio: '', photoUrl: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || '',
        specialty: data.specialty || '',
        phone: data.phone || '',
        city: data.city || '',
        bio: data.bio || '',
        photoUrl: data.photoUrl || ''
      });
    }
  }, [data?.id]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const pickPhoto = (file?: File) => {
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) return alert('Please choose a photo under 2.5 MB.');
    const r = new FileReader();
    r.onload = () => setForm((f) => ({ ...f, photoUrl: String(r.result) }));
    r.readAsDataURL(file);
  };

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'doctors', user.id), { ...form, updatedAt: new Date().toISOString() }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <PageHeader title="Your profile" subtitle="Shown to patients and labs" />
      <Card className="mb-6 flex items-center gap-4 p-5">
        {form.photoUrl ? (
          <img src={form.photoUrl} alt="" className="h-16 w-16 rounded-[16px] object-cover" />
        ) : (
          <Avatar name={form.name} size={64} />
        )}
        <label className="cursor-pointer text-[14px] font-semibold text-[#006978]">
          Change photo
          <input type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </label>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name"><input className={input} value={form.name} onChange={set('name')} placeholder="As on your ONMC card" /></Field>
        <Field label="Specialty"><input className={input} value={form.specialty} onChange={set('specialty')} placeholder="e.g. Internal medicine" /></Field>
        <Field label="Phone"><input className={input} value={form.phone} onChange={set('phone')} placeholder="+237" /></Field>
        <Field label="City"><input className={input} value={form.city} onChange={set('city')} placeholder="Douala" /></Field>
      </div>
      <div className="mt-4">
        <Field label="Short bio (shown to patients)">
          <textarea className="min-h-[96px] w-full rounded-[14px] border border-[#E5E7EB] bg-white p-4 text-[15px] outline-none focus:border-[#006978]" value={form.bio} onChange={set('bio')} />
        </Field>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
        {saved && <span className="text-[14px] font-medium text-[#15803D]">Saved</span>}
      </div>
    </>
  );
}

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-2">
    <span className="text-[13px] font-medium text-[#374151]">{label}</span>
    {children}
  </label>
);