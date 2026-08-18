import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
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
  TrendingUp,
  Clock,
  ShieldAlert,
  Key,
  Check,
  X,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  Percent
} from 'lucide-react';
import { collection, getDocs, deleteDoc, updateDoc, doc, db } from '../../services/firebase';
import { LabRegistrationModal } from './LabRegistrationModal';
import { LabDetailsScreen } from './LabDetailsScreen';

// FIXED: Commission payment modal
interface CommissionPaymentModalProps {
  lab: any;
  onClose: () => void;
  onConfirm: () => void;
}

const CommissionPaymentModal: React.FC<CommissionPaymentModalProps> = ({ lab, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [commissionDue, setCommissionDue] = useState(0);
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Calculate commission due (500 FCFA per confirmed test)
    const totalTests = lab.confirmedTestsCount || 0;
    const due = totalTests * 500;
    setCommissionDue(due);
    setAmount(due.toString());
  }, [lab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      alert('Please enter a payment reference.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'labs', lab.id), {
        lastCommissionPaidAt: new Date().toISOString(),
        lastCommissionAmount: parseInt(amount),
        commissionPaymentReference: reference,
        commissionBalance: 0,
        updatedAt: new Date().toISOString()
      });
      onConfirm();
    } catch (err) {
      console.error('Error processing commission payment:', err);
      alert('Failed to process commission payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Commission Payment</h3>
              <p className="text-[11px] text-slate-400">{lab.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Total Confirmed Tests:</span>
              <span className="font-bold text-white">{lab.confirmedTestsCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Commission Rate:</span>
              <span className="font-bold text-emerald-400">500 FCFA / test</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400 text-xs font-bold">Total Commission Due:</span>
              <span className="text-xl font-black text-emerald-400">{commissionDue.toLocaleString()} FCFA</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Payment Reference / Transaction ID</label>
            <input
              type="text"
              required
              placeholder="Enter payment reference..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : 'Confirm Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SuperAdminDashboardProps {
  onNavigate?: (screen: string, params?: any) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onNavigate,
  onNotificationPress,
  onProfilePress
}) => {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'plan_requests'>('active');

  // FIXED: Commission payment modal state
  const [commissionLab, setCommissionLab] = useState<any | null>(null);

  // SuperAdmin Access Code Confirmation Modal
  const [confirmingLab, setConfirmingLab] = useState<any | null>(null);
  const [confirmingPlanRequestLab, setConfirmingPlanRequestLab] = useState<any | null>(null);
  const [superAdminCode, setSuperAdminCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // FIXED: Masked revenue - only show commission
  const [totalCommission, setTotalCommission] = useState(0);
  const [totalTests, setTotalTests] = useState(0);

  const fetchNetworkStats = async () => {
    try {
      setLoading(true);
      const labsSnap = await getDocs(collection(db, 'labs'));
      const labsData: any[] = [];
      let totalCommission = 0;
      let totalTests = 0;

      for (const labDoc of labsSnap.docs) {
        const labInfo = { id: labDoc.id, ...labDoc.data() };
        
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

        // FIXED: Only calculate commission, not total revenue
        const commission = labConfirmedTestsCount * 500;
        (labInfo as any).commissionDue = commission;
        totalCommission += commission;
        totalTests += labConfirmedTestsCount;

        try {
          const staffSnap = await getDocs(collection(db, 'labs', labDoc.id, 'staff'));
          (labInfo as any).staffCount = staffSnap.size || (labInfo as any).staffCount || 1;
        } catch {
          // fallback
        }

        labsData.push(labInfo);
      }

      setTotalCommission(totalCommission);
      setTotalTests(totalTests);
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
    if (!window.confirm(`Are you sure you want to permanently delete or reject "${labName}"?`)) return;

    try {
      await deleteDoc(doc(db, 'labs', labId));
      fetchNetworkStats();
    } catch (err) {
      console.error('Failed to delete lab:', err);
    }
  };

  const handleConfirmLabActivation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!confirmingLab) return;

    setProcessingAction(true);
    try {
      await updateDoc(doc(db, 'labs', confirmingLab.id), {
        status: 'active',
        confirmed: true,
        verificationStatus: 'verified',
        confirmedAt: new Date().toISOString(),
        confirmedBy: 'SuperAdmin',
        updatedAt: new Date().toISOString()
      });

      setConfirmingLab(null);
      fetchNetworkStats();
    } catch (err) {
      console.error('Error confirming lab:', err);
      setCodeError('Failed to activate lab. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleApprovePlanChange = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!confirmingPlanRequestLab) return;

    setProcessingAction(true);
    try {
      const newModel = confirmingPlanRequestLab.requestedPricingModel || 'pay_per_test';
      const newTier = confirmingPlanRequestLab.requestedSubscriptionTier || 'growth';

      await updateDoc(doc(db, 'labs', confirmingPlanRequestLab.id), {
        pricingModel: newModel,
        subscriptionPlan: newModel,
        subscriptionTier: newTier,
        requestedPricingModel: null,
        requestedSubscriptionTier: null,
        planChangeRequestedAt: null,
        subscriptionStartDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setConfirmingPlanRequestLab(null);
      fetchNetworkStats();
    } catch (err) {
      console.error('Error approving plan change:', err);
      setCodeError('Failed to update lab pricing plan.');
    } finally {
      setProcessingAction(false);
    }
  };

  // FIXED: Handle commission payment
  const handleCommissionPayment = async () => {
    if (commissionLab) {
      // Refresh data
      await fetchNetworkStats();
      setCommissionLab(null);
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

  // Filter lists
  const activeLabs = labs.filter(l => l.status === 'active' || l.confirmed === true || (!l.status && l.id.startsWith('lab-')));
  const pendingLabs = labs.filter(l => l.status === 'pending_approval' || l.confirmed === false);
  const planRequestLabs = labs.filter(l => !!l.requestedPricingModel);

  // Aggregate metrics - FIXED: Only show commission and test count
  const totalLabs = activeLabs.length;
  const totalPatients = activeLabs.reduce((acc, l) => acc + (l.patientCount || 0), 0);

  const displayedLabs = 
    activeTab === 'pending' ? pendingLabs :
    activeTab === 'plan_requests' ? planRequestLabs : activeLabs;

  const filteredLabs = displayedLabs.filter(l => 
    (l.name && l.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.location && l.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Header
        title="Super Admin Network Overseer"
        subtitle="Global laboratory franchise & multi-tenant operations"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold border border-teal-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Super Administrator Network Oversight
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Clinical Network Management
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Monitor diagnostic health centers, configure multi-tenant commercial models, and manage network facility provisioning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowRegModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-2xl text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register New Lab Center
            </button>
            <button
              onClick={() => { setRefreshing(true); fetchNetworkStats(); }}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700 transition-colors cursor-pointer"
              title="Refresh Network Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* FIXED: Network Stats Grid - Only showing commission and tests */}
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
            <div className="text-2xl font-bold text-slate-900">{totalTests}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Tests</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700">{totalCommission.toLocaleString()} FCFA</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Commission</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Labs List Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Header with Navigation Tabs */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'active'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Active Laboratories ({activeLabs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending Approval ({pendingLabs.length})</span>
              {pendingLabs.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('plan_requests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'plan_requests'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Plan Requests ({planRequestLabs.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search facility or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
            <p className="font-semibold text-slate-700">
              {activeTab === 'pending' ? 'No facilities pending approval' :
               activeTab === 'plan_requests' ? 'No active plan change requests' :
               'No laboratory centers registered yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'pending'
                ? 'All newly registered medical facilities have been confirmed by SuperAdmin.'
                : 'Click "Register New Lab Center" to provision a brand-new medical laboratory.'}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-base">{labItem.name}</span>
                      
                      {labItem.status === 'pending_approval' || labItem.confirmed === false ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Awaiting Confirmation
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Active License
                        </span>
                      )}

                      {labItem.requestedPricingModel && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">
                          Requested Plan Switch: {labItem.requestedPricingModel.toUpperCase()}
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {labItem.pricingModel === 'flat_subscription' 
                          ? `Monthly SaaS (${(labItem.subscriptionTier || 'small').toUpperCase()})` 
                          : 'Pay-Per-Test (500 FCFA Commission)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {labItem.location || 'Central Region'}
                      </span>
                      <span>• Patients: <strong className="text-slate-900 font-bold">{labItem.patientCount || 0}</strong></span>
                      <span>• Total Tests: <strong className="text-slate-900 font-bold">{labItem.confirmedTestsCount || 0}</strong></span>
                      {/* FIXED: Only show commission */}
                      <span>• Commission Due: <strong className="text-emerald-700 font-extrabold font-mono">{(labItem.commissionDue || 0).toLocaleString()} FCFA</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* FIXED: Commission payment button */}
                  {labItem.confirmedTestsCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCommissionLab(labItem);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay Commission ({labItem.commissionDue?.toLocaleString()})</span>
                    </button>
                  )}

                  {/* Pending Approval Confirm Action Button */}
                  {(labItem.status === 'pending_approval' || labItem.confirmed === false) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingLab(labItem);
                      }}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve & Activate</span>
                    </button>
                  )}

                  {/* Plan Change Approval Action Button */}
                  {labItem.requestedPricingModel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingPlanRequestLab(labItem);
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <span>Approve Plan Switch</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => handleDeleteLab(labItem.id, labItem.name, e)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete / Reject Facility"
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

      {/* FIXED: Commission Payment Modal */}
      {commissionLab && (
        <CommissionPaymentModal
          lab={commissionLab}
          onClose={() => setCommissionLab(null)}
          onConfirm={handleCommissionPayment}
        />
      )}

      {/* Confirmation Modal for Pending Lab Activation */}
      {confirmingLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Confirm Facility Activation</h3>
                  <p className="text-[11px] text-slate-400">Grant live operational network license</p>
                </div>
              </div>

              <button
                onClick={() => { setConfirmingLab(null); setCodeError(''); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-teal-300 text-sm">{confirmingLab.name}</div>
              <div className="text-slate-400">{confirmingLab.location || 'Central Facility'} • {confirmingLab.phone || 'Standard Line'}</div>
              <div className="text-slate-300">
                Selected Pricing Model: <strong className="text-white">{confirmingLab.pricingModel === 'flat_subscription' ? `Monthly Subscription (${confirmingLab.subscriptionTier || 'Small'})` : 'Pay-Per-Test Commission (500 FCFA/test)'}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setConfirmingLab(null); setCodeError(''); }}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmLabActivation()}
                disabled={processingAction}
                className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{processingAction ? 'Activating...' : 'Approve & Activate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Plan Switch Approval */}
      {confirmingPlanRequestLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Approve Plan Model Switch</h3>
                  <p className="text-[11px] text-slate-400">Super Administrator Authorization</p>
                </div>
              </div>

              <button
                onClick={() => { setConfirmingPlanRequestLab(null); setCodeError(''); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-white text-sm">{confirmingPlanRequestLab.name}</div>
              <div className="text-slate-400">Current Plan: <span className="text-slate-200 font-bold">{confirmingPlanRequestLab.pricingModel}</span></div>
              <div className="text-teal-300 font-bold">New Requested Plan: {confirmingPlanRequestLab.requestedPricingModel} ({confirmingPlanRequestLab.requestedSubscriptionTier || 'Small'})</div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setConfirmingPlanRequestLab(null); setCodeError(''); }}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApprovePlanChange()}
                disabled={processingAction}
                className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{processingAction ? 'Updating...' : 'Confirm Plan Switch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      <LabRegistrationModal 
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        onLabCreated={() => fetchNetworkStats()}
      />
    </div>
  );
};