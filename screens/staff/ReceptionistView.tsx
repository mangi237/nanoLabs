import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { db, getDocs, collection, updateDoc, doc, addDoc } from '../../services/firebase';
import { Search, UserPlus, TestTube, CheckCircle2, Clock, Phone, Mail, ArrowLeft, Plus } from 'lucide-react';

interface ReceptionistViewProps {
  onBack?: () => void;
  onNavigateRegister?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onNavigatePatientDetails?: (patientId: string) => void;
}

export const ReceptionistView: React.FC<ReceptionistViewProps> = ({
  onBack,
  onNavigateRegister,
  onNotificationPress,
  onProfilePress,
  onNavigatePatientDetails
}) => {
  const { lab } = useAuth();
  const { t } = useLanguage();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'admissions' | 'collections'>('admissions');

  useEffect(() => {
    fetchData();
  }, [lab?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'patients'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPatients(list);
    } catch (e) {
      console.error('Error fetching receptionist data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectSample = async (patientId: string, testId: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (patient && patient.labTests) {
        const updatedTests = patient.labTests.map((t: any) => {
          if (t.id === testId) {
            return { ...t, sampleCollected: true, status: 'collected' };
          }
          return t;
        });

        await updateDoc(doc(db, 'labs', lab?.id || 'lab-1', 'patients', patientId), {
          labTests: updatedTests,
          updatedAt: new Date().toISOString()
        });
        fetchData();
      }
    } catch (e) {
      console.error('Error collecting sample:', e);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Reception & Sample Intake Desk"
        subtitle="Patient check-in, registration & specimen collection"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Reception Control Desk</h2>
            <p className="text-xs text-slate-500">Manage daily intake and sample collection processing</p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateRegister && (
              <button
                onClick={onNavigateRegister}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                New Patient Intake
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('admissions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'admissions'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Patient Check-In ({patients.length})
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'collections'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Pending Sample Collections
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search patient by name, code or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        {/* Content View */}
        {activeTab === 'admissions' ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            {filteredPatients.map(patient => (
              <div
                key={patient.id}
                onClick={() => onNavigatePatientDetails && onNavigatePatientDetails(patient.id)}
                className={`p-5 flex items-center justify-between gap-4 transition-colors ${onNavigatePatientDetails ? 'cursor-pointer hover:bg-slate-50/80' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                    {patient.name ? patient.name.slice(0, 2).toUpperCase() : 'PT'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{patient.name}</h3>
                    <p className="text-xs text-slate-500">
                      ID: {patient.patientId || patient.id} • Phone: {patient.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  {patient.status || 'Active'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPatients.flatMap(p => (p.labTests || []).map((t: any) => ({ ...t, patientName: p.name, patientId: p.id }))).map(test => (
              <div key={test.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                    <TestTube className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{test.testName || test.name}</h4>
                    <p className="text-xs text-slate-500">Patient: {test.patientName}</p>
                  </div>
                </div>

                {test.sampleCollected ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    Sample Collected
                  </span>
                ) : (
                  <button
                    onClick={() => handleCollectSample(test.patientId, test.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                  >
                    <TestTube className="w-3.5 h-3.5" />
                    Collect Specimen
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ReceptionistView;
