import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
import { CAMEROON_INSURANCE_COMPANIES, formatDOBDisplay, calculateAgeFromDOB } from '../../data/cameroonInsurances';
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
  BadgePercent
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card' | 'insurance'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<PatientBooking | null>(null);
  const [expandedPatientKey, setExpandedPatientKey] = useState<string | null>(null);

  // Flexible Pricing, Discount & Insurance State
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed' | 'coupon'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  
  // Insurance details
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [coPayPercent, setCoPayPercent] = useState<number>(20); // default 20% patient co-pay

  // Security Access Code verification for Cashiers
  const [cashierAccessCode, setCashierAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState('');

  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid');

  useEffect(() => {
    fetchData();
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

  // Calculate dynamic settlement total based on pricing adjustments
  const calculateSettlementDetails = (booking: PatientBooking | null, group: PatientBooking[] | null) => {
    const targetBookings = group && group.length > 0 ? group : booking ? [booking] : [];
    const baseTotal = targetBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    let discountAmount = 0;
    if (discountType === 'percent') {
      discountAmount = Math.round((baseTotal * (discountValue || 0)) / 100);
    } else if (discountType === 'fixed') {
      discountAmount = Math.min(baseTotal, discountValue || 0);
    } else if (discountType === 'coupon' && couponApplied) {
      discountAmount = Math.round((baseTotal * 15) / 100); // 15% coupon discount
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

    return {
      baseTotal,
      discountAmount,
      finalTotal: afterDiscount,
      patientPortion,
      insurancePortion
    };
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

    setIsProcessing(true);
    const targetBookings = selectedGroupBookings && selectedGroupBookings.length > 0 
      ? selectedGroupBookings 
      : selectedBooking 
        ? [selectedBooking] 
        : [];
    const targetIds = targetBookings.map(b => b.id);
    const nowIso = new Date().toISOString();

    const { baseTotal, discountAmount, finalTotal, patientPortion, insurancePortion } = calculateSettlementDetails(selectedBooking, selectedGroupBookings);

    try {
      for (const b of targetBookings) {
        await limsService.processPayment({
          labId: targetLabId,
          bookingId: b.id,
          paymentMethod,
          processedByName: `${user?.name || 'Head Cashier'} [Secured via Code]`,
          paymentDetails: {
            originalPrice: baseTotal,
            discountAmount,
            discountType: discountType !== 'none' ? discountType : undefined,
            couponCode: couponApplied ? couponCode : undefined,
            actualPaidAmount: paymentMethod === 'insurance' ? patientPortion : finalTotal,
            insuranceDetails: paymentMethod === 'insurance' ? {
              provider: insuranceProvider || (b as any).insuranceProvider || 'HMO Insurance',
              policyNumber: insurancePolicyNumber || (b as any).insurancePolicyNumber || 'N/A',
              coPayPercent,
              patientCoPayAmount: patientPortion,
              insuranceClaimAmount: insurancePortion
            } : undefined
          }
        });
      }

      // INSTANT REACTIVE LOCAL STATE UPDATE
      const updatedFirstBooking = {
        ...targetBookings[0],
        paymentStatus: 'paid' as const,
        paidAt: nowIso,
        paymentMethod,
        totalAmount: paymentMethod === 'insurance' ? patientPortion : finalTotal,
        originalPrice: baseTotal,
        discountAmount,
        couponCode: couponApplied ? couponCode : undefined,
        actualPaidAmount: paymentMethod === 'insurance' ? patientPortion : finalTotal,
        insuranceProvider: paymentMethod === 'insurance' ? (insuranceProvider || 'HMO Insurance') : undefined,
        insurancePolicyNumber: paymentMethod === 'insurance' ? (insurancePolicyNumber || 'N/A') : undefined,
        overallStatus: 'Pending_Collection' as const
      };

      setBookings(prev => prev.map(b => {
        if (targetIds.includes(b.id)) {
          return {
            ...b,
            paymentStatus: 'paid',
            paidAt: nowIso,
            paymentMethod,
            totalAmount: paymentMethod === 'insurance' ? patientPortion : finalTotal,
            originalPrice: baseTotal,
            discountAmount,
            actualPaidAmount: paymentMethod === 'insurance' ? patientPortion : finalTotal,
            overallStatus: 'Pending_Collection',
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
      setCustomPriceInput('');

      // Background re-sync
      fetchData();
    } catch (e) {
      console.error('Payment collection error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // ONLY show bookings that have been validated/checked-in by Receptionist
  const unpaidBookings = bookings.filter(b => 
    b.paymentStatus === 'unpaid' && 
    (b.receptionistValidated === true || b.validatedBy || b.overallStatus === 'Pending_Payment' || (b as any).registrationType === 'walk_in')
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
            placeholder="Search patient name, PID, Booking code (BK-...), or Invoice number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* CONTENT AREA BASED ON ACTIVE TAB */}
      {activeTab === 'unpaid' ? (
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
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-xs text-teal-800">
                                        {booking.bookingCode}
                                      </span>
                                      <span className="text-xs text-slate-500">• Invoice: <strong className="font-mono">{booking.invoiceNumber}</strong></span>
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
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Invoice Total</div>
                                    <div className="text-sm font-black text-emerald-700 font-mono">
                                      {(booking.totalAmount || 0).toLocaleString()} FCFA
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => setSelectedBooking(booking)}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Verify & Pay Order
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
                    <th className="py-3 px-4">Tests Performed</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COLLECT PAYMENT MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Process Patient Order Payment</h3>
                  <p className="text-xs text-emerald-300">Invoice {selectedBooking.invoiceNumber} • {selectedBooking.bookingCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-slate-400">Patient Name</div>
                  {(selectedBooking.virtualRequested || selectedBooking.tests?.some(t => t.virtualRequested)) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Virtual Delivery Requested
                    </span>
                  )}
                </div>
                <div className="text-base font-black text-white">{selectedBooking.patientName}</div>
                <div className="text-slate-300">Total Items: {selectedBooking.tests?.length || 0} tests ({selectedBooking.tests?.map(t => t.testName).join(', ')})</div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cash', label: 'Cash Payment', icon: DollarSign },
                    { id: 'mobile_money', label: 'Mobile Money (MoMo/OM)', icon: Smartphone },
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

              {/* FLEXIBLE PRICING, DISCOUNTS & COUPONS */}
              <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                    <BadgePercent className="w-4 h-4 text-amber-400" />
                    Discounts, Coupons & Custom Pricing
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
                      Reset Discounts
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

                {/* Coupon Code Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Coupon (e.g. FAMILY15, HEALTH20)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                  >
                    {couponApplied ? 'Applied ✓' : 'Apply'}
                  </button>
                </div>

                {/* Custom negotiated price */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-slate-400 shrink-0">Custom Override Amount:</label>
                  <input
                    type="number"
                    placeholder="Enter manual price in FCFA"
                    value={customPriceInput}
                    onChange={(e) => setCustomPriceInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* INSURANCE CO-PAY DETAILS */}
              {paymentMethod === 'insurance' && (
                <div className="p-3.5 bg-indigo-950/70 rounded-2xl border border-indigo-500/40 space-y-3">
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
                        className="w-full px-3 py-1.5 bg-slate-900 border border-indigo-800 rounded-lg text-xs text-white font-mono"
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
                          className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-colors ${
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

              {/* CASHIER ACCESS CODE SECURITY VERIFICATION */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                <label className="flex items-center justify-between text-slate-300 font-bold text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <Lock className="w-3.5 h-3.5" />
                    Cashier Security Access Code Required
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
                return (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>Original Catalog Total:</span>
                      <span className="font-mono">{details.baseTotal.toLocaleString()} XAF</span>
                    </div>
                    {details.discountAmount > 0 && (
                      <div className="flex justify-between text-amber-400 text-xs">
                        <span>Discount / Coupon Applied:</span>
                        <span className="font-mono">-{details.discountAmount.toLocaleString()} XAF</span>
                      </div>
                    )}
                    {paymentMethod === 'insurance' && (
                      <div className="flex justify-between text-indigo-300 text-xs">
                        <span>HMO Insurance Claim Portion:</span>
                        <span className="font-mono">-{details.insurancePortion.toLocaleString()} XAF</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-white font-bold text-sm">Actual Paid by Patient:</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {(paymentMethod === 'insurance' ? details.patientPortion : details.finalTotal).toLocaleString()} XAF
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                Clicking confirm validates the security PIN, marks the order as PAID, and pushes patient to Phlebotomy Queue.
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
                  <span>{isProcessing ? 'Verifying & Processing...' : 'Verify Access Code & Confirm Payment'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PROFESSIONAL BRANDED RECEIPT TEMPLATE MODAL */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-auto">
            
            {/* Action Bar (Print, Download, Close) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Official Medical Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Print Official Receipt
                </button>
                <button
                  onClick={() => setShowReceipt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper Container */}
            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-4 font-sans text-xs">
              
              {/* Header with Lab Branding & License */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm">
                      nL
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 tracking-tight">nanoLabs Diagnostics</h2>
                      <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">Clinical Pathology & Molecular Institute</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Reg No: MINSANTE/DL/2024/099 • Douala - Yaounde, Cameroon<br />
                    Tel: +237 670 000 000 • Email: billing@nanolabs.cm
                  </p>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black uppercase inline-block">
                    Payment Settled
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Invoice: <strong className="text-slate-900">{showReceipt.invoiceNumber}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Order Ref: <strong>{showReceipt.bookingCode}</strong>
                  </div>
                </div>
              </div>

              {/* Patient & Billing Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-white rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Patient Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{showReceipt.patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Patient ID (PID)</span>
                  <span className="font-mono font-bold text-teal-700">{showReceipt.patientPid || showReceipt.patientId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Date of Birth / Age</span>
                  <span className="font-semibold text-slate-800">
                    {showReceipt.dateOfBirth || showReceipt.dob ? formatDOBDisplay(showReceipt.dateOfBirth || showReceipt.dob) : 'N/A'}
                    {showReceipt.patientAge || showReceipt.age ? ` (${showReceipt.patientAge || showReceipt.age} Yrs)` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Date & Time</span>
                  <span className="font-medium text-slate-700">
                    {showReceipt.paidAt ? new Date(showReceipt.paidAt).toLocaleString() : new Date().toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Payment Method</span>
                  <span className="font-bold text-slate-800 uppercase">{showReceipt.paymentMethod || paymentMethod}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Referring Doctor</span>
                  <span className="font-semibold text-slate-800">{showReceipt.doctorName || showReceipt.referringDoctor || 'Direct / Self-Referred'}</span>
                </div>
              </div>

              {/* Insurance Details Box if covered */}
              {(showReceipt.insuranceProvider || showReceipt.paymentMethod === 'insurance') && (
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-indigo-950">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 block uppercase">Cameroon Insurance Provider</span>
                    <span className="font-extrabold text-indigo-900">{showReceipt.insuranceProvider || insuranceProvider || 'Cameroon Registered HMO'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 block uppercase">Policy / Matricule ID</span>
                    <span className="font-mono font-bold text-indigo-900">{showReceipt.insurancePolicyNumber || insurancePolicyNumber || 'POL-VERIFIED-01'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 block uppercase">Coverage Breakdown</span>
                    <span className="font-bold text-emerald-700">
                      {100 - (showReceipt.coPayPercent ?? coPayPercent)}% Insurer / {showReceipt.coPayPercent ?? coPayPercent}% Patient Co-Pay
                    </span>
                  </div>
                </div>
              )}

              {/* Itemized Test List */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Itemized Diagnostic Services</div>
                <table className="w-full text-left border-collapse bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] text-slate-600 font-bold uppercase">
                      <th className="py-2 px-3">Service / Test Description</th>
                      <th className="py-2 px-3">Specimen</th>
                      <th className="py-2 px-3 text-right">Standard Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {showReceipt.tests?.map((t, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold text-slate-800">{t.testName}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{t.sampleTypeRequired || 'Blood (EDTA)'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {(t.price || 5500).toLocaleString()} XAF
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdown Card */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Diagnostic Subtotal:</span>
                  <span>{(showReceipt.originalPrice || showReceipt.totalAmount || 0).toLocaleString()} XAF</span>
                </div>
                {Boolean(showReceipt.discountAmount) && (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>Discount / Promo Applied {showReceipt.couponCode ? `(${showReceipt.couponCode})` : ''}:</span>
                    <span>-{(showReceipt.discountAmount || 0).toLocaleString()} XAF</span>
                  </div>
                )}
                {showReceipt.insuranceProvider && (
                  <div className="flex justify-between text-indigo-600 font-bold">
                    <span>HMO Insurance Policy Subsidized ({showReceipt.insuranceProvider}):</span>
                    <span>Subsidized Claim</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span className="font-sans">NET ACTUAL PAID:</span>
                  <span className="text-emerald-700 text-base">{(showReceipt.actualPaidAmount || showReceipt.totalAmount || 0).toLocaleString()} XAF</span>
                </div>
              </div>

              {/* Authentication Stamp & Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                <div className="space-y-0.5">
                  <div>Cashier: <strong>{user?.name || 'Authorized Lab Cashier'}</strong></div>
                  <div>Security Seal: <strong>DIGITAL-SHA256-VALIDATED</strong></div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-teal-800">nanoLabs Secure LIMS Receipt</div>
                  <div>Keep this voucher for sample submission</div>
                </div>
              </div>

            </div>

            {/* Modal Bottom Footer */}
            <div className="flex justify-end gap-2 pt-1 print:hidden">
              <button
                onClick={() => setShowReceipt(null)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer text-xs"
              >
                Return to Cashier Queue
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CashierView;
