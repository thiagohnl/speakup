'use client';

import { PrayerMetrics } from '@/types';
import { CheckCircle2, Circle } from 'lucide-react';

function ScoreBar({ label, value, max = 10, color = '#C9922A' }: { label: string; value: number; max?: number; color?: string }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-semibold">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

const STRUCTURE_PARTS = [
  { key: 'address' as const, label: 'Address' },
  { key: 'acknowledgement' as const, label: 'Acknowledgement' },
  { key: 'intercession' as const, label: 'Intercession' },
  { key: 'close' as const, label: 'Close' },
];

const LENGTH_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  too_short: { bg: 'bg-amber/20', text: 'text-amber', label: 'Too Short' },
  ideal: { bg: 'bg-success/20', text: 'text-success', label: 'Ideal' },
  too_long: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Too Long' },
};

interface PrayerScoreCardProps {
  metrics: PrayerMetrics;
  onTryAgain?: () => void;
}

export default function PrayerScoreCard({ metrics, onTryAgain }: PrayerScoreCardProps) {
  const lengthStyle = LENGTH_COLORS[metrics.lengthRating] ?? LENGTH_COLORS.ideal;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Structure breakdown */}
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-gold">Prayer Structure</p>
          <p className="text-2xl font-bold text-gold">{metrics.structureScore}/10</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {STRUCTURE_PARTS.map(({ key, label }) => {
            const present = metrics.structureBreakdown[key];
            return (
              <div key={key} className="flex items-center gap-2">
                {present ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-text-secondary" />
                )}
                <span className={`text-sm ${present ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filler counts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-xs text-text-secondary">&quot;Just&quot; Fillers</p>
          <p className={`mt-1 text-3xl font-bold ${metrics.justFillerCount > 3 ? 'text-red-400' : 'text-text-primary'}`}>
            {metrics.justFillerCount}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-xs text-text-secondary">Standard Fillers</p>
          <p className="mt-1 text-3xl font-bold text-amber">
            {metrics.fillerWordList.length}
          </p>
        </div>
      </div>

      {/* Length rating */}
      <div className="flex justify-center">
        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${lengthStyle.bg} ${lengthStyle.text}`}>
          Length: {lengthStyle.label}
        </span>
      </div>

      {/* Score bars */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <ScoreBar label="Warmth" value={metrics.warmthScore} color="#C9922A" />
        <ScoreBar label="Clarity" value={metrics.clarityScore} color="#C9922A" />
      </div>

      {/* Highlight */}
      {metrics.highlight && (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-6">
          <p className="text-sm font-semibold text-success">What you did well</p>
          <p className="mt-2 text-text-primary">{metrics.highlight}</p>
        </div>
      )}

      {/* Tips */}
      {metrics.tips.length > 0 && (
        <div className="rounded-2xl border border-gold/30 bg-gold/10 p-6">
          <p className="text-sm font-semibold text-gold">Top Tips</p>
          <ol className="mt-2 space-y-2">
            {metrics.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-text-primary">
                <span className="font-bold text-gold">{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {onTryAgain && (
        <button
          onClick={onTryAgain}
          className="w-full min-h-[48px] rounded-xl bg-gold text-navy font-semibold transition-transform active:scale-95"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
