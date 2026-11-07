import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Building2, 
  ShieldCheck, 
  DollarSign,
  Phone,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { Invoice, PaymentMethod } from '../../types';
import { getInvoicesForLab, verifyCashierPayment } from '../../services/invoiceService';
import { formatXAF, splitInsurance, applyPlatformFee } from '../../shared/money';
import { PLATFORM_FEE_PCT } from '../../shared/percentage';
import { useAuth } from '../../context/authContext';

export const CashierScreen: React.FC = () => {
  const { user } = useAuth();
  const labId = user?.labId || 'lab_central_douala';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Cashier verification inputs
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn_momo');
  const [manualPolicyNumber, setManualPolicyNumber] = useState('');
  const [manualApprovedPct, setManualApprovedPct] = useState(80);
  const [isInsuranceVerified, setIsInsuranceVerified] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<Invoice | null>(null);

  const loadInvoices = () => {
    let list = getInvoicesForLab(labId);
    if (list.length === 0) {
      // Demo invoice for cashier
      const demoInv: Invoice = {
        id: 'inv_cashier_demo',
        invoiceNumber: 'INV-202609-1092',
        batchId: 'batch_demo_live',
        batchNumber: 'BCH-202609-1092',
        labId,
        labName: 'Laboratoire Central Akwa - Douala',
        patientId: 'p1',
        patientName: 'Mme. Claire Ngo',
        patientPhone: '+237 670 11 22 33',
        items: [
          { testId: 't1', code: 'NFS', name: 'Numération Formule Sanguine (NFS)', price: 4500 },
          { testId: 't2', code: 'GLYC', name: 'Glycémie à Jeûn', price: 2000 },
          { testId: 't3', code: 'LIPID', name: 'Bilan Lipidique Complet', price: 8500 }
        ],
        grossTotal: 15000,
        tvaExemptAmount: 0,
        insuranceProviderName: 'Ascoma Assurances',
        insurancePolicyNumber: 'ASC-2026-8921',
        insuranceCoveragePercent: 80,
        insuranceCoveredAmount: 12000,
        patientShare: 3000,
        platformFeePercent: 5,
        platformFeeAmount: 150,
        totalPatientDue: 3150,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString()
      };
      list = [demoInv];
    }
    setInvoices(list);
    if (list.length > 0 && !selectedInvoice) {
      setSelectedInvoice(list[0]);
      setManualPolicyNumber(list[0].insurancePolicyNumber || '');
      setManualApprovedPct(list[0].insuranceCoveragePercent || 0);
      setIsInsuranceVerified(!!list[0].insuranceProviderName);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [labId]);

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setManualPolicyNumber(inv.insurancePolicyNumber || '');
    setManualApprovedPct(inv.insuranceCoveragePercent || 0);
    setIsInsuranceVerified(!!inv.insuranceProviderName);
    setSuccessReceipt(null);
  };

  // Recalculate based on manual approved co-pay %
  const currentGross = selectedInvoice ? selectedInvoice.grossTotal : 0;
  const currentCoverage = isInsuranceVerified ? manualApprovedPct : 0;
  const { coveredAmount, patientShare } = splitInsurance(currentGross, currentCoverage);
  const platformFee = applyPlatformFee(patientShare); // 5% strictly on patient share
  const totalDueAtDesk = patientShare + platformFee;

  const handleConfirmPayment = () => {
    if (!selectedInvoice) return;

    const cashierUser = {
      id: user?.id || 'cashier_desk_1',
      name: user?.name || 'M. Cashier Desk'
    };

    const updated = verifyCashierPayment(
      selectedInvoice.id,
      cashierUser,
      paymentMethod,
      isInsuranceVerified
        ? {
            providerName: selectedInvoice.insuranceProviderName || 'Verified Insurer',
            policyNumber: manualPolicyNumber,
            coveragePercent: manualApprovedPct
          }
        : undefined
    );

  // If updated is undefined, it will set the state to null
setSuccessReceipt(updated ?? null);

    loadInvoices();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
          Laboratory Cashier Counter & Payment Verification
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7F7D]">
          Verify physical insurance cards, collect patient co-pay via Cash, MoMo, or Orange Money, and issue receipts.
        </p>
      </div>

      {/* Strict Locked Rule Banner */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-[#0D3B38]">
            Direct Payout Policy & Exact 5% Fee Math
          </p>
          <p className="text-slate-600 leading-relaxed">
            All payments go 100% to the laboratory. nanoLabs never touches patient payment rails. The 5% record fee is applied strictly to the patient's out-of-pocket portion (0% on insurance). TVA is 100% exempt.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pending Invoices */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Pending Cashier Invoices ({invoices.filter((i) => i.paymentStatus === 'pending').length})
          </h2>

          <div className="space-y-2">
            {invoices.map((inv) => {
              const isSelected = selectedInvoice?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => handleSelectInvoice(inv)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0F766E] bg-white shadow-sm ring-2 ring-teal-100'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">{inv.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inv.paymentStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.paymentStatus}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 mt-1">{inv.patientName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{inv.patientPhone}</p>

                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100 text-xs font-bold">
                    <span className="text-slate-500">Patient Due:</span>
                    <span className="font-mono text-[#0F766E]">{formatXAF(inv.totalPatientDue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Cashier Verification & Payment Console */}
        <div className="lg:col-span-2">
          {successReceipt ? (
            <div className="bg-white rounded-3xl border border-teal-200 p-8 shadow-xl text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-[#0B1F1D]">Payment Verified & Receipt Issued</h3>
                <p className="text-xs text-slate-500 font-mono">Invoice #{successReceipt.invoiceNumber}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 max-w-md mx-auto text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Paiement reçu via:</span>
                  <strong className="text-slate-900 uppercase font-mono">{successReceipt.paymentMethod?.replace('_', ' ')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Part Patient Encaissée:</span>
                  <strong className="text-slate-900 font-mono">{formatXAF(successReceipt.patientShare)}</strong>
                </div>
                <div className="flex justify-between text-teal-800 font-bold">
                  <span>Frais Dossier nanoLabs (5%):</span>
                  <span className="font-mono">{formatXAF(successReceipt.platformFeeAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total Encaissé:</span>
                  <span className="font-mono text-sm">{formatXAF(successReceipt.totalPatientDue)}</span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="min-h-[44px] px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSuccessReceipt(null)}
                  className="min-h-[44px] px-6 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Next Invoice
                </button>
              </div>
            </div>
          ) : selectedInvoice ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Selected Invoice</span>
                  <h3 className="text-lg font-black text-slate-900 font-mono">{selectedInvoice.invoiceNumber}</h3>
                  <p className="text-xs text-slate-500">{selectedInvoice.patientName} &bull; {selectedInvoice.patientPhone}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Prestation</span>
                  <div className="text-lg font-black font-mono text-[#0D3B38]">{formatXAF(currentGross)}</div>
                  <div className="text-[10px] text-emerald-700 font-bold">TVA Exonérée (0%)</div>
                </div>
              </div>

              {/* Step 1: Manual Insurance Card Verification */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInsuranceVerified}
                      onChange={(e) => setIsInsuranceVerified(e.target.checked)}
                      className="accent-[#0F766E]"
                    />
                    <span>Manual Insurance Card Verification</span>
                  </label>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                    Cashier Intake Check
                  </span>
                </div>

                {isInsuranceVerified && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600">Policy / Card N° *</label>
                      <input
                        type="text"
                        value={manualPolicyNumber}
                        onChange={(e) => setManualPolicyNumber(e.target.value)}
                        placeholder="e.g. ASC-2026-..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600">Approved Co-pay Coverage (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={manualApprovedPct}
                        onChange={(e) => setManualApprovedPct(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Financial Calculation Breakdown */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/60 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Tests Tariff:</span>
                  <span className="font-mono font-bold text-slate-900">{formatXAF(currentGross)}</span>
                </div>

                {isInsuranceVerified && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Insurance Share ({manualApprovedPct}% billed to third-party):</span>
                    <span className="font-mono">-{formatXAF(coveredAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-teal-200/40">
                  <span>Patient Out-of-Pocket Share:</span>
                  <span className="font-mono">{formatXAF(patientShare)}</span>
                </div>

                <div className="flex justify-between text-teal-800 font-bold text-[11px]">
                  <span>nanoLabs Record Fee ({PLATFORM_FEE_PCT}% on patient share only):</span>
                  <span className="font-mono">+{formatXAF(platformFee)}</span>
                </div>

                <div className="flex justify-between text-sm font-black text-[#0D3B38] pt-2 border-t border-teal-200">
                  <span>Total Due from Patient:</span>
                  <span className="font-mono">{formatXAF(totalDueAtDesk)}</span>
                </div>
              </div>

              {/* Step 3: Payment Method Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                  Payment Method Received
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'cash' ? 'border-[#0F766E] bg-teal-50 text-[#0D3B38]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cash Counter
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mtn_momo')}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'mtn_momo' ? 'border-[#0F766E] bg-teal-50 text-[#0D3B38]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('orange_money')}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'orange_money' ? 'border-[#0F766E] bg-teal-50 text-[#0D3B38]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Orange Money
                  </button>
                </div>
              </div>

              {/* Confirm Payment Action */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={selectedInvoice.paymentStatus === 'verified'}
                  onClick={handleConfirmPayment}
                  className="min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:from-[#0D3B38] hover:to-[#0F766E] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Confirm Receipt & Validate Payment</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-xs text-slate-400">Select an invoice to begin cashier intake.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashierScreen;
