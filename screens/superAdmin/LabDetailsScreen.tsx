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
  Plus
} from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, updateDoc, db } from '../../services/firebase';

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
  const [lab, setLab] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [confirmedTestsCount, setConfirmedTestsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    address: ''
  });

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

  const handleDeleteLab = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${lab?.name}" and all associated staff and patient records?`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'labs', labId));
      if (onLabDeleted) onLabDeleted();
      onBack();
    } catch (err) {
      console.error('Error deleting lab:', err);
      alert('Failed to delete lab. Please try again.');
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

  const calculatedRevenue = confirmedTestsCount * (lab.feePerTest || lab.feePerPatient || 1000);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
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
            onClick={handleDeleteLab}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
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
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                <Building2 className="w-3.5 h-3.5" />
                {lab.status === 'active' ? 'Active Network Center' : 'Inactive'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold">{lab.name}</h1>
              <p className="text-white/80 text-sm">{lab.slogan || 'Diagnostic & Clinical Laboratory'}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-right min-w-[200px]">
            <div className="text-xs text-white/80 uppercase font-bold tracking-wider">Confirmed Test Royalties</div>
            <div className="text-2xl font-bold mt-0.5">{calculatedRevenue.toLocaleString()} FCFA</div>
            <div className="text-[11px] text-white/70">{confirmedTestsCount} confirmed tests @ 1,000 FCFA</div>
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
          </div>
        </div>

        {/* Staff & Admin List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-600" />
            Assigned Staff & Administrators ({staffList.length})
          </h3>

          {staffList.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No staff accounts registered yet.</p>
          ) : (
            <div className="space-y-3">
              {staffList.map((member) => (
                <div key={member.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                    <div className="text-xs text-slate-500">
                      {member.email} • Code: <span className="font-mono text-teal-700 font-bold">{member.accessCode}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteStaff(member.id, member.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
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
                <label className="block text-xs font-bold text-slate-600 mb-1">Location / Region</label>
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
                  type="text"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
