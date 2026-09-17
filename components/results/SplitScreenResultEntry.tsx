import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Save, 
  Lock, 
  Columns, 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RefreshCw, 
  Printer, 
  ChevronRight,
  Layers,
  FileSpreadsheet,
  Settings
} from 'lucide-react';
import { ExamTemplate, TemplateSection, TemplateParameter, PatientExamResult } from '../../types/examTemplate';
import { examTemplateService, STANDARD_EXAM_TEMPLATES } from '../../services/examTemplateService';

interface SplitScreenResultEntryProps {
  bookingId: string;
  patientId: string;
  patientName?: string;
  examCode: string;
  testName: string;
  category?: string;
  onSaveAndLock: (result: PatientExamResult) => void;
  onPrintPreview?: (result: PatientExamResult, template: ExamTemplate) => void;
  onClose?: () => void;
}

export const SplitScreenResultEntry: React.FC<SplitScreenResultEntryProps> = ({
  bookingId,
  patientId,
  patientName,
  examCode,
  testName,
  category = 'Clinical Biology',
  onSaveAndLock,
  onPrintPreview,
  onClose
}) => {
  const [template, setTemplate] = useState<ExamTemplate | null>(null);
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({});
  const [technicianNotes, setTechnicianNotes] = useState<string>('');
  const [clinicalInterpretation, setClinicalInterpretation] = useState<string>('');
  const [autoSavedRows, setAutoSavedRows] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isBuilderMode, setIsBuilderMode] = useState(false);

  // New section/parameter builder state if no template or customized
  const [customSections, setCustomSections] = useState<TemplateSection[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [quickNewSectionTitle, setQuickNewSectionTitle] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const autoSaveTimeoutRef = useRef<any>(null);

  // 1. Initialize template & auto-populate "Normal / Healthy" defaults
  useEffect(() => {
    let isMounted = true;

    async function loadTemplateAndExistingResults() {
      const code = examCode || testName || 'PV_EXAM';
      let found = await examTemplateService.getTemplateByExamCode(code);

      // If still not found, try by testName keywords
      if (!found) {
        const lowerName = (testName || '').toLowerCase();
        if (lowerName.includes('vagin') || lowerName.includes('pv') || lowerName.includes('frottis')) {
          found = await examTemplateService.getTemplateByExamCode('PV_EXAM');
        } else if (lowerName.includes('urin') || lowerName.includes('ecbu')) {
          found = await examTemplateService.getTemplateByExamCode('ECBU');
        } else if (lowerName.includes('selle') || lowerName.includes('copro') || lowerName.includes('parasit')) {
          found = await examTemplateService.getTemplateByExamCode('COPRO');
        } else if (lowerName.includes('nfs') || lowerName.includes('h\u00e9mo') || lowerName.includes('sang')) {
          found = await examTemplateService.getTemplateByExamCode('NFS');
        }
      }

      if (!isMounted) return;

      if (found) {
        setTemplate(found);
        setCustomSections(found.sections);

        // Check for existing saved draft result
        const savedDraft = await examTemplateService.getPatientResult(bookingId, found.examCode);
        
        // Auto-populate values: priority to saved draft, otherwise healthy template defaults!
        const initialVals: Record<string, string> = {};
        found.sections.forEach(sec => {
          sec.parameters.forEach(param => {
            if (savedDraft?.parameterValues?.[param.parameterId] !== undefined) {
              initialVals[param.parameterId] = savedDraft.parameterValues[param.parameterId];
            } else {
              // Pre-populate with Normal / Healthy default text from template definition
              initialVals[param.parameterId] = param.defaultValue || '';
            }
          });
        });

        setParameterValues(initialVals);
        if (savedDraft?.technicianNotes) setTechnicianNotes(savedDraft.technicianNotes);
        if (savedDraft?.clinicalInterpretation) setClinicalInterpretation(savedDraft.clinicalInterpretation);
      } else {
        // No template exists yet -> open minimal grid builder
        setIsBuilderMode(true);
        const blankTemplate: ExamTemplate = {
          templateId: `tpl-${(examCode || 'EXAM').toLowerCase()}`,
          examCode: examCode || 'CUSTOM_EXAM',
          title: testName || 'Clinical Examination Report',
          category: category || 'Diagnostic Biology',
          sections: [
            {
              sectionId: 'sec-1',
              sectionTitle: 'EXAMEN CLINIQUE ET BIOLOGIQUE',
              parameters: [
                {
                  parameterId: 'param-1',
                  label: 'Aspect / Contexte',
                  inputType: 'DROPDOWN',
                  options: ['Normal', 'Particulier', 'Pathologique'],
                  defaultValue: 'Normal'
                },
                {
                  parameterId: 'param-2',
                  label: 'Résultat Observation',
                  inputType: 'FREE_TEXT',
                  defaultValue: 'Négatif / Absence d anomalie décelable.'
                }
              ]
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTemplate(blankTemplate);
        setCustomSections(blankTemplate.sections);
        const initVals: Record<string, string> = {
          'param-1': 'Normal',
          'param-2': 'Négatif / Absence d anomalie décelable.'
        };
        setParameterValues(initVals);
      }
    }

    loadTemplateAndExistingResults();

    return () => {
      isMounted = false;
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [bookingId, examCode, testName]);

  // 2. Debounced Auto-Save Mechanism
  const triggerAutoSave = (updatedVals: Record<string, string>, paramId?: string) => {
    if (paramId) {
      setAutoSavedRows(prev => ({ ...prev, [paramId]: false }));
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!template) return;
      setIsSaving(true);
      const payload: PatientExamResult = {
        resultId: `res-${bookingId}-${template.examCode}`,
        bookingId,
        patientId,
        patientName,
        examCode: template.examCode,
        templateId: template.templateId,
        parameterValues: updatedVals,
        clinicalInterpretation,
        technicianNotes,
        status: 'DRAFT',
        timestamp: new Date().toISOString()
      };

      await examTemplateService.savePatientResult(payload);
      setIsSaving(false);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (paramId) {
        setAutoSavedRows(prev => ({ ...prev, [paramId]: true }));
      }
    }, 600);
  };

  const handleValueChange = (paramId: string, value: string) => {
    const updated = { ...parameterValues, [paramId]: value };
    setParameterValues(updated);
    triggerAutoSave(updated, paramId);
  };

  // Submit and Lock Results for Biologist Approval
  const handleSubmitAndLock = async () => {
    if (!template) return;
    setIsSaving(true);
    const payload: PatientExamResult = {
      resultId: `res-${bookingId}-${template.examCode}`,
      bookingId,
      patientId,
      patientName,
      examCode: template.examCode,
      templateId: template.templateId,
      parameterValues,
      clinicalInterpretation,
      technicianNotes,
      status: 'VERIFIED',
      timestamp: new Date().toISOString()
    };

    await examTemplateService.savePatientResult(payload);
    setIsSaving(false);
    onSaveAndLock(payload);
  };

  // Save new custom template
  const handleSaveCustomTemplate = async () => {
    if (!template) return;
    const updatedTemplate: ExamTemplate = {
      ...template,
      sections: customSections,
      updatedAt: new Date().toISOString()
    };
    await examTemplateService.saveTemplate(updatedTemplate);
    setTemplate(updatedTemplate);
    setIsBuilderMode(false);
  };

  // Builder Mode: Add Section
  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSec: TemplateSection = {
      sectionId: `sec-${Date.now()}`,
      sectionTitle: newSectionTitle.trim().toUpperCase(),
      parameters: [
        {
          parameterId: `param-${Date.now()}-1`,
          label: 'Paramètre',
          inputType: 'FREE_TEXT',
          defaultValue: 'Normal'
        }
      ]
    };
    const updated = [...customSections, newSec];
    setCustomSections(updated);
    setNewSectionTitle('');
    if (template) {
      setTemplate({
        ...template,
        sections: updated,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Builder Mode: Delete Section
  const handleDeleteSectionInBuilder = (sectionIndex: number) => {
    const secToDelete = customSections[sectionIndex];
    if (!secToDelete) return;
    const updated = customSections.filter((_, idx) => idx !== sectionIndex);
    setCustomSections(updated);
    if (template) {
      setTemplate({
        ...template,
        sections: updated,
        updatedAt: new Date().toISOString()
      });
    }
    const updatedVals = { ...parameterValues };
    secToDelete.parameters.forEach(p => {
      delete updatedVals[p.parameterId];
    });
    setParameterValues(updatedVals);
    setFeedbackBanner(`🗑️ Section "${secToDelete.sectionTitle}" deleted from template.`);
    setTimeout(() => setFeedbackBanner(null), 3000);
  };

  // Builder Mode: Add Parameter
  const handleAddParameterToSection = (sectionIndex: number) => {
    const updated = [...customSections];
    const newParam: TemplateParameter = {
      parameterId: `param-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: 'Nouveau Paramètre',
      inputType: 'DROPDOWN',
      options: ['Normal', 'Positif', 'Absence', 'Nombreux'],
      defaultValue: 'Normal'
    };
    updated[sectionIndex].parameters.push(newParam);
    setCustomSections(updated);
    if (template) {
      setTemplate({
        ...template,
        sections: updated,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Builder Mode: Delete Parameter
  const handleDeleteParameterInBuilder = (sectionIndex: number, paramIndex: number) => {
    const sec = customSections[sectionIndex];
    if (!sec) return;
    const paramToDelete = sec.parameters[paramIndex];
    const updatedParams = sec.parameters.filter((_, pIdx) => pIdx !== paramIndex);
    const updated = [...customSections];
    updated[sectionIndex] = {
      ...sec,
      parameters: updatedParams
    };
    setCustomSections(updated);
    if (template) {
      setTemplate({
        ...template,
        sections: updated,
        updatedAt: new Date().toISOString()
      });
    }
    if (paramToDelete) {
      const updatedVals = { ...parameterValues };
      delete updatedVals[paramToDelete.parameterId];
      setParameterValues(updatedVals);
    }
  };

  // Live Filing Mode: Quick Add Section
  const handleQuickAddSectionWhileFiling = () => {
    if (!template || !quickNewSectionTitle.trim()) return;
    const title = quickNewSectionTitle.trim().toUpperCase();
    const newSecId = `sec-${Date.now()}`;
    const newParamId = `param-${Date.now()}-1`;
    const newSec: TemplateSection = {
      sectionId: newSecId,
      sectionTitle: title,
      parameters: [
        {
          parameterId: newParamId,
          label: 'Observation / Analyte',
          inputType: 'FREE_TEXT',
          defaultValue: 'Normal / Absence d anomalie'
        }
      ]
    };

    const updatedSections = [...template.sections, newSec];
    const updatedTemplate: ExamTemplate = {
      ...template,
      sections: updatedSections,
      updatedAt: new Date().toISOString()
    };

    setTemplate(updatedTemplate);
    setCustomSections(updatedSections);
    setQuickNewSectionTitle('');

    const updatedVals = {
      ...parameterValues,
      [newParamId]: 'Normal / Absence d anomalie'
    };
    setParameterValues(updatedVals);
    triggerAutoSave(updatedVals, newParamId);
    setFeedbackBanner(`✅ Section "${title}" added to examination sheet.`);
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  // Live Filing Mode: Delete Section
  const handleDeleteSectionWhileFiling = (sectionId: string, sectionTitle: string) => {
    if (!template) return;
    const secToDelete = template.sections.find(s => s.sectionId === sectionId);
    if (!secToDelete) return;

    const updatedSections = template.sections.filter(s => s.sectionId !== sectionId);
    const updatedTemplate: ExamTemplate = {
      ...template,
      sections: updatedSections,
      updatedAt: new Date().toISOString()
    };

    setTemplate(updatedTemplate);
    setCustomSections(updatedSections);

    const updatedVals = { ...parameterValues };
    secToDelete.parameters.forEach(p => {
      delete updatedVals[p.parameterId];
    });
    setParameterValues(updatedVals);
    triggerAutoSave(updatedVals);
    setFeedbackBanner(`🗑️ Section "${sectionTitle}" and its ${secToDelete.parameters.length} parameter(s) removed.`);
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  // Live Filing Mode: Add Parameter / Observation Field
  const handleAddParameterWhileFiling = (sectionId: string) => {
    if (!template) return;
    const newParamId = `param-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newParam: TemplateParameter = {
      parameterId: newParamId,
      label: 'Nouvelle Observation',
      inputType: 'FREE_TEXT',
      defaultValue: 'Normal'
    };

    const updatedSections = template.sections.map(s => {
      if (s.sectionId === sectionId) {
        return {
          ...s,
          parameters: [...s.parameters, newParam]
        };
      }
      return s;
    });

    const updatedTemplate: ExamTemplate = {
      ...template,
      sections: updatedSections,
      updatedAt: new Date().toISOString()
    };

    setTemplate(updatedTemplate);
    setCustomSections(updatedSections);

    const updatedVals = {
      ...parameterValues,
      [newParamId]: 'Normal'
    };
    setParameterValues(updatedVals);
    triggerAutoSave(updatedVals, newParamId);
  };

  // Live Filing Mode: Delete Parameter Field
  const handleDeleteParameterWhileFiling = (sectionId: string, paramId: string) => {
    if (!template) return;
    const updatedSections = template.sections.map(s => {
      if (s.sectionId === sectionId) {
        return {
          ...s,
          parameters: s.parameters.filter(p => p.parameterId !== paramId)
        };
      }
      return s;
    });

    const updatedTemplate: ExamTemplate = {
      ...template,
      sections: updatedSections,
      updatedAt: new Date().toISOString()
    };

    setTemplate(updatedTemplate);
    setCustomSections(updatedSections);

    const updatedVals = { ...parameterValues };
    delete updatedVals[paramId];
    setParameterValues(updatedVals);
    triggerAutoSave(updatedVals);
  };

  if (!template) {
    return (
      <div className="p-8 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading Clinical Exam Template & Normal Values...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
      {/* Top Action Bar */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-teal-800/40">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
              Split-Screen Results Entry
            </span>
            <span className="font-mono text-xs font-bold text-teal-200">
              Exam Code: {template.examCode}
            </span>
            {isSaving ? (
              <span className="text-[10px] text-teal-300 flex items-center gap-1 font-mono">
                <RefreshCw className="w-3 h-3 animate-spin text-teal-400" />
                Auto-saving...
              </span>
            ) : lastSavedTime ? (
              <span className="text-[10px] text-emerald-300 flex items-center gap-1 font-mono">
                <Check className="w-3 h-3 text-emerald-400" />
                Auto-saved at {lastSavedTime}
              </span>
            ) : null}
          </div>
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
            {template.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBuilderMode(!isBuilderMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isBuilderMode
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isBuilderMode ? 'Back to Split View' : 'Customize Template'}</span>
          </button>

          {onPrintPreview && (
            <button
              type="button"
              onClick={() => onPrintPreview({
                resultId: `res-${bookingId}-${template.examCode}`,
                bookingId,
                patientId,
                patientName,
                examCode: template.examCode,
                templateId: template.templateId,
                parameterValues,
                clinicalInterpretation,
                technicianNotes,
                status: 'DRAFT',
                timestamp: new Date().toISOString()
              }, template)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Builder Mode Panel (If Admin / Tech wants to modify or construct template) */}
      {isBuilderMode ? (
        <div className="p-5 flex-1 overflow-y-auto space-y-6 bg-slate-50">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Template Grid Builder & Column Alignment Engine
            </p>
            <p>
              Define sections, parameter titles, input types (Dropdown, Toggle, Free Text, Numeric), and Normal/Healthy default values. Saved templates will automatically pre-populate future tests for exam code <strong>{template.examCode}</strong>.
            </p>
          </div>

          {/* Add Section */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. EXAMEN MACROSCOPIQUE, CULTURE & ANTIBIOGRAMME..."
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={handleAddSection}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
          </div>

          {/* Existing Sections & Parameters Builder List */}
          <div className="space-y-4">
            {customSections.map((sec, secIdx) => (
              <div key={sec.sectionId || secIdx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <h4 className="text-xs font-black uppercase text-teal-900 tracking-wider">
                      {sec.sectionTitle}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {sec.parameters.length} parameter{sec.parameters.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddParameterToSection(secIdx)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Parameter</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSectionInBuilder(secIdx)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title={`Delete Section "${sec.sectionTitle}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Section</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {sec.parameters.map((param, pIdx) => (
                    <div key={param.parameterId || pIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Label</label>
                        <input
                          type="text"
                          value={param.label}
                          onChange={(e) => {
                            const updated = [...customSections];
                            updated[secIdx].parameters[pIdx].label = e.target.value;
                            setCustomSections(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Type</label>
                        <select
                          value={param.inputType}
                          onChange={(e) => {
                            const updated = [...customSections];
                            updated[secIdx].parameters[pIdx].inputType = e.target.value as any;
                            setCustomSections(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          <option value="DROPDOWN">Dropdown</option>
                          <option value="TOGGLE">Toggle</option>
                          <option value="FREE_TEXT">Free Text</option>
                          <option value="NUMERIC">Numeric</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Default Healthy Value</label>
                        <input
                          type="text"
                          value={param.defaultValue || ''}
                          onChange={(e) => {
                            const updated = [...customSections];
                            updated[secIdx].parameters[pIdx].defaultValue = e.target.value;
                            setCustomSections(updated);
                          }}
                          placeholder="e.g. Normal / Blanchâtre"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Reference Range / Unit</label>
                        <input
                          type="text"
                          value={param.referenceRange || param.unit || ''}
                          onChange={(e) => {
                            const updated = [...customSections];
                            updated[secIdx].parameters[pIdx].referenceRange = e.target.value;
                            setCustomSections(updated);
                          }}
                          placeholder="e.g. Négatif or cells/mm3"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteParameterInBuilder(secIdx, pIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Parameter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsBuilderMode(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCustomTemplate}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Template for Exam Code {template.examCode}</span>
            </button>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* SCENARIO A: SPLIT-SCREEN EASY SIDE-BY-SIDE MODE          */
        /* ======================================================== */
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ====================================================== */}
          {/* LEFT SIDE: STATIC TEMPLATE REFERENCE & NORMAL VALUES   */}
          {/* ====================================================== */}
          <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 lg:sticky lg:top-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Columns className="w-4 h-4 text-teal-700" />
                  Template Outline & Reference Ranges
                </h3>
                <p className="text-[11px] text-slate-400">
                  Standard expected values for healthy patients (Non-editable Reference)
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Norms
              </span>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {template.sections.map((section) => (
                <div key={section.sectionId} className="space-y-2">
                  <div className="bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      {section.sectionTitle}
                    </span>
                  </div>

                  <div className="space-y-1.5 pl-1.5">
                    {section.parameters.map((param) => (
                      <div
                        key={param.parameterId}
                        className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">
                            {param.label}
                          </span>
                          {param.referenceRange && (
                            <span className="text-[10px] font-mono text-teal-700 block">
                              Ref: {param.referenceRange}
                            </span>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                            {param.defaultValue || 'Normal'}
                          </span>
                          {param.unit && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {param.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-200 text-xs text-teal-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                Pre-Population Active
              </p>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                The input fields on the right are already pre-populated with standard healthy values. If the patient has normal findings, simply review and click "Submit and Lock Results".
              </p>
            </div>
          </div>

          {/* ====================================================== */}
          {/* RIGHT SIDE: DATA INPUT GRID & FORM CONTROLS            */}
          {/* ====================================================== */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-3xl border border-teal-200/80 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                  Patient Observation & Measurement Grid
                </h3>
                <p className="text-[11px] text-slate-500">
                  Input values allocate directly to their defined parameters (No arbitrary dumping)
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Grid</span>
              </div>
            </div>

            {/* Real-time Notification / Action Feedback Banner */}
            {feedbackBanner && (
              <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in shadow-2xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{feedbackBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackBanner(null)}
                  className="text-teal-700 hover:text-teal-950 p-1 rounded-md cursor-pointer"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Quick Section Addition Bar when filing the test */}
            <div className="bg-gradient-to-r from-teal-50/90 to-slate-50 p-3.5 rounded-2xl border border-teal-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-teal-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <Layers className="w-3.5 h-3.5 text-teal-700" />
                  <span>Dynamic Section Manager</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Add or delete observation sections on the fly
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New section title, e.g. BACTERIOLOGIE, EXAMEN DIRECT, OBSERVATIONS..."
                  value={quickNewSectionTitle}
                  onChange={(e) => setQuickNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickAddSectionWhileFiling();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                />
                <button
                  type="button"
                  onClick={handleQuickAddSectionWhileFiling}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              </div>
            </div>

            {/* Input Sections */}
            <div className="space-y-6">
              {template.sections.map((section) => (
                <div key={section.sectionId} className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        {section.sectionTitle}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {section.parameters.length} parameter{section.parameters.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddParameterWhileFiling(section.sectionId)}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Add Parameter to this Section"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Field</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSectionWhileFiling(section.sectionId, section.sectionTitle)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title={`Delete section "${section.sectionTitle}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Section</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {section.parameters.map((param) => {
                      const currentValue = parameterValues[param.parameterId] ?? param.defaultValue ?? '';
                      const isRowSaved = autoSavedRows[param.parameterId];

                      return (
                        <div
                          key={param.parameterId}
                          className="p-3 bg-slate-50/80 hover:bg-teal-50/30 border border-slate-200 rounded-2xl transition-colors space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{param.label}</span>
                              {param.unit && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({param.unit})
                                </span>
                              )}
                            </label>

                            {/* Auto-save visual indicator & Delete Row button */}
                            <div className="flex items-center gap-1.5">
                              {isRowSaved && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> Saved
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteParameterWhileFiling(section.sectionId, param.parameterId)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete this observation parameter"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Control Rendering based on inputType */}
                          {param.inputType === 'DROPDOWN' && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <select
                                value={currentValue}
                                onChange={(e) => handleValueChange(param.parameterId, e.target.value)}
                                className="w-full sm:w-auto flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                              >
                                {param.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>

                              {/* Quick selection chips for frequent options */}
                              <div className="flex items-center gap-1 flex-wrap pt-1 sm:pt-0">
                                {param.options?.slice(0, 3).map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleValueChange(param.parameterId, opt)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      currentValue === opt
                                        ? 'bg-teal-700 text-white shadow-2xs'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {param.inputType === 'TOGGLE' && (
                            <div className="flex items-center gap-2">
                              {(param.options || ['Négatif', 'Positif']).map((opt) => {
                                const isChosen = currentValue === opt;
                                const isAbnormal = opt.toLowerCase().includes('positif') || opt.toLowerCase().includes('présence');

                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleValueChange(param.parameterId, opt)}
                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                                      isChosen
                                        ? isAbnormal
                                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                          : 'bg-teal-700 text-white border-teal-800 shadow-xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {isChosen && <Check className="w-3.5 h-3.5" />}
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {param.inputType === 'NUMERIC' && (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={currentValue}
                                onChange={(e) => handleValueChange(param.parameterId, e.target.value)}
                                placeholder={`e.g. ${param.defaultValue || '0'}`}
                                className="w-full sm:w-48 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                              />
                              {param.unit && (
                                <span className="text-xs text-slate-500 font-bold">
                                  {param.unit}
                                </span>
                              )}
                              {param.referenceRange && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  (Standard: {param.referenceRange})
                                </span>
                              )}
                            </div>
                          )}

                          {param.inputType === 'FREE_TEXT' && (
                            <textarea
                              rows={2}
                              value={currentValue}
                              onChange={(e) => handleValueChange(param.parameterId, e.target.value)}
                              placeholder={`Enter findings for ${param.label}...`}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs leading-relaxed"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* General Biologist Notes / Clinical Interpretation (Separate from defined parameter allocations) */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Observations Complémentaires & Notes Techniques
                </label>
                <textarea
                  rows={2}
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="Notes techniques complémentaires (ex: échantillon limpide, réactif lot validé, etc.)..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Conclusion / Interprétation Biologique
                </label>
                <textarea
                  rows={2}
                  value={clinicalInterpretation}
                  onChange={(e) => setClinicalInterpretation(e.target.value)}
                  placeholder="Conclusion synthétique pour le médecin traitant (ex: Absence de signe biologique de vaginose bactérienne ou mycose)..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* ONE-CLICK LOCK & SUBMIT BUTTON (PRIMARY REQUIREMENT) */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <span>Routing directly to Biologist / Validation Queue upon submit</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSubmitAndLock}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 uppercase tracking-wider"
                >
                  <Lock className="w-4 h-4" />
                  <span>Submit and Lock Results for Approval</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitScreenResultEntry;
