import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Search, 
  Plus, 
  Users, 
  Building2, 
  Phone, 
  Mail, 
  Edit3, 
  Trash2, 
  FileText, 
  Filter, 
  Check, 
  X, 
  RefreshCw,
  Sparkles,
  Award,
  UserCheck,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  Send,
  Clock,
  AlertCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { limsService, PatientBooking } from '../../services/limsService';
import { ReferringDoctor, Doctor } from '../../types';

interface ReferringDoctorsManagementProps {
  embedded?: boolean;
}

export const ReferringDoctorsManagement: React.FC<ReferringDoctorsManagementProps> = () => {
  const { lab } = useAuth();
  const currentLabId = lab?.id || 'lab-1';
  const currentLabName = lab?.name || 'nanoLabs Central Diagnostic Center';

  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<ReferringDoctor[]>([]);
  const [referralBookings, setReferralBookings] = useState<PatientBooking[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalReferredPatients: 0,
    totalTestsPrescribed: 0,
    totalRevenueFromReferrals: 0
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerFilter, setPartnerFilter] = useState<'all' | 'active' | 'pending' | 'patient_referral'>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState<'doctors' | 'bookings' | 'directory_search'>('doctors');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedDoctorForDetails, setSelectedDoctorForDetails] = useState<ReferringDoctor | null>(null);

  // Global directory search state
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSearching, setGlobalSearching] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<Doctor[]>([]);
  const [invitingGlobalDocId, setInvitingGlobalDocId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<ReferringDoctor | null>(null);
  const [doctorFormData, setDoctorFormData] = useState({
    name: '',
    specialty: '',
    hospital: '',
    phone: '',
    email: '',
    licenseNumber: '',
    notes: '',
    status: 'active' as 'active' | 'inactive' | 'pending'
  });

  useEffect(() => {
    loadData();
  }, [currentLabId]);

  useEffect(() => {
    if (activeSubTab === 'directory_search' && globalSearchResults.length === 0) {
      handleSearchGlobalDirectory();
    }
  }, [activeSubTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const analytics = await limsService.fetchDoctorCommissionAnalytics(currentLabId);
      setDoctors(analytics.doctors || []);
      setReferralBookings(analytics.referralBookings || []);
      setSummaryStats({
        totalReferredPatients: analytics.totalReferredPatients,
        totalTestsPrescribed: analytics.totalTestsPrescribed,
        totalRevenueFromReferrals: analytics.totalRevenueFromReferrals
      });
    } catch (e) {
      console.error('Error loading accredited doctor clinical analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingDoctor(null);
    setDoctorFormData({
      name: '',
      specialty: '',
      hospital: '',
      phone: '',
      email: '',
      licenseNumber: '',
      notes: '',
      status: 'active'
    });
    setShowAddDoctorModal(true);
  };

  const handleOpenEditModal = (doc: ReferringDoctor) => {
    setEditingDoctor(doc);
    setDoctorFormData({
      name: doc.name || '',
      specialty: doc.specialty || '',
      hospital: doc.hospital || '',
      phone: doc.phone || '',
      email: doc.email || '',
      licenseNumber: doc.licenseNumber || '',
      notes: doc.notes || '',
      status: doc.status || 'active'
    });
    setShowAddDoctorModal(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorFormData.name.trim()) {
      alert('Please enter doctor name');
      return;
    }

    try {
      if (editingDoctor) {
        await limsService.updateReferringDoctor(currentLabId, editingDoctor.id, {
          name: doctorFormData.name.trim(),
          specialty: doctorFormData.specialty.trim(),
          hospital: doctorFormData.hospital.trim(),
          phone: doctorFormData.phone.trim(),
          email: doctorFormData.email.trim(),
          licenseNumber: doctorFormData.licenseNumber.trim(),
          notes: doctorFormData.notes.trim(),
          status: doctorFormData.status
        });
        showToast(`Doctor profile for ${doctorFormData.name} updated.`);
      } else {
        await limsService.sendDoctorPartnershipInvitation(currentLabId, currentLabName, {
          name: doctorFormData.name.trim(),
          specialty: doctorFormData.specialty.trim() || 'General Medicine',
          hospital: doctorFormData.hospital.trim(),
          phone: doctorFormData.phone.trim(),
          email: doctorFormData.email.trim(),
          licenseNumber: doctorFormData.licenseNumber.trim()
        });
        showToast(`Partnership invitation sent to ${doctorFormData.name}.`);
      }
      setShowAddDoctorModal(false);
      await loadData();
    } catch (err) {
      console.error('Error saving doctor:', err);
      alert('Failed to save doctor profile. Please try again.');
    }
  };

  const handleDeleteDoctor = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your accredited clinical network?`)) return;
    try {
      await limsService.deleteReferringDoctor(currentLabId, id);
      showToast(`${name} was removed from this lab's directory.`);
      await loadData();
    } catch (err) {
      console.error('Error deleting doctor:', err);
    }
  };

  const handleSendPartnershipInvitation = async (doc: Partial<Doctor | ReferringDoctor>) => {
    const docId = doc.id || (doc as any).doctorId || 'doc-ref';
    setInvitingGlobalDocId(docId);
    try {
      await limsService.sendDoctorPartnershipInvitation(currentLabId, currentLabName, {
        id: docId,
        name: doc.name || 'Dr. Accredited Physician',
        specialty: doc.specialty || 'General Practitioner',
        hospital: doc.hospital || (doc as any).hospitalAffiliation || '',
        phone: doc.phone || '',
        email: doc.email || '',
        licenseNumber: doc.licenseNumber || ''
      });
      showToast(`Partnership invitation sent to ${doc.name}. They can now accept from their Doctor Portal.`);
      await loadData();
    } catch (e) {
      console.error('Error sending partnership invitation:', e);
      alert('Could not send partnership invitation.');
    } finally {
      setInvitingGlobalDocId(null);
    }
  };

  const handleSearchGlobalDirectory = async () => {
    setGlobalSearching(true);
    try {
      const results = await limsService.searchAllAccreditedDoctors(globalSearchTerm);
      setGlobalSearchResults(results);
    } catch (e) {
      console.error('Error searching global doctor directory:', e);
    } finally {
      setGlobalSearching(false);
    }
  };

  // Filtered doctor list
  const filteredDoctors = doctors.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.specialty && d.specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.hospital && d.hospital.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === 'all' || d.specialty?.toLowerCase() === selectedSpecialty.toLowerCase();

    let matchesPartnerStatus = true;
    if (partnerFilter === 'active') {
      matchesPartnerStatus = d.status === 'active' && (d.invitationStatus === 'accepted' || !d.invitationStatus);
    } else if (partnerFilter === 'pending') {
      matchesPartnerStatus = d.invitationStatus === 'pending' && d.origin !== 'patient_referral';
    } else if (partnerFilter === 'patient_referral') {
      matchesPartnerStatus = d.origin === 'patient_referral' || (d.status === 'pending' && d.totalReferrals && d.totalReferrals > 0) || false;
    }

    return matchesSearch && matchesSpecialty && matchesPartnerStatus;
  });

  // Filtered referral bookings list
  const filteredBookings = referralBookings.filter(b => {
    if (selectedDoctorFilter === 'all') return true;
    const docKey = (b.referringDoctorId || b.referringDoctor || '').toLowerCase();
    return docKey === selectedDoctorFilter.toLowerCase() || b.referringDoctor?.toLowerCase() === selectedDoctorFilter.toLowerCase();
  });

  const uniqueSpecialties = Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean)));

  const activePartnersCount = doctors.filter(d => d.status === 'active' && (d.invitationStatus === 'accepted' || !d.invitationStatus)).length;
  const pendingInvitationsCount = doctors.filter(d => d.invitationStatus === 'pending' && d.origin !== 'patient_referral').length;
  const patientReferralsPendingCount = doctors.filter(d => d.origin === 'patient_referral' || (d.status === 'pending' && (d.totalReferrals || 0) > 0)).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-teal-300 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/40 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Context Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-800/30">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-3 border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Accredited Physician Network & Clinical Collaboration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-teal-400" />
              Referring Doctors & Partner Network
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-2 leading-relaxed">
              Search and invite accredited medical doctors from the Cameroon national registry, track patient prescriptions, and monitor tests and price ledgers with real-time portal syncing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadData}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition border border-white/10 flex items-center justify-center text-xs font-bold cursor-pointer"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setActiveSubTab('directory_search')}
              className="px-4 py-3 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 rounded-2xl transition flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <Search className="w-4 h-4 text-teal-300" />
              <span>Search Accredited Directory</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg hover:shadow-teal-500/25 transition flex items-center gap-2 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Invite New Doctor</span>
            </button>
          </div>
        </div>

        {/* Legal & Medical Ethics Declaration */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-start gap-3 text-xs text-teal-100/90 bg-teal-900/30 p-3.5 rounded-2xl border border-teal-700/30">
          <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block font-semibold">Cameroon Medical Ethics Compliance (Zero-Commission Standard)</strong>
            <span>
              Under national medical regulations, referral commissions and fee-splitting are strictly prohibited. nanoLabs operates as a pure clinical diagnostic router connecting patients, attending physicians, and biological laboratory validation.
            </span>
          </div>
        </div>

        {/* Clinical Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Active Partners</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white">{activePartnersCount}</div>
            <div className="text-[11px] text-teal-200/60 mt-0.5">Accredited & Connected</div>
          </div>

          <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Pending Invites</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">{pendingInvitationsCount}</div>
            <div className="text-[11px] text-teal-200/60 mt-0.5">Awaiting Doctor Response</div>
          </div>

          <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Referred Patients</span>
              <Activity className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white">{summaryStats.totalReferredPatients}</div>
            <div className="text-[11px] text-teal-200/60 mt-0.5">Intake via Prescription</div>
          </div>

          <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Tests Completed</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">{summaryStats.totalTestsPrescribed}</div>
            <div className="text-[11px] text-teal-200/60 mt-0.5">
              Gross: {summaryStats.totalRevenueFromReferrals.toLocaleString()} FCFA
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm">
        <button
          onClick={() => setActiveSubTab('doctors')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'doctors'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Accredited Lab Partners ({doctors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('directory_search')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'directory_search'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search National Accredited Directory</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bookings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'bookings'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Prescribed Tests & Patient Ledger ({referralBookings.length})</span>
        </button>
      </div>

      {/* Patient Referral Alert Banner (If patients cited network doctors not yet fully partnered) */}
      {patientReferralsPendingCount > 0 && activeSubTab === 'doctors' && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {patientReferralsPendingCount} Physician(s) Cited by Registered Patients
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Patients who registered in your lab selected doctors from our national directory. Click "Send Partnership Request" so the doctor can accept from their portal and synchronize clinical records.
              </p>
            </div>
          </div>
          <button
            onClick={() => setPartnerFilter('patient_referral')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 transition cursor-pointer"
          >
            Review Cited Doctors
          </button>
        </div>
      )}

      {/* TAB 1: DOCTORS DIRECTORY */}
      {activeSubTab === 'doctors' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by doctor name, license, specialty, or clinic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPartnerFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    partnerFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({doctors.length})
                </button>
                <button
                  onClick={() => setPartnerFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    partnerFilter === 'active' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active Partners ({activePartnersCount})
                </button>
                <button
                  onClick={() => setPartnerFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    partnerFilter === 'pending' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending Invites ({pendingInvitationsCount})
                </button>
                {patientReferralsPendingCount > 0 && (
                  <button
                    onClick={() => setPartnerFilter('patient_referral')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      partnerFilter === 'patient_referral' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700 hover:text-amber-900'
                    }`}
                  >
                    Patient Referrals ({patientReferralsPendingCount})
                  </button>
                )}
              </div>

              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="all">All Specialties ({doctors.length})</option>
                {uniqueSpecialties.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctors Grid */}
          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-500">Loading accredited medical directory...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Accredited Doctors Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {searchQuery 
                  ? 'No physicians match your search criteria. Adjust filters or search the national registry.' 
                  : 'Search and invite verified physicians from the national directory to partner with your laboratory.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveSubTab('directory_search')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                >
                  Search National Registry
                </button>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Add Custom Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoctors.map(doctor => {
                const isPendingDoctor = doctor.invitationStatus === 'pending' || doctor.status === 'pending';
                const isPatientReferral = doctor.origin === 'patient_referral';

                return (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Doctor Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-black text-sm shrink-0">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">{doctor.name}</h3>
                            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 inline-block mt-0.5">
                              {doctor.specialty || 'General Practitioner'}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          doctor.status === 'active' && doctor.invitationStatus === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isPatientReferral
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isPendingDoctor
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {doctor.status === 'active' && (doctor.invitationStatus === 'accepted' || !doctor.invitationStatus)
                            ? 'Active Partner' 
                            : isPatientReferral
                            ? 'Patient Referral'
                            : isPendingDoctor
                            ? 'Invite Pending'
                            : 'Inactive'}
                        </span>
                      </div>

                      {/* Details & Credentials */}
                      <div className="space-y-1.5 text-xs text-slate-600 my-3.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {doctor.hospital && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-medium">{doctor.hospital}</span>
                          </div>
                        )}
                        {doctor.licenseNumber && (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                            <span className="truncate font-mono text-[11px] text-slate-700">License: {doctor.licenseNumber}</span>
                          </div>
                        )}
                        {doctor.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{doctor.phone}</span>
                          </div>
                        )}
                        {doctor.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{doctor.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Prompt for Patient Referral / Pending Invite */}
                      {isPatientReferral && (
                        <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                          <p className="text-amber-900 font-semibold mb-2">
                            Patient referred to your lab citing this physician. Send invitation to add to your accredited network:
                          </p>
                          <button
                            onClick={() => handleSendPartnershipInvitation(doctor)}
                            disabled={invitingGlobalDocId === doctor.id}
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>{invitingGlobalDocId === doctor.id ? 'Sending Request...' : 'Send Partnership Request'}</span>
                          </button>
                        </div>
                      )}

                      {/* Clinical Referrals Statistics */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 text-white rounded-xl mb-4">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Patients Referred</div>
                          <div className="text-lg font-black text-white">{doctor.totalReferrals || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-teal-400">Tests Prescribed</div>
                          <div className="text-lg font-black text-teal-300">
                            {doctor.totalTestsDone || doctor.totalReferrals || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedDoctorForDetails(doctor);
                        }}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Orders & Tests ({doctor.totalReferrals || 0})</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(doctor)}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Remove Doctor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SEARCH GLOBAL ACCREDITED REGISTRY */}
      {activeSubTab === 'directory_search' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-teal-600" />
                Search Cameroon National Accredited Doctors Registry
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Lookup registered medical doctors across the nanoLabs network by Name, National Medical Council (ONMC) License ID, Specialty, or Hospital affiliation to invite them to partner with your laboratory.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Dr. Alexis, ONMC-CMR, Douala General Hospital, Cardiology, Yaounde..."
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchGlobalDirectory()}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <button
                onClick={handleSearchGlobalDirectory}
                disabled={globalSearching}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow cursor-pointer"
              >
                {globalSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{globalSearching ? 'Searching Registry...' : 'Search Directory'}</span>
              </button>
            </div>
          </div>

          {/* Directory Search Results */}
          {globalSearchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalSearchResults.map(doc => {
                const partnerRecord = doctors.find(d => 
                  d.name.toLowerCase() === doc.name.toLowerCase() || 
                  (d.doctorId && d.doctorId === doc.id) ||
                  (d.phone && doc.phone && d.phone === doc.phone) ||
                  (d.licenseNumber && doc.licenseNumber && d.licenseNumber.toLowerCase() === doc.licenseNumber.toLowerCase())
                );

                const isAlreadyActive = partnerRecord && partnerRecord.status === 'active' && partnerRecord.invitationStatus === 'accepted';
                const isInvitePending = partnerRecord && (partnerRecord.invitationStatus === 'pending' || partnerRecord.status === 'pending');

                return (
                  <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs shrink-0">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                            <span className="text-[11px] font-semibold text-teal-700">{doc.specialty || 'General Practitioner'}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                          ONMC Accredited
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 my-3 bg-slate-50 p-3 rounded-xl">
                        {(doc.hospitalAffiliation || doc.hospital) && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{doc.hospitalAffiliation || doc.hospital}</span>
                          </div>
                        )}
                        {doc.licenseNumber && (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                            <span className="font-mono text-[11px] text-slate-700">License: {doc.licenseNumber}</span>
                          </div>
                        )}
                        {doc.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{doc.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendPartnershipInvitation(doc)}
                      disabled={isAlreadyActive || isInvitePending || invitingGlobalDocId === doc.id}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        isAlreadyActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                          : isInvitePending
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed'
                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                      }`}
                    >
                      {invitingGlobalDocId === doc.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isAlreadyActive ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active Partner Lab</span>
                        </>
                      ) : isInvitePending ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Invitation Pending in Portal</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Invite / Add to Lab Network</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <ShieldCheck className="w-10 h-10 text-teal-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Cameroon National Doctor Directory</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Enter a doctor's name, ONMC registration number, or hospital affiliation above to search the national verified database.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRESCRIBED TEST RECORDS */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Physician-Prescribed Diagnostic Test Records</h3>
              <p className="text-xs text-slate-500">
                Track all patient orders referred by accredited doctors, including specific diagnostic tests ordered, test prices, and biological validation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Filter by Doctor:</label>
              <select
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="all">All Prescribing Doctors ({referralBookings.length})</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No Prescribed Orders Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                When patients are registered with an accredited referring physician at reception, their prescribed test orders and fees will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order Code / Date</th>
                      <th className="py-3 px-4">Patient Details</th>
                      <th className="py-3 px-4">Prescribing Doctor</th>
                      <th className="py-3 px-4">Prescribed Diagnostic Tests & Prices</th>
                      <th className="py-3 px-4">Diagnostic Status</th>
                      <th className="py-3 px-4 text-right">Total Lab Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBookings.map((b) => {
                      const totalBill = b.actualPaidAmount !== undefined ? b.actualPaidAmount : (b.totalAmount || b.originalTotalAmount || 0);

                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-mono">
                            <span className="font-bold text-slate-900 block">{b.bookingCode || b.id.substring(0, 10)}</span>
                            <span className="text-[10px] text-slate-400">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{b.patientName}</div>
                            <div className="text-[11px] text-slate-500">PID: {b.patientId || (b as any).patientPid || 'PID-GEN'} • {b.patientGender || 'Adult'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-teal-800 flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                              <span>{b.referringDoctor || 'Attending Physician'}</span>
                            </div>
                            {b.referralHospital && (
                              <div className="text-[10px] text-slate-400">{b.referralHospital}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {b.tests && b.tests.length > 0 ? (
                                b.tests.map((t: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                    <span className="font-semibold text-slate-800">{t.name || t.testName || 'Diagnostic Panel'}</span>
                                    <span className="font-mono text-slate-500">{Number(t.price || t.cost || 0).toLocaleString()} FCFA</span>
                                  </div>
                                ))
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[11px]">
                                  General Clinical Lab Order
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
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
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {totalBill.toLocaleString()} FCFA
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: DOCTOR PATIENTS & TESTS BREAKDOWN */}
      {selectedDoctorForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedDoctorForDetails.name}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedDoctorForDetails.specialty} • {selectedDoctorForDetails.hospital || 'Accredited Medical Center'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoctorForDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Patients</div>
                  <div className="text-lg font-black text-slate-900">{selectedDoctorForDetails.totalReferrals || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-teal-600 uppercase">Tests Done</div>
                  <div className="text-lg font-black text-teal-700">{selectedDoctorForDetails.totalTestsDone || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Total Bill Value</div>
                  <div className="text-lg font-black text-emerald-700 font-mono">
                    {(selectedDoctorForDetails.totalRevenueGenerated || 0).toLocaleString()} FCFA
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Patients Brought & Tests Conducted
                </h4>
                {referralBookings.filter(b => {
                  const docKey = (b.referringDoctorId || b.referringDoctor || '').toLowerCase();
                  return docKey === selectedDoctorForDetails.id.toLowerCase() || 
                         docKey === selectedDoctorForDetails.name.toLowerCase() ||
                         (selectedDoctorForDetails.doctorId && docKey === selectedDoctorForDetails.doctorId.toLowerCase());
                }).length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
                    No orders registered yet under this physician.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {referralBookings.filter(b => {
                      const docKey = (b.referringDoctorId || b.referringDoctor || '').toLowerCase();
                      return docKey === selectedDoctorForDetails.id.toLowerCase() || 
                             docKey === selectedDoctorForDetails.name.toLowerCase() ||
                             (selectedDoctorForDetails.doctorId && docKey === selectedDoctorForDetails.doctorId.toLowerCase());
                    }).map((b) => (
                      <div key={b.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-teal-300 transition">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{b.patientName}</span>
                          <span className="font-mono text-xs font-bold text-teal-800">
                            {(b.actualPaidAmount !== undefined ? b.actualPaidAmount : (b.totalAmount || 0)).toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Order Code: <span className="font-mono">{b.bookingCode || b.id.substring(0, 8)}</span> • Date: {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}
                        </div>
                        {b.tests && b.tests.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1.5">
                            {b.tests.map((t: any, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded text-[10px] font-semibold border border-teal-100">
                                {t.name || t.testName} ({Number(t.price || t.cost || 0).toLocaleString()} FCFA)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDoctorForDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ACCREDITED DOCTOR */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDoctor ? 'Edit Accredited Doctor Profile' : 'Invite Accredited Doctor to Lab'}
                  </h3>
                  <span className="text-xs text-slate-400">Clinical Collaboration & Results Routing</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4 mt-4">
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 flex items-start gap-2.5 text-xs text-teal-900">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  Accredited doctors can be selected by patients and receptionists. An invitation will be sent to the doctor to accept from their Doctor Portal.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name & Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ngozi Emmanuel, MD"
                  value={doctorFormData.name}
                  onChange={(e) => setDoctorFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology, Pediatrics"
                    value={doctorFormData.specialty}
                    onChange={(e) => setDoctorFormData(prev => ({ ...prev, specialty: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ONMC License / Registration ID</label>
                  <input
                    type="text"
                    placeholder="e.g. ONMC-CMR-2024-884"
                    value={doctorFormData.licenseNumber}
                    onChange={(e) => setDoctorFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Affiliation</label>
                <input
                  type="text"
                  placeholder="e.g. Douala General Hospital / Polyclinique Sainte Anne"
                  value={doctorFormData.hospital}
                  onChange={(e) => setDoctorFormData(prev => ({ ...prev, hospital: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +237 670 000 000"
                    value={doctorFormData.phone}
                    onChange={(e) => setDoctorFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Professional Email</label>
                  <input
                    type="email"
                    placeholder="e.g. doctor@clinic.cm"
                    value={doctorFormData.email}
                    onChange={(e) => setDoctorFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Collaboration Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Special consultation hours, clinical notes, specific diagnostic protocols..."
                  value={doctorFormData.notes}
                  onChange={(e) => setDoctorFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  {editingDoctor ? 'Update Doctor Profile' : 'Send Partnership Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferringDoctorsManagement;
