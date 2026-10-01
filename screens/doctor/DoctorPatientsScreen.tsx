import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  FileText, 
  Activity, 
  ChevronRight, 
  Phone, 
  Calendar, 
  ShieldCheck,
  Filter,
  Plus,
  Video
} from 'lucide-react';

interface DoctorPatientsScreenProps {
  onSelectPatient?: (patientId: string) => void;
  onNewPrescription?: () => void;
}

export const DoctorPatientsScreen: React.FC<DoctorPatientsScreenProps> = ({
  onSelectPatient,
  onNewPrescription
}) => {
  const [search, setSearch] = useState('');
  const [selectedConditionFilter, setSelectedConditionFilter] = useState('all');
  const [activeModalPatient, setActiveModalPatient] = useState<any | null>(null);

  const patients = [
    {
      id: 'p1',
      name: 'Mme. Claire Ngo',
      phone: '+237 670 11 22 33',
      age: 38,
      gender: 'F',
      chronicCondition: 'Hypertension & Dyslipidemia',
      lastTestDate: '09 Sep 2026',
      lastTestName: 'NFS, Glycémie, Bilan Lipidique',
      status: 'Awaiting Analysis',
      totalReports: 7
    },
    {
      id: 'p2',
      name: 'M. Joseph Ewane',
      phone: '+237 699 44 55 66',
      age: 45,
      gender: 'M',
      chronicCondition: 'Type 2 Diabetes',
      lastTestDate: '08 Sep 2026',
      lastTestName: 'Créatininémie, HbA1c',
      status: 'Validated & Signed',
      totalReports: 14
    },
    {
      id: 'p3',
      name: 'Mme. Sandrine Fosso',
      phone: '+237 655 88 99 00',
      age: 29,
      gender: 'F',
      chronicCondition: 'Prenatal Care (T2)',
      lastTestDate: '07 Sep 2026',
      lastTestName: 'Sérologies T2, Glycémie',
      status: 'Validated & Signed',
      totalReports: 5
    },
    {
      id: 'p4',
      name: 'M. Patrick Manga',
      phone: '+237 677 33 22 11',
      age: 52,
      gender: 'M',
      chronicCondition: 'Post-Malaria Followup',
      lastTestDate: '02 Sep 2026',
      lastTestName: 'Goutte Épaisse, TDR, CRP',
      status: 'Validated & Signed',
      totalReports: 9
    }
  ];

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.chronicCondition.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            My Clinical Patient Cohort
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Track referred patients, longitudinal biomarker progressions, and historic laboratory reports.
          </p>
        </div>

        {onNewPrescription && (
          <button
            onClick={onNewPrescription}
            className="min-h-[44px] px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D3B38] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Lab Prescription</span>
          </button>
        )}
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search patient by name, phone or condition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-bold self-end sm:self-auto">
          {filteredPatients.length} Active Patients Followed
        </div>
      </div>

      {/* Patient Cards List */}
      <div className="space-y-3">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900">{patient.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                  {patient.age} ans &bull; {patient.gender}
                </span>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{patient.phone}</span>
                <span>&bull;</span>
                <span className="text-teal-800 font-sans font-bold">{patient.chronicCondition}</span>
              </p>

              <div className="text-[11px] text-slate-600 pt-1">
                Dernier Bilan: <strong>{patient.lastTestName}</strong> ({patient.lastTestDate})
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2.5 self-end sm:self-auto">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                patient.status === 'Validated & Signed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {patient.status}
              </span>

              <a
                href="https://waspito.com"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-3.5 py-1.5 bg-[#0084FF] hover:bg-[#0073E6] text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Hold Video Consult on Waspito"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Waspito Video</span>
              </a>

              <button
                onClick={() => setActiveModalPatient(patient)}
                className="min-h-[40px] px-4 py-1.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>View Booklet</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Patient Booklet Preview Modal */}
      {activeModalPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">{activeModalPatient.name}</h3>
                <p className="text-xs text-slate-500">
                  {activeModalPatient.chronicCondition} &bull; Dossier N° {activeModalPatient.id}
                </p>
              </div>
              <button
                onClick={() => setActiveModalPatient(null)}
                className="text-slate-400 hover:text-slate-700 p-1 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recent Diagnostic History ({activeModalPatient.totalReports} records)
              </h4>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{activeModalPatient.lastTestName}</span>
                  <span className="text-emerald-700 font-mono">CONFORME</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Laboratoire Central Akwa &bull; {activeModalPatient.lastTestDate}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Bilan Métabolique & Rénal</span>
                  <span className="text-emerald-700 font-mono">CONFORME</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Centre Diagnostic Bonanjo &bull; 15 Jan 2026
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              <a
                href="https://waspito.com"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-4 py-2 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Video className="w-4 h-4" />
                <span>Hold Consultation on Waspito</span>
              </a>
              <button
                onClick={() => setActiveModalPatient(null)}
                className="min-h-[40px] px-5 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientsScreen;
