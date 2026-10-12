import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  FileText, 
  FlaskConical, 
  Building2,
  AlertCircle,
  Droplet,
  Coffee,
  Pill,
  Sun,
  Activity,
  Layers
} from 'lucide-react';
import { MasterTestItem } from '../../data/final_catalog';

interface TestDetailScreenProps {
  test: MasterTestItem;
  onBack: () => void;
  onViewAvailableLabs: (test: MasterTestItem) => void;
  onSelectRelatedTest?: (testName: string) => void;
}

export const TestDetailScreen: React.FC<TestDetailScreenProps> = ({
  test,
  onBack,
  onViewAvailableLabs,
  onSelectRelatedTest
}) => {
  const [prepAcknowledged, setPrepAcknowledged] = useState(false);

  const prepText = test.conditions || 'Standard clinical collection protocol. Hydrate with plain water. Fasting not strictly required unless combined with metabolic panel.';
  const requiresFasting = prepText.toLowerCase().includes('fasting') || prepText.toLowerCase().includes('jeûn');

  return (
    <div className="max-w-3xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
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
            {test.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
            <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">Code: {test.code}</span>
            <span>&bull;</span>
            <span className="text-[#006978] font-bold">{test.category}</span>
          </div>
        </div>
      </div>

      {/* Meta Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sample Specimen</span>
          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 text-rose-500" />
            <span className="truncate">{test.sampleType}</span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Turnaround Time</span>
          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#006978]" />
            <span>~{test.turnaroundTime}</span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pricing Policy</span>
          <div className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Set by Performing Lab</span>
          </div>
        </div>
      </div>

      {/* Pre-Test Preparation & Guidelines Box - Prominently Displayed Before Booking */}
      <div className="bg-amber-50/90 border-2 border-amber-300/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
              Pre-Test Preparation Guidelines (Consignes Avant Prélèvement)
            </h3>
            <p className="text-[11px] text-amber-800">
              Please review these clinical recommendations before scheduling your appointment:
            </p>
          </div>
        </div>

        {/* Clinical Preparation Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-950">
          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Coffee className="w-4 h-4 text-amber-700" />
              <span>Fasting Status</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              {requiresFasting 
                ? 'Strict 10-12 hour overnight fasting required. You may drink plain unflavored water.'
                : 'Fasting is not mandatory for this investigation. Avoid heavy or high-fat meals right before blood collection.'}
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sun className="w-4 h-4 text-amber-700" />
              <span>Optimal Timing</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Morning collection (07:00 - 10:30 AM) is recommended for stable baseline biological intervals.
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Pill className="w-4 h-4 text-amber-700" />
              <span>Medications</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Continue prescribed daily medications unless instructed otherwise by your prescribing physician.
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Activity className="w-4 h-4 text-amber-700" />
              <span>Rest & Hydration</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Drink 1-2 glasses of water to ease venipuncture. Avoid vigorous exercise 24h prior to draw.
            </p>
          </div>
        </div>

        {/* Direct Clinical Condition from Master Catalog */}
        <div className="p-3 bg-amber-100/60 rounded-2xl border border-amber-200 text-xs text-amber-900">
          <strong>Catalog Instruction:</strong> {prepText}
        </div>

        {/* Patient Acknowledgement Checkbox */}
        <label className="flex items-center gap-2.5 pt-1 text-xs font-bold text-amber-950 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={prepAcknowledged}
            onChange={(e) => setPrepAcknowledged(e.target.checked)}
            className="w-4 h-4 rounded text-[#006978] accent-[#006978]"
          />
          <span>I understand and will follow the pre-test preparation instructions.</span>
        </label>
      </div>

      {/* Description & Clinical Significance */}
      <div className="space-y-2">
        <h3 className="text-sm font-extrabold text-slate-900">
          Clinical Significance & Description
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {test.description}
        </p>
      </div>

      {/* Sub-parameters included in this panel (if any) */}
      {test.subParameters && test.subParameters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#006978]" />
              <span>Included Biomarkers ({test.subParameters.length} parameters)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Reference Intervals Included</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {test.subParameters.slice(0, 10).map((param) => (
              <div key={param.id} className="p-3 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{param.name}</span>
                <div className="text-right text-[11px] text-slate-500">
                  <span className="font-mono text-slate-700">Ref: {param.refRangeMale || param.refRangeWords || 'Normal'}</span>
                  {param.unit && <span className="ml-1 text-slate-400">({param.unit})</span>}
                </div>
              </div>
            ))}
            {test.subParameters.length > 10 && (
              <div className="p-2.5 text-center text-xs text-slate-500 bg-slate-50 font-medium">
                + {test.subParameters.length - 10} additional biomarkers included in this certified panel
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proceed to Choose Lab CTA */}
      <div className="pt-2">
        <button
          onClick={() => onViewAvailableLabs(test)}
          className="w-full py-4 bg-[#006978] hover:bg-[#005a66] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#006978]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Building2 className="w-4 h-4" />
          <span>Choose Laboratory & Location to View Tariffs</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
