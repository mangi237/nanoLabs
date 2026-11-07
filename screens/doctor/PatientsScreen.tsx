import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Users,
  Check,
  X,
  MessageSquareLock,
  FlaskConical,
  ChevronRight,
  AtSign,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useNav } from '../../components/doctor/nav';
import { SectionCard, EmptyStateCard, StatusTag } from '../../components/doctor/ui';
import {
  doctorPatientFirestoreService,
  FirestorePatientSummary,
} from '../../services/doctorPatientFirestoreService';

export const PatientsScreen: React.FC = () => {
  const { user } = useAuth();
  const { connections, dossiers, push, refreshDossiers } = useNav();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FirestorePatientSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'connected' | 'incoming' | 'sent'>('connected');

  const connectedList = connections.filter((c) => c.status === 'accepted');
  const incomingList = connections.filter(
    (c) => c.status === 'pending' && c.requestedBy === 'patient'
  );
  const sentList = connections.filter(
    (c) => c.status === 'pending' && c.requestedBy === 'doctor'
  );

  useEffect(() => {
    let cancelled = false;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const handle = setTimeout(async () => {
      const res = await doctorPatientFirestoreService.searchPatientsForDoctor(trimmed);
      if (!cancelled) {
        setSearchResults(res);
        setSearching(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchQuery]);

  const handleFollowPatient = async (pat: FirestorePatientSummary) => {
    if (!user?.id) return;
    setBusyId(pat.id);
    try {
      await doctorPatientFirestoreService.requestConnection({
        doctorId: user.id,
        doctorName: user.name || 'Dr. Physician',
        doctorSpecialty: (user as any)?.specialty || 'General Medicine',
        doctorHospital: (user as any)?.hospital || 'Clinical Practice',
        doctorPhone: user.phone || '',
        patientId: pat.id,
        patientPid: pat.patientId,
        patientName: pat.displayNameForSearch || pat.name,
        patientAlias: pat.alias,
        patientPhone: pat.phone,
        patientCity: pat.city,
        requestedBy: 'doctor',
        note: `Follow request from ${user.name || 'Doctor'}`,
      });
      await refreshDossiers();
    } finally {
      setBusyId(null);
    }
  };

  const handleRespond = async (connectionId: string, decision: 'accepted' | 'declined') => {
    setBusyId(connectionId);
    try {
      await doctorPatientFirestoreService.respondToConnection(connectionId, decision);
      await refreshDossiers();
    } finally {
      setBusyId(null);
    }
  };

  const getConnectionForPatient = (pat: FirestorePatientSummary) => {
    return connections.find(
      (c) =>
        c.patientId === pat.id ||
        (pat.patientId && c.patientPid === pat.patientId) ||
        (pat.alias && c.patientAlias === pat.alias)
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Patients &amp; @Alias Directory</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Search registered patients by their unique <span className="font-mono font-bold text-teal-700">@alias</span>, Patient ID (<span className="font-mono">PAT-XXXXXX</span>), name, or phone number to connect and monitor lab requests.
        </p>
      </div>

      {/* Live Firestore @alias Search */}
      <SectionCard
        title="Find & Follow a Patient"
        subtitle="Queries registered patient profiles in real time from Firestore"
      >
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by @alias (e.g. @marie_cm), PAT-XXXXXX, name, or phone..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          {searching && (
            <Loader2 className="w-4 h-4 text-teal-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {searchQuery.trim().length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            {!searching && searchResults.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No registered patient matched “{searchQuery.trim()}”. Ask your patient for their exact <span className="font-mono font-bold">@alias</span> or <span className="font-mono">PAT-</span> ID.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {searchResults.slice(0, 12).map((pat) => {
                  const existing = getConnectionForPatient(pat);
                  return (
                    <div
                      key={pat.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {pat.displayNameForSearch}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                            <AtSign className="w-3 h-3" />
                            {pat.alias}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {pat.patientId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {[pat.gender, pat.city].filter(Boolean).join(' · ') || 'Registered Patient'}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {existing?.status === 'accepted' ? (
                          <button
                            type="button"
                            onClick={() =>
                              push({
                                name: 'patient',
                                patientId: existing.patientId,
                                patientName: existing.patientName,
                                patientAlias: existing.patientAlias,
                                patientPid: existing.patientPid,
                                patientPhone: existing.patientPhone,
                              })
                            }
                            className="px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 text-xs font-bold cursor-pointer"
                          >
                            Connected · Open Dossier
                          </button>
                        ) : existing?.status === 'pending' && existing.requestedBy === 'patient' ? (
                          <button
                            type="button"
                            disabled={busyId === existing.id}
                            onClick={() => handleRespond(existing.id, 'accepted')}
                            className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer"
                          >
                            Accept Follow Request
                          </button>
                        ) : existing?.status === 'pending' ? (
                          <StatusTag tone="amber">Follow Request Sent</StatusTag>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === pat.id}
                            onClick={() => handleFollowPatient(pat)}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Send Follow Request
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveFilter('connected')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeFilter === 'connected'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Connected Patients ({connectedList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('incoming')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeFilter === 'incoming'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Incoming Requests ({incomingList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('sent')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeFilter === 'sent'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Sent Requests ({sentList.length})
        </button>
      </div>

      {/* Connected Patients */}
      {activeFilter === 'connected' && (
        <SectionCard>
          {connectedList.length === 0 ? (
            <EmptyStateCard
              icon={<Users className="w-5 h-5" />}
              title="No Connected Patients Yet"
              description="Search a patient's @alias above to send a follow request, or accept an incoming follow request from your patient."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {connectedList.map((conn) => {
                const patientOrderCount = dossiers.filter(
                  (d) =>
                    d.patientId === conn.patientId ||
                    (conn.patientPid && d.patientPid === conn.patientPid)
                ).length;

                return (
                  <div
                    key={conn.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        push({
                          name: 'patient',
                          patientId: conn.patientId,
                          patientName: conn.patientName,
                          patientAlias: conn.patientAlias,
                          patientPid: conn.patientPid,
                          patientPhone: conn.patientPhone,
                          patientCity: conn.patientCity,
                        })
                      }
                      className="text-left min-w-0 flex-1 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-teal-700">
                          {conn.patientName}
                        </span>
                        <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                          @{conn.patientAlias}
                        </span>
                        {conn.patientPid && (
                          <span className="text-[11px] font-mono text-slate-400">
                            {conn.patientPid}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {patientOrderCount} lab test dossier(s) ·{' '}
                        {conn.patientPhone || 'Encrypted clinical channel active'}
                      </p>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          push({
                            name: 'prescribe',
                            patientId: conn.patientId,
                            patientName: conn.patientName,
                            patientAlias: conn.patientAlias,
                            patientPid: conn.patientPid,
                            patientPhone: conn.patientPhone,
                            initialKind: 'lab_tests',
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                        Order Tests
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          push({
                            name: 'conversation',
                            patientId: conn.patientId,
                            patientName: conn.patientName,
                            patientAlias: conn.patientAlias,
                            patientPid: conn.patientPid,
                            patientPhone: conn.patientPhone,
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquareLock className="w-3.5 h-3.5" />
                        Chat
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          push({
                            name: 'patient',
                            patientId: conn.patientId,
                            patientName: conn.patientName,
                            patientAlias: conn.patientAlias,
                            patientPid: conn.patientPid,
                            patientPhone: conn.patientPhone,
                          })
                        }
                        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
                        aria-label="Open Patient Dossier"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      {/* Incoming Follow Requests */}
      {activeFilter === 'incoming' && (
        <SectionCard>
          {incomingList.length === 0 ? (
            <EmptyStateCard
              icon={<UserPlus className="w-5 h-5" />}
              title="No Pending Incoming Follow Requests"
              description="When patients request to connect with you from their My Doctors screen, their requests appear here immediately."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {incomingList.map((req) => (
                <div
                  key={req.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{req.patientName}</span>
                      <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                        @{req.patientAlias}
                      </span>
                    </div>
                    {req.note && <p className="text-xs text-slate-600 mt-1">“{req.note}”</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleRespond(req.id, 'accepted')}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleRespond(req.id, 'declined')}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Sent Follow Requests */}
      {activeFilter === 'sent' && (
        <SectionCard>
          {sentList.length === 0 ? (
            <EmptyStateCard
              icon={<AtSign className="w-5 h-5" />}
              title="No Outgoing Pending Requests"
              description="Follow requests you send to patients by @alias appear here until the patient accepts."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {sentList.map((req) => (
                <div
                  key={req.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{req.patientName}</span>
                      <span className="text-xs font-mono text-teal-700">@{req.patientAlias}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sent {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusTag tone="amber">Awaiting Patient Approval</StatusTag>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
};

export default PatientsScreen;
