import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  FileText, 
  Calendar, 
  Clock, 
  Pill, 
  Stethoscope, 
  CheckCircle2, 
  Share2, 
  ShieldCheck, 
  Building2, 
  Plus, 
  X, 
  ArrowRight, 
  User, 
  Phone, 
  MessageSquare,
  Sparkles,
  ExternalLink,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  doctorChatService, 
  ChatMessage, 
  DoctorPatientConnection 
} from '../../services/doctorChatService';
import { useAuth } from '../../context/authContext';
import { PatientBooking } from '../../services/limsService';
import { getBatchesForPatient } from '../../services/batchService';
import { TestBatch } from '../../types';

export interface DoctorPatientChatHubProps {
  currentRole?: 'patient' | 'doctor';
  currentPatientId?: string;
  currentPatientName?: string;
  currentDoctorId?: string;
  currentDoctorName?: string;
  onNavigateToBooking?: (preSelectedTests?: any[]) => void;
  onOpenReportModal?: (bookingId: string, testName?: string) => void;
}

export const DoctorPatientChatHub: React.FC<DoctorPatientChatHubProps> = ({
  currentRole = 'patient',
  currentPatientId = 'demo_patient',
  currentPatientName = 'Mme. Claire Ngo',
  currentDoctorId = 'doc_kamga_101',
  currentDoctorName = 'Dr. Joseph Kamga, MD',
  onNavigateToBooking,
  onOpenReportModal
}) => {
  const { user } = useAuth();
  const effectiveRole = currentRole || (user?.role === 'doctor' ? 'doctor' : 'patient');

  const [connections, setConnections] = useState<DoctorPatientConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<DoctorPatientConnection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  // Modals for clinical doctor actions inside chat
  const [showPrescribeTestModal, setShowPrescribeTestModal] = useState(false);
  const [showPrescribeMedModal, setShowPrescribeMedModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showShareResultModal, setShowShareResultModal] = useState(false);
  const [patientBatches, setPatientBatches] = useState<TestBatch[]>([]);

  // Forms states
  const [testPrescriptionIndication, setTestPrescriptionIndication] = useState('Diagnostic workup for persistent fatigue and metabolic monitoring');
  const [selectedTestsToPrescribe, setSelectedTestsToPrescribe] = useState<string[]>(['FBC', 'GLYC']);

  const [medPrescriptionIndication, setMedPrescriptionIndication] = useState('Post-consultation supportive protocol');
  const [medList, setMedList] = useState<Array<{ name: string; dosage: string; frequency: string; duration: string; instructions: string }>>([
    { name: 'Ferrous Sulfate + Folic Acid', dosage: '66mg elemental iron', frequency: 'Once daily (morning)', duration: '30 days', instructions: 'Take with orange juice or water' }
  ]);

  const [appointmentDate, setAppointmentDate] = useState('2026-09-25');
  const [appointmentTime, setAppointmentTime] = useState('11:00 AM');
  const [appointmentType, setAppointmentType] = useState<'in_person' | 'teleconsultation' | 'lab_review'>('in_person');
  const [appointmentLocation, setAppointmentLocation] = useState('Clinique des Roses, Akwa - Douala (Cabinet 3B)');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load connections and messages
  useEffect(() => {
    const conns = doctorChatService.getConnections();
    setConnections(conns);
    if (conns.length > 0) {
      setSelectedConnection(conns[0]);
    }
    const batches = getBatchesForPatient(user?.id || 'demo_patient', user?.phone, user?.name);
    setPatientBatches(batches);
  }, [user]);

  useEffect(() => {
    if (selectedConnection) {
      const msgs = doctorChatService.getMessages(selectedConnection.patientId, selectedConnection.doctorId);
      setMessages(msgs);
    }
  }, [selectedConnection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConnection) return;

    const newMsg = doctorChatService.sendMessage({
      senderId: effectiveRole === 'doctor' ? selectedConnection.doctorId : selectedConnection.patientId,
      senderName: effectiveRole === 'doctor' ? selectedConnection.doctorName : selectedConnection.patientName,
      senderRole: effectiveRole,
      recipientId: effectiveRole === 'doctor' ? selectedConnection.patientId : selectedConnection.doctorId,
      recipientName: effectiveRole === 'doctor' ? selectedConnection.patientName : selectedConnection.doctorName,
      type: 'text',
      content: inputText.trim()
    });

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  // Submit test prescription
  const handleCreateTestPrescription = () => {
    if (!selectedConnection) return;
    const testCatalogMap: Record<string, { code: string; name: string; category: string }> = {
      'FBC': { code: 'NFS-FBC', name: 'Complete Blood Count (NFS / Hémogramme)', category: 'Hematology' },
      'GLYC': { code: 'GLYC', name: 'Fasting Blood Glucose (Glycémie à Jeûn)', category: 'Biochemistry' },
      'LIPID': { code: 'LIPID', name: 'Lipid Profile (Bilan Lipidique Complet)', category: 'Biochemistry' },
      'WIDAL': { code: 'WIDAL', name: 'Widal & Félix Serodiagnosis', category: 'Serology' },
      'URINE': { code: 'ECBU', name: 'Urinalysis & Chemistry (ECBU)', category: 'Microbiology' },
      'CREAT': { code: 'CREAT', name: 'Serum Creatinine & eGFR (Bilan Rénal)', category: 'Biochemistry' }
    };

    const testsToPrescribe = selectedTestsToPrescribe.map(key => testCatalogMap[key] || { code: key, name: key, category: 'Clinical Biology' });

    const newMsg = doctorChatService.prescribeTests({
      doctorId: selectedConnection.doctorId,
      doctorName: selectedConnection.doctorName,
      patientId: selectedConnection.patientId,
      patientName: selectedConnection.patientName,
      indication: testPrescriptionIndication,
      tests: testsToPrescribe
    });

    setMessages(prev => [...prev, newMsg]);
    setShowPrescribeTestModal(false);
  };

  // Submit medication prescription
  const handleCreateMedPrescription = () => {
    if (!selectedConnection) return;
    const newMsg = doctorChatService.prescribeMedications({
      doctorId: selectedConnection.doctorId,
      doctorName: selectedConnection.doctorName,
      patientId: selectedConnection.patientId,
      patientName: selectedConnection.patientName,
      indication: medPrescriptionIndication,
      medications: medList.map((m, idx) => ({ ...m, id: `med-${Date.now()}-${idx}` }))
    });

    setMessages(prev => [...prev, newMsg]);
    setShowPrescribeMedModal(false);
  };

  // Submit appointment
  const handleScheduleAppointment = () => {
    if (!selectedConnection) return;
    const newMsg = doctorChatService.scheduleAppointment({
      senderId: effectiveRole === 'doctor' ? selectedConnection.doctorId : selectedConnection.patientId,
      senderName: effectiveRole === 'doctor' ? selectedConnection.doctorName : selectedConnection.patientName,
      senderRole: effectiveRole,
      recipientId: effectiveRole === 'doctor' ? selectedConnection.patientId : selectedConnection.doctorId,
      recipientName: effectiveRole === 'doctor' ? selectedConnection.patientName : selectedConnection.doctorName,
      date: appointmentDate,
      time: appointmentTime,
      type: appointmentType,
      location: appointmentLocation
    });

    setMessages(prev => [...prev, newMsg]);
    setShowAppointmentModal(false);
  };

  // Handle patient 1-tap "Book Test in nanoLabs"
  const handleBookClick = (msg: ChatMessage) => {
    if (!msg.metadata?.prescribedTests) return;
    doctorChatService.markPrescriptionBooked(msg.id, `BK-${Date.now().toString().slice(-6)}`);
    setMessages(prev =>
      prev.map(m => (m.id === msg.id && m.metadata ? { ...m, metadata: { ...m.metadata, prescriptionStatus: 'booked' } } : m))
    );

    if (onNavigateToBooking) {
      onNavigateToBooking(msg.metadata.prescribedTests);
    }
  };

  // Patient sharing real sample result
  const handleShareResultFromChat = (type: 'fbc' | 'batch') => {
    if (!selectedConnection) return;
    const newMsg = doctorChatService.shareTestResult({
      senderId: selectedConnection.patientId,
      senderName: selectedConnection.patientName,
      doctorId: selectedConnection.doctorId,
      doctorName: selectedConnection.doctorName,
      testName: type === 'fbc' ? 'Complete Blood Count (NFS)' : 'Complete Health Checkup Batch',
      bookingCode: 'BK-2026-0813-001',
      bookingId: 'BK-2026-0813-001',
      resultSummary: type === 'fbc' ? 'Hb 13.6 g/dL, WBC 6,800 /mm³, Platelets 265,000 /mm³ (Normal)' : '4 Tests Completed (FBC, Glucose, Lipid, Urinalysis)',
      isBatch: type === 'batch',
      batchTestCount: type === 'batch' ? 4 : 1
    });

    setMessages(prev => [...prev, newMsg]);
    setShowShareResultModal(false);
  };

  const handleShareSpecificBatch = (batch: TestBatch) => {
    if (!selectedConnection) return;
    const testNames = (batch.tests || []).map(t => t.name).join(', ');
    const summary = batch.tests && batch.tests.length > 0 
      ? batch.tests.map(t => `${t.name}: ${t.resultValue || 'Validated'}`).join(' • ')
      : 'All laboratory panels verified and approved.';

    const newMsg = doctorChatService.shareTestResult({
      senderId: selectedConnection.patientId,
      senderName: selectedConnection.patientName,
      doctorId: selectedConnection.doctorId,
      doctorName: selectedConnection.doctorName,
      testName: batch.tests && batch.tests.length === 1 ? batch.tests[0].name : `Diagnostic Dossier: ${batch.batchNumber}`,
      bookingCode: batch.batchNumber,
      bookingId: batch.id,
      resultSummary: summary,
      isBatch: (batch.tests || []).length > 1,
      batchTestCount: (batch.tests || []).length
    });

    setMessages(prev => [...prev, newMsg]);
    setShowShareResultModal(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[780px] max-w-5xl mx-auto overflow-hidden animate-in fade-in">
      
      {/* ========================================================================= */}
      {/* 1. CHAT HEADER: Connected Care Partner Details & Verified Badges          */}
      {/* ========================================================================= */}
      <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            {effectiveRole === 'patient' ? <Stethoscope className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-white">
                {effectiveRole === 'patient' ? selectedConnection?.doctorName : selectedConnection?.patientName}
              </h2>
              <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-bold border border-teal-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Connection</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {effectiveRole === 'patient' 
                ? `${selectedConnection?.doctorSpecialty} • ${selectedConnection?.doctorHospital}`
                : `Connected Patient • ${selectedConnection?.patientPhone}`}
            </p>
          </div>
        </div>

        {/* Action button to share results if patient */}
        {effectiveRole === 'patient' && (
          <button
            type="button"
            onClick={() => setShowShareResultModal(true)}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share Lab Result</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MESSAGE STREAM: Interactive Bubbles for Text, Tests, Meds, Apt         */}
      {/* ========================================================================= */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50">
        <div className="text-center my-2">
          <span className="px-3 py-1 bg-white border border-slate-200 text-slate-500 text-[11px] font-medium rounded-full shadow-2xs">
            🔒 End-to-end encrypted medical consultation channel
          </span>
        </div>

        {messages.map((msg) => {
          const isSender = (effectiveRole === 'patient' && msg.senderRole === 'patient') || (effectiveRole === 'doctor' && msg.senderRole === 'doctor');
          const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} max-w-2xl ${isSender ? 'ml-auto' : 'mr-auto'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                <span className="font-bold text-slate-700">{msg.senderName}</span>
                <span>•</span>
                <span>{time}</span>
              </div>

              {/* Standard Text Message */}
              {msg.type === 'text' && (
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-lg shadow-2xs ${
                    isSender
                      ? 'bg-teal-700 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  {msg.content}
                </div>
              )}

              {/* Shared A4 Diagnostic Result Card */}
              {msg.type === 'result_share' && (
                <div className="bg-white border-2 border-teal-600/60 rounded-2xl p-4 shadow-sm max-w-md space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wide block">
                          {msg.metadata?.isBatch ? 'CONSOLIDATED BATCH REPORT' : 'OFFICIAL A4 DIAGNOSTIC REPORT'}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {msg.metadata?.testName || 'Laboratory Result'}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {msg.metadata?.bookingCode || 'NL-2026'}
                    </span>
                  </div>

                  {msg.metadata?.resultSummary && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                      <strong>Summary :</strong> {msg.metadata.resultSummary}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-teal-800 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Biologically Certified</span>
                    </span>

                    {onOpenReportModal && (
                      <button
                        type="button"
                        onClick={() => onOpenReportModal(msg.metadata?.bookingId || 'BK-2026-0813-001', msg.metadata?.testName)}
                        className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>View A4 Report</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Digital Test Prescription with 1-TAP "Book Test in nanoLabs" Button */}
              {msg.type === 'test_prescription' && (
                <div className="bg-white border-2 border-indigo-500 rounded-2xl p-4 shadow-md max-w-lg space-y-3 w-full">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wide block">
                          OFFICIAL DIGITAL LABORATORY ORDER
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {msg.content}
                        </h4>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Rx Verified
                    </span>
                  </div>

                  {msg.metadata?.clinicalIndication && (
                    <div className="text-xs text-slate-600 italic bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                      <strong>Clinical Indication :</strong> "{msg.metadata.clinicalIndication}"
                    </div>
                  )}

                  {/* List of prescribed tests */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Prescribed Analyses :
                    </span>
                    {msg.metadata?.prescribedTests?.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span className="font-bold text-slate-900">{t.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">{t.category}</span>
                      </div>
                    ))}
                  </div>

                  {/* 1-Tap Booking Action for Patient */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500">
                      Home collection or walk-in available
                    </span>

                    {msg.metadata?.prescriptionStatus === 'booked' ? (
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Booked in nanoLabs</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBookClick(msg)}
                        className="px-4 py-2 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Book Test in nanoLabs</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Medication Prescriptions & Clinical Notes */}
              {msg.type === 'medication_prescription' && (
                <div className="bg-white border-2 border-amber-500 rounded-2xl p-4 shadow-sm max-w-lg space-y-3 w-full">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wide block">
                          MEDICATION PRESCRIPTION PROTOCOL
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {msg.content}
                        </h4>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Valid 30 Days
                    </span>
                  </div>

                  {msg.metadata?.clinicalIndication && (
                    <p className="text-xs text-slate-600 italic">
                      Indication: {msg.metadata.clinicalIndication}
                    </p>
                  )}

                  <div className="space-y-2">
                    {msg.metadata?.medications?.map((m, idx) => (
                      <div key={idx} className="p-2.5 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900">{m.name}</span>
                          <span className="font-bold text-amber-800">{m.dosage}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{m.frequency} &bull; Duration: {m.duration}</span>
                        </div>
                        {m.instructions && (
                          <div className="text-[10px] text-slate-500 italic">
                            Instructions: {m.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments */}
              {msg.type === 'appointment' && (
                <div className="bg-white border-2 border-teal-600 rounded-2xl p-4 shadow-sm max-w-md space-y-3 w-full">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wide block">
                          CLINICAL APPOINTMENT
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                          {msg.content}
                        </h4>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                      Confirmed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Date & Time</span>
                      <span className="font-bold text-slate-900">
                        {msg.metadata?.appointmentDate} at {msg.metadata?.appointmentTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Format</span>
                      <span className="font-bold text-teal-800 capitalize">
                        {msg.metadata?.appointmentType?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200/80">
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Location</span>
                      <span className="text-slate-700">{msg.metadata?.location}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ========================================================================= */}
      {/* 3. DOCTOR CLINICAL QUICK ACTIONS BAR & CHAT INPUT                         */}
      {/* ========================================================================= */}
      <div className="p-3 bg-white border-t border-slate-200 space-y-2 shrink-0">
        
        {/* Doctor clinical action pills (available when doctor, or quick toggles) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Clinical Tools:
          </span>
          <button
            type="button"
            onClick={() => setShowPrescribeTestModal(true)}
            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors border border-indigo-200 shrink-0"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Prescribe Tests</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrescribeMedModal(true)}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors border border-amber-200 shrink-0"
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Prescribe Meds</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAppointmentModal(true)}
            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors border border-teal-200 shrink-0"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Follow-up</span>
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendText} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a clinical note, clinical update or question..."
            className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PRESCRIBE TESTS                                                  */}
      {/* ========================================================================= */}
      {showPrescribeTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                <span>Issue Digital Test Prescription</span>
              </h3>
              <button onClick={() => setShowPrescribeTestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Indication / Diagnosis:</label>
                <input
                  type="text"
                  value={testPrescriptionIndication}
                  onChange={(e) => setTestPrescriptionIndication(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Diagnostic Tests to Order:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {[
                    { id: 'FBC', name: 'Complete Blood Count (NFS / Hémogramme)' },
                    { id: 'GLYC', name: 'Fasting Blood Glucose (Glycémie)' },
                    { id: 'LIPID', name: 'Lipid Profile (Cholesterol, HDL, LDL, Trig)' },
                    { id: 'WIDAL', name: 'Widal & Félix (Typhoid Serology)' },
                    { id: 'URINE', name: 'Urinalysis & Chemistry (ECBU)' },
                    { id: 'CREAT', name: 'Serum Creatinine & eGFR (Kidney)' }
                  ].map((t) => {
                    const isChecked = selectedTestsToPrescribe.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${
                          isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedTestsToPrescribe(selectedTestsToPrescribe.filter(x => x !== t.id));
                            } else {
                              setSelectedTestsToPrescribe([...selectedTestsToPrescribe, t.id]);
                            }
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-bold">{t.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrescribeTestModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTestPrescription}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <span>Send Prescription to Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRESCRIBE MEDICATIONS                                            */}
      {/* ========================================================================= */}
      {showPrescribeMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-amber-600" />
                <span>Send Medication Protocol</span>
              </h3>
              <button onClick={() => setShowPrescribeMedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Note / Indication:</label>
                <input
                  type="text"
                  value={medPrescriptionIndication}
                  onChange={(e) => setMedPrescriptionIndication(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Medication List:</label>
                <div className="space-y-2">
                  {medList.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => {
                          const updated = [...medList];
                          updated[idx].name = e.target.value;
                          setMedList(updated);
                        }}
                        placeholder="Drug Name (e.g. Amoxicillin 1g)"
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => {
                            const updated = [...medList];
                            updated[idx].frequency = e.target.value;
                            setMedList(updated);
                          }}
                          placeholder="Frequency (e.g. 2x daily)"
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                        />
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => {
                            const updated = [...medList];
                            updated[idx].duration = e.target.value;
                            setMedList(updated);
                          }}
                          placeholder="Duration (e.g. 7 days)"
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrescribeMedModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateMedPrescription}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <span>Send to Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SCHEDULE APPOINTMENT                                             */}
      {/* ========================================================================= */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span>Schedule Clinical Appointment</span>
              </h3>
              <button onClick={() => setShowAppointmentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date:</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time:</label>
                  <input
                    type="text"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Consultation Format:</label>
                <select
                  value={appointmentType}
                  onChange={(e: any) => setAppointmentType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="in_person">In-Person Consultation (Hospital / Clinic)</option>
                  <option value="teleconsultation">Encrypted Teleconsultation</option>
                  <option value="lab_review">Post-Lab Diagnostic Review</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location / Clinic:</label>
                <input
                  type="text"
                  value={appointmentLocation}
                  onChange={(e) => setAppointmentLocation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAppointmentModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleAppointment}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <span>Confirm & Post in Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PATIENT SHARE RESULT SELECTOR                                    */}
      {/* ========================================================================= */}
      {showShareResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-teal-600" />
                <span>Share Verified Lab Report</span>
              </h3>
              <button onClick={() => setShowShareResultModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select which validated diagnostic report from your health record you want to transmit to your physician:
            </p>

            <div className="space-y-2 text-xs max-h-72 overflow-y-auto pr-1">
              {patientBatches.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <p className="text-slate-500 font-medium">No diagnostic batches recorded yet.</p>
                  <button
                    type="button"
                    onClick={() => handleShareResultFromChat('fbc')}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                  >
                    Share Sample Diagnostic Summary
                  </button>
                </div>
              ) : (
                patientBatches.map((batch) => {
                  const testsCount = (batch.tests || []).length;
                  const isValidated = batch.status === 'ready' || batch.status === 'validation';
                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => handleShareSpecificBatch(batch)}
                      className="w-full p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-black text-teal-900">{batch.batchNumber}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${
                            isValidated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isValidated ? 'Validated' : 'In Progress'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 truncate">
                          {batch.tests && batch.tests.length === 1 ? batch.tests[0].name : `${testsCount} Test Diagnostic Panel`}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {(batch.tests || []).map(t => t.name).join(', ')}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-teal-600 shrink-0" />
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowShareResultModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorPatientChatHub;
