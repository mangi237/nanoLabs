import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Check, 
  X, 
  Sparkles, 
  Layers, 
  Eye, 
  Save, 
  AlertCircle,
  Building2
} from 'lucide-react';
import { 
  ClinicalTemplate, 
  ClinicalParameter, 
  clinicalTemplatesService 
} from '../../data/clinicalTemplates';
import { useAuth } from '../../context/authContext';
import { useLabBranding } from '../../utils/labBranding';

interface ClinicalTemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: ClinicalTemplate) => void;
  initialTemplateToEdit?: ClinicalTemplate | null;
  startInCreateMode?: boolean;
}

export const ClinicalTemplateManagerModal: React.FC<ClinicalTemplateManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  initialTemplateToEdit,
  startInCreateMode = false
}) => {
  const { lab } = useAuth();
  const { logoUrl: brandLogo, headerUrl: brandHeader } = useLabBranding(lab);

  const rawLabName = lab?.name;
  const isMockName = rawLabName && (
    rawLabName.toLowerCase().includes('accredited medical') || 
    rawLabName.toLowerCase().includes('bla bla')
  );
  const activeLabName = (!isMockName && rawLabName) ? rawLabName : null;
  const activeLabAddress = lab?.address || null;
  const hasRealLabHeader = !!(activeLabName && activeLabAddress);

  const [templates, setTemplates] = useState<ClinicalTemplate[]>(() => clinicalTemplatesService.getAllTemplates());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingTemplate, setEditingTemplate] = useState<ClinicalTemplate | null>(() => {
    if (initialTemplateToEdit) {
      return JSON.parse(JSON.stringify(initialTemplateToEdit));
    }
    if (startInCreateMode) {
      return {
        id: `custom_${Date.now()}`,
        code: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        name: 'Nouveau Modèle Clinique',
        category: 'Biochemistry',
        specimen: 'Sérum / Sang total',
        turnaroundTime: '2 hours',
        defaultConclusion: 'Examen dans les limites physiologiques normales.',
        parameters: [
          { name: 'Paramètre 1', defaultValue: '0.00', unit: 'mg/dL', normalRange: '0.00 - 1.00' }
        ],
        html: `
<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; font-family: inherit;">
  <thead>
    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
      <th style="padding: 6px 10px;">PARAMÈTRE</th>
      <th style="padding: 6px 10px; text-align: center;">RÉSULTAT</th>
      <th style="padding: 6px 10px;">UNITÉ</th>
      <th style="padding: 6px 10px;">VALEURS DE RÉFÉRENCE</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px 10px; font-weight: 600;">Paramètre 1</td>
      <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #0f766e;">0.00</td>
      <td style="padding: 6px 10px;">mg/dL</td>
      <td style="padding: 6px 10px; color: #64748b;">0.00 - 1.00</td>
    </tr>
  </tbody>
</table>
<div style="margin-top: 14px; padding: 10px 14px; background-color: #f8fafc; border-left: 3px solid #0f766e; border-radius: 6px; font-size: 11px;">
  <strong>Conclusion Biologique :</strong> Examen dans les limites physiologiques normales.
</div>`
      };
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<'visual' | 'html' | 'preview'>(() => {
    return initialTemplateToEdit?.html && (!initialTemplateToEdit.parameters || initialTemplateToEdit.parameters.length === 0) ? 'html' : 'visual';
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTemplateToEdit) {
      setEditingTemplate(JSON.parse(JSON.stringify(initialTemplateToEdit)));
      setActiveTab(initialTemplateToEdit.html && (!initialTemplateToEdit.parameters || initialTemplateToEdit.parameters.length === 0) ? 'html' : 'visual');
    } else if (startInCreateMode && !editingTemplate) {
      handleCreateNew();
    }
  }, [initialTemplateToEdit, startInCreateMode]);

  if (!isOpen) return null;

  const categories = ['All', 'Hematology', 'Biochemistry', 'Serology', 'Microbiology', 'Parasitology', 'Endocrinology', 'Hemostasis', 'Cardiac'];

  const filtered = templates.filter(t => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specimen.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStartEdit = (tpl: ClinicalTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(tpl)));
    setActiveTab('visual');
  };

  const handleCreateNew = () => {
    const newTpl: ClinicalTemplate = {
      id: `custom_${Date.now()}`,
      code: `CUST-${templates.length + 1}`,
      name: 'Nouveau Modèle Clinique',
      category: 'Biochemistry',
      specimen: 'Sérum / Sang total',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Examen dans les limites physiologiques normales.',
      parameters: [
        { name: 'Paramètre 1', defaultValue: '0.00', unit: 'mg/dL', normalRange: '0.00 - 1.00' }
      ],
      html: `
<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; font-family: inherit;">
  <thead>
    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
      <th style="padding: 6px 10px;">PARAMÈTRE</th>
      <th style="padding: 6px 10px; text-align: center;">RÉSULTAT</th>
      <th style="padding: 6px 10px;">UNITÉ</th>
      <th style="padding: 6px 10px;">VALEURS DE RÉFÉRENCE</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px 10px; font-weight: 600;">Paramètre 1</td>
      <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #0f766e;">0.00</td>
      <td style="padding: 6px 10px;">mg/dL</td>
      <td style="padding: 6px 10px; color: #64748b;">0.00 - 1.00</td>
    </tr>
  </tbody>
</table>
<div style="margin-top: 14px; padding: 10px 14px; background-color: #f8fafc; border-left: 3px solid #0f766e; border-radius: 6px; font-size: 11px;">
  <strong>Conclusion Biologique :</strong> Examen dans les limites physiologiques normales.
</div>`
    };
    setEditingTemplate(newTpl);
    setActiveTab('visual');
  };

  const handleSaveEdit = () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name.trim()) {
      alert('Veuillez spécifier le nom du modèle.');
      return;
    }

    // Regenerate HTML from parameters if on visual tab
    let finalHtml = editingTemplate.html;
    if (activeTab === 'visual' && editingTemplate.parameters.length > 0) {
      const rows = editingTemplate.parameters.map(p => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px 10px; font-weight: 600;">${p.name}</td>
      <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #0f766e;">${p.defaultValue}</td>
      <td style="padding: 6px 10px;">${p.unit}</td>
      <td style="padding: 6px 10px; color: #64748b;">${p.normalRange}</td>
    </tr>`).join('');

      finalHtml = `
<div style="margin-bottom: 8px; font-size: 13px; font-weight: bold; color: #0f172a; text-transform: uppercase;">
  ${editingTemplate.name}
</div>
<table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; font-family: inherit;">
  <thead>
    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">PARAMÈTRE ANALYSÉ</th>
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a; text-align: center;">RÉSULTAT</th>
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">UNITÉ</th>
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">VALEURS USUELLES</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
<div style="margin-top: 14px; padding: 10px 14px; background-color: #f8fafc; border-left: 3px solid #0f766e; border-radius: 6px; font-size: 11px;">
  <strong>Conclusion Biologique :</strong> ${editingTemplate.defaultConclusion || 'Examen sans anomalie décelable.'}
</div>`;
    }

    const toSave: ClinicalTemplate = {
      ...editingTemplate,
      html: finalHtml
    };

    const updated = clinicalTemplatesService.saveTemplate(toSave);
    setTemplates(updated);
    setEditingTemplate(null);
    showToast(`✅ Modèle "${toSave.name}" sauvegardé avec succès !`);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Réinitialiser tous les 33+ modèles aux paramètres d\'usine accrédités ?')) {
      const reset = clinicalTemplatesService.resetToDefaults();
      setTemplates(reset);
      showToast('🔄 Modèles réinitialisés aux valeurs accréditées.');
    }
  };

  const handleAddParam = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      parameters: [
        ...editingTemplate.parameters,
        { name: 'Nouveau Paramètre', defaultValue: '0.0', unit: 'UI/L', normalRange: '0 - 10' }
      ]
    });
  };

  const handleRemoveParam = (index: number) => {
    if (!editingTemplate) return;
    const newParams = editingTemplate.parameters.filter((_, i) => i !== index);
    setEditingTemplate({ ...editingTemplate, parameters: newParams });
  };

  const handleParamChange = (index: number, field: keyof ClinicalParameter, val: string) => {
    if (!editingTemplate) return;
    const newParams = [...editingTemplate.parameters];
    newParams[index] = { ...newParams[index], [field]: val };
    setEditingTemplate({ ...editingTemplate, parameters: newParams });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Catalogue & Éditeur de Modèles Cliniques</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono">
                  {templates.length} modèles
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Recherchez, personnalisez ou créez des modèles d'examens avec paramètres, normes et conclusions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Réinitialiser tous les modèles aux normes d'usine"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {feedback && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center">
            {feedback}
          </div>
        )}

        {/* Modal Body */}
        {editingTemplate ? (
          /* ================= EDITING TEMPLATE VIEW ================= */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  ← Retour au Catalogue
                </button>
                <h4 className="font-bold text-slate-900 text-sm">
                  Modification : <span className="text-teal-700">{editingTemplate.name}</span>
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer le Modèle</span>
                </button>
              </div>
            </div>

            {/* General Meta Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Nom du Modèle / Examen</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Spécialité / Catégorie</label>
                <select
                  value={editingTemplate.category}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-500"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Type de Spécimen Requis</label>
                <input
                  type="text"
                  value={editingTemplate.specimen}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, specimen: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-500"
                />
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  activeTab === 'visual' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Éditeur de Paramètres Structurés ({editingTemplate.parameters.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('html')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  activeTab === 'html' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Code HTML / A4 Format</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  activeTab === 'preview' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Aperçu du Rendu</span>
              </button>
            </div>

            {/* Tab 1: Visual Parameter Editor */}
            {activeTab === 'visual' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Paramètres Biologiques & Normes de Référence</span>
                  <button
                    type="button"
                    onClick={handleAddParam}
                    className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-teal-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un paramètre</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {editingTemplate.parameters.map((param, pIdx) => (
                    <div key={pIdx} className="grid grid-cols-12 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={param.name}
                          placeholder="Nom (ex: Hémoglobine)"
                          onChange={(e) => handleParamChange(pIdx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={param.defaultValue}
                          placeholder="Résultat usuel"
                          onChange={(e) => handleParamChange(pIdx, 'defaultValue', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-teal-700"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={param.unit}
                          placeholder="Unité (g/dL, UI/L)"
                          onChange={(e) => handleParamChange(pIdx, 'unit', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={param.normalRange}
                          placeholder="Normale (12 - 16)"
                          onChange={(e) => handleParamChange(pIdx, 'normalRange', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-500"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(pIdx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Conclusion Biologique par Défaut</label>
                  <textarea
                    rows={2}
                    value={editingTemplate.defaultConclusion}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultConclusion: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: HTML Editor */}
            {activeTab === 'html' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center justify-between">
                  <span>Gabarit HTML (Utilisé directement dans le Canvas A4 & Rapport Médical)</span>
                  <span className="text-[10px] text-teal-700 lowercase font-normal">Styles en ligne supportés</span>
                </label>
                <textarea
                  rows={14}
                  value={editingTemplate.html}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, html: e.target.value })}
                  className="w-full p-3 font-mono text-xs bg-slate-950 text-teal-400 rounded-2xl border border-slate-800 leading-relaxed focus:outline-hidden"
                />
              </div>
            )}

            {/* Tab 3: Preview */}
            {activeTab === 'preview' && (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-inner min-h-[300px]">
                {/* Official Lab Header or Placeholder Box */}
                {brandHeader ? (
                  <div className="w-full pb-4 mb-4 border-b border-slate-200">
                    <img 
                      src={brandHeader} 
                      alt={activeLabName || 'Official Laboratory Header'} 
                      className="w-full max-h-[100px] object-contain mx-auto select-none"
                    />
                  </div>
                ) : hasRealLabHeader ? (
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      {brandLogo ? (
                        <img 
                          src={brandLogo} 
                          alt={activeLabName || 'Lab Logo'} 
                          className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl object-contain border border-slate-200 p-0.5"
                        />
                      ) : (
                        <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-teal-700 text-white flex items-center justify-center font-black">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-black text-slate-900 uppercase text-sm">{activeLabName}</h3>
                        {activeLabAddress && <p className="text-[11px] text-slate-500">{activeLabAddress}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full border-2 border-dashed border-teal-400 bg-teal-50/50 rounded-2xl p-5 text-center text-teal-950 flex flex-col items-center justify-center gap-1.5 mb-6 select-none">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-teal-700" />
                      <span className="font-black text-sm uppercase tracking-wider text-teal-950">
                        LAB HEADER WILL GO HERE
                      </span>
                    </div>
                    <p className="text-xs text-teal-800/80 font-medium">
                      (Official laboratory letterhead will be applied on print and PDF export)
                    </p>
                  </div>
                )}

                <div 
                  className="prose prose-sm max-w-none text-slate-900"
                  dangerouslySetInnerHTML={{ __html: editingTemplate.html }}
                />
              </div>
            )}
          </div>
        ) : (
          /* ================= CATALOG BROWSER VIEW ================= */
          <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-5 space-y-3">
            {/* Search and Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, code ou échantillon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Modèle</span>
                </button>
              </div>
            </div>

            {/* List of Templates */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
              {filtered.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:border-teal-300 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded-md">
                          {tpl.code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{tpl.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {tpl.category}
                        </span>
                        {tpl.isCustom && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800">
                            Modifié
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        Spécimen : <strong className="text-slate-700">{tpl.specimen}</strong> • Délai : {tpl.turnaroundTime} • {tpl.parameters.length} paramètres
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {onSelectTemplate && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTemplate(tpl);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Insérer</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const cloned: ClinicalTemplate = {
                          ...JSON.parse(JSON.stringify(tpl)),
                          id: `custom_${Date.now()}`,
                          code: `CUST-${Math.floor(100 + Math.random() * 900)}`,
                          name: `${tpl.name} (Personnalisé)`,
                          isCustom: true
                        };
                        setEditingTemplate(cloned);
                        setActiveTab('visual');
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 rounded-xl text-xs font-bold transition-all"
                      title="Dupliquer et personnaliser ce modèle"
                    >
                      Copier
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(tpl)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Modifier</span>
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">Aucun modèle clinique trouvé</p>
                  <p className="text-xs">Essayez un autre terme de recherche ou une autre catégorie.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>nanoLabs LIMS • Modèles et Paramètres Cliniques</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicalTemplateManagerModal;
