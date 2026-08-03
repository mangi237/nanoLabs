import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { Search, Users, ChevronRight, Phone, Mail, UserCheck, Calendar } from 'lucide-react';

interface PatientListProps {
  onSelectPatient?: (patient: any) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ onSelectPatient }) => {
  const { lab } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [lab?.id]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const patientsRef = collection(db, 'labs', lab?.id || 'lab-1', 'patients');
      const snap = await getDocs(patientsRef);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(list);
    } catch (e) {
      console.error('Error fetching patients:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Patient Medical Registry</h2>
          <p className="text-xs text-slate-500">Registered patient directory and laboratory history</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
          <Users className="w-4 h-4" />
          {filteredPatients.length} Records
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search patients by name, code or phone number..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredPatients.map(patient => (
            <div
              key={patient.id}
              onClick={() => onSelectPatient && onSelectPatient(patient)}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-teal-50/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {patient.name ? patient.name.slice(0, 2).toUpperCase() : 'PT'}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{patient.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      {patient.patientId || patient.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {patient.age || 30} years • {patient.gender || 'Not specified'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {patient.phone || 'N/A'}
                    </span>
                    {patient.email && (
                      <span className="hidden sm:flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {patient.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  patient.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {patient.status || 'Pending'}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))}

          {filteredPatients.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto opacity-50 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">No patient records found</p>
              <p className="text-xs text-slate-400">Try refining your search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientList;
