import { QuestionType } from '../types';

export interface QuestionTypeAnalysis {
  type: QuestionType;
  confidence: number;
  reasoning: string;
}

export function analyzeQuestionType(
  header: string,
  values: any[],
  sampleSize: number = 100
): QuestionTypeAnalysis {
  // Clean and filter values
  const cleanValues = values
    .map(v => String(v || '').trim())
    .filter(v => v !== '' && v !== 'null' && v !== 'undefined' && v !== 'N/A' && v !== 'n/a')
    .slice(0, sampleSize); // Limit sample size for performance

  if (cleanValues.length === 0) {
    return { type: 'single-choice', confidence: 0.1, reasoning: 'No valid data found' };
  }

  const uniqueValues = [...new Set(cleanValues)];
  const uniqueCount = uniqueValues.length;
  const totalCount = cleanValues.length;
  const uniqueRatio = uniqueCount / totalCount;

  // Header analysis
  const lowerHeader = header.toLowerCase();
  
  // 1. Date/Time Detection (HIGHEST PRIORITY - check before open-ended)
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or MM/DD/YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{2}:\d{2}(:\d{2})?$/, // HH:MM or HH:MM:SS
    /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/, // YYYY-MM-DD HH:MM:SS
    /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}(:\d{2})?$/, // MM/DD/YYYY HH:MM:SS
  ];
  
  const dateKeywords = ['date', 'time', 'when', 'timestamp', 'created', 'updated', 'birth', 'start', 'end', 'schedule'];
  const hasDateKeywords = dateKeywords.some(keyword => lowerHeader.includes(keyword));
  
  const dateMatches = cleanValues.filter(v => {
    // Check patterns first
    if (datePatterns.some(pattern => pattern.test(v))) return true;
    
    // Check if it's a valid date
    const dateObj = new Date(v);
    if (!isNaN(dateObj.getTime())) {
      // Additional validation: reasonable date range
      const year = dateObj.getFullYear();
      return year >= 1900 && year <= 2100;
    }
    
    return false;
  });
  
  // Strong date detection criteria
  if (dateMatches.length > totalCount * 0.6 && (hasDateKeywords || uniqueRatio > 0.7)) {
    const confidence = hasDateKeywords ? 0.95 : 0.8;
    return { 
      type: 'date', 
      confidence, 
      reasoning: `${dateMatches.length}/${totalCount} values match date/time patterns${hasDateKeywords ? ' with date keywords' : ''}` 
    };
  }

  // 2. Binary Detection (high priority)
  if (uniqueCount === 2) {
    const binaryPatterns = [
      ['yes', 'no'], ['y', 'n'], ['true', 'false'], ['1', '0'],
      ['male', 'female'], ['agree', 'disagree'], ['pass', 'fail'],
      ['on', 'off'], ['enabled', 'disabled'], ['active', 'inactive']
    ];
    
    const lowerValues = uniqueValues.map(v => v.toLowerCase());
    const isBinary = binaryPatterns.some(pattern => 
      pattern.every(p => lowerValues.includes(p))
    );
    
    if (isBinary || lowerHeader.includes('yes/no') || lowerHeader.includes('true/false')) {
      return { type: 'binary', confidence: 0.95, reasoning: 'Two distinct values matching binary patterns' };
    }
  }

  // 3. Scale Detection
  const numericValues = cleanValues
    .map(v => Number(v))
    .filter(v => !isNaN(v) && Number.isInteger(v));
  
  if (numericValues.length > totalCount * 0.8) { // 80% numeric
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const range = max - min;
    
    // Scale indicators in header
    const scaleKeywords = [
      'rate', 'rating', 'scale', 'score', 'satisfaction', 'likely', 'likelihood',
      'agree', 'important', 'quality', 'recommend', 'how much', 'extent',
      'strongly', 'somewhat', 'very', 'extremely', 'not at all'
    ];
    
    const hasScaleKeywords = scaleKeywords.some(keyword => lowerHeader.includes(keyword));
    
    // Typical scale ranges
    const isTypicalScale = (
      (min === 1 && max <= 10 && range <= 9) || // 1-5, 1-7, 1-10 scales
      (min === 0 && max <= 10 && range <= 10)   // 0-5, 0-10 scales
    );
    
    if (isTypicalScale && (hasScaleKeywords || uniqueCount <= 11)) {
      const confidence = hasScaleKeywords ? 0.9 : 0.75;
      return { 
        type: 'scale', 
        confidence, 
        reasoning: `Numeric range ${min}-${max} with ${hasScaleKeywords ? 'scale keywords' : 'limited unique values'}` 
      };
    }
  }

  // 4. Numeric Detection (but not scale)
  if (numericValues.length > totalCount * 0.8) {
    const numericKeywords = ['age', 'income', 'salary', 'price', 'cost', 'amount', 'number', 'count', 'quantity'];
    const hasNumericKeywords = numericKeywords.some(keyword => lowerHeader.includes(keyword));
    
    // Check if it's a continuous numeric variable (not a scale)
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const range = max - min;
    
    if (range > 20 || hasNumericKeywords || uniqueCount > 15) {
      return { 
        type: 'numeric', 
        confidence: 0.8, 
        reasoning: `Numeric values with ${hasNumericKeywords ? 'numeric keywords' : 'wide range'} (${min}-${max})` 
      };
    }
  }

  // 5. Open-ended Detection (AFTER date/time check)
  const avgLength = cleanValues.reduce((sum, v) => sum + v.length, 0) / cleanValues.length;
  const longResponses = cleanValues.filter(v => v.length > 20).length;
  const longResponseRatio = longResponses / totalCount;
  
  const openEndedKeywords = [
    'comment', 'feedback', 'opinion', 'explain', 'describe', 'why', 'how',
    'other', 'specify', 'elaborate', 'detail', 'reason', 'suggestion',
    'improvement', 'additional', 'anything else', 'open', 'text'
  ];
  
  const hasOpenEndedKeywords = openEndedKeywords.some(keyword => lowerHeader.includes(keyword));
  
  // High uniqueness + long text = open-ended (but not if it's date/time)
  if (uniqueRatio > 0.7 && (avgLength > 15 || longResponseRatio > 0.3 || hasOpenEndedKeywords)) {
    // Double-check it's not date/time with high uniqueness
    if (dateMatches.length < totalCount * 0.3) { // Less than 30% date matches
      const confidence = hasOpenEndedKeywords ? 0.9 : (avgLength > 30 ? 0.85 : 0.75);
      return { 
        type: 'open-ended', 
        confidence, 
        reasoning: `High uniqueness (${Math.round(uniqueRatio * 100)}%) with ${hasOpenEndedKeywords ? 'open-ended keywords' : 'long responses'} (avg: ${Math.round(avgLength)} chars)` 
      };
    }
  }

  // 6. Ranking Detection
  if (numericValues.length > totalCount * 0.6) {
    const rankingKeywords = ['rank', 'ranking', 'order', 'priority', 'preference', 'choice', '1st', '2nd', '3rd', '_r1_', '_r2_', '_r3_', '_rank1', '_rank2', '_rank3'];
    const hasRankingKeywords = rankingKeywords.some(keyword => lowerHeader.includes(keyword));
    
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    
    // Ranking typically starts from 1 and has limited range
    if (hasRankingKeywords || (min >= 1 && max <= 10 && uniqueCount <= 10)) {
      return { 
        type: 'ranking', 
        confidence: 0.85, 
        reasoning: `${hasRankingKeywords ? 'Ranking keywords' : 'Ranking pattern'} with numeric range ${min}-${max}` 
      };
    }
  }

  // 7. Multiple Choice Detection (for individual columns)
  const multiChoiceIndicators = cleanValues.filter(v => {
    const lowerV = v.toLowerCase();
    return lowerV === '1' || lowerV === '0' || lowerV === 'yes' || lowerV === 'no' || 
           lowerV === 'true' || lowerV === 'false' || lowerV === 'selected' || lowerV === 'x';
  });
  
  if (multiChoiceIndicators.length > totalCount * 0.8 && uniqueCount <= 4) {
    return { 
      type: 'multiple-choice', 
      confidence: 0.8, 
      reasoning: 'Binary indicators suggesting multiple choice option' 
    };
  }

  // 8. Single Choice (default for categorical data)
  if (uniqueCount <= Math.min(20, totalCount * 0.5)) {
    const confidence = uniqueCount <= 10 ? 0.7 : 0.6;
    return { 
      type: 'single-choice', 
      confidence, 
      reasoning: `Limited unique values (${uniqueCount}) suggesting categorical data` 
    };
  }

  // Fallback
  return { 
    type: 'single-choice', 
    confidence: 0.4, 
    reasoning: `Default classification - ${uniqueCount} unique values from ${totalCount} responses` 
  };
}

export function autoDetectQuestionTypes(
  headers: string[],
  dataRows: any[][],
  multiSelectGroups: Record<string, string[]>
): Record<string, QuestionType> {
  const questionTypes: Record<string, QuestionType> = {};
  
  headers.forEach((header, index) => {
    // Check if it's part of a multi-select group - if so, skip individual detection
    const isInMultiSelectGroup = Object.values(multiSelectGroups).some(group => 
      group.includes(header)
    );
    
    if (!isInMultiSelectGroup) {
      // Get column data
      const columnData = dataRows.map(row => row[index]);
      const analysis = analyzeQuestionType(header, columnData);
      questionTypes[header] = analysis.type;
    }
    // Note: We don't set multi-select columns to 'multiple-choice' here
    // They are handled separately in the multi-select groups
  });
  
  return questionTypes;
}