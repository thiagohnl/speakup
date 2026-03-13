'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProgress, DeckMeta, CrownTier } from '@/types';
import { getProgress, getLevelTitle, getMasteredCount } from '@/lib/userProgress';
import { getDeckMeta } from '@/lib/decks';
import LevelProgressBar from '@/components/LevelProgressBar';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import AchievementGrid from '@/components/AchievementGrid';
import { ArrowLeft, Target, Flame, Brain, TrendingUp } from 'lucide-react';

const CROWN_ICONS: Record<CrownTier, string> = {
  none: '',
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
};

export default function ProgressPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [decks, setDecks] = useState<DeckMeta[]>([]);

  useEffect(() => {
    setProgress(getProgress());
    setDecks(getDeckMeta());
  }, []);

  if (!progress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  const mastered = getMasteredCount();
  const avgScore = Object.values(progress.phraseRecords).length > 0
    ? Math.round(
        Object.values(progress.phraseRecords).reduce((sum, r) => sum + r.lastScore, 0) /
        Object.values(progress.phraseRecords).length * 100
      )
    : 0;

  const stats = [
    { icon: Target, label: 'Sessions', value: progress.totalSessionsCompleted, colour: '#00E5CC' },
    { icon: Brain, label: 'Mastered', value: mastered, colour: '#22C55E' },
    { icon: Flame, label: 'Streak', value: progress.streak, colour: '#F59E0B' },
    { icon: TrendingUp, label: 'Avg Score', value: `${avgScore}%`, colour: '#00E5CC' },
  ];

  return (
    <div className="flex flex-col min-h-screen p-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-full bg-white/5 hover:bg-white/10">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="font-display text-2xl text-teal">Your Progress</h1>
      </div>

      {/* Level card */}
      <div className="bg-white/5 rounded-2xl p-5 mb-6">
        <div className="text-center mb-4">
          <p className="text-5xl font-bold text-teal">{progress.level}</p>
          <p className="text-text-secondary text-sm mt-1">{getLevelTitle(progress.level)}</p>
          <p className="text-xs text-text-secondary mt-0.5">{progress.totalXP} total XP</p>
        </div>
        <LevelProgressBar level={progress.level} totalXP={progress.totalXP} accentColour="#00E5CC" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map(({ icon: Icon, label, value, colour }) => (
          <div key={label} className="bg-white/5 rounded-xl p-4 text-center">
            <Icon size={22} className="mx-auto mb-1.5" style={{ color: colour }} />
            <p className="text-xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Activity heatmap */}
      <div className="bg-white/5 rounded-xl p-4 mb-6">
        <ActivityHeatmap history={progress.dailyXPHistory} accentColour="#00E5CC" />
      </div>

      {/* Deck mastery */}
      <div className="mb-6">
        <p className="text-xs text-text-secondary mb-3 uppercase tracking-wider">Deck Mastery</p>
        <div className="flex flex-col gap-2">
          {decks.map(d => (
            <div key={d.id} className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span>{d.emoji}</span>
                  <span className="text-sm font-semibold text-text-primary">{d.name}</span>
                  {d.crownTier !== 'none' && <span>{CROWN_ICONS[d.crownTier]}</span>}
                </div>
                <span className="text-xs text-text-secondary">{d.masteryPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${d.masteryPercent}%`, backgroundColor: d.accentColour }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <AchievementGrid unlocked={progress.achievements} />
    </div>
  );
}
