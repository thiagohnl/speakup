'use client';

import { DailyXP } from '@/types';

interface Props {
  history: DailyXP[];
  accentColour: string;
}

export default function ActivityHeatmap({ history, accentColour }: Props) {
  // Build 56-day grid (8 weeks)
  const today = new Date();
  const days: { date: string; xp: number }[] = [];

  for (let i = 55; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = history.find(h => h.date === dateStr);
    days.push({ date: dateStr, xp: entry?.xp || 0 });
  }

  const maxXP = Math.max(...days.map(d => d.xp), 1);

  function getOpacity(xp: number): number {
    if (xp === 0) return 0.05;
    return 0.2 + (xp / maxXP) * 0.8;
  }

  // Group into weeks (7 columns)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div>
      <p className="text-xs text-text-secondary mb-2">Activity (8 weeks)</p>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(day => (
              <div
                key={day.date}
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: accentColour, opacity: getOpacity(day.xp) }}
                title={`${day.date}: ${day.xp} XP`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
