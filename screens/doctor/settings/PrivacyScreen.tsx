import React from 'react';
import { ShieldCheck, Lock, Database, FileCheck2 } from 'lucide-react';
import { useNav } from '../../../components/doctor/nav';
import { SubScreenHeader, SectionCard } from '../../../components/doctor/ui';

export const PrivacyScreen: React.FC = () => {
  const { pop } = useNav();

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SubScreenHeader
        title="Zero-Knowledge E2EE & Data Audit"
        subtitle="Cryptographic safeguards protecting patient-physician confidentiality"
        onBack={pop}
        encryptedBadge
      />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <SectionCard>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Client-Side AES-256-GCM Encryption
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  All doctor-patient messages, diagnostic test prescriptions, medication regimens, and shared result notes are encrypted in browser memory with authenticated 256-bit AES-GCM keys derived via 100,000-iteration PBKDF2-SHA256 before reaching Firebase Firestore.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Strict Per-Patient Record Isolation
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Only patients who have accepted a mutual connection with you, selected you as their referring physician on a laboratory booking, or explicitly shared a certified report are visible in your portal.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pure Cloud Persistence (Zero Local Browser Ledger)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Clinical records, connections, family profiles, and laboratory orders are persisted exclusively in Firestore with authenticated security rules — never left behind in shared browser local storage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Authentic Biologist-Signed Reports
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Certified result PDFs render directly from the performing laboratory&apos;s validated analytical values and electronic medical biologist signature.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default PrivacyScreen;
