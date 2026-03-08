'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Upload, Loader2, StopCircle, Check } from 'lucide-react';
import WaveformVisualiser from '@/components/WaveformVisualiser';
import ScoreCard from '@/components/ScoreCard';
import TranscriptView from '@/components/TranscriptView';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { countFillers } from '@/lib/analyser';
import { incrementPracticeCount } from '@/lib/userProgress';
import type { ConversationTurn, SpeechMetrics } from '@/types';

const SCENARIOS = ['Job Interview', 'Pitch', 'Storytelling', 'Open Practice'];
const MAX_TURNS = 10;
const SILENCE_TIMEOUT = 3000;

type Mode = 'live' | 'recording';
type Phase = 'select' | 'active' | 'analysing' | 'results';

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function PracticePage() {
  const [mode, setMode] = useState<Mode>('live');
  const [phase, setPhase] = useState<Phase>('select');
  const [scenario, setScenario] = useState('');
  const [metrics, setMetrics] = useState<SpeechMetrics | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  // Live mode state
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnCountRef = useRef(0);

  // Recording mode state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isRecording,
    duration,
    audioBlob,
    audioUrl,
    mimeType,
    error: recorderError,
    startRecording,
    stopRecording,
    reset: resetRecorder,
    setAudioFromFile,
  } = useAudioRecorder();

  useEffect(() => {
    if (!getSpeechRecognition()) setSpeechSupported(false);
  }, []);

  // ── Live mode helpers ──────────────────────────────────────────────

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise<void>(resolve => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google UK English Female'));
      utterance.voice = preferred || voices.find(v => v.lang.startsWith('en')) || null;
      utterance.rate = 0.95;
      utterance.onend = () => resolve();
      setIsAISpeaking(true);
      speechSynthesis.speak(utterance);
    }).then(() => setIsAISpeaking(false));
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    micStream?.getTracks().forEach(t => t.stop());
    setMicStream(null);
    setIsListening(false);
  }, [micStream]);

  const processUserTurn = useCallback(async (text: string, history: ConversationTurn[]) => {
    if (!text.trim()) return;
    const userTurn: ConversationTurn = { role: 'user', text };
    const updated = [...history, userTurn];
    setTurns(updated);
    turnCountRef.current += 1;

    if (turnCountRef.current >= MAX_TURNS) {
      buildFinalMetrics(updated);
      return;
    }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, speak]);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalTranscript += r[0].transcript;
        else interim += r[0].transcript;
      }
      setCurrentTranscript(finalTranscript + interim);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stopListening();
        processUserTurn(finalTranscript || currentTranscript, turns);
        setCurrentTranscript('');
      }, SILENCE_TIMEOUT);
    };
    recognition.onerror = () => stopListening();

    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => setMicStream(s));
    recognition.start();
    setIsListening(true);
  }, [stopListening, processUserTurn, currentTranscript, turns]);

  const buildFinalMetrics = (history: ConversationTurn[]) => {
    const userTurns = history.filter(t => t.role === 'user');
    const allText = userTurns.map(t => t.text).join(' ');
    const { fillerWords, fillerWordRate } = countFillers(allText);
    const words = allText.split(/\s+/).filter(Boolean);

    const m: SpeechMetrics = {
      wordsPerMinute: 0,
      fillerWords,
      fillerWordRate,
      pauseCount: 0,
      longestPause: 0,
      vocabularyRichness: words.length > 0 ? new Set(words.map(w => w.toLowerCase())).size / words.length : 0,
      clarityScore: 0,
      confidenceSignals: [],
      weaknessSignals: [],
      tips: [
        'Practice speaking in complete sentences',
        'Reduce filler words by pausing instead',
        'Focus on your key message before speaking',
      ],
      highlight: userTurns.length > 0 ? `You completed ${userTurns.length} turns of practice!` : '',
    };
    setMetrics(m);
    setTranscript(history.map(t => `[${t.role === 'ai' ? 'Coach' : 'You'}] ${t.text}`).join('\n\n'));
    incrementPracticeCount();
    setPhase('results');
  };

  const startLiveSession = async (s: string) => {
    setScenario(s);
    setTurns([]);
    turnCountRef.current = 0;
    setPhase('active');
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

  const endLiveSession = () => {
    stopListening();
    speechSynthesis.cancel();
    buildFinalMetrics(turns);
  };

  // ── Recording mode helpers ─────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioFromFile(file);
  };

  const handleAnalyse = async () => {
    if (!audioBlob) return;
    setPhase('analysing');
    setError('');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`);
      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!transcribeRes.ok) throw new Error((await transcribeRes.json()).error || 'Transcription failed');
      const { transcript: text, duration_seconds } = await transcribeRes.json();
      setTranscript(text);

      const analyseRes = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, scenario, mode: 'review', durationSeconds: duration_seconds }),
      });
      if (!analyseRes.ok) throw new Error((await analyseRes.json()).error || 'Analysis failed');
      const result: SpeechMetrics = await analyseRes.json();
      setMetrics(result);
      incrementPracticeCount();
      setPhase('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('active');
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────

  const reset = () => {
    resetRecorder();
    setPhase('select');
    setTurns([]);
    setMetrics(null);
    setTranscript('');
    setError('');
    setCurrentTranscript('');
    turnCountRef.current = 0;
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-6 pt-10">
      <h1 className="font-display text-3xl text-text-primary">Practice</h1>
      <p className="mt-1 text-sm text-text-secondary">Use what you&apos;ve learned</p>

      {/* Mode toggle */}
      {phase === 'select' && (
        <div className="mt-4 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setMode('live')}
            className={`flex-1 min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
              mode === 'live' ? 'bg-teal text-navy' : 'text-text-secondary'
            }`}
          >
            Live
          </button>
          <button
            onClick={() => setMode('recording')}
            className={`flex-1 min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
              mode === 'recording' ? 'bg-teal text-navy' : 'text-text-secondary'
            }`}
          >
            Recording
          </button>
        </div>
      )}

      {/* ── SCENARIO SELECT ── */}
      {phase === 'select' && (
        <div className="mt-6">
          {mode === 'live' && !speechSupported && (
            <div className="mb-4 rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm text-amber-300">
              Speech recognition not supported in this browser. Use Chrome, or switch to Recording mode.
            </div>
          )}
          <p className="text-sm text-text-secondary mb-3">Choose a scenario</p>
          <div className="grid grid-cols-2 gap-3">
            {SCENARIOS.map(s => (
              <button
                key={s}
                onClick={() => {
                  setScenario(s);
                  if (mode === 'live') startLiveSession(s);
                  else { setScenario(s); setPhase('active'); }
                }}
                disabled={mode === 'live' && !speechSupported}
                className="min-h-[56px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text-primary transition-transform active:scale-95 disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── LIVE: CONVERSATION ── */}
      {phase === 'active' && mode === 'live' && (
        <div className="mt-6 space-y-4">
          <div className="max-h-[40vh] space-y-3 overflow-y-auto">
            {turns.map((turn, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 ${
                  turn.role === 'ai' ? 'bg-teal/10 border border-teal/20' : 'bg-white/5 border border-white/10'
                }`}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: turn.role === 'ai' ? '#00E5CC' : '#94A3B8' }}>
                  {turn.role === 'ai' ? 'Coach' : 'You'}
                </p>
                <p className="text-sm text-text-primary">{turn.text}</p>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Coach is thinking...</span>
            </div>
          )}
          {isAISpeaking && <p className="text-sm text-teal">Coach is speaking...</p>}
          {currentTranscript && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-text-secondary mb-1">You (live)</p>
              <p className="text-sm text-text-primary italic">{currentTranscript}</p>
            </div>
          )}

          <WaveformVisualiser stream={micStream} isActive={isListening} />

          <div className="flex gap-3">
            {!isListening && !isAISpeaking && !isLoading ? (
              <button
                onClick={startListening}
                className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-teal text-navy font-semibold transition-transform active:scale-95"
              >
                <Mic className="h-5 w-5" /> Speak
              </button>
            ) : isListening ? (
              <button
                onClick={() => {
                  const text = currentTranscript;
                  stopListening();
                  setCurrentTranscript('');
                  processUserTurn(text, turns);
                }}
                className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber text-navy font-semibold transition-transform active:scale-95"
              >
                <Check className="h-5 w-5" /> Done
              </button>
            ) : null}
            <button
              onClick={endLiveSession}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-6 text-red-400 transition-transform active:scale-95"
            >
              <StopCircle className="h-5 w-5" /> End
            </button>
          </div>

          <p className="text-center text-xs text-text-secondary">
            Turn {Math.min(turnCountRef.current + 1, MAX_TURNS)} of {MAX_TURNS}
          </p>
        </div>
      )}

      {/* ── RECORDING: RECORD / UPLOAD ── */}
      {phase === 'active' && mode === 'recording' && (
        <div className="mt-6 space-y-6">
          <p className="text-sm text-text-secondary">
            Scenario: <span className="text-teal">{scenario}</span>
          </p>
          <div className="flex gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-teal text-navy font-semibold transition-transform active:scale-95"
              >
                <Mic className="h-5 w-5" /> Record
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-500 text-white font-semibold transition-transform active:scale-95"
              >
                Stop ({formatTime(duration)})
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-text-primary transition-transform active:scale-95"
            >
              <Upload className="h-5 w-5" /> Upload
            </button>
            <input ref={fileInputRef} type="file" accept=".mp3,.mp4,.wav,.m4a,.webm" className="hidden" onChange={handleFileUpload} />
          </div>

          {isRecording && (
            <div className="text-center text-3xl font-mono text-teal">{formatTime(duration)}</div>
          )}

          {audioUrl && !isRecording && (
            <div className="space-y-4">
              <audio src={audioUrl} controls className="w-full" />
              <button
                onClick={handleAnalyse}
                className="w-full min-h-[48px] rounded-xl bg-teal text-navy font-semibold transition-transform active:scale-95"
              >
                Analyse
              </button>
            </div>
          )}

          {(error || recorderError) && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {error || recorderError}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYSING ── */}
      {phase === 'analysing' && (
        <div className="mt-16 flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-teal" />
          <p className="text-text-secondary">Analysing your speech...</p>
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === 'results' && metrics && (
        <div className="mt-8 space-y-6">
          <ScoreCard metrics={metrics} onTryAgain={reset} />
          <TranscriptView transcript={transcript} fillerWords={metrics.fillerWords} />
        </div>
      )}
    </div>
  );
}
