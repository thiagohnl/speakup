'use client';

import { xpForLevel, getLevelTitle } from '@/lib/userProgress';

interface Props {
  level: number;
  totalXP: number;
  accentColour: string;
}

export default function LevelProgressBar({ level, totalXP, accentColour }: Props) {
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const progressXP = totalXP - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const pct = neededXP > 0 ? Math.min(100, Math.round((progressXP / neededXP) * 100)) : 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text-primary">Lv.{level}</span>
          <span className="text-sm text-text-secondary">{getLevelTitle(level)}</span>
        </div>
        <span className="text-xs text-text-secondary">{progressXP} / {neededXP} XP</span>
      </div>
      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: accentColour }}
        />
      </div>
    </div>
  );
}
