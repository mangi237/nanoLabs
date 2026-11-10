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
  ChevronDown,
  ChevronUp,
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
  const [expandedRecoveryLabId, setExpandedRecoveryLabId] = useState<string | null>(null);
  const [recoverySearchQuery, setRecoverySearchQuery] = useState('');
  const [recoveryFilter, setRecoveryFilter] = useState<'all' | 'due' | 'settled'>('all');

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

        const labPaidBookings: any[] = [];
        const seenPaidBookingCodes = new Set<string>();

        // 2. Fetch Bookings (walk-in and online orders)
        try {
          const bookingsSnap = await getDocs(collection(db, 'labs', labDoc.id, 'bookings'));
          bookingsSnap.docs.forEach(bDoc => {
            const bData = bDoc.data();
            const bookingTests = bData.tests || [];
            const bookingNormStatus = (bData.status || '').toLowerCase().replace(/[\s_-]/g, '');
            const isBookingPaid = 
              bData.paymentStatus === 'paid' ||
              bData.paid === true ||
              bData.paymentStatus === 'verified' ||
              bData.invoiceStatus === 'paid' ||
              (typeof bData.actualPaidAmount === 'number' && bData.actualPaidAmount > 0);

            const isBookingConfirmed = 
              isBookingPaid ||
              bData.sampleCollected === true ||
              bData.biologistConfirmed === true ||
              ['confirmed', 'completed', 'processing', 'inlabtesting', 'samplecollected'].includes(bookingNormStatus);

            const bookingCode = bData.bookingCode || 'BK-' + bDoc.id.slice(0, 6).toUpperCase();

            // Strictly collect verified paid dossiers for financial recovery audit
            if (isBookingPaid && !seenPaidBookingCodes.has(bookingCode)) {
              seenPaidBookingCodes.add(bookingCode);
              const mappedTests = (bookingTests || []).map((t: any) => ({
                id: t.id || '',
                name: t.name || t.testName || 'Analyse de laboratoire',
                price: Number(t.price || 0),
                category: t.category || t.testCategory || 'Général'
              }));
              const prelevementFee = Number(bData.prelevementFee || 0);
              const homePickupFee = Number(bData.homePickupFee || 0);
              let grossAmount = Number(bData.totalAmount || bData.actualPaidAmount || bData.price || 0);
              if (grossAmount <= 0) {
                grossAmount = mappedTests.reduce((s: number, t: any) => s + (t.price || 0), 0) + prelevementFee + homePickupFee;
              }
              const platformFee = Math.round(grossAmount * 0.05);

              labPaidBookings.push({
                id: bDoc.id,
                bookingCode,
                patientName: bData.patientName || bData.fullName || 'Patient Enregistré',
                patientPhone: bData.patientPhone || bData.phone || '',
                date: bData.createdAt || bData.appointmentDate || bData.date || null,
                paymentStatus: 'paid',
                paymentMethod: bData.paymentMethod || 'Comptoir Labo (Cash / Mobile Money)',
                tests: mappedTests,
                addOns: bData.addOns || [],
                prelevementFee,
                homePickupFee,
                grossAmount,
                platformFee
              });
            }

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
                  bookingCode,
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

        // Also check client ledger (nanolabs_bookings_ledger / lims_bookings_ledger) for real paid bookings
        try {
          const rawLedger = localStorage.getItem('nanolabs_bookings_ledger') || localStorage.getItem('lims_bookings_ledger');
          if (rawLedger) {
            const list = JSON.parse(rawLedger);
            if (Array.isArray(list)) {
              list.forEach((b: any) => {
                const matches = 
                  b.labId === labDoc.id || 
                  b.labDocId === labDoc.id || 
                  b.selectedLabId === labDoc.id ||
                  (b.labName && (labInfo as any).name && b.labName.toLowerCase().trim() === (labInfo as any).name.toLowerCase().trim());
                if (matches) {
                  const isPaid = 
                    b.paymentStatus === 'paid' ||
                    b.paid === true ||
                    b.paymentStatus === 'verified' ||
                    b.invoiceStatus === 'paid' ||
                    (typeof b.actualPaidAmount === 'number' && b.actualPaidAmount > 0);

                  const bCode = b.bookingCode || ('BK-' + (b.id ? String(b.id).slice(0, 6).toUpperCase() : 'LOCAL'));
                  if (isPaid && !seenPaidBookingCodes.has(bCode)) {
                    seenPaidBookingCodes.add(bCode);
                    const mappedTests = (b.tests || []).map((t: any) => ({
                      id: t.id || '',
                      name: t.name || t.testName || 'Analyse de laboratoire',
                      price: Number(t.price || 0),
                      category: t.category || t.testCategory || 'Général'
                    }));
                    const prelevementFee = Number(b.prelevementFee || 0);
                    const homePickupFee = Number(b.homePickupFee || 0);
                    let grossAmount = Number(b.totalAmount || b.actualPaidAmount || b.price || 0);
                    if (grossAmount <= 0) {
                      grossAmount = mappedTests.reduce((s: number, t: any) => s + (t.price || 0), 0) + prelevementFee + homePickupFee;
                    }
                    const platformFee = Math.round(grossAmount * 0.05);

                    labPaidBookings.push({
                      id: b.id || bCode,
                      bookingCode: bCode,
                      patientName: b.patientName || b.fullName || 'Patient Enregistré',
                      patientPhone: b.patientPhone || b.phone || '',
                      date: b.createdAt || b.date || null,
                      paymentStatus: 'paid',
                      paymentMethod: b.paymentMethod || 'Comptoir Labo (Cash / Mobile Money)',
                      tests: mappedTests,
                      addOns: b.addOns || [],
                      prelevementFee,
                      homePickupFee,
                      grossAmount,
                      platformFee
                    });
                  }
                }
              });
            }
          }
        } catch (localErr) {
          console.warn('Error reading local bookings ledger', localErr);
        }

        (labInfo as any).patientCount = labPatientCount;
        (labInfo as any).confirmedTestsCount = labConfirmedTestsCount;
        (labInfo as any).totalTestsCount = Math.max(labTotalTestsCount, labConfirmedTestsCount);
        (labInfo as any).confirmedTestsList = labConfirmedTestsList;
        (labInfo as any).paidBookings = labPaidBookings;
        (labInfo as any).paidDossiersCount = labPaidBookings.length;
        (labInfo as any).realGrossVolume = labPaidBookings.reduce((sum: number, b: any) => sum + (b.grossAmount || 0), 0);
        (labInfo as any).realCommissionDue = labPaidBookings.reduce((sum: number, b: any) => sum + (b.platformFee || 0), 0);

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
        setViewingDoctorCredentials((prev : any) => prev ? ({ ...prev, verificationStatus: 'verified' }) : null);
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
        setViewingDoctorCredentials((prev : any)=> prev ? ({ ...prev, verificationStatus: 'rejected' }) : null);
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
              // Combine live labs with official MINSANTE Douala labs - using strictly real paid dossiers
              const commissionLabsList = [
                ...labs.map((l) => {
                  const paidList: any[] = l.paidBookings || [];
                  const realGross: number = l.realGrossVolume || paidList.reduce((acc: number, b: any) => acc + (b.grossAmount || 0), 0);
                  const realFee: number = l.realCommissionDue || paidList.reduce((acc: number, b: any) => acc + (b.platformFee || 0), 0);
                  return {
                    id: l.id,
                    name: l.name,
                    city: l.city || 'Douala',
                    quarter: l.quarter || l.location || 'Douala',
                    phone: l.phone || l.contactPhone || '237699853352',
                    directorName: l.directorName || l.managerName || 'Directeur Technique',
                    testsCount: paidList.length,
                    paidBookings: paidList,
                    realGrossVolume: realGross,
                    realCommissionDue: realFee,
                    isExternalBench: l.isExternalBench ?? false,
                  };
                }),
                ...OFFICIAL_MINSANTE_DOUALA_LABS.filter(
                  (o) => !labs.some((l) => l.name?.toLowerCase().trim() === o.name.toLowerCase().trim())
                ).map((o) => {
                  // Check if any real booking in localStorage matches this official external bench
                  const officialPaid: any[] = [];
                  try {
                    const rawLedger = localStorage.getItem('nanolabs_bookings_ledger') || localStorage.getItem('lims_bookings_ledger');
                    if (rawLedger) {
                      const list = JSON.parse(rawLedger);
                      if (Array.isArray(list)) {
                        list.forEach((b: any) => {
                          const matches = 
                            b.selectedLabId === o.id || 
                            b.labId === o.id || 
                            (b.labName && o.name && b.labName.toLowerCase().trim() === o.name.toLowerCase().trim());
                          if (matches) {
                            const isPaid = 
                              b.paymentStatus === 'paid' ||
                              b.paid === true ||
                              b.paymentStatus === 'verified' ||
                              b.invoiceStatus === 'paid' ||
                              (typeof b.actualPaidAmount === 'number' && b.actualPaidAmount > 0);
                            if (isPaid && !officialPaid.some((p) => p.bookingCode === b.bookingCode || p.id === b.id)) {
                              const mappedTests = (b.tests || []).map((t: any) => ({
                                id: t.id || '',
                                name: t.name || t.testName || 'Analyse de laboratoire',
                                price: Number(t.price || 0),
                                category: t.category || t.testCategory || 'Général'
                              }));
                              const prelevementFee = Number(b.prelevementFee || 0);
                              const homePickupFee = Number(b.homePickupFee || 0);
                              let grossAmount = Number(b.totalAmount || b.actualPaidAmount || b.price || 0);
                              if (grossAmount <= 0) {
                                grossAmount = mappedTests.reduce((s: number, t: any) => s + (t.price || 0), 0) + prelevementFee + homePickupFee;
                              }
                              const platformFee = Math.round(grossAmount * 0.05);

                              officialPaid.push({
                                id: b.id || b.bookingCode || 'BK-LOCAL',
                                bookingCode: b.bookingCode || ('BK-' + (b.id ? String(b.id).slice(0, 6).toUpperCase() : 'LOCAL')),
                                patientName: b.patientName || b.fullName || 'Patient Enregistré',
                                patientPhone: b.patientPhone || b.phone || '',
                                date: b.createdAt || b.date || null,
                                paymentStatus: 'paid',
                                paymentMethod: b.paymentMethod || 'Comptoir Labo (Cash / Mobile Money)',
                                tests: mappedTests,
                                addOns: b.addOns || [],
                                prelevementFee,
                                homePickupFee,
                                grossAmount,
                                platformFee
                              });
                            }
                          }
                        });
                      }
                    }
                  } catch (e) {
                    console.warn('Error reading official lab bookings', e);
                  }

                  const realGross = officialPaid.reduce((acc, b) => acc + b.grossAmount, 0);
                  const realFee = officialPaid.reduce((acc, b) => acc + b.platformFee, 0);

                  return {
                    id: o.id,
                    name: o.name,
                    city: o.city,
                    quarter: o.quarter,
                    phone: o.phone,
                    directorName: o.directorName,
                    testsCount: officialPaid.length,
                    paidBookings: officialPaid,
                    realGrossVolume: realGross,
                    realCommissionDue: realFee,
                    isExternalBench: true,
                  };
                })
              ];

              const totalCompletedTests = commissionLabsList.reduce((acc, curr) => acc + curr.testsCount, 0);
              const totalGrossVolume = commissionLabsList.reduce((acc, curr) => acc + curr.realGrossVolume, 0);
              const totalCommissionsDue = commissionLabsList.reduce((acc, curr) => acc + curr.realCommissionDue, 0);
              const totalCollected = commissionLabsList
                .filter((l) => labCollectionStatus[l.id] === 'remitted')
                .reduce((acc, curr) => acc + curr.realCommissionDue, 0);
              const outstandingBalance = Math.max(0, totalCommissionsDue - totalCollected);

              const filteredCommissionLabs = commissionLabsList.filter((l) => {
                const q = recoverySearchQuery.toLowerCase().trim();
                const matchesSearch = !q ||
                  l.name.toLowerCase().includes(q) ||
                  l.directorName.toLowerCase().includes(q) ||
                  l.quarter.toLowerCase().includes(q) ||
                  l.city.toLowerCase().includes(q);

                if (!matchesSearch) return false;

                if (recoveryFilter === 'due') {
                  return l.realCommissionDue > 0 && labCollectionStatus[l.id] !== 'remitted';
                }
                if (recoveryFilter === 'settled') {
                  return l.realCommissionDue === 0 || labCollectionStatus[l.id] === 'remitted';
                }
                return true;
              });

              return (
                <div className="space-y-6">
                  {/* Stats Grid - Strict 100% Real-Time (No mock numbers) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Dossiers Payés Réels</span>
                      <p className="text-2xl font-black text-slate-900">{totalCompletedTests.toLocaleString()} lots</p>
                      <span className="text-[10px] text-teal-700 font-semibold">
                        {totalCompletedTests > 0 ? 'Encaissés au guichet des labos' : 'Aucun test payé à ce jour'}
                      </span>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Volume Brut Réel des Labos</span>
                      <p className="text-2xl font-black text-slate-900">{totalGrossVolume.toLocaleString()} FCFA</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">100% encaissé directement</span>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Commissions nanoLabs Soldées</span>
                      <p className="text-2xl font-black text-emerald-700">{totalCollected.toLocaleString()} FCFA</p>
                      <span className="text-[10px] text-slate-400 font-semibold">Réconcilié via MoMo / OM</span>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Reste à Recouvrer auprès des Labos</span>
                      <p className={`text-2xl font-black ${outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                        {outstandingBalance.toLocaleString()} FCFA
                      </p>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {outstandingBalance > 0 ? '5% par lot d\'analyses réalisé' : 'Comptabilité 100% à jour'}
                      </span>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={recoverySearchQuery}
                        onChange={(e) => setRecoverySearchQuery(e.target.value)}
                        placeholder="Rechercher une structure, responsable ou quartier..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-600"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setRecoveryFilter('all')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                          recoveryFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tous ({commissionLabsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecoveryFilter('due')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                          recoveryFilter === 'due' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        À recouvrer ({commissionLabsList.filter((l) => l.realCommissionDue > 0 && labCollectionStatus[l.id] !== 'remitted').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecoveryFilter('settled')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                          recoveryFilter === 'settled' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        À jour ({commissionLabsList.filter((l) => l.realCommissionDue === 0 || labCollectionStatus[l.id] === 'remitted').length})
                      </button>
                    </div>
                  </div>

                  {/* List of laboratories and collection actions */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          Relevé Audité de Recouvrement par Laboratoire ({filteredCommissionLabs.length})
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Seuls les lots d&apos;analyses réellement payés par les patients génèrent une commission (5% par lot).
                        </p>
                      </div>
                      <span className="text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 font-mono font-bold">
                        Modèle 5% par lot &bull; 0 FCFA forfaitaire
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filteredCommissionLabs.length === 0 ? (
                        <div className="p-12 text-center space-y-2">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                          <p className="text-sm font-bold text-slate-800">Aucune structure ne correspond à votre filtre</p>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Toutes les structures de cette sélection sont à jour ou aucune donnée ne correspond à votre recherche.
                          </p>
                        </div>
                      ) : (
                        filteredCommissionLabs.map((cLab) => {
                          const status = labCollectionStatus[cLab.id] || 'pending';
                          const cleanPhone = cLab.phone.replace(/\D/g, '');
                          const waPhone = cleanPhone.startsWith('237') ? cleanPhone : `237${cleanPhone}`;
                          const isExpanded = expandedRecoveryLabId === cLab.id;

                          let waMsg = '';
                          if (cLab.testsCount > 0) {
                            const dossierDetails = cLab.paidBookings.map((b: any, bIdx: number) => {
                              const testsStr = (b.tests || []).map((t: any) => `${t.name} (${Number(t.price).toLocaleString()} FCFA)`).join(', ');
                              return `${bIdx + 1}. Patient : ${b.patientName} (Ref #${b.bookingCode})\n   - Examens : ${testsStr}\n   - Total encaissé : ${b.grossAmount.toLocaleString()} FCFA\n   - Commission nanoLabs (5%) : ${b.platformFee.toLocaleString()} FCFA`;
                            }).join('\n\n');

                            waMsg = encodeURIComponent(
                              `Bonjour ${cLab.directorName},\n\n` +
                              `nanoLabs Solutions (Cameroun) - Relevé officiel d'intermédiation pour ${cLab.name} :\n\n` +
                              `Nombre de dossiers réalisés et payés au comptoir : ${cLab.testsCount} dossier(s)\n\n` +
                              `Détail audité des dossiers patients :\n${dossierDetails}\n\n` +
                              `-----------------------------------\n` +
                              `Volume brut total encaissé par votre structure : ${cLab.realGrossVolume.toLocaleString()} FCFA\n` +
                              `Commission plateforme (5% par lot d'analyse) due : ${cLab.realCommissionDue.toLocaleString()} FCFA\n\n` +
                              `Modalités de règlement Mobile Money officiel :\n` +
                              `- MTN Mobile Money : 670 000 000\n` +
                              `- Orange Money : 690 000 000\n\n` +
                              `Merci de bien vouloir nous confirmer la référence après transfert.`
                            );
                          } else {
                            waMsg = encodeURIComponent(
                              `Bonjour ${cLab.directorName},\n\n` +
                              `nanoLabs Solutions (Cameroun) - Suivi de partenariat pour ${cLab.name} :\n` +
                              `Votre compte laboratoire est en règle. Aucun dossier en attente de reversement à ce jour (0 FCFA dû).\n\n` +
                              `Merci pour votre collaboration.`
                            );
                          }

                          return (
                            <div key={cLab.id} className="transition-colors">
                              <div className="p-4 hover:bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-sm text-slate-900">{cLab.name}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                      cLab.isExternalBench
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-teal-50 text-teal-800 border-teal-200'
                                    }`}>
                                      {cLab.isExternalBench ? 'Passerelle WhatsApp (Banc Externe)' : 'LIMS Intégré'}
                                    </span>

                                    {/* Status Badge */}
                                    {cLab.realCommissionDue === 0 ? (
                                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        ✓ À jour (0 impayé)
                                      </span>
                                    ) : status === 'remitted' ? (
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

                                  {/* Metrics - 100% Real-Time */}
                                  <div className="flex items-center gap-4 text-xs font-mono text-slate-600 pt-0.5 flex-wrap">
                                    <span>Dossiers payés : <strong className={cLab.testsCount > 0 ? "text-slate-900" : "text-slate-400"}>{cLab.testsCount}</strong></span>
                                    <span>Volume brut : <strong className={cLab.realGrossVolume > 0 ? "text-slate-900" : "text-slate-400"}>{cLab.realGrossVolume.toLocaleString()} FCFA</strong></span>
                                    <span className={cLab.realCommissionDue > 0 ? "text-emerald-700 font-bold" : "text-slate-400 font-medium"}>
                                      Commission due (5%) : <strong className="font-extrabold">{cLab.realCommissionDue.toLocaleString()} FCFA</strong>
                                    </span>
                                  </div>
                                </div>

                                {/* Direct Actions & Dropdown Toggle */}
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                  {/* Dropdown audit button */}
                                  <button
                                    type="button"
                                    onClick={() => setExpandedRecoveryLabId(isExpanded ? null : cLab.id)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                                      isExpanded
                                        ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                                    }`}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Preuves &amp; Détail ({cLab.testsCount})</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* WhatsApp relance */}
                                  <a
                                    href={`https://wa.me/${waPhone}?text=${waMsg}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`px-3 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors ${
                                      cLab.realCommissionDue > 0
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-slate-600 hover:bg-slate-700 opacity-90'
                                    }`}
                                    title={cLab.realCommissionDue > 0 ? 'Envoyer le relevé des dossiers impayés sur WhatsApp' : 'Notifier le laboratoire de sa situation saine'}
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>{cLab.realCommissionDue > 0 ? 'Relance WhatsApp' : 'WhatsApp'}</span>
                                  </a>

                                  {cLab.realCommissionDue > 0 && (
                                    <>
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
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Accordion Audit Breakdown Dropdown */}
                              {isExpanded && (
                                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/90 space-y-4 animate-in fade-in duration-200">
                                  {cLab.testsCount === 0 ? (
                                    <div className="p-5 bg-white rounded-2xl border border-slate-200 flex items-start gap-3">
                                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                      <div className="space-y-1">
                                        <h5 className="text-xs font-bold text-slate-900">
                                          Aucun dossier payé enregistré pour ce laboratoire (0 impayé)
                                        </h5>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                          nanoLabs applique une transparence totale : aucun montant forfaitaire n&apos;est facturé à l&apos;avance. Dès qu&apos;un patient se rend dans cet établissement et règle sa commande d&apos;analyses (espèces ou Mobile Money au guichet), la fiche détaillée s&apos;affichera automatiquement ci-dessous avec le nom du patient, la liste de ses examens, les tarifs appliqués et la commission de 5%.
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                                        <div>
                                          <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-teal-700" />
                                            <span>Preuves Détaillées de Recouvrement — {cLab.name}</span>
                                          </h5>
                                          <p className="text-[11px] text-slate-500">
                                            Chaque dossier ci-dessous a été vérifié et payé par le patient au comptoir du laboratoire.
                                          </p>
                                        </div>
                                        <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                                          Total Commissions Dues : {cLab.realCommissionDue.toLocaleString()} FCFA
                                        </span>
                                      </div>

                                      <div className="space-y-3">
                                        {cLab.paidBookings.map((dossier: any, dIdx: number) => (
                                          <div key={dossier.id || dIdx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                                            {/* Dossier Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black text-sm text-slate-900">{dossier.patientName}</span>
                                                <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                                                  #{dossier.bookingCode}
                                                </span>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                  ✓ Payé par le patient au guichet
                                                </span>
                                              </div>
                                              <div className="text-xs text-slate-500 flex items-center gap-3">
                                                {dossier.patientPhone && <span>Tél : <strong className="text-slate-700 font-mono">{dossier.patientPhone}</strong></span>}
                                                {dossier.date && <span>Date : <strong className="text-slate-700">{new Date(dossier.date).toLocaleDateString('fr-FR')}</strong></span>}
                                              </div>
                                            </div>

                                            {/* Table of tests booked with prices */}
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-left text-xs">
                                                <thead>
                                                  <tr className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                                                    <th className="pb-1.5 font-bold">Examen(s) Médicaux Demandés</th>
                                                    <th className="pb-1.5 font-bold">Catégorie</th>
                                                    <th className="pb-1.5 text-right font-bold">Tarif Fixé par le Laboratoire</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                                  {(dossier.tests || []).map((t: any, tIdx: number) => (
                                                    <tr key={tIdx} className="hover:bg-slate-50/50">
                                                      <td className="py-1.5 font-sans font-semibold text-slate-900">{t.name}</td>
                                                      <td className="py-1.5 font-sans text-slate-500 text-[11px]">{t.category || 'Diagnostic'}</td>
                                                      <td className="py-1.5 text-right font-bold">{t.price ? t.price.toLocaleString() : '0'} FCFA</td>
                                                    </tr>
                                                  ))}
                                                  {dossier.prelevementFee > 0 && (
                                                    <tr className="text-slate-600 bg-slate-50/50">
                                                      <td className="py-1.5 font-sans">Acte de prélèvement &amp; tubes/consommables</td>
                                                      <td className="py-1.5 font-sans text-slate-400 text-[11px]">Consommables</td>
                                                      <td className="py-1.5 text-right font-bold">{dossier.prelevementFee.toLocaleString()} FCFA</td>
                                                    </tr>
                                                  )}
                                                  {dossier.homePickupFee > 0 && (
                                                    <tr className="text-slate-600 bg-slate-50/50">
                                                      <td className="py-1.5 font-sans">Frais de déplacement prélèvement à domicile</td>
                                                      <td className="py-1.5 font-sans text-slate-400 text-[11px]">Logistique</td>
                                                      <td className="py-1.5 text-right font-bold">{dossier.homePickupFee.toLocaleString()} FCFA</td>
                                                    </tr>
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>

                                            {/* Dossier Reconciliation Calculation */}
                                            <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-2xl">
                                              <div className="text-slate-600">
                                                Total réglé par le patient au comptoir : <strong className="text-slate-900 font-mono font-black">{dossier.grossAmount.toLocaleString()} FCFA</strong>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-slate-500 font-mono">Commission nanoLabs (5% par lot) :</span>
                                                <span className="font-mono font-black text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-300">
                                                  {dossier.platformFee.toLocaleString()} FCFA
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
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
