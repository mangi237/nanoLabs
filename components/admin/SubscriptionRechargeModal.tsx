import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  PhoneCall, 
  Mail, 
  ShieldCheck, 
  Sparkles,
  Copy,
  Clock,
  Zap,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { doc, updateDoc, db } from '../../services/firebase';

interface SubscriptionRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHardWalled?: boolean;
}

export const SubscriptionRechargeModal: React.FC<SubscriptionRechargeModalProps> = ({
  isOpen,
  onClose,
  isHardWalled = false
}) => {
  const { lab, setLab } = useAuth();
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [selectedModel, setSelectedModel] = useState<'flat_subscription' | 'pay_per_test'>(
    lab?.pricingModel === 'pay_per_test' ? 'pay_per_test' : 'flat_subscription'
  );
  const [selectedTier, setSelectedTier] = useState<'small' | 'medium' | 'large'>(
    lab?.subscriptionTier === 'medium' ? 'medium' : lab?.subscriptionTier === 'large' ? 'large' : 'small'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('672638094');
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleNotifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const targetLabId = lab?.id || 'lab-1';
      const labRef = doc(db, 'labs', targetLabId);

      const staffLimit = selectedModel === 'pay_per_test' ? 999 : selectedTier === 'small' ? 5 : selectedTier === 'medium' ? 15 : 9999;
      const patientLimit = selectedModel === 'pay_per_test' ? 99999 : selectedTier === 'small' ? 250 : selectedTier === 'medium' ? 1000 : 999999;
      const subPrice = selectedModel === 'pay_per_test' ? 500 : selectedTier === 'small' ? 25000 : selectedTier === 'medium' ? 45000 : 60000;

      const updatedFields = {
        requestedPricingModel: selectedModel,
        requestedSubscriptionTier: selectedTier,
        requestedSubscriptionPrice: subPrice,
        planChangeRequestedAt: new Date().toISOString(),
        planMutationStatus: 'PENDING_PLAN_MUTATION',
        transactionRef,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(labRef, updatedFields);
      if (setLab) {
        setLab({
          ...lab,
          ...updatedFields
        });
      }

      setPaymentConfirmed(true);
    } catch (err) {
      console.error('Error submitting plan mutation request:', err);
      alert('Failed to submit renewal request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-teal-400 tracking-widest block">
                nanoLabs SaaS Subscription Engine
              </span>
              <h3 className="text-xl font-black text-white">
                {isHardWalled ? 'Subscription Expired - On Hold' : 'Recharge / Upgrade Subscription Tier'}
              </h3>
            </div>
          </div>

          {!isHardWalled && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isHardWalled && (
          <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-200">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <strong className="block font-bold text-white text-sm">Account Temporarily Placed On Hold</strong>
              Your 30-day operating license has expired. Please select a plan tier below and submit your renewal to unlock your lab instance.
            </div>
          </div>
        )}

        {paymentConfirmed ? (
          <div className="space-y-5 p-6 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">Request Sent. Awaiting Superadmin Verification.</h4>
              <p className="text-xs text-emerald-200 leading-relaxed max-w-md mx-auto">
                Your subscription change/renewal request for <strong className="text-white">{lab?.name || 'Your Facility'}</strong> has been submitted. Status set to <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-400 font-mono">PENDING_PLAN_MUTATION</code>.
              </p>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-xl border border-emerald-500/30 text-xs space-y-2 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Target MoMo Account:</span>
                <span className="font-bold text-amber-400">672 638094 (COLLET CLAUDINE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Reference:</span>
                <span className="font-bold text-white">{transactionRef || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lifecycle Status:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> PENDING SUPERADMIN APPROVAL
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setPaymentConfirmed(false);
                onClose();
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Return to Control Center
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Active Facility Context */}
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Subscriber Laboratory:</span>
                  <strong className="text-white font-bold">{lab?.name || 'nanoLabs Central Diagnostics'}</strong>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[10px] border border-teal-500/30">
                {lab?.pricingModel === 'pay_per_test' ? 'Commission Model' : `${(lab?.subscriptionTier || 'small').toUpperCase()} TIER`}
              </span>
            </div>

            {/* Model Type Selector Tabs */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedModel('flat_subscription')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedModel === 'flat_subscription'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Model B: Monthly Tiered Subscription
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('pay_per_test')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedModel === 'pay_per_test'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Model A: Per-Test Commission
              </button>
            </div>

            {selectedModel === 'flat_subscription' ? (
              /* Tier Option Cards */
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select 30-Day Monthly Operating Tier:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Small Hospital */}
                  <div
                    onClick={() => setSelectedTier('small')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative ${
                      selectedTier === 'small'
                        ? 'bg-teal-950/80 border-teal-400 ring-2 ring-teal-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">Small Hospital</span>
                      {selectedTier === 'small' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                    </div>
                    <div className="text-lg font-black text-teal-300 font-mono">25,000 FRS</div>
                    <div className="text-[10px] text-slate-300 space-y-1">
                      <div>• Up to <strong>5 Staff Users</strong></div>
                      <div>• Max <strong>250 Patients/Mo</strong></div>
                    </div>
                  </div>

                  {/* Medium Enterprise */}
                  <div
                    onClick={() => setSelectedTier('medium')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative ${
                      selectedTier === 'medium'
                        ? 'bg-teal-950/80 border-teal-400 ring-2 ring-teal-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">Medium Enterprise</span>
                      {selectedTier === 'medium' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                    </div>
                    <div className="text-lg font-black text-teal-300 font-mono">45,000 FRS</div>
                    <div className="text-[10px] text-slate-300 space-y-1">
                      <div>• Up to <strong>15 Staff Users</strong></div>
                      <div>• Max <strong>1,000 Patients/Mo</strong></div>
                    </div>
                  </div>

                  {/* Large Enterprise */}
                  <div
                    onClick={() => setSelectedTier('large')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative ${
                      selectedTier === 'large'
                        ? 'bg-teal-950/80 border-teal-400 ring-2 ring-teal-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">Large Enterprise</span>
                      {selectedTier === 'large' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                    </div>
                    <div className="text-lg font-black text-teal-300 font-mono">60,000 FRS</div>
                    <div className="text-[10px] text-slate-300 space-y-1">
                      <div>• <strong>Unlimited Staff</strong></div>
                      <div>• <strong>Unlimited Patients</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Commission Model Info */
              <div className="p-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Model A: Per-Test Escrow Commission
                  </span>
                  <span className="text-sm font-black text-amber-300 font-mono">500 FRS CFA / Test</span>
                </div>
                <p className="text-xs text-amber-200/80">
                  Pay no monthly recurring fee. Every finalized diagnostic test automatically accumulates 500 FRS in your real-time platform escrow ledger.
                </p>
              </div>
            )}

            {/* Official Mobile Money Payment Gate */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <h4 className="font-extrabold text-sm text-white">Official MTN Mobile Money Payment Gate</h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  MTN MoMo Cameroon
                </span>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">MTN MoMo Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-amber-300">672 638094</span>
                    <button
                      onClick={handleCopyNumber}
                      type="button"
                      className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border border-amber-500/20"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedNumber ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                  <span className="text-slate-400 font-medium">Beneficiary Name:</span>
                  <span className="font-bold text-white uppercase tracking-wider">COLLET CLAUDINE</span>
                </div>
              </div>
            </div>

            {/* Notification Form */}
            <form onSubmit={handleNotifyPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  MoMo Transaction ID (TxID) / Payment Reference Code:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your MoMo transaction ID (e.g. 2489012399)"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Request...' : 'Submit Plan Renewal & Request Approval'}</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default SubscriptionRechargeModal;
