'use client';

interface Props {
  elapsed: number;
  total: number;
  accentColour: string;
}

export default function ProgressBar({ elapsed, total, accentColour }: Props) {
  const remaining = Math.max(0, 1 - elapsed / total);

  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-linear"
        style={{
          width: `${remaining * 100}%`,
          backgroundColor: accentColour,
        }}
      />
    </div>
  );
}
