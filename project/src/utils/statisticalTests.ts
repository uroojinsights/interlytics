// Statistical significance testing utilities

export interface SignificanceTestResult {
  isSignificant: boolean;
  pValue: number;
  zScore: number;
  comparisonType: 'higher' | 'lower' | 'none';
}

// Z-test for proportions
export function zTestForProportions(
  count1: number, 
  total1: number, 
  count2: number, 
  total2: number,
  alpha: number = 0.05
): SignificanceTestResult {
  if (total1 === 0 || total2 === 0) {
    return { isSignificant: false, pValue: 1, zScore: 0, comparisonType: 'none' };
  }
  
  const p1 = count1 / total1;
  const p2 = count2 / total2;
  
  // Pooled proportion
  const pPooled = (count1 + count2) / (total1 + total2);
  
  // Standard error
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1/total1 + 1/total2));
  
  if (se === 0) {
    return { isSignificant: false, pValue: 1, zScore: 0, comparisonType: 'none' };
  }
  
  // Z-score
  const zScore = (p1 - p2) / se;
  
  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  const isSignificant = pValue < alpha;
  const comparisonType = isSignificant ? (p1 > p2 ? 'higher' : 'lower') : 'none';
  
  return {
    isSignificant,
    pValue,
    zScore,
    comparisonType
  };
}

// Normal cumulative distribution function approximation
function normalCDF(x: number): number {
  // Abramowitz and Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return x > 0 ? 1 - prob : prob;
}

// Test each cell against the total column
export function performSignificanceTests(
  absoluteData: number[][],
  baseValues: number[],
  alpha: number = 0.05
): string[][] {
  const significanceFlags: string[][] = [];
  
  for (let rowIndex = 0; rowIndex < absoluteData.length; rowIndex++) {
    const row = absoluteData[rowIndex];
    const flagRow: string[] = [];
    
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      if (colIndex === 0) {
        // Total column - no comparison
        flagRow.push('');
      } else {
        // Compare this cell to the total column
        const cellCount = row[colIndex];
        const cellBase = baseValues[colIndex];
        const totalCount = row[0]; // Total column
        const totalBase = baseValues[0]; // Total base
        
        const testResult = zTestForProportions(cellCount, cellBase, totalCount, totalBase, alpha);
        
        if (testResult.isSignificant) {
          flagRow.push(testResult.comparisonType === 'higher' ? '*' : '↓');
        } else {
          flagRow.push('');
        }
      }
    }
    
    significanceFlags.push(flagRow);
  }
  
  return significanceFlags;
}