import React, { useState } from 'react';
import {
  Users,
  FileCheck2,
  FlaskConical,
  Calendar,
  MessageSquareLock,
  Check,
  X,
  ArrowRight,
  Clock,
  RefreshCw,
  UserPlus,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useNav } from '../../components/doctor/nav';
import { SectionCard, EmptyStateCard, StatusTag } from '../../components/doctor/ui';
import { doctorPatientFirestoreService } from '../../services/doctorPatientFirestoreService';

export const TodayScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    connections,
    dossiers,
    appointments,
    push,
    setTab,
    refreshDossiers,
    unreadMessagesCount,
  } = useNav();

  const [busyConnId, setBusyConnId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const incomingRequests = connections.filter(
    (c) => c.status === 'pending' && c.requestedBy === 'patient'
  );
  const connectedPatients = connections.filter((c) => c.status === 'accepted');
  const inProgressDossiers = dossiers.filter((d) => !d.isCertifiedResult);
  const certifiedDossiers = dossiers.filter((d) => d.isCertifiedResult);
  const activeAppointments = appointments.filter(
    (a) => a.status !== 'cancelled' && a.status !== 'completed'
  );

  const handleDecision = async (connId: string, decision: 'accepted' | 'declined') => {
    setBusyConnId(connId);
    try {
      await doctorPatientFirestoreService.respondToConnection(connId, decision);
      await refreshDossiers();
    } finally {
      setBusyConnId(null);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDossiers();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAppointmentStatus = async (
    appointmentId: string,
    status: 'confirmed' | 'completed' | 'cancelled'
  ) => {
    await doctorPatientFirestoreService.updateAppointmentStatus(appointmentId, status);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Clinical Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Clinical Command · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Welcome, {user?.name || 'Doctor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {(user as any)?.specialty || 'General Medicine'}
            {(user as any)?.hospital ? ` · ${(user as any).hospital}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
            Sync Live Lab Feed
          </button>
          <button
            type="button"
            onClick={() => push({ name: 'prescribe', initialKind: 'lab_tests' })}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <FlaskConical className="w-4 h-4" />
            Prescribe Lab Tests
          </button>
          <button
            type="button"
            onClick={() => push({ name: 'messages' })}
            className="px-3.5 py-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <MessageSquareLock className="w-4 h-4 text-teal-700" />
            Encrypted Chat
            {unreadMessagesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-teal-700 text-white text-[10px]">
                {unreadMessagesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Live Clinical Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setTab('patients')}
          className="text-left bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-4 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Connected Patients</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{connectedPatients.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {incomingRequests.length > 0
              ? `${incomingRequests.length} follow request(s) awaiting approval`
              : 'Searchable by @alias'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setTab('results')}
          className="text-left bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-4 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">In-Progress Lab Orders</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{inProgressDossiers.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Live status from partner labs</p>
        </button>

        <button
          type="button"
          onClick={() => setTab('results')}
          className="text-left bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-4 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Certified Lab Results</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{certifiedDossiers.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Biologist-signed &amp; shared reports</p>
        </button>

        <button
          type="button"
          onClick={() => push({ name: 'appoint' })}
          className="text-left bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-4 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Active Consultations</span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeAppointments.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Tap to schedule appointment</p>
        </button>
      </div>

      {/* Incoming Patient Follow / Connection Requests */}
      {incomingRequests.length > 0 && (
        <SectionCard
          title={`Incoming Patient Follow Requests (${incomingRequests.length})`}
          subtitle="Patients requesting clinical follow-up and encrypted diagnostic sharing with you"
        >
          <div className="divide-y divide-slate-100">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{req.patientName}</span>
                    <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                      @{req.patientAlias}
                    </span>
                    {req.patientPid && (
                      <span className="text-[11px] font-mono text-slate-500">{req.patientPid}</span>
                    )}
                  </div>
                  {req.note && (
                    <p className="text-xs text-slate-600 mt-1">“{req.note}”</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyConnId === req.id}
                    onClick={() => handleDecision(req.id, 'accepted')}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept Patient
                  </button>
                  <button
                    type="button"
                    disabled={busyConnId === req.id}
                    onClick={() => handleDecision(req.id, 'declined')}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Patient Lab Test Requests & Certified Results */}
        <div className="lg:col-span-7">
          <SectionCard
            title="Patient Lab Test Requests & Certified Results"
            subtitle="Real-time status of test orders booked by or prescribed for your patients"
            action={
              <button
                type="button"
                onClick={() => setTab('results')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {dossiers.length === 0 ? (
              <EmptyStateCard
                icon={<FlaskConical className="w-5 h-5" />}
                title="No Patient Lab Orders Yet"
                description="When a connected patient books a diagnostic test at a registered laboratory, selects you as referring doctor, or shares a certified lab report, it appears here in real time."
                action={
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTab('patients')}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Find Patient by @alias
                    </button>
                    <button
                      type="button"
                      onClick={() => push({ name: 'prescribe', initialKind: 'lab_tests' })}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      Order Lab Tests
                    </button>
                  </div>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {dossiers.slice(0, 6).map((d) => (
                  <button
                    key={`${d.bookingCode}-${d.id}`}
                    type="button"
                    onClick={() => push({ name: 'result', dossierId: d.id, dossier: d })}
                    className="w-full text-left py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{d.patientName}</span>
                        {d.patientAlias && (
                          <span className="text-[11px] font-mono text-teal-700">
                            @{d.patientAlias}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">
                          #{d.bookingCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                        {d.tests.map((t) => t.name).join(', ') || 'Diagnostic Panel'}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{d.labName}</span>
                      </p>
                    </div>

                    <div className="shrink-0 flex sm:flex-col items-start sm:items-end gap-1.5">
                      <StatusTag tone={d.isCertifiedResult ? 'emerald' : 'amber'}>
                        {d.stageLabel}
                      </StatusTag>
                      <span className="text-[11px] text-slate-400">
                        {new Date(d.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Upcoming Appointments */}
        <div className="lg:col-span-5">
          <SectionCard
            title="Consultations & Follow-Ups"
            subtitle="Scheduled in-clinic and teleconsultation sessions"
            action={
              <button
                type="button"
                onClick={() => push({ name: 'appoint' })}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                + Schedule
              </button>
            }
          >
            {activeAppointments.length === 0 ? (
              <EmptyStateCard
                icon={<Calendar className="w-5 h-5" />}
                title="No Upcoming Consultations"
                description="Schedule an in-clinic visit or encrypted teleconsultation with any connected patient."
                action={
                  <button
                    type="button"
                    onClick={() => push({ name: 'appoint' })}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Schedule Consultation
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {activeAppointments.slice(0, 5).map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{appt.patientName}</p>
                        <p className="text-xs text-slate-600">
                          {appt.date} at {appt.time} ·{' '}
                          {appt.type === 'teleconsultation' ? 'Teleconsultation' : 'In-Clinic'}
                        </p>
                      </div>
                      <StatusTag tone={appt.status === 'confirmed' ? 'teal' : 'amber'}>
                        {appt.status === 'confirmed' ? 'Confirmed' : 'Requested'}
                      </StatusTag>
                    </div>
                    {appt.reason && (
                      <p className="text-xs text-slate-600">Reason: {appt.reason}</p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      {appt.status === 'requested' && (
                        <button
                          type="button"
                          onClick={() => handleAppointmentStatus(appt.id, 'confirmed')}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAppointmentStatus(appt.id, 'completed')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-bold cursor-pointer"
                      >
                        Mark Completed
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          push({
                            name: 'conversation',
                            patientId: appt.patientId,
                            patientName: appt.patientName,
                            patientAlias: appt.patientAlias,
                            patientPid: appt.patientPid,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 text-[11px] font-bold cursor-pointer ml-auto"
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default TodayScreen;
