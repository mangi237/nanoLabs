import React, { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/authContext';
// import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { useLiveDocument } from '../../../hooks/useDoctorDataExtra';
import { Card, Button, Pill, PageHeader, Skeleton } from '../../../components/doctor/ui';
import { Field } from './ProfileEdit';
import { Upload } from 'lucide-react';

const input = 'h-12 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[15px] outline-none focus:border-[#006978]';

const readFile = (file: File, max: number): Promise<string> =>
  new Promise((resolve, reject) => {
    if (file.size > max) return reject(new Error('File too large'));
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });

function UploadBox({ label, value, onPick }: { label: string; value: string; onPick: (v: string) => void }) {
  return (
    <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-[#D1D9D8] bg-white p-6 text-center">
      {value ? (
        <img src={value} alt="" className="h-24 w-full rounded-xl object-cover" />
      ) : (
        <Upload size={22} className="text-[#6B7280]" />
      )}
      <span className="text-[14px] font-medium">{label}</span>
      <span className="text-[12px] text-[#6B7280]">JPG or PNG, up to 2.5 MB</span>
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            onPick(await readFile(f, 2.5 * 1024 * 1024));
          } catch {
            alert('Please choose a photo under 2.5 MB.');
          }
        }}
      />
    </label>
  );
}

export default function CredentialsScreen() {
  const { user } = useAuth();
  const { data, loading } = useLiveDocument<any>(user?.id ? `doctors/${user.id}` : null);
  const [onmc, setOnmc] = useState('');
  const [diploma, setDiploma] = useState('');
  const [renewal, setRenewal] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (data) {
      setOnmc(data.licenseNumber || data.credentials?.onmcNumber || '');
      setDiploma(data.credentials?.diplomaPhoto || '');
      setRenewal(data.credentials?.renewalPhoto || '');
    }
  }, [data?.id]);

  const status: string = data?.verificationStatus || 'pending_verification';
  const verified = status === 'verified';

  const submit = async () => {
    if (!user?.id) return;
    await setDoc(
      doc(db, 'doctors', user.id),
      {
        licenseNumber: onmc.trim(),
        credentials: {
          onmcNumber: onmc.trim(),
          diplomaPhoto: diploma,
          renewalPhoto: renewal,
          submittedAt: new Date().toISOString()
        },
        ...(verified ? {} : { verificationStatus: 'pending_verification' }),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    setSubmitted(true);
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <PageHeader title="Medical credentials" subtitle="Review takes a few working days" />

      <Card className="mb-6 flex items-center justify-between p-5">
        <div>
          <p className="text-[15px] font-semibold">Verification</p>
          <p className="text-[13px] text-[#6B7280]">Patient results unlock after review</p>
        </div>
        {verified ? <Pill tone="green">Verified</Pill> : <Pill tone="amber">Pending</Pill>}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="ONMC registration number">
          <input className={input} value={onmc} onChange={(e) => setOnmc(e.target.value)} placeholder="As printed on your certificate" />
        </Field>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <UploadBox label="Medical diploma" value={diploma} onPick={setDiploma} />
        <UploadBox label="Annual renewal card" value={renewal} onPick={setRenewal} />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={submit} disabled={!onmc.trim() || verified}>
          Submit for verification
        </Button>
        {submitted && <span className="text-[14px] font-medium text-[#15803D]">Submitted</span>}
      </div>
    </>
  );
}