import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useMessages } from '../../hooks/useDoctorDataExtra';
import { Button, EmptyState, Skeleton } from '../../components/doctor/ui';
import { MessageSquare } from 'lucide-react';

export default function ConversationScreen({
  doctorId,
  patientId,
  patientName
}: {
  doctorId: string;
  patientId: string;
  patientName: string;
}) {
  const conversationId = `${doctorId}_${patientId}`;
  const { data, loading } = useMessages(conversationId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'doctor_messages'), {
        conversationId,
        doctorId,
        patientId,
        senderId: doctorId,
        senderRole: 'doctor',
        text: body,
        createdAt: new Date().toISOString()
      });
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-180px)] flex-col md:h-[calc(100dvh-160px)]">
      <p className="mb-4 text-[15px] font-semibold text-[#111827]">{patientName}</p>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {loading ? (
          <Skeleton className="h-16 w-2/3" />
        ) : data.length === 0 ? (
          <EmptyState icon={<MessageSquare size={22} />} title="No messages yet" text="Say hello to start the conversation." />
        ) : (
          data.map((m: any) => {
            const mine = m.senderRole === 'doctor';
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[14px] ${
                    mine ? 'bg-[#006978] text-white' : 'bg-white text-[#111827] border border-[#E5E7EB]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottom} />
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Write a message"
          className="h-10 flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-[#9CA3AF]"
        />
        <Button onClick={send} disabled={!text.trim() || sending}>
          Send
        </Button>
      </div>
    </div>
  );
}