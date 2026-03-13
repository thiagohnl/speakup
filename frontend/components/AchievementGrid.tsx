'use client';

import { UnlockedAchievement } from '@/types';
import { getAllAchievements } from '@/lib/achievements';

interface Props {
  unlocked: UnlockedAchievement[];
}

export default function AchievementGrid({ unlocked }: Props) {
  const all = getAllAchievements();
  const unlockedIds = new Set(unlocked.map(a => a.id));

  return (
    <div>
      <p className="text-xs text-text-secondary mb-3 uppercase tracking-wider">Achievements</p>
      <div className="grid grid-cols-3 gap-2">
        {all.map(a => {
          const isUnlocked = unlockedIds.has(a.id);
          return (
            <div
              key={a.id}
              className={`flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                isUnlocked ? 'bg-white/10' : 'bg-white/5 opacity-40'
              }`}
            >
              <span className="text-2xl mb-1">{a.icon}</span>
              <span className="text-xs font-semibold text-text-primary leading-tight">{a.name}</span>
              <span className="text-[10px] text-text-secondary mt-0.5 leading-tight">{a.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
