import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking, InsuranceDetails } from '../../services/limsService';
import { authService } from '../../services/authService';
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
  KeyRound
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card' | 'insurance'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<{ booking: PatientBooking; totalPaid: number; method: string } | null>(null);
  const [expandedPatientKey, setExpandedPatientKey] = useState<string | null>(null);

  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid');

  // --- Insurance state ---
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceCoverageType, setInsuranceCoverageType] = useState<'full' | 'partial'>('partial');
  const [insurancePercent, setInsurancePercent] = useState(70);
  const [coPayMethod, setCoPayMethod] = useState<'cash' | 'mobile_money' | 'card'>('cash');

  // --- Access code confirmation state ---
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);

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

  // The set of bookings currently being paid — either the group ("Collect All") or a single order.
  // This is the single source of truth the whole modal reads from, fixing the bug where the
  // modal only ever showed selectedBooking (the first order) even during a group payment.
  const activeBookings: PatientBooking[] = selectedGroupBookings
    ? selectedGroupBookings
    : (selectedBooking ? [selectedBooking] : []);

  const activeTotal = activeBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const insuranceAmount = insuranceCoverageType === 'full'
    ? activeTotal
    : Math.round(activeTotal * (insurancePercent / 100));
  const patientCoPayAmount = activeTotal - insuranceAmount;

  // What actually needs to be collected right now, depending on payment method
  const amountToCollectNow = paymentMethod === 'insurance' ? patientCoPayAmount : activeTotal;

  const resetModalState = () => {
    setSelectedBooking(null);
    setSelectedGroupBookings(null);
    setAccessCodeInput('');
    setAccessCodeError('');
    setPaymentMethod('cash');
    setInsuranceCompany('');
    setInsurancePolicyNumber('');
    setInsuranceCoverageType('partial');
    setInsurancePercent(70);
    setCoPayMethod('cash');
  };

  const handleCollectPayment = async () => {
    if (activeBookings.length === 0) return;

    setAccessCodeError('');

    // 1. Verify the staff access code BEFORE touching any payment data
    setVerifyingCode(true);
    const verification = await authService.verifyStaffActionCode(
      accessCodeInput,
      ['cashier', 'admin'],
      user?.accessCode,
      targetLabId
    );
    setVerifyingCode(false);

    if (!verification.authorized) {
      setAccessCodeError(verification.error || 'Invalid access code. Payment was not processed.');
      return;
    }

    // 2. Build insurance details if applicable
    const insuranceDetails: InsuranceDetails | undefined = paymentMethod === 'insurance'
      ? {
          company: insuranceCompany || 'Unspecified Insurer',
          policyNumber: insurancePolicyNumber || 'N/A',
          coverageType: insuranceCoverageType,
          insurancePercent: insuranceCoverageType === 'full' ? 100 : insurancePercent,
          patientPercent: insuranceCoverageType === 'full' ? 0 : (100 - insurancePercent),
          insuranceAmount,
          patientCoPayAmount,
          patientCoPayMethodLabel: patientCoPayAmount > 0 ? coPayMethod : undefined
        }
      : undefined;

    if (paymentMethod === 'insurance' && (!insuranceCompany || !insurancePolicyNumber)) {
      setAccessCodeError('Please enter the insurance company name and policy number.');
      return;
    }

    setIsProcessing(true);
    try {
      const staffName = verification.staffName || user?.name || 'Cashier';
      const results: { booking: PatientBooking; success: boolean; error?: string }[] = [];

      // 3. Process payment for every booking in the active set, splitting the co-pay
      //    proportionally across bookings when insurance covers part of the total.
      for (const b of activeBookings) {
        const bookingShareOfTotal = activeTotal > 0 ? (b.totalAmount || 0) / activeTotal : 0;
        const bookingAmountCollected = paymentMethod === 'insurance'
          ? Math.round(patientCoPayAmount * bookingShareOfTotal)
          : (b.totalAmount || 0);

        const bookingInsuranceDetails: InsuranceDetails | undefined = insuranceDetails
          ? {
              ...insuranceDetails,
              insuranceAmount: Math.round(insuranceAmount * bookingShareOfTotal),
              patientCoPayAmount: bookingAmountCollected
            }
          : undefined;

        const result = await limsService.processPayment({
          labId: targetLabId,
          booking: b,
          paymentMethod,
          processedByName: staffName,
          processedByRole: verification.staffName ? 'cashier' : (user?.role || 'cashier'),
          amountCollected: bookingAmountCollected,
          insuranceDetails: bookingInsuranceDetails
        });

        results.push({ booking: b, success: result.success, error: result.error });
      }

      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        // Do NOT show a success receipt if anything failed — this is exactly the bug being fixed
        setAccessCodeError(
          `${failed.length} of ${results.length} order(s) could not be processed: ${failed.map(f => f.error || f.booking.bookingCode).join('; ')}`
        );
      } else {
        setShowReceipt({
          booking: activeBookings[0],
          totalPaid: amountToCollectNow,
          method: paymentMethod
        });
        resetModalState();
      }

      await fetchData();
    } catch (e) {
      console.error('Payment collection error:', e);
      setAccessCodeError('An unexpected error occurred while processing payment. Please try again.');
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
            <div className="text-[10px] uppercase font-bold text-emerald-300 trackinfg-wider">
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
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Unpaid Invoices Awaiting Settlement ({filteredUnpaid.length})
            </h3>
            <span className="text-xs text-slate-500">Gatekeeper Status: Blocked from Phlebotomy</span>
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
                            {group.bookings.length} Unpaid Order{group.bookings.length > 1 ? 's' : ''}
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
                              setSelectedBooking(null);
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
                          {group.bookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                            >
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

                              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                <div className="text-right">
                                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Invoice Total</div>
                                  <div className="text-sm font-black text-emerald-700 font-mono">
                                    {(booking.totalAmount || 0).toLocaleString()} FCFA
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    setSelectedGroupBookings(null);
                                    setSelectedBooking(booking);
                                  }}
                                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  Verify & Pay Order
                                </button>
                              </div>
                            </div>
                          ))}
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
                        {b.insuranceDetails && (
                          <div className="text-[9px] text-slate-500 mt-1">
                            {b.insuranceDetails.company} • {b.insuranceDetails.coverageType === 'full' ? '100%' : `${b.insuranceDetails.insurancePercent}%`} covered
                          </div>
                        )}
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

      {/* COLLECT PAYMENT MODAL — now reads from activeBookings so group totals are always correct */}
      {activeBookings.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {activeBookings.length > 1 ? `Process Payment — ${activeBookings.length} Orders` : 'Process Patient Order Payment'}
                  </h3>
                  <p className="text-xs text-emerald-300">
                    {activeBookings.length > 1
                      ? activeBookings.map(b => b.bookingCode).join(', ')
                      : `Invoice ${activeBookings[0].invoiceNumber} • ${activeBookings[0].bookingCode}`}
                  </p>
                </div>
              </div>
              <button onClick={resetModalState} className="p-2 text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-800 rounded-2xl space-y-1">
                <div className="text-slate-400">Patient Name</div>
                <div className="text-base font-black text-white">{activeBookings[0].patientName}</div>
                <div className="text-slate-300">
                  Total Items: {activeBookings.reduce((sum, b) => sum + (b.tests?.length || 0), 0)} test(s) across {activeBookings.length} order{activeBookings.length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Itemized breakdown so the total is always verifiably correct */}
              {activeBookings.length > 1 && (
                <div className="p-3 bg-slate-800/60 rounded-xl space-y-1.5 max-h-32 overflow-y-auto">
                  {activeBookings.map(b => (
                    <div key={b.id} className="flex justify-between text-[11px] text-slate-300">
                      <span>{b.bookingCode} ({b.tests?.length || 0} test{b.tests?.length !== 1 ? 's' : ''})</span>
                      <span className="font-mono font-bold text-emerald-400">{(b.totalAmount || 0).toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
              )}

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

              {/* INSURANCE DETAILS PANEL — only shown when insurance is selected */}
              {paymentMethod === 'insurance' && (
                <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-purple-200 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Insurance Coverage Details
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Insurance company"
                      value={insuranceCompany}
                      onChange={e => setInsuranceCompany(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                    />
                    <input
                      type="text"
                      placeholder="Policy number"
                      value={insurancePolicyNumber}
                      onChange={e => setInsurancePolicyNumber(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInsuranceCoverageType('full')}
                      className={`flex-1 py-2 rounded-lg font-bold ${insuranceCoverageType === 'full' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                    >
                      100% Full Cover
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsuranceCoverageType('partial')}
                      className={`flex-1 py-2 rounded-lg font-bold ${insuranceCoverageType === 'partial' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                    >
                      Partial / Co-Pay
                    </button>
                  </div>

                  {insuranceCoverageType === 'partial' && (
                    <div className="space-y-1.5">
                      <label className="text-purple-200 text-[11px] font-semibold">Insurance covers: {insurancePercent}%</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={insurancePercent}
                        onChange={e => setInsurancePercent(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 bg-slate-800 rounded-lg">
                      <div className="text-[10px] text-slate-400">Billed to insurer</div>
                      <div className="font-mono font-bold text-purple-300">{insuranceAmount.toLocaleString()} FCFA</div>
                    </div>
                    <div className="p-2.5 bg-slate-800 rounded-lg">
                      <div className="text-[10px] text-slate-400">Patient co-pay (collect now)</div>
                      <div className="font-mono font-bold text-emerald-300">{patientCoPayAmount.toLocaleString()} FCFA</div>
                    </div>
                  </div>

                  {patientCoPayAmount > 0 && (
                    <div>
                      <label className="text-purple-200 text-[11px] font-semibold block mb-1">Co-pay collected via</label>
                      <div className="flex gap-2">
                        {(['cash', 'mobile_money', 'card'] as const).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setCoPayMethod(m)}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold ${coPayMethod === m ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                          >
                            {m === 'mobile_money' ? 'Mobile Money' : m.charAt(0).toUpperCase() + m.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-bold">
                  {paymentMethod === 'insurance' ? 'Amount To Collect Now (Co-Pay):' : 'Total Settlement Amount:'}
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {amountToCollectNow.toLocaleString()} XAF
                </span>
              </div>
              {paymentMethod === 'insurance' && (
                <div className="text-[10px] text-slate-500 -mt-2">
                  Invoice total: {activeTotal.toLocaleString()} FCFA — {insuranceAmount.toLocaleString()} FCFA billed to insurer, {patientCoPayAmount.toLocaleString()} FCFA collected from patient now.
                </div>
              )}

              {/* ACCESS CODE CONFIRMATION — required before any payment is processed */}
              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 text-amber-200 font-bold text-xs">
                  <KeyRound className="w-4 h-4" />
                  Enter your staff access code to confirm this transaction
                </label>
                <input
                  type="password"
                  value={accessCodeInput}
                  onChange={e => { setAccessCodeInput(e.target.value); setAccessCodeError(''); }}
                  placeholder="Your personal access code"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-amber-500/40 rounded-xl text-white placeholder-slate-500 tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoComplete="off"
                />
                {accessCodeError && (
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {accessCodeError}
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                Confirming will mark {activeBookings.length > 1 ? 'these orders' : 'this order'} as PAID, log this action (with your verified identity) to the patient's audit trail, and push the patient to the Phlebotomy queue.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetModalState}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing || verifyingCode || !accessCodeInput.trim()}
                  onClick={handleCollectPayment}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {verifyingCode ? 'Verifying Code...' : isProcessing ? 'Processing Payment...' : 'Confirm Payment & Push to Phlebotomy'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RECEIPT CONFIRMATION MODAL */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Payment Settled Successfully!</h3>
            <p className="text-xs text-slate-600">
              Receipt issued for <strong>{showReceipt.booking.patientName}</strong>.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 text-left font-mono">
              <div className="flex justify-between"><span>Method:</span> <strong className="uppercase">{showReceipt.method}</strong></div>
              <div className="flex justify-between"><span>Amount Collected:</span> <strong className="text-emerald-700">{showReceipt.totalPaid.toLocaleString()} XAF</strong></div>
              <div className="flex justify-between"><span>Phlebotomy Queue:</span> <strong className="text-emerald-600">UNLOCKED</strong></div>
            </div>

            <button
              onClick={() => setShowReceipt(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
            >
              Done / Return to Queue
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CashierView;