import React, { useState } from 'react';
import { 
  QrCode, 
  Copy, 
  Check, 
  Users, 
  CheckCircle2, 
  X, 
  Share2, 
  ShieldCheck,
  UserPlus,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { DoctorPatientChatHub } from '../../components/chat/DoctorPatientChatHub';

export const DoctorConnectScreen: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'qr'>('chat');
  const [copied, setCopied] = useState(false);

  const [pendingRequests, setPendingRequests] = useState([
    { id: 'req1', name: 'Mme. Béatrice Nguemo', phone: '+237 671 22 33 44', date: 'Today at 09:30', reason: 'Annual metabolic checkup follow-up' },
    { id: 'req2', name: 'M. Roland Tchouassi', phone: '+237 690 55 66 77', date: 'Yesterday', reason: 'Post-operative pathology review' }
  ]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://nanolabs.cm/connect/dr-kamga-842');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAccept = (id: string) => {
    setPendingRequests(pendingRequests.filter((r) => r.id !== id));
  };

  const handleDecline = (id: string) => {
    setPendingRequests(pendingRequests.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            Patient Care Team & Chat Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Communicate securely with connected patients, review A4 diagnostic reports, issue test prescriptions, and manage clinical appointments.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat & Clinical Hub</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white/60'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Connect QR & Invites</span>
            {pendingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <DoctorPatientChatHub currentRole="doctor" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Connection QR & Link Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center space-y-5">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#0B1F1D]">
                Physician Connection QR
              </h2>
              <p className="text-xs text-[#6B7F7D]">
                Patients scan this QR code with their nanoLabs patient app to link your practice.
              </p>
            </div>

            <div className="w-52 h-52 bg-slate-50 border-2 border-dashed border-teal-200 rounded-3xl p-4 flex items-center justify-center mx-auto shadow-inner">
              <div className="w-44 h-44 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-xs">
                <QrCode className="w-36 h-36 text-[#0D3B38]" />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Or Share Invitation Link
              </div>
              <div className="flex items-center gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  readOnly
                  value="https://nanolabs.cm/connect/dr-kamga-842"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 focus:outline-hidden"
                />
                <button
                  onClick={handleCopyLink}
                  className="min-h-[40px] px-3.5 bg-[#0F766E] hover:bg-[#0D3B38] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pending Requests & Access Rights */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#0F766E]" />
                  <span>Pending Connection Requests ({pendingRequests.length})</span>
                </h2>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No pending patient invitations at this time.
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{req.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{req.phone}</div>
                        </div>
                        <span className="text-[10px] text-slate-400">{req.date}</span>
                      </div>

                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                        "{req.reason}"
                      </p>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleDecline(req.id)}
                          className="min-h-[36px] px-3 py-1 text-slate-600 hover:text-rose-600 font-bold text-xs cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAccept(req.id)}
                          className="min-h-[36px] px-3.5 py-1 bg-[#0F766E] text-white rounded-lg font-bold text-xs hover:bg-[#0D3B38] cursor-pointer"
                        >
                          Accept to Care Team
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-[#0D3B38]">Encrypted Medical Record Access</p>
                <p className="text-slate-600 leading-relaxed">
                  Connected patients grant revocable, read-only access to their accredited laboratory reports and historical health booklet biomarkers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorConnectScreen;
