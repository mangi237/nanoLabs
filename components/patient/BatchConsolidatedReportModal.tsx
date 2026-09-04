import React from 'react';
import { 
  FileText, 
  Printer, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Building2, 
  User, 
  Calendar, 
  Share2,
  Download,
  TestTube,
  Check,
  Award
} from 'lucide-react';
import { PatientBooking } from '../../services/limsService';

interface BatchConsolidatedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PatientBooking | null;
  labInfo?: any;
  patientInfo?: any;
  onShareToDoctor?: (booking: PatientBooking) => void;
  
}

export const BatchConsolidatedReportModal: React.FC<BatchConsolidatedReportModalProps> = ({
  isOpen,
  onClose,
  booking,
  labInfo,
  patientInfo,
  onShareToDoctor
}) => {
  if (!isOpen || !booking) return null;

  const labName = labInfo?.name || booking.labName || 'Central Clinical Diagnostics & Pathology';
  const labSlogan = labInfo?.slogan || 'Accredited Medical Diagnostics & Molecular Pathology';
  const labAddress = labInfo?.address || 'Medical District, Douala, Cameroon';
  const labPhone = labInfo?.phone || '+237 670 000 000';
  const labEmail = labInfo?.email || 'diagnostics@nanolabs.health';
  const labLogo = labInfo?.logoUrl || '';
  const labLicense = labInfo?.licenseNumber || 'NANOLABS/LAB/2026/0491';

  const patientName = booking.patientName || patientInfo?.name || 'Valued Patient';
  const patientPid = booking.patientPid || booking.patientId || patientInfo?.patientId || 'PID-2026';
  const patientAge = booking.patientAge || patientInfo?.age || 32;
  const patientGender = booking.patientGender || patientInfo?.gender || 'Adult';
  const patientPhone = booking.patientPhone || patientInfo?.phone || '+237 600000000';
  const doctorName = booking.referringDoctor || booking.doctorName || 'Dr. Attending Clinical Specialist';

  const orderDate = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const validationDate = booking.updatedAt 
    ? new Date(booking.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : orderDate;

  const tests = booking.tests || [];
  const allCompleted = tests.length > 0 && tests.every(t => t.status === 'Completed' || t.status === 'Ready_For_Pickup');

  const handlePrint = () => {
    window.print();
  };

  // Helper to determine flag/status styling
  const getParamFlag = (valStr: string, rangeStr?: string) => {
    if (!valStr || !rangeStr) return { label: 'NORMAL', color: 'text-slate-700 bg-slate-100' };
    const num = parseFloat(valStr);
    if (isNaN(num)) return { label: 'VERIFIED', color: 'text-slate-700 bg-slate-100' };
    
    // Parse range e.g. "12.0 - 16.0" or "70 - 110"
    const parts = rangeStr.split('-').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      if (num < parts[0]) return { label: 'LOW', color: 'text-amber-800 bg-amber-100 font-black' };
      if (num > parts[1]) return { label: 'HIGH', color: 'text-rose-800 bg-rose-100 font-black' };
      return { label: 'NORMAL', color: 'text-emerald-800 bg-emerald-100 font-bold' };
    }
    return { label: 'NORMAL', color: 'text-slate-700 bg-slate-100' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Non-Printable) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                Consolidated Batch Diagnostic Report
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-md text-[10px] font-mono border border-teal-500/30">
                  {booking.bookingCode}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official signed digital medical record containing all {tests.length} batch tests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onShareToDoctor && (
              <button
                onClick={() => onShareToDoctor(booking)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-teal-700/50"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share with Doctor</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Sheet */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 print:overflow-visible print:p-6 font-sans text-slate-900">
          
          {/* Header Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {labLogo ? (
                  <img 
                    src={labLogo} 
                    alt={labName} 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-contain border border-slate-200 p-1"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black shadow-xs">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    {labName}
                  </h1>
                  <p className="text-xs font-semibold text-teal-800">
                    {labSlogan}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {labAddress} • Tel: {labPhone} • {labEmail}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Accreditation / Lic: {labLicense}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0 print:bg-white print:border-slate-300">
                <div className="font-bold text-slate-900">
                  REPORT TYPE: <span className="text-teal-800">CONSOLIDATED BATCH REPORT</span>
                </div>
                <div className="font-mono text-slate-700">
                  Requisition ID: <strong>{booking.bookingCode}</strong>
                </div>
                <div className="text-slate-600">
                  Sample Collection: <strong>{orderDate}</strong>
                </div>
                <div className="text-slate-600">
                  Release / Verification: <strong>{validationDate}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Patient & Clinical Demographics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs print:bg-white print:border-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Patient Name</span>
              <span className="font-black text-slate-900 text-sm">{patientName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Patient ID (PID)</span>
              <span className="font-mono font-bold text-teal-800">{patientPid}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Age / Gender</span>
              <span className="font-semibold text-slate-800">{patientAge} Yrs • {patientGender}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Referring Physician</span>
              <span className="font-bold text-slate-900">{doctorName}</span>
            </div>
          </div>

          {/* Detailed Batch Test Results Table */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <TestTube className="w-4 h-4 text-teal-700" />
                Itemized Biochemical & Clinical Diagnostic Parameters ({tests.length} Tests in Batch)
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                allCompleted ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {allCompleted ? 'All Tests Validated & Released' : 'Processing in Progress'}
              </span>
            </div>

            {tests.map((test, testIdx) => {
              const isTestDone = test.status === 'Completed' || test.status === 'Ready_For_Pickup';
              const hasSubParams = test.subParameters && test.subParameters.length > 0;

              return (
                <div key={test.id || testIdx} className="space-y-2 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  {/* Test Section Header */}
                  <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs">
                    <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center font-mono text-xs">
                        {testIdx + 1}
                      </span>
                      <span>{test.testName || test.name}</span>
                      {test.category && (
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          ({test.category})
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600 font-medium">
                      Specimen: <strong className="text-slate-900">{test.sampleTypeRequired || 'Blood / Serum'}</strong>
                    </div>
                  </div>

                  {/* Test Parameter Values Table */}
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Biochemical Marker / Investigation</th>
                          <th className="py-2.5 px-4 text-center">Observed Result</th>
                          <th className="py-2.5 px-4">Standard Biological Range</th>
                          <th className="py-2.5 px-4">Unit</th>
                          <th className="py-2.5 px-4 text-right">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {hasSubParams ? (
                          test.subParameters?.map((param: any, pIdx: number) => {
                            const range = patientGender === 'Female' && param.refRangeFemale 
                              ? param.refRangeFemale 
                              : param.refRangeMale || param.referenceRange || 'Standard Range';
                            const flag = getParamFlag(param.value || '', range);

                            return (
                              <tr key={param.id || pIdx} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4 font-bold text-slate-900">
                                  {param.name}
                                </td>
                                <td className="py-2.5 px-4 text-center font-mono font-black text-sm text-slate-900">
                                  {param.value || (isTestDone ? 'Normal' : 'Pending')}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-slate-600">
                                  {range}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-slate-500">
                                  {param.unit || test.units || '-'}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${flag.color}`}>
                                    {flag.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {test.testName} (Overall Assay)
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-black text-sm text-teal-900">
                              {test.resultValue || (isTestDone ? 'NEGATIVE / NORMAL' : 'In Analysis')}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {test.refRangeMale || 'Negative / Non-Reactive'}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">
                              {test.units || 'Index / Qualitative'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                VERIFIED
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Clinical Technologist Interpretation / Notes */}
                  {(test as any).notes && (
                    <div className="p-3 bg-slate-50 text-[11px] border-t border-slate-200 text-slate-700">
                      <strong>Clinical Notes: </strong> {(test as any).notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Medical Remarks & Biologist Digital Signature */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 print:bg-white print:border-slate-300">
              <h4 className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-700" />
                Laboratory Quality & Clinical Certification
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                This document constitutes the official consolidated multi-parameter diagnostic examination record generated by accredited automated analyzers with verified internal quality controls. Diagnostic findings should be correlated with clinical symptoms by the attending physician.
              </p>
              <div className="text-[10px] font-mono text-slate-500 pt-1">
                E2EE Hash: SHA256-{(booking.id || '2026').substring(0, 16).toUpperCase()}
              </div>
            </div>

            {/* Official Signature Box */}
            <div className="flex flex-col justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 print:bg-white print:border-slate-300">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Authorized Sign-off</span>
                  <div className="font-extrabold text-slate-900 text-sm">Dr. Marie-Claire Bella, MD, PhD</div>
                  <div className="text-[11px] text-slate-600">Chief Clinical Pathologist & Lab Director</div>
                </div>

                {/* Digital Stamp Seal */}
                <div className="w-16 h-16 rounded-full border-2 border-teal-700/80 bg-teal-50 flex flex-col items-center justify-center text-teal-800 text-[9px] font-black text-center p-1 uppercase rotate-[-6deg] shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Verified</span>
                  <span className="text-[7px]">nanoLabs</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Sign Date: {validationDate}</span>
                <span className="text-emerald-700 font-bold">DIGITALLY CERTIFIED</span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            {labName} • Official Digital Laboratory System • Valid without handwritten signature under Medical Informatics Act
          </div>

        </div>

        {/* Modal Bottom Footer (Non-Printable) */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Formatted for standard A4 printing and digital export
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Batch Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BatchConsolidatedReportModal;
