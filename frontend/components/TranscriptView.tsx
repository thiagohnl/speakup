'use client';

import { FillerWordResult } from '@/types';

interface TranscriptViewProps {
  transcript: string;
  fillerWords: FillerWordResult[];
}

export default function TranscriptView({ transcript, fillerWords }: TranscriptViewProps) {
  if (!transcript) return null;

  // Build highlighted transcript
  const sortedFillers = [...fillerWords].sort((a, b) => a.position - b.position);
  const segments: { text: string; isFiller: boolean }[] = [];
  let lastIndex = 0;

  for (const filler of sortedFillers) {
    if (filler.position > lastIndex) {
      segments.push({ text: transcript.slice(lastIndex, filler.position), isFiller: false });
    }
    segments.push({
      text: transcript.slice(filler.position, filler.position + filler.word.length),
      isFiller: true,
    });
    lastIndex = filler.position + filler.word.length;
  }

  if (lastIndex < transcript.length) {
    segments.push({ text: transcript.slice(lastIndex), isFiller: false });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="mb-3 text-sm font-semibold text-text-secondary">Transcript</p>
      <div className="max-h-64 overflow-y-auto font-mono text-sm leading-relaxed text-text-primary">
        {segments.map((seg, i) =>
          seg.isFiller ? (
            <span key={i} className="rounded bg-amber/30 px-0.5 text-amber">
              {seg.text}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </div>
    </div>
  );
}
