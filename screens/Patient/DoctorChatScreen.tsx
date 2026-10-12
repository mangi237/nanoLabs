import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  Download, 
  Phone, 
  Video, 
  CheckCheck, 
  Paperclip,
  Share2,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import { DoctorDirectoryItem, REAL_DOCTORS_DIRECTORY } from './MyDoctorsScreen';
import { useFamilyProfile } from '../../context/familyProfileContext';

export interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  text?: string;
  time: string;
  attachment?: {
    title: string;
    type: 'result' | 'prescription';
    code?: string;
  };
}

interface DoctorChatScreenProps {
  doctor?: DoctorDirectoryItem;
  onBack: () => void;
  onDownloadPrescription?: () => void;
}

export const DoctorChatScreen: React.FC<DoctorChatScreenProps> = ({
  doctor = REAL_DOCTORS_DIRECTORY[0],
  onBack,
  onDownloadPrescription
}) => {
  const { activeProfile } = useFamilyProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  const chatStorageKey = `nanolabs_chat_${doctor.id}_${activeProfile.id}`;

  // Load chat history for this active patient and doctor
  useEffect(() => {
    const raw = localStorage.getItem(chatStorageKey);
    if (raw) {
      try {
        setMessages(JSON.parse(raw));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [chatStorageKey]);

  const saveMessages = (list: ChatMessage[]) => {
    localStorage.setItem(chatStorageKey, JSON.stringify(list));
    setMessages(list);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const patientMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'patient',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, patientMsg];
    saveMessages(updated);
    setInputText('');

    // If it was the first message, simulate doctor acknowledgment
    if (messages.length === 0) {
      setTimeout(() => {
        const docReply: ChatMessage = {
          id: `msg-doc-${Date.now()}`,
          sender: 'doctor',
          text: `Bonjour ${activeProfile.fullName.split(' ')[0]}, Dr. ${doctor.name.split(' ').slice(1).join(' ')} here. I have received your dossier. Please share your latest lab report or symptoms, and I will assist you.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        saveMessages([...updated, docReply]);
      }, 1500);
    }
  };

  const handleShareResult = () => {
    const resultMsg: ChatMessage = {
      id: `att-${Date.now()}`,
      sender: 'patient',
      text: `Shared verified laboratory dossier for ${activeProfile.fullName}`,
      attachment: {
        title: 'Complete Blood Count (CBC) - Certified Report',
        type: 'result',
        code: 'NS-884920'
      },
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    saveMessages([...messages, resultMsg]);
  };

  return (
    <div className="max-w-3xl mx-auto h-[82vh] flex flex-col text-slate-900 animate-in fade-in duration-300 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src={doctor.avatarUrl}
              alt={doctor.name}
              className="w-11 h-11 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">{doctor.name}</h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available
                </span>
                <span>&bull;</span>
                <span>{doctor.specialty}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://waspito.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="Launch Waspito Video Teleconsult"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Video Call</span>
          </a>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAF9]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-3xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center shadow-xs">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900">
                Direct Consultation with {doctor.name}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect directly on behalf of <strong className="text-slate-800">{activeProfile.fullName}</strong>. Share test results, discuss treatment plans, or renew prescriptions.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full pt-1">
              <button
                onClick={handleShareResult}
                className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-[#006978] rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Share Latest Diagnostic Report</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isDoctor = m.sender === 'doctor';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'}`}
              >
                {m.attachment ? (
                  <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs max-w-sm space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#E0F2F1] text-[#006978] flex items-center justify-center font-bold shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">{m.attachment.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Ref: {m.attachment.code}</span>
                      </div>
                    </div>
                    {m.text && <p className="text-xs text-slate-600">{m.text}</p>}
                    <span className="text-[10px] text-slate-400 block text-right">{m.time}</span>
                  </div>
                ) : (
                  <div
                    className={`max-w-sm sm:max-w-md p-3.5 rounded-3xl text-xs leading-relaxed shadow-2xs ${
                      isDoctor
                        ? 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                        : 'bg-[#006978] text-white rounded-tr-xs'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span
                      className={`text-[9px] block text-right mt-1 font-semibold ${
                        isDoctor ? 'text-slate-400' : 'text-cyan-200'
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
        <button
          type="button"
          onClick={handleShareResult}
          title="Share Lab Result"
          className="p-2.5 text-slate-400 hover:text-[#006978] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${doctor.name.split(' ')[0]} for ${activeProfile.fullName.split(' ')[0]}...`}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006978] focus:bg-white"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-2xl bg-[#006978] disabled:bg-slate-200 hover:bg-[#005a66] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
