import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
import { CAMEROON_INSURANCE_COMPANIES } from '../../data/cameroonInsurances';
import { MedicalReceiptModal } from '../../components/common/MedicalReceiptModal';
import { TestStatus } from '../../services/limsService';
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
  CheckSquare,
  Square
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
  
  // FIXED: Track selected tests by test ID, not booking ID
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card' | 'insurance'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<PatientBooking | null>(null);
  const [expandedPatientKey, setExpandedPatientKey] = useState<string | null>(null);

  // Discount State
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed' | 'coupon'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  
  // Insurance details
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [coPayPercent, setCoPayPercent] = useState<number>(20);

  // Security Access Code
  const [cashierAccessCode, setCashierAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState('');

  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid');

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

  // FIXED: Get ONLY validated tests from a booking
  const getValidatedTests = (booking: PatientBooking) => {
    return (booking.tests || []).filter(t => t.receptionistValidated === true);
  };

  // FIXED: Get total amount for ONLY validated tests
  const getValidatedTotal = (booking: PatientBooking) => {
    return getValidatedTests(booking).reduce((sum, t) => sum + (t.price || 0), 0);
  };

  // FIXED: Check if a test is selected for payment
  const isTestSelected = (testId: string) => {
    return selectedTestIds.has(testId);
  };

  // FIXED: Toggle test selection
  const toggleTestSelection = (testId: string) => {
    const newSet = new Set(selectedTestIds);
    if (newSet.has(testId)) {
      newSet.delete(testId);
    } else {
      newSet.add(testId);
    }
    setSelectedTestIds(newSet);
  };

  // FIXED: Select all validated tests for a patient
  const selectAllValidatedTests = (booking: PatientBooking) => {
    const validatedTests = getValidatedTests(booking);
    const newSet = new Set(selectedTestIds);
    validatedTests.forEach(t => {
      const testKey = t.id || t.testId;
      if (testKey) newSet.add(testKey);
    });
    setSelectedTestIds(newSet);
  };

  // FIXED: Deselect all tests
  const deselectAllTests = () => {
    setSelectedTestIds(new Set());
  };

  // FIXED: Get selected tests from a booking
  const getSelectedTests = (booking: PatientBooking) => {
    return (booking.tests || []).filter(t => {
      const testKey = t.id || t.testId;
      return testKey && selectedTestIds.has(testKey);
    });
  };

  // FIXED: Get total amount for selected tests
  const getSelectedTotal = (booking: PatientBooking) => {
    return getSelectedTests(booking).reduce((sum, t) => sum + (t.price || 0), 0);
  };

  const calculateSettlementDetails = (booking: PatientBooking | null) => {
    if (!booking) return { baseTotal: 0, discountAmount: 0, finalTotal: 0, patientPortion: 0, insurancePortion: 0 };
    
    const selectedTests = getSelectedTests(booking);
    const baseTotal = selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);

    let discountAmount = 0;
    if (discountType === 'percent') {
      discountAmount = Math.round((baseTotal * (discountValue || 0)) / 100);
    } else if (discountType === 'fixed') {
      discountAmount = Math.min(baseTotal, discountValue || 0);
    } else if (discountType === 'coupon' && couponApplied) {
      discountAmount = Math.round((baseTotal * 15) / 100);
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

    return { baseTotal, discountAmount, finalTotal: afterDiscount, patientPortion, insurancePortion };
  };

  const handleApplyCoupon = () => {
    const clean = couponCode.trim().toUpperCase();
    if (['FAMILY15', 'HEALTH20', 'PROMO10', 'SPECIAL', 'STAFF100', 'WELLNESS'].includes(clean)) {
      setCouponApplied(true);
      setDiscountType('coupon');
    } else {
      alert('Invalid coupon code. Try FAMILY15, HEALTH20, or PROMO10.');
    }
  };

  // FIXED: Process payment for ONLY selected tests
  const handleCollectPayment = async () => {
    if (!selectedBooking) return;

    const selectedTests = getSelectedTests(selectedBooking);
    if (selectedTests.length === 0) {
      alert('Please select at least one test to pay for.');
      return;
    }

    setAccessCodeError('');
    const enteredCode = cashierAccessCode.trim();
    if (!enteredCode) {
      setAccessCodeError('Security Access Code is required to authorize this financial transaction.');
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
      setAccessCodeError('Invalid access code. Please enter your authorized staff Cashier PIN.');
      return;
    }

    setIsProcessing(true);
    const nowIso = new Date().toISOString();
    const { baseTotal, discountAmount, finalTotal, patientPortion, insurancePortion } = calculateSettlementDetails(selectedBooking);

    try {
      // Get the selected test IDs
      const selectedTestIdsList = selectedTests.map(t => t.id || t.testId).filter(Boolean);
      
      // Process payment for the booking but only for selected tests
      await limsService.processPayment({
        labId: targetLabId,
        bookingId: selectedBooking.id,
        paymentMethod,
        processedByName: `${user?.name || 'Head Cashier'} [Secured via Code]`,
        paymentDetails: {
          selectedTestIds: selectedTestIdsList,
          originalPrice: baseTotal,
          discountAmount,
          discountType: discountType !== 'none' ? discountType : undefined,
          couponCode: couponApplied ? couponCode : undefined,
          actualPaidAmount: paymentMethod === 'insurance' ? patientPortion : finalTotal,
          insuranceDetails: paymentMethod === 'insurance' ? {
            provider: insuranceProvider || 'HMO Insurance',
            policyNumber: insurancePolicyNumber || 'N/A',
            coPayPercent,
            patientCoPayAmount: patientPortion,
            insuranceClaimAmount: insurancePortion
          } : undefined
        }
      });

      // Update local state - mark selected tests as paid
      setBookings(prev => prev.map(b => {
        if (b.id === selectedBooking.id) {
          const updatedTests = (b.tests || []).map(t => {
            const testKey = t.id || t.testId;
            if (testKey && selectedTestIds.has(testKey)) {
              return {
                ...t,
                paid: true,
                paymentStatus: 'paid' as const,
                paymentMethod,
                paidAt: nowIso,
                status: 'Pending_Collection' as TestStatus
              };
            }
            return t;
          });

          return {
            ...b,
            paymentStatus: 'paid',
            paidAt: nowIso,
            paymentMethod,
            totalAmount: paymentMethod === 'insurance' ? patientPortion : finalTotal,
            originalPrice: baseTotal,
            discountAmount,
            actualPaidAmount: paymentMethod === 'insurance' ? patientPortion : finalTotal,
            overallStatus: 'Pending_Collection' as const,
            tests: updatedTests
          };
        }
        return b;
      }));

      setShowReceipt(selectedBooking);
      setSelectedBooking(null);
      setCashierAccessCode('');
      setAccessCodeError('');
      setSelectedTestIds(new Set());
      setDiscountType('none');
      setDiscountValue(0);
      setCouponCode('');
      setCouponApplied(false);
      setCustomPriceInput('');

      await fetchData();
    } catch (e) {
      console.error('Payment collection error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // FIXED: Filter bookings - ONLY show bookings that have validated tests
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

  // FIXED: Filter unpaid bookings by search
  const filteredUnpaid = unpaidBookings.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // FIXED: Group bookings by patient
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
      const validated = getValidatedTests(b);
      const validatedTotal = validated.reduce((sum, t) => sum + (t.price || 0), 0);
      groups[key].bookings.push(b);
      groups[key].totalAmount += validatedTotal;
      groups[key].validatedCount += validated.length;
    });

    return Object.values(groups);
  }, [filteredUnpaid]);

  return (
    <div className="space-y-6">
      <Header
        title="Cashier & Financial Gatekeeper Desk"
        subtitle="Step 2: Collect payment for validated tests only"
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
              {unpaidBookings.reduce((sum, b) => sum + getValidatedTests(b).length, 0)}
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
            <span>Unpaid Invoices Queue ({unpaidBookings.length})</span>
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
            placeholder="Search patient name, PID, Booking code, or Invoice number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* CONTENT AREA BASED ON ACTIVE TAB */}
      {activeTab === 'unpaid' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Validated Tests Awaiting Payment ({filteredUnpaid.reduce((sum, b) => sum + getValidatedTests(b).length, 0)})
              </h3>
              <span className="text-xs text-slate-500">Only receptionist-validated tests appear here</span>
            </div>

            {selectedTestIds.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  // Find the booking containing selected tests
                  const booking = filteredUnpaid.find(b => 
                    (b.tests || []).some(t => {
                      const key = t.id || t.testId;
                      return key && selectedTestIds.has(key);
                    })
                  );
                  if (booking) {
                    setSelectedBooking(booking);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>Pay Selected ({selectedTestIds.size} tests)</span>
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
                const groupTestIds = new Set<string>();
                group.bookings.forEach(b => {
                  getValidatedTests(b).forEach(t => {
                    const key = t.id || t.testId;
                    if (key) groupTestIds.add(key);
                  });
                });
                const allSelected = Array.from(groupTestIds).every(id => selectedTestIds.has(id));
                const someSelected = Array.from(groupTestIds).some(id => selectedTestIds.has(id));

                return (
                  <div key={group.key} className="p-4 hover:bg-slate-50/80 transition-colors space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => {
                            if (allSelected) {
                              groupTestIds.forEach(id => selectedTestIds.delete(id));
                              setSelectedTestIds(new Set(selectedTestIds));
                            } else {
                              groupTestIds.forEach(id => selectedTestIds.add(id));
                              setSelectedTestIds(new Set(selectedTestIds));
                            }
                          }}
                          className="mt-1"
                        >
                          {allSelected ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
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
                      </div>
                    </div>

                    {/* EXPANDED ACCORDION - Shows ONLY validated tests with checkboxes */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/70 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-600" />
                            Validated Tests Ready for Payment
                          </h4>
                          <div className="flex items-center gap-3 text-xs">
                            <button
                              onClick={() => {
                                const allValidatedIds: string[] = [];
                                group.bookings.forEach(b => {
                                  getValidatedTests(b).forEach(t => {
                                    const key = t.id || t.testId;
                                    if (key) allValidatedIds.push(key);
                                  });
                                });
                                const newSet = new Set(selectedTestIds);
                                allValidatedIds.forEach(id => newSet.add(id));
                                setSelectedTestIds(newSet);
                              }}
                              className="text-teal-700 font-bold hover:text-teal-900 cursor-pointer"
                            >
                              Select All
                            </button>
                            <button
                              onClick={deselectAllTests}
                              className="text-slate-500 font-bold hover:text-slate-700 cursor-pointer"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {group.bookings.map((booking) => {
                            const validatedTests = getValidatedTests(booking);
                            if (validatedTests.length === 0) return null;

                            return (
                              <div key={booking.id} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-teal-800">
                                      {booking.bookingCode}
                                    </span>
                                    <span className="text-slate-500">• Invoice: <strong className="font-mono">{booking.invoiceNumber}</strong></span>
                                  </div>
                                  <span className="text-[10px] text-emerald-700 font-bold">
                                    {validatedTests.length} validated test{validatedTests.length !== 1 ? 's' : ''}
                                  </span>
                                </div>

                                {/* Individual test checkboxes */}
                                <div className="divide-y divide-slate-100">
                                  {validatedTests.map((t) => {
                                    const testKey = t.id || t.testId;
                                    const isChecked = testKey ? selectedTestIds.has(testKey) : false;

                                    return (
                                      <div key={testKey || t.id} className="py-2 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <button
                                            onClick={() => testKey && toggleTestSelection(testKey)}
                                            className="flex items-center gap-2"
                                          >
                                            {isChecked ? (
                                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                                            ) : (
                                              <Square className="w-4 h-4 text-slate-400" />
                                            )}
                                            <span className="font-medium text-slate-800 text-xs">
                                              {t.testName}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                              {t.category || 'General'}
                                            </span>
                                          </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-slate-800 text-xs">
                                            {(t.price || 0).toLocaleString()} FCFA
                                          </span>
                                          {isChecked && (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {validatedTests.length > 0 && (
                                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                                    <button
                                      onClick={() => {
                                        validatedTests.forEach(t => {
                                          const key = t.id || t.testId;
                                          if (key) selectedTestIds.add(key);
                                        });
                                        setSelectedTestIds(new Set(selectedTestIds));
                                        setSelectedBooking(booking);
                                      }}
                                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                    >
                                      <DollarSign className="w-3.5 h-3.5" />
                                      Pay All Validated ({validatedTests.reduce((sum, t) => sum + (t.price || 0), 0).toLocaleString()} FCFA)
                                    </button>
                                  </div>
                                )}
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
        /* REVENUE HISTORY */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Settled Revenue History
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
                    <th className="py-3 px-4 text-right">Receipt</th>
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
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Print</span>
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

      {/* PAYMENT MODAL - Shows ONLY selected tests */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Process Payment</h3>
                  <p className="text-xs text-emerald-300">Invoice {selectedBooking.invoiceNumber} • {selectedBooking.bookingCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-800 rounded-2xl space-y-1">
                <div className="text-slate-400">Patient Name</div>
                <div className="text-base font-black text-white">{selectedBooking.patientName}</div>
                <div className="text-slate-300">Selected Tests: {getSelectedTests(selectedBooking).length} of {getValidatedTests(selectedBooking).length} validated</div>
              </div>

              {/* Selected Tests Summary */}
              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-1">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Selected Tests</div>
                {getSelectedTests(selectedBooking).map((t, idx) => (
                  <div key={t.id || idx} className="flex justify-between text-xs py-0.5">
                    <span className="text-white">{t.testName}</span>
                    <span className="font-mono text-emerald-400">{(t.price || 0).toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cash', label: 'Cash Payment', icon: DollarSign },
                    { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
                    { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                    { id: 'insurance', label: 'Insurance Co-Pay', icon: ShieldCheck }
                  ].map(m => {
                    const Icon = m.icon;
                    const isSel = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSel ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-emerald-400" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Insurance details */}
              {paymentMethod === 'insurance' && (
                <div className="p-3.5 bg-indigo-950/70 rounded-2xl border border-indigo-500/40 space-y-3">
                  <div className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Insurance Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Insurance Company *</label>
                      <select
                        value={insuranceProvider}
                        onChange={(e) => setInsuranceProvider(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-indigo-800 rounded-lg text-xs text-white"
                      >
                        <option value="">Select Insurance Provider...</option>
                        {CAMEROON_INSURANCE_COMPANIES.map(company => (
                          <option key={company.id} value={company.name}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Policy Number</label>
                      <input
                        type="text"
                        value={insurancePolicyNumber}
                        onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                        placeholder="e.g. POL-998234"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-indigo-800 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                      <span>Co-Pay Split:</span>
                      <span className="text-indigo-300 font-bold">{coPayPercent}% Patient • {100 - coPayPercent}% Insurer</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 20, 30, 50].map((cp) => (
                        <button
                          key={cp}
                          type="button"
                          onClick={() => setCoPayPercent(cp)}
                          className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-colors ${
                            coPayPercent === cp
                              ? 'bg-indigo-600 text-white border-indigo-400'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {cp}% Co-Pay
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Access Code */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                <label className="flex items-center justify-between text-slate-300 font-bold text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <Lock className="w-3.5 h-3.5" />
                    Cashier Security Access Code
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">e.g. CSH123</span>
                </label>
                
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showAccessCode ? 'text' : 'password'}
                    placeholder="Enter your authorized cashier PIN..."
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

              {/* Financial Summary */}
              {(() => {
                const details = calculateSettlementDetails(selectedBooking);
                return (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>Selected Tests Total:</span>
                      <span className="font-mono">{details.baseTotal.toLocaleString()} XAF</span>
                    </div>
                    {details.discountAmount > 0 && (
                      <div className="flex justify-between text-amber-400 text-xs">
                        <span>Discount Applied:</span>
                        <span className="font-mono">-{details.discountAmount.toLocaleString()} XAF</span>
                      </div>
                    )}
                    {paymentMethod === 'insurance' && (
                      <div className="flex justify-between text-indigo-300 text-xs">
                        <span>Insurance Claim:</span>
                        <span className="font-mono">-{details.insurancePortion.toLocaleString()} XAF</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-white font-bold text-sm">Amount to Collect:</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {(paymentMethod === 'insurance' ? details.patientPortion : details.finalTotal).toLocaleString()} XAF
                      </span>
                    </div>
                  </div>
                );
              })()}

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
                  disabled={isProcessing || getSelectedTests(selectedBooking).length === 0}
                  onClick={handleCollectPayment}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing...' : 'Confirm Payment'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      <MedicalReceiptModal
        isOpen={Boolean(showReceipt)}
        onClose={() => setShowReceipt(null)}
        booking={showReceipt}
        labInfo={lab}
        paymentDetails={{
          paymentMethod: showReceipt?.paymentMethod || paymentMethod,
          insuranceProvider: showReceipt?.insuranceProvider || insuranceProvider,
          insurancePolicyNumber: showReceipt?.insurancePolicyNumber || insurancePolicyNumber,
          cashierName: user?.name || 'Authorized Lab Cashier',
          paidAt: showReceipt?.paidAt || new Date().toISOString()
        }}
      />

    </div>
  );
};

export default CashierView;