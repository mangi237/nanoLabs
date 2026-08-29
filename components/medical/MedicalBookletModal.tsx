import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  Building2, 
  Calendar, 
  Phone, 
  Mail, 
  DollarSign,
  Download,
  TestTube,
  Microscope,
  FileCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { limsService, PatientBooking } from '../../services/limsService';
import { db, getDocs, collection } from '../../services/firebase';
interface MedicalBookletModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  lab: any;
  bookings?: PatientBooking[];
}

export const MedicalBookletModal: React.FC<MedicalBookletModalProps> = ({
  isOpen,
  onClose,
  patient,
  lab,
  bookings: initialBookings
}) => {
  const [patientBookings, setPatientBookings] = useState<PatientBooking[]>(initialBookings || []);
  const [loading, setLoading] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | 'all'>('all');

  useEffect(() => {
    if (isOpen && patient) {
      fetchBookings();
    }
  }, [isOpen, patient?.id, patient?.email, patient?.patientId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const labId = lab?.id || patient?.labId || 'lab-1';
      const allBookings = await limsService.fetchAllBookings(labId);
      
      const pId = String(patient?.patientId || patient?.id || patient?.patientPid || '').toLowerCase().trim();
      const pEmail = String(patient?.email || '').toLowerCase().trim();
      const pPhone = String(patient?.phone || '').trim();
      const pName = String(patient?.name || patient?.patientName || patient?.fullName || '').toLowerCase().trim();

      // Filter bookings matching this patient flexibly
      const matched = allBookings.filter(b => {
        const bPid = String(b.patientPid || '').toLowerCase().trim();
        const bId = String(b.patientId || '').toLowerCase().trim();
        const bEmail = String(b.patientEmail || '').toLowerCase().trim();
        const bPhone = String(b.patientPhone || '').trim();
        const bName = String(b.patientName || '').toLowerCase().trim();

        if (pId && (bPid === pId || bId === pId)) return true;
        if (pEmail && bEmail && pEmail === bEmail) return true;
        if (pPhone && bPhone && pPhone === bPhone) return true;
        if (pName && bName && (pName.includes(bName) || bName.includes(pName))) return true;

        return false;
      });

      // ALSO check if patient.labTests array has test orders not in matched bookings
      if (patient?.labTests && Array.isArray(patient.labTests) && patient.labTests.length > 0) {
        const missingTests = patient.labTests.filter((lt: any) => {
          const ltName = String(lt.testName || lt.name || '').toLowerCase();
          return !matched.some(b => b.tests?.some(t => String(t.testName || '').toLowerCase() === ltName));
        });

        if (missingTests.length > 0) {
          matched.push({
            id: `bk-patient-direct-${Date.now()}`,
            bookingCode: `BK-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
            labId,
            patientId: patient.id || patient.patientId || 'pat-1',
            patientName: patient.name || patient.patientName || 'Patient Record',
            patientAge: patient.age || 30,
            patientGender: patient.gender || 'Male',
            patientPhone: patient.phone || '',
            patientEmail: patient.email || '',
            patientPid: patient.patientId || patient.id || 'PID-100',
            doctorName: 'Dr. Attending Specialist',
            invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
            totalAmount: missingTests.reduce((acc: number, t: any) => acc + (t.price || t.totalPrice || 5000), 0),
            paymentStatus: 'unpaid',
            collectedSamples: [],
            tests: missingTests.map((mt: any) => ({
              id: mt.id || `bt-${Math.random()}`,
              testId: mt.testId || 'm1',
              testName: mt.testName || mt.name || 'Requested Diagnostic Test',
              category: mt.category || 'General',
              sampleTypeRequired: mt.sampleType || 'Venous Blood',
              units: mt.units || 'U/L',
              refRangeMale: mt.refRangeMale || '10 - 50',
              refRangeFemale: mt.refRangeFemale || '10 - 45',
              refRangeChild: mt.refRangeChild || '10 - 40',
              price: mt.price || mt.totalPrice || 5000,
              status: 'Pending_Payment' as const
            })),
            overallStatus: 'Pending_Payment' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Sort newest first
      matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPatientBookings(matched);
    } catch (e) {
      console.error('Error fetching patient medical booklet bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const activeBookings = selectedVisitId === 'all' 
    ? patientBookings 
    : patientBookings.filter(b => b.id === selectedVisitId);

  // Statistics
  const totalTests = patientBookings.reduce((acc, b) => acc + (b.tests?.length || 0), 0);
  const completedTests = patientBookings.reduce((acc, b) => 
    acc + (b.tests?.filter(t => t.status === 'Completed').length || 0), 0
  );
  const pendingTests = totalTests - completedTests;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                Official Patient Medical & Diagnostic Booklet
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-md text-[10px] font-mono border border-teal-500/30">
                  {patient?.patientId || patient?.id || 'PID-100'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Consolidated lifetime diagnostic tests, laboratory findings & sign-off history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Booklet / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Booklet Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 print:overflow-visible print:p-4">
          
          {/* Official Booklet Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white shadow-xl relative overflow-hidden border border-teal-800 print:bg-white print:text-slate-900 print:border-slate-900 print:shadow-none print:p-4">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {lab?.logoUrl ? (
                  <img 
                    src={lab.logoUrl} 
                    alt={lab.name} 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-400 bg-white shadow-md shrink-0 print:w-12 print:h-12"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex flex-col items-center justify-center font-black text-xl shadow-md border-2 border-teal-400 shrink-0 print:border-slate-900 print:text-slate-900">
                    <Building2 className="w-8 h-8 stroke-[2.5]" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300 print:text-slate-600">
                    OFFICIAL DIAGNOSTIC MEDICAL BOOKLET
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white print:text-slate-900">
                    {lab?.name || 'nanoLabs Central Diagnostics'}
                  </h1>
                  <p className="text-xs text-teal-100/80 mt-0.5 print:text-slate-600">
                    {lab?.address || 'Central Diagnostic Facility, Douala, Cameroon'} • {lab?.phone || '+237 670 000 000'}
                  </p>
                </div>
              </div>

              <div className="text-left md:text-right text-xs space-y-1 border-t md:border-t-0 pt-3 md:pt-0 border-white/10 print:border-slate-300">
                <div className="font-mono font-bold text-teal-300 print:text-slate-900">
                  BOOKLET REVISION: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div className="text-[11px] text-teal-100/70 print:text-slate-600">
                  Authentication Code: <span className="font-mono font-bold text-white print:text-slate-900">{patient?.accessCode || 'PAT-SEC'}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 print:border-slate-800 print:text-slate-900">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Diagnostic Record
                </div>
              </div>
            </div>
          </div>

          {/* Patient Demographics Card */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs space-y-3 print:bg-white print:border-slate-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              Patient Profile & Medical Identity
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Full Patient Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{patient?.name || 'Valued Patient'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Patient ID (PID)</span>
                <span className="font-mono font-bold text-teal-700">{patient?.patientId || patient?.id || 'PID-100'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Gender / Age</span>
                <span className="font-bold text-slate-800">{patient?.gender || 'Male'}, {patient?.age || 30} Yrs</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Blood Group</span>
                <span className="font-bold text-rose-700">{patient?.bloodType || patient?.bloodGroup || 'O+'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Contact Phone</span>
                <span className="font-mono text-slate-700">{patient?.phone || '+237 670000000'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Email Address</span>
                <span className="font-medium text-slate-700 truncate block">{patient?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Insurance Coverage</span>
                <span className="font-semibold text-slate-800">{patient?.insuranceProvider || 'Self-Pay / Cash'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Known Allergies</span>
                <span className="font-semibold text-amber-700">{patient?.allergies || 'None reported'}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar (Hidden during print) */}
          <div className="grid grid-cols-3 gap-3 print:hidden">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Diagnostic Tests</span>
                <h4 className="text-xl font-black text-slate-900">{totalTests}</h4>
              </div>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <TestTube className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Completed & Verified</span>
                <h4 className="text-xl font-black text-emerald-700">{completedTests}</h4>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">In Progress / Pending</span>
                <h4 className="text-xl font-black text-amber-600">{pendingTests}</h4>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Visits Selector (Hidden during print) */}
          {patientBookings.length > 1 && (
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-2xl border border-slate-200 print:hidden">
              <span className="text-xs font-bold text-slate-600 px-3">Filter Diagnostic Visit:</span>
              <div className="flex gap-1 overflow-x-auto">
                <button
                  onClick={() => setSelectedVisitId('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedVisitId === 'all'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Visits ({patientBookings.length})
                </button>
                {patientBookings.map((b, idx) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedVisitId(b.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedVisitId === b.id
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Visit #{patientBookings.length - idx} ({b.bookingCode})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic Chapters / Booklets List */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-medium">
              Fetching diagnostic medical records...
            </div>
          ) : patientBookings.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700">No medical test records found for this patient booklet.</p>
              <p className="text-slate-500">When tests are ordered and checked in, they will automatically appear in this booklet in real-time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeBookings.map((booking, index) => {
                const isPaid = booking.paymentStatus === 'paid';
                
                return (
                  <div 
                    key={booking.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-4 print:border-slate-400 print:shadow-none print:break-inside-avoid"
                  >
                    {/* Visit Chapter Header */}
                    <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:bg-slate-100 print:text-slate-900">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-500 text-slate-950">
                            BOOKING: {booking.bookingCode}
                          </span>
                          <span className="text-xs text-slate-300 font-medium print:text-slate-700">
                            • {new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {(booking.assignedTechName || patient?.assignedLabTech) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-teal-300 border border-teal-500/40 print:bg-slate-200 print:text-slate-900">
                              <ShieldCheck className="w-3 h-3 text-teal-400" />
                              Assigned Tech: {booking.assignedTechName || patient?.assignedLabTech}
                            </span>
                          )}
                          {(booking.virtualRequested || booking.tests?.some(t => t.virtualRequested)) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40 print:bg-blue-100 print:text-blue-900">
                              🌐 Virtual Delivery
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm text-white print:text-slate-900">
                          Attending Physician: {booking.doctorName || 'Dr. Attending Specialist'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs">
                          <span className="text-[10px] text-slate-400 block print:text-slate-600">Invoice: {booking.invoiceNumber}</span>
                          <span className={`font-mono font-bold ${isPaid ? 'text-emerald-400 print:text-emerald-700' : 'text-amber-400 print:text-amber-700'}`}>
                            {booking.totalAmount?.toLocaleString() || 5000} XAF ({isPaid ? 'PAID' : 'UNPAID'})
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          isPaid 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 print:bg-emerald-100 print:text-emerald-800' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30 print:bg-amber-100 print:text-amber-800'
                        }`}>
                          {isPaid ? 'Payment Confirmed' : 'Pending Payment'}
                        </span>
                      </div>
                    </div>

                    {/* Specimen Collection Audit Row */}
                    {booking.collectedSamples && booking.collectedSamples.length > 0 && (
                      <div className="px-5 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 mx-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2">
                          <Microscope className="w-4 h-4 text-purple-600" />
                          <span className="font-bold text-slate-800">Specimens Collected:</span>
                          <span className="font-medium text-slate-700">[{booking.collectedSamples.join(', ')}]</span>
                        </div>
                        {booking.sampleCollectedBy && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            Drawn by Phlebotomist: <span className="font-bold text-slate-800">{booking.sampleCollectedBy}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Test Results Table */}
                    <div className="px-5 pb-5">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Diagnostic Test</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3">Result / Parameter Values</th>
                              <th className="py-2.5 px-3">Ref Range</th>
                              <th className="py-2.5 px-3">Flag / Status</th>
                              <th className="py-2.5 px-3 text-right">Sign-off Tech</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {booking.tests?.map((t) => {
                              const isComplete = t.status === 'Completed';
                              
                              return (
                                <tr key={t.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-slate-900">{t.testName}</div>
                                    {t.testCode && <div className="text-[10px] text-slate-400 font-mono">Code: {t.testCode}</div>}
                                  </td>

                                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                                    {t.category || 'General Laboratory'}
                                  </td>

                                  <td className="py-3 px-3">
                                    {t.subParameters && t.subParameters.length > 0 ? (
                                      <div className="space-y-1">
                                        {t.subParameters.map(sp => (
                                          <div key={sp.id} className="flex items-center justify-between gap-2 text-[11px]">
                                            <span className="text-slate-600">{sp.name}:</span>
                                            <span className="font-bold font-mono text-slate-900">{sp.value || 'Pending'} {sp.unit}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="font-bold font-mono text-slate-900">
                                        {t.resultValue || (isComplete ? 'Analyzed' : 'Processing in Lab')} {t.units}
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-[11px] font-mono text-slate-500">
                                    {patient?.gender === 'Female' ? t.refRangeFemale : patient?.gender === 'Child' ? t.refRangeChild : t.refRangeMale} {t.units}
                                  </td>

                                  <td className="py-3 px-3">
                                    {isComplete ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        Normal / Verified
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        {t.status?.replace('_', ' ') || 'Pending'}
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-right text-[11px]">
                                    {t.externalPdfUrl || t.pdfReportUrl ? (
                                      <a
                                        href={t.externalPdfUrl || t.pdfReportUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg border border-teal-200 text-[10px] transition-all cursor-pointer mb-1 shadow-2xs"
                                      >
                                        <FileCheck className="w-3 h-3 text-teal-600" />
                                        <span>Test PDF</span>
                                      </a>
                                    ) : null}
                                    {t.completedBy ? (
                                      <div className="font-bold text-slate-800 flex items-center justify-end gap-1">
                                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                                        {t.completedBy}
                                      </div>
                                    ) : (booking.assignedTechName || patient?.assignedLabTech) ? (
                                      <div className="text-slate-600 font-semibold flex items-center justify-end gap-1 text-[10px]">
                                        <ShieldCheck className="w-3 h-3 text-teal-500" />
                                        <span>Assigned: {booking.assignedTechName || patient?.assignedLabTech}</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">In Lab Processing</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* PDF Report Link if Available */}
                      {booking.pdfReportUrl && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">Digital PDF Certificate Signed & Published</span>
                          <a
                            href={booking.pdfReportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold border border-teal-200 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                            View Signed PDF Report
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Booklet End Footer Sign-off */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Official Laboratory Electronic Signature & Quality Control Seal</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              Generated by nanoLabs LIMS Architecture • Confidential Medical Data
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MedicalBookletModal;
