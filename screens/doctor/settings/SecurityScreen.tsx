import React, { useState } from 'react';
import { deleteField, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/authContext';
// import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { Card, Button, PageHeader, Skeleton } from '../../../components/doctor/ui';
import { Field } from './ProfileEdit';
import { hashPassword, verifyPassword } from '../../../utils/passwordHash';

const input = 'h-12 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[15px] outline-none focus:border-[#006978]';

export default function SecurityScreen() {
  const { user } = useAuth();
  const { data, loading } = useLiveDocument<any>(user?.id ? `doctors/${user.id}` : null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const update = async () => {
    setError('');
    setDone(false);
    if (!user?.id || !data) return;
    if (next.length < 8) return setError('Your new password needs at least 8 characters.');
    if (next !== confirm) return setError('The two new passwords do not match.');

    const ok = data.passwordHash && data.passwordSalt
      ? await verifyPassword(current, data.passwordSalt, data.passwordHash)
      : current === data.password;
    if (!ok) return setError('Your current password is incorrect.');

    const { salt, hash } = await hashPassword(next);
    await setDoc(
      doc(db, 'doctors', user.id),
      {
        passwordSalt: salt,
        passwordHash: hash,
        password: deleteField(),
        passcode: deleteField(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    setCurrent('');
    setNext('');
    setConfirm('');
    setDone(true);
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <PageHeader title="Password & security" subtitle="Keep your account protected" />
      <Card className="max-w-xl space-y-5 p-6">
        <Field label="Current password"><input type="password" className={input} value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
        <Field label="New password"><input type="password" className={input} value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" /></Field>
        <Field label="Confirm new password"><input type="password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        {error && <p className="text-[14px] text-[#B91C1C]">{error}</p>}
        {done && <p className="text-[14px] text-[#15803D]">Password updated</p>}
        <Button onClick={update} disabled={!current || !next}>Update password</Button>
      </Card>
    </>
  );
}