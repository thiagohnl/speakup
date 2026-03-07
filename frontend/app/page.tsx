'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StreakBadge from '@/components/StreakBadge';
import PlanCard from '@/components/PlanCard';
import ProgressRing from '@/components/ProgressRing';
import { getUserProgress, isPlanStale, saveCoachPlan, setTotalPhrasesForContext } from '@/lib/userProgress';
import { getPhraseCountByContext } from '@/lib/contentLibrary';
import type { UserProgress, CoachPlan, RecentActivity } from '@/types';

const CONTEXTS = [
  { id: 'job-interviews', label: 'Job Interviews' },
  { id: 'church-prayer', label: 'Church Prayer' },
  { id: 'church-announcements', label: 'Church Announcements' },
  { id: 'presentations', label: 'Presentations' },
  { id: 'storytelling', label: 'Storytelling' },
  { id: 'general', label: 'General' },
];

const ACTIVITY_LABELS: Record<string, string> = {
  learned_phrase: 'Learned a phrase',
  saved_phrase: 'Saved a phrase',
  learned_vocab: 'Learned a word',
  practice_session: 'Practice session',
  prayer_session: 'Prayer session',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    const p = getUserProgress();

    // Sync total phrase counts from content library
    for (const ctx of CONTEXTS) {
      const total = getPhraseCountByContext(ctx.id);
      if (total > 0) setTotalPhrasesForContext(ctx.id, total);
    }

    setProgress(getUserProgress());

    // Fetch coach plan if stale
    if (isPlanStale()) {
      setPlanLoading(true);
      fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextProgress: p.contextProgress }),
      })
        .then(r => r.json())
        .then((plan: CoachPlan) => {
          saveCoachPlan(plan);
          setProgress(getUserProgress());
        })
        .catch(() => {/* plan stays null — PlanCard handles this */})
        .finally(() => setPlanLoading(false));
    }
  }, []);

  const streak = progress?.streak ?? 0;
  const plan = progress?.currentPlan ?? null;
  const activity: RecentActivity[] = progress?.recentActivity.slice(0, 3) ?? [];

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-6 pt-10 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{getGreeting()}</p>
          <h1 className="font-display text-3xl text-text-primary">Your Coach</h1>
        </div>
        <StreakBadge streak={streak} />
      </div>

      {/* Today's Focus */}
      <div className="mt-6">
        <PlanCard task={plan?.todayTask ?? null} isLoading={planLoading} />
      </div>

      {/* Progress Rings */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4">
          Your Progress
        </h2>
        <div className="grid grid-cols-6 gap-2">
          {CONTEXTS.map(ctx => {
            const cp = progress?.contextProgress[ctx.id];
            return (
              <Link key={ctx.id} href={`/learn/${ctx.id}`}>
                <ProgressRing
                  label={ctx.id}
                  learned={cp?.phrasesLearned ?? 0}
                  total={cp?.totalPhrases ?? 0}
                />
              </Link>
            );
          })}
        </div>
        <Link href="/progress" className="mt-3 block text-right text-xs text-teal underline">
          View full progress →
        </Link>
      </div>

      {/* Recent Activity */}
      {activity.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {activity.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
              >
                <span className="text-sm text-text-primary">
                  {ACTIVITY_LABELS[a.action] ?? a.action}
                </span>
                <span className="text-xs text-text-secondary">
                  {new Date(a.timestamp).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links when no activity yet */}
      {activity.length === 0 && !planLoading && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-text-secondary text-sm">Ready to start?</p>
          <p className="mt-1 text-text-primary font-semibold">Tap Learn to build your vocabulary</p>
          <Link
            href="/learn"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal px-6 text-navy font-semibold text-sm transition-transform active:scale-95"
          >
            Go to Learn
          </Link>
        </div>
      )}
    </div>
  );
}
