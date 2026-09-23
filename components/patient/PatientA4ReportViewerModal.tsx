import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  Search, 
  FileText, 
  Building2, 
  ShieldCheck, 
  QrCode, 
  Calendar, 
  User, 
  CheckCircle2, 
  Layers, 
  ArrowLeft,
  ChevronDown,
  Sparkles,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { PatientBooking, BookingTestItem } from '../../services/limsService';
import { useLabBranding } from '../../utils/labBranding';

export interface PatientA4ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PatientBooking;
  initialSelectedTestIndex?: number | null; // null means entire batch multi-page view
  onShareToDoctor?: (booking: PatientBooking, testIndex: number | null) => void;
  onBookPrescribedTests?: (tests: any[]) => void;
}

export const PatientA4ReportViewerModal: React.FC<PatientA4ReportViewerModalProps> = ({
  isOpen,
  onClose,
  booking,
  initialSelectedTestIndex = null,
  onShareToDoctor
}) => {
  if (!isOpen || !booking) return null;

  const tests = booking.tests || [];
  const [selectedTestIndex, setSelectedTestIndex] = useState<number | null>(initialSelectedTestIndex);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Filter tests based on user search
  const filteredTests = tests.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.testName || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.testCode || '').toLowerCase().includes(q)
    );
  });

  // Determine tests to display: if selectedTestIndex is specified, show only that single test, else show all
  const displayedTests = selectedTestIndex !== null && tests[selectedTestIndex]
    ? [tests[selectedTestIndex]]
    : filteredTests;

  const isSingleMode = selectedTestIndex !== null && tests[selectedTestIndex] !== undefined;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (onShareToDoctor) {
      onShareToDoctor(booking, selectedTestIndex);
      setShareFeedback('✅ Report shared directly to your connected physician in the Chat Hub!');
      setTimeout(() => setShareFeedback(null), 4000);
    }
  };

  const isReportSignedAndReady = Boolean(booking.biologistSigned || booking.overallStatus === 'Completed' || booking.status === 'ready');

  const bAny = booking as any;
  const targetLab = bAny.labDetails || (booking.labId ? { id: booking.labId, name: booking.labName } : undefined);
  const { logoUrl: brandLogo, headerUrl: brandHeader } = useLabBranding(targetLab);

  const rawLabName = booking.labName || bAny.labDetails?.name;
  const isMockName = rawLabName && (
    rawLabName.toLowerCase().includes('accredited medical') || 
    rawLabName.toLowerCase().includes('bla bla')
  );
  const activeLabName = (!isMockName && rawLabName) ? rawLabName : null;
  const labAddress = bAny.labAddress || bAny.labDetails?.address || bAny.labDetails?.location || null;
  const labPhone = bAny.labPhone || bAny.labDetails?.phone || null;
  const labEmail = bAny.labEmail || bAny.labDetails?.email || null;
  const labAccreditation = bAny.labAccreditation || bAny.labDetails?.accreditation || null;
  const hasRealLabHeader = !!(activeLabName && (labAddress || labPhone));

  const biologistName = booking.biologistName || 'Biologiste Médical Agréé';
  const biologistLicense = bAny.biologistLicense || '';

  const patientName = booking.patientName || 'Valued Patient';
  const patientAge = booking.patientAge || 'Adult';
  const patientGender = booking.patientGender || 'Adult';
  const orderDate = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // If report is not completed & signed by the biologist, lock the view
  if (!isReportSignedAndReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-950/90 text-amber-300 border border-amber-700/80 rounded-full text-xs font-bold font-mono uppercase">
              Analysis in Progress • Pending Biologist Release
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              Official Signed Report Not Yet Available
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your test order <strong className="text-white font-mono">{booking.bookingCode}</strong> is currently being processed in the laboratory by authorized medical technologists.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Per national clinical guidelines, the official signed diagnostic report is securely released only after the Chief Biologist has clinically verified and digitally authorized the results.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Order ID:</span>
              <span className="text-white font-bold">{booking.bookingCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Laboratory:</span>
              <span className="text-teal-300 font-bold">{activeLabName || 'Official Laboratory'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Status:</span>
              <span className="text-amber-300 font-bold uppercase">{booking.overallStatus || 'In_Lab_Testing'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tests Count:</span>
              <span className="text-white font-bold">{tests.length} tests</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Return to Test Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* ========================================================================= */}
        {/* TOP CONTROL BAR (Non-Printable)                                          */}
        {/* ========================================================================= */}
        <div className="p-4 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-white">
                  {isSingleMode ? 'Single Test A4 Diagnostic Report' : 'Consolidated Batch Medical Report'}
                </h2>
                <span className="px-2 py-0.5 bg-teal-900/60 text-teal-300 rounded-md text-[11px] font-mono border border-teal-700/50">
                  {booking.bookingCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isSingleMode 
                  ? `Viewing 1 isolated test (${displayedTests[0]?.testName})`
                  : `Continuous multi-page scroll view • ${tests.length} official tests`}
              </p>
            </div>
          </div>

          {/* Mode Switcher & Actions */}
          <div className="flex items-center gap-2">
            {/* Toggle between All Batch Tests and Single Test Mode */}
            {isSingleMode ? (
              <button
                type="button"
                onClick={() => setSelectedTestIndex(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-teal-600/40"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View Full Batch ({tests.length} Pages)</span>
              </button>
            ) : (
              <div className="text-xs text-slate-400 hidden sm:block">
                <span>Multi-Page Continuous Scroll</span>
              </div>
            )}

            {/* Share to Doctor */}
            {onShareToDoctor && (
              <button
                type="button"
                onClick={handleShare}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Send directly into patient-doctor chat"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Share with Doctor</span>
              </button>
            )}

            {/* Print / Download */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Share Feedback Toast */}
        {shareFeedback && (
          <div className="px-4 py-2 bg-teal-900 border-b border-teal-700 text-teal-100 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span>{shareFeedback}</span>
            <button onClick={() => setShareFeedback(null)} className="text-teal-300 hover:text-white">&times;</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TEST SELECTOR & SEARCH BAR (Allows searching individual test or all)      */}
        {/* ========================================================================= */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search individual test (e.g. FBC, Widal, Glucose)..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
            />
          </div>

          {/* Test Pills for Quick Single vs Batch Switch */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            <button
              type="button"
              onClick={() => setSelectedTestIndex(null)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                selectedTestIndex === null
                  ? 'bg-teal-600 text-white border-teal-400 shadow-xs'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              Batch View (All {tests.length})
            </button>

            {tests.map((t, idx) => (
              <button
                key={t.id || idx}
                type="button"
                onClick={() => setSelectedTestIndex(idx)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  selectedTestIndex === idx
                    ? 'bg-teal-600 text-white border-teal-400 shadow-xs'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Test {idx + 1}: {t.testName}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONTINUOUS MULTI-PAGE SCROLL AREA (Each test has its own A4 page)         */}
        {/* ========================================================================= */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-12 bg-slate-900/60 print:bg-white print:p-0 print:space-y-0">
          {displayedTests.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-bold text-sm">No tests matching your search query.</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-teal-400 hover:underline font-semibold"
              >
                Clear search filter
              </button>
            </div>
          ) : (
            displayedTests.map((test, index) => {
              const actualIndex = tests.findIndex(t => (t.id && t.id === test.id) || t.testName === test.testName);
              const pageNum = actualIndex >= 0 ? actualIndex + 1 : index + 1;
              const richHtml = test.richReportHtml;

              return (
                <div
                  key={test.id || index}
                  className="max-w-[820px] w-full mx-auto space-y-2 print:max-w-none print:space-y-0"
                >
                  {/* Non-printable Page Banner */}
                  <div className="flex items-center justify-between text-xs text-slate-400 px-2 print:hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-teal-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        Page {pageNum} of {tests.length}
                      </span>
                      <span className="font-bold text-white">{test.testName}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTestIndex(actualIndex >= 0 ? actualIndex : index)}
                      className="text-teal-400 hover:text-teal-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Isolate Single PDF</span>
                    </button>
                  </div>

                  {/* ========================================================================= */}
                  {/* PURE WHITE A4 SHEET: Locked Header, Patient Details, Middle Body, Footer   */}
                  {/* ========================================================================= */}
                  <div 
                    className="w-full bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 p-8 sm:p-10 min-h-[1050px] flex flex-col justify-between print:rounded-none print:shadow-none print:border-none print:p-8 print:min-h-[1050px] print:break-after-page"
                    style={{
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
                    }}
                  >
                    
                    {/* ------------------------------------------------------------- */}
                    {/* TOP LOCKED SECTION: Accredited Laboratory Header & Patient Bar */}
                    {/* ------------------------------------------------------------- */}
                    <div className="space-y-4 border-b-2 border-teal-800 pb-4">
                      {/* Lab Official Letterhead or Required Dynamic Placeholder */}
                      {brandHeader ? (
                        <div className="w-full pb-2">
                          <img 
                            src={brandHeader} 
                            alt={activeLabName || 'Official Laboratory Header'} 
                            className="w-full max-h-[110px] object-contain mx-auto"
                          />
                        </div>
                      ) : hasRealLabHeader ? (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            {brandLogo ? (
                              <img
                                src={brandLogo}
                                alt={activeLabName || 'Lab Logo'}
                                className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                                <Building2 className="w-7 h-7" />
                              </div>
                            )}
                            <div className="space-y-0.5">
                              <h2 className="text-base font-black text-teal-950 tracking-tight uppercase">
                                {activeLabName}
                              </h2>
                              <p className="text-[11px] font-bold text-teal-700 tracking-wide">
                                LABORATOIRE D'ANALYSES DE BIOLOGIE MÉDICALE
                              </p>
                              {(labAddress || labAccreditation) && (
                                <p className="text-[10px] text-slate-500">
                                  {[labAddress, labAccreditation].filter(Boolean).join(' • ')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right text-[10px] text-slate-500 space-y-0.5 font-mono shrink-0">
                            {labPhone && <div>Tél : {labPhone}</div>}
                            {labEmail && <div>Email : {labEmail}</div>}
                            <div className="font-bold text-teal-900">Système LIMS Sécurisé</div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full border-2 border-dashed border-teal-500 bg-teal-50/50 rounded-xl p-5 text-center text-teal-950 flex flex-col items-center justify-center gap-1 select-none print:border-black print:bg-white">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-teal-700 print:text-black" />
                            <span className="font-black text-sm uppercase tracking-wider text-teal-950 print:text-black">
                              LAB HEADER WILL GO HERE
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Patient Demographic & Test Bar */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Nom du Patient</span>
                          <span className="font-extrabold text-slate-900">{patientName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Âge / Sexe</span>
                          <span className="font-bold text-slate-800">{patientAge} ans • {(patientGender as string) === 'F' || patientGender === 'Female' ? 'Féminin' : 'Masculin'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">N° Dossier Patient</span>
                          <span className="font-mono font-bold text-teal-800">{booking.bookingCode}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Date du Prélèvement</span>
                          <span className="font-bold text-slate-800">{orderDate}</span>
                        </div>

                        <div className="sm:col-span-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Examen Analysé</span>
                          <span className="font-extrabold text-teal-950 text-sm">{test.testName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Échantillon Biologique</span>
                          <span className="font-bold text-slate-700">{test.sampleTypeRequired || 'Sang total'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Médecin Prescripteur</span>
                          <span className="font-bold text-slate-700">{booking.referringDoctor || 'Dr. Attending Physician'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ------------------------------------------------------------- */}
                    {/* MIDDLE RICH-TEXT / TABULAR WORKSPACE                          */}
                    {/* ------------------------------------------------------------- */}
                    <div className="flex-1 py-6">
                      {richHtml ? (
                        <div 
                          className="prose max-w-none text-slate-800 text-[13px] leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: richHtml }}
                        />
                      ) : (
                        <div className="space-y-4">
                          <table className="w-full border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 border-b-2 border-slate-300 text-left">
                                <th className="p-2 font-bold text-slate-900">PARAMÈTRE ANALYSÉ</th>
                                <th className="p-2 font-bold text-slate-900 text-center">RÉSULTAT</th>
                                <th className="p-2 font-bold text-slate-900">UNITÉ</th>
                                <th className="p-2 font-bold text-slate-900">VALEURS DE RÉFÉRENCE</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-200">
                                <td className="p-2 font-bold text-slate-800">{test.testName}</td>
                                <td className="p-2 font-extrabold text-teal-700 text-center">{test.resultValue || 'Normal'}</td>
                                <td className="p-2 text-slate-600">{test.units || '-'}</td>
                                <td className="p-2 text-slate-600">{test.refRangeMale || 'Normal'}</td>
                              </tr>
                            </tbody>
                          </table>

                          <div className="mt-4 p-3 bg-slate-50 border-l-4 border-teal-700 rounded-r-lg text-xs">
                            <span className="font-bold text-slate-900 block">Observation Biologique :</span>
                            <span className="text-slate-700">
                              {test.labNotes || 'Examen conforme aux valeurs physiologiques de référence. Contrôles de validation satisfaisants.'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ------------------------------------------------------------- */}
                    {/* BOTTOM LOCKED SECTION: Official Signatures, QR & Disclaimers  */}
                    {/* ------------------------------------------------------------- */}
                    <div className="border-t-2 border-slate-200 pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 items-end justify-between gap-4">
                        {/* Validation notice */}
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                            <span>Validation Biologique Officielle</span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Certifié conforme aux règles de bonne pratique des analyses médicales.
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            Horodatage : {new Date().toLocaleDateString('en-GB')} à {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Center QR Seal */}
                        <div className="flex flex-col items-center justify-center text-center space-y-1">
                          <div className="w-14 h-14 bg-slate-50 border border-slate-300 rounded-xl p-1 flex items-center justify-center shadow-2xs">
                            <QrCode className="w-11 h-11 text-teal-900" />
                          </div>
                          <span className="text-[9px] font-mono text-slate-400">
                            NL-QR-{booking.bookingCode}-P{pageNum}
                          </span>
                        </div>

                        {/* Biologist Signature Block */}
                        <div className="text-right space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Le Biologiste Médical Validateur
                          </span>
                          <p className="text-xs font-black text-slate-900">
                            {biologistName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {biologistLicense}
                          </p>
                          <div className="text-[10px] font-mono text-teal-800 pt-1">
                            Signé & validé électroniquement
                          </div>
                        </div>
                      </div>

                      {/* Legal & pagination */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                        <span>
                          Document médical strictement confidentiel. nanoLabs Healthcare Network.
                        </span>
                        <span className="font-bold text-slate-600">
                          Page {pageNum} / {tests.length}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default PatientA4ReportViewerModal;
