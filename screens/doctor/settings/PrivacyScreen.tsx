import React, { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/authContext';
// import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { Card, Button, PageHeader, Toggle, Skeleton } from '../../../components/doctor/ui';

export default function PrivacyScreen() {
  const { user } = useAuth();
  const { data, loading } = useLiveDocument<any>(user?.id ? `doctors/${user.id}` : null);
  const [directory, setDirectory] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.preferences?.privacy) {
      setDirectory(data.preferences.privacy.directory ?? true);
      setShowPhone(data.preferences.privacy.showPhone ?? false);
    }
  }, [data?.id]);

  const save = async () => {
    if (!user?.id) return;
    await setDoc(
      doc(db, 'doctors', user.id),
      { preferences: { privacy: { directory, showPhone } }, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <>
      <PageHeader title="Privacy" subtitle="Control what patients can see" />
      <Card>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-[15px] font-medium">Show me in the directory</p>
            <p className="text-[13px] text-[#6B7280]">Patients can find you and send requests</p>
          </div>
          <Toggle label="Show in directory" checked={directory} onChange={setDirectory} />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-[#E5E7EB] p-4">
          <p className="text-[15px] font-medium">Show phone number to patients</p>
          <Toggle label="Show phone" checked={showPhone} onChange={setShowPhone} />
        </div>
      </Card>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save}>Save privacy</Button>
        {saved && <span className="text-[14px] font-medium text-[#15803D]">Saved</span>}
      </div>
    </>
  );
}