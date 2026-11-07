import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Star,
  Stethoscope,
  Video,
  MessageCircle,
  Clock,
  ShieldCheck,
  Inbox,
  UserPlus,
  Check,
  Building2,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';
import {
  doctorPatientFirestoreService,
  DoctorPatientConnectionRecord,
  formatPatientAlias,
} from '../../services/doctorPatientFirestoreService';

export interface DoctorDirectoryItem {
  id: string;
  name: string;
  specialty: string;
  category: 'General' | 'Specialist';
  hospital: string;
  rating: number;
  reviewsCount: number;
  city: string;
  online: boolean;
  avatarUrl: string;
  about: string;
  services: string[];
  phone?: string;
  licenseNumber?: string;
}

export const PLATFORM_DOCTORS_DIRECTORY: DoctorDirectoryItem[] = [];
export const REAL_DOCTORS_DIRECTORY: DoctorDirectoryItem[] = [];

interface MyDoctorsScreenProps {
  onBack: () => void;
  onSelectDoctor: (doctor: DoctorDirectoryItem) => void;
  onViewAppointments?: () => void;
  onOpenChatWithDoctor?: (doctor: DoctorDirectoryItem) => void;
}

const FALLBACK_DOC_AVATAR =
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80';

export const MyDoctorsScreen: React.FC<MyDoctorsScreenProps> = ({
  onBack,
  onSelectDoctor,
  onViewAppointments,
  onOpenChatWithDoctor,
}) => {
  const { user } = useAuth();
  const { activeProfile, isDependentActive } = useFamilyProfile();

  const [topTab, setTopTab] = useState<'directory' | 'messages' | 'requests'>('directory');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'General' | 'Specialist'>('All');
  const [doctorsList, setDoctorsList] = useState<DoctorDirectoryItem[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [connections, setConnections] = useState<DoctorPatientConnectionRecord[]>([]);

  const activePatientId = isDependentActive
    ? activeProfile.id
    : user?.id || user?.patientId || activeProfile.id;
  const activePatientPid = isDependentActive
    ? activeProfile.id
    : user?.patientId || user?.id || activeProfile.id;
  const activePatientName = isDependentActive
    ? activeProfile.fullName
    : user?.name || activeProfile.fullName || 'Patient';
  const activePatientAlias = formatPatientAlias(
    (user as any)?.alias || activeProfile?.nickname,
    activePatientName
  );

  const fetchLiveDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const live = await doctorPatientFirestoreService.listDoctors('');
      const formatted: DoctorDirectoryItem[] = live.map((doc) => ({
        id: doc.id,
        name: doc.name,
        specialty: doc.specialty,
        category: doc.specialty.toLowerCase().includes('general') ? 'General' : 'Specialist',
        hospital: doc.hospital,
        rating: 4.9,
        reviewsCount: 14,
        city: doc.city || 'Cameroon',
        online: doc.status === 'active',
        avatarUrl: doc.avatarUrl || FALLBACK_DOC_AVATAR,
        about: doc.bio,
        services: ['Consultation', 'Lab Request & Review', 'Encrypted Chat'],
        phone: doc.phone,
        licenseNumber: doc.licenseNumber,
      }));
      setDoctorsList(formatted);
    } catch (err) {
      console.warn('Could not load live platform doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchLiveDoctors();
    window.addEventListener('nanolabs_doctors_updated', fetchLiveDoctors);
    return () => window.removeEventListener('nanolabs_doctors_updated', fetchLiveDoctors);
  }, []);

  useEffect(() => {
    const unsub = doctorPatientFirestoreService.subscribePatientConnections(
      activePatientId,
      activePatientPid,
      (list) => setConnections(list)
    );
    return () => unsub();
  }, [activePatientId, activePatientPid]);

  const acceptedConnections = connections.filter((c) => c.status === 'accepted');
  const incomingRequests = connections.filter(
    (c) => c.status === 'pending' && c.requestedBy === 'doctor'
  );
  const outgoingRequests = connections.filter(
    (c) => c.status === 'pending' && c.requestedBy === 'patient'
  );

  const connectedDoctorIds = new Set(acceptedConnections.map((c) => c.doctorId));
  const outgoingDoctorIds = new Set(outgoingRequests.map((c) => c.doctorId));

  const handleSendRequest = async (doctor: DoctorDirectoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activePatientId) return;
    try {
      await doctorPatientFirestoreService.requestConnection({
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        doctorHospital: doctor.hospital,
        doctorPhone: doctor.phone,
        doctorAvatar: doctor.avatarUrl,
        patientId: activePatientId,
        patientPid: activePatientPid,
        patientName: activePatientName,
        patientAlias: activePatientAlias,
        patientPhone: activeProfile.phone || user?.phone || '',
        patientCity: activeProfile.city || (user as any)?.city || '',
        requestedBy: 'patient',
        note: `Follow & diagnostic consultation request from ${activePatientName} (@${activePatientAlias})`,
      });
      setPatientBookingNotice(`Connection request sent to ${doctor.name}.`);
      setTimeout(() => setPatientBookingNotice(null), 4000);
    } catch (err) {
      console.warn('Failed to send doctor connection request:', err);
    }
  };

  const handleAcceptIncoming = async (conn: DoctorPatientConnectionRecord) => {
    await doctorPatientFirestoreService.respondToConnection(conn.id, 'accepted');
  };

  const handleDeclineIncoming = async (conn: DoctorPatientConnectionRecord) => {
    await doctorPatientFirestoreService.respondToConnection(conn.id, 'declined');
  };

  const filteredDoctors = doctorsList.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.hospital.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Merge connected doctors from directory + connection metadata
  const connectedDoctors: DoctorDirectoryItem[] = acceptedConnections.map((conn) => {
    const found = doctorsList.find((d) => d.id === conn.doctorId);
    if (found) return found;
    return {
      id: conn.doctorId,
      name: conn.doctorName || 'Connected Doctor',
      specialty: conn.doctorSpecialty || 'General Medicine',
      category: 'Specialist',
      hospital: conn.doctorHospital || 'Clinical Practice',
      rating: 4.9,
      reviewsCount: 10,
      city: 'Cameroon',
      online: true,
      avatarUrl: conn.doctorAvatar || FALLBACK_DOC_AVATAR,
      about: `${conn.doctorSpecialty || 'Medical Practitioner'} at ${conn.doctorHospital || 'Clinical Practice'}.`,
      services: ['Consultation', 'Lab Review', 'Encrypted Chat'],
      phone: conn.doctorPhone,
    };
  });

  // Appointment Booking State
  const [bookingDoctor, setBookingDoctor] = useState<DoctorDirectoryItem | null>(null);
  const [appDate, setAppDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [appTime, setAppTime] = useState('10:00 AM');
  const [appType, setAppType] = useState<'in_person' | 'teleconsultation'>('in_person');
  const [appReason, setAppReason] = useState('Consultation & Diagnostic Results Interpretation');
  const [patientBookingNotice, setPatientBookingNotice] = useState<string | null>(null);

  const handleSubmitPatientBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor || !activePatientId) return;

    await doctorPatientFirestoreService.createAppointment({
      doctorId: bookingDoctor.id,
      doctorName: bookingDoctor.name,
      doctorSpecialty: bookingDoctor.specialty,
      doctorHospital: bookingDoctor.hospital,
      patientId: activePatientId,
      patientPid: activePatientPid,
      patientName: activePatientName,
      patientAlias: activePatientAlias,
      patientPhone: activeProfile.phone || user?.phone || '',
      date: appDate,
      time: appTime,
      type: appType,
      location:
        appType === 'teleconsultation'
          ? 'Encrypted Video Teleconsultation'
          : bookingDoctor.hospital,
      reason: appReason,
      initiatedBy: 'patient',
    });

    setBookingDoctor(null);
    setPatientBookingNotice(
      `Appointment request sent to ${bookingDoctor.name} for ${appDate} at ${appTime}.`
    );
    setTimeout(() => setPatientBookingNotice(null), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {patientBookingNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{patientBookingNotice}</span>
          </div>
          <button
            onClick={() => setPatientBookingNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Physicians &amp; Clinical Consultations
            </h1>
            <p className="text-[11px] text-slate-500">
              Your search alias for doctors: <strong className="font-mono text-[#006978]">@{activePatientAlias}</strong> &bull; PID <strong className="font-mono">{activePatientPid}</strong>
            </p>
          </div>
        </div>

        {onViewAppointments && (
          <button
            onClick={onViewAppointments}
            className="px-4 py-2 bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#006978] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Appointments</span>
          </button>
        )}
      </div>

      {/* 3 Main View Tabs */}
      <div className="flex items-center border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setTopTab('directory')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            topTab === 'directory'
              ? 'border-[#006978] text-[#006978]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Accredited Doctors ({doctorsList.length})</span>
        </button>

        <button
          onClick={() => setTopTab('messages')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            topTab === 'messages'
              ? 'border-[#006978] text-[#006978]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Encrypted Chats ({connectedDoctors.length})</span>
        </button>

        <button
          onClick={() => setTopTab('requests')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            topTab === 'requests'
              ? 'border-[#006978] text-[#006978]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Follow Requests ({incomingRequests.length + outgoingRequests.length})</span>
          {incomingRequests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* TAB 1: ACCREDITED DOCTORS DIRECTORY */}
      {topTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search registered physician by name, specialty, or hospital..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-[#006978] shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              {(['All', 'General', 'Specialist'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#006978] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loadingDoctors ? (
            <div className="p-10 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              Loading registered physicians from Firestore...
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
              <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Matching Registered Physicians</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Only real doctors who have registered on nanoLabs appear in this directory. Your doctor can also find you directly by your alias <strong>@{activePatientAlias}</strong>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doctor) => {
                const isConnected = connectedDoctorIds.has(doctor.id);
                const isRequested = outgoingDoctorIds.has(doctor.id);

                return (
                  <div
                    key={doctor.id}
                    onClick={() => onSelectDoctor(doctor)}
                    className="p-5 bg-white border border-slate-200 hover:border-[#006978] rounded-3xl shadow-xs space-y-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0">
                          <img
                            src={doctor.avatarUrl}
                            alt={doctor.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                          />
                          {doctor.online && (
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border-2 border-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006978]">
                              {doctor.name}
                            </h4>
                            <span className="flex items-center text-amber-500 text-xs font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                              {doctor.rating}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#006978] mt-0.5">
                            {doctor.specialty}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            <span>{doctor.hospital}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {doctor.about}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {doctor.services.slice(0, 2).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isConnected ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenChatWithDoctor) {
                                onOpenChatWithDoctor(doctor);
                              } else {
                                onSelectDoctor(doctor);
                              }
                            }}
                            className="px-3 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Encrypted Chat</span>
                          </button>
                        ) : isRequested ? (
                          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                            Request Sent
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleSendRequest(doctor, e)}
                            className="px-3.5 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow / Connect</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ENCRYPTED CHATS WITH DOCTORS */}
      {topTab === 'messages' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
            <span className="text-slate-600 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#006978]" />
              <span>End-to-end AES-256-GCM encrypted channels with your connected physicians.</span>
            </span>
            <span className="font-bold text-[#006978]">{connectedDoctors.length} Connected</span>
          </div>

          {connectedDoctors.length > 0 ? (
            <div className="space-y-3">
              {connectedDoctors.map((doctor) => {
                const conn = acceptedConnections.find((c) => c.doctorId === doctor.id);
                return (
                  <div
                    key={doctor.id}
                    onClick={() =>
                      onOpenChatWithDoctor ? onOpenChatWithDoctor(doctor) : onSelectDoctor(doctor)
                    }
                    className="p-4 bg-white hover:border-[#006978] border border-slate-200 rounded-3xl shadow-xs flex items-center justify-between gap-4 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={doctor.avatarUrl}
                        alt={doctor.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006978]">
                            {doctor.name}
                          </h4>
                          {(conn?.unreadForPatient || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#006978] font-medium">
                          {doctor.specialty} &bull; {doctor.hospital}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {conn?.lastMessagePreview ||
                            'Open encrypted chat to receive lab requests or share your signed lab reports.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBookingDoctor(doctor);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hidden sm:flex items-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenChatWithDoctor) onOpenChatWithDoctor(doctor);
                          else onSelectDoctor(doctor);
                        }}
                        className="px-4 py-2 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No active doctor conversations yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Send a follow request to a registered physician or share your alias <strong>@{activePatientAlias}</strong> with your doctor.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TWO-WAY CONNECTION REQUESTS */}
      {topTab === 'requests' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Incoming Follow Requests from Doctors ({incomingRequests.length})
            </h3>

            {incomingRequests.length > 0 ? (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 bg-white border-2 border-emerald-200 rounded-3xl shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{req.doctorName}</h4>
                        <p className="text-xs text-[#006978] font-semibold">
                          {req.doctorSpecialty} &bull; {req.doctorHospital}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                        Doctor Request
                      </span>
                    </div>

                    {req.note && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                        &ldquo;{req.note}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleDeclineIncoming(req)}
                        className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptIncoming(req)}
                        className="px-4 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept &amp; Open Channel</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No incoming doctor requests right now. Give your doctor your alias <strong>@{activePatientAlias}</strong> to receive a follow request.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Sent Requests to Doctors ({outgoingRequests.length})
            </h3>

            {outgoingRequests.length > 0 ? (
              <div className="space-y-2">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Stethoscope className="w-4 h-4 text-[#006978]" />
                      <div>
                        <strong className="text-slate-900 block">{req.doctorName}</strong>
                        <span className="text-[11px] text-slate-500">
                          {req.doctorSpecialty} &bull; {req.doctorHospital}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold">
                      Awaiting Doctor Acceptance
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No pending outgoing requests.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Appointment Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img
                  src={bookingDoctor.avatarUrl}
                  alt={bookingDoctor.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-sm font-black text-slate-900">{bookingDoctor.name}</h3>
                  <p className="text-[11px] text-[#006978] font-bold">{bookingDoctor.specialty}</p>
                </div>
              </div>
              <button
                onClick={() => setBookingDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPatientBooking} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Preferred Date:</label>
                <input
                  type="date"
                  value={appDate}
                  onChange={(e) => setAppDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Preferred Time Slot:</label>
                <select
                  value={appTime}
                  onChange={(e) => setAppTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {[
                    '08:30 AM',
                    '09:30 AM',
                    '10:00 AM',
                    '11:00 AM',
                    '02:00 PM',
                    '03:30 PM',
                    '04:30 PM',
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Consultation Modality:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAppType('in_person')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                      appType === 'in_person'
                        ? 'bg-[#E0F2F1] border-[#006978] text-[#006978] font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-700 font-bold'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 shrink-0" />
                    <span>Clinic Visit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppType('teleconsultation')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                      appType === 'teleconsultation'
                        ? 'bg-[#E0F2F1] border-[#006978] text-[#006978] font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-700 font-bold'
                    }`}
                  >
                    <Video className="w-4 h-4 shrink-0" />
                    <span>Teleconsultation</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Reason for Consultation:</label>
                <input
                  type="text"
                  value={appReason}
                  onChange={(e) => setAppReason(e.target.value)}
                  placeholder="e.g. Discuss recent blood test results"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  required
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Synced in real time to the doctor&apos;s agenda &amp; encrypted chat.</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingDoctor(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006978] hover:bg-[#005a66] text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
