import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  FlaskConical, 
  ChevronRight, 
  Check, 
  Plus, 
  Clock, 
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Droplet,
  Info,
  Sparkles,
  Calendar
} from 'lucide-react';
import { MASTER_TESTS_CATALOG, MasterTestItem } from '../../data/final_catalog';

export type TestCatalogItem = MasterTestItem;
export { MASTER_TESTS_CATALOG };
export const POPULAR_CATALOG_TESTS = MASTER_TESTS_CATALOG.slice(0, 10);

interface SearchTestsScreenProps {
  onBack: () => void;
  onSelectTest: (test: MasterTestItem) => void;
  onSelectMultipleTests?: (tests: MasterTestItem[]) => void;
  onSelectPackage?: () => void;
  onOpenAIHelp?: () => void;
}

export const SearchTestsScreen: React.FC<SearchTestsScreenProps> = ({
  onBack,
  onSelectTest,
  onSelectMultipleTests,
  onSelectPackage,
  onOpenAIHelp
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTests, setSelectedTests] = useState<MasterTestItem[]>([]);

  const categories = [
    'All',
    'Hematology',
    'Biochemistry',
    'Microbiology',
    'Serology / Immunology',
    'Hormones & Tumor Markers',
    'Urinalysis & Parasitology',
    'Cytopathology & Fluids'
  ];

  const popularSearches = ['CBC (NFS)', 'Malaria (Goutte Epaisse)', 'HIV 1 & 2', 'Blood Sugar (Glycémie)', 'Lipid Profile', 'ECBU Urines', 'Widal Typhoïde'];

  const filteredTests = MASTER_TESTS_CATALOG.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      (item.conditions && item.conditions.toLowerCase().includes(search.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSelectTest = (test: MasterTestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedTests.some(t => t.id === test.id)) {
      setSelectedTests(selectedTests.filter(t => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleProceedWithSelected = () => {
    if (selectedTests.length > 0 && onSelectMultipleTests) {
      onSelectMultipleTests(selectedTests);
    } else if (selectedTests.length === 1) {
      onSelectTest(selectedTests[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-3 px-3 sm:px-6 text-slate-900 animate-in fade-in duration-300 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Master Diagnostic Directory (80+ Tests)
            </h1>
            <p className="text-[11px] text-slate-500">
              Accredited CEMAC clinical investigation catalog &bull; Pricing determined by performing laboratory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAIHelp && (
            <button
              onClick={onOpenAIHelp}
              className="px-3 py-1.5 bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#006978] rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI Guide</span>
            </button>
          )}

          {selectedTests.length > 0 && (
            <button
              onClick={handleProceedWithSelected}
              className="px-4 py-1.5 bg-[#006978] hover:bg-[#005a66] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Proceed ({selectedTests.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
        <input
          type="text"
          placeholder="Search across 80+ tests, biomarkers, preparation rules (e.g. fasting), or codes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006978] focus:ring-2 focus:ring-[#006978]/15 shadow-xs"
        />
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#006978] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Popular Diagnostic Searches */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Frequently Prescribed Investigations:
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {popularSearches.map(tag => (
            <button
              key={tag}
              onClick={() => setSearch(tag.split(' ')[0])}
              className="px-3 py-1 bg-[#E0F2F1]/80 hover:bg-[#B2DFDB] text-[#006978] border border-[#80CBC4] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Tariff Policy Notice */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-[#006978] shrink-0" />
          <span>
            Laboratories set certified tariffs. Select investigations to view exact costs and distance courier rates.
          </span>
        </div>
        {onSelectPackage && (
          <button
            onClick={onSelectPackage}
            className="text-xs font-bold text-[#006978] hover:underline shrink-0 ml-2"
          >
            Health Packages →
          </button>
        )}
      </div>

      {/* Filtered Master Tests List (80+ Tests) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available Investigations ({filteredTests.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Click any test to review pre-test fasting & preparation guidelines
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTests.map(test => {
            const isSelected = selectedTests.some(t => t.id === test.id);
            const prepInstructions = test.conditions || 'Standard clinical collection protocol. Hydrate well with plain water.';

            return (
              <div
                key={test.id}
                onClick={() => onSelectTest(test)}
                className={`p-4 bg-white border rounded-3xl shadow-xs flex flex-col justify-between gap-3 cursor-pointer transition-all group ${
                  isSelected ? 'border-[#006978] bg-[#E0F2F1]/15 ring-2 ring-[#006978]' : 'border-slate-200 hover:border-[#006978]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => toggleSelectTest(test, e)}
                        className={`w-6 h-6 rounded-lg border-2 mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                          isSelected ? 'border-[#006978] bg-[#006978] text-white' : 'border-slate-300 hover:border-slate-400'
                        }`}
                        title="Select for combined booking"
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {test.code}
                          </span>
                          <span className="text-[10px] font-bold text-[#006978] bg-[#E0F2F1] px-2 py-0.5 rounded-full">
                            {test.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006978] mt-1 leading-snug">
                          {test.name}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {test.description}
                  </p>

                  {/* Pre-Test Preparation Guidance Banner */}
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-[11px] text-amber-900">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-amber-950">Préparation & Consignes:</strong>
                      <span className="line-clamp-2">{prepInstructions}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{test.sampleType}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      ~{test.turnaroundTime}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[#006978] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Select & Prep <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
