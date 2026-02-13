import * as XLSX from 'xlsx';
import { ExcelData, CrossTabConfig, CrossTabResult, QuestionType, BannerStructure, ScaleCalculations, RankingCalculations, OpenEndedTheme, StatisticalMeasures, FilterConfig } from '../types';
import { extractOptionFromHeader, extractQuestionFromHeader, extractThemes, detectScaleRange, removeSharedPrefix } from './textProcessing';
import { performSignificanceTests } from './statisticalTests';
import { detectRankQuestionStructure, createRankingCrossTab } from './rankingProcessor';

export function processExcelFile(file: File): Promise<ExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('No sheets found in Excel file');
        }
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        if (jsonData.length === 0) {
          throw new Error('Empty sheet');
        }
        
        const headers = (jsonData[0] as any[]).map((header, index) => 
          header ? String(header).trim() : `Column_${index + 1}`
        );
        
        const rows = jsonData.slice(1).map((row: any) => 
          headers.map((_, index) => row[index] || '')
        );
        
        resolve({
          headers,
          rows,
          fileName: file.name
        });
      } catch (error) {
        reject(new Error(`Failed to process Excel file: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function generateCrossTabs(data: ExcelData, config: CrossTabConfig): CrossTabResult[] {
  const results: CrossTabResult[] = [];
  
  // Apply filters to data
  const filteredData = applyFilters(data, config.filters);
  
  // Create a data map for easier processing
  const dataMap = filteredData.rows.map(row => {
    const rowData: Record<string, any> = {};
    data.headers.forEach((header, index) => {
      rowData[header] = row[index] || '';
    });
    return rowData;
  });
  
  // Detect ranking question structures
  const rankQuestionStructures = detectRankQuestionStructure(data.headers, config.questionTypes);
  
  // Process each table variable in the specified order
  config.tableVariables.forEach(tableVar => {
    // Check if this is a multi-select group
    const isMultiSelectGroup = Object.keys(config.multiSelectGroups).includes(tableVar);
    const isCustomVariable = Object.keys(config.customVariables || {}).includes(tableVar);
    const isRankQuestion = rankQuestionStructures.some(rank => rank.questionName === tableVar);
    
    if (isMultiSelectGroup) {
      const multiSelectCols = config.multiSelectGroups[tableVar];
      if (multiSelectCols && multiSelectCols.length > 0) {
        const result = createMultiSelectCrossTab(
          dataMap, 
          tableVar, 
          config.bannerVariables, 
          multiSelectCols, 
          data.headers,
          config.tableNames[tableVar] || tableVar
        );
        if (result) results.push(result);
      }
    } else if (isCustomVariable) {
      const customVar = config.customVariables[tableVar];
      const result = createCustomVariableCrossTab(
        dataMap,
        tableVar,
        config.bannerVariables,
        customVar,
        data.headers,
        config.tableNames[tableVar] || tableVar
      );
      if (result) results.push(result);
    } else if (isRankQuestion) {
      const rankStructure = rankQuestionStructures.find(rank => rank.questionName === tableVar);
      if (rankStructure) {
        const result = createRankQuestionCrossTab(
          dataMap,
          tableVar,
          config.bannerVariables,
          rankStructure,
          data.headers,
          config.tableNames[tableVar] || tableVar
        );
        if (result) results.push(result);
      }
    } else {
      // Regular single-column variable
      if (data.headers.includes(tableVar)) {
        const questionType = config.questionTypes[tableVar] || 'single-choice';
        const result = createRegularCrossTab(
          dataMap, 
          tableVar, 
          config.bannerVariables, 
          questionType, 
          data.headers,
          config.tableNames[tableVar] || tableVar
        );
        if (result) results.push(result);
      }
    }
  });
  
  return results;
}

function applyFilters(data: ExcelData, filters: Record<string, FilterConfig>): ExcelData {
  if (Object.keys(filters).length === 0) {
    return data;
  }
  
  const filteredRows = data.rows.filter(row => {
    return Object.values(filters).every(filter => {
      const columnIndex = data.headers.indexOf(filter.column);
      if (columnIndex === -1) return true;
      
      const cellValue = String(row[columnIndex] || '').trim().toLowerCase();
      const filterValue = String(filter.value || '').trim().toLowerCase();
      
      switch (filter.operator) {
        case 'equals':
          return cellValue === filterValue;
        case 'not_equals':
          return cellValue !== filterValue;
        case 'contains':
          return cellValue.includes(filterValue);
        case 'not_contains':
          return !cellValue.includes(filterValue);
        case 'greater_than':
          const numValue = Number(cellValue);
          const numFilter = Number(filterValue);
          return !isNaN(numValue) && !isNaN(numFilter) && numValue > numFilter;
        case 'less_than':
          const numValue2 = Number(cellValue);
          const numFilter2 = Number(filterValue);
          return !isNaN(numValue2) && !isNaN(numFilter2) && numValue2 < numFilter2;
        case 'in_range':
          const numValue3 = Number(cellValue);
          const numFilter3 = Number(filterValue);
          const numFilter4 = Number(filter.secondValue || 0);
          return !isNaN(numValue3) && !isNaN(numFilter3) && !isNaN(numFilter4) && 
                 numValue3 >= numFilter3 && numValue3 <= numFilter4;
        default:
          return true;
      }
    });
  });
  
  return {
    ...data,
    rows: filteredRows
  };
}

function createBannerStructure(bannerVars: string[], dataMap: Record<string, any>[]): BannerStructure[] {
  const bannerStructure: BannerStructure[] = [];
  let currentIndex = 1; // Start after Total column
  
  bannerVars.forEach(bannerVar => {
    const question = extractQuestionFromHeader(bannerVar);
    const bannerValues = [...new Set(
      dataMap
        .map(row => String(row[bannerVar] || '').trim())
        .filter(val => val !== '' && val !== 'null' && val !== 'undefined')
    )].sort();
    
    bannerStructure.push({
      question,
      answers: bannerValues,
      startIndex: currentIndex,
      endIndex: currentIndex + bannerValues.length - 1
    });
    
    currentIndex += bannerValues.length;
  });
  
  return bannerStructure;
}

function calculateStatisticalMeasures(
  dataMap: Record<string, any>[],
  tableVar: string,
  bannerVars: string[],
  bannerValuesByVar: { [key: string]: string[] }
): StatisticalMeasures {
  const mean: number[] = [];
  const median: number[] = [];
  const standardDeviation: number[] = [];
  const headers: string[] = ['Total'];
  
  // Add banner headers
  bannerVars.forEach(bannerVar => {
    bannerValuesByVar[bannerVar].forEach(bannerVal => {
      headers.push(bannerVal);
    });
  });
  
  // Calculate for total
  const totalValues = dataMap
    .map(row => Number(row[tableVar]))
    .filter(val => !isNaN(val));
  
  mean.push(calculateMean(totalValues));
  median.push(calculateMedian(totalValues));
  standardDeviation.push(calculateStandardDeviation(totalValues));
  
  // Calculate for each banner group
  bannerVars.forEach(bannerVar => {
    bannerValuesByVar[bannerVar].forEach(bannerVal => {
      const values = dataMap
        .filter(row => String(row[bannerVar] || '').trim() === bannerVal)
        .map(row => Number(row[tableVar]))
        .filter(val => !isNaN(val));
      
      mean.push(calculateMean(values));
      median.push(calculateMedian(values));
      standardDeviation.push(calculateStandardDeviation(values));
    });
  });
  
  return { mean, median, standardDeviation, headers };
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

function createOpenEndedCrossTab(
  dataMap: Record<string, any>[],
  tableVar: string,
  bannerVars: string[],
  allHeaders: string[],
  displayName: string
): CrossTabResult | null {
  const validationErrors: string[] = [];
  
  // Extract all responses
  const allResponses = dataMap
    .map(row => String(row[tableVar] || '').trim())
    .filter(response => response !== '' && response !== 'null' && response !== 'undefined');
  
  if (allResponses.length === 0) {
    validationErrors.push(`No valid responses found for open-ended question: ${tableVar}`);
    return null;
  }
  
  // Create banner structure
  const bannerStructure = createBannerStructure(bannerVars, dataMap);
  
  // Create combined banner headers
  const allBannerHeaders: string[] = ['Total'];
  const bannerValuesByVar: { [key: string]: string[] } = {};
  
  bannerVars.forEach(bannerVar => {
    const bannerValues = [...new Set(
      dataMap
        .map(row => String(row[bannerVar] || '').trim())
        .filter(val => val !== '' && val !== 'null' && val !== 'undefined')
    )].sort();
    
    bannerValuesByVar[bannerVar] = bannerValues;
    bannerValues.forEach(val => {
      allBannerHeaders.push(val);
    });
  });
  
  const absolute: number[][] = [];
  const percentage: string[][] = [];
  const baseValues: number[] = [];
  const rowLabels: string[] = [];
  
  // Calculate base values (respondents who provided responses)
  const totalBase = allResponses.length;
  baseValues.push(totalBase);
  
  // Banner-specific bases
  bannerVars.forEach(bannerVar => {
    const bannerValues = bannerValuesByVar[bannerVar];
    bannerValues.forEach(bannerVal => {
      const base = dataMap.filter(row => {
        const response = String(row[tableVar] || '').trim();
        const bannerValue = String(row[bannerVar] || '').trim();
        return response !== '' && response !== 'null' && response !== 'undefined' &&
               bannerValue === bannerVal;
      }).length;
      baseValues.push(base);
    });
  });
  
  // First, add all full responses
  rowLabels.push('FULL RESPONSES');
  const fullResponsesRow: number[] = [...baseValues];
  const fullResponsesPct: string[] = baseValues.map(() => '100%');
  absolute.push(fullResponsesRow);
  percentage.push(fullResponsesPct);
  
  // Add a separator row
  rowLabels.push('--- THEMATIC ANALYSIS ---');
  const separatorRow: number[] = new Array(baseValues.length).fill(0);
  const separatorPct: string[] = new Array(baseValues.length).fill('');
  absolute.push(separatorRow);
  percentage.push(separatorPct);
  
  // Extract themes from all responses with actual response mapping
  const themesWithResponses = extractThemesWithResponses(allResponses, dataMap, tableVar, bannerVars, bannerValuesByVar);
  
  if (themesWithResponses.length === 0) {
    validationErrors.push(`No themes could be extracted from responses for: ${tableVar}`);
    return null;
  }
  
  // Create cross-tabulation for each theme
  themesWithResponses.forEach(themeData => {
    const absRow: number[] = [];
    const pctRow: string[] = [];
    
    // Total count for this theme
    absRow.push(themeData.count);
    
    // Calculate counts for each banner variable and value
    bannerVars.forEach(bannerVar => {
      const bannerValues = bannerValuesByVar[bannerVar];
      
      bannerValues.forEach(bannerVal => {
        // Count responses in this banner group that match this theme
        const count = themeData.responsesByBanner[bannerVal] ? themeData.responsesByBanner[bannerVal].length : 0;
        absRow.push(count);
      });
    });
    
    // Calculate percentages
    let colIndex = 0;
    
    // Total percentage
    const totalPercentage = totalBase > 0 ? Math.round((themeData.count / totalBase) * 100) : 0;
    pctRow.push(`${totalPercentage}%`);
    colIndex++;
    
    // Banner-specific percentages
    bannerVars.forEach(bannerVar => {
      const bannerValues = bannerValuesByVar[bannerVar];
      
      bannerValues.forEach(bannerVal => {
        const base = baseValues[colIndex];
        const count = absRow[colIndex];
        const percentage = base > 0 ? Math.round((count / base) * 100) : 0;
        pctRow.push(`${percentage}%`);
        colIndex++;
      });
    });
    
    absolute.push(absRow);
    percentage.push(pctRow);
    rowLabels.push(themeData.theme);
  });
  
  // Perform significance testing (excluding separator rows)
  const significanceFlags = performSignificanceTests(absolute, baseValues);
  
  // Create detailed themes with cross-tabulation and full responses
  const openEndedThemes: OpenEndedTheme[] = [
    {
      theme: 'Full Responses',
      count: totalBase,
      percentage: 100,
      samples: allResponses.slice(0, 10), // Show first 10 full responses
      crossTabData: {
        absolute: absolute[0],
        percentage: percentage[0],
        headers: allBannerHeaders
      }
    },
    ...themesWithResponses.map((themeData, index) => ({
      theme: themeData.theme,
      count: themeData.count,
      percentage: Math.round((themeData.count / totalBase) * 100),
      samples: themeData.actualResponses.slice(0, 5), // Show actual verbatim responses
      crossTabData: {
        absolute: absolute[index + 2], // +2 to skip full responses and separator
        percentage: percentage[index + 2],
        headers: allBannerHeaders
      }
    }))
  ];
  
  return {
    name: `${tableVar}_themes_by_${bannerVars.join('_')}`,
    displayName,
    absolute,
    percentage,
    headers: allBannerHeaders,
    rowLabels,
    bannerQuestion: bannerVars.join(' | '),
    bannerAnswers: allBannerHeaders.slice(1),
    questionType: 'open-ended',
    baseValues,
    validationErrors,
    significanceFlags,
    bannerStructure,
    openEndedThemes
  };
}

// New function to extract themes with actual responses
function extractThemesWithResponses(
  responses: string[],
  dataMap: Record<string, any>[],
  tableVar: string,
  bannerVars: string[],
  bannerValuesByVar: { [key: string]: string[] }
): Array<{
  theme: string;
  count: number;
  actualResponses: string[];
  responsesByBanner: { [bannerValue: string]: string[] };
}> {
  const validResponses = responses.filter(r => 
    r && typeof r === 'string' && r.trim().length > 0
  );
  
  if (validResponses.length === 0) return [];
  
  // Enhanced theme keywords with more comprehensive categories
  const themeKeywords = {
    'Price/Cost/Value': [
      'price', 'cost', 'cheap', 'expensive', 'affordable', 'budget', 'money', 'value',
      'worth', 'pricing', 'fee', 'charge', 'rate', 'economical', 'inexpensive'
    ],
    'Quality/Performance': [
      'quality', 'good', 'bad', 'excellent', 'poor', 'high-quality', 'low-quality',
      'performance', 'reliable', 'durable', 'effective', 'efficient', 'superior'
    ],
    'Customer Service': [
      'service', 'staff', 'customer', 'help', 'support', 'friendly', 'rude',
      'assistance', 'representative', 'team', 'personnel', 'helpful', 'professional'
    ],
    'Location/Accessibility': [
      'location', 'close', 'near', 'far', 'convenient', 'accessible', 'parking',
      'distance', 'proximity', 'nearby', 'remote', 'central', 'easy to find'
    ],
    'Product Features': [
      'product', 'feature', 'function', 'design', 'style', 'variety', 'selection',
      'options', 'functionality', 'capability', 'specification', 'attribute'
    ],
    'User Experience': [
      'experience', 'feel', 'atmosphere', 'environment', 'comfortable', 'pleasant',
      'enjoyable', 'satisfaction', 'impression', 'usability', 'interface'
    ],
    'Speed/Efficiency': [
      'time', 'fast', 'slow', 'quick', 'wait', 'delay', 'speed', 'efficient',
      'prompt', 'rapid', 'immediate', 'timely', 'responsive'
    ],
    'Recommendation/Loyalty': [
      'recommend', 'suggest', 'refer', 'tell', 'friends', 'family',
      'loyalty', 'trust', 'confidence', 'satisfaction', 'repeat'
    ],
    'Communication': [
      'communication', 'information', 'clear', 'confusing', 'explanation',
      'instructions', 'guidance', 'feedback', 'response', 'contact'
    ],
    'Convenience/Ease': [
      'convenient', 'easy', 'simple', 'straightforward', 'hassle',
      'complicated', 'difficult', 'user-friendly', 'intuitive'
    ]
  };
  
  const themes: { [key: string]: { 
    count: number; 
    actualResponses: string[];
    responsesByBanner: { [bannerValue: string]: string[] };
  } } = {};
  
  // Initialize themes
  Object.keys(themeKeywords).forEach(theme => {
    themes[theme] = { 
      count: 0, 
      actualResponses: [],
      responsesByBanner: {}
    };
    
    // Initialize banner response arrays
    bannerVars.forEach(bannerVar => {
      bannerValuesByVar[bannerVar].forEach(bannerVal => {
        themes[theme].responsesByBanner[bannerVal] = [];
      });
    });
  });
  
  // Add "Other" theme
  themes['Other'] = { 
    count: 0, 
    actualResponses: [],
    responsesByBanner: {}
  };
  bannerVars.forEach(bannerVar => {
    bannerValuesByVar[bannerVar].forEach(bannerVal => {
      themes['Other'].responsesByBanner[bannerVal] = [];
    });
  });
  
  // Categorize responses with improved matching
  dataMap.forEach(row => {
    const response = String(row[tableVar] || '').trim();
    if (!response || response === 'null' || response === 'undefined') return;
    
    const lowerResponse = response.toLowerCase();
    let categorized = false;
    let bestMatch = '';
    let maxMatches = 0;
    
    // Find the theme with the most keyword matches
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const matches = keywords.filter(keyword => lowerResponse.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = theme;
      }
    }
    
    // Only categorize if we found at least one keyword match
    if (maxMatches > 0) {
      themes[bestMatch].count++;
      themes[bestMatch].actualResponses.push(response);
      
      // Add to banner-specific responses
      bannerVars.forEach(bannerVar => {
        const bannerValue = String(row[bannerVar] || '').trim();
        if (bannerValue && bannerValuesByVar[bannerVar].includes(bannerValue)) {
          themes[bestMatch].responsesByBanner[bannerValue].push(response);
        }
      });
      
      categorized = true;
    }
    
    // If not categorized, add to 'Other'
    if (!categorized) {
      themes['Other'].count++;
      themes['Other'].actualResponses.push(response);
      
      // Add to banner-specific responses
      bannerVars.forEach(bannerVar => {
        const bannerValue = String(row[bannerVar] || '').trim();
        if (bannerValue && bannerValuesByVar[bannerVar].includes(bannerValue)) {
          themes['Other'].responsesByBanner[bannerValue].push(response);
        }
      });
    }
  });
  
  // Convert to array and filter out empty themes
  return Object.entries(themes)
    .filter(([_, data]) => data.count > 0)
    .map(([theme, data]) => ({
      theme,
      count: data.count,
      actualResponses: data.actualResponses,
      responsesByBanner: data.responsesByBanner
    }))
    .sort((a, b) => b.count - a.count);
}

function createRankQuestionCrossTab(
  dataMap: Record<string, any>[],
  questionName: string,
  bannerVars: string[],
  rankStructure: any,
  allHeaders: string[],
  displayName: string
): CrossTabResult | null {
  const validationErrors: string[] = [];
  
  // Create banner structure
  const bannerStructure = createBannerStructure(bannerVars, dataMap);
  
  // Create combined banner headers
  const allBannerHeaders: string[] = ['Total'];
  const bannerValuesByVar: { [key: string]: string[] } = {};
  
  bannerVars.forEach(bannerVar => {
    const bannerValues = [...new Set(
      dataMap
        .map(row => String(row[bannerVar] || '').trim())
        .filter(val => val !== '' && val !== 'null' && val !== 'undefined')
    )].sort();
    
    bannerValuesByVar[bannerVar] = bannerValues;
    bannerValues.forEach(val => {
      allBannerHeaders.push(val);
    });
  });
  
  // Calculate base values (respondents who provided any ranking)
  const allRankColumns = [
    ...rankStructure.columnMapping.rank1Columns,
    ...rankStructure.columnMapping.rank2Columns,
    ...rankStructure.columnMapping.rank3Columns
  ].filter(col => col);
  
  const totalBase = dataMap.filter(row => {
    return allRankColumns.some(col => {
      const value = String(row[col] || '').trim();
      return value !== '' && value !== '0' && value !== 'null' && value !== 'undefined';
    });
  }).length;
  
  const baseValues: number[] = [totalBase];
  
  // Banner-specific bases
  bannerVars.forEach(bannerVar => {
    const bannerValues = bannerValuesByVar[bannerVar];
    bannerValues.forEach(bannerVal => {
      const base = dataMap.filter(row => {
        const matchesBanner = String(row[bannerVar] || '').trim() === bannerVal;
        const hasAnyRanking = allRankColumns.some(col => {
          const value = String(row[col] || '').trim();
          return value !== '' && value !== '0' && value !== 'null' && value !== 'undefined';
        });
        return matchesBanner && hasAnyRanking;
      }).length;
      baseValues.push(base);
    });
  });
  
  // Generate ranking calculations
  const rankingCalculations = createRankingCrossTab(
    dataMap,
    rankStructure,
    bannerVars,
    bannerValuesByVar,
    baseValues
  );
  
  // Create the main cross-tabulation matrix
  const absolute: number[][] = [];
  const percentage: string[][] = [];
  const rowLabels: string[] = [];
  
  // Add rows for each ranking combination
  const rankingTypes = [
    { label: 'Rank 1 Only', data: rankingCalculations.rank1Only },
    { label: 'Rank 2 Only', data: rankingCalculations.rank2Only },
    { label: 'Rank 3 Only', data: rankingCalculations.rank3Only },
    { label: 'Rank 1 + 2', data: rankingCalculations.rank1Plus2 },
    { label: 'Rank 1 + 2 + 3', data: rankingCalculations.rank1Plus2Plus3 }
  ];
  
  rankingTypes.forEach(rankType => {
    if (rankType.data.length > 0) {
      // Add section header
      rowLabels.push(`--- ${rankType.label.toUpperCase()} ---`);
      const separatorRow: number[] = new Array(baseValues.length).fill(0);
      const separatorPct: string[] = new Array(baseValues.length).fill('');
      absolute.push(separatorRow);
      percentage.push(separatorPct);
      
      // Add data rows for each option
      rankType.data.forEach((row, optionIndex) => {
        const optionName = rankingCalculations.rankOptions[optionIndex] || `Option ${optionIndex + 1}`;
        rowLabels.push(optionName);
        
        // Convert percentages to absolute numbers for display
        const absRow = row.map((pct, colIndex) => {
          const base = baseValues[colIndex];
          return Math.round((pct * base) / 100);
        });
        
        const pctRow = row.map(pct => `${pct}%`);
        
        absolute.push(absRow);
        percentage.push(pctRow);
      });
    }
  });
  
  // Perform significance testing
  const significanceFlags = performSignificanceTests(absolute, baseValues);
  
  if (totalBase === 0) {
    validationErrors.push(`No respondents found who provided rankings for: ${questionName}`);
  }
  
  return {
    name: `${questionName}_ranking_by_${bannerVars.join('_')}`,
    displayName,
    absolute,
    percentage,
    headers: allBannerHeaders,
    rowLabels,
    bannerQuestion: bannerVars.join(' | '),
    bannerAnswers: allBannerHeaders.slice(1),
    questionType: 'ranking',
    baseValues,
    validationErrors,
    significanceFlags,
    bannerStructure,
    rankingCalculations
  };
}

function createRegularCrossTab(
  dataMap: Record<string, any>[],
  tableVar: string,
  bannerVars: string[],
  questionType: QuestionType,
  allHeaders: string[],
  displayName: string
): CrossTabResult | null {
  const validationErrors: string[] = [];
  
  // Handle open-ended questions differently
  if (questionType === 'open-ended') {
    return createOpenEndedCrossTab(dataMap, tableVar, bannerVars, allHeaders, displayName);
  }
  
  // Get unique values for table variable, excluding empty/null values
  const tableValues = [...new Set(
    dataMap
      .map(row => String(row[tableVar] || '').trim())
      .filter(val => val !== '' && val !== 'null' && val !== 'undefined')
  )].sort();
  
  if (tableValues.length === 0) {
    validationErrors.push(`No valid data found for variable: ${tableVar}`);
    return null;
  }
  
  // Create banner structure
  const bannerStructure = createBannerStructure(bannerVars, dataMap);
  
  // Create combined banner headers
  const allBannerHeaders: string[] = ['Total'];
  const bannerValuesByVar: { [key: string]: string[] } = {};
  
  bannerVars.forEach(bannerVar => {
    const bannerValues = [...new Set(
      dataMap
        .map(row => String(row[bannerVar] || '').trim())
        .filter(val => val !== '' && val !== 'null' && val !== 'undefined')
    )].sort();
    
    bannerValuesByVar[bannerVar] = bannerValues;
    bannerValues.forEach(val => {
      allBannerHeaders.push(val);
    });
  });
  
  const absolute: number[][] = [];
  const percentage: string[][] = [];
  const baseValues: number[] = [];
  
  // Calculate base values for each banner column
  const totalBase = dataMap.filter(row => {
    const val = String(row[tableVar] || '').trim();
    return val !== '' && val !== 'null' && val !== 'undefined';
  }).length;
  baseValues.push(totalBase);
  
  // Banner-specific bases
  bannerVars.forEach(bannerVar => {
    const bannerValues = bannerValuesByVar[bannerVar];
    bannerValues.forEach(bannerVal => {
      const base = dataMap.filter(row => {
        const tableVal = String(row[tableVar] || '').trim();
        const bannerValue = String(row[bannerVar] || '').trim();
        return tableVal !== '' && tableVal !== 'null' && tableVal !== 'undefined' &&
               bannerValue === bannerVal;
      }).length;
      baseValues.push(base);
    });
  });
  
  // Create cross-tabulation matrix
  tableValues.forEach(tableVal => {
    const absRow: number[] = [];
    const pctRow: string[] = [];
    
    // Total count for this table value
    const totalCount = dataMap.filter(row => 
      String(row[tableVar] || '').trim() === tableVal
    ).length;
    absRow.push(totalCount);
    
    // Calculate counts for each banner variable and value
    bannerVars.forEach(bannerVar => {
      const bannerValues = bannerValuesByVar[bannerVar];
      
      bannerValues.forEach(bannerVal => {
        const count = dataMap.filter(row => 
          String(row[tableVar] || '').trim() === tableVal &&
          String(row[bannerVar] || '').trim() === bannerVal
        ).length;
        
        absRow.push(count);
      });
    });
    
    // Calculate percentages
    let colIndex = 0;
    
    // Total percentage
    const totalPercentage = totalBase > 0 ? Math.round((totalCount / totalBase) * 100) : 0;
    pctRow.push(`${totalPercentage}%`);
    colIndex++;
    
    // Banner-specific percentages
    bannerVars.forEach(bannerVar => {
      const bannerValues = bannerValuesByVar[bannerVar];
      
      bannerValues.forEach(bannerVal => {
        const base = baseValues[colIndex];
        const count = absRow[colIndex];
        const percentage = base > 0 ? Math.round((count / base) * 100) : 0;
        pctRow.push(`${percentage}%`);
        colIndex++;
      });
    });
    
    absolute.push(absRow);
    percentage.push(pctRow);
  });
  
  // Add totals row
  const totalsAbs: number[] = [...baseValues];
  const totalsPct: string[] = baseValues.map(() => '100%');
  
  absolute.push(totalsAbs);
  percentage.push(totalsPct);
  
  // Perform significance testing
  const significanceFlags = performSignificanceTests(absolute, baseValues);
  
  // Calculate statistical measures for numeric/scale questions
  let statisticalMeasures: StatisticalMeasures | undefined;
  if (questionType === 'numeric' || questionType === 'scale') {
    statisticalMeasures = calculateStatisticalMeasures(dataMap, tableVar, bannerVars, bannerValuesByVar);
  }
  
  // Handle scale calculations with enhanced box analysis
  let scaleCalculations: ScaleCalculations | undefined;
  if (questionType === 'scale') {
    const allValues = dataMap.map(row => row[tableVar]).filter(v => v !== '' && v != null);
    const scaleRange = detectScaleRange(allValues);
    if (scaleRange) {
      scaleCalculations = calculateEnhancedScaleBoxes(dataMap, tableVar, bannerVars, bannerValuesByVar, scaleRange, baseValues);
    }
  }
  
  // Handle ranking calculations
  let rankingCalculations: RankingCalculations | undefined;
  if (questionType === 'ranking') {
    rankingCalculations = calculateRankingBoxes(dataMap, tableVar, bannerVars, bannerValuesByVar, baseValues);
  }
  
  // Enhanced validation for different question types
  if (questionType === 'single-choice' || questionType === 'binary') {
    for (let colIndex = 0; colIndex < allBannerHeaders.length; colIndex++) {
      let sum = 0;
      for (let rowIndex = 0; rowIndex < tableValues.length; rowIndex++) {
        const pctStr = percentage[rowIndex][colIndex];
        const pct = parseInt(pctStr.replace('%', ''));
        sum += pct;
      }
      
      if (Math.abs(sum - 100) > 5) {
        validationErrors.push(
          `Column "${allBannerHeaders[colIndex]}" percentages sum to ${sum}% instead of 100%. This may indicate data quality issues.`
        );
      }
    }
  }
  
  return {
    name: `${tableVar}_by_${bannerVars.join('_')}`,
    displayName,
    absolute,
    percentage,
    headers: allBannerHeaders,
    rowLabels: [...tableValues, 'Total'],
    bannerQuestion: bannerVars.join(' | '),
    bannerAnswers: allBannerHeaders.slice(1),
    questionType,
    baseValues,
    validationErrors,
    significanceFlags,
    bannerStructure,
    scaleCalculations,
    rankingCalculations,
    statisticalMeasures
  };
}

function createMultiSelectCrossTab(
  dataMap: Record<string, any>[],
  groupName: string,
  bannerVars: string[],
  multiSelectCols: string[],
  allHeaders: string[],
  displayName: string
): CrossTabResult | null {
  const validationErrors: string[] = [];
  
  // Create banner structure
  const bannerStructure = createBannerStructure(bannerVars, dataMap);
  
  // Create combined banner headers
  const allBannerHeaders: string[] = ['Total'];
  const bannerValuesByVar: { [key: string]: string[] } = {};
  
  bannerVars.forEach(bannerVar => {
    const bannerValues = [...new Set(
      dataMap
        .map(row => String(row[bannerVar] || '').trim())
        .filter(val => val !== '' && val !== 'null' && val !== 'undefined')
    )].sort();
    
    bannerValuesByVar[bannerVar] = bannerValues;
    bannerValues.forEach(val => {
      allBannerHeaders.push(val);
    });
  });
  
  const absolute: number[][] = [];
  const percentage: string[][] = [];
  const rowLabels: string[] = [];
  const baseValues: number[] = [];
  
  // Helper function to check if a value indicates selection
  const isSelected = (value: any): boolean => {
    const cellValue = String(value || '').trim().toLowerCase();
    return cellValue !== '' && 
           cellValue !== '0' && 
           cellValue !== 'no' && 
           cellValue !== 'false' &&
           cellValue !== 'n/a' &&
           cellValue !== 'na' &&
           cellValue !== 'null' &&
           cellValue !== 'undefined';
  };
  
  // Calculate base values (respondents who answered any option in the multi-select group)
  const totalBase = dataMap.filter(row => {
    return multiSelectCols.some(col => isSelected(row[col]));
  }).length;
  baseValues.push(totalBase);
  
  // Banner-specific bases
  bannerVars.forEach(bannerVar => {
    const bannerValues = bannerValuesByVar[bannerVar];
    bannerValues.forEach(bannerVal => {
      const base = dataMap.filter(row => {
        const matchesBanner = String(row[bannerVar] || '').trim() === bannerVal;
        const hasAnySelection = multiSelectCols.some(col => isSelected(row[col]));
        return matchesBanner && hasAnySelection;
      }).length;
      baseValues.push(base);
    });
  });
  
  // Remove shared prefix from option labels for better readability
  const cleanedOptions = removeSharedPrefix(multiSelectCols);
  
  // For each column in the multi-select group, create a row
  multiSelectCols.forEach((col, index) => {
    if (!dataMap[0].hasOwnProperty(col)) return;
    
    const absRow: number[] = [];
    const pctRow: string[] = [];
    
    // Total count for this option
    const totalCount = dataMap.filter(row => isSelected(row[col])).length;
    absRow.push(totalCount);
    
    // Calculate counts for each banner variable and value
    bannerVars.forEach(bannerVar => {
      const bannerValues = bannerValuesByVar[bannerVar];
      
      bannerValues.forEach(bannerVal => {
        const count = dataMap.filter(row => {
          const isOptionSelected = isSelected(row[col]);
          const matchesBanner = String(row[bannerVar] || '').trim() === bannerVal;
          return isOptionSelected && matchesBanner;
        }).length;
        
        absRow.push(count);
      });
    });
    
    // Calculate percentages based on bases
    let colIndex = 0;
    
    // Total percentage
    const totalPercentage = totalBase > 0 ? Math.round((totalCount / totalBase) * 100) : 0;
    pctRow.push(`${totalPercentage}%`);
    colIndex++;
    
    // Banner-specific percentages
    bannerVars.forEach(bannerVar => {
      const bannerValues = bannerValuesByVar[bannerVar];
      
      bannerValues.forEach(bannerVal => {
        const base = baseValues[colIndex];
        const count = absRow[colIndex];
        const percentage = base > 0 ? Math.round((count / base) * 100) : 0;
        pctRow.push(`${percentage}%`);
        colIndex++;
      });
    });
    
    absolute.push(absRow);
    percentage.push(pctRow);
    
    // Use cleaned option name
    rowLabels.push(cleanedOptions[index]);
  });
  
  // Add NET row (total unique respondents who selected any option)
  const netAbsRow: number[] = [...baseValues];
  const netPctRow: string[] = baseValues.map(() => '100%');
  
  absolute.push(netAbsRow);
  percentage.push(netPctRow);
  rowLabels.push('NET: Any Response');
  
  // Perform significance testing
  const significanceFlags = performSignificanceTests(absolute, baseValues);
  
  if (totalBase === 0) {
    validationErrors.push(`No respondents found who answered any option in multi-select group: ${groupName}`);
  }
  
  return {
    name: `${groupName}_by_${bannerVars.join('_')}`,
    displayName,
    absolute,
    percentage,
    headers: allBannerHeaders,
    rowLabels,
    bannerQuestion: bannerVars.join(' | '),
    bannerAnswers: allBannerHeaders.slice(1),
    questionType: 'multiple-choice',
    baseValues,
    validationErrors,
    significanceFlags,
    bannerStructure
  };
}

function createCustomVariableCrossTab(
  dataMap: Record<string, any>[],
  variableName: string,
  bannerVars: string[],
  customVariable: any,
  allHeaders: string[],
  displayName: string
): CrossTabResult | null {
  // Implementation for custom variables would go here
  // This is a placeholder for the custom variable functionality
  return null;
}

function calculateEnhancedScaleBoxes(
  dataMap: Record<string, any>[],
  tableVar: string,
  bannerVars: string[],
  bannerValuesByVar: { [key: string]: string[] },
  scaleRange: { min: number; max: number },
  baseValues: number[]
): ScaleCalculations {
  const { min, max } = scaleRange;
  const scaleLength = max - min + 1;
  
  const topBox: number[][] = [];
  const bottomBox: number[][] = [];
  const top2Box: number[][] = [];
  const bottom2Box: number[][] = [];
  let top3Box: number[][] | undefined;
  let bottom3Box: number[][] | undefined;
  
  // Only calculate 3-box if scale is long enough
  if (scaleLength >= 6) {
    top3Box = [];
    bottom3Box = [];
  }
  
  // Calculate for each banner column
  for (let colIndex = 0; colIndex < baseValues.length; colIndex++) {
    const topBoxCount = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [max]);
    const bottomBoxCount = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [min]);
    const top2BoxCount = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [max - 1, max]);
    const bottom2BoxCount = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [min, min + 1]);
    
    // Calculate percentages
    const base = baseValues[colIndex];
    const topBoxPct = base > 0 ? Math.round((topBoxCount / base) * 100) : 0;
    const bottomBoxPct = base > 0 ? Math.round((bottomBoxCount / base) * 100) : 0;
    const top2BoxPct = base > 0 ? Math.round((top2BoxCount / base) * 100) : 0;
    const bottom2BoxPct = base > 0 ? Math.round((bottom2BoxCount / base) * 100) : 0;
    
    topBox.push([topBoxPct]);
    bottomBox.push([bottomBoxPct]);
    top2Box.push([top2BoxPct]);
    bottom2Box.push([bottom2BoxPct]);
    
    if (top3Box && bottom3Box && scaleLength >= 6) {
      const top3BoxCount = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [max - 2, max - 1, max]);
      const bottom3BoxCount = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [min, min + 1, min + 2]);
      const top3BoxPct = base > 0 ? Math.round((top3BoxCount / base) * 100) : 0;
      const bottom3BoxPct = base > 0 ? Math.round((bottom3BoxCount / base) * 100) : 0;
      
      top3Box.push([top3BoxPct]);
      bottom3Box.push([bottom3BoxPct]);
    }
  }
  
  return {
    topBox,
    bottomBox,
    top2Box,
    bottom2Box,
    top3Box,
    bottom3Box,
    scaleRange
  };
}

function calculateRankingBoxes(
  dataMap: Record<string, any>[],
  tableVar: string,
  bannerVars: string[],
  bannerValuesByVar: { [key: string]: string[] },
  baseValues: number[]
): RankingCalculations {
  const rank1: number[][] = [];
  const rank2: number[][] = [];
  const rank3: number[][] = [];
  const rank1Plus2: number[][] = [];
  const rank1Plus2Plus3: number[][] = [];
  
  // Calculate for each banner column
  for (let colIndex = 0; colIndex < baseValues.length; colIndex++) {
    const rank1Count = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [1]);
    const rank2Count = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [2]);
    const rank3Count = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [3]);
    const rank1Plus2Count = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [1, 2]);
    const rank1Plus2Plus3Count = calculateBoxCount(dataMap, tableVar, bannerVars, bannerValuesByVar, colIndex, [1, 2, 3]);
    
    // Calculate percentages
    const base = baseValues[colIndex];
    const rank1Pct = base > 0 ? Math.round((rank1Count / base) * 100) : 0;
    const rank2Pct = base > 0 ? Math.round((rank2Count / base) * 100) : 0;
    const rank3Pct = base > 0 ? Math.round((rank3Count / base) * 100) : 0;
    const rank1Plus2Pct = base > 0 ? Math.round((rank1Plus2Count / base) * 100) : 0;
    const rank1Plus2Plus3Pct = base > 0 ? Math.round((rank1Plus2Plus3Count / base) * 100) : 0;
    
    rank1.push([rank1Pct]);
    rank2.push([rank2Pct]);
    rank3.push([rank3Pct]);
    rank1Plus2.push([rank1Plus2Pct]);
    rank1Plus2Plus3.push([rank1Plus2Plus3Pct]);
  }
  
  return {
    rank1,
    rank2,
    rank3,
    rank1Plus2,
    rank1Plus2Plus3
  };
}

function calculateBoxCount(
  dataMap: Record<string, any>[],
  tableVar: string,
  bannerVars: string[],
  bannerValuesByVar: { [key: string]: string[] },
  colIndex: number,
  targetValues: number[]
): number {
  if (colIndex === 0) {
    // Total column
    return dataMap.filter(row => {
      const value = Number(row[tableVar]);
      return !isNaN(value) && targetValues.includes(value);
    }).length;
  } else {
    // Banner-specific column
    let currentIndex = 1;
    for (const bannerVar of bannerVars) {
      const bannerValues = bannerValuesByVar[bannerVar];
      for (const bannerVal of bannerValues) {
        if (currentIndex === colIndex) {
          return dataMap.filter(row => {
            const value = Number(row[tableVar]);
            const bannerValue = String(row[bannerVar] || '').trim();
            return !isNaN(value) && targetValues.includes(value) && bannerValue === bannerVal;
          }).length;
        }
        currentIndex++;
      }
    }
  }
  
  return 0;
}

// Legacy export function for backward compatibility
export function exportToExcel(results: CrossTabResult[], fileName: string): void {
  // Import the new function to avoid circular dependency
  const { exportToExcelWithIndex } = require('./excelExporter');
  exportToExcelWithIndex(results, fileName);
}