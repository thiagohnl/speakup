import { UserProgress, SessionResult } from '@/types';

const STORAGE_KEY = 'speakup_progress';

const DEFAULT_PROGRESS: UserProgress = {
  streak: 0,
  lastActiveDate: '',
  totalSessionsCompleted: 0,
  totalPhrasesNailed: 0,
  deckProgress: {},
};

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') return { ...DEFAULT_PROGRESS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
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

  if (p.lastActiveDate === today) return; // Already counted today

  if (p.lastActiveDate === yesterday) {
    p.streak += 1;
  } else {
    p.streak = 1;
  }

  p.lastActiveDate = today;
  saveProgress(p);
}

export function recordSession(deck: string, results: SessionResult[]): void {
  const p = getProgress();
  p.totalSessionsCompleted += 1;

  const nailed = results.filter(r => r.passed).length;
  p.totalPhrasesNailed += nailed;

  if (!p.deckProgress[deck]) {
    p.deckProgress[deck] = { played: 0, nailed: 0, lastPlayed: '' };
  }
  p.deckProgress[deck].played += results.length;
  p.deckProgress[deck].nailed += nailed;
  p.deckProgress[deck].lastPlayed = getToday();

  saveProgress(p);
}

export function getStreak(): number {
  return getProgress().streak;
}

export function getDeckLastPlayed(deck: string): string | null {
  const dp = getProgress().deckProgress[deck];
  return dp?.lastPlayed || null;
}
