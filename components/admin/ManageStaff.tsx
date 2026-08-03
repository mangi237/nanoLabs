import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection, deleteDoc, doc } from '../../services/firebase';
import AddStaffModal from './AddStaffModal';
import EditStaffModal from './EditStaffModal';
import { UserPlus, Search, Shield, User, DollarSign, Microscope, TestTube, Edit3, Trash2, Key, Mail, Phone, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ManageStaff: React.FC = () => {
  const { lab } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [lab?.id]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const staffRef = collection(db, 'labs', lab?.id || 'lab-1', 'staff');
      const snap = await getDocs(staffRef);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStaffList(list);
    } catch (e) {
      console.error('Error fetching staff list:', e);
    } finally {
      setLoading(false);
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
    s.accessCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Staff Personnel Directory</h2>
          <p className="text-xs text-slate-500">Manage lab technicians, analyzers, receptionists & admins</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add New Staff Member
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search staff members by name, email or access code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition-all"
        />
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(member => (
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
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                      <Key className="w-3 h-3 text-amber-500" />
                      <span>Code: {member.accessCode || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedStaff(member);
                      setShowEditModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Edit Staff"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(member.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Staff"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Roles Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(member.roles || [member.role || 'staff']).map((r: string, idx: number) => (
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
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{member.phone || 'No phone provided'}</span>
                </div>
              </div>
            </div>

            {/* Inline Delete Confirmation Overlay */}
            {deleteConfirmId === member.id && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                <p className="text-xs font-semibold text-rose-800">Confirm removal of this staff record?</p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(member.id)}
                    className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      <AddStaffModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStaffAdded={() => {
          setShowAddModal(false);
          fetchStaff();
        }}
      />

      <EditStaffModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        staff={selectedStaff}
        onStaffUpdated={() => {
          setShowEditModal(false);
          fetchStaff();
        }}
      />
    </div>
  );
};

export default ManageStaff;
