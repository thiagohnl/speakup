# Analyse Speech — Directive

## Objective
Score a speech transcript using Claude and return SpeechMetrics JSON.

## Input
- Transcript string
- Scenario label (Job Interview, Pitch, Storytelling, Open Practice)
- Mode: "live" or "review"

## Execution Module
`frontend/lib/claude.ts` → called from `frontend/app/api/analyse/route.ts`

## Output
SpeechMetrics JSON (see frontend/types/index.ts)

## Edge Cases
- Empty transcript → return error without calling Claude
- Claude returns malformed JSON → retry once with stricter JSON-only prompt
- Transcript under 10 words → flag as "too short to analyse"
