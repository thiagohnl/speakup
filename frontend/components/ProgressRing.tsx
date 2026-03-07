'use client';

interface Props {
  label: string;
  learned: number;
  total: number;
  color?: string;
  size?: number;
}

const CONTEXT_ICONS: Record<string, string> = {
  'job-interviews': '💼',
  'church-prayer': '🙏',
  'church-announcements': '📢',
  'presentations': '🎤',
  'storytelling': '💬',
  'general': '🗣️',
};

export default function ProgressRing({
  label,
  learned,
  total,
  color = '#00E5CC',
  size = 72,
}: Props) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? learned / total : 0;
  const dashOffset = circumference * (1 - progress);
  const percentage = Math.round(progress * 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={4}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base">{CONTEXT_ICONS[label] ?? '🗣️'}</span>
        </div>
      </div>
      <span className="text-xs text-text-secondary text-center leading-tight max-w-[64px]">
        {percentage}%
      </span>
    </div>
  );
}
