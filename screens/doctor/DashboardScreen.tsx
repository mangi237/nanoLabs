import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Video, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Plus, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Stethoscope, 
  MapPin, 
  Building2, 
  CheckCheck, 
  Activity, 
  FilePlus,
  Filter,
  Check,
  UserCheck,
  Share2,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { 
  clinicalAppointmentService, 
  ClinicalAppointment, 
  PatientDirectoryProfile, 
  ConsultationType, 
  AppointmentStatus,
  INITIAL_PATIENT_DIRECTORY 
} from '../../services/clinalAppointmentService';
import { doctorChatService } from '../../services/doctorChatService';

interface DoctorDashboardProps {
  onNavigateNewRequest: () => void;
  onNavigatePatients: () => void;
  onNavigateReports: () => void;
  onNavigateDirectory: () => void;
  onNavigateConnect: () => void;
}

export const DashboardScreen: React.FC<DoctorDashboardProps> = ({
  onNavigateNewRequest,
  onNavigatePatients,
  onNavigateReports,
  onNavigateDirectory,
  onNavigateConnect
}) => {
  const { user, lab } = useAuth();
  const doctorName = user?.name || user?.fullName || 'Dr. Emmanuel Nkuo, MD';
  const doctorSpecialty = user?.specialty || 'Internal Medicine & Clinical Diagnostics';
  const doctorId = user?.id || 'doc_kamga_101';
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  // Appointments State
  const [appointments, setAppointments] = useState<ClinicalAppointment[]>([]);
  const [scheduleTab, setScheduleTab] = useState<'today' | 'upcoming' | 'requests' | 'all'>('today');
  const [selectedAppointment, setSelectedAppointment] = useState<ClinicalAppointment | null>(null);

  // Patient Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientDirectoryProfile[]>(INITIAL_PATIENT_DIRECTORY);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<PatientDirectoryProfile | null>(null);

  // Schedule Appointment Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDirectoryProfile | null>(null);
  const [appointmentDate, setAppointmentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState('10:30 AM');
  const [appointmentType, setAppointmentType] = useState<ConsultationType>('in_person');
  const [appointmentLocation, setAppointmentLocation] = useState('Cabinet Médical Akwa, Salle 2, Douala');
  const [consultationReason, setConsultationReason] = useState('Routine clinical review of laboratory diagnostic profile');
  const [prepInstructions, setPrepInstructions] = useState('Bring medical booklet & fasting for 8h if blood glucose/lipids requested.');
  const [sendViaSms, setSendViaSms] = useState(true);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(true);
  const [bookingSuccessNotice, setBookingSuccessNotice] = useState<string | null>(null);

  // Quick Chat Modal State
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chattingWithPatient, setChattingWithPatient] = useState<PatientDirectoryProfile | null>(null);
  const [chatMessageText, setChatMessageText] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  // Telehealth Video Modal State
  const [activeVideoCall, setActiveVideoCall] = useState<ClinicalAppointment | null>(null);

  // Doctor Availability Toggle
  const [isAvailableForConsults, setIsAvailableForConsults] = useState(true);

  // Load appointments
  const refreshAppointments = () => {
    const list = clinicalAppointmentService.getAppointmentsForDoctor(doctorId);
    setAppointments(list);
  };

  useEffect(() => {
    refreshAppointments();
    const handleUpdate = () => refreshAppointments();
    window.addEventListener('nanolabs_appointments_updated', handleUpdate);
    return () => window.removeEventListener('nanolabs_appointments_updated', handleUpdate);
  }, [doctorId]);

  // Handle Search Input & Fetch real patients cohort
  useEffect(() => {
    let isMounted = true;
    const loadRealCohort = async () => {
      try {
        const res = clinicalAppointmentService.searchPatients(searchQuery);
        if (res.length > 0) {
          if (isMounted) setSearchResults(res);
          return;
        }
        // Load dynamically from limsService bookings
        const { limsService } = await import('../../services/limsService');
        const bList = await limsService.fetchAllBookings(targetLabId);
        const map: Record<string, PatientDirectoryProfile> = {};
        bList.forEach(b => {
          const key = b.patientPid || b.patientId || b.id;
          if (!map[key]) {
            map[key] = {
              id: key,
              name: b.patientName,
              nickname: (b as any).patientNickname || b.patientName.split(' ')[0],
              phone: b.patientPhone || '+237 600 00 00 00',
              email: b.patientEmail,
              age: b.patientAge || 35,
              gender: b.patientGender || 'Adult',
              bloodGroup: 'O+',
              hasInsurance: Boolean(b.insuranceProvider || b.hasInsurance),
              insuranceProvider: b.insuranceProvider,
              societe: (b as any).employerSociete || (b as any).societe || 'Patient',
              matricule: (b as any).insurancePolicyNumber || (b as any).matricule,
              city: (b as any).city || 'Douala'
            };
          }
        });
        const livePatients = Object.values(map);
        if (isMounted) {
          setSearchResults(livePatients);
        }
      } catch (e) {
        console.error('Error loading real patient cohort in doctor dashboard:', e);
      }
    };
    loadRealCohort();
    return () => { isMounted = false; };
  }, [searchQuery, targetLabId]);

  // Filter appointments for schedule tabs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const upcomingAppointments = appointments.filter(a => a.date > todayStr && a.status !== 'cancelled');
  const incomingRequests = appointments.filter(a => a.status === 'requested');

  const displayedAppointments = (() => {
    switch (scheduleTab) {
      case 'today':
        return todayAppointments;
      case 'upcoming':
        return upcomingAppointments;
      case 'requests':
        return incomingRequests;
      case 'all':
      default:
        return appointments;
    }
  })();

  // Open modal with specific patient
  const handleOpenScheduleForPatient = (patient: PatientDirectoryProfile) => {
    setSelectedPatient(patient);
    setIsScheduleModalOpen(true);
    setShowPatientResults(false);
  };

  // Submit new appointment
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const newApp = clinicalAppointmentService.createAndSendAppointment({
      doctorId,
      doctorName,
      doctorSpecialty,
      doctorHospital: lab?.name || 'Biodiagnostic Labo / Partner Clinic',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientNickname: selectedPatient.nickname,
      patientPhone: selectedPatient.phone,
      patientAge: selectedPatient.age,
      patientGender: selectedPatient.gender,
      patientInsurance: selectedPatient.insuranceProvider,
      patientSociete: selectedPatient.societe,
      date: appointmentDate,
      time: appointmentTime,
      type: appointmentType,
      status: 'confirmed',
      location: appointmentLocation,
      reason: consultationReason,
      prepInstructions,
      smsNotificationSent: sendViaSms,
      whatsappNotificationSent: sendViaWhatsApp
    });

    refreshAppointments();
    setIsScheduleModalOpen(false);
    setBookingSuccessNotice(
      `Appointment successfully scheduled & dispatched to ${selectedPatient.name} for ${appointmentDate} at ${appointmentTime}! Notification delivered via ${sendViaWhatsApp ? 'WhatsApp + ' : ''}${sendViaSms ? 'SMS + ' : ''}In-App.`
    );
    setTimeout(() => setBookingSuccessNotice(null), 6000);
  };

  // Status handlers
  const handleConfirmAppointment = (id: string) => {
    clinicalAppointmentService.updateAppointmentStatus(id, 'confirmed');
    refreshAppointments();
  };

  const handleCompleteAppointment = (id: string) => {
    clinicalAppointmentService.updateAppointmentStatus(id, 'completed');
    refreshAppointments();
  };

  const handleSendReminder = (id: string, channel: 'sms' | 'whatsapp') => {
    const res = clinicalAppointmentService.sendAppointmentReminder(id, channel);
    setBookingSuccessNotice(res.message);
    setTimeout(() => setBookingSuccessNotice(null), 4000);
    refreshAppointments();
  };

  // Quick Chat Handler
  const handleOpenChatWithPatient = (patient: PatientDirectoryProfile) => {
    setChattingWithPatient(patient);
    setIsChatModalOpen(true);
    setShowPatientResults(false);
    // Load initial chat preview
    const conv = doctorChatService.getMessages(doctorId, patient.id);
    setChatHistory(conv);
  };

  const handleSendQuickChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageText.trim() || !chattingWithPatient) return;

    doctorChatService.sendMessage({
      senderId: doctorId,
      senderName: doctorName,
      senderRole: 'doctor',
      recipientId: chattingWithPatient.id,
      recipientName: chattingWithPatient.name,
      type: 'text',
      content: chatMessageText.trim()
    });

    setChatMessageText('');
    const updated = doctorChatService.getMessages(doctorId, chattingWithPatient.id);
    setChatHistory(updated);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-slate-900 animate-in fade-in duration-300">
      {/* Toast Notice */}
      {bookingSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-xs shadow-md animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{bookingSuccessNotice}</span>
          </div>
          <button 
            onClick={() => setBookingSuccessNotice(null)} 
            className="text-emerald-700 hover:text-emerald-950 font-bold p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Premier Physician Hero & Availability Banner */}
      <div className="bg-gradient-to-br from-[#003B42] via-[#005B66] to-[#007A87] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-bold text-cyan-200 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
                <span>ONMC Verified Physician &bull; CEMAC Accredited</span>
              </span>

              <button
                onClick={() => setIsAvailableForConsults(!isAvailableForConsults)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                  isAvailableForConsults 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                    : 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAvailableForConsults ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>{isAvailableForConsults ? 'Available for Consultations' : 'Offline / In Surgery'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 border-2 border-white/40 overflow-hidden shrink-0 flex items-center justify-center font-black text-2xl text-white shadow-md">
                {(user?.profilePicture || user?.avatarUrl || localStorage.getItem(`nanolabs_doctor_avatar_${doctorId}`)) ? (
                  <img 
                    src={user?.profilePicture || user?.avatarUrl || localStorage.getItem(`nanolabs_doctor_avatar_${doctorId}`) || ''} 
                    alt={doctorName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  doctorName.replace('Dr.', '').trim().charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {doctorName}
                </h1>
                <p className="text-xs sm:text-sm text-cyan-100/90 font-medium mt-0.5">
                  {doctorSpecialty} &bull; {lab?.name || 'Biodiagnostic Labo / Partner Clinic'}
                </p>
              </div>
            </div>

            <p className="text-xs text-cyan-100/80 leading-relaxed font-normal">
              Manage clinical agendas, schedule in-clinic consultations and encrypted teleconsultations, look up patient medical dossiers, and communicate directly with your care cohort.
            </p>

            {/* Quick Action Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setSelectedPatient(searchResults.length > 0 ? searchResults[0] : null);
                  setIsScheduleModalOpen(true);
                }}
                className="px-5 py-2.5 bg-white text-[#005B66] hover:bg-cyan-50 active:scale-[0.98] rounded-2xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-2 group"
              >
                <Calendar className="w-4 h-4 text-[#005B66] group-hover:scale-110 transition-transform" />
                <span>+ Schedule & Send Appointment</span>
              </button>

              <button
                onClick={() => {
                  setShowPatientResults(true);
                  const el = document.getElementById('patient-search-input');
                  el?.focus();
                }}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-[0.98] border border-white/20 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 backdrop-blur-md"
              >
                <Search className="w-4 h-4 text-cyan-200" />
                <span>Search Patients</span>
              </button>

              <button
                onClick={onNavigateConnect}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-[0.98] border border-white/20 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 backdrop-blur-md"
              >
                <MessageSquare className="w-4 h-4 text-cyan-200" />
                <span>Patient Chat Hub</span>
              </button>

              <button
                onClick={onNavigateNewRequest}
                className="px-4 py-2.5 bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-400/20 text-cyan-100 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Prescribe laboratory diagnostic panel"
              >
                <FilePlus className="w-4 h-4 text-cyan-300" />
                <span>Order Lab Tests</span>
              </button>
            </div>
          </div>

          {/* KPI Snapshot Cards */}
          <div className="grid grid-cols-2 gap-3 lg:w-72 shrink-0">
            <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider block">Today's Visits</span>
              <span className="text-2xl font-black text-white font-mono">{todayAppointments.length}</span>
              <span className="text-[10px] text-cyan-100/70 block">Booked slots</span>
            </div>

            <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider block">Cohort Patients</span>
              <span className="text-2xl font-black text-white font-mono">{searchResults.length}</span>
              <span className="text-[10px] text-cyan-100/70 block">Registered files</span>
            </div>

            <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider block">Incoming Requests</span>
              <span className="text-2xl font-black text-amber-300 font-mono">{incomingRequests.length}</span>
              <span className="text-[10px] text-cyan-100/70 block">Needs review</span>
            </div>

            <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider block">Signed Reports</span>
              <span className="text-2xl font-black text-white font-mono">18</span>
              <span className="text-[10px] text-cyan-100/70 block">Delivered results</span>
            </div>
          </div>
        </div>

        {/* Ambient background accent */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-white/5 rounded-full pointer-events-none blur-2xl" />
      </div>

      {/* 2. Patient Search & Directory Hub */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#006978]" />
              <span>Search Patients & Cohort Directory</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Find any patient by legal name, nickname, phone number, company (société), or insurance matricule.
            </p>
          </div>

          <button
            onClick={() => setShowPatientResults(!showPatientResults)}
            className="text-xs font-bold text-[#006978] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>{showPatientResults ? 'Hide Patient Cards' : `View All (${searchResults.length} Patients)`}</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${showPatientResults ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
          <input
            id="patient-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowPatientResults(true);
            }}
            onFocus={() => setShowPatientResults(true)}
            placeholder="Type patient name, phone (+237...), nickname, company (e.g. ENEO, SABC), or insurance policy..."
            className="w-full pl-11 pr-10 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#006978] focus:ring-2 focus:ring-[#006978]/20 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Patient Grid */}
        {showPatientResults && (
          <div className="pt-2 border-t border-slate-100 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Matching Patients: <strong className="text-slate-900">{searchResults.length}</strong></span>
              <span className="text-[11px] text-slate-400">Click card for clinical dossier or instant appointment dispatch</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 bg-slate-50/80 hover:bg-[#E0F2F1]/30 border border-slate-200 rounded-2xl transition-all shadow-2xs flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={patient.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'}
                        alt={patient.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-[#006978]">
                            {patient.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                          <span>{patient.nickname}</span>
                          <span>&bull;</span>
                          <span>{patient.gender}, {patient.age}y</span>
                          <span>&bull;</span>
                          <span className="font-bold text-[#006978]">{patient.bloodGroup}</span>
                        </p>
                      </div>
                    </div>

                    {/* Patient Context Tags */}
                    <div className="space-y-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Contact:</span>
                        <span className="font-bold text-slate-800">{patient.phone}</span>
                      </div>
                      {patient.societe && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Company / Employer:</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[140px]">{patient.societe}</span>
                        </div>
                      )}
                      {patient.insuranceProvider && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Insurance:</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md text-[10px]">
                            {patient.insuranceProvider}
                          </span>
                        </div>
                      )}
                      {patient.lastTestName && (
                        <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-500 line-clamp-1">
                          <span className="font-semibold text-slate-700">Recent Lab: </span>
                          <span>{patient.lastTestName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Doctor Actions for this Patient */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleOpenScheduleForPatient(patient)}
                      className="py-2 px-2.5 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-cyan-200" />
                      <span>Schedule Visit</span>
                    </button>

                    <button
                      onClick={() => handleOpenChatWithPatient(patient)}
                      className="py-2 px-2.5 bg-white hover:bg-slate-100 active:scale-[0.98] border border-slate-200 text-slate-800 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#006978]" />
                      <span>Message / Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Primary Appointment Scheduling & Agenda Console */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Physician Appointment Agenda & Consultation Schedules
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review booked patient visits, dispatch appointment proposals, and manage consultation modalities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedPatient(searchResults.length > 0 ? searchResults[0] : null);
                setIsScheduleModalOpen(true);
              }}
              className="px-4 py-2 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white rounded-xl text-xs font-black shadow-md shadow-[#006978]/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-cyan-200" />
              <span>+ Send Appointment</span>
            </button>
          </div>
        </div>

        {/* Schedule Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 overflow-x-auto">
          {[
            { id: 'today', label: `Today's Consultations (${todayAppointments.length})` },
            { id: 'upcoming', label: `Upcoming Schedule (${upcomingAppointments.length})` },
            { id: 'requests', label: `Patient Requests (${incomingRequests.length})`, highlight: incomingRequests.length > 0 },
            { id: 'all', label: `All Agenda (${appointments.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScheduleTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                scheduleTab === tab.id
                  ? 'bg-white text-[#006978] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.highlight && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          ))}
        </div>

        {/* Appointments List View */}
        <div className="space-y-3">
          {displayedAppointments.length > 0 ? (
            displayedAppointments.map((app) => {
              const isToday = app.date === todayStr;
              return (
                <div
                  key={app.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    app.status === 'requested'
                      ? 'bg-amber-50/70 border-amber-300'
                      : (isToday ? 'bg-cyan-50/40 border-cyan-200' : 'bg-white hover:bg-slate-50 border-slate-200/90')
                  }`}
                >
                  {/* Left: Time & Patient Information */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 bg-[#006978] text-white rounded-lg text-xs font-mono font-black shadow-2xs flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-200" />
                        <span>{app.time}</span>
                      </span>

                      <span className="text-xs font-bold text-slate-700">
                        {app.date === todayStr ? 'Today' : app.date}
                      </span>

                      {/* Modality Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                        app.type === 'teleconsultation'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : (app.type === 'home_visit'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : (app.type === 'lab_review'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'))
                      }`}>
                        {app.type === 'teleconsultation' && <Video className="w-3 h-3" />}
                        {app.type === 'in_person' && <Stethoscope className="w-3 h-3" />}
                        {app.type === 'home_visit' && <MapPin className="w-3 h-3" />}
                        {app.type === 'lab_review' && <FileText className="w-3 h-3" />}
                        <span>{app.type.replace('_', ' ')}</span>
                      </span>

                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        app.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : (app.status === 'requested'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                            : (app.status === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-50 text-rose-800'))
                      }`}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                        <span>{app.patientName}</span>
                        {app.patientNickname && (
                          <span className="text-xs font-normal text-slate-400">({app.patientNickname})</span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {app.reason}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{app.location}</span>
                      </span>
                      {app.patientPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{app.patientPhone}</span>
                        </span>
                      )}
                      {app.patientSociete && (
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          {app.patientSociete}
                        </span>
                      )}
                      {app.patientInsurance && (
                        <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {app.patientInsurance}
                        </span>
                      )}
                    </div>

                    {app.prepInstructions && (
                      <div className="p-2 bg-amber-50/80 rounded-xl border border-amber-200/70 text-[11px] text-amber-900">
                        <span className="font-bold">Patient Prep Note: </span>
                        <span>{app.prepInstructions}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/60">
                    {/* Primary actions based on status */}
                    {app.status === 'requested' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmAppointment(app.id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Accept & Confirm</span>
                        </button>
                        <button
                          onClick={() => {
                            clinicalAppointmentService.updateAppointmentStatus(app.id, 'cancelled');
                            refreshAppointments();
                          }}
                          className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {app.type === 'teleconsultation' && (
                          <button
                            onClick={() => setActiveVideoCall(app)}
                            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Video className="w-3.5 h-3.5 text-purple-200" />
                            <span>Launch Video</span>
                          </button>
                        )}

                        {app.status === 'confirmed' && (
                          <button
                            onClick={() => handleCompleteAppointment(app.id)}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Secondary Dispatch & Chat Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleSendReminder(app.id, 'whatsapp')}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-bold border border-emerald-200/80 cursor-pointer flex items-center gap-1"
                        title="Dispatch WhatsApp appointment invite to patient"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>WhatsApp Link</span>
                      </button>

                      <button
                        onClick={() => handleSendReminder(app.id, 'sms')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold cursor-pointer flex items-center gap-1"
                        title="Send SMS schedule alert"
                      >
                        <Bell className="w-3 h-3" />
                        <span>SMS Alert</span>
                      </button>

                      <button
                        onClick={() => {
                          const patientMatch = searchResults.find(p => p.id === app.patientId || p.name === app.patientName);
                          if (patientMatch) {
                            handleOpenChatWithPatient(patientMatch);
                          } else {
                            onNavigateConnect();
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-[#006978] hover:bg-[#E0F2F1] rounded-xl transition-colors cursor-pointer"
                        title="Chat with patient"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No appointments in this view</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "+ Send Appointment" above or search for a patient in your directory to schedule a new consultation.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPatient(searchResults.length > 0 ? searchResults[0] : null);
                  setIsScheduleModalOpen(true);
                }}
                className="px-4 py-2 bg-[#006978] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule New Patient Visit</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Recent Diagnostic Lab Reports & Results */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#006978]" />
              <span>Diagnostic Prescriptions & Verified Laboratory Results</span>
            </h2>
            <p className="text-xs text-slate-500">Official ISO-accredited lab runs performed for patients under your referral.</p>
          </div>

          <button
            onClick={onNavigateReports}
            className="text-xs font-black text-[#006978] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>All Lab Reports</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              patient: 'Mme. Claire Ngo',
              tests: 'Complete Blood Count (NFS) + Fasting Glycemia',
              lab: 'Biodiagnostic Labo, Douala',
              date: 'Today, 08:30 AM',
              status: 'Validated by Chief Biologist',
              statusColor: 'emerald'
            },
            {
              patient: 'M. Roland Tchouassi',
              tests: 'Cardiovascular Lipid Panel & High-Sensitivity CRP',
              lab: 'Laboratoire Central Akwa',
              date: 'Yesterday',
              status: 'Validated by Chief Biologist',
              statusColor: 'emerald'
            },
            {
              patient: 'Mme. Béatrice Nguemo',
              tests: 'Liver Functional Panel (Transaminases ASAT/ALAT)',
              lab: 'Biodiagnostic Labo, Douala',
              date: 'Oct 14',
              status: 'Technical Analysis in Progress',
              statusColor: 'amber'
            },
            {
              patient: 'M. Samuel Eboa',
              tests: 'Thick Smear & Malaria RDT + Full Blood Count',
              lab: 'Centre Diagnostic Laquintinie',
              date: 'Oct 12',
              status: 'Validated by Chief Biologist',
              statusColor: 'emerald'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50 hover:bg-[#E0F2F1]/30 rounded-2xl border border-slate-200/90 transition-all flex flex-col justify-between gap-3 text-xs group"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 group-hover:text-[#006978]">{item.patient}</span>
                  <span className="text-[10px] text-slate-400">{item.date}</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium">{item.tests}</p>
                <p className="text-[10px] text-[#006978] font-bold flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>{item.lab}</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.statusColor === 'emerald'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.status}
                </span>

                <button
                  onClick={onNavigateReports}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                >
                  View Signed PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: Schedule & Send Appointment to Patient */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#006978] text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-5 h-5 text-cyan-200" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Schedule & Send Appointment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Propose consultation and dispatch schedule invite to patient
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              {/* Patient Selection */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 block">
                  Select Patient:
                </label>
                <select
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const match = searchResults.find(p => p.id === e.target.value);
                    if (match) setSelectedPatient(match);
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-[#006978]"
                >
                  {searchResults.length === 0 && (
                    <option value="">No patients registered in directory yet</option>
                  )}
                  {searchResults.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.nickname}) &bull; {p.phone} &bull; {p.societe || 'Patient'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Picker */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">
                    Consultation Date:
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-[#006978]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">
                    Consultation Time Slot:
                  </label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-[#006978]"
                  >
                    {['08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '04:00 PM', '04:30 PM', '05:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consultation Modality / Type */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 block">
                  Consultation Modality:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'in_person' as ConsultationType, label: 'In-Clinic Visit', icon: Stethoscope },
                    { id: 'teleconsultation' as ConsultationType, label: 'Telehealth Video', icon: Video },
                    { id: 'lab_review' as ConsultationType, label: 'Lab Results Review', icon: FileText },
                    { id: 'home_visit' as ConsultationType, label: 'Bedside / Home Visit', icon: MapPin }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = appointmentType === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setAppointmentType(item.id);
                          if (item.id === 'teleconsultation') {
                            setAppointmentLocation('Secure Encrypted Video Room #04 (Telehealth)');
                          } else if (item.id === 'in_person') {
                            setAppointmentLocation('Cabinet Médical Akwa, Salle 2, Douala');
                          } else if (item.id === 'lab_review') {
                            setAppointmentLocation('Biodiagnostic Labo Consultation Room, Douala');
                          } else {
                            setAppointmentLocation('Patient Residence (Douala)');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#E0F2F1] border-[#006978] text-[#006978] font-black'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-[11px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Practice Location */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 block">
                  Location / Consultation Venue:
                </label>
                <input
                  type="text"
                  value={appointmentLocation}
                  onChange={(e) => setAppointmentLocation(e.target.value)}
                  placeholder="e.g. Cabinet Médical Akwa, Douala or Video Link"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-[#006978]"
                  required
                />
              </div>

              {/* Clinical Reason */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 block">
                  Clinical Indication / Reason for Visit:
                </label>
                <input
                  type="text"
                  value={consultationReason}
                  onChange={(e) => setConsultationReason(e.target.value)}
                  placeholder="e.g. Complete Blood Count Review & Hypertension follow-up"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-[#006978]"
                  required
                />
              </div>

              {/* Prep Instructions */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 block">
                  Preparation Instructions for Patient:
                </label>
                <input
                  type="text"
                  value={prepInstructions}
                  onChange={(e) => setPrepInstructions(e.target.value)}
                  placeholder="e.g. Fasting for 8h prior, bring previous health carnet"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-[#006978]"
                />
              </div>

              {/* Notification Dispatch Channels */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-[11px] font-extrabold text-slate-700 block">
                  Dispatch Notification To Patient:
                </span>
                <div className="flex items-center gap-4 text-[11px] font-bold text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendViaWhatsApp}
                      onChange={(e) => setSendViaWhatsApp(e.target.checked)}
                      className="accent-[#006978] rounded"
                    />
                    <span>WhatsApp Invite Link</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendViaSms}
                      onChange={(e) => setSendViaSms(e.target.checked)}
                      className="accent-[#006978] rounded"
                    />
                    <span>SMS Alert</span>
                  </label>
                  <span className="text-emerald-700 font-bold ml-auto">&bull; In-App Synced</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#006978] hover:bg-[#005a66] text-white font-black rounded-2xl shadow-md shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-cyan-200" />
                  <span>Send Appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick Live Chat with Patient */}
      {isChatModalOpen && chattingWithPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-5 shadow-2xl flex flex-col h-[520px]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={chattingWithPatient.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'}
                  alt={chattingWithPatient.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-sm font-black text-slate-900">{chattingWithPatient.name}</h4>
                  <p className="text-[11px] text-[#006978] font-bold">
                    {chattingWithPatient.nickname} &bull; {chattingWithPatient.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsChatModalOpen(false);
                    handleOpenScheduleForPatient(chattingWithPatient);
                  }}
                  className="px-2.5 py-1.5 bg-[#E0F2F1] text-[#006978] rounded-xl text-xs font-bold cursor-pointer hover:bg-[#b2dfdb]"
                >
                  + Appt
                </button>
                <button
                  onClick={() => setIsChatModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/60 rounded-2xl my-3">
              {chatHistory.length > 0 ? (
                chatHistory.map((msg, i) => {
                  const isDoctor = msg.senderRole === 'doctor' || msg.senderId === doctorId;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col ${isDoctor ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                          isDoctor
                            ? 'bg-[#006978] text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        <p>{msg.content}</p>
                        {msg.metadata && msg.type === 'appointment' && (
                          <div className="mt-2 p-2 bg-black/15 rounded-xl text-[11px] space-y-0.5">
                            <span className="font-bold block">Appointment Scheduled:</span>
                            <span>{msg.metadata.appointmentDate} at {msg.metadata.appointmentTime}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
                  <p>No messages yet. Send clinical advice or schedule confirmation below.</p>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendQuickChatMessage} className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={chatMessageText}
                onChange={(e) => setChatMessageText(e.target.value)}
                placeholder="Type clinical message to patient..."
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#006978]"
              />
              <button
                type="submit"
                className="p-2.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl shadow-2xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Telehealth Video Room Simulator */}
      {activeVideoCall && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl text-white">
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black">
                  Encrypted Teleconsultation Room &bull; {activeVideoCall.patientName}
                </span>
              </div>
              <button
                onClick={() => setActiveVideoCall(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-cyan-600/20 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center mx-auto text-2xl font-black">
                {activeVideoCall.patientName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-black">{activeVideoCall.patientName}</h3>
                <p className="text-xs text-slate-400">{activeVideoCall.reason}</p>
                <p className="text-xs text-emerald-400 font-bold mt-1">End-to-End Encrypted Session Active</p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <a
                  href="https://meet.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Video className="w-4 h-4" />
                  <span>Launch Google Meet HD Stream</span>
                  <ExternalLink className="w-3 h-3 text-cyan-300" />
                </a>

                <button
                  onClick={() => {
                    handleCompleteAppointment(activeVideoCall.id);
                    setActiveVideoCall(null);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black cursor-pointer shadow-md"
                >
                  Complete Consult
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { DashboardScreen as DoctorDashboardScreen };
export default DashboardScreen;
