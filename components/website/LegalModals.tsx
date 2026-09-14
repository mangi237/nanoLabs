import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export const LegalModals: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-[#0B1F1D] space-y-6 relative max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center">
              {type === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0B1F1D]">
                {type === 'privacy' ? 'nanoLabs Privacy Policy' : 'nanoLabs Terms of Service'}
              </h3>
              <p className="text-xs text-slate-500">
                Effective September 2026 &middot; Republic of Cameroon
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-[#0B1F1D] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-slate-600 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-[#0B1F1D]">1. Diagnostic data</h4>
                <p>
                  nanoLabs operates under Cameroonian digital health and data protection standards. Patient files are stored with application-level encryption. Sensitive fields use AES-GCM-256 with client-side key derivation.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-[#0B1F1D]">2. Insurance verification</h4>
                <p>
                  Insurance is verified manually by the lab cashier at intake using the insurer\u2019s official portal. nanoLabs does not validate coverage automatically and does not store insurer decisions outside the batch record.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-[#0B1F1D]">3. Audit trail</h4>
                <p>
                  Every sample event and every patient action (booklet opened, report viewed, batch shared, booking confirmed) is logged to an append-only, hash-chained audit log. Tamper attempts are rejected at the database level.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-[#0B1F1D]">4. Access codes</h4>
                <p>
                  nanoLabs does not use passwords. Access is granted via phone number and a one-time or persistent access code. Cashiers have a second, separate security access code used only for payment verification.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-[#0B1F1D]">5. Data subject rights</h4>
                <p>
                  Patients can access their diagnostic archive, request corrections through the executing laboratory, and revoke physician sharing at any time.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-[#0B1F1D]">1. Platform role</h4>
                <p>
                  nanoLabs provides software infrastructure connecting patients, doctors, and laboratories. nanoLabs is not a laboratory, does not collect samples, and does not touch payment rails.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-[#0B1F1D]">2. Money flow</h4>
                <p>
                  All diagnostic payments go directly to the executing laboratory. A 5% record management fee is added to the patient portion only and charged when the lab cashier verifies payment. TVA is exempt on lab tests. Laboratories settle with nanoLabs monthly via the Super Admin dashboard.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-[#0B1F1D]">3. Clinical authority</h4>
                <p>
                  nanoLabs does not diagnose and does not replace licensed medical biologists, pathologists, or physicians. Diagnostic validation remains under the authority of registered professionals.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-[#0B1F1D]">4. Availability</h4>
                <p>
                  nanoLabs includes offline-first caching for laboratory operations and mobile phlebotomists. Laboratories agree to maintain backup copies according to standard clinical practice.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-[#0B1F1D]">5. Governing law</h4>
                <p>
                  These terms are governed by the laws of the Republic of Cameroon.
                </p>
              </section>
            </>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">nanoLabs &middot; Douala & Yaoundé</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D3B38] text-white font-bold cursor-pointer transition-colors"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModals;