import { PatientLayout, type PatientNavTab } from '../../components/Layout/PatientLayout';
import { usePortalNavigation } from '../../hooks/usePortalNavigation';
import { ResourcePage, ActionButton } from '../../components/portal/ResourcePage';
import { ProfilePage } from '../../components/portal/ProfilePage';
import { ShareWithDoctor } from '../../components/portal/ShareWithDoctor';
import { CareMessages } from '../../components/portal/CareMessages';
import { apiJson } from '../../services/apiClient';
import { PrescriptionScanScreen } from './PrescriptionScanScreen';
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
  const [view, setView] = usePortalNavigation('patient', 'home');
  const [bookings, setBookings] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [lab, setLab] = useState<PartnerLabItem | null>(null);
  const [method, setMethod] = useState<'home' | 'lab'>('lab');
  const [address, setAddress] = useState('');
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('booking') ?? '');
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
  useEffect(() => { if (view === 'tests' && !catalog.length) void loadCatalog(); }, [view]);
  const selected = bookings.find(booking => booking.id === (new URLSearchParams(window.location.search).get('booking') || selectedId));
  const home = () => { setView('home'); setShare(null); };
  const createShare = async () => { try { const result = await bookingApi.share(selected); setShare({ url: `${window.location.origin}/?share=${result.token}`, id: result.shareId }); } catch (err: any) { setError(err.message); } };
  const navigate = (page: string) => { if (page === 'tests' || page === 'book') { void loadCatalog(); return; } setView(page); };
  return <PatientLayout currentTab={view as PatientNavTab} onTabChange={navigate} onOpenAI={() => setView('ai')} onLogout={logout}>
    {error && <p role="alert" className="m-5 p-4 bg-red-50 text-red-800 border rounded-xl">{error} <button onClick={() => window.dispatchEvent(new Event('nanolabs_booking_updated'))} className="underline">Retry</button></p>}
    {view === 'home' && <main className="max-w-4xl mx-auto p-5 space-y-5"><h1 className="text-2xl font-bold">My laboratory bookings</h1><p>Follow your request from laboratory acceptance to released results.</p><button onClick={loadCatalog} className="bg-teal-800 text-white rounded-xl p-4">Book a laboratory test</button>
      {loading ? <p>Loading bookings…</p> : !bookings.length && !error ? <p>No bookings yet. Choose your tests to begin.</p> : bookings.map(booking => <article key={booking.id} className="bg-white border rounded-2xl p-5 space-y-3"><h2 className="font-bold text-lg">{booking.labName}</h2><p>{booking.tests.map((test: any) => test.testName).join(', ')}</p><p>Status: {booking.overallStatus.replaceAll('_', ' ')}</p><p>You pay: {formatXAF(booking.billing.totalPatientDue)} · {booking.paymentStatus === 'paid' ? 'Cashier confirmed payment' : 'Awaiting payment confirmation'}</p><button onClick={() => { setSelectedId(booking.id); setView('status', booking.id); }} className="underline text-teal-800">View booking</button>{booking.resultsReleased && <button onClick={() => { setSelectedId(booking.id); setView('report', booking.id); }} className="ml-5 underline text-teal-800">View released results</button>}</article>)}
    </main>}
    {view === 'tests' && <SearchTestsScreen availableTests={catalog} onBack={home} onSelectTest={test => { setTests([test]); setView('choose-lab'); }} onSelectMultipleTests={items => { setTests(items); setView('choose-lab'); }} />}
    {view === 'choose-lab' && tests.length > 0 && <ChooseLabScreen onBack={() => setView('tests')} selectedTestsNames={tests.map(test => test.name)} onSelectLab={value => { setLab(value); setView('collection'); }} />}
    {view === 'collection' && lab && <CollectionMethodScreen lab={lab} onBack={() => setView('choose-lab')} onContinue={(value, _fee, _distance, location) => { setMethod(value); setAddress(location); setView('summary'); }} />}
    {view === 'summary' && lab && <BookingSummaryScreen lab={lab} tests={tests} collectionMethod={method} collectionFee={method === 'home' ? lab.sampleCollectionFee! : 0} labTestTariff={0} pickupAddress={address} onBack={() => setView('collection')} onBookingRequested={booking => { setBookings(rows => [booking, ...rows.filter(row => row.id !== booking.id)]); setSelectedId(booking.id); setView('status', booking.id); }} />}
    {view === 'status' && selected && <LabAcceptedScreen booking={selected} onBack={home} onViewInvoice={() => setView('invoice')} />}
    {view === 'invoice' && selected && <InvoiceScreen booking={selected} onBack={() => setView('status')} onPayLater={() => setView('status')} onPaymentConfirmedByPatient={() => setView('status')} />}
    {view === 'report' && selected?.resultsReleased && <main className="max-w-3xl mx-auto p-5 space-y-5"><button onClick={home} className="underline">Back</button><BookingResults booking={selected} /><ShareWithDoctor booking={selected} /><button onClick={() => window.print()} className="border rounded-xl p-3">Print results</button><button onClick={createShare} className="ml-4 border rounded-xl p-3">Create a 24-hour sharing link</button>{share && <div className="border rounded-xl p-4 space-y-3"><p>Anyone with this link can read the released report until it expires or you revoke it.</p><input aria-label="Report sharing link" readOnly value={share.url} className="w-full border p-3" /><button onClick={async () => { try { const { apiJson } = await import('../../services/apiClient'); await apiJson(`/api/shares/${share.id}`, undefined, { method: 'DELETE' }); setShare(null); } catch (err: any) { setError(err.message); } }} className="underline">Revoke link</button></div>}</main>}
    {((['collection','summary'].includes(view)&&!lab)||(view==='choose-lab'&&!tests.length))&&<section className="space-y-4"><h1 className="text-2xl font-bold">Continue your test booking</h1><p>Select your tests and laboratory to prepare a current quote.</p><button onClick={loadCatalog} className="bg-teal-800 text-white rounded-xl p-3">Choose tests</button></section>}
    {view === 'profile' && <ProfilePage />}
    {view === 'family' && <ResourcePage title="Family profiles" endpoint="/api/portal/family" columns={[{key:'name',label:'Name'},{key:'relationship',label:'Relationship'},{key:'dateOfBirth',label:'Date of birth'}]} fields={[{key:'name',label:'Full name'},{key:'relationship',label:'Relationship',type:'select',options:['child','spouse','parent','other'].map(value => ({value,label:value}))},{key:'dateOfBirth',label:'Date of birth',type:'date'},{key:'gender',label:'Sex',type:'select',options:['Female','Male','Other'].map(value => ({value,label:value}))}]} />}
    {view === 'insurance' && <ResourcePage title="My insurance" help="Policies remain pending until the performing laboratory confirms coverage. A submitted policy does not reduce an invoice automatically." endpoint="/api/portal/insurance" columns={[{key:'provider',label:'Provider'},{key:'policyNumber',label:'Policy number'},{key:'status',label:'Review status'}]} fields={[{key:'provider',label:'Provider'},{key:'policyNumber',label:'Policy number'},{key:'labId',label:'Reviewing laboratory',type:'select',endpoint:'/api/labs',labelKey:'name'}]} />}
    {view === 'doctors' && <ResourcePage title="Doctor directory" endpoint="/api/portal/doctors" columns={[{key:'name',label:'Doctor'},{key:'specialty',label:'Specialty'},{key:'hospital',label:'Practice'}]} actions={(row,reload) => <ActionButton label="Request care connection" action={() => apiJson('/api/portal/connections',{doctorId:row.id})} onDone={reload} />} />}
    {view === 'messages' && <CareMessages />}
    {view === 'transfer' && <ResourcePage title="Transfer requests" help="Request access for another laboratory to a released report. Requests remain pending until reviewed." endpoint="/api/portal/transfers" columns={[{key:'bookingId',label:'Report'},{key:'destinationLabName',label:'Destination'},{key:'status',label:'Status'}]} fields={[{key:'bookingId',label:'Released report',type:'select',endpoint:'/api/portal/own-reports',deriveFields:[{targetKey:'labId',sourceKey:'labId'}]},{key:'destinationLabId',label:'Destination laboratory',type:'select',endpoint:'/api/labs'}]} />}
    {view === 'labs' && <ResourcePage title="Laboratory directory" endpoint="/api/labs" recordKey="labs" columns={[{key:'name',label:'Laboratory'},{key:'city',label:'City'},{key:'address',label:'Address'},{key:'phone',label:'Contact'}]} />}
    {['tracking','appointments','booklet','results'].includes(view) && <section className="space-y-4"><h1 className="text-2xl font-bold">{view === 'booklet' ? 'Health booklet' : view === 'results' ? 'My results' : view === 'appointments' ? 'Appointments and requests' : 'Track my samples'}</h1>{!loading && !error && !bookings.filter(row => !['booklet','results'].includes(view) || row.resultsReleased).length && <p>No records yet.</p>}{bookings.filter(row => !['booklet','results'].includes(view) || row.resultsReleased).map(booking => <article key={booking.id} className="bg-white rounded-xl border p-4 space-y-2"><h2 className="font-bold">{booking.labName}</h2><p>{booking.tests.map((test:any) => test.testName).join(', ')}</p><p>{booking.overallStatus.replaceAll('_',' ')}</p><button className="underline" onClick={() => {setSelectedId(booking.id);setView(booking.resultsReleased && ['booklet','results'].includes(view) ? 'report' : 'status',booking.id);}}>Open {booking.resultsReleased && ['booklet','results'].includes(view) ? 'report' : 'booking'}</button></article>)}</section>}
    {view === 'notifications' && <section className="space-y-4"><h1 className="text-2xl font-bold">Notifications</h1>{!loading && !bookings.length && <p>No booking updates yet.</p>}{bookings.flatMap(booking => booking.auditTrail.map((event:any) => <article key={event.id} className="border bg-white rounded-xl p-4"><h2 className="font-bold">{event.title}</h2><p>{event.details}</p><time>{new Date(event.timestamp).toLocaleString()}</time></article>))}</section>}
    {view === 'scan' && <PrescriptionScanScreen onBack={() => setView('home')} onProceedToBooking={items => {setTests(items);setView('choose-lab');}} />}
    {view === 'ai' && <AiHelp />}
    {['status','invoice','report'].includes(view) && !loading && !selected && <section><h1 className="text-2xl font-bold">Choose a booking</h1><p>Open one of your bookings to view this page.</p><button className="underline" onClick={home}>My bookings</button></section>}
    {!['home','tests','labs','choose-lab','collection','summary','status','invoice','report','profile','family','insurance','doctors','messages','transfer','tracking','appointments','booklet','results','notifications','scan','ai'].includes(view) && <section><h1 className="text-2xl font-bold">Page not found</h1><button onClick={home}>Return home</button></section>}
  </PatientLayout>;
};
export default PatientApp;

function AiHelp() {
  const [question,setQuestion] = useState(''); const [answer,setAnswer] = useState(''); const [error,setError] = useState(''); const [busy,setBusy] = useState(false);
  return <section className="max-w-2xl space-y-4"><h1 className="text-2xl font-bold">NanoLabs AI</h1><p>Ask a general laboratory question. Your question is sent to the configured AI provider when you press Ask.</p><form onSubmit={async event => {event.preventDefault();setBusy(true);setError('');try{setAnswer((await apiJson('/api/ai/nanolabs-consult',{message:question})).answer);}catch(err:any){setError(err.message);}finally{setBusy(false);}}} className="space-y-3"><label className="block">Question<textarea required value={question} onChange={e=>setQuestion(e.target.value)} className="block border rounded-xl p-3 w-full" /></label><button disabled={busy} className="bg-teal-800 text-white rounded-xl p-3">{busy?'Asking…':'Ask'}</button></form>{error&&<p role="alert" className="text-red-700">{error}</p>}{answer&&<p className="whitespace-pre-wrap">{answer}</p>}</section>;
}
