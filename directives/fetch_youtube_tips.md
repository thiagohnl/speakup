# Fetch YouTube Tips — Directive

## Objective
Return a list of relevant YouTube videos for a given topic query.

## Input
- Query string
- Optional: max_results (default 9)

## Execution Module
`frontend/lib/youtube.ts` → called from `frontend/app/api/youtube/route.ts`

## Output
Array of YouTubeVideo objects: `{ id, title, channelTitle, thumbnail, duration, viewCount }`

## Edge Cases
- API quota exceeded (10k units/day free) → serve cached results from memory
- No results → widen query automatically
- Cache results in memory with 1-hour TTL
