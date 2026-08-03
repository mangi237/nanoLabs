import React from 'react';
import Header from '../../components/common/Header';
import { ArrowLeft, Printer, Download, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

interface ResultViewScreenProps {
  test?: any;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const ResultViewScreen: React.FC<ResultViewScreenProps> = ({
  test,
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  const currentTest = test || {
    testName: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    price: 4500,
    requestedDate: '2026-07-28',
    completedDate: '2026-07-29',
    status: 'completed',
    result: 'Hemoglobin: 14.2 g/dL (Normal). WBC: 6.5 x10^3/uL. RBC: 4.8 x10^6/uL. Platelets: 250 x10^3/uL.',
    patientName: 'Sarah Connor',
    patientId: 'P-9021'
  };

 
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Laboratory Test Report"
        subtitle="Official diagnostic findings documentation"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-lg space-y-6">
          {/* Print Action Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  nano<span className="text-teal-600">Labs</span> Diagnostic Certificate
                </h1>
                <p className="text-xs text-slate-500 font-mono">Report ID: NL-{currentTest.id || '99201'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => alert('Report download started.')}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          {/* Patient Details Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Patient Name</span>
              <span className="font-bold text-slate-900">{currentTest.patientName || 'Sarah Connor'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Patient Code</span>
              <span className="font-mono font-semibold text-slate-800">{currentTest.patientId || 'P-9021'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Test Category</span>
              <span className="font-semibold text-teal-700">{currentTest.category || 'General'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Date Verified</span>
              <span className="font-semibold text-slate-800">{currentTest.completedDate || currentTest.requestedDate || 'Recent'}</span>
            </div>
          </div>

          {/* Test Main Title */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">{currentTest.testName || currentTest.name}</h2>
            <p className="text-xs text-slate-500">Official verified diagnostic breakdown</p>
          </div>

          {/* Results Box */}
          <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-3">
            <div className="flex items-center gap-2 text-teal-900 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Verified Diagnostic Findings
            </div>
            <p className="text-sm font-medium text-slate-800 leading-relaxed font-mono">
              {currentTest.result || 'Sample collected. Diagnostic analysis completed within expected physiological reference parameters.'}
            </p>
          </div>

          {/* Verification Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Verified by Lab Director Dr. Alexis Vance
            </div>
            <span>nanoLabs Security Signature: SEC-HASH-998102</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultViewScreen;
