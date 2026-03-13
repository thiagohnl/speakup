'use client';

interface Props {
  xp: number;
  accentColour: string;
}

export default function XPPopup({ xp, accentColour }: Props) {
  if (xp <= 0) return null;

  return (
    <div
      className="text-lg font-bold animate-xp-float pointer-events-none"
      style={{ color: accentColour }}
    >
      +{xp} XP
    </div>
  );
}
