import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Save, 
  Lock, 
  Printer, 
  Download, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Table, 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Palette, 
  QrCode, 
  Building2, 
  ShieldCheck, 
  User, 
  Calendar, 
  Clock, 
  ChevronDown, 
  Plus, 
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Share2,
  HelpCircle,
  Search,
  X,
  AlertCircle,
  Upload
} from 'lucide-react';
import { PatientBooking, BookingTestItem, limsService } from '../../services/limsService';
import { useAuth } from '../../context/authContext';
import { useLabBranding, setActiveLabHeader } from '../../utils/labBranding';

export interface A4CanvasResultEditorProps {
  booking: PatientBooking;
  initialTestIndex?: number;
  onClose?: () => void;
  onSaveIndividualTest?: (testIndex: number, richHtml: string, summary: string) => void;
  onSaveAllTests?: (testsData: Array<{ testIndex: number; richHtml: string; summary: string }>) => void;
  onPrintPreview?: (booking: PatientBooking) => void;
  onShareWithDoctor?: (testIndex: number, testName: string, summary: string, richHtml: string) => void;
}

import { 
  clinicalTemplatesService, 
  ClinicalTemplate, 
  INITIAL_CLINICAL_TEMPLATES 
} from '../../data/clinicalTemplates';
import ClinicalTemplateManagerModal from '../admin/ClinicalTemplateManagerModal';

// Built-in pre-formatted clean templates for quick dropping into the Canva workspace
export const A4_CLINICAL_TEMPLATES = INITIAL_CLINICAL_TEMPLATES;

export const A4CanvasResultEditor: React.FC<A4CanvasResultEditorProps> = ({
  booking,
  initialTestIndex = 0,
  onClose,
  onSaveIndividualTest,
  onSaveAllTests,
  onPrintPreview,
  onShareWithDoctor
}) => {
  const { user, lab } = useAuth();
  const { logoUrl: brandLogo, headerUrl: brandHeader, setHeader } = useLabBranding(lab);
  const a4HeaderInputRef = useRef<HTMLInputElement>(null);
  const tests = booking.tests || [];
  const [activeTestIndex, setActiveTestIndex] = useState<number>(initialTestIndex);

  // Template manager modal & custom template state
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<ClinicalTemplate | null>(null);
  const [startCreateMode, setStartCreateMode] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<ClinicalTemplate[]>(() => clinicalTemplatesService.getAllTemplates());
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [selectedTemplateCat, setSelectedTemplateCat] = useState('All');

  // Synchronize available templates whenever updated
  useEffect(() => {
    const handleUpdate = () => {
      setAvailableTemplates(clinicalTemplatesService.getAllTemplates());
    };
    window.addEventListener('nanolabs_templates_updated', handleUpdate);
    return () => window.removeEventListener('nanolabs_templates_updated', handleUpdate);
  }, []);

  // Content for each test index: { html: string, saved: boolean, savedTime?: string }
  const [testContents, setTestContents] = useState<Record<number, { html: string; saved: boolean; savedTime?: string }>>({});
  const editorRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Active editor styling states
  const [activeFontSize, setActiveFontSize] = useState<string>('13px');
  const [activeColor, setActiveColor] = useState<string>('#0f172a');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);

  // Initialize test contents with default or saved rich html
  useEffect(() => {
    const initialMap: Record<number, { html: string; saved: boolean; savedTime?: string }> = {};
    tests.forEach((test, idx) => {
      // Find suitable default template by matching name
      let defaultHtml = test.richReportHtml || test.labNotes || '';
      if (!defaultHtml) {
        const lowerName = (test.testName || '').toLowerCase();
        if (lowerName.includes('nfs') || lowerName.includes('fbc') || lowerName.includes('hémogramme') || lowerName.includes('sang')) {
          defaultHtml = A4_CLINICAL_TEMPLATES[0].html;
        } else if (lowerName.includes('widal') || lowerName.includes('typh')) {
          defaultHtml = A4_CLINICAL_TEMPLATES[1].html;
        } else if (lowerName.includes('lipid') || lowerName.includes('cholest')) {
          defaultHtml = A4_CLINICAL_TEMPLATES[2].html;
        } else if (lowerName.includes('palu') || lowerName.includes('malaria') || lowerName.includes('frottis') || lowerName.includes('goutte')) {
          defaultHtml = A4_CLINICAL_TEMPLATES[3].html;
        } else if (lowerName.includes('urin') || lowerName.includes('ecbu')) {
          defaultHtml = A4_CLINICAL_TEMPLATES[4].html;
        } else if (lowerName.includes('créat') || lowerName.includes('rénal') || lowerName.includes('urée')) {
          defaultHtml = A4_CLINICAL_TEMPLATES[5].html;
        } else {
          // Clean default note
          defaultHtml = `
<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; font-family: inherit;">
  <thead>
    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">PARAMÈTRE ANALYSÉ</th>
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a; text-align: center;">RÉSULTAT</th>
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">UNITÉ</th>
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">RÉFÉRENCE</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px 10px; font-weight: 600;">${test.testName}</td>
      <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #0f766e;">${test.resultValue || 'Normal'}</td>
      <td style="padding: 8px 10px;">${test.units || ''}</td>
      <td style="padding: 8px 10px; color: #64748b;">${test.refRangeMale || 'Normal'}</td>
    </tr>
  </tbody>
</table>
<div style="margin-top: 14px; padding: 10px 14px; background-color: #f8fafc; border-left: 3px solid #0f766e; border-radius: 6px; font-size: 11px;">
  <strong>Observation Biologique :</strong> Analyse effectuée selon les normes de référence. Contrôles de qualité internes validés.
</div>`;
        }
      }

      initialMap[idx] = {
        html: defaultHtml,
        saved: test.status === 'Completed' || Boolean(test.resultValue),
        savedTime: test.completedAt ? new Date(test.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
      };

      // Also ensure live DOM reflects the html immediately
      const el = editorRefs.current[idx];
      if (el && defaultHtml && el.innerHTML !== defaultHtml) {
        el.innerHTML = defaultHtml;
      }
    });
    setTestContents(initialMap);
  }, [booking.id, tests.length, tests.map(t => t.richReportHtml || '').join('|||')]);

  // Synchronize DOM elements with state
  useEffect(() => {
    Object.entries(testContents).forEach(([idxStr, data]) => {
      const idx = Number(idxStr);
      const el = editorRefs.current[idx];
      if (el && el.innerHTML !== data.html) {
        el.innerHTML = data.html;
      }
    });
  }, [testContents]);

  // Formatting execution command
  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    // Sync current active editor content back to state
    const currentEl = editorRefs.current[activeTestIndex];
    if (currentEl) {
      setTestContents(prev => ({
        ...prev,
        [activeTestIndex]: {
          ...prev[activeTestIndex],
          html: currentEl.innerHTML,
          saved: false
        }
      }));
    }
  };

  // Insert Clinical Parameter Table into current active editor
  const insertClinicalTable = () => {
    const tableHtml = `
<table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; font-size: 12px; font-family: inherit;">
  <thead>
    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">Paramètre</th>
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a; text-align: center;">Résultat</th>
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">Unité</th>
      <th style="padding: 6px 10px; font-weight: bold; color: #0f172a;">Valeurs de Référence</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px 10px; font-weight: 600;">Examen / Paramètre A</td>
      <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #0f766e;">Normal</td>
      <td style="padding: 6px 10px;">-</td>
      <td style="padding: 6px 10px; color: #64748b;">Négatif / Normal</td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px 10px; font-weight: 600;">Examen / Paramètre B</td>
      <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #0f766e;">0.00</td>
      <td style="padding: 6px 10px;">mg/L</td>
      <td style="padding: 6px 10px; color: #64748b;">&lt; 5.0</td>
    </tr>
  </tbody>
</table>
<p><br></p>`;
    executeCommand('insertHTML', tableHtml);
  };

  // Dynamically add another row to any pre-populated or customized table
  const handleAddTableRow = (testIndex: number) => {
    const editorEl = editorRefs.current[testIndex];
    if (!editorEl) return;

    // 1. Check if user currently has cursor inside a row or table
    const sel = window.getSelection();
    let targetRow: HTMLTableRowElement | null = null;
    let targetTable: HTMLTableElement | null = null;

    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editorEl) {
        if (node.nodeName === 'TR') targetRow = node as HTMLTableRowElement;
        if (node.nodeName === 'TABLE') {
          targetTable = node as HTMLTableElement;
          break;
        }
        node = node.parentNode;
      }
    }

    // 2. If cursor is not in a table, target the last table in the active editor
    if (!targetTable) {
      const tables = editorEl.querySelectorAll('table');
      if (tables.length > 0) {
        targetTable = tables[tables.length - 1];
      }
    }

    if (targetTable) {
      const allRows = targetTable.querySelectorAll('tr');
      let colCount = 4;
      const sampleRow = targetRow || (allRows.length > 1 ? allRows[allRows.length - 1] : allRows[0]);
      if (sampleRow) {
        colCount = sampleRow.querySelectorAll('th, td').length || 4;
      }

      const tbody = targetTable.querySelector('tbody') || targetTable;
      const newRow = document.createElement('tr');
      newRow.style.borderBottom = '1px solid #e2e8f0';

      if (colCount === 4) {
        newRow.innerHTML = `
          <td style="padding: 6px 10px; font-weight: 600; color: #0f172a;">Nouveau Paramètre</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #0f766e;">-</td>
          <td style="padding: 6px 10px; color: #334155;">-</td>
          <td style="padding: 6px 10px; color: #64748b;">Valeur de référence</td>
        `;
      } else if (colCount === 3) {
        newRow.innerHTML = `
          <td style="padding: 6px 10px; font-weight: 600; color: #0f172a;">Nouveau Paramètre</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #0f766e;">-</td>
          <td style="padding: 6px 10px; color: #64748b;">Valeur de référence</td>
        `;
      } else if (colCount === 5) {
        newRow.innerHTML = `
          <td style="padding: 6px 10px; font-weight: 600; color: #0f172a;">Nouveau Paramètre</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #0f766e;">-</td>
          <td style="padding: 6px 10px; color: #334155;">-</td>
          <td style="padding: 6px 10px; color: #64748b;">Valeur de référence</td>
          <td style="padding: 6px 10px; text-align: center; font-size: 11px; font-weight: 700; color: #0f766e;">Normal</td>
        `;
      } else {
        let cells = '';
        for (let i = 0; i < colCount; i++) {
          cells += `<td style="padding: 6px 10px; color: #0f172a;">-</td>`;
        }
        newRow.innerHTML = cells;
      }

      if (targetRow && targetRow.parentNode) {
        targetRow.parentNode.insertBefore(newRow, targetRow.nextSibling);
      } else {
        tbody.appendChild(newRow);
      }

      // Sync state and notify
      const updatedHtml = editorEl.innerHTML;
      setTestContents(prev => ({
        ...prev,
        [testIndex]: {
          ...prev[testIndex],
          html: updatedHtml,
          saved: false
        }
      }));
      if (tests[testIndex]) {
        tests[testIndex].richReportHtml = updatedHtml;
      }

      setBannerFeedback(`➕ Ligne ajoutée avec succès au tableau du test ${testIndex + 1} ! Cliquez sur les cellules pour modifier.`);
      setTimeout(() => setBannerFeedback(null), 3000);
    } else {
      insertClinicalTable();
    }
  };

  // Remove active or last row from table
  const handleDeleteTableRow = (testIndex: number) => {
    const editorEl = editorRefs.current[testIndex];
    if (!editorEl) return;

    const sel = window.getSelection();
    let targetRow: HTMLTableRowElement | null = null;
    let targetTable: HTMLTableElement | null = null;

    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editorEl) {
        if (node.nodeName === 'TR') targetRow = node as HTMLTableRowElement;
        if (node.nodeName === 'TABLE') {
          targetTable = node as HTMLTableElement;
          break;
        }
        node = node.parentNode;
      }
    }

    if (!targetTable) {
      const tables = editorEl.querySelectorAll('table');
      if (tables.length > 0) targetTable = tables[tables.length - 1];
    }

    if (targetTable) {
      const rows = targetTable.querySelectorAll('tr');
      if (rows.length > 1) {
        const rowToDelete = targetRow || rows[rows.length - 1];
        if (rowToDelete.querySelector('th') && rows.length > 2) {
          rows[rows.length - 1].remove();
        } else {
          rowToDelete.remove();
        }

        const updatedHtml = editorEl.innerHTML;
        setTestContents(prev => ({
          ...prev,
          [testIndex]: {
            ...prev[testIndex],
            html: updatedHtml,
            saved: false
          }
        }));
        if (tests[testIndex]) {
          tests[testIndex].richReportHtml = updatedHtml;
        }
        setBannerFeedback(`🗑️ Ligne supprimée du tableau.`);
        setTimeout(() => setBannerFeedback(null), 3000);
      }
    }
  };

  // Upload custom header image directly from A4 Canvas
  const handleA4HeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setHeader(dataUrl);
        setBannerFeedback('✅ En-tête officiel du laboratoire enregistré et synchronisé !');
        setTimeout(() => setBannerFeedback(null), 3500);
      }
    };
    reader.readAsDataURL(file);
    // reset input
    e.target.value = '';
  };

  // Drop selected template into the middle box of the specified test index (Pre-populates full page)
  const handleDropTemplate = (testIndex: number, templateHtml: string, templateName: string) => {
    const el = editorRefs.current[testIndex];
    if (el) {
      el.innerHTML = templateHtml;
    }
    setTestContents(prev => ({
      ...prev,
      [testIndex]: {
        html: templateHtml,
        saved: false
      }
    }));
    if (tests[testIndex]) {
      tests[testIndex].richReportHtml = templateHtml;
    }
    setBannerFeedback(`✅ Modèle "${templateName}" pré-rempli sur la page A4 ! Vous pouvez directement modifier les données.`);
    setTimeout(() => setBannerFeedback(null), 4000);
  };

  // Save current canvas page layout and content as a reusable clinical template
  const handleSaveAsTemplate = (testIndex: number) => {
    const currentEl = editorRefs.current[testIndex];
    const html = currentEl ? currentEl.innerHTML : (testContents[testIndex]?.html || '');
    const currentTest = tests[testIndex];
    const testName = currentTest?.testName || 'Modèle Personnalisé';

    const customTpl: ClinicalTemplate = {
      id: `custom_${Date.now()}`,
      code: `TPL-${Math.floor(100 + Math.random() * 900)}`,
      name: `${testName} (Modèle Personnalisé)`,
      category: 'Biochemistry',
      specimen: currentTest?.sampleTypeRequired || 'Sang total / Sérum',
      turnaroundTime: '2 hours',
      defaultConclusion: 'Examen dans les limites physiologiques normales.',
      parameters: [],
      html
    };

    setTemplateToEdit(customTpl);
    setStartCreateMode(false);
    setShowTemplateManager(true);
  };

  // Save single test
  const handleSaveTest = async (testIndex: number) => {
    const currentEl = editorRefs.current[testIndex];
    const html = currentEl ? currentEl.innerHTML : (testContents[testIndex]?.html || '');
    const currentTest = tests[testIndex];
    if (!currentTest) return;

    // Extract quick textual summary
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const plainText = tempDiv.textContent || tempDiv.innerText || 'Normal';
    const summary = plainText.substring(0, 80).trim();

    // Update in limsService
    const techName = user?.name || 'Lab Technologist';
    await limsService.submitIndividualTestResult({
      labId: booking.labId,
      bookingId: booking.id,
      testId: currentTest.id || currentTest.testId,
      resultValue: summary,
      resultFlag: 'Normal',
      techName,
      notes: summary
    });

    // Also persist richReportHtml in test object
    currentTest.richReportHtml = html;
    currentTest.status = 'Completed';
    currentTest.completedAt = new Date().toISOString();

    setTestContents(prev => ({
      ...prev,
      [testIndex]: {
        html,
        saved: true,
        savedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }));

    if (onSaveIndividualTest) {
      onSaveIndividualTest(testIndex, html, summary);
    }

    setBannerFeedback(`✅ Test ${testIndex + 1} ("${currentTest.testName}") Saved & Locked successfully!`);
    setTimeout(() => setBannerFeedback(null), 3500);
  };

  // Save all tests in batch
  const handleSaveAll = async () => {
    setIsSavingAll(true);
    const resultsPayload: Array<{ testIndex: number; richHtml: string; summary: string }> = [];

    for (let i = 0; i < tests.length; i++) {
      const currentEl = editorRefs.current[i];
      const html = currentEl ? currentEl.innerHTML : (testContents[i]?.html || '');
      const currentTest = tests[i];

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const plainText = tempDiv.textContent || tempDiv.innerText || 'Normal';
      const summary = plainText.substring(0, 80).trim();

      currentTest.richReportHtml = html;
      currentTest.status = 'Completed';
      currentTest.completedAt = new Date().toISOString();

      await limsService.submitIndividualTestResult({
        labId: booking.labId,
        bookingId: booking.id,
        testId: currentTest.id || currentTest.testId,
        resultValue: summary,
        resultFlag: 'Normal',
        techName: user?.name || 'Lab Technologist',
        notes: summary
      });

      resultsPayload.push({ testIndex: i, richHtml: html, summary });
    }

    // Mark all as saved in state
    setTestContents(prev => {
      const next = { ...prev };
      tests.forEach((_, idx) => {
        next[idx] = {
          ...next[idx],
          saved: true,
          savedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      });
      return next;
    });

    if (onSaveAllTests) {
      onSaveAllTests(resultsPayload);
    }

    setIsSavingAll(false);
    setBannerFeedback(`🎉 All ${tests.length} tests in batch successfully saved and locked!`);
    setTimeout(() => setBannerFeedback(null), 4000);
  };

  // Scroll smoothly to a specific test page
  const scrollToTest = (idx: number) => {
    setActiveTestIndex(idx);
    const element = document.getElementById(`a4-page-test-${idx}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const bAny = booking as any;

  // Real Lab details - strictly NO mock text like "Accredited Medical Biology..."
  const rawLabName = lab?.name || booking.labName || bAny.labDetails?.name;
  const isMockName = rawLabName && (
    rawLabName.toLowerCase().includes('accredited medical') || 
    rawLabName.toLowerCase().includes('bla bla')
  );
  const activeLabName = (!isMockName && rawLabName) ? rawLabName : null;
  const activeLabAddress = lab?.address || bAny.labAddress || bAny.labDetails?.address || bAny.labDetails?.location || null;
  const activeLabPhone = lab?.phone || bAny.labPhone || bAny.labDetails?.phone || null;
  const activeLabEmail = lab?.email || bAny.labEmail || bAny.labDetails?.email || null;
  const activeLabAccreditation = lab?.accreditation || bAny.labAccreditation || null;
  const activeLabSlogan = lab?.slogan || lab?.tagline || bAny.labDetails?.slogan || null;

  const hasUploadedHeader = !!brandHeader;
  const hasRealLabHeader = !!(activeLabName && (activeLabAddress || activeLabPhone));

  const biologistName = booking.biologistName || lab?.directorName || 'Biologiste Médical Responsable';
  const biologistLicense = bAny.biologistLicense || lab?.licenseNumber || '';

  const patientName = booking.patientName || 'Valued Patient';
  const patientAge = booking.patientAge || 'Adult';
  const patientGender = booking.patientGender || 'Adult';
  const orderDate = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      {/* Hidden File Input for Instant Lab Header Upload */}
      <input 
        type="file" 
        ref={a4HeaderInputRef} 
        onChange={handleA4HeaderUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* ========================================================================= */}
      {/* 1. TOP STICKY APPLICATION TOOLBAR: Rich-text controls & Batch actions     */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Document info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-black">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-white tracking-tight">
                  A4 Medical Letter Canvas
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-900/60 text-teal-300 border border-teal-700/50">
                  {booking.bookingCode}
                </span>
                <span className="text-xs text-slate-400">
                  • {patientName} ({patientAge} yo, {patientGender})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Canva-style free-form report workspace with locked clinical header & footer
              </p>
            </div>
          </div>

          {/* Center: Formatting Bar (applies to active test editor) */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner overflow-x-auto">
            {/* Bold */}
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => executeCommand('italic')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => executeCommand('underline')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onClick={() => executeCommand('strikeThrough')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-slate-800 mx-1" />

            {/* Alignments */}
            <button
              type="button"
              onClick={() => executeCommand('justifyLeft')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyCenter')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyRight')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-slate-800 mx-1" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertOrderedList')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-slate-800 mx-1" />

            {/* Insert Clean Table */}
            <button
              type="button"
              onClick={insertClinicalTable}
              className="px-2 py-1 text-teal-300 hover:text-white hover:bg-teal-900/60 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Insérer un tableau clinique standard à 4 colonnes"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tableau</span>
            </button>

            {/* Add Table Row Button (even when pre-populated) */}
            <button
              type="button"
              onClick={() => handleAddTableRow(activeTestIndex)}
              className="px-2.5 py-1 text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Ajouter une ligne au tableau pré-rempli sur la page active"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Ligne</span>
            </button>

            {/* Color swatches */}
            <button
              type="button"
              onClick={() => executeCommand('foreColor', '#0f766e')}
              className="w-4 h-4 rounded-full bg-teal-600 border border-teal-400/50 hover:scale-110 transition-transform cursor-pointer"
              title="Color: Medical Teal"
            />
            <button
              type="button"
              onClick={() => executeCommand('foreColor', '#e11d48')}
              className="w-4 h-4 rounded-full bg-rose-600 border border-rose-400/50 hover:scale-110 transition-transform cursor-pointer"
              title="Color: Alert Red"
            />
            <button
              type="button"
              onClick={() => executeCommand('foreColor', '#0f172a')}
              className="w-4 h-4 rounded-full bg-slate-900 border border-slate-600 hover:scale-110 transition-transform cursor-pointer"
              title="Color: Dark Slate"
            />
          </div>

          {/* Right: Batch Actions */}
          <div className="flex items-center gap-2">
            {onPrintPreview && (
              <button
                type="button"
                onClick={() => onPrintPreview(booking)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                title="Preview full batch printable PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSavingAll ? 'Saving Batch...' : 'Save All Tests'}</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
          </div>

        </div>

        {/* Feedback Banner */}
        {bannerFeedback && (
          <div className="mt-2 max-w-7xl mx-auto p-2.5 bg-teal-900/90 border border-teal-600 text-teal-100 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-300" />
              <span>{bannerFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerFeedback(null)}
              className="text-teal-300 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        {/* Batch multi-test navigation rail (if more than 1 test) */}
        {tests.length > 1 && (
          <div className="mt-2 max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <span>Batch Tests ({tests.length}):</span>
            </span>
            {tests.map((t, idx) => {
              const isSaved = testContents[idx]?.saved;
              const isActive = activeTestIndex === idx;
              return (
                <button
                  key={t.id || idx}
                  type="button"
                  onClick={() => scrollToTest(idx)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                    isActive
                      ? 'bg-teal-600 text-white border-teal-400 shadow-xs'
                      : isSaved
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <span>Page {idx + 1}: {t.testName}</span>
                  {isSaved ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Saved & Locked" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Draft / Unsaved" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. CONTINUOUS A4 CANVAS PAGES CONTAINER (One Page per Test)               */}
      {/* ========================================================================= */}
      <main className="flex-1 py-8 px-4 overflow-y-auto space-y-12">
        {tests.map((test, testIdx) => {
          const isSaved = testContents[testIdx]?.saved;
          const savedTime = testContents[testIdx]?.savedTime;

          return (
            <div
              key={test.id || testIdx}
              id={`a4-page-test-${testIdx}`}
              onClick={() => setActiveTestIndex(testIdx)}
              className="max-w-[820px] w-full mx-auto space-y-3"
            >
              {/* Page indicator & individual page action bar */}
              <div className="flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-slate-800 text-teal-300 border border-slate-700">
                    A4 Page {testIdx + 1} of {tests.length}
                  </span>
                  <h3 className="font-extrabold text-white text-sm">
                    {test.testName}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    ({test.category || 'Clinical Examination'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Indicator */}
                  {isSaved ? (
                    <span className="px-2.5 py-1 bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 rounded-lg font-bold text-[11px] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Saved & Locked {savedTime ? `at ${savedTime}` : ''}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-950/90 text-amber-300 border border-amber-700/80 rounded-lg font-bold text-[11px] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>Unsaved Draft</span>
                    </span>
                  )}

                  {/* Save single page button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveTest(testIdx);
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Page {testIdx + 1}</span>
                  </button>
                </div>
              </div>

              {/* Enhanced Clinical Template Control Deck with Live Search & Custom Creation */}
              <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
                {/* Search Bar & Action Buttons */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={templateSearchTerm}
                      onChange={(e) => setTemplateSearchTerm(e.target.value)}
                      placeholder="Rechercher un modèle clinique (ex: NFS, Widal, Lipide, Urines, HIV, etc.)..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                    {templateSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setTemplateSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {/* Direct + Ajouter une Ligne au Tableau button */}
                    <button
                      type="button"
                      onClick={() => handleAddTableRow(testIdx)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Ajouter une nouvelle ligne au tableau de résultats de cette page"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Ajouter Ligne au Tableau</span>
                    </button>

                    {/* Add own custom template button */}
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateToEdit(null);
                        setStartCreateMode(true);
                        setShowTemplateManager(true);
                      }}
                      className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Créer un nouveau modèle de test personnalisé"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Nouveau Modèle</span>
                    </button>

                    {/* Save Current Canvas Page as Template */}
                    <button
                      type="button"
                      onClick={() => handleSaveAsTemplate(testIdx)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Sauvegarder la disposition et le tableau actuels comme modèle réutilisable"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enregistrer comme modèle</span>
                    </button>

                    {/* Open full manager */}
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateToEdit(null);
                        setStartCreateMode(false);
                        setShowTemplateManager(true);
                      }}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span>Tous les Modèles ({availableTemplates.length})</span>
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {['All', 'Hematology', 'Biochemistry', 'Serology', 'Microbiology', 'Parasitology', 'Endocrinology', 'Hemostasis', 'Cardiac'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedTemplateCat(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedTemplateCat === cat
                          ? 'bg-teal-500 text-slate-950 font-extrabold shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Filtered Template Chips - Click to Auto-fill / Pre-populate! */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                  {availableTemplates
                    .filter(t => {
                      const matchesCat = selectedTemplateCat === 'All' || t.category === selectedTemplateCat;
                      const matchesSearch = !templateSearchTerm.trim() || 
                        t.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) || 
                        t.code.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                        t.category.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                        t.specimen.toLowerCase().includes(templateSearchTerm.toLowerCase());
                      return matchesCat && matchesSearch;
                    })
                    .slice(0, 30)
                    .map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleDropTemplate(testIdx, tpl.html, tpl.name)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-teal-900/70 hover:text-teal-200 text-slate-200 border border-slate-800 hover:border-teal-500/60 rounded-xl text-[11px] font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 group shadow-xs"
                        title={`Cliquer pour pré-remplir la page A4 avec "${tpl.name}" (${tpl.category})`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 group-hover:scale-125 transition-transform" />
                        <span>{tpl.name}</span>
                        {tpl.isCustom && (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-bold">
                            Modifié
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* THE REALISTIC A4 WHITE PAGE (Exact 1:1.414 Letter Dimension & Styling)   */}
              {/* ========================================================================= */}
              <div 
                className="w-full bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 p-8 sm:p-10 min-h-[1050px] flex flex-col justify-between select-text"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                
                {/* ------------------------------------------------------------- */}
                {/* TOP LOCKED SECTION: Official Laboratory Header & Patient Bar */}
                {/* ------------------------------------------------------------- */}
                <div className="space-y-4 border-b-2 border-teal-800 pb-4 select-none">
                  {/* Lab Official Letterhead: Image OR Real Lab Details OR Required Placeholder Box */}
                  {hasUploadedHeader ? (
                    <div className="w-full pb-1 relative group">
                      <img 
                        src={brandHeader!} 
                        alt={activeLabName || 'Official Lab Header'} 
                        className="w-full max-h-[115px] object-contain mx-auto select-none"
                      />
                      <button
                        type="button"
                        onClick={() => a4HeaderInputRef.current?.click()}
                        className="no-print absolute top-1 right-1 opacity-0 group-hover:opacity-100 px-2 py-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold transition-opacity flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Changer l'en-tête</span>
                      </button>
                    </div>
                  ) : hasRealLabHeader ? (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 shrink-0">
                        {brandLogo ? (
                          <img
                            src={brandLogo}
                            alt={activeLabName || 'Lab Logo'}
                            className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-xs shrink-0 select-none"
                          />
                        ) : (
                          <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0 select-none">
                            <Building2 className="w-7 h-7" />
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <h2 className="text-base font-black text-teal-950 tracking-tight uppercase">
                            {activeLabName}
                          </h2>
                          {activeLabSlogan && (
                            <p className="text-[11px] font-bold text-teal-700 tracking-wide">
                              {activeLabSlogan}
                            </p>
                          )}
                          {(activeLabAddress || activeLabAccreditation) && (
                            <p className="text-[10px] text-slate-500">
                              {[activeLabAddress, activeLabAccreditation].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {(activeLabPhone || activeLabEmail) && (
                        <div className="text-right text-[10px] text-slate-500 space-y-0.5 font-mono shrink-0">
                          {activeLabPhone && <div>Tél : {activeLabPhone}</div>}
                          {activeLabEmail && <div>Email : {activeLabEmail}</div>}
                          <div className="font-bold text-teal-900">Système LIMS Sécurisé</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* The Required Placeholder Box */
                    <div className="w-full border-2 border-dashed border-teal-400 bg-teal-50/50 rounded-2xl p-6 text-center text-teal-950 flex flex-col items-center justify-center gap-2 select-none group transition-all">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-teal-700" />
                        <span className="font-black text-sm sm:text-base uppercase tracking-wider text-teal-950">
                          LAB HEADER WILL GO HERE
                        </span>
                      </div>
                      <p className="text-xs text-teal-800/80 font-medium max-w-md">
                        No official laboratory letterhead configured. Upload your header image now or select it in &ldquo;Preview PDF / Print Results&rdquo;.
                      </p>
                      <div className="flex items-center gap-2 mt-1 no-print">
                        <button
                          type="button"
                          onClick={() => a4HeaderInputRef.current?.click()}
                          className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Lab Header</span>
                        </button>
                        {onPrintPreview && (
                          <button
                            type="button"
                            onClick={() => onPrintPreview(booking)}
                            className="px-3.5 py-1.5 bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-teal-700" />
                            <span>Preview PDF / Print</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Patient & Examination Locked Demographic Bar */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nom du Patient</span>
                      <span className="font-extrabold text-slate-900">{patientName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Âge / Sexe</span>
                      <span className="font-bold text-slate-800">{patientAge} ans • {(patientGender as string) === 'F' || patientGender === 'Female' ? 'Féminin' : 'Masculin'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Identifiant / Dossier</span>
                      <span className="font-mono font-bold text-teal-800">{booking.bookingCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Date du Prélèvement</span>
                      <span className="font-bold text-slate-800">{orderDate}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Examen Demandé</span>
                      <span className="font-extrabold text-teal-950 text-sm">{test.testName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Type d'Échantillon</span>
                      <span className="font-bold text-slate-700">{test.sampleTypeRequired || 'Sang veineux total'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Médecin Prescripteur</span>
                      <span className="font-bold text-slate-700">{booking.referringDoctor || 'Dr. Attending Physician'}</span>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* MIDDLE RICH-TEXT WORKSPACE: Free-form Canva/Word Style Editor */}
                {/* ------------------------------------------------------------- */}
                <div className="flex-1 py-6">
                  <div
                    ref={(el) => {
                      editorRefs.current[testIdx] = el;
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onFocus={() => setActiveTestIndex(testIdx)}
                    onInput={(e) => {
                      const newHtml = e.currentTarget.innerHTML;
                      setTestContents(prev => ({
                        ...prev,
                        [testIdx]: {
                          ...prev[testIdx],
                          html: newHtml,
                          saved: false
                        }
                      }));
                    }}
                    className="min-h-[520px] w-full outline-hidden text-slate-800 leading-relaxed font-sans text-[13px] focus:ring-1 focus:ring-teal-500/20 p-2 rounded-xl transition-all"
                    data-placeholder="Tapez directement vos résultats ici, éditez les valeurs, changez les polices, ou insérez un tableau..."
                  />

                  {/* Table Row Controls Bar right below the A4 editor */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-dashed border-slate-200 text-xs text-slate-500 no-print select-none">
                    <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                      <Table className="w-3.5 h-3.5 text-teal-600" />
                      Lignes du tableau de résultats :
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddTableRow(testIdx)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Ajouter une ligne au tableau pré-rempli"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Ajouter une ligne</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTableRow(testIdx)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                        title="Supprimer la dernière ligne du tableau"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Supprimer ligne</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* BOTTOM LOCKED SECTION: Official Signatures, QR & Disclaimers  */}
                {/* ------------------------------------------------------------- */}
                <div className="border-t-2 border-slate-200 pt-4 space-y-4 select-none">
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-end justify-between gap-4">
                    {/* Left: Validation stamp */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                        <span>Validation Biologique Officielle</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Certifié conforme aux règles de bonne pratique des analyses médicales.
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        Date d'édition : {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Center: QR Verification */}
                    <div className="flex flex-col items-center justify-center text-center space-y-1">
                      <div className="w-14 h-14 bg-slate-50 border border-slate-300 rounded-xl p-1 flex items-center justify-center shadow-2xs">
                        <QrCode className="w-11 h-11 text-teal-900" />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">
                        Vérification QR: NL-{booking.bookingCode}-{testIdx + 1}
                      </span>
                    </div>

                    {/* Right: Biologist Signature */}
                    <div className="text-right space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Le Médecin / Biologiste Responsable
                      </span>
                      <p className="text-xs font-black text-slate-900">
                        {biologistName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {biologistLicense}
                      </p>
                      <div className="text-[10px] font-mono text-teal-800 pt-1">
                        Signé & validé électroniquement
                      </div>
                    </div>
                  </div>

                  {/* Legal footer & page number */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                    <span>
                      Ce compte-rendu est strictement confidentiel. nanoLabs Medical LIMS Platform.
                    </span>
                    <span className="font-bold text-slate-600">
                      Page {testIdx + 1} / {tests.length}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </main>

      {showTemplateManager && (
        <ClinicalTemplateManagerModal
          isOpen={showTemplateManager}
          initialTemplateToEdit={templateToEdit}
          startInCreateMode={startCreateMode}
          onClose={() => {
            setShowTemplateManager(false);
            setTemplateToEdit(null);
            setStartCreateMode(false);
            setAvailableTemplates(clinicalTemplatesService.getAllTemplates());
          }}
          onSelectTemplate={(tpl) => {
            handleDropTemplate(activeTestIndex, tpl.html, tpl.name);
            setAvailableTemplates(clinicalTemplatesService.getAllTemplates());
          }}
        />
      )}
    </div>
  );
};

export default A4CanvasResultEditor;
