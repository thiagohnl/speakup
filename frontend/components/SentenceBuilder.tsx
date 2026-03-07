'use client';

import { useState } from 'react';
import { Loader2, Copy, Check, Wand2 } from 'lucide-react';
import type { SentenceVersion } from '@/types';

const LEVEL_COLORS: Record<string, string> = {
  Simple: '#94A3B8',
  Clear: '#60A5FA',
  Confident: '#00E5CC',
  Polished: '#A78BFA',
  Powerful: '#F59E0B',
};

interface Props {
  context: string;
}

export default function SentenceBuilder({ context }: Props) {
  const [idea, setIdea] = useState('');
  const [versions, setVersions] = useState<SentenceVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleBuild = async () => {
    if (!idea.trim()) return;
    setIsLoading(true);
    setError('');
    setVersions([]);

    try {
      const res = await fetch('/api/sentence-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, context }),
      });
      if (!res.ok) throw new Error('Failed to build sentences');
      const data: SentenceVersion[] = await res.json();
      setVersions(data);
    } catch {
      setError('Could not build sentences. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Type a rough idea and I&apos;ll show you 5 ways to say it — from simple to powerful.
      </p>

      <textarea
        value={idea}
        onChange={e => setIdea(e.target.value)}
        placeholder="e.g. I want to say I'm excited about this opportunity..."
        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-text-primary placeholder-text-secondary/50 resize-none focus:border-teal/40 focus:outline-none"
        rows={3}
      />

      <button
        onClick={handleBuild}
        disabled={!idea.trim() || isLoading}
        className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-teal text-navy font-semibold transition-transform active:scale-95 disabled:opacity-50"
      >
        {isLoading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Building...</>
        ) : (
          <><Wand2 className="h-4 w-4" /> Build Sentences</>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {versions.length > 0 && (
        <div className="space-y-3 pt-2">
          {versions.map((v, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: LEVEL_COLORS[v.level] ?? '#00E5CC' }}
                >
                  {v.level}
                </span>
                <button
                  onClick={() => handleCopy(v.sentence, i)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-text-secondary"
                >
                  {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-teal" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">&ldquo;{v.sentence}&rdquo;</p>
              {v.note && (
                <p className="mt-2 text-xs text-text-secondary italic">{v.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
