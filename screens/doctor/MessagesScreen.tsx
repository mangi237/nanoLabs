import React from 'react';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { useConnections } from '../../hooks/useDoctorData';
import { Card, EmptyState, PageHeader, Avatar, Skeleton } from '../../components/doctor/ui';
import { useNav } from '../../components/doctor/nav';

export default function MessagesScreen({ doctorId }: { doctorId: string }) {
  const { go } = useNav();
  const { data, loading } = useConnections(doctorId);

  return (
    <>
      <PageHeader title="Messages" subtitle="Conversations with connected patients" />
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : data.length === 0 ? (
        <EmptyState icon={<MessageSquare size={22} />} title="No conversations" text="Messages with connected patients appear here." />
      ) : (
        <Card>
          {data.map((c, i) => (
            <button
              key={c.id}
              onClick={() => go('conversation', { patientId: c.patientId, patientName: c.patientName })}
              className={`flex w-full items-center gap-3 p-4 text-left ${i ? 'border-t border-[#E5E7EB]' : ''}`}
            >
              <Avatar name={c.patientName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{c.patientName}</p>
                <p className="truncate text-[12px] text-[#6B7280]">{c.patientPhone || 'No phone on file'}</p>
              </div>
              <ChevronRight size={18} className="text-[#9CA3AF]" />
            </button>
          ))}
        </Card>
      )}
    </>
  );
}