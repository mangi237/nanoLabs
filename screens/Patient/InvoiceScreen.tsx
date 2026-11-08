import React, { useEffect, useState } from 'react';
import { formatXAF } from '../../shared/money';
import { apiJson } from '../../services/apiClient';
import { bookingApi } from '../../services/bookingApi';
interface InvoiceScreenProps { booking?: any; bookingId?: string; labId?: string; labName?: string; invoiceNumber?: string; totalAmount?: number; testsAmount?: number; homePickupFee?: number; homeDeliveryFee?: number; addOns?: any[]; tests?: any[]; labPaymentDetails?: any; bookingCode?: string; onBack: () => void; onPaymentConfirmedByPatient: (txRef: string, method: string) => void; onPayLater: () => void; }
export const InvoiceScreen: React.FC<InvoiceScreenProps> = ({ booking, onBack, onPaymentConfirmedByPatient, onPayLater }) => {
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('mobile_money_mtn');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; if (booking?.labId) apiJson(`/api/labs/${booking.labId}/payment-config`).then(data => { if (active) setConfig(data.config); }).catch(err => { if (active) setError(err.message); }); return () => { active = false; }; }, [booking?.labId]);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!booking?.id || !reference.trim()) return; setBusy(true); setError(''); try { await bookingApi.act(booking, { action: 'payment-proof', transactionReference: reference.trim(), paymentMethod: method }); onPaymentConfirmedByPatient(reference.trim(), method); } catch (err: any) { setError(err.message); } finally { setBusy(false); } };
  if (!booking?.invoiceGenerated || !booking?.billing) return <main className="p-5"><button onClick={onBack}>Back</button><p role="alert">An issued laboratory invoice is required before payment.</p></main>;
  return <main className="max-w-2xl mx-auto p-5 space-y-5"><button onClick={onBack} className="underline">Back</button><h1 className="text-2xl font-bold">Laboratory invoice</h1><p className="break-all">{booking.invoiceNumber}</p><p>{booking.labName}</p>
    <section className="bg-white border rounded-2xl p-5 space-y-3">{booking.tests.map((test: any) => <p key={test.id}>{test.testName}: {formatXAF(test.price)}</p>)}<p>Collection: {formatXAF(booking.billing.homeCollectionFee)}</p><p>Insurance: −{formatXAF(booking.billing.insuranceCoveredAmount)}</p><p>Platform fee: {formatXAF(booking.billing.platformFeeAmount)}</p><p className="text-xl font-bold">Patient total: {formatXAF(booking.billing.totalPatientDue)}</p></section>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {booking.paymentStatus === 'paid' ? <section><h2 className="text-xl font-bold">Payment confirmed by the cashier</h2><p>Receipt: {booking.receiptNumber}</p><p>Received: {formatXAF(booking.actualPaidAmount)}</p><button onClick={() => window.print()} className="border rounded-xl p-3">Print receipt</button></section> : booking.paymentProofSubmitted ? <p>Your reference was submitted. Wait for the cashier to verify it. The invoice remains unpaid.</p> : <><p>You may pay at the laboratory cashier. For remote payment, use only its configured account below.</p>
      {config && <form onSubmit={submit} className="space-y-3"><label className="block">Payment method<select value={method} onChange={e => setMethod(e.target.value)} className="block border p-3 rounded-xl"><option value="mobile_money_mtn">MTN Mobile Money</option><option value="mobile_money_orange">Orange Money</option><option value="bank_transfer">Bank transfer</option></select></label><p className="font-semibold">{method === 'mobile_money_mtn' ? config.mtnMomoNumber : method === 'mobile_money_orange' ? config.orangeMoneyNumber : config.bankAccountNumber}</p>
      {Boolean(method === 'mobile_money_mtn' ? config.mtnMomoNumber : method === 'mobile_money_orange' ? config.orangeMoneyNumber : config.bankAccountNumber) ? <><label className="block">Your transaction reference<input required minLength={3} maxLength={120} value={reference} onChange={e => setReference(e.target.value)} className="block border p-3 rounded-xl w-full" /></label><button disabled={busy} className="bg-teal-800 text-white p-4 rounded-xl disabled:opacity-40">{busy ? 'Submitting…' : 'Submit reference for cashier verification'}</button></> : <p>This payment method is unavailable. Pay at the laboratory cashier or choose another configured method.</p>}</form>}
      <button onClick={onPayLater} className="underline">Return to booking</button></>}
  </main>;
};
