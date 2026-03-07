'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Props {
  contextId: string;
  label: string;
  icon: string;
  phraseCount: number;
  learnedCount: number;
}

export default function TopicCard({ contextId, label, icon, phraseCount, learnedCount }: Props) {
  const percentage = phraseCount > 0 ? Math.round((learnedCount / phraseCount) * 100) : 0;

  return (
    <Link
      href={`/learn/${contextId}`}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-transform active:scale-95"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal/10 text-2xl">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {phraseCount > 0 ? `${phraseCount} phrases` : 'No phrases yet'}
          {learnedCount > 0 ? ` · ${learnedCount} learned` : ''}
        </p>
        {phraseCount > 0 && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-teal transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
      <ChevronRight className="h-5 w-5 flex-shrink-0 text-text-secondary" />
    </Link>
  );
}
