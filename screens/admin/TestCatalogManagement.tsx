import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from '../../services/firebase';
import { 
  OFFICIAL_MASTER_TEST_CATALOG, 
  OFFICIAL_CATEGORIES, 
  OfficialCategory, 
  findCategoryForTestName 
} from '../../data/officialTestCatalog';
import { 
  TestTube, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  X, 
  DollarSign, 
  Tag, 
  Clock, 
  Sparkles,
  AlertCircle,
  FlaskConical,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  FileCheck,
  Microscope,
  Info,
  FolderPlus,
  Layers,
  Code,
  Shield,
  FileSpreadsheet
} from 'lucide-react';

interface TestCatalogManagementProps {
  embedded?: boolean;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

interface HierarchicalParam {
  section: string;
  subHeader?: string;
  name: string;
  defaultValue?: string;
  unit?: string;
  dualUnit?: string;
  refRange?: string;
  interpretation?: string;
}

export const TestCatalogManagement: React.FC<TestCatalogManagementProps> = ({
  embedded = false,
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  const { lab } = useAuth();
  const targetLabId = lab?.id || 'lab-1';

  const [catalog, setCatalog] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);

  // New Category Popover / State
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    actCode: 'ACT-LAB',
    cote: 'B30',
    category: 'Hematology' as string,
    price: 4500,
    turnaroundTime: '2 hours after sampling',
    method: '',
    conditions: '',
    sampleType: 'Serum / Venous Blood',
    description: '',
    hierarchicalParams: [] as HierarchicalParam[]
  });

  const turnaroundSuggestions = [
    '30 minutes',
    '1 hour after sampling',
    '1 hour 30 minutes',
    '2 hours after sampling',
    '4 hours after sampling',
    '24 hours (1 day)',
    '48 hours',
    '3 days after sampling',
    '5 to 7 days',
    '10 days after sampling',
    '10 to 14 days'
  ];

  // All combined available categories
  const allCategories = Array.from(new Set([...OFFICIAL_CATEGORIES, ...customCategories]));

  useEffect(() => {
    fetchCatalog();
  }, [targetLabId]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const ref = collection(db, 'labs', targetLabId, 'testCatalog');
      const snap = await getDocs(ref);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Extract unique custom categories if present
      const distinctCats = list.map((item: any) => item.category).filter(Boolean);
      const extras = distinctCats.filter(c => !(OFFICIAL_CATEGORIES as readonly string[]).includes(c));
      setCustomCategories(Array.from(new Set(extras)));

      // If lab hasn't saved a custom catalog yet, fallback to master default list
      if (list.length === 0) {
        list = OFFICIAL_MASTER_TEST_CATALOG.map((item, idx) => ({
          ...item,
          actCode: item.id?.toUpperCase() || `ACT-${idx + 100}`,
          cote: item.category === 'Microbiology' ? 'B95' : item.category === 'Biochemistry' ? 'B30' : 'B45'
        }));
      }
      setCatalog(list);
    } catch (e) {
      console.error('Test catalog fetch error:', e);
      setCatalog(OFFICIAL_MASTER_TEST_CATALOG);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOfficialCatalog = async () => {
    try {
      setSyncing(true);
      setSyncSuccess(false);

      for (const item of OFFICIAL_MASTER_TEST_CATALOG) {
        const itemRef = doc(db, 'labs', targetLabId, 'testCatalog', item.id);
        await setDoc(itemRef, {
          name: item.name,
          category: item.category,
          actCode: item.id?.toUpperCase() || 'ACT-LAB',
          cote: item.category === 'Microbiology' ? 'B95' : item.category === 'Biochemistry' ? 'B30' : 'B45',
          price: item.price,
          turnaroundTime: item.turnaroundTime,
          method: item.method,
          conditions: item.conditions,
          sampleType: item.sampleType,
          description: item.description,
          aliases: item.aliases,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      await fetchCatalog();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err) {
      console.error('Error syncing official catalog:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const cat = newCategoryName.trim();
    if (!customCategories.includes(cat)) {
      setCustomCategories([...customCategories, cat]);
    }
    setFormData(prev => ({ ...prev, category: cat }));
    setNewCategoryName('');
    setShowNewCategoryModal(false);
  };

  // Preset Template loader
  const applyPresetTemplate = (type: 'bacteriology' | 'cervico_vaginal' | 'biochemistry_dual' | 'collection_act') => {
    if (type === 'bacteriology') {
      setFormData(prev => ({
        ...prev,
        category: 'Microbiologie',
        actCode: 'ECBU#',
        cote: 'B95',
        sampleType: 'Urine / Prélèvement Stérile',
        turnaroundTime: '48 hours',
        hierarchicalParams: [
          { section: 'PRELEVEMENT', name: 'Nature du prélèvement', defaultValue: 'Urine de milieu de jet' },
          { section: 'EXAMEN CYTOLOGIQUE', subHeader: 'Examen direct sur culot', name: 'Aspect', defaultValue: 'Claire' },
          { section: 'EXAMEN CYTOLOGIQUE', subHeader: 'Examen direct sur culot', name: 'Couleur', defaultValue: 'Inexistant' },
          { section: 'EXAMEN CYTOLOGIQUE', subHeader: 'Numération cytologique', name: 'Leucocytes', defaultValue: '< 02 /mm3', refRange: '< 10 /mm3' },
          { section: 'EXAMEN CYTOLOGIQUE', subHeader: 'Numération cytologique', name: 'Hématies', defaultValue: 'Rares', refRange: '< 05 /mm3' },
          { section: 'EXAMEN CYTOLOGIQUE', subHeader: 'Éléments microscopiques', name: 'Cristaux', defaultValue: 'Non observés' },
          { section: 'EXAMEN CYTOLOGIQUE', subHeader: 'Éléments microscopiques', name: 'Cylindres', defaultValue: 'Non observés' },
          { section: 'EXAMEN BACTERIOLOGIQUE', subHeader: 'Coloration de Gram du Culot', name: 'Coloration de Gram', defaultValue: 'Absence de germe visible' },
          { section: 'EXAMEN BACTERIOLOGIQUE', subHeader: 'Culture & Identification', name: 'Culture sur géloses', defaultValue: 'Culture stérile après 48h à 37°C' }
        ]
      }));
    } else if (type === 'cervico_vaginal') {
      setFormData(prev => ({
        ...prev,
        category: 'Microbiologie',
        actCode: 'FCV#',
        cote: 'B90',
        sampleType: 'Prélèvement Cervico-Vaginal',
        turnaroundTime: '48 hours',
        hierarchicalParams: [
          { section: 'PRELEVEMENT', name: 'Site de ponction', defaultValue: 'Cul-de-sac vaginal postérieur' },
          { section: 'EXAMEN CYTOLOGIQUE', subHeader: 'Cytologie', name: 'Cellules épithéliales', defaultValue: 'Nombreuses' },
          { section: 'EXAMEN CYTOLOGIQUE', subHeader: 'Cytologie', name: 'Polynucléaires neutrophiles', defaultValue: 'Quelques' },
          { section: 'EXAMEN CYTOLOGIQUE', subHeader: 'Flore de Döderlein', name: 'Bacilles de Döderlein', defaultValue: 'Présents et abondants' },
          { section: 'EXAMEN BACTERIOLOGIQUE', subHeader: 'Microscopie & Recherche', name: 'Levures / Spores', defaultValue: 'Absence de filaments mycéliens' },
          { section: 'EXAMEN BACTERIOLOGIQUE', subHeader: 'Microscopie & Recherche', name: 'Trichomonas vaginalis', defaultValue: 'Négatif' },
          { section: 'EXAMEN BACTERIOLOGIQUE', subHeader: 'Culture', name: 'Culture mycologique & bactérienne', defaultValue: 'Flore physiologique normale' }
        ]
      }));
    } else if (type === 'biochemistry_dual') {
      setFormData(prev => ({
        ...prev,
        category: 'Biochimie Sanguine',
        actCode: 'GLYP#',
        cote: 'B30',
        sampleType: 'Sérum / Plasma Fluoré',
        turnaroundTime: '2 hours after sampling',
        hierarchicalParams: [
          { 
            section: 'BIOCHIMIE SANGUINE', 
            name: 'Glycémie à jeun (Glucose)', 
            defaultValue: '1.05', 
            unit: 'g/L', 
            dualUnit: '5.83 mmol/L', 
            refRange: '0.70 - 1.10 g/L (3.89 - 6.11 mmol/L)',
            interpretation: 'Hypoglycémie: < 0.70 g/L; Normal: 0.70 - 1.10 g/L; Diabète: >= 1.26 g/L'
          }
        ]
      }));
    } else if (type === 'collection_act') {
      setFormData(prev => ({
        ...prev,
        category: 'Actes de Prélèvement',
        actCode: 'PSE#',
        cote: 'KB1,5',
        price: 2500,
        name: 'ACTE DE PRELEVEMENT DE SANG ES',
        sampleType: 'Prélèvement sanguin par ponction veineuse',
        turnaroundTime: 'Immédiat',
        hierarchicalParams: []
      }));
    }
  };

  const handleAddHierarchicalParam = () => {
    setFormData(prev => ({
      ...prev,
      hierarchicalParams: [
        ...prev.hierarchicalParams,
        { section: 'EXAMEN DIRECT', name: 'Nouveau Paramètre', defaultValue: '', unit: '', refRange: '' }
      ]
    }));
  };

  const handleUpdateHierarchicalParam = (index: number, field: keyof HierarchicalParam, val: string) => {
    const updated = [...formData.hierarchicalParams];
    updated[index] = { ...updated[index], [field]: val };
    setFormData(prev => ({ ...prev, hierarchicalParams: updated }));
  };

  const handleRemoveHierarchicalParam = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hierarchicalParams: prev.hierarchicalParams.filter((_, idx) => idx !== index)
    }));
  };

  const handleOpenAdd = () => {
    setEditingTest(null);
    setFormData({
      name: '',
      actCode: 'ACT-LAB',
      cote: 'B30',
      category: 'Hematology',
      price: 5000,
      turnaroundTime: '2 hours after sampling',
      method: 'Automated Clinical Diagnostic Procedure',
      conditions: 'Fasting venous blood or standard sample',
      sampleType: 'Serum / Venous Blood',
      description: '',
      hierarchicalParams: []
    });
    setShowModal(true);
  };

  const handleOpenEdit = (test: any) => {
    setEditingTest(test);
    setFormData({
      name: test.name || test.testName || '',
      actCode: test.actCode || test.code || 'ACT-LAB',
      cote: test.cote || 'B30',
      category: test.category || 'Hematology',
      price: test.price || 4500,
      turnaroundTime: test.turnaroundTime || test.expectedTime || '2 hours after sampling',
      method: test.method || '',
      conditions: test.conditions || '',
      sampleType: test.sampleType || 'Venous Blood / Serum',
      description: test.description || '',
      hierarchicalParams: test.hierarchicalParams || []
    });
    setShowModal(true);
  };

  const handleNameChange = (newName: string) => {
    // Automatically match appropriate medical category if not actively changed
    const detectedCategory = findCategoryForTestName(newName);
    setFormData(prev => ({
      ...prev,
      name: newName,
      category: prev.category === 'Hematology' ? detectedCategory : prev.category
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingTest) {
        await updateDoc(doc(db, 'labs', targetLabId, 'testCatalog', editingTest.id), {
          ...formData,
          testName: formData.name,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'labs', targetLabId, 'testCatalog'), {
          ...formData,
          testName: formData.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setShowModal(false);
      fetchCatalog();
    } catch (err) {
      console.error('Error saving test catalog item:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this test from your laboratory catalog?')) {
      try {
        await deleteDoc(doc(db, 'labs', targetLabId, 'testCatalog', id));
        fetchCatalog();
      } catch (err) {
        console.error('Error deleting catalog item:', err);
      }
    }
  };

  const filteredCatalog = catalog.filter(t => {
    const matchesSearch = 
      (t.name || t.testName || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.actCode || t.code || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.cote || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.method || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.conditions || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '')?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Microbiology':
      case 'Microbiologie':
      case 'Bactériologie':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Hematology':
      case 'Hématologie':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Serology / Immunology':
      case 'Sérologie':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Biochemistry':
      case 'Biochimie':
      case 'Biochimie Sanguine':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Hormones & Tumor Markers':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'Actes de Prélèvement':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
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

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-100 text-teal-800 tracking-wide">
              Official Diagnostic Standards & COTE Acts
            </span>
            <span className="text-xs text-slate-400 font-semibold">• {catalog.length} Active Acts / Tests</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Medical Laboratory Test & Category Architecture</h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Configure diagnostic nomenclature (Act Codes, COTE B/KB/P), multi-tier observation sections (Bacteriology, Cytology, Dual-Unit Biochemistry), and custom category structures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowNewCategoryModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-teal-700" />
            <span>+ Add Category</span>
          </button>

          <button
            onClick={handleSyncOfficialCatalog}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Import or restore official 80+ clinical tests with complete medical metadata"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-teal-400' : 'text-teal-400'}`} />
            <span>{syncing ? 'Syncing Catalog...' : 'Sync Official 80+ Catalog'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Test / Act</span>
          </button>
        </div>
      </div>

      {syncSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Official laboratory test catalog synced successfully with complete medical categories, withdrawal preparations, turnaround timings, and base prices!</span>
        </div>
      )}

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Categories ({catalog.length})
        </button>
        {allCategories.map(cat => {
          const count = catalog.filter(c => c.category === cat).length;
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search catalog by test name, act code (CREATS#, PK#, GLYP#), COTE (B30, KB1,0), method, or category..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs"
        />
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCatalog.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 shrink-0 mt-0.5">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
                      {item.name || item.testName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getCategoryBadgeColor(item.category)}`}>
                        {item.category || 'General'}
                      </span>
                      {item.actCode && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.actCode}
                        </span>
                      )}
                      {item.cote && (
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          COTE: {item.cote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 cursor-pointer"
                    title="Edit Test Details & Price"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Delete Test"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Turnaround Time Badge */}
              <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
                <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="text-[11px] font-medium text-slate-500">Turnaround:</span>
                <span className="font-bold text-slate-900 text-[11px]">
                  {item.turnaroundTime || item.expectedTime || '24 Hours'}
                </span>
              </div>

              {/* Hierarchical Structure Summary */}
              {item.hierarchicalParams && item.hierarchicalParams.length > 0 && (
                <div className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-200/60 text-[11px] text-teal-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-[10px] uppercase text-teal-800">
                    <Layers className="w-3 h-3 text-teal-600" />
                    Structured Template ({item.hierarchicalParams.length} parameters)
                  </div>
                  <div className="text-[10px] text-teal-800 font-mono truncate">
                    {Array.from(new Set(item.hierarchicalParams.map((p: any) => p.section))).join(' • ')}
                  </div>
                </div>
              )}

              {/* Conditions of Withdrawal / Preparation */}
              {item.conditions && (
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-0.5">
                  <div className="font-bold flex items-center gap-1 text-[10px] uppercase text-amber-800">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Preparation & Withdrawal Conditions
                  </div>
                  <p className="line-clamp-2 leading-relaxed text-amber-950 font-medium">
                    {item.conditions}
                  </p>
                </div>
              )}
            </div>

            {/* Price & Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Lab Pricing</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {item.price ? `${item.price.toLocaleString()} FCFA` : '4,500 FCFA'}
                </span>
              </div>

              <button
                onClick={() => handleOpenEdit(item)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Customize Structure & Price
              </button>
            </div>
          </div>
        ))}

        {filteredCatalog.length === 0 && !loading && (
          <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No tests matching your search query</p>
            <button
              onClick={handleSyncOfficialCatalog}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
            >
              Sync Official Catalog
            </button>
          </div>
        )}
      </div>

      {/* Modal for Creating New Custom Category */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Add New Diagnostic Category</h3>
              </div>
              <button onClick={() => setShowNewCategoryModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Parasitologie, Mycologie, Cytologie, Actes de Prélèvement..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewCategory}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md hover:bg-teal-700 cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add / Edit Test & Hierarchical Structure */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-teal-700 text-white">
              <div>
                <h3 className="font-bold text-base">
                  {editingTest ? 'Edit Diagnostic Test & Template Architecture' : 'Add New Clinical Test / Act'}
                </h3>
                <p className="text-[11px] text-teal-100">Set act codes, nomenclature COTE, multi-tier sections & pricing</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Quick Preset Buttons */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Architecture Presets (Auto-populate sections):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('bacteriology')}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-teal-500 text-xs font-bold text-slate-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Microscope className="w-3.5 h-3.5 text-amber-600" />
                    <span>Bactériologie / ECBU Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('cervico_vaginal')}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-teal-500 text-xs font-bold text-slate-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                    <span>Prélèvement Cervico-Vaginal Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('biochemistry_dual')}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-teal-500 text-xs font-bold text-slate-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                    <span>Biochimie Dual-Unit Glycémie</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('collection_act')}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-teal-500 text-xs font-bold text-slate-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Acte de Prélèvement (KB 1,5)</span>
                  </button>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Test / Act Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EXAMEN CYTO-BACTERIOLOGIQUE DES URINES or GLYCEMIE A JEUN"
                    value={formData.name}
                    onChange={e => handleNameChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medical Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Act Code & Nomenclature COTE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Act Code (Nomenclature)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CREATS#, GLYP#, ECBU#, PSE#, PK#"
                    value={formData.actCode}
                    onChange={e => setFormData({ ...formData, actCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    COTE (B / KB / P)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B30, B45, B95, KB1,0, KB1,5, P20"
                    value={formData.cote}
                    onChange={e => setFormData({ ...formData, cote: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Laboratory Price (FCFA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Turnaround Time & Sample Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Turnaround Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2 hours after sampling, 48 hours"
                    value={formData.turnaroundTime}
                    onChange={e => setFormData({ ...formData, turnaroundTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specimen / Sample Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Midstream Urine, Serum, Stool, Cervical Swab..."
                    value={formData.sampleType}
                    onChange={e => setFormData({ ...formData, sampleType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Structured Hierarchical Multi-Tier Parameters Builder */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-teal-600" />
                      Hierarchical Template Parameters (Cytology, Bacteriology, Biochemistry)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Static formatted parameter rows on the left with configurable default observations for lab techs
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddHierarchicalParam}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Parameter Row</span>
                  </button>
                </div>

                {formData.hierarchicalParams.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    No sub-parameters configured. This test will use a standard single result input, or click a preset above to load multi-tier sections.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto p-1">
                    {formData.hierarchicalParams.map((param, pIdx) => (
                      <div key={pIdx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-bold text-slate-500 block">Section Header</label>
                            <input
                              type="text"
                              value={param.section}
                              onChange={e => handleUpdateHierarchicalParam(pIdx, 'section', e.target.value)}
                              placeholder="e.g. EXAMEN CYTOLOGIQUE"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-bold text-slate-500 block">Parameter Name</label>
                            <input
                              type="text"
                              value={param.name}
                              onChange={e => handleUpdateHierarchicalParam(pIdx, 'name', e.target.value)}
                              placeholder="e.g. Leucocytes, Cristaux, Aspect"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-bold text-slate-500 block">Default / Observation</label>
                            <input
                              type="text"
                              value={param.defaultValue || ''}
                              onChange={e => handleUpdateHierarchicalParam(pIdx, 'defaultValue', e.target.value)}
                              placeholder="e.g. Rares, < 02 /mm3, Claire"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 block">Ref. Range / Dual</label>
                            <input
                              type="text"
                              value={param.refRange || param.dualUnit || ''}
                              onChange={e => handleUpdateHierarchicalParam(pIdx, 'refRange', e.target.value)}
                              placeholder="< 10 /mm3 or 5.45 mmol/L"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                            />
                          </div>

                          <div className="sm:col-span-1 flex items-end justify-center pb-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveHierarchicalParam(pIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conditions of Withdrawal / Preparation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Conditions of Withdrawal & Patient Preparation
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 12-hour strict overnight fast; no antibiotics for 10 days; 3 hours without urinating..."
                  value={formData.conditions}
                  onChange={e => setFormData({ ...formData, conditions: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md hover:bg-teal-700 cursor-pointer"
                >
                  Save Test Configuration & Architecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Diagnostic Test & Category Architecture"
        subtitle="Configure medical tests, nomenclature COTE, observation templates & pricing"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {content}
      </main>
    </div>
  );
};

export default TestCatalogManagement;
