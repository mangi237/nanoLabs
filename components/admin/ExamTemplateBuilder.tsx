import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  Columns, 
  Layers, 
  Sparkles, 
  Edit3, 
  Eye, 
  ArrowRight,
  HelpCircle,
  Copy,
  ChevronDown
} from 'lucide-react';
import { ExamTemplate, TemplateSection, TemplateParameter } from '../../types/examTemplate';
import { examTemplateService, STANDARD_EXAM_TEMPLATES } from '../../services/examTemplateService';

export const ExamTemplateBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<ExamTemplate[]>(STANDARD_EXAM_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(STANDARD_EXAM_TEMPLATES[0]?.templateId || '');
  const [activeTemplate, setActiveTemplate] = useState<ExamTemplate>(STANDARD_EXAM_TEMPLATES[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load custom templates if any
  useEffect(() => {
    async function loadAll() {
      const list = [...STANDARD_EXAM_TEMPLATES];
      // Check local storage for additional custom templates
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('exam_template_')) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '');
            if (parsed && parsed.examCode && !list.some(t => t.examCode === parsed.examCode)) {
              list.push(parsed);
            }
          } catch {}
        }
      }
      setTemplates(list);
    }
    loadAll();
  }, []);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = templates.find(t => t.templateId === id);
    if (found) {
      setActiveTemplate(JSON.parse(JSON.stringify(found)));
    }
  };

  const handleCreateNewTemplate = () => {
    const code = `CUSTOM_${Date.now().toString().slice(-4)}`;
    const newTpl: ExamTemplate = {
      templateId: `tpl-${code.toLowerCase()}`,
      examCode: code,
      title: 'New Clinical Examination Template',
      category: 'Diagnostic Biology',
      sections: [
        {
          sectionId: `sec-${Date.now()}`,
          sectionTitle: 'EXAMEN DIRECT ET ANALYSE',
          parameters: [
            {
              parameterId: `param-1`,
              label: 'Aspect',
              inputType: 'DROPDOWN',
              options: ['Normal', 'Particulier', 'Pathologique'],
              defaultValue: 'Normal'
            }
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTemplates([...templates, newTpl]);
    setSelectedTemplateId(newTpl.templateId);
    setActiveTemplate(newTpl);
  };

  const handleAddSection = () => {
    const newSec: TemplateSection = {
      sectionId: `sec-${Date.now()}`,
      sectionTitle: 'NOUVELLE SECTION CLINIQUE',
      parameters: [
        {
          parameterId: `param-${Date.now()}`,
          label: 'Paramètre 1',
          inputType: 'DROPDOWN',
          options: ['Normal', 'Positif', 'Absence'],
          defaultValue: 'Normal'
        }
      ]
    };
    setActiveTemplate({
      ...activeTemplate,
      sections: [...activeTemplate.sections, newSec]
    });
  };

  const handleAddParameter = (secIdx: number) => {
    const updated = { ...activeTemplate };
    const newParam: TemplateParameter = {
      parameterId: `param-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: 'Nouveau Paramètre',
      inputType: 'DROPDOWN',
      options: ['Normal / Claire', 'Trouble', 'Pathologique'],
      defaultValue: 'Normal / Claire'
    };
    updated.sections[secIdx].parameters.push(newParam);
    setActiveTemplate(updated);
  };

  const handleRemoveParameter = (secIdx: number, pIdx: number) => {
    const updated = { ...activeTemplate };
    updated.sections[secIdx].parameters.splice(pIdx, 1);
    setActiveTemplate(updated);
  };

  const handleRemoveSection = (secIdx: number) => {
    const updated = { ...activeTemplate };
    updated.sections.splice(secIdx, 1);
    setActiveTemplate(updated);
  };

  const handleSave = async () => {
    await examTemplateService.saveTemplate(activeTemplate);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-700 text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Split-Screen Examination Template Builder
              </h2>
              <p className="text-xs text-slate-500">
                Excel/Grid-style parameters with automatic Column Alignment Engine for A4 output
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNewTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-700" />
            <span>New Exam Template</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-900/10 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Template</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Template successfully saved and linked to Exam Code: {activeTemplate.examCode}</span>
        </div>
      )}

      {/* Select active template chip bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {templates.map(t => {
          const isSelected = t.templateId === selectedTemplateId;
          return (
            <button
              key={t.templateId}
              type="button"
              onClick={() => handleSelectTemplate(t.templateId)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{t.examCode}</span>
              <span className="text-[10px] opacity-80 truncate max-w-[120px]">{t.title}</span>
            </button>
          );
        })}
      </div>

      {/* Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT PANEL: EXCEL/GRID INPUT BUILDER                     */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Columns className="w-4 h-4 text-teal-700" />
                Left Panel: Excel / Grid Input Builder
              </h3>
              <p className="text-[11px] text-slate-500">
                Configure parameters, input types, smart dropdowns, and healthy defaults
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-lg border border-teal-200">
              Builder Active
            </span>
          </div>

          {/* Template Meta Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block">Exam Code (Linkage Key)</label>
              <input
                type="text"
                value={activeTemplate.examCode}
                onChange={(e) => setActiveTemplate({ ...activeTemplate, examCode: e.target.value.toUpperCase() })}
                placeholder="e.g. PV_EXAM"
                className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block">Category</label>
              <input
                type="text"
                value={activeTemplate.category}
                onChange={(e) => setActiveTemplate({ ...activeTemplate, category: e.target.value })}
                placeholder="e.g. Bacteriology & Cytology"
                className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-500 block">Full Examination Title</label>
              <input
                type="text"
                value={activeTemplate.title}
                onChange={(e) => setActiveTemplate({ ...activeTemplate, title: e.target.value })}
                placeholder="e.g. Prélèvement Vaginal (Examen Cyto-Bactériologique)"
                className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Section List Builder */}
          <div className="space-y-4">
            {activeTemplate.sections.map((section, sIdx) => (
              <div key={section.sectionId} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Section Title</label>
                    <input
                      type="text"
                      value={section.sectionTitle}
                      onChange={(e) => {
                        const updated = { ...activeTemplate };
                        updated.sections[sIdx].sectionTitle = e.target.value.toUpperCase();
                        setActiveTemplate(updated);
                      }}
                      className="w-full mt-0.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black uppercase text-teal-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSection(sIdx)}
                    className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer mt-3"
                    title="Delete Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Parameters inside this section */}
                <div className="space-y-2">
                  {section.parameters.map((param, pIdx) => (
                    <div key={param.parameterId} className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Parameter Label</label>
                          <input
                            type="text"
                            value={param.label}
                            onChange={(e) => {
                              const updated = { ...activeTemplate };
                              updated.sections[sIdx].parameters[pIdx].label = e.target.value;
                              setActiveTemplate(updated);
                            }}
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Input Type</label>
                          <select
                            value={param.inputType}
                            onChange={(e) => {
                              const updated = { ...activeTemplate };
                              updated.sections[sIdx].parameters[pIdx].inputType = e.target.value as any;
                              setActiveTemplate(updated);
                            }}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                          >
                            <option value="DROPDOWN">Dropdown</option>
                            <option value="TOGGLE">Toggle</option>
                            <option value="FREE_TEXT">Free Text</option>
                            <option value="NUMERIC">Numeric</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Default Healthy</label>
                          <input
                            type="text"
                            value={param.defaultValue || ''}
                            onChange={(e) => {
                              const updated = { ...activeTemplate };
                              updated.sections[sIdx].parameters[pIdx].defaultValue = e.target.value;
                              setActiveTemplate(updated);
                            }}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveParameter(sIdx, pIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer mt-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Options or reference range */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className="text-slate-400 font-bold">Options (comma separated)</label>
                          <input
                            type="text"
                            value={param.options?.join(', ') || ''}
                            onChange={(e) => {
                              const updated = { ...activeTemplate };
                              updated.sections[sIdx].parameters[pIdx].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              setActiveTemplate(updated);
                            }}
                            placeholder="e.g. Normal, Claire, Jaune"
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 font-bold">Ref Range / Unit</label>
                          <input
                            type="text"
                            value={param.referenceRange || param.unit || ''}
                            onChange={(e) => {
                              const updated = { ...activeTemplate };
                              updated.sections[sIdx].parameters[pIdx].referenceRange = e.target.value;
                              setActiveTemplate(updated);
                            }}
                            placeholder="e.g. < 10 / champ or g/dL"
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddParameter(sIdx)}
                    className="w-full py-2 bg-white hover:bg-teal-50 border border-dashed border-teal-300 rounded-xl text-xs font-bold text-teal-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Parameter to {section.sectionTitle}</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddSection}
              className="w-full py-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-2xl text-xs font-bold text-teal-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Section</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: COLUMN ALIGNMENT ENGINE (LIVE PREVIEW)      */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-700" />
                Right Panel: Column Alignment Engine (Live Preview)
              </h3>
              <p className="text-[11px] text-slate-500">
                Multi-column grid with dynamic leader dots and tabular alignment
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              A4 Sheet Layout Preview
            </span>
          </div>

          {/* Clean White Sheet Simulator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-inner font-sans space-y-4">
            <div className="border-b-2 border-teal-800 pb-2 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  {activeTemplate.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  Code: {activeTemplate.examCode} • Category: {activeTemplate.category}
                </p>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Official Report Structure
              </span>
            </div>

            {/* Render Sections with Dynamic Leader Dots */}
            <div className="space-y-4 text-xs">
              {activeTemplate.sections.map((sec) => (
                <div key={sec.sectionId} className="space-y-2">
                  <div className="bg-slate-100 px-3 py-1 rounded text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    {sec.sectionTitle}
                  </div>

                  <div className="space-y-1.5 pl-1">
                    {sec.parameters.map((param) => (
                      <div key={param.parameterId} className="flex items-baseline justify-between gap-2 text-xs py-0.5 border-b border-dotted border-slate-200">
                        <span className="font-semibold text-slate-800 shrink-0">
                          {param.label}
                        </span>

                        {/* Dynamic Leader Dots */}
                        <span className="flex-1 border-b border-dotted border-slate-300 mx-2 self-center opacity-60"></span>

                        <div className="text-right shrink-0 flex items-center gap-3">
                          <span className="font-bold text-teal-900 font-mono">
                            {param.defaultValue || '—'}
                          </span>
                          {param.referenceRange && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({param.referenceRange})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Biologist Footer */}
            <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
              <div>
                <span>Accredited Examination Protocol</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-700 block">Biologiste Médical Validateur</span>
                <span className="font-mono text-slate-400">[Reserved Stamp & Signature Zone]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTemplateBuilder;
