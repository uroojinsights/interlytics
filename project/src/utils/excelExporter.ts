import * as XLSX from 'xlsx';
import { CrossTabResult } from '../types';

interface TableReference {
  name: string;
  displayName: string;
  absoluteRef: string;
  percentageRef: string;
}

export function exportToExcelWithIndex(results: CrossTabResult[], fileName: string): void {
  const workbook = XLSX.utils.book_new();
  const tableReferences: TableReference[] = [];
  
  // Create Absolute sheet
  const { data: absoluteData, references: absRefs } = createFormattedSheet(results, 'absolute');
  const absoluteSheet = XLSX.utils.aoa_to_sheet(absoluteData);
  
  // Apply professional formatting to absolute sheet
  applyProfessionalFormatting(absoluteSheet, absoluteData, 'absolute');
  XLSX.utils.book_append_sheet(workbook, absoluteSheet, 'Absolute Values');
  
  // Create Percentage sheet
  const { data: percentageData, references: pctRefs } = createFormattedSheet(results, 'percentage');
  const percentageSheet = XLSX.utils.aoa_to_sheet(percentageData);
  
  // Apply professional formatting to percentage sheet
  applyProfessionalFormatting(percentageSheet, percentageData, 'percentage');
  XLSX.utils.book_append_sheet(workbook, percentageSheet, 'Percentages');
  
  // Combine references
  absRefs.forEach((ref, index) => {
    tableReferences.push({
      name: ref.name,
      displayName: ref.displayName,
      absoluteRef: `'Absolute Values'!A${ref.startRow}`,
      percentageRef: `'Percentages'!A${pctRefs[index].startRow}`
    });
  });
  
  // Create Index sheet
  const indexData = createIndexSheet(tableReferences);
  const indexSheet = XLSX.utils.aoa_to_sheet(indexData);
  
  // Apply formatting to index sheet
  applyIndexFormatting(indexSheet, indexData);
  
  // Insert index sheet at the beginning
  const sheets = workbook.SheetNames;
  workbook.SheetNames = ['Table Index', ...sheets];
  workbook.Sheets['Table Index'] = indexSheet;
  
  // Generate and download file
  const outputFileName = fileName.replace(/\.[^/.]+$/, '') + '_crosstab_analysis.xlsx';
  XLSX.writeFile(workbook, outputFileName);
}

function createFormattedSheet(results: CrossTabResult[], type: 'absolute' | 'percentage'): {
  data: any[][];
  references: { name: string; displayName: string; startRow: number }[];
} {
  const data: any[][] = [];
  const references: { name: string; displayName: string; startRow: number }[] = [];
  
  // Add main header
  data.push([`Cross-Tabulation Analysis Report - ${type === 'absolute' ? 'Absolute Values' : 'Percentages'}`]);
  data.push(['Statistical Significance: * = Significantly higher than total, ↓ = Significantly lower than total (p < 0.05)']);
  data.push([]);
  
  results.forEach((result, index) => {
    const startRow = data.length + 1; // +1 for Excel 1-based indexing
    
    if (index > 0) {
      // Add separator between tables
      data.push([]);
      data.push([]);
    }
    
    references.push({
      name: result.name,
      displayName: result.displayName,
      startRow
    });
    
    // Add table header with enhanced information
    data.push([`Table: ${result.displayName}`]);
    data.push([`Question Type: ${result.questionType.toUpperCase().replace('-', ' ')}`]);
    data.push([`Base: Total respondents with valid data`]);
    
    // Add question type explanation
    const explanation = getQuestionTypeExplanation(result.questionType);
    if (explanation) {
      data.push([`Analysis Note: ${explanation}`]);
    }
    data.push([]);
    
    // Add validation warnings if any
    if (result.validationErrors.length > 0) {
      data.push(['⚠️ DATA QUALITY WARNINGS:']);
      result.validationErrors.forEach(error => {
        data.push([`   • ${error}`]);
      });
      data.push([]);
    }
    
    // Create banner structure with proper headers
    const bannerHeaders = createBannerHeaders(result);
    bannerHeaders.forEach(headerRow => {
      data.push(headerRow);
    });
    
    // Add base row
    data.push(['Base', ...result.baseValues]);
    
    // Add main data rows with significance flags
    const dataToUse = type === 'absolute' ? result.absolute : result.percentage;
    dataToUse.forEach((row, rowIndex) => {
      if (rowIndex >= result.rowLabels.length) return; // Skip if no label
      
      const dataRow = [result.rowLabels[rowIndex]];
      const flagRow = result.significanceFlags[rowIndex] || [];
      
      row.forEach((cell, cellIndex) => {
        const flag = flagRow[cellIndex] || '';
        dataRow.push(flag ? `${cell}${flag}` : cell);
      });
      
      data.push(dataRow);
    });
    
    // Add statistical measures for numeric/scale questions
    if (result.statisticalMeasures && type === 'absolute') {
      data.push([]);
      data.push(['STATISTICAL MEASURES']);
      data.push(['Mean', ...result.statisticalMeasures.mean.map(m => m.toFixed(2))]);
      data.push(['Median', ...result.statisticalMeasures.median.map(m => m.toFixed(2))]);
      data.push(['Std Deviation', ...result.statisticalMeasures.standardDeviation.map(s => s.toFixed(2))]);
    }
    
    // Add enhanced scale calculations
    if (result.scaleCalculations && type === 'percentage') {
      data.push([]);
      data.push(['SCALE ANALYSIS (Top/Bottom Box)']);
      
      const { scaleRange } = result.scaleCalculations;
      data.push([`Top Box (${scaleRange.max})`, ...result.scaleCalculations.topBox.map(row => `${row[0]}%`)]);
      data.push([`Top 2 Box (${scaleRange.max-1}+${scaleRange.max})`, ...result.scaleCalculations.top2Box.map(row => `${row[0]}%`)]);
      
      if (result.scaleCalculations.top3Box) {
        data.push([`Top 3 Box (${scaleRange.max-2}+${scaleRange.max-1}+${scaleRange.max})`, ...result.scaleCalculations.top3Box.map(row => `${row[0]}%`)]);
      }
      
      data.push([`Bottom Box (${scaleRange.min})`, ...result.scaleCalculations.bottomBox.map(row => `${row[0]}%`)]);
      data.push([`Bottom 2 Box (${scaleRange.min}+${scaleRange.min+1})`, ...result.scaleCalculations.bottom2Box.map(row => `${row[0]}%`)]);
      
      if (result.scaleCalculations.bottom3Box) {
        data.push([`Bottom 3 Box (${scaleRange.min}+${scaleRange.min+1}+${scaleRange.min+2})`, ...result.scaleCalculations.bottom3Box.map(row => `${row[0]}%`)]);
      }
    }
    
    // Add ranking calculations
    if (result.rankingCalculations && type === 'percentage') {
      data.push([]);
      data.push(['RANKING ANALYSIS']);
      data.push(['Rank 1', ...result.rankingCalculations.rank1.map(row => `${row[0]}%`)]);
      data.push(['Rank 2', ...result.rankingCalculations.rank2.map(row => `${row[0]}%`)]);
      data.push(['Rank 3', ...result.rankingCalculations.rank3.map(row => `${row[0]}%`)]);
      data.push(['Rank 1+2', ...result.rankingCalculations.rank1Plus2.map(row => `${row[0]}%`)]);
      data.push(['Rank 1+2+3', ...result.rankingCalculations.rank1Plus2Plus3.map(row => `${row[0]}%`)]);
    }
    
    // Add open-ended themes analysis
    if (result.openEndedThemes && result.openEndedThemes.length > 0) {
      data.push([]);
      data.push(['OPEN-ENDED THEMES ANALYSIS']);
      data.push(['Theme', 'Total Count', 'Total %', ...result.headers.slice(1).map(h => `${h} Count`), ...result.headers.slice(1).map(h => `${h} %`)]);
      
      result.openEndedThemes.forEach(theme => {
        const themeRow = [theme.theme, theme.count, `${theme.percentage}%`];
        
        if (theme.crossTabData) {
          themeRow.push(...theme.crossTabData.absolute.slice(1));
          themeRow.push(...theme.crossTabData.percentage.slice(1));
        }
        
        data.push(themeRow);
      });
    }
    
    data.push([]); // Empty row after each table
  });
  
  return { data, references };
}

function createBannerHeaders(result: CrossTabResult): any[][] {
  const headers: any[][] = [];
  
  if (!result.bannerStructure || result.bannerStructure.length === 0) {
    // Simple single-row header
    headers.push(['', ...result.headers]);
    return headers;
  }
  
  // Multi-level headers
  const questionRow = [''];
  const answerRow = [''];
  
  // Total column
  questionRow.push('Total');
  answerRow.push('');
  
  // Banner questions and answers
  result.bannerStructure.forEach(banner => {
    // Add question spanning across all answers
    questionRow.push(banner.question);
    answerRow.push(banner.answers[0]);
    
    // Add empty cells for question span and remaining answers
    for (let i = 1; i < banner.answers.length; i++) {
      questionRow.push('');
      answerRow.push(banner.answers[i]);
    }
  });
  
  headers.push(questionRow);
  headers.push(answerRow);
  
  return headers;
}

function createIndexSheet(tableReferences: TableReference[]): any[][] {
  const data: any[][] = [];
  
  // Header section
  data.push(['CROSS-TABULATION ANALYSIS - TABLE INDEX']);
  data.push(['Navigate to specific tables using the hyperlinks below']);
  data.push(['Generated on: ' + new Date().toLocaleString()]);
  data.push([]);
  
  // Column headers
  data.push(['#', 'Table Name', 'Description', 'Absolute Values', 'Percentages']);
  
  // Table entries with hyperlinks
  tableReferences.forEach((ref, index) => {
    data.push([
      index + 1,
      ref.displayName,
      `Cross-tabulation analysis for ${ref.displayName}`,
      { f: `HYPERLINK("${ref.absoluteRef}", "View Counts")` },
      { f: `HYPERLINK("${ref.percentageRef}", "View Percentages")` }
    ]);
  });
  
  data.push([]);
  data.push(['Summary Statistics:']);
  data.push(['Total Tables:', tableReferences.length]);
  data.push(['Analysis Type:', 'Cross-Tabulation with Statistical Significance Testing']);
  data.push(['Confidence Level:', '95% (p < 0.05)']);
  
  return data;
}

function applyProfessionalFormatting(sheet: XLSX.WorkSheet, data: any[][], sheetType: string): void {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // Apply comprehensive formatting
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      
      if (!sheet[cellRef]) {
        sheet[cellRef] = { t: 's', v: '' };
      }
      
      if (!sheet[cellRef].s) sheet[cellRef].s = {};
      
      // Apply borders to all cells
      sheet[cellRef].s.border = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      };
      
      const cellValue = data[row] && data[row][col];
      const cellText = String(cellValue || '');
      
      // Main report header
      if (row === 0) {
        sheet[cellRef].s.font = { bold: true, size: 16, color: { rgb: '1F4E79' } };
        sheet[cellRef].s.fill = { fgColor: { rgb: 'D9E2F3' } };
        sheet[cellRef].s.alignment = { horizontal: 'center' };
      }
      
      // Table headers
      if (cellText.startsWith('Table:')) {
        sheet[cellRef].s.font = { bold: true, size: 14, color: { rgb: '1F4E79' } };
        sheet[cellRef].s.fill = { fgColor: { rgb: 'E7E6E6' } };
        sheet[cellRef].s.border.top = { style: 'thick', color: { rgb: '1F4E79' } };
        sheet[cellRef].s.border.bottom = { style: 'thick', color: { rgb: '1F4E79' } };
      }
      
      // Question type and analysis notes
      if (cellText.startsWith('Question Type:') || cellText.startsWith('Analysis Note:') || cellText.startsWith('Base:')) {
        sheet[cellRef].s.font = { italic: true, size: 10 };
        sheet[cellRef].s.fill = { fgColor: { rgb: 'F2F2F2' } };
      }
      
      // Section headers (SCALE ANALYSIS, RANKING ANALYSIS, etc.)
      if (cellText.includes('ANALYSIS') || cellText.includes('MEASURES') || cellText.includes('THEMES')) {
        sheet[cellRef].s.font = { bold: true, size: 12, color: { rgb: 'FFFFFF' } };
        sheet[cellRef].s.fill = { fgColor: { rgb: '4472C4' } };
        sheet[cellRef].s.alignment = { horizontal: 'center' };
        sheet[cellRef].s.border.top = { style: 'thick', color: { rgb: '4472C4' } };
        sheet[cellRef].s.border.bottom = { style: 'thick', color: { rgb: '4472C4' } };
      }
      
      // Base row
      if (cellText === 'Base') {
        sheet[cellRef].s.font = { bold: true };
        sheet[cellRef].s.fill = { fgColor: { rgb: 'FFF2CC' } };
      }
      
      // Data validation warnings
      if (cellText.includes('⚠️') || cellText.includes('WARNING')) {
        sheet[cellRef].s.font = { bold: true, color: { rgb: 'C55A11' } };
        sheet[cellRef].s.fill = { fgColor: { rgb: 'FCE4D6' } };
      }
      
      // Significance flags
      if (cellText.includes('*') || cellText.includes('↓')) {
        sheet[cellRef].s.font = { bold: true };
        if (cellText.includes('*')) {
          sheet[cellRef].s.font.color = { rgb: '70AD47' }; // Green for higher
        } else {
          sheet[cellRef].s.font.color = { rgb: 'C55A11' }; // Orange for lower
        }
      }
      
      // Numeric alignment
      if (typeof cellValue === 'number' || (typeof cellValue === 'string' && /^\d+\.?\d*%?$/.test(cellValue))) {
        sheet[cellRef].s.alignment = { horizontal: 'right' };
      }
    }
  }
  
  // Set optimal column widths
  const colWidths = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    let maxWidth = 8;
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellValue = data[row] && data[row][col];
      if (cellValue) {
        const width = String(cellValue).length;
        maxWidth = Math.max(maxWidth, Math.min(width + 2, 50));
      }
    }
    colWidths.push({ wch: maxWidth });
  }
  sheet['!cols'] = colWidths;
}

function applyIndexFormatting(sheet: XLSX.WorkSheet, data: any[][]): void {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      
      if (!sheet[cellRef]) continue;
      
      if (!sheet[cellRef].s) sheet[cellRef].s = {};
      
      // Apply borders
      sheet[cellRef].s.border = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      };
      
      // Main header
      if (row === 0) {
        sheet[cellRef].s.font = { bold: true, size: 18, color: { rgb: '1F4E79' } };
        sheet[cellRef].s.fill = { fgColor: { rgb: 'D9E2F3' } };
        sheet[cellRef].s.alignment = { horizontal: 'center' };
      }
      
      // Column headers
      if (row === 4) {
        sheet[cellRef].s.font = { bold: true, size: 12, color: { rgb: 'FFFFFF' } };
        sheet[cellRef].s.fill = { fgColor: { rgb: '4472C4' } };
        sheet[cellRef].s.alignment = { horizontal: 'center' };
      }
      
      // Hyperlink formatting
      if (col >= 3 && row > 4) {
        sheet[cellRef].s.font = { color: { rgb: '0563C1' }, underline: true };
      }
      
      // Summary section
      if (row > 4 && data[row] && data[row][0] && String(data[row][0]).includes(':')) {
        sheet[cellRef].s.font = { bold: true };
        sheet[cellRef].s.fill = { fgColor: { rgb: 'F2F2F2' } };
      }
    }
  }
  
  // Set column widths
  sheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 40 },  // Table Name
    { wch: 60 },  // Description
    { wch: 18 },  // Absolute
    { wch: 18 }   // Percentages
  ];
}

function getQuestionTypeExplanation(questionType: string): string {
  switch (questionType) {
    case 'single-choice':
      return 'One answer per respondent. Column percentages sum to 100%.';
    case 'multiple-choice':
      return 'Select all that apply. Percentages based on respondents who answered any option.';
    case 'binary':
      return 'Yes/No or True/False question. Column percentages sum to 100%.';
    case 'scale':
      return 'Rating scale with Top/Bottom Box analysis included.';
    case 'ranking':
      return 'Ranking question with detailed rank position analysis.';
    case 'open-ended':
      return 'Text responses automatically coded into themes using keyword analysis.';
    case 'numeric':
      return 'Numerical values with statistical measures (mean, median, standard deviation).';
    case 'date':
      return 'Date/time values grouped for analysis.';
    default:
      return '';
  }
}