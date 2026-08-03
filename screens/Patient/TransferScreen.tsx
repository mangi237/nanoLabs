import React, { useState } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { ArrowRightLeft, Building2, Send, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

interface TransferScreenProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const TransferScreen: React.FC<TransferScreenProps> = ({
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  const { lab } = useAuth();
  const [targetLab, setTargetLab] = useState('nanoLabs BioTech Center');
  const [reason, setReason] = useState('Specialist Consultation Transfer');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Transfer Medical Records"
        subtitle="Securely transfer diagnostic history to another health center"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </button>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Lab Record Transfer</h2>
              <p className="text-xs text-slate-500">Initiate authorized inter-hospital record dispatch</p>
            </div>
          </div>

          {sent ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-emerald-900">Transfer Request Dispatched</h3>
              <p className="text-xs text-emerald-700">
                Your lab test records have been securely queued for transfer to {targetLab}.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
              >
                Initiate Another Transfer
              </button>
            </div>
          ) : (
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Laboratory</label>
                <input
                  type="text"
                  disabled
                  value={lab?.name || 'nanoLabs Central Diagnostics'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Laboratory / Hospital</label>
                <select
                  value={targetLab}
                  onChange={e => setTargetLab(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="nanoLabs BioTech Center">nanoLabs BioTech Center - Douala</option>
                  <option value="nanoLabs Regional Research Lab">nanoLabs Regional Research Lab - Bamenda</option>
                  <option value="Central Hospital Yaounde">Central Hospital Yaounde</option>
                  <option value="General Hospital Douala">General Hospital Douala</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Transfer</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Transfer...
                  </>
                ) : (
                  <>
                    Authorize & Send Records
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default TransferScreen;
