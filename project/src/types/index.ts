export interface ExcelData {
  headers: string[];
  rows: any[][];
  fileName: string;
}

export interface CrossTabConfig {
  tableVariables: string[];
  bannerVariables: string[];
  multiSelectGroups: Record<string, string[]>;
  questionTypes: Record<string, QuestionType>;
  tableNames: Record<string, string>;
  filters: Record<string, FilterConfig>;
  customVariables: Record<string, CustomVariable>;
  nestedFilters: NestedFilterGroup[];
}

// Enhanced Filter Types
export interface FilterConfig {
  column: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in_range' | 'is_empty' | 'is_not_empty' | 'starts_with' | 'ends_with';
  value: string | number;
  secondValue?: string | number;
}

export interface NestedFilterGroup {
  id: string;
  operator: 'AND' | 'OR';
  conditions: (FilterCondition | NestedFilterGroup)[];
  not?: boolean;
}

export interface FilterCondition {
  id: string;
  column: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in_range' | 'is_empty' | 'is_not_empty' | 'starts_with' | 'ends_with';
  value: string | number;
  secondValue?: string | number;
  not?: boolean;
}

// Enhanced Custom Variable Types
export interface CustomVariable {
  id: string;
  name: string;
  type: 'grouped_single' | 'grouped_multi' | 'formula' | 'recode' | 'switch_case';
  sourceColumns: string[];
  mappings?: Record<string, string[]>;
  formula?: FormulaDefinition;
  recodeRules?: RecodeRule[];
  switchCases?: SwitchCase[];
  description?: string;
}

export interface FormulaDefinition {
  expression: string;
  variables: Record<string, string>; // variable name -> column name
}

export interface RecodeRule {
  id: string;
  condition: FilterCondition;
  newValue: string;
  order: number;
}

export interface SwitchCase {
  id: string;
  condition: FilterCondition;
  value: string;
  order: number;
}

// ML-Based Open-End Coding
export interface OpenEndCoding {
  questionColumn: string;
  responses: OpenEndResponse[];
  categories: OpenEndCategory[];
  settings: CodingSettings;
}

export interface OpenEndResponse {
  id: string;
  text: string;
  categoryId: string;
  confidence: number;
  rowIndex: number;
}

export interface OpenEndCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  sampleResponses: string[];
  responseCount: number;
  confidence: number;
}

export interface CodingSettings {
  minCategorySize: number;
  maxCategories: number;
  similarityThreshold: number;
  useSemanticClustering: boolean;
  excludeShortResponses: boolean;
  minResponseLength: number;
}

export interface CrossTabResult {
  name: string;
  displayName: string;
  absolute: number[][];
  percentage: string[][];
  headers: string[];
  rowLabels: string[];
  bannerQuestion: string;
  bannerAnswers: string[];
  questionType: QuestionType;
  baseValues: number[];
  validationErrors: string[];
  significanceFlags: string[][];
  scaleCalculations?: ScaleCalculations;
  rankingCalculations?: RankingCalculations;
  statisticalMeasures?: StatisticalMeasures;
  openEndedThemes?: OpenEndedTheme[];
  openEndCoding?: OpenEndCoding;
  bannerStructure: BannerStructure[];
  appliedFilters?: NestedFilterGroup[];
}

export interface StatisticalMeasures {
  mean: number[];
  median: number[];
  standardDeviation: number[];
  headers: string[];
}

export interface BannerStructure {
  question: string;
  answers: string[];
  startIndex: number;
  endIndex: number;
}

export interface ScaleCalculations {
  topBox: number[][];
  bottomBox: number[][];
  top2Box: number[][];
  bottom2Box: number[][];
  top3Box?: number[][];
  bottom3Box?: number[][];
  scaleRange: { min: number; max: number };
}

export interface RankingCalculations {
  rank1Only: number[][];
  rank2Only: number[][];
  rank3Only: number[][];
  rank1Plus2: number[][];
  rank1Plus2Plus3: number[][];
  rankOptions: string[];
  maxRanks: number;
}

export interface OpenEndedTheme {
  theme: string;
  count: number;
  percentage: number;
  samples: string[];
  crossTabData?: {
    absolute: number[];
    percentage: string[];
    headers: string[];
  };
}

export interface MultiSelectGroup {
  name: string;
  columns: string[];
}

export type QuestionType = 
  | 'single-choice' 
  | 'multiple-choice' 
  | 'ranking' 
  | 'binary' 
  | 'open-ended' 
  | 'date' 
  | 'numeric'
  | 'scale';

export interface QuestionTypeConfig {
  type: QuestionType;
  label: string;
  description: string;
  validationRules: {
    percentageShouldSum100: boolean;
    allowMultipleSelections: boolean;
    baseCalculation: 'respondents' | 'responses';
  };
}

export interface SignificanceTestResult {
  isSignificant: boolean;
  pValue: number;
  zScore: number;
  comparisonType: 'higher' | 'lower' | 'none';
}