import { UserProgress, SessionResult } from '@/types';

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (p: UserProgress, sessionResults?: SessionResult[]) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  // Session milestones
  { id: 'first-session', name: 'First Steps', description: 'Complete your first drill session', icon: '👣',
    check: (p) => p.totalSessionsCompleted >= 1 },
  { id: 'ten-sessions', name: 'Dedicated', description: 'Complete 10 drill sessions', icon: '⭐',
    check: (p) => p.totalSessionsCompleted >= 10 },
  { id: 'fifty-sessions', name: 'Committed', description: 'Complete 50 drill sessions', icon: '🏆',
    check: (p) => p.totalSessionsCompleted >= 50 },

  // Streak milestones
  { id: 'streak-7', name: 'One Week Strong', description: 'Reach a 7-day streak', icon: '🔥',
    check: (p) => p.streak >= 7 },
  { id: 'streak-30', name: 'Monthly Master', description: 'Reach a 30-day streak', icon: '🔥',
    check: (p) => p.streak >= 30 },

  // Mastery milestones
  { id: 'first-mastery', name: 'First Mastery', description: 'Master your first phrase', icon: '✅',
    check: (p) => countMastered(p) >= 1 },
  { id: 'ten-mastered', name: 'Growing Arsenal', description: 'Master 10 phrases', icon: '💪',
    check: (p) => countMastered(p) >= 10 },
  { id: 'fifty-mastered', name: 'Phrase Collector', description: 'Master 50 phrases', icon: '📚',
    check: (p) => countMastered(p) >= 50 },
  { id: 'hundred-mastered', name: 'Walking Dictionary', description: 'Master 100 phrases', icon: '🧠',
    check: (p) => countMastered(p) >= 100 },

  // Perfect session
  { id: 'perfect-session', name: 'Flawless', description: 'Nail every phrase in a session (min 5)', icon: '🎯',
    check: (_p, results) => {
      if (!results || results.length < 5) return false;
      return results.every(r => r.passed);
    }},

  // Crown milestones
  { id: 'deck-bronze', name: 'Bronze Crown', description: 'Reach 50% mastery on any deck', icon: '🥉',
    check: (p) => hasCrown(p, 'bronze') },
  { id: 'deck-silver', name: 'Silver Crown', description: 'Reach 75% mastery on any deck', icon: '🥈',
    check: (p) => hasCrown(p, 'silver') },
  { id: 'deck-gold', name: 'Gold Crown', description: 'Reach 100% mastery on any deck', icon: '🥇',
    check: (p) => hasCrown(p, 'gold') },

  // Level milestones
  { id: 'level-5', name: 'Rising Voice', description: 'Reach Level 5', icon: '📈',
    check: (p) => p.level >= 5 },
  { id: 'level-10', name: 'Silver Tongue', description: 'Reach Level 10', icon: '🎤',
    check: (p) => p.level >= 10 },
];

function countMastered(p: UserProgress): number {
  return Object.values(p.phraseRecords).filter(r => r.masteryLevel === 'mastered').length;
}

function hasCrown(p: UserProgress, tier: 'bronze' | 'silver' | 'gold'): boolean {
  const tiers = { bronze: 1, silver: 2, gold: 3 };
  const minTier = tiers[tier];
  return Object.values(p.deckProgress).some(dp => {
    const t = tiers[dp.crownTier as 'bronze' | 'silver' | 'gold'] || 0;
    return t >= minTier;
  });
}

export function checkNewAchievements(
  progress: UserProgress,
  existingIds: string[],
  sessionResults?: SessionResult[],
): string[] {
  const existing = new Set(existingIds);
  return ACHIEVEMENTS
    .filter(a => !existing.has(a.id) && a.check(progress, sessionResults))
    .map(a => a.id);
}

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAllAchievements(): AchievementDef[] {
  return ACHIEVEMENTS;
}
