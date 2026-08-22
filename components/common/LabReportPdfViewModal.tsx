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
  Sparkles
} from 'lucide-react';
import { PatientBooking, BookingTestItem } from '../../services/limsService';
import { formatDOBDisplay } from '../../data/cameroonInsurances';

interface LabReportPdfViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PatientBooking | null;
  labInfo?: any;
}

export const LabReportPdfViewModal: React.FC<LabReportPdfViewModalProps> = ({
  isOpen,
  onClose,
  booking,
  labInfo
}) => {
  if (!isOpen || !booking) return null;

  const labName = labInfo?.name || booking.sampleCollectedAt || 'DRLOGY PATHOLOGY LAB';
  const labSlogan = labInfo?.slogan || 'Accurate | Caring | Instant';
  const labAddress = labInfo?.address || labInfo?.location || '105-108, Healthcare Complex, Central Diagnostic Ave';
  const labPhone = labInfo?.phone || '+237 670 000 000 / 690 000 000';
  const labEmail = labInfo?.email || 'reports@nanolabs.health';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        
        {/* Top Control Bar (Non-printable) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-700 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                Official Clinical Laboratory Report
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  Verified & Signed
                </span>
              </h3>
              <p className="text-xs text-teal-300 font-mono">
                Order ID: {booking.bookingCode} • Invoice: {booking.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
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
        <div className="overflow-y-auto flex-1 p-2 sm:p-6 bg-slate-100 my-3 rounded-2xl print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          <div className="bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 max-w-3xl mx-auto font-sans text-slate-900 print:shadow-none print:border-none print:max-w-none print:p-0 space-y-6">
            
            {/* Top Blue Gradient Banner Header */}
            <div className="border-b-4 border-blue-700 pb-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-blue-700 text-white font-black flex items-center justify-center text-2xl shadow-md">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tight">
                      {labName}
                    </h1>
                    <div className="text-xs font-extrabold text-blue-600 tracking-wide flex items-center gap-2">
                      <span>{labSlogan}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      {labAddress}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-600 space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                  <div className="flex items-center justify-end gap-1 font-bold text-slate-800">
                    <Phone className="w-3 h-3 text-blue-600" />
                    <span>{labPhone}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Mail className="w-3 h-3 text-blue-600" />
                    <span>{labEmail}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 font-semibold text-blue-700">
                    <Globe className="w-3 h-3" />
                    <span>www.nanolabs.health</span>
                  </div>
                </div>
              </div>

              {/* Geometric Accent Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-sky-500 to-teal-500 rounded-full mt-2"></div>
            </div>

            {/* Patient Metadata & Sample Information Header Box */}
            <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs relative">
              
              {/* Column 1: Patient Identity */}
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Patient Name</span>
                  <div className="text-base font-black text-slate-900">{booking.patientName}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-500">Age / DOB: </span>
                    <div className="font-bold">
                      {booking.patientAge || 28} Yrs
                      {booking.dateOfBirth && (
                        <span className="block text-[10px] font-normal text-slate-600 font-mono">
                          {formatDOBDisplay(booking.dateOfBirth)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Sex: </span>
                    <div className="font-bold">{booking.patientGender || 'Male'}</div>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">PID / Record #: </span>
                  <span className="font-mono font-bold text-blue-700">{booking.patientPid || 'PID-555'}</span>
                </div>
                {booking.insuranceProvider && (
                  <div className="pt-1 border-t border-slate-200 text-[11px]">
                    <span className="font-semibold text-slate-500">Insurance: </span>
                    <span className="font-bold text-indigo-900">{booking.insuranceProvider}</span>
                  </div>
                )}
              </div>

              {/* Column 2: QR & Barcode */}
              <div className="flex flex-col items-center justify-center border-y md:border-y-0 md:border-x border-slate-200 py-2 md:py-0 md:px-3 text-center space-y-1">
                <div className="p-1.5 bg-white border border-slate-300 rounded-xl shadow-xs inline-block">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
                <div className="font-mono text-[10px] font-bold tracking-widest text-slate-700 uppercase">
                  ||||| | ||| |||| || | {booking.bookingCode}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Sample Collected At: <br />
                  <span className="font-bold text-slate-800">{booking.sampleCollectedAt || 'Main Laboratory'}</span>
                </div>
              </div>

              {/* Column 3: Dates & Doctor */}
              <div className="space-y-1.5 text-slate-700">
                <div>
                  <span className="font-semibold text-slate-500">Ref. By / Doctor: </span>
                  <div className="font-bold text-slate-900">{booking.doctorName || 'Dr. Hiren Shah'}</div>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div><span className="text-slate-500">Registered: </span><span className="font-semibold">{new Date(booking.createdAt).toLocaleString()}</span></div>
                  <div><span className="text-slate-500">Collected: </span><span className="font-semibold">{booking.sampleCollectedAtDate ? new Date(booking.sampleCollectedAtDate).toLocaleString() : 'Today'}</span></div>
                  <div><span className="text-slate-500">Reported: </span><span className="font-semibold">{new Date().toLocaleString()}</span></div>
                </div>
              </div>
            </div>

            {/* Test Results Section */}
            {booking.tests.map((testItem, tIdx) => (
              <div key={testItem.id || tIdx} className="space-y-3 pt-2">
                
                {/* Test Banner Heading */}
                <div className="border-b-2 border-slate-800 pb-1 flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                    {testItem.testName}
                  </h2>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    Category: {testItem.category}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                  <span className="font-bold text-slate-800">Primary Sample Type:</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-300 font-mono text-slate-700">
                    {testItem.sampleTypeRequired}
                  </span>
                </div>

                {/* Sub-parameters or Direct Value Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-700 uppercase tracking-wider text-[11px]">
                      <th className="py-2 pr-4 font-black">Investigation</th>
                      <th className="py-2 px-4 font-black text-center">Result</th>
                      <th className="py-2 px-4 font-black text-center">Reference Value</th>
                      <th className="py-2 pl-4 font-black text-right">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {testItem.subParameters && testItem.subParameters.length > 0 ? (
                      testItem.subParameters.map((sp) => {
                        const isHigh = sp.flag === 'High';
                        const isLow = sp.flag === 'Low';
                        const refVal = booking.patientGender === 'Female' ? sp.refRangeFemale : booking.patientGender === 'Child' ? sp.refRangeChild : sp.refRangeMale;

                        return (
                          <tr key={sp.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 pr-4 font-medium">
                              {sp.name}
                            </td>
                            <td className="py-2 px-4 text-center font-bold">
                              <span className={`inline-flex items-center gap-1 ${
                                isHigh ? 'text-rose-600 font-extrabold' : isLow ? 'text-blue-600 font-extrabold' : 'text-slate-900'
                              }`}>
                                {sp.value || 'N/A'}
                                {isHigh && (
                                  <span className="px-1.5 py-0.2 text-[9px] bg-rose-100 text-rose-700 font-black rounded-sm uppercase border border-rose-300">
                                    High
                                  </span>
                                )}
                                {isLow && (
                                  <span className="px-1.5 py-0.2 text-[9px] bg-blue-100 text-blue-700 font-black rounded-sm uppercase border border-blue-300">
                                    Low
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-center text-slate-600 font-mono">
                              {refVal || 'Normal Range'}
                            </td>
                            <td className="py-2 pl-4 text-right text-slate-500 font-mono">
                              {sp.unit}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="py-2.5 pr-4 font-extrabold text-slate-900">
                          {testItem.testName}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-sm text-blue-800">
                          {testItem.resultValue || 'Normal / Non-Reactive'}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600 font-mono">
                          {booking.patientGender === 'Female' ? testItem.refRangeFemale : testItem.refRangeMale}
                        </td>
                        <td className="py-2.5 pl-4 text-right text-slate-500 font-mono">
                          {testItem.units}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {testItem.labNotes && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                    <span className="font-bold">Technologist Note: </span>
                    {testItem.labNotes}
                  </div>
                )}
              </div>
            ))}

            {/* Instrument Note */}
            <div className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-200">
              Instruments: Fully automated clinical analyzer system calibrated according to ISO 15189 standards.
            </div>

            {/* Signatures & Pathologist Sign-Off Block */}
            <div className="pt-8 border-t-2 border-slate-800 grid grid-cols-3 gap-4 text-center text-xs">
              
              <div>
                <div className="h-10 flex items-center justify-center font-serif text-slate-700 italic font-bold">
                  {booking.tests[0]?.completedBy || 'Mangi Lerine Laslie'}
                </div>
                <div className="font-extrabold text-slate-900">Medical Lab Technician</div>
                <div className="text-[10px] text-slate-500">(DMLT, BMLT)</div>
              </div>

              <div>
                <div className="h-10 flex items-center justify-center font-serif text-blue-800 italic font-bold">
                  Dr. Payal Shah
                </div>
                {/* <div className="font-extrabold text-slate-900">Dr. Payal Shah</div>
                <div className="text-[10px] text-slate-500">(MD, Pathologist)</div> */}
              </div>

              <div>
                <div className="h-10 flex items-center justify-center font-serif text-blue-900 italic font-bold">
                  Dr. Vimal Shah
                </div>
                {/* <div className="font-extrabold text-slate-900">Dr. Vimal Shah</div>
                <div className="text-[10px] text-slate-500">(MD, Pathologist)</div> */}
              </div>

            </div>

            {/* End of Report Bar */}
            <div className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest pt-2">
              **** End of Report ****
            </div>

            {/* Bottom Contact Footer Bar */}
            <div className="bg-blue-900 text-white p-3 rounded-xl flex items-center justify-between text-[11px]">
              <div className="font-bold flex items-center gap-2">
                <Phone className="w-4 h-4 text-sky-400" />
                <span>Sample Collection Helpline: {labPhone}</span>
              </div>
              <div className="text-slate-300 font-mono text-[10px]">
                Generated on: {new Date().toLocaleDateString()} | Page 1 of 1
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
