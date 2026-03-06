'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, Upload, Search } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import PrayerScoreCard from '@/components/PrayerScoreCard';
import PhraseBank from '@/components/PhraseBank';
import TipCard from '@/components/TipCard';
import { PRAYER_SCENARIOS } from '@/lib/prayerScenarios';
import { PrayerMetrics, PrayerScenario, YouTubeVideo } from '@/types';

type Tab = 'scenario' | 'recording' | 'tips' | 'phrases';
type ScenarioPhase = 'select' | 'practice' | 'analysing' | 'results';
type RecordingPhase = 'select' | 'record' | 'analysing' | 'results';

const TABS: { id: Tab; label: string }[] = [
  { id: 'scenario', label: 'Scenario' },
  { id: 'recording', label: 'Recording' },
  { id: 'tips', label: 'Tips' },
  { id: 'phrases', label: 'Phrase Bank' },
];

const PRAYER_PILLS = ['Opening Prayer', 'Closing Prayer', 'Intercession', 'Announcements', 'Confidence'];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// --- Scenario Tab ---
function ScenarioTab() {
  const [phase, setPhase] = useState<ScenarioPhase>('select');
  const [scenario, setScenario] = useState<PrayerScenario | null>(null);
  const [text, setText] = useState('');
  const [metrics, setMetrics] = useState<PrayerMetrics | null>(null);
  const [error, setError] = useState('');

  const recorder = useAudioRecorder();

  const handleSubmit = async () => {
    if (!scenario) return;
    let transcript = text;

    setPhase('analysing');
    setError('');

    try {
      // If recorded, transcribe first
      if (recorder.audioBlob && !text.trim()) {
        const formData = new FormData();
        formData.append('audio', recorder.audioBlob, 'prayer.webm');
        const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Transcription failed');
        const data = await res.json();
        transcript = data.transcript;
        setText(transcript);
      }

      if (!transcript.trim()) {
        setError('Please type or record your prayer first.');
        setPhase('practice');
        return;
      }

      const res = await fetch('/api/analyse-prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, scenarioId: scenario.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const result: PrayerMetrics = await res.json();
      setMetrics(result);
      setPhase('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('practice');
    }
  };

  const handleTryAgain = () => {
    setPhase('select');
    setScenario(null);
    setText('');
    setMetrics(null);
    recorder.reset();
  };

  if (phase === 'select') {
    return (
      <div className="space-y-3">
        {PRAYER_SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => { setScenario(s); setPhase('practice'); }}
            className="w-full rounded-xl border border-gold/20 bg-gold/5 p-4 text-left transition-transform active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">{s.label}</h3>
                <p className="mt-1 text-xs text-text-secondary line-clamp-2">{s.setting}</p>
              </div>
              <span className="ml-2 whitespace-nowrap rounded-full bg-gold/20 px-2 py-1 text-xs text-gold">
                {s.duration}
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (phase === 'practice' && scenario) {
    return (
      <div className="space-y-4">
        {/* Scene setter */}
        <div className="rounded-xl border border-gold/30 bg-gold/10 p-5">
          <h3 className="font-semibold text-gold">{scenario.label}</h3>
          <p className="mt-2 text-sm text-text-primary">{scenario.setting}</p>
          <p className="mt-2 text-xs text-text-secondary">Target: {scenario.duration}</p>
        </div>

        {/* Text input */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Speak or type your prayer..."
          className="w-full min-h-[120px] rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-text-primary placeholder:text-text-secondary focus:border-gold focus:outline-none resize-none"
        />

        {/* Record button */}
        <div className="flex gap-3">
          {!recorder.isRecording ? (
            <button
              onClick={() => recorder.startRecording()}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 text-gold font-semibold transition-transform active:scale-95"
            >
              <Mic className="h-5 w-5" />
              Record
            </button>
          ) : (
            <button
              onClick={() => recorder.stopRecording()}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-500 text-white font-semibold transition-transform active:scale-95"
            >
              Stop ({formatTime(recorder.duration)})
            </button>
          )}
        </div>

        {recorder.audioUrl && !recorder.isRecording && (
          <audio src={recorder.audioUrl} controls className="w-full" />
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          className="w-full min-h-[48px] rounded-xl bg-gold text-navy font-semibold transition-transform active:scale-95"
        >
          Get Feedback
        </button>
      </div>
    );
  }

  if (phase === 'analysing') {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-gold" />
        <p className="text-text-secondary">Analysing your prayer...</p>
      </div>
    );
  }

  if (phase === 'results' && metrics) {
    return <PrayerScoreCard metrics={metrics} onTryAgain={handleTryAgain} />;
  }

  return null;
}

// --- Recording Tab ---
function RecordingTab() {
  const [phase, setPhase] = useState<RecordingPhase>('select');
  const [scenarioId, setScenarioId] = useState('open-service');
  const [metrics, setMetrics] = useState<PrayerMetrics | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorder = useAudioRecorder();

  const handleAnalyse = async () => {
    if (!recorder.audioBlob) return;
    setPhase('analysing');
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio', recorder.audioBlob, 'prayer.webm');
      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!transcribeRes.ok) throw new Error('Transcription failed');
      const { transcript } = await transcribeRes.json();

      const analyseRes = await fetch('/api/analyse-prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, scenarioId }),
      });
      if (!analyseRes.ok) {
        const data = await analyseRes.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const result: PrayerMetrics = await analyseRes.json();
      setMetrics(result);
      setPhase('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('record');
    }
  };

  const handleTryAgain = () => {
    recorder.reset();
    setMetrics(null);
    setPhase('select');
  };

  if (phase === 'select') {
    return (
      <div className="space-y-4">
        <label className="block text-sm text-text-secondary">Select scenario context:</label>
        <select
          value={scenarioId}
          onChange={e => setScenarioId(e.target.value)}
          className="w-full min-h-[48px] rounded-xl border border-white/10 bg-white/5 px-4 text-text-primary focus:border-gold focus:outline-none"
        >
          {PRAYER_SCENARIOS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={() => setPhase('record')}
          className="w-full min-h-[48px] rounded-xl bg-gold text-navy font-semibold transition-transform active:scale-95"
        >
          Continue
        </button>
      </div>
    );
  }

  if (phase === 'record') {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          {!recorder.isRecording ? (
            <button
              onClick={recorder.startRecording}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gold text-navy font-semibold transition-transform active:scale-95"
            >
              <Mic className="h-5 w-5" />
              Record
            </button>
          ) : (
            <button
              onClick={recorder.stopRecording}
              className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-500 text-white font-semibold transition-transform active:scale-95"
            >
              Stop ({formatTime(recorder.duration)})
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-text-primary transition-transform active:scale-95"
          >
            <Upload className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.mp4,.wav,.m4a,.webm"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) recorder.setAudioFromFile(f); }}
          />
        </div>

        {recorder.audioUrl && !recorder.isRecording && (
          <div className="space-y-4">
            <audio src={recorder.audioUrl} controls className="w-full" />
            <button
              onClick={handleAnalyse}
              className="w-full min-h-[48px] rounded-xl bg-gold text-navy font-semibold transition-transform active:scale-95"
            >
              Analyse
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  if (phase === 'analysing') {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-gold" />
        <p className="text-text-secondary">Analysing your prayer...</p>
      </div>
    );
  }

  if (phase === 'results' && metrics) {
    return <PrayerScoreCard metrics={metrics} onTryAgain={handleTryAgain} />;
  }

  return null;
}

// --- Tips Tab ---
function TipsTab() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVideos = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/youtube?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos('how to pray in public church');
  }, []);

  return (
    <div className="space-y-4">
      <form onSubmit={e => { e.preventDefault(); if (searchQuery.trim()) fetchVideos(searchQuery); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search prayer tips..."
            className="w-full min-h-[48px] rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-text-primary placeholder:text-text-secondary focus:border-gold focus:outline-none"
          />
        </div>
        <button type="submit" className="min-h-[48px] rounded-xl bg-gold px-5 font-semibold text-navy transition-transform active:scale-95">
          Search
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {PRAYER_PILLS.map(pill => (
          <button
            key={pill}
            onClick={() => { setSearchQuery(pill); fetchVideos(pill); }}
            className="whitespace-nowrap rounded-full border border-gold/20 bg-gold/5 px-4 py-2 text-xs font-medium text-gold transition-transform active:scale-95"
          >
            {pill}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-white/5">
              <div className="aspect-video bg-white/10" />
              <div className="space-y-2 p-3">
                <div className="h-4 rounded bg-white/10" />
                <div className="h-3 w-2/3 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {videos.map(v => <TipCard key={v.id} video={v} />)}
        </div>
      ) : (
        <p className="text-center text-text-secondary">No videos found.</p>
      )}
    </div>
  );
}

// --- Main Prayer Page ---
export default function PrayerPage() {
  const [tab, setTab] = useState<Tab>('scenario');

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-6 pt-8">
      <h1 className="font-display text-3xl text-text-primary">Prayer Mode</h1>
      <p className="mt-1 text-sm text-text-secondary">Practice speaking with confidence in church</p>

      {/* Tab bar */}
      <div className="mt-6 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-h-[40px] rounded-lg text-xs font-semibold transition-colors ${
              tab === t.id
                ? 'bg-gold text-navy'
                : 'text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6 pb-8">
        {tab === 'scenario' && <ScenarioTab />}
        {tab === 'recording' && <RecordingTab />}
        {tab === 'tips' && <TipsTab />}
        {tab === 'phrases' && <PhraseBank />}
      </div>
    </div>
  );
}
