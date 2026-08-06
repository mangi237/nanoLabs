import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { db, getDocs, collection, updateDoc, doc } from '../../services/firebase';
import { 
  Search, 
  UserPlus, 
  TestTube, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  ArrowLeft, 
  Plus, 
  AlertCircle,
  Filter,
  Check,
  DollarSign,
  UserCheck,
  ShieldCheck,
  CreditCard,
  Building2,
  FlaskConical,
  Users
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
  onBack,
  onNavigateRegister,
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress,
  onNavigatePatientDetails
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const allPatients: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // A patient must ONLY appear on the receptionist's dashboard if they have actively requested a test
      const patientsWithTests = allPatients.filter(p => Array.isArray(p.labTests) && p.labTests.length > 0);
      setPatients(patientsWithTests);
    } catch (e) {
      console.error('Error fetching receptionist data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Receptionist strictly confirms the patient came to the hospital / check-in complete
  const handleConfirmPatientArrival = async (patientId: string, testId: string) => {
    setProcessingId(testId);
    try {
      const patient = patients.find(p => p.id === patientId);
      if (patient && patient.labTests) {
        const updatedTests = patient.labTests.map((t: any) => {
          if (t.id === testId) {
            return {
              ...t,
              confirmedByReceptionist: true,
              status: t.status === 'requested' ? 'confirmed' : t.status,
              confirmedAt: new Date().toISOString(),
              confirmedBy: user?.name || 'Receptionist Desk'
            };
          }
          return t;
        });

        await updateDoc(doc(db, 'labs', targetLabId, 'patients', patientId), {
          labTests: updatedTests,
          status: 'active',
          updatedAt: new Date().toISOString()
        });

        await fetchData();
      }
    } catch (e) {
      console.error('Error confirming patient arrival:', e);
    } finally {
      setProcessingId(null);
    }
  };

  // Flatten all test items with parent patient info
  const allTestItems = patients.flatMap(p => 
    (p.labTests || []).map((t: any) => ({
      ...t,
      patientId: p.id,
      patientName: p.name,
      patientCode: p.patientId || p.id,
      patientPhone: p.phone,
      patientAvatar: p.avatarUrl
    }))
  );

  const pendingConfirmationTests = allTestItems.filter(t => !t.confirmedByReceptionist && t.status !== 'completed');
  const confirmedTests = allTestItems.filter(t => t.confirmedByReceptionist);

  const getActiveList = () => {
    if (activeTab === 'pending') return pendingConfirmationTests;
    if (activeTab === 'confirmed') return confirmedTests;
    return allTestItems;
  };

  const filteredTests = getActiveList().filter(t =>
    (t.testName || t.name || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.patientName || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.patientCode || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.patientPhone || '')?.includes(searchQuery)
  );

  const getInitials = (name?: string) => {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Reception & Patient Intake Desk"
        subtitle="Verify patient hospital arrival, confirm check-in & route to Cashier"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Branded Lab Gradient Banner */}
        <div 
          style={{
            background: `linear-gradient(135deg, ${lab?.primaryColor || '#0f766e'}, ${lab?.secondaryColor || '#1e3a8a'})`
          }}
          className="rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
              <Users className="w-3.5 h-3.5" />
              Patient Reception & Arrival Intake Desk
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {lab?.name || 'nanoLabs Health Center'}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Confirm patient presence when they arrive at the hospital. Checked-in patients proceed to Cashier for payment validation.
            </p>
          </div>

          {/* Big Circled Logo at right side */}
          <div className="shrink-0 self-center sm:self-auto">
            {lab?.logoUrl ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/40 bg-white/10 backdrop-blur-md shadow-2xl p-1 flex items-center justify-center overflow-hidden">
                <img
                  src={lab.logoUrl}
                  alt={lab.name || 'Lab Logo'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/40 bg-white/20 backdrop-blur-md shadow-2xl flex items-center justify-center text-white">
                <Users className="w-10 h-10 stroke-[2.5]" />
              </div>
            )}
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Reception Check-in Control Desk</h2>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {lab?.name || 'Active Lab'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm patient presence upon clinic arrival to queue them for cashier billing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateRegister && (
              <button
                onClick={onNavigateRegister}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Register Walk-in Patient
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Pending Arrival Check-In ({pendingConfirmationTests.length})
          </button>

          <button
            onClick={() => setActiveTab('confirmed')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'confirmed'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Checked-In Patients ({confirmedTests.length})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            All Active Test Orders ({allTestItems.length})
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search test orders by patient name, patient code, test title or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        {/* Test Orders List */}
        <div className="space-y-3">
          {filteredTests.map((testItem: any) => {
            const isConfirmed = testItem.confirmedByReceptionist === true;
            const isPaid = testItem.paid === true || testItem.paymentStatus === 'paid';
            const isCollected = testItem.sampleCollected === true;
            const isCompleted = testItem.status === 'completed';
            const price = testItem.price || 5000;
            const turnaround = testItem.turnaroundTime || testItem.expectedTime || '24 Hours';

            return (
              <div
                key={`${testItem.patientId}-${testItem.id}`}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  !isConfirmed ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200/80'
                }`}
              >
                {/* Patient & Test Info */}
                <div className="flex items-start gap-4 min-w-0">
                  {testItem.patientAvatar ? (
                    <img
                      src={testItem.patientAvatar}
                      alt={testItem.patientName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border border-teal-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs">
                      {getInitials(testItem.patientName)}
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {testItem.testName || testItem.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 uppercase border border-teal-200">
                        {testItem.category || 'Diagnostic'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <span className="font-semibold text-slate-800">
                        Patient: {testItem.patientName} ({testItem.patientCode})
                      </span>
                      <span>•</span>
                      <span>Phone: {testItem.patientPhone || 'N/A'}</span>
                      <span>•</span>
                      <span className="font-bold text-emerald-700">
                        Fee: {price.toLocaleString()} FCFA
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-teal-600" />
                        Turnaround: {turnaround}
                      </span>
                    </div>

                    {/* Next step guidance */}
                    <div className="text-[11px] pt-1">
                      {!isConfirmed ? (
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Patient requested test online. Awaiting patient arrival confirmation.
                        </span>
                      ) : !isPaid ? (
                        <span className="text-blue-800 font-semibold flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                          Checked In: Patient is at Cashier counter to validate payment.
                        </span>
                      ) : !isCollected ? (
                        <span className="text-teal-800 font-semibold flex items-center gap-1">
                          <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                          Payment Settled: Patient is at Analyzer station for specimen collection.
                        </span>
                      ) : !isCompleted ? (
                        <span className="text-indigo-800 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          Specimen in Laboratory: Testing currently underway by Lab Technologist.
                        </span>
                      ) : (
                        <span className="text-emerald-800 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Diagnostic Results Completed: Verified and published.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions & Status */}
                <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-wrap justify-end">
                  {!isConfirmed ? (
                    <button
                      onClick={() => handleConfirmPatientArrival(testItem.patientId, testItem.id)}
                      disabled={processingId === testItem.id}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      {processingId === testItem.id ? 'Checking In...' : 'Confirm Patient Arrival (Check In)'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Check-in Confirmed
                      </span>

                      {isPaid ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-800 text-[11px] font-bold rounded-lg border border-teal-200">
                          <Check className="w-3 h-3 text-teal-600" />
                          Paid at Cashier
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 text-[11px] font-bold rounded-lg border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Sent to Cashier
                        </span>
                      )}
                    </div>
                  )}

                  {onNavigatePatientDetails && (
                    <button
                      onClick={() => onNavigatePatientDetails(testItem.patientId)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      View Patient File
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTests.length === 0 && !loading && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <TestTube className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">
                {activeTab === 'pending' ? 'No pending test requests awaiting arrival check-in' : 'No test records matching current view'}
              </p>
              <p className="text-xs text-slate-400">
                Patients will automatically appear here once they request or book laboratory tests.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReceptionistView;
