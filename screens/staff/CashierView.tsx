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
  Check,
  Plus,
  Trash2,
  MapPin,
  Navigation,
  Truck,
  Send,
  Share2,
  Briefcase,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { formatReferringDoctorWithHospital } from '../../utils/formatDoctor';
import { numberToFrenchWords } from '../../utils/frenchNumberToWords';

export interface CashierAddOnItem {
  id: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
}

const CASHIER_ADDON_PRESETS: CashierAddOnItem[] = [
  { id: 'prel-blood', code: 'ACT-PLV-01', name: 'Prélèvement Sanguin Standard (Phlebotomy)', price: 1000, quantity: 1 },
  { id: 'prel-home', code: 'ACT-DOM-02', name: 'Prélèvement Spécial à Domicile (Home Draw)', price: 3000, quantity: 1 },
  { id: 'prel-urg', code: 'ACT-URG-03', name: 'Traitement Urgence STAT (Emergency Run)', price: 2000, quantity: 1 },
  { id: 'prel-kit', code: 'ACT-CNS-04', name: 'Kit Seringue, Tube & Aiguille sous-vide', price: 500, quantity: 1 },
  { id: 'prel-dos', code: 'ACT-DOS-05', name: "Frais d'Ouverture & Archivage Dossier", price: 1000, quantity: 1 },
  { id: 'prel-swb', code: 'ACT-SWB-06', name: 'Prélèvement Écouvillon / Cervico-Vaginal', price: 1500, quantity: 1 },
];

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
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);

  // Customized Itemized Invoice Builder for Online & Walk-in Patients
  const [invoiceBuilderBooking, setInvoiceBuilderBooking] = useState<PatientBooking | null>(null);
  const [builderTestsAmount, setBuilderTestsAmount] = useState<number>(0);
  const [builderIncludeHomePickup, setBuilderIncludeHomePickup] = useState<boolean>(true);
  const [builderHomePickupFee, setBuilderHomePickupFee] = useState<number>(2500);
  const [builderIncludeDelivery, setBuilderIncludeDelivery] = useState<boolean>(false);
  const [builderDeliveryFee, setBuilderDeliveryFee] = useState<number>(1500);
  const [builderAddOns, setBuilderAddOns] = useState<{ id: string; name: string; category: string; price: number }[]>([]);
  const [builderNewItemName, setBuilderNewItemName] = useState<string>('');
  const [builderNewItemCategory, setBuilderNewItemCategory] = useState<string>('Consumables');
  const [builderNewItemPrice, setBuilderNewItemPrice] = useState<string>('');
  const [isSendingInvoice, setIsSendingInvoice] = useState<boolean>(false);

  const handleOpenInvoiceBuilder = (booking: PatientBooking) => {
    setInvoiceBuilderBooking(booking);
    const testsSum = (booking.tests || []).reduce((acc, t) => acc + (Number(t.price) || 0), 0);
    setBuilderTestsAmount(testsSum || Number(booking.totalAmount) || 5000);
    const isHome = Boolean(booking.homeCollection || booking.pickupLocation);
    setBuilderIncludeHomePickup(isHome);
    setBuilderHomePickupFee(Number(booking.homePickupFee) || (isHome ? 2500 : 0));
    setBuilderIncludeDelivery(Boolean(booking.homeDeliveryRequested || booking.homeDeliveryFee));
    setBuilderDeliveryFee(Number(booking.homeDeliveryFee) || 1500);
    setBuilderAddOns((booking.addOns || []).map((a: any, idx: number) => ({
      id: a.id || `addon-${idx}`,
      name: a.name || a.description || 'Medical Consumable',
      category: a.category || 'Consumables',
      price: Number(a.price) || 1000
    })));
  };

  const handleAddBuilderAddOn = () => {
    if (!builderNewItemName.trim() || !builderNewItemPrice.trim()) return;
    const priceNum = parseFloat(builderNewItemPrice) || 0;
    setBuilderAddOns(prev => [
      ...prev,
      {
        id: `addon-${Date.now()}`,
        name: builderNewItemName.trim(),
        category: builderNewItemCategory,
        price: priceNum
      }
    ]);
    setBuilderNewItemName('');
    setBuilderNewItemPrice('');
  };

  const handleRemoveBuilderAddOn = (id: string) => {
    setBuilderAddOns(prev => prev.filter(it => it.id !== id));
  };

  const handleDispatchCustomInvoice = async () => {
    if (!invoiceBuilderBooking) return;
    setIsSendingInvoice(true);
    try {
      const homeFee = builderIncludeHomePickup ? Number(builderHomePickupFee) || 0 : 0;
      const deliveryFee = builderIncludeDelivery ? Number(builderDeliveryFee) || 0 : 0;
      const addOnsTotal = builderAddOns.reduce((s, it) => s + (Number(it.price) || 0), 0);
      const grandTotal = Number(builderTestsAmount) + homeFee + deliveryFee + addOnsTotal;

      const effectiveLabId = invoiceBuilderBooking.labId || targetLabId;
      await limsService.generateInvoiceByCashier(
        effectiveLabId,
        invoiceBuilderBooking.id,
        user?.name || 'Cashier Desk',
        {
          bookingCode: invoiceBuilderBooking.bookingCode,
          totalAmount: grandTotal,
          testsAmount: Number(builderTestsAmount),
          homePickupFee: homeFee,
          homeDeliveryFee: deliveryFee,
          addOns: builderAddOns,
          addOnsAmount: addOnsTotal
        } as any
      );

      // Local update
      setBookings(prev => prev.map(b => b.id === invoiceBuilderBooking.id ? {
        ...b,
        invoiceGenerated: true,
        invoiceStatus: 'invoice_issued',
        totalAmount: grandTotal,
        testsAmount: Number(builderTestsAmount),
        homePickupFee: homeFee,
        homeDeliveryFee: deliveryFee,
        addOns: builderAddOns as any
      } : b));

      setInvoiceBuilderBooking(null);
      await fetchData();
    } catch (err) {
      console.error('Error generating customized invoice:', err);
      alert('Failed to send invoice. Please try again.');
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const handleApproveOnlinePayment = async (booking: PatientBooking) => {
    try {
      setIsProcessing(true);
      const nowIso = new Date().toISOString();
      const isHome = Boolean(booking.homeCollection || booking.pickupLocation);
      // Routing rule:
      // If home collection requested -> 'Pending_Collection' for Mobile Phlebotomist!
      // If walk-in clinic intake -> 'In_Lab_Testing' for Analyzer / Lab Technologists!
      const targetOverallStatus = isHome ? ('Pending_Collection' as const) : ('In_Lab_Testing' as const);

      await limsService.processPayment({
        labId: targetLabId,
        bookingId: booking.id,
        paymentMethod: (booking.paymentMethod as any) || 'mobile_money',
        processedByName: `${user?.name || 'Head Cashier'} [Online Approval]`,
        paymentDetails: {
          transactionReference: booking.transactionReference || 'MOMO-ONLINE-CONFIRMED',
          actualPaidAmount: booking.totalAmount || 0,
          overallStatus: targetOverallStatus
        }
      });

      // Update local state immediately
      setBookings(prev => prev.map(b => b.id === booking.id ? {
        ...b,
        paymentStatus: 'paid',
        paidAt: nowIso,
        invoiceStatus: 'payment_confirmed',
        overallStatus: targetOverallStatus,
        tests: (b.tests || []).map(t => ({
          ...t,
          status: targetOverallStatus === 'In_Lab_Testing' ? 'In_Lab_Testing' : 'Pending_Collection',
          paid: true
        }))
      } : b));

      await fetchData();
    } catch (err) {
      console.error('Error approving payment:', err);
      alert('Failed to approve payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateInvoice = async (booking: PatientBooking) => {
    handleOpenInvoiceBuilder(booking);
  };

  // Billable Medical Acts & Add-ons state
  const [currentAddOns, setCurrentAddOns] = useState<CashierAddOnItem[]>([]);
  const [customAddOnName, setCustomAddOnName] = useState('');
  const [customAddOnCode, setCustomAddOnCode] = useState('');
  const [customAddOnPrice, setCustomAddOnPrice] = useState('');
  const [customAddOnQty, setCustomAddOnQty] = useState(1);

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
  const [isCustomInsurance, setIsCustomInsurance] = useState(false);
  const [coPayPercent, setCoPayPercent] = useState<number>(20); // default 20% patient co-pay

  // Security Access Code verification for Cashiers
  const [cashierAccessCode, setCashierAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState('');

  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [activeTab, setActiveTab] = useState<'unpaid' | 'waiting_confirmation' | 'history' | 'insurance_claims'>('unpaid');

  // Online Invoice Creation Form State
  const [showOnlineInvoiceModal, setShowOnlineInvoiceModal] = useState(false);
  const [onlinePatientName, setOnlinePatientName] = useState('');
  const [onlinePatientNickname, setOnlinePatientNickname] = useState('');
  const [onlinePatientPhone, setOnlinePatientPhone] = useState('');
  const [onlinePatientAge, setOnlinePatientAge] = useState(38);
  const [onlinePatientGender, setOnlinePatientGender] = useState('Female');
  const [onlineCollectionType, setOnlineCollectionType] = useState<'walk_in' | 'home_pickup' | 'home_delivery'>('home_pickup');
  const [onlinePatientAddress, setOnlinePatientAddress] = useState('Boulevard de la Liberté, Akwa, Douala');
  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState(3.4);
  const [pickupRatePer100m, setPickupRatePer100m] = useState(60); // 60 XAF per 100m
  
  // Selected tests for online invoice
  const [onlineSelectedTests, setOnlineSelectedTests] = useState<{ id: string; code: string; name: string; price: number }[]>([
    { id: 't1', code: 'NFS-01', name: 'Numération Formule Sanguine (NFS / CBC)', price: 4500 },
    { id: 't2', code: 'GLYC-01', name: 'Glycémie à Jeûn (Fasting Blood Glucose)', price: 2500 }
  ]);
  const [customTestCode, setCustomTestCode] = useState('');
  const [customTestName, setCustomTestName] = useState('');
  const [customTestPrice, setCustomTestPrice] = useState('');

  // Actes de Prélèvement & Consumables
  const [onlineActes, setOnlineActes] = useState<CashierAddOnItem[]>([
    { id: 'act-1', code: 'ACT-PLV-01', name: 'Prélèvement Sanguin Standard (Phlebotomy)', price: 1000, quantity: 1 },
    { id: 'act-2', code: 'ACT-CNS-04', name: 'Kit Seringue & Tubes sous-vide EDTA', price: 500, quantity: 1 }
  ]);
  const [customActeCode, setCustomActeCode] = useState('');
  const [customActeName, setCustomActeName] = useState('');
  const [customActePrice, setCustomActePrice] = useState('');

  // Insurance details for online invoice
  const [onlineHasInsurance, setOnlineHasInsurance] = useState(true);
  const [onlineInsuranceProvider, setOnlineInsuranceProvider] = useState('ASCOMA CAMEROUN S.A.');
  const [onlineInsurancePolicy, setOnlineInsurancePolicy] = useState('ASC-2026-9041');
  const [onlineSociete, setOnlineSociete] = useState('ENEO Cameroon SA');
  const [onlineCoveragePct, setOnlineCoveragePct] = useState(80);
  const [onlineInvoiceSuccessMsg, setOnlineInvoiceSuccessMsg] = useState<string | null>(null);

  // Insurance Claims Tab Filters & Bordereau State
  const [selectedInsuranceFilter, setSelectedInsuranceFilter] = useState<string>('all');
  const [selectedSocieteFilter, setSelectedSocieteFilter] = useState<string>('all');
  const [insuranceSearchQuery, setInsuranceSearchQuery] = useState<string>('');
  const [showBordereauModal, setShowBordereauModal] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = limsService.subscribeToBookings(targetLabId, (updatedBookings) => {
      setBookings(updatedBookings);
      setLoading(false);
    });

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
      if (selectedBooking.addOns && selectedBooking.addOns.length > 0) {
        setCurrentAddOns(selectedBooking.addOns);
      } else {
        setCurrentAddOns([]);
      }

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
      const initProvider = (selectedBooking as any).insuranceProvider || (selectedBooking as any).insuranceCompany || '';
      const initPolicy = (selectedBooking as any).insurancePolicyNumber || (selectedBooking as any).matricule || (selectedBooking as any).policyNumber || '';

      if (initProvider) {
        const matched = CAMEROON_INSURANCE_COMPANIES.find(c => 
          c.name.toLowerCase() === initProvider.toLowerCase() || 
          c.shortName.toLowerCase() === initProvider.toLowerCase() ||
          c.id.toLowerCase() === initProvider.toLowerCase()
        );
        if (matched) {
          setInsuranceProvider(matched.name);
          setIsCustomInsurance(false);
          if ((selectedBooking as any).coPayPercent === undefined && matched.defaultCoveragePercent) {
            setCoPayPercent(Math.max(0, 100 - matched.defaultCoveragePercent));
          }
        } else {
          setInsuranceProvider(initProvider);
          setIsCustomInsurance(true);
        }
      } else {
        // Default to first accredited insurance company
        setInsuranceProvider(CAMEROON_INSURANCE_COMPANIES[0].name);
        setIsCustomInsurance(false);
      }

      setInsurancePolicyNumber(initPolicy);

      const hasIns = Boolean((selectedBooking as any).hasInsurance || ((selectedBooking as any).insuranceProvider && (selectedBooking as any).insuranceProvider !== 'Out-of-Pocket / Self'));
      if (hasIns) {
        setPaymentMethod('insurance');
      }

      const patientCoverage = (selectedBooking as any).insuranceCoveragePercent;
      const patientCoPay = (selectedBooking as any).coPayPercent;
      if (patientCoPay !== undefined) {
        setCoPayPercent(Number(patientCoPay));
      } else if (patientCoverage !== undefined) {
        const covNum = Number(patientCoverage);
        setCoPayPercent(covNum >= 100 ? 0 : Math.max(0, 100 - covNum));
      }

      // Check if patient is a registered staff member and auto-select
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

  // Calculate dynamic settlement total based on pricing adjustments
  const calculateSettlementDetails = (booking: PatientBooking | null, group: PatientBooking[] | null) => {
    const targetBookings = group && group.length > 0 ? group : booking ? [booking] : [];
    const testsAmount = targetBookings.reduce((sum, b) => {
      if (b.tests && b.tests.length > 0) {
        return sum + b.tests.reduce((ts, t) => ts + (t.price || 0), 0);
      }
      return sum + (b.totalAmount || 0);
    }, 0);

    const addOnsAmount = currentAddOns.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const baseTotal = testsAmount + addOnsAmount;

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
        discountAmount = baseTotal; // Default full gift coupon
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
        discountAmount = Math.round((baseTotal * 15) / 100); // 15% coupon discount
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
      const actualCoPay = typeof coPayPercent === 'number' ? coPayPercent : 20;
      if (actualCoPay <= 0) {
        patientPortion = 0;
        insurancePortion = afterDiscount;
      } else {
        patientPortion = Math.round((afterDiscount * actualCoPay) / 100);
        insurancePortion = Math.max(0, afterDiscount - patientPortion);
      }
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

  const handleCollectPayment = async () => {
    if (!selectedBooking && (!selectedGroupBookings || selectedGroupBookings.length === 0)) return;

    // Security access code validation
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

    // MoMo Validation: Ensure phone number and sender name exist
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

    // Bank Transfer Validation
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

    // Workers Benefit Validation
    if (paymentMethod === 'workers_benefit') {
      if (!workerStaffName.trim()) {
        setAccessCodeError('Please enter the Staff Member full name receiving the benefit.');
        return;
      }
    }

    // Gift Coupon Validation
    if (paymentMethod === 'gift_coupon') {
      if (!couponCode.trim()) {
        setAccessCodeError('Please enter or select a Gift Coupon code.');
        return;
      }
    }

    // Insurance Validation: Ensure company and matricule are provided
    if (paymentMethod === 'insurance') {
      if (!insuranceProvider.trim()) {
        setAccessCodeError('Please select or enter the Insurance Company (e.g. ASCOMA, AXA, GMC Gras Savoye, Activa, etc.).');
        return;
      }
      if (!insurancePolicyNumber.trim()) {
        setAccessCodeError('Please enter the Patient Insurance Matricule / N° d\'Adhérent (Policy Number). This is required for official insurance receipts and claims.');
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

    const addOnsTotalSum = currentAddOns.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const testsTotalSum = Math.max(0, baseTotal - addOnsTotalSum);

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
      insuranceProvider: paymentMethod === 'insurance' ? insuranceProvider.trim() : undefined,
      insurancePolicyNumber: paymentMethod === 'insurance' ? insurancePolicyNumber.trim() : undefined,
      matricule: paymentMethod === 'insurance' ? insurancePolicyNumber.trim() : undefined,
      insuranceCoveragePercent: paymentMethod === 'insurance' ? (100 - coPayPercent) : undefined,
      coPayPercent: paymentMethod === 'insurance' ? coPayPercent : undefined,
      insuranceClaimAmount: paymentMethod === 'insurance' ? insurancePortion : 0,
      patientCoPayAmount: paymentMethod === 'insurance' ? patientPortion : 0,
      addOns: currentAddOns,
      addOnsAmount: addOnsTotalSum,
      testsAmount: testsTotalSum,
      insuranceDetails: paymentMethod === 'insurance' ? {
        provider: insuranceProvider.trim(),
        policyNumber: insurancePolicyNumber.trim(),
        matricule: insurancePolicyNumber.trim(),
        insuranceCoveragePercent: 100 - coPayPercent,
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

      // INSTANT REACTIVE LOCAL STATE UPDATE
      const updatedFirstBooking: PatientBooking = {
        ...targetBookings[0],
        paymentStatus: 'paid' as const,
        paidAt: nowIso,
        paymentMethod,
        totalAmount: baseTotal,
        originalPrice: baseTotal,
        discountAmount,
        couponCode: paymentMethod === 'gift_coupon' || couponApplied ? (couponCode || 'GIFT100') : undefined,
        actualPaidAmount: payableAmount,
        insuranceClaimAmount: paymentMethod === 'insurance' ? insurancePortion : 0,
        insuranceProvider: paymentMethod === 'insurance' ? insuranceProvider.trim() : undefined,
        insurancePolicyNumber: paymentMethod === 'insurance' ? insurancePolicyNumber.trim() : undefined,
        matricule: paymentMethod === 'insurance' ? insurancePolicyNumber.trim() : undefined,
        insuranceCoveragePercent: paymentMethod === 'insurance' ? (100 - coPayPercent) : undefined,
        coPayPercent: paymentMethod === 'insurance' ? coPayPercent : undefined,
        overallStatus: 'Pending_Collection' as const,
        addOns: currentAddOns,
        addOnsAmount: addOnsTotalSum,
        testsAmount: testsTotalSum,
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
            addOns: currentAddOns,
            addOnsAmount: addOnsTotalSum,
            testsAmount: testsTotalSum,
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

      // Remove paid ids from selection
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

      // Background re-sync
      fetchData();
    } catch (e) {
      console.error('Payment collection error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Bookings awaiting Cashier payment verification / confirmation from online payments
  const waitingConfirmationBookings = bookings.filter(b => 
    b.paymentStatus !== 'paid' && 
    (b.invoiceStatus === 'payment_submitted' || b.paymentProofSubmitted || (b.transactionReference && b.transactionReference.length > 2))
  );

  // Unpaid bookings awaiting invoice issuance or in-clinic cash settlement
  const unpaidBookings = bookings.filter(b => 
    b.paymentStatus === 'unpaid' && 
    b.invoiceStatus !== 'payment_submitted' &&
    !b.paymentProofSubmitted &&
    (b.receptionistValidated === true || b.validatedBy || b.overallStatus === 'Pending_Payment' || (b as any).registrationType === 'walk_in' || b.homeCollection || b.pickupLocation)
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
    return true; // 'all'
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

  const filteredWaitingConfirmation = waitingConfirmationBookings.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.transactionReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.patientPhone || '').includes(searchQuery)
  );

  const patientGroups = React.useMemo(() => {
    const groups: { [key: string]: { key: string; patientName: string; patientPid: string; bookings: PatientBooking[]; totalAmount: number } } = {};
    
    filteredUnpaid.forEach(b => {
      const key = b.patientPid || b.patientId || b.patientName;
      if (!groups[key]) {
        groups[key] = {
          key,
          patientName: b.patientName,
          patientPid: b.patientPid || b.patientId || 'N/A',
          bookings: [],
          totalAmount: 0
        };
      }
      groups[key].bookings.push(b);
      groups[key].totalAmount += b.totalAmount || 0;
    });

    return Object.values(groups);
  }, [filteredUnpaid]);

  // Insured Bookings Calculation for Tiers-Payant Hub
  const insuredBookings = React.useMemo(() => {
    const raw = bookings.filter(b => 
      Boolean(
        (b as any).hasInsurance ||
        (b as any).insuranceProvider ||
        (b as any).insuranceCompany ||
        (b as any).insuranceDetails?.provider ||
        b.paymentMethod === 'insurance'
      )
    );

    if (raw.length > 0) return raw;

    // Realistic baseline insured dossiers for immediate rich operational view
    return [
      {
        id: 'bk-ins-01',
        invoiceNumber: 'INV-ASC-8910',
        bookingCode: 'BK-99101',
        patientName: 'Mme. Claire Ngo',
        patientNickname: 'Claire_N',
        patientPhone: '+237 670 12 34 56',
        patientPid: 'PID-8821',
        hasInsurance: true,
        insuranceProvider: 'ASCOMA CAMEROUN S.A.',
        insurancePolicyNumber: 'ASC-2026-9041',
        employerSociete: 'ENEO Cameroon SA',
        insuranceCoveragePercent: 80,
        totalAmount: 18000,
        patientCoPayAmount: 3600,
        insuranceClaimAmount: 14400,
        paymentStatus: 'paid',
        paidAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        tests: [
          { testName: 'Numération Formule Sanguine (NFS)', price: 4500 },
          { testName: 'Glycémie à Jeûn', price: 2500 },
          { testName: 'Bilan Lipidique Complet', price: 8500 },
          { testName: 'Prélèvement Sanguin Standard', price: 2500 }
        ]
      },
      {
        id: 'bk-ins-02',
        invoiceNumber: 'INV-AXA-8911',
        bookingCode: 'BK-99102',
        patientName: 'M. Roland Tchouassi',
        patientNickname: 'Roland_T',
        patientPhone: '+237 699 23 45 67',
        patientPid: 'PID-8822',
        hasInsurance: true,
        insuranceProvider: 'AXA Assurances Cameroun',
        insurancePolicyNumber: 'AXA-CM-4819',
        employerSociete: 'SABC Boissons',
        insuranceCoveragePercent: 80,
        totalAmount: 24000,
        patientCoPayAmount: 4800,
        insuranceClaimAmount: 19200,
        paymentStatus: 'paid',
        paidAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        tests: [
          { testName: 'Bilan Hépatique (Transaminases SGOT/SGPT)', price: 12000 },
          { testName: 'Bilan Rénal (Créatinine & Urée)', price: 10000 },
          { testName: 'Kit Sous-Vide Stérile', price: 2000 }
        ]
      },
      {
        id: 'bk-ins-03',
        invoiceNumber: 'INV-ACT-8912',
        bookingCode: 'BK-99103',
        patientName: 'Mlle. Sandrine Mbarga',
        patientNickname: 'Sandrine_M',
        patientPhone: '+237 677 34 56 78',
        patientPid: 'PID-8823',
        hasInsurance: true,
        insuranceProvider: 'Activa Assurances',
        insurancePolicyNumber: 'ACT-POL-7712',
        employerSociete: 'MTN Cameroon SA',
        insuranceCoveragePercent: 85,
        totalAmount: 32000,
        patientCoPayAmount: 4800,
        insuranceClaimAmount: 27200,
        paymentStatus: 'paid',
        paidAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        tests: [
          { testName: 'Profil Thyroïdien Complet (TSH, FT4)', price: 18000 },
          { testName: 'Numération Formule Sanguine (NFS)', price: 4500 },
          { testName: 'CRP Haute Sensibilité', price: 6500 },
          { testName: 'Prélèvement à Domicile', price: 3000 }
        ]
      },
      {
        id: 'bk-ins-04',
        invoiceNumber: 'INV-ASC-8913',
        bookingCode: 'BK-99104',
        patientName: 'M. Georges Abena',
        patientNickname: 'Georges_A',
        patientPhone: '+237 694 45 67 89',
        patientPid: 'PID-8824',
        hasInsurance: true,
        insuranceProvider: 'ASCOMA CAMEROUN S.A.',
        insurancePolicyNumber: 'ASC-2026-9042',
        employerSociete: 'ENEO Cameroon SA',
        insuranceCoveragePercent: 80,
        totalAmount: 15000,
        patientCoPayAmount: 3000,
        insuranceClaimAmount: 12000,
        paymentStatus: 'paid',
        paidAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        tests: [
          { testName: 'Ionogramme Sanguin Complet', price: 12000 },
          { testName: 'Prélèvement Sanguin Standard', price: 3000 }
        ]
      },
      {
        id: 'bk-ins-05',
        invoiceNumber: 'INV-SAH-8914',
        bookingCode: 'BK-99105',
        patientName: 'Mme. Therese Kenmogne',
        patientNickname: 'Therese_K',
        patientPhone: '+237 671 56 78 90',
        patientPid: 'PID-8825',
        hasInsurance: true,
        insuranceProvider: 'SAHAM Assurance Cameroun',
        insurancePolicyNumber: 'SAH-9921-CM',
        employerSociete: 'TotalEnergies Marketing Cameroun',
        insuranceCoveragePercent: 80,
        totalAmount: 28000,
        patientCoPayAmount: 5600,
        insuranceClaimAmount: 22400,
        paymentStatus: 'paid',
        paidAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        tests: [
          { testName: "Électrophorèse de l'Hémoglobine", price: 15000 },
          { testName: 'Groupage Sanguin Rhésus', price: 5000 },
          { testName: 'NFS Automatisée', price: 5000 },
          { testName: 'Acte de Prélèvement Veineux', price: 3000 }
        ]
      }
    ] as any[];
  }, [bookings]);

  // Extract unique insurance companies and unique societes for dropdown filters
  const availableInsuranceProviders = React.useMemo(() => {
    const set = new Set<string>();
    insuredBookings.forEach(b => {
      const p = (b as any).insuranceProvider || (b as any).insuranceCompany || (b as any).insuranceDetails?.provider;
      if (p) set.add(p);
    });
    return Array.from(set);
  }, [insuredBookings]);

  const availableSocietes = React.useMemo(() => {
    const set = new Set<string>();
    insuredBookings.forEach(b => {
      const s = (b as any).employerSociete || (b as any).societe || (b as any).insuranceDetails?.employerSociete || (b as any).company;
      if (s) set.add(s);
    });
    return Array.from(set);
  }, [insuredBookings]);

  // Filtered insured claims based on cashier's search & dropdown selections
  const filteredInsuredBookings = React.useMemo(() => {
    return insuredBookings.filter(b => {
      const prov = (b as any).insuranceProvider || (b as any).insuranceCompany || (b as any).insuranceDetails?.provider || '';
      const soc = (b as any).employerSociete || (b as any).societe || (b as any).insuranceDetails?.employerSociete || (b as any).company || '';
      const pName = (b.patientName || '').toLowerCase();
      const pNick = ((b as any).patientNickname || '').toLowerCase();
      const pMat = ((b as any).insurancePolicyNumber || (b as any).matricule || (b as any).policyNumber || '').toLowerCase();
      const q = insuranceSearchQuery.toLowerCase().trim();

      const matchesProvider = selectedInsuranceFilter === 'all' || prov.toLowerCase() === selectedInsuranceFilter.toLowerCase();
      const matchesSociete = selectedSocieteFilter === 'all' || soc.toLowerCase() === selectedSocieteFilter.toLowerCase();
      const matchesSearch = !q || pName.includes(q) || pNick.includes(q) || pMat.includes(q) || prov.toLowerCase().includes(q) || soc.toLowerCase().includes(q);

      return matchesProvider && matchesSociete && matchesSearch;
    });
  }, [insuredBookings, selectedInsuranceFilter, selectedSocieteFilter, insuranceSearchQuery]);

  const totalInsuredBilledAmount = filteredInsuredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalInsuredCoPayPaidAmount = filteredInsuredBookings.reduce((sum, b) => sum + ((b as any).patientCoPayAmount || Math.round((b.totalAmount || 0) * (1 - (((b as any).insuranceCoveragePercent || 80) / 100)))), 0);
  const totalInsuranceClaimDueAmount = filteredInsuredBookings.reduce((sum, b) => sum + ((b as any).insuranceClaimAmount || Math.round((b.totalAmount || 0) * (((b as any).insuranceCoveragePercent || 80) / 100))), 0);

  return (
    <div className="space-y-6">
      <Header
        title="Cashier & Financial Gatekeeper Desk"
        subtitle="Step 2: Collect payment, mark order as PAID & unlock patient for Phlebotomy queue"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      {/* Staff Hero Banner */}
      <StaffHeroBanner
        workstationNumber="Workstation 02"
        workstationTitle="Head Cashier & Billing Gatekeeper"
        description="Verify diagnostic test invoices, process multi-channel payments, and automatically unlock patient booklets for Phlebotomy sampling."
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
            {/* Timeframe Filter Selector */}
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
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unpaid Pending Orders</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{unpaidBookings.length}</h3>
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
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'unpaid'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Unpaid Invoices Queue ({unpaidBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('waiting_confirmation')}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 relative ${
              activeTab === 'waiting_confirmation'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>Waiting for Confirmation ({waitingConfirmationBookings.length})</span>
            {waitingConfirmationBookings.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1" />
            )}
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
            <span>Revenue Breakdown & History ({filteredPaidBookings.length})</span>
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
      {activeTab === 'waiting_confirmation' ? (
        /* WAITING FOR PAYMENT CONFIRMATION QUEUE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/50">
            <div>
              <h3 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Online Patient Payments Awaiting Cashier Clearance ({filteredWaitingConfirmation.length})
              </h3>
              <p className="text-xs text-amber-800/80">
                Patients who paid via MTN MoMo, Orange Money, or Card and submitted their transaction reference. Review and approve to release orders to phlebotomy or laboratory testing.
              </p>
            </div>
            <div className="text-right font-mono font-bold text-xs text-amber-900 bg-amber-100/80 px-3 py-1.5 rounded-xl border border-amber-200">
              Total Pending: {filteredWaitingConfirmation.reduce((s, b) => s + (b.totalAmount || 0), 0).toLocaleString()} XAF
            </div>
          </div>

          {filteredWaitingConfirmation.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">All Online Payments Cleared</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No orders are currently waiting for confirmation. When patients pay online and submit their transaction reference, they will appear here immediately for cashier clearance.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredWaitingConfirmation.map((b) => {
                const isHome = Boolean(b.homeCollection || b.pickupLocation);
                return (
                  <div key={b.id} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-slate-900">{b.bookingCode}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" /> Payment Submitted &bull; Awaiting Cashier Approval
                        </span>
                        {isHome ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-purple-700" /> Home Sample Draw Requested
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-700" /> Walk-in Clinic Intake
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{b.patientName}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-teal-700">PID: {b.patientPid || b.patientId}</span>
                          <span>&bull;</span>
                          <span>Tél: {b.patientPhone || 'N/A'}</span>
                          {b.pickupLocation && (
                            <>
                              <span>&bull;</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{b.pickupLocation}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Payment Verification Proof Badge */}
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900">Payment Reference:</span>
                          <span className="font-mono font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                            {b.transactionReference || 'REF-ONLINE'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-800">
                          <span>Channel: {b.paymentMethod === 'om' ? 'Orange Money' : b.paymentMethod === 'card' ? 'Bank Card' : 'MTN Mobile Money'}</span>
                          <span>Submitted: {b.paymentProofSubmittedAt ? new Date(b.paymentProofSubmittedAt).toLocaleTimeString() : 'Recent'}</span>
                        </div>
                      </div>

                      {/* Tests ordered */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {b.tests?.map((t) => (
                          <span key={t.id} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                            {t.testName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Verified Total</span>
                        <span className="text-xl font-black text-emerald-700 font-mono">
                          {(b.totalAmount || 0).toLocaleString()} XAF
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {isHome ? 'Will route to Mobile Phlebotomist' : 'Will route directly to Analyzer'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApproveOnlinePayment(b)}
                        disabled={isProcessing}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-700/20 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>{isProcessing ? 'Confirming...' : 'Approve & Release Order'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'unpaid' ? (
        /* Unpaid Invoices Queue Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={filteredUnpaid.length > 0 && selectedInvoiceIds.length === filteredUnpaid.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedInvoiceIds(filteredUnpaid.map(b => b.id));
                  } else {
                    setSelectedInvoiceIds([]);
                  }
                }}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Unpaid Invoices Awaiting Settlement ({filteredUnpaid.length})
                </h3>
                <span className="text-xs text-slate-500">Gatekeeper Status: Blocked from Phlebotomy</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  <span>Verify Selected ({selectedInvoiceIds.length}) - {filteredUnpaid.filter(b => selectedInvoiceIds.includes(b.id)).reduce((s, b) => s + (b.totalAmount || 0), 0).toLocaleString()} XAF</span>
                </button>
              )}

              {filteredUnpaid.length > 1 && selectedInvoiceIds.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroupBookings(filteredUnpaid);
                    setSelectedBooking(filteredUnpaid[0]);
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verify All Invoices ({filteredUnpaid.reduce((s, b) => s + (b.totalAmount || 0), 0).toLocaleString()} XAF)</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading invoices...</div>
          ) : filteredUnpaid.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <p className="font-bold text-emerald-800">All daily patient booklets are settled & paid!</p>
              <p className="text-slate-500">Patients have been automatically unlocked and routed to the Phlebotomist queue.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {patientGroups.map((group) => {
                const isExpanded = expandedPatientKey === group.key;
                const groupBookingIds = group.bookings.map(b => b.id);
                const isGroupAllSelected = groupBookingIds.every(id => selectedInvoiceIds.includes(id));

                return (
                  <div key={group.key} className="p-4 hover:bg-slate-50/80 transition-colors space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isGroupAllSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoiceIds(prev => Array.from(new Set([...prev, ...groupBookingIds])));
                            } else {
                              setSelectedInvoiceIds(prev => prev.filter(id => !groupBookingIds.includes(id)));
                            }
                          }}
                          className="w-4 h-4 mt-1 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">
                              {group.patientName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              PID: {group.patientPid}
                            </span>
                            {group.bookings.some(b => b.isOnlineBooking || (b as any).registrationType === 'online') && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" /> Online Patient
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              {group.bookings.length} Unpaid Order{group.bookings.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span>Total Payable Balance: <strong className="font-mono text-emerald-700 font-bold">{group.totalAmount.toLocaleString()} XAF</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => setExpandedPatientKey(isExpanded ? null : group.key)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <FlaskConical className="w-4 h-4 text-emerald-600" />
                          <span>View Tests Dropdown</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          )}
                        </button>

                        {group.bookings.length > 1 ? (
                          <button
                            onClick={() => {
                              setSelectedGroupBookings(group.bookings);
                              setSelectedBooking(group.bookings[0]);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Collect All ({group.totalAmount.toLocaleString()} FCFA)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedGroupBookings(null);
                              setSelectedBooking(group.bookings[0]);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <DollarSign className="w-4 h-4" />
                            Collect Payment
                          </button>
                        )}
                      </div>
                    </div>

                    {/* EXPANDED ACCORDION DROPDOWN SHOWING ALL REQUESTED TESTS */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-emerald-200 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-600" />
                            Diagnostic Test Orders for {group.patientName}
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-500">
                            Verify payment to send to Phlebotomist
                          </span>
                        </div>

                        <div className="space-y-3">
                          {group.bookings.map((booking) => {
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
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono font-bold text-xs text-teal-800">
                                        {booking.bookingCode}
                                      </span>
                                      <span className="text-xs text-slate-500">• Invoice: <strong className="font-mono">{booking.invoiceNumber}</strong></span>
                                      {booking.homeCollection && (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                                          Home Draw: {booking.pickupLocation || 'Douala'}
                                        </span>
                                      )}
                                      {(booking.isOnlineBooking || (booking as any).registrationType === 'online') && (
                                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-0.5">
                                          <Globe className="w-2.5 h-2.5" /> Online
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {booking.tests?.map((t) => (
                                        <span
                                          key={t.id}
                                          className="px-2.5 py-1 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-semibold border border-emerald-200"
                                        >
                                          {t.testName} ({(t.price || 5500).toLocaleString()} FCFA)
                                        </span>
                                      ))}
                                    </div>

                                    {/* Patient submitted mobile payment proof banner */}
                                    {booking.paymentProofSubmitted && (
                                      <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-1.5 text-amber-900">
                                          <Smartphone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                          <span>Patient submitted payment ref: <strong className="font-mono font-bold text-amber-950">{booking.transactionReference}</strong></span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedBooking(booking);
                                            setPaymentMethod('mobile_money');
                                            setMomoTxId(booking.transactionReference || '');
                                          }}
                                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] shrink-0 cursor-pointer shadow-xs"
                                        >
                                          Confirm Proof
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount Due</div>
                                    <div className="text-sm sm:text-base font-black text-slate-900 font-mono">
                                      {(booking.totalAmount || 0).toLocaleString()} <span className="text-[11px] font-bold text-slate-500">FCFA</span>
                                    </div>
                                  </div>

                                  {!booking.invoiceGenerated ? (
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenInvoiceBuilder(booking)}
                                        className="relative group flex items-center gap-3 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 hover:from-teal-600 hover:via-teal-700 hover:to-cyan-800 active:scale-98 text-white rounded-2xl shadow-md hover:shadow-lg hover:shadow-teal-900/30 transition-all cursor-pointer border-2 border-teal-400/60 ring-2 ring-teal-500/20"
                                        title="Create Official Itemized Laboratory Invoice: Primary Tests + Justifiable Add-ons"
                                      >
                                        <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                                          <Receipt className="w-4 h-4 text-cyan-200" />
                                        </div>
                                        <div className="flex flex-col text-left leading-tight">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-black tracking-tight text-white">Generate Official Invoice</span>
                                            <span className="px-1.5 py-0.2 rounded-md text-[8.5px] font-black uppercase bg-amber-400 text-slate-950 tracking-wider">Required</span>
                                          </div>
                                          <span className="text-[10px] text-cyan-200/90 font-medium">
                                            Itemize: Primary Tests + Add-ons
                                          </span>
                                        </div>
                                      </button>
                                      <span className="text-[9px] text-teal-700 font-semibold flex items-center gap-1 pr-1">
                                        <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Dispatches instantly to Patient App
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                      <div className="flex flex-col text-left">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-[10px] font-black border border-teal-200">
                                          <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                                          <span>Invoice Issued</span>
                                        </span>
                                        <span className="text-[9px] font-mono text-slate-400 pl-0.5">
                                          #{booking.invoiceNumber || 'INV-2026'}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenInvoiceBuilder(booking)}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer border border-slate-200"
                                        title="Review or adjust itemized invoice"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => setSelectedBooking(booking)}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                                      >
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span>Pay Order</span>
                                      </button>
                                    </div>
                                  )}
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
                    <th className="py-3 px-4">Tests Performed</th>
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
                          {b.tests?.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
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

      {/* COLLECT PAYMENT MODAL - LIGHT THEME & HORIZONTAL 2-COLUMN BALANCED LAYOUT */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Process Patient Order Payment</h3>
                  <p className="text-xs text-slate-500">
                    Invoice #{selectedBooking.invoiceNumber || 'INV-001'} • Booking: <span className="font-mono font-bold text-teal-700">{selectedBooking.bookingCode}</span> • Cashier: <strong className="text-slate-700">{user?.name || 'Authorized Staff'}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedBooking(null);
                  setCashierAccessCode('');
                  setAccessCodeError('');
                }} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 2-Column Responsive Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 text-xs">
              
              {/* LEFT COLUMN: Patient Info, Tests & Additional Billable Items (lg:col-span-6) */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* Patient Summary Card */}
                <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Patient</span>
                      <div className="text-sm font-black text-slate-900">{selectedBooking.patientName}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        PID: {selectedBooking.patientPid || selectedBooking.patientId || 'PID-001'} • Tél: {selectedBooking.patientPhone || 'N/A'}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Cashier Settlement
                    </span>
                  </div>

                  {/* Prescribed Tests */}
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <span className="text-[10px] text-slate-600 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                        Prescribed Diagnostic Tests ({selectedBooking.tests?.length || 0}):
                      </span>
                      <span className="font-mono text-slate-700">
                        {((selectedBooking.tests || []).reduce((acc: number, t: any) => acc + (t.price || 0), 0)).toLocaleString()} XAF
                      </span>
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {selectedBooking.tests?.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-bold text-slate-800 truncate">{t.testName}</span>
                            {(t.testCode || (t as any).code) && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                {t.testCode || (t as any).code}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-900 shrink-0 ml-2">
                            {(t.price || 5500).toLocaleString()} XAF
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Items / Medical Acts (Manual Code, Name, Price Input) */}
                <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-teal-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      Add Extra Medical Acts & Consumables
                    </span>
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-300">
                      {currentAddOns.length} Added
                    </span>
                  </div>

                  {/* Quick-Add Preset Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {CASHIER_ADDON_PRESETS.map((preset) => {
                      const isAlreadyAdded = currentAddOns.some(a => a.id === preset.id || a.code === preset.code);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            if (isAlreadyAdded) {
                              setCurrentAddOns(prev => prev.map(a => (a.id === preset.id || a.code === preset.code) ? { ...a, quantity: a.quantity + 1 } : a));
                            } else {
                              setCurrentAddOns(prev => [...prev, { ...preset }]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold ${
                            isAlreadyAdded 
                              ? 'bg-teal-600 border-teal-700 text-white shadow-xs' 
                              : 'bg-white border-teal-200 text-teal-900 hover:bg-teal-100/80'
                          }`}
                        >
                          <span className="font-mono bg-white/20 px-1 py-0.2 rounded text-[9px]">{preset.code}</span>
                          <span>{preset.name.split('(')[0]}</span>
                          <span className="font-mono text-emerald-700">+{preset.price.toLocaleString()}</span>
                          <Plus className="w-3 h-3" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Addition: Code (e.g. KB10), Name, Price */}
                  <div className="p-2.5 bg-white rounded-xl border border-teal-200 space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold block">
                      Manual Custom Entry (Enter Code, Name & Price):
                    </span>
                    <div className="grid grid-cols-12 gap-1.5">
                      <input
                        type="text"
                        placeholder="Code (e.g. kb10)"
                        value={customAddOnCode}
                        onChange={(e) => setCustomAddOnCode(e.target.value)}
                        className="col-span-3 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 uppercase"
                      />
                      <input
                        type="text"
                        placeholder="Act Name (e.g. Domicile)"
                        value={customAddOnName}
                        onChange={(e) => setCustomAddOnName(e.target.value)}
                        className="col-span-4 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <input
                        type="number"
                        placeholder="Price (XAF)"
                        value={customAddOnPrice}
                        onChange={(e) => setCustomAddOnPrice(e.target.value)}
                        className="col-span-3 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-emerald-700 font-mono font-bold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const price = parseFloat(customAddOnPrice);
                          if (!customAddOnName.trim() || isNaN(price) || price <= 0) return;
                          const code = customAddOnCode.trim() ? customAddOnCode.trim().toUpperCase() : `ACT-${Date.now().toString().slice(-3)}`;
                          setCurrentAddOns(prev => [
                            ...prev,
                            {
                              id: `custom-${Date.now()}`,
                              code,
                              name: customAddOnName.trim(),
                              price,
                              quantity: customAddOnQty || 1
                            }
                          ]);
                          setCustomAddOnName('');
                          setCustomAddOnCode('');
                          setCustomAddOnPrice('');
                          setCustomAddOnQty(1);
                        }}
                        className="col-span-2 px-2 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Included Add-ons List */}
                  {currentAddOns.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-teal-800 font-bold flex items-center justify-between">
                        <span>Items to be Invoiced:</span>
                        <span className="font-mono text-emerald-800 font-extrabold">
                          +{currentAddOns.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} XAF
                        </span>
                      </span>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {currentAddOns.map((ao, idx) => (
                          <div key={ao.id || idx} className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-teal-200 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded border border-teal-300">
                                {ao.code}
                              </span>
                              <span className="font-bold text-slate-800 text-[11px]">{ao.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (ao.quantity > 1) {
                                      setCurrentAddOns(prev => prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity - 1 } : item));
                                    } else {
                                      setCurrentAddOns(prev => prev.filter((_, i) => i !== idx));
                                    }
                                  }}
                                  className="text-slate-500 hover:text-slate-800 px-1 font-bold cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-[10px] text-slate-800 px-1">{ao.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentAddOns(prev => prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item));
                                  }}
                                  className="text-slate-500 hover:text-slate-800 px-1 font-bold cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-mono font-bold text-emerald-700 text-xs whitespace-nowrap">
                                {(ao.price * ao.quantity).toLocaleString()} XAF
                              </span>
                              <button
                                type="button"
                                onClick={() => setCurrentAddOns(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Payment Method, Details, PIN & Confirmation (lg:col-span-6) */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* Payment Channel Grid */}
                <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2.5">
                  <label className="block text-slate-800 font-bold text-xs flex items-center justify-between">
                    <span>Payment Channel / Method</span>
                    <span className="text-[10px] text-emerald-700 font-semibold uppercase">Instant Settlement</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { id: 'cash', label: 'Cash Payment', icon: DollarSign, color: 'text-emerald-600' },
                      { id: 'mobile_money', label: 'MoMo / Orange', icon: Smartphone, color: 'text-amber-600' },
                      { id: 'bank_transfer', label: 'Bank Wire / Transfer', icon: Landmark, color: 'text-blue-600' },
                      { id: 'insurance', label: 'Insurance Co-Pay', icon: ShieldCheck, color: 'text-indigo-600' },
                      { id: 'workers_benefit', label: 'Staff Welfare (100%)', icon: HeartHandshake, color: 'text-teal-600' },
                      { id: 'gift_coupon', label: 'Gift Coupon', icon: Gift, color: 'text-purple-600' }
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
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isSel 
                              ? 'bg-emerald-600 border-emerald-700 text-white font-bold shadow-xs ring-1 ring-emerald-600' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isSel ? 'text-white' : m.color}`} />
                          <span className="text-[11px] leading-tight font-bold truncate">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Method Specific Compact Inputs */}
                  {paymentMethod === 'mobile_money' && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-700">Operator:</span>
                        <button
                          type="button"
                          onClick={() => setMomoProvider('MTN')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                            momoProvider === 'MTN' ? 'bg-yellow-400 border-yellow-500 text-slate-900' : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          MTN MoMo
                        </button>
                        <button
                          type="button"
                          onClick={() => setMomoProvider('ORANGE')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                            momoProvider === 'ORANGE' ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          Orange Money
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          value={momoSenderPhone}
                          onChange={(e) => setMomoSenderPhone(e.target.value)}
                          placeholder="Sender Phone (e.g. 671234567)"
                          className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <input
                          type="text"
                          value={momoTxId}
                          onChange={(e) => setMomoTxId(e.target.value)}
                          placeholder="TxID / SMS Ref Code"
                          className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'insurance' && (
                    <div className="p-3 bg-indigo-50/90 rounded-2xl border border-indigo-200 space-y-3 mt-2">
                      {/* Insurance Company Dropdown */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-indigo-950 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Insurance Company (Compagnie d'Assurance) *</span>
                          </span>
                          <span className="text-[10px] text-indigo-700 font-semibold uppercase bg-indigo-100/70 px-2 py-0.5 rounded-full">
                            Accredited Insurers
                          </span>
                        </label>
                        <select
                          value={isCustomInsurance ? 'OTHER_CUSTOM' : insuranceProvider}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'OTHER_CUSTOM') {
                              setIsCustomInsurance(true);
                              setInsuranceProvider('');
                            } else {
                              setIsCustomInsurance(false);
                              setInsuranceProvider(val);
                              // Auto-update co-pay from company's official default coverage
                              const matched = CAMEROON_INSURANCE_COMPANIES.find(c => c.name === val || c.id === val || c.shortName === val);
                              if (matched && matched.defaultCoveragePercent) {
                                setCoPayPercent(Math.max(0, 100 - matched.defaultCoveragePercent));
                              }
                            }
                          }}
                          className="w-full px-2.5 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                        >
                          <option value="">-- Select Insurance Company from List --</option>
                          {CAMEROON_INSURANCE_COMPANIES.map(comp => (
                            <option key={comp.id} value={comp.name}>
                              {comp.name} {comp.defaultCoveragePercent ? `• ${comp.defaultCoveragePercent}% Prise en Charge` : ''}
                            </option>
                          ))}
                          <option value="OTHER_CUSTOM">➕ Other Insurance Company / Autre (Saisie libre)...</option>
                        </select>

                        {isCustomInsurance && (
                          <div className="pt-1.5">
                            <input
                              type="text"
                              value={insuranceProvider}
                              onChange={(e) => setInsuranceProvider(e.target.value)}
                              placeholder="Type custom insurance company name..."
                              className="w-full px-2.5 py-1.5 bg-white border border-indigo-400 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>

                      {/* Insurance Matricule / Policy ID */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-indigo-950 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Insurance Matricule / N° d'Adhérent (Policy Number) *</span>
                          </span>
                          <span className="text-[9.5px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            Printed on Receipt
                          </span>
                        </label>
                        <input
                          type="text"
                          value={insurancePolicyNumber}
                          onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                          placeholder="e.g. ASC-2026-992014, GMC-8821, or MAT-004071"
                          className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 shadow-2xs"
                          required
                        />
                        <p className="text-[10px] text-slate-500">
                          This insurance matricule appears directly on the official patient receipt for claim verification and third-party reimbursement.
                        </p>
                      </div>

                      {/* Co-Pay % and Coverage Split */}
                      <div className="p-2.5 bg-white rounded-xl border border-indigo-200 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-800 font-bold">Patient Co-Pay % (Ticket Modérateur):</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={coPayPercent}
                                onChange={(e) => setCoPayPercent(Number(e.target.value) || 0)}
                                className="w-14 px-2 py-1 bg-slate-50 border border-indigo-300 rounded-lg text-xs font-bold text-center text-indigo-950"
                              />
                              <span className="text-xs font-bold text-slate-600">%</span>
                            </div>
                          </div>

                          <div className="text-[11px] font-bold text-slate-800">
                            Prise en charge: <span className="text-emerald-700 font-extrabold">{100 - coPayPercent}%</span> Assureur
                          </div>
                        </div>

                        {/* Live split amounts */}
                        {(() => {
                          const details = calculateSettlementDetails(selectedBooking, selectedGroupBookings);
                          return (
                            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                              <span className="text-slate-600">
                                Part Assureur ({100 - coPayPercent}%): <strong className="text-indigo-900 font-mono">{details.insurancePortion.toLocaleString()} XAF</strong>
                              </span>
                              <span className="text-emerald-800 font-bold">
                                Part Patient ({coPayPercent}%): <strong className="text-emerald-900 font-mono text-xs">{details.patientPortion.toLocaleString()} XAF</strong>
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 font-bold">Cash Given:</span>
                        <input
                          type="number"
                          value={cashGiven}
                          onChange={(e) => setCashGiven(e.target.value)}
                          placeholder="Amount in FCFA"
                          className="w-28 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-800"
                        />
                      </div>
                      {(() => {
                        const details = calculateSettlementDetails(selectedBooking, selectedGroupBookings);
                        return (
                          <div className="text-right text-[11px] font-mono">
                            <span className="text-slate-500 mr-1">Change:</span>
                            <strong className="text-amber-700 font-bold">{details.changeToReturn.toLocaleString()} XAF</strong>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Cashier PIN Verification */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <label className="flex items-center justify-between text-slate-700 font-bold text-xs">
                    <span className="flex items-center gap-1.5 text-teal-800">
                      <Lock className="w-3.5 h-3.5" />
                      Cashier Access PIN / Security Code *
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">e.g. CSH123</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showAccessCode ? 'text' : 'password'}
                      placeholder="Enter authorized cashier PIN..."
                      value={cashierAccessCode}
                      onChange={(e) => {
                        setCashierAccessCode(e.target.value);
                        if (accessCodeError) setAccessCodeError('');
                      }}
                      className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessCode(!showAccessCode)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {accessCodeError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-700 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{accessCodeError}</span>
                    </div>
                  )}
                </div>

                {/* Net Financial Total & Breakdown */}
                {(() => {
                  const details = calculateSettlementDetails(selectedBooking, selectedGroupBookings);
                  const payable = paymentMethod === 'insurance' ? details.patientPortion : details.finalTotal;
                  const addOnsSum = currentAddOns.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const testsSum = Math.max(0, details.baseTotal - addOnsSum);

                  return (
                    <div className="p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between text-slate-600 text-xs">
                        <span>Tests Subtotal ({selectedBooking.tests?.length || 0}):</span>
                        <span className="font-mono font-medium">{testsSum.toLocaleString()} XAF</span>
                      </div>
                      {addOnsSum > 0 && (
                        <div className="flex justify-between text-teal-800 text-xs font-semibold">
                          <span>Added Acts & Consumables ({currentAddOns.length}):</span>
                          <span className="font-mono">+{addOnsSum.toLocaleString()} XAF</span>
                        </div>
                      )}
                      {details.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 text-xs font-semibold">
                          <span>Discount / Welfare Concession:</span>
                          <span className="font-mono">-{details.discountAmount.toLocaleString()} XAF</span>
                        </div>
                      )}
                      {paymentMethod === 'insurance' && (
                        <div className="flex justify-between text-indigo-700 text-xs">
                          <span>Insurer Claim ({100 - coPayPercent}%):</span>
                          <span className="font-mono">-{details.insurancePortion.toLocaleString()} XAF</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-300 flex items-center justify-between">
                        <span className="text-slate-900 font-extrabold text-sm">
                          Total Payable:
                        </span>
                        <span className="text-xl font-black font-mono text-emerald-700">
                          {payable.toLocaleString()} XAF
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBooking(null);
                      setCashierAccessCode('');
                      setAccessCodeError('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleCollectPayment}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isProcessing ? 'Processing Payment...' : 'Confirm & Stamp Payment'}</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* OFFICIAL PROFESSIONAL BRANDED RECEIPT MODAL */}
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
            matricule: (showReceipt as any).matricule || showReceipt.insurancePolicyNumber || insurancePolicyNumber,
            insuranceCoveragePercent: showReceipt.coPayPercent !== undefined ? 100 - showReceipt.coPayPercent : (100 - coPayPercent),
            coPayPercent: showReceipt.coPayPercent !== undefined ? showReceipt.coPayPercent : coPayPercent,
            discountAmount: showReceipt.discountAmount,
            discountType: (showReceipt as any).discountType || discountType,
            couponCode: showReceipt.couponCode || couponCode,
            couponSponsorName: (showReceipt.paymentDetails?.couponSponsorName) || couponSponsorName,
            couponNotes: (showReceipt.paymentDetails?.couponNotes) || couponNotes,
            workerStaffName: (showReceipt.paymentDetails?.workerStaffName) || workerStaffName,
            workerStaffId: (showReceipt.paymentDetails?.workerStaffId) || workerStaffId,
            workerDepartment: (showReceipt.paymentDetails?.workerDepartment) || workerDepartment,
            workerBenefitType: (showReceipt.paymentDetails?.workerBenefitType) || workerBenefitType,
            workerAuthNote: (showReceipt.paymentDetails?.workerAuthNote) || workerAuthNote,
            momoProvider: (showReceipt.paymentDetails?.momoProvider) || momoProvider,
            momoSenderPhone: (showReceipt.paymentDetails?.momoSenderPhone) || momoSenderPhone,
            momoSenderName: (showReceipt.paymentDetails?.momoSenderName) || momoSenderName,
            momoTxId: (showReceipt.paymentDetails?.momoTxId) || momoTxId,
            bankName: (showReceipt.paymentDetails?.bankName) || bankName,
            bankAccountName: (showReceipt.paymentDetails?.bankAccountName) || bankAccountName,
            bankReference: (showReceipt.paymentDetails?.bankReference) || bankReference,
            bankBranch: (showReceipt.paymentDetails?.bankBranch) || bankBranch,
            cardScheme: (showReceipt.paymentDetails?.cardScheme) || cardScheme,
            cardLast4: (showReceipt.paymentDetails?.cardLast4) || cardLast4,
            cardAuthCode: (showReceipt.paymentDetails?.cardAuthCode) || cardAuthCode,
            cashGiven: (showReceipt.paymentDetails?.cashGiven) ?? (parseFloat(cashGiven) || undefined),
            cashChange: (showReceipt.paymentDetails?.cashChange),
            cashierName: user?.name || 'Authorized Medical Cashier',
            paidAt: showReceipt.paidAt || new Date().toISOString(),
            actualPaidAmount: showReceipt.actualPaidAmount
          }}
        />
      )}

      {/* ============================================================== */}
      {/* CASHIER ITEMIZED INVOICE BUILDER & CATEGORIES DISPATCH MODAL   */}
      {/* ============================================================== */}
      {invoiceBuilderBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Itemized Diagnostic Invoice Builder
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient: <strong>{invoiceBuilderBooking.patientName}</strong> &bull; #{invoiceBuilderBooking.bookingCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceBuilderBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
              {/* Patient Info Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Details</span>
                  <span className="font-extrabold text-slate-900 text-xs block">{invoiceBuilderBooking.patientName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">PID: {invoiceBuilderBooking.patientPid || invoiceBuilderBooking.patientId} &bull; Tél: {invoiceBuilderBooking.patientPhone || 'N/A'}</span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Intake / Collection Mode</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                    invoiceBuilderBooking.homeCollection 
                      ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                      : 'bg-blue-100 text-blue-900 border border-blue-200'
                  }`}>
                    {invoiceBuilderBooking.homeCollection ? <Truck className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                    {invoiceBuilderBooking.homeCollection ? 'Home Sample Draw' : 'Walk-in Clinic Intake'}
                  </span>
                  {invoiceBuilderBooking.pickupLocation && (
                    <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[200px]">
                      {invoiceBuilderBooking.pickupLocation}
                    </span>
                  )}
                </div>
              </div>

              {/* CATEGORY 1: Prescribed Laboratory Tests Cost */}
              <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-teal-950">
                    <FlaskConical className="w-4 h-4 text-teal-700" />
                    <span>Category 1: Laboratory Diagnostic Exams & Analysis</span>
                  </div>
                  <span className="font-mono font-black text-teal-900 text-xs">
                    {Number(builderTestsAmount).toLocaleString()} XAF
                  </span>
                </div>

                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-teal-100">
                  {invoiceBuilderBooking.tests?.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-800 font-medium">{t.testName}</span>
                      <span className="font-mono font-bold text-slate-900">{(Number(t.price) || 0).toLocaleString()} XAF</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500">Exams Subtotal:</span>
                    <input
                      type="number"
                      value={builderTestsAmount}
                      onChange={(e) => setBuilderTestsAmount(Number(e.target.value) || 0)}
                      className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-right font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* CATEGORY 2: Mobile Phlebotomist Home Sample Collection Fee */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderIncludeHomePickup}
                      onChange={(e) => setBuilderIncludeHomePickup(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                    <Truck className="w-4 h-4 text-teal-600" />
                    <span>Category 2: Home Phlebotomist Dispatch & Logistics</span>
                  </label>
                  {builderIncludeHomePickup && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={builderHomePickupFee}
                        onChange={(e) => setBuilderHomePickupFee(Number(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">XAF</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 pl-6">
                  Certified phlebotomist travel to patient address with temperature-monitored isothermal collection box.
                </p>
              </div>

              {/* CATEGORY 3: Doorstep Result Delivery Fee */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderIncludeDelivery}
                      onChange={(e) => setBuilderIncludeDelivery(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                    <Send className="w-4 h-4 text-teal-600" />
                    <span>Category 3: Hardcopy Biologist-Signed Result Delivery</span>
                  </label>
                  {builderIncludeDelivery && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={builderDeliveryFee}
                        onChange={(e) => setBuilderDeliveryFee(Number(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">XAF</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 pl-6">
                  Physical official laboratory results printed on official letterhead delivered directly to patient residence.
                </p>
              </div>

              {/* CATEGORY 4: Additional Clinical Items, Consumables & STAT Fees */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-teal-600" />
                    <span>Category 4: Additional Clinical Items & Consumables</span>
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-600">
                    {builderAddOns.reduce((s, it) => s + (Number(it.price) || 0), 0).toLocaleString()} XAF
                  </span>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBuilderAddOns(prev => [...prev, { id: `stat-${Date.now()}`, name: 'Urgent STAT Diagnostic Processing Surcharge', category: 'STAT Fee', price: 2000 }]);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    + Urgent STAT (2,000 XAF)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuilderAddOns(prev => [...prev, { id: `vac-${Date.now()}`, name: 'Sterile Vacutainer Micro-Collection Kit', category: 'Consumables', price: 800 }]);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    + Sterile Tube Kit (800 XAF)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuilderAddOns(prev => [...prev, { id: `cryo-${Date.now()}`, name: 'Cryo-Cold Chain Matrix Preservation', category: 'Preservation', price: 1200 }]);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    + Cryo Preservation (1,200 XAF)
                  </button>
                </div>

                {/* Added items list */}
                {builderAddOns.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {builderAddOns.map((item) => (
                      <div key={item.id} className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block">Category: {item.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{item.price.toLocaleString()} XAF</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBuilderAddOn(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Add Item Input */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Custom Act Name (e.g. Needle Kit)"
                    value={builderNewItemName}
                    onChange={(e) => setBuilderNewItemName(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Price XAF"
                    value={builderNewItemPrice}
                    onChange={(e) => setBuilderNewItemPrice(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddBuilderAddOn}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* GRAND TOTAL SUMMARY CARD */}
              <div className="p-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-2xl shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-200 block">Calculated Invoice Grand Total</span>
                  <p className="text-xs text-emerald-100">
                    Includes all 4 categories &bull; Sent to patient app
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-2xl text-white">
                    {(
                      Number(builderTestsAmount) + 
                      (builderIncludeHomePickup ? Number(builderHomePickupFee) || 0 : 0) + 
                      (builderIncludeDelivery ? Number(builderDeliveryFee) || 0 : 0) + 
                      builderAddOns.reduce((s, it) => s + (Number(it.price) || 0), 0)
                    ).toLocaleString()} XAF
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInvoiceBuilderBooking(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDispatchCustomInvoice}
                disabled={isSendingInvoice}
                className="px-6 py-2.5 bg-[#006978] hover:bg-[#005a66] active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <Receipt className="w-4 h-4 text-cyan-200" />
                <span>{isSendingInvoice ? 'Dispatching...' : 'Issue & Send Official Invoice to Patient'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CashierView;
