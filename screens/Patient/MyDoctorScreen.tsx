import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Star, 
  ChevronRight, 
  Stethoscope, 
  Video, 
  MessageCircle, 
  Clock, 
  ShieldCheck, 
  Inbox,
  UserPlus,
  Check,
  Building2,
  Send,
  AlertCircle,
  X,
  Phone,
  Calendar
} from 'lucide-react';
import { db, getDocs, collection } from '../../services/firebase';
import { ACCREDITED_DOCTORS, DoctorOption } from '../../components/common/DoctorCardSelect';
import { useFamilyProfile } from '../../context/familyProfileContext';
import { clinicalAppointmentService } from '../../services/clinalAppointmentService';

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
}

export const PLATFORM_DOCTORS_DIRECTORY: DoctorDirectoryItem[] = [
  {
    id: 'doc-1',
    name: 'Dr. Emmanuel Nkuo',
    specialty: 'Internal Medicine & Infectious Diseases',
    category: 'Specialist',
    hospital: 'La Quintinie Hospital, Douala',
    rating: 4.9,
    reviewsCount: 156,
    city: 'Douala',
    online: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    about: 'Senior Consultant in Internal Medicine and infectious diagnostics at La Quintinie Hospital, Douala. Leads tropical infection and bacterial resistance research.',
    services: ['Internal Medicine', 'Infectious Diseases', 'Diagnostic Interpretation'],
    phone: '+237 677 12 34 56'
  },
  {
    id: 'doc-2',
    name: 'Dr. Beatrice Ndongo',
    specialty: 'Clinical Hematology & Oncology',
    category: 'Specialist',
    hospital: 'Yaoundé Central Hospital',
    rating: 4.8,
    reviewsCount: 132,
    city: 'Yaoundé',
    online: true,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80',
    about: 'Specialist in blood disorders, hemoglobinopathies (Sickle Cell/Drépanocytose), and diagnostic cytopathology at Yaoundé Central Hospital.',
    services: ['Hematology Panel Review', 'Anemia Management', 'E-Prescription'],
    phone: '+237 699 23 45 67'
  },
  {
    id: 'doc-3',
    name: 'Dr. Alain Fobissie',
    specialty: 'Cardiology & Vascular Medicine',
    category: 'Specialist',
    hospital: 'Douala General Hospital',
    rating: 4.9,
    reviewsCount: 178,
    city: 'Douala',
    online: true,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=800&auto=format&fit=crop&q=80',
    about: 'Cardiovascular practitioner interpreting lipid profiles, cardiac markers, and hypertension risk models at Douala General Hospital.',
    services: ['Cardiovascular Risk Score', 'Lipid Interpretation', 'Teleconsultation'],
    phone: '+237 675 34 56 78'
  },
  {
    id: 'doc-4',
    name: 'Dr. Sylvie Ngassa',
    specialty: 'Endocrinology & Diabetology',
    category: 'Specialist',
    hospital: 'Clinique Bonanjo, Douala',
    rating: 4.7,
    reviewsCount: 94,
    city: 'Douala',
    online: false,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813576-96303eb487a5?w=800&auto=format&fit=crop&q=80',
    about: 'Endocrine consultant focused on diabetes mellitus, thyroid function panels (TSH, FT4), and metabolic monitoring.',
    services: ['Diabetes Care', 'Thyroid Assessment', 'Follow-up'],
    phone: '+237 694 45 67 89'
  },
  {
    id: 'doc-5',
    name: 'Dr. Christian Mbarga',
    specialty: 'Gastroenterology & Hepatology',
    category: 'Specialist',
    hospital: 'CHU de Yaoundé',
    rating: 4.8,
    reviewsCount: 112,
    city: 'Yaoundé',
    online: true,
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&auto=format&fit=crop&q=80',
    about: 'Practitioner in digestive diseases and viral hepatitis screening (HBsAg, HCV) at the University Teaching Hospital (CHU) Yaoundé.',
    services: ['Liver Function Review', 'Digestive Health', 'E-Prescription'],
    phone: '+237 670 56 78 90'
  },
  {
    id: 'doc-6',
    name: 'Dr. Danielle Ewane',
    specialty: 'Family Medicine & General Practice',
    category: 'General',
    hospital: 'Hôpital Gynéco-Obstétrique de Douala',
    rating: 4.9,
    reviewsCount: 204,
    city: 'Douala',
    online: true,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80',
    about: 'Family physician with 10 years experience in comprehensive outpatient care, maternal-child health, and routine diagnostic follow-up.',
    services: ['Family Consultation', 'General Check-Up', 'Prescription'],
    phone: '+237 691 67 89 01'
  }
];

export const REAL_DOCTORS_DIRECTORY = PLATFORM_DOCTORS_DIRECTORY;

interface MyDoctorsScreenProps {
  onBack: () => void;
  onSelectDoctor: (doctor: DoctorDirectoryItem) => void;
  onViewAppointments?: () => void;
  onOpenChatWithDoctor?: (doctor: DoctorDirectoryItem) => void;
}

export const MyDoctorsScreen: React.FC<MyDoctorsScreenProps> = ({
  onBack,
  onSelectDoctor,
  onViewAppointments,
  onOpenChatWithDoctor
}) => {
  const { activeProfile } = useFamilyProfile();

  const [topTab, setTopTab] = useState<'directory' | 'messages' | 'requests'>('directory');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'General' | 'Specialist'>('All');
  const [doctorsList, setDoctorsList] = useState<DoctorDirectoryItem[]>(PLATFORM_DOCTORS_DIRECTORY);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Fetch real platform registered doctors from Firestore/limsService
  useEffect(() => {
    let isMounted = true;
    const fetchLiveDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const { limsService } = await import('../../services/limsService');
        const live = await limsService.searchAllAccreditedDoctors('');
        if (live && live.length > 0 && isMounted) {
          const formatted: DoctorDirectoryItem[] = live.map((doc, idx) => ({
            id: doc.id || `doc-live-${idx}`,
            name: doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`,
            specialty: doc.specialty || 'General Medicine',
            category: (doc.specialty && doc.specialty.toLowerCase().includes('general')) ? 'General' : 'Specialist',
            hospital: doc.hospitalAffiliation || doc.hospital || 'Accredited Medical Center',
            rating: 4.8 + ((idx % 3) * 0.1),
            reviewsCount: 50 + (idx * 20),
            city: 'Douala / Yaoundé',
            online: doc.status === 'active',
            avatarUrl: doc.avatarUrl || doc.profilePicture || PLATFORM_DOCTORS_DIRECTORY[idx % PLATFORM_DOCTORS_DIRECTORY.length]?.avatarUrl,
            about: `Official ONMC-registered medical practitioner at ${doc.hospitalAffiliation || doc.hospital || 'Clinical Diagnostic Center'}.`,
            services: ['Consultation', 'Diagnostic Review', 'Digital Prescription'],
            phone: doc.phone || '+237 670 00 00 00'
          }));
          setDoctorsList(formatted);
        }
      } catch (err) {
        console.warn('Could not load live platform doctors:', err);
      } finally {
        if (isMounted) setLoadingDoctors(false);
      }
    };
    fetchLiveDoctors();
    return () => { isMounted = false; };
  }, []);

  // Real connection requests state stored per patient
  const requestsStorageKey = `nanolabs_doctor_requests_${activeProfile.id}`;
  const [connectedDoctorIds, setConnectedDoctorIds] = useState<string[]>(() => {
    const raw = localStorage.getItem(`nanolabs_connected_doctors_${activeProfile.id}`);
    return raw ? JSON.parse(raw) : [];
  });

  const [outgoingRequests, setOutgoingRequests] = useState<string[]>(() => {
    const raw = localStorage.getItem(`nanolabs_outgoing_doc_reqs_${activeProfile.id}`);
    return raw ? JSON.parse(raw) : [];
  });

  // Real incoming requests from doctors (default empty, loaded from doctorChatService)
  const [incomingRequests, setIncomingRequests] = useState<any[]>(() => {
    try {
      const { doctorChatService } = require('../../services/doctorChatService');
      const reqs = doctorChatService.getIncomingRequests ? doctorChatService.getIncomingRequests(activeProfile.id) : [];
      return reqs || [];
    } catch {
      return [];
    }
  });

  const handleSendRequest = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (outgoingRequests.includes(docId) || connectedDoctorIds.includes(docId)) return;
    const updated = [...outgoingRequests, docId];
    setOutgoingRequests(updated);
    localStorage.setItem(`nanolabs_outgoing_doc_reqs_${activeProfile.id}`, JSON.stringify(updated));
  };

  const handleAcceptIncoming = (reqId: string, docId: string) => {
    const updatedConnected = [...connectedDoctorIds, docId];
    setConnectedDoctorIds(updatedConnected);
    localStorage.setItem(`nanolabs_connected_doctors_${activeProfile.id}`, JSON.stringify(updatedConnected));
    setIncomingRequests(incomingRequests.filter(r => r.id !== reqId));
  };

  const handleDeclineIncoming = (reqId: string) => {
    setIncomingRequests(incomingRequests.filter(r => r.id !== reqId));
  };

  const filteredDoctors = doctorsList.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.hospital.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const connectedDoctors = doctorsList.filter(d => connectedDoctorIds.includes(d.id));

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

  const handleSubmitPatientBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor) return;

    clinicalAppointmentService.createAndSendAppointment({
      doctorId: bookingDoctor.id,
      doctorName: bookingDoctor.name,
      doctorSpecialty: bookingDoctor.specialty,
      doctorHospital: bookingDoctor.hospital,
      patientId: activeProfile.id,
      patientName: activeProfile.fullName,
      patientNickname: activeProfile.fullName.split(' ')[0],
      patientPhone: '+237 671 22 33 44',
      date: appDate,
      time: appTime,
      type: appType,
      status: 'requested',
      location: appType === 'teleconsultation' ? 'Secure Encrypted Video Room (Telehealth)' : `${bookingDoctor.hospital}, Douala`,
      reason: appReason,
      prepInstructions: 'Please have previous lab carnet or test codes ready.'
    });

    // Automatically ensure connected
    if (!connectedDoctorIds.includes(bookingDoctor.id)) {
      const updated = [...connectedDoctorIds, bookingDoctor.id];
      setConnectedDoctorIds(updated);
      localStorage.setItem(`nanolabs_connected_doctors_${activeProfile.id}`, JSON.stringify(updated));
    }

    setBookingDoctor(null);
    setPatientBookingNotice(
      `Appointment request sent to ${bookingDoctor.name} for ${appDate} at ${appTime}! You will receive a confirmation alert.`
    );
    setTimeout(() => setPatientBookingNotice(null), 6000);
  };

  return (
    <div className="max-w-4xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Toast Notice */}
      {patientBookingNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-xs shadow-md">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Physicians & Clinical Consultations
            </h1>
            <p className="text-[11px] text-slate-500">
              National Medical Council (ONMC) certified practitioners &bull; Patient: <strong className="text-slate-800">{activeProfile.fullName}</strong>
            </p>
          </div>
        </div>

        {onViewAppointments && (
          <button
            onClick={onViewAppointments}
            className="px-4 py-2 bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#006978] rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Appointments</span>
          </button>
        )}
      </div>

      {/* 3 Main View Tabs */}
      <div className="flex items-center border-b border-slate-200">
        <button
          onClick={() => setTopTab('directory')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
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
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            topTab === 'messages'
              ? 'border-[#006978] text-[#006978]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>My Messages & Chats ({connectedDoctors.length})</span>
        </button>

        <button
          onClick={() => setTopTab('requests')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            topTab === 'requests'
              ? 'border-[#006978] text-[#006978]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Connection Requests ({incomingRequests.length + outgoingRequests.length})</span>
          {incomingRequests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* TAB 1: ACCREDITED DOCTORS DIRECTORY */}
      {topTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search by physician name, specialty, or hospital..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-[#006978] shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              {(['All', 'General', 'Specialist'] as const).map(cat => (
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

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDoctors.map(doctor => {
              const isConnected = connectedDoctorIds.includes(doctor.id);
              const isRequested = outgoingRequests.includes(doctor.id);

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
                        <p className="text-xs font-semibold text-[#006978] mt-0.5">{doctor.specialty}</p>
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

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {doctor.services.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Connected</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDoctor(doctor);
                            }}
                            className="px-3 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>
                        </>
                      ) : isRequested ? (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                          Request Sent
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleSendRequest(doctor.id, e)}
                          className="px-3.5 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MY MESSAGES & CHATS WITH DOCTORS */}
      {topTab === 'messages' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
            <span className="text-slate-600">
              Direct encrypted clinical channels between you and your verified ONMC physicians.
            </span>
            <span className="font-bold text-[#006978]">{connectedDoctors.length} Connected Doctors</span>
          </div>

          {connectedDoctors.length > 0 ? (
            <div className="space-y-3">
              {connectedDoctors.map(doctor => (
                <div
                  key={doctor.id}
                  onClick={() => onSelectDoctor(doctor)}
                  className="p-4 bg-white hover:border-[#006978] border border-slate-200 rounded-3xl shadow-xs flex items-center justify-between gap-4 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={doctor.avatarUrl}
                      alt={doctor.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006978]">
                        {doctor.name}
                      </h4>
                      <p className="text-xs text-[#006978] font-medium">{doctor.specialty} &bull; {doctor.hospital}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        Click to open chat, discuss lab investigations, or request prescription renewal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDoctor(doctor);
                      }}
                      className="px-4 py-2 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No active doctor conversations yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Connect with an accredited physician in the directory tab to start messaging and sharing test reports.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TWO-WAY CONNECTION REQUESTS */}
      {topTab === 'requests' && (
        <div className="space-y-6">
          {/* Incoming requests from Doctors */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>Incoming Doctor Requests ({incomingRequests.length})</span>
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
                        <p className="text-xs text-[#006978] font-semibold">{req.specialty} &bull; {req.hospital}</p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        New Request
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                      "{req.note}"
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleDeclineIncoming(req.id)}
                        className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptIncoming(req.id, req.doctorId)}
                        className="px-4 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Connect</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No incoming doctor requests at this time.
              </div>
            )}
          </div>

          {/* Outgoing requests sent by patient */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Sent Requests to Doctors ({outgoingRequests.length})
            </h3>

            {outgoingRequests.length > 0 ? (
              <div className="space-y-2">
                {outgoingRequests.map((docId) => {
                  const doc = doctorsList.find(d => d.id === docId);
                  return (
                    <div
                      key={docId}
                      className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Stethoscope className="w-4 h-4 text-[#006978]" />
                        <div>
                          <strong className="text-slate-900 block">{doc?.name || 'Accredited Doctor'}</strong>
                          <span className="text-[11px] text-slate-500">{doc?.specialty}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                        Pending Doctor Review
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No pending outgoing requests. You can connect with any doctor from the directory.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Appointment Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-[#006978]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block">Preferred Time Slot:</label>
                <select
                  value={appTime}
                  onChange={(e) => setAppTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-[#006978]"
                >
                  {['08:30 AM', '09:30 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:30 PM', '04:30 PM'].map(t => (
                    <option key={t} value={t}>{t}</option>
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
                  placeholder="e.g. Discuss recent blood test results or symptoms"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-[#006978]"
                  required
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Request sent directly to doctor's clinical agenda.</span>
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
