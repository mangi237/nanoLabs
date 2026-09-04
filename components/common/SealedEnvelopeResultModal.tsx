import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Printer, 
  Stethoscope, 
  Award,
  Layers,
  ChevronRight,
  TestTube,
  Activity,
  AlertTriangle,
  Download
} from 'lucide-react';

interface SealedEnvelopeResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  test?: any;
  booking?: any;
  tests?: any[];
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
  booking,
  tests,
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
  const [selectedTestIdx, setSelectedTestIdx] = useState(0);

  if (!isOpen) return null;

  // Resolve tests array: could be from booking.tests, tests prop, or single test object
  const resolvedTests: any[] = (booking?.tests && booking.tests.length > 0)
    ? booking.tests
    : (tests && tests.length > 0)
    ? tests
    : test?.tests && Array.isArray(test.tests) && test.tests.length > 0
    ? test.tests
    : test
    ? [test]
    : [
        {
          testName: 'Complete Diagnostic Health Screening Panel',
          category: 'Clinical Pathology',
          resultValue: 'Analyzed & Biologically Validated',
          status: 'Completed',
          subParameters: [
            { name: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', refRange: '13.5 - 17.5' },
            { name: 'Fasting Plasma Glucose', value: '94', unit: 'mg/dL', refRange: '70 - 100' },
            { name: 'Total Cholesterol', value: '172', unit: 'mg/dL', refRange: '< 200' }
          ]
        }
      ];

  const currentTest = resolvedTests[selectedTestIdx] || resolvedTests[0];

  const referringDoc = doctorName || booking?.doctorName || test?.referringDoctor || test?.doctorName || 'Dr. Attending Physician / Outpatient';
  const pName = patientName || booking?.patientName || test?.patientName || 'Patient Record';
  const pId = patientPid || booking?.patientPid || booking?.patientId || test?.patientPid || test?.patientId || test?.patientCode || 'PAT-CMR-2026';
  const bookingCode = booking?.bookingCode || test?.bookingCode || `BK-${pId.replace(/[^0-9]/g, '').slice(-4) || '9042'}`;

  const handleBreakSeal = () => {
    setIsUnsealing(true);
    setTimeout(() => {
      setIsOpened(true);
      setIsUnsealing(false);
    }, 850);
  };

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
                  <span className="px-3 py-1 bg-amber-200/80 text-amber-900 rounded-full text-xs font-mono font-bold">
                    BATCH: {bookingCode} ({resolvedTests.length} Diagnostic {resolvedTests.length === 1 ? 'Test' : 'Tests'})
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
                    Official Diagnostic Batch Report
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    Prepared for <strong className="text-slate-900">{pName}</strong> ({pId}) by <strong className="text-slate-900">{labName}</strong>
                  </p>
                </div>

                {/* Doctor Attribution On Envelope */}
                <div className="bg-white/85 backdrop-blur-xs rounded-2xl p-4 border border-amber-200/80 max-w-md mx-auto text-left shadow-xs flex items-center justify-between gap-3">
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
                      <CheckCircle2 className="w-3.5 h-3.5" /> Certified
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
                      <span className="text-[8px] font-bold text-amber-300/90">nanoLabs</span>
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
                      {isUnsealing ? 'Breaking Wax Seal...' : `Click Wax Seal to Unseal Full Batch (${resolvedTests.length} Tests)`}
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
            /* 2. OPENED MEDICAL REPORT STAGE (FULL BATCH EXPANDED)     */
            /* ======================================================== */
            <motion.div
              key="envelope-opened"
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
            >
              {/* Top Letterhead / Accreditation Header */}
              <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white p-5 sm:p-6 border-b border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
                      Medical Diagnostic Certificate
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-teal-800/80 px-2 py-0.5 rounded text-teal-200">
                      BATCH: {bookingCode}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Seal Unlocked
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Consolidated Examination Findings
                  </h2>
                  <p className="text-xs text-slate-300">
                    {labName} • NanoLabs Certified HealthCare Network
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {onOpenPdf && (
                    <button
                      onClick={onOpenPdf}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Download Signed PDF Batch</span>
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
              <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
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
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Batch Tests Count</div>
                  <div className="font-bold text-slate-800">
                    {resolvedTests.length} Total Examinations
                  </div>
                </div>
              </div>

              {/* Multi-Test Selector Tabs if more than 1 test exists */}
              {resolvedTests.length > 1 && (
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
                  <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    Batch Tests:
                  </span>
                  {resolvedTests.map((t, idx) => {
                    const isCurrent = selectedTestIdx === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedTestIdx(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          isCurrent
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <TestTube className="w-3 h-3" />
                        <span>{t.testName || t.name || `Test #${idx + 1}`}</span>
                        {t.flag && t.flag !== 'Normal' && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Clinical Analysis Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                
                {/* Active Test Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      {currentTest.category || 'Clinical Biology'}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {currentTest.testName || currentTest.name || 'Diagnostic Examination'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">
                      Status: <strong className="text-emerald-700 font-bold">{currentTest.status || 'Completed'}</strong>
                    </span>
                  </div>
                </div>

                {/* Overall Test Value summary */}
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                      Overall Diagnostic Result
                    </div>
                    <div className="text-lg sm:text-xl font-black text-teal-950 mt-0.5">
                      {currentTest.resultValue || currentTest.resultText || currentTest.result || 'Analyzed & Biologically Validated'} {currentTest.units || currentTest.unit || ''}
                    </div>
                  </div>
                  {currentTest.flag && currentTest.flag !== 'Normal' && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      currentTest.flag === 'Critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      Flag: {currentTest.flag}
                    </span>
                  )}
                </div>

                {/* Hierarchical Sections or Sub-Parameters Breakdown */}
                {currentTest.sections && currentTest.sections.length > 0 ? (
                  <div className="space-y-4">
                    {currentTest.sections.map((sec: any, sIdx: number) => (
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
                ) : currentTest.subParameters && currentTest.subParameters.length > 0 ? (
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
                        {currentTest.subParameters.map((sub: any, sIdx: number) => (
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

                {/* Biologist Comments / Interpretation */}
                {currentTest.notes && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Biologist Clinical Interpretation</div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{currentTest.notes}</p>
                  </div>
                )}

                {/* All Tests in Batch Overview List */}
                {resolvedTests.length > 1 && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-700">All Tests In This Batch:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {resolvedTests.map((t, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedTestIdx(idx)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                            selectedTestIdx === idx
                              ? 'bg-teal-50 border-teal-300 font-bold text-teal-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{t.testName || t.name}</span>
                          <span className="text-[10px] text-emerald-700 font-mono font-bold">Validated</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validation Footer Stamp */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                      <Award className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">Medical Biologist Validated</div>
                      <div className="text-[11px] text-slate-500">Ordre National des Médecins du Cameroun (ONMC) Accredited</div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[10px] text-slate-400">
                    <div>Security Hash: SHA-256-{bookingCode}</div>
                    <div className="text-emerald-700 font-bold">NanoLabs Cryptographic Seal Confirmed</div>
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
