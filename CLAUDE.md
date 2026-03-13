# Agent Instructions

You operate within a 3-layer architecture that separates responsibilities to maximise reliability.
Read STRUCTURE.md and brand-guidelines.md before any frontend work.
Read the relevant directive in directives/ before running any task.

## What this app does
SpeakUp is a speaking drill app. One core loop:
show situation → speak model phrase → user repeats → fuzzy match check → result → next card.
Sessions are 3, 5, or 10 minutes. Content from 6 pre-built JSON decks.

## Architecture Rules
- phraseMatch.ts is the ONLY place that compares spoken vs model phrase
- speechSynthesis.ts is the ONLY place that calls SpeechSynthesis
- speechRecognition.ts is the ONLY place that calls SpeechRecognition
- userProgress.ts is the ONLY place that reads/writes localStorage
- decks.ts is the ONLY place that imports deck JSON files
- No API calls during the drill session — everything runs client-side
- data/decks/*.json are read-only in the app — never write to them from frontend

## Drill Screen State Machine
IDLE → SHOWING → SPEAKING → LISTENING → RESULT → NEXT → COMPLETE
Never skip states. Handle each transition explicitly.

## Phrase Matching Rules
60% key word match = pass. 35–59% = close (offer retry). Under 35% = try again.
Max 2 retries per card, then force move to next card.

## Brand Rules
Always check brand-guidelines.md before frontend work.
Church decks (church-prayer, church-announcements) use GOLD #C9922A.
All other decks use TEAL #00E5CC.

## Self-Correction Loop
When something breaks: fix it → update the tool → test → update the directive → system is stronger.

## When in doubt
Ask before adding dependencies or changing the drill state machine.
Keep it simple. The core loop is the product.
