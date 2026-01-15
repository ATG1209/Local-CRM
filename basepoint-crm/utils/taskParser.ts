
import * as chrono from 'chrono-node';
import { Company } from '../types';

export interface ParsedTask {
  cleanTitle: string;
  dueDate: Date | null;
  linkedCompany: Company | null;
  extractedDateText: string | null;
  hasTime: boolean;
  matchedMention: string | null;
  originalDateText: string | null;
  highlightRanges: { start: number; end: number; type: 'date' | 'mention' }[];
}

const SHORTHANDS: Record<string, string> = {
  'tmr': 'tomorrow',
  'tom': 'tomorrow',
  'tod': 'today',
  'mon': 'monday',
  'tue': 'tuesday',
  'wed': 'wednesday',
  'thu': 'thursday',
  'fri': 'friday',
  'sat': 'saturday',
  'sun': 'sunday',
};

// Helper for the Date Picker input to parse just a date string
export const parseDateString = (input: string): Date | null => {
    const parser = (chrono as any).parse ? (chrono as any) : (chrono as any).default ? (chrono as any).default : chrono;
    if (!parser || !parser.parse) return null;
    
    const results = parser.parse(input);
    if (results.length > 0) {
        return results[0].start.date();
    }
    return null;
}

export const parseTaskInput = (input: string, companies: Company[]): ParsedTask => {
  let cleanTitle = input;
  let linkedCompany: Company | null = null;
  let dueDate: Date | null = null;
  let extractedDateText: string | null = null;
  let originalDateText: string | null = null;
  let hasTime = false;
  let matchedMention: string | null = null;
  const highlightRanges: { start: number; end: number; type: 'date' | 'mention' }[] = [];

  // 1. Parse Mentions (Match against Company list directly)
  // We strictly look for @Name now to support the "type @ to search" feature flow better
  const sortedCompanies = [...companies].sort((a, b) => b.name.length - a.name.length);
  
  for (const company of sortedCompanies) {
      const escapedName = company.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Case insensitive match for @Company
      const regex = new RegExp(`@${escapedName}\\b`, 'i');
      const match = input.match(regex);
      
      if (match) {
          linkedCompany = company;
          matchedMention = match[0];
          highlightRanges.push({
              start: match.index!,
              end: match.index! + match[0].length,
              type: 'mention'
          });
          break; 
      }
  }

  // 2. Token-Based Date Parsing
  const words = cleanTitle.split(/(\s+)/); 
  
  let expandedText = '';
  // Map identifying the start/end index in the expanded string for each *meaningful* token (non-whitespace)
  const tokenMap: { start: number, end: number, wordIndex: number, original: string, originalStartIndex: number }[] = [];
  
  let currentOriginalIndex = 0;

  words.forEach((word, index) => {
    if (!word.trim()) {
      expandedText += word;
      currentOriginalIndex += word.length;
      return;
    }
    
    const lower = word.toLowerCase();
    const expansion = SHORTHANDS[lower] || word;
    
    const start = expandedText.length;
    expandedText += expansion;
    const end = expandedText.length;
    
    tokenMap.push({
      start,
      end,
      wordIndex: index,
      original: word,
      originalStartIndex: currentOriginalIndex
    });
    currentOriginalIndex += word.length;
  });

  const parser = (chrono as any).parse ? (chrono as any) : (chrono as any).default ? (chrono as any).default : chrono;

  if (parser && parser.parse) {
    const dateResults = parser.parse(expandedText);

    if (dateResults.length > 0) {
      // Prefer results with time if multiple exist, otherwise take first
      const result = dateResults.find((r: any) => r.start.isCertain('hour')) || dateResults[0];
      
      dueDate = result.start.date();
      hasTime = result.start.isCertain('hour');
      
      const resultStart = result.index;
      const resultEnd = result.index + result.text.length;
      
      const matchingTokens = tokenMap.filter(t => 
        (t.start < resultEnd && t.end > resultStart)
      );

      if (matchingTokens.length > 0) {
         const firstToken = matchingTokens[0];
         const lastToken = matchingTokens[matchingTokens.length - 1];
         
         const extractedWords = words.slice(firstToken.wordIndex, lastToken.wordIndex + 1);
         extractedDateText = extractedWords.join('');
         originalDateText = extractedDateText; 

         const originalStart = firstToken.originalStartIndex;
         const originalEnd = lastToken.originalStartIndex + lastToken.original.length;

         highlightRanges.push({
             start: originalStart,
             end: originalEnd,
             type: 'date'
         });
      }
    }
  }

  // Clean Title Construction (Removing highlights for final output)
  const sortedRanges = [...highlightRanges].sort((a, b) => b.start - a.start);
  let previewTitle = input;
  
  for (const range of sortedRanges) {
      previewTitle = previewTitle.slice(0, range.start) + previewTitle.slice(range.end);
  }
  
  cleanTitle = previewTitle.replace(/\s+/g, ' ').trim();

  return {
    cleanTitle,
    dueDate,
    linkedCompany,
    extractedDateText,
    hasTime,
    matchedMention,
    originalDateText,
    highlightRanges
  };
};
