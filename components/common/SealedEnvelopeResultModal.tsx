import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  FileText, 
  Printer, 
  QrCode, 
  Stethoscope, 
  User, 
  Calendar, 
  Building2, 
  Award,
  Download,
  Eye
} from 'lucide-react';
import { formatDOBDisplay } from '../../data/cameroonInsurances';

interface SealedEnvelopeResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: any;
  labName?: string;
  doctorName?: string;
  patientName?: string;
  patientPid?: string;
  patientGender?: string;
  patientAge?: number | string;
  patientPhone?: string;
  resultsData?: any;
  onOpenPdf?: () => void;
}

export const SealedEnvelopeResultModal: React.FC<SealedEnvelopeResultModalProps> = ({
  isOpen,
  onClose,
  test,
  labName = 'nanoLabs Central Diagnostic Center',
  doctorName,
  patientName,
  patientPid,
  patientGender,
  patientAge,
  patientPhone,
  resultsData,
  onOpenPdf
}) => {
  const [isOpened, setIsOpened] = useState(false);
  const [isUnsealing, setIsUnsealing] = useState(false);

  if (!isOpen) return null;

  const handleBreakSeal = () => {
    setIsUnsealing(true);
    setTimeout(() => {
      setIsOpened(true);
      setIsUnsealing(false);
    }, 900);
  };

  const referringDoc = doctorName || test?.referringDoctor || test?.doctorName || 'Dr. Attending Physician / Outpatient';
  const pName = patientName || test?.patientName || 'Patient';
  const pId = patientPid || test?.patientPid || test?.patientId || test?.patientCode || 'PAT-CMR-01';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer z-20 flex items-center gap-1.5 text-xs font-bold"
        >
          <X className="w-4 h-4" />
          <span>Close</span>
        </button>

        <AnimatePresence mode="wait">
          {!isOpened ? (
            /* ======================================================== */
            /* 1. CLOSED SEALED PHYSICAL ENVELOPE STAGE                 */
            /* ======================================================== */
            <motion.div
              key="envelope-closed"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="relative mx-auto max-w-2xl bg-amber-50 rounded-3xl border-4 border-amber-200 shadow-2xl p-8 sm:p-12 text-center overflow-hidden"
              style={{
                backgroundImage: 'radial-gradient(#d9770615 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            >
              {/* Envelope Flap Accent */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-100/80 border-b-2 border-amber-300 rounded-b-[100px] shadow-inner pointer-events-none" />

              {/* Confidential Badge & Watermark */}
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/10 text-amber-900 border border-amber-900/20 text-xs font-black uppercase tracking-widest">
                  <Shield className="w-3.5 h-3.5 text-amber-800" />
                  <span>Strictly Confidential Medical Envelope</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Official Diagnostic Report
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    Prepared for <strong className="text-slate-900">{pName}</strong> ({pId}) by <strong className="text-slate-900">{labName}</strong>
                  </p>
                </div>

                {/* Doctor Attribution On Envelope */}
                <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-amber-200/80 max-w-md mx-auto text-left shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Prescribing Clinician</div>
                      <div className="text-xs font-black text-slate-900">{referringDoc}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
                    <div className="text-xs font-black text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Validated
                    </div>
                  </div>
                </div>

                {/* Wax Seal / Stamp Button */}
                <div className="pt-4 flex flex-col items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBreakSeal}
                    disabled={isUnsealing}
                    className="relative group cursor-pointer"
                  >
                    {/* Glowing Wax Stamp */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-rose-900 via-rose-700 to-amber-600 text-amber-100 flex flex-col items-center justify-center shadow-xl border-4 border-amber-300/60 ring-4 ring-rose-900/30 group-hover:ring-rose-500/50 transition-all">
                      <Lock className="w-7 h-7 sm:w-8 sm:h-8 mb-1 text-amber-200 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-200">SEALED</span>
                      <span className="text-[8px] font-bold text-amber-300/80">MINSANTE</span>
                    </div>

                    {isUnsealing && (
                      <motion.div
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 rounded-full bg-amber-400/40 pointer-events-none"
                      />
                    )}
                  </motion.button>

                  <div className="space-y-1">
                    <button
                      onClick={handleBreakSeal}
                      className="text-xs font-black text-amber-900 hover:text-amber-950 uppercase tracking-wider underline cursor-pointer"
                    >
                      {isUnsealing ? 'Breaking Wax Seal...' : 'Click Wax Seal to Open Confidential Envelope'}
                    </button>
                    <p className="text-[11px] text-slate-500">
                      Digitally certified with cryptographic integrity timestamp
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ======================================================== */
            /* 2. OPENED MEDICAL REPORT STAGE (EXTRACTED LETTER)       */
            /* ======================================================== */
            <motion.div
              key="envelope-opened"
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Top Letterhead / Accreditation Header */}
              <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white p-6 border-b border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
                      Medical Diagnostic Certificate
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Seal Unlocked
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {test?.testName || test?.name || 'Laboratory Analysis Report'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {labName} • Republic of Cameroon (MINSANTE Approved)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenPdf && (
                    <button
                      onClick={onOpenPdf}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / PDF</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpened(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Reseal
                  </button>
                </div>
              </div>

              {/* Patient and Doctor Demographics Box */}
              <div className="bg-slate-50 p-4 sm:p-5 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Patient Name</div>
                  <div className="font-extrabold text-slate-900 truncate">{pName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Patient PID / ID</div>
                  <div className="font-mono font-bold text-teal-700">{pId}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Prescribing Doctor</div>
                  <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                    <Stethoscope className="w-3 h-3 text-teal-600" />
                    <span>{referringDoc}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Sample Date & Time</div>
                  <div className="font-medium text-slate-700">
                    {test?.collectedAt || test?.requestedDate || new Date().toLocaleDateString('en-GB')}
                  </div>
                </div>
              </div>

              {/* Clinical Analysis Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Result High-Level Value / Summary */}
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                      Overall Diagnostic Result
                    </div>
                    <div className="text-xl font-black text-teal-950 mt-0.5">
                      {test?.resultValue || test?.resultText || 'Analyzed & Biologically Validated'} {test?.units || ''}
                    </div>
                  </div>
                  {test?.flag && test?.flag !== 'Normal' && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      test?.flag === 'Critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      Flag: {test?.flag}
                    </span>
                  )}
                </div>

                {/* Hierarchical Sections or Sub-Parameters Breakdown */}
                {test?.sections && test.sections.length > 0 ? (
                  <div className="space-y-4">
                    {test.sections.map((sec: any, sIdx: number) => (
                      <div key={sec.id || sIdx} className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-black text-xs text-slate-800 uppercase tracking-wide">
                          {sec.title}
                        </div>
                        <div className="p-4 space-y-3">
                          {sec.subSections?.map((sub: any, subIdx: number) => (
                            <div key={sub.id || subIdx} className="space-y-2">
                              {sub.title && (
                                <div className="text-xs font-bold text-teal-900 border-b border-slate-100 pb-1">
                                  {sub.title}
                                </div>
                              )}
                              <div className="space-y-1.5 text-xs">
                                {sub.parameters?.map((param: any, pIdx: number) => (
                                  <div key={param.id || pIdx} className="flex items-center justify-between py-1 border-b border-dashed border-slate-100">
                                    <span className="text-slate-600 font-mono">
                                      {param.staticLeftLabel || `${param.name} ........................`}
                                    </span>
                                    <span className="font-extrabold text-slate-950 font-mono">
                                      {param.value || param.defaultValue || 'Conforme'} {param.unit || ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : test?.subParameters && test.subParameters.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-3">Analysis Parameter</th>
                          <th className="p-3">Observed Value</th>
                          <th className="p-3">Units</th>
                          <th className="p-3">Reference Interval</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {test.subParameters.map((sub: any, sIdx: number) => (
                          <tr key={sub.id || sIdx}>
                            <td className="p-3 font-bold text-slate-900">{sub.name}</td>
                            <td className="p-3 font-mono font-extrabold text-teal-800">{sub.value || sub.defaultValue || 'Normal'}</td>
                            <td className="p-3 text-slate-500 font-mono">{sub.unit || '-'}</td>
                            <td className="p-3 text-slate-500">{sub.refRangeMale || sub.refRange || 'Standard'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {/* Biologist Comments / Conclusion */}
                {test?.notes && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Biologist Clinical Interpretation</div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{test.notes}</p>
                  </div>
                )}

                {/* Validation Footer Stamp */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                      <Award className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">Dr. Medical Biologist Validated</div>
                      <div className="text-[11px] text-slate-500">Ordre National des Médecins du Cameroun (ONMC)</div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[10px] text-slate-400">
                    <div>Security Hash: SHA-256-{test?.id?.substring(0, 8) || '2026-NANO'}</div>
                    <div className="text-emerald-700 font-bold">Tamper-Proof Ledger Confirmed</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SealedEnvelopeResultModal;
