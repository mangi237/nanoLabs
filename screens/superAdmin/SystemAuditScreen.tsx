import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Lock,
  RefreshCw
} from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { getAuditTrail, verifyAuditChain, exportAuditTrailJSON } from '../../services/auditLogger';

export const SystemAuditScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isChainValid, setIsChainValid] = useState(true);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAuditData = () => {
    const trail = getAuditTrail();
    setLogs(trail);
    const valid = verifyAuditChain();
    setIsChainValid(valid);
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const handleExportJSON = () => {
    const jsonString = exportAuditTrailJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nanolabs_audit_ledger_${Date.now()}.json`;
    a.click();
  };

  const filteredLogs = logs.filter((log) => {
    const actor = log.actorName || '';
    const evt = log.eventType || log.action || '';
    const hashVal = log.entryHash || log.hash || '';
    const matchesSearch =
      actor.toLowerCase().includes(search.toLowerCase()) ||
      evt.toLowerCase().includes(search.toLowerCase()) ||
      hashVal.toLowerCase().includes(search.toLowerCase());
    const matchesType = eventTypeFilter === 'all' || evt === eventTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            Cryptographic Audit Ledger & Hash Chain
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Append-only tamper-evident event log. Every medical action, signature, and payment verification is hash-chained.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Hash Chain Verification Status Badge */}
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            isChainValid
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {isChainValid ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Hash-Chain Validated (Intact)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Chain Tamper Detected</span>
              </>
            )}
          </div>

          <button
            onClick={handleExportJSON}
            className="min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by actor, hash, or event type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Events</option>
            <option value="batch_created">batch_created</option>
            <option value="status_change">status_change</option>
            <option value="payment_verified">payment_verified</option>
            <option value="batch_signed">batch_signed</option>
          </select>

          <button
            onClick={loadAuditData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Index</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Entry Hash</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, idx) => {
                const isExpanded = expandedId === log.id;
                const evt = log.eventType || log.action;
                const hashVal = log.entryHash || log.hash;
                const itemIndex = log.index ?? (idx + 1);
                const metadataPayload = log.metadata || log.details || {};
                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        #{itemIndex}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0F766E]">
                        {evt}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{log.actorName}</div>
                        <div className="text-[10px] uppercase text-slate-400 font-mono">{log.actorRole}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {hashVal.slice(0, 16)}...
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-200">
                        <td colSpan={6} className="p-4 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                            <div className="p-2 bg-white rounded-xl border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">Previous Hash</span>
                              <span className="text-slate-700 break-all">{log.previousHash}</span>
                            </div>
                            <div className="p-2 bg-white rounded-xl border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">Current Entry Hash</span>
                              <span className="text-teal-700 font-bold break-all">{hashVal}</span>
                            </div>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
                            <span className="text-slate-400 block text-[10px] mb-1 uppercase font-bold">Metadata Payload</span>
                            <pre className="whitespace-pre-wrap">{JSON.stringify(metadataPayload, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemAuditScreen;
