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
  Info
} from 'lucide-react';

interface TestCatalogManagementProps {
  embedded?: boolean;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Hematology' as OfficialCategory,
    price: 4500,
    turnaroundTime: '2 hours after sampling',
    method: '',
    conditions: '',
    sampleType: 'Serum / Venous Blood',
    description: ''
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

  useEffect(() => {
    fetchCatalog();
  }, [targetLabId]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const ref = collection(db, 'labs', targetLabId, 'testCatalog');
      const snap = await getDocs(ref);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // If lab hasn't saved a custom catalog yet, fallback to master default list
      if (list.length === 0) {
        list = OFFICIAL_MASTER_TEST_CATALOG;
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

  const handleOpenAdd = () => {
    setEditingTest(null);
    setFormData({
      name: '',
      category: 'Hematology',
      price: 5000,
      turnaroundTime: '2 hours after sampling',
      method: 'Automated Clinical Diagnostic Procedure',
      conditions: 'Fasting venous blood or standard sample',
      sampleType: 'Serum / Venous Blood',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (test: any) => {
    setEditingTest(test);
    setFormData({
      name: test.name || test.testName || '',
      category: (test.category || 'Hematology') as OfficialCategory,
      price: test.price || 4500,
      turnaroundTime: test.turnaroundTime || test.expectedTime || '2 hours after sampling',
      method: test.method || '',
      conditions: test.conditions || '',
      sampleType: test.sampleType || 'Venous Blood / Serum',
      description: test.description || ''
    });
    setShowModal(true);
  };

  const handleNameChange = (newName: string) => {
    // Automatically match appropriate medical category if not actively changed
    const detectedCategory = findCategoryForTestName(newName);
    setFormData(prev => ({
      ...prev,
      name: newName,
      category: detectedCategory
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
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Hematology':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Serology / Immunology':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Biochemistry':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Hormones & Tumor Markers':
        return 'bg-teal-50 text-teal-800 border-teal-200';
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
              Official Diagnostic Standards
            </span>
            <span className="text-xs text-slate-400 font-semibold">• {catalog.length} Active Procedures</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Medical Laboratory Test Catalog</h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Manage test procedures, withdrawal preparations, turnaround timing, and custom laboratory pricing across all 5 official medical categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            <span>Add Custom Test</span>
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
        {OFFICIAL_CATEGORIES.map(cat => {
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
          placeholder="Search catalog by test name, method, preparation condition, or description..."
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
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getCategoryBadgeColor(item.category)}`}>
                        {item.category || 'Hematology'}
                      </span>
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

              {/* Method */}
              {item.method && (
                <div className="text-[11px] text-slate-500 line-clamp-1">
                  <span className="font-semibold text-slate-700">Method: </span>
                  {item.method}
                </div>
              )}

              {/* Description */}
              {item.description && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
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
                Customize Price
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

      {/* Modal for Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-teal-700 text-white">
              <div>
                <h3 className="font-bold text-base">
                  {editingTest ? 'Edit Diagnostic Test & Pricing' : 'Add New Clinical Test'}
                </h3>
                <p className="text-[11px] text-teal-100">Set procedure name, category, preparation conditions and prices</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Blood Count (FBC / CBC) or Stool Culture"
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Category will auto-select as you type the test name
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medical Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as OfficialCategory })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    {OFFICIAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Laboratory Price (FCFA / XAF) <span className="text-red-500">*</span>
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

              {/* Turnaround Time */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Turnaround Time (Time to Return Results) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Prominently displayed to patients</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2 hours after sampling, 3 days after sampling"
                  value={formData.turnaroundTime}
                  onChange={e => setFormData({ ...formData, turnaroundTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
                />

                {/* Turnaround Time Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {turnaroundSuggestions.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData({ ...formData, turnaroundTime: time })}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        formData.turnaroundTime === time
                          ? 'bg-teal-600 text-white border-teal-600 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
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
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Patients will see these withdrawal instructions before booking so they prepare adequately
                </span>
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Analytical Method / Technology
                </label>
                <input
                  type="text"
                  placeholder="e.g. Real-Time RT-PCR, 5-part Flow Cytometry, ELISA, Microplate Culture..."
                  value={formData.method}
                  onChange={e => setFormData({ ...formData, method: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Sample Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specimen / Sample Type
                </label>
                <input
                  type="text"
                  placeholder="e.g. Serum (Red tube), EDTA Whole Blood, Stool, Midstream Urine..."
                  value={formData.sampleType}
                  onChange={e => setFormData({ ...formData, sampleType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Clinical significance and diagnostic purpose..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  Save Test Configuration
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
        title="Diagnostic Test Catalog"
        subtitle="Configure medical tests, turnaround times & pricing"
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
