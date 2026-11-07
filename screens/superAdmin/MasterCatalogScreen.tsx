import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit3, 
  Check, 
  Tag, 
  ShieldCheck,
  Building2
} from 'lucide-react';
import { MASTER_TEST_DICTIONARY } from '../../core/scanner';
import { formatXAF } from '../../shared/money';

export const MasterCatalogScreen: React.FC = () => {
  const [catalog, setCatalog] = useState(MASTER_TEST_DICTIONARY);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  const handleEditPrice = (test: any) => {
    setEditingCode(test.code);
    setEditPrice(test.basePrice);
  };

  const handleSavePrice = (code: string) => {
    setCatalog(
      catalog.map((item) =>
        item.code === code ? { ...item, basePrice: editPrice } : item
      )
    );
    setEditingCode(null);
  };

  const filtered = catalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      (item.frenchName || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F1D] tracking-tight">
            Master Diagnostic Tests & Tariffs Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7F7D]">
            Standardized laboratory test codes, French nomenclature, specimen tube requirements, and reference prices in XAF.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200 text-xs font-bold">
          {catalog.length} Accredited Test Investigations
        </span>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search test by code, French designation, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['all', 'hematology', 'biochemistry', 'immunology', 'microbiology', 'coagulation'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-bold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0D3B38] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Investigation & French Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Specimen Type</th>
                <th className="py-3 px-4">Reference Range</th>
                <th className="py-3 px-4 text-right">Base Tariff (XAF)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isEditing = editingCode === item.code;
                return (
                  <tr key={item.code} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-[#0D3B38]">
                      {item.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.frenchName || item.name}</div>
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-slate-600">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {item.specimenType || 'Whole Blood / Sérum'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {item.referenceRange || 'Valeurs usuelles'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-24 px-2 py-1 bg-white border border-teal-500 rounded-lg text-right font-mono text-xs font-bold"
                        />
                      ) : (
                        formatXAF(item.basePrice)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => handleSavePrice(item.code)}
                          className="p-1.5 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D3B38] transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditPrice(item)}
                          className="p-1.5 text-slate-400 hover:text-[#0F766E] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MasterCatalogScreen;
