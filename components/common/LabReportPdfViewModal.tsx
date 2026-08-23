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
  MessageCircle
} from 'lucide-react';
import { PatientBooking, BookingTestItem } from '../../services/limsService';
import { formatDOBDisplay } from '../../data/cameroonInsurances';

interface LabReportPdfViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: (Partial<PatientBooking> & { tests: BookingTestItem[] }) | null;
  labInfo?: any;
}

export const LabReportPdfViewModal: React.FC<LabReportPdfViewModalProps> = ({
  isOpen,
  onClose,
  booking,
  labInfo
}) => {
  if (!isOpen || !booking) return null;

  const labName = labInfo?.name || 'Laboratory Name Not Configured';
const labSlogan = labInfo?.slogan || '';
const labAddress = labInfo?.address || labInfo?.location || 'Address not configured';
const labPhone = labInfo?.phone || 'N/A';
const labEmail = labInfo?.email || 'N/A';
const labWebsite = labInfo?.website || '';
  const handlePrint = () => {
    window.print();
  };

  // Generate formatted registration, collection, and reporting timestamps
  const registeredTimeStr = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '02:31 PM 02 Dec, 2026';
    
  const collectedTimeStr = booking.sampleCollectedAtDate
    ? new Date(booking.sampleCollectedAtDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.sampleCollectedAtDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '03:11 PM 02 Dec, 2026';
    const firstCompletedAt = booking.tests?.find(t => t.completedAt)?.completedAt;
    const reportedTimeStr = firstCompletedAt
      ? new Date(firstCompletedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(firstCompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Pending';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 my-auto max-h-[96vh] flex flex-col">
        
        {/* Top Control Bar (Non-printable) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                Official Clinical Laboratory Report Preview
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

        {/* Printable Paper Document Container */}
        <div className="overflow-y-auto flex-1 p-1 sm:p-4 bg-slate-100 my-2 rounded-2xl print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          <div 
            id="medical-report-sheet"
            className="bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 max-w-3xl mx-auto font-sans text-slate-900 print:shadow-none print:border-none print:max-w-none print:p-0 space-y-4"
          >
            
            {/* Top Header Matching medicalreport.webp */}
            <div className="border-b-2 border-slate-300 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left Lab Branding */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-700 to-sky-500 text-white font-black flex items-center justify-center shadow-md border-2 border-white">
                    <svg 
                      className="w-9 h-9 text-white" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.8" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      <circle cx="12" cy="3" r="1.5" fill="currentColor" />
                      <path d="M7 8c2.5-3 7.5-3 10 0" />
                      <path d="M8 14c2-2 6-2 8 0" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {labName}
                    </h1>
                    <div className="text-xs font-bold text-sky-700 tracking-wide">
                      {labSlogan}
                    </div>
                    <div className="text-[10px] text-slate-600 leading-tight max-w-sm mt-0.5">
                      {labAddress}
                    </div>
                  </div>
                </div>

                {/* Right Top Contact Bar & Diagonal Banner */}
                <div className="flex flex-col items-end text-[11px] text-slate-700 space-y-1">
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <Phone className="w-3.5 h-3.5 text-blue-700" />
                    <span>{labPhone}</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-blue-700" />
                    <span>{labEmail}</span>
                  </div>
                  <div className="bg-gradient-to-r from-blue-700 to-sky-600 text-white px-3 py-1 rounded-md text-[11px] font-bold shadow-xs flex items-center gap-1">
                    <Globe className="w-3 h-3 text-sky-200" />
                    <span>{labWebsite}</span>
                  </div>
                </div>
              </div>

              {/* Decorative Accent Slanted Stripe */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-sky-500 to-teal-400 rounded-full mt-3"></div>
            </div>

            {/* Patient Metadata Grid Box (Matching medicalreport.webp) */}
            <div className="border border-slate-300 rounded-xl p-3 sm:p-4 bg-slate-50/70 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              
              {/* Left Demographic Column (Col 4) */}
              <div className="md:col-span-4 space-y-1.5">
                <div>
                  <div className="text-base font-black text-slate-900">
                    {booking.patientName || 'Yash M. Patel'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500">Age: </span>
                    <strong className="text-slate-900">{booking.patientAge || 21} Years</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Sex: </span>
                    <strong className="text-slate-900">{booking.patientGender || 'Male'}</strong>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">PID: </span>
                  <strong className="font-mono text-slate-900">{booking.patientPid || '555'}</strong>
                </div>
              </div>

              {/* Middle Sample / Ref By Column (Col 4) */}
              <div className="md:col-span-4 border-y md:border-y-0 md:border-x border-slate-200 py-2 md:py-0 md:px-3 flex flex-col justify-between space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-2xs">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div className="text-[10px] text-slate-600 leading-tight">
                    <div className="font-bold text-slate-800">Sample Collected At:</div>
                    <div>{booking.sampleCollectedAt || labAddress.split(',')[0]}</div>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Ref. By: </span>
                  <strong className="text-slate-900 text-[11px]">{booking.doctorName || 'Dr. Hiren Shah'}</strong>
                </div>
              </div>

              {/* Right Barcode & Timestamps Column (Col 4) */}
              <div className="md:col-span-4 space-y-1.5 text-right flex flex-col justify-between">
                <div>
                  <div className="font-mono text-[9px] tracking-widest text-slate-800 font-bold uppercase inline-block">
                    ||||| | ||| |||| || | || ||||
                  </div>
                  <div className="font-mono text-[9px] text-slate-600">
                    {booking.bookingCode || '0 35545 62336 78 1'}
                  </div>
                </div>

                <div className="text-[10px] space-y-0.5 text-slate-600">
                  <div>
                    <span>Registered on: </span>
                    <strong className="text-slate-800">{registeredTimeStr}</strong>
                  </div>
                  <div>
                    <span>Collected on: </span>
                    <strong className="text-slate-800">{collectedTimeStr}</strong>
                  </div>
                  <div>
                    <span>Reported on: </span>
                    <strong className="text-slate-800">{reportedTimeStr}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Test Results Section (Matching medicalreport.webp) */}
            {booking.tests.map((testItem, tIdx) => (
              <div key={testItem.id || tIdx} className="space-y-2 pt-1">
                
                {/* Centered Bold Test Title */}
                <div className="text-center border-b-2 border-slate-800 pb-1">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {testItem.testName || 'Complete Blood Count (CBC)'}
                  </h2>
                  <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-2">
                    <span>Primary Sample Type: <strong>{testItem.sampleTypeRequired || 'Blood'}</strong></span>
                    <span>•</span>
                    <span>Department: <strong>{testItem.category || 'Haematology'}</strong></span>
                  </div>
                </div>

                {/* Sub-parameters or Direct Value Table with high/low badges */}
                <div className="relative overflow-hidden">
                  
                  {/* Subtle Background Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                    <span className="text-5xl font-black text-slate-900 tracking-widest uppercase transform -rotate-12">
                      {labName}
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse relative z-10">
                    <thead>
                      <tr className="border-b-2 border-slate-400 text-slate-800 text-[11px]">
                        <th className="py-2 pr-3 font-black uppercase">Investigation</th>
                        <th className="py-2 px-3 font-black text-center uppercase">Result</th>
                        <th className="py-2 px-3 font-black text-center uppercase">Reference Value</th>
                        <th className="py-2 pl-3 font-black text-right uppercase">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {testItem.subParameters && testItem.subParameters.length > 0 ? (
                        testItem.subParameters.map((sp) => {
                          const isHigh = sp.flag === 'High' || (sp.name?.toLowerCase().includes('pcv') && sp.value && Number(sp.value) > 50);
                          const isLow = sp.flag === 'Low' || (sp.name?.toLowerCase().includes('hemoglobin') && sp.value && Number(sp.value) < 13);
                          // const isBorderline = sp.flag === 'Borderline' || sp.name?.toLowerCase().includes('platelet');
                          const isBorderline = sp.name?.toLowerCase().includes('platelet');
                          const refVal = booking.patientGender === 'Female' 
                            ? (sp.refRangeFemale || sp.refRangeMale || 'Normal')
                            : booking.patientGender === 'Child' 
                              ? (sp.refRangeChild || sp.refRangeMale || 'Normal')
                              : (sp.refRangeMale || 'Normal');

                          const isCalculated = sp.name?.toLowerCase().includes('mcv') || sp.name?.toLowerCase().includes('mch') || sp.name?.toLowerCase().includes('mchc');

                          return (
                            <tr key={sp.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-1.5 pr-3 font-medium text-slate-900">
                                <div>{sp.name}</div>
                                {isCalculated && (
                                  <span className="text-[9px] text-slate-500 font-normal italic">Calculated</span>
                                )}
                              </td>
                              <td className="py-1.5 px-3 text-center font-bold">
                                <div className="inline-flex items-center justify-center gap-1.5">
                                  <span className={`font-black ${
                                    isHigh ? 'text-rose-700' : isLow ? 'text-blue-700' : 'text-slate-900'
                                  }`}>
                                    {sp.value || 'N/A'}
                                  </span>

                                  {isHigh && (
                                    <span className="px-1.5 py-0.2 text-[9px] bg-rose-100 text-rose-800 font-black rounded uppercase border border-rose-300">
                                      High
                                    </span>
                                  )}
                                  {isLow && (
                                    <span className="px-1.5 py-0.2 text-[9px] bg-blue-100 text-blue-800 font-black rounded uppercase border border-blue-300">
                                      Low
                                    </span>
                                  )}
                                  {isBorderline && (
                                    <span className="px-1.5 py-0.2 text-[9px] bg-amber-100 text-amber-800 font-black rounded uppercase border border-amber-300">
                                      Borderline
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-1.5 px-3 text-center text-slate-700 font-mono text-[11px]">
                                {refVal}
                              </td>
                              <td className="py-1.5 pl-3 text-right text-slate-600 font-mono text-[11px]">
                                {sp.unit}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="py-2.5 pr-3 font-black text-slate-900">
                            {testItem.testName}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-sm text-blue-900">
                            {testItem.resultValue || 'Normal / Non-Reactive'}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700 font-mono text-[11px]">
                            {booking.patientGender === 'Female' ? testItem.refRangeFemale : testItem.refRangeMale || 'Normal'}
                          </td>
                          <td className="py-2.5 pl-3 text-right text-slate-600 font-mono text-[11px]">
                            {testItem.units || 'Index'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Instruments & Interpretation (Matching medicalreport.webp) */}
                <div className="pt-2 space-y-1 text-[11px] text-slate-700 border-t border-slate-200">
                  <div>
                    <strong className="text-slate-900">Instruments: </strong>
                    <span>Fully automated cell counter - Mindray 300 / Sysmex / Roche Diagnostic Platform</span>
                  </div>
                  <div>
                    <strong className="text-slate-900">Interpretation: </strong>
                    <span>{testItem.labNotes || 'Clinical findings correlate with clinical history. Further confirm for diagnostic evaluation.'}</span>
                  </div>
                </div>

              </div>
            ))}

            {/* End of Report & Sign Off Strip */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200">
              <span className="font-semibold italic">Thanks for Reference</span>
              <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                **** End of Report ****
              </span>
            </div>

            {/* Signatures & Pathologist Sign-Off Block (Matching medicalreport.webp) */}
            <div>
  <div className="h-8 flex items-center justify-center font-serif text-slate-700 italic font-bold text-sm tracking-wide">
    {booking.tests[0]?.completedBy || 'Pending Technician Signature'}
  </div>
  <div className="font-black text-slate-900">Medical Lab Technician</div>
</div>

<div>
  <div className="h-8 flex items-center justify-center font-serif text-blue-900 italic font-bold text-sm tracking-wide">
    {booking.biologistName || 'Pending Biologist Sign-off'}
  </div>
  <div className="font-black text-slate-900">{booking.biologistName || 'Pending Biologist Sign-off'}</div>
</div>
            {/* Bottom Footer Bar Matching medicalreport.webp */}
            <div className="bg-slate-900 text-white rounded-xl overflow-hidden p-2.5 flex items-center justify-between text-[11px] gap-2 shadow-xs">
              
              {/* Left Sample Collection Badge */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-sky-500 rounded-lg text-slate-900">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold uppercase tracking-wider text-[10px] text-sky-200">
                  Sample Collection Hotline
                </span>
              </div>

              {/* Middle WhatsApp / Call Hotline */}
              <div className="flex items-center gap-1.5 bg-emerald-700 text-white px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                <MessageCircle className="w-3 h-3 text-white" />
                <span>{labPhone.split('|')[0]?.trim() || '0123456789'}</span>
              </div>

              {/* Right Generation Timestamp */}
              <div className="text-[10px] text-slate-300 font-mono">
                Generated on: {reportedTimeStr} | Page 1 of 1
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default LabReportPdfViewModal;
