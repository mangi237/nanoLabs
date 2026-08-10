import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { db } from '../../services/firebase';
import { authService } from '../../services/authService';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  Receipt, 
  User, 
  Key,
  X,
  Lock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  Landmark,
  Shield,
  FileText,
  Printer,
  Copy,
  Check,
  Filter,
  Eye,
  Building2,
  Calendar,
  Activity,
  TestTube,
  Layers,
  Sparkles
} from 'lucide-react';

interface CashierViewProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

type PaymentMethodType = 'cash' | 'mtn_momo' | 'orange_money' | 'bank_transfer' | 'insurance';

export const CashierView: React.FC<CashierViewProps> = ({
  onBack,
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress
}) => {
  const { lab, user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  
  // Verification Modal State
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  
  // Insurance specific fields
  const [insuranceCompany, setInsuranceCompany] = useState('Ascoma');
  const [customInsuranceCompany, setCustomInsuranceCompany] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceCoverageType, setInsuranceCoverageType] = useState<'full' | 'partial'>('full');
  const [insuranceCoveragePercent, setInsuranceCoveragePercent] = useState<number>(100);
  const [patientCoPayMethod, setPatientCoPayMethod] = useState<'cash' | 'mtn_momo' | 'orange_money' | 'bank_transfer'>('cash');
  const [patientCoPayRef, setPatientCoPayRef] = useState('');
  const [patientCoPayPhone, setPatientCoPayPhone] = useState('');
  
  // Digital / MoMo / Bank fields
  const [transactionReference, setTransactionReference] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [bankName, setBankName] = useState('UBA Cameroon');
  
  // Cashier Access Code
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Detailed Receipt Modal State
  const [receiptModalBill, setReceiptModalBill] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const targetLabId = lab?.id || 'lab-1';
      const patientsSnapshot = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const allBills: any[] = [];

      patientsSnapshot.docs.forEach(docSnap => {
        const patientData = docSnap.data();
        if (patientData.labTests && Array.isArray(patientData.labTests)) {
          patientData.labTests.forEach((test: any) => {
            const isPaid = test.paymentStatus === 'paid' || test.paid === true;
            const systemFee = test.systemFee !== undefined ? Number(test.systemFee) : 500;
            const baseAmount = test.basePrice !== undefined ? Number(test.basePrice) : (test.price ? Number(test.price) : 5000);
            const totalAmount = test.totalPrice !== undefined 
              ? Number(test.totalPrice) 
              : (test.basePrice !== undefined 
                  ? (baseAmount + systemFee) 
                  : (test.systemFee !== undefined ? (baseAmount + systemFee) : (baseAmount + 500)));

            const isReceptionCheckedIn = 
              test.confirmedByReceptionist === true || 
              patientData.confirmedByReceptionist === true || 
              patientData.checkedIn === true || 
              patientData.receptionCheckedIn === true || 
              patientData.status === 'active' || 
              patientData.status === 'confirmed' ||
              test.sampleCollected === true ||
              ['confirmed', 'sample-collected', 'collected', 'processing', 'completed', 'paid'].includes(test.status);

            allBills.push({
              id: `${docSnap.id}-${test.id}`,
              testId: test.id,
              patientId: docSnap.id,
              patientName: patientData.name || patientData.fullName || 'Patient Record',
              patientCode: patientData.patientId || patientData.accessCode || 'P-1000',
              patientPhone: patientData.phone || patientData.contact || '',
              patientEmail: patientData.email || '',
              patientGender: patientData.gender || 'N/A',
              patientAge: patientData.age || 'N/A',
              testName: test.testName || test.name || 'Lab Test',
              category: test.category || 'Clinical',
              baseAmount: baseAmount,
              systemFee: systemFee,
              amount: totalAmount,
              priceDisplay: `${baseAmount.toLocaleString()} + ${systemFee.toLocaleString()} FCFA System Fee`,
              status: isPaid ? 'paid' : 'unpaid',
              confirmedByReceptionist: isReceptionCheckedIn,
              paymentMethod: test.paymentMethod || (isPaid ? 'cash' : undefined),
              paymentMethodLabel: test.paymentMethodLabel || (isPaid ? 'Cash' : undefined),
              receiptNumber: test.receiptNumber || (isPaid ? `REC-${Math.floor(100000 + Math.random() * 900000)}` : undefined),
              paymentReference: test.paymentReference,
              insuranceDetails: test.insuranceDetails,
              paidAt: test.paidAt,
              paidBy: test.paidBy,
              cashierCode: test.cashierCode,
              date: test.requestedDate || test.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
            });
          });
        }
      });

      setBills(allBills);
    } catch (err) {
      console.error('Error fetching billing records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [lab?.id]);

  const handleOpenVerifyModal = (bill: any) => {
    setSelectedBill(bill);
    setPaymentMethod('cash');
    setInsuranceCompany('Ascoma');
    setCustomInsuranceCompany('');
    setInsurancePolicyNumber('');
    setInsuranceCoverageType('full');
    setInsuranceCoveragePercent(100);
    setPatientCoPayMethod('cash');
    setPatientCoPayRef('');
    setPatientCoPayPhone(bill.patientPhone || '');
    setTransactionReference('');
    setPayerPhone(bill.patientPhone || '');
    setBankName('UBA Cameroon');
    setAccessCodeInput('');
    setVerifyError('');
    setShowVerifyModal(true);
  };

  const handleOpenReceiptModal = (bill: any) => {
    setReceiptModalBill(bill);
    setShowReceiptModal(true);
    setCopiedReceipt(false);
  };

  const handleConfirmPaymentWithCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerifyError('');

    // Validate Insurance fields
    if (paymentMethod === 'insurance') {
      if (!insurancePolicyNumber.trim()) {
        setVerifyError('Insurance Policy / Card Number is required for insurance payments.');
        return;
      }
      if (insuranceCompany === 'Other' && !customInsuranceCompany.trim()) {
        setVerifyError('Please enter the name of the Insurance Company.');
        return;
      }
    }

    if (!selectedBill?.confirmedByReceptionist) {
      setVerifyError('Validation blocked: Patient has not been received and checked in by the Receptionist.');
      return;
    }

    if (!accessCodeInput.trim()) {
      setVerifyError('Cashier access code is required to authorize payment.');
      return;
    }

    setProcessingId(selectedBill?.id);
    try {
      // Validate staff access code
      const authCheck = await authService.verifyStaffActionCode(
        accessCodeInput, 
        ['cashier', 'superadmin', 'admin'],
        user?.accessCode
      );

      if (!authCheck.authorized) {
        setVerifyError(authCheck.error || 'Invalid Cashier access code.');
        setProcessingId(null);
        return;
      }

      const targetLabId = lab?.id || 'lab-1';
      const patientRef = doc(db, 'labs', targetLabId, 'patients', selectedBill.patientId);
      const patientsSnap = await getDocs(collection(db, 'labs', targetLabId, 'patients'));
      const targetDoc = patientsSnap.docs.find(d => d.id === selectedBill.patientId);

      const basePrice = selectedBill.baseAmount || selectedBill.price || 5000;
      const sysFee = selectedBill.systemFee !== undefined ? selectedBill.systemFee : 500;
      const totalFee = selectedBill.amount || (basePrice + sysFee);

      // Construct payment method label & metadata
      let methodLabel = 'Cash';
      let insuranceData = null;
      let referenceCode = transactionReference.trim() || null;

      if (paymentMethod === 'cash') {
        methodLabel = 'Cash';
      } else if (paymentMethod === 'mtn_momo') {
        methodLabel = 'MTN Mobile Money';
        if (payerPhone) referenceCode = referenceCode ? `${referenceCode} (${payerPhone})` : `MoMo: ${payerPhone}`;
      } else if (paymentMethod === 'orange_money') {
        methodLabel = 'Orange Mobile Money';
        if (payerPhone) referenceCode = referenceCode ? `${referenceCode} (${payerPhone})` : `OM: ${payerPhone}`;
      } else if (paymentMethod === 'bank_transfer') {
        methodLabel = `Bank Transfer (${bankName})`;
      } else if (paymentMethod === 'insurance') {
        const finalCompany = insuranceCompany === 'Other' ? customInsuranceCompany.trim() : insuranceCompany;
        const isFull = insuranceCoverageType === 'full' || insuranceCoveragePercent === 100;
        const insPct = isFull ? 100 : Math.max(0, Math.min(100, insuranceCoveragePercent));
        const patPct = 100 - insPct;
        const insAmount = Math.round(totalFee * (insPct / 100));
        const patCoPayAmount = totalFee - insAmount;

        const coPayLabels: Record<string, string> = {
          cash: 'Cash',
          mtn_momo: 'MTN MoMo',
          orange_money: 'Orange Money',
          bank_transfer: 'Bank Transfer'
        };
        const coPayLabel = coPayLabels[patientCoPayMethod] || 'Cash';

        if (isFull) {
          methodLabel = `Insurance: ${finalCompany} (100% Full Cover)`;
        } else {
          methodLabel = `Insurance: ${finalCompany} (${insPct}% Ins / ${patPct}% Co-Pay via ${coPayLabel})`;
        }

        insuranceData = {
          coverageType: isFull ? 'full' : 'partial',
          company: finalCompany,
          policyNumber: insurancePolicyNumber.trim(),
          insurancePercent: insPct,
          patientPercent: patPct,
          insuranceAmount: insAmount,
          patientCoPayAmount: patCoPayAmount,
          patientCoPayMethod: patientCoPayMethod,
          patientCoPayMethodLabel: coPayLabel,
          patientCoPayRef: patientCoPayRef.trim() || null,
          patientCoPayPhone: patientCoPayPhone.trim() || null
        };
      }

      const generatedReceiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const cashierSignatureName = authCheck.staffName || user?.name || 'Authorized Cashier';

      if (targetDoc) {
        const patientData = targetDoc.data();
        const updatedTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === selectedBill.testId) {
            return {
              ...t,
              basePrice: basePrice,
              systemFee: sysFee,
              price: totalFee,
              totalPrice: totalFee,
              priceDisplay: `${basePrice.toLocaleString()} + ${sysFee.toLocaleString()} FCFA System Fee`,
              paymentStatus: 'paid',
              paid: true,
              paidAt: new Date().toISOString(),
              paidBy: cashierSignatureName,
              cashierCode: accessCodeInput,
              paymentMethod: paymentMethod,
              paymentMethodLabel: methodLabel,
              receiptNumber: generatedReceiptNumber,
              paymentReference: referenceCode,
              insuranceDetails: insuranceData
            };
          }
          return t;
        });

        await updateDoc(patientRef, { 
          labTests: updatedTests,
          updatedAt: new Date().toISOString()
        });
      }

      setShowVerifyModal(false);
      await fetchBills();
    } catch (err: any) {
      console.error('Failed to process payment:', err);
      setVerifyError(err?.message || 'Payment processing failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const unpaidBills = bills.filter(b => b.status === 'unpaid');
  const paidBills = bills.filter(b => b.status === 'paid');

  const totalUnpaidAmount = unpaidBills.reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalPaidAmount = paidBills.reduce((acc, b) => acc + (b.amount || 0), 0);

  // Clear financial separation between Lab Diagnostic Revenue and 500 FCFA Platform System Fee
  const totalPaidLabShare = paidBills.reduce((acc, b) => {
    const sysFee = b.systemFee !== undefined ? b.systemFee : 500;
    const base = b.baseAmount !== undefined ? b.baseAmount : Math.max(0, (b.amount || 0) - sysFee);
    return acc + base;
  }, 0);
  const totalPaidSystemFees = paidBills.reduce((acc, b) => {
    return acc + (b.systemFee !== undefined ? b.systemFee : 500);
  }, 0);

  const totalUnpaidLabShare = unpaidBills.reduce((acc, b) => {
    const sysFee = b.systemFee !== undefined ? b.systemFee : 500;
    const base = b.baseAmount !== undefined ? b.baseAmount : Math.max(0, (b.amount || 0) - sysFee);
    return acc + base;
  }, 0);
  const totalUnpaidSystemFees = unpaidBills.reduce((acc, b) => {
    return acc + (b.systemFee !== undefined ? b.systemFee : 500);
  }, 0);

  // Filter bills
  const billsToFilter = activeTab === 'unpaid' ? unpaidBills : paidBills;
  const filteredBills = billsToFilter.filter(b => {
    const matchesSearch = 
      b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.insuranceDetails?.policyNumber && b.insuranceDetails.policyNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.receiptNumber && b.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'paid' && methodFilter !== 'all') {
      return b.paymentMethod === methodFilter;
    }

    return true;
  });

  const getPaymentMethodBadge = (bill: any) => {
    const method = bill.paymentMethod || 'cash';
    if (method === 'cash') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <DollarSign className="w-3 h-3 text-emerald-600" />
          Cash
        </span>
      );
    }
    if (method === 'mtn_momo') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Smartphone className="w-3 h-3 text-amber-700" />
          MTN MoMo
        </span>
      );
    }
    if (method === 'orange_money') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-100 text-orange-900 border border-orange-300">
          <Smartphone className="w-3 h-3 text-orange-600" />
          Orange Money
        </span>
      );
    }
    if (method === 'bank_transfer') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
          <Landmark className="w-3 h-3 text-blue-700" />
          Bank Transfer
        </span>
      );
    }
    if (method === 'insurance') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
          <Shield className="w-3 h-3 text-purple-700" />
          Insurance {bill.insuranceDetails?.policyNumber ? `(#${bill.insuranceDetails.policyNumber})` : ''}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        Paid
      </span>
    );
  };

  const copyReceiptDetails = () => {
    if (!receiptModalBill) return;
    const baseFee = receiptModalBill.baseAmount || 5000;
    const sysFee = receiptModalBill.systemFee !== undefined ? receiptModalBill.systemFee : 500;
    const totalAmount = receiptModalBill.amount || (baseFee + sysFee);

    let insuranceSplitText = '';
    if (receiptModalBill.insuranceDetails) {
      const ins = receiptModalBill.insuranceDetails;
      insuranceSplitText = `Insurance Provider: ${ins.company}
Policy / Card #: ${ins.policyNumber}
Coverage: ${ins.insurancePercent || ins.coveragePercent || 100}% (${(ins.insuranceAmount || totalAmount).toLocaleString()} FCFA billed to Insurance)
${ins.patientPercent && ins.patientPercent > 0 ? `Patient Co-Pay: ${ins.patientPercent}% (${(ins.patientCoPayAmount || 0).toLocaleString()} FCFA paid via ${ins.patientCoPayMethodLabel || ins.patientCoPayMethod || 'Cash'})\n` : ''}`;
    }

    const text = `========================================
${lab?.name || 'nanoLabs Medical Diagnostics'}
OFFICIAL CASHIER PAYMENT RECEIPT
Receipt #: ${receiptModalBill.receiptNumber || 'N/A'}
Date: ${receiptModalBill.paidAt ? new Date(receiptModalBill.paidAt).toLocaleString() : receiptModalBill.date}
========================================
Patient: ${receiptModalBill.patientName} (${receiptModalBill.patientCode})
Diagnostic Test: ${receiptModalBill.testName} (${receiptModalBill.category})
----------------------------------------
FEE BREAKDOWN:
- Diagnostic Procedure: ${baseFee.toLocaleString()} FCFA
- nanoLabs System Fee: ${sysFee.toLocaleString()} FCFA
Total Amount Settled: ${totalAmount.toLocaleString()} FCFA (${baseFee.toLocaleString()} + ${sysFee.toLocaleString()} FCFA System Fee)
----------------------------------------
Payment Method: ${receiptModalBill.paymentMethodLabel || receiptModalBill.paymentMethod || 'Cash'}
${insuranceSplitText}${receiptModalBill.paymentReference && !receiptModalBill.insuranceDetails ? `Transaction Ref: ${receiptModalBill.paymentReference}\n` : ''}Payment Status: PAID & VERIFIED
Authorized Cashier: ${receiptModalBill.paidBy || 'Authorized Cashier'}
========================================`;
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Cashier & Financial Desk"
        subtitle="Manage invoice verification, payment methods & receipts"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Branded Lab Gradient Banner */}
        <div 
          style={{
            background: `linear-gradient(135deg, ${lab?.primaryColor || '#047857'}, ${lab?.secondaryColor || '#065f46'})`
          }}
          className="rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
              <CreditCard className="w-3.5 h-3.5" />
              Financial Settlement & Billing Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {lab?.name || 'nanoLabs Health Center'} Cashier Register
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Collect diagnostic payments, manage insurance co-pays, verify staff transactions, and issue cryptographic receipts.
            </p>
          </div>

          {/* Big Circled Logo at right side */}
          <div className="shrink-0 self-center sm:self-auto">
            {lab?.logoUrl ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/40 bg-white/10 backdrop-blur-md shadow-2xl p-1 flex items-center justify-center overflow-hidden">
                <img
                  src={lab.logoUrl}
                  alt={lab.name || 'Lab Logo'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/40 bg-white/20 backdrop-blur-md shadow-2xl flex items-center justify-center text-white">
                <CreditCard className="w-10 h-10 stroke-[2.5]" />
              </div>
            )}
          </div>
        </div>

        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cashier Billing & Verification Register</h2>
              <p className="text-xs text-slate-500">
                Collect payments (Cash, MTN MoMo, Orange Money, Bank Transfer, Insurance), verify with access code & issue receipts
              </p>
            </div>
          </div>

          <button 
            onClick={() => { setRefreshing(true); fetchBills(); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh Register
          </button>
        </div>

        {/* Metrics Row - 4 Analytical Cards with Distinct Financial Separation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Gross Cashier Collections */}
          <div className="bg-emerald-50/90 border border-emerald-200/90 p-4 rounded-2xl flex items-center gap-3.5 shadow-2xs">
            <div className="w-11 h-11 bg-emerald-600/15 rounded-xl flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-black text-slate-900 truncate">{totalPaidAmount.toLocaleString()} FCFA</div>
              <div className="text-xs font-bold text-emerald-900 truncate">Total Gross Collections</div>
              <p className="text-[10px] text-emerald-800/80 mt-0.5">{paidBills.length} Settled Invoices</p>
            </div>
          </div>

          {/* Card 2: Lab Diagnostic Share (Facility Revenue) */}
          <div className="bg-teal-50/90 border border-teal-200/90 p-4 rounded-2xl flex items-center gap-3.5 shadow-2xs">
            <div className="w-11 h-11 bg-teal-600/15 rounded-xl flex items-center justify-center text-teal-700 shrink-0">
              <TestTube className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-black text-teal-950 truncate">{totalPaidLabShare.toLocaleString()} FCFA</div>
              <div className="text-xs font-bold text-teal-900 truncate">Lab Tests Revenue</div>
              <p className="text-[10px] text-teal-800/80 mt-0.5">Facility Diagnostic Procedures</p>
            </div>
          </div>

          {/* Card 3: 500 FCFA Platform System Fee */}
          <div className="bg-indigo-50/90 border border-indigo-200/90 p-4 rounded-2xl flex items-center gap-3.5 shadow-2xs">
            <div className="w-11 h-11 bg-indigo-600/15 rounded-xl flex items-center justify-center text-indigo-700 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-black text-indigo-950 truncate">{totalPaidSystemFees.toLocaleString()} FCFA</div>
              <div className="text-xs font-bold text-indigo-900 truncate">500 XAF System Fee</div>
              <p className="text-[10px] text-indigo-800/80 mt-0.5">{paidBills.length} tests × 500 FCFA</p>
            </div>
          </div>

          {/* Card 4: Pending Receivables */}
          <div className="bg-amber-50/90 border border-amber-200/90 p-4 rounded-2xl flex items-center gap-3.5 shadow-2xs">
            <div className="w-11 h-11 bg-amber-500/15 rounded-xl flex items-center justify-center text-amber-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-black text-slate-900 truncate">{totalUnpaidAmount.toLocaleString()} FCFA</div>
              <div className="text-xs font-bold text-amber-900 truncate">Pending Receivables</div>
              <p className="text-[10px] text-amber-800/80 mt-0.5">{unpaidBills.length} Awaiting Cashier</p>
            </div>
          </div>
        </div>

        {/* Financial Separation Reconciliation Summary Box */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>Revenue Separation Ledger</span>
                <span className="text-[10px] font-mono px-2 py-0.2 bg-teal-500/30 text-teal-200 rounded-full">
                  500 XAF Fee Rule
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Diagnostic laboratory procedure revenue is strictly isolated from the 500 XAF platform processing fee.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 w-full md:w-auto justify-between md:justify-end text-[11px]">
            <div>
              <span className="text-teal-300 block text-[10px] uppercase font-bold">Lab Test Share</span>
              <span className="font-bold text-white font-mono">{totalPaidLabShare.toLocaleString()} FCFA</span>
            </div>
            <span className="text-slate-400 font-bold text-sm">+</span>
            <div>
              <span className="text-indigo-300 block text-[10px] uppercase font-bold">System Platform Fee</span>
              <span className="font-bold text-white font-mono">{totalPaidSystemFees.toLocaleString()} FCFA</span>
            </div>
            <span className="text-slate-400 font-bold text-sm">=</span>
            <div className="text-right pl-1 border-l border-white/20">
              <span className="text-emerald-300 block text-[10px] uppercase font-bold">Total Cashiered</span>
              <span className="font-extrabold text-emerald-300 font-mono text-xs">{totalPaidAmount.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

        {/* Tabs & Search Filter */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('unpaid')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'unpaid'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending Invoices ({unpaidBills.length})
              </button>
              <button
                onClick={() => setActiveTab('paid')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'paid'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid & Verified Receipts ({paidBills.length})
              </button>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search patient, test, code or policy #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Payment Method Filter when viewing Paid Receipts */}
          {activeTab === 'paid' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Method:
              </span>
              {[
                { id: 'all', label: 'All Methods' },
                { id: 'cash', label: '💵 Cash' },
                { id: 'mtn_momo', label: '🟡 MTN MoMo' },
                { id: 'orange_money', label: '🟠 Orange Money' },
                { id: 'bank_transfer', label: '🏦 Bank Transfer' },
                { id: 'insurance', label: '🛡️ Insurance' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethodFilter(m.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                    methodFilter === m.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bills List / Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading billing records...
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="py-16 text-center px-4 space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No invoices found</p>
              <p className="text-xs text-slate-500">
                {activeTab === 'unpaid' 
                  ? 'All patient invoices have been settled.' 
                  : 'No payment receipts matching your search filter.'}
              </p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <div key={bill.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{bill.testName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {bill.category}
                    </span>

                    {bill.status === 'unpaid' && (
                      bill.confirmedByReceptionist ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reception Check-In Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Awaiting Reception Check-In
                        </span>
                      )
                    )}

                    {bill.status === 'paid' && getPaymentMethodBadge(bill)}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {bill.patientName} ({bill.patientCode})
                    </span>
                    <span>•</span>
                    <span>Date: {bill.date}</span>
                    
                    {bill.status === 'paid' && bill.paidBy && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          Authorized by: {bill.paidBy}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Insurance or Reference Details Sub-banner */}
                  {bill.status === 'paid' && bill.insuranceDetails && (
                    <div className="mt-1 p-2 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center gap-3 flex-wrap">
                      <span className="font-bold flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-purple-700" />
                        Provider: {bill.insuranceDetails.company}
                      </span>
                      <span>Policy #: <strong>{bill.insuranceDetails.policyNumber}</strong></span>
                      <span>Covered: <strong>{bill.insuranceDetails.coveragePercent}%</strong></span>
                    </div>
                  )}

                  {bill.status === 'paid' && bill.paymentReference && !bill.insuranceDetails && (
                    <div className="text-[11px] text-slate-500">
                      Payment Ref: <span className="font-mono font-medium text-slate-700">{bill.paymentReference}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-base font-black text-slate-900">{(bill.amount || 5500).toLocaleString()} FCFA</div>
                    <div className="text-[11px] font-bold text-emerald-800">
                      {(bill.baseAmount || 5000).toLocaleString()} + {(bill.systemFee !== undefined ? bill.systemFee : 500).toLocaleString()} FCFA System Fee
                    </div>
                  </div>

                  {bill.status === 'unpaid' ? (
                    bill.confirmedByReceptionist ? (
                      <button
                        onClick={() => handleOpenVerifyModal(bill)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <DollarSign className="w-4 h-4" />
                        Verify Payment
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          disabled={true}
                          title="Patient must be received and checked in at Reception before payment validation."
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold cursor-not-allowed select-none opacity-80"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Check-In Required
                        </button>
                        <span className="text-[10px] text-amber-700 font-medium">Awaiting Front Desk</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReceiptModal(bill)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        View Payment Details
                      </button>

                      <span className="flex items-center gap-1 px-2.5 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Paid
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Cashier Payment Verification Modal */}
      {showVerifyModal && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Cashier Payment Verification</h3>
                  <p className="text-emerald-200 text-xs">Verify payment method & authorize transaction</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPaymentWithCode} className="p-6 space-y-5">
              {/* Bill Summary Box */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Patient & Procedure</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedBill.testName}</div>
                  <div className="text-slate-600 mt-0.5">
                    {selectedBill.patientName} • <span className="font-mono">{selectedBill.patientCode}</span>
                  </div>
                </div>

                <div className="text-right bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Due</span>
                  <span className="text-base font-black text-emerald-700 block">
                    {(selectedBill.amount || 5500).toLocaleString()} FCFA
                  </span>
                  <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded block">
                    {(selectedBill.baseAmount || 5000).toLocaleString()} + {(selectedBill.systemFee !== undefined ? selectedBill.systemFee : 500).toLocaleString()} FCFA System Fee
                  </span>
                </div>
              </div>

              {verifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* SECTION 1: PAYMENT METHOD SELECTION */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Select Payment Method Used by Customer <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Cash */}
                  <div
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-xs">Cash</span>
                  </div>

                  {/* MTN Mobile Money */}
                  <div
                    onClick={() => setPaymentMethod('mtn_momo')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                      paymentMethod === 'mtn_momo'
                        ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20 text-amber-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${paymentMethod === 'mtn_momo' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="text-xs">MTN MoMo</span>
                  </div>

                  {/* Orange Mobile Money */}
                  <div
                    onClick={() => setPaymentMethod('orange_money')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                      paymentMethod === 'orange_money'
                        ? 'bg-orange-50 border-orange-600 ring-2 ring-orange-500/20 text-orange-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${paymentMethod === 'orange_money' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="text-xs">Orange Money</span>
                  </div>

                  {/* Bank Transfer */}
                  <div
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 text-blue-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${paymentMethod === 'bank_transfer' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Landmark className="w-4 h-4" />
                    </div>
                    <span className="text-xs">Bank Transfer</span>
                  </div>

                  {/* Insurance Company */}
                  <div
                    onClick={() => setPaymentMethod('insurance')}
                    className={`col-span-2 sm:col-span-2 p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                      paymentMethod === 'insurance'
                        ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/20 text-purple-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${paymentMethod === 'insurance' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-xs">Insurance Company Policy</span>
                  </div>
                </div>
              </div>

              {/* CONDITIONAL SECTION: INSURANCE DETAILS */}
              {paymentMethod === 'insurance' && (() => {
                const basePrice = selectedBill?.baseAmount || selectedBill?.price || 5000;
                const sysFee = selectedBill?.systemFee !== undefined ? selectedBill.systemFee : 500;
                const totalBill = selectedBill?.amount || (basePrice + sysFee);
                const isFull = insuranceCoverageType === 'full';
                const insPct = isFull ? 100 : Math.max(0, Math.min(100, insuranceCoveragePercent));
                const patPct = 100 - insPct;
                const insAmount = Math.round(totalBill * (insPct / 100));
                const patCoPayAmount = totalBill - insAmount;

                return (
                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                        <Shield className="w-4 h-4 text-purple-700" />
                        Insurance Policy & Bill Splitting
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 uppercase">
                        {isFull ? '100% Full Cover' : `${insPct}% Ins / ${patPct}% Co-Pay`}
                      </span>
                    </div>

                    {/* Step A: Insurance Company & Policy */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-purple-950 uppercase mb-1">
                          Insurance Provider <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={insuranceCompany}
                          onChange={(e) => setInsuranceCompany(e.target.value)}
                          className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Ascoma">Ascoma Cameroon</option>
                          <option value="Gras Savoye">Gras Savoye / Willis</option>
                          <option value="SAHAM / Sanlam">SAHAM / Sanlam Assurances</option>
                          <option value="AXA Assurances">AXA Assurances</option>
                          <option value="Activa Assurances">Activa Assurances</option>
                          <option value="Zenithe Insurance">Zenithe Insurance</option>
                          <option value="Chanas Assurances">Chanas Assurances</option>
                          <option value="Beneficial Life">Beneficial Life Insurance</option>
                          <option value="Other">Other Insurance Company</option>
                        </select>
                      </div>

                      {insuranceCompany === 'Other' ? (
                        <div>
                          <label className="block text-[11px] font-bold text-purple-950 uppercase mb-1">
                            Specify Company Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Prudential Beneficial"
                            value={customInsuranceCompany}
                            onChange={(e) => setCustomInsuranceCompany(e.target.value)}
                            className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-bold text-purple-950 uppercase mb-1">
                            Policy / Member Card Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ASCOM-789012-CM"
                            value={insurancePolicyNumber}
                            onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                            className="w-full p-2.5 bg-white border border-purple-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      )}
                    </div>

                    {insuranceCompany === 'Other' && (
                      <div>
                        <label className="block text-[11px] font-bold text-purple-950 uppercase mb-1">
                          Policy / Member Card Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. POL-99218"
                          value={insurancePolicyNumber}
                          onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                          className="w-full p-2.5 bg-white border border-purple-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    {/* Step B: Coverage Split Mode (Full vs Partial Co-Pay) */}
                    <div className="space-y-2 pt-2 border-t border-purple-200/80">
                      <label className="block text-[11px] font-bold text-purple-950 uppercase">
                        Coverage Type & Bill Splitting
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setInsuranceCoverageType('full');
                            setInsuranceCoveragePercent(100);
                          }}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isFull 
                              ? 'bg-purple-600 text-white border-purple-700 font-bold shadow-xs' 
                              : 'bg-white text-purple-950 border-purple-200 hover:bg-purple-100/50'
                          }`}
                        >
                          <div className="text-xs">Full Coverage (100%)</div>
                          <div className={`text-[10px] ${isFull ? 'text-purple-100' : 'text-slate-500'}`}>
                            0 FCFA patient co-pay
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setInsuranceCoverageType('partial');
                            if (insuranceCoveragePercent === 100) setInsuranceCoveragePercent(80);
                          }}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            !isFull 
                              ? 'bg-purple-600 text-white border-purple-700 font-bold shadow-xs' 
                              : 'bg-white text-purple-950 border-purple-200 hover:bg-purple-100/50'
                          }`}
                        >
                          <div className="text-xs">Partial / Co-Pay Split</div>
                          <div className={`text-[10px] ${!isFull ? 'text-purple-100' : 'text-slate-500'}`}>
                            Select insurance & patient %
                          </div>
                        </button>
                      </div>

                      {/* Percentage Selector presets if Partial */}
                      {!isFull && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                              { label: '90% / 10%', pct: 90 },
                              { label: '80% / 20%', pct: 80 },
                              { label: '75% / 25%', pct: 75 },
                              { label: '70% / 30%', pct: 70 },
                              { label: '50% / 50%', pct: 50 },
                              { label: '40% / 60%', pct: 40 },
                            ].map((preset) => (
                              <button
                                key={preset.pct}
                                type="button"
                                onClick={() => setInsuranceCoveragePercent(preset.pct)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                  insuranceCoveragePercent === preset.pct
                                    ? 'bg-purple-700 text-white shadow-xs'
                                    : 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-100'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-purple-200">
                            <div>
                              <label className="block text-[10px] font-bold text-purple-900 mb-1">
                                Insurance Pays (%):
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  value={insuranceCoveragePercent}
                                  onChange={(e) => {
                                    const val = Math.max(1, Math.min(99, Number(e.target.value) || 0));
                                    setInsuranceCoveragePercent(val);
                                  }}
                                  className="w-full p-1.5 bg-purple-50 border border-purple-300 rounded-lg text-xs font-bold text-center text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                                <span className="text-xs font-bold text-purple-900">%</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-purple-900 mb-1">
                                Patient Pays (%):
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  value={100 - insuranceCoveragePercent}
                                  onChange={(e) => {
                                    const val = Math.max(1, Math.min(99, Number(e.target.value) || 0));
                                    setInsuranceCoveragePercent(100 - val);
                                  }}
                                  className="w-full p-1.5 bg-purple-50 border border-purple-300 rounded-lg text-xs font-bold text-center text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                                <span className="text-xs font-bold text-purple-900">%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step C: Live Split Breakdown Card */}
                    <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-2 text-xs">
                      <div className="font-bold text-purple-950 flex items-center justify-between border-b border-purple-100 pb-1.5">
                        <span>Calculated Bill Breakdown:</span>
                        <span className="font-mono text-purple-700 font-bold">{totalBill.toLocaleString()} FCFA Total</span>
                      </div>

                      <div className="flex justify-between items-center text-purple-900">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-purple-600" />
                          Insurance Portion ({insPct}%):
                        </span>
                        <span className="font-bold text-purple-950">{insAmount.toLocaleString()} FCFA</span>
                      </div>

                      <div className="flex justify-between items-center text-purple-900">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-600" />
                          Patient Co-Pay Portion ({patPct}%):
                        </span>
                        <span className={`font-black ${patCoPayAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {patCoPayAmount.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>

                    {/* Step D: If Patient Co-Pay > 0, Select Co-Pay Method */}
                    {!isFull && patCoPayAmount > 0 && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                        <label className="block text-[11px] font-bold text-amber-950 uppercase">
                          Patient Co-Pay Settlement Method ({patCoPayAmount.toLocaleString()} FCFA due)
                        </label>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'cash', label: 'Cash', icon: DollarSign },
                            { id: 'mtn_momo', label: 'MTN MoMo', icon: Smartphone },
                            { id: 'orange_money', label: 'Orange Money', icon: Smartphone },
                            { id: 'bank_transfer', label: 'POS / Card', icon: Landmark }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setPatientCoPayMethod(item.id as any)}
                              className={`p-2 rounded-lg border text-center text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                patientCoPayMethod === item.id
                                  ? 'bg-amber-600 text-white font-bold border-amber-700 shadow-xs'
                                  : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              <item.icon className="w-3.5 h-3.5" />
                              <span className="text-[11px]">{item.label}</span>
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Co-Pay Transaction ID (Optional)"
                            value={patientCoPayRef}
                            onChange={(e) => setPatientCoPayRef(e.target.value)}
                            className="p-2 bg-white border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <input
                            type="text"
                            placeholder="Co-Pay Payer Phone (Optional)"
                            value={patientCoPayPhone}
                            onChange={(e) => setPatientCoPayPhone(e.target.value)}
                            className="p-2 bg-white border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* CONDITIONAL SECTION: DIGITAL / MOMO / BANK REFERENCE */}
              {(paymentMethod === 'mtn_momo' || paymentMethod === 'orange_money') && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-700" />
                    Mobile Money Transaction Reference
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Payer Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +237 670 000 000"
                        value={payerPhone}
                        onChange={(e) => setPayerPhone(e.target.value)}
                        className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Transaction ID / Reference (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TXN-9981290"
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in text-xs">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-blue-700" />
                    Bank Transfer Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">
                        Bank Name
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="UBA Cameroon">UBA Cameroon</option>
                        <option value="Afriland First Bank">Afriland First Bank</option>
                        <option value="Ecobank">Ecobank Cameroon</option>
                        <option value="BICEC">BICEC</option>
                        <option value="SCB Cameroon">SCB Cameroon</option>
                        <option value="CCA Bank">CCA Bank</option>
                        <option value="Other Bank">Other Bank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">
                        Wire / Slip Reference #
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. WIRE-881923"
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: CASHIER AUTHORIZATION CODE */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  2. Cashier Security Access Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter Cashier code (e.g. CASH123)"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Cashier access code authorization verifies this transaction in the hospital ledger.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === selectedBill.id}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {processingId === selectedBill.id ? 'Authorizing...' : 'Authorize & Verify Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PAYMENT DETAILS & OFFICIAL RECEIPT MODAL */}
      {showReceiptModal && receiptModalBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Payment Receipt & Details</h3>
                  <p className="text-slate-400 text-xs">{receiptModalBill.receiptNumber || 'Official Transaction'}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Lab Header with Logo */}
              <div className="text-center border-b border-dashed border-slate-200 pb-4 space-y-2 flex flex-col items-center">
                {lab?.logoUrl ? (
                  <img
                    src={lab.logoUrl}
                    alt={lab.name || 'Lab Logo'}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm mx-auto bg-white p-0.5"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Activity className="w-6 h-6 stroke-[2.5]" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-black text-slate-900">{lab?.name || 'nanoLabs Medical Diagnostics'}</h2>
                  <p className="text-slate-500 text-[11px]">{lab?.slogan || 'Official Clinical Cashier Payment Receipt'}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Date: {receiptModalBill.paidAt ? new Date(receiptModalBill.paidAt).toLocaleString() : receiptModalBill.date}</p>
                </div>
              </div>

              {/* Patient & Invoice Info Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Patient Name:</span>
                  <span className="font-bold text-slate-900">{receiptModalBill.patientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Patient ID / Code:</span>
                  <span className="font-mono font-bold text-slate-800">{receiptModalBill.patientCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Diagnostic Procedure:</span>
                  <span className="font-bold text-slate-900">{receiptModalBill.testName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Test Category:</span>
                  <span className="font-semibold text-slate-700">{receiptModalBill.category}</span>
                </div>
              </div>

              {/* PAYMENT DETAILS SECTION */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3">
                <div className="font-bold text-emerald-900 text-xs flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span>Payment Settlement Details</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-extrabold uppercase">
                    PAID & VERIFIED
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Payment Method:</span>
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    {receiptModalBill.paymentMethodLabel || receiptModalBill.paymentMethod || 'Cash'}
                  </span>
                </div>

                {/* If Insurance */}
                {receiptModalBill.insuranceDetails && (
                  <div className="p-3.5 bg-white rounded-xl border border-purple-200 space-y-2 text-[11px] text-purple-950">
                    <div className="flex justify-between font-bold text-xs text-purple-900 border-b border-purple-100 pb-1">
                      <span>Insurance Policy Details</span>
                      <span>{receiptModalBill.insuranceDetails.coverageType === 'partial' ? 'Co-Pay Split' : '100% Full Coverage'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 font-medium">Insurance Provider:</span>
                      <span className="font-bold">{receiptModalBill.insuranceDetails.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 font-medium">Insurance Policy / Card #:</span>
                      <span className="font-mono font-bold">{receiptModalBill.insuranceDetails.policyNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 font-medium">Insurance Coverage Rate:</span>
                      <span className="font-bold text-purple-900">
                        {receiptModalBill.insuranceDetails.insurancePercent || receiptModalBill.insuranceDetails.coveragePercent || 100}%
                        ({(receiptModalBill.insuranceDetails.insuranceAmount || receiptModalBill.amount || 6000).toLocaleString()} FCFA)
                      </span>
                    </div>
                    {receiptModalBill.insuranceDetails.patientPercent && receiptModalBill.insuranceDetails.patientPercent > 0 && (
                      <div className="flex justify-between pt-1 border-t border-purple-100 font-semibold text-amber-900">
                        <span>Patient Co-Pay Settled ({receiptModalBill.insuranceDetails.patientPercent}%):</span>
                        <span>
                          {(receiptModalBill.insuranceDetails.patientCoPayAmount || 0).toLocaleString()} FCFA
                          <span className="text-slate-500 text-[10px] ml-1">
                            (via {receiptModalBill.insuranceDetails.patientCoPayMethodLabel || receiptModalBill.insuranceDetails.patientCoPayMethod || 'Cash'})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* If Reference */}
                {receiptModalBill.paymentReference && !receiptModalBill.insuranceDetails && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Transaction Ref:</span>
                    <span className="font-mono font-semibold text-slate-900">{receiptModalBill.paymentReference}</span>
                  </div>
                )}

                {/* Line Item Breakdown */}
                <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>1. Diagnostic Procedure Fee ({receiptModalBill.testName}):</span>
                    <span className="font-bold text-slate-900">{(receiptModalBill.baseAmount || 5000).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>2. nanoLabs System & Processing Fee:</span>
                    <span className="font-bold text-emerald-700">+{(receiptModalBill.systemFee !== undefined ? receiptModalBill.systemFee : 500).toLocaleString()} FCFA</span>
                  </div>
                  <div className="border-t border-slate-100 pt-1 flex justify-between items-center font-bold text-slate-800">
                    <span>Fee Structure:</span>
                    <span>{(receiptModalBill.baseAmount || 5000).toLocaleString()} + {(receiptModalBill.systemFee !== undefined ? receiptModalBill.systemFee : 500).toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-emerald-200/60 pt-2 text-sm">
                  <span className="font-bold text-slate-900">Total Amount Settled:</span>
                  <span className="font-black text-emerald-800 text-base">
                    {(receiptModalBill.amount || 5500).toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {/* Cashier Signature Box */}
              <div className="flex justify-between items-center p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Authorized by: <strong>{receiptModalBill.paidBy || 'Authorized Cashier'}</strong></span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">Security Verified</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={copyReceiptDetails}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedReceipt ? 'Copied Receipt!' : 'Copy Receipt Details'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(false)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierView;

