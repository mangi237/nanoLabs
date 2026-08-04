import React, { useState } from 'react';
import Header from '../../components/common/Header';
import { Share2, Mail, Copy, CheckCircle2, ArrowLeft, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { sendEmail } from '../../services/emailService';

interface ShareResultsScreenProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const ShareResultsScreen: React.FC<ShareResultsScreenProps> = ({
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  const [recipientEmail, setRecipientEmail] = useState('doctor.smith@clinic.org');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState('');
  const shareUrl = 'https://nanolabs.health/share/token-882019-sec';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSent(false);
    setSendResultMsg('');

    const res = await sendEmail(
      recipientEmail,
      'Shared Patient Lab Result Access Link - nanoLabs',
      `Hello Doctor,\n\nYou have been granted temporary secure access to view confidential patient diagnostic reports.\n\nDirect Access Link: ${shareUrl}\n\nThank you,\nnanoLabs Health Care Network`
    );

    setSending(false);
    if (res.success) {
      setSent(true);
      setSendResultMsg(`Secure access link sent to ${recipientEmail}`);
      setTimeout(() => setSent(false), 5000);
    } else {
      setSendResultMsg('Failed to send email. Please check internet connection.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Share Lab Results"
        subtitle="Grant temporary access to healthcare providers"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </button>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Encrypted Sharing Link</h2>
              <p className="text-xs text-slate-500">Generate temporary access key for external doctors</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Secure Access URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physician Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="physician@hospital.org"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {sent && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {sendResultMsg || 'Secure access link sent to physician!'}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    Send Encrypted Email
                    <Mail className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShareResultsScreen;
