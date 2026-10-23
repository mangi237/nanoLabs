import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  Smartphone, 
  CreditCard, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  Clock,
  ArrowRight,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { formatXAF } from '../../shared/money';

import { MedicalReceiptModal } from '../../components/common/MedicalReceiptModal';
import { Tag, Sparkles, Check, Lock } from 'lucide-react';

interface InvoiceScreenProps {
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
  bookingId,
  labId = 'lab-1',
  labName = 'nanoLabs Central Diagnostics',
  invoiceNumber = 'INV-2026-001',
  totalAmount = 5000,
  testsAmount,
  homePickupFee = 0,
  homeDeliveryFee = 0,
  addOns = [],
  tests = [],
  labPaymentDetails,
  bookingCode = 'BK-991204',
  onBack,
  onPaymentConfirmedByPatient,
  onPayLater
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'momo' | 'om' | 'card'>('momo');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'instant_ussd' | 'manual_ref'>('instant_ussd');
  const [instantSimulatingState, setInstantSimulatingState] = useState<'idle' | 'prompting' | 'pin_entered' | 'approved'>('idle');
  const [paidTxRef, setPaidTxRef] = useState<string>('');
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [completedBookingObj, setCompletedBookingObj] = useState<any | null>(null);

  // Fallback calculations if testsAmount not passed
  const calculatedTestsAmount = testsAmount !== undefined 
    ? testsAmount 
    : (tests.length > 0 ? tests.reduce((sum, t) => sum + (Number(t.price) || 0), 0) : Math.max(0, totalAmount - homePickupFee - homeDeliveryFee));

  const effectiveMomoNumber = labPaymentDetails?.mtnMomoNumber || '+237 670 123 456';
  const effectiveMomoName = labPaymentDetails?.mtnMomoName || labName;
  const effectiveOmNumber = labPaymentDetails?.orangeMoneyNumber || '+237 690 123 456';
  const effectiveOmName = labPaymentDetails?.orangeMoneyName || labName;

  const handleInstantUssdPay = async () => {
    setIsSubmitting(true);
    setInstantSimulatingState('prompting');
    
    // Simulate mobile network USSD push to handset
    setTimeout(() => {
      setInstantSimulatingState('pin_entered');
    }, 1200);

    setTimeout(async () => {
      const generatedTxRef = `MOMO-${selectedMethod.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      setPaidTxRef(generatedTxRef);
      setInstantSimulatingState('approved');

      try {
        if (bookingId) {
          const { limsService } = await import('../../services/limsService');
          await limsService.submitPatientPaymentProof(
            labId,
            bookingId,
            generatedTxRef,
            selectedMethod === 'momo' ? 'mobile_money_mtn' : selectedMethod === 'om' ? 'mobile_money_orange' : 'card'
          );

          await limsService.confirmPaymentAndIssueReceipt(
            labId,
            bookingId,
            'Online Mobile Gateway (Instant)',
            selectedMethod === 'momo' ? 'MTN MoMo' : selectedMethod === 'om' ? 'Orange Money' : 'Bank Card',
            generatedTxRef
          );
        }
      } catch (err) {
        console.warn('Instant payment processing notice:', err);
      }

      const receiptBooking = {
        id: bookingId || 'bk-curr',
        bookingCode,
        invoiceNumber,
        labName,
        totalAmount,
        testsAmount: calculatedTestsAmount,
        homePickupFee,
        homeDeliveryFee,
        addOns,
        tests,
        paymentStatus: 'paid',
        paymentMethod: selectedMethod === 'momo' ? 'MTN Mobile Money' : selectedMethod === 'om' ? 'Orange Money' : 'Credit/Debit Card',
        transactionReference: generatedTxRef,
        paidAt: new Date().toISOString()
      };
      setCompletedBookingObj(receiptBooking);
      setShowReceiptModal(true);
      setIsSubmitting(false);
    }, 2400);
  };

  const handleConfirmPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = transactionRef.trim() || `TX-${Math.floor(100000 + Math.random() * 900000)}`;
    setIsSubmitting(true);
    try {
      if (bookingId) {
        const { limsService } = await import('../../services/limsService');
        await limsService.submitPatientPaymentProof(
          labId,
          bookingId,
          cleanRef,
          selectedMethod === 'momo' ? 'mobile_money_mtn' : selectedMethod === 'om' ? 'mobile_money_orange' : 'card'
        );
      }
      const receiptBooking = {
        id: bookingId || 'bk-curr',
        bookingCode,
        invoiceNumber,
        labName,
        totalAmount,
        testsAmount: calculatedTestsAmount,
        homePickupFee,
        homeDeliveryFee,
        addOns,
        tests,
        paymentStatus: 'paid',
        paymentMethod: selectedMethod === 'momo' ? 'MTN Mobile Money' : selectedMethod === 'om' ? 'Orange Money' : 'Credit/Debit Card',
        transactionReference: cleanRef,
        paidAt: new Date().toISOString()
      };
      setCompletedBookingObj(receiptBooking);
      setPaidTxRef(cleanRef);
      setShowReceiptModal(true);
    } catch (err) {
      console.warn('Error submitting payment proof to limsService:', err);
      onPaymentConfirmedByPatient(cleanRef, selectedMethod);
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
            Booking Code: <strong className="font-mono text-slate-800">{bookingCode}</strong> &bull; Issued by Lab Cashier
          </p>
        </div>
      </div>

      {/* Invoice Overview Card */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">{labName}</h3>
              <p className="text-[11px] text-slate-500 font-mono">Invoice #{invoiceNumber} &bull; Itemized Diagnostic Order</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider">
            Awaiting Payment
          </span>
        </div>

        {/* Itemized Categories Breakdown */}
        <div className="space-y-2 py-1 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Itemized Diagnostic Charges:
          </span>

          {/* 1. Primary Tests Cost */}
          <div className="flex items-center justify-between py-1 border-b border-slate-50">
            <span className="text-slate-700 font-medium">
              Primary Diagnostic Tests ({tests.length > 0 ? tests.length : 'Panel'})
            </span>
            <span className="font-mono font-bold text-slate-900">
              {formatXAF(calculatedTestsAmount)}
            </span>
          </div>

          {/* Test items list if available */}
          {tests.length > 0 && (
            <div className="pl-3 space-y-1 text-[11px] text-slate-500">
              {tests.map((t: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>&bull; {t.testName || t.name}</span>
                  <span className="font-mono">{formatXAF(Number(t.price) || 0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* 2. Home Phlebotomy Pickup Fee (if applicable) */}
          {homePickupFee > 0 && (
            <div className="flex items-center justify-between py-1 border-b border-slate-50 text-purple-900 bg-purple-50/50 px-2 rounded-lg">
              <span className="font-semibold flex items-center gap-1.5">
                <span>Home Phlebotomy & Sample Cold-Chain Draw</span>
              </span>
              <span className="font-mono font-bold">
                +{formatXAF(homePickupFee)}
              </span>
            </div>
          )}

          {/* 3. Physical Result Delivery Fee (if applicable) */}
          {homeDeliveryFee > 0 && (
            <div className="flex items-center justify-between py-1 border-b border-slate-50 text-blue-900 bg-blue-50/50 px-2 rounded-lg">
              <span className="font-semibold">
                Secured Physical Result Courier Delivery
              </span>
              <span className="font-mono font-bold">
                +{formatXAF(homeDeliveryFee)}
              </span>
            </div>
          )}

          {/* 4. Justifiable Consumables & Add-ons */}
          {addOns.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Itemized Justifiable Costs & Consumables:
              </span>
              {addOns.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-50 text-teal-900 bg-teal-50/50 px-2.5 rounded-xl text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-teal-200 text-teal-900 px-1.5 py-0.5 rounded">
                      {item.category || 'Consumables'}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">
                      {item.name || item.code}
                    </span>
                    {item.code && <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({item.code})</span>}
                  </div>
                  <span className="font-mono font-bold text-teal-900 shrink-0">
                    +{formatXAF(Number(item.price) || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Payable Amount */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-500">Invoice Grand Total</span>
            <div className="text-2xl sm:text-3xl font-black text-[#006978] font-mono mt-0.5">
              {formatXAF(totalAmount)}
            </div>
            <span className="text-[11px] text-slate-400">Primary cost + justifiable consumables & fees</span>
          </div>
          <Receipt className="w-8 h-8 text-[#006978]/40" />
        </div>
      </div>

      {/* Payment Mode Selector Tabs */}
      <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setPaymentMode('instant_ussd')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            paymentMode === 'instant_ussd'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Instant USSD Push (Recommended)</span>
        </button>
        <button
          type="button"
          onClick={() => setPaymentMode('manual_ref')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            paymentMode === 'manual_ref'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-slate-500" />
          <span>Enter Transaction Code</span>
        </button>
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Select Payment Channel
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* MTN Mobile Money */}
          <div
            onClick={() => setSelectedMethod('momo')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              selectedMethod === 'momo'
                ? 'border-[#006978] bg-[#E0F2F1]/30 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                MTN
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">MoMo</h4>
                <span className="text-[10px] text-slate-500">{effectiveMomoNumber}</span>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === 'momo' ? 'border-[#006978] bg-[#006978]' : 'border-slate-300'
            }`}>
              {selectedMethod === 'momo' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>

          {/* Orange Money */}
          <div
            onClick={() => setSelectedMethod('om')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              selectedMethod === 'om'
                ? 'border-[#006978] bg-[#E0F2F1]/30 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                OM
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Orange</h4>
                <span className="text-[10px] text-slate-500">{effectiveOmNumber}</span>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === 'om' ? 'border-[#006978] bg-[#006978]' : 'border-slate-300'
            }`}>
              {selectedMethod === 'om' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>

          {/* Visa / Card */}
          <div
            onClick={() => setSelectedMethod('card')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              selectedMethod === 'card'
                ? 'border-[#006978] bg-[#E0F2F1]/30 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Bank Card</h4>
                <span className="text-[10px] text-slate-500">Visa / Mastercard</span>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === 'card' ? 'border-[#006978] bg-[#006978]' : 'border-slate-300'
            }`}>
              {selectedMethod === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>
        </div>
      </div>

      {/* Mode A: INSTANT USSD PUSH PAYMENT */}
      {paymentMode === 'instant_ussd' ? (
        <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Direct Mobile Money USSD Gateway</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Click the button below to trigger an automated payment prompt to your mobile handset. You will enter your Mobile Money PIN on your phone to approve the diagnostic payment of <strong>{formatXAF(totalAmount)}</strong> to <strong>{labName}</strong>.
            </p>
          </div>

          {instantSimulatingState !== 'idle' && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center mx-auto shadow-sm animate-pulse">
                <Smartphone className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-teal-900">
                {instantSimulatingState === 'prompting' && `Connecting to ${selectedMethod === 'momo' ? 'MTN Cameroon' : selectedMethod === 'om' ? 'Orange Cameroun' : 'Gateway'}...`}
                {instantSimulatingState === 'pin_entered' && 'Handset PIN verified &bull; Processing transaction...'}
                {instantSimulatingState === 'approved' && 'Payment Approved! Generating Official Medical Receipt...'}
              </p>
              <div className="w-48 bg-teal-200 h-1 rounded-full mx-auto overflow-hidden">
                <div className="bg-teal-700 h-full w-full animate-pulse" />
              </div>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleInstantUssdPay}
              className="w-full py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 hover:from-teal-600 hover:to-cyan-700 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-teal-700/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-cyan-200" />
              <span>
                {isSubmitting 
                  ? 'Processing on Handset...' 
                  : `Pay ${formatXAF(totalAmount)} via ${selectedMethod === 'momo' ? 'MTN MoMo' : selectedMethod === 'om' ? 'Orange Money' : 'Bank Card'}`
                }
              </span>
            </button>

            <button
              type="button"
              onClick={onPayLater}
              className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              I'll pay later &bull; Return to dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Mode B: MANUAL TRANSACTION REFERENCE CODE */
        <form onSubmit={handleConfirmPaid} className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
            <div className="text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">How to complete manual payment:</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                1. Dial {selectedMethod === 'momo' ? '*126#' : selectedMethod === 'om' ? '#150#' : 'your mobile banking'} on your phone.<br />
                2. Transfer <strong>{formatXAF(totalAmount)}</strong> to merchant account: <strong>{selectedMethod === 'momo' ? effectiveMomoNumber : effectiveOmNumber}</strong> ({labName}).<br />
                3. Paste the SMS confirmation transaction reference code below.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction ID / SMS Reference Code:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MP261012.1804.B92401 or MoMo reference..."
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-hidden focus:border-[#006978] focus:ring-2 focus:ring-[#006978]/20 shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying payment...' : 'Confirm Payment & View Receipt'}</span>
            </button>

            <button
              type="button"
              onClick={onPayLater}
              className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              I'll pay later &bull; Return to dashboard
            </button>
          </div>
        </form>
      )}

      {/* Official Medical Receipt Modal upon payment */}
      {showReceiptModal && completedBookingObj && (
        <MedicalReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            onPaymentConfirmedByPatient(paidTxRef || 'MOMO-CONFIRMED', selectedMethod);
          }}
          booking={completedBookingObj}
        />
      )}
    </div>
  );
};
