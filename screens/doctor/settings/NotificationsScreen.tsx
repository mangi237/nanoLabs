import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useNav } from '../../../components/doctor/nav';
import { SubScreenHeader, SectionCard } from '../../../components/doctor/ui';
import { db, ensureFirebaseAuth, doc, getDoc, setDoc } from '../../../services/firebase';
import { cleanFirestoreData } from '../../../utils/sanitizeData';

export const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const { pop } = useNav();

  const [prefs, setPrefs] = useState({
    criticalLabResults: true,
    patientFollowRequests: true,
    encryptedChatMessages: true,
    appointmentUpdates: true,
  });
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
        if (d.notificationPrefs) {
          setPrefs((prev) => ({ ...prev, ...d.notificationPrefs }));
        }
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
      await setDoc(
        doc(db, 'doctors', user.id),
        cleanFirestoreData({
          notificationPrefs: prefs,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SubScreenHeader title="Clinical Alert Preferences" onBack={pop} />
      <form onSubmit={handleSave} className="max-w-xl mx-auto p-4 sm:p-6 space-y-5">
        <SectionCard>
          <div className="divide-y divide-slate-100">
            {[
              {
                key: 'criticalLabResults',
                label: 'Certified & Critical Laboratory Results',
                desc: 'Alert immediately when a partner laboratory biologist releases signed results',
              },
              {
                key: 'patientFollowRequests',
                label: 'Incoming Patient Follow Requests',
                desc: 'Notify when a patient requests clinical follow-up with you',
              },
              {
                key: 'encryptedChatMessages',
                label: 'Encrypted Patient Messages',
                desc: 'Badge indicator for unread AES-256-GCM clinical messages',
              },
              {
                key: 'appointmentUpdates',
                label: 'Consultation Requests & Changes',
                desc: 'Alerts for newly requested in-clinic or teleconsultation visits',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(prefs as any)[item.key]}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              </label>
            ))}
          </div>
        </SectionCard>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Preferences saved to Firestore.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Alert Preferences
        </button>
      </form>
    </div>
  );
};

export default NotificationsScreen;
