import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

// Live single document. Pass null to skip.
export function useLiveDocument<T = any>(path: string | null) {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, path),
      (snap) => {
        setData(snap.exists() ? ({ id: snap.id, ...(snap.data() as T) }) : null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [path]);

  return { data, loading };
}

// Live list for any query. Pass null to skip.
function useLiveList<T = any>(q: any | null) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [q]);

  return { data, loading };
}

export type Message = { conversationId: string; senderRole: 'doctor' | 'patient'; text: string; createdAt: string };

export function useMessages(conversationId: string) {
  const q = useMemo(
    () =>
      conversationId
        ? query(collection(db, 'doctor_messages'), where('conversationId', '==', conversationId), orderBy('createdAt', 'asc'))
        : null,
    [conversationId]
  );
  return useLiveList<Message>(q);
}

export function usePatientAppointments(doctorId: string, patientId: string) {
  const q = useMemo(
    () =>
      doctorId && patientId
        ? query(collection(db, 'doctorAppointments'), where('doctorId', '==', doctorId), where('patientId', '==', patientId))
        : null,
    [doctorId, patientId]
  );
  return useLiveList<any>(q);
}

export function usePatientResults(doctorId: string, patientId: string) {
  const q = useMemo(
    () =>
      doctorId && patientId
        ? query(collection(db, 'doctor_shared_results'), where('doctorId', '==', doctorId), where('patientId', '==', patientId))
        : null,
    [doctorId, patientId]
  );
  return useLiveList<any>(q);
}