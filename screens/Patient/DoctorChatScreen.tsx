import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  FileText,
  Video,
  Paperclip,
  Stethoscope,
  Lock,
  FlaskConical,
  Pill,
  Calendar,
  ArrowRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { DoctorDirectoryItem } from './MyDoctorScreen';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import {
  doctorPatientFirestoreService,
  DecryptedClinicalMessage,
  formatPatientAlias,
} from '../../services/doctorPatientFirestoreService';
import { doesBookingBelongToPatient } from '../../utils/patientOwnership';

interface DoctorChatScreenProps {
  doctor?: DoctorDirectoryItem;
  onBack: () => void;
  onDownloadPrescription?: () => void;
  onBookPrescribedTests?: (params: {
    tests: Array<{ name: string; price: number }>;
    doctorId: string;
    doctorName: string;
    recommendedLabId?: string;
    recommendedLabName?: string;
  }) => void;
}

export const DoctorChatScreen: React.FC<DoctorChatScreenProps> = ({
  doctor,
  onBack,
  onBookPrescribedTests,
}) => {
  const { user } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();
  const [messages, setMessages] = useState<DecryptedClinicalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [shareNote, setShareNote] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const activePatientId = isDependentActive
    ? activeProfile.id
    : user?.id || user?.patientId || activeProfile.id;
  const activePatientPid = isDependentActive
    ? activeProfile.id
    : user?.patientId || user?.id || activeProfile.id;
  const activePatientName = isDependentActive
    ? activeProfile.fullName
    : user?.name || activeProfile.fullName || 'Patient';
  const activePatientAlias = formatPatientAlias(
    (user as any)?.alias || activeProfile?.nickname,
    activePatientName
  );

  useEffect(() => {
    if (!doctor?.id || !activePatientId) return;
    const unsub = doctorPatientFirestoreService.subscribeConversationMessages(
      doctor.id,
      activePatientId,
      'patient',
      (decrypted) => {
        setMessages(decrypted);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    );
    return () => unsub();
  }, [doctor?.id, activePatientId]);

  const loadPatientBookingsToShare = async () => {
    try {
      const { limsService } = await import('../../services/limsService');
      const all = await limsService.fetchPatientBookingsAcrossLabs(
        user?.labId ? [user.labId] : []
      );
      const mine = all.filter((b) =>
        doesBookingBelongToPatient(b, user, activeProfile, isDependentActive)
      );
      setMyBookings(mine);
      setShowShareModal(true);
    } catch (err) {
      console.warn('Could not load bookings to share:', err);
    }
  };

  if (!doctor) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Select a connected physician to open encrypted messaging.
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !activePatientId) return;
    const text = inputText.trim();
    setSendError(null);
    setInputText('');
    setSending(true);
    try {
      await doctorPatientFirestoreService.sendEncryptedMessage({
        doctorId: doctor.id,
        doctorName: doctor.name,
        patientId: activePatientId,
        patientPid: activePatientPid,
        patientName: activePatientName,
        patientAlias: activePatientAlias,
        senderRole: 'patient',
        type: 'text',
        text,
      });
    } catch (err: any) {
      console.error('Failed to send encrypted message to doctor:', err);
      setInputText(text);
      setSendError(err?.message || 'Could not send message. Please retry.');
    } finally {
      setSending(false);
    }
  };

  const handleShareBooking = async (booking: any) => {
    if (!activePatientId) return;
    try {
      await doctorPatientFirestoreService.sharePatientBookingWithDoctor({
        doctorId: doctor.id,
        doctorName: doctor.name,
        patientId: activePatientId,
        patientPid: activePatientPid,
        patientName: activePatientName,
        patientAlias: activePatientAlias,
        booking,
        note: shareNote.trim() || undefined,
      });
      setShowShareModal(false);
      setShareNote('');
      setShareSuccess(`Shared dossier ${booking.bookingCode || ''} with ${doctor.name}.`);
      setTimeout(() => setShareSuccess(''), 4000);
    } catch (err) {
      console.warn('Error sharing booking with doctor:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[82dvh] flex flex-col text-slate-900 animate-in fade-in duration-300 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src={doctor.avatarUrl}
            alt={doctor.name}
            className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-slate-900 truncate">{doctor.name}</h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
              <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                <Lock className="w-3 h-3" />
                AES-256 E2EE
              </span>
              <span>&bull;</span>
              <span className="truncate">{doctor.specialty}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadPatientBookingsToShare}
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#006978] border border-teal-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share Lab Report</span>
          </button>
          <a
            href="https://waspito.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Video</span>
          </a>
        </div>
      </div>

      {sendError && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
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

      {shareSuccess && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{shareSuccess}</span>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAF9]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-3xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center shadow-xs">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900">
                End-to-End Encrypted Channel with {doctor.name}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Messages, lab test requests, and shared diagnostic reports are encrypted client-side with AES-256-GCM before leaving your device.
              </p>
            </div>
            <button
              type="button"
              onClick={loadPatientBookingsToShare}
              className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-[#006978] rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Share Lab Test Request or Certified Result</span>
            </button>
          </div>
        ) : (
          messages.map((m) => {
            const isDoctor = m.senderRole === 'doctor';
            const timeStr = new Date(m.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            if (m.type === 'test_prescription' && m.metadata?.prescribedTests) {
              const tests = m.metadata.prescribedTests;
              const alreadyBooked = m.metadata.prescriptionStatus === 'booked';
              return (
                <div key={m.id} className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'}`}>
                  <div className="p-4 bg-white border-2 border-teal-200 rounded-3xl shadow-sm max-w-md w-full space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <FlaskConical className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">
                            Doctor Lab Test Request
                          </h4>
                          <span className="text-[10px] text-teal-700 font-semibold">
                            Issued by {m.senderName}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                        {alreadyBooked ? 'Sent to Lab' : 'Ready to Book'}
                      </span>
                    </div>

                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {tests.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{t.name}</span>
                          {t.price ? (
                            <span className="font-mono text-slate-500">{t.price} FCFA</span>
                          ) : null}
                        </div>
                      ))}
                      {m.metadata.recommendedLabName && (
                        <p className="text-[11px] text-teal-800 font-semibold pt-1 border-t border-slate-200">
                          Recommended Lab: {m.metadata.recommendedLabName}
                        </p>
                      )}
                      {m.metadata.clinicalIndication && (
                        <p className="text-[11px] text-slate-500 pt-1">
                          Note: {m.metadata.clinicalIndication}
                        </p>
                      )}
                    </div>

                    {alreadyBooked && m.metadata.linkedBookingCode ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-semibold">
                        Order <strong>{m.metadata.linkedBookingCode}</strong> has already been transmitted to{' '}
                        <strong>{m.metadata.recommendedLabName || 'the laboratory'}</strong>. Track live status on your Home tab!
                      </div>
                    ) : (
                      onBookPrescribedTests && (
                        <button
                          type="button"
                          onClick={() => {
                            sessionStorage.setItem('nanolabs_rx_doctor_id', doctor.id);
                            onBookPrescribedTests({
                              tests: tests.map((t) => ({
                                name: t.name,
                                price: Number(t.price) || 4500,
                              })),
                              doctorId: doctor.id,
                              doctorName: doctor.name,
                              recommendedLabId: m.metadata?.recommendedLabId,
                              recommendedLabName: m.metadata?.recommendedLabName,
                            });
                          }}
                          className="w-full py-2.5 px-3 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Book These Tests at a Laboratory</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                    <span className="text-[10px] text-slate-400 block text-right">{timeStr}</span>
                  </div>
                </div>
              );
            }

            if (m.type === 'medication_prescription' && m.metadata?.medications) {
              return (
                <div key={m.id} className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'}`}>
                  <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs max-w-md w-full space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          Digital Medication Prescription
                        </h4>
                        <span className="text-[10px] text-slate-500">{m.senderName}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl text-xs">
                      {m.metadata.medications.map((med, idx) => (
                        <div key={idx} className="border-b last:border-b-0 border-slate-200/70 pb-1.5 last:pb-0">
                          <strong className="text-slate-900 block">{med.name} — {med.dosage}</strong>
                          <span className="text-[11px] text-slate-600">
                            {med.frequency} &bull; {med.duration}
                            {med.instructions ? ` (${med.instructions})` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 block text-right">{timeStr}</span>
                  </div>
                </div>
              );
            }

            if (m.type === 'result_share') {
              return (
                <div key={m.id} className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'}`}>
                  <div className="p-4 bg-white border border-emerald-200 rounded-3xl shadow-xs max-w-sm space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">
                          {m.metadata?.testName || 'Shared Laboratory Dossier'}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {m.metadata?.labName || 'Laboratory'} &bull; {m.metadata?.bookingCode}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{m.text}</p>
                    <span className="text-[10px] text-slate-400 block text-right">{timeStr}</span>
                  </div>
                </div>
              );
            }

            if (m.type === 'appointment') {
              return (
                <div key={m.id} className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'}`}>
                  <div className="p-3.5 bg-white border border-sky-200 rounded-2xl shadow-xs max-w-sm space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-sky-900">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span>Consultation Appointment</span>
                    </div>
                    <p className="text-slate-700">{m.text}</p>
                    <span className="text-[10px] text-slate-400 block text-right">{timeStr}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'}`}>
                <div
                  className={`max-w-sm sm:max-w-md p-3.5 rounded-3xl text-xs leading-relaxed shadow-2xs ${
                    isDoctor
                      ? 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                      : 'bg-[#006978] text-white rounded-tr-xs'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`text-[9px] block text-right mt-1 font-semibold ${
                      isDoctor ? 'text-slate-400' : 'text-cyan-200'
                    }`}
                  >
                    {timeStr}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
      >
        <button
          type="button"
          onClick={loadPatientBookingsToShare}
          title="Share Lab Dossier or Result"
          className="p-2.5 text-slate-400 hover:text-[#006978] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Write an encrypted message to ${doctor.name}...`}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006978] focus:bg-white"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="w-10 h-10 rounded-2xl bg-[#006978] disabled:bg-slate-200 hover:bg-[#005a66] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Share Real Patient Booking / Certified Result Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Share Laboratory Dossier with {doctor.name}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select any of your active test requests or certified results
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={shareNote}
              onChange={(e) => setShareNote(e.target.value)}
              placeholder="Optional note for your doctor..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {myBookings.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                  You have no laboratory bookings or results yet to share.
                </div>
              ) : (
                myBookings.map((b) => {
                  const testList = (b.tests || [])
                    .map((t: any) => t.testName || t.name)
                    .join(', ');
                  const certified = Boolean(
                    b.biologistSigned || b.resultsReleased || b.overallStatus === 'Completed'
                  );
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleShareBooking(b)}
                      className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-[#006978] bg-white transition cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {testList || 'Diagnostic Dossier'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                            certified
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {certified ? 'Certified Result' : 'In Progress'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {b.labName} &bull; <span className="font-mono">{b.bookingCode}</span>
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
