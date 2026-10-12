import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
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
  AlertCircle,
  Search,
  UserCheck,
  UserPlus,
  Shield,
  Lock,
  ChevronRight,
  Eye,
  EyeOff,
  Inbox,
  RefreshCw,
  MapPin,
  ArrowLeft,
  Paperclip,
  CheckCheck,
  Info,
  Video
} from 'lucide-react';
import { 
  doctorChatService, 
  ChatMessage, 
  DoctorPatientConnection,
  ConnectionRequest,
  UserSocialProfile
} from '../../services/doctorChatService';
import { useAuth } from '../../context/authContext';
import { getBatchesForPatient } from '../../services/batchService';
import { TestBatch } from '../../types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { limsService } from '../../services/limsService';

export interface DoctorPatientChatHubProps {
  currentRole?: 'patient' | 'doctor';
  initialHubTab?: 'messages' | 'connect' | 'requests';
  currentPatientId?: string;
  currentPatientName?: string;
  currentDoctorId?: string;
  currentDoctorName?: string;
  initialPatientId?: string;
  initialPatientName?: string;
  initialDoctorId?: string;
  initialDoctorName?: string;
  onNavigateToBooking?: (preSelectedTests?: any[]) => void;
  onOpenReportModal?: (bookingId: string, testName?: string) => void;
  onOpenEditProfileModal?: () => void;
}

export const DoctorPatientChatHub: React.FC<DoctorPatientChatHubProps> = ({
  currentRole,
  initialHubTab = 'messages',
  currentPatientId,
  currentPatientName,
  currentDoctorId,
  currentDoctorName,
  initialPatientId,
  initialPatientName,
  initialDoctorId,
  initialDoctorName,
  onNavigateToBooking,
  onOpenReportModal,
  onOpenEditProfileModal
}) => {
  const { user } = useAuth();
  const effectiveRole = currentRole || (user?.role === 'doctor' ? 'doctor' : 'patient');

  const resolvedPatientId = currentPatientId || (effectiveRole === 'patient' ? (user?.id || 'pat-1') : (initialPatientId || 'pat_claire_01'));
  const resolvedPatientName = currentPatientName || (effectiveRole === 'patient' ? (user?.name || 'Mme. Claire Ngo') : (initialPatientName || 'Patient'));
  const resolvedDoctorId = currentDoctorId || (effectiveRole === 'doctor' ? (user?.id || 'doc_kamga_101') : (initialDoctorId || 'doc_kamga_101'));
  const resolvedDoctorName = currentDoctorName || (effectiveRole === 'doctor' ? (user?.name || 'Dr. Joseph Kamga, MD') : (initialDoctorName || 'Dr. Joseph Kamga, MD'));

  const activeUserId = effectiveRole === 'doctor' ? resolvedDoctorId : resolvedPatientId;
  const activeUserName = effectiveRole === 'doctor' ? resolvedDoctorName : resolvedPatientName;

  // Active top-level tab: 'messages' | 'connect' | 'requests'
  const [hubTab, setHubTab] = useState<'messages' | 'connect' | 'requests'>(
    initialHubTab === 'requests' ? 'requests' : (initialHubTab === 'connect' ? 'connect' : 'messages')
  );

  // Mobile navigation state: when a chat is open on mobile screens, show chat full screen
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Sync tab if prop changes
  useEffect(() => {
    if (initialHubTab) {
      setHubTab(initialHubTab === 'requests' ? 'requests' : (initialHubTab === 'connect' ? 'connect' : 'messages'));
    }
  }, [initialHubTab]);

  // Connection & Chat States
  const [connections, setConnections] = useState<DoctorPatientConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<DoctorPatientConnection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  // Requests States
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequest[]>([]);

  // Directory Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryResults, setDirectoryResults] = useState<Array<UserSocialProfile & { isConnected: boolean; hasPendingRequest: boolean }>>([]);
  const [requestNoteModalUser, setRequestNoteModalUser] = useState<UserSocialProfile | null>(null);
  const [connectionNote, setConnectionNote] = useState('');

  // Patient Privacy Nickname States
  const [userProfile, setUserProfile] = useState<UserSocialProfile | null>(null);
  const [privacyNickname, setPrivacyNickname] = useState('');
  const [isAnonymousMode, setIsAnonymousMode] = useState(true);
  const [privacySaveSuccess, setPrivacySaveSuccess] = useState(false);

  // Clinical Actions & Modals
  const [showPrescribeTestModal, setShowPrescribeTestModal] = useState(false);
  const [showPrescribeMedModal, setShowPrescribeMedModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showShareResultModal, setShowShareResultModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [patientBatches, setPatientBatches] = useState<TestBatch[]>([]);

  // Prescription Form States
  const [testPrescriptionIndication, setTestPrescriptionIndication] = useState('Diagnostic workup for persistent fatigue and metabolic monitoring');
  const [selectedTestsToPrescribe, setSelectedTestsToPrescribe] = useState<string[]>(['FBC', 'GLYC']);

  const [medPrescriptionIndication, setMedPrescriptionIndication] = useState('Post-consultation supportive protocol');
  const [medList, setMedList] = useState<Array<{ name: string; dosage: string; frequency: string; duration: string; instructions: string }>>([
    { name: 'Ferrous Sulfate + Folic Acid', dosage: '66mg elemental iron', frequency: 'Once daily (morning)', duration: '30 days', instructions: 'Take with water or vitamin C' }
  ]);

  const [appointmentDate, setAppointmentDate] = useState('2026-09-28');
  const [appointmentTime, setAppointmentTime] = useState('10:30 AM');
  const [appointmentType, setAppointmentType] = useState<'in_person' | 'teleconsultation' | 'lab_review'>('in_person');
  const [appointmentLocation, setAppointmentLocation] = useState('nanoLabs Partner Clinic / Cabinet Akwa, Douala');

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Reload connections and requests
  const refreshData = () => {
    const conns = doctorChatService.getConnections(activeUserId, effectiveRole);
    setConnections(conns);

    // If initial requested target was provided, select it
    if (initialPatientId && effectiveRole === 'doctor') {
      const match = conns.find(c => c.patientId === initialPatientId);
      if (match) {
        setSelectedConnection(match);
        setIsMobileChatOpen(true);
      }
    } else if (initialDoctorId && effectiveRole === 'patient') {
      const match = conns.find(c => c.doctorId === initialDoctorId);
      if (match) {
        setSelectedConnection(match);
        setIsMobileChatOpen(true);
      }
    } else if (!selectedConnection && conns.length > 0) {
      setSelectedConnection(conns[0]);
    } else if (selectedConnection) {
      const current = conns.find(c => c.id === selectedConnection.id);
      if (current) setSelectedConnection(current);
    }

    // Requests
    const allRequests = doctorChatService.getRequests(activeUserId);
    setIncomingRequests(allRequests.filter(r => r.toId.toLowerCase() === activeUserId.toLowerCase() && r.status === 'pending'));
    setOutgoingRequests(allRequests.filter(r => r.fromId.toLowerCase() === activeUserId.toLowerCase() && r.status === 'pending'));

    // User Profile
    const profile = doctorChatService.getOrCreateUserProfile({
      id: activeUserId,
      name: activeUserName,
      role: effectiveRole,
      phone: user?.phone
    });
    setUserProfile(profile);
    setPrivacyNickname(profile.nickname);
    setIsAnonymousMode(profile.isAnonymous);

    // Directory
    const targetRole = effectiveRole === 'patient' ? 'doctor' : 'patient';
    const results = doctorChatService.searchDirectory(searchQuery, targetRole, activeUserId);
    setDirectoryResults(results);

    // Batches for sharing
    const batches = getBatchesForPatient(resolvedPatientId, user?.phone, resolvedPatientName);
    setPatientBatches(batches);
  };

  useEffect(() => {
    refreshData();
  }, [activeUserId, effectiveRole, searchQuery]);

  // Real-time synchronization of accredited doctors from database for B2C patients
  useEffect(() => {
    // 1. Initial async fetch from limsService
    limsService.searchAllAccreditedDoctors().then(docs => {
      if (docs && docs.length > 0) {
        doctorChatService.syncDoctorsFromDatabase(docs);
        refreshData();
      }
    }).catch(err => console.warn('Doctor fetch note:', err));

    // 2. Real-time snapshot listener on doctors collection
    const unsubDoctors = onSnapshot(collection(db, 'doctors'), (snap) => {
      const realDocs: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        realDocs.push({
          id: d.id,
          doctorId: d.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          specialty: data.specialty || 'General Medicine',
          licenseNumber: data.licenseNumber || '',
          hospital: data.hospital || data.hospitalAffiliation || '',
          hospitalAffiliation: data.hospitalAffiliation || data.hospital || '',
          avatarUrl: data.avatarUrl || data.profilePicture || data.photoUrl || '',
          isOnline: true
        });
      });
      if (realDocs.length > 0) {
        doctorChatService.syncDoctorsFromDatabase(realDocs);
        refreshData();
      }
    }, (err) => console.warn('Doctors listener note:', err));

    // 3. Real-time snapshot listener on users where role == doctor
    const docUsersQuery = query(collection(db, 'users'), where('role', '==', 'doctor'));
    const unsubUsers = onSnapshot(docUsersQuery, (snap) => {
      const userDocs: any[] = [];
      snap.forEach(u => {
        const data = u.data();
        userDocs.push({
          id: u.id,
          doctorId: u.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          specialty: data.specialty || 'General Medicine',
          licenseNumber: data.licenseNumber || 'ONMC-CMR-ACCREDITED',
          hospital: data.hospital || data.hospitalAffiliation || '',
          hospitalAffiliation: data.hospitalAffiliation || data.hospital || '',
          avatarUrl: data.avatarUrl || data.profilePicture || data.photoUrl || '',
          isOnline: true
        });
      });
      if (userDocs.length > 0) {
        doctorChatService.syncDoctorsFromDatabase(userDocs);
        refreshData();
      }
    }, (err) => console.warn('Doctor users listener note:', err));

    return () => {
      unsubDoctors();
      unsubUsers();
    };
  }, []);

  // Load chat messages when connection changes
  useEffect(() => {
    if (selectedConnection) {
      const msgs = doctorChatService.getMessages(selectedConnection.patientId, selectedConnection.doctorId);
      setMessages(msgs);
    } else {
      setMessages([]);
    }
  }, [selectedConnection]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send normal text message
  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConnection) return;

    const newMsg = doctorChatService.sendMessage({
      connectionId: selectedConnection.id,
      senderId: effectiveRole === 'doctor' ? selectedConnection.doctorId : selectedConnection.patientId,
      senderName: effectiveRole === 'doctor' 
        ? selectedConnection.doctorName 
        : (userProfile?.isAnonymous ? userProfile.nickname : selectedConnection.patientName),
      senderRole: effectiveRole,
      recipientId: effectiveRole === 'doctor' ? selectedConnection.patientId : selectedConnection.doctorId,
      recipientName: effectiveRole === 'doctor' ? selectedConnection.patientName : selectedConnection.doctorName,
      type: 'text',
      content: inputText.trim()
    });

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    refreshData();
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
    showToast('Prescription transmitted into conversation.');
    refreshData();
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
    showToast('Medication prescription (Rx) sent.');
    refreshData();
  };

  // Submit appointment
  const handleScheduleAppointment = () => {
    if (!selectedConnection) return;
    const newMsg = doctorChatService.scheduleAppointment({
      doctorId: selectedConnection.doctorId,
      doctorName: selectedConnection.doctorName,
      patientId: selectedConnection.patientId,
      patientName: selectedConnection.patientName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      location: appointmentLocation
    });

    setMessages(prev => [...prev, newMsg]);
    setShowAppointmentModal(false);
    showToast('Appointment invitation dispatched.');
    refreshData();
  };

  // Share diagnostic result into chat
  const handleShareBatchResult = (batch: TestBatch) => {
    if (!selectedConnection) return;
    const newMsg = doctorChatService.shareTestResult({
      senderId: selectedConnection.patientId,
      senderName: userProfile?.isAnonymous ? userProfile.nickname : selectedConnection.patientName,
      doctorId: selectedConnection.doctorId,
      doctorName: selectedConnection.doctorName,
      testName: batch.tests.map(t => t.name).join(', '),
      bookingCode: batch.bookingCode || batch.id,
      bookingId: batch.id,
      resultSummary: `A4 Certified Diagnostic Report containing ${batch.tests.length} laboratory investigations.`,
      isBatch: true,
      batchTestCount: batch.tests.length
    });

    setMessages(prev => [...prev, newMsg]);
    setShowShareResultModal(false);
    showToast('Diagnostic report shared with doctor.');
    refreshData();
  };

  // Quick save privacy nickname
  const handleSavePrivacySettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = doctorChatService.updatePatientPrivacyNickname(
      activeUserId,
      privacyNickname,
      isAnonymousMode
    );
    setUserProfile(updated);
    setPrivacySaveSuccess(true);
    showToast('Privacy nickname & anonymity settings updated successfully!');
    setTimeout(() => setPrivacySaveSuccess(false), 3000);
    refreshData();
  };

  // Send connection request
  const handleSendConnectionRequest = (targetUser: UserSocialProfile) => {
    const res = doctorChatService.sendConnectionRequest({
      fromUser: {
        id: activeUserId,
        name: activeUserName,
        role: effectiveRole,
        avatarUrl: userProfile?.avatarUrl
      },
      targetUserId: targetUser.id,
      note: connectionNote.trim() || undefined
    });

    if (res.success) {
      showToast(res.message);
      setRequestNoteModalUser(null);
      setConnectionNote('');
      refreshData();
    } else {
      showToast(res.message);
    }
  };

  // Respond to request
  const handleRespondToRequest = (requestId: string, decision: 'accepted' | 'declined') => {
    const res = doctorChatService.respondToConnectionRequest(requestId, decision);
    if (res.success) {
      if (decision === 'accepted') {
        showToast('Connection accepted! You can now exchange direct clinical messages and reports.');
        if (res.connection) {
          setSelectedConnection(res.connection);
          setHubTab('messages');
          setIsMobileChatOpen(true);
        }
      } else {
        showToast('Connection request declined.');
      }
      refreshData();
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[640px] text-slate-800">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="bg-slate-900 text-teal-300 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl fixed bottom-6 right-6 z-50 flex items-center gap-2 border border-teal-500/30 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Main Top Header with Mode Switcher & Mutual Approval Notice */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Clinical Tele-Consultation Hub</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {effectiveRole === 'doctor' ? 'Physician View' : 'Patient View'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 inline" />
                <span>Mutual consent required before clinical messages or A4 diagnostic reports can be exchanged</span>
              </p>
            </div>
          </div>
        </div>

        {/* 3-Tab Segmented Navigation (Clean & Modern Anti-Slop Buttons) */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-2xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setHubTab('messages');
              setIsMobileChatOpen(false);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              hubTab === 'messages'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chats</span>
            {connections.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                hubTab === 'messages' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {connections.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setHubTab('connect');
              setIsMobileChatOpen(false);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              hubTab === 'connect'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find & Connect</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setHubTab('requests');
              setIsMobileChatOpen(false);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              hubTab === 'requests'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Requests</span>
            {incomingRequests.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-rose-500 text-white font-bold animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Patient Privacy Nickname Notification Bar (for Patients in Chat tab) */}
      {effectiveRole === 'patient' && hubTab === 'messages' && (
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-950">
            <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Your public search alias is <strong className="font-mono text-indigo-700">@{privacyNickname || 'Anonymous'}</strong>
              {isAnonymousMode ? ' (Anonymous Shield Active)' : ' (Legal Name Visible)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenEditProfileModal) {
                onOpenEditProfileModal();
              } else {
                setHubTab('connect');
              }
            }}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 shrink-0 cursor-pointer"
          >
            Change Nickname
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: MESSAGES (1-ON-1 CHAT WITH MUTUALLY ACCEPTED CONNECTIONS ONLY)    */}
      {/* ========================================================================= */}
      {hubTab === 'messages' && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-[580px] overflow-hidden">
          {/* Left Column: Accepted Connections List (Hidden on mobile if a chat is actively opened) */}
          <div className={`md:col-span-4 border-r border-slate-200/80 bg-slate-50/50 p-3 sm:p-4 flex flex-col space-y-3 ${
            isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}>
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Connected {effectiveRole === 'doctor' ? 'Patients' : 'Specialists'} ({connections.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setHubTab('connect')}
                className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>+ Find</span>
              </button>
            </div>

            {/* Connections Scroll List */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[520px] pr-1">
              {connections.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3 my-auto">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">No Active Connections Yet</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      To protect medical privacy, doctors and patients must both approve connection before chatting or sharing records.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHubTab('connect')}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Open Directory & Connect
                  </button>
                </div>
              ) : (
                connections.map(conn => {
                  const isSelected = selectedConnection?.id === conn.id;
                  const displayName = effectiveRole === 'doctor' 
                    ? (conn.patientNickname || conn.patientName)
                    : conn.doctorName;
                  const subtitle = effectiveRole === 'doctor' 
                    ? 'Connected Clinical Patient'
                    : (conn.doctorSpecialty || 'Diagnostic Specialist');

                  return (
                    <button
                      key={conn.id}
                      type="button"
                      onClick={() => {
                        setSelectedConnection(conn);
                        setIsMobileChatOpen(true);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/80 shadow-xs ring-1 ring-teal-500/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0 overflow-hidden shadow-2xs">
                        {conn.doctorAvatar && effectiveRole === 'patient' ? (
                          <img src={conn.doctorAvatar} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          effectiveRole === 'patient' ? <Stethoscope className="w-5 h-5 text-teal-700" /> : <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{displayName}</h4>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {conn.lastMessageTime ? new Date(conn.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
                        {conn.lastMessage && (
                          <p className="text-[10px] text-slate-600 truncate mt-0.5 italic">
                            "{conn.lastMessage}"
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Chat Panel (Shown full screen on mobile when isMobileChatOpen is true) */}
          <div className={`md:col-span-8 flex flex-col h-[580px] bg-slate-50/30 ${
            !isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}>
            {selectedConnection ? (
              <>
                {/* Active Chat Top Bar */}
                <div className="p-3.5 sm:p-4 border-b border-slate-200/80 bg-white flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile Back Button to return to list */}
                    <button
                      type="button"
                      onClick={() => setIsMobileChatOpen(false)}
                      className="md:hidden p-2 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      title="Back to conversation list"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0 shadow-2xs overflow-hidden">
                      {selectedConnection.doctorAvatar && effectiveRole === 'patient' ? (
                        <img src={selectedConnection.doctorAvatar} alt="Doctor" className="w-full h-full object-cover" />
                      ) : (
                        effectiveRole === 'doctor' ? <User className="w-5 h-5" /> : <Stethoscope className="w-5 h-5 text-teal-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {effectiveRole === 'doctor' 
                            ? (selectedConnection.patientNickname || selectedConnection.patientName)
                            : selectedConnection.doctorName}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Connected</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {effectiveRole === 'doctor'
                          ? `Patient PID: ${selectedConnection.patientId}`
                          : `${selectedConnection.doctorSpecialty || 'Specialist'} • ${selectedConnection.doctorHospital || 'Network'}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions Header Toolbar */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Waspito Online Video Consultation Button for Doctors & Patients */}
                    <a
                      href="https://waspito.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title={effectiveRole === 'doctor' ? 'Hold Online Video Consultation on Waspito' : 'Consult Doctor via Video on Waspito'}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {effectiveRole === 'doctor' ? 'Video Consult on Waspito' : 'Video on Waspito'}
                      </span>
                      <span className="sm:hidden">Waspito</span>
                    </a>

                    {effectiveRole === 'patient' && (
                      <button
                        type="button"
                        onClick={() => setShowShareResultModal(true)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Share Lab Result</span>
                        <span className="sm:hidden">Share</span>
                      </button>
                    )}

                    {effectiveRole === 'doctor' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowPrescribeTestModal(true)}
                          className="px-2.5 sm:px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Prescribe Diagnostic Tests"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span className="hidden sm:inline">Prescribe Tests</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPrescribeMedModal(true)}
                          className="px-2.5 sm:px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Prescribe Medications"
                        >
                          <Pill className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="hidden sm:inline">Prescribe Rx</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAppointmentModal(true)}
                          className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Schedule Consultation"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          <span className="hidden sm:inline">Appt</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 bg-[#F9FBFA]">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Encrypted Medical Conversation Initiated
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        You and {effectiveRole === 'doctor' ? selectedConnection.patientName : selectedConnection.doctorName} are mutually connected. You can share laboratory results, clinical guidance, and prescriptions safely.
                      </p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.senderId.toLowerCase() === activeUserId.toLowerCase();

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1 font-mono">
                            <span>{msg.senderName}</span>
                            <span>•</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {/* 1. TEXT MESSAGE - Facebook Messenger Style */}
                          {msg.type === 'text' && (
                            <div
                              className={`px-4 py-2.5 rounded-[20px] text-xs max-w-[82%] sm:max-w-md shadow-2xs leading-relaxed transition-all ${
                                isMe
                                  ? 'bg-[#0084FF] text-white rounded-br-[4px]'
                                  : 'bg-[#E4E6EB] text-[#050505] rounded-bl-[4px]'
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-[13px]">{msg.content}</p>
                              <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                                isMe ? 'text-blue-100' : 'text-slate-500'
                              }`}>
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isMe && <CheckCheck className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                          )}

                          {/* 2. SHARED A4 LAB RESULT */}
                          {msg.type === 'result_share' && msg.metadata && (
                            <div className="p-4 rounded-2xl bg-white border-2 border-teal-500/40 shadow-sm max-w-[90%] sm:max-w-md space-y-2.5">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Official Diagnostic Report</span>
                                </span>
                                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                  {msg.metadata.bookingCode}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900">{msg.metadata.testName}</p>
                              <p className="text-[11px] text-slate-500">{msg.metadata.resultSummary}</p>
                              <button
                                type="button"
                                onClick={() => onOpenReportModal && msg.metadata?.bookingId ? onOpenReportModal(msg.metadata.bookingId, msg.metadata.testName) : null}
                                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Inspect Certified A4 Report</span>
                              </button>
                            </div>
                          )}

                          {/* 3. TEST PRESCRIPTION CARD */}
                          {msg.type === 'test_prescription' && msg.metadata && (
                            <div className="p-4 rounded-2xl bg-white border-2 border-teal-500 shadow-sm max-w-[90%] sm:max-w-md space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
                                  <Stethoscope className="w-3.5 h-3.5" />
                                  <span>Laboratory Diagnostic Prescription</span>
                                </span>
                                <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                                  {msg.metadata.prescribedTests?.length || 0} Tests
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-700">
                                Indication: <strong className="text-slate-900">{msg.metadata.clinicalIndication}</strong>
                              </p>
                              <div className="space-y-1.5">
                                {msg.metadata.prescribedTests?.map((t, i) => (
                                  <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                                    <span className="font-bold text-slate-800">{t.name}</span>
                                    <span className="text-[10px] font-mono text-teal-600 font-bold">{t.code}</span>
                                  </div>
                                ))}
                              </div>
                              {effectiveRole === 'patient' && onNavigateToBooking && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToBooking(msg.metadata?.prescribedTests)}
                                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Book Prescribed Tests Now</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* 4. MEDICATION RX PRESCRIPTION */}
                          {msg.type === 'medication_prescription' && msg.metadata && (
                            <div className="p-4 rounded-2xl bg-white border-2 border-indigo-500/50 shadow-sm max-w-[90%] sm:max-w-md space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                                  <Pill className="w-3.5 h-3.5" />
                                  <span>Clinical Rx Prescription</span>
                                </span>
                                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                                  Valid: {msg.metadata.validUntil}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">
                                Indication: <strong className="text-slate-900">{msg.metadata.clinicalIndication}</strong>
                              </p>
                              <div className="space-y-2">
                                {msg.metadata.medications?.map((m, i) => (
                                  <div key={i} className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
                                    <div className="font-bold text-indigo-950">{m.name} ({m.dosage})</div>
                                    <div className="text-[11px] text-slate-600">{m.frequency} &bull; Duration: {m.duration}</div>
                                    {m.instructions && <div className="text-[10px] text-indigo-700 italic">Note: {m.instructions}</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 5. APPOINTMENT CARD */}
                          {msg.type === 'appointment' && msg.metadata && (
                            <div className="p-4 rounded-2xl bg-white border-2 border-amber-500/50 shadow-sm max-w-[90%] sm:max-w-md space-y-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Consultation Scheduled</span>
                              </span>
                              <p className="text-xs font-bold text-slate-900">
                                Date: {msg.metadata.appointmentDate} at {msg.metadata.appointmentTime}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Location: {msg.metadata.location}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Bottom Input Composer - Facebook Messenger Pill Style */}
                <form onSubmit={handleSendText} className="p-3 border-t border-slate-200/90 bg-white flex items-center gap-2.5 shrink-0">
                  {effectiveRole === 'patient' && (
                    <button
                      type="button"
                      onClick={() => setShowShareResultModal(true)}
                      className="p-2 text-[#0084FF] hover:bg-blue-50 rounded-full transition cursor-pointer"
                      title="Attach Official Diagnostic Report"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                  )}

                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder={
                        effectiveRole === 'doctor'
                          ? 'Type clinical advice, guidance, or response...'
                          : 'Aa (Type a message...)'
                      }
                      className="w-full px-4 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6E9] border border-transparent rounded-full text-xs sm:text-[13px] text-[#050505] placeholder-[#65676B] focus:bg-white focus:border-[#0084FF] focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="w-9 h-9 bg-[#0084FF] hover:bg-[#0073E6] disabled:opacity-30 text-white rounded-full flex items-center justify-center transition cursor-pointer shadow-md shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 bg-[#F9FBFA]">
                <div className="w-14 h-14 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Select a Conversation to Begin</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Choose a doctor or patient from your active connections list, or open Find & Connect to request new links.
                </p>
                <button
                  type="button"
                  onClick={() => setHubTab('connect')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Search Global Directory
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: FIND & CONNECT (SEARCH GLOBAL DIRECTORY OF DOCTORS & PATIENTS)   */}
      {/* ========================================================================= */}
      {hubTab === 'connect' && (
        <div className="p-4 sm:p-6 space-y-6 max-h-[660px] overflow-y-auto">
          {/* Patient Privacy Banner with 1-Tap Nickname Editor */}
          {effectiveRole === 'patient' && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-50 via-white to-indigo-50 border border-teal-200/80 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Patient Privacy Nickname Shield</span>
                      {userProfile?.isAnonymous && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-indigo-600" />
                          <span>Anonymous Protection Active</span>
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-600">
                      You appear as <strong className="font-mono text-teal-800">@{privacyNickname || 'Anonymous'}</strong> in public searches. Your legal identity is only revealed once both parties accept connection.
                    </p>
                  </div>
                </div>

                {onOpenEditProfileModal && (
                  <button
                    type="button"
                    onClick={onOpenEditProfileModal}
                    className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer self-start sm:self-auto"
                  >
                    Edit Profile & Nickname
                  </button>
                )}
              </div>

              {/* Quick Inline Nickname Changer */}
              <form onSubmit={handleSavePrivacySettings} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Quick Change Alias</label>
                  <input
                    type="text"
                    required
                    value={privacyNickname}
                    onChange={e => setPrivacyNickname(e.target.value.replace(/[@\s]/g, '_'))}
                    placeholder="e.g. Claire_Health"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4 flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isAnonymousMode}
                      onChange={e => setIsAnonymousMode(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Hide legal name from doctors</span>
                  </label>
                </div>

                <div className="sm:col-span-3 flex items-center pt-4">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Alias</span>
                  </button>
                </div>
              </form>

              {privacySaveSuccess && (
                <div className="p-2 rounded-xl bg-teal-100 text-teal-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Alias updated to "@{privacyNickname}".</span>
                </div>
              )}
            </div>
          )}

          {/* Directory Search Box */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {effectiveRole === 'doctor'
                    ? 'Search Real Patients Directory'
                    : 'Search Accredited Doctors & Diagnostic Specialists'}
                </h3>
                <p className="text-xs text-slate-500">
                  {effectiveRole === 'doctor'
                    ? 'Search registered patients by Nickname, Patient ID, or Phone. Send connection request to review records.'
                    : 'Find accredited physicians and biologists across Cameroon hospitals to review your diagnostic panels.'}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={
                    effectiveRole === 'doctor'
                      ? 'Search patient nickname or PID...'
                      : 'Search doctor name, specialty, hospital...'
                  }
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Directory Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {directoryResults.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  No directory profiles matched "{searchQuery}". Try searching another name or ID.
                </div>
              ) : (
                directoryResults.map(person => {
                  const displayName = person.role === 'patient' 
                    ? (person.isAnonymous ? `@${person.nickname} (Anonymous)` : person.legalName)
                    : person.legalName;

                  return (
                    <div
                      key={person.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-teal-400 transition shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0 overflow-hidden shadow-2xs">
                            {person.avatarUrl ? (
                              <img src={person.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              person.role === 'doctor' ? <Stethoscope className="w-5 h-5 text-teal-700" /> : <User className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{displayName}</h4>
                            <p className="text-[11px] text-teal-700 font-medium truncate">
                              {person.role === 'doctor' ? (person.specialty || 'General Practitioner') : `Patient ID: ${person.id.slice(-6)}`}
                            </p>
                          </div>
                        </div>

                        {person.hospital && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{person.hospital}</span>
                          </p>
                        )}

                        {person.city && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{person.city}</span>
                          </p>
                        )}
                      </div>

                      {/* Connection Action */}
                      <div className="pt-2 border-t border-slate-100">
                        {person.isConnected ? (
                          <button
                            type="button"
                            onClick={() => {
                              const match = connections.find(c => c.doctorId === person.id || c.patientId === person.id);
                              if (match) setSelectedConnection(match);
                              setHubTab('messages');
                              setIsMobileChatOpen(true);
                            }}
                            className="w-full py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Connected (Message)</span>
                          </button>
                        ) : person.hasPendingRequest ? (
                          <div className="w-full py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold text-center">
                            Request Pending Approval
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRequestNoteModalUser(person)}
                            className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Connect / Request Link</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: REQUESTS (MUTUAL CONSENT APPROVAL SCREEN)                          */}
      {/* ========================================================================= */}
      {hubTab === 'requests' && (
        <div className="p-4 sm:p-6 space-y-6 max-h-[660px] overflow-y-auto">
          {/* Pending Incoming Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Inbox className="w-4 h-4 text-teal-600" />
                <span>Pending Incoming Requests ({incomingRequests.length})</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Requires your approval to open clinical chat
              </span>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No incoming connection requests waiting for your approval.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {incomingRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-2xl bg-white border-2 border-teal-500/40 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
                        {req.fromRole === 'doctor' ? <Stethoscope className="w-5 h-5 text-teal-700" /> : <User className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {req.fromRole === 'doctor' ? req.fromName : `@${req.fromNickname || req.fromName}`}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {req.fromRole === 'doctor' ? (req.fromSpecialty || 'Specialist') : 'Registered Patient'}
                        </p>
                      </div>
                    </div>

                    {req.note && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                        "{req.note}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleRespondToRequest(req.id, 'accepted')}
                        className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Connect</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespondToRequest(req.id, 'declined')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests Waiting for Acceptance */}
          {outgoingRequests.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Outgoing Requests Waiting for Acceptance ({outgoingRequests.length})</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {outgoingRequests.map(req => (
                  <div key={req.id} className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{req.toName}</div>
                      <div className="text-[11px] text-slate-500">Sent on {new Date(req.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SEND CONNECTION REQUEST NOTE MODAL                               */}
      {/* ========================================================================= */}
      {requestNoteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Send Connection Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setRequestNoteModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are requesting to connect with <strong className="text-slate-900">{requestNoteModalUser.legalName}</strong>. 
              Direct messages and report sharing become active once accepted.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Optional Introductory Note</label>
              <textarea
                value={connectionNote}
                onChange={e => setConnectionNote(e.target.value)}
                rows={3}
                placeholder="e.g. Hello, I would like to consult on my complete blood count and fasting glucose results."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRequestNoteModalUser(null)}
                className="px-4 py-2 text-slate-600 text-xs font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendConnectionRequest(requestNoteModalUser)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PATIENT SHARE LAB RESULT MODAL                                   */}
      {/* ========================================================================= */}
      {showShareResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Share Diagnostic Report into Chat</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareResultModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select one of your official laboratory batches or test orders to securely transmit to your physician:
            </p>

            <div className="space-y-2">
              {patientBatches.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  No previous diagnostic test batches found for your account.
                </div>
              ) : (
                patientBatches.map(batch => (
                  <div
                    key={batch.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 transition bg-white flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {batch.tests.map(t => t.name).join(', ')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {batch.bookingCode || batch.id} &bull; {batch.labName} &bull; {new Date(batch.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleShareBatchResult(batch)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
                    >
                      Share Report
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DOCTOR PRESCRIBE LAB TESTS MODAL                                 */}
      {/* ========================================================================= */}
      {showPrescribeTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Doctor Laboratory e-Prescription</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrescribeTestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Indication</label>
                <input
                  type="text"
                  value={testPrescriptionIndication}
                  onChange={e => setTestPrescriptionIndication(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Tests to Prescribe</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { code: 'FBC', name: 'Complete Blood Count (NFS)' },
                    { code: 'GLYC', name: 'Fasting Blood Glucose' },
                    { code: 'LIPID', name: 'Lipid Profile' },
                    { code: 'WIDAL', name: 'Widal Serodiagnosis' },
                    { code: 'URINE', name: 'Urinalysis (ECBU)' },
                    { code: 'CREAT', name: 'Serum Creatinine' }
                  ].map(t => (
                    <label key={t.code} className="p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 bg-white cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedTestsToPrescribe.includes(t.code)}
                        onChange={e => {
                          if (e.target.checked) setSelectedTestsToPrescribe([...selectedTestsToPrescribe, t.code]);
                          else setSelectedTestsToPrescribe(selectedTestsToPrescribe.filter(c => c !== t.code));
                        }}
                        className="rounded text-teal-600 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-800">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrescribeTestModal(false)}
                className="px-4 py-2 text-slate-600 text-xs font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTestPrescription}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Transmit Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DOCTOR PRESCRIBE MEDICATIONS (RX) MODAL                          */}
      {/* ========================================================================= */}
      {showPrescribeMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Clinical Medication Prescription (Rx)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrescribeMedModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Indication / Diagnosis</label>
                <input
                  type="text"
                  value={medPrescriptionIndication}
                  onChange={e => setMedPrescriptionIndication(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Prescribed Regimen</label>
                {medList.map((m, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Medication Name"
                        value={m.name}
                        onChange={e => {
                          const copy = [...medList];
                          copy[idx].name = e.target.value;
                          setMedList(copy);
                        }}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        value={m.dosage}
                        onChange={e => {
                          const copy = [...medList];
                          copy[idx].dosage = e.target.value;
                          setMedList(copy);
                        }}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Frequency (e.g. 2x daily)"
                        value={m.frequency}
                        onChange={e => {
                          const copy = [...medList];
                          copy[idx].frequency = e.target.value;
                          setMedList(copy);
                        }}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g. 7 days)"
                        value={m.duration}
                        onChange={e => {
                          const copy = [...medList];
                          copy[idx].duration = e.target.value;
                          setMedList(copy);
                        }}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrescribeMedModal(false)}
                className="px-4 py-2 text-slate-600 text-xs font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateMedPrescription}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Transmit Rx Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DOCTOR SCHEDULE APPOINTMENT MODAL                                */}
      {/* ========================================================================= */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Schedule Consultation Appointment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAppointmentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={e => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Appointment Time</label>
                <input
                  type="text"
                  value={appointmentTime}
                  onChange={e => setAppointmentTime(e.target.value)}
                  placeholder="e.g. 10:30 AM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consultation Mode</label>
                <select
                  value={appointmentType}
                  onChange={e => setAppointmentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="in_person">In-Person Clinic Visit</option>
                  <option value="teleconsultation">Encrypted Tele-Consultation</option>
                  <option value="lab_review">Diagnostic Results Review</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location / Clinic Name</label>
                <input
                  type="text"
                  value={appointmentLocation}
                  onChange={e => setAppointmentLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAppointmentModal(false)}
                className="px-4 py-2 text-slate-600 text-xs font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleAppointment}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Send Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
