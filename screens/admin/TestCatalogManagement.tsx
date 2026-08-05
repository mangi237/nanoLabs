import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/authContext';
import { db, getDocs, collection, addDoc, updateDoc, deleteDoc, doc } from '../../services/firebase';
import { TestTube, Plus, Search, Edit3, Trash2, ArrowLeft, X, DollarSign, Tag, Clock, Sparkles } from 'lucide-react';

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
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hematology',
    price: 4500,
    turnaroundTime: '2-4 Hours',
    description: ''
  });

  const turnaroundSuggestions = ['1 Hour', '2-4 Hours', '6 Hours', '24 Hours', '48 Hours', '3 Days', '5 Days'];

  useEffect(() => {
    fetchCatalog();
  }, [lab?.id]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const ref = collection(db, 'labs', lab?.id || 'lab-1', 'testCatalog');
      const snap = await getDocs(ref);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCatalog(list);
    } catch (e) {
      console.error('Test catalog fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingTest(null);
    setFormData({ name: '', category: 'Hematology', price: 5000, turnaroundTime: '2-4 Hours', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (test: any) => {
    setEditingTest(test);
    setFormData({
      name: test.name || test.testName || '',
      category: test.category || 'Hematology',
      price: test.price || 4500,
      turnaroundTime: test.turnaroundTime || test.expectedTime || '24 Hours',
      description: test.description || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingTest) {
        await updateDoc(doc(db, 'labs', lab?.id || 'lab-1', 'testCatalog', editingTest.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'labs', lab?.id || 'lab-1', 'testCatalog'), {
          ...formData,
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
    if (confirm('Are you sure you want to remove this test from the catalog?')) {
      try {
        await deleteDoc(doc(db, 'labs', lab?.id || 'lab-1', 'testCatalog', id));
        fetchCatalog();
      } catch (err) {
        console.error('Error deleting catalog item:', err);
      }
    }
  };

  const filteredCatalog = catalog.filter(t =>
    (t.name || t.testName || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.category || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description || '')?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Medical Test Directory</h2>
          <p className="text-xs text-slate-500">Configure offered laboratory procedures, turnaround schedules & standard pricing</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Test
        </button>
      </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search catalog by test name or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatalog.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                      <TestTube className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{item.name || item.testName}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 cursor-pointer"
                      title="Edit Test"
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

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {item.description || 'Standard laboratory diagnostic procedure.'}
                </p>

                {/* Turnaround Time Badge */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/70">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-[11px] font-medium">Turnaround:</span>
                  <span className="font-bold text-teal-800 text-[11px]">{item.turnaroundTime || item.expectedTime || '24 Hours'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Standard Price</span>
                <span className="text-sm font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-200">
                  {item.price ? `${item.price.toLocaleString()} FCFA` : '4,500 FCFA'}
                </span>
              </div>
            </div>
          ))}

          {filteredCatalog.length === 0 && !loading && (
            <div className="col-span-full p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <TestTube className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No tests matching your search query</p>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
              >
                Create New Test
              </button>
            </div>
          )}
        </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-teal-700 text-white">
              <h3 className="font-bold text-base">
                {editingTest ? 'Edit Test Details' : 'Add Catalog Test'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC)"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Urinalysis">Urinalysis</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Nephrology">Nephrology</option>
                    <option value="Parasitology">Parasitology</option>
                    <option value="Serology">Serology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (FCFA)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Expected Turnaround Time */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Expected Turnaround Time <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Estimated duration for results</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2-4 Hours or 1 Day"
                  value={formData.turnaroundTime}
                  onChange={e => setFormData({ ...formData, turnaroundTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
                />

                {/* Quick Selection Suggestions */}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Description & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Details on what this test analyzes..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold shadow-md hover:bg-teal-700 cursor-pointer"
                >
                  Save Test
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

