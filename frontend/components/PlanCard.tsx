'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { TodayTask } from '@/types';

interface Props {
  task: TodayTask | null;
  isLoading?: boolean;
}

export default function PlanCard({ task, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
        <div className="h-4 w-32 rounded bg-white/10 mb-3" />
        <div className="h-6 w-full rounded bg-white/10 mb-2" />
        <div className="h-4 w-3/4 rounded bg-white/10" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal mb-1">
          Today&apos;s Focus
        </p>
        <p className="text-text-primary font-semibold">Start learning phrases</p>
        <p className="mt-1 text-sm text-text-secondary">
          Pick any context below to begin building your vocabulary.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal/20 bg-teal/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal mb-1">
        Today&apos;s Focus
      </p>
      <p className="text-lg font-semibold text-text-primary">{task.label}</p>
      <p className="mt-1 text-sm text-text-secondary">{task.description}</p>
      <Link
        href={task.target}
        className="mt-4 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal text-navy font-semibold text-sm transition-transform active:scale-95"
      >
        Start <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
