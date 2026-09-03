import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Building2, 
  Award, 
  Check, 
  Save, 
  Eye, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Sliders, 
  PenTool, 
  MapPin, 
  Phone, 
  Mail, 
  Globe 
} from 'lucide-react';
import { useAuth } from '../../context/authContext';

export interface HeaderFooterTemplateConfig {
  id: string;
  name: string;
  templateType: 'template1' | 'template2';
  labName: string;
  subTitle: string;
  directorName: string;
  directorDiplomas: string;
  directorSpecialties: string;
  arreteNumber: string;
  agrementNumber: string;
  taxNumber: string; // N.I.U. / Contribuable
  rcNumber: string;
  address: string;
  bpCity: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  website: string;
  logoUrl?: string;
  accentColor: string;
  biologistSignatureTitle: string;
  showWatermark: boolean;
  watermarkText: string;
  footerNotes: string;
}

export const DEFAULT_HEADER_FOOTER_TEMPLATES: HeaderFooterTemplateConfig[] = [
  {
    id: 'tpl-modern-accredited',
    name: 'Template 1: Modern Accredited Letterhead (High Precision)',
    templateType: 'template1',
    labName: 'nanoLabs Clinical Diagnostics Center',
    subTitle: 'Accredited Medical Biology & Clinical Laboratory Services',
    directorName: 'Prof. Dr. Roland Enow',
    directorDiplomas: 'MD, PhD in Clinical Biology & Pathology (Paris / Douala)',
    directorSpecialties: 'Clinical Chemistry, Molecular Diagnostics, Automated Hematology & Infectious Serology',
    arreteNumber: 'Arrêté N° 045/A/MINSANTE/SG/DPS/2020',
    agrementNumber: 'Agrément N° 088/MINSANTE',
    taxNumber: 'M039900008877A',
    rcNumber: 'RC/DLA/2020/B/450',
    address: 'Boulevard de la Liberté, Akwa Medical Hub',
    bpCity: 'B.P. 1284 Douala - Cameroun',
    phone: '+237 233 42 88 00 / 670 12 34 56',
    emergencyPhone: '+237 699 92 91 98',
    email: 'contact@nanolabs-diagnostics.cm',
    website: 'www.nanolabs-diagnostics.cm',
    accentColor: '#0F766E',
    biologistSignatureTitle: 'Directeur de Laboratoire & Biologiste Responsable',
    showWatermark: true,
    watermarkText: 'NANOLABS CERTIFIED',
    footerNotes: 'Accredited Laboratory per ISO 15189 standards. Diagnostic results are confidential and electronically secured.'
  },
  {
    id: 'tpl-cameroon-biodiagnostics',
    name: 'Template 2: Cameroon Biodiagnostics Multi-Specialty Letterhead',
    templateType: 'template2',
    labName: 'LABORATOIRE BIODIAGNOSTICS',
    subTitle: 'ANALYSES DE BIOLOGIE MEDICALE',
    directorName: 'Dr TANKOUA Jean Alain',
    directorDiplomas: 'Diplômé de l\'Université René Descartes (Paris V) • Ex Attaché des Hôpitaux de Paris & Hôpital Général de Dla',
    directorSpecialties: 'Etudes Spéciales de Biochimie, Hématologie, Immunologie, Parasitologie, Bactériologie et de Virologie Cliniques',
    arreteNumber: 'Arrêté N° 032/A/MSP/SG/DMH/SDHFS/SL/1991',
    agrementNumber: 'Agrément N° 019 MINSAP',
    taxNumber: 'Contribuable N° P1256 0000 6852-X',
    rcNumber: 'RC/DLA/1991/A/019',
    address: 'Vallée 3 Boutiques, Entrée Polyclinique Poitiers',
    bpCity: 'B.P 2573 Douala - Cameroun',
    phone: '33 06 21 23',
    emergencyPhone: '699 92 91 98',
    email: 'biodiagnostics.dla@gmail.com',
    website: 'www.biodiagnostics-cameroun.cm',
    accentColor: '#1E3A8A',
    biologistSignatureTitle: 'BIOLOGISTE-CLINICIEN / LA DIRECTION',
    showWatermark: true,
    watermarkText: 'BIODIAGNOSTICS',
    footerNotes: 'Validé par Biologiste-Clinicien agréé. Arrêté N° 032/A/MSP/SG/DMH/SDHFS/SL/1991.'
  }
];

export const HeaderFooterTemplateManager: React.FC = () => {
  const { lab } = useAuth();
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [templates, setTemplates] = useState<HeaderFooterTemplateConfig[]>(() => {
    try {
      const saved = localStorage.getItem('nanoLabs_header_footer_templates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_HEADER_FOOTER_TEMPLATES;
  });

  const [activePreviewType, setActivePreviewType] = useState<'receipt' | 'report'>('receipt');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentTemplate = templates[selectedTemplateIndex] || templates[0];

  const handleFieldChange = (field: keyof HeaderFooterTemplateConfig, value: any) => {
    setTemplates(prev => {
      const updated = [...prev];
      updated[selectedTemplateIndex] = {
        ...updated[selectedTemplateIndex],
        [field]: value
      };
      return updated;
    });
  };

  const handleSave = () => {
    try {
      localStorage.setItem('nanoLabs_header_footer_templates', JSON.stringify(templates));
      localStorage.setItem('nanoLabs_active_template_id', currentTemplate.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (e) {
      console.error('Error saving templates:', e);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset this template to official Cameroon laboratory default values?')) {
      setTemplates(prev => {
        const updated = [...prev];
        updated[selectedTemplateIndex] = { ...DEFAULT_HEADER_FOOTER_TEMPLATES[selectedTemplateIndex] };
        return updated;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Dual Header & Footer Letterhead Templates
              </h2>
              <p className="text-xs text-slate-500">
                Configure both official accredited header/footer styles used across printed diagnostic reports, booklets, and billing receipts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Active Templates</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Letterhead Header/Footer configurations saved and synchronized live across all staff & patient dashboards!</span>
        </div>
      )}

      {/* Template Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tpl, idx) => {
          const isSelected = selectedTemplateIndex === idx;
          return (
            <div
              key={tpl.id}
              onClick={() => setSelectedTemplateIndex(idx)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected 
                  ? 'border-teal-500 bg-teal-50/30 shadow-md ring-2 ring-teal-500/20' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isSelected ? 'bg-teal-600 ring-2 ring-teal-300' : 'bg-slate-300'}`} />
                    <h3 className="font-extrabold text-sm text-slate-900">{tpl.name}</h3>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{tpl.directorDiplomas}</p>
                </div>
                {isSelected && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white uppercase tracking-wider">
                    Editing
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{tpl.arreteNumber}</span>
                <span className="font-bold text-slate-700">{tpl.phone}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Left Editor Controls & Right Live Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Editor (5 Cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              Configure Letterhead Fields: {currentTemplate.name.split(':')[0]}
            </h3>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              {currentTemplate.templateType === 'template2' ? 'Cameroon Biodiagnostics Layout' : 'Modern Accredited Layout'}
            </span>
          </div>

          <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
            {/* Primary Names */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                1. Main Facility & Title Header
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Facility Name (Header Top Line) *
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.labName}
                    onChange={e => handleFieldChange('labName', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Activity / Sub-Header (e.g. ANALYSES DE BIOLOGIE MEDICALE)
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.subTitle}
                    onChange={e => handleFieldChange('subTitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Medical Director & Qualifications */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                2. Director & Medical Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Biologist / Director Name *
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.directorName}
                    onChange={e => handleFieldChange('directorName', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Footer Signature Stamp Title
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.biologistSignatureTitle}
                    onChange={e => handleFieldChange('biologistSignatureTitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Degrees & Academic Titles (Diplomas)
                  </label>
                  <textarea
                    rows={2}
                    value={currentTemplate.directorDiplomas}
                    onChange={e => handleFieldChange('directorDiplomas', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialized Medical Biology Disciplines
                  </label>
                  <textarea
                    rows={2}
                    value={currentTemplate.directorSpecialties}
                    onChange={e => handleFieldChange('directorSpecialties', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Legal Accreditations & Tax ID */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                3. Legal Accreditations & Ministry Approvals
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Arrêté N° (Ministère de la Santé)
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.arreteNumber}
                    onChange={e => handleFieldChange('arreteNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Agrément N°
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.agrementNumber}
                    onChange={e => handleFieldChange('agrementNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    N° Contribuable / Tax ID (N.I.U.)
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.taxNumber}
                    onChange={e => handleFieldChange('taxNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registre de Commerce (R.C.)
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.rcNumber}
                    onChange={e => handleFieldChange('rcNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Address & Emergency Contacts */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                4. Location & Contact Numbers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address / Quarter
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.address}
                    onChange={e => handleFieldChange('address', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    B.P. / City
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.bpCity}
                    onChange={e => handleFieldChange('bpCity', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / Switchboard
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.phone}
                    onChange={e => handleFieldChange('phone', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Line (Urgences)
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.emergencyPhone}
                    onChange={e => handleFieldChange('emergencyPhone', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={currentTemplate.email}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview (6 Cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                Live Document Preview
              </span>
            </div>

            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActivePreviewType('receipt')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activePreviewType === 'receipt'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Facture Externe (Receipt)
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewType('report')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activePreviewType === 'report'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Examen Certificate (Report)
              </button>
            </div>
          </div>

          {/* Paper Mockup Container */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xl p-5 sm:p-6 text-slate-900 overflow-hidden font-sans text-xs">
            
            {/* 1. LETTERHEAD HEADER ACCORDING TO CURRENT TEMPLATE */}
            <div className="border-b-2 border-slate-800 pb-3 text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-teal-800 text-white flex items-center justify-center font-black text-sm shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                    {currentTemplate.labName}
                  </h1>
                  <h2 className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wide">
                    {currentTemplate.subTitle}
                  </h2>
                </div>
              </div>

              <div className="text-[10px] text-slate-800 font-bold pt-1">
                {currentTemplate.directorName}
              </div>
              <div className="text-[9px] text-slate-600 font-medium leading-tight max-w-xl mx-auto">
                {currentTemplate.directorDiplomas}
              </div>
              <div className="text-[9px] text-slate-600 italic leading-tight max-w-xl mx-auto">
                {currentTemplate.directorSpecialties}
              </div>

              <div className="text-[8.5px] text-slate-500 font-mono pt-0.5">
                {currentTemplate.arreteNumber} • {currentTemplate.agrementNumber} • {currentTemplate.taxNumber}
              </div>
              <div className="text-[8.5px] text-slate-600 font-semibold">
                {currentTemplate.address} {currentTemplate.bpCity} • Tél: {currentTemplate.phone} • Urgences: {currentTemplate.emergencyPhone}
              </div>
            </div>

            {/* PREVIEW CONTENT FOR RECEIPT */}
            {activePreviewType === 'receipt' && (
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between text-[11px] font-black pb-2 border-b border-slate-200">
                  <span className="uppercase text-slate-900">FACTURE EXTERNE n° : [000060]</span>
                  <span className="text-slate-600 font-medium">28 Août 2025</span>
                </div>

                {/* Identification & Insurance Boxes */}
                <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                  <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 space-y-0.5">
                    <div className="font-bold uppercase text-slate-900 pb-0.5 border-b border-slate-200">IDENTIFICATION</div>
                    <div>Assuré: <strong>CHIKWADO NWEKE CHRISTIANUS</strong></div>
                    <div>Bénéficiaire: M. CHIKWADO NWEKE</div>
                    <div>Né le: 15/02/1986 | Sexe: M | Tél: 670024784</div>
                    <div>Société: CIBLE RH EMPLOI SARL</div>
                    <div>N° BPC: CSA | N° Dos: 58</div>
                  </div>

                  <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 space-y-0.5">
                    <div className="font-bold uppercase text-indigo-950 pb-0.5 border-b border-slate-200">ASCOMA CAMEROUN S.A.</div>
                    <div>Adresse: 445, avenue Général de Gaulle</div>
                    <div>B.P: 447 - YAOUNDE</div>
                    <div>Tél: 33.43.41.53 / 96.29.74.01</div>
                    <div>N.I.U.: M025300001665C | R.C: RC/DLA/195</div>
                  </div>
                </div>

                {/* Sample COTE Line Items Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden text-[9px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-1.5">DESIGNATION</th>
                        <th className="p-1.5 text-center">COTE</th>
                        <th className="p-1.5 text-right">VALEUR</th>
                        <th className="p-1.5 text-right">PRIX TOTAL</th>
                        <th className="p-1.5 text-right text-indigo-900">ASSU (80%)</th>
                        <th className="p-1.5 text-right text-emerald-900">PATIENT (20%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      <tr>
                        <td className="p-1 font-bold">PK# ACTE PRELEVEMENT SELLES</td>
                        <td className="p-1 text-center font-mono">KB1,0</td>
                        <td className="p-1 text-right font-mono">1 200</td>
                        <td className="p-1 text-right font-mono font-bold">240</td>
                        <td className="p-1 text-right font-mono text-indigo-900 font-bold">192</td>
                        <td className="p-1 text-right font-mono text-emerald-900 font-bold">48</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-bold">PSE# ACTE DE PRELEVEMENT DE SANG ES</td>
                        <td className="p-1 text-center font-mono">KB1,5</td>
                        <td className="p-1 text-right font-mono">1 200</td>
                        <td className="p-1 text-right font-mono font-bold">372</td>
                        <td className="p-1 text-right font-mono text-indigo-900 font-bold">298</td>
                        <td className="p-1 text-right font-mono text-emerald-900 font-bold">74</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-bold">GLYP# DOSAGE DU GLUCOSE PLASMATIQUE</td>
                        <td className="p-1 text-center font-mono">B10</td>
                        <td className="p-1 text-right font-mono">260</td>
                        <td className="p-1 text-right font-mono font-bold">520</td>
                        <td className="p-1 text-right font-mono text-indigo-900 font-bold">416</td>
                        <td className="p-1 text-right font-mono text-emerald-900 font-bold">104</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-bold">IONOC# IONOGRAMME PLASMATIQUE COMPLET</td>
                        <td className="p-1 text-center font-mono">B95</td>
                        <td className="p-1 text-right font-mono">260</td>
                        <td className="p-1 text-right font-mono font-bold">4 940</td>
                        <td className="p-1 text-right font-mono text-indigo-900 font-bold">3 952</td>
                        <td className="p-1 text-right font-mono text-emerald-900 font-bold">988</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Split Totals */}
                <div className="grid grid-cols-2 gap-2 text-[9px] pt-1">
                  <div className="border border-slate-200 p-2 rounded-lg bg-emerald-50 text-emerald-950 font-bold">
                    <div>TICKET MODERATEUR (PATIENT):</div>
                    <div className="text-xs font-mono font-black text-emerald-800">1 214 FCFA</div>
                  </div>
                  <div className="border border-slate-200 p-2 rounded-lg bg-indigo-50 text-indigo-950 font-bold">
                    <div>NET A PAYER (ASSURANCE):</div>
                    <div className="text-xs font-mono font-black text-indigo-800">4 858 FCFA</div>
                  </div>
                </div>

                <div className="text-[8.5px] italic text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                  ARRÊTÉ LA PRÉSENTE FACTURE À LA SOMME DE : QUATRE MILLE HUIT CENT CINQUANTE-HUIT FRANCS CFA
                </div>

                {/* Footer Signatures */}
                <div className="pt-2 flex items-center justify-between text-[9px]">
                  <div>
                    <div className="font-bold text-slate-900">Signature Assuré / Patient:</div>
                    <div className="h-6 flex items-center italic text-slate-400">Lu et approuvé</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{currentTemplate.biologistSignatureTitle}:</div>
                    <div className="h-6 flex items-center justify-end font-serif font-bold text-blue-900 italic">
                      {currentTemplate.directorName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW CONTENT FOR MEDICAL REPORT */}
            {activePreviewType === 'report' && (
              <div className="space-y-3 pt-3">
                <div className="text-center font-black text-sm uppercase text-slate-900 border-b border-slate-300 pb-1">
                  EXAMEN BACTERIOLOGIQUE & CYTOLOGIQUE
                </div>

                {/* Patient Header Strip */}
                <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2 rounded border border-slate-200 text-[9px]">
                  <div>Patient: <strong>M. CHIKWADO NWEKE</strong></div>
                  <div>Âge: <strong>39 Ans (M)</strong></div>
                  <div>Prescripteur: <strong>Dr HAPPY LYNDA</strong></div>
                </div>

                {/* Hierarchical Examination Sections */}
                <div className="space-y-2 text-[9.5px]">
                  <div className="border-l-2 border-teal-600 pl-2">
                    <div className="font-black text-slate-900 uppercase">PRELEVEMENT AU NIVEAU DU COL UTERIN / URETRE</div>
                    
                    <div className="pt-1 pl-2 space-y-1">
                      <div>
                        <span className="font-bold text-slate-800">Macroscopie : </span>
                        <span className="text-slate-700">Aspect glauque, peu abondant</span>
                      </div>
                      
                      <div>
                        <div className="font-bold text-slate-800">Coloration de Gram :</div>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[9px]">
                          <li>Cellules épithéliales : Nombreuses</li>
                          <li>Polynucléaires : 10 à 15 par champ microscopique</li>
                          <li>Diplocoques Gram négatif type Neisseriae : Absence</li>
                          <li>Autres Cocci : Rares streptocoques</li>
                          <li>Bacilles : Flore diminuée, Absence de Bacilles Gram négatif</li>
                        </ul>
                      </div>

                      <div>
                        <div className="font-bold text-slate-800">Culture bactériologique :</div>
                        <div className="pl-2 text-slate-700 text-[9px]">
                          Gonoculture : Négative • Recherche directe de Mycoplasme : Négative
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-100 rounded border border-slate-200 text-[9px]">
                    <span className="font-black text-slate-900 uppercase">CONCLUSION : </span>
                    <span className="text-slate-800 font-semibold">Frottis inflammatoire modéré. Absence d'éléments pathogènes spécifiques.</span>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[9px]">
                  <div>
                    <div className="text-slate-500">Technicien Analyste:</div>
                    <div className="font-bold text-slate-800">Mangi Lerine Laslie</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500">{currentTemplate.biologistSignatureTitle}:</div>
                    <div className="font-serif font-bold text-blue-900 italic text-[11px]">
                      {currentTemplate.directorName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accreditation Bottom Tag */}
            <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[8.5px] text-slate-500">
              {currentTemplate.footerNotes}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default HeaderFooterTemplateManager;
