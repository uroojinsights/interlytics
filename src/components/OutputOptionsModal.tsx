import React from 'react';
import { X, Download, BarChart3, Percent, Hash } from 'lucide-react';

interface OutputOptionsModalProps {
  options: { counts: boolean; percentages: boolean };
  onOptionsChange: (options: { counts: boolean; percentages: boolean }) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OutputOptionsModal({ options, onOptionsChange, onConfirm, onCancel }: OutputOptionsModalProps) {
  const handleOptionChange = (key: 'counts' | 'percentages', value: boolean) => {
    // Ensure at least one option is always selected
    if (!value && ((key === 'counts' && !options.percentages) || (key === 'percentages' && !options.counts))) {
      return;
    }
    
    onOptionsChange({
      ...options,
      [key]: value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Download className="text-blue-600" size={28} />
            Choose Your Output Format
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-700 text-sm">
            Choose what data to include in your Excel export. You can select counts only, percentages only, 
            or both for comprehensive analysis.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.counts}
                onChange={(e) => handleOptionChange('counts', e.target.checked)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-800">Absolute Counts</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Raw numbers showing how many respondents gave each answer. 
                  Essential for understanding sample sizes and statistical significance.
                </p>
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  Example: 150 respondents said "Very Satisfied"
                </div>
              </div>
            </label>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.percentages}
                onChange={(e) => handleOptionChange('percentages', e.target.checked)}
                className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="text-green-600" size={20} />
                  <span className="font-semibold text-gray-800">Percentages</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Proportional data showing what percentage of respondents gave each answer. 
                  Perfect for comparing across different groups and identifying trends.
                </p>
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  Example: 45% of respondents said "Very Satisfied"
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-6">
          <div className="flex items-start gap-2">
            <BarChart3 className="text-yellow-600 mt-0.5" size={16} />
            <div>
              <p className="text-yellow-800 text-sm font-medium">Recommendation:</p>
              <p className="text-yellow-700 text-sm">
                Include both counts and percentages for the most comprehensive analysis. 
                Counts show statistical reliability, while percentages reveal patterns and trends.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Download size={20} />
            Generate Analysis
          </button>
        </div>
      </div>
    </div>
  );
}