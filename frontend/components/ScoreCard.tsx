'use client';

import { SpeechMetrics } from '@/types';

function getWPMColor(wpm: number): string {
  if (wpm >= 120 && wpm <= 160) return '#22C55E';
  if (wpm > 200) return '#EF4444';
  return '#F59E0B';
}

function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-semibold">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-teal transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

interface ScoreCardProps {
  metrics: SpeechMetrics;
  onTryAgain?: () => void;
}

export default function ScoreCard({ metrics, onTryAgain }: ScoreCardProps) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* WPM callout */}
      {metrics.wordsPerMinute > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-text-secondary">Words Per Minute</p>
          <p
            className="mt-1 text-5xl font-bold"
            style={{ color: getWPMColor(metrics.wordsPerMinute) }}
          >
            {metrics.wordsPerMinute}
          </p>
          <p className="mt-1 text-xs text-text-secondary">Target: 120-160 wpm</p>
        </div>
      )}

      {/* Filler words */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-text-secondary">Filler Words</p>
          <p className="text-2xl font-bold text-amber">{metrics.fillerWords.length}</p>
        </div>
        {metrics.fillerWords.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from(new Set(metrics.fillerWords.map(f => f.word))).map(word => {
              const count = metrics.fillerWords.filter(f => f.word === word).length;
              return (
                <span
                  key={word}
                  className="rounded-full bg-amber/20 px-3 py-1 text-xs text-amber"
                >
                  &quot;{word}&quot; x{count}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Score bars */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <ScoreBar label="Clarity" value={metrics.clarityScore} />
        <ScoreBar label="Vocabulary Richness" value={Math.round(metrics.vocabularyRichness * 10)} />
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
        <div className="rounded-2xl border border-teal/30 bg-teal/10 p-6">
          <p className="text-sm font-semibold text-teal">Top Tips</p>
          <ol className="mt-2 space-y-2">
            {metrics.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-text-primary">
                <span className="font-bold text-teal">{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {onTryAgain && (
        <button
          onClick={onTryAgain}
          className="w-full min-h-[48px] rounded-xl bg-teal text-navy font-semibold transition-transform active:scale-95"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
