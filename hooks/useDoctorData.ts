import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, onSnapshot, type Query, type DocumentData } from 'firebase/firestore';
import { db } from '../services/firebase';

export type Live<T> = { data: (T & { id: string })[]; loading: boolean; error: string | null };

// Subscribes to a query and keeps the list updated in real time.
function useLive<T = DocumentData>(q: Query | null): Live<T> {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [q]);

  return { data, loading, error };
}

export type Appointment = {
  date: string;
  time: string;
  status: string;
  patientName: string;
  patientPhone?: string;
  reason?: string;
  appointmentType?: string;
};

export type ConnectionRequest = { patientId: string; patientName: string; note?: string; createdAt?: string; status: string };
export type Connection = { patientId: string; patientName: string; patientPhone?: string };
export type SharedResult = { patientName: string; testName?: string; labName?: string; sharedAt?: string; viewedByDoctor?: boolean };
export type Invitation = { labId: string; labName?: string; status: string };

export function useDoctorAppointments(doctorId: string) {
  const q = useMemo(
    () => (doctorId ? query(collection(db, 'doctorAppointments'), where('doctorId', '==', doctorId)) : null),
    [doctorId]
  );
  return useLive<Appointment>(q);
}

export function useConnectionRequests(doctorId: string) {
  const q = useMemo(
    () =>
      doctorId
        ? query(collection(db, 'doctor_connection_requests'), where('toDoctorId', '==', doctorId), where('status', '==', 'pending'))
        : null,
    [doctorId]
  );
  return useLive<ConnectionRequest>(q);
}

export function useConnections(doctorId: string) {
  const q = useMemo(
    () =>
      doctorId
        ? query(collection(db, 'doctor_connections'), where('doctorId', '==', doctorId), where('status', '==', 'active'))
        : null,
    [doctorId]
  );
  return useLive<Connection>(q);
}

export function useSharedResults(doctorId: string) {
  const q = useMemo(
    () => (doctorId ? query(collection(db, 'doctor_shared_results'), where('doctorId', '==', doctorId)) : null),
    [doctorId]
  );
  return useLive<SharedResult>(q);
}

export function useInvitations(doctorId: string, status: 'pending' | 'accepted') {
  const q = useMemo(
    () =>
      doctorId
        ? query(collection(db, 'doctor_invitations'), where('doctorId', '==', doctorId), where('status', '==', status))
        : null,
    [doctorId, status]
  );
  return useLive<Invitation>(q);
}