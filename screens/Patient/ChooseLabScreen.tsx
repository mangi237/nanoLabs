import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { calculateBill, formatXAF } from '../../shared/money';
export interface PartnerLabItem {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  turnaroundTime: string;
  features: string[];
  distanceKm: number;
  city: string;
  address: string;
  phone?: string;
  coords?: { lat: number; lng: number };
  imageUrl: string;
  logoUrl: string;
  accredited: boolean;
  ratePer100m: number;
  baseDeliveryFeePerKm: number;
  testPricingMultiplier: number;
  supportsHomePickup?: boolean;
  needsMobilePhlebotomist?: boolean;
  plan?: string;
  subscriptionTier?: string;
  maxTestsPerMonth?: number;
  directorName?: string;
  directorDegree?: string;
  agrementNumber?: string;
  cbeabmNumber?: string;
  isExternalBench?: boolean;
  catalog?: any[];
  sampleCollectionFee?: number;
}
export const DEFAULT_PARTNER_LABS: PartnerLabItem[] = [];
interface ChooseLabScreenProps { onBack: () => void; onSelectLab: (lab: PartnerLabItem, tariff: number, fee: number) => void; selectedTestsNames?: string[]; baseReferencePrice?: number; }
export const ChooseLabScreen: React.FC<ChooseLabScreenProps> = ({ onBack, onSelectLab, selectedTestsNames = [] }) => {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const load = async () => { setLoading(true); setError(''); try { setLabs(await authService.getAllLabs()); } catch (err: any) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  return <main className="max-w-3xl mx-auto p-5 space-y-5"><button onClick={onBack} className="underline">Back</button><h1 className="text-2xl font-bold">Choose your laboratory</h1>
    <p>Compare published laboratory prices. Your final quote includes the platform fee and any approved insurance coverage.</p>
    <label className="block">Search laboratories<input className="block w-full border rounded-xl p-3" value={search} onChange={e => setSearch(e.target.value)} /></label>
    {loading && <p>Loading laboratories…</p>}{error && <div role="alert" className="text-red-700">{error} <button onClick={load} className="underline">Retry</button></div>}
    {!loading && !error && !labs.length && <p>No verified laboratories are accepting bookings yet.</p>}
    {labs.filter(lab => `${lab.name} ${lab.city} ${lab.address}`.toLowerCase().includes(search.toLowerCase())).map(lab => {
      const tests = selectedTestsNames.map(name => lab.catalog.find((item: any) => item.name.toLowerCase() === name.toLowerCase()));
      const available = tests.length > 0 && tests.every(Boolean);
      const bill = available ? calculateBill({ testPrices: tests.map((test: any) => test.price) }) : null;
      return <section key={lab.id} className="border rounded-2xl p-5 space-y-3 bg-white"><h2 className="text-xl font-semibold">{lab.name}</h2><p>{lab.address || lab.city}</p>
        {lab.turnaroundTime && <p>Laboratory turnaround: {lab.turnaroundTime}</p>}
        <p>{bill ? `${formatXAF(bill.totalPatientDue)} including the platform fee, before insurance or home collection` : 'One or more selected tests are unavailable at this laboratory.'}</p>
        <button disabled={!available} className="bg-teal-800 text-white p-3 rounded-xl disabled:opacity-40" onClick={() => onSelectLab({ ...lab, features: [], rating: 0, reviewsCount: 0, distanceKm: 0, imageUrl: '', logoUrl: lab.logoUrl ?? '', testPricingMultiplier: 1, coords: lab.coords ?? (Number.isFinite(lab.lat) && Number.isFinite(lab.lng) ? { lat: lab.lat, lng: lab.lng } : undefined) }, bill!.testsAmount, lab.sampleCollectionFee ?? 0)}>Choose laboratory</button>
      </section>;
    })}
  </main>;
};
