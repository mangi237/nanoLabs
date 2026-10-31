import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { formatXAF } from '../../shared/money';
import { PartnerLabItem, DEFAULT_PARTNER_LABS } from './ChooseLabScreen';
import { HomePickupLocationPicker } from '../../components/maps/GoogleMapsWidgets';

interface CollectionMethodScreenProps {
  lab?: PartnerLabItem;
  onBack: () => void;
  onContinue: (
    method: 'home' | 'lab',
    fee: number,
    distanceKm: number,
    address: string,
    coords?: { lat: number; lng: number }
  ) => void;
  initialMethod?: 'home' | 'lab';
}

export const CollectionMethodScreen: React.FC<CollectionMethodScreenProps> = ({
  lab = DEFAULT_PARTNER_LABS[0],
  onBack,
  onContinue,
  initialMethod = 'home'
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'home' | 'lab'>(initialMethod);
  const [pickupAddress, setPickupAddress] = useState<string>('Boulevard de la Liberté, Akwa, Douala');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number }>({
    lat: 4.0565,
    lng: 9.7582
  });
  const [distanceKm, setDistanceKm] = useState<number>(lab.distanceKm || 2.4);

  const ratePer100m = lab.ratePer100m || 60;
  const distanceMeters = Math.round(distanceKm * 1000);
  const calculatedPickupFee = Math.max(1200, Math.round((distanceMeters / 100) * ratePer100m));

  const handleMapLocationChange = useCallback(
    (data: { coords: { lat: number; lng: number }; address: string; distanceKm: number }) => {
      setPickupCoords(data.coords);
      setPickupAddress(data.address);
      setDistanceKm(Math.max(0.2, data.distanceKm));
    },
    []
  );

  const handleNext = () => {
    onContinue(
      selectedMethod,
      selectedMethod === 'home' ? calculatedPickupFee : 0,
      selectedMethod === 'home' ? distanceKm : 0,
      selectedMethod === 'home' ? pickupAddress : lab.address,
      selectedMethod === 'home' ? pickupCoords : lab.coords
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sample Collection Method & Location
          </h1>
          <p className="text-[11px] text-slate-500">
            Laboratory: <strong className="text-slate-800">{lab.name}</strong> ({lab.address})
          </p>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        Choose whether you want a mobile phlebotomist dispatched to your exact Google Maps location, or prefer walking in directly to the laboratory.
      </p>

      <div className="space-y-4">
        {/* Option 1: Walk-In to Laboratory */}
        <div
          onClick={() => setSelectedMethod('lab')}
          className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${
            selectedMethod === 'lab'
              ? 'border-[#006978] bg-[#E0F2F1]/20 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                selectedMethod === 'lab' ? 'bg-[#006978] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-slate-900">Walk-In at Laboratory</h4>
                <span className="text-xs font-bold text-emerald-700">0 FCFA Pickup Fee</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Visit the in-lab phlebotomy bench directly after payment verification: {lab.address}
              </p>
            </div>
          </div>

          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              selectedMethod === 'lab' ? 'border-[#006978] bg-[#006978]' : 'border-slate-300'
            }`}
          >
            {selectedMethod === 'lab' && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </div>

        {/* Option 2: Home Sample Pickup via Google Maps */}
        <div
          onClick={() => setSelectedMethod('home')}
          className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-4 ${
            selectedMethod === 'home'
              ? 'border-[#006978] bg-[#E0F2F1]/15 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                  selectedMethod === 'home' ? 'bg-[#006978] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900">Home Sample Pickup</h4>
                  <span className="text-xs font-mono font-bold text-[#006978]">
                    {ratePer100m} FCFA / 100m
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pin your exact home or office location on Google Maps for live courier dispatch & +4°C sample transport.
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selectedMethod === 'home' ? 'border-[#006978] bg-[#006978]' : 'border-slate-300'
              }`}
            >
              {selectedMethod === 'home' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>

          {selectedMethod === 'home' && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="pt-3 border-t border-slate-200 space-y-4 bg-white p-4 rounded-2xl border"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-[#006978]" />
                <span>Set Your Exact Pickup Coordinates on Google Maps:</span>
              </div>

              <HomePickupLocationPicker
                labCoords={lab.coords || { lat: 4.0511, lng: 9.7042 }}
                labName={lab.name}
                initialCoords={pickupCoords}
                initialAddress={pickupAddress}
                onLocationChange={handleMapLocationChange}
              />

              {/* Selected Address Confirmation */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">
                  Gate / Apartment / Landmark Note (Optional):
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Add gate color, floor, or nearby landmark..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-[#006978] focus:bg-white"
                />
              </div>

              {/* Distance & Courier Pricing Breakdown Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Calculated Distance from {lab.name}:</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    {distanceKm} km ({distanceMeters.toLocaleString()} m)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Laboratory Distance Rate:</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    {ratePer100m} FCFA / 100m
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-black text-slate-900">Estimated Home Pickup Fee:</span>
                  <span className="font-black font-mono tabular-nums text-sm text-[#006978]">
                    {formatXAF(calculatedPickupFee)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#006978] shrink-0" />
                  <span>Added to your official Cashier invoice once Reception confirms your request.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-2">
        <button
          onClick={handleNext}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue to Test Request Summary</span>
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
};
