// Advanced Open-End Coding with Semantic Clustering
import { OpenEndCoding, OpenEndResponse, OpenEndCategory, CodingSettings } from '../types';

export class OpenEndCoder {
  private settings: CodingSettings;

  constructor(settings: CodingSettings) {
    this.settings = settings;
  }

  async codeResponses(responses: string[], questionColumn: string): Promise<OpenEndCoding> {
    // Filter and clean responses
    const cleanResponses = this.preprocessResponses(responses);
    
    // Generate semantic embeddings and cluster
    const categories = await this.generateCategories(cleanResponses);
    
    // Assign responses to categories
    const codedResponses = this.assignResponsesToCategories(cleanResponses, categories);
    
    return {
      questionColumn,
      responses: codedResponses,
      categories,
      settings: this.settings
    };
  }

  private preprocessResponses(responses: string[]): Array<{ text: string; originalIndex: number }> {
    return responses
      .map((text, index) => ({ text: String(text || '').trim(), originalIndex: index }))
      .filter(item => {
        if (!item.text || item.text === 'null' || item.text === 'undefined') return false;
        if (this.settings.excludeShortResponses && item.text.length < this.settings.minResponseLength) return false;
        return true;
      });
  }

  private async generateCategories(responses: Array<{ text: string; originalIndex: number }>): Promise<OpenEndCategory[]> {
    if (this.settings.useSemanticClustering) {
      return this.semanticClustering(responses);
    } else {
      return this.keywordBasedClustering(responses);
    }
  }

  private async semanticClustering(responses: Array<{ text: string; originalIndex: number }>): Promise<OpenEndCategory[]> {
    // Simulate semantic clustering using TF-IDF and cosine similarity
    const documents = responses.map(r => r.text);
    const vocabulary = this.buildVocabulary(documents);
    const tfidfMatrix = this.calculateTFIDF(documents, vocabulary);
    
    // Perform hierarchical clustering
    const clusters = this.hierarchicalClustering(tfidfMatrix, responses);
    
    // Convert clusters to categories
    return this.clustersToCategories(clusters, responses);
  }

  private keywordBasedClustering(responses: Array<{ text: string; originalIndex: number }>): Promise<OpenEndCategory[]> {
    // Enhanced keyword-based clustering with dynamic category generation
    const categories: OpenEndCategory[] = [];
    const uncategorized: Array<{ text: string; originalIndex: number }> = [];
    
    // Extract key phrases and themes
    const phrases = this.extractKeyPhrases(responses.map(r => r.text));
    const themes = this.identifyThemes(phrases);
    
    // Create categories based on themes
    themes.forEach((theme, index) => {
      const categoryResponses = responses.filter(r => 
        this.matchesTheme(r.text, theme.keywords)
      );
      
      if (categoryResponses.length >= this.settings.minCategorySize) {
        categories.push({
          id: `cat_${index}`,
          name: theme.name,
          description: theme.description,
          keywords: theme.keywords,
          sampleResponses: categoryResponses.slice(0, 5).map(r => r.text),
          responseCount: categoryResponses.length,
          confidence: theme.confidence
        });
      }
    });
    
    // Handle uncategorized responses
    const categorizedTexts = new Set(
      categories.flatMap(cat => cat.sampleResponses)
    );
    
    const uncategorizedResponses = responses.filter(r => 
      !categories.some(cat => this.matchesTheme(r.text, cat.keywords))
    );
    
    if (uncategorizedResponses.length >= this.settings.minCategorySize) {
      categories.push({
        id: 'cat_other',
        name: 'Other/Miscellaneous',
        description: 'Responses that did not fit into other categories',
        keywords: [],
        sampleResponses: uncategorizedResponses.slice(0, 5).map(r => r.text),
        responseCount: uncategorizedResponses.length,
        confidence: 0.5
      });
    }
    
    return Promise.resolve(categories);
  }

  private buildVocabulary(documents: string[]): string[] {
    const wordCounts = new Map<string, number>();
    
    documents.forEach(doc => {
      const words = this.tokenize(doc);
      words.forEach(word => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });
    });
    
    // Filter out rare and common words
    return Array.from(wordCounts.entries())
      .filter(([word, count]) => count >= 2 && count <= documents.length * 0.8)
      .map(([word]) => word)
      .sort();
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    return stopWords.has(word);
  }

  private calculateTFIDF(documents: string[], vocabulary: string[]): number[][] {
    const tfidfMatrix: number[][] = [];
    
    documents.forEach(doc => {
      const words = this.tokenize(doc);
      const wordCounts = new Map<string, number>();
      
      words.forEach(word => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });
      
      const tfidfVector: number[] = [];
      
      vocabulary.forEach(term => {
        const tf = (wordCounts.get(term) || 0) / words.length;
        const df = documents.filter(d => this.tokenize(d).includes(term)).length;
        const idf = Math.log(documents.length / (df + 1));
        tfidfVector.push(tf * idf);
      });
      
      tfidfMatrix.push(tfidfVector);
    });
    
    return tfidfMatrix;
  }

  private hierarchicalClustering(
    tfidfMatrix: number[][], 
    responses: Array<{ text: string; originalIndex: number }>
  ): Array<Array<{ text: string; originalIndex: number }>> {
    // Simple agglomerative clustering
    const clusters: Array<Array<{ text: string; originalIndex: number }>> = 
      responses.map(r => [r]);
    
    while (clusters.length > this.settings.maxCategories) {
      let minDistance = Infinity;
      let mergeIndices = [0, 1];
      
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const distance = this.calculateClusterDistance(
            clusters[i], clusters[j], tfidfMatrix, responses
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            mergeIndices = [i, j];
          }
        }
      }
      
      if (minDistance > this.settings.similarityThreshold) break;
      
      // Merge clusters
      const [i, j] = mergeIndices;
      clusters[i] = [...clusters[i], ...clusters[j]];
      clusters.splice(j, 1);
    }
    
    return clusters.filter(cluster => cluster.length >= this.settings.minCategorySize);
  }

  private calculateClusterDistance(
    cluster1: Array<{ text: string; originalIndex: number }>,
    cluster2: Array<{ text: string; originalIndex: number }>,
    tfidfMatrix: number[][],
    allResponses: Array<{ text: string; originalIndex: number }>
  ): number {
    let totalDistance = 0;
    let count = 0;
    
    cluster1.forEach(r1 => {
      cluster2.forEach(r2 => {
        const idx1 = allResponses.findIndex(r => r.originalIndex === r1.originalIndex);
        const idx2 = allResponses.findIndex(r => r.originalIndex === r2.originalIndex);
        
        if (idx1 !== -1 && idx2 !== -1) {
          totalDistance += this.cosineSimilarity(tfidfMatrix[idx1], tfidfMatrix[idx2]);
          count++;
        }
      });
    });
    
    return count > 0 ? 1 - (totalDistance / count) : 1;
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  private clustersToCategories(
    clusters: Array<Array<{ text: string; originalIndex: number }>>,
    allResponses: Array<{ text: string; originalIndex: number }>
  ): OpenEndCategory[] {
    return clusters.map((cluster, index) => {
      const keywords = this.extractClusterKeywords(cluster.map(r => r.text));
      const categoryName = this.generateCategoryName(keywords, cluster.map(r => r.text));
      
      return {
        id: `semantic_cat_${index}`,
        name: categoryName,
        description: `Auto-generated category based on semantic similarity`,
        keywords,
        sampleResponses: cluster.slice(0, 5).map(r => r.text),
        responseCount: cluster.length,
        confidence: 0.8
      };
    });
  }

  private extractKeyPhrases(texts: string[]): Array<{ phrase: string; frequency: number }> {
    const phrases = new Map<string, number>();
    
    texts.forEach(text => {
      const words = this.tokenize(text);
      
      // Extract 1-grams, 2-grams, and 3-grams
      for (let n = 1; n <= 3; n++) {
        for (let i = 0; i <= words.length - n; i++) {
          const phrase = words.slice(i, i + n).join(' ');
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
      }
    });
    
    return Array.from(phrases.entries())
      .map(([phrase, frequency]) => ({ phrase, frequency }))
      .filter(item => item.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50);
  }

  private identifyThemes(phrases: Array<{ phrase: string; frequency: number }>): Array<{
    name: string;
    description: string;
    keywords: string[];
    confidence: number;
  }> {
    // Enhanced theme identification with semantic grouping
    const themeGroups = [
      {
        name: 'Quality & Performance',
        keywords: ['quality', 'performance', 'good', 'bad', 'excellent', 'poor', 'reliable', 'durable', 'effective'],
        description: 'Comments about product or service quality and performance'
      },
      {
        name: 'Price & Value',
        keywords: ['price', 'cost', 'expensive', 'cheap', 'affordable', 'value', 'money', 'budget', 'worth'],
        description: 'Comments about pricing, cost, and value for money'
      },
      {
        name: 'Customer Service',
        keywords: ['service', 'staff', 'customer', 'support', 'help', 'friendly', 'rude', 'professional', 'helpful'],
        description: 'Comments about customer service and staff interactions'
      },
      {
        name: 'Speed & Efficiency',
        keywords: ['fast', 'slow', 'quick', 'time', 'wait', 'delay', 'speed', 'efficient', 'prompt', 'immediate'],
        description: 'Comments about speed, timing, and efficiency'
      },
      {
        name: 'Convenience & Ease',
        keywords: ['convenient', 'easy', 'simple', 'difficult', 'complicated', 'user-friendly', 'accessible'],
        description: 'Comments about convenience and ease of use'
      },
      {
        name: 'Location & Accessibility',
        keywords: ['location', 'close', 'near', 'far', 'parking', 'distance', 'accessible', 'convenient'],
        description: 'Comments about location and accessibility'
      },
      {
        name: 'Product Features',
        keywords: ['feature', 'function', 'design', 'style', 'variety', 'selection', 'options', 'capability'],
        description: 'Comments about product features and functionality'
      },
      {
        name: 'Communication',
        keywords: ['communication', 'information', 'clear', 'confusing', 'explanation', 'instructions'],
        description: 'Comments about communication and information clarity'
      }
    ];
    
    const identifiedThemes: Array<{
      name: string;
      description: string;
      keywords: string[];
      confidence: number;
    }> = [];
    
    themeGroups.forEach(theme => {
      const matchingPhrases = phrases.filter(p => 
        theme.keywords.some(keyword => p.phrase.includes(keyword))
      );
      
      if (matchingPhrases.length > 0) {
        const totalFrequency = matchingPhrases.reduce((sum, p) => sum + p.frequency, 0);
        const confidence = Math.min(totalFrequency / phrases.length, 1);
        
        identifiedThemes.push({
          ...theme,
          confidence
        });
      }
    });
    
    return identifiedThemes.sort((a, b) => b.confidence - a.confidence);
  }

  private matchesTheme(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  private extractClusterKeywords(texts: string[]): string[] {
    const allWords = texts.flatMap(text => this.tokenize(text));
    const wordCounts = new Map<string, number>();
    
    allWords.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
    
    return Array.from(wordCounts.entries())
      .filter(([word, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private generateCategoryName(keywords: string[], sampleTexts: string[]): string {
    if (keywords.length === 0) return 'Miscellaneous';
    
    // Try to create a meaningful name from top keywords
    const topKeywords = keywords.slice(0, 3);
    
    // Look for common themes
    const themeMap = {
      'quality': 'Quality & Performance',
      'price': 'Price & Value',
      'service': 'Customer Service',
      'fast': 'Speed & Efficiency',
      'location': 'Location & Access',
      'easy': 'Convenience & Ease'
    };
    
    for (const [key, theme] of Object.entries(themeMap)) {
      if (topKeywords.some(keyword => keyword.includes(key))) {
        return theme;
      }
    }
    
    // Fallback to keyword-based name
    return topKeywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' & ');
  }

  private assignResponsesToCategories(
    responses: Array<{ text: string; originalIndex: number }>,
    categories: OpenEndCategory[]
  ): OpenEndResponse[] {
    return responses.map(response => {
      let bestCategory = categories[categories.length - 1]; // Default to last category (usually "Other")
      let bestScore = 0;
      
      categories.forEach(category => {
        const score = this.calculateCategoryScore(response.text, category);
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      });
      
      return {
        id: `response_${response.originalIndex}`,
        text: response.text,
        categoryId: bestCategory.id,
        confidence: bestScore,
        rowIndex: response.originalIndex
      };
    });
  }

  private calculateCategoryScore(text: string, category: OpenEndCategory): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    
    category.keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });
    
    return category.keywords.length > 0 ? score / category.keywords.length : 0;
  }
}

export function createDefaultCodingSettings(): CodingSettings {
  return {
    minCategorySize: 1,
    maxCategories: 20,
    similarityThreshold: 0.5,
    useSemanticClustering: true,
    excludeShortResponses: false,
    minResponseLength: 5
  };
}