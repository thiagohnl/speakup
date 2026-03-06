'use client';

import { Mic, Upload, BookOpen, HandMetal, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import ModeCard from '@/components/ModeCard';

const STEPS = [
  { num: '1', text: 'Pick a mode' },
  { num: '2', text: 'Pick a scenario' },
  { num: '3', text: 'Practice' },
  { num: '4', text: 'Get feedback' },
];

function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-8 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full min-h-[48px] items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-semibold text-text-primary">How it works</span>
        <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex justify-between gap-2">
            {STEPS.map(s => (
              <div key={s.num} className="flex flex-1 flex-col items-center gap-2 text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-sm font-bold text-teal">
                  {s.num}
                </div>
                <span className="text-xs text-text-secondary">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="animate-fade-in mx-auto max-w-lg px-6 pt-12">
      <h1 className="font-display text-4xl text-text-primary">SpeakUp</h1>
      <p className="mt-2 text-lg text-text-secondary">
        Train your voice. Own the room.
      </p>

      <div className="mt-10 flex flex-col gap-4">
        <ModeCard
          title="Live Practice"
          description="Real-time AI conversation practice"
          icon={Mic}
          color="#00E5CC"
          href="/live"
        />
        <ModeCard
          title="Recording Review"
          description="Upload or record, get detailed feedback"
          icon={Upload}
          color="#F59E0B"
          href="/review"
        />
        <ModeCard
          title="Tips Feed"
          description="Curated public speaking videos"
          icon={BookOpen}
          color="#8B5CF6"
          href="/tips"
        />
        <ModeCard
          title="Prayer Mode"
          description="Practice church speaking with confidence"
          icon={HandMetal}
          color="#C9922A"
          href="/prayer"
        />
      </div>

      <HowItWorks />
    </div>
  );
}
