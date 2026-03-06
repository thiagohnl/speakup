'use client';

import { YouTubeVideo } from '@/types';

interface TipCardProps {
  video: YouTubeVideo;
}

export default function TipCard({ video }: TipCardProps) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-transform active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-white/10">
        {video.thumbnail && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        )}
        {video.duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-mono text-white">
            {video.duration}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary line-clamp-2">
          {video.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
          <span>{video.channelTitle}</span>
          {video.viewCount && (
            <>
              <span>·</span>
              <span>{video.viewCount} views</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}
