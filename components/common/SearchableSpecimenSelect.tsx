import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  Check, 
  X, 
  FlaskConical, 
  Package, 
  AlertTriangle, 
  Droplet,
  Layers,
  Sparkles
} from 'lucide-react';

export interface InventorySpecimenItem {
  id: string;
  name: string;
  category?: string;
  unit?: string;
  quantity?: number;
  reorderLevel?: number;
  batchNumber?: string;
  storageCondition?: string;
  supplier?: string;
  description?: string;
  [key: string]: any;
}

interface SearchableSpecimenSelectProps {
  items: InventorySpecimenItem[];
  value: string;
  onChange: (itemId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export const SearchableSpecimenSelect: React.FC<SearchableSpecimenSelectProps> = ({
  items,
  value,
  onChange,
  placeholder = 'Search & select specimen / reagent / tube...',
  disabled = false,
  label,
  id = 'specimen-combobox'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Selected item object
  const selectedItem = useMemo(() => {
    return items.find(item => item.id === value);
  }, [items, value]);

  // Extract unique categories for quick filter chips
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return ['All', ...Array.from(set)];
  }, [items]);

  // Filter items efficiently
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter(item => {
      // Category filter
      if (selectedCategoryFilter !== 'All') {
        if (selectedCategoryFilter === 'Low Stock') {
          const isLow = (item.quantity ?? 0) <= (item.reorderLevel ?? 5);
          if (!isLow) return false;
        } else if (item.category !== selectedCategoryFilter) {
          return false;
        }
      }

      // Search query
      if (!q) return true;

      const nameMatch = item.name?.toLowerCase().includes(q);
      const categoryMatch = item.category?.toLowerCase().includes(q);
      const batchMatch = item.batchNumber?.toLowerCase().includes(q);
      const supplierMatch = item.supplier?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const idMatch = item.id?.toLowerCase().includes(q);

      return nameMatch || categoryMatch || batchMatch || supplierMatch || descMatch || idMatch;
    });
  }, [items, searchQuery, selectedCategoryFilter]);

  const handleSelect = (item: InventorySpecimenItem) => {
    onChange(item.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case 'Consumables & Tubes':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Reagents':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Chemicals & Solutions':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Testing Kits':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      {label && (
        <label className="block text-[10px] font-bold text-slate-500 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button / Selected Item Display */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2.5 bg-slate-50 hover:bg-slate-100/80 border rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
          isOpen
            ? 'border-purple-600 ring-2 ring-purple-500/20 bg-white shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-purple-100/70 text-purple-700 shrink-0">
            <FlaskConical className="w-4 h-4" />
          </div>

          {selectedItem ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-xs truncate">
                  {selectedItem.name}
                </span>
                {selectedItem.category && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(selectedItem.category)}`}>
                    {selectedItem.category}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-0.5">
                <span className="font-semibold text-purple-900">
                  Stock: {selectedItem.quantity ?? 0} {selectedItem.unit || 'units'} available
                </span>
                {selectedItem.batchNumber && (
                  <span className="font-mono text-slate-400">({selectedItem.batchNumber})</span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
        </div>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-80">
          {/* Search Box Header */}
          <div className="p-2.5 bg-slate-50/90 border-b border-slate-200/80 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to filter 1000+ specimens, tubes, reagents..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Category Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] scrollbar-thin">
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'Low Stock' ? 'All' : 'Low Stock')}
                className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategoryFilter === 'Low Stock'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                ⚠️ Low Stock
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-1">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center px-4 space-y-1">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-700">No matching specimens or chemicals</p>
                <p className="text-[11px] text-slate-400">
                  Try adjusting your search query or clear category filters.
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategoryFilter('All'); }}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === value;
                const isLow = (item.quantity ?? 0) <= (item.reorderLevel ?? 5);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 hover:bg-purple-100/70 text-purple-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold ${isSelected ? 'text-purple-950' : 'text-slate-900'}`}>
                          {item.name}
                        </span>
                        {item.category && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(item.category)}`}>
                            {item.category}
                          </span>
                        )}
                        {isLow && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-2.5 h-2.5" /> Low
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center gap-3">
                        <span>
                          Available: <strong className="text-slate-700">{item.quantity ?? 0} {item.unit || 'units'}</strong>
                        </span>
                        {item.batchNumber && (
                          <span className="font-mono text-slate-400">LOT: {item.batchNumber}</span>
                        )}
                        {item.storageCondition && (
                          <span className="text-slate-400 truncate max-w-[140px]">• {item.storageCondition}</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count indicator */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between px-3">
            <span>
              Showing <strong>{filteredItems.length}</strong> of {items.length} materials
            </span>
            <span className="text-purple-700 font-semibold">
              Live Stock Deduction
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSpecimenSelect;
