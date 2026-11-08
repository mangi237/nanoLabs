import React, { useState } from 'react';
import type { PartnerLabItem } from './ChooseLabScreen';
import { formatXAF } from '../../shared/money';
import { isLabMobilePhlebotomyEnabled } from '../../utils/labPackages';
export const CollectionMethodScreen: React.FC<{ lab?: PartnerLabItem; onBack: () => void; onContinue: (method: 'home' | 'lab', fee: number, distance: number, address: string, coords?: { lat: number; lng: number }) => void; initialMethod?: 'home' | 'lab' }> = ({ lab, onBack, onContinue }) => {
  const [method, setMethod] = useState<'home' | 'lab'>('lab');
  const [address, setAddress] = useState('');
  const homeAvailable = Boolean(lab && isLabMobilePhlebotomyEnabled(lab) && Number.isSafeInteger(lab.sampleCollectionFee));
  return <main className="max-w-2xl mx-auto p-5 space-y-5"><button onClick={onBack} className="underline">Back</button><h1 className="text-2xl font-bold">Choose sample collection</h1><p>{lab?.name}</p>
    <label className="block border rounded-xl p-4"><input type="radio" checked={method === 'lab'} onChange={() => setMethod('lab')} /> Visit the laboratory · no collection fee<p>{lab?.address}</p></label>
    {homeAvailable && <label className="block border rounded-xl p-4"><input type="radio" checked={method === 'home'} onChange={() => setMethod('home')} /> Home collection · {formatXAF(lab!.sampleCollectionFee!)}</label>}
    {method === 'home' && <label className="block">Collection address and directions<textarea value={address} onChange={e => setAddress(e.target.value)} maxLength={500} required className="block w-full border rounded-xl p-3" /></label>}
    <button disabled={!lab?.id || method === 'home' && !address.trim()} onClick={() => onContinue(method, method === 'home' ? lab!.sampleCollectionFee! : 0, 0, method === 'home' ? address.trim() : lab!.address)} className="bg-teal-800 text-white p-4 rounded-xl disabled:opacity-40">Review quote</button>
  </main>;
};
