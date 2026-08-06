import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { db, getDocs, collection, updateDoc, doc } from '../../services/firebase';
import { 
  Calendar, 
  FileText, 
  Share2, 
  ArrowRightLeft, 
  Plus, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Activity, 
  TestTube,
  DollarSign,
  Laptop,
  Building2
} from 'lucide-react';

interface PatientDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onSelectTest?: (test: any) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onNavigateTab,
  onNotificationPress,
  onProfilePress,
  onSelectTest
}) => {
  const { user, lab } = useAuth();
  const { t } = useLanguage();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPatientTests();
  }, [user?.id, user?.email]);

  const fetchPatientTests = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'patients'));
      const found = snap.docs.find(d => 
        d.id === user?.id ||
        d.data().email === user?.email || 
        d.data().accessCode === user?.accessCode ||
        d.data().name === user?.name
      );
      if (found && found.data().labTests) {
        setTests(found.data().labTests);
      } else {
        setTests([]);
      }
    } catch (e) {
      console.error('Error fetching patient tests:', e);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVirtual = async (e: React.MouseEvent, testItem: any) => {
    e.stopPropagation();
    setRequestingId(testItem.id);
    try {
      const targetLabId = lab?.id || 'lab-1';
      const snap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const foundDoc = snap.docs.find(d => 
        d.id === user?.id ||
        d.data().email === user?.email || 
        d.data().accessCode === user?.accessCode ||
        d.data().name === user?.name
      );

      if (foundDoc) {
        const patientData = foundDoc.data();
        const updatedTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === testItem.id) {
            return {
              ...t,
              virtualRequested: true,
              virtualRequestedAt: new Date().toISOString()
            };
          }
          return t;
        });

        await updateDoc(doc(db, 'labs', targetLabId, 'patients', foundDoc.id), {
          labTests: updatedTests,
          updatedAt: new Date().toISOString()
        });
      }

      fetchPatientTests();
    } catch (err) {
      console.error('Error requesting virtual result:', err);
    } finally {
      setRequestingId(null);
    }
  };

  const actionCards = [
    { id: 'book', label: 'Book Appointment', desc: 'Schedule consultation or test', icon: Calendar, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'history', label: 'Test History', desc: 'View complete lab reports & prices', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'share', label: 'Share Results', desc: 'Send records to physician', icon: Share2, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'transfer', label: 'Transfer Records', desc: 'Move files between labs', icon: ArrowRightLeft, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Patient Medical Portal"
        subtitle="Manage your health records & lab test requests"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome Banner */}
        <div 
          style={{
            background: `linear-gradient(135deg, ${lab?.primaryColor || '#0f766e'}, ${lab?.secondaryColor || '#1e3a8a'})`
          }}
          className="rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        >
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Patient Account
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Valued Patient'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90">
              Connected to {lab?.name || 'nanoLabs Central Diagnostics'}
            </p>
            {onNavigateTab && (
              <div className="pt-2">
                <button
                  onClick={() => onNavigateTab('book')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-bold rounded-2xl text-xs hover:bg-white/90 shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-teal-700" />
                  Book New Test
                </button>
              </div>
            )}
          </div>

          {/* Big Circled Logo at Right Side */}
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
                <Activity className="w-10 h-10 stroke-[2.5]" />
              </div>
            )}
          </div>
        </div>

        {/* Physical Pickup & Virtual Request Notice */}
        <div className="p-4 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
          <Building2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold">Physical Result Collection & Online Virtual Reports</div>
            <p className="text-slate-700">
              When lab tests are completed, official printed paper copies can be picked up at the receptionist desk. You can also click <strong>"Request Virtual Result"</strong> below to have your digital PDF uploaded directly to your online dashboard.
            </p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionCards.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigateTab && onNavigateTab(card.id)}
                className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md cursor-pointer transition-all space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                    {card.label}
                  </h3>
                  <p className="text-xs text-slate-500">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Tests Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recent Test Requests</h3>
              <p className="text-xs text-slate-500">Track status, price paid & virtual PDF availability</p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-800 cursor-pointer"
              >
                View Full History
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {tests.map(test => {
              const price = test.price || test.amount || 5000;
              const hasPdf = Boolean(test.pdfUrl || test.fileUrl);

              return (
                <div
                  key={test.id}
                  onClick={() => onSelectTest && onSelectTest(test)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-teal-50/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0 mt-0.5">
                      <TestTube className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {test.testName || test.name}
                      </h4>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>Category: {test.category || 'General'}</span>
                        <span>•</span>
                        {test.paid === true || test.paymentStatus === 'paid' ? (
                          <span className="font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            Paid: {price.toLocaleString()} FCFA
                          </span>
                        ) : (
                          <span className="font-bold text-amber-800 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Unpaid: {price.toLocaleString()} FCFA
                          </span>
                        )}
                        <span>•</span>
                        <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase ${
                          test.status === 'completed' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : test.status === 'analyzing'
                              ? 'bg-blue-100 text-blue-800'
                              : test.paid
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-700'
                        }`}>
                          {test.status === 'completed' ? 'Results Ready' : test.status === 'analyzing' ? 'In Analysis' : test.paid ? 'Awaiting Specimen' : 'Pending Payment'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {hasPdf ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        PDF Virtual Result Ready
                      </span>
                    ) : test.virtualRequested ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                        Virtual Requested
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleRequestVirtual(e, test)}
                        disabled={requestingId === test.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Laptop className="w-3.5 h-3.5" />
                        {requestingId === test.id ? 'Requesting...' : 'Request Virtual Result'}
                      </button>
                    )}

                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              );
            })}

            {tests.length === 0 && (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <TestTube className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No laboratory test records found</p>
                <p className="text-xs text-slate-400">Book an appointment to request tests</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
