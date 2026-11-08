import React, { useEffect, useMemo, useState } from 'react';
import type { PartnerLabItem } from './ChooseLabScreen';
import { formatXAF } from '../../shared/money';
import { bookingApi, type BookingSelection } from '../../services/bookingApi';
import { useAuth } from '../../context/authContext';
interface BookingSummaryScreenProps { lab: PartnerLabItem; tests: { name: string; price: number }[]; collectionMethod: 'home' | 'lab'; collectionFee: number; labTestTariff: number; pickupAddress?: string; pickupCoords?: { lat: number; lng: number }; pickupDistanceKm?: number; onBack: () => void; onBookingRequested: (booking: any) => void; }
export const BookingSummaryScreen: React.FC<BookingSummaryScreenProps> = ({ lab, tests, collectionMethod, pickupAddress, onBack, onBookingRequested }) => {
  const { user } = useAuth();
  const activeProfile = user;
  const isDependentActive = false;
  const [provider, setProvider] = useState('');
  const [policy, setPolicy] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revision, setRevision] = useState(0);
  const selection = useMemo<BookingSelection>(() => ({ labId: lab.id, testIds: tests.map(test => lab.catalog?.find(item => item.name.toLowerCase() === test.name.toLowerCase())?.id ?? ''), homeCollection: collectionMethod === 'home', ...(collectionMethod === 'home' ? { pickupLocation: pickupAddress } : {}), ...(policy.trim() ? { insurancePolicyNumber: policy.trim(), insuranceProvider: provider.trim() } : {}), ...(isDependentActive ? { dependentProfileId: activeProfile.id } : {}) }), [lab, tests, collectionMethod, pickupAddress, provider, policy, isDependentActive, activeProfile.id]);
  useEffect(() => {
    let active = true; setLoading(true); setQuote(null); setError('');
    bookingApi.quote(selection).then(value => { if (active) setQuote(value); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selection, revision]);
  const submit = async () => { if (!quote || loading) return; setSubmitting(true); setError(''); try { onBookingRequested(await bookingApi.create(selection, quote.fingerprint)); } catch (err: any) { setError(err.message); } finally { setSubmitting(false); } };
  return <main className="max-w-2xl mx-auto p-5 space-y-5"><button onClick={onBack} className="underline" disabled={submitting}>Back</button><h1 className="text-2xl font-bold">Review your test request</h1><p className="font-semibold">{lab.name}</p>
    <p>{collectionMethod === 'home' ? `Home collection: ${pickupAddress}` : `Visit the laboratory: ${lab.address}`}</p>
    <div className="space-y-3"><p>Optional: enter a policy already approved by this laboratory. Coverage is confirmed by the API.</p><label className="block">Insurance provider<input value={provider} onChange={e => setProvider(e.target.value)} className="border rounded-xl p-3 block w-full" /></label><label className="block">Policy number<input value={policy} onChange={e => setPolicy(e.target.value)} className="border rounded-xl p-3 block w-full" /></label></div>
    {loading && <p>Checking current prices and coverage…</p>}
    {error && <div role="alert" className="text-red-700">{error} <button onClick={() => setRevision(n => n + 1)} className="underline">Refresh quote</button></div>}
    {quote && <section className="bg-white border rounded-2xl p-5 space-y-3">{quote.tests.map((test: any) => <p key={test.id} className="flex justify-between"><span>{test.testName}</span><span>{formatXAF(test.price)}</span></p>)}
      <p>Collection fee: {formatXAF(quote.billing.homeCollectionFee)}</p><p>Insurance pays: {formatXAF(quote.billing.insuranceCoveredAmount)}</p><p>Patient portion: {formatXAF(quote.billing.patientShare)}</p><p>Platform fee ({quote.billing.platformFeePercent}% of your portion): {formatXAF(quote.billing.platformFeeAmount)}</p><p className="text-xl font-bold">You pay: {formatXAF(quote.billing.totalPatientDue)}</p>
    </section>}
    <p>Your request will wait for laboratory reception. Payment is confirmed by its cashier; submitting a reference does not mark it paid.</p>
    <button onClick={submit} disabled={!quote || loading || submitting} className="bg-teal-800 text-white rounded-xl p-4 disabled:opacity-40">{submitting ? 'Sending request…' : 'Send test request'}</button>
  </main>;
};
