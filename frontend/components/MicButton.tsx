'use client';

import { Mic } from 'lucide-react';

interface Props {
  state: 'idle' | 'listening' | 'disabled';
  accentColour: string;
  onClick: () => void;
}

export default function MicButton({ state, accentColour, onClick }: Props) {
  const isDisabled = state === 'disabled';
  const isListening = state === 'listening';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {isListening && (
          <div
            className="absolute inset-0 rounded-full animate-pulse-ring"
            style={{ backgroundColor: accentColour }}
          />
        )}
        <button
          onClick={onClick}
          disabled={isDisabled}
          className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all"
          style={{
            backgroundColor: isDisabled ? '#334155' : accentColour,
            opacity: isDisabled ? 0.4 : 1,
          }}
        >
          <Mic size={32} color="#0A0F1E" />
        </button>
      </div>
      <span className="text-xs text-text-secondary">
        {isListening ? 'Listening...' : isDisabled ? '' : 'Tap to speak'}
      </span>
    </div>
  );
}
