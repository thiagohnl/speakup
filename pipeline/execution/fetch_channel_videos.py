"""
Fetch top 100 videos from Vinh Giang's YouTube channel (@askvinh) sorted by view count.
Output: pipeline/.tmp/video_ids.json
"""
import json
import os
import sys
import urllib.request
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
ENV_FILE = ROOT / '.env'

def load_env():
    candidates = [ROOT / 'frontend' / '.env.local', ENV_FILE]
    for path in candidates:
        if path.exists():
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, _, value = line.partition('=')
                        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

def api_get(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read())

def fetch_video_details(video_ids: list[str], api_key: str) -> list[dict]:
    """Batch fetch title + viewCount for a list of video IDs (max 50 per call)."""
    results = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i + 50]
        params = {
            'part': 'snippet,statistics',
            'id': ','.join(batch),
            'key': api_key,
        }
        url = 'https://www.googleapis.com/youtube/v3/videos?' + urllib.parse.urlencode(params)
        data = api_get(url)
        for item in data.get('items', []):
            results.append({
                'video_id': item['id'],
                'title': item['snippet']['title'],
                'published_at': item['snippet']['publishedAt'],
                'view_count': int(item['statistics'].get('viewCount', 0)),
            })
        print(f'  Fetched details for batch {i // 50 + 1} ({len(batch)} videos)...')
    return results

def main():
    load_env()
    api_key = os.environ.get('YOUTUBE_API_KEY')
    if not api_key:
        print('ERROR: YOUTUBE_API_KEY not set in .env')
        sys.exit(1)

    # Step 1: Resolve @askvinh handle to channel ID
    handle = 'askvinh'
    url = (
        f'https://www.googleapis.com/youtube/v3/channels'
        f'?part=contentDetails,snippet&forHandle={handle}&key={api_key}'
    )
    data = api_get(url)
    if not data.get('items'):
        print(f'ERROR: Channel @{handle} not found.')
        sys.exit(1)

    channel = data['items'][0]
    channel_id = channel['id']
    channel_title = channel['snippet']['title']
    uploads_playlist = channel['contentDetails']['relatedPlaylists']['uploads']
    print(f'Channel: {channel_title} ({channel_id})')
    print(f'Uploads playlist: {uploads_playlist}')

    # Step 2: Paginate through playlist to get all video IDs
    all_ids = []
    page_token = None
    page = 1

    while True:
        params = {
            'part': 'contentDetails',
            'playlistId': uploads_playlist,
            'maxResults': '50',
            'key': api_key,
        }
        if page_token:
            params['pageToken'] = page_token

        url = 'https://www.googleapis.com/youtube/v3/playlistItems?' + urllib.parse.urlencode(params)
        data = api_get(url)
        print(f'Fetched page {page}...')

        for item in data.get('items', []):
            all_ids.append(item['contentDetails']['videoId'])

        page_token = data.get('nextPageToken')
        if not page_token:
            break
        page += 1

    print(f'Total: {len(all_ids)} videos found')

    # Step 3: Fetch view counts for all videos (batched, 50 per request)
    print(f'\nFetching view counts...')
    videos = fetch_video_details(all_ids, api_key)

    # Step 4: Sort by view count, take top 100
    videos.sort(key=lambda v: v['view_count'], reverse=True)
    top_100 = videos[:100]

    # Step 5: Print top 10 for verification
    print(f'\nTop 10 videos by view count:')
    for i, v in enumerate(top_100[:10], 1):
        count = f"{v['view_count']:,}"
        title = v['title'].encode('ascii', errors='replace').decode('ascii')
        print(f"  {i:2}. {count:>12} views - {title}")

    # Step 6: Save output
    out_dir = Path(__file__).parent.parent / '.tmp'
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / 'video_ids.json'
    out_path.write_text(json.dumps({
        'channel_id': channel_id,
        'channel_title': channel_title,
        'total_videos': len(top_100),
        'video_ids': [v['video_id'] for v in top_100],
        'videos': top_100,
    }, indent=2))
    print(f'\nSaved top {len(top_100)} videos to {out_path}')

if __name__ == '__main__':
    main()
