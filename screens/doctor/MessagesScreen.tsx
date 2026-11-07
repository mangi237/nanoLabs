import React, { useState } from 'react';
import { MessageSquareLock, Search, Lock, ChevronRight, Users } from 'lucide-react';
import { useNav } from '../../components/doctor/nav';
import { SubScreenHeader, SectionCard, EmptyStateCard } from '../../components/doctor/ui';

export const MessagesScreen: React.FC = () => {
  const { pop, push, setTab, connections } = useNav();
  const [searchQuery, setSearchQuery] = useState('');

  const acceptedConnections = connections.filter((c) => {
    if (c.status !== 'accepted') return false;
    const q = searchQuery.trim().toLowerCase().replace(/^@+/, '');
    if (!q) return true;
    return (
      c.patientName.toLowerCase().includes(q) ||
      (c.patientAlias || '').toLowerCase().includes(q) ||
      (c.patientPid || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <SubScreenHeader
        title="Encrypted Clinical Conversations"
        subtitle="Zero-knowledge AES-256-GCM end-to-end encrypted doctor-patient channel"
        onBack={pop}
        encryptedBadge
      />

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 flex items-start gap-2.5 text-xs text-teal-900">
          <Lock className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <p>
            Every message, lab test request, prescription, and shared diagnostic report is encrypted client-side with <strong>AES-256-GCM</strong> prior to Firestore transmission.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter connected patients by name or @alias..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <SectionCard>
          {acceptedConnections.length === 0 ? (
            <EmptyStateCard
              icon={<MessageSquareLock className="w-5 h-5" />}
              title="No Active Patient Conversations"
              description="Connect with a patient via @alias or accept an incoming follow request to open an end-to-end encrypted thread."
              action={
                <button
                  type="button"
                  onClick={() => {
                    pop();
                    setTab('patients');
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  Find Patient by @alias
                </button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {acceptedConnections.map((conn) => {
                const unread = Number(conn.unreadForDoctor || 0);
                return (
                  <button
                    key={conn.id}
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
                    className="w-full text-left py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {conn.patientName}
                        </span>
                        {conn.patientAlias && (
                          <span className="text-xs font-mono text-teal-700">
                            @{conn.patientAlias}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conn.lastMessagePreview || 'Tap to send encrypted message or lab order'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {conn.lastMessageAt && (
                        <span className="text-[11px] text-slate-400">
                          {new Date(conn.lastMessageAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {unread > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-bold">
                          {unread}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default MessagesScreen;
