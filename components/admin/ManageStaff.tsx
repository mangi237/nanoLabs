import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { authService } from '../../services/authService';
import { db, getDocs, collection, deleteDoc, doc } from '../../services/firebase';
import AddStaffModal from './AddStaffModal';
import EditStaffModal from './EditStaffModal';
import { 
  UserPlus, 
  Search, 
  Shield, 
  User, 
  DollarSign, 
  Microscope, 
  TestTube, 
  Edit3, 
  Trash2, 
  Key, 
  Mail, 
  Phone, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  Clock, 
  Send, 
  FileText, 
  History, 
  Loader2,
  KeyRound,
  Copy
} from 'lucide-react';

export const ManageStaff: React.FC = () => {
  const { lab, user: adminUser } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'directory' | 'benefits_ledger' | 'audit_logs'>('directory');
  const [benefitsLogs, setBenefitsLogs] = useState<any[]>([]);
  const [loadingBenefits, setLoadingBenefits] = useState(false);
  const [benefitDateFilter, setBenefitDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [benefitStaffSearch, setBenefitStaffSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [lab?.id]);

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      fetchAuditLogs();
    } else if (activeTab === 'benefits_ledger') {
      fetchBenefitsLogs();
    }
  }, [activeTab]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Fetch from Firestore
      const staffRef = collection(db, 'labs', lab?.id || 'lab-1', 'staff');
      const snap = await getDocs(staffRef);
      const fsList: any[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      // Fetch from Server Registry for real-time status
      let serverStaff: any[] = [];
      try {
        serverStaff = await authService.getServerStaffList();
      } catch (e) {
        console.warn('Server staff fetch note:', e);
      }

      // Merge results
      const combinedMap = new Map();
      fsList.forEach((s: any) => combinedMap.set(s.email?.toLowerCase() || s.id, s));
      serverStaff.forEach((s: any) => {
        const key = s.email?.toLowerCase() || s.id;
        if (combinedMap.has(key)) {
          combinedMap.set(key, { ...combinedMap.get(key), ...s });
        } else {
          combinedMap.set(key, s);
        }
      });

      setStaffList(Array.from(combinedMap.values()));
    } catch (e) {
      console.error('Error fetching staff list:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await authService.getAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchBenefitsLogs = async () => {
    try {
      setLoadingBenefits(true);
      const bookingsSnap = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'bookings'));
      const allBookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Also get patients to match staff exemptions
      const patientsSnap = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'patients'));
      const allPatients = patientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const records: any[] = [];

      allBookings.forEach((b: any) => {
        const isStaff = b.isStaffMember || b.isStaffExemption || b.paymentMethod === 'workers_benefit' || b.discountType === 'workers_benefit' || Boolean(b.workerStaffName);
        if (isStaff) {
          records.push({
            id: b.id,
            bookingCode: b.bookingCode || 'BK-BENEFIT',
            beneficiaryName: b.patientName || 'Laboratory Staff Beneficiary',
            beneficiaryPid: b.patientPid || b.patientId || '-',
            staffMemberName: b.workerStaffName || b.staffName || b.patientName,
            staffRole: b.workerDepartment || b.staffDesignation || 'Registered Laboratory Personnel',
            tests: b.tests || [],
            waivedAmount: b.originalPrice || b.totalAmount || (b.tests || []).reduce((acc: number, t: any) => acc + (t.price || 5000), 0),
            date: b.createdAt || b.paidAt || new Date().toISOString(),
            authorizedBy: b.receptionistName || b.cashierName || 'Reception Desk (Staff Welfare Rule)',
            status: b.overallStatus || 'Active'
          });
        }
      });

      allPatients.forEach((p: any) => {
        if (p.isStaffMember && Array.isArray(p.labTests)) {
          p.labTests.forEach((t: any, idx: number) => {
            records.push({
              id: `pt-${p.id}-${idx}`,
              bookingCode: t.bookingCode || 'WALKIN-BENEFIT',
              beneficiaryName: p.name,
              beneficiaryPid: p.patientId || p.id,
              staffMemberName: p.name,
              staffRole: p.staffDesignation || 'Internal Staff',
              tests: [t],
              waivedAmount: t.price || 5000,
              date: t.requestedDate || p.createdAt || new Date().toISOString(),
              authorizedBy: 'Receptionist Intake Check',
              status: 'Approved'
            });
          });
        }
      });

      // Sort descending by date
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBenefitsLogs(records);
    } catch (e) {
      console.error('Error fetching staff benefits logs:', e);
    } finally {
      setLoadingBenefits(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      await deleteDoc(doc(db, 'labs', lab?.id || 'lab-1', 'staff', staffId));
      fetchStaff();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  const filteredStaff = staffList.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.roles && s.roles.some((r: string) => r.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Staff Personnel Directory</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200/60">
              Admin-Managed Access Codes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin creates staff with initial access code. On first login, staff must set their confidential private code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Personnel List
            </button>
            <button
              onClick={() => setActiveTab('benefits_ledger')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'benefits_ledger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-teal-600" />
              Staff Benefits Ledger
            </button>
            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Security Audit Logs
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Create Staff & Code
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-900 text-xs rounded-xl flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-teal-700 hover:text-teal-950 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'directory' ? (
        <>
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search personnel by name, email or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition-all"
            />
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map(member => {
              const isPending = member.status === 'pending_setup' || member.mustChangePassword;
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm border border-teal-200">
                          {member.name ? member.name.slice(0, 2).toUpperCase() : 'ST'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">{member.name}</h3>
                          <div className="flex items-center gap-1 text-[11px] mt-0.5">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200 text-[10px]">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Initial Code (First-Time Setup Pending)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200 text-[10px]">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Private Code Configured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Roles & Access Code"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(member.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Revoke Staff Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Roles Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(member.roles || [member.role || 'receptionist']).map((r: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-200/60 uppercase tracking-wider"
                        >
                          {r.replace('_', ' ')}
                        </span>
                      ))}
                    </div>

                    {/* Contact Info */}
                    <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100 font-medium">
                      {member.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Card Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Key className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isPending ? 'Single-use setup code' : 'Confidential code active'}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedStaff(member);
                        setShowEditModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                      title="Manage roles or reset access code"
                    >
                      <KeyRound className="w-3 h-3" />
                      Manage / Reset Code
                    </button>
                  </div>

                  {/* Inline Delete Confirmation Overlay */}
                  {deleteConfirmId === member.id && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                      <p className="text-xs font-semibold text-rose-800">Confirm removal of this staff record?</p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member.id)}
                          className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : activeTab === 'benefits_ledger' ? (
        /* Staff Benefits Ledger View with Date Filtering */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <DollarSign className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Staff Diagnostic Benefits Ledger</h3>
                <p className="text-xs text-slate-500">
                  Audit trail of diagnostic tests provided under registered staff welfare & employment benefits
                </p>
              </div>
            </div>

            <button
              onClick={fetchBenefitsLogs}
              disabled={loadingBenefits}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
              title="Refresh Benefits"
            >
              <RefreshCw className={`w-4 h-4 ${loadingBenefits ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Date & Search Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            {/* Quick Date Range Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1">Filter by Date:</span>
              {(['all', 'today', 'week', 'month', 'custom'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setBenefitDateFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    benefitDateFilter === f
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : 'Custom Range'}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs if 'custom' is active */}
            {benefitDateFilter === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800"
                />
              </div>
            )}

            {/* Staff Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff or test name..."
                value={benefitStaffSearch}
                onChange={(e) => setBenefitStaffSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          {/* Table of Benefits */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Staff Member (Registered)</th>
                  <th className="py-3 px-4">Patient / Beneficiary</th>
                  <th className="py-3 px-4">Diagnostic Tests Conducted</th>
                  <th className="py-3 px-4 text-right">Benefit Value Waived</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {(() => {
                  const now = new Date();
                  const filtered = benefitsLogs.filter((rec: any) => {
                    const recDate = new Date(rec.date);
                    // Date range filter
                    if (benefitDateFilter === 'today') {
                      if (recDate.toDateString() !== now.toDateString()) return false;
                    } else if (benefitDateFilter === 'week') {
                      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      if (recDate < oneWeekAgo) return false;
                    } else if (benefitDateFilter === 'month') {
                      if (recDate.getMonth() !== now.getMonth() || recDate.getFullYear() !== now.getFullYear()) return false;
                    } else if (benefitDateFilter === 'custom') {
                      if (customStartDate && new Date(rec.date) < new Date(customStartDate)) return false;
                      if (customEndDate && new Date(rec.date) > new Date(customEndDate + 'T23:59:59')) return false;
                    }

                    // Search filter
                    if (benefitStaffSearch.trim()) {
                      const q = benefitStaffSearch.toLowerCase();
                      const matchStaff = rec.staffMemberName?.toLowerCase().includes(q);
                      const matchPatient = rec.beneficiaryName?.toLowerCase().includes(q);
                      const matchTest = rec.tests?.some((t: any) => (t.testName || t.name || '').toLowerCase().includes(q));
                      if (!matchStaff && !matchPatient && !matchTest) return false;
                    }

                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No staff benefit records found matching the selected date range.
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(rec.date).toLocaleDateString()} {new Date(rec.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-teal-900">{rec.staffMemberName}</div>
                        <div className="text-[10px] text-teal-600 font-semibold">{rec.staffRole}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{rec.beneficiaryName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">PID: {rec.beneficiaryPid}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          {rec.tests?.map((t: any, idx: number) => (
                            <span key={idx} className="inline-block bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 rounded-md mr-1 mb-1 font-semibold">
                              {t.testName || t.name || 'Clinical Test'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {Number(rec.waivedAmount).toLocaleString()} FCFA
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-teal-200">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          {rec.authorizedBy}
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Immutable Security Audit Logs View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
                <History className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Security & Access Audit Logs</h3>
                <p className="text-xs text-slate-500">
                  Immutable record of staff code assignments, role modifications, and authentication attempts
                </p>
              </div>
            </div>

            <button
              onClick={fetchAuditLogs}
              disabled={loadingLogs}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action Summary</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No security audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.actor?.name || 'System'}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{log.actor?.role || 'Service'}</div>
                      </td>
                      <td className="py-3 px-4 max-w-md truncate text-slate-800">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Logged
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <AddStaffModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStaffAdded={fetchStaff}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        onStaffUpdated={fetchStaff}
      />
    </div>
  );
};

export default ManageStaff;
