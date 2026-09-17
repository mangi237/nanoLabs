import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  CreditCard, 
  ChevronRight, 
  FileText, 
  ShieldCheck, 
  Activity, 
  Building2, 
  UserCheck, 
  ArrowRight,
  Eye,
  Receipt
} from 'lucide-react';
import { formatXAF } from '../../shared/money';

export interface AuditTimelineItem {
  time: string;
  action: string;
  actor: string;
  category: 'RECEPTION' | 'CASHIER' | 'PHLEB' | 'LAB' | 'AUDIT';
  note?: string;
}

export interface ScheduleCardRecord {
  id: string;
  reservationCode: string;
  dateBadge: string; // e.g. "JUN 22"
  timeRange: string; // e.g. "10:00 - 11:00 AM"
  treatmentName: string;
  treatmentType: 'SINGLE' | 'MULTIPLE';
  facilityName: string;
  status: 'Upcoming' | 'Finished';
  totalPayment: number;
  isPaid: boolean;
  auditRoadmap: AuditTimelineItem[];
}

interface LiveAuditRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBooking?: (code: string) => void;
  onPayNow?: (item: ScheduleCardRecord) => void;
}

export const LiveAuditRoadmapModal: React.FC<LiveAuditRoadmapModalProps> = ({
  isOpen,
  onClose,
  onSelectBooking,
  onPayNow
}) => {
  const [selectedRecord, setSelectedRecord] = useState<ScheduleCardRecord | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'reservation' | 'bill'>('reservation');

  if (!isOpen) return null;

  const upcomingItems: ScheduleCardRecord[] = [
    {
      id: 'rsv-1',
      reservationCode: 'RSV10102',
      dateBadge: 'JUN 22',
      timeRange: '10:00 - 11:00 AM',
      treatmentName: 'Comprehensive Metabolic Panel (NFS & Ionogramme)',
      treatmentType: 'MULTIPLE',
      facilityName: 'Centre Médical Laquintinie & nanoLabs Hub',
      status: 'Upcoming',
      totalPayment: 32000,
      isPaid: false,
      auditRoadmap: [
        { time: '10:05 AM', action: 'Receptionist Verified Order', actor: 'Marie N. (Intake Desk)', category: 'RECEPTION' },
        { time: '10:08 AM', action: 'Cashier Validated Payment Order', actor: 'Alain K. (Billing)', category: 'CASHIER' },
        { time: '10:15 AM', action: 'Phlebotomist En Route with Cold Box', actor: 'Eric M. (Phlebotomy Dispatch)', category: 'PHLEB' },
        { time: '10:18 AM', action: 'Phlebotomist accessed profile data', actor: 'Mobile GPS Client', category: 'AUDIT', note: 'Authorized under Digital Health Privacy Protocol' }
      ]
    },
    {
      id: 'rsv-2',
      reservationCode: 'RSV10103',
      dateBadge: 'JUN 25',
      timeRange: '14:00 - 15:00 PM',
      treatmentName: 'Hepatic Function & Bilirubin Profile',
      treatmentType: 'SINGLE',
      facilityName: 'nanoLabs Central Diagnostic Facility',
      status: 'Upcoming',
      totalPayment: 18500,
      isPaid: true,
      auditRoadmap: [
        { time: '09:00 AM', action: 'Order Created via Patient Portal', actor: 'Self-Service Mobile', category: 'RECEPTION' },
        { time: '09:12 AM', action: 'Yebo KYC Verification Succeeded', actor: 'Yebo Level-3 OTP', category: 'AUDIT' }
      ]
    }
  ];

  const finishedItems: ScheduleCardRecord[] = [
    {
      id: 'rsv-3',
      reservationCode: 'RSV10101',
      dateBadge: 'JUN 20',
      timeRange: '09:00 - 10:00 AM',
      treatmentName: 'Lipid Panel & Fasting Glycemia',
      treatmentType: 'MULTIPLE',
      facilityName: 'Hôpital Général de Douala',
      status: 'Finished',
      totalPayment: 24000,
      isPaid: true,
      auditRoadmap: [
        { time: '09:00 AM', action: 'Specimen Checked Into Laboratory', actor: 'Intake Reception', category: 'RECEPTION' },
        { time: '09:30 AM', action: 'Biochemical Analyzer Run Completed', actor: 'Cobas e411 Auto-analyzer', category: 'LAB' },
        { time: '09:55 AM', action: 'Biologist Signed Official A4 Report', actor: 'Dr. E. Fotso (Clinical Biologist)', category: 'LAB' }
      ]
    },
    {
      id: 'rsv-4',
      reservationCode: 'RSV10094',
      dateBadge: 'JUN 19',
      timeRange: '17:00 - 18:00 PM',
      treatmentName: 'Urgent Malaria Smear & Blood Grouping',
      treatmentType: 'SINGLE',
      facilityName: 'Clinique de l’Aéroport',
      status: 'Finished',
      totalPayment: 14500,
      isPaid: true,
      auditRoadmap: [
        { time: '17:05 PM', action: 'Emergency Sample Drawn', actor: 'Phlebotomy Room 2', category: 'PHLEB' },
        { time: '17:40 PM', action: 'Validated Diagnostic Slip Dispatched', actor: 'Biologist On-Call', category: 'LAB' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header from auditingandtrackingstatus.webp */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Diagnostic Schedule & Live Audit Roadmap
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Track upcoming sample collections, completed testing & immutable audit events
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1 text-slate-900">
          {/* UPCOMING SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Upcoming ({upcomingItems.length})
              </h3>
            </div>

            <div className="space-y-3">
              {upcomingItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedRecord(item)}
                  className="flex items-stretch gap-3 cursor-pointer group"
                >
                  {/* Vertical Timeline Date Badge (from auditingandtrackingstatus.webp) */}
                  <div className="w-16 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-700 flex flex-col items-center justify-center p-2 text-center transition-colors shrink-0 border border-blue-200/60">
                    <span className="text-[10px] font-bold uppercase">{item.dateBadge.split(' ')[0]}</span>
                    <span className="text-base font-black leading-none mt-0.5">{item.dateBadge.split(' ')[1]}</span>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 p-3.5 bg-slate-50 group-hover:bg-white rounded-2xl border border-slate-200 group-hover:border-blue-400 group-hover:shadow-md transition-all space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.timeRange}</span>
                      </span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        #{item.reservationCode}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.treatmentName}</h4>
                      <p className="text-[11px] text-slate-500">{item.facilityName}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/60 text-slate-700">
                        {item.treatmentType}
                      </span>
                      <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                        <span>View Audit Roadmap</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FINISHED SECTION */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Finished ({finishedItems.length})
              </h3>
            </div>

            <div className="space-y-3">
              {finishedItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedRecord(item)}
                  className="flex items-stretch gap-3 cursor-pointer group"
                >
                  {/* Vertical Timeline Date Badge */}
                  <div className="w-16 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-700 flex flex-col items-center justify-center p-2 text-center transition-colors shrink-0 border border-emerald-200/60">
                    <span className="text-[10px] font-bold uppercase">{item.dateBadge.split(' ')[0]}</span>
                    <span className="text-base font-black leading-none mt-0.5">{item.dateBadge.split(' ')[1]}</span>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 p-3.5 bg-slate-50 group-hover:bg-white rounded-2xl border border-slate-200 group-hover:border-emerald-400 group-hover:shadow-md transition-all space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.timeRange}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        #{item.reservationCode}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.treatmentName}</h4>
                      <p className="text-[11px] text-slate-500">{item.facilityName}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/60 text-slate-700">
                          {item.treatmentType}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatXAF(item.totalPayment)}
                        </span>
                      </div>

                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Paid &bull; View Certificate</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail & Roadmap Modal when an item is selected */}
      {selectedRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] p-5 space-y-4 border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600">#{selectedRecord.reservationCode}</span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedRecord.treatmentName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs: Reservation detail & Bill detail */}
            <div className="flex border-b border-slate-100 gap-4 text-xs font-bold">
              <button
                onClick={() => setActiveDetailTab('reservation')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  activeDetailTab === 'reservation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                }`}
              >
                Reservation & Live Audit
              </button>
              <button
                onClick={() => setActiveDetailTab('bill')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  activeDetailTab === 'bill' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                }`}
              >
                Bill detail
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1 text-xs">
              {activeDetailTab === 'reservation' ? (
                <>
                  {/* Facility Card */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Laboratory</span>
                    <p className="font-bold text-slate-900">{selectedRecord.facilityName}</p>
                    <p className="text-[11px] text-slate-500">Slot: {selectedRecord.timeRange}</p>
                  </div>

                  {/* Live Audit Roadmap (PRD Section 4 Step 4) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>Live Audit Roadmap</span>
                    </h4>

                    <div className="space-y-2 pl-2 border-l-2 border-blue-200 ml-2">
                      {selectedRecord.auditRoadmap.map((step, idx) => (
                        <div key={idx} className="relative pl-4 space-y-0.5">
                          <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              {step.time}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {step.action}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{step.actor}</p>
                          {step.note && (
                            <p className="text-[10px] text-teal-700 italic bg-teal-50 p-1.5 rounded-lg mt-1">
                              {step.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Bill detail */
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Tests Subtotal</span>
                    <span className="font-mono font-bold text-slate-900">{formatXAF(selectedRecord.totalPayment)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>5% nanoLabs Platform Fee</span>
                    <span className="font-mono font-bold text-teal-700">+{formatXAF(Math.round(selectedRecord.totalPayment * 0.05))}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-bold">
                    <span className="text-slate-900">Total Bill</span>
                    <span className="font-mono text-blue-700 text-sm">
                      {formatXAF(Math.round(selectedRecord.totalPayment * 1.05))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAuditRoadmapModal;
