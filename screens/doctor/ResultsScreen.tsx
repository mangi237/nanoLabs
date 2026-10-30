import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useSharedResults } from '../../hooks/useDoctorData';
import { Card, EmptyState, PageHeader, Pill, Skeleton } from '../../components/doctor/ui';
import { FileText } from 'lucide-react';

export default function ResultsScreen({ doctorId }: { doctorId: string }) {
  const { data, loading } = useSharedResults(doctorId);
  const [filter, setFilter] = useState<'all' | 'new'>('all');
  const list = filter === 'new' ? data.filter((r) => !r.viewedByDoctor) : data;

  const markViewed = (id: string) => updateDoc(doc(db, 'doctor_shared_results', id), { viewedByDoctor: true });

  return (
    <>
      <PageHeader title="Results" subtitle="Reports shared with you by patients and labs" />

      <div className="mb-4 flex gap-2">
        {(['all', 'new'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-9 rounded-full px-4 text-[13px] font-semibold ${
              filter === f ? 'bg-[#E6F2F3] text-[#006978]' : 'border border-[#E5E7EB] bg-white text-[#6B7280]'
            }`}
          >
            {f === 'all' ? 'All' : 'New'}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : list.length === 0 ? (
        <EmptyState icon={<FileText size={22} />} title="No results to show" text="Reports appear here once a lab validates them." />
      ) : (
        <Card>
          {list.map((r, i) => (
            <button
              key={r.id}
              onClick={() => !r.viewedByDoctor && markViewed(r.id)}
              className={`flex w-full items-center gap-3 p-4 text-left ${i ? 'border-t border-[#E5E7EB]' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-[#111827]">{r.testName || 'Lab report'}</p>
                <p className="truncate text-[12px] text-[#6B7280]">
                  {r.patientName} · {r.labName || 'Partner lab'}
                  {r.sharedAt ? ` · ${new Date(r.sharedAt).toLocaleDateString()}` : ''}
                </p>
              </div>
              {!r.viewedByDoctor && <Pill>New</Pill>}
            </button>
          ))}
        </Card>
      )}
    </>
  );
}