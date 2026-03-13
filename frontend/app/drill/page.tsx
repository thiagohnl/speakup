'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DrillCard as DrillCardType, DrillState, MatchResult, SessionResult } from '@/types';
import { checkPhrase } from '@/lib/phraseMatch';
import { speakPhrase, stopSpeaking } from '@/lib/speechSynthesis';
import { isSupported, listenForPhrase } from '@/lib/speechRecognition';
import { calculatePhraseXP } from '@/lib/userProgress';
import DrillCard from '@/components/DrillCard';
import MicButton from '@/components/MicButton';
import ResultBadge from '@/components/ResultBadge';
import ProgressBar from '@/components/ProgressBar';
import XPPopup from '@/components/XPPopup';
import { Volume2, SkipForward, X, Mic } from 'lucide-react';

const MAX_RETRIES = 2;

export default function DrillPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-text-secondary">Loading...</p></div>}>
      <DrillContent />
    </Suspense>
  );
}

function DrillContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const deck = searchParams.get('deck') || '';
  const minutes = parseInt(searchParams.get('minutes') || '5', 10);
  const totalSeconds = minutes * 60;

  const [cards, setCards] = useState<DrillCardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drillState, setDrillState] = useState<DrillState>('IDLE');
  const [elapsed, setElapsed] = useState(0);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [lastResult, setLastResult] = useState<MatchResult | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [animating, setAnimating] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [lastXP, setLastXP] = useState(0);

  const stopListenRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

  const accentColour = deck.startsWith('church-') ? '#C9922A' : '#00E5CC';
  const sttSupported = typeof window !== 'undefined' && isSupported();

  const card = cards[currentIndex] || null;

  // Load cards from sessionStorage
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    try {
      const raw = sessionStorage.getItem('current_deck');
      if (!raw) {
        router.replace('/');
        return;
      }
      const parsed = JSON.parse(raw) as DrillCardType[];
      if (parsed.length === 0) {
        router.replace('/');
        return;
      }
      setCards(parsed);
      setDrillState('SHOWING');
    } catch {
      router.replace('/');
    }
  }, [router]);

  // Timer
  useEffect(() => {
    if (drillState === 'IDLE' || drillState === 'COMPLETE') return;

    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [drillState]);

  // Check timer expiry
  useEffect(() => {
    if (elapsed >= totalSeconds && (drillState === 'RESULT' || drillState === 'NEXT' || drillState === 'SHOWING')) {
      completeSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, totalSeconds, drillState]);

  const completeSession = useCallback(() => {
    stopSpeaking();
    if (stopListenRef.current) stopListenRef.current();
    if (timerRef.current) clearInterval(timerRef.current);

    setDrillState('COMPLETE');
    sessionStorage.setItem('session_results', JSON.stringify(sessionResults));
    sessionStorage.setItem('session_deck', deck);
    router.push(`/summary?deck=${deck}`);
  }, [sessionResults, deck, router]);

  const handleExit = useCallback(() => {
    stopSpeaking();
    if (stopListenRef.current) stopListenRef.current();
    if (timerRef.current) clearInterval(timerRef.current);
    sessionStorage.removeItem('current_deck');
    sessionStorage.removeItem('session_results');
    router.push('/');
  }, [router]);

  const handleListen = useCallback(() => {
    if (drillState !== 'SHOWING' || !card) return;
    setDrillState('SPEAKING');

    speakPhrase(card.phrase, () => {
      setDrillState('SHOWING');
    });
  }, [drillState, card]);

  const handleSpeak = useCallback(() => {
    if (drillState !== 'SHOWING' || !card) return;
    stopSpeaking();
    setDrillState('LISTENING');
  }, [drillState, card]);

  // Auto-start listening when entering LISTENING state with STT
  useEffect(() => {
    if (drillState === 'LISTENING' && sttSupported && card) {
      stopListenRef.current = listenForPhrase(
        (transcript) => {
          const result = checkPhrase(transcript, card.phrase);
          setLastResult(result);
          setCurrentAttempts(prev => prev + 1);
          setDrillState('RESULT');
        },
        () => {
          setLastResult({ passed: false, score: 0, missedWords: [] });
          setCurrentAttempts(prev => prev + 1);
          setDrillState('RESULT');
        }
      );
    }

    return () => {
      if (stopListenRef.current) {
        stopListenRef.current();
        stopListenRef.current = null;
      }
    };
  }, [drillState, sttSupported, card]);

  const handleTypedSubmit = useCallback(() => {
    if (!card || !typedText.trim()) return;
    const result = checkPhrase(typedText, card.phrase);
    setLastResult(result);
    setCurrentAttempts(prev => prev + 1);
    setTypedText('');
    setDrillState('RESULT');
  }, [card, typedText]);

  const moveToNext = useCallback(() => {
    if (!card || !lastResult) return;

    const xp = calculatePhraseXP(lastResult.score, lastResult.passed, currentAttempts, card.level);
    setLastXP(xp);

    const result: SessionResult = {
      phraseId: card.id,
      passed: lastResult.passed,
      score: lastResult.score,
      attempts: currentAttempts,
      xpEarned: xp,
    };

    // Record result for this card
    setSessionResults(prev => [...prev, result]);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= cards.length || elapsed >= totalSeconds) {
      // Need to include current result in session save
      const allResults = [...sessionResults, result];
      sessionStorage.setItem('session_results', JSON.stringify(allResults));
      sessionStorage.setItem('session_deck', deck);
      setDrillState('COMPLETE');
      router.push(`/summary?deck=${deck}`);
      return;
    }

    setDrillState('NEXT');
    setAnimating(true);
    setCurrentIndex(nextIndex);
    setCurrentAttempts(0);
    setLastResult(null);

    setTimeout(() => {
      setAnimating(false);
      setDrillState('SHOWING');
    }, 300);
  }, [card, lastResult, currentAttempts, currentIndex, cards.length, elapsed, totalSeconds, sessionResults, deck, router]);

  const handleRetry = useCallback(() => {
    setLastResult(null);
    setDrillState('SHOWING');
  }, []);

  const handleSkip = useCallback(() => {
    moveToNext();
  }, [moveToNext]);

  // Auto-advance when max retries reached with low score
  useEffect(() => {
    if (drillState === 'RESULT' && lastResult && !lastResult.passed && lastResult.score < 0.35 && currentAttempts >= MAX_RETRIES) {
      const timer = setTimeout(() => moveToNext(), 1500);
      return () => clearTimeout(timer);
    }
  }, [drillState, lastResult, currentAttempts, moveToNext]);

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      {/* Progress bar */}
      <ProgressBar elapsed={elapsed} total={totalSeconds} accentColour={accentColour} />

      {/* Header: exit + card counter */}
      <div className="flex justify-between items-center mt-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="p-2 -ml-2 rounded-full bg-white/5 hover:bg-white/10"
          >
            <X size={18} className="text-text-secondary" />
          </button>
          <span className="text-text-secondary text-sm">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
        <span className="text-text-secondary text-sm">
          {Math.max(0, Math.ceil((totalSeconds - elapsed) / 60))} min left
        </span>
      </div>

      {/* Drill card */}
      <div className="flex-1 flex flex-col justify-center">
        {card && (
          <DrillCard card={card} accentColour={accentColour} animating={animating} />
        )}

        {/* Tip */}
        {card && drillState === 'RESULT' && (
          <p className="text-text-secondary text-sm mt-4 text-center italic">
            💡 {card.tip}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4 mt-6">
        {/* Listen + Speak buttons */}
        {drillState === 'SHOWING' && (
          <div className="flex gap-3">
            <button
              onClick={handleListen}
              className="flex items-center gap-2 px-5 py-3 rounded-full font-semibold transition-all border"
              style={{ borderColor: accentColour, color: accentColour }}
            >
              <Volume2 size={20} />
              Listen
            </button>
            <button
              onClick={handleSpeak}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-navy font-semibold transition-all"
              style={{ backgroundColor: accentColour }}
            >
              <Mic size={20} />
              Speak
            </button>
          </div>
        )}

        {/* Speaking indicator */}
        {drillState === 'SPEAKING' && (
          <div className="flex items-center gap-2 text-text-secondary animate-fade-in">
            <Volume2 size={20} className="animate-pulse" />
            <span>Speaking...</span>
          </div>
        )}

        {/* Mic button or textarea fallback */}
        {drillState === 'LISTENING' && (
          sttSupported ? (
            <MicButton state="listening" accentColour={accentColour} onClick={() => {}} />
          ) : (
            <div className="w-full max-w-sm flex flex-col gap-2 animate-fade-in">
              <textarea
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type what you would say..."
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-text-primary placeholder:text-text-secondary/50 resize-none"
                rows={3}
                autoFocus
              />
              <button
                onClick={handleTypedSubmit}
                disabled={!typedText.trim()}
                className="px-6 py-3 rounded-full font-semibold text-navy disabled:opacity-40"
                style={{ backgroundColor: accentColour }}
              >
                Submit
              </button>
            </div>
          )
        )}

        {/* Result */}
        {drillState === 'RESULT' && lastResult && (
          <div className="flex flex-col items-center gap-4">
            {lastXP > 0 && <XPPopup xp={lastXP} accentColour={accentColour} />}
            <ResultBadge result={lastResult} attempts={currentAttempts} maxRetries={MAX_RETRIES} />

            {/* Action buttons based on result */}
            {lastResult.passed ? (
              <button
                onClick={moveToNext}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-navy font-semibold"
                style={{ backgroundColor: accentColour }}
              >
                Next <SkipForward size={18} />
              </button>
            ) : lastResult.score >= 0.35 ? (
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="px-5 py-2.5 rounded-full border font-semibold text-sm"
                  style={{ borderColor: accentColour, color: accentColour }}
                >
                  Retry
                </button>
                <button
                  onClick={handleSkip}
                  className="px-5 py-2.5 rounded-full bg-white/10 text-text-secondary font-semibold text-sm"
                >
                  Skip
                </button>
              </div>
            ) : currentAttempts < MAX_RETRIES ? (
              <button
                onClick={handleRetry}
                className="px-5 py-2.5 rounded-full border font-semibold text-sm"
                style={{ borderColor: '#EF4444', color: '#EF4444' }}
              >
                Try Again
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
