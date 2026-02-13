import React from 'react';
import { CrossTabResult } from '../types';
import { Download, BarChart3, AlertTriangle, CheckCircle, Info, TrendingUp, Target, Loader } from 'lucide-react';

interface AnalysisResultsProps {
  results: CrossTabResult[];
  onExport: () => void;
  isProcessing?: boolean;
}

export function AnalysisResults({ results, onExport, isProcessing = false }: AnalysisResultsProps) {
  if (results.length === 0 && !isProcessing) {
    return null;
  }

  if (isProcessing) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Generating Analysis...</h3>
            <p className="text-gray-600">
              Processing your data with AI-powered semantic analysis and statistical calculations
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getQuestionTypeColor = (questionType: string) => {
    switch (questionType) {
      case 'single-choice': return 'bg-blue-100 text-blue-800';
      case 'multiple-choice': return 'bg-green-100 text-green-800';
      case 'scale': return 'bg-pink-100 text-pink-800';
      case 'ranking': return 'bg-purple-100 text-purple-800';
      case 'binary': return 'bg-orange-100 text-orange-800';
      case 'numeric': return 'bg-indigo-100 text-indigo-800';
      case 'open-ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuestionTypeNote = (questionType: string) => {
    switch (questionType) {
      case 'single-choice':
        return 'Percentages should sum to 100% per column (one answer per respondent)';
      case 'multiple-choice':
        return 'Percentages based on respondents who answered any option. Total may exceed 100%';
      case 'binary':
        return 'Yes/No question. Percentages should sum to 100% per column';
      case 'scale':
        return 'Scale question with Top/Bottom Box calculations included';
      case 'ranking':
        return 'Ranking data with detailed rank analysis included';
      case 'open-ended':
        return 'Text responses auto-coded using AI semantic analysis and keyword clustering';
      default:
        return '';
    }
  };

  const renderBannerHeaders = (result: CrossTabResult) => {
    if (!result.bannerStructure || result.bannerStructure.length === 0) {
      return (
        <tr>
          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">
            {result.bannerQuestion}
          </th>
          {result.headers.map((header, idx) => (
            <th key={idx} className="px-3 py-2 text-center font-medium text-gray-600 border-b">
              {header}
            </th>
          ))}
        </tr>
      );
    }

    return (
      <>
        {/* Question row */}
        <tr>
          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b"></th>
          <th className="px-3 py-2 text-center font-medium text-gray-600 border-b">Total</th>
          {result.bannerStructure.map((banner, idx) => (
            <th 
              key={idx} 
              colSpan={banner.answers.length}
              className="px-3 py-2 text-center font-medium text-gray-600 border-b bg-gray-50"
            >
              {banner.question}
            </th>
          ))}
        </tr>
        {/* Answer row */}
        <tr>
          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b"></th>
          <th className="px-3 py-2 text-center font-medium text-gray-600 border-b"></th>
          {result.bannerStructure.map((banner) => 
            banner.answers.map((answer, answerIdx) => (
              <th key={`${banner.question}-${answerIdx}`} className="px-3 py-2 text-center font-medium text-gray-600 border-b">
                {answer}
              </th>
            ))
          )}
        </tr>
      </>
    );
  };

  const renderDataCell = (value: any, significance: string) => {
    const displayValue = value || 0;
    const hasSignificance = significance && significance.trim() !== '';
    
    return (
      <span className={hasSignificance ? 'font-semibold' : ''}>
        {displayValue}
        {hasSignificance && (
          <span className={`ml-1 ${significance === '*' ? 'text-green-600' : 'text-red-600'}`}>
            {significance}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <BarChart3 className="text-orange-600" size={28} />
          Analysis Results
        </h2>
        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Download size={20} />
          Export to Excel
        </button>
      </div>

      {/* Significance Testing Legend */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Statistical Significance Legend:</h3>
        <div className="flex items-center gap-6 text-sm text-blue-700">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-green-600">*</span>
            <span>Significantly higher than total (p &lt; 0.05)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-red-600">↓</span>
            <span>Significantly lower than total (p &lt; 0.05)</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {results.map((result, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {result.displayName || result.name.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Banner: {result.bannerQuestion}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(result.questionType)}`}>
                    {result.questionType.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* Question Type Note */}
              {getQuestionTypeNote(result.questionType) && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      {getQuestionTypeNote(result.questionType)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Validation Errors */}
              {result.validationErrors && result.validationErrors.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 mb-1">Validation Warnings:</p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {result.validationErrors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Coding Results for Open-Ended */}
              {result.openEndCoding && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-purple-800 mb-1">AI Semantic Analysis Complete:</p>
                      <p className="text-sm text-purple-700">
                        {result.openEndCoding.categories.length} categories generated from {result.openEndCoding.responses.length} responses
                        {result.openEndCoding.settings.useSemanticClustering && ' using semantic clustering'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Absolute Values */}
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Absolute Values</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        {renderBannerHeaders(result)}
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Base</th>
                          {result.baseValues.map((baseValue, idx) => (
                            <th key={idx} className="px-3 py-2 text-center font-medium text-gray-600 border-b">
                              {baseValue}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.absolute.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-700 border-b">
                              {result.rowLabels[rowIdx]}
                            </td>
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-3 py-2 text-center text-gray-600 border-b">
                                {renderDataCell(cell, result.significanceFlags[rowIdx]?.[cellIdx] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Percentage Values */}
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Percentage Values</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        {renderBannerHeaders(result)}
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Base</th>
                          {result.baseValues.map((baseValue, idx) => (
                            <th key={idx} className="px-3 py-2 text-center font-medium text-gray-600 border-b">
                              {baseValue}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.percentage.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-700 border-b">
                              {result.rowLabels[rowIdx]}
                            </td>
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-3 py-2 text-center text-gray-600 border-b">
                                {renderDataCell(cell, result.significanceFlags[rowIdx]?.[cellIdx] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Statistical Measures */}
              {result.statisticalMeasures && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-600" />
                    Statistical Measures
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 text-sm">
                      <thead className="bg-indigo-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Statistic</th>
                          {result.statisticalMeasures.headers.map((header, idx) => (
                            <th key={idx} className="px-3 py-2 text-center font-medium text-gray-600 border-b">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-700 border-b">Mean</td>
                          {result.statisticalMeasures.mean.map((value, idx) => (
                            <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">
                              {value.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-700 border-b">Median</td>
                          {result.statisticalMeasures.median.map((value, idx) => (
                            <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">
                              {value.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-700 border-b">Std Deviation</td>
                          {result.statisticalMeasures.standardDeviation.map((value, idx) => (
                            <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">
                              {value.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Scale Calculations */}
              {result.scaleCalculations && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Target size={20} className="text-pink-600" />
                    Scale Analysis (Top/Bottom Box)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 text-sm">
                      <thead className="bg-pink-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Metric</th>
                          {result.headers.map((header, idx) => (
                            <th key={idx} className="px-3 py-2 text-center font-medium text-gray-600 border-b">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-700 border-b">Top Box ({result.scaleCalculations.scaleRange.max})</td>
                          {result.scaleCalculations.topBox.map((row, idx) => (
                            <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{row[0]}%</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-700 border-b">Top 2 Box ({result.scaleCalculations.scaleRange.max-1}+{result.scaleCalculations.scaleRange.max})</td>
                          {result.scaleCalculations.top2Box.map((row, idx) => (
                            <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{row[0]}%</td>
                          ))}
                        </tr>
                        {result.scaleCalculations.top3Box && (
                          <tr className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-700 border-b">Top 3 Box</td>
                            {result.scaleCalculations.top3Box.map((row, idx) => (
                              <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{row[0]}%</td>
                            ))}
                          </tr>
                        )}
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-700 border-b">Bottom Box ({result.scaleCalculations.scaleRange.min})</td>
                          {result.scaleCalculations.bottomBox.map((row, idx) => (
                            <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{row[0]}%</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-700 border-b">Bottom 2 Box ({result.scaleCalculations.scaleRange.min}+{result.scaleCalculations.scaleRange.min+1})</td>
                          {result.scaleCalculations.bottom2Box.map((row, idx) => (
                            <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{row[0]}%</td>
                          ))}
                        </tr>
                        {result.scaleCalculations.bottom3Box && (
                          <tr className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-700 border-b">Bottom 3 Box</td>
                            {result.scaleCalculations.bottom3Box.map((row, idx) => (
                              <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{row[0]}%</td>
                            ))}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ranking Calculations */}
              {result.rankingCalculations && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp size={20} className="text-purple-600" />
                    Ranking Analysis
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 text-sm">
                      <thead className="bg-purple-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Rank</th>
                          {result.headers.map((header, idx) => (
                            <th key={idx} className="px-3 py-2 text-center font-medium text-gray-600 border-b">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rankingCalculations.rankOptions.map((option, optionIdx) => (
                          <React.Fragment key={optionIdx}>
                            <tr className="bg-purple-100">
                              <td colSpan={result.headers.length + 1} className="px-3 py-2 font-semibold text-purple-800 border-b">
                                {option}
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-700 border-b pl-6">Rank 1 Only</td>
                              {result.rankingCalculations.rank1Only[optionIdx]?.map((pct, idx) => (
                                <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{pct}%</td>
                              ))}
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-700 border-b pl-6">Rank 2 Only</td>
                              {result.rankingCalculations.rank2Only[optionIdx]?.map((pct, idx) => (
                                <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{pct}%</td>
                              ))}
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-700 border-b pl-6">Rank 3 Only</td>
                              {result.rankingCalculations.rank3Only[optionIdx]?.map((pct, idx) => (
                                <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{pct}%</td>
                              ))}
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-700 border-b pl-6">Rank 1 + 2</td>
                              {result.rankingCalculations.rank1Plus2[optionIdx]?.map((pct, idx) => (
                                <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{pct}%</td>
                              ))}
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-700 border-b pl-6">Rank 1 + 2 + 3</td>
                              {result.rankingCalculations.rank1Plus2Plus3[optionIdx]?.map((pct, idx) => (
                                <td key={idx} className="px-3 py-2 text-center text-gray-600 border-b">{pct}%</td>
                              ))}
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Open-Ended Themes with AI Coding */}
              {result.openEndCoding && result.openEndCoding.categories.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">AI-Generated Response Categories</h4>
                  <div className="space-y-4">
                    {result.openEndCoding.categories.map((category, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-800">{category.name}</h5>
                          <div className="text-sm text-gray-600">
                            {category.responseCount} responses ({Math.round((category.responseCount / result.openEndCoding!.responses.length) * 100)}%)
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                        
                        {category.keywords.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500">Key terms: </span>
                            <span className="text-xs text-gray-600">{category.keywords.join(', ')}</span>
                          </div>
                        )}
                        
                        {category.sampleResponses.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <p className="font-medium mb-1">Sample responses:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {category.sampleResponses.map((sample, sampleIdx) => (
                                <li key={sampleIdx} className="italic">"{sample}"</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}