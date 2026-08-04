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
  AlertCircle
} from 'lucide-react';

interface CashierViewProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const CashierView: React.FC<CashierViewProps> = ({
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  const { lab, user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  
  // Verification Modal State
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

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
            allBills.push({
              id: `${docSnap.id}-${test.id}`,
              testId: test.id,
              patientId: docSnap.id,
              patientName: patientData.name || patientData.fullName || 'Patient Record',
              patientCode: patientData.patientId || patientData.accessCode || 'P-1000',
              testName: test.testName || test.name || 'Lab Test',
              category: test.category || 'Clinical',
              amount: test.price || test.amount || 5000,
              status: isPaid ? 'paid' : 'unpaid',
              paidAt: test.paidAt,
              paidBy: test.paidBy,
              date: test.requestedDate || new Date().toISOString().split('T')[0]
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
    setAccessCodeInput('');
    setVerifyError('');
    setShowVerifyModal(true);
  };

  const handleConfirmPaymentWithCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerifyError('');

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

      if (targetDoc) {
        const patientData = targetDoc.data();
        const updatedTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === selectedBill.testId) {
            return {
              ...t,
              paymentStatus: 'paid',
              paid: true,
              paidAt: new Date().toISOString(),
              paidBy: authCheck.staffName || user?.name || 'Authorized Cashier'
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
      fetchBills();
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

  const filteredBills = (activeTab === 'unpaid' ? unpaidBills : paidBills).filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.patientCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Cashier & Financial Desk"
        subtitle="Manage invoice verification, payments & receipts"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cashier Register</h2>
              <p className="text-xs text-slate-500">Collect payment & verify patient invoices with access code authorization</p>
            </div>
          </div>

          <button 
            onClick={() => { setRefreshing(true); fetchBills(); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh Invoices
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{totalUnpaidAmount.toLocaleString()} FCFA</div>
              <div className="text-xs font-bold text-amber-800">Pending Receivables ({unpaidBills.length} Invoices)</div>
              <p className="text-[11px] text-amber-700/80 mt-0.5">Awaiting cashier payment verification</p>
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{totalPaidAmount.toLocaleString()} FCFA</div>
              <div className="text-xs font-bold text-emerald-800">Total Collected Today</div>
              <p className="text-[11px] text-emerald-700/80 mt-0.5">Verified & settled patient payments</p>
            </div>
          </div>
        </div>

        {/* Tabs & Search */}
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
              Unpaid Invoices ({unpaidBills.length})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'paid'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid Receipts ({paidBills.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search patient name, test or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading billing invoices...
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="py-16 text-center px-4 space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No invoices found</p>
              <p className="text-xs text-slate-500">
                {activeTab === 'unpaid' 
                  ? 'All patient invoices have been settled.' 
                  : 'No historical paid receipts recorded yet.'}
              </p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <div key={bill.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{bill.testName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {bill.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {bill.patientName} ({bill.patientCode})
                    </span>
                    <span>• Date: {bill.date}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">{(bill.amount || 5000).toLocaleString()} FCFA</div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Lab Test Fee</div>
                  </div>

                  {bill.status === 'unpaid' ? (
                    <button
                      onClick={() => handleOpenVerifyModal(bill)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      Verify Payment
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Paid & Verified
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Access Code Verification Modal */}
      {showVerifyModal && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-base">Cashier Authorization</h3>
                  <p className="text-emerald-200 text-xs">Verify payment for {selectedBill.patientName}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPaymentWithCode} className="p-6 space-y-4">
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold">{selectedBill.testName}</div>
                <div>Amount: <strong>{(selectedBill.amount || 5000).toLocaleString()} FCFA</strong></div>
                <div className="text-[11px] text-emerald-700">Patient: {selectedBill.patientName} ({selectedBill.patientCode})</div>
              </div>

              {verifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  Enter Cashier Access Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="e.g. CASH123"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Use your assigned Cashier access code (e.g., CASH123) to sign this transaction.
                </p>
              </div>

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
                  {processingId === selectedBill.id ? 'Authorizing...' : 'Confirm & Authorize Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierView;
