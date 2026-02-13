import React from 'react';
import { DetectedMultiSelectGroup } from '../utils/multiSelectDetection';
import { CheckCircle, AlertCircle, Eye } from 'lucide-react';

interface AutoMultiSelectDetectionProps {
  detectedGroups: DetectedMultiSelectGroup[];
  onAcceptGroup: (group: DetectedMultiSelectGroup) => void;
  onRejectGroup: (group: DetectedMultiSelectGroup) => void;
  onModifyGroup: (group: DetectedMultiSelectGroup, newColumns: string[]) => void;
}

export function AutoMultiSelectDetection({
  detectedGroups,
  onAcceptGroup,
  onRejectGroup,
  onModifyGroup
}: AutoMultiSelectDetectionProps) {
  if (detectedGroups.length === 0) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
        <Eye size={20} />
        Auto-Detected Multi-Select Questions
      </h3>
      
      <p className="text-blue-700 text-sm mb-4">
        We've automatically detected potential multi-select questions. Please review and confirm:
      </p>
      
      <div className="space-y-4">
        {detectedGroups.map((group, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-1">{group.questionRoot}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(group.confidence)}`}>
                    {getConfidenceLabel(group.confidence)} Confidence ({Math.round(group.confidence * 100)}%)
                  </span>
                  <span className="text-sm text-gray-600">
                    {group.columns.length} columns detected
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAcceptGroup(group)}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  <CheckCircle size={14} />
                  Accept
                </button>
                <button
                  onClick={() => onRejectGroup(group)}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  <AlertCircle size={14} />
                  Reject
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {group.columns.map((column, colIndex) => (
                <label
                  key={colIndex}
                  className="flex items-start space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    onChange={(e) => {
                      const newColumns = group.columns.filter((_, idx) => 
                        idx === colIndex ? e.target.checked : 
                        document.querySelector(`input[data-group="${index}"][data-col="${idx}"]`)?.checked
                      );
                      onModifyGroup(group, newColumns);
                    }}
                    data-group={index}
                    data-col={colIndex}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-gray-700 break-words leading-tight">{column}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}