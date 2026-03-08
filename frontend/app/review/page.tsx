'use client';

import { useState, useRef } from 'react';
import { Mic, Upload, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import ScoreCard from '@/components/ScoreCard';
import TranscriptView from '@/components/TranscriptView';
import { SpeechMetrics } from '@/types';

const SCENARIOS = ['Job Interview', 'Pitch', 'Storytelling', 'Open Practice'];

type Phase = 'select' | 'record' | 'analysing' | 'results';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ReviewPage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [scenario, setScenario] = useState('');
  const [metrics, setMetrics] = useState<SpeechMetrics | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
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

  const handleScenarioSelect = (s: string) => {
    setScenario(s);
    setPhase('record');
    setError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioFromFile(file);
  };

  const handleAnalyse = async () => {
    if (!audioBlob) return;
    setPhase('analysing');
    setError('');

    try {
      // Step 1: Transcribe
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`);

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeRes.ok) {
        const err = await transcribeRes.json();
        throw new Error(err.error || 'Transcription failed');
      }

      const { transcript: text, duration_seconds } = await transcribeRes.json();
      setTranscript(text);

      // Step 2: Analyse
      const analyseRes = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          scenario,
          mode: 'review',
          durationSeconds: duration_seconds,
        }),
      });

      if (!analyseRes.ok) {
        const err = await analyseRes.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const result: SpeechMetrics = await analyseRes.json();
      setMetrics(result);
      setPhase('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('record');
    }
  };

  const handleTryAgain = () => {
    resetRecorder();
    setMetrics(null);
    setTranscript('');
    setError('');
    setPhase('select');
  };

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-6 pt-8">
      <h1 className="font-display text-3xl text-text-primary">Recording Review</h1>
      <p className="mt-1 text-sm text-text-secondary">Record or upload, get detailed feedback</p>

      {/* Scenario Selection */}
      {phase === 'select' && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {SCENARIOS.map(s => (
            <button
              key={s}
              onClick={() => handleScenarioSelect(s)}
              className="min-h-[48px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text-primary transition-transform active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Recording / Upload */}
      {phase === 'record' && (
        <div className="mt-8 space-y-6">
          <p className="text-sm text-text-secondary">
            Scenario: <span className="text-teal">{scenario}</span>
          </p>

          {/* Record / Upload controls */}
          <div className="flex gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-teal text-navy font-semibold transition-transform active:scale-95"
              >
                <Mic className="h-5 w-5" />
                Record
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
              <Upload className="h-5 w-5" />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.mp4,.wav,.m4a,.webm"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Timer while recording */}
          {isRecording && (
            <div className="text-center text-3xl font-mono text-teal">
              {formatTime(duration)}
            </div>
          )}

          {/* Audio preview */}
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
              <button
                onClick={handleAnalyse}
                className="mt-2 block text-teal underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analysing */}
      {phase === 'analysing' && (
        <div className="mt-16 flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-teal" />
          <p className="text-text-secondary">Analysing your speech...</p>
        </div>
      )}

      {/* Results */}
      {phase === 'results' && metrics && (
        <div className="mt-8 space-y-6">
          <ScoreCard metrics={metrics} onTryAgain={handleTryAgain} />
          <TranscriptView transcript={transcript} fillerWords={metrics.fillerWords} />
        </div>
      )}
    </div>
  );
}
