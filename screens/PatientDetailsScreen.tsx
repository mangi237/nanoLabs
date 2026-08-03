import React, { useState } from 'react';
import Header from '../components/common/Header';
import { useAuth } from '../context/authContext';
import { db, updateDoc, doc } from '../services/firebase';
import { ArrowLeft, User, Phone, Mail, MapPin, TestTube, Plus, CheckCircle2, FileText, Calendar, Edit3 } from 'lucide-react';

interface PatientDetailsScreenProps {
  patient?: any;
  onBack?: () => void;
  onSelectTest?: (test: any) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const PatientDetailsScreen: React.FC<PatientDetailsScreenProps> = ({
  patient,
  onBack,
  onSelectTest,
  onNotificationPress,
  onProfilePress
}) => {
  const { lab } = useAuth();
  const currentPatient = patient || null;
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [testName, setTestName] = useState('Lipid Profile Panel');
  const [category, setCategory] = useState('Biochemistry');
  const [price, setPrice] = useState(7000);

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTest = {
        id: 't-' + Math.floor(100 + Math.random() * 900),
        testName,
        category,
        price,
        status: 'requested',
        requestedDate: new Date().toISOString().split('T')[0],
        sampleCollected: false
      };

      const existingTests = currentPatient.labTests || [];
      const updatedTests = [...existingTests, newTest];

      await updateDoc(doc(db, 'labs', lab?.id || 'lab-1', 'patients', currentPatient.id), {
        labTests: updatedTests,
        updatedAt: new Date().toISOString()
      });

      currentPatient.labTests = updatedTests;
      setShowAddTestModal(false);
    } catch (e) {
      console.error('Error requesting new lab test:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Patient Profile & History"
        subtitle="Detailed medical record & diagnostic tests"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patients List
          </button>
        )}

        {/* Patient Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                {currentPatient.name ? currentPatient.name.slice(0, 2).toUpperCase() : 'PT'}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">{currentPatient.name}</h1>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                    {currentPatient.patientId || currentPatient.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {currentPatient.age || 30} years old • {currentPatient.gender || 'Female'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddTestModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Request New Test
            </button>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{currentPatient.phone || '+237 670000000'}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{currentPatient.email || 'No email registered'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{currentPatient.address || 'Central District'}</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Tests */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base">Laboratory Test History</h2>
            <span className="text-xs font-semibold text-slate-500">
              {(currentPatient.labTests || []).length} Tests Listed
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {(currentPatient.labTests || []).map((test: any) => (
              <div
                key={test.id}
                onClick={() => onSelectTest && onSelectTest(test)}
                className="p-5 flex items-center justify-between gap-4 hover:bg-teal-50/30 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                    <TestTube className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{test.testName || test.name}</h3>
                    <p className="text-xs text-slate-500">
                      Category: {test.category || 'General'} • Date: {test.requestedDate || 'Recent'}
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  test.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {test.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showAddTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Request Laboratory Test</h3>
            <form onSubmit={handleAddTest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Name</label>
                <input
                  type="text"
                  required
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Urinalysis">Urinalysis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (FCFA)</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTestModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
                >
                  Confirm Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetailsScreen;
