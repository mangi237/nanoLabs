import React, { useState, useEffect } from 'react';
import { 
  FileCode2, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Save, 
  BookOpen, 
  Sparkles, 
  Layers, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Code
} from 'lucide-react';

export interface ParameterTemplateItem {
  id: string;
  name: string;
  unit: string;
  refRange: string;
  defaultValue?: string;
  flagRule?: string; // e.g. "Low if < 12, High if > 16"
}

export interface CustomResultTemplate {
  id: string;
  title: string;
  category: string;
  specimenType: string;
  methodology: string;
  notes?: string;
  parameters: ParameterTemplateItem[];
}

export const DEFAULT_TEMPLATES: CustomResultTemplate[] = [
  {
    id: 'tpl-nfs',
    title: 'Complete Blood Count (NFS / Hémogramme)',
    category: 'Hematology',
    specimenType: 'Whole Blood (EDTA)',
    methodology: 'Automated Cell Counter / Flow Cytometry',
    notes: 'Reference values standardized according to WHO guidelines for Central Africa.',
    parameters: [
      { id: 'p-1', name: 'White Blood Cells (WBC / Leucocytes)', unit: 'x10^9/L', refRange: '4.0 - 11.0', defaultValue: '6.5' },
      { id: 'p-2', name: 'Red Blood Cells (RBC / Hématies)', unit: 'x10^12/L', refRange: '4.2 - 5.8', defaultValue: '4.8' },
      { id: 'p-3', name: 'Hemoglobin (HGB / Hémoglobine)', unit: 'g/dL', refRange: '12.0 - 17.5', defaultValue: '14.2' },
      { id: 'p-4', name: 'Hematocrit (HCT / Hématocrite)', unit: '%', refRange: '37.0 - 52.0', defaultValue: '42.0' },
      { id: 'p-5', name: 'Platelets (PLT / Plaquettes)', unit: 'x10^9/L', refRange: '150 - 450', defaultValue: '240' }
    ]
  },
  {
    id: 'tpl-glyc',
    title: 'Fasting Blood Glucose (Glycémie à Jeun)',
    category: 'Biochemistry',
    specimenType: 'Fluoride Plasma / Serum',
    methodology: 'Hexokinase / Glucose Oxidase Photometry',
    notes: 'Patient confirmed fasting for >= 8 hours prior to phlebotomy.',
    parameters: [
      { id: 'p-1', name: 'Fasting Glucose (Glycémie à Jeun)', unit: 'g/L', refRange: '0.70 - 1.10', defaultValue: '0.88' },
      { id: 'p-2', name: 'Standard Unit Conversion', unit: 'mmol/L', refRange: '3.9 - 6.1', defaultValue: '4.88' }
    ]
  },
  {
    id: 'tpl-widal',
    title: 'Widal & Felix Serodiagnosis (Typhoid)',
    category: 'Serology / Immunology',
    specimenType: 'Clotted Serum',
    methodology: 'Direct Slide & Tube Agglutination',
    notes: 'Titers >= 1:80 significant for acute salmonellosis infection in endemic regions.',
    parameters: [
      { id: 'p-1', name: 'Salmonella typhi O antigen (TO)', unit: 'Titer', refRange: 'Negative (< 1:80)', defaultValue: '1:40 (Negative)' },
      { id: 'p-2', name: 'Salmonella typhi H antigen (TH)', unit: 'Titer', refRange: 'Negative (< 1:80)', defaultValue: '1:40 (Negative)' },
      { id: 'p-3', name: 'Salmonella paratyphi AO', unit: 'Titer', refRange: 'Negative (< 1:80)', defaultValue: 'Negative' },
      { id: 'p-4', name: 'Salmonella paratyphi BO', unit: 'Titer', refRange: 'Negative (< 1:80)', defaultValue: 'Negative' }
    ]
  },
  {
    id: 'tpl-lipid',
    title: 'Comprehensive Lipid Panel (Bilan Lipidique)',
    category: 'Biochemistry',
    specimenType: 'Serum (Lithium Heparin)',
    methodology: 'Enzymatic Colorimetric Spectrophotometry',
    notes: '12-hour fasting specimen.',
    parameters: [
      { id: 'p-1', name: 'Total Cholesterol (Cholestérol Total)', unit: 'g/L', refRange: '1.50 - 2.00', defaultValue: '1.75' },
      { id: 'p-2', name: 'HDL Cholesterol (Bon Cholestérol)', unit: 'g/L', refRange: '> 0.40', defaultValue: '0.55' },
      { id: 'p-3', name: 'LDL Cholesterol (Calculated Friedewald)', unit: 'g/L', refRange: '< 1.30', defaultValue: '0.98' },
      { id: 'p-4', name: 'Triglycerides', unit: 'g/L', refRange: '< 1.50', defaultValue: '1.10' }
    ]
  }
];

interface ResultTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate?: (template: CustomResultTemplate) => void;
}

export const ResultTemplateEditorModal: React.FC<ResultTemplateEditorModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate
}) => {
  const [templates, setTemplates] = useState<CustomResultTemplate[]>(() => {
    const saved = localStorage.getItem('nanolabs_custom_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_TEMPLATES;
      }
    }
    return DEFAULT_TEMPLATES;
  });

  const [activeTemplate, setActiveTemplate] = useState<CustomResultTemplate>(templates[0] || DEFAULT_TEMPLATES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [rawTextPaste, setRawTextPaste] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Save changes to localStorage
  const saveAllTemplates = (updatedList: CustomResultTemplate[]) => {
    setTemplates(updatedList);
    localStorage.setItem('nanolabs_custom_templates', JSON.stringify(updatedList));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleUpdateActiveField = (field: keyof CustomResultTemplate, val: any) => {
    const updated = { ...activeTemplate, [field]: val };
    setActiveTemplate(updated);
    const list = templates.map(t => t.id === updated.id ? updated : t);
    saveAllTemplates(list);
  };

  const handleAddParameter = () => {
    const newParam: ParameterTemplateItem = {
      id: `p-${Date.now()}`,
      name: 'New Test Parameter',
      unit: 'U/L',
      refRange: '0 - 100',
      defaultValue: ''
    };
    const updated = {
      ...activeTemplate,
      parameters: [...activeTemplate.parameters, newParam]
    };
    setActiveTemplate(updated);
    const list = templates.map(t => t.id === updated.id ? updated : t);
    saveAllTemplates(list);
  };

  const handleUpdateParameter = (paramId: string, field: keyof ParameterTemplateItem, val: string) => {
    const updatedParams = activeTemplate.parameters.map(p => 
      p.id === paramId ? { ...p, [field]: val } : p
    );
    const updated = { ...activeTemplate, parameters: updatedParams };
    setActiveTemplate(updated);
    const list = templates.map(t => t.id === updated.id ? updated : t);
    saveAllTemplates(list);
  };

  const handleDeleteParameter = (paramId: string) => {
    const updatedParams = activeTemplate.parameters.filter(p => p.id !== paramId);
    const updated = { ...activeTemplate, parameters: updatedParams };
    setActiveTemplate(updated);
    const list = templates.map(t => t.id === updated.id ? updated : t);
    saveAllTemplates(list);
  };

  const handleCreateNewTemplate = () => {
    const newTpl: CustomResultTemplate = {
      id: `tpl-${Date.now()}`,
      title: 'Custom Laboratory Template',
      category: 'General Clinical Bench',
      specimenType: 'Venous Blood / Serum',
      methodology: 'Standard Automated Spectrophotometry',
      notes: 'Calibrated using ISO 15189 reference controls.',
      parameters: [
        { id: `p-1`, name: 'Analyte Name', unit: 'mg/dL', refRange: '10 - 50', defaultValue: '' }
      ]
    };
    const list = [newTpl, ...templates];
    setActiveTemplate(newTpl);
    saveAllTemplates(list);
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      alert('Cannot delete the only remaining template.');
      return;
    }
    const filtered = templates.filter(t => t.id !== id);
    setTemplates(filtered);
    setActiveTemplate(filtered[0]);
    localStorage.setItem('nanolabs_custom_templates', JSON.stringify(filtered));
  };

  // Structured copy-paste parser:
  // Allows lab tech to paste tab-delimited or comma-separated lines:
  // "Hemoglobin\t12-16\tg/dL" or "Glucose, 0.70-1.10, g/L"
  const handleParsePastedParameters = () => {
    if (!rawTextPaste.trim()) return;
    const lines = rawTextPaste.split('\n').filter(l => l.trim().length > 0);
    const parsed: ParameterTemplateItem[] = [];

    lines.forEach((line, idx) => {
      // split by tabs or commas or pipe
      let parts = line.split('\t');
      if (parts.length === 1) parts = line.split(',');
      if (parts.length === 1) parts = line.split('|');

      const name = parts[0]?.trim() || `Parameter ${idx + 1}`;
      const refRange = parts[1]?.trim() || 'Normal';
      const unit = parts[2]?.trim() || '-';
      const defaultValue = parts[3]?.trim() || '';

      parsed.push({
        id: `p-pasted-${Date.now()}-${idx}`,
        name,
        refRange,
        unit,
        defaultValue
      });
    });

    if (parsed.length > 0) {
      const updated = {
        ...activeTemplate,
        parameters: [...activeTemplate.parameters, ...parsed]
      };
      setActiveTemplate(updated);
      const list = templates.map(t => t.id === updated.id ? updated : t);
      saveAllTemplates(list);
      setRawTextPaste('');
      setPasteModalOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full p-6 space-y-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Lab Tech Result Template Editor
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800 border border-teal-300">
                  ISO 15189 Grid
                </span>
                {saveSuccess && (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 animate-fade-in">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Create, customize, and load standardized result templates for rapid, error-free clinical data entry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewTemplate}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left sidebar (template selector) + Right main (grid editor) */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
          {/* Template Selector Sidebar */}
          <div className="w-full md:w-64 shrink-0 flex flex-col border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2 overflow-y-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Available Templates ({templates.length})
            </span>
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {templates.map(tpl => {
                const isSelected = tpl.id === activeTemplate.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setActiveTemplate(tpl)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 font-bold text-teal-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{tpl.title}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{tpl.category}</div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Grid Editor */}
          <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl p-4 bg-white space-y-4 overflow-y-auto">
            {/* Metadata inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Template Title *
                </label>
                <input
                  type="text"
                  value={activeTemplate.title}
                  onChange={e => handleUpdateActiveField('title', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Laboratory Discipline / Category
                </label>
                <input
                  type="text"
                  value={activeTemplate.category}
                  onChange={e => handleUpdateActiveField('category', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Primary Specimen Type
                </label>
                <input
                  type="text"
                  value={activeTemplate.specimenType}
                  onChange={e => handleUpdateActiveField('specimenType', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Parameters Grid Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Structured Parameters ({activeTemplate.parameters.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPasteModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5 text-teal-600" />
                  <span>Paste Raw Grid</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddParameter}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1 cursor-pointer border border-teal-200"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>+ Add Row</span>
                </button>
              </div>
            </div>

            {/* Structured Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Analyte / Parameter Name</th>
                    <th className="py-2.5 px-3 w-28">Unit</th>
                    <th className="py-2.5 px-3 w-40">Reference Range</th>
                    <th className="py-2.5 px-3 w-32">Default Val</th>
                    <th className="py-2.5 px-2 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTemplate.parameters.map((param, idx) => (
                    <tr key={param.id} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={param.name}
                          onChange={e => handleUpdateParameter(param.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-teal-500 rounded text-xs font-semibold text-slate-900"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={param.unit}
                          onChange={e => handleUpdateParameter(param.id, 'unit', e.target.value)}
                          className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-teal-500 rounded text-xs text-slate-700 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={param.refRange}
                          onChange={e => handleUpdateParameter(param.id, 'refRange', e.target.value)}
                          className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-teal-500 rounded text-xs text-slate-700"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={param.defaultValue || ''}
                          placeholder="Optional"
                          onChange={e => handleUpdateParameter(param.id, 'defaultValue', e.target.value)}
                          className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-teal-500 rounded text-xs text-slate-700"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteParameter(param.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Remove Parameter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Methodology & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Analytical Methodology / Instrumentation
                </label>
                <input
                  type="text"
                  value={activeTemplate.methodology}
                  onChange={e => handleUpdateActiveField('methodology', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Clinical Interpretation / Reference Notes
                </label>
                <input
                  type="text"
                  value={activeTemplate.notes || ''}
                  onChange={e => handleUpdateActiveField('notes', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleDeleteTemplate(activeTemplate.id)}
            className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Template</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
            {onApplyTemplate && (
              <button
                type="button"
                onClick={() => {
                  onApplyTemplate(activeTemplate);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply Template to Current Patient Result</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Paste Raw Grid Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Code className="w-4 h-4 text-teal-600" />
                <span>Paste Structured Laboratory Rows</span>
              </h4>
              <button
                onClick={() => setPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paste lines from Excel, LIMS, or Word tables. Columns can be tab-separated, comma-separated, or pipe-separated:
              <br />
              <code className="text-[11px] bg-slate-100 p-1 rounded font-mono block mt-1">
                Analyte Name [tab] Reference Range [tab] Unit [tab] Default Value
              </code>
            </p>

            <textarea
              rows={6}
              value={rawTextPaste}
              onChange={e => setRawTextPaste(e.target.value)}
              placeholder={`Hemoglobin\t12.0 - 17.5\tg/dL\t14.2\nWhite Blood Cells\t4.0 - 11.0\tx10^9/L\t6.5\nPlatelets\t150 - 450\tx10^9/L\t220`}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParsePastedParameters}
                disabled={!rawTextPaste.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Parse & Add to Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ResultTemplateEditorModal;
