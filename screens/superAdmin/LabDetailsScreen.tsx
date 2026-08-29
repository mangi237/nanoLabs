import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  Users, 
  UserCheck, 
  DollarSign, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert,
  X,
  Plus,
  Calendar,
  Key,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, updateDoc, db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';

interface LabDetailsScreenProps {
  labId: string;
  onBack: () => void;
  onLabDeleted?: () => void;
}

export const LabDetailsScreen: React.FC<LabDetailsScreenProps> = ({
  labId,
  onBack,
  onLabDeleted
}) => {
  const { user } = useAuth();
  const [lab, setLab] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [confirmedTestsCount, setConfirmedTestsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [superAdminCode, setSuperAdminCode] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    address: ''
  });

  const formatCreatedDate = (rawDate: any): string => {
    if (!rawDate) return 'N/A';
    try {
      if (typeof rawDate === 'object' && typeof rawDate.seconds === 'number') {
        return new Date(rawDate.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      const parsed = new Date(rawDate);
      if (isNaN(parsed.getTime())) return 'N/A';
      return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const fetchLabDetails = async () => {
    try {
      setLoading(true);
      // Fetch labs
      const labsSnap = await getDocs(collection(db, 'labs'));
      const foundLabDoc = labsSnap.docs.find(d => d.id === labId);

      if (foundLabDoc) {
        const data = foundLabDoc.data();
        setLab({ id: foundLabDoc.id, ...data });
        setEditForm({
          name: data.name || '',
          location: data.location || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || ''
        });
      }

      // Fetch lab staff
      const staffSnap = await getDocs(collection(db, 'labs', labId, 'staff'));
      const staffDocs = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStaffList(staffDocs);

      // Fetch lab patients & count confirmed tests
      const patientSnap = await getDocs(collection(db, 'labs', labId, 'patients'));
      setPatientCount(patientSnap.size || foundLabDoc?.data()?.patientCount || 0);

      let confirmedCount = 0;
      patientSnap.docs.forEach(pDoc => {
        const pData = pDoc.data();
        const labTests = pData.labTests || [];
        labTests.forEach((test: any) => {
          if (
            test.confirmedByReceptionist === true || 
            test.sampleCollected === true ||
            ['confirmed', 'sample-collected', 'collected', 'processing', 'completed', 'paid'].includes(test.status)
          ) {
            confirmedCount++;
          }
        });
      });
      setConfirmedTestsCount(confirmedCount);

    } catch (err) {
      console.error('Error fetching lab details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabDetails();
  }, [labId]);

  const handleConfirmDeleteLab = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = (superAdminCode || '').trim().toUpperCase();
    const activeAdminCode = (user?.accessCode || '').trim().toUpperCase();
    const validCodes = ['SUPER123', 'SUPERADMIN', 'SUPERADMIN2025'];
    if (activeAdminCode) validCodes.push(activeAdminCode);

    if (!validCodes.includes(enteredCode)) {
      setDeleteError('Invalid Super Admin authorization code. Lab deletion denied.');
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'labs', labId));
      if (onLabDeleted) onLabDeleted();
      onBack();
    } catch (err) {
      console.error('Error deleting lab:', err);
      setDeleteError('Failed to delete lab record.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateDoc(doc(db, 'labs', labId), {
        name: editForm.name.trim(),
        location: editForm.location.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        address: editForm.address.trim()
      });
      setShowEditModal(false);
      fetchLabDetails();
    } catch (err) {
      console.error('Error updating lab details:', err);
      alert('Failed to update lab information.');
    }
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!window.confirm(`Remove admin/staff user "${staffName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'labs', labId, 'staff', staffId));
      fetchLabDetails();
    } catch (err) {
      console.error('Failed to remove staff member:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading laboratory center details...
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-slate-600 font-semibold">Laboratory center not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  let calculatedRevenue = 0;
  let revenueSubtitle = '';
  if (lab.pricingModel === 'flat_subscription') {
    calculatedRevenue = lab.subscriptionPrice || (
      lab.subscriptionTier === 'business' ? 120000 :
      lab.subscriptionTier === 'growth' ? 55000 : 25000
    );
    revenueSubtitle = `Flat Subscription (${(lab.subscriptionTier || 'GROWTH').toUpperCase()}) • Unlimited Tests`;
  } else if (lab.pricingModel === 'lifetime_space') {
    calculatedRevenue = lab.monthlyMaintenanceFee || 15000;
    revenueSubtitle = `Lifetime Dedicated Tenant • 15,000 FCFA/mo Maintenance`;
  } else {
    const fee = lab.feePerPatient || lab.feePerTest || 500;
    calculatedRevenue = confirmedTestsCount * fee;
    revenueSubtitle = `${confirmedTestsCount} confirmed tests @ ${fee.toLocaleString()} FCFA`;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Super Admin Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            Edit Center
          </button>
          <button
            onClick={() => {
              setShowDeleteModal(true);
              setSuperAdminCode('');
              setDeleteError('');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete Lab
          </button>
        </div>
      </div>

      {/* Lab Main Card */}
      <div 
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
        style={{ backgroundColor: lab.primaryColor || '#0D9488' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {lab.logoUrl || lab.avatarUrl ? (
              <img
                src={lab.logoUrl || lab.avatarUrl}
                alt={lab.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-md shrink-0 bg-white/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl border-2 border-white/30 shrink-0">
                {lab.name ? lab.name.charAt(0).toUpperCase() : 'L'}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                  <Building2 className="w-3.5 h-3.5" />
                  {lab.status === 'active' ? 'Active Network Center' : 'Pending / Inactive'}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  Created: {formatCreatedDate(lab.createdAt)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{lab.name}</h1>
              <p className="text-white/80 text-sm">{lab.slogan || 'Diagnostic & Clinical Laboratory'}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-right min-w-[200px]">
            <div className="text-xs text-white/80 uppercase font-bold tracking-wider">Facility Monthly Billing / Royalties</div>
            <div className="text-2xl font-bold mt-0.5">{calculatedRevenue.toLocaleString()} FCFA</div>
            <div className="text-[11px] text-white/70">{revenueSubtitle}</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{patientCount}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{confirmedTestsCount}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Tests</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{staffList.length}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Accounts</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{calculatedRevenue.toLocaleString()} FCFA</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Royalties</div>
          </div>
        </div>
      </div>

      {/* Contact & Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Location & Contact Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>Region / Location:</strong> {lab.location || 'N/A'}</span>
            </div>
            {lab.address && (
              <div className="flex items-center gap-3 text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong>Address:</strong> {lab.address}</span>
              </div>
            )}
            {lab.phone && (
              <div className="flex items-center gap-3 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong>Phone:</strong> {lab.phone}</span>
              </div>
            )}
            {lab.email && (
              <div className="flex items-center gap-3 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong>Email:</strong> {lab.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>Onboarding Date:</strong> {formatCreatedDate(lab.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Staff & Admin List (Masked credentials for privacy) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-600" />
              Assigned Staff & Administrators ({staffList.length})
            </h3>
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Credentials Protected
            </span>
          </div>

          {staffList.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No staff accounts registered yet.</p>
          ) : (
            <div className="space-y-3">
              {staffList.map((member) => (
                <div key={member.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{member.email || 'No email registered'}</span>
                      <span>•</span>
                      <span className="capitalize font-semibold text-slate-700">{member.primaryRole || member.role || 'Staff'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteStaff(member.id, member.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove Staff Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Edit Lab Center Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lab Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Region / Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Code-Verified Delete Lab Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Delete Facility Confirmation</h3>
                  <p className="text-[11px] text-slate-400">Authorization Code Required</p>
                </div>
              </div>

              <button
                onClick={() => { setShowDeleteModal(false); setDeleteError(''); setSuperAdminCode(''); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-rose-400 text-sm">Permanent Action Warning</div>
              <p className="text-slate-300">
                You are about to permanently delete <strong className="text-white">{lab.name}</strong> ({lab.location || 'Central Location'}).
              </p>
              <div className="text-slate-400 text-[11px]">
                Created: <strong className="text-slate-300">{formatCreatedDate(lab.createdAt)}</strong> • Total Staff: <strong className="text-slate-300">{staffList.length}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmDeleteLab} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Enter Super Admin Access Code to Confirm
                </label>
                <input
                  type="password"
                  placeholder="e.g. SUPER123"
                  value={superAdminCode}
                  onChange={(e) => {
                    setSuperAdminCode(e.target.value);
                    setDeleteError('');
                  }}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm tracking-wider focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
                {deleteError && (
                  <p className="text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {deleteError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setDeleteError(''); setSuperAdminCode(''); }}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting || !superAdminCode.trim()}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabDetailsScreen;
