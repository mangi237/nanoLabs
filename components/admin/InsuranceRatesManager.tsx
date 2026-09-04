import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Check, 
  ShieldCheck, 
  Percent, 
  FileText, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { CAMEROON_INSURANCE_PROVIDERS, CameroonInsuranceProvider, PRELEVEMENT_ACT_CODES } from '../../data/cameroonInsurances';

export const InsuranceRatesManager: React.FC = () => {
  const [insurances, setInsurances] = useState<CameroonInsuranceProvider[]>(() => {
    try {
      const saved = localStorage.getItem('nanoLabs_custom_insurances');
      if (saved) return JSON.parse(saved);
    } catch {}
    return CAMEROON_INSURANCE_PROVIDERS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState<CameroonInsuranceProvider | null>(insurances[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<CameroonInsuranceProvider | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Prelevement acts state
  const [prelevementActs, setPrelevementActs] = useState(PRELEVEMENT_ACT_CODES);

  const filteredInsurances = insurances.filter(ins => 
    ins.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ins.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    // ins.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ins.taxId && ins.taxId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectInsurance = (ins: CameroonInsuranceProvider) => {
    setSelectedInsurance(ins);
    setIsEditing(false);
    setIsAddingNew(false);
    setEditForm(null);
  };

  const handleStartEdit = (ins: CameroonInsuranceProvider) => {
    setSelectedInsurance(ins);
    setEditForm({ ...ins });
    setIsEditing(true);
    setIsAddingNew(false);
  };

  const handleStartAddNew = () => {
    const newIns: CameroonInsuranceProvider = {
      id: `ins-${Date.now()}`,
      name: '',
      shortName: '',
      category: 'corporate_insurance',
      address: 'Douala / Yaounde - Cameroun',
      bp: 'B.P. 1000 Douala',
      city: 'Douala',
      phone: '+237 233 00 00 00',
      email: 'contact@insurance.cm',
      taxId: 'M000000000000X',
      rcNumber: 'RC/DLA/2026/B/001',
      defaultCoveragePercent: 80,
      defaultPatientCopayPercent: 20,
      requiresBpcNumber: true,
      requiresDossierNumber: true,
      requiresMatricule: true,
      baseRateB: 260,
      baseRateKB: 1200,
      baseRateP: 300,
      baseRateK: 1500,
      acceptedSampleActs: ['PK#', 'PSE#', 'PU#', 'PCV#', 'PP#'],
      status: 'active'
    };
    setEditForm(newIns);
    setIsAddingNew(true);
    setIsEditing(true);
  };

  const handleSaveForm = () => {
    if (!editForm || !editForm.name.trim()) {
      alert('Please provide an insurance company name.');
      return;
    }

    let updatedList: CameroonInsuranceProvider[];
    if (isAddingNew) {
      updatedList = [editForm, ...insurances];
    } else {
      updatedList = insurances.map(i => i.id === editForm.id ? editForm : i);
    }

    setInsurances(updatedList);
    setSelectedInsurance(editForm);
    setIsEditing(false);
    setIsAddingNew(false);
    setEditForm(null);

    try {
      localStorage.setItem('nanoLabs_custom_insurances', JSON.stringify(updatedList));
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } catch (e) {
      console.error('Error saving insurance data:', e);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all insurance companies and COTE base rates to standard Cameroon tariffs?')) {
      setInsurances(CAMEROON_INSURANCE_PROVIDERS);
      setSelectedInsurance(CAMEROON_INSURANCE_PROVIDERS[0]);
      setIsEditing(false);
      setIsAddingNew(false);
      localStorage.removeItem('nanoLabs_custom_insurances');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Cameroon Insurance Companies & COTE Pricing Engine
              </h2>
              <p className="text-xs text-slate-500">
                Configure insurance partners, base coefficient values (B, KB, P, K rates), coverage percentage splits, and billing rules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standards</span>
          </button>
          <button
            type="button"
            onClick={handleStartAddNew}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Insurance Partner</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Insurance rules & COTE coefficient values saved successfully!</span>
        </div>
      )}

      {/* Main Grid: Left Partner Directory & Right Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Insurance List (4 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by insurer name, code, NIU, city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="space-y-2 max-h-[64vh] overflow-y-auto pr-1">
            {filteredInsurances.map(ins => {
              const isSelected = selectedInsurance?.id === ins.id;
              return (
                <div
                  key={ins.id}
                  onClick={() => handleSelectInsurance(ins)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                        {ins.shortName || ins.name.substring(0, 4)}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{ins.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{ins.address}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
                      <span>B: {ins.baseRateB || 260} FCFA</span>
                      <span>•</span>
                      <span>Coverage: {ins.defaultCoveragePercent}%</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    ins.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ins.defaultCoveragePercent}% Insurer
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Insurance View & Editor (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {isEditing && editForm ? (
            /* EDIT FORM */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  {isAddingNew ? 'Add New Insurance Partner' : `Edit ${editForm.name}`}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setIsAddingNew(false); }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveForm}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Partner</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Company Name *
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g. ASCOMA CAMEROUN S.A."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Short Code / Acronym
                    </label>
                    <input
                      type="text"
                      value={editForm.shortName}
                      onChange={e => setEditForm({ ...editForm, shortName: e.target.value })}
                      placeholder="e.g. ASCOMA"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Insurance Category
                    </label>
                    <select
                      value={editForm.category}
                      onChange={e => setEditForm({ ...editForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="corporate_insurance">Corporate / Private Insurance</option>
                      <option value="state_fund">National Social Insurance (CNPS)</option>
                      <option value="mutual_health">Mutual Health Organization</option>
                      <option value="embassy_org">Diplomatic Mission / NGO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      N.I.U. (Numéro d'Identifiant Unique)
                    </label>
                    <input
                      type="text"
                      value={editForm.taxId || ''}
                      onChange={e => setEditForm({ ...editForm, taxId: e.target.value })}
                      placeholder="e.g. M025300001665C"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registre de Commerce (R.C.)
                    </label>
                    <input
                      type="text"
                      value={editForm.rcNumber || ''}
                      onChange={e => setEditForm({ ...editForm, rcNumber: e.target.value })}
                      placeholder="e.g. RC/DLA/1953/B/166"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Physical Address
                    </label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      B.P. / City
                    </label>
                    <input
                      type="text"
                      value={editForm.bp || ''}
                      onChange={e => setEditForm({ ...editForm, bp: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* COTE RATES SECTION */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    COTE Base Rates & Percentage Splits
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        B Rate (FCFA)
                      </label>
                      <input
                        type="number"
                        value={editForm.baseRateB || 260}
                        onChange={e => setEditForm({ ...editForm, baseRateB: Number(e.target.value) })}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                      />
                      <span className="text-[9px] text-slate-500">Standard test code</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        KB Rate (FCFA)
                      </label>
                      <input
                        type="number"
                        value={editForm.baseRateKB || 1200}
                        onChange={e => setEditForm({ ...editForm, baseRateKB: Number(e.target.value) })}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                      />
                      <span className="text-[9px] text-slate-500">Prélèvements</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        Coverage %
                      </label>
                      <input
                        type="number"
                        value={editForm.defaultCoveragePercent || 80}
                        onChange={e => {
                          const cov = Number(e.target.value);
                          setEditForm({ 
                            ...editForm, 
                            defaultCoveragePercent: cov,
                            defaultPatientCopayPercent: Math.max(0, 100 - cov)
                          });
                        }}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-indigo-700"
                      />
                      <span className="text-[9px] text-indigo-600 font-bold">Insurance split</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        Patient Co-Pay %
                      </label>
                      <input
                        type="number"
                        value={editForm.defaultPatientCopayPercent || 20}
                        onChange={e => {
                          const copay = Number(e.target.value);
                          setEditForm({ 
                            ...editForm, 
                            defaultPatientCopayPercent: copay,
                            defaultCoveragePercent: Math.max(0, 100 - copay)
                          });
                        }}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-emerald-700"
                      />
                      <span className="text-[9px] text-emerald-600 font-bold">Patient split</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedInsurance ? (
            /* VIEW DETAILS */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{selectedInsurance.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {selectedInsurance.shortName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedInsurance.address}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartEdit(selectedInsurance)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Parameters</span>
                </button>
              </div>

              {/* Grid of Key Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Base Unit B</div>
                  <div className="text-sm font-mono font-black text-slate-900">{selectedInsurance.baseRateB || 260} FCFA</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Base Unit KB</div>
                  <div className="text-sm font-mono font-black text-slate-900">{selectedInsurance.baseRateKB || 1200} FCFA</div>
                </div>

                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-950">
                  <div className="text-[10px] uppercase font-bold text-indigo-700">Insurance Split</div>
                  <div className="text-sm font-mono font-black text-indigo-800">{selectedInsurance.defaultCoveragePercent}%</div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Patient Co-Pay</div>
                  <div className="text-sm font-mono font-black text-emerald-800">{selectedInsurance.defaultPatientCopayPercent}%</div>
                </div>
              </div>

              {/* Fiscal Identification */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="text-[11px] font-black uppercase text-slate-600">Company Legal Identifiers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>N.I.U. (Fiscal ID): <strong className="font-mono">{selectedInsurance.taxId || 'M025300001665C'}</strong></div>
                  <div>R.C. Number: <strong className="font-mono">{selectedInsurance.rcNumber || 'RC/DLA/1953/B/166'}</strong></div>
                  <div>Phone: <strong className="font-mono">{selectedInsurance.phone}</strong></div>
                  <div>B.P.: <strong>{selectedInsurance.bp || 'B.P. 447 - YAOUNDE'}</strong></div>
                </div>
              </div>

              {/* Billable Collection Acts (Actes de Prélèvement) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center justify-between">
                  <span>Standard Actes de Prélèvement (Sample Collection Fees)</span>
                  <span className="text-[10px] font-normal text-slate-500 font-mono">Calculated on KB value</span>
                </h4>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2">Code & Act Designation</th>
                        <th className="p-2 text-center">COTE</th>
                        <th className="p-2 text-right">Tarif Total</th>
                        <th className="p-2 text-right text-indigo-800">80% Insurer</th>
                        <th className="p-2 text-right text-emerald-800">20% Patient</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                      {prelevementActs.map((act) => {
                        const kbRate = selectedInsurance.baseRateKB || 1200;
                        const totalPrice = Math.round(act.defaultCoefficient ?? 0 * (kbRate / 5) );
                        const insShare = Math.round(totalPrice * ((selectedInsurance.defaultCoveragePercent || 80) / 100));
                        const patShare = totalPrice - insShare;

                        return (
                          <tr key={act.code}>
                            <td className="p-2 font-bold text-slate-900">{act.code} {act.name}</td>
                            <td className="p-2 text-center font-mono font-bold text-slate-700">{act.cote}</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">{totalPrice.toLocaleString()} FCFA</td>
                            <td className="p-2 text-right font-mono font-bold text-indigo-900">{insShare.toLocaleString()} FCFA</td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-900">{patShare.toLocaleString()} FCFA</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};

export default InsuranceRatesManager;
