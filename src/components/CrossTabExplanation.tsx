import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Lightbulb, Target, TrendingUp } from 'lucide-react';

export function CrossTabExplanation() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <BarChart3 className="text-blue-600" size={28} />
          What Are Cross-Tabulations?
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          {isExpanded ? 'Hide' : 'Show'} Details
        </button>
      </div>

      <div className="mb-4">
        <p className="text-lg text-gray-700 leading-relaxed">
          <strong>Cross-tabs (cross-tabulations) are tables that show how different answers compare across questions</strong>—making it easy to spot patterns, differences, and trends in your data. No technical background needed!
        </p>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Lightbulb className="text-blue-600 mr-2" size={24} />
                <h3 className="font-semibold text-blue-800">Simple Example</h3>
              </div>
              <p className="text-blue-700 text-sm">
                "How does satisfaction vary by age group?" A cross-tab would show satisfaction ratings (rows) 
                broken down by different age groups (columns), revealing which age groups are most/least satisfied.
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Target className="text-green-600 mr-2" size={24} />
                <h3 className="font-semibold text-green-800">Perfect For</h3>
              </div>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Survey analysis</li>
                <li>• Market research</li>
                <li>• Customer feedback</li>
                <li>• Academic research</li>
                <li>• Any Excel data comparison</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <TrendingUp className="text-purple-600 mr-2" size={24} />
                <h3 className="font-semibold text-purple-800">What You Get</h3>
              </div>
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• Professional Excel reports</li>
                <li>• Statistical significance testing</li>
                <li>• AI-powered text analysis</li>
                <li>• Interactive data exploration</li>
                <li>• Publication-ready tables</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Sample Cross-Tab Table:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left">Satisfaction Level</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Total</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">18-34 Years</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">35-54 Years</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">55+ Years</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">Very Satisfied</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">45%</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-green-600 font-semibold">52%*</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">43%</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-red-600 font-semibold">38%↓</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">Satisfied</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">35%</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">32%</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">36%</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">38%</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">Dissatisfied</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">20%</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">16%</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">21%</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">24%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <p><span className="text-green-600 font-semibold">*</span> = Significantly higher than total | 
              <span className="text-red-600 font-semibold"> ↓</span> = Significantly lower than total</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Key Insight from This Example:</h4>
            <p className="text-blue-700 text-sm">
              Younger customers (18-34) are significantly more satisfied than average, while older customers (55+) 
              are significantly less satisfied. This suggests the product/service may appeal more to younger demographics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}