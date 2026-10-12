import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  ShieldCheck, 
  FileCheck, 
  ArrowRight,
  Share2,
  Truck,
  Building2,
  FileText,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

interface AuditTimelineScreenProps {
  onBack: () => void;
  onViewResults: () => void;
  onShareWithDoctor?: () => void;
  onRequestHomeDelivery?: () => void;
  labName?: string;
  bookingCode?: string;
}

export const AuditTimelineScreen: React.FC<AuditTimelineScreenProps> = ({
  onBack,
  onViewResults,
  onShareWithDoctor,
  onRequestHomeDelivery,
  labName = 'BioSanté Lab',
  bookingCode = 'BK-991204'
}) => {
  const [stages, setStages] = useState([
    {
      title: 'Specimen Received & Barcoded',
      time: '10:54 AM',
      operator: 'Pierre Ndongo',
      role: 'Intake Laboratory Technician',
      details: 'Barcode #NS-884920 scanned & assigned to specimen vial (Whole Blood EDTA)',
      status: 'completed'
    },
    {
      title: 'Analyzer Processing & Biomarker Calibration',
      time: '11:20 AM',
      operator: 'Alice Mengue',
      role: 'Automated Analyzer Specialist',
      details: 'Sysmex XN-550 5-part hematology differential analyzer run completed without flags',
      status: 'completed'
    },
    {
      title: 'Biologist Medical Validation & Delta Check',
      time: '01:45 PM',
      operator: 'Dr. Eric Tagne',
      role: 'Medical Biologist (ONMC #2401)',
      details: 'Delta check verified against historical biological reference intervals',
      status: 'completed'
    },
    {
      title: 'Quality Seal & Release',
      time: '03:10 PM',
      operator: 'Chief Biologist',
      role: 'Laboratory Director',
      details: 'Cryptographic SHA-256 digital signature seal affixed to diagnostic dossier',
      status: 'completed'
    }
  ]);

  const [deliveryRequested, setDeliveryRequested] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
    if (onShareWithDoctor) onShareWithDoctor();
  };

  const handleDelivery = () => {
    setDeliveryRequested(true);
    if (onRequestHomeDelivery) onRequestHomeDelivery();
  };

  return (
    <div className="max-w-2xl mx-auto py-3 px-2 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Live In-Laboratory Progression Audit
          </h1>
          <p className="text-[11px] text-slate-500">
            {labName} &bull; Booking Code: <strong className="font-mono">{bookingCode}</strong>
          </p>
        </div>
      </div>

      {/* Notice Banner: GPS stopped, In-Lab Audit Active */}
      <div className="p-4 bg-[#E0F2F1] rounded-3xl border border-[#80CBC4] flex items-start gap-3 text-xs text-[#006978]">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="block">Specimen Safely Delivered Inside Laboratory</strong>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Live GPS transit has ended. You are now tracking live bench processing, delta checks, and staff validation audit events inside the accredited laboratory.
          </p>
        </div>
      </div>

      {/* 4-Stage In-Lab Audit Trail */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Certified Chain-of-Custody Timeline
          </h3>
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
            All Stages Verified
          </span>
        </div>

        <div className="space-y-6">
          {stages.map((stage, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-[#006978] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                {idx < stages.length - 1 && (
                  <div className="w-0.5 h-12 my-1 bg-[#006978]" />
                )}
              </div>

              <div className="flex-1 pt-0.5 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="font-extrabold text-sm text-slate-900">{stage.title}</h4>
                  <span className="font-mono text-xs text-[#006978] font-bold">{stage.time}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-[#006978]" />
                  <span>{stage.operator} &bull; <em className="not-italic text-slate-400 font-normal">{stage.role}</em></span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                  {stage.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Notification If Shared */}
      {shareSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs font-bold text-center">
          Diagnostic results shared with your connected physician via ONMC secure channel!
        </div>
      )}

      {/* Action Buttons: Results, Doctor Share, Home Delivery */}
      <div className="space-y-2.5 pt-1">
        <button
          onClick={onViewResults}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <FileCheck className="w-4 h-4" />
          <span>View Verified Biological Results</span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={handleShare}
            className="py-3 bg-white hover:bg-slate-50 border border-slate-200 text-[#006978] font-bold text-xs rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Share with Doctor</span>
          </button>

          <button
            onClick={handleDelivery}
            disabled={deliveryRequested}
            className={`py-3 border text-xs font-bold rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${
              deliveryRequested
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{deliveryRequested ? 'Home Delivery Requested' : 'Request Home Delivery (Paper Report)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
