# Analyse Prayer — Directive

## Objective
Score a prayer transcript using the prayer-specific Claude prompt and return PrayerMetrics JSON.

## Input
- Transcript string
- Scenario ID from prayerScenarios.ts

## Execution Module
`frontend/lib/claude.ts` → called from `frontend/app/api/analyse-prayer/route.ts`

## Output
PrayerMetrics JSON (see frontend/types/index.ts)

## Edge Cases
- Transcript under 30 words → return `{ "error": "too_short" }` without calling Claude
- Claude returns malformed JSON → retry once with stricter prompt
- Detect "Lord just" / "Father just" / "God just" separately as justFillerCount
