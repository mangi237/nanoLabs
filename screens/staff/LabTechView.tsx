import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/common/Header';
import StaffHeroBanner from '../../components/common/StaffHeroBanner';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection, query, where, updateDoc, doc } from '../../services/firebase';
import { limsService, PatientBooking, BookingTestItem, MasterTestItem } from '../../services/limsService';
import { MASTER_TESTS_CATALOG } from '../../data/masterTestsData';
import { OFFICIAL_MASTER_TEST_CATALOG } from '../../data/officialTestCatalog';
import { LabReportPdfViewModal } from '../../components/common/LabReportPdfViewModal';
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
  Printer, 
  Key, 
  UserCheck, 
  Layers, 
  Sparkles,
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
  FileCheck
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
  const [activeOptionMode, setActiveOptionMode] = useState<'form' | 'upload' | 'physical_pickup'>('form');

  // Active Test Working States
  const [activeResultValue, setActiveResultValue] = useState<string>('');
  const [activeSubParamValues, setActiveSubParamValues] = useState<Record<string, string>>({});
  const [activeClinicalNotes, setActiveClinicalNotes] = useState<string>('');
  const [activeReagentsUsed, setActiveReagentsUsed] = useState<UsedReagentRecord[]>([]);

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

  // Load state when switching between tests inside the booklet modal
  const loadTestState = (test: BookingTestItem) => {
    setActiveResultValue(test.resultValue || '');
    setActiveClinicalNotes(test.labNotes || '');
    
    // Load sub-parameters
    const subObj: Record<string, string> = {};
    if (test.subParameters && test.subParameters.length > 0) {
      test.subParameters.forEach(sp => {
        subObj[sp.id] = sp.value || '';
      });
    } else {
      // Check if master catalog has subparameters
      const master = getMasterTest(test);
      if (master?.subParameters) {
        master.subParameters.forEach(sp => {
          subObj[sp.id] = sp.defaultValue || '';
        });
      }
    }
    setActiveSubParamValues(subObj);

    // Load hierarchical template values
    const hierObj: Record<string, string> = {};
    if (test.hierarchicalParams && test.hierarchicalParams.length > 0) {
      test.hierarchicalParams.forEach((hp: any, idx: number) => {
        hierObj[hp.name || `hp-${idx}`] = hp.value || hp.defaultValue || '';
      });
    } else {
      // Check if catalog has hierarchicalParams for this test
      const catItem = catalog.find(c => c.name?.toLowerCase() === test.testName?.toLowerCase() || c.id === test.testId);
      if (catItem?.hierarchicalParams) {
        catItem.hierarchicalParams.forEach((hp: any, idx: number) => {
          hierObj[hp.name || `hp-${idx}`] = hp.defaultValue || '';
        });
      }
    }
    setActiveHierarchicalValues(hierObj);

    // Load reagents used if any
    setActiveReagentsUsed(test.reagentsUsed || []);
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

  // Add Reagent to current test
  const handleAddReagentToTest = () => {
    if (!selectedReagentIdToAdd) return;
    const foundItem = validUnexpiredReagents.find(r => r.id === selectedReagentIdToAdd);
    if (!foundItem) return;

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

      const success = await limsService.submitIndividualTestResult({
        labId: targetLabId,
        bookingId: activeBooking.id,
        testId: currentTest.id || currentTest.testId || '',
        resultValue: activeResultValue,
        subParams: activeSubParamValues,
        notes: activeClinicalNotes,
        techName,
        reagentsUsed: activeReagentsUsed
      });

      if (success) {
        setActionSuccessMessage(`✅ Successfully validated "${currentTest.testName}". Reagents deducted.`);
        
        // Update local active booking
        const updatedTests = [...activeBooking.tests];
        updatedTests[selectedTestIndex] = {
          ...currentTest,
          resultValue: activeResultValue,
          status: 'Completed',
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

  // Submit Whole Patient Booklet
  const handleSubmitWholeBooklet = async () => {
    if (!activeBooking || !activeBooking.tests) return;

    setIsSubmittingBooklet(true);
    setActionSuccessMessage('');

    try {
      const techName = user?.name || 'Medical Technologist';

      // Save current test first to capture uncommitted form fields
      const testResultsMap: Record<string, { resultValue?: string; subParams?: Record<string, string>; notes?: string }> = {};

      activeBooking.tests.forEach((t, i) => {
        const testKey = t.id;
        if (i === selectedTestIndex) {
          testResultsMap[testKey] = {
            resultValue: activeResultValue,
            subParams: activeSubParamValues,
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

        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patient, PID, booking code or test..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            
            {/* Modal Header: Patient Name & Basic Info Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 border-b border-teal-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
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

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
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
              <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {/* Modal Body: Two Column Layout */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
              
              {/* Left Column: Booked & Validated Tests Box */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    Booked Tests ({activeBooking.tests?.length || 0})
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Validated by Phlebotomist</span>
                </div>

                <div className="space-y-2">
                  {activeBooking.tests?.map((test, idx) => {
                    const isSelected = selectedTestIndex === idx;
                    const isDone = test.status === 'Completed';

                    return (
                      <div
                        key={test.id || idx}
                        onClick={() => handleSelectTestInBooklet(idx)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
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

                {/* Add Test / Billable Act Button */}
                <button
                  type="button"
                  onClick={() => setShowAddTestModal(true)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span>+ Add Test / Billable Act to Order</span>
                </button>

                {/* Whole Booklet Submit Button */}
                <div className="pt-4">
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

              {/* Right Column: Selected Test Working Card & 3 Responding Ways */}
              <div className="lg:col-span-8 space-y-5">
                {currentTestInModal ? (
                  <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
                    
                    {/* Selected Test Details Header */}
                    <div className="border-b border-slate-100 pb-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                            <FlaskConical className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                              {currentTestInModal.testName}
                            </h3>
                            <p className="text-xs text-slate-500 font-mono">
                              Category: {currentTestInModal.category} • Sample: {masterDef?.sampleType || currentTestInModal.sampleType || 'Venous Blood'}
                            </p>
                          </div>
                        </div>

                        {masterDef?.turnaroundTime && (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <Clock className="w-3 h-3 text-teal-600" />
                            TAT: {masterDef.turnaroundTime}
                          </span>
                        )}
                      </div>

                      {masterDef?.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          {masterDef.description}
                        </p>
                      )}
                    </div>

                    {/* 3 Responding Ways Tabs */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Choose Response Method:
                      </span>
                      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                        <button
                          onClick={() => setActiveOptionMode('form')}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeOptionMode === 'form'
                              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span>1. Fill In Result</span>
                        </button>

                        <button
                          onClick={() => setActiveOptionMode('upload')}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeOptionMode === 'upload'
                              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5 text-teal-600" />
                          <span>2. Upload PDF / File</span>
                        </button>

                        <button
                          onClick={() => setActiveOptionMode('physical_pickup')}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeOptionMode === 'physical_pickup'
                              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5 text-teal-600" />
                          <span>3. Physical Pickup Alert</span>
                        </button>
                      </div>
                    </div>

                    {/* ======================================================== */}
                    {/* MODE 1: COMPREHENSIVE INPUTS + PREDICTIVE CHIPS + REAGENTS */}
                    {/* ======================================================== */}
                    {activeOptionMode === 'form' && (
                      <div className="space-y-6">
                        
                        {/* Predictive Answers Chips */}
                        <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-100 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <span>Predictive & Quick Answers:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {predictiveChoices.map((choice, cIdx) => (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => setActiveResultValue(choice)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  activeResultValue === choice
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'bg-white text-slate-700 border border-teal-200 hover:bg-teal-100/60'
                                }`}
                              >
                                {choice}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Direct Result Input Field */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Primary Analytical Result / Finding:</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              Units: {currentTestInModal.units || masterDef?.units || 'Qualitative'}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={activeResultValue}
                            onChange={e => setActiveResultValue(e.target.value)}
                            placeholder="Enter detailed value, e.g. Non-Reactive, 13.5 g/dL, Negative..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        {/* Multi-Parameter Sub-Parameters Form (e.g. CBC, Liver, Renal) */}
                        {masterDef?.subParameters && masterDef.subParameters.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-teal-600" />
                              Sub-Parameters & Differential Counts
                            </h4>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                                  <tr>
                                    <th className="py-2.5 px-3">Parameter</th>
                                    <th className="py-2.5 px-3">Measured Value</th>
                                    <th className="py-2.5 px-3">Unit</th>
                                    <th className="py-2.5 px-3">Ref Range</th>
                                    <th className="py-2.5 px-3 text-right">Flag</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                  {masterDef.subParameters.map(sp => {
                                    const valStr = activeSubParamValues[sp.id] || '';
                                    const valNum = parseFloat(valStr);
                                    let flag = 'Normal';
                                    const min = activeBooking.patientGender === 'Female' ? sp.femaleMin : sp.maleMin;
                                    const max = activeBooking.patientGender === 'Female' ? sp.femaleMax : sp.maleMax;
                                    
                                    if (!isNaN(valNum)) {
                                      if (min !== undefined && valNum < min) flag = 'Low';
                                      if (max !== undefined && valNum > max) flag = 'High';
                                    }

                                    const refDisplay = activeBooking.patientGender === 'Female' 
                                      ? sp.refRangeFemale || `${min || 0} - ${max || 100}`
                                      : sp.refRangeMale || `${min || 0} - ${max || 100}`;

                                    return (
                                      <tr key={sp.id} className="hover:bg-slate-50/60">
                                        <td className="py-2 px-3 font-semibold text-slate-800 font-sans">{sp.name}</td>
                                        <td className="py-1.5 px-3">
                                          <input
                                            type="text"
                                            value={valStr}
                                            onChange={e => {
                                              setActiveSubParamValues({
                                                ...activeSubParamValues,
                                                [sp.id]: e.target.value
                                              });
                                            }}
                                            placeholder="Value..."
                                            className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                                          />
                                        </td>
                                        <td className="py-2 px-3 text-[11px] text-slate-500">{sp.unit || '-'}</td>
                                        <td className="py-2 px-3 text-[11px] text-slate-600">{refDisplay}</td>
                                        <td className="py-2 px-3 text-right">
                                          {flag === 'High' ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800">HIGH</span>
                                          ) : flag === 'Low' ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800">LOW</span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">NORMAL</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Hierarchical Structured Observations (e.g. Bacteriology, Cervico-Vaginal Swabs, Dual-Unit Bio) */}
                        {(() => {
                          const effHier = (currentTestInModal.hierarchicalParams && currentTestInModal.hierarchicalParams.length > 0)
                            ? currentTestInModal.hierarchicalParams
                            : (catalog.find(c => c.name?.toLowerCase() === currentTestInModal.testName?.toLowerCase() || c.id === currentTestInModal.testId)?.hierarchicalParams || []);
                          
                          if (!effHier || effHier.length === 0) return null;

                          // Group by section
                          const grouped: Record<string, any[]> = {};
                          effHier.forEach((p: any) => {
                            const sec = p.section || 'Observation Template';
                            if (!grouped[sec]) grouped[sec] = [];
                            grouped[sec].push(p);
                          });

                          return (
                            <div className="space-y-4 bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                                  <Layers className="w-4 h-4 text-teal-600" />
                                  Structured Template Observations
                                </h4>
                                <span className="text-[10px] font-mono text-slate-500 font-bold">
                                  {effHier.length} parameters configured
                                </span>
                              </div>

                              {Object.entries(grouped).map(([sectionName, params]) => (
                                <div key={sectionName} className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-slate-200">
                                  <div className="text-[11px] font-black uppercase tracking-wider text-teal-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                                    <span>{sectionName}</span>
                                    <span className="text-[9px] font-mono text-slate-400">Multi-tier section</span>
                                  </div>
                                  <div className="space-y-2 pt-1">
                                    {params.map((param: any, pIdx: number) => {
                                      const key = param.name || `hp-${pIdx}`;
                                      const currentVal = activeHierarchicalValues[key] !== undefined 
                                        ? activeHierarchicalValues[key] 
                                        : (param.defaultValue || '');
                                      
                                      return (
                                        <div key={pIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                          <div className="sm:col-span-5">
                                            <span className="text-xs font-bold text-slate-800">{param.name}</span>
                                            {param.unit && (
                                              <span className="text-[10px] text-slate-400 font-mono ml-1.5">({param.unit})</span>
                                            )}
                                            {param.refRange && (
                                              <span className="text-[9px] text-slate-400 block font-mono">Ref: {param.refRange}</span>
                                            )}
                                          </div>
                                          <div className="sm:col-span-7">
                                            <input
                                              type="text"
                                              value={currentVal}
                                              onChange={e => {
                                                setActiveHierarchicalValues({
                                                  ...activeHierarchicalValues,
                                                  [key]: e.target.value
                                                });
                                              }}
                                              placeholder={param.defaultValue || 'Enter finding / count...'}
                                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Reagents Used Section (RULE: Ask in test card, filter expired, prompt quantity) */}
                        <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                              <Package className="w-4 h-4 text-teal-600" />
                              Reagents Used (Auto-Deducted from Inventory)
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500">
                              {validUnexpiredReagents.length} unexpired reagents in stock
                            </span>
                          </div>

                          {/* Reagent Adder Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-2xl border border-slate-200">
                            <div className="sm:col-span-6">
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">Select Reagent:</label>
                              <select
                                value={selectedReagentIdToAdd}
                                onChange={e => {
                                  setSelectedReagentIdToAdd(e.target.value);
                                  const found = validUnexpiredReagents.find(r => r.id === e.target.value);
                                  if (found?.unit) setReagentUnitToAdd(found.unit);
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              >
                                <option value="">-- Choose Reagent Used --</option>
                                {validUnexpiredReagents.map(r => (
                                  <option key={r.id} value={r.id}>
                                    {r.name} (Stock: {r.quantity} {r.unit || 'Units'})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">Quantity Used:</label>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={reagentQtyToAdd}
                                onChange={e => setReagentQtyToAdd(parseFloat(e.target.value) || 1)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>

                            <div className="sm:col-span-3 flex items-end">
                              <button
                                type="button"
                                onClick={handleAddReagentToTest}
                                disabled={!selectedReagentIdToAdd}
                                className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>

                          {/* List of Added Reagents for this Test */}
                          {activeReagentsUsed.length > 0 ? (
                            <div className="space-y-1.5 pt-1">
                              {activeReagentsUsed.map(ru => (
                                <div
                                  key={ru.reagentId}
                                  className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                                    <span className="font-bold text-slate-900 font-sans">{ru.reagentName}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                                      {ru.quantity} {ru.unit}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveReagentFromTest(ru.reagentId  || '')}
                                      className="text-slate-400 hover:text-rose-600 p-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              No explicit reagents added yet. Catalog defaults will be deducted if applicable.
                            </p>
                          )}
                        </div>

                        {/* Clinical Findings & Notes */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Clinical Observations & Technologist Notes:</label>
                          <textarea
                            rows={2}
                            value={activeClinicalNotes}
                            onChange={e => setActiveClinicalNotes(e.target.value)}
                            placeholder="Observations, morphological notes, microscopic findings..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        {/* Save Current Test Button */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleSaveCurrentTest}
                            disabled={isSavingTest}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-4 h-4 text-teal-400" />
                            <span>{isSavingTest ? 'Saving Test...' : 'Save & Validate This Test'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* MODE 2: UPLOAD RESULT PDF / IMAGE                        */}
                    {/* ======================================================== */}
                    {activeOptionMode === 'upload' && (
                      <div className="space-y-5 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
                        <div className="text-center space-y-1">
                          <h4 className="text-sm font-bold text-slate-900">Upload Diagnostic PDF / Analyzer Output</h4>
                          <p className="text-xs text-slate-500">
                            Upload a standalone result sheet for a single test or a consolidated batch report.
                          </p>
                        </div>

                        {/* Target Scope Selection */}
                        <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-3">
                          <label className="block text-xs font-bold text-slate-700">Choose Validation Target:</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setUploadTargetScope('specific')}
                              className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                uploadTargetScope === 'specific'
                                  ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <TestTube className="w-4 h-4 text-teal-600" />
                                Specific Test Only
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Validates only the selected test without completing the rest of the batch.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setUploadTargetScope('batch')}
                              className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                uploadTargetScope === 'batch'
                                  ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <FileCheck className="w-4 h-4 text-teal-600" />
                                Full Batch Consolidated PDF
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Attaches the report to the whole order and marks all tests complete.
                              </p>
                            </button>
                          </div>

                          {uploadTargetScope === 'specific' && (
                            <div className="pt-2 border-t border-slate-100 space-y-1">
                              <label className="block text-[11px] font-bold text-slate-600">Select Test to Validate:</label>
                              <select
                                value={uploadTargetTestId || activeBooking.tests[selectedTestIndex]?.id || activeBooking.tests[selectedTestIndex]?.testId || ''}
                                onChange={e => setUploadTargetTestId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                              >
                                {activeBooking.tests.map((t, idx) => (
                                  <option key={t.id || idx} value={t.id || t.testId || `t-${idx}`}>
                                    {t.testName} ({t.status || 'Pending'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-8 text-center bg-white transition-colors space-y-3">
                          <Upload className="w-8 h-8 text-teal-600 mx-auto" />
                          <div>
                            <label className="text-xs font-bold text-teal-700 hover:underline cursor-pointer">
                              <span>Click to browse file</span>
                              <input
                                type="file"
                                accept="application/pdf,image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                            <span className="text-xs text-slate-500"> or drag and drop</span>
                          </div>
                          {uploadFileName && (
                            <p className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl inline-block">
                              📄 {uploadFileName}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={handleConfirmUpload}
                            disabled={isUploading || !pdfUploadDataUrl}
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            <span>{isUploading ? 'Uploading...' : uploadTargetScope === 'specific' ? 'Attach & Validate Test' : 'Attach & Complete Batch'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* MODE 3: TRIGGER PHYSICAL PICKUP ALERT                   */}
                    {/* ======================================================== */}
                    {activeOptionMode === 'physical_pickup' && (
                      <form onSubmit={handleTriggerPhysicalPickup} className="space-y-5 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900">Trigger Physical Hard-Copy Pickup SMS</h4>
                          <p className="text-xs text-slate-500">
                            Notifies patient via SMS and patient portal that physical printed copies are ready at front reception.
                          </p>
                        </div>

                        {pickupError && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{pickupError}</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-teal-600" />
                            <span>Technologist Authorization Passcode:</span>
                          </label>
                          <input
                            type="password"
                            value={pickupPasscode}
                            onChange={e => setPickupPasscode(e.target.value)}
                            placeholder="Enter your security access code..."
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <Send className="w-4 h-4 text-teal-400" />
                            <span>Dispatch Pickup SMS</span>
                          </button>
                        </div>
                      </form>
                    )}

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

    </div>
  );
};

export default LabTechView;
