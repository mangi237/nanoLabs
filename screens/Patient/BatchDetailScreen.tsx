import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Thermometer, 
  FileText, 
  AlertTriangle, 
  ArrowLeft, 
  QrCode, 
  Phone,
  CreditCard,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { TestBatch, TransitSession } from '../../types';
import { getBatchById, updateBatchStatus } from '../../services/batchService';
import { getTransitSessionForBatch, getLastSeenDescription } from '../../services/transitTracker';
import { getInvoiceByBatchId } from '../../services/invoiceService';
import { formatXAF } from '../../shared/money';

interface BatchDetailScreenProps {
  batchId: string;
  onBack: () => void;
  onViewResults?: (batchId: string) => void;
  onViewInvoice?: (invoiceId: string) => void;
}

export const BatchDetailScreen: React.FC<BatchDetailScreenProps> = ({
  batchId,
  onBack,
  onViewResults,
  onViewInvoice
}) => {
  const [batch, setBatch] = useState<TestBatch | null>(null);
  const [transit, setTransit] = useState<TransitSession | null>(null);
  const [cancelMessage, setCancelMessage] = useState('');

  useEffect(() => {
    const loaded = getBatchById(batchId);
    if (loaded) {
      setBatch(loaded);
      const activeTransit = getTransitSessionForBatch(batchId);
      if (activeTransit) {
        setTransit(activeTransit);
      }
    }
  }, [batchId]);

  if (!batch) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-xs text-slate-500">Diagnostic batch not found.</p>
        <button
          onClick={onBack}
          className="mt-3 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const invoice = getInvoiceByBatchId(batch.id);

  const canCancel = batch.status === 'intake' || (batch.status === 'collected' && batch.sampleMode === 'walk_in');

  const handleCancelBatch = () => {
    if (!canCancel) return;
    try {
      updateBatchStatus(batch.id, 'intake', { notes: 'Cancelled by patient prior to laboratory intake.' });
      setCancelMessage('Batch cancellation requested.');
    } catch (e: any) {
      setCancelMessage(e.message || 'Cannot cancel batch at this stage.');
    }
  };

  const steps = [
    { key: 'intake', label: 'Intake Desk' },
    { key: 'collected', label: 'Sample Drawn' },
    { key: 'in_transit', label: 'Cold Transit' },
    { key: 'analysis', label: 'Analysis' },
    { key: 'signed', label: 'Biologist Signed' },
    { key: 'ready', label: 'Ready' }
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'intake': return 0;
      case 'collected': return 1;
      case 'in_transit': return 2;
      case 'received':
      case 'analysis':
      case 'validation': return 3;
      case 'signed': return 4;
      case 'ready': return 5;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(batch.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Bar with Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="min-h-[44px] px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-teal-50 text-[#0F766E] border border-teal-200">
            {batch.batchNumber}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-slate-100 text-slate-800">
            {batch.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Multi-Lab Partitioning Banner */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-[#0D3B38]">
            Multi-Lab Clinical Isolation Guaranteed
          </p>
          <p className="text-slate-600 leading-relaxed">
            Tests at nanoLabs are partitioned into dedicated batches per laboratory facility. You receive an authentic lab-branded report and a separate invoice for each diagnostic facility.
          </p>
        </div>
      </div>

      {/* Main Batch Detail Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        {/* Lab info & Tube Barcode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#0F766E] font-bold">
              <Building2 className="w-4 h-4" />
              <span>Certified Testing Facility</span>
            </div>
            <h2 className="text-lg font-black text-[#0B1F1D]">
              {batch.labName}
            </h2>
            <p className="text-xs text-[#6B7F7D]">
              Registered on: {new Date(batch.createdAt).toLocaleString('fr-FR')}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-right space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Specimen Barcode</div>
            <div className="text-xs font-mono font-bold text-slate-800">
              {batch.sampleTubeBarcode || `TUBE-${batch.batchNumber}`}
            </div>
          </div>
        </div>

        {/* Dynamic Progress Stepper */}
        <div className="py-2">
          <div className="grid grid-cols-6 gap-2">
            {steps.map((s, idx) => {
              const isPassed = currentIndex >= idx;
              const isCurrent = currentIndex === idx;
              return (
                <div key={s.key} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#0F766E] text-white ring-4 ring-teal-100 shadow-xs'
                        : isPassed
                        ? 'bg-[#14B8A6] text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[10px] leading-tight ${
                      isCurrent ? 'font-bold text-[#0D3B38]' : isPassed ? 'font-medium text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Phlebotomist Transit Map Section (If Home Collection) */}
        {batch.sampleMode === 'home_collection' && (
          <div className="p-5 bg-gradient-to-br from-slate-900 via-[#0D3B38] to-slate-900 text-white rounded-3xl shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#14B8A6]" />
                <h3 className="text-sm font-bold tracking-tight text-white">
                  Live Phlebotomist Transit & Cold Chain
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#14B8A6]/20 text-teal-300 border border-teal-400/30">
                {transit ? getLastSeenDescription(transit.lastPingAt) : 'Live GPS Dispatch'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                <div className="text-[10px] uppercase font-bold text-teal-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Estimated Arrival</span>
                </div>
                <div className="text-lg font-black font-mono">
                  {transit?.etaMinutes || 18} mins
                </div>
              </div>

              <div className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                <div className="text-[10px] uppercase font-bold text-teal-300 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>Cold Chain Temp</span>
                </div>
                <div className="text-lg font-black font-mono text-emerald-400">
                  +{transit?.coldChainTemperatureCelsius || 4.2}°C
                </div>
              </div>

              <div className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                <div className="text-[10px] uppercase font-bold text-teal-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phlebotomist</span>
                </div>
                <div className="text-xs font-bold truncate">
                  {transit?.phlebotomistName || 'M. Eric Mbida'}
                </div>
                <div className="text-[10px] text-slate-300 font-mono">
                  {transit?.phlebotomistPhone || '+237 699 44 22 11'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tests in this Batch */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Laboratory Investigations ({batch.tests.length})
          </h3>
          <div className="space-y-2">
            {batch.tests.map((t) => (
              <div
                key={t.testId}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{t.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {t.code} &bull; Specimen: {t.sampleType}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">{formatXAF(t.basePrice)}</span>
                  <div className="text-[10px] text-teal-700 font-semibold capitalize">
                    {t.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice & Payment Snapshot */}
        {invoice && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0F766E]" />
                <span className="font-bold text-slate-900">Official Invoice: {invoice.invoiceNumber}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Patient Out-of-Pocket: {formatXAF(invoice.patientShare)} + 5% nanoLabs fee ({formatXAF(invoice.platformFeeAmount)})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                invoice.paymentStatus === 'verified'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {invoice.paymentStatus === 'verified' ? 'Payment Verified' : 'Co-Pay Due at Cashier'}
              </span>
              {onViewInvoice && (
                <button
                  onClick={() => onViewInvoice(invoice.id)}
                  className="min-h-[36px] px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer"
                >
                  View Invoice
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions Bottom Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {canCancel ? (
            <button
              onClick={handleCancelBatch}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Batch (Prior to Laboratory Intake)</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">
              Batch is currently under clinical laboratory custody and cannot be cancelled.
            </span>
          )}

          {batch.status === 'ready' && onViewResults && (
            <button
              onClick={() => onViewResults(batch.id)}
              className="min-h-[44px] px-6 py-2.5 bg-[#0F766E] hover:bg-[#0D3B38] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>View Signed Lab Report</span>
            </button>
          )}
        </div>

        {cancelMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {cancelMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDetailScreen;
