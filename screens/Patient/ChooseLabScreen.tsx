import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Star, Clock, Truck, ShieldCheck, MapPin, ChevronRight, Building2 } from 'lucide-react';
import { formatXAF } from '../../shared/money';
import { db, getDocs, collection } from '../../services/firebase';

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
  imageUrl: string;
  logoUrl: string;
  accredited: boolean;
  ratePer100m: number; // Configured price per 100 meter distance
  baseDeliveryFeePerKm: number;
  testPricingMultiplier: number;
}

export const DEFAULT_PARTNER_LABS: PartnerLabItem[] = [
  {
    id: 'lab-biosante',
    name: 'BioSanté Lab',
    rating: 4.8,
    reviewsCount: 124,
    turnaroundTime: '3.5 hrs',
    features: ['Home pickup', 'Delivery', 'Accredited'],
    distanceKm: 2.3,
    city: 'Douala',
    address: 'Boulevard de la Liberté, Akwa, Douala',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&auto=format&fit=crop&q=80',
    accredited: true,
    ratePer100m: 60,
    baseDeliveryFeePerKm: 600,
    testPricingMultiplier: 1.0
  },
  {
    id: 'lab-central',
    name: 'Laboratoire Central Akwa',
    rating: 4.6,
    reviewsCount: 98,
    turnaroundTime: '4.0 hrs',
    features: ['Home pickup', 'Accredited'],
    distanceKm: 3.1,
    city: 'Douala',
    address: 'Rue Pau, Bonanjo, Douala',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200&auto=format&fit=crop&q=80',
    accredited: true,
    ratePer100m: 50,
    baseDeliveryFeePerKm: 500,
    testPricingMultiplier: 0.95
  },
  {
    id: 'lab-plus',
    name: 'Lab Plus Douala',
    rating: 4.5,
    reviewsCount: 76,
    turnaroundTime: '4.5 hrs',
    features: ['Delivery', 'Accredited'],
    distanceKm: 4.2,
    city: 'Douala',
    address: 'Carrefour Idéal, Akwa Nord, Douala',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&auto=format&fit=crop&q=80',
    accredited: true,
    ratePer100m: 75,
    baseDeliveryFeePerKm: 750,
    testPricingMultiplier: 1.05
  }
];

interface ChooseLabScreenProps {
  onBack: () => void;
  onSelectLab: (lab: PartnerLabItem, calculatedTariff: number, calculatedDeliveryFee: number) => void;
  selectedTestsNames?: string[];
  baseReferencePrice?: number;
}

export const ChooseLabScreen: React.FC<ChooseLabScreenProps> = ({
  onBack,
  onSelectLab,
  selectedTestsNames = ['CBC', 'Malaria Test'],
  baseReferencePrice = 8500
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'near' | 'price' | 'home'>('near');
  const [labs, setLabs] = useState<PartnerLabItem[]>(DEFAULT_PARTNER_LABS);

  // Fetch real labs from Firestore if available
  useEffect(() => {
    const fetchLiveLabs = async () => {
      try {
        const snap = await getDocs(collection(db, 'labs'));
        if (!snap.empty) {
          const liveList: PartnerLabItem[] = snap.docs.map((docSnap, idx) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || `Laboratory ${idx + 1}`,
              rating: data.rating || 4.7,
              reviewsCount: data.reviewsCount || 85,
              turnaroundTime: data.turnaroundTime || '3-4 hrs',
              features: ['Home pickup', 'Delivery', 'Accredited'],
              distanceKm: Number((2.0 + idx * 0.8).toFixed(1)),
              city: data.city || 'Douala',
              address: data.address || 'Akwa, Douala',
              imageUrl: data.imageUrl || DEFAULT_PARTNER_LABS[idx % DEFAULT_PARTNER_LABS.length].imageUrl,
              accredited: true,
              baseDeliveryFeePerKm: 800,
              testPricingMultiplier: data.pricingMultiplier || 1.0
            };
          });
          setLabs(liveList);
        }
      } catch (e) {
        console.warn('Using default accredited labs catalog:', e);
      }
    };
    fetchLiveLabs();
  }, []);

  const calculateLabTestPrice = (lab: PartnerLabItem) => {
    const count = selectedTestsNames.length || 1;
    const basePerTest = 4500;
    return Math.round(count * basePerTest * lab.testPricingMultiplier);
  };

  const calculateCourierFee = (lab: PartnerLabItem) => {
    return Math.max(1500, Math.round(lab.distanceKm * lab.baseDeliveryFeePerKm));
  };

  const filteredLabs = labs.filter(lab => {
    const matchesSearch = 
      lab.name.toLowerCase().includes(search.toLowerCase()) ||
      lab.address.toLowerCase().includes(search.toLowerCase());
    if (filterMode === 'home') {
      return matchesSearch && lab.features.includes('Home pickup');
    }
    return matchesSearch;
  }).sort((a, b) => {
    if (filterMode === 'price') {
      return calculateLabTestPrice(a) - calculateLabTestPrice(b);
    }
    return a.distanceKm - b.distanceKm;
  });

  return (
    <div className="max-w-2xl mx-auto py-3 px-2 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-5">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Choose a Laboratory
          </h1>
          <p className="text-[11px] text-slate-500">
            Selected: <strong className="text-slate-700">{selectedTestsNames.join(', ')}</strong> ({selectedTestsNames.length} tests)
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
        <input
          type="text"
          placeholder="Search lab by name or neighborhood..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006978] shadow-xs"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterMode('near')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterMode === 'near'
              ? 'bg-[#006978] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Nearest First
        </button>
        <button
          onClick={() => setFilterMode('price')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterMode === 'price'
              ? 'bg-[#006978] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Lowest Lab Tariff
        </button>
        <button
          onClick={() => setFilterMode('home')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterMode === 'home'
              ? 'bg-[#006978] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Home pickup
        </button>
      </div>

      {/* Lab Cards List */}
      <div className="space-y-3">
        {filteredLabs.length > 0 ? (
          filteredLabs.map((lab) => {
            const labTestPrice = calculateLabTestPrice(lab);
            const deliveryFee = calculateCourierFee(lab);

            return (
              <div
                key={lab.id}
                onClick={() => onSelectLab(lab, labTestPrice, deliveryFee)}
                className="p-4 bg-white hover:border-[#006978] border border-slate-200 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all group"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={lab.imageUrl}
                    alt={lab.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006978]">
                      {lab.name}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="flex items-center text-amber-600 font-bold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                        {lab.rating} ({lab.reviewsCount})
                      </span>
                      <span>&bull;</span>
                      <span>{lab.distanceKm} km away</span>
                      <span>&bull;</span>
                      <span>{lab.turnaroundTime}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{lab.address}</p>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {lab.features.map(f => (
                        <span
                          key={f}
                          className="px-2 py-0.5 bg-[#E0F2F1] text-[#006978] rounded-md text-[10px] font-bold"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lab Specific Pricing Display */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lab Test Tariff</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      {formatXAF(labTestPrice)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Home pickup: +{formatXAF(deliveryFee)} ({lab.distanceKm} km)
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#006978] mt-2 group-hover:translate-x-1 transition-transform">
                    Select Lab <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No laboratories found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};
