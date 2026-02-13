import React from 'react';
import { QuestionType, QuestionTypeConfig } from '../types';
import { HelpCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { autoDetectQuestionTypes, analyzeQuestionType } from '../utils/questionTypeDetection';

interface QuestionTypeSelectorProps {
  headers: string[];
  questionTypes: Record<string, QuestionType>;
  multiSelectGroups: Record<string, string[]>;
  dataRows: any[][];
  onQuestionTypesChange: (types: Record<string, QuestionType>) => void;
  onContinue: () => void;
  onBack: () => void;
}

const QUESTION_TYPE_CONFIGS: Record<QuestionType, QuestionTypeConfig> = {
  'single-choice': {
    type: 'single-choice',
    label: 'Single Choice',
    description: 'One answer per respondent (e.g., Age group, Gender). Percentages sum to 100%.',
    validationRules: {
      percentageShouldSum100: true,
      allowMultipleSelections: false,
      baseCalculation: 'respondents'
    }
  },
  'multiple-choice': {
    type: 'multiple-choice',
    label: 'Multiple Choice',
    description: 'Select all that apply (e.g., Social media platforms used). Percentages may exceed 100%.',
    validationRules: {
      percentageShouldSum100: false,
      allowMultipleSelections: true,
      baseCalculation: 'respondents'
    }
  },
  'scale': {
    type: 'scale',
    label: 'Scale (1-5, 1-7, etc.)',
    description: 'Rating scale questions. Includes Top/Bottom Box calculations.',
    validationRules: {
      percentageShouldSum100: true,
      allowMultipleSelections: false,
      baseCalculation: 'respondents'
    }
  },
  'ranking': {
    type: 'ranking',
    label: 'Ranking',
    description: 'Respondents rank options (e.g., 1st choice, 2nd choice). Shows rank analysis.',
    validationRules: {
      percentageShouldSum100: false,
      allowMultipleSelections: false,
      baseCalculation: 'respondents'
    }
  },
  'binary': {
    type: 'binary',
    label: 'Binary (Yes/No)',
    description: 'True/False or Yes/No questions. Percentages sum to 100%.',
    validationRules: {
      percentageShouldSum100: true,
      allowMultipleSelections: false,
      baseCalculation: 'respondents'
    }
  },
  'numeric': {
    type: 'numeric',
    label: 'Numeric',
    description: 'Numerical values (e.g., Age, Income). Shows averages and ranges.',
    validationRules: {
      percentageShouldSum100: false,
      allowMultipleSelections: false,
      baseCalculation: 'respondents'
    }
  },
  'open-ended': {
    type: 'open-ended',
    label: 'Open-ended/Text',
    description: 'Text responses. Auto-coded into themes using keyword analysis.',
    validationRules: {
      percentageShouldSum100: false,
      allowMultipleSelections: false,
      baseCalculation: 'respondents'
    }
  },
  'date': {
    type: 'date',
    label: 'Date/Time',
    description: 'Date or time values. Usually excluded from cross-tabulation.',
    validationRules: {
      percentageShouldSum100: false,
      allowMultipleSelections: false,
      baseCalculation: 'respondents'
    }
  }
};

export function QuestionTypeSelector({
  headers,
  questionTypes,
  multiSelectGroups,
  dataRows,
  onQuestionTypesChange,
  onContinue,
  onBack
}: QuestionTypeSelectorProps) {
  const [analysisResults, setAnalysisResults] = React.useState<Record<string, any>>({});

  // Get headers that are NOT part of multi-select groups
  const availableHeaders = headers.filter(header => 
    !Object.values(multiSelectGroups).some(group => group.includes(header))
  );

  const handleTypeChange = (header: string, type: QuestionType) => {
    onQuestionTypesChange({
      ...questionTypes,
      [header]: type
    });
  };

  const autoDetectTypes = () => {
    const detectedTypes = autoDetectQuestionTypes(headers, dataRows, multiSelectGroups);
    
    // Store analysis results for display
    const results: Record<string, any> = {};
    availableHeaders.forEach((header, index) => {
      const headerIndex = headers.indexOf(header);
      if (headerIndex !== -1) {
        const columnData = dataRows.map(row => row[headerIndex]);
        results[header] = analyzeQuestionType(header, columnData);
      }
    });
    setAnalysisResults(results);
    
    onQuestionTypesChange(detectedTypes);
  };

  const getTypeColor = (type: QuestionType) => {
    switch (type) {
      case 'single-choice': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'multiple-choice': return 'bg-green-100 text-green-800 border-green-200';
      case 'scale': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'ranking': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'binary': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'numeric': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'open-ended': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'date': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const canContinue = availableHeaders.every(header => questionTypes[header]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          ← Back to Multi-Select Setup
        </button>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <HelpCircle className="text-blue-600" size={28} />
          Configure Question Types
        </h2>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Enhanced Auto-Detection</h3>
        <p className="text-blue-700 text-sm leading-relaxed mb-3">
          Our improved detection algorithm now prioritizes:
        </p>
        <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
          <li><strong>Date/Time First:</strong> Checks for date patterns before open-ended classification</li>
          <li><strong>Binary Questions:</strong> Yes/No, True/False, Male/Female patterns</li>
          <li><strong>Scale Questions:</strong> Numeric ranges (1-5, 1-7) with rating keywords</li>
          <li><strong>Open-ended:</strong> High text variability after excluding date/time data</li>
          <li><strong>Multi-select columns excluded:</strong> Already grouped in previous step</li>
        </ul>
      </div>

      {/* Multi-select groups notice */}
      {Object.keys(multiSelectGroups).length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="text-sm font-semibold text-orange-800 mb-2">Multi-Select Groups (Auto-configured):</h4>
          <div className="space-y-1">
            {Object.entries(multiSelectGroups).map(([groupName, columns]) => (
              <div key={groupName} className="text-orange-700 text-sm">
                <strong>{groupName}:</strong> {columns.length} columns automatically set to Multiple Choice
              </div>
            ))}
          </div>
          <p className="text-orange-700 text-sm mt-2">
            These columns are excluded from individual question type selection as they're handled as groups.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-700">
          Assign Question Types to Individual Columns
        </h3>
        <button
          onClick={autoDetectTypes}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <CheckCircle2 size={16} />
          Smart Auto-Detect
        </button>
      </div>

      {/* Question Type Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Question Type Reference:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(QUESTION_TYPE_CONFIGS).map(config => (
            <div key={config.type} className={`p-3 rounded-lg border text-xs ${getTypeColor(config.type)}`}>
              <div className="font-semibold">{config.label}</div>
              <div className="mt-1 opacity-90">{config.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Column Type Assignment */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {availableHeaders.map(header => {
          const currentType = questionTypes[header];
          const analysis = analysisResults[header];
          
          return (
            <div key={header} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">{header}</h4>
                  
                  {/* Analysis Results */}
                  {analysis && (
                    <div className="mt-2 p-2 bg-white rounded border text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Info size={12} className="text-blue-500" />
                        <span className="font-medium">Auto-Detection Analysis:</span>
                        <span className={`font-semibold ${getConfidenceColor(analysis.confidence)}`}>
                          {Math.round(analysis.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-gray-600">{analysis.reasoning}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  <select
                    value={currentType || ''}
                    onChange={(e) => handleTypeChange(header, e.target.value as QuestionType)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select type...</option>
                    {Object.entries(QUESTION_TYPE_CONFIGS).map(([type, config]) => (
                      <option key={type} value={type}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {currentType && (
                <div className="mt-3 p-2 bg-white rounded border text-xs text-gray-600">
                  {QUESTION_TYPE_CONFIGS[currentType].description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
        >
          Continue to Variable Selection
        </button>
      </div>
    </div>
  );
}