import React, { useState } from 'react';
import { Filter, Plus, Trash2, Settings } from 'lucide-react';
import { FilterConfig } from '../types';

interface FilterManagerProps {
  headers: string[];
  filters: Record<string, FilterConfig>;
  onFiltersChange: (filters: Record<string, FilterConfig>) => void;
}

export function FilterManager({ headers, filters, onFiltersChange }: FilterManagerProps) {
  const [showFilters, setShowFilters] = useState(false);

  const addFilter = () => {
    const filterId = `filter_${Date.now()}`;
    onFiltersChange({
      ...filters,
      [filterId]: {
        column: headers[0] || '',
        operator: 'equals',
        value: ''
      }
    });
  };

  const updateFilter = (filterId: string, updates: Partial<FilterConfig>) => {
    onFiltersChange({
      ...filters,
      [filterId]: { ...filters[filterId], ...updates }
    });
  };

  const removeFilter = (filterId: string) => {
    const newFilters = { ...filters };
    delete newFilters[filterId];
    onFiltersChange(newFilters);
  };

  const operatorLabels = {
    'equals': 'Equals',
    'not_equals': 'Not Equals',
    'contains': 'Contains',
    'not_contains': 'Does Not Contain',
    'greater_than': 'Greater Than',
    'less_than': 'Less Than',
    'in_range': 'In Range'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Filter className="text-purple-600" size={20} />
          Data Filters
        </h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg transition-colors"
        >
          <Settings size={16} />
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {showFilters && (
        <>
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-purple-700 text-sm">
              Apply filters to include only specific data in your analysis. 
              Filters will be applied to all tables before cross-tabulation.
            </p>
          </div>

          <div className="space-y-4">
            {Object.entries(filters).map(([filterId, filter]) => (
              <div key={filterId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Column
                    </label>
                    <select
                      value={filter.column}
                      onChange={(e) => updateFilter(filterId, { column: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                    >
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Operator
                    </label>
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filterId, { operator: e.target.value as any })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                    >
                      {Object.entries(operatorLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(filterId, { value: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                      placeholder="Enter value..."
                    />
                  </div>

                  <div className="flex items-end">
                    {filter.operator === 'in_range' && (
                      <input
                        type="text"
                        value={filter.secondValue || ''}
                        onChange={(e) => updateFilter(filterId, { secondValue: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 mr-2"
                        placeholder="To value..."
                      />
                    )}
                    <button
                      onClick={() => removeFilter(filterId)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addFilter}
              className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Filter
            </button>
          </div>
        </>
      )}

      {Object.keys(filters).length > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-700 text-sm font-medium">
            {Object.keys(filters).length} filter(s) active
          </p>
        </div>
      )}
    </div>
  );
}