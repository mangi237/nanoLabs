import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useNav } from '../../../components/doctor/nav';
import { SubScreenHeader, SectionCard } from '../../../components/doctor/ui';
import { db, ensureFirebaseAuth, doc, getDoc, setDoc } from '../../../services/firebase';
import { cleanFirestoreData } from '../../../utils/sanitizeData';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AvailabilityScreen: React.FC = () => {
  const { user } = useAuth();
  const { pop } = useNav();

  const [schedule, setSchedule] = useState<
    Record<string, { enabled: boolean; start: string; end: string }>
  >(() =>
    Object.fromEntries(
      DAYS.map((d) => [d, { enabled: d !== 'Saturday', start: '08:30', end: '16:30' }])
    )
  );
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
        if (d.availability && typeof d.availability === 'object') {
          setSchedule((prev) => ({ ...prev, ...d.availability }));
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
          availability: schedule,
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
      <SubScreenHeader title="Consultation Availability" onBack={pop} />
      <form onSubmit={handleSave} className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        <SectionCard
          title="Weekly Clinic & Teleconsultation Hours"
          subtitle="Patients see these windows when requesting consultations"
        >
          <div className="divide-y divide-slate-100">
            {DAYS.map((day) => {
              const slot = schedule[day] || { enabled: false, start: '08:30', end: '16:30' };
              return (
                <div
                  key={day}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <label className="flex items-center gap-2.5 text-sm font-bold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          [day]: { ...slot, enabled: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    {day}
                  </label>

                  {slot.enabled ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            [day]: { ...slot, start: e.target.value },
                          }))
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            [day]: { ...slot, end: e.target.value },
                          }))
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Availability saved to Firestore.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Availability
        </button>
      </form>
    </div>
  );
};

export default AvailabilityScreen;
