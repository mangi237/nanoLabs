import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Sparkles,
  Copy,
  Clock,
  Zap,
  Truck,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { doc, updateDoc, db } from '../../services/firebase';
import {
  getLabPackageConfig,
  isLabMobilePhlebotomyEnabled,
  LAB_PACKAGE_LIST,
  LAB_PACKAGES,
  LabPackageId,
} from '../../utils/labPackages';

interface SubscriptionRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHardWalled?: boolean;
}

export const SubscriptionRechargeModal: React.FC<SubscriptionRechargeModalProps> = ({
  isOpen,
  onClose,
  isHardWalled = false,
}) => {
  const { lab, setLab } = useAuth();
  const currentPkg = getLabPackageConfig(lab);

  const [copiedNumber, setCopiedNumber] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [selectedModel, setSelectedModel] = useState<'flat_subscription' | 'pay_per_test'>(
    lab?.pricingModel === 'pay_per_test' ? 'pay_per_test' : 'flat_subscription'
  );
  const [selectedPackageId, setSelectedPackageId] = useState<LabPackageId>(currentPkg.id);
  const [needsMobilePhlebotomist, setNeedsMobilePhlebotomist] = useState<boolean>(() =>
    isLabMobilePhlebotomyEnabled(lab)
  );
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const pkg = getLabPackageConfig(lab);
      setSelectedPackageId(pkg.id);
      setSelectedModel(lab?.pricingModel === 'pay_per_test' ? 'pay_per_test' : 'flat_subscription');
      setNeedsMobilePhlebotomist(isLabMobilePhlebotomyEnabled(lab));
      setSubmitError('');
      setPaymentConfirmed(false);
    }
  }, [isOpen, lab]);

  if (!isOpen) return null;

  const chosenPkg = LAB_PACKAGES[selectedPackageId] || LAB_PACKAGES.clinic;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('672638094');
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleNotifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!transactionRef.trim()) {
      setSubmitError('Please enter your MTN Mobile Money Transaction Reference (TxID).');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetLabId = lab?.id || 'lab-1';
      const labRef = doc(db, 'labs', targetLabId);

      const updatedFields =
        selectedModel === 'pay_per_test'
          ? {
              pricingModel: 'pay_per_test',
              requestedPricingModel: 'pay_per_test',
              feePerTest: 500,
              maxTestsPerMonth: 999999,
              maxStaff: 999,
              needsMobilePhlebotomist,
              supportsHomePickup: needsMobilePhlebotomist,
              planChangeRequestedAt: new Date().toISOString(),
              planMutationStatus: 'PENDING_PLAN_MUTATION',
              transactionRef: transactionRef.trim(),
              updatedAt: new Date().toISOString(),
            }
          : {
              pricingModel: 'flat_subscription',
              requestedPricingModel: 'flat_subscription',
              plan: chosenPkg.id,
              planId: chosenPkg.id,
              planName: chosenPkg.name,
              subscriptionTier: chosenPkg.legacyTier,
              subscriptionPrice: chosenPkg.priceMonthlyXaf,
              requestedSubscriptionTier: chosenPkg.id,
              requestedSubscriptionPrice: chosenPkg.priceMonthlyXaf,
              maxTestsPerMonth: chosenPkg.maxTestsPerMonth,
              maxStaff: chosenPkg.maxStaff,
              needsMobilePhlebotomist,
              supportsHomePickup: needsMobilePhlebotomist,
              planChangeRequestedAt: new Date().toISOString(),
              planMutationStatus: 'PENDING_PLAN_MUTATION',
              transactionRef: transactionRef.trim(),
              updatedAt: new Date().toISOString(),
            };

      await updateDoc(labRef, updatedFields);
      if (setLab) {
        setLab({
          ...lab,
          ...updatedFields,
        });
      }

      setPaymentConfirmed(true);
    } catch (err: any) {
      console.error('Error submitting plan mutation request:', err);
      setSubmitError(err?.message || 'Failed to submit package update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-teal-400 tracking-widest block">
                nanoLabs SaaS Subscription &amp; Package Engine
              </span>
              <h3 className="text-xl font-black text-white">
                {isHardWalled ? 'Subscription Expired - On Hold' : 'Select Package & Facility Add-Ons'}
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
              Your 30-day operating license has expired. Select a monthly package below and submit your MoMo reference to unlock your laboratory workspace.
            </div>
          </div>
        )}

        {paymentConfirmed ? (
          <div className="space-y-5 p-6 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">Package Activated &amp; Logged for Audit</h4>
              <p className="text-xs text-emerald-200 leading-relaxed max-w-md mx-auto">
                <strong className="text-white">{lab?.name || 'Your Laboratory'}</strong> is now configured for{' '}
                <strong className="text-teal-300">
                  {selectedModel === 'pay_per_test' ? 'Per-Test Commission (500 FCFA/test)' : `${chosenPkg.name} (${chosenPkg.priceLabel})`}
                </strong>{' '}
                with Mobile Phlebotomist{' '}
                <strong className="text-white">{needsMobilePhlebotomist ? 'Enabled' : 'Disabled (Walk-In Only)'}</strong>.
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
                <span className="text-slate-400">Audit Status:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> RECORDED &amp; ACTIVE
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
            {submitError && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Active Facility Context */}
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Subscriber Laboratory:</span>
                  <strong className="text-white font-bold">{lab?.name || 'nanoLabs Central Diagnostics'}</strong>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[10px] border border-teal-500/30">
                Current: {lab?.pricingModel === 'pay_per_test' ? 'Commission Model' : `${currentPkg.name} (${currentPkg.priceLabel})`}
              </span>
            </div>

            {/* Model Type Selector Tabs */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedModel('flat_subscription')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedModel === 'flat_subscription'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Subscription Packages (Incl. December 15,000 FCFA Promo)
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('pay_per_test')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedModel === 'pay_per_test'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Per-Test Commission (500 FCFA / Test)
              </button>
            </div>

            {selectedModel === 'flat_subscription' ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Monthly Package (Strict Feature &amp; Test Quota Enforcement):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LAB_PACKAGE_LIST.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative ${
                          isSelected
                            ? pkg.isPromo
                              ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/30'
                              : 'bg-teal-950/80 border-teal-400 ring-2 ring-teal-500/30'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-white">{pkg.name}</span>
                          {isSelected && (
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${pkg.isPromo ? 'text-amber-400' : 'text-teal-400'}`} />
                          )}
                        </div>
                        {pkg.badge && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                              pkg.isPromo
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            }`}
                          >
                            {pkg.badge}
                          </span>
                        )}
                        <div className={`text-lg font-black font-mono ${pkg.isPromo ? 'text-amber-300' : 'text-teal-300'}`}>
                          {pkg.priceLabel}
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium">{pkg.detail}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Included / Locked Breakdown for Chosen Package */}
                <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="space-y-1.5">
                    <span className="font-bold text-teal-400 uppercase tracking-wider block text-[10px]">
                      Included in {chosenPkg.name}:
                    </span>
                    {chosenPkg.includedBullets.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Package Restrictions:
                    </span>
                    {chosenPkg.excludedBullets.length === 0 ? (
                      <div className="text-emerald-300 font-semibold">
                        All enterprise modules, analytics, inventory, and unlimited volume unlocked.
                      </div>
                    ) : (
                      chosenPkg.excludedBullets.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-400">
                          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Per-Test Escrow Commission
                  </span>
                  <span className="text-sm font-black text-amber-300 font-mono">500 FCFA / Test</span>
                </div>
                <p className="text-xs text-amber-200/80">
                  Pay no fixed monthly recurring fee. Every finalized diagnostic test accumulates 500 FCFA in your platform royalty ledger.
                </p>
              </div>
            )}

            {/* Mobile Phlebotomist Facility Opt-In Toggle */}
            <div
              onClick={() => setNeedsMobilePhlebotomist((v) => !v)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                needsMobilePhlebotomist
                  ? 'bg-teal-950/60 border-teal-500/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl border shrink-0 ${
                    needsMobilePhlebotomist
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Enable Mobile Phlebotomist (Home Sample Pickup &amp; Live GPS)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {needsMobilePhlebotomist
                      ? 'Active: Patients can book Home Sample Pickup from this lab and Mobile Phlebotomist dispatch is enabled.'
                      : 'Off (Walk-In Only): Patients only book walk-in visits and Mobile Phlebotomist is hidden from staff desks.'}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={needsMobilePhlebotomist}
                onChange={() => {}}
                className="w-5 h-5 rounded accent-teal-500 shrink-0 pointer-events-none"
              />
            </div>

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
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Applying Package & Saving...' : 'Confirm Payment & Apply Package Settings'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionRechargeModal;
