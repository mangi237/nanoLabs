import React, { useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useLiveDocument } from '../../hooks/useDoctorDataExtra';
import { Card, Button, Pill, PageHeader, Skeleton, EmptyState } from '../../components/doctor/ui';
import { FileText } from 'lucide-react';

export default function ResultDetailScreen({ resultId }: { resultId: string }) {
  const { data, loading } = useLiveDocument<any>(`doctor_shared_results/${resultId}`);

  useEffect(() => {
    if (data && !data.viewedByDoctor) {
      updateDoc(doc(db, 'doctor_shared_results', resultId), { viewedByDoctor: true });
    }
  }, [data, resultId]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!data) return <EmptyState icon={<FileText size={22} />} title="Result not found" text="It may have been removed." />;

  const params: any[] = Array.isArray(data.parameters) ? data.parameters : [];

  return (
    <>
      <PageHeader
        title={data.testName || 'Lab report'}
        subtitle={[data.patientName, data.labName, data.sharedAt && new Date(data.sharedAt).toLocaleDateString()]
          .filter(Boolean)
          .join(' · ')}
      />

      {data.pdfUrl && (
        <div className="mb-6">
          <Button onClick={() => window.open(data.pdfUrl, '_blank', 'noopener')}>Open signed PDF</Button>
        </div>
      )}

      {params.length === 0 ? (
        <EmptyState icon={<FileText size={22} />} title="No parameters" text="This report has no itemised values." />
      ) : (
        <Card className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr] gap-3 border-b border-[#E5E7EB] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
              <span>Test</span>
              <span>Result</span>
              <span>Unit</span>
              <span>Reference</span>
              <span>Flag</span>
            </div>
            {params.map((p, i) => {
              const abnormal = p.flag === 'high' || p.flag === 'low';
              return (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr] items-center gap-3 border-b border-[#E5E7EB] px-4 py-3 text-[14px] last:border-0"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="font-semibold">{p.value}</span>
                  <span className="text-[#6B7280]">{p.unit || '—'}</span>
                  <span className="text-[#6B7280]">{p.reference || '—'}</span>
                  <span>{abnormal ? <Pill tone="amber">{p.flag === 'high' ? 'High' : 'Low'}</Pill> : <Pill tone="green">Normal</Pill>}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}