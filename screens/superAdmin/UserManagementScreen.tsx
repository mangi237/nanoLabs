import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Power, 
  UserCheck, 
  Filter,
  CheckCircle2,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  Eye,
  Check,
  X,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  UserPlus,
  Upload,
  Camera
} from 'lucide-react';
import { UserRole } from '../../types';

interface IdVerificationRequest {
  id: string;
  userId: string;
  patientName: string;
  phone: string;
  email: string;
  nationalIdNumber: string;
  insuranceProvider: string;
  policyNumber: string;
  idCardImageUrl?: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  submittedAt: string;
  thirdPartyProvider: string;
  thirdPartyStatus: 'match_confirmed' | 'manual_review' | 'failed';
  thirdPartyScore: number;
}

export const UserManagementScreen: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'id_verification'>('id_verification');

  const [users, setUsers] = useState([
    {
      id: 'u1',
      name: 'Mme. Sandrine Ndongo',
      role: 'patient' as UserRole,
      phone: '+237 671 22 33 44',
      email: 'sandrine.ndongo@nanolabs.cm',
      status: 'active',
      registeredAt: '2026-08-12'
    },
    {
      id: 'u2',
      name: 'Dr. Jean-Paul Kamga',
      role: 'doctor' as UserRole,
      phone: '+237 699 44 22 11',
      email: 'dr.kamga@nanolabs.cm',
      status: 'active',
      registeredAt: '2026-07-20',
      license: 'ONMC #4829'
    },
    {
      id: 'u3',
      name: 'M. Eric Mbida',
      role: 'phlebotomist' as UserRole,
      phone: '+237 699 44 22 11',
      email: 'eric.mbida@nanolabs.cm',
      status: 'active',
      registeredAt: '2026-08-01'
    },
    {
      id: 'u4',
      name: 'Dr. Suzanne Mbongo',
      role: 'biologist' as UserRole,
      phone: '+237 677 88 99 00',
      email: 's.mbongo@labcentral.cm',
      status: 'active',
      registeredAt: '2026-06-15',
      license: 'ONPC #1204'
    },
    {
      id: 'u5',
      name: 'Desk Cashier Akwa',
      role: 'cashier' as UserRole,
      phone: '+237 670 00 11 22',
      email: 'cashier@labcentral.cm',
      status: 'active',
      registeredAt: '2026-06-20'
    },
    {
      id: 'u6',
      name: 'Platform Super Admin',
      role: 'super_admin' as UserRole,
      phone: '+237 699 00 00 00',
      email: 'admin@nanolabs.cm',
      status: 'active',
      registeredAt: '2026-01-01'
    }
  ]);

  // ID Verification Queue State
  const [verificationRequests, setVerificationRequests] = useState<IdVerificationRequest[]>([
    {
      id: 'req-01',
      userId: 'patient-demo-1',
      patientName: 'Mme. Sandrine Ndongo',
      phone: '+237 671 22 33 44',
      email: 'sandrine.ndongo@nanolabs.cm',
      nationalIdNumber: '1029482910',
      insuranceProvider: 'AXA Assurances Cameroun (Douala)',
      policyNumber: 'POL-884920',
      idCardImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      status: 'pending_verification',
      submittedAt: 'Today at 08:30 AM',
      thirdPartyProvider: 'YeboVerify CEMAC National ID Registry API',
      thirdPartyStatus: 'match_confirmed',
      thirdPartyScore: 98
    },
    {
      id: 'req-02',
      userId: 'patient-demo-2',
      patientName: 'M. Fabrice Fotso',
      phone: '+237 694 55 66 77',
      email: 'f.fotso@gmail.com',
      nationalIdNumber: '1109283746',
      insuranceProvider: 'Chanas Assurances SA (Douala)',
      policyNumber: 'CHA-2026-904',
      idCardImageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80',
      status: 'pending_verification',
      submittedAt: 'Yesterday at 04:15 PM',
      thirdPartyProvider: 'YeboVerify CEMAC National ID Registry API',
      thirdPartyStatus: 'match_confirmed',
      thirdPartyScore: 95
    },
    {
      id: 'req-03',
      userId: 'patient-demo-3',
      patientName: 'Mme. Estelle Biya',
      phone: '+237 677 33 44 55',
      email: 'estelle.biya@orange.cm',
      nationalIdNumber: '1092834710',
      insuranceProvider: 'Activa Assurances (Douala)',
      policyNumber: 'ACT-77192',
      status: 'pending_verification',
      submittedAt: '2 days ago',
      thirdPartyProvider: 'YeboVerify CEMAC National ID Registry API',
      thirdPartyStatus: 'manual_review',
      thirdPartyScore: 82
    }
  ]);

  const [inspectingReq, setInspectingReq] = useState<IdVerificationRequest | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('patient');
  const [newUserLicense, setNewUserLicense] = useState('');
  const [newUserError, setNewUserError] = useState<string | null>(null);

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setNewUserError(null);
    const cleanName = newUserName.trim();
    if (!cleanName) {
      setNewUserError('Full name is required.');
      return;
    }
    const cleanPhone = newUserPhone.trim() || '+237 670 12 34 56';
    const cleanEmail = newUserEmail.trim() || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nanolabs.cm`;
    const createdUser = {
      id: `u-${Date.now()}`,
      name: cleanName,
      role: newUserRole,
      phone: cleanPhone,
      email: cleanEmail,
      license: newUserLicense.trim() || undefined,
      status: 'active',
      registeredAt: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => [createdUser, ...prev]);
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserLicense('');
    setActionNotice(`User account "${cleanName}" created successfully as ${newUserRole}!`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Load any newly uploaded user CNI from localStorage
  useEffect(() => {
    try {
      const storedCni = localStorage.getItem('nanolabs_cni_demo');
      const storedImg = localStorage.getItem('nanolabs_cni_img_demo');
      const storedStatus = localStorage.getItem('nanolabs_cni_status_demo');

      if (storedCni && storedStatus) {
        setVerificationRequests(prev => {
          const exists = prev.find(r => r.userId === 'demo');
          if (exists) {
            return prev.map(r => r.userId === 'demo' ? {
              ...r,
              nationalIdNumber: storedCni,
              idCardImageUrl: storedImg || r.idCardImageUrl,
              status: storedStatus as any
            } : r);
          } else {
            return [
              {
                id: 'req-live-user',
                userId: 'demo',
                patientName: 'Current Active Patient Profile',
                phone: '+237 671 22 33 44',
                email: 'patient@nanolabs.cm',
                nationalIdNumber: storedCni,
                insuranceProvider: 'AXA Assurances Cameroun (Douala)',
                policyNumber: 'POL-884920',
                idCardImageUrl: storedImg || undefined,
                status: (storedStatus as any) || 'pending_verification',
                submittedAt: 'Just now (Live Patient Session)',
                thirdPartyProvider: 'YeboVerify CEMAC National ID Registry API',
                thirdPartyStatus: 'match_confirmed',
                thirdPartyScore: 99
              },
              ...prev
            ];
          }
        });
      }
    } catch (err) {
      console.warn('Error reading live CNI request:', err);
    }
  }, []);

  const handleApproveId = (req: IdVerificationRequest) => {
    setVerificationRequests(prev =>
      prev.map(r => r.id === req.id ? { ...r, status: 'verified' } : r)
    );

    // Persist clearance across the applet so patient profile and checkout see it immediately
    localStorage.setItem(`nanolabs_cni_status_${req.userId}`, 'verified');
    localStorage.setItem(`nanolabs_cni_status_demo`, 'verified');

    setActionNotice(`National ID approved for ${req.patientName}! Insurance Tiers-Payant clearance is now active.`);
    setTimeout(() => setActionNotice(null), 5000);
    setInspectingReq(null);
  };

  const handleRejectId = (req: IdVerificationRequest) => {
    setVerificationRequests(prev =>
      prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r)
    );

    localStorage.setItem(`nanolabs_cni_status_${req.userId}`, 'rejected');
    localStorage.setItem(`nanolabs_cni_status_demo`, 'rejected');

    setActionNotice(`National ID rejected for ${req.patientName}. Patient prompted to re-upload clear CNI photo.`);
    setTimeout(() => setActionNotice(null), 5000);
    setInspectingReq(null);
  };

  const toggleUserStatus = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u
      )
    );
  };

  const handleRoleChange = (id: string, newRole: UserRole) => {
    setUsers(
      users.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingCount = verificationRequests.filter(r => r.status === 'pending_verification').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Alert */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-900 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="font-bold text-emerald-700 hover:text-emerald-950 p-1">
            ✕
          </button>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            User Accounts & National ID Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Review third-party identity KYC matches, clear patient health insurance caisses, and manage platform roles.
          </p>
        </div>

        {/* Actions & View Switcher Tabs */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add User</span>
          </button>

          <div className="p-1 bg-slate-200/80 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('id_verification')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'id_verification'
                  ? 'bg-[#006978] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ID Verification Queue</span>
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeSubTab === 'id_verification' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'users'
                  ? 'bg-[#006978] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Platform Users ({users.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: NATIONAL ID & INSURANCE VERIFICATION QUEUE ================= */}
      {activeSubTab === 'id_verification' && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-3xl flex items-center justify-between gap-3 text-xs text-teal-900">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <span className="font-extrabold block">Super Admin Third-Party Verification Workflow</span>
                <span className="text-[11px] text-teal-800">
                  Accounts remain in unverified holding status until National ID (CNI) snapshot and insurance matricule are vetted via our CEMAC biometric registry partner.
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white px-2.5 py-1 rounded-full border border-teal-200">
                Level-3 Clearance
              </span>
            </div>
          </div>

          {/* Verification Requests List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#006978]" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Pending & Reviewed National ID Snaps ({verificationRequests.length})
                </h3>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {verificationRequests.map((req) => (
                <div key={req.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* ID Document Preview Thumb */}
                    <div 
                      onClick={() => setInspectingReq(req)}
                      className="w-16 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:opacity-90 relative group"
                      title="Click to view full ID snapshot"
                    >
                      {req.idCardImageUrl ? (
                        <img src={req.idCardImageUrl} alt="CNI" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <CreditCard className="w-5 h-5" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-sm">{req.patientName}</h4>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          CNI: {req.nationalIdNumber}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {req.status === 'verified' ? 'Verified Official' : req.status === 'rejected' ? 'Rejected' : 'Unverified Holding'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                        <span>Insurance: <strong className="text-slate-800">{req.insuranceProvider}</strong></span>
                        <span>&bull;</span>
                        <span className="font-mono">Policy: <strong className="text-slate-800">{req.policyNumber}</strong></span>
                        <span>&bull;</span>
                        <span className="text-slate-400">{req.submittedAt}</span>
                      </div>

                      {/* 3rd Party Provider Status */}
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-teal-600" />
                          <span>{req.thirdPartyProvider}</span>
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-700 font-mono">
                          {req.thirdPartyScore}% Biometric Confidence Match
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => setInspectingReq(req)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect CNI</span>
                    </button>

                    {req.status === 'pending_verification' && (
                      <>
                        <button
                          onClick={() => handleApproveId(req)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify & Approve</span>
                        </button>

                        <button
                          onClick={() => handleRejectId(req)}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: GENERAL PLATFORM USERS ================= */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Filter and Search */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name, email, or telephone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {['all', 'patient', 'doctor', 'lab_staff', 'phlebotomist', 'cashier', 'biologist', 'super_admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-bold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                    roleFilter === r
                      ? 'bg-[#006978] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">User Name & Identity</th>
                    <th className="py-3 px-4">Role Permission</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        {u.license && (
                          <div className="text-[10px] font-mono text-[#0F766E]">{u.license}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 capitalize focus:outline-hidden"
                        >
                          <option value="patient">Patient</option>
                          <option value="doctor">Doctor</option>
                          <option value="lab_staff">Lab Staff</option>
                          <option value="phlebotomist">Phlebotomist</option>
                          <option value="cashier">Cashier</option>
                          <option value="biologist">Biologist</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <div>{u.phone}</div>
                        <div className="text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                            u.status === 'active'
                              ? 'border-slate-200 text-slate-500 hover:text-rose-600'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inspect Full National ID Snapshot & Third-Party Audit */}
      {inspectingReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#006978]" />
                <h3 className="text-base font-extrabold text-slate-900">National ID Document Inspection</h3>
              </div>
              <button
                onClick={() => setInspectingReq(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Snapshot */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Uploaded CNI Photo:</span>
              <div className="w-full h-56 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center">
                {inspectingReq.idCardImageUrl ? (
                  <img
                    src={inspectingReq.idCardImageUrl}
                    alt="National ID Snapshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400 space-y-1">
                    <FileText className="w-8 h-8 mx-auto" />
                    <p className="text-xs font-semibold">Digital CNI Number provided without physical photo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Identity & Insurance Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Patient Full Name:</span>
                <span className="font-extrabold text-slate-900">{inspectingReq.patientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">National ID Number:</span>
                <span className="font-mono font-black text-slate-900">{inspectingReq.nationalIdNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Insurance Provider:</span>
                <span className="font-bold text-slate-900">{inspectingReq.insuranceProvider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Policy Matricule:</span>
                <span className="font-mono font-bold text-slate-900">{inspectingReq.policyNumber}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <span className="text-slate-500">3rd-Party Verification:</span>
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{inspectingReq.thirdPartyScore}% Biometric Match (YeboVerify)</span>
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setInspectingReq(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => handleRejectId(inspectingReq)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Reject CNI
              </button>

              <button
                onClick={() => handleApproveId(inspectingReq)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Verify & Grant Clearance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add New System User</h3>
                  <p className="text-xs text-slate-500">Provision clinician, patient, cashier, or admin account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserError(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newUserError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{newUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Platform Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="patient">Patient (Self-Care & Results)</option>
                  <option value="doctor">Prescribing Doctor (Ordonnances & Consults)</option>
                  <option value="biologist">Medical Biologist (Sign-off & Validation)</option>
                  <option value="cashier">Desk Cashier (Invoicing & POS Billing)</option>
                  <option value="phlebotomist">Phlebotomist / Home Sample Courier</option>
                  <option value="super_admin">Platform Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Marcelle Ebongue or Jean Mbida"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="user@nanolabs.cm"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / Mobile Money
                  </label>
                  <input
                    type="tel"
                    placeholder="+237 6xx xx xx xx"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {(newUserRole === 'doctor' || newUserRole === 'biologist') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medical Council License Number (ONMC / ONPC)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ONMC #9283-CM"
                    value={newUserLicense}
                    onChange={(e) => setNewUserLicense(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserError(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementScreen;
