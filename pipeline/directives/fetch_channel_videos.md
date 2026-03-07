# Directive: Fetch Channel Videos

## Objective
Resolve Vinh Giang's YouTube channel handle (@askvinh) to a channel ID, then paginate through the uploads playlist to collect all public video IDs.

## Input
- `YOUTUBE_API_KEY` — from `.env` in project root

## Output
- `pipeline/.tmp/video_ids.json`
  ```json
  {
    "channel_id": "...",
    "channel_title": "Vinh Giang",
    "total_videos": N,
    "video_ids": ["id1", "id2", ...]
  }
  ```

## Script
`pipeline/execution/fetch_channel_videos.py`

## Steps
1. Load env from project root `.env` (no third-party dependency — manual parse)
2. Call `channels.list?forHandle=askvinh` to resolve handle → channel ID and uploads playlist ID
3. Paginate `playlistItems.list` using `nextPageToken` until exhausted
4. Save result to `.tmp/video_ids.json`

## Edge Cases
- If channel not found: print clear error and exit with code 1
- Uses stdlib `urllib` only — no third-party dependencies needed for this step
- Pagination: each page returns up to 50 items; loop until no `nextPageToken`
