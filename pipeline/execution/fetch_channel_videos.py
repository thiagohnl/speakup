"""
Fetch all public video IDs from Vinh Giang's YouTube channel (@askvinh).
Output: pipeline/.tmp/video_ids.json
"""
import json
import os
import sys
import urllib.request
import urllib.parse
from pathlib import Path

# Load .env from project root (two levels up from this file)
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
    video_ids = []
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
            vid_id = item['contentDetails']['videoId']
            video_ids.append(vid_id)

        page_token = data.get('nextPageToken')
        if not page_token:
            break
        page += 1

    print(f'Total: {len(video_ids)} videos found')

    # Step 3: Save output
    out_dir = Path(__file__).parent.parent / '.tmp'
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / 'video_ids.json'
    out_path.write_text(json.dumps({
        'channel_id': channel_id,
        'channel_title': channel_title,
        'total_videos': len(video_ids),
        'video_ids': video_ids,
    }, indent=2))
    print(f'Saved to {out_path}')

if __name__ == '__main__':
    main()
