// Ranking question processor for structured rank data
import { RankingCalculations } from '../types';

export interface RankQuestionStructure {
  questionName: string;
  options: string[];
  maxRanks: number;
  columnMapping: {
    rank1Columns: string[];
    rank2Columns: string[];
    rank3Columns: string[];
  };
}

export function detectRankQuestionStructure(
  headers: string[],
  questionTypes: Record<string, string>
): RankQuestionStructure[] {
  const rankQuestions: RankQuestionStructure[] = [];
  
  // Find headers marked as ranking type
  const rankingHeaders = headers.filter(header => questionTypes[header] === 'ranking');
  
  // Group ranking headers by question root
  const questionGroups: { [key: string]: string[] } = {};
  
  rankingHeaders.forEach(header => {
    const questionRoot = extractRankQuestionRoot(header);
    if (!questionGroups[questionRoot]) {
      questionGroups[questionRoot] = [];
    }
    questionGroups[questionRoot].push(header);
  });
  
  // Process each question group
  Object.entries(questionGroups).forEach(([questionRoot, columns]) => {
    const structure = analyzeRankStructure(questionRoot, columns, headers);
    if (structure) {
      rankQuestions.push(structure);
    }
  });
  
  return rankQuestions;
}

function extractRankQuestionRoot(header: string): string {
  // Extract question root from ranking headers
  // Look for patterns like "Q1_Rank1_Option1", "Question1_R1_Opt1", etc.
  const patterns = [
    /^(.+?)_[Rr]ank?\d+/,
    /^(.+?)_[Rr]\d+/,
    /^(.+?)_Rank_?\d+/,
    /^(.+?)\s+[Rr]ank\s*\d+/,
  ];
  
  for (const pattern of patterns) {
    const match = header.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Fallback: take first part before underscore or space
  return header.split(/[_\s]/)[0];
}

function analyzeRankStructure(
  questionRoot: string,
  rankColumns: string[],
  allHeaders: string[]
): RankQuestionStructure | null {
  // Sort columns to ensure proper order
  const sortedColumns = rankColumns.sort();
  
  // Try to detect the structure: (ranks+1) * options
  // Look for patterns in column names to identify ranks and options
  const rankGroups = groupColumnsByRank(sortedColumns);
  
  if (rankGroups.length < 2) return null; // Need at least 2 rank levels
  
  // Extract options from the first rank group
  const options = extractOptionsFromRankGroup(rankGroups[0]);
  
  if (options.length === 0) return null;
  
  // Validate structure: each rank should have the same number of options
  const expectedColumnsPerRank = options.length;
  const validStructure = rankGroups.every(group => group.length === expectedColumnsPerRank);
  
  if (!validStructure) return null;
  
  // Map columns to ranks (skip first group as mentioned - it's ungrouped/irrelevant)
  const columnMapping = {
    rank1Columns: rankGroups[1] || [],
    rank2Columns: rankGroups[2] || [],
    rank3Columns: rankGroups[3] || []
  };
  
  return {
    questionName: questionRoot,
    options,
    maxRanks: Math.min(3, rankGroups.length - 1), // Exclude first ungrouped set
    columnMapping
  };
}

function groupColumnsByRank(columns: string[]): string[][] {
  const groups: { [key: string]: string[] } = {};
  
  columns.forEach(column => {
    const rankMatch = column.match(/[Rr]ank?_?(\d+)|[Rr](\d+)/);
    if (rankMatch) {
      const rankNum = rankMatch[1] || rankMatch[2];
      if (!groups[rankNum]) {
        groups[rankNum] = [];
      }
      groups[rankNum].push(column);
    }
  });
  
  // Convert to array and sort by rank number
  const sortedGroups = Object.keys(groups)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(rank => groups[rank].sort());
  
  return sortedGroups;
}

function extractOptionsFromRankGroup(rankColumns: string[]): string[] {
  const options: string[] = [];
  
  rankColumns.forEach(column => {
    // Extract option name from column header
    // Look for patterns after rank identifier
    const optionMatch = column.match(/(?:[Rr]ank?\d*_?|[Rr]\d+_?)(.+)$/);
    if (optionMatch) {
      const option = optionMatch[1]
        .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
        .replace(/_/g, ' ') // Replace underscores with spaces
        .trim();
      
      if (option && !options.includes(option)) {
        options.push(option);
      }
    }
  });
  
  return options;
}

export function createRankingCrossTab(
  dataMap: Record<string, any>[],
  rankStructure: RankQuestionStructure,
  bannerVars: string[],
  bannerValuesByVar: { [key: string]: string[] },
  baseValues: number[]
): RankingCalculations {
  const { options, columnMapping, maxRanks } = rankStructure;
  
  const rank1Only: number[][] = [];
  const rank2Only: number[][] = [];
  const rank3Only: number[][] = [];
  const rank1Plus2: number[][] = [];
  const rank1Plus2Plus3: number[][] = [];
  
  // For each option, calculate the ranking metrics
  options.forEach((option, optionIndex) => {
    // Get the specific columns for this option at each rank
    const rank1Col = columnMapping.rank1Columns[optionIndex];
    const rank2Col = columnMapping.rank2Columns[optionIndex];
    const rank3Col = columnMapping.rank3Columns[optionIndex];
    
    // Calculate for each banner column
    const rank1Row: number[] = [];
    const rank2Row: number[] = [];
    const rank3Row: number[] = [];
    const rank1Plus2Row: number[] = [];
    const rank1Plus2Plus3Row: number[] = [];
    
    for (let colIndex = 0; colIndex < baseValues.length; colIndex++) {
      const rank1Count = calculateRankCount(dataMap, rank1Col, bannerVars, bannerValuesByVar, colIndex);
      const rank2Count = rank2Col ? calculateRankCount(dataMap, rank2Col, bannerVars, bannerValuesByVar, colIndex) : 0;
      const rank3Count = rank3Col ? calculateRankCount(dataMap, rank3Col, bannerVars, bannerValuesByVar, colIndex) : 0;
      
      // Calculate percentages
      const base = baseValues[colIndex];
      const rank1Pct = base > 0 ? Math.round((rank1Count / base) * 100) : 0;
      const rank2Pct = base > 0 ? Math.round((rank2Count / base) * 100) : 0;
      const rank3Pct = base > 0 ? Math.round((rank3Count / base) * 100) : 0;
      const rank1Plus2Pct = base > 0 ? Math.round(((rank1Count + rank2Count) / base) * 100) : 0;
      const rank1Plus2Plus3Pct = base > 0 ? Math.round(((rank1Count + rank2Count + rank3Count) / base) * 100) : 0;
      
      rank1Row.push(rank1Pct);
      rank2Row.push(rank2Pct);
      rank3Row.push(rank3Pct);
      rank1Plus2Row.push(rank1Plus2Pct);
      rank1Plus2Plus3Row.push(rank1Plus2Plus3Pct);
    }
    
    rank1Only.push(rank1Row);
    rank2Only.push(rank2Row);
    rank3Only.push(rank3Row);
    rank1Plus2.push(rank1Plus2Row);
    rank1Plus2Plus3.push(rank1Plus2Plus3Row);
  });
  
  return {
    rank1Only,
    rank2Only,
    rank3Only,
    rank1Plus2,
    rank1Plus2Plus3,
    rankOptions: options,
    maxRanks
  };
}

function calculateRankCount(
  dataMap: Record<string, any>[],
  columnName: string | undefined,
  bannerVars: string[],
  bannerValuesByVar: { [key: string]: string[] },
  colIndex: number
): number {
  if (!columnName) return 0;
  
  if (colIndex === 0) {
    // Total column - count all responses where this rank column has a value
    return dataMap.filter(row => {
      const value = String(row[columnName] || '').trim();
      return value !== '' && value !== '0' && value !== 'null' && value !== 'undefined';
    }).length;
  } else {
    // Banner-specific column
    let currentIndex = 1;
    for (const bannerVar of bannerVars) {
      const bannerValues = bannerValuesByVar[bannerVar];
      for (const bannerVal of bannerValues) {
        if (currentIndex === colIndex) {
          return dataMap.filter(row => {
            const rankValue = String(row[columnName] || '').trim();
            const bannerValue = String(row[bannerVar] || '').trim();
            const hasRankValue = rankValue !== '' && rankValue !== '0' && rankValue !== 'null' && rankValue !== 'undefined';
            return hasRankValue && bannerValue === bannerVal;
          }).length;
        }
        currentIndex++;
      }
    }
  }
  
  return 0;
}