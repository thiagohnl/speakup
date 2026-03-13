import {
  UserProgress, SessionResult, PhraseRecord,
  MasteryLevel, DailyXP, SessionRecordResult,
} from '@/types';
import { checkNewAchievements } from './achievements';

const STORAGE_KEY = 'speakup_progress';

const DEFAULT_PROGRESS: UserProgress = {
  streak: 0,
  lastActiveDate: '',
  totalSessionsCompleted: 0,
  totalPhrasesNailed: 0,
  deckProgress: {},
  totalXP: 0,
  level: 0,
  dailyGoal: 100,
  dailyXPHistory: [],
  phraseRecords: {},
  achievements: [],
};

// ── Date helpers ──

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── XP Engine ──

const LEVEL_TITLES: Record<number, string> = {
  0: 'Newcomer',
  1: 'Beginner',
  2: 'Novice Speaker',
  3: 'Finding Your Voice',
  4: 'Getting Confident',
  5: 'Rising Voice',
  6: 'Conversationalist',
  7: 'Steady Speaker',
  8: 'Articulate',
  9: 'Polished',
  10: 'Silver Tongue',
  11: 'Persuasive',
  12: 'Compelling',
  13: 'Charismatic',
  14: 'Captivating',
  15: 'Eloquent',
  16: 'Spellbinding',
  17: 'Legendary',
  18: 'Iconic',
  19: 'Grandmaster',
  20: 'Master Orator',
};

export function xpForLevel(level: number): number {
  return 50 * level * level;
}

export function getLevelFromXP(totalXP: number): number {
  let level = 0;
  while (xpForLevel(level + 1) <= totalXP) level++;
  return level;
}

export function getLevelTitle(level: number): string {
  if (level >= 20) return LEVEL_TITLES[20];
  return LEVEL_TITLES[level] || `Level ${level}`;
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  return 1.0;
}

export function calculatePhraseXP(
  score: number,
  passed: boolean,
  attempts: number,
  level: 'beginner' | 'intermediate' | 'advanced',
): number {
  let xp = 5; // base
  if (passed) {
    xp += 10;
    if (score >= 0.80) xp += 5;
    if (score >= 0.95) xp += 5;
    if (attempts === 1) xp += 5; // first-attempt bonus
  }
  if (level === 'intermediate') xp += 3;
  if (level === 'advanced') xp += 6;
  return xp;
}

// ── Spaced repetition intervals ──

const MASTERY_INTERVALS: Record<MasteryLevel, number> = {
  new: 0,
  learning: 1,
  practiced: 3,
  mastered: 7,
};

function getNextDue(masteryLevel: MasteryLevel, today: string): string {
  return addDays(today, MASTERY_INTERVALS[masteryLevel]);
}

// ── Mastery tracking ──

function updatePhraseRecord(
  record: PhraseRecord,
  passed: boolean,
  score: number,
  today: string,
): { record: PhraseRecord; newlyMastered: boolean } {
  const r = { ...record };
  r.attemptCount += 1;
  r.lastScore = score;
  r.lastPracticed = today;

  let newlyMastered = false;

  if (passed) {
    r.successCount += 1;
    r.consecutivePasses += 1;
    if (score >= 0.80) r.highScoreCount += 1;

    // Promotion logic
    const prev = r.masteryLevel;
    if (r.masteryLevel === 'new') {
      r.masteryLevel = 'learning';
    } else if (r.masteryLevel === 'learning' && r.consecutivePasses >= 3) {
      r.masteryLevel = 'practiced';
    } else if (r.masteryLevel === 'practiced' && r.consecutivePasses >= 5 && r.highScoreCount >= 2) {
      r.masteryLevel = 'mastered';
    }
    if (r.masteryLevel === 'mastered' && prev !== 'mastered') {
      newlyMastered = true;
    }
  } else {
    r.consecutivePasses = 0;
    r.highScoreCount = 0;
    // Demotion: mastered→practiced, practiced→learning, learning stays learning
    if (r.masteryLevel === 'mastered') r.masteryLevel = 'practiced';
    else if (r.masteryLevel === 'practiced') r.masteryLevel = 'learning';
  }

  r.nextDue = passed ? getNextDue(r.masteryLevel, today) : today; // fail = immediately due
  return { record: r, newlyMastered };
}

function createPhraseRecord(phraseId: string, deckId: string): PhraseRecord {
  return {
    phraseId,
    deckId,
    masteryLevel: 'new',
    successCount: 0,
    attemptCount: 0,
    lastScore: 0,
    lastPracticed: '',
    nextDue: '',
    consecutivePasses: 0,
    highScoreCount: 0,
  };
}

// ── Daily XP history ──

function updateDailyXPHistory(history: DailyXP[], xp: number, today: string): DailyXP[] {
  const updated = [...history];
  const todayEntry = updated.find(e => e.date === today);
  if (todayEntry) {
    todayEntry.xp += xp;
  } else {
    updated.push({ date: today, xp });
  }
  // Keep only last 56 days (8 weeks)
  const cutoff = addDays(today, -56);
  return updated.filter(e => e.date >= cutoff);
}

// ── Public API ──

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') return { ...DEFAULT_PROGRESS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      // Ensure nested defaults for new fields on old data
      phraseRecords: parsed.phraseRecords || {},
      achievements: parsed.achievements || [],
      dailyXPHistory: parsed.dailyXPHistory || [],
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(p: UserProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function updateStreak(): void {
  const p = getProgress();
  const today = getToday();
  const yesterday = getYesterday();

  if (p.lastActiveDate === today) return;

  if (p.lastActiveDate === yesterday) {
    p.streak += 1;
  } else {
    p.streak = 1;
  }

  p.lastActiveDate = today;
  saveProgress(p);
}

export function recordSession(
  deck: string,
  results: SessionResult[],
  cardLevels: Record<string, 'beginner' | 'intermediate' | 'advanced'>,
): SessionRecordResult {
  const p = getProgress();
  const today = getToday();
  const previousLevel = getLevelFromXP(p.totalXP);

  p.totalSessionsCompleted += 1;
  const nailed = results.filter(r => r.passed).length;
  p.totalPhrasesNailed += nailed;

  // Deck progress
  if (!p.deckProgress[deck]) {
    p.deckProgress[deck] = { played: 0, nailed: 0, lastPlayed: '', crownTier: 'none' };
  }
  p.deckProgress[deck].played += results.length;
  p.deckProgress[deck].nailed += nailed;
  p.deckProgress[deck].lastPlayed = today;

  // Per-phrase mastery + XP
  let sessionXP = 0;
  const newlyMastered: string[] = [];

  for (const result of results) {
    // XP
    const level = cardLevels[result.phraseId] || 'beginner';
    const phraseXP = calculatePhraseXP(result.score, result.passed, result.attempts, level);
    sessionXP += phraseXP;

    // Mastery
    if (!p.phraseRecords[result.phraseId]) {
      p.phraseRecords[result.phraseId] = createPhraseRecord(result.phraseId, deck);
    }
    const { record, newlyMastered: justMastered } = updatePhraseRecord(
      p.phraseRecords[result.phraseId], result.passed, result.score, today,
    );
    p.phraseRecords[result.phraseId] = record;
    if (justMastered) newlyMastered.push(result.phraseId);
  }

  // Apply streak multiplier
  const multiplier = getStreakMultiplier(p.streak);
  const totalXP = Math.floor(sessionXP * multiplier);

  p.totalXP += totalXP;
  p.level = getLevelFromXP(p.totalXP);
  p.dailyXPHistory = updateDailyXPHistory(p.dailyXPHistory, totalXP, today);

  // Update crown tier for this deck
  p.deckProgress[deck].crownTier = computeCrownTier(deck, p.phraseRecords);

  // Check achievements
  const existingIds = p.achievements.map(a => a.id);
  const newAchievementIds: string[] = checkNewAchievements(p, existingIds, results);
  const newAchievements = newAchievementIds.map(id => ({ id, unlockedAt: today }));
  p.achievements.push(...newAchievements);

  const newLevel = p.level;
  saveProgress(p);

  return {
    totalXP,
    streakMultiplier: multiplier,
    previousLevel,
    newLevel,
    newlyMastered,
    newAchievements,
  };
}

// ── Crown tier calculation ──

function computeCrownTier(deckId: string, phraseRecords: Record<string, PhraseRecord>): 'none' | 'bronze' | 'silver' | 'gold' {
  const deckPhrases = Object.values(phraseRecords).filter(r => r.deckId === deckId);
  if (deckPhrases.length === 0) return 'none';

  // We need total phrases in deck to calculate mastery %.
  // Since we only know about attempted phrases, we use attempted count.
  // getDeckMeta() in decks.ts will do the proper calculation with full deck size.
  const mastered = deckPhrases.filter(r => r.masteryLevel === 'mastered').length;
  const total = deckPhrases.length;
  const pct = mastered / total;

  if (pct >= 1.0) return 'gold';
  if (pct >= 0.75) return 'silver';
  if (pct >= 0.5) return 'bronze';
  return 'none';
}

// ── Smart Mix ──

export function getSmartMixPhraseIds(phraseRecords: Record<string, PhraseRecord>, allPhraseIds: string[]): string[] {
  const today = getToday();

  // Phrases that are due (attempted before and nextDue <= today)
  const due = Object.values(phraseRecords)
    .filter(r => r.nextDue <= today && r.masteryLevel !== 'new')
    .sort((a, b) => {
      // Lowest consecutivePasses first, then oldest lastPracticed
      if (a.consecutivePasses !== b.consecutivePasses) return a.consecutivePasses - b.consecutivePasses;
      return a.lastPracticed.localeCompare(b.lastPracticed);
    })
    .map(r => r.phraseId);

  const selected = due.slice(0, 15);

  // Fill with never-attempted phrases
  if (selected.length < 15) {
    const attempted = new Set(Object.keys(phraseRecords));
    const fresh = allPhraseIds.filter(id => !attempted.has(id));
    // Shuffle fresh
    for (let i = fresh.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
    }
    selected.push(...fresh.slice(0, 15 - selected.length));
  }

  return selected;
}

// ── Convenience getters ──

export function getStreak(): number {
  return getProgress().streak;
}

export function getDeckLastPlayed(deck: string): string | null {
  const dp = getProgress().deckProgress[deck];
  return dp?.lastPlayed || null;
}

export function getTodayXP(): number {
  const p = getProgress();
  const today = getToday();
  const entry = p.dailyXPHistory.find(e => e.date === today);
  return entry?.xp || 0;
}

export function getMasteredCount(): number {
  const p = getProgress();
  return Object.values(p.phraseRecords).filter(r => r.masteryLevel === 'mastered').length;
}

export function getDeckMasteryPercent(deckId: string, totalPhrases: number): number {
  const p = getProgress();
  const mastered = Object.values(p.phraseRecords)
    .filter(r => r.deckId === deckId && r.masteryLevel === 'mastered').length;
  return totalPhrases > 0 ? Math.round((mastered / totalPhrases) * 100) : 0;
}

export function getDeckCrownTier(deckId: string, totalPhrases: number): 'none' | 'bronze' | 'silver' | 'gold' {
  const p = getProgress();
  const mastered = Object.values(p.phraseRecords)
    .filter(r => r.deckId === deckId && r.masteryLevel === 'mastered').length;
  const pct = totalPhrases > 0 ? mastered / totalPhrases : 0;
  if (pct >= 1.0) return 'gold';
  if (pct >= 0.75) return 'silver';
  if (pct >= 0.5) return 'bronze';
  return 'none';
}
