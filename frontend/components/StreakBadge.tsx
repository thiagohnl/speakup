'use client';

interface Props {
  streak: number;
}

export default function StreakBadge({ streak }: Props) {
  if (streak <= 0) return null;

  return (
    <div className="flex items-center gap-1.5 bg-amber/20 text-amber px-3 py-1.5 rounded-full text-sm font-semibold">
      <span>🔥</span>
      <span>{streak}</span>
    </div>
  );
}
