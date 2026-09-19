import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection, query, where, updateDoc, doc } from '../../services/firebase';
import { limsService, PatientBooking, BookingTestItem, MasterTestItem } from '../../services/limsService';
import { MASTER_TESTS_CATALOG } from '../../data/masterTestsData';
import { OFFICIAL_MASTER_TEST_CATALOG } from '../../data/officialTestCatalog';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';
import { ResultTemplateEditorModal, CustomResultTemplate } from '../../components/lab/ResultTemplateEditor';
import { SplitScreenResultEntry } from '../../components/results/SplitScreenResultEntry';
import { A4CanvasResultEditor, A4_CLINICAL_TEMPLATES } from '../../components/results/A4CanvasResultEditor';
import { PatientExamResult } from '../../types/examTemplate';
import { 
  TestTube, 
  Search, 
  CheckCircle2, 
  Upload, 
  Bell, 
  ShieldCheck, 
  Lock, 
  Share2, 
  FileText, 
  AlertCircle, 
  FlaskConical, 
  Check, 
  Eye, 
  EyeOff,
  Printer, 
  Key, 
  UserCheck, 
  Layers, 
  Sparkles,
  Microscope,
  Link as LinkIcon,
  ChevronRight,
  ArrowRight,
  BookOpen,
  PlusCircle,
  Plus,
  X,
  Database,
  Tag,
  Clock,
  Globe,
  Trash2,
  Package,
  AlertTriangle,
  Send,
  Smartphone,
  ChevronDown,
  ChevronUp,
  User,
  Filter,
  CheckCheck,
  FileCheck,
  Zap,
  Calculator,
  SlidersHorizontal,
  Activity,
  Info,
  RotateCcw,
  CheckSquare,
  Square,
  ListOrdered,
  FileCode2,
  Copy,
  Columns
} from 'lucide-react';

interface LabTechViewProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onRoleSwitcherPress?: () => void;
}

interface ReagentItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  lotNumber?: string;
  expiryDate?: string;
  reorderLevel?: number;
}

interface UsedReagentRecord {
  reagentId?: string;
  reagentName: string;
  quantity: number;
  unit?: string;
}

export const LabTechView: React.FC<LabTechViewProps> = ({
  onNotificationPress,
  onProfilePress,
  onRoleSwitcherPress
}) => {
  const { user, lab } = useAuth();
  const targetLabId = lab?.id || user?.labId || 'lab-1';

  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [inventoryItems, setInventoryItems] = useState<ReagentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'in_testing' | 'completed' | 'virtual'>('all');
  const [loading, setLoading] = useState(true);

  // Selected Patient Booklet Modal State
  const [activeBooking, setActiveBooking] = useState<PatientBooking | null>(null);
  const [selectedTestIndex, setSelectedTestIndex] = useState<number>(0);
  const [activeOptionMode, setActiveOptionMode] = useState<"a4_canvas" | "document" | "form">("document");
  const [showA4BatchModal, setShowA4BatchModal] = useState<boolean>(false);

  // Analyzer & Document Result States
  const [analyzerName, setAnalyzerName] = useState<string>('Mindray BC-5000');
  const [analyzerLink, setAnalyzerLink] = useState<string>('');
  const [analyzerFindings, setAnalyzerFindings] = useState<string>('');
  const [savedPrompt, setSavedPrompt] = useState<{
    isOpen: boolean;
    testIndex: number;
    testName: string;
  } | null>(null);
  const [selectedTestIndexForPdf, setSelectedTestIndexForPdf] = useState<number | null>(null);

  // Two-Column Template & Rich Result Text States
  const [templateText, setTemplateText] = useState<string>('');
  const [resultRichText, setResultRichText] = useState<string>('');

  // Active Test Working States
  const [worksheetLayoutMode, setWorksheetLayoutMode] = useState<'guided' | 'manual_sheet'>('guided');
  const [activeResultValue, setActiveResultValue] = useState<string>('');
  const [activeSubParamValues, setActiveSubParamValues] = useState<Record<string, string>>({});
  const [activeTestSubParameters, setActiveTestSubParameters] = useState<any[]>([]);
  const [activeParamObservations, setActiveParamObservations] = useState<Record<string, string>>({});
  const [activeParamFlags, setActiveParamFlags] = useState<Record<string, 'Normal' | 'Low' | 'High' | 'Borderline' | 'Critical'>>({});
  const [activeParamPrintToggles, setActiveParamPrintToggles] = useState<Record<string, boolean>>({});
  const [activeAntibiogram, setActiveAntibiogram] = useState<Array<{ id: string; antibiotic: string; discPotency?: string; zoneMm?: string; sensitivity: 'S' | 'I' | 'R' | string }>>([]);
  const [activeClinicalNotes, setActiveClinicalNotes] = useState<string>('');
  const [activeReagentsUsed, setActiveReagentsUsed] = useState<UsedReagentRecord[]>([]);

  // Add Custom Parameter & Sub-Header Modal States
  const [showAddCustomParamModal, setShowAddCustomParamModal] = useState(false);
  const [customParamName, setCustomParamName] = useState('');
  const [customParamUnit, setCustomParamUnit] = useState('');
  const [customParamRefMale, setCustomParamRefMale] = useState('');
  const [customParamRefFemale, setCustomParamRefFemale] = useState('');
  const [customParamSection, setCustomParamSection] = useState('');
  const [customParamMethod, setCustomParamMethod] = useState('');
  const [customParamDefaultVal, setCustomParamDefaultVal] = useState('');
  
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Antibiogram Row Modal
  const [showAddAntibiogramRow, setShowAddAntibiogramRow] = useState(false);
  const [newAntibioticName, setNewAntibioticName] = useState('');
  const [newAntibioticPotency, setNewAntibioticPotency] = useState('10 µg');
  const [newAntibioticZone, setNewAntibioticZone] = useState('20');
  const [newAntibioticSens, setNewAntibioticSens] = useState<'S' | 'I' | 'R'>('S');

  // Reagent Selector Popover / Inline Picker State
  const [selectedReagentIdToAdd, setSelectedReagentIdToAdd] = useState<string>('');
  const [reagentQtyToAdd, setReagentQtyToAdd] = useState<number>(1);
  const [reagentUnitToAdd, setReagentUnitToAdd] = useState<string>('mL');

  // Lab Test Catalog & Add Test to Order Modal State
  const [catalog, setCatalog] = useState<any[]>([]);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [addTestSearchQuery, setAddTestSearchQuery] = useState('');
  const [addTestCategoryFilter, setAddTestCategoryFilter] = useState('All');

  // Hierarchical Structured Parameters state
  const [activeHierarchicalValues, setActiveHierarchicalValues] = useState<Record<string, string>>({});

  // Option 2 Upload State
  const [pdfUploadDataUrl, setPdfUploadDataUrl] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadTargetScope, setUploadTargetScope] = useState<'specific' | 'batch'>('specific');
  const [uploadTargetTestId, setUploadTargetTestId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Option 3 Physical Pickup Alert State
  const [pickupPasscode, setPickupPasscode] = useState('');
  const [showPickupPasscode, setShowPickupPasscode] = useState(false);
  const [pickupError, setPickupError] = useState('');
  const [pickupSuccess, setPickupSuccess] = useState(false);

  // Submitting States
  const [isSavingTest, setIsSavingTest] = useState(false);
  const [isSubmittingBooklet, setIsSubmittingBooklet] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>('');

  // Security / Sharing Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePasscodeInput, setSharePasscodeInput] = useState('');
  const [targetTechNameInput, setTargetTechNameInput] = useState('');
  const [shareErrorMsg, setShareErrorMsg] = useState('');

  // PDF Preview Modal
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Result Template Editor Modal
  const [showResultTemplateModal, setShowResultTemplateModal] = useState(false);

  const handleApplyCustomTemplate = (template: CustomResultTemplate) => {
    const newParams = template.parameters.map((p, idx) => ({
      id: p.id || `param-${Date.now()}-${idx}`,
      name: p.name,
      unit: p.unit,
      refRangeMale: p.refRange || 'Normal',
      refRangeFemale: p.refRange || 'Normal',
      refRangeChild: p.refRange || 'Normal',
      method: template.methodology || '',
      defaultValue: p.defaultValue || ''
    }));
    setActiveTestSubParameters(prev => [...prev, ...newParams]);
    const newVals: Record<string, string> = {};
    newParams.forEach(p => {
      if (p.defaultValue) newVals[p.id] = p.defaultValue;
    });
    setActiveSubParamValues(prev => ({ ...prev, ...newVals }));
    setShowResultTemplateModal(false);
  };

  // 1. Fetch Bookings and Live Inventory from Firestore
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      const fetchedBookings = await limsService.getBookings(targetLabId);
      setBookings(fetchedBookings);

      // Fetch inventory to get unexpired reagents
      const invCol = collection(db, 'labs', targetLabId, 'inventory');
      const invSnap = await getDocs(invCol);
      const items: ReagentItem[] = invSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ReagentItem));
      setInventoryItems(items);

      // Fetch lab test catalog for adding tests on the fly
      try {
        const catCol = collection(db, 'labs', targetLabId, 'testCatalog');
        const catSnap = await getDocs(catCol);
        let catList = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (catList.length === 0) {
          catList = OFFICIAL_MASTER_TEST_CATALOG.map(t => ({
            ...t,
            actCode: t.id?.toUpperCase() || 'ACT-LAB',
            cote: t.category === 'Microbiology' ? 'B95' : t.category === 'Biochemistry' ? 'B30' : 'B45'
          }));
        }
        setCatalog(catList);
      } catch (catErr) {
        setCatalog(OFFICIAL_MASTER_TEST_CATALOG);
      }
    } catch (err) {
      console.error('Error loading Lab Tech queue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetLabId]);

  // Filter out expired reagents (Rule: Expired reagents MUST NOT show in the list)
  const validUnexpiredReagents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inventoryItems.filter(item => {
      if (!item.expiryDate) return true; // If no date specified, consider usable
      try {
        const exp = new Date(item.expiryDate);
        return exp >= today;
      } catch {
        return true;
      }
    });
  }, [inventoryItems]);

  // Helper to find Master Test Definition for rich sub-parameters & rules
  const getMasterTest = (test: BookingTestItem): MasterTestItem | undefined => {
    return MASTER_TESTS_CATALOG.find(
      m => m.id === test.testId || 
           m.code.toLowerCase() === (test.testCode || '').toLowerCase() || 
           m.name.toLowerCase() === test.testName.toLowerCase()
    );
  };

  // Helper to generate context-aware predictive choices for any test
  const getPredictiveChoices = (test: BookingTestItem): string[] => {
    const name = (test.testName || '').toLowerCase();
    const category = (test.category || '').toLowerCase();

    // 1. Serology / Virology / Immunology / Infectious Disease (HIV, Hepatitis, Syphilis, COVID, etc.)
    if (
      name.includes('hiv') || 
      name.includes('hbsag') || 
      name.includes('hepatitis') || 
      name.includes('hcv') || 
      name.includes('syphilis') || 
      name.includes('vdrl') || 
      name.includes('rpr') || 
      name.includes('chlamydia') || 
      name.includes('h. pylori') || 
      name.includes('pylori') ||
      name.includes('covid') || 
      name.includes('antigen') || 
      name.includes('antibody') ||
      category.includes('serology') ||
      category.includes('immunology')
    ) {
      return ['Non-Reactive', 'Reactive', 'Borderline / Indeterminate', 'Negative', 'Positive'];
    }

    // 2. Blood Grouping
    if (name.includes('blood group') || name.includes('abo') || name.includes('rhesus') || name.includes('rh')) {
      return [
        'A Positive (A+)', 
        'A Negative (A-)', 
        'B Positive (B+)', 
        'B Negative (B-)', 
        'AB Positive (AB+)', 
        'AB Negative (AB-)', 
        'O Positive (O+)', 
        'O Negative (O-)'
      ];
    }

    // 3. Pregnancy Testing (Beta hCG)
    if (name.includes('pregnancy') || name.includes('hcg') || name.includes('gestation')) {
      return ['Negative (Not Pregnant)', 'Positive (Pregnant)', 'Inconclusive / Retest'];
    }

    // 4. Malaria Rapid Test or Thick Blood Film Microscopy
    if (name.includes('malaria') || name.includes('geimsa') || name.includes('plasmodium')) {
      return [
        'No Trophozoites Seen (Negative)', 
        'Plasmodium falciparum Positive (1+)', 
        'Plasmodium falciparum Positive (2+)', 
        'Plasmodium falciparum Positive (3+)', 
        'Plasmodium vivax Positive',
        'Trophozoites Seen (1+)'
      ];
    }

    // 5. Stool Routine / Parasitology
    if (name.includes('stool') || name.includes('feces') || name.includes('parasit') || name.includes('ova')) {
      return [
        'No Ova, Cysts or Parasites Seen',
        'Entamoeba histolytica Cysts Present',
        'Giardia lamblia Cysts Present',
        'Ascaris lumbricoides Ova Present',
        'Hookworm Ova Present',
        'Yeast Cells Present (+)'
      ];
    }

    // 6. Urinalysis & Urine Chemistry (Protein, Glucose, Leukocytes, Nitrites)
    if (name.includes('urine') || name.includes('urinalysis')) {
      return ['Nil / Negative', 'Trace', '1+ (+)', '2+ (++)', '3+ (+++)', '4+ (++++)'];
    }

    // 7. Sputum AFB / Tuberculosis / GeneXpert
    if (name.includes('sputum') || name.includes('afb') || name.includes('tuberculosis') || name.includes('genexpert')) {
      return [
        'Acid Fast Bacilli (AFB) NOT Seen (Negative)',
        'AFB Seen (1+)',
        'AFB Seen (2+)',
        'AFB Seen (3+)',
        'MTB NOT Detected',
        'MTB Detected, Rifampicin Resistance NOT Detected'
      ];
    }

    // 8. Microbiology / Bacterial Culture & Sensitivity
    if (name.includes('culture') || name.includes('swab') || name.includes('sensitivity')) {
      return [
        'No Significant Bacterial Growth After 48 Hours',
        'Sterile / No Pathogenic Organisms Isolated',
        'Staphylococcus aureus Isolated',
        'Escherichia coli Isolated',
        'Klebsiella pneumoniae Isolated',
        'Pseudomonas aeruginosa Isolated'
      ];
    }

    // 9. Default Quantitative / Qualitative Choices
    return [
      'Normal / Within Reference Limits',
      'Abnormal / Elevated',
      'Abnormal / Decreased',
      'Negative',
      'Positive'
    ];
  };

  // Open Patient Booklet Modal
  const handleOpenPatientBooklet = async (booking: PatientBooking) => {
    setActiveBooking(booking);
    setSelectedTestIndex(0);
    setActiveOptionMode('form');
    setActionSuccessMessage('');
    setPdfUploadDataUrl(booking.pdfReportUrl || booking.externalPdfUrl || '');
    setUploadFileName('');

    // Load initial values for first test
    if (booking.tests && booking.tests.length > 0) {
      loadTestState(booking.tests[0]);
    }

    // Claim / Verify technologist assignment
    try {
      await limsService.claimOrVerifyTechAssignment({
        labId: targetLabId,
        bookingId: booking.id,
        techId: user?.id || 'tech-1',
        techName: user?.name || 'Medical Technologist'
      });
    } catch (err) {
      console.warn('Assignment claim notice:', err);
    }
  };

  // Live Biomedical Formula Computation Assistant
  const computeFormulas = (values: Record<string, string>, params: any[]) => {
    const newVals = { ...values };

    // 1. Packed Cell Volume (PCV), Red Blood Cells (RBC), Hemoglobin (Hb) -> MCV, MCH, MCHC
    const pcvVal = parseFloat(newVals['pcv'] || newVals['hematocrit'] || '');
    const rbcVal = parseFloat(newVals['rbc'] || '');
    const hbVal = parseFloat(newVals['hb'] || newVals['hemoglobin'] || '');

    if (!isNaN(pcvVal) && !isNaN(rbcVal) && rbcVal > 0) {
      if (params.some(p => p.id === 'mcv' || p.name.includes('MCV'))) {
        newVals['mcv'] = ((pcvVal * 10) / rbcVal).toFixed(1);
      }
    }
    if (!isNaN(hbVal) && !isNaN(rbcVal) && rbcVal > 0) {
      if (params.some(p => p.id === 'mch' || p.name.includes('MCH'))) {
        newVals['mch'] = ((hbVal * 10) / rbcVal).toFixed(1);
      }
    }
    if (!isNaN(hbVal) && !isNaN(pcvVal) && pcvVal > 0) {
      if (params.some(p => p.id === 'mchc' || p.name.includes('MCHC'))) {
        newVals['mchc'] = ((hbVal * 100) / pcvVal).toFixed(1);
      }
    }

    // 2. Albumin & Globulin -> A/G Ratio
    const albVal = parseFloat(newVals['albumin'] || newVals['alb'] || '');
    const globVal = parseFloat(newVals['globulin'] || newVals['glob'] || '');
    if (!isNaN(albVal) && !isNaN(globVal) && globVal > 0) {
      if (params.some(p => p.id === 'ag_ratio' || p.name.toLowerCase().includes('a/g'))) {
        newVals['ag_ratio'] = (albVal / globVal).toFixed(2);
      }
    }

    // 3. Total Bilirubin - Direct Bilirubin -> Indirect Bilirubin
    const totalBili = parseFloat(newVals['total_bilirubin'] || newVals['t_bili'] || '');
    const directBili = parseFloat(newVals['direct_bilirubin'] || newVals['d_bili'] || '');
    if (!isNaN(totalBili) && !isNaN(directBili)) {
      if (params.some(p => p.id === 'indirect_bilirubin' || p.name.toLowerCase().includes('indirect'))) {
        newVals['indirect_bilirubin'] = Math.max(0, totalBili - directBili).toFixed(2);
      }
    }

    // 4. Lipid Profile: Total Chol, HDL, Triglycerides -> Friedewald LDL
    const cholVal = parseFloat(newVals['total_cholesterol'] || newVals['cholesterol'] || '');
    const hdlVal = parseFloat(newVals['hdl'] || newVals['hdl_cholesterol'] || '');
    const tgVal = parseFloat(newVals['triglycerides'] || newVals['tg'] || '');
    if (!isNaN(cholVal) && !isNaN(hdlVal) && !isNaN(tgVal) && tgVal < 400) {
      if (params.some(p => p.id === 'ldl' || p.name.toLowerCase().includes('ldl'))) {
        newVals['ldl'] = Math.max(0, cholVal - hdlVal - (tgVal / 5)).toFixed(1);
      }
    }

    return newVals;
  };

  // Quick Fill Normal Reference Values across all subparameters
  const handleQuickFillNormalValues = () => {
    if (!activeBooking) return;
    const gender = activeBooking.patientGender || 'Male';
    const newVals: Record<string, string> = { ...activeSubParamValues };
    const newFlags: Record<string, 'Normal' | 'Low' | 'High' | 'Borderline' | 'Critical'> = { ...activeParamFlags };
    const newObs: Record<string, string> = { ...activeParamObservations };

    activeTestSubParameters.forEach(sp => {
      const min = gender === 'Female' ? sp.femaleMin : gender === 'Child' ? sp.childMin : sp.maleMin;
      const max = gender === 'Female' ? sp.femaleMax : gender === 'Child' ? sp.childMax : sp.maleMax;

      if (min !== undefined && max !== undefined) {
        const median = (min + max) / 2;
        newVals[sp.id] = Number.isInteger(median) ? String(median) : median.toFixed(1);
      } else if (sp.defaultValue) {
        newVals[sp.id] = sp.defaultValue;
      } else if (sp.refRangeWords && sp.refRangeWords.toLowerCase().includes('negative')) {
        newVals[sp.id] = 'Negative';
      } else {
        newVals[sp.id] = 'Normal';
      }

      newFlags[sp.id] = 'Normal';
      if (!newObs[sp.id]) {
        newObs[sp.id] = 'Norm / Expected morphology';
      }
    });

    const withFormulas = computeFormulas(newVals, activeTestSubParameters);
    setActiveSubParamValues(withFormulas);
    setActiveParamFlags(newFlags);
    setActiveParamObservations(newObs);

    if (!activeResultValue) {
      setActiveResultValue('Normal / Within Reference Limits');
    }
    setActionSuccessMessage('⚡ Populated baseline normal values across all parameters.');
  };

  // Add Custom Parameter Row Dynamically
  const handleAddCustomParam = () => {
    if (!customParamName.trim()) return;
    const newId = `custom-p-${Date.now()}`;
    const newParam: any = {
      id: newId,
      name: customParamName.trim(),
      unit: customParamUnit.trim(),
      sectionHeader: customParamSection.trim() || undefined,
      refRangeMale: customParamRefMale.trim() || 'Normal',
      refRangeFemale: customParamRefFemale.trim() || 'Normal',
      refRangeChild: customParamRefFemale.trim() || 'Normal',
      defaultValue: customParamDefaultVal.trim() || undefined,
      method: customParamMethod.trim() || undefined,
      printOnReport: true
    };

    const updated = [...activeTestSubParameters, newParam];
    setActiveTestSubParameters(updated);
    if (customParamDefaultVal) {
      setActiveSubParamValues({
        ...activeSubParamValues,
        [newId]: customParamDefaultVal.trim()
      });
    }
    setActiveParamPrintToggles({
      ...activeParamPrintToggles,
      [newId]: true
    });
    setActiveParamFlags({
      ...activeParamFlags,
      [newId]: 'Normal'
    });

    setCustomParamName('');
    setCustomParamUnit('');
    setCustomParamRefMale('');
    setCustomParamRefFemale('');
    setCustomParamSection('');
    setCustomParamMethod('');
    setCustomParamDefaultVal('');
    setShowAddCustomParamModal(false);
    setActionSuccessMessage(`✅ Added parameter "${newParam.name}" to this test.`);
  };

  // Add Section Sub-Header Dynamically
  const handleAddSectionHeader = () => {
    if (!newSectionTitle.trim()) return;
    const title = newSectionTitle.trim();
    const newId = `section-${Date.now()}`;
    const newSectionParam: any = {
      id: newId,
      name: title,
      unit: '',
      sectionHeader: title,
      refRangeMale: '',
      refRangeFemale: '',
      refRangeChild: '',
      parameterType: 'heading',
      printOnReport: true
    };

    setActiveTestSubParameters([...activeTestSubParameters, newSectionParam]);

    // Also support Guided Mode hierarchical params if active
    const currentTest = activeBooking?.tests?.[selectedTestIndex];
    if (currentTest) {
      const currentHier = (currentTest.hierarchicalParams && currentTest.hierarchicalParams.length > 0)
        ? currentTest.hierarchicalParams
        : (catalog.find(c => c.name?.toLowerCase() === currentTest.testName?.toLowerCase() || c.id === currentTest.testId)?.hierarchicalParams || []);

      const newHierItem = {
        name: `Observation ${title}`,
        section: title,
        defaultValue: 'Normal',
        unit: '',
        refRange: 'Negative / Normal'
      };

      setActiveBooking(prev => {
        if (!prev || !prev.tests) return prev;
        const updatedTests = [...prev.tests];
        if (updatedTests[selectedTestIndex]) {
          updatedTests[selectedTestIndex] = {
            ...updatedTests[selectedTestIndex],
            hierarchicalParams: [...currentHier, newHierItem]
          };
        }
        return { ...prev, tests: updatedTests };
      });
    }

    setNewSectionTitle('');
    setShowAddSectionModal(false);
    setActionSuccessMessage(`✅ Added section "${title}".`);
  };

  // Remove Single Custom Parameter
  const handleRemoveCustomParam = (paramId: string) => {
    setActiveTestSubParameters(activeTestSubParameters.filter(p => p.id !== paramId));
    const newVals = { ...activeSubParamValues };
    delete newVals[paramId];
    setActiveSubParamValues(newVals);
  };

  // Remove Section Header AND all parameters assigned to that section
  const handleRemoveSection = (sectionId: string, sectionName: string) => {
    const toDeleteIds = new Set<string>([sectionId]);
    activeTestSubParameters.forEach(p => {
      if (p.sectionHeader === sectionName || p.section === sectionName) {
        toDeleteIds.add(p.id);
      }
    });

    setActiveTestSubParameters(prev => prev.filter(p => !toDeleteIds.has(p.id)));

    const newVals = { ...activeSubParamValues };
    const newObs = { ...activeParamObservations };
    const newFlags = { ...activeParamFlags };
    toDeleteIds.forEach(id => {
      delete newVals[id];
      delete newObs[id];
      delete newFlags[id];
    });

    setActiveSubParamValues(newVals);
    setActiveParamObservations(newObs);
    setActiveParamFlags(newFlags);

    const deletedCount = toDeleteIds.size - 1;
    setActionSuccessMessage(
      deletedCount > 0
        ? `🗑️ Deleted section "${sectionName}" and its ${deletedCount} parameter(s).`
        : `🗑️ Deleted section "${sectionName}".`
    );
  };

  // Delete Section from Hierarchical Observations in Guided Mode
  const handleDeleteHierarchicalSection = (sectionName: string) => {
    const currentTest = activeBooking?.tests?.[selectedTestIndex];
    if (!currentTest) return;
    const currentHier = (currentTest.hierarchicalParams && currentTest.hierarchicalParams.length > 0)
      ? currentTest.hierarchicalParams
      : (catalog.find(c => c.name?.toLowerCase() === currentTest.testName?.toLowerCase() || c.id === currentTest.testId)?.hierarchicalParams || []);

    const updatedHier = currentHier.filter((p: any) => (p.section || 'Observation Template') !== sectionName);

    setActiveBooking(prev => {
      if (!prev || !prev.tests) return prev;
      const updatedTests = [...prev.tests];
      if (updatedTests[selectedTestIndex]) {
        updatedTests[selectedTestIndex] = {
          ...updatedTests[selectedTestIndex],
          hierarchicalParams: updatedHier
        };
      }
      return { ...prev, tests: updatedTests };
    });

    const newHierVals = { ...activeHierarchicalValues };
    currentHier.forEach((p: any, idx: number) => {
      if ((p.section || 'Observation Template') === sectionName) {
        const key = p.name || `hp-${idx}`;
        delete newHierVals[key];
      }
    });
    setActiveHierarchicalValues(newHierVals);

    setActionSuccessMessage(`🗑️ Deleted section "${sectionName}".`);
  };

  // Add Antibiotic Row to Antibiogram
  const handleAddAntibioticRow = () => {
    if (!newAntibioticName.trim()) return;
    const newRow = {
      id: `ab-${Date.now()}`,
      antibiotic: newAntibioticName.trim(),
      discPotency: newAntibioticPotency.trim() || '10 µg',
      zoneMm: newAntibioticZone.trim() || '20',
      sensitivity: newAntibioticSens
    };
    setActiveAntibiogram([...activeAntibiogram, newRow]);
    setNewAntibioticName('');
    setNewAntibioticPotency('10 µg');
    setNewAntibioticZone('20');
    setNewAntibioticSens('S');
    setShowAddAntibiogramRow(false);
    setActionSuccessMessage(`✅ Added antibiotic "${newRow.antibiotic}" to sensitivity matrix.`);
  };

  const handleRemoveAntibioticRow = (id: string) => {
    setActiveAntibiogram(activeAntibiogram.filter(a => a.id !== id));
  };

  // Load state when switching between tests inside the booklet modal
  const loadTestState = (test: BookingTestItem) => {
    setActiveResultValue(test.resultValue || '');
    setActiveClinicalNotes(test.labNotes || '');
    
    // Find master test definition or catalog definition
    const master = getMasterTest(test);
    const catItem = catalog.find(c => c.name?.toLowerCase() === test.testName?.toLowerCase() || c.id === test.testId);

    // Load sub-parameters list
    let initialParams: any[] = [];
    if (test.subParameters && test.subParameters.length > 0) {
      initialParams = [...test.subParameters];
    } else if (master?.subParameters && master.subParameters.length > 0) {
      initialParams = master.subParameters.map(sp => ({ ...sp }));
    } else if (catItem?.subParameters && catItem.subParameters.length > 0) {
      initialParams = catItem.subParameters.map((sp: any) => ({ ...sp }));
    }

    // If still empty and test has units/refRange, create a default root parameter
    if (initialParams.length === 0 && (test.units || master?.units || master?.refRangeMale)) {
      initialParams = [
        {
          id: test.testId || test.id || 'p-main',
          name: test.testName,
          unit: test.units || master?.units || '',
          refRangeMale: master?.refRangeMale || 'Normal',
          refRangeFemale: master?.refRangeFemale || 'Normal',
          refRangeChild: master?.refRangeChild || 'Normal',
          maleMin: master?.maleMin,
          maleMax: master?.maleMax,
          femaleMin: master?.femaleMin,
          femaleMax: master?.femaleMax,
          childMin: master?.childMin,
          childMax: master?.childMax,
          method: master?.method || ''
        }
      ];
    }

    setActiveTestSubParameters(initialParams);

    // Load sub-parameter values, observations, flags, print toggles
    const subObj: Record<string, string> = {};
    const obsObj: Record<string, string> = {};
    const flagsObj: Record<string, any> = {};
    const printObj: Record<string, boolean> = {};

    initialParams.forEach(sp => {
      subObj[sp.id] = sp.value !== undefined ? sp.value : (sp.defaultValue || '');
      obsObj[sp.id] = sp.resultInWords || sp.notes || sp.interpretation || '';
      flagsObj[sp.id] = sp.flag || (sp.isAbnormal ? 'High' : 'Normal');
      printObj[sp.id] = sp.printOnReport !== undefined ? sp.printOnReport : true;
    });

    setActiveSubParamValues(subObj);
    setActiveParamObservations(obsObj);
    setActiveParamFlags(flagsObj);
    setActiveParamPrintToggles(printObj);

    // Load hierarchical template values
    const hierObj: Record<string, string> = {};
    if (test.hierarchicalParams && test.hierarchicalParams.length > 0) {
      test.hierarchicalParams.forEach((hp: any, idx: number) => {
        hierObj[hp.name || `hp-${idx}`] = hp.value || hp.defaultValue || '';
      });
    } else if (catItem?.hierarchicalParams) {
      catItem.hierarchicalParams.forEach((hp: any, idx: number) => {
        hierObj[hp.name || `hp-${idx}`] = hp.defaultValue || '';
      });
    }
    setActiveHierarchicalValues(hierObj);

    // Load antibiogram (if any or culture test)
    if (test.antibiogram && test.antibiogram.length > 0) {
      setActiveAntibiogram(test.antibiogram.map((ab: any, idx: number) => ({
        id: ab.id || `ab-loaded-${idx}-${Date.now()}`,
        antibiotic: ab.antibiotic || '',
        discPotency: ab.discPotency || '',
        zoneMm: ab.zoneMm || '',
        sensitivity: ab.sensitivity || 'S'
      })));
    } else if ((test.category || '').toLowerCase().includes('microbiology') || (test.testName || '').toLowerCase().includes('culture') || (test.testName || '').toLowerCase().includes('sensitivity')) {
      setActiveAntibiogram([
        { id: 'ab-1', antibiotic: 'Amoxicillin + Clavulanic Acid (Augmentin)', discPotency: '20/10 µg', zoneMm: '22', sensitivity: 'S' },
        { id: 'ab-2', antibiotic: 'Ciprofloxacin (CIP)', discPotency: '5 µg', zoneMm: '26', sensitivity: 'S' },
        { id: 'ab-3', antibiotic: 'Ceftriaxone (CRO)', discPotency: '30 µg', zoneMm: '24', sensitivity: 'S' },
        { id: 'ab-4', antibiotic: 'Gentamicin (GEN)', discPotency: '10 µg', zoneMm: '18', sensitivity: 'I' },
        { id: 'ab-5', antibiotic: 'Cotrimoxazole (SXT)', discPotency: '1.25/23.75 µg', zoneMm: '11', sensitivity: 'R' }
      ]);
    } else {
      setActiveAntibiogram([]);
    }

    // Load reagents used if any
    setActiveReagentsUsed(test.reagentsUsed || []);

    // Load Two-Column Template and Working Results
    const defaultTemplate = (test as any).templateContent || master?.description || 
      `EXAMINATION PROTOCOL & STANDARD REFERENCE:
Test Name: ${test.testName}
Category: ${test.category || 'Clinical Pathology'}
Sample Matrix: ${test.sampleTypeRequired || 'Whole Blood / Serum'}
Methodology: Colorimetric / Enzymatic Automated Analyzer (ISO 15189 Standard)

STANDARD NORMAL REFERENCE VALUES:
• Male Adults: ${master?.refRangeMale || 'Normal'}
• Female Adults: ${master?.refRangeFemale || 'Normal'}
• Children / Pediatric: ${master?.refRangeChild || 'Normal'}

CLINICAL REAGENTS USED:
• Certified standard lot controls calibrated against international biological standards.`;

    setTemplateText(defaultTemplate);
    setResultRichText((test as any).richResultText || (test.resultValue ? `RESULT OBSERVATION:\n${test.resultValue}\n\nTECHNICIAN NOTES:\n${test.labNotes || 'Within biological reference limit.'}` : ''));
  };

  // Add additional test or non-test billable act directly to current patient booking
  const handleAddTestToCurrentBooking = async (testToAdd: any) => {
    if (!activeBooking) return;
    const newTestItem: BookingTestItem = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      testId: testToAdd.id,
      testCode: testToAdd.actCode || testToAdd.code || 'ACT-LAB',
      testName: testToAdd.name || testToAdd.testName,
      category: testToAdd.category || 'General',
      sampleTypeRequired: testToAdd.sampleType || testToAdd.sampleTypeRequired || 'Venous Blood',
      price: testToAdd.price || 4500,
      status: 'In_Lab_Testing',
      units: testToAdd.units || '',
      subParameters: testToAdd.subParameters || [],
      hierarchicalParams: testToAdd.hierarchicalParams || []
    };

    const updatedTests = [...(activeBooking.tests || []), newTestItem];
    const newTotalAmount = (activeBooking.totalAmount || 0) + (newTestItem.price || 0);
    const updatedBooking = {
      ...activeBooking,
      tests: updatedTests,
      totalAmount: newTotalAmount
    };

    setActiveBooking(updatedBooking);
    setSelectedTestIndex(updatedTests.length - 1);
    loadTestState(newTestItem);
    setShowAddTestModal(false);

    try {
      await updateDoc(doc(db, 'labs', targetLabId, 'bookings', activeBooking.id), {
        tests: updatedTests,
        totalAmount: newTotalAmount,
        updatedAt: new Date().toISOString()
      });
      setActionSuccessMessage(`✅ Added "${newTestItem.testName}" (${newTestItem.testCode}) to patient booklet.`);
      fetchData();
    } catch (e) {
      console.error('Error adding test to booking:', e);
    }
  };

  const handleSelectTestInBooklet = (idx: number) => {
    if (!activeBooking || !activeBooking.tests) return;
    setSelectedTestIndex(idx);
    loadTestState(activeBooking.tests[idx]);
    setActionSuccessMessage('');
  };

  // Add Reagent to current test with strict stock level verification
  const [reagentStockError, setReagentStockError] = useState('');

  const handleAddReagentToTest = () => {
    setReagentStockError('');
    if (!selectedReagentIdToAdd) return;
    const foundItem = validUnexpiredReagents.find(r => r.id === selectedReagentIdToAdd);
    if (!foundItem) return;

    const availableStock = foundItem.quantity || 0;
    if (availableStock <= 0) {
      setReagentStockError(`Reagent "${foundItem.name}" is completely out of stock / finished (Balance: 0 ${foundItem.unit || 'Units'}). Please request the Administrator to refill inventory.`);
      return;
    }

    const existingItem = activeReagentsUsed.find(r => r.reagentId === foundItem.id);
    const existingQty = existingItem ? existingItem.quantity : 0;
    const totalRequestedQty = existingQty + reagentQtyToAdd;

    if (totalRequestedQty > availableStock) {
      setReagentStockError(`Insufficient stock for "${foundItem.name}". Available balance is ${availableStock} ${foundItem.unit || 'Units'}. You are attempting to deduct ${totalRequestedQty} ${foundItem.unit || 'Units'}.`);
      return;
    }

    const existingIdx = activeReagentsUsed.findIndex(r => r.reagentId === foundItem.id);
    if (existingIdx >= 0) {
      // Update quantity
      const updated = [...activeReagentsUsed];
      updated[existingIdx].quantity += reagentQtyToAdd;
      setActiveReagentsUsed(updated);
    } else {
      setActiveReagentsUsed([
        ...activeReagentsUsed,
        {
          reagentId: foundItem.id,
          reagentName: foundItem.name,
          quantity: reagentQtyToAdd,
          unit: reagentUnitToAdd || foundItem.unit || 'Units'
        }
      ]);
    }

    // Reset selection input
    setSelectedReagentIdToAdd('');
    setReagentQtyToAdd(1);
  };

  const handleRemoveReagentFromTest = (reagentId: string) => {
    setActiveReagentsUsed(activeReagentsUsed.filter(r => r.reagentId !== reagentId));
  };

  // Save / Validate Single Test Item
  const handleSaveCurrentTest = async () => {
    if (!activeBooking || !activeBooking.tests) return;
    const currentTest = activeBooking.tests[selectedTestIndex];
    if (!currentTest) return;

    setIsSavingTest(true);
    setActionSuccessMessage('');

    try {
      const techName = user?.name || 'Medical Technologist';

      // Construct enriched subParameters with values, flags, observations, print toggles
      const fullSubParameters = activeTestSubParameters.map(sp => ({
        ...sp,
        value: activeSubParamValues[sp.id] !== undefined ? activeSubParamValues[sp.id] : (sp.defaultValue || ''),
        resultInWords: activeParamObservations[sp.id] || '',
        flag: activeParamFlags[sp.id] || 'Normal',
        printOnReport: activeParamPrintToggles[sp.id] !== false
      }));

      const hasAbnormal = fullSubParameters.some(sp => sp.flag && sp.flag !== 'Normal');
      const calculatedFlag = hasAbnormal ? 'High' : 'Normal';

      const success = await limsService.submitIndividualTestResult({
        labId: targetLabId,
        bookingId: activeBooking.id,
        testId: currentTest.id || currentTest.testId || '',
        resultValue: activeResultValue || (fullSubParameters.length > 0 ? (fullSubParameters[0].value || 'Normal') : 'Normal'),
        resultFlag: calculatedFlag,
        subParams: activeSubParamValues,
        fullSubParameters,
        hierarchicalParams: currentTest.hierarchicalParams,
        antibiogram: activeAntibiogram,
        notes: activeClinicalNotes,
        techName,
        reagentsUsed: activeReagentsUsed
      });

      if (success) {
        setActionSuccessMessage(`✅ Successfully validated "${currentTest.testName}". All parameters & flags recorded.`);
        
        // Update local active booking
        const updatedTests = [...activeBooking.tests];
        updatedTests[selectedTestIndex] = {
          ...currentTest,
          resultValue: activeResultValue || (fullSubParameters.length > 0 ? fullSubParameters[0].value : 'Normal'),
          status: 'Completed',
          subParameters: fullSubParameters,
          antibiogram: activeAntibiogram,
          labNotes: activeClinicalNotes,
          reagentsUsed: activeReagentsUsed,
          completedAt: new Date().toISOString(),
          completedBy: techName
        };

        const allDone = updatedTests.every(t => t.status === 'Completed');
        const updatedBooking = {
          ...activeBooking,
          tests: updatedTests,
          overallStatus: allDone ? ('Completed' as const) : ('In_Lab_Testing' as const)
        };
        setActiveBooking(updatedBooking);

        // Refresh global queue
        fetchData();
      }
    } catch (err) {
      console.error('Error saving individual test result:', err);
    } finally {
      setIsSavingTest(false);
    }
  };

  // Save Result from Dual-Mode MS Access/Excel Split-Screen Clinical Entry Module
  const handleSaveFromSplitScreenResult = async (result: PatientExamResult) => {
    if (!activeBooking || !activeBooking.tests) return;
    const currentTest = activeBooking.tests[selectedTestIndex];
    if (!currentTest) return;

    setIsSavingTest(true);
    try {
      const techName = user?.name || 'Medical Technologist';

      const paramEntries = Object.entries(result.parameterValues || {});
      const subParamsMap: Record<string, string> = {};
      const fullSubParameters = paramEntries.map(([key, val]) => {
        const valStr = String(val || '');
        subParamsMap[key] = valStr;
        return {
          id: key,
          name: key.replace(/_/g, ' '),
          value: valStr,
          unit: '',
          refRangeMale: 'Normal',
          refRangeFemale: 'Normal',
          refRangeChild: 'Normal',
          flag: 'Normal' as const,
          printOnReport: true
        };
      });

      const primaryVal: string = (result.clinicalInterpretation && result.clinicalInterpretation.trim())
        ? result.clinicalInterpretation
        : (fullSubParameters.length > 0 ? fullSubParameters[0].value : 'Normal');

      const success = await limsService.submitIndividualTestResult({
        labId: targetLabId,
        bookingId: activeBooking.id,
        testId: currentTest.id || currentTest.testId || '',
        resultValue: primaryVal,
        resultFlag: 'Normal',
        subParams: subParamsMap,
        fullSubParameters,
        notes: result.technicianNotes || '',
        techName,
        reagentsUsed: activeReagentsUsed
      });

      if (success) {
        setActionSuccessMessage(`✅ Clinical examination "${currentTest.testName}" recorded & locked successfully via Dual-Mode Workstation.`);

        const updatedTests = [...activeBooking.tests];
        updatedTests[selectedTestIndex] = {
          ...currentTest,
          resultValue: primaryVal,
          status: 'Completed',
          subParameters: fullSubParameters,
          labNotes: result.technicianNotes,
          completedAt: new Date().toISOString(),
          completedBy: techName
        };

        const allDone = updatedTests.every(t => t.status === 'Completed');
        const updatedBooking = {
          ...activeBooking,
          tests: updatedTests,
          overallStatus: allDone ? ('Completed' as const) : ('In_Lab_Testing' as const)
        };
        setActiveBooking(updatedBooking);
        fetchData();
      }
    } catch (err) {
      console.error('Error saving split-screen exam result:', err);
    } finally {
      setIsSavingTest(false);
    }
  };

  // Submit Whole Patient Booklet
  const handleSubmitWholeBooklet = async () => {
    if (!activeBooking || !activeBooking.tests) return;

    setIsSubmittingBooklet(true);
    setActionSuccessMessage('');

    try {
      const techName = user?.name || 'Medical Technologist';

      // Save current test first to capture uncommitted form fields
      const testResultsMap: Record<string, { 
        resultValue?: string; 
        resultFlag?: 'Normal' | 'Low' | 'High' | 'Borderline';
        subParams?: Record<string, string>; 
        fullSubParameters?: any[];
        hierarchicalParams?: any[];
        antibiogram?: any[];
        reagentsUsed?: any[];
        notes?: string;
      }> = {};

      activeBooking.tests.forEach((t, i) => {
        const testKey = t.id;
        if (i === selectedTestIndex) {
          const fullSubParameters = activeTestSubParameters.map(sp => ({
            ...sp,
            value: activeSubParamValues[sp.id] !== undefined ? activeSubParamValues[sp.id] : (sp.defaultValue || ''),
            resultInWords: activeParamObservations[sp.id] || '',
            flag: activeParamFlags[sp.id] || 'Normal',
            printOnReport: activeParamPrintToggles[sp.id] !== false
          }));

          const hasAbnormal = fullSubParameters.some(sp => sp.flag && sp.flag !== 'Normal');

          testResultsMap[testKey] = {
            resultValue: activeResultValue || (fullSubParameters.length > 0 ? (fullSubParameters[0].value || 'Normal') : 'Normal'),
            resultFlag: hasAbnormal ? 'High' : 'Normal',
            subParams: activeSubParamValues,
            fullSubParameters,
            hierarchicalParams: t.hierarchicalParams,
            antibiogram: activeAntibiogram,
            reagentsUsed: activeReagentsUsed,
            notes: activeClinicalNotes
          };
        } else {
          const spMap: Record<string, string> = {};
          if (t.subParameters) {
            t.subParameters.forEach(sp => { spMap[sp.id] = sp.value || ''; });
          }
          testResultsMap[testKey] = {
            resultValue: t.resultValue || 'Normal',
            subParams: spMap,
            fullSubParameters: t.subParameters,
            hierarchicalParams: t.hierarchicalParams,
            antibiogram: t.antibiogram,
            reagentsUsed: t.reagentsUsed,
            notes: t.labNotes || ''
          };
        }
      });

      const success = await limsService.submitFormResults({
        labId: targetLabId,
        bookingId: activeBooking.id,
        testResultsMap,
        techName
      });

      if (success) {
        // Also deduct custom reagents if any
        if (activeReagentsUsed.length > 0) {
          await limsService.deductCustomReagents(targetLabId, activeReagentsUsed);
        }

        setActionSuccessMessage(`🎉 Patient Booklet ${activeBooking.bookingCode} completed and submitted for Biologist review!`);
        await fetchData();
        setTimeout(() => {
          setActiveBooking(null);
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting whole patient booklet:', err);
    } finally {
      setIsSubmittingBooklet(false);
    }
  };

  // Option 2: Upload External Result PDF / Image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPdfUploadDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    if (!activeBooking || !pdfUploadDataUrl) return;
    setIsUploading(true);
    try {
      const techName = user?.name || 'Medical Technologist';
      const targetTestId = uploadTargetScope === 'specific'
        ? (uploadTargetTestId || activeBooking.tests[selectedTestIndex]?.id || activeBooking.tests[selectedTestIndex]?.testId)
        : 'all';

      const success = await limsService.uploadExternalPdfResult({
        labId: targetLabId,
        bookingId: activeBooking.id,
        externalPdfUrl: pdfUploadDataUrl,
        techName,
        targetTestId
      });

      if (success) {
        setActionSuccessMessage(
          uploadTargetScope === 'specific'
            ? '✅ External Test PDF attached & individual test validated.'
            : '✅ Consolidated Diagnostic Batch Report uploaded & attached to entire order.'
        );
        await fetchData();
        setTimeout(() => {
          setActiveBooking(null);
        }, 1200);
      }
    } catch (err) {
      console.error('Error uploading external pdf:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Option 3: Physical Pickup SMS Alert
  const handleTriggerPhysicalPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setPickupError('');
    if (!activeBooking) return;

    if (!pickupPasscode.trim()) {
      setPickupError('Please enter your technician authorization access code.');
      return;
    }

    try {
      const res = await limsService.triggerPhysicalPickupAlert({
        labId: targetLabId,
        bookingId: activeBooking.id,
        passcode: pickupPasscode.trim(),
        techName: user?.name || 'Medical Technologist'
      });

      if (res.success) {
        setPickupSuccess(true);
        setActionSuccessMessage('🔔 Physical Hard-Copy Pickup SMS dispatched to patient!');
        await fetchData();
        setTimeout(() => {
          setActiveBooking(null);
        }, 1500);
      } else {
        setPickupError(res.error || 'Failed to dispatch pickup alert.');
      }
    } catch (err: any) {
      setPickupError(err.message || 'Passcode verification failed.');
    }
  };

  // Filter Bookings Queue
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Exclude orders that haven't had phlebotomy / sample collection verified yet (unless virtual result requested)
      const isVirtualOrder = Boolean(b.virtualRequested || b.deliveryMethod === 'Virtual' || b.deliveryMethod === 'Email' || b.deliveryMethod === 'virtual' || b.tests?.some(t => t.virtualRequested));
      const sampleReady = b.sampleCollected || b.adminSampleVerified || b.overallStatus === 'In_Lab_Testing' || b.overallStatus === 'Completed' || isVirtualOrder;
      if (!sampleReady) return false;

      // Filter Tabs
      if (activeFilterTab === 'in_testing' && b.overallStatus === 'Completed') return false;
      if (activeFilterTab === 'completed' && b.overallStatus !== 'Completed') return false;
      if (activeFilterTab === 'virtual' && !isVirtualOrder) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.patientName.toLowerCase().includes(q);
        const matchCode = b.bookingCode.toLowerCase().includes(q);
        const matchPid = (b.patientPid || '').toLowerCase().includes(q);
        const matchTest = b.tests?.some(t => t.testName.toLowerCase().includes(q));
        if (!matchName && !matchCode && !matchPid && !matchTest) return false;
      }

      return true;
    });
  }, [bookings, activeFilterTab, searchQuery]);

  // Current working test in modal
  const currentTestInModal = activeBooking?.tests?.[selectedTestIndex];
  const masterDef = currentTestInModal ? getMasterTest(currentTestInModal) : undefined;
  const predictiveChoices = currentTestInModal ? getPredictiveChoices(currentTestInModal) : [];

  return (
    <div className="space-y-6">
      <Header
        title="Medical Technologist Diagnostic Station"
        subtitle="Step 4: Specimen processing, analytical values, predictive entry & reagent inventory deduction"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
        onRoleSwitcherPress={onRoleSwitcherPress}
      />

      {/* Staff Hero Banner */}
      <StaffHeroBanner
        workstationNumber="Workstation 04"
        workstationTitle="Laboratory Technologist Analytical Desk"
        description="Process verified biological specimens, input multi-parameter biochemical values, utilize smart predictive answer chips, log reagent consumption, and dispatch results virtually or for front desk physical pickup."
        gradientFrom="from-teal-950"
        gradientVia="from-slate-900"
        gradientTo="to-emerald-950"
        borderColor="border-teal-800"
        badgeBg="bg-teal-400 text-slate-950"
        rightBadge={
          <div className="text-right bg-teal-950/80 p-4 rounded-2xl border border-teal-700/60 shadow-md">
            <div className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">Active Tech Queue</div>
            <div className="text-2xl font-black text-teal-300 font-mono mt-0.5">{filteredBookings.length} Patients</div>
          </div>
        }
      />

      {/* Action Filters & Search Toolbar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Orders', count: bookings.length },
            { id: 'in_testing', label: 'In Lab Testing', count: bookings.filter(b => b.overallStatus === 'In_Lab_Testing').length },
            { id: 'virtual', label: '📱 Virtual Dispatch', count: bookings.filter(b => b.virtualRequested || b.deliveryMethod === 'Virtual' || b.deliveryMethod === 'Email' || b.deliveryMethod === 'virtual' || b.tests?.some(t => t.virtualRequested)).length },
            { id: 'completed', label: 'Completed', count: bookings.filter(b => b.overallStatus === 'Completed').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterTab === tab.id
                  ? 'bg-white text-teal-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeFilterTab === tab.id ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Field & Template Builder Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search patient, PID, booking code or test..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowResultTemplateModal(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer shadow-2xs"
            title="Open Result Template Builder & Custom Grid Library"
          >
            <FileCode2 className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">Result Templates</span>
          </button>
        </div>
      </div>

      {/* Patient Queue Cards Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <FlaskConical className="w-10 h-10 text-teal-600 animate-pulse mx-auto" />
          <p className="text-xs font-bold text-slate-500">Synchronizing Laboratory Workbench Queue...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <TestTube className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Patient Orders in this Queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All validated phlebotomy samples have either been processed or no matching patient records were found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBookings.map(b => {
            const isCompleted = b.overallStatus === 'Completed' || b.labTechSigned;
            const isVirtual = b.virtualRequested || b.deliveryMethod === 'Virtual' || b.deliveryMethod === 'Email';
            const totalTests = b.tests?.length || 1;
            const completedTestsCount = b.tests?.filter(t => t.status === 'Completed').length || 0;

            return (
              <div
                key={b.id}
                onClick={() => handleOpenPatientBooklet(b)}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                {/* Top Row: Booking Code & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                    {b.bookingCode}
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isVirtual && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        Virtual
                      </span>
                    )}

                    {isCompleted ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        In Testing
                      </span>
                    )}
                  </div>
                </div>

                {/* Patient Information */}
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {b.patientName}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                    <span>PID: <strong>{b.patientPid || b.patientId}</strong></span>
                    <span>•</span>
                    <span>{b.patientGender || 'Adult'}</span>
                    <span>•</span>
                    <span>{b.patientAge || '28'} yrs</span>
                  </div>
                </div>

                {/* Test Panel Summary & Progress */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                      Patient Booklet
                    </span>
                    <span className="font-mono text-[11px] font-bold text-teal-800">
                      {completedTestsCount} / {totalTests} Done
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(completedTestsCount / totalTests) * 100}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-500 truncate">
                    {b.tests?.map(t => t.testName).join(', ') || 'Diagnostic Panel'}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
                  <span>Open Patient Booklet</span>
                  <div className="w-7 h-7 rounded-xl bg-teal-50 group-hover:bg-teal-600 group-hover:text-white transition-colors flex items-center justify-center">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PATIENT BOOKLET MODAL (PRIMARY REQUIREMENT)           */}
      {/* ======================================================== */}
      {activeBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-[97vw] 2xl:max-w-7xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95">
            
            {/* Modal Header: Patient Name & Basic Info Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-4 sm:p-5 border-b border-teal-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    Patient Diagnostic Booklet
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-300">
                    Order: {activeBooking.bookingCode}
                  </span>
                  {activeBooking.virtualRequested && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      Virtual Delivery Requested
                    </span>
                  )}
                  {activeBooking.adminSampleVerified && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" />
                      Phlebotomy Validated
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {activeBooking.patientName}
                </h2>

                <div className="text-xs text-slate-300 flex items-center gap-3 flex-wrap">
                  <span>PID: <strong className="font-mono text-teal-300">{activeBooking.patientPid || activeBooking.patientId}</strong></span>
                  <span>•</span>
                  <span>Gender: <strong>{activeBooking.patientGender || 'Adult'}</strong></span>
                  <span>•</span>
                  <span>Age: <strong>{activeBooking.patientAge || '28'} yrs</strong></span>
                  {activeBooking.patientPhone && (
                    <>
                      <span>•</span>
                      <span>Phone: <strong>{activeBooking.patientPhone}</strong></span>
                    </>
                  )}
                  {activeBooking.referringDoctor && (
                    <>
                      <span>•</span>
                      <span>Doctor: <strong className="text-teal-300">{activeBooking.referringDoctor}</strong></span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview PDF</span>
                </button>
                <button
                  onClick={() => setActiveBooking(null)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {actionSuccessMessage && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {/* Modal Body: Booked Tests Sidebar + Main Workstation Canvas */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-50/50">
              
              {/* Leftmost Column: Booked & Validated Tests Box (Tests In Booklet) */}
              <div className="lg:col-span-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    Booked Tests ({activeBooking.tests?.length || 0})
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Validated by Phlebotomist</span>
                </div>

                <div className="space-y-2 max-h-[50vh] lg:max-h-[62vh] overflow-y-auto pr-1">
                  {activeBooking.tests?.map((test, idx) => {
                    const isSelected = selectedTestIndex === idx;
                    const isDone = test.status === 'Completed';

                    return (
                      <div
                        key={test.id || idx}
                        onClick={() => handleSelectTestInBooklet(idx)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                          isSelected
                            ? 'bg-teal-50/90 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                            : isDone
                            ? 'bg-white border-emerald-200 hover:bg-slate-50'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                            {test.category || 'General'}
                          </span>
                          {isDone ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Done
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.2 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-extrabold text-slate-900">{test.testName}</h4>
                        
                        {test.resultValue && (
                          <div className="text-[11px] text-teal-900 font-mono font-bold">
                            Result: {test.resultValue} {test.units || ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Whole Booklet Submit Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSubmitWholeBooklet}
                    disabled={isSubmittingBooklet}
                    className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingBooklet ? 'Submitting Booklet...' : 'Submit Entire Patient Booklet'}</span>
                  </button>
                </div>
              </div>

              {/* Main Workstation: Selected Test Canvas */}
              <div className="lg:col-span-9 space-y-4">
                {currentTestInModal ? (
                  <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-5">
                    
                    {/* Selected Test Details Header */}
                    <div className="border-b border-slate-100 pb-3 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-800 shrink-0">
                            <FlaskConical className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-black text-slate-900">
                                {currentTestInModal.testName}
                              </h3>
                              {currentTestInModal.testCode && (
                                <span className="text-[11px] font-mono font-black bg-teal-50 text-teal-800 px-2 py-0.5 rounded-lg border border-teal-200">
                                  {currentTestInModal.testCode}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono">
                              Category: {currentTestInModal.category} • Sample: {masterDef?.sampleType || currentTestInModal.sampleType || 'Venous Blood'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowA4BatchModal(true)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                            title="Open A4 Letter / Canva Blank Canvas for this test and batch"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>A4 Canvas (Canva Style)</span>
                          </button>

                          {masterDef?.turnaroundTime && (
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl hidden sm:flex items-center gap-1">
                              <Clock className="w-3 h-3 text-teal-600" />
                              TAT: {masterDef.turnaroundTime}
                            </span>
                          )}
                        </div>
                      </div>

                      {masterDef?.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                          {masterDef.description}
                        </p>
                      )}
                    </div>

                    {/* Response Method Tabs - STRICTLY TWO TABS */}
                    <div className="space-y-4">
                      {/* Sample & Specimen Info Header Box (Available for both methods) */}
                      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
                              <TestTube className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Specimen & Sample Information</div>
                              <div className="text-xs font-black text-white flex items-center gap-1.5">
                                <span>{masterDef?.sampleType || currentTestInModal.sampleType || 'Venous Whole Blood'}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-teal-400 font-mono">{activeBooking.bookingCode || `Tube #ST-${activeBooking.bookingCode || '01'}-${selectedTestIndex + 1}`}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-right">
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase font-bold">Patient / Order</div>
                              <div className="text-xs font-semibold text-white">
                                {activeBooking.patientName} <span className="text-slate-400">({activeBooking.patientGender || 'Adult'}, {activeBooking.patientAge || '32'}y)</span>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-bold">
                              {currentTestInModal.status || 'In Testing'}
                            </span>
                          </div>
                        </div>

                        {/* Quick Clinical Template Selector Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                              Select Clinical Template:
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Click to pre-fill {activeOptionMode === 'a4_canvas' ? 'Canvas' : 'Analyzer Findings'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                            {A4_CLINICAL_TEMPLATES.map((tpl) => (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => {
                                  if (activeOptionMode === 'a4_canvas') {
                                    setActiveBooking(prev => {
                                      if (!prev) return null;
                                      const updatedTests = [...prev.tests];
                                      if (updatedTests[selectedTestIndex]) {
                                        updatedTests[selectedTestIndex] = {
                                          ...updatedTests[selectedTestIndex],
                                          richReportHtml: tpl.html,
                                        };
                                      }
                                      return { ...prev, tests: updatedTests };
                                    });
                                    setActionSuccessMessage(`📋 Template "${tpl.name}" applied to Canvas!`);
                                    setTimeout(() => setActionSuccessMessage(''), 3000);
                                  } else {
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = tpl.html;
                                    const cleanText = tempDiv.innerText || tempDiv.textContent || '';
                                    setAnalyzerFindings(cleanText.trim());
                                    setActionSuccessMessage(`📋 Template "${tpl.name}" loaded into Analyzer Findings!`);
                                    setTimeout(() => setActionSuccessMessage(''), 3000);
                                  }
                                }}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-teal-900/60 text-slate-200 hover:text-teal-200 border border-slate-700 hover:border-teal-500/50 rounded-xl text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
                                title={tpl.name}
                              >
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>{tpl.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* TWO TABS TOGGLE */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setActiveOptionMode('a4_canvas')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            activeOptionMode === 'a4_canvas'
                              ? 'bg-teal-700 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 bg-white/70'
                          }`}
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>1. Result by Canvas (A4 Sheet)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveOptionMode('document')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            activeOptionMode === 'document'
                              ? 'bg-teal-700 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 bg-white/70'
                          }`}
                        >
                          <FileCheck className="w-4 h-4 text-teal-300" />
                          <span>2. Result by Document (Analyzer)</span>
                        </button>
                      </div>

                      {/* ======================================================== */}
                      {/* TAB 1: RESULT BY CANVAS (A4 SHEET)                       */}
                      {/* ======================================================== */}
                      {activeOptionMode === 'a4_canvas' && (
                        <div className="rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                          <A4CanvasResultEditor
                            booking={activeBooking}
                            initialTestIndex={selectedTestIndex}
                            onSaveIndividualTest={(idx, html, summary) => {
                              setActiveBooking(prev => {
                                if (!prev) return null;
                                const updatedTests = [...prev.tests];
                                if (updatedTests[idx]) {
                                  updatedTests[idx] = {
                                    ...updatedTests[idx],
                                    richReportHtml: html,
                                    resultValue: summary,
                                    status: 'Completed',
                                    completedAt: new Date().toISOString()
                                  };
                                }
                                return { ...prev, tests: updatedTests };
                              });

                              setSavedPrompt({
                                isOpen: true,
                                testIndex: idx,
                                testName: activeBooking.tests[idx]?.testName || `Test ${idx + 1}`
                              });
                            }}
                            onSaveAllTests={(allTests) => {
                              setActiveBooking(prev => {
                                if (!prev) return null;
                                const updatedTests = [...prev.tests];
                                allTests.forEach(({ testIndex, richHtml, summary }) => {
                                  if (updatedTests[testIndex]) {
                                    updatedTests[testIndex] = {
                                      ...updatedTests[testIndex],
                                      richReportHtml: richHtml,
                                      resultValue: summary,
                                      status: 'Completed',
                                      completedAt: new Date().toISOString()
                                    };
                                  }
                                });
                                return { ...prev, tests: updatedTests, status: 'Completed' };
                              });

                              setSavedPrompt({
                                isOpen: true,
                                testIndex: selectedTestIndex,
                                testName: 'Consolidated Batch Results'
                              });
                            }}
                            onPrintPreview={(bookingObj: any) => {
                              // Use selectedTestIndex directly since tIdx does not exist here
                              setSelectedTestIndexForPdf(selectedTestIndex);
                              setShowPdfModal(true);
                            }}
                            
                            
                          />
                        </div>
                      )}

                      {/* ======================================================== */}
                      {/* TAB 2: RESULT BY DOCUMENT (ANALYZER)                     */}
                      {/* ======================================================== */}
                      {activeOptionMode === "document" && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                                <Microscope className="w-5 h-5 text-teal-700" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900">Analyzer Diagnostic Output & Document Link</h4>
                                <p className="text-xs text-slate-500">Record machine analyzer parameters, upload digital printouts, or attach cloud links.</p>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                              LIS Bridge Active
                            </span>
                          </div>

                          {/* Analyzer Machine Selection & Presets */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                              Analyzer Machine Name / Model:
                            </label>
                            <input
                              type="text"
                              value={analyzerName}
                              onChange={e => setAnalyzerName(e.target.value)}
                              placeholder="e.g. Mindray BC-5000, Sysmex XN-550, Roche Cobas c311..."
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            {/* Preset chips */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Quick Select:</span>
                              {["Mindray BC-5000", "Sysmex XN-550", "Roche Cobas c311", "Abbott Architect ci4100", "Bio-Rad D-10", "Biomerieux VITEK 2", "Siemens Dimension EXL"].map(machine => (
                                <button
                                  key={machine}
                                  type="button"
                                  onClick={() => setAnalyzerName(machine)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    analyzerName === machine
                                      ? "bg-teal-700 text-white shadow-xs"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {machine}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cloud / LIS Result URL Link */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <LinkIcon className="w-3.5 h-3.5 text-teal-600" />
                                Analyzer Result Link / LIS Cloud URL:
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">Optional network endpoint</span>
                            </label>
                            <input
                              type="url"
                              value={analyzerLink}
                              onChange={e => setAnalyzerLink(e.target.value)}
                              placeholder="https://lis.labnet.internal/reports/export/BC-98421 or HL7 repository URL..."
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          {/* File Document Upload Area */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                              Upload Analyzer Printout / Diagnostic Document:
                            </label>
                            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-teal-50/30 transition-all space-y-2.5">
                              <Upload className="w-8 h-8 text-teal-600 mx-auto" />
                              <div>
                                <label className="text-xs font-bold text-teal-700 hover:underline cursor-pointer">
                                  <span>Click to select analyzer file</span>
                                  <input
                                    type="file"
                                    accept="application/pdf,image/*,.csv,.txt,.xlsx"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                  />
                                </label>
                                <span className="text-xs text-slate-500"> or drag and drop (PDF, CSV, TXT, Images)</span>
                              </div>
                              {uploadFileName ? (
                                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-teal-800 bg-teal-100/70 border border-teal-300 px-3 py-1.5 rounded-xl">
                                  <FileCheck className="w-4 h-4 text-teal-700" />
                                  <span>{uploadFileName}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUploadFileName("");
                                      setPdfUploadDataUrl("");
                                    }}
                                    className="text-teal-900 hover:text-red-600 font-bold ml-1 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-400">Supported formats: PDF output, CSV tabular export, or high-res photo scan</p>
                              )}
                            </div>
                          </div>

                          {/* Analyzer Quantitative Measurements & Clinical Findings */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700">
                                Analyzer Quantitative Values & Summary Findings:
                              </label>
                              <span className="text-[10px] text-slate-400">
                                Pre-filled by template above or typed manually
                              </span>
                            </div>
                            <textarea
                              rows={5}
                              value={analyzerFindings}
                              onChange={e => setAnalyzerFindings(e.target.value)}
                              placeholder="Enter or paste measured parameters from analyzer: e.g. Hb: 13.8 g/dL, WBC: 6.4 x 10^3/uL, Platelets: 245 x 10^3/uL... All calibrations in range."
                              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                            />
                          </div>

                          {/* Choose Scope */}
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <label className="block text-xs font-bold text-slate-700">Apply Document Result To:</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <button
                                type="button"
                                onClick={() => setUploadTargetScope("specific")}
                                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                  uploadTargetScope === "specific"
                                    ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20"
                                    : "bg-white border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <TestTube className="w-4 h-4 text-teal-600" />
                                  <span>Specific Test Only: {currentTestInModal.testName}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">Records document specifically for this test card.</p>
                              </button>

                              <button
                                type="button"
                                onClick={() => setUploadTargetScope("batch")}
                                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                  uploadTargetScope === "batch"
                                    ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20"
                                    : "bg-white border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <FileCheck className="w-4 h-4 text-teal-600" />
                                  <span>Full Batch (All {activeBooking.tests.length} Tests)</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">Applies analyzer printout to entire patient booklet.</p>
                              </button>
                            </div>
                          </div>

                          {/* Save Button for Document / Analyzer */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTestIndexForPdf(selectedTestIndex);
                                setShowPdfModal(true);
                              }}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Printer className="w-4 h-4 text-slate-600" />
                              <span>Preview / Print Sheet</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (!activeBooking) return;
                                const currentTest = activeBooking.tests[selectedTestIndex];
                                if (!currentTest) return;

                                setIsUploading(true);
                                try {
                                  const summary = analyzerFindings.trim()
                                    ? analyzerFindings.substring(0, 80).trim()
                                    : `Analyzer: ${analyzerName} - Validated Output Attached`;

                                  const techName = user?.name || "Lab Technologist";

                                  const analyzerHtml = `
                                    <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 12px 0;">
                                      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                          <strong style="color: #0f766e; text-transform: uppercase; font-size: 11px;">Automated Diagnostic Analyzer Report</strong>
                                          <span style="font-size: 11px; color: #64748b;">${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                        </div>
                                        <div style="font-size: 12px; font-weight: 600;">Instrument: <span style="color: #0369a1;">${analyzerName || "Laboratory Automated Analyzer"}</span></div>
                                        ${analyzerLink ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">LIS Cloud Link: <a href="${analyzerLink}" target="_blank" style="color: #0284c7; text-decoration: underline;">${analyzerLink}</a></div>` : ""}
                                        ${uploadFileName ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Document Attachment: <strong style="color: #0f172a;">${uploadFileName}</strong></div>` : ""}
                                      </div>
                                      <div style="margin-top: 10px; line-height: 1.6; white-space: pre-wrap;">
                                        <strong>Clinical Findings & Quantitative Measurements:</strong>
                                        <div style="margin-top: 6px; padding: 10px 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
                                          ${analyzerFindings || "Parameters within calibrated linear dynamic range of analyzer. Clinical correlation recommended."}
                                        </div>
                                      </div>
                                    </div>
                                  `;

                                  if (uploadTargetScope === "batch") {
                                    for (let i = 0; i < activeBooking.tests.length; i++) {
                                      const t = activeBooking.tests[i];
                                      await limsService.submitIndividualTestResult({
                                        labId: activeBooking.labId,
                                        bookingId: activeBooking.id,
                                        testId: t.id || t.testId,
                                        resultValue: summary,
                                        resultFlag: "Normal",
                                        techName,
                                        notes: analyzerFindings
                                      });
                                      t.status = "Completed";
                                      t.resultValue = summary;
                                      t.richReportHtml = analyzerHtml;
                                      if (pdfUploadDataUrl) t.resultFileUrl = pdfUploadDataUrl;
                                    }
                                  } else {
                                    await limsService.submitIndividualTestResult({
                                      labId: activeBooking.labId,
                                      bookingId: activeBooking.id,
                                      testId: currentTest.id || currentTest.testId,
                                      resultValue: summary,
                                      resultFlag: "Normal",
                                      techName,
                                      notes: analyzerFindings
                                    });
                                    currentTest.status = "Completed";
                                    currentTest.resultValue = summary;
                                    currentTest.richReportHtml = analyzerHtml;
                                    if (pdfUploadDataUrl) currentTest.resultFileUrl = pdfUploadDataUrl;
                                  }

                                  setActiveBooking({ ...activeBooking });

                                  setSavedPrompt({
                                    isOpen: true,
                                    testIndex: selectedTestIndex,
                                    testName: uploadTargetScope === "batch" ? "All Batch Tests" : currentTest.testName
                                  });
                                } catch (err) {
                                  console.error("Error saving analyzer document result:", err);
                                } finally {
                                  setIsUploading(false);
                                }
                              }}
                              disabled={isUploading}
                              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isUploading ? "Saving..." : "Save & Record Analyzer Document"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
                    Select a test from the left booklet box to view and edit its values.
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* PDF View Modal */}
      {showPdfModal && activeBooking && (
        <LabReportPdfViewModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          booking={activeBooking}
          filterTestIndex={selectedTestIndexForPdf}
          labInfo={{
            name: lab?.name || user?.labName || 'nanoLabs Medical Diagnostics',
            address: lab?.address || 'Clinical Laboratory Center',
            phone: lab?.phone || '+237 600 000 000'
          }}
        />
      )}

      {/* Add Test / Billable Act to Patient Booklet Modal */}
      {showAddTestModal && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-white">Add Test / Medical Act to Patient Order</h3>
                  <p className="text-[11px] text-teal-200/80">
                    Order #{activeBooking.bookingCode || activeBooking.id} • {activeBooking.patientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTestModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={addTestSearchQuery}
                  onChange={e => setAddTestSearchQuery(e.target.value)}
                  placeholder="Search by test name, code (e.g. ECBU#, PSE#, GLU), category, or COTE (e.g. B95, KB1,0)..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                {['All', 'Biochemistry', 'Microbiology', 'Hematology', 'Parasitology', 'Immunology', 'Serology', 'Ancillary / Acts'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAddTestCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      addTestCategoryFilter === cat
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {(() => {
                const filtered = catalog.filter(t => {
                  const query = addTestSearchQuery.toLowerCase().trim();
                  const nameMatch = (t.name || t.testName || '').toLowerCase().includes(query);
                  const codeMatch = (t.actCode || t.code || '').toLowerCase().includes(query);
                  const coteMatch = (t.cote || '').toLowerCase().includes(query);
                  const catMatch = (t.category || '').toLowerCase().includes(query);
                  const matchesSearch = !query || nameMatch || codeMatch || coteMatch || catMatch;

                  if (addTestCategoryFilter === 'All') return matchesSearch;
                  if (addTestCategoryFilter === 'Ancillary / Acts') {
                    return matchesSearch && ((t.category || '').toLowerCase().includes('ancillary') || (t.category || '').toLowerCase().includes('act') || (t.actCode || '').startsWith('P'));
                  }
                  return matchesSearch && (t.category || '').toLowerCase().includes(addTestCategoryFilter.toLowerCase());
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No matching laboratory tests or billing acts found.
                    </div>
                  );
                }

                return filtered.map(t => {
                  const isAlreadyInBooking = activeBooking.tests?.some(bt => bt.testId === t.id || bt.testName?.toLowerCase() === (t.name || t.testName)?.toLowerCase());
                  
                  return (
                    <div key={t.id || t.code} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {t.name || t.testName}
                          </span>
                          {t.actCode && (
                            <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-700 px-1.5 py-0.2 rounded border border-teal-200">
                              {t.actCode}
                            </span>
                          )}
                          {t.cote && (
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                              COTE {t.cote}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {t.category || 'General'} • Sample: {t.sampleType || 'Venous Blood'} • Price: {(t.price || 4500).toLocaleString()} FCFA
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddTestToCurrentBooking(t)}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAlreadyInBooking ? 'Add Again' : 'Add Test'}</span>
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Parameter Modal */}
      {showAddCustomParamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-800 font-extrabold text-sm">
                <Plus className="w-4 h-4 text-teal-600" />
                <span>Add Custom Parameter Line</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomParamModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Parameter Name:</label>
                <input
                  type="text"
                  value={customParamName}
                  onChange={e => setCustomParamName(e.target.value)}
                  placeholder="e.g. Band Neutrophils, Ketones..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit:</label>
                  <input
                    type="text"
                    value={customParamUnit}
                    onChange={e => setCustomParamUnit(e.target.value)}
                    placeholder="e.g. %, mg/dL, /µL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Method / Device:</label>
                  <input
                    type="text"
                    value={customParamMethod}
                    onChange={e => setCustomParamMethod(e.target.value)}
                    placeholder="e.g. Microscopic"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Male Range (or standard):</label>
                  <input
                    type="text"
                    value={customParamRefMale}
                    onChange={e => setCustomParamRefMale(e.target.value)}
                    placeholder="e.g. 0 - 5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Female Range:</label>
                  <input
                    type="text"
                    value={customParamRefFemale}
                    onChange={e => setCustomParamRefFemale(e.target.value)}
                    placeholder="e.g. 0 - 5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCustomParamModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomParam}
                disabled={!customParamName.trim()}
                className="px-5 py-2 text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Add Parameter Line
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Header Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-800 font-extrabold text-sm">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Add Section Sub-Header</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Section Title:</label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={e => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. CYTOLOGICAL EXAMINATION, DIFFERENTIAL COUNT..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSectionHeader}
                disabled={!newSectionTitle.trim()}
                className="px-5 py-2 text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Create Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Antibiogram Antibiotic Row Modal */}
      {showAddAntibiogramRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Add Antibiotic Susceptibility Row</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAntibiogramRow(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Quick Preset Buttons */}
              <div>
                <label className="font-bold text-slate-600 block mb-1 text-[11px]">Quick Select Standard Antibiotic:</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {['Amoxicillin-Clavulanate (AMC 30µg)', 'Ciprofloxacin (CIP 5µg)', 'Ceftriaxone (CRO 30µg)', 'Gentamicin (CN 10µg)', 'Cotrimoxazole (SXT 25µg)', 'Amikacin (AK 30µg)', 'Imipenem (IPM 10µg)', 'Doxycycline (DO 30µg)', 'Nitrofurantoin (F 300µg)'].map((abName, aIdx) => (
                    <button
                      key={aIdx}
                      type="button"
                      onClick={() => {
                        const parts = abName.split(' (');
                        setNewAntibioticName(parts[0]);
                        if (parts[1]) setNewAntibioticPotency(parts[1].replace(')', ''));
                      }}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white border border-slate-200 hover:bg-indigo-50 text-slate-700 cursor-pointer"
                    >
                      {abName}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Antibiotic Name:</label>
                <input
                  type="text"
                  value={newAntibioticName}
                  onChange={e => setNewAntibioticName(e.target.value)}
                  placeholder="e.g. Ciprofloxacin, Amoxicillin-Clavulanic Acid"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Disc Potency:</label>
                  <input
                    type="text"
                    value={newAntibioticPotency}
                    onChange={e => setNewAntibioticPotency(e.target.value)}
                    placeholder="e.g. 5µg, 30µg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Zone (mm):</label>
                  <input
                    type="text"
                    value={newAntibioticZone}
                    onChange={e => setNewAntibioticZone(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sensitivity Interpretation:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['S', 'I', 'R'] as const).map(sens => (
                    <button
                      key={sens}
                      type="button"
                      onClick={() => setNewAntibioticSens(sens)}
                      className={`py-2 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer ${
                        newAntibioticSens === sens
                          ? sens === 'S'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : sens === 'I'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sens === 'S' ? 'Sensitive (S)' : sens === 'I' ? 'Interm. (I)' : 'Resistant (R)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAntibiogramRow(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAntibioticRow}
                disabled={!newAntibioticName.trim()}
                className="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Add Antibiotic Row
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT TEMPLATE BUILDER / CUSTOM PARAMETER GRID MODAL */}
      <ResultTemplateEditorModal
        isOpen={showResultTemplateModal}
        onClose={() => setShowResultTemplateModal(false)}
        onApplyTemplate={handleApplyCustomTemplate}
      />

      {/* FULL-SCREEN A4 CANVA / LETTER BATCH WORKSPACE MODAL */}
      {showA4BatchModal && activeBooking && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <A4CanvasResultEditor
            booking={activeBooking}
            initialTestIndex={selectedTestIndex}
            onClose={() => setShowA4BatchModal(false)}
            onSaveIndividualTest={(idx, html, summary) => {
              setActiveBooking(prev => {
                if (!prev) return null;
                const updatedTests = [...prev.tests];
                if (updatedTests[idx]) {
                  updatedTests[idx] = {
                    ...updatedTests[idx],
                    richReportHtml: html,
                    resultValue: summary,
                    status: 'Completed',
                    completedAt: new Date().toISOString()
                  };
                }
                return { ...prev, tests: updatedTests };
              });
            }}
            onSaveAllTests={(allTests) => {
              setActiveBooking(prev => {
                if (!prev) return null;
                const updatedTests = [...prev.tests];
                allTests.forEach(({ testIndex, richHtml, summary }) => {
                  if (updatedTests[testIndex]) {
                    updatedTests[testIndex] = {
                      ...updatedTests[testIndex],
                      richReportHtml: richHtml,
                      resultValue: summary,
                      status: 'Completed',
                      completedAt: new Date().toISOString()
                    };
                  }
                });
                return { ...prev, tests: updatedTests, status: 'Completed' };
              });
            }}
            onPrintPreview={() => setShowPdfModal(true)}
          />
        </div>
      )}

    </div>
  );
};

export default LabTechView;
