import React, { useMemo } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  useDoctorAppointments,
  useConnectionRequests,
  useConnections,
  useSharedResults
} from '../../hooks/useDoctorData';
import { Card, EmptyState, SectionLabel, Button, Avatar, Pill, Skeleton, PageHeader } from '../../components/doctor/ui';
import { Calendar, Users, FileText, Activity } from 'lucide-react';

const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const Stat = ({ label, value, loading }: { label: string; value: number; loading: boolean }) => (
  <Card className="p-4">
    <p className="text-[12px] font-medium text-[#6B7280]">{label}</p>
    <p className="mt-2 text-[28px] font-semibold text-[#111827]">{loading ? <Skeleton className="h-7 w-12" /> : value}</p>
  </Card>
);

export default function TodayScreen({ doctorId, doctorName }: { doctorId: string; doctorName?: string }) {
  const appts = useDoctorAppointments(doctorId);
  const requests = useConnectionRequests(doctorId);
  const connections = useConnections(doctorId);
  const results = useSharedResults(doctorId);

  const today = localDate();
  const todays = useMemo(
    () =>
      appts.data
        .filter((a) => a.date === today && a.status !== 'cancelled')
        .sort((a, b) => String(a.time).localeCompare(String(b.time))),
    [appts.data, today]
  );
  const newResults = results.data.filter((r) => !r.viewedByDoctor);

  const acceptRequest = async (r: { id: string; patientId: string; patientName: string }) => {
    await setDoc(doc(db, 'doctor_connections', `${doctorId}_${r.patientId}`), {
      doctorId,
      patientId: r.patientId,
      patientName: r.patientName,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    await updateDoc(doc(db, 'doctor_connection_requests', r.id), { status: 'accepted' });
  };

  const declineRequest = (id: string) => updateDoc(doc(db, 'doctor_connection_requests', id), { status: 'declined' });
  const completeVisit = (id: string) => updateDoc(doc(db, 'doctorAppointments', id), { status: 'completed' });

  return (
    <>
      <PageHeader
        title={doctorName ? `Hello, ${doctorName}` : 'Today'}
        subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Consultations today" value={todays.length} loading={appts.loading} />
        <Stat label="Pending requests" value={requests.data.length} loading={requests.loading} />
        <Stat label="New results" value={newResults.length} loading={results.loading} />
        <Stat label="Connected patients" value={connections.data.length} loading={connections.loading} />
      </div>

      <div className="mt-2 grid gap-6 md:grid-cols-2">
        <section>
          <SectionLabel>Schedule</SectionLabel>
          {appts.loading ? (
            <Skeleton className="h-24 w-full" />
          ) : todays.length === 0 ? (
            <EmptyState icon={<Calendar size={22} />} title="No consultations today" text="Booked appointments appear here in real time." />
          ) : (
            <Card>
              {todays.map((a, i) => (
                <div key={a.id} className={`flex items-center gap-3 p-4 ${i ? 'border-t border-[#E5E7EB]' : ''}`}>
                  <span className="w-14 text-[13px] font-semibold text-[#006978]">{a.time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-[#111827]">{a.patientName}</p>
                    <p className="truncate text-[12px] text-[#6B7280]">{a.reason || a.appointmentType}</p>
                  </div>
                  {a.status === 'completed' ? (
                    <Pill tone="green">Done</Pill>
                  ) : (
                    <Button variant="ghost" className="h-9 px-3 text-[13px]" onClick={() => completeVisit(a.id)}>
                      Mark done
                    </Button>
                  )}
                </div>
              ))}
            </Card>
          )}
        </section>

        <section>
          <SectionLabel>Requests</SectionLabel>
          {requests.loading ? (
            <Skeleton className="h-24 w-full" />
          ) : requests.data.length === 0 ? (
            <EmptyState icon={<Users size={22} />} title="No pending requests" text="Patients who want to connect appear here." />
          ) : (
            <div className="flex flex-col gap-3">
              {requests.data.map((r) => (
                <Card key={r.id} className="flex items-center gap-3 p-4">
                  <Avatar name={r.patientName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{r.patientName}</p>
                    {r.note && <p className="truncate text-[12px] text-[#6B7280]">{r.note}</p>}
                  </div>
                  <Button variant="ghost" className="h-9 px-3 text-[13px]" onClick={() => declineRequest(r.id)}>
                    Decline
                  </Button>
                  <Button className="h-9 px-3 text-[13px]" onClick={() => acceptRequest(r)}>
                    Accept
                  </Button>
                </Card>
              ))}
            </div>
          )}

          <SectionLabel>Latest results</SectionLabel>
          {results.loading ? (
            <Skeleton className="h-24 w-full" />
          ) : results.data.length === 0 ? (
            <EmptyState icon={<FileText size={22} />} title="No results yet" text="Reports shared with you appear here." />
          ) : (
            <Card>
              {results.data.slice(0, 3).map((r, i) => (
                <div key={r.id} className={`flex items-center gap-3 p-4 ${i ? 'border-t border-[#E5E7EB]' : ''}`}>
                  <Activity size={18} className="text-[#006978]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{r.testName || 'Lab report'}</p>
                    <p className="truncate text-[12px] text-[#6B7280]">{r.patientName} · {r.labName}</p>
                  </div>
                  {!r.viewedByDoctor && <Pill>New</Pill>}
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
    </>
  );
}