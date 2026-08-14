import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { limsService, PatientBooking } from '../../services/limsService';
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
  ArrowRight
} from 'lucide-react';

interface CashierViewProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

export const CashierView: React.FC<CashierViewProps> = ({ onNotificationPress }) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card' | 'insurance'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<PatientBooking | null>(null);

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

  const handleCollectPayment = async () => {
    if (!selectedBooking) return;

    setIsProcessing(true);
    try {
      const ok = await limsService.processPayment({
        labId: targetLabId,
        bookingId: selectedBooking.id,
        paymentMethod,
        processedByName: user?.name || 'Head Cashier'
      });

      if (ok) {
        setShowReceipt(selectedBooking);
        setSelectedBooking(null);
        await fetchData();
      }
    } catch (e) {
      console.error('Payment collection error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const unpaidBookings = bookings.filter(b => b.paymentStatus === 'unpaid');
  const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');

  const filteredUnpaid = unpaidBookings.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Header
        title="Cashier & Financial Gatekeeper Desk"
        subtitle="Step 2: Collect payment, mark order as PAID & unlock patient for Phlebotomy queue"
      />

      {/* Gatekeeping Notice Banner */}
      <div className="bg-emerald-900/90 text-white p-4 rounded-2xl border border-emerald-700 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">LIMS Payment Gatekeeping Rule Enforced</h3>
            <p className="text-xs text-emerald-100/80">
              Unpaid patient booklets are strictly blocked from the Phlebotomist Sample Collection queue until settled here.
            </p>
          </div>
        </div>

        <div className="text-right text-xs shrink-0 font-mono font-bold text-emerald-200 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800">
          Unpaid Orders Pending: {unpaidBookings.length}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search unpaid patient name, Booking ID (BK-...), or Invoice number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Unpaid Invoices Queue Table */}
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
            {filteredUnpaid.map((booking) => (
              <div key={booking.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {booking.patientName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      {booking.bookingCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      UNPAID INVOICE
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span>Invoice: <strong className="font-mono text-slate-700">{booking.invoiceNumber}</strong></span>
                    <span>Doctor: <strong>{booking.doctorName || 'Dr. Hiren Shah'}</strong></span>
                    <span>Tests: <strong className="text-slate-800 font-bold">{booking.tests.length} tests</strong></span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {booking.tests.map(t => (
                      <span key={t.id} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px]">
                        {t.testName} ({t.price.toLocaleString()} XAF)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Amount Due</div>
                    <div className="text-lg font-black text-emerald-600 font-mono">
                      {booking.totalAmount.toLocaleString()} XAF
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <DollarSign className="w-4 h-4" />
                    Collect Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                <div className="text-slate-400">Patient Name</div>
                <div className="text-base font-black text-white">{selectedBooking.patientName}</div>
                <div className="text-slate-300">Total Items: {selectedBooking.tests.length} tests</div>
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

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-bold">Total Settlement Amount:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {selectedBooking.totalAmount.toLocaleString()} XAF
                </span>
              </div>

              <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                Clicking confirm will immediately mark order as PAID and push patient to Phlebotomy Queue.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCollectPayment}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isProcessing ? 'Processing Payment...' : 'Confirm Payment & Push to Phlebotomy'}
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
              Receipt issued for <strong>{showReceipt.patientName}</strong> ({showReceipt.bookingCode}).
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 text-left font-mono">
              <div className="flex justify-between"><span>Invoice:</span> <strong>{showReceipt.invoiceNumber}</strong></div>
              <div className="flex justify-between"><span>Method:</span> <strong className="uppercase">{paymentMethod}</strong></div>
              <div className="flex justify-between"><span>Amount Paid:</span> <strong className="text-emerald-700">{showReceipt.totalAmount.toLocaleString()} XAF</strong></div>
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
