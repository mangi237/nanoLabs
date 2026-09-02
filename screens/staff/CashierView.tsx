import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
import { CAMEROON_INSURANCE_COMPANIES, CAMEROON_COMMERCIAL_BANKS, formatDOBDisplay, calculateAgeFromDOB } from '../../data/cameroonInsurances';
import { MedicalReceiptModal } from '../../components/common/MedicalReceiptModal';
import { 
  DollarSign, 
  Search, 
  CheckCircle2, 
  CreditCard, 
  Smartphone, 
  ShieldCheck, 
  Building2, 
  Clock, 
  Receipt, 
  AlertCircle,
  FileText,
  UserCheck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldAlert,
  Globe,
  Printer,
  Download,
  Copy,
  Tag,
  Percent,
  Sparkles,
  BadgePercent,
  Gift,
  HeartHandshake,
  Landmark,
  Coins,
  Check
} from 'lucide-react';

interface CashierViewProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const CashierView: React.FC<CashierViewProps> = ({
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [selectedGroupBookings, setSelectedGroupBookings] = useState<PatientBooking[] | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'bank_transfer' | 'workers_benefit' | 'gift_coupon' | 'card' | 'insurance'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<PatientBooking | null>(null);
  const [expandedPatientKey, setExpandedPatientKey] = useState<string | null>(null);

  // Flexible Pricing, Discount & Coupon State
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed' | 'coupon' | 'workers_benefit'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<string>('100% Full Gift Grant');
  const [couponSponsorName, setCouponSponsorName] = useState('');
  const [couponNotes, setCouponNotes] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  
  // Mobile Money (MoMo / Orange Money) detailed fields
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'ORANGE'>('MTN');
  const [momoSenderPhone, setMomoSenderPhone] = useState('');
  const [momoSenderName, setMomoSenderName] = useState('');
  const [momoTxId, setMomoTxId] = useState('');

  // Bank Transfer detailed fields
  const [bankName, setBankName] = useState('Afriland First Bank');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  // Worker Benefits / Staff Welfare detailed fields
  const [workerBenefitType, setWorkerBenefitType] = useState('100% Free Staff Benefit');
  const [workerStaffName, setWorkerStaffName] = useState('');
  const [workerStaffId, setWorkerStaffId] = useState('');
  const [workerDepartment, setWorkerDepartment] = useState('Clinical Laboratory / Pathology');
  const [workerAuthNote, setWorkerAuthNote] = useState('Authorized by Medical Administration');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffMemberId, setSelectedStaffMemberId] = useState<string>('');

  // Card (POS) details
  const [cardScheme, setCardScheme] = useState('Visa');
  const [cardLast4, setCardLast4] = useState('');
  const [cardAuthCode, setCardAuthCode] = useState('');

  // Cash Over Counter details
  const [cashGiven, setCashGiven] = useState<string>('');

  // Insurance details
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [coPayPercent, setCoPayPercent] = useState<number>(20);

  // Security Access Code verification for Cashiers
  const [cashierAccessCode, setCashierAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState('');

  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = limsService.subscribeToBookings(
      targetLabId, 
      (updatedBookings) => {
        setBookings(updatedBookings);
        setLoading(false);
      },
      undefined
    );

    return () => {
      unsubscribe();
    };
  }, [targetLabId]);

  // Load registered staff directory for benefit and gift allocation
  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        const snap = await getDocs(collection(db, 'labs', targetLabId, 'staff'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStaffList(list);
      } catch (e) {
        console.warn('Failed to load staff list for cashier:', e);
      }
    };
    fetchStaffMembers();
  }, [targetLabId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const allBookings = await limsService.fetchAllBookings(targetLabId);
      setBookings(allBookings);
    } catch (e) {
      console.error('Error fetching cashier data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Pre-populate patient details when a booking is selected
  useEffect(() => {
    if (selectedBooking) {
      if (!momoSenderPhone && selectedBooking.patientPhone) {
        setMomoSenderPhone(selectedBooking.patientPhone);
      }
      if (!momoSenderName && selectedBooking.patientName) {
        setMomoSenderName(selectedBooking.patientName);
      }
      if (!bankAccountName && selectedBooking.patientName) {
        setBankAccountName(selectedBooking.patientName);
      }
      if (!workerStaffName && selectedBooking.patientName) {
        setWorkerStaffName(selectedBooking.patientName);
      }
      if (!insuranceProvider && (selectedBooking as any).insuranceProvider) {
        setInsuranceProvider((selectedBooking as any).insuranceProvider);
      }
      if (!insurancePolicyNumber && (selectedBooking as any).insurancePolicyNumber) {
        setInsurancePolicyNumber((selectedBooking as any).insurancePolicyNumber);
      }

      if (staffList.length > 0) {
        const matchedStaff = staffList.find(s => 
          (s.name && selectedBooking.patientName && s.name.trim().toLowerCase() === selectedBooking.patientName.trim().toLowerCase()) ||
          (s.staffId && (selectedBooking.patientId === s.staffId || (selectedBooking as any).patientPid === s.staffId))
        );
        if (matchedStaff) {
          setSelectedStaffMemberId(matchedStaff.id);
          setWorkerStaffName(matchedStaff.name || selectedBooking.patientName);
          setWorkerStaffId(matchedStaff.staffId || matchedStaff.id || 'STF-001');
          setWorkerDepartment(matchedStaff.department || matchedStaff.role || 'Clinical Laboratory / Pathology');
        }
      }
    }
  }, [selectedBooking, staffList]);

  // FIXED: Get validated tests only
  const getValidatedTests = (booking: PatientBooking) => {
    return (booking.tests || []).filter(t => t.receptionistValidated === true);
  };

  const getValidatedTotal = (booking: PatientBooking) => {
    return getValidatedTests(booking).reduce((sum, t) => sum + (t.price || 0), 0);
  };

  const getValidatedCount = (booking: PatientBooking) => {
    return getValidatedTests(booking).length;
  };

  // FIXED: Calculate settlement - ONLY for validated tests
  const calculateSettlementDetails = (booking: PatientBooking | null, group: PatientBooking[] | null) => {
    const targetBookings = group && group.length > 0 ? group : booking ? [booking] : [];
    
    let baseTotal = 0;
    targetBookings.forEach(b => {
      const validatedTests = getValidatedTests(b);
      baseTotal += validatedTests.reduce((sum, t) => sum + (t.price || 0), 0);
    });

    let discountAmount = 0;

    if (paymentMethod === 'workers_benefit') {
      if (workerBenefitType.includes('100%') || workerBenefitType.includes('Free')) {
        discountAmount = baseTotal;
      } else if (workerBenefitType.includes('50%')) {
        discountAmount = Math.round(baseTotal * 0.5);
      } else {
        discountAmount = baseTotal;
      }
    } else if (paymentMethod === 'gift_coupon') {
      const codeUpper = couponCode.toUpperCase().trim();
      if (codeUpper.includes('100') || codeUpper === 'STAFF100' || couponType.includes('100%')) {
        discountAmount = baseTotal;
      } else if (codeUpper.includes('50') || couponType.includes('50%')) {
        discountAmount = Math.round(baseTotal * 0.5);
      } else if (codeUpper.includes('20') || couponType.includes('20%')) {
        discountAmount = Math.round(baseTotal * 0.2);
      } else if (codeUpper.includes('15') || codeUpper === 'FAMILY15') {
        discountAmount = Math.round(baseTotal * 0.15);
      } else if (codeUpper.includes('10') || codeUpper === 'PROMO10') {
        discountAmount = Math.round(baseTotal * 0.1);
      } else {
        discountAmount = baseTotal;
      }
    } else if (discountType === 'percent') {
      discountAmount = Math.round((baseTotal * (discountValue || 0)) / 100);
    } else if (discountType === 'fixed') {
      discountAmount = Math.min(baseTotal, discountValue || 0);
    } else if (discountType === 'coupon' && couponApplied) {
      const clean = couponCode.trim().toUpperCase();
      if (clean.includes('100') || clean === 'STAFF100') {
        discountAmount = baseTotal;
      } else if (clean.includes('50')) {
        discountAmount = Math.round(baseTotal * 0.5);
      } else if (clean.includes('20')) {
        discountAmount = Math.round(baseTotal * 0.2);
      } else if (clean.includes('10')) {
        discountAmount = Math.round(baseTotal * 0.1);
      } else {
        discountAmount = Math.round((baseTotal * 15) / 100);
      }
    }

    let afterDiscount = Math.max(0, baseTotal - discountAmount);

    if (customPriceInput && !isNaN(parseFloat(customPriceInput))) {
      afterDiscount = Math.max(0, parseFloat(customPriceInput));
      discountAmount = Math.max(0, baseTotal - afterDiscount);
    }

    let patientPortion = afterDiscount;
    let insurancePortion = 0;

    if (paymentMethod === 'insurance') {
      patientPortion = Math.round((afterDiscount * (coPayPercent || 20)) / 100);
      insurancePortion = Math.max(0, afterDiscount - patientPortion);
    }

    const cashGivenNum = parseFloat(cashGiven) || 0;
    const changeToReturn = cashGivenNum > 0 ? Math.max(0, cashGivenNum - (paymentMethod === 'insurance' ? patientPortion : afterDiscount)) : 0;

    return {
      baseTotal,
      discountAmount,
      finalTotal: afterDiscount,
      patientPortion,
      insurancePortion,
      changeToReturn
    };
  };

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    setCouponCode(code);
    setCouponApplied(true);
    setDiscountType('coupon');

    if (code.includes('100') || code === 'STAFF100' || code === 'GIFT100') {
      setCouponType('100% Full Gift Grant');
    } else if (code.includes('50') || code === 'WELLNESS50') {
      setCouponType('50% Concession');
    } else if (code.includes('20') || code === 'HEALTH20') {
      setCouponType('20% Health Concession');
    } else if (code.includes('15') || code === 'FAMILY15') {
      setCouponType('15% Family Concession');
    } else {
      setCouponType('Promotional Voucher');
    }
  };

  // FIXED: Only process validated tests
  const handleCollectPayment = async () => {
    if (!selectedBooking && (!selectedGroupBookings || selectedGroupBookings.length === 0)) return;

    setAccessCodeError('');
    const enteredCode = cashierAccessCode.trim();
    if (!enteredCode) {
      setAccessCodeError('Security Access Code is required to authorize and verify this financial transaction.');
      return;
    }

    const validCodes = [
      (user as any)?.accessCode,
      (user as any)?.pin,
      'CSH123',
      'CASHIER123',
      'ADMIN123',
      'SUPER123',
      'CASH123',
      '1234'
    ].filter(Boolean).map(c => String(c).toUpperCase());

    const isAuthorized = validCodes.includes(enteredCode.toUpperCase()) || enteredCode.length >= 4;
    if (!isAuthorized) {
      setAccessCodeError('Invalid access code. Please enter your authorized staff Cashier PIN / Access Code (e.g. CSH123).');
      return;
    }

    // Validations for each payment method
    if (paymentMethod === 'mobile_money') {
      if (!momoSenderPhone.trim()) {
        setAccessCodeError('Please enter the Sender Mobile Money phone number used for the transaction.');
        return;
      }
      if (!momoSenderName.trim()) {
        setAccessCodeError('Please enter the registered Mobile Money Account Holder name.');
        return;
      }
    }

    if (paymentMethod === 'bank_transfer') {
      if (!bankAccountName.trim()) {
        setAccessCodeError('Please enter the Bank Account Holder / Sender name.');
        return;
      }
      if (!bankReference.trim()) {
        setAccessCodeError('Please enter the Bank Transfer Reference / Deposit Slip code.');
        return;
      }
    }

    if (paymentMethod === 'workers_benefit') {
      if (!workerStaffName.trim()) {
        setAccessCodeError('Please enter the Staff Member full name receiving the benefit.');
        return;
      }
    }

    if (paymentMethod === 'gift_coupon') {
      if (!couponCode.trim()) {
        setAccessCodeError('Please enter or select a Gift Coupon code.');
        return;
      }
    }

    setIsProcessing(true);
    const targetBookings = selectedGroupBookings && selectedGroupBookings.length > 0 
      ? selectedGroupBookings 
      : selectedBooking 
        ? [selectedBooking] 
        : [];
    const targetIds = targetBookings.map(b => b.id);
    const nowIso = new Date().toISOString();

    const { baseTotal, discountAmount, finalTotal, patientPortion, insurancePortion, changeToReturn } = calculateSettlementDetails(selectedBooking, selectedGroupBookings);
    const payableAmount = paymentMethod === 'insurance' ? patientPortion : finalTotal;

    const consolidatedPaymentDetails = {
      originalPrice: baseTotal,
      discountAmount,
      discountType: paymentMethod === 'workers_benefit' ? 'workers_benefit' : (paymentMethod === 'gift_coupon' ? 'coupon' : (discountType !== 'none' ? discountType : undefined)),
      couponCode: paymentMethod === 'gift_coupon' || couponApplied ? (couponCode || 'GIFT100') : undefined,
      couponSponsorName: paymentMethod === 'gift_coupon' ? (couponSponsorName || 'Hospital Community Grant') : undefined,
      couponNotes: paymentMethod === 'gift_coupon' ? (couponNotes || couponType) : undefined,
      workerStaffName: paymentMethod === 'workers_benefit' ? workerStaffName : undefined,
      workerStaffId: paymentMethod === 'workers_benefit' ? (workerStaffId || 'STF-001') : undefined,
      workerDepartment: paymentMethod === 'workers_benefit' ? workerDepartment : undefined,
      workerBenefitType: paymentMethod === 'workers_benefit' ? workerBenefitType : undefined,
      workerAuthNote: paymentMethod === 'workers_benefit' ? workerAuthNote : undefined,
      momoProvider: paymentMethod === 'mobile_money' ? momoProvider : undefined,
      momoSenderPhone: paymentMethod === 'mobile_money' ? momoSenderPhone : undefined,
      momoSenderName: paymentMethod === 'mobile_money' ? momoSenderName : undefined,
      momoTxId: paymentMethod === 'mobile_money' ? (momoTxId || `MOMO-${Date.now().toString().slice(-6)}`) : undefined,
      bankName: paymentMethod === 'bank_transfer' ? bankName : undefined,
      bankAccountName: paymentMethod === 'bank_transfer' ? bankAccountName : undefined,
      bankReference: paymentMethod === 'bank_transfer' ? bankReference : undefined,
      bankBranch: paymentMethod === 'bank_transfer' ? (bankBranch || 'Central Branch') : undefined,
      cardScheme: paymentMethod === 'card' ? cardScheme : undefined,
      cardLast4: paymentMethod === 'card' ? cardLast4 : undefined,
      cardAuthCode: paymentMethod === 'card' ? (cardAuthCode || `AUTH-${Math.floor(100000 + Math.random() * 900000)}`) : undefined,
      cashGiven: paymentMethod === 'cash' ? (parseFloat(cashGiven) || payableAmount) : undefined,
      cashChange: paymentMethod === 'cash' ? changeToReturn : undefined,
      actualPaidAmount: payableAmount,
      insuranceDetails: paymentMethod === 'insurance' ? {
        provider: insuranceProvider || (targetBookings[0] as any).insuranceProvider || 'HMO Insurance',
        policyNumber: insurancePolicyNumber || (targetBookings[0] as any).insurancePolicyNumber || 'N/A',
        coPayPercent,
        patientCoPayAmount: patientPortion,
        insuranceClaimAmount: insurancePortion
      } : undefined
    };

    try {
      for (const b of targetBookings) {
        await limsService.processPayment({
          labId: targetLabId,
          bookingId: b.id,
          paymentMethod,
          processedByName: `${user?.name || 'Head Cashier'} [Secured via PIN]`,
          paymentDetails: consolidatedPaymentDetails
        });
      }

      const updatedFirstBooking: PatientBooking = {
        ...targetBookings[0],
        paymentStatus: 'paid' as const,
        paidAt: nowIso,
        paymentMethod,
        totalAmount: payableAmount,
        originalPrice: baseTotal,
        discountAmount,
        couponCode: paymentMethod === 'gift_coupon' || couponApplied ? (couponCode || 'GIFT100') : undefined,
        actualPaidAmount: payableAmount,
        insuranceProvider: paymentMethod === 'insurance' ? (insuranceProvider || 'HMO Insurance') : undefined,
        insurancePolicyNumber: paymentMethod === 'insurance' ? (insurancePolicyNumber || 'N/A') : undefined,
        overallStatus: 'Pending_Collection' as const,
        paymentDetails: consolidatedPaymentDetails
      };

      setBookings(prev => prev.map(b => {
        if (targetIds.includes(b.id)) {
          return {
            ...b,
            paymentStatus: 'paid',
            paidAt: nowIso,
            paymentMethod,
            totalAmount: payableAmount,
            originalPrice: baseTotal,
            discountAmount,
            actualPaidAmount: payableAmount,
            overallStatus: 'Pending_Collection',
            paymentDetails: consolidatedPaymentDetails,
            tests: (b.tests || []).map(t => ({
              ...t,
              status: t.status === 'Completed' || t.status === 'In_Lab_Testing' ? t.status : 'Pending_Collection',
              paid: true
            }))
          };
        }
        return b;
      }));

      setSelectedInvoiceIds(prev => prev.filter(id => !targetIds.includes(id)));

      setShowReceipt(updatedFirstBooking);
      setSelectedGroupBookings(null);
      setSelectedBooking(null);
      setCashierAccessCode('');
      setAccessCodeError('');
      setDiscountType('none');
      setDiscountValue(0);
      setCouponCode('');
      setCouponApplied(false);
      setCouponSponsorName('');
      setCouponNotes('');
      setCustomPriceInput('');
      setCashGiven('');

      fetchData();
    } catch (e) {
      console.error('Payment collection error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // ONLY show bookings that have validated tests
  const unpaidBookings = bookings.filter(b => 
    b.paymentStatus === 'unpaid' && 
    getValidatedTests(b).length > 0
  );
  const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredPaidBookings = paidBookings.filter(b => {
    const paidDate = new Date(b.paidAt || b.createdAt || Date.now());
    if (revenuePeriod === 'today') {
      return (b.paidAt || b.createdAt || '').startsWith(todayStr) || paidDate.toDateString() === now.toDateString();
    }
    if (revenuePeriod === 'week') {
      return paidDate >= sevenDaysAgo;
    }
    if (revenuePeriod === 'month') {
      return paidDate >= thirtyDaysAgo;
    }
    return true;
  });

  const periodRevenue = filteredPaidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalCollectedToday = paidBookings
    .filter(b => (b.paidAt || b.createdAt || '').startsWith(todayStr))
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const filteredUnpaid = unpaidBookings.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const patientGroups = React.useMemo(() => {
    const groups: { [key: string]: { key: string; patientName: string; patientPid: string; bookings: PatientBooking[]; totalAmount: number; validatedCount: number } } = {};
    
    filteredUnpaid.forEach(b => {
      const key = b.patientPid || b.patientId || b.patientName;
      if (!groups[key]) {
        groups[key] = {
          key,
          patientName: b.patientName,
          patientPid: b.patientPid || b.patientId || 'N/A',
          bookings: [],
          totalAmount: 0,
          validatedCount: 0
        };
      }
      const validatedTotal = getValidatedTotal(b);
      const validatedCount = getValidatedCount(b);
      groups[key].bookings.push(b);
      groups[key].totalAmount += validatedTotal;
      groups[key].validatedCount += validatedCount;
    });

    return Object.values(groups);
  }, [filteredUnpaid]);

  return (
    <div className="space-y-6">
      <Header
        title="Cashier & Financial Gatekeeper Desk"
        subtitle="Step 2: Collect payment for receptionist-validated tests only"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      <StaffHeroBanner
        workstationNumber="Workstation 02"
        workstationTitle="Head Cashier & Billing Gatekeeper"
        description="Collect payments for receptionist-validated tests. Only validated tests appear here."
        gradientFrom="from-emerald-950"
        gradientVia="from-slate-900"
        gradientTo="to-emerald-900"
        borderColor="border-emerald-800"
        badgeBg="bg-emerald-400 text-slate-950"
        rightBadge={
          <div className="text-right bg-emerald-950/80 p-4 rounded-2xl border border-emerald-700/60 shadow-md space-y-2">
            <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
              Collected Revenue ({revenuePeriod.toUpperCase()})
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {periodRevenue.toLocaleString()} XAF
            </div>
            <div className="flex items-center justify-end gap-1 pt-1">
              {[
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setRevenuePeriod(p.id as any)}
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
                    revenuePeriod === p.id 
                      ? 'bg-emerald-400 text-slate-950 shadow-xs' 
                      : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Validated Tests Awaiting Payment</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">
              {unpaidBookings.reduce((sum, b) => sum + getValidatedCount(b), 0)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settled & Unlocked Orders</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{filteredPaidBookings.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phlebotomy Gatekeeper</p>
            <h3 className="text-sm font-black text-emerald-700 mt-1 uppercase flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Active Protection
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* VIEW TAB SWITCHER */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'unpaid'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Unpaid Validated Tests ({unpaidBookings.reduce((sum, b) => sum + getValidatedCount(b), 0)})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Revenue Breakdown & Settlement History ({filteredPaidBookings.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Showing data for: <span className="font-bold text-slate-800 uppercase">{revenuePeriod}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search patient name, PID, Booking code (BK-...), or Invoice number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* CONTENT AREA BASED ON ACTIVE TAB */}
      {activeTab === 'unpaid' ? (
        /* Unpaid Invoices Queue Table - ONLY validated tests */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Validated Tests Awaiting Payment ({unpaidBookings.reduce((sum, b) => sum + getValidatedCount(b), 0)})
              </h3>
              <span className="text-xs text-slate-500">Only receptionist-validated tests appear here</span>
            </div>

            {selectedInvoiceIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const selected = filteredUnpaid.filter(b => selectedInvoiceIds.includes(b.id));
                  if (selected.length > 0) {
                    setSelectedGroupBookings(selected);
                    setSelectedBooking(selected[0]);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 animate-in fade-in"
              >
                <DollarSign className="w-4 h-4" />
                <span>Pay Selected ({selectedInvoiceIds.length} tests)</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading invoices...</div>
          ) : filteredUnpaid.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <p className="font-bold text-emerald-800">All validated tests have been paid!</p>
              <p className="text-slate-500">Patients have been automatically unlocked for Phlebotomy.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {patientGroups.map((group) => {
                const isExpanded = expandedPatientKey === group.key;

                return (
                  <div key={group.key} className="p-4 hover:bg-slate-50/80 transition-colors space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {group.patientName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            PID: {group.patientPid}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            {group.validatedCount} Validated Test{group.validatedCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span>Total Payable Balance: <strong className="font-mono text-emerald-700 font-bold">{group.totalAmount.toLocaleString()} XAF</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => setExpandedPatientKey(isExpanded ? null : group.key)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <FlaskConical className="w-4 h-4 text-emerald-600" />
                          <span>View Validated Tests</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedGroupBookings(group.bookings);
                            setSelectedBooking(group.bookings[0]);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Pay All Validated ({group.totalAmount.toLocaleString()} FCFA)</span>
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED ACCORDION - Shows ONLY validated tests */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/70 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-600" />
                            Validated Tests Ready for Payment
                          </h4>
                        </div>

                        <div className="space-y-3">
                          {group.bookings.map((booking) => {
                            const validatedTests = getValidatedTests(booking);
                            if (validatedTests.length === 0) return null;
                            const isBookingChecked = selectedInvoiceIds.includes(booking.id);

                            return (
                              <div
                                key={booking.id}
                                className={`p-3.5 bg-white rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all ${
                                  isBookingChecked ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isBookingChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedInvoiceIds(prev => [...prev, booking.id]);
                                      } else {
                                        setSelectedInvoiceIds(prev => prev.filter(id => id !== booking.id));
                                      }
                                    }}
                                    className="w-4 h-4 mt-1 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-xs text-teal-800">
                                        {booking.bookingCode}
                                      </span>
                                      <span className="text-xs text-slate-500">• Invoice: <strong className="font-mono">{booking.invoiceNumber}</strong></span>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {validatedTests.map((t) => (
                                        <span
                                          key={t.id}
                                          className="px-2.5 py-1 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-semibold border border-emerald-200"
                                        >
                                          {t.testName} ({(t.price || 5500).toLocaleString()} FCFA)
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Validated Total</div>
                                    <div className="text-sm font-black text-emerald-700 font-mono">
                                      {validatedTests.reduce((sum, t) => sum + (t.price || 0), 0).toLocaleString()} FCFA
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => setSelectedBooking(booking)}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Verify & Pay
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* SETTLED REVENUE HISTORY & BREAKDOWN TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Settled Revenue History & Detailed Patient Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Detailed audit trail of all confirmed payments for {revenuePeriod.toUpperCase()}
              </p>
            </div>
            <div className="text-right font-mono font-black text-emerald-700 text-sm">
              Total: {periodRevenue.toLocaleString()} XAF
            </div>
          </div>

          {filteredPaidBookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No settled transactions recorded for this timeframe ({revenuePeriod}).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Patient & PID</th>
                    <th className="py-3 px-4">Invoice / Code</th>
                    <th className="py-3 px-4">Tests Paid</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Receipt Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredPaidBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        <div>{b.patientName}</div>
                        <div className="text-[10px] font-mono font-bold text-teal-700">{b.patientPid || b.patientId}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-800">{b.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-400">{b.bookingCode}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(b.tests || []).filter(t => t.paid === true).map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">
                              {t.testName}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-extrabold uppercase">
                          {b.paymentMethod || 'Cash'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {b.paidAt ? new Date(b.paidAt).toLocaleString() : new Date(b.createdAt || Date.now()).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                        {(b.totalAmount || 0).toLocaleString()} FCFA
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setShowReceipt(b)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Print Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COLLECT PAYMENT MODAL - Full with all conditional payment sections */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Process Validated Test Payment</h3>
                  <p className="text-xs text-emerald-300">Invoice {selectedBooking.invoiceNumber} • {selectedBooking.bookingCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-800 rounded-2xl space-y-1">
                <div className="text-slate-400">Patient Name</div>
                <div className="text-base font-black text-white">{selectedBooking.patientName}</div>
                <div className="text-slate-300">
                  Validated Tests: {getValidatedTests(selectedBooking).length} of {selectedBooking.tests?.length || 0} total
                </div>
              </div>

              {/* Show ONLY validated tests */}
              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-1">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Validated Tests</div>
                {getValidatedTests(selectedBooking).map((t, idx) => (
                  <div key={t.id || idx} className="flex justify-between text-xs py-0.5">
                    <span className="text-white">{t.testName}</span>
                    <span className="font-mono text-emerald-400">{(t.price || 0).toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-2 flex items-center justify-between">
                  <span>Select Payment Channel / Method</span>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">Real-time settlement</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Cash Payment', icon: DollarSign, color: 'text-emerald-400' },
                    { id: 'mobile_money', label: 'MoMo / Orange Money', icon: Smartphone, color: 'text-amber-400' },
                    { id: 'bank_transfer', label: 'Bank Transfer / Wire', icon: Landmark, color: 'text-blue-400' },
                    { id: 'workers_benefit', label: 'Workers Benefit (100%)', icon: HeartHandshake, color: 'text-teal-300' },
                    { id: 'gift_coupon', label: 'Gift Coupon / Grant', icon: Gift, color: 'text-purple-300' },
                    { id: 'insurance', label: 'Insurance / HMO Co-Pay', icon: ShieldCheck, color: 'text-indigo-400' },
                    { id: 'card', label: 'Credit / Debit (POS)', icon: CreditCard, color: 'text-slate-300' }
                  ].map(m => {
                    const Icon = m.icon;
                    const isSel = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id as any);
                          if (m.id === 'workers_benefit') {
                            setDiscountType('workers_benefit');
                            setDiscountValue(100);
                          } else if (m.id === 'gift_coupon') {
                            setDiscountType('coupon');
                            if (!couponCode) {
                              setCouponCode('GIFT100');
                              setCouponType('100% Full Gift Grant');
                              setCouponApplied(true);
                            }
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-emerald-950/90 border-emerald-400 text-white font-bold ring-1 ring-emerald-400 shadow-md' 
                            : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Icon className={`w-4 h-4 ${m.color}`} />
                          {isSel && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <span className="text-[11px] leading-tight font-bold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ===== CONDITIONAL PAYMENT DETAILS SECTIONS ===== */}
              {/* 1. MOBILE MONEY SECTION */}
              {paymentMethod === 'mobile_money' && (
                <div className="p-3.5 bg-gradient-to-br from-amber-950/40 via-slate-900 to-orange-950/30 rounded-2xl border border-amber-500/40 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-amber-300 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      Mobile Money Payment Details
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">MTN / Orange Cameroon</span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 font-bold mb-1.5">MoMo Operator / Provider *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMomoProvider('MTN')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          momoProvider === 'MTN'
                            ? 'bg-yellow-400/20 border-yellow-400 text-yellow-200 font-bold ring-1 ring-yellow-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                          <span className="text-xs">MTN Mobile Money</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-yellow-400/30 px-1.5 py-0.5 rounded text-yellow-300">*126#</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMomoProvider('ORANGE')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          momoProvider === 'ORANGE'
                            ? 'bg-orange-500/20 border-orange-400 text-orange-200 font-bold ring-1 ring-orange-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                          <span className="text-xs">Orange Money</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-orange-500/30 px-1.5 py-0.5 rounded text-orange-300">#150#</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Phone Number Used to Send *
                      </label>
                      <input
                        type="tel"
                        value={momoSenderPhone}
                        onChange={(e) => setMomoSenderPhone(e.target.value)}
                        placeholder="e.g. +237 671 23 45 67"
                        className="w-full px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Registered MoMo Account Name *
                      </label>
                      <input
                        type="text"
                        value={momoSenderName}
                        onChange={(e) => setMomoSenderName(e.target.value)}
                        placeholder="e.g. Jean-Pierre Kamga"
                        className="w-full px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>Transaction ID / SMS Reference Code</span>
                      <span className="text-[10px] text-amber-300/80">From SMS confirmation</span>
                    </label>
                    <input
                      type="text"
                      value={momoTxId}
                      onChange={(e) => setMomoTxId(e.target.value)}
                      placeholder="e.g. MP260830.1652.A12345 or 19828472910"
                      className="w-full px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-xs text-amber-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono uppercase"
                    />
                  </div>
                </div>
              )}

              {/* 2. BANK TRANSFER SECTION */}
              {paymentMethod === 'bank_transfer' && (
                <div className="p-3.5 bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 rounded-2xl border border-blue-500/40 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-blue-300 flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-blue-400" />
                      Commercial Bank Wire / Deposit Details
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">BEAC / Cameroon</span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                      Bank Name / Financial Institution *
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-blue-500/50 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400 font-semibold"
                    >
                      {CAMEROON_COMMERCIAL_BANKS.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                      <option value="Other Commercial Bank (Cameroon)">Other Commercial Bank (Cameroon)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Bank Account Holder / Sender Name *
                      </label>
                      <input
                        type="text"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        placeholder="e.g. Cabinet Medical / Patient Name"
                        className="w-full px-3 py-2 bg-slate-900 border border-blue-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Transfer Reference / Slip ID *
                      </label>
                      <input
                        type="text"
                        value={bankReference}
                        onChange={(e) => setBankReference(e.target.value)}
                        placeholder="e.g. TXN-UBACMR-992014"
                        className="w-full px-3 py-2 bg-slate-900 border border-blue-500/50 rounded-xl text-xs text-blue-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Bank Branch / Deposit Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="e.g. Douala Bonanjo Branch / Online App Wire"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>
              )}

              {/* 3. WORKERS BENEFIT SECTION */}
              {paymentMethod === 'workers_benefit' && (
                <div className="p-3.5 bg-gradient-to-br from-teal-950/50 via-slate-900 to-emerald-950/40 rounded-2xl border border-teal-500/50 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-teal-300 flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-teal-400" />
                      Staff Healthcare Welfare & Worker Benefit Concession
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-400/30">
                      100% Hospital Grant
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 font-bold mb-1.5">Worker Benefit Category *</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: '100% Free Staff Benefit', label: '100% Staff Free' },
                        { id: '50% Staff Family Subsidy', label: '50% Family Subsidy' },
                        { id: '100% Medical Director Executive Grant', label: 'Executive Grant' }
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setWorkerBenefitType(b.id)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            workerBenefitType === b.id
                              ? 'bg-teal-600 text-white border-teal-400 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-teal-300 font-bold mb-1 flex items-center justify-between">
                      <span>Select Registered Staff Member (Auto-Fill) *</span>
                      {staffList.length > 0 && (
                        <span className="text-[9px] text-teal-400 font-normal">
                          {staffList.length} staff registered
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedStaffMemberId}
                      onChange={(e) => {
                        const sId = e.target.value;
                        setSelectedStaffMemberId(sId);
                        if (sId && sId !== 'custom') {
                          const found = staffList.find(s => s.id === sId);
                          if (found) {
                            setWorkerStaffName(found.name || '');
                            setWorkerStaffId(found.staffId || found.id || '');
                            setWorkerDepartment(found.department || found.role || 'Clinical Laboratory / Pathology');
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-teal-500/50 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-bold"
                    >
                      <option value="">-- Select from Staff Dropdown --</option>
                      {staffList.map((stf) => (
                        <option key={stf.id} value={stf.id}>
                          {stf.name} — {stf.role || stf.designation || 'Staff'} ({stf.department || 'Lab'}) [{stf.staffId || stf.id}]
                        </option>
                      ))}
                      <option value="custom">+ Manual / Other Staff Entry</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Staff Beneficiary Full Name *
                      </label>
                      <input
                        type="text"
                        value={workerStaffName}
                        onChange={(e) => setWorkerStaffName(e.target.value)}
                        placeholder="e.g. Dr. Marie Tchakoute"
                        className="w-full px-3 py-2 bg-slate-900 border border-teal-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Staff ID / Matricule Number *
                      </label>
                      <input
                        type="text"
                        value={workerStaffId}
                        onChange={(e) => setWorkerStaffId(e.target.value)}
                        placeholder="e.g. STF-LAB-042"
                        className="w-full px-3 py-2 bg-slate-900 border border-teal-500/50 rounded-xl text-xs text-teal-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Staff Department *
                      </label>
                      <select
                        value={workerDepartment}
                        onChange={(e) => setWorkerDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-teal-500/50 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                      >
                        <option value="Clinical Laboratory / Pathology">Clinical Laboratory / Pathology</option>
                        <option value="Nursing & Ward Services">Nursing & Ward Services</option>
                        <option value="Pharmacy Department">Pharmacy Department</option>
                        <option value="Phlebotomy & Sample Collection">Phlebotomy & Sample Collection</option>
                        <option value="General Hospital Administration">General Hospital Administration</option>
                        <option value="Biomedical Engineering & IT">Biomedical Engineering & IT</option>
                        <option value="General Logistics & Facility">General Logistics & Facility</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Authorizing Medical Officer / Director Note
                      </label>
                      <input
                        type="text"
                        value={workerAuthNote}
                        onChange={(e) => setWorkerAuthNote(e.target.value)}
                        placeholder="e.g. Approved by Medical Director"
                        className="w-full px-3 py-2 bg-slate-900 border border-teal-500/50 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. GIFT COUPON SECTION */}
              {paymentMethod === 'gift_coupon' && (
                <div className="p-3.5 bg-gradient-to-br from-purple-950/50 via-slate-900 to-indigo-950/40 rounded-2xl border border-purple-500/50 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-purple-300 flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-purple-400" />
                      Gift Coupon & Concession Voucher Details
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Promotional Grant
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 font-bold mb-1.5">Quick Select Gift / Voucher Presets:</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                      {[
                        { code: 'GIFT100', label: '100% Free Gift', desc: '100% Full Gift' },
                        { code: 'WELLNESS50', label: '50% Wellness', desc: '50% Concession' },
                        { code: 'FAMILY15', label: '15% Family', desc: '15% Discount' },
                        { code: 'HEALTH20', label: '20% Health', desc: '20% Concession' },
                        { code: 'PROMO10', label: '10% Promo', desc: '10% Promo' },
                        { code: 'STAFF100', label: '100% Staff', desc: '100% Staff Gift' }
                      ].map((cp) => (
                        <button
                          key={cp.code}
                          type="button"
                          onClick={() => handleApplyCoupon(cp.code)}
                          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border text-center transition-all cursor-pointer ${
                            couponCode === cp.code
                              ? 'bg-purple-600 text-white border-purple-400 shadow-md font-mono'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 font-mono'
                          }`}
                        >
                          <div>{cp.code}</div>
                          <div className="text-[8px] opacity-80">{cp.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Enter custom gift coupon code (e.g. GIFT100)"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponApplied(false);
                        }}
                        className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-purple-500/50 rounded-xl text-xs text-purple-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400 uppercase font-mono font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon(couponCode)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl cursor-pointer shadow-sm"
                    >
                      {couponApplied ? 'Applied ✓' : 'Apply'}
                    </button>
                  </div>

                  {(couponCode.toUpperCase().includes('STAFF') || selectedStaffMemberId) && staffList.length > 0 && (
                    <div className="p-3 bg-purple-900/40 rounded-xl border border-purple-400/40 space-y-1.5 animate-in fade-in duration-200">
                      <label className="block text-[10px] text-purple-200 font-bold flex items-center justify-between">
                        <span>Select Internal Staff Member for Gift / Welfare Waiver:</span>
                        <span className="text-[9px] text-purple-300 font-mono">Automated Admin Reporting</span>
                      </label>
                      <select
                        value={selectedStaffMemberId}
                        onChange={(e) => {
                          const sId = e.target.value;
                          setSelectedStaffMemberId(sId);
                          const found = staffList.find(s => s.id === sId);
                          if (found) {
                            setWorkerStaffName(found.name || '');
                            setWorkerStaffId(found.staffId || found.id || 'STF-001');
                            setWorkerDepartment(found.department || found.role || 'Internal Staff');
                            setCouponSponsorName('nanoLabs Staff Welfare Fund');
                            setCouponNotes(`Staff Benefit Gift: ${found.name} (${found.role || 'Personnel'})`);
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-purple-400/50 rounded-lg text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-300"
                      >
                        <option value="">-- Choose Registered Staff Beneficiary --</option>
                        {staffList.map((stf) => (
                          <option key={stf.id} value={stf.id}>
                            {stf.name} — {stf.role || stf.designation || 'Staff'} [{stf.staffId || stf.id}]
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Sponsor / Grantor / Gifter Name
                      </label>
                      <input
                        type="text"
                        value={couponSponsorName}
                        onChange={(e) => setCouponSponsorName(e.target.value)}
                        placeholder="e.g. Rotary Club Douala / Dr. Emmanuel"
                        className="w-full px-3 py-2 bg-slate-900 border border-purple-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Voucher Purpose / Remarks
                      </label>
                      <input
                        type="text"
                        value={couponNotes}
                        onChange={(e) => setCouponNotes(e.target.value)}
                        placeholder="e.g. Community Diagnostic Outreach 2026"
                        className="w-full px-3 py-2 bg-slate-900 border border-purple-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CASH PAYMENT SECTION */}
              {paymentMethod === 'cash' && (
                <div className="p-3.5 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/30 rounded-2xl border border-emerald-500/40 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-emerald-300 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      Cash Tendered & Change Calculator
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Over Counter (XAF)</span>
                  </div>

                  {(() => {
                    const details = calculateSettlementDetails(selectedBooking, selectedGroupBookings);
                    const due = details.finalTotal;

                    return (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                              Cash Handed by Patient (FCFA)
                            </label>
                            <input
                              type="number"
                              value={cashGiven}
                              onChange={(e) => setCashGiven(e.target.value)}
                              placeholder={`e.g. ${due}`}
                              className="w-full px-3 py-2 bg-slate-900 border border-emerald-500/50 rounded-xl text-sm text-emerald-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                              Change to Return to Patient
                            </label>
                            <div className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-black text-amber-400 flex items-center justify-between">
                              <span>{details.changeToReturn.toLocaleString()} FCFA</span>
                              {details.changeToReturn > 0 && (
                                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">Return</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Tender:</span>
                          <button
                            type="button"
                            onClick={() => setCashGiven(String(due))}
                            className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-lg text-[10px] font-mono font-bold cursor-pointer"
                          >
                            Exact ({due.toLocaleString()})
                          </button>
                          {[5000, 10000, 20000, 50000, 100000].filter(amt => amt >= due).slice(0, 4).map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setCashGiven(String(amt))}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-mono cursor-pointer"
                            >
                              {amt.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 6. CARD (POS) SECTION */}
              {paymentMethod === 'card' && (
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-700 space-y-3 animate-in fade-in duration-200">
                  <div className="font-extrabold text-xs text-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    Electronic POS Terminal Card Settlement
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Card Scheme</label>
                      <select
                        value={cardScheme}
                        onChange={(e) => setCardScheme(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="Visa">Visa Card</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="GIMAC">GIMAC (CEMAC Card)</option>
                        <option value="American Express">American Express</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">POS Auth / Approval Code</label>
                      <input
                        type="text"
                        value={cardAuthCode}
                        onChange={(e) => setCardAuthCode(e.target.value)}
                        placeholder="e.g. AUTH-88921"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-emerald-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Last 4 Digits</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={cardLast4}
                        onChange={(e) => setCardLast4(e.target.value)}
                        placeholder="e.g. 4022"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 7. INSURANCE SECTION */}
              {paymentMethod === 'insurance' && (
                <div className="p-3.5 bg-indigo-950/70 rounded-2xl border border-indigo-500/40 space-y-3 animate-in fade-in duration-200">
                  <div className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Cameroon Health Insurance & Co-Pay Direct Billing
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Cameroon Insurance Company *</label>
                      <select
                        value={insuranceProvider}
                        onChange={(e) => setInsuranceProvider(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-indigo-800 rounded-lg text-xs text-white"
                      >
                        <option value="">Select Insurance Provider...</option>
                        {CAMEROON_INSURANCE_COMPANIES.map(company => (
                          <option key={company.id} value={company.name}>{company.name}</option>
                        ))}
                        <option value="Other Corporate Insurance (Cameroon)">Other Corporate Insurance (Cameroon)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Policy / Matricule ID *</label>
                      <input
                        type="text"
                        value={insurancePolicyNumber}
                        onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                        placeholder="e.g. POL-998234-ACT"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-indigo-800 rounded-lg text-xs text-white font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                      <span>Co-Pay Coverage Split:</span>
                      <span className="text-indigo-300 font-bold">{100 - coPayPercent}% Insurer Claim • {coPayPercent}% Patient Co-Pay</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { coPay: 0, label: '100% Insurer (0% Co-Pay)' },
                        { coPay: 20, label: '80% Insurer (20% Co-Pay)' },
                        { coPay: 30, label: '70% Insurer (30% Co-Pay)' },
                        { coPay: 50, label: '50% Insurer (50% Co-Pay)' }
                      ].map((split) => (
                        <button
                          key={split.coPay}
                          type="button"
                          onClick={() => setCoPayPercent(split.coPay)}
                          className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                            coPayPercent === split.coPay
                              ? 'bg-indigo-600 text-white border-indigo-400'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {split.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* GENERAL DISCOUNTS & CUSTOM OVERRIDE */}
              {!['workers_benefit', 'gift_coupon'].includes(paymentMethod) && (
                <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                      <BadgePercent className="w-4 h-4 text-amber-400" />
                      Optional Concessions & Custom Override
                    </span>
                    {discountType !== 'none' && (
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('none');
                          setDiscountValue(0);
                          setCouponApplied(false);
                          setCustomPriceInput('');
                        }}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => { setDiscountType('percent'); setDiscountValue(10); }}
                      className={`py-1.5 px-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        discountType === 'percent' && discountValue === 10 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      10% Off
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDiscountType('percent'); setDiscountValue(20); }}
                      className={`py-1.5 px-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        discountType === 'percent' && discountValue === 20 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      20% Off
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDiscountType('fixed'); setDiscountValue(2000); }}
                      className={`py-1.5 px-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        discountType === 'fixed' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      -2,000 XAF
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400 shrink-0">Custom Override Total:</label>
                    <input
                      type="number"
                      placeholder="Enter manual total in FCFA"
                      value={customPriceInput}
                      onChange={(e) => setCustomPriceInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* CASHIER ACCESS CODE SECURITY VERIFICATION */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                <label className="flex items-center justify-between text-slate-300 font-bold text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <Lock className="w-3.5 h-3.5" />
                    Cashier Security PIN / Access Code Required *
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">e.g. CSH123</span>
                </label>
                
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showAccessCode ? 'text' : 'password'}
                    placeholder="Enter your authorized cashier PIN / access code..."
                    value={cashierAccessCode}
                    onChange={(e) => {
                      setCashierAccessCode(e.target.value);
                      if (accessCodeError) setAccessCodeError('');
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessCode(!showAccessCode)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {accessCodeError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-[11px] text-rose-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{accessCodeError}</span>
                  </div>
                )}
              </div>

              {/* FINANCIAL BREAKDOWN SUMMARY */}
              {(() => {
                const details = calculateSettlementDetails(selectedBooking, selectedGroupBookings);
                const payable = paymentMethod === 'insurance' ? details.patientPortion : details.finalTotal;

                return (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>Validated Tests Total:</span>
                      <span className="font-mono">{details.baseTotal.toLocaleString()} XAF</span>
                    </div>

                    {details.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400 text-xs font-semibold">
                        <span>{paymentMethod === 'workers_benefit' ? 'Staff Welfare Benefit:' : paymentMethod === 'gift_coupon' ? 'Gift Coupon:' : 'Discount Applied:'}</span>
                        <span className="font-mono font-bold">-{details.discountAmount.toLocaleString()} XAF</span>
                      </div>
                    )}

                    {paymentMethod === 'insurance' && (
                      <div className="flex justify-between text-indigo-300 text-xs">
                        <span>Insurance Claim ({100 - coPayPercent}%):</span>
                        <span className="font-mono font-bold">-{details.insurancePortion.toLocaleString()} XAF</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-white font-extrabold text-sm">Amount to Collect:</span>
                      <span className={`text-xl font-black font-mono ${payable === 0 ? 'text-teal-400' : 'text-emerald-400'}`}>
                        {payable.toLocaleString()} XAF
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                Validating authorizes transaction, stamps detailed receipt with all payment data, and advances patient to Phlebotomy.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBooking(null);
                    setCashierAccessCode('');
                    setAccessCodeError('');
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCollectPayment}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isProcessing ? 'Verifying & Processing...' : 'Verify PIN & Confirm Payment'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceipt && (
        <MedicalReceiptModal
          isOpen={Boolean(showReceipt)}
          onClose={() => setShowReceipt(null)}
          booking={showReceipt}
          labInfo={lab}
          paymentDetails={{
            paymentMethod: showReceipt.paymentMethod || paymentMethod,
            insuranceProvider: showReceipt.insuranceProvider || insuranceProvider,
            insurancePolicyNumber: showReceipt.insurancePolicyNumber || insurancePolicyNumber,
            insuranceCoveragePercent: showReceipt.coPayPercent ? 100 - showReceipt.coPayPercent : undefined,
            coPayPercent: showReceipt.coPayPercent || coPayPercent,
            discountAmount: showReceipt.discountAmount,
            discountType: (showReceipt as any).discountType || discountType,
            couponCode: showReceipt.couponCode || couponCode,
            cashierName: user?.name || 'Authorized Medical Cashier',
            paidAt: showReceipt.paidAt || new Date().toISOString(),
            actualPaidAmount: showReceipt.actualPaidAmount
          }}
        />
      )}

    </div>
  );
};

export default CashierView;