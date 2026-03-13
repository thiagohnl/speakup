import { MatchResult } from '@/types';

const STOP_WORDS = new Set([
  'the', 'and', 'is', 'to', 'a', 'in', 'of', 'for', 'that', 'it',
  'be', 'with', 'as', 'at', 'this', 'by', 'from', 'or', 'an',
  'are', 'was', 'were', 'been', 'has', 'have', 'had', 'do', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can',
  'not', 'but', 'if', 'so', 'yet', 'nor', 'both', 'either',
]);

export function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length >= 3);
}

export function extractKeyWords(words: string[]): string[] {
  return words.filter(w => !STOP_WORDS.has(w));
}

export function checkPhrase(spoken: string, model: string): MatchResult {
  const spokenKeys = new Set(extractKeyWords(normalize(spoken)));
  const modelKeys = extractKeyWords(normalize(model));

  if (modelKeys.length === 0) {
    return { passed: true, score: 1, missedWords: [] };
  }

  const missedWords: string[] = [];
  let matched = 0;

  for (const word of modelKeys) {
    if (spokenKeys.has(word)) {
      matched++;
    } else {
      missedWords.push(word);
    }
  }

  const score = matched / modelKeys.length;

  return {
    passed: score >= 0.6,
    score,
    missedWords,
  };
}
