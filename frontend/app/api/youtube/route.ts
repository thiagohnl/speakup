import { NextRequest, NextResponse } from 'next/server';
import { searchVideos, getDefaultFeed } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    const videos = query
      ? await searchVideos(query)
      : await getDefaultFeed();

    return NextResponse.json(videos);
  } catch (error) {
    console.error('YouTube API error:', error);
    return NextResponse.json(
      { error: 'Could not load videos. Check your YouTube API key.' },
      { status: 500 }
    );
  }
}
