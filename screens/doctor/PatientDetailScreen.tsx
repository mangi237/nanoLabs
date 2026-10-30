import React from 'react';
import { useNav } from '../../components/doctor/nav';

import { usePatientAppointments, useLiveDocument, usePatientResults } from '../../hooks/useDoctorDataExtra';
import { Card, EmptyState, Button, Avatar, Pill, SectionLabel, Skeleton, PageHeader } from '../../components/doctor/ui';
import { Calendar, FileText } from 'lucide-react';

export default function PatientDetailScreen({
  doctorId,
  patientId,
  patientName
}: {
  doctorId: string;
  patientId: string;
  patientName: string;
}) {
  const { go } = useNav();
  const conn = useLiveDocument<any>(doctorId && patientId ? `doctor_connections/${doctorId}_${patientId}` : null);
  const appts = usePatientAppointments(doctorId, patientId);
  const results = usePatientResults(doctorId, patientId);
  const phone = conn.data?.patientPhone;

  return (
    <>
      <PageHeader title={patientName} subtitle={phone || 'No phone on file'} />

      <div className="grid grid-cols-3 gap-3">
        <Button onClick={() => go('conversation', { patientId, patientName })}>Message</Button>
        <Button variant="ghost" onClick={() => go('appointment', { patientId, patientName, patientPhone: phone || '' })}>
          Book visit
        </Button>
        <Button variant="ghost" onClick={() => go('prescription', { patientId, patientName })}>
          Prescribe
        </Button>
      </div>

      <SectionLabel>Appointments</SectionLabel>
      {appts.loading ? (
        <Skeleton className="h-20 w-full" />
      ) : appts.data.length === 0 ? (
        <EmptyState icon={<Calendar size={22} />} title="No appointments" text="Visits with this patient appear here." />
      ) : (
        <Card>
          {appts.data
            .sort((a: any, b: any) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
            .map((a: any, i: number) => (
              <div key={a.id} className={`flex items-center gap-3 p-4 ${i ? 'border-t border-[#E5E7EB]' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">
                    {a.date} · {a.time}
                  </p>
                  <p className="truncate text-[12px] text-[#6B7280]">{a.reason || a.appointmentType}</p>
                </div>
                <Pill tone={a.status === 'completed' ? 'green' : 'teal'}>{a.status}</Pill>
              </div>
            ))}
        </Card>
      )}

      <SectionLabel>Results</SectionLabel>
      {results.loading ? (
        <Skeleton className="h-20 w-full" />
      ) : results.data.length === 0 ? (
        <EmptyState icon={<FileText size={22} />} title="No shared results" text="Results shared with you appear here." />
      ) : (
        <Card>
          {results.data.map((r: any, i: number) => (
            <button
              key={r.id}
              onClick={() => go('result', { resultId: r.id })}
              className={`flex w-full items-center gap-3 p-4 text-left ${i ? 'border-t border-[#E5E7EB]' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{r.testName || 'Lab report'}</p>
                <p className="truncate text-[12px] text-[#6B7280]">{r.labName || 'Partner lab'}</p>
              </div>
              {!r.viewedByDoctor && <Pill>New</Pill>}
            </button>
          ))}
        </Card>
      )}
    </>
  );
}