'use client';

interface Props {
  current: number;
  goal: number;
  accentColour: string;
}

export default function DailyGoalRing({ current, goal, accentColour }: Props) {
  const pct = Math.min(1, current / goal);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-2">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <circle
          cx="22" cy="22" r={radius} fill="none"
          stroke={accentColour} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-xs text-text-secondary">Daily XP</span>
        <span className="text-sm font-bold text-text-primary">{current}/{goal}</span>
      </div>
    </div>
  );
}
