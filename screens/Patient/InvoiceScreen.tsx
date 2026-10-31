import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Receipt,
  Building,
  Phone
} from 'lucide-react';
import { formatXAF } from '../../shared/money';
import { MedicalReceiptModal } from '../../components/common/MedicalReceiptModal';
import { db, doc, getDoc } from '../../services/firebase';

interface InvoiceScreenProps {
  booking?: any;
  bookingId?: string;
  labId?: string;
  labName?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  testsAmount?: number;
  homePickupFee?: number;
  homeDeliveryFee?: number;
  addOns?: any[];
  tests?: any[];
  labPaymentDetails?: any;
  bookingCode?: string;
  onBack: () => void;
  onPaymentConfirmedByPatient: (txRef: string, method: string) => void;
  onPayLater: () => void;
}

export const InvoiceScreen: React.FC<InvoiceScreenProps> = ({
  booking: initialBooking,
  bookingId,
  labId = 'lab-1',
  labName: propLabName,
  invoiceNumber = 'INV-2026-001',
  totalAmount = 0,
  testsAmount,
  homePickupFee = 0,
  homeDeliveryFee = 0,
  addOns = [],
  tests = [],
  labPaymentDetails: propPaymentDetails,
  bookingCode = 'BK-000000',
  onBack,
  onPaymentConfirmedByPatient,
  onPayLater
}) => {
  const [liveBooking, setLiveBooking] = useState<any | null>(initialBooking || null);
  const [labConfig, setLabConfig] = useState<any | null>(propPaymentDetails || null);
  const [selectedMethod, setSelectedMethod] = useState<'momo' | 'om' | 'bank'>('momo');
  const [transactionRef, setTransactionRef] = useState<string>(initialBooking?.transactionReference || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofSubmittedLocal, setProofSubmittedLocal] = useState<boolean>(
    Boolean(initialBooking?.paymentProofSubmitted || initialBooking?.invoiceStatus === 'payment_submitted')
  );
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  const effectiveBookingId = liveBooking?.id || bookingId;
  const effectiveLabId = liveBooking?.labId || labId || 'lab-1';
  const effectiveLabName = liveBooking?.labName || propLabName || labConfig?.name || 'Performing Laboratory';

  // Sync live booking & lab payment accounts configured by Admin / Lab
  useEffect(() => {
    let mounted = true;
    const syncData = async () => {
      try {
        const { limsService } = await import('../../services/limsService');
        const all = await limsService.fetchPatientBookingsAcrossLabs([effectiveLabId]);
        const found = all.find(
          (b) =>
            (effectiveBookingId && b.id === effectiveBookingId) ||
            (bookingCode && b.bookingCode === bookingCode)
        );
        if (mounted && found) {
          setLiveBooking(found);
          if (found.paymentProofSubmitted || found.invoiceStatus === 'payment_submitted') {
            setProofSubmittedLocal(true);
          }
          if (found.transactionReference && !transactionRef) {
            setTransactionRef(found.transactionReference);
          }
        }
      } catch {}

      try {
        const labSnap = await getDoc(doc(db, 'labs', effectiveLabId));
        const paySnap = await getDoc(doc(db, 'labs', effectiveLabId, 'settings', 'payment_config'));
        const mergedConfig = {
          ...(labSnap.exists() ? labSnap.data() : {}),
          ...(paySnap.exists() ? paySnap.data() : {}),
          ...(liveBooking?.labPaymentDetails || propPaymentDetails || {})
        };
        if (mounted && Object.keys(mergedConfig).length > 0) {
          setLabConfig(mergedConfig);
        }
      } catch {}
    };

    syncData();
    window.addEventListener('nanolabs_booking_updated', syncData);
    return () => {
      mounted = false;
      window.removeEventListener('nanolabs_booking_updated', syncData);
    };
  }, [effectiveBookingId, effectiveLabId, bookingCode]);

  const activeTests = liveBooking?.tests || tests || [];
  const activeAddOns = liveBooking?.addOns || addOns || [];
  const activePickupFee = Number(liveBooking?.homePickupFee ?? homePickupFee ?? 0);
  const activeDeliveryFee = Number(liveBooking?.homeDeliveryFee ?? homeDeliveryFee ?? 0);

  const primaryTestsCost =
    liveBooking?.testsAmount !== undefined
      ? Number(liveBooking.testsAmount)
      : testsAmount !== undefined
        ? Number(testsAmount)
        : activeTests.reduce((sum: number, t: any) => sum + (Number(t.price || t.basePrice) || 0), 0);

  const addOnsCost = activeAddOns.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0);
  const grossInvoiceTotal =
    Number(liveBooking?.grossAmount || liveBooking?.originalTotalAmount) > 0 && liveBooking?.hasInsurance
      ? Math.max(primaryTestsCost + activePickupFee + activeDeliveryFee + addOnsCost, Number(liveBooking?.totalAmount || totalAmount))
      : primaryTestsCost + activePickupFee + activeDeliveryFee + addOnsCost || Number(liveBooking?.totalAmount || totalAmount);

  const hasInsurance = Boolean(liveBooking?.hasInsurance && liveBooking?.insuranceProvider);
  const coveragePct = hasInsurance ? Number(liveBooking?.insuranceCoveragePercent || 80) : 0;
  const insuranceShare = hasInsurance
    ? Number(liveBooking?.insuranceCoveredAmount || Math.round(primaryTestsCost * (coveragePct / 100)))
    : 0;
  const netPatientPayable = hasInsurance
    ? Number(liveBooking?.patientCoPayAmount ?? Math.max(0, grossInvoiceTotal - insuranceShare))
    : Number(liveBooking?.totalAmount || grossInvoiceTotal || totalAmount);

  const mtnNumber = labConfig?.mtnMomoNumber || labConfig?.momoNumber || liveBooking?.labPhone || '+237 670 12 34 56';
  const mtnMerchant = labConfig?.mtnMomoName || labConfig?.merchantName || effectiveLabName;
  const orangeNumber = labConfig?.orangeMoneyNumber || '+237 690 12 34 56';
  const orangeMerchant = labConfig?.orangeMoneyName || labConfig?.merchantName || effectiveLabName;
  const bankDetails = labConfig?.bankAccountNumber || labConfig?.bankRib || 'Afriland First Bank — Account Configured by Lab';
  const bankName = labConfig?.bankName || 'Bank / Wire Transfer';

  const isCashierConfirmedPaid = liveBooking?.paymentStatus === 'paid';
  const isWaitingCashierConfirmation =
    !isCashierConfirmedPaid &&
    (proofSubmittedLocal || liveBooking?.paymentProofSubmitted || liveBooking?.invoiceStatus === 'payment_submitted');

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = transactionRef.trim();
    if (!cleanRef) return;

    setIsSubmitting(true);
    try {
      const methodKey =
        selectedMethod === 'momo'
          ? 'mobile_money_mtn'
          : selectedMethod === 'om'
            ? 'mobile_money_orange'
            : 'bank_transfer';

      if (effectiveBookingId) {
        const { limsService } = await import('../../services/limsService');
        await limsService.submitPatientPaymentProof(
          effectiveLabId,
          effectiveBookingId,
          cleanRef,
          methodKey
        );
      }
      setProofSubmittedLocal(true);
      onPaymentConfirmedByPatient(cleanRef, methodKey);
    } catch (err) {
      console.error('Error submitting payment proof:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-3 px-2 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Official Laboratory Invoice
          </h1>
          <p className="text-[11px] text-slate-500">
            Booking: <strong className="font-mono text-slate-800">{liveBooking?.bookingCode || bookingCode}</strong> &middot; Invoice #{liveBooking?.invoiceNumber || invoiceNumber}
          </p>
        </div>
      </div>

      {/* Invoice Itemized Breakdown Card */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">{effectiveLabName}</h3>
              <p className="text-[11px] text-slate-500">
                {liveBooking?.labAddress || labConfig?.address || 'Official Cashier Billing Statement'}
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold ${
              isCashierConfirmedPaid
                ? 'text-emerald-700'
                : isWaitingCashierConfirmation
                  ? 'text-blue-700'
                  : 'text-amber-700'
            }`}
          >
            {isCashierConfirmedPaid
              ? 'Verified & Paid'
              : isWaitingCashierConfirmation
                ? 'Pending Cashier Confirmation'
                : 'Awaiting Payment'}
          </span>
        </div>

        {/* Dynamic Formula Breakdown: Primary Lab Test Cost + Justifiable Additional Costs */}
        <div className="space-y-2.5 py-1 text-xs">
          <span className="text-[11px] font-bold text-slate-500 block">
            1. Primary Diagnostic Tests ({activeTests.length})
          </span>

          {activeTests.length > 0 && (
            <div className="pl-2 space-y-1 text-xs text-slate-600">
              {activeTests.map((t: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{t.testName || t.name}</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {formatXAF(Number(t.price || t.basePrice) || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-600 font-semibold">Primary Lab Test Cost Subtotal</span>
            <span className="font-mono tabular-nums font-bold text-slate-900">
              {formatXAF(primaryTestsCost)}
            </span>
          </div>

          {/* 2. Home Pickup / Delivery Fees */}
          {activePickupFee > 0 && (
            <div className="flex items-center justify-between py-1.5 border-t border-slate-100 text-slate-800">
              <span className="font-semibold">Home Sample Pickup & Cold-Chain Courier</span>
              <span className="font-mono tabular-nums font-bold">+{formatXAF(activePickupFee)}</span>
            </div>
          )}

          {activeDeliveryFee > 0 && (
            <div className="flex items-center justify-between py-1.5 border-t border-slate-100 text-slate-800">
              <span className="font-semibold">Physical Hardcopy Result Delivery</span>
              <span className="font-mono tabular-nums font-bold">+{formatXAF(activeDeliveryFee)}</span>
            </div>
          )}

          {/* 3. Cashier Justifiable Additional Costs */}
          {activeAddOns.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 block">
                2. Justifiable Additional Costs (Added by Lab Cashier)
              </span>
              {activeAddOns.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs text-slate-700 pl-2">
                  <span>
                    {item.name || item.code}{' '}
                    {item.category ? <span className="text-slate-400">({item.category})</span> : null}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    +{formatXAF(Number(item.price) || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 4. Automatic Insurance Coverage Split */}
          {hasInsurance && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1 mt-2">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span>Insurance Applied: {liveBooking.insuranceProvider}</span>
                <span className="font-mono text-[11px]">Policy #{liveBooking.insurancePolicyNumber}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-800">
                <span>Automatic Insurer Caisse Coverage ({coveragePct}%):</span>
                <span className="font-mono tabular-nums font-bold">-{formatXAF(insuranceShare)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Final Net Patient Payable */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div>
            <span className="text-xs font-bold text-slate-600">
              {hasInsurance ? 'Net Patient Co-Pay Amount Due' : 'Total Invoice Amount Due'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#006978] font-mono tabular-nums mt-0.5">
              {formatXAF(netPatientPayable)}
            </div>
            <span className="text-[11px] text-slate-500">
              Pay externally using the laboratory's official account details below, then submit your Transaction ID
            </span>
          </div>
          <Receipt className="w-8 h-8 text-[#006978]/40 shrink-0" />
        </div>
      </div>

      {/* STATE 1: CASHIER HAS VERIFIED PAYMENT -> SHOW CERTIFIED RECEIPT */}
      {isCashierConfirmedPaid ? (
        <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-3xl space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-black text-emerald-950">
                Payment Verified by {effectiveLabName} Cashier
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Transaction Ref: <strong className="font-mono">{liveBooking?.transactionReference || transactionRef}</strong>. Your certified laboratory receipt with official lab header is ready.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="w-full py-3.5 bg-[#006978] hover:bg-[#005a66] text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>View & Print Certified Lab Receipt</span>
          </button>
        </div>
      ) : isWaitingCashierConfirmation ? (
        /* STATE 2: PATIENT SUBMITTED PROOF -> WAITING FOR CASHIER DOUBLE-CHECK */
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-3xl space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-blue-950">
                Payment Confirmation Sent &middot; Pending Cashier Verification
              </h3>
              <p className="text-xs text-blue-900/80 leading-relaxed">
                Your payment reference <strong className="font-mono">{transactionRef || liveBooking?.transactionReference}</strong> has been routed to the <strong>{effectiveLabName}</strong> Cashier under <em>Pending Confirmation</em>. Once the Cashier double-checks and approves it, your certified receipt and sample collection will unlock automatically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 bg-white hover:bg-slate-50 border border-blue-200 text-blue-900 font-bold text-xs rounded-2xl cursor-pointer"
          >
            Return to Live Home Tracker
          </button>
        </div>
      ) : (
        /* STATE 3: THIRD-PARTY PAYMENT INSTRUCTIONS + CONFIRM PAYMENT FORM */
        <form onSubmit={handleSubmitPaymentProof} className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Laboratory Configured Payment Details ({effectiveLabName})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete your transfer of <strong>{formatXAF(netPatientPayable)}</strong> on your preferred third-party payment platform, then paste your Payment ID below to confirm.
              </p>
            </div>

            {/* Channel Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMethod('momo')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  selectedMethod === 'momo'
                    ? 'border-[#006978] bg-[#E0F2F1]/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <span className="text-xs font-black text-slate-900 block">MTN Mobile Money</span>
                <span className="text-xs font-mono font-bold text-[#006978] block mt-0.5">{mtnNumber}</span>
                <span className="text-[10px] text-slate-500 block truncate">Name: {mtnMerchant}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('om')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  selectedMethod === 'om'
                    ? 'border-[#006978] bg-[#E0F2F1]/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <span className="text-xs font-black text-slate-900 block">Orange Money</span>
                <span className="text-xs font-mono font-bold text-orange-700 block mt-0.5">{orangeNumber}</span>
                <span className="text-[10px] text-slate-500 block truncate">Name: {orangeMerchant}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('bank')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  selectedMethod === 'bank'
                    ? 'border-[#006978] bg-[#E0F2F1]/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <span className="text-xs font-black text-slate-900 block">{bankName}</span>
                <span className="text-[11px] font-mono font-bold text-slate-800 block mt-0.5 truncate">{bankDetails}</span>
                <span className="text-[10px] text-slate-500 block truncate">Beneficiary: {effectiveLabName}</span>
              </button>
            </div>

            {/* Selected Account Detail Callout */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              {selectedMethod === 'momo' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">MTN MoMo Merchant / Number:</span>
                    <strong className="font-mono text-slate-900">{mtnNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Holder Name:</span>
                    <strong className="text-slate-900">{mtnMerchant}</strong>
                  </div>
                </>
              )}
              {selectedMethod === 'om' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Orange Money Number:</span>
                    <strong className="font-mono text-slate-900">{orangeNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Holder Name:</span>
                    <strong className="text-slate-900">{orangeMerchant}</strong>
                  </div>
                </>
              )}
              {selectedMethod === 'bank' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank / Transfer Account:</span>
                    <strong className="font-mono text-slate-900">{bankDetails}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Beneficiary Laboratory:</span>
                    <strong className="text-slate-900">{effectiveLabName}</strong>
                  </div>
                </>
              )}
            </div>

            {/* Transaction ID Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Enter Third-Party Payment ID / Transaction Reference:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MP261030.1420.A88412 or Bank Transfer Ref..."
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#006978]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !transactionRef.trim()}
              className="w-full py-4 bg-[#006978] hover:bg-[#005a66] disabled:opacity-50 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Submitting to Lab Cashier...' : 'Confirm Payment (Send to Cashier for Verification)'}
              </span>
            </button>

            <button
              type="button"
              onClick={onPayLater}
              className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Return to Home Screen
            </button>
          </div>
        </form>
      )}

      {/* Certified Lab Receipt Modal (Only accessible once Cashier confirms payment) */}
      {showReceiptModal && liveBooking && isCashierConfirmedPaid && (
        <MedicalReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          booking={liveBooking}
        />
      )}
    </div>
  );
};
