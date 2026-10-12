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

interface InvoiceScreenProps {
  labName?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  bookingCode?: string;
  onBack: () => void;
  onPaymentConfirmedByPatient: (txRef: string, method: string) => void;
  onPayLater: () => void;
}

export const InvoiceScreen: React.FC<InvoiceScreenProps> = ({
  labName = 'BioSanté Lab',
  invoiceNumber = 'INV-2847',
  totalAmount = 5000,
  bookingCode = 'BK-991204',
  onBack,
  onPaymentConfirmedByPatient,
  onPayLater
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'momo' | 'om' | 'card'>('momo');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAwaitingCashier, setPaymentAwaitingCashier] = useState(false);

  const handleConfirmPaid = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setPaymentAwaitingCashier(true);
      // Automatically triggers cashier approval after verification
      setTimeout(() => {
        onPaymentConfirmedByPatient(transactionRef.trim() || `TX-${Math.floor(100000 + Math.random() * 900000)}`, selectedMethod);
      }, 2500);
    }, 1000);
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
            Booking Code: <strong className="font-mono text-slate-800">{bookingCode}</strong>
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
              <p className="text-[11px] text-slate-500 font-mono">Invoice #{invoiceNumber} &bull; Validated</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider">
            Awaiting Payment
          </span>
        </div>

        {/* Total Payable Amount */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Payable Balance</span>
            <div className="text-2xl sm:text-3xl font-black text-[#006978] font-mono mt-0.5">
              {formatXAF(totalAmount)}
            </div>
            <span className="text-[11px] text-slate-400">Pay via your preferred mobile money or banking app</span>
          </div>
          <Receipt className="w-8 h-8 text-[#006978]/40" />
        </div>
      </div>

      {/* Cashier Verification Loading Banner */}
      {paymentAwaitingCashier ? (
        <div className="p-6 bg-gradient-to-br from-[#E0F2F1] to-[#F2FBFA] border-2 border-[#80CBC4] rounded-3xl text-center space-y-3 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-[#006978] text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900">
            Payment Submitted &bull; Cashier Verification in Progress
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            The lab cashier desk is validating transaction ref <strong className="font-mono">{transactionRef || 'MOMO-PAY'}</strong>. Once approved, the phlebotomist will be dispatched immediately.
          </p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
            <div className="bg-[#006978] h-full w-2/3 animate-pulse" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleConfirmPaid} className="space-y-4">
          {/* Payment Method Selector */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Third-Party Payment App
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
                    <span className="text-[10px] text-slate-500">*126# / App</span>
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
                    <span className="text-[10px] text-slate-500">#150# / App</span>
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
                    <span className="text-[10px] text-slate-500">Visa/Mastercard</span>
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

          {/* Payment Instructions & Reference Input */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
            <div className="text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">How to complete payment:</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                1. Open your {selectedMethod === 'momo' ? 'MTN MoMo app or dial *126#' : selectedMethod === 'om' ? 'Orange Money app or dial #150#' : 'mobile banking app'}.<br />
                2. Send <strong>{formatXAF(totalAmount)}</strong> to the merchant laboratory account.<br />
                3. Enter the transaction ID / SMS reference below and click <strong>"Confirm Payment (I have paid)"</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction ID / Payment Reference:
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

          {/* Confirm Payment Button */}
          <div className="space-y-2.5 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying payment...' : 'Confirm Payment (I Have Paid)'}</span>
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
    </div>
  );
};
