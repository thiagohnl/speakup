'use client';

import { useState } from 'react';
import { Check, Bookmark, BookmarkCheck, Copy } from 'lucide-react';
import type { KeyPhrase } from '@/types';

interface Props {
  phrase: KeyPhrase;
  isLearned: boolean;
  isSaved: boolean;
  onLearned: (id: string) => void;
  onSaved: (id: string) => void;
}

export default function PhraseCard({ phrase, isLearned, isSaved, onLearned, onSaved }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(phrase.phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
        isLearned ? 'border-teal/30 bg-teal/5' : 'border-white/10 bg-white/5'
      }`}
    >
      <p className="text-base font-semibold text-text-primary leading-snug">&ldquo;{phrase.phrase}&rdquo;</p>
      {phrase.when_to_use && (
        <p className="mt-2 text-sm text-text-secondary">{phrase.when_to_use}</p>
      )}
      {!phrase.when_to_use && phrase.context && (
        <p className="mt-2 text-sm text-text-secondary">{phrase.context}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onLearned(phrase.id)}
          className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-colors active:scale-95 ${
            isLearned
              ? 'bg-teal text-navy'
              : 'border border-teal/30 bg-teal/10 text-teal'
          }`}
        >
          <Check className="h-4 w-4" />
          {isLearned ? 'Learned' : 'Mark Learned'}
        </button>

        <button
          onClick={() => onSaved(phrase.id)}
          className={`flex min-h-[40px] w-11 items-center justify-center rounded-xl transition-colors active:scale-95 ${
            isSaved
              ? 'bg-amber/20 text-amber-400'
              : 'border border-white/10 bg-white/5 text-text-secondary'
          }`}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>

        <button
          onClick={handleCopy}
          className="flex min-h-[40px] w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-text-secondary transition-colors active:scale-95"
        >
          {copied ? <Check className="h-4 w-4 text-teal" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
