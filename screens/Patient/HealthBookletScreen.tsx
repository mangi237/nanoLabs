import React, { useState } from 'react';
import { 
  BookOpen, 
  TrendingUp, 
  Download, 
  Calendar, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useFamilyProfile } from '../../context/familyProfileContext';

export const HealthBookletScreen: React.FC = () => {
  const { user } = useAuth();
  const { familyMembers, activeProfile, switchActiveProfile } = useFamilyProfile();
  const [selectedBiomarker, setSelectedBiomarker] = useState<string>('glycemia');

  const isMother = activeProfile?.relationship === 'mother';
  const isChild = activeProfile?.relationship === 'child' || activeProfile?.relationship === 'son' || activeProfile?.relationship === 'daughter';

  // Dynamic history datasets depending on family context
  const glycemiaHistory = isMother ? [
    { date: '15 Jan 2025', value: 1.45, status: 'high', lab: 'Laboratoire Central Akwa' },
    { date: '12 Mai 2025', value: 1.38, status: 'high', lab: 'Laboratoire Central Akwa' },
    { date: '04 Oct 2025', value: 1.32, status: 'high', lab: 'Centre Diagnostic Bonanjo' },
    { date: '18 Fév 2026', value: 1.25, status: 'high', lab: 'Laboratoire Central Akwa' },
    { date: '09 Sep 2026', value: 1.28, status: 'high', lab: 'Laboratoire Central Akwa' }
  ] : [
    { date: '15 Jan 2025', value: 0.92, status: 'normal', lab: 'Laboratoire Central Akwa' },
    { date: '12 Mai 2025', value: 0.98, status: 'normal', lab: 'Laboratoire Central Akwa' },
    { date: '04 Oct 2025', value: 1.05, status: 'normal', lab: 'Centre Diagnostic Bonanjo' },
    { date: '18 Fév 2026', value: 0.95, status: 'normal', lab: 'Laboratoire Central Akwa' },
    { date: '09 Sep 2026', value: 0.94, status: 'normal', lab: 'Laboratoire Central Akwa' }
  ];

  const hemoglobinHistory = isChild ? [
    { date: '10 Août 2024', value: 11.4, status: 'normal', lab: 'Centre Pasteur du Cameroun' },
    { date: '15 Déc 2024', value: 11.8, status: 'normal', lab: 'Centre Pasteur du Cameroun' },
    { date: '22 Avr 2025', value: 12.0, status: 'normal', lab: 'Centre Pasteur du Cameroun' },
    { date: '11 Nov 2025', value: 12.1, status: 'normal', lab: 'Centre Pasteur du Cameroun' },
    { date: '18 Août 2026', value: 12.2, status: 'normal', lab: 'Centre Pasteur du Cameroun' }
  ] : [
    { date: '15 Jan 2025', value: 12.1, status: 'normal', lab: 'Laboratoire Central Akwa' },
    { date: '12 Mai 2025', value: 11.8, status: 'normal', lab: 'Laboratoire Central Akwa' },
    { date: '04 Oct 2025', value: 12.4, status: 'normal', lab: 'Centre Diagnostic Bonanjo' },
    { date: '18 Fév 2026', value: 12.6, status: 'normal', lab: 'Laboratoire Central Akwa' },
    { date: '09 Sep 2026', value: 12.8, status: 'normal', lab: 'Laboratoire Central Akwa' }
  ];

  const creatinineHistory = [
    { date: '15 Jan 2025', value: 8.5, status: 'normal', lab: 'Laboratoire Central Akwa' },
    { date: '12 Mai 2025', value: 8.8, status: 'normal', lab: 'Laboratoire Central Akwa' },
    { date: '04 Oct 2025', value: 8.1, status: 'normal', lab: 'Centre Diagnostic Bonanjo' },
    { date: '18 Fév 2026', value: 8.4, status: 'normal', lab: 'Laboratoire Central Akwa' },
    { date: '09 Sep 2026', value: 8.2, status: 'normal', lab: 'Laboratoire Central Akwa' }
  ];

  const getActiveHistory = () => {
    switch (selectedBiomarker) {
      case 'glycemia': return { name: isMother ? 'Glycémie Veineuse (Diabète)' : 'Glycémie à Jeûn', unit: 'g/L', target: isMother ? '0.80 - 1.20' : '0.70 - 1.10', data: glycemiaHistory, min: 0.6, max: 1.8 };
      case 'hemoglobin': return { name: isChild ? 'Hémoglobine Pédiatrique (NFS)' : 'Hémoglobine (NFS)', unit: 'g/dL', target: isChild ? '11.0 - 14.5' : '11.5 - 15.0', data: hemoglobinHistory, min: 9.0, max: 16.0 };
      case 'creatinine': return { name: 'Créatinine Sérique', unit: 'mg/L', target: '6.0 - 11.0', data: creatinineHistory, min: 4.0, max: 13.0 };
      default: return { name: 'Glycémie à Jeûn', unit: 'g/L', target: '0.70 - 1.10', data: glycemiaHistory, min: 0.6, max: 1.4 };
    }
  };

  const activeMetric = getActiveHistory();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            Unified Digital Health Booklet
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Lifelong longitudinal laboratory records across CEMAC certified diagnostic centers.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="min-h-[44px] px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#0F766E]" />
          <span>Export Booklet (PDF)</span>
        </button>
      </div>

      {/* Family Member Record Selector Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0F766E]" />
            <span className="text-xs font-bold text-[#0D3B38] uppercase tracking-wider">
              Health Record for Family Member:
            </span>
          </div>
          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            {activeProfile?.fullName} &bull; {activeProfile?.relationshipLabel}
          </span>
        </div>

        {/* Member pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {familyMembers.map((member) => {
            const isSelected = member.id === activeProfile?.id;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => switchActiveProfile(member.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#0D3B38] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{member.fullName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {member.age} yrs
                </span>
              </button>
            );
          })}
        </div>

        {/* Clinical alerts for active member */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Groupe Sanguin</span>
            <span className="font-mono font-black text-slate-800">{activeProfile?.bloodGroup || 'Non renseigné'}</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Allergies Répertoriées</span>
            <span className="font-medium text-rose-700 truncate block">
              {activeProfile?.allergies && activeProfile.allergies.length > 0 
                ? activeProfile.allergies.join(', ') 
                : 'Aucune allergie connue'}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Pathologies Suivies</span>
            <span className="font-medium text-indigo-700 truncate block">
              {activeProfile?.chronicConditions && activeProfile.chronicConditions.length > 0 
                ? activeProfile.chronicConditions.join(', ') 
                : 'Bilan de santé régulier'}
            </span>
          </div>
        </div>
      </div>

      {/* Biomarker Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setSelectedBiomarker('glycemia')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedBiomarker === 'glycemia'
              ? 'border-[#0F766E] bg-teal-50/50 shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Glycémie à Jeûn</span>
            <span className="text-xs font-mono font-black text-[#0D3B38]">0.94 g/L</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Stable &bull; Normoglycémie</div>
        </button>

        <button
          onClick={() => setSelectedBiomarker('hemoglobin')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedBiomarker === 'hemoglobin'
              ? 'border-[#0F766E] bg-teal-50/50 shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Hémoglobine</span>
            <span className="text-xs font-mono font-black text-[#0D3B38]">12.8 g/dL</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Normale &bull; Non anémique</div>
        </button>

        <button
          onClick={() => setSelectedBiomarker('creatinine')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedBiomarker === 'creatinine'
              ? 'border-[#0F766E] bg-teal-50/50 shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Créatinine Sérique</span>
            <span className="text-xs font-mono font-black text-[#0D3B38]">8.2 mg/L</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Fonction rénale préservée</div>
        </button>
      </div>

      {/* Longitudinal Trend Chart Visualization */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0B1F1D]">{activeMetric.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-[#0F766E]">
                {activeMetric.unit}
              </span>
            </div>
            <p className="text-xs text-[#6B7F7D]">Intervalle de référence cible: {activeMetric.target} {activeMetric.unit}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tous les dosages conformes</span>
          </div>
        </div>

        {/* Visual Bar / Point Trend */}
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-200">
          {activeMetric.data.map((point, index) => {
            const pct = Math.min(100, Math.max(10, ((point.value - activeMetric.min) / (activeMetric.max - activeMetric.min)) * 100));
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[11px] font-mono font-bold text-slate-900 group-hover:text-[#0F766E] transition-colors">
                  {point.value}
                </div>
                <div className="w-full max-w-[40px] bg-teal-50 rounded-t-xl overflow-hidden flex items-end h-32">
                  <div
                    style={{ height: `${pct}%` }}
                    className="w-full bg-gradient-to-t from-[#0F766E] to-[#14B8A6] rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap truncate max-w-[70px]">
                  {point.date.split(' ')[1]} {point.date.split(' ')[2]?.slice(-2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Historical Ledger Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Historique des Dosages Certifiés
          </h3>
          <div className="divide-y divide-slate-100">
            {activeMetric.data.slice().reverse().map((entry, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{entry.date}</div>
                    <div className="text-[10px] text-slate-400">{entry.lab}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-[#0D3B38]">
                    {entry.value} {activeMetric.unit}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700">Normal</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthBookletScreen;
