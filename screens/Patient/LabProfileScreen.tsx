import React from 'react';
import { ArrowLeft, Star, Check, MapPin, Truck, ShieldCheck, ChevronRight, Navigation } from 'lucide-react';
import { PartnerLabItem } from './ChooseLabScreen';

interface LabProfileScreenProps {
  lab: PartnerLabItem;
  onBack: () => void;
  onSelectLab: (lab: PartnerLabItem) => void;
  selectedTests?: string[];
}

export const LabProfileScreen: React.FC<LabProfileScreenProps> = ({
  lab,
  onBack,
  onSelectLab,
  selectedTests = ['CBC', 'Malaria Test', 'HIV 1 & 2', 'Lipid Profile']
}) => {
  return (
    <div className="max-w-md mx-auto py-3 px-4 text-slate-900 animate-in fade-in duration-300 space-y-5">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">
          {lab.name}
        </h1>
      </div>

      {/* Lab Hero Image & Ratings Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
        <img
          src={lab.imageUrl}
          alt={lab.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-end p-4 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-white/80 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src={lab.logoUrl || lab.imageUrl}
              alt={`${lab.name} logo`}
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                if (lab.imageUrl && (e.currentTarget.src !== lab.imageUrl)) {
                  e.currentTarget.src = lab.imageUrl;
                  e.currentTarget.className = "w-full h-full object-cover rounded-xl";
                }
              }}
            />
          </div>
          <div className="text-white min-w-0">
            <h2 className="text-xl font-black truncate">{lab.name}</h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/90 mt-0.5">
              <span className="flex items-center text-amber-300 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 mr-1" />
                {lab.rating} ({lab.reviewsCount})
              </span>
              <span>&bull;</span>
              <span>{lab.turnaroundTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {lab.features.map(f => (
          <span
            key={f}
            className="px-3 py-1 bg-[#E0F2F1] text-[#006978] rounded-xl text-xs font-bold"
          >
            {f}
          </span>
        ))}
      </div>

      {/* Available for your tests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            Available for your tests
          </h3>
          <span className="text-xs font-bold text-[#006978]">View all →</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
          {selectedTests.map((tName, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#006978]" />
                <span>{tName}</span>
              </div>
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            </div>
          ))}
        </div>
      </div>

      {/* Location Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-[#006978] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-extrabold text-slate-900">{lab.distanceKm} km away &bull; {lab.city}</div>
            <p className="text-[11px] text-slate-500">{lab.address}</p>
          </div>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lab.name + ' ' + lab.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-[#006978] hover:underline shrink-0 flex items-center gap-1"
        >
          <span>View map</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Sticky Bottom Action */}
      <div className="pt-2">
        <button
          onClick={() => onSelectLab(lab)}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Select this lab</span>
        </button>
      </div>
    </div>
  );
};
