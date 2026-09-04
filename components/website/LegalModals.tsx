import React from 'react';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export const LegalModals: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0B1F3A] border border-white/20 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-white space-y-6 relative max-h-[85vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#20C997]/20 border border-[#20C997]/30 text-[#20C997] flex items-center justify-center">
              {type === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black">
                {type === 'privacy' ? 'NanoLabs Privacy Policy' : 'NanoLabs Terms of Service'}
              </h3>
              <p className="text-xs text-[#AAB7C7]">
                Effective Date: September 2026 • Republic of Cameroon
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-[#AAB7C7] leading-relaxed">
          {type === 'privacy' ? (
            <>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-white">1. Diagnostic Data Privacy & Confidentiality</h4>
                <p>
                  NanoLabs operates under Cameroonian Digital Health and Data Protection standards. All patient laboratory diagnoses, examination parameters, and medical files are stored with client-side envelope encryption using AES-GCM-256.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="text-sm font-bold text-white">2. Medical Biologist Validation & Audit</h4>
                <p>
                  Access to diagnostic test findings is restricted to authenticated medical staff (biologists, phlebotomists, laboratory technicians) and designated referring physicians authorized by the patient.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="text-sm font-bold text-white">3. WhatsApp & Digital Report Delivery</h4>
                <p>
                  When results are dispatched via WhatsApp or SMS, transmission uses tokenized cryptographic links with optional patient access PIN or Yebo KYC verification.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="text-sm font-bold text-white">4. Data Subject Rights</h4>
                <p>
                  Patients possess the right to access their historical diagnostic archives, request corrections through their attending clinical laboratory, or revoke physician referral sharing at any time.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-1">
                <h4 className="text-sm font-bold text-white">1. Laboratory Information Management System (LIMS) Use</h4>
                <p>
                  NanoLabs provides software infrastructure for medical laboratories, polyclinics, and diagnostic centers. The platform facilitates sample tracking, catalog management, result validation, and report generation.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="text-sm font-bold text-white">2. Clinical Authority</h4>
                <p>
                  NanoLabs is a software tool and does not provide medical diagnoses or replace licensed Medical Biologists, Pathologists, or Physicians. Diagnostic validation remains solely under the authority of registered medical professionals.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="text-sm font-bold text-white">3. System Availability & Offline-First</h4>
                <p>
                  NanoLabs incorporates local offline caching to protect laboratory operations against temporary network interruptions. Laboratories agree to maintain backup copies according to standard clinical laboratory practice.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="text-sm font-bold text-white">4. Governing Law</h4>
                <p>
                  These terms are governed in accordance with the laws of the Republic of Cameroon.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400">NanoLabs HealthCare • Douala & Yaoundé</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#20C997] hover:bg-[#20C997]/90 text-slate-950 font-bold cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModals;
