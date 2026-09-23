import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Phone,
  Mail,
  Globe,
  QrCode,
  Activity,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { PatientBooking, BookingTestItem } from '../../services/limsService';
import { DEFAULT_HEADER_FOOTER_TEMPLATES, HeaderFooterTemplateConfig } from '../admin/HeaderFooterTemplateManager';
import { useAuth } from '../../context/authContext';
import { useLabBranding, setActiveLabHeader } from '../../utils/labBranding';

interface LabReportPdfViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PatientBooking | any;
  labInfo?: any;
  isStaffOrAdmin?: boolean;
  filterTestIndex?: number | null;
}

export const LabReportPdfViewModal: React.FC<LabReportPdfViewModalProps> = ({
  isOpen,
  onClose,
  booking,
  labInfo,
  isStaffOrAdmin,
  filterTestIndex: initialFilterTestIndex
}) => {
  const { user, lab } = useAuth();
  const targetLab = lab || labInfo;
  const { logoUrl: brandLogo, headerUrl: brandHeader, setHeader } = useLabBranding(targetLab);

  const canCustomizeTemplates = isStaffOrAdmin !== undefined ? isStaffOrAdmin : (user?.role && user.role !== 'patient');
  const [templates, setTemplates] = useState<HeaderFooterTemplateConfig[]>(DEFAULT_HEADER_FOOTER_TEMPLATES);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [headerChoice, setHeaderChoice] = useState<'auto' | 'image' | 'profile' | 'placeholder'>('auto');
  const [selectedTestFilter, setSelectedTestFilter] = useState<number | null>(
    initialFilterTestIndex !== undefined ? initialFilterTestIndex : null
  );

  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nanoLabs_header_footer_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          if (parsed.length === 2) {
            setTemplates([...parsed, DEFAULT_HEADER_FOOTER_TEMPLATES[2], DEFAULT_HEADER_FOOTER_TEMPLATES[3]]);
          } else {
            setTemplates(parsed);
          }
        }
      }
      const activeId = localStorage.getItem('nanoLabs_active_template_id');
      if (activeId) {
        const foundIdx = DEFAULT_HEADER_FOOTER_TEMPLATES.findIndex(t => t.id === activeId);
        if (foundIdx >= 0) setSelectedTemplateIndex(foundIdx);
      }
    } catch {}
  }, []);

  const handleHeaderUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setHeader(result);
        const updated = [...templates];
        const targetIdx = selectedTemplateIndex >= 2 ? selectedTemplateIndex : 2;
        updated[targetIdx] = {
          ...updated[targetIdx],
          headerImageUrl: result,
          useHeaderImageOnly: true
        };
        setTemplates(updated);
        setSelectedTemplateIndex(targetIdx);
        setHeaderChoice('image');
        localStorage.setItem('nanoLabs_header_footer_templates', JSON.stringify(updated));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFooterUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const updated = [...templates];
      const targetIdx = selectedTemplateIndex >= 2 ? selectedTemplateIndex : 2;
      updated[targetIdx] = {
        ...updated[targetIdx],
        footerImageUrl: result,
        useFooterImageOnly: true
      };
      setTemplates(updated);
      setSelectedTemplateIndex(targetIdx);
      localStorage.setItem('nanoLabs_header_footer_templates', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !booking) return null;

  const currentTpl = templates[selectedTemplateIndex] || templates[0] || DEFAULT_HEADER_FOOTER_TEMPLATES[0];

  const rawLabName = targetLab?.name || booking.labName || booking.labDetails?.name;
  const isMockName = rawLabName && (
    rawLabName.toLowerCase().includes('accredited medical') ||
    rawLabName.toLowerCase().includes('bla bla') ||
    rawLabName.toLowerCase().includes('nanolabs clinical diagnostics center')
  );
  const activeLabName = (!isMockName && rawLabName) ? rawLabName : (targetLab?.name || null);
  const labSlogan = targetLab?.slogan || targetLab?.tagline || booking.labDetails?.slogan || null;
  const labAddress = targetLab?.address || targetLab?.location || booking.labAddress || null;
  const labPhone = targetLab?.phone || booking.labPhone || null;
  const labEmail = targetLab?.email || booking.labEmail || null;
  const labWebsite = targetLab?.website || booking.labWebsite || null;
  const labArrete = targetLab?.arreteNumber || null;
  const labAgrement = targetLab?.agrementNumber || null;
  const labTaxId = targetLab?.taxNumber || null;

  const activeHeaderImageUrl = currentTpl.headerImageUrl || brandHeader;
  const hasRealLabHeader = !!(activeLabName && (labAddress || labPhone));

  const showHeaderImage = (headerChoice === 'image' && !!activeHeaderImageUrl) ||
    (headerChoice === 'auto' && !!activeHeaderImageUrl);

  const showHeaderProfile = (headerChoice === 'profile' && hasRealLabHeader) ||
    (headerChoice === 'auto' && !activeHeaderImageUrl && hasRealLabHeader);

  const showPlaceholderBox = !showHeaderImage && !showHeaderProfile;

  // ============================================================
  // PRINT — opens a clean window with ONLY the report sheet
  // ============================================================
  const handlePrint = () => {
    const sheet = document.getElementById('medical-report-sheet');
    if (!sheet) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      window.print();
      return;
    }

    // Grab all styles from the current document
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('');

    const watermarkLogo = targetLab?.logoUrl || brandLogo || (booking as any).labLogoUrl || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Clinical Laboratory Report - ${booking.bookingCode || ''}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 8mm 12mm 8mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            body { position: relative; }

            /* Watermark — fixed so it repeats on every printed page */
            .print-watermark {
              position: fixed;
              top: 0; right: 0; bottom: 0; left: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 0;
              pointer-events: none;
              user-select: none;
            }
            .print-watermark img {
              width: 60%;
              max-width: 460px;
              height: auto;
              object-fit: contain;
              opacity: 0.10;
              filter: grayscale(100%);
              transform: rotate(-12deg);
            }

            /* Sheet sits above the watermark */
            #medical-report-sheet {
              position: relative;
              z-index: 1;
              background: transparent !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
              border-radius: 0 !important;
            }

            /* Pagination — allow long test tables to flow across pages */
            #medical-report-sheet table { width: 100%; }
            #medical-report-sheet thead { display: table-header-group; }
            #medical-report-sheet tr { page-break-inside: avoid; break-inside: avoid; }

            .print-header-block { page-break-after: avoid; break-after: avoid; }
            .print-patient-box  { page-break-inside: avoid; break-inside: avoid; }
            .print-signature-block { page-break-inside: avoid; break-inside: avoid; }
            .print-footer-block { page-break-inside: avoid; break-inside: avoid; }

            /* Hide non-print UI inside the sheet */
            .no-print, .print\\:hidden { display: none !important; }
          </style>
        </head>
        <body>
          ${watermarkLogo ? `
            <div class="print-watermark">
              <img src="${watermarkLogo}" alt="" />
            </div>
          ` : ''}
          ${sheet.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 500);
    }, 500);
  };

  const registeredTimeStr = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';

  const collectedTimeStr = booking.sampleCollectedAtDate
    ? new Date(booking.sampleCollectedAtDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.sampleCollectedAtDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';

  const reportedTimeStr = (booking.completedAt || booking.tests?.[0]?.completedAt)
    ? new Date(booking.completedAt || booking.tests?.[0]?.completedAt || '').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.completedAt || booking.tests?.[0]?.completedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 my-auto max-h-[96vh] flex flex-col">

        {/* Top Control Bar (Non-printable) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 text-white shrink-0 print:hidden gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                Official Clinical Laboratory Report Preview
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Verified & Signed
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Order ID: {booking.bookingCode} • Invoice: {booking.invoiceNumber || 'INV-001'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canCustomizeTemplates && (
              <>
                <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setHeaderChoice('image')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      headerChoice === 'image' || (headerChoice === 'auto' && activeHeaderImageUrl)
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Utiliser l'image d'en-tête officielle"
                  >
                    <Upload className="w-3 h-3" />
                    <span>En-tête Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeaderChoice('profile')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      headerChoice === 'profile'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Utiliser le profil et les coordonnées du laboratoire"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Profil Lab</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeaderChoice('placeholder')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      headerChoice === 'placeholder' || (!activeHeaderImageUrl && !hasRealLabHeader && headerChoice === 'auto')
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Sans En-tête</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={headerFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleHeaderUpload(e.target.files[0]);
                  }}
                />
                <input
                  type="file"
                  ref={footerFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFooterUpload(e.target.files[0]);
                  }}
                />

                <button
                  type="button"
                  onClick={() => headerFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl border border-teal-500 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Téléverser En-tête</span>
                </button>
              </>
            )}

            {booking.tests && booking.tests.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <span className="text-[11px] font-bold text-slate-300 pl-2">Print:</span>
                <select
                  value={selectedTestFilter === null ? 'batch' : selectedTestFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTestFilter(val === 'batch' ? null : parseInt(val, 10));
                  }}
                  className="bg-slate-900 text-white text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
                >
                  <option value="batch">📄 Full Batch Report (All {booking.tests.length} Tests)</option>
                  {booking.tests.map((t: BookingTestItem, idx: number) => (
                    <option key={t.id || idx} value={idx}>
                      🔬 Single Test: {t.testName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* On-screen preview scroll container */}
        <div className="overflow-y-auto flex-1 p-1 sm:p-4 bg-slate-100 my-2 rounded-2xl">

          <div
            id="medical-report-sheet"
            className="bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 max-w-3xl mx-auto font-sans text-slate-900 space-y-4 relative"
          >

            {/* ============ HEADER ============ */}
            <div className="print-header-block">
              {showHeaderImage ? (
                <div className="border-b-2 border-slate-900 pb-2">
                  <img
                    src={activeHeaderImageUrl!}
                    alt={activeLabName || 'Official Laboratory Header'}
                    style={{ maxHeight: `${currentTpl.headerImageHeight || 110}px` }}
                    className="w-full object-contain mx-auto"
                  />
                </div>
              ) : showHeaderProfile ? (
                <div className="border-b-2 border-slate-900 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {brandLogo ? (
                        <img
                          src={brandLogo}
                          alt={activeLabName || 'Lab Logo'}
                          className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl bg-slate-900 text-white font-black flex items-center justify-center shadow-md shrink-0">
                          <Building2 className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                          {activeLabName}
                        </h1>
                        {labSlogan && (
                          <div className="text-xs font-bold text-teal-800 tracking-wide uppercase">
                            {labSlogan}
                          </div>
                        )}
                        {(labAddress || currentTpl.bpCity) && (
                          <div className="text-[10px] text-slate-600 leading-tight max-w-sm mt-0.5">
                            {[labAddress, currentTpl.bpCity].filter(Boolean).join(' • ')}
                          </div>
                        )}
                        {(labArrete || labAgrement || labTaxId) && (
                          <div className="text-[9px] text-slate-500 font-mono">
                            {[labArrete, labAgrement, labTaxId ? `N.I.U: ${labTaxId}` : ''].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-[11px] text-slate-700 space-y-1">
                      {labPhone && (
                        <div className="flex items-center gap-1 font-bold text-slate-900">
                          <Phone className="w-3.5 h-3.5 text-slate-800" />
                          <span>{labPhone}</span>
                        </div>
                      )}
                      {labEmail && (
                        <div className="flex items-center gap-1 font-medium text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-800" />
                          <span>{labEmail}</span>
                        </div>
                      )}
                      {labWebsite && (
                        <div className="bg-slate-100 text-slate-800 px-3 py-1 rounded-md text-[11px] font-bold shadow-xs flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-700" />
                          <span>{labWebsite.replace(/^https?:\/\//, '')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-0.5 w-full bg-slate-900 mt-3"></div>
                </div>
              ) : showPlaceholderBox ? (
                <div className="border-b-2 border-slate-900 pb-3">
                  <div className="w-full border-2 border-dashed border-teal-500 bg-teal-50/50 rounded-xl p-6 sm:p-8 text-center text-teal-950 flex flex-col items-center justify-center gap-2 select-none">
                    <Building2 className="w-8 h-8 text-teal-700" />
                    <div className="font-black text-base sm:text-lg uppercase tracking-wider text-teal-950">
                      LAB HEADER WILL GO HERE
                    </div>
                    <p className="text-xs text-teal-800/80 max-w-md">
                      No official laboratory letterhead configured. Upload your header image now using the button above.
                    </p>
                    <button
                      type="button"
                      onClick={() => headerFileInputRef.current?.click()}
                      className="no-print mt-2 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Lab Header Image</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ============ PATIENT METADATA ============ */}
            <div className="print-patient-box border border-slate-300 rounded-xl p-3 sm:p-4 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">

              <div className="sm:col-span-4 space-y-1.5">
                <div>
                  <div className="text-base font-black text-slate-900 notranslate" translate="no">
                    {booking.patientName || 'NOT AVAILABLE'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500">Age: </span>
                    <strong className="text-slate-900">{booking.patientAge || '--'} Years</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Sex: </span>
                    <strong className="text-slate-900">{booking.patientGender || '--'}</strong>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">PID / Code: </span>
                  <strong className="font-mono text-slate-900">{booking.patientPid || booking.bookingCode || '--'}</strong>
                </div>
              </div>

              <div className="sm:col-span-4 border-y md:border-y-0 md:border-x border-slate-200 py-2 md:py-0 md:px-3 flex flex-col justify-between space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-2xs">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div className="text-[10px] text-slate-600 leading-tight">
                    <div className="font-bold text-slate-800">Sample Matrix:</div>
                    <div>{booking.tests?.[0]?.sampleTypeRequired || 'Whole Blood / Plasma'}</div>
                  </div>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Prescribing Physician:</div>
                  <div className="text-slate-900 text-[11px] font-black notranslate" translate="no">
                    Ref. Doctor: {booking.referringDoctor || booking.doctorName || '--'}
                  </div>
                  <div className="text-slate-600 text-[10px] font-medium notranslate" translate="no">
                    {booking.referralHospital || booking.doctorFacility || ''}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-4 space-y-1.5 text-right flex flex-col justify-between">
                <div>
                  <div className="font-mono text-[9px] tracking-widest text-slate-800 font-bold uppercase inline-block">
                    ||||| | ||| |||| || | || ||||
                  </div>
                  <div className="font-mono text-[9px] text-slate-600">
                    {booking.bookingCode || '--'}
                  </div>
                </div>

                <div className="text-[10px] space-y-0.5 text-slate-600">
                  <div>
                    <span>Registered on: </span>
                    <strong className="text-slate-800">{registeredTimeStr}</strong>
                  </div>
                  <div>
                    <span>Collected on: </span>
                    <strong className="text-slate-800">{collectedTimeStr}</strong>
                  </div>
                  <div>
                    <span>Reported on: </span>
                    <strong className="text-slate-800">{reportedTimeStr}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* ============ TEST RESULTS ============ */}
            {((selectedTestFilter !== null && selectedTestFilter !== undefined && booking.tests?.[selectedTestFilter])
              ? [booking.tests[selectedTestFilter]]
              : (booking.tests || [])
            ).map((testItem: BookingTestItem, tIdx: number) => (
              <div key={testItem.id || tIdx} className="space-y-2 pt-1 print-test-section">

                <div className="print-test-title text-center border-b-2 border-slate-800 pb-1 bg-slate-50/50 p-2 rounded-t-lg">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {testItem.testName || 'Complete Blood Count (CBC)'}
                  </h2>
                  <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-2">
                    <span>Sample: <strong>{testItem.sampleTypeRequired || 'Whole Blood'}</strong></span>
                    <span>•</span>
                    <span>Department: <strong>{testItem.category || 'General'}</strong></span>
                  </div>
                </div>

                {testItem.richReportHtml ? (
                  <div
                    className="py-3 px-2 bg-white text-slate-900 overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: testItem.richReportHtml }}
                  />
                ) : (
                  <div className="relative overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse relative z-10 print-test-table">
                      <thead>
                        <tr className="border-b-2 border-slate-400 text-slate-800 text-[11px] bg-slate-100">
                          <th className="py-2 px-3 font-black uppercase">Investigation / Parameter</th>
                          <th className="py-2 px-3 font-black text-center uppercase">Result</th>
                          <th className="py-2 px-3 font-black text-center uppercase">Biological Reference Interval</th>
                          <th className="py-2 px-3 font-black text-right uppercase">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {testItem.subParameters && testItem.subParameters.length > 0 ? (
                          testItem.subParameters
                            .filter(sp => sp.printOnReport !== false)
                            .map((sp, sIdx) => {
                              const isHigh = sp.flag === 'High' || sp.isAbnormal;
                              const isLow = sp.flag === 'Low';
                              const isBorderline = sp.flag === 'Borderline';

                              const refVal = sp.refRangeWords || (
                                booking.patientGender === 'Female'
                                  ? (sp.refRangeFemale || sp.refRangeMale || 'Normal')
                                  : booking.patientGender === 'Child'
                                    ? (sp.refRangeChild || sp.refRangeMale || 'Normal')
                                    : (sp.refRangeMale || 'Normal')
                              );

                              const isCalculated = sp.parameterType === 'formula' || sp.computationFormula;

                              return (
                                <React.Fragment key={sp.id || sIdx}>
                                  {sp.subHeader && sIdx > 0 && testItem.subParameters && testItem.subParameters[sIdx - 1]?.subHeader !== sp.subHeader && (
                                    <tr className="bg-slate-100/80 font-black text-[11px] text-slate-900 border-y border-slate-300">
                                      <td colSpan={4} className="py-1 px-3 uppercase tracking-wider text-teal-900">
                                        {sp.subHeader}
                                      </td>
                                    </tr>
                                  )}
                                  <tr className="hover:bg-slate-50/70 transition-colors">
                                    <td className="py-1.5 px-3 font-medium text-slate-900">
                                      <div className="font-semibold">{sp.name}</div>
                                      {isCalculated && (
                                        <span className="text-[9px] text-slate-500 font-normal italic">
                                          Computed: {sp.computationFormula || 'Formula'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-3 text-center font-bold">
                                      <div className="inline-flex items-center justify-center gap-1.5">
                                        <span className={`font-black ${
                                          isHigh ? 'text-rose-700' : isLow ? 'text-blue-700' : 'text-slate-900'
                                        }`}>
                                          {sp.value || 'N/A'}
                                        </span>

                                        {isHigh && (
                                          <span className="px-1.5 py-0.2 text-[9px] bg-rose-100 text-rose-800 font-black rounded uppercase border border-rose-300">
                                            High
                                          </span>
                                        )}
                                        {isLow && (
                                          <span className="px-1.5 py-0.2 text-[9px] bg-blue-100 text-blue-800 font-black rounded uppercase border border-blue-300">
                                            Low
                                          </span>
                                        )}
                                        {isBorderline && (
                                          <span className="px-1.5 py-0.2 text-[9px] bg-amber-100 text-amber-800 font-black rounded uppercase border border-amber-300">
                                            Borderline
                                          </span>
                                        )}
                                      </div>
                                      {sp.resultInWords && (
                                        <div className="text-[9px] text-slate-500 italic">{sp.resultInWords}</div>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-3 text-center text-slate-700 font-mono text-[11px]">
                                      {refVal}
                                    </td>
                                    <td className="py-1.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                                      {sp.unit}
                                    </td>
                                  </tr>
                                </React.Fragment>
                              );
                            })
                        ) : (
                          <tr>
                            <td className="py-2.5 px-3 font-black text-slate-900">
                              {testItem.testName}
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-sm text-blue-900">
                              {testItem.resultValue || 'Normal / Non-Reactive'}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-700 font-mono text-[11px]">
                              {booking.patientGender === 'Female' ? testItem.refRangeFemale : testItem.refRangeMale || 'Normal'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                              {testItem.units || 'Index'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {testItem.antibiogram && testItem.antibiogram.length > 0 && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-300 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                      <span className="font-black text-xs text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-700" />
                        Antibiogram / Antibiotic Susceptibility Testing (AST)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Kirby-Bauer Disc Diffusion</span>
                    </div>

                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-700 text-[10px] uppercase bg-slate-200/60 font-black">
                          <th className="py-1.5 px-2">Antibiotic Agent</th>
                          <th className="py-1.5 px-2 text-center">Disc Potency</th>
                          <th className="py-1.5 px-2 text-center">Zone Diameter (mm)</th>
                          <th className="py-1.5 px-2 text-center">CLSI / EUCAST Breakpoint</th>
                          <th className="py-1.5 px-2 text-right">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {testItem.antibiogram.map((abItem: any, abIdx: number) => {
                          const abName = abItem.antibioticName || abItem.antibiotic || 'Antibiotic';
                          const discPotency = abItem.potency || abItem.discPotency || '10 µg';
                          const zoneVal = abItem.zoneDiameterMm || abItem.zoneMm || '';
                          const sens = (abItem.susceptibility || abItem.sensitivity || 'Sensitive').toString();
                          const isSens = sens === 'Sensitive' || sens === 'S';
                          const isRes = sens === 'Resistant' || sens === 'R';

                          return (
                            <tr key={abItem.id || abIdx} className="hover:bg-slate-100/70">
                              <td className="py-1 px-2 font-bold text-slate-900">{abName}</td>
                              <td className="py-1 px-2 text-center text-slate-600 font-mono text-[11px]">{discPotency}</td>
                              <td className="py-1 px-2 text-center text-slate-700 font-mono text-[11px] font-bold">{zoneVal ? `${zoneVal} mm` : '-'}</td>
                              <td className="py-1 px-2 text-center text-slate-500 text-[10px]">{abItem.refBreakpoints || 'CLSI / EUCAST'}</td>
                              <td className="py-1 px-2 text-right">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block ${
                                  isSens ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                  isRes ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                  'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  {sens}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="pt-2 space-y-1 text-[11px] text-slate-700 border-t border-slate-200">
                  <div>
                    <strong className="text-slate-900">Method / Instruments: </strong>
                    <span>{testItem.reagentsUsed?.length ? `Reagents: ${testItem.reagentsUsed.map(r => r.reagentName).join(', ')} • ` : ''}Automated Diagnostic Analyzer Platform</span>
                  </div>
                  <div>
                    <strong className="text-slate-900">Clinical Interpretation: </strong>
                    <span>{testItem.labNotes || 'Biological parameters evaluated per validated clinical standard operating procedures.'}</span>
                  </div>
                </div>

              </div>
            ))}

            {/* End of Report Strip */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200">
              <span className="font-semibold italic">Merci pour votre confiance</span>
              <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                **** End of Diagnostic Report ****
              </span>
            </div>

            {/* Reserved blank space for physical stamp / signature */}
            <div className="print-signature-block pt-6 pb-4" style={{ minHeight: '60mm' }} />

          </div>
        </div>
      </div>
    </div>
  );
};

export default LabReportPdfViewModal;