import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Building2, 
  ShieldCheck, 
  Download, 
  Printer, 
  CheckCircle2, 
  Filter, 
  QrCode,
  User,
  Clock,
  Video
} from 'lucide-react';
import { PARTNER_LABS } from '../../core/gps';

export const DoctorReportsScreen: React.FC = () => {
  const [labFilter, setLabFilter] = useState('all');
  const [selectedReportId, setSelectedReportId] = useState('rep1');

  const reports = [
    {
      id: 'rep1',
      patientName: 'Mme. Claire Ngo',
      patientAge: 38,
      patientGender: 'F',
      batchNumber: 'BCH-202609-1092',
      labName: 'Laboratoire Central Akwa - Douala',
      approvalCode: 'MINSANTE/DP/0842',
      biologistName: 'Dr. Suzanne Mbongo',
      biologistLicense: 'ONMC #4829 / ONPC #1204',
      date: '09 Sep 2026',
      status: 'signed',
      qrHash: 'NL-BCH-202609-1092-99FA03',
      tests: [
        { name: 'Hémoglobine (Hb)', value: '12.8', unit: 'g/dL', ref: '11.5 - 15.0', flag: 'normal' },
        { name: 'Leucocytes (WBC)', value: '6,400', unit: '/mm³', ref: '4,000 - 10,000', flag: 'normal' },
        { name: 'Glycémie à Jeûn', value: '0.94', unit: 'g/L', ref: '0.70 - 1.10', flag: 'normal' },
        { name: 'Créatinine Sérique', value: '8.2', unit: 'mg/L', ref: '6.0 - 11.0', flag: 'normal' }
      ]
    },
    {
      id: 'rep2',
      patientName: 'M. Joseph Ewane',
      patientAge: 45,
      patientGender: 'M',
      batchNumber: 'BCH-202609-0821',
      labName: 'Centre Diagnostic Bonanjo',
      approvalCode: 'MINSANTE/DP/1105',
      biologistName: 'Dr. Paul Biya Jr.',
      biologistLicense: 'ONMC #5102',
      date: '08 Sep 2026',
      status: 'signed',
      qrHash: 'NL-BCH-202609-0821-44B129',
      tests: [
        { name: 'Créatininémie', value: '14.5', unit: 'mg/L', ref: '7.0 - 12.0', flag: 'high' },
        { name: 'Clairance Estimée (MDRD)', value: '62', unit: 'mL/min', ref: '> 90', flag: 'low' },
        { name: 'Ionogramme Sanguin (K+)', value: '4.2', unit: 'mEq/L', ref: '3.5 - 5.0', flag: 'normal' }
      ]
    }
  ];

  const filteredReports = reports.filter((r) => {
    if (labFilter === 'all') return true;
    return r.labName.toLowerCase().includes(labFilter.toLowerCase());
  });

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
          Referred Patient Reports Ledger
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7F7D]">
          Review official, biologist-signed laboratory reports from all nanoLabs partner facilities.
        </p>
      </div>

      {/* Main Grid: Left side report list, Right side report sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report List */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
              Filter by Facility
            </label>
            <select
              value={labFilter}
              onChange={(e) => setLabFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden"
            >
              <option value="all">All Accredited Labs</option>
              {PARTNER_LABS.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {filteredReports.map((rep) => {
              const isSelected = rep.id === activeReport.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0F766E] bg-white shadow-sm ring-2 ring-teal-100'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-bold text-xs text-slate-900">{rep.patientName}</span>
                    <span className="font-mono text-[10px] text-teal-800 font-bold">{rep.batchNumber}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{rep.labName}</p>
                  <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400">
                    <span>{rep.date}</span>
                    <span className="text-emerald-700 font-bold uppercase">Biologist Signed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Lab-Branded Report Sheet */}
        <div className="lg:col-span-2">
          {activeReport && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="border-b-2 border-slate-900/80 pb-5 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#0F766E]" />
                    <h2 className="text-base font-black text-[#0D3B38]">{activeReport.labName}</h2>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Agrément: {activeReport.approvalCode}
                  </p>
                </div>

                <div className="sm:text-right space-y-1 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Dossier N°</div>
                  <div className="font-mono font-black text-sm text-[#0D3B38]">{activeReport.batchNumber}</div>
                  <div className="text-[10px] text-slate-500">Date: {activeReport.date}</div>
                </div>
              </div>

              {/* Patient details */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs flex justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Patient</span>
                  <p className="font-bold text-slate-900">{activeReport.patientName}</p>
                  <p className="text-[11px] text-slate-500">{activeReport.patientAge} ans &bull; {activeReport.patientGender}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Prescripteur</span>
                  <p className="font-bold text-slate-900">Dr. Jean-Paul Kamga</p>
                </div>
              </div>

              {/* Parameter Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-2 px-2">Paramètre</th>
                      <th className="py-2 px-2">Valeur</th>
                      <th className="py-2 px-2">Unité</th>
                      <th className="py-2 px-2">Intervalles</th>
                      <th className="py-2 px-2 text-right">Interprétation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeReport.tests.map((t, idx) => {
                      const isAbnormal = t.flag !== 'normal';
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-2 font-bold text-slate-900">{t.name}</td>
                          <td className={`py-2.5 px-2 font-mono font-black ${isAbnormal ? 'text-rose-600' : 'text-[#0D3B38]'}`}>
                            {t.value}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-[11px] text-slate-500">{t.unit}</td>
                          <td className="py-2.5 px-2 font-mono text-[11px] text-slate-500">{t.ref}</td>
                          <td className="py-2.5 px-2 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isAbnormal
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {t.flag.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Biologist Signatory */}
              <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="space-y-1 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Validation Biologique</div>
                  <p className="font-bold text-slate-900">{activeReport.biologistName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{activeReport.biologistLicense}</p>
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                  <a
                    href="https://waspito.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-4 py-2 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Hold Online Video Consultation on Waspito Telehealth"
                  >
                    <Video className="w-4 h-4" />
                    <span>Hold Video Consult on Waspito</span>
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="min-h-[44px] px-4 py-2 bg-[#0F766E] hover:bg-[#0D3B38] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorReportsScreen;
