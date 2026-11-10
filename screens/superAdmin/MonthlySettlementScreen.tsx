import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ShieldCheck, 
  DollarSign, 
  Calendar,
  FileText,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { MonthlySettlementRecord } from '../../types';
import { 
  getMonthlySettlements, 
  generateMonthlySettlementForLab, 
  markSettlementPaid 
} from '../../services/settlementService';
import { formatXAF } from '../../shared/money';

export const MonthlySettlementScreen: React.FC = () => {
  const [settlements, setSettlements] = useState<MonthlySettlementRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [selectedSettlement, setSelectedSettlement] = useState<MonthlySettlementRecord | null>(null);
  const [txRef, setTxRef] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadSettlements = () => {
    const list = getMonthlySettlements();
    setSettlements(list);
    if (list.length > 0 && !selectedSettlement) {
      setSelectedSettlement(list[0]);
    } else if (list.length === 0) {
      setSelectedSettlement(null);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, []);

  const handleMarkPaid = () => {
    if (!selectedSettlement || !txRef) return;
    const updated = markSettlementPaid(selectedSettlement.id, txRef);
    if (updated) {
      setSelectedSettlement(updated);
      setActionNotice(`Settlement marked as paid with transaction reference: ${txRef}`);
      loadSettlements();
      setTxRef('');
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Settlement ID', 'Lab ID', 'Lab Name', 'Month', 'Total Batches', 'Total Tests', 'Gross Revenue (XAF)', 'Patient Portion (XAF)', 'nanoLabs Fee (5% XAF)', 'Status', 'Payment Ref'];
    const rows = settlements.map((s) => [
      s.id,
      s.labId,
      s.labName,
      s.monthYear,
      s.totalBatches,
      s.totalTestsCount,
      s.grossTestsRevenue,
      s.totalPatientShareRevenue,
      s.platformFeeTotalDue,
      s.settlementStatus,
      s.paymentTransactionRef || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nanoLabs_monthly_settlements_${selectedMonth}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            Partner Laboratories Monthly Settlement Ledger (5%)
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            B2B software billing: monthly reconciliation of the 5% record fee on patient portions collected by partner facilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="min-h-[44px] px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-[#0F766E]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Mandatory Non-Custodial Legal Banner */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-[#0D3B38]">
            Non-Custodial Payment Rail Architecture
          </p>
          <p className="text-slate-600 leading-relaxed">
            nanoLabs does not touch patient payment rails. Laboratories collect 100% of diagnostic test money directly at intake desks. This monthly settlement represents the 5% platform fee for nanoLabs record management and software infrastructure services.
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{actionNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settlement Records */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Billing Period: September 2026
          </h2>

          <div className="space-y-2">
            {settlements.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Aucun impayé enregistré</p>
                <p className="text-[11px] text-slate-500">
                  Toutes les structures partenaires sont à jour (0 FCFA de commission en attente). Les commissions de 5% s&apos;enregistrent automatiquement lorsqu&apos;un patient règle ses examens.
                </p>
              </div>
            ) : (
              settlements.map((s) => {
                const isSelected = selectedSettlement?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSettlement(s)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F766E] bg-white shadow-sm ring-2 ring-teal-100'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-bold text-xs text-slate-900 truncate">{s.labName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.settlementStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.settlementStatus}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      {s.totalBatches} batches &bull; {s.totalTestsCount} tests processed
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-xs font-bold">
                      <span className="text-slate-500">5% Platform Fee:</span>
                      <span className="font-mono text-[#0F766E]">{formatXAF(s.platformFeeTotalDue)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Settlement Reconciliation Detail Sheet */}
        <div className="lg:col-span-2">
          {selectedSettlement ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Monthly B2B Invoice</span>
                  <h3 className="text-lg font-black text-slate-900">{selectedSettlement.labName}</h3>
                  <p className="text-xs text-slate-500 font-mono">Reconciliation Month: {selectedSettlement.monthYear}</p>
                </div>

                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    selectedSettlement.settlementStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedSettlement.settlementStatus === 'paid' ? 'Settlement Settled' : 'Payment Awaiting Transfer'}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Gross Laboratory Revenue</div>
                  <div className="text-lg font-black font-mono text-slate-900">
                    {formatXAF(selectedSettlement.grossTestsRevenue)}
                  </div>
                  <p className="text-[10px] text-slate-500">100% collected by facility</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Patient Share Encaissée</div>
                  <div className="text-lg font-black font-mono text-slate-900">
                    {formatXAF(selectedSettlement.totalPatientShareRevenue)}
                  </div>
                  <p className="text-[10px] text-slate-500">Subject to 5% fee calculation</p>
                </div>

                <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#0F766E]">nanoLabs Fee Due (5%)</div>
                  <div className="text-lg font-black font-mono text-[#0D3B38]">
                    {formatXAF(selectedSettlement.platformFeeTotalDue)}
                  </div>
                  <p className="text-[10px] text-teal-800 font-semibold">TVA Exonérée (0%)</p>
                </div>
              </div>

              {/* Settlement Payment Confirmation */}
              {selectedSettlement.settlementStatus === 'paid' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Settlement Settled & Confirmed</span>
                  </div>
                  <p className="text-emerald-700 font-mono">
                    Bank / Wire Transaction Reference: {selectedSettlement.paymentTransactionRef}
                  </p>
                  <p className="text-[10px] text-emerald-600">
                    Settled on: {new Date(selectedSettlement.paidAt || '').toLocaleString('fr-FR')}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
                    Reconcile & Record Partner Bank Transfer
                  </h4>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      placeholder="Enter Bank Transfer Ref (e.g. UBA-CM-2026-98214)..."
                      value={txRef}
                      onChange={(e) => setTxRef(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:outline-hidden focus:border-teal-500"
                    />
                    <button
                      onClick={handleMarkPaid}
                      disabled={!txRef}
                      className="min-h-[44px] px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D3B38] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs"
                    >
                      Confirm Wire Payment
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-xs text-slate-400">Select a partner laboratory to view reconciliation statement.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlySettlementScreen;
