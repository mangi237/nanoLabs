import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext';
import { authService } from '../../services/authService';
import { bookingApi } from '../../services/bookingApi';
import { SearchTestsScreen } from './SearchTestsScreen';
import { ChooseLabScreen, type PartnerLabItem } from './ChooseLabScreen';
import { CollectionMethodScreen } from './CollectionMethodScreen';
import { BookingSummaryScreen } from './BookingSummaryScreen';
import { LabAcceptedScreen } from './LabAcceptedScreen';
import { InvoiceScreen } from './InvoiceScreen';
import { BookingResults } from '../../components/results/BookingResults';
import { formatXAF } from '../../shared/money';

export const PatientApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [view, setView] = useState('home');
  const [bookings, setBookings] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [lab, setLab] = useState<PartnerLabItem | null>(null);
  const [method, setMethod] = useState<'home' | 'lab'>('lab');
  const [address, setAddress] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [share, setShare] = useState<{ url: string; id: string } | null>(null);
  useEffect(() => bookingApi.subscribe(undefined, rows => { setBookings(rows); setLoading(false); setError(''); }, err => { setError(err instanceof Error ? err.message : String(err)); setLoading(false); }), []);
  const loadCatalog = async () => {
    try {
      setError('');
      const labs = await authService.getAllLabs();
      const unique = new Map<string, any>();
      labs.forEach(lab => lab.catalog.forEach((test: any) => unique.set(test.name.toLowerCase(), { ...test, code: test.id, category: test.category || 'General' })));
      setCatalog([...unique.values()]); setTests([]); setView('tests');
    } catch (err: any) { setError(err.message); }
  };
  const selected = bookings.find(booking => booking.id === selectedId);
  const home = () => { setView('home'); setShare(null); };
  const createShare = async () => { try { const result = await bookingApi.share(selected); setShare({ url: `${window.location.origin}/?share=${result.token}`, id: result.shareId }); } catch (err: any) { setError(err.message); } };
  return <div className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b bg-white p-4 flex flex-wrap justify-between gap-3"><strong>nanoLabs · {user.name}</strong><nav className="flex gap-4"><button onClick={home}>My bookings</button><button onClick={loadCatalog}>Book tests</button><button onClick={logout}>Sign out</button></nav></header>
    {error && <p role="alert" className="m-5 p-4 bg-red-50 text-red-800 border rounded-xl">{error} <button onClick={() => window.dispatchEvent(new Event('nanolabs_booking_updated'))} className="underline">Retry</button></p>}
    {view === 'home' && <main className="max-w-4xl mx-auto p-5 space-y-5"><h1 className="text-2xl font-bold">My laboratory bookings</h1><p>Follow your request from laboratory acceptance to released results.</p><button onClick={loadCatalog} className="bg-teal-800 text-white rounded-xl p-4">Book a laboratory test</button>
      {loading ? <p>Loading bookings…</p> : !bookings.length && !error ? <p>No bookings yet. Choose your tests to begin.</p> : bookings.map(booking => <article key={booking.id} className="bg-white border rounded-2xl p-5 space-y-3"><h2 className="font-bold text-lg">{booking.labName}</h2><p>{booking.tests.map((test: any) => test.testName).join(', ')}</p><p>Status: {booking.overallStatus.replaceAll('_', ' ')}</p><p>You pay: {formatXAF(booking.billing.totalPatientDue)} · {booking.paymentStatus === 'paid' ? 'Cashier confirmed payment' : 'Awaiting payment confirmation'}</p><button onClick={() => { setSelectedId(booking.id); setView('status'); }} className="underline text-teal-800">View booking</button>{booking.resultsReleased && <button onClick={() => { setSelectedId(booking.id); setView('results'); }} className="ml-5 underline text-teal-800">View released results</button>}</article>)}
    </main>}
    {view === 'tests' && <SearchTestsScreen availableTests={catalog} onBack={home} onSelectTest={test => { setTests([test]); setView('labs'); }} onSelectMultipleTests={items => { setTests(items); setView('labs'); }} />}
    {view === 'labs' && <ChooseLabScreen onBack={() => setView('tests')} selectedTestsNames={tests.map(test => test.name)} onSelectLab={value => { setLab(value); setView('collection'); }} />}
    {view === 'collection' && lab && <CollectionMethodScreen lab={lab} onBack={() => setView('labs')} onContinue={(value, _fee, _distance, location) => { setMethod(value); setAddress(location); setView('summary'); }} />}
    {view === 'summary' && lab && <BookingSummaryScreen lab={lab} tests={tests} collectionMethod={method} collectionFee={method === 'home' ? lab.sampleCollectionFee! : 0} labTestTariff={0} pickupAddress={address} onBack={() => setView('collection')} onBookingRequested={booking => { setBookings(rows => [booking, ...rows.filter(row => row.id !== booking.id)]); setSelectedId(booking.id); setView('status'); }} />}
    {view === 'status' && selected && <LabAcceptedScreen booking={selected} onBack={home} onViewInvoice={() => setView('invoice')} />}
    {view === 'invoice' && selected && <InvoiceScreen booking={selected} onBack={() => setView('status')} onPayLater={() => setView('status')} onPaymentConfirmedByPatient={() => setView('status')} />}
    {view === 'results' && selected?.resultsReleased && <main className="max-w-3xl mx-auto p-5 space-y-5"><button onClick={home} className="underline">Back</button><BookingResults booking={selected} /><button onClick={() => window.print()} className="border rounded-xl p-3">Print results</button><button onClick={createShare} className="ml-4 border rounded-xl p-3">Create a 24-hour sharing link</button>{share && <div className="border rounded-xl p-4 space-y-3"><p>Anyone with this link can read the released report until it expires or you revoke it.</p><input aria-label="Report sharing link" readOnly value={share.url} className="w-full border p-3" /><button onClick={async () => { try { const { apiJson } = await import('../../services/apiClient'); await apiJson(`/api/shares/${share.id}`, undefined, { method: 'DELETE' }); setShare(null); } catch (err: any) { setError(err.message); } }} className="underline">Revoke link</button></div>}</main>}
  </div>;
};
export default PatientApp;
