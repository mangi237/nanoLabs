import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection, addDoc, updateDoc, deleteDoc, doc } from '../../services/firebase';
import { authService } from '../../services/authService';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  FlaskConical, 
  Calendar, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Sparkles,
  Layers,
  ThermometerSnowflake,
  Filter,
  FileSpreadsheet,
  Upload,
  History,
  User as UserIcon
} from 'lucide-react';
import BulkInventoryUploadModal from '../../components/inventory/BulkInventoryUploadModal';

interface InventoryManagementProps {
  embedded?: boolean;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const MEASURING_UNITS = [
  'Liters (L)',
  'Milliliters (mL)',
  'Bottles',
  'Vials',
  'Ampoules',
  'Boxes',
  'Kits',
  'Test Strips',
  'Packs',
  'Cartridges',
  'Specimen Tubes',
  'Grams (g)',
  'Milligrams (mg)',
  'Pieces / Units'
];

export const INVENTORY_CATEGORIES = [
  'Reagents',
  'Chemicals & Solutions',
  'Consumables & Tubes',
  'Testing Kits',
  'PPE & Bio-Safety',
  'Sanitization & Sterilization'
];

export const STORAGE_CONDITIONS = [
  'Room Temp (15°C - 25°C)',
  'Refrigerated (2°C - 8°C)',
  'Frozen (-20°C)',
  'Deep Freeze (-80°C)',
  'Dark & Dry Cabinet'
];

// Initial seed items for new labs
const SEED_INVENTORY_ITEMS = [
  {
    name: 'Giemsa Staining Solution',
    category: 'Chemicals & Solutions',
    unit: 'Bottles',
    quantity: 12,
    initialQuantity: 20,
    reorderLevel: 5,
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    supplier: 'MedChem Lab Supplies',
    storageCondition: 'Dark & Dry Cabinet',
    batchNumber: 'LOT-GMS-9021',
    description: 'High-purity Giemsa stain for blood smear and malaria parasite cytology.'
  },
  {
    name: 'Vacutainer EDTA K3 Blood Tubes',
    category: 'Consumables & Tubes',
    unit: 'Specimen Tubes',
    quantity: 350,
    initialQuantity: 500,
    reorderLevel: 100,
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    supplier: 'BD Diagnostics Global',
    storageCondition: 'Room Temp (15°C - 25°C)',
    batchNumber: 'LOT-EDTA-4412',
    description: 'Lavender top tubes for Complete Blood Count and Hematology profiles.'
  },
  {
    name: 'Blood Glucose Enzymatic Reagent',
    category: 'Reagents',
    unit: 'Kits',
    quantity: 3,
    initialQuantity: 25,
    reorderLevel: 8,
    expiryDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
    supplier: 'Roche Diagnostics Africa',
    storageCondition: 'Refrigerated (2°C - 8°C)',
    batchNumber: 'LOT-GLU-7721',
    description: 'GOD-PAP enzymatic determination of glucose in serum or plasma.'
  },
  {
    name: 'Absolute Ethanol 99.8% ACS Grade',
    category: 'Chemicals & Solutions',
    unit: 'Liters (L)',
    quantity: 4.5,
    initialQuantity: 20,
    reorderLevel: 5,
    expiryDate: new Date(Date.now() + 240 * 86400000).toISOString().split('T')[0],
    supplier: 'Cameroon Chemical Depot',
    storageCondition: 'Dark & Dry Cabinet',
    batchNumber: 'LOT-ETH-1109',
    description: 'Solvent and fixation agent for clinical pathology staining.'
  },
  {
    name: 'Urine Multistix 10-SG Test Strips',
    category: 'Testing Kits',
    unit: 'Boxes',
    quantity: 1,
    initialQuantity: 15,
    reorderLevel: 4,
    expiryDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    supplier: 'Siemens Healthcare',
    storageCondition: 'Room Temp (15°C - 25°C)',
    batchNumber: 'LOT-URI-3381',
    description: 'Urinalysis urinal test strips for leukocytes, nitrites, protein, pH, blood.'
  },
  {
    name: 'Lipid Cholesterol CHOD-PAP Reagent',
    category: 'Reagents',
    unit: 'Vials',
    quantity: 18,
    initialQuantity: 30,
    reorderLevel: 6,
    expiryDate: new Date(Date.now() + 65 * 86400000).toISOString().split('T')[0],
    supplier: 'Mindray Reagents',
    storageCondition: 'Refrigerated (2°C - 8°C)',
    batchNumber: 'LOT-CHOD-8823',
    description: 'Enzymatic photometric test for Total Cholesterol assay.'
  }
];

// Define the ReagentUsage interface (must match the one in limsService)
export interface ReagentUsage {
  reagentName: string;
  quantity: number;
  testName: string;
  reagentId?: string;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  embedded = false,
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  const { lab, user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  
  // Modal & Edit state
  const [showModal, setShowModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reagent usage history state
  const [selectedItemHistory, setSelectedItemHistory] = useState<any | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Reagents',
    unit: 'Bottles',
    quantity: 20,
    initialQuantity: 25,
    reorderLevel: 5,
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    supplier: 'MedTech Diagnostics',
    storageCondition: 'Room Temp (15°C - 25°C)',
    batchNumber: '',
    description: ''
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const targetLabId = lab?.id || 'lab-1';
      const invRef = collection(db, 'labs', targetLabId, 'inventory');
      const snap = await getDocs(invRef);
      
      // Use type assertion to handle the dynamic nature of Firestore data
      let list = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      })) as any[];
  
      // Auto-seed demo items if inventory is empty
      if (list.length === 0) {
        console.log('Seeding initial lab inventory items...');
        for (const seed of SEED_INVENTORY_ITEMS) {
          const seedData = {
            ...seed,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageHistory: [] // usageHistory is now part of the seed data
          };
          const docRef = await addDoc(invRef, seedData);
          list.push({ 
            id: docRef.id, 
            ...seedData 
          });
        }
      }
  
      setItems(list);
    } catch (e) {
      console.error('Inventory fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lab?.id]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Chemicals & Solutions',
      unit: 'Bottles',
      quantity: 20,
      initialQuantity: 25,
      reorderLevel: 5,
      expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      supplier: 'MedChem Diagnostics',
      storageCondition: 'Room Temp (15°C - 25°C)',
      batchNumber: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      description: ''
    });
    setAccessCodeInput(user?.accessCode || '');
    setVerifyError('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'Reagents',
      unit: item.unit || 'Bottles',
      quantity: item.quantity ?? 10,
      initialQuantity: item.initialQuantity || Math.max(item.quantity || 10, item.reorderLevel * 2 || 20),
      reorderLevel: item.reorderLevel ?? 5,
      expiryDate: item.expiryDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      supplier: item.supplier || '',
      storageCondition: item.storageCondition || 'Room Temp (15°C - 25°C)',
      batchNumber: item.batchNumber || '',
      description: item.description || ''
    });
    setAccessCodeInput(user?.accessCode || '');
    setVerifyError('');
    setShowModal(true);
  };

  const handleViewHistory = (item: any) => {
    setSelectedItemHistory(item);
    setShowHistoryModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');

    if (!formData.name.trim()) {
      setVerifyError('Chemical or Material name is required.');
      return;
    }

    if (!accessCodeInput.trim()) {
      setVerifyError('Staff / Administrator access code is required to authorize inventory changes.');
      return;
    }

    setSubmitting(true);
    try {
      // Verify authorization code
      const authCheck = await authService.verifyStaffActionCode(
        accessCodeInput,
        ['admin', 'superadmin', 'labtech', 'analyzer', 'cashier'],
        user?.accessCode
      );

      if (!authCheck.authorized) {
        setVerifyError(authCheck.error || 'Invalid authorization code. Please enter your valid staff/admin access code.');
        setSubmitting(false);
        return;
      }

      const targetLabId = lab?.id || 'lab-1';
      const staffName = authCheck.staffName || user?.name || 'Staff Member';

      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        initialQuantity: Number(formData.initialQuantity) || Number(formData.quantity),
        reorderLevel: Number(formData.reorderLevel),
        lastModifiedBy: staffName,
        lastModifiedCode: accessCodeInput,
        updatedAt: new Date().toISOString()
      };

      if (editingItem) {
        await updateDoc(doc(db, 'labs', targetLabId, 'inventory', editingItem.id), payload);
      } else {
        await addDoc(collection(db, 'labs', targetLabId, 'inventory'), {
          ...payload,
          createdAt: new Date().toISOString(),
          usageHistory: []
        });
      }

      setShowModal(false);
      await fetchInventory();
    } catch (err: any) {
      console.error('Error saving inventory item:', err);
      setVerifyError(err?.message || 'Failed to save inventory record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently remove "${name}" from the laboratory inventory?`)) {
      try {
        const targetLabId = lab?.id || 'lab-1';
        await deleteDoc(doc(db, 'labs', targetLabId, 'inventory', id));
        fetchInventory();
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }
  };

  // Compute Days to Expiry and Status Badge
  const getExpiryStatus = (expiryDateStr?: string) => {
    if (!expiryDateStr) {
      return {
        label: 'No Expiry Set',
        colorClass: 'bg-slate-100 text-slate-600 border-slate-200',
        isDanger: false
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expiryDateStr);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `⚠️ EXPIRED (${Math.abs(diffDays)}d ago)`,
        colorClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
        isDanger: true,
        days: diffDays
      };
    }

    if (diffDays <= 30) {
      return {
        label: `⏳ EXPIRES IN ${diffDays} DAYS`,
        colorClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        isDanger: true,
        days: diffDays
      };
    }

    if (diffDays <= 90) {
      return {
        label: `📅 Expires in ${diffDays} days`,
        colorClass: 'bg-yellow-50 text-yellow-800 border-yellow-200 font-medium',
        isDanger: false,
        days: diffDays
      };
    }

    return {
      label: `✅ Valid (${expiryDateStr})`,
      colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      isDanger: false,
      days: diffDays
    };
  };

  // Compute Quantity Status & Color
  const getQuantityStats = (item: any) => {
    const qty = Number(item.quantity) || 0;
    const initial = Number(item.initialQuantity) || Math.max(qty, (Number(item.reorderLevel) || 5) * 2, 20);
    const reorder = Number(item.reorderLevel) || 5;

    const percentage = Math.min(100, Math.max(0, Math.round((qty / initial) * 100)));

    let status = 'healthy';
    let label = 'Optimal Stock';
    let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    let barColor = 'bg-emerald-500';

    if (qty === 0) {
      status = 'danger';
      label = 'OUT OF STOCK (0%)';
      badgeClass = 'bg-rose-100 text-rose-900 border-rose-300 font-black animate-pulse';
      barColor = 'bg-rose-600';
    } else if (qty <= reorder || percentage <= 20) {
      status = 'danger';
      label = `CRITICAL LOW (${percentage}%)`;
      badgeClass = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
      barColor = 'bg-rose-500';
    } else if (percentage <= 45) {
      status = 'warning';
      label = `REORDER SOON (${percentage}%)`;
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      barColor = 'bg-amber-500';
    }

    return {
      qty,
      initial,
      percentage,
      status,
      label,
      badgeClass,
      barColor
    };
  };

  // Filter Items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
      return false;
    }

    const qStats = getQuantityStats(item);
    const expStats = getExpiryStatus(item.expiryDate);

    if (stockStatusFilter === 'low' && qStats.status !== 'danger') return false;
    if (stockStatusFilter === 'expired' && !expStats.isDanger) return false;
    if (stockStatusFilter === 'healthy' && qStats.status !== 'healthy') return false;

    return true;
  });

  const totalItemsCount = items.length;
  const lowStockCount = items.filter(i => getQuantityStats(i).status === 'danger').length;
  const expiringCount = items.filter(i => getExpiryStatus(i.expiryDate).isDanger).length;

  // History Modal
  const HistoryModal = () => {
    if (!selectedItemHistory) return null;
    const history = selectedItemHistory.usageHistory || [];
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-teal-300" />
              <div>
                <h3 className="font-bold text-base">Reagent Usage History</h3>
                <p className="text-slate-300 text-xs">{selectedItemHistory.name}</p>
              </div>
            </div>
            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {history.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p>No usage records for this reagent yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((entry: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900">{entry.reagentName}</span>
                        <span className="text-slate-500 ml-2">× {entry.quantity}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <UserIcon className="w-3 h-3" />
                      <span>By: {entry.usedBy || 'Unknown'}</span>
                      <span>•</span>
                      <span>Test: {entry.testName || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-200 flex justify-end">
            <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const content = (
    <div className="space-y-6">
      {onBack && !embedded && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chemicals, Reagents & Consumables Register</h2>
            <p className="text-xs text-slate-500">
              Track exact stock quantities, measuring units (Liters, Bottles, Vials, Tubes), expiration alerts & access authorization
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>CSV / Excel Bulk Upload</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Chemical / Reagent
          </button>
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalItemsCount}</div>
            <div className="text-xs font-bold text-slate-700">Total Tracked Items</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Substances & clinical supplies</p>
          </div>
        </div>

        <div className="bg-rose-50/80 border border-rose-200/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-900">{lowStockCount}</div>
            <div className="text-xs font-bold text-rose-800">Critical Low Stock</div>
            <p className="text-[11px] text-rose-700/80 mt-0.5">Below threshold & danger limit</p>
          </div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950">{expiringCount}</div>
            <div className="text-xs font-bold text-amber-900">Expiring / Expired Items</div>
            <p className="text-[11px] text-amber-800/80 mt-0.5">Within 30 days or past shelf-life</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by chemical name, category, LOT number or supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Quick Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'low', label: `🚨 Low Stock (${lowStockCount})` },
              { id: 'expired', label: `⏳ Expiry Alert (${expiringCount})` },
              { id: 'healthy', label: '✅ Healthy' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStockStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  stockStatusFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] shrink-0">Category:</span>
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {INVENTORY_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer shrink-0 ${
                selectedCategoryFilter === cat
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading laboratory inventory register...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center px-4 space-y-2">
            <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No inventory records found</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or add a new chemical substance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Substance / Reagent</th>
                  <th className="px-4 py-3.5">Category & Storage</th>
                  <th className="px-5 py-3.5">Quantity & Stock Health</th>
                  <th className="px-4 py-3.5">Measuring Unit</th>
                  <th className="px-5 py-3.5">Expiration Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredItems.map(item => {
                  const qStats = getQuantityStats(item);
                  const expStats = getExpiryStatus(item.expiryDate);
                  const usageCount = (item.usageHistory || []).length;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Substance Name & LOT */}
                      <td className="px-5 py-4 min-w-[200px]">
                        <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                          {item.batchNumber && (
                            <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.batchNumber}
                            </span>
                          )}
                          {item.supplier && <span>Vendor: {item.supplier}</span>}
                          {usageCount > 0 && (
                            <span className="text-teal-600 font-semibold">{usageCount} uses</span>
                          )}
                        </div>
                      </td>

                      {/* Category & Storage */}
                      <td className="px-4 py-4 min-w-[150px]">
                        <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200 block w-fit mb-1">
                          {item.category || 'Reagent'}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <ThermometerSnowflake className="w-3 h-3 text-cyan-600" />
                          {item.storageCondition || 'Room Temp'}
                        </span>
                      </td>

                      {/* Quantity Level & Estimated Percentage with Color Bar */}
                      <td className="px-5 py-4 min-w-[220px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-slate-900 text-sm">
                              {qStats.qty} <span className="text-xs font-semibold text-slate-600">{item.unit || 'units'} left</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] border ${qStats.badgeClass}`}>
                              {qStats.label}
                            </span>
                          </div>

                          {/* Estimated Percentage Progress Bar */}
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${qStats.barColor}`}
                              style={{ width: `${qStats.percentage}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Min Threshold: {item.reorderLevel || 5}</span>
                            <span>Capacity: {qStats.initial}</span>
                          </div>
                        </div>
                      </td>

                      {/* Measuring Type Unit */}
                      <td className="px-4 py-4 min-w-[110px]">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-800 text-xs border border-slate-200">
                          {item.unit || 'Bottles'}
                        </span>
                      </td>

                      {/* Expiry Date Alert */}
                      <td className="px-5 py-4 min-w-[160px]">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border ${expStats.colorClass}`}>
                            {expStats.label}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            Expiry: {item.expiryDate || 'N/A'}
                          </div>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-4 text-right space-x-1 shrink-0 min-w-[120px]">
                        <button
                          onClick={() => handleViewHistory(item)}
                          title="View Usage History"
                          className="p-2 text-slate-500 hover:text-indigo-700 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Chemical / Update Quantity"
                          className="p-2 text-slate-500 hover:text-teal-700 rounded-xl hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          title="Delete Item"
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Substance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-800 to-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <FlaskConical className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingItem ? 'Edit Chemical / Inventory Item' : 'Add Chemical or Substance to Register'}
                  </h3>
                  <p className="text-teal-200 text-xs">Configure stock quantity, measuring unit, expiry & authorization</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {verifyError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Chemical Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Chemical Substance / Material Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Giemsa Staining Solution, Ethanol 99%, Vacutainer EDTA Tubes..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Category & Measuring Type Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {INVENTORY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-1">
                    Measuring Unit Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-teal-300 bg-teal-50/50 text-xs font-bold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {MEASURING_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantities & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                    Current Quantity ({formData.unit}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                    Full Capacity ({formData.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={formData.initialQuantity}
                    onChange={e => setFormData({ ...formData, initialQuantity: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                    Reorder Danger Threshold
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={e => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Expiry Date & Storage Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Expiration Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-[10px] text-amber-700 mt-1">
                    System automatically highlights items close to or past expiration.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Storage Condition
                  </label>
                  <select
                    value={formData.storageCondition}
                    onChange={e => setFormData({ ...formData, storageCondition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {STORAGE_CONDITIONS.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch / Lot # & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Batch / LOT Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LOT-2026-CH88"
                    value={formData.batchNumber}
                    onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Supplier / Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MedTech Supplies"
                    value={formData.supplier}
                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Authorization Access Code */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-teal-600" />
                  Staff / Manager Access Code Authorization <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter access code (e.g. ADMIN123 or TECH123)"
                  value={accessCodeInput}
                  onChange={e => setAccessCodeInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Required to verify and audit inventory modifications.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {submitting ? 'Saving...' : editingItem ? 'Save Updates' : 'Add Item to Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && <HistoryModal />}

      {/* Bulk CSV / Excel Upload Modal */}
      <BulkInventoryUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={(_count) => {
          fetchInventory();
        }}
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Laboratory Inventory & Substance Manager"
        subtitle="Manage reagents, chemical substances, measuring units, quantities & expiry"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {content}
      </main>
    </div>
  );
};

export default InventoryManagement;