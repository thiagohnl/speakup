'use client';

interface Props {
  streak: number;
}

export default function StreakBadge({ streak }: Props) {
  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3 py-1">
      <span className="text-base">🔥</span>
      <span className="text-sm font-semibold text-amber-400">{streak} day streak</span>
    </div>
  );
}
