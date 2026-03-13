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
  xpEarned: number;
}

export type MasteryLevel = 'new' | 'learning' | 'practiced' | 'mastered';
export type CrownTier = 'none' | 'bronze' | 'silver' | 'gold';
export type DailyGoalTier = 50 | 100 | 200;

export interface PhraseRecord {
  phraseId: string;
  deckId: string;
  masteryLevel: MasteryLevel;
  successCount: number;
  attemptCount: number;
  lastScore: number;
  lastPracticed: string;
  nextDue: string;
  consecutivePasses: number;
  highScoreCount: number; // passes with score >= 0.80, used for mastered promotion
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export interface DailyXP {
  date: string;
  xp: number;
}

export interface UserProgress {
  streak: number;
  lastActiveDate: string;
  totalSessionsCompleted: number;
  totalPhrasesNailed: number;
  deckProgress: Record<string, DeckProgress>;
  totalXP: number;
  level: number;
  dailyGoal: DailyGoalTier;
  dailyXPHistory: DailyXP[];
  phraseRecords: Record<string, PhraseRecord>;
  achievements: UnlockedAchievement[];
}

export interface DeckProgress {
  played: number;
  nailed: number;
  lastPlayed: string;
  crownTier: CrownTier;
}

export interface DeckMeta {
  id: string;
  name: string;
  emoji: string;
  phraseCount: number;
  lastPlayed: string | null;
  accentColour: string;
  masteryPercent: number;
  crownTier: CrownTier;
}

export type DrillState = 'IDLE' | 'SHOWING' | 'SPEAKING' | 'LISTENING' | 'RESULT' | 'NEXT' | 'COMPLETE';

export interface SessionRecordResult {
  totalXP: number;
  streakMultiplier: number;
  previousLevel: number;
  newLevel: number;
  newlyMastered: string[];
  newAchievements: UnlockedAchievement[];
}
