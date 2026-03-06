# Live Conversation — Directive

## Objective
Run a multi-turn AI conversation practice session in the browser.

## Input
- Scenario label
- Conversation history array

## Execution Module
Claude API called from `frontend/app/api/conversation/route.ts` (stateless per turn).

## Output
AI next question/response string + per-turn mini SpeechMetrics.

## Edge Cases
- Web Speech API not available (Firefox/Safari) → show fallback text input
- Silence detection fails → show manual "Done" button
- Max 10 turns per session
- SpeechSynthesis voice preference: "Google UK English Female" or first available English voice
