import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext';
import { bookingApi } from '../../services/bookingApi';
import { formatXAF } from '../../shared/money';
import { BookingResults } from '../../components/results/BookingResults';

function OrderActions({ booking, onDone }: { booking: any; onDone: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [barcode, setBarcode] = useState('');
  const [samples, setSamples] = useState('');
  const [results, setResults] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState('');
  const role = (...roles: string[]) => user.roles.some((value: string) => roles.includes(value));
  const run = async (action: any) => { setBusy(true); setError(''); try { await bookingApi.act(booking, action); onDone(); } catch (err: any) { setError(err.message); } finally { setBusy(false); } };
  const buttonClass = 'bg-teal-800 text-white rounded-xl px-4 py-3 disabled:opacity-40';
  return <div className="border-t pt-4 space-y-4">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {booking.overallStatus === 'Pending_Validation' && role('admin', 'receptionist') && <button className={buttonClass} disabled={busy} onClick={() => run({ action: 'accept' })}>Accept request and send to cashier</button>}
    {booking.overallStatus === 'Pending_Payment' && role('admin', 'cashier') && (!booking.invoiceGenerated ? <button className={buttonClass} disabled={busy} onClick={() => run({ action: 'invoice' })}>Issue invoice for {formatXAF(booking.billing.totalPatientDue)}</button> : <form className="space-y-3" onSubmit={e => { e.preventDefault(); void run({ action: 'pay', amount: Number(amount), paymentMethod: method, ...(reference.trim() ? { transactionReference: reference.trim() } : {}) }); }}>
      <p>Expected patient amount: <strong>{formatXAF(booking.billing.totalPatientDue)}</strong></p>{booking.transactionReference && <p>Patient-submitted reference: {booking.transactionReference}</p>}
      <label className="block">Payment method<select className="block border rounded-xl p-3" value={method} onChange={e => setMethod(e.target.value)}><option value="cash">Cash</option><option value="mobile_money_mtn">MTN Mobile Money</option><option value="mobile_money_orange">Orange Money</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option></select></label>
      <label className="block">Amount actually received (XAF)<input type="number" min="0" step="1" required value={amount} onChange={e => setAmount(e.target.value)} className="block border rounded-xl p-3" /></label>
      {method !== 'cash' && <label className="block">Verified transaction reference<input required value={reference} onChange={e => setReference(e.target.value)} maxLength={120} className="block border rounded-xl p-3" /></label>}
      <label className="block"><input type="checkbox" required /> I checked the laboratory’s payment record and confirmed receipt.</label><button disabled={busy} className={buttonClass}>Confirm receipt and allow sample collection</button>
    </form>)}
    {booking.overallStatus === 'Pending_Collection' && role('admin', 'analyzer', 'labtech') && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void run({ action: 'collect', sampleBarcode: barcode.trim(), collectedSamples: samples.split(',').map(value => value.trim()).filter(Boolean) }); }}><label className="block">Sample barcode<input required value={barcode} onChange={e => setBarcode(e.target.value)} className="block border rounded-xl p-3" /></label><label className="block">Collected samples (separate with commas)<input required value={samples} onChange={e => setSamples(e.target.value)} className="block border rounded-xl p-3 w-full" /></label><button disabled={busy} className={buttonClass}>Record sample collection</button></form>}
    {booking.overallStatus === 'In_Lab_Testing' && role('admin', 'labtech') && <><form className="space-y-3" onSubmit={e => { e.preventDefault(); void run({ action: 'results', testResultsMap: Object.fromEntries(booking.tests.map((test: any) => [test.id, { resultValue: results[test.id] ?? test.resultValue ?? '' }])) }); }}>{booking.tests.map((test: any) => <label key={test.id} className="block">{test.testName}<textarea required value={results[test.id] ?? test.resultValue ?? ''} onChange={e => setResults(current => ({ ...current, [test.id]: e.target.value }))} maxLength={10000} className="block w-full border rounded-xl p-3" /></label>)}<button disabled={busy} className={buttonClass}>Save draft results</button></form><button disabled={busy} onClick={() => run({ action: 'submit-results' })} className={buttonClass}>Submit saved results to biologist</button></>}
    {booking.overallStatus === 'Pending_Biologist_Validation' && role('biologist') && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void run({ action: 'release', remarks, releaseChannel: 'online_and_physical' }); }}><BookingResults booking={booking} /><label className="block">Biologist remarks<textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="block w-full border rounded-xl p-3" /></label><label className="block"><input type="checkbox" required /> I reviewed these results and authorize their release.</label><button disabled={busy} className={buttonClass}>Sign and release results to the patient</button></form>}
    {booking.resultsReleased && role('admin', 'labtech', 'biologist') && <BookingResults booking={booking} />}
    {busy && <p role="status">Saving to the API…</p>}
  </div>;
}
export const BatchWorklistScreen: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => bookingApi.subscribe(user.labId, list => { setRows(list); setLoading(false); setError(''); }, err => { setError(err instanceof Error ? err.message : String(err)); setLoading(false); }), [user.labId]);
  return <main className="max-w-5xl mx-auto p-5 space-y-5"><h1 className="text-2xl font-bold">Laboratory worklist</h1><p>Your role: {user.role}. Each action is checked by the API for your laboratory.</p><label className="block">Search patient or booking<input className="block border rounded-xl p-3 w-full" value={search} onChange={e => setSearch(e.target.value)} /></label>{error && <p role="alert" className="text-red-700">{error} <button onClick={() => window.dispatchEvent(new Event('nanolabs_booking_updated'))}>Retry</button></p>}{loading && <p>Loading orders…</p>}{!loading && !error && !rows.length && <p>No patient requests yet.</p>}
    {rows.filter(row => `${row.patientName} ${row.bookingCode}`.toLowerCase().includes(search.toLowerCase())).map(row => <article key={row.id} className="bg-white border rounded-2xl p-5 space-y-3"><h2 className="text-lg font-bold">{row.patientName}</h2><p className="break-all">{row.bookingCode}</p><p>{row.tests.map((test: any) => test.testName).join(', ')}</p><p>Status: {row.overallStatus.replaceAll('_', ' ')}</p><p>Tests: {formatXAF(row.billing.testsAmount)} · Insurance: {formatXAF(row.billing.insuranceCoveredAmount)} · Collection: {formatXAF(row.billing.homeCollectionFee)} · Platform fee: {formatXAF(row.billing.platformFeeAmount)}</p><p className="font-bold">Patient pays: {formatXAF(row.billing.totalPatientDue)}</p><OrderActions key={row.id} booking={row} onDone={() => window.dispatchEvent(new Event('nanolabs_booking_updated'))} /></article>)}
  </main>;
};
