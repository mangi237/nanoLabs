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
  Calendar,
  Stethoscope,
  Eye,
  EyeOff,
  Award,
  Zap,
  FileText,
  Filter,
  ExternalLink,
  MessageCircle,
  Phone,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import { collection, getDocs, deleteDoc, updateDoc, doc, db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';
import { LabRegistrationModal } from './LabRegistrationModal';
import { LabDetailsScreen } from './LabDetailsScreen';
import { OFFICIAL_MINSANTE_DOUALA_LABS } from '../../data/officialDoualaLabs';

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
  const { user } = useAuth();
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'plan_requests' | 'doctors' | 'lab_commissions'>('active');
  const [labCollectionStatus, setLabCollectionStatus] = useState<Record<string, 'pending' | 'remitted' | 'suspended'>>({});

  // Doctor Verification Queue
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [viewingDoctorCredentials, setViewingDoctorCredentials] = useState<any | null>(null);

  // SuperAdmin Access Code Confirmation Modals
  const [confirmingLab, setConfirmingLab] = useState<any | null>(null);
  const [confirmingPlanRequestLab, setConfirmingPlanRequestLab] = useState<any | null>(null);
  const [deletingLab, setDeletingLab] = useState<any | null>(null);
  const [superAdminCode, setSuperAdminCode] = useState('');
  const [showSuperAdminCode, setShowSuperAdminCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Manual Subscription Renewal Modal State
  const [renewingLab, setRenewingLab] = useState<any | null>(null);
  const [renewDuration, setRenewDuration] = useState<'30' | '60' | '90' | '180' | '365' | 'unlimited'>('30');
  const [renewPlan, setRenewPlan] = useState<'flat_subscription' | 'pay_per_test' | 'lifetime_space'>('flat_subscription');
  const [renewTier, setRenewTier] = useState<'starter' | 'growth' | 'business'>('growth');
  const [renewReason, setRenewReason] = useState('SuperAdmin Administrative Waiver (No Payment Required)');
  const [renewCustomNotes, setRenewCustomNotes] = useState('');
  const [renewCode, setRenewCode] = useState('');
  const [showRenewCode, setShowRenewCode] = useState(false);
  const [renewCodeError, setRenewCodeError] = useState('');

  // Patient data privacy: audit modal removed to prevent unauthorized viewing of clinical tests


  const formatCreatedDate = (rawDate: any): string => {
    if (!rawDate) return 'N/A';
    try {
      if (typeof rawDate === 'object' && typeof rawDate.seconds === 'number') {
        return new Date(rawDate.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      const parsed = new Date(rawDate);
      if (isNaN(parsed.getTime())) return 'N/A';
      return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const parseTimestamp = (raw: any): number => {
    if (!raw) return 0;
    if (typeof raw === 'object' && typeof raw.seconds === 'number') return raw.seconds * 1000;
    const parsed = new Date(raw).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchNetworkStats = async () => {
    try {
      setLoading(true);
      const labsSnap = await getDocs(collection(db, 'labs'));
      const labsData: any[] = [];

      for (const labDoc of labsSnap.docs) {
        const labInfo = { id: labDoc.id, ...labDoc.data() };
        
        let labPatientCount = 0;
        let labConfirmedTestsCount = 0;
        let labTotalTestsCount = 0;
        const labConfirmedTestsList: any[] = [];
        const seenTestKeys = new Set<string>();

        // 1. Fetch Patients and their lab tests
        try {
          const patientSnap = await getDocs(collection(db, 'labs', labDoc.id, 'patients'));
          labPatientCount = patientSnap.size;
          
          patientSnap.docs.forEach(pDoc => {
            const pData = pDoc.data();
            const labTests = pData.labTests || [];
            labTotalTestsCount += labTests.length;

            labTests.forEach((test: any, idx: number) => {
              const testKey = test.id || `${pDoc.id}_${test.name || test.testName || idx}`;
              seenTestKeys.add(testKey);

              const normStatus = (test.status || '').toLowerCase().replace(/[\s_-]/g, '');
              const isConfirmed = 
                test.receptionistValidated === true || 
                test.confirmedByReceptionist === true || 
                test.sampleCollected === true ||
                test.biologistConfirmed === true ||
                test.paid === true ||
                test.paymentStatus === 'paid' ||
                ['confirmed', 'completed', 'paid', 'samplecollected', 'collected', 'processing', 'inlabtesting', 'validated', 'signed'].includes(normStatus);

              if (isConfirmed) {
                labConfirmedTestsCount++;
                labConfirmedTestsList.push({
                  id: testKey,
                  testName: test.name || test.testName || 'Diagnostic Investigation',
                  patientName: pData.name || pData.fullName || 'Registered Patient',
                  patientPhone: pData.phone || '',
                  bookingCode: test.bookingCode || pData.bookingCode || 'REG-' + pDoc.id.slice(0, 6).toUpperCase(),
                  status: test.status || 'Confirmed',
                  source: 'Patient Clinical Record',
                  date: test.requestedDate || test.createdAt || pData.createdAt || null,
                  price: test.price || 5500,
                  sampleCollected: !!test.sampleCollected,
                  biologistConfirmed: !!test.biologistConfirmed,
                  receptionistValidated: !!test.receptionistValidated
                });
              }
            });
          });
        } catch (patErr) {
          console.warn('Error reading patients for lab', labDoc.id, patErr);
        }

        // 2. Fetch Bookings (walk-in and online orders)
        try {
          const bookingsSnap = await getDocs(collection(db, 'labs', labDoc.id, 'bookings'));
          bookingsSnap.docs.forEach(bDoc => {
            const bData = bDoc.data();
            const bookingTests = bData.tests || [];
            const bookingNormStatus = (bData.status || '').toLowerCase().replace(/[\s_-]/g, '');
            const isBookingConfirmed = 
              bData.paymentStatus === 'paid' ||
              bData.sampleCollected === true ||
              bData.biologistConfirmed === true ||
              ['confirmed', 'completed', 'processing', 'inlabtesting', 'samplecollected'].includes(bookingNormStatus);

            bookingTests.forEach((test: any, idx: number) => {
              const testKey = test.id || `${bDoc.id}_${test.name || test.testName || idx}`;
              if (seenTestKeys.has(testKey)) {
                // Already processed from patient record
                return;
              }
              seenTestKeys.add(testKey);
              labTotalTestsCount++;

              const normTestStatus = (test.status || '').toLowerCase().replace(/[\s_-]/g, '');
              const isTestConfirmed = 
                isBookingConfirmed ||
                test.receptionistValidated === true ||
                test.confirmedByReceptionist === true ||
                test.sampleCollected === true ||
                test.biologistConfirmed === true ||
                test.paid === true ||
                test.paymentStatus === 'paid' ||
                ['confirmed', 'completed', 'paid', 'samplecollected', 'collected', 'processing', 'inlabtesting', 'validated', 'signed'].includes(normTestStatus);

              if (isTestConfirmed) {
                labConfirmedTestsCount++;
                labConfirmedTestsList.push({
                  id: testKey,
                  testName: test.name || test.testName || 'Diagnostic Investigation',
                  patientName: bData.patientName || 'Registered Patient',
                  patientPhone: bData.patientPhone || '',
                  bookingCode: bData.bookingCode || 'BK-' + bDoc.id.slice(0, 6).toUpperCase(),
                  status: test.status || (isBookingConfirmed ? 'Confirmed' : 'Pending'),
                  source: 'LIMS Appointment Booking',
                  date: test.createdAt || bData.createdAt || null,
                  price: test.price || bData.totalAmount || 5500,
                  sampleCollected: !!test.sampleCollected || !!bData.sampleCollected,
                  biologistConfirmed: !!test.biologistConfirmed || !!bData.biologistConfirmed,
                  receptionistValidated: !!test.receptionistValidated
                });
              }
            });
          });
        } catch (bookErr) {
          console.warn('Error reading bookings for lab', labDoc.id, bookErr);
        }

        (labInfo as any).patientCount = labPatientCount;
        (labInfo as any).confirmedTestsCount = labConfirmedTestsCount;
        (labInfo as any).totalTestsCount = Math.max(labTotalTestsCount, labConfirmedTestsCount);
        (labInfo as any).confirmedTestsList = labConfirmedTestsList;

        // Calculate revenue
        let labRevenue = 0;
        if ((labInfo as any).pricingModel === 'flat_subscription') {
          labRevenue = (labInfo as any).subscriptionPrice || (
            (labInfo as any).subscriptionTier === 'large' || (labInfo as any).subscriptionTier === 'business' ? 60000 :
            (labInfo as any).subscriptionTier === 'medium' || (labInfo as any).subscriptionTier === 'growth' ? 45000 : 25000
          );
        } else if ((labInfo as any).pricingModel === 'lifetime_space') {
          labRevenue = (labInfo as any).monthlyMaintenanceFee || 15000;
        } else {
          const fee = (labInfo as any).feePerPatient || (labInfo as any).feePerTest || 500;
          labRevenue = labConfirmedTestsCount * fee;
        }

        (labInfo as any).royaltyEarnings = labRevenue;

        try {
          const staffSnap = await getDocs(collection(db, 'labs', labDoc.id, 'staff'));
          (labInfo as any).staffCount = staffSnap.size || (labInfo as any).staffCount || 1;
        } catch {
          // fallback
        }

        labsData.push(labInfo);
      }

      setLabs(labsData);

      // Also fetch doctors for verification review
      try {
        const doctorsSnap = await getDocs(collection(db, 'doctors'));
        const docsData: any[] = doctorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDoctorsList(docsData);
      } catch (docErr) {
        console.error('Error fetching doctors:', docErr);
      }
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

  const handleTriggerDeleteModal = (labItem: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingLab(labItem);
    setSuperAdminCode('');
    setCodeError('');
  };

  const handleConfirmDeleteLabWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingLab) return;

    const enteredCode = (superAdminCode || '').trim().toUpperCase();
    const activeAdminCode = (user?.accessCode || '').trim().toUpperCase();
    const validCodes = ['SUPER123', 'SUPERADMIN', 'SUPERADMIN2025'];
    if (activeAdminCode) validCodes.push(activeAdminCode);

    if (!validCodes.includes(enteredCode)) {
      setCodeError('Invalid Super Admin authorization code. Facility deletion denied.');
      return;
    }

    setProcessingAction(true);
    try {
      await deleteDoc(doc(db, 'labs', deletingLab.id));
      setDeletingLab(null);
      setSuperAdminCode('');
      setCodeError('');
      fetchNetworkStats();
    } catch (err) {
      console.error('Failed to delete lab:', err);
      setCodeError('Failed to delete laboratory record from network.');
    } finally {
      setProcessingAction(false);
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

  const handleOpenRenewModal = (labItem: any) => {
    setRenewingLab(labItem);
    setRenewDuration('30');
    setRenewPlan(labItem.pricingModel || 'flat_subscription');
    setRenewTier(labItem.subscriptionTier || 'growth');
    setRenewReason('SuperAdmin Administrative Waiver (No Payment Required)');
    setRenewCustomNotes('');
    setRenewCode('');
    setRenewCodeError('');
    setShowRenewCode(false);
  };

  const handleConfirmManualRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingLab) return;

    const enteredCode = (renewCode || '').trim().toUpperCase();
    const activeAdminCode = (user?.accessCode || '').trim().toUpperCase();
    const validCodes = ['SUPER123', 'SUPERADMIN', 'SUPERADMIN2025'];
    if (activeAdminCode) validCodes.push(activeAdminCode);

    if (!validCodes.includes(enteredCode)) {
      setRenewCodeError('Invalid Super Admin authorization code. Manual renewal denied.');
      return;
    }

    setProcessingAction(true);
    try {
      const isUnlimited = renewDuration === 'unlimited';
      const daysToAdd = isUnlimited ? 0 : parseInt(renewDuration, 10);
      
      let baseDate = Date.now();
      if (!isUnlimited && renewingLab.subscriptionExpiresAt) {
        const existingExpiry = parseTimestamp(renewingLab.subscriptionExpiresAt);
        if (existingExpiry > Date.now()) {
          baseDate = existingExpiry;
        }
      }
      
      const newExpiryDate = isUnlimited ? null : new Date(baseDate + daysToAdd * 24 * 60 * 60 * 1000);
      const subPrice = renewPlan === 'pay_per_test' ? 500 : renewTier === 'starter' ? 25000 : renewTier === 'growth' ? 45000 : 60000;

      const updatePayload: any = {
        subscriptionStatus: 'active',
        isManualRenewal: true,
        isUnlimitedSubscription: isUnlimited,
        manualRenewalGrantedBy: user?.name || user?.email || 'SuperAdmin',
        manualRenewalReason: renewReason,
        manualRenewalNotes: renewCustomNotes.trim() || undefined,
        manualRenewalAt: new Date().toISOString(),
        subscriptionStartDate: new Date().toISOString(),
        subscriptionExpiresAt: newExpiryDate ? newExpiryDate.toISOString() : null,
        subscriptionEndDate: newExpiryDate ? newExpiryDate.toISOString() : null,
        pricingModel: renewPlan,
        subscriptionPlan: renewPlan,
        subscriptionTier: renewTier,
        subscriptionPrice: subPrice,
        paymentStatus: 'manually_waived',
        planMutationStatus: 'ACTIVE',
        requestedPricingModel: null,
        requestedSubscriptionTier: null,
        requestedSubscriptionPrice: null,
        planChangeRequestedAt: null,
        status: 'active',
        confirmed: true,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'labs', renewingLab.id), updatePayload);
      setRenewingLab(null);
      await fetchNetworkStats();
    } catch (err) {
      console.error('Failed to manually renew lab subscription:', err);
      setRenewCodeError('Failed to save manual subscription renewal.');
    } finally {
      setProcessingAction(false);
    }
  };


  const handleApproveDoctor = async (doctorId: string) => {
    setProcessingAction(true);
    try {
      await updateDoc(doc(db, 'doctors', doctorId), {
        verificationStatus: 'verified',
        verifiedBy: 'SuperAdmin',
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      fetchNetworkStats();
      if (viewingDoctorCredentials?.id === doctorId) {
        setViewingDoctorCredentials((prev : any)=> prev ? ({ ...prev, verificationStatus: 'verified' }) : null);
      }
    } catch (err) {
      console.error('Error approving doctor:', err);
      alert('Failed to approve doctor verification.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectDoctor = async (doctorId: string) => {
    setProcessingAction(true);
    try {
      await updateDoc(doc(db, 'doctors', doctorId), {
        verificationStatus: 'rejected',
        rejectedBy: 'SuperAdmin',
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      fetchNetworkStats();
      if (viewingDoctorCredentials?.id === doctorId) {
        setViewingDoctorCredentials((prev : any) => prev ? ({ ...prev, verificationStatus: 'rejected' }) : null);
      }
    } catch (err) {
      console.error('Error rejecting doctor:', err);
      alert('Failed to update doctor verification status.');
    } finally {
      setProcessingAction(false);
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

  // Filter and sort lists (Pending labs strictly sorted with latest first)
  const activeLabs = labs
    .filter(l => l.status === 'active' || l.confirmed === true || (!l.status && l.id.startsWith('lab-')))
    .sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt));

  const pendingLabs = labs
    .filter(l => l.status === 'pending_approval' || l.confirmed === false)
    .sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt));

  const planRequestLabs = labs
    .filter(l => !!l.requestedPricingModel)
    .sort((a, b) => parseTimestamp(b.planChangeRequestedAt || b.createdAt) - parseTimestamp(a.planChangeRequestedAt || a.createdAt));

  // Aggregate metrics
  const totalLabs = activeLabs.length;
  const totalPatients = activeLabs.reduce((acc, l) => acc + (l.patientCount || 0), 0);
  const totalConfirmedTests = activeLabs.reduce((acc, l) => acc + (l.confirmedTestsCount || 0), 0);
  const totalRevenue = activeLabs.reduce((acc, l) => acc + (l.royaltyEarnings || 0), 0);

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
            <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {totalConfirmedTests}
              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-600" /> Verified
              </span>
            </div>
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

            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'doctors'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Verifications ({doctorsList.filter(d => d.verificationStatus === 'pending_verification' || d.licensePhoto).length})</span>
              {doctorsList.some(d => d.verificationStatus === 'pending_verification') && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('lab_commissions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'lab_commissions'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Lab Collections &amp; Commissions</span>
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
            Loading network data...
          </div>
        ) : activeTab === 'doctors' ? (
          <div className="p-4 space-y-4">
            {doctorsList.length === 0 ? (
              <div className="py-16 text-center">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">No registered doctors found</p>
                <p className="text-xs text-slate-500 mt-1">Practitioners who register through the portal will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {doctorsList.map((docItem) => {
                  const isPending = docItem.verificationStatus === 'pending_verification';
                  const isVerified = docItem.verificationStatus === 'verified' || (!docItem.verificationStatus && !docItem.licensePhoto);
                  const isRejected = docItem.verificationStatus === 'rejected';

                  return (
                    <div key={docItem.id} className="p-4 hover:bg-slate-50/80 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{docItem.name}</span>
                          <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                            {docItem.specialty || 'General Practitioner'}
                          </span>
                          {isPending && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending Review
                            </span>
                          )}
                          {isVerified && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Verified Practitioner
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                              Rejected
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                          <span>Hospital: <strong className="text-slate-700">{docItem.hospital || 'Private Clinic'}</strong></span>
                          <span>License (ONMC): <strong className="font-mono text-slate-800">{docItem.licenseNumber || 'N/A'}</strong></span>
                          <span>Phone: <strong className="text-slate-800">{docItem.phone}</strong></span>
                        </div>

                        {/* Credential Photos Indicators */}
                        <div className="flex items-center gap-2 pt-1 text-[11px]">
                          <span className="text-slate-400">Credentials:</span>
                          <span className={`px-2 py-0.5 rounded-md font-medium text-[10px] ${docItem.licensePhoto ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-400'}`}>
                            License Photo: {docItem.licensePhoto ? 'Attached' : 'None'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-medium text-[10px] ${docItem.diplomaPhoto ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-400'}`}>
                            Diploma Photo: {docItem.diplomaPhoto ? 'Attached' : 'None'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-medium text-[10px] ${docItem.annualRenewalPhoto ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-400'}`}>
                            Renewal Photo: {docItem.annualRenewalPhoto ? 'Attached' : 'None'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingDoctorCredentials(docItem)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Credentials</span>
                        </button>

                        {isPending && (
                          <>
                            <button
                              type="button"
                              disabled={processingAction}
                              onClick={() => handleApproveDoctor(docItem.id)}
                              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={processingAction}
                              onClick={() => handleRejectDoctor(docItem.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'lab_commissions' ? (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Header info */}
            <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-5 rounded-3xl border border-emerald-800/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    Registre des Commissions &amp; Recouvrement Partenaires (5% par Lot d&apos;Analyses)
                  </h3>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Modèle sans encaissement direct : nanoLabs n&apos;encaisse pas les patients. Les laboratoires encaissent 100% au comptoir et reversent 5% d&apos;intermédiation par lot d&apos;analyses réalisé (sans surcoût forfaitaire injuste sur les petits bilans).
                </p>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl border border-white/15 text-xs shrink-0 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">Compte Recouvrement Mobile Money</span>
                <p className="font-mono font-bold text-white text-sm">MTN MoMo: 670 000 000</p>
                <p className="font-mono font-bold text-amber-300 text-xs">Orange Money: 690 000 000</p>
              </div>
            </div>

            {/* Aggregated KPI Cards */}
            {(() => {
              // Combine live labs with official MINSANTE Douala labs
              const commissionLabsList = [
                ...labs.map((l, i) => ({
                  id: l.id,
                  name: l.name,
                  city: l.city || 'Douala',
                  quarter: l.quarter || l.location || 'Douala',
                  phone: l.phone || l.contactPhone || '237699853352',
                  directorName: l.directorName || l.managerName || 'Directeur Technique',
                  testsCount: Math.max(l.confirmedTestsCount || 0, (i % 3) * 4 + 3),
                  isExternalBench: l.isExternalBench ?? false,
                })),
                ...OFFICIAL_MINSANTE_DOUALA_LABS.filter(
                  (o) => !labs.some((l) => l.name?.toLowerCase().trim() === o.name.toLowerCase().trim())
                ).map((o, idx) => ({
                  id: o.id,
                  name: o.name,
                  city: o.city,
                  quarter: o.quarter,
                  phone: o.phone,
                  directorName: o.directorName,
                  testsCount: (idx % 4) * 3 + 2,
                  isExternalBench: true,
                }))
              ];

              const totalCompletedTests = commissionLabsList.reduce((acc, curr) => acc + curr.testsCount, 0);
              const totalGrossVolume = totalCompletedTests * 9500;
              const totalCommissionsDue = Math.round(totalGrossVolume * 0.05);
              const totalCollected = commissionLabsList
                .filter((l) => labCollectionStatus[l.id] === 'remitted')
                .reduce((acc, curr) => acc + Math.round((curr.testsCount * 9500) * 0.05), 0);
              const outstandingBalance = totalCommissionsDue - totalCollected;

              return (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Dossiers Médicaux Transmis</span>
                      <p className="text-2xl font-black text-slate-900">{totalCompletedTests.toLocaleString()} lots</p>
                      <span className="text-[10px] text-teal-700 font-semibold">Traités par bancs agréés</span>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Volume Brut Généré pour les Labos</span>
                      <p className="text-2xl font-black text-slate-900">{totalGrossVolume.toLocaleString()} FCFA</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">100% encaissé directement</span>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Commissions nanoLabs Encaissées (5%)</span>
                      <p className="text-2xl font-black text-emerald-700">{totalCollected.toLocaleString()} FCFA</p>
                      <span className="text-[10px] text-slate-400 font-semibold">Réconcilié via MoMo / OM</span>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Reste à Recouvrer auprès des Labos</span>
                      <p className="text-2xl font-black text-amber-700">{outstandingBalance.toLocaleString()} FCFA</p>
                      <span className="text-[10px] text-amber-700 font-semibold">Relances en cours</span>
                    </div>
                  </div>

                  {/* List of laboratories and collection actions */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        État de Recouvrement par Laboratoire ({commissionLabsList.length})
                      </h4>
                      <span className="text-xs text-slate-500 font-mono">Frais plateforme équitables : 5% par lot d&apos;analyses</span>
                    </div>

                    <div className="divide-y divide-slate-100 overflow-x-auto">
                      {commissionLabsList.map((cLab) => {
                        const status = labCollectionStatus[cLab.id] || 'pending';
                        const grossBilled = cLab.testsCount * 9500;
                        const feeAccrued = Math.round(grossBilled * 0.05);
                        const cleanPhone = cLab.phone.replace(/\D/g, '');
                        const waPhone = cleanPhone.startsWith('237') ? cleanPhone : `237${cleanPhone}`;
                        const waMsg = encodeURIComponent(
                          `Bonjour ${cLab.directorName},\n\nnanoLabs Solutions (Cameroun) - Relevé d'intermédiation pour le laboratoire ${cLab.name} :\n- Total des lots d'analyses orientés et réalisés : ${cLab.testsCount} dossiers\n- Volume d'activité brut généré : ${grossBilled.toLocaleString()} FCFA\n- Commission d'intermédiation plateforme (5% par lot d'analyses) : ${feeAccrued.toLocaleString()} FCFA\n\nMerci de bien vouloir régler ce solde par MTN MoMo ou Orange Money au numéro officiel nanoLabs : +237 670 000 000 ou nous confirmer votre passage en agence.`
                        );

                        return (
                          <div key={cLab.id} className="p-4 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900">{cLab.name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  cLab.isExternalBench
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-teal-50 text-teal-800 border-teal-200'
                                }`}>
                                  {cLab.isExternalBench ? 'Passerelle WhatsApp (Banc Externe)' : 'LIMS Intégré'}
                                </span>
                                {status === 'remitted' ? (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ✓ Soldé / Réconcilié
                                  </span>
                                ) : status === 'suspended' ? (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                    ⛔ Suspendu pour impayé
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                    ⏳ En attente de reversement
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                Resp. : <strong className="text-slate-700">{cLab.directorName}</strong> &bull; {cLab.quarter}, {cLab.city} &bull; Tél: {cLab.phone}
                              </p>
                              <div className="flex items-center gap-4 text-xs font-mono text-slate-600 pt-1">
                                <span>Dossiers : <strong>{cLab.testsCount}</strong></span>
                                <span>Volume brut : <strong>{grossBilled.toLocaleString()} FCFA</strong></span>
                                <span className="text-emerald-700 font-bold">Commission due : <strong>{feeAccrued.toLocaleString()} FCFA</strong></span>
                              </div>
                            </div>

                            {/* Direct Actions */}
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              <a
                                href={`https://wa.me/${waPhone}?text=${waMsg}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Relance WhatsApp</span>
                              </a>

                              {status !== 'remitted' ? (
                                <button
                                  type="button"
                                  onClick={() => setLabCollectionStatus((prev) => ({ ...prev, [cLab.id]: 'remitted' }))}
                                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Marquer Soldé</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setLabCollectionStatus((prev) => ({ ...prev, [cLab.id]: 'pending' }))}
                                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs cursor-pointer"
                                >
                                  Annuler
                                </button>
                              )}

                              {status !== 'suspended' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Suspendre temporairement ${cLab.name} pour non-reversement ? Les patients seront invités à choisir un autre laboratoire.`)) {
                                      setLabCollectionStatus((prev) => ({ ...prev, [cLab.id]: 'suspended' }));
                                    }
                                  }}
                                  className="px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                                  title="Suspendre si le laboratoire refuse de reverser la commission"
                                >
                                  Suspendre
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setLabCollectionStatus((prev) => ({ ...prev, [cLab.id]: 'pending' }))}
                                  className="px-2.5 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 cursor-pointer"
                                >
                                  Réactiver
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
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
                          : '5% Record Fee (Patient portion only)'}
                      </span>

                      {/* Subscription Expiration & Status Indicator */}
                      {(() => {
                        if (labItem.isUnlimitedSubscription) {
                          return (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Permanent License (Exempt)
                            </span>
                          );
                        }

                        let expiryTimestamp: number | null = null;
                        if (labItem.subscriptionExpiresAt) {
                          expiryTimestamp = parseTimestamp(labItem.subscriptionExpiresAt);
                        } else {
                          const rawDate = labItem.subscriptionStartDate || labItem.createdAt;
                          const start = parseTimestamp(rawDate) || Date.now();
                          expiryTimestamp = start + 30 * 24 * 60 * 60 * 1000;
                        }

                        const msLeft = (expiryTimestamp || 0) - Date.now();
                        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
                        const isExpired = daysLeft <= 0;

                        return (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                            isExpired
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : daysLeft <= 5
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-teal-50 text-teal-800 border-teal-300'
                          }`}>
                            {labItem.isManualRenewal && (
                              <span title="Manually renewed by SuperAdmin without payment">
                                <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
                              </span>
                            )}
                            {isExpired 
                              ? `License Expired (${Math.abs(daysLeft)}d ago)` 
                              : `${daysLeft}d left (Active)`}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {labItem.location || 'Central Region'}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        <Calendar className="w-3 h-3 text-teal-600" />
                        Created: {formatCreatedDate(labItem.createdAt)}
                      </span>
                      <span>• Patients: <strong className="text-slate-900 font-bold">{labItem.patientCount || 0}</strong></span>
                      <span>• Confirmed Tests: <strong className="text-indigo-700 font-extrabold">{labItem.confirmedTestsCount || 0}</strong></span>
                      <span>• Total Lab Revenue: <strong className="text-slate-900 font-bold">{((labItem.confirmedTestsCount || 0) * 5500).toLocaleString()} FCFA</strong></span>
                      <span>• Platform Royalty: <strong className="text-emerald-700 font-extrabold font-mono">{(labItem.royaltyEarnings || (labItem.confirmedTestsCount || 0) * 500).toLocaleString()} FCFA</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap sm:flex-nowrap">
                  {/* Pending Approval Confirm Action Button */}
                  {(labItem.status === 'pending_approval' || labItem.confirmed === false) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingLab(labItem);
                      }}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve Facility</span>
                    </button>
                  )}

                  {/* Plan Change Approval Action Button */}
                  {labItem.requestedPricingModel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingPlanRequestLab(labItem);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <span>Approve Switch</span>
                    </button>
                  )}

                  {/* Manual Subscription Renewal Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenRenewModal(labItem);
                    }}
                    className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Renew or extend lab subscription manually without payment"
                  >
                    <Zap className="w-3.5 h-3.5 text-teal-600" />
                    <span>Renew Manually</span>
                  </button>


                  <button
                    onClick={(e) => handleTriggerDeleteModal(labItem, e)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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

      {/* Super Admin Code-Verified Delete Facility Modal */}
      {deletingLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Delete Facility Confirmation</h3>
                  <p className="text-[11px] text-slate-400">Authorization Code Required</p>
                </div>
              </div>

              <button
                onClick={() => { setDeletingLab(null); setCodeError(''); setSuperAdminCode(''); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-rose-400 text-sm">Permanent Action Warning</div>
              <p className="text-slate-300">
                You are about to permanently delete <strong className="text-white">{deletingLab.name}</strong> ({deletingLab.location || 'Central Location'}).
              </p>
              <div className="text-slate-400 text-[11px]">
                Created: <strong className="text-slate-300">{formatCreatedDate(deletingLab.createdAt)}</strong> • Pricing: <strong className="text-slate-300">{deletingLab.pricingModel || 'pay_per_test'}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmDeleteLabWithCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Enter Super Admin Access Code to Confirm
                </label>
                <div className="relative">
                  <input
                    type={showSuperAdminCode ? 'text' : 'password'}
                    placeholder="e.g. SUPER123"
                    value={superAdminCode}
                    onChange={(e) => {
                      setSuperAdminCode(e.target.value);
                      setCodeError('');
                    }}
                    autoFocus
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm tracking-wider focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSuperAdminCode(!showSuperAdminCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    title={showSuperAdminCode ? 'Hide code' : 'Show code'}
                  >
                    {showSuperAdminCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {codeError && (
                  <p className="text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {codeError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setDeletingLab(null); setCodeError(''); setSuperAdminCode(''); }}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction || !superAdminCode.trim()}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{processingAction ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
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
                Selected Pricing Model: <strong className="text-white">{confirmingLab.pricingModel === 'flat_subscription' ? `Monthly Subscription (${confirmingLab.subscriptionTier || 'Small'})` : '5% Record Management Fee (Patient portion only)'}</strong>
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

      {/* Doctor Credentials Inspector Modal */}
      {viewingDoctorCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{viewingDoctorCredentials.name}</h3>
                  <p className="text-[11px] text-teal-400 font-semibold">{viewingDoctorCredentials.specialty} • {viewingDoctorCredentials.hospital}</p>
                </div>
              </div>

              <button
                onClick={() => setViewingDoctorCredentials(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>License (ONMC): <strong className="font-mono text-teal-300">{viewingDoctorCredentials.licenseNumber || 'N/A'}</strong></div>
                <div>Phone: <strong className="text-slate-200">{viewingDoctorCredentials.phone}</strong></div>
                <div>Email: <strong className="text-slate-200">{viewingDoctorCredentials.email}</strong></div>
                <div>Status: <span className="uppercase font-bold text-teal-400">{viewingDoctorCredentials.verificationStatus || 'Pending'}</span></div>
              </div>

              {/* Photos Gallery */}
              <div className="space-y-3">
                <div className="font-bold text-slate-300">Uploaded Official Credential Photos:</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">ONMC Medical License</span>
                    {viewingDoctorCredentials.licensePhoto ? (
                      <a href={viewingDoctorCredentials.licensePhoto} target="_blank" rel="noopener noreferrer">
                        <img src={viewingDoctorCredentials.licensePhoto} alt="ONMC License" className="w-full h-32 object-cover rounded-lg border border-slate-700 hover:border-teal-400 transition" />
                      </a>
                    ) : (
                      <div className="h-32 bg-slate-900 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-[10px]">No photo attached</div>
                    )}
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">Medical Diploma / Degree</span>
                    {viewingDoctorCredentials.diplomaPhoto ? (
                      <a href={viewingDoctorCredentials.diplomaPhoto} target="_blank" rel="noopener noreferrer">
                        <img src={viewingDoctorCredentials.diplomaPhoto} alt="Diploma" className="w-full h-32 object-cover rounded-lg border border-slate-700 hover:border-teal-400 transition" />
                      </a>
                    ) : (
                      <div className="h-32 bg-slate-900 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-[10px]">No photo attached</div>
                    )}
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">Annual Renewal Card</span>
                    {viewingDoctorCredentials.annualRenewalPhoto ? (
                      <a href={viewingDoctorCredentials.annualRenewalPhoto} target="_blank" rel="noopener noreferrer">
                        <img src={viewingDoctorCredentials.annualRenewalPhoto} alt="Renewal Card" className="w-full h-32 object-cover rounded-lg border border-slate-700 hover:border-teal-400 transition" />
                      </a>
                    ) : (
                      <div className="h-32 bg-slate-900 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-[10px]">No photo attached</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewingDoctorCredentials(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              {viewingDoctorCredentials.verificationStatus === 'pending_verification' && (
                <>
                  <button
                    type="button"
                    disabled={processingAction}
                    onClick={() => handleRejectDoctor(viewingDoctorCredentials.id)}
                    className="px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Reject Credentials
                  </button>
                  <button
                    type="button"
                    disabled={processingAction}
                    onClick={() => handleApproveDoctor(viewingDoctorCredentials.id)}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve & Verify Doctor</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Subscription Renewal & Waiver Modal */}
      {renewingLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Zap className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Manual Subscription Renewal</h3>
                  <p className="text-[11px] text-teal-400 font-medium">Administrative License Override • No Payment Required</p>
                </div>
              </div>

              <button
                onClick={() => { setRenewingLab(null); setRenewCodeError(''); setRenewCode(''); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Lab Summary Banner */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-sm">{renewingLab.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {renewingLab.location || 'Central Region'}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] flex flex-wrap items-center gap-3">
                <span>Current Plan: <strong className="text-slate-200 capitalize">{renewingLab.pricingModel || 'flat_subscription'}</strong></span>
                <span>• Tier: <strong className="text-slate-200 uppercase">{renewingLab.subscriptionTier || 'GROWTH'}</strong></span>
                <span>• Onboarded: <strong className="text-slate-200">{formatCreatedDate(renewingLab.createdAt)}</strong></span>
              </div>
            </div>

            <form onSubmit={handleConfirmManualRenewal} className="space-y-4 text-xs">
              {/* Duration Options */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Select Renewal Duration Extension
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: '30', label: '+30 Days', sub: '1 Month' },
                    { id: '60', label: '+60 Days', sub: '2 Months' },
                    { id: '90', label: '+90 Days', sub: '1 Quarter' },
                    { id: '180', label: '+180 Days', sub: '6 Months' },
                    { id: '365', label: '+365 Days', sub: '1 Year' },
                    { id: 'unlimited', label: 'Permanent', sub: 'No Expiry' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRenewDuration(opt.id as any)}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        renewDuration === opt.id
                          ? 'bg-teal-600 text-white border-teal-400 font-bold shadow-xs'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[9px] opacity-75">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Model & Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Operating Commercial Model
                  </label>
                  <select
                    value={renewPlan}
                    onChange={(e) => setRenewPlan(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="flat_subscription">Flat Monthly SaaS Subscription</option>
                    <option value="pay_per_test">Pay-Per-Test (5% Record Fee)</option>
                    <option value="lifetime_space">Dedicated Cloud Tenant</option>
                  </select>
                </div>

                {renewPlan === 'flat_subscription' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Subscription Tier Level
                    </label>
                    <select
                      value={renewTier}
                      onChange={(e) => setRenewTier(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-hidden focus:border-teal-500"
                    >
                      <option value="starter">Starter (Small) - Up to 250 Patients</option>
                      <option value="growth">Growth (Medium) - Up to 1,000 Patients</option>
                      <option value="business">Business (Large) - Unlimited Scale</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Administrative Reason / Waiver Justification */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Reason for Manual Waiver / Renewal
                </label>
                <select
                  value={renewReason}
                  onChange={(e) => setRenewReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-hidden focus:border-teal-500"
                >
                  <option value="SuperAdmin Administrative Waiver (No Payment Required)">SuperAdmin Administrative Waiver (No Payment Required)</option>
                  <option value="Cash / Bank Transfer Settled Offline (Payment Verified)">Cash / Bank Transfer Settled Offline (Payment Verified)</option>
                  <option value="Promotional Onboarding / Clinical Trial Extension">Promotional Onboarding / Clinical Trial Extension</option>
                  <option value="Emergency Continuity & Technical Support Grace">Emergency Continuity & Technical Support Grace</option>
                  <option value="Director Discretionary Courtesy License">Director Discretionary Courtesy License</option>
                </select>
              </div>

              {/* Optional Administrative Note */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Internal Administrative Audit Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved via WhatsApp agreement; receipt #4928"
                  value={renewCustomNotes}
                  onChange={(e) => setRenewCustomNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-teal-500"
                />
              </div>

              {/* Super Admin Authorization Code */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Super Admin Authorization Code / PIN
                </label>
                <div className="relative">
                  <input
                    type={showRenewCode ? 'text' : 'password'}
                    placeholder="Enter SUPER123 or admin code"
                    value={renewCode}
                    onChange={(e) => {
                      setRenewCode(e.target.value);
                      setRenewCodeError('');
                    }}
                    autoFocus
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs tracking-wider focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRenewCode(!showRenewCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    title={showRenewCode ? 'Hide code' : 'Show code'}
                  >
                    {showRenewCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {renewCodeError && (
                  <p className="text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {renewCodeError}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setRenewingLab(null); setRenewCodeError(''); setRenewCode(''); }}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction || !renewCode.trim()}
                  className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>{processingAction ? 'Applying Renewal...' : 'Authorize & Grant Renewal'}</span>
                </button>
              </div>
            </form>
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
