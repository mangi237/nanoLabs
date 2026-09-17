import React, { useState, useRef, useEffect } from 'react';
import { 
  Stethoscope, 
  Search, 
  Check, 
  Plus, 
  Building2, 
  ShieldCheck, 
  ChevronDown, 
  UserPlus, 
  X,
  Sparkles
} from 'lucide-react';

export interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  verified: boolean;
  phone?: string;
  code?: string;
}

export const ACCREDITED_DOCTORS: DoctorOption[] = [
  {
    id: 'doc-1',
    name: 'Dr. Emmanuel Nkuo',
    specialty: 'Internal Medicine & Infectious Diseases',
    hospital: 'La Quintinie Hospital, Douala',
    verified: true,
    code: 'DOC-LQD-01',
    phone: '+237 677 12 34 56'
  },
  {
    id: 'doc-2',
    name: 'Dr. Beatrice Ndongo',
    specialty: 'Clinical Hematology & Oncology',
    hospital: 'Yaoundé Central Hospital',
    verified: true,
    code: 'DOC-YCH-02',
    phone: '+237 699 23 45 67'
  },
  {
    id: 'doc-3',
    name: 'Dr. Alain Fobissie',
    specialty: 'Cardiology & Vascular Medicine',
    hospital: 'Douala General Hospital',
    verified: true,
    code: 'DOC-DGH-03',
    phone: '+237 675 34 56 78'
  },
  {
    id: 'doc-4',
    name: 'Dr. Sylvie Ngassa',
    specialty: 'Endocrinology & Diabetology',
    hospital: 'Clinique Bonanjo, Douala',
    verified: true,
    code: 'DOC-CBN-04',
    phone: '+237 694 45 67 89'
  },
  {
    id: 'doc-5',
    name: 'Dr. Christian Mbarga',
    specialty: 'Gastroenterology & Hepatology',
    hospital: 'CHU de Yaoundé',
    verified: true,
    code: 'DOC-CHU-05',
    phone: '+237 670 56 78 90'
  },
  {
    id: 'doc-6',
    name: 'Dr. Danielle Ewane',
    specialty: 'Obstetrics & Reproductive Endocrinology',
    hospital: 'Hôpital Gynéco-Obstétrique de Douala',
    verified: true,
    code: 'DOC-HGO-06',
    phone: '+237 691 67 89 01'
  }
];

interface DoctorCardSelectProps {
  value: string; // The formatted doctor name or string
  hospitalValue?: string;
  onChange: (doctorName: string, hospital?: string, doctorObj?: DoctorOption) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  connectedDoctors?: DoctorOption[];
}

export const DoctorCardSelect: React.FC<DoctorCardSelectProps> = ({
  value,
  hospitalValue,
  onChange,
  label = 'Referring / Prescribing Doctor',
  placeholder = 'Search accredited doctors or type manually...',
  required = false,
  className = '',
  connectedDoctors = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customHospital, setCustomHospital] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine accredited and connected doctors safely
  const safeConnected = Array.isArray(connectedDoctors) ? connectedDoctors : [];
  const allDoctors = [
    ...safeConnected,
    ...ACCREDITED_DOCTORS.filter(d => !safeConnected.some(cd => 
      (cd.id && d.id && cd.id === d.id) || 
      (cd.name && d.name && cd.name.toLowerCase() === d.name.toLowerCase())
    ))
  ];

  const searchLower = (search || '').toLowerCase().trim();
  const filteredDoctors = allDoctors.filter(doc => {
    if (!doc) return false;
    const name = (doc.name || '').toLowerCase();
    const specialty = (doc.specialty || '').toLowerCase();
    const hospital = (doc.hospital || '').toLowerCase();
    return name.includes(searchLower) || specialty.includes(searchLower) || hospital.includes(searchLower);
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDoctor = (doc: DoctorOption) => {
    onChange(doc.name, doc.hospital, doc);
    setManualMode(false);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (!customName.trim()) return;
    const finalHospital = customHospital.trim() || 'Independent Clinic';
    onChange(customName.trim(), finalHospital);
    setManualMode(false);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => {
              setManualMode(!manualMode);
              setIsOpen(true);
            }}
            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
          >
            {manualMode ? 'Choose from list' : '+ Type Doctor Manually'}
          </button>
        </div>
      )}

      {/* Selected Doctor Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 bg-white border rounded-2xl cursor-pointer transition-all flex items-center justify-between shadow-2xs ${
          isOpen ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="truncate">
            {value ? (
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{value}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
                    Active
                  </span>
                </div>
                {hospitalValue && (
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{hospitalValue}</span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-400">{placeholder}</span>
            )}
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Floating Card Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-3xl p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150 max-h-[420px] flex flex-col">
          {manualMode ? (
            /* Manual Doctor Input Mode */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>Manual Doctor / Clinic Entry</span>
                </span>
                <button
                  type="button"
                  onClick={() => setManualMode(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Doctor Full Name *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Dr. Paul Atangana"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hospital / Clinic / Health Center
                </label>
                <input
                  type="text"
                  value={customHospital}
                  onChange={(e) => setCustomHospital(e.target.value)}
                  placeholder="e.g. Centre Médical de Bonamoussadi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setManualMode(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Back to List
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  disabled={!customName.trim()}
                  className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm"
                >
                  Set Referring Doctor
                </button>
              </div>
            </div>
          ) : (
            /* Searchable Card Grid / List */
            <>
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search doctor, hospital, or specialty..."
                  className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Doctors Card Grid */}
              <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                {filteredDoctors.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                    <p>No accredited doctors matched "{search}"</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomName(search);
                        setManualMode(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 font-bold hover:bg-teal-100 text-xs"
                    >
                      + Add "{search || 'New Doctor'}" Manually
                    </button>
                  </div>
                ) : (
                  filteredDoctors.map((doc) => {
                    const isSelected = Boolean(value && doc?.name && value.toLowerCase().trim() === doc.name.toLowerCase().trim());
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectDoctor(doc)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500 shadow-sm'
                            : 'bg-white border-slate-100 hover:border-teal-200 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900">{doc.name}</span>
                              {doc.verified && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  <span>Accredited</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-teal-700 font-semibold">{doc.specialty}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{doc.hospital}</span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Quick Manual Add Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">Doctor not listed?</span>
                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Enter Custom Doctor</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
export default DoctorCardSelect;
