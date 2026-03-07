/**
 * userProgress.ts
 * All user progress stored in localStorage. No backend required.
 */
import type { UserProgress, CoachPlan, ContextProgress, RecentActivity } from '@/types';

const STORAGE_KEY = 'speakup_progress';

const CONTEXTS = [
  'job-interviews',
  'church-prayer',
  'church-announcements',
  'presentations',
  'storytelling',
  'general',
];

function defaultContextProgress(): Record<string, ContextProgress> {
  return Object.fromEntries(
    CONTEXTS.map(c => [c, { phrasesLearned: 0, totalPhrases: 0, lastPracticed: '' }])
  );
}

function defaultProgress(): UserProgress {
  return {
    streak: 0,
    lastActiveDate: '',
    learnedPhrases: [],
    savedPhrases: [],
    learnedVocab: [],
    practiceSessionsCount: 0,
    prayerSessionsCount: 0,
    contextProgress: defaultContextProgress(),
    currentPlan: null,
    recentActivity: [],
  };
}

export function getUserProgress(): UserProgress {
  if (typeof window === 'undefined') return defaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as UserProgress;
    // Ensure all contexts exist (handles users upgrading from older data)
    for (const ctx of CONTEXTS) {
      if (!parsed.contextProgress[ctx]) {
        parsed.contextProgress[ctx] = { phrasesLearned: 0, totalPhrases: 0, lastPracticed: '' };
      }
    }
    return parsed;
  } catch {
    return defaultProgress();
  }
}

export function saveUserProgress(p: UserProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function incrementStreak(): void {
  const p = getUserProgress();
  const today = new Date().toISOString().slice(0, 10);
  const last = p.lastActiveDate;

  if (last === today) return; // already counted today

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  p.streak = last === yesterday ? p.streak + 1 : 1;
  p.lastActiveDate = today;
  saveUserProgress(p);
}

function addActivity(p: UserProgress, activity: RecentActivity): void {
  p.recentActivity = [activity, ...p.recentActivity].slice(0, 20);
}

export function markPhraselearned(id: string, context: string): void {
  const p = getUserProgress();
  if (!p.learnedPhrases.includes(id)) {
    p.learnedPhrases.push(id);
    const ctx = p.contextProgress[context];
    if (ctx) ctx.phrasesLearned = p.learnedPhrases.filter(pid => pid.startsWith(context)).length;
    addActivity(p, { action: 'learned_phrase', target: id, timestamp: new Date().toISOString() });
    incrementStreak();
  }
  saveUserProgress(p);
}

export function markPhraseSaved(id: string): void {
  const p = getUserProgress();
  if (!p.savedPhrases.includes(id)) {
    p.savedPhrases.push(id);
    addActivity(p, { action: 'saved_phrase', target: id, timestamp: new Date().toISOString() });
  } else {
    // Toggle off
    p.savedPhrases = p.savedPhrases.filter(pid => pid !== id);
  }
  saveUserProgress(p);
}

export function markVocabLearned(id: string, context: string): void {
  const p = getUserProgress();
  if (!p.learnedVocab.includes(id)) {
    p.learnedVocab.push(id);
    addActivity(p, { action: 'learned_vocab', target: id, timestamp: new Date().toISOString() });
    incrementStreak();
    void context; // context used for future ring tracking
  }
  saveUserProgress(p);
}

export function incrementPracticeCount(): void {
  const p = getUserProgress();
  p.practiceSessionsCount += 1;
  addActivity(p, { action: 'practice_session', target: '', timestamp: new Date().toISOString() });
  incrementStreak();
  saveUserProgress(p);
}

export function incrementPrayerCount(): void {
  const p = getUserProgress();
  p.prayerSessionsCount += 1;
  addActivity(p, { action: 'prayer_session', target: '', timestamp: new Date().toISOString() });
  incrementStreak();
  saveUserProgress(p);
}

export function updateContextPracticed(context: string): void {
  const p = getUserProgress();
  const ctx = p.contextProgress[context];
  if (ctx) ctx.lastPracticed = new Date().toISOString().slice(0, 10);
  saveUserProgress(p);
}

export function setTotalPhrasesForContext(context: string, total: number): void {
  const p = getUserProgress();
  if (p.contextProgress[context]) {
    p.contextProgress[context].totalPhrases = total;
  }
  saveUserProgress(p);
}

export function saveCoachPlan(plan: CoachPlan): void {
  const p = getUserProgress();
  p.currentPlan = plan;
  saveUserProgress(p);
}

export function isPlanStale(): boolean {
  const p = getUserProgress();
  if (!p.currentPlan) return true;
  const generated = new Date(p.currentPlan.generatedAt).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Date.now() - generated > oneDayMs;
}

/** Returns the context with the lowest learned/total ratio */
export function getWeakestContext(): string {
  const p = getUserProgress();
  let weakest = CONTEXTS[0];
  let lowestRatio = Infinity;

  for (const ctx of CONTEXTS) {
    const { phrasesLearned, totalPhrases } = p.contextProgress[ctx];
    const ratio = totalPhrases > 0 ? phrasesLearned / totalPhrases : 0;
    if (ratio < lowestRatio) {
      lowestRatio = ratio;
      weakest = ctx;
    }
  }
  return weakest;
}
