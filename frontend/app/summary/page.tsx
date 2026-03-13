'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SessionResult, SessionRecordResult, DrillCard } from '@/types';
import { recordSession, updateStreak, getStreak, getProgress } from '@/lib/userProgress';
import SessionSummary from '@/components/SessionSummary';
import LevelProgressBar from '@/components/LevelProgressBar';
import AchievementToast from '@/components/AchievementToast';
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
  const [recordResult, setRecordResult] = useState<SessionRecordResult | null>(null);
  const [totalXP, setTotalXP] = useState(0);

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

        // Build cardLevels from the deck stored in sessionStorage
        const deckRaw = sessionStorage.getItem('current_deck');
        const cardLevels: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {};
        if (deckRaw) {
          const cards = JSON.parse(deckRaw) as DrillCard[];
          cards.forEach(c => { cardLevels[c.id] = c.level; });
        }

        const result = recordSession(deck, parsed, cardLevels);
        setRecordResult(result);
        updateStreak();
        setStreak(getStreak());
        setTotalXP(getProgress().totalXP);
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

  const leveledUp = recordResult && recordResult.newLevel > recordResult.previousLevel;

  return (
    <div className="flex flex-col min-h-screen p-6">
      <h1 className="font-display text-3xl text-center mb-2" style={{ color: accent }}>
        Session Complete!
      </h1>
      <p className="text-text-secondary text-center mb-6">Great work — every rep counts.</p>

      {/* XP earned */}
      {recordResult && (
        <div className="text-center mb-4 animate-fade-in">
          <span className="text-3xl font-bold" style={{ color: accent }}>+{recordResult.totalXP} XP</span>
          {recordResult.streakMultiplier > 1 && (
            <span className="text-sm text-amber ml-2">({recordResult.streakMultiplier}x streak bonus)</span>
          )}
        </div>
      )}

      {/* Level up celebration */}
      {leveledUp && (
        <div className="text-center mb-4 animate-level-up">
          <p className="text-amber text-lg font-bold">Level Up!</p>
          <p className="text-text-secondary text-sm">You reached Level {recordResult!.newLevel}</p>
        </div>
      )}

      {/* Level progress bar */}
      {recordResult && (
        <div className="mb-6">
          <LevelProgressBar level={recordResult.newLevel} totalXP={totalXP} accentColour={accent} />
        </div>
      )}

      {/* Original stats */}
      <SessionSummary results={results} streak={streak} deck={deck} />

      {/* Newly mastered phrases */}
      {recordResult && recordResult.newlyMastered.length > 0 && (
        <div className="mt-4 text-center animate-fade-in">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Phrases Mastered</p>
          <p className="text-success font-semibold">
            {recordResult.newlyMastered.length} phrase{recordResult.newlyMastered.length > 1 ? 's' : ''} mastered!
          </p>
        </div>
      )}

      {/* Achievements */}
      {recordResult && recordResult.newAchievements.length > 0 && (
        <div className="mt-4">
          <AchievementToast achievementIds={recordResult.newAchievements.map(a => a.id)} />
        </div>
      )}

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
