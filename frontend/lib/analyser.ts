import { FillerWordResult } from '@/types';

const FILLER_WORDS = [
  'um', 'uh', 'er', 'like', 'so', 'basically',
  'literally', 'right', 'you know', 'kind of', 'sort of', 'actually'
];

const JUST_FILLER_PATTERNS = [
  'lord just', 'father just', 'god just'
];

export function countFillers(transcript: string): {
  fillerWords: FillerWordResult[];
  fillerWordRate: number;
} {
  const lower = transcript.toLowerCase();
  const words = transcript.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const fillerWords: FillerWordResult[] = [];

  for (const filler of FILLER_WORDS) {
    let searchFrom = 0;
    while (true) {
      const idx = lower.indexOf(filler, searchFrom);
      if (idx === -1) break;

      // Ensure it's a word boundary match
      const before = idx === 0 || /\s|[.,!?;:]/.test(lower[idx - 1]);
      const afterIdx = idx + filler.length;
      const after = afterIdx >= lower.length || /\s|[.,!?;:]/.test(lower[afterIdx]);

      if (before && after) {
        const contextStart = Math.max(0, idx - 30);
        const contextEnd = Math.min(transcript.length, idx + filler.length + 30);
        fillerWords.push({
          word: filler,
          position: idx,
          context: transcript.slice(contextStart, contextEnd).trim(),
        });
      }
      searchFrom = idx + filler.length;
    }
  }

  fillerWords.sort((a, b) => a.position - b.position);

  return {
    fillerWords,
    fillerWordRate: totalWords > 0 ? (fillerWords.length / totalWords) * 100 : 0,
  };
}

export function countJustFillers(transcript: string): number {
  const lower = transcript.toLowerCase();
  let count = 0;
  for (const pattern of JUST_FILLER_PATTERNS) {
    let searchFrom = 0;
    while (true) {
      const idx = lower.indexOf(pattern, searchFrom);
      if (idx === -1) break;
      count++;
      searchFrom = idx + pattern.length;
    }
  }
  return count;
}

export function calculateWPM(wordCount: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.round((wordCount / durationSeconds) * 60);
}

export function calculateVocabularyRichness(transcript: string): number {
  const words = transcript.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const unique = new Set(words);
  return Number((unique.size / words.length).toFixed(2));
}
