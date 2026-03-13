'use client';

import { getAchievementDef } from '@/lib/achievements';

interface Props {
  achievementIds: string[];
}

export default function AchievementToast({ achievementIds }: Props) {
  if (achievementIds.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-text-secondary text-center uppercase tracking-wider">Achievements Unlocked</p>
      <div className="flex flex-wrap justify-center gap-2">
        {achievementIds.map(id => {
          const def = getAchievementDef(id);
          if (!def) return null;
          return (
            <div
              key={id}
              className="flex items-center gap-2 bg-amber/10 border border-amber/30 rounded-full px-3 py-1.5 animate-badge-reveal"
            >
              <span className="text-lg">{def.icon}</span>
              <span className="text-sm font-semibold text-amber">{def.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
