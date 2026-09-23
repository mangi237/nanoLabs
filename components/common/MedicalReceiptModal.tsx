import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import {
  Printer,
  X,
  Building2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { PatientBooking } from '../../services/limsService';
import { formatDOBDisplay, CAMEROON_INSURANCE_PROVIDERS } from '../../data/cameroonInsurances';
import { DEFAULT_HEADER_FOOTER_TEMPLATES, HeaderFooterTemplateConfig } from '../admin/HeaderFooterTemplateManager';
import { numberToFrenchWords } from '../../utils/frenchNumberToWords';

interface MedicalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PatientBooking | any;
  labInfo?: any;
  paymentDetails?: {
    paymentMethod?: string;
    discountAmount?: number;
    discountType?: string;
    discountValue?: number;
    couponCode?: string;
    couponSponsorName?: string;
    couponNotes?: string;
    workerStaffName?: string;
    workerStaffId?: string;
    workerDepartment?: string;
    workerBenefitType?: string;
    workerAuthNote?: string;
    momoProvider?: string;
    momoSenderPhone?: string;
    momoSenderName?: string;
    momoTxId?: string;
    bankName?: string;
    bankAccountName?: string;
    bankReference?: string;
    bankBranch?: string;
    bankTransferDate?: string;
    cardScheme?: string;
    cardLast4?: string;
    cardAuthCode?: string;
    cashGiven?: number;
    cashChange?: number;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceCoveragePercent?: number;
    coPayPercent?: number;
    cashierName?: string;
    actualPaidAmount?: number;
    paidAt?: string;
    currency?: string;
    allOrderedBookings?: PatientBooking[];
  };
}

export const MedicalReceiptModal: React.FC<MedicalReceiptModalProps> = ({
  isOpen,
  onClose,
  booking,
  labInfo,
  paymentDetails
}) => {
  const { user, lab } = useAuth();
  const targetLab = lab || labInfo;

  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [templates, setTemplates] = useState<HeaderFooterTemplateConfig[]>(DEFAULT_HEADER_FOOTER_TEMPLATES);

  const canCustomizeTemplates = user?.role && !['patient'].includes(user.role.toLowerCase());

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
      const updated = [...templates];
      const targetIdx = selectedTemplateIndex;
      updated[targetIdx] = {
        ...updated[targetIdx],
        headerImageUrl: result,
        useHeaderImageOnly: true
      };
      setTemplates(updated);
      localStorage.setItem('nanoLabs_header_footer_templates', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const handleFooterUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const updated = [...templates];
      const targetIdx = selectedTemplateIndex;
      updated[targetIdx] = {
        ...updated[targetIdx],
        footerImageUrl: result,
        useFooterImageOnly: true
      };
      setTemplates(updated);
      localStorage.setItem('nanoLabs_header_footer_templates', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !booking) return null;

  const tplConfig = templates[selectedTemplateIndex] || templates[0] || DEFAULT_HEADER_FOOTER_TEMPLATES[0];

  const labName = tplConfig.labName || targetLab?.name || booking.labName || 'NANOLABS CLINICAL DIAGNOSTIC CENTER';
  const labSlogan = tplConfig.subTitle || targetLab?.slogan || 'ANALYSES DE BIOLOGIE MEDICALE ET DIAGNOSTIC CLINIQUE';
  const labAddress = tplConfig.address || targetLab?.address || 'Akwa Boulevard de la Liberté, Douala - Cameroun';
  const labPhone = tplConfig.phone || targetLab?.phone || '+237 670 000 000';
  const labEmergency = tplConfig.emergencyPhone || targetLab?.emergencyPhone || '+237 699 000 000';
  const labEmail = tplConfig.email || targetLab?.email || 'contact@nanolabs.health';
  const labArrete = tplConfig.arreteNumber || targetLab?.arreteNumber || 'Arrêté N° 032/A/MINSANTE/SG/DOSTS';
  const labAgrement = tplConfig.agrementNumber || targetLab?.agrementNumber || 'Agrément N° 019 MINSANTE';
  const labTaxId = tplConfig.taxNumber || targetLab?.taxNumber || 'Contribuable N° M052100089201L';
  const directorName = tplConfig.directorName || targetLab?.directorName || 'Directeur du Laboratoire';
  const directorDiplomas = tplConfig.directorDiplomas || '';
  const directorSpecialties = tplConfig.directorSpecialties || '';
  const biologistSignatureTitle = tplConfig.biologistSignatureTitle || 'BIOLOGISTE-CLINICIEN / LA DIRECTION';

  const pDetails = paymentDetails || booking.paymentDetails || {};
  const currency = paymentDetails?.currency || 'FCFA';
  const paymentMethod = (paymentDetails?.paymentMethod || booking.paymentMethod || pDetails.paymentMethod || 'Cash').toLowerCase();
  const discountAmount = paymentDetails?.discountAmount ?? booking.discountAmount ?? pDetails.discountAmount ?? 0;
  const discountType = paymentDetails?.discountType || booking.discountType || pDetails.discountType || '';
  const couponCode = paymentDetails?.couponCode || booking.couponCode || pDetails.couponCode || '';

  const insuranceProviderName = paymentDetails?.insuranceProvider || booking.insuranceProvider || pDetails.insuranceProvider || pDetails.insuranceDetails?.provider || 'ASCOMA CAMEROUN S.A.';
  const insurancePolicyNumber = paymentDetails?.insurancePolicyNumber || booking.insurancePolicyNumber || pDetails.insurancePolicyNumber || pDetails.insuranceDetails?.policyNumber || 'CSA-8812';

  const matchedInsurance = CAMEROON_INSURANCE_PROVIDERS.find(
    i => i.name.toLowerCase().includes(insuranceProviderName.toLowerCase()) ||
         i.shortName.toLowerCase() === insuranceProviderName.toLowerCase()
  ) || CAMEROON_INSURANCE_PROVIDERS[0];

  const insuranceCoveragePercent = paymentDetails?.insuranceCoveragePercent !== undefined
    ? paymentDetails.insuranceCoveragePercent
    : booking.insuranceCoveragePercent !== undefined
      ? booking.insuranceCoveragePercent
      : pDetails.insuranceCoveragePercent !== undefined
        ? pDetails.insuranceCoveragePercent
        : booking.coPayPercent !== undefined
          ? (100 - booking.coPayPercent)
          : pDetails.coPayPercent !== undefined
            ? (100 - pDetails.coPayPercent)
            : (matchedInsurance.defaultCoveragePercent ?? 80);

  const coPayPercent = paymentDetails?.coPayPercent !== undefined
    ? paymentDetails.coPayPercent
    : booking.coPayPercent !== undefined
      ? booking.coPayPercent
      : pDetails.coPayPercent !== undefined
        ? pDetails.coPayPercent
        : (100 - insuranceCoveragePercent);

  const patientName = booking.patientName || 'NOT AVAILABLE';
  const beneficiaryName = (booking as any).insuredBeneficiaryName || (booking as any).beneficiaryName || patientName;
  const matricule = (booking as any).matricule || (booking as any).insurancePolicyNumber || booking.insurancePolicyNumber || '--';
  const patientDob = booking.dateOfBirth || booking.dob || '';
  const patientGender = booking.patientGender || '--';
  const patientPhone = booking.patientPhone || '--';
  const society = (booking as any).society || (booking as any).employer || (booking as any).company || '--';
  const bpcNumber = (booking as any).bpcNumber || (booking as any).bpc || '--';
  const dossierNumber = (booking as any).dossierNumber || (booking as any).dosNumber || (booking.bookingCode ? booking.bookingCode.replace(/\D/g, '').slice(-2) : '--');
  const invoiceNum = (booking.invoiceNumber || (booking.bookingCode ? booking.bookingCode.replace(/\D/g, '') : '000060')).padStart(6, '0');
  const referringDoctorDisplay = (booking as any).referringDoctor
    ? `${(booking as any).referringDoctor}${(booking as any).referralHospital ? ` — ${(booking as any).referralHospital}` : ''}`
    : (booking.doctorName || '--');

  const testsList = booking.tests && booking.tests.length > 0 ? booking.tests : [];

  const bUnitRate = matchedInsurance.baseRateB || 260;
  const kbUnitRate = matchedInsurance.baseRateKB || 1200;

  interface LineItemBilling {
    designation: string;
    cote: string;
    valeurCoeff: string;
    qty: number;
    totalPrice: number;
    insuranceAmount: number;
    patientAmount: number;
  }

  const lineItems: LineItemBilling[] = [];

  testsList.forEach((t: any) => {
    let cote = t.cote || 'B10';
    let lineTotal = t.price || t.totalPrice || 0;
    let coeffStr = (bUnitRate).toLocaleString();

    if (t.testName?.includes('IONO') || t.testName?.includes('IONOC')) {
      cote = 'B95';
    } else if (t.testName?.includes('GLYC') || t.testName?.includes('GLYP')) {
      cote = 'B10';
    } else if (t.testName?.includes('NFS') || t.testName?.includes('HEMOG')) {
      cote = 'B45';
    } else if (t.testName?.includes('CHOL') || t.testName?.includes('LIPID')) {
      cote = 'B30';
    }

    const insShare = Math.round(lineTotal * (insuranceCoveragePercent / 100));
    const patShare = lineTotal - insShare;
    const testCodeLabel = t.testCode || t.code ? `[${t.testCode || t.code}]` : '';

    lineItems.push({
      designation: `${t.testName || t.name || 'EXAMEN DE BIOLOGIE MEDICALE'} ${testCodeLabel}`.trim(),
      cote,
      valeurCoeff: coeffStr,
      qty: 1,
      totalPrice: lineTotal,
      insuranceAmount: insShare,
      patientAmount: patShare
    });
  });

  const explicitAddOns = booking.addOns || pDetails?.addOns || [];
  if (Array.isArray(explicitAddOns) && explicitAddOns.length > 0) {
    explicitAddOns.forEach((ao: any) => {
      const lineTotal = (ao.price || 0) * (ao.quantity || 1);
      const insShare = Math.round(lineTotal * (insuranceCoveragePercent / 100));
      const patShare = lineTotal - insShare;
      lineItems.push({
        designation: `${ao.name} ${ao.code ? `[${ao.code}]` : ''}`.trim(),
        cote: ao.code || 'ACT-PREL',
        valeurCoeff: (ao.price || 0).toLocaleString(),
        qty: ao.quantity || 1,
        totalPrice: lineTotal,
        insuranceAmount: insShare,
        patientAmount: patShare
      });
    });
  }

  const totalExamensLabo = lineItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalHT = totalExamensLabo;
  const totalTTC = totalHT;
  const totalPatientTicketModerateur = lineItems.reduce((acc, item) => acc + item.patientAmount, 0);
  const totalNetAPayerAssurance = lineItems.reduce((acc, item) => acc + item.insuranceAmount, 0);

  const amountInWords = numberToFrenchWords(totalNetAPayerAssurance);

  const receiptDateFormatted = booking.paidAt
    ? new Date(booking.paidAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  // ============================================================
  // PRINT — opens a clean window with ONLY the receipt sheet
  // Same pattern as LabReportPdfViewModal and BatchConsolidatedReportModal
  // ============================================================
  const handlePrint = () => {
    const sheet = document.getElementById('medical-receipt-sheet');
    if (!sheet) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      window.print();
      return;
    }

    // Inline all CSS rules from the current document so the print window
    // gets the full compiled Tailwind stylesheet (including @media print rules)
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
        } catch (e) {
          return sheet.href ? `<link rel="stylesheet" href="${sheet.href}" />` : '';
        }
      })
      .filter(Boolean)
      .join('\n');

    const watermarkLogo = targetLab?.logoUrl || (booking as any).labLogoUrl || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Medical Receipt - ${booking.bookingCode || ''}</title>
          <style>${styles}</style>
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
            #medical-receipt-sheet {
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
              overflow: visible !important;
            }

            /* Pagination — allow long tables to flow across pages */
            #medical-receipt-sheet table { width: 100%; }
            #medical-receipt-sheet thead { display: table-header-group; }
            #medical-receipt-sheet tr { page-break-inside: avoid; break-inside: avoid; }

            .print-header-block { page-break-after: avoid; break-after: avoid; }
            .print-patient-box  { page-break-inside: avoid; break-inside: avoid; }
            .print-totals-block { page-break-inside: avoid; break-inside: avoid; }
            .print-signature-block { page-break-inside: avoid; break-inside: avoid; }

          #medical-receipt-sheet .print-patient-box.grid-cols-2,
#medical-receipt-sheet .print-patient-box.sm\\:grid-cols-2 {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 0.75rem !important;
}

/* Totals recap: force 12-col grid + 6/6 split */
#medical-receipt-sheet .print-totals-block {
  display: grid !important;
  grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
  gap: 0.75rem !important;
  width: 100% !important;
}
#medical-receipt-sheet .print-totals-block > .sm\\:col-span-6,
#medical-receipt-sheet .print-totals-block > .print\\:col-span-6,
#medical-receipt-sheet .print-totals-block > * {
  grid-column: span 6 / span 6 !important;
  width: 100% !important;
  min-width: 0 !important;
}

/* Template 1 two-column totals (Part Patient / Part Assureur) */
#medical-receipt-sheet .print-totals-block.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}
#medical-receipt-sheet .print-totals-block.grid-cols-2 > * {
  grid-column: auto !important;
  width: 100% !important;
}

/* Inner flex rows inside the totals cards — spread content */
#medical-receipt-sheet .print-totals-block .flex.justify-between,
#medical-receipt-sheet .print-totals-block .flex.items-center.justify-between {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  width: 100% !important;
  gap: 0.5rem !important;
}

/* Ensure the wrapper cards stretch to full column width */
#medical-receipt-sheet .print-totals-block > div {
  width: 100% !important;
  box-sizing: border-box !important;
}

/* Signature / stamp grid (if present) */
#medical-receipt-sheet .print-signature-block.grid-cols-3 {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 1rem !important;
}
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 my-auto max-h-[96vh] flex flex-col">

        {/* Top Control Bar (Non-printable) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Official Medical Billing & Receipt Generator
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canCustomizeTemplates && (
              <>
                <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
                  {templates.slice(0, 4).map((tpl, idx) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateIndex(idx)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        selectedTemplateIndex === idx
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {idx === 0 ? 'Template 1' : idx === 1 ? 'Template 2' : `Custom ${idx - 1}`}
                    </button>
                  ))}
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
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                  title="Upload custom top letterhead image"
                >
                  <Upload className="w-3.5 h-3.5 text-teal-400" />
                  <span>Upload Header</span>
                </button>

                <button
                  type="button"
                  onClick={() => footerFileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                  title="Upload custom footer image"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Upload Footer</span>
                </button>
              </>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Facture</span>
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
        <div className="overflow-y-auto flex-1 p-2 sm:p-5 bg-slate-200 my-2 rounded-2xl">

          <div
            id="medical-receipt-sheet"
            className="bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden max-w-3xl mx-auto font-sans text-slate-950 p-6 sm:p-8 space-y-4 text-xs"
          >

            {/* ========================================================================= */}
            {/* TEMPLATE 2: OFFICIAL CAMEROON BIODIAGNOSTICS FACTURE EXTERNE             */}
            {/* ========================================================================= */}
            {selectedTemplateIndex % 2 === 1 || selectedTemplateIndex === 1 ? (
              <div className="space-y-4">

                {/* 1. HEADER */}
                <div className="print-header-block">
                  {tplConfig.headerImageUrl ? (
                    <div className="border-b-2 border-slate-900 pb-2">
                      <img
                        src={tplConfig.headerImageUrl}
                        alt={labName}
                        style={{ maxHeight: `${tplConfig.headerImageHeight || 110}px` }}
                        className="w-full object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="border-b-2 border-slate-900 pb-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        {targetLab?.logoUrl ? (
                          <img
                            src={targetLab.logoUrl}
                            alt={labName}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-xl object-contain border border-slate-300 bg-white p-1 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black shrink-0">
                            <Building2 className="w-8 h-8 text-white" />
                          </div>
                        )}

                        <div className="text-center flex-1">
                          <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-950 tracking-tight">
                            {labName}
                          </h1>
                          <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                            {labSlogan}
                          </h2>
                        </div>

                        <div className="w-16 hidden sm:block"></div>
                      </div>

                      <div className="text-center space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 pt-1">
                          {directorName}
                        </div>
                        {directorDiplomas && (
                          <div className="text-[10px] text-slate-700 font-medium leading-tight max-w-2xl mx-auto">
                            {directorDiplomas}
                          </div>
                        )}
                        {directorSpecialties && (
                          <div className="text-[9.5px] text-slate-600 italic leading-tight max-w-2xl mx-auto">
                            {directorSpecialties}
                          </div>
                        )}

                        <div className="text-[9px] text-slate-600 font-mono pt-1">
                          {labArrete} • {labAgrement} • {labTaxId}
                        </div>
                        <div className="text-[9px] text-slate-700 font-semibold">
                          {labAddress} • Tél: {labPhone} • Urgences: {labEmergency}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. INVOICE TITLE & DATE BAR */}
                <div className="flex items-center justify-between font-black text-sm border-b border-slate-300 pb-2">
                  <span className="uppercase text-slate-950">
                    FACTURE EXTERNE n° : <strong className="font-mono text-base">[{invoiceNum}]</strong>
                  </span>
                  <span className="text-slate-800 font-medium text-xs">
                    {receiptDateFormatted}
                  </span>
                </div>

                {/* 3. DUAL IDENTIFICATION & INSURANCE SUMMARY BOXES */}
                <div className="print-patient-box grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10.5px]">

                  <div className="border border-slate-400 rounded-lg p-3 bg-slate-50/60 space-y-1">
                    <div className="font-black uppercase text-slate-950 pb-1 border-b border-slate-200">
                      IDENTIFICATION DU PATIENT
                    </div>
                    <div>Assuré Principal: <strong className="font-bold text-slate-950 notranslate" translate="no">{patientName}</strong></div>
                    <div>Bénéficiaire: <strong className="font-semibold notranslate" translate="no">{beneficiaryName}</strong></div>
                    <div className="font-mono text-[10px]">
                      Matricule: <strong>{matricule}</strong> • Né(e) le: <strong>{formatDOBDisplay(patientDob)}</strong>
                    </div>
                    <div>
                      Sexe: <strong>{patientGender === 'Female' ? 'F' : patientGender === 'Male' ? 'M' : '--'}</strong> • Tél: <strong className="font-mono">{patientPhone}</strong>
                    </div>
                    <div>Société: <strong className="font-bold notranslate" translate="no">{society}</strong></div>
                    <div>Prescribing Physician: <strong className="font-bold text-slate-950 notranslate" translate="no">Ref. Doctor: {referringDoctorDisplay}</strong></div>
                    <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between font-mono font-bold text-slate-800 text-[10px]">
                      <span>N° BPC: {bpcNumber}</span>
                      <span>N° Dos: {dossierNumber}</span>
                    </div>
                  </div>

                  <div className="border border-slate-400 rounded-lg p-3 bg-slate-50/60 space-y-1">
                    <div className="font-black uppercase text-indigo-950 pb-1 border-b border-slate-200 flex items-center justify-between">
                      <span>{matchedInsurance.name}</span>
                      <span className="text-[9px] bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded font-bold">
                        {insuranceCoveragePercent}% Prise en Charge
                      </span>
                    </div>
                    <div>Adresse: <strong className="font-semibold">{matchedInsurance.address}</strong></div>
                    <div>B.P.: <strong className="font-mono">{matchedInsurance.bp}</strong></div>
                    <div>Tél: <strong className="font-mono">{matchedInsurance.phone}</strong></div>
                    <div className="pt-1 border-t border-slate-200/80 flex flex-col font-mono text-[9.5px] text-slate-700">
                      <span>N.I.U.: <strong>{matchedInsurance.taxId || '--'}</strong></span>
                      <span>R.C.: <strong>{matchedInsurance.rcNumber || '--'}</strong></span>
                    </div>
                  </div>

                </div>

                {/* 4. GRANULAR COTE ITEMIZED BILLING TABLE */}
                <div className="border border-slate-400 rounded-lg overflow-hidden text-[10px]">
                  <table className="w-full text-left print-billing-table">
                    <thead className="bg-slate-100 font-extrabold text-slate-900 border-b border-slate-400 text-[9.5px] uppercase">
                      <tr>
                        <th className="p-2">DESIGNATION</th>
                        <th className="p-2 text-center">COTE</th>
                        <th className="p-2 text-right">VALEUR</th>
                        <th className="p-2 text-center">QTE</th>
                        <th className="p-2 text-right font-black">PRIX TOTAL</th>
                        <th className="p-2 text-right text-indigo-950 font-black">ASSU ({insuranceCoveragePercent}%)</th>
                        <th className="p-2 text-right text-emerald-950 font-black">PATIENT ({coPayPercent}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {lineItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-950">{item.designation}</td>
                          <td className="p-2 text-center font-mono font-bold text-slate-800">{item.cote}</td>
                          <td className="p-2 text-right font-mono text-slate-700">{item.valeurCoeff}</td>
                          <td className="p-2 text-center font-mono font-bold">{item.qty}</td>
                          <td className="p-2 text-right font-mono font-black text-slate-950">{item.totalPrice.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono font-black text-indigo-900">{item.insuranceAmount.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono font-black text-emerald-900">{item.patientAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 5. SUMMARY FINANCIAL RECAPITULATION TABLE */}
                <div className="print-totals-block grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">

                  <div className="sm:col-span-6 space-y-2 text-[10px] text-slate-700">
                    <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 space-y-1">
                      <div className="flex justify-between">
                        <span>TOTAL EXAMENS DE LABORATOIRE:</span>
                        <strong className="font-mono text-slate-900">{totalExamensLabo.toLocaleString()} {currency}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>TOTAL HT:</span>
                        <strong className="font-mono text-slate-900">{totalHT.toLocaleString()} {currency}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA (19,25%):</span>
                        <strong className="font-mono text-slate-600">Exonérée (Art. 128 CGI)</strong>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                        <span>TOTAL TTC:</span>
                        <strong className="font-mono text-slate-950">{totalTTC.toLocaleString()} {currency}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-6 space-y-2">
                    <div className="border-2 border-emerald-600 bg-emerald-50/90 rounded-lg p-2.5 text-emerald-950 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">TICKET MODÉRATEUR (PATIENT)</div>
                        <div className="text-[9px] text-emerald-700 font-semibold">{coPayPercent}% Quote-part à la charge du patient</div>
                      </div>
                      <div className="text-base font-black font-mono text-emerald-900">
                        {totalPatientTicketModerateur.toLocaleString()} {currency}
                      </div>
                    </div>

                    <div className="border-2 border-indigo-700 bg-indigo-50/90 rounded-lg p-2.5 text-indigo-950 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-indigo-900">NET À PAYER (ASSURANCE)</div>
                        <div className="text-[9px] text-indigo-700 font-semibold">{insuranceCoveragePercent}% Prise en charge officielle</div>
                      </div>
                      <div className="text-base font-black font-mono text-indigo-900">
                        {totalNetAPayerAssurance.toLocaleString()} {currency}
                      </div>
                    </div>
                  </div>

                </div>

                {/* 6. VERBAL CERTIFICATION IN FRENCH */}
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-900 uppercase leading-relaxed">
                  ARRÊTÉ LA PRÉSENTE FACTURE À LA SOMME DE : <span className="underline">{amountInWords} FRANCS CFA</span>
                </div>

                {/* 7. Reserved blank space for physical stamp / signature */}
                <div className="print-signature-block pt-6 pb-4" style={{ minHeight: '60mm' }} />

              </div>
            ) : (
              /* ========================================================================= */
              /* TEMPLATE 1: MODERN ACCREDITED EMERALD LETTERHEAD                          */
              /* ========================================================================= */
              <div className="space-y-4">

                <div className="print-header-block">
                  {tplConfig.headerImageUrl ? (
                    <div className="border-b-2 border-teal-800 pb-2">
                      <img
                        src={tplConfig.headerImageUrl}
                        alt={labName}
                        style={{ maxHeight: `${tplConfig.headerImageHeight || 110}px` }}
                        className="w-full object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border-b-2 border-teal-800 pb-3 gap-3">
                      <div className="flex items-center gap-3">
                        {targetLab?.logoUrl ? (
                          <img
                            src={targetLab.logoUrl}
                            alt={labName}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-contain border border-teal-300 bg-white p-1 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black shrink-0">
                            <Building2 className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <div>
                          <h1 className="text-lg font-black uppercase text-slate-950">{labName}</h1>
                          <p className="text-[11px] font-bold text-teal-800">{labSlogan}</p>
                          <p className="text-[9px] text-slate-500 font-mono">{labArrete} • {labTaxId}</p>
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-slate-600 font-medium shrink-0">
                        <div className="font-bold text-slate-900">{labAddress}</div>
                        <div>Tél: {labPhone}</div>
                        <div>Email: {labEmail}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="text-base font-black text-slate-900 uppercase">
                    Facture / Diagnostic Service Receipt #{invoiceNum}
                  </h2>
                  <span className="text-slate-600 font-medium">{receiptDateFormatted}</span>
                </div>

                <div className="print-patient-box grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10.5px]">
                  <div>
                    <div>Patient: <strong className="text-slate-950 notranslate" translate="no">{patientName}</strong></div>
                    <div>PID: <strong className="font-mono text-teal-700">{booking.patientPid || '--'}</strong></div>
                    <div>Contact: <strong className="font-mono">{patientPhone}</strong></div>
                  </div>
                  <div className="text-right">
                    <div>Prescripteur: <strong className="notranslate" translate="no">Ref. Doctor: {booking.doctorName || referringDoctorDisplay || '--'}</strong></div>
                    <div>Organisme: <strong className="notranslate" translate="no">{insuranceProviderName}</strong></div>
                    <div>Couverture: <strong className="text-teal-800">{insuranceCoveragePercent}%</strong></div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                  <table className="w-full text-left print-billing-table">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-center">COTE</th>
                        <th className="p-2 text-right">Total HT</th>
                        <th className="p-2 text-right text-teal-900">Assurance ({insuranceCoveragePercent}%)</th>
                        <th className="p-2 text-right text-emerald-900">Patient ({coPayPercent}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-slate-900">{item.designation}</td>
                          <td className="p-2 text-center font-mono">{item.cote}</td>
                          <td className="p-2 text-right font-mono font-bold">{item.totalPrice.toLocaleString()} {currency}</td>
                          <td className="p-2 text-right font-mono font-bold text-teal-900">{item.insuranceAmount.toLocaleString()} {currency}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-900">{item.patientAmount.toLocaleString()} {currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="print-totals-block grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-emerald-800">Part Patient (Ticket Modérateur)</div>
                    <div className="text-base font-black font-mono text-emerald-900">{totalPatientTicketModerateur.toLocaleString()} {currency}</div>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-right">
                    <div className="text-[10px] uppercase font-bold text-teal-800">Part Assureur (Net à Payer)</div>
                    <div className="text-base font-black font-mono text-teal-900">{totalNetAPayerAssurance.toLocaleString()} {currency}</div>
                  </div>
                </div>

                {/* Reserved blank space for physical stamp / signature */}
                <div className="print-signature-block pt-6 pb-4" style={{ minHeight: '60mm' }} />

              </div>
            )}

          </div>
        </div>

        {/* Modal Bottom Footer (Non-printable) */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 print:hidden shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer text-xs"
          >
            Close Receipt
          </button>
        </div>

      </div>
    </div>
  );
};

export default MedicalReceiptModal;