import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, X, Code, Layers, Settings } from 'lucide-react';
import { CustomVariable, RecodeRule, SwitchCase, FilterCondition } from '../types';

interface AdvancedCustomVariablesProps {
  headers: string[];
  customVariables: Record<string, CustomVariable>;
  onCustomVariablesChange: (variables: Record<string, CustomVariable>) => void;
}

export function AdvancedCustomVariables({
  headers,
  customVariables,
  onCustomVariablesChange
}: AdvancedCustomVariablesProps) {
  const [showManager, setShowManager] = useState(false);
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [newVariable, setNewVariable] = useState<Partial<CustomVariable>>({
    name: '',
    type: 'grouped_single',
    sourceColumns: [],
    description: ''
  });

  const variableTypes = {
    'grouped_single': 'Grouped Single Choice',
    'grouped_multi': 'Grouped Multiple Choice',
    'recode': 'Recode Variable',
    'switch_case': 'Switch/Case Logic',
    'formula': 'Formula Variable'
  };

  const addCustomVariable = () => {
    if (!newVariable.name) return;
    
    const variableId = `custom_${Date.now()}`;
    const variable: CustomVariable = {
      id: variableId,
      name: newVariable.name,
      type: newVariable.type || 'grouped_single',
      sourceColumns: newVariable.sourceColumns || [],
      description: newVariable.description || '',
      mappings: newVariable.type === 'grouped_single' || newVariable.type === 'grouped_multi' ? {} : undefined,
      recodeRules: newVariable.type === 'recode' ? [] : undefined,
      switchCases: newVariable.type === 'switch_case' ? [] : undefined,
      formula: newVariable.type === 'formula' ? { expression: '', variables: {} } : undefined
    };
    
    onCustomVariablesChange({
      ...customVariables,
      [variableId]: variable
    });
    
    setNewVariable({
      name: '',
      type: 'grouped_single',
      sourceColumns: [],
      description: ''
    });
  };

  const removeCustomVariable = (variableId: string) => {
    const newVariables = { ...customVariables };
    delete newVariables[variableId];
    onCustomVariablesChange(newVariables);
  };

  const updateVariable = (variableId: string, updates: Partial<CustomVariable>) => {
    onCustomVariablesChange({
      ...customVariables,
      [variableId]: { ...customVariables[variableId], ...updates }
    });
  };

  const addRecodeRule = (variableId: string) => {
    const variable = customVariables[variableId];
    const newRule: RecodeRule = {
      id: `rule_${Date.now()}`,
      condition: {
        id: `condition_${Date.now()}`,
        column: headers[0] || '',
        operator: 'equals',
        value: ''
      },
      newValue: '',
      order: (variable.recodeRules?.length || 0) + 1
    };

    updateVariable(variableId, {
      recodeRules: [...(variable.recodeRules || []), newRule]
    });
  };

  const addSwitchCase = (variableId: string) => {
    const variable = customVariables[variableId];
    const newCase: SwitchCase = {
      id: `case_${Date.now()}`,
      condition: {
        id: `condition_${Date.now()}`,
        column: headers[0] || '',
        operator: 'equals',
        value: ''
      },
      value: '',
      order: (variable.switchCases?.length || 0) + 1
    };

    updateVariable(variableId, {
      switchCases: [...(variable.switchCases || []), newCase]
    });
  };

  const updateRecodeRule = (variableId: string, ruleId: string, updates: Partial<RecodeRule>) => {
    const variable = customVariables[variableId];
    const updatedRules = variable.recodeRules?.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ) || [];

    updateVariable(variableId, { recodeRules: updatedRules });
  };

  const updateSwitchCase = (variableId: string, caseId: string, updates: Partial<SwitchCase>) => {
    const variable = customVariables[variableId];
    const updatedCases = variable.switchCases?.map(switchCase =>
      switchCase.id === caseId ? { ...switchCase, ...updates } : switchCase
    ) || [];

    updateVariable(variableId, { switchCases: updatedCases });
  };

  const removeRecodeRule = (variableId: string, ruleId: string) => {
    const variable = customVariables[variableId];
    const updatedRules = variable.recodeRules?.filter(rule => rule.id !== ruleId) || [];
    updateVariable(variableId, { recodeRules: updatedRules });
  };

  const removeSwitchCase = (variableId: string, caseId: string) => {
    const variable = customVariables[variableId];
    const updatedCases = variable.switchCases?.filter(switchCase => switchCase.id !== caseId) || [];
    updateVariable(variableId, { switchCases: updatedCases });
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="text-indigo-600" size={20} />
          Advanced Custom Variables
        </h3>
        <button
          onClick={() => setShowManager(!showManager)}
          className="flex items-center gap-2 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-lg transition-colors"
        >
          <Settings size={16} />
          {showManager ? 'Hide' : 'Manage'} Variables
        </button>
      </div>

      {showManager && (
        <>
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h4 className="font-semibold text-indigo-800 mb-2">Advanced Variable Types:</h4>
            <ul className="text-indigo-700 text-sm space-y-1">
              <li><strong>Grouped:</strong> Combine multiple response options into categories</li>
              <li><strong>Recode:</strong> Transform values based on conditional rules</li>
              <li><strong>Switch/Case:</strong> Apply different values based on multiple conditions</li>
              <li><strong>Formula:</strong> Calculate new values using mathematical expressions</li>
            </ul>
          </div>

          {/* New Variable Form */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-3">Create New Custom Variable</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variable Name
                </label>
                <input
                  type="text"
                  value={newVariable.name || ''}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Age Groups, Satisfaction Level"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variable Type
                </label>
                <select
                  value={newVariable.type || 'grouped_single'}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(variableTypes).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newVariable.description || ''}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description of the variable"
                />
              </div>
            </div>

            {(newVariable.type === 'grouped_single' || newVariable.type === 'grouped_multi') && (
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
            )}

            <button
              onClick={addCustomVariable}
              disabled={!newVariable.name}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Create Variable
            </button>
          </div>

          {/* Existing Variables */}
          <div className="space-y-6">
            {Object.entries(customVariables).map(([variableId, variable]) => (
              <div key={variableId} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-800">{variable.name}</h4>
                    <p className="text-sm text-gray-600">{variableTypes[variable.type]}</p>
                    {variable.description && (
                      <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeCustomVariable(variableId)}
                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Recode Rules */}
                {variable.type === 'recode' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-700">Recode Rules</h5>
                      <button
                        onClick={() => addRecodeRule(variableId)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        <Plus size={12} />
                        Add Rule
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {variable.recodeRules?.map((rule, index) => (
                        <div key={rule.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select
                              value={rule.condition.column}
                              onChange={(e) => updateRecodeRule(variableId, rule.id, {
                                condition: { ...rule.condition, column: e.target.value }
                              })}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              {headers.map(header => (
                                <option key={header} value={header}>{header}</option>
                              ))}
                            </select>
                            
                            <select
                              value={rule.condition.operator}
                              onChange={(e) => updateRecodeRule(variableId, rule.id, {
                                condition: { ...rule.condition, operator: e.target.value as any }
                              })}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              {Object.entries(operatorLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                            
                            <input
                              type="text"
                              value={rule.condition.value}
                              onChange={(e) => updateRecodeRule(variableId, rule.id, {
                                condition: { ...rule.condition, value: e.target.value }
                              })}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Condition value"
                            />
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={rule.newValue}
                                onChange={(e) => updateRecodeRule(variableId, rule.id, { newValue: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="New value"
                              />
                              <button
                                onClick={() => removeRecodeRule(variableId, rule.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Switch Cases */}
                {variable.type === 'switch_case' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-700">Switch Cases</h5>
                      <button
                        onClick={() => addSwitchCase(variableId)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        <Plus size={12} />
                        Add Case
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {variable.switchCases?.map((switchCase, index) => (
                        <div key={switchCase.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select
                              value={switchCase.condition.column}
                              onChange={(e) => updateSwitchCase(variableId, switchCase.id, {
                                condition: { ...switchCase.condition, column: e.target.value }
                              })}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              {headers.map(header => (
                                <option key={header} value={header}>{header}</option>
                              ))}
                            </select>
                            
                            <select
                              value={switchCase.condition.operator}
                              onChange={(e) => updateSwitchCase(variableId, switchCase.id, {
                                condition: { ...switchCase.condition, operator: e.target.value as any }
                              })}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              {Object.entries(operatorLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                            
                            <input
                              type="text"
                              value={switchCase.condition.value}
                              onChange={(e) => updateSwitchCase(variableId, switchCase.id, {
                                condition: { ...switchCase.condition, value: e.target.value }
                              })}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Condition value"
                            />
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={switchCase.value}
                                onChange={(e) => updateSwitchCase(variableId, switchCase.id, { value: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="Result value"
                              />
                              <button
                                onClick={() => removeSwitchCase(variableId, switchCase.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formula */}
                {variable.type === 'formula' && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Formula Expression</h5>
                    <div className="space-y-2">
                      <textarea
                        value={variable.formula?.expression || ''}
                        onChange={(e) => updateVariable(variableId, {
                          formula: { ...variable.formula!, expression: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        rows={3}
                        placeholder="e.g., IF(age > 65, 'Senior', IF(age > 18, 'Adult', 'Minor'))"
                      />
                      <p className="text-xs text-gray-500">
                        Use column names in your formula. Supported functions: IF, AND, OR, SUM, AVG, etc.
                      </p>
                    </div>
                  </div>
                )}
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