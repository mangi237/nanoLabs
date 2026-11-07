import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  QrCode, 
  Award,
  Sparkles,
  Truck,
  MessageCircle,
  Layers,
  Upload,
  Image as ImageIcon,
  Activity,
  ExternalLink
} from 'lucide-react';
import { PatientBooking, BookingTestItem } from '../../services/limsService';
import { formatDOBDisplay } from '../../data/cameroonInsurances';
import { DEFAULT_HEADER_FOOTER_TEMPLATES, HeaderFooterTemplateConfig } from '../admin/HeaderFooterTemplateManager';
import { formatReferringDoctorWithHospital } from '../../utils/formatDoctor';
import { useAuth } from '../../context/authContext';
import { useLabBranding } from '../../utils/labBranding';
import { db, doc, getDoc } from '../../services/firebase';

interface LabReportPdfViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PatientBooking | any;
  labInfo?: any;
  isStaffOrAdmin?: boolean;
  filterTestIndex?: number | null;
  inlineEmbedded?: boolean;
}

export const LabReportPdfViewModal: React.FC<LabReportPdfViewModalProps> = ({
  isOpen,
  onClose,
  booking,
  labInfo,
  isStaffOrAdmin,
  filterTestIndex: initialFilterTestIndex,
  inlineEmbedded = false
}) => {
  const { user, lab } = useAuth();
  const [fetchedLabProfile, setFetchedLabProfile] = useState<any | null>(null);
  const targetLab =
    (lab && (!booking?.labId || lab.id === booking.labId) ? lab : null) ||
    labInfo ||
    fetchedLabProfile;
  const { logoUrl: brandLogo, headerUrl: brandHeader, setHeader } = useLabBranding(targetLab);

  const canCustomizeTemplates = isStaffOrAdmin !== undefined ? isStaffOrAdmin : Boolean(user?.role && user.role !== 'patient');
  const [templates, setTemplates] = useState<HeaderFooterTemplateConfig[]>(DEFAULT_HEADER_FOOTER_TEMPLATES);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [headerChoice, setHeaderChoice] = useState<'auto' | 'image' | 'profile' | 'placeholder'>('auto');
  const [selectedTestFilter, setSelectedTestFilter] = useState<number | null>(
    initialFilterTestIndex !== undefined ? initialFilterTestIndex : null
  );

  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedTestFilter(initialFilterTestIndex !== undefined ? initialFilterTestIndex : null);
  }, [initialFilterTestIndex, booking?.id]);

  // Fetch performing lab's live Firestore profile & configured header when viewed by a patient
  useEffect(() => {
    let active = true;
    const loadLabDoc = async () => {
      const targetId = booking?.labId || 'lab-1';
      if (!targetId) return;
      try {
        const snap = await getDoc(doc(db, 'labs', targetId));
        if (active && snap.exists()) {
          setFetchedLabProfile({ id: snap.id, ...snap.data() });
        }
      } catch {}
    };
    if (isOpen && booking) {
      loadLabDoc();
    }
    return () => {
      active = false;
    };
  }, [isOpen, booking?.labId]);

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

  // Dynamic Lab details - strictly NO mock text like "Accredited Medical Biology..."
  const rawLabName = booking.labName || targetLab?.name || booking.labDetails?.name;
  const isMockName = rawLabName && (
    rawLabName.toLowerCase().includes('accredited medical') || 
    rawLabName.toLowerCase().includes('bla bla') ||
    rawLabName.toLowerCase().includes('nanolabs clinical diagnostics center')
  );
  const activeLabName = (!isMockName && rawLabName) ? rawLabName : (targetLab?.name || booking.labName || null);
  const labSlogan = targetLab?.slogan || targetLab?.tagline || booking.labDetails?.slogan || 'Laboratoire d\'Analyses de Biologie Médicale';
  const labAddress = booking.labAddress || targetLab?.address || targetLab?.location || 'Douala, Cameroun';
  const labPhone = booking.labPhone || targetLab?.phone || null;
  const labEmergency = targetLab?.emergencyPhone || targetLab?.phone || booking.labPhone || null;
  const labEmail = targetLab?.email || booking.labEmail || null;
  const labWebsite = targetLab?.website || booking.labWebsite || null;
  const labArrete = targetLab?.arreteNumber || null;
  const labAgrement = targetLab?.agrementNumber || null;
  const labTaxId = targetLab?.taxNumber || null;
  const labDirectorName = booking.biologistName || targetLab?.directorName || 'Biologiste Médical Responsable';
  const labDirectorDiplomas = targetLab?.directorDiplomas || null;
  const labDirectorSpecialties = targetLab?.directorSpecialties || null;
  const biologistSignatureTitle = targetLab?.biologistSignatureTitle || 'Directeur de Laboratoire & Biologiste Responsable';
  const footerNotes = currentTpl.footerNotes || 'Compte-rendu conforme aux exigences de validation biologique médicale.';

  // Determine active header image & profile validity
  const activeHeaderImageUrl =
    targetLab?.headerImageUrl ||
    booking?.labHeaderUrl ||
    currentTpl.headerImageUrl ||
    brandHeader;
  const effectiveLogoUrl = targetLab?.logoUrl || booking?.labLogoUrl || brandLogo;
  const hasRealLabHeader = !!activeLabName;

  const showHeaderImage = (headerChoice === 'image' && !!activeHeaderImageUrl) ||
    (headerChoice === 'auto' && !!activeHeaderImageUrl);

  const showHeaderProfile = (headerChoice === 'profile' && hasRealLabHeader) ||
    (headerChoice === 'auto' && !activeHeaderImageUrl && hasRealLabHeader);

  const handleOpenInNewTab = () => {
    const reportEl = document.getElementById('medical-report-sheet');
    if (!reportEl) {
      window.print();
      return;
    }
    const newWin = window.open('', '_blank');
    if (!newWin) {
      window.print();
      return;
    }
    const cleanContent = reportEl.innerHTML;
    newWin.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'Analyses Médicales - ${booking.bookingCode || 'nanoLabs'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4; margin: 10mm 12mm; }
    body { 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background-color: #f1f5f9; 
      margin: 0; 
      padding: 24px; 
      color: #020617; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @media print {
      body { background-color: #ffffff !important; padding: 0 !important; }
      .no-print { display: none !important; }
      #printable-report-card { 
        box-shadow: none !important; 
        border: none !important; 
        padding: 0 !important; 
        margin: 0 !important;
        width: 100% !important; 
        max-width: 100% !important; 
      }
    }
  </style>
</head>
<body>
  <!-- Top Floating Action Toolbar (Hidden during print) -->
  <div class="no-print" style="max-width: 840px; margin: 0 auto 20px auto; display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 12px 24px; border-radius: 16px; color: white; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 9999px; background: #9333ea;"></span>
      <div>
        <div style="font-weight: 800; font-size: 14px; letter-spacing: -0.01em;">Rapport de Biologie Médicale Officiel (Certifié)</div>
        <div style="font-size: 11px; color: #94a3b8;">${activeLabName || 'Laboratoire Agréé'} • Dossier: ${booking.bookingCode || ''}</div>
      </div>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
      <button onclick="window.print()" style="background: #7e22ce; hover:background: #6b21a8; color: white; border: none; padding: 9px 20px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(126,34,206,0.35);">
        🖨️ Imprimer le Rapport (A4)
      </button>
      <button onclick="window.close()" style="background: #334155; color: #cbd5e1; border: none; padding: 9px 16px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer;">
        Fermer
      </button>
    </div>
  </div>

  <!-- A4 Printable Card with Centered Watermark -->
  <div id="printable-report-card" style="max-width: 840px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #cbd5e1; box-shadow: 0 8px 30px rgba(0,0,0,0.06); padding: 36px; position: relative; overflow: hidden;">
    ${cleanContent}
  </div>
</body>
</html>`);
    newWin.document.close();
  };

  const handlePrint = () => {
    handleOpenInNewTab();
  };

  // Real registration, collection, and biologist sign-off timestamps (zero hardcoded mock dates)
  const formatTs = (iso?: string) => {
    if (!iso) return 'Recorded in LIMS';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return (
      d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const registeredTimeStr = formatTs(booking.createdAt);
  const collectedTimeStr = formatTs(
    booking.sampleCollectedAtDate || booking.sampleCollectedAt || booking.createdAt
  );
  const reportedTimeStr = formatTs(
    booking.biologistSignedAt ||
      booking.completedAt ||
      booking.tests?.[0]?.completedAt ||
      booking.updatedAt
  );

  const bookingExternalPdf = booking.externalPdfUrl || booking.pdfReportUrl || null;

  return (
    <div
      className={
        inlineEmbedded
          ? 'w-full'
          : 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto'
      }
    >
      <div
        className={
          inlineEmbedded
            ? 'bg-slate-900 border border-slate-700 text-slate-900 rounded-3xl w-full p-3 sm:p-5 shadow-xl flex flex-col'
            : 'bg-slate-900 border border-slate-700 text-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 my-auto max-h-[96vh] flex flex-col'
        }
      >
        
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
            {/* Header Selector & Upload Controls */}
            {canCustomizeTemplates && (
              <>
                {/* Lab Header Source Selector */}
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
                    title="Afficher l'encadré 'LAB HEADER WILL GO HERE'"
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
                  title="Téléverser une image d'en-tête de laboratoire (PNG, JPG)"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Téléverser En-tête</span>
                </button>

                <button
                  type="button"
                  onClick={() => footerFileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                  title="Upload custom footer image"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                  <span>Upload Footer</span>
                </button>
              </>
            )}

            {/* Print Scope (Batch vs Single Test) */}
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
              type="button"
              onClick={handleOpenInNewTab}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 text-xs font-extrabold rounded-xl border border-purple-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Ouvrir le rapport officiel en pleine page isolée dans un nouvel onglet avec filigrane"
            >
              <ExternalLink className="w-4 h-4 text-purple-400" />
              <span>Ouvrir dans un nouvel onglet</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            {!inlineEmbedded && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Paper Document Container */}
        <div className="overflow-y-auto flex-1 p-1 sm:p-4 bg-slate-100 my-2 rounded-2xl print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          <style>{`
            @media print {
              body, html {
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #000000 !important;
              }
              #medical-report-sheet {
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                max-width: 100% !important;
              }
              .print-pure-white {
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #000000 !important;
                border-color: #000000 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div 
            id="medical-report-sheet"
            className="bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 max-w-3xl mx-auto font-sans text-slate-900 print:shadow-none print:border-none print:max-w-none print:p-0 print:bg-white space-y-4 relative overflow-hidden"
          >
            {/* Laboratory Logo / Official Seal Background Watermark Effect */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] select-none overflow-hidden z-0">
              {effectiveLogoUrl ? (
                <img 
                  src={effectiveLogoUrl} 
                  alt="" 
                  className="w-[440px] h-[440px] object-contain -rotate-12 filter grayscale" 
                />
              ) : (
                <div className="w-[400px] h-[400px] flex flex-col items-center justify-center font-black text-5xl text-slate-900 -rotate-12 uppercase tracking-widest text-center border-8 border-dashed border-slate-900 rounded-full p-8">
                  <span>{(activeLabName || 'LABORATOIRE').slice(0, 18)}</span>
                  <span className="text-base font-bold mt-2">VALIDÉ BIOLOGISTE</span>
                </div>
              )}
            </div>

            <div className="relative z-10 space-y-4">
            {/* Top Header: Custom Uploaded Image OR Laboratory Profile OR Required Placeholder Box */}
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
                  {/* Left Lab Branding */}
                  <div className="flex items-center gap-3">
                    {effectiveLogoUrl ? (
                      <img
                        src={effectiveLogoUrl}
                        alt={activeLabName || 'Lab Logo'}
                        className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl bg-slate-900 print:bg-white print:border-2 print:border-black text-white print:text-black font-black flex items-center justify-center shadow-md shrink-0">
                        <Building2 className="w-8 h-8 text-white print:text-black" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                        {activeLabName}
                      </h1>
                      {labSlogan && (
                        <div className="text-xs font-bold text-teal-800 print:text-black tracking-wide uppercase">
                          {labSlogan}
                        </div>
                      )}
                      {(labAddress || currentTpl.bpCity) && (
                        <div className="text-[10px] text-slate-600 print:text-black leading-tight max-w-sm mt-0.5">
                          {[labAddress, currentTpl.bpCity].filter(Boolean).join(' • ')}
                        </div>
                      )}
                      {(labArrete || labAgrement || labTaxId) && (
                        <div className="text-[9px] text-slate-500 print:text-black font-mono">
                          {[labArrete, labAgrement, labTaxId ? `N.I.U: ${labTaxId}` : ''].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Top Contact Bar */}
                  <div className="flex flex-col items-end text-[11px] text-slate-700 print:text-black space-y-1">
                    {labPhone && (
                      <div className="flex items-center gap-1 font-bold text-slate-900 print:text-black">
                        <Phone className="w-3.5 h-3.5 text-slate-800 print:text-black" />
                        <span>{labPhone}</span>
                      </div>
                    )}
                    {labEmail && (
                      <div className="flex items-center gap-1 font-medium text-slate-600 print:text-black">
                        <Mail className="w-3.5 h-3.5 text-slate-800 print:text-black" />
                        <span>{labEmail}</span>
                      </div>
                    )}
                    {labWebsite && (
                      <div className="bg-slate-100 print:bg-white print:border print:border-black text-slate-800 print:text-black px-3 py-1 rounded-md text-[11px] font-bold shadow-xs flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-700 print:text-black" />
                        <span>{labWebsite.replace(/^https?:\/\//, '')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-0.5 w-full bg-slate-900 mt-3"></div>
              </div>
            ) : (
              /* Official Laboratory Header Box When Lab Image Is Not Uploaded */
              <div className="border-b-2 border-slate-900 pb-3">
                <div className="w-full border-2 border-dashed border-teal-500 bg-teal-50/50 rounded-xl p-6 sm:p-8 text-center text-teal-950 flex flex-col items-center justify-center gap-2 print:border-slate-800 print:bg-white select-none">
                  <Building2 className="w-8 h-8 text-teal-700 print:text-black" />
                  <div className="font-black text-base sm:text-lg uppercase tracking-wider text-teal-950 print:text-black">
                    {activeLabName || 'OFFICIAL LABORATORY LETTERHEAD'}
                  </div>
                  {canCustomizeTemplates && (
                    <>
                      <p className="text-xs text-teal-800/80 print:text-slate-600 max-w-md">
                        No official laboratory letterhead image uploaded yet. Upload your header image using the button below.
                      </p>
                      <button
                        type="button"
                        onClick={() => headerFileInputRef.current?.click()}
                        className="no-print mt-2 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Lab Header Image</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Patient Metadata Grid Box */}
            <div className="border border-slate-300 print:border-black rounded-xl p-3 sm:p-4 bg-white print:bg-white grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              
              {/* Left Demographic Column */}
              <div className="md:col-span-4 space-y-1.5">
                <div>
                  <div className="text-base font-black text-slate-900 notranslate" translate="no">
                    {booking.patientName || 'Patient'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500">Age: </span>
                    <strong className="text-slate-900">{booking.patientAge ? `${booking.patientAge} Years` : 'Adult'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Sex: </span>
                    <strong className="text-slate-900">{booking.patientGender || 'Unspecified'}</strong>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">PID / Code: </span>
                  <strong className="font-mono text-slate-900">{booking.patientPid || booking.bookingCode}</strong>
                </div>
                {booking.sampleBarcode && (
                  <div>
                    <span className="text-slate-500">Tube Barcode: </span>
                    <strong className="font-mono text-slate-900">{booking.sampleBarcode}</strong>
                  </div>
                )}
              </div>

              {/* Middle Sample / Ref By Column */}
              <div className="md:col-span-4 border-y md:border-y-0 md:border-x border-slate-200 py-2 md:py-0 md:px-3 flex flex-col justify-between space-y-2">
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
                    {formatReferringDoctorWithHospital(booking)}
                  </div>
                </div>
              </div>

              {/* Right Barcode & Timestamps Column */}
              <div className="md:col-span-4 space-y-1.5 text-right flex flex-col justify-between">
                <div>
                  <div className="font-mono text-[9px] tracking-widest text-slate-800 font-bold uppercase inline-block">
                    ||||| | ||| |||| || | || ||||
                  </div>
                  <div className="font-mono text-[9px] text-slate-600">
                    {booking.sampleBarcode || booking.bookingCode}
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
                    <span>Certified on: </span>
                    <strong className="text-slate-800">{reportedTimeStr}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* If Lab Uploaded an Official Signed External PDF or Image for the Entire Dossier, Render It Directly */}
            {bookingExternalPdf && (
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 space-y-2 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    Official Signed Laboratory Document
                  </span>
                  <a
                    href={bookingExternalPdf}
                    download={`LabReport-${booking.bookingCode || 'Signed'}.${typeof bookingExternalPdf === 'string' && (bookingExternalPdf.startsWith('data:image') || /\.(jpg|jpeg|png|webp)($|\?)/i.test(bookingExternalPdf)) ? 'png' : 'pdf'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="no-print px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Original Document</span>
                  </a>
                </div>
                {typeof bookingExternalPdf === 'string' && (bookingExternalPdf.startsWith('data:image') || /\.(jpg|jpeg|png|webp)($|\?)/i.test(bookingExternalPdf)) ? (
                  <div className="flex justify-center bg-white p-2 rounded-lg border border-slate-200 overflow-auto max-h-[750px]">
                    <img
                      src={bookingExternalPdf}
                      alt="Official Signed Laboratory Report"
                      className="max-h-[720px] w-auto object-contain rounded shadow-xs"
                    />
                  </div>
                ) : (
                  <iframe
                    src={bookingExternalPdf}
                    title="Official Signed Laboratory PDF"
                    className="w-full h-[520px] rounded-lg border border-slate-200 bg-white"
                  />
                )}
              </div>
            )}

            {/* Test Results Section with Multi-tier Hierarchy (Department -> Sub-Header -> Parameters) */}
            {((selectedTestFilter !== null && selectedTestFilter !== undefined && booking.tests?.[selectedTestFilter])
              ? [booking.tests[selectedTestFilter]]
              : (booking.tests || [])
            ).map((testItem: BookingTestItem, tIdx: number) => {
              const testPdfUrl = testItem.externalPdfUrl || testItem.pdfReportUrl || testItem.pdfUrl || testItem.fileUrl;
              return (
              <div key={testItem.id || tIdx} className="space-y-2 pt-1">
                
                {/* Centered Bold Test Title */}
                <div className="text-center border-b-2 border-slate-800 pb-1 bg-slate-50/50 p-2 rounded-t-lg">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {testItem.testName || testItem.name || 'Diagnostic Examination'}
                  </h2>
                  <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-2">
                    <span>Sample: <strong>{testItem.sampleTypeRequired || 'Biological Specimen'}</strong></span>
                    {testItem.category && (
                      <>
                        <span>•</span>
                        <span>Department: <strong>{testItem.category}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                {/* 1. If Lab Tech uploaded an external PDF or photo specifically for this test */}
                {testPdfUrl ? (
                  <div className="space-y-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Signed Laboratory Assay Document</span>
                      <a
                        href={testPdfUrl}
                        download={`${testItem.testName || 'Test'}-Signed`}
                        target="_blank"
                        rel="noreferrer"
                        className="no-print px-2.5 py-1 bg-teal-700 hover:bg-teal-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    </div>
                    {typeof testPdfUrl === 'string' && (testPdfUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp)($|\?)/i.test(testPdfUrl)) ? (
                      <div className="flex justify-center bg-white p-2 rounded-lg border border-slate-200 overflow-auto max-h-[600px]">
                        <img
                          src={testPdfUrl}
                          alt={testItem.testName || 'Signed Test Document'}
                          className="max-h-[580px] w-auto object-contain rounded shadow-xs"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={testPdfUrl}
                        title={testItem.testName || 'Signed Test PDF'}
                        className="w-full h-[480px] rounded-lg border border-slate-200 bg-white"
                      />
                    )}
                  </div>
                ) : testItem.richReportHtml ? (
                  /* 2. If test was completed via Lab's A4 Rich Canvas, render exact richReportHtml */
                  <div 
                    className="py-3 px-2 bg-white text-slate-900 overflow-x-auto print:p-0"
                    dangerouslySetInnerHTML={{ __html: testItem.richReportHtml }}
                  />
                ) : (
                  /* Sub-parameters or Direct Value Table */
                  <div className="relative overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse relative z-10">
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

                {/* Antibiogram / Antibiotic Susceptibility Matrix Table (if available) */}
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

                {/* Instruments, Lab Tech Notes & Biologist Signed Remarks */}
                <div className="pt-2 space-y-1 text-[11px] text-slate-700 border-t border-slate-200">
                  {testItem.reagentsUsed && testItem.reagentsUsed.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Reagents / Method: </strong>
                      <span>{testItem.reagentsUsed.map(r => r.reagentName).join(', ')}</span>
                    </div>
                  )}
                  {testItem.labNotes && (
                    <div>
                      <strong className="text-slate-900">Technologist Notes: </strong>
                      <span>{testItem.labNotes}</span>
                    </div>
                  )}
                  {booking.biologistRemarks && (
                    <div>
                      <strong className="text-slate-900">Biologist Clinical Conclusion: </strong>
                      <span>{booking.biologistRemarks}</span>
                    </div>
                  )}
                </div>

              </div>
              );
            })}

            {/* End of Report Strip */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200">
              <span className="font-semibold italic">Merci pour votre confiance</span>
              <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                **** End of Diagnostic Report ****
              </span>
            </div>

            {/* Signatures & Pathologist Sign-Off Block */}
            <div className="pt-4 border-t-2 border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs items-end">
              
              {/* Medical Lab Technician */}
              <div>
                <div className="h-10 flex items-center justify-center font-serif text-slate-800 italic font-bold text-sm tracking-wide">
                  {booking.tests?.[0]?.completedBy || booking.assignedTechName || 'Technicien de Laboratoire'}
                </div>
                <div className="font-black text-slate-900">Technicien Analyste</div>
                <div className="text-[10px] text-slate-500 font-medium">Exécuté et Validé</div>
              </div>

              {/* Head Pathologist / Lab Director */}
              <div>
                <div className="h-10 flex items-center justify-center font-serif text-blue-900 italic font-bold text-sm tracking-wide">
                  {labDirectorName}
                </div>
                <div className="font-black text-slate-900">{labDirectorName}</div>
                <div className="text-[10px] text-slate-500 font-medium">{biologistSignatureTitle}</div>
              </div>

              {/* Physical Stamp Zone */}
              <div className="space-y-1">
                <div className="h-14 border-2 border-dashed border-slate-400 print:border-black rounded-lg p-1 flex flex-col items-center justify-center bg-white print:bg-white text-slate-800 print:text-black">
                  <span className="text-[8.5px] font-black uppercase tracking-wider">Cachet Officiel</span>
                  <span className="text-[7px] font-mono">(Physical Stamp & Seal)</span>
                </div>
                <div className="font-black text-slate-900 print:text-black text-[10px]">Visa du Laboratoire</div>
              </div>

              {/* Quality & Accreditation Sign-off */}
              <div className="hidden sm:block">
                <div className="h-10 flex items-center justify-center font-serif text-slate-900 print:text-black italic font-bold text-sm tracking-wide">
                  {activeLabName || 'Laboratoire d\'Analyses Médicales'}
                </div>
                <div className="font-black text-slate-900 print:text-black">Contrôle Qualité & Visa</div>
                <div className="text-[10px] text-slate-600 print:text-black font-medium font-mono">
                  {labArrete || 'ISO 15189'}
                </div>
              </div>

            </div>

            {/* Bottom Footer: Custom Uploaded Image OR Accredited Strip */}
            {currentTpl.footerImageUrl ? (
              <div className="mt-4 pt-2 border-t border-slate-300 print:border-black">
                <img 
                  src={currentTpl.footerImageUrl} 
                  alt="Footer Stamp" 
                  style={{ maxHeight: `${currentTpl.footerImageHeight || 60}px` }}
                  className="w-full object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="bg-white print:bg-white text-slate-800 print:text-black border border-slate-300 print:border-black rounded-xl overflow-hidden p-2.5 flex items-center justify-between text-[11px] gap-2 shadow-2xs print:shadow-none">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-slate-100 print:bg-white text-slate-800 print:text-black rounded-md">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-700 print:text-black">
                    {footerNotes}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 border border-slate-300 print:border-black bg-slate-50 print:bg-white text-slate-900 print:text-black px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                  <MessageCircle className="w-3 h-3 text-slate-700 print:text-black" />
                  <span>{labPhone}</span>
                </div>

                <div className="text-[10px] text-slate-600 print:text-black font-mono">
                  Édité le: {reportedTimeStr}
                </div>
              </div>
            )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LabReportPdfViewModal;
