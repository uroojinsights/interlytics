import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataPreview } from './components/DataPreview';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { CrossTabExplanation } from './components/CrossTabExplanation';
import { MultiSelectDefinition } from './components/MultiSelectDefinition';
import { QuestionTypeSelector } from './components/QuestionTypeSelector';
import { VariableSelector } from './components/VariableSelector';
import { FilterManager } from './components/FilterManager';
import { AdvancedCustomVariables } from './components/AdvancedCustomVariables';
import { NestedFilterBuilder } from './components/NestedFilterBuilder';
import { OpenEndCodingSettings } from './components/OpenEndCodingSettings';
import { TableNamingModal } from './components/TableNamingModal';
import { AnalysisResults } from './components/AnalysisResults';
import { OutputOptionsModal } from './components/OutputOptionsModal';
import { QuestionnaireUpload } from './components/QuestionnaireUpload';
import { processExcelFile, generateCrossTabs } from './utils/excelProcessor';
import { exportToExcelWithIndex } from './utils/excelExporter';
import { createDefaultCodingSettings } from './utils/openEndCoding';
import { ExcelData, CrossTabConfig, CrossTabResult, QuestionType, NestedFilterGroup, CodingSettings } from './types';
import { BarChart3, Sparkles, Filter, Brain } from 'lucide-react';

type AppStep = 'onboarding' | 'upload' | 'questionnaire' | 'multiselect' | 'questiontypes' | 'variables' | 'filters' | 'naming' | 'results';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('onboarding');
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userFeedback, setUserFeedback] = useState<Record<string, any>>({});
  const [outputOptions, setOutputOptions] = useState({ counts: true, percentages: true });
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [config, setConfig] = useState<CrossTabConfig>({
    tableVariables: [],
    bannerVariables: [],
    multiSelectGroups: {},
    questionTypes: {},
    tableNames: {},
    filters: {},
    customVariables: {},
    nestedFilters: []
  });
  const [results, setResults] = useState<CrossTabResult[]>([]);
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [codingSettings, setCodingSettings] = useState<CodingSettings>(createDefaultCodingSettings());

  const handleOnboardingComplete = (email?: string) => {
    setShowOnboarding(false);
    setCurrentStep('upload');
    // Store user email for feedback learning if provided
    if (email) {
      setUserFeedback(prev => ({ ...prev, userEmail: email }));
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await processExcelFile(file);
      setExcelData(data);
      setResults([]);
      setConfig({
        tableVariables: [],
        bannerVariables: [],
        multiSelectGroups: {},
        questionTypes: {},
        tableNames: {},
        filters: {},
        customVariables: {},
        nestedFilters: []
      });
      setCurrentStep('questionnaire');
    } catch (error) {
      alert(`Error processing file: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuestionnaireStep = () => {
    setCurrentStep('multiselect');
  };

  const handleContinueToQuestionTypes = () => {
    setCurrentStep('questiontypes');
  };

  const handleContinueToVariables = () => {
    setCurrentStep('variables');
  };

  const handleContinueToFilters = () => {
    setCurrentStep('filters');
  };

  const handleBackToMultiSelect = () => {
    setCurrentStep('multiselect');
    setConfig(prev => ({
      ...prev,
      tableVariables: [],
      bannerVariables: [],
      questionTypes: {},
      tableNames: {}
    }));
  };

  const handleBackToQuestionTypes = () => {
    setCurrentStep('questiontypes');
    setConfig(prev => ({
      ...prev,
      tableVariables: [],
      bannerVariables: [],
      tableNames: {}
    }));
  };

  const handleBackToVariables = () => {
    setCurrentStep('variables');
  };

  const handleProceedToNaming = () => {
    if (!canGenerateAnalysis()) {
      alert('Please select at least one side break (row) and one top break (banner) variable');
      return;
    }
    setShowNamingModal(true);
  };

  const handleTableNamesConfirmed = (tableNames: Record<string, string>) => {
    setConfig(prev => ({ ...prev, tableNames }));
    setShowNamingModal(false);
    setCurrentStep('naming');
    
    // Automatically proceed to generate analysis
    setTimeout(() => {
      handleGenerateAnalysis();
    }, 100);
  const handleOutputOptionsConfirmed = () => {
    setShowOutputModal(false);
    // Automatically proceed to generate analysis
    setTimeout(() => {
      handleGenerateAnalysis();
    }, 100);
  };

  };

  const handleGenerateAnalysis = async () => {
    if (!excelData) return;
    
    try {
      setIsProcessing(true);
      const analysisResults = await generateCrossTabs(excelData, config, codingSettings, userFeedback);
      setResults(analysisResults);
      setCurrentStep('results');
    } catch (error) {
      alert(`Error generating analysis: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (results.length === 0 || !excelData) return;
    
    try {
      exportToExcelWithIndex(results, excelData.fileName, outputOptions);
    } catch (error) {
      alert(`Error exporting file: ${error}`);
    }
  };

  const canGenerateAnalysis = () => {
    if (!excelData || config.bannerVariables.length === 0) return false;
    
    const hasRegularVariables = config.tableVariables.some(tableVar => 
      !Object.keys(config.multiSelectGroups).includes(tableVar) &&
      !Object.keys(config.customVariables).includes(tableVar)
    );
    const hasMultiSelectGroups = Object.keys(config.multiSelectGroups).some(groupName =>
      config.tableVariables.includes(groupName) && config.multiSelectGroups[groupName].length > 0
    );
    const hasCustomVariables = Object.keys(config.customVariables).some(varName =>
      config.tableVariables.includes(varName)
    );
    
    return hasRegularVariables || hasMultiSelectGroups || hasCustomVariables;
  };

  const resetToUpload = () => {
    setCurrentStep('upload');
    setExcelData(null);
    setResults([]);
    setConfig({
      tableVariables: [],
      bannerVariables: [],
      multiSelectGroups: {},
      questionTypes: {},
      tableNames: {},
      filters: {},
      customVariables: {},
      nestedFilters: []
    });
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  const addNestedFilterGroup = () => {
    const newGroup: NestedFilterGroup = {
      id: `group_${Date.now()}`,
      operator: 'AND',
      conditions: []
    };
    
    setConfig(prev => ({
      ...prev,
      nestedFilters: [...prev.nestedFilters, newGroup]
    }));
  };

  const updateNestedFilterGroup = (index: number, group: NestedFilterGroup) => {
    setConfig(prev => ({
      ...prev,
      nestedFilters: prev.nestedFilters.map((g, i) => i === index ? group : g)
    }));
  };

  const removeNestedFilterGroup = (index: number) => {
    setConfig(prev => ({
      ...prev,
      nestedFilters: prev.nestedFilters.filter((_, i) => i !== index)
    }));
  };

  // Prepare tables for naming modal
  const getTablesForNaming = () => {
    return config.tableVariables.map(tableVar => {
      const isMultiSelect = Object.keys(config.multiSelectGroups).includes(tableVar);
      const isCustom = Object.keys(config.customVariables).includes(tableVar);
      
      let suggestedName = tableVar;
      if (isMultiSelect) {
        suggestedName = `${tableVar} (Multi-Select Analysis)`;
      } else if (isCustom) {
        suggestedName = `${tableVar} (Custom Variable)`;
      } else {
        suggestedName = `${tableVar} Analysis`;
      }
      
      return {
        variable: tableVar,
        banners: config.bannerVariables,
        suggestedName
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Onboarding Overlay */}
      {showOnboarding && (
        <OnboardingOverlay onComplete={handleOnboardingComplete} />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <BarChart3 className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Advanced Cross-Tabulation Analyzer
              </h1>
              <p className="text-gray-600 mt-1">
                AI-powered survey analysis with semantic coding, nested filtering, and professional Excel output
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      {excelData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'questionnaire' ? 'text-green-600' : (currentStep === 'multiselect' || currentStep === 'questiontypes' || currentStep === 'variables' || currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'questionnaire' ? 'bg-green-100' : (currentStep === 'multiselect' || currentStep === 'questiontypes' || currentStep === 'variables' || currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'bg-green-100' : 'bg-gray-100'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Questionnaire (Optional)</span>
            </div>
            <div className={`w-8 h-1 ${(currentStep === 'multiselect' || currentStep === 'questiontypes' || currentStep === 'variables' || currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'bg-green-300' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep === 'multiselect' ? 'text-orange-600' : (currentStep === 'questiontypes' || currentStep === 'variables' || currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'multiselect' ? 'bg-orange-100' : (currentStep === 'questiontypes' || currentStep === 'variables' || currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'bg-green-100' : 'bg-gray-100'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Multi-Select Setup</span>
            </div>
            <div className={`w-8 h-1 ${(currentStep === 'questiontypes' || currentStep === 'variables' || currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'bg-green-300' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep === 'questiontypes' ? 'text-blue-600' : (currentStep === 'variables' || currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'questiontypes' ? 'bg-blue-100' : (currentStep === 'variables' || currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'bg-green-100' : 'bg-gray-100'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Question Types</span>
            </div>
            <div className={`w-8 h-1 ${(currentStep === 'variables' || currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'bg-green-300' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep === 'variables' ? 'text-purple-600' : (currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'variables' ? 'bg-purple-100' : (currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'bg-green-100' : 'bg-gray-100'}`}>
                4
              </div>
              <span className="ml-2 text-sm font-medium">Set Up Tables</span>
            </div>
            <div className={`w-8 h-1 ${(currentStep === 'filters' || currentStep === 'naming' || currentStep === 'results') ? 'bg-green-300' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep === 'filters' ? 'text-indigo-600' : (currentStep === 'naming' || currentStep === 'results') ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'filters' ? 'bg-indigo-100' : (currentStep === 'naming' || currentStep === 'results') ? 'bg-green-100' : 'bg-gray-100'}`}>
                5
              </div>
              <span className="ml-2 text-sm font-medium">Advanced Filters</span>
            </div>
            <div className={`w-8 h-1 ${(currentStep === 'naming' || currentStep === 'results') ? 'bg-green-300' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${(currentStep === 'naming' || currentStep === 'results') ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${(currentStep === 'naming' || currentStep === 'results') ? 'bg-green-100' : 'bg-gray-100'}`}>
                6
              </div>
              <span className="ml-2 text-sm font-medium">Analysis & Results</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Step 1: File Upload */}
          {currentStep === 'upload' && (
            <>
              <CrossTabExplanation />
              <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
            </>
          )}

          {/* Step 2: Optional Questionnaire Upload */}
          {currentStep === 'questionnaire' && excelData && (
            <>
              <DataPreview 
                data={excelData} 
                isCollapsible={true}
                isCollapsed={collapsedSections['dataPreview']}
                onToggleCollapse={() => toggleSection('dataPreview')}
              />
              <QuestionnaireUpload onContinue={handleQuestionnaireStep} />
            </>
          )}

          {/* Data Preview (shown on all steps after upload) */}
          {excelData && currentStep !== 'upload' && currentStep !== 'questionnaire' && (
            <div className="relative">
              <DataPreview 
                data={excelData} 
                isCollapsible={true}
                isCollapsed={collapsedSections['dataPreview']}
                onToggleCollapse={() => toggleSection('dataPreview')}
              />
              <button
                onClick={resetToUpload}
                className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Upload Different File
              </button>
            </div>
          )}

          {/* Step 3: Multi-Select Definition */}
          {currentStep === 'multiselect' && excelData && (
            <>
              <MultiSelectDefinition
                headers={excelData.headers}
                dataRows={excelData.rows}
                multiSelectGroups={config.multiSelectGroups}
                onMultiSelectGroupsChange={(groups) =>
                  setConfig(prev => ({ ...prev, multiSelectGroups: groups }))
                }
                onUserFeedback={(feedback) => setUserFeedback(prev => ({ ...prev, ...feedback }))}
                onContinue={handleContinueToQuestionTypes}
              />
              
              <div className={collapsedSections['basicFilters'] ? 'collapsed-section' : ''}>
                <FilterManager
                  headers={excelData.headers}
                  filters={config.filters}
                  onFiltersChange={(filters) =>
                    setConfig(prev => ({ ...prev, filters }))
                  }
                  isCollapsible={true}
                  isCollapsed={collapsedSections['basicFilters']}
                  onToggleCollapse={() => toggleSection('basicFilters')}
                />
              </div>
              
              <div className={collapsedSections['customVariables'] ? 'collapsed-section' : ''}>
                <AdvancedCustomVariables
                  headers={excelData.headers}
                  customVariables={config.customVariables}
                  onCustomVariablesChange={(variables) =>
                    setConfig(prev => ({ ...prev, customVariables: variables }))
                  }
                  isCollapsible={true}
                  isCollapsed={collapsedSections['customVariables']}
                  onToggleCollapse={() => toggleSection('customVariables')}
                />
              </div>

              <div className={collapsedSections['openEndCoding'] ? 'collapsed-section' : ''}>
                <OpenEndCodingSettings
                  settings={codingSettings}
                  onSettingsChange={setCodingSettings}
                  isCollapsible={true}
                  isCollapsed={collapsedSections['openEndCoding']}
                  onToggleCollapse={() => toggleSection('openEndCoding')}
                />
              </div>
            </>
          )}

          {/* Step 4: Question Type Configuration */}
          {currentStep === 'questiontypes' && excelData && (
            <QuestionTypeSelector
              headers={excelData.headers}
              questionTypes={config.questionTypes}
              multiSelectGroups={config.multiSelectGroups}
              dataRows={excelData.rows}
              userFeedback={userFeedback}
              onQuestionTypesChange={(types) =>
                setConfig(prev => ({ ...prev, questionTypes: types }))
              }
              onUserFeedback={(feedback) => setUserFeedback(prev => ({ ...prev, ...feedback }))}
              onContinue={handleContinueToVariables}
              onBack={handleBackToMultiSelect}
            />
          )}

          {/* Step 5: Variable Selection */}
          {currentStep === 'variables' && excelData && (
            <>
              <VariableSelector
                headers={excelData.headers}
                tableVariables={config.tableVariables}
                bannerVariables={config.bannerVariables}
                multiSelectGroups={config.multiSelectGroups}
                customVariables={config.customVariables}
                onTableVariablesChange={(variables) =>
                  setConfig(prev => ({ ...prev, tableVariables: variables }))
                }
                onBannerVariablesChange={(variables) =>
                  setConfig(prev => ({ ...prev, bannerVariables: variables }))
                }
                onBack={handleBackToQuestionTypes}
                onContinue={handleContinueToFilters}
              />
            </>
          )}

          {/* Step 6: Advanced Filters */}
          {currentStep === 'filters' && excelData && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Filter className="text-indigo-600" size={28} />
                    Advanced Nested Filters
                  </h2>
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Brain size={16} />
                    {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                  </button>
                </div>

                {showAdvancedFilters && (
                  <>
                    <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <h3 className="text-lg font-semibold text-indigo-800 mb-2">Nested Filter Logic</h3>
                      <p className="text-indigo-700 text-sm">
                        Build complex filter conditions using AND/OR/NOT operators. Create nested groups 
                        for sophisticated data filtering before analysis.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {config.nestedFilters.map((group, index) => (
                        <NestedFilterBuilder
                          key={group.id}
                          headers={excelData.headers}
                          filterGroup={group}
                          onFilterGroupChange={(updatedGroup) => updateNestedFilterGroup(index, updatedGroup)}
                          onRemove={() => removeNestedFilterGroup(index)}
                        />
                      ))}

                      <button
                        onClick={addNestedFilterGroup}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Filter size={16} />
                        Add Filter Group
                      </button>
                    </div>
                  </>
                )}

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={handleBackToVariables}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    ← Back to Variables
                  </button>
                  <button
                    onClick={handleProceedToNaming}
                    disabled={!canGenerateAnalysis()}
                    className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Sparkles size={24} />
                    Proceed to Table Naming
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 7: Results */}
          {currentStep === 'results' && (
            <AnalysisResults 
              results={results} 
              onExport={handleExport}
              isProcessing={isProcessing}
              outputOptions={outputOptions}
            />
          )}
        </div>
      </main>

      {/* Table Naming Modal */}
      {showNamingModal && (
        <TableNamingModal
          tables={getTablesForNaming()}
          onConfirm={handleTableNamesConfirmed}
          onCancel={() => setShowNamingModal(false)}
        />
      )}

      {/* Output Options Modal */}
      {showOutputModal && (
        <OutputOptionsModal
          options={outputOptions}
          onOptionsChange={setOutputOptions}
          onConfirm={handleOutputOptionsConfirmed}
          onCancel={() => setShowOutputModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>Advanced Cross-Tabulation Analysis Tool with AI-Powered Open-End Coding</p>
            <p className="text-sm mt-2">
              Semantic clustering, nested filtering, custom variables, and professional Excel reporting
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;