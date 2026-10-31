import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Star, Clock, Truck, ShieldCheck, MapPin, ChevronRight, Building2, Phone, Navigation, Map as MapIcon } from 'lucide-react';
import { formatXAF } from '../../shared/money';
import { db, getDocs, collection } from '../../services/firebase';
import { LabComparisonMap, calculateHaversineKm } from '../../components/maps/GoogleMapsWidgets';

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
}

export const DEFAULT_PARTNER_LABS: PartnerLabItem[] = [
  {
    id: 'lab-1',
    name: 'Laboratoire Central Akwa',
    rating: 4.8,
    reviewsCount: 124,
    turnaroundTime: '3.5 hrs',
    features: ['Home pickup', 'Delivery', 'Accredited'],
    distanceKm: 2.3,
    city: 'Douala',
    address: 'Boulevard de la Liberté, Akwa, Douala',
    phone: '+237 233 42 18 90',
    coords: { lat: 4.0511, lng: 9.7042 },
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&auto=format&fit=crop&q=80',
    accredited: true,
    ratePer100m: 60,
    baseDeliveryFeePerKm: 600,
    testPricingMultiplier: 1.0
  },
  {
    id: 'lab-central',
    name: 'Centre Pasteur Annexe Bonanjo',
    rating: 4.7,
    reviewsCount: 98,
    turnaroundTime: '4.0 hrs',
    features: ['Home pickup', 'Accredited'],
    distanceKm: 3.1,
    city: 'Douala',
    address: 'Rue Pau, Bonanjo, Douala',
    phone: '+237 233 43 11 45',
    coords: { lat: 4.0432, lng: 9.6895 },
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200&auto=format&fit=crop&q=80',
    accredited: true,
    ratePer100m: 50,
    baseDeliveryFeePerKm: 500,
    testPricingMultiplier: 0.95
  },
  {
    id: 'lab-plus',
    name: 'Lab Plus Diagnostics Akwa Nord',
    rating: 4.6,
    reviewsCount: 76,
    turnaroundTime: '4.5 hrs',
    features: ['Home pickup', 'Delivery', 'Accredited'],
    distanceKm: 4.2,
    city: 'Douala',
    address: 'Carrefour Idéal, Akwa Nord, Douala',
    phone: '+237 699 81 24 10',
    coords: { lat: 4.0725, lng: 9.7318 },
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
  selectedTestsNames = ['CBC', 'Malaria Test']
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'near' | 'price' | 'tat' | 'home'>('near');
  const [labs, setLabs] = useState<PartnerLabItem[]>(DEFAULT_PARTNER_LABS);
  const [showMap, setShowMap] = useState<boolean>(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [highlightedLabId, setHighlightedLabId] = useState<string>('');
  const [locatingGps, setLocatingGps] = useState(false);

  // Fetch real configured labs from Firestore if available
  useEffect(() => {
    const fetchLiveLabs = async () => {
      try {
        const snap = await getDocs(collection(db, 'labs'));
        if (!snap.empty) {
          const liveList: PartnerLabItem[] = snap.docs.map((docSnap, idx) => {
            const data = docSnap.data();
            const fallbackLab = DEFAULT_PARTNER_LABS[idx % DEFAULT_PARTNER_LABS.length];
            const lat = Number(data.lat || data.coords?.lat || (4.0511 + idx * 0.012));
            const lng = Number(data.lng || data.coords?.lng || (9.7042 + idx * 0.011));
            return {
              id: docSnap.id,
              name: data.name || fallbackLab.name,
              rating: Number(data.rating) || 4.8,
              reviewsCount: Number(data.reviewsCount) || 95,
              turnaroundTime: data.turnaroundTime || '3–4 hrs',
              features: Array.isArray(data.features) && data.features.length > 0 ? data.features : ['Home pickup', 'Delivery', 'Accredited'],
              distanceKm: Number((2.0 + idx * 0.8).toFixed(1)),
              city: data.city || 'Douala',
              address: data.address || data.location || fallbackLab.address,
              phone: data.phone || data.contactPhone || fallbackLab.phone,
              coords: { lat, lng },
              imageUrl: data.imageUrl || fallbackLab.imageUrl,
              logoUrl: data.logoUrl || data.logo || fallbackLab.logoUrl,
              accredited: true,
              ratePer100m: Number(data.ratePer100m) || 60,
              baseDeliveryFeePerKm: Number(data.baseDeliveryFeePerKm) || 650,
              testPricingMultiplier: Number(data.pricingMultiplier) || 1.0
            };
          });
          setLabs(liveList);
        }
      } catch (e) {
        console.warn('Using partner labs directory:', e);
      }
    };
    fetchLiveLabs();
  }, []);

  const handleUseDeviceGps = () => {
    if (!navigator.geolocation) return;
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(nextCoords);
        setLabs((prev) =>
          prev.map((lab) => {
            if (!lab.coords) return lab;
            return {
              ...lab,
              distanceKm: calculateHaversineKm(nextCoords, lab.coords)
            };
          })
        );
        setLocatingGps(false);
      },
      () => {
        setLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const calculateLabTestPrice = (lab: PartnerLabItem) => {
    const count = selectedTestsNames.length || 1;
    const basePerTest = 4500;
    return Math.round(count * basePerTest * lab.testPricingMultiplier);
  };

  const calculateCourierFee = (lab: PartnerLabItem) => {
    return Math.max(1500, Math.round(lab.distanceKm * lab.baseDeliveryFeePerKm));
  };

  const filteredLabs = labs
    .filter((lab) => {
      const q = search.toLowerCase();
      const matchesSearch =
        lab.name.toLowerCase().includes(q) ||
        lab.address.toLowerCase().includes(q) ||
        lab.city.toLowerCase().includes(q);
      if (filterMode === 'home') {
        return matchesSearch && lab.features.some((f) => f.toLowerCase().includes('home'));
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      if (filterMode === 'price') {
        return calculateLabTestPrice(a) - calculateLabTestPrice(b);
      }
      if (filterMode === 'tat') {
        return parseFloat(a.turnaroundTime) - parseFloat(b.turnaroundTime);
      }
      return a.distanceKm - b.distanceKm;
    });

  return (
    <div className="max-w-3xl mx-auto py-3 px-2 sm:px-4 text-slate-900 animate-in fade-in duration-300 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Compare & Select a Laboratory
            </h1>
            <p className="text-[11px] text-slate-500">
              Tests: <strong className="text-slate-700">{selectedTestsNames.join(', ')}</strong> ({selectedTestsNames.length})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUseDeviceGps}
            disabled={locatingGps}
            className="px-3 py-2 bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#006978] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Navigation className={`w-3.5 h-3.5 ${locatingGps ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{userCoords ? 'GPS Active' : 'My GPS'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="px-3 py-2 bg-white border border-slate-200 hover:border-[#006978] text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <MapIcon className="w-3.5 h-3.5 text-[#006978]" />
            <span>{showMap ? 'Hide Map' : 'Compare Map'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Google Maps Laboratory Comparison */}
      {showMap && (
        <div className="space-y-1.5">
          <LabComparisonMap
            labs={filteredLabs.map((l) => ({
              id: l.id,
              name: l.name,
              address: l.address,
              coords: l.coords || { lat: 4.0511, lng: 9.7042 },
              tariffXaf: calculateLabTestPrice(l),
              tat: l.turnaroundTime,
              phone: l.phone
            }))}
            userCoords={userCoords}
            selectedLabId={highlightedLabId || filteredLabs[0]?.id}
            onSelectLab={(id) => {
              setHighlightedLabId(id);
              const target = filteredLabs.find((x) => x.id === id);
              if (target) {
                const el = document.getElementById(`lab-card-${target.id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }}
          />
          <p className="text-[11px] text-slate-500 px-1">
            Tap any laboratory pin on Google Maps to compare distance, turnaround time, and base test tariff.
          </p>
        </div>
      )}

      {/* Searchable Card Dropdown Filter Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search laboratory by name, city, or neighborhood..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006978] shadow-xs"
        />
      </div>

      {/* Interactive Comparison Filter Controls */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
        {[
          { key: 'near', label: 'Nearest First' },
          { key: 'price', label: 'Lowest Tariff' },
          { key: 'tat', label: 'Fastest Turnaround' },
          { key: 'home', label: 'Home Pickup Available' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilterMode(item.key as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === item.key
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Laboratory Comparison Cards */}
      <div className="space-y-3">
        {filteredLabs.length > 0 ? (
          filteredLabs.map((lab) => {
            const labTestPrice = calculateLabTestPrice(lab);
            const deliveryFee = calculateCourierFee(lab);
            const isHighlighted = highlightedLabId === lab.id;

            return (
              <div
                id={`lab-card-${lab.id}`}
                key={lab.id}
                onClick={() => onSelectLab(lab, labTestPrice, deliveryFee)}
                className={`p-4 bg-white border rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all group ${
                  isHighlighted
                    ? 'border-[#006978] ring-2 ring-[#006978]/20'
                    : 'border-slate-200 hover:border-[#006978]'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-1 shrink-0 group-hover:border-[#006978] transition-colors">
                    {(() => {
                      const activeLogo = (typeof window !== 'undefined' ? localStorage.getItem(`lab_logo_${lab.id}`) : null) || lab.logoUrl;
                      const hasRealLogo = activeLogo && (activeLogo.startsWith('data:') || activeLogo.includes('logo') || activeLogo.includes('firebasestorage') || activeLogo.includes('cloudinary'));
                      if (hasRealLogo) {
                        return <img src={activeLogo} alt={`${lab.name} logo`} className="w-full h-full object-contain rounded-xl" />;
                      }
                      const initials = lab.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'LB';
                      return (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#006978] to-[#00838F] text-white flex flex-col items-center justify-center font-black p-1">
                          <Building2 className="w-4 h-4 text-cyan-200" />
                          <span className="text-[10px] tracking-tight">{initials}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006978] truncate">
                      {lab.name}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                      <span className="flex items-center text-amber-600 font-bold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                        {lab.rating} ({lab.reviewsCount})
                      </span>
                      <span>&middot;</span>
                      <span className="font-mono font-semibold">{lab.distanceKm} km</span>
                      <span>&middot;</span>
                      <span className="flex items-center gap-1 font-semibold text-teal-800">
                        <Clock className="w-3 h-3" />
                        TAT: {lab.turnaroundTime}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate">{lab.address}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                      <span>{lab.features.join(' · ')}</span>
                      {lab.phone && (
                        <a
                          href={`tel:${lab.phone.replace(/\s+/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-mono font-bold text-[#006978] hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{lab.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lab Specific Pricing Display */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2.5 sm:pt-0 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-semibold text-slate-400 block">Base Test Estimate</span>
                    <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                      {formatXAF(labTestPrice)}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono tabular-nums">
                      Home pickup: +{formatXAF(deliveryFee)}
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
            No laboratories found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
