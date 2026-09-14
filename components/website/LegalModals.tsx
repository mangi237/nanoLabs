import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export const LegalModals: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nl-black/80 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="bg-nl-ink border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-white space-y-6 relative max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-nl-glow/15 border border-nl-glow/30 text-nl-glow flex items-center justify-center">
                  {type === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black font-display">
                    {type === 'privacy' ? 'nanoLabs Privacy Policy' : 'nanoLabs Terms of Service'}
                  </h3>
                  <p className="text-xs text-white/50">Effective September 2026 · Republic of Cameroon</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-white/60 leading-relaxed">
              {type === 'privacy' ? (
                <>
                  <section className="space-y-1">
                    <h4 className="text-sm font-bold text-white">1. Diagnostic data</h4>
                    <p>nanoLabs operates under Cameroonian digital health and data protection standards. Patient files are stored with application-level encryption. Sensitive fields use AES-GCM-256 with client-side key derivation.</p>
                  </section>
                  <section className="space-y-1">
                    <h4 className="text-sm font-bold text-white">2. Insurance verification</h4>
                    <p>Insurance is verified manually by the lab cashier at intake using the insurer\u2019s official portal. nanoLabs does not validate coverage automatically and does not store insurer decisions outside the batch record.</p>
                  </section>
                  <section className="space-y-1">
                    <h4 className="text-sm font-bold text-white">3. Audit trail</h4>
                    <p>Every sample event and every patient action (booklet opened, report viewed, batch shared, booking confirmed) is logged to an append-only, hash-chained audit log. Tamper attempts are rejected at the database level.</p>
                  </section>
                  <section className="space-y-1">
                    <h4 className="text-sm font-bold text-white">4. Access codes</h4>
                    <p>nanoLabs does not use passwords. Access is granted via phone number and a one-time or persistent access code. Cashiers have a second, separate security access code used only for payment verification.</p>
                  </section>
                  <section className="space-y-1">
                    <h4 className="text-sm font-bold text-white">5. Data subject rights</h4>
                    <p>Patients can access their diagnostic archive, request corrections through the executing laboratory, and revoke physician sharing at any time.</p>
                  </section>
                </>
              ) : (
                <>
                  <section className="space-y-1">
                    <h4 className="text-sm font-bold text-white">1. Platform role</h4>
                    <p>nanoLabs provides software infrastructure connecting patients, doctors, and laboratories. nanoLabs is not a laboratory, does not collect samples, and does not touch payment rails.</p>
                  </section>
                  <section className="space-y-1">
                    <h4 className="text-sm font-bold text-white">2. Money flow</h4>
                    <p>All diagnostic payments go directly to the executing laboratory. A 5% record management fee is added to the patient portion only and charged when the lab cashier verifies payment. TVA is exempt on lab tests. Laboratories settle with nanoLabs monthly via the Super Admin dashboard.</p>
                  </section>
                  <section className="space-y-1">
                    <h4 className="text-sm font-bold text-white">3. Clinical authority</h4>
                    <p>nanoLabs does not diagnose and does not replace licensed medical biologists, pathologists, or physicians. Diagnostic validation remains under the authority of registered professionals.</p>
                  </section>
                  <section className="space-y-1">
                    <h4 className="text-sm font-bold text-white">4. Availability</h4>
                    <p>nanoLabs includes offline-first caching for laboratory operations and mobile phlebotomists. Laboratories agree to maintain backup copies according to standard clinical practice.</p>
                  </section>
                  <section className="space-y-1">
                    <h4 className="text-sm font-bold text-white">5. Governing law</h4>
                    <p>These terms are governed by the laws of the Republic of Cameroon.</p>
                  </section>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs shrink-0">
              <span className="text-white/50">nanoLabs · Douala & Yaoundé</span>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-nl-teal to-nl-glow text-white font-bold cursor-pointer hover:scale-[1.03] transition-transform"
              >
                I understand
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LegalModals;