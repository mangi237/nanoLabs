import React, { useState } from 'react';
import { 
  X, 
  FlaskConical, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  DollarSign,
  Clock,
  Layers,
  HelpCircle,
  Database
} from 'lucide-react';
import { limsService } from '../../services/limsService';
import { MasterTestItem, TestSubParameter } from '../../data/masterTestsData';

interface CreateMasterTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  labId: string;
  onSuccess?: () => void;
}

export const CreateMasterTestModal: React.FC<CreateMasterTestModalProps> = ({
  isOpen,
  onClose,
  labId,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [testName, setTestName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<MasterTestItem['category']>('Hematology');
  const [sampleType, setSampleType] = useState('Whole Blood (EDTA Tube)');
  const [units, setUnits] = useState('mg/dL');
  const [refRangeMale, setRefRangeMale] = useState('');
  const [refRangeFemale, setRefRangeFemale] = useState('');
  const [refRangeChild, setRefRangeChild] = useState('');
  const [conditions, setConditions] = useState('');
  const [basePrice, setBasePrice] = useState('10000');
  const [turnaroundTime, setTurnaroundTime] = useState('2 hours');
  const [description, setDescription] = useState('');

  // Reagent requirements
  const [reagentName, setReagentName] = useState('');
  const [reagentQty, setReagentQty] = useState('1');
  const [reagentsList, setReagentsList] = useState<Array<{ reagentId: string; reagentName: string; quantityRequired: number }>>([]);

  // Sub-parameters for panel tests
  const [subParams, setSubParams] = useState<TestSubParameter[]>([]);
  const [subName, setSubName] = useState('');
  const [subUnit, setSubUnit] = useState('g/dL');
  const [subMale, setSubMale] = useState('');
  const [subFemale, setSubFemale] = useState('');
  const [subChild, setSubChild] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddReagent = () => {
    if (!reagentName.trim()) return;
    setReagentsList([
      ...reagentsList,
      {
        reagentId: `reag-${Date.now()}`,
        reagentName: reagentName.trim(),
        quantityRequired: parseFloat(reagentQty) || 1
      }
    ]);
    setReagentName('');
    setReagentQty('1');
  };

  const handleAddSubParam = () => {
    if (!subName.trim()) return;
    setSubParams([
      ...subParams,
      {
        id: `sp-${Date.now()}`,
        name: subName.trim(),
        unit: subUnit.trim(),
        refRangeMale: subMale.trim() || 'Normal',
        refRangeFemale: subFemale.trim() || 'Normal',
        refRangeChild: subChild.trim() || 'Normal'
      }
    ]);
    setSubName('');
    setSubMale('');
    setSubFemale('');
    setSubChild('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!testName.trim()) {
      setErrorMsg('Please enter a valid Test Name');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTest: MasterTestItem = {
        id: `custom-test-${Date.now()}`,
        code: code.trim() || `TST-${Math.floor(100 + Math.random() * 900)}`,
        name: testName.trim(),
        category,
        sampleType,
        units,
        refRangeMale: refRangeMale || 'Normal',
        refRangeFemale: refRangeFemale || 'Normal',
        refRangeChild: refRangeChild || 'Normal',
        conditions: conditions || 'No special preparation needed.',
        basePrice: parseFloat(basePrice) || 10000,
        turnaroundTime: turnaroundTime || '2 hours',
        description: description || 'Custom laboratory diagnostic test.',
        reagentsRequired: reagentsList,
        subParameters: subParams.length > 0 ? subParams : undefined
      };

      await limsService.saveMasterTestDefinition(labId, newTest);
      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save test definition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">
                Create Master Laboratory Test
              </h3>
              <p className="text-xs text-teal-300">
                Define biological reference ranges, sample matrices & required chemical reagents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Grid 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Test Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Glycated Hemoglobin (HbA1c)"
                value={testName}
                onChange={e => setTestName(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Test Code / Abbreviation</label>
              <input
                type="text"
                placeholder="e.g. HBA1C-01"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Hematology">Hematology</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Serology / Immunology">Serology / Immunology</option>
                <option value="Hormones & Tumor Markers">Hormones & Tumor Markers</option>
                <option value="Urinalysis & Parasitology">Urinalysis & Parasitology</option>
                <option value="Cytopathology & Fluids">Cytopathology & Fluids</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Required Sample Matrix</label>
              <input
                type="text"
                placeholder="e.g. Whole Blood (EDTA Tube)"
                value={sampleType}
                onChange={e => setSampleType(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Biological Reference Ranges (Male, Female, Child) */}
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3">
            <h4 className="font-bold text-teal-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Biological Reference Ranges & Units
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Measurement Unit</label>
                <input
                  type="text"
                  placeholder="e.g. mg/dL, g/dL, %"
                  value={units}
                  onChange={e => setUnits(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Male Ref Range</label>
                <input
                  type="text"
                  placeholder="e.g. 13.0 - 17.0"
                  value={refRangeMale}
                  onChange={e => setRefRangeMale(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Female Ref Range</label>
                <input
                  type="text"
                  placeholder="e.g. 12.0 - 15.5"
                  value={refRangeFemale}
                  onChange={e => setRefRangeFemale(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Child Ref Range</label>
                <input
                  type="text"
                  placeholder="e.g. 11.0 - 14.5"
                  value={refRangeChild}
                  onChange={e => setRefRangeChild(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* Reagents Required Section */}
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3">
            <h4 className="font-bold text-teal-300 uppercase tracking-wider text-[11px]">
              Required Chemical Reagents (Auto-Inventory Deduction)
            </h4>

            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="text"
                placeholder="Reagent Name (e.g. GOD-POD Glucose Reagent)"
                value={reagentName}
                onChange={e => setReagentName(e.target.value)}
                className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
              <input
                type="number"
                placeholder="Qty (mL/unit)"
                value={reagentQty}
                onChange={e => setReagentQty(e.target.value)}
                className="w-24 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
              <button
                type="button"
                onClick={handleAddReagent}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shrink-0 cursor-pointer"
              >
                + Add
              </button>
            </div>

            {reagentsList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {reagentsList.map((r, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-teal-950 border border-teal-500/40 text-teal-200 rounded-lg text-[11px] flex items-center gap-2">
                    {r.reagentName} ({r.quantityRequired} unit)
                    <button type="button" onClick={() => setReagentsList(reagentsList.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-300">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reasons for Withdrawal / Prep Conditions & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Base Price (XAF)</label>
              <input
                type="number"
                value={basePrice}
                onChange={e => setBasePrice(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Turnaround Time</label>
              <input
                type="text"
                placeholder="e.g. 2 hours"
                value={turnaroundTime}
                onChange={e => setTurnaroundTime(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Patient Prep / Withdrawal Rules</label>
              <input
                type="text"
                placeholder="e.g. 8 hours fasting required"
                value={conditions}
                onChange={e => setConditions(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Master Test'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
