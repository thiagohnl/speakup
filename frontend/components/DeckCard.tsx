'use client';

import { DeckMeta } from '@/types';

interface Props {
  meta: DeckMeta;
  selected: boolean;
  onClick: () => void;
}

export default function DeckCard({ meta, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-l-4 transition-all ${
        selected ? 'bg-white/10 ring-1' : 'bg-white/5 hover:bg-white/10'
      }`}
      style={{
        borderLeftColor: meta.accentColour,
        boxShadow: selected ? `0 0 0 1px ${meta.accentColour}` : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{meta.emoji}</span>
        <span className="font-semibold text-text-primary text-sm">{meta.name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span>{meta.phraseCount} phrases</span>
        {meta.lastPlayed && (
          <span>Last: {new Date(meta.lastPlayed).toLocaleDateString()}</span>
        )}
      </div>
    </button>
  );
}
