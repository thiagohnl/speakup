'use client';

import { DeckMeta, CrownTier } from '@/types';

interface Props {
  meta: DeckMeta;
  selected: boolean;
  onClick: () => void;
}

const CROWN_ICONS: Record<CrownTier, string> = {
  none: '',
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
};

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
        {meta.crownTier !== 'none' && (
          <span className="text-sm ml-auto">{CROWN_ICONS[meta.crownTier]}</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span>{meta.phraseCount} phrases</span>
        {meta.masteryPercent > 0 && (
          <span style={{ color: meta.accentColour }}>{meta.masteryPercent}% mastered</span>
        )}
      </div>
      {/* Mastery progress bar */}
      {meta.masteryPercent > 0 && (
        <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${meta.masteryPercent}%`, backgroundColor: meta.accentColour }}
          />
        </div>
      )}
    </button>
  );
}
