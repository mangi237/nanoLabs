import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  Trash2, 
  Layers, 
  FlaskConical, 
  Calendar, 
  ShieldCheck, 
  Key, 
  RefreshCw, 
  HelpCircle,
  FileText,
  Check,
  ChevronRight,
  Info,
  ThermometerSnowflake,
  Filter
} from 'lucide-react';
import { MEASURING_UNITS, INVENTORY_CATEGORIES, STORAGE_CONDITIONS } from '../../screens/admin/InventoryManagement';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/authContext';
import { db, collection, addDoc } from '../../services/firebase';

interface ParsedInventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  initialQuantity: number;
  reorderLevel: number;
  expiryDate: string;
  storageCondition: string;
  batchNumber: string;
  supplier: string;
  description: string;
  isValid: boolean;
  validationErrors: string[];
  selected: boolean;
}

interface BulkInventoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
}

// Sample rows pre-populated in the downloadable template
const SAMPLE_TEMPLATE_ROWS = [
  {
    name: 'Giemsa Staining Solution ACS Grade',
    category: 'Chemicals & Solutions',
    unit: 'Bottles',
    quantity: '15',
    initialQuantity: '25',
    reorderLevel: '5',
    expiryDate: '2027-04-15',
    storageCondition: 'Dark & Dry Cabinet',
    batchNumber: 'LOT-GMS-9021',
    supplier: 'MedChem Lab Supplies',
    description: 'High-purity Giemsa stain for malaria smear cytology'
  },
  {
    name: 'Vacutainer EDTA K3 Blood Collection Tubes (Lavender)',
    category: 'Consumables & Tubes',
    unit: 'Specimen Tubes',
    quantity: '400',
    initialQuantity: '500',
    reorderLevel: '100',
    expiryDate: '2027-11-30',
    storageCondition: 'Room Temp (15°C - 25°C)',
    batchNumber: 'LOT-EDTA-4412',
    supplier: 'BD Diagnostics Africa',
    description: 'Lavender top tubes for CBC and Hematology profiles'
  },
  {
    name: 'Blood Glucose GOD-PAP Enzymatic Reagent Kit',
    category: 'Reagents',
    unit: 'Kits',
    quantity: '8',
    initialQuantity: '20',
    reorderLevel: '4',
    expiryDate: '2026-12-18',
    storageCondition: 'Refrigerated (2°C - 8°C)',
    batchNumber: 'LOT-GLU-7721',
    supplier: 'Roche Diagnostics Global',
    description: 'Photometric determination of glucose in serum or plasma'
  },
  {
    name: 'Urine Multistix 10-SG Diagnostic Strips',
    category: 'Testing Kits',
    unit: 'Boxes',
    quantity: '12',
    initialQuantity: '30',
    reorderLevel: '6',
    expiryDate: '2027-08-20',
    storageCondition: 'Room Temp (15°C - 25°C)',
    batchNumber: 'LOT-URI-3381',
    supplier: 'Siemens Healthcare',
    description: '10-parameter urinalysis strips for leukocytes, nitrites, protein, pH'
  },
  {
    name: 'Absolute Ethanol 99.8% ACS Pathology Grade',
    category: 'Chemicals & Solutions',
    unit: 'Liters (L)',
    quantity: '10',
    initialQuantity: '25',
    reorderLevel: '5',
    expiryDate: '2028-01-10',
    storageCondition: 'Dark & Dry Cabinet',
    batchNumber: 'LOT-ETH-1109',
    supplier: 'Cameroon Chemical Depot',
    description: 'High-purity fixation solvent for histology and bacteriology'
  }
];

export const BulkInventoryUploadModal: React.FC<BulkInventoryUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { lab, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'preview'>('upload');
  
  // Drag & drop / File state
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsed data state
  const [parsedItems, setParsedItems] = useState<ParsedInventoryItem[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'invalid'>('all');

  // Authorization & Submission state
  const [accessCodeInput, setAccessCodeInput] = useState<string>(
    user?.accessCode || (user?.role === 'admin' || user?.role === 'superadmin' ? 'ADMIN123' : '')
  );
  const [authError, setAuthError] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // Download official CSV template
  const handleDownloadTemplate = () => {
    const headers = [
      'Substance / Material Name*',
      'Category*',
      'Measuring Unit*',
      'Current Quantity*',
      'Full Capacity',
      'Reorder Danger Threshold',
      'Expiry Date (YYYY-MM-DD)*',
      'Storage Condition',
      'Batch / LOT Number',
      'Supplier / Vendor',
      'Description / Clinical Notes'
    ];

    const rows = SAMPLE_TEMPLATE_ROWS.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${r.unit}"`,
      r.quantity,
      r.initialQuantity,
      r.reorderLevel,
      r.expiryDate,
      `"${r.storageCondition}"`,
      `"${r.batchNumber}"`,
      `"${r.supplier}"`,
      `"${r.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nanoLabs_Inventory_Bulk_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to normalize Date string into YYYY-MM-DD
  const normalizeDate = (rawDate: string): string => {
    if (!rawDate) return '';
    const clean = rawDate.trim().replace(/['"]/g, '');
    
    // Check standard YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
      const parts = clean.split('-');
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Check DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}$/.test(clean)) {
      const separator = clean.includes('/') ? '/' : clean.includes('-') ? '-' : '.';
      const parts = clean.split(separator);
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }

    // Check YYYY/MM/DD
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(clean)) {
      const parts = clean.split('/');
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Attempt JS Date parsing
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
      return parsed.toISOString().split('T')[0];
    }

    return clean;
  };

  // Helper to normalize measuring unit
  const normalizeMeasuringUnit = (rawUnit: string, itemName: string): string => {
    if (!rawUnit) {
      // Guess by item name
      const lower = itemName.toLowerCase();
      if (lower.includes('tube') || lower.includes('vacutainer')) return 'Specimen Tubes';
      if (lower.includes('strip')) return 'Test Strips';
      if (lower.includes('stain') || lower.includes('ethanol') || lower.includes('methanol') || lower.includes('acid') || lower.includes('water')) return 'Bottles';
      if (lower.includes('kit') || lower.includes('reagent')) return 'Kits';
      if (lower.includes('box') || lower.includes('glove')) return 'Boxes';
      return 'Bottles';
    }

    const clean = rawUnit.trim().toLowerCase();
    
    // Direct matches
    for (const std of MEASURING_UNITS) {
      if (std.toLowerCase() === clean || std.toLowerCase().includes(clean)) {
        return std;
      }
    }

    // Keyword matching
    if (clean.includes('liter') || clean === 'l') return 'Liters (L)';
    if (clean.includes('milli') || clean.includes('ml')) return 'Milliliters (mL)';
    if (clean.includes('bottle') || clean.includes('flacon')) return 'Bottles';
    if (clean.includes('vial') || clean.includes('flaconnette')) return 'Vials';
    if (clean.includes('ampoule') || clean.includes('amp')) return 'Ampoules';
    if (clean.includes('box') || clean.includes('boite') || clean.includes('boîte')) return 'Boxes';
    if (clean.includes('kit') || clean.includes('coffret')) return 'Kits';
    if (clean.includes('strip') || clean.includes('bandelette')) return 'Test Strips';
    if (clean.includes('pack') || clean.includes('paquet')) return 'Packs';
    if (clean.includes('cartridge') || clean.includes('cartouche')) return 'Cartridges';
    if (clean.includes('tube')) return 'Specimen Tubes';
    if (clean.includes('gram') || clean === 'g') return 'Grams (g)';
    if (clean.includes('mg')) return 'Milligrams (mg)';
    if (clean.includes('piece') || clean.includes('unit') || clean.includes('unite')) return 'Pieces / Units';

    return 'Bottles';
  };

  // Helper to normalize category
  const normalizeCategory = (rawCat: string, itemName: string): string => {
    if (!rawCat) {
      const lower = itemName.toLowerCase();
      if (lower.includes('tube') || lower.includes('syringe') || lower.includes('needle') || lower.includes('lancet')) return 'Consumables & Tubes';
      if (lower.includes('glove') || lower.includes('mask') || lower.includes('ppe') || lower.includes('coat')) return 'PPE & Bio-Safety';
      if (lower.includes('bleach') || lower.includes('ethanol') || lower.includes('disinfect') || lower.includes('soap')) return 'Sanitization & Sterilization';
      if (lower.includes('rapid') || lower.includes('strip') || lower.includes('test') || lower.includes('cassette')) return 'Testing Kits';
      if (lower.includes('stain') || lower.includes('solution') || lower.includes('acid') || lower.includes('buffer')) return 'Chemicals & Solutions';
      return 'Reagents';
    }

    const clean = rawCat.trim().toLowerCase();
    for (const std of INVENTORY_CATEGORIES) {
      if (std.toLowerCase() === clean || std.toLowerCase().includes(clean)) {
        return std;
      }
    }

    if (clean.includes('reagent') || clean.includes('reactif')) return 'Reagents';
    if (clean.includes('chemical') || clean.includes('solution') || clean.includes('chimique')) return 'Chemicals & Solutions';
    if (clean.includes('consumable') || clean.includes('tube') || clean.includes('consommable')) return 'Consumables & Tubes';
    if (clean.includes('kit') || clean.includes('test') || clean.includes('bandelette')) return 'Testing Kits';
    if (clean.includes('ppe') || clean.includes('safety') || clean.includes('gant') || clean.includes('protection')) return 'PPE & Bio-Safety';
    if (clean.includes('saniti') || clean.includes('sterili') || clean.includes('desinfect')) return 'Sanitization & Sterilization';

    return 'Reagents';
  };

  // Helper to normalize storage condition
  const normalizeStorage = (rawStorage: string): string => {
    if (!rawStorage) return 'Room Temp (15°C - 25°C)';
    const clean = rawStorage.trim().toLowerCase();
    if (clean.includes('refrig') || clean.includes('2-8') || clean.includes('2°c') || clean.includes('cold') || clean.includes('frais')) {
      return 'Refrigerated (2°C - 8°C)';
    }
    if (clean.includes('-80') || clean.includes('deep freeze') || clean.includes('cryo')) {
      return 'Deep Freeze (-80°C)';
    }
    if (clean.includes('-20') || clean.includes('freeze') || clean.includes('congel')) {
      return 'Frozen (-20°C)';
    }
    if (clean.includes('dark') || clean.includes('dry') || clean.includes('sombre') || clean.includes('sec')) {
      return 'Dark & Dry Cabinet';
    }
    return 'Room Temp (15°C - 25°C)';
  };

  // Robust line-by-line CSV parser with quote awareness
  const parseCSVLines = (text: string): string[][] => {
    const lines: string[][] = [];
    const rawLines = text.split(/\r\n|\n|\r/);

    for (let lineStr of rawLines) {
      lineStr = lineStr.trim();
      if (!lineStr) continue;

      const row: string[] = [];
      let currentVal = '';
      let inQuotes = false;

      // Determine separator (comma, tab, or semicolon)
      let separator = ',';
      if (!lineStr.includes(',') && lineStr.includes('\t')) separator = '\t';
      else if (!lineStr.includes(',') && lineStr.includes(';')) separator = ';';

      for (let i = 0; i < lineStr.length; i++) {
        const char = lineStr[i];
        if (char === '"') {
          if (inQuotes && lineStr[i + 1] === '"') {
            currentVal += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === separator && !inQuotes) {
          row.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      row.push(currentVal.trim());
      lines.push(row);
    }

    return lines;
  };

  // Core processing function
  const processRawData = (rawText: string) => {
    if (!rawText || !rawText.trim()) {
      alert('Please upload a file or paste spreadsheet rows to process.');
      return;
    }

    const rows = parseCSVLines(rawText);
    if (rows.length === 0) {
      alert('No valid data lines found. Please check your file or pasted text.');
      return;
    }

    // Check if first row is header
    let headerRowIndex = -1;
    let colIndex = {
      name: 0,
      category: 1,
      unit: 2,
      quantity: 3,
      initialQuantity: 4,
      reorderLevel: 5,
      expiryDate: 6,
      storageCondition: 7,
      batchNumber: 8,
      supplier: 9,
      description: 10
    };

    const firstRowLower = rows[0].map(c => c.toLowerCase().trim());
    const isFirstRowHeader = firstRowLower.some(c => 
      c.includes('name') || c.includes('substance') || c.includes('item') || 
      c.includes('unit') || c.includes('expiry') || c.includes('category') || 
      c.includes('qty') || c.includes('quantity')
    );

    if (isFirstRowHeader) {
      headerRowIndex = 0;
      firstRowLower.forEach((header, idx) => {
        if (header.includes('name') || header.includes('substance') || header.includes('chemical') || header.includes('material') || header.includes('item')) {
          colIndex.name = idx;
        } else if (header.includes('category') || header.includes('type') || header.includes('group')) {
          colIndex.category = idx;
        } else if (header.includes('unit') || header.includes('measuring') || header.includes('measure') || header.includes('unite')) {
          colIndex.unit = idx;
        } else if (header.includes('qty') || header.includes('quantity') || header.includes('stock') || header.includes('current')) {
          colIndex.quantity = idx;
        } else if (header.includes('initial') || header.includes('capacity') || header.includes('max')) {
          colIndex.initialQuantity = idx;
        } else if (header.includes('reorder') || header.includes('threshold') || header.includes('danger') || header.includes('min')) {
          colIndex.reorderLevel = idx;
        } else if (header.includes('expir') || header.includes('shelf') || header.includes('peremption') || header.includes('date')) {
          colIndex.expiryDate = idx;
        } else if (header.includes('storage') || header.includes('temp') || header.includes('condition') || header.includes('conservation')) {
          colIndex.storageCondition = idx;
        } else if (header.includes('batch') || header.includes('lot') || header.includes('numero') || header.includes('#')) {
          colIndex.batchNumber = idx;
        } else if (header.includes('supplier') || header.includes('vendor') || header.includes('fournisseur') || header.includes('fabricant')) {
          colIndex.supplier = idx;
        } else if (header.includes('desc') || header.includes('note') || header.includes('detail') || header.includes('usage')) {
          colIndex.description = idx;
        }
      });
    }

    const dataRows = headerRowIndex >= 0 ? rows.slice(headerRowIndex + 1) : rows;

    const parsed: ParsedInventoryItem[] = [];

    dataRows.forEach((row, i) => {
      // Skip empty row
      if (row.length === 0 || (row.length === 1 && !row[0])) return;

      const rawName = row[colIndex.name] || '';
      const rawCategory = row[colIndex.category] || '';
      const rawUnit = row[colIndex.unit] || '';
      const rawQuantity = row[colIndex.quantity] || '0';
      const rawInitialQuantity = row[colIndex.initialQuantity] || '';
      const rawReorder = row[colIndex.reorderLevel] || '5';
      const rawExpiry = row[colIndex.expiryDate] || '';
      const rawStorage = row[colIndex.storageCondition] || '';
      const rawBatch = row[colIndex.batchNumber] || '';
      const rawSupplier = row[colIndex.supplier] || '';
      const rawDesc = row[colIndex.description] || '';

      const name = rawName.trim();
      const unit = normalizeMeasuringUnit(rawUnit, name);
      const category = normalizeCategory(rawCategory, name);
      const storageCondition = normalizeStorage(rawStorage);
      
      const quantity = Math.max(0, parseFloat(rawQuantity.replace(/[^0-9.-]/g, '')) || 0);
      const reorderLevel = Math.max(0, parseFloat(rawReorder.replace(/[^0-9.-]/g, '')) || 5);
      const initialQuantity = rawInitialQuantity 
        ? Math.max(quantity, parseFloat(rawInitialQuantity.replace(/[^0-9.-]/g, '')) || quantity)
        : Math.max(quantity, reorderLevel * 2, 20);

      const expiryDate = normalizeDate(rawExpiry);
      const batchNumber = rawBatch.trim() || `LOT-${Math.floor(1000 + Math.random() * 9000)}`;
      const supplier = rawSupplier.trim() || 'Laboratory Depot';
      const description = rawDesc.trim();

      // Validation logic
      const validationErrors: string[] = [];
      if (!name) {
        validationErrors.push('Missing chemical / substance name');
      }

      if (!expiryDate || !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
        validationErrors.push('Invalid or missing expiry date (must be YYYY-MM-DD)');
      }

      const isValid = validationErrors.length === 0;

      parsed.push({
        id: `bulk-item-${i}-${Date.now()}`,
        name,
        category,
        unit,
        quantity,
        initialQuantity,
        reorderLevel,
        expiryDate,
        storageCondition,
        batchNumber,
        supplier,
        description,
        isValid,
        validationErrors,
        selected: isValid
      });
    });

    if (parsed.length === 0) {
      alert('Could not parse any items from the provided data. Please ensure lines are separated properly.');
      return;
    }

    setParsedItems(parsed);
    setActiveTab('preview');
  };

  // Handle file drop & upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processRawData(content);
    };
    reader.readAsText(uploadedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processRawData(content);
      };
      reader.readAsText(droppedFile);
    }
  };

  // Toggle item selection
  const handleToggleSelect = (id: string) => {
    setParsedItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    }));
  };

  const handleSelectAll = (select: boolean) => {
    setParsedItems(prev => prev.map(item => ({
      ...item,
      selected: select && item.isValid
    })));
  };

  const handleDeleteParsedRow = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  // Compute Expiry status for row display
  const getExpiryBadge = (expiryDateStr: string) => {
    if (!expiryDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(expiryDateStr)) {
      return {
        label: 'Invalid Date',
        color: 'bg-rose-100 text-rose-800 border-rose-300'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expiryDateStr);
    expDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `⚠️ EXPIRED (${Math.abs(diffDays)}d ago)`,
        color: 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
      };
    }
    if (diffDays <= 30) {
      return {
        label: `⏳ Expires in ${diffDays}d`,
        color: 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
      };
    }
    return {
      label: `✅ Valid (${expiryDateStr})`,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    };
  };

  // Filter items in preview
  const filteredPreviewItems = parsedItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'valid' && !item.isValid) return false;
    if (statusFilter === 'invalid' && item.isValid) return false;

    return true;
  });

  const totalDetected = parsedItems.length;
  const validCount = parsedItems.filter(i => i.isValid).length;
  const invalidCount = parsedItems.filter(i => !i.isValid).length;
  const selectedCount = parsedItems.filter(i => i.selected).length;

  // Execute Batch Save to Firestore
  const handleCommitImport = async () => {
    setAuthError('');

    if (selectedCount === 0) {
      setAuthError('Please select at least 1 valid item to import.');
      return;
    }

    if (!accessCodeInput.trim()) {
      setAuthError('Staff / Administrator authorization code is required to import inventory.');
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    try {
      // 1. Authorize code
      const authCheck = await authService.verifyStaffActionCode(
        accessCodeInput,
        ['admin', 'superadmin', 'labtech', 'analyzer', 'cashier'],
        user?.accessCode
      );

      if (!authCheck.authorized) {
        setAuthError(authCheck.error || 'Invalid authorization code. Enter your valid staff/admin access code.');
        setIsImporting(false);
        return;
      }

      setImportProgress(30);

      const targetLabId = lab?.id || 'lab-1';
      const staffName = authCheck.staffName || user?.name || 'Staff Member';
      const itemsToImport = parsedItems.filter(i => i.selected);

      const invRef = collection(db, 'labs', targetLabId, 'inventory');
      let completed = 0;

      for (const item of itemsToImport) {
        const payload = {
          name: item.name,
          category: item.category,
          unit: item.unit,
          quantity: Number(item.quantity),
          initialQuantity: Number(item.initialQuantity),
          reorderLevel: Number(item.reorderLevel),
          expiryDate: item.expiryDate,
          storageCondition: item.storageCondition,
          batchNumber: item.batchNumber,
          supplier: item.supplier,
          description: item.description,
          importedVia: 'csv_bulk_upload',
          lastModifiedBy: staffName,
          lastModifiedCode: accessCodeInput,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await addDoc(invRef, payload);
        completed++;
        setImportProgress(30 + Math.round((completed / itemsToImport.length) * 65));
      }

      setImportProgress(100);
      setImportSuccessCount(completed);
      onSuccess(completed);
    } catch (err: any) {
      console.error('Error importing bulk items:', err);
      setAuthError(err?.message || 'Failed to import inventory items.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 border border-teal-400/30 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg">Spreadsheet & CSV Bulk Inventory Importer</h3>
                <span className="px-2 py-0.5 bg-teal-500/30 text-teal-200 border border-teal-400/40 rounded-full text-[10px] font-black uppercase">
                  Batch Ingestion
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Upload Excel spreadsheets or CSVs with measuring units, quantities, LOT codes & expiration dates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {importSuccessCount !== null ? (
          /* SUCCESS STATE */
          <div className="p-8 text-center space-y-5 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200 shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">Bulk Ingestion Successfully Completed!</h4>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                <strong className="text-emerald-700 font-black">{importSuccessCount} chemicals and consumables</strong> have been validated, encrypted, and registered in your laboratory inventory ledger.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-xs text-slate-600 text-left space-y-1.5">
              <div className="flex justify-between">
                <span>Items Imported:</span>
                <strong className="text-slate-900">{importSuccessCount} items</strong>
              </div>
              <div className="flex justify-between">
                <span>Authorized By:</span>
                <strong className="text-slate-900">{user?.name || 'Staff Member'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Storage Vault:</span>
                <strong className="text-teal-700">{lab?.name || 'Laboratory Depot'}</strong>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 cursor-pointer"
              >
                View Updated Inventory Register
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Nav Tabs & Template Download Banner */}
            <div className="px-6 pt-4 pb-2 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'upload' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>1. Upload File</span>
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'paste' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Cells</span>
                </button>
                <button
                  onClick={() => parsedItems.length > 0 && setActiveTab('preview')}
                  disabled={parsedItems.length === 0}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 ${
                    activeTab === 'preview' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>2. Review & Validate ({parsedItems.length})</span>
                </button>
              </div>

              {/* Template Download Button */}
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Download Sample CSV Template (.csv)</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 flex flex-col">
              
              {/* TAB 1: FILE UPLOAD (DRAG & DROP) */}
              {activeTab === 'upload' && (
                <div className="space-y-6 max-w-2xl mx-auto w-full py-4 my-auto">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-teal-500 bg-teal-50/60 scale-[1.01]' 
                        : 'border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .tsv, .txt, .xlsx, .xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <Upload className="w-7 h-7" />
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      Drag & Drop your Excel or CSV Spreadsheet here
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Supports <span className="font-semibold text-slate-700">.csv, .tsv, .txt</span> files exported from Microsoft Excel, Google Sheets or LibreOffice.
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-teal-800 border border-teal-300 rounded-xl text-xs font-bold shadow-xs">
                      <span>Browse from Computer</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>

                    {file && (
                      <div className="mt-4 p-2.5 bg-teal-100/70 border border-teal-300 rounded-xl text-xs font-semibold text-teal-900 inline-flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-700" />
                        <span>Loaded file: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>

                  {/* Instructions & Required Column Checklist */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <Info className="w-4 h-4 text-teal-600" />
                      <span>Required Columns in Spreadsheet:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span><strong>Substance Name:</strong> Name of chemical or supply</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span><strong>Measuring Unit:</strong> Bottles, Liters, Vials, Tubes, etc.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span><strong>Current Quantity:</strong> In-stock balance number</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span><strong>Expiry Date:</strong> YYYY-MM-DD (e.g. 2027-06-30)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COPY-PASTE TEXT */}
              {activeTab === 'paste' && (
                <div className="space-y-4 max-w-3xl mx-auto w-full my-auto py-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Paste Spreadsheet Rows Directly (TSV / CSV format)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Copy rows from Excel or Google Sheets (Ctrl+C) and paste below (Ctrl+V). The parser automatically maps column headers.
                    </p>
                    <textarea
                      rows={8}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder={`Substance Name, Category, Unit, Quantity, Initial Capacity, Reorder Level, Expiry Date, Storage, LOT, Supplier\nGiemsa Staining Solution, Chemicals & Solutions, Bottles, 15, 25, 5, 2027-04-15, Dark & Dry Cabinet, LOT-GMS-9021, MedChem Diagnostics\nVacutainer EDTA Tubes, Consumables & Tubes, Specimen Tubes, 400, 500, 100, 2027-11-30, Room Temp, LOT-EDTA-4412, BD Africa`}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPasteText('')}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => processRawData(pasteText)}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Parse & Validate Pasted Rows</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: REVIEW & LIVE VALIDATION TABLE */}
              {activeTab === 'preview' && (
                <div className="space-y-4 flex-1 flex flex-col">
                  {/* Summary Bar & Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-900">
                        {totalDetected} Items Detected
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                          {validCount} Valid & Ready
                        </span>
                        {invalidCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200">
                            {invalidCount} Have Errors
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold border border-teal-200">
                          {selectedCount} Selected to Import
                        </span>
                      </div>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Filter rows..."
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.target.value)}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs w-36 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setStatusFilter('all')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          All ({parsedItems.length})
                        </button>
                        <button
                          onClick={() => setStatusFilter('valid')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            statusFilter === 'valid' ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          Valid ({validCount})
                        </button>
                        {invalidCount > 0 && (
                          <button
                            onClick={() => setStatusFilter('invalid')}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                              statusFilter === 'invalid' ? 'bg-rose-700 text-white' : 'bg-white text-rose-700 border border-rose-200'
                            }`}
                          >
                            Errors ({invalidCount})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden flex-1 bg-white overflow-y-auto max-h-[380px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10">
                        <tr>
                          <th className="px-3 py-2.5 w-10">
                            <input
                              type="checkbox"
                              checked={selectedCount === validCount && validCount > 0}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="rounded text-teal-600 cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-2.5">Substance / Chemical</th>
                          <th className="px-3 py-2.5">Category</th>
                          <th className="px-3 py-2.5">Unit (Measuring Way)</th>
                          <th className="px-3 py-2.5">Quantity & Limit</th>
                          <th className="px-4 py-2.5">Expiration Status</th>
                          <th className="px-3 py-2.5">Storage & LOT</th>
                          <th className="px-3 py-2.5 text-right">Status / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredPreviewItems.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400">
                              No items match the current filter.
                            </td>
                          </tr>
                        ) : (
                          filteredPreviewItems.map((item) => {
                            const expBadge = getExpiryBadge(item.expiryDate);
                            return (
                              <tr 
                                key={item.id} 
                                className={`transition-colors ${
                                  !item.isValid 
                                    ? 'bg-rose-50/50' 
                                    : item.selected 
                                    ? 'bg-teal-50/30 hover:bg-teal-50/60' 
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="px-3 py-3">
                                  <input
                                    type="checkbox"
                                    disabled={!item.isValid}
                                    checked={item.selected}
                                    onChange={() => handleToggleSelect(item.id)}
                                    className="rounded text-teal-600 cursor-pointer disabled:opacity-30"
                                  />
                                </td>
                                
                                <td className="px-4 py-3 font-bold text-slate-900 min-w-[180px]">
                                  <div>{item.name || <span className="text-rose-500 font-normal italic">Missing Name</span>}</div>
                                  {item.supplier && (
                                    <span className="text-[10px] text-slate-400 block font-normal">
                                      Vendor: {item.supplier}
                                    </span>
                                  )}
                                </td>

                                <td className="px-3 py-3 min-w-[130px]">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                    {item.category}
                                  </span>
                                </td>

                                <td className="px-3 py-3 min-w-[120px]">
                                  <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                                    {item.unit}
                                  </span>
                                </td>

                                <td className="px-3 py-3 min-w-[120px]">
                                  <div className="font-bold text-slate-900">
                                    {item.quantity} <span className="text-[10px] font-normal text-slate-500">in stock</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Alert &lt; {item.reorderLevel}
                                  </div>
                                </td>

                                <td className="px-4 py-3 min-w-[150px]">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${expBadge.color}`}>
                                    {expBadge.label}
                                  </span>
                                </td>

                                <td className="px-3 py-3 min-w-[140px] text-[11px]">
                                  <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                                    <ThermometerSnowflake className="w-3 h-3 text-cyan-600 shrink-0" />
                                    <span>{item.storageCondition}</span>
                                  </div>
                                  {item.batchNumber && (
                                    <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1 py-0.5 rounded">
                                      {item.batchNumber}
                                    </span>
                                  )}
                                </td>

                                <td className="px-3 py-3 text-right shrink-0">
                                  {item.isValid ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        Ready
                                      </span>
                                      <button
                                        onClick={() => handleDeleteParsedRow(item.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                                        title="Exclude this row"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1">
                                      <span 
                                        className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded border border-rose-200"
                                        title={item.validationErrors.join(', ')}
                                      >
                                        Error
                                      </span>
                                      <button
                                        onClick={() => handleDeleteParsedRow(item.id)}
                                        className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-100 cursor-pointer"
                                        title="Remove invalid row"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Staff Authorization Section */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 shrink-0">
                    {authError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-teal-600" />
                          Staff / Administrator Authorization Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          placeholder="Enter your Access PIN (e.g. ADMIN123 or TECH123)"
                          value={accessCodeInput}
                          onChange={(e) => setAccessCodeInput(e.target.value)}
                          className="w-full max-w-md px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      {/* Import Action Button */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setParsedItems([]);
                            setActiveTab('upload');
                          }}
                          className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                        >
                          Start Over
                        </button>
                        
                        <button
                          type="button"
                          disabled={selectedCount === 0 || isImporting}
                          onClick={handleCommitImport}
                          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            {isImporting 
                              ? `Importing (${importProgress}%)...` 
                              : `Import ${selectedCount} Selected Items to Lab`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkInventoryUploadModal;
