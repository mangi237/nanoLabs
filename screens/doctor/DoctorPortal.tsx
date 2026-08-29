import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { db, collection, getDocs } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';
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
  Send
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

  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'inbox' | 'labs'>('overview');
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);
  
  // Doctor profile & affiliated data
  const [doctorProfile, setDoctorProfile] = useState({
    name: user?.name || 'Dr. Attending Physician, MD',
    specialty: (user as any)?.specialty || 'General Medicine & Specialist',
    hospital: (user as any)?.hospital || (user as any)?.hospitalAffiliation || 'Central Referral Hospital',
    phone: user?.phone || '+237 600 000 000',
    email: user?.email || 'physician@health.cm',
    licenseNumber: (user as any)?.licenseNumber || 'ONMC-CMR-ACCREDITED'
  });

  const [partneredLabs, setPartneredLabs] = useState<any[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [referredBookings, setReferredBookings] = useState<PatientBooking[]>([]);
  const [sharedInboxReports, setSharedInboxReports] = useState<any[]>([]);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState<PatientBooking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctorEcosystemData();
  }, [user?.id, user?.email, user?.name]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDoctorEcosystemData = async () => {
    try {
      setLoading(true);
      const allLabs = await getAllLabs();

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
            const docName = (data.name || '').toLowerCase();
            const docEmail = (data.email || '').toLowerCase();
            const docPhone = (data.phone || '').replace(/[^0-9]/g, '');
            const docMatch = 
              (docName && (docName.includes(doctorNameClean) || doctorNameClean.includes(docName))) ||
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
          const labBookings = await limsService.fetchAllBookings(currentLab.id);
          const matches = labBookings.filter(b => {
            const refName = (b.doctorName || b.referringDoctor || '').toLowerCase();
            const refId = b.referringDoctorId || '';
            return (
              (refName && (refName.includes(doctorNameClean) || doctorNameClean.includes(refName))) ||
              (refId && refId === doctorIdClean)
            );
          });
          allDoctorBookings = [...allDoctorBookings, ...matches];

          // Fetch shared results inbox for this doctor
          const inboxSnap = await getDocs(collection(db, 'labs', currentLab.id, 'doctor_shared_reports'));
          inboxSnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const recipientEmail = (data.doctorEmail || '').toLowerCase();
            const recipientDocName = (data.doctorName || '').toLowerCase();
            if (
              recipientEmail === doctorEmailClean ||
              recipientDocName.includes(doctorNameClean) ||
              doctorNameClean.includes(recipientDocName) ||
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

      setReferredBookings(allDoctorBookings);
      setSharedInboxReports(allSharedInbox);
    } catch (e) {
      console.error('Error in fetchDoctorEcosystemData:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToInvitation = async (invitation: any, response: 'accepted' | 'declined') => {
    setRespondingInviteId(invitation.id);
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
      alert('Could not update partnership status. Please try again.');
    } finally {
      setRespondingInviteId(null);
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Doctor Identity & Quick Profile Hero Banner */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/30 shrink-0">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    ONMC Accredited Physician
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    Lic: {doctorProfile.licenseNumber}
                  </span>
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

        {/* TAB 2: PATIENT DIAGNOSTIC REGISTRY */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient name, PID, or test..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                Showing <strong>{filteredBookings.length}</strong> patient diagnostic orders
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No Patient Prescriptions Recorded</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  When you prescribe lab tests or patients share their test results with your accredited profile, they will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Booking / Date</th>
                        <th className="py-3.5 px-4">Patient Name & PID</th>
                        <th className="py-3.5 px-4">Laboratory</th>
                        <th className="py-3.5 px-4">Prescribed Tests & Prices</th>
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
                        .map(b => (
                          <tr key={b.id} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-bold text-slate-900 block">{b.bookingCode || b.id.substring(0, 8)}</span>
                              <span className="text-[10px] text-slate-400">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{b.patientName}</div>
                              <div className="text-[11px] text-slate-500">PID: {b.patientId || (b as any).patientPid || 'PID-GEN'} • {b.patientGender || 'Adult'}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">{b.labName || 'nanoLabs Facility'}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                {b.tests && b.tests.length > 0 ? (
                                  b.tests.map((t: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                      <span className="font-semibold text-slate-800">{t.name || t.testName}</span>
                                      <span className="font-mono text-slate-500">{Number(t.price || t.cost || 0).toLocaleString()} FCFA</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                                    General Diagnostic Panel
                                  </span>
                                )}
                              </div>
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
                              <button
                                onClick={() => setSelectedBookingForReport(b)}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto shadow-sm cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Report</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                          const mockBooking: any = {
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
                          setSelectedBookingForReport(mockBooking);
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
      </main>

      {/* PDF LAB REPORT MODAL */}
      {selectedBookingForReport && (
        <LabReportPdfViewModal
          isOpen={!!selectedBookingForReport}
          booking={selectedBookingForReport}
          onClose={() => setSelectedBookingForReport(null)}
        />
      )}
    </div>
  );
};

export default DoctorPortal;
