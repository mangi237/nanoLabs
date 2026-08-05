import React, { useState } from 'react';
import Header from '../../components/common/Header';
import { FileText, Download, Filter, Calendar, CheckCircle2, ArrowLeft, Printer } from 'lucide-react';

interface ReportsScreenProps {
  embedded?: boolean;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  embedded = false,
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  const [dateRange, setDateRange] = useState('This Month');
  const [downloading, setDownloading] = useState<string | null>(null);

  const reportModules = [
    {
      id: 'rep-1',
      title: 'Monthly Revenue & Financial Audit',
      description: 'Detailed financial breakdown of lab tests, pending balances, and collected payments.',
      date: 'Aug 2026',
      size: '1.4 MB'
    },
    {
      id: 'rep-2',
      title: 'Laboratory Workload & Turnaround Time',
      description: 'Analysis of test sample collection to result verification time frames.',
      date: 'Aug 2026',
      size: '890 KB'
    },
    {
      id: 'rep-3',
      title: 'Reagent & Inventory Consumption Ledger',
      description: 'Stock usage patterns, vendor purchase orders, and reorder alerts log.',
      date: 'Jul 2026',
      size: '2.1 MB'
    },
    {
      id: 'rep-4',
      title: 'Patient Demographic & Epidemiology Summary',
      description: 'Patient age distribution, test request frequencies, and medical categories.',
      date: 'Jul 2026',
      size: '950 KB'
    }
  ];

  const handleDownload = (id: string) => {
    setDownloading(id);
    setTimeout(() => {
      setDownloading(null);
      alert('Report downloaded successfully.');
    }, 1200);
  };

  const content = (
    <div className="space-y-6">
      {onBack && !embedded && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">System Reports Center</h2>
          <p className="text-xs text-slate-500">Download formatted PDF and Excel clinical documentation</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>{dateRange}</span>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportModules.map(report => (
          <div
            key={report.id}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                  <FileText className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {report.size}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base">{report.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{report.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Period: {report.date}</span>
              <button
                onClick={() => handleDownload(report.id)}
                disabled={downloading === report.id}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold border border-teal-200 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloading === report.id ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Clinical Reports & Audit Logs"
        subtitle="Generate and export system performance documentation"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {content}
      </main>
    </div>
  );
};

export default ReportsScreen;
