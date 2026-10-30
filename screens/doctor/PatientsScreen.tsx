import React, { useMemo, useState } from 'react';
import { useConnections } from '../../hooks/useDoctorData';
import { Card, EmptyState, PageHeader, Avatar, Skeleton } from '../../components/doctor/ui';
import { Search, Users } from 'lucide-react';

export default function PatientsScreen({ doctorId }: { doctorId: string }) {
  const { data, loading } = useConnections(doctorId);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(
      (p) => p.patientName?.toLowerCase().includes(s) || (p.patientPhone || '').includes(s)
    );
  }, [data, q]);

  return (
    <>
      <PageHeader title="Patients" subtitle="People who connected with you" />

      <div className="mb-4 flex h-12 items-center gap-3 rounded-[14px] border border-[#E5E7EB] bg-white px-4">
        <Search size={18} className="text-[#6B7280]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or phone"
          className="flex-1 bg-transparent text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
        />
      </div>

      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title={q ? 'No matches' : 'No connected patients'}
          text={q ? 'Try a different name or phone number.' : 'Patients you accept appear here.'}
        />
      ) : (
        <Card>
          {list.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 p-4 ${i ? 'border-t border-[#E5E7EB]' : ''}`}>
              <Avatar name={p.patientName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-[#111827]">{p.patientName}</p>
                <p className="truncate text-[12px] text-[#6B7280]">{p.patientPhone || 'No phone on file'}</p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}