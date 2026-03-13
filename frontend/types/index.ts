export interface DrillCard {
  id: string;
  deck: string;
  situation: string;
  phrase: string;
  tip: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface MatchResult {
  passed: boolean;
  score: number;
  missedWords: string[];
}

export interface SessionResult {
  phraseId: string;
  passed: boolean;
  score: number;
  attempts: number;
}

export interface UserProgress {
  streak: number;
  lastActiveDate: string;
  totalSessionsCompleted: number;
  totalPhrasesNailed: number;
  deckProgress: Record<string, DeckProgress>;
}

export interface DeckProgress {
  played: number;
  nailed: number;
  lastPlayed: string;
}

export interface DeckMeta {
  id: string;
  name: string;
  emoji: string;
  phraseCount: number;
  lastPlayed: string | null;
  accentColour: string;
}

export type DrillState = 'IDLE' | 'SHOWING' | 'SPEAKING' | 'LISTENING' | 'RESULT' | 'NEXT' | 'COMPLETE';
