import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Star, Clock, Truck, ShieldCheck, MapPin, ChevronRight, Building2, Phone, Navigation, Map as MapIcon, MessageCircle, AlertCircle, Info, Award } from 'lucide-react';
import { formatXAF } from '../../shared/money';
import { db, ensureFirebaseAuth, getDocs, collection } from '../../services/firebase';
import { LabComparisonMap, calculateHaversineKm, toSafeLatLng } from '../../components/maps/GoogleMapsWidgets';
import { isLabMobilePhlebotomyEnabled, getLabPackageConfig } from '../../utils/labPackages';

import { OFFICIAL_MINSANTE_DOUALA_LABS } from '../../data/officialDoualaLabs';

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
}

// Default partner labs populated directly from MINSANTE DPML Cartography
export const DEFAULT_PARTNER_LABS: PartnerLabItem[] = OFFICIAL_MINSANTE_DOUALA_LABS.map((oLab, idx) => ({
  id: oLab.id,
  name: oLab.name,
  rating: oLab.rating,
  reviewsCount: oLab.reviewsCount,
  turnaroundTime: oLab.turnaroundTime,
  features: oLab.supportsHomePickup ? ['Home pickup', 'Walk-in', 'MINSANTE Agréé'] : ['Walk-in only', 'MINSANTE Agréé'],
  distanceKm: Number((1.8 + idx * 0.4).toFixed(1)),
  city: oLab.city,
  address: `${oLab.address} (${oLab.quarter})`,
  phone: oLab.phone,
  coords: oLab.coords,
  imageUrl: '',
  logoUrl: '',
  accredited: true,
  ratePer100m: oLab.ratePer100m,
  baseDeliveryFeePerKm: oLab.baseDeliveryFeePerKm,
  testPricingMultiplier: oLab.testPricingMultiplier,
  supportsHomePickup: oLab.supportsHomePickup,
  needsMobilePhlebotomist: oLab.supportsHomePickup,
  directorName: oLab.directorName,
  directorDegree: oLab.directorDegree,
  agrementNumber: oLab.agrementNumber,
  cbeabmNumber: oLab.cbeabmNumber,
  isExternalBench: oLab.id !== 'lab-1' && oLab.id !== 'douala-central-lab' && !(oLab as any).hasLims,
}));

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
  const [loadingLabs, setLoadingLabs] = useState<boolean>(true);
  const [showMap, setShowMap] = useState<boolean>(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [highlightedLabId, setHighlightedLabId] = useState<string>('');
  const [locatingGps, setLocatingGps] = useState(false);

  // Fetch strictly real configured labs from Firestore and merge with official MINSANTE Douala cartography
  useEffect(() => {
    let active = true;
    const fetchLiveLabs = async () => {
      try {
        setLoadingLabs(true);
        await ensureFirebaseAuth();
        const snap = await getDocs(collection(db, 'labs'));
        if (!active) return;
        const liveList: PartnerLabItem[] = snap.docs
          .filter((docSnap) => {
            const d = docSnap.data();
            return d.status !== 'suspended' && d.status !== 'rejected' && Boolean(d.name);
          })
          .map((docSnap, idx) => {
            const data = docSnap.data();
            const safeCoords = toSafeLatLng(
              {
                lat: data.lat ?? data.coords?.lat ?? 4.0511 + idx * 0.012,
                lng: data.lng ?? data.coords?.lng ?? 9.7042 + idx * 0.011,
              },
              { lat: 4.0511 + idx * 0.012, lng: 9.7042 + idx * 0.011 }
            );
            const homeEnabled = isLabMobilePhlebotomyEnabled({ id: docSnap.id, ...data });
            const pkg = getLabPackageConfig({ id: docSnap.id, ...data });
            const computedFeatures = homeEnabled
              ? ['Home pickup', 'Walk-in', 'Accredited']
              : ['Walk-in only', 'Accredited'];

            return {
              id: docSnap.id,
              name: String(data.name),
              rating: Number(data.rating) || 4.8,
              reviewsCount: Number(data.reviewsCount) || 12,
              turnaroundTime: String(data.turnaroundTime || '3–4 hrs'),
              features: computedFeatures,
              distanceKm: Number((2.0 + idx * 0.8).toFixed(1)),
              city: String(data.city || data.location || 'Cameroon'),
              address: String(data.address || data.location || data.city || 'Cameroon'),
              phone: data.phone || data.contactPhone || '',
              coords: safeCoords,
              imageUrl: String(data.imageUrl || ''),
              logoUrl: String(data.logoUrl || data.logo || ''),
              accredited: true,
              ratePer100m: Number(data.ratePer100m || data.phlebPickupRatePer100m) || 60,
              baseDeliveryFeePerKm: Number(data.baseDeliveryFeePerKm) || 650,
              testPricingMultiplier: Number(data.pricingMultiplier) || 1.0,
              supportsHomePickup: homeEnabled,
              needsMobilePhlebotomist: homeEnabled,
              plan: data.plan || pkg.id,
              subscriptionTier: data.subscriptionTier || pkg.legacyTier,
              maxTestsPerMonth: Number(data.maxTestsPerMonth) || pkg.maxTestsPerMonth,
              directorName: data.directorName || data.managerName || undefined,
              directorDegree: data.directorDegree || undefined,
              agrementNumber: data.agrementNumber || data.licenseNumber || undefined,
              isExternalBench: data.isExternalBench ?? false,
            };
          });

        // Combine Firestore custom labs with official MINSANTE Douala laboratories
        const combined = [...liveList];
        DEFAULT_PARTNER_LABS.forEach((defLab) => {
          const exists = liveList.some(
            (l) => l.name.toLowerCase().trim() === defLab.name.toLowerCase().trim() || l.id === defLab.id
          );
          if (!exists) {
            combined.push(defLab);
          }
        });

        setLabs(combined);
      } catch (e) {
        console.warn('Error loading Firestore labs directory, falling back to official MINSANTE cartography:', e);
        if (active) setLabs(DEFAULT_PARTNER_LABS);
      } finally {
        if (active) setLoadingLabs(false);
      }
    };
    fetchLiveLabs();
    return () => {
      active = false;
    };
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
      const q = String(search || '').toLowerCase();
      const matchesSearch =
        String(lab.name || '').toLowerCase().includes(q) ||
        String(lab.address || '').toLowerCase().includes(q) ||
        String(lab.city || '').toLowerCase().includes(q);
      if (filterMode === 'home') {
        return matchesSearch && isLabMobilePhlebotomyEnabled(lab);
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      if (filterMode === 'price') {
        return calculateLabTestPrice(a) - calculateLabTestPrice(b);
      }
      if (filterMode === 'tat') {
        return (parseFloat(String(a.turnaroundTime || '4')) || 4) - (parseFloat(String(b.turnaroundTime || '4')) || 4);
      }
      return (Number(a.distanceKm) || 0) - (Number(b.distanceKm) || 0);
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

      {/* Official MINSANTE Accreditation & Transparent Pricing Banner */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-teal-200 rounded-2xl flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-800 space-y-1">
          <p className="font-extrabold text-teal-950 flex items-center gap-1.5">
            <span>Laboratoires d'Analyses Médicales Agréés MINSANTE (Douala / Littoral)</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-teal-600 text-white">Officiel DPML</span>
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Cartographie officielle du Ministère de la Santé Publique. Les tarifs affichés sont des <strong>estimations de base indicatives</strong>. Le prix final est confirmé directement par le laboratoire selon son tarif de paillasse sur votre bon WhatsApp.
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            💡 En cas d'indisponibilité temporaire d'un laboratoire, vous pouvez librement en sélectionner un autre en 1 clic.
          </p>
        </div>
      </div>

      {/* Searchable Card Dropdown Filter Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Rechercher par nom (ex. BioMedicam, Litto Labo, Deido, Akwa, Bonanjo)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006978] shadow-xs"
        />
      </div>

      {/* Interactive Comparison Filter Controls */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
        {[
          { key: 'near', label: 'Plus Proche' },
          { key: 'price', label: 'Tarif le Plus Bas' },
          { key: 'tat', label: 'Délai le Plus Rapide' },
          { key: 'home', label: 'Prélèvement à Domicile' }
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
                className={`p-4 bg-white border rounded-3xl shadow-xs flex flex-col gap-3 cursor-pointer transition-all group ${
                  isHighlighted
                    ? 'border-[#006978] ring-2 ring-[#006978]/20'
                    : 'border-slate-200 hover:border-[#006978]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-1 shrink-0 group-hover:border-[#006978] transition-colors">
                      {(() => {
                        const activeLogo = lab.logoUrl;
                        const hasRealLogo =
                          activeLogo &&
                          (activeLogo.startsWith('data:') ||
                            activeLogo.includes('logo') ||
                            activeLogo.includes('firebasestorage') ||
                            activeLogo.includes('cloudinary'));
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

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006978]">
                          {lab.name}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Award className="w-3 h-3 text-blue-600" />
                          Agréé MINSANTE
                        </span>
                        {lab.isExternalBench ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Building2 className="w-3 h-3 text-amber-600" />
                            Banc Partenaire Référencé (Passerelle Directe)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            <ShieldCheck className="w-3 h-3 text-teal-600" />
                            nanoLabs LIMS Intégré
                          </span>
                        )}
                      </div>

                      {/* Technical Director & Accreditation info */}
                      {lab.directorName && (
                        <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 flex-wrap">
                          <span>Resp. Technique: <strong>{lab.directorName}</strong></span>
                          {lab.directorDegree && <span className="text-slate-400">({lab.directorDegree})</span>}
                        </p>
                      )}

                      {lab.agrementNumber && (
                        <p className="text-[10px] font-mono text-slate-500 truncate">
                          Agrément: {lab.agrementNumber}
                        </p>
                      )}

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

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          WhatsApp Direct Dispatch
                        </span>
                        <span>·</span>
                        <span>{lab.features.join(' · ')}</span>
                        {lab.phone && (
                          <>
                            <span>·</span>
                            <a
                              href={`tel:${lab.phone.replace(/\s+/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-mono font-bold text-[#006978] hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{lab.phone}</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lab Specific Pricing Display */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2.5 sm:pt-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-semibold text-slate-400 block">Tarif de Base Indicatif</span>
                      <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                        {formatXAF(labTestPrice)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono tabular-nums">
                        {isLabMobilePhlebotomyEnabled(lab)
                          ? `Prélèvement à domicile: +${formatXAF(deliveryFee)}`
                          : 'Prélèvement au laboratoire'}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#006978] mt-2 group-hover:translate-x-1 transition-transform">
                      Choisir ce labo <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Honest Pricing & External Bench Disclosure Note */}
                <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[10.5px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-snug">
                    <p className="font-bold text-amber-950">
                      Tarif indicatif &bull; Validation finale par le laboratoire
                    </p>
                    <p className="text-amber-800">
                      Ce laboratoire traite vos analyses sur son automate biomédical certifié. Les prix sont indicatifs et vérifiés avec le biologiste lors de l'envoi du bon WhatsApp. Les résultats signés vous sont remis de manière sécurisée en ligne.
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : loadingLabs ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            Loading registered laboratories from Firestore...
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200 space-y-1">
            <p className="font-bold text-slate-800">No Matching Partner Laboratories Found</p>
            <p>Only active laboratories registered on the nanoLabs network are listed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
