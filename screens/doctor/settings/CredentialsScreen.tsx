import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useNav } from '../../../components/doctor/nav';
import { SubScreenHeader, SectionCard, StatusTag } from '../../../components/doctor/ui';
import { db, ensureFirebaseAuth, doc, getDoc, setDoc } from '../../../services/firebase';
import { cleanFirestoreData } from '../../../utils/sanitizeData';

export const CredentialsScreen: React.FC = () => {
  const { user, setUser } = useAuth();
  const { pop } = useNav();

  const [licenseNumber, setLicenseNumber] = useState((user as any)?.licenseNumber || '');
  const [verificationStatus, setVerificationStatus] = useState('verified');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      await ensureFirebaseAuth();
      const snap = await getDoc(doc(db, 'doctors', user.id)).catch(() => null);
      if (active && snap?.exists()) {
        const d = snap.data();
        if (d.licenseNumber) setLicenseNumber(d.licenseNumber);
        if (d.verificationStatus) setVerificationStatus(d.verificationStatus);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setSaved(false);
    try {
      await ensureFirebaseAuth();
      const payload = cleanFirestoreData({
        licenseNumber: licenseNumber.trim(),
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'doctors', user.id), payload, { merge: true });
      setUser({ ...user, ...(payload as any) });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SubScreenHeader title="ONMC Credentials & License" onBack={pop} />
      <form onSubmit={handleSave} className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        <SectionCard>
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Medical Council Standing</p>
                <p className="text-xs text-slate-500">Ordre National des Médecins du Cameroun</p>
              </div>
            </div>
            <StatusTag tone={verificationStatus === 'verified' ? 'emerald' : 'amber'}>
              {verificationStatus === 'verified' ? 'Verified' : 'Pending Review'}
            </StatusTag>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ONMC License / Registration Number
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. ONMC-10482"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-base sm:text-sm"
            />
          </div>
        </SectionCard>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Credentials saved to Firestore.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Update Credentials
        </button>
      </form>
    </div>
  );
};

export default CredentialsScreen;
