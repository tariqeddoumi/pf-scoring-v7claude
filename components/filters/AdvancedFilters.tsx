'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDefinition {
  key: string;
  label: string;
  type: 'select' | 'multi-select' | 'date-range' | 'number-range' | 'text';
  options?: FilterOption[];
  placeholder?: string;
}

interface AdvancedFiltersProps {
  filters: FilterDefinition[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  activeCount?: number;
}

export default function AdvancedFilters({
  filters,
  values,
  onChange,
  onClear,
  activeCount = 0,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors text-sm"
      >
        <Filter size={16} />
        <span>Filtres</span>
        {activeCount > 0 && (
          <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            {activeCount}
          </span>
        )}
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Filtres avancés</h3>
            {activeCount > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <X size={12} />
                Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {filter.label}
                </label>

                {filter.type === 'select' && (
                  <select
                    value={values[filter.key] || ''}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Tous</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === 'text' && (
                  <input
                    type="text"
                    value={values[filter.key] || ''}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder || 'Filtrer...'}
                    className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                )}

                {filter.type === 'number-range' && (
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={values[`${filter.key}_min`] || ''}
                      onChange={(e) => onChange(`${filter.key}_min`, e.target.value)}
                      placeholder="Min"
                      className="w-1/2 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      value={values[`${filter.key}_max`] || ''}
                      onChange={(e) => onChange(`${filter.key}_max`, e.target.value)}
                      placeholder="Max"
                      className="w-1/2 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {filter.type === 'date-range' && (
                  <div className="flex gap-1">
                    <input
                      type="date"
                      value={values[`${filter.key}_from`] || ''}
                      onChange={(e) => onChange(`${filter.key}_from`, e.target.value)}
                      className="w-1/2 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="date"
                      value={values[`${filter.key}_to`] || ''}
                      onChange={(e) => onChange(`${filter.key}_to`, e.target.value)}
                      className="w-1/2 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
