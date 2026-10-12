import React from 'react';
import { ArrowLeft, Check, CheckCircle2, Clock, Smartphone, FileText, ArrowRight } from 'lucide-react';

interface LabAcceptedScreenProps {
  booking: any;
  onBack: () => void;
  onViewInvoice: () => void;
  onTrackPhlebotomist?: () => void;
}

export const LabAcceptedScreen: React.FC<LabAcceptedScreenProps> = ({
  booking,
  onBack,
  onViewInvoice,
  onTrackPhlebotomist
}) => {
  const steps = [
    { title: 'Request submitted', time: '10:23 AM', status: 'completed' },
    { title: 'Lab accepted', time: '10:28 AM', status: 'completed' },
    { title: 'Invoice issued', time: 'Pending', status: 'pending' },
    { title: 'Payment submitted', time: 'Pending', status: 'pending' },
    { title: 'Cashier verification', time: 'Pending', status: 'pending' },
    { title: 'Booking confirmed', time: 'Pending', status: 'pending' }
  ];

  return (
    <div className="max-w-md mx-auto py-3 px-4 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Lab accepted
        </h1>
      </div>

      {/* Hero Visual Icon */}
      <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-[#E0F2F1] border-4 border-[#80CBC4] flex items-center justify-center text-[#006978] shadow-md relative">
          <Smartphone className="w-9 h-9" />
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center absolute -bottom-1 -right-1 shadow-sm">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        <h2 className="text-lg font-black text-slate-900 max-w-xs">
          Your booking has been accepted by the lab.
        </h2>
        <p className="text-xs text-slate-500 font-mono">
          Booking ID: {booking?.bookingCode || 'BK-884210'}
        </p>
      </div>

      {/* Verified Milestones Timeline */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {steps.map((step, idx) => {
          const isDone = step.status === 'completed';
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isDone ? 'bg-[#006978] text-white' : 'border-2 border-slate-300 bg-white'
                }`}>
                  {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-0.5 h-6 my-1 ${isDone ? 'bg-[#006978]' : 'bg-slate-200'}`} />
                )}
              </div>

              <div className="flex-1 flex items-center justify-between text-xs">
                <span className={`font-bold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.title}
                </span>
                <span className={`font-mono text-[11px] ${isDone ? 'text-[#006978] font-bold' : 'text-slate-400'}`}>
                  {step.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="pt-2 space-y-2.5">
        <button
          onClick={onViewInvoice}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>View Invoice & Payment</span>
        </button>

        {onTrackPhlebotomist && (
          <button
            onClick={onTrackPhlebotomist}
            className="w-full py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#006978] font-bold text-xs rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Live Phlebotomist Tracking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
