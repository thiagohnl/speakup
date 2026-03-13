'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SessionResult } from '@/types';
import { recordSession, updateStreak, getStreak } from '@/lib/userProgress';
import SessionSummary from '@/components/SessionSummary';
import { RotateCcw, Home } from 'lucide-react';

export default function SummaryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-text-secondary">Loading...</p></div>}>
      <SummaryContent />
    </Suspense>
  );
}

function SummaryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deck = searchParams.get('deck') || '';
  const savedRef = useRef(false);

  const [results, setResults] = useState<SessionResult[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('session_results');
      if (!raw) {
        router.replace('/');
        return;
      }

      const parsed = JSON.parse(raw) as SessionResult[];
      setResults(parsed);

      if (!savedRef.current) {
        savedRef.current = true;
        recordSession(deck, parsed);
        updateStreak();
        setStreak(getStreak());
      }
    } catch {
      router.replace('/');
    }
  }, [deck, router]);

  const isChurch = deck.startsWith('church-');
  const accent = isChurch ? '#C9922A' : '#00E5CC';

  const handleDrillAgain = () => {
    sessionStorage.removeItem('session_results');
    sessionStorage.removeItem('current_deck');
    router.push('/');
  };

  const handleChangeDeck = () => {
    sessionStorage.removeItem('session_results');
    sessionStorage.removeItem('current_deck');
    router.push('/');
  };

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6">
      <h1 className="font-display text-3xl text-center mb-2" style={{ color: accent }}>
        Session Complete!
      </h1>
      <p className="text-text-secondary text-center mb-8">Great work — every rep counts.</p>

      <SessionSummary results={results} streak={streak} deck={deck} />

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <button
          onClick={handleDrillAgain}
          className="w-full py-4 rounded-2xl font-semibold text-navy text-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: accent }}
        >
          <RotateCcw size={20} />
          Drill Again
        </button>
        <button
          onClick={handleChangeDeck}
          className="w-full py-3 rounded-2xl font-semibold text-text-secondary bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2"
        >
          <Home size={18} />
          Change Deck
        </button>
      </div>
    </div>
  );
}
