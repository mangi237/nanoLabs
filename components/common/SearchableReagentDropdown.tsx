// components/common/SearchableReagentDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, FlaskConical, AlertTriangle } from 'lucide-react';

interface ReagentItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  storageCondition?: string;
}

interface SearchableReagentDropdownProps {
  reagents: ReagentItem[];
  onSelect: (reagent: ReagentItem) => void;
  selectedReagentId?: string;
  placeholder?: string;
  label?: string;
}

export const SearchableReagentDropdown: React.FC<SearchableReagentDropdownProps> = ({
  reagents,
  onSelect,
  selectedReagentId,
  placeholder = 'Search & select reagent...',
  label = 'Select Reagent Used'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedReagent = reagents.find(r => r.id === selectedReagentId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredReagents = reagents.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-slate-500 mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2.5 bg-slate-50 hover:bg-slate-100/80 border rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
          isOpen ? 'border-teal-600 ring-2 ring-teal-500/20 bg-white' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <FlaskConical className="w-4 h-4 text-teal-600 shrink-0" />
          {selectedReagent ? (
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 text-xs truncate">{selectedReagent.name}</div>
              <div className="text-[10px] text-slate-500">
                Stock: {selectedReagent.quantity} {selectedReagent.unit || 'units'} available
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-64">
          <div className="p-2.5 bg-slate-50/90 border-b border-slate-200/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to filter reagents..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-1">
            {filteredReagents.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No reagents found matching your search.
              </div>
            ) : (
              filteredReagents.map((reagent) => {
                const isLow = (reagent.quantity || 0) <= 5;
                const isSelected = reagent.id === selectedReagentId;

                return (
                  <button
                    key={reagent.id}
                    type="button"
                    onClick={() => {
                      onSelect(reagent);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected ? 'bg-teal-50 hover:bg-teal-100/70 text-teal-950 font-bold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-teal-950' : 'text-slate-900'}`}>
                          {reagent.name}
                        </span>
                        {isLow && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-2.5 h-2.5" /> Low
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Stock: {reagent.quantity} {reagent.unit || 'units'} • {reagent.category || 'Reagent'}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableReagentDropdown;