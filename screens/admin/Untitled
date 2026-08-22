import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Search, 
  Plus, 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Phone, 
  Mail, 
  Edit3, 
  Trash2, 
  Percent, 
  ArrowUpRight, 
  FileText, 
  Download, 
  Filter, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  Award,
  Wallet,
  Receipt,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { limsService, PatientBooking } from '../../services/limsService';
import { ReferringDoctor } from '../../types';

interface ReferringDoctorsManagementProps {
  embedded?: boolean;
}

export const ReferringDoctorsManagement: React.FC<ReferringDoctorsManagementProps> = () => {
  const { lab } = useAuth();
  const currentLabId = lab?.id || 'lab-1';

  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<ReferringDoctor[]>([]);
  const [referralBookings, setReferralBookings] = useState<PatientBooking[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalReferredPatients: 0,
    totalRevenueFromReferrals: 0,
    totalCommissionsEarned: 0,
    totalCommissionsPaid: 0,
    totalCommissionsPending: 0,
    defaultCommissionRate: 20
  });

  // Commission configuration state
  const [defaultRate, setDefaultRate] = useState<number>(lab?.defaultDoctorCommissionRate || 20);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [rateUpdatedSuccess, setRateUpdatedSuccess] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState<'doctors' | 'bookings'>('doctors');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');

  // Modal states
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<ReferringDoctor | null>(null);
  const [doctorFormData, setDoctorFormData] = useState({
    name: '',
    specialty: '',
    hospital: '',
    phone: '',
    email: '',
    commissionRate: 20,
    notes: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Payout confirmation modal
  const [payoutModalDoctor, setPayoutModalDoctor] = useState<ReferringDoctor | null>(null);
  const [payoutPaymentMethod, setPayoutPaymentMethod] = useState<'Cash' | 'Mobile Money' | 'Bank Transfer'>('Mobile Money');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentLabId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const analytics = await limsService.fetchDoctorCommissionAnalytics(currentLabId);
      setDoctors(analytics.doctors || []);
      setReferralBookings(analytics.referralBookings || []);
      setSummaryStats({
        totalReferredPatients: analytics.totalReferredPatients,
        totalRevenueFromReferrals: analytics.totalRevenueFromReferrals,
        totalCommissionsEarned: analytics.totalCommissionsEarned,
        totalCommissionsPaid: analytics.totalCommissionsPaid,
        totalCommissionsPending: analytics.totalCommissionsPending,
        defaultCommissionRate: analytics.defaultCommissionRate || 20
      });
      setDefaultRate(analytics.defaultCommissionRate || 20);
    } catch (e) {
      console.error('Error loading doctor commission analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefaultRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingRate(true);
    try {
      await limsService.updateLabDefaultCommissionRate(currentLabId, defaultRate);
      setRateUpdatedSuccess(true);
      setTimeout(() => setRateUpdatedSuccess(false), 3000);
      await loadData();
    } catch (err) {
      console.error('Failed to update default commission rate:', err);
    } finally {
      setIsUpdatingRate(false);
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
      commissionRate: defaultRate,
      notes: '',
      status: 'active'
    });
    setShowAddDoctorModal(true);
  };

  const handleOpenEditModal = (doc: ReferringDoctor) => {
    setEditingDoctor(doc);
    setDoctorFormData({
      name: doc.name,
      specialty: doc.specialty || '',
      hospital: doc.hospital || '',
      phone: doc.phone || '',
      email: doc.email || '',
      commissionRate: doc.commissionRate !== undefined ? doc.commissionRate : defaultRate,
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
          ...doctorFormData,
          commissionRate: Number(doctorFormData.commissionRate)
        });
      } else {
        await limsService.addReferringDoctor(currentLabId, {
          ...doctorFormData,
          commissionRate: Number(doctorFormData.commissionRate)
        });
      }
      setShowAddDoctorModal(false);
      await loadData();
    } catch (err) {
      console.error('Error saving referring doctor:', err);
    }
  };

  const handleDeleteDoctor = async (docId: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the referring doctors directory?`)) {
      try {
        await limsService.deleteReferringDoctor(currentLabId, docId);
        await loadData();
      } catch (err) {
        console.error('Error deleting doctor:', err);
      }
    }
  };

  const handleSettleSingleCommission = async (bookingId: string) => {
    try {
      await limsService.markCommissionPaid(currentLabId, bookingId, 'Admin Payout');
      await loadData();
    } catch (err) {
      console.error('Error settling booking commission:', err);
    }
  };

  const handleProcessDoctorBatchPayout = async () => {
    if (!payoutModalDoctor) return;
    setIsProcessingPayout(true);
    try {
      await limsService.markAllCommissionsPaidForDoctor(
        currentLabId, 
        payoutModalDoctor.id || payoutModalDoctor.name,
        `Admin Payout (${payoutPaymentMethod})`
      );
      setPayoutModalDoctor(null);
      await loadData();
    } catch (err) {
      console.error('Error settling doctor batch payout:', err);
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // Filtered Doctors
  const specialties = Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean)));
  const filteredDoctors = doctors.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.specialty && d.specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.hospital && d.hospital.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.phone && d.phone.includes(searchQuery));
    const matchesSpec = selectedSpecialty === 'all' || d.specialty === selectedSpecialty;
    return matchesSearch && matchesSpec;
  });

  // Filtered Bookings
  const filteredBookings = referralBookings.filter(b => {
    const matchesDoc = selectedDoctorFilter === 'all' || 
      b.referringDoctorId === selectedDoctorFilter || 
      b.referringDoctor?.toLowerCase() === selectedDoctorFilter.toLowerCase();
    const matchesSearch = 
      b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.referringDoctor && b.referringDoctor.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDoc && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold border border-teal-500/30">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Physician Referral & Commission Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Referring Doctors & Commission Ledger
            </h1>
            <p className="text-sm text-teal-100/80 max-w-2xl leading-relaxed">
              Track referring physicians, client acquisition volume, test revenue generation, and automatically calculate the {defaultRate}% medical referral commissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Referring Doctor</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>
          </div>
        </div>

        {/* Live Analytics Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-8 pt-6 border-t border-teal-700/50">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-teal-200/80 text-xs font-medium mb-1">
              <span>Affiliated Doctors</span>
              <Stethoscope className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white">{doctors.length}</div>
            <div className="text-[11px] text-teal-200/60 mt-1">Active Medical Partners</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-teal-200/80 text-xs font-medium mb-1">
              <span>Referred Clients</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white">{summaryStats.totalReferredPatients}</div>
            <div className="text-[11px] text-teal-200/60 mt-1">Total Patient Volume</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-teal-200/80 text-xs font-medium mb-1">
              <span>Referred Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {summaryStats.totalRevenueFromReferrals.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
            </div>
            <div className="text-[11px] text-teal-200/60 mt-1">Total Diagnostic Billed</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-teal-200/80 text-xs font-medium mb-1">
              <span>Total Commissions</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">
              {summaryStats.totalCommissionsEarned.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
            </div>
            <div className="text-[11px] text-teal-200/60 mt-1">{defaultRate}% Commission Earned</div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-amber-500/10 backdrop-blur-md rounded-2xl p-4 border border-amber-500/20">
            <div className="flex items-center justify-between text-amber-200 text-xs font-medium mb-1">
              <span>Pending Payouts</span>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {summaryStats.totalCommissionsPending.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
            </div>
            <div className="text-[11px] text-amber-200/70 mt-1">Owed to Referring Doctors</div>
          </div>
        </div>
      </div>

      {/* Laboratory Default Commission Rate Configuration Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Laboratory Doctor Referral Commission Rate</h3>
            <p className="text-xs text-slate-500">
              Configure the default commission percentage assigned to referring physicians for patient test bookings (standard is 20%).
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveDefaultRate} className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={defaultRate}
              onChange={(e) => setDefaultRate(Number(e.target.value))}
              className="w-24 px-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl text-center focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">%</span>
          </div>

          <button
            type="submit"
            disabled={isUpdatingRate}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isUpdatingRate ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : rateUpdatedSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-300" />
            ) : null}
            <span>{rateUpdatedSuccess ? 'Saved Rate!' : 'Save Default %'}</span>
          </button>
        </form>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveSubTab('doctors')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeSubTab === 'doctors'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Referring Doctors Directory ({doctors.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bookings')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeSubTab === 'bookings'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Referred Test Orders & Commission Ledger ({referralBookings.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'doctors' ? "Search doctor name, hospital, specialty..." : "Search patient, doctor, booking code..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'doctors' && specialties.length > 0 && (
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Specialties ({doctors.length})</option>
              {specialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          )}

          {activeSubTab === 'bookings' && (
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Referring Doctors</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.name}>{doc.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: DOCTORS DIRECTORY */}
      {activeSubTab === 'doctors' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
              <p className="text-sm font-medium">Loading physician referral directory...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Referring Doctors Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                {searchQuery ? "No doctors matched your search criteria." : "Register your affiliated physicians so patients and receptionists can easily select them from the dropdown."}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Register First Doctor</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoctors.map(doctor => {
                const pendingCommission = Math.max(0, (doctor.totalCommissionEarned || 0) - (doctor.totalCommissionPaid || 0));
                return (
                  <div 
                    key={doctor.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-black text-sm shrink-0">
                            {doctor.name.replace('Dr.', '').trim().slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{doctor.name}</span>
                              <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-md border border-teal-200">
                                {doctor.commissionRate || defaultRate}% comm.
                              </span>
                            </h4>
                            <p className="text-xs text-teal-700 font-medium">{doctor.specialty || 'Medical Practitioner'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(doctor)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition"
                            title="Edit Doctor Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg transition"
                            title="Remove Doctor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Hospital / Clinic */}
                      {doctor.hospital && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{doctor.hospital}</span>
                        </div>
                      )}

                      {/* Contact details */}
                      <div className="space-y-1 text-xs text-slate-500 mb-4">
                        {doctor.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{doctor.phone}</span>
                          </div>
                        )}
                        {doctor.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{doctor.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Doctor Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center mb-4">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Referred</div>
                          <div className="text-sm font-black text-slate-900">{doctor.totalReferrals || 0}</div>
                          <div className="text-[9px] text-slate-500">Patients</div>
                        </div>

                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Revenue</div>
                          <div className="text-xs font-black text-emerald-700">
                            {(doctor.totalRevenueGenerated || 0).toLocaleString()}
                          </div>
                          <div className="text-[9px] text-slate-500">FCFA</div>
                        </div>

                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">{doctor.commissionRate || defaultRate}% Comm.</div>
                          <div className="text-xs font-black text-amber-700">
                            {(doctor.totalCommissionEarned || 0).toLocaleString()}
                          </div>
                          <div className="text-[9px] text-slate-500">FCFA</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                      <div className="text-xs">
                        <span className="text-slate-400">Pending: </span>
                        <span className={`font-bold ${pendingCommission > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {pendingCommission.toLocaleString()} FCFA
                        </span>
                      </div>

                      {pendingCommission > 0 ? (
                        <button
                          onClick={() => setPayoutModalDoctor(doctor)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <Wallet className="w-3 h-3" />
                          <span>Settle Payout</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Settled</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REFERRED ORDERS & COMMISSION LEDGER */}
      {activeSubTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Referred Diagnostic Orders & Commission Ledger</h3>
              <p className="text-xs text-slate-500">
                Detailed audit trail of all test bookings originated by referring medical practitioners.
              </p>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredBookings.length}</span> referral bookings
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No Referred Orders Found</p>
              <p className="text-xs text-slate-500 mt-1">
                When patients are registered with a referring doctor, their test bills and calculated commissions will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Booking Code & Date</th>
                    <th className="py-3 px-4">Patient Details</th>
                    <th className="py-3 px-4">Referring Doctor</th>
                    <th className="py-3 px-4">Diagnostic Tests</th>
                    <th className="py-3 px-4">Total Billed</th>
                    <th className="py-3 px-4">Comm. %</th>
                    <th className="py-3 px-4">Commission (FCFA)</th>
                    <th className="py-3 px-4">Commission Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredBookings.map((b) => {
                    const billAmount = b.actualPaidAmount !== undefined ? b.actualPaidAmount : (b.totalAmount || b.originalTotalAmount || 0);
                    const commRate = b.referralCommissionRate || defaultRate;
                    const commAmount = b.referralCommissionAmount !== undefined 
                      ? b.referralCommissionAmount 
                      : Math.round(billAmount * (commRate / 100));
                    const isSettled = b.referralCommissionStatus === 'settled' || b.referralCommissionStatus === 'paid';

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{b.bookingCode}</div>
                          <div className="text-[10px] text-slate-400">
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{b.patientName}</div>
                          <div className="text-[10px] text-slate-400">
                            {b.patientGender || 'Adult'} • Age: {b.patientAge || '30'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-teal-800 flex items-center gap-1">
                            <Stethoscope className="w-3 h-3 text-teal-600" />
                            <span>{b.referringDoctor || 'Attending Doctor'}</span>
                          </div>
                          {b.referralHospital && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{b.referralHospital}</div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">
                            {b.tests?.length || 1} test(s)
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {b.tests?.map(t => t.testName).join(', ') || 'Diagnostic Panel'}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900">
                          {billAmount.toLocaleString()} FCFA
                        </td>

                        <td className="py-3 px-4 font-bold text-teal-700">
                          {commRate}%
                        </td>

                        <td className="py-3 px-4 font-bold text-amber-700">
                          {commAmount.toLocaleString()} FCFA
                        </td>

                        <td className="py-3 px-4">
                          {isSettled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Settled</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>Unpaid</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!isSettled ? (
                            <button
                              onClick={() => handleSettleSingleCommission(b.id)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold rounded-lg border border-teal-200 transition cursor-pointer"
                            >
                              Settle Payout
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {b.referralCommissionPaidAt ? new Date(b.referralCommissionPaidAt).toLocaleDateString() : 'Paid'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT REFERRING DOCTOR */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDoctor ? 'Edit Referring Physician' : 'Register New Referring Doctor'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registered doctors appear in patient intake dropdowns with automated commission accounting.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Alexis Vance"
                  value={doctorFormData.name}
                  onChange={(e) => setDoctorFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology, Endocrinology"
                    value={doctorFormData.specialty}
                    onChange={(e) => setDoctorFormData(prev => ({ ...prev, specialty: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Commission Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={doctorFormData.commissionRate}
                      onChange={(e) => setDoctorFormData(prev => ({ ...prev, commissionRate: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic / Practice Name</label>
                <input
                  type="text"
                  placeholder="e.g. Central Heart & Vascular Clinic"
                  value={doctorFormData.hospital}
                  onChange={(e) => setDoctorFormData(prev => ({ ...prev, hospital: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+237 6xx xxx xxx"
                    value={doctorFormData.phone}
                    onChange={(e) => setDoctorFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="doctor@hospital.cm"
                    value={doctorFormData.email}
                    onChange={(e) => setDoctorFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Partnership Terms</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Primary referral partner for cardiology and metabolic panels."
                  value={doctorFormData.notes}
                  onChange={(e) => setDoctorFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  {editingDoctor ? 'Update Doctor' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BATCH COMMISSION PAYOUT VOUCHER */}
      {payoutModalDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Settle Commission Payout</h3>
                  <p className="text-xs text-slate-500">{payoutModalDoctor.name}</p>
                </div>
              </div>

              <button
                onClick={() => setPayoutModalDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-900">
                <span>Total Accumulated Commission:</span>
                <span className="font-bold">{(payoutModalDoctor.totalCommissionEarned || 0).toLocaleString()} FCFA</span>
              </div>
              <div className="flex items-center justify-between text-xs text-amber-900">
                <span>Already Settled:</span>
                <span className="font-bold text-emerald-700">{(payoutModalDoctor.totalCommissionPaid || 0).toLocaleString()} FCFA</span>
              </div>
              <div className="border-t border-amber-200/60 pt-2 flex items-center justify-between text-sm font-black text-amber-950">
                <span>Payout Amount Due:</span>
                <span className="text-base text-amber-700">
                  {Math.max(0, (payoutModalDoctor.totalCommissionEarned || 0) - (payoutModalDoctor.totalCommissionPaid || 0)).toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Disbursement Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Mobile Money', 'Cash', 'Bank Transfer'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayoutPaymentMethod(method)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                      payoutPaymentMethod === method
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p>
                Confirming this payout will mark all pending test order commissions for <strong>{payoutModalDoctor.name}</strong> as settled and update the laboratory financial ledger.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayoutModalDoctor(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayout}
                onClick={handleProcessDoctorBatchPayout}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-600/20 cursor-pointer flex items-center gap-1.5"
              >
                {isProcessingPayout && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Disburse & Mark Settled</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferringDoctorsManagement;
