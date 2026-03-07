'use client';

import { useState } from 'react';
import { Check, Bookmark, BookmarkCheck, Copy } from 'lucide-react';
import type { VocabularyItem } from '@/types';

interface Props {
  item: VocabularyItem;
  isLearned: boolean;
  isSaved: boolean;
  onLearned: (id: string) => void;
  onSaved: (id: string) => void;
}

export default function VocabCard({ item, isLearned, isSaved, onLearned, onSaved }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${item.word}: ${item.example_sentence}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
        isLearned ? 'border-teal/30 bg-teal/5' : 'border-white/10 bg-white/5'
      }`}
    >
      <p className="text-lg font-bold text-text-primary">{item.word}</p>
      <p className="mt-1 text-sm text-text-secondary">{item.meaning}</p>
      {item.example_sentence && (
        <p className="mt-3 text-sm text-text-primary/80 italic border-l-2 border-teal/30 pl-3">
          &ldquo;{item.example_sentence}&rdquo;
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onLearned(item.id)}
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
          onClick={() => onSaved(item.id)}
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
