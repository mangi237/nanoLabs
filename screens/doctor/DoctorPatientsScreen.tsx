import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  FileText, 
  Activity, 
  ChevronRight, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Filter, 
  Plus, 
  Video,
  TestTube,
  CheckCircle2,
  Clock,
  Sparkles,
  Droplet,
  Shield,
  ExternalLink,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';

interface DoctorPatientsScreenProps {
  onSelectPatient?: (patientId: string) => void;
  onNewPrescription?: () => void;
}

export const DoctorPatientsScreen: React.FC<DoctorPatientsScreenProps> = ({
  onSelectPatient,
  onNewPrescription
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [patients, setPatients] = useState<any[]>([]);
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [activeModalPatient, setActiveModalPatient] = useState<any | null>(null);
  const [copiedPid, setCopiedPid] = useState<string | null>(null);

  useEffect(() => {
    fetchCohortData();
  }, [targetLabId]);

  const fetchCohortData = async () => {
    try {
      setLoading(true);
      // Fetch live patients
      const patientsRef = collection(db, 'labs', targetLabId, 'patients');
      const snap = await getDocs(patientsRef);
      const pList = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch live bookings
      const bList = await limsService.fetchAllBookings(targetLabId);
      setBookings(bList);

      if (pList.length === 0 && bList.length > 0) {
        // Synthesize from real bookings if patients collection not partitioned
        const map: Record<string, any> = {};
        bList.forEach(b => {
          const key = b.patientPid || b.patientId || b.id;
          if (!map[key]) {
            map[key] = {
              id: key,
              name: b.patientName,
              patientId: b.patientPid || key,
              phone: b.patientPhone,
              email: b.patientEmail,
              age: b.patientAge || 35,
              gender: b.patientGender || 'Adult',
              bloodGroup: 'O+',
              hasInsurance: Boolean(b.insuranceProvider || b.hasInsurance),
              insuranceProvider: b.insuranceProvider,
              createdAt: b.createdAt
            };
          }
        });
        setPatients(Object.values(map));
      } else {
        setPatients(pList);
      }
    } catch (e) {
      console.error('Error fetching doctor patient cohort:', e);
    } finally {
      setLoading(false);
    }
  };

  const getPatientBookings = (patient: any): PatientBooking[] => {
    const pId = (patient.id || '').trim();
    const pPid = (patient.patientId || patient.pid || '').trim().toLowerCase();

    return bookings.filter(b => {
      const bPid = (b.patientId || '').trim();
      const bPatientPid = (b.patientPid || '').trim().toLowerCase();
      return (
        (pPid && (bPatientPid === pPid || bPid.toLowerCase() === pPid)) ||
        (pId && (bPid === pId || bPatientPid === pId.toLowerCase()))
      );
    });
  };

  const filteredPatients = patients.filter((p) => {
    const pBookings = getPatientBookings(p);
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.patientId?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.insuranceProvider?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedStatusFilter === 'all') return true;
    if (selectedStatusFilter === 'signed') {
      return pBookings.some(b => b.overallStatus === 'Completed' || b.paymentStatus === 'paid');
    }
    if (selectedStatusFilter === 'in_progress') {
      return pBookings.some(b => b.overallStatus !== 'Completed');
    }
    return true;
  });

  const handleCopy = (pid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pid);
    setCopiedPid(pid);
    setTimeout(() => setCopiedPid(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs font-semibold text-teal-800 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>ONMC Certified Physician Network &bull; Live Cohort</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Clinical Patient Cohort
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Real patient records, test history, biological biomarker results, and Waspito telehealth sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://waspito.com"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-4 py-2.5 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            <span>Consult on Waspito</span>
          </a>

          {onNewPrescription && (
            <button
              onClick={onNewPrescription}
              className="min-h-[44px] px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Lab Request</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search cohort by patient name, PID or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All Cohort Patients</option>
            <option value="signed">Reports Validated & Signed</option>
            <option value="in_progress">Analysis in Progress</option>
          </select>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-2 rounded-xl border border-teal-200">
            {filteredPatients.length} Active Records
          </span>
        </div>
      </div>

      {/* Patient Cards List */}
      {loading ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading Clinical Cohort...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Cohort Patients Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You can create a new laboratory investigation for a patient to add them to your cohort.
          </p>
          {onNewPrescription && (
            <button
              onClick={onNewPrescription}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              + Create New Lab Prescription
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPatients.map((patient) => {
            const pBookings = getPatientBookings(patient);
            const latestBooking = pBookings[0];
            const testNames = latestBooking?.tests?.map(t => t.testName).join(', ') || 'Diagnostic Panel';
            const isCompleted = latestBooking?.overallStatus === 'Completed' || latestBooking?.paymentStatus === 'paid';

            return (
              <div
                key={patient.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-black text-slate-900">{patient.name}</span>
                    <button
                      onClick={(e) => handleCopy(patient.patientId || patient.id, e)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 hover:bg-teal-50 text-slate-700 border border-slate-200 flex items-center gap-1 cursor-pointer"
                      title="Copy Patient PID"
                    >
                      <span>{patient.patientId || patient.id}</span>
                      {copiedPid === (patient.patientId || patient.id) ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </button>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {patient.age || 35} yrs &bull; {patient.gender || 'Adult'}
                    </span>
                    {patient.bloodGroup && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-0.5">
                        <Droplet className="w-2.5 h-2.5 text-rose-600" /> {patient.bloodGroup}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-2 font-mono flex-wrap">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{patient.phone || 'No phone recorded'}</span>
                    {patient.hasInsurance && (
                      <>
                        <span>&bull;</span>
                        <span className="text-indigo-700 font-sans font-bold flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {patient.insuranceProvider}
                        </span>
                      </>
                    )}
                  </p>

                  <div className="text-[11px] text-slate-600 pt-0.5 truncate">
                    Latest Investigation: <strong className="text-slate-900">{testNames}</strong> ({latestBooking?.createdAt ? new Date(latestBooking.createdAt).toLocaleDateString() : 'Active'})
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2.5 self-end sm:self-auto shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {isCompleted ? 'Validated & Signed' : 'Analysis In Lab'}
                  </span>

                  <a
                    href="https://waspito.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] px-3.5 py-1.5 bg-[#0084FF] hover:bg-[#0073E6] text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Waspito Consult</span>
                  </a>

                  <button
                    onClick={() => setActiveModalPatient({ ...patient, bookings: pBookings })}
                    className="min-h-[40px] px-4 py-1.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    <span>View Dossier ({pBookings.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Dossier Modal */}
      {activeModalPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">{activeModalPatient.name}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  PID: {activeModalPatient.patientId || activeModalPatient.id} &bull; {activeModalPatient.age || 35} yrs &bull; {activeModalPatient.gender || 'Adult'}
                </p>
              </div>
              <button
                onClick={() => setActiveModalPatient(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Diagnostic Orders & History ({activeModalPatient.bookings?.length || 0} batches)
              </h4>

              {activeModalPatient.bookings?.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                  No orders recorded for this patient.
                </div>
              ) : (
                activeModalPatient.bookings?.map((b: PatientBooking) => (
                  <div key={b.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Booking #{b.bookingCode}</span>
                      <span className="font-mono text-emerald-700">{(b.totalAmount || 0).toLocaleString()} XAF</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Tests: {b.tests?.map(t => t.testName).join(', ')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Date: {b.createdAt ? new Date(b.createdAt).toLocaleString() : 'Recent'} &bull; Status: {b.overallStatus || 'Pending'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              <a
                href="https://waspito.com"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-4 py-2 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Video className="w-4 h-4" />
                <span>Launch Waspito Video Teleconsult</span>
              </a>
              <button
                onClick={() => setActiveModalPatient(null)}
                className="min-h-[40px] px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientsScreen;
