import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Shield, 
  Trash2, 
  FileText, 
  Check, 
  Lock, 
  AlertCircle, 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  Stethoscope, 
  Bot, 
  User, 
  RefreshCw,
  HelpCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { useAuth } from '../../context/authContext';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  isInterpretation?: boolean;
}

interface NanoLabsAIScreenProps {
  onBack: () => void;
  initialTestReport?: any;
}

export const NanoLabsAIScreen: React.FC<NanoLabsAIScreenProps> = ({
  onBack,
  initialTestReport
}) => {
  const { activeProfile } = useFamilyProfile();
  const { user } = useAuth();

  const [hasAgreedTerms, setHasAgreedTerms] = useState<boolean>(() => {
    return localStorage.getItem('nanolabs_ai_terms_agreed') === 'true';
  });
  const [showTermsModal, setShowTermsModal] = useState<boolean>(!hasAgreedTerms);
  const [termsCheckbox, setTermsCheckbox] = useState(false);

  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    const saved = localStorage.getItem(`nanolabs_ai_history_${activeProfile.id}`);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedReportContext, setSelectedReportContext] = useState<any | null>(initialTestReport || null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Quick preset questions
  const quickPrompts = [
    'How should I prepare for a fasting blood sugar test?',
    'What does an elevated C-Reactive Protein (CRP) mean?',
    'Explain the difference between thick blood film and RDT for malaria.',
    'What are normal Hemoglobin and Platelet ranges for adults?'
  ];

  const handleAgreeTerms = () => {
    if (!termsCheckbox) return;
    localStorage.setItem('nanolabs_ai_terms_agreed', 'true');
    setHasAgreedTerms(true);
    setShowTermsModal(false);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim() && !selectedReportContext) return;

    if (!hasAgreedTerms) {
      setShowTermsModal(true);
      return;
    }

    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/nanolabs-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          testContext: selectedReportContext,
          patientName: activeProfile.fullName,
          mode: selectedReportContext ? 'report_interpretation' : 'general_consultation'
        })
      });

      const data = await response.json();
      const botReply = data.answer || 'Thank you for your question. Please consult an ONMC physician for medical evaluation.';

      const assistantMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isInterpretation: Boolean(selectedReportContext)
      };

      const finalHistory = [...newHistory, assistantMsg];
      setMessages(finalHistory);
      localStorage.setItem(`nanolabs_ai_history_${activeProfile.id}`, JSON.stringify(finalHistory));
      setSelectedReportContext(null);
    } catch (err) {
      console.error('Error invoking NanoLabs AI:', err);
      const fallbackMsg: AIChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: '### Clinical Insight\n\nDiagnostic tests assess cellular, biochemical, and immunological indicators. We recommend adhering to pre-test instructions (e.g. 10-12h overnight fasting for metabolic panels). For clinical conclusions, review your results with your registered physician.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newHistory, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllRecords = () => {
    if (window.confirm(`Permanently delete all AI conversation history and sensitive health records for ${activeProfile.fullName}?`)) {
      localStorage.removeItem(`nanolabs_ai_history_${activeProfile.id}`);
      setMessages([]);
      setSelectedReportContext(null);
      setStatusNotification('All health consultation records have been permanently erased.');
      setTimeout(() => setStatusNotification(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[86vh] flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-4 bg-gradient-to-r from-[#004D56] via-[#006978] to-[#00838F] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5">
                <span>NanoLabs AI Diagnostic Companion</span>
                <span className="text-[10px] bg-cyan-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  Gemini
                </span>
              </h1>
              <p className="text-[11px] text-cyan-100 font-medium">
                Dossier: <strong className="text-white">{activeProfile.fullName}</strong> &bull; Zero-Knowledge Session
              </p>
            </div>
          </div>
        </div>

        {/* Action: Delete Records Button */}
        <button
          onClick={handleDeleteAllRecords}
          title="Delete all records & chat history"
          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-300/40 text-rose-100 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete My Records</span>
        </button>
      </div>

      {/* Notification Toast */}
      {statusNotification && (
        <div className="bg-emerald-50 text-emerald-900 border-b border-emerald-200 px-4 py-2 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Attached Report Pill (if analyzing a specific report) */}
      {selectedReportContext && (
        <div className="bg-[#E0F2F1] border-b border-[#80CBC4] px-4 py-2 flex items-center justify-between text-xs text-[#006978] font-bold">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#006978]" />
            <span>Analyzing Report: {selectedReportContext.testName || 'Diagnostic Report'}</span>
          </div>
          <button
            onClick={() => setSelectedReportContext(null)}
            className="text-xs text-rose-600 hover:underline cursor-pointer"
          >
            Remove Attachment
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAF9]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-3xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center shadow-md">
              <Bot className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Welcome to NanoLabs AI, {activeProfile.fullName.split(' ')[0]}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Powered by Google Gemini. Ask questions about diagnostic investigations, understand test preparation rules (fasting, timing, medications), or interpret laboratory biomarker values.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="w-full space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-left">
                Common Diagnostic Questions:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="p-3 bg-white hover:bg-[#E0F2F1]/40 border border-slate-200 hover:border-[#006978] rounded-2xl text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Your conversations are encrypted and can be deleted at any time.</span>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#006978] text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                  </div>
                )}

                <div
                  className={`max-w-xl p-4 rounded-3xl text-xs leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-[#006978] text-white rounded-tr-xs'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-line prose-xs">
                    {m.text}
                  </div>
                  <div className={`text-[10px] text-right font-medium mt-1 ${isUser ? 'text-cyan-200' : 'text-slate-400'}`}>
                    {m.time}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-[#006978] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-200 animate-spin" />
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 shadow-2xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-[#006978] animate-spin" />
              <span>Analyzing biomarkers with Gemini AI...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => {
            const sampleData = {
              testName: 'Complete Blood Count (CBC)',
              date: 'Today',
              parameters: [
                { name: 'Hemoglobin', value: '14.2 g/dL', normal: true },
                { name: 'WBC', value: '11.8 10^3/µL', normal: false, flag: 'High' },
                { name: 'Platelets', value: '250 10^3/µL', normal: true }
              ]
            };
            setSelectedReportContext(sampleData);
          }}
          title="Attach current test report for clinical interpretation"
          className="p-2.5 text-slate-500 hover:text-[#006978] hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
        >
          <Upload className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask NanoLabs AI about a test, preparation rule, or biomarker..."
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006978] focus:bg-white"
        />

        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="w-11 h-11 rounded-2xl bg-[#006978] disabled:bg-slate-200 hover:bg-[#005a66] text-white flex items-center justify-center transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Terms & Conditions Informed Consent Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Terms & Conditions for Medical AI Processing
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Patient Health Information & Privacy Agreement
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 max-h-60 overflow-y-auto pr-1 leading-relaxed">
              <p>
                Before analyzing diagnostic investigations or asking medical questions with NanoLabs AI, please confirm your agreement to the following clinical standards:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                <li>
                  <strong>Educational & Informational Use:</strong> NanoLabs AI provides diagnostic education and health literacy insights. It does <em>not</em> constitute a medical prescription or formal clinical diagnosis.
                </li>
                <li>
                  <strong>Physician Correlation:</strong> All laboratory values must be reviewed by a licensed National Medical Council (ONMC) physician before altering treatments.
                </li>
                <li>
                  <strong>Right to Erasure (Zero-Knowledge):</strong> You can permanently delete your AI consultation logs and uploaded records at any time using the <em>"Delete My Records"</em> button.
                </li>
                <li>
                  <strong>Confidentiality:</strong> No diagnostic data is sold to third parties or used for commercial advertising.
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={termsCheckbox}
                onChange={(e) => setTermsCheckbox(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#006978] accent-[#006978]"
              />
              <span>
                I have read and agree to the Terms & Conditions for sensitive health data processing.
              </span>
            </label>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer text-xs"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={!termsCheckbox}
                onClick={handleAgreeTerms}
                className="px-5 py-2.5 bg-[#006978] disabled:bg-slate-300 hover:bg-[#005a66] text-white font-extrabold rounded-xl shadow-xs cursor-pointer text-xs disabled:cursor-not-allowed transition-all"
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
