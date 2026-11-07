import React, { useState } from 'react';
import { 
  Cpu, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  Download,
  Building2
} from 'lucide-react';

export const EquipmentMonitorScreen: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const [analyzers, setAnalyzers] = useState([
    {
      id: 'mindray_bc6800',
      name: 'Mindray BC-6800 Plus',
      category: 'Automated Hematology Analyzer',
      connection: 'online',
      calibrationStatus: 'Calibrated (01 Sep 2026)',
      qcStatus: 'passed',
      qcLastRun: 'Today, 06:15 AM',
      pendingResultsCount: 4,
      throughput: '125 tests/hour'
    },
    {
      id: 'roche_cobas_c311',
      name: 'Roche Cobas c311',
      category: 'Clinical Chemistry & Electrolytes',
      connection: 'online',
      calibrationStatus: 'Calibrated (28 Aug 2026)',
      qcStatus: 'passed',
      qcLastRun: 'Today, 06:45 AM',
      pendingResultsCount: 7,
      throughput: '300 tests/hour'
    },
    {
      id: 'sysmex_xn1000',
      name: 'Sysmex XN-1000',
      category: 'Coagulation & Hemogram',
      connection: 'online',
      calibrationStatus: 'Calibrated (15 Aug 2026)',
      qcStatus: 'passed',
      qcLastRun: 'Today, 07:00 AM',
      pendingResultsCount: 2,
      throughput: '100 tests/hour'
    },
    {
      id: 'biomerieux_vitek',
      name: 'bioMérieux Vitek 2 Compact',
      category: 'Microbial Identification & AST',
      connection: 'idle',
      calibrationStatus: 'Calibrated (10 Aug 2026)',
      qcStatus: 'passed',
      qcLastRun: 'Yesterday, 05:00 PM',
      pendingResultsCount: 0,
      throughput: 'Batch-mode 30 cards'
    }
  ]);

  const handleAutoImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setImportNotice('13 analyzer results automatically imported to pending batch worklists.');
      setTimeout(() => setImportNotice(null), 4000);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            Automated Clinical Analyzers & QC Monitor
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Laboratory instrument middleware: Westgard QC rules, ASTM/HL7 interfaces, and automated worklist imports.
          </p>
        </div>

        <button
          onClick={handleAutoImport}
          disabled={isImporting}
          className="min-h-[44px] px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D3B38] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
          <span>Auto-Import Analyzers Results</span>
        </button>
      </div>

      {importNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{importNotice}</span>
        </div>
      )}

      {/* QC Overview Banner */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-[#0D3B38]">
            Quality Assurance Compliance (ISO 15189)
          </p>
          <p className="text-slate-600 leading-relaxed">
            All analytical runs are conditioned upon valid multi-rule QC controls (1:2s, 1:3s, 2:2s Westgard rules). Results failing control ranges are automatically quarantined from validation.
          </p>
        </div>
      </div>

      {/* Analyzer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analyzers.map((analyzer) => (
          <div
            key={analyzer.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 hover:border-teal-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#0B1F1D]">{analyzer.name}</h3>
                    <p className="text-[11px] text-slate-500">{analyzer.category}</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  {analyzer.connection}
                </span>
              </div>

              {/* Status metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Calibration</div>
                  <div className="text-[11px] font-bold text-slate-800 truncate">{analyzer.calibrationStatus}</div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Westgard QC</div>
                  <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>QC Passed (Normal)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Pending results: <strong>{analyzer.pendingResultsCount}</strong></span>
              <span className="text-[10px] font-mono text-slate-400">QC: {analyzer.qcLastRun}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquipmentMonitorScreen;
