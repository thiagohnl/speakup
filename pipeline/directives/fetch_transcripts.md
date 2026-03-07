# Directive: Fetch Transcripts

## Objective
For each video ID in `pipeline/.tmp/video_ids.json`, fetch the English transcript and save as a plain text file.

## Input
- `pipeline/.tmp/video_ids.json` (from fetch_channel_videos step)
- No API key required (youtube-transcript-api uses no auth)

## Output
- `pipeline/.tmp/raw_transcripts/{video_id}.txt` — one file per video
- `pipeline/.tmp/skipped.json` — list of videos with no available transcript

## Script
`pipeline/execution/fetch_transcripts.py`

## Steps
1. Read video IDs from `video_ids.json`
2. For each video, try transcripts in priority order:
   - Manual English transcript
   - Auto-generated English transcript
   - Any available transcript (first available)
3. Join transcript segments into a single plain-text string
4. Save to `raw_transcripts/{video_id}.txt`
5. Skip (and log) videos where no transcript is available
6. Wait 0.5s between requests to be respectful

## Edge Cases
- Already-downloaded transcripts are skipped (resume-safe — safe to re-run after interruption)
- `IpBlocked` — YouTube has blocked the IP; script stops immediately with a clear message. Wait 1-2 hours and re-run; already-saved transcripts are preserved.
- `TranscriptsDisabled` — video has no captions at all; logged to skipped.json
- Non-English channels: falls back to any available transcript
- Import error: reminds user to run `pip install youtube-transcript-api`
- API version note: v1.x requires instantiation (`YouTubeTranscriptApi()`) — class methods no longer work
