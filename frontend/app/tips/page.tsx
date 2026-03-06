'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import TipCard from '@/components/TipCard';
import { YouTubeVideo } from '@/types';

const TOPIC_PILLS = ['Confidence', 'Interview Tips', 'Storytelling', 'Presentations', 'Vocal Tone'];

export default function TipsPage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVideos = async (query?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = query
        ? `/api/youtube?query=${encodeURIComponent(query)}`
        : '/api/youtube';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load videos');
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load videos. Check your YouTube API key.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) fetchVideos(searchQuery.trim());
  };

  const handlePill = (topic: string) => {
    setSearchQuery(topic);
    fetchVideos(topic);
  };

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-6 pt-8">
      <h1 className="font-display text-3xl text-text-primary">Tips Feed</h1>
      <p className="mt-1 text-sm text-text-secondary">Learn from the best speakers</p>

      {/* Search */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search topics..."
            className="w-full min-h-[48px] rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-text-primary placeholder:text-text-secondary focus:border-teal focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="min-h-[48px] rounded-xl bg-teal px-5 font-semibold text-navy transition-transform active:scale-95"
        >
          Search
        </button>
      </form>

      {/* Topic pills */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {TOPIC_PILLS.map(topic => (
          <button
            key={topic}
            onClick={() => handlePill(topic)}
            className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-text-primary transition-transform active:scale-95"
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      )}

      {error && (
        <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div className="mt-8 text-center text-text-secondary">
          No videos found. Try a different search.
        </div>
      )}

      {!loading && !error && videos.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {videos.map(video => (
            <TipCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
