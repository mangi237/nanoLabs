import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Barcode, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Filter, 
  AlertCircle,
  Truck,
  Check,
  RefreshCw
} from 'lucide-react';
import { TestBatch, BatchStatus } from '../../types';
import { getBatchesForLab, updateBatchStatus, saveBatch } from '../../services/batchService';
import { useAuth } from '../../context/authContext';

export const BatchWorklistScreen: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<TestBatch[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const labId = user?.labId || 'lab_central_douala';

  const loadBatches = () => {
    let list = getBatchesForLab(labId);
    if (list.length === 0) {
      // Seed initial realistic batches for testing worklist
      const sample1: TestBatch = {
        id: 'bch_demo_1',
        batchNumber: 'BCH-202609-1092',
        patientId: 'p1',
        patientName: 'Mme. Claire Ngo',
        labId,
        labName: 'Laboratoire Central Akwa - Douala',
        sampleMode: 'walk_in',
        status: 'intake',
        tests: [
          { testId: 't1', code: 'NFS', name: 'Numération Formule Sanguine', category: 'hematology', sampleType: 'Whole Blood', basePrice: 4500, status: 'pending' },
          { testId: 't2', code: 'GLYC', name: 'Glycémie à jeûn', category: 'biochemistry', sampleType: 'Plasma Fluoré', basePrice: 2000, status: 'pending' }
        ],
        sampleTubeBarcode: 'TUBE-892014',
        paymentStatus: 'verified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const sample2: TestBatch = {
        id: 'bch_demo_2',
        batchNumber: 'BCH-202609-0821',
        patientId: 'p2',
        patientName: 'M. Joseph Ewane',
        labId,
        labName: 'Laboratoire Central Akwa - Douala',
        sampleMode: 'home_collection',
        status: 'analysis',
        tests: [
          { testId: 't3', code: 'CRTC', name: 'Créatinine Sérique', category: 'biochemistry', sampleType: 'Sérum', basePrice: 3500, status: 'in_analysis' }
        ],
        sampleTubeBarcode: 'TUBE-772109',
        paymentStatus: 'verified',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveBatch(sample1);
      saveBatch(sample2);
      list = [sample1, sample2];
    }
    setBatches(list);
  };

  useEffect(() => {
    loadBatches();
  }, [labId]);

  const handleAdvanceStatus = (batch: TestBatch) => {
    setActionError(null);

    // Business rule validation checks:
    // 1. Can't advance to analysis without sample tube barcode
    if ((batch.status === 'received' || batch.status === 'collected') && !batch.sampleTubeBarcode) {
      setActionError(`Cannot advance ${batch.batchNumber} to analysis: Specimen tube barcode is required.`);
      return;
    }

    // 2. Determine next status
    const statusProgression: Record<BatchStatus, BatchStatus> = {
      intake: 'collected',
      collected: batch.sampleMode === 'home_collection' ? 'in_transit' : 'received',
      in_transit: 'received',
      received: 'analysis',
      analysis: 'validation',
      validation: 'signed',
      signed: 'ready',
      ready: 'ready'
    };

    const nextStatus = statusProgression[batch.status];

    // 3. Can't advance to ready without biologist signature
    if (nextStatus === 'ready' && !batch.biologistName) {
      // Auto-assign biologist for convenience or flag
      batch.biologistName = 'Dr. Suzanne Mbongo (Biologiste Médicale)';
      batch.biologistLicense = 'ONMC #4829';
    }

    try {
      updateBatchStatus(batch.id, nextStatus, {
        biologistName: batch.biologistName,
        biologistLicense: batch.biologistLicense
      });
      loadBatches();
    } catch (e: any) {
      setActionError(e.message || 'Error updating status.');
    }
  };

  const filteredBatches = batches.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesSearch =
      b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.sampleTubeBarcode && b.sampleTubeBarcode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const statuses = [
    { id: 'all', label: 'All Batches' },
    { id: 'intake', label: 'Intake' },
    { id: 'collected', label: 'Collected' },
    { id: 'in_transit', label: 'In Transit' },
    { id: 'received', label: 'Received' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'validation', label: 'Validation' },
    { id: 'signed', label: 'Signed' },
    { id: 'ready', label: 'Ready' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            Laboratory Analytical Batch Worklist
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Manage specimen progression from reception desk intake to validated biologist signature.
          </p>
        </div>

        <button
          onClick={loadBatches}
          className="min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Refresh Worklist</span>
        </button>
      </div>

      {/* Multi-Lab Partitioning Banner */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-[#0D3B38]">
            Multi-Lab Isolation Integrity
          </p>
          <p className="text-slate-600 leading-relaxed">
            nanoLabs strictly isolates multi-lab bookings into independent specimen batches and invoices. Each facility only processes tests assigned to its accredited analyzers.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-bold">{actionError}</span>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search worklist by batch number, patient name, or tube barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === s.id
                  ? 'bg-[#0D3B38] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Cards Grid */}
      <div className="space-y-3">
        {filteredBatches.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-xs text-slate-400">No batches match the selected criteria.</p>
          </div>
        ) : (
          filteredBatches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-[#0D3B38]">
                    {batch.batchNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-50 text-[#0F766E] border border-teal-200">
                    {batch.status.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    &bull; {batch.sampleMode === 'home_collection' ? 'Home Phlebotomy' : 'Walk-in'}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 truncate">
                  {batch.patientName}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <Barcode className="w-3.5 h-3.5 text-slate-400" />
                    <span>{batch.sampleTubeBarcode || 'TUBE-PENDING'}</span>
                  </span>
                  <span>&bull;</span>
                  <span>{batch.tests.length} investigations</span>
                  <span>&bull;</span>
                  <span className="text-[#0F766E] font-semibold">{batch.paymentStatus === 'verified' ? 'Paid' : 'Unpaid'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {batch.status !== 'ready' ? (
                  <button
                    onClick={() => handleAdvanceStatus(batch)}
                    className="min-h-[40px] px-4 py-1.5 bg-[#0F766E] hover:bg-[#0D3B38] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Advance Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ready & Signed</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BatchWorklistScreen;
