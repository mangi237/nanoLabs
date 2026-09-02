import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { PatientBooking } from '../../services/limsService';
import { formatDOBDisplay } from '../../data/cameroonInsurances';

interface MedicalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PatientBooking | any;
  labInfo?: any;
  // Optional extra settled details if passed directly from cashier action
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
  if (!isOpen || !booking) return null;

  // Lab metadata from real lab configuration
  const labName = labInfo?.name || booking.labName || booking.sampleCollectedAt || 'Clinical Diagnostics Center';
  const labSlogan = labInfo?.slogan || labInfo?.tagline || 'Clinical Diagnostics & Laboratory Services';
  const labAddress = labInfo?.address || labInfo?.location || booking.labAddress || 'Central Medical Diagnostics';
  const labPhone = labInfo?.phone || labInfo?.contactNumber || booking.labPhone || '+237 600 000 000';
  const labEmail = labInfo?.email || labInfo?.contactEmail || booking.labEmail || 'info@diagnostics.com';
  const labWebsite = labInfo?.website || labInfo?.websiteUrl || booking.labWebsite || '';
  const labLicense = labInfo?.licenseNumber || '';
  const labTaxId = labInfo?.taxId || '';
  const labLogo = labInfo?.logoUrl || labInfo?.avatarUrl || labInfo?.logo || booking.labLogo || booking.labDetails?.logoUrl || booking.logoUrl || '';

  // Consolidate payment attributes from booking and paymentDetails object
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

  // Insurance fields
  const insuranceProvider = paymentDetails?.insuranceProvider || booking.insuranceProvider || pDetails.insuranceProvider || pDetails.insuranceDetails?.provider || '';
  const insurancePolicyNumber = paymentDetails?.insurancePolicyNumber || booking.insurancePolicyNumber || pDetails.insurancePolicyNumber || pDetails.insuranceDetails?.policyNumber || '';
  const coPayPercent = paymentDetails?.coPayPercent ?? booking.coPayPercent ?? pDetails.coPayPercent ?? pDetails.insuranceDetails?.coPayPercent ?? 20;

  // Handle multi-test orders where only some tests are confirmed & paid
  const allOrderedBookings = paymentDetails?.allOrderedBookings || [booking];
  const allOrderedTests = allOrderedBookings.flatMap(b => b.tests || []);

  // Actual tests that are confirmed & paid for this invoice/receipt
  const confirmedAndPaidTests = booking.tests || [];

  // Identify any requested tests that are pending confirmation/payment
  const otherUnpaidTests = allOrderedTests.filter(
    ot => !confirmedAndPaidTests.some((ct:any) => ct.id === ot.id || ct.testName === ot.testName)
  );

  const subtotal = booking.originalPrice || booking.totalAmount || confirmedAndPaidTests.reduce((sum:number, t:any ) => sum + (t.price || 5000), 0);
  const isWorkerBenefit = paymentMethod === 'workers_benefit' || discountType === 'workers_benefit' || Boolean(workerStaffName);
  const isGiftCoupon = paymentMethod === 'gift_coupon' || discountType === 'coupon' || Boolean(couponCode);
  const isInsurance = paymentMethod === 'insurance' || Boolean(insuranceProvider);
  const isMoMo = paymentMethod === 'mobile_money' || paymentMethod.includes('momo') || paymentMethod.includes('orange');
  const isBank = paymentMethod === 'bank_transfer' || paymentMethod.includes('bank');

  const finalPaidAmount = paymentDetails?.actualPaidAmount ?? booking.actualPaidAmount ?? (
    isWorkerBenefit && (!workerBenefitType || workerBenefitType.includes('100%')) ? 0 :
    isGiftCoupon && couponCode.toUpperCase().includes('100') ? 0 :
    booking.totalAmount ?? Math.max(0, subtotal - discountAmount)
  );

  // Insurance calculation
  const insurancePortion = isInsurance ? Math.max(0, subtotal - discountAmount - finalPaidAmount) : 0;

  const receiptDateFormatted = booking.paidAt 
    ? new Date(booking.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const receiptDateTimeFull = booking.paidAt 
    ? new Date(booking.paidAt).toLocaleString() 
    : new Date().toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-900 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 my-auto max-h-[95vh] flex flex-col">
        
        {/* Top Control Bar (Non-printable) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Official Medical Receipt Preview
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Receipt</span>
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
        <div className="overflow-y-auto flex-1 p-1 sm:p-4 bg-slate-100 my-2 rounded-2xl print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          <div 
            id="medical-receipt-sheet"
            className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-xl mx-auto font-sans text-slate-900 print:shadow-none print:border-none print:max-w-none print:p-0"
          >
            {/* Top Blue Wave Pattern Header (Matching medicalreceipt.png) */}
            <div className="relative bg-[#2b82c9] text-white p-5 sm:p-7 overflow-hidden">
              {/* Subtle background SVG waves */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                  <path d="M0,40 C150,90 350,0 500,60 L500,0 L0,0 Z" fill="#ffffff" />
                  <path d="M0,80 C200,140 300,30 500,100 L500,0 L0,0 Z" fill="#ffffff" opacity="0.5" />
                </svg>
              </div>

              <div className="relative z-10 flex items-start justify-between gap-4">
                {/* Left Medical Logo / Caduceus Box */}
                <div className="flex items-center gap-3">
                  {labLogo ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white/40 shrink-0 p-1 overflow-hidden">
                      <img 
                        src={labLogo} 
                        alt={labName} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#48bb78] rounded-xl flex items-center justify-center shadow-lg border-2 border-white/40 shrink-0">
                      <svg 
                        className="w-12 h-12 text-white" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.8" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        {/* Medical Caduceus / Asclepius Emblem */}
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        <circle cx="12" cy="3" r="1.5" fill="currentColor" />
                        <path d="M7 8c2.5-3 7.5-3 10 0" />
                        <path d="M8 14c2-2 6-2 8 0" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight drop-shadow-xs">
                      {labName}
                    </h1>
                    <p className="text-[11px] text-sky-100 font-semibold tracking-wide">
                      {labSlogan}
                    </p>
                    {labLicense && (
                      <p className="text-[10px] text-sky-200 font-mono">
                        Lic: {labLicense} {labTaxId ? `• TIN: ${labTaxId}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Top Contact Details */}
                <div className="text-right text-[10px] sm:text-[11px] text-white/95 font-medium space-y-0.5 shrink-0">
                  <div className="font-bold uppercase tracking-wider">{labAddress}</div>
                  {labEmail && <div className="font-mono text-sky-100">{labEmail.toUpperCase()}</div>}
                  {labWebsite && (
                    <div className="font-mono text-sky-100">
                      <a href={labWebsite.startsWith('http') ? labWebsite : `https://${labWebsite}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {labWebsite.replace(/^https?:\/\//, '').toUpperCase()}
                      </a>
                    </div>
                  )}
                  <div className="font-bold tracking-wide pt-0.5">{labPhone}</div>
                </div>
              </div>

              {/* Bottom Green Accent Strip */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#48bb78]"></div>
            </div>

            {/* Receipt Body Container */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Centered Document Title */}
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Medical Receipt
                </h2>
                <div className="text-[11px] font-mono font-bold text-slate-500">
                  Invoice Ref: #{booking.invoiceNumber || 'INV-2050-01'} • Order Code: {booking.bookingCode}
                </div>
              </div>

              {/* Metadata Section (Receipt Date, Patient Name, Patient Email/Phone) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-slate-200 pb-5">
                <div className="space-y-1.5">
                  <div>
                    <span className="font-bold text-slate-900">Receipt Date: </span>
                    <span className="text-slate-800 font-medium">{receiptDateFormatted}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Patient Name: </span>
                    <span className="text-slate-900 font-black">{booking.patientName || 'Baby Bartell'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Patient PID / ID: </span>
                    <span className="font-mono font-bold text-teal-700">{booking.patientPid || booking.patientId || 'P-555'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:text-right">
                  <div>
                    <span className="font-bold text-slate-900">Patient Email: </span>
                    <span className="text-slate-800 font-medium">{booking.patientEmail || `${(booking.patientName || 'patient').toLowerCase().replace(/\s+/g, '.')}@you.mail`}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Patient Phone: </span>
                    <span className="font-mono text-slate-800">{booking.patientPhone || labPhone}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Referring Doctor: </span>
                    <span className="text-slate-800 font-semibold">{booking.doctorName || 'Dr. Hiren Shah (General Medicine)'}</span>
                  </div>
                </div>
              </div>

              {/* SPECIAL CASE: Multi-Test Orders where some are pending and some are confirmed & paid */}
              {otherUnpaidTests.length > 0 && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1 text-xs">
                  <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Initial Diagnostic Requisition (Ordered Tests)</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Patient requested {allOrderedTests.length} tests in order #{booking.bookingCode}. 
                    Below indicates the <strong>actual verified and settled tests</strong> authorized by administration.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allOrderedTests.map((t, idx) => {
                      const isPaidThisInvoice = confirmedAndPaidTests.some((ct: any ) => ct.id === t.id || ct.testName === t.testName);
                      return (
                        <span 
                          key={idx} 
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPaidThisInvoice 
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                              : 'bg-slate-100 text-slate-600 border-slate-300 line-through opacity-70'
                          }`}
                        >
                          {t.testName} {isPaidThisInvoice ? '(Confirmed & Paid)' : '(Awaiting Lab Confirmation)'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Itemized Table (Matching medicalreceipt.png) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 uppercase tracking-wider">
                  <span>Actual Tests Done and Paid</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Admin Verified
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                        <th className="py-3 px-4 font-bold">Service Description</th>
                        <th className="py-3 px-4 text-center font-bold">Quantity</th>
                        <th className="py-3 px-4 text-right font-bold">Unit Price</th>
                        <th className="py-3 px-4 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {confirmedAndPaidTests.map((testItem : any, idx: number) => {
                        const unitPrice = testItem.price || 5000;
                        const qty = 1;
                        const lineTotal = unitPrice * qty;

                        return (
                          <tr key={testItem.id || idx} className="hover:bg-slate-50/60">
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              <div>{testItem.testName}</div>
                              <div className="text-[10px] text-slate-500 font-normal">
                                Specimen: {testItem.sampleTypeRequired || 'Blood / Serum'} • Category: {testItem.category || 'Diagnostic'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold">
                              {qty}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                              {unitPrice.toLocaleString()} {currency}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                              {lineTotal.toLocaleString()} {currency}
                            </td>
                          </tr>
                        );
                      })}

                      {/* If no test array, show standard booking service */}
                      {confirmedAndPaidTests.length === 0 && (
                        <tr>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            Clinical Laboratory Diagnostic Analysis
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">1</td>
                          <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                            {subtotal.toLocaleString()} {currency}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                            {subtotal.toLocaleString()} {currency}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discounts & Insurance Information Details */}
              {(Boolean(discountAmount) || Boolean(insuranceProvider) || isInsurance) && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  {/* Discount breakdown */}
                  {Boolean(discountAmount) && (
                    <div className="flex justify-between items-center text-emerald-800 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-emerald-600" />
                        Discount / Promotional Concession {couponCode ? `(${couponCode})` : ''}:
                      </span>
                      <span className="font-mono font-black">
                        -{discountAmount.toLocaleString()} {currency}
                      </span>
                    </div>
                  )}

                  {/* Insurance breakdown */}
                  {(Boolean(insuranceProvider) || isInsurance) && (
                    <div className="pt-1.5 border-t border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-indigo-950 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          HMO / Healthcare Insurance:
                        </span>
                        <span className="font-extrabold text-indigo-900">{insuranceProvider || 'Chanas / Activa HMO'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-indigo-900 font-medium">
                        <div>
                          <span>Policy / Matricule #: </span>
                          <strong className="font-mono">{insurancePolicyNumber || 'POL-99283-CAM'}</strong>
                        </div>
                        <div className="text-right">
                          <span>Coverage Split: </span>
                          <strong className="text-emerald-700">{100 - coPayPercent}% Insurer / {coPayPercent}% Patient Co-Pay</strong>
                        </div>
                      </div>
                      {insurancePortion > 0 && (
                        <div className="flex justify-between text-[11px] text-indigo-800 font-semibold pt-1 border-t border-indigo-100">
                          <span>Direct Insurance Subsidized Claim:</span>
                          <span className="font-mono font-bold">{(insurancePortion).toLocaleString()} {currency}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Total Amount Due / Total Paid (Matching medicalreceipt.png format) */}
              <div className="pt-2">
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Total Amount Due: <span className="font-mono">{finalPaidAmount.toLocaleString()} {currency}</span>
                </div>
              </div>

              {/* Payment Method & Detailed Transaction Breakdown */}
              <div className="space-y-3 text-xs text-slate-800 border-t border-slate-200 pt-4">
                
                {/* Method Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">Payment Channel: </span>
                    <span className="font-extrabold text-emerald-800 uppercase tracking-wide">
                      {isMoMo ? (momoProvider === 'ORANGE' ? 'Orange Money (OM)' : 'MTN Mobile Money (MoMo)') :
                       isBank ? `Bank Wire / Transfer (${bankName || 'Cameroon Commercial Bank'})` :
                       isWorkerBenefit ? 'Staff Healthcare Welfare Benefit (100% Grant)' :
                       isGiftCoupon ? 'Gift Coupon / Healthcare Voucher' :
                       isInsurance ? `Direct Health Insurance (${insuranceProvider || 'HMO'})` :
                       paymentMethod === 'card' ? `Credit / Debit Card (${cardScheme})` :
                       'Cash Over Counter'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 font-bold">
                    Ref: #{booking.invoiceNumber || booking.bookingCode || 'XYZ12345'}
                  </span>
                </div>

                {/* 1. MOBILE MONEY DETAILED BREAKDOWN (MTN MoMo / Orange Money) */}
                {isMoMo && (
                  <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/80">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Smartphone className="w-4 h-4 text-amber-700" />
                        <span>{momoProvider === 'ORANGE' ? 'Orange Money Cameroon' : 'MTN Mobile Money (MoMo)'} Settlement</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        momoProvider === 'ORANGE' ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-slate-950'
                      }`}>
                        {momoProvider === 'ORANGE' ? 'Orange OM' : 'MTN MoMo'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-950">
                      <div>
                        <span className="text-amber-800 font-semibold">Sender Phone Number: </span>
                        <strong className="font-mono text-slate-900">{momoSenderPhone || booking.patientPhone || 'Not specified'}</strong>
                      </div>
                      <div>
                        <span className="text-amber-800 font-semibold">MoMo Account Holder Name: </span>
                        <strong className="text-slate-900">{momoSenderName || booking.patientName || 'Registered Account'}</strong>
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-amber-200/60">
                        <span className="text-amber-800 font-semibold">Carrier TxID / SMS Reference: </span>
                        <strong className="font-mono text-xs text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-300">
                          {momoTxId || booking.bookingCode || 'TXN-MOMO-OK'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. BANK TRANSFER DETAILED BREAKDOWN */}
                {isBank && (
                  <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-blue-200">
                      <div className="flex items-center gap-1.5 font-bold text-blue-950">
                        <Building2 className="w-4 h-4 text-blue-700" />
                        <span>Commercial Bank Wire / Direct Deposit</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white uppercase">
                        Bank Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-blue-950">
                      <div>
                        <span className="text-blue-800 font-semibold">Bank Name: </span>
                        <strong className="text-slate-900">{bankName || 'Commercial Bank of Cameroon'}</strong>
                      </div>
                      <div>
                        <span className="text-blue-800 font-semibold">Account Holder / Sender: </span>
                        <strong className="text-slate-900">{bankAccountName || booking.patientName || 'Authorized Account'}</strong>
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-blue-200/60">
                        <span className="text-blue-800 font-semibold">Bank Transfer Ref / Slip ID: </span>
                        <strong className="font-mono text-xs text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-300">
                          {bankReference || booking.invoiceNumber || 'TRF-BK-CAM'}
                        </strong>
                      </div>
                      {bankBranch && (
                        <div className="sm:col-span-2 text-[10px] text-blue-700">
                          <span>Branch / Notes: {bankBranch}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. WORKERS BENEFITS & STAFF HEALTHCARE WELFARE BREAKDOWN */}
                {isWorkerBenefit && (
                  <div className="p-3.5 bg-emerald-50/90 rounded-xl border border-emerald-300 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
                      <div className="flex items-center gap-1.5 font-extrabold text-emerald-950">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Staff Healthcare Benefit & Employee Welfare Grant</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-700 text-white uppercase">
                        100% Staff Benefit
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-950">
                      <div>
                        <span className="text-emerald-800 font-semibold">Beneficiary / Staff Member: </span>
                        <strong className="text-slate-900">{workerStaffName || booking.patientName || 'Medical Staff'}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-800 font-semibold">Staff ID / Matricule: </span>
                        <strong className="font-mono text-slate-900">{workerStaffId || 'STF-MED-001'}</strong>
                      </div>
                      {workerDepartment && (
                        <div>
                          <span className="text-emerald-800 font-semibold">Department: </span>
                          <strong className="text-slate-900">{workerDepartment}</strong>
                        </div>
                      )}
                      <div>
                        <span className="text-emerald-800 font-semibold">Benefit Scheme: </span>
                        <strong className="text-emerald-800">{workerBenefitType || '100% Free Staff Healthcare Grant'}</strong>
                      </div>
                      {workerAuthNote && (
                        <div className="sm:col-span-2 text-[10px] text-emerald-800 pt-1 border-t border-emerald-200/60">
                          <span>Executive Authorization: {workerAuthNote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. GIFT COUPON & HEALTHCARE VOUCHER BREAKDOWN */}
                {isGiftCoupon && (
                  <div className="p-3.5 bg-purple-50/80 rounded-xl border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-purple-200">
                      <div className="flex items-center gap-1.5 font-bold text-purple-950">
                        <Percent className="w-4 h-4 text-purple-700" />
                        <span>Gift Coupon & Diagnostic Concession Voucher</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-700 text-white uppercase font-mono">
                        {couponCode || 'GIFT-VOUCHER'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-purple-950">
                      <div>
                        <span className="text-purple-800 font-semibold">Coupon / Voucher Code: </span>
                        <strong className="font-mono text-purple-900 bg-white px-1.5 py-0.5 rounded border border-purple-300">
                          {couponCode || 'GIFT100'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-purple-800 font-semibold">Sponsor / Grantor Name: </span>
                        <strong className="text-slate-900">{couponSponsorName || 'Diagnostic Wellness Program'}</strong>
                      </div>
                      {discountAmount > 0 && (
                        <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-purple-200/60">
                          <span className="text-purple-800 font-semibold">Total Gift Value Subsidized: </span>
                          <strong className="font-mono text-xs text-purple-900">-{discountAmount.toLocaleString()} {currency}</strong>
                        </div>
                      )}
                      {couponNotes && (
                        <div className="sm:col-span-2 text-[10px] text-purple-700">
                          <span>Voucher Purpose / Terms: {couponNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. CARD SETTLEMENT (POS) */}
                {paymentMethod === 'card' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Card Scheme: <strong>{cardScheme}</strong></span>
                      {cardLast4 && <span className="font-mono text-slate-700">Ending in **** {cardLast4}</span>}
                    </div>
                    {cardAuthCode && (
                      <div className="text-slate-600">POS Approval Code: <strong className="font-mono">{cardAuthCode}</strong></div>
                    )}
                  </div>
                )}

                {/* 6. CASH SETTLEMENT DETAILS */}
                {paymentMethod === 'cash' && (cashGiven !== undefined && cashGiven > 0) && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-slate-600">Cash Handed: </span>
                      <strong className="font-mono text-slate-900">{cashGiven.toLocaleString()} {currency}</strong>
                    </div>
                    {cashChange !== undefined && (
                      <div>
                        <span className="text-slate-600">Change Returned: </span>
                        <strong className="font-mono text-emerald-700 font-bold">{cashChange.toLocaleString()} {currency}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* General Settlement Footnote */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-1">
                  <div>
                    <span className="font-bold text-slate-900">Cashier / Staff: </span>
                    <span className="font-semibold text-slate-700">{paymentDetails?.cashierName || booking.paymentProcessedBy || 'Authorized Medical Cashier'}</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="font-bold text-slate-900">Settled At: </span>
                    <span className="font-mono text-slate-600">{receiptDateTimeFull}</span>
                  </div>
                </div>

              </div>

              {/* Professional Thank You Closing */}
              <div className="space-y-4 pt-4 border-t border-slate-200 text-xs leading-relaxed text-slate-700">
                <p>
                  Thank you for choosing <strong className="text-slate-900">{labName}</strong> for your healthcare and diagnostic needs.
                </p>

                <div className="h-px bg-slate-200 w-full"></div>

                <p className="text-[11px] text-slate-600">
                  For billing inquiries or report follow-up, please contact our front desk at <strong className="text-slate-900">{labEmail}</strong> or call <strong className="text-slate-900">{labPhone}</strong>.
                  {labWebsite && (
                    <span> Visit our official portal at <strong className="text-teal-700">{labWebsite}</strong>.</span>
                  )}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Bottom Footer (Non-printable) */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 print:hidden shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer text-xs"
          >
            Close Receipt
          </button>
        </div>

      </div>
    </div>
  );
};

export default MedicalReceiptModal;
