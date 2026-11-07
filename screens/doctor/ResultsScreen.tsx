import React, { useState, useMemo } from 'react';
import {
  Search,
  FileCheck2,
  FlaskConical,
  Building2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useNav } from '../../components/doctor/nav';
import { SectionCard, EmptyStateCard, StatusTag } from '../../components/doctor/ui';

export const ResultsScreen: React.FC = () => {
  const { dossiers, push, refreshDossiers } = useNav();
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'certified'>('all');
  const [queryText, setQueryText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase().replace(/^@+/, '');
    return dossiers.filter((d) => {
      if (filter === 'in_progress' && d.isCertifiedResult) return false;
      if (filter === 'certified' && !d.isCertifiedResult) return false;
      if (!q) return true;
      return (
        d.patientName.toLowerCase().includes(q) ||
        (d.patientAlias || '').toLowerCase().includes(q) ||
        d.bookingCode.toLowerCase().includes(q) ||
        d.labName.toLowerCase().includes(q) ||
        d.tests.some((t) => t.name.toLowerCase().includes(q))
      );
    });
  }, [dossiers, filter, queryText]);

  const handleSync = async () => {
    setRefreshing(true);
    try {
      await refreshDossiers();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Patient Lab Requests &amp; Certified Results
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live diagnostic tracking across registered laboratories and biologist-certified reports.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSync}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Filter by patient name, @alias, booking code, test, or laboratory..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({dossiers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              filter === 'in_progress'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            In-Progress ({dossiers.filter((d) => !d.isCertifiedResult).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('certified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              filter === 'certified'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Certified ({dossiers.filter((d) => d.isCertifiedResult).length})
          </button>
        </div>
      </div>

      <SectionCard>
        {filtered.length === 0 ? (
          <EmptyStateCard
            icon={<FlaskConical className="w-5 h-5" />}
            title="No Matching Lab Dossiers"
            description="Patient lab test requests booked at partner laboratories and certified biologist reports appear here automatically."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <button
                key={`${d.bookingCode}-${d.id}`}
                type="button"
                onClick={() => push({ name: 'result', dossierId: d.id, dossier: d })}
                className="w-full text-left py-4 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{d.patientName}</span>
                    {d.patientAlias && (
                      <span className="text-xs font-mono text-teal-700">@{d.patientAlias}</span>
                    )}
                    <span className="text-xs font-mono text-slate-400">#{d.bookingCode}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">
                    {d.tests.map((t) => t.name).join(', ') || 'Diagnostic Panel'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {d.labName}
                    </span>
                    {d.biologistSigned && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Signed by {d.biologistName || 'Biologist'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                  <StatusTag tone={d.isCertifiedResult ? 'emerald' : 'amber'}>
                    {d.stageLabel}
                  </StatusTag>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <FileCheck2 className="w-3 h-3" />
                    {new Date(d.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default ResultsScreen;
