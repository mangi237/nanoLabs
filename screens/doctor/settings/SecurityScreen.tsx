import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useNav } from '../../../components/doctor/nav';
import { SubScreenHeader, SectionCard } from '../../../components/doctor/ui';
import { db, ensureFirebaseAuth, doc, getDoc, setDoc } from '../../../services/firebase';
import { cleanFirestoreData } from '../../../utils/sanitizeData';
import { hashPassword, verifyPassword } from '../../../utils/passwordHash';

export const SecurityScreen: React.FC = () => {
  const { user } = useAuth();
  const { pop } = useNav();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saved, setSaved] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaved(false);

    if (!user?.id) return;
    if (newPassword.trim().length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'doctors', user.id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        if (data.passwordSalt && data.passwordHash && currentPassword) {
          const valid = await verifyPassword(
            currentPassword,
            data.passwordSalt,
            data.passwordHash
          );
          if (!valid) {
            setErrorMsg('Current password is incorrect.');
            setSaving(false);
            return;
          }
        }
      }

      const { salt, hash } = await hashPassword(newPassword.trim());
      await setDoc(
        docRef,
        cleanFirestoreData({
          passwordSalt: salt,
          passwordHash: hash,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SubScreenHeader title="Password & Account Security" onBack={pop} />
      <form onSubmit={handleUpdatePassword} className="max-w-xl mx-auto p-4 sm:p-6 space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <SectionCard
          title="Update Physician Password"
          subtitle="Hashed locally with 100,000-iteration PBKDF2-SHA256 before saving to Firestore"
        >
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm"
              />
            </div>
          </div>
        </SectionCard>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Password hash updated in Firestore.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Update Password
        </button>
      </form>
    </div>
  );
};

export default SecurityScreen;
