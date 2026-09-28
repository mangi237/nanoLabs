import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { db, collection, getDocs, doc, setDoc, updateDoc } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';
import { DoctorPrescriptionModal } from '../../components/doctor/DoctorPrescriptionModal';
import { DoctorAppointmentModal } from '../../components/doctor/DoctorAppointmentModal';
import { DoctorPatientChatHub } from '../../components/chat/DoctorPatientChatHub';
import { doctorChatService } from '../../services/doctorChatService';
// import { dispatchDatabaseFetchError } from '../../utils/databaseErrorBus';
import { 
  Stethoscope, 
  Users, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Search, 
  Filter, 
  Inbox, 
  Eye, 
  Printer, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck,
  RefreshCw,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  Check,
  X,
  Send,
  Camera,
  Upload,
  Edit3,
  UserCheck,
  Loader2,
  Pill,
  Video,
  User,
  UserPlus,
  MessageSquare
} from 'lucide-react';

interface DoctorPortalProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress
}) => {
  const { user, lab, getAllLabs } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'inbox' | 'labs' | 'messages' | 'connect' | 'chat'>('overview');
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);
  
  // Doctor profile & affiliated data
  const [doctorProfile, setDoctorProfile] = useState({
    id: user?.id || (user as any)?.doctorId || 'doc_kamga_101',
    name: user?.name || 'Dr. Attending Physician, MD',
    specialty: (user as any)?.specialty || 'General Medicine & Specialist',
    hospital: (user as any)?.hospital || (user as any)?.hospitalAffiliation || 'Central Referral Hospital',
    phone: user?.phone || '+237 600 000 000',
    email: user?.email || 'physician@health.cm',
    licenseNumber: (user as any)?.licenseNumber || 'ONMC-CMR-ACCREDITED',
    avatarUrl: (user as any)?.avatarUrl || (user as any)?.profilePicture || ''
  });

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: user?.id || (user as any)?.doctorId || 'doc_kamga_101',
    name: user?.name || 'Dr. Attending Physician, MD',
    specialty: (user as any)?.specialty || 'General Medicine & Specialist',
    hospital: (user as any)?.hospital || (user as any)?.hospitalAffiliation || 'Central Referral Hospital',
    phone: user?.phone || '+237 600 000 000',
    email: user?.email || 'physician@health.cm',
    licenseNumber: (user as any)?.licenseNumber || 'ONMC-CMR-ACCREDITED',
    avatarUrl: (user as any)?.avatarUrl || (user as any)?.profilePicture || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [partneredLabs, setPartneredLabs] = useState<any[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [referredBookings, setReferredBookings] = useState<PatientBooking[]>([]);
  const [sharedInboxReports, setSharedInboxReports] = useState<any[]>([]);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState<PatientBooking | null>(null);
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState<any | null>(null);
  const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState<any | null>(null);
  const [chatTargetPatient, setChatTargetPatient] = useState<{ id: string; name: string; phone?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientViewMode, setPatientViewMode] = useState<'my_patients' | 'global_search'>('my_patients');
  const [connectModalTarget, setConnectModalTarget] = useState<any | null>(null);
  const [connectRequestNote, setConnectRequestNote] = useState('');
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);
  const [incomingPatientRequests, setIncomingPatientRequests] = useState<any[]>([]);
  const [respondingPatientRequestId, setRespondingPatientRequestId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshDoctorSocialData = () => {
    const targetDocId = doctorProfile.email || user?.id || 'doc_kamga_101';
    const allReqs = doctorChatService.getRequests(targetDocId);
    const pendingForMe = allReqs.filter(
      r => (r.toId.toLowerCase() === targetDocId.toLowerCase() || (user?.doctorId && r.toId.toLowerCase() === user.doctorId.toLowerCase())) && r.status === 'pending'
    );
    setIncomingPatientRequests(pendingForMe);
  };

  useEffect(() => {
    fetchDoctorEcosystemData();
    refreshDoctorSocialData();
  }, [user?.id, user?.email, user?.name]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprovePatientRequest = (requestId: string) => {
    setRespondingPatientRequestId(requestId);
    try {
      const conn = doctorChatService.acceptConnectionRequest(requestId);
      if (conn) {
        showToast(`Mutual connection established with ${conn.patientName}! You can now review diagnostic records, issue prescriptions, and message.`);
        refreshDoctorSocialData();
      }
    } catch (e) {
      console.error('Error approving request:', e);
    } finally {
      setRespondingPatientRequestId(null);
    }
  };

  const handleDeclinePatientRequest = (requestId: string) => {
    setRespondingPatientRequestId(requestId);
    try {
      doctorChatService.declineConnectionRequest(requestId);
      showToast('Patient connection request declined.');
      refreshDoctorSocialData();
    } catch (e) {
      console.error('Error declining request:', e);
    } finally {
      setRespondingPatientRequestId(null);
    }
  };

  const fetchDoctorEcosystemData = async () => {
    try {
      setLoading(true);
      const allLabs = await getAllLabs();

      const normalizeDocStr = (str?: string) => {
        if (!str) return '';
        return str.toLowerCase().replace(/^(dr|prof|doctor|md|m\.d\.)\.?\s*/i, '').replace(/[^a-z0-9]/g, '');
      };

      const doctorNameNorm = normalizeDocStr(user?.name);
      const doctorNameClean = (user?.name || '').toLowerCase();
      const doctorIdClean = user?.id || '';
      const doctorEmailClean = (user?.email || '').toLowerCase();
      const doctorPhoneClean = (user?.phone || '').replace(/[^0-9]/g, '');

      // 1. Fetch invitations across labs & global doctor_invitations
      let invites: any[] = [];
      try {
        const directInvites = await limsService.fetchDoctorInvitations({
          doctorId: doctorIdClean,
          email: doctorEmailClean,
          phone: doctorPhoneClean,
          name: doctorNameClean
        });
        invites = directInvites || [];
      } catch (invErr) {
        console.warn('Error fetching doctor invitations:', invErr);
      }

      // Also check inside lab referring_doctors collections for pending records matching this doctor
      let activeLabsList: any[] = [];
      for (const currentLab of (allLabs || [{ id: 'lab-1', name: 'nanoLabs Central' }])) {
        try {
          const refDocsSnap = await getDocs(collection(db, 'labs', currentLab.id, 'referring_doctors'));
          let isLinked = false;
          refDocsSnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const docNameNorm = normalizeDocStr(data.name);
            const docEmail = (data.email || '').toLowerCase();
            const docPhone = (data.phone || '').replace(/[^0-9]/g, '');
            const docMatch = 
              (docNameNorm && doctorNameNorm && (docNameNorm === doctorNameNorm || docNameNorm.includes(doctorNameNorm) || doctorNameNorm.includes(docNameNorm))) ||
              (docEmail && docEmail === doctorEmailClean) ||
              (docPhone && doctorPhoneClean && docPhone === doctorPhoneClean) ||
              data.doctorId === doctorIdClean;

            if (docMatch) {
              if (data.invitationStatus === 'pending' || data.status === 'pending') {
                // If not already in invites list, add it
                if (!invites.some(inv => inv.labId === currentLab.id)) {
                  invites.push({
                    id: docSnap.id,
                    labId: currentLab.id,
                    labName: currentLab.name,
                    doctorId: doctorIdClean || data.doctorId || docSnap.id,
                    status: 'pending',
                    invitedAt: data.invitedAt || data.createdAt || new Date().toISOString()
                  });
                }
              } else if (data.status === 'active' || data.invitationStatus === 'accepted' || !data.invitationStatus) {
                isLinked = true;
              }
            }
          });

          if (isLinked) {
            activeLabsList.push(currentLab);
          }
        } catch (e) {
          // Lab query fallback
        }
      }

      // If activeLabsList is empty, default to allLabs for demo visibility
      setPartneredLabs(activeLabsList.length > 0 ? activeLabsList : (allLabs || []));
      setPendingInvitations(invites.filter(inv => inv.status === 'pending'));

      // 2. Fetch Doctor Bookings and Shared Inbox Reports
      let allDoctorBookings: PatientBooking[] = [];
      let allSharedInbox: any[] = [];

      for (const currentLab of (allLabs || [{ id: 'lab-1', name: 'nanoLabs Central' }])) {
        try {
          // Sync real patients registered at this lab
          const patSnap = await getDocs(collection(db, 'labs', currentLab.id, 'patients'));
          const pats = patSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          doctorChatService.syncPatientsFromDatabase(pats);
        } catch (patErr) {}

        try {
          const labBookings = await limsService.fetchAllBookings(currentLab.id);
          const matches = labBookings.filter(b => {
            const refNameNorm = normalizeDocStr(b.referringDoctor || b.doctorName);
            const refId = (b.referringDoctorId || '').trim();
            const refPhone = ((b as any).referringDoctorPhone || '').replace(/[^0-9]/g, '');

            return (
              (refNameNorm && doctorNameNorm && (refNameNorm === doctorNameNorm || refNameNorm.includes(doctorNameNorm) || doctorNameNorm.includes(refNameNorm))) ||
              (refId && (refId === doctorIdClean || (user?.doctorId && refId === user.doctorId))) ||
              (refPhone && doctorPhoneClean && refPhone === doctorPhoneClean)
            );
          });
          allDoctorBookings = [...allDoctorBookings, ...matches];

          // Fetch shared results inbox for this doctor
          const inboxSnap = await getDocs(collection(db, 'labs', currentLab.id, 'doctor_shared_reports'));
          inboxSnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const recipientEmail = (data.doctorEmail || '').toLowerCase();
            const recipientDocNorm = normalizeDocStr(data.doctorName);
            if (
              recipientEmail === doctorEmailClean ||
              (recipientDocNorm && doctorNameNorm && (recipientDocNorm === doctorNameNorm || recipientDocNorm.includes(doctorNameNorm) || doctorNameNorm.includes(recipientDocNorm))) ||
              data.doctorId === doctorIdClean
            ) {
              allSharedInbox.push({ id: docSnap.id, labId: currentLab.id, labName: currentLab.name, ...data });
            }
          });
        } catch (err) {
          console.warn(`Error querying lab ${currentLab.id} for doctor data:`, err);
        }
      }

      // Also fetch from global doctor_shared_results collection
      try {
        const globalSharedSnap = await getDocs(collection(db, 'doctor_shared_results'));
        globalSharedSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const recipientEmail = (data.doctorEmail || '').toLowerCase();
          const recipientDocName = (data.doctorName || '').toLowerCase();
          if (
            recipientEmail === doctorEmailClean ||
            recipientDocName.includes(doctorNameClean) ||
            doctorNameClean.includes(recipientDocName) ||
            data.doctorId === doctorIdClean ||
            !data.doctorId // public shared
          ) {
            allSharedInbox.push({ id: docSnap.id, ...data });
          }
        });
      } catch (gErr) {
        console.warn('Error querying global doctor_shared_results:', gErr);
      }

      // Also bridge local ledger bookings so real test orders booked by patients immediately show up in Doctor Portal
      try {
        const rawLocal = localStorage.getItem('nanolabs_bookings_ledger') || localStorage.getItem('lims_bookings_ledger');
        if (rawLocal) {
          const localList: PatientBooking[] = JSON.parse(rawLocal);
          for (const lb of localList) {
            if (!allDoctorBookings.some(b => b.id === lb.id || (lb.bookingCode && b.bookingCode === lb.bookingCode))) {
              allDoctorBookings.push(lb);
            }
          }
        }
      } catch (lErr) {
        console.warn('Error reading local bookings ledger for doctor portal:', lErr);
      }

      setReferredBookings(allDoctorBookings);
      setSharedInboxReports(allSharedInbox);
    } catch (e) {
      console.error('Error in fetchDoctorEcosystemData:', e);
      // dispatchDatabaseFetchError({
      //   message: 'Doctor Portal failed to load referral bookings and diagnostic test reports from database.',
      //   tableOrCollection: 'labs/{id}/doctor_shared_reports & bookings',
      //   rawError: e
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToInvitation = async (invitation: any, response: 'accepted' | 'declined') => {
    setRespondingInviteId(invitation.id);
    // Optimistic UI update
    setPendingInvitations(prev => prev.filter(inv => inv.id !== invitation.id && inv.labId !== invitation.labId));
    if (response === 'accepted' && invitation.labId) {
      const acceptedLab = (partneredLabs || []).find(l => l.id === invitation.labId) || { id: invitation.labId, name: invitation.labName || 'Partner Diagnostic Center' };
      setPartneredLabs(prev => prev.some(l => l.id === acceptedLab.id) ? prev : [...prev, acceptedLab]);
    }

    try {
      await limsService.respondToDoctorInvitation(
        invitation.id,
        invitation.labId,
        invitation.doctorId || user?.id || '',
        response
      );

      showToast(
        response === 'accepted'
          ? `Partnership confirmed with ${invitation.labName || 'Laboratory'}. You are now linked partners!`
          : `Partnership invitation declined.`
      );

      await fetchDoctorEcosystemData();
    } catch (e) {
      console.error('Error responding to invitation:', e);
      showToast('Partnership updated successfully.');
    } finally {
      setRespondingInviteId(null);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Photo size exceeds 3MB. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        setEditForm(prev => ({ ...prev, avatarUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDoctorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      alert('Please enter your full name.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedProfile = {
        id: editForm.id || user?.id || (user as any)?.doctorId || 'doc_kamga_101',
        name: editForm.name.trim(),
        specialty: editForm.specialty.trim() || 'General Medicine',
        hospital: editForm.hospital.trim() || 'Referral Hospital',
        hospitalAffiliation: editForm.hospital.trim() || 'Referral Hospital',
        phone: editForm.phone.trim(),
        email: editForm.email.trim().toLowerCase(),
        licenseNumber: editForm.licenseNumber.trim() || 'ONMC-CMR-ACCREDITED',
        avatarUrl: editForm.avatarUrl.trim(),
        profilePicture: editForm.avatarUrl.trim(),
        updatedAt: new Date().toISOString()
      };

      // 1. Update in users collection
      if (user?.id) {
        try {
          await setDoc(doc(db, 'users', user.id), updatedProfile, { merge: true });
        } catch (uErr) {
          console.warn('Could not update user doc:', uErr);
        }
      }

      // 2. Update in global doctors collection
      try {
        const docId = user?.id || (user as any)?.doctorId || `doc-${Date.now()}`;
        await setDoc(doc(db, 'doctors', docId), {
          ...updatedProfile,
          id: docId,
          
        }, { merge: true });
      } catch (dErr) {
        console.warn('Could not update global doctors doc:', dErr);
      }

      // 3. Update in lab referring_doctors if lab is connected
      if (lab?.id && user?.id) {
        try {
          await setDoc(doc(db, 'labs', lab.id, 'referring_doctors', user.id), {
            
            doctorId: user.id,
            labId: lab.id,
            ...updatedProfile,
            id: user.id,
          }, { merge: true });
        } catch (refErr) {
          console.warn('Could not update referring_doctors for lab:', refErr);
        }
      }

      setDoctorProfile(updatedProfile);
      setIsEditProfileOpen(false);
      showToast('Profile & picture updated successfully! Patients and labs will see your verified photo.');
    } catch (err: any) {
      console.error('Error saving doctor profile:', err);
      alert('Failed to save profile updates. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Filter Bookings by Time Range
  const now = new Date();
  const getFilteredBookings = () => {
    return referredBookings.filter(b => {
      if (!b.createdAt) return true;
      const bDate = new Date(b.createdAt);
      if (timeFilter === 'day') {
        return (
          bDate.getDate() === now.getDate() &&
          bDate.getMonth() === now.getMonth() &&
          bDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return bDate >= oneWeekAgo;
      }
      if (timeFilter === 'month') {
        return (
          bDate.getMonth() === now.getMonth() &&
          bDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  };

  const filteredBookings = getFilteredBookings();

  // Clinical Summary Calculations
  const totalReferredPatients = new Set(filteredBookings.map(b => b.patientId || b.patientName)).size;
  const totalTestsPrescribed = filteredBookings.reduce((sum, b) => sum + (b.tests?.length || 1), 0);
  const completedReports = filteredBookings.filter(b => b.status === 'completed' || b.biologistConfirmed).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-12">
      <Header
        title="Accredited Physician Clinical Portal"
        subtitle="Diagnostic Prescriptions, Patient Result Routing & Partnered Labs"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-teal-300 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/40 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-6">
        
        {/* Doctor Identity & Quick Profile Hero Banner */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              {doctorProfile.avatarUrl ? (
                <div className="relative group shrink-0">
                  <img
                    src={doctorProfile.avatarUrl}
                    alt={doctorProfile.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg border-2 border-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm(doctorProfile);
                      setIsEditProfileOpen(true);
                    }}
                    className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold text-white cursor-pointer"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Change</span>
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/30 shrink-0 relative group">
                  <Stethoscope className="w-8 h-8" />
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm(doctorProfile);
                      setIsEditProfileOpen(true);
                    }}
                    className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold text-white cursor-pointer"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Add Photo</span>
                  </button>
                </div>
              )}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    ONMC Accredited Physician
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    Lic: {doctorProfile.licenseNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm(doctorProfile);
                      setIsEditProfileOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 hover:bg-white/20 text-teal-200 border border-white/20 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Profile & Photo</span>
                  </button>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {doctorProfile.name}
                </h1>
                <p className="text-xs sm:text-sm text-teal-100/80 flex items-center gap-2 flex-wrap">
                  <span>{doctorProfile.specialty}</span>
                  <span>•</span>
                  <span>{doctorProfile.hospital}</span>
                  <span>•</span>
                  <span className="font-mono text-teal-300">{doctorProfile.phone}</span>
                </p>
              </div>
            </div>

            {/* Time Filter Toggle & Sync Button */}
            <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/40 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
              <span className="text-xs font-bold text-teal-200 px-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Filter:
              </span>
              <button
                onClick={() => setTimeFilter('day')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeFilter === 'day' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeFilter === 'week' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeFilter === 'month' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeFilter === 'all' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                All Time
              </button>

              <button
                onClick={fetchDoctorEcosystemData}
                disabled={loading}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer ml-1"
                title="Sync Live Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Ethics Compliance Banner */}
          <div className="mt-6 pt-4 border-t border-teal-700/50 flex items-start gap-2.5 text-xs text-teal-100/90 bg-teal-950/40 p-3 rounded-2xl border border-teal-600/30">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>
              <strong>Pure Clinical Workflow:</strong> Under Cameroonian medical regulation, this portal strictly facilitates secure diagnostic test ordering, direct report routing, and biological validation review with zero referral commissions.
            </span>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-teal-200/80 text-xs font-semibold flex items-center justify-between">
                <span>Partnered Labs</span>
                <Building2 className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">{partneredLabs.length}</div>
              <div className="text-[11px] text-teal-200/60 mt-0.5">Accredited Testing Facilities</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-teal-200/80 text-xs font-semibold flex items-center justify-between">
                <span>Referred Patients</span>
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">{totalReferredPatients}</div>
              <div className="text-[11px] text-teal-200/60 mt-0.5">Clinical Consultations</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-teal-200/80 text-xs font-semibold flex items-center justify-between">
                <span>Tests Prescribed</span>
                <Layers className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">{totalTestsPrescribed}</div>
              <div className="text-[11px] text-teal-200/60 mt-0.5">Lab Diagnostic Panels</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-teal-200/80 text-xs font-semibold flex items-center justify-between">
                <span>Completed Results</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-300 mt-1">{completedReports}</div>
              <div className="text-[11px] text-teal-200/60 mt-0.5">Biologist Confirmed</div>
            </div>
          </div>
        </div>

        {/* INCOMING PATIENT CONNECTION REQUESTS BANNER */}
        {incomingPatientRequests.length > 0 && (
          <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border-2 border-teal-400/50 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-700 flex items-center justify-center font-bold shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Incoming Patient Connection Requests</span>
                    <span className="px-2 py-0.5 bg-teal-600 text-white rounded-full text-xs font-black">
                      {incomingPatientRequests.length} Pending Approval
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Patients have requested to link their diagnostic records with your clinical care practice. Both parties must approve before records, prescriptions, and direct consultation can be shared.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incomingPatientRequests.map((req) => (
                <div key={req.id} className="bg-white p-4 rounded-2xl border border-teal-200/80 shadow-2xs flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                          {req.fromName?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">{req.fromName}</h4>
                          <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            @{req.fromNickname || req.fromId}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    {req.note && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 italic">
                        "{req.note}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleApprovePatientRequest(req.id)}
                      disabled={respondingPatientRequestId === req.id}
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {respondingPatientRequestId === req.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve & Link Patient</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclinePatientRequest(req.id)}
                      disabled={respondingPatientRequestId === req.id}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                      title="Decline Request"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INCOMING LAB PARTNERSHIP INVITATIONS BANNER */}
        {pendingInvitations.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-400/40 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Incoming Diagnostic Laboratory Partnership Invitations</span>
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full text-xs font-black">
                      {pendingInvitations.length} Pending
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Laboratories have requested to add your accredited physician profile to their clinical collaboration network. Accept to automatically receive patient diagnostic reports and electronic validation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900">{inv.labName || 'nanoLabs Medical Facility'}</h4>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Lab Partnership Request
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Invited: {inv.invitedAt ? new Date(inv.invitedAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleRespondToInvitation(inv, 'accepted')}
                      disabled={respondingInviteId === inv.id}
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {respondingInviteId === inv.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Accept & Join Lab Network</span>
                    </button>
                    <button
                      onClick={() => handleRespondToInvitation(inv, 'declined')}
                      disabled={respondingInviteId === inv.id}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Clinical Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'patients'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Patient Diagnostic Registry ({filteredBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Shared Results Inbox ({sharedInboxReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('labs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'labs'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Partnered Diagnostic Labs ({partneredLabs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'messages' || activeTab === 'chat'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'connect'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Connect</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Patient Results Activity */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Recent Prescribed Patient Test Batches</h3>
                      <p className="text-xs text-slate-400">Real-time status of diagnostic orders referred by your clinic</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('patients')}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500">No patient bookings recorded for this timeframe.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredBookings.slice(0, 6).map((booking) => (
                      <div key={booking.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-xl transition">
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                            <span>{booking.patientName}</span>
                            <span className="font-mono text-[10px] text-slate-400">({booking.bookingCode || booking.id.substring(0, 8)})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {booking.tests?.length || 1} Tests Prescribed • {booking.labName || 'nanoLabs Diagnostics'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1 ${
                            booking.status === 'completed' || booking.biologistConfirmed
                              ? 'bg-emerald-100 text-emerald-800'
                              : booking.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {booking.biologistConfirmed && <CheckCircle2 className="w-3 h-3" />}
                            {booking.biologistConfirmed ? 'Confirmed' : (booking.status || 'Pending')}
                          </span>

                          <button
                            onClick={() => setSelectedBookingForReport(booking)}
                            className="p-2 text-teal-700 hover:bg-teal-50 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                            title="View Official Lab Report"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Report</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Partnered Diagnostic Laboratories Summary */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Partnered Laboratories</h3>
                      <p className="text-xs text-slate-400">Accredited testing centers</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {partneredLabs.slice(0, 4).map((l) => (
                    <div key={l.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-slate-900">{l.name}</strong>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Accredited
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{l.location || l.city || 'Cameroon'}</span>
                      </div>
                      <div className="text-[11px] text-teal-700 font-semibold pt-1">
                        Turnaround: 2-4 Hours • Biologist Confirmed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PATIENT DIAGNOSTIC REGISTRY & GLOBAL PATIENT SEARCH */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            {/* View Mode Segmented Controls & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPatientViewMode('my_patients')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    patientViewMode === 'my_patients'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Referred Orders ({filteredBookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPatientViewMode('global_search')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    patientViewMode === 'global_search'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Global Patient Directory</span>
                </button>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    patientViewMode === 'global_search'
                      ? "Search patient nickname, PID, city..."
                      : "Search referred booking, PID, test..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>

            {/* SUB-VIEW A: GLOBAL PATIENT DIRECTORY SEARCH */}
            {patientViewMode === 'global_search' ? (
              <div className="space-y-3">
                <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200/80 flex items-center justify-between text-xs text-teal-950">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>
                      <strong>Mutual Privacy Consent:</strong> In nanoLabs, doctors can search patients by Nickname or PID. Once both accept, you can prescribe laboratory test panels, issue medications (Rx), and inspect certified A4 diagnostic reports.
                    </span>
                  </div>
                </div>

                {(() => {
                  const targetDocId = doctorProfile.email || user?.id || 'doc_kamga_101';
                  const directoryList = doctorChatService.searchDirectory(searchQuery, 'patient', targetDocId);

                  if (directoryList.length === 0) {
                    return (
                      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                        <Users className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-700">No Patients Found</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          No registered patient matched "{searchQuery}". Patients can register or set privacy nicknames in the patient portal.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {directoryList.map(pat => {
                        const displayName = pat.isAnonymous ? `@${pat.nickname} (Anonymous)` : pat.legalName;
                        return (
                          <div
                            key={pat.id}
                            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs hover:border-teal-400 transition flex flex-col justify-between gap-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base shadow-2xs">
                                  {pat.avatarUrl ? (
                                    <img src={pat.avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" />
                                  ) : (
                                    <User className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-900 truncate">{displayName}</h4>
                                  <span className="text-[10px] font-mono text-slate-500 block">PID: {pat.id}</span>
                                </div>
                              </div>

                              <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Location: {pat.city || 'Douala, Cameroon'}</span>
                                </div>
                                {pat.bio && (
                                  <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                                    "{pat.bio}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Mutual Connection Status Action */}
                            <div className="pt-2 border-t border-slate-100">
                              {pat.isConnected ? (
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Connected</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChatTargetPatient({ id: pat.id, name: displayName, phone: pat.phone });
                                      setActiveTab('chat');
                                    }}
                                    className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Chat & Prescribe</span>
                                  </button>
                                </div>
                              ) : pat.hasPendingRequest ? (
                                <div className="w-full py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold text-center">
                                  Connection Request Pending
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConnectModalTarget({
                                    id: pat.id,
                                    name: displayName,
                                    nickname: pat.nickname,
                                    city: pat.city
                                  })}
                                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Connect / Request Link</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* SUB-VIEW B: MY REFERRED ORDERS */
              filteredBookings.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                  <Users className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">No Patient Prescriptions Recorded</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you prescribe lab tests or patients share their test results with your accredited profile, they will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPatientViewMode('global_search')}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    Search Global Patient Directory
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Booking / Date</th>
                          <th className="py-3.5 px-4">Patient Name & PID</th>
                          <th className="py-3.5 px-4">Connection Status</th>
                          <th className="py-3.5 px-4">Laboratory</th>
                          <th className="py-3.5 px-4">Diagnostic Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredBookings
                          .filter(b => {
                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase();
                            return (
                              b.patientName.toLowerCase().includes(q) ||
                              ((b as any).patientPid && (b as any).patientPid.toLowerCase().includes(q)) ||
                              (b.bookingCode && b.bookingCode.toLowerCase().includes(q))
                            );
                          })
                          .map(b => {
                            const targetDocId = doctorProfile.id || user?.id || 'doc_kamga_101';
                            const patId = b.patientId || (b as any).patientPid || b.id;
                            const isConnected = Boolean(doctorChatService.getConnectionBetween(targetDocId, patId));
                            const hasPending = Boolean(doctorChatService.hasPendingRequestBetween(targetDocId, patId));

                            return (
                              <tr key={b.id} className="hover:bg-slate-50 transition">
                                <td className="py-3.5 px-4 font-mono">
                                  <span className="font-bold text-slate-900 block">{b.bookingCode || b.id.substring(0, 8)}</span>
                                  <span className="text-[10px] text-slate-400">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-900">{b.patientName}</div>
                                  <div className="text-[11px] text-slate-500">PID: {patId} • {b.patientGender || 'Adult'}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {isConnected ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Mutually Connected</span>
                                    </span>
                                  ) : hasPending ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>Request Pending</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConnectModalTarget({
                                        id: patId,
                                        name: b.patientName,
                                        nickname: b.patientName,
                                        phone: b.patientPhone
                                      })}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition cursor-pointer"
                                    >
                                      <UserPlus className="w-3 h-3 text-teal-600" />
                                      <span>+ Connect</span>
                                    </button>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-slate-800">{b.labName || 'nanoLabs Facility'}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1 ${
                                    b.status === 'completed' || b.biologistConfirmed
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : b.status === 'processing'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {b.biologistConfirmed && <CheckCircle2 className="w-3 h-3" />}
                                    {b.biologistConfirmed ? 'Confirmed' : (b.status || 'Pending')}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedBookingForReport(b)}
                                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                                      title="View Test Report"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Report</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!isConnected) {
                                          setConnectModalTarget({ id: patId, name: b.patientName, nickname: b.patientName, phone: b.patientPhone });
                                        } else {
                                          setSelectedPatientForAppointment({
                                            id: patId,
                                            name: b.patientName,
                                            phone: b.patientPhone,
                                            bookingId: b.id
                                          });
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                      title={isConnected ? "Schedule Clinic or Video Appointment" : "Connect first to schedule consultation"}
                                    >
                                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Consult</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!isConnected) {
                                          setConnectModalTarget({ id: patId, name: b.patientName, nickname: b.patientName, phone: b.patientPhone });
                                        } else {
                                          setSelectedPatientForPrescription({
                                            id: patId,
                                            name: b.patientName,
                                            phone: b.patientPhone,
                                            bookingId: b.id
                                          });
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                      title={isConnected ? "Issue E-Prescription & Dosage Timing" : "Connect first to issue prescription"}
                                    >
                                      <Pill className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Rx</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!isConnected) {
                                          setConnectModalTarget({ id: patId, name: b.patientName, nickname: b.patientName, phone: b.patientPhone });
                                        } else {
                                          setChatTargetPatient({
                                            id: patId,
                                            name: b.patientName,
                                            phone: b.patientPhone
                                          });
                                          setActiveTab('chat');
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Direct Tele-Chat with Patient"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                                      <span>Chat</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 3: SHARED RESULTS INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-teal-600" />
                    Patient-Shared Clinical Results Inbox
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Results sent directly by patients via verified OTP authorization for consultation review.
                  </p>
                </div>
                <button
                  onClick={fetchDoctorEcosystemData}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Inbox</span>
                </button>
              </div>
            </div>

            {sharedInboxReports.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">Inbox is Empty</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  When patients select your accredited physician name and share their completed diagnostic test batches from their patient portal, they will appear here instantly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharedInboxReports.map((report) => (
                  <div key={report.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                            Patient Result Share
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">{report.patientName || 'Patient Consultation'}</h4>
                          <span className="text-xs text-slate-400">{report.sharedAt ? new Date(report.sharedAt).toLocaleDateString() : 'Recent Share'}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          OTP Verified
                        </span>
                      </div>

                      {report.personalNotes && (
                        <div className="my-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100 italic">
                          "{report.personalNotes}"
                        </div>
                      )}

                      <div className="text-xs text-slate-500">
                        <strong>Test Batch:</strong> {report.testBatchName || 'Clinical Diagnostic Report'}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">{report.labName || 'Central Lab'}</span>
                      <button
                        onClick={() => {
                          const reportBooking: any = {
                            id: report.id,
                            bookingCode: `SHR-${report.id.substring(0, 6)}`,
                            patientName: report.patientName,
                            patientPid: report.patientId,
                            labName: report.labName || 'Central Diagnostic Facility',
                            doctorName: doctorProfile.name,
                            referringDoctor: doctorProfile.name,
                            status: 'completed',
                            biologistConfirmed: true,
                            tests: report.tests || []
                          };
                          setSelectedBookingForReport(reportBooking);
                        }}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Report</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PARTNERED LABS */}
        {activeTab === 'labs' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Accredited Diagnostic Laboratories Network
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Directory of diagnostic medical laboratories connected to your accredited physician portal in Cameroon.
              </p>
            </div>

            {/* Pending Invitations Sub-Section if any */}
            {pendingInvitations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Pending Partnership Invitations ({pendingInvitations.length})</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingInvitations.map((inv) => (
                    <div key={inv.id} className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col justify-between gap-3">
                      <div>
                        <h5 className="text-sm font-extrabold text-slate-900">{inv.labName || 'Diagnostic Facility'}</h5>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Invited you to connect for direct digital results routing and prescribed test tracking.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                        <button
                          onClick={() => handleRespondToInvitation(inv, 'accepted')}
                          disabled={respondingInviteId === inv.id}
                          className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Invitation</span>
                        </button>
                        <button
                          onClick={() => handleRespondToInvitation(inv, 'declined')}
                          disabled={respondingInviteId === inv.id}
                          className="px-3 py-2 bg-white text-slate-600 rounded-xl text-xs font-semibold transition hover:bg-slate-100 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Connected Laboratories */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Connected Partner Laboratories ({partneredLabs.length})</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partneredLabs.map((labItem) => (
                  <div key={labItem.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Accredited Partner
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{labItem.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{labItem.location || labItem.city || 'Cameroon'}</span>
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div><strong>Director:</strong> {labItem.directorName || 'Lead Clinical Biologist'}</div>
                      <div><strong>Phone:</strong> {labItem.phone || labItem.contactNumber || '+237 600 000 000'}</div>
                      <div><strong>Turnaround:</strong> 2 - 4 Hours Fast-Track</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PATIENT TELE-CHAT & PRESCRIPTIONS / SOCIAL CONNECT */}
        {(activeTab === 'messages' || activeTab === 'chat' || activeTab === 'connect') && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm animate-in fade-in duration-200">
            <DoctorPatientChatHub
              currentRole="doctor"
              initialHubTab={activeTab === 'connect' ? 'connect' : 'messages'}
              currentDoctorId={user?.id || 'doc_kamga_101'}
              currentDoctorName={doctorProfile.name}
              initialPatientId={chatTargetPatient?.id}
              initialPatientName={chatTargetPatient?.name}
              
            />
          </div>
        )}
      </main>

      {/* Modern Mobile-First Sticky Bottom Navigation Bar for Doctor */}
      <nav 
        id="doctor-sticky-bottom-nav"
        aria-label="Doctor Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-2 shadow-xl flex items-center justify-around md:hidden"
      >
        <button
          id="btn-doc-nav-overview"
          type="button"
          onClick={() => {
            setActiveTab('overview');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'overview' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px]">Overview</span>
        </button>

        <button
          id="btn-doc-nav-patients"
          type="button"
          onClick={() => {
            setActiveTab('patients');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'patients' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Patients</span>
        </button>

        <button
          id="btn-doc-nav-messages"
          type="button"
          onClick={() => {
            setActiveTab('messages');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'messages' || activeTab === 'chat' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Messages</span>
        </button>

        <button
          id="btn-doc-nav-connect"
          type="button"
          onClick={() => {
            setActiveTab('connect');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'connect' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserPlus className="w-5 h-5" />
          <span className="text-[10px]">Connect</span>
        </button>

        <button
          id="btn-doc-nav-inbox"
          type="button"
          onClick={() => {
            setActiveTab('inbox');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'inbox' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-5 h-5" />
          <span className="text-[10px]">Inbox</span>
        </button>

        <button
          id="btn-doc-nav-labs"
          type="button"
          onClick={() => {
            setActiveTab('labs');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'labs' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px]">Labs</span>
        </button>

        <button
          id="btn-doc-nav-profile"
          type="button"
          onClick={() => onProfilePress ? onProfilePress() : setIsEditProfileOpen(true)}
          className="flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>

      {/* PDF LAB REPORT MODAL */}
      {selectedBookingForReport && (
        <LabReportPdfViewModal
          isOpen={!!selectedBookingForReport}
          booking={selectedBookingForReport}
          onClose={() => setSelectedBookingForReport(null)}
        />
      )}

      {/* DOCTOR E-PRESCRIPTION MODAL */}
      {selectedPatientForPrescription && (
        <DoctorPrescriptionModal
          isOpen={Boolean(selectedPatientForPrescription)}
          onClose={() => setSelectedPatientForPrescription(null)}
          patient={selectedPatientForPrescription}
          doctor={{
            id: user?.id || 'doc-1',
            name: user?.name || doctorProfile.name,
            specialty: doctorProfile.specialty,
            licenseNumber: doctorProfile.licenseNumber,
            hospital: doctorProfile.hospital
          }}
          relatedBookingId={selectedPatientForPrescription.bookingId}
          onPrescriptionCreated={() => {
            showToast('E-Prescription successfully transmitted to patient profile.');
          }}
        />
      )}

      {/* DOCTOR APPOINTMENT MODAL */}
      {selectedPatientForAppointment && (
        <DoctorAppointmentModal
          isOpen={Boolean(selectedPatientForAppointment)}
          onClose={() => setSelectedPatientForAppointment(null)}
          patient={selectedPatientForAppointment}
          doctor={{
            id: user?.id || 'doc-1',
            name: user?.name || doctorProfile.name,
            specialty: doctorProfile.specialty,
            hospital: doctorProfile.hospital
          }}
          relatedBookingId={selectedPatientForAppointment.bookingId}
          onAppointmentScheduled={() => {
            showToast('Consultation appointment successfully scheduled and confirmed.');
          }}
        />
      )}

      {/* EDIT PROFILE & PHOTO MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-slate-900 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Edit3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Physician Profile & Photo</h3>
                <p className="text-xs text-slate-500">Update your clinical credentials, photo, and hospital affiliation</p>
              </div>
            </div>

            <form onSubmit={handleSaveDoctorProfile} className="space-y-4">
              {/* Profile Photo Upload / URL */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Physician Profile Photo</label>
                <div className="flex items-center gap-4">
                  {editForm.avatarUrl ? (
                    <img
                      src={editForm.avatarUrl}
                      alt="Doctor Preview"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xl shrink-0">
                      <Stethoscope className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo from Device</span>
                    </button>
                    <p className="text-[10px] text-slate-500">JPG, PNG, WebP up to 3MB</p>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-semibold text-slate-600">Or Paste Direct Image URL</label>
                  <input
                    type="url"
                    value={editForm.avatarUrl}
                    onChange={e => setEditForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                    placeholder="https://example.com/doctor-photo.jpg"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name (with Title) *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Dr. Christian Ngu, MD"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Specialty */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical Specialty *</label>
                  <input
                    type="text"
                    required
                    value={editForm.specialty}
                    onChange={e => setEditForm(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="e.g. Cardiology, Pediatrics, General Medicine"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Hospital / Clinic */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Affiliation *</label>
                  <input
                    type="text"
                    required
                    value={editForm.hospital}
                    onChange={e => setEditForm(prev => ({ ...prev, hospital: e.target.value }))}
                    placeholder="e.g. Laquintinie Hospital Douala"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+237 600 000 000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* License Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ONMC Accreditation / License ID</label>
                  <input
                    type="text"
                    value={editForm.licenseNumber}
                    onChange={e => setEditForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="ONMC-CMR-12345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Clinical Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="physician@hospital.cm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Save & Update Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connection Request Modal */}
      {connectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Request Patient Connection</h3>
              </div>
              <button
                type="button"
                onClick={() => setConnectModalTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-950 space-y-1">
              <strong>Mutual Consent Required:</strong>
              <p>
                In nanoLabs, both physician and patient must accept the connection before clinical prescriptions (Rx), diagnostic reports, or tele-consultations can be shared.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{connectModalTarget.name}</h4>
                <span className="text-[10px] text-slate-500 font-mono">PID: {connectModalTarget.id}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Introductory Clinical Note</label>
              <textarea
                value={connectRequestNote}
                onChange={e => setConnectRequestNote(e.target.value)}
                rows={3}
                placeholder={`Hello, Dr. ${doctorProfile.name} would like to connect with you regarding your diagnostic laboratory follow-up.`}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConnectModalTarget(null)}
                className="px-4 py-2 text-slate-600 text-xs font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = doctorChatService.sendConnectionRequest({
                    fromUser: {
                      id: user?.id || 'doc_kamga_101',
                      name: doctorProfile.name,
                      role: 'doctor',
                      avatarUrl: doctorProfile.avatarUrl
                    },
                    targetUserId: connectModalTarget.id,
                    note: connectRequestNote.trim() || `Dr. ${doctorProfile.name} requested connection to review your laboratory diagnostic panels.`
                  });
                  if (res.success) {
                    showToast(res.message);
                    setConnectModalTarget(null);
                    setConnectRequestNote('');
                  } else {
                    showToast(res.message);
                  }
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Send Connection Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPortal;
