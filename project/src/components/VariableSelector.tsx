import React from 'react';
import { Settings, CheckSquare, Square, ArrowLeft, Move, ArrowRight, HelpCircle } from 'lucide-react';
import { DragDropReorder } from './DragDropReorder';
import { CustomVariable } from '../types';

interface VariableSelectorProps {
  headers: string[];
  tableVariables: string[];
  bannerVariables: string[];
  multiSelectGroups: Record<string, string[]>;
  customVariables: Record<string, CustomVariable>;
  onTableVariablesChange: (variables: string[]) => void;
  onBannerVariablesChange: (variables: string[]) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function VariableSelector({
  headers,
  tableVariables,
  bannerVariables,
  multiSelectGroups,
  customVariables,
  onTableVariablesChange,
  onBannerVariablesChange,
  onBack,
  onContinue
}: VariableSelectorProps) {
  const [showReorderInterface, setShowReorderInterface] = React.useState(false);

  // Create ordered list of available table variables
  // Multi-select groups should be positioned at their original location
  const createOrderedTableVariables = () => {
    const orderedVars: Array<{ name: string; type: 'header' | 'multiselect'; originalIndex?: number }> = [];
    
    // First, add all headers with their original positions
    headers.forEach((header, index) => {
      // Check if this header is part of a multi-select group
      const multiSelectGroupName = Object.keys(multiSelectGroups).find(groupName =>
        multiSelectGroups[groupName].includes(header)
      );
      
      if (multiSelectGroupName) {
        // Only add the group once at the position of the first column in the group
        const groupColumns = multiSelectGroups[multiSelectGroupName];
        const firstColumnIndex = Math.min(...groupColumns.map(col => headers.indexOf(col)));
        
        if (index === firstColumnIndex) {
          orderedVars.push({
            name: multiSelectGroupName,
            type: 'multiselect',
            originalIndex: index
          });
        }
      } else {
        // Regular header
        orderedVars.push({
          name: header,
          type: 'header',
          originalIndex: index
        });
      }
    });
    
    // Add custom variables at the end
    Object.keys(customVariables).forEach(customVarName => {
      orderedVars.push({
        name: customVarName,
        type: 'custom'
      });
    });
    
    return orderedVars;
  };

  const orderedTableVariables = createOrderedTableVariables();
  
  // Only headers (not multi-select groups) for banners, excluding those in multi-select groups
  const availableBannerVariables = headers.filter(header => 
    !Object.values(multiSelectGroups).some(group => group.includes(header))
  );

  const handleTableVariableChange = (variable: string, checked: boolean) => {
    if (checked) {
      onTableVariablesChange([...tableVariables, variable]);
    } else {
      onTableVariablesChange(tableVariables.filter(v => v !== variable));
    }
  };

  const handleBannerVariableChange = (variable: string, checked: boolean) => {
    if (checked) {
      onBannerVariablesChange([...bannerVariables, variable]);
    } else {
      onBannerVariablesChange(bannerVariables.filter(v => v !== variable));
    }
  };

  const handleSelectAllTable = () => {
    const allAvailableTableVars = orderedTableVariables.map(v => v.name);
    if (tableVariables.length === allAvailableTableVars.length) {
      onTableVariablesChange([]);
    } else {
      onTableVariablesChange(allAvailableTableVars);
    }
  };

  const handleSelectAllBanner = () => {
    if (bannerVariables.length === availableBannerVariables.length) {
      onBannerVariablesChange([]);
    } else {
      onBannerVariablesChange([...availableBannerVariables]);
    }
  };

  const isAllTableSelected = tableVariables.length === orderedTableVariables.length;
  const isAllBannerSelected = bannerVariables.length === availableBannerVariables.length;

  const isMultiSelectGroup = (variable: string) => Object.keys(multiSelectGroups).includes(variable);
  const isCustomVariable = (variable: string) => Object.keys(customVariables).includes(variable);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Question Types
        </button>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Settings className="text-purple-600" size={28} />
          Let's Set Up Your Tables
        </h2>
      </div>

      {/* Explanation Section */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
          <HelpCircle size={20} />
          Understanding Side Breaks and Top Breaks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 rounded p-3">
            <h4 className="font-semibold text-blue-800 mb-1">Side Breaks (Rows)</h4>
            <p className="text-blue-700">
              The questions that appear as rows in your cross-tab tables. 
              These are what you want to analyze and compare.
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Example: Satisfaction levels, age groups, product preferences
            </p>
          </div>
          <div className="bg-green-50 rounded p-3">
            <h4 className="font-semibold text-green-800 mb-1">Top Breaks/Banner (Columns)</h4>
            <p className="text-green-700">
              The questions that appear as columns across the top. 
              These are used to break down and compare your side breaks.
            </p>
            <p className="text-green-600 text-xs mt-1">
              Example: Gender, region, customer type, age groups
            </p>
          </div>
        </div>
      </div>
      {Object.keys(multiSelectGroups).length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Multi-Select Groups Available:</h3>
          <div className="space-y-1">
            {Object.entries(multiSelectGroups).map(([groupName, columns]) => {
              const firstColumnIndex = Math.min(...columns.map(col => headers.indexOf(col)));
              return (
                <div key={groupName} className="text-sm text-green-700">
                  <strong>{groupName}</strong> ({columns.length} columns) - positioned at original location (column {firstColumnIndex + 1})
                </div>
              );
            })}
          </div>
          <p className="text-green-700 text-sm mt-2">
            Individual columns from multi-select groups have been removed from selection as they are now grouped.
          </p>
        </div>
      )}

      {Object.keys(customVariables).length > 0 && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h3 className="text-lg font-semibold text-indigo-800 mb-2">Custom Variables Available:</h3>
          <div className="space-y-1">
            {Object.entries(customVariables).map(([varName, variable]) => (
              <div key={varName} className="text-sm text-indigo-700">
                <strong>{variable.name}</strong> ({variable.type.replace('_', ' ')})
                {variable.description && <span className="text-indigo-600"> - {variable.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Reorder Interface Toggle */}
      {(tableVariables.length > 1 || bannerVariables.length > 1) && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-1">Customize Order</h3>
              <p className="text-purple-700 text-sm">
                Reorder your questions and banners to match your desired report layout
              </p>
            </div>
            <button
              onClick={() => setShowReorderInterface(!showReorderInterface)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Move size={16} />
              {showReorderInterface ? 'Hide' : 'Show'} Reorder
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Reorder Interface */}
      {showReorderInterface && (
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tableVariables.length > 1 && (
            <DragDropReorder
              items={tableVariables}
              onReorder={onTableVariablesChange}
              title="Reorder Side Breaks (Rows)"
              type="questions"
            />
          )}
          {bannerVariables.length > 1 && (
            <DragDropReorder
              items={bannerVariables}
              onReorder={onBannerVariablesChange}
              title="Reorder Top Breaks (Columns)"
              type="banners"
            />
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Table Variables */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Side Breaks (Rows)
            </h3>
            <button
              onClick={handleSelectAllTable}
              className="flex items-center gap-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg transition-colors"
            >
              {isAllTableSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              {isAllTableSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
            <div className="space-y-2">
              {orderedTableVariables.map((variable) => (
                <label
                  key={variable.name}
                  className={`flex items-start space-x-3 cursor-pointer hover:bg-white p-2 rounded transition-colors ${
                    variable.type === 'multiselect' ? 'border-l-4 border-orange-400' : 
                    variable.type === 'custom' ? 'border-l-4 border-indigo-400' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tableVariables.includes(variable.name)}
                    onChange={(e) => handleTableVariableChange(variable.name, e.target.checked)}
                    className={`mt-0.5 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0 ${
                      variable.type === 'multiselect' ? 'text-orange-600 focus:ring-orange-500' : 
                      variable.type === 'custom' ? 'text-indigo-600 focus:ring-indigo-500' : 'text-blue-600'
                    }`}
                  />
                  <div className="flex-1">
                    <span className={`text-sm break-words ${
                      variable.type === 'multiselect' ? 'font-medium text-orange-700' : 
                      variable.type === 'custom' ? 'font-medium text-indigo-700' : 'text-gray-700'
                    }`}>
                      {variable.name}
                    </span>
                    {variable.type === 'multiselect' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Multi-select group ({multiSelectGroups[variable.name]?.length} columns)
                      </p>
                    )}
                    {variable.type === 'custom' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Custom variable ({customVariables[variable.name]?.type.replace('_', ' ')})
                      </p>
                    )}
                    {variable.originalIndex !== undefined && (
                      <p className="text-xs text-gray-400 mt-1">
                        Original position: Column {variable.originalIndex + 1}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Banner Variables */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Top Breaks/Banner (Columns)
            </h3>
            <button
              onClick={handleSelectAllBanner}
              className="flex items-center gap-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg transition-colors"
            >
              {isAllBannerSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              {isAllBannerSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
            <div className="space-y-2">
              {availableBannerVariables.map((header) => (
                <label
                  key={header}
                  className="flex items-start space-x-3 cursor-pointer hover:bg-white p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={bannerVariables.includes(header)}
                    onChange={(e) => handleBannerVariableChange(header, e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700 break-words">{header}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onContinue}
          className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Continue to Advanced Filters
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}