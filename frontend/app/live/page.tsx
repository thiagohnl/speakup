'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Loader2, StopCircle } from 'lucide-react';
import WaveformVisualiser from '@/components/WaveformVisualiser';
import ScoreCard from '@/components/ScoreCard';
import TranscriptView from '@/components/TranscriptView';
import { ConversationTurn, SpeechMetrics } from '@/types';
import { countFillers } from '@/lib/analyser';

const SCENARIOS = ['Job Interview', 'Pitch', 'Storytelling', 'Open Practice'];
const MAX_TURNS = 10;
const SILENCE_TIMEOUT = 3000;

type Phase = 'select' | 'conversation' | 'results';

// Check for SpeechRecognition support
function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

export default function LivePage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [scenario, setScenario] = useState('');
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<SpeechMetrics | null>(null);
  const [supported, setSupported] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnCountRef = useRef(0);

  useEffect(() => {
    if (!getSpeechRecognition()) setSupported(false);
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise<void>(resolve => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google UK English Female'));
      const english = voices.find(v => v.lang.startsWith('en'));
      utterance.voice = preferred || english || voices[0] || null;
      utterance.rate = 0.95;
      utterance.onend = () => resolve();
      setIsAISpeaking(true);
      speechSynthesis.speak(utterance);
    }).then(() => setIsAISpeaking(false));
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setIsListening(false);
  }, [stream]);

  const processUserTurn = useCallback(async (text: string, history: ConversationTurn[]) => {
    if (!text.trim()) return;

    const userTurn: ConversationTurn = { role: 'user', text };
    const updated = [...history, userTurn];
    setTurns(updated);
    turnCountRef.current += 1;

    // Check if max turns reached
    if (turnCountRef.current >= MAX_TURNS) {
      setPhase('results');
      return;
    }

    // Get AI response
    setIsLoading(true);
    try {
      const res = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: updated, scenario }),
      });
      const data = await res.json();

      const aiTurn: ConversationTurn = { role: 'ai', text: data.aiResponse };
      const withAI = [...updated, aiTurn];
      setTurns(withAI);
      setIsLoading(false);

      await speak(data.aiResponse);
    } catch {
      setIsLoading(false);
    }
  }, [scenario, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setCurrentTranscript(finalTranscript + interim);

      // Reset silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stopListening();
        processUserTurn(finalTranscript || currentTranscript, turns);
        setCurrentTranscript('');
      }, SILENCE_TIMEOUT);
    };

    recognition.onerror = () => {
      stopListening();
    };

    // Get mic stream for waveform
    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
      setStream(s);
    });

    recognition.start();
    setIsListening(true);
  }, [stopListening, processUserTurn, currentTranscript, turns]);

  const handleDone = useCallback(() => {
    const text = currentTranscript;
    stopListening();
    setCurrentTranscript('');
    processUserTurn(text, turns);
  }, [currentTranscript, stopListening, processUserTurn, turns]);

  const startSession = async (s: string) => {
    setScenario(s);
    setTurns([]);
    turnCountRef.current = 0;
    setPhase('conversation');
    setIsLoading(true);

    try {
      const res = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: [], scenario: s }),
      });
      const data = await res.json();

      const aiTurn: ConversationTurn = { role: 'ai', text: data.aiResponse };
      setTurns([aiTurn]);
      setIsLoading(false);

      await speak(data.aiResponse);
    } catch {
      setIsLoading(false);
    }
  };

  const endSession = () => {
    stopListening();
    speechSynthesis.cancel();
    buildFinalMetrics();
  };

  const buildFinalMetrics = () => {
    const userTurns = turns.filter(t => t.role === 'user');
    const allText = userTurns.map(t => t.text).join(' ');
    const { fillerWords, fillerWordRate } = countFillers(allText);
    const words = allText.split(/\s+/).filter(Boolean);

    const aggregated: SpeechMetrics = {
      wordsPerMinute: 0,
      fillerWords,
      fillerWordRate,
      pauseCount: 0,
      longestPause: 0,
      vocabularyRichness: words.length > 0 ? new Set(words.map(w => w.toLowerCase())).size / words.length : 0,
      clarityScore: 0,
      confidenceSignals: [],
      weaknessSignals: [],
      tips: ['Practice speaking in complete sentences', 'Reduce filler words by pausing instead', 'Focus on your key message before speaking'],
      highlight: userTurns.length > 0 ? `You completed ${userTurns.length} turns of practice!` : '',
    };

    setMetrics(aggregated);
    setPhase('results');
  };

  const handleTryAgain = () => {
    setPhase('select');
    setTurns([]);
    setMetrics(null);
    setCurrentTranscript('');
    turnCountRef.current = 0;
  };

  if (!supported) {
    return (
      <div className="animate-fade-in mx-auto max-w-lg px-6 pt-8">
        <h1 className="font-display text-3xl text-text-primary">Live Practice</h1>
        <div className="mt-8 rounded-2xl border border-amber/30 bg-amber/10 p-6">
          <p className="text-text-primary">
            Speech recognition is not supported in your browser.
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Please use Google Chrome for the live practice feature, or try the{' '}
            <a href="/review" className="text-teal underline">Recording Review</a> mode instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-6 pt-8">
      <h1 className="font-display text-3xl text-text-primary">Live Practice</h1>
      <p className="mt-1 text-sm text-text-secondary">Real-time AI conversation practice</p>

      {/* Scenario Selection */}
      {phase === 'select' && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {SCENARIOS.map(s => (
            <button
              key={s}
              onClick={() => startSession(s)}
              className="min-h-[48px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text-primary transition-transform active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Conversation */}
      {phase === 'conversation' && (
        <div className="mt-6 space-y-4">
          {/* Turn history */}
          <div className="max-h-[40vh] space-y-3 overflow-y-auto">
            {turns.map((turn, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 ${
                  turn.role === 'ai'
                    ? 'bg-teal/10 border border-teal/20'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: turn.role === 'ai' ? '#00E5CC' : '#94A3B8' }}>
                  {turn.role === 'ai' ? 'Coach' : 'You'}
                </p>
                <p className="text-sm text-text-primary">{turn.text}</p>
                {turn.metrics && (
                  <div className="mt-2 flex gap-3 text-xs text-text-secondary">
                    <span>Confidence: {turn.metrics.confidence}/10</span>
                    <span>Fillers: {turn.metrics.fillerCount}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Coach is thinking...</span>
            </div>
          )}

          {/* AI speaking indicator */}
          {isAISpeaking && (
            <p className="text-sm text-teal">Coach is speaking...</p>
          )}

          {/* Live transcript */}
          {currentTranscript && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-text-secondary mb-1">You (live)</p>
              <p className="text-sm text-text-primary italic">{currentTranscript}</p>
            </div>
          )}

          {/* Waveform */}
          <WaveformVisualiser stream={stream} isActive={isListening} />

          {/* Controls */}
          <div className="flex gap-3">
            {!isListening && !isAISpeaking && !isLoading ? (
              <button
                onClick={startListening}
                className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-teal text-navy font-semibold transition-transform active:scale-95"
              >
                <Mic className="h-5 w-5" />
                Speak
              </button>
            ) : isListening ? (
              <button
                onClick={handleDone}
                className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber text-navy font-semibold transition-transform active:scale-95"
              >
                Done
              </button>
            ) : null}
            <button
              onClick={endSession}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-6 text-red-400 transition-transform active:scale-95"
            >
              <StopCircle className="h-5 w-5" />
              End
            </button>
          </div>

          <p className="text-center text-xs text-text-secondary">
            Turn {Math.min(turnCountRef.current + 1, MAX_TURNS)} of {MAX_TURNS}
          </p>
        </div>
      )}

      {/* Results */}
      {phase === 'results' && metrics && (
        <div className="mt-8 space-y-6">
          <ScoreCard metrics={metrics} onTryAgain={handleTryAgain} />
          <TranscriptView
            transcript={turns.map(t => `[${t.role === 'ai' ? 'Coach' : 'You'}] ${t.text}`).join('\n\n')}
            fillerWords={metrics.fillerWords}
          />
        </div>
      )}
    </div>
  );
}
