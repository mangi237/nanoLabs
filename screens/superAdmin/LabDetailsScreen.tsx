import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  Users, 
  UserCheck, 
  DollarSign, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert,
  X,
  Plus,
  Calendar,
  Key,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  Check,
  Sparkles,
  Search,
  FileText
} from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, updateDoc, db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';

interface LabDetailsScreenProps {
  labId: string;
  onBack: () => void;
  onLabDeleted?: () => void;
}

export const LabDetailsScreen: React.FC<LabDetailsScreenProps> = ({
  labId,
  onBack,
  onLabDeleted
}) => {
  const { user } = useAuth();
  const [lab, setLab] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [confirmedTestsCount, setConfirmedTestsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [superAdminCode, setSuperAdminCode] = useState('');
  const [showSuperAdminCode, setShowSuperAdminCode] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [totalTestsCount, setTotalTestsCount] = useState<number>(0);
  const [confirmedTestsList, setConfirmedTestsList] = useState<any[]>([]);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'tests' | 'staff'>('overview');

  // Manual Subscription Renewal Modal State
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewDuration, setRenewDuration] = useState<'30' | '60' | '90' | '180' | '365' | 'unlimited'>('30');
  const [renewPlan, setRenewPlan] = useState<'flat_subscription' | 'pay_per_test' | 'lifetime_space'>('flat_subscription');
  const [renewTier, setRenewTier] = useState<'starter' | 'growth' | 'business'>('growth');
  const [renewReason, setRenewReason] = useState('SuperAdmin Administrative Waiver (No Payment Required)');
  const [renewCustomNotes, setRenewCustomNotes] = useState('');
  const [renewCode, setRenewCode] = useState('');
  const [showRenewCode, setShowRenewCode] = useState(false);
  const [renewCodeError, setRenewCodeError] = useState('');
  const [processingRenew, setProcessingRenew] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    address: ''
  });

  const parseTimestamp = (raw: any): number => {
    if (!raw) return 0;
    if (typeof raw === 'object' && typeof raw.seconds === 'number') return raw.seconds * 1000;
    const parsed = new Date(raw).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

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

  const fetchLabDetails = async () => {
    try {
      setLoading(true);
      // Fetch labs
      const labsSnap = await getDocs(collection(db, 'labs'));
      const foundLabDoc = labsSnap.docs.find(d => d.id === labId);

      if (foundLabDoc) {
        const data = foundLabDoc.data();
        setLab({ id: foundLabDoc.id, ...data });
        setEditForm({
          name: data.name || '',
          location: data.location || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || ''
        });
        setRenewPlan(data.pricingModel || 'flat_subscription');
        setRenewTier(data.subscriptionTier || 'growth');
      }

      // Fetch lab staff
      const staffSnap = await getDocs(collection(db, 'labs', labId, 'staff'));
      const staffDocs = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStaffList(staffDocs);

      // Fetch lab patients & count confirmed tests with multi-collection reconciliation
      let confirmedCount = 0;
      let totalTests = 0;
      const testsList: any[] = [];
      const seenTestKeys = new Set<string>();

      try {
        const patientSnap = await getDocs(collection(db, 'labs', labId, 'patients'));
        setPatientCount(patientSnap.size || foundLabDoc?.data()?.patientCount || 0);

        patientSnap.docs.forEach(pDoc => {
          const pData = pDoc.data();
          const labTests = pData.labTests || [];
          totalTests += labTests.length;

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
              confirmedCount++;
              testsList.push({
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
        console.warn('Error reading patients in lab details:', patErr);
      }

      // Also reconcile bookings
      try {
        const bookingsSnap = await getDocs(collection(db, 'labs', labId, 'bookings'));
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
            if (seenTestKeys.has(testKey)) return;
            seenTestKeys.add(testKey);
            totalTests++;

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
              confirmedCount++;
              testsList.push({
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
        console.warn('Error reading bookings in lab details:', bookErr);
      }

      setConfirmedTestsCount(confirmedCount);
      setTotalTestsCount(Math.max(totalTests, confirmedCount));
      setConfirmedTestsList(testsList);

    } catch (err) {
      console.error('Error fetching lab details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmManualRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lab) return;

    const enteredCode = (renewCode || '').trim().toUpperCase();
    const activeAdminCode = (user?.accessCode || '').trim().toUpperCase();
    const validCodes = ['SUPER123', 'SUPERADMIN', 'SUPERADMIN2025'];
    if (activeAdminCode) validCodes.push(activeAdminCode);

    if (!validCodes.includes(enteredCode)) {
      setRenewCodeError('Invalid Super Admin authorization code. Manual renewal denied.');
      return;
    }

    setProcessingRenew(true);
    try {
      const isUnlimited = renewDuration === 'unlimited';
      const daysToAdd = isUnlimited ? 0 : parseInt(renewDuration, 10);
      
      let baseDate = Date.now();
      if (!isUnlimited && lab.subscriptionExpiresAt) {
        const existingExpiry = parseTimestamp(lab.subscriptionExpiresAt);
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

      await updateDoc(doc(db, 'labs', labId), updatePayload);
      setShowRenewModal(false);
      setRenewCode('');
      setRenewCodeError('');
      await fetchLabDetails();
    } catch (err) {
      console.error('Failed to manually renew lab subscription:', err);
      setRenewCodeError('Failed to save manual subscription renewal.');
    } finally {
      setProcessingRenew(false);
    }
  };

  useEffect(() => {
    fetchLabDetails();
  }, [labId]);

  const handleConfirmDeleteLab = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = (superAdminCode || '').trim().toUpperCase();
    const activeAdminCode = (user?.accessCode || '').trim().toUpperCase();
    const validCodes = ['SUPER123', 'SUPERADMIN', 'SUPERADMIN2025'];
    if (activeAdminCode) validCodes.push(activeAdminCode);

    if (!validCodes.includes(enteredCode)) {
      setDeleteError('Invalid Super Admin authorization code. Lab deletion denied.');
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'labs', labId));
      if (onLabDeleted) onLabDeleted();
      onBack();
    } catch (err) {
      console.error('Error deleting lab:', err);
      setDeleteError('Failed to delete lab record.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateDoc(doc(db, 'labs', labId), {
        name: editForm.name.trim(),
        location: editForm.location.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        address: editForm.address.trim()
      });
      setShowEditModal(false);
      fetchLabDetails();
    } catch (err) {
      console.error('Error updating lab details:', err);
      alert('Failed to update lab information.');
    }
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!window.confirm(`Remove admin/staff user "${staffName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'labs', labId, 'staff', staffId));
      fetchLabDetails();
    } catch (err) {
      console.error('Failed to remove staff member:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading laboratory center details...
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-slate-600 font-semibold">Laboratory center not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  let calculatedRevenue = 0;
  let revenueSubtitle = '';
  if (lab.pricingModel === 'flat_subscription') {
    calculatedRevenue = lab.subscriptionPrice || (
      lab.subscriptionTier === 'business' ? 120000 :
      lab.subscriptionTier === 'growth' ? 55000 : 25000
    );
    revenueSubtitle = `Flat Subscription (${(lab.subscriptionTier || 'GROWTH').toUpperCase()}) • Unlimited Tests`;
  } else if (lab.pricingModel === 'lifetime_space') {
    calculatedRevenue = lab.monthlyMaintenanceFee || 15000;
    revenueSubtitle = `Lifetime Dedicated Tenant • 15,000 FCFA/mo Maintenance`;
  } else {
    const fee = lab.feePerPatient || lab.feePerTest || 500;
    calculatedRevenue = confirmedTestsCount * fee;
    revenueSubtitle = `${confirmedTestsCount} confirmed tests @ ${fee.toLocaleString()} FCFA`;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Super Admin Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowRenewModal(true);
              setRenewDuration('30');
              setRenewPlan(lab.pricingModel || 'flat_subscription');
              setRenewTier(lab.subscriptionTier || 'growth');
              setRenewReason('SuperAdmin Administrative Waiver (No Payment Required)');
              setRenewCustomNotes('');
              setRenewCode('');
              setRenewCodeError('');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Zap className="w-4 h-4 text-white" />
            Renew Subscription
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            Edit Center
          </button>
          <button
            onClick={() => {
              setShowDeleteModal(true);
              setSuperAdminCode('');
              setDeleteError('');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete Lab
          </button>
        </div>
      </div>

      {/* Lab Main Card */}
      <div 
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
        style={{ backgroundColor: lab.primaryColor || '#0D9488' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {lab.logoUrl || lab.avatarUrl ? (
              <img
                src={lab.logoUrl || lab.avatarUrl}
                alt={lab.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-md shrink-0 bg-white/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl border-2 border-white/30 shrink-0">
                {lab.name ? lab.name.charAt(0).toUpperCase() : 'L'}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                  <Building2 className="w-3.5 h-3.5" />
                  {lab.status === 'active' ? 'Active Network Center' : 'Pending / Inactive'}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  Created: {formatCreatedDate(lab.createdAt)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{lab.name}</h1>
              <p className="text-white/80 text-sm">{lab.slogan || 'Diagnostic & Clinical Laboratory'}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-right min-w-[200px]">
            <div className="text-xs text-white/80 uppercase font-bold tracking-wider">Facility Monthly Billing / Royalties</div>
            <div className="text-2xl font-bold mt-0.5">{calculatedRevenue.toLocaleString()} FCFA</div>
            <div className="text-[11px] text-white/70">{revenueSubtitle}</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{patientCount}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{confirmedTestsCount}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Tests</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{staffList.length}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Accounts</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{calculatedRevenue.toLocaleString()} FCFA</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Royalties</div>
          </div>
        </div>
      </div>

      {/* Subscription & Operational Licensing Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              LIMS Operational License & Subscription
            </span>
            {lab.isManualRenewal && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Administrative Override
              </span>
            )}
          </div>
          <div className="text-xl font-black text-white">
            {lab.pricingModel === 'flat_subscription' 
              ? `Monthly Flat SaaS (${(lab.subscriptionTier || 'GROWTH').toUpperCase()})` 
              : lab.pricingModel === 'lifetime_space'
              ? 'Dedicated Cloud Tenant'
              : 'Pay-Per-Test (5% Record Fee)'}
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            {lab.isUnlimitedSubscription ? (
              <strong className="text-emerald-400">Permanent operational exemption active. This facility has unlimited operational access without billing lockouts.</strong>
            ) : (() => {
              let expiryTimestamp: number | null = null;
              if (lab.subscriptionExpiresAt) {
                expiryTimestamp = parseTimestamp(lab.subscriptionExpiresAt);
              } else {
                const rawDate = lab.subscriptionStartDate || lab.createdAt;
                const start = parseTimestamp(rawDate) || Date.now();
                expiryTimestamp = start + 30 * 24 * 60 * 60 * 1000;
              }
              const daysLeft = Math.ceil(((expiryTimestamp || 0) - Date.now()) / (1000 * 60 * 60 * 24));
              if (daysLeft <= 0) {
                return <strong className="text-rose-400">Subscription expired {Math.abs(daysLeft)} days ago. Facility is due for renewal.</strong>;
              }
              return <span>Current period valid for <strong className="text-teal-300">{daysLeft} days remaining</strong> (expires {formatCreatedDate(expiryTimestamp)}).</span>;
            })()}
          </p>
          {lab.isManualRenewal && lab.manualRenewalReason && (
            <div className="text-[11px] text-slate-400 pt-1">
              Last renewed by: <strong className="text-slate-200">{lab.manualRenewalGrantedBy || 'SuperAdmin'}</strong> • Reason: <span className="text-amber-200 italic font-medium">{lab.manualRenewalReason}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setShowRenewModal(true);
            setRenewDuration('30');
            setRenewPlan(lab.pricingModel || 'flat_subscription');
            setRenewTier(lab.subscriptionTier || 'growth');
            setRenewReason('SuperAdmin Administrative Waiver (No Payment Required)');
            setRenewCustomNotes('');
            setRenewCode('');
            setRenewCodeError('');
          }}
          className="px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0 self-start md:self-center"
        >
          <Zap className="w-4 h-4 text-white" />
          <span>Renew Subscription Manually</span>
        </button>
      </div>

      {/* Contact & Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Location & Contact Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>Region / Location:</strong> {lab.location || 'N/A'}</span>
            </div>
            {lab.address && (
              <div className="flex items-center gap-3 text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong>Address:</strong> {lab.address}</span>
              </div>
            )}
            {lab.phone && (
              <div className="flex items-center gap-3 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong>Phone:</strong> {lab.phone}</span>
              </div>
            )}
            {lab.email && (
              <div className="flex items-center gap-3 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong>Email:</strong> {lab.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>Onboarding Date:</strong> {formatCreatedDate(lab.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Staff & Admin List (Masked credentials for privacy) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-600" />
              Assigned Staff & Administrators ({staffList.length})
            </h3>
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Credentials Protected
            </span>
          </div>

          {staffList.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No staff accounts registered yet.</p>
          ) : (
            <div className="space-y-3">
              {staffList.map((member) => (
                <div key={member.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{member.email || 'No email registered'}</span>
                      <span>•</span>
                      <span className="capitalize font-semibold text-slate-700">{member.primaryRole || member.role || 'Staff'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteStaff(member.id, member.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove Staff Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Authenticated Confirmed Tests Audit Trail Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Authenticated Confirmed Diagnostic Investigations ({confirmedTestsCount})
            </h3>
            <p className="text-xs text-slate-500">
              Directly queried from patient records and appointment check-ins with validated clinical verification.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tests, patients, codes..."
              value={testSearchQuery}
              onChange={(e) => setTestSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-teal-500"
            />
          </div>
        </div>

        {(() => {
          const filtered = confirmedTestsList.filter(t => 
            (t.testName && t.testName.toLowerCase().includes(testSearchQuery.toLowerCase())) ||
            (t.patientName && t.patientName.toLowerCase().includes(testSearchQuery.toLowerCase())) ||
            (t.bookingCode && t.bookingCode.toLowerCase().includes(testSearchQuery.toLowerCase()))
          );

          if (filtered.length === 0) {
            return (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300" />
                <div className="font-semibold text-slate-600 text-sm">No confirmed tests match the search query.</div>
                <div className="text-xs">Any confirmed tests processed by front desk or cashier will be cataloged here.</div>
              </div>
            );
          }

          return (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto border border-slate-100 rounded-2xl">
              {filtered.map((item, idx) => (
                <div key={item.id || idx} className="p-3.5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm">{item.testName}</span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {item.bookingCode}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 flex-wrap">
                      <span className="font-bold text-slate-700">Patient: {item.patientName}</span>
                      {item.patientPhone && <span>• Tel: {item.patientPhone}</span>}
                      {item.date && <span>• Registered: {formatCreatedDate(item.date)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="font-mono font-bold text-slate-700 text-xs">
                      {(item.price || 5500).toLocaleString()} FCFA
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      ['completed', 'signed', 'validated'].includes((item.status || '').toLowerCase())
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : ['samplecollected', 'collected'].includes((item.status || '').toLowerCase())
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status || 'Confirmed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Edit Lab Center Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lab Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Region / Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Code-Verified Delete Lab Modal */}
      {showDeleteModal && (
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
                onClick={() => { setShowDeleteModal(false); setDeleteError(''); setSuperAdminCode(''); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-rose-400 text-sm">Permanent Action Warning</div>
              <p className="text-slate-300">
                You are about to permanently delete <strong className="text-white">{lab.name}</strong> ({lab.location || 'Central Location'}).
              </p>
              <div className="text-slate-400 text-[11px]">
                Created: <strong className="text-slate-300">{formatCreatedDate(lab.createdAt)}</strong> • Total Staff: <strong className="text-slate-300">{staffList.length}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmDeleteLab} className="space-y-4">
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
                      setDeleteError('');
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
                {deleteError && (
                  <p className="text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {deleteError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setDeleteError(''); setSuperAdminCode(''); }}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting || !superAdminCode.trim()}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Subscription Renewal & Waiver Modal for This Lab */}
      {showRenewModal && (
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
                onClick={() => { setShowRenewModal(false); setRenewCodeError(''); setRenewCode(''); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Lab Summary Banner */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-sm">{lab.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {lab.location || 'Central Region'}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] flex flex-wrap items-center gap-3">
                <span>Current Plan: <strong className="text-slate-200 capitalize">{lab.pricingModel || 'flat_subscription'}</strong></span>
                <span>• Tier: <strong className="text-slate-200 uppercase">{lab.subscriptionTier || 'GROWTH'}</strong></span>
                <span>• Onboarded: <strong className="text-slate-200">{formatCreatedDate(lab.createdAt)}</strong></span>
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
                  placeholder="e.g. Approved by Director; partner expansion pilot"
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
                  onClick={() => { setShowRenewModal(false); setRenewCodeError(''); setRenewCode(''); }}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingRenew || !renewCode.trim()}
                  className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>{processingRenew ? 'Applying Renewal...' : 'Authorize & Grant Renewal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabDetailsScreen;
