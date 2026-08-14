import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection, updateDoc, doc } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
import { MASTER_TESTS_CATALOG, MasterTestItem } from '../../data/masterTestsData';
import { CreateMasterTestModal } from '../../components/common/CreateMasterTestModal';
import { 
  Search, 
  UserPlus, 
  TestTube, 
  CheckCircle2, 
  Clock, 
  Plus, 
  AlertCircle,
  FileText,
  DollarSign,
  UserCheck,
  ShieldCheck,
  Building2,
  FlaskConical,
  Users,
  Check,
  ChevronRight,
  Filter,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface ReceptionistViewProps {
  onBack?: () => void;
  onNavigateRegister?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
  onNavigatePatientDetails?: (patientId: string) => void;
}

export const ReceptionistView: React.FC<ReceptionistViewProps> = ({
  onNotificationPress,
  onNavigatePatientDetails
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [patients, setPatients] = useState<any[]>([]);
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<MasterTestItem[]>(MASTER_TESTS_CATALOG);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // New Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedMasterTestIds, setSelectedMasterTestIds] = useState<string[]>([]);
  const [doctorName, setDoctorName] = useState('Dr. Hiren Shah');
  const [sampleLocation, setSampleLocation] = useState('Central Diagnostics Hub');
  const [testSearch, setTestSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  useEffect(() => {
    fetchData();
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch patients
      const snap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const allPatients: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPatients(allPatients);

      // Fetch bookings
      const allBookings = await limsService.fetchAllBookings(targetLabId);
      setBookings(allBookings);

      // Fetch master test catalog
      const cat = await limsService.getMasterTestCatalog(targetLabId);
      setMasterCatalog(cat);
    } catch (e) {
      console.error('Error fetching receptionist data:', e);
    } fontally: {
      setLoading(false);
    }
  };

  const categories = ['All', 'Hematology', 'Biochemistry', 'Microbiology', 'Serology / Immunology', 'Hormones & Tumor Markers', 'Urinalysis & Parasitology'];

  const filteredMasterTests = masterCatalog.filter(t => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(testSearch.toLowerCase()) || (t.code && t.code.toLowerCase().includes(testSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const toggleTestSelection = (testId: string) => {
    if (selectedMasterTestIds.includes(testId)) {
      setSelectedMasterTestIds(selectedMasterTestIds.filter(id => id !== testId));
    } else {
      setSelectedMasterTestIds([...selectedMasterTestIds, testId]);
    }
  };

  const handleCreateNewBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient for this daily booking booklet.');
      return;
    }
    if (selectedMasterTestIds.length === 0) {
      alert('Please select at least one lab test to append to the patient booklet.');
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    setIsCreatingBooking(true);
    try {
      await limsService.createBooking({
        labId: targetLabId,
        patientId: patient.id,
        patientName: patient.name,
        patientAge: patient.age || 30,
        patientGender: patient.gender as any || 'Male',
        patientPhone: patient.phone,
        patientEmail: patient.email,
        patientPid: patient.patientId || patient.id,
        doctorName,
        sampleCollectedAt: sampleLocation,
        selectedMasterTestIds,
        creatorName: user?.name || 'Receptionist Desk'
      });

      setShowBookingModal(false);
      setSelectedMasterTestIds([]);
      await fetchData();
    } catch (e) {
      console.error('Error creating booking:', e);
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Header
        title="Reception & Patient Intake Desk"
        subtitle="Step 1: Patient registration, multi-test daily booklet creation & unpaid invoice generation"
        onNotificationPress={onNotificationPress}
      />

      {/* Top Banner Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Patient Daily Booklet / Booking Management
          </h2>
          <p className="text-xs text-slate-500">
            Append multiple requested tests under a unique Booking ID and forward invoice to Cashier.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateTestModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-slate-300"
          >
            <FlaskConical className="w-4 h-4 text-teal-600" />
            + New Master Test Definition
          </button>

          <button
            onClick={() => setShowBookingModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Create New Patient Booking Order
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search patient name, Booking ID (BK-...), or Invoice code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Bookings Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            Daily Bookings Queue ({filteredBookings.length})
          </h3>
          <span className="text-xs text-slate-500">Status: Reception Intake</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading daily bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">No active bookings found for today.</p>
            <p>Click <span className="font-bold text-teal-600">"+ Create New Patient Booking Order"</span> above to register patient tests.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 truncate">
                      {booking.patientName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      {booking.bookingCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      booking.paymentStatus === 'paid' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {booking.paymentStatus === 'paid' ? 'PAID' : 'Pending Payment'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span>Invoice: <strong className="font-mono text-slate-700">{booking.invoiceNumber}</strong></span>
                    <span>Ref Doctor: <strong>{booking.doctorName || 'Dr. Hiren Shah'}</strong></span>
                    <span>Tests Requested: <strong className="text-teal-700 font-bold">{booking.tests.length} tests</strong></span>
                    <span>Total Amount: <strong className="text-emerald-700 font-bold">{booking.totalAmount.toLocaleString()} XAF</strong></span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {booking.tests.map(t => (
                      <span key={t.id} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium border border-slate-200">
                        {t.testName}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigatePatientDetails?.(booking.patientId)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    View Patient
                  </button>
                  <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                    Forwarded to Cashier
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE NEW BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Create Patient Daily Booking Booklet</h3>
                  <p className="text-xs text-teal-300">Select patient & append requested tests for daily invoice</p>
                </div>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewBooking} className="overflow-y-auto space-y-4 text-xs pr-1 flex-1">
              
              {/* Step 1: Select Patient */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">1. Select Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Choose Registered Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender || 'M'}, {p.age || 28} Yrs) • PID: {p.patientId || p.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Doctor & Sample Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Referring Physician / Doctor</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Sample Collection Location</label>
                  <input
                    type="text"
                    value={sampleLocation}
                    onChange={e => setSampleLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Step 3: Append Tests from Master Catalog (~80 Tests) */}
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-extrabold text-teal-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-teal-400" />
                    2. Append Laboratory Tests (~80 Master Catalog)
                  </h4>
                  <span className="text-xs font-bold text-white bg-teal-800 px-2.5 py-1 rounded-lg">
                    Selected: {selectedMasterTestIds.length} tests
                  </span>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Search test name or code..."
                    value={testSearch}
                    onChange={e => setTestSearch(e.target.value)}
                    className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Tests Checklist */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-700/60 rounded-xl border border-slate-700 bg-slate-900 p-2 space-y-1">
                  {filteredMasterTests.map((t) => {
                    const isChecked = selectedMasterTestIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleTestSelection(t.id)}
                        className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked ? 'bg-teal-900/60 border border-teal-500/50 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-slate-600'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{t.name} <span className="text-[10px] text-teal-300 font-mono">({t.code})</span></div>
                            <div className="text-[10px] text-slate-400 truncate">{t.sampleType} • {t.category}</div>
                          </div>
                        </div>

                        <span className="font-mono font-bold text-teal-300 shrink-0 ml-2">
                          {t.basePrice.toLocaleString()} XAF
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Total Unpaid Invoice Amount:</span>
                <span className="text-base text-emerald-400 font-mono font-black">
                  {selectedMasterTestIds.reduce((sum, id) => {
                    const found = masterCatalog.find(m => m.id === id);
                    return sum + (found?.basePrice || 0);
                  }, 0).toLocaleString()} XAF
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBooking}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isCreatingBooking ? 'Creating Booking...' : 'Generate Unpaid Order & Send to Cashier'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CREATE MASTER TEST DEFINITION MODAL */}
      <CreateMasterTestModal
        isOpen={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        labId={targetLabId}
        onSuccess={fetchData}
      />

    </div>
  );
};

export default ReceptionistView;
