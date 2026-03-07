'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProgressRing from '@/components/ProgressRing';
import { getUserProgress, getWeakestContext } from '@/lib/userProgress';
import type { UserProgress } from '@/types';

const CONTEXTS = [
  { id: 'job-interviews', label: 'Job Interviews', icon: '💼' },
  { id: 'church-prayer', label: 'Church Prayer', icon: '🙏' },
  { id: 'church-announcements', label: 'Church Announcements', icon: '📢' },
  { id: 'presentations', label: 'Presentations & Pitches', icon: '🎤' },
  { id: 'storytelling', label: 'Casual Storytelling', icon: '💬' },
  { id: 'general', label: 'General Public Speaking', icon: '🗣️' },
];

const CONTEXT_LABELS: Record<string, string> = Object.fromEntries(
  CONTEXTS.map(c => [c.id, c.label])
);

export default function ProgressPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [weakest, setWeakest] = useState('');

  useEffect(() => {
    const p = getUserProgress();
    setProgress(p);
    setWeakest(getWeakestContext());
  }, []);

  if (!progress) return null;

  const totalSaved = progress.savedPhrases.length;
  const totalLearned = progress.learnedPhrases.length + progress.learnedVocab.length;

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-6 pt-10">
      <h1 className="font-display text-3xl text-text-primary">Progress</h1>
      <p className="mt-1 text-sm text-text-secondary">Your learning journey</p>

      {/* Streak */}
      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <span className="text-4xl">🔥</span>
        <div>
          <p className="text-3xl font-bold text-text-primary">{progress.streak}</p>
          <p className="text-sm text-text-secondary">day streak</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard value={totalLearned} label="Items learned" />
        <StatCard value={totalSaved} label="Phrases saved" />
        <StatCard value={progress.practiceSessionsCount} label="Sessions" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatCard value={progress.prayerSessionsCount} label="Prayers practiced" />
        <StatCard value={progress.learnedPhrases.length} label="Phrases learned" />
      </div>

      {/* Progress Rings */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4">
          By Context
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {CONTEXTS.map(ctx => {
            const cp = progress.contextProgress[ctx.id];
            return (
              <div key={ctx.id} className="flex flex-col items-center gap-2">
                <ProgressRing
                  label={ctx.id}
                  learned={cp?.phrasesLearned ?? 0}
                  total={cp?.totalPhrases ?? 0}
                  size={80}
                />
                <p className="text-xs text-text-secondary text-center leading-tight">{ctx.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weakest area nudge */}
      {weakest && (
        <div className="mt-8 rounded-2xl border border-amber/20 bg-amber/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            Focus area
          </p>
          <p className="text-text-primary font-semibold">
            {CONTEXT_LABELS[weakest] ?? weakest}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            This is your weakest area. A little practice here will make a big difference.
          </p>
          <Link
            href={`/learn/${weakest}`}
            className="mt-4 flex min-h-[44px] items-center justify-center rounded-xl bg-amber/20 text-amber-400 font-semibold text-sm transition-transform active:scale-95"
          >
            Practice {CONTEXT_LABELS[weakest] ?? weakest}
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  );
}
