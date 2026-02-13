// Utility functions for text processing and analysis

export function extractOptionFromHeader(header: string): string {
  // Common delimiters used in survey questions
  const delimiters = [' - ', ' – ', ' — ', ': ', ' | ', ' ; ', ') ', '} '];
  
  let cleanHeader = header.trim();
  
  // Try each delimiter and keep the last segment
  for (const delimiter of delimiters) {
    if (cleanHeader.includes(delimiter)) {
      const parts = cleanHeader.split(delimiter);
      cleanHeader = parts[parts.length - 1].trim();
    }
  }
  
  // Handle parentheses - keep content after closing parenthesis
  const parenMatch = cleanHeader.match(/\)\s*(.+)$/);
  if (parenMatch) {
    cleanHeader = parenMatch[1].trim();
  }
  
  // Handle numbered options (e.g., "1. Option text" -> "Option text")
  const numberedMatch = cleanHeader.match(/^\d+\.?\s*(.+)$/);
  if (numberedMatch) {
    cleanHeader = numberedMatch[1].trim();
  }
  
  return cleanHeader || header; // Fallback to original if nothing found
}

export function extractQuestionFromHeader(header: string): string {
  // Extract the main question part (before the first delimiter)
  const delimiters = [' - ', ' – ', ' — ', ': ', ' | ', ' ; '];
  
  for (const delimiter of delimiters) {
    if (header.includes(delimiter)) {
      return header.split(delimiter)[0].trim();
    }
  }
  
  // If no delimiter found, return the header up to the first parenthesis
  const parenMatch = header.match(/^([^(]+)/);
  if (parenMatch) {
    return parenMatch[1].trim();
  }
  
  return header;
}

export function removeSharedPrefix(columns: string[]): string[] {
  if (columns.length <= 1) return columns;
  
  // Find the longest common prefix
  let commonPrefix = '';
  const firstColumn = columns[0];
  
  for (let i = 0; i < firstColumn.length; i++) {
    const char = firstColumn[i];
    if (columns.every(col => col[i] === char)) {
      commonPrefix += char;
    } else {
      break;
    }
  }
  
  // Remove trailing delimiters and spaces from the prefix
  commonPrefix = commonPrefix.replace(/[\s\-–—:|;]+$/, '');
  
  // Only remove prefix if it's meaningful (more than just a few characters)
  if (commonPrefix.length > 3) {
    return columns.map(col => {
      let cleaned = col.substring(commonPrefix.length).trim();
      // Remove leading delimiters
      cleaned = cleaned.replace(/^[\s\-–—:|;]+/, '');
      return cleaned || col; // Fallback to original if nothing left
    });
  }
  
  return columns;
}

// Enhanced theme extraction for open-ended responses
export function extractThemes(responses: string[]): { theme: string; count: number; percentage: number; samples: string[] }[] {
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
    ],
    'Other': []
  };
  
  const themes: { [key: string]: { count: number; samples: string[] } } = {};
  
  // Initialize themes
  Object.keys(themeKeywords).forEach(theme => {
    themes[theme] = { count: 0, samples: [] };
  });
  
  // Categorize responses with improved matching
  validResponses.forEach(response => {
    const lowerResponse = response.toLowerCase();
    let categorized = false;
    let bestMatch = '';
    let maxMatches = 0;
    
    // Find the theme with the most keyword matches
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (theme === 'Other') continue;
      
      const matches = keywords.filter(keyword => lowerResponse.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = theme;
      }
    }
    
    // Only categorize if we found at least one keyword match
    if (maxMatches > 0) {
      themes[bestMatch].count++;
      if (themes[bestMatch].samples.length < 3) {
        themes[bestMatch].samples.push(response);
      }
      categorized = true;
    }
    
    // If not categorized, add to 'Other'
    if (!categorized) {
      themes['Other'].count++;
      if (themes['Other'].samples.length < 3) {
        themes['Other'].samples.push(response);
      }
    }
  });
  
  // Convert to array and calculate percentages
  return Object.entries(themes)
    .filter(([_, data]) => data.count > 0)
    .map(([theme, data]) => ({
      theme,
      count: data.count,
      percentage: Math.round((data.count / validResponses.length) * 100),
      samples: data.samples
    }))
    .sort((a, b) => b.count - a.count);
}

// Enhanced scale detection with better range identification
export function detectScaleRange(values: any[]): { min: number; max: number } | null {
  const numericValues = values
    .map(v => {
      const num = Number(v);
      return isNaN(num) ? null : num;
    })
    .filter(v => v !== null) as number[];
  
  if (numericValues.length === 0) return null;
  
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const range = max - min;
  
  // Check if it looks like a scale (reasonable range, mostly integers)
  const integerCount = numericValues.filter(v => Number.isInteger(v)).length;
  const integerRatio = integerCount / numericValues.length;
  
  // Scale criteria: limited range, mostly integers, reasonable bounds
  if (range <= 15 && range >= 1 && integerRatio >= 0.8 && min >= 0 && max <= 20) {
    return { min, max };
  }
  
  return null;
}

// Text similarity function for better theme matching
export function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = new Set([...words1, ...words2]).size;
  
  return commonWords.length / totalWords;
}

// Advanced text cleaning for better analysis
export function cleanTextForAnalysis(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}