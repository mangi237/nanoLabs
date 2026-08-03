import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  Receipt, 
  User, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { collection, getDocs, updateDoc, doc } from '../../services/firebase';
import { db } from '../../services/firebase';

interface CashierViewProps {
  onNavigate?: (screen: string, params?: any) => void;
}

export const CashierView: React.FC<CashierViewProps> = () => {
  const { lab, user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const patientsSnapshot = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'patients'));
      const allBills: any[] = [];

      patientsSnapshot.docs.forEach(docSnap => {
        const patientData = docSnap.data();
        if (patientData.labTests && Array.isArray(patientData.labTests)) {
          patientData.labTests.forEach((test: any) => {
            allBills.push({
              id: `${docSnap.id}-${test.id}`,
              testId: test.id,
              patientId: docSnap.id,
              patientName: patientData.name || patientData.fullName || 'Unknown Patient',
              patientCode: patientData.patientId || 'P-000',
              testName: test.testName,
              category: test.category || 'General',
              amount: test.price || 5000,
              status: test.paymentStatus === 'paid' ? 'paid' : (test.status === 'completed' || test.status === 'collected' ? 'paid' : 'unpaid'),
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

  const handleCollectPayment = async (bill: any) => {
    setProcessingId(bill.id);
    try {
      const patientRef = doc(db, 'labs', lab?.id || 'lab-1', 'patients', bill.patientId);
      const patientsSnap = await getDocs(collection(db, 'labs', lab?.id || 'lab-1', 'patients'));
      const targetDoc = patientsSnap.docs.find(d => d.id === bill.patientId);

      if (targetDoc) {
        const patientData = targetDoc.data();
        const updatedTests = (patientData.labTests || []).map((t: any) => {
          if (t.id === bill.testId) {
            return {
              ...t,
              paymentStatus: 'paid',
              paidAt: new Date().toISOString(),
              paidBy: user?.name || 'Cashier'
            };
          }
          return t;
        });
        await updateDoc(patientRef, { labTests: updatedTests });
      }

      fetchBills();
    } catch (err) {
      console.error('Failed to process payment:', err);
      alert('Payment processing failed. Please try again.');
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
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Cashier & Financial Register</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Manage billing, issue receipts, and record patient payments.
          </p>
        </div>
        <button 
          onClick={() => { setRefreshing(true); fetchBills(); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          Refresh Register
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalUnpaidAmount.toLocaleString()} FCFA</div>
              <div className="text-sm font-medium text-amber-800">Pending Receivables ({unpaidBills.length} invoices)</div>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/80 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalPaidAmount.toLocaleString()} FCFA</div>
              <div className="text-sm font-medium text-emerald-800">Total Collected Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Billing Table/List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('unpaid')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'unpaid'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unpaid Invoices ({unpaidBills.length})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'paid'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid Receipts ({paidBills.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading billing queue...
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No invoices found</p>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === 'unpaid' 
                ? 'All patient invoices are settled.' 
                : 'No historical paid transactions found.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBills.map((bill) => (
              <div key={bill.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-base">{bill.testName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {bill.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium text-slate-900">
                      <User className="w-4 h-4 text-slate-400" />
                      {bill.patientName} ({bill.patientCode})
                    </span>
                    <span className="text-slate-400">• Date: {bill.date}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">{bill.amount.toLocaleString()} FCFA</div>
                    <div className="text-xs text-slate-500 font-medium">Standard Price</div>
                  </div>

                  {bill.status === 'unpaid' ? (
                    <button
                      onClick={() => handleCollectPayment(bill)}
                      disabled={processingId === bill.id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {processingId === bill.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          Collect Payment
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Paid & Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
