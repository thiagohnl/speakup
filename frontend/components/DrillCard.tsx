'use client';

import { DrillCard as DrillCardType } from '@/types';

interface Props {
  card: DrillCardType;
  accentColour: string;
  animating: boolean;
}

export default function DrillCard({ card, accentColour, animating }: Props) {
  return (
    <div
      className={`rounded-2xl border p-6 ${animating ? 'animate-slide-in' : 'animate-fade-in'}`}
      style={{ borderColor: accentColour + '33' }}
    >
      <p className="text-text-secondary text-sm mb-4">{card.situation}</p>
      <p className="font-display text-xl leading-relaxed" style={{ color: accentColour }}>
        {card.phrase}
      </p>
    </div>
  );
}
