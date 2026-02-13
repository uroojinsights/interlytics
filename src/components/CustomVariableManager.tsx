import React, { useState } from 'react';
import { Layers, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { CustomVariable } from '../types';

interface CustomVariableManagerProps {
  headers: string[];
  customVariables: Record<string, CustomVariable>;
  onCustomVariablesChange: (variables: Record<string, CustomVariable>) => void;
}

export function CustomVariableManager({ 
  headers, 
  customVariables, 
  onCustomVariablesChange 
}: CustomVariableManagerProps) {
  const [showManager, setShowManager] = useState(false);
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [newVariable, setNewVariable] = useState<Partial<CustomVariable>>({
    name: '',
    sourceColumns: [],
    mappings: {},
    type: 'grouped_single'
  });

  const addCustomVariable = () => {
    if (!newVariable.name) return;
    
    const variableId = `custom_${Date.now()}`;
    onCustomVariablesChange({
      ...customVariables,
      [variableId]: newVariable as CustomVariable
    });
    
    setNewVariable({
      name: '',
      sourceColumns: [],
      mappings: {},
      type: 'grouped_single'
    });
  };

  const removeCustomVariable = (variableId: string) => {
    const newVariables = { ...customVariables };
    delete newVariables[variableId];
    onCustomVariablesChange(newVariables);
  };

  const updateMapping = (variableId: string, newLabel: string, originalValues: string[]) => {
    const variable = customVariables[variableId];
    const newMappings = { ...variable.mappings };
    newMappings[newLabel] = originalValues;
    
    onCustomVariablesChange({
      ...customVariables,
      [variableId]: { ...variable, mappings: newMappings }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="text-indigo-600" size={20} />
          Custom Variables
        </h3>
        <button
          onClick={() => setShowManager(!showManager)}
          className="flex items-center gap-2 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-lg transition-colors"
        >
          <Edit size={16} />
          {showManager ? 'Hide' : 'Manage'} Variables
        </button>
      </div>

      {showManager && (
        <>
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-indigo-700 text-sm">
              Create custom variables by grouping existing response options. 
              For example, group age ranges or combine similar responses into broader categories.
            </p>
          </div>

          {/* New Variable Form */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-3">Create New Custom Variable</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variable Name
                </label>
                <input
                  type="text"
                  value={newVariable.name || ''}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Age Groups, Product Categories"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newVariable.type || 'grouped_single'}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="grouped_single">Grouped Single Choice</option>
                  <option value="grouped_multi">Grouped Multiple Choice</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Columns
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {headers.map(header => (
                  <label key={header} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newVariable.sourceColumns?.includes(header) || false}
                      onChange={(e) => {
                        const sourceColumns = newVariable.sourceColumns || [];
                        if (e.target.checked) {
                          setNewVariable(prev => ({ 
                            ...prev, 
                            sourceColumns: [...sourceColumns, header] 
                          }));
                        } else {
                          setNewVariable(prev => ({ 
                            ...prev, 
                            sourceColumns: sourceColumns.filter(col => col !== header) 
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700 truncate">{header}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={addCustomVariable}
              disabled={!newVariable.name || !newVariable.sourceColumns?.length}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Create Variable
            </button>
          </div>

          {/* Existing Variables */}
          <div className="space-y-4">
            {Object.entries(customVariables).map(([variableId, variable]) => (
              <div key={variableId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">{variable.name}</h4>
                  <button
                    onClick={() => removeCustomVariable(variableId)}
                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <p><strong>Type:</strong> {variable.type.replace('_', ' ')}</p>
                  <p><strong>Source Columns:</strong> {variable.sourceColumns.join(', ')}</p>
                </div>

                <div className="text-sm">
                  <p className="font-medium text-gray-700 mb-1">Mappings:</p>
                  {Object.entries(variable.mappings).map(([newLabel, originalValues]) => (
                    <div key={newLabel} className="ml-4 text-gray-600">
                      <strong>{newLabel}:</strong> {originalValues.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {Object.keys(customVariables).length > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-700 text-sm font-medium">
            {Object.keys(customVariables).length} custom variable(s) created
          </p>
        </div>
      )}
    </div>
  );
}