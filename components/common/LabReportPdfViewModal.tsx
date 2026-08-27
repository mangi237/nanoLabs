// components/common/LabReportPdfViewModal.tsx
import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  QrCode, 
  Award,
  Sparkles,
  Truck,
  MessageCircle,
  FileText
} from 'lucide-react';
import { PatientBooking, BookingTestItem } from '../../services/limsService';

interface LabReportPdfViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PatientBooking | any;
  labInfo?: any;
}

export const LabReportPdfViewModal: React.FC<LabReportPdfViewModalProps> = ({
  isOpen,
  onClose,
  booking,
  labInfo
}) => {
  if (!isOpen || !booking) return null;

  const labName = labInfo?.name || booking.labName || booking.sampleCollectedAt || 'Clinical Diagnostics Center';
  const labSlogan = labInfo?.slogan || labInfo?.tagline || 'Accurate • Precision • Verified Clinical Diagnostics';
  const labAddress = labInfo?.address || labInfo?.location || booking.labAddress || 'Central Diagnostic Facility';
  const labPhone = labInfo?.phone || labInfo?.contactNumber || booking.labPhone || '+237 600 000 000';
  const labEmail = labInfo?.email || labInfo?.contactEmail || booking.labEmail || 'lab@facility.com';
  const labWebsite = labInfo?.website || labInfo?.websiteUrl || booking.labWebsite || '';
  const labLicenseNumber = labInfo?.licenseNumber || '';
  const labDirectorName = labInfo?.directorName || 'Dr. Arthur M. Vance';
  const labDirectorPhone = labInfo?.directorPhone || '';
  const labLogo = labInfo?.logoUrl || labInfo?.avatarUrl || '';

  const handlePrint = () => {
    window.print();
  };

  const registeredTimeStr = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '02:31 PM 02 Dec, 2026';
    
  const collectedTimeStr = booking.sampleCollectedAtDate
    ? new Date(booking.sampleCollectedAtDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.sampleCollectedAtDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '03:11 PM 02 Dec, 2026';

  const reportedTimeStr = (booking.completedAt || booking.tests?.[0]?.completedAt)
    ? new Date(booking.completedAt || booking.tests?.[0]?.completedAt || '').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.completedAt || booking.tests?.[0]?.completedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '04:35 PM 02 Dec, 2026';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 my-auto max-h-[96vh] flex flex-col">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                Official Clinical Laboratory Report
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Verified & Signed
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Order ID: {booking.bookingCode} • Invoice: {booking.invoiceNumber || 'INV-001'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report */}
        <div className="overflow-y-auto flex-1 p-1 sm:p-4 bg-slate-100 my-2 rounded-2xl print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div id="report-content" className="bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 max-w-3xl mx-auto font-sans text-slate-900 print:shadow-none print:border-none print:max-w-none print:p-0 space-y-4">
            
            {/* Header */}
            <div className="border-b-2 border-slate-300 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {labLogo ? (
                    <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                      <img src={labLogo} alt={labName} referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-700 to-sky-500 text-white font-black flex items-center justify-center shadow-md border-2 border-white shrink-0">
                      <span className="text-xl font-black">{labName.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">{labName}</h1>
                    <div className="text-xs font-bold text-sky-700 tracking-wide">{labSlogan}</div>
                    <div className="text-[10px] text-slate-600 leading-tight max-w-sm mt-0.5">{labAddress}</div>
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div className="font-black text-blue-800 text-sm">DIAGNOSTIC REPORT</div>
                  <div className="font-mono text-slate-600">#{booking.bookingCode}</div>
                  <div className="text-slate-500">{registeredTimeStr}</div>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-sky-500 to-teal-400 rounded-full mt-3"></div>
            </div>

            {/* Patient Demographics */}
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-slate-500 font-semibold">Patient Name</div>
                <div className="font-black text-slate-900 text-sm">{booking.patientName || 'Patient'}</div>
                <div className="text-slate-600">PID: {booking.patientPid || booking.patientId}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Demographics</div>
                <div className="text-slate-800">Age: {booking.patientAge || 0} Yrs</div>
                <div className="text-slate-800">Gender: {booking.patientGender || 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-500 font-semibold">Clinical Information</div>
                <div className="text-slate-800">Referred By: {booking.doctorName || 'Attending Physician'}</div>
                <div className="text-slate-800">Collected: {collectedTimeStr}</div>
              </div>
            </div>

            {/* Test Results */}
            {booking.tests && booking.tests.length > 0 ? (
              booking.tests.map((test: any, tIdx: number) => (
                <div key={test.id || tIdx} className="space-y-2">
                  <div className="text-center border-b-2 border-slate-800 pb-1">
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">{test.testName}</h2>
                    <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-2">
                      <span>Sample: <strong>{test.sampleTypeRequired || 'Blood'}</strong></span>
                      <span>•</span>
                      <span>Category: <strong>{test.category || 'General'}</strong></span>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-400 text-slate-800 text-[11px]">
                        <th className="py-2 pr-3 font-black uppercase">Investigation</th>
                        <th className="py-2 px-3 font-black text-center uppercase">Result</th>
                        <th className="py-2 px-3 font-black text-center uppercase">Reference Range</th>
                        <th className="py-2 pl-3 font-black text-right uppercase">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {test.subParameters && test.subParameters.length > 0 ? (
                        test.subParameters.map((sp: any) => {
                          const isHigh = sp.flag === 'High' || (sp.value && parseFloat(sp.value) > parseFloat(sp.refRangeMale?.split('-')[1] || 100));
                          const isLow = sp.flag === 'Low' || (sp.value && parseFloat(sp.value) < parseFloat(sp.refRangeMale?.split('-')[0] || 0));
                          
                          return (
                            <tr key={sp.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-1.5 pr-3 font-medium text-slate-900">{sp.name}</td>
                              <td className="py-1.5 px-3 text-center font-bold">
                                <span className={isHigh ? 'text-rose-700' : isLow ? 'text-blue-700' : 'text-slate-900'}>
                                  {sp.value || 'N/A'}
                                </span>
                                {isHigh && <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-rose-100 text-rose-800 font-black rounded uppercase border border-rose-300">High</span>}
                                {isLow && <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-blue-100 text-blue-800 font-black rounded uppercase border border-blue-300">Low</span>}
                              </td>
                              <td className="py-1.5 px-3 text-center text-slate-700 font-mono text-[11px]">
                                {booking.patientGender === 'Female' ? sp.refRangeFemale : booking.patientGender === 'Child' ? sp.refRangeChild : sp.refRangeMale || 'Normal'}
                              </td>
                              <td className="py-1.5 pl-3 text-right text-slate-600 font-mono text-[11px]">{sp.unit}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="py-2.5 pr-3 font-black text-slate-900">{test.testName}</td>
                          <td className="py-2.5 px-3 text-center font-black text-sm text-blue-900">{test.resultValue || 'Normal'}</td>
                          <td className="py-2.5 px-3 text-center text-slate-700 font-mono text-[11px]">{test.refRangeMale || 'Normal'}</td>
                          <td className="py-2.5 pl-3 text-right text-slate-600 font-mono text-[11px]">{test.units || 'Index'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {test.labNotes && (
                    <div className="pt-1 text-[11px] text-slate-600 border-t border-slate-200">
                      <strong className="text-slate-800">Notes:</strong> {test.labNotes}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-4">No test results available.</div>
            )}

            {/* Sign Off */}
            <div className="pt-4 border-t-2 border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center text-xs">
              <div>
                <div className="h-8 flex items-center justify-center font-serif text-slate-800 italic font-bold text-sm tracking-wide">
                  {booking.tests?.[0]?.completedBy || 'Lab Technician'}
                </div>
                <div className="font-black text-slate-900">Lab Technician / Analyst</div>
              </div>
              <div>
                <div className="h-8 flex items-center justify-center font-serif text-blue-900 italic font-bold text-sm tracking-wide">
                  {labDirectorName}
                </div>
                <div className="font-black text-slate-900">Medical Director / Pathologist</div>
              </div>
              <div className="hidden sm:block">
                <div className="h-8 flex items-center justify-center font-serif text-teal-800 italic font-bold text-sm tracking-wide">
                  {labName}
                </div>
                <div className="font-black text-slate-900">Clinical Diagnostics QA</div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-900 text-white rounded-xl overflow-hidden p-2.5 flex items-center justify-between text-[11px] gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-bold text-[10px] text-sky-200">{labPhone}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Reported: {reportedTimeStr}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LabReportPdfViewModal;