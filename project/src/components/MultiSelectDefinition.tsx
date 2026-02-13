import React, { useEffect } from 'react';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { detectMultiSelectQuestions, DetectedMultiSelectGroup, analyzeMultiSelectConfidence } from '../utils/multiSelectDetection';
import { AutoMultiSelectDetection } from './AutoMultiSelectDetection';

function extractRankQuestionRoot(header: string): string {
  // Extract question root from ranking headers
  const patterns = [
    /^(.+?)_[Rr]ank?\d+/,
    /^(.+?)_[Rr]\d+/,
    /^(.+?)_Rank_?\d+/,
    /^(.+?)\s+[Rr]ank\s*\d+/,
  ];
  
  for (const pattern of patterns) {
    const match = header.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return header.split(/[_\s]/)[0];
}

interface MultiSelectDefinitionProps {
  headers: string[];
  dataRows: any[][];
  multiSelectGroups: Record<string, string[]>;
  onMultiSelectGroupsChange: (groups: Record<string, string[]>) => void;
  onUserFeedback?: (feedback: any) => void;
  onContinue: () => void;
}

export function MultiSelectDefinition({
  headers,
  dataRows,
  multiSelectGroups,
  onMultiSelectGroupsChange,
  onUserFeedback,
  onContinue
}: MultiSelectDefinitionProps) {
  const [detectedGroups, setDetectedGroups] = React.useState<DetectedMultiSelectGroup[]>([]);
  const [showDetected, setShowDetected] = React.useState(true);
  const [acceptedGroups, setAcceptedGroups] = React.useState<Set<string>>(new Set());
  const [rejectedGroups, setRejectedGroups] = React.useState<Set<string>>(new Set());

  useEffect(() => {
    // Auto-detect multi-select questions when component mounts
    const detected = detectMultiSelectQuestions(headers, dataRows);
    setDetectedGroups(detected);
  }, [headers]);

  const addMultiSelectGroup = () => {
    const groupName = `Multi-Select Question ${Object.keys(multiSelectGroups).length + 1}`;
    onMultiSelectGroupsChange({
      ...multiSelectGroups,
      [groupName]: []
    });
  };

  const removeMultiSelectGroup = (groupName: string) => {
    const newGroups = { ...multiSelectGroups };
    delete newGroups[groupName];
    onMultiSelectGroupsChange(newGroups);
  };

  const updateGroupName = (oldName: string, newName: string) => {
    if (newName && newName !== oldName && !multiSelectGroups[newName]) {
      const newGroups = { ...multiSelectGroups };
      newGroups[newName] = newGroups[oldName];
      delete newGroups[oldName];
      onMultiSelectGroupsChange(newGroups);
    }
  };

  const updateGroupColumns = (groupName: string, column: string, checked: boolean) => {
    const currentColumns = multiSelectGroups[groupName] || [];
    const newColumns = checked
      ? [...currentColumns, column]
      : currentColumns.filter(c => c !== column);
    
    onMultiSelectGroupsChange({
      ...multiSelectGroups,
      [groupName]: newColumns
    });
  };

  const selectAllForGroup = (groupName: string) => {
    const currentColumns = multiSelectGroups[groupName] || [];
    const usedColumns = new Set(
      Object.entries(multiSelectGroups)
        .filter(([name]) => name !== groupName)
        .flatMap(([, cols]) => cols)
    );
    
    const availableColumns = headers.filter(header => !usedColumns.has(header));
    
    if (currentColumns.length === availableColumns.length) {
      onMultiSelectGroupsChange({
        ...multiSelectGroups,
        [groupName]: []
      });
    } else {
      onMultiSelectGroupsChange({
        ...multiSelectGroups,
        [groupName]: availableColumns
      });
    }
  };

  const getAvailableColumns = (currentGroupName: string) => {
    const usedColumns = new Set(
      Object.entries(multiSelectGroups)
        .filter(([name]) => name !== currentGroupName)
        .flatMap(([, cols]) => cols)
    );
    
    return headers.filter(header => !usedColumns.has(header));
  };

  const handleAcceptDetectedGroup = (group: DetectedMultiSelectGroup) => {
    const groupName = group.questionRoot;
    onMultiSelectGroupsChange({
      ...multiSelectGroups,
      [groupName]: group.columns
    });
    
    // Track user feedback
    setAcceptedGroups(prev => new Set([...prev, group.questionRoot]));
    if (onUserFeedback) {
      onUserFeedback({
        multiSelectAccepted: {
          [group.questionRoot]: {
            confidence: group.confidence,
            columns: group.columns,
            accepted: true
          }
        }
      });
    }
    
    // Remove from detected groups
    setDetectedGroups(prev => prev.filter(g => g !== group));
  };

  const handleRejectDetectedGroup = (group: DetectedMultiSelectGroup) => {
    // Track user feedback
    setRejectedGroups(prev => new Set([...prev, group.questionRoot]));
    if (onUserFeedback) {
      onUserFeedback({
        multiSelectRejected: {
          [group.questionRoot]: {
            confidence: group.confidence,
            columns: group.columns,
            rejected: true
          }
        }
      });
    }
    
    setDetectedGroups(prev => prev.filter(g => g !== group));
  };

  const handleModifyDetectedGroup = (group: DetectedMultiSelectGroup, newColumns: string[]) => {
    const updatedGroup = { ...group, columns: newColumns };
    setDetectedGroups(prev => prev.map(g => g === group ? updatedGroup : g));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Settings2 className="text-orange-600" size={28} />
        Define Multi-Select Questions
      </h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">What are Multi-Select Questions?</h3>
        <p className="text-blue-700 text-sm leading-relaxed">
          Multi-select questions allow respondents to choose multiple answers from a list of options. 
          For example, "Which social media platforms do you use?" where someone might select Facebook, Instagram, and Twitter.
          Each platform would be a separate column in your Excel file, and we'll combine them into one question for analysis.
        </p>
        <div className="bg-blue-100 rounded p-3 mt-3">
          <h4 className="font-semibold text-blue-800 text-sm mb-1">How We Detect Multi-Select Questions:</h4>
          <ul className="text-blue-700 text-xs space-y-1">
            <li>• <strong>Column Structure:</strong> Groups of columns with similar question roots</li>
            <li>• <strong>Response Analysis:</strong> Values that match header options or are flag values (1/0/Yes/No)</li>
            <li>• <strong>Smart Filtering:</strong> Excludes rating scales and grid questions that aren't multi-select</li>
            <li>• <strong>Confidence Scoring:</strong> Higher confidence for clearer multi-select patterns</li>
          </ul>
        </div>
      </div>

      {/* Auto-detected groups */}
      {showDetected && detectedGroups.length > 0 && (
        <AutoMultiSelectDetection
          detectedGroups={detectedGroups}
          dataRows={dataRows}
          onAcceptGroup={handleAcceptDetectedGroup}
          onRejectGroup={handleRejectDetectedGroup}
          onModifyGroup={handleModifyDetectedGroup}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-700">
          Manual Multi-Select Groups
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Need help?</span> 
            <span className="ml-1">Multi-select questions are "select all that apply" type questions where respondents can choose multiple options.</span>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <button
          onClick={addMultiSelectGroup}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Multi-Select Group
        </button>
      </div>
      
      <div className="space-y-6">
        {Object.entries(multiSelectGroups).map(([groupName, columns]) => {
          const availableColumns = getAvailableColumns(groupName);
          const isAllSelected = columns.length === availableColumns.length && availableColumns.length > 0;
          
          return (
            <div key={groupName} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => updateGroupName(groupName, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter question name (e.g., 'Social Media Platforms Used')"
                />
                <button
                  onClick={() => selectAllForGroup(groupName)}
                  disabled={availableColumns.length === 0}
                  className="px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={() => removeMultiSelectGroup(groupName)}
                  className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                {availableColumns.map((header) => (
                  <label
                    key={header}
                    className="flex items-start space-x-3 text-sm cursor-pointer hover:bg-white p-3 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={columns.includes(header)}
                      onChange={(e) => updateGroupColumns(groupName, header, e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 flex-shrink-0"
                    />
                    <span className="text-gray-700 break-words leading-tight">{header}</span>
                  </label>
                ))}
              </div>
              
              {availableColumns.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  All columns have been assigned to other groups
                </p>
              )}
              
              {columns.length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-700">
                    <strong>Selected:</strong> {columns.length} columns will be combined into one multi-select question
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {Object.keys(multiSelectGroups).length === 0 && detectedGroups.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            No multi-select groups defined yet. If your survey has questions where respondents can select multiple answers, create groups for them.
          </p>
          <p className="text-sm text-gray-400">
            If you don't have any multi-select questions, you can skip this step.
          </p>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={onContinue}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Continue to Question Types
        </button>
      </div>
    </div>
  );
}