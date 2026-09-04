import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection } from '../../services/firebase';
import { CAMEROON_INSURANCE_COMPANIES } from '../../data/cameroonInsurances';
import { 
  Search, 
  Users, 
  Phone, 
  Mail, 
  UserCheck, 
  Calendar, 
  ShieldCheck, 
  DollarSign, 
  Lock, 
  MapPin, 
  X, 
  Info,
  CreditCard,
  Building2,
  CheckCircle2,
  Droplet,
  Shield,
  Stethoscope,
  Filter,
  Receipt
} from 'lucide-react';

interface PatientListProps {
  onSelectPatient?: (patient: any) => void;
  isAdminView?: boolean;
}

export const PatientList: React.FC<PatientListProps> = ({ onSelectPatient, isAdminView = false }) => {
  const { user, lab } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInsuranceFilter, setSelectedInsuranceFilter] = useState<string>('ALL');
  const [selectedAdminPatient, setSelectedAdminPatient] = useState<any | null>(null);

  // Check if current user is admin or explicitly in admin mode
  const isAdmin = isAdminView || user?.role === 'admin';

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

  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery) ||
      p.insuranceProvider?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedInsuranceFilter === 'ALL') return true;
    if (selectedInsuranceFilter === 'CASH') return !p.hasInsurance;
    if (selectedInsuranceFilter === 'INSURED') return Boolean(p.hasInsurance);
    return (p.insuranceProvider || '').toLowerCase() === selectedInsuranceFilter.toLowerCase();
  });

  // Calculate total price paid by a patient across validated tests
  const calculateTotalPaid = (patient: any) => {
    if (patient.totalPaid !== undefined) {
      return patient.totalPaid;
    }
    if (Array.isArray(patient.labTests)) {
      return patient.labTests.reduce((sum: number, t: any) => {
        if (t.paid || t.paymentStatus === 'paid' || t.status === 'completed' || t.confirmedByCashier) {
          const testPrice = typeof t.price === 'number' ? t.price : 0;
          return sum + testPrice;
        }
        return sum;
      }, 0);
    }
    return 0;
  };

  // Calculate financial statistics across filtered patients
  const totalGrossCharges = filteredPatients.reduce((sum, p) => {
    return sum + (p.totalCharges || p.totalPrice || p.totalAmount || calculateTotalPaid(p) || 0);
  }, 0);

  const totalInsuranceShare = filteredPatients.reduce((sum, p) => {
    if (p.hasInsurance) {
      const gross = p.totalCharges || p.totalPrice || p.totalAmount || calculateTotalPaid(p) || 0;
      const rate = p.insuranceCoverageRate !== undefined ? p.insuranceCoverageRate : 0.8;
      return sum + (p.insuranceCoveredAmount || Math.round(gross * rate));
    }
    return sum;
  }, 0);

  const totalTicketModerateur = totalGrossCharges - totalInsuranceShare;

  const handleRowClick = (patient: any) => {
    if (isAdmin) {
      setSelectedAdminPatient(patient);
    } else if (onSelectPatient) {
      onSelectPatient(patient);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isAdmin ? 'Patient & Insurance Financial Registry' : 'Patient Medical Registry'}
            </h2>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <Lock className="w-3 h-3 text-slate-500" />
                Privacy Protected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin 
              ? 'Real-time billing breakdown: Gross Charges, Insurance Caisse Coverage, and Patient Ticket Modérateur' 
              : 'Registered patient directory and laboratory test history'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
          <Users className="w-4 h-4" />
          {filteredPatients.length} Active Records
        </div>
      </div>

      {/* Admin Insurance Financial Overview Cards */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px]">Total Gross Charges</span>
              <Receipt className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {totalGrossCharges.toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-400">All tests & collection acts billed</div>
          </div>

          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-indigo-700 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px]">Insurance Coverage (Caisse)</span>
              <Shield className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-indigo-950 font-mono">
              {totalInsuranceShare.toLocaleString()} <span className="text-xs font-normal text-indigo-600">FCFA</span>
            </div>
            <div className="text-[11px] text-indigo-600/80">Pending/Settled by Insurers & Caisses</div>
          </div>

          <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-teal-800 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px]">Patient Copay (Ticket Modérateur)</span>
              <CreditCard className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-xl font-black text-teal-950 font-mono">
              {totalTicketModerateur.toLocaleString()} <span className="text-xs font-normal text-teal-600">FCFA</span>
            </div>
            <div className="text-[11px] text-teal-700/80">Direct Out-of-Pocket / Cash collected</div>
          </div>
        </div>
      )}

      {/* Search & Cameroon Insurance Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search patients by name, code, phone, or insurance company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs transition-all"
          />
        </div>

        <div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <select
              value={selectedInsuranceFilter}
              onChange={e => setSelectedInsuranceFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs cursor-pointer appearance-none"
            >
              <option value="ALL">All Payment Types & Insurers</option>
              <option value="INSURED">All Insured Patients (Tiers Payant)</option>
              <option value="CASH">Direct Cash / Private Out-of-Pocket</option>
              <optgroup label="Cameroon Insurance Providers">
                {CAMEROON_INSURANCE_COMPANIES.map(ins => (
                  <option key={ins.id} value={ins.name}>
                    {ins.name} ({ins.shortName || ins.city})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredPatients.map(patient => {
            const totalPaid = calculateTotalPaid(patient);
            const grossCharge = patient.totalCharges || patient.totalPrice || totalPaid || 0;
            const insRate = patient.insuranceCoverageRate !== undefined ? patient.insuranceCoverageRate : 0.8;
            const insShare = patient.hasInsurance ? (patient.insuranceCoveredAmount || Math.round(grossCharge * insRate)) : 0;
            const copay = grossCharge - insShare;

            return (
              <div
                key={patient.id}
                onClick={() => handleRowClick(patient)}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isAdmin 
                    ? 'hover:bg-slate-50 cursor-pointer' 
                    : 'hover:bg-teal-50/40 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {patient.name ? patient.name.slice(0, 2).toUpperCase() : 'PT'}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{patient.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200/80">
                        {patient.patientId || patient.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span>{patient.age || 30} yrs • {patient.gender || 'N/A'}</span>
                      {patient.bloodGroup && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          patient.bloodGroup === 'Unknown'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          <Droplet className="w-2.5 h-2.5" />
                          {patient.bloodGroup}
                        </span>
                      )}
                      {patient.hasInsurance && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          <Shield className="w-2.5 h-2.5" />
                          {patient.insuranceProvider || 'Insured'}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {patient.phone || 'N/A'}
                      </span>
                      {patient.email && (
                        <span className="hidden sm:flex items-center gap-1 truncate text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {patient.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Operational Price Paid & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 shrink-0 text-right">
                  {/* Price Paid Badge */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Price Paid
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                      {totalPaid > 0 ? `${totalPaid.toLocaleString()} XAF` : '0 XAF'}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    patient.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {patient.status || 'Active'}
                  </span>

                  {/* Info Action Button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAdminPatient(patient);
                      }}
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      Basic Info
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredPatients.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto opacity-50 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">No patient records found</p>
              <p className="text-xs text-slate-400">Try refining your search terms</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin View: Basic Information Modal (STRICTLY NO CLINICAL TESTS/DIAGNOSES) */}
      {selectedAdminPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-bold">
                  {selectedAdminPatient.name ? selectedAdminPatient.name.slice(0, 2).toUpperCase() : 'PT'}
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedAdminPatient.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Code: {selectedAdminPatient.patientId || selectedAdminPatient.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAdminPatient(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs sm:text-sm">
              
              {/* Privacy Notice Banner */}
              <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-start gap-2.5 text-teal-950">
                <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-teal-900">Protected Medical Record:</strong> Clinical test requests, laboratory analysis, and medical diagnoses are restricted to authorized laboratory technicians in compliance with Cameroonian Health Privacy Regulations.
                </div>
              </div>

              {/* Basic Demographic Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Age & Gender</span>
                  <span className="font-semibold text-slate-900">{selectedAdminPatient.age || 30} yrs • {selectedAdminPatient.gender || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Group</span>
                  <span className="font-semibold text-rose-700">{selectedAdminPatient.bloodGroup || 'Unknown'}</span>
                </div>
              </div>

              {/* National ID & Insurance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">National ID / Passport</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedAdminPatient.nationalId || 'Not provided'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Insurance</span>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-indigo-700 truncate block">
                      {selectedAdminPatient.hasInsurance ? selectedAdminPatient.insuranceProvider || 'Insured' : 'Out of Pocket'}
                    </span>
                    {selectedAdminPatient.insuranceCardUrl && (
                      <a
                        href={selectedAdminPatient.insuranceCardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-teal-600 hover:underline font-bold shrink-0"
                      >
                        View Card
                      </a>
                    )}
                  </div>
                  {selectedAdminPatient.insurancePolicyNumber && (
                    <span className="text-[10px] font-mono text-slate-500 block truncate">
                      Policy: {selectedAdminPatient.insurancePolicyNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Referring Doctor */}
              <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-teal-800 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-teal-600" />
                  Referring Physician / Clinic
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    {selectedAdminPatient.referringDoctor || 'Self-Referred / Walk-in'}
                  </span>
                  {selectedAdminPatient.referralHospital && (
                    <span className="text-[11px] text-slate-600 font-medium">
                      {selectedAdminPatient.referralHospital}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Directory</span>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{selectedAdminPatient.phone || 'No phone recorded'}</span>
                  </div>
                  {selectedAdminPatient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedAdminPatient.email}</span>
                    </div>
                  )}
                  {selectedAdminPatient.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedAdminPatient.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Billing Overview */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-teal-600" />
                    Financial & Price Paid
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {calculateTotalPaid(selectedAdminPatient).toLocaleString()} XAF
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Platform System Fee: 500 XAF applied per validated lab transaction.
                </div>
              </div>

              {/* Registered Date */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Registered: {selectedAdminPatient.createdAt ? new Date(selectedAdminPatient.createdAt).toLocaleDateString() : 'Active Member'}
                </span>
                <span className="flex items-center gap-1 text-teal-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Account
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAdminPatient(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Record
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;



