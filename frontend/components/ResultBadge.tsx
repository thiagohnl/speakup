'use client';

import { MatchResult } from '@/types';
import { Check, RotateCcw, ArrowRight } from 'lucide-react';

interface Props {
  result: MatchResult;
  attempts: number;
  maxRetries: number;
}

export default function ResultBadge({ result, attempts, maxRetries }: Props) {
  const { score, missedWords } = result;

  if (score >= 0.6) {
    return (
      <div className="animate-scale-in text-center">
        <div className="inline-flex items-center gap-2 bg-success/20 text-success px-4 py-2 rounded-full mb-2">
          <Check size={18} />
          <span className="font-semibold">Nailed it!</span>
        </div>
        <p className="text-text-secondary text-sm">{Math.round(score * 100)}% match</p>
      </div>
    );
  }

  if (score >= 0.35) {
    return (
      <div className="animate-scale-in text-center">
        <div className="inline-flex items-center gap-2 bg-amber/20 text-amber px-4 py-2 rounded-full mb-2">
          <RotateCcw size={18} />
          <span className="font-semibold">So close!</span>
        </div>
        <p className="text-text-secondary text-sm mb-1">{Math.round(score * 100)}% match</p>
        {missedWords.length > 0 && (
          <p className="text-text-secondary text-xs">
            Missed: {missedWords.slice(0, 5).join(', ')}
          </p>
        )}
      </div>
    );
  }

  // Score < 0.35
  const forcingNext = attempts >= maxRetries;

  return (
    <div className="animate-scale-in text-center">
      <div className="inline-flex items-center gap-2 bg-error/20 text-error px-4 py-2 rounded-full mb-2">
        {forcingNext ? <ArrowRight size={18} /> : <RotateCcw size={18} />}
        <span className="font-semibold">{forcingNext ? 'Moving on...' : 'Try again'}</span>
      </div>
      <p className="text-text-secondary text-sm">{Math.round(score * 100)}% match</p>
    </div>
  );
}
