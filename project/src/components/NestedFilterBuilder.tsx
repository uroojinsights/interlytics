import React, { useState } from 'react';
import { Plus, Trash2, Filter, ChevronDown, ChevronRight, Parentheses } from 'lucide-react';
import { NestedFilterGroup, FilterCondition } from '../types';

interface NestedFilterBuilderProps {
  headers: string[];
  filterGroup: NestedFilterGroup;
  onFilterGroupChange: (group: NestedFilterGroup) => void;
  onRemove?: () => void;
  level?: number;
}

export function NestedFilterBuilder({
  headers,
  filterGroup,
  onFilterGroupChange,
  onRemove,
  level = 0
}: NestedFilterBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: `condition_${Date.now()}`,
      column: headers[0] || '',
      operator: 'equals',
      value: ''
    };

    onFilterGroupChange({
      ...filterGroup,
      conditions: [...filterGroup.conditions, newCondition]
    });
  };

  const addGroup = () => {
    const newGroup: NestedFilterGroup = {
      id: `group_${Date.now()}`,
      operator: 'AND',
      conditions: []
    };

    onFilterGroupChange({
      ...filterGroup,
      conditions: [...filterGroup.conditions, newGroup]
    });
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition | NestedFilterGroup>) => {
    const newConditions = [...filterGroup.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    
    onFilterGroupChange({
      ...filterGroup,
      conditions: newConditions
    });
  };

  const removeCondition = (index: number) => {
    const newConditions = filterGroup.conditions.filter((_, i) => i !== index);
    onFilterGroupChange({
      ...filterGroup,
      conditions: newConditions
    });
  };

  const operatorLabels = {
    'equals': 'Equals',
    'not_equals': 'Not Equals',
    'contains': 'Contains',
    'not_contains': 'Does Not Contain',
    'greater_than': 'Greater Than',
    'less_than': 'Less Than',
    'in_range': 'In Range',
    'is_empty': 'Is Empty',
    'is_not_empty': 'Is Not Empty',
    'starts_with': 'Starts With',
    'ends_with': 'Ends With'
  };

  const isCondition = (item: FilterCondition | NestedFilterGroup): item is FilterCondition => {
    return 'column' in item;
  };

  const getIndentClass = (level: number) => {
    return `ml-${Math.min(level * 4, 16)}`;
  };

  return (
    <div className={`border border-gray-300 rounded-lg p-4 bg-white ${getIndentClass(level)}`}>
      {/* Group Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          <div className="flex items-center gap-2">
            <Parentheses size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {level === 0 ? 'Main Filter Group' : `Nested Group (Level ${level + 1})`}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={filterGroup.not || false}
                onChange={(e) => onFilterGroupChange({
                  ...filterGroup,
                  not: e.target.checked
                })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-red-600 font-medium">NOT</span>
            </label>
            
            <select
              value={filterGroup.operator}
              onChange={(e) => onFilterGroupChange({
                ...filterGroup,
                operator: e.target.value as 'AND' | 'OR'
              })}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={addCondition}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm transition-colors"
          >
            <Plus size={14} />
            Condition
          </button>
          
          <button
            onClick={addGroup}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm transition-colors"
          >
            <Plus size={14} />
            Group
          </button>
          
          {onRemove && level > 0 && (
            <button
              onClick={onRemove}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Group Content */}
      {isExpanded && (
        <div className="space-y-3">
          {filterGroup.conditions.map((condition, index) => (
            <div key={isCondition(condition) ? condition.id : condition.id} className="relative">
              {index > 0 && (
                <div className="absolute -top-2 left-4 bg-white px-2 text-xs font-medium text-gray-500">
                  {filterGroup.operator}
                </div>
              )}
              
              {isCondition(condition) ? (
                // Render Filter Condition
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Column
                      </label>
                      <select
                        value={condition.column}
                        onChange={(e) => updateCondition(index, { column: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
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
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
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
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter value..."
                        disabled={condition.operator === 'is_empty' || condition.operator === 'is_not_empty'}
                      />
                    </div>

                    <div>
                      {condition.operator === 'in_range' && (
                        <>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            To Value
                          </label>
                          <input
                            type="text"
                            value={condition.secondValue || ''}
                            onChange={(e) => updateCondition(index, { secondValue: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="To value..."
                          />
                        </>
                      )}
                    </div>

                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={condition.not || false}
                          onChange={(e) => updateCondition(index, { not: e.target.checked })}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-red-600">NOT</span>
                      </label>
                      
                      <button
                        onClick={() => removeCondition(index)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Render Nested Group
                <NestedFilterBuilder
                  headers={headers}
                  filterGroup={condition}
                  onFilterGroupChange={(updatedGroup) => updateCondition(index, updatedGroup)}
                  onRemove={() => removeCondition(index)}
                  level={level + 1}
                />
              )}
            </div>
          ))}
          
          {filterGroup.conditions.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No conditions defined. Add a condition or group to start building your filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}