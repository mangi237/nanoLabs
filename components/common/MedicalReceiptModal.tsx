// components/common/MedicalReceiptModal.tsx
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
  Receipt as ReceiptIcon
} from 'lucide-react';
import { PatientBooking } from '../../services/limsService';

interface MedicalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PatientBooking | null;
  labInfo?: any;
  paymentDetails?: any;
}

export const MedicalReceiptModal: React.FC<MedicalReceiptModalProps> = ({
  isOpen,
  onClose,
  booking,
  labInfo,
  paymentDetails
}) => {
  if (!isOpen || !booking) return null;

  const labName = labInfo?.name || 'Clinical Diagnostics Center';
  const labSlogan = labInfo?.slogan || labInfo?.tagline || 'Accurate • Precision • Verified Clinical Diagnostics';
  const labAddress = labInfo?.address || labInfo?.location || 'Central Diagnostic Facility';
  const labPhone = labInfo?.phone || labInfo?.contactNumber || '+237 672 638 094';
  const labEmail = labInfo?.email || labInfo?.contactEmail ||  'lab@facility.com';
  const labLicenseNumber = labInfo?.licenseNumber || '';
  const labLogo = labInfo?.logoUrl || labInfo?.avatarUrl || '';

  const handlePrint = () => {
    window.print();
  };

  const receiptNumber = booking.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
  const paidAt = paymentDetails?.paidAt || booking.paidAt || new Date().toISOString();
  const paidDate = new Date(paidAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const paidTime = new Date(paidAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const paymentMethod = paymentDetails?.paymentMethod || booking.paymentMethod || 'Cash';
  const cashierName = paymentDetails?.cashierName || booking.paymentProcessedBy || 'Authorized Cashier';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 my-auto max-h-[96vh] flex flex-col">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <ReceiptIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                Official Payment Receipt
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Paid & Verified
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Receipt #{receiptNumber} • Booking: {booking.bookingCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
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

        {/* Printable Receipt */}
        <div className="overflow-y-auto flex-1 p-1 sm:p-4 bg-slate-100 my-2 rounded-2xl print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div id="receipt-content" className="bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 max-w-3xl mx-auto font-sans text-slate-900 print:shadow-none print:border-none print:max-w-none print:p-8 space-y-4">
            
            {/* Header */}
            <div className="border-b-2 border-slate-300 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {labLogo ? (
                    <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                      <img src={labLogo} alt={labName} referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-500 text-white font-black flex items-center justify-center shadow-md border-2 border-white shrink-0">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{labName}</h1>
                    <div className="text-xs font-bold text-emerald-700 tracking-wide">{labSlogan}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{labAddress}</div>
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div className="font-black text-emerald-800 text-sm">RECEIPT</div>
                  <div className="font-mono text-slate-600">#{receiptNumber}</div>
                  <div className="text-slate-500">{paidDate} at {paidTime}</div>
                </div>
              </div>
            </div>

            {/* Patient & Payment Info */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4">
              <div>
                <div className="text-slate-500 font-semibold">Patient Information</div>
                <div className="font-bold text-slate-900">{booking.patientName}</div>
                <div className="text-slate-600">PID: {booking.patientPid || booking.patientId}</div>
                {booking.patientPhone && <div className="text-slate-600">{booking.patientPhone}</div>}
              </div>
              <div className="text-right">
                <div className="text-slate-500 font-semibold">Payment Details</div>
                <div className="font-bold text-emerald-700">{paymentMethod.toUpperCase()}</div>
                <div className="text-slate-600">Cashier: {cashierName}</div>
                {paymentDetails?.insuranceProvider && (
                  <div className="text-slate-600">Insurance: {paymentDetails.insuranceProvider}</div>
                )}
              </div>
            </div>

            {/* Itemized Tests */}
            <div>
              <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Itemized Diagnostic Tests</div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="py-2 px-3 font-black">#</th>
                    <th className="py-2 px-3 font-black">Test Name</th>
                    <th className="py-2 px-3 font-black text-right">Price (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {booking.tests?.map((test, idx) => (
                    <tr key={test.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{test.testName}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                        {(test.price || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-bold">
                    <td colSpan={2} className="py-3 px-3 text-right text-slate-700">Subtotal:</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800">
                      {(booking.totalAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                  {paymentDetails?.discountAmount && paymentDetails.discountAmount > 0 && (
                    <tr className="text-emerald-700 font-bold">
                      <td colSpan={2} className="py-1 px-3 text-right">Discount Applied:</td>
                      <td className="py-1 px-3 text-right font-mono">-{paymentDetails.discountAmount.toLocaleString()}</td>
                    </tr>
                  )}
                  {paymentDetails?.insuranceCoveragePercent && paymentDetails.insuranceCoveragePercent > 0 && (
                    <tr className="text-blue-700 font-bold">
                      <td colSpan={2} className="py-1 px-3 text-right">Insurance Coverage ({paymentDetails.insuranceCoveragePercent}%):</td>
                      <td className="py-1 px-3 text-right font-mono">-{Math.round((booking.totalAmount || 0) * (paymentDetails.insuranceCoveragePercent / 100)).toLocaleString()}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-slate-400 text-base font-black">
                    <td colSpan={2} className="py-3 px-3 text-right text-slate-900">Total Paid:</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700">
                      {(paymentDetails?.actualPaidAmount || booking.totalAmount || 0).toLocaleString()} FCFA
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-emerald-800">Payment Confirmed & Verified</span>
              </div>
              <div className="text-slate-500 font-mono">
                Status: <span className="font-bold text-emerald-700">PAID</span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between text-[10px] text-slate-500 border border-slate-200">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{labPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lic: {labLicenseNumber || 'A-2024-001'}</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                Generated: {new Date().toLocaleString()}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default MedicalReceiptModal;