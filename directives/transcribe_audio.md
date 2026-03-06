# Transcribe Audio — Directive

## Objective
Convert audio blob to text transcript via OpenAI Whisper API.

## Input
Audio file (mp3, mp4, wav, m4a, webm), max 25MB.

## Execution Module
`frontend/lib/claude.ts` → called from `frontend/app/api/transcribe/route.ts`

## Output
JSON: `{ "transcript": "...", "duration_seconds": N }`

## Edge Cases
- File too large (>25MB) → return error to user, suggest trimming audio
- Whisper fails → retry once, then surface error with "Try again" option
- Empty audio → return error "No speech detected"
