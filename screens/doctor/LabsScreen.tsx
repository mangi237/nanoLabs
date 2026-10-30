import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useInvitations } from '../../hooks/useDoctorData';
import { Card, EmptyState, PageHeader, Button, Pill, Skeleton, SectionLabel } from '../../components/doctor/ui';
import { Building2 } from 'lucide-react';

export default function LabsScreen({ doctorId }: { doctorId: string }) {
  const pending = useInvitations(doctorId, 'pending');
  const accepted = useInvitations(doctorId, 'accepted');

  const respond = (id: string, status: 'accepted' | 'declined') =>
    updateDoc(doc(db, 'doctor_invitations', id), { status });

  return (
    <>
      <PageHeader title="Partner labs" subtitle="Labs that invited you or accepted you" />

      <SectionLabel>Invitations</SectionLabel>
      {pending.loading ? (
        <Skeleton className="h-24 w-full" />
      ) : pending.data.length === 0 ? (
        <EmptyState icon={<Building2 size={22} />} title="No invitations" text="Labs that invite you appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {pending.data.map((inv) => (
            <Card key={inv.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{inv.labName || 'Partner laboratory'}</p>
                <p className="text-[12px] text-[#6B7280]">Wants you in their referral network</p>
              </div>
              <Button variant="ghost" className="h-9 px-3 text-[13px]" onClick={() => respond(inv.id, 'declined')}>
                Decline
              </Button>
              <Button className="h-9 px-3 text-[13px]" onClick={() => respond(inv.id, 'accepted')}>
                Accept
              </Button>
            </Card>
          ))}
        </div>
      )}

      <SectionLabel>Connected labs</SectionLabel>
      {accepted.loading ? (
        <Skeleton className="h-24 w-full" />
      ) : accepted.data.length === 0 ? (
        <EmptyState icon={<Building2 size={22} />} title="No connected labs" text="Labs you accept appear here." />
      ) : (
        <Card>
          {accepted.data.map((lab, i) => (
            <div key={lab.id} className={`flex items-center gap-3 p-4 ${i ? 'border-t border-[#E5E7EB]' : ''}`}>
              <p className="flex-1 truncate text-[15px] font-medium">{lab.labName || 'Partner laboratory'}</p>
              <Pill tone="green">Connected</Pill>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}