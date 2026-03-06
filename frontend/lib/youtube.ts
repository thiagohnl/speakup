import { YouTubeVideo } from '@/types';

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

const DEFAULT_QUERIES = [
  'public speaking tips',
  'how to speak confidently',
  'presentation skills',
  'storytelling techniques',
];

// Simple in-memory cache with 1-hour TTL
const cache = new Map<string, { data: YouTubeVideo[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function formatViewCount(count: string): string {
  const n = parseInt(count, 10);
  if (isNaN(n)) return count;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return count;
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = match[1] ? `${match[1]}:` : '';
  const m = match[2] ?? '0';
  const s = match[3]?.padStart(2, '0') ?? '00';
  return h ? `${h}${m.padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export async function searchVideos(
  query: string,
  maxResults: number = 9
): Promise<YouTubeVideo[]> {
  const cacheKey = `${query}:${maxResults}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Step 1: Search for video IDs
  const searchParams = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(maxResults),
    order: 'relevance',
    key: API_KEY!,
  });

  const searchRes = await fetch(`${BASE_URL}/search?${searchParams}`);
  if (!searchRes.ok) {
    throw new Error(`YouTube search failed: ${searchRes.status}`);
  }
  const searchData = await searchRes.json();

  const videoIds = searchData.items
    ?.map((item: { id: { videoId: string } }) => item.id.videoId)
    .filter(Boolean)
    .join(',');

  if (!videoIds) return [];

  // Step 2: Get video details (duration, view count)
  const detailsParams = new URLSearchParams({
    part: 'contentDetails,statistics',
    id: videoIds,
    key: API_KEY!,
  });

  const detailsRes = await fetch(`${BASE_URL}/videos?${detailsParams}`);
  if (!detailsRes.ok) {
    throw new Error(`YouTube details failed: ${detailsRes.status}`);
  }
  const detailsData = await detailsRes.json();

  // Build a lookup map for details
  const detailsMap = new Map<string, { duration: string; viewCount: string }>();
  for (const item of detailsData.items ?? []) {
    detailsMap.set(item.id, {
      duration: formatDuration(item.contentDetails?.duration ?? ''),
      viewCount: formatViewCount(item.statistics?.viewCount ?? '0'),
    });
  }

  // Combine search results with details
  const videos: YouTubeVideo[] = (searchData.items ?? []).map(
    (item: {
      id: { videoId: string };
      snippet: { title: string; channelTitle: string; thumbnails: { high: { url: string } } };
    }) => {
      const details = detailsMap.get(item.id.videoId);
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url ?? '',
        duration: details?.duration ?? '',
        viewCount: details?.viewCount ?? '0',
      };
    }
  );

  cache.set(cacheKey, { data: videos, timestamp: Date.now() });
  return videos;
}

export async function getDefaultFeed(): Promise<YouTubeVideo[]> {
  // Pick a random default query each time
  const query = DEFAULT_QUERIES[Math.floor(Math.random() * DEFAULT_QUERIES.length)];
  return searchVideos(query);
}
