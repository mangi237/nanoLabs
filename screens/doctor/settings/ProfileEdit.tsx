import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useNav } from '../../../components/doctor/nav';
import { SubScreenHeader, SectionCard } from '../../../components/doctor/ui';
import { db, ensureFirebaseAuth, doc, getDoc, setDoc } from '../../../services/firebase';
import { cleanFirestoreData } from '../../../utils/sanitizeData';

export const ProfileEdit: React.FC = () => {
  const { user, setUser } = useAuth();
  const { pop } = useNav();

  const [name, setName] = useState(user?.name || '');
  const [specialty, setSpecialty] = useState((user as any)?.specialty || 'General Medicine');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState((user as any)?.bio || '');
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
        if (d.name) setName(d.name);
        if (d.specialty) setSpecialty(d.specialty);
        if (d.phone) setPhone(d.phone);
        if (d.email) setEmail(d.email);
        if (d.bio || d.notes) setBio(d.bio || d.notes);
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
      const formattedName = name.trim().toLowerCase().startsWith('dr')
        ? name.trim()
        : `Dr. ${name.trim()}`;
      const payload = cleanFirestoreData({
        name: formattedName,
        specialty: specialty.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        bio: bio.trim(),
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'doctors', user.id), payload, { merge: true });
      setUser({
        ...user,
        name: formattedName,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        ...(payload as any),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SubScreenHeader title="Physician Identity & Bio" onBack={pop} />
      <form onSubmit={handleSave} className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        <SectionCard>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical Specialty
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Biography (visible to patients in directory)
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
              />
            </div>
          </div>
        </SectionCard>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Profile saved to Firestore.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default ProfileEdit;
