// Automatic multi-select question detection utilities

export interface DetectedMultiSelectGroup {
  questionRoot: string;
  columns: string[];
  confidence: number;
  analysisDetails?: {
    structureScore: number;
    responseScore: number;
    keywordScore: number;
    reasoningText: string;
  };
}

export function detectMultiSelectQuestions(headers: string[], dataRows?: any[][]): DetectedMultiSelectGroup[] {
  const groups: { [key: string]: string[] } = {};
  const questionRoots: { [key: string]: string } = {};
  
  headers.forEach(header => {
    const questionRoot = extractQuestionRoot(header);
    if (questionRoot && questionRoot.length > 10) { // Minimum length for meaningful questions
      if (!groups[questionRoot]) {
        groups[questionRoot] = [];
        questionRoots[questionRoot] = questionRoot;
      }
      groups[questionRoot].push(header);
    }
  });
  
  // Filter groups that have multiple columns (potential multi-select)
  const detectedGroups: DetectedMultiSelectGroup[] = [];
  
  Object.entries(groups).forEach(([questionRoot, columns]) => {
    if (columns.length >= 2) {
      // Enhanced confidence calculation with data analysis
      const analysis = analyzeMultiSelectConfidence(questionRoot, columns, headers, dataRows);
      
      detectedGroups.push({
        questionRoot,
        columns,
        confidence: analysis.confidence,
        analysisDetails: analysis.details
      });
    }
  });
  
  // Sort by confidence (highest first)
  return detectedGroups.sort((a, b) => b.confidence - a.confidence);
}

export function analyzeMultiSelectConfidence(
  questionRoot: string,
  columns: string[],
  allHeaders: string[],
  dataRows?: any[][]
): { confidence: number; details: any } {
  let structureScore = 0.3; // Base score
  let responseScore = 0;
  let keywordScore = 0;
  let reasoningParts: string[] = [];

  // 1. Structure Analysis
  if (hasConsistentStructure(columns)) {
    structureScore += 0.2;
    reasoningParts.push('consistent column structure');
  }

  if (hasTypicalMultiSelectOptions(columns)) {
    structureScore += 0.15;
    reasoningParts.push('typical multi-select option patterns');
  }

  // 2. Keyword Analysis
  if (containsMultiSelectKeywords(questionRoot)) {
    keywordScore = 0.25;
    reasoningParts.push('multi-select keywords in question');
  }

  // 3. Response Data Analysis (if available)
  if (dataRows && dataRows.length > 0) {
    const responseAnalysis = analyzeResponsePatterns(columns, allHeaders, dataRows);
    responseScore = responseAnalysis.score;
    
    if (responseAnalysis.isFlagPattern) {
      reasoningParts.push('flag-based responses (1/0, Yes/No)');
    }
    if (responseAnalysis.matchesHeaders) {
      reasoningParts.push('responses match header options');
    }
    if (responseAnalysis.isRatingScale) {
      responseScore = Math.max(0, responseScore - 0.4); // Penalize rating scales
      reasoningParts.push('appears to be rating scale (reduced confidence)');
    }
  }

  const totalConfidence = Math.min(structureScore + responseScore + keywordScore, 1.0);
  
  return {
    confidence: totalConfidence,
    details: {
      structureScore,
      responseScore,
      keywordScore,
      reasoningText: reasoningParts.join(', ')
    }
  };
}

function analyzeResponsePatterns(
  columns: string[],
  allHeaders: string[],
  dataRows: any[][]
): { score: number; isFlagPattern: boolean; matchesHeaders: boolean; isRatingScale: boolean } {
  let flagPatternCount = 0;
  let headerMatchCount = 0;
  let ratingScaleCount = 0;
  let totalCells = 0;

  columns.forEach(column => {
    const columnIndex = allHeaders.indexOf(column);
    if (columnIndex === -1) return;

    // Sample up to 50 rows for analysis
    const sampleRows = dataRows.slice(0, Math.min(50, dataRows.length));
    
    sampleRows.forEach(row => {
      const cellValue = String(row[columnIndex] || '').trim().toLowerCase();
      if (!cellValue || cellValue === 'null' || cellValue === 'undefined') return;
      
      totalCells++;
      
      // Check for flag patterns
      if (['1', '0', 'yes', 'no', 'true', 'false', 'x', 'checked', 'selected'].includes(cellValue)) {
        flagPatternCount++;
      }
      
      // Check if response matches header option
      const headerOption = extractOptionFromHeader(column).toLowerCase();
      if (headerOption && cellValue.includes(headerOption)) {
        headerMatchCount++;
      }
      
      // Check for rating scale patterns
      const numValue = Number(cellValue);
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
        ratingScaleCount++;
      }
    });
  });

  if (totalCells === 0) {
    return { score: 0, isFlagPattern: false, matchesHeaders: false, isRatingScale: false };
  }

  const flagRatio = flagPatternCount / totalCells;
  const headerMatchRatio = headerMatchCount / totalCells;
  const ratingRatio = ratingScaleCount / totalCells;

  // Calculate score based on patterns
  let score = 0;
  
  if (flagRatio > 0.6) score += 0.3; // Strong flag pattern
  else if (flagRatio > 0.3) score += 0.15; // Moderate flag pattern
  
  if (headerMatchRatio > 0.4) score += 0.2; // Good header matching
  else if (headerMatchRatio > 0.2) score += 0.1; // Some header matching

  return {
    score,
    isFlagPattern: flagRatio > 0.5,
    matchesHeaders: headerMatchRatio > 0.3,
    isRatingScale: ratingRatio > 0.6
  };
}

function extractOptionFromHeader(header: string): string {
  // Extract option text from header (after delimiters)
  const delimiters = [' - ', ' – ', ' — ', ': ', ' | ', ' ; ', ') ', '} '];
  
  let cleanHeader = header.trim();
  
  for (const delimiter of delimiters) {
    if (cleanHeader.includes(delimiter)) {
      const parts = cleanHeader.split(delimiter);
      cleanHeader = parts[parts.length - 1].trim();
    }
  }
  
  return cleanHeader;
}
function extractQuestionRoot(header: string): string {
  // Common patterns for multi-select questions
  const patterns = [
    // "Q6. Question text - Option"
    /^(.+?)\s*[-–—]\s*.+$/,
    // "Question text: Option"
    /^(.+?):\s*.+$/,
    // "Question text | Option"
    /^(.+?)\|\s*.+$/,
    // "Question text (Option)"
    /^(.+?)\s*\(.+\)$/,
    // "Question text; Option"
    /^(.+?);\s*.+$/,
    // "Question text, Option"
    /^(.+?),\s*.+$/
  ];
  
  for (const pattern of patterns) {
    const match = header.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // If no pattern matches, try to find common prefixes
  return header.split(/\s+/).slice(0, 5).join(' '); // Take first 5 words as potential root
}

function hasConsistentStructure(columns: string[]): boolean {
  if (columns.length < 2) return false;
  
  // Check if all columns have similar delimiters
  const delimiters = ['-', '–', '—', ':', '|', ';', '(', ')'];
  
  for (const delimiter of delimiters) {
    const hasDelimiter = columns.map(col => col.includes(delimiter));
    const allHave = hasDelimiter.every(has => has);
    const noneHave = hasDelimiter.every(has => !has);
    
    if (allHave && !noneHave) return true;
  }
  
  return false;
}

function containsMultiSelectKeywords(questionText: string): boolean {
  const keywords = [
    'select all', 'choose all', 'check all', 'mark all',
    'which of the following', 'what factors', 'what reasons',
    'what types', 'what kinds', 'what sources', 'what methods',
    'platforms', 'channels', 'options', 'features'
  ];
  
  const lowerText = questionText.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
}

function hasTypicalMultiSelectOptions(columns: string[]): boolean {
  // Extract option parts from columns
  const options = columns.map(col => {
    const delimiters = [' - ', ' – ', ' — ', ': ', ' | ', ' ; '];
    for (const delimiter of delimiters) {
      if (col.includes(delimiter)) {
        return col.split(delimiter).pop()?.trim() || '';
      }
    }
    return col;
  });
  
  // Check if options look like typical multi-select choices
  const typicalPatterns = [
    /^(option|choice|item)\s*\d+/i,
    /^[a-z]\)\s*/i, // a) b) c) format
    /^\d+\.\s*/,    // 1. 2. 3. format
    /^(yes|no|true|false|agree|disagree)/i
  ];
  
  const matchingOptions = options.filter(option => 
    typicalPatterns.some(pattern => pattern.test(option))
  );
  
  return matchingOptions.length >= 2;
}