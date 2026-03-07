"""
Fetch English transcripts for all videos in pipeline/.tmp/video_ids.json.
Output: one .txt file per video in pipeline/.tmp/raw_transcripts/
Skipped videos logged to pipeline/.tmp/skipped.json
"""
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent

def load_env():
    candidates = [ROOT / 'frontend' / '.env.local', ROOT / '.env']
    for path in candidates:
        if path.exists():
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, _, value = line.partition('=')
                        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

def main():
    load_env()

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        from youtube_transcript_api._errors import (
            NoTranscriptFound, TranscriptsDisabled, CouldNotRetrieveTranscript,
            VideoUnavailable, IpBlocked, YouTubeTranscriptApiException
        )
    except ImportError:
        print('ERROR: youtube-transcript-api not installed. Run: pip install youtube-transcript-api')
        sys.exit(1)

    tmp_dir = Path(__file__).parent.parent / '.tmp'
    video_ids_path = tmp_dir / 'video_ids.json'

    if not video_ids_path.exists():
        print(f'ERROR: {video_ids_path} not found. Run fetch_channel_videos.py first.')
        sys.exit(1)

    data = json.loads(video_ids_path.read_text())
    video_ids = data['video_ids']
    total = len(video_ids)
    print(f'Found {total} video IDs to process')

    transcripts_dir = tmp_dir / 'raw_transcripts'
    transcripts_dir.mkdir(exist_ok=True)

    # Instantiate API (v1.x style)
    api = YouTubeTranscriptApi()

    saved = 0
    skipped = []

    for i, video_id in enumerate(video_ids, 1):
        print(f'Processing video {i} of {total}: {video_id}')

        out_path = transcripts_dir / f'{video_id}.txt'
        if out_path.exists():
            print(f'  Already exists, skipping')
            saved += 1
            continue

        try:
            # Try English first (handles both manual and auto-generated)
            try:
                fetched = api.fetch(video_id, languages=['en'])
                text = ' '.join(entry.get('text', '') for entry in fetched)
            except (NoTranscriptFound, CouldNotRetrieveTranscript):
                # Fallback: list all transcripts and take the first available
                transcript_list = api.list(video_id)
                transcript = next(iter(transcript_list), None)
                if transcript is None:
                    raise NoTranscriptFound(video_id, ['en'], {})
                fetched = transcript.fetch()
                text = ' '.join(entry.get('text', '') for entry in fetched)

            out_path.write_text(text, encoding='utf-8')
            saved += 1
            print(f'  Saved ({len(text.split())} words)')

        except IpBlocked:
            print('\nERROR: Your IP has been blocked by YouTube.')
            print('Wait 1-2 hours and re-run. Already-saved transcripts will be skipped.')
            skipped_path = tmp_dir / 'skipped.json'
            skipped_path.write_text(json.dumps(skipped, indent=2))
            print(f'\nTranscripts saved so far: {saved}')
            sys.exit(1)
        except (TranscriptsDisabled, VideoUnavailable, YouTubeTranscriptApiException) as e:
            print(f'  No transcript: {type(e).__name__}')
            skipped.append({'video_id': video_id, 'reason': str(e)})
        except Exception as e:
            print(f'  Error: {e}')
            skipped.append({'video_id': video_id, 'reason': str(e)})

        time.sleep(0.5)

    # Save skipped log
    skipped_path = tmp_dir / 'skipped.json'
    skipped_path.write_text(json.dumps(skipped, indent=2))

    print(f'\nTranscripts saved: {saved}')
    print(f'Skipped (no transcript): {len(skipped)}')
    print(f'Skipped list saved to {skipped_path}')

if __name__ == '__main__':
    main()
