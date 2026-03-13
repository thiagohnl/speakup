'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeckMeta } from '@/types';
import { getDeckMeta, getSmartMixDeck } from '@/lib/decks';
import { getStreak, getProgress, getTodayXP, getLevelTitle } from '@/lib/userProgress';
import { isSupported } from '@/lib/speechRecognition';
import DeckCard from '@/components/DeckCard';
import StreakBadge from '@/components/StreakBadge';
import DailyGoalRing from '@/components/DailyGoalRing';
import { AlertTriangle, BarChart3 } from 'lucide-react';

const SESSION_LENGTHS = [3, 5, 10];

export default function Home() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckMeta[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(0);
  const [dailyXP, setDailyXP] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(100);
  const [loading, setLoading] = useState(false);
  const [sttAvailable, setSttAvailable] = useState(true);

  useEffect(() => {
    setDecks(getDeckMeta());
    setStreak(getStreak());
    setSttAvailable(isSupported());
    const p = getProgress();
    setLevel(p.level);
    setDailyGoal(p.dailyGoal);
    setDailyXP(getTodayXP());
  }, []);

  const handleStart = async () => {
    if (!selectedDeck || loading) return;
    setLoading(true);

    try {
      // Smart Mix: build client-side, skip API
      if (selectedDeck === 'smart-mix') {
        const cards = getSmartMixDeck();
        if (cards.length === 0) {
          setLoading(false);
          return;
        }
        sessionStorage.setItem('current_deck', JSON.stringify(cards));
        router.push(`/drill?deck=smart-mix&minutes=${selectedMinutes}`);
        return;
      }

      const res = await fetch('/api/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck: selectedDeck }),
      });
      const cards = await res.json();

      if (!cards || cards.length === 0) {
        setLoading(false);
        return;
      }

      sessionStorage.setItem('current_deck', JSON.stringify(cards));
      router.push(`/drill?deck=${selectedDeck}&minutes=${selectedMinutes}`);
    } catch {
      setLoading(false);
    }
  };

  const selectedMeta = decks.find(d => d.id === selectedDeck);
  const accentColour = selectedMeta?.accentColour || '#00E5CC';

  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl text-teal">SpeakUp</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/progress')}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-text-secondary"
          >
            <BarChart3 size={20} />
          </button>
          <StreakBadge streak={streak} />
        </div>
      </div>

      {/* Level + Daily XP */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary">Lv.{level}</span>
          <span className="text-xs text-text-secondary">{getLevelTitle(level)}</span>
        </div>
        <DailyGoalRing current={dailyXP} goal={dailyGoal} accentColour="#00E5CC" />
      </div>

      {/* STT warning */}
      {!sttAvailable && (
        <div className="flex items-center gap-2 bg-amber/10 border border-amber/30 text-amber rounded-xl p-3 mb-6 text-sm">
          <AlertTriangle size={18} />
          <span>Your browser doesn&apos;t support speech recognition. You can still drill by typing.</span>
        </div>
      )}

      {/* Subtitle */}
      <h2 className="text-text-secondary text-lg mb-4">What are you training today?</h2>

      {/* Deck grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {/* Smart Mix card */}
        <button
          onClick={() => setSelectedDeck('smart-mix')}
          className={`col-span-2 text-left p-4 rounded-xl border transition-all ${
            selectedDeck === 'smart-mix'
              ? 'bg-white/10 ring-1 ring-teal'
              : 'bg-white/5 hover:bg-white/10'
          }`}
          style={{
            borderColor: '#00E5CC',
            borderWidth: '1px',
            background: selectedDeck === 'smart-mix'
              ? 'linear-gradient(135deg, rgba(0,229,204,0.1), rgba(201,146,42,0.1))'
              : undefined,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🧠</span>
            <span className="font-semibold text-text-primary text-sm">Smart Mix</span>
            <span className="text-xs bg-teal/20 text-teal px-2 py-0.5 rounded-full ml-auto">Recommended</span>
          </div>
          <p className="text-xs text-text-secondary">Your weak phrases from all decks, powered by spaced repetition</p>
        </button>

        {decks.map(d => (
          <DeckCard
            key={d.id}
            meta={d}
            selected={selectedDeck === d.id}
            onClick={() => setSelectedDeck(d.id)}
          />
        ))}
      </div>

      {/* Session length */}
      <div className="mb-8">
        <p className="text-text-secondary text-sm mb-3">Session length</p>
        <div className="flex gap-3">
          {SESSION_LENGTHS.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMinutes(m)}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                selectedMinutes === m
                  ? 'text-navy'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10'
              }`}
              style={selectedMinutes === m ? { backgroundColor: accentColour } : undefined}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <div className="mt-auto">
        <button
          onClick={handleStart}
          disabled={!selectedDeck || loading}
          className="w-full py-4 rounded-2xl font-semibold text-navy text-lg transition-all disabled:opacity-30"
          style={{ backgroundColor: accentColour }}
        >
          {loading ? 'Loading deck...' : 'Start Drilling'}
        </button>
      </div>
    </div>
  );
}
