import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useNav } from '../../../components/doctor/nav';
import { SubScreenHeader, SectionCard } from '../../../components/doctor/ui';
import { db, ensureFirebaseAuth, doc, getDoc, setDoc } from '../../../services/firebase';
import { cleanFirestoreData } from '../../../utils/sanitizeData';

export const PracticeEdit: React.FC = () => {
  const { user, setUser } = useAuth();
  const { pop } = useNav();

  const [hospital, setHospital] = useState((user as any)?.hospital || '');
  const [city, setCity] = useState((user as any)?.city || 'Douala');
  const [address, setAddress] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
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
        if (d.hospital) setHospital(d.hospital);
        if (d.city) setCity(d.city);
        if (d.address) setAddress(d.address);
        if (d.consultationFee) setConsultationFee(String(d.consultationFee));
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
        hospital: hospital.trim(),
        city: city.trim(),
        address: address.trim(),
        consultationFee: consultationFee.trim() ? Number(consultationFee) : null,
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
      <SubScreenHeader title="Hospital & Practice Details" onBack={pop} />
      <form onSubmit={handleSave} className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        <SectionCard>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Hospital / Clinic Name
              </label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Standard Consultation Fee (XAF)
                </label>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Practice Street Address / Department
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Outpatient Wing, 2nd Floor"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
              />
            </div>
          </div>
        </SectionCard>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Practice details updated in Firestore.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Practice Details
        </button>
      </form>
    </div>
  );
};

export default PracticeEdit;
