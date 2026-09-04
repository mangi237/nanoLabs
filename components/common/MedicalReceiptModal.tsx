import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Percent, 
  ShieldCheck, 
  Receipt,
  FileText,
  Clock,
  Sparkles,
  Layers,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { PatientBooking } from '../../services/limsService';
import { formatDOBDisplay, CAMEROON_INSURANCE_PROVIDERS, PRELEVEMENT_ACT_CODES } from '../../data/cameroonInsurances';
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
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [templates, setTemplates] = useState<HeaderFooterTemplateConfig[]>(DEFAULT_HEADER_FOOTER_TEMPLATES);

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
      const targetIdx = selectedTemplateIndex >= 2 ? selectedTemplateIndex : 2;
      updated[targetIdx] = {
        ...updated[targetIdx],
        headerImageUrl: result,
        useHeaderImageOnly: true
      };
      setTemplates(updated);
      setSelectedTemplateIndex(targetIdx);
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

  const tplConfig = templates[selectedTemplateIndex] || templates[0] || DEFAULT_HEADER_FOOTER_TEMPLATES[0];

  // Lab metadata from real lab configuration
  const labName = tplConfig.labName || labInfo?.name || booking.labName || 'LABORATOIRE BIODIAGNOSTICS';
  const labSlogan = tplConfig.subTitle || labInfo?.slogan || 'ANALYSES DE BIOLOGIE MEDICALE';
  const labAddress = tplConfig.address || labInfo?.address || 'Vallée 3 Boutiques, Entrée Polyclinique Poitiers';
  const labPhone = tplConfig.phone || labInfo?.phone || '33 06 21 23';
  const labEmergency = tplConfig.emergencyPhone || '699 92 91 98';
  const labEmail = tplConfig.email || labInfo?.email || 'biodiagnostics.dla@gmail.com';
  const labWebsite = tplConfig.website || labInfo?.website || '';
  const labArrete = tplConfig.arreteNumber || 'Arrêté N° 032/A/MSP/SG/DMH/SDHFS/SL/1991';
  const labAgrement = tplConfig.agrementNumber || 'Agrément N° 019 MINSAP';
  const labTaxId = tplConfig.taxNumber || 'Contribuable N° P1256 0000 6852-X';
  const directorName = tplConfig.directorName || 'Dr TANKOUA Jean Alain';
  const directorDiplomas = tplConfig.directorDiplomas || 'Diplômé de l\'Université René Descartes (Paris V) • Ex Attaché des Hôpitaux de Paris & Hôpital Général de Dla';
  const directorSpecialties = tplConfig.directorSpecialties || 'Etudes Spéciales de Biochimie, Hématologie, Immunologie, Parasitologie, Bactériologie et de Virologie Cliniques';
  const biologistSignatureTitle = tplConfig.biologistSignatureTitle || 'BIOLOGISTE-CLINICIEN / LA DIRECTION';

  // Consolidate payment attributes
  const pDetails = paymentDetails || booking.paymentDetails || {};
  const currency = paymentDetails?.currency || 'FCFA';
  const paymentMethod = (paymentDetails?.paymentMethod || booking.paymentMethod || pDetails.paymentMethod || 'Cash').toLowerCase();
  const discountAmount = paymentDetails?.discountAmount ?? booking.discountAmount ?? pDetails.discountAmount ?? 0;
  const discountType = paymentDetails?.discountType || booking.discountType || pDetails.discountType || '';
  const couponCode = paymentDetails?.couponCode || booking.couponCode || pDetails.couponCode || '';
  const couponSponsorName = paymentDetails?.couponSponsorName || booking.couponSponsorName || pDetails.couponSponsorName || '';
  const couponNotes = paymentDetails?.couponNotes || booking.couponNotes || pDetails.couponNotes || '';
  
  // Worker Benefit fields
  const workerStaffName = paymentDetails?.workerStaffName || booking.workerStaffName || pDetails.workerStaffName || '';
  const workerStaffId = paymentDetails?.workerStaffId || booking.workerStaffId || pDetails.workerStaffId || '';
  const workerDepartment = paymentDetails?.workerDepartment || booking.workerDepartment || pDetails.workerDepartment || '';
  const workerBenefitType = paymentDetails?.workerBenefitType || booking.workerBenefitType || pDetails.workerBenefitType || '';
  const workerAuthNote = paymentDetails?.workerAuthNote || booking.workerAuthNote || pDetails.workerAuthNote || '';

  // Mobile Money fields
  const momoProvider = paymentDetails?.momoProvider || booking.momoProvider || pDetails.momoProvider || (paymentMethod.includes('orange') ? 'ORANGE' : 'MTN');
  const momoSenderPhone = paymentDetails?.momoSenderPhone || booking.momoSenderPhone || pDetails.momoSenderPhone || pDetails.momoNumber || '';
  const momoSenderName = paymentDetails?.momoSenderName || booking.momoSenderName || pDetails.momoSenderName || '';
  const momoTxId = paymentDetails?.momoTxId || booking.momoTxId || pDetails.momoTxId || pDetails.transactionRef || '';

  // Bank Transfer fields
  const bankName = paymentDetails?.bankName || booking.bankName || pDetails.bankName || '';
  const bankAccountName = paymentDetails?.bankAccountName || booking.bankAccountName || pDetails.bankAccountName || '';
  const bankReference = paymentDetails?.bankReference || booking.bankReference || pDetails.bankReference || pDetails.transactionRef || '';
  const bankBranch = paymentDetails?.bankBranch || booking.bankBranch || pDetails.bankBranch || '';

  // Card fields
  const cardScheme = paymentDetails?.cardScheme || booking.cardScheme || pDetails.cardScheme || pDetails.cardType || 'Visa / Mastercard';
  const cardLast4 = paymentDetails?.cardLast4 || booking.cardLast4 || pDetails.cardLast4 || '';
  const cardAuthCode = paymentDetails?.cardAuthCode || booking.cardAuthCode || pDetails.cardAuthCode || '';

  // Cash fields
  const cashGiven = paymentDetails?.cashGiven ?? pDetails.cashGiven;
  const cashChange = paymentDetails?.cashChange ?? pDetails.cashChange;

  // Insurance details
  const insuranceProviderName = paymentDetails?.insuranceProvider || booking.insuranceProvider || pDetails.insuranceProvider || pDetails.insuranceDetails?.provider || 'ASCOMA CAMEROUN S.A.';
  const insurancePolicyNumber = paymentDetails?.insurancePolicyNumber || booking.insurancePolicyNumber || pDetails.insurancePolicyNumber || pDetails.insuranceDetails?.policyNumber || 'CSA-8812';
  
  // Find matched insurance provider metadata
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

  // Patient Demographic Fields
  const patientName = booking.patientName || 'CHIKWADO NWEKE CHRISTIANUS';
  const beneficiaryName = (booking as any).insuredBeneficiaryName || (booking as any).beneficiaryName || patientName;
  const matricule = (booking as any).matricule || (booking as any).insurancePolicyNumber || booking.insurancePolicyNumber || '004071';
  const patientDob = booking.dateOfBirth || booking.dob || '1986-02-15';
  const patientGender = booking.patientGender || 'Male';
  const patientPhone = booking.patientPhone || '670024784';
  const society = (booking as any).society || (booking as any).employer || (booking as any).company || 'CIBLE RH EMPLOI SARL';
  const bpcNumber = (booking as any).bpcNumber || (booking as any).bpc || 'CSA';
  const dossierNumber = (booking as any).dossierNumber || (booking as any).dosNumber || (booking.bookingCode ? booking.bookingCode.replace(/\D/g, '').slice(-2) : '58');
  const invoiceNum = (booking.invoiceNumber || (booking.bookingCode ? booking.bookingCode.replace(/\D/g, '') : '000060')).padStart(6, '0');

  // Ordered and Paid Tests
  const testsList = booking.tests && booking.tests.length > 0 ? booking.tests : [
    {
      id: 't-gly',
      testName: 'GLYP# DOSAGE DU GLUCOSE PLASMATIQUE',
      cote: 'B10',
      price: 520,
      sampleTypeRequired: 'Plasma fluoré'
    },
    {
      id: 't-iono',
      testName: 'IONOC# IONOGRAMME PLASMATIQUE COMPLET',
      cote: 'B95',
      price: 4940,
      sampleTypeRequired: 'Sérum / Sang total'
    }
  ];

  // Helper to determine COTE code & base rate for a test
  const bUnitRate = matchedInsurance.baseRateB || 260;
  const kbUnitRate = matchedInsurance.baseRateKB || 1200;

  // Process Line Items with Granular Insurance Breakdown
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

  // 1. Check if we need to auto-incorporate Prelevement Acts (PK# Acte Prelevement Selles, PSE# Acte Prelevement Sang)
  const hasBlood = testsList.some((t: any) => (t.sampleTypeRequired || t.sampleType || '').toLowerCase().includes('sang') || (t.sampleTypeRequired || t.sampleType || '').toLowerCase().includes('blood') || (t.sampleTypeRequired || t.sampleType || '').toLowerCase().includes('sérum') || (t.sampleTypeRequired || t.sampleType || '').toLowerCase().includes('plasma'));
  const hasStool = testsList.some((t: any) => (t.testName || t.name || '').toLowerCase().includes('selle') || (t.sampleTypeRequired || t.sampleType || '').toLowerCase().includes('selle') || (t.sampleTypeRequired || t.sampleType || '').toLowerCase().includes('stool'));

  // If stool test present and not already added as an explicit line item
  if (hasStool && !testsList.some((t: any) => (t.testName || '').includes('PK#'))) {
    const pkPrice = Math.round(1.0 * (kbUnitRate / 5)); // 240 FCFA
    const pkIns = Math.round(pkPrice * (insuranceCoveragePercent / 100)); // 192 FCFA
    const pkPat = pkPrice - pkIns; // 48 FCFA
    lineItems.push({
      designation: 'PK# ACTE PRELEVEMENT SELLES',
      cote: 'KB1,0',
      valeurCoeff: (kbUnitRate).toLocaleString(),
      qty: 1,
      totalPrice: pkPrice,
      insuranceAmount: pkIns,
      patientAmount: pkPat
    });
  }

  // If blood test present and not already added as an explicit line item
  if (hasBlood && !testsList.some((t: any) => (t.testName || '').includes('PSE#'))) {
    const psePrice = Math.round(1.5 * (kbUnitRate / 5)); // 372 FCFA
    const pseIns = Math.round(psePrice * (insuranceCoveragePercent / 100)); // 298 FCFA
    const psePat = psePrice - pseIns; // 74 FCFA
    lineItems.push({
      designation: 'PSE# ACTE DE PRELEVEMENT DE SANG ES',
      cote: 'KB1,5',
      valeurCoeff: (kbUnitRate).toLocaleString(),
      qty: 1,
      totalPrice: psePrice,
      insuranceAmount: pseIns,
      patientAmount: psePat
    });
  }

  // 2. Add each diagnostic test with its COTE calculation
  testsList.forEach((t: any) => {
    let cote = t.cote || 'B10';
    let lineTotal = t.price || t.totalPrice || 520;
    let coeffStr = (bUnitRate).toLocaleString();

    // If test has explicit COTE e.g. B95, B10, KB1,0
    if (t.testName?.includes('IONO') || t.testName?.includes('IONOC')) {
      cote = 'B95';
      lineTotal = 4940;
    } else if (t.testName?.includes('GLYC') || t.testName?.includes('GLYP')) {
      cote = 'B10';
      lineTotal = 520;
    } else if (t.testName?.includes('NFS') || t.testName?.includes('HEMOG')) {
      cote = 'B45';
      lineTotal = 2340;
    } else if (t.testName?.includes('CHOL') || t.testName?.includes('LIPID')) {
      cote = 'B30';
      lineTotal = 1560;
    }

    const insShare = Math.round(lineTotal * (insuranceCoveragePercent / 100));
    const patShare = lineTotal - insShare;

    lineItems.push({
      designation: t.testName || t.name || 'EXAMEN DE BIOLOGIE MEDICALE',
      cote,
      valeurCoeff: coeffStr,
      qty: 1,
      totalPrice: lineTotal,
      insuranceAmount: insShare,
      patientAmount: patShare
    });
  });

  // Calculate Cumulative Financial Breakdown
  const totalExamensLabo = lineItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalHT = totalExamensLabo;
  const totalTTC = totalHT;
  const depassement = 0;
  const totalPatientTicketModerateur = lineItems.reduce((acc, item) => acc + item.patientAmount, 0);
  const totalNetAPayerAssurance = lineItems.reduce((acc, item) => acc + item.insuranceAmount, 0);

  // Convert Insurance / Final Amount to French Words
  const amountInWords = numberToFrenchWords(totalNetAPayerAssurance);

  const isWorkerBenefit = paymentMethod === 'workers_benefit' || discountType === 'workers_benefit' || Boolean(workerStaffName);
  const isGiftCoupon = paymentMethod === 'gift_coupon' || discountType === 'coupon' || Boolean(couponCode);
  const isInsurance = paymentMethod === 'insurance' || Boolean(insuranceProviderName);
  const isMoMo = paymentMethod === 'mobile_money' || paymentMethod.includes('momo') || paymentMethod.includes('orange');
  const isBank = paymentMethod === 'bank_transfer' || paymentMethod.includes('bank');

  const receiptDateFormatted = booking.paidAt 
    ? new Date(booking.paidAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePrint = () => {
    window.print();
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
            {/* Template Selector */}
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

            {/* Direct Upload Buttons for Header and Footer */}
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

        {/* Printable Paper Document Container */}
        <div className="overflow-y-auto flex-1 p-2 sm:p-5 bg-slate-200 my-2 rounded-2xl print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          <div 
            id="medical-receipt-sheet"
            className="bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden max-w-3xl mx-auto font-sans text-slate-950 p-6 sm:p-8 space-y-4 print:shadow-none print:border-none print:max-w-none print:p-0 text-xs"
          >
            
            {/* Custom Uploaded Header Image if provided */}
            {tplConfig.headerImageUrl && (
              <div className="border-b-2 border-slate-900 pb-2">
                <img 
                  src={tplConfig.headerImageUrl} 
                  alt={labName} 
                  style={{ maxHeight: `${tplConfig.headerImageHeight || 110}px` }}
                  className="w-full object-contain mx-auto"
                />
              </div>
            )}

            {/* ========================================================================= */}
            {/* TEMPLATE 2: OFFICIAL CAMEROON BIODIAGNOSTICS FACTURE EXTERNE             */}
            {/* ========================================================================= */}
            {selectedTemplateIndex % 2 === 1 || selectedTemplateIndex === 1 ? (
              <div className="space-y-4">
                
                {/* 1. OFFICIAL LETTERHEAD HEADER (if no custom header image) */}
                {!tplConfig.headerImageUrl && (
                  <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-950 tracking-tight">
                        {labName}
                      </h1>
                    </div>
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      {labSlogan}
                    </h2>
                    
                    <div className="text-xs font-bold text-slate-900 pt-1">
                      {directorName}
                    </div>
                    <div className="text-[10px] text-slate-700 font-medium leading-tight max-w-2xl mx-auto">
                      {directorDiplomas}
                    </div>
                    <div className="text-[9.5px] text-slate-600 italic leading-tight max-w-2xl mx-auto">
                      {directorSpecialties}
                    </div>

                    <div className="text-[9px] text-slate-600 font-mono pt-1">
                      {labArrete} • {labAgrement} • {labTaxId}
                    </div>
                    <div className="text-[9px] text-slate-700 font-semibold">
                      {labAddress} • Tél: {labPhone} • Urgences: {labEmergency}
                    </div>
                  </div>
                )}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10.5px]">
                  
                  {/* Left: Patient Demographic Box */}
                  <div className="border border-slate-400 rounded-lg p-3 bg-slate-50/60 space-y-1">
                    <div className="font-black uppercase text-slate-950 pb-1 border-b border-slate-200">
                      IDENTIFICATION DU PATIENT
                    </div>
                    <div>Assuré Principal: <strong className="font-bold text-slate-950">{patientName}</strong></div>
                    <div>Bénéficiaire: <strong className="font-semibold">{beneficiaryName}</strong></div>
                    <div className="font-mono text-[10px]">
                      Matricule: <strong>{matricule}</strong> • Né(e) le: <strong>{formatDOBDisplay(patientDob)}</strong>
                    </div>
                    <div>
                      Sexe: <strong>{patientGender === 'Female' ? 'F' : 'M'}</strong> • Tél: <strong className="font-mono">{patientPhone}</strong>
                    </div>
                    <div>Société: <strong className="font-bold">{society}</strong></div>
                    <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between font-mono font-bold text-slate-800 text-[10px]">
                      <span>N° BPC: {bpcNumber}</span>
                      <span>N° Dos: {dossierNumber}</span>
                    </div>
                  </div>

                  {/* Right: Insurance Provider Box */}
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
                      <span>N.I.U.: <strong>{matchedInsurance.taxId || 'M025300001665C'}</strong></span>
                      <span>R.C.: <strong>{matchedInsurance.rcNumber || 'RC/DLA/1953/B/166'}</strong></span>
                    </div>
                  </div>

                </div>

                {/* 4. GRANULAR COTE ITEMIZED BILLING TABLE */}
                <div className="border border-slate-400 rounded-lg overflow-hidden text-[10px]">
                  <table className="w-full text-left">
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
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  
                  {/* Left Column: Taxes & Exoneration info (7 cols) */}
                  <div className="sm:col-span-6 space-y-2 text-[10px] text-slate-700">
                    <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 space-y-1">
                      <div className="flex justify-between">
                        <span>TOTAL EXAMENS DE LABORATOIRE:</span>
                        <strong className="font-mono text-slate-900">{totalExamensLabo.toLocaleString()} FCFA</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>TOTAL HT:</span>
                        <strong className="font-mono text-slate-900">{totalHT.toLocaleString()} FCFA</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA (19,25%):</span>
                        <strong className="font-mono text-slate-600">Exonérée (Art. 128 CGI)</strong>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                        <span>TOTAL TTC:</span>
                        <strong className="font-mono text-slate-950">{totalTTC.toLocaleString()} FCFA</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>DÉPASSEMENT:</span>
                        <strong className="font-mono">0 FCFA</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Ticket Moderateur & Net A Payer (5 cols) */}
                  <div className="sm:col-span-6 space-y-2">
                    <div className="border-2 border-emerald-600 bg-emerald-50/90 rounded-lg p-2.5 text-emerald-950 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">TICKET MODÉRATEUR (PATIENT)</div>
                        <div className="text-[9px] text-emerald-700 font-semibold">{coPayPercent}% Quote-part à la charge du patient</div>
                      </div>
                      <div className="text-base font-black font-mono text-emerald-900">
                        {totalPatientTicketModerateur.toLocaleString()} FCFA
                      </div>
                    </div>

                    <div className="border-2 border-indigo-700 bg-indigo-50/90 rounded-lg p-2.5 text-indigo-950 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-indigo-900">NET À PAYER (ASSURANCE)</div>
                        <div className="text-[9px] text-indigo-700 font-semibold">{insuranceCoveragePercent}% Prise en charge officielle</div>
                      </div>
                      <div className="text-base font-black font-mono text-indigo-900">
                        {totalNetAPayerAssurance.toLocaleString()} FCFA
                      </div>
                    </div>
                  </div>

                </div>

                {/* 6. VERBAL CERTIFICATION IN FRENCH */}
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-900 uppercase leading-relaxed">
                  ARRÊTÉ LA PRÉSENTE FACTURE À LA SOMME DE : <span className="underline">{amountInWords} FRANCS CFA</span>
                </div>

                {/* 7. DUAL SIGNATURE STAMPS */}
                <div className="pt-4 flex items-end justify-between text-[10px]">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 uppercase">Signature / Date / Tél Assuré(e) :</div>
                    <div className="h-12 w-48 border-b border-slate-400 flex items-end pb-1 italic text-slate-400 text-[9px]">
                      Lu et approuvé ({patientPhone})
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-bold text-slate-900 uppercase">{biologistSignatureTitle} :</div>
                    <div className="h-12 flex flex-col items-end justify-end font-serif font-black text-blue-950 italic text-xs">
                      <div>{directorName}</div>
                      <div className="text-[8px] font-sans font-normal text-slate-500 not-italic">Biologiste-Clinicien Agréé</div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* ========================================================================= */
              /* TEMPLATE 1: MODERN ACCREDITED EMERALD LETTERHEAD                          */
              /* ========================================================================= */
              <div className="space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-teal-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black uppercase text-slate-950">{labName}</h1>
                      <p className="text-[11px] font-bold text-teal-800">{labSlogan}</p>
                      <p className="text-[9px] text-slate-500 font-mono">{labArrete} • {labTaxId}</p>
                    </div>
                  </div>

                  <div className="text-right text-[10px] text-slate-600 font-medium">
                    <div className="font-bold text-slate-900">{labAddress}</div>
                    <div>Tél: {labPhone}</div>
                    <div>Email: {labEmail}</div>
                  </div>
                </div>

                {/* Title */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="text-base font-black text-slate-900 uppercase">
                    Facture / Diagnostic Service Receipt #{invoiceNum}
                  </h2>
                  <span className="text-slate-600 font-medium">{receiptDateFormatted}</span>
                </div>

                {/* Patient Summary */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10.5px]">
                  <div>
                    <div>Patient: <strong className="text-slate-950">{patientName}</strong></div>
                    <div>PID: <strong className="font-mono text-teal-700">{booking.patientPid || 'P-555'}</strong></div>
                    <div>Contact: <strong className="font-mono">{patientPhone}</strong></div>
                  </div>
                  <div className="text-right">
                    <div>Prescripteur: <strong>{booking.doctorName || 'Dr. Attending Physician'}</strong></div>
                    <div>Organisme: <strong>{insuranceProviderName}</strong></div>
                    <div>Couverture: <strong className="text-teal-800">{insuranceCoveragePercent}%</strong></div>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                  <table className="w-full text-left">
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
                          <td className="p-2 text-right font-mono font-bold">{item.totalPrice.toLocaleString()} FCFA</td>
                          <td className="p-2 text-right font-mono font-bold text-teal-900">{item.insuranceAmount.toLocaleString()} FCFA</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-900">{item.patientAmount.toLocaleString()} FCFA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Box */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-emerald-800">Part Patient (Ticket Modérateur)</div>
                    <div className="text-base font-black font-mono text-emerald-900">{totalPatientTicketModerateur.toLocaleString()} FCFA</div>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-right">
                    <div className="text-[10px] uppercase font-bold text-teal-800">Part Assureur (Net à Payer)</div>
                    <div className="text-base font-black font-mono text-teal-900">{totalNetAPayerAssurance.toLocaleString()} FCFA</div>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px]">
                  <div>
                    <div className="text-slate-500">Signature Bénéficiaire:</div>
                    <div className="h-8 flex items-end italic text-slate-400">Lu et approuvé</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500">{biologistSignatureTitle}:</div>
                    <div className="font-serif font-black text-teal-950 italic text-sm">{directorName}</div>
                  </div>
                </div>

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
