import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Users, 
  UserCheck, 
  DollarSign, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  ShieldCheck, 
  Trash2, 
  Sparkles,
  MapPin,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, db } from '../../services/firebase';
import { LabRegistrationModal } from './LabRegistrationModal';
import { LabDetailsScreen } from './LabDetailsScreen';

interface SuperAdminDashboardProps {
  onNavigate?: (screen: string, params?: any) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = () => {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  const fetchNetworkStats = async () => {
    try {
      setLoading(true);
      const labsSnap = await getDocs(collection(db, 'labs'));
      const labsData: any[] = [];

      for (const labDoc of labsSnap.docs) {
        const labInfo = { id: labDoc.id, ...labDoc.data() };
        
        // Count patients and confirmed tests for this lab
        let labPatientCount = 0;
        let labConfirmedTestsCount = 0;
        let labTotalTestsCount = 0;

        try {
          const patientSnap = await getDocs(collection(db, 'labs', labDoc.id, 'patients'));
          labPatientCount = patientSnap.size;
          
          patientSnap.docs.forEach(pDoc => {
            const pData = pDoc.data();
            const labTests = pData.labTests || [];
            labTotalTestsCount += labTests.length;
            labTests.forEach((test: any) => {
              if (
                test.confirmedByReceptionist === true || 
                test.sampleCollected === true ||
                ['confirmed', 'sample-collected', 'collected', 'processing', 'completed', 'paid'].includes(test.status)
              ) {
                labConfirmedTestsCount++;
              }
            });
          });
        } catch {
          // fallback
        }

        (labInfo as any).patientCount = labPatientCount;
        (labInfo as any).confirmedTestsCount = labConfirmedTestsCount;
        (labInfo as any).totalTestsCount = labTotalTestsCount;

        // Calculate revenue based on commercial model
        let labRevenue = 0;
        if ((labInfo as any).pricingModel === 'flat_subscription') {
          labRevenue = (labInfo as any).subscriptionPrice || (
            (labInfo as any).subscriptionTier === 'business' ? 120000 :
            (labInfo as any).subscriptionTier === 'growth' ? 55000 : 25000
          );
        } else if ((labInfo as any).pricingModel === 'lifetime_space') {
          labRevenue = (labInfo as any).monthlyMaintenanceFee || 15000;
        } else {
          // Pay-per-test model (500 FCFA / test)
          const fee = (labInfo as any).feePerPatient || (labInfo as any).feePerTest || 500;
          labRevenue = labConfirmedTestsCount * fee;
        }

        (labInfo as any).royaltyEarnings = labRevenue;

        // Count staff for this lab
        try {
          const staffSnap = await getDocs(collection(db, 'labs', labDoc.id, 'staff'));
          (labInfo as any).staffCount = staffSnap.size || (labInfo as any).staffCount || 1;
        } catch {
          // fallback
        }

        labsData.push(labInfo);
      }

      setLabs(labsData);
    } catch (err) {
      console.error('Error fetching network labs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNetworkStats();
  }, []);

  const handleDeleteLab = async (labId: string, labName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${labName}"?`)) return;

    try {
      await deleteDoc(doc(db, 'labs', labId));
      fetchNetworkStats();
    } catch (err) {
      console.error('Failed to delete lab:', err);
    }
  };

  if (selectedLabId) {
    return (
      <LabDetailsScreen 
        labId={selectedLabId}
        onBack={() => setSelectedLabId(null)}
        onLabDeleted={() => {
          setSelectedLabId(null);
          fetchNetworkStats();
        }}
      />
    );
  }

  // Aggregate metrics
  const totalLabs = labs.length;
  const totalPatients = labs.reduce((acc, l) => acc + (l.patientCount || 0), 0);
  const totalConfirmedTests = labs.reduce((acc, l) => acc + (l.confirmedTestsCount || 0), 0);
  const totalStaff = labs.reduce((acc, l) => acc + (l.staffCount || 0), 0);
  const totalRevenue = labs.reduce((acc, l) => acc + (l.royaltyEarnings || 0), 0); // 1,000 FCFA per confirmed test

  const filteredLabs = labs.filter(l => 
    (l.name && l.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.location && l.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              Super Administrator Control Panel
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Clinical Network Overseer
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Monitor diagnostic health centers, provision new laboratory franchises, and track royalties from confirmed test requests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowRegModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register New Lab Center
            </button>
            <button
              onClick={() => { setRefreshing(true); fetchNetworkStats(); }}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-colors cursor-pointer"
              title="Refresh Network Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-300' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Network Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalLabs}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Labs</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalPatients}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Network Patients</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalConfirmedTests}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Tests</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700">{totalRevenue.toLocaleString()} FCFA</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Royalty</div>
          </div>
        </div>
      </div>

      {/* Labs List Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            Registered Laboratory Centers
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search lab name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading network laboratory centers...
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No laboratory centers registered yet</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Click "Register New Lab Center" to provision a brand-new medical laboratory in the network.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLabs.map((labItem) => (
              <div 
                key={labItem.id} 
                onClick={() => setSelectedLabId(labItem.id)}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {labItem.logoUrl || labItem.avatarUrl ? (
                    <img
                      src={labItem.logoUrl || labItem.avatarUrl}
                      alt={labItem.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-xs"
                      style={{ backgroundColor: labItem.primaryColor || '#0D9488' }}
                    >
                      {labItem.name ? labItem.name.charAt(0).toUpperCase() : 'L'}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{labItem.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                      {labItem.pricingModel === 'flat_subscription' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100/80 text-teal-800 border border-teal-200">
                          Subscription ({labItem.subscriptionTier?.toUpperCase() || 'GROWTH'})
                        </span>
                      ) : labItem.pricingModel === 'lifetime_space' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100/80 text-purple-800 border border-purple-200">
                          Lifetime Dedicated Space
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-800 border border-amber-200">
                          Pay-Per-Test (500 FCFA)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {labItem.location || 'Central Region'}
                      </span>
                      <span>• Patients: <strong className="text-slate-900">{labItem.patientCount || 0}</strong></span>
                      <span>• Confirmed Tests: <strong className="text-indigo-600 font-bold">{labItem.confirmedTestsCount || 0}</strong></span>
                      <span>• Staff: <strong className="text-slate-900">{labItem.staffCount || 1}</strong></span>
                      <span>• Royalty Revenue: <strong className="text-emerald-700 font-bold">{(labItem.royaltyEarnings || 0).toLocaleString()} FCFA</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <button
                    onClick={(e) => handleDeleteLab(labItem.id, labItem.name, e)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Lab Center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <LabRegistrationModal 
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        onLabCreated={() => fetchNetworkStats()}
      />
    </div>
  );
};
