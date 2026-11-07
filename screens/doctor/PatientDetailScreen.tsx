import React from 'react';
import {
  MessageSquareLock,
  FlaskConical,
  Pill,
  Calendar,
  Building2,
  Phone,
  MapPin,
  FileCheck2,
} from 'lucide-react';
import { useNav } from '../../components/doctor/nav';
import {
  SubScreenHeader,
  SectionCard,
  EmptyStateCard,
  StatusTag,
} from '../../components/doctor/ui';

interface PatientDetailScreenProps {
  patientId: string;
  patientName?: string;
  patientAlias?: string;
  patientPid?: string;
  patientPhone?: string;
  patientCity?: string;
}

export const PatientDetailScreen: React.FC<PatientDetailScreenProps> = ({
  patientId,
  patientName,
  patientAlias,
  patientPid,
  patientPhone,
  patientCity,
}) => {
  const { pop, push, connections, dossiers, appointments } = useNav();

  const conn = connections.find(
    (c) => c.patientId === patientId || (patientPid && c.patientPid === patientPid)
  );

  const resolvedName = patientName || conn?.patientName || 'Patient';
  const resolvedAlias = patientAlias || conn?.patientAlias || '';
  const resolvedPid = patientPid || conn?.patientPid || patientId;
  const resolvedPhone = patientPhone || conn?.patientPhone || '';
  const resolvedCity = patientCity || conn?.patientCity || '';

  const patientDossiers = dossiers.filter(
    (d) =>
      d.patientId === patientId ||
      (resolvedPid && (d.patientPid === resolvedPid || d.patientId === resolvedPid))
  );

  const patientAppointments = appointments.filter(
    (a) =>
      a.patientId === patientId ||
      (resolvedPid && (a.patientPid === resolvedPid || a.patientId === resolvedPid))
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SubScreenHeader
        title={resolvedName}
        subtitle={`${resolvedAlias ? `@${resolvedAlias} · ` : ''}${resolvedPid}`}
        onBack={pop}
        encryptedBadge
      />

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Patient Summary & Action Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900">{resolvedName}</h2>
                {resolvedAlias && (
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                    @{resolvedAlias}
                  </span>
                )}
                <span className="text-xs font-mono text-slate-500">{resolvedPid}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1.5">
                {resolvedPhone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {resolvedPhone}
                  </span>
                )}
                {resolvedCity && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {resolvedCity}
                  </span>
                )}
              </div>
            </div>
            <StatusTag tone="teal">Connected Patient</StatusTag>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() =>
                push({
                  name: 'conversation',
                  patientId,
                  patientName: resolvedName,
                  patientAlias: resolvedAlias,
                  patientPid: resolvedPid,
                  patientPhone: resolvedPhone,
                })
              }
              className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquareLock className="w-4 h-4" />
              Encrypted Chat
            </button>

            <button
              type="button"
              onClick={() =>
                push({
                  name: 'prescribe',
                  patientId,
                  patientName: resolvedName,
                  patientAlias: resolvedAlias,
                  patientPid: resolvedPid,
                  patientPhone: resolvedPhone,
                  initialKind: 'lab_tests',
                })
              }
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4 text-teal-600" />
              Order Lab Tests
            </button>

            <button
              type="button"
              onClick={() =>
                push({
                  name: 'prescribe',
                  patientId,
                  patientName: resolvedName,
                  patientAlias: resolvedAlias,
                  patientPid: resolvedPid,
                  patientPhone: resolvedPhone,
                  initialKind: 'medication',
                })
              }
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Pill className="w-4 h-4 text-teal-600" />
              Prescribe Meds
            </button>

            <button
              type="button"
              onClick={() =>
                push({
                  name: 'appoint',
                  patientId,
                  patientName: resolvedName,
                  patientAlias: resolvedAlias,
                  patientPid: resolvedPid,
                  patientPhone: resolvedPhone,
                })
              }
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              Schedule Visit
            </button>
          </div>
        </div>

        {/* Patient Lab Test Requests & Certified Results */}
        <SectionCard
          title={`Laboratory Test Orders & Results (${patientDossiers.length})`}
          subtitle="Live tracking of test requests submitted to partner laboratories and released biologist reports"
        >
          {patientDossiers.length === 0 ? (
            <EmptyStateCard
              icon={<FileCheck2 className="w-5 h-5" />}
              title="No Laboratory Records Yet"
              description="Order diagnostic tests for this patient or ask them to share an existing lab booking from their portal."
              action={
                <button
                  type="button"
                  onClick={() =>
                    push({
                      name: 'prescribe',
                      patientId,
                      patientName: resolvedName,
                      patientAlias: resolvedAlias,
                      patientPid: resolvedPid,
                      patientPhone: resolvedPhone,
                      initialKind: 'lab_tests',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer"
                >
                  Order Diagnostic Tests
                </button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {patientDossiers.map((d) => (
                <button
                  key={`${d.bookingCode}-${d.id}`}
                  type="button"
                  onClick={() => push({ name: 'result', dossierId: d.id, dossier: d })}
                  className="w-full text-left py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        #{d.bookingCode}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {d.tests.map((t) => t.name).join(', ') || 'Diagnostic Assay'}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {d.labName}
                    </p>
                  </div>
                  <StatusTag tone={d.isCertifiedResult ? 'emerald' : 'amber'}>
                    {d.stageLabel}
                  </StatusTag>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Patient Consultations */}
        {patientAppointments.length > 0 && (
          <SectionCard title={`Consultations (${patientAppointments.length})`}>
            <div className="divide-y divide-slate-100">
              {patientAppointments.map((appt) => (
                <div key={appt.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {appt.date} at {appt.time}
                    </p>
                    <p className="text-xs text-slate-500">
                      {appt.type === 'teleconsultation' ? 'Teleconsultation' : 'In-Clinic'}
                      {appt.reason ? ` · ${appt.reason}` : ''}
                    </p>
                  </div>
                  <StatusTag tone={appt.status === 'confirmed' ? 'teal' : 'slate'}>
                    {appt.status}
                  </StatusTag>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

export default PatientDetailScreen;
