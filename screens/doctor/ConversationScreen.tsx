import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Lock,
  FlaskConical,
  Pill,
  Calendar,
  FileCheck2,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useNav } from '../../components/doctor/nav';
import { SubScreenHeader } from '../../components/doctor/ui';
import {
  doctorPatientFirestoreService,
  DecryptedClinicalMessage,
} from '../../services/doctorPatientFirestoreService';

interface ConversationScreenProps {
  patientId: string;
  patientName: string;
  patientAlias?: string;
  patientPid?: string;
  patientPhone?: string;
}

export const ConversationScreen: React.FC<ConversationScreenProps> = ({
  patientId,
  patientName,
  patientAlias,
  patientPid,
  patientPhone,
}) => {
  const { user } = useAuth();
  const { pop, push, dossiers } = useNav();

  const [messages, setMessages] = useState<DecryptedClinicalMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const doctorId = user?.id || '';
  const doctorName = user?.name || 'Dr. Physician';

  useEffect(() => {
    if (!doctorId || !patientId) return;
    const unsub = doctorPatientFirestoreService.subscribeConversationMessages(
      doctorId,
      patientId,
      'doctor',
      (list) => {
        setMessages(list);
      }
    );
    return () => unsub();
  }, [doctorId, patientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean || !doctorId || sending) return;
    setSendError(null);
    setSending(true);
    setDraft('');
    try {
      await doctorPatientFirestoreService.sendEncryptedMessage({
        doctorId,
        doctorName,
        patientId,
        patientPid,
        patientName,
        patientAlias,
        senderRole: 'doctor',
        type: 'text',
        text: clean,
      });
    } catch (err: any) {
      console.error('Failed to deliver encrypted message to patient:', err);
      setDraft(clean);
      setSendError(err?.message || 'Failed to deliver message. Please retry.');
    } finally {
      setSending(false);
    }
  };

  const openSharedDossier = (msg: DecryptedClinicalMessage) => {
    const code = msg.metadata?.bookingCode;
    const id = msg.metadata?.bookingId;
    const match = dossiers.find(
      (d) => (code && d.bookingCode === code) || (id && d.id === id)
    );
    if (match) {
      push({ name: 'result', dossierId: match.id, dossier: match });
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50">
      <SubScreenHeader
        title={patientName}
        subtitle={`${patientAlias ? `@${patientAlias} · ` : ''}AES-256-GCM Encrypted Channel`}
        onBack={pop}
        encryptedBadge
        rightAction={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                push({
                  name: 'prescribe',
                  patientId,
                  patientName,
                  patientAlias,
                  patientPid,
                  patientPhone,
                  initialKind: 'lab_tests',
                })
              }
              className="px-2.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Order Tests</span>
            </button>
            <button
              type="button"
              onClick={() =>
                push({
                  name: 'prescribe',
                  patientId,
                  patientName,
                  patientAlias,
                  patientPid,
                  patientPhone,
                  initialKind: 'medication',
                })
              }
              className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Pill className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Rx</span>
            </button>
            <button
              type="button"
              onClick={() =>
                push({
                  name: 'appoint',
                  patientId,
                  patientName,
                  patientAlias,
                  patientPid,
                  patientPhone,
                })
              }
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              title="Schedule Consultation"
            >
              <Calendar className="w-4 h-4 text-teal-600" />
            </button>
          </div>
        }
      />

      {sendError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-800 flex items-center justify-between">
          <span>{sendError}</span>
          <button
            type="button"
            onClick={() => setSendError(null)}
            className="text-rose-600 hover:text-rose-900 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 max-w-4xl w-full mx-auto">
        <div className="text-center py-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-500">
            <Lock className="w-3 h-3 text-teal-600" />
            End-to-end encrypted with {patientName}. Plaintext never leaves authorized devices.
          </span>
        </div>

        {messages.length === 0 && (
          <div className="text-center py-10 text-xs text-slate-500">
            Start the encrypted consultation or send a laboratory test request using the buttons above.
          </div>
        )}

        {messages.map((msg) => {
          const isDoctor = msg.senderRole === 'doctor';

          return (
            <div
              key={msg.id}
              className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-2xl p-3.5 space-y-2 ${
                  isDoctor
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-900'
                }`}
              >
                {/* Lab Test Prescription Card */}
                {msg.type === 'test_prescription' && (
                  <div
                    className={`p-3 rounded-xl border space-y-1.5 ${
                      isDoctor
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-teal-50 border-teal-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
                      <FlaskConical className="w-3.5 h-3.5" />
                      Diagnostic Lab Test Order
                    </div>
                    {msg.metadata?.prescribedTests && msg.metadata.prescribedTests.length > 0 && (
                      <ul className="text-xs space-y-0.5 font-semibold">
                        {msg.metadata.prescribedTests.map((t, i) => (
                          <li key={i}>• {t.name}</li>
                        ))}
                      </ul>
                    )}
                    {msg.metadata?.recommendedLabName && (
                      <p className="text-[11px] opacity-80 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {msg.metadata.recommendedLabName}
                      </p>
                    )}
                    {msg.metadata?.linkedBookingCode && (
                      <p className="text-[11px] font-mono text-teal-300">
                        Sent to Lab · Order #{msg.metadata.linkedBookingCode}
                      </p>
                    )}
                  </div>
                )}

                {/* Medication Prescription Card */}
                {msg.type === 'medication_prescription' && (
                  <div
                    className={`p-3 rounded-xl border space-y-1.5 ${
                      isDoctor
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
                      <Pill className="w-3.5 h-3.5" />
                      Medication Prescription
                    </div>
                    {msg.metadata?.medications?.map((m, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-bold">{m.name}</span> — {m.dosage} · {m.frequency} ({m.duration})
                      </div>
                    ))}
                  </div>
                )}

                {/* Patient Shared Lab Result Card */}
                {msg.type === 'result_share' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-900 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Shared Lab Dossier {msg.metadata?.bookingCode ? `#${msg.metadata.bookingCode}` : ''}
                      </span>
                    </div>
                    {msg.metadata?.testName && (
                      <p className="text-xs font-semibold text-slate-800">{msg.metadata.testName}</p>
                    )}
                    {msg.metadata?.labName && (
                      <p className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {msg.metadata.labName}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => openSharedDossier(msg)}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Diagnostic Dossier
                    </button>
                  </div>
                )}

                {/* Text Body */}
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                <div
                  className={`flex items-center justify-end gap-1.5 text-[10px] ${
                    isDoctor ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  <Lock className="w-2.5 h-2.5" />
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Encrypted Message Composer */}
      <form
        onSubmit={handleSend}
        className="bg-white border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Write an encrypted clinical note to ${patientName}...`}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConversationScreen;
