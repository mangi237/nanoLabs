import React, { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/authContext';
// import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { Card, Button, PageHeader, Toggle, Skeleton } from '../../../components/doctor/ui';

type Prefs = Record<string, boolean>;
const ACTIVITY: [string, string][] = [
  ['requests', 'Connection requests'],
  ['results', 'Lab results'],
  ['messages', 'Messages'],
  ['appointments', 'Appointment changes']
];
const CHANNELS: [string, string][] = [
  ['push', 'Push notifications'],
  ['sms', 'SMS'],
  ['whatsapp', 'WhatsApp']
];

function Rows({ items, prefs, setPrefs }: { items: [string, string][]; prefs: Prefs; setPrefs: (p: Prefs) => void }) {
  return (
    <Card>
      {items.map(([k, label], i) => (
        <div key={k} className={`flex items-center justify-between p-4 ${i ? 'border-t border-[#E5E7EB]' : ''}`}>
          <span className="text-[15px]">{label}</span>
          <Toggle label={label} checked={!!prefs[k]} onChange={(v) => setPrefs({ ...prefs, [k]: v })} />
        </div>
      ))}
    </Card>
  );
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { data, loading } = useLiveDocument<any>(user?.id ? `doctors/${user.id}` : null);
  const [activity, setActivity] = useState<Prefs>({ requests: true, results: true, messages: true, appointments: true });
  const [channels, setChannels] = useState<Prefs>({ push: true, sms: false, whatsapp: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.preferences?.notifications) {
      const n = data.preferences.notifications;
      setActivity({ ...activity, ...(n.activity || {}) });
      setChannels({ ...channels, ...(n.channels || {}) });
    }
  }, [data?.id]);

  const save = async () => {
    if (!user?.id) return;
    await setDoc(
      doc(db, 'doctors', user.id),
      { preferences: { notifications: { activity, channels } }, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <PageHeader title="Notifications" subtitle="Choose what you hear about and how" />
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">New activity</p>
      <Rows items={ACTIVITY} prefs={activity} setPrefs={setActivity} />
      <p className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">Send alerts by</p>
      <Rows items={CHANNELS} prefs={channels} setPrefs={setChannels} />
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save}>Save preferences</Button>
        {saved && <span className="text-[14px] font-medium text-[#15803D]">Saved</span>}
      </div>
    </>
  );
}