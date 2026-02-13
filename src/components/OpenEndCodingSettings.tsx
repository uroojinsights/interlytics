import React, { useState } from 'react';
import { Brain, Settings, Zap, Target } from 'lucide-react';
import { CodingSettings } from '../types';

interface OpenEndCodingSettingsProps {
  settings: CodingSettings;
  onSettingsChange: (settings: CodingSettings) => void;
}

export function OpenEndCodingSettings({ settings, onSettingsChange }: OpenEndCodingSettingsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSetting = <K extends keyof CodingSettings>(
    key: K,
    value: CodingSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Brain className="text-purple-600" size={20} />
          AI Open-End Coding Settings
        </h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg transition-colors"
        >
          <Settings size={16} />
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-start gap-3">
          <Zap className="text-purple-600 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-purple-800 mb-1">AI-Powered Semantic Analysis</h4>
            <p className="text-purple-700 text-sm">
              Our advanced ML algorithms automatically categorize open-ended responses using semantic clustering, 
              keyword analysis, and natural language processing to generate meaningful themes tailored to your data.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <Target size={16} className="text-blue-600" />
            Core Settings
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Category Size
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.minCategorySize}
              onChange={(e) => updateSetting('minCategorySize', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum number of responses required to form a category
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Categories
            </label>
            <input
              type="number"
              min="3"
              max="50"
              value={settings.maxCategories}
              onChange={(e) => updateSetting('maxCategories', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of categories to generate
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.useSemanticClustering}
                onChange={(e) => updateSetting('useSemanticClustering', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Use Semantic Clustering</span>
                <p className="text-xs text-gray-500">
                  Enable advanced AI clustering for better categorization
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Advanced Options</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Similarity Threshold
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={settings.similarityThreshold}
                onChange={(e) => updateSetting('similarityThreshold', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>More Categories</span>
                <span>{settings.similarityThreshold}</span>
                <span>Fewer Categories</span>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.excludeShortResponses}
                  onChange={(e) => updateSetting('excludeShortResponses', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Exclude Short Responses</span>
                  <p className="text-xs text-gray-500">
                    Filter out responses shorter than minimum length
                  </p>
                </div>
              </label>
            </div>

            {settings.excludeShortResponses && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Response Length
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.minResponseLength}
                  onChange={(e) => updateSetting('minResponseLength', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum number of characters for valid responses
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">How It Works:</h4>
        <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
          <li>Responses are preprocessed and cleaned</li>
          <li>Semantic embeddings are generated using TF-IDF and NLP techniques</li>
          <li>Hierarchical clustering groups similar responses</li>
          <li>Categories are automatically named based on key themes</li>
          <li>Each response is assigned to the best-matching category</li>
        </ol>
      </div>
    </div>
  );
}